import re
import math
import random
import datetime
from collections import Counter
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from app.normalization.schema import UnifiedEvent

class IsolationTreeNode:
    """Node in an Isolation Tree."""
    def __init__(
        self,
        left: Optional['IsolationTreeNode'] = None,
        right: Optional['IsolationTreeNode'] = None,
        split_feature: Optional[int] = None,
        split_value: Optional[float] = None,
        size: int = 0,
    ):
        self.left = left
        self.right = right
        self.split_feature = split_feature
        self.split_value = split_value
        self.size = size

    @property
    def is_leaf(self) -> bool:
        return self.left is None and self.right is None

class IsolationTree:
    """Single Isolation Tree."""
    def __init__(self, max_depth: int):
        self.max_depth = max_depth
        self.root: Optional[IsolationTreeNode] = None

    def fit(self, X: np.ndarray, depth: int = 0) -> IsolationTreeNode:
        n_samples, n_features = X.shape

        if depth >= self.max_depth or n_samples <= 1:
            return IsolationTreeNode(size=n_samples)

        # Randomly select feature
        feat_idx = random.randint(0, n_features - 1)
        feat_vals = X[:, feat_idx]
        min_val, max_val = feat_vals.min(), feat_vals.max()

        if min_val == max_val:
            return IsolationTreeNode(size=n_samples)

        # Random split value
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
    """
    Pure Python & NumPy IsolationForest implementation.
    Identical algorithmic structure to scikit-learn IsolationForest,
    free of native C-DLL policy dependencies.
    """
    def __init__(self, n_estimators: int = 10, max_samples: int = 64):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.trees: List[IsolationTree] = []
        self.c_factor: float = 1.0

    def fit(self, X: np.ndarray):
        n_samples = len(X)
        if n_samples == 0:
            return

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

    def compute_anomaly_score(self, x: np.ndarray) -> float:
        if not self.trees:
            return 0.0
        paths = [t.path_length(x, t.root) for t in self.trees]
        avg_path = float(np.mean(paths))
        # Anomaly score s = 2^(-E(h(x)) / c(n))
        score = 2.0 ** (-avg_path / self.c_factor)
        return float(score)

