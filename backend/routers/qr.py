import os
import io
import uuid
import secrets
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
import qrcode
from PIL import Image, ImageDraw, ImageFont
from routers.auth import get_current_patient_id
from services.supabase_client import db

router = APIRouter(prefix="/api/qr", tags=["QR Code & Consent Management"])

class ApprovalRequest(BaseModel):
    request_id: str
    action: str # "approved" or "denied"
    duration_hours: int = 24 # 1, 24, or 168 (7 days)

def _get_or_create_patient_tokens(patient_id: str):
    full_token = None
    emerg_token = None
    for token_str, token_obj in db.qr_tokens.items():
        if token_obj.get("patient_id") == patient_id and token_obj.get("active"):
            if token_obj.get("type") == "full":
                full_token = token_str
            elif token_obj.get("type") == "emergency":
                emerg_token = token_str

    if not full_token:
        full_token = secrets.token_urlsafe(32)
        db.qr_tokens[full_token] = {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "token": full_token,
            "type": "full",
            "active": True
        }

    if not emerg_token:
        emerg_token = secrets.token_urlsafe(32)
        db.qr_tokens[emerg_token] = {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "token": emerg_token,
            "type": "emergency",
            "active": True
        }

    return full_token, emerg_token

@router.get("/tokens")
async def get_patient_qr_tokens(patient_id: str = Depends(get_current_patient_id)):
    full_token, emerg_token = _get_or_create_patient_tokens(patient_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    return {
        "doctor_token": full_token,
        "emergency_token": emerg_token,
        "doctor_url": f"{frontend_url}/doctor/{full_token}",
        "emergency_url": f"{frontend_url}/emergency/{emerg_token}"
    }

@router.post("/regenerate")
async def regenerate_tokens(token_type: str = "full", patient_id: str = Depends(get_current_patient_id)):
    """Revoke old token and generate new random token"""
    for token_str, token_obj in list(db.qr_tokens.items()):
        if token_obj.get("patient_id") == patient_id and token_obj.get("type") == token_type:
            token_obj["active"] = False

    new_token = secrets.token_urlsafe(32)
    db.qr_tokens[new_token] = {
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "token": new_token,
        "type": token_type,
        "active": True
    }

    # Log revocation event
    db.access_logs.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "access_type": "revocation",
        "requester_label": f"Patient regenerated {token_type} QR token",
        "ip_hash": "local_patient",
        "user_agent": "QR Vault",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

    return {"status": "success", "new_token": new_token, "type": token_type}

@router.get("/image/{token_type}")
async def get_qr_image(token_type: str, patient_id: str = Depends(get_current_patient_id)):
    """Serves high-contrast PNG QR code"""
    full_token, emerg_token = _get_or_create_patient_tokens(patient_id)
    token = full_token if token_type == "full" else emerg_token

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    route = "doctor" if token_type == "full" else "emergency"
    target_url = f"{frontend_url}/{route}/{token}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1e1b4b", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/emergency-card")
async def get_emergency_lockscreen_card(patient_id: str = Depends(get_current_patient_id)):
    """
    Generates a phone lockscreen-ready emergency card PNG containing:
    Emergency QR + Name + Blood Group + Allergies + Emergency Contact
    """
    profile = db.profiles.get(patient_id, {})
    contacts = db.emergency_contacts.get(patient_id, [])
    primary_contact = contacts[0] if contacts else {"name": "None", "phone": "N/A"}

    _, emerg_token = _get_or_create_patient_tokens(patient_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    emerg_url = f"{frontend_url}/emergency/{emerg_token}"

    # Generate QR image
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(emerg_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#dc2626", back_color="white") # High contrast red

    # Create lock screen card canvas (600 x 900)
    card = Image.new("RGB", (600, 850), color="#ffffff")
    draw = ImageDraw.Draw(card)

    # Header banner
    draw.rectangle([0, 0, 600, 110], fill="#dc2626")
    draw.text((30, 25), "EMERGENCY MEDICAL CARD", fill="#ffffff")
    draw.text((30, 65), "Scan QR immediately in an emergency", fill="#fee2e2")

    # Patient info
    draw.text((40, 140), f"Name: {profile.get('full_name', 'Patient')}", fill="#0f172a")
    draw.text((40, 180), f"Blood Group: {profile.get('blood_group', 'Unknown')}", fill="#dc2626")
    draw.text((40, 220), f"Allergies: {', '.join(profile.get('allergies', [])) or 'None'}", fill="#b91c1c")
    draw.text((40, 260), f"Conditions: {', '.join(profile.get('chronic_conditions', [])) or 'None'}", fill="#334155")
    draw.text((40, 300), f"Emergency Contact: {primary_contact.get('name')} ({primary_contact.get('phone')})", fill="#0f172a")

    # Paste QR Code
    card.paste(qr_img, (140, 370))

    # Footer
    draw.rectangle([0, 780, 600, 850], fill="#f1f5f9")
    draw.text((50, 805), "QR Health Vault - Instant Emergency Lifeline", fill="#475569")

    buf = io.BytesIO()
    card.save(buf, format="PNG")
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/requests")
async def get_access_requests(patient_id: str = Depends(get_current_patient_id)):
    """Pending doctor access requests awaiting patient consent"""
    reqs = [r for r in db.access_requests.values() if r.get("patient_id") == patient_id]
    reqs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"requests": reqs}

@router.post("/requests/consent")
async def respond_to_access_request(
    body: ApprovalRequest,
    patient_id: str = Depends(get_current_patient_id)
):
    """Patient grants or denies access for 1hr, 24hrs, or 7 days"""
    req = db.access_requests.get(body.request_id)
    if not req or req.get("patient_id") != patient_id:
        raise HTTPException(status_code=404, detail="Access request not found")

    now = datetime.datetime.now(datetime.timezone.utc)
    if body.action == "approved":
        req["status"] = "approved"
        req["duration_hours"] = body.duration_hours
        req["approved_at"] = now.isoformat()
        req["expires_at"] = (now + datetime.timedelta(hours=body.duration_hours)).isoformat()
    else:
        req["status"] = "denied"

    # Log consent decision
    db.access_logs.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "access_type": "consent_approval" if body.action == "approved" else "revocation",
        "requester_label": f"{req.get('requester_label', 'Doctor')} ({body.action} for {body.duration_hours}h)",
        "ip_hash": "patient_consent",
        "user_agent": "Vault App",
        "timestamp": now.isoformat()
    })

    return {"status": "success", "request": req}

@router.get("/logs")
async def get_access_logs(patient_id: str = Depends(get_current_patient_id)):
    """Patient audit log of all scans, views and approvals"""
    logs = [l for l in db.access_logs if l.get("patient_id") == patient_id]
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"logs": logs}
