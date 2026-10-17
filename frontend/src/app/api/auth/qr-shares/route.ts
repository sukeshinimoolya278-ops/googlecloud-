import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET() {
  const shares = [
    {
      id: "share-1",
      token: demoStore.tokens.doctor_token,
      type: "full",
      label: "Apollo Emergency Dept (Dr. Mehta)",
      active: true,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      expires_at: new Date(Date.now() + 22 * 3600000).toISOString(),
    },
    {
      id: "share-2",
      token: demoStore.tokens.emergency_token,
      type: "emergency",
      label: "Emergency Lock Screen Link",
      active: true,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
    },
  ];

  return NextResponse.json({
    status: "success",
    shares,
  });
}
