'use client';
// components/layout/MobileFAB.tsx
// Floating action pill shown on mobile (<=768px) only. Two quick actions:
// Find Home -> browse listings, List Property -> book a free valuation.
// Matches the redesign spec: navy pill, 40px radius, pale-blue Lucide icons.
import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function MobileFAB() {
  return (
    <div className="hol-fab" role="navigation" aria-label="Quick actions">
      <Link href="/listings" className="hol-fab__btn">
        <Search size={13} strokeWidth={2} aria-hidden />
        Find Home
      </Link>
      <span className="hol-fab__div" aria-hidden />
      <Link href="/book-valuation" className="hol-fab__btn">
        <Home size={13} strokeWidth={2} aria-hidden />
        List Property
      </Link>

      <style>{`
        .hol-fab {
          position: fixed;
          bottom: 22px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 900;
          background: #0f1f3d;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 40px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          display: none;
          align-items: stretch;
          overflow: hidden;
        }
        .hol-fab__btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 13px 22px;
          font-family: 'Poppins', sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #fff;
          text-decoration: none;
          white-space: nowrap;
        }
        .hol-fab__btn svg { color: #7aa5f0; }
        .hol-fab__div { width: 1px; background: rgba(255,255,255,0.15); margin: 10px 0; }
        @media (max-width: 768px) {
          .hol-fab { display: flex; }
        }
      `}</style>
    </div>
  );
}
