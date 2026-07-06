// lib/calendarAvailability.ts
// Per-property viewing availability, driven by the office Google Calendar.
// Agents create a calendar event whose title contains the property's full
// address, with the event's start/end being the window they're free to show
// that property. We read those events and turn them into bookable slots.
//
// Convention for agents:
//   • Title: the property's full address (as shown on the listing), e.g.
//     "12 Oak Street, Headingley, Leeds, LS6 3AA"
//   • Time:  the window you're available (e.g. Sat 10:00–13:00)
//   • One window = one event; several windows on a day = several events.
//   • All-day event with the address = available across working hours.
//
// If the calendar isn't configured or the read fails, no windows are returned
// (so, per the "calendar is the only source" rule, no slots are offered).

import { listCalendarEvents, isCalendarConfigured, type CalendarEvent } from "./googleCalendar";
import {
  addressMatches,
  timeToMinutes,
  DAY_START_MIN,
  DAY_END_MIN,
  SLOT_INTERVAL_MIN,
  type AvailabilityWindow,
} from "./viewingSlots";

const HORIZON_DAYS = 70;
const TTL_MS = 60 * 1000; // 1-minute cache so calendar edits reflect quickly

let cache: { at: number; events: CalendarEvent[]; configured: boolean } | null = null;

function londonToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

// Skip the booking events this site creates ("Viewing — Name (City)") so they
// aren't mistaken for availability windows.
function isBookingEvent(ev: CalendarEvent): boolean {
  return /^\s*viewing\s*[—-]/i.test(ev.summary || "");
}

function eventDate(ev: CalendarEvent): string | null {
  const raw = ev.start?.date || ev.start?.dateTime;
  return raw ? raw.slice(0, 10) : null;
}

// The window (minutes from midnight) an event covers. Timed events use their
// local HH:mm; all-day events cover the full working day.
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
    console.error("calendarAvailability: read failed:", err);
    if (cache) return { events: cache.events, configured: cache.configured }; // serve stale
    return { events: [], configured: true };
  }
}

// All availability windows for a property on a single date.
export async function getWindowsForDate(
  address: string,
  date: string,
): Promise<{ windows: AvailabilityWindow[]; configured: boolean }> {
  const { events, configured } = await getEvents();
  const windows: AvailabilityWindow[] = [];
  for (const ev of events) {
    if (isBookingEvent(ev)) continue;
    if (eventDate(ev) !== date) continue;
    if (!addressMatches(ev.summary || "", address)) continue;
    const w = eventWindow(ev);
    if (w) windows.push(w);
  }
  return { windows, configured };
}

// The dates (within the window) on which a property has any availability — for
// the modal's "next available dates" hints and off-day suggestions.
export async function getPropertyAvailableDates(
  address: string,
  fromStr: string,
  days: number,
): Promise<{ dates: string[]; configured: boolean }> {
  const { events, configured } = await getEvents();
  const [y, m, d] = fromStr.split("-").map(Number);
  const maxIso = new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);

  const set = new Set<string>();
  for (const ev of events) {
    if (isBookingEvent(ev)) continue;
    if (!addressMatches(ev.summary || "", address)) continue;
    const ed = eventDate(ev);
    if (!ed || ed < fromStr || ed > maxIso) continue;
    if (eventWindow(ev)) set.add(ed);
  }
  return { dates: Array.from(set).sort(), configured };
}
