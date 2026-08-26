import json
import io
import csv
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, Query, Response, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.storage.normalized_writer import normalized_storage_manager
from app.routers.auth import get_current_user

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
async def get_recent_events(
    limit: int = Query(default=100, ge=1, le=1000),
    current_user=Depends(get_current_user),
):
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
async def get_dashboard_stats(current_user=Depends(get_current_user)):
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

@router.get("/export/csv")
async def export_threat_report_csv(current_user=Depends(get_current_user)):
    """
    Compiles all ingested events where threat_level is HIGH or MEDIUM into CSV format.
    Columns: Timestamp, Source_IP, Threat_Level, Threat_Score, MITRE_Tactic, Parser, Merkle_Hash, XAI_Explanation
    """
    all_records = _read_all_normalized_records()
    high_med_records = [
        r for r in all_records
        if str(r.get("threat_level", "")).upper() in ("HIGH", "MEDIUM")
    ]
    high_med_records.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp",
        "Source_IP",
        "Threat_Level",
        "Threat_Score",
        "MITRE_Tactic",
        "Parser",
        "Merkle_Hash",
        "XAI_Explanation",
    ])

    for r in high_med_records:
        writer.writerow([
            r.get("timestamp", ""),
            r.get("source_ip", "N/A"),
            str(r.get("threat_level", "LOW")).upper(),
            r.get("threat_score", 0.0),
            r.get("mitre_tactic") or "N/A",
            r.get("event_type", "unstructured_log"),
            r.get("raw_event_hash") or r.get("payload_hash") or "N/A",
            r.get("xai_explanation", ""),
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=threat_report.csv"},
    )

class StatusUpdateRequest(BaseModel):
    status: str = Field(..., description="New incident status: New, Investigating, Resolved, or Dismissed")

ALLOWED_STATUSES = {"New", "Investigating", "Resolved", "Dismissed"}

@router.patch("/event/{event_id}/status", response_model=Dict[str, Any])
async def update_event_status(
    event_id: str,
    body: StatusUpdateRequest,
    current_user=Depends(get_current_user),
):
    """
    Updates the incident status field of a specific normalized event.
    Allowed values: New, Investigating, Resolved, Dismissed
    """
    if body.status not in ALLOWED_STATUSES:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{body.status}'. Allowed values: New, Investigating, Resolved, Dismissed",
        )

    storage_dir = normalized_storage_manager.storage_dir
    if not storage_dir.exists():
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID '{event_id}' not found",
        )

    jsonl_files = list(storage_dir.glob("normalized_*.jsonl"))
    found = False
    updated_event = None

    for file_path in jsonl_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            modified = False
            new_lines = []
            for line in lines:
                line_str = line.strip()
                if line_str:
                    record = json.loads(line_str)
                    raw_hash = record.get("raw_event_hash") or record.get("payload_hash") or ""
                    # Match against raw_event_hash, payload_hash, or event_id string
                    if raw_hash == event_id or record.get("event_id") == event_id or (raw_hash and event_id in raw_hash):
                        record["status"] = body.status
                        updated_event = record
                        modified = True
                        found = True
                    new_lines.append(json.dumps(record) + "\n")
                else:
                    new_lines.append(line)

            if modified:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)
                break
        except Exception:
            continue

    if not found:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID '{event_id}' not found",
        )

    return {
        "status": "success",
        "event_id": event_id,
        "updated_status": body.status,
        "event": updated_event,
    }




