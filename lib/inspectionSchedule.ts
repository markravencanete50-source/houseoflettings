// lib/inspectionSchedule.ts
// Inspection-appointment availability, driven by the office Google Calendar —
// the same idea as the per-property viewing windows, but keyed on a keyword the
// team types into the calendar rather than a property address.
//
// Convention for the team:
//   • Create a calendar event titled with the keyword "Property Inspection"
//     (case-insensitive; extra words are fine, e.g. "Property Inspection - Leeds").
//   • The event's start/end time is the window you're free to carry out
//     inspections that day. One window = one event; several windows = several
//     events; an all-day event = available across working hours.
//
// The additional-services checkout reads these windows and offers the landlord
// bookable slots inside them, so they can pick an inspection time that suits.
// Slots the team has already filled (our own "Inspection —" booking events) are
// counted against capacity. If the calendar isn't configured or the read fails,
// no windows are returned and the checkout falls back to "we'll contact you".

import { listCalendarEvents, isCalendarConfigured, type CalendarEvent } from "./googleCalendar";
import {
  computeWindowSlots,
  timeToMinutes,
  DAY_START_MIN,
  DAY_END_MIN,
  SLOT_INTERVAL_MIN,
  type AvailabilityWindow,
  type SlotView,
} from "./viewingSlots";

const HORIZON_DAYS = 70;
const TTL_MS = 60 * 1000; // 1-minute cache so calendar edits reflect quickly

// The keyword the team types into the calendar to mark inspection availability.
const INSPECTION_KEYWORD = /property\s*inspection/i;
// Our own confirmed-inspection booking events, so they don't read as availability.
const INSPECTION_BOOKING = /^\s*inspection\s*[—-]/i;

let cache: { at: number; events: CalendarEvent[]; configured: boolean } | null = null;

function londonToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

function londonNowMinutes(): number {
  const hhmm = new Date().toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return timeToMinutes(hhmm);
}

function isAvailabilityEvent(ev: CalendarEvent): boolean {
  const s = ev.summary || "";
  if (INSPECTION_BOOKING.test(s)) return false;
  return INSPECTION_KEYWORD.test(s);
}

function isBookingEvent(ev: CalendarEvent): boolean {
  return INSPECTION_BOOKING.test(ev.summary || "");
}

function eventDate(ev: CalendarEvent): string | null {
  const raw = ev.start?.date || ev.start?.dateTime;
  return raw ? raw.slice(0, 10) : null;
}

function eventWindow(ev: CalendarEvent): AvailabilityWindow | null {
  if (ev.start?.dateTime && ev.end?.dateTime) {
    const startMin = timeToMinutes(ev.start.dateTime.slice(11, 16));
    const endMin = timeToMinutes(ev.end.dateTime.slice(11, 16));
    return endMin > startMin ? { startMin, endMin } : null;
  }
  if (ev.start?.date) {
    return { startMin: DAY_START_MIN, endMin: DAY_END_MIN + SLOT_INTERVAL_MIN };
  }
  return null;
}

async function getEvents(): Promise<{ events: CalendarEvent[]; configured: boolean }> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return { events: cache.events, configured: cache.configured };

  if (!isCalendarConfigured()) {
    cache = { at: now, events: [], configured: false };
    return { events: [], configured: false };
  }

  const today = londonToday();
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + HORIZON_DAYS, 23, 59, 59));
  try {
    const events = await listCalendarEvents(start.toISOString(), end.toISOString());
    cache = { at: now, events, configured: true };
    return { events, configured: true };
  } catch (err) {
    console.error("inspectionSchedule: read failed:", err);
    if (cache) return { events: cache.events, configured: cache.configured }; // serve stale
    return { events: [], configured: true };
  }
}

// Booked inspection start times ("HH:mm") on a date, from our own booking events.
function bookedTimesOn(events: CalendarEvent[], date: string): string[] {
  const out: string[] = [];
  for (const ev of events) {
    if (!isBookingEvent(ev)) continue;
    if (eventDate(ev) !== date) continue;
    if (ev.start?.dateTime) out.push(ev.start.dateTime.slice(11, 16));
  }
  return out;
}

// Bookable inspection slots on a single date.
export async function getInspectionSlotsForDate(
  date: string,
): Promise<{ slots: SlotView[]; configured: boolean }> {
  const { events, configured } = await getEvents();
  const windows: AvailabilityWindow[] = [];
  for (const ev of events) {
    if (!isAvailabilityEvent(ev)) continue;
    if (eventDate(ev) !== date) continue;
    const w = eventWindow(ev);
    if (w) windows.push(w);
  }
  if (!windows.length) return { slots: [], configured };

  const isToday = date === londonToday();
  const slots = computeWindowSlots(windows, bookedTimesOn(events, date), {
    isToday,
    nowMinutes: isToday ? londonNowMinutes() : 0,
  });
  return { slots, configured };
}

// The dates (within the window) that carry any inspection availability — used to
// offer the landlord quick-pick dates in the checkout.
export async function getInspectionAvailableDates(
  fromStr: string,
  days: number,
): Promise<{ dates: string[]; configured: boolean }> {
  const { events, configured } = await getEvents();
  const [y, m, d] = fromStr.split("-").map(Number);
  const maxIso = new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);

  const set = new Set<string>();
  for (const ev of events) {
    if (!isAvailabilityEvent(ev)) continue;
    const ed = eventDate(ev);
    if (!ed || ed < fromStr || ed > maxIso) continue;
    if (eventWindow(ev)) set.add(ed);
  }
  return { dates: Array.from(set).sort(), configured };
}
