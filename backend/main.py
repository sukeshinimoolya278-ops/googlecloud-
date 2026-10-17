import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base
from backend.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and database is seeded if in demo mode
    Base.metadata.create_all(bind=engine)
    if settings.DEMO_MODE:
        seed_database()
    yield

app = FastAPI(
    title="QR Health Vault API",
    description="Secure medical vault with AI explanation and QR emergency & doctor sharing",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
def read_root():
    return {
        "app": "QR Health Vault API",
        "status": "healthy",
        "version": "1.0.0",
        "auth_mode": settings.AUTH_MODE,
        "demo_mode": settings.DEMO_MODE,
        "ai_mode": settings.AI_MODE,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}
