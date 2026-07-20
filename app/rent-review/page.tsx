'use client';
// app/rent-review/page.tsx
// Overview / landing page explaining why we run rent reviews, the market
// context behind them, and how our approach compares with the rest of the
// industry. The actual multi-step form lives at /rent-review/apply.
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RevealCards from '@/components/RevealCards';

const WHY = [
  { icon: '⚖️', title: 'Fair, market-aligned rent', desc: 'A review keeps your rent in step with what similar homes nearby actually let for today, fair for you and fair for us.' },
  { icon: '📈', title: 'No sudden shocks', desc: 'Small, evidence-based adjustments once a year are far easier to plan for than one large correction after rent has drifted for years.' },
  { icon: '🛠️', title: 'A well-maintained home', desc: 'A sustainable rent funds ongoing repairs, safety checks, and the gas, electrical and EPC compliance that keeps you safe.' },
  { icon: '🤝', title: 'Longer, stable tenancies', desc: 'Keeping a good tenant almost always beats an empty property. Reviews are designed to keep you settled, not to move you on.' },
  { icon: '🔍', title: 'Full transparency', desc: 'You see the current figure, the proposed figure and the reasoning behind it, nothing is hidden or automatic.' },
  { icon: '💬', title: 'A conversation, not a demand', desc: 'Happy with the proposal? Accept in a click. Not sure? Open a discussion and tell us the figure that works for you.' },
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
  { n: '01', title: 'Market review', desc: 'We benchmark your property against homes currently letting in your area to find its fair market rent.' },
  { n: '02', title: 'Your proposal', desc: 'You receive a clear current-vs-proposed rent, with the reasoning behind the figure.' },
  { n: '03', title: 'You decide online', desc: 'Accept the proposal in a click, or open a discussion and suggest your own figure.' },
  { n: '04', title: 'Renewal completed', desc: 'We finalise your renewal and, in one place, update your details and documents and arrange any repairs.' },
];

const STATS = [
  { big: '12', small: 'months', label: 'Typical review cycle, at each renewal' },
  { big: '4', small: 'steps', label: 'From market review to completed renewal' },
  { big: '0', small: 'calls', label: 'It’s all done online, in your own time' },
  { big: '100%', small: 'clear', label: 'You see the evidence behind every figure' },
];

const FAQS = [
  { q: 'Why is my rent being reviewed?', a: 'We review the rent on every managed tenancy roughly once a year, usually at renewal, to keep it aligned with the current local market. It keeps things fair on both sides and avoids the rent drifting so far that a large one-off increase becomes necessary later.' },
  { q: 'Does a review always mean my rent goes up?', a: 'No. A review is exactly that, a review. Depending on what the local market is doing, the proposed rent may rise modestly, or stay the same. Whatever the outcome, we show you the evidence behind it.' },
  { q: 'What if I don’t agree with the proposed rent?', a: 'That’s absolutely fine. When you reach the rent step, choose “I’d like to discuss the rent”, tell us the figure you feel is fair and why, and your property manager will talk it through with you before anything is finalised.' },
  { q: 'How often do rent reviews happen?', a: 'Typically every 12 months, in line with your tenancy renewal. We’ll always contact you in good time rather than springing it on you.' },
  { q: 'Why do you ask for documents again?', a: 'A renewal is a good moment to refresh your referencing, recent bank statements, payslips and ID confirm your circumstances are up to date. It only takes a few minutes and you can upload everything securely online.' },
];

