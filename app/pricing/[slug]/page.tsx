// app/pricing/[slug]/page.tsx
// Individual package detail page. One per bundle (5 total), reached from the
// mobile pricing card's "See all services included" link and indexable in its
// own right. Lists every service in the package, grouped by category, each with
// a plain-English explanation, plus what is not included and links to the
// other packages. Server component for SEO; the pricing/layout.tsx shell adds
// the shared JSON-LD.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';
import { MATRIX_SECTIONS, TOTAL_SERVICES } from '@/lib/pricingMatrix';
import { describeService } from '@/lib/serviceDescriptions';

export function generateStaticParams() {
  return BUNDLES.map((b) => ({ slug: b.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = BUNDLES.find((x) => x.id === params.slug);
  if (!b) return { title: 'Package not found | House of Lettings' };
  const price = b.mgmtFee
    ? `${b.setupFee} one-time then ${b.mgmtFee} of rent`
    : `${b.setupFee} one-time, no ongoing fee`;
  return {
    title: `${b.label} | Landlord Package | House of Lettings`,
    description: `${b.label}: ${price}, inclusive of VAT. See every service included and what each one means for landlords in Leeds and Manchester.`,
    alternates: { canonical: `/pricing/${b.id}` },
  };
}

// Small inline icons so the page stays self-contained.
function Tick() {
  return (
    <span className="svc-tick" aria-hidden>
      <svg viewBox="0 0 24 24"><polyline points="4 13 10 19 20 6" /></svg>
    </span>
  );
}

export default function PackageDetailPage({ params }: { params: { slug: string } }) {
  const idx = BUNDLES.findIndex((b) => b.id === params.slug);
  if (idx === -1) notFound();
  const bundle = BUNDLES[idx];
  const isHot = !!bundle.badge;

  // Split every service into included / not included for this tier.
  const sections = MATRIX_SECTIONS.map((s) => ({
    title: s.title,
    included: s.rows.filter((r) => !!r[idx + 1]).map((r) => r[0] as string),
    excluded: s.rows.filter((r) => !r[idx + 1]).map((r) => r[0] as string),
  }));
  const totalIncluded = sections.reduce((n, s) => n + s.included.length, 0);
  const excludedAll = sections.flatMap((s) => s.excluded);

  return (
    <>
      <Navbar />

      <style>{`
        .svc-scope, .svc-scope * { font-family:'Poppins',sans-serif; box-sizing:border-box; }

        /* Hero */
        .svc-hero { position:relative; overflow:hidden; color:#fff;
          background:linear-gradient(160deg,#15294c 0%,#0c1a33 60%,#0f1f3d 100%);
          padding:clamp(120px,15vw,170px) 5% clamp(52px,7vw,74px); }
        .svc-hero--hot { background:linear-gradient(160deg,#2563eb 0%,#12295a 55%,#0c1a33 100%); }
        .svc-hero-orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(2px);
          width:280px; height:280px; top:-90px; right:-70px;
          background:radial-gradient(circle, rgba(74,144,217,.35) 0%, transparent 70%); }
        .svc-hero-in { position:relative; z-index:1; max-width:760px; margin:0 auto; text-align:center; }
        .svc-back { display:inline-flex; align-items:center; gap:7px; color:#a9c4ea; text-decoration:none;
          font-size:13px; font-weight:600; margin-bottom:22px; }
        .svc-back:hover { color:#fff; }
        .svc-kind { display:inline-block; font-size:12px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:#a9c4ea; margin-bottom:12px; }
        .svc-hero h1 { font-size:clamp(30px,4.4vw,50px); font-weight:800; line-height:1.12; margin:0 0 14px; }
        .svc-best { font-size:15px; color:#c7d7f2; line-height:1.6; margin:0 auto 26px; max-width:540px; }
        .svc-price { display:inline-flex; align-items:baseline; gap:10px; flex-wrap:wrap; justify-content:center; }
        .svc-price .fee { font-size:clamp(34px,5vw,46px); font-weight:800; letter-spacing:-.02em; line-height:1; }
        .svc-price .per { font-size:13px; font-weight:500; color:#a9c4ea; }
        .svc-ongoing { font-size:14px; font-weight:700; color:#7db4f0; margin-top:8px; }
        .svc-ongoing.none { color:#8fa6c9; font-weight:600; }
        .svc-cta { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:30px; }
        .svc-btn { display:inline-block; padding:14px 30px; border-radius:8px; font-size:13.5px; font-weight:700;
          letter-spacing:.02em; text-transform:uppercase; text-decoration:none; transition:all .18s ease; }
        .svc-btn--solid { background:#fff; color:#0f1f3d; }
        .svc-btn--solid:hover { background:#e8f0fb; }
        .svc-btn--ghost { background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,.4); }
        .svc-btn--ghost:hover { border-color:#fff; }

        /* Summary bar */
        .svc-summary { max-width:900px; margin:0 auto; padding:0 5%; }
        .svc-summary-in { margin-top:-26px; position:relative; z-index:2; background:#fff; border:1px solid #e5e7eb;
          border-radius:14px; box-shadow:0 18px 40px -24px rgba(15,31,61,.34);
          padding:16px 22px; display:flex; align-items:center; justify-content:center; gap:10px; text-align:center; }
        .svc-summary-in b { color:#0f1f3d; font-size:15px; font-weight:800; }
        .svc-summary-in span { color:#6b7280; font-size:13.5px; }

        /* Sections */
        .svc-wrap { max-width:900px; margin:0 auto; padding:clamp(40px,6vw,64px) 5% 0; }
        .svc-blurb { font-size:16px; color:#4b5563; line-height:1.8; text-align:center; max-width:680px;
          margin:0 auto clamp(36px,5vw,52px); }
        .svc-sec { margin-bottom:clamp(34px,5vw,48px); }
        .svc-sec-head { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .svc-sec-head h2 { font-size:clamp(19px,2.4vw,24px); font-weight:800; color:#0f1f3d; margin:0; }
        .svc-sec-count { flex:none; background:#e8f0fb; color:#2563eb; font-size:12px; font-weight:800;
          border-radius:999px; padding:4px 12px; }
        .svc-list { display:grid; gap:12px; }
        .svc-item { display:flex; gap:14px; background:#fff; border:1px solid #eef1f5; border-radius:12px;
          padding:16px 18px; transition:border-color .18s ease, box-shadow .18s ease; }
        .svc-item:hover { border-color:#cfe0f7; box-shadow:0 12px 26px -20px rgba(15,31,61,.4); }
        .svc-tick { flex:none; width:26px; height:26px; border-radius:50%; background:#e7f6ee; margin-top:1px;
          display:inline-flex; align-items:center; justify-content:center; }
        .svc-tick svg { width:14px; height:14px; stroke:#16a34a; stroke-width:3; fill:none; stroke-linecap:round; stroke-linejoin:round; }
        .svc-item h3 { font-size:15px; font-weight:700; color:#0f1f3d; margin:0 0 4px; line-height:1.35; }
        .svc-item p { font-size:13.5px; color:#6b7280; line-height:1.6; margin:0; }

        /* Not included */
        .svc-not { max-width:900px; margin:0 auto; padding:clamp(20px,3vw,28px) 5% 0; }
        .svc-not-in { background:#f7f8fa; border:1px solid #e9edf2; border-radius:14px; padding:24px 24px 22px; }
        .svc-not-in h2 { font-size:15px; font-weight:800; color:#0f1f3d; margin:0 0 6px; }
        .svc-not-in p { font-size:13px; color:#6b7280; margin:0 0 16px; line-height:1.6; }
        .svc-not-list { display:flex; flex-wrap:wrap; gap:8px; }
        .svc-chip { font-size:12.5px; color:#8a94a3; background:#fff; border:1px solid #e5e9f0;
          border-radius:999px; padding:6px 12px; }
        .svc-upgrade { display:inline-block; margin-top:16px; font-size:13px; font-weight:700; color:#2563eb;
          text-decoration:none; }
        .svc-upgrade:hover { text-decoration:underline; }

        /* Other packages */
        .svc-others { max-width:1000px; margin:0 auto; padding:clamp(48px,7vw,72px) 5% clamp(60px,8vw,90px); }
        .svc-others h2 { text-align:center; font-size:clamp(20px,3vw,28px); font-weight:800; color:#0f1f3d; margin:0 0 28px; }
        .svc-others-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; }
        .svc-other { display:block; text-decoration:none; background:#fff; border:1.5px solid #e5e7eb;
          border-radius:12px; padding:18px; transition:border-color .18s ease, transform .18s ease; }
        .svc-other:hover { border-color:#2563eb; transform:translateY(-3px); }
        .svc-other .k { font-size:10.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#8b96a5; }
        .svc-other .n { display:block; font-size:15.5px; font-weight:800; color:#0f1f3d; margin:5px 0 8px; line-height:1.25; }
        .svc-other .f { font-size:13px; font-weight:700; color:#2563eb; }
        .svc-other--current { border-color:#2563eb; background:#f4f8ff; }
        .svc-other--current .badge { display:inline-block; margin-top:8px; font-size:10.5px; font-weight:800;
          letter-spacing:.08em; text-transform:uppercase; color:#2563eb; }
      `}</style>

      <div className="svc-scope">
        {/* Hero */}
        <section className={`svc-hero${isHot ? ' svc-hero--hot' : ''}`}>
          <span className="svc-hero-orb" aria-hidden />
          <div className="svc-hero-in">
            <Link href="/pricing" className="svc-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              All packages
            </Link>
            <div className="svc-kind">{bundle.kind}{bundle.badge ? ' · Most Popular' : ''}</div>
            <h1>{bundle.label}</h1>
            <p className="svc-best">Best for {bundle.bestForLead} {bundle.bestForRest}.</p>
            <div className="svc-price">
              <span className="fee">{bundle.setupFee}</span>
              <span className="per">one-time · inc. VAT</span>
            </div>
            <div className={`svc-ongoing${bundle.mgmtFee ? '' : ' none'}`}>{bundle.ongoing}</div>
            <div className="svc-cta">
              <Link href="/landlord-registration" className="svc-btn svc-btn--solid">Get started</Link>
              <Link href="/book-valuation" className="svc-btn svc-btn--ghost">Book a valuation</Link>
            </div>
          </div>
        </section>

        {/* Summary */}
        <div className="svc-summary">
          <div className="svc-summary-in">
            <b>{totalIncluded} of {TOTAL_SERVICES} services included</b>
            <span>· everything below is covered in this package</span>
          </div>
        </div>

        {/* Included services, grouped */}
        <div className="svc-wrap">
          <p className="svc-blurb">{bundle.blurb}</p>

          {sections.map((s) =>
            s.included.length === 0 ? null : (
              <section key={s.title} className="svc-sec">
                <div className="svc-sec-head">
                  <h2>{s.title}</h2>
                  <span className="svc-sec-count">{s.included.length} included</span>
                </div>
                <div className="svc-list">
                  {s.included.map((label) => (
                    <div key={label} className="svc-item">
                      <Tick />
                      <div>
                        <h3>{label}</h3>
                        <p>{describeService(label)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          )}
        </div>

        {/* Not included (transparency + upsell) */}
        {excludedAll.length > 0 && (
          <div className="svc-not">
            <div className="svc-not-in">
              <h2>Not included in this package</h2>
              <p>Want any of these? Compare packages or move up a tier at any time, with no re-setup charge.</p>
              <div className="svc-not-list">
                {excludedAll.map((label) => (
                  <span key={label} className="svc-chip">{label}</span>
                ))}
              </div>
              <Link href="/pricing#compare" className="svc-upgrade">Compare all packages →</Link>
            </div>
          </div>
        )}

        {/* Other packages */}
        <section className="svc-others">
          <h2>Explore the other packages</h2>
          <div className="svc-others-grid">
            {BUNDLES.map((b) => {
              const current = b.id === bundle.id;
              return (
                <Link
                  key={b.id}
                  href={`/pricing/${b.id}`}
                  className={`svc-other${current ? ' svc-other--current' : ''}`}
                  aria-current={current ? 'page' : undefined}
                >
                  <span className="k">{b.kind}</span>
                  <span className="n">{b.label}</span>
                  <span className="f">{b.setupFee}{b.mgmtFee ? ` + ${b.mgmtFee}` : ''}</span>
                  {current && <span className="badge">You are here</span>}
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
