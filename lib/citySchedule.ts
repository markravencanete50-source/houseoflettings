// lib/citySchedule.ts
// Turns the office Google Calendar into the live source of truth for which city
// the viewing team is in each day. The team keeps day-marker events on the
// calendar (e.g. "Leeds", "Manchester", "Leeds/Manch"); we read those and build
// a date→cities map. If the calendar isn't configured, has no city markers, or
// the read fails, we fall back to the hardcoded weekly rota in viewingSlots.ts —
// so availability never breaks.
//
// Results are cached in-process for a few minutes so a burst of availability
// checks doesn't hammer the Calendar API.

import { listCalendarEvents, isCalendarConfigured, type CalendarEvent } from "./googleCalendar";
import { citiesForDate, type City, type ScheduleMap } from "./viewingSlots";

const HORIZON_DAYS = 70;              // how far ahead we read/cache
const TTL_MS = 5 * 60 * 1000;         // 5-minute cache

type ScheduleSource = "calendar" | "fallback";
let cache: { at: number; map: ScheduleMap; source: ScheduleSource } | null = null;

// Which cities a calendar event marks. Ignores our own auto-created booking
// events (summaries start with "Viewing —") so the rota is driven purely by the
// team's own day-marker events.
function citiesFromSummary(summary?: string): City[] {
  if (!summary) return [];
  if (/^\s*viewing\s*[—-]/i.test(summary)) return [];
  const cities: City[] = [];
  if (/manch/i.test(summary)) cities.push("Manchester");
  if (/leeds/i.test(summary)) cities.push("Leeds");
  return cities;
}

// The local date part of an event's start (all-day `date`, or the `dateTime`
// which already carries the calendar's timezone offset — so slicing the date is
// correct for Europe/London markers).
function eventDate(ev: CalendarEvent): string | null {
  const raw = ev.start?.date || ev.start?.dateTime;
  return raw ? raw.slice(0, 10) : null;
}

function londonToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

async function buildMap(): Promise<{ map: ScheduleMap; source: ScheduleSource }> {
  const today = londonToday();
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + HORIZON_DAYS, 23, 59, 59));

  if (isCalendarConfigured()) {
    try {
      const events = await listCalendarEvents(start.toISOString(), end.toISOString());
      const map: ScheduleMap = {};
      for (const ev of events) {
        const dateStr = eventDate(ev);
        if (!dateStr) continue;
        const cities = citiesFromSummary(ev.summary);
        if (!cities.length) continue;
        map[dateStr] = Array.from(new Set([...(map[dateStr] ?? []), ...cities])) as City[];
      }
      // Only trust the calendar if it actually carries city markers; an empty
      // result means it isn't being used as a rota, so use the weekly default.
      if (Object.keys(map).length > 0) return { map, source: "calendar" };
    } catch (err) {
      console.error("citySchedule: calendar read failed, using weekly fallback:", err);
    }
  }
  return { map: {}, source: "fallback" };
}

// Cached date→cities map plus which source produced it.
export async function getCitySchedule(): Promise<{ map: ScheduleMap; source: ScheduleSource }> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return { map: cache.map, source: cache.source };
  const built = await buildMap();
  cache = { at: now, ...built };
  return built;
}

// The cities the team covers on a single date — calendar-driven, weekly fallback.
// For the calendar source, a date with no marker means "closed" (empty array).
export async function citiesForDateLive(dateStr: string): Promise<City[]> {
  const { map, source } = await getCitySchedule();
  if (source === "calendar") return map[dateStr] ?? [];
  return citiesForDate(dateStr);
}
