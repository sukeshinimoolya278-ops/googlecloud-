import pytest
from sqlalchemy import inspect
from fastapi.testclient import TestClient
from backend.database import engine, SessionLocal, Base
from backend.models import (
    User, PatientProfile, Report, LabResult, Medicine,
    IntakeLog, QRToken, AccessRequest, AccessLog
)
from backend.seed import seed_database
from backend.main import app

def test_database_tables_exist():
    """Verify all 9 required tables from Section 6 exist in SQLite schema."""
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    required_tables = [
        "users",
        "patient_profiles",
        "reports",
        "lab_results",
        "medicines",
        "intake_log",
        "qr_tokens",
        "access_requests",
        "access_log"
    ]

    for table in required_tables:
        assert table in tables, f"Required table '{table}' is missing from database schema."

def test_seed_database_idempotency_and_data_integrity():
    """Verify seed script runs cleanly multiple times and populates required demo data."""
    # Run twice to test idempotency
    seed_database()
    seed_database()

    db = SessionLocal()
    try:
        # 1. Demo Patient Verification
        patient = db.query(User).filter(User.phone == "+919876543210").first()
        assert patient is not None
        assert patient.role == "patient"
        assert patient.full_name == "Rahul Sharma"
        assert patient.auth_provider == "demo"
        assert patient.profile is not None
        assert patient.profile.blood_group == "B+"
        assert patient.profile.emergency_enabled is True
        assert "Penicillin" in patient.profile.allergies

        # 2. Demo Doctor Verification
        doctor = db.query(User).filter(User.phone == "+919876543220").first()
        assert doctor is not None
        assert doctor.role == "doctor"
        assert doctor.doctor_reg_no == "KMC-48291"

        # 3. Reports & Lab Results Verification
        reports = db.query(Report).filter(Report.patient_id == patient.id).all()
        assert len(reports) >= 2

        # Check for abnormal lab results
        abnormal_results = (
            db.query(LabResult)
            .join(Report)
            .filter(Report.patient_id == patient.id, LabResult.is_abnormal.is_(True))
            .all()
        )
        assert len(abnormal_results) >= 2, "Expected at least 2 abnormal lab test results"
        test_names = [r.test_name for r in abnormal_results]
        assert "Hemoglobin" in test_names
        assert "Fasting Blood Sugar" in test_names

        # 4. Medicines Verification
        active_meds = db.query(Medicine).filter(Medicine.patient_id == patient.id, Medicine.status == "active").all()
        completed_meds = db.query(Medicine).filter(Medicine.patient_id == patient.id, Medicine.status == "completed").all()
        assert len(active_meds) == 2, f"Expected 2 active medicines, found {len(active_meds)}"
        assert len(completed_meds) == 1, f"Expected 1 completed medicine, found {len(completed_meds)}"

        # 5. QR Tokens Verification
        qr_doc = db.query(QRToken).filter(QRToken.patient_id == patient.id, QRToken.kind == "doctor").first()
        qr_emg = db.query(QRToken).filter(QRToken.patient_id == patient.id, QRToken.kind == "emergency").first()
        assert qr_doc is not None
        assert qr_emg is not None
        assert len(qr_doc.token) >= 32
        assert len(qr_emg.token) >= 32

        # 6. Intake Log Verification
        intake_entries = db.query(IntakeLog).all()
        assert len(intake_entries) >= 1
    finally:
        db.close()

def test_api_health_endpoint():
    """Verify FastAPI application boots and health endpoints return 200 OK."""
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "QR Health Vault API"
    assert data["status"] == "healthy"

    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"
