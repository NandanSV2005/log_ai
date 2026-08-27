import os
import secrets
import logging
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings

logger = logging.getLogger("log_ai.config")

class Settings(BaseSettings):
    APP_NAME: str = "Log Ingestion Engine"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Security Control Modes
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    STRICT_SECRETS: bool = Field(default_factory=lambda: os.getenv("STRICT_SECRETS", "").lower() in ("true", "1", "yes"))
    
    # Raw Data Storage Settings
    STORAGE_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("STORAGE_DIR", "data/raw"))
    )
    NORMALIZED_STORAGE_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("NORMALIZED_STORAGE_DIR", "data/normalized"))
    )
    COMPRESSION_FORMAT: str = Field(default="jsonl.gz")
    
    # Async Queue & Worker Settings
    QUEUE_MAX_SIZE: int = 10000
    WORKER_CONCURRENCY: int = 4
    
    # Dashboard Authentication Credentials
    DASHBOARD_USER: str = Field(default_factory=lambda: os.getenv("DASHBOARD_USER") or os.getenv("ADMIN_USER") or "admin")
    DASHBOARD_PASS: str = Field(default="")
    
    # JWT Secret Key
    JWT_SECRET_KEY: str = Field(default="")
    
    # Ingestion Constraints
    MAX_PAYLOAD_BYTES: int = 50 * 1024 * 1024  # 50 MB
    
    # Gemini LLM Integration
    GEMINI_API_KEY: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    GEMINI_MODEL: str = Field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-3.6-flash"))
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }

    def get_dashboard_pass(self) -> str:
        """
        Returns configured dashboard password.
        In strict/production mode, raises RuntimeError if missing.
        In local dev mode, generates a secure random password if unconfigured.
        """
        val = self.DASHBOARD_PASS or os.getenv("DASHBOARD_PASS") or os.getenv("ADMIN_PASSWORD")
        if val and val.strip():
            return val.strip()
        
        if self.STRICT_SECRETS or self.ENVIRONMENT.lower() == "production":
            raise RuntimeError(
                "CRITICAL SECURITY FAILURE: 'DASHBOARD_PASS' (or 'ADMIN_PASSWORD') environment variable is required in production/strict mode."
            )
        
        if not hasattr(self, "_generated_dashboard_pass"):
            self._generated_dashboard_pass = secrets.token_urlsafe(16)
            logger.warning(
                "No DASHBOARD_PASS configured in environment. Generated temporary local session password: %s",
                self._generated_dashboard_pass
            )
        return self._generated_dashboard_pass

    def get_jwt_secret(self) -> str:
        """
        Returns configured JWT signing secret.
        In strict/production mode, raises RuntimeError if missing.
        In local dev mode, generates a secure random secret key if unconfigured.
        """
        val = self.JWT_SECRET_KEY or os.getenv("JWT_SECRET_KEY")
        if val and val.strip():
            return val.strip()
        
        if self.STRICT_SECRETS or self.ENVIRONMENT.lower() == "production":
            raise RuntimeError(
                "CRITICAL SECURITY FAILURE: 'JWT_SECRET_KEY' environment variable is required in production/strict mode."
            )
        
        if not hasattr(self, "_generated_jwt_secret"):
            self._generated_jwt_secret = secrets.token_urlsafe(32)
            logger.warning(
                "No JWT_SECRET_KEY configured in environment. Generated temporary local session secret key."
            )
        return self._generated_jwt_secret

    def validate_secrets_on_startup(self) -> None:
        """
        Startup validation trigger to verify required secrets in strict/production mode.
        """
        self.get_dashboard_pass()
        self.get_jwt_secret()

settings = Settings()
