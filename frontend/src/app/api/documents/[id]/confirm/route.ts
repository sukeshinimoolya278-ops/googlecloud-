import { NextResponse } from "next/server";
import { demoStore, DEMO_PATIENT_ID } from "@/lib/mockStore";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const docId = params.id;

    if (body.lab_tests && Array.isArray(body.lab_tests)) {
      const doc = demoStore.documents.find((d) => d.id === docId);
      if (doc) {
        doc.tests = body.lab_tests;
      }
    }

    if (body.medicines && Array.isArray(body.medicines)) {
      for (const m of body.medicines) {
        demoStore.medicines.unshift({
          id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          patient_id: DEMO_PATIENT_ID,
          name: m.name,
          dose: m.dose || "500mg",
          frequency: m.frequency || "Once daily",
          duration_days: m.duration_days || 5,
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + (m.duration_days || 5) * 86400000).toISOString().split("T")[0],
          instructions: m.instructions || "Take with meals",
          confidence: 1.0,
          confirmed: true,
          status: "active",
        });
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Data verified and saved to vault",
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to confirm document" }, { status: 400 });
  }
}
