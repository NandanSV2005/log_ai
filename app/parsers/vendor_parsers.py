import re
import json
import datetime
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any

from app.normalization.schema import UnifiedEvent

class BaseVendorParser(ABC):
    @abstractmethod
    def matches(self, raw_line: str) -> bool:
        """Returns True if the raw log line matches this vendor format."""
        pass

    @abstractmethod
    def parse(self, raw_line: str) -> UnifiedEvent:
        """Parses the raw log line into a normalized UnifiedEvent object."""
        pass

class CiscoASAParser(BaseVendorParser):
    ASA_PATTERN = re.compile(
        r"%ASA-(?P<severity>\d)-(?P<msg_id>\d+):\s*(?P<msg>.*)",
        re.IGNORECASE,
    )
    IP_PORT_PATTERN = re.compile(
        r"(?P<ip>(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?:/(?P<port>\d+))?"
    )

    def matches(self, raw_line: str) -> bool:
        return "%ASA-" in raw_line

    def parse(self, raw_line: str) -> UnifiedEvent:
        match = self.ASA_PATTERN.search(raw_line)
        if not match:
            return UnifiedEvent(original_event=raw_line, timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat())

        gd = match.groupdict()
        sev_num = int(gd["severity"])
        sev_map = {1: "Critical", 2: "Critical", 3: "Error", 4: "Warning", 5: "Informational", 6: "Informational", 7: "Debug"}
        severity = sev_map.get(sev_num, "Informational")

        msg = gd["msg"]

        # Action determination
        action = "deny" if any(w in msg.lower() for w in ["deny", "denied"]) else "permit"
        
        # IP extraction
        ips = self.IP_PORT_PATTERN.findall(msg)
        src_ip = ips[0][0] if len(ips) >= 1 else None
        dst_ip = ips[1][0] if len(ips) >= 2 else None

        # ACL Name extraction if present
        acl_match = re.search(r'access-group\s+"([^"]+)"', msg)
        acl_name = acl_match.group(1) if acl_match else f"ASA-{gd['msg_id']}"

        return UnifiedEvent(
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            source_ip=src_ip,
            destination_ip=dst_ip,
            event_type=f"cisco_asa:{action}:{acl_name}",
            severity=severity,
            original_event=raw_line,
        )

class FortinetParser(BaseVendorParser):
    KV_PATTERN = re.compile(r'\b([a-zA-Z0-9_\-]+)=([^\s"\'=]+|"[^"]*"|\'[^\']*\')')

    def matches(self, raw_line: str) -> bool:
        return "devname=" in raw_line or "fortigate" in raw_line.lower() or ("srcip=" in raw_line and "dstip=" in raw_line)

    def parse(self, raw_line: str) -> UnifiedEvent:
        kv = {}
        for match in self.KV_PATTERN.finditer(raw_line):
            k, v = match.groups()
            kv[k] = v.strip("\"'")

        src_ip = kv.get("srcip") or kv.get("src")
        dst_ip = kv.get("dstip") or kv.get("dst")
        action = kv.get("action") or "traffic"
        policy_id = kv.get("policyid") or kv.get("policy_id") or "0"

        # Timestamp from date & time keys
        date_str = kv.get("date")
        time_str = kv.get("time")
        if date_str and time_str:
            timestamp = f"{date_str}T{time_str}Z"
        else:
            timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        level = (kv.get("level") or "notice").lower()
        level_map = {"emergency": "Critical", "alert": "Critical", "critical": "Critical", "error": "Error", "warning": "Warning", "notice": "Informational", "info": "Informational", "debug": "Debug"}
        severity = level_map.get(level, "Informational")

        event_type = f"fortinet:{action}:policy_{policy_id}"

        return UnifiedEvent(
            timestamp=timestamp,
            source_ip=src_ip,
            destination_ip=dst_ip,
            event_type=event_type,
            severity=severity,
            original_event=raw_line,
        )

class SuricataParser(BaseVendorParser):
    def matches(self, raw_line: str) -> bool:
        stripped = raw_line.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            return '"event_type": "alert"' in stripped or '"alert":' in stripped or '"suricata"' in stripped.lower()
        return False

    def parse(self, raw_line: str) -> UnifiedEvent:
        data = json.loads(raw_line.strip())
        alert = data.get("alert", {})

        signature = alert.get("signature") or alert.get("category") or "suricata_alert"
        severity_num = alert.get("severity", 3)
        sev_map = {1: "Critical", 2: "Error", 3: "Warning", 4: "Informational"}
        severity = sev_map.get(severity_num, "Warning")

        return UnifiedEvent(
            timestamp=data.get("timestamp") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
            source_ip=data.get("src_ip"),
            destination_ip=data.get("dest_ip"),
            event_type=f"suricata:{signature}",
            severity=severity,
            original_event=raw_line,
        )

