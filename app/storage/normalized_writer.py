import json
import asyncio
import datetime
from pathlib import Path
from typing import List, Optional

from app.config import settings
from app.normalization.schema import UnifiedEvent

class NormalizedDataStorageManager:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = Path(storage_dir or settings.NORMALIZED_STORAGE_DIR)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    async def write_normalized_events(
        self,
        ingestion_id: str,
        events: List[UnifiedEvent],
    ) -> Path:
        """
        Persists a list of normalized UnifiedEvent models to an analytics-ready JSONL file.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        timestamp_str = now.strftime("%Y%m%d_%H%M%S_%f")
        filename = f"normalized_{timestamp_str}_{ingestion_id[:8]}.jsonl"
        file_path = self.storage_dir / filename

        self._sync_write_jsonl(file_path, events)
        return file_path

    @staticmethod
    def _sync_write_jsonl(file_path: Path, events: List[UnifiedEvent]) -> None:
        with open(file_path, "w", encoding="utf-8") as f:
            for event in events:
                json_line = event.model_dump_json() + "\n"
                f.write(json_line)

    async def read_normalized_events(self, file_path: Path) -> List[dict]:
        """Reads persisted normalized events from a JSONL file for verification."""
        return await asyncio.to_thread(self._sync_read_jsonl, file_path)

    @staticmethod
    def _sync_read_jsonl(file_path: Path) -> List[dict]:
        events = []
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    events.append(json.loads(line.strip()))
        return events

# Global default instance
normalized_storage_manager = NormalizedDataStorageManager()
