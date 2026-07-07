// lib/sms.ts
// Composes the viewing-confirmation text messages and provides a single send
// hook. IMPORTANT: delivering a real SMS to a phone is only possible through an
// SMS gateway — a website cannot inject a text into the mobile networks itself.
// So `sendSms` stays provider-agnostic:
//   • If SMS_GATEWAY_URL is set, it POSTs { to, message } to that endpoint
//     (optionally with SMS_GATEWAY_AUTH as an Authorization header). This lets
//     you point it at any gateway later without touching this code.
//   • Otherwise it logs and returns { sent: false }, and the booking flow falls
//     back to the email confirmations. The composed text is still stored on the
//     booking and shown in the office email so nothing is lost.

export const BUSINESS_SMS_NUMBER = "07377100007";

export interface SmsViewing {
  name: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  city: string;
  phone: string;
  propertyTitle?: string;
}

function prettyDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Text sent to the client who booked.
export function composeClientSms(v: SmsViewing): string {
  const where = v.propertyTitle ? ` for ${v.propertyTitle}` : "";
  return `House of Lettings: Hi ${v.name.split(" ")[0]}, your ${v.city} viewing${where} is booked for ${prettyDate(v.date)} at ${v.time}. We'll be in touch to confirm. Reply or call if you need to change it.`;
}

// Text sent to the office number so staff are notified of a new booking.
export function composeBusinessSms(v: SmsViewing): string {
  return `New viewing booked: ${v.name} (${v.phone}), ${v.city}, ${prettyDate(v.date)} ${v.time}${v.propertyTitle ? ` (${v.propertyTitle})` : ""}.`;
}

export function isSmsConfigured(): boolean {
  return Boolean(process.env.SMS_GATEWAY_URL);
}

// Send one SMS. Never throws — SMS failure must not block a booking.
export async function sendSms(to: string, message: string): Promise<{ sent: boolean }> {
  const url = process.env.SMS_GATEWAY_URL;
  if (!url) {
    console.log(`[sms:not-configured] to=${to} :: ${message}`);
    return { sent: false };
  }
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.SMS_GATEWAY_AUTH) headers.Authorization = process.env.SMS_GATEWAY_AUTH;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ to, message }) });
    if (!res.ok) {
      console.error("SMS gateway error:", res.status, await res.text().catch(() => ""));
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("sendSms error:", err);
    return { sent: false };
  }
}
