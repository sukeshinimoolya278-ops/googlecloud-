import secrets
from typing import Optional, Literal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import User, PatientProfile, QRToken
from backend.auth import (
    create_access_token,
    get_current_user,
    verify_mock_otp,
    verify_firebase_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SessionRequest(BaseModel):
    auth_type: Literal["demo", "phone_otp", "firebase"] = "demo"
    demo_role: Optional[Literal["patient", "doctor"]] = "patient"
    phone: Optional[str] = None
    otp: Optional[str] = None
    firebase_token: Optional[str] = None
    preferred_language: Optional[str] = "en"

class RoleUpdateRequest(BaseModel):
    role: Literal["patient", "doctor"]
    doctor_reg_no: Optional[str] = None
    full_name: Optional[str] = None
    preferred_language: Optional[Literal["en", "hi", "kn"]] = None

def user_to_dict(user: User) -> dict:
    profile_data = None
    if user.profile:
        profile_data = {
            "age": user.profile.age,
            "gender": user.profile.gender,
            "blood_group": user.profile.blood_group,
            "allergies": user.profile.allergies,
            "conditions": user.profile.conditions,
            "emergency_contact_name": user.profile.emergency_contact_name,
            "emergency_contact_phone": user.profile.emergency_contact_phone,
            "emergency_contact_relation": user.profile.emergency_contact_relation,
            "emergency_enabled": user.profile.emergency_enabled,
        }

    return {
        "id": user.id,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "auth_provider": user.auth_provider,
        "preferred_language": user.preferred_language,
        "doctor_reg_no": user.doctor_reg_no,
        "profile": profile_data
    }

@router.post("/session")
def create_session(req: SessionRequest, db: Session = Depends(get_db)):
    """
    Exchange credentials (one-tap demo, mock OTP, or Firebase token) for a session JWT.
    """
    user: Optional[User] = None

    if req.auth_type == "demo":
        if not settings.DEMO_MODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Demo mode is disabled on this server."
            )

        target_phone = "+919876543210" if req.demo_role == "patient" else "+919876543220"
        user = db.query(User).filter(User.phone == target_phone).first()

        if not user:
            # Fallback create if seeder was reset
            role = req.demo_role or "patient"
            name = "Rahul Sharma" if role == "patient" else "Dr. Emily Peterson"
            email = "patient@qrhealth.demo" if role == "patient" else "doctor@qrhealth.demo"
            reg_no = "KMC-48291" if role == "doctor" else None
            user = User(
                role=role,
                full_name=name,
                email=email,
                phone=target_phone,
                auth_provider="demo",
                doctor_reg_no=reg_no,
                preferred_language=req.preferred_language or "en"
            )
            db.add(user)
            db.flush()

            if role == "patient":
                db.add(PatientProfile(
                    user_id=user.id,
                    age=42,
                    gender="male",
                    blood_group="B+",
                    allergies="Penicillin, Sulfa drugs",
                    conditions="Type 2 Diabetes, Mild Hypertension",
                    emergency_contact_name="Sunita Sharma",
                    emergency_contact_phone="+919876543211",
                    emergency_contact_relation="Spouse",
                    emergency_enabled=True
                ))
            db.commit()
            db.refresh(user)

    elif req.auth_type == "phone_otp":
        if not req.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is required."
            )
        if not req.otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP code is required."
            )

        if settings.AUTH_MODE == "mock":
            if not verify_mock_otp(req.phone, req.otp):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid OTP code. In mock mode, the OTP is always 123456."
                )
        else:
            # Live Firebase Phone Auth token validation
            if not req.firebase_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Firebase verification token is required in live auth mode."
                )
            claims = verify_firebase_token(req.firebase_token)
            if not claims:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Firebase phone verification token."
                )

        # Lookup or create user by phone
        cleaned_phone = req.phone.strip()
        user = db.query(User).filter(User.phone == cleaned_phone).first()
        if not user:
            # Auto-provision new user
            short_digits = cleaned_phone[-4:] if len(cleaned_phone) >= 4 else "User"
            user = User(
                role="patient",
                full_name=f"Patient {short_digits}",
                phone=cleaned_phone,
                auth_provider="phone",
                preferred_language=req.preferred_language or "en"
            )
            db.add(user)
            db.flush()

            # Create default patient profile
            db.add(PatientProfile(
                user_id=user.id,
                emergency_enabled=True
            ))

            # Generate initial tokens
            db.add(QRToken(
                patient_id=user.id,
                kind="doctor",
                token="doc_" + secrets.token_hex(20),
                is_active=True
            ))
            db.add(QRToken(
                patient_id=user.id,
                kind="emergency",
                token="emg_" + secrets.token_hex(20),
                is_active=True
            ))

            db.commit()
            db.refresh(user)

    elif req.auth_type == "firebase":
        if not req.firebase_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firebase ID token is required."
            )

        claims = verify_firebase_token(req.firebase_token)
        if not claims and settings.AUTH_MODE != "mock":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase credentials."
            )

        uid = claims.get("uid") if claims else "mock-firebase-uid"
        email = claims.get("email") if claims else "googleuser@healthvault.local"
        name = claims.get("name") if claims else "Google User"

        user = db.query(User).filter((User.firebase_uid == uid) | (User.email == email)).first()
        if not user:
            user = User(
                role="patient",
                full_name=name,
                email=email,
                firebase_uid=uid,
                auth_provider="google",
                preferred_language=req.preferred_language or "en"
            )
            db.add(user)
            db.flush()
            db.add(PatientProfile(user_id=user.id, emergency_enabled=True))
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication failed. Could not find or create user session."
        )

    # Issue JWT
    token = create_access_token(user.id, user.role)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_to_dict(user)
    }

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user)):
    """
    Get the authenticated user's profile and active roles.
    """
    return user_to_dict(user)

@router.post("/role")
def update_user_role(
    req: RoleUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update or select user role (patient or doctor) and registration details.
    """
    user.role = req.role

    if req.role == "doctor":
        if req.doctor_reg_no:
            user.doctor_reg_no = req.doctor_reg_no.strip()
    elif req.role == "patient":
        # Ensure patient profile exists
        if not user.profile:
            db.add(PatientProfile(user_id=user.id, emergency_enabled=True))

    if req.full_name:
        user.full_name = req.full_name.strip()

    if req.preferred_language:
        user.preferred_language = req.preferred_language

    db.commit()
    db.refresh(user)

    # Issue renewed JWT with updated role claim
    new_token = create_access_token(user.id, user.role)

    return {
        "message": "Role updated successfully",
        "access_token": new_token,
        "token_type": "bearer",
        "user": user_to_dict(user)
    }
