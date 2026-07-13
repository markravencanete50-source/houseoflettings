import { getInspectionAvailableDates, getInspectionSlotsForDate } from "@/lib/inspectionSchedule";
import type { City } from "@/lib/viewingSlots";

// Inspection-appointment availability from the office calendar ("Property
// Inspection" events). Two modes:
//   • ?date=YYYY-MM-DD           → bookable slots on that day
//   • ?from=YYYY-MM-DD&days=NN   → dates that have any availability
// An optional &city=Leeds|Manchester scopes results to windows the team marked
// for that city (plus any windows with no city in the title).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "";
    const from = searchParams.get("from") || "";
    const cityParam = searchParams.get("city");
    const city: City | null =
      cityParam === "Leeds" || cityParam === "Manchester" ? cityParam : null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const { slots, configured } = await getInspectionSlotsForDate(date, city);
      return Response.json({ slots, configured });
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      const days = Math.min(Math.max(Number(searchParams.get("days") || 60), 1), 70);
      const { dates, configured } = await getInspectionAvailableDates(from, days, city);
      return Response.json({ dates, configured });
    }

    return Response.json({ message: "A valid date or from date (YYYY-MM-DD) is required" }, { status: 400 });
  } catch (error) {
    console.error("inspection-availability error:", error);
    return Response.json({ message: "Could not load availability" }, { status: 500 });
  }
}
