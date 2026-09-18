import pytest
from httpx import AsyncClient
from app.routers.ingest import limiter

@pytest.mark.asyncio
async def test_login_rate_limiting(client: AsyncClient):
    """
    Verifies that POST /api/v1/auth/login enforces rate limiting (5 attempts per minute per IP)
    to protect against credential stuffing and brute-force attacks.
    """
    limiter._storage.reset()

    # Pre-register a test user
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "ratelimit_target", "password": "TargetPassword123!"},
    )
    assert reg_resp.status_code in [200, 201]

    # First 5 login attempts within a minute should be processed (succeed or 401)
    for i in range(5):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "ratelimit_target", "password": "WrongPasswordAttempt"},
        )
        assert resp.status_code == 401, f"Attempt {i+1} should return 401"

    # 6th attempt should trigger 429 Too Many Requests
    exceeded_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "ratelimit_target", "password": "WrongPasswordAttempt"},
    )
    assert exceeded_resp.status_code == 429
    data = exceeded_resp.json()
    assert "Rate limit exceeded" in data.get("detail", "") or "Rate limit exceeded" in data.get("error", "")

    # Cleanup storage
    limiter._storage.reset()


@pytest.mark.asyncio
async def test_register_rate_limiting(client: AsyncClient):
    """
    Verifies that POST /api/v1/auth/register enforces rate limiting (10 attempts per minute per IP)
    to prevent automated bot account creation and registration floods.
    """
    limiter._storage.reset()

    # First 10 registration attempts should be allowed
    for i in range(10):
        resp = await client.post(
            "/api/v1/auth/register",
            json={"username": f"bot_user_{i}", "password": "SafePassword123!"},
        )
        assert resp.status_code in [200, 201], f"Register attempt {i+1} should succeed"

    # 11th attempt should trigger 429 Too Many Requests
    exceeded_resp = await client.post(
        "/api/v1/auth/register",
        json={"username": "bot_user_exceeded", "password": "SafePassword123!"},
    )
    assert exceeded_resp.status_code == 429
    data = exceeded_resp.json()
    assert "Rate limit exceeded" in data.get("detail", "") or "Rate limit exceeded" in data.get("error", "")

    # Cleanup storage
    limiter._storage.reset()
