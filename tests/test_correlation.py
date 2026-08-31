import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.normalization.schema import UnifiedEvent
from app.detection.correlation import IncidentEngine, incident_engine

client = TestClient(app)


@pytest.fixture
def auth_headers():
    username = "correlation_test_analyst"
    password = "SuperPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def clean_engine_state():
    incident_engine.clear()
    yield
    incident_engine.clear()


def test_incident_grouping_same_ip_within_window():
    engine = IncidentEngine(window_seconds=900)  # 15 mins

    base_time = datetime.datetime(2026, 8, 27, 12, 0, 0, tzinfo=datetime.timezone.utc)
    event1 = UnifiedEvent(
        timestamp=base_time.isoformat(),
        source_ip="192.168.1.50",
        event_type="auth_failure",
        raw_event_hash="hash_001",
        threat_score=40.0,
        threat_level="MEDIUM",
        mitre_tactic="Initial Access",
        original_event="Failed password for admin"
    )

    event2 = UnifiedEvent(
        timestamp=(base_time + datetime.timedelta(minutes=5)).isoformat(),
        source_ip="192.168.1.50",
        event_type="auth_failure",
        raw_event_hash="hash_002",
        threat_score=85.0,
        threat_level="HIGH",
        mitre_tactic="Credential Access",
        original_event="Failed password for root"
    )

    inc1 = engine.process_event(event1)
    inc2 = engine.process_event(event2)

    assert inc1.incident_id == inc2.incident_id
    assert inc2.event_count == 2
    assert inc2.max_threat_score == 85.0
    assert inc2.max_threat_level == "HIGH"
    assert inc2.mitre_tactics == ["Initial Access", "Credential Access"]
    assert "hash_001" in inc2.event_hashes
    assert "hash_002" in inc2.event_hashes


def test_incident_grouping_different_ip_or_outside_window():
    engine = IncidentEngine(window_seconds=900)  # 15 mins

    base_time = datetime.datetime(2026, 8, 27, 12, 0, 0, tzinfo=datetime.timezone.utc)

    # Event 1: IP A
    event1 = UnifiedEvent(
        timestamp=base_time.isoformat(),
        source_ip="10.0.0.1",
        raw_event_hash="hash_a1",
        threat_score=50.0,
        original_event="Event A1"
    )

    # Event 2: IP B (different IP)
    event2 = UnifiedEvent(
        timestamp=(base_time + datetime.timedelta(minutes=2)).isoformat(),
        source_ip="10.0.0.2",
        raw_event_hash="hash_b1",
        threat_score=60.0,
        original_event="Event B1"
    )

    # Event 3: IP A (20 minutes later -> outside 15-min window)
    event3 = UnifiedEvent(
        timestamp=(base_time + datetime.timedelta(minutes=20)).isoformat(),
        source_ip="10.0.0.1",
        raw_event_hash="hash_a2",
        threat_score=75.0,
        original_event="Event A2"
    )

    inc1 = engine.process_event(event1)
    inc2 = engine.process_event(event2)
    inc3 = engine.process_event(event3)

    assert inc1.incident_id != inc2.incident_id
    assert inc1.incident_id != inc3.incident_id
    assert inc2.incident_id != inc3.incident_id

    assert inc1.event_count == 1
    assert inc2.event_count == 1
    assert inc3.event_count == 1


