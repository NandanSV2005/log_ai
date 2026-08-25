import csv
import io
import datetime
from typing import List, Dict, Any
from app.parsers.base import BaseLogParser

class CsvLogParser(BaseLogParser):
    def parse(self, raw_payload: str) -> List[Dict[str, Any]]:
        stripped = raw_payload.strip()
        if not stripped:
            return []

        f = io.StringIO(stripped)
        reader = csv.reader(f)

        try:
            headers = next(reader)
        except StopIteration:
            return []

        # Check if first line looks like header row or data row
        headers = [h.strip() for h in headers]
        
        events = []
        for idx, row in enumerate(reader):
            if not row or not any(row):
                continue
            row_dict = {}
            for h_idx, col in enumerate(row):
                header_name = headers[h_idx] if h_idx < len(headers) else f"col_{h_idx}"
                row_dict[header_name] = col.strip()
            
            timestamp = (
                row_dict.get("timestamp")
                or row_dict.get("time")
                or row_dict.get("date")
                or datetime.datetime.now(datetime.timezone.utc).isoformat()
            )

            events.append({
                "event_id": idx,
                "timestamp": str(timestamp),
                "data": row_dict,
            })

        return events
