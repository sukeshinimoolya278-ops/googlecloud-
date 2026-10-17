import uuid
import datetime
import hashlib
from fastapi import APIRouter, HTTPException, Request
from services.supabase_client import db

router = APIRouter(prefix="/api/emergency", tags=["Emergency QR Public Portal"])

@router.get("/view/{token}")
async def get_emergency_view(token: str, request: Request):
    """
    Public emergency endpoint: No login required.
    Shows ONLY critical lifesaving data:
    - Name, age, blood group
    - Allergies (vital for trauma / drug administration)
    - Chronic conditions
    - Current verified medicines
    - Emergency contacts (tap to call)
    Logs every emergency scan.
    """
    token_obj = db.qr_tokens.get(token)
    if not token_obj or not token_obj.get("active") or token_obj.get("type") != "emergency":
        raise HTTPException(status_code=404, detail="Invalid emergency token")

    patient_id = token_obj["patient_id"]
    profile = db.profiles.get(patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Log emergency access
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:12]

    db.access_logs.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "access_type": "emergency_view",
        "requester_label": f"Emergency First Responder / Scan ({ip_hash})",
        "ip_hash": ip_hash,
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

    # Filter active confirmed medicines only
    active_meds = [m for m in db.medicines.get(patient_id, []) if m.get("confirmed")]
    contacts = db.emergency_contacts.get(patient_id, [])

    return {
        "status": "emergency_active",
        "patient": {
            "full_name": profile.get("full_name"),
            "age": profile.get("age"),
            "gender": profile.get("gender"),
            "blood_group": profile.get("blood_group"),
            "allergies": profile.get("allergies", []),
            "chronic_conditions": profile.get("chronic_conditions", []),
        },
        "current_medicines": [
            {"name": m.get("name"), "dose": m.get("dose"), "frequency": m.get("frequency")}
            for m in active_meds
        ],
        "emergency_contacts": contacts,
        "disclaimer": "Emergency Responders: Verify allergies before administering medications."
    }
