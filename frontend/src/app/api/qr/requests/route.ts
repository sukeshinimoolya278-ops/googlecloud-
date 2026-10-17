import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET() {
  return NextResponse.json({
    requests: demoStore.requests,
  });
}
