import pytest
import tempfile
import shutil
from pathlib import Path
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.config import settings
from app.storage.raw_writer import raw_storage_manager, RawDataStorageManager
from app.storage.normalized_writer import normalized_storage_manager
from app.audit.hash_chain import audit_merkle_tree
from app.routers import ingest
from app.services.queue import queue_manager
from app.detection.anomaly_engine import anomaly_engine

@pytest.fixture
def temp_storage_dir():
    temp_dir = tempfile.mkdtemp()
    temp_path = Path(temp_dir)
    raw_path = temp_path / "raw"
    norm_path = temp_path / "normalized"
    
    orig_raw_dir = settings.STORAGE_DIR
    orig_norm_dir = settings.NORMALIZED_STORAGE_DIR
    
    settings.STORAGE_DIR = raw_path
    settings.NORMALIZED_STORAGE_DIR = norm_path
    raw_storage_manager.storage_dir = raw_path
    normalized_storage_manager.storage_dir = norm_path
    
    raw_path.mkdir(parents=True, exist_ok=True)
    norm_path.mkdir(parents=True, exist_ok=True)
    audit_merkle_tree.reset()
    anomaly_engine.reset()
    try:
        ingest.limiter._storage.reset()
    except Exception:
        pass
    while not queue_manager.queue.empty():
        try:
            queue_manager.queue.get_nowait()
            try:
                queue_manager.queue.task_done()
            except ValueError:
                pass
        except Exception:
            break
    
    yield temp_path
    
    # Cleanup
    audit_merkle_tree.reset()
    anomaly_engine.reset()
    while not queue_manager.queue.empty():
        try:
            queue_manager.queue.get_nowait()
            try:
                queue_manager.queue.task_done()
            except ValueError:
                pass
        except Exception:
            break
    settings.STORAGE_DIR = orig_raw_dir
    settings.NORMALIZED_STORAGE_DIR = orig_norm_dir
    raw_storage_manager.storage_dir = orig_raw_dir
    normalized_storage_manager.storage_dir = orig_norm_dir
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture
async def client(temp_storage_dir):
    await queue_manager.start_workers(concurrency=2)
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac
    await queue_manager.stop_workers()
