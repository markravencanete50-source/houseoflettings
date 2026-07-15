'use client';
// components/services/OrderControls.tsx
// The "Add to order" panel shown inside an expanded service card. Lets the
// shopper pick a base variant, tick/step through add-ons and a quantity, see a
// live total, and add the configured service to the basket.
import { useState } from 'react';
import { useCart } from '@/components/services/CartProvider';
import {
  SERVICE_ORDERS, priceLine, formatGBP, newSelection, type OrderSelection,
} from '@/lib/serviceCart';

const BLUE = '#2563eb';
const GREEN = '#16a34a';

// The site-standard CTA size, matching components/layout/ServiceHero.module.css
// (.btn), so "Add to order" matches every other button on the page.
const CTA_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
  padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
  fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700,
  letterSpacing: '.02em', textTransform: 'uppercase',
};

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  // Square icon buttons, sized to the 44px tap-target minimum.
  const btn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 9, border: '1.5px solid #dbe2ea', background: '#fff',
    color: '#0a162f', fontSize: 17, fontWeight: 700, cursor: 'pointer', lineHeight: 1, display: 'flex',
    alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flexShrink: 0,
  };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button type="button" style={{ ...btn, opacity: value <= min ? 0.4 : 1 }} disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease">−</button>
      <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{value}</span>
      <button type="button" style={{ ...btn, opacity: value >= max ? 0.4 : 1 }} disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase">+</button>
    </div>
  );
}

export default function OrderControls({ serviceId }: { serviceId: string }) {
  const cfg = SERVICE_ORDERS[serviceId];
  const { addItem } = useCart();
  const [sel, setSel] = useState<OrderSelection>(() => newSelection(serviceId, ''));
  const [added, setAdded] = useState(false);

  if (!cfg) return null;
  const line = priceLine({ ...sel, uid: 'preview' })!;

  const setAddon = (id: string, val: number) => setSel(s => ({ ...s, addOns: { ...s.addOns, [id]: val } }));

  const add = () => {
    addItem({ ...sel, uid: `${serviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
    setSel(newSelection(serviceId, ''));
    setAdded(true);
    setTimeout(() => setAdded(false), 2600);
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const qtyUnit = cfg.unit ? cfg.unit : 'quantity';

  return (
    <div style={{
      marginTop: 18, border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px',
      background: '#f7f9fc', fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLUE, marginBottom: 14 }}>
        Order this service
      </div>

      {/* Base variant */}
      {cfg.variants && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 8 }}>Option</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cfg.variants.map(v => (
              <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#0a162f' }}>
                <input type="radio" name={`variant-${serviceId}`} checked={sel.variantId === v.id}
                  onChange={() => setSel(s => ({ ...s, variantId: v.id }))} style={{ accentColor: BLUE, width: 16, height: 16 }} />
                <span style={{ flex: 1 }}>{v.label}</span>
                <span style={{ fontWeight: 700, color: '#0a162f' }}>{cfg.from ? 'from ' : ''}{formatGBP(v.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons */}
      {cfg.addOns && cfg.addOns.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 10 }}>Add-ons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cfg.addOns.map(a => {
              const cur = sel.addOns[a.id] || 0;
              if (a.kind === 'toggle') {
                return (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#0a162f' }}>
                    <input type="checkbox" checked={!!cur} onChange={e => setAddon(a.id, e.target.checked ? 1 : 0)}
                      style={{ accentColor: GREEN, width: 16, height: 16 }} />
                    <span style={{ flex: 1 }}>{a.label}</span>
                    <span style={{ fontWeight: 700, color: BLUE }}>+{formatGBP(a.price)}</span>
                  </label>
                );
              }
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#0a162f' }}>
                  <span style={{ flex: 1 }}>{a.label} <span style={{ color: '#64748b', fontWeight: 600 }}>(+{formatGBP(a.price)} each)</span></span>
                  <Stepper value={cur} min={0} max={a.max ?? 20} onChange={v => setAddon(a.id, v)} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ ...label, flex: 1, textTransform: 'none', fontSize: 14, color: '#0a162f', fontWeight: 600 }}>
          {cfg.unit ? `Number of ${cfg.unit}s` : 'Quantity'}
        </span>
        <Stepper value={sel.quantity} min={1} max={50} onChange={v => setSel(s => ({ ...s, quantity: v }))} />
      </div>

      {/* Total + add */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Line total</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0a162f' }}>
            {line.from ? <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>from </span> : null}
            {formatGBP(line.total)}
          </div>
        </div>
        <button type="button" onClick={add} style={{
          ...CTA_STYLE, background: added ? '#15803d' : GREEN, color: '#fff',
          cursor: 'pointer', transition: 'background .18s',
        }}>
          {added ? 'Added to order ✓' : 'Add to order'}
        </button>
      </div>
      {line.from && (
        <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>
          A &ldquo;from&rdquo; price is an estimate. We confirm the final cost before any work begins.
        </p>
      )}
    </div>
  );
}
