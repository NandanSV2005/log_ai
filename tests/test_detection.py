import asyncio
import pytest
from httpx import AsyncClient

from app.detection.anomaly_engine import AnomalyEngine
from app.normalization.schema import UnifiedEvent
from app.storage.normalized_writer import normalized_storage_manager

def test_benign_event_scoring():
    engine = AnomalyEngine()
    benign_event = UnifiedEvent(
        timestamp="2026-08-25T19:30:00Z",
        source_ip="192.168.1.10",
        destination_ip="10.0.0.1",
        event_type="http_access",
        severity="Informational",
        original_event="GET /index.html 200",
    )

    evaluated = engine.evaluate_event(benign_event)
    assert evaluated.threat_score < 35.0
    assert evaluated.threat_level == "LOW"
    assert evaluated.anomaly_flags == []

def test_repeated_deny_anomalous_event_scoring():
    engine = AnomalyEngine()
    attacker_ip = "198.51.100.99"

    events = [
        UnifiedEvent(
            timestamp=f"2026-08-25T19:30:0{i}Z",
            source_ip=attacker_ip,
            destination_ip="10.0.0.1",
            event_type="cisco_asa:deny:outside_acl",
            severity="Warning",
            original_event=f"%ASA-4-106023: Deny tcp src outside:{attacker_ip}/54321 dst inside:10.0.0.1/80",
        )
        for i in range(4)
    ]

    evaluated_events = engine.evaluate_events(events)
    last_event = evaluated_events[-1]

    assert last_event.threat_score >= 70.0
    assert last_event.threat_level == "HIGH"
    assert "repeated_deny" in last_event.anomaly_flags
    assert "external_source" in last_event.anomaly_flags

def test_suricata_alert_scoring():
    engine = AnomalyEngine()
    suricata_event = UnifiedEvent(
        timestamp="2026-08-25T19:30:00Z",
        source_ip="198.51.100.5",
        destination_ip="10.0.0.5",
        event_type="suricata:ET MALWARE Compromised Host Activity",
        severity="Critical",
        original_event='{"event_type":"alert","alert":{"severity":1}}',
    )

    evaluated = engine.evaluate_event(suricata_event)
    assert evaluated.threat_score >= 70.0
    assert evaluated.threat_level == "HIGH"
    assert "suricata_alert" in evaluated.anomaly_flags

@pytest.mark.asyncio
async def test_end_to_end_threat_scoring_pipeline(client: AsyncClient, auth_headers: dict):
    payload = (
        "%ASA-4-106023: Deny tcp src outside:198.51.100.88/12345 dst inside:10.0.0.1/80\n"
        "%ASA-4-106023: Deny tcp src outside:198.51.100.88/12346 dst inside:10.0.0.1/80\n"
        "%ASA-4-106023: Deny tcp src outside:198.51.100.88/12347 dst inside:10.0.0.1/80\n"
    )

    headers = {"Content-Type": "text/plain", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202


    norm_files = []
    for _ in range(20):
        norm_files = list(normalized_storage_manager.storage_dir.glob("normalized_*.jsonl"))
        if norm_files:
            break
        await asyncio.sleep(0.05)
    assert len(norm_files) >= 1

    events = await normalized_storage_manager.read_normalized_events(norm_files[0])
    assert len(events) == 3

    last = events[-1]
    assert "threat_score" in last
    assert "threat_level" in last
    assert "anomaly_flags" in last
    assert last["threat_score"] >= 65.0
    assert last["threat_level"] in ["MEDIUM", "HIGH"]
    assert "repeated_deny" in last["anomaly_flags"]
