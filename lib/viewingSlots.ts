// lib/viewingSlots.ts
// Single source of truth for viewing-appointment availability rules.
// Pure, dependency-free helpers shared by the booking page (client) and the
// availability / booking API routes (server) so the two can never disagree.
//
// Rules (from the House of Lettings brief):
//  • Viewings run 09:00 → 19:30, in 15-minute slots.
//  • Each slot time holds a maximum of 2 clients; a 3rd is blocked (greyed out).
//  • A 3-hour travel gap is required between viewings at DIFFERENT slot times on
//    the same day (a second client may still share the SAME slot time).
//  • Each day locks to the first city booked: once a Leeds viewing exists on a
//    date, that whole day is Leeds-only and Manchester is unavailable — and
//    vice-versa. This covers the travel-between-cities requirement.

export type City = 'Leeds' | 'Manchester';
export const CITIES: City[] = ['Leeds', 'Manchester'];

// ── Weekly city rota (the "guide") ─────────────────────────────────────────
// Which city (or cities) the viewing team covers each weekday. This mirrors the
// office calendar: most days are Leeds, Wednesday is Manchester, and Fri/Sat
// the team covers both. Keyed by JS weekday (0 = Sunday … 6 = Saturday).
// Editing this object is all it takes to change availability across the site.
export const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const CITY_SCHEDULE: Record<number, City[]> = {
  0: ['Leeds'],                 // Sunday
  1: ['Leeds'],                 // Monday
  2: ['Leeds'],                 // Tuesday
  3: ['Manchester'],            // Wednesday
  4: ['Leeds'],                 // Thursday
  5: ['Leeds', 'Manchester'],   // Friday
  6: ['Leeds', 'Manchester'],   // Saturday
};

// Weekday (0–6) for a 'YYYY-MM-DD' string, computed via UTC-noon so it never
// drifts by a day due to the server's own timezone.
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

// Which cities the team covers on a given date.
export function citiesForDate(dateStr: string): City[] {
  return CITY_SCHEDULE[weekdayOf(dateStr)] ?? [];
}

// Is the team in `city` on `dateStr`?
export function isCityScheduledOn(city: City, dateStr: string): boolean {
  return citiesForDate(dateStr).includes(city);
}

// The weekdays (0–6) the team is in a given city — for "we visit Leeds on…" hints.
export function scheduledWeekdaysFor(city: City): number[] {
  return Object.keys(CITY_SCHEDULE)
    .map(Number)
    .filter((d) => CITY_SCHEDULE[d].includes(city))
    .sort((a, b) => a - b);
}

// The next `count` dates (from `fromStr`, inclusive) the team is in `city`,
// within `horizonDays`. Used to steer tenants to a bookable day.
export function nextDatesForCity(
  city: City,
  fromStr: string,
  count = 3,
  horizonDays = 60,
): string[] {
  const [y, m, d] = fromStr.split('-').map(Number);
  const out: string[] = [];
  for (let i = 0; i <= horizonDays && out.length < count; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i, 12));
    if (CITY_SCHEDULE[dt.getUTCDay()]?.includes(city)) out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

// ── Live schedule map (calendar-driven) ────────────────────────────────────
// A dense date→cities map, produced server-side from the office Google Calendar
// (see lib/citySchedule.ts). The helpers below take such a map and fall back to
// the weekly CITY_SCHEDULE above when it's null (calendar not loaded yet / not
// configured), so the UI and rules keep working either way.
export type ScheduleMap = Record<string, City[]>;

export function citiesForDateIn(map: ScheduleMap | null | undefined, dateStr: string): City[] {
  if (map) return map[dateStr] ?? [];
  return citiesForDate(dateStr);
}

export function isCityScheduledIn(
  map: ScheduleMap | null | undefined,
  city: City,
  dateStr: string,
): boolean {
  return citiesForDateIn(map, dateStr).includes(city);
}

export function nextDatesForCityIn(
  map: ScheduleMap | null | undefined,
  city: City,
  fromStr: string,
  count = 3,
  horizonDays = 60,
): string[] {
  if (!map) return nextDatesForCity(city, fromStr, count, horizonDays);
  const [y, m, d] = fromStr.split('-').map(Number);
  const out: string[] = [];
  for (let i = 0; i <= horizonDays && out.length < count; i++) {
    const iso = new Date(Date.UTC(y, m - 1, d + i, 12)).toISOString().slice(0, 10);
    if ((map[iso] ?? []).includes(city)) out.push(iso);
  }
  return out;
}

