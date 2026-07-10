// app/api/service-order/route.ts
// Places an additional-services order: re-prices every line from the canonical
// SERVICE_ORDERS data (never trusts client totals), stores the order in
// Firestore, emails the customer a confirmation and the office a notification,
// and — when Stripe is configured — returns a hosted Checkout URL for payment.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { priceLine, formatGBP, type OrderSelection, type LineBreakdown } from '@/lib/serviceCart';

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to, subject, html }),
  });
  if (!res.ok) console.error('Service-order email failed:', await res.json().catch(() => ({})));
}

function makeRef(): string {
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HOL-${t}${r}`;
}

function linesTableHtml(lines: LineBreakdown[]): string {
  return lines.map(l => {
    const addOns = l.addOns.map(a => `<div style="color:#6b7280;font-size:12.5px">+ ${a.label}${a.count ? ` ×${a.count}` : ''} — ${formatGBP(a.amount)}</div>`).join('');
    const variant = l.variantLabel ? `<div style="color:#6b7280;font-size:12.5px">${l.variantLabel} — ${l.from ? 'from ' : ''}${formatGBP(l.base)}</div>` : '';
    return `<tr>
      <td style="padding:12px;border-bottom:1px solid #eef0f5">
        <div style="font-weight:700;color:#111">${l.name}</div>
        <div style="color:#9ca3af;font-size:12px">${l.categoryTitle}${l.quantity > 1 ? ` · ×${l.quantity}` : ''}</div>
        ${variant}${addOns}
      </td>
      <td style="padding:12px;border-bottom:1px solid #eef0f5;text-align:right;font-weight:700;color:#111;white-space:nowrap">${l.from ? 'from ' : ''}${formatGBP(l.total)}</td>
    </tr>`;
  }).join('');
}

function customerEmailHtml(ref: string, name: string, lines: LineBreakdown[], total: number, hasFrom: boolean) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
  <body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0">
    <div style="max-width:600px;margin:36px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#0a162f,#2563eb);padding:32px 40px;color:#fff">
        <h1 style="margin:0;font-size:22px">Order received</h1>
        <p style="margin:6px 0 0;opacity:.85;font-size:14px">House of Lettings · Additional Services</p>
      </div>
      <div style="padding:32px 40px">
        <p style="font-size:15px;color:#374151">Dear <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#374151;line-height:1.6">Thank you for your order (ref <strong>${ref}</strong>). Here's a summary. Our team will be in touch shortly to arrange everything and confirm any &ldquo;from&rdquo; pricing.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:18px 0">${linesTableHtml(lines)}
          <tr><td style="padding:14px 12px;font-weight:800;color:#0a162f">${hasFrom ? 'Estimated total' : 'Total'} (inc. VAT)</td>
          <td style="padding:14px 12px;text-align:right;font-weight:800;color:#0a162f">${formatGBP(total)}</td></tr>
        </table>
        ${hasFrom ? `<p style="font-size:12.5px;color:#6b7280;line-height:1.6">Some items are &ldquo;from&rdquo; prices — we'll confirm the final cost before any work begins and you're only charged the agreed amount.</p>` : ''}
      </div>
      <div style="background:#f8f9ff;padding:18px 40px;text-align:center;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} House of Lettings Ltd.</div>
    </div>
  </body></html>`;
}

