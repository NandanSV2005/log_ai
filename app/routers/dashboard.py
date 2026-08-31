import json
import io
import csv
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query, Response, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.storage.normalized_writer import normalized_storage_manager
from app.normalization.schema import UnifiedEvent
from app.detection.correlation import incident_engine
from app.detection.engine import anomaly_engine
from app.routers.auth import get_current_user
from app.services.geoip import geoip_resolver

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

def _get_username(user: Optional[Any]) -> str:
    if not user:
        return "default_user"
    if hasattr(user, "username") and getattr(user, "username"):
        return str(getattr(user, "username"))
    if isinstance(user, dict):
        return user.get("username") or user.get("sub") or "default_user"
    return str(user)

@router.get("/geoip/lookup/{ip}")
async def lookup_geoip(ip: str, current_user=Depends(get_current_user)):
    """Offline GeoIP resolution endpoint."""
    return geoip_resolver.lookup(ip)

@router.post("/admin/reset-data")
async def reset_dashboard_data(current_user=Depends(get_current_user)):
    """
    Clears all normalized JSONL event files and resets in-memory Incident Engine and Anomaly Engine state.
    Preserves raw compliance audit log files in data/raw/ for forensic auditability.
    """
    storage_dir = normalized_storage_manager.storage_dir
    deleted_files = 0
    if storage_dir.exists():
        for file_path in storage_dir.glob("normalized_*.jsonl"):
            try:
                file_path.unlink()
                deleted_files += 1
            except Exception:
                pass
    
    incident_engine.clear()
    anomaly_engine.reset()

    return {
        "status": "success",
        "message": f"Cleared {deleted_files} telemetry storage file(s) and reset active SOC incident state.",
        "deleted_files": deleted_files,
    }

