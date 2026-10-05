import json
import time
import logging
import yaml
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Request, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.routers.auth import get_current_user
from app.routers.dashboard import _read_all_normalized_records, _get_username

logger = logging.getLogger("log_ai.rules")

router = APIRouter(prefix="/api/v1/rules", tags=["Rules"])

class RuleTestRequest(BaseModel):
    yaml_content: Optional[str] = Field(default=None, description="Raw YAML detection rule string")
    rule: Optional[str] = Field(default=None, description="Alternative key for raw YAML rule string")

def evaluate_rule_condition(condition: Dict[str, Any], event: Dict[str, Any]) -> bool:
    """
    Evaluates whether a single stored normalized event satisfies the rule's condition mapping.
    
    CONDITION MATCHING SEMANTICS (Documented for predictable authoring):
    1. event_type (Substring / Prefix Match, Case-Insensitive):
       - Real normalized events store hierarchical taxonomy strings such as
         'cisco_asa:deny:outside_acl', 'cisco_asa:permit:ASA-302013', or 'sudo:exec'.
       - Rule authors specify broad taxonomy classes (e.g., 'cisco_asa') or specific tags
         (e.g., 'cisco_asa:deny'). A substring match ensures 'cisco_asa' matches all Cisco logs,
         while exact equality would fail against real parsed data.
    
    2. threat_score_gt vs threat_score_gte (Numeric Comparison):
       - 'threat_score_gt': Strictly greater than (event.threat_score > threshold).
         Example: with a score of 75.0, threat_score_gt: 75.0 evaluates to False.
       - 'threat_score_gte': Greater than or equal to (event.threat_score >= threshold).
         Example: with a score of 75.0, threat_score_gte: 75.0 evaluates to True.
       - 'threat_score_lt': Strictly less than (event.threat_score < threshold).
       - 'threat_score_lte': Less than or equal to (event.threat_score <= threshold).
       - 'threat_score': If specified without suffix, treated as >= (greater-than-or-equal).
    
    3. mitre_tactic (Substring Match, Case-Insensitive):
       - Stored events contain enriched strings like 'T1110 - Brute Force' or 'T1078 - Valid Accounts'.
       - Rule conditions specifying 'T1110' match 'T1110 - Brute Force' via substring search.
    
    4. threat_level (Exact Match, Case-Insensitive):
       - Matches 'HIGH', 'MEDIUM', 'LOW', 'CRITICAL'.
    
    5. Network Parameters (source_ip, destination_ip, protocol):
       - source_ip / destination_ip: Exact string equality.
       - protocol: Case-insensitive string equality (e.g., 'TCP' == 'tcp').
    
    All condition keys are evaluated with logical AND. If any key fails, the event is rejected.
    """
    if not isinstance(condition, dict):
        return False

    # 1. Event Type matching (substring / prefix, case-insensitive)
    if "event_type" in condition:
        cond_evt = str(condition["event_type"]).strip().lower()
        rec_evt = str(event.get("event_type") or "").strip().lower()
        if cond_evt not in rec_evt:
            return False

    # 2. MITRE Tactic matching (substring, case-insensitive)
    if "mitre_tactic" in condition:
        cond_tactic = str(condition["mitre_tactic"]).strip().lower()
        rec_tactic = str(event.get("mitre_tactic") or "").strip().lower()
        if cond_tactic not in rec_tactic:
            return False

    # 3. Threat Score thresholds
    ev_score = float(event.get("threat_score") or 0.0)

    if "threat_score_gt" in condition:
        try:
            threshold = float(condition["threat_score_gt"])
            if not (ev_score > threshold):
                return False
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric threshold for 'threat_score_gt': {condition['threat_score_gt']}")

    if "threat_score_gte" in condition:
        try:
            threshold = float(condition["threat_score_gte"])
            if not (ev_score >= threshold):
                return False
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric threshold for 'threat_score_gte': {condition['threat_score_gte']}")

    if "threat_score_lt" in condition:
        try:
            threshold = float(condition["threat_score_lt"])
            if not (ev_score < threshold):
                return False
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric threshold for 'threat_score_lt': {condition['threat_score_lt']}")

    if "threat_score_lte" in condition:
        try:
            threshold = float(condition["threat_score_lte"])
            if not (ev_score <= threshold):
                return False
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric threshold for 'threat_score_lte': {condition['threat_score_lte']}")

    if "threat_score" in condition:
        try:
            threshold = float(condition["threat_score"])
            if not (ev_score >= threshold):
                return False
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric threshold for 'threat_score': {condition['threat_score']}")

    # 4. Threat Level (case-insensitive exact)
    if "threat_level" in condition:
        cond_lvl = str(condition["threat_level"]).strip().upper()
        rec_lvl = str(event.get("threat_level") or "").strip().upper()
        if cond_lvl != rec_lvl:
            return False

    # 5. IP addresses
    if "source_ip" in condition:
        cond_src = str(condition["source_ip"]).strip()
        rec_src = str(event.get("source_ip") or "").strip()
        if cond_src != rec_src:
            return False

    if "destination_ip" in condition:
        cond_dst = str(condition["destination_ip"]).strip()
        rec_dst = str(event.get("destination_ip") or "").strip()
        if cond_dst != rec_dst:
            return False

    # 6. Protocol (case-insensitive exact)
    if "protocol" in condition:
        cond_proto = str(condition["protocol"]).strip().upper()
        rec_proto = str(event.get("protocol") or "").strip().upper()
        if cond_proto != rec_proto:
            return False

    return True

