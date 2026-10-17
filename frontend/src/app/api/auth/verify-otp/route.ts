import { NextResponse } from "next/server";
import { demoStore, DEMO_PATIENT_ID } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const otp = body?.otp?.trim();

    if (otp === "123456") {
      return NextResponse.json({
        status: "success",
        token: "demo_jwt_token_123456",
        patient_id: DEMO_PATIENT_ID,
        profile: demoStore.profile,
      });
    }

    return NextResponse.json(
      { detail: "Invalid OTP code. Please enter 123456 in Demo Mode." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { detail: "Failed to verify OTP." },
      { status: 400 }
    );
  }
}