class AnomalyEngine:
    """
    Hybrid Anomaly Detection & Threat Scoring Engine:
    - Unsupervised ML: IsolationForest trained on rolling feature vectors.
    - Heuristic Rules: Detects repeated denies, Suricata alerts, and external/suspicious sources.
    - Ensemble Threat Scoring: Computes threat_score (0-100) and threat_level (LOW, MEDIUM, HIGH).
    """

    def __init__(self, window_size: int = 500):
        self.window_size = window_size
        self.history: List[UnifiedEvent] = []
        self.ip_deny_counts: Counter = Counter()
        self.ip_event_counts: Counter = Counter()
        
        self.model = IsolationForest(n_estimators=10, max_samples=64)
        self.is_fitted = False

    def evaluate_events(self, events: List[UnifiedEvent]) -> List[UnifiedEvent]:
        """Evaluates a list of UnifiedEvent objects, enriching them with threat metrics."""
        evaluated = []
        for event in events:
            evaluated.append(self.evaluate_event(event))
        return evaluated

    def evaluate_event(self, event: UnifiedEvent) -> UnifiedEvent:
        """Evaluates a single UnifiedEvent, populating threat_score, threat_level, and anomaly_flags."""
        # 1. Update rolling window state
        self._update_rolling_window(event)

        # 2. Extract Rule-Based Flags
        rule_flags, rule_floor = self._evaluate_rules(event)

        # 3. Compute ML IsolationForest Anomaly Score
        ml_score = self._evaluate_ml_anomaly(event)

        # 4. Ensemble Weighted Threat Scoring
        if rule_flags:
            threat_score = min(100.0, rule_floor + (ml_score * 0.3))
        else:
            threat_score = min(100.0, ml_score)

        threat_score = round(float(threat_score), 2)

        # 5. Derive Threat Level
        if threat_score >= 70.0:
            threat_level = "HIGH"
        elif threat_score >= 35.0:
            threat_level = "MEDIUM"
        else:
            threat_level = "LOW"

        event.threat_score = threat_score
        event.threat_level = threat_level
        event.anomaly_flags = rule_flags

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

        # Retrain IsolationForest periodically if enough samples exist
        if len(self.history) >= 20 and len(self.history) % 50 == 0:
            self._fit_isolation_forest()

    def reset(self):
        """Resets engine history and counters for test isolation."""
        self.history.clear()
        self.ip_deny_counts.clear()
        self.ip_event_counts.clear()
        self.is_fitted = False

    def _evaluate_rules(self, event: UnifiedEvent) -> Tuple[List[str], float]:
        flags: List[str] = []
        floor_score = 0.0

        # Rule 1: Repeated Denies from same Source IP (Brute Force / Scan signal)
        if event.source_ip and self.ip_deny_counts[event.source_ip] >= 3:
            flags.append("repeated_deny")
            floor_score = max(floor_score, 65.0)

        # Rule 2: High-Confidence Suricata / Critical Security Alerts
        if "suricata:" in str(event.event_type).lower() or str(event.severity).upper() in ["CRITICAL", "3"]:
            flags.append("suricata_alert")
            floor_score = max(floor_score, 85.0)

        # Rule 3: External / Public Source IP
        if event.source_ip and not self._is_private_ip(event.source_ip):
            flags.append("external_source")
            floor_score = max(floor_score, 25.0)

        return flags, floor_score

    def _evaluate_ml_anomaly(self, event: UnifiedEvent) -> float:
        features = self._extract_features(event)
        if not self.is_fitted:
            ip_freq = self.ip_event_counts.get(event.source_ip, 1) if event.source_ip else 1
            return min(80.0, ip_freq * 15.0) if ip_freq > 3 else 10.0

        try:
            x_arr = np.array(features, dtype=float)
            anomaly_s = self.model.compute_anomaly_score(x_arr)
            # Map anomaly score s (0.3 to 0.9) to 0-100 scale
            ml_anomaly_score = max(0.0, min(100.0, (anomaly_s - 0.4) * 200.0))
            return ml_anomaly_score
        except Exception:
            return 15.0

    def _extract_features(self, event: UnifiedEvent) -> List[float]:
        # Feature 1: Source IP event frequency
        ip_freq = float(self.ip_event_counts.get(event.source_ip, 1)) if event.source_ip else 0.0

        # Feature 2: Source IP deny count
        ip_deny = float(self.ip_deny_counts.get(event.source_ip, 0)) if event.source_ip else 0.0

        # Feature 3: Action code (0=permit, 1=deny/block, 0.5=other)
        evt_lower = str(event.event_type).lower()
        if "deny" in evt_lower or "block" in evt_lower:
            action_code = 1.0
        elif "permit" in evt_lower or "accept" in evt_lower or "pass" in evt_lower:
            action_code = 0.0
        else:
            action_code = 0.5

        # Feature 4: Severity code (0=Info, 1=Warn, 2=Err, 3=Crit)
        sev_str = str(event.severity).upper()
        if "CRIT" in sev_str or "3" in sev_str:
            sev_code = 3.0
        elif "ERR" in sev_str or "2" in sev_str:
            sev_code = 2.0
        elif "WARN" in sev_str or "1" in sev_str:
            sev_code = 1.0
        else:
            sev_code = 0.0

        # Feature 5: Hour of day
        try:
            if isinstance(event.timestamp, datetime.datetime):
                hour = float(event.timestamp.hour)
            else:
                hour = float(datetime.datetime.fromisoformat(str(event.timestamp)).hour)
        except Exception:
            hour = 12.0

        return [ip_freq, ip_deny, action_code, sev_code, hour]

    def _fit_isolation_forest(self):
        try:
            X_train = np.array([self._extract_features(e) for e in self.history], dtype=float)
            self.model.fit(X_train)
            self.is_fitted = True
        except Exception:
            pass

    @staticmethod
    def _is_private_ip(ip_str: str) -> bool:
        """Checks if an IPv4 address is in standard RFC1918 private ranges."""
        if ip_str.startswith("10.") or ip_str.startswith("192.168.") or ip_str.startswith("127."):
            return True
        if ip_str.startswith("172."):
            try:
                parts = ip_str.split(".")
                second = int(parts[1])
                return 16 <= second <= 31
            except Exception:
                pass
        return False

# Global anomaly detection engine instance
anomaly_engine = AnomalyEngine()
