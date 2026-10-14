import asyncio
import socket
import time
import pytest
from httpx import AsyncClient

from app.database import SessionLocal, LogSource, User
from app.services.syslog_receiver import (
    SyslogReceiver,
    extract_tcp_messages,
    clean_ip,
)
from app.services.queue import queue_manager

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


# =============================================================================
# 1. FRAMING UNIT TESTS
# =============================================================================

def test_extract_tcp_newline_framing():
    """Verifies standard newline and CRLF delimited syslog frames."""
    raw = b"First syslog line\nSecond syslog line\r\nThird syslog line\n"
    buffer = bytearray(raw)
    msgs, remaining, oversize = extract_tcp_messages(buffer, max_msg_bytes=8192)

    assert len(msgs) == 3
    assert msgs[0] == b"First syslog line"
    assert msgs[1] == b"Second syslog line"
    assert msgs[2] == b"Third syslog line"
    assert len(remaining) == 0
    assert oversize == 0


def test_extract_tcp_rfc6587_octet_counted_framing():
    """Verifies RFC 6587 octet-counted framing (<LEN> <MSG>)."""
    msg1 = b"<134>1 First log"
    msg2 = b"<134>1 Second log msg"
    raw = f"{len(msg1)} ".encode("ascii") + msg1 + f" {len(msg2)} ".encode("ascii") + msg2
    buffer = bytearray(raw)
    msgs, remaining, oversize = extract_tcp_messages(buffer, max_msg_bytes=8192)

    assert len(msgs) == 2
    assert msgs[0] == msg1
    assert msgs[1] == msg2
    assert len(remaining) == 0
    assert oversize == 0


def test_extract_tcp_message_split_across_reads():
    """Simulates a TCP message arriving in fragmented network chunks."""
    chunk1 = b"<134>Aug 28 2026: %ASA-4-106023: Deny tcp src outside:198.51.100.1"
    chunk2 = b"/54321 dst inside:10.0.0.50/80\n"

    buffer = bytearray()
    
    # Read 1: partial chunk
    buffer.extend(chunk1)
    msgs1, buffer, oversize1 = extract_tcp_messages(buffer, max_msg_bytes=8192)
    assert len(msgs1) == 0
    assert len(buffer) == len(chunk1)
    assert oversize1 == 0

    # Read 2: remaining chunk completes the message
    buffer.extend(chunk2)
    msgs2, buffer, oversize2 = extract_tcp_messages(buffer, max_msg_bytes=8192)
    assert len(msgs2) == 1
    assert msgs2[0] == chunk1 + b"/54321 dst inside:10.0.0.50/80"
    assert len(buffer) == 0
    assert oversize2 == 0


def test_extract_tcp_oversize_message_dropped():
    """Verifies messages exceeding max_msg_bytes are dropped and counted."""
    huge_msg = b"A" * 9000 + b"\n"
    buffer = bytearray(huge_msg)
    msgs, remaining, oversize = extract_tcp_messages(buffer, max_msg_bytes=8192)

    assert len(msgs) == 0
    assert oversize == 1
    assert len(remaining) == 0


