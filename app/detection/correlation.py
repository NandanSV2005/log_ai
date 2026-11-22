"""
LOG AI — Event Correlation Engine (Incident Clustering v2)
==========================================================
Stateful event correlation and multi-vector threat clustering.

Features:
1. Per-Source Clustering:
   - Groups events by identical `source_ip` within rolling time windows (default: 15 min).
   - Events with no source IP are clustered into "Local Host".
2. Connection Grouping (Activities):
   - Within an incident, groups events that share (source_ip, destination_ip, destination_port, protocol)
     inside a short window (default: 60s) into cohesive "activities".
   - Tracks activity count, first_seen, last_seen, and member event hashes.
3. Fan-In Detection (Distributed Attacks):
   - Detects >= 5 distinct source IPs targeting the same destination (destination_ip:destination_port)
     within a 5-minute window.
   - Generates a separate incident of type "Distributed attack on <destination>".
   - Links all member events and lists distinct attacking sources.
   - Preserves per-source incidents concurrently (an event can belong to both).
4. Fan-Out Detection (Port/Host Scans):
   - Detects a single source targeting >= 5 distinct destination sockets within 5 minutes.
   - Flags the incident as a scan, elevating the threat score.
5. Threat Scoring & Rationales:
   - Modestly elevates threat scores for distributed attacks (+15.0) and scans (+10.0).
   - Provides plain-English incident summaries explaining why the threat was elevated.
6. Strict Multi-Tenant Isolation:
   - All correlation state, active trackers, and fan-in buffers are partitioned strictly by `owner_username`.
"""

import hashlib
import datetime
import time
from typing import List, Dict, Any, Optional, Union, Tuple
from pydantic import BaseModel, Field

from app.normalization.schema import UnifiedEvent


def _parse_timestamp(ts: Union[datetime.datetime, str, float, int]) -> float:
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


def _format_timestamp(ts: Union[datetime.datetime, str, float, int]) -> str:
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
    incident_id: str = Field(..., description="Deterministic hash ID derived from source IP/destination and first event timestamp")
    source_ip: str = Field(..., description="Targeted or offending source IP address, or distributed attack label")
    first_seen: str = Field(..., description="ISO-8601 UTC timestamp of first correlated event")
    last_seen: str = Field(..., description="ISO-8601 UTC timestamp of most recent correlated event")
    event_count: int = Field(default=1, description="Total count of correlated member events")
    max_threat_score: float = Field(default=0.0, description="Highest threat score observed among member events")
    max_threat_level: str = Field(default="LOW", description="Highest threat classification level (HIGH, MEDIUM, LOW)")
    mitre_tactics: List[str] = Field(default_factory=list, description="Ordered kill chain sequence of MITRE tactics seen")
    status: str = Field(default="New", description="Workflow state: New, Investigating, Resolved, or Dismissed")
    event_hashes: List[str] = Field(default_factory=list, description="List of raw SHA-256 event hashes in this incident")
    owner_username: Optional[str] = Field(default=None, description="Tenant username owning this incident cluster")

    # New v2 fields (backward compatible additions)
    incident_type: str = Field(default="Single Source", description="Incident classification type (Single Source, Distributed attack on <dst>, Port Scan)")
    summary: Optional[str] = Field(default=None, description="Human-readable summary explanation of correlation rationale")
    destination_ip: Optional[str] = Field(default=None, description="Destination target IP address")
    destination_port: Optional[int] = Field(default=None, description="Destination target port")
    is_distributed: bool = Field(default=False, description="True if this incident represents a multi-source fan-in attack")
    is_scan: bool = Field(default=False, description="True if this incident represents a fan-out port or host scan")
    distinct_sources: List[str] = Field(default_factory=list, description="List of distinct attacking source IPs for distributed incidents")
    distinct_source_count: int = Field(default=0, description="Number of distinct sources involved")
    activities: List[Dict[str, Any]] = Field(default_factory=list, description="Aggregated connection activity tuples within this incident")
    activity_count: int = Field(default=0, description="Number of distinct connection activities")

    def to_dict(self) -> Dict[str, Any]:
        """Returns dictionary representation of the incident."""
        return {
            "incident_id": self.incident_id,
            "incident_type": self.incident_type,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "destination_port": self.destination_port,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "event_count": self.event_count,
            "threat_score": self.max_threat_score,  # Alias for backward-compatible frontend consumers
            "max_threat_score": self.max_threat_score,
            "threat_level": self.max_threat_level,  # Alias for backward-compatible frontend consumers
            "max_threat_level": self.max_threat_level,
            "mitre_tactics": self.mitre_tactics,
            "status": self.status,
            "event_hashes": self.event_hashes,
            "owner_username": self.owner_username,
            "is_distributed": self.is_distributed,
            "is_scan": self.is_scan,
            "distinct_sources": self.distinct_sources,
            "distinct_source_count": self.distinct_source_count or len(self.distinct_sources),
            "activities": self.activities,
            "activity_count": self.activity_count or len(self.activities),
            "summary": self.summary,
        }


