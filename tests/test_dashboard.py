import asyncio
import pytest
from httpx import AsyncClient

from app.xai.explainer import XAIExplainer
from app.normalization.schema import UnifiedEvent
from app.storage.normalized_writer import normalized_storage_manager

def test_xai_explainer_benign_event():
    explainer = XAIExplainer()
    event = UnifiedEvent(
        timestamp="2026-08-25T19:50:00Z",
        source_ip="192.168.1.10",
        destination_ip="10.0.0.1",
        event_type="http_access",
        severity="Informational",
        threat_score=15.0,
        threat_level="LOW",
        anomaly_flags=[],
        original_event="GET /api/v1/health 200",
    )

    explanation = explainer.generate_explanation(event)
    assert "Normal event activity" in explanation
    assert "LOW threat level" in explanation
    assert "No security anomalies detected" in explanation

def test_xai_explainer_anomalous_event():
    explainer = XAIExplainer()
    event = UnifiedEvent(
        timestamp="2026-08-25T19:50:00Z",
        source_ip="198.51.100.99",
        destination_ip="10.0.0.1",
        event_type="cisco_asa:deny",
        severity="Warning",
        threat_score=85.0,
        threat_level="HIGH",
        anomaly_flags=["repeated_deny", "external_source"],
        original_event="%ASA-4-106023: Deny tcp src outside:198.51.100.99/54321 dst inside:10.0.0.1/80",
    )

    explanation = explainer.generate_explanation(event)
    assert "High threat (Score: 85.0) detected" in explanation
    assert "rapid repeated denial of service" in explanation
    assert "external public IP source" in explanation
    assert "198.51.100.99" in explanation

@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient):
    # Test Register
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"username": "newanalyst", "password": "SuperPassword123!"},
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["username"] == "newanalyst"

    # Test Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"username": "newanalyst", "password": "SuperPassword123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_dashboard_recent_events_endpoint(client: AsyncClient, auth_headers: dict):
    payload = (
        "%ASA-4-106023: Deny tcp src outside:198.51.100.44/12345 dst inside:10.0.0.1/80\n"
        "<134>1 2026-08-25T19:50:00Z webserver nginx 1234 - - User logged in from 192.168.1.50\n"
    )

    headers = {"Content-Type": "text/plain", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202

    # Poll until normalized files are written
    for _ in range(20):
        if list(normalized_storage_manager.storage_dir.glob("normalized_*.jsonl")):
            break
        await asyncio.sleep(0.05)

    res = await client.get("/api/v1/dashboard/events/recent?limit=10", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert "count" in data
    assert "events" in data
    assert len(data["events"]) >= 2

    first_event = data["events"][0]
    assert "xai_explanation" in first_event
    assert "raw_event_hash" in first_event
    assert "remediation_steps" in first_event
    assert isinstance(first_event["remediation_steps"], list)
    assert len(first_event["xai_explanation"]) > 0

@pytest.mark.asyncio
async def test_dashboard_stats_endpoint(client: AsyncClient, auth_headers: dict):
    payload = (
        "devname=FG100D action=deny srcip=198.51.100.55 dstip=10.0.0.5 policyid=10\n"
        '{"event_type":"alert","src_ip":"198.51.100.66","dest_ip":"10.0.0.6","alert":{"signature":"ET MALWARE","severity":1}}\n'
    )

    headers = {"Content-Type": "text/plain", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202

    # Poll until normalized files are written
    for _ in range(20):
        if list(normalized_storage_manager.storage_dir.glob("normalized_*.jsonl")):
            break
        await asyncio.sleep(0.05)

    res = await client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert res.status_code == 200
    stats = res.json()

    assert "total_events_ingested" in stats
    assert "threat_level_counts" in stats
    assert "vendor_parser_counts" in stats
    assert stats["total_events_ingested"] >= 2
    assert "HIGH" in stats["threat_level_counts"]
    assert "LOW" in stats["threat_level_counts"]

@pytest.mark.asyncio
async def test_frontend_pages_and_security_headers(client: AsyncClient):
    res = await client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers.get("content-type", "").lower()
    assert "LOG AI" in res.text

    login_res = await client.get("/login")
    assert login_res.status_code == 200

    dash_res = await client.get("/dashboard")
    assert dash_res.status_code == 200

    # Assert Security Headers
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("x-xss-protection") == "1; mode=block"
    assert "max-age=31536000" in res.headers.get("strict-transport-security", "")
    assert "default-src 'self'" in res.headers.get("content-security-policy", "")

@pytest.mark.asyncio
async def test_dashboard_csv_export_endpoint(client: AsyncClient, auth_headers: dict):
    payload = "%ASA-4-106023: Deny tcp src outside:198.51.100.99/54321 dst inside:10.0.0.1/80\n"
    headers = {"Content-Type": "text/plain", **auth_headers}
    response = await client.post(
        "/api/v1/ingest",
        content=payload.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 202

    # Poll until normalized files are written
    for _ in range(20):
        if list(normalized_storage_manager.storage_dir.glob("normalized_*.jsonl")):
            break
        await asyncio.sleep(0.05)

    res = await client.get("/api/v1/dashboard/export/csv", headers=auth_headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers.get("content-type", "").lower()
    assert "threat_report.csv" in res.headers.get("content-disposition", "")
    assert "Timestamp,Source_IP,Threat_Level,Threat_Score,MITRE_Tactic" in res.text

@pytest.mark.asyncio
async def test_update_event_status_success(client: AsyncClient, auth_headers: dict):
    payload = "<134>1 2026-08-26T12:00:00Z auth-server sshd 5000 - - Failed password for root from 198.51.100.99 port 54320 ssh2\n"
    headers = {"Content-Type": "text/plain", **auth_headers}
    ingest_res = await client.post("/api/v1/ingest", content=payload.encode("utf-8"), headers=headers)
    assert ingest_res.status_code == 202

    for _ in range(20):
        if list(normalized_storage_manager.storage_dir.glob("normalized_*.jsonl")):
            break
        await asyncio.sleep(0.05)

    recent_res = await client.get("/api/v1/dashboard/events/recent?limit=5", headers=auth_headers)
    assert recent_res.status_code == 200
    events = recent_res.json().get("events", [])
    assert len(events) > 0

    target_event = events[0]
    event_id = target_event.get("raw_event_hash") or target_event.get("payload_hash")
    assert event_id is not None

    # Test PATCH status to Investigating
    patch_res = await client.patch(
        f"/api/v1/dashboard/event/{event_id}/status",
        json={"status": "Investigating"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["updated_status"] == "Investigating"

    # Test PATCH status to Resolved
    patch_res_2 = await client.patch(
        f"/api/v1/dashboard/event/{event_id}/status",
        json={"status": "Resolved"},
        headers=auth_headers,
    )
    assert patch_res_2.status_code == 200
    assert patch_res_2.json()["updated_status"] == "Resolved"

@pytest.mark.asyncio
async def test_update_event_status_invalid_status(client: AsyncClient, auth_headers: dict):
    res = await client.patch(
        "/api/v1/dashboard/event/some_hash/status",
        json={"status": "InvalidStatusChoice"},
        headers=auth_headers,
    )
    assert res.status_code == 400
    assert "Invalid status" in res.json()["detail"]

@pytest.mark.asyncio
async def test_update_event_status_not_found(client: AsyncClient, auth_headers: dict):
    res = await client.patch(
        "/api/v1/dashboard/event/non_existent_hash_99999999/status",
        json={"status": "Resolved"},
        headers=auth_headers,
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"]

