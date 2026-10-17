import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

# Load environment
load_dotenv()

from routers import auth, documents, medicines, qr, doctor, emergency

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title="QR Health Vault API",
    description="Your entire medical history, one scan away, explained in your language.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
origins = list(set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    frontend_url,
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(medicines.router)
app.include_router(qr.router)
app.include_router(doctor.router)
app.include_router(emergency.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "QR Health Vault Backend",
        "version": "1.0.0",
        "demo_mode": os.getenv("DEMO_MODE", "true").lower() == "true",
        "ai_provider": os.getenv("AI_PROVIDER", "gemini")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
