import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const body = await request.json().catch(() => ({}));

    // If phone or email provided in body or claims, update verified methods
    if (body.phone && !demoStore.profile.phone) {
      demoStore.profile.phone = body.phone;
      if (!demoStore.profile.verified_methods?.includes("phone")) {
        demoStore.profile.verified_methods = [...(demoStore.profile.verified_methods || []), "phone"];
      }
    }
    if (body.email && !demoStore.profile.email) {
      demoStore.profile.email = body.email;
      if (!demoStore.profile.verified_methods?.includes("google")) {
        demoStore.profile.verified_methods = [...(demoStore.profile.verified_methods || []), "google"];
      }
    }
    if (body.name && (!demoStore.profile.full_name || demoStore.profile.full_name === "New Patient")) {
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
