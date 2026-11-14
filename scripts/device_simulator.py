#!/usr/bin/env python3
"""
================================================================================
LOG.AI - SIMULATED DEVICE & TELEMETRY GENERATOR
================================================================================
DISCLAIMER: THIS IS A SIMULATED DEVICE FOR TESTING, DEMO, AND INTEGRATION
PURPOSES. IT EMITS ARTIFICIAL LOG LINES AND IS NOT A REAL NETWORK APPLIANCE,
FIREWALL, OR PRODUCTION SERVER.

This simulator runs continuously and emits realistic log entries in the formats
supported by the Log.AI vendor and dynamic parsers:
  - Cisco ASA (Firewall access-list permits / denies)
  - Fortinet FortiGate (Key-value traffic & security logs)
  - Suricata IDS/IPS (EVE JSON format alerts)
  - pfSense (CSV filterlog format)
  - Linux Host Security (sshd authentication & sudo privilege escalation)

Traffic Patterns:
  - Baseline benign traffic: Emitted at random intervals (default: 1-5 logs/sec,
    random delay between 0.2s and 1.0s).
  - Periodic Attack Bursts: Every N minutes (default: 3 minutes), an attack burst
    is randomly injected:
      1. SSH Brute Force: High-frequency authentication failures from a single IP.
      2. Port Scan: Single IP probing many distinct destination ports.
      3. Distributed Fan-In: Multiple distinct IPs targeting a single destination.

Output Targets:
  --tcp host:port          Direct syslog stream over TCP socket.
  --https URL --api-key K  HTTP POST batches to Log.AI agent ingest endpoint.
  --seed N                 Deterministic random seed for reproducible demos.
================================================================================
"""

import sys
import time
import json
import random
import socket
import urllib.request
import urllib.error
import argparse
from datetime import datetime, timezone

# Realistic IP pools
INTERNAL_HOSTS = [
    "10.0.0.5",
    "10.0.0.12",
    "10.0.0.25",
    "192.168.1.10",
    "192.168.1.50",
    "192.168.1.100",
]

EXTERNAL_BENIGN_IPS = [
    "93.184.216.34",
    "151.101.65.140",
    "140.82.112.4",
    "172.217.16.206",
    "104.244.42.1",
    "185.199.108.153",
]

ATTACKER_IPS = [
    "198.51.100.77",
    "203.0.113.45",
    "198.51.100.123",
    "203.0.113.89",
    "198.51.100.201",
    "185.220.101.5",
    "45.146.164.110",
]

COMMON_SERVICES = [
    (80, "TCP", "HTTP"),
    (443, "TCP", "HTTPS"),
    (53, "UDP", "DNS"),
    (22, "TCP", "SSH"),
    (8080, "TCP", "HTTP-ALT"),
]

SCAN_PORTS = [
    21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445,
    993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 8080, 8443,
]

USERS = ["admin", "root", "deploy", "ubuntu", "analyst", "svc_backup"]

def get_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_bsd_timestamp() -> str:
    # MMM DD HH:MM:SS
    return datetime.now().strftime("%b %d %H:%M:%S")

# ------------------------------------------------------------------------------
# Log Format Generators
# ------------------------------------------------------------------------------

def generate_cisco_asa(src_ip: str, dst_ip: str, src_port: int, dst_port: int, action: str = "Deny") -> str:
    """Generate realistic Cisco ASA firewall log line."""
    acl_name = "outside_access_in"
    msg_id = "106023" if action.lower() == "deny" else "302013"
    sev = "4" if action.lower() == "deny" else "6"
    return f"%ASA-{sev}-{msg_id}: {action} tcp src outside:{src_ip}/{src_port} dst inside:{dst_ip}/{dst_port} by access-group \"{acl_name}\""

def generate_fortigate(src_ip: str, dst_ip: str, src_port: int, dst_port: int, action: str = "accept", level: str = "notice") -> str:
    """Generate realistic Fortinet FortiGate traffic log line."""
    now = datetime.now()
    d_str = now.strftime("%Y-%m-%d")
    t_str = now.strftime("%H:%M:%S")
    policy_id = random.randint(1, 99)
    return (
        f'date={d_str} time={t_str} devname="FG-CORP-FW01" devid="FGT60D4614041234" '
        f'type="traffic" level="{level}" srcip={src_ip} srcport={src_port} '
        f'dstip={dst_ip} dstport={dst_port} proto=6 action="{action}" '
        f'policyid={policy_id} service="TCP_{dst_port}"'
    )

