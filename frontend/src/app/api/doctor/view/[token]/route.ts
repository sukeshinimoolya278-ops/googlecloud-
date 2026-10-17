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
      full_name: demoStore.profile.full_name,
      age: demoStore.profile.age,
      gender: demoStore.profile.gender,
      blood_group: demoStore.profile.blood_group,
      allergies: demoStore.profile.allergies,
      chronic_conditions: demoStore.profile.chronic_conditions,
      emergency_contacts: demoStore.emergencyContacts,
      active_medicines: activeMedicines,
      recent_lab_results: demoStore.documents[2]?.tests || demoStore.documents[0]?.tests || [],
    },
    documents: demoStore.documents,
  });
}
