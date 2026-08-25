import asyncio
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.config import settings
from app.parsers.json_parser import JsonLogParser
from app.parsers.syslog_parser import SyslogParser
from app.parsers.csv_parser import CsvLogParser
from app.parsers.text_parser import TextLogParser

from app.parsers.dynamic_parser import DynamicParser
from app.storage.normalized_writer import normalized_storage_manager
from app.detection.anomaly_engine import anomaly_engine
from app.xai.explainer import xai_explainer

logger = logging.getLogger("log_ai.queue")

@dataclass
class IngestionTask:
    ingestion_id: str
    raw_payload: str
    detected_format: str
    raw_file_path: str

class LogIngestQueueManager:
    def __init__(self, maxsize: int = settings.QUEUE_MAX_SIZE):
        self.maxsize = maxsize
        self.queue: asyncio.Queue[IngestionTask] = asyncio.Queue(maxsize=maxsize)
        self.workers: List[asyncio.Task] = []
        self.processed_count: int = 0
        self.error_count: int = 0
        self.dynamic_parser = DynamicParser()
        
        # Parsers registry
        self.parsers = {
            "json": JsonLogParser(),
            "syslog": SyslogParser(),
            "csv": CsvLogParser(),
            "text": TextLogParser(),
        }

    async def start_workers(self, concurrency: int = settings.WORKER_CONCURRENCY):
        """Starts the async background worker pool."""
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if current_loop is not None and getattr(self.queue, "_loop", None) != current_loop:
            self.queue = asyncio.Queue(maxsize=self.maxsize)

        valid_workers = []
        for w in self.workers:
            if not w.done() and current_loop is not None:
                try:
                    if w.get_loop() == current_loop:
                        valid_workers.append(w)
                except Exception:
                    pass
        self.workers = valid_workers

        if self.workers:
            return

        logger.info(f"Starting {concurrency} async ingestion queue workers")
        for i in range(concurrency):
            worker_task = asyncio.create_task(self._worker_loop(worker_id=i))
            self.workers.append(worker_task)

    async def stop_workers(self):
        """Cleanly stops workers."""
        workers = list(self.workers)
        self.workers.clear()
        for worker in workers:
            if not worker.done():
                worker.cancel()
        if workers:
            await asyncio.gather(*workers, return_exceptions=True)

    async def enqueue_task(self, task: IngestionTask) -> bool:
        """Enqueues an ingestion payload for non-blocking background parsing."""
        try:
            self.queue.put_nowait(task)
            return True
        except asyncio.QueueFull:
            logger.warning(f"Queue full! Task {task.ingestion_id} dropped from memory parsing.")
            return False

    async def _worker_loop(self, worker_id: int):
        while True:
            try:
                task = await self.queue.get()
            except (asyncio.CancelledError, Exception):
                break

            try:
                await self._process_task(task)
            except Exception as e:
                logger.error(f"Worker {worker_id} process error: {e}", exc_info=True)
            finally:
                self.queue.task_done()

    async def _process_task(self, task: IngestionTask):
        try:
            # 1. Parse raw payload into normalized UnifiedEvent models via DynamicParser
            unified_events = self.dynamic_parser.parse(task.raw_payload)
            
            # 2. Enrich events with Anomaly Detection & Threat Scoring (ML + Rules)
            enriched_events = anomaly_engine.evaluate_events(unified_events)

            # 3. Enrich events with Explainable AI (XAI) plain-English summaries
            for event in enriched_events:
                event.xai_explanation = xai_explainer.generate_explanation(event)

            # 4. Persist enriched UnifiedEvents to separate analytics JSONL storage
            await normalized_storage_manager.write_normalized_events(
                ingestion_id=task.ingestion_id,
                events=enriched_events,
            )

            self.processed_count += 1
            logger.debug(
                f"Successfully normalized ingestion_id={task.ingestion_id} "
                f"events={len(unified_events)}"
            )
        except Exception as e:
            self.error_count += 1
            logger.error(f"Failed to normalize ingestion_id={task.ingestion_id}: {e}")

    def get_stats(self) -> Dict[str, Any]:
        return {
            "queue_size": self.queue.qsize(),
            "active_workers": len(self.workers),
            "processed_count": self.processed_count,
            "error_count": self.error_count,
        }

# Global default instance
queue_manager = LogIngestQueueManager()
