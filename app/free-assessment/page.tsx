'use client';
// app/free-assessment/page.tsx
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

export default function FreeAssessmentPage() {
  return (
    <>
      <Navbar />

      <section style={{
        background: '#0f1f3d',
        padding: 'calc(var(--navbar-height, 72px) + 40px) 5% 60px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 16,
          }}>
            Get My Free Assessment
          </h1>
          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7,
            maxWidth: 540, margin: '0 auto',
          }}>
            A free, no-obligation assessment of your property and how much hassle-free management could save you.
          </p>
        </div>
      </section>

      <section style={{ background: '#f7f8fa', padding: 'clamp(40px, 6vw, 64px) 0' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto', padding: '0 5%',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
          }}>
            <iframe
              src="https://landlord-matching.vercel.app/#assessment"
              title="Get My Free Assessment"
              style={{
                width: '100%',
                height: '900px',
                border: 'none',
                display: 'block',
              }}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <footer style={{
        background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(24px, 4vw, 36px) clamp(20px, 5%, 5%)',
        textAlign: 'center',
      }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none' }}>
          &larr; Back to House of Lettings
        </Link>
      </footer>
    </>
  );
}
