"use client";

import { useState } from "react";

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
  {
    num: "01",
    title: "Send an enquiry",
    body: "Tell us what you're looking for — property type, area, move-in date. No long forms.",
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
    body: "To take the property off the market, pay a holding deposit — deducted from your first month's rent.",
  },
  {
    num: "05",
    title: "Complete your application",
    body: "We guide you through referencing and paperwork — straightforward and handled quickly.",
  },
  {
    num: "06",
    title: "Move in",
    body: "Referencing done, paperwork signed, keys in hand. Welcome home.",
  },
];

export default function TenantsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      style={{
        background: "linear-gradient(160deg, #020b1a 0%, #041230 60%, #061a42 100%)",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── HERO ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "160px 24px 80px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            border: "1px solid rgba(37,99,235,0.5)",
            borderRadius: 999,
            padding: "6px 18px",
            fontSize: 13,
            color: "#93b4fd",
            letterSpacing: "0.08em",
            marginBottom: 28,
            textTransform: "uppercase",
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
          }}
        >
          Rent without{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #2563eb, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            the runaround.
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
          and we'll get you in for a viewing — usually within days.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/contact"
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
            Send an Enquiry
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
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 80px" }}>
        <p
          style={{
            color: "#60a5fa",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          The Process
        </p>
        <h2
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            fontWeight: 700,
            marginBottom: 48,
            letterSpacing: "-0.02em",
          }}
        >
          From enquiry to keys — five steps.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              style={{
                border: "2px solid #2563eb",
                borderRadius: 12,
                padding: "28px 24px",
                background: "rgba(10,24,56,0.82)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2563eb",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                {step.num}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY RENT WITH US ── */}
      <section
        style={{
          background: "rgba(255,255,255,0.025)",
          borderTop: "1px solid rgba(37,99,235,0.15)",
          borderBottom: "1px solid rgba(37,99,235,0.15)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <p
            style={{
              color: "#60a5fa",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Why Us
          </p>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 700,
              marginBottom: 48,
              letterSpacing: "-0.02em",
            }}
          >
            What makes us different.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {whyCards.map((card) => (
              <div
                key={card.title}
                style={{
                  border: "2px solid #2563eb",
                  borderRadius: 12,
                  padding: "28px 24px",
                  background: "rgba(10,24,56,0.82)",
                }}
              >
                <div style={{ marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOLDING DEPOSIT EXPLAINER ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                color: "#60a5fa",
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Transparent Costs
            </p>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                fontWeight: 700,
                marginBottom: 20,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              The holding deposit explained.
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 15,
                lineHeight: 1.75,
                marginBottom: 20,
              }}
            >
              When you've seen the property and want to move forward, a holding deposit takes it off
              the market while your application is processed.
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 15,
                lineHeight: 1.75,
                marginBottom: 32,
              }}
            >
              That deposit is{" "}
              <span style={{ color: "#fff", fontWeight: 600 }}>
                deducted from your first month's rent
              </span>{" "}
              — so you're not paying it on top of anything. It's just paying your rent a little
              early.
            </p>
            <a
              href="/contact"
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "13px 28px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Start your enquiry
            </a>
          </div>

          <div
            style={{
              border: "2px solid #2563eb",
              borderRadius: 16,
              padding: "36px 32px",
              background: "rgba(10,24,56,0.82)",
            }}
          >
            {[
              { label: "Agency fees", value: "£0", sub: "Always free for tenants" },
              { label: "Holding deposit", value: "Varies", sub: "Deducted from first month's rent" },
              { label: "Application forms", value: "Required", sub: "We'll walk you through it together" },
              { label: "Viewing fee", value: "£0", sub: "No charge to view a property" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "16px 0",
                  borderBottom:
                    i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{row.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 3 }}>
                    {row.sub}
                  </div>
                </div>
                <div
                  style={{
                    color: "#60a5fa",
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        style={{
          background: "rgba(255,255,255,0.025)",
          borderTop: "1px solid rgba(37,99,235,0.15)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
          <p
            style={{
              color: "#60a5fa",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Common Questions
          </p>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 700,
              marginBottom: 40,
              letterSpacing: "-0.02em",
            }}
          >
            FAQs
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderBottom: i === faqs.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "#fff",
                    textAlign: "left",
                    padding: "20px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    gap: 16,
                  }}
                >
                  {faq.q}
                  <span
                    style={{
                      color: "#2563eb",
                      fontSize: 22,
                      flexShrink: 0,
                      lineHeight: 1,
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 15,
                      lineHeight: 1.7,
                      paddingBottom: 20,
                      margin: 0,
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 100px" }}>
        <div
          style={{
            border: "2px solid #2563eb",
            borderRadius: 16,
            padding: "60px 40px",
            background: "rgba(10,24,56,0.82)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to find your next home?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 16,
              marginBottom: 36,
              maxWidth: 460,
              margin: "0 auto 36px",
              lineHeight: 1.65,
            }}
          >
            Send us an enquiry and we'll take it from there. No forms, no fees, no hassle.
          </p>
          <a
            href="/contact"
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "15px 36px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Get in Touch
          </a>
        </div>
      </section>
    </main>
  );
}
