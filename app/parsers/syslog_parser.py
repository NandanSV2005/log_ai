import re
import datetime
from typing import List, Dict, Any
from app.parsers.base import BaseLogParser

class SyslogParser(BaseLogParser):
    # RFC 5424: <PRI>1 TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
    RFC5424_REGEX = re.compile(
        r"^<(?P<pri>\d{1,3})>(?P<version>\d+)\s+"
        r"(?P<timestamp>\S+)\s+"
        r"(?P<hostname>\S+)\s+"
        r"(?P<app_name>\S+)\s+"
        r"(?P<procid>\S+)\s+"
        r"(?P<msgid>\S+)\s+"
        r"(?P<msg>.*)$"
    )

    # RFC 3164: <PRI>MMM DD HH:MM:SS HOSTNAME MSG
    RFC3164_REGEX = re.compile(
        r"^<(?P<pri>\d{1,3})>(?P<timestamp>[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+"
        r"(?P<hostname>\S+)\s+"
        r"(?P<msg>.*)$"
    )

    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        lines = [line.strip() for line in raw_payload.splitlines() if line.strip()]
        events = []

        for idx, line in enumerate(lines):
            parsed_event = self._parse_line(line, idx)
            events.append(parsed_event)

        return events

    def _parse_line(self, line: str, index: int) -> Dict[str, Any]:
        # Try RFC 5424
        match5424 = self.RFC5424_REGEX.match(line)
        if match5424:
            gd = match5424.groupdict()
            pri = int(gd["pri"])
            facility = pri // 8
            severity = pri % 8
            return {
                "event_id": index,
                "protocol": "RFC5424",
                "priority": pri,
                "facility": facility,
                "severity": severity,
                "version": gd.get("version"),
                "timestamp": gd.get("timestamp"),
                "hostname": gd.get("hostname"),
                "app_name": gd.get("app_name"),
                "proc_id": gd.get("procid"),
                "msg_id": gd.get("msgid"),
                "message": gd.get("msg", "").strip(),
            }

        # Try RFC 3164
        match3164 = self.RFC3164_REGEX.match(line)
        if match3164:
            gd = match3164.groupdict()
            pri = int(gd["pri"])
            facility = pri // 8
            severity = pri % 8
            return {
                "event_id": index,
                "protocol": "RFC3164",
                "priority": pri,
                "facility": facility,
                "severity": severity,
                "timestamp": gd.get("timestamp"),
                "hostname": gd.get("hostname"),
                "message": gd.get("msg", "").strip(),
            }

        # Generic syslog fallback with <PRI> header
        pri_match = re.match(r"^<(?P<pri>\d{1,3})>(?P<msg>.*)$", line)
        if pri_match:
            pri = int(pri_match.group("pri"))
            return {
                "event_id": index,
                "protocol": "GENERIC_SYSLOG",
                "priority": pri,
                "facility": pri // 8,
                "severity": pri % 8,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "message": pri_match.group("msg").strip(),
            }

        return {
            "event_id": index,
            "protocol": "RAW",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "message": line,
        }
