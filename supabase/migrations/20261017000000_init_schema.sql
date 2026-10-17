-- ==============================================================================
-- QR HEALTH VAULT - DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous instances if needed (for fresh setup)
DROP TABLE IF EXISTS ai_summaries CASCADE;
DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS qr_tokens CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    age INT CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    chronic_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'kn', 'ta')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. EMERGENCY CONTACTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    phone TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lab_report', 'prescription', 'scan', 'other')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_patient_file_hash UNIQUE (patient_id, file_hash)
);

-- ------------------------------------------------------------------------------
-- 4. LAB RESULTS TABLE (AI Extracted & Patient Confirmed)
-- ------------------------------------------------------------------------------
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    normal_min NUMERIC,
    normal_max NUMERIC,
    flag TEXT CHECK (flag IN ('low', 'normal', 'high', 'critical_low', 'critical_high')),
    confidence NUMERIC DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    confirmed BOOLEAN DEFAULT FALSE,
    source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. MEDICINES TABLE (AI Extracted Prescriptions & Patient Confirmed)
-- ------------------------------------------------------------------------------
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration_days INT DEFAULT 5,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    instructions TEXT,
    confidence NUMERIC DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. QR TOKENS TABLE (Secure random token access)
-- ------------------------------------------------------------------------------
CREATE TABLE qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('full', 'emergency')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. ACCESS REQUESTS TABLE (Doctor QR Consent Flow)
-- ------------------------------------------------------------------------------
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES qr_tokens(id) ON DELETE CASCADE,
    requester_label TEXT DEFAULT 'Attending Doctor / Clinic',
    doctor_ip_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    duration_hours INT DEFAULT 24,
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. ACCESS LOGS TABLE (Audit log for patient visibility)
-- ------------------------------------------------------------------------------
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('doctor_view', 'emergency_view', 'consent_approval', 'revocation')),
    requester_label TEXT,
    ip_hash TEXT NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. AI SUMMARIES TABLE (Cached Multi-lingual Explanations)
-- ------------------------------------------------------------------------------
CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'kn', 'ta')),
    summary_type TEXT NOT NULL DEFAULT 'document' CHECK (summary_type IN ('document', 'comprehensive_doctor')),
    content TEXT NOT NULL,
    disclaimer TEXT DEFAULT 'This is for understanding only. Please consult your doctor.',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_documents_patient ON documents(patient_id, uploaded_at DESC);
CREATE INDEX idx_documents_hash ON documents(patient_id, file_hash);
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
CREATE INDEX idx_lab_results_doc ON lab_results(document_id);
CREATE INDEX idx_medicines_patient ON medicines(patient_id);
CREATE INDEX idx_medicines_active ON medicines(patient_id, end_date);
CREATE INDEX idx_qr_tokens_lookup ON qr_tokens(token) WHERE active = TRUE;
CREATE INDEX idx_access_requests_patient ON access_requests(patient_id, status);
CREATE INDEX idx_access_requests_expires ON access_requests(expires_at);
CREATE INDEX idx_access_logs_patient ON access_logs(patient_id, timestamp DESC);
CREATE INDEX idx_ai_summaries_lookup ON ai_summaries(patient_id, language, summary_type);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: Patient can read/update own profile
CREATE POLICY "Users can manage own profile"
    ON profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Emergency Contacts: Patient can manage own contacts
CREATE POLICY "Users can manage own emergency contacts"
    ON emergency_contacts FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Documents: Patient can manage own documents
CREATE POLICY "Users can manage own documents"
    ON documents FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Lab Results: Patient can manage own lab results
CREATE POLICY "Users can manage own lab results"
    ON lab_results FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Medicines: Patient can manage own medicines
CREATE POLICY "Users can manage own medicines"
    ON medicines FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- QR Tokens: Patient can manage own qr tokens
CREATE POLICY "Users can manage own qr tokens"
    ON qr_tokens FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Access Requests: Patient can view and update (approve/deny) own requests
CREATE POLICY "Users can view and update own access requests"
    ON access_requests FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Access Logs: Patient can view own access logs
CREATE POLICY "Users can view own access logs"
    ON access_logs FOR SELECT
    USING (auth.uid() = patient_id);

-- AI Summaries: Patient can read own summaries
CREATE POLICY "Users can read own ai summaries"
    ON ai_summaries FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- Service Role Bypass: The backend uses SUPABASE_SERVICE_ROLE_KEY to securely service
-- doctor QR tokens, emergency views, and background worker updates without compromising user RLS.
