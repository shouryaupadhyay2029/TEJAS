import time
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.database import engine, Base
import app.models
from app.routers import sections, tasks, schedule, network, optimizer, auth, traffic, telemetry, simulation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup DB Connection and Table Creation with Retry Logic
    max_retries = 10
    retry_interval = 2
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database and creating tables (Attempt {attempt}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully!")
            break
        except Exception as exc:
            logger.warning(f"Database connection failed on attempt {attempt}/{max_retries}: {exc}")
            if attempt == max_retries:
                logger.error("Exhausted all retries connecting to the database.")
                raise exc
            time.sleep(retry_interval)
    
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="TEJAS Railway Maintenance Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Policy Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(sections.router)
app.include_router(tasks.router)
app.include_router(schedule.router)
app.include_router(network.router)
app.include_router(optimizer.router)
app.include_router(traffic.router)
app.include_router(telemetry.router)
app.include_router(simulation.router)

@app.post("/broadcast/telemetry", tags=["telemetry"])
async def broadcast_telemetry(payload: dict):
    """
    HTTP POST endpoint to broadcast a telemetry event or emergency defect alert to all connected WebSocket clients.
    """
    await telemetry.manager.broadcast(payload)
    return {"status": "broadcasted", "payload_type": payload.get("event_type", "UNKNOWN")}

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}

