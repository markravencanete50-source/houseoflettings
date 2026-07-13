'use client';
// components/services/CartBar.tsx
// Sticky bottom bar summarising the basket with a "Proceed to checkout" button.
// Hidden when the basket is empty.
import Link from 'next/link';
import { useCart } from '@/components/services/CartProvider';
import { anyFrom, formatGBP } from '@/lib/serviceCart';

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
            background: 'transparent', color: '#fff', cursor: 'pointer',
            border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 9,
            padding: '13px 20px', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
            whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif",
          }}>
            Cancel order
          </button>
          <Link href="/additional-services/checkout" style={{
            background: '#16a34a', color: '#fff', textDecoration: 'none',
            padding: '14px 30px', borderRadius: 9, fontSize: 14.5, fontWeight: 700, letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}>
            Proceed to checkout →
          </Link>
        </div>
      </div>
    </div>
  );
}
