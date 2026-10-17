import { NextResponse } from "next/server";
import { demoStore, DEMO_PATIENT_ID } from "@/lib/mockStore";

export async function POST() {
  return NextResponse.json({
    status: "success",
    token: "demo_jwt_token_123456",
    patient_id: DEMO_PATIENT_ID,
    profile: demoStore.profile,
  });
}
