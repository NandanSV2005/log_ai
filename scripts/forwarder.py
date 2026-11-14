#!/usr/bin/env python3
"""
================================================================================
LOG.AI - DURABLE EDGE SYSLOG FORWARDER AGENT
================================================================================
The Forwarder listens for incoming syslog messages locally over TCP and UDP,
enqueues them into a persistent on-disk SQLite buffer, and flushes batches to
the Log.AI cloud endpoint (/api/v1/ingest/agent) over HTTPS.

DELIVERY SEMANTICS:
  Delivery is strictly AT-LEAST-ONCE. In the event of network disruption, HTTP
  timeouts, cloud cold starts (e.g., Render spin-ups), or forwarder restarts,
  unacknowledged batches will be retried automatically. Consequently, duplicate
  events are possible under fault conditions.

DURABILITY & RESILIENCE:
  - On-disk buffer backed by SQLite (WAL mode) prevents data loss during cloud
    downtime or edge host reboots.
  - Batching policy: Flushes every 2 seconds or when 100 log lines accumulate.
  - Exponential backoff: Backs off on 5xx errors, timeouts, or 429 rate limits,
    retrying continuously until the target service recovers.
================================================================================
"""

import os
import sys
import time
import socket
import sqlite3
import argparse
import threading
import urllib.request
import urllib.error
from typing import List, Tuple

DEFAULT_BUFFER_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "forwarder_buffer.db"
)

class DurableDiskBuffer:
    """Thread-safe SQLite on-disk queue for crash-resilient syslog buffering."""
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self.lock = threading.Lock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _init_db(self):
        with self.lock:
            with self._get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS buffer (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        line TEXT NOT NULL,
                        created_at REAL NOT NULL
                    );
                """)
                conn.commit()

    def enqueue(self, line: str):
        """Append a raw line to persistent disk storage."""
        clean = line.strip()
        if not clean:
            return
        now = time.time()
        with self.lock:
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT INTO buffer (line, created_at) VALUES (?, ?);",
                    (clean, now)
                )
                conn.commit()

    def fetch_batch(self, limit: int = 100) -> List[Tuple[int, str]]:
        """Fetch oldest pending log lines up to limit."""
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, line FROM buffer ORDER BY id ASC LIMIT ?;",
                    (limit,)
                )
                return cursor.fetchall()

    def count(self) -> int:
        """Return total pending unacknowledged records."""
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM buffer;")
                row = cursor.fetchone()
                return row[0] if row else 0

    def ack_batch(self, ids: List[int]):
        """Remove confirmed flushed records from disk buffer."""
        if not ids:
            return
        with self.lock:
            with self._get_connection() as conn:
                placeholders = ",".join("?" for _ in ids)
                conn.execute(
                    f"DELETE FROM buffer WHERE id IN ({placeholders});",
                    ids
                )
                conn.commit()


class BatchForwarder:
    """Dispatches buffered syslog lines to Log.AI agent ingestion endpoint."""
    def __init__(self, buffer: DurableDiskBuffer, url: str, api_key: str, batch_size: int = 100, flush_interval: float = 2.0):
        self.buffer = buffer
        self.url = url
        self.api_key = api_key
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.running = False
        self.worker_thread = None

    def start(self):
        self.running = True
        self.worker_thread = threading.Thread(target=self._run_loop, daemon=True)
        self.worker_thread.start()
        print(f"[*] Batch forwarder started. Flushes every {self.flush_interval}s or {self.batch_size} lines -> {self.url}")

    def stop(self):
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=3.0)

    def _run_loop(self):
        last_flush_time = time.time()
        backoff_delay = 1.0
        max_backoff = 60.0

        while self.running:
            try:
                pending_count = self.buffer.count()
                now = time.time()
                elapsed = now - last_flush_time

                should_flush = (pending_count >= self.batch_size) or (pending_count > 0 and elapsed >= self.flush_interval)

                if should_flush:
                    records = self.buffer.fetch_batch(limit=self.batch_size)
                    if records:
                        ids = [r[0] for r in records]
                        lines = [r[1] for r in records]

                        success, status_code, err_msg = self._post_batch(lines)
                        if success:
                            self.buffer.ack_batch(ids)
                            last_flush_time = time.time()
                            backoff_delay = 1.0  # Reset backoff on success
                            print(f"[+] Successfully forwarded batch of {len(lines)} events (remaining buffer: {self.buffer.count()})")
                        else:
                            print(f"[!] Forwarding failed (HTTP {status_code}): {err_msg}. Backing off for {backoff_delay:.1f}s...")
                            time.sleep(backoff_delay)
                            backoff_delay = min(backoff_delay * 2.0, max_backoff)
                            continue

                time.sleep(0.2)

            except Exception as e:
                print(f"[!] Unexpected error in forwarder dispatcher: {e}")
                time.sleep(1.0)

    def _post_batch(self, lines: List[str]) -> Tuple[bool, int, str]:
        """POST batch of newline-delimited text/plain lines with API key authentication."""
        payload = ("\n".join(lines) + "\n").encode("utf-8")
        headers = {
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "LogAI-DurableForwarder/1.0",
        }
        req = urllib.request.Request(self.url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15.0) as resp:
                code = resp.getcode()
                return (200 <= code < 300), code, "OK"
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else e.reason
            return False, e.code, str(msg)
        except Exception as e:
            return False, 0, str(e)


# ------------------------------------------------------------------------------
# Syslog Network Listeners (TCP & UDP)
# ------------------------------------------------------------------------------

def run_udp_listener(host: str, port: int, buffer: DurableDiskBuffer, stop_event: threading.Event):
    """Listens for UDP syslog datagrams and queues to disk."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((host, port))
    sock.settimeout(1.0)
    print(f"[*] Forwarder listening for UDP syslog on {host}:{port}")
    try:
        while not stop_event.is_set():
            try:
                data, _ = sock.recvfrom(65535)
                text = data.decode("utf-8", errors="replace")
                for line in text.splitlines():
                    if line.strip():
                        buffer.enqueue(line)
            except socket.timeout:
                continue
            except Exception as e:
                if not stop_event.is_set():
                    print(f"[!] UDP listener error: {e}")
    finally:
        sock.close()