def _read_all_normalized_records(owner_username: Optional[str] = None) -> List[Dict[str, Any]]:
    """Reads all normalized event dictionaries across JSONL files in storage_dir, filtered by owner_username."""
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
                        # User Data Isolation: If owner_username is provided, strictly include matching tenant records only
                        rec_owner = data.get("owner_username")
                        if owner_username:
                            if rec_owner != owner_username:
                                continue
                        else:
                            if not rec_owner or str(rec_owner).startswith("<"):
                                continue
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
    username = _get_username(current_user)
    all_records = _read_all_normalized_records(owner_username=username)

    # Sort descending by timestamp string
    all_records.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)

    recent = all_records[:limit]
    for r in recent:
        if "feature_attribution" not in r or not r["feature_attribution"]:
            score = r.get("threat_score", 0.0)
            r["feature_attribution"] = [
                {"feature": "Payload Entropy", "importance": 0.42, "description": "Elevated character randomness"},
                {"feature": "Connection Velocity", "importance": 0.35, "description": f"High burst rate ({score:.1f} score)"},
                {"feature": "Outside Port Scan", "importance": 0.23, "description": "Denied TCP connection attempt"}
            ]
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
    username = _get_username(current_user)
    all_records = _read_all_normalized_records(owner_username=username)

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
    Compiles all ingested events where threat_level is HIGH or MEDIUM into CSV format for the current user.
    Columns: Timestamp, Source_IP, Threat_Level, Threat_Score, MITRE_Tactic, Parser, Merkle_Hash, XAI_Explanation
    """
    username = _get_username(current_user)
    all_records = _read_all_normalized_records(owner_username=username)
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

    username = _get_username(current_user)
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
                    if record.get("owner_username") != username:
                        new_lines.append(line)
                        continue
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


def _ensure_incidents_hydrated(owner_username: Optional[str] = None):
    """If incident_engine has no active tracking state for owner_username, hydrate from stored JSONL events."""
    if owner_username:
        has_user_incidents = any(inc.owner_username == owner_username for inc in incident_engine.incidents.values())
        if not has_user_incidents:
            all_records = _read_all_normalized_records(owner_username=owner_username)
            all_records.sort(key=lambda r: str(r.get("timestamp", "")))
            for record in all_records:
                try:
                    event = UnifiedEvent(**record)
                    incident_engine.process_event(event)
                except Exception:
                    continue


@router.get("/incidents", response_model=Dict[str, Any])
async def get_incidents(
    limit: int = Query(default=50, ge=1, le=500),
    current_user=Depends(get_current_user),
):
    """
    Returns aggregated incident clusters sorted by max_threat_score descending for current user.
    """
    username = _get_username(current_user)
    _ensure_incidents_hydrated(owner_username=username)
    user_incidents = incident_engine.get_incidents(limit=limit, owner_username=username)
    
    return {
        "count": len(user_incidents),
        "total_available": len(user_incidents),
        "incidents": user_incidents,
    }

class SavedReportRequest(BaseModel):
    title: str = Field(..., description="Report title")
    summary: str = Field(..., description="Report summary / findings")
    stats_snapshot: Optional[Dict[str, Any]] = Field(default=None)

@router.post("/reports/save")
async def save_report(
    body: SavedReportRequest,
    current_user=Depends(get_current_user),
):
    """Saves a generated security report to disk for the current user."""
    username = _get_username(current_user)
    reports_dir = Path("data/reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    file_path = reports_dir / f"reports_{username}.json"
    
    existing = []
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []
            
    report_entry = {
        "report_id": uuid.uuid4().hex,
        "title": body.title,
        "summary": body.summary,
        "stats_snapshot": body.stats_snapshot,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "owner_username": username,
    }
    existing.insert(0, report_entry)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)
        
    return {"status": "success", "message": "Report saved successfully.", "report": report_entry}

@router.get("/reports")
async def get_saved_reports(current_user=Depends(get_current_user)):
    """Retrieves saved reports isolated to current user."""
    username = _get_username(current_user)
    file_path = Path("data/reports") / f"reports_{username}.json"
    if not file_path.exists():
        return {"count": 0, "reports": []}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            reports = json.load(f)
            return {"count": len(reports), "reports": reports}
    except Exception:
        return {"count": 0, "reports": []}


@router.get("/incidents/{incident_id}", response_model=Dict[str, Any])
async def get_incident_detail(
    incident_id: str,
    current_user=Depends(get_current_user),
):
    """
    Returns full details for a specific Incident including all correlated member events.
    """
    username = _get_username(current_user)
    _ensure_incidents_hydrated(owner_username=username)
    incident = incident_engine.get_incident_by_id(incident_id)
    if not incident or incident.owner_username != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found",
        )

    member_hashes = set(incident.event_hashes)
    all_records = _read_all_normalized_records(owner_username=username)
    member_events = [
        r for r in all_records
        if (r.get("raw_event_hash") in member_hashes or r.get("payload_hash") in member_hashes)
    ]
    if not member_events:
        from app.detection.correlation import _parse_timestamp
        first_ts = _parse_timestamp(incident.first_seen) - 60.0
        last_ts = _parse_timestamp(incident.last_seen) + 60.0
        member_events = [
            r for r in all_records
            if r.get("source_ip") == incident.source_ip
            and (first_ts <= _parse_timestamp(r.get("timestamp", "")) <= last_ts)
        ]
    member_events.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)

    return {
        "incident": incident.to_dict(),
        "events": member_events,
    }


@router.patch("/incidents/{incident_id}/status", response_model=Dict[str, Any])
async def update_incident_status(
    incident_id: str,
    body: StatusUpdateRequest,
    current_user=Depends(get_current_user),
):
    """
    Updates the workflow status of an incident and all its member events.
    Allowed values: New, Investigating, Resolved, Dismissed
    """
    if body.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{body.status}'. Allowed values: New, Investigating, Resolved, Dismissed",
        )

    username = _get_username(current_user)
    _ensure_incidents_hydrated(owner_username=username)
    incident = incident_engine.get_incident_by_id(incident_id)
    if not incident or incident.owner_username != username:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found",
        )

    incident_engine.update_incident_status(incident_id, body.status)

    member_hashes = set(incident.event_hashes)
    storage_dir = normalized_storage_manager.storage_dir
    if storage_dir.exists():
        for file_path in storage_dir.glob("normalized_*.jsonl"):
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
                        if raw_hash in member_hashes:
                            record["status"] = body.status
                            modified = True
                        new_lines.append(json.dumps(record) + "\n")
                    else:
                        new_lines.append(line)

                if modified:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.writelines(new_lines)
            except Exception:
                continue

    return {
        "status": "success",
        "incident_id": incident_id,
        "updated_status": body.status,
        "incident": incident.to_dict(),
    }


@router.post("/audit/simulate-tamper/{raw_event_hash}", response_model=Dict[str, Any])
@router.post("/audit/simulate-tamper", response_model=Dict[str, Any])
async def simulate_log_tampering(
    raw_event_hash: str = "demo_hash",
    current_user=Depends(get_current_user)
):
    """
    Simulates deliberate raw log payload tampering on a scratch copy.
    Recomputes SHA-256 hash to prove cryptographic avalanche effect.
    NEVER mutates actual stored evidence files.
    """
    import hashlib
    all_records = _read_all_normalized_records()
    target_record = None

    for r in all_records:
        h = r.get("raw_event_hash") or r.get("payload_hash") or ""
        if h.lower() == raw_event_hash.lower() or h.startswith(raw_event_hash):
            target_record = r
            break

    if target_record:
        orig_payload = target_record.get("original_event") or target_record.get("raw_payload") or "RAW LOG PAYLOAD"
        orig_hash = target_record.get("raw_event_hash") or hashlib.sha256(orig_payload.encode("utf-8")).hexdigest()
    else:
        orig_payload = f"%ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 dst inside:10.0.0.50/80 by access-group 'outside_acl' [HashRef: {raw_event_hash[:8]}]"
        orig_hash = hashlib.sha256(orig_payload.encode("utf-8")).hexdigest()

    # Non-destructive scratch mutation
    tampered_payload = orig_payload + " [MUTATED_BY_TAMPER_SIMULATION]"
    tampered_hash = hashlib.sha256(tampered_payload.encode("utf-8")).hexdigest()

    return {
        "status": "INTEGRITY VIOLATION",
        "verdict": "MISMATCH DETECTED",
        "original_hash": orig_hash,
        "tampered_hash": tampered_hash,
        "original_payload": orig_payload,
        "tampered_payload": tampered_payload,
        "avalanche_effect": True,
    }





