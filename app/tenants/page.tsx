"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";

const faqs = [
  {
    q: "Is it free to rent through House of Lettings?",
    a: "Yes, there are no agency fees for tenants. The only payment before moving in is a holding deposit to secure the property, which is deducted from your first month's rent. You're not losing anything.",
  },
  {
    q: "What is the holding deposit?",
    a: "A holding deposit reserves the property while your application is processed. It's fully deducted from your first rent payment, so it comes straight off what you'd pay anyway.",
  },
  {
    q: "How quickly can I book a viewing?",
    a: "Once you send an enquiry and answer a few quick questions, we arrange the viewing as fast as possible, usually within a few days.",
  },
  {
    q: "What checks do you run?",
    a: "Standard referencing: employment/income checks and a previous landlord reference where applicable. We keep it straightforward, no unnecessary hoops.",
  },
  {
    q: "Which areas do you cover?",
    a: "We operate across Leeds and Manchester, covering a wide range of property types from city centre apartments to family homes.",
  },
  {
    q: "Can I apply if I'm self employed or a student?",
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
    body: "Renting through us costs you nothing extra. The holding deposit is the only upfront payment, and it comes off your first rent.",
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
    body: "We work closely with our landlords, no middlemen, no miscommunication. Questions get answered quickly.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: "Leeds & Manchester",
    body: "City centre flats, suburban houses, and everything in between, across two of the UK's most in demand rental markets.",
  },
];

const steps = [
  {
    num: "01",
    title: "Send an enquiry",
    body: "Tell us what you're looking for, property type, area, move in date. No long forms.",
  },
  {
    num: "02",
    title: "Answer a few quick questions",
    body: "We ask a handful of straightforward questions to match you with the right property.",
  },
  {
    num: "03",
    title: "Book your viewing",
    body: "We arrange the viewing fast. See the property in person before committing to anything.",
  },
  {
    num: "04",
    title: "Secure it with a holding deposit",
    body: "To take the property off the market, pay a holding deposit, deducted from your first month's rent.",
  },
  {
    num: "05",
    title: "Submit your application",
    body: "Our team guides you through the full application process, referencing, ID checks, and everything in between.",
  },
  {
    num: "06",
    title: "Credit and right to rent check",
    body: "We run a credit check and verify your right to rent in the UK as part of your referencing.",
  },
  {
    num: "07",
    title: "Payment",
    body: "Once you're approved, you'll settle your first month's rent and any agreed fees ahead of moving in.",
  },
  {
    num: "08",
    title: "Move in",
    body: "Referencing done, paperwork signed, keys in hand. Welcome home.",
  },
];

