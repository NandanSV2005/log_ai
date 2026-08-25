import re
import datetime
from typing import List, Dict, Any
from app.parsers.base import BaseLogParser

class TextLogParser(BaseLogParser):
    # Regex to extract ISO timestamp or common datetime prefix
    TIMESTAMP_REGEX = re.compile(
        r"^(?P<ts>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(?P<msg>.*)$"
    )

    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        lines = raw_payload.splitlines()
        events = []

        for idx, line in enumerate(lines):
            line_str = line.strip()
            if not line_str:
                continue

            match = self.TIMESTAMP_REGEX.match(line_str)
            if match:
                ts = match.group("ts")
                msg = match.group("msg")
            else:
                ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
                msg = line_str

            events.append({
                "event_id": idx,
                "timestamp": ts,
                "message": msg,
            })

        return events
