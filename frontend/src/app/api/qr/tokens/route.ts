import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return NextResponse.json({
    doctor_token: demoStore.tokens.doctor_token,
    emergency_token: demoStore.tokens.emergency_token,
    doctor_url: `${baseUrl}/doctor/${demoStore.tokens.doctor_token}`,
    emergency_url: `${baseUrl}/emergency/${demoStore.tokens.emergency_token}`,
    doctor_qr_image: "/api/qr/image/full",
    emergency_qr_image: "/api/qr/image/emergency",
  });
}
