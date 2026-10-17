import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    AUTH_MODE: str = "mock"  # "firebase" or "mock"
    DEMO_MODE: bool = True   # one-tap Demo login
    AI_MODE: str = "mock"    # "mock" or "live"
    GOOGLE_API_KEY: str = ""
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ""
    JWT_SECRET: str = "qr_health_vault_secure_jwt_secret_dev_key_2025"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 72
    FRONTEND_URL: str = "http://localhost:3000"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'app.db'}"
    UPLOADS_DIR: Path = BASE_DIR / "uploads"

settings = Settings()
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
