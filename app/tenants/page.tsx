"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import ServiceHero from "@/components/layout/ServiceHero";

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
      <svg width="28" height="28" fill="none" stroke="#0A46EF" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "No agency fees",
    body: "Renting through us costs you nothing extra. The holding deposit is the only upfront payment, and it comes off your first rent.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#0A46EF" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Fast, simple process",
    body: "Send an enquiry, answer a few questions, book your viewing. No lengthy forms, no waiting weeks to hear back.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="#0A46EF" strokeWidth="2" viewBox="0 0 24 24">
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
      <svg width="28" height="28" fill="none" stroke="#0A46EF" strokeWidth="2" viewBox="0 0 24 24">
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

/* Popular Manchester rental areas — lifestyle photography, links to listings */
const areas = [
  { name: "Northern Quarter", desc: "Coffee shops, bars & a lively city feel", img: "/images/areas/northern-quarter.webp" },
  { name: "Castlefield", desc: "Central but quieter, scenic canalside", img: "/images/areas/castlefield.webp" },
  { name: "Salford Quays", desc: "Waterside apartment living & transport links", img: "/images/areas/salford-quays.webp" },
  { name: "Deansgate", desc: "Restaurants, bars & city-centre convenience", img: "/images/areas/deansgate.webp" },
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
        /* Uniform hero action buttons (equal width on desktop, full-width stacked
           on mobile). Sized to the site-standard CTA, as ServiceHero .btn. */
        .t-hero-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          box-sizing: border-box; min-width: 240px; min-height: 48px; padding: 14px 28px;
          background: #2563eb; color: #fff; border: 1.5px solid #2563eb; border-radius: 9px;
          font-weight: 700; font-size: 13.5px; line-height: 1.2; letter-spacing: 0.02em;
          text-decoration: none; transition: background .2s ease, border-color .2s ease;
        }
        .t-hero-btn:hover { background: #1d4ed8; border-color: #1d4ed8; }
        @media (max-width: 600px) {
          .t-hero-btns { flex-direction: column; align-items: center; }
          .t-hero-btn { width: 100%; max-width: 340px; min-width: 0; }
        }

        /* Feature / step cards: depth, hover lift, top-accent bar */
        .t-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #eef1f5;
          border-radius: 18px;
          padding: 30px 26px;
          box-shadow: 0 6px 18px -8px rgba(15,31,61,0.14), 0 2px 6px -2px rgba(15,31,61,0.08);
          transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease;
          will-change: transform;
        }
        .t-card::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #253996, #0A46EF);
          border-radius: 18px 18px 0 0;
          transform: scaleX(0); transform-origin: left;
          transition: transform .38s cubic-bezier(.22,1,.36,1);
        }
        .t-card:hover {
          transform: translateY(-10px) scale(1.015);
          box-shadow: 0 34px 60px -24px rgba(15,31,61,0.4), 0 14px 26px -14px rgba(10,70,239,0.28);
          border-color: #c3d4fb;
        }
        .t-card:hover::before { transform: scaleX(1); }
        /* Icon chip inside cards gets a gentle wobble on card hover */
        .t-card .t-ic { transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
        .t-card:hover .t-ic { transform: translateY(-3px) rotate(-4deg) scale(1.08); }

        /* CTA buttons — hover lift + deeper shadow */
        .t-cta-btn { transition: transform .22s ease, box-shadow .22s ease, background .22s ease, border-color .22s ease; }
        .t-cta-btn:hover { transform: translateY(-3px); }

        /* Animated heading underline accent */
        .t-accent { position: relative; display: inline-block; }
        .t-accent::after {
          content: ""; position: absolute; left: 0; bottom: -14px; height: 4px; width: 0;
          border-radius: 4px; background: linear-gradient(90deg, #253996, #0A46EF);
        }
        .t-js .t-accent.t-in::after { animation: t-underline 1s cubic-bezier(.22,1,.36,1) .15s backwards; width: 64px; }
        @keyframes t-underline { from { width: 0; opacity: 0; } to { width: 64px; opacity: 1; } }

        /* Heading fade-up on scroll */
        .t-js .t-head.t-in { animation: t-rise .7s cubic-bezier(.22,1,.36,1) backwards; }

        /* Step-number badge pop */
        .t-num {
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; letter-spacing: 0.08em; color: #0A46EF;
          background: #eef3ff; border: 1px solid #d9e4ff; border-radius: 8px;
          padding: 5px 9px; transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .3s ease;
        }
        .t-card:hover .t-num { transform: scale(1.1); background: #e2ebff; }

        /* Scroll-reveal entrance — only engaged once JS marks body as t-js,
           so cards remain fully visible if scripting is unavailable. Uses a
           keyframe with backwards fill (not a transition) so the per-card
           stagger delay never leaks into the hover-lift transition. */
        .t-js .t-reveal.t-in {
          animation: t-rise .6s cubic-bezier(.22,1,.36,1) backwards;
        }
        @keyframes t-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }

        /* Mobile: tighter vertical rhythm, comfortable tap targets */
        @media (max-width: 640px) {
          .t-sec { padding-top: 52px !important; padding-bottom: 52px !important; }
          .t-card { padding: 24px 20px; border-radius: 16px; }
          .t-cta-btn { width: 100%; max-width: 360px; }
          .t-accent::after, .t-js .t-accent.t-in::after { bottom: -10px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .t-card, .t-card::before, .t-ic, .t-cta-btn, .t-num { transition: none; }
          .t-card:hover, .t-card:hover .t-ic, .t-card:hover .t-num, .t-cta-btn:hover { transform: none; }
          .t-js .t-reveal.t-in, .t-js .t-head.t-in, .t-js .t-accent.t-in::after { animation: none; }
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <ServiceHero
        eyebrow="For Tenants · Leeds & Manchester"
        title={<>Looking for your next home? <span style={{ color: '#253996' }}>House of Lettings holds the key.</span></>}
        subtitle="No agency fees. No endless forms. Send an enquiry, answer a few quick questions, and we'll get you in for a viewing."
        image="/images/heropage.webp"
        imageAlt="Happy family holding the keys to their new rented home"
        ctas={[
          { label: 'Book a Viewing', href: '/book-viewing' },
          { label: 'Browse Properties', href: '/listings', variant: 'ghost' },
          { label: 'Tenant Application', href: '/tenant-application', variant: 'ghost' },
          { label: 'Guarantor Form', href: '/guarantor', variant: 'ghost' },
        ]}
        float={{ label: 'Tenant fees', value: '£0', sub: 'No agency fees, ever' }}
      />

      {/* ── HOW IT WORKS ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f3f4f6",
        }}
      >
        <div className="t-sec" style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "60px 24px 80px" }}>
          <h2 className="t-head t-reveal" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span className="t-accent t-reveal">From enquiry to keys, eight steps.</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="t-card t-reveal"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <div style={{ marginBottom: 14 }}>
                  <span className="t-num">{step.num}</span>
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
        <div className="t-sec" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <h2 className="t-head t-reveal" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span className="t-accent t-reveal">What makes us different.</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {whyCards.map((card, i) => (
              <div key={card.title} className="t-card t-reveal" style={{ animationDelay: `${i * 55}ms` }}>
                <div className="t-ic" style={{ marginBottom: 16, display: "inline-flex", padding: 12, borderRadius: 14, background: "#eef3ff", border: "1px solid #dbe6ff" }}>{card.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.65 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE MANCHESTER ── */}
      <section style={{ background: "#f3f4f6", borderTop: "1px solid rgba(37,99,235,0.15)" }}>
        <style>{`
          .area-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .area-card {
            position: relative; display: block; border-radius: 20px; overflow: hidden;
            height: 300px; text-decoration: none;
            box-shadow: 0 16px 36px -14px rgba(24,33,53,0.22);
            transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
            will-change: transform;
          }
          .area-card img {
            position: absolute; inset: 0; width: 100%; height: 100%;
            object-fit: cover; object-position: center;
            transition: transform .6s cubic-bezier(.22,1,.36,1);
          }
          .area-card:hover { transform: translateY(-8px); box-shadow: 0 34px 60px -22px rgba(24,33,53,0.4); }
          .area-card:hover img { transform: scale(1.08); }
          .area-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(24,33,53,0) 34%, rgba(24,33,53,0.82) 100%); }
          .area-text { position: absolute; left: 18px; right: 18px; bottom: 16px; color: #fff; z-index: 1; }
          .area-name { font-size: 19px; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 5px; }
          .area-desc { font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.45; }
          .area-cta {
            display: inline-flex; align-items: center; gap: 6px; margin-top: 12px;
            font-size: 12.5px; font-weight: 700; color: #fff;
            background: rgba(10,70,239,0.9); border-radius: 999px; padding: 7px 14px;
            opacity: 0; transform: translateY(6px); transition: opacity .3s ease, transform .3s ease, background .2s ease;
          }
          .area-card:hover .area-cta { opacity: 1; transform: translateY(0); }
          @media (max-width: 900px) { .area-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) {
            .area-grid { grid-template-columns: 1fr; }
            .area-card { height: 240px; }
            .area-cta { opacity: 1; transform: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .area-card, .area-card img, .area-cta { transition: none; }
            .area-card:hover { transform: none; }
            .area-card:hover img { transform: none; }
          }
        `}</style>
        <div className="t-sec" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ color: "#0A46EF", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 800 }}>
            Explore Manchester
          </p>
          <h2 className="t-head t-reveal" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 16, letterSpacing: "-0.02em", color: "#111827", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span className="t-accent t-reveal">Find the area that suits your lifestyle.</span>
          </h2>
          <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.65, maxWidth: 560, marginBottom: 40 }}>
            Not sure where to start? Here&apos;s a quick feel for four of Manchester&apos;s most popular places to rent.
          </p>
          <div className="area-grid">
            {areas.map((a, i) => (
              <a key={a.name} href="/listings" className="area-card t-reveal" style={{ animationDelay: `${i * 70}ms` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={`${a.name}, Manchester`} loading="lazy" />
                <span className="area-overlay" />
                <span className="area-text">
                  <span className="area-name" style={{ display: "block" }}>{a.name}</span>
                  <span className="area-desc" style={{ display: "block" }}>{a.desc}</span>
                  <span className="area-cta">
                    Browse homes
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </span>
              </a>
            ))}
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
                When you've seen the property and want to move forward, a holding deposit takes it off the market while your application is processed.
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.75, marginBottom: 32 }}>
                That deposit is{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>deducted from your first month's rent</span>{" "}
                , so you're not paying it on top of anything. It's just paying your rent a little early.
              </p>

              {/* ── MAINTENANCE CTA ── */}
              <div style={{ border: "1px solid rgba(37,99,235,0.4)", borderRadius: 14, padding: "20px 24px", background: "rgba(37,99,235,0.08)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Already renting with us? Something broken?</div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    If you have a maintenance issue or fault in your property, report it here with a few photos and we&apos;ll get it sorted.
                  </p>
                </div>
                <a
                  href="/maintenance/report"
                  className="t-cta-btn"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
                    boxSizing: "border-box", minHeight: 48, lineHeight: 1.2,
                    alignSelf: "flex-start", background: "#0A46EF", color: "#fff", fontWeight: 700,
                    fontSize: 13.5, padding: "14px 28px", border: "1.5px solid transparent",
                    borderRadius: 10, textDecoration: "none",
                    letterSpacing: "0.02em",
                    boxShadow: "0 12px 24px -10px rgba(10,70,239,0.6)",
                  }}
                >
                  🔧 Report a maintenance issue →
                </a>
              </div>
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
        <div className="t-sec" style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ color: "#0A46EF", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 800 }}>
            Common Questions
          </p>
          <h2 className="t-head t-reveal" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 40, letterSpacing: "-0.02em", color: "#0f172a" }}>
            <span className="t-accent t-reveal">FAQs</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.25)", borderBottom: i === faqs.length - 1 ? "1px solid rgba(0,0,0,0.25)" : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", background: "none", border: "none", color: "#0f172a", textAlign: "left", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 16, fontWeight: 600, gap: 16 }}
                >
                  {faq.q}
                  <span style={{ color: "#0A46EF", fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)" }}>+</span>
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
            border: "2px solid #253996",
            borderRadius: 18,
            padding: "60px 40px",
            background: "rgba(4,10,24,0.94)",
            textAlign: "center",
            overflow: "hidden",
            animation: "t-cta-pulse 5s ease-in-out infinite",
          }}
        >
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
              className="t-cta-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                boxSizing: "border-box",
                minHeight: 48,
                lineHeight: 1.2,
                background: "#0A46EF",
                color: "#fff",
                padding: "14px 30px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: "none",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                border: "1.5px solid rgba(255,255,255,0.18)",
                marginTop: 8,
                boxShadow: "0 14px 30px -12px rgba(10,70,239,0.7)",
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
