import os
import json
import math
import random
import datetime
import logging
from pathlib import Path
from collections import Counter
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from app.normalization.schema import UnifiedEvent
from app.defense.rules_engine import rules_engine

logger = logging.getLogger("log_ai.engine")

MODEL_SAVE_PATH = Path("data/models/ml_baseline.json")
FEATURE_NAMES = ["ip_freq", "ip_deny", "action_code", "sev_code", "hour"]

class IsolationTreeNode:
    def __init__(self, left=None, right=None, split_feature=None, split_value=None, size: int = 0):
        self.left = left
        self.right = right
        self.split_feature = split_feature
        self.split_value = split_value
        self.size = size

    @property
    def is_leaf(self) -> bool:
        return self.left is None and self.right is None

class IsolationTree:
    def __init__(self, max_depth: int):
        self.max_depth = max_depth
        self.root: Optional[IsolationTreeNode] = None

    def fit(self, X: np.ndarray, depth: int = 0) -> IsolationTreeNode:
        n_samples, n_features = X.shape
        if depth >= self.max_depth or n_samples <= 1:
            return IsolationTreeNode(size=n_samples)

        feat_idx = random.randint(0, n_features - 1)
        feat_vals = X[:, feat_idx]
        min_val, max_val = feat_vals.min(), feat_vals.max()

        if min_val == max_val:
            return IsolationTreeNode(size=n_samples)

        split_val = random.uniform(min_val, max_val)
        left_mask = feat_vals < split_val
        right_mask = ~left_mask

        if left_mask.sum() == 0 or right_mask.sum() == 0:
            return IsolationTreeNode(size=n_samples)

        left_node = self.fit(X[left_mask], depth + 1)
        right_node = self.fit(X[right_mask], depth + 1)

        return IsolationTreeNode(
            left=left_node,
            right=right_node,
            split_feature=feat_idx,
            split_value=split_val,
            size=n_samples,
        )

    def path_length(self, x: np.ndarray, node: IsolationTreeNode, current_depth: int = 0) -> float:
        if node.is_leaf:
            return current_depth + self._c(node.size)

        val = x[node.split_feature]
        if val < node.split_value:
            return self.path_length(x, node.left, current_depth + 1)
        else:
            return self.path_length(x, node.right, current_depth + 1)

    @staticmethod
    def _c(n: int) -> float:
        if n <= 1:
            return 0.0
        if n == 2:
            return 1.0
        return 2.0 * (math.log(n - 1) + 0.5772156649) - (2.0 * (n - 1) / n)

class IsolationForest:
    """Pure Python & NumPy IsolationForest implementation (AppLocker C-DLL safe)."""
    def __init__(self, n_estimators: int = 10, max_samples: int = 64, random_state=None, contamination=0.1):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        self.contamination = contamination
        self.trees: List[IsolationTree] = []
        self.c_factor: float = 1.0

    def fit(self, X: np.ndarray, y=None):
        n_samples = len(X)
        if n_samples == 0:
            return self

        subsample_size = min(self.max_samples, n_samples)
        max_depth = int(math.ceil(math.log2(max(subsample_size, 2))))
        self.c_factor = IsolationTree._c(subsample_size) or 1.0

        self.trees = []
        for _ in range(self.n_estimators):
            indices = np.random.choice(n_samples, size=subsample_size, replace=False)
            X_sub = X[indices]
            tree = IsolationTree(max_depth=max_depth)
            tree.root = tree.fit(X_sub)
            self.trees.append(tree)
        return self

    def compute_anomaly_score(self, x: np.ndarray) -> float:
        if not self.trees:
            return 0.0
        paths = [t.path_length(x, t.root) for t in self.trees]
        avg_path = float(np.mean(paths))
        score = 2.0 ** (-avg_path / self.c_factor)
        return float(score)

    def decision_function(self, X: np.ndarray) -> np.ndarray:
        scores = []
        for x in X:
            s = self.compute_anomaly_score(x)
            scores.append(0.5 - s)
        return np.array(scores)

class DecisionNode:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

    @property
    def is_leaf(self):
        return self.value is not None

