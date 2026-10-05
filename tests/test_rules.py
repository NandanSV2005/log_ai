import asyncio
import pytest
from httpx import AsyncClient

EIGHT_LINE_TEST_PAYLOAD = (
    'Aug 28 2026 09:15:03: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51422 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]\n'
    'Aug 28 2026 09:15:11: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51423 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]\n'
    'Aug 28 2026 09:15:19: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51424 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]\n'
    'Aug 28 2026 09:15:27: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51425 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]\n'
    'Aug 28 2026 09:16:02: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51430 dst inside:10.0.0.15/3389 by access-group "outside_acl" [RDP Brute Force]\n'
    'Aug 28 2026 09:16:14: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51431 dst inside:10.0.0.15/3389 by access-group "outside_acl" [RDP Brute Force]\n'
    'Aug 28 2026 09:17:40: %ASA-6-302013: Built inbound TCP connection for outside:203.0.113.45/51500 to inside:10.0.0.10/22 [Auth Success After Spray]\n'
    'Aug 26 14:06:10 server-main sudo[10305]: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /var/log/auth.log\n'
)

async def _ingest_standard_eight_lines(client: AsyncClient, auth_headers: dict):
    """Ingests the standard 8-line test dataset and waits until normalized storage is written."""
    headers = {"Content-Type": "text/plain", **auth_headers}
    ingest_res = await client.post("/api/v1/ingest", content=EIGHT_LINE_TEST_PAYLOAD.encode("utf-8"), headers=headers)
    assert ingest_res.status_code == 202

    # Wait for queue worker to normalize and write records to disk
    for _ in range(40):
        await asyncio.sleep(0.05)
        recent_res = await client.get("/api/v1/dashboard/events/recent?limit=20", headers=auth_headers)
        if recent_res.status_code == 200 and recent_res.json().get("count", 0) >= 8:
            break

