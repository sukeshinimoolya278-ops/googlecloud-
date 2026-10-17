import os
import re
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.firebase_auth import get_current_user, UserRecord, DEMO_PATIENT_ID
from services.supabase_client import db

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/auth", tags=["Auth & Profile"])

async def get_current_patient_id(user: UserRecord = Depends(get_current_user)) -> str:
    """Extracts verified patient UID from Firebase token dependency"""
    return user.uid

# ==========================================
# Pydantic Models & Input Validation
# ==========================================

class EmergencyContactInput(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    relationship: str = Field("Family", max_length=50)
    phone: str = Field(..., min_length=7, max_length=20)
    is_primary: bool = True

class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    dob: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD format")
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = Field("Prefer not to say")
    blood_group: Optional[str] = Field("Unknown")
    photo_url: Optional[str] = Field(None, max_length=500)
    preferred_language: str = Field("en")
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    abha_id: Optional[str] = Field(None, description="Optional ABHA ID (verification coming soon)")
    emergency_contacts: List[EmergencyContactInput] = Field(default_factory=list)
    onboarding_completed: Optional[bool] = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: Optional[str]) -> str:
        valid = {"Male", "Female", "Other", "Prefer not to say"}
        if v and v.strip() in valid:
            return v.strip()
        return "Prefer not to say"

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v: Optional[str]) -> str:
        valid = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"}
        if v and v.strip().upper() in valid:
            return v.strip().upper()
        return "Unknown"

    @field_validator("preferred_language")
    @classmethod
    def validate_lang(cls, v: str) -> str:
        if v in ("en", "hi", "kn", "ta"):
            return v
        return "en"

    @field_validator("abha_id")
    @classmethod
    def validate_no_aadhaar(cls, v: Optional[str]) -> Optional[str]:
        """
        CRITICAL PRIVACY RULE:
        Strictly prohibit and reject Aadhaar numbers.
        ABHA ID is allowed and marked 'verification coming soon'.
        """
        if not v:
            return None
        cleaned = v.strip()
        # Reject 12-digit consecutive numbers (Aadhaar format: XXXX XXXX XXXX or XXXXXXXXXXXX)
        digits_only = re.sub(r"\D", "", cleaned)
        if len(digits_only) == 12:
            raise ValueError(
                "Aadhaar numbers must never be collected or stored. "
                "Please enter a valid 14-digit ABHA ID (e.g., 91-4829-1029-4821) instead."
            )
        return cleaned

class DeleteAccountRequest(BaseModel):
    confirm: bool = Field(..., description="Must explicitly confirm account deletion")
    reason: Optional[str] = Field(None, max_length=200)

class RevokeShareRequest(BaseModel):
    token: str

# ==========================================
# Auth & Session Sync Endpoints
# ==========================================

@router.post("/sync")
@limiter.limit("30/minute")
async def sync_user_session(request: Request, user: UserRecord = Depends(get_current_user)):
    """
    Called after successful Firebase login (Phone OTP or Google).
    Verifies the Firebase ID token cryptographically.
    Fetches the existing profile or creates a fresh record for new users.
    Never trusts client-supplied user IDs; uses verified UID from token.
    """
    profile = db.get_or_create_user(
        uid=user.uid,
        phone=user.phone,
        email=user.email,
        name=user.name
    )
    contacts = db.emergency_contacts.get(user.uid, [])

    return {
        "status": "success",
        "uid": user.uid,
        "profile": profile,
        "emergency_contacts": contacts,
        "verified_provider": user.provider
    }

@router.get("/profile")
async def get_profile(user: UserRecord = Depends(get_current_user)):
    """
    Retrieves the authenticated user's profile and emergency contacts.
    """
    profile = db.get_or_create_user(
        uid=user.uid,
        phone=user.phone,
        email=user.email,
        name=user.name
    )
    contacts = db.emergency_contacts.get(user.uid, [])
    return {
        "profile": profile,
        "emergency_contacts": contacts
    }

