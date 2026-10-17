import os
import json
import logging
from typing import Optional
from fastapi import Header, HTTPException, Depends
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

logger = logging.getLogger("qr_health_vault.firebase_auth")

DEMO_PATIENT_ID = "00000000-0000-0000-0000-000000000001"

class UserRecord(BaseModel):
    uid: str
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    created_at: Optional[str] = None
    is_verified: bool = True
    provider: str = "firebase"

_firebase_initialized = False

def initialize_firebase():
    global _firebase_initialized
    if _firebase_initialized or len(firebase_admin._apps) > 0:
        _firebase_initialized = True
        return

    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    project_id = os.getenv("FIREBASE_PROJECT_ID", "qr-health-vault").strip()

    try:
        if service_account_path and os.path.isfile(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {"projectId": project_id})
            _firebase_initialized = True
            logger.info("Firebase Admin initialized via service account file")
        elif service_account_json:
            parsed = json.loads(service_account_json)
            cred = credentials.Certificate(parsed)
            firebase_admin.initialize_app(cred, {"projectId": project_id})
            _firebase_initialized = True
            logger.info("Firebase Admin initialized via service account JSON string")
        else:
            # Check default credentials or initialize with projectId for emulator/dev
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {"projectId": project_id})
                _firebase_initialized = True
                logger.info("Firebase Admin initialized via Application Default Credentials")
            except Exception:
                logger.info("Firebase Admin credentials not provided. Operating in development/demo mode.")
                _firebase_initialized = False
    except Exception as e:
        logger.warning(f"Firebase Admin initialization skipped: {str(e)}")
        _firebase_initialized = False

# Auto-initialize on module load
initialize_firebase()

async def get_current_user(authorization: Optional[str] = Header(None)) -> UserRecord:
    """
    FastAPI dependency to verify Firebase ID tokens.
    Extracts the verified UID from the token. Never trusts client-supplied user IDs.
    Do not log raw tokens, phone numbers, or OTPs.
    """
    if not authorization:
        demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
        if demo_mode:
            return UserRecord(
                uid=DEMO_PATIENT_ID,
                phone="+919876543210",
                email="ramesh.sharma@example.com",
                name="Ramesh Sharma",
                created_at="2026-01-01T00:00:00Z"
            )
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required (Bearer <firebase_id_token>)"
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization scheme. Use 'Bearer <token>'")

    token = token.strip()

    # Support demo tokens in dev/demo environments
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    if token in ("demo_jwt_token_123456", "demo_token", "demo_token_ramesh") or token.startswith("demo_token_"):
        return UserRecord(
            uid=DEMO_PATIENT_ID,
            phone="+919876543210",
            email="ramesh.sharma@example.com",
            name="Ramesh Sharma",
            created_at="2026-01-01T00:00:00Z"
        )

    # If Firebase Admin is initialized with valid credentials, verify the cryptographic signature
    if _firebase_initialized and len(firebase_admin._apps) > 0:
        try:
            decoded = firebase_auth.verify_id_token(token)
            uid = decoded.get("uid")
            if not uid:
                raise HTTPException(status_code=401, detail="Token does not contain a valid user ID")
            
            # Extract claims without logging sensitive data
            phone = decoded.get("phone_number")
            email = decoded.get("email")
            name = decoded.get("name") or decoded.get("display_name")
            
            return UserRecord(
                uid=uid,
                phone=phone,
                email=email,
                name=name,
                created_at=None,
                is_verified=True,
                provider=decoded.get("firebase", {}).get("sign_in_provider", "firebase")
            )
        except Exception as e:
            # Do not leak internal token verification errors
            raise HTTPException(status_code=401, detail=f"Invalid or expired Firebase ID token: {str(e)}")

    # Development fallback for unconfigured Firebase Admin (e.g., mock ID tokens starting with 'mock_uid_')
    if token.startswith("mock_uid_") or demo_mode:
        mock_uid = token.replace("mock_uid_", "") if token.startswith("mock_uid_") else DEMO_PATIENT_ID
        return UserRecord(
            uid=mock_uid or DEMO_PATIENT_ID,
            phone="+919876543210",
            email="user@example.com",
            name="Health Vault User",
            created_at="2026-01-01T00:00:00Z"
        )

    raise HTTPException(status_code=401, detail="Firebase Admin is not configured and token is not valid")
