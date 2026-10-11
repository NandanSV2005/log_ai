import ipaddress
import datetime
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.database import SessionLocal, LogSource
from app.routers.auth import get_current_user

logger = logging.getLogger("log_ai.sources")
router = APIRouter(prefix="/api/v1/sources", tags=["Source Registry"])

def _get_username(user: Optional[object]) -> str:
    if not user:
        return "default_user"
    if hasattr(user, "username") and getattr(user, "username"):
        return str(getattr(user, "username"))
    if isinstance(user, dict):
        u = user.get("username") or user.get("sub")
        if u:
            return str(u)
    if isinstance(user, str) and not user.startswith("<"):
        return user
    return "default_user"

class SourceCreateRequest(BaseModel):
    source_ip: str = Field(..., description="IPv4 or IPv6 address of the log-emitting appliance")
    display_name: str = Field(..., description="Human-readable label for this perimeter log source")

class SourceResponse(BaseModel):
    id: int
    source_ip: str
    owner_username: str
    display_name: str
    created_at: str

@router.post("", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    payload: SourceCreateRequest,
    current_user=Depends(get_current_user),
):
    """
    Registers a new log source IP address bound to the authenticated user.
    Enforces that an IP address can only be registered to one user at a time.
    """
    raw_ip = payload.source_ip.strip()
    try:
        # Validate valid IP address
        ip_obj = ipaddress.ip_address(raw_ip)
        clean_ip = str(ip_obj)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid IP address format: '{raw_ip}'",
        )

    display_name = payload.display_name.strip()
    if not display_name:
        display_name = f"Device-{clean_ip}"

    username = _get_username(current_user)
    db = SessionLocal()
    try:
        # Check if IP is already registered to any user
        existing = db.query(LogSource).filter(LogSource.source_ip == clean_ip).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Source IP {clean_ip} is already registered to a user.",
            )

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        source = LogSource(
            source_ip=clean_ip,
            owner_username=username,
            display_name=display_name,
            created_at=now_iso,
        )
        db.add(source)
        db.commit()
        db.refresh(source)
        return SourceResponse(
            id=source.id,
            source_ip=source.source_ip,
            owner_username=source.owner_username,
            display_name=source.display_name,
            created_at=source.created_at,
        )
    finally:
        db.close()

@router.get("", response_model=List[SourceResponse])
async def list_sources(
    current_user=Depends(get_current_user),
):
    """
    Returns all registered log sources belonging exclusively to the authenticated user.
    """
    username = _get_username(current_user)
    db = SessionLocal()
    try:
        sources = (
            db.query(LogSource)
            .filter(LogSource.owner_username == username)
            .order_by(LogSource.id.desc())
            .all()
        )
        return [
            SourceResponse(
                id=s.id,
                source_ip=s.source_ip,
                owner_username=s.owner_username,
                display_name=s.display_name,
                created_at=s.created_at,
            )
            for s in sources
        ]
    finally:
        db.close()

@router.delete("/{source_id}")
async def delete_source(
    source_id: int,
    current_user=Depends(get_current_user),
):
    """
    Deletes a registered log source. A user can only delete their own registered sources.
    """
    username = _get_username(current_user)
    db = SessionLocal()
    try:
        source = db.query(LogSource).filter(LogSource.id == source_id).first()
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source with ID {source_id} not found.",
            )
        if source.owner_username != username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this log source.",
            )

        db.delete(source)
        db.commit()
        return {"status": "deleted", "id": source_id, "source_ip": source.source_ip}
    finally:
        db.close()

@router.get("/receiver-status", response_model=Dict[str, Any])
async def get_receiver_status(
    current_user=Depends(get_current_user),
):
    """
    Returns live syslog receiver operational metrics, listening ports, counters,
    and last-message time for the authenticated user's registered sources.
    """
    from app.services.syslog_receiver import syslog_receiver
    username = _get_username(current_user)
    return syslog_receiver.get_status(owner_username=username)