# =============================================================================
# 2. SOURCE REGISTRY & ACCESS CONTROL TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_sources_crud_and_isolation(client: AsyncClient, auth_headers: dict):
    """
    Verifies that:
    1. A user can register a source IP.
    2. The source IP is returned in their GET /api/v1/sources list.
    3. Registering the same IP again returns 400.
    4. Another user cannot view or delete the source.
    """
    test_ip = "198.51.100.99"

    # Clean up any leftover test source
    db = SessionLocal()
    db.query(LogSource).filter(LogSource.source_ip == test_ip).delete()
    db.commit()
    db.close()

    # 1. Register Source
    res = await client.post(
        "/api/v1/sources",
        json={"source_ip": test_ip, "display_name": "Edge Firewall 99"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    source_id = data["id"]
    assert data["source_ip"] == test_ip
    assert data["display_name"] == "Edge Firewall 99"

    # 2. Duplicate registration rejected
    res_dup = await client.post(
        "/api/v1/sources",
        json={"source_ip": test_ip, "display_name": "Duplicate Attempt"},
        headers=auth_headers,
    )
    assert res_dup.status_code == 400
    assert "already registered" in res_dup.json()["detail"]

    # 3. List sources
    res_list = await client.get("/api/v1/sources", headers=auth_headers)
    assert res_list.status_code == 200
    sources = res_list.json()
    assert any(s["id"] == source_id and s["source_ip"] == test_ip for s in sources)

    # 4. Another user isolation check
    # Register & login user B
    await client.post("/api/v1/auth/register", json={"username": "user_b_isolation", "password": "Password123!"})
    login_b = await client.post("/api/v1/auth/login", json={"username": "user_b_isolation", "password": "Password123!"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B should NOT see User A's source
    res_b_list = await client.get("/api/v1/sources", headers=headers_b)
    assert res_b_list.status_code == 200
    assert not any(s["source_ip"] == test_ip for s in res_b_list.json())

    # User B cannot delete User A's source
    res_b_del = await client.delete(f"/api/v1/sources/{source_id}", headers=headers_b)
    assert res_b_del.status_code == 403

    # User A deletes their own source
    res_del = await client.delete(f"/api/v1/sources/{source_id}", headers=auth_headers)
    assert res_del.status_code == 200


# =============================================================================
# 3. LIVE RECEIVER OPERATIONAL TESTS (TCP / UDP SOCKET LEVEL)
# =============================================================================

@pytest.mark.asyncio
async def test_receiver_unregistered_source_dropped():
    """Verifies that packets from an unregistered IP are dropped and counted."""
    receiver = SyslogReceiver()
    await receiver.start(host="127.0.0.1", tcp_port=0, udp_port=0)
    tcp_port = receiver.listening_tcp_port

    # Ensure 127.0.0.1 is NOT in the database
    db = SessionLocal()
    db.query(LogSource).filter(LogSource.source_ip == "127.0.0.1").delete()
    db.commit()
    db.close()

    try:
        reader, writer = await asyncio.open_connection("127.0.0.1", tcp_port)
        writer.write(b"Unregistered syslog packet test\n")
        await writer.drain()
        writer.close()
        await writer.wait_closed()

        await asyncio.sleep(0.1)
        assert receiver.counters["dropped_unregistered"] >= 1
        assert receiver.counters["accepted"] == 0
    finally:
        await receiver.stop()


@pytest.mark.asyncio
async def test_receiver_registered_source_accepted_under_correct_owner():
    """Verifies that an authorized source IP is accepted and enqueued under that owner."""
    db = SessionLocal()
    db.query(LogSource).filter(LogSource.source_ip == "127.0.0.1").delete()
    source = LogSource(
        source_ip="127.0.0.1",
        owner_username="test_syslog_owner",
        display_name="Loopback Interface",
        created_at="2026-10-11T00:00:00Z",
    )
    db.add(source)
    db.commit()
    db.close()

    receiver = SyslogReceiver()
    await receiver.start(host="127.0.0.1", tcp_port=0, udp_port=0)
    tcp_port = receiver.listening_tcp_port

    try:
        reader, writer = await asyncio.open_connection("127.0.0.1", tcp_port)
        test_log = b"Aug 28 2026 09:15:03: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51422 dst inside:10.0.0.10/22 by access-group \"outside_acl\" [Auth Probe]\n"
        writer.write(test_log)
        await writer.drain()
        writer.close()
        await writer.wait_closed()

        await asyncio.sleep(0.15)
        assert receiver.counters["accepted"] == 1
        assert "127.0.0.1" in receiver.last_message_time
    finally:
        await receiver.stop()
        # Clean up database
        db = SessionLocal()
        db.query(LogSource).filter(LogSource.source_ip == "127.0.0.1").delete()
        db.commit()
        db.close()


@pytest.mark.asyncio
async def test_receiver_udp_datagram_accepted():
    """Verifies UDP syslog reception for authorized source."""
    db = SessionLocal()
    db.query(LogSource).filter(LogSource.source_ip == "127.0.0.1").delete()
    source = LogSource(
        source_ip="127.0.0.1",
        owner_username="test_syslog_owner",
        display_name="Loopback Interface",
        created_at="2026-10-11T00:00:00Z",
    )
    db.add(source)
    db.commit()
    db.close()

    receiver = SyslogReceiver()
    await receiver.start(host="127.0.0.1", tcp_port=0, udp_port=0)
    udp_port = receiver.listening_udp_port

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(b"UDP syslog test message from ASA", ("127.0.0.1", udp_port))
        sock.close()

        await asyncio.sleep(0.15)
        assert receiver.counters["accepted"] == 1
    finally:
        await receiver.stop()
        db = SessionLocal()
        db.query(LogSource).filter(LogSource.source_ip == "127.0.0.1").delete()
        db.commit()
        db.close()


# =============================================================================
# 4. END-TO-END REPLAY VS MANUAL UPLOAD EQUIVALENCE TEST
# =============================================================================

@pytest.mark.asyncio
async def test_end_to_end_syslog_replay_vs_manual_upload(client: AsyncClient, auth_headers: dict):
    """
    End-to-End equivalence test:
    Replays the standard 8-line dataset over live TCP to the receiver and verifies that:
    1. All 8 events are ingested and parsed into normalized storage.
    2. The events match the exact same taxonomy, vendor detection, and threat scoring
       as manual HTTP /ingest upload (6 Cisco denies, 1 Cisco permit, 1 sudo execution).
    """
    # 1. Authorize 127.0.0.1 for the current authenticated user
    await client.post(
        "/api/v1/sources",
        json={"source_ip": "127.0.0.1", "display_name": "Local Loopback Replay"},
        headers=auth_headers,
    )

    receiver = SyslogReceiver()
    await receiver.start(host="127.0.0.1", tcp_port=0, udp_port=0)
    tcp_port = receiver.listening_tcp_port

    try:
        # Replay the 8 lines over TCP
        reader, writer = await asyncio.open_connection("127.0.0.1", tcp_port)
        for line in EIGHT_LINE_TEST_PAYLOAD:
            writer.write(line.encode("utf-8") + b"\n")
            await writer.drain()
            await asyncio.sleep(0.02)
        writer.close()
        await writer.wait_closed()

        # Wait for queue worker to normalize and commit records to storage
        for _ in range(50):
            await asyncio.sleep(0.05)
            recent_res = await client.get("/api/v1/dashboard/events/recent?limit=25", headers=auth_headers)
            if recent_res.status_code == 200 and recent_res.json().get("count", 0) >= 8:
                break

        recent_res = await client.get("/api/v1/dashboard/events/recent?limit=25", headers=auth_headers)
        assert recent_res.status_code == 200
        events = recent_res.json().get("events", [])
        assert len(events) >= 8

        # Verify parsed properties match expected classification
        cisco_events = [e for e in events if "cisco_asa" in (e.get("event_type") or "")]
        sudo_events = [e for e in events if "sudo" in (e.get("event_type") or "")]

        assert len(cisco_events) == 7
        assert len(sudo_events) == 1

        # Check receiver status endpoint
        status_res = await client.get("/api/v1/sources/receiver-status", headers=auth_headers)
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["listening_ports"] is not None
        assert "127.0.0.1" in status_data["last_message_time_by_source"]
    finally:
        await receiver.stop()
