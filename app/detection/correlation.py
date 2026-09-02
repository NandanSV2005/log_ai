"""
LOG AI — Event Correlation Engine (Incident Clustering)

This module provides real-time event correlation by grouping individual UnifiedEvent telemetry
records into cohesive, actionable "Incidents" based on shared source IP addresses and rolling
time windows.

Correlation Heuristic:
----------------------
1. Events sharing the same `source_ip` that arrive within a configurable rolling time window
   (default: 15 minutes / 900 seconds) are automatically correlated into a single Incident.
2. If a new event from a `source_ip` arrives after the rolling window has elapsed since the
   last seen event, a new Incident is initialized.
3. Incidents track key aggregate threat metrics incrementally in O(1) time per event:
   - `first_seen` & `last_seen` timestamps
   - Total `event_count`
   - `max_threat_score` & updated `max_threat_level` (HIGH, MEDIUM, LOW)
   - `mitre_tactics` kill-chain sequence (ordered progression of MITRE tactics observed)
   - `event_hashes` member event list (forensic SHA-256 raw/payload hashes)
   - Workflow `status` (New, Investigating, Resolved, Dismissed)

Known v1 Limitations:
---------------------
- Single-Source-IP Scope: Correlation is scoped strictly per `source_ip`. It does not currently
  correlate multi-vector attacks spanning different source IPs originating from the same distributed
  threat actor or botnet subnet.
- In-Memory State: Active incident trackers are maintained in-memory for zero-latency ingestion-time
  processing, with automated recovery/hydration from normalized storage files on server startup.
"""

import hashlib
import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

from app.normalization.schema import UnifiedEvent


