// lib/viewingSlots.ts
// Single source of truth for viewing-appointment availability rules.
// Pure, dependency-free helpers shared by the booking page (client) and the
// availability / booking API routes (server) so the two can never disagree.
//
// Rules (from the House of Lettings brief):
//  • Viewings run 10:00 → 19:30, in 15-minute slots.
//  • Each slot time holds a maximum of 2 clients; a 3rd is blocked (greyed out).
//  • A 3-hour travel gap is required between viewings at DIFFERENT slot times on
//    the same day (a second client may still share the SAME slot time).
//  • Each day locks to the first city booked: once a Leeds viewing exists on a
//    date, that whole day is Leeds-only and Manchester is unavailable — and
//    vice-versa. This covers the travel-between-cities requirement.

export type City = 'Leeds' | 'Manchester';
export const CITIES: City[] = ['Leeds', 'Manchester'];

export const DAY_START_MIN = 10 * 60;      // 10:00
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
    return 'That time is outside our viewing hours (10:00–19:30).';
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
