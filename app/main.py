import logging
import secrets
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.routers import ingest, dashboard
from app.services.queue import queue_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("log_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Log Ingestion Engine background workers...")
    await queue_manager.start_workers(concurrency=settings.WORKER_CONCURRENCY)
    yield
    logger.info("Shutting down background workers...")
    await queue_manager.stop_workers()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="High-Performance FastAPI Log Normalization & Ingestion Engine",
    lifespan=lifespan,
)

# Register Rate Limiter State & Exception Handler
app.state.limiter = ingest.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:;"
    return response

# Include Routers
app.include_router(ingest.router)
app.include_router(dashboard.router)

static_dir = Path(__file__).parent / "static"
security = HTTPBasic()

def authenticate_user(credentials: HTTPBasicCredentials = Depends(security)):
    current_username_bytes = credentials.username.encode("utf-8")
    correct_username_bytes = settings.DASHBOARD_USER.encode("utf-8")
    is_correct_username = secrets.compare_digest(current_username_bytes, correct_username_bytes)

    current_password_bytes = credentials.password.encode("utf-8")
    correct_password_bytes = settings.DASHBOARD_PASS.encode("utf-8")
    is_correct_password = secrets.compare_digest(current_password_bytes, correct_password_bytes)

    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/", response_class=FileResponse, tags=["Dashboard UI"])
async def get_dashboard_ui(username: str = Depends(authenticate_user)):
    """Serves the main SOC Dashboard frontend index.html protected by HTTP Basic Auth."""
    return FileResponse(static_dir / "index.html")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "engine": settings.APP_NAME,
        "storage_dir": str(settings.STORAGE_DIR),
    }

@app.get("/api/v1/metrics", tags=["Metrics"])
async def get_metrics():
    return {
        "queue_stats": queue_manager.get_stats(),
    }

# Mount Static Assets at root (must be after API routes to avoid path collisions)
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

