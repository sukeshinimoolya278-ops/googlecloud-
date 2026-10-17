import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const body = await request.json().catch(() => ({}));

    // Update email and verified methods
    if (body.email) {
      demoStore.profile.email = body.email;
      if (!demoStore.profile.verified_methods?.includes("google")) {
        demoStore.profile.verified_methods = [...(demoStore.profile.verified_methods || []), "google"];
      }
    }

    // Update phone and verified methods
    if (body.phone) {
      demoStore.profile.phone = body.phone;
      if (!demoStore.profile.verified_methods?.includes("phone")) {
        demoStore.profile.verified_methods = [...(demoStore.profile.verified_methods || []), "phone"];
      }
    }

    // Update name if provided
    if (body.name) {
      demoStore.profile.full_name = body.name;
    }

    return NextResponse.json({
      status: "success",
      uid: demoStore.profile.id,
      profile: demoStore.profile,
      emergency_contacts: demoStore.emergencyContacts,
      verified_provider: body.provider || "firebase",
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to sync session" }, { status: 400 });
  }
}
