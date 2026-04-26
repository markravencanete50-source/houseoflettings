"use client";

import { useState, lazy, Suspense } from "react";

const ValuationModal = lazy(() => import("./ValuationModal"));

export default function ValuationCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '16px 36px',
          background: 'linear-gradient(135deg, #1a3c5e 0%, #2563a8 100%)',
          color: '#fff', border: 'none', borderRadius: 4,
          fontSize: 14, fontWeight: 600, letterSpacing: '0.5px',
          textTransform: 'uppercase', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(37,99,168,0.45)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(37,99,168,0.55)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(37,99,168,0.45)';
        }}
      >
        Book a Valuation
      </button>

      <Suspense fallback={null}>
        {open && <ValuationModal isOpen={open} onClose={() => setOpen(false)} />}
      </Suspense>
    </>
  );
}
