import json
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLogParser(ABC):
    @abstractmethod
    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        """Parse raw log text into a list of normalized event dictionaries."""
        pass

def detect_log_format(
    raw_payload: str,
    content_type: Optional[str] = None,
    param_format: Optional[str] = None,
) -> str:
    """
    Detect log format using explicit user parameter, content-type header,
    or body content inspection heuristics.
    """
    if param_format:
        fmt = param_format.lower().strip()
        if fmt in ("json", "syslog", "csv", "text", "plain"):
            return "text" if fmt == "plain" else fmt

    if content_type:
        ct = content_type.lower()
        if "application/json" in ct or "application/x-ndjson" in ct:
            return "json"
        if "text/csv" in ct:
            return "csv"
        if "syslog" in ct:
            return "syslog"

    # Heuristic format inspection on body content
    stripped = raw_payload.strip()

    # JSON heuristic
    if (stripped.startswith("{") and stripped.endswith("}")) or (
        stripped.startswith("[") and stripped.endswith("]")
    ):
        try:
            json.loads(stripped)
            return "json"
        except Exception:
            pass

    # Syslog heuristic (<PRI> header pattern)
    if re.match(r"^<\d{1,3}>", stripped):
        return "syslog"

    # CSV heuristic (headers with commas and uniform column count across lines)
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    if len(lines) >= 2:
        first_cols = len(lines[0].split(","))
        second_cols = len(lines[1].split(","))
        if first_cols > 1 and first_cols == second_cols:
            return "csv"

    return "text"