function adminEmailHtml(ref: string, customer: any, lines: LineBreakdown[], total: number, hasFrom: boolean) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
  <body style="font-family:Arial,sans-serif;background:#f4f6f9;margin:0;padding:0">
    <div style="max-width:600px;margin:28px auto;background:#fff;border-radius:14px;overflow:hidden">
      <div style="background:#0a162f;padding:22px 32px;color:#fff"><h2 style="margin:0;font-size:19px">🔔 New service order · ${ref}</h2></div>
      <div style="padding:24px 32px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
          <tr><td style="padding:8px 10px;color:#6b7280;font-weight:600;width:38%">Name</td><td style="padding:8px 10px">${customer.fullName}</td></tr>
          <tr><td style="padding:8px 10px;color:#6b7280;font-weight:600">Email</td><td style="padding:8px 10px">${customer.email}</td></tr>
          <tr><td style="padding:8px 10px;color:#6b7280;font-weight:600">Phone</td><td style="padding:8px 10px">${customer.phone}</td></tr>
          <tr><td style="padding:8px 10px;color:#6b7280;font-weight:600">Postcode</td><td style="padding:8px 10px">${customer.postcode || '-'}</td></tr>
          <tr><td style="padding:8px 10px;color:#6b7280;font-weight:600">Address</td><td style="padding:8px 10px">${customer.address || '-'}</td></tr>
          <tr><td style="padding:8px 10px;color:#6b7280;font-weight:600">Notes</td><td style="padding:8px 10px">${customer.notes || '-'}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${linesTableHtml(lines)}
          <tr><td style="padding:12px;font-weight:800;color:#0a162f">${hasFrom ? 'Estimated total' : 'Total'}</td>
          <td style="padding:12px;text-align:right;font-weight:800;color:#0a162f">${formatGBP(total)}</td></tr>
        </table>
      </div>
    </div>
  </body></html>`;
}

async function createStripeSession(lines: LineBreakdown[], email: string, ref: string, origin: string): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${origin}/additional-services/success?ref=${ref}`);
    params.append('cancel_url', `${origin}/additional-services/checkout`);
    params.append('customer_email', email);
    params.append('client_reference_id', ref);
    lines.forEach((l, i) => {
      params.append(`line_items[${i}][price_data][currency]`, 'gbp');
      params.append(`line_items[${i}][price_data][product_data][name]`, l.name.slice(0, 120));
      params.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(l.unitTotal * 100)));
      params.append(`line_items[${i}][quantity]`, String(l.quantity));
    });
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) { console.error('Stripe session failed:', await res.text()); return null; }
    const data = await res.json();
    return data.url || null;
  } catch (e) {
    console.error('Stripe error:', e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: OrderSelection[] = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};

    for (const f of ['fullName', 'email', 'phone']) {
      if (!customer[f]?.toString().trim()) return Response.json({ message: `${f} is required` }, { status: 400 });
    }

    // Re-price from canonical data — the client total is ignored.
    const lines = items.map(priceLine).filter((l): l is LineBreakdown => !!l);
    if (lines.length === 0) return Response.json({ message: 'Your order is empty.' }, { status: 400 });

    const total = lines.reduce((s, l) => s + l.total, 0);
    const hasFrom = lines.some(l => l.from);
    const ref = makeRef();
    const origin = new URL(request.url).origin;

    // Store the order (best-effort; never block the response on Firestore).
    try {
      await getDb().collection('serviceOrders').add({
        ref,
        customer: {
          fullName: customer.fullName, email: customer.email, phone: customer.phone,
          postcode: customer.postcode || '', address: customer.address || '', notes: customer.notes || '',
        },
        lines: lines.map(l => ({
          serviceId: l.serviceId, name: l.name, categoryTitle: l.categoryTitle,
          variantLabel: l.variantLabel || null, base: l.base, from: l.from,
          addOns: l.addOns, quantity: l.quantity, total: l.total,
        })),
        total, hasFrom, status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('serviceOrders write failed:', e);
    }

    // Notify customer + office.
    await Promise.allSettled([
      sendEmail({ to: customer.email, subject: `Order received (${ref}) | House of Lettings`, html: customerEmailHtml(ref, customer.fullName, lines, total, hasFrom) }),
      sendEmail({ to: process.env.ADMIN_EMAIL || 'admin@houseoflettings.co.uk', subject: `🔔 New service order: ${ref} · ${formatGBP(total)}`, html: adminEmailHtml(ref, customer, lines, total, hasFrom) }),
    ]);

    // Payment: Stripe hosted checkout when configured, otherwise invoice mode.
    const checkoutUrl = await createStripeSession(lines, customer.email, ref, origin);

    return Response.json({ ok: true, ref, total, checkoutUrl }, { status: 201 });
  } catch (e) {
    console.error('service-order error:', e);
    return Response.json({ message: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
