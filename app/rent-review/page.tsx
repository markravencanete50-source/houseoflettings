'use client';
// app/rent-review/page.tsx
// Overview / landing page for the rent review. Explains why we run rent
// reviews, the market context, how the wider industry compares, and the
// process. The multi-step form lives at /rent-review/apply. Metadata + JSON-LD
// are in app/rent-review/layout.tsx.
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RevealCards from '@/components/RevealCards';

// ── Consistent line-icon set (stroke inherits the brand blue via currentColor) ──
function Ic({ name, size = 22 }: { name: string; size?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'scale': return (<svg {...c}><path d="M12 3v18" /><path d="M5 7h14" /><path d="M7 7l-3 6h6z" /><path d="M17 7l-3 6h6z" /><path d="M8 21h8" /></svg>);
    case 'shield': return (<svg {...c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>);
    case 'wrench': return (<svg {...c}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.3-2.3 2.6-2.6z" /></svg>);
    case 'home': return (<svg {...c}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>);
    case 'eye': return (<svg {...c}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>);
    case 'chat': return (<svg {...c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
    case 'check': return (<svg {...c}><path d="M20 6L9 17l-5-5" /></svg>);
    case 'bolt': return (<svg {...c}><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>);
    case 'lock': return (<svg {...c}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
    case 'phone-off': return (<svg {...c}><path d="M3 3l18 18" /><path d="M5 4h3l2 5-2 1a11 11 0 0 0 4 4l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2z" /></svg>);
    case 'search': return (<svg {...c}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
    case 'doc': return (<svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>);
    case 'arrow': return (<svg {...c}><path d="M5 12h14M12 5l7 7-7 7" /></svg>);
    case 'info': return (<svg {...c}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>);
    case 'trend': return (<svg {...c}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></svg>);
    default: return null;
  }
}

const WHY = [
  { icon: 'scale', title: 'Fair, market-aligned rent', desc: 'A review keeps your rent in step with what similar homes nearby actually let for today, fair for you and fair for us.' },
  { icon: 'shield', title: 'No sudden shocks', desc: 'Small, evidence-based adjustments once a year are far easier to plan for than one large correction after rent has drifted for years.' },
  { icon: 'wrench', title: 'A well-maintained home', desc: 'A sustainable rent funds ongoing repairs, safety checks, and the gas, electrical and EPC compliance that keeps you safe.' },
  { icon: 'home', title: 'Longer, stable tenancies', desc: 'Keeping a good tenant almost always beats an empty property. Reviews are designed to keep you settled, not to move you on.' },
  { icon: 'eye', title: 'Full transparency', desc: 'You see the current figure, the proposed figure and the reasoning behind it, nothing is hidden or automatic.' },
  { icon: 'chat', title: 'A conversation, not a demand', desc: 'Happy with the proposal? Accept in a click. Not sure? Open a discussion and tell us the figure that works for you.' },
];

// Qualitative feature strip (no figures) shown right under the hero.
const FEATURES = [
  { icon: 'search', title: 'Evidence-based', desc: 'Benchmarked on real local lets' },
  { icon: 'bolt', title: 'Everything online', desc: 'Review and decide in your own time' },
  { icon: 'phone-off', title: 'No cold calls', desc: 'No back-and-forth on the phone' },
  { icon: 'lock', title: 'Fully transparent', desc: 'Every figure explained to you' },
];

// The dark "context" band — qualitative points, deliberately no statistics.
const CONTEXT = [
  { icon: 'scale', text: 'Reviewed once a year, in line with your tenancy renewal.' },
  { icon: 'search', text: 'Benchmarked against similar homes currently letting nearby.' },
  { icon: 'eye', text: 'Every proposed figure comes with the reasoning behind it.' },
  { icon: 'chat', text: 'Accept online, or open a conversation, the final say is yours.' },
];

const INDUSTRY = [
  { tag: 'Common', title: 'Market-comparable review', desc: 'Most agents review at renewal by comparing your home against similar local properties currently on the market.' },
  { tag: 'Common', title: 'Index-linked increases', desc: 'Some tenancies contain a clause tying the rent to inflation (RPI or CPI), so it rises by a set index each year regardless of the local market.' },
  { tag: 'Statutory', title: 'Section 13 notice', desc: 'For rolling (periodic) tenancies in England, landlords can propose an increase once a year through a formal Section 13 notice.' },
  { tag: 'Blunt', title: 'Automatic fixed uplift', desc: 'A minority of agents write a flat percentage rise into the contract every year. It is simple, but it ignores whether the local market actually moved.' },
];

const DIFF = [
  'Evidence-based, never automatic, we benchmark your actual property against live local comparables.',
  'Transparent, you see the current rent, the proposed rent and the reasoning, side by side.',
  'Collaborative, accept online, or propose your own figure and tell us why.',
  'Fully online, no back-and-forth calls, no posted forms; the whole review takes minutes.',
  'A whole-tenancy check-in, we refresh your details, documents and any maintenance in one place.',
];

const STEPS = [
  { n: '1', title: 'Market review', desc: 'We benchmark your property against homes currently letting in your area to find its fair market rent.' },
  { n: '2', title: 'Your proposal', desc: 'You receive a clear current-versus-proposed rent, with the reasoning behind the figure.' },
  { n: '3', title: 'You decide online', desc: 'Accept the proposal in a click, or open a discussion and suggest your own figure.' },
  { n: '4', title: 'Renewal completed', desc: 'We finalise your renewal and update your details, documents and any repairs in one place.' },
];

const FAQS = [
  { q: 'Why is my rent being reviewed?', a: 'We review the rent on every managed tenancy roughly once a year, usually at renewal, to keep it aligned with the current local market. It keeps things fair on both sides and avoids the rent drifting so far that a large one-off increase becomes necessary later.' },
  { q: 'Does a review always mean my rent goes up?', a: 'No. A review is exactly that, a review. Depending on what the local market is doing, the proposed rent may rise modestly, or stay the same. Whatever the outcome, we show you the evidence behind it.' },
  { q: 'What if I don’t agree with the proposed rent?', a: 'That’s absolutely fine. When you reach the rent step, choose “I’d like to discuss the rent”, tell us the figure you feel is fair and why, and your property manager will talk it through with you before anything is finalised.' },
  { q: 'How often do rent reviews happen?', a: 'Typically once a year, in line with your tenancy renewal. We’ll always contact you in good time rather than springing it on you.' },
  { q: 'Why do you ask for documents again?', a: 'A renewal is a good moment to refresh your referencing, recent bank statements, payslips and ID confirm your circumstances are up to date. It only takes a few minutes and you can upload everything securely online.' },
];

// Steps for the "See a Sample Review" walkthrough modal.
const SAMPLE_STEPS = [
  { title: 'We gather the evidence' },
  { title: 'You see the proposal' },
  { title: 'You decide' },
];

export default function RentReviewOverviewPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // "See a Sample Review" walkthrough modal
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleStep, setSampleStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  const openSample = useCallback(() => { setSampleStep(0); setSampleOpen(true); }, []);
  const closeSample = useCallback(() => { setSampleOpen(false); }, []);

  // Focus trap, Escape-to-close, scroll lock, and focus return to the trigger.
  useEffect(() => {
    if (!sampleOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => dialogRef.current?.focus(), 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeSample(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      prevActive?.focus?.();
    };
  }, [sampleOpen, closeSample]);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />
      <RevealCards />

      <div style={{ fontFamily: "'Poppins', sans-serif" }}>

        {/* ── HERO (tenant-facing rent-review explainer, two-column) ── */}
        <header className="rr-hero">
          <div className="rr-hero-bg" aria-hidden />
          <div className="rr-hero-glow" aria-hidden />
          <div className="rr-hero-grid">

            {/* Left — reassurance, evidence, action */}
            <div className="rr-hero-copy">
              <div className="rr-badge">Annual Rent Review · For existing tenants</div>
              <h1 className="rr-hero-h1">Your rent review, backed by real local evidence.</h1>
              <p className="rr-hero-sub">
                Once a year we check your rent against similar homes letting nearby. You&rsquo;ll see the current
                figure, the proposed figure, and the reasoning behind it.
              </p>
              <p className="rr-hero-sub rr-hero-sub--2">
                Then accept in a click, or open a discussion &mdash; nothing changes without you.
              </p>

              <ul className="rr-assure">
                <li className="rr-assure-item"><span className="rr-assure-ic"><Ic name="check" size={13} /></span>Evidence from real local lets</li>
                <li className="rr-assure-item"><span className="rr-assure-ic"><Ic name="check" size={13} /></span>About 3 minutes, all online</li>
                <li className="rr-assure-item"><span className="rr-assure-ic"><Ic name="check" size={13} /></span>Accept or discuss &mdash; your choice</li>
              </ul>

              <div className="rr-hero-cta-row">
                <Link href="/rent-review/apply" className="rr-cta rr-cta--primary">
                  Start My Rent Review <Ic name="arrow" size={16} />
                </Link>
                <button type="button" onClick={openSample} className="rr-cta rr-cta--ghost">See a Sample Review</button>
              </div>
              <p className="rr-cta-note">You&rsquo;ll confirm your details, then see your proposed rent.</p>
            </div>

            {/* Right — Leeds & Manchester market snapshot (opens sample walkthrough) + feature chips */}
            <div className="rr-hero-visual">
              <div
                className="rr-card rr-card--tappable"
                role="button"
                tabIndex={0}
                aria-label="See a sample rent review, Leeds and Manchester annual market value"
                onClick={openSample}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSample(); } }}
              >
                <div className="rr-card-head">
                  <div>
                    <div className="rr-card-eyebrow">Annual Market Value</div>
                    <div className="rr-card-addr">Leeds &amp; Manchester</div>
                  </div>
                  <span className="rr-card-status">Sample review</span>
                </div>

                <div className="rr-cities">
                  <div className="rr-city">
                    <div className="rr-city-name"><span className="rr-city-dot rr-city-dot--l" aria-hidden />Leeds</div>
                    <div className="rr-city-val">£995<span>pcm</span></div>
                    <div className="rr-city-range">£900&ndash;£1,100</div>
                    <div className="rr-city-trend"><Ic name="trend" size={13} />4.2% / yr</div>
                  </div>
                  <div className="rr-city">
                    <div className="rr-city-name"><span className="rr-city-dot rr-city-dot--m" aria-hidden />Manchester</div>
                    <div className="rr-city-val">£1,150<span>pcm</span></div>
                    <div className="rr-city-range">£980&ndash;£1,300</div>
                    <div className="rr-city-trend"><Ic name="trend" size={13} />5.1% / yr</div>
                  </div>
                </div>

                <div className="rr-card-meta">
                  <div className="rr-meta"><span>Local evidence</span><b>28 recent local lets</b></div>
                  <div className="rr-meta"><span>Reviewed</span><b>Once a year</b></div>
                </div>

                <div className="rr-card-bars" aria-hidden="true">
                  <div className="rr-bar-row">
                    <span className="rr-bar-label">Leeds avg</span>
                    <span className="rr-bar"><i style={{ width: '87%' }} /></span>
                    <span className="rr-bar-val">£995</span>
                  </div>
                  <div className="rr-bar-row">
                    <span className="rr-bar-label">Manchester avg</span>
                    <span className="rr-bar"><i className="rr-bar-i--rec" style={{ width: '100%' }} /></span>
                    <span className="rr-bar-val">£1,150</span>
                  </div>
                </div>
                <p className="rr-sr-only">Average monthly rent for comparable homes: Leeds £995, Manchester £1,150.</p>

                <div className="rr-card-panel">
                  <span className="rr-panel-ic"><Ic name="info" size={16} /></span>
                  <div>
                    <div className="rr-panel-t">Market summary</div>
                    <p>Comparable homes across Leeds and Manchester have let between £900 and £1,300 per month over the past six months.</p>
                  </div>
                </div>
              </div>

              {/* Feature chips — anchored directly below the market card */}
              <div className="rr-feats">
                {FEATURES.map((f, i) => (
                  <div key={f.title} className="rr-feat" style={{ animationDelay: `${i * 55}ms` }}>
                    <span className="rr-feat-ic"><Ic name={f.icon} size={18} /></span>
                    <div>
                      <div className="rr-feat-t">{f.title}</div>
                      <div className="rr-feat-d">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </header>

        {/* ── WHY ── */}
        <section id="why" className="rr-sec" style={{ background: '#fff' }}>
          <div className="rr-wrap">
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow">Why We Do It</div>
              <h2 className="hol-h2">Why we review the rent each year</h2>
              <p className="rr-lead">A rent review isn&rsquo;t about squeezing more out of your tenancy. Done properly, it protects the home you live in and the relationship we have with you.</p>
            </div>
            <div className="rr-why-grid">
              {WHY.map((item, i) => (
                <div key={item.title} className="rr-why-card hol-card hol-reveal" style={{ animationDelay: `${i * 55}ms` }}>
                  <span className="rr-why-ic" aria-hidden="true"><Ic name={item.icon} size={24} /></span>
                  <h3 className="rr-why-title">{item.title}</h3>
                  <p className="rr-why-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROCESS (visual stepper — the centrepiece) ── */}
        <section id="how" className="rr-sec" style={{ background: '#f7f8fa', scrollMarginTop: '80px' }}>
          <div className="rr-wrap">
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow">The Process</div>
              <h2 className="hol-h2">How your rent review works</h2>
              <p className="rr-lead">Four simple steps, all online, at your own pace.</p>
            </div>
            <ol className="rr-steps2">
              {STEPS.map((s, i) => (
                <li key={s.n} className="rr-step2 hol-reveal" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="rr-step2-node">{s.n}</div>
                  <div className="rr-step2-body">
                    <h3 className="rr-step2-title">{s.title}</h3>
                    <p className="rr-step2-desc">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CONTEXT (dark band, qualitative) ── */}
        <section className="rr-sec rr-sec--dark">
          <div className="rr-glow-dark" aria-hidden />
          <div className="rr-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="rr-context">
              <div className="rr-context-copy hol-reveal">
                <div className="hol-eyebrow" style={{ color: 'var(--rr-accent-bright)' }}>The Context</div>
                <h2 className="hol-h2" style={{ color: '#fff' }}>What the market tells us</h2>
                <p className="rr-lead" style={{ color: 'rgba(255,255,255,0.6)', margin: '16px 0 0' }}>
                  Local rents move year to year with supply and demand. Reviewing regularly, and evidencing every figure,
                  keeps things fair and predictable, instead of letting rent drift until a big correction is unavoidable.
                </p>
              </div>
              <ul className="rr-context-list hol-reveal" style={{ animationDelay: '80ms' }}>
                {CONTEXT.map(p => (
                  <li key={p.text}>
                    <span className="rr-context-ic"><Ic name={p.icon} size={18} /></span>
                    <span>{p.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── INDUSTRY vs US ── */}
        <section className="rr-sec" style={{ background: '#fff' }}>
          <div className="rr-wrap">
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow">The Industry</div>
              <h2 className="hol-h2">How rent reviews work across the industry</h2>
              <p className="rr-lead">Estate and lettings agents take a few different routes. Some are fairer and clearer than others, here&rsquo;s the landscape, and where we sit in it.</p>
            </div>
            <div className="rr-compare">
              <div className="rr-compare-col hol-reveal">
                <div className="rr-compare-head rr-compare-head--muted">
                  <span className="rr-compare-tag">Across the industry</span>
                  <h3>Common approaches</h3>
                </div>
                <div className="rr-ind-list">
                  {INDUSTRY.map(item => (
                    <div key={item.title} className="rr-ind-item">
                      <span className={`rr-chip rr-chip--${item.tag.toLowerCase()}`}>{item.tag}</span>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rr-compare-col rr-compare-col--us hol-reveal" style={{ animationDelay: '90ms' }}>
                <div className="rr-compare-head">
                  <span className="rr-compare-tag rr-compare-tag--us">House of Lettings</span>
                  <h3>How we do it differently</h3>
                </div>
                <ul className="rr-diff-list">
                  {DIFF.map(d => (
                    <li key={d}><span className="rr-diff-ic"><Ic name="check" size={16} /></span><span>{d}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="rr-sec" style={{ background: '#f7f8fa' }}>
          <div className="rr-wrap" style={{ maxWidth: 780 }}>
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow">Common Questions</div>
              <h2 className="hol-h2">Rent review, answered</h2>
            </div>
            <div className="rr-faq-list hol-reveal">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className={`rr-faq${open ? ' open' : ''}`}>
                    <button type="button" className="rr-faq-q" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}>
                      <span>{f.q}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    <div className="rr-faq-a" style={{ maxHeight: open ? 320 : 0 }}>
                      <p>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="rr-sec rr-sec--dark rr-cta-band">
          <div className="rr-glow-dark" aria-hidden />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <h2 className="rr-cta-title">Ready to start your rent review?</h2>
            <p className="rr-cta-text">Confirm your details, review the proposed rent, and renew, all in a few minutes, online.</p>
            <Link href="/rent-review/apply" className="rr-cta rr-cta--primary rr-cta--lg">
              Rent Review <Ic name="arrow" size={18} />
            </Link>
          </div>
        </section>

        <Footer />
      </div>

      {/* ── SAMPLE REVIEW MODAL (anxiety-killer walkthrough) ── */}
      {sampleOpen && (
        <div className="rr-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSample(); }}>
          <div
            className="rr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rr-sample-title"
            ref={dialogRef}
            tabIndex={-1}
          >
            <span className="rr-modal-handle" aria-hidden />
            <button type="button" className="rr-modal-close" onClick={closeSample} aria-label="Close sample review">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>

            <div className="rr-modal-eyebrow">Sample review · what you&rsquo;ll see</div>
            <h2 id="rr-sample-title" className="rr-modal-title">{SAMPLE_STEPS[sampleStep].title}</h2>

            <div className="rr-modal-progress" aria-hidden>
              {SAMPLE_STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  className={`rr-modal-dot${i === sampleStep ? ' is-active' : ''}${i < sampleStep ? ' is-done' : ''}`}
                  onClick={() => setSampleStep(i)}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                />
              ))}
            </div>

            <div className="rr-modal-body">
              {sampleStep === 0 && (
                <>
                  <p className="rr-modal-text">
                    We compare your home against similar properties recently let nearby &mdash; benchmarked across
                    Leeds and Manchester &mdash; so every figure is grounded in the real local market, never guesswork.
                  </p>
                  <div className="rr-modal-evi">
                    {[
                      { a: '2-bed flat · LS8, Leeds', b: '£940 pcm' },
                      { a: '2-bed flat · M20, Manchester', b: '£1,120 pcm' },
                      { a: '2-bed terrace · LS6, Leeds', b: '£905 pcm' },
                    ].map(r => (
                      <div key={r.a} className="rr-modal-evi-row"><span>{r.a}</span><b>{r.b}</b></div>
                    ))}
                  </div>
                </>
              )}

              {sampleStep === 1 && (
                <>
                  <p className="rr-modal-text">
                    You see your current rent and the proposed rent side by side, with the local range it sits in.
                    A review can go up, stay the same, or find no change is needed &mdash; the market decides, and you
                    see the evidence either way.
                  </p>
                  <div className="rr-modal-compare">
                    <div className="rr-modal-cmp"><span>Current rent</span><b>£850 pcm</b></div>
                    <div className="rr-modal-cmp rr-modal-cmp--accent"><span>Proposed rent</span><b>£875 pcm</b></div>
                    <div className="rr-modal-cmp"><span>Local range</span><b>£840&ndash;£940</b></div>
                  </div>
                  <p className="rr-modal-note">The proposed figure sits inside the local range &mdash; often below the average.</p>
                </>
              )}

              {sampleStep === 2 && (
                <>
                  <p className="rr-modal-text">
                    When you&rsquo;re ready, you choose. Accept the proposed rent online in a click, or open a
                    discussion and tell us the figure you feel is fair. Nothing changes without you.
                  </p>
                  <div className="rr-modal-options">
                    <div className="rr-modal-opt"><span className="rr-modal-opt-ic"><Ic name="check" size={16} /></span>Accept online</div>
                    <div className="rr-modal-opt"><span className="rr-modal-opt-ic"><Ic name="chat" size={16} /></span>Discuss with us</div>
                  </div>
                </>
              )}
            </div>

            <div className="rr-modal-foot">
              <button
                type="button"
                className="rr-cta rr-cta--ghost rr-cta--sm"
                onClick={() => (sampleStep === 0 ? closeSample() : setSampleStep(s => s - 1))}
              >
                {sampleStep === 0 ? 'Close' : 'Back'}
              </button>
              {sampleStep < SAMPLE_STEPS.length - 1 ? (
                <button type="button" className="rr-cta rr-cta--primary rr-cta--sm" onClick={() => setSampleStep(s => s + 1)}>
                  Next <Ic name="arrow" size={15} />
                </button>
              ) : (
                <Link href="/rent-review/apply" className="rr-cta rr-cta--primary rr-cta--sm">
                  Start My Rent Review <Ic name="arrow" size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  /* Blue is the brand primary — accents on this page use blue, not green. */
  :root {
    --rr-accent:#2563eb;
    --rr-accent-soft:rgba(37,99,235,.10);
    --rr-accent-bright:#93c5fd;
    --rr-accent-line:#c7d9fb;
  }

  .hol-eyebrow { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--rr-accent); margin-bottom:14px; font-family:'Poppins',sans-serif; }
  .hol-h2 { font-family:'Poppins',sans-serif; font-size:clamp(27px,3.8vw,44px); font-weight:800; color:#0f1f3d; line-height:1.15; margin:0; letter-spacing:-.01em; }

  .rr-wrap { max-width:1080px; margin:0 auto; }
  .rr-sec { padding:clamp(64px,9vw,120px) clamp(20px,6%,80px); position:relative; overflow:hidden; }
  .rr-head { text-align:center; max-width:640px; margin:0 auto clamp(40px,6vw,64px); }
  .rr-lead { font-size:15.5px; color:#6b7280; max-width:620px; margin:16px auto 0; line-height:1.75; }
  .rr-hero-h1, .rr-hero-sub, .rr-lead, .rr-why-desc, .rr-ind-item p, .rr-diff-list li, .rr-step2-desc, .rr-faq-q, .rr-faq-a p, .rr-cta-text, .hol-h2 { overflow-wrap:break-word; }

  /* HERO — logged-in landlord portal, two-column */
  .rr-hero { position:relative; overflow:hidden; background:#0b1a34;
    background-image:radial-gradient(ellipse 900px 620px at 82% 6%, rgba(37,99,235,0.30) 0%, transparent 60%), radial-gradient(ellipse 760px 520px at 4% 96%, rgba(37,99,235,0.14) 0%, transparent 58%);
    display:flex; align-items:center; min-height:min(88vh, 920px);
    padding:calc(68px + 92px) clamp(20px,5vw,64px) 120px; }
  /* Extremely light abstract blueprint grid (~4% opacity) */
  .rr-hero-bg { position:absolute; inset:0; pointer-events:none;
    background-image:linear-gradient(rgba(147,197,253,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,0.045) 1px, transparent 1px);
    background-size:44px 44px; -webkit-mask-image:radial-gradient(ellipse 80% 80% at 60% 40%, #000 30%, transparent 88%); mask-image:radial-gradient(ellipse 80% 80% at 60% 40%, #000 30%, transparent 88%); }
  .rr-hero-glow { position:absolute; top:-24%; right:6%; width:min(620px,70%); height:520px;
    background:radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 66%); filter:blur(14px); animation:rr-float 10s ease-in-out infinite; pointer-events:none; }
  @keyframes rr-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(22px);} }

  .rr-hero-grid { position:relative; z-index:1; width:100%; max-width:1280px; margin:0 auto;
    display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.18fr); gap:80px; align-items:center; }
  .rr-hero-copy, .rr-hero-visual { min-width:0; }
  @media(max-width:940px){ .rr-hero-grid{ grid-template-columns:minmax(0,1fr); gap:44px; } .rr-hero-h1{ max-width:none; } .rr-hero-visual{ max-width:520px; } }

  .rr-hero-copy { animation:rr-hero-in .8s cubic-bezier(.22,1,.36,1) both; }
  @keyframes rr-hero-in { from{opacity:0; transform:translateY(18px);} to{opacity:1; transform:none;} }
  .rr-badge { display:inline-block; background:rgba(96,165,250,0.16); color:#bfdbfe; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:6px 14px; border-radius:20px; margin-bottom:22px; border:1px solid rgba(96,165,250,0.28); }
  .rr-hero-h1 { font-size:clamp(34px,4.6vw,60px); font-weight:800; color:#fff; line-height:1.05; margin:0 0 28px; letter-spacing:-.025em; max-width:12ch; }
  .rr-hero-sub { font-size:clamp(15px,1.5vw,17px); color:#c7d2e3; max-width:580px; margin:0; line-height:1.7; font-weight:300; }
  .rr-hero-sub--2 { margin-top:14px; }
  .rr-assure { list-style:none; margin:32px 0 0; padding:0; display:flex; flex-wrap:wrap; gap:24px; }
  .rr-assure-item { display:flex; align-items:center; gap:9px; font-size:13.5px; font-weight:500; color:#dbe4f2; }
  .rr-assure-ic { flex:none; width:22px; height:22px; border-radius:50%; background:rgba(96,165,250,0.16); color:#93c5fd; display:grid; place-items:center; }
  .rr-hero-cta-row { display:flex; gap:16px; flex-wrap:wrap; margin-top:36px; }

  .rr-cta { display:inline-flex; align-items:center; justify-content:center; gap:9px; box-sizing:border-box; min-height:50px; line-height:1.2; font-family:'Poppins',sans-serif; font-size:13.5px; font-weight:700; letter-spacing:.02em; text-transform:uppercase; padding:14px 30px; border-radius:12px; text-decoration:none; border:1.5px solid transparent; transition:background .2s,transform .2s,box-shadow .2s,border-color .2s,color .2s; }
  .rr-cta:focus-visible { outline:3px solid #93c5fd; outline-offset:3px; }
  .rr-cta--primary { background:#2563eb; color:#fff; box-shadow:0 12px 28px -12px rgba(37,99,235,.75); }
  .rr-cta--primary:hover { background:#1d4ed8; transform:translateY(-2px); box-shadow:0 18px 36px -14px rgba(37,99,235,.85); }
  .rr-cta--ghost { background:transparent; color:#dbe9ff; border-color:rgba(255,255,255,0.28); }
  .rr-cta--ghost:hover { background:#fff; color:#0f1f3d; border-color:#fff; transform:translateY(-2px); }
  .rr-cta--lg { min-height:56px; font-size:14px; padding:16px 40px; }
  .rr-cta--sm { min-height:46px; font-size:12.5px; padding:12px 20px; border-radius:12px; }
  .rr-hero-cta-row .rr-cta { min-height:52px; border-radius:14px; }
  .rr-cta-note { font-size:12.5px; color:#94a3b8; margin:14px 0 0; line-height:1.5; }

  .rr-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

  /* DASHBOARD PREVIEW CARD (right column) */
  .rr-hero-visual { animation:rr-card-in .9s .1s cubic-bezier(.22,1,.36,1) both; }
  @keyframes rr-card-in { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:none;} }
  .rr-card--tappable { cursor:pointer; }
  .rr-card--tappable:focus-visible { outline:3px solid #93c5fd; outline-offset:4px; }
  .rr-card { position:relative; background:linear-gradient(180deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 100%);
    border:1px solid rgba(147,197,253,0.18); border-radius:20px; padding:24px;
    box-shadow:0 40px 80px -40px rgba(0,0,0,0.65); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
    transition:transform .3s ease, box-shadow .3s ease; }
  .rr-card:hover { transform:translateY(-4px); box-shadow:0 52px 96px -42px rgba(0,0,0,0.7); }
  .rr-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding-bottom:18px; border-bottom:1px solid rgba(147,197,253,0.12); }
  .rr-card-eyebrow { font-size:10.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#93c5fd; }
  .rr-card-addr { font-size:18px; font-weight:700; color:#fff; margin-top:5px; }
  /* Honest "Sample review" label — neutral gray, never dressed up as a live/positive state */
  .rr-card-status { flex:none; display:inline-flex; align-items:center; gap:7px; font-size:10.5px; font-weight:600; letter-spacing:.04em; color:#94a3b8; background:rgba(148,163,184,0.10); border:1px solid rgba(148,163,184,0.24); padding:5px 11px; border-radius:20px; white-space:nowrap; }

  .rr-cities { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin:18px 0; }
  .rr-city { min-width:0; background:rgba(255,255,255,0.03); border:1px solid rgba(147,197,253,0.12); border-radius:14px; padding:15px 15px 16px; }
  .rr-city-name { display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#dbe9ff; }
  .rr-city-dot { flex:none; width:8px; height:8px; border-radius:50%; }
  .rr-city-dot--l { background:#60a5fa; }
  .rr-city-dot--m { background:#7dd3fc; }
  .rr-city-val { font-size:26px; font-weight:800; color:#fff; margin-top:10px; letter-spacing:-.01em; }
  .rr-city-val span { font-size:12px; font-weight:500; color:rgba(199,210,227,0.72); margin-left:4px; }
  .rr-city-range { font-size:12px; color:rgba(199,210,227,0.70); margin-top:4px; }
  .rr-city-trend { display:inline-flex; align-items:center; gap:5px; margin-top:11px; font-size:11px; font-weight:700; color:#6ee7b7; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.26); padding:3px 9px; border-radius:20px; }

  .rr-card-meta { display:flex; flex-direction:column; }
  .rr-meta { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 0; border-top:1px solid rgba(147,197,253,0.08); font-size:13px; }
  .rr-meta span { color:rgba(199,210,227,0.76); }
  .rr-meta b { color:#fff; font-weight:600; }

  .rr-card-bars { display:flex; flex-direction:column; gap:12px; margin:18px 0; }
  .rr-bar-row { display:grid; grid-template-columns:104px minmax(0,1fr) auto; align-items:center; gap:12px; }
  .rr-bar-label { font-size:11.5px; color:rgba(199,210,227,0.78); }
  .rr-bar { min-width:0; height:8px; border-radius:999px; background:rgba(255,255,255,0.07); overflow:hidden; }
  .rr-bar i { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg,#2563eb,#60a5fa); transform-origin:left; animation:rr-bar .9s .35s both cubic-bezier(.22,1,.36,1); }
  .rr-bar-i--full { background:linear-gradient(90deg,#3b82f6,#93c5fd); opacity:.85; }
  .rr-bar-i--rec { background:linear-gradient(90deg,#2563eb,#7dd3fc); }
  @keyframes rr-bar { from{transform:scaleX(0);} to{transform:scaleX(1);} }
  .rr-bar-val { font-size:11.5px; font-weight:700; color:#dbe9ff; }

  .rr-card-panel { display:flex; gap:12px; align-items:flex-start; background:rgba(37,99,235,0.14); border:1px solid rgba(96,165,250,0.28); border-radius:14px; padding:14px 16px; margin-top:4px; }
  .rr-panel-ic { flex:none; width:30px; height:30px; border-radius:9px; background:rgba(96,165,250,0.20); color:#93c5fd; display:grid; place-items:center; }
  .rr-panel-t { font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#bfdbfe; margin-bottom:4px; }
  .rr-card-panel p { font-size:12.5px; color:rgba(199,210,227,0.88); line-height:1.55; margin:0; }

  /* FEATURE CHIPS — anchored below the market card in the right column */
  .rr-feats { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:16px; }
  @media(max-width:460px){ .rr-feats{ grid-template-columns:1fr; } }
  .rr-feat { display:flex; align-items:flex-start; gap:11px; min-width:0; background:rgba(255,255,255,0.045); border:1px solid rgba(147,197,253,0.14); border-radius:14px; padding:13px 14px; }
  .rr-feat-ic { flex:none; width:36px; height:36px; border-radius:10px; background:rgba(96,165,250,0.14); color:#93c5fd; display:grid; place-items:center; }
  .rr-feat-t { font-size:13px; font-weight:700; color:#eaf1fb; }
  .rr-feat-d { font-size:11px; color:rgba(199,210,227,0.70); margin-top:2px; line-height:1.4; }

  /* SAMPLE REVIEW MODAL */
  .rr-modal-overlay { position:fixed; inset:0; z-index:1000; background:rgba(7,18,38,0.62); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; animation:rr-ov-in .2s ease-out; }
  @keyframes rr-ov-in { from{opacity:0;} to{opacity:1;} }
  .rr-modal { position:relative; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; background:#0F1E38; border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:28px 28px 24px; color:#fff; outline:none; box-shadow:0 40px 90px -30px rgba(0,0,0,0.72); animation:rr-modal-in .28s cubic-bezier(.22,1,.36,1); }
  @keyframes rr-modal-in { from{opacity:0; transform:translateY(8px) scale(.96);} to{opacity:1; transform:none;} }
  .rr-modal-handle { display:none; }
  .rr-modal-close { position:absolute; top:16px; right:16px; width:36px; height:36px; border-radius:50%; border:none; background:rgba(255,255,255,0.06); color:#c7d2e3; display:grid; place-items:center; cursor:pointer; transition:background .18s,color .18s; }
  .rr-modal-close:hover { background:rgba(255,255,255,0.12); color:#fff; }
  .rr-modal-close:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
  .rr-modal-eyebrow { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#93c5fd; margin-bottom:10px; }
  .rr-modal-title { font-family:'Poppins',sans-serif; font-size:22px; font-weight:700; color:#fff; letter-spacing:-.01em; margin:0 40px 16px 0; line-height:1.2; }
  .rr-modal-progress { display:flex; gap:8px; margin-bottom:20px; }
  .rr-modal-dot { flex:1; height:5px; border-radius:999px; border:none; padding:0; background:rgba(255,255,255,0.12); cursor:pointer; transition:background .2s; }
  .rr-modal-dot.is-active { background:#2563eb; }
  .rr-modal-dot.is-done { background:rgba(37,99,235,0.55); }
  .rr-modal-dot:focus-visible { outline:2px solid #93c5fd; outline-offset:3px; }
  .rr-modal-body { min-height:150px; }
  .rr-modal-text { font-size:14.5px; color:#c7d2e3; line-height:1.65; margin:0 0 18px; }
  .rr-modal-evi { display:flex; flex-direction:column; gap:8px; }
  .rr-modal-evi-row { display:flex; justify-content:space-between; align-items:center; gap:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px 14px; font-size:13px; color:#c7d2e3; }
  .rr-modal-evi-row b { color:#fff; font-weight:700; }
  .rr-modal-compare { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
  .rr-modal-cmp { min-width:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:13px 12px; }
  .rr-modal-cmp span { display:block; font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; font-weight:600; }
  .rr-modal-cmp b { display:block; font-size:18px; font-weight:800; color:#fff; margin-top:6px; letter-spacing:-.01em; }
  .rr-modal-cmp--accent { background:rgba(37,99,235,0.16); border-color:rgba(96,165,250,0.42); }
  .rr-modal-note { font-size:12.5px; color:#94a3b8; line-height:1.55; margin:14px 0 0; }
  .rr-modal-options { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .rr-modal-opt { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(147,197,253,0.20); border-radius:12px; padding:15px 16px; font-size:13.5px; font-weight:600; color:#eaf1fb; }
  .rr-modal-opt-ic { flex:none; width:30px; height:30px; border-radius:9px; background:rgba(96,165,250,0.16); color:#93c5fd; display:grid; place-items:center; }
  .rr-modal-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:24px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.08); }
  @media(max-width:640px){
    .rr-modal-overlay { align-items:flex-end; padding:0; }
    .rr-modal { max-width:none; max-height:88vh; border-radius:20px 20px 0 0; padding:16px 18px calc(20px + env(safe-area-inset-bottom)); animation:rr-sheet-in .32s cubic-bezier(.22,1,.36,1); }
    @keyframes rr-sheet-in { from{transform:translateY(100%);} to{transform:translateY(0);} }
    .rr-modal-handle { display:block; width:40px; height:4px; border-radius:999px; background:rgba(255,255,255,0.22); margin:2px auto 14px; }
    .rr-modal-close { top:12px; right:12px; }
    .rr-modal-options { grid-template-columns:1fr; }
    .rr-modal-foot .rr-cta--sm { flex:1; }
  }

  /* WHY grid */
  .rr-why-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media(max-width:860px){ .rr-why-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:560px){ .rr-why-grid{grid-template-columns:1fr;} }
  .rr-why-card { background:#fff; border:1px solid #eef0f5; border-radius:18px; padding:28px 24px; }
  .rr-why-ic { display:inline-grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--rr-accent-soft); color:var(--rr-accent); margin-bottom:16px; }
  .rr-why-title { font-size:16.5px; font-weight:700; color:#0f1f3d; margin:0 0 8px; }
  .rr-why-desc { font-size:14px; color:#6b7280; line-height:1.7; margin:0; }

  /* PROCESS stepper */
  .rr-steps2 { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:20px; position:relative; }
  .rr-steps2::before { content:''; position:absolute; top:29px; left:12%; right:12%; height:2px; background:linear-gradient(90deg,#c7d9fb,#9dc0f8); z-index:0; }
  .rr-step2 { position:relative; z-index:1; text-align:center; }
  .rr-step2-node { width:58px; height:58px; border-radius:50%; background:#fff; border:2px solid var(--rr-accent); color:var(--rr-accent); font-weight:800; font-size:20px; display:grid; place-items:center; margin:0 auto 18px; box-shadow:0 10px 24px -12px rgba(37,99,235,.6); }
  .rr-step2-body { background:#fff; border:1px solid #eef0f5; border-radius:16px; padding:22px 18px; box-shadow:0 6px 18px -12px rgba(15,31,61,.2); }
  .rr-step2-title { font-size:16px; font-weight:700; color:#0f1f3d; margin:0 0 8px; }
  .rr-step2-desc { font-size:13.5px; color:#6b7280; line-height:1.65; margin:0; }
  @media(max-width:820px){
    .rr-steps2 { grid-template-columns:1fr; gap:14px; }
    .rr-steps2::before { display:none; }
    .rr-step2 { text-align:left; display:grid; grid-template-columns:auto 1fr; gap:16px; align-items:center; }
    .rr-step2-node { width:48px; height:48px; font-size:17px; margin:0; }
  }

  /* CONTEXT dark band */
  .rr-sec--dark { background:#0f1f3d; }
  .rr-glow-dark { position:absolute; inset:0; background:radial-gradient(ellipse at 30% 40%, rgba(37,99,235,0.14) 0%, transparent 66%); pointer-events:none; }
  .rr-context { display:grid; grid-template-columns:1fr 1fr; gap:clamp(28px,5vw,56px); align-items:center; }
  @media(max-width:820px){ .rr-context{ grid-template-columns:1fr; } }
  .rr-context-copy .rr-lead { margin-left:0; margin-right:0; max-width:none; }
  .rr-context-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px; }
  .rr-context-list li { display:flex; gap:13px; align-items:flex-start; font-size:14.5px; color:#e7eefb; line-height:1.6; font-weight:400;
    background:rgba(255,255,255,0.04); border:1px solid rgba(96,165,250,0.20); border-radius:12px; padding:14px 16px; }
  .rr-context-ic { flex:none; width:34px; height:34px; border-radius:9px; background:rgba(96,165,250,0.14); color:var(--rr-accent-bright); display:grid; place-items:center; }

  /* COMPARE */
  .rr-compare { display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start; }
  @media(max-width:820px){ .rr-compare{grid-template-columns:1fr;} }
  .rr-compare-col { border:1px solid #eef0f5; border-radius:18px; padding:28px 26px; background:#fdfdff; box-shadow:0 4px 14px -6px rgba(15,31,61,0.10); }
  .rr-compare-col--us { border-color:#c7d9fb; background:linear-gradient(180deg,#f2f7ff 0%,#ffffff 100%); box-shadow:0 22px 46px -26px rgba(37,99,235,0.4); }
  .rr-compare-head { margin-bottom:18px; }
  .rr-compare-tag { display:inline-block; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#6b7280; background:#eef0f5; padding:4px 10px; border-radius:20px; margin-bottom:10px; }
  .rr-compare-tag--us { color:#fff; background:var(--rr-accent); }
  .rr-compare-head h3 { font-size:19px; font-weight:700; color:#0f1f3d; margin:0; }
  .rr-compare-head--muted h3 { color:#64748b; }
  .rr-ind-list { display:flex; flex-direction:column; gap:16px; }
  .rr-ind-item { display:flex; gap:12px; align-items:flex-start; }
  .rr-ind-item h4 { font-size:14.5px; font-weight:700; color:#334155; margin:0 0 3px; }
  .rr-ind-item p { font-size:13px; color:#6b7280; line-height:1.6; margin:0; }
  .rr-chip { flex:none; font-size:9.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; padding:4px 8px; border-radius:6px; margin-top:2px; }
  .rr-chip--common { color:#475569; background:#e2e8f0; }
  .rr-chip--statutory { color:#92400e; background:#fef3c7; }
  .rr-chip--blunt { color:#9f1239; background:#ffe4e6; }
  .rr-diff-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px; }
  .rr-diff-list li { display:flex; gap:11px; align-items:flex-start; font-size:14px; color:#1e3a5f; line-height:1.6; font-weight:500; }
  .rr-diff-ic { flex:none; width:22px; height:22px; border-radius:6px; background:var(--rr-accent-soft); color:var(--rr-accent); display:grid; place-items:center; margin-top:1px; }

  /* FAQ */
  .rr-faq-list { display:flex; flex-direction:column; gap:12px; }
  .rr-faq { border:1px solid #eef0f5; border-radius:14px; overflow:hidden; background:#fff; transition:border-color .2s,box-shadow .2s; }
  .rr-faq.open { border-color:#c7d9fb; box-shadow:0 12px 28px -18px rgba(37,99,235,0.35); }
  .rr-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; background:none; border:none; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; font-size:15px; font-weight:600; color:#0f1f3d; }
  .rr-faq-q svg { flex:none; color:var(--rr-accent); }
  .rr-faq-a { overflow:hidden; transition:max-height .3s ease; }
  .rr-faq-a p { margin:0; padding:0 20px 18px; font-size:14px; color:#6b7280; line-height:1.75; }

  /* FINAL CTA */
  .rr-cta-band { text-align:center; }
  .rr-cta-title { font-size:clamp(27px,3.8vw,44px); font-weight:800; color:#fff; margin:0 0 16px; letter-spacing:-.01em; }
  .rr-cta-text { font-size:16px; color:rgba(255,255,255,0.62); max-width:540px; margin:0 auto 34px; line-height:1.7; font-weight:300; }

  /* Phones */
  @media(max-width:600px){
    .rr-sec { padding:clamp(52px,12vw,72px) 18px; }
    .rr-hero { min-height:auto; padding:calc(64px + 40px) 18px 72px; }
    .rr-hero-h1 { font-size:29px; line-height:1.12; margin-bottom:20px; }
    .rr-assure { gap:14px 22px; }
    .rr-hero-cta-row { flex-direction:column; gap:10px; }
    .rr-hero-cta-row .rr-cta { width:100%; }
    .rr-cta--lg { width:100%; }
    .rr-card { padding:20px; }
    .rr-cities { gap:10px; }
    .rr-city { padding:13px 12px 14px; }
    .rr-city-val { font-size:22px; }
    .rr-bar-row { grid-template-columns:88px minmax(0,1fr) auto; }
    .rr-why-card, .rr-compare-col, .rr-step2-body { padding:20px 18px; }
    .rr-head { margin-bottom:32px; }
    .rr-faq-q { padding:15px 16px; font-size:14.5px; }
    .rr-faq-a p { padding:0 16px 15px; }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce){
    .rr-hero-glow, .rr-hero-copy, .rr-hero-visual, .rr-bar i, .rr-modal, .rr-modal-overlay { animation:none !important; }
    .rr-bar i { transform:none !important; }
    .rr-cta, .rr-why-card, .rr-faq, .rr-faq-a, .rr-faq-q svg, .rr-feat, .rr-card, .rr-modal-close, .rr-modal-dot { transition:none !important; }
  }
`;
