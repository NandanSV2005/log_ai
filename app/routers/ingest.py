import uuid
import datetime
from typing import Optional
from fastapi import APIRouter, Request, Query, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel, Field

from app.config import settings
from app.storage.raw_writer import raw_storage_manager
from app.storage.normalized_writer import normalized_storage_manager
from app.parsers.base import detect_log_format
from app.parsers.dynamic_parser import DynamicParser
from app.detection.anomaly_engine import anomaly_engine
from app.detection.correlation import incident_engine
from app.xai.explainer import xai_explainer
from app.services.queue import queue_manager, IngestionTask
from app.audit.hash_chain import audit_merkle_tree
from app.routers.auth import get_current_user

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/v1", tags=["Log Ingestion"])

class IngestResponse(BaseModel):
    ingestion_id: str = Field(..., description="Unique forensic identifier for the ingestion request")
    status: str = Field("accepted", description="Ingestion processing status")
    timestamp: str = Field(..., description="UTC ISO-8601 ingestion timestamp")
    format_detected: str = Field(..., description="Detected or specified log format")
    bytes_received: int = Field(..., description="Size of raw log payload in bytes")
    payload_hash: str = Field(..., description="SHA-256 hash of incoming raw payload")
    merkle_root: str = Field(..., description="Current cryptographic Merkle tree root hash")
    raw_storage_file: str = Field(..., description="Path to persisted raw compressed payload file")

class FileIngestResponse(BaseModel):
    ingestion_id: str = Field(..., description="Unique forensic identifier for the ingestion request")
    status: str = Field("success", description="File ingestion processing status")
    filename: str = Field(..., description="Name of the uploaded file")
    events_processed: int = Field(..., description="Number of log events parsed and normalized")
    bytes_received: int = Field(..., description="Size of uploaded file in bytes")
    payload_hash: str = Field(..., description="SHA-256 hash of uploaded file payload")
    merkle_root: str = Field(..., description="Current cryptographic Merkle tree root hash")
    timestamp: str = Field(..., description="UTC ISO-8601 timestamp")

@router.post(
    "/ingest",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=IngestResponse,
    summary="Ingest raw log data",
    description=(
        "High-performance log ingestion endpoint. Accepts raw log payloads in JSON, Syslog, "
        "CSV, or Plain Text formats. Raw data is immediately persisted to local storage for "
        "zero-loss forensics, and dispatched to an async background parsing queue."
    ),
)
@limiter.limit("5/second")
async def ingest_logs(
    request: Request,
    format: Optional[str] = Query(
        None,
        description="Explicit format override (json, syslog, csv, text)",
    ),
    current_user=Depends(get_current_user),
):

    # 1. Extract raw request body
    raw_body = await request.body()
    if not raw_body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty log payload",
        )

    if len(raw_body) > settings.MAX_PAYLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Payload exceeds maximum allowed size of {settings.MAX_PAYLOAD_BYTES} bytes",
        )

    content_type = request.headers.get("content-type", "")
    client_host = request.client.host if request.client else "unknown"

    raw_str = raw_body.decode("utf-8", errors="replace")

    # 2. Detect log format
    detected_format = detect_log_format(
        raw_payload=raw_str,
        content_type=content_type,
        param_format=format,
    )

    # 3. Generate unique forensic tracking ID
    ingestion_id = uuid.uuid4().hex
    now = datetime.datetime.now(datetime.timezone.utc)

    # 4. Immediately persist raw payload to disk before any parsing (Zero Information Loss)
    raw_file_path = await raw_storage_manager.write_raw_payload(
        ingestion_id=ingestion_id,
        raw_data=raw_body,
        content_type=content_type,
        detected_format=detected_format,
        client_host=client_host,
    )

    # Get calculated SHA-256 payload hash and Merkle root
    payload_hash = audit_merkle_tree.hash_payload(raw_body)
    merkle_root = audit_merkle_tree.get_root_hash()

    # 5. Enqueue for asynchronous background parsing (Instant 202 response)
    task = IngestionTask(
        ingestion_id=ingestion_id,
        raw_payload=raw_str,
        detected_format=detected_format,
        raw_file_path=str(raw_file_path),
    )
    await queue_manager.enqueue_task(task)

    return IngestResponse(
        ingestion_id=ingestion_id,
        status="accepted",
        timestamp=now.isoformat(),
        format_detected=detected_format,
        bytes_received=len(raw_body),
        payload_hash=payload_hash,
        merkle_root=merkle_root,
        raw_storage_file=raw_file_path.name,
    )

@router.post(
    "/ingest/file",
    status_code=status.HTTP_200_OK,
    response_model=FileIngestResponse,
    summary="Ingest manual log file upload",
    description=(
        "Accepts a manual log file upload (.txt, .log), reads each line as a raw log event, "
        "and processes all events through the AI anomaly detection and OCSF normalization pipeline."
    ),
)
async def ingest_log_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file upload",
        )

    raw_str = contents.decode("utf-8", errors="replace")
    ingestion_id = uuid.uuid4().hex
    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. Write raw payload to storage for zero-loss forensics
    raw_file_path = await raw_storage_manager.write_raw_payload(
        ingestion_id=ingestion_id,
        raw_data=contents,
        content_type=file.content_type or "text/plain",
        detected_format="text",
        client_host="file_upload",
    )

    payload_hash = audit_merkle_tree.hash_payload(contents)
    merkle_root = audit_merkle_tree.get_root_hash()

    # 2. Process file line by line through Dynamic Parser, Anomaly Engine, XAI & Normalized Storage
    dynamic_parser = DynamicParser()
    unified_events = dynamic_parser.parse(raw_str)

    enriched_events = anomaly_engine.evaluate_events(unified_events)
    for event in enriched_events:
        event.xai_explanation = xai_explainer.generate_explanation(event)
        incident_engine.process_event(event)

    await normalized_storage_manager.write_normalized_events(
        ingestion_id=ingestion_id,
        events=enriched_events,
    )

    return FileIngestResponse(
        ingestion_id=ingestion_id,
        status="success",
        filename=file.filename or "uploaded.log",
        events_processed=len(enriched_events),
        bytes_received=len(contents),
        payload_hash=payload_hash,
        merkle_root=merkle_root,
        timestamp=now.isoformat(),
    )