export default function RentReviewOverviewPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />
      <RevealCards />

      <div style={{ fontFamily: "'Poppins', sans-serif" }}>

        {/* ── HERO ── */}
        <div className="rr-hero">
          <div className="rr-hero-glow" aria-hidden />
          <div className="rr-hero-inner">
            <div className="rr-badge">Rent Review Process</div>
            <h1 className="rr-hero-h1">Rent reviews, done fairly and transparently</h1>
            <p className="rr-hero-sub">
              Once a year we check your rent against the real local market, with the evidence shown, the reasoning
              explained, and the final say a conversation, never a demand. Here&rsquo;s why we do it, and how our
              approach compares with the rest of the industry.
            </p>
            <div className="rr-hero-cta-row">
              <Link href="/rent-review/apply" className="rr-cta rr-cta--primary">
                Rent Review
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <a href="#why" className="rr-cta rr-cta--ghost">Why we do it</a>
            </div>
            <p className="rr-hero-note">For existing tenants · Takes a few minutes · Accept or discuss online</p>
          </div>
          <div className="rr-scroll-cue" aria-hidden>
            <span />
          </div>
        </div>

        {/* ── WHY WE DO REVIEWS ── */}
        <section id="why" className="rr-sec" style={{ background: '#f7f8fa' }}>
          <div className="rr-wrap">
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow">Why We Do It</div>
              <h2 className="hol-h2">Why we review the rent each year</h2>
              <p className="rr-lead">A rent review isn&rsquo;t about squeezing more out of your tenancy. Done properly, it protects the home you live in and the relationship we have with you.</p>
            </div>
            <div className="rr-why-grid">
              {WHY.map((item, i) => (
                <div key={item.title} className="rr-why-card hol-card hol-reveal" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="rr-why-icon">{item.icon}</div>
                  <h3 className="rr-why-title">{item.title}</h3>
                  <p className="rr-why-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE RESEARCH / STAT STRIP ── */}
        <section className="rr-sec rr-sec--dark">
          <div className="rr-glow-dark" aria-hidden />
          <div className="rr-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow" style={{ color: 'var(--price-green-bright)' }}>The Context</div>
              <h2 className="hol-h2" style={{ color: '#fff' }}>What the market tells us</h2>
              <p className="rr-lead" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Local rents move year to year with supply and demand. Reviewing regularly, and evidencing every figure,
                keeps things fair and predictable, instead of letting rent drift until a big correction is unavoidable.
              </p>
            </div>
            <div className="rr-stat-grid">
              {STATS.map((s, i) => (
                <div key={s.label} className="rr-stat hol-reveal" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="rr-stat-big">{s.big}<span className="rr-stat-small">{s.small}</span></div>
                  <div className="rr-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW OTHERS DO IT vs HOW WE DO IT ── */}
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
                    <li key={d}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW OUR REVIEW WORKS (timeline) ── */}
        <section className="rr-sec" style={{ background: '#f7f8fa' }}>
          <div className="rr-wrap">
            <div className="rr-head hol-reveal">
              <div className="hol-eyebrow">The Process</div>
              <h2 className="hol-h2">How your rent review works</h2>
              <p className="rr-lead">Four simple steps, all online, at your own pace.</p>
            </div>
            <div className="rr-timeline">
              {STEPS.map((s, i) => (
                <div key={s.n} className="rr-step hol-card hol-reveal" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="rr-step-n">{s.n}</div>
                  <h3 className="rr-step-title">{s.title}</h3>
                  <p className="rr-step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="rr-sec" style={{ background: '#fff' }}>
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}><polyline points="6 9 12 15 18 9" /></svg>
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
              Rent Review
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  .hol-eyebrow { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--logo-blue); margin-bottom:14px; font-family:'Poppins',sans-serif; }
  .hol-h2 { font-family:'Poppins',sans-serif; font-size:clamp(26px,3.6vw,42px); font-weight:700; color:#0f1f3d; line-height:1.2; margin:0; }

  .rr-wrap { max-width:1080px; margin:0 auto; }
  .rr-sec { padding:clamp(56px,8vw,104px) clamp(20px,6%,80px); position:relative; overflow:hidden; }
  .rr-head { text-align:center; margin-bottom:clamp(36px,5vw,54px); }
  .rr-lead { font-size:15.5px; color:#6b7280; max-width:620px; margin:16px auto 0; line-height:1.75; }

  /* HERO */
  .rr-hero { position:relative; overflow:hidden; text-align:center;
    background:#0b1a34;
    background-image:radial-gradient(ellipse at 72% 12%, rgba(37,99,235,0.30) 0%, transparent 55%), radial-gradient(ellipse at 12% 88%, rgba(37,99,235,0.16) 0%, transparent 52%);
    padding:calc(68px + clamp(64px,9vw,120px)) clamp(20px,5%,5%) clamp(72px,10vw,128px); }
  .rr-hero-glow { position:absolute; top:-30%; left:50%; width:min(760px,90%); height:520px; transform:translateX(-50%);
    background:radial-gradient(circle, rgba(74,144,217,0.28) 0%, transparent 65%); filter:blur(10px);
    animation:rr-float 9s ease-in-out infinite; pointer-events:none; }
  @keyframes rr-float { 0%,100%{transform:translateX(-50%) translateY(0);} 50%{transform:translateX(-50%) translateY(26px);} }
  .rr-hero-inner { position:relative; z-index:1; max-width:720px; margin:0 auto; animation:rr-hero-in .8s cubic-bezier(.22,1,.36,1) both; }
  @keyframes rr-hero-in { from{opacity:0; transform:translateY(20px);} to{opacity:1; transform:none;} }
  .rr-badge { display:inline-block; background:rgba(74,144,217,0.28); color:#9fc7fb; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; padding:6px 15px; border-radius:20px; margin-bottom:20px; border:1px solid rgba(147,197,253,0.35); }
  .rr-hero-h1 { font-size:clamp(32px,5vw,56px); font-weight:800; color:#fff; line-height:1.1; margin:0 0 18px; letter-spacing:-.01em; }
  .rr-hero-sub { font-size:16.5px; color:rgba(255,255,255,0.66); max-width:600px; margin:0 auto 34px; line-height:1.7; font-weight:300; }
  .rr-hero-cta-row { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  .rr-hero-note { font-size:12.5px; color:rgba(255,255,255,0.45); margin-top:18px; }

  .rr-cta { display:inline-flex; align-items:center; justify-content:center; gap:9px; box-sizing:border-box; min-height:50px; line-height:1.2; font-family:'Poppins',sans-serif; font-size:13.5px; font-weight:700; letter-spacing:.02em; text-transform:uppercase; padding:14px 30px; border-radius:10px; text-decoration:none; border:1.5px solid transparent; transition:background .2s,transform .2s,box-shadow .2s,border-color .2s; }
  .rr-cta--primary { background:#2563eb; color:#fff; box-shadow:0 10px 26px -10px rgba(37,99,235,.7); }
  .rr-cta--primary:hover { background:#1d4ed8; transform:translateY(-2px); box-shadow:0 16px 34px -12px rgba(37,99,235,.8); }
  .rr-cta--ghost { background:transparent; color:#dbe9ff; border-color:rgba(255,255,255,0.3); }
  .rr-cta--ghost:hover { border-color:rgba(255,255,255,0.6); transform:translateY(-2px); }
  .rr-cta--lg { min-height:56px; font-size:14px; padding:16px 40px; }

  .rr-scroll-cue { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); width:24px; height:38px; border:2px solid rgba(255,255,255,0.3); border-radius:14px; display:flex; justify-content:center; padding-top:7px; z-index:1; }
  .rr-scroll-cue span { width:4px; height:8px; border-radius:2px; background:rgba(255,255,255,0.6); animation:rr-scroll 1.5s ease-in-out infinite; }
  @keyframes rr-scroll { 0%{opacity:0; transform:translateY(-4px);} 50%{opacity:1;} 100%{opacity:0; transform:translateY(10px);} }
  @media(max-width:600px){ .rr-scroll-cue{display:none;} }

  /* WHY grid */
  .rr-why-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
  @media(max-width:860px){ .rr-why-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:560px){ .rr-why-grid{grid-template-columns:1fr;} }
  .rr-why-card { background:#fff; border:1px solid #eef0f5; border-radius:16px; padding:28px 24px; }
  .rr-why-icon { font-size:30px; line-height:1; margin-bottom:14px; }
  .rr-why-title { font-size:16.5px; font-weight:700; color:#0f1f3d; margin:0 0 8px; }
  .rr-why-desc { font-size:14px; color:#6b7280; line-height:1.7; margin:0; }

  /* DARK sections */
  .rr-sec--dark { background:#0f1f3d; }
  .rr-glow-dark { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 40%, rgba(37,99,235,0.16) 0%, transparent 68%); pointer-events:none; }
  .rr-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
  @media(max-width:760px){ .rr-stat-grid{grid-template-columns:1fr 1fr;} }
  .rr-stat { background:rgba(22,163,74,0.06); border:1px solid rgba(74,222,128,0.24); border-radius:16px; padding:26px 22px; text-align:center; transition:transform .25s,border-color .25s,background .25s,box-shadow .25s; }
  .rr-stat:hover { transform:translateY(-5px); border-color:rgba(74,222,128,0.55); background:rgba(22,163,74,0.10); box-shadow:0 18px 34px -22px rgba(22,163,74,0.6); }
  .rr-stat-big { font-size:clamp(34px,5vw,46px); font-weight:800; color:var(--price-green-bright); line-height:1; letter-spacing:-.02em; text-shadow:0 0 22px rgba(74,222,128,0.25); }
  .rr-stat-small { font-size:14px; font-weight:600; color:#86efac; margin-left:8px; letter-spacing:0; white-space:nowrap; }
  .rr-stat-label { font-size:12.5px; color:rgba(255,255,255,0.6); margin-top:12px; line-height:1.5; }

  /* COMPARE */
  .rr-compare { display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start; }
  @media(max-width:820px){ .rr-compare{grid-template-columns:1fr;} }
  .rr-compare-col { border:1px solid #eef0f5; border-radius:18px; padding:26px 24px; background:#fdfdff; box-shadow:0 4px 14px -6px rgba(15,31,61,0.10); }
  .rr-compare-col--us { border-color:#bcd6f7; background:linear-gradient(180deg,#f5f9ff 0%,#ffffff 100%); box-shadow:0 20px 44px -24px rgba(37,99,235,0.4); }
  .rr-compare-head { margin-bottom:18px; }
  .rr-compare-tag { display:inline-block; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#6b7280; background:#eef0f5; padding:4px 10px; border-radius:20px; margin-bottom:10px; }
  .rr-compare-tag--us { color:#fff; background:#2563eb; }
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
  .rr-diff-list svg { flex:none; color:var(--price-green); margin-top:1px; }

  /* TIMELINE */
  .rr-timeline { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
  @media(max-width:860px){ .rr-timeline{grid-template-columns:1fr 1fr;} }
  @media(max-width:520px){ .rr-timeline{grid-template-columns:1fr;} }
  .rr-step { background:#fff; border:1px solid #eef0f5; border-radius:16px; padding:26px 22px; }
  .rr-step-n { font-size:26px; font-weight:800; color:#2563eb; letter-spacing:-.02em; margin-bottom:12px; }
  .rr-step-title { font-size:16px; font-weight:700; color:#0f1f3d; margin:0 0 8px; }
  .rr-step-desc { font-size:13.5px; color:#6b7280; line-height:1.65; margin:0; }

  /* FAQ */
  .rr-faq-list { display:flex; flex-direction:column; gap:12px; }
  .rr-faq { border:1px solid #eef0f5; border-radius:12px; overflow:hidden; background:#fff; transition:border-color .2s,box-shadow .2s; }
  .rr-faq.open { border-color:#cfe0f7; box-shadow:0 10px 26px -16px rgba(37,99,235,0.3); }
  .rr-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; background:none; border:none; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; font-size:15px; font-weight:600; color:#0f1f3d; }
  .rr-faq-q svg { flex:none; color:#2563eb; }
  .rr-faq-a { overflow:hidden; transition:max-height .3s ease; }
  .rr-faq-a p { margin:0; padding:0 20px 18px; font-size:14px; color:#6b7280; line-height:1.75; }

  /* FINAL CTA */
  .rr-cta-band { text-align:center; }
  .rr-cta-title { font-size:clamp(26px,3.6vw,44px); font-weight:700; color:#fff; margin:0 0 16px; }
  .rr-cta-text { font-size:16px; color:rgba(255,255,255,0.6); max-width:520px; margin:0 auto 34px; line-height:1.7; font-weight:300; }

  /* Nothing on the page may push the body wider than the screen. */
  .rr-hero, .rr-sec { overflow-x:clip; }
  .rr-hero-h1, .rr-hero-sub, .rr-lead, .rr-why-desc, .rr-ind-item p, .rr-diff-list li,
  .rr-step-desc, .rr-faq-q, .rr-faq-a p, .rr-cta-text, .hol-h2 { overflow-wrap:break-word; }

  /* ── Phones ── */
  @media(max-width:600px){
    .rr-sec { padding:clamp(44px,11vw,60px) 18px; }
    .rr-hero { padding:calc(64px + 44px) 18px 64px; }
    .rr-hero-h1 { font-size:clamp(27px,8vw,34px); line-height:1.15; }
    .rr-hero-sub { font-size:15px; line-height:1.65; margin-bottom:28px; }
    .rr-head { margin-bottom:30px; }
    .rr-lead { font-size:14.5px; }
    /* Full-width, stacked buttons are easier to tap than a cramped row. */
    .rr-hero-cta-row { flex-direction:column; gap:10px; }
    .rr-hero-cta-row .rr-cta { width:100%; }
    .rr-cta--lg { width:100%; }
    .rr-why-card, .rr-compare-col, .rr-step { padding:20px 18px; }
    .rr-stat { padding:20px 14px; }
    .rr-stat-big { font-size:30px; }
    .rr-stat-small { font-size:13px; margin-left:6px; }
    .rr-stat-label { font-size:11.5px; }
    .rr-faq-q { padding:15px 16px; font-size:14.5px; }
    .rr-faq-a p { padding:0 16px 15px; }
  }
  /* ── Small phones: one stat per row so figures never crowd ── */
  @media(max-width:380px){
    .rr-stat-grid { grid-template-columns:1fr; }
  }
`;
