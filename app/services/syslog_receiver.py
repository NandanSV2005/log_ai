"""
Syslog Receiver Service
=======================
High-performance asynchronous syslog daemon accepting live telemetry over TCP (primary)
and UDP (fallback for legacy network appliances).

Framing Support:
- UDP: Exactly one message per datagram.
- TCP: Supports RFC 6587 Octet-Counted framing (e.g. '123 <134>1 2026-10-11T...')
       and newline-delimited framing (\\n or \\r\\n), with streaming reassembly of
       messages split across multiple TCP socket reads.

Safety & Security:
- Source Registry: Drops messages from unregistered IPs to guarantee tenant ownership isolation.
- Rate Limiting: Per-IP sliding-window rate limit prevents queue starvation.
- Payload Safety: Enforces max message size (default 8 KB).
- Queue Protection: Drops and counts messages when the processing queue is full rather than crashing.

Deployment Note:
Binding to privileged port 514 in Linux requires root capabilities or port redirection:
  sudo setcap 'cap_net_bind_service=+ep' $(which python3)
  or iptables port redirect:
  sudo iptables -t nat -A PREROUTING -p udp --dport 514 -j REDIRECT --to-port 5514
  sudo iptables -t nat -A PREROUTING -p tcp --dport 514 -j REDIRECT --to-port 5514
"""

import asyncio
import datetime
import logging
import time
from typing import Dict, Any, List, Optional, Tuple

from app.config import settings
from app.database import SessionLocal, LogSource
from app.services.ingest_service import process_raw_ingestion
from app.services.queue import queue_manager

logger = logging.getLogger("log_ai.syslog")


def clean_ip(ip_str: str) -> str:
    """Normalizes IPv4-mapped IPv6 and localhost addresses."""
    if not ip_str:
        return "127.0.0.1"
    if ip_str.startswith("::ffff:"):
        ip_str = ip_str[7:]
    if ip_str == "::1":
        ip_str = "127.0.0.1"
    return ip_str


def extract_tcp_messages(buffer: bytearray, max_msg_bytes: int) -> Tuple[List[bytes], bytearray, int]:
    """
    Extracts complete syslog messages from a persistent TCP socket buffer.
    Handles RFC 6587 octet-counted framing, newline-delimited framing, and
    messages split across multiple TCP chunk reads.
    """
    messages: List[bytes] = []
    oversize_count = 0

    while buffer:
        # Check for RFC 6587 Octet-Counted Framing: starts with digits followed by space
        pos = 0
        while pos < len(buffer) and chr(buffer[pos]).isdigit():
            pos += 1

        if pos > 0 and pos < len(buffer) and buffer[pos] == ord(' '):
            try:
                msg_len = int(buffer[:pos].decode('ascii'))
            except (ValueError, UnicodeDecodeError):
                msg_len = -1

            if msg_len >= 0:
                header_len = pos + 1
                total_len = header_len + msg_len
                if len(buffer) >= total_len:
                    msg = bytes(buffer[header_len:total_len])
                    if len(msg) > max_msg_bytes:
                        oversize_count += 1
                    else:
                        messages.append(msg)
                    del buffer[:total_len]
                    # Strip any optional separator carriage returns, newlines, or spaces
                    while buffer and buffer[0] in (ord(' '), ord('\r'), ord('\n'), ord('\t')):
                        del buffer[0]
                    continue
                else:
                    # Message is split across reads; wait for remaining bytes
                    if msg_len > max_msg_bytes:
                        oversize_count += 1
                        del buffer[:]
                    break

        # Delimited framing: check for newline
        nl_pos = buffer.find(b'\n')
        if nl_pos != -1:
            msg = bytes(buffer[:nl_pos]).rstrip(b'\r')
            del buffer[:nl_pos + 1]
            if len(msg) > max_msg_bytes:
                oversize_count += 1
            elif msg.strip():
                messages.append(msg)
            continue

        # No delimiter or octet-count header match yet
        if len(buffer) > max_msg_bytes:
            oversize_count += 1
            del buffer[:]
        break

    return messages, buffer, oversize_count