def generate_suricata(src_ip: str, dst_ip: str, src_port: int, dst_port: int, signature: str = "ET SCAN Potential SSH Scan", severity: int = 2) -> str:
    """Generate realistic Suricata EVE JSON alert log line."""
    payload = {
        "timestamp": get_iso_now(),
        "event_type": "alert",
        "src_ip": src_ip,
        "src_port": src_port,
        "dest_ip": dst_ip,
        "dest_port": dst_port,
        "proto": "TCP",
        "alert": {
            "action": "allowed",
            "gid": 1,
            "signature_id": 2000000 + random.randint(100, 999),
            "rev": 1,
            "signature": signature,
            "category": "Attempted Information Leak" if severity <= 2 else "Generic Protocol Traffic",
            "severity": severity,
        },
    }
    return json.dumps(payload)

def generate_pfsense(src_ip: str, dst_ip: str, src_port: int, dst_port: int, action: str = "pass") -> str:
    """Generate realistic pfSense filterlog CSV line."""
    rule_num = random.randint(100, 999)
    # pfSense filterlog CSV schema
    return f"filterlog: 4,,,100000{rule_num},em0,match,{action},in,4,0x0,,64,0,0,DF,6,tcp,60,{src_ip},{dst_ip},{src_port},{dst_port},0,S,12345678,,65535,,"

def generate_linux_auth(src_ip: str, user: str = "admin", success: bool = False) -> str:
    """Generate realistic Linux sshd authentication log line."""
    ts = get_bsd_timestamp()
    pid = random.randint(10000, 32000)
    port = random.randint(30000, 65000)
    if success:
        return f"{ts} prod-gw sshd[{pid}]: Accepted publickey for {user} from {src_ip} port {port} ssh2"
    else:
        return f"{ts} prod-gw sshd[{pid}]: Failed password for invalid user {user} from {src_ip} port {port} ssh2"

def generate_linux_sudo(user: str = "admin", command: str = "/bin/bash") -> str:
    """Generate realistic Linux sudo execution log line."""
    ts = get_bsd_timestamp()
    pid = random.randint(1000, 9999)
    return f"{ts} prod-gw sudo[{pid}]: {user} : TTY=pts/0 ; PWD=/home/{user} ; USER=root ; COMMAND={command}"

# ------------------------------------------------------------------------------
# Pattern Builders
# ------------------------------------------------------------------------------

def generate_benign_event() -> str:
    """Generate a single benign event from one of the supported vendors."""
    fmt = random.choice(["cisco", "fortigate", "suricata", "pfsense", "linux_auth", "linux_sudo"])
    src_ip = random.choice(EXTERNAL_BENIGN_IPS)
    dst_ip = random.choice(INTERNAL_HOSTS)
    dst_port, proto, svc = random.choice(COMMON_SERVICES)
    src_port = random.randint(1024, 65000)

    if fmt == "cisco":
        return generate_cisco_asa(src_ip, dst_ip, src_port, dst_port, action="Permit")
    elif fmt == "fortigate":
        return generate_fortigate(src_ip, dst_ip, src_port, dst_port, action="accept", level="notice")
    elif fmt == "suricata":
        return generate_suricata(src_ip, dst_ip, src_port, dst_port, signature=f"GPL {svc} Traffic Flow", severity=4)
    elif fmt == "pfsense":
        return generate_pfsense(src_ip, dst_ip, src_port, dst_port, action="pass")
    elif fmt == "linux_auth":
        return generate_linux_auth(src_ip, user=random.choice(USERS), success=True)
    elif fmt == "linux_sudo":
        cmds = ["/bin/systemctl status nginx", "/bin/ls /var/log", "/usr/bin/uptime", "/bin/cat /etc/hosts"]
        return generate_linux_sudo(user=random.choice(USERS), command=random.choice(cmds))
    return generate_cisco_asa(src_ip, dst_ip, src_port, dst_port, action="Permit")

