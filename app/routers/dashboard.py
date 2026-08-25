import json
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, Query

from app.storage.normalized_writer import normalized_storage_manager

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

def _read_all_normalized_records() -> List[Dict[str, Any]]:
    """Reads all normalized event dictionaries across JSONL files in storage_dir."""
    storage_dir = normalized_storage_manager.storage_dir
    if not storage_dir.exists():
        return []

    jsonl_files = sorted(storage_dir.glob("normalized_*.jsonl"), reverse=True)
    records: List[Dict[str, Any]] = []

    for file_path in jsonl_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    line_str = line.strip()
                    if line_str:
                        data = json.loads(line_str)
                        records.append(data)
        except Exception:
            continue

    return records

@router.get("/events/recent", response_model=Dict[str, Any])
async def get_recent_events(limit: int = Query(default=100, ge=1, le=1000)):
    """
    Returns the most recent normalized UnifiedEvent records (up to limit, default 100),
    including XAI explanations and Merkle audit hashes.
    """
    all_records = _read_all_normalized_records()

    # Sort descending by timestamp string
    all_records.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)

    recent = all_records[:limit]
    return {
        "count": len(recent),
        "total_available": len(all_records),
        "events": recent,
    }

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats():
    """
    Calculates and returns real-time aggregate dashboard statistics:
    - total_events_ingested
    - threat_level_counts (HIGH, MEDIUM, LOW)
    - vendor_parser_counts (cisco_asa, fortinet, suricata, pfsense, syslog, cef, etc.)
    """
    all_records = _read_all_normalized_records()

    total_events = len(all_records)
    threat_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    vendor_counts: Dict[str, int] = {}

    for record in all_records:
        # Threat level aggregate
        level = str(record.get("threat_level", "LOW")).upper()
        if level in threat_counts:
            threat_counts[level] += 1
        else:
            threat_counts["LOW"] += 1

        # Vendor parser aggregate derived from event_type prefix
        evt_type = str(record.get("event_type", "unstructured_log")).lower()
        if "cisco" in evt_type:
            vendor = "cisco_asa"
        elif "fortinet" in evt_type:
            vendor = "fortinet"
        elif "suricata" in evt_type:
            vendor = "suricata"
        elif "pfsense" in evt_type:
            vendor = "pfsense"
        elif "syslog" in evt_type:
            vendor = "syslog"
        elif "cef" in evt_type:
            vendor = "cef"
        else:
            vendor = evt_type.split(":")[0] if ":" in evt_type else "unstructured_log"

        vendor_counts[vendor] = vendor_counts.get(vendor, 0) + 1

    return {
        "total_events_ingested": total_events,
        "threat_level_counts": threat_counts,
        "vendor_parser_counts": vendor_counts,
    }
