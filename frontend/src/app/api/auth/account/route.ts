import { NextResponse } from "next/server";
import { demoStore, DEMO_PATIENT_ID } from "@/lib/mockStore";

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.confirm) {
      return NextResponse.json(
        { detail: "Account deletion requires explicit confirmation." },
        { status: 400 }
      );
    }

    // Reset profile to blank state
    demoStore.profile = {
      id: DEMO_PATIENT_ID,
      uid: DEMO_PATIENT_ID,
      phone: "",
      email: "",
      full_name: "New Patient",
      age: 0,
      gender: "Prefer not to say",
      blood_group: "Unknown",
      allergies: [],
      chronic_conditions: [],
      preferred_language: "en",
      created_at: new Date().toISOString(),
      onboarding_completed: false,
    };
    demoStore.emergencyContacts = [];
    demoStore.documents = [];

    return NextResponse.json({
      status: "success",
      message: "Your account and all associated health records have been permanently deleted.",
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to delete account" }, { status: 400 });
  }
}
