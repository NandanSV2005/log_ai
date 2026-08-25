from typing import List
from app.normalization.schema import UnifiedEvent

class XAIExplainer:
    """
    Explainable AI (XAI) Engine:
    Translates numeric threat scores, threat levels, and anomaly flags into
    human-readable, plain-English security insights for forensic analysis and UI dashboards.
    """

    FLAG_DESCRIPTIONS = {
        "repeated_deny": "rapid repeated denial of service / access attempts",
        "suricata_alert": "high-confidence Suricata / critical security alert signatures",
        "external_source": "an external public IP source",
    }

    def generate_explanation(self, event: UnifiedEvent) -> str:
        """
        Generates a clear, plain-English summary based on threat score, threat level, and anomaly flags.
        """
        score = event.threat_score
        level = event.threat_level.upper()
        flags = event.anomaly_flags or []

        # Benign / Low Risk Event
        if score < 35.0 and not flags:
            return (
                f"Normal event activity (Score: {score:.1f}) with LOW threat level. "
                "No security anomalies detected."
            )

        # Anomalous / Elevated Risk Event
        level_phrase = f"{level.capitalize()} threat (Score: {score:.1f}) detected"

        reasons: List[str] = []
        for flag in flags:
            if flag in self.FLAG_DESCRIPTIONS:
                reasons.append(self.FLAG_DESCRIPTIONS[flag])
            else:
                reasons.append(flag.replace("_", " "))

        if reasons:
            if len(reasons) == 1:
                reason_str = reasons[0]
            elif len(reasons) == 2:
                reason_str = f"{reasons[0]} and {reasons[1]}"
            else:
                reason_str = f"{', '.join(reasons[:-1])}, and {reasons[-1]}"
            explanation = f"{level_phrase} due to {reason_str}"
        else:
            explanation = f"{level_phrase} based on anomalous behavioral patterns"

        # Context details (Source IP, Destination IP, Event Type)
        context_parts = []
        if event.source_ip:
            context_parts.append(f"from source IP {event.source_ip}")
        if event.destination_ip:
            context_parts.append(f"targeting {event.destination_ip}")
        if event.event_type and event.event_type not in ["unstructured_log", "text_log"]:
            context_parts.append(f"via [{event.event_type}]")

        if context_parts:
            explanation += f" {' '.join(context_parts)}"

        explanation += "."
        return explanation

# Global singleton XAI explainer instance
xai_explainer = XAIExplainer()
