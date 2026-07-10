'use client';
// app/additional-services/checkout/page.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useCart } from '@/components/services/CartProvider';
import { priceLine, formatGBP, anyFrom } from '@/lib/serviceCart';

const BLUE = '#2563eb';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, ready, updateItem, removeItem, clear } = useCart();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', postcode: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }));

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 14px', background: '#fff', border: '1.5px solid #e5e7eb',
    borderRadius: 8, color: '#111827', fontSize: 14, fontFamily: "'Poppins', sans-serif",
    outline: 'none', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };

  const submit = async () => {
    setError('');
    for (const [k, v] of Object.entries({ fullName: form.fullName, email: form.email, phone: form.phone, postcode: form.postcode })) {
      if (!v.trim()) { setError('Please fill in your name, email, phone and postcode.'); return; }
    }
    if (!/.+@.+\..+/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/service-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customer: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Something went wrong. Please try again.');
      if (json.checkoutUrl) { window.location.href = json.checkoutUrl; return; } // Stripe hosted checkout
      clear();
      router.push(`/additional-services/success?ref=${encodeURIComponent(json.ref || '')}`);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 96, minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 5% 80px' }}>
          <Link href="/additional-services" style={{ fontSize: 13, color: BLUE, fontWeight: 600, textDecoration: 'none' }}>← Back to services</Link>
          <h1 style={{ fontSize: 'clamp(26px,3.4vw,38px)', fontWeight: 800, color: '#0a162f', margin: '10px 0 6px' }}>Checkout</h1>
          <p style={{ color: '#475569', fontSize: 15, margin: '0 0 28px' }}>Review your order and enter your details. All prices include VAT.</p>

          {!ready ? (
            <p style={{ color: '#64748b' }}>Loading your order…</p>
          ) : items.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 46, marginBottom: 12 }}>🛒</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0a162f', marginBottom: 8 }}>Your order is empty</h2>
              <p style={{ color: '#64748b', fontSize: 15, marginBottom: 22 }}>Add one or more services to get started.</p>
              <Link href="/additional-services" style={{ background: BLUE, color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: 9, fontSize: 14, fontWeight: 700 }}>Browse services</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }} className="co-grid">
              {/* Order summary */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '8px 22px 18px' }}>
                {items.map(it => {
                  const line = priceLine(it);
                  if (!line) return null;
                  return (
                    <div key={it.uid} style={{ padding: '18px 0', borderBottom: '1px solid #eef1f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{line.categoryTitle}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#0a162f', margin: '2px 0 6px' }}>{line.name}</div>
                          {line.variantLabel && <div style={{ fontSize: 13, color: '#475569' }}>{line.variantLabel} — {line.from ? 'from ' : ''}{formatGBP(line.base)}</div>}
                          {line.addOns.map(a => (
                            <div key={a.id} style={{ fontSize: 13, color: '#475569' }}>+ {a.label}{a.count ? ` ×${a.count}` : ''} — {formatGBP(a.amount)}</div>
                          ))}
                          {line.kind === 'package' && (
                            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                              One-time setup fee{line.ongoingNote ? `, ${line.ongoingNote}` : ''}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: '#0a162f' }}>{line.from ? <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>from </span> : null}{formatGBP(line.total)}</div>
                          <button onClick={() => removeItem(it.uid)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                        <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>{line.unit ? `${line.unit[0].toUpperCase()}${line.unit.slice(1)}s` : 'Qty'}</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateItem(it.uid, { quantity: Math.max(1, it.quantity - 1) })} style={stepBtn} aria-label="Decrease">−</button>
                          <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{it.quantity}</span>
                          <button onClick={() => updateItem(it.uid, { quantity: Math.min(50, it.quantity + 1) })} style={stepBtn} aria-label="Increase">+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0a162f' }}>{anyFrom(items) ? 'Estimated total' : 'Total'} (inc. VAT)</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#0a162f' }}>{formatGBP(total)}</span>
                </div>
                {anyFrom(items) && (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0', lineHeight: 1.55 }}>
                    Some items are &ldquo;from&rdquo; prices. We confirm the final cost before any work begins; you are only charged the agreed amount.
                  </p>
                )}
              </div>

              {/* Customer details */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0a162f', margin: '0 0 16px' }}>Your details</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label style={label}>Full name</label><input style={input} value={form.fullName} onChange={e => set({ fullName: e.target.value })} placeholder="Jane Smith" /></div>
                  <div><label style={label}>Email</label><input style={input} type="email" value={form.email} onChange={e => set({ email: e.target.value })} placeholder="jane@example.com" /></div>
                  <div><label style={label}>Phone</label><input style={input} type="tel" value={form.phone} onChange={e => set({ phone: e.target.value })} placeholder="07700 000000" /></div>
                  <div><label style={label}>Property postcode</label><input style={input} value={form.postcode} onChange={e => set({ postcode: e.target.value })} placeholder="LS1 1AA" /></div>
                  <div><label style={label}>Property address <span style={{ color: '#9ca3af' }}>(optional)</span></label><input style={input} value={form.address} onChange={e => set({ address: e.target.value })} placeholder="12 Oak Street" /></div>
                  <div><label style={label}>Notes <span style={{ color: '#9ca3af' }}>(optional)</span></label><textarea style={{ ...input, minHeight: 74, resize: 'vertical' }} value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Anything we should know (access, timings, appliance counts)…" /></div>

                  {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '11px 14px', color: '#dc2626', fontSize: 13 }}>{error}</div>}

                  <button onClick={submit} disabled={submitting} style={{
                    width: '100%', padding: '15px', background: submitting ? '#93c5fd' : BLUE, color: '#fff', border: 'none',
                    borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', letterSpacing: '0.02em',
                  }}>
                    {submitting ? 'Placing your order…' : `Place order · ${formatGBP(total)}`}
                  </button>
                  <p style={{ fontSize: 11.5, color: '#9ca3af', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    You&rsquo;ll get an email confirmation, and our team is notified straight away. Secure card payment is taken where enabled; otherwise we send a payment link with your confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@media (max-width: 780px){ .co-grid{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

const stepBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: '1.5px solid #dbe2ea', background: '#fff',
  color: '#0a162f', fontSize: 16, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
};
