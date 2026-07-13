'use client';
// app/pricing/page.tsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import { BUNDLES } from '@/lib/bundles';
import { MATRIX_SECTIONS, TOTAL_SERVICES, PRICING_FAQ } from '@/lib/pricingMatrix';
import { useCart } from '@/components/services/CartProvider';
import { newSelection } from '@/lib/serviceCart';
import CartBar from '@/components/services/CartBar';
import Footer from '@/components/layout/Footer';

const PACKAGES = BUNDLES;
const VISIBLE_ROWS = 7;   // rows shown per matrix section before "Show more"
const HOT = 3;            // Full Management column index (Most Popular)

// Decision guide shown AFTER the comparison table. An alternating left/right
// layout: plain-English "who it's for" copy on one side, a designed spec panel
// (price + what's included) on the other. Index matches BUNDLES order. Copy
// avoids em/en dashes per the site copy rule.
// `fit` is the mobile-facing version of `points`: the same "who it's for"
// guidance written as one flowing sentence rather than a repeating tick list,
// per client feedback that the mobile explanation read as bullet points.
const EXPLAINERS: { kicker: string; lead: string; body: string; extra: string; fit: string; points: string[]; highlights: string[] }[] = [
  {
    kicker: 'Tenant Find · £399 one-time',
    lead: 'Choose this if you have the time to run the tenancy and handle maintenance yourself.',
    body: 'You live near the property and are happy to be the point of contact once a tenant moves in. We do the hard part remotely: market the property, vet applicants and reference them fully, then hand you a signed tenancy agreement. One fixed fee, no ongoing cost.',
    extra: 'Everything is handled online, so you are never tied to office hours. We advertise across the major portals, qualify every enquiry, run full referencing and Right to Rent checks, then send you the signed tenancy and collect the first month’s rent and deposit. From move in day you take over as the point of contact, and there is nothing more to pay.',
    fit: 'It suits you if you live close by and can deal with day-to-day issues, are comfortable arranging your own repairs, and simply want a fully referenced tenant found fast for one fixed fee.',
    points: [
      'You live close by and can deal with day to day issues',
      'You are comfortable arranging your own repairs',
      'You want a fully referenced tenant found fast, for one fixed fee',
    ],
    highlights: [
      'Advertising on major property portals',
      'Full applicant referencing and Right to Rent checks',
      'Tenancy agreement and deposit registration',
      'First month’s rent and deposit collected',
    ],
  },
  {
    kicker: 'Tenant Find · £699 one-time',
    lead: 'Choose this if you want the strongest tenant at the best rent, but still want to self manage.',
    body: 'We handle the full marketing and referencing for you, then add professional photography, a floor plan, accompanied viewings and a full in-person handover. It is the complete marketing push to attract stronger applicants and achieve a higher rent, and you keep control of the tenancy once it starts.',
    extra: 'On top of everything in the Virtual Tenant Find, our team photographs the property, produces a floor plan and hosts accompanied viewings so applicants see it at its best. We meet your tenant in person to hand over the keys and complete the paperwork. Stronger presentation usually means more interest, better quality applicants and a higher achievable rent.',
    fit: 'It suits you if you want your property to stand out with professional photos and accompanied viewings, are happy to manage the tenancy yourself, and want to maximise your rent with expert marketing.',
    points: [
      'You want your property to stand out with pro photos and viewings',
      'You are happy to manage the tenancy yourself',
      'You want to maximise rent with expert marketing',
    ],
    highlights: [
      'Everything in Virtual Tenant Find',
      'Professional photography and floor plan',
      'Agent-led accompanied viewings',
      'In-person tenant handover',
    ],
  },
  {
    kicker: 'Management · £199 then 6% of rent',
    lead: 'Choose this if you want the rent handled for you, but are happy to look after maintenance.',
    body: 'We collect the rent, monitor payments, chase any arrears and take care of the monthly admin, so the money side runs itself. You stay in control of repairs and choosing your own contractors. A light touch option for confident landlords.',
    extra: 'It starts with a full tenant find, then every month we collect the rent, check it lands on time, chase anything late and send you a clear statement. Repairs stay with you, so you keep your own trusted contractors and decide what gets done. You get the chasing and the admin off your plate while staying in control of the property itself.',
    fit: 'It suits you if you want rent collection and arrears chasing handled for you, are happy to arrange your own repairs and contractors, and want the admin off your plate without moving to full management.',
    points: [
      'You want rent collection and arrears chasing done for you',
      'You are happy to arrange your own repairs and contractors',
      'You want the admin off your plate without full management',
    ],
    highlights: [
      'Includes a full tenant find',
      'Monthly rent collection and monitoring',
      'Arrears chasing and reminders',
      'Key holding and annual income summary',
    ],
  },
  {
    kicker: 'Management · £399 then 8% of rent',
    lead: 'Choose this if you want the whole tenancy off your plate.',
    body: 'Rent, tenant communication, maintenance, contractor coordination and compliance, all managed by your local team. You do nothing day to day. This is the truly hands off choice and by far our most popular package.',
    extra: 'Your local team becomes the single point of contact for your tenant. We arrange repairs through vetted contractors, keep your gas, electrical and EPC compliance in date, carry out routine inspections and send you monthly statements. It is built for landlords who do not have the time, or do not live nearby, and want the confidence that nothing is missed.',
    fit: 'It suits you if you do not have the time, or do not live nearby, and want maintenance, contractors and compliance all handled for you so nothing is ever missed.',
    points: [
      'You do not have the time, or do not live nearby',
      'You want maintenance and contractors handled for you',
      'You want compliance tracked so nothing is missed',
    ],
    highlights: [
      'Dedicated day-to-day management team',
      'Maintenance and contractor coordination',
      'Compliance monitoring (Gas, EICR, EPC)',
      'Monthly landlord statements',
    ],
  },
  {
    kicker: 'Management · £399 then 10% of rent',
    lead: 'Choose this if you want maximum protection for your rental income.',
    body: 'Your local team manages the entire tenancy for you and adds rent guarantee cover, legal and eviction protection, priority contractor response and enhanced inspections. It is complete peace of mind, with your income protected even if a tenant stops paying.',
    extra: 'This is everything in Full Management, plus a safety net for your income. Rent guarantee cover pays out if your tenant stops paying, legal and eviction protection covers the cost of regaining possession, and you get priority contractor response with more thorough inspections. It is what landlords choose when they want their return protected whatever happens.',
    fit: 'It suits you if you want your rent guaranteed even during arrears, your legal and eviction costs covered, and priority repairs with enhanced inspections for complete peace of mind.',
    points: [
      'You want your rent guaranteed even during arrears',
      'You want legal and eviction costs covered',
      'You want priority repairs and enhanced inspections',
    ],
    highlights: [
      'Everything in Full Management',
      'Rent guarantee cover',
      'Legal and eviction protection',
      'Priority contractors and enhanced inspections',
    ],
  },
];

