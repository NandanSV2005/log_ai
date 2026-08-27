import json
import pytest
from pathlib import Path
from app.normalization.schema import UnifiedEvent
from app.detection.engine import anomaly_engine, MLEnsembleEngine, MODEL_SAVE_PATH

def test_feature_attribution_identifies_dominant_ip_freq():
    """
    Verifies that feature attribution correctly identifies ip_freq as the top contributor
    when an event has an abnormally high source IP request frequency.
    """
    anomaly_engine.reset()

    # Simulate 20 rapid events from the same IP to spike ip_freq
    events = []
    for idx in range(20):
        evt = UnifiedEvent(
            timestamp="2026-08-27T18:00:00Z",
            source_ip="192.168.1.200",
            destination_ip="10.0.0.1",
            event_type="authentication",
            severity="High",
            original_event=f"Failed password attempt {idx} from 192.168.1.200"
        )
        events.append(anomaly_engine.evaluate_event(evt))

    last_event = events[-1]
    attributions = last_event.feature_attribution

    assert isinstance(attributions, list)
    assert len(attributions) >= 1

    top_feature = attributions[0]
    assert top_feature["feature"] == "ip_freq"
    assert top_feature["z_score"] >= 2.0
    assert "source IP request frequency" in top_feature["description"]
    assert "source IP request frequency" in last_event.xai_explanation


def test_model_persistence_across_process_restarts():
    """
    Verifies that the trained ML baseline model persists to disk at data/models/ml_baseline.json
    and loads cleanly on fresh engine initialization without retraining.
    """
    assert MODEL_SAVE_PATH.exists()

    with open(MODEL_SAVE_PATH, "r") as f:
        data = json.load(f)

    assert data["synthetic_samples"] == 600
    assert "feature_means" in data
    assert "feature_stds" in data

    # Create fresh MLEnsembleEngine instance to test cold-start model loading
    fresh_engine = MLEnsembleEngine()
    assert fresh_engine.is_fitted is True
    assert fresh_engine.feature_means == data["feature_means"]
    assert fresh_engine.feature_stds == data["feature_stds"]


def test_feature_attribution_schema_field():
    """
    Verifies that feature_attribution is included in UnifiedEvent dictionary output for API contracts.
    """
    evt = UnifiedEvent(
        timestamp="2026-08-27T18:00:00Z",
        source_ip="10.0.0.5",
        original_event="Test log"
    )
    evaluated = anomaly_engine.evaluate_event(evt)
    data = evaluated.model_dump()

    assert "feature_attribution" in data
    assert isinstance(data["feature_attribution"], list)