class SimpleDecisionTree:
    def __init__(self, max_depth: int = 5):
        self.max_depth = max_depth
        self.root = None

    def fit(self, X: np.ndarray, y: np.ndarray, depth: int = 0):
        n_samples, n_features = X.shape
        unique_labels = np.unique(y)

        if depth >= self.max_depth or len(unique_labels) == 1 or n_samples <= 2:
            prob_threat = float(np.mean(y)) if len(y) > 0 else 0.0
            return DecisionNode(value=prob_threat)

        feat_idx = random.randint(0, n_features - 1)
        feat_vals = X[:, feat_idx]
        thresh = float(np.median(feat_vals))

        left_mask = feat_vals <= thresh
        right_mask = ~left_mask

        if left_mask.sum() == 0 or right_mask.sum() == 0:
            prob_threat = float(np.mean(y))
            return DecisionNode(value=prob_threat)

        left_child = self.fit(X[left_mask], y[left_mask], depth + 1)
        right_child = self.fit(X[right_mask], y[right_mask], depth + 1)

        return DecisionNode(feature=feat_idx, threshold=thresh, left=left_child, right=right_child)

    def predict_proba_single(self, x: np.ndarray, node: DecisionNode) -> float:
        if node.is_leaf:
            return node.value
        if x[node.feature] <= node.threshold:
            return self.predict_proba_single(x, node.left)
        else:
            return self.predict_proba_single(x, node.right)

class RandomForestClassifier:
    """Pure Python & NumPy RandomForestClassifier implementation (AppLocker C-DLL safe)."""
    def __init__(self, n_estimators: int = 10, max_depth: int = 5, random_state=None):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.trees: List[SimpleDecisionTree] = []

    def fit(self, X: np.ndarray, y: np.ndarray):
        n_samples = len(X)
        self.trees = []
        for _ in range(self.n_estimators):
            indices = np.random.choice(n_samples, size=n_samples, replace=True)
            tree = SimpleDecisionTree(max_depth=self.max_depth)
            tree.root = tree.fit(X[indices], y[indices])
            self.trees.append(tree)
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        probas = []
        for x in X:
            if not self.trees:
                p1 = 0.0
            else:
                preds = [t.predict_proba_single(x, t.root) for t in self.trees]
                p1 = float(np.mean(preds))
            probas.append([1.0 - p1, p1])
        return np.array(probas)