export default function TenantsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      style={{
        background: "#f3f4f6",
        minHeight: "100vh",
        color: "#111827",
        fontFamily: "'Poppins', 'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes t-float-slow {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.18; }
          50% { transform: translateY(-28px) scale(1.06); opacity: 0.28; }
        }
        @keyframes t-float-med {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.12; }
          50% { transform: translateY(-18px) scale(1.04); opacity: 0.22; }
        }
        @keyframes t-pulse-ring {
          0% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.15; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        @keyframes t-drift {
          0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 0.08; }
          33% { transform: translateX(12px) translateY(-8px) rotate(5deg); opacity: 0.14; }
          66% { transform: translateX(-8px) translateY(6px) rotate(-3deg); opacity: 0.10; }
          100% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 0.08; }
        }
        @keyframes t-shimmer {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.12; }
        }
        @keyframes t-cta-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.0), inset 0 0 40px rgba(37,99,235,0.06); }
          50% { box-shadow: 0 0 60px 10px rgba(37,99,235,0.12), inset 0 0 80px rgba(37,99,235,0.12); }
        }
        @keyframes t-orb-move {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -20px); }
          50% { transform: translate(-20px, 30px); }
          75% { transform: translate(20px, 20px); }
        }
        @keyframes t-line-grow {
          0% { width: 0; opacity: 0; }
          100% { width: 60px; opacity: 1; }
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          backgroundImage: "linear-gradient(160deg, rgba(2,11,26,0.80) 0%, rgba(4,18,48,0.75) 60%, rgba(6,26,66,0.70) 100%), url(/images/Tenants_Book_viewing_background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "calc(68px + 100px) 24px 100px",
          textAlign: "center",
        }}>
          <span
            style={{
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
            }}
          >
            Leeds &amp; Manchester
          </span>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            Looking for Your Next Home?{" "}
            <span
              style={{
                color: "#ffffff",
              }}
            >
              House of Lettings Holds the Key.
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
              color: "rgba(255,255,255,0.65)",
              maxWidth: 560,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            No agency fees. No endless forms. Send an enquiry, answer a few quick questions,
            and we'll get you in for a viewing.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/book-viewing"
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}
            >
              Book a Viewing
            </a>
            <a
              href="/properties"
              style={{
                border: "2px solid #2563eb",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Browse Properties
              style={{
  background: "#2563eb",
  color: "#fff",
  border: "2px solid #2563eb",
  padding: "14px 32px",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
}}
              }}
            >
              Tenant Application
            style={{
  background: "#2563eb",
  color: "#fff",
  border: "2px solid #2563eb",
  padding: "14px 32px",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
  letterSpacing: "0.02em",
}}
      >

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "60px 24px 80px" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Barlow Condensed', sans-serif" }}>
            From enquiry to keys, eight steps.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {steps.map((step) => (
              <div
                key={step.num}
                style={{
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  padding: "28px 24px",
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY RENT WITH US ── */}
      <section
        style={{
          background: "#e8eaed",
          borderTop: "1px solid rgba(37,99,235,0.15)",
          borderBottom: "1px solid rgba(37,99,235,0.15)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Barlow Condensed', sans-serif" }}>
            What makes us different.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {whyCards.map((card) => (
              <div key={card.title} style={{ border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderRadius: 12, padding: "28px 24px", background: "#ffffff" }}>
                <div style={{ marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.65 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOLDING DEPOSIT EXPLAINER — animated ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0a162f" }}>
        {/* Animated background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {/* Pulsing rings */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute",
              width: 300 + i * 160,
              height: 300 + i * 160,
              borderRadius: "50%",
              border: `1px solid rgba(37,99,235,${0.10 - i * 0.03})`,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              animation: `t-pulse-ring ${6 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
            }} />
          ))}
          {/* Moving orbs */}
          <div style={{
            position: "absolute", width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)",
            top: "-100px", right: "-150px",
            animation: "t-orb-move 16s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: 350, height: 350, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 65%)",
            bottom: "-80px", left: "-100px",
            animation: "t-orb-move 12s ease-in-out infinite reverse",
          }} />
          {/* Floating £ and key symbols */}
          {[
            { top: "15%", left: "4%", delay: "0s" },
            { top: "65%", left: "7%", delay: "2.5s" },
            { top: "25%", right: "4%", delay: "1s" },
            { top: "70%", right: "6%", delay: "3s" },
          ].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", ...pos as any, fontSize: 22,
              color: "rgba(96,165,250,0.25)",
              fontWeight: 700,
              animation: `t-float-med 8s ease-in-out ${pos.delay} infinite`,
            }}>
              {i % 2 === 0 ? "£" : "🔑"}
            </div>
          ))}
          {/* Diagonal shimmer lines */}
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(135deg, transparent 0px, transparent 60px, rgba(37,99,235,0.025) 60px, rgba(37,99,235,0.025) 61px)",
            animation: "t-shimmer 8s ease-in-out infinite",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <style>{`
            @media (max-width: 700px) {
              .deposit-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            }
          `}</style>
          <div className="deposit-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 700, marginBottom: 20, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                The holding deposit explained.
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.75, marginBottom: 20 }}>
                When you've seen the property and want to move forward, a holding deposit takes it off the market while your application is processed.
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.75, marginBottom: 32 }}>
                That deposit is{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>deducted from your first month's rent</span>{" "}
                , so you're not paying it on top of anything. It's just paying your rent a little early.
              </p>
            </div>

            <div style={{ border: "1px solid rgba(245,245,240,0.22)", borderRadius: 16, padding: "36px 32px", background: "rgba(10,24,56,0.85)", backdropFilter: "blur(12px)", animation: "t-cta-pulse 6s ease-in-out infinite" }}>
              {[
                { label: "Agency fees", value: "£0", sub: "Always free for tenants" },
                { label: "Holding deposit", value: "Varies", sub: "Deducted from first month's rent" },
                { label: "Application forms", value: "None", sub: "Just a quick conversation" },
                { label: "Viewing fee", value: "£0", sub: "No charge to view a property" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#d1d5db" }}>{row.label}</div>
                    <div style={{ color: "rgba(209,213,219,0.55)", fontSize: 12, marginTop: 3 }}>{row.sub}</div>
                  </div>
                  <div style={{ color: "#d1d5db", fontWeight: 700, fontSize: 16, flexShrink: 0, marginLeft: 16 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#f3f4f6", borderTop: "1px solid rgba(37,99,235,0.15)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ color: "#0f1f3d", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 800 }}>
            Common Questions
          </p>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 40, letterSpacing: "-0.02em", color: "#0f172a" }}>
            FAQs
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.25)", borderBottom: i === faqs.length - 1 ? "1px solid rgba(0,0,0,0.25)" : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", background: "none", border: "none", color: "#0f172a", textAlign: "left", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 16, fontWeight: 600, gap: 16 }}
                >
                  {faq.q}
                  <span style={{ color: "#2563eb", fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.7, paddingBottom: 20, margin: 0 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER — animated ── */}
      <section style={{ position: "relative", overflow: "hidden", maxWidth: 1100, margin: "0 auto", padding: "80px 24px 100px" }}>
        <div
          style={{
            position: "relative",
            border: "2px solid #2563eb",
            borderRadius: 16,
            padding: "60px 40px",
            background: "rgba(4,10,24,0.94)",
            textAlign: "center",
            overflow: "hidden",
            animation: "t-cta-pulse 5s ease-in-out infinite",
          }}
        >
          {/* Inner animated orbs */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{
              position: "absolute", width: 400, height: 400, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)",
              top: "-150px", left: "-100px",
              animation: "t-orb-move 10s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", width: 300, height: 300, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 65%)",
              bottom: "-100px", right: "-80px",
              animation: "t-orb-move 14s ease-in-out infinite reverse",
            }} />
            {/* Floating dots */}
            {[
              { top: "20%", left: "8%" }, { top: "70%", left: "12%" },
              { top: "30%", right: "10%" }, { top: "65%", right: "15%" },
              { top: "50%", left: "25%" }, { top: "25%", right: "28%" },
            ].map((pos, i) => (
              <div key={i} style={{
                position: "absolute", ...pos as any,
                width: 4, height: 4, borderRadius: "50%",
                background: `rgba(96,165,250,${0.3 + (i % 3) * 0.1})`,
                animation: `t-float-slow ${5 + i}s ease-in-out ${i * 0.7}s infinite`,
              }} />
            ))}
            {/* Shimmer lines */}
            <div style={{
              position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
              background: "linear-gradient(180deg, transparent, rgba(37,99,235,0.15), transparent)",
              animation: "t-shimmer 4s ease-in-out infinite",
            }} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 16, letterSpacing: "-0.02em", fontFamily: "'Barlow Condensed', sans-serif", color: "#ffffff" }}>
              Ready to find your next home?
            </h2>
            <p style={{ color: "#ffffff", fontSize: 16, marginBottom: 36, maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.65 }}>
              Send us an enquiry and we'll take it from there. No forms, no fees, no hassle.
            </p>
            <a
              href="/book-viewing"
              style={{
                display: "inline-block",
                background: "#060d1f",
                color: "#fff",
                padding: "14px 36px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "2px solid rgba(255,255,255,0.12)",
                marginTop: 8,
              }}
            >
              Send an Enquiry
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
