'use client';
// app/landlord-registration/page.tsx
// Overview / landing page. The actual form lives at /landlord-registration/apply.
// Conversion-focused redesign re-skinned to the House of Lettings system:
// Poppins, navy #0f1f3d, blue #2563eb, green price figures. Shared Navbar/Footer.
// Prices are read live from lib/bundles.ts (never hard-coded). SEO metadata lives
// in ./layout.tsx; the FAQ + RealEstateAgent JSON-LD is rendered here so it stays
// scoped to this page (not the nested /apply, /forms, /joint routes).
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Home, ShieldCheck, TrendingUp, UserCheck, Zap, Lock, Check, X, Plus, ArrowRight, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES, type Bundle } from '@/lib/bundles';
import {
  WHY_POINTS,
  PROCESS_STEPS,
  TERMS_SHORT,
  TERMS_FULL,
  BUNDLE_COPY,
  REGISTRATION_FAQS,
  type IconKey,
} from './content';

const APPLY = '/landlord-registration/apply';

const ICONS: Record<IconKey, LucideIcon> = {
  home: Home,
  shield: ShieldCheck,
  trending: TrendingUp,
  user: UserCheck,
  zap: Zap,
  lock: Lock,
};

/* ---- page-scoped structured data (crawlable, matches the visible FAQ) ----
   The site-wide RealEstateAgent schema is already injected by app/layout.tsx,
   so only the page-specific FAQPage is added here. */
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: REGISTRATION_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

/* ---------- scroll reveal ----------
   Visibility is driven by INLINE styles (authoritative — no stylesheet, media
   query or duplicated <style> block can override them). A scroll + rect check
   reveals each element as it enters the viewport, with a timer safety net and a
   reduced-motion short-circuit so the content is never left hidden. */
