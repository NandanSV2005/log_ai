import re
import datetime
from typing import List, Optional, Dict, Any

from app.normalization.schema import UnifiedEvent
from app.audit.hash_chain import MerkleTree
from app.parsers.vendor_parsers import vendor_parser_registry, VendorParserRegistry

class DynamicParser:
    """
    Two-stage dynamic log parser:
    - Stage 1 (Fast Path): Iterates through registered Vendor Parsers (Cisco ASA, 
      Fortinet, Suricata, pfSense, Syslog, CEF).
    - Stage 2 (Heuristic Fallback): AI/Heuristic scanner extracting IPs, timestamps, 
      severity levels, key-value pairs, and event categories for unstructured logs.
    """

    IPV4_PATTERN = re.compile(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b")
    ISO_TIMESTAMP_PATTERN = re.compile(
        r"\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b"
    )
    KEY_VALUE_PATTERN = re.compile(r"\b([a-zA-Z_][a-zA-Z0-9_\-\.]*)=([^\s\"']+|\"[^\"]*\"|'[^']*')")

    SEVERITY_MAP = {
        "EMERG": "Critical",
        "EMERGENCY": "Critical",
        "ALERT": "Critical",
        "CRIT": "Critical",
        "CRITICAL": "Critical",
        "FATAL": "Critical",
        "ERR": "Error",
        "ERROR": "Error",
        "WARN": "Warning",
        "WARNING": "Warning",
        "NOTICE": "Informational",
        "INFO": "Informational",
        "INFORMATIONAL": "Informational",
        "DEBUG": "Debug",
        "TRACE": "Debug",
    }

    def __init__(self, registry: Optional[VendorParserRegistry] = None):
        self.registry = registry or vendor_parser_registry

    def parse(self, raw_payload: str) -> List[UnifiedEvent]:
        """Parses a multi-line raw log payload into a list of normalized UnifiedEvent models."""
        lines = [line.strip() for line in raw_payload.splitlines() if line.strip()]
        events: List[UnifiedEvent] = []

        for line in lines:
            event = self.parse_single(line)
            events.append(event)

        return events

    def parse_single(self, raw_line: str) -> UnifiedEvent:
        """Transforms a single raw log string into a normalized UnifiedEvent object."""
        # Compute SHA-256 hash of raw log entry for forensic Merkle chain traceability
        raw_hash = MerkleTree.hash_payload(raw_line)

        # 1. Stage 1: Vendor Parser Registry Fast Path
        event = self.registry.parse(raw_line)

        # 2. Stage 2: Heuristic Fallback if Stage 1 didn't match
        if event is None:
            event = self._stage2_heuristic_fallback(raw_line)

        # Stamp raw_event_hash for tamper-proof Merkle chain traceability
        if not event.raw_event_hash:
            event.raw_event_hash = raw_hash

        return event

    def _stage2_heuristic_fallback(self, raw_line: str) -> UnifiedEvent:
        kv = self._parse_key_values(raw_line)

        # 1. IP extraction (check key-value overrides first, then regex scan)
        src_ip = (
            kv.get("src")
            or kv.get("source_ip")
            or kv.get("source")
            or kv.get("client_ip")
            or kv.get("client")
        )
        dst_ip = (
            kv.get("dst")
            or kv.get("destination_ip")
            or kv.get("destination")
            or kv.get("dest_ip")
            or kv.get("server_ip")
        )

        all_ips = self.IPV4_PATTERN.findall(raw_line)
        if not src_ip and len(all_ips) >= 1:
            src_ip = all_ips[0]
        if not dst_ip and len(all_ips) >= 2:
            dst_ip = all_ips[1]

        # 2. Timestamp extraction
        ts_match = self.ISO_TIMESTAMP_PATTERN.search(raw_line)
        if ts_match:
            timestamp = ts_match.group(0)
        else:
            timestamp = (
                kv.get("timestamp")
                or kv.get("time")
                or datetime.datetime.now(datetime.timezone.utc).isoformat()
            )

        # 3. Severity extraction
        severity = "Informational"
        sev_candidate = (
            kv.get("severity") or kv.get("level") or kv.get("sev") or ""
        ).upper()

        if sev_candidate in self.SEVERITY_MAP:
            severity = self.SEVERITY_MAP[sev_candidate]
        else:
            upper_line = raw_line.upper()
            for kw, norm_sev in self.SEVERITY_MAP.items():
                if f"[{kw}]" in upper_line or f" {kw} " in upper_line or f":{kw}" in upper_line or f"SEVERITY={kw}" in upper_line:
                    severity = norm_sev
                    break

        # 4. Event Type extraction
        event_type = (
            kv.get("event_type")
            or kv.get("event")
            or kv.get("service")
            or kv.get("act")
            or kv.get("action")
            or "unstructured_log"
        )

        return UnifiedEvent(
            timestamp=timestamp,
            source_ip=src_ip,
            destination_ip=dst_ip,
            event_type=event_type,
            severity=severity,
            original_event=raw_line,
        )

    def _parse_key_values(self, text: str) -> Dict[str, str]:
        results = {}
        for match in self.KEY_VALUE_PATTERN.finditer(text):
            k, v = match.groups()
            v_clean = v.strip("\"'")
            results[k] = v_clean
        return results