def _parse_timestamp(ts: Union[datetime.datetime, str]) -> float:
    """Helper to convert datetime or ISO string to Unix epoch seconds."""
    if isinstance(ts, datetime.datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=datetime.timezone.utc)
        return ts.timestamp()
    
    if isinstance(ts, (int, float)):
        return float(ts)

    ts_str = str(ts).strip()
    try:
        if ts_str.endswith("Z"):
            ts_str = ts_str[:-1] + "+00:00"
        dt = datetime.datetime.fromisoformat(ts_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.timestamp()
    except Exception:
        return datetime.datetime.now(datetime.timezone.utc).timestamp()


def _format_timestamp(ts: Union[datetime.datetime, str]) -> str:
    """Helper to ensure standard ISO-8601 string formatting."""
    if isinstance(ts, datetime.datetime):
        return ts.isoformat()
    return str(ts)


def _determine_threat_level(score: float, level_hint: Optional[str] = None) -> str:
    """Returns threat level string based on standard score thresholds."""
    if level_hint and level_hint.upper() in ("INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"):
        return level_hint.upper()
    if score >= 90.0:
        return "CRITICAL"
    elif score >= 70.0:
        return "HIGH"
    elif score >= 35.0:
        return "MEDIUM"
    elif score >= 15.0:
        return "LOW"
    return "INFO"


class Incident(BaseModel):
    """
    OCSF-aligned Incident model representing an aggregated security event cluster.
    """
    incident_id: str = Field(..., description="Deterministic hash ID derived from source IP and first event timestamp")
    source_ip: str = Field(..., description="Targeted or offending source IP address")
    first_seen: str = Field(..., description="ISO-8601 UTC timestamp of first correlated event")
    last_seen: str = Field(..., description="ISO-8601 UTC timestamp of most recent correlated event")
    event_count: int = Field(default=1, description="Total count of correlated member events")
    max_threat_score: float = Field(default=0.0, description="Highest threat score observed among member events")
    max_threat_level: str = Field(default="LOW", description="Highest threat classification level (HIGH, MEDIUM, LOW)")
    mitre_tactics: List[str] = Field(default_factory=list, description="Ordered kill chain sequence of MITRE tactics seen")
    status: str = Field(default="New", description="Workflow state: New, Investigating, Resolved, or Dismissed")
    event_hashes: List[str] = Field(default_factory=list, description="List of raw SHA-256 event hashes in this incident")
    owner_username: Optional[str] = Field(default=None, description="Tenant username owning this incident cluster")

    def to_dict(self) -> Dict[str, Any]:
        """Returns dictionary representation of the incident."""
        return {
            "incident_id": self.incident_id,
            "source_ip": self.source_ip,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "event_count": self.event_count,
            "max_threat_score": self.max_threat_score,
            "max_threat_level": self.max_threat_level,
            "mitre_tactics": self.mitre_tactics,
            "status": self.status,
            "event_hashes": self.event_hashes,
            "owner_username": self.owner_username,
        }


class IncidentEngine:
    """
    Real-time, stateful event correlation engine.
    Groups incoming UnifiedEvents into Incidents based on source_ip and time window.
    """

    def __init__(self, window_seconds: int = 900):
        """
        :param window_seconds: Maximum seconds allowed between events from the same IP to be grouped (default: 15 mins).
        """
        self.window_seconds = window_seconds
        self.incidents: Dict[str, Incident] = {}
        self.active_ip_incidents: Dict[str, str] = {}  # f"{source_ip}:{owner_username}" -> latest incident_id

    def process_event(self, event: UnifiedEvent) -> Incident:
        """
        Process a single UnifiedEvent and fold it into an existing active incident or create a new one.
        Updates incident metrics incrementally in O(1) time.
        """
        source_ip = event.source_ip or "0.0.0.0"
        event_owner = getattr(event, "owner_username", None)
        event_ts_str = _format_timestamp(event.timestamp)
        event_ts_val = _parse_timestamp(event.timestamp)

        if not event.raw_event_hash:
            event.raw_event_hash = getattr(event, "payload_hash", None) or uuid_hash(event_ts_str, source_ip, event.original_event)

        event_hash = event.raw_event_hash
        threat_score = getattr(event, "threat_score", 0.0) or 0.0
        mitre_tactic = getattr(event, "mitre_tactic", None)

        active_key = f"{source_ip}:{event_owner}"
        active_inc_id = self.active_ip_incidents.get(active_key)
        existing_incident: Optional[Incident] = self.incidents.get(active_inc_id) if active_inc_id else None

        if existing_incident and existing_incident.owner_username == event_owner:
            last_seen_val = _parse_timestamp(existing_incident.last_seen)
            time_delta = event_ts_val - last_seen_val

            # If within rolling time window (and non-negative or within grace period)
            if 0 <= time_delta <= self.window_seconds:
                # Update existing incident
                existing_incident.event_count += 1

                if event_ts_val > last_seen_val:
                    existing_incident.last_seen = event_ts_str

                if threat_score > existing_incident.max_threat_score:
                    existing_incident.max_threat_score = round(threat_score, 2)
                    existing_incident.max_threat_level = _determine_threat_level(threat_score, getattr(event, "threat_level", None))

                if mitre_tactic and mitre_tactic not in existing_incident.mitre_tactics:
                    existing_incident.mitre_tactics.append(mitre_tactic)

                if event_hash and event_hash not in existing_incident.event_hashes:
                    existing_incident.event_hashes.append(event_hash)

                return existing_incident

        # Otherwise create a new Incident
        deterministic_src = f"{source_ip}_{event_ts_str}_{event_owner}".encode("utf-8")
        incident_id = f"inc_{hashlib.sha256(deterministic_src).hexdigest()[:16]}"

        tactics = [mitre_tactic] if mitre_tactic else []
        hashes = [event_hash] if event_hash else []
        max_score = round(threat_score, 2)

        new_incident = Incident(
            incident_id=incident_id,
            source_ip=source_ip,
            first_seen=event_ts_str,
            last_seen=event_ts_str,
            event_count=1,
            max_threat_score=max_score,
            max_threat_level=_determine_threat_level(max_score, getattr(event, "threat_level", None)),
            mitre_tactics=tactics,
            status=getattr(event, "status", "New") or "New",
            event_hashes=hashes,
            owner_username=event_owner,
        )

        self.incidents[incident_id] = new_incident
        self.active_ip_incidents[active_key] = incident_id

        return new_incident

    def get_incidents(self, limit: int = 50, owner_username: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns incidents sorted by max_threat_score desc, sliced to limit, strictly filtered by owner_username if provided."""
        all_incidents = self.incidents.values()
        if owner_username:
            all_incidents = [inc for inc in all_incidents if inc.owner_username == owner_username]

        sorted_incidents = sorted(
            all_incidents,
            key=lambda inc: (inc.max_threat_score, _parse_timestamp(inc.last_seen)),
            reverse=True,
        )
        return [inc.to_dict() for inc in sorted_incidents[:limit]]

    def get_incident_by_id(self, incident_id: str) -> Optional[Incident]:
        """Retrieves a specific incident by ID."""
        return self.incidents.get(incident_id)

    def update_incident_status(self, incident_id: str, new_status: str) -> bool:
        """Updates the status of an incident."""
        incident = self.incidents.get(incident_id)
        if incident:
            incident.status = new_status
            return True
        return False

    def clear(self):
        """Clears all in-memory incident tracking data (for test isolation)."""
        self.incidents.clear()
        self.active_ip_incidents.clear()


def uuid_hash(ts: str, ip: str, payload: str) -> str:
    """Helper to create fallback event hash when raw_event_hash is not set."""
    raw = f"{ts}_{ip}_{payload}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


# Singleton instance for application-wide ingestion pipeline access
incident_engine = IncidentEngine()
