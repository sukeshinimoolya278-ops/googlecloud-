// Global in-memory mock store for standalone Next.js deployment on Vercel

export interface EmergencyContact {
  id?: string;
  patient_id?: string;
  name: string;
  relationship: string;
  phone: string;
  is_primary?: boolean;
}

export interface Profile {
  id: string;
  uid?: string;
  phone: string;
  email?: string;
  full_name: string;
  dob?: string;
  age: number;
  gender: string;
  blood_group: string;
  photo_url?: string;
  allergies: string[];
  chronic_conditions: string[];
  preferred_language: string;
  created_at: string;
  abha_id?: string;
  abha_address?: string;
  identity_status?: string;
  verified_via?: string;
  verified_methods?: string[];
  onboarding_completed?: boolean;
}

export interface ClinicalDocument {
  id: string;
  patient_id: string;
  type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
  issuing_entity?: string;
  accreditation?: string;
  lab_license?: string;
  patient_match_score?: string;
  authenticity_status?: string;
  cryptographic_hash?: string;
  digital_signature?: string;
  tests?: {
    name: string;
    value: number;
    unit: string;
    normal_min?: number;
    normal_max?: number;
    flag?: string;
  }[];
}

export const DEMO_PATIENT_ID = "00000000-0000-0000-0000-000000000001";

const now = new Date();

