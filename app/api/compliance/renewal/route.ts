// app/api/compliance/renewal/route.ts
// Landing endpoint for the two buttons in the compliance reminder email.
//   ?doc=<id>&t=<token>&choice=self  -> the landlord will arrange it themselves
//   ?doc=<id>&t=<token>&choice=hol   -> notify info@houseoflettings.co.uk that
//                                       the landlord wants HoL to arrange it
// Validated against the per-doc actionToken minted when the reminder was sent.
// Returns a simple branded HTML confirmation page.
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/staffApiAuth';
import { COMPLIANCE_TYPE_MAP } from '@/lib/compliance';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';
const OFFICE_EMAIL = process.env.COMPLIANCE_NOTIFY_EMAIL || 'info@houseoflettings.co.uk';

function page(title: string, body: string, ok = true) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;margin:0;padding:40px 16px;color:#0a162f">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e9edf5;overflow:hidden;text-align:center">
      <div style="background:linear-gradient(135deg,#0a162f,#14294f);color:#fff;padding:22px 26px;text-align:left">
        <div style="font-weight:800;font-size:18px">House of Lettings</div>
      </div>
      <div style="padding:34px 28px">
        <div style="font-size:44px;margin-bottom:12px">${ok ? '✅' : '⚠️'}</div>
        <h1 style="font-size:21px;margin:0 0 10px">${title}</h1>
        <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 22px">${body}</p>
        <a href="${SITE}/landlord-portal" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border-radius:9px">Go to my portal</a>
      </div>
    </div>
  </body></html>`;
  return new Response(html, { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to, subject, html }),
  });
  if (!res.ok) console.error('compliance arrange email failed:', await res.json().catch(() => ({})));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('doc') || '';
  const token = url.searchParams.get('t') || '';
  const choice = url.searchParams.get('choice') || '';
  if (!id || !token || (choice !== 'self' && choice !== 'hol')) {
    return page('Invalid link', 'This link is not valid. Please manage your documents in your landlord portal.', false);
  }
  try {
    const ref = getAdminDb().collection('complianceDocs').doc(id);
    const snap = await ref.get();
    const data = snap.exists ? (snap.data() || {}) : null;
    if (!data || data.actionToken !== token) {
      return page('Link expired', 'This link has expired or has already been used. You can manage your documents in your landlord portal.', false);
    }
    const typeLabel = COMPLIANCE_TYPE_MAP[data.type]?.label || 'certificate';
    const propertyLabel = String(data.propertyLabel || 'your property');

    if (choice === 'hol') {
      await sendEmail(
        OFFICE_EMAIL,
        `Renewal request: ${typeLabel} — ${propertyLabel}`,
        `<div style="font-family:Arial,sans-serif;color:#0a162f;font-size:14px;line-height:1.7">
          <h2 style="font-size:17px">Landlord renewal request</h2>
          <p><strong>${String(data.landlordName || 'A landlord')}</strong> has asked House of Lettings to arrange the renewal of their compliance certificate.</p>
          <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
            <tr><td style="color:#6b7280">Document</td><td><strong>${typeLabel}</strong></td></tr>
            <tr><td style="color:#6b7280">Property</td><td>${propertyLabel} ${data.postcode ? `(${data.postcode})` : ''}</td></tr>
            <tr><td style="color:#6b7280">Expiry date</td><td>${String(data.expiryDate || '—')}</td></tr>
            <tr><td style="color:#6b7280">Landlord</td><td>${String(data.landlordName || '—')}</td></tr>
            <tr><td style="color:#6b7280">Email</td><td>${String(data.landlordEmail || '—')}</td></tr>
            <tr><td style="color:#6b7280">Phone</td><td>${String(data.landlordPhone || '—')}</td></tr>
          </table>
          <p style="margin-top:16px">Please contact the landlord to arrange the renewal.</p>
        </div>`,
      );
      await ref.set({ arrangeRequestedAt: FieldValue.serverTimestamp(), actionToken: null }, { merge: true });
      return page(
        'Thanks — we\'ll arrange it',
        `We've let our team know you'd like House of Lettings to arrange the renewal of your <strong>${typeLabel}</strong> for ${propertyLabel}. We'll be in touch shortly to organise it.`,
      );
    }

    // choice === 'self'
    await ref.set({ selfArrangeAt: FieldValue.serverTimestamp(), actionToken: null }, { merge: true });
    return page(
      'Noted — thanks',
      `Thanks for letting us know you'll arrange the renewal of your <strong>${typeLabel}</strong> for ${propertyLabel} yourself. Once it's done, upload the new certificate in your portal and we'll track the new expiry date for you.`,
    );
  } catch (e) {
    console.error('compliance/renewal error:', e);
    return page('Something went wrong', 'We could not process that just now. Please try again from your landlord portal.', false);
  }
}
