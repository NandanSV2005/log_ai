import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Log Ingestion Engine"
    API_V1_STR: str = "/api/v1"
    
    # Raw Data Storage Settings
    STORAGE_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("STORAGE_DIR", "data/raw"))
    )
    NORMALIZED_STORAGE_DIR: Path = Field(
        default_factory=lambda: Path(os.getenv("NORMALIZED_STORAGE_DIR", "data/normalized"))
    )
    COMPRESSION_FORMAT: str = Field(default="jsonl.gz")  # options: 'jsonl.gz', 'parquet', 'jsonl'
    
    # Async Queue & Worker Settings
    QUEUE_MAX_SIZE: int = 10000
    WORKER_CONCURRENCY: int = 4
    
    # Dashboard Authentication Credentials
    DASHBOARD_USER: str = Field(default="admin")
    DASHBOARD_PASS: str = Field(default="SuperSecretPassword!")
    
    # Ingestion Constraints
    MAX_PAYLOAD_BYTES: int = 50 * 1024 * 1024  # 50 MB
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }

settings = Settings()
