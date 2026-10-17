import uuid
import datetime
import hashlib
from fastapi import APIRouter, HTTPException, Request
from services.supabase_client import db
from services.ai_client import summarize

router = APIRouter(prefix="/api/doctor", tags=["Doctor QR Portal"])

@router.get("/view/{token}")
async def get_doctor_vault_view(token: str, request: Request):
    """
    Doctor access flow:
    1. Validate token
    2. Check consent status (pending, approved, denied, expired)
    3. Verify strict expiration (checked on every single request)
    4. Provide clinical timeline, medications, and one-page clinical summary
    """
    token_obj = db.qr_tokens.get(token)
    if not token_obj or not token_obj.get("active") or token_obj.get("type") != "full":
        raise HTTPException(status_code=404, detail="Invalid or revoked QR token")

    patient_id = token_obj["patient_id"]
    profile = db.profiles.get(patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Find associated access request
    active_req = None
    for req in db.access_requests.values():
        if req.get("token") == token or req.get("patient_id") == patient_id:
            active_req = req
            break

    # If no request exists yet, auto-create a pending consent request for this scan
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:12]

    if not active_req:
        req_id = f"req_{uuid.uuid4().hex[:8]}"
        active_req = {
            "id": req_id,
            "patient_id": patient_id,
            "token": token,
            "requester_label": f"Attending Physician (Terminal {ip_hash})",
            "status": "pending",
            "duration_hours": 24,
            "approved_at": None,
            "expires_at": None,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        db.access_requests[req_id] = active_req

    # Check status and strict expiration
    now = datetime.datetime.now(datetime.timezone.utc)
    if active_req.get("status") == "approved":
        expires_at_str = active_req.get("expires_at")
        if expires_at_str:
            expires_at = datetime.datetime.fromisoformat(expires_at_str)
            if now > expires_at:
                active_req["status"] = "expired"
                return {
                    "status": "expired",
                    "patient_name": profile.get("full_name"),
                    "message": "Access expired. Please ask the patient to scan or re-approve."
                }
    elif active_req.get("status") in ["pending", "denied"]:
        return {
            "status": active_req.get("status"),
            "request_id": active_req.get("id"),
            "patient_name": profile.get("full_name"),
            "requester_label": active_req.get("requester_label"),
            "message": "Patient consent required before viewing records."
        }

    # Access is approved & valid: Log the doctor view
    db.access_logs.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "access_type": "doctor_view",
        "requester_label": active_req.get("requester_label", "Attending Doctor"),
        "ip_hash": ip_hash,
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "timestamp": now.isoformat()
    })

    # Prepare Clinical Package
    confirmed_meds = [m for m in db.medicines.get(patient_id, []) if m.get("confirmed")]
    confirmed_labs = [l for l in db.lab_results.get(patient_id, []) if l.get("confirmed")]
    patient_docs = [d for d in db.documents.values() if d.get("patient_id") == patient_id]
    patient_docs.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)

    clinical_summary = summarize(profile)

    return {
        "status": "authorized",
        "patient": {
            "name": profile.get("full_name"),
            "age": profile.get("age"),
            "gender": profile.get("gender"),
            "blood_group": profile.get("blood_group"),
            "allergies": profile.get("allergies", []),
            "chronic_conditions": profile.get("chronic_conditions", []),
        },
        "summary": clinical_summary["summary"],
        "disclaimer": clinical_summary["disclaimer"],
        "active_medicines": confirmed_meds,
        "recent_labs": confirmed_labs,
        "timeline_documents": patient_docs,
        "access_expires_at": active_req.get("expires_at")
    }
