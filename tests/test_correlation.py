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


# =============================================================================
# PHASE 2 WEEK 6 — CORRELATION V2 UPGRADE TESTS
# =============================================================================

EIGHT_LINE_TEST_PAYLOAD = [
    'Aug 28 2026 09:15:03: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51422 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:15:11: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51423 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:15:19: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51424 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:15:27: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51425 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:16:02: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51430 dst inside:10.0.0.15/3389 by access-group "outside_acl" [RDP Brute Force]',
    'Aug 28 2026 09:16:14: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51431 dst inside:10.0.0.15/3389 by access-group "outside_acl" [RDP Brute Force]',
    'Aug 28 2026 09:17:40: %ASA-6-302013: Built inbound TCP connection for outside:203.0.113.45/51500 to inside:10.0.0.10/22 [Auth Success After Spray]',
    'Aug 26 14:06:10 server-main sudo[10305]: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /var/log/auth.log',
]


def test_standard_8_line_sample_produces_single_source_incident():
    """
    (a) Verifies the standard 8-line sample produces the same single-source incident as before,
    with no fan-in incident triggered, while grouping repeated connection tuples into activities.
    """
    from app.parsers.vendor_parsers import CiscoASAParser
    from app.parsers.dynamic_parser import DynamicParser

    asa_parser = CiscoASAParser()
    dynamic_parser = DynamicParser()
    engine = IncidentEngine(window_seconds=900, activity_window_seconds=60)

    events = []
    for line in EIGHT_LINE_TEST_PAYLOAD:
        if asa_parser.matches(line):
            parsed = asa_parser.parse(line)
            parsed_list = [parsed] if isinstance(parsed, UnifiedEvent) else parsed
        else:
            parsed_list = dynamic_parser.parse(line)

        for evt in parsed_list:
            evt.owner_username = "test_analyst_8line"
            events.append(evt)

    incidents = [engine.process_event(evt) for evt in events]

    # Check 203.0.113.45 incident
    asa_inc = next((inc for inc in engine.incidents.values() if inc.source_ip == "203.0.113.45"), None)
    assert asa_inc is not None
    assert asa_inc.event_count == 7
    assert asa_inc.is_distributed is False
    assert len(asa_inc.event_hashes) == 7

    # Check Local Host incident
    local_inc = next((inc for inc in engine.incidents.values() if inc.source_ip == "Local Host"), None)
    assert local_inc is not None
    assert local_inc.event_count == 1

    # Ensure NO fan-in incident was triggered (only 1 source IP targeted 10.0.0.10:22)
    distributed_incs = [inc for inc in engine.incidents.values() if inc.is_distributed]
    assert len(distributed_incs) == 0

    # Ensure connection activities exist on the single-source incident:
    # 5 events against 10.0.0.10:22 group into 1 activity, 2 against 10.0.0.15:3389 into another
    assert asa_inc.activity_count == 2
    act_probe = next(
        (a for a in asa_inc.activities if a.get("destination_ip") == "10.0.0.10" and a.get("destination_port") == 22),
        None
    )
    assert act_probe is not None
    assert act_probe["count"] == 5

    act_rdp = next(
        (a for a in asa_inc.activities if a.get("destination_ip") == "10.0.0.15" and a.get("destination_port") == 3389),
        None
    )
    assert act_rdp is not None
    assert act_rdp["count"] == 2


def test_fan_in_detection_within_window_vs_spread():
    """
    (b) Verifies a fixture of 6+ distinct source IPs hitting 10.0.0.10:22 within 5 minutes
    creates a fan-in incident, and the same fixture spread over an hour does not.
    """
    distinct_sources = [
        "198.51.100.101",
        "198.51.100.102",
        "198.51.100.103",
        "198.51.100.104",
        "198.51.100.105",
        "198.51.100.106",
    ]

    base_time = datetime.datetime(2026, 9, 1, 10, 0, 0, tzinfo=datetime.timezone.utc)

    # 1. SCENARIO A: Within 5 minutes (events 30s apart -> total 2.5 minutes <= 5 mins)
    engine_active = IncidentEngine(fan_in_threshold=5, fan_in_window_seconds=300)
    for idx, src in enumerate(distinct_sources):
        ts = base_time + datetime.timedelta(seconds=idx * 30)
        evt = UnifiedEvent(
            timestamp=ts.isoformat(),
            source_ip=src,
            destination_ip="10.0.0.10",
            dst_port=22,
            protocol="TCP",
            raw_event_hash=f"hash_fanin_{idx}",
            threat_score=60.0,
            original_event=f"Deny tcp src {src} dst 10.0.0.10:22",
            owner_username="fanin_test_user",
        )
        engine_active.process_event(evt)

    # Fan-in incident MUST be created
    fan_in_inc = next((inc for inc in engine_active.incidents.values() if inc.is_distributed), None)
    assert fan_in_inc is not None
    assert "Distributed attack on 10.0.0.10:22" in fan_in_inc.incident_type
    assert fan_in_inc.distinct_source_count == 6
    assert fan_in_inc.event_count == 6
    assert "6 sources targeted 10.0.0.10:22" in fan_in_inc.summary
    assert fan_in_inc.max_threat_score >= 75.0  # Modest elevation above base 60.0
    assert fan_in_inc.is_distributed is True

    # Per-source incidents must also be preserved (an event belongs to both)
    per_source_incs = [inc for inc in engine_active.incidents.values() if not inc.is_distributed]
    assert len(per_source_incs) == 6

    # 2. SCENARIO B: Spread over an hour (events 12 minutes apart -> 60 mins total)
    engine_spread = IncidentEngine(fan_in_threshold=5, fan_in_window_seconds=300)
    for idx, src in enumerate(distinct_sources):
        ts = base_time + datetime.timedelta(minutes=idx * 12)
        evt = UnifiedEvent(
            timestamp=ts.isoformat(),
            source_ip=src,
            destination_ip="10.0.0.10",
            dst_port=22,
            protocol="TCP",
            raw_event_hash=f"hash_spread_{idx}",
            threat_score=60.0,
            original_event=f"Deny tcp src {src} dst 10.0.0.10:22",
            owner_username="fanin_test_user",
        )
        engine_spread.process_event(evt)

    # Fan-in incident MUST NOT be created when spread over an hour
    fan_in_spread = next((inc for inc in engine_spread.incidents.values() if inc.is_distributed), None)
    assert fan_in_spread is None