@router.put("/profile")
async def update_profile(
    req: ProfileUpdateRequest,
    user: UserRecord = Depends(get_current_user)
):
    """
    Updates the profile for the verified UID with Pydantic validation.
    """
    existing = db.get_or_create_user(
        uid=user.uid,
        phone=user.phone,
        email=user.email,
        name=user.name
    )

    # Compute age if DOB is provided
    age = req.age
    if req.dob and not age:
        try:
            from datetime import datetime
            birth_date = datetime.strptime(req.dob, "%Y-%m-%d")
            today = datetime.now()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        except Exception:
            pass

    existing.update({
        "full_name": req.full_name,
        "dob": req.dob or existing.get("dob", ""),
        "age": age if age is not None else existing.get("age", 0),
        "gender": req.gender,
        "blood_group": req.blood_group,
        "photo_url": req.photo_url or existing.get("photo_url", ""),
        "preferred_language": req.preferred_language,
        "allergies": [a.strip() for a in req.allergies if a.strip()],
        "chronic_conditions": [c.strip() for c in req.chronic_conditions if c.strip()],
        "abha_id": req.abha_id or existing.get("abha_id", "")
    })

    if req.onboarding_completed is not None:
        existing["onboarding_completed"] = req.onboarding_completed

    db.profiles[user.uid] = existing

    # Update emergency contacts
    contacts_list = []
    for c in req.emergency_contacts:
        contacts_list.append({
            "id": str(uuid.uuid4()),
            "patient_id": user.uid,
            "name": c.name,
            "relationship": c.relationship,
            "phone": c.phone,
            "is_primary": c.is_primary
        })
    db.emergency_contacts[user.uid] = contacts_list

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "profile": existing,
        "emergency_contacts": contacts_list
    }

# ==========================================
# Security & Active Shares
# ==========================================

@router.get("/qr-shares")
async def get_active_shares(user: UserRecord = Depends(get_current_user)):
    """
    Lists active QR share links for the user with an option to revoke.
    """
    shares = db.get_active_shares(user.uid)
    return {
        "status": "success",
        "shares": shares
    }

@router.delete("/qr-shares/{token}")
async def revoke_qr_share(token: str, user: UserRecord = Depends(get_current_user)):
    """
    Revokes a specific active QR share link.
    """
    revoked = db.revoke_share(user.uid, token)
    return {
        "status": "success" if revoked else "not_found",
        "message": f"QR share link {'revoked' if revoked else 'not found'}"
    }

# ==========================================
# Danger Zone: Account Deletion
# ==========================================

@router.delete("/account")
async def delete_account(
    req: DeleteAccountRequest,
    user: UserRecord = Depends(get_current_user)
):
    """
    Danger Zone: Permanently deletes the user profile and all clinical records.
    Never logs sensitive identity details.
    """
    if not req.confirm:
        raise HTTPException(
            status_code=400,
            detail="Account deletion requires explicit confirmation."
        )

    # 1. Wipe data from in-memory / persistent database
    db.delete_user_data(user.uid)

    # 2. Delete from Firebase Auth if live Firebase Admin is initialized
    try:
        from firebase_admin import auth as fb_admin_auth
        fb_admin_auth.delete_user(user.uid)
    except Exception:
        # Gracefully handle if user was demo or emulator
        pass

    return {
        "status": "success",
        "message": "Your account and all associated health records have been permanently deleted."
    }

# Backward compatibility endpoints for demo mode
class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

@router.post("/send-otp")
async def send_otp(req: SendOTPRequest):
    demo_otp = os.getenv("DEMO_OTP", "123456")
    return {
        "status": "success",
        "message": f"OTP sent to {req.phone}",
        "demo_mode": True,
        "demo_hint": f"Use fixed test OTP: {demo_otp}"
    }

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    demo_otp = os.getenv("DEMO_OTP", "123456")
    if req.otp == demo_otp:
        profile = db.get_or_create_user(
            uid=DEMO_PATIENT_ID,
            phone=req.phone,
            name="Ramesh Sharma"
        )
        return {
            "status": "success",
            "token": "demo_jwt_token_123456",
            "patient_id": DEMO_PATIENT_ID,
            "profile": profile
        }
    raise HTTPException(status_code=400, detail="Invalid OTP code. Use 123456 in Demo Mode.")
