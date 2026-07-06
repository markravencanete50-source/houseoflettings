import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  bookingRejectionReason,
  minutesToTime,
  timeToMinutes,
  weekdayOf,
  WEEKDAY_NAMES,
  SLOT_INTERVAL_MIN,
  CITIES,
  type City,
  type ExistingBooking,
} from "@/lib/viewingSlots";
import { citiesForDateLive } from "@/lib/citySchedule";
import { pushViewingToCalendar } from "@/lib/googleCalendar";
import {
  composeClientSms,
  composeBusinessSms,
  sendSms,
  isSmsConfigured,
  BUSINESS_SMS_NUMBER,
} from "@/lib/sms";

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

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || "onboarding@resend.dev", to, subject, html }),
  });
  if (!res.ok) console.error("Email failed:", await res.json().catch(() => ({})));
}

function prettyDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
}

const TD_LABEL = 'style="padding:10px 12px;border-bottom:1px solid #eef0f5;font-weight:600;color:#6b7280;width:42%;"';
const TD_VALUE = 'style="padding:10px 12px;border-bottom:1px solid #eef0f5;color:#111;"';

function row(label: string, value?: string) {
  return `<tr><td ${TD_LABEL}>${label}</td><td ${TD_VALUE}>${value || "—"}</td></tr>`;
}

// The screening answers, in display order, for the emails.
function screeningRows(d: any): string {
  const items: [string, string][] = [
    ["When looking to move in", d.moveIn],
    ["Aligns with advertised availability?", d.alignsWithAvailability],
    ["Currently lives in the same city?", d.sameCity],
    ["People moving in", d.peopleCount],
    ["Children (and ages)", d.hasChildren === "Yes" ? `Yes${d.childrenAges ? ` — ${d.childrenAges}` : ""}` : d.hasChildren],
    ["Pets", d.hasPets],
    ["Employment status", d.employmentStatus],
    ["Total annual income (all adults)", d.annualIncome],
    ["Intended rental length", d.rentDuration],
  ];
  return items.map(([label, val]) => row(label, val)).join("");
}

function clientEmailHtml(d: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;"><div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);"><div style="background:linear-gradient(135deg,#1a3c5e,#2563a8);padding:36px 40px;color:#fff;"><h1 style="margin:0 0 6px;font-size:24px;">✅ Viewing Confirmed</h1><p style="margin:0;">House of Lettings — ${d.city}</p></div><div style="padding:36px 40px;color:#374151;font-size:15px;line-height:1.65;"><p>Dear <strong>${d.name}</strong>,</p><p>Your property viewing is booked. Here are the details:</p><div style="background:#f8f9ff;border-radius:12px;padding:20px 24px;margin:24px 0;"><p style="margin:0 0 6px;"><strong>When:</strong> ${prettyDateTime(d.date, d.time)}</p><p style="margin:0 0 6px;"><strong>City:</strong> ${d.city}</p>${d.propertyTitle ? `<p style="margin:0;"><strong>Property:</strong> ${d.propertyTitle}</p>` : ""}</div><p>Our team will be in touch to confirm. If you need to change or cancel, just reply to this email or call us.</p></div><div style="background:#f8f9ff;padding:20px 40px;text-align:center;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} House of Lettings Ltd.</div></div></body></html>`;
}

