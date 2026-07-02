import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  computeSlots,
  lockedCityFor,
  CITIES,
  type City,
  type ExistingBooking,
} from "@/lib/viewingSlots";

function getFirestoreClient() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

// "Now" in Europe/London as { date: 'YYYY-MM-DD', minutes: number } so past
// slots are hidden correctly regardless of the server's own timezone.
function londonNow() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "";
    const city = searchParams.get("city") as City | null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ message: "A valid date (YYYY-MM-DD) is required" }, { status: 400 });
    }
    if (!city || !CITIES.includes(city)) {
      return Response.json({ message: "A valid city is required" }, { status: 400 });
    }

    const db = getFirestoreClient();
    const snap = await db
      .collection("viewingBookings")
      .where("date", "==", date)
      .get();

    const bookings: ExistingBooking[] = snap.docs
      .map((d) => d.data())
      .filter((b) => b.time && b.city)
      .map((b) => ({ time: b.time as string, city: b.city as City }));

    const now = londonNow();
    const isToday = now.date === date;
    const slots = computeSlots(city, bookings, { isToday, nowMinutes: now.minutes });

    return Response.json({
      date,
      city,
      lockedCity: lockedCityFor(bookings),
      slots,
    });
  } catch (error) {
    console.error("viewing-availability error:", error);
    return Response.json({ message: "Could not load availability. Please try again." }, { status: 500 });
  }
}
