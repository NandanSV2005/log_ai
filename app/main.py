import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.routers import ingest, dashboard, auth, copilot
from app.services.queue import queue_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("log_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Validating application security configuration...")
    settings.validate_secrets_on_startup()
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

# Security Headers & Strict Anti-Caching Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:;"
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Include Routers
app.include_router(auth.router)
app.include_router(ingest.router)
app.include_router(dashboard.router)
app.include_router(copilot.router)

static_dir = Path(__file__).parent / "static"

CACHE_PREVENTION_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}

@app.get("/", response_class=FileResponse, tags=["SaaS Landing Page"])
async def get_landing_page():
    """Serves the SaaS Landing Page."""
    return FileResponse(static_dir / "landing.html", headers=CACHE_PREVENTION_HEADERS)

@app.get("/login", response_class=FileResponse, tags=["Authentication UI"])
async def get_login_page():
    """Serves the Login UI."""
    return FileResponse(static_dir / "login.html", headers=CACHE_PREVENTION_HEADERS)

@app.get("/register", response_class=FileResponse, tags=["Authentication UI"])
async def get_register_page():
    """Serves the Registration UI."""
    return FileResponse(static_dir / "register.html", headers=CACHE_PREVENTION_HEADERS)

@app.get("/dashboard", response_class=FileResponse, tags=["Dashboard UI"])
async def get_dashboard_ui():
    """Serves the main SOC Dashboard frontend index.html."""
    return FileResponse(static_dir / "index.html", headers=CACHE_PREVENTION_HEADERS)

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