@router.post("/test", response_model=Dict[str, Any])
async def test_rule(
    request: Request,
    current_user=Depends(get_current_user),
):
    """
    Parses, validates, compiles, and evaluates a custom YAML detection rule against real normalized events.
    
    Accepts raw YAML text (text/plain, application/x-yaml) or a JSON body with 'yaml_content' or 'rule'.
    Returns structured validation metrics, compilation execution time, matched event counts, and a real sample event.
    """
    start_time = time.perf_counter()
    username = _get_username(current_user)

    # 1. Extract raw YAML content from request body
    content_type = request.headers.get("content-type", "").lower()
    raw_bytes = await request.body()
    raw_text = raw_bytes.decode("utf-8", errors="replace").strip()

    yaml_str = ""
    if "application/json" in content_type:
        try:
            body_json = json.loads(raw_text)
            if isinstance(body_json, dict):
                yaml_str = body_json.get("yaml_content") or body_json.get("rule") or body_json.get("yaml") or ""
            elif isinstance(body_json, str):
                yaml_str = body_json
        except Exception:
            yaml_str = raw_text
    else:
        yaml_str = raw_text

    if not yaml_str:
        return {
            "status": "VALIDATION_FAILED",
            "syntax_valid": False,
            "rule_name": "Unknown",
            "severity": "UNKNOWN",
            "error": "Empty rule payload. Please provide valid YAML detection rule content.",
            "detail": "The request body was empty or missing YAML content.",
            "matched_records_count": 0,
            "compilation_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "sample_match_event": None,
            "sample_event_detail": None,
        }

    # 2. Parse YAML using PyYAML
    try:
        rule_data = yaml.safe_load(yaml_str)
    except yaml.YAMLError as exc:
        logger.info("YAML syntax error in rule test submission: %s", exc)
        return {
            "status": "VALIDATION_FAILED",
            "syntax_valid": False,
            "rule_name": "Syntax Error",
            "severity": "UNKNOWN",
            "error": f"YAML Syntax Error: {str(exc)}",
            "detail": "Failed to parse YAML text. Check indentation, quotes, and colon placement.",
            "matched_records_count": 0,
            "compilation_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "sample_match_event": None,
            "sample_event_detail": None,
        }

    if not isinstance(rule_data, dict):
        return {
            "status": "VALIDATION_FAILED",
            "syntax_valid": False,
            "rule_name": "Structure Error",
            "severity": "UNKNOWN",
            "error": "Invalid Rule Root: Detection rule must be a YAML mapping (key-value dictionary).",
            "detail": f"Received YAML parsed as '{type(rule_data).__name__}' instead of a mapping dictionary.",
            "matched_records_count": 0,
            "compilation_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "sample_match_event": None,
            "sample_event_detail": None,
        }

    # 3. Validate required rule schema fields
    rule_name = str(rule_data.get("name") or "").strip()
    if not rule_name:
        return {
            "status": "VALIDATION_FAILED",
            "syntax_valid": False,
            "rule_name": "Missing Name",
            "severity": str(rule_data.get("severity") or "UNKNOWN"),
            "error": "Missing Required Field: Rule must specify a 'name' string.",
            "detail": "Field 'name' is required to identify the detection rule.",
            "matched_records_count": 0,
            "compilation_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "sample_match_event": None,
            "sample_event_detail": None,
        }

    condition = rule_data.get("condition")
    if not isinstance(condition, dict) or not condition:
        return {
            "status": "VALIDATION_FAILED",
            "syntax_valid": False,
            "rule_name": rule_name,
            "severity": str(rule_data.get("severity") or "UNKNOWN"),
            "error": "Missing Required Field: Rule must define a non-empty 'condition' dictionary.",
            "detail": "Field 'condition' must specify matching criteria (e.g., event_type, threat_score_gt/gte, mitre_tactic).",
            "matched_records_count": 0,
            "compilation_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "sample_match_event": None,
            "sample_event_detail": None,
        }

    severity = str(rule_data.get("severity") or "MEDIUM").upper()

    # 4. Evaluate condition against real stored normalized events
    try:
        stored_records = _read_all_normalized_records(owner_username=username)
    except Exception as exc:
        logger.error("Error reading stored events for rule test: %s", exc)
        stored_records = []

    matched_events: List[Dict[str, Any]] = []
    try:
        for rec in stored_records:
            if evaluate_rule_condition(condition, rec):
                matched_events.append(rec)
    except ValueError as val_err:
        return {
            "status": "VALIDATION_FAILED",
            "syntax_valid": False,
            "rule_name": rule_name,
            "severity": severity,
            "error": f"Condition Evaluation Error: {str(val_err)}",
            "detail": "Failed evaluating condition fields against event telemetry.",
            "matched_records_count": 0,
            "compilation_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "sample_match_event": None,
            "sample_event_detail": None,
        }

    compilation_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    matched_count = len(matched_events)

    # 5. Build authentic sample match summary
    sample_match_str: Optional[str] = None
    sample_detail: Optional[Dict[str, Any]] = None

    if matched_count > 0:
        sample = matched_events[0]
        sample_detail = sample
        evt_type = sample.get("event_type", "unclassified")
        src = sample.get("source_ip") or "Local Host"
        dst = sample.get("destination_ip") or "Local Host"
        if sample.get("src_port") and sample.get("dst_port"):
            src = f"{src}:{sample.get('src_port')}"
            dst = f"{dst}:{sample.get('dst_port')}"
        score = sample.get("threat_score", 0.0)
        orig = sample.get("original_event", "")
        if orig:
            sample_match_str = f"{evt_type}: {src} -> {dst} (Score {score:.1f}) | {orig[:90]}"
        else:
            sample_match_str = f"{evt_type}: {src} -> {dst} (Score {score:.1f})"
    else:
        sample_match_str = "No events matched rule condition in current telemetry store."

    return {
        "status": "VALIDATED",
        "syntax_valid": True,
        "rule_name": rule_name,
        "severity": severity,
        "condition": condition,
        "action": rule_data.get("action", {}),
        "matched_records_count": matched_count,
        "compilation_time_ms": compilation_time_ms,
        "sample_match_event": sample_match_str,
        "sample_event_detail": sample_detail,
    }