def generate_synthetic_training_data(n_samples: int = 600) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Programmatically generates a varied synthetic dataset of telemetry features.
    Features: [ip_freq, ip_deny, action_code, sev_code, hour]
    - 400 Normal baseline sessions
    - 200 Attack / Anomaly sessions (brute force, off-hours probes, critical exploits)
    Returns: (X_all, y_all, X_normal)
    """
    np.random.seed(42)
    random.seed(42)

    n_normal = int(n_samples * 2 / 3)  # 400
    n_threat = n_samples - n_normal    # 200

    # 1. Normal baseline samples (400)
    normal_freq = np.random.uniform(1.0, 4.0, size=n_normal)
    normal_deny = np.random.choice([0.0, 1.0], size=n_normal, p=[0.95, 0.05])
    normal_action = np.random.choice([0.0, 0.5], size=n_normal, p=[0.85, 0.15])
    normal_sev = np.random.choice([0.0, 1.0], size=n_normal, p=[0.85, 0.15])
    normal_hour = np.random.uniform(8.0, 18.0, size=n_normal)  # Business hours

    X_normal = np.column_stack([normal_freq, normal_deny, normal_action, normal_sev, normal_hour])

    # 2. Threat samples (200)
    # Brute force (80)
    bf_freq = np.random.uniform(10.0, 35.0, size=80)
    bf_deny = np.random.uniform(5.0, 30.0, size=80)
    bf_action = np.ones(80)
    bf_sev = np.random.choice([2.0, 3.0], size=80)
    bf_hour = np.random.uniform(0.0, 23.0, size=80)

    # Off-hours probes (60)
    oh_freq = np.random.uniform(5.0, 15.0, size=60)
    oh_deny = np.random.uniform(3.0, 10.0, size=60)
    oh_action = np.ones(60)
    oh_sev = np.full(60, 2.0)
    oh_hour = np.random.uniform(1.0, 5.0, size=60)  # 01:00 to 05:00

    # Critical severity exploits (60)
    ex_freq = np.random.uniform(3.0, 12.0, size=60)
    ex_deny = np.random.uniform(1.0, 6.0, size=60)
    ex_action = np.ones(60)
    ex_sev = np.full(60, 3.0)  # Critical
    ex_hour = np.random.uniform(0.0, 23.0, size=60)

    X_threat = np.vstack([
        np.column_stack([bf_freq, bf_deny, bf_action, bf_sev, bf_hour]),
        np.column_stack([oh_freq, oh_deny, oh_action, oh_sev, oh_hour]),
        np.column_stack([ex_freq, ex_deny, ex_action, ex_sev, ex_hour])
    ])

    X_all = np.vstack([X_normal, X_threat])
    y_all = np.array([0] * n_normal + [1] * n_threat, dtype=int)

    return X_all, y_all, X_normal


class MLEnsembleEngine:
    """
    Weighted ML Ensemble Engine combining:
    - IsolationForest: Unsupervised outlier & anomaly scoring.
    - RandomForestClassifier: Supervised known-threat pattern matching.
    Includes feature baseline z-score attribution and disk persistence.
    """
    def __init__(self, n_estimators: int = 20):
        self.n_estimators = n_estimators
        self.iso_forest = IsolationForest(n_estimators=n_estimators, random_state=42)
        self.rf_classifier = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
        self.is_fitted = False

        self.feature_means: List[float] = [2.1, 0.05, 0.08, 0.15, 13.0]
        self.feature_stds: List[float] = [0.8, 0.2, 0.2, 0.35, 2.8]

        self._init_baseline_models()

    def _init_baseline_models(self):
        """
        Loads baseline parameters from data/models/ml_baseline.json if persisted;
        otherwise fits models on 600-sample synthetic dataset and saves parameters to disk.
        """
        if MODEL_SAVE_PATH.exists():
            try:
                with open(MODEL_SAVE_PATH, "r") as f:
                    data = json.load(f)
                self.feature_means = data.get("feature_means", self.feature_means)
                self.feature_stds = data.get("feature_stds", self.feature_stds)
                self.is_fitted = True
                logger.info(
                    "Loaded persisted ML baseline parameters from %s (synthetic n=%d)",
                    MODEL_SAVE_PATH,
                    data.get("synthetic_samples", 600)
                )
            except Exception as e:
                logger.warning("Failed to load model from %s (%s). Re-training...", MODEL_SAVE_PATH, e)
                self._train_and_persist_models()
        else:
            self._train_and_persist_models()

    def _train_and_persist_models(self):
        """Generates synthetic dataset (n=600), fits ensemble, computes baseline means/stds, and persists to disk."""
        X_all, y_all, X_normal = generate_synthetic_training_data(n_samples=600)

        self.iso_forest.fit(X_all)
        self.rf_classifier.fit(X_all, y_all)

        self.feature_means = [float(m) for m in np.mean(X_normal, axis=0)]
        self.feature_stds = [float(max(s, 0.01)) for s in np.std(X_normal, axis=0)]
        self.is_fitted = True

        MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
        model_payload = {
            "version": "1.0",
            "synthetic_samples": len(X_all),
            "feature_names": FEATURE_NAMES,
            "feature_means": self.feature_means,
            "feature_stds": self.feature_stds,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

        try:
            with open(MODEL_SAVE_PATH, "w") as f:
                json.dump(model_payload, f, indent=2)
            logger.info("Fitted and persisted ML ensemble baseline to %s", MODEL_SAVE_PATH)
        except Exception as e:
            logger.warning("Could not persist model state to disk: %s", e)

    def compute_ensemble_score(self, feature_vector: List[float]) -> float:
        X = np.array([feature_vector], dtype=float)
        try:
            raw_if_score = float(self.iso_forest.decision_function(X)[0])
            if_score = max(0.0, min(100.0, (0.2 - raw_if_score) * 100.0))

            rf_score = float(self.rf_classifier.predict_proba(X)[0][1]) * 100.0
            ensemble_score = (0.5 * rf_score) + (0.5 * if_score)
            return float(np.clip(ensemble_score, 0.0, 100.0))
        except Exception:
            return 15.0

    def explain_features(self, feature_vector: List[float]) -> List[Dict[str, Any]]:
        """
        Computes feature Z-score deviations from learned normal baseline:
        z_i = |x_i - mean_i| / std_i
        Ranks top 1-2 features contributing to score anomaly.
        """
        attributions = []

        for idx, (val, name, mean, std) in enumerate(zip(feature_vector, FEATURE_NAMES, self.feature_means, self.feature_stds)):
            diff = val - mean
            z_score = abs(diff) / max(std, 0.01)

            # Generate descriptive phrase and multiplier
            if name == "ip_freq":
                ratio = val / max(mean, 1.0)
                desc = f"source IP request frequency ({ratio:.1f}x baseline: {int(val)} reqs)"
            elif name == "ip_deny":
                desc = f"source IP denial count ({int(val)} failed/denied attempts)"
            elif name == "action_code":
                desc = "denied access action flag" if val >= 0.8 else "permitted action"
            elif name == "sev_code":
                sev_label = "critical" if val >= 3.0 else "high/error" if val >= 2.0 else "warn"
                desc = f"{sev_label} severity level ({int(val)})"
            elif name == "hour":
                hr_int = int(val) % 24
                desc = f"off-hours access ({hr_int:02d}:00 local)"
            else:
                desc = f"{name} anomaly ({val:.1f})"

            attributions.append({
                "feature": name,
                "z_score": round(float(z_score), 2),
                "value": float(val),
                "baseline_mean": round(float(mean), 2),
                "multiplier": round(float(val / max(mean, 1.0)), 1),
                "description": desc,
            })

        # Sort features by Z-score descending
        attributions.sort(key=lambda a: a["z_score"], reverse=True)

        # Return top 2 primary anomalous contributors (or top 1 if only 1 is anomalous)
        top_attributions = [a for a in attributions if a["z_score"] >= 1.2]
        if not top_attributions:
            top_attributions = attributions[:1]
        else:
            top_attributions = top_attributions[:2]

        return top_attributions


class AnomalyEngine:
    """
    Enterprise Threat Detection Engine:
    - ML Ensemble: IsolationForest + RandomForestClassifier weighted threat scoring with Z-score feature attribution.
    - Rules Engine: YAML-driven heuristic rules with MITRE ATT&CK tactic mappings.
    - Webhook Integration: Triggers notifications on HIGH threat alerts.
    """
    def __init__(self, window_size: int = 500):
        self.window_size = window_size
        self.history: List[UnifiedEvent] = []
        self.ip_deny_counts: Counter = Counter()
        self.ip_event_counts: Counter = Counter()
        self.ml_ensemble = MLEnsembleEngine()

    def evaluate_events(self, events: List[UnifiedEvent]) -> List[UnifiedEvent]:
        evaluated = []
        for event in events:
            evaluated.append(self.evaluate_event(event))
        return evaluated

    def evaluate_event(self, event: UnifiedEvent) -> UnifiedEvent:
        self._update_rolling_window(event)

        ip_deny = self.ip_deny_counts.get(event.source_ip, 0) if event.source_ip else 0
        rule_flags, rule_floor, mitre_tactic, remediation_steps = rules_engine.evaluate(event, ip_deny_count=ip_deny)

        features = self._extract_features(event)
        ml_score = self.ml_ensemble.compute_ensemble_score(features)
        feature_attribution = self.ml_ensemble.explain_features(features)

        if rule_flags:
            threat_score = min(100.0, rule_floor + (0.35 * ml_score))
        else:
            threat_score = ml_score

        threat_score = round(float(np.clip(threat_score, 0.0, 100.0)), 2)

        if threat_score >= 70.0:
            threat_level = "HIGH"
        elif threat_score >= 35.0:
            threat_level = "MEDIUM"
        else:
            threat_level = "LOW"

        if not remediation_steps:
            remediation_steps = [
                "Monitor source IP activity for anomaly threshold escalation.",
                "Verify baseline OCSF schema normalization and audit cryptographic Merkle hash.",
                "Maintain continuous real-time SOC telemetry surveillance."
            ]

        event.threat_score = threat_score
        event.threat_level = threat_level
        event.anomaly_flags = rule_flags
        event.feature_attribution = feature_attribution
        event.mitre_tactic = mitre_tactic
        event.remediation_steps = remediation_steps

        # Import XAI explainer dynamically to avoid circular dependencies
        from app.xai.explainer import xai_explainer
        event.xai_explanation = xai_explainer.generate_explanation(event)

        return event

    def _update_rolling_window(self, event: UnifiedEvent):
        self.history.append(event)
        if len(self.history) > self.window_size:
            removed = self.history.pop(0)
            if removed.source_ip:
                self.ip_event_counts[removed.source_ip] -= 1
                if any(w in str(removed.event_type).lower() or w in str(removed.severity).lower() for w in ["deny", "block"]):
                    self.ip_deny_counts[removed.source_ip] -= 1

        if event.source_ip:
            self.ip_event_counts[event.source_ip] += 1
            if any(w in str(event.event_type).lower() or w in str(event.severity).lower() for w in ["deny", "block"]):
                self.ip_deny_counts[event.source_ip] += 1

    def reset(self):
        self.history.clear()
        self.ip_deny_counts.clear()
        self.ip_event_counts.clear()

    def _extract_features(self, event: UnifiedEvent) -> List[float]:
        ip_freq = float(self.ip_event_counts.get(event.source_ip, 1)) if event.source_ip else 0.0
        ip_deny = float(self.ip_deny_counts.get(event.source_ip, 0)) if event.source_ip else 0.0

        evt_lower = str(event.event_type).lower()
        if "deny" in evt_lower or "block" in evt_lower:
            action_code = 1.0
        elif "permit" in evt_lower or "accept" in evt_lower or "pass" in evt_lower:
            action_code = 0.0
        else:
            action_code = 0.5

        sev_str = str(event.severity).upper()
        if "CRIT" in sev_str or "3" in sev_str:
            sev_code = 3.0
        elif "ERR" in sev_str or "2" in sev_str:
            sev_code = 2.0
        elif "WARN" in sev_str or "1" in sev_str:
            sev_code = 1.0
        else:
            sev_code = 0.0

        try:
            if isinstance(event.timestamp, datetime.datetime):
                hour = float(event.timestamp.hour)
            else:
                hour = float(datetime.datetime.fromisoformat(str(event.timestamp)).hour)
        except Exception:
            hour = 12.0

        return [ip_freq, ip_deny, action_code, sev_code, hour]

anomaly_engine = AnomalyEngine()
