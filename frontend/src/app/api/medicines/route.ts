import { NextResponse } from "next/server";
import { demoStore } from "@/lib/mockStore";

export async function GET() {
  const today = new Date();
  const activeList: any[] = [];
  const pastList: any[] = [];

  for (const med of demoStore.medicines) {
    const endDate = new Date(med.end_date);
    const deltaDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const daysLeft = Math.max(0, deltaDays);
    const isActive = deltaDays >= 0;

    const medCopy = {
      ...med,
      days_left: daysLeft,
    };

    if (isActive) {
      activeList.push(medCopy);
    } else {
      pastList.push(medCopy);
    }
  }

  return NextResponse.json({
    active_medicines: activeList,
    past_medicines: pastList,
  });
}
