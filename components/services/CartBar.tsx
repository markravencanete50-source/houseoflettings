'use client';
// components/services/CartBar.tsx
// Sticky bottom bar summarising the basket with a "Proceed to checkout" button.
// Hidden when the basket is empty.
import Link from 'next/link';
import { useCart } from '@/components/services/CartProvider';
import { anyFrom, formatGBP } from '@/lib/serviceCart';

// The site-standard CTA size, matching components/layout/ServiceHero.module.css
// (.btn). Both bar buttons share it so they measure the same side by side.
const CTA_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
  padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
  fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700,
  letterSpacing: '.02em', textTransform: 'uppercase', textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export default function CartBar() {
  const { items, count, total, ready, clear } = useCart();
  if (!ready || count === 0) return null;

  const cancel = () => {
    if (window.confirm('Cancel your order and remove all services?')) clear();
  };

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 200,
      background: '#0a162f', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 -10px 30px rgba(10,22,47,0.28)', fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '14px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span style={{ fontSize: 26 }}>🛒</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {count} service{count !== 1 ? 's' : ''} in your order
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {anyFrom(items) ? 'Estimated total ' : 'Total '}
              <strong style={{ color: '#fff' }}>{formatGBP(total)}</strong>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}> inc. VAT</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button type="button" onClick={cancel} style={{
            ...CTA_STYLE,
            background: 'transparent', color: '#fff', cursor: 'pointer',
            borderColor: 'rgba(255,255,255,0.35)',
          }}>
            Cancel order
          </button>
          <Link href="/additional-services/checkout" style={{
            ...CTA_STYLE,
            background: '#16a34a', color: '#fff',
          }}>
            Proceed to checkout →
          </Link>
        </div>
      </div>
    </div>
  );
}
