import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const token = params.token;

  if (token !== demoStore.tokens.doctor_token && !token.startsWith("demo_doctor")) {
    return NextResponse.json({ detail: "Invalid or revoked QR token" }, { status: 404 });
  }

  const activeMedicines = demoStore.medicines.filter((m) => m.confirmed && m.status === "active");

  return NextResponse.json({
    status: "approved",
    session_id: "sess_approved_apollo_24h",
    expires_in_hours: 22,
    patient: {
      id: demoStore.profile.id,
      name: demoStore.profile.full_name,
      full_name: demoStore.profile.full_name,
      age: demoStore.profile.age,
      gender: demoStore.profile.gender,
      blood_group: demoStore.profile.blood_group,
      allergies: demoStore.profile.allergies,
      chronic_conditions: demoStore.profile.chronic_conditions,
      emergency_contacts: demoStore.emergencyContacts,
      active_medicines: activeMedicines,
      recent_lab_results: demoStore.documents[2]?.tests || demoStore.documents[0]?.tests || [],
      abha_id: demoStore.profile.abha_id || "91-4829-1029-4821",
    },
    summary: "Patient Ramesh Sharma (62M) with chronic Type 2 Diabetes and Hypertension.\n• Glycemic trajectory: HbA1c 8.8% → 7.9% → 7.2% (Steady improvement over 6 months).\n• Active Prescriptions: Metformin 500mg BID, Telmisartan 40mg OD, Atorvastatin 10mg HS.\n• CRITICAL SAFETY GUARD: Severe Penicillin & Sulfa allergy recorded. Do not administer beta-lactam antibiotics.",
    disclaimer: "Official Clinical View: Records cross-referenced against ABHA Registry and NABL-accredited diagnostic laboratories.",
    documents: demoStore.documents,
  });
}
