from typing import Optional, Union
from pydantic import BaseModel, Field, field_validator
import datetime

class UnifiedEvent(BaseModel):
    """
    OCSF (Open Cybersecurity Schema Framework) aligned Unified Event schema.
    Normalizes heterogeneous raw log events into a standardized model.
    """
    timestamp: Union[datetime.datetime, str] = Field(
        ...,
        description="ISO-8601 UTC event timestamp",
    )
    source_ip: Optional[str] = Field(
        None,
        description="Source IPv4/IPv6 address",
    )
    destination_ip: Optional[str] = Field(
        None,
        description="Destination IPv4/IPv6 address",
    )
    event_type: str = Field(
        default="unclassified",
        description="Categorized event classification type",
    )
    severity: Union[int, str] = Field(
        default="Informational",
        description="Event severity rating or numeric score",
    )
    raw_event_hash: Optional[str] = Field(
        default=None,
        description="SHA-256 hash of raw log entry for forensic Merkle chain traceability",
    )
    threat_score: float = Field(
        default=0.0,
        description="Ensemble threat rating score ranging from 0.0 to 100.0",
    )
    threat_level: str = Field(
        default="LOW",
        description="Threat classification level: LOW, MEDIUM, or HIGH",
    )
    anomaly_flags: list[str] = Field(
        default_factory=list,
        description="List of triggered rule-based or ML anomaly detection flags",
    )
    xai_explanation: str = Field(
        default="",
        description="Plain-English XAI explanation of threat score and anomaly signals",
    )
    mitre_tactic: Optional[str] = Field(
        default=None,
        description="Mapped MITRE ATT&CK framework tactic (e.g., T1110 - Brute Force)",
    )
    status: str = Field(
        default="New",
        description="Incident status workflow state: New, Investigating, Resolved, or Dismissed",
    )
    original_event: str = Field(
        ...,
        description="Preserved raw log event payload string for forensic auditability",
    )

    @field_validator("timestamp")
    def validate_timestamp(cls, v):
        if isinstance(v, datetime.datetime):
            return v.isoformat()
        return str(v)

    model_config = {
        "json_schema_extra": {
            "example": {
                "timestamp": "2026-08-25T19:20:00Z",
                "source_ip": "192.168.1.100",
                "destination_ip": "10.0.0.1",
                "event_type": "authentication",
                "severity": "High",
                "original_event": "2026-08-25 19:20:00 [WARN] Failed login for user admin from 192.168.1.100",
            }
        }
    }
