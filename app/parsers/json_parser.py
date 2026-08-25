import json
import datetime
from typing import List, Dict, Any
from app.parsers.base import BaseLogParser

class JsonLogParser(BaseLogParser):
    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        stripped = raw_payload.strip()
        if not stripped:
            return []

        results: List[Dict[str, Any]] = []

        # Try parsing as full JSON document (array or single dict)
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, list):
                for idx, item in enumerate(parsed):
                    results.append(self._normalize_item(item, idx))
                return results
            elif isinstance(parsed, dict):
                return [self._normalize_item(parsed, 0)]
        except json.JSONDecodeError:
            pass

        # Fall back to NDJSON (line-delimited JSON)
        for idx, line in enumerate(stripped.splitlines()):
            line_str = line.strip()
            if not line_str:
                continue
            try:
                item = json.loads(line_str)
                results.append(self._normalize_item(item, idx))
            except json.JSONDecodeError:
                results.append({
                    "event_id": idx,
                    "parse_error": "Malformed JSON line",
                    "raw": line_str,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                })

        return results

    def _normalize_item(self, item: Any, index: int) -> Dict[str, Any]:
        if isinstance(item, dict):
            timestamp = (
                item.get("timestamp")
                or item.get("time")
                or item.get("@timestamp")
                or datetime.datetime.now(datetime.timezone.utc).isoformat()
            )
            return {
                "event_id": index,
                "timestamp": str(timestamp),
                "data": item,
            }
        return {
            "event_id": index,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "data": {"value": item},
        }
