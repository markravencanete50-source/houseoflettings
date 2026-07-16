"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import ServiceHero from "@/components/layout/ServiceHero";
import Footer from "@/components/layout/Footer";
import { guidesByDate } from "@/lib/guides";

/* ─────────────────────────────────────────────────────────────────────────
   Tenant page — hi-fi redesign.
   Palette: blue is the lead colour, green the warm secondary, black/white the
   base, and a single yellow-orange accent reserved for the maintenance CTA.
   Blue TEXT rule: #0A46EF for small text (kickers/meta), #253996 for big/bold.
   ───────────────────────────────────────────────────────────────────────── */
const BLUE_SM = "#0A46EF";   // small blue text + primary buttons
const BLUE_LG = "#253996";   // big/bold blue text + button hover
const INK = "#182135";       // headings / near-black
const BODY = "#4b5568";      // paragraph copy
const GREEN = "#629D2A";
const GREEN_DEEP = "#4a7a1f";
const GREEN_TINT = "#eef5e3";
const GREEN_BORDER = "#d6e8bd";
const YELLOW = "#F5A623";
const ALT_BG = "#f4f7fc";
const HAIR = "#eceff4";

const journey = [
  { num: "01", title: "Browse Properties", desc: "Search homes across Leeds & Manchester by price, area and bedrooms." },
  { num: "02", title: "Book Your Viewing Online", desc: "Pick a time that works for you and confirm instantly — fully online." },
  { num: "03", title: "View the Home", desc: "Meet our local team at the property and take your time looking around." },
  { num: "04", title: "Apply Online", desc: "Submit your application digitally and upload documents securely." },
  { num: "05", title: "Referencing & Checks", desc: "Identity, right to rent, credit and employment — all handled digitally." },
  { num: "06", title: "Pay the Holding Deposit", desc: "Takes the home off the market — deducted from your first month's rent." },
  { num: "07", title: "Sign Your Tenancy", desc: "Review and e-sign your agreement from any device." },
  { num: "08", title: "Collect Keys & Move In", desc: "We hand over the keys and help you settle into your new home." },
];

const pillars = [
  { icon: "💻", title: "Online, start to finish", desc: "Viewings, applications and maintenance — no calls, no messages, no emails." },
  { icon: "📍", title: "A real local team", desc: "People in Leeds and Manchester who know the streets you're searching." },
  { icon: "🤝", title: "Help & Support", desc: "Repairs coordinated with the right contractor, fast — and you're kept updated." },
];

const reviews = [
  { tag: "Viewing", quote: "Booked a viewing online in about two minutes and had the keys within the fortnight. Easily the smoothest rental I've ever done.", name: "Aisha R.", detail: "City centre apartment · Leeds" },
  { tag: "Application", quote: "The whole application was online. I uploaded my documents from my phone on a lunch break and got approved quickly. No paperwork stress.", name: "Daniel & Megan", detail: "Two-bed house · Manchester" },
  { tag: "Maintenance", quote: "Our boiler played up in winter. I reported it with a couple of photos and they had someone out fast. Felt genuinely looked after.", name: "Tomasz K.", detail: "Suburban flat · Leeds" },
];

const areas = [
  { name: "Northern Quarter", desc: "Coffee shops, bars & a lively city feel", img: "/images/areas/northern-quarter.webp" },
  { name: "Castlefield", desc: "Central but quieter, scenic canalside", img: "/images/areas/castlefield.webp" },
  { name: "Salford Quays", desc: "Waterside apartment living & transport links", img: "/images/areas/salford-quays.webp" },
  { name: "Deansgate", desc: "Restaurants, bars & city-centre convenience", img: "/images/areas/deansgate.webp" },
];

const maintSteps = [
  { num: "1", title: "Tell Us The Issue", desc: "Answer a couple of quick questions online" },
  { num: "2", title: "Send a Picture", desc: "Show us exactly what's wrong" },
  { num: "3", title: "We Coordinate Contractors", desc: "The right trade, arranged as soon as possible" },
  { num: "4", title: "Receive Updates", desc: "Kept in the loop until it's fixed" },
];

