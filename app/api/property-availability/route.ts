import { getPropertyAvailableDates } from "@/lib/calendarAvailability";

// Which dates a specific property has viewing availability on (from the office
// calendar). Feeds the booking modal's date hints and next-date suggestions.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address") || "";
    const from = searchParams.get("from") || "";
    const days = Math.min(Math.max(Number(searchParams.get("days") || 60), 1), 70);

    if (!address.trim()) {
      return Response.json({ message: "A property address is required" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return Response.json({ message: "A valid from date (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const { dates, configured } = await getPropertyAvailableDates(address, from, days);
    return Response.json({ dates, configured });
  } catch (error) {
    console.error("property-availability error:", error);
    return Response.json({ message: "Could not load availability" }, { status: 500 });
  }
}
