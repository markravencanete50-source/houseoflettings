// app/api/cron/compliance-reminders/route.ts
// Daily cron (vercel.json). Emails a landlord about a month before any of their
// compliance certificates expires, offering to arrange the renewal themselves
// or have House of Lettings arrange it. De-duplicated per expiry date so a
// certificate is only emailed once per cycle (a re-upload with a new date
// re-arms it). Scheduled + secured with CRON_SECRET (same as purge-deleted).
import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/staffApiAuth';
import { COMPLIANCE_TYPE_MAP, daysUntil, COMPLIANCE_WARN_DAYS } from '@/lib/compliance';

export const dynamic = 'force-dynamic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to, subject, html }),
  });
  if (!res.ok) console.error('compliance reminder email failed:', await res.json().catch(() => ({})));
}

function reminderHtml(d: {
  name: string; typeLabel: string; propertyLabel: string; expiryDate: string; daysLeft: number; selfUrl: string; holUrl: string;
}) {
  const when = d.daysLeft < 0 ? `expired ${Math.abs(d.daysLeft)} day${Math.abs(d.daysLeft) === 1 ? '' : 's'} ago` : `expires in ${d.daysLeft} day${d.daysLeft === 1 ? '' : 's'}`;
  return `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;margin:0;padding:24px;color:#0a162f">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e9edf5">
    <div style="background:linear-gradient(135deg,#0a162f,#14294f);color:#fff;padding:22px 26px">
      <div style="font-weight:800;font-size:18px">House of Lettings</div>
      <div style="font-size:12px;opacity:.7;letter-spacing:.12em;text-transform:uppercase">Compliance reminder</div>
    </div>
    <div style="padding:26px">
      <p style="font-size:15px;margin:0 0 14px">Hi ${d.name || 'there'},</p>
      <p style="font-size:14.5px;line-height:1.65;margin:0 0 16px">
        Your <strong>${d.typeLabel}</strong> for <strong>${d.propertyLabel}</strong> ${when}
        (expiry date <strong>${d.expiryDate}</strong>). To keep your property compliant, it needs renewing.
      </p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 18px">How would you like to handle it?</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px">
        <tr>
          <td style="padding:0 10px 10px 0">
            <a href="${d.holUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 20px;border-radius:9px">House of Lettings, please arrange it</a>
          </td>
          <td style="padding:0 0 10px 0">
            <a href="${d.selfUrl}" style="display:inline-block;background:#fff;color:#0a162f;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:9px;border:1.5px solid #d8deea">I'll arrange it with my own contractor</a>
          </td>
        </tr>
      </table>
      <p style="font-size:12px;color:#9aa4b2;line-height:1.6;margin:16px 0 0">
        If you choose "House of Lettings, please arrange it", our team will be notified and will contact you to organise the renewal.
        You can also manage your documents any time in your <a href="${SITE}/landlord-portal" style="color:#2563eb">landlord portal</a>.
      </p>
    </div>
  </div></body></html>`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }
  try {
    const db = getAdminDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + COMPLIANCE_WARN_DAYS);
    const cutoffISO = cutoff.toISOString().split('T')[0];

    // expiryDate is a sortable ISO string; a range query needs no composite index.
    const snap = await db.collection('complianceDocs').where('expiryDate', '<=', cutoffISO).get();

    let sent = 0, skipped = 0;
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const expiryDate = String(data.expiryDate || '');
      if (!ISO_DATE.test(expiryDate)) { skipped++; continue; }
      if (data.reminderForExpiry === expiryDate) { skipped++; continue; } // already reminded for this expiry
      const email = String(data.landlordEmail || '');
      if (!email) { skipped++; continue; }
      const d = daysUntil(expiryDate);
      if (d == null) { skipped++; continue; }

      const token = randomBytes(16).toString('hex');
      const typeLabel = COMPLIANCE_TYPE_MAP[data.type]?.label || 'certificate';
      const base = `${SITE}/api/compliance/renewal?doc=${encodeURIComponent(doc.id)}&t=${token}`;

      await sendEmail(email, `Reminder: your ${typeLabel} needs renewing`, reminderHtml({
        name: String(data.landlordName || ''),
        typeLabel,
        propertyLabel: String(data.propertyLabel || 'your property'),
        expiryDate,
        daysLeft: d,
        selfUrl: `${base}&choice=self`,
        holUrl: `${base}&choice=hol`,
      }));

      await doc.ref.set({ reminderForExpiry: expiryDate, reminderSentAt: FieldValue.serverTimestamp(), actionToken: token }, { merge: true });
      sent++;
    }
    return Response.json({ ok: true, sent, skipped, scanned: snap.size }, { status: 200 });
  } catch (e) {
    console.error('cron/compliance-reminders error:', e);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