const promises = [
  "Honest communication",
  "Transparent process",
  "Fast maintenance support",
  "Friendly local team",
  "Professional property management",
];

const feeRows = [
  { label: "Agency fees", desc: "Always free for tenants", value: "£0" },
  { label: "Holding deposit", desc: "Deducted from first month's rent", value: "Varies" },
  { label: "Application forms", desc: "Quick and fully digital", value: "Online" },
  { label: "Viewing fee", desc: "No charge to view a property", value: "£0" },
];

const faqs = [
  { q: "Is it free to rent through House of Lettings?", a: "Yes, there are no agency fees for tenants. The only payment before moving in is a holding deposit to secure the property, which is deducted from your first month's rent." },
  { q: "What is the holding deposit?", a: "A holding deposit reserves the property while your application is processed. It's fully deducted from your first rent payment, so it comes straight off what you'd pay anyway." },
  { q: "How quickly can I book a viewing?", a: "You can book online in minutes. Choose a time that suits you and confirm your viewing instantly, no phone calls or waiting for a callback." },
  { q: "What checks do you run?", a: "Standard referencing: identity, right to rent, employment/income and a previous landlord reference where applicable. All handled digitally." },
  { q: "Which areas do you cover?", a: "We operate across Leeds and Manchester, covering a wide range of property types from city centre apartments to family homes." },
  { q: "Can I apply if I'm self employed or a student?", a: "Yes. We assess applications individually and work with a range of tenant profiles. Get in touch and we'll let you know what we need from you." },
];