@pytest.mark.asyncio
async def test_rule_test_malformed_yaml(client: AsyncClient, auth_headers: dict):
    """Verifies that malformed YAML returns a clean validation error without crashing."""
    malformed_yaml = "name: 'Broken Rule\n  bad_indent:\n- missing: colon"
    res = await client.post(
        "/api/v1/rules/test",
        content=malformed_yaml.encode("utf-8"),
        headers={"Content-Type": "text/plain", **auth_headers},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VALIDATION_FAILED"
    assert data["syntax_valid"] is False
    assert "YAML Syntax Error" in data["error"]
    assert data["matched_records_count"] == 0

@pytest.mark.asyncio
async def test_rule_test_missing_required_fields(client: AsyncClient, auth_headers: dict):
    """Verifies that missing name or condition returns clean validation errors."""
    # Missing condition
    no_condition_yaml = """
name: "Incomplete Rule"
severity: "HIGH"
"""
    res = await client.post(
        "/api/v1/rules/test",
        json={"yaml_content": no_condition_yaml},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VALIDATION_FAILED"
    assert data["syntax_valid"] is False
    assert "Missing Required Field" in data["error"]
    assert "condition" in data["detail"]

    # Missing name
    no_name_yaml = """
condition:
  event_type: "cisco_asa"
"""
    res2 = await client.post(
        "/api/v1/rules/test",
        json={"yaml_content": no_name_yaml},
        headers=auth_headers,
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "VALIDATION_FAILED"
    assert "name" in data2["detail"]

@pytest.mark.asyncio
async def test_rule_test_semantics_on_standard_eight_lines(client: AsyncClient, auth_headers: dict):
    """
    Ingests the standard 8-line test log and evaluates:
    1. Default example rule with threat_score_gt: 75.0 (strict greater-than) -> exactly 0 matches,
       because events in the dataset have threat_score <= 75.0.
    2. Rule with threat_score_gte: 75.0, event_type: 'cisco_asa', mitre_tactic: 'T1110' -> exactly 5 matches.
       Reasoning: Events 1 & 2 have threat_score 65.0 (initial deny floor before repeated_deny threshold of 3),
       while events 3, 4, 5, 6, 7 all have threat_score 75.0 and MITRE tactic T1110 (Brute Force).
    3. Rule with threat_score_gte: 65.0, event_type: 'cisco_asa', mitre_tactic: 'T1110' -> exactly 7 matches (all Cisco ASA events).
    4. Rule with event_type: 'sudo' -> exactly 1 match (event 8).
    5. Rule with event_type: 'cisco_asa:permit' -> exactly 1 match (event 7).
    6. Rule with event_type: 'cisco_asa:deny' -> exactly 6 matches (events 1-6).
    """
    await _ingest_standard_eight_lines(client, auth_headers)

    # 1. Strict greater-than threat_score_gt: 75.0 against events that score <= 75.0
    rule_strict_gt = """
name: "Detect Strict GT"
severity: "HIGH"
condition:
  event_type: "cisco_asa"
  threat_score_gt: 75.0
  mitre_tactic: "T1110"
action:
  flag_anomaly: true
"""
    res_gt = await client.post(
        "/api/v1/rules/test",
        content=rule_strict_gt.encode("utf-8"),
        headers={"Content-Type": "text/plain", **auth_headers},
    )
    assert res_gt.status_code == 200
    data_gt = res_gt.json()
    assert data_gt["status"] == "VALIDATED"
    assert data_gt["syntax_valid"] is True
    # Reasoning: 75.0 is not strictly > 75.0, so 0 matches
    assert data_gt["matched_records_count"] == 0
    assert "No events matched" in data_gt["sample_match_event"]

    # 2. Greater-or-equal threat_score_gte: 75.0 against the 8 events
    rule_gte_75 = """
name: "Detect Password Spraying Burst"
severity: "HIGH"
condition:
  event_type: "cisco_asa"
  threat_score_gte: 75.0
  mitre_tactic: "T1110"
action:
  flag_anomaly: true
  quarantine_host: true
"""
    res_gte_75 = await client.post(
        "/api/v1/rules/test",
        content=rule_gte_75.encode("utf-8"),
        headers={"Content-Type": "text/plain", **auth_headers},
    )
    assert res_gte_75.status_code == 200
    data_gte_75 = res_gte_75.json()
    assert data_gte_75["status"] == "VALIDATED"
    assert data_gte_75["syntax_valid"] is True
    # Reasoning: Events 1 & 2 have score 65.0; Events 3, 4, 5, 6, 7 have score 75.0 and T1110
    assert data_gte_75["matched_records_count"] == 5
    assert data_gte_75["sample_match_event"] is not None
    assert "cisco_asa" in data_gte_75["sample_match_event"]
    assert "203.0.113.45" in data_gte_75["sample_match_event"]
    assert data_gte_75["compilation_time_ms"] >= 0

    # 3. Greater-or-equal threat_score_gte: 65.0 matching all 7 Cisco ASA events
    rule_gte_65 = """
name: "Detect All Cisco Spray Events"
severity: "MEDIUM"
condition:
  event_type: "cisco_asa"
  threat_score_gte: 65.0
  mitre_tactic: "T1110"
action:
  flag_anomaly: true
"""
    res_gte_65 = await client.post(
        "/api/v1/rules/test",
        json={"yaml_content": rule_gte_65},
        headers=auth_headers,
    )
    assert res_gte_65.status_code == 200
    data_gte_65 = res_gte_65.json()
    assert data_gte_65["matched_records_count"] == 7

    # 4. Rule modified for Host Sudo execution
    rule_sudo = """
name: "Detect Sudo Execution"
severity: "HIGH"
condition:
  event_type: "sudo"
"""
    res_sudo = await client.post(
        "/api/v1/rules/test",
        json={"yaml_content": rule_sudo},
        headers=auth_headers,
    )
    assert res_sudo.status_code == 200
    data_sudo = res_sudo.json()
    assert data_sudo["matched_records_count"] == 1
    assert "sudo:exec" in data_sudo["sample_match_event"]
    assert "Local Host" in data_sudo["sample_match_event"]

    # 5. Rule modified for Cisco ASA Deny packets only
    rule_deny = """
name: "Detect Denied Perimeter Packets"
severity: "HIGH"
condition:
  event_type: "cisco_asa:deny"
"""
    res_deny = await client.post(
        "/api/v1/rules/test",
        json={"yaml_content": rule_deny},
        headers=auth_headers,
    )
    assert res_deny.status_code == 200
    data_deny = res_deny.json()
    assert data_deny["matched_records_count"] == 6

    # 6. Rule modified for Cisco ASA Permit packets only
    rule_permit = """
name: "Detect Permitted Spray Connections"
severity: "HIGH"
condition:
  event_type: "cisco_asa:permit"
"""
    res_permit = await client.post(
        "/api/v1/rules/test",
        json={"yaml_content": rule_permit},
        headers=auth_headers,
    )
    assert res_permit.status_code == 200
    data_permit = res_permit.json()
    assert data_permit["matched_records_count"] == 1
