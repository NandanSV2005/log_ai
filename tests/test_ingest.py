import pytest
import json
import gzip
from pathlib import Path
from httpx import AsyncClient

from app.storage.raw_writer import raw_storage_manager

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_ingest_json_logs(client: AsyncClient, temp_storage_dir: Path, auth_headers: dict):
    json_payload = [
        {"timestamp": "2026-08-25T19:00:00Z", "level": "INFO", "message": "User logged in", "user_id": 42},
        {"timestamp": "2026-08-25T19:00:01Z", "level": "WARN", "message": "High memory usage", "usage_pct": 88.5},
    ]
    raw_bytes = json.dumps(json_payload).encode("utf-8")

    headers = {"Content-Type": "application/json", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=raw_bytes,
        headers=headers,
    )
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert data["format_detected"] == "json"
    assert data["bytes_received"] == len(raw_bytes)
    assert "ingestion_id" in data
    assert "payload_hash" in data
    assert "merkle_root" in data
    assert len(data["payload_hash"]) == 64
    assert len(data["merkle_root"]) == 64

    # Verify raw payload file creation and contents
    stored_files = list(raw_storage_manager.storage_dir.glob("raw_*.jsonl.gz"))
    assert len(stored_files) == 1
    
    # Read compressed raw file
    forensic_record = await raw_storage_manager.read_raw_payload(stored_files[0])
    assert forensic_record["ingestion_id"] == data["ingestion_id"]
    assert forensic_record["detected_format"] == "json"
    assert forensic_record["payload_hash"] == data["payload_hash"]
    assert forensic_record["merkle_root"] == data["merkle_root"]
    assert json.loads(forensic_record["raw_payload"]) == json_payload

@pytest.mark.asyncio
async def test_ingest_syslog_logs(client: AsyncClient, temp_storage_dir: Path, auth_headers: dict):
    syslog_payload = (
        "<165>1 2026-08-25T19:00:00.000Z myhost app1 1234 ID47 - Application started\n"
        "<13>1 2026-08-25T19:00:01.123Z authhost sshd 5678 - - Failed password for invalid user root"
    )

    headers = {"Content-Type": "text/plain", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=syslog_payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert data["format_detected"] == "syslog"

    stored_files = list(raw_storage_manager.storage_dir.glob("raw_*.jsonl.gz"))
    assert len(stored_files) == 1
    forensic_record = await raw_storage_manager.read_raw_payload(stored_files[0])
    assert forensic_record["raw_payload"] == syslog_payload

@pytest.mark.asyncio
async def test_ingest_csv_logs(client: AsyncClient, temp_storage_dir: Path, auth_headers: dict):
    csv_payload = (
        "timestamp,level,service,message\n"
        "2026-08-25T19:00:00Z,INFO,payment,Payment processed successfully\n"
        "2026-08-25T19:00:05Z,ERROR,database,Connection timeout\n"
    )

    headers = {"Content-Type": "text/csv", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=csv_payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert data["format_detected"] == "csv"

@pytest.mark.asyncio
async def test_ingest_plain_text_logs(client: AsyncClient, temp_storage_dir: Path, auth_headers: dict):
    text_payload = (
        "2026-08-25 19:00:00 [INFO] System initialized\n"
        "2026-08-25 19:00:02 [DEBUG] Fetching configuration parameters\n"
    )

    headers = {"Content-Type": "text/plain", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=text_payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert data["format_detected"] == "text"

@pytest.mark.asyncio
async def test_ingest_explicit_format_override(client: AsyncClient, temp_storage_dir: Path, auth_headers: dict):
    payload = "custom raw log line"
    response = await client.post(
        "/api/v1/ingest?format=syslog",
        content=payload.encode("utf-8"),
        headers=auth_headers,
    )
    assert response.status_code == 202
    data = response.json()
    assert data["format_detected"] == "syslog"

@pytest.mark.asyncio
async def test_ingest_empty_payload(client: AsyncClient, auth_headers: dict):
    response = await client.post("/api/v1/ingest", content=b"", headers=auth_headers)
    assert response.status_code == 400
    assert "Empty log payload" in response.json()["detail"]

@pytest.mark.asyncio
async def test_metrics_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/metrics")
    assert response.status_code == 200
    assert "queue_stats" in response.json()

@pytest.mark.asyncio
async def test_ingest_rate_limit_exceeded(client: AsyncClient, auth_headers: dict):
    from app.routers.ingest import limiter
    limiter.reset()
    payload = "Log event for rate limit testing"
    responses = []
    headers = {"Content-Type": "text/plain", **auth_headers}
    for _ in range(7):
        res = await client.post(
            "/api/v1/ingest",
            content=payload.encode("utf-8"),
            headers=headers,
        )
        responses.append(res)

    status_codes = [r.status_code for r in responses]
    assert 202 in status_codes
    assert 429 in status_codes
    limiter.reset()
