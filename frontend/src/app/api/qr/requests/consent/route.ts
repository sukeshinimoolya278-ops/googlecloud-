import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { request_id, action, duration_hours = 24 } = body;

    const reqItem = demoStore.requests.find((r) => r.id === request_id);
    if (reqItem) {
      reqItem.status = action;
      if (action === "approved") {
        reqItem.duration_hours = duration_hours;
        reqItem.approved_at = new Date().toISOString();
        reqItem.expires_at = new Date(Date.now() + duration_hours * 3600000).toISOString();
      }
    }

    demoStore.logs.unshift({
      id: `log-${Date.now()}`,
      patient_id: demoStore.profile.id,
      access_type: `consent_${action}`,
      requester_label: reqItem ? reqItem.requester_label : "Doctor Session",
      ip_hash: "ip_patient",
      user_agent: "Patient Browser",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      status: "success",
      message: `Request ${action} successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