// ── Per-property availability windows (calendar-driven) ────────────────────
// When agents set availability per property on the office calendar, a viewing
// time is only offered if it falls inside one of that property's windows for
// the day. This replaces the city-day rota for property-specific bookings.
export interface AvailabilityWindow {
  startMin: number; // minutes from midnight (Europe/London)
  endMin: number;
}

// 15-min bookable slots inside the given windows, with capacity reduced by the
// property's existing bookings that day.
export function computeWindowSlots(
  windows: AvailabilityWindow[],
  bookedTimes: string[],
  opts: { isToday?: boolean; nowMinutes?: number } = {},
): SlotView[] {
  const { isToday = false, nowMinutes = 0 } = opts;

  const countByMinute = new Map<number, number>();
  for (const t of bookedTimes) {
    const m = timeToMinutes(t);
    countByMinute.set(m, (countByMinute.get(m) || 0) + 1);
  }

  const slotMinutes = new Set<number>();
  for (const w of windows) {
    const first = Math.ceil(w.startMin / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;
    for (let m = first; m + SLOT_INTERVAL_MIN <= w.endMin; m += SLOT_INTERVAL_MIN) {
      slotMinutes.add(m);
    }
  }

  return Array.from(slotMinutes)
    .sort((a, b) => a - b)
    .map((m): SlotView => {
      const count = countByMinute.get(m) || 0;
      const spotsLeft = Math.max(0, SLOT_CAPACITY - count);
      let status: SlotStatus = 'available';
      if (isToday && m <= nowMinutes) status = 'past';
      else if (count >= SLOT_CAPACITY) status = 'full';
      return { time: minutesToTime(m), minutes: m, status, spotsLeft };
    });
}

// Server gate for a per-property booking: the time must sit inside a window and
// still have capacity. Returns null if OK, else a human-readable reason.
export function windowBookingRejectionReason(
  time: string,
  windows: AvailabilityWindow[],
  bookedTimes: string[],
): string | null {
  const minutes = timeToMinutes(time);
  const inWindow = windows.some(
    (w) => minutes >= w.startMin && minutes + SLOT_INTERVAL_MIN <= w.endMin,
  );
  if (!inWindow) {
    return 'That time is no longer available for this property. Please pick an offered slot.';
  }
  const taken = bookedTimes.filter((t) => timeToMinutes(t) === minutes).length;
  if (taken >= SLOT_CAPACITY) {
    return 'That slot is now fully booked. Please choose another time.';
  }
  return null;
}

// ── Property ⇆ calendar-event address matching ─────────────────────────────
// Agents tag an availability event with the property's full address. Matching
// is lenient: normalised containment either way, or same full postcode + same
// leading house number, so minor formatting differences still match.
function normAddr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function fullPostcode(s: string): string | null {
  const m = s.toUpperCase().match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/);
  return m ? m[0].replace(/\s+/g, '') : null;
}
function leadingNumber(normalised: string): string | null {
  const m = normalised.match(/\b\d+[a-z]?\b/);
  return m ? m[0] : null;
}

export function addressMatches(eventText: string, propertyAddress: string): boolean {
  const a = normAddr(eventText || '');
  const b = normAddr(propertyAddress || '');
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const pa = fullPostcode(eventText);
  const pb = fullPostcode(propertyAddress);
  if (pa && pb && pa === pb) {
    const na = leadingNumber(a);
    const nb = leadingNumber(b);
    if (!nb) return true;            // property has no house number → postcode is enough
    if (na && na === nb) return true;
  }
  return false;
}

// ── City auto-detection ────────────────────────────────────────────────────
// Best-effort guess of a property's city from its free-text location/postcode.
// Returns null when it genuinely can't tell, so callers can fall back to asking.
const MANCHESTER_AREAS = ['M', 'OL', 'BL', 'SK', 'WN', 'WA'];
const LEEDS_AREAS = ['LS', 'WF', 'BD', 'HD', 'HX', 'HG', 'YO'];

export function cityFromText(text?: string): City | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes('manchester')) return 'Manchester';
  if (lower.includes('leeds')) return 'Leeds';
  // Fall back to the postcode's outward area (the letters before the first digit).
  const m = text.toUpperCase().match(/\b([A-Z]{1,2})\d/);
  const area = m?.[1];
  if (area) {
    if (MANCHESTER_AREAS.includes(area)) return 'Manchester';
    if (LEEDS_AREAS.includes(area)) return 'Leeds';
  }
  return null;
}

