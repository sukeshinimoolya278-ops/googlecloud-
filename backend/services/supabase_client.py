import os
import hashlib
import uuid
import datetime
from typing import Dict, Any, List, Optional
import httpx

# In-memory demo store preloaded with Ramesh Sharma seed data
DEMO_PATIENT_ID = "00000000-0000-0000-0000-000000000001"

class HealthVaultDB:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"

        # Local state storage
        self.profiles: Dict[str, Dict[str, Any]] = {}
        self.emergency_contacts: Dict[str, List[Dict[str, Any]]] = {}
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.lab_results: Dict[str, List[Dict[str, Any]]] = {}
        self.medicines: Dict[str, List[Dict[str, Any]]] = {}
        self.qr_tokens: Dict[str, Dict[str, Any]] = {}
        self.access_requests: Dict[str, Dict[str, Any]] = {}
        self.access_logs: List[Dict[str, Any]] = []
        self.ai_summaries: Dict[str, Dict[str, Any]] = {}

        self._seed_demo_state()

    def _seed_demo_state(self):
        """Seed initial patient state for Ramesh Sharma"""
        self.profiles[DEMO_PATIENT_ID] = {
            "id": DEMO_PATIENT_ID,
            "uid": DEMO_PATIENT_ID,
            "phone": "+919876543210",
            "email": "ramesh.sharma@example.com",
            "full_name": "Ramesh Sharma",
            "dob": "1964-04-12",
            "age": 62,
            "gender": "Male",
            "blood_group": "B+",
            "photo_url": "",
            "allergies": ["Penicillin", "Sulfa drugs"],
            "chronic_conditions": ["Type 2 Diabetes Mellitus", "Hypertension"],
            "preferred_language": "hi",
            "created_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=180)).isoformat(),
            "abha_id": "91-4829-1029-4821",
            "abha_address": "ramesh.sharma@abdm",
            "identity_status": "VERIFIED_GOVT_ID",
            "verified_via": "Aadhaar e-KYC & ABDM Registry",
            "verified_methods": ["phone", "google"],
            "onboarding_completed": True
        }

        self.emergency_contacts[DEMO_PATIENT_ID] = [
            {"id": str(uuid.uuid4()), "patient_id": DEMO_PATIENT_ID, "name": "Pooja Sharma (Daughter)", "relationship": "Daughter", "phone": "+919811122233", "is_primary": True},
            {"id": str(uuid.uuid4()), "patient_id": DEMO_PATIENT_ID, "name": "Dr. Arvind Verma (Physician)", "relationship": "Doctor", "phone": "+919822233344", "is_primary": False}
        ]

        # 3 Seed Lab Documents
        doc1_id = "11111111-1111-1111-1111-111111111101"
        doc2_id = "11111111-1111-1111-1111-111111111102"
        doc3_id = "11111111-1111-1111-1111-111111111103"
        rx1_id = "22222222-2222-2222-2222-222222222201"
        rx2_id = "22222222-2222-2222-2222-222222222202"

        now = datetime.datetime.now(datetime.timezone.utc)

        self.documents[doc1_id] = {
            "id": doc1_id, "patient_id": DEMO_PATIENT_ID, "type": "lab_report",
            "file_name": "Metropolis_HBA1C_Apr2026.pdf", "file_path": "demo/lab1.pdf",
            "file_hash": "seed_hash_doc1", "mime_type": "application/pdf", "size_bytes": 104200,
            "status": "ready", "uploaded_at": (now - datetime.timedelta(days=180)).isoformat()
        }
        self.documents[doc2_id] = {
            "id": doc2_id, "patient_id": DEMO_PATIENT_ID, "type": "lab_report",
            "file_name": "Apollo_Lipid_Sugar_Jul2026.pdf", "file_path": "demo/lab2.pdf",
            "file_hash": "seed_hash_doc2", "mime_type": "application/pdf", "size_bytes": 142300,
            "status": "ready", "uploaded_at": (now - datetime.timedelta(days=90)).isoformat()
        }
        self.documents[doc3_id] = {
            "id": doc3_id, "patient_id": DEMO_PATIENT_ID, "type": "lab_report",
            "file_name": "LalPath_Complete_Oct2026.pdf", "file_path": "demo/lab3.pdf",
            "file_hash": "seed_hash_doc3", "mime_type": "application/pdf", "size_bytes": 198000,
            "status": "ready", "uploaded_at": (now - datetime.timedelta(days=14)).isoformat()
        }
        self.documents[rx1_id] = {
            "id": rx1_id, "patient_id": DEMO_PATIENT_ID, "type": "prescription",
            "file_name": "Rx_DrKapoor_Cardiology_Jul2026.jpg", "file_path": "demo/rx1.jpg",
            "file_hash": "seed_hash_rx1", "mime_type": "image/jpeg", "size_bytes": 245000,
            "status": "ready", "uploaded_at": (now - datetime.timedelta(days=90)).isoformat()
        }
        self.documents[rx2_id] = {
            "id": rx2_id, "patient_id": DEMO_PATIENT_ID, "type": "prescription",
            "file_name": "Rx_DrVerma_Endocrine_Oct2026.jpg", "file_path": "demo/rx2.jpg",
            "file_hash": "seed_hash_rx2", "mime_type": "image/jpeg", "size_bytes": 312000,
            "status": "ready", "uploaded_at": (now - datetime.timedelta(days=10)).isoformat()
        }

        # Lab results
        self.lab_results[DEMO_PATIENT_ID] = [
            # 6 months ago
            {"id": str(uuid.uuid4()), "document_id": doc1_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Fasting Blood Sugar", "value": 188.0, "unit": "mg/dL", "normal_min": 70, "normal_max": 99, "flag": "high", "confidence": 0.98, "confirmed": True, "created_at": (now - datetime.timedelta(days=180)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc1_id, "patient_id": DEMO_PATIENT_ID, "test_name": "HbA1c", "value": 8.8, "unit": "%", "normal_min": 4.0, "normal_max": 5.6, "flag": "high", "confidence": 0.99, "confirmed": True, "created_at": (now - datetime.timedelta(days=180)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc1_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Total Cholesterol", "value": 235.0, "unit": "mg/dL", "normal_min": 125, "normal_max": 200, "flag": "high", "confidence": 0.96, "confirmed": True, "created_at": (now - datetime.timedelta(days=180)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc1_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Hemoglobin", "value": 13.8, "unit": "g/dL", "normal_min": 13, "normal_max": 17, "flag": "normal", "confidence": 0.98, "confirmed": True, "created_at": (now - datetime.timedelta(days=180)).isoformat()},

            # 3 months ago
            {"id": str(uuid.uuid4()), "document_id": doc2_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Fasting Blood Sugar", "value": 152.0, "unit": "mg/dL", "normal_min": 70, "normal_max": 99, "flag": "high", "confidence": 0.97, "confirmed": True, "created_at": (now - datetime.timedelta(days=90)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc2_id, "patient_id": DEMO_PATIENT_ID, "test_name": "HbA1c", "value": 7.9, "unit": "%", "normal_min": 4.0, "normal_max": 5.6, "flag": "high", "confidence": 0.98, "confirmed": True, "created_at": (now - datetime.timedelta(days=90)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc2_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Total Cholesterol", "value": 210.0, "unit": "mg/dL", "normal_min": 125, "normal_max": 200, "flag": "high", "confidence": 0.95, "confirmed": True, "created_at": (now - datetime.timedelta(days=90)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc2_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Hemoglobin", "value": 14.1, "unit": "g/dL", "normal_min": 13, "normal_max": 17, "flag": "normal", "confidence": 0.99, "confirmed": True, "created_at": (now - datetime.timedelta(days=90)).isoformat()},

            # Recent (14 days ago)
            {"id": str(uuid.uuid4()), "document_id": doc3_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Fasting Blood Sugar", "value": 128.0, "unit": "mg/dL", "normal_min": 70, "normal_max": 99, "flag": "high", "confidence": 0.99, "confirmed": True, "created_at": (now - datetime.timedelta(days=14)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc3_id, "patient_id": DEMO_PATIENT_ID, "test_name": "HbA1c", "value": 7.2, "unit": "%", "normal_min": 4.0, "normal_max": 5.6, "flag": "high", "confidence": 0.99, "confirmed": True, "created_at": (now - datetime.timedelta(days=14)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc3_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Total Cholesterol", "value": 185.0, "unit": "mg/dL", "normal_min": 125, "normal_max": 200, "flag": "normal", "confidence": 0.97, "confirmed": True, "created_at": (now - datetime.timedelta(days=14)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc3_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Serum Creatinine", "value": 1.05, "unit": "mg/dL", "normal_min": 0.7, "normal_max": 1.3, "flag": "normal", "confidence": 0.98, "confirmed": True, "created_at": (now - datetime.timedelta(days=14)).isoformat()},
            {"id": str(uuid.uuid4()), "document_id": doc3_id, "patient_id": DEMO_PATIENT_ID, "test_name": "Hemoglobin", "value": 14.2, "unit": "g/dL", "normal_min": 13, "normal_max": 17, "flag": "normal", "confidence": 0.99, "confirmed": True, "created_at": (now - datetime.timedelta(days=14)).isoformat()}
        ]

        # Medicines
        self.medicines[DEMO_PATIENT_ID] = [
            # Past medicine
            {
                "id": str(uuid.uuid4()), "document_id": rx1_id, "patient_id": DEMO_PATIENT_ID,
                "name": "Azithromycin", "dose": "500mg", "frequency": "Once daily", "duration_days": 5,
                "start_date": (now - datetime.timedelta(days=85)).strftime("%Y-%m-%d"),
                "end_date": (now - datetime.timedelta(days=80)).strftime("%Y-%m-%d"),
                "instructions": "Take after lunch for 5 days only", "confidence": 0.98, "confirmed": True
            },
            # Active medicines
            {
                "id": str(uuid.uuid4()), "document_id": rx2_id, "patient_id": DEMO_PATIENT_ID,
                "name": "Metformin (Glycomet SR)", "dose": "500mg", "frequency": "Twice daily", "duration_days": 90,
                "start_date": (now - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
                "end_date": (now + datetime.timedelta(days=80)).strftime("%Y-%m-%d"),
                "instructions": "Take with meals morning and night", "confidence": 0.99, "confirmed": True
            },
            {
                "id": str(uuid.uuid4()), "document_id": rx2_id, "patient_id": DEMO_PATIENT_ID,
                "name": "Telmisartan (Telma)", "dose": "40mg", "frequency": "Once daily", "duration_days": 90,
                "start_date": (now - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
                "end_date": (now + datetime.timedelta(days=80)).strftime("%Y-%m-%d"),
                "instructions": "Take empty stomach in morning", "confidence": 0.97, "confirmed": True
            },
            {
                "id": str(uuid.uuid4()), "document_id": rx2_id, "patient_id": DEMO_PATIENT_ID,
                "name": "Atorvastatin (Atorva)", "dose": "10mg", "frequency": "Once daily at bedtime", "duration_days": 90,
                "start_date": (now - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
                "end_date": (now + datetime.timedelta(days=80)).strftime("%Y-%m-%d"),
                "instructions": "Night after dinner", "confidence": 0.99, "confirmed": True
            }
        ]

        # QR Tokens
        full_token = "demo_doctor_vault_token_987654"
        emerg_token = "demo_emergency_token_123456"

        self.qr_tokens[full_token] = {
            "id": str(uuid.uuid4()), "patient_id": DEMO_PATIENT_ID,
            "token": full_token, "type": "full", "active": True
        }
        self.qr_tokens[emerg_token] = {
            "id": str(uuid.uuid4()), "patient_id": DEMO_PATIENT_ID,
            "token": emerg_token, "type": "emergency", "active": True
        }

        # Access request
        req_id = "req_demo_apollo_99"
        self.access_requests[req_id] = {
            "id": req_id, "patient_id": DEMO_PATIENT_ID, "token": full_token,
            "requester_label": "Apollo Emergency Dept (Dr. Mehta)",
            "status": "approved", "duration_hours": 24,
            "approved_at": (now - datetime.timedelta(hours=2)).isoformat(),
            "expires_at": (now + datetime.timedelta(hours=22)).isoformat()
        }

        # Access logs
        self.access_logs = [
            {"id": str(uuid.uuid4()), "patient_id": DEMO_PATIENT_ID, "access_type": "emergency_view", "requester_label": "Lock Screen Emergency Scan", "ip_hash": "ip_hash_abc_1", "user_agent": "Mobile Safari", "timestamp": (now - datetime.timedelta(days=3)).isoformat()},
            {"id": str(uuid.uuid4()), "patient_id": DEMO_PATIENT_ID, "access_type": "doctor_view", "requester_label": "Apollo Emergency Dept (Dr. Mehta)", "ip_hash": "ip_hash_xyz_2", "user_agent": "Chrome Desktop", "timestamp": (now - datetime.timedelta(hours=2)).isoformat()}
        ]

    def get_or_create_user(self, uid: str, phone: Optional[str] = None, email: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        """Fetch existing user record or create a fresh one on first login"""
        if uid in self.profiles:
            profile = self.profiles[uid]
            # Update phone/email if new and verified
            if phone and not profile.get("phone"):
                profile["phone"] = phone
                if "phone" not in profile.get("verified_methods", []):
                    profile.setdefault("verified_methods", []).append("phone")
            if email and not profile.get("email"):
                profile["email"] = email
                if "google" not in profile.get("verified_methods", []):
                    profile.setdefault("verified_methods", []).append("google")
            if name and (not profile.get("full_name") or profile.get("full_name") == "New Patient"):
                profile["full_name"] = name
            return profile

        # Create new profile
        verified_methods = []
        if phone:
            verified_methods.append("phone")
        if email:
            verified_methods.append("google")

        new_profile = {
            "id": uid,
            "uid": uid,
            "phone": phone or "",
            "email": email or "",
            "full_name": name or "New Patient",
            "dob": "",
            "age": 0,
            "gender": "Prefer not to say",
            "blood_group": "Unknown",
            "photo_url": "",
            "allergies": [],
            "chronic_conditions": [],
            "preferred_language": "en",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "abha_id": "",
            "abha_address": "",
            "identity_status": "PENDING_VERIFICATION",
            "verified_via": "Self-Declared",
            "verified_methods": verified_methods,
            "onboarding_completed": False
        }
        self.profiles[uid] = new_profile
        self.emergency_contacts[uid] = []
        return new_profile

    def get_active_shares(self, uid: str) -> List[Dict[str, Any]]:
        """Get all active QR share sessions for this user"""
        shares = []
        now = datetime.datetime.now(datetime.timezone.utc)
        for token, record in self.qr_tokens.items():
            if record.get("patient_id") == uid and record.get("active", True):
                # Check if access request exists with expiration
                expires_at = None
                label = "Doctor Scan Access" if record.get("type") == "full" else "Emergency Lock Screen Link"
                for req in self.access_requests.values():
                    if req.get("token") == token:
                        expires_at = req.get("expires_at")
                        label = req.get("requester_label", label)
                        break
                shares.append({
                    "id": record.get("id"),
                    "token": token,
                    "type": record.get("type"),
                    "label": label,
                    "active": True,
                    "expires_at": expires_at or (now + datetime.timedelta(days=7)).isoformat(),
                    "created_at": record.get("created_at", now.isoformat())
                })
        return shares

    def revoke_share(self, uid: str, token: str) -> bool:
        """Revoke an active QR share session"""
        found = False
        if token in self.qr_tokens and self.qr_tokens[token].get("patient_id") == uid:
            self.qr_tokens[token]["active"] = False
            found = True
        for req in self.access_requests.values():
            if req.get("token") == token and req.get("patient_id") == uid:
                req["status"] = "revoked"
                found = True
        return found

    def delete_user_data(self, uid: str) -> bool:
        """Danger Zone: Wipe all data associated with a user UID"""
        if uid in self.profiles:
            del self.profiles[uid]
        if uid in self.emergency_contacts:
            del self.emergency_contacts[uid]
        # Delete docs
        doc_ids_to_del = [k for k, v in self.documents.items() if v.get("patient_id") == uid]
        for d in doc_ids_to_del:
            del self.documents[d]
        # Delete medicines
        if uid in self.medicines:
            del self.medicines[uid]
        # Delete QR tokens
        tokens_to_del = [k for k, v in self.qr_tokens.items() if v.get("patient_id") == uid]
        for t in tokens_to_del:
            del self.qr_tokens[t]
        # Delete requests
        req_to_del = [k for k, v in self.access_requests.items() if v.get("patient_id") == uid]
        for r in req_to_del:
            del self.access_requests[r]
        return True

# Global DB instance
db = HealthVaultDB()

