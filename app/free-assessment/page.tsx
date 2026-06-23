'use client';
// app/free-assessment/page.tsx
import Navbar from '@/components/layout/Navbar';

export default function FreeAssessmentPage() {
  return (
    <>
      <Navbar />

      <section style={{
        background: '#f7f8fa',
        minHeight: '100vh',
        padding: 'calc(var(--navbar-height, 72px) + 24px) 3% 40px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <iframe
            src="https://landlord-matching.vercel.app/full-assessment?embed=true"
            title="Get My Free Assessment"
            style={{
              width: '100%',
              height: 'calc(100vh - 100px)',
              minHeight: 800,
              border: 'none',
              display: 'block',
            }}
            loading="lazy"
          />
        </div>
      </section>
    </>
  );
}