def generate_burst_ssh_brute_force(attacker_ip: str, target_ip: str, count: int = 20) -> list[str]:
    """Generate SSH brute-force attack burst from a single source."""
    lines = []
    fake_users = ["admin", "root", "oracle", "test", "support", "guest", "ubuntu", "git", "user"]
    for _ in range(count):
        user = random.choice(fake_users)
        lines.append(generate_linux_auth(attacker_ip, user=user, success=False))
        # Mix in Suricata SSH alert
        if random.random() > 0.6:
            lines.append(generate_suricata(attacker_ip, target_ip, random.randint(30000, 65000), 22, signature="ET SCAN Potential SSH Brute Force", severity=1))
    return lines

def generate_burst_port_scan(attacker_ip: str, target_ip: str) -> list[str]:
    """Generate port scan burst hitting multiple ports on a target."""
    lines = []
    sampled_ports = random.sample(SCAN_PORTS, min(16, len(SCAN_PORTS)))
    for port in sampled_ports:
        sport = random.randint(1024, 65000)
        # Mix Cisco denies and pfSense blocks
        if random.random() > 0.5:
            lines.append(generate_cisco_asa(attacker_ip, target_ip, sport, port, action="Deny"))
        else:
            lines.append(generate_pfsense(attacker_ip, target_ip, sport, port, action="block"))
    # Add a Suricata scan detection alert
    lines.append(generate_suricata(attacker_ip, target_ip, random.randint(1024, 65000), 80, signature="ET SCAN Nmap Scripting Engine User-Agent Detected", severity=2))
    return lines

def generate_burst_fan_in(target_ip: str, source_count: int = 12) -> list[str]:
    """Generate fan-in burst: many distinct sources targeting one destination."""
    lines = []
    sources = set()
    while len(sources) < source_count:
        ip = f"{random.randint(198, 203)}.{random.randint(50, 150)}.{random.randint(1, 250)}.{random.randint(1, 250)}"
        sources.add(ip)

    for src_ip in sources:
        sport = random.randint(1024, 65000)
        lines.append(generate_cisco_asa(src_ip, target_ip, sport, 445, action="Deny"))
        if random.random() > 0.5:
            lines.append(generate_fortigate(src_ip, target_ip, sport, 445, action="deny", level="warning"))
    return lines

# ------------------------------------------------------------------------------
# Emitter Sinks
# ------------------------------------------------------------------------------

class SyslogTcpClient:
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.sock = None

    def connect(self):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(5.0)
            self.sock.connect((self.host, self.port))
            print(f"[*] Connected to Syslog TCP target at {self.host}:{self.port}")
        except Exception as e:
            print(f"[!] Failed to connect to Syslog TCP {self.host}:{self.port}: {e}")
            self.sock = None

    def emit(self, line: str):
        if not self.sock:
            self.connect()
        if self.sock:
            try:
                self.sock.sendall((line.strip() + "\n").encode("utf-8"))
            except Exception as e:
                print(f"[!] TCP send error ({e}), will reconnect on next log.")
                try:
                    self.sock.close()
                except Exception:
                    pass
                self.sock = None

    def close(self):
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass

