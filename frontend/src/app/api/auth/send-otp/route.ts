import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = body?.phone || "";
    return NextResponse.json({
      status: "success",
      message: `OTP sent to ${phone}`,
      demo_mode: true,
      demo_hint: "Use fixed test OTP: 123456",
    });
  } catch {
    return NextResponse.json({
      status: "success",
      demo_mode: true,
      demo_hint: "Use fixed test OTP: 123456",
    });
  }
}
