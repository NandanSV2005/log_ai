import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    username = "copilot_analyst_test"
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

def test_copilot_ask_success(auth_headers):
    res = client.post(
        "/api/v1/copilot/ask",
        headers=auth_headers,
        json={"question": "How many SSH brute force attacks were detected?"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert data["status"] == "success"
    assert "logs_analyzed" in data