def test_connection_tuple_repeated_forms_one_activity():
    """
    (c) Verifies the same connection tuple repeated 3 times forms one activity.
    """
    engine = IncidentEngine(activity_window_seconds=60)
    base_time = datetime.datetime(2026, 9, 1, 14, 0, 0, tzinfo=datetime.timezone.utc)

    for i in range(3):
        ts = base_time + datetime.timedelta(seconds=i * 15)  # 0s, 15s, 30s <= 60s window
        evt = UnifiedEvent(
            timestamp=ts.isoformat(),
            source_ip="198.51.100.77",
            destination_ip="10.0.0.80",
            dst_port=443,
            protocol="TCP",
            raw_event_hash=f"act_hash_{i}",
            threat_score=50.0,
            original_event=f"Deny tcp src 198.51.100.77 dst 10.0.0.80:443 ({i})",
            owner_username="activity_test_user",
        )
        inc = engine.process_event(evt)

    assert inc.event_count == 3
    assert inc.activity_count == 1
    assert len(inc.activities) == 1

    activity = inc.activities[0]
    assert activity["count"] == 3
    assert activity["event_count"] == 3
    assert activity["source_ip"] == "198.51.100.77"
    assert activity["destination_ip"] == "10.0.0.80"
    assert activity["destination_port"] == 443
    assert activity["protocol"] == "TCP"
    assert len(activity["event_hashes"]) == 3
    assert "act_hash_0" in activity["event_hashes"]
    assert "act_hash_1" in activity["event_hashes"]
    assert "act_hash_2" in activity["event_hashes"]


def test_tenant_isolation_never_shares_incidents():
    """
    (d) Verifies two different users sending identical events never share an incident.
    """
    engine = IncidentEngine()
    ts = datetime.datetime(2026, 9, 1, 15, 0, 0, tzinfo=datetime.timezone.utc).isoformat()

    event_user_alpha = UnifiedEvent(
        timestamp=ts,
        source_ip="185.220.101.5",
        destination_ip="10.0.0.10",
        dst_port=22,
        protocol="TCP",
        raw_event_hash="hash_tenant_alpha",
        threat_score=70.0,
        original_event="Deny tcp src 185.220.101.5 dst 10.0.0.10:22",
        owner_username="tenant_alpha",
    )

    event_user_beta = UnifiedEvent(
        timestamp=ts,
        source_ip="185.220.101.5",
        destination_ip="10.0.0.10",
        dst_port=22,
        protocol="TCP",
        raw_event_hash="hash_tenant_beta",
        threat_score=70.0,
        original_event="Deny tcp src 185.220.101.5 dst 10.0.0.10:22",
        owner_username="tenant_beta",
    )

    inc_alpha = engine.process_event(event_user_alpha)
    inc_beta = engine.process_event(event_user_beta)

    # Must be completely separate incidents
    assert inc_alpha.incident_id != inc_beta.incident_id
    assert inc_alpha.owner_username == "tenant_alpha"
    assert inc_beta.owner_username == "tenant_beta"
    assert inc_alpha.event_count == 1
    assert inc_beta.event_count == 1

    # Query filtered by tenant
    list_alpha = engine.get_incidents(owner_username="tenant_alpha")
    list_beta = engine.get_incidents(owner_username="tenant_beta")

    assert len(list_alpha) == 1
    assert list_alpha[0]["incident_id"] == inc_alpha.incident_id
    assert list_alpha[0]["owner_username"] == "tenant_alpha"

    assert len(list_beta) == 1
    assert list_beta[0]["incident_id"] == inc_beta.incident_id
    assert list_beta[0]["owner_username"] == "tenant_beta"
