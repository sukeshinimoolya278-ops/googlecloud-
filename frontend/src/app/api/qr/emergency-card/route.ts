import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { demoStore } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const targetUrl = `${baseUrl}/emergency/${demoStore.tokens.emergency_token}`;

    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 3,
      color: {
        dark: "#e11d48", // Rose red
        light: "#ffffff",
      },
    });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": 'attachment; filename="Emergency_Lockscreen_Card.svg"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
