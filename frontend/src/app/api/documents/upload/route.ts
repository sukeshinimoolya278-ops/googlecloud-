import { NextResponse } from "next/server";
import { demoStore, DEMO_PATIENT_ID } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = (formData.get("doc_type") as string) || "lab_report";

    const docId = `doc-${Date.now()}`;
    const fileName = file?.name || "Uploaded_Document.pdf";

    const newDoc = {
      id: docId,
      patient_id: DEMO_PATIENT_ID,
      type: docType,
      file_name: fileName,
      status: "ready",
      uploaded_at: new Date().toISOString(),
      tests:
        docType === "lab_report"
          ? [
              { name: "Fasting Blood Sugar", value: 142.0, unit: "mg/dL", normal_min: 70, normal_max: 99, flag: "high" },
              { name: "HbA1c", value: 7.6, unit: "%", normal_min: 4.0, normal_max: 5.6, flag: "high" },
              { name: "Hemoglobin", value: 13.5, unit: "g/dL", normal_min: 12, normal_max: 17.5, flag: "normal" },
              { name: "Serum Creatinine", value: 1.1, unit: "mg/dL", normal_min: 0.6, normal_max: 1.3, flag: "normal" },
            ]
          : [],
    };

    demoStore.documents.unshift(newDoc);

    return NextResponse.json({
      status: "success",
      document: newDoc,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to process upload" }, { status: 400 });
  }
}