export const demoStore = {
  profile: {
    id: DEMO_PATIENT_ID,
    uid: DEMO_PATIENT_ID,
    phone: "+919876543210",
    email: "ramesh.sharma@example.com",
    full_name: "Ramesh Sharma",
    dob: "1964-04-12",
    age: 62,
    gender: "Male",
    blood_group: "B+",
    photo_url: "",
    allergies: ["Penicillin", "Sulfa drugs"],
    chronic_conditions: ["Type 2 Diabetes Mellitus", "Hypertension"],
    preferred_language: "hi",
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    abha_id: "91-4829-1029-4821",
    abha_address: "ramesh.sharma@abdm",
    identity_status: "VERIFIED_GOVT_ID",
    verified_via: "Aadhaar e-KYC & ABDM Registry",
    verified_methods: ["phone", "google"],
    onboarding_completed: true,
  } as Profile,

  emergencyContacts: [
    {
      id: "ec-1",
      patient_id: DEMO_PATIENT_ID,
      name: "Pooja Sharma (Daughter)",
      relationship: "Daughter",
      phone: "+919811122233",
      is_primary: true,
    },
    {
      id: "ec-2",
      patient_id: DEMO_PATIENT_ID,
      name: "Dr. Arvind Verma (Physician)",
      relationship: "Doctor",
      phone: "+919822233344",
      is_primary: false,
    },
  ] as EmergencyContact[],

  tokens: {
    doctor_token: "demo_doctor_vault_token_987654",
    emergency_token: "demo_emergency_token_123456",
  },

  requests: [
    {
      id: "req_demo_apollo_99",
      patient_id: DEMO_PATIENT_ID,
      token: "demo_doctor_vault_token_987654",
      requester_label: "Apollo Emergency Dept (Dr. Mehta)",
      status: "approved",
      duration_hours: 24,
      approved_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      expires_at: new Date(Date.now() + 22 * 3600000).toISOString(),
    },
  ],

  logs: [
    {
      id: "log-1",
      patient_id: DEMO_PATIENT_ID,
      access_type: "emergency_view",
      requester_label: "Lock Screen Emergency Scan",
      ip_hash: "ip_hash_abc_1",
      user_agent: "Mobile Safari",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "log-2",
      patient_id: DEMO_PATIENT_ID,
      access_type: "doctor_view",
      requester_label: "Apollo Emergency Dept (Dr. Mehta)",
      ip_hash: "ip_hash_xyz_2",
      user_agent: "Chrome Desktop",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
  ],

  medicines: [
    {
      id: "med-1",
      patient_id: DEMO_PATIENT_ID,
      name: "Azithromycin",
      dose: "500mg",
      frequency: "Once daily",
      duration_days: 5,
      start_date: new Date(Date.now() - 85 * 86400000).toISOString().split("T")[0],
      end_date: new Date(Date.now() - 80 * 86400000).toISOString().split("T")[0],
      instructions: "Take after lunch for 5 days only",
      confidence: 0.98,
      confirmed: true,
      status: "completed",
    },
    {
      id: "med-2",
      patient_id: DEMO_PATIENT_ID,
      name: "Metformin (Glycomet SR)",
      dose: "500mg",
      frequency: "Twice daily",
      duration_days: 90,
      start_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      end_date: new Date(Date.now() + 80 * 86400000).toISOString().split("T")[0],
      instructions: "Take with meals morning and night",
      confidence: 0.99,
      confirmed: true,
      status: "active",
    },
    {
      id: "med-3",
      patient_id: DEMO_PATIENT_ID,
      name: "Telmisartan (Telma)",
      dose: "40mg",
      frequency: "Once daily",
      duration_days: 90,
      start_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      end_date: new Date(Date.now() + 80 * 86400000).toISOString().split("T")[0],
      instructions: "Take empty stomach in morning",
      confidence: 0.97,
      confirmed: true,
      status: "active",
    },
    {
      id: "med-4",
      patient_id: DEMO_PATIENT_ID,
      name: "Atorvastatin (Atorva)",
      dose: "10mg",
      frequency: "Once daily at bedtime",
      duration_days: 90,
      start_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      end_date: new Date(Date.now() + 80 * 86400000).toISOString().split("T")[0],
      instructions: "Night after dinner",
      confidence: 0.99,
      confirmed: true,
      status: "active",
    },
  ],

  documents: [
    {
      id: "doc-1",
      patient_id: DEMO_PATIENT_ID,
      type: "lab_report",
      file_name: "Metropolis_HBA1C_Apr2026.pdf",
      status: "ready",
      uploaded_at: new Date(Date.now() - 180 * 86400000).toISOString(),
      issuing_entity: "Metropolis Healthcare Ltd.",
      accreditation: "NABL Accredited (Cert #MC-2491) & CAP Certified",
      lab_license: "DL-MET-2024-9981",
      patient_match_score: "99.8% (Matched with ABHA 91-4829-1029-4821)",
      authenticity_status: "OFFICIAL_VERIFIED",
      cryptographic_hash: "sha256_e7f86dda8f744fbbaff20ddf2c94892e",
      digital_signature: "Digitally Signed by Dr. K. Ramanathan, MD (Pathology)",
      tests: [
        { name: "Fasting Blood Sugar", value: 188.0, unit: "mg/dL", normal_min: 70, normal_max: 99, flag: "high" },
        { name: "HbA1c", value: 8.8, unit: "%", normal_min: 4.0, normal_max: 5.6, flag: "high" },
        { name: "Total Cholesterol", value: 235.0, unit: "mg/dL", normal_min: 125, normal_max: 200, flag: "high" },
        { name: "Hemoglobin", value: 13.8, unit: "g/dL", normal_min: 13, normal_max: 17, flag: "normal" },
      ],
    },
    {
      id: "doc-2",
      patient_id: DEMO_PATIENT_ID,
      type: "lab_report",
      file_name: "Apollo_Lipid_Sugar_Jul2026.pdf",
      status: "ready",
      uploaded_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      issuing_entity: "Apollo Diagnostics Lab",
      accreditation: "NABL Accredited (Cert #MC-1802)",
      lab_license: "DL-APO-2023-4412",
      patient_match_score: "99.6% (Matched with ABHA 91-4829-1029-4821)",
      authenticity_status: "OFFICIAL_VERIFIED",
      cryptographic_hash: "sha256_6a4f44e3194c4fce9d85dc2557831a03",
      digital_signature: "Digitally Signed by Dr. Shreya Sen, MD (Biochemistry)",
      tests: [
        { name: "Fasting Blood Sugar", value: 152.0, unit: "mg/dL", normal_min: 70, normal_max: 99, flag: "high" },
        { name: "HbA1c", value: 7.9, unit: "%", normal_min: 4.0, normal_max: 5.6, flag: "high" },
        { name: "Total Cholesterol", value: 210.0, unit: "mg/dL", normal_min: 125, normal_max: 200, flag: "high" },
        { name: "Hemoglobin", value: 14.1, unit: "g/dL", normal_min: 13, normal_max: 17, flag: "normal" },
      ],
    },
    {
      id: "doc-3",
      patient_id: DEMO_PATIENT_ID,
      type: "lab_report",
      file_name: "LalPath_Complete_Oct2026.pdf",
      status: "ready",
      uploaded_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      issuing_entity: "Dr. Lal PathLabs",
      accreditation: "NABL Accredited (Cert #MC-3104) & ISO 15189",
      lab_license: "DL-LAL-2025-1109",
      patient_match_score: "99.9% (Matched with ABHA 91-4829-1029-4821)",
      authenticity_status: "OFFICIAL_VERIFIED",
      cryptographic_hash: "sha256_1ee38b900ed741fba321f01c6360c346",
      digital_signature: "Digitally Signed by Dr. Sunita Rao, MD (Pathology)",
      tests: [
        { name: "Fasting Blood Sugar", value: 128.0, unit: "mg/dL", normal_min: 70, normal_max: 99, flag: "high" },
        { name: "HbA1c", value: 7.2, unit: "%", normal_min: 4.0, normal_max: 5.6, flag: "high" },
        { name: "Total Cholesterol", value: 185.0, unit: "mg/dL", normal_min: 125, normal_max: 200, flag: "normal" },
        { name: "Serum Creatinine", value: 1.05, unit: "mg/dL", normal_min: 0.7, normal_max: 1.3, flag: "normal" },
        { name: "Hemoglobin", value: 14.2, unit: "g/dL", normal_min: 13, normal_max: 17, flag: "normal" },
      ],
    },
  ] as ClinicalDocument[],
};
