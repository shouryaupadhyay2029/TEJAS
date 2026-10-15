import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Determine the SQLite fallback path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# On Render, /backend/data is a persistent disk mount
# Locally, use the backend directory
if os.path.isdir("/backend/data"):
    default_sqlite_path = "/backend/data/tejas.db"
else:
    default_sqlite_path = os.path.join(backend_dir, "tejas.db")

raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{default_sqlite_path}")

# If running locally outside Docker container, translate docker hostname 'db' to 'localhost'
if "postgresql" in raw_db_url and "@db:" in raw_db_url and not os.path.exists("/.dockerenv"):
    db_url = raw_db_url.replace("@db:", "@localhost:")
else:
    db_url = raw_db_url

# Create engine — fall back to SQLite if PostgreSQL connection fails
try:
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {"connect_timeout": 3}
    engine = create_engine(db_url, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to local SQLite database so backend always runs
    db_url = f"sqlite:///{default_sqlite_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
