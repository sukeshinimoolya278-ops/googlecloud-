import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text,
    DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(20), nullable=False, default="patient")  # 'patient' | 'doctor'
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, unique=True, index=True)
    auth_provider = Column(String(50), nullable=False, default="demo")  # 'google' | 'phone' | 'demo'
    firebase_uid = Column(String(128), nullable=True, unique=True, index=True)
    preferred_language = Column(String(10), nullable=False, default="en")  # 'en' | 'hi' | 'kn'
    doctor_reg_no = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="patient", foreign_keys="Report.patient_id", cascade="all, delete-orphan")
    medicines = relationship("Medicine", back_populates="patient", cascade="all, delete-orphan")
    qr_tokens = relationship("QRToken", back_populates="patient", cascade="all, delete-orphan")
    patient_access_requests = relationship("AccessRequest", back_populates="patient", foreign_keys="AccessRequest.patient_id")
    doctor_access_requests = relationship("AccessRequest", back_populates="doctor", foreign_keys="AccessRequest.doctor_id")
    access_logs = relationship("AccessLog", back_populates="patient", foreign_keys="AccessLog.patient_id")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)  # 'male' | 'female' | 'other'
    blood_group = Column(String(10), nullable=True)  # e.g. 'O+', 'B+', 'A+'
    allergies = Column(Text, nullable=True)  # comma-separated or description
    conditions = Column(Text, nullable=True)  # known chronic conditions
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)
    emergency_enabled = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="profile")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="other")  # 'prescription' | 'lab' | 'scan' | 'other'
    file_path = Column(String(500), nullable=False)
    original_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="processing")  # 'processing' | 'done' | 'failed'
    error_message = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)
    explanation = Column(JSON, nullable=True)  # {"en": "...", "hi": "...", "kn": "..."}
    created_at = Column(DateTime, default=utc_now, nullable=False)

    patient = relationship("User", back_populates="reports", foreign_keys=[patient_id])
    lab_results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")
    medicines = relationship("Medicine", back_populates="report")


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    test_name = Column(String(255), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False, default="")
    normal_min = Column(Float, nullable=False, default=0.0)
    normal_max = Column(Float, nullable=False, default=0.0)
    is_abnormal = Column(Boolean, nullable=False, default=False)
    test_date = Column(Date, nullable=False)

    report = relationship("Report", back_populates="lab_results")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    dose = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    timing = Column(JSON, nullable=False, default=list)  # ["morning", "afternoon", "night"]
    food_instruction = Column(String(20), nullable=False, default="after")  # 'before' | 'after' | 'any'
    doctor_name = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=False)
    duration_days = Column(Integer, nullable=False, default=7)
    status = Column(String(20), nullable=False, default="active")  # 'active' | 'stopped' | 'completed'
    plain_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    patient = relationship("User", back_populates="medicines")
    report = relationship("Report", back_populates="medicines")
    intake_logs = relationship("IntakeLog", back_populates="medicine", cascade="all, delete-orphan")


class IntakeLog(Base):
    __tablename__ = "intake_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    taken_at = Column(DateTime, default=utc_now, nullable=False)

    medicine = relationship("Medicine", back_populates="intake_logs")


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(20), nullable=False)  # 'doctor' | 'emergency'
    token = Column(String(128), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    patient = relationship("User", back_populates="qr_tokens")


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # 'pending' | 'approved' | 'declined' | 'expired'
    requested_at = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    patient = relationship("User", back_populates="patient_access_requests", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="doctor_access_requests", foreign_keys=[doctor_id])


class AccessLog(Base):
    __tablename__ = "access_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(255), nullable=False)  # e.g., 'view_summary', 'view_reports', 'emergency_access'
    created_at = Column(DateTime, default=utc_now, nullable=False)

    patient = relationship("User", back_populates="access_logs", foreign_keys=[patient_id])
