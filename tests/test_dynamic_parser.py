import asyncio
import pytest
from pathlib import Path
from httpx import AsyncClient

from app.parsers.dynamic_parser import DynamicParser
from app.normalization.schema import UnifiedEvent
from app.storage.normalized_writer import normalized_storage_manager

def test_dynamic_parser_rfc5424_syslog():
    parser = DynamicParser()
    raw_syslog = "<165>1 2026-08-25T19:00:00.000Z 192.168.1.50 auth_service 1234 ID47 - User authentication succeeded"
    
    events = parser.parse(raw_syslog)
    assert len(events) == 1
    
    event = events[0]
    assert isinstance(event, UnifiedEvent)
    assert event.timestamp == "2026-08-25T19:00:00.000Z"
    assert event.source_ip == "192.168.1.50"
    assert event.event_type == "auth_service"
    assert event.severity in ("Informational", "Notice")
    assert event.original_event == raw_syslog

def test_dynamic_parser_cef_format():
    parser = DynamicParser()
    cef_raw = (
        "CEF:0|SecurityCorp|Firewall|1.0|100|Connection Denied|HIGH|"
        "src=192.168.1.100 dst=10.0.0.50 sPort=12345 dPort=80 rt=2026-08-25T19:25:00Z"
    )

    events = parser.parse(cef_raw)
    assert len(events) == 1

    event = events[0]
    assert isinstance(event, UnifiedEvent)
    assert event.source_ip == "192.168.1.100"
    assert event.destination_ip == "10.0.0.50"
    assert event.severity in ("Critical", "Error", "Warning", "HIGH")
    assert event.original_event == cef_raw

def test_dynamic_parser_unstructured_proprietary_log():
    parser = DynamicParser()
    unstructured_raw = (
        "2026-08-25 19:25:00.123 [WARN] Database cluster node 10.0.1.15 lost connection "
        "to primary master 10.0.1.1 service=db_cluster action=failover"
    )

    events = parser.parse(unstructured_raw)
    assert len(events) == 1

    event = events[0]
    assert isinstance(event, UnifiedEvent)
    assert event.source_ip == "10.0.1.15"
    assert event.destination_ip == "10.0.1.1"
    assert event.severity == "Warning"
    assert event.event_type == "db_cluster"
    assert event.original_event == unstructured_raw

def test_dynamic_parser_multiple_unstructured_lines():
    parser = DynamicParser()
    multi_line = (
        "2026-08-25T19:25:00Z [CRIT] Out of memory on 192.168.1.200\n"
        "2026-08-25T19:25:01Z [INFO] Service restarted src=192.168.1.200 dst=192.168.1.1"
    )

    events = parser.parse(multi_line)
    assert len(events) == 2

    assert events[0].severity == "Critical"
    assert events[0].source_ip == "192.168.1.200"

    assert events[1].severity == "Informational"
    assert events[1].source_ip == "192.168.1.200"
    assert events[1].destination_ip == "192.168.1.1"

@pytest.mark.asyncio
async def test_end_to_end_normalized_storage(client: AsyncClient):
    payload = "2026-08-25 19:25:00 [ERROR] Authentication failed for user admin from 192.168.1.88"
    
    response = await client.post(
        "/api/v1/ingest",
        content=payload.encode("utf-8"),
        headers={"Content-Type": "text/plain"},
    )
    assert response.status_code == 202
    data = response.json()
    ingestion_id = data["ingestion_id"]

    norm_files = []
    for _ in range(30):
        norm_files = list(normalized_storage_manager.storage_dir.glob("normalized_*.jsonl"))
        if norm_files:
            break
        await asyncio.sleep(0.05)

    assert len(norm_files) >= 1

    events = await normalized_storage_manager.read_normalized_events(norm_files[0])
    assert len(events) >= 1
    assert events[0]["original_event"] == payload
    assert events[0]["source_ip"] == "192.168.1.88"
    assert events[0]["severity"] == "Error"
