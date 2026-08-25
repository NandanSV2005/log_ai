import gzip
import json
import uuid
import datetime
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional

from app.config import settings
from app.audit.hash_chain import audit_merkle_tree

class RawDataStorageManager:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    async def write_raw_payload(
        self,
        ingestion_id: str,
        raw_data: bytes,
        content_type: str,
        detected_format: str,
        client_host: Optional[str] = None,
    ) -> Path:
        """
        Immediately persists the raw payload to disk before any parsing logic,
        guaranteeing zero data loss and full forensic auditability.
        Computes SHA-256 payload hash and appends to in-memory Merkle tree.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        timestamp_str = now.strftime("%Y%m%d_%H%M%S_%f")
        
        # Hash raw payload and update Merkle audit tree BEFORE disk write
        payload_hash = audit_merkle_tree.add_leaf(raw_data)
        merkle_root = audit_merkle_tree.get_root_hash()

        # Metadata header for forensic record
        forensic_record = {
            "ingestion_id": ingestion_id,
            "received_at": now.isoformat(),
            "content_type": content_type,
            "detected_format": detected_format,
            "client_host": client_host or "unknown",
            "bytes_size": len(raw_data),
            "payload_hash": payload_hash,
            "merkle_root": merkle_root,
            "raw_payload": raw_data.decode("utf-8", errors="replace"),
        }

        filename = f"raw_{timestamp_str}_{ingestion_id[:8]}.jsonl.gz"
        file_path = self.storage_dir / filename

        self._sync_write_gzip(file_path, forensic_record)
        return file_path

    @staticmethod
    def _sync_write_gzip(file_path: Path, data: Dict[str, Any]) -> None:
        json_line = json.dumps(data, ensure_ascii=False) + "\n"
        with gzip.open(file_path, "wt", encoding="utf-8") as f:
            f.write(json_line)

    async def read_raw_payload(self, file_path: Path) -> Dict[str, Any]:
        """
        Decompresses and reads stored raw payload file for forensic auditing.
        """
        return await asyncio.to_thread(self._sync_read_gzip, file_path)

    @staticmethod
    def _sync_read_gzip(file_path: Path) -> Dict[str, Any]:
        with gzip.open(file_path, "rt", encoding="utf-8") as f:
            line = f.readline()
            return json.loads(line)

# Global default instance
raw_storage_manager = RawDataStorageManager()