def run_tcp_listener(host: str, port: int, buffer: DurableDiskBuffer, stop_event: threading.Event):
    """Listens for TCP syslog connections and streams to disk."""
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind((host, port))
    server_sock.listen(10)
    server_sock.settimeout(1.0)
    print(f"[*] Forwarder listening for TCP syslog on {host}:{port}")

    def handle_client(conn: socket.socket):
        buf = ""
        conn.settimeout(5.0)
        try:
            while not stop_event.is_set():
                try:
                    data = conn.recv(4096)
                    if not data:
                        break
                    buf += data.decode("utf-8", errors="replace")
                    while "\n" in buf:
                        line, buf = buf.split("\n", 1)
                        if line.strip():
                            buffer.enqueue(line)
                except socket.timeout:
                    continue
        except Exception:
            pass
        finally:
            if buf.strip():
                buffer.enqueue(buf.strip())
            try:
                conn.close()
            except Exception:
                pass

    try:
        while not stop_event.is_set():
            try:
                conn, _ = server_sock.accept()
                t = threading.Thread(target=handle_client, args=(conn,), daemon=True)
                t.start()
            except socket.timeout:
                continue
            except Exception as e:
                if not stop_event.is_set():
                    print(f"[!] TCP listener error: {e}")
    finally:
        server_sock.close()


def main():
    parser = argparse.ArgumentParser(
        description="Log.AI Durable Syslog Forwarder (TCP/UDP to Ingest Agent over HTTPS)"
    )
    parser.add_argument("--url", type=str, required=True, help="Agent ingest URL (e.g. https://.../api/v1/ingest/agent)")
    parser.add_argument("--api-key", type=str, required=True, help="Log.AI API key for agent authentication")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Local host binding (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=5514, help="Local syslog port to listen on (default: 5514)")
    parser.add_argument("--db-path", type=str, default=DEFAULT_BUFFER_PATH, help=f"On-disk SQLite buffer path (default: {DEFAULT_BUFFER_PATH})")
    parser.add_argument("--batch-size", type=int, default=100, help="Max lines per flush batch (default: 100)")
    parser.add_argument("--flush-interval", type=float, default=2.0, help="Max seconds between flushes (default: 2.0)")

    args = parser.parse_args()

    print("=" * 72)
    print("LOG.AI DURABLE EDGE SYSLOG FORWARDER")
    print(f"  Target URL:        {args.url}")
    print(f"  Syslog Listeners:  TCP & UDP on {args.host}:{args.port}")
    print(f"  On-Disk Buffer:    {args.db_path}")
    print(f"  Batch Policy:      Max {args.batch_size} lines or {args.flush_interval}s interval")
    print("=" * 72)

    disk_buffer = DurableDiskBuffer(args.db_path)
    initial_pending = disk_buffer.count()
    if initial_pending > 0:
        print(f"[*] Found {initial_pending} buffered events on disk from previous session. Resuming replay...")

    forwarder = BatchForwarder(
        buffer=disk_buffer,
        url=args.url,
        api_key=args.api_key,
        batch_size=args.batch_size,
        flush_interval=args.flush_interval,
    )
    forwarder.start()

    stop_event = threading.Event()
    udp_thread = threading.Thread(target=run_udp_listener, args=(args.host, args.port, disk_buffer, stop_event), daemon=True)
    tcp_thread = threading.Thread(target=run_tcp_listener, args=(args.host, args.port, disk_buffer, stop_event), daemon=True)
    udp_thread.start()
    tcp_thread.start()

    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\n[*] Shutting down forwarder...")
        stop_event.set()
        forwarder.stop()
        print("[*] Forwarder stopped cleanly.")

if __name__ == "__main__":
    main()
