// app/api/landlord/request-access/route.ts
// Existing landlords (registered before the portal, or who never activated) ask
// for access here. We look up their registration by email and, if found, email a
// one-time link to set their own password and activate their account. The
// response is ALWAYS a generic success — it never reveals whether an email is on
// file (no account-enumeration oracle).
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/staffApiAuth';
import { rateLimit, rateLimitByKey } from '@/lib/rateLimit';
import { randomBytes, createHash } from 'node:crypto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';
const TTL_MS = 24 * 60 * 60 * 1000; // link valid 24h
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to, subject, html }),
  });
  if (!res.ok) console.error('request-access email failed:', await res.json().catch(() => ({})));
}

function activationEmailHtml(name: string, link: string): string {
  const first = (name || 'there').split(' ')[0];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(10,22,47,.12);">
      <div style="background:linear-gradient(135deg,#0a162f,#14294f 60%,#c0392b 170%);padding:38px 40px;color:#fff;">
        <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.7;">House of Lettings</div>
        <div style="font-size:24px;font-weight:800;margin-top:6px;">Activate your Landlord Portal</div>
      </div>
      <div style="padding:34px 40px;color:#26303f;font-size:15px;line-height:1.7;">
        <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
        <p style="margin:0 0 16px;">We found your landlord registration. Use the secure link below to set your password and activate your portal, where you can track your properties, applications and maintenance requests.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${link}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;font-weight:700;padding:15px 40px;border-radius:10px;">Set my password →</a>
        </div>
        <p style="margin:0;color:#9aa4b2;font-size:13px;">This link expires in 24 hours and can be used once. If you didn't request it, you can safely ignore this email.</p>
      </div>
    </div>
  </body></html>`;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'landlord-request-access', 8, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const { email } = await request.json();
    const clean = String(email || '').trim().toLowerCase();
    const generic = NextResponse.json({ ok: true }, { status: 200 });
    if (!clean || !clean.includes('@')) return generic;

    // Throttle per mailbox so this can't be used to blast activation emails.
    const perEmail = rateLimitByKey('landlord-request-access-email', clean, 3, 30 * 60 * 1000);
    if (perEmail) return perEmail;

    const db = getAdminDb();
    const snap = await db.collection('landlordAgreements').where('email', '==', clean).limit(1).get();
    if (snap.empty) return generic; // no leak: same response as success

    const name = (snap.docs[0].data()?.companyName || snap.docs[0].data()?.fullName || '').toString();

    // One active token per email; the hash is stored, never the token itself.
    const token = randomBytes(24).toString('hex');
    await db.collection('landlordAccessTokens').doc(sha256(token)).set({
      email: clean,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Date.now() + TTL_MS,
      used: false,
    });

    const link = `${SITE_URL}/landlord-activate?token=${token}&email=${encodeURIComponent(clean)}`;
    await sendEmail({ to: clean, subject: '🔑 Activate your House of Lettings Landlord Portal', html: activationEmailHtml(name, link) });

    return generic;
  } catch (e) {
    console.error('landlord-request-access error:', e);
    // Still generic — never reveal internal state to the caller.
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
