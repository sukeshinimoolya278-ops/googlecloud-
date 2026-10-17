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

    // Check Aadhaar rule
    if (body.abha_id) {
      const digitsOnly = body.abha_id.replace(/\D/g, "");
      if (digitsOnly.length === 12) {
        return NextResponse.json(
          { detail: "Aadhaar numbers must never be collected or stored. Please enter a valid 14-digit ABHA ID." },
          { status: 400 }
        );
      }
      demoStore.profile.abha_id = body.abha_id.trim();
    }

    if (body.full_name) demoStore.profile.full_name = body.full_name.trim();
    if (body.dob) demoStore.profile.dob = body.dob;
    if (body.age !== undefined) demoStore.profile.age = Number(body.age);
    if (body.gender) demoStore.profile.gender = body.gender;
    if (body.blood_group) demoStore.profile.blood_group = body.blood_group;
    if (body.photo_url !== undefined) demoStore.profile.photo_url = body.photo_url;
    if (body.allergies && Array.isArray(body.allergies)) {
      demoStore.profile.allergies = body.allergies.map((a: string) => a.trim()).filter(Boolean);
    }
    if (body.chronic_conditions && Array.isArray(body.chronic_conditions)) {
      demoStore.profile.chronic_conditions = body.chronic_conditions.map((c: string) => c.trim()).filter(Boolean);
    }
    if (body.preferred_language) demoStore.profile.preferred_language = body.preferred_language;
    if (body.onboarding_completed !== undefined) {
      demoStore.profile.onboarding_completed = Boolean(body.onboarding_completed);
    }

    if (body.emergency_contacts && Array.isArray(body.emergency_contacts)) {
      demoStore.emergencyContacts = body.emergency_contacts.map((c: any, i: number) => ({
        id: c.id || `ec-${i + 1}`,
        patient_id: demoStore.profile.id,
        name: c.name ? c.name.trim() : "",
        relationship: c.relationship ? c.relationship.trim() : "Family",
        phone: c.phone ? c.phone.trim() : "",
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
