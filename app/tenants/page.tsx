"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import ServiceHero from "@/components/layout/ServiceHero";

/* Brand palette
   Blue stays the primary action colour. Green (#629D2A) is the new supporting
   colour used for trust, tenant benefits, reassurance and success moments. */
const GREEN = "#629D2A";
const GREEN_HOVER = "#4F8221";
const GREEN_BG = "#F7FBF2";
const GREEN_INK = "#3f6b1a";

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
    a: "You can book online in minutes. Choose a time that suits you and confirm your viewing instantly, no phone calls or waiting for a callback.",
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

/* Your next step — a single action hub linking to every tenant flow */
const actions = [
  {
    title: "Browse properties",
    sub: "Find a place that feels like home.",
    href: "/listings",
    icon: (
      <svg width="24" height="24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    title: "Book a viewing",
    sub: "Choose a time that works for you.",
    href: "/book-viewing",
    icon: (
      <svg width="24" height="24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Apply online",
    sub: "Simple, clear and fully online.",
    href: "/tenant-application",
    icon: (
      <svg width="24" height="24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    title: "Report maintenance",
    sub: "Get help quickly when you need it.",
    href: "/maintenance/report",
    icon: (
      <svg width="24" height="24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.3-2.3z" />
      </svg>
    ),
  },
];

/* Fast & simple process — three steps, convenience-led */
const steps = [
  {
    num: "01",
    title: "Book Your Viewing Online",
    body: "No phone calls. No emails. No waiting. Choose a time that works for you and confirm your viewing instantly.",
  },
  {
    num: "02",
    title: "Apply Online",
    body: "Submit your application digitally and upload supporting documents securely.",
  },
  {
    num: "03",
    title: "Move Into Your New Home",
    body: "Once approved, we'll guide you through the final steps and help you settle in.",
  },
];

/* Maintenance visual flow */
const maintenanceFlow = [
  { title: "Tell Us The Issue", sub: "Answer a few quick questions" },
  { title: "Upload Photos", sub: "Show us exactly what's wrong" },
  { title: "We Coordinate Contractors", sub: "The right trade, arranged for you" },
  { title: "Receive Updates", sub: "Kept in the loop until it's fixed" },
];

/* Tenant-focused testimonials — placed high to reinforce trust early */
const testimonials = [
  {
    quote: "Booked a viewing online in about two minutes and had the keys within the fortnight. Easily the smoothest rental I've ever done.",
    name: "Aisha R.",
    detail: "City centre apartment · Leeds",
    tag: "Viewing",
  },
  {
    quote: "The whole application was online. I uploaded my documents from my phone on a lunch break and got approved quickly. No paperwork stress.",
    name: "Daniel & Megan",
    detail: "Two-bed house · Manchester",
    tag: "Application",
  },
  {
    quote: "Our boiler played up in winter. I reported it with a couple of photos and they had someone out fast. Felt genuinely looked after.",
    name: "Tomasz K.",
    detail: "Suburban flat · Leeds",
    tag: "Maintenance",
  },
];

/* Our promise to every tenant */
const promiseItems = [
  "Honest communication",
  "Transparent process",
  "Fast maintenance support",
  "Professional property management",
  "Friendly local team",
];

export default function TenantsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Staggered scroll-reveal for the feature cards. JS-gated (adds `t-js` to
  // <body>) so the cards stay fully visible if scripting is ever unavailable.
  useEffect(() => {
    document.body.classList.add("t-js");
    const els = Array.from(document.querySelectorAll(".t-reveal"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("t-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("t-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        color: "#111827",
        fontFamily: "'Poppins', 'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes t-pulse-ring {
          0% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.15; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        @keyframes t-shimmer {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.12; }
        }
        @keyframes t-float-slow {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.18; }
          50% { transform: translateY(-28px) scale(1.06); opacity: 0.28; }
        }
        @keyframes t-float-med {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.12; }
          50% { transform: translateY(-18px) scale(1.04); opacity: 0.22; }
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

        /* Section heading helper */
        .t-h2 {
          font-size: clamp(1.7rem, 4vw, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0f172a;
          font-family: 'Barlow Condensed', sans-serif;
          line-height: 1.08;
          margin: 0;
        }
        .t-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; color: ${GREEN_INK}; margin-bottom: 14px;
        }
        .t-eyebrow::before {
          content: ""; width: 22px; height: 2px; background: ${GREEN}; border-radius: 2px;
        }

        /* Green pill button */
        .t-btn-green {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          box-sizing: border-box; min-height: 50px; padding: 15px 30px;
          background: ${GREEN}; color: #fff; border: 1.5px solid ${GREEN}; border-radius: 999px;
          font-weight: 700; font-size: 14px; line-height: 1.2; letter-spacing: 0.01em;
          text-decoration: none; transition: background .2s ease, border-color .2s ease, transform .2s ease, box-shadow .2s ease;
          box-shadow: 0 10px 24px -10px rgba(98,157,42,0.55);
        }
        .t-btn-green:hover { background: ${GREEN_HOVER}; border-color: ${GREEN_HOVER}; transform: translateY(-2px); }

        /* Blue pill button (primary action) */
        .t-btn-blue {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          box-sizing: border-box; min-height: 50px; padding: 15px 30px;
          background: #2563eb; color: #fff; border: 1.5px solid #2563eb; border-radius: 999px;
          font-weight: 700; font-size: 14px; line-height: 1.2; letter-spacing: 0.01em;
          text-decoration: none; transition: background .2s ease, border-color .2s ease, transform .2s ease;
          box-shadow: 0 10px 24px -10px rgba(37,99,235,0.55);
        }
        .t-btn-blue:hover { background: #1d4ed8; border-color: #1d4ed8; transform: translateY(-2px); }

        /* Benefit / step cards */
        .t-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #eef1f5;
          border-radius: 18px;
          padding: 30px 26px;
          box-shadow: 0 4px 14px -6px rgba(15,31,61,0.10), 0 2px 5px -2px rgba(15,31,61,0.06);
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease;
          will-change: transform;
        }
        .t-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 28px 46px -20px rgba(15,31,61,0.28), 0 10px 20px -12px rgba(98,157,42,0.18);
          border-color: #d8ecc4;
        }

        .t-js .t-reveal.t-in {
          animation: t-rise .6s cubic-bezier(.22,1,.36,1) backwards;
        }
        @keyframes t-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .t-card, .t-btn-green, .t-btn-blue { transition: none; }
          .t-card:hover, .t-btn-green:hover, .t-btn-blue:hover { transform: none; }
          .t-js .t-reveal.t-in { animation: none; }
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <ServiceHero
        eyebrow="For Tenants · Leeds & Manchester"
        title={<>Renting <span style={{ color: GREEN }}>Made Simple.</span></>}
        subtitle="Browse available homes, book viewings online, manage maintenance requests and enjoy a stress-free renting experience."
        image="/images/heropage.webp"
        imageAlt="Happy family holding the keys to their new rented home"
        ctas={[
          { label: 'Browse Properties', href: '/listings' },
          { label: 'Report a Maintenance Issue', href: '/maintenance/report', variant: 'ghost' },
        ]}
        float={{ label: 'Tenant fees', value: '£0', sub: 'No agency fees, ever' }}
      />

      {/* ── LIFESTYLE BAND ── */}
      <section style={{ background: GREEN_BG, borderTop: `1px solid #e6f0d8`, borderBottom: `1px solid #e6f0d8` }}>
        <style>{`
          @media (max-width: 820px) {
            .t-life-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            .t-life-media { order: -1; }
          }
        `}</style>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "84px 24px" }}>
          <div className="t-life-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
            <div>
              <span className="t-eyebrow">A Place to Call Home</span>
              <h2 className="t-h2" style={{ marginBottom: 20 }}>
                More Than a Property. A Place to Call Home.
              </h2>
              <p style={{ fontSize: 17, color: "#4b5563", lineHeight: 1.75, maxWidth: 520, marginBottom: 28 }}>
                Whether you&apos;re moving across the city or starting a new chapter, we&apos;re here to make
                renting simple, transparent and stress-free.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {["Warm local team", "No agency fees", "Support that lasts"].map((t) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: GREEN_INK, background: "#fff", border: `1px solid #e0eecd`, borderRadius: 999, padding: "9px 16px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Lifestyle image in a soft green frame. Swap in people-at-home
                photography here when available for maximum warmth. */}
            <div className="t-life-media" style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: "-14px -14px auto auto", width: 120, height: 120, borderRadius: "50%", background: "rgba(98,157,42,0.14)", filter: "blur(2px)", zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1, borderRadius: 22, overflow: "hidden", border: "6px solid #fff", boxShadow: "0 30px 60px -28px rgba(15,31,61,0.4)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/heropage.webp" alt="A family enjoying their new home" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </div>
              <div style={{ position: "absolute", left: 18, bottom: -18, zIndex: 2, background: "#fff", borderRadius: 14, padding: "12px 18px", boxShadow: "0 16px 30px -14px rgba(15,31,61,0.35)", border: "1px solid #eef1f5", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: GREEN_BG, display: "grid", placeItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Homes across</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Leeds &amp; Manchester</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── YOUR NEXT STEP — action hub ── */}
      <section style={{ background: "#f6f8fb", borderBottom: "1px solid #eceff3" }}>
        <style>{`
          .t-next-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 48px; align-items: center; }
          .t-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .t-action {
            display: flex; flex-direction: column; gap: 10px;
            background: #fff; border: 1px solid #e9edf2; border-radius: 16px;
            padding: 26px 24px; text-decoration: none; min-height: 150px;
            box-shadow: 0 4px 14px -8px rgba(15,31,61,0.10);
            transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease, border-color .28s ease;
          }
          .t-action:hover { transform: translateY(-6px); border-color: #d8ecc4; box-shadow: 0 24px 40px -20px rgba(15,31,61,0.26), 0 8px 16px -12px rgba(98,157,42,0.2); }
          .t-action-arrow { margin-top: auto; color: ${GREEN}; transition: transform .25s ease; }
          .t-action:hover .t-action-arrow { transform: translateX(6px); }
          @media (max-width: 880px) {
            .t-next-grid { grid-template-columns: 1fr; gap: 32px; }
          }
          @media (max-width: 520px) {
            .t-actions { grid-template-columns: 1fr; }
          }
        `}</style>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "84px 24px" }}>
          <div className="t-next-grid">
            <div>
              <span className="t-eyebrow">Your Next Step</span>
              <h2 className="t-h2">
                Everything you need,<br />
                <em style={{ color: GREEN, fontStyle: "italic" }}>in one simple place.</em>
              </h2>
            </div>
            <div className="t-actions">
              {actions.map((a) => (
                <a key={a.title} href={a.href} className="t-action t-reveal">
                  <span style={{ width: 48, height: 48, borderRadius: 12, background: GREEN_BG, border: "1px solid #e0eecd", display: "grid", placeItems: "center" }}>
                    {a.icon}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "6px 0 0" }}>{a.title}</h3>
                  <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.55, margin: 0 }}>{a.sub}</p>
                  <span className="t-action-arrow" aria-hidden>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ── */}
      <section style={{ background: "#ffffff" }}>
        <style>{`
          .t-diff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
          @media (max-width: 780px) { .t-diff-grid { grid-template-columns: 1fr; } }
          .t-btn-outline {
            display: inline-flex; align-items: center; justify-content: center; gap: 9px;
            box-sizing: border-box; min-height: 48px; padding: 13px 26px;
            background: transparent; color: ${GREEN_INK}; border: 1.6px solid ${GREEN};
            border-radius: 999px; font-weight: 700; font-size: 13.5px; line-height: 1.2;
            letter-spacing: 0.01em; text-decoration: none;
            transition: background .22s ease, border-color .22s ease, color .22s ease, transform .22s ease;
          }
          .t-btn-outline:hover { background: ${GREEN_BG}; border-color: ${GREEN_HOVER}; color: ${GREEN_HOVER}; transform: translateY(-2px); }
        `}</style>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "92px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="t-eyebrow">What Makes Us Different</span>
            <h2 className="t-h2">Renting, reimagined around you.</h2>
          </div>

          <div className="t-diff-grid">
            {/* Card 1 — Book Your Viewing Online */}
            <div className="t-card t-reveal" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ width: 58, height: 58, borderRadius: 16, background: GREEN_BG, border: "1px solid #e0eecd", display: "grid", placeItems: "center" }}>
                <svg width="26" height="26" fill="none" stroke={GREEN} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
              </span>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: "#0f172a", margin: "8px 0 0" }}>Book Your Viewing Online</h3>
              <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>
                No phone calls. No emails. No waiting. Choose a viewing time online in just a few clicks.
              </p>
            </div>

            {/* Card 2 — Maintenance Reporting Made Easy */}
            <div className="t-card t-reveal" style={{ animationDelay: "70ms", padding: "40px 36px", display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ width: 58, height: 58, borderRadius: 16, background: GREEN_BG, border: "1px solid #e0eecd", display: "grid", placeItems: "center" }}>
                <svg width="26" height="26" fill="none" stroke={GREEN} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2 2.3-2.3z" />
                </svg>
              </span>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: "#0f172a", margin: "8px 0 0" }}>Maintenance Reporting Made Easy</h3>
              <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>
                Answer a few questions and upload photos. We&apos;ll coordinate directly with the appropriate
                contractor and keep you updated throughout the process.
              </p>
              <a href="/maintenance/report" className="t-btn-outline" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                Report a Maintenance Issue
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (placed high to build trust early) ── */}
      <section style={{ background: "#f6f8fb", borderTop: "1px solid #eceff3", borderBottom: "1px solid #eceff3" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "84px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="t-eyebrow">Loved by Tenants</span>
            <h2 className="t-h2">Renting people actually enjoyed.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
            {testimonials.map((t, i) => (
              <div key={t.name} className="t-card t-reveal" style={{ animationDelay: `${i * 70}ms`, display: "flex", flexDirection: "column", gap: 16 }}>
                <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: GREEN_INK, background: GREEN_BG, border: "1px solid #e0eecd", borderRadius: 999, padding: "5px 12px" }}>{t.tag}</span>
                <div style={{ display: "flex", gap: 3, color: GREEN }}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={GREEN} stroke="none"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7, margin: 0, flexGrow: 1 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ borderTop: "1px solid #eef1f5", paddingTop: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAST & SIMPLE PROCESS ── */}
      <section style={{ background: "#ffffff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "84px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span className="t-eyebrow">Fast &amp; Simple</span>
            <h2 className="t-h2">Three steps to your new home.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
            {steps.map((step, i) => (
              <div key={step.num} className="t-card t-reveal" style={{ animationDelay: `${i * 70}ms` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 12, background: GREEN, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16, boxShadow: "0 8px 18px -8px rgba(98,157,42,0.6)" }}>{step.num}</span>
                  <span style={{ flexGrow: 1, height: 2, background: "linear-gradient(90deg, #e0eecd, transparent)" }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#0f172a" }}>{step.title}</h3>
                <p style={{ fontSize: 14.5, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAINTENANCE (green-heavy, one of the strongest sections) ── */}
      <section style={{ background: GREEN_BG, borderTop: "1px solid #e6f0d8", borderBottom: "1px solid #e6f0d8" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "84px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span className="t-eyebrow">Already Renting With Us?</span>
          </div>
          <h2 className="t-h2" style={{ textAlign: "center", marginBottom: 18 }}>
            Need Help? Reporting Maintenance Is Easy.
          </h2>
          <p style={{ textAlign: "center", fontSize: 16, color: "#4b5563", lineHeight: 1.75, maxWidth: 640, margin: "0 auto 52px" }}>
            Simply answer a few questions, upload photos and submit your request online. Our team will
            coordinate directly with the appropriate contractor and keep you updated throughout the process.
          </p>

          {/* Visual process */}
          <style>{`
            .t-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; align-items: stretch; }
            .t-flow-arrow { display: grid; place-items: center; color: ${GREEN}; }
            @media (max-width: 760px) {
              .t-flow { grid-template-columns: 1fr; gap: 0; }
              .t-flow-arrow { transform: rotate(90deg); padding: 8px 0; }
            }
          `}</style>
          <div className="t-flow">
            {maintenanceFlow.map((f, i) => (
              <div key={f.title} style={{ display: "contents" }}>
                <div className="t-card t-reveal" style={{ animationDelay: `${i * 70}ms`, textAlign: "center", background: "#fff", borderColor: "#e6f0d8" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: GREEN, color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 14px", fontWeight: 800, fontSize: 15 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, margin: 0 }}>{f.sub}</p>
                </div>
                {i < maintenanceFlow.length - 1 && (
                  <div className="t-flow-arrow" aria-hidden>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <a href="/maintenance/report" className="t-btn-green">
              🔧 Report a Maintenance Issue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── OUR PROMISE TO EVERY TENANT ── */}
      <section style={{ background: "#ffffff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "84px 24px" }}>
          <div style={{ background: GREEN_BG, border: "1px solid #e6f0d8", borderRadius: 26, padding: "clamp(36px, 5vw, 60px)" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span className="t-eyebrow">Our Commitment</span>
              <h2 className="t-h2">Our Promise to Every Tenant</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
              {promiseItems.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #e6f0d8", borderRadius: 14, padding: "18px 20px" }}>
                  <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 999, background: GREEN, display: "grid", placeItems: "center" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1f2937" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOLDING DEPOSIT EXPLAINER — animated ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0a162f" }}>
        {/* Animated background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
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
                When you&apos;ve seen the property and want to move forward, a holding deposit takes it off the market while your application is processed.
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.75, marginBottom: 32 }}>
                That deposit is{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>deducted from your first month&apos;s rent</span>{" "}
                , so you&apos;re not paying it on top of anything. It&apos;s just paying your rent a little early.
              </p>

              {/* Browse CTA — the maintenance flow now lives in its own dedicated
                  section above, so this points tenants to available homes. */}
              <a href="/listings" className="t-btn-green" style={{ borderRadius: 9 }}>
                Browse Available Properties
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>

            <div style={{ border: "1px solid rgba(245,245,240,0.22)", borderRadius: 16, padding: "36px 32px", background: "rgba(10,24,56,0.85)", backdropFilter: "blur(12px)", animation: "t-cta-pulse 6s ease-in-out infinite" }}>
              {[
                { label: "Agency fees", value: "£0", sub: "Always free for tenants" },
                { label: "Holding deposit", value: "Varies", sub: "Deducted from first month's rent" },
                { label: "Application forms", value: "Online", sub: "Quick and fully digital" },
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
      <section style={{ background: "#ffffff", borderTop: "1px solid #eceff3" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
          <p className="t-eyebrow">Common Questions</p>
          <h2 className="t-h2" style={{ marginBottom: 40 }}>FAQs</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.12)", borderBottom: i === faqs.length - 1 ? "1px solid rgba(0,0,0,0.12)" : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", background: "none", border: "none", color: "#0f172a", textAlign: "left", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 16, fontWeight: 600, gap: 16 }}
                >
                  {faq.q}
                  <span style={{ color: GREEN, fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.7, paddingBottom: 20, margin: 0 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CONVERSION CTA — Ready to find your next home? ── */}
      <section style={{ position: "relative", overflow: "hidden", maxWidth: 1120, margin: "0 auto", padding: "70px 24px 100px" }}>
        <div
          style={{
            position: "relative",
            borderRadius: 26,
            padding: "clamp(48px, 6vw, 76px) 40px",
            background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_HOVER} 100%)`,
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 65%)", top: "-160px", left: "-100px", animation: "t-orb-move 12s ease-in-out infinite" }} />
            <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 65%)", bottom: "-120px", right: "-90px", animation: "t-orb-move 15s ease-in-out infinite reverse" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4.5vw, 2.7rem)", fontWeight: 700, marginBottom: 18, letterSpacing: "-0.02em", fontFamily: "'Barlow Condensed', sans-serif", color: "#ffffff" }}>
              Ready to Find Your Next Home?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 16.5, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Whether you&apos;re relocating, starting a new job or simply looking for a better place to live,
              we&apos;re here to help you find a place you&apos;ll love coming home to.
            </p>
            <a
              href="/listings"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxSizing: "border-box", minHeight: 54, lineHeight: 1.2,
                background: "#ffffff", color: GREEN_INK, padding: "16px 36px",
                borderRadius: 999, fontWeight: 800, fontSize: 15, textDecoration: "none",
                letterSpacing: "0.01em", boxShadow: "0 14px 30px -12px rgba(0,0,0,0.4)",
              }}
            >
              Browse Properties
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