class IncidentEngine:
    """
    Real-time, stateful event correlation engine v2.
    Groups incoming UnifiedEvents into Incidents, connection activities, and distributed fan-in clusters.
    """

    def __init__(
        self,
        window_seconds: int = 900,
        activity_window_seconds: int = 60,
        fan_in_threshold: int = 5,
        fan_in_window_seconds: int = 300,
        fan_out_threshold: int = 5,
        fan_out_window_seconds: int = 300,
    ):
        """
        :param window_seconds: Rolling window for per-source IP clustering (default: 15 mins).
        :param activity_window_seconds: Rolling window for grouping identical connection tuples into an activity (default: 60s).
        :param fan_in_threshold: Distinct source count to trigger distributed attack incident (default: 5).
        :param fan_in_window_seconds: Rolling window for fan-in detection (default: 5 mins).
        :param fan_out_threshold: Distinct destinations/ports count to trigger scan incident (default: 5).
        :param fan_out_window_seconds: Rolling window for scan detection (default: 5 mins).
        """
        self.window_seconds = window_seconds
        self.activity_window_seconds = activity_window_seconds
        self.fan_in_threshold = fan_in_threshold
        self.fan_in_window_seconds = fan_in_window_seconds
        self.fan_out_threshold = fan_out_threshold
        self.fan_out_window_seconds = fan_out_window_seconds

        # Incident storage
        self.incidents: Dict[str, Incident] = {}
        # Active tracker: f"{source_ip}:{owner_username}" -> latest incident_id
        self.active_ip_incidents: Dict[str, str] = {}
        # Active fan-in tracker: f"{dest_key}:{owner_username}" -> fan_in incident_id
        self.active_fan_in_incidents: Dict[str, str] = {}

        # Rolling buffers for fan-in detection: f"{dest_key}:{owner_username}" -> list of event dicts
        self.destination_buffers: Dict[str, List[Dict[str, Any]]] = {}
        # Rolling targets for fan-out (scan) detection: f"{source_ip}:{owner_username}" -> list of (ts_val, target_str)
        self.source_targets: Dict[str, List[Tuple[float, str]]] = {}

    def _update_connection_activity(
        self,
        incident: Incident,
        event: UnifiedEvent,
        ts_val: float,
        ts_str: str,
        event_hash: str,
    ):
        """
        Groups events sharing (source_ip, destination_ip, destination_port, protocol)
        inside `self.activity_window_seconds` (default: 60s) into a single connection activity.
        """
        src = event.source_ip or "Local Host"
        dst = getattr(event, "destination_ip", None)
        dst_port = getattr(event, "dst_port", None) or getattr(event, "destination_port", None)
        proto = (getattr(event, "protocol", None) or "TCP").upper()
        action = getattr(event, "action", None) or getattr(event, "event_type", None) or "EVENT"

        # Search for an active activity matching this connection tuple within the activity window
        matched_act = None
        for act in reversed(incident.activities):
            if (
                act.get("source_ip") == src
                and act.get("destination_ip") == dst
                and act.get("destination_port") == dst_port
                and act.get("protocol") == proto
            ):
                act_last_ts = _parse_timestamp(act.get("last_seen", ts_val))
                if abs(ts_val - act_last_ts) <= self.activity_window_seconds:
                    matched_act = act
                    break

        if matched_act is not None:
            matched_act["count"] = matched_act.get("count", 1) + 1
            matched_act["event_count"] = matched_act["count"]
            if ts_val > _parse_timestamp(matched_act["last_seen"]):
                matched_act["last_seen"] = ts_str
            if ts_val < _parse_timestamp(matched_act["first_seen"]):
                matched_act["first_seen"] = ts_str
            if event_hash and event_hash not in matched_act.get("event_hashes", []):
                matched_act.setdefault("event_hashes", []).append(event_hash)
        else:
            act_id = f"act_{hashlib.sha256(f'{src}_{dst}_{dst_port}_{proto}_{ts_str}_{len(incident.activities)}'.encode('utf-8')).hexdigest()[:12]}"
            new_act = {
                "activity_id": act_id,
                "source_ip": src,
                "destination_ip": dst,
                "destination_port": dst_port,
                "protocol": proto,
                "count": 1,
                "event_count": 1,
                "first_seen": ts_str,
                "last_seen": ts_str,
                "event_hashes": [event_hash] if event_hash else [],
                "action": action,
            }
            incident.activities.append(new_act)

        incident.activity_count = len(incident.activities)

    def _evaluate_fan_in(
        self,
        event: UnifiedEvent,
        ts_val: float,
        ts_str: str,
        event_hash: str,
        threat_score: float,
        event_owner: Optional[str],
    ) -> Optional[Incident]:
        """
        Evaluates incoming event against destination buffers for multi-source Fan-In attacks.
        If >= self.fan_in_threshold distinct source IPs target destination within window,
        creates or updates a separate 'Distributed attack on <destination>' incident.
        """
        dst_ip = getattr(event, "destination_ip", None)
        src_ip = event.source_ip
        if not dst_ip or not src_ip or src_ip in ("Local Host", "127.0.0.1", "localhost"):
            return None

        dst_port = getattr(event, "dst_port", None) or getattr(event, "destination_port", None)
        dest_key = f"{dst_ip}:{dst_port}:{event_owner}" if dst_port is not None else f"{dst_ip}:{event_owner}"
        dest_label = f"{dst_ip}:{dst_port}" if dst_port is not None else dst_ip

        # 1. Update rolling destination buffer
        if dest_key not in self.destination_buffers:
            self.destination_buffers[dest_key] = []

        buffer = self.destination_buffers[dest_key]
        # Prune events outside rolling window relative to current event
        self.destination_buffers[dest_key] = [
            e for e in buffer
            if abs(ts_val - e["timestamp"]) <= self.fan_in_window_seconds
        ]
        buffer = self.destination_buffers[dest_key]

        # Add current event record to buffer
        buffer.append({
            "source_ip": src_ip,
            "timestamp": ts_val,
            "timestamp_str": ts_str,
            "event_hash": event_hash,
            "threat_score": threat_score,
            "event": event,
        })

        # 2. Count distinct source IPs in window
        distinct_sources = sorted(list(set(
            e["source_ip"] for e in buffer
            if e["source_ip"] and e["source_ip"] not in ("Local Host", "127.0.0.1", "localhost")
        )))

        if len(distinct_sources) < self.fan_in_threshold:
            return None

        # 3. Create or update Fan-In Incident
        window_minutes = max(1, int(round(self.fan_in_window_seconds / 60)))
        summary_text = f"{len(distinct_sources)} sources targeted {dest_label} within {window_minutes} minutes"
        base_threat = max(e["threat_score"] for e in buffer)
        # Modest threat score escalation for distributed attack (+15.0 pts, capped at 100.0)
        elevated_threat = min(100.0, round(base_threat + 15.0, 2))

        active_fanin_id = self.active_fan_in_incidents.get(dest_key)
        existing_fanin = self.incidents.get(active_fanin_id) if active_fanin_id else None

        if existing_fanin and existing_fanin.owner_username == event_owner:
            last_seen_val = _parse_timestamp(existing_fanin.last_seen)
            if abs(ts_val - last_seen_val) <= self.fan_in_window_seconds:
                # Update existing fan-in incident
                existing_fanin.event_count += 1
                if ts_val > last_seen_val:
                    existing_fanin.last_seen = ts_str
                if event_hash and event_hash not in existing_fanin.event_hashes:
                    existing_fanin.event_hashes.append(event_hash)

                # Merge distinct sources
                merged_sources = sorted(list(set(existing_fanin.distinct_sources) | set(distinct_sources)))
                existing_fanin.distinct_sources = merged_sources
                existing_fanin.distinct_source_count = len(merged_sources)

                if elevated_threat > existing_fanin.max_threat_score:
                    existing_fanin.max_threat_score = elevated_threat
                    existing_fanin.max_threat_level = _determine_threat_level(elevated_threat)

                existing_fanin.summary = f"{len(merged_sources)} sources targeted {dest_label} within {window_minutes} minutes"
                self._update_connection_activity(existing_fanin, event, ts_val, ts_str, event_hash)
                return existing_fanin

        # Initialize new Fan-In Incident
        earliest_ts = min(e["timestamp"] for e in buffer)
        earliest_ts_str = next(e["timestamp_str"] for e in buffer if e["timestamp"] == earliest_ts)
        member_hashes = [e["event_hash"] for e in buffer if e["event_hash"]]

        deterministic_key = f"fanin_{dest_key}_{earliest_ts_str}".encode("utf-8")
        fanin_id = f"inc_fanin_{hashlib.sha256(deterministic_key).hexdigest()[:16]}"

        fan_in_incident = Incident(
            incident_id=fanin_id,
            incident_type=f"Distributed attack on {dest_label}",
            source_ip=f"Distributed attack on {dest_label}",
            destination_ip=dst_ip,
            destination_port=dst_port,
            first_seen=earliest_ts_str,
            last_seen=ts_str,
            event_count=len(buffer),
            max_threat_score=elevated_threat,
            max_threat_level=_determine_threat_level(elevated_threat),
            mitre_tactics=["Impact", "Initial Access"],
            status="New",
            event_hashes=member_hashes,
            owner_username=event_owner,
            is_distributed=True,
            is_scan=False,
            distinct_sources=distinct_sources,
            distinct_source_count=len(distinct_sources),
            summary=summary_text,
        )

        # Populate initial activities for all buffered events
        for e in buffer:
            self._update_connection_activity(
                fan_in_incident,
                e["event"],
                e["timestamp"],
                e["timestamp_str"],
                e["event_hash"],
            )

        self.incidents[fanin_id] = fan_in_incident
        self.active_fan_in_incidents[dest_key] = fanin_id
        return fan_in_incident

    def _evaluate_fan_out(
        self,
        incident: Incident,
        event: UnifiedEvent,
        ts_val: float,
        src_ip: str,
        event_owner: Optional[str],
    ):
        """
        Evaluates incoming event for Fan-Out / Port / Host scan behavior.
        If a single source targets >= self.fan_out_threshold distinct endpoints within window,
        marks the per-source incident as a scan and raises the threat score modestly.
        """
        dst_ip = getattr(event, "destination_ip", None)
        dst_port = getattr(event, "dst_port", None) or getattr(event, "destination_port", None)
        if not dst_ip and dst_port is None:
            return

        target_endpoint = f"{dst_ip or 'any'}:{dst_port or 'any'}"
        source_key = f"{src_ip}:{event_owner}"

        if source_key not in self.source_targets:
            self.source_targets[source_key] = []

        targets = self.source_targets[source_key]
        # Prune older than fan_out_window_seconds
        self.source_targets[source_key] = [
            t for t in targets
            if abs(ts_val - t[0]) <= self.fan_out_window_seconds
        ]
        self.source_targets[source_key].append((ts_val, target_endpoint))

        distinct_targets = set(t[1] for t in self.source_targets[source_key])
        if len(distinct_targets) >= self.fan_out_threshold:
            incident.is_scan = True
            if incident.incident_type == "Single Source":
                incident.incident_type = "Port / Host Scan"
            if "Discovery" not in incident.mitre_tactics:
                incident.mitre_tactics.append("Discovery")

            window_minutes = max(1, int(round(self.fan_out_window_seconds / 60)))
            incident.summary = f"Scan detected: source targeted {len(distinct_targets)} distinct endpoints within {window_minutes} minutes"

            # Modest threat score escalation for scan (+10.0 pts)
            elevated = min(100.0, round(incident.max_threat_score + 10.0, 2))
            incident.max_threat_score = elevated
            incident.max_threat_level = _determine_threat_level(elevated)

    def process_event(self, event: UnifiedEvent) -> Incident:
        """
        Process a single UnifiedEvent.
        1. Folds into or initializes a per-source Incident with connection activity grouping.
        2. Evaluates fan-out scan behavior.
        3. Evaluates and generates/updates concurrent Fan-In distributed attack incidents.
        4. Returns the primary per-source Incident (preserving backward-compatible signature).
        """
        source_ip = event.source_ip or "Local Host"
        event_owner = getattr(event, "owner_username", None)
        event_ts_str = _format_timestamp(event.timestamp)
        event_ts_val = _parse_timestamp(event.timestamp)

        if not event.raw_event_hash:
            event.raw_event_hash = getattr(event, "payload_hash", None) or uuid_hash(event_ts_str, source_ip, event.original_event or "")

        event_hash = event.raw_event_hash
        threat_score = getattr(event, "threat_score", 0.0) or 0.0
        mitre_tactic = getattr(event, "mitre_tactic", None)

        active_key = f"{source_ip}:{event_owner}"
        active_inc_id = self.active_ip_incidents.get(active_key)
        existing_incident: Optional[Incident] = self.incidents.get(active_inc_id) if active_inc_id else None

        primary_incident: Incident

        if existing_incident and existing_incident.owner_username == event_owner:
            last_seen_val = _parse_timestamp(existing_incident.last_seen)
            time_delta = event_ts_val - last_seen_val

            # If within rolling time window
            if 0 <= time_delta <= self.window_seconds:
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

                self._update_connection_activity(existing_incident, event, event_ts_val, event_ts_str, event_hash)
                primary_incident = existing_incident
            else:
                # Outside rolling window -> create a new incident cluster
                primary_incident = self._create_new_source_incident(
                    source_ip, event_owner, event_ts_str, event_ts_val, threat_score, mitre_tactic, event_hash, event
                )
        else:
            # No active incident for this source -> create new incident
            primary_incident = self._create_new_source_incident(
                source_ip, event_owner, event_ts_str, event_ts_val, threat_score, mitre_tactic, event_hash, event
            )

        event.incident_id = primary_incident.incident_id

        # Evaluate fan-out scan detection
        self._evaluate_fan_out(primary_incident, event, event_ts_val, source_ip, event_owner)

        # Evaluate fan-in distributed attack detection (concurrent incident generation)
        self._evaluate_fan_in(event, event_ts_val, event_ts_str, event_hash, threat_score, event_owner)

        return primary_incident

    def _create_new_source_incident(
        self,
        source_ip: str,
        event_owner: Optional[str],
        event_ts_str: str,
        event_ts_val: float,
        threat_score: float,
        mitre_tactic: Optional[str],
        event_hash: str,
        event: UnifiedEvent,
    ) -> Incident:
        """Helper to instantiate and register a new per-source Incident."""
        active_key = f"{source_ip}:{event_owner}"
        deterministic_src = f"{source_ip}_{event_ts_str}_{event_owner}".encode("utf-8")
        incident_id = f"inc_{hashlib.sha256(deterministic_src).hexdigest()[:16]}"

        tactics = [mitre_tactic] if mitre_tactic else []
        hashes = [event_hash] if event_hash else []
        max_score = round(threat_score, 2)

        new_incident = Incident(
            incident_id=incident_id,
            incident_type="Single Source",
            source_ip=source_ip,
            destination_ip=getattr(event, "destination_ip", None),
            destination_port=getattr(event, "dst_port", None) or getattr(event, "destination_port", None),
            first_seen=event_ts_str,
            last_seen=event_ts_str,
            event_count=1,
            max_threat_score=max_score,
            max_threat_level=_determine_threat_level(max_score, getattr(event, "threat_level", None)),
            mitre_tactics=tactics,
            status=getattr(event, "status", "New") or "New",
            event_hashes=hashes,
            owner_username=event_owner,
            is_distributed=False,
            is_scan=False,
            distinct_sources=[source_ip] if source_ip != "Local Host" else [],
            distinct_source_count=1 if source_ip != "Local Host" else 0,
        )

        self._update_connection_activity(new_incident, event, event_ts_val, event_ts_str, event_hash)

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
        self.active_fan_in_incidents.clear()
        self.destination_buffers.clear()
        self.source_targets.clear()


def uuid_hash(ts: str, ip: str, payload: str) -> str:
    """Helper to create fallback event hash when raw_event_hash is not set."""
    raw = f"{ts}_{ip}_{payload}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


# Singleton instance for application-wide ingestion pipeline access
incident_engine = IncidentEngine()