class SyslogUdpProtocol(asyncio.DatagramProtocol):
    def __init__(self, receiver: "SyslogReceiver"):
        self.receiver = receiver

    def connection_made(self, transport: asyncio.DatagramTransport):
        self.transport = transport

    def datagram_received(self, data: bytes, addr: Tuple[str, int]):
        asyncio.create_task(self.receiver.handle_udp_datagram(data, addr))

    def error_received(self, exc: Exception):
        logger.warning("Syslog UDP socket error: %s", exc)


class SyslogReceiver:
    def __init__(self):
        self.tcp_server: Optional[asyncio.Server] = None
        self.udp_transport: Optional[asyncio.DatagramTransport] = None
        self.udp_protocol: Optional[SyslogUdpProtocol] = None
        
        self.listening_tcp_port: Optional[int] = None
        self.listening_udp_port: Optional[int] = None

        self.counters = {
            "total_received": 0,
            "accepted": 0,
            "dropped_unregistered": 0,
            "dropped_oversize": 0,
            "dropped_queue_full": 0,
        }

        # IP -> ISO-8601 UTC timestamp of last received message
        self.last_message_time: Dict[str, str] = {}

        # Per-IP rate limiting: ip -> (window_start_timestamp, count_in_window)
        self._rate_limits: Dict[str, Tuple[float, int]] = {}
        self._lock = asyncio.Lock()

    def get_status(self, owner_username: Optional[str] = None) -> Dict[str, Any]:
        """Returns receiver status, listening ports, operational counters, and per-source timestamps."""
        db = SessionLocal()
        user_sources = []
        try:
            if owner_username:
                user_sources = (
                    db.query(LogSource)
                    .filter(LogSource.owner_username == owner_username)
                    .all()
                )
            else:
                user_sources = db.query(LogSource).all()
        finally:
            db.close()

        source_timestamps = {}
        for s in user_sources:
            source_timestamps[s.source_ip] = self.last_message_time.get(s.source_ip, None)

        return {
            "listening_ports": {
                "tcp": self.listening_tcp_port,
                "udp": self.listening_udp_port,
            },
            "total_received": self.counters["total_received"],
            "accepted": self.counters["accepted"],
            "dropped_unregistered": self.counters["dropped_unregistered"],
            "dropped_oversize": self.counters["dropped_oversize"],
            "dropped_queue_full": self.counters["dropped_queue_full"],
            "last_message_time_by_source": source_timestamps,
        }

    def _check_rate_limit(self, client_ip: str) -> bool:
        """Returns True if within rate limit, False if rate exceeded."""
        now = time.monotonic()
        window_start, count = self._rate_limits.get(client_ip, (now, 0))
        if now - window_start < 1.0:
            if count >= settings.SYSLOG_RATE_LIMIT_PER_SEC:
                return False
            self._rate_limits[client_ip] = (window_start, count + 1)
        else:
            self._rate_limits[client_ip] = (now, 1)
        return True

    def _lookup_owner(self, client_ip: str) -> Optional[str]:
        """Resolves the owner_username for a registered perimeter source IP."""
        db = SessionLocal()
        try:
            record = db.query(LogSource).filter(LogSource.source_ip == client_ip).first()
            if record:
                return record.owner_username
            return None
        finally:
            db.close()

    async def _dispatch_message(self, msg_bytes: bytes, client_ip: str):
        """Validates ownership, rate limits, queue capacity, and ingests message."""
        self.counters["total_received"] += 1

        # 1. Enforce max message size
        if len(msg_bytes) > settings.SYSLOG_MAX_MSG_BYTES:
            self.counters["dropped_oversize"] += 1
            return

        # 2. Check source registry ownership
        owner = self._lookup_owner(client_ip)
        if not owner:
            self.counters["dropped_unregistered"] += 1
            if self.counters["dropped_unregistered"] % 25 == 1:
                logger.info("Dropped syslog message from unregistered source: %s", client_ip)
            return

        # 3. Check per-IP rate limit
        if not self._check_rate_limit(client_ip):
            logger.debug("Dropped syslog message due to per-IP rate cap: %s", client_ip)
            return

        # 4. Check queue capacity
        if queue_manager.queue.full():
            self.counters["dropped_queue_full"] += 1
            logger.warning("Queue full: dropping incoming syslog message from %s", client_ip)
            return

        # 5. Ingest through sovereign ingestion pipeline
        try:
            await process_raw_ingestion(
                raw_payload_bytes=msg_bytes,
                owner_username=owner,
                client_host=client_ip,
                content_type="text/plain",
                format_override="syslog",
            )
            self.counters["accepted"] += 1
            self.last_message_time[client_ip] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        except Exception as exc:
            logger.error("Error processing syslog message from %s: %s", client_ip, exc)

    async def handle_udp_datagram(self, data: bytes, addr: Tuple[str, int]):
        """Handles single UDP datagram from network."""
        client_ip = clean_ip(addr[0])
        await self._dispatch_message(data.strip(), client_ip)

    async def handle_tcp_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handles streaming TCP connection with RFC 6587 octet counting & newline framing."""
        peer = writer.get_extra_info("peername")
        client_ip = clean_ip(peer[0]) if peer else "127.0.0.1"

        buffer = bytearray()
        try:
            while not reader.at_eof():
                chunk = await reader.read(4096)
                if not chunk:
                    break
                buffer.extend(chunk)

                msgs, buffer, oversize = extract_tcp_messages(buffer, settings.SYSLOG_MAX_MSG_BYTES)
                if oversize > 0:
                    self.counters["dropped_oversize"] += oversize

                for msg in msgs:
                    await self._dispatch_message(msg, client_ip)

            # Process any remaining un-delimited buffer on EOF
            if buffer:
                remaining = bytes(buffer).strip()
                if remaining:
                    if len(remaining) > settings.SYSLOG_MAX_MSG_BYTES:
                        self.counters["dropped_oversize"] += 1
                    else:
                        await self._dispatch_message(remaining, client_ip)
        except Exception as exc:
            logger.debug("Syslog TCP client connection closed: %s (%s)", client_ip, exc)
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    async def start(
        self,
        host: Optional[str] = None,
        tcp_port: Optional[int] = None,
        udp_port: Optional[int] = None,
    ):
        """Starts both TCP and UDP listening daemons."""
        bind_host = host or settings.SYSLOG_HOST
        t_port = tcp_port if tcp_port is not None else settings.SYSLOG_TCP_PORT
        u_port = udp_port if udp_port is not None else settings.SYSLOG_UDP_PORT

        loop = asyncio.get_running_loop()

        # 1. Start TCP listener
        try:
            self.tcp_server = await asyncio.start_server(
                self.handle_tcp_client,
                host=bind_host,
                port=t_port,
            )
            # Retrieve actual bound port (important when t_port == 0)
            sockets = self.tcp_server.sockets
            if sockets:
                self.listening_tcp_port = sockets[0].getsockname()[1]
            else:
                self.listening_tcp_port = t_port
            logger.info("Syslog TCP receiver listening on %s:%d", bind_host, self.listening_tcp_port)
        except Exception as exc:
            logger.error("Failed to start Syslog TCP receiver on %s:%d: %s", bind_host, t_port, exc)
            self.tcp_server = None

        # 2. Start UDP listener
        try:
            self.udp_protocol = SyslogUdpProtocol(self)
            transport, _ = await loop.create_datagram_endpoint(
                lambda: self.udp_protocol,
                local_addr=(bind_host, u_port),
            )
            self.udp_transport = transport
            sock = transport.get_extra_info("socket")
            if sock:
                self.listening_udp_port = sock.getsockname()[1]
            else:
                self.listening_udp_port = u_port
            logger.info("Syslog UDP receiver listening on %s:%d", bind_host, self.listening_udp_port)
        except Exception as exc:
            logger.error("Failed to start Syslog UDP receiver on %s:%d: %s", bind_host, u_port, exc)
            self.udp_transport = None

    async def stop(self):
        """Gracefully shuts down TCP server and UDP transport."""
        if self.tcp_server:
            self.tcp_server.close()
            await self.tcp_server.wait_closed()
            self.tcp_server = None
            self.listening_tcp_port = None

        if self.udp_transport:
            self.udp_transport.close()
            self.udp_transport = None
            self.listening_udp_port = None

        logger.info("Syslog receiver service stopped.")


syslog_receiver = SyslogReceiver()
