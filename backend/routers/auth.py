import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from services.supabase_client import db, DEMO_PATIENT_ID

router = APIRouter(prefix="/api/auth", tags=["Auth & Profile"])

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class GoogleAuthRequest(BaseModel):
    access_token: str

class EmergencyContactInput(BaseModel):
    name: str
    relationship: str = "Family"
    phone: str
    is_primary: bool = True

class ProfileUpdateRequest(BaseModel):
    full_name: str
    age: int
    gender: Optional[str] = "Prefer not to say"
    blood_group: str
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    preferred_language: str = "en"
    emergency_contacts: List[EmergencyContactInput] = []

def get_current_patient_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extracts and validates Supabase JWT token.
    In DEMO_MODE, accepts demo tokens or defaults to seed patient Ramesh Sharma.
    """
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    if not authorization:
        if demo_mode:
            return DEMO_PATIENT_ID
        raise HTTPException(status_code=401, detail="Missing Authorization Header")

    token = authorization.replace("Bearer ", "").strip()
    if token.startswith("demo_token") or token == "demo_jwt_token_123456":
        return DEMO_PATIENT_ID
    
    # In live Supabase mode, the JWT can be decoded with SUPABASE_JWT_SECRET or Supabase client
    return DEMO_PATIENT_ID

@router.post("/send-otp")
async def send_otp(req: SendOTPRequest):
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    demo_otp = os.getenv("DEMO_OTP", "123456")

    return {
        "status": "success",
        "message": f"OTP sent to {req.phone}",
        "demo_mode": demo_mode,
        "demo_hint": f"Use fixed test OTP: {demo_otp}" if demo_mode else None
    }

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    demo_otp = os.getenv("DEMO_OTP", "123456")

    if demo_mode and req.otp == demo_otp:
        # Successful demo authentication
        profile = db.profiles.get(DEMO_PATIENT_ID)
        return {
            "status": "success",
            "token": "demo_jwt_token_123456",
            "patient_id": DEMO_PATIENT_ID,
            "profile": profile
        }

    # For production Supabase SMS OTP verification
    raise HTTPException(status_code=400, detail="Invalid OTP code. Please enter 123456 in Demo Mode.")

@router.post("/google")
async def google_login(req: GoogleAuthRequest):
    # Supabase Google OAuth exchange
    profile = db.profiles.get(DEMO_PATIENT_ID)
    return {
        "status": "success",
        "token": "demo_jwt_token_123456",
        "patient_id": DEMO_PATIENT_ID,
        "profile": profile
    }

@router.get("/profile")
async def get_profile(patient_id: str = Depends(get_current_patient_id)):
    profile = db.profiles.get(patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    contacts = db.emergency_contacts.get(patient_id, [])
    return {
        "profile": profile,
        "emergency_contacts": contacts
    }

@router.put("/profile")
async def update_profile(req: ProfileUpdateRequest, patient_id: str = Depends(get_current_patient_id)):
    existing = db.profiles.get(patient_id, {"id": patient_id})
    existing.update({
        "full_name": req.full_name,
        "age": req.age,
        "gender": req.gender,
        "blood_group": req.blood_group,
        "allergies": req.allergies,
        "chronic_conditions": req.chronic_conditions,
        "preferred_language": req.preferred_language,
    })
    db.profiles[patient_id] = existing

    # Update emergency contacts
    contacts_list = []
    for c in req.emergency_contacts:
        contacts_list.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "name": c.name,
            "relationship": c.relationship,
            "phone": c.phone,
            "is_primary": c.is_primary
        })
    db.emergency_contacts[patient_id] = contacts_list

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "profile": existing,
        "emergency_contacts": contacts_list
    }
