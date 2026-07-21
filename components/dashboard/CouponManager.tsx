'use client';
// components/dashboard/CouponManager.tsx
// Issue and track one-time discount coupons for the landlord agreement.
// Staff/admin pick one of the five services, enter a fixed £ discount (not a
// percentage) and the calculator shows the resulting setup fee (£399 − £100 =
// £299). Generating produces a single-use code the landlord types into the
// sign form; redemption is atomic server-side so a code can never be used twice.
import { useEffect, useState } from 'react';
import { BUNDLES } from '@/lib/bundles';
import { setupFeeAmount } from '@/lib/agreementContent';

type Coupon = {
  code: string;
  bundleId: string;
  bundleLabel: string;
  setupFee: number;
  discount: number;
  finalFee: number;
  note?: string;
  status: 'active' | 'used' | 'cancelled';
  usedBy?: { name?: string; email?: string };
  createdAt?: string | null;
  usedAt?: string | null;
};

export default function CouponManager({
  authedFetch,
  onClose,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [bundleId, setBundleId] = useState('');
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const [newCoupon, setNewCoupon] = useState<Coupon | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authedFetch('/api/staff/coupons')
      .then(r => r.json())
      .then(j => { if (!cancelled) setCoupons(j.coupons || []); })
      .catch(() => { /* ignore */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authedFetch]);

  const bundle = BUNDLES.find(b => b.id === bundleId);
  const setup = bundle ? setupFeeAmount(bundle) : 0;
  const amt = Math.floor(Number(discount)) || 0;
  const valid = !!bundle && amt > 0 && amt < setup;

  const create = async () => {
    if (!valid) { setErr(!bundle ? 'Choose a service first.' : 'Enter a discount smaller than the setup fee.'); return; }
    setCreating(true);
    setErr('');
    setNewCoupon(null);
    try {
      const res = await authedFetch('/api/staff/coupons', {
        method: 'POST',
        body: JSON.stringify({ bundleId, discount: amt, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || 'Could not create the coupon.');
      setNewCoupon(j.coupon);
      setCoupons(cs => [j.coupon, ...cs]);
      setDiscount('');
      setNote('');
    } catch (e: any) {
      setErr(e.message || 'Could not create the coupon.');
    } finally {
      setCreating(false);
    }
  };

  const deactivate = async (code: string) => {
    if (!confirm(`Deactivate coupon ${code}? The landlord will no longer be able to use it.`)) return;
    try {
      const res = await authedFetch('/api/staff/coupons', { method: 'PATCH', body: JSON.stringify({ code, action: 'deactivate' }) });
      if (!res.ok) throw new Error('failed');
      setCoupons(cs => cs.map(c => c.code === code ? { ...c, status: 'cancelled' } : c));
      if (newCoupon?.code === code) setNewCoupon(null);
    } catch {
      alert('Could not deactivate. Please try again.');
    }
  };

  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };

  const STATUS_STYLE: Record<Coupon['status'], { bg: string; color: string; label: string }> = {
    active:    { bg: '#e8f5e9', color: '#2e7d32', label: 'Active' },
    used:      { bg: '#e3f2fd', color: '#1565c0', label: 'Used' },
    cancelled: { bg: '#fce4ec', color: '#c62828', label: 'Cancelled' },
  };

  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 className="dash-section-title" style={{ margin: 0 }}>Discount coupons</h1>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--gray-600)' }}>← Back to agreements</button>
      </div>
      <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 14.5, lineHeight: 1.55 }}>
        Issue a one-time discount for a specific landlord. The discount is a fixed amount in pounds off the package&rsquo;s setup fee — the landlord enters the code when signing their agreement, and the code stops working the moment it is used.
      </p>

      {/* ── Creator ── */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 14 }}>Create a coupon</div>

        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>1 · Choose the service</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 16 }}>
          {BUNDLES.map(b => {
            const active = bundleId === b.id;
            return (
              <button key={b.id} onClick={() => setBundleId(b.id)} style={{
                textAlign: 'left', border: `2px solid ${active ? '#2563eb' : 'var(--gray-200)'}`,
                background: active ? '#f5f8ff' : '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>{b.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 3 }}>{b.setupFee} setup{b.mgmtFee ? ` · ${b.mgmtFee}/mo` : ''}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>2 · Discount amount (£, not %)</div>
            <input style={inp} inputMode="numeric" placeholder="e.g. 100" value={discount}
              onChange={e => setDiscount(e.target.value.replace(/[^\d]/g, ''))} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8 }}>3 · Landlord / note (optional)</div>
            <input style={inp} placeholder="e.g. John Smith — agreed at valuation" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {/* Live calculator */}
        <div style={{
          marginTop: 16, padding: '14px 18px', borderRadius: 10,
          background: valid ? '#f0fdf4' : '#f8fafc', border: `1px solid ${valid ? '#bbf7d0' : 'var(--gray-200)'}`,
          fontSize: 15, fontWeight: 700, color: valid ? '#15803d' : 'var(--gray-400)', transition: 'background .2s, border-color .2s',
        }}>
          {bundle
            ? (amt > 0
              ? (amt < setup
                ? <>£{setup} − £{amt} = <span style={{ fontSize: 19 }}>£{setup - amt}</span> <span style={{ fontWeight: 500, fontSize: 13 }}>setup fee for {bundle.label}</span></>
                : <span style={{ color: '#b91c1c' }}>The discount must be less than the £{setup} setup fee.</span>)
              : <>Setup fee £{setup} — enter the discount to see the final price.</>)
            : 'Select a service to start the calculator.'}
        </div>

        {err && <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 13.5, fontWeight: 600 }}>{err}</div>}

        <button onClick={create} disabled={creating || !valid} style={{
          marginTop: 14, background: valid ? '#2563eb' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 9,
          padding: '12px 24px', fontSize: 14.5, fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed', transition: 'background .2s',
        }}>
          {creating ? 'Generating…' : '🎟️ Generate coupon code'}
        </button>

        {newCoupon && (
          <div style={{ marginTop: 16, padding: '18px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#0a162f,#2563eb)', color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: .8, marginBottom: 6 }}>Coupon created — share this code with the landlord (one-time use):</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, letterSpacing: '.06em' }}>{newCoupon.code}</span>
              <button onClick={() => copy(newCoupon.code)} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.35)', borderRadius: 7, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize: 13, marginTop: 8, opacity: .9 }}>{newCoupon.bundleLabel}: £{newCoupon.setupFee} − £{newCoupon.discount} = <strong>£{newCoupon.finalFee}</strong> setup fee{newCoupon.note ? ` · ${newCoupon.note}` : ''}</div>
          </div>
        )}
      </div>

      {/* ── List ── */}
      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--navy)', borderBottom: '1px solid var(--gray-100)' }}>
          Issued coupons ({coupons.length})
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>Loading coupons…</div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>No coupons issued yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  {['Code', 'Service', 'Discount', 'Final fee', 'Status', 'For / used by', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11.5, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => {
                  const st = STATUS_STYLE[c.status] || STATUS_STYLE.active;
                  return (
                    <tr key={c.code} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{c.code}</td>
                      <td style={{ padding: '10px 14px' }}>{c.bundleLabel}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>−£{c.discount}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>£{c.finalFee}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--gray-600)', maxWidth: 220 }}>
                        {c.status === 'used' && c.usedBy?.name ? `${c.usedBy.name}${c.usedBy.email ? ` (${c.usedBy.email})` : ''}` : (c.note || '-')}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {c.status === 'active' && (
                          <button onClick={() => deactivate(c.code)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Deactivate</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
