import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    username = "copilot_analyst_test_user"
    password = "SuperPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_copilot_ask_unauthorized():
    res = client.post("/api/v1/copilot/ask", json={"question": "What is the threat status?"})
    assert res.status_code == 401

def test_copilot_fallback_distinct_question_intents(auth_headers, monkeypatch):
    """
    Verifies that the local Rule-Assisted SOC Engine returns distinct, question-aware answers
    for differently-worded questions rather than a static template.
    """
    monkeypatch.setenv("GEMINI_API_KEY", "")
    # 1. Count query intent
    res_count = client.post(
        "/api/v1/copilot/ask",
        headers=auth_headers,
        json={"question": "How many total events and high severity alerts were detected?"}
    )
    assert res_count.status_code == 200
    data_count = res_count.json()
    assert data_count["model"] == "rule-assisted-soc-engine"
    assert "TELEMETRY METRICS & COUNTS" in data_count["answer"]
    assert "Total Analyzed Events" in data_count["answer"]

    # 2. IP Specific query intent
    res_ip = client.post(
        "/api/v1/copilot/ask",
        headers=auth_headers,
        json={"question": "Tell me about activity from IP 192.168.1.100"}
    )
    assert res_ip.status_code == 200
    data_ip = res_ip.json()
    assert data_ip["model"] == "rule-assisted-soc-engine"
    assert "192.168.1.100" in data_ip["answer"]

    # 3. MITRE Tactic query intent
    res_mitre = client.post(
        "/api/v1/copilot/ask",
        headers=auth_headers,
        json={"question": "What MITRE ATT&CK tactics and kill chain vectors were observed?"}
    )
    assert res_mitre.status_code == 200
    data_mitre = res_mitre.json()
    assert data_mitre["model"] == "rule-assisted-soc-engine"
    assert "MITRE ATT&CK FRAMEWORK" in data_mitre["answer"]

    # 4. Remediation query intent
    res_remed = client.post(
        "/api/v1/copilot/ask",
        headers=auth_headers,
        json={"question": "How do I remediate and fix these active security threats?"}
    )
    assert res_remed.status_code == 200
    data_remed = res_remed.json()
    assert data_remed["model"] == "rule-assisted-soc-engine"
    assert "INCIDENT REMEDIATION PLAYBOOK" in data_remed["answer"]

    # Confirm all 4 questions generated distinct answers
    answers = {data_count["answer"], data_ip["answer"], data_mitre["answer"], data_remed["answer"]}
    assert len(answers) == 4


def test_copilot_model_tagging_live_vs_fallback(auth_headers, monkeypatch):
    """
    Verifies that the 'model' metadata field correctly reports 'gemini-3.6-flash' when the live
    API succeeds and 'rule-assisted-soc-engine' when the fallback fires.
    """
    # 1. Fallback model check (no API key)
    monkeypatch.setenv("GEMINI_API_KEY", "")
    res_fallback = client.post(
        "/api/v1/copilot/ask",
        headers=auth_headers,
        json={"question": "What is the status?"}
    )
    assert res_fallback.status_code == 200
    assert res_fallback.json()["model"] == "rule-assisted-soc-engine"

    # 2. Live API model mock check with google.genai
    monkeypatch.setenv("GEMINI_API_KEY", "mock_key_12345")

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Mocked Gemini 3.6 Flash Response."
    mock_client.models.generate_content.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client):
        res_live = client.post(
            "/api/v1/copilot/ask",
            headers=auth_headers,
            json={"question": "Explain recent threats."}
        )
        assert res_live.status_code == 200
        data_live = res_live.json()
        assert data_live["answer"] == "Mocked Gemini 3.6 Flash Response."
        assert data_live["model"] == "gemini-3.6-flash"


def test_copilot_error_logging_diagnostics(auth_headers, monkeypatch, caplog):
    """
    Verifies that explicit error diagnostics (status code & message) are logged when Gemini API fails.
    """
    monkeypatch.setenv("GEMINI_API_KEY", "invalid_key_trigger_error")

    mock_client = MagicMock()
    err = Exception("404 models/gemini-invalid-model not found")
    setattr(err, "code", 404)
    mock_client.models.generate_content.side_effect = err

    with patch("google.genai.Client", return_value=mock_client):
        with caplog.at_level("ERROR"):
            res = client.post(
                "/api/v1/copilot/ask",
                headers=auth_headers,
                json={"question": "Check status"}
            )
            assert res.status_code == 200
            assert res.json()["model"] == "rule-assisted-soc-engine"
            assert "Gemini API call failed for model 'gemini-3.6-flash' [Status: 404]" in caplog.text