export const DAY_START_MIN = 9 * 60;       // 09:00
export const DAY_END_MIN = 19 * 60 + 30;   // 19:30 (last bookable slot)
export const SLOT_INTERVAL_MIN = 15;       // slots every 15 minutes
export const SLOT_CAPACITY = 2;            // max clients per slot time
export const TRAVEL_GAP_MIN = 180;         // 3h gap between different slot times

export type SlotStatus =
  | 'available'    // free (0 or 1 client so far), bookable
  | 'full'         // 2 clients already — greyed out
  | 'blocked-gap'  // within 3h of another viewing that day — greyed out
  | 'other-city'   // day is locked to the other city — greyed out
  | 'past';        // slot time already passed (today only) — greyed out

export interface SlotView {
  time: string;        // "HH:mm"
  minutes: number;     // minutes from midnight
  status: SlotStatus;
  spotsLeft: number;   // remaining capacity at this exact time (0–2)
}

// A minimal booking shape — only what the availability maths needs.
export interface ExistingBooking {
  time: string; // "HH:mm"
  city: City;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// All slot start times for a day, as minutes-from-midnight.
export function allSlotMinutes(): number[] {
  const out: number[] = [];
  for (let t = DAY_START_MIN; t <= DAY_END_MIN; t += SLOT_INTERVAL_MIN) out.push(t);
  return out;
}

// Which city (if any) a day is already committed to. Bookings are only ever
// written for one city per day, so the first one determines the lock.
export function lockedCityFor(bookings: ExistingBooking[]): City | null {
  return bookings.length ? bookings[0].city : null;
}

// Compute the status of every slot for a given city on a given date.
// `nowMinutes` is the current minutes-from-midnight when `isToday` is true, so
// slots that have already passed today are marked 'past'.
export function computeSlots(
  city: City,
  bookings: ExistingBooking[],
  opts: { isToday?: boolean; nowMinutes?: number } = {}
): SlotView[] {
  const { isToday = false, nowMinutes = 0 } = opts;
  const lockedCity = lockedCityFor(bookings);
  const otherCityLocked = lockedCity !== null && lockedCity !== city;

  // Count clients already booked at each exact slot time (for this city).
  const countByMinute = new Map<number, number>();
  for (const b of bookings) {
    if (b.city !== city) continue;
    const m = timeToMinutes(b.time);
    countByMinute.set(m, (countByMinute.get(m) || 0) + 1);
  }
  const bookedMinutes = Array.from(countByMinute.keys());

  return allSlotMinutes().map((m): SlotView => {
    const count = countByMinute.get(m) || 0;
    const spotsLeft = Math.max(0, SLOT_CAPACITY - count);

    let status: SlotStatus = 'available';
    if (isToday && m <= nowMinutes) {
      status = 'past';
    } else if (otherCityLocked) {
      status = 'other-city';
    } else if (count >= SLOT_CAPACITY) {
      status = 'full';
    } else if (
      // Blocked if a viewing exists at a DIFFERENT time within the travel gap.
      bookedMinutes.some((bm) => bm !== m && Math.abs(bm - m) < TRAVEL_GAP_MIN)
    ) {
      status = 'blocked-gap';
    }

    return { time: minutesToTime(m), minutes: m, status, spotsLeft };
  });
}

// Server-side gate: can this city/time be booked given the day's existing
// bookings? Returns null if OK, or a human-readable reason if not. Mirrors
// computeSlots so the API and the UI enforce identical rules.
export function bookingRejectionReason(
  city: City,
  time: string,
  bookings: ExistingBooking[]
): string | null {
  const minutes = timeToMinutes(time);
  if (
    minutes < DAY_START_MIN ||
    minutes > DAY_END_MIN ||
    (minutes - DAY_START_MIN) % SLOT_INTERVAL_MIN !== 0
  ) {
    return 'That time is outside our viewing hours (09:00–19:30).';
  }

  const lockedCity = lockedCityFor(bookings);
  if (lockedCity && lockedCity !== city) {
    return `That day is already allocated to ${lockedCity} viewings. Please pick another day or choose ${lockedCity}.`;
  }

  let sameSlotCount = 0;
  for (const b of bookings) {
    if (b.city !== city) continue;
    const bm = timeToMinutes(b.time);
    if (bm === minutes) sameSlotCount++;
    else if (Math.abs(bm - minutes) < TRAVEL_GAP_MIN) {
      return 'That time is too close to another viewing that day. Please leave at least 3 hours between viewings.';
    }
  }
  if (sameSlotCount >= SLOT_CAPACITY) {
    return 'That slot is now fully booked. Please choose another time.';
  }
  return null;
}
