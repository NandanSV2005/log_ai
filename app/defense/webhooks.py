import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("log_ai.webhooks")

class WebhookNotifier:
    """
    Webhook Integration Module.
    Fires a generic POST request payload containing threat details whenever an event is flagged as HIGH threat.
    """
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url

    async def trigger_high_threat_webhook(self, event_data: Dict[str, Any]) -> bool:
        if not self.webhook_url:
            logger.debug("No webhook URL configured; skipping HTTP POST trigger.")
            return False

        payload = {
            "alert": "HIGH THREAT DETECTED",
            "event_type": event_data.get("event_type"),
            "threat_score": event_data.get("threat_score"),
            "threat_level": event_data.get("threat_level"),
            "source_ip": event_data.get("source_ip"),
            "mitre_tactic": event_data.get("mitre_tactic"),
            "xai_explanation": event_data.get("xai_explanation"),
            "timestamp": str(event_data.get("timestamp")),
            "raw_event": event_data.get("original_event"),
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(self.webhook_url, json=payload)
                return res.status_code < 400
        except Exception as e:
            logger.error(f"Failed to deliver webhook notification to {self.webhook_url}: {e}")
            return False

webhook_notifier = WebhookNotifier()
