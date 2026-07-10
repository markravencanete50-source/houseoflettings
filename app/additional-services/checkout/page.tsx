'use client';
// app/additional-services/checkout/page.tsx
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import { useCart } from '@/components/services/CartProvider';
import { priceLine, formatGBP, anyFrom } from '@/lib/serviceCart';

const BLUE = '#2563eb';

// Appointment-based services: when any of these is in the order we offer the
// landlord a "Property Inspection" slot from the office calendar.
const INSPECTION_SERVICE_IDS = new Set([
  'inventory-handover', 'check-out', 'check-comparison', 'mid-tenancy-inspection', 'virtual-inspection',
]);

type Prop = { postcode: string; address: string };
type Insp = { date: string; time: string };

const input: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: '#fff', border: '1.5px solid #e5e7eb',
  borderRadius: 8, color: '#111827', fontSize: 14, fontFamily: "'Poppins', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px' };

function isoLondonToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
}
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// ── One property address field, backed by Google Places autocomplete ──
function PropertyField({ propKey, value, onChange }: {
  propKey: string;
  value: Prop | undefined;
  onChange: (key: string, patch: Partial<Prop>) => void;
}) {
  const onSelect = useCallback((addr: AddressResult) => {
    onChange(propKey, {
      postcode: addr.postcode || '',
      address: [addr.street, addr.city, addr.county].filter(Boolean).join(', '),
    });
  }, [onChange, propKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={label}>Property postcode</label>
        <PostcodeLookup
          postcode={value?.postcode || ''}
          onPostcodeChange={(pc) => onChange(propKey, { postcode: pc })}
          onSelect={onSelect}
          inputStyle={input}
          placeholder="Start typing a postcode or address"
        />
      </div>
      <div>
        <label style={label}>Property address</label>
        <input
          style={input}
          value={value?.address || ''}
          onChange={(e) => onChange(propKey, { address: e.target.value })}
          placeholder="12 Oak Street, Headingley, Leeds"
        />
      </div>
    </div>
  );
}

// ── "Property Inspection" appointment picker (calendar-driven) ──
function InspectionScheduler({ value, onChange }: { value: Insp; onChange: (v: Insp) => void }) {
  const [dates, setDates] = useState<string[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loadingDates, setLoadingDates] = useState(true);
  const [slots, setSlots] = useState<{ time: string; status: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const today = isoLondonToday();
    fetch(`/api/inspection-availability?from=${today}&days=60`)
      .then((r) => r.json())
      .then((d) => { setDates(Array.isArray(d.dates) ? d.dates : []); setConfigured(d.configured !== false); })
      .catch(() => { /* ignore */ })
      .finally(() => setLoadingDates(false));
  }, []);

  const pickDate = (date: string) => {
    onChange({ date, time: '' });
    setLoadingSlots(true);
    setSlots([]);
    fetch(`/api/inspection-availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(Array.isArray(d.slots) ? d.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  };

  const noAvailability = !loadingDates && (!configured || dates.length === 0);

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0a162f', margin: '0 0 4px' }}>Preferred inspection appointment</h2>
      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
        Optional. Pick a date and time that suits you from our published inspection availability. We&rsquo;ll confirm it with you.
      </p>

      {loadingDates && <p style={{ color: '#64748b', fontSize: 13 }}>Loading available times&hellip;</p>}

      {noAvailability && (
        <div style={{ background: '#f7f9fc', border: '1px dashed #d3dae4', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          We don&rsquo;t have inspection slots published right now. Place your order and our team will contact you to arrange a convenient time.
        </div>
      )}

      {!loadingDates && configured && dates.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Choose a date</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: value.date ? 16 : 0 }}>
            {dates.map((d) => {
              const active = value.date === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDate(d)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${active ? BLUE : '#dbe2ea'}`,
                    background: active ? BLUE : '#fff', color: active ? '#fff' : '#0a162f',
                  }}
                >
                  {fmtDate(d)}
                </button>
              );
            })}
          </div>

          {value.date && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '4px 0 8px' }}>Choose a time</div>
              {loadingSlots ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>Loading times&hellip;</p>
              ) : slots.filter((s) => s.status === 'available').length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>No times left on this date. Try another date.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
                  {slots.filter((s) => s.status === 'available').map((s) => {
                    const active = value.time === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => onChange({ date: value.date, time: s.time })}
                        style={{
                          padding: '10px 6px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${active ? BLUE : '#dbe2ea'}`,
                          background: active ? BLUE : '#fff', color: active ? '#fff' : '#0a162f',
                        }}
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              )}
              {value.time && (
                <button
                  type="button"
                  onClick={() => onChange({ date: '', time: '' })}
                  style={{ marginTop: 12, background: 'none', border: 'none', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Clear selected appointment
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, ready, updateItem, removeItem, clear } = useCart();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', notes: '' });
  const [sameProperty, setSameProperty] = useState(true);
  const [props, setProps] = useState<Record<string, Prop>>({});
  const [insp, setInsp] = useState<Insp>({ date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const updateProp = useCallback((key: string, patch: Partial<Prop>) => {
    setProps((prev) => {
      const cur = prev[key] || { postcode: '', address: '' };
      return { ...prev, [key]: { ...cur, ...patch } };
    });
  }, []);

  const multi = items.length > 1;
  const perItem = multi && !sameProperty;
  const hasInspection = items.some((it) => INSPECTION_SERVICE_IDS.has(it.serviceId));

  // Build the property assignment list sent to the server.
  const buildProperties = () => {
    if (!perItem) {
      const p = props['shared'] || { postcode: '', address: '' };
      return [{ label: multi ? 'All services' : (priceLine(items[0])?.name || 'Service'), postcode: p.postcode.trim(), address: p.address.trim() }];
    }
    return items.map((it) => {
      const p = props[it.uid] || { postcode: '', address: '' };
      return { serviceId: it.serviceId, label: priceLine(it)?.name || it.serviceId, postcode: p.postcode.trim(), address: p.address.trim() };
    });
  };

  const submit = async () => {
    setError('');
    for (const [, v] of Object.entries({ fullName: form.fullName, email: form.email, phone: form.phone })) {
      if (!v.trim()) { setError('Please fill in your name, email and phone.'); return; }
    }
    if (!/.+@.+\..+/.test(form.email)) { setError('Please enter a valid email address.'); return; }

    const properties = buildProperties();
    if (properties.some((p) => !p.postcode)) {
      setError(perItem
        ? 'Please enter the property postcode for each service so we know which property to attend.'
        : 'Please enter the property postcode.');
      return;
    }

    const first = properties[0];
    setSubmitting(true);
    try {
      const res = await fetch('/api/service-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: { ...form, postcode: first.postcode, address: first.address },
          properties,
          inspection: hasInspection && insp.date ? insp : null,
        }),
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
            <p style={{ color: '#64748b' }}>Loading your order&hellip;</p>
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
                {items.map((it) => {
                  const line = priceLine(it);
                  if (!line) return null;
                  return (
                    <div key={it.uid} style={{ padding: '18px 0', borderBottom: '1px solid #eef1f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{line.categoryTitle}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#0a162f', margin: '2px 0 6px' }}>{line.name}</div>
                          {line.variantLabel && <div style={{ fontSize: 13, color: '#475569' }}>{line.variantLabel} — {line.from ? 'from ' : ''}{formatGBP(line.base)}</div>}
                          {line.addOns.map((a) => (
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

              {/* Right column: property, inspection, your details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Property / properties */}
                <div style={cardStyle}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0a162f', margin: '0 0 4px' }}>
                    {perItem ? 'Which property is each service for?' : 'Which property is this for?'}
                  </h2>
                  <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
                    So we know exactly which property to attend.
                  </p>

                  {multi && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', marginBottom: 16, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                      <input
                        type="checkbox"
                        checked={sameProperty}
                        onChange={(e) => setSameProperty(e.target.checked)}
                        style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span>All of these services are for the <strong>same property</strong>.</span>
                    </label>
                  )}

                  {!perItem ? (
                    <PropertyField propKey="shared" value={props['shared']} onChange={updateProp} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {items.map((it, i) => {
                        const line = priceLine(it);
                        return (
                          <div key={it.uid} style={{ paddingTop: i === 0 ? 0 : 16, borderTop: i === 0 ? 'none' : '1px solid #eef1f5' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                              Property {i + 1} · {line?.name || 'Service'}
                            </div>
                            <PropertyField propKey={it.uid} value={props[it.uid]} onChange={updateProp} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Inspection appointment (only when the order contains one) */}
                {hasInspection && <InspectionScheduler value={insp} onChange={setInsp} />}

                {/* Customer details */}
                <div style={cardStyle}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0a162f', margin: '0 0 16px' }}>Your details</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><label style={label}>Full name</label><input style={input} value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Jane Smith" /></div>
                    <div><label style={label}>Email</label><input style={input} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="jane@example.com" /></div>
                    <div><label style={label}>Phone</label><input style={input} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07700 000000" /></div>
                    <div><label style={label}>Notes <span style={{ color: '#9ca3af' }}>(optional)</span></label><textarea style={{ ...input, minHeight: 74, resize: 'vertical' }} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Anything we should know (access, timings, appliance counts)…" /></div>

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
            </div>
          )}
        </div>
      </div>

      <Footer />

      <style>{`@media (max-width: 780px){ .co-grid{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

const stepBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: '1.5px solid #dbe2ea', background: '#fff',
  color: '#0a162f', fontSize: 16, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
};
