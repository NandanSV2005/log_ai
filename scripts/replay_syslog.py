#!/usr/bin/env python3
"""
Syslog Telemetry Replay Utility
===============================
Simulates live enterprise perimeter log sources by streaming raw log lines
to the LOG AI Syslog Receiver daemon over TCP or UDP.

Demo & Testing Usage:
1. Ensure the local source IP (typically '127.0.0.1') is registered to your user account:
   Via API:
     POST /api/v1/sources with payload:
     {"source_ip": "127.0.0.1", "display_name": "Local Host Replay Sensor"}
   Via UI:
     Navigate to Dashboard -> Live Sources -> Click "Register Source" -> Enter "127.0.0.1".

2. Replay sample dataset over TCP (newline-delimited, default):
     python scripts/replay_syslog.py --protocol tcp --port 5514 --rate 5

3. Replay with RFC 6587 octet-counted framing:
     python scripts/replay_syslog.py --protocol tcp --port 5514 --framing octet-counted

4. Replay over UDP (fallback mode):
     python scripts/replay_syslog.py --protocol udp --port 5514 --rate 10

5. Replay custom log file:
     python scripts/replay_syslog.py --file path/to/firewall.log --protocol tcp
"""

import argparse
import socket
import sys
import time
from pathlib import Path
from typing import List, Optional

DEFAULT_SAMPLE_PAYLOAD = [
    'Aug 28 2026 09:15:03: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51422 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:15:11: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51423 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:15:19: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51424 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:15:27: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51425 dst inside:10.0.0.10/22 by access-group "outside_acl" [Auth Probe]',
    'Aug 28 2026 09:16:02: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51430 dst inside:10.0.0.15/3389 by access-group "outside_acl" [RDP Brute Force]',
    'Aug 28 2026 09:16:14: %ASA-4-106023: Deny tcp src outside:203.0.113.45/51431 dst inside:10.0.0.15/3389 by access-group "outside_acl" [RDP Brute Force]',
    'Aug 28 2026 09:17:40: %ASA-6-302013: Built inbound TCP connection for outside:203.0.113.45/51500 to inside:10.0.0.10/22 [Auth Success After Spray]',
    'Aug 26 14:06:10 server-main sudo[10305]: admin : TTY=pts/0 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /var/log/auth.log',
]


def load_log_lines(file_path: Optional[str]) -> List[str]:
    """Reads lines from specified file path, or falls back to standard 8-line test dataset."""
    if not file_path:
        print("[*] No log file specified. Using standard 8-line verification dataset.")
        return DEFAULT_SAMPLE_PAYLOAD

    p = Path(file_path)
    if not p.exists() or not p.is_file():
        print(f"[!] Specified log file does not exist: {file_path}")
        sys.exit(1)

    with open(p, "r", encoding="utf-8", errors="replace") as f:
        lines = [line.strip() for line in f if line.strip()]

    print(f"[*] Loaded {len(lines)} log lines from {file_path}")
    return lines


def format_frame(line: str, protocol: str, framing: str) -> bytes:
    """Formats a log line into framed bytes according to the chosen protocol and framing standard."""
    raw_bytes = line.strip().encode("utf-8")
    if protocol == "udp":
        # UDP: one datagram per message without framing headers
        return raw_bytes

    if framing == "octet-counted":
        # RFC 6587 octet counting: <LEN> <MESSAGE>
        length_prefix = f"{len(raw_bytes)} ".encode("ascii")
        return length_prefix + raw_bytes
    else:
        # Default newline-delimited TCP framing
        return raw_bytes + b"\n"


def run_replay(
    lines: List[str],
    protocol: str = "tcp",
    host: str = "127.0.0.1",
    port: int = 5514,
    rate: float = 10.0,
    framing: str = "newline",
    bind_ip: Optional[str] = None,
    loop_count: int = 1,
):
    """Transmits log lines over TCP or UDP with controlled cadence."""
    delay = 1.0 / rate if rate > 0 else 0.0
    total_sent = 0
    total_bytes = 0
    start_time = time.time()

    print(f"[*] Target Receiver: {protocol.upper()} {host}:{port}")
    print(f"[*] Framing: {framing if protocol == 'tcp' else 'Datagram (UDP)'}")
    print(f"[*] Dispatch Rate: {rate} msgs/sec | Loops: {loop_count}")

    if protocol == "tcp":
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        if bind_ip:
            sock.bind((bind_ip, 0))
        try:
            sock.connect((host, port))
            print(f"[+] Connected TCP stream to {host}:{port}")
        except ConnectionRefusedError:
            print(f"[!] Connection refused by {host}:{port}. Ensure the LOG AI service is running.")
            sys.exit(1)

        try:
            for iteration in range(loop_count):
                for idx, line in enumerate(lines, 1):
                    payload = format_frame(line, "tcp", framing)
                    sock.sendall(payload)
                    total_sent += 1
                    total_bytes += len(payload)
                    print(f"  -> [{total_sent}] Sent {len(payload)} bytes: {line[:70]}...")
                    if delay > 0:
                        time.sleep(delay)
        finally:
            sock.close()

    else:
        # UDP Mode
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        if bind_ip:
            sock.bind((bind_ip, 0))
        try:
            for iteration in range(loop_count):
                for idx, line in enumerate(lines, 1):
                    payload = format_frame(line, "udp", "none")
                    sock.sendto(payload, (host, port))
                    total_sent += 1
                    total_bytes += len(payload)
                    print(f"  -> [{total_sent}] Sent UDP {len(payload)} bytes: {line[:70]}...")
                    if delay > 0:
                        time.sleep(delay)
        finally:
            sock.close()

    elapsed = max(0.001, time.time() - start_time)
    print(f"\n[+] Replay complete: {total_sent} events ({total_bytes} bytes) transmitted in {elapsed:.2f}s ({total_sent / elapsed:.1f} EPS).")


def main():
    parser = argparse.ArgumentParser(
        description="LOG AI Syslog Telemetry Replay Utility",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--file", "-f", help="Path to raw log file (defaults to built-in 8-line dataset)")
    parser.add_argument("--protocol", "-p", choices=["tcp", "udp"], default="tcp", help="Transport protocol (default: tcp)")
    parser.add_argument("--host", default="127.0.0.1", help="Target receiver host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=5514, help="Target receiver port (default: 5514)")
    parser.add_argument("--rate", "-r", type=float, default=10.0, help="Transmission rate in messages/sec (default: 10.0)")
    parser.add_argument("--framing", choices=["newline", "octet-counted"], default="newline", help="TCP framing mode (default: newline)")
    parser.add_argument("--bind-ip", help="Optional local source IP to bind socket to")
    parser.add_argument("--loop", type=int, default=1, help="Number of replay loops (default: 1)")

    args = parser.parse_args()
    lines = load_log_lines(args.file)
    run_replay(
        lines=lines,
        protocol=args.protocol,
        host=args.host,
        port=args.port,
        rate=args.rate,
        framing=args.framing,
        bind_ip=args.bind_ip,
        loop_count=args.loop,
    )


if __name__ == "__main__":
    main()
