import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET() {
  return NextResponse.json({
    profile: demoStore.profile,
    emergency_contacts: demoStore.emergencyContacts,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (body.full_name) demoStore.profile.full_name = body.full_name;
    if (body.age) demoStore.profile.age = Number(body.age);
    if (body.gender) demoStore.profile.gender = body.gender;
    if (body.blood_group) demoStore.profile.blood_group = body.blood_group;
    if (body.allergies) demoStore.profile.allergies = body.allergies;
    if (body.chronic_conditions) demoStore.profile.chronic_conditions = body.chronic_conditions;
    if (body.preferred_language) demoStore.profile.preferred_language = body.preferred_language;

    if (body.emergency_contacts && Array.isArray(body.emergency_contacts)) {
      demoStore.emergencyContacts = body.emergency_contacts.map((c: any, i: number) => ({
        id: c.id || `ec-${i + 1}`,
        patient_id: demoStore.profile.id,
        name: c.name || "",
        relationship: c.relationship || "Family",
        phone: c.phone || "",
        is_primary: Boolean(c.is_primary),
      }));
    }

    return NextResponse.json({
      status: "success",
      message: "Profile updated successfully",
      profile: demoStore.profile,
      emergency_contacts: demoStore.emergencyContacts,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to update profile" }, { status: 400 });
  }
}
