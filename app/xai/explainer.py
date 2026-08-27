from typing import List, Dict, Any
from app.normalization.schema import UnifiedEvent

class XAIExplainer:
    """
    Explainable AI (XAI) Engine:
    Translates quantitative ML feature attribution Z-scores and rule-engine triggers
    into plain-English, actionable security insights for forensic analysis.
    """

    FLAG_DESCRIPTIONS = {
        "repeated_deny": "rapid repeated denial of service / access attempts",
        "suricata_alert": "high-confidence Suricata / critical security alert signatures",
        "external_source": "an external public IP source",
    }

    def generate_explanation(self, event: UnifiedEvent) -> str:
        """
        Generates a clear, plain-English summary stating top driving ML features (with Z-scores/multipliers)
        and clearly separates rule-based triggers into a distinct section.
        """
        score = event.threat_score
        level = event.threat_level.upper()
        flags = event.anomaly_flags or []
        attributions: List[Dict[str, Any]] = getattr(event, "feature_attribution", []) or []

        # Benign / Low Risk Event
        if score < 35.0 and not flags and not any(a.get("z_score", 0) >= 2.0 for a in attributions):
            return (
                f"Normal event activity (Score: {score:.1f}) with LOW threat level. "
                "No security anomalies detected."
            )

        # ML Feature Attribution Section
        level_phrase = f"{level.capitalize()} threat (Score: {score:.1f}) detected"
        attr_phrases = []
        for attr in attributions:
            desc = attr.get("description")
            z = attr.get("z_score", 0.0)
            if desc and z >= 1.0:
                attr_phrases.append(desc)

        if attr_phrases:
            if len(attr_phrases) == 1:
                attr_str = attr_phrases[0]
            else:
                attr_str = f"{attr_phrases[0]} and {attr_phrases[1]}"
            ml_summary = f"{level_phrase} — elevated primarily due to {attr_str}"
        else:
            ml_summary = f"{level_phrase} based on statistical behavioral anomaly patterns"

        # Context details (Source IP, Target IP, Event Type)
        context_parts = []
        if event.source_ip:
            context_parts.append(f"from source IP {event.source_ip}")
        if event.destination_ip:
            context_parts.append(f"targeting {event.destination_ip}")
        if event.event_type and event.event_type not in ["unstructured_log", "text_log"]:
            context_parts.append(f"via [{event.event_type}]")

        if context_parts:
            ml_summary += f" {' '.join(context_parts)}"
        ml_summary += "."

        # Separate Rule-Based Triggers Section
        if flags:
            rule_descriptions = []
            for flag in flags:
                desc = self.FLAG_DESCRIPTIONS.get(flag, flag.replace("_", " "))
                rule_descriptions.append(f"{desc} [{flag}]")
            
            rule_str = ", ".join(rule_descriptions)
            ml_summary += f" Rule Triggers: {rule_str}."

        return ml_summary

# Global singleton XAI explainer instance
xai_explainer = XAIExplainer()