function TickIcon() {
  return (
    <i className="pr-tick" aria-hidden>
      <svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg>
    </i>
  );
}
function DashIcon() {
  return (
    <i className="pr-dash" aria-hidden>
      <svg viewBox="0 0 24 24"><line x1="6" y1="12" x2="18" y2="12" /></svg>
    </i>
  );
}

export default function PricingPage() {
  const [active, setActive] = useState(HOT);
  const [mobileTab, setMobileTab] = useState(HOT);   // selected package in the mobile compare view
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    postcode: '', addressLine1: '', propertyAddress: '', numberOfProperties: '', startDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const pkg = PACKAGES[active];

  // Total services included by the package selected in the mobile compare view.
  const mcIncluded = MATRIX_SECTIONS.reduce(
    (n, sec) => n + sec.rows.filter(r => !!r[mobileTab + 1]).length, 0);

  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState<number | null>(null);

  // Add a package to the basket (charged as its one-time setup fee; the ongoing
  // % is arranged by the account team). Shoppers proceed to the shared checkout.
  const addPackage = (i: number) => {
    const p = PACKAGES[i];
    addItem(newSelection(p.id, `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`));
    setJustAdded(i);
    setTimeout(() => setJustAdded(cur => (cur === i ? null : cur)), 2200);
  };

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  // Scroll-reveal for the decision-guide rows. Rows are visible by default; when
  // one scrolls into view we add `is-in`, which plays a one-shot entrance
  // animation. Because the resting state is visible, content can never be left
  // stuck hidden if scripting is slow or fails.
  useEffect(() => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.pr-svc-row'));
    if (!rows.length) return;
    let raf = 0;
    const cleanup = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    const reveal = () => {
      raf = 0;
      const trigger = window.innerHeight * 0.88;
      let remaining = false;
      rows.forEach(r => {
        if (r.classList.contains('is-in')) return;
        if (r.getBoundingClientRect().top < trigger) r.classList.add('is-in');
        else remaining = true;
      });
      if (!remaining) cleanup();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(reveal); };
    reveal(); // reveal anything already in view on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cleanup(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const openModalFor = (i: number) => { setActive(i); setShowModal(true); };

  const handleAddressSelect = useCallback((data: AddressResult) => {
    setFormData(p => ({
      ...p,
      postcode: data.postcode || p.postcode,
      addressLine1: data.street || p.addressLine1,
    }));
    setError('');
  }, []);

  const handleSubmit = async () => {
    setError('');
    const required = ['firstName','lastName','email','phone','postcode','addressLine1','numberOfProperties','startDate'];
    for (const f of required) {
      if (!formData[f as keyof typeof formData].trim()) {
        setError('Please fill in all fields.');
        return;
      }
    }
    // Compose the full property address from the postcode + first line so the
    // backend and confirmation emails keep working unchanged.
    const propertyAddress = [formData.addressLine1, formData.postcode].filter(Boolean).join(', ');
    setSubmitting(true);
    try {
      const res = await fetch('/api/get-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyAddress, selectedPackage: pkg.label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Something went wrong');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setError('');
    setFormData({ firstName: '', lastName: '', email: '', phone: '', postcode: '', addressLine1: '', propertyAddress: '', numberOfProperties: '', startDate: '' });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8, color: '#111827', fontSize: 14,
    fontFamily: "'Poppins', sans-serif",
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: '#374151', marginBottom: 6,
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <>
      <Navbar />

      <style>{`
        .pr-scope, .pr-scope * { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
        .pr-eyebrow { display:inline-block; font-size:12px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:#2563eb; margin-bottom:12px; }
        .pr-head { max-width:760px; margin:0 auto 30px; text-align:center; }
        .pr-head h2 { font-size:clamp(24px,3vw,34px); font-weight:700; color:#0f1f3d; margin:0 0 10px; line-height:1.15; }
        .pr-head p { color:#6b7280; font-size:15px; line-height:1.65; margin:0; }

        /* ---------- Trust strip ---------- */
        .pr-trust { max-width:1120px; margin:-52px auto 0; padding:0 5%; position:relative; z-index:3; }
        .pr-trust-in { background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          box-shadow:0 14px 34px -20px rgba(15,31,61,.28);
          display:grid; grid-template-columns:repeat(4,1fr); }
        .pr-trust-in div { padding:16px 18px; text-align:center; border-left:1px solid #eef1f5; }
        .pr-trust-in div:first-child { border-left:0; }
        .pr-trust-in .k { font-size:14px; font-weight:700; color:#0f1f3d; display:block; margin-bottom:2px; }
        .pr-trust-in .v { font-size:12px; color:#6b7280; }
        @media(max-width:720px){
          .pr-trust-in { grid-template-columns:repeat(2,1fr); }
          .pr-trust-in div:nth-child(odd){ border-left:0; }
          .pr-trust-in div:nth-child(3),.pr-trust-in div:nth-child(4){ border-top:1px solid #eef1f5; }
        }

        /* ---------- Comparison matrix ---------- */
        .pr-wrap { max-width:1200px; margin:64px auto 0; padding:0 5%; }
        .pr-matrix-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px;
          box-shadow:0 18px 40px -22px rgba(15,31,61,.3); overflow:hidden; }
        .pr-scroll-hint { display:none; font-size:12px; color:#6b7280; text-align:center; padding:10px 16px 0; }
        .pr-scroller { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .pr-scroller::-webkit-scrollbar { height:9px; }
        .pr-scroller::-webkit-scrollbar-thumb { background:#dbe2ea; border-radius:5px; }
        /* table-layout:fixed makes the columns share the container width exactly, so
           on desktop all five packages fill the row (never pushing Comprehensive off
           the edge). min-width is only the mobile scroll floor: 200 + 5*112 = 760. */
        .pr-table { border-collapse:separate; border-spacing:0; width:100%; min-width:760px; table-layout:fixed; }
        .pr-table th, .pr-table td { padding:0; }
        .pr-svc, .pr-corner { position:sticky; left:0; z-index:3; background:#fff; }
        .pr-table thead th { position:sticky; top:0; z-index:4; background:#0f1f3d; }
        .pr-table thead th.pr-corner { z-index:5; background:#0f1f3d; }
        .pr-pkg { width:112px; min-width:112px; vertical-align:bottom; padding:16px 8px 15px; text-align:center;
          color:#fff; border-left:1px solid rgba(255,255,255,.08); }
        .pr-badge { display:inline-block; font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          background:#2563eb; color:#fff; border-radius:999px; padding:3px 10px; margin-bottom:8px; }
        .pr-badge.pr-ghost { visibility:hidden; }
        .pr-name { font-size:14.5px; font-weight:700; line-height:1.2; display:block; margin-bottom:9px; }
        .pr-price { font-size:20px; font-weight:800; letter-spacing:-.01em; }
        .pr-per { display:block; font-size:10.5px; font-weight:500; color:#AFC6CC; margin-top:2px; }
        .pr-ongoing { display:block; font-size:11px; font-weight:700; color:#AFC6CC; margin-top:5px; padding-top:5px;
          border-top:1px solid rgba(255,255,255,.1); }
        .pr-ongoing.pr-rec { color:#7db4f0; }
        .pr-corner { vertical-align:bottom; text-align:left; padding:16px 18px 15px; color:#fff;
          min-width:200px; width:200px; }
        .pr-corner-t { font-size:16px; font-weight:700; display:block; }
        .pr-corner-s { font-size:11px; color:#AFC6CC; font-weight:400; }
        /* Fee summary rows */
        .pr-fee-row td { border-top:1px solid #e5e7eb; }
        .pr-fee-label { font-weight:700 !important; color:#0f1f3d !important; font-size:11.5px !important;
          text-transform:uppercase; letter-spacing:.05em; background:#e8f0fb !important; }
        .pr-fee-cell { width:112px; min-width:112px; text-align:center; font-weight:800; color:#0f1f3d;
          font-size:16px; padding:12px 0; border-left:1px solid #e5e7eb; background:#f0f6ff; }
        .pr-fee-onetime .pr-fee-label { background:#dbe8fb !important; }
        .pr-fee-onetime .pr-fee-cell { background:#e8f0fb; }
        .pr-fee-ongoing .pr-fee-cell { color:#2563eb; }
        .pr-fee-cell.pr-hot { background:#d6e6ff !important; }
        thead th.pr-hot { background:#1c3a63 !important; }
        .pr-hot { background:#eff5ff !important; }
        .pr-band td { background:#1a2c49; color:#fff; font-weight:700; font-size:11.5px; letter-spacing:.1em;
          text-transform:uppercase; padding:9px 18px; position:sticky; left:0; }
        .pr-band td span { position:sticky; left:18px; }
        .pr-svc { font-size:13px; padding:9px 16px; min-width:200px; width:200px; border-top:1px solid #eef1f5; color:#374151; }
        .pr-feat:nth-child(even) .pr-svc { background:#f6f9fc; }
        .pr-mark { width:112px; min-width:112px; text-align:center; border-top:1px solid #eef1f5;
          border-left:1px solid #eef1f5; font-size:0; padding:7px 0; }
        .pr-feat:nth-child(even) .pr-mark { background:#fafcfe; }
        .pr-feat:nth-child(even) .pr-mark.pr-hot { background:#e6f0ff !important; }
        .pr-tick, .pr-dash { display:inline-flex; width:22px; height:22px; border-radius:50%;
          align-items:center; justify-content:center; vertical-align:middle; }
        .pr-tick { background:#e7f6ee; }
        .pr-tick svg { width:12px; height:12px; stroke:#16a34a; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; }
        .pr-dash { background:#eef1f5; }
        .pr-dash svg { width:11px; height:11px; stroke:#b6c0cf; stroke-width:3; fill:none; stroke-linecap:round; }
        .pr-more-row td { border-top:1px solid #eef1f5; padding:0; background:#fff; position:sticky; left:0; }
        .pr-more-btn { width:100%; border:0; background:transparent; cursor:pointer; font-size:12.5px; font-weight:700;
          color:#2563eb; padding:11px 18px; text-align:left; display:flex; align-items:center; gap:9px; }
        .pr-more-btn:hover { background:#f2f5fb; }
        .pr-chev { display:inline-block; width:8px; height:8px; border-right:2px solid #2563eb;
          border-bottom:2px solid #2563eb; transform:rotate(45deg) translateY(-1px); transition:transform .15s ease; }
        .pr-chev.up { transform:rotate(-135deg) translateY(-1px); }
        .pr-cta-row td { padding:16px 10px 20px; text-align:center; border-top:2px solid #eef1f5; background:#fff; }
        .pr-cta-row td:first-child { position:sticky; left:0; background:#fff; }
        .pr-btn { display:inline-block; font-size:12px; font-weight:700; padding:9px 16px; border-radius:8px;
          border:1.5px solid #2563eb; color:#2563eb; background:transparent; transition:all .15s ease;
          white-space:nowrap; cursor:pointer; text-transform:uppercase; letter-spacing:.02em; }
        .pr-btn:hover { background:#2563eb; color:#fff; }
        .pr-btn.pr-solid { background:#2563eb; color:#fff; }
        .pr-btn.pr-solid:hover { background:#1e40af; }
        .pr-legend { display:flex; gap:22px; justify-content:center; flex-wrap:wrap; padding:16px 16px 6px;
          font-size:12.5px; color:#5b6e74; }
        .pr-legend span { display:inline-flex; align-items:center; gap:7px; }

        /* ---------- Compare: desktop table vs mobile per-package view ---------- */
        .pr-mobile-compare { display:none; }
        @media(max-width:860px){
          .pr-desktop-compare { display:none; }
          .pr-mobile-compare { display:block; }
        }
        .pr-mc-help { text-align:center; font-size:13px; color:#6b7280; margin:0 0 14px; }
        .pr-mc-pills { display:flex; gap:8px; overflow-x:auto; padding:2px 2px 14px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .pr-mc-pills::-webkit-scrollbar { display:none; }
        .pr-mc-pill { position:relative; flex:0 0 auto; border:1.5px solid #dbe2ea; background:#fff; color:#374151;
          border-radius:14px; padding:9px 16px 8px; cursor:pointer; white-space:nowrap; text-align:center; transition:all .15s ease; }
        .pr-mc-pill-name { display:block; font-size:13.5px; font-weight:700; line-height:1.2; }
        .pr-mc-pill-fee { display:block; font-size:10.5px; font-weight:600; opacity:.6; margin-top:2px; }
        .pr-mc-pill.active { background:#2563eb; border-color:#2563eb; color:#fff; box-shadow:0 8px 18px -8px rgba(37,99,235,.6); }
        .pr-mc-pill.active .pr-mc-pill-fee { opacity:.85; }
        .pr-mc-dot { position:absolute; top:6px; right:9px; width:6px; height:6px; border-radius:50%; background:#f59e0b; }
        .pr-mc-pill.active .pr-mc-dot { background:#fff; }
        .pr-mc-card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;
          box-shadow:0 16px 40px -26px rgba(15,31,61,.34); }
        .pr-mc-head { background:linear-gradient(155deg,#15294c,#0c1a33); color:#fff; padding:22px 20px 20px; }
        .pr-mc-head--hot { background:linear-gradient(155deg,#2563eb 0%,#12295a 60%,#0c1a33 100%); }
        .pr-mc-kindrow { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .pr-mc-kind { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#a9c4ea; }
        .pr-mc-tag { flex:none; font-size:9.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
          color:#dce8fa; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16);
          border-radius:999px; padding:4px 10px; }
        .pr-mc-name { display:block; font-size:21px; font-weight:800; margin:6px 0 6px; line-height:1.15; }
        .pr-mc-best { font-size:13px; font-weight:400; color:#c7d7f2; line-height:1.55; margin:0 0 14px; }
        .pr-mc-fees { display:flex; gap:12px; }
        .pr-mc-fees > div { flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14);
          border-radius:10px; padding:10px 12px; }
        .pr-mc-fees span { display:block; font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#a9c4ea; margin-bottom:3px; }
        .pr-mc-fees b { font-size:18px; font-weight:800; }
        .pr-mc-body { padding:20px 20px 4px; }
        .pr-mc-blurb { font-size:14px; color:#5b6472; line-height:1.75; margin:0 0 20px; }
        .pr-mc-sublabel { display:flex; align-items:baseline; justify-content:space-between; gap:10px;
          font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#8b96a5;
          margin:0 0 12px; }
        .pr-mc-sub-n { font-size:11px; font-weight:700; letter-spacing:0; text-transform:none; color:#2563eb; }
        .pr-mc-hl { list-style:none; margin:0 0 22px; padding:0; display:flex; flex-direction:column; gap:10px; }
        .pr-mc-hl li { display:flex; gap:11px; align-items:flex-start; font-size:14px; color:#374151; line-height:1.5; }
        .pr-mc-hl .pr-tick { flex:none; margin-top:1px; }
        .pr-mc-covs { display:flex; flex-direction:column; gap:13px; margin-bottom:6px; }
        .pr-mc-cov-top { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:6px; }
        .pr-mc-cov-top span { font-size:12.5px; font-weight:600; color:#374151; line-height:1.35; }
        .pr-mc-cov-top b { flex:none; font-size:11.5px; font-weight:700; color:#2563eb; }
        .pr-mc-cov-top b.pr-mc-cov-zero { color:#9ca3af; font-weight:600; }
        .pr-mc-bar { height:6px; border-radius:999px; background:#e8eef7; overflow:hidden; }
        .pr-mc-bar i { display:block; height:100%; border-radius:999px;
          background:linear-gradient(90deg,#2563eb,#4a90d9); transition:width .35s ease; }
        .pr-mc-all { display:flex; align-items:center; justify-content:center; gap:8px; margin:20px 0 4px;
          padding:13px 16px; border:1.5px solid #2563eb; border-radius:9px; color:#2563eb;
          font-size:13.5px; font-weight:700; text-decoration:none; text-align:center; line-height:1.3; }
        .pr-mc-all svg { flex:none; }
        .pr-mc-all:hover { background:#2563eb; color:#fff; }
        .pr-mc-cta { padding:18px; }
        .pr-mc-cta button { width:100%; padding:15px; background:#2563eb; color:#fff; border:none; border-radius:9px;
          font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; cursor:pointer; transition:background .18s ease; }
        .pr-mc-cta button:hover { background:#1d4ed8; }
        .pr-mc-foot { text-align:center; font-size:12px; color:#9ca3af; margin:14px 4px 0; line-height:1.6; }

        /* ---------- Decision guide: alternating copy / spec panel ---------- */
        .pr-guide { max-width:1160px; margin:80px auto 0; padding:0 5%; }
        .pr-guide .pr-head { text-align:center; }
        .pr-svcs { margin-top:52px; display:flex; flex-direction:column; gap:clamp(40px,6vw,72px); }
        .pr-svc-row { display:grid; grid-template-columns:1fr 1fr; gap:clamp(28px,4.5vw,68px); align-items:center; }
        /* Motion: elements are visible by default; is-in plays a one-shot entrance. */
        @keyframes pr-rise { from{ opacity:0; transform:translateY(30px);} to{ opacity:1; transform:none;} }
        @keyframes pr-in-left { from{ opacity:0; transform:translateX(-30px);} to{ opacity:1; transform:none;} }
        @keyframes pr-in-right { from{ opacity:0; transform:translateX(30px);} to{ opacity:1; transform:none;} }
        @keyframes pr-rise-sm { from{ opacity:0; transform:translateY(10px);} to{ opacity:1; transform:none;} }

        /* copy side */
        .pr-svc-kicker { display:inline-flex; flex-wrap:wrap; gap:10px; align-items:center; font-size:12px; font-weight:700;
          letter-spacing:.12em; text-transform:uppercase; color:#2563eb; margin-bottom:14px; }
        .pr-svc-kicker .pr-pop { background:#2563eb; color:#fff; border-radius:999px; padding:3px 11px; font-size:9.5px; letter-spacing:.08em; }
        .pr-svc-copy h3 { font-size:clamp(24px,2.7vw,32px); font-weight:800; color:#0f1f3d; margin:0 0 14px; line-height:1.16; letter-spacing:-.01em; }
        .pr-svc-lead { font-size:16.5px; font-weight:700; color:#0f1f3d; margin:0 0 12px; line-height:1.55; }
        .pr-svc-body { font-size:15px; color:#5b6472; line-height:1.85; margin:0 0 16px; }
        /* Fuller plain-English explanation shown in place of the old tick list. */
        .pr-svc-extra { font-size:15px; color:#5b6472; line-height:1.85; margin:0 0 26px; }
        .pr-svc-points { list-style:none; margin:0 0 28px; padding:0; display:flex; flex-direction:column; gap:11px; }
        .pr-svc-points li { display:flex; gap:11px; font-size:14.5px; color:#374151; line-height:1.5; }
        .pr-svc-points .pr-ptick { flex:none; width:20px; height:20px; border-radius:50%; background:#e7f6ee;
          display:inline-flex; align-items:center; justify-content:center; margin-top:1px; }
        .pr-svc-points .pr-ptick svg { width:11px; height:11px; stroke:#16a34a; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; }
        /* Prose alternative to the tick points; only shown on mobile. */
        .pr-svc-fit { display:none; font-size:15px; color:#5b6472; line-height:1.8; margin:0 0 24px; }
        .pr-svc-btn { display:inline-flex; align-items:center; gap:9px; padding:14px 30px; border-radius:9px; border:1.5px solid #2563eb;
          background:transparent; color:#2563eb; font-size:13.5px; font-weight:700; letter-spacing:.02em;
          text-transform:uppercase; text-decoration:none; cursor:pointer; transition:all .18s ease; }
        /* The whole spec panel is a link to the package's individual page. */
        .pr-svc-visual { text-decoration:none; color:inherit; display:block; cursor:pointer; }
        .pr-svc-btn svg { transition:transform .2s ease; }
        .pr-svc-btn:hover { background:#2563eb; color:#fff; box-shadow:0 10px 22px -10px rgba(37,99,235,.55); }
        .pr-svc-btn:hover svg { transform:translateX(3px); }
        .pr-svc-btn.pr-svc-btn--solid { background:#2563eb; color:#fff; }
        .pr-svc-btn.pr-svc-btn--solid:hover { background:#1d4ed8; border-color:#1d4ed8; }

        /* spec panel (the designed "image" side, no photo) */
        .pr-vis { position:relative; overflow:hidden; border-radius:20px; padding:clamp(26px,3vw,38px);
          background:linear-gradient(155deg,#15294c 0%,#0c1a33 100%); color:#fff;
          box-shadow:0 30px 60px -30px rgba(9,18,40,.7); border:1px solid rgba(255,255,255,.06);
          transition:transform .25s ease, box-shadow .25s ease; }
        .pr-svc-row:hover .pr-vis { transform:translateY(-5px); box-shadow:0 40px 72px -30px rgba(9,18,40,.8); }
        .pr-vis--hot { background:linear-gradient(155deg,#2563eb 0%,#122a5c 55%,#0c1a33 100%);
          border-color:rgba(120,170,255,.35); box-shadow:0 34px 66px -28px rgba(37,99,235,.55); }
        .pr-orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(2px); }
        .pr-orb-a { width:230px; height:230px; top:-70px; right:-50px;
          background:radial-gradient(circle, rgba(74,144,217,.4) 0%, transparent 70%); animation:pr-float-a 16s ease-in-out infinite; }
        .pr-orb-b { width:180px; height:180px; bottom:-60px; left:-40px;
          background:radial-gradient(circle, rgba(37,99,235,.32) 0%, transparent 70%); animation:pr-float-b 20s ease-in-out infinite; }
        .pr-vis--hot .pr-orb-a { background:radial-gradient(circle, rgba(147,197,255,.5) 0%, transparent 70%); }
        @keyframes pr-float-a { 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(-24px,20px) scale(1.08);} }
        @keyframes pr-float-b { 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(20px,-18px) scale(1.06);} }
        .pr-vis-top { position:relative; display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .pr-vis-kind { font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#a9c4ea; }
        .pr-vis-badge { font-size:9.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#0c1a33;
          background:#fff; border-radius:999px; padding:4px 11px; }
        .pr-vis-name { position:relative; font-size:clamp(20px,2.2vw,25px); font-weight:800; line-height:1.15; margin-bottom:16px; }
        .pr-vis-price { position:relative; display:flex; align-items:baseline; gap:9px; }
        .pr-vis-fee { font-size:clamp(34px,4.4vw,44px); font-weight:800; letter-spacing:-.02em; line-height:1; }
        .pr-vis-per { font-size:12.5px; font-weight:500; color:#a9c4ea; }
        .pr-vis-ongoing { position:relative; font-size:13px; font-weight:700; color:#7db4f0; margin-top:8px; }
        .pr-vis-ongoing.pr-vis-none { color:#8fa6c9; font-weight:600; }
        .pr-vis-div { position:relative; height:1px; background:rgba(255,255,255,.12); margin:20px 0 16px; }
        .pr-vis-label { position:relative; font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
          color:#8fa6c9; margin-bottom:12px; }
        .pr-vis-list { position:relative; list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
        .pr-vis-item { display:flex; gap:11px; align-items:flex-start; font-size:13.8px; line-height:1.45; color:#e7eefb; }
        .pr-svc-row.is-in .pr-vis-item { animation: pr-rise-sm .5s ease backwards; }
        .pr-vis-tick { flex:none; width:20px; height:20px; border-radius:50%; background:rgba(74,222,128,.16);
          display:inline-flex; align-items:center; justify-content:center; margin-top:1px; }
        .pr-vis-tick svg { width:11px; height:11px; stroke:#4ade80; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; }
        .pr-vis--hot .pr-vis-tick { background:rgba(255,255,255,.18); }
        .pr-vis--hot .pr-vis-tick svg { stroke:#fff; }

        /* desktop: alternate sides + directional slide-in from each side */
        @media(min-width:861px){
          .pr-svc-row.pr-rev .pr-svc-visual { order:-1; }
          .pr-svc-row.is-in .pr-svc-copy { animation: pr-in-left .7s .05s cubic-bezier(.22,1,.36,1) backwards; }
          .pr-svc-row.is-in .pr-svc-visual { animation: pr-in-right .7s .12s cubic-bezier(.22,1,.36,1) backwards; }
          .pr-svc-row.pr-rev.is-in .pr-svc-copy { animation-name: pr-in-right; }
          .pr-svc-row.pr-rev.is-in .pr-svc-visual { animation-name: pr-in-left; }
        }
        /* mobile: fold each row into one clean card — dark price header on top,
           decision copy + full-width CTA below. Redundant name/fee/feature-list
           are trimmed (features live in the comparison table above). */
        @media(max-width:860px){
          .pr-svcs { gap:24px; }
          .pr-svc-row { grid-template-columns:1fr; gap:0; background:#fff;
            border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;
            box-shadow:0 16px 36px -28px rgba(15,31,61,.32); }
          .pr-svc-row.is-in { animation: pr-rise .55s cubic-bezier(.22,1,.36,1) backwards; }
          .pr-svc-row.pr-featured { border:2px solid #2563eb; box-shadow:0 22px 44px -26px rgba(37,99,235,.42); }
          .pr-svc-visual { order:-1; }
          .pr-vis { border:0; border-radius:0; box-shadow:none; padding:22px 22px 24px; }
          .pr-svc-row .pr-vis { transform:none !important; box-shadow:none !important; }
          .pr-vis-div, .pr-vis-label, .pr-vis-list { display:none; }
          .pr-vis-ongoing { margin-bottom:0; }
          .pr-svc-copy { padding:22px 22px 24px; }
          .pr-svc-kicker { display:none; }
          .pr-svc-copy h3 { position:absolute; width:1px; height:1px; padding:0; margin:-1px;
            overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
          .pr-svc-lead { font-size:16px; margin-top:0; }
          .pr-svc-body { font-size:14.5px; }
          .pr-svc-extra { font-size:14.5px; margin-bottom:20px; }
          /* Swap the repeating "You want…" tick list for the prose sentence so
             the explanation reads as sentences, not bullet points. */
          .pr-svc-points { display:none; }
          .pr-svc-fit { display:block; }
          .pr-svc-btn { width:100%; justify-content:center; margin-top:2px; }
        }
        @media(prefers-reduced-motion:reduce){
          .pr-svc-row, .pr-svc-copy, .pr-svc-visual, .pr-vis-item, .pr-orb { animation:none !important; }
        }

        /* ---------- How fees work ---------- */
        .pr-fees { max-width:1120px; margin:44px auto 0; padding:0 5%; }
        .pr-fees-in { background:#f2f5f9; border:1px solid #e5e7eb; border-radius:14px; padding:30px 28px;
          display:grid; grid-template-columns:repeat(3,1fr); gap:26px; }
        .pr-fees-in h3 { font-size:15.5px; font-weight:700; color:#0f1f3d; margin:0 0 6px; display:flex; align-items:center; gap:9px; }
        .pr-fees-in h3 .n { font-size:11px; font-weight:800; color:#2563eb; background:#fff; border:1px solid #dbe2ea;
          width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .pr-fees-in p { font-size:13.5px; color:#6b7280; margin:0; line-height:1.6; }
        @media(max-width:820px){ .pr-fees-in{ grid-template-columns:1fr; gap:18px; } }

        /* ---------- Additional services band ---------- */
        .pr-addl { max-width:1120px; margin:48px auto 0; padding:0 5%; }
        .pr-addl-in { background:linear-gradient(120deg,#2563eb 0%,#0f1f3d 100%); border-radius:16px;
          padding:40px 36px; display:flex; flex-wrap:wrap; gap:24px; align-items:center; justify-content:space-between; }
        .pr-addl-in .pr-eyebrow { color:#9dc3ff; }
        .pr-addl-in h2 { color:#fff; font-size:clamp(22px,3vw,30px); font-weight:800; margin:0 0 8px; max-width:600px; line-height:1.15; }
        .pr-addl-in p { color:#d3e2f7; font-size:14px; line-height:1.6; margin:0; max-width:600px; }
        .pr-addl-btn { flex:none; display:inline-flex; align-items:center; gap:10px; background:#fff; color:#0f1f3d;
          font-size:14.5px; font-weight:800; padding:16px 28px; border-radius:10px; text-decoration:none;
          box-shadow:0 12px 24px -12px rgba(0,0,0,.4); transition:transform .15s ease, box-shadow .15s ease; white-space:nowrap; }
        .pr-addl-btn:hover { transform:translateY(-2px); box-shadow:0 18px 30px -12px rgba(0,0,0,.5); }

        /* ---------- FAQ ---------- */
        .pr-faq-wrap { max-width:1000px; margin:0 auto; }
        .pr-faq { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:28px; }
        .pr-faq div { border-left:3px solid #2563eb; padding-left:20px; }
        .pr-faq h3 { font-size:16px; font-weight:700; color:#0f1f3d; margin:0 0 8px; }
        .pr-faq p { font-size:14px; color:#6b7280; line-height:1.7; margin:0; }

        .pr-fine { max-width:1000px; margin:28px auto 0; padding:0 5%; font-size:12px; color:#9ca3af;
          text-align:center; line-height:1.7; }
      `}</style>

      <div className="pr-scope">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 130, paddingBottom: 96,
        background: '#0f1f3d', position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/Background_of_the_services.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,30,0.9)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#4a90d9', marginBottom: 16 }}>
            Landlord Packages &amp; Fees
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: 800, color: '#fff', margin: '0 0 18px', lineHeight: 1.06 }}>
            Clear pricing, every service side by side
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', maxWidth: 620, margin: '0 auto', lineHeight: 1.7, fontWeight: 300 }}>
            From simply finding the right tenant to fully managing your property, choose the level of support that suits you.
            No hidden fees, no surprises — and you can upgrade whenever you&apos;re ready.
          </p>
        </div>
      </section>

      {/* ── TRUST STRIP ─────────────────────────────────────── */}
      <section className="pr-trust" aria-label="Why landlords choose House of Lettings">
        <div className="pr-trust-in">
          <div><span className="k">Inclusive of VAT</span><span className="v">The price you see is the price you pay</span></div>
          <div><span className="k">No tenant fees</span><span className="v">Fully Tenant Fees Act 2019 compliant</span></div>
          <div><span className="k">Deposit protected</span><span className="v">Held in a Government-approved scheme</span></div>
          <div><span className="k">Leeds &amp; Manchester</span><span className="v">Local teams who know your market</span></div>
        </div>
      </section>

      {/* ── COMPARISON MATRIX ───────────────────────────────── */}
      <section className="pr-wrap" id="compare">
        <div className="pr-head">
          <span className="pr-eyebrow">Compare Packages</span>
          <h2>Every service, side by side</h2>
          <p>Two tenant-find options and three management tiers. Every package includes a full tenant-find service, management adds ongoing rent, compliance and maintenance support.</p>
        </div>

        {/* Desktop: full five-column comparison table */}
        <div className="pr-matrix-card pr-desktop-compare">
          <div className="pr-scroller" role="region" aria-label="Package comparison table" tabIndex={0}>
            <table className="pr-table">
              <thead>
                <tr>
                  <th className="pr-corner" scope="col">
                    <span className="pr-corner-t">Services</span>
                    <span className="pr-corner-s">{TOTAL_SERVICES} across every package · inc. VAT</span>
                  </th>
                  {PACKAGES.map((p, i) => (
                    <th key={p.id} className={`pr-pkg${i === HOT ? ' pr-hot' : ''}`} scope="col">
                      <span className={`pr-badge${p.badge ? '' : ' pr-ghost'}`}>{p.badge || '·'}</span>
                      <span className="pr-name">{p.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Fee summary rows */}
                <tr className="pr-fee-row pr-fee-onetime">
                  <td className="pr-svc pr-fee-label">One-Time Fee</td>
                  {PACKAGES.map((p, i) => (
                    <td key={p.id} className={`pr-fee-cell${i === HOT ? ' pr-hot' : ''}`}>{p.setupFee}</td>
                  ))}
                </tr>
                <tr className="pr-fee-row pr-fee-ongoing">
                  <td className="pr-svc pr-fee-label">Ongoing Fee</td>
                  {PACKAGES.map((p, i) => (
                    <td key={p.id} className={`pr-fee-cell${i === HOT ? ' pr-hot' : ''}`}>{p.mgmtFee || 'None'}</td>
                  ))}
                </tr>
                {MATRIX_SECTIONS.map((section, s) => {
                  const isOpen = !!expanded[s];
                  const rows = isOpen ? section.rows : section.rows.slice(0, VISIBLE_ROWS);
                  const hidden = section.rows.length - VISIBLE_ROWS;
                  return (
                    <Fragment key={section.title}>
                      <tr className="pr-band"><td colSpan={6}><span>{section.title}</span></td></tr>
                      {rows.map((row) => {
                        const [label, ...marks] = row;
                        return (
                          <tr key={label as string} className="pr-feat">
                            <td className="pr-svc">{label}</td>
                            {marks.map((m, c) => (
                              <td key={c} className={`pr-mark${c === HOT ? ' pr-hot' : ''}`}>
                                {m ? <TickIcon /> : <DashIcon />}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {hidden > 0 && (
                        <tr className="pr-more-row">
                          <td colSpan={6}>
                            <button className="pr-more-btn" type="button" aria-expanded={isOpen}
                              onClick={() => setExpanded(e => ({ ...e, [s]: !e[s] }))}>
                              <span className={`pr-chev${isOpen ? ' up' : ''}`} aria-hidden />
                              {isOpen ? 'Show less' : `Show ${hidden} more service${hidden > 1 ? 's' : ''}`}
                            </button>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                <tr className="pr-cta-row">
                  <td></td>
                  {PACKAGES.map((p, i) => (
                    <td key={p.id} className={i === HOT ? 'pr-hot' : ''}>
                      <button className={`pr-btn${i === HOT ? ' pr-solid' : ''}`} onClick={() => addPackage(i)}>
                        {justAdded === i ? 'Added ✓' : 'Add to order'}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pr-legend">
            <span><i className="pr-tick"><svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg></i> Included</span>
            <span><i className="pr-dash"><svg viewBox="0 0 24 24"><line x1="6" y1="12" x2="18" y2="12" /></svg></i> Not included</span>
          </div>
        </div>

        {/* Mobile: a self-contained package card — NOT the comparison table.
            Short description, four curated highlights, then a visual coverage
            meter per service category. No 48-row service list on small
            screens; the full breakdown lives in the desktop table. */}
        <div className="pr-mobile-compare">
          <p className="pr-mc-help">Tap a package to see what it does for you.</p>
          <div className="pr-mc-pills" role="tablist" aria-label="Choose a package to compare">
            {PACKAGES.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={mobileTab === i}
                className={`pr-mc-pill${mobileTab === i ? ' active' : ''}`}
                onClick={() => setMobileTab(i)}
              >
                <span className="pr-mc-pill-name">{p.short}</span>
                <span className="pr-mc-pill-fee">{p.setupFee}{p.mgmtFee ? ` + ${p.mgmtFee}` : ''}</span>
                {p.badge && <span className="pr-mc-dot" aria-hidden />}
              </button>
            ))}
          </div>

          <div className="pr-mc-card">
            <div className={`pr-mc-head${mobileTab === HOT ? ' pr-mc-head--hot' : ''}`}>
              <div className="pr-mc-kindrow">
                <span className="pr-mc-kind">{PACKAGES[mobileTab].kind}{PACKAGES[mobileTab].badge ? ' · Most Popular' : ''}</span>
                <span className="pr-mc-tag">{PACKAGES[mobileTab].youWe}</span>
              </div>
              <span className="pr-mc-name">{PACKAGES[mobileTab].label}</span>
              <p className="pr-mc-best">Best for {PACKAGES[mobileTab].bestForLead} {PACKAGES[mobileTab].bestForRest}.</p>
              <div className="pr-mc-fees">
                <div><span>One-time</span><b>{PACKAGES[mobileTab].setupFee}</b></div>
                <div><span>Ongoing</span><b>{PACKAGES[mobileTab].mgmtFee ? `${PACKAGES[mobileTab].mgmtFee} of rent` : 'None'}</b></div>
              </div>
            </div>

            <div className="pr-mc-body">
              <p className="pr-mc-blurb">{PACKAGES[mobileTab].blurb}</p>

              <div className="pr-mc-sublabel">What you get</div>
              <ul className="pr-mc-hl">
                {EXPLAINERS[mobileTab].highlights.map((h) => (
                  <li key={h}>
                    <i className="pr-tick" aria-hidden><svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg></i>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="pr-mc-sublabel">
                Service coverage
                <span className="pr-mc-sub-n">{mcIncluded} of {TOTAL_SERVICES} services</span>
              </div>
              <div className="pr-mc-covs">
                {MATRIX_SECTIONS.map((section) => {
                  const total = section.rows.length;
                  const included = section.rows.filter((row) => !!row[mobileTab + 1]).length;
                  return (
                    <div key={section.title} className="pr-mc-cov">
                      <div className="pr-mc-cov-top">
                        <span>{section.title}</span>
                        <b className={included === 0 ? 'pr-mc-cov-zero' : ''}>
                          {included === total ? 'All included' : included === 0 ? 'Not included' : `${included} of ${total}`}
                        </b>
                      </div>
                      <div className="pr-mc-bar" role="img"
                        aria-label={`${included} of ${total} ${section.title} services included`}>
                        <i style={{ width: `${Math.round((included / total) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href={`/pricing/${PACKAGES[mobileTab].id}`} className="pr-mc-all">
                See all {mcIncluded} services included, explained
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            </div>

            <div className="pr-mc-cta">
              <button onClick={() => addPackage(mobileTab)}>{justAdded === mobileTab ? 'Added to order ✓' : `Add ${PACKAGES[mobileTab].short} to order`}</button>
            </div>
          </div>
          <p className="pr-mc-foot">Tap a package above to see everything it includes, explained in full. Prices inc. VAT.</p>
        </div>
      </section>

      {/* ── DECISION GUIDE: which service is right for you? ──── */}
      <section className="pr-guide" aria-label="Which service is right for you">
        <div className="pr-head">
          <span className="pr-eyebrow">Not sure which to pick?</span>
          <h2>Find the right service for you</h2>
          <p>It comes down to one thing: how much do you want to handle yourself? Here is when to choose each package, from finding a tenant to fully protecting your income.</p>
        </div>

        <div className="pr-svcs">
          {EXPLAINERS.map((ex, i) => {
            const p = PACKAGES[i];
            const featured = i === HOT;
            const reversed = i % 2 === 1; // alternate: even = copy left, odd = copy right
            return (
              <div key={p.id} className={`pr-svc-row${reversed ? ' pr-rev' : ''}${featured ? ' pr-featured' : ''}`}>
                {/* Copy side */}
                <div className="pr-svc-copy">
                  <span className="pr-svc-kicker">
                    {ex.kicker}
                    {p.badge && <span className="pr-pop">Most Popular</span>}
                  </span>
                  <h3>{p.label}</h3>
                  <p className="pr-svc-lead">{ex.lead}</p>
                  <p className="pr-svc-body">{ex.body}</p>
                  {/* Fuller explanation of the service (replaces the old
                      "You want…" tick list, which read as redundant). */}
                  <p className="pr-svc-extra">{ex.extra}</p>
                  <Link
                    href={`/pricing/${p.id}`}
                    className={`pr-svc-btn${featured ? ' pr-svc-btn--solid' : ''}`}
                  >
                    See what&apos;s included
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </Link>
                </div>

                {/* Designed spec panel (no photo) — links to the package's own page */}
                <Link href={`/pricing/${p.id}`} className="pr-svc-visual" aria-label={`See everything included in ${p.label}`}>
                  <div className={`pr-vis${featured ? ' pr-vis--hot' : ''}`}>
                    <span className="pr-orb pr-orb-a" aria-hidden />
                    <span className="pr-orb pr-orb-b" aria-hidden />
                    <div className="pr-vis-top">
                      <span className="pr-vis-kind">{p.kind}</span>
                      {p.badge && <span className="pr-vis-badge">Most Popular</span>}
                    </div>
                    <div className="pr-vis-name">{p.label}</div>
                    <div className="pr-vis-price">
                      <span className="pr-vis-fee">{p.setupFee}</span>
                      <span className="pr-vis-per">one-time</span>
                    </div>
                    <div className={`pr-vis-ongoing${p.mgmtFee ? '' : ' pr-vis-none'}`}>{p.ongoing}</div>
                    <div className="pr-vis-div" />
                    <div className="pr-vis-label">What&apos;s included</div>
                    <ul className="pr-vis-list">
                      {ex.highlights.map((h, hi) => (
                        <li key={h} className="pr-vis-item" style={{ animationDelay: `${0.24 + hi * 0.09}s` }}>
                          <i className="pr-vis-tick" aria-hidden><svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg></i>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW OUR FEES WORK ───────────────────────────────── */}
      <section className="pr-fees" aria-label="How our fees work">
        <div className="pr-fees-in">
          <div>
            <h3><span className="n">1</span> Charged on rent collected</h3>
            <p>Management percentages apply only to the monthly rent we actually collect on your behalf — nothing when the property is empty.</p>
          </div>
          <div>
            <h3><span className="n">2</span> All prices include VAT</h3>
            <p>Every figure on this page is VAT-inclusive, so what you compare is what you pay. Optional extras are also shown inclusive of VAT.</p>
          </div>
          <div>
            <h3><span className="n">3</span> No long tie-ins</h3>
            <p>Tenant-find packages are one-time with no ongoing commitment. Management runs on a rolling monthly basis — upgrade or adjust any time.</p>
          </div>
        </div>
      </section>

      {/* ── ADDITIONAL SERVICES ROUTE BAND ──────────────────── */}
      <section className="pr-addl" aria-label="Additional services">
        <div className="pr-addl-in">
          <div>
            <span className="pr-eyebrow">More than just packages</span>
            <h2>Need just one or two services?</h2>
            <p>Gas and electrical certificates, inventories and handovers, professional photography, referencing, mid-tenancy inspections and rent protection. Order any service individually, with or without a package.</p>
          </div>
          <Link href="/additional-services" className="pr-addl-btn">Browse Additional Services →</Link>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{ background: '#f7f8fa', padding: '80px 5%', marginTop: 64, borderTop: '1px solid #e5e7eb' }}>
        <div className="pr-faq-wrap">
          <div className="pr-head">
            <span className="pr-eyebrow">Common Questions</span>
            <h2>Everything you need to know</h2>
          </div>
          <div className="pr-faq">
            {PRICING_FAQ.map(faq => (
              <div key={faq.q}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="pr-fine">
          All fees quoted are inclusive of VAT/IPT where applicable. Management percentages are charged on rent collected each month.
          Under the Tenant Fees Act 2019 we do not charge tenants for referencing, admin or renewals. &ldquo;From&rdquo; prices are starting
          rates; optional-extra pricing may vary by property type and is confirmed in your written quotation. House of Lettings — Leeds &amp; Manchester.
        </p>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{
        background: '#0f1f3d', padding: '80px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(24px,3vw,42px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Not sure which package is right for you?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: 300, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            Book a free, no-obligation valuation and we&apos;ll recommend the best fit for your goals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/book-valuation" style={{
            padding: '16px 36px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 14, fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Book a Free Valuation</Link>
          <Link href="/landlord-registration" style={{
            padding: '16px 36px', background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, fontSize: 14,
            fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
            textDecoration: 'none', fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
          }}>Register as a Landlord</Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <Footer />

      </div>{/* /pr-scope */}

      {/* ── GET STARTED MODAL ────────────────────────────────── */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
            .gs-input:focus { border-color: #2563eb !important; }
            .gs-input::placeholder { color: #9ca3af; }
            .gs-input option { background: #fff; color: #111; }
          `}</style>

          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease',
            scrollbarWidth: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '24px 28px 0', position: 'relative' }}>
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute', top: 20, right: 20, background: '#f3f4f6', border: 'none',
                  color: '#6b7280', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}
              >✕</button>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a3c5e',
                borderRadius: 20, padding: '5px 14px', marginBottom: 14,
              }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>{pkg.label}</span>
              </div>

              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Get Started</h2>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Fill in your details and we&apos;ll be in touch within 24-48 hours.</p>

              <div style={{
                background: '#f8f9ff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px',
                marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {['Takes less than two minutes', 'We&apos;ll match you with the right package', 'No commitment until you speak to us'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 700 }}>✓</span>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#374151' }}
                      dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Your details</h3>
            </div>

            {/* Modal body */}
            <div style={{ padding: '0 28px 28px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Registration Received!</h3>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
                    We&apos;ve sent a confirmation to <strong style={{ color: '#111' }}>{formData.email}</strong>.<br />
                    A member of our team will be in touch shortly.
                  </p>
                  <button
                    onClick={closeModal}
                    style={{ padding: '12px 32px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}
                  >Close</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input className="gs-input" style={inputStyle} placeholder="John"
                        value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input className="gs-input" style={inputStyle} placeholder="Smith"
                        value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input className="gs-input" type="email" style={inputStyle} placeholder="john@example.com"
                      value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input className="gs-input" type="tel" style={inputStyle} placeholder="+44 7700 000000"
                      value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>What Property Do You Own? Enter Postcode</label>
                    <PostcodeLookup
                      postcode={formData.postcode}
                      onPostcodeChange={(v) => setFormData(p => ({ ...p, postcode: v }))}
                      onSelect={handleAddressSelect}
                      inputClassName="gs-input"
                      inputStyle={inputStyle}
                      placeholder="e.g. LS1 1AA"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>First Line of Address</label>
                    <input className="gs-input" style={inputStyle} placeholder="e.g. 12 Oak Street"
                      value={formData.addressLine1} onChange={e => setFormData(p => ({ ...p, addressLine1: e.target.value }))} />
                  </div>

                  <div>
                    <label style={labelStyle}>How Many Properties to Manage?</label>
                    <select className="gs-input" style={inputStyle}
                      value={formData.numberOfProperties} onChange={e => setFormData(p => ({ ...p, numberOfProperties: e.target.value }))}>
                      <option value="">Select number of properties</option>
                      <option value="1">1 property</option>
                      <option value="2">2 properties</option>
                      <option value="3">3 properties</option>
                      <option value="4">4 properties</option>
                      <option value="5+">5 or more</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>When Do You Want to Register?</label>
                    <input className="gs-input" type="date" style={{ ...inputStyle, colorScheme: 'light' }}
                      value={formData.startDate} min={new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                  </div>

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>{error}</div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '14px 24px', background: submitting ? '#93c5fd' : '#2563eb',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: '0.5px',
                      textTransform: 'uppercase', cursor: submitting ? 'wait' : 'pointer', fontFamily: "'Poppins', sans-serif",
                      transition: 'background 0.2s', marginTop: 4,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer so the fixed cart bar never hides the footer, then the bar */}
      <div aria-hidden style={{ height: 96 }} />
      <CartBar />
    </>
  );
}
