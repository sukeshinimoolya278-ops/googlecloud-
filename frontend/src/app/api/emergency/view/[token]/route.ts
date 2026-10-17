import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const token = params.token;

  if (token !== demoStore.tokens.emergency_token && !token.startsWith("demo_emergency")) {
    return NextResponse.json({ detail: "Invalid or expired emergency link" }, { status: 404 });
  }

  const activeMedicines = demoStore.medicines.filter((m) => m.confirmed && m.status === "active");

  return NextResponse.json({
    status: "success",
    token: token,
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
    },
  });
}