export default function TenantsPage() {
  const [openFaq, setOpenFaq] = useState<number>(0);

  // JS-gated scroll reveal — content stays visible if scripting is unavailable.
  useEffect(() => {
    document.body.classList.add("tp-js");
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
    <main style={{ background: "#fff", color: INK, fontFamily: "'Poppins', 'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        .tp-wrap { max-width: 1200px; margin: 0 auto; padding: 88px 48px; }
        .tp-kicker { font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: ${BLUE_SM}; margin: 0 0 14px; }
        .tp-h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 800; letter-spacing: -0.01em; line-height: 1.14; color: ${INK}; margin: 0; }
        .tp-lead { font-size: 16px; line-height: 1.7; color: ${BODY}; }
        .tp-2col { display: grid; grid-template-columns: 1.05fr 1fr; gap: 60px; align-items: center; }

        /* Buttons — uniform pill sizing */
        .tp-btn { height: 54px; min-width: 225px; padding: 0 34px; border-radius: 999px;
          font-size: 16px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;
          gap: 10px; text-decoration: none; box-sizing: border-box; cursor: pointer; border: 1.5px solid transparent;
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease, border-color .22s ease; }
        .tp-btn.sm { height: 50px; }
        .tp-blue { background: ${BLUE_SM}; color: #fff; box-shadow: 0 12px 26px rgba(10,70,239,0.28); }
        .tp-blue:hover { background: ${BLUE_LG}; transform: translateY(-2px); box-shadow: 0 18px 34px rgba(10,70,239,0.36); }
        .tp-yellow { background: ${YELLOW}; color: ${INK}; box-shadow: 0 12px 26px rgba(245,166,35,0.32); }
        .tp-yellow:hover { background: #e2951a; transform: translateY(-2px); box-shadow: 0 18px 34px rgba(245,166,35,0.4); }
        .tp-ink { background: ${INK}; color: #fff; }
        .tp-ink:hover { background: #0e1626; transform: translateY(-2px); }
        .tp-ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,0.5); }
        .tp-ghost:hover { border-color: #fff; background: rgba(255,255,255,0.08); }

        /* Cards — soft depth over flat borders */
        .tp-card { background: #fff; border: 1px solid rgba(24,33,53,0.05); border-radius: 18px; padding: 26px;
          box-shadow: 0 14px 34px -14px rgba(24,33,53,0.16), 0 3px 10px -4px rgba(24,33,53,0.08);
          transition: transform .34s cubic-bezier(.22,1,.36,1), box-shadow .34s ease, border-color .34s ease; }
        .tp-card:hover { transform: translateY(-10px) scale(1.012); border-color: rgba(29,78,216,0.28);
          box-shadow: 0 30px 56px -20px rgba(29,78,216,0.28), 0 10px 22px -12px rgba(24,33,53,0.18); }
        /* Journey cards — extra blue-tinted depth so they never read as flat white */
        .tp-journey .tp-card { box-shadow: 0 18px 40px -16px rgba(29,78,216,0.22), 0 4px 14px -4px rgba(24,33,53,0.12); }
        .tp-journey .tp-card:hover { box-shadow: 0 34px 60px -20px rgba(29,78,216,0.34), 0 10px 22px -12px rgba(24,33,53,0.2); }

        .tp-numchip { width: 46px; height: 46px; border-radius: 12px; background: #e8effd; color: ${BLUE_LG};
          font-size: 15px; font-weight: 800; display: inline-grid; place-items: center;
          box-shadow: 0 8px 18px -8px rgba(10,70,239,0.35);
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .3s; }
        .tp-card:hover .tp-numchip { transform: scale(1.12) rotate(-4deg); background: #dbe7fd; }

        /* Chips / pills — dark-blue background with a green tick, lift on hover */
        .tp-chip { display: inline-flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 700;
          color: #e7eefb; background: linear-gradient(135deg, #1c2b4d 0%, #101a30 100%);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 10px 18px;
          box-shadow: 0 10px 24px -10px rgba(16,26,48,0.7); transition: transform .22s ease, box-shadow .22s ease; }
        .tp-chip:hover { transform: translateY(-2px); box-shadow: 0 16px 30px -10px rgba(16,26,48,0.85); }

        /* Promise pills — dark-blue background with a green tick (matches the chips) */
        .tp-promise { display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #1c2b4d 0%, #101a30 100%);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 12px 20px; font-size: 15px; font-weight: 700; color: #e7eefb;
          box-shadow: 0 10px 24px -10px rgba(16,26,48,0.7); transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease; }
        .tp-promise:hover { transform: translateY(-4px); box-shadow: 0 18px 34px -12px rgba(16,26,48,0.85); }

        /* Image frames — subtle zoom on hover */
        .tp-imgframe { transition: box-shadow .35s ease; }
        .tp-imgframe img { transition: transform .7s cubic-bezier(.22,1,.36,1); }
        .tp-imgframe:hover img { transform: scale(1.05); }

        /* Area cards */
        .area-grid, .leeds-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: stretch; }
        .area-card { position: relative; display: block; overflow: hidden; border-radius: 20px; height: 300px;
          text-decoration: none; box-shadow: 0 16px 36px -14px rgba(24,33,53,0.22);
          transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease; }
        .area-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .area-card:hover { transform: translateY(-8px); box-shadow: 0 34px 60px -22px rgba(24,33,53,0.4); }
        .area-card:hover img { transform: scale(1.08); }
        .area-ov { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(24,33,53,0) 34%, rgba(24,33,53,0.82) 100%); }
        .area-txt { position: absolute; left: 18px; right: 18px; bottom: 16px; color: #fff; z-index: 1; }

        /* Leeds property cards — stretch each to equal height so buttons align */
        .leeds-grid > .reveal { display: flex; }
        .leeds-grid > .reveal > * { flex: 1; }

        /* Pillars (light section) — white cards with depth */
        .tp-pillar { display: flex; gap: 16px; align-items: flex-start; background: #fff;
          border: 1px solid rgba(29,78,216,0.08); border-radius: 16px; padding: 20px 22px;
          box-shadow: 0 14px 32px -16px rgba(24,33,53,0.16);
          transition: transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-color .32s ease; }
        .tp-pillar:hover { transform: translateX(6px) translateY(-3px); border-color: rgba(29,78,216,0.28);
          box-shadow: 0 24px 44px -18px rgba(29,78,216,0.28); }
        .tp-pillar-ic { flex-shrink: 0; width: 48px; height: 48px; border-radius: 12px;
          background: linear-gradient(140deg, ${BLUE_SM}, ${BLUE_LG});
          display: grid; place-items: center; font-size: 22px; box-shadow: 0 10px 20px -8px rgba(10,70,239,0.5);
          transition: transform .35s cubic-bezier(.34,1.56,.64,1); }
        .tp-pillar:hover .tp-pillar-ic { transform: scale(1.08) rotate(-4deg); }

        /* Maintenance timeline */
        .tp-timeline { display: flex; flex-direction: column; gap: 14px; }
        .tp-tl-row { display: flex; gap: 16px; align-items: flex-start; }
        .tp-tl-num { flex-shrink: 0; width: 40px; height: 40px; border-radius: 999px; background: ${BLUE_SM}; color: #fff;
          font-weight: 800; display: grid; place-items: center; box-shadow: 0 8px 16px rgba(10,70,239,0.35); }

        /* Reveal */
        .tp-js .reveal { opacity: 0; }
        .tp-js .reveal.in { animation: tp-rise .65s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes tp-rise { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
        @keyframes tp-floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .tp-float { animation: tp-floaty 4s ease-in-out infinite; }

        /* Responsive */
        @media (max-width: 980px) {
          .tp-2col { grid-template-columns: 1fr; gap: 40px; }
          .tp-2col .tp-media-right { order: -1; }
          .area-grid, .leeds-grid { grid-template-columns: repeat(2, 1fr); }
          .tp-journey { grid-template-columns: repeat(2, 1fr) !important; }
          .tp-reviews { grid-template-columns: 1fr !important; }
          .tp-pillars-wrap { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .tp-wrap { padding: 56px 20px; }
          .area-grid, .leeds-grid, .tp-journey { grid-template-columns: 1fr !important; }
          .area-card { height: 240px; }
          .tp-btn { width: 100%; }
          .tp-h1 { font-size: 40px !important; }
          /* A Place to Call Home becomes one self-contained card:
             image on top → text → buttons (pricing-card style). */
          .tp-aptc {
            padding: 0 !important; margin: 40px 20px; max-width: none; gap: 0 !important;
            background: #fff; border: 1px solid ${HAIR}; border-radius: 18px; overflow: hidden;
            box-shadow: 0 16px 38px -16px rgba(24,33,53,0.2);
          }
          .tp-aptc .tp-imgframe { border-radius: 0 !important; box-shadow: none !important; height: 210px; }
          .tp-aptc > div:last-child { padding: 24px 22px 28px; }
          /* Our Commitment pills sit to the left on mobile */
          .tp-promise-row { justify-content: flex-start !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tp-card, .tp-card:hover, .area-card, .area-card:hover, .area-card img, .tp-pillar, .tp-pillar:hover,
          .tp-pillar-ic, .tp-btn, .tp-numchip, .tp-chip, .tp-promise, .tp-imgframe img, .tp-float {
            transition: none !important; animation: none !important; transform: none !important;
          }
          .tp-js .reveal { opacity: 1; }
          .tp-js .reveal.in { animation: none; }
        }
      `}</style>

      <Navbar />

      {/* ── 1 · HERO (previous design — Browse Properties highlighted + Report a Maintenance) ── */}
      <ServiceHero
        eyebrow="For Tenants · Leeds & Manchester"
        title={<>Looking for your next home? <span style={{ color: "#6ea8ff" }}>House of Lettings holds the key.</span></>}
        subtitle="No agency fees. No endless forms. Browse available homes, book viewings online and manage maintenance in a few taps."
        image="/images/heropage.webp"
        imageAlt="Happy family holding the keys to their new rented home"
        ctas={[
          { label: "Browse Properties", href: "/listings" },
          { label: "Report a Maintenance", href: "/maintenance/report", variant: "ghost" },
        ]}
        float={{ label: "Tenant fees", value: "£0", sub: "No agency fees, ever" }}
      />

      {/* ── 2 · A PLACE TO CALL HOME ── */}
      <section style={{ background: ALT_BG }}>
        <div className="tp-wrap tp-2col tp-aptc">
          <div className="reveal">
            <div className="tp-imgframe" style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 26px 60px -20px rgba(24,33,53,0.32)", height: 400 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/family-kitchen.webp" alt="A family enjoying a meal together in their kitchen" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            </div>
          </div>
          <div className="reveal">
            <p className="tp-kicker">A Place to Call Home</p>
            <h2 className="tp-h2" style={{ marginBottom: 18 }}>More Than a Property.<br />A Place to Call Home.</h2>
            <p className="tp-lead" style={{ maxWidth: 520, marginBottom: 24 }}>
              Whether you&apos;re moving across the city or starting a new chapter, we&apos;re here to make
              renting simple, transparent and stress-free.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
              {["Expert local team", "No agency fees", "Support that lasts"].map((t) => (
                <span key={t} className="tp-chip">
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: "rgba(74,222,128,0.16)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                  </span>
                  {t}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch", maxWidth: 380 }}>
              <span className="tp-btn sm tp-ink" style={{ cursor: "default", width: "100%", minWidth: 0 }}>Homes across Leeds &amp; Manchester</span>
              <a href="/listings" className="tp-btn sm tp-blue" style={{ width: "100%", minWidth: 0 }}>Ready to find your next home? →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · YOUR JOURNEY HOME ── */}
      <section>
        <div className="tp-wrap">
          <div className="reveal" style={{ marginBottom: 44 }}>
            <p className="tp-kicker">Your Journey Home</p>
            <h2 className="tp-h2">Your journey <span style={{ color: BLUE_LG }}>in eight simple steps.</span></h2>
          </div>
          <div className="tp-journey" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {journey.map((s, i) => (
              <div key={s.num} className="tp-card reveal" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="tp-numchip">{s.num}</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: "16px 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: BODY, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · WHAT MAKES US DIFFERENT (light) ── */}
      <section style={{ background: "linear-gradient(160deg, #eef3ff 0%, #f7f9fd 100%)", borderTop: "1px solid #e3ebfb", borderBottom: "1px solid #e3ebfb" }}>
        <div className="tp-wrap tp-2col">
          <div className="reveal">
            <p className="tp-kicker">What Makes Us Different</p>
            <h2 className="tp-h2" style={{ marginBottom: 22 }}>
              We got tired of renting feeling like a chase.
            </h2>
            <p style={{ color: BODY, fontSize: 16, lineHeight: 1.75, marginBottom: 18 }}>
              Endless phone calls that go unanswered. Emails lost in someone&apos;s inbox. Agents who vanish
              the day you sign. That&apos;s the renting most people know — and it&apos;s exactly what we set out to end.
            </p>
            <p style={{ color: BODY, fontSize: 16, lineHeight: 1.75, marginBottom: 22 }}>
              So we rebuilt the whole experience around you. Every step lives <span style={{ fontWeight: 700 }}>online</span> —
              booking a viewing, applying, reporting a repair — and behind it sits an expert local team who actually pick up when it matters.
            </p>
            <p style={{ color: INK, fontSize: 18, fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
              Renting shouldn&apos;t feel like chasing. <span style={{ color: GREEN }}>It should feel like coming home.</span>
            </p>
          </div>
          <div className="tp-pillars-wrap reveal" style={{ display: "grid", gap: 16 }}>
            {pillars.map((p) => (
              <div key={p.title} className="tp-pillar">
                <span className="tp-pillar-ic">{p.icon}</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: "2px 0 6px" }}>{p.title}</h3>
                  <p style={{ fontSize: 14, color: BODY, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 · LOVED BY TENANTS ── */}
      <section style={{ background: ALT_BG }}>
        <div className="tp-wrap">
          <div className="reveal" style={{ textAlign: "center", marginBottom: 44 }}>
            <p className="tp-kicker">Loved by Tenants</p>
            <h2 className="tp-h2">Renting people actually enjoyed.</h2>
          </div>
          <div className="tp-reviews" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {reviews.map((r, i) => (
              <div key={r.name} className="tp-card reveal" style={{ animationDelay: `${i * 60}ms`, display: "flex", flexDirection: "column", gap: 14, border: `1px solid ${GREEN_BORDER}`, boxShadow: "0 16px 38px -14px rgba(98,157,42,0.24), 0 4px 14px -4px rgba(24,33,53,0.1)" }}>
                <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: GREEN_DEEP, background: GREEN_TINT, border: `1px solid ${GREEN_BORDER}`, borderRadius: 999, padding: "5px 12px" }}>{r.tag}</span>
                <p style={{ fontSize: 15, color: INK, lineHeight: 1.7, margin: 0, flexGrow: 1 }}>&ldquo;{r.quote}&rdquo;</p>
                <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: BODY, marginTop: 2 }}>{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 · EXPLORE MANCHESTER ── */}
      <section>
        <div className="tp-wrap">
          <div className="reveal" style={{ marginBottom: 36 }}>
            <p className="tp-kicker">Explore Manchester</p>
            <h2 className="tp-h2">Find the area that suits your lifestyle.</h2>
          </div>
          <div className="area-grid">
            {areas.map((a, i) => (
              <a key={a.name} href="/listings" className="area-card reveal" style={{ animationDelay: `${i * 60}ms` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={`${a.name}, Manchester`} loading="lazy" />
                <span className="area-ov" />
                <span className="area-txt">
                  <span style={{ display: "block", fontSize: 19, fontWeight: 800, marginBottom: 5 }}>{a.name}</span>
                  <span style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.45 }}>{a.desc}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · REPORTING MAINTENANCE ── */}
      <section id="maintenance">
        <div className="tp-wrap tp-2col">
          <div className="reveal">
            <p className="tp-kicker" style={{ color: GREEN_DEEP }}>Already Renting With Us?</p>
            <h2 className="tp-h2" style={{ marginBottom: 18 }}>Need Help? Reporting Maintenance Is Easy.</h2>
            <p className="tp-lead" style={{ maxWidth: 500, marginBottom: 28 }}>
              It&apos;s fully online — answer a couple of questions, send a picture and submit your request.
              We&apos;ll coordinate it with the right contractor as soon as possible and keep you updated throughout.
            </p>
            <a href="/maintenance/report" className="tp-btn tp-yellow">🔧 Report a Maintenance Issue</a>
          </div>
          <div className="reveal">
            <div className="tp-timeline">
              {maintSteps.map((m) => (
                <div key={m.num} className="tp-card tp-tl-row" style={{ padding: "18px 20px" }}>
                  <span className="tp-tl-num">{m.num}</span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: "6px 0 4px" }}>{m.title}</h3>
                    <p style={{ fontSize: 13.5, color: BODY, lineHeight: 1.5, margin: 0 }}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9 · OUR PROMISE ── */}
      <section style={{ background: GREEN_TINT, borderTop: `1px solid ${GREEN_BORDER}`, borderBottom: `1px solid ${GREEN_BORDER}` }}>
        <div className="tp-wrap" style={{ textAlign: "center" }}>
          <p className="tp-kicker reveal" style={{ color: GREEN_DEEP }}>Our Commitment</p>
          <h2 className="tp-h2 reveal" style={{ marginBottom: 32 }}>Our Promise to Every Tenant</h2>
          <div className="reveal tp-promise-row" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
            {promises.map((p) => (
              <span key={p} className="tp-promise">
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "rgba(74,222,128,0.16)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                </span>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10 · HOLDING DEPOSIT EXPLAINED ── */}
      <section>
        <div className="tp-wrap tp-2col">
          <div className="reveal">
            <p className="tp-kicker">The Small Print, Made Clear</p>
            <h2 className="tp-h2" style={{ marginBottom: 18 }}>The holding deposit explained.</h2>
            <p className="tp-lead" style={{ marginBottom: 16 }}>
              When you&apos;ve seen the property and want to move forward, a holding deposit takes it off the
              market while your application is processed.
            </p>
            <p className="tp-lead" style={{ margin: 0 }}>
              That deposit is <strong style={{ color: INK }}>deducted from your first month&apos;s rent</strong>, so
              you&apos;re not paying it on top of anything. It&apos;s just paying your rent a little early.
            </p>
          </div>
          <div className="reveal">
            <div className="tp-card" style={{ padding: "8px 26px" }}>
              {feeRows.map((f, i) => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: i < feeRows.length - 1 ? `1px solid ${HAIR}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{f.label}</div>
                    <div style={{ fontSize: 12.5, color: BODY, marginTop: 2 }}>{f.desc}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: BLUE_LG, flexShrink: 0, marginLeft: 16 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 11 · RENTING GUIDES ── */}
      <section>
        <style>{`
          .g-teaser-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
          .g-teaser { display: flex; flex-direction: column; background: #fff; border: 1px solid ${HAIR};
            border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit;
            box-shadow: 0 10px 26px rgba(24,33,53,0.05);
            transition: transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-color .32s ease; }
          .g-teaser:hover { transform: translateY(-8px); border-color: #bdd2fa; box-shadow: 0 18px 40px rgba(29,78,216,0.14); }
          .g-teaser-img { position: relative; height: 190px; overflow: hidden; }
          .g-teaser-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
          .g-teaser:hover .g-teaser-img img { transform: scale(1.06); }
          @media (max-width: 900px) { .g-teaser-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div className="tp-wrap">
          <div className="reveal" style={{ textAlign: "center", marginBottom: 40 }}>
            <p className="tp-kicker">Renting Guides</p>
            <h2 className="tp-h2" style={{ marginBottom: 14 }}>Benefit from our expertise.</h2>
            <p className="tp-lead" style={{ maxWidth: 620, margin: "0 auto" }}>
              Practical guides covering the topics and tips that matter most to tenants — from holding
              deposits to moving-in day.
            </p>
          </div>

          <div className="g-teaser-grid">
            {guidesByDate.slice(0, 3).map((g, i) => (
              <a key={g.slug} href={`/guides/${g.slug}`} className="g-teaser reveal" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="g-teaser-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.image} alt={g.title} loading="lazy" />
                </span>
                <span style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{g.title}</span>
                  <span style={{ fontSize: 13.5, color: BODY, lineHeight: 1.55, flex: 1 }}>{g.excerpt}</span>
                  <span style={{ fontSize: 12.5, color: "#7a889c", marginTop: 2 }}>{g.dateLabel} · {g.readMins} min read</span>
                </span>
              </a>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a href="/guides" className="tp-btn tp-blue" style={{ display: "inline-flex" }}>View all guides</a>
          </div>
        </div>
      </section>

      {/* ── 12 · FAQs (last) ── */}
      <section style={{ background: ALT_BG }}>
        <div className="tp-wrap" style={{ maxWidth: 820 }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 36 }}>
            <p className="tp-kicker">Common Questions</p>
            <h2 className="tp-h2">FAQs</h2>
          </div>
          <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} className="tp-card" style={{ padding: "4px 24px" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  style={{ width: "100%", background: "none", border: "none", color: INK, textAlign: "left", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, gap: 16 }}
                >
                  {faq.q}
                  <span style={{ color: BLUE_SM, fontSize: 24, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)" }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ color: BODY, fontSize: 15, lineHeight: 1.7, padding: "0 0 20px", margin: 0 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
      <Footer />
    </>
  );
}
