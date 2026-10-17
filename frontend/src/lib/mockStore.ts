// Global in-memory mock store for standalone Next.js deployment on Vercel

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  is_primary: boolean;
}

export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  age: number;
  gender: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  preferred_language: string;
  created_at: string;
}

export const DEMO_PATIENT_ID = "00000000-0000-0000-0000-000000000001";

const now = new Date();

export const demoStore = {
  profile: {
    id: DEMO_PATIENT_ID,
    phone: "+919876543210",
    full_name: "Ramesh Sharma",
    age: 62,
    gender: "Male",
    blood_group: "B+",
    allergies: ["Penicillin", "Sulfa drugs"],
    chronic_conditions: ["Type 2 Diabetes Mellitus", "Hypertension"],
    preferred_language: "hi",
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
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
      tests: [
        { name: "Fasting Blood Sugar", value: 128.0, unit: "mg/dL", normal_min: 70, normal_max: 99, flag: "high" },
        { name: "HbA1c", value: 7.2, unit: "%", normal_min: 4.0, normal_max: 5.6, flag: "high" },
        { name: "Total Cholesterol", value: 185.0, unit: "mg/dL", normal_min: 125, normal_max: 200, flag: "normal" },
        { name: "Serum Creatinine", value: 1.05, unit: "mg/dL", normal_min: 0.7, normal_max: 1.3, flag: "normal" },
        { name: "Hemoglobin", value: 14.2, unit: "g/dL", normal_min: 13, normal_max: 17, flag: "normal" },
      ],
    },
  ],
};
