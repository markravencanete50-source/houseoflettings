'use client';
// app/maintenance/page.tsx
// Informational page: explains how House of Lettings handles maintenance,
// the step-by-step process, and FAQs. The actual report form lives at
// /maintenance/report.
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';

const steps = [
  {
    num: '01',
    title: 'You report the issue',
    body: 'Tell us what’s wrong through our maintenance form. Add a short description and a few photos so we can see the problem clearly.',
  },
  {
    num: '02',
    title: 'We review & coordinate with the landlord',
    body: 'Our team assesses the report and contacts the landlord to make them aware of the issue and the repair needed.',
  },
  {
    num: '03',
    title: 'The landlord approves the work',
    body: 'Once the landlord has been informed and has agreed to the repair, we’re cleared to arrange the fix.',
  },
  {
    num: '04',
    title: 'We instruct our contractor',
    body: 'We contact one of our trusted, vetted contractors and brief them on the issue, the property, and your availability.',
  },
  {
    num: '05',
    title: 'The contractor visits & fixes it',
    body: 'The contractor attends the property at an agreed time to carry out the repair and put things right.',
  },
  {
    num: '06',
    title: 'We confirm it’s resolved',
    body: 'We follow up to make sure the repair was completed properly and that you’re happy the issue is sorted.',
  },
];

const faqs = [
  {
    q: 'How do I report a maintenance issue?',
    a: 'Use our online maintenance form. Add a short description, tell us when it started and your availability, and upload at least a few photos of the problem. That gives us everything we need to act quickly.',
  },
  {
    q: 'What happens after I submit my report?',
    a: 'You’ll receive a confirmation email with a PDF copy of your report. Our team then reviews it and coordinates with the landlord before arranging a contractor to carry out the repair.',
  },
  {
    q: 'Why do you need the landlord to approve the repair first?',
    a: 'The landlord owns the property and is responsible for authorising repair costs. We keep them informed and get their agreement before instructing a contractor. For anything non-emergency, this keeps everything transparent and above board.',
  },
  {
    q: 'How long will the repair take?',
    a: 'Timescales depend on the type of issue, landlord approval, and contractor availability. We always aim to move as quickly as possible and keep you updated at each stage.',
  },
  {
    q: 'What counts as an emergency?',
    a: 'Gas leaks, flooding, electrical danger, a total loss of heating or hot water in winter, or anything that puts safety or the property at serious risk. For emergencies, please call us directly as well as submitting the form so we can respond immediately.',
  },
  {
    q: 'Who pays for the repair?',
    a: 'Genuine wear-and-tear and property faults are the landlord’s responsibility. Where damage has been caused by the tenant, costs may be recharged. We’ll always be clear with you about this before work goes ahead.',
  },
  {
    q: 'Can I arrange my own contractor?',
    a: 'Please don’t arrange repairs yourself without speaking to us first. Report the issue and let us coordinate it. That protects you, keeps the landlord informed, and makes sure the work is done to the right standard.',
  },
];

export default function MaintenancePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh', color: '#111827', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          backgroundImage:
            'linear-gradient(160deg, rgba(2,11,26,0.82) 0%, rgba(4,18,48,0.78) 60%, rgba(6,26,66,0.72) 100%), url(/images/Tenants_Book_viewing_background.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'calc(68px + 90px) 24px 90px', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block', border: '1.5px solid rgba(37,99,235,0.8)', borderRadius: 999,
              padding: '7px 20px', fontSize: 13, fontWeight: 700, color: '#bfdbfe', letterSpacing: '0.1em',
              marginBottom: 28, textTransform: 'uppercase', background: 'rgba(37,99,235,0.15)',
            }}
          >
            Maintenance & Repairs
          </span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 800, lineHeight: 1.12, marginBottom: 22, letterSpacing: '-0.02em', color: '#fff' }}>
            Something broken? We take it from here.
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', color: 'rgba(255,255,255,0.68)', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.7 }}>
            When you report a maintenance issue, we handle the whole process, coordinating with your landlord,
            instructing a trusted contractor, and getting it fixed. Here’s exactly how it works.
          </p>
          <a
            href="/maintenance/report"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#fff',
              border: '2px solid #2563eb', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15,
              textDecoration: 'none', letterSpacing: '0.02em',
            }}
          >
            🔧 Report a Maintenance Issue
          </a>
        </div>
      </section>

      {/* ── HOW WE HANDLE IT ── */}
      <section style={{ background: '#f3f4f6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 80px' }}>
          <p style={{ color: '#0f1f3d', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 800 }}>
            The Process
          </p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: 48, letterSpacing: '-0.02em', color: '#111827' }}>
            How we handle your maintenance, step by step.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {steps.map((step) => (
              <div key={step.num} style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 12, padding: '28px 24px', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#111827' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REASSURANCE STRIP ── */}
      <section style={{ background: '#e8eaed', borderTop: '1px solid rgba(37,99,235,0.15)', borderBottom: '1px solid rgba(37,99,235,0.15)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { title: 'Vetted contractors', body: 'Repairs are carried out by trusted, insured tradespeople we work with regularly.' },
              { title: 'Landlord kept informed', body: 'We coordinate with your landlord at every step so nothing happens without their agreement.' },
              { title: 'Clear communication', body: 'You’ll get a confirmation on submission and updates as your repair progresses.' },
            ].map((c) => (
              <div key={c.title} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: 12, padding: '28px 24px', background: '#fff' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#111827' }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#f3f4f6' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
          <p style={{ color: '#0f1f3d', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 800 }}>
            Common Questions
          </p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: 40, letterSpacing: '-0.02em', color: '#0f172a' }}>
            Maintenance FAQs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.25)', borderBottom: i === faqs.length - 1 ? '1px solid rgba(0,0,0,0.25)' : 'none' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', color: '#0f172a', textAlign: 'left', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 600, gap: 16 }}
                >
                  {faq.q}
                  <span style={{ color: '#2563eb', fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, paddingBottom: 20, margin: 0 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 100px' }}>
        <div style={{ border: '2px solid #2563eb', borderRadius: 16, padding: '56px 40px', background: 'rgba(4,10,24,0.94)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em', color: '#fff' }}>
            Got an issue in your property?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, marginBottom: 32, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
            Report it in a couple of minutes with a few photos, and we’ll start the process straight away.
          </p>
          <a
            href="/maintenance/report"
            style={{
              display: 'inline-block', background: '#2563eb', color: '#fff', padding: '15px 38px', borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '0.02em',
            }}
          >
            🔧 Report a Maintenance Issue
          </a>
        </div>
      </section>
    </main>
  );
}