def test_metric_escalation_and_kill_chain_sequence():
    engine = IncidentEngine(window_seconds=900)

    base_time = datetime.datetime(2026, 8, 27, 14, 0, 0, tzinfo=datetime.timezone.utc)

    e1 = UnifiedEvent(
        timestamp=base_time.isoformat(),
        source_ip="172.16.0.100",
        raw_event_hash="h1",
        threat_score=20.0,
        threat_level="LOW",
        mitre_tactic="Reconnaissance",
        original_event="Port probe"
    )
    e2 = UnifiedEvent(
        timestamp=(base_time + datetime.timedelta(seconds=30)).isoformat(),
        source_ip="172.16.0.100",
        raw_event_hash="h2",
        threat_score=45.0,
        threat_level="MEDIUM",
        mitre_tactic="Initial Access",
        original_event="Brute force SSH"
    )
    e3 = UnifiedEvent(
        timestamp=(base_time + datetime.timedelta(seconds=90)).isoformat(),
        source_ip="172.16.0.100",
        raw_event_hash="h3",
        threat_score=95.0,
        threat_level="HIGH",
        mitre_tactic="Execution",
        original_event="Shell execution"
    )

    engine.process_event(e1)
    engine.process_event(e2)
    inc = engine.process_event(e3)

    assert inc.event_count == 3
    assert inc.max_threat_score == 95.0
    assert inc.max_threat_level == "HIGH"
    assert inc.mitre_tactics == ["Reconnaissance", "Initial Access", "Execution"]


def test_api_incidents_endpoints_unauthorized():
    res_list = client.get("/api/v1/dashboard/incidents")
    assert res_list.status_code == 401

    res_detail = client.get("/api/v1/dashboard/incidents/inc_123456789")
    assert res_detail.status_code == 401

    res_patch = client.patch(
        "/api/v1/dashboard/incidents/inc_123456789/status",
        json={"status": "Investigating"}
    )
    assert res_patch.status_code == 401


def test_api_incidents_endpoints_success(auth_headers):
    # Populate incident_engine
    base_time = datetime.datetime.now(datetime.timezone.utc)
    e1 = UnifiedEvent(
        timestamp=base_time.isoformat(),
        source_ip="198.51.100.10",
        raw_event_hash="api_h1",
        threat_score=90.0,
        threat_level="HIGH",
        mitre_tactic="Initial Access",
        original_event="SSH attack",
        owner_username="correlation_test_analyst",
    )
    e2 = UnifiedEvent(
        timestamp=(base_time + datetime.timedelta(minutes=2)).isoformat(),
        source_ip="198.51.100.10",
        raw_event_hash="api_h2",
        threat_score=40.0,
        threat_level="MEDIUM",
        mitre_tactic="Persistence",
        original_event="Cron job added",
        owner_username="correlation_test_analyst",
    )

    inc = incident_engine.process_event(e1)
    incident_engine.process_event(e2)

    # 1. Test GET /api/v1/dashboard/incidents
    res_list = client.get("/api/v1/dashboard/incidents", headers=auth_headers)
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert "incidents" in data_list
    assert data_list["count"] >= 1
    assert data_list["incidents"][0]["incident_id"] == inc.incident_id
    assert data_list["incidents"][0]["max_threat_score"] == 90.0

    # 2. Test GET /api/v1/dashboard/incidents/{incident_id}
    res_detail = client.get(
        f"/api/v1/dashboard/incidents/{inc.incident_id}",
        headers=auth_headers
    )
    assert res_detail.status_code == 200
    data_detail = res_detail.json()
    assert "incident" in data_detail
    assert data_detail["incident"]["incident_id"] == inc.incident_id
    assert "events" in data_detail

    # 3. Test PATCH /api/v1/dashboard/incidents/{incident_id}/status (Valid)
    res_patch = client.patch(
        f"/api/v1/dashboard/incidents/{inc.incident_id}/status",
        headers=auth_headers,
        json={"status": "Investigating"}
    )
    assert res_patch.status_code == 200
    data_patch = res_patch.json()
    assert data_patch["status"] == "success"
    assert data_patch["updated_status"] == "Investigating"
    assert data_patch["incident"]["status"] == "Investigating"

    # 4. Test PATCH with invalid status value
    res_invalid = client.patch(
        f"/api/v1/dashboard/incidents/{inc.incident_id}/status",
        headers=auth_headers,
        json={"status": "InvalidStatusChoice"}
    )
    assert res_invalid.status_code == 400

    # 5. Test GET for non-existent incident ID
    res_404 = client.get(
        "/api/v1/dashboard/incidents/inc_nonexistent_999",
        headers=auth_headers
    )
    assert res_404.status_code == 404
