import yaml
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

DEFAULT_RULES_FILE = Path(__file__).parent / "rules.yaml"

class RulesEngine:
    """
    YAML-driven Rules Engine for security telemetry heuristic scanning.
    Reads rules from YAML definitions and maps flagged events to MITRE ATT&CK tactics.
    """
    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = rules_path or DEFAULT_RULES_FILE
        self.rules: List[Dict[str, Any]] = []
        self.load_rules()

    def load_rules(self):
        if not self.rules_path.exists():
            self.rules = []
            return

        try:
            with open(self.rules_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                self.rules = data.get("rules", []) if isinstance(data, dict) else []
        except Exception:
            self.rules = []

    def evaluate(self, event, ip_deny_count: int = 0) -> Tuple[List[str], float, Optional[str], List[str]]:
        """
        Evaluates an event object against loaded YAML detection rules.
        Returns:
            (triggered_flags, severity_floor, primary_mitre_tactic, remediation_steps)
        """
        flags: List[str] = []
        floor_score = 0.0
        mitre_tactics: List[str] = []
        remediation_steps: List[str] = []

        evt_type = str(getattr(event, "event_type", "")).lower()
        severity = str(getattr(event, "severity", "")).upper()
        original = str(getattr(event, "original_event", "")).lower()
        src_ip = getattr(event, "source_ip", None)

        for rule in self.rules:
            matched = False
            rule_floor_override = None
            condition = rule.get("condition")
            keywords = [k.lower() for k in rule.get("keywords", [])]

            if condition == "repeated_deny":
                if ip_deny_count >= 3:
                    matched = True
                    rule_floor_override = 75.0
                elif any(kw in original for kw in ["deny", "failed password", "invalid user"]):
                    matched = True

            elif condition == "suricata_alert":
                if "suricata:" in evt_type or severity in ["CRITICAL", "3"] or "suricata" in original:
                    matched = True

            elif condition == "external_source":
                if src_ip and not self._is_private_ip(src_ip):
                    matched = True

            elif condition == "privilege_escalation":
                if any(kw in original for kw in keywords):
                    matched = True

            elif keywords and any(kw in original for kw in keywords):
                matched = True

            if matched:
                flag_name = condition or str(rule.get("id"))
                if flag_name not in flags:
                    flags.append(flag_name)
                rule_floor = rule_floor_override if rule_floor_override is not None else float(rule.get("severity_floor", 0.0))
                if floor_score == 0.0:
                    floor_score = rule_floor
                else:
                    floor_score = min(100.0, max(floor_score, rule_floor + 15.0))
                tactic = rule.get("mitre_tactic")
                if tactic and tactic not in mitre_tactics:
                    mitre_tactics.append(tactic)

                playbook = rule.get("remediation_playbook", [])
                for step in playbook:
                    if step not in remediation_steps:
                        remediation_steps.append(step)

        primary_mitre = mitre_tactics[0] if mitre_tactics else None
        return flags, floor_score, primary_mitre, remediation_steps

    @staticmethod
    def _is_private_ip(ip_str: str) -> bool:
        if ip_str.startswith("10.") or ip_str.startswith("192.168.") or ip_str.startswith("127."):
            return True
        if ip_str.startswith("172."):
            try:
                second = int(ip_str.split(".")[1])
                return 16 <= second <= 31
            except Exception:
                pass
        return False

rules_engine = RulesEngine()
