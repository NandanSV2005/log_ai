import os
import logging
import bcrypt
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("log_ai.database")

# Database URL Resolution:
# Supports Render PostgreSQL (DATABASE_URL), persistent disk directories (PERSISTENT_DATA_DIR / RENDER_DISK_PATH), or local SQLite.
raw_db_url = os.getenv("DATABASE_URL") or os.getenv("PERSISTENT_DATABASE_URL")

if raw_db_url:
    # Render's DATABASE_URL starts with postgres:// -> convert to postgresql:// for SQLAlchemy
    if raw_db_url.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
    else:
        SQLALCHEMY_DATABASE_URL = raw_db_url
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
else:
    base_data_dir = os.getenv("PERSISTENT_DATA_DIR") or os.getenv("RENDER_DISK_PATH") or "data"
    DATA_DIR = Path(base_data_dir)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH = DATA_DIR / "users.db"
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

def seed_default_users():
    """Seeds default admin users if database contains 0 user records."""
    db = SessionLocal()
    try:
        count = db.query(User).count()
        if count == 0:
            def hash_pw(pwd: str) -> str:
                return bcrypt.hashpw(pwd.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

            default_pass = os.getenv("DASHBOARD_PASS") or os.getenv("ADMIN_PASSWORD") or "admin123"
            
            # Seed default admin operator
            admin_user = User(username="admin", hashed_password=hash_pw(default_pass))
            db.add(admin_user)
            
            # Also seed operator if configured differently
            env_user = os.getenv("DASHBOARD_USER") or os.getenv("ADMIN_USER")
            if env_user and env_user.strip() and env_user.strip().lower() != "admin":
                op_user = User(username=env_user.strip(), hashed_password=hash_pw(default_pass))
                db.add(op_user)

            db.commit()
            logger.info("Default operator accounts seeded successfully.")
    except Exception as e:
        logger.warning(f"Default user seeding skipped/failed: {e}")
        db.rollback()
    finally:
        db.close()

# Run seeding on database initialization
seed_default_users()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
