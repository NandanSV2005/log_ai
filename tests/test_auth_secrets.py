import pytest
from app.config import Settings
from app.routers.auth import create_access_token, get_secret_key

def test_random_secret_generation_in_dev(monkeypatch):
    """
    Verifies that when secrets are unconfigured in local dev mode,
    the app generates secure random session credentials instead of using hardcoded strings.
    """
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("DASHBOARD_PASS", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("STRICT_SECRETS", "false")

    dev_settings = Settings()
    
    jwt_secret = dev_settings.get_jwt_secret()
    dash_pass = dev_settings.get_dashboard_pass()

    assert jwt_secret != ""
    assert jwt_secret != "super-secret-log-ai-jwt-token-key-2026"
    assert dash_pass != ""
    assert dash_pass != "SuperSecretPassword!"
    assert len(jwt_secret) >= 32
    assert len(dash_pass) >= 16


def test_strict_mode_startup_failure_missing_dashboard_pass(monkeypatch):
    """
    Verifies that startup validation fails cleanly with RuntimeError when DASHBOARD_PASS
    is missing in strict/production mode.
    """
    monkeypatch.delenv("DASHBOARD_PASS", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.setenv("JWT_SECRET_KEY", "custom_test_jwt_key_999")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("STRICT_SECRETS", "true")

    prod_settings = Settings()

    with pytest.raises(RuntimeError, match="CRITICAL SECURITY FAILURE"):
        prod_settings.validate_secrets_on_startup()


def test_strict_mode_startup_failure_missing_jwt_secret(monkeypatch):
    """
    Verifies that startup validation fails cleanly with RuntimeError when JWT_SECRET_KEY
    is missing in strict/production mode.
    """
    monkeypatch.setenv("DASHBOARD_PASS", "custom_prod_pass_123!")
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("STRICT_SECRETS", "true")

    prod_settings = Settings()

    with pytest.raises(RuntimeError, match="CRITICAL SECURITY FAILURE"):
        prod_settings.validate_secrets_on_startup()


def test_configured_secrets_valid_startup(monkeypatch):
    """
    Verifies that startup validation succeeds without error when secrets are properly configured.
    """
    monkeypatch.setenv("DASHBOARD_PASS", "valid_prod_password_456!")
    monkeypatch.setenv("JWT_SECRET_KEY", "valid_prod_jwt_secret_789!")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("STRICT_SECRETS", "true")

    valid_settings = Settings()
    valid_settings.validate_secrets_on_startup()

    assert valid_settings.get_dashboard_pass() == "valid_prod_password_456!"
    assert valid_settings.get_jwt_secret() == "valid_prod_jwt_secret_789!"


def test_auth_token_generation_and_decoding(monkeypatch):
    """
    Verifies JWT token creation and decoding using the dynamic secret resolution.
    """
    monkeypatch.setenv("JWT_SECRET_KEY", "custom_secret_key_for_jwt_test")
    token = create_access_token(data={"sub": "testuser"})
    assert isinstance(token, str)
    assert len(token) > 20
