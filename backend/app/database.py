import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./tejas.db")

# If running locally outside Docker container, translate docker hostname 'db' to 'localhost'
if "@db:" in raw_db_url and not os.path.exists("/.dockerenv"):
    db_url = raw_db_url.replace("@db:", "@localhost:")
else:
    db_url = raw_db_url

# Create engine with fallback to SQLite if PostgreSQL isn't running locally
try:
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {"connect_timeout": 3}
    engine = create_engine(db_url, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to local SQLite database so backend always runs seamlessly
    db_url = "sqlite:///./tejas.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
