import os
import re
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from app.config import settings
from app.routers.dashboard import _read_all_normalized_records
from app.routers.auth import get_current_user
from app.detection.correlation import incident_engine

load_dotenv()

logger = logging.getLogger("log_ai.copilot")
router = APIRouter(prefix="/api/v1/copilot", tags=["AI Copilot"])

GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

class CopilotAskRequest(BaseModel):
    question: str = Field(..., description="User question for the AI SOC Copilot")

@router.post("/ask", response_model=Dict[str, Any])
async def ask_copilot(
    payload: CopilotAskRequest,
    current_user=Depends(get_current_user)
):
    """
    POST /api/v1/copilot/ask
    Retrieves recent normalized events and queries Google Gemini LLM API.
    If GEMINI_API_KEY is missing or the call fails, falls back to a question-aware
    rule-assisted SOC analysis engine.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    # Retrieve last 50 ingested events
    all_records = _read_all_normalized_records()
    all_records.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)
    recent_50 = all_records[:50]

    # Summarize events for prompt
    logs_summary_lines = []
    for idx, evt in enumerate(recent_50[:15], 1):
        ts = evt.get("timestamp", "")
        ip = evt.get("source_ip", "N/A")
        lvl = evt.get("threat_level", "LOW")
        score = evt.get("threat_score", 0.0)
        xai = evt.get("xai_explanation", "")
        tactic = evt.get("mitre_tactic", "")
        logs_summary_lines.append(f"[{idx}] {ts} | IP: {ip} | Level: {lvl} ({score}) | Tactic: {tactic} | XAI: {xai}")

    logs_str = "\n".join(logs_summary_lines) if logs_summary_lines else "No recent anomaly logs in storage."

    # Gemini API Key resolution
    api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or ""

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            model = genai.GenerativeModel(GEMINI_MODEL_NAME)
            prompt = (
                "You are an elite SOC Analyst.\n"
                f"Here are the recent security logs:\n{logs_str}\n\n"
                f"Answer the user's question concisely and professionally:\n{question}"
            )

            response = model.generate_content(prompt)
            answer_text = response.text if response and hasattr(response, 'text') else None
            if answer_text:
                return {
                    "answer": answer_text,
                    "status": "success",
                    "model": GEMINI_MODEL_NAME,
                    "logs_analyzed": len(recent_50)
                }
        except Exception as e:
            logger.warning(f"Gemini API call exception: {e}")

    # Fallback to question-aware Rule-Assisted SOC Engine
    fallback_answer = _evaluate_copilot_fallback(question, recent_50)

    return {
        "answer": fallback_answer,
        "status": "success",
        "model": "rule-assisted-soc-engine",
        "logs_analyzed": len(recent_50)
    }


def _evaluate_copilot_fallback(question: str, recent_events: List[Dict[str, Any]]) -> str:
    """
    Question-aware intent router for local SOC analysis fallback engine.
    Analyzes question keywords, IP regexes, MITRE tactics, remediation requests,
    and quantitative metrics to generate specific responses.
    """
    q_lower = question.lower()

    # Intent 1: Specific IP Address Search
    ip_matches = re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", question)
    if ip_matches:
        target_ip = ip_matches[0]
        matching_events = [
            e for e in recent_events
            if e.get("source_ip") == target_ip or e.get("destination_ip") == target_ip
        ]
        if matching_events:
            max_score = max(e.get("threat_score", 0.0) for e in matching_events)
            high_count = sum(1 for e in matching_events if str(e.get("threat_level", "")).upper() == "HIGH")
            tactics = list(set(e.get("mitre_tactic") for e in matching_events if e.get("mitre_tactic")))
            latest_xai = matching_events[0].get("xai_explanation", "No specific XAI explanation.")

            return (
                f"**SOC Analysis for Host IP `{target_ip}`:**\n\n"
                f"• **Correlated Events Detected:** {len(matching_events)}\n"
                f"• **Maximum Threat Score:** {max_score:.1f} / 100.0\n"
                f"• **High Severity Alerts:** {high_count}\n"
                f"• **Observed MITRE Tactics:** {', '.join(tactics) if tactics else 'General Anomaly'}\n\n"
                f"**Latest Forensic Insight:** {latest_xai}\n\n"
                f"**Recommendation:** Inspect perimeter firewall drop logs for {target_ip} and verify active incident status in Executive Command."
            )
        else:
            return (
                f"**SOC Query Result for IP `{target_ip}`:**\n\n"
                f"No security events matching IP `{target_ip}` were found in the recent {len(recent_events)} telemetry records.\n"
                f"The host is currently nominal with no active anomaly flags."
            )

    # Intent 2: How Many / Count / Quantitative Metrics Inquiry (Prioritized over general 'high' keyword)
    if any(k in q_lower for k in ["how many", "count", "number of", "total events", "statistics"]):
        high_cnt = sum(1 for e in recent_events if str(e.get("threat_level", "")).upper() == "HIGH")
        med_cnt = sum(1 for e in recent_events if str(e.get("threat_level", "")).upper() == "MEDIUM")
        low_cnt = sum(1 for e in recent_events if str(e.get("threat_level", "")).upper() == "LOW")
        unique_ips = len(set(e.get("source_ip") for e in recent_events if e.get("source_ip")))
        total_inc = len(incident_engine.incidents)

        return (
            f"**TELEMETRY METRICS & COUNTS:**\n\n"
            f"• **Total Analyzed Events:** {len(recent_events)}\n"
            f"• **High Severity Alerts:** {high_cnt}\n"
            f"• **Medium Severity Alerts:** {med_cnt}\n"
            f"• **Low / Benign Events:** {low_cnt}\n"
            f"• **Unique Source IPs:** {unique_ips}\n"
            f"• **Correlated Incidents:** {total_inc}\n"
        )

    # Intent 3: MITRE ATT&CK / Kill-Chain Inquiry
    if any(k in q_lower for k in ["mitre", "tactic", "attack", "kill chain", "kill-chain", "t1"]):
        tactics = []
        for e in recent_events:
            t = e.get("mitre_tactic")
            if t and t not in tactics:
                tactics.append(t)

        incidents = incident_engine.get_incidents(limit=10)
        active_kill_chains = [f"`{inc['source_ip']}` -> {' -> '.join(inc['mitre_tactics'])}" for inc in incidents if inc.get("mitre_tactics")]

        tactics_str = ", ".join(tactics) if tactics else "T1110 (Brute Force), T1046 (Network Service Discovery)"
        kill_chains_str = "\n".join(f"• {kc}" for kc in active_kill_chains[:3]) if active_kill_chains else "• Nominal activity baseline"

        return (
            f"**MITRE ATT&CK FRAMEWORK & KILL-CHAIN ANALYSIS:**\n\n"
            f"**Observed Attack Tactics:** {tactics_str}\n\n"
            f"**Correlated Incident Kill Chains:**\n{kill_chains_str}\n\n"
            f"**SOC Analyst Guidance:** Monitor active incidents for privilege escalation or credential access progression."
        )

    # Intent 4: Remediation / Fix / Playbook Inquiry
    if any(k in q_lower for k in ["remediation", "fix", "how do i", "playbook", "mitigate", "action"]):
        all_steps = []
        for e in recent_events:
            steps = e.get("remediation_steps") or []
            for s in steps:
                if s not in all_steps:
                    all_steps.append(s)

        if not all_steps:
            all_steps = [
                "Temporarily block offending source IP at perimeter firewall.",
                "Enforce MFA and force password reset for targeted user accounts.",
                "Inspect auth logs for password spray patterns and configure SSH fail2ban rate-limiting."
            ]

        steps_formatted = "\n".join(f"{idx}. {step}" for idx, step in enumerate(all_steps[:5], 1))
        return (
            f"**INCIDENT REMEDIATION PLAYBOOK:**\n\n"
            f"{steps_formatted}\n\n"
            f"**Execution Note:** Mark playbook steps executed in the Forensics Studio or via the Executive Command action modal."
        )

    # Intent 5: High / Critical Threat Inquiry
    if any(k in q_lower for k in ["high severity", "high threat", "critical", "severe", "severity"]):
        high_events = [e for e in recent_events if str(e.get("threat_level", "")).upper() == "HIGH" or e.get("threat_score", 0.0) >= 70.0]
        if high_events:
            ips = list(set(e.get("source_ip", "N/A") for e in high_events))
            tactics = list(set(e.get("mitre_tactic", "Threat Anomaly") for e in high_events if e.get("mitre_tactic")))
            return (
                f"**CRITICAL THREAT ANALYSIS:**\n\n"
                f"Found **{len(high_events)} HIGH-severity alert(s)** in recent telemetry:\n"
                f"• **Offending Source IPs:** {', '.join(ips)}\n"
                f"• **MITRE Attack Vectors:** {', '.join(tactics)}\n"
                f"• **Peak Threat Score:** {max(e.get('threat_score', 0.0) for e in high_events):.1f}\n\n"
                f"**Action Required:** Immediate quarantine of host IPs {', '.join(ips[:3])} recommended."
            )
        else:
            return (
                "**THREAT LEVEL ASSESSOR:**\n\n"
                "No HIGH-severity threats (threat score >= 70.0) were detected in the recent telemetry buffer. "
                "System threat posture is currently nominal to moderate."
            )

    # Default Fallback (Last Resort)
    high_threats = [e for e in recent_events if str(e.get("threat_level", "")).upper() == "HIGH"]
    med_threats = [e for e in recent_events if str(e.get("threat_level", "")).upper() == "MEDIUM"]

    return (
        f"**SOC Analyst Assessment for:** *'{question}'*\n\n"
        f"Analyzed **{len(recent_events)}** recent log records across normalized storage:\n"
        f"• **High Severity Threats:** {len(high_threats)}\n"
        f"• **Medium Severity Alerts:** {len(med_threats)}\n"
        f"• **Primary Vectors:** {high_threats[0].get('mitre_tactic', 'T1110 Brute Force') if high_threats else 'System Nominal'}\n\n"
        f"**Recommendation:** Check high-risk IP addresses in perimeter firewall rules, review active incident status dropdowns in Executive Command, and execute 3-step remediation playbooks for any unresolved alerts."
    )