class PfSenseParser(BaseVendorParser):
    def matches(self, raw_line: str) -> bool:
        return "filterlog[" in raw_line or "filterlog:" in raw_line

    def parse(self, raw_line: str) -> UnifiedEvent:
        # Extract payload after filterlog[...]:
        parts = raw_line.split("filterlog", 1)
        csv_payload = parts[1].split(":", 1)[-1].strip() if len(parts) > 1 else raw_line

        cols = [c.strip() for c in csv_payload.split(",")]

        # Indices in pfSense filterlog format:
        # 4: interface, 6: action (pass/block), 16: protocol, 18: src_ip, 19: dst_ip
        interface = cols[4] if len(cols) > 4 else "unknown"
        action = cols[6] if len(cols) > 6 else "filter"
        protocol = cols[16] if len(cols) > 16 else "ip"
        src_ip = cols[18] if len(cols) > 18 else None
        dst_ip = cols[19] if len(cols) > 19 else None

        severity = "Warning" if action == "block" else "Informational"

        return UnifiedEvent(
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            source_ip=src_ip,
            destination_ip=dst_ip,
            event_type=f"pfsense:{action}:{interface}:{protocol}",
            severity=severity,
            original_event=raw_line,
        )

class SyslogVendorParser(BaseVendorParser):
    RFC5424_PATTERN = re.compile(
        r"^<(?P<pri>\d{1,3})>(?P<version>\d+)\s+"
        r"(?P<timestamp>\S+)\s+"
        r"(?P<hostname>\S+)\s+"
        r"(?P<app_name>\S+)\s+"
        r"(?P<procid>\S+)\s+"
        r"(?P<msgid>\S+)\s+"
        r"(?P<msg>.*)$"
    )

    def matches(self, raw_line: str) -> bool:
        return bool(re.match(r"^<\d{1,3}>", raw_line.strip()))

    def parse(self, raw_line: str) -> UnifiedEvent:
        m = self.RFC5424_PATTERN.match(raw_line.strip())
        if m:
            gd = m.groupdict()
            pri = int(gd["pri"])
            sev_num = pri % 8
            sev_map = {0: "Critical", 1: "Critical", 2: "Critical", 3: "Error", 4: "Warning", 5: "Informational", 6: "Informational", 7: "Debug"}
            
            hostname = gd["hostname"]
            src_ip = hostname if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname) else None

            return UnifiedEvent(
                timestamp=gd["timestamp"],
                source_ip=src_ip,
                destination_ip=None,
                event_type=gd["app_name"] if gd["app_name"] != "-" else "syslog_event",
                severity=sev_map.get(sev_num, "Informational"),
                original_event=raw_line,
            )
        
        # Generic <PRI> fallback
        pri_match = re.match(r"^<(?P<pri>\d{1,3})>(?P<msg>.*)$", raw_line.strip())
        pri = int(pri_match.group("pri")) if pri_match else 13
        return UnifiedEvent(
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            source_ip=None,
            destination_ip=None,
            event_type="syslog_generic",
            severity="Informational",
            original_event=raw_line,
        )

class CEFVendorParser(BaseVendorParser):
    CEF_PATTERN = re.compile(
        r"CEF:(?P<version>\d+)\|(?P<vendor>[^|]*)\|(?P<product>[^|]*)\|(?P<dev_version>[^|]*)\|(?P<sig_id>[^|]*)\|(?P<name>[^|]*)\|(?P<severity>[^|]*)\|(?:(?P<extension>.*))?$"
    )

    def matches(self, raw_line: str) -> bool:
        return "CEF:" in raw_line

    def parse(self, raw_line: str) -> UnifiedEvent:
        match = self.CEF_PATTERN.search(raw_line)
        if not match:
            return UnifiedEvent(original_event=raw_line, timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat())

        gd = match.groupdict()
        ext = gd.get("extension", "") or ""
        kv = {}
        for m in re.finditer(r'\b([a-zA-Z0-9_\-]+)=([^\s"\'=]+|"[^"]*"|\'[^\']*\')', ext):
            k, v = m.groups()
            kv[k] = v.strip("\"'")

        src_ip = kv.get("src") or kv.get("sourceAddress") or kv.get("source_ip")
        dst_ip = kv.get("dst") or kv.get("destinationAddress") or kv.get("destination_ip")
        ts = kv.get("rt") or datetime.datetime.now(datetime.timezone.utc).isoformat()

        sev_raw = gd.get("severity", "Informational").upper()
        sev_map = {"HIGH": "Critical", "MEDIUM": "Error", "LOW": "Warning"}
        severity = sev_map.get(sev_raw, gd.get("severity") or "Informational")

        return UnifiedEvent(
            timestamp=ts,
            source_ip=src_ip,
            destination_ip=dst_ip,
            event_type=gd.get("name") or gd.get("product") or "cef_event",
            severity=severity,
            original_event=raw_line,
        )

class VendorParserRegistry:
    """Registry managing ordered list of Stage 1 fast-path vendor parsers."""
    def __init__(self):
        self.parsers: List[BaseVendorParser] = [
            SuricataParser(),
            CiscoASAParser(),
            FortinetParser(),
            PfSenseParser(),
            CEFVendorParser(),
            SyslogVendorParser(),
        ]

    def register(self, parser: BaseVendorParser):
        self.parsers.insert(0, parser)

    def parse(self, raw_line: str) -> Optional[UnifiedEvent]:
        for parser in self.parsers:
            if parser.matches(raw_line):
                try:
                    return parser.parse(raw_line)
                except Exception:
                    continue
        return None

# Global registry instance
vendor_parser_registry = VendorParserRegistry()
