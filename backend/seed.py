import datetime
import secrets
import shutil
import sys
from pathlib import Path

# Ensure UTF-8 stdout encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.database import SessionLocal, Base, engine
from backend.models import (
    User, PatientProfile, Report, LabResult, Medicine,
    IntakeLog, QRToken, AccessRequest, AccessLog
)
from backend.config import settings

def seed_database():
    """Idempotently seed the SQLite database with demo data."""
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("[SEED] Starting database seeding...")

        # 1. Seed or find Demo Patient
        demo_patient = db.query(User).filter(User.phone == "+919876543210").first()
        if not demo_patient:
            demo_patient = User(
                role="patient",
                full_name="Rahul Sharma",
                email="patient@qrhealth.demo",
                phone="+919876543210",
                auth_provider="demo",
                firebase_uid="demo-patient-uid",
                preferred_language="en",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=60)
            )
            db.add(demo_patient)
            db.flush()
            print("  Created demo patient: Rahul Sharma")
        else:
            demo_patient.role = "patient"
            demo_patient.full_name = "Rahul Sharma"
            demo_patient.email = "patient@qrhealth.demo"
            demo_patient.auth_provider = "demo"
            print("  Demo patient already exists; updating fields.")

        # Patient Profile
        if not demo_patient.profile:
            patient_profile = PatientProfile(
                user_id=demo_patient.id,
                age=42,
                gender="male",
                blood_group="B+",
                allergies="Penicillin, Sulfa drugs",
                conditions="Type 2 Diabetes, Mild Hypertension",
                emergency_contact_name="Sunita Sharma",
                emergency_contact_phone="+919876543211",
                emergency_contact_relation="Spouse",
                emergency_enabled=True
            )
            db.add(patient_profile)
            print("  Created demo patient profile")
        else:
            demo_patient.profile.blood_group = "B+"
            demo_patient.profile.allergies = "Penicillin, Sulfa drugs"
            demo_patient.profile.conditions = "Type 2 Diabetes, Mild Hypertension"
            demo_patient.profile.emergency_contact_name = "Sunita Sharma"
            demo_patient.profile.emergency_contact_phone = "+919876543211"
            demo_patient.profile.emergency_contact_relation = "Spouse"
            demo_patient.profile.emergency_enabled = True

        # 2. Seed or find Demo Doctor
        demo_doctor = db.query(User).filter(User.phone == "+919876543220").first()
        if not demo_doctor:
            demo_doctor = User(
                role="doctor",
                full_name="Dr. Emily Peterson",
                email="doctor@qrhealth.demo",
                phone="+919876543220",
                auth_provider="demo",
                firebase_uid="demo-doctor-uid",
                preferred_language="en",
                doctor_reg_no="KMC-48291",
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=90)
            )
            db.add(demo_doctor)
            db.flush()
            print("  Created demo doctor: Dr. Emily Peterson")
        else:
            demo_doctor.role = "doctor"
            demo_doctor.full_name = "Dr. Emily Peterson"
            demo_doctor.doctor_reg_no = "KMC-48291"
            print("  Demo doctor already exists.")

        # 3. Seed QR Tokens for Demo Patient
        doc_token = db.query(QRToken).filter(QRToken.patient_id == demo_patient.id, QRToken.kind == "doctor").first()
        if not doc_token:
            doc_token = QRToken(
                patient_id=demo_patient.id,
                kind="doctor",
                token="demo_doctor_token_" + secrets.token_hex(16),
                is_active=True
            )
            db.add(doc_token)
            print("  Generated doctor QR token")

        emg_token = db.query(QRToken).filter(QRToken.patient_id == demo_patient.id, QRToken.kind == "emergency").first()
        if not emg_token:
            emg_token = QRToken(
                patient_id=demo_patient.id,
                kind="emergency",
                token="demo_emergency_token_" + secrets.token_hex(16),
                is_active=True
            )
            db.add(emg_token)
            print("  Generated emergency QR token")

        # 4. Copy demo files into uploads directory for persistent serving
        demo_files_dir = Path(__file__).resolve().parent.parent / "demo-files"
        upload_cbc_path = settings.UPLOADS_DIR / "sample_lab_report_cbc.txt"
        upload_lipid_path = settings.UPLOADS_DIR / "sample_lipid_profile.txt"
        upload_rx_path = settings.UPLOADS_DIR / "sample_prescription_cardiology.txt"

        if (demo_files_dir / "sample_lab_report_cbc.txt").exists():
            shutil.copy(demo_files_dir / "sample_lab_report_cbc.txt", upload_cbc_path)
        if (demo_files_dir / "sample_lipid_profile.txt").exists():
            shutil.copy(demo_files_dir / "sample_lipid_profile.txt", upload_lipid_path)
        if (demo_files_dir / "sample_prescription_cardiology.txt").exists():
            shutil.copy(demo_files_dir / "sample_prescription_cardiology.txt", upload_rx_path)

        # 5. Seed 2 Lab Reports (one with abnormal values)
        today = datetime.date.today()
        report_cbc = db.query(Report).filter(Report.patient_id == demo_patient.id, Report.original_name == "Complete_Blood_Count.pdf").first()
        if not report_cbc:
            report_cbc = Report(
                patient_id=demo_patient.id,
                category="lab",
                file_path=str(upload_cbc_path),
                original_name="Complete_Blood_Count.pdf",
                status="done",
                extracted_text="Hemoglobin: 11.2 g/dL, Fasting Blood Sugar: 148.0 mg/dL, WBC: 7500 cells/mcL, Platelets: 240000",
                explanation={
                    "en": "Your hemoglobin is 11.2 g/dL, which is slightly below normal (mild anemia). Fasting blood sugar is 148 mg/dL, which is elevated and indicates hyperglycemia. Your white blood cells and platelets are healthy.",
                    "hi": "आपका हीमोग्लोबिन 11.2 g/dL है जो सामान्य से थोड़ा कम है (हल्का एनीमिया)। उपवास रक्त शर्करा 148 mg/dL है जो बढ़ा हुआ है। आपकी श्वेत रक्त कोशिकाएं और प्लेटलेट्स सामान्य हैं।",
                    "kn": "ನಿಮ್ಮ ಹಿಮೋಗ್ಲೋಬಿನ್ 11.2 g/dL ಇದ್ದು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಸ್ವಲ್ಪ ಕಡಿಮೆಯಾಗಿದೆ. ರಕ್ತದಲ್ಲಿನ ಸಕ್ಕರೆ ಮಟ್ಟ 148 mg/dL ಇದ್ದು ಹೆಚ್ಚಾಗಿದೆ. ಇತರ ರಕ್ತ ಕಣಗಳು ಸಾಮಾನ್ಯವಾಗಿವೆ."
                },
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=12)
            )
            db.add(report_cbc)
            db.flush()

            # Lab results (abnormal values included)
            db.add_all([
                LabResult(
                    report_id=report_cbc.id,
                    test_name="Hemoglobin",
                    value=11.2,
                    unit="g/dL",
                    normal_min=13.0,
                    normal_max=17.0,
                    is_abnormal=True,
                    test_date=today - datetime.timedelta(days=12)
                ),
                LabResult(
                    report_id=report_cbc.id,
                    test_name="Fasting Blood Sugar",
                    value=148.0,
                    unit="mg/dL",
                    normal_min=70.0,
                    normal_max=100.0,
                    is_abnormal=True,
                    test_date=today - datetime.timedelta(days=12)
                ),
                LabResult(
                    report_id=report_cbc.id,
                    test_name="Total Leukocyte Count (WBC)",
                    value=7500.0,
                    unit="cells/mcL",
                    normal_min=4500.0,
                    normal_max=11000.0,
                    is_abnormal=False,
                    test_date=today - datetime.timedelta(days=12)
                ),
                LabResult(
                    report_id=report_cbc.id,
                    test_name="Platelet Count",
                    value=240000.0,
                    unit="cells/mcL",
                    normal_min=150000.0,
                    normal_max=450000.0,
                    is_abnormal=False,
                    test_date=today - datetime.timedelta(days=12)
                )
            ])
            print("  Created CBC lab report with abnormal values")

        report_lipid = db.query(Report).filter(Report.patient_id == demo_patient.id, Report.original_name == "Lipid_Profile_Panel.pdf").first()
        if not report_lipid:
            report_lipid = Report(
                patient_id=demo_patient.id,
                category="lab",
                file_path=str(upload_lipid_path),
                original_name="Lipid_Profile_Panel.pdf",
                status="done",
                extracted_text="Total Cholesterol: 185 mg/dL, Triglycerides: 142 mg/dL, HDL: 45 mg/dL",
                explanation={
                    "en": "All your lipid levels including total cholesterol and triglycerides are in the normal, healthy range.",
                    "hi": "कोलेस्ट्रॉल और ट्राइग्लिसराइड्स सहित आपके सभी लिपिड स्तर सामान्य और स्वस्थ सीमा में हैं।",
                    "kn": "ಕೊಲೆಸ್ಟ್ರಾಲ್ ಮತ್ತು ಟ್ರೈಗ್ಲಿಸರೈಡ್‌ಗಳು ಸೇರಿದಂತೆ ನಿಮ್ಮ ಎಲ್ಲಾ ಲಿಪಿಡ್ ಮಟ್ಟಗಳು ಸಾಮಾನ್ಯ ಮತ್ತು ಆರೋಗ್ಯಕರ ಮಿತಿಯಲ್ಲಿವೆ."
                },
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=35)
            )
            db.add(report_lipid)
            db.flush()

            db.add_all([
                LabResult(
                    report_id=report_lipid.id,
                    test_name="Total Cholesterol",
                    value=185.0,
                    unit="mg/dL",
                    normal_min=125.0,
                    normal_max=200.0,
                    is_abnormal=False,
                    test_date=today - datetime.timedelta(days=35)
                ),
                LabResult(
                    report_id=report_lipid.id,
                    test_name="Serum Triglycerides",
                    value=142.0,
                    unit="mg/dL",
                    normal_min=50.0,
                    normal_max=150.0,
                    is_abnormal=False,
                    test_date=today - datetime.timedelta(days=35)
                ),
                LabResult(
                    report_id=report_lipid.id,
                    test_name="HDL Cholesterol",
                    value=45.0,
                    unit="mg/dL",
                    normal_min=40.0,
                    normal_max=60.0,
                    is_abnormal=False,
                    test_date=today - datetime.timedelta(days=35)
                )
            ])
            print("  Created Lipid profile report with normal values")

        # 6. Seed 3 Medicines (2 active, 1 completed)
        existing_meds = db.query(Medicine).filter(Medicine.patient_id == demo_patient.id).all()
        if not existing_meds:
            med1 = Medicine(
                patient_id=demo_patient.id,
                name="Metformin",
                dose="500 mg",
                frequency="Twice daily",
                timing=["morning", "night"],
                food_instruction="after",
                doctor_name="Dr. Emily Peterson",
                start_date=today - datetime.timedelta(days=15),
                duration_days=90,
                status="active",
                plain_explanation="Helps lower and control blood sugar levels for diabetes management."
            )
            med2 = Medicine(
                patient_id=demo_patient.id,
                name="Amlodipine",
                dose="5 mg",
                frequency="Once daily",
                timing=["morning"],
                food_instruction="after",
                doctor_name="Dr. Emily Peterson",
                start_date=today - datetime.timedelta(days=10),
                duration_days=30,
                status="active",
                plain_explanation="Lowers blood pressure and protects your heart."
            )
            med3 = Medicine(
                patient_id=demo_patient.id,
                name="Azithromycin",
                dose="500 mg",
                frequency="Once daily",
                timing=["morning"],
                food_instruction="before",
                doctor_name="Dr. Rajesh Gupta",
                start_date=today - datetime.timedelta(days=45),
                duration_days=5,
                status="completed",
                plain_explanation="5-day antibiotic course for respiratory throat infection."
            )
            db.add_all([med1, med2, med3])
            db.flush()

            # Add today's intake log for active medicine
            db.add(IntakeLog(medicine_id=med1.id, taken_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=3)))
            print("  Created 3 seeded medicines (2 active, 1 completed) and intake log")

        db.commit()
        print("[SUCCESS] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
