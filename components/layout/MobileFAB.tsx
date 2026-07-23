'use client';

import { useState, lazy, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const ValuationModal = lazy(() => import('@/components/ValuationModal'));

// The long multi-step forms are hidden behind this bar's fixed position at the
// bottom of the screen, and a stray "Book a Valuation" mid-application is a
// distraction rather than a shortcut, so the FAB is suppressed on them.
// It's also hidden on the listings pages, where it overlaps the property cards
// and its "Search Properties" link just points back to the page you're on, and
// on additional-services, where it overlaps the sticky cart / order bar.
const HIDDEN_ON = ['/tenant-application', '/guarantor', '/landlord-registration', '/listings', '/additional-services'];

export default function MobileFAB() {
  const pathname = usePathname();
  const [valuationOpen, setValuationOpen] = useState(false);

  // Matches the route and everything under it (e.g. /landlord-registration/apply).
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hidden) return null;

  return (
    <>
      <style>{`
        .hol-fab {
          display: none;
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          z-index: 999;
          max-width: calc(100vw - 16px);
          background: #0f1f3d; border-radius: 40px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
        }
        @media (max-width: 768px) {
          .hol-fab { display: flex; }
        }
        .hol-fab a, .hol-fab button {
          padding: 12px 16px; font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.3px; text-transform: uppercase;
          color: #fff; text-decoration: none; white-space: nowrap;
          font-family: 'Poppins', sans-serif;
          border: none; background: none; cursor: pointer;
          transition: background 0.2s;
        }
        @media (max-width: 380px) {
          .hol-fab a, .hol-fab button { padding: 11px 12px; font-size: 10.5px; letter-spacing: 0.2px; }
        }
        .hol-fab a:hover, .hol-fab button:hover { background: rgba(255,255,255,0.08); }
        .hol-fab .fab-divider {
          width: 1px; background: rgba(255,255,255,0.15);
          align-self: stretch; margin: 10px 0;
        }
      `}</style>
      <div className="hol-fab">
        <Link href="/listings">🔍 Search Properties</Link>
        <div className="fab-divider" />
        <button onClick={() => setValuationOpen(true)}>📋 Book a Valuation</button>
        <Suspense fallback={null}>
          {valuationOpen && <ValuationModal isOpen={valuationOpen} onClose={() => setValuationOpen(false)} />}
        </Suspense>
      </div>
    </>
  );
}
