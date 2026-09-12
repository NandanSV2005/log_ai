import hashlib
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field
from app.routers.ingest import limiter

router = APIRouter(prefix="/api/v1/demo", tags=["Public Forensic Demo"])

class DemoAnalyzeRequest(BaseModel):
    log_line: str = Field(..., description="Raw log line to analyze", max_length=2000)

PRESET_LOGS = [
    {
        "id": "cisco-asa",
        "label": "Cisco ASA Deny",
        "log_line": '%ASA-4-106023: Deny udp src outside:185.220.101.5/54312 dst inside:10.0.4.12/445 by access-group "OUTSIDE_IN" [0x7f4c9a81, 0x0]'
    },
    {
        "id": "fortinet-utm",
        "label": "Fortinet FortiGate",
        "log_line": "CEF:0|Fortinet|FortiGate|v7.2|traffic:denied|src=10.0.4.12 dst=172.16.0.4 act=BLOCKED cat=virus msg='Trojan.Generic.KD.452'"
    },
    {
        "id": "ssh-bruteforce",
        "label": "Linux SSH Failed",
        "log_line": "Failed password for invalid user admin from 192.168.1.105 port 52140 ssh2"
    },
    {
        "id": "suricata-tls",
        "label": "Suricata Alert",
        "log_line": "Suricata[3819]: [1:2018959:4] ET Suspicious Inbound TLS Session from 45.33.32.156:443 to 10.0.0.5:51234"
    }
]

@router.get("/presets", summary="Get preset sample log lines for demo")
async def get_demo_presets():
    return {"presets": PRESET_LOGS}

@router.post(
    "/analyze",
    summary="Stateless, rate-limited public log analysis demo",
    description="Processes a raw log string through parsing, OCSF mapping, SHA-256 calculation, and XAI threat analysis without persisting data or modifying audit chains."
)
@limiter.limit("60/minute")
async def analyze_demo_log(request: Request, body: DemoAnalyzeRequest):
    raw_line = body.log_line.strip() if body.log_line else ""
    if not raw_line:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty or whitespace-only log line provided."
        )

    if len(raw_line) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Log line exceeds maximum allowed length of 2000 characters."
        )

    start_time = time.perf_counter()

    try:
        # Compute ephemeral SHA-256 payload hash and Merkle leaf
        computed_hash = hashlib.sha256(raw_line.encode("utf-8")).hexdigest()
        merkle_leaf = "0x" + hashlib.sha256(f"leaf:{computed_hash}".encode("utf-8")).hexdigest()[:16]

        # Stage 1 & 2: Dynamic Parsing & OCSF Normalization
        dynamic_parser = DynamicParser()
        parsed_events = dynamic_parser.parse(raw_line)
        if not parsed_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to extract schema vectors from the provided log line format."
            )
        
        event = parsed_events[0]

        # Stage 3: ML Anomaly Evaluation
        enriched_events = anomaly_engine.evaluate_events([event])
        enriched = enriched_events[0]

        # Stage 4: XAI Reasoning Explanation
        xai_reasoning = xai_explainer.generate_explanation(enriched)

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        transform_time_str = f"{elapsed_ms:.2f}ms" if elapsed_ms >= 1.0 else f"<{max(0.01, elapsed_ms):.2f}ms"

        level = enriched.threat_level.upper()
        if level in ["CRITICAL", "HIGH"]:
            action = "BLOCKED"
        elif level == "MEDIUM":
            action = "ALERT ANNOTATED"
        else:
            action = "LOGGED & VERIFIED"

        mitre_tactic = getattr(enriched, "mitre_tactic", None)
        if not mitre_tactic:
            if enriched.threat_score >= 80.0 or level in ["CRITICAL", "HIGH"]:
                mitre_tactic = "T1021.002: Lateral SMB Probe"
            elif "fail" in raw_line.lower() or "deny" in raw_line.lower() or "brute" in raw_line.lower():
                mitre_tactic = "T1110: Brute Force Authentication"
            else:
                mitre_tactic = "T1071: Application Layer Protocol"

        return {
            "status": "success",
            "raw_line": raw_line,
            "extracted_fields": {
                "source_ip": enriched.source_ip or "N/A",
                "destination_ip": enriched.destination_ip or "N/A",
                "event_type": enriched.event_type or "unstructured_log",
                "severity": str(enriched.severity),
                "sha256": f"{computed_hash[:20]}...",
                "full_sha256": computed_hash,
                "merkle_leaf": merkle_leaf
            },
            "classification_metadata": {
                "schema_version": "OCSF 1.1.0",
                "transform_time": transform_time_str,
                "parsed_class": (enriched.event_type or "NETWORK_ACTIVITY").upper()
            },
            "verdict": {
                "threat_level": level,
                "threat_score": round(float(enriched.threat_score), 1),
                "mitre_technique": mitre_tactic,
                "xai_reasoning": xai_reasoning,
                "action": action
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse and analyze log line. Please ensure format is valid text."
        )
