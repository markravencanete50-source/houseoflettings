import { getCitySchedule } from "@/lib/citySchedule";
import { citiesForDate, type ScheduleMap } from "@/lib/viewingSlots";

// Returns a dense date→cities map for the requested window so the booking modal
// can show the correct rota (hints, warnings, next-date suggestions) that stays
// in sync with the office Google Calendar in near-real-time.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "";
    const days = Math.min(Math.max(Number(searchParams.get("days") || 60), 1), 70);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return Response.json({ message: "A valid from date (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const { map, source } = await getCitySchedule();

    // Densify: fill every date in range so the client can look any of them up.
    // Calendar source → absent dates are closed ([]). Fallback → weekly rota.
    const [y, m, d] = from.split("-").map(Number);
    const schedule: ScheduleMap = {};
    for (let i = 0; i <= days; i++) {
      const iso = new Date(Date.UTC(y, m - 1, d + i, 12)).toISOString().slice(0, 10);
      schedule[iso] = source === "calendar" ? (map[iso] ?? []) : citiesForDate(iso);
    }

    return Response.json({ schedule, source });
  } catch (error) {
    console.error("viewing-schedule error:", error);
    return Response.json({ message: "Could not load schedule" }, { status: 500 });
  }
}
