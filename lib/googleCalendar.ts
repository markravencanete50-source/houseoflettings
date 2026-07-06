// lib/googleCalendar.ts
// One-way push of confirmed viewings into a Google Calendar, using a service
// account. No external npm dependency — the service-account JWT is signed with
// Node's crypto and exchanged for an access token via fetch.
//
// Activates only when these env vars are set (otherwise it silently no-ops, so
// bookings + emails keep working without Google configured):
//   GOOGLE_CALENDAR_ID       e.g. houseoflettingsleeds@gmail.com or a calendar id
//   GOOGLE_SA_CLIENT_EMAIL   service account email
//   GOOGLE_SA_PRIVATE_KEY    service account private key (\n-escaped is fine)
//
// Setup: create a Google Cloud service account, enable the Calendar API, and
// share the target calendar with the service account email (Make changes to events).

import crypto from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function isCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
    process.env.GOOGLE_SA_CLIENT_EMAIL &&
    process.env.GOOGLE_SA_PRIVATE_KEY
  );
}

export async function getCalendarAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL as string;
  const privateKey = (process.env.GOOGLE_SA_PRIVATE_KEY as string).replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const enc = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${enc(header)}.${enc(claims)}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey)
    .toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token as string;
}

export interface CalendarViewing {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  endTime: string; // HH:mm
  city: string;
  name: string;
  phone: string;
  email: string;
  propertyTitle?: string;
  postcode?: string;
}

// Returns the created event id, or null if not configured / on failure.
// Never throws — a calendar problem must not block a booking.
export async function pushViewingToCalendar(v: CalendarViewing): Promise<string | null> {
  if (!isCalendarConfigured()) return null;
  try {
    const token = await getCalendarAccessToken();
    const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID as string);
    const summary = `Viewing — ${v.name} (${v.city})`;
    const descriptionLines = [
      `Client: ${v.name}`,
      `Phone: ${v.phone}`,
      `Email: ${v.email}`,
      `City: ${v.city}`,
      v.propertyTitle ? `Property: ${v.propertyTitle}` : "",
      v.postcode ? `Postcode: ${v.postcode}` : "",
    ].filter(Boolean);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          description: descriptionLines.join("\n"),
          location: [v.postcode, v.city].filter(Boolean).join(", "),
          start: { dateTime: `${v.date}T${v.time}:00`, timeZone: "Europe/London" },
          end: { dateTime: `${v.date}T${v.endTime}:00`, timeZone: "Europe/London" },
        }),
      }
    );
    if (!res.ok) {
      console.error("Google Calendar insert failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    return (json.id as string) || null;
  } catch (err) {
    console.error("pushViewingToCalendar error:", err);
    return null;
  }
}

export interface CalendarEvent {
  summary?: string;
  start?: { date?: string; dateTime?: string };
}

// List events between two ISO instants (read-only). Used to derive the team's
// city rota from the office calendar. Returns [] when not configured.
export async function listCalendarEvents(
  timeMinISO: string,
  timeMaxISO: string,
): Promise<CalendarEvent[]> {
  if (!isCalendarConfigured()) return [];
  const token = await getCalendarAccessToken();
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID as string);
  const params = new URLSearchParams({
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: "true",     // expand recurring rota events into individual days
    orderBy: "startTime",
    maxResults: "2500",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Google Calendar list failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const json = await res.json();
  return (json.items as CalendarEvent[]) || [];
}
