import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const docId = params.id;
  const doc = demoStore.documents.find((d) => d.id === docId) || demoStore.documents[0];

  return NextResponse.json({
    document: doc,
    lab_results: doc.tests || [],
    medicines: demoStore.medicines.filter((m) => m.confirmed),
  });
}
