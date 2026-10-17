import os
import hashlib
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from routers.auth import get_current_patient_id
from services.supabase_client import db
from services.ai_client import extract_report, extract_prescription, explain
from services.validators import validate_lab_value, calculate_lab_flag, fuzzy_match_medicine, check_allergy_and_interactions

router = APIRouter(prefix="/api/documents", tags=["Documents & AI Extraction"])

# Upload directory for local storage when Supabase Storage is offline
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ConfirmLabItem(BaseModel):
    id: Optional[str] = None
    test_name: str
    value: float
    unit: str = ""
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None

class ConfirmPrescriptionItem(BaseModel):
    id: Optional[str] = None
    name: str
    dose: str = ""
    frequency: str = "Once daily"
    duration_days: int = 5
    instructions: str = ""

class ConfirmDocumentRequest(BaseModel):
    lab_tests: Optional[List[ConfirmLabItem]] = None
    medicines: Optional[List[ConfirmPrescriptionItem]] = None

def _process_document_ai_background(doc_id: str, patient_id: str, file_path: str, mime_type: str, doc_type: str):
    """FastAPI Background task for vision LLM extraction"""
    try:
        db.documents[doc_id]["status"] = "processing"
        
        # Read file bytes
        file_bytes = b""
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                file_bytes = f.read()

        if doc_type == "lab_report":
            extracted = extract_report(file_bytes, mime_type=mime_type)
            tests = extracted.get("tests", [])
            
            lab_entries = []
            for item in tests:
                # Biological validation
                is_valid, error = validate_lab_value(item["name"], item["value"], item.get("unit"))
                # Rule based abnormal flag
                flag = calculate_lab_flag(item["value"], item.get("normal_min"), item.get("normal_max"), item["name"])
                
                lab_entries.append({
                    "id": str(uuid.uuid4()),
                    "document_id": doc_id,
                    "patient_id": patient_id,
                    "test_name": item["name"],
                    "value": item["value"],
                    "unit": item.get("unit", ""),
                    "normal_min": item.get("normal_min"),
                    "normal_max": item.get("normal_max"),
                    "flag": flag,
                    "confidence": item.get("confidence", 0.9),
                    "confirmed": False, # Patient must confirm in verification screen
                    "source_document_id": doc_id,
                    "validation_error": error if not is_valid else None,
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                })
            
            if patient_id not in db.lab_results:
                db.lab_results[patient_id] = []
            db.lab_results[patient_id].extend(lab_entries)

        elif doc_type == "prescription":
            extracted = extract_prescription(file_bytes, mime_type=mime_type)
            meds = extracted.get("medicines", [])
            
            med_entries = []
            patient_profile = db.profiles.get(patient_id, {})
            patient_allergies = patient_profile.get("allergies", [])
            current_med_names = [m["name"] for m in db.medicines.get(patient_id, []) if m.get("confirmed")]

            now = datetime.datetime.now(datetime.timezone.utc)
            for item in meds:
                fuzzy = fuzzy_match_medicine(item["name"])
                matched_name = fuzzy["standard_name"] if fuzzy["matched"] else item["name"]
                
                # Check allergy & interaction warnings
                warnings = check_allergy_and_interactions(matched_name, patient_allergies, current_med_names)

                duration = item.get("duration_days", 5)
                med_entries.append({
                    "id": str(uuid.uuid4()),
                    "document_id": doc_id,
                    "patient_id": patient_id,
                    "name": matched_name,
                    "dose": item.get("dose", ""),
                    "frequency": item.get("frequency", "Once daily"),
                    "duration_days": duration,
                    "start_date": now.strftime("%Y-%m-%d"),
                    "end_date": (now + datetime.timedelta(days=duration)).strftime("%Y-%m-%d"),
                    "instructions": item.get("instructions", ""),
                    "confidence": item.get("confidence", 0.9),
                    "confirmed": False,
                    "warnings": warnings,
                    "fuzzy_match": fuzzy,
                    "created_at": now.isoformat()
                })

            if patient_id not in db.medicines:
                db.medicines[patient_id] = []
            db.medicines[patient_id].extend(med_entries)

        db.documents[doc_id]["status"] = "ready"
    except Exception as e:
        db.documents[doc_id]["status"] = "failed"
        db.documents[doc_id]["error_message"] = str(e)

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form(...), # 'lab_report', 'prescription', 'scan', 'other'
    patient_id: str = Depends(get_current_patient_id)
):
    # Validate file size (<10MB) and type
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")
    
    allowed_mimes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_mimes and not file.filename.lower().endswith((".pdf", ".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Allowed formats: PDF, JPG, PNG")

    # Compute SHA-256 hash to prevent duplicate uploads
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Check if duplicate exists for this patient
    for doc in db.documents.values():
        if doc.get("patient_id") == patient_id and doc.get("file_hash") == file_hash:
            raise HTTPException(status_code=409, detail="Duplicate file. This document has already been uploaded.")

    # Save file locally
    doc_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    safe_filename = f"{doc_id}{ext}"
    local_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(local_path, "wb") as f:
        f.write(content)

    doc_record = {
        "id": doc_id,
        "patient_id": patient_id,
        "type": doc_type,
        "file_name": file.filename,
        "file_path": local_path,
        "file_hash": file_hash,
        "mime_type": file.content_type or "image/jpeg",
        "size_bytes": len(content),
        "status": "uploaded",
        "uploaded_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    db.documents[doc_id] = doc_record

    # Schedule background AI extraction
    background_tasks.add_task(
        _process_document_ai_background,
        doc_id=doc_id,
        patient_id=patient_id,
        file_path=local_path,
        mime_type=doc_record["mime_type"],
        doc_type=doc_type
    )

    return {
        "status": "success",
        "message": "File uploaded successfully. AI processing started.",
        "document": doc_record
    }

@router.get("/")
async def list_documents(patient_id: str = Depends(get_current_patient_id), page: int = 1, limit: int = 20):
    user_docs = [d for d in db.documents.values() if d.get("patient_id") == patient_id]
    user_docs.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    
    start = (page - 1) * limit
    paginated = user_docs[start:start + limit]
    return {
        "documents": paginated,
        "total": len(user_docs),
        "page": page,
        "limit": limit
    }

@router.get("/{document_id}")
async def get_document_details(document_id: str, patient_id: str = Depends(get_current_patient_id)):
    doc = db.documents.get(document_id)
    if not doc or doc.get("patient_id") != patient_id:
        raise HTTPException(status_code=404, detail="Document not found")

    lab_items = [item for item in db.lab_results.get(patient_id, []) if item.get("document_id") == document_id]
    medicine_items = [item for item in db.medicines.get(patient_id, []) if item.get("document_id") == document_id]

    return {
        "document": doc,
        "lab_results": lab_items,
        "medicines": medicine_items
    }

@router.post("/{document_id}/confirm")
async def confirm_extracted_data(
    document_id: str,
    req: ConfirmDocumentRequest,
    patient_id: str = Depends(get_current_patient_id)
):
    """
    Verification Screen: Patient reviews extracted data, modifies fields if needed,
    and marks them confirmed. Only confirmed data is saved to final vault.
    """
    doc = db.documents.get(document_id)
    if not doc or doc.get("patient_id") != patient_id:
        raise HTTPException(status_code=404, detail="Document not found")

    # Update or add confirmed lab results
    if req.lab_tests is not None:
        # Clear prior unconfirmed lab results for this document
        existing = db.lab_results.get(patient_id, [])
        db.lab_results[patient_id] = [r for r in existing if r.get("document_id") != document_id or r.get("confirmed")]

        for test in req.lab_tests:
            is_valid, error = validate_lab_value(test.test_name, test.value, test.unit)
            flag = calculate_lab_flag(test.value, test.normal_min, test.normal_max, test.test_name)

            db.lab_results[patient_id].append({
                "id": test.id or str(uuid.uuid4()),
                "document_id": document_id,
                "patient_id": patient_id,
                "test_name": test.test_name,
                "value": test.value,
                "unit": test.unit,
                "normal_min": test.normal_min,
                "normal_max": test.normal_max,
                "flag": flag,
                "confidence": 1.0, # Confirmed by patient
                "confirmed": True,
                "source_document_id": document_id,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })

    # Update or add confirmed medicines
    if req.medicines is not None:
        existing_meds = db.medicines.get(patient_id, [])
        db.medicines[patient_id] = [m for m in existing_meds if m.get("document_id") != document_id or m.get("confirmed")]

        now = datetime.datetime.now(datetime.timezone.utc)
        for med in req.medicines:
            fuzzy = fuzzy_match_medicine(med.name)
            final_name = fuzzy["standard_name"] if fuzzy["matched"] else med.name
            
            db.medicines[patient_id].append({
                "id": med.id or str(uuid.uuid4()),
                "document_id": document_id,
                "patient_id": patient_id,
                "name": final_name,
                "dose": med.dose,
                "frequency": med.frequency,
                "duration_days": med.duration_days,
                "start_date": now.strftime("%Y-%m-%d"),
                "end_date": (now + datetime.timedelta(days=med.duration_days)).strftime("%Y-%m-%d"),
                "instructions": med.instructions,
                "confidence": 1.0,
                "confirmed": True,
                "created_at": now.isoformat()
            })

    return {
        "status": "success",
        "message": "Data verified and saved to vault as Patient-confirmed."
    }

@router.get("/{document_id}/explain")
async def explain_document(
    document_id: str,
    language: str = "en",
    patient_id: str = Depends(get_current_patient_id)
):
    """Generate plain-language explanation in English, Hindi, Kannada, or Tamil"""
    doc = db.documents.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    lab_items = [item for item in db.lab_results.get(patient_id, []) if item.get("document_id") == document_id]
    medicine_items = [item for item in db.medicines.get(patient_id, []) if item.get("document_id") == document_id]

    data_payload = {
        "document_type": doc.get("type"),
        "date": doc.get("uploaded_at"),
        "labs": lab_items,
        "medicines": medicine_items
    }
    
    explanation = explain(data_payload, language=language)
    return explanation