class HttpAgentClient:
    def __init__(self, url: str, api_key: str):
        self.url = url
        self.api_key = api_key

    def emit_batch(self, lines: list[str]) -> bool:
        if not lines:
            return True
        payload = ("\n".join(lines) + "\n").encode("utf-8")
        headers = {
            "Content-Type": "text/plain",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "LogAI-DeviceSimulator/1.0",
        }
        req = urllib.request.Request(self.url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                status = resp.getcode()
                return 200 <= status < 300
        except urllib.error.HTTPError as e:
            print(f"[!] HTTP POST failed: {e.code} {e.reason}")
            return False
        except Exception as e:
            print(f"[!] HTTP POST error: {e}")
            return False

# ------------------------------------------------------------------------------
# Main Simulation Loop
# ------------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Log.AI Simulated Telemetry Device (Cisco, FortiGate, Suricata, pfSense, Linux)"
    )
    parser.add_argument("--tcp", type=str, default=None, help="Syslog TCP target host:port (e.g. 127.0.0.1:5514)")
    parser.add_argument("--https", type=str, default=None, help="HTTP/HTTPS agent ingest URL (e.g. http://127.0.0.1:8000/api/v1/ingest/agent)")
    parser.add_argument("--api-key", type=str, default=None, help="Log.AI Agent Ingestion API Key (Bearer token)")
    parser.add_argument("--seed", type=int, default=None, help="Deterministic random seed for reproducible runs")
    parser.add_argument("--interval-min", type=float, default=0.2, help="Min seconds between baseline logs (default: 0.2)")
    parser.add_argument("--interval-max", type=float, default=1.0, help="Max seconds between baseline logs (default: 1.0)")
    parser.add_argument("--burst-interval-min", type=float, default=3.0, help="Interval in minutes between attack bursts (default: 3.0)")
    parser.add_argument("--stdout", action="store_true", help="Print emitted logs to stdout in addition to network targets")

    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)
        print(f"[*] Seeded random number generator with: {args.seed}")

    tcp_client = None
    if args.tcp:
        if ":" not in args.tcp:
            print("[!] Error: --tcp must be in host:port format.")
            sys.exit(1)
        host, port_str = args.tcp.split(":", 1)
        tcp_client = SyslogTcpClient(host, int(port_str))
        tcp_client.connect()

    http_client = None
    if args.https:
        if not args.api_key:
            print("[!] Warning: --https specified without --api-key. Requests may be rejected.")
        http_client = HttpAgentClient(args.https, args.api_key or "")

    if not tcp_client and not http_client and not args.stdout:
        print("[!] No output sink specified (--tcp, --https, or --stdout). Defaulting to --stdout.")
        args.stdout = True

    print("=" * 72)
    print("LOG.AI SIMULATED DEVICE RUNNING")
    print("SIMULATED LOG TELEMETRY GENERATOR - NOT A REAL PRODUCTION DEVICE")
    print(f"  Baseline Delay: {args.interval_min}s - {args.interval_max}s")
    print(f"  Attack Burst Interval: {args.burst_interval_min} minutes")
    if tcp_client:
        print(f"  Target TCP Syslog: {args.tcp}")
    if http_client:
        print(f"  Target Agent URL:  {args.https}")
    print("=" * 72)

    last_burst_time = time.time()
    burst_interval_secs = args.burst_interval_min * 60.0

    total_logs = 0

    try:
        while True:
            now = time.time()

            # Check if it's time for an attack burst
            if now - last_burst_time >= burst_interval_secs:
                last_burst_time = now
                burst_type = random.choice(["ssh_brute_force", "port_scan", "fan_in"])
                target_ip = random.choice(INTERNAL_HOSTS)
                attacker_ip = random.choice(ATTACKER_IPS)

                print(f"\n[>>>] INJECTING ATTACK BURST: {burst_type.upper()} against {target_ip} at {datetime.now().strftime('%H:%M:%S')}")

                if burst_type == "ssh_brute_force":
                    burst_lines = generate_burst_ssh_brute_force(attacker_ip, target_ip, count=18)
                elif burst_type == "port_scan":
                    burst_lines = generate_burst_port_scan(attacker_ip, target_ip)
                else:
                    burst_lines = generate_burst_fan_in(target_ip, source_count=14)

                # Emit burst lines
                if http_client:
                    http_client.emit_batch(burst_lines)
                for bl in burst_lines:
                    if tcp_client:
                        tcp_client.emit(bl)
                    if args.stdout:
                        print(f"  [BURST] {bl}")
                    total_logs += 1

                print(f"[<<<] ATTACK BURST COMPLETED ({len(burst_lines)} logs emitted)\n")

            # Emit baseline benign event
            line = generate_benign_event()
            if tcp_client:
                tcp_client.emit(line)
            if http_client:
                http_client.emit_batch([line])
            if args.stdout:
                print(f"[BENIGN] {line}")

            total_logs += 1
            if total_logs % 100 == 0:
                print(f"[*] Total logs emitted so far: {total_logs}")

            # Sleep baseline delay
            delay = random.uniform(args.interval_min, args.interval_max)
            time.sleep(delay)

    except KeyboardInterrupt:
        print("\n[*] Stopping device simulator. Total logs emitted:", total_logs)
        if tcp_client:
            tcp_client.close()

if __name__ == "__main__":
    main()
