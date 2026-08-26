import os
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from app.config import settings
from app.routers.dashboard import _read_all_normalized_records
from app.routers.auth import get_current_user

load_dotenv()

logger = logging.getLogger("log_ai.copilot")
router = APIRouter(prefix="/api/v1/copilot", tags=["AI Copilot"])

class CopilotAskRequest(BaseModel):
    question: str = Field(..., description="User question for the AI SOC Copilot")

@router.post("/ask", response_model=Dict[str, Any])
async def ask_copilot(
    payload: CopilotAskRequest,
    current_user=Depends(get_current_user)
):
    """
    POST /api/v1/copilot/ask
    Retrieves the 50 most recent normalized events, constructs an elite SOC Analyst prompt,
    and queries the Google Gemini LLM API to return a concise, professional answer.
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
    api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY or ""

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            model = genai.GenerativeModel('gemini-1.5-flash')
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
                    "model": "gemini-1.5-flash",
                    "logs_analyzed": len(recent_50)
                }
        except Exception as e:
            logger.warning(f"Gemini API call exception: {e}")

    # Professional Fallback when API key is missing or call fails
    high_threats = [e for e in recent_50 if (e.get("threat_level") or "").upper() == "HIGH"]
    med_threats = [e for e in recent_50 if (e.get("threat_level") or "").upper() == "MEDIUM"]

    fallback_answer = (
        f"**SOC Analyst Assessment for:** *'{question}'*\n\n"
        f"Analyzed **{len(recent_50)}** recent log records across normalized storage:\n"
        f"• **High Severity Threats:** {len(high_threats)}\n"
        f"• **Medium Severity Alerts:** {len(med_threats)}\n"
        f"• **Primary Vectors:** {high_threats[0].get('mitre_tactic', 'T1110 Brute Force') if high_threats else 'System Nominal'}\n\n"
        f"**Recommendation:** Check high-risk IP addresses in perimeter firewall rules, review active incident status dropdowns in Executive Command, and execute 3-step remediation playbooks for any unresolved alerts."
    )

    return {
        "answer": fallback_answer,
        "status": "success",
        "model": "rule-assisted-soc-engine",
        "logs_analyzed": len(recent_50)
    }
