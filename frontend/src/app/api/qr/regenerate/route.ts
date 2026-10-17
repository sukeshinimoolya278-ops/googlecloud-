import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenType = searchParams.get("token_type") || "full";
  const randomSuffix = Math.random().toString(36).substring(2, 10);

  if (tokenType === "full") {
    demoStore.tokens.doctor_token = `demo_doctor_${randomSuffix}`;
  } else {
    demoStore.tokens.emergency_token = `demo_emergency_${randomSuffix}`;
  }

  demoStore.logs.unshift({
    id: `log-${Date.now()}`,
    patient_id: demoStore.profile.id,
    access_type: "token_regenerated",
    requester_label: `Revoked & Regenerated ${tokenType.toUpperCase()} QR Token`,
    ip_hash: "ip_user_action",
    user_agent: "Patient Browser",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    status: "success",
    message: `New ${tokenType} token generated`,
    tokens: demoStore.tokens,
  });
}