function adminEmailHtml(d: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0;"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;"><div style="background:#1a3c5e;padding:24px 32px;color:#fff;"><h2 style="margin:0;font-size:20px;">📅 New Viewing Booked — ${d.city}</h2><p style="margin:4px 0 0;opacity:.8;font-size:13px;">${prettyDateTime(d.date, d.time)}</p></div><div style="padding:28px 32px;"><table style="width:100%;border-collapse:collapse;font-size:14px;">${row("Name", d.name)}${row("Phone", d.phone)}${row("Email", d.email)}${row("City", d.city)}${row("When", prettyDateTime(d.date, d.time))}${d.propertyTitle ? row("Property", d.propertyTitle) : ""}${d.postcode ? row("Postcode", d.postcode) : ""}${screeningRows(d)}</table><p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">A confirmation text was ${d._smsSent ? "sent" : "composed"} for the client and the office line (${BUSINESS_SMS_NUMBER}).</p></div></div></body></html>`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const required = ["name", "email", "phone", "city", "date", "time"];
    for (const field of required) {
      if (!data[field]?.toString().trim()) {
        return Response.json({ message: `${field} is required` }, { status: 400 });
      }
    }
    const city = data.city as City;
    if (!CITIES.includes(city)) {
      return Response.json({ message: "Please choose Leeds or Manchester" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !/^\d{2}:\d{2}$/.test(data.time)) {
      return Response.json({ message: "Please choose a valid date and time" }, { status: 400 });
    }

    // Enforce the live city rota (office calendar): the team can only view this
    // city on the days it's actually there. 409 so the modal clears the time
    // and refreshes.
    const cities = await citiesForDateLive(data.date);
    if (!cities.includes(city)) {
      const day = WEEKDAY_NAMES[weekdayOf(data.date)];
      return Response.json({
        message: `Our team isn't in ${city} on a ${day}${cities.length ? ` — that day covers ${cities.join(" & ")}` : ""}. Please pick a day we're in ${city}.`,
      }, { status: 409 });
    }

    const db = getFirestoreClient();
    const col = db.collection("viewingBookings");

    // Atomically re-check the rules against everything booked that day, then
    // write — so two people can't grab the last spot at the same instant.
    let bookingId = "";
    const rejection = await db.runTransaction(async (tx) => {
      const snap = await tx.get(col.where("date", "==", data.date));
      const bookings: ExistingBooking[] = snap.docs
        .map((doc) => doc.data())
        .filter((b) => b.time && b.city)
        .map((b) => ({ time: b.time as string, city: b.city as City }));

      const reason = bookingRejectionReason(city, data.time, bookings);
      if (reason) return reason;

      const ref = col.doc();
      bookingId = ref.id;
      tx.set(ref, {
        ...data,
        status: "confirmed",
        source: "book-viewing-page",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return null;
    });

    if (rejection) {
      return Response.json({ message: rejection }, { status: 409 });
    }

    const endTime = minutesToTime(timeToMinutes(data.time) + SLOT_INTERVAL_MIN);
    const clientSms = composeClientSms(data);
    const businessSms = composeBusinessSms(data);

    // Store the composed texts + fire everything off. None of these may block
    // or fail the booking, which is already committed above.
    await col.doc(bookingId).set({ clientSms, businessSms }, { merge: true }).catch(() => {});

    const [calendarEventId] = await Promise.all([
      pushViewingToCalendar({
        date: data.date, time: data.time, endTime, city,
        name: data.name, phone: data.phone, email: data.email,
        propertyTitle: data.propertyTitle, postcode: data.postcode,
      }),
      sendSms(data.phone, clientSms),
      sendSms(BUSINESS_SMS_NUMBER, businessSms),
      sendEmail({
        to: data.email,
        subject: `✅ Your ${city} Viewing — House of Lettings`,
        html: clientEmailHtml(data),
      }),
      sendEmail({
        to: process.env.TENANT_ADMIN_EMAIL || "houseoflettingsleeds@gmail.com",
        subject: `📅 New Viewing — ${data.name} (${city}, ${data.date} ${data.time})`,
        html: adminEmailHtml({ ...data, _smsSent: isSmsConfigured() }),
      }),
    ]);

    if (calendarEventId) {
      await col.doc(bookingId).set({ calendarEventId }, { merge: true }).catch(() => {});
    }

    return Response.json({ success: true, id: bookingId }, { status: 201 });
  } catch (error) {
    console.error("book-viewing error:", error);
    return Response.json({ message: "Internal server error. Please try again." }, { status: 500 });
  }
}
