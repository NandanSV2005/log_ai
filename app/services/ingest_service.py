import uuid
import datetime
from typing import Optional, Dict, Any

from app.config import settings
from app.storage.raw_writer import raw_storage_manager
from app.parsers.base import detect_log_format
from app.audit.hash_chain import audit_merkle_tree
from app.services.queue import queue_manager, IngestionTask

async def process_raw_ingestion(
    raw_payload_bytes: bytes,
    owner_username: str,
    client_host: str = "unknown",
    content_type: str = "text/plain",
    format_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Unified ingestion pipeline function shared by HTTP POST /api/v1/ingest and live Syslog Receiver.

    Pipeline Steps:
    1. Decode raw bytes and detect log format (Syslog, JSON, CSV, text, or override).
    2. Generate unique ingestion forensic UUID.
    3. Persist raw compressed payload to disk for forensic zero-loss audit guarantees.
    4. Compute SHA-256 payload hash and update cryptographic Merkle audit tree.
    5. Construct IngestionTask carrying tenant owner_username for isolation.
    6. Dispatch task to queue_manager async worker pool.
    """
    raw_str = raw_payload_bytes.decode("utf-8", errors="replace")

    detected_format = detect_log_format(
        raw_payload=raw_str,
        content_type=content_type,
        param_format=format_override,
    )

    ingestion_id = uuid.uuid4().hex
    now = datetime.datetime.now(datetime.timezone.utc)

    raw_file_path = await raw_storage_manager.write_raw_payload(
        ingestion_id=ingestion_id,
        raw_data=raw_payload_bytes,
        content_type=content_type,
        detected_format=detected_format,
        client_host=client_host,
    )

    payload_hash = audit_merkle_tree.hash_payload(raw_payload_bytes)
    merkle_root = audit_merkle_tree.get_root_hash()

    task = IngestionTask(
        ingestion_id=ingestion_id,
        raw_payload=raw_str,
        detected_format=detected_format,
        raw_file_path=str(raw_file_path),
        owner_username=owner_username,
    )
    await queue_manager.enqueue_task(task)

    return {
        "ingestion_id": ingestion_id,
        "status": "accepted",
        "timestamp": now.isoformat(),
        "format_detected": detected_format,
        "bytes_received": len(raw_payload_bytes),
        "payload_hash": payload_hash,
        "merkle_root": merkle_root,
        "raw_storage_file": raw_file_path.name,
        "raw_file_path": str(raw_file_path),
    }
