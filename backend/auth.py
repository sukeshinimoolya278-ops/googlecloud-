import datetime
import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import get_db
from backend.models import User

security = HTTPBearer(auto_error=False)

def create_access_token(user_id: int, role: str) -> str:
    """Generate a signed JWT session token."""
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT session token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token."
        )

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to retrieve authenticated user from Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token."
        )

    payload = decode_access_token(credentials.credentials)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with session not found."
        )

    return user

def verify_mock_otp(phone: str, otp: str) -> bool:
    """Verify phone OTP under mock mode."""
    # Under AUTH_MODE=mock, OTP is always 123456
    return otp.strip() == "123456"

def verify_firebase_token(id_token: str) -> Optional[dict]:
    """Verify Firebase ID token. Falls back to mock or returns verified claims."""
    if settings.AUTH_MODE == "mock":
        return None

    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth

        # Initialize firebase-admin app if needed
        if not firebase_admin._apps:
            if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
                cred = firebase_admin.credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

        decoded_token = fb_auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"[AUTH ERROR] Firebase token verification failed: {e}")
        return None
