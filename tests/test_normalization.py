import datetime
import pytest
from app.normalization.schema import UnifiedEvent

def test_unified_event_valid():
    event = UnifiedEvent(
        timestamp="2026-08-25T19:20:00Z",
        source_ip="192.168.1.50",
        destination_ip="10.0.0.1",
        event_type="network_flow",
        severity="High",
        original_event="2026-08-25 19:20:00 192.168.1.50 -> 10.0.0.1 connection allowed",
    )

    assert event.source_ip == "192.168.1.50"
    assert event.destination_ip == "10.0.0.1"
    assert event.event_type == "network_flow"
    assert event.severity == "High"
    assert "192.168.1.50" in event.original_event

def test_unified_event_defaults():
    event = UnifiedEvent(
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        original_event="raw event string only",
    )

    assert event.source_ip is None
    assert event.destination_ip is None
    assert event.event_type == "unclassified"
    assert event.severity == "Informational"
    assert event.original_event == "raw event string only"
    assert isinstance(event.timestamp, str)

def test_unified_event_missing_required_fields():
    with pytest.raises(Exception):
        # Missing original_event and timestamp
        UnifiedEvent(source_ip="1.1.1.1")
