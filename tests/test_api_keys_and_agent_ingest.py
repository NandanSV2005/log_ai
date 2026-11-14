import pytest
import hashlib
import asyncio
from httpx import AsyncClient
from app.database import get_db, ApiKey
from app.services.api_key_service import reset_api_key_rate_limits
from scripts.device_simulator import (
    generate_cisco_asa,
    generate_fortigate,
    generate_suricata,
    generate_pfsense,
    generate_linux_auth,
)

@pytest.fixture(autouse=True)
def reset_rate_limits():
    reset_api_key_rate_limits()
    yield
    reset_api_key_rate_limits()


@pytest.mark.asyncio
async def test_plaintext_shown_once_and_only_hash_stored(client: AsyncClient, auth_headers: dict):
    """Verify that plaintext API key is returned exactly once on creation and only SHA-256 hash is persisted."""
    # 1. Create API key
    res = await client.post(
        "/api/v1/api-keys",
        json={"name": "Test Forwarder Key"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert "raw_key" in data
    raw_key = data["raw_key"]
    assert raw_key.startswith("logai_live_")
    key_id = data["key"]["id"]
    display_prefix = data["key"]["display_prefix"]

    # 2. Check Database record directly
    db = next(get_db())
    try:
        db_record = db.query(ApiKey).filter(ApiKey.id == key_id).first()
        assert db_record is not None
        # Must NOT store raw key
        assert raw_key not in db_record.key_hash
        # Must store sha256 hash
        expected_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        assert db_record.key_hash == expected_hash
        assert db_record.display_prefix == display_prefix
    finally:
        db.close()

    # 3. GET /api/v1/api-keys list should never reveal raw_key or key_hash
    list_res = await client.get("/api/v1/api-keys", headers=auth_headers)
    assert list_res.status_code == 200
    keys = list_res.json()
    assert len(keys) == 1
    assert "raw_key" not in keys[0]
    assert "key_hash" not in keys[0]
    assert keys[0]["display_prefix"] == display_prefix


@pytest.mark.asyncio
async def test_revoked_or_unknown_key_rejected(client: AsyncClient, auth_headers: dict):
    """Verify that agent ingest rejects missing, invalid, unknown, or revoked API keys with 401."""
    # 1. Request with no auth
    r1 = await client.post(
        "/api/v1/ingest/agent",
        content="Dec 10 08:00:00 host sshd[123]: Test message\n",
        headers={"Content-Type": "text/plain"},
    )
    assert r1.status_code == 401

    # 2. Request with unknown/fake key
    r2 = await client.post(
        "/api/v1/ingest/agent",
        content="Dec 10 08:00:00 host sshd[123]: Test message\n",
        headers={
            "Content-Type": "text/plain",
            "Authorization": "Bearer logai_live_fakeunregisteredtoken12345",
        },
    )
    assert r2.status_code == 401

    # 3. Create valid key
    create_res = await client.post(
        "/api/v1/api-keys",
        json={"name": "Temporary Key"},
        headers=auth_headers,
    )
    raw_key = create_res.json()["raw_key"]
    key_id = create_res.json()["key"]["id"]

    # Ingest works with active key
    r3 = await client.post(
        "/api/v1/ingest/agent",
        content="Dec 10 08:00:00 host sshd[123]: Test message\n",
        headers={
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {raw_key}",
        },
    )
    assert r3.status_code in (200, 202)

    # 4. Revoke the key
    del_res = await client.delete(f"/api/v1/api-keys/{key_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Ingest now fails with 401
    r4 = await client.post(
        "/api/v1/ingest/agent",
        content="Dec 10 08:00:00 host sshd[123]: Test message\n",
        headers={
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {raw_key}",
        },
    )
    assert r4.status_code == 401


@pytest.mark.asyncio
async def test_user_a_key_only_ever_ingests_under_user_a(client: AsyncClient):
    """Verify tenant isolation: events ingested via User A's API key belong strictly to User A."""
    # 1. Register User A and User B
    await client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "password": "AlicePassword123!"},
    )
    login_a = await client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "AlicePassword123!"},
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    await client.post(
        "/api/v1/auth/register",
        json={"username": "bob", "password": "BobPassword123!"},
    )
    login_b = await client.post(
        "/api/v1/auth/login",
        json={"username": "bob", "password": "BobPassword123!"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. Alice creates an API key
    key_res = await client.post(
        "/api/v1/api-keys",
        json={"name": "Alice Edge Sensor"},
        headers=headers_a,
    )
    alice_api_key = key_res.json()["raw_key"]

    # 3. Bob attempts to list Alice's keys -> Bob sees empty list
    bob_keys = await client.get("/api/v1/api-keys", headers=headers_b)
    assert len(bob_keys.json()) == 0

    # 4. Ingest 3 logs via Alice's API key
    log_payload = (
        "%ASA-4-106023: Deny tcp src outside:198.51.100.5/1234 dst inside:10.0.0.5/80 by access-group \"outside_acl\"\n"
        "%ASA-4-106023: Deny tcp src outside:198.51.100.6/1234 dst inside:10.0.0.5/80 by access-group \"outside_acl\"\n"
        "%ASA-4-106023: Deny tcp src outside:198.51.100.7/1234 dst inside:10.0.0.5/80 by access-group \"outside_acl\"\n"
    )
    ingest_res = await client.post(
        "/api/v1/ingest/agent",
        content=log_payload,
        headers={
            "Content-Type": "text/plain",
            "X-API-Key": alice_api_key,
        },
    )
    assert ingest_res.status_code in (200, 202)

    # Allow worker to process
    await asyncio.sleep(0.4)

    # 5. Alice checks her events
    alice_events_res = await client.get("/api/v1/dashboard/events/recent?limit=50", headers=headers_a)
    assert alice_events_res.status_code == 200
    alice_events = alice_events_res.json().get("events", [])
    assert len(alice_events) >= 3

    # 6. Bob checks his events -> Must be 0
    bob_events_res = await client.get("/api/v1/dashboard/events/recent?limit=50", headers=headers_b)
    assert bob_events_res.status_code == 200
    bob_events = bob_events_res.json().get("events", [])
    assert len(bob_events) == 0


@pytest.mark.asyncio
async def test_oversize_body_and_over_limit_rates_rejected(client: AsyncClient, auth_headers: dict):
    """Verify that payloads exceeding 1MB return 413 and rate limit exceeds return 429."""
    # Create key
    key_res = await client.post(
        "/api/v1/api-keys",
        json={"name": "Rate & Size Test Key"},
        headers=auth_headers,
    )
    raw_key = key_res.json()["raw_key"]

    # 1. Oversize body (> 1 MB)
    oversize_payload = "A" * (1024 * 1024 + 100)
    r_oversize = await client.post(
        "/api/v1/ingest/agent",
        content=oversize_payload,
        headers={
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {raw_key}",
        },
    )
    assert r_oversize.status_code == 413
    assert "Payload exceeds" in r_oversize.json()["detail"]

    # 2. Rate limiter: Reset window and verify 120 req/min allowance
    reset_api_key_rate_limits()

    # Rapidly fire 120 requests
    for i in range(120):
        resp = await client.post(
            "/api/v1/ingest/agent",
            content=f"Log line {i}\n",
            headers={
                "Content-Type": "text/plain",
                "Authorization": f"Bearer {raw_key}",
            },
        )
        assert resp.status_code in (200, 202)

    # 121st request must trigger 429 Too Many Requests
    r_limited = await client.post(
        "/api/v1/ingest/agent",
        content="Rate limit trigger log\n",
        headers={
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {raw_key}",
        },
    )
    assert r_limited.status_code == 429
    assert "Rate limit exceeded" in r_limited.json()["detail"]


@pytest.mark.asyncio
async def test_e2e_simulator_batch_versus_manual_upload(client: AsyncClient, auth_headers: dict):
    """Verify that logs emitted by the device simulator produce identical normalized events
    whether ingested via the agent endpoint or uploaded manually.
    """
    # 1. Generate simulator lines for all 5 parser formats
    cisco_line = generate_cisco_asa("198.51.100.99", "10.0.0.5", 54321, 80, action="Deny")
    forti_line = generate_fortigate("192.168.1.50", "10.0.0.1", 12345, 443, action="accept")
    suri_line = generate_suricata("198.51.100.4", "10.0.0.5", 51234, 22, signature="ET SCAN Potential SSH Scan", severity=2)
    pf_line = generate_pfsense("198.51.100.15", "10.0.0.5", 41234, 80, action="block")
    auth_line = generate_linux_auth("198.51.100.77", user="admin", success=False)

    batch_payload = "\n".join([cisco_line, forti_line, suri_line, pf_line, auth_line]) + "\n"

    # 2. Ingest via Agent endpoint using API Key
    key_res = await client.post(
        "/api/v1/api-keys",
        json={"name": "E2E Simulator Key"},
        headers=auth_headers,
    )
    raw_key = key_res.json()["raw_key"]

    agent_res = await client.post(
        "/api/v1/ingest/agent",
        content=batch_payload,
        headers={
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {raw_key}",
        },
    )
    assert agent_res.status_code in (200, 202)
    agent_json = agent_res.json()
    assert agent_json.get("lines_received") == 5

    # 3. Ingest identical payload via manual upload under another user
    await client.post(
        "/api/v1/auth/register",
        json={"username": "manual_user", "password": "ManualUserPassword123!"},
    )
    manual_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "manual_user", "password": "ManualUserPassword123!"},
    )
    manual_headers = {"Authorization": f"Bearer {manual_login.json()['access_token']}"}

    manual_res = await client.post(
        "/api/v1/ingest",
        content=batch_payload,
        headers={
            "Content-Type": "text/plain",
            **manual_headers,
        },
    )
    assert manual_res.status_code in (200, 202)

    # Allow queue worker to normalize both batches
    await asyncio.sleep(0.6)

    # 4. Fetch normalized events for both users
    agent_events_res = await client.get("/api/v1/dashboard/events/recent?limit=50", headers=auth_headers)
    assert agent_events_res.status_code == 200
    agent_events = agent_events_res.json().get("events", [])
    assert len(agent_events) >= 5

    manual_events_res = await client.get("/api/v1/dashboard/events/recent?limit=50", headers=manual_headers)
    assert manual_events_res.status_code == 200
    manual_events = manual_events_res.json().get("events", [])
    assert len(manual_events) >= 5

    # 5. Verify identical parsed event_types and attributes
    agent_types = sorted([e["event_type"] for e in agent_events])
    manual_types = sorted([e["event_type"] for e in manual_events])
    assert agent_types == manual_types

    agent_src_ips = sorted([e["source_ip"] for e in agent_events if e.get("source_ip")])
    manual_src_ips = sorted([e["source_ip"] for e in manual_events if e.get("source_ip")])
    assert agent_src_ips == manual_src_ips
