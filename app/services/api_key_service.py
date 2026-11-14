"""
LOG AI — API Key Management Service
===================================
Provides cryptographic generation, storage, and verification of ingest API keys.

Security Invariants:
1. High-Entropy Tokens: Generated via `secrets.token_urlsafe(32)` with standard prefix `logai_live_`.
2. One-Way Storage: ONLY the SHA-256 hash is ever stored in the database. Plaintext is returned ONCE upon creation.
3. Constant-Time Verification: Compares hashes using `hmac.compare_digest` to prevent timing attacks.
4. No Token Logging: Plaintext keys are never output to logs or exception traces.
5. Strict Multi-Tenancy: Keys are bound to `owner_username`. A user can only inspect or revoke their own keys.
"""

import hmac
import hashlib
import secrets
import datetime
import logging
from typing import Optional, Dict, Any, List, Tuple
from app.database import SessionLocal, ApiKey

logger = logging.getLogger("log_ai.api_keys")


def create_api_key(owner_username: str, name: str) -> Tuple[Dict[str, Any], str]:
    """
    Generates a new API key for the specified owner.
    Returns (api_key_dict, plaintext_token).
    The plaintext_token MUST be displayed to the user once and is never stored.
    """
    token_entropy = secrets.token_urlsafe(32)
    plaintext_token = f"logai_live_{token_entropy}"
    token_hash = hashlib.sha256(plaintext_token.encode("utf-8")).hexdigest()
    display_prefix = f"{plaintext_token[:16]}..."
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    db = SessionLocal()
    try:
        record = ApiKey(
            key_hash=token_hash,
            display_prefix=display_prefix,
            owner_username=owner_username,
            name=name.strip() if name and name.strip() else "Forwarder Agent",
            created_at=now,
            last_used_at=None,
            revoked=False,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        key_data = {
            "id": record.id,
            "name": record.name,
            "display_prefix": record.display_prefix,
            "owner_username": record.owner_username,
            "created_at": record.created_at,
            "last_used_at": record.last_used_at,
            "revoked": record.revoked,
            "status": "Active",
        }
        return key_data, plaintext_token
    finally:
        db.close()


def verify_api_key(raw_token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a plaintext candidate API key in constant time.
    Returns key data dict if valid and unrevoked, or None if unknown/revoked.
    """
    if not raw_token or not isinstance(raw_token, str):
        return None

    clean_token = raw_token.strip()
    if clean_token.startswith("Bearer "):
        clean_token = clean_token[7:].strip()

    candidate_hash = hashlib.sha256(clean_token.encode("utf-8")).hexdigest()

    db = SessionLocal()
    try:
        record = db.query(ApiKey).filter(ApiKey.key_hash == candidate_hash).first()
        if not record:
            return None

        # Constant-time comparison
        if not hmac.compare_digest(record.key_hash, candidate_hash):
            return None

        if record.revoked:
            return None

        return {
            "id": record.id,
            "name": record.name,
            "display_prefix": record.display_prefix,
            "owner_username": record.owner_username,
            "created_at": record.created_at,
            "last_used_at": record.last_used_at,
            "revoked": record.revoked,
        }
    finally:
        db.close()


def touch_api_key(key_id: int):
    """Updates the last_used_at timestamp for the API key."""
    db = SessionLocal()
    try:
        record = db.query(ApiKey).filter(ApiKey.id == key_id).first()
        if record:
            record.last_used_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            db.commit()
    except Exception as exc:
        logger.warning("Failed to update last_used_at for key %s: %s", key_id, exc)
    finally:
        db.close()


def list_api_keys(owner_username: str) -> List[Dict[str, Any]]:
    """Lists all API keys belonging to owner_username (without plaintext or full hash)."""
    db = SessionLocal()
    try:
        records = (
            db.query(ApiKey)
            .filter(ApiKey.owner_username == owner_username)
            .order_by(ApiKey.id.desc())
            .all()
        )
        return [
            {
                "id": r.id,
                "name": r.name,
                "display_prefix": r.display_prefix,
                "owner_username": r.owner_username,
                "created_at": r.created_at,
                "last_used_at": r.last_used_at,
                "revoked": r.revoked,
                "status": "Revoked" if r.revoked else "Active",
            }
            for r in records
        ]
    finally:
        db.close()


def revoke_api_key(key_id: int, owner_username: str) -> bool:
    """Revokes an API key owned by owner_username."""
    db = SessionLocal()
    try:
        record = (
            db.query(ApiKey)
            .filter(ApiKey.id == key_id, ApiKey.owner_username == owner_username)
            .first()
        )
        if not record:
            return False

        record.revoked = True
        db.commit()
        return True
    finally:
        db.close()


# In-memory sliding window rate limiting per API key
_api_key_rate_tracker: Dict[int, List[float]] = {}
_API_KEY_WINDOW = 60.0  # 60 seconds

def check_api_key_rate_limit(key_id: int, max_per_minute: int = 120) -> bool:
    """
    Enforces per-key rate limiting (default: 120 requests/minute).
    Returns True if allowed, False if limit exceeded.
    """
    import time
    now = time.monotonic()
    history = _api_key_rate_tracker.setdefault(key_id, [])
    cutoff = now - _API_KEY_WINDOW
    # Prune old timestamps
    _api_key_rate_tracker[key_id] = [t for t in history if t > cutoff]
    if len(_api_key_rate_tracker[key_id]) >= max_per_minute:
        return False
    _api_key_rate_tracker[key_id].append(now)
    return True


def reset_api_key_rate_limits():
    """Resets the in-memory rate limit tracker (used for test isolation)."""
    _api_key_rate_tracker.clear()
