#!/usr/bin/env python3
"""
Local Database User & Source Reset Utility
==========================================
Development tool to purge local user records and registered log sources,
and re-seed the default administrator account.

Safety Controls:
- Refuses to execute if ENVIRONMENT=production.
- Requires explicit --yes confirmation flag.
- Preserves raw and normalized event storage on disk unless --purge-events is specified.
"""

import argparse
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.database import SessionLocal, User, LogSource, seed_default_users


def check_safety_guards():
    """Ensures this script never runs against production environments."""
    env = (os.getenv("ENVIRONMENT") or settings.ENVIRONMENT or "").strip().lower()
    if env == "production":
        print("[!] ERROR: Refusing to execute reset_local_users.py in PRODUCTION environment.")
        sys.exit(1)


def purge_event_directory(dir_path: Path):
    """Deletes all event files in the specified directory while preserving .gitkeep."""
    if not dir_path.exists():
        return 0

    count = 0
    for item in dir_path.iterdir():
        if item.name == ".gitkeep":
            continue
        try:
            if item.is_file():
                item.unlink()
                count += 1
            elif item.is_dir():
                import shutil
                shutil.rmtree(item)
                count += 1
        except Exception as exc:
            print(f"[!] Warning: Failed to remove {item}: {exc}")
    return count


def main():
    parser = argparse.ArgumentParser(
        description="Reset local development user accounts, sources, and re-seed default admin.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Explicit confirmation to execute database purge and reseeding.",
    )
    parser.add_argument(
        "--purge-events",
        action="store_true",
        help="Also purge raw and normalized event storage on disk (data/raw, data/normalized).",
    )

    args = parser.parse_args()
    check_safety_guards()

    db = SessionLocal()
    try:
        users = db.query(User).all()
        user_list = [u.username for u in users]
        sources = db.query(LogSource).all()
        source_count = len(sources)

        print("=" * 60)
        print("LOCAL DATABASE RESET PLAN")
        print("=" * 60)
        print(f"[*] Target Database : {settings.STORAGE_DIR.parent / 'users.db'}")
        print(f"[*] User Accounts   : {len(user_list)} to be deleted ({', '.join(user_list) if user_list else 'None'})")
        print(f"[*] Log Sources     : {source_count} to be deleted")
        if args.purge_events:
            print("[*] Event Purge     : YES (data/raw and data/normalized will be cleared)")
        else:
            print("[*] Event Purge     : NO (raw and normalized event files preserved on disk)")
        print("=" * 60)

        if not args.yes:
            print("\n[!] SAFETY STOP: Confirmation flag '--yes' was not provided.")
            print("[*] To execute this reset, run: python scripts/reset_local_users.py --yes")
            if not args.purge_events:
                print("[*] (Add '--purge-events' if you also wish to clear disk event archives)")
            sys.exit(1)

        print("\n[+] Purging log sources...")
        db.query(LogSource).delete()

        print("[+] Purging user accounts...")
        db.query(User).delete()
        db.commit()

        print("[+] Re-seeding default administrator account...")
        seed_default_users()

        # Re-check seeded admin
        seeded_users = db.query(User).all()
        seeded_names = [u.username for u in seeded_users]
        print(f"[+] Re-seeded accounts: {', '.join(seeded_names)}")

        if args.purge_events:
            print("[+] Purging raw event archives...")
            raw_count = purge_event_directory(Path(settings.STORAGE_DIR))
            print(f"    -> Cleared {raw_count} raw storage items")

            print("[+] Purging normalized event archives...")
            norm_count = purge_event_directory(Path(settings.NORMALIZED_STORAGE_DIR))
            print(f"    -> Cleared {norm_count} normalized storage items")

        print("\n[SUCCESS] Local database reset completed cleanly.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
