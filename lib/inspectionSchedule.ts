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
  computeInspectionSlots,
  cityFromText,
  timeToMinutes,
  DAY_START_MIN,
  DAY_END_MIN,
  SLOT_INTERVAL_MIN,
  type AvailabilityWindow,
  type City,
  type SlotView,
} from "./viewingSlots";

const HORIZON_DAYS = 70;
const TTL_MS = 60 * 1000; // 1-minute cache so calendar edits reflect quickly

// The keyword the team types into the calendar to mark inspection availability.
// A city name in the title (e.g. "Leeds Property Inspection" / "Manchester
// Property Inspection") scopes that window to one city; a title with no city
// stays available to both, so older single "Property Inspection" events keep
// working.
const INSPECTION_KEYWORD = /property\s*inspection/i;
// Our own confirmed-inspection booking events, so they don't read as availability.
const INSPECTION_BOOKING = /^\s*inspection\s*[—-]/i;

// The city an availability event is scoped to, or null when the title names no
// city (in which case it applies to both Leeds and Manchester).
function eventCity(ev: CalendarEvent): City | null {
  return cityFromText(ev.summary || "");
}

// Does this availability event apply for the requested city? A null request
// (city unknown) matches everything; a city-less event matches any request.
function cityMatches(ev: CalendarEvent, city: City | null): boolean {
  if (!city) return true;
  const ec = eventCity(ev);
  return ec === null || ec === city;
}

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

// Booked inspection start times ("HH:mm") on a date, from our own booking
// events. When a city is requested, only bookings for that city (or ones with
// no city in the title) count against it, so a Leeds inspection never blocks a
// Manchester slot and vice-versa.
function bookedTimesOn(events: CalendarEvent[], date: string, city: City | null): string[] {
  const out: string[] = [];
  for (const ev of events) {
    if (!isBookingEvent(ev)) continue;
    if (eventDate(ev) !== date) continue;
    if (!cityMatches(ev, city)) continue;
    if (ev.start?.dateTime) out.push(ev.start.dateTime.slice(11, 16));
  }
  return out;
}

// Bookable inspection slots on a single date, optionally scoped to a city.
export async function getInspectionSlotsForDate(
  date: string,
  city: City | null = null,
): Promise<{ slots: SlotView[]; configured: boolean }> {
  const { events, configured } = await getEvents();
  const windows: AvailabilityWindow[] = [];
  for (const ev of events) {
    if (!isAvailabilityEvent(ev)) continue;
    if (!cityMatches(ev, city)) continue;
    if (eventDate(ev) !== date) continue;
    const w = eventWindow(ev);
    if (w) windows.push(w);
  }
  if (!windows.length) return { slots: [], configured };

  const isToday = date === londonToday();
  const slots = computeInspectionSlots(windows, bookedTimesOn(events, date, city), {
    isToday,
    nowMinutes: isToday ? londonNowMinutes() : 0,
  });
  return { slots, configured };
}

// The dates (within the window) that carry any inspection availability — used to
// offer the landlord quick-pick dates in the checkout. Optionally scoped to a city.
export async function getInspectionAvailableDates(
  fromStr: string,
  days: number,
  city: City | null = null,
): Promise<{ dates: string[]; configured: boolean }> {
  const { events, configured } = await getEvents();
  const [y, m, d] = fromStr.split("-").map(Number);
  const maxIso = new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);

  const set = new Set<string>();
  for (const ev of events) {
    if (!isAvailabilityEvent(ev)) continue;
    if (!cityMatches(ev, city)) continue;
    const ed = eventDate(ev);
    if (!ed || ed < fromStr || ed > maxIso) continue;
    if (eventWindow(ev)) set.add(ed);
  }
  return { dates: Array.from(set).sort(), configured };
}
