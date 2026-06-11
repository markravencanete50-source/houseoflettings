"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";

const faqs = [
  {
    q: "Is it free to rent through House of Lettings?",
    a: "Yes — there are no agency fees for tenants. The only payment before moving in is a holding deposit to secure the property, which is deducted from your first month's rent. You're not losing anything.",
  },
  {
    q: "What is the holding deposit?",
    a: "A holding deposit reserves the property while your application is processed. It's fully deducted from your first rent payment, so it comes straight off what you'd pay anyway.",
  },
  {
    q: "How quickly can I book a viewing?",
    a: "Once you send an enquiry and answer a few quick questions, we arrange the viewing as fast as possible — usually within a few days.",
  },
  {
    q: "What checks do you run?",
    a: "Standard referencing: employment/income checks and a previous landlord reference where applicable. We keep it straightforward — no unnecessary hoops.",
  },
  {
    q: "Which areas do you cover?",
    a: "We operate across Leeds and Manchester, covering a wide range of property types from city-centre apartments to family homes.",
  },
  {
    q: "Can I apply if I'm self-employed or a student?",
    a: "Yes. We assess applications individually and work with a range of tenant profiles. Get in touch and we'll let you know what we need from you.",
  },
];

const whyCards = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "No agency fees",
    body: "Renting through us costs you nothing extra. The holding deposit is the only upfront payment — and it comes off your first rent.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Fast, simple process",
    body: "Send an enquiry, answer a few questions, book your viewing. No lengthy forms, no waiting weeks to hear back.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Direct landlord contact",
    body: "We work closely with our landlords — no middlemen, no miscommunication. Questions get answered quickly.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: "Leeds & Manchester",
    body: "City-centre flats, suburban houses, and everything in between — across two of the UK's most in-demand rental markets.",
  },
];

const steps = [
  { num: "01", title: "Send an enquiry", body: "Tell us what you're looking for — property type, area, move-in date. No long forms." },
  { num: "02", title: "Answer a few quick questions", body: "We ask a handful of straightforward questions to match you with the right property." },
  { num: "03", title: "Book your viewing", body: "We arrange the viewing fast. See the property in person before committing to anything." },
  { num: "04", title: "Secure it with a holding deposit", body: "To take the property off the market, pay a holding deposit — deducted from your first month's rent." },
  { num: "05", title: "Submit your application", body: "Our team guides you through the full application process — referencing, ID checks, and everything in between." },
  { num: "06", title: "Move in", body: "Referencing done, paperwork signed, keys in hand. Welcome home." },
];

export default function TenantsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      style={{
        background: "#eef0f7",
        minHeight: "100vh",
        color: "#111827",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        .tenants-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 28px 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .faq-divider { border-color: #e5e7eb; }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          backgroundImage: "linear-gradient(160deg, rgba(2,11,26,0.82) 0%, rgba(4,18,48,0.75) 60%, rgba(6,26,66,0.68) 100%), url(/images/Tenants_Book_viewing_background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "calc(68px + 100px) 24px 100px", textAlign: "center" }}>
          <span style={{
            display: "inline-block",
            border: "1.5px solid rgba(37,99,235,0.8)",
            borderRadius: 999,
            padding: "7px 20px",
            fontSize: 13,
            fontWeight: 700,
            color: "#bfdbfe",
            letterSpacing: "0.1em",
            marginBottom: 28,
            textTransform: "uppercase",
            background: "rgba(37,99,235,0.15)",
          }}>
            Leeds &amp; Manchester
          </span>
          <h1 style={{
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}>
            Rent without the runaround.
          </h1>
          <p style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.7)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            No agency fees. No endless forms. Send an enquiry, answer a few quick questions, and we&apos;ll get you in for a viewing.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/book-viewing" style={{
              background: "#2563eb", color: "#fff",
              padding: "14px 32px", borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}>
              Book a Viewing
            </a>
            <a href="/properties" style={{
              border: "2px solid rgba(255,255,255,0.5)", color: "#fff",
              padding: "14px 32px", borderRadius: 8,
              fontWeight: 600, fontSize: 15, textDecoration: "none",
            }}>
              Browse Properties
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "#eef0f7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 80px" }}>
          <p style={{ color: "#2563eb", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
            The Process
          </p>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em", color: "#111827" }}>
            From enquiry to keys — six steps.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {steps.map((step) => (
              <div key={step.num} className="tenants-card">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY RENT WITH US ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ color: "#2563eb", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
            Why Us
          </p>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em", color: "#111827" }}>
            What makes us different.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {whyCards.map((card) => (
              <div key={card.title} className="tenants-card">
                <div style={{ marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOLDING DEPOSIT EXPLAINER ── */}
      <section style={{ background: "#eef0f7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <style>{`
            @media (max-width: 700px) {
              .deposit-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            }
          `}</style>
          <div className="deposit-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <p style={{ color: "#2563eb", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
                Transparent Costs
              </p>
              <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, marginBottom: 20, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#111827" }}>
                The holding deposit explained.
              </h2>
              <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.75, marginBottom: 16 }}>
                When you&apos;ve seen the property and want to move forward, a holding deposit takes it off the market while your application is processed.
              </p>
              <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.75 }}>
                That deposit is{" "}
                <span style={{ color: "#111827", fontWeight: 600 }}>deducted from your first month&apos;s rent</span>{" "}
                — so you&apos;re not paying it on top of anything. It&apos;s just paying your rent a little early.
              </p>
            </div>

            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "36px 32px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}>
              {[
                { label: "Agency fees", value: "£0", sub: "Always free for tenants" },
                { label: "Holding deposit", value: "Varies", sub: "Deducted from first month's rent" },
                { label: "Application forms", value: "None", sub: "Just a quick conversation" },
                { label: "Viewing fee", value: "£0", sub: "No charge to view a property" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{row.label}</div>
                    <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>{row.sub}</div>
                  </div>
                  <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 16, flexShrink: 0, marginLeft: 16 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ color: "#2563eb", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
            Common Questions
          </p>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 40, letterSpacing: "-0.02em", color: "#111827" }}>
            FAQs
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderTop: "1px solid #e5e7eb", borderBottom: i === faqs.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", background: "none", border: "none",
                    color: "#111827", textAlign: "left", padding: "20px 0",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", fontSize: 16, fontWeight: 600, gap: 16,
                  }}
                >
                  {faq.q}
                  <span style={{ color: "#2563eb", fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7, paddingBottom: 20, margin: 0 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: "#eef0f7", padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            background: "#1e3a5f",
            borderRadius: 16,
            padding: "60px 40px",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em", color: "#fff" }}>
              Ready to find your next home?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, marginBottom: 36, maxWidth: 400, margin: "0 auto 36px", lineHeight: 1.65 }}>
              Send us an enquiry and we&apos;ll take it from there. No forms, no fees, no hassle.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/book-viewing" style={{
                background: "#2563eb", color: "#fff",
                padding: "14px 32px", borderRadius: 8,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}>
                Book a Viewing
              </a>
              <a href="/properties" style={{
                border: "2px solid rgba(255,255,255,0.4)", color: "#fff",
                padding: "14px 32px", borderRadius: 8,
                fontWeight: 600, fontSize: 15, textDecoration: "none",
              }}>
                Browse Properties
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