function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduce(true);
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let done = false;
    let raf = 0;
    const reveal = () => {
      if (done) return;
      done = true;
      setInView(true);
      cleanup();
    };
    const check = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.9 && r.bottom > 0) reveal();
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };
    const cleanup = () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    raf = requestAnimationFrame(check);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Last-resort backstop: guarantee visibility even if scroll never fires,
    // but late enough that it does not pre-empt the scroll reveal for readers.
    const safety = setTimeout(reveal, 3500);
    return cleanup;
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(26px)',
        transition: reduce ? 'none' : `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- price line (figures greened, values from BUNDLES) ---------- */
function PriceLine({ b, muted }: { b: Bundle; muted?: string }) {
  const fig = (t: string) => (
    <b style={{ color: 'var(--price-green-ink)', fontWeight: 700 }}>{t}</b>
  );
  if (b.mgmtFee) {
    return (
      <>
        {fig(b.mgmtFee)} management fees <span style={{ color: muted || '#9ca3af' }}>+</span> {fig(b.setupFee)} set up fees
      </>
    );
  }
  return (
    <>
      {fig(b.setupFee)} set up fees <span style={{ color: muted || '#9ca3af' }}>· no management fees</span>
    </>
  );
}

/* ---------- animated modal shell ---------- */
function Modal({
  label,
  onClose,
  children,
  maxWidth = 560,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="lr-backdrop"
      style={{ opacity: entered ? 1 : 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="lr-dialog"
        style={{
          maxWidth,
          opacity: entered ? 1 : 0,
          transform: entered ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lr-dialog-x" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ---------- FAQ accordion item ---------- */
function FaqItem({ item, open, onToggle }: { item: { q: string; a: string }; open: boolean; onToggle: () => void }) {
  return (
    <div className="lr-faq">
      <button className="lr-faq-q" onClick={onToggle} aria-expanded={open}>
        <span>{item.q}</span>
        <Plus size={20} className="lr-faq-icon" style={{ transform: open ? 'rotate(45deg)' : 'none' }} />
      </button>
      <div className="lr-faq-a" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div style={{ overflow: 'hidden' }}>
          <p>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function LandlordRegistrationPage() {
  const [modal, setModal] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number>(0);
  const close = useCallback(() => setModal(null), []);

  // Escape to close, body scroll lock, and focus return to the trigger.
  useEffect(() => {
    if (!modal) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [modal]);

  const modalBundle = modal ? BUNDLES.find((b) => b.id === modal) : undefined;

  return (
    <>
      <style>{PAGE_CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />

      <main className="lr">
        {/* ── HERO ── */}
        <section className="lr-hero">
          <span className="lr-blob lr-blob-a" aria-hidden />
          <span className="lr-blob lr-blob-b" aria-hidden />
          <div className="wrap lr-hero-grid">
            <div className="lr-hero-copy">
              <span className="lr-eyebrow-pill">Landlord Registration &middot; Leeds &amp; Manchester</span>
              <h1>Register your property in just a few steps</h1>
              <p className="lr-lead">
                Fill out a short form, select your service, sign your agreement online, and receive a signed PDF copy by
                email from your dedicated local agent.
              </p>
              <div className="lr-hero-cta">
                <Link href={APPLY} className="lr-btn lr-btn-primary">
                  Start Registration <ArrowRight size={17} />
                </Link>
                <button className="lr-btn lr-btn-ghost" onClick={() => setModal('process')}>
                  Preview the process
                </button>
              </div>
              <ul className="lr-chips">
                <li><Check size={14} /> Free</li>
                <li><Check size={14} /> No obligation</li>
                <li><Check size={14} /> Response within 24 to 48 hours</li>
              </ul>
            </div>

            {/* 3-step card */}
            <Reveal delay={0.15} style={{ width: '100%' }}>
              <div className="lr-steps-card">
                <p className="lr-steps-title">Three steps, a few minutes</p>
                {PROCESS_STEPS.map((s) => (
                  <div key={s.n} className="lr-step">
                    <span className="lr-step-num">{s.n}</span>
                    <div>
                      <strong>{s.title}</strong>
                      <span>{s.desc}</span>
                    </div>
                  </div>
                ))}
                <Link href={APPLY} className="lr-btn lr-btn-primary lr-btn-block">
                  Begin step 1 <ArrowRight size={17} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── WHY REGISTER ── */}
        <section className="lr-section">
          <div className="wrap">
            <Reveal>
              <p className="lr-kicker">Why Register</p>
              <h2 className="lr-h2">Everything you need to let your property, managed by one local team</h2>
              <p className="lr-sub">
                Register once to access expert support for compliance, tenant management, rent collection, and every step
                of the letting process.
              </p>
            </Reveal>
            <div className="lr-grid3" style={{ marginTop: 44 }}>
              {WHY_POINTS.map((p, i) => {
                const Icon = ICONS[p.icon];
                return (
                  <Reveal key={p.title} delay={0.06 * i} style={{ height: '100%' }}>
                    <div className="lr-card lr-lift">
                      <span className="lr-card-icon">
                        <Icon size={20} />
                      </span>
                      <h3>{p.title}</h3>
                      <p>{p.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── BUNDLES ── */}
        <section className="lr-section lr-band">
          <div className="wrap">
            <Reveal>
              <p className="lr-kicker">Our Bundles</p>
              <h2 className="lr-h2">Choose the service that best suits your property</h2>
              <p className="lr-sub">
                Our management bundles are priced as a percentage of your monthly rental income, with a one-time setup
                fee to get started. All prices are inclusive of VAT.
              </p>
            </Reveal>
            <div className="lr-grid3" style={{ marginTop: 44 }}>
              {BUNDLES.map((b, i) => {
                const copy = BUNDLE_COPY[b.id];
                const hot = Boolean(b.badge);
                return (
                  <Reveal key={b.id} delay={0.05 * i} style={{ height: '100%' }}>
                    <button
                      className={`lr-bundle lr-lift${hot ? ' hot' : ''}`}
                      onClick={() => setModal(b.id)}
                      aria-label={`View details for ${b.label}`}
                    >
                      {hot && <span className="lr-hot-badge">Most Popular</span>}
                      <span className="lr-bundle-kind">{b.kind}</span>
                      <h3>{b.label}</h3>
                      <p className="lr-bundle-price">
                        <PriceLine b={b} />
                      </p>
                      <p className="lr-bundle-copy">{copy?.card ?? b.blurb}</p>
                      <span className="lr-bundle-link">
                        View details <ArrowRight size={15} />
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
            <Reveal style={{ textAlign: 'center', marginTop: 36 }}>
              <Link href="/pricing" className="lr-btn lr-btn-outline">
                Compare all bundles
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── TERMS ── */}
        <section className="lr-section">
          <div className="wrap lr-narrow">
            <Reveal>
              <p className="lr-kicker">The Terms</p>
              <h2 className="lr-h2">Clear terms, explained simply</h2>
              <p className="lr-sub">
                By registering your property, you confirm that you have read and accepted our terms and conditions. Below
                are the three topics landlords ask about most often.
              </p>
            </Reveal>
            <div className="lr-terms" style={{ marginTop: 36 }}>
              {TERMS_SHORT.map((t, i) => (
                <Reveal key={t.title} delay={0.06 * i}>
                  <div className="lr-term lr-lift">
                    <Check size={18} className="lr-term-tick" />
                    <div>
                      <strong>{t.title}.</strong> {t.body}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal style={{ textAlign: 'center', marginTop: 30 }}>
              <button className="lr-btn lr-btn-outline" onClick={() => setModal('terms')}>
                Read the full summary
              </button>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lr-section lr-band">
          <div className="wrap lr-narrow">
            <Reveal>
              <p className="lr-kicker">Common Questions</p>
              <h2 className="lr-h2">Frequently asked questions</h2>
            </Reveal>
            <Reveal delay={0.1} style={{ marginTop: 30 }}>
              <div className="lr-faqs">
                {REGISTRATION_FAQS.map((item, i) => (
                  <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="lr-cta">
          <span className="lr-blob lr-blob-c" aria-hidden />
          <Reveal>
            <div className="wrap" style={{ position: 'relative' }}>
              <h2>Ready to register your property?</h2>
              <p>
                Complete the step-by-step registration and we will be in touch within 24 to 48 hours with a tailored
                proposal.
              </p>
              <Link href={APPLY} className="lr-btn lr-btn-cta-blue">
                Start Registration <ArrowRight size={17} />
              </Link>
              <ul className="lr-chips lr-chips-center">
                <li><Check size={14} /> Free</li>
                <li><Check size={14} /> No obligation</li>
                <li><Check size={14} /> Signed PDF by email</li>
              </ul>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />

      {/* ── MODALS ── */}
      {modal === 'process' && (
        <Modal label="How registration works" onClose={close}>
          <p className="lr-dialog-kicker">The process</p>
          <h3 className="lr-dialog-title">Three steps, a few minutes</h3>
          <div className="lr-dialog-steps">
            {PROCESS_STEPS.map((s) => (
              <div key={s.n} className="lr-step">
                <span className="lr-step-num">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <span>{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href={APPLY} className="lr-btn lr-btn-primary lr-btn-block" style={{ marginTop: 22 }}>
            Begin step 1 <ArrowRight size={17} />
          </Link>
        </Modal>
      )}

      {modal === 'terms' && (
        <Modal label="Property management terms" onClose={close} maxWidth={640}>
          <p className="lr-dialog-kicker">The Terms</p>
          <h3 className="lr-dialog-title">Property management terms</h3>
          <ol className="lr-dialog-terms">
            {TERMS_FULL.map((t) => (
              <li key={t.title}>
                <strong>{t.title}.</strong> {t.body}
              </li>
            ))}
          </ol>
        </Modal>
      )}

      {modalBundle && (
        <Modal label={modalBundle.label} onClose={close}>
          <p className="lr-dialog-kicker">{modalBundle.kind}</p>
          <h3 className="lr-dialog-title">{modalBundle.label}</h3>
          <p className="lr-dialog-price">
            <PriceLine b={modalBundle} /> <span className="lr-vat">· inclusive of VAT</span>
          </p>
          <p className="lr-dialog-summary">{BUNDLE_COPY[modalBundle.id]?.summary ?? modalBundle.blurb}</p>
          <ul className="lr-dialog-list">
            {(BUNDLE_COPY[modalBundle.id]?.details ?? []).map((d) => (
              <li key={d}>
                <Check size={16} /> <span>{d}</span>
              </li>
            ))}
          </ul>
          <Link href={APPLY} className="lr-btn lr-btn-primary lr-btn-block" style={{ marginTop: 22 }}>
            Register with this bundle <ArrowRight size={17} />
          </Link>
        </Modal>
      )}
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  .lr { font-family:'Poppins',sans-serif; color:#4b5563; background:#fff; overflow-x:hidden; }
  .lr .wrap { max-width:1140px; margin:0 auto; padding:0 24px; }
  .lr .lr-narrow { max-width:820px; }
  .lr h1, .lr h2, .lr h3 { color:#0f1f3d; line-height:1.15; }

  /* buttons (site CTA convention) */
  .lr-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; box-sizing:border-box;
    min-height:48px; line-height:1.2; font-family:'Poppins',sans-serif; font-size:13.5px; font-weight:600;
    padding:14px 28px; border-radius:9px; border:1.5px solid transparent; cursor:pointer; text-decoration:none;
    transition:transform .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease; }
  .lr-btn:hover { transform:translateY(-2px); }
  .lr-btn-primary { background:#2563eb; color:#fff; box-shadow:0 6px 18px rgba(37,99,235,.28); }
  .lr-btn-primary:hover { background:#1d4ed8; }
  .lr-btn-ghost { background:rgba(255,255,255,.08); color:#fff; border-color:rgba(255,255,255,.28); }
  .lr-btn-ghost:hover { background:rgba(255,255,255,.16); }
  .lr-btn-outline { background:#fff; color:#2563eb; border-color:#2563eb; }
  .lr-btn-outline:hover { background:#2563eb; color:#fff; }
  .lr-btn-light { background:#fff; color:#0f1f3d; }
  .lr-btn-light:hover { background:#eef2ff; }
  /* Bold blue CTA for the closing navy band — glows and gently pulses so it
     stands out against the dark background. */
  .lr-btn-cta-blue { background:#2563eb; color:#fff; box-shadow:0 12px 34px rgba(37,99,235,.55);
    animation:lrpulse 2.6s ease-in-out infinite; }
  .lr-btn-cta-blue:hover { background:#1d4ed8; box-shadow:0 18px 46px rgba(37,99,235,.75); animation:none; }
  .lr-btn-block { width:100%; }

  /* section rhythm */
  .lr-section { padding:clamp(56px,7vw,80px) 0; }
  .lr-band { background:#f7f8fa; }
  .lr-kicker { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--logo-blue,#2563eb); margin-bottom:12px; }
  .lr-h2 { font-size:clamp(26px,3.4vw,38px); font-weight:700; max-width:660px; }
  .lr-sub { font-size:15.5px; line-height:1.7; color:#6b7280; max-width:640px; margin-top:14px; }

  /* hero */
  .lr-hero { position:relative; overflow:hidden; padding:clamp(52px,7vw,86px) 0 clamp(56px,7vw,90px);
    background:#0f1f3d; background-image:radial-gradient(ellipse at 78% 12%, rgba(37,99,235,.28) 0%, transparent 55%),
    radial-gradient(ellipse at 10% 92%, rgba(37,99,235,.14) 0%, transparent 52%); }
  .lr-hero-grid { display:grid; grid-template-columns:1.15fr .85fr; gap:48px; align-items:center; position:relative; z-index:1; }
  .lr-hero-copy h1 { color:#fff; font-size:clamp(32px,4.4vw,52px); font-weight:800; margin:16px 0 0; text-wrap:balance; }
  .lr-lead { color:rgba(255,255,255,.66); font-size:17px; line-height:1.65; max-width:520px; margin-top:18px; font-weight:300; }
  .lr-eyebrow-pill { display:inline-block; background:rgba(37,99,235,.22); color:#93c5fd; font-size:11px; font-weight:700;
    letter-spacing:2.5px; text-transform:uppercase; padding:6px 14px; border-radius:20px; border:1px solid rgba(147,197,253,.35); }
  .lr-hero-cta { display:flex; flex-wrap:wrap; gap:12px; margin-top:30px; }
  .lr-chips { list-style:none; display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:26px; padding:0; }
  .lr-chips li { display:inline-flex; align-items:center; gap:7px; color:rgba(255,255,255,.82); font-size:13px; font-weight:500; }
  .lr-chips li svg { color:#4ade80; }
  .lr-chips-center { justify-content:center; }

  /* hero float blobs */
  .lr-blob { position:absolute; border-radius:50%; filter:blur(8px); pointer-events:none; }
  .lr-blob-a { width:150px; height:150px; top:14%; right:8%; background:rgba(37,99,235,.20); animation:lrfloat 7s ease-in-out infinite; }
  .lr-blob-b { width:90px; height:90px; bottom:12%; left:6%; background:rgba(74,222,128,.12); animation:lrfloat 9s ease-in-out infinite reverse; }
  .lr-blob-c { width:220px; height:220px; top:-40px; right:-30px; background:rgba(37,99,235,.18); }

  /* 3-step card */
  .lr-steps-card { position:relative; overflow:hidden; background:#fff; border-radius:18px; padding:30px 24px 26px;
    border:1px solid rgba(37,99,235,.16);
    box-shadow:0 0 0 1px rgba(37,99,235,.10), 0 26px 64px rgba(8,15,40,.5), 0 6px 18px rgba(37,99,235,.22); }
  .lr-steps-card::before { content:''; position:absolute; top:0; left:0; right:0; height:5px;
    background:linear-gradient(90deg,#2563eb 0%,#3b82f6 55%,#4ade80 100%); }
  .lr-steps-title { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#2563eb; margin-bottom:16px; }
  .lr-step { display:flex; gap:14px; align-items:flex-start; padding:13px 0; border-top:1px solid #eef0f5; transition:transform .2s ease; }
  .lr-step:first-of-type { border-top:none; padding-top:0; }
  .lr-step:hover { transform:translateX(3px); }
  /* .lr-step .lr-step-num: two classes beat the generic ".lr-step span" rule
     below, so the number renders white on the blue badge (not grey). */
  .lr-step .lr-step-num { flex:0 0 auto; width:30px; height:30px; border-radius:50%;
    background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff;
    box-shadow:0 4px 12px rgba(37,99,235,.42); font-size:13.5px; font-weight:700;
    display:flex; align-items:center; justify-content:center; }
  .lr-step strong { display:block; color:#0f1f3d; font-size:14.5px; font-weight:600; }
  .lr-step > div span { display:block; color:#6b7280; font-size:13px; line-height:1.55; margin-top:2px; }
  .lr-steps-card .lr-btn { margin-top:18px; box-shadow:0 10px 26px rgba(37,99,235,.45); }

  /* cards */
  .lr-grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .lr-lift { transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
  .lr-lift:hover { transform:translateY(-6px); box-shadow:0 22px 46px rgba(37,99,235,.18); }
  .lr-card { position:relative; height:100%; background:#fff; border:1px solid #e7ecf5; border-radius:14px; padding:26px 24px;
    box-shadow:0 8px 24px rgba(37,99,235,.10); }
  .lr-card:hover { border-color:#bfd3fb; box-shadow:0 22px 48px rgba(37,99,235,.22); }
  .lr-card-icon { display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:12px;
    background:linear-gradient(135deg,#eff5ff,#dbe6fb); color:#2563eb; margin-bottom:16px;
    box-shadow:0 4px 12px rgba(37,99,235,.18); transition:transform .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease; }
  .lr-card:hover .lr-card-icon { transform:translateY(-2px) scale(1.06); background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff;
    box-shadow:0 8px 20px rgba(37,99,235,.42); }
  .lr-card h3 { font-size:16.5px; font-weight:600; margin-bottom:8px; }
  .lr-card p { font-size:14px; line-height:1.7; color:#6b7280; }

  /* bundle cards */
  .lr-bundle { position:relative; display:flex; flex-direction:column; height:100%; width:100%; text-align:left;
    background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:24px 22px; cursor:pointer; font-family:'Poppins',sans-serif;
    box-shadow:0 8px 24px rgba(37,99,235,.09); }
  .lr-bundle:hover { border-color:#93b4f5; box-shadow:0 24px 50px rgba(37,99,235,.22); }
  .lr-bundle.hot { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.16), 0 18px 44px rgba(37,99,235,.26); }
  .lr-bundle.hot:hover { box-shadow:0 0 0 3px rgba(37,99,235,.22), 0 26px 56px rgba(37,99,235,.34); }
  .lr-hot-badge { position:absolute; top:-11px; left:22px; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff;
    font-size:10.5px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; padding:4px 12px; border-radius:20px;
    box-shadow:0 6px 16px rgba(37,99,235,.45); }
  .lr-bundle-kind { font-size:10.5px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#94a3b8; }
  .lr-bundle h3 { font-size:19px; font-weight:700; margin:8px 0 6px; }
  .lr-bundle-price { font-size:14px; color:#48546e; margin-bottom:10px; }
  .lr-bundle-copy { flex:1; font-size:13.5px; line-height:1.65; color:#6b7280; }
  .lr-bundle-link { display:inline-flex; align-items:center; gap:6px; margin-top:16px; color:#2563eb; font-size:13.5px; font-weight:600;
    transition:gap .2s ease; }
  .lr-bundle:hover .lr-bundle-link { gap:10px; }
  .lr-bundle:hover .lr-bundle-link svg { transform:translateX(3px); }
  .lr-bundle-link svg { transition:transform .2s ease; }

  /* terms */
  .lr-terms { display:flex; flex-direction:column; gap:14px; }
  .lr-term { display:flex; gap:12px; background:#fff; border:1px solid #eef0f5; border-radius:12px; padding:18px 20px;
    font-size:14.5px; line-height:1.7; color:#4b5563; }
  .lr-term strong { color:#0f1f3d; }
  .lr-term-tick { flex:0 0 auto; margin-top:3px; color:#16a34a; }

  /* faq */
  .lr-faqs { border-top:1px solid #e6e9f0; }
  .lr-faq { border-bottom:1px solid #e6e9f0; }
  .lr-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 0;
    background:none; border:none; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; font-size:16px;
    font-weight:600; color:#0f1f3d; }
  .lr-faq-icon { flex:0 0 auto; color:#2563eb; transition:transform .3s ease; }
  .lr-faq-a { display:grid; grid-template-rows:0fr; transition:grid-template-rows .35s ease; }
  .lr-faq-a p { padding:0 26px 20px 0; font-size:14.5px; line-height:1.75; color:#4b5563; }

  /* cta band */
  .lr-cta { position:relative; overflow:hidden; text-align:center; padding:clamp(56px,7vw,88px) 24px;
    background:linear-gradient(135deg,#0a162f,#0f1f3d); color:#fff; }
  .lr-cta h2 { color:#fff; font-size:clamp(26px,3.4vw,42px); font-weight:700; }
  .lr-cta p { max-width:540px; margin:16px auto 30px; color:rgba(255,255,255,.66); font-size:16px; line-height:1.7; font-weight:300; }
  .lr-cta .lr-chips { margin-top:24px; }

  /* modal */
  .lr-backdrop { position:fixed; inset:0; z-index:60; display:flex; align-items:center; justify-content:center; padding:16px;
    background:rgba(9,17,33,.6); backdrop-filter:blur(3px); transition:opacity .25s ease; }
  .lr-dialog { position:relative; width:100%; background:#fff; border-radius:18px; padding:30px 28px;
    box-shadow:0 0 0 1px rgba(37,99,235,.06), 0 40px 90px rgba(5,10,25,.5), 0 14px 34px rgba(37,99,235,.14);
    max-height:90vh; overflow-y:auto;
    transition:opacity .25s ease, transform .3s cubic-bezier(.34,1.4,.64,1); }
  .lr-dialog-x { position:absolute; top:16px; right:16px; width:34px; height:34px; border-radius:50%; border:none;
    background:#f2f4f8; color:#0f1f3d; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s ease; }
  .lr-dialog-x:hover { background:#e5e9f2; }
  .lr-dialog-kicker { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#2563eb; }
  .lr-dialog-title { font-size:22px; font-weight:700; margin:6px 0 0; padding-right:30px; }
  /* price = green highlight pill */
  .lr-dialog-price { display:inline-flex; align-items:center; gap:6px; margin-top:12px; font-size:14px; font-weight:600;
    color:#065f46; background:linear-gradient(135deg,#ecfdf5,#e5f8ee); border:1px solid #b7f0cd; border-radius:10px;
    padding:8px 14px; box-shadow:0 4px 14px rgba(22,163,74,.16); }
  .lr-vat { color:#5b8f74; font-weight:400; }
  .lr-dialog-summary { margin-top:14px; font-size:14.5px; line-height:1.7; color:#4b5563; }
  /* "what's included" = soft blue info card with green ticks */
  .lr-dialog-list { list-style:none; margin:18px 0 0; padding:16px 18px; display:flex; flex-direction:column; gap:12px;
    background:linear-gradient(180deg,#f6faff,#eef5ff); border:1px solid #dde9fd; border-radius:14px;
    box-shadow:0 8px 22px rgba(37,99,235,.10), inset 0 1px 0 #fff; }
  .lr-dialog-list li { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:#0f1f3d; }
  .lr-dialog-list li svg { flex:0 0 auto; margin-top:2px; color:#16a34a; }
  /* process steps = soft blue info card */
  .lr-dialog-steps { margin-top:18px; padding:8px 18px; background:linear-gradient(180deg,#f6faff,#eef5ff);
    border:1px solid #dde9fd; border-radius:14px; box-shadow:0 8px 22px rgba(37,99,235,.10); }
  /* terms = tinted info card, blue numbers */
  .lr-dialog-terms { margin:18px 0 0; padding:18px 20px 18px 38px; display:flex; flex-direction:column; gap:13px;
    background:linear-gradient(180deg,#f8fafc,#f2f6fb); border:1px solid #e4eaf2; border-radius:14px;
    box-shadow:0 8px 22px rgba(15,31,61,.08); }
  .lr-dialog-terms li { font-size:13.5px; line-height:1.7; color:#4b5563; }
  .lr-dialog-terms li::marker { color:#2563eb; font-weight:700; }
  .lr-dialog-terms li strong { color:#0f1f3d; }

  @keyframes lrfloat { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-14px); } }
  @keyframes lrpulse { 0%,100%{ box-shadow:0 12px 34px rgba(37,99,235,.42); } 50%{ box-shadow:0 14px 42px rgba(37,99,235,.78); } }

  /* responsive */
  @media(max-width:900px){
    .lr-hero-grid { grid-template-columns:1fr; gap:34px; }
    .lr-grid3 { grid-template-columns:1fr 1fr; }
  }
  @media(max-width:600px){
    .lr .wrap { padding:0 18px; }
    .lr-grid3 { grid-template-columns:1fr; }
    .lr-hero-cta { flex-direction:column; align-items:stretch; }
    .lr-hero-cta .lr-btn { width:100%; }
    /* Keep the three hero trust chips on a single row (no 2+1 wrap). */
    .lr-hero-copy .lr-chips { flex-wrap:nowrap; gap:9px; }
    .lr-hero-copy .lr-chips li { white-space:nowrap; font-size:11px; gap:4px; }
    .lr-hero-copy .lr-chips li svg { width:12px; height:12px; }
    /* Give the hero step card clear separation + extra glow on mobile so it
       reads as a distinct, bright panel against the navy hero. */
    .lr-steps-card { margin-top:6px; box-shadow:0 0 0 1px rgba(37,99,235,.14), 0 20px 48px rgba(0,0,0,.55), 0 6px 18px rgba(37,99,235,.3); }
    .lr-dialog { padding:26px 20px; }
  }

  @media (prefers-reduced-motion: reduce){
    .lr-btn, .lr-lift, .lr-faq-icon, .lr-dialog, .lr-backdrop, .lr-bundle-link svg, .lr-step, .lr-card-icon, .lr-bundle-link { transition:none !important; }
    .lr-blob, .lr-btn-cta-blue { animation:none !important; }
  }
`;
