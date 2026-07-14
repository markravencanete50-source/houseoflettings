// app/pricing/[slug]/page.tsx
// Individual package detail page. One per bundle (5 total), reached from the
// pricing page and indexable in its own right. Redesigned layout: a two-column
// hero (copy + property photo card with a floating price chip), a 3-stat strip,
// then every included service shown as its own bordered card with an icon and a
// plain-English explanation (grouped by category), followed by what is not
// included, the other packages, and a closing CTA. Server component for SEO;
// styling lives in page.module.css (a CSS Module, so it survives the production
// build — an inline <style> in a Server Component gets hoisted away by React).
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';
import { MATRIX_SECTIONS, TOTAL_SERVICES } from '@/lib/pricingMatrix';
import { describeService } from '@/lib/serviceDescriptions';
import styles from './page.module.css';

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

/* ── Service icons ────────────────────────────────────────────────────────
   Each included service gets a line icon chosen by keyword from its label, so
   the card grid reads visually like the template rather than as a flat list.
   Order matters: more specific keywords are tested before generic ones. */
type IconKey =
  | 'camera' | 'layout' | 'chart' | 'megaphone' | 'eye' | 'chat' | 'userCheck'
  | 'shieldCheck' | 'shieldId' | 'doc' | 'users' | 'bolt' | 'key' | 'pound'
  | 'activity' | 'trend' | 'wrench' | 'alert' | 'clipboard' | 'umbrella'
  | 'refresh' | 'calendar' | 'check';

function iconKeyFor(label: string): IconKey {
  const l = label.toLowerCase();
  if (l.includes('photograph')) return 'camera';
  if (l.includes('floor plan')) return 'layout';
  if (l.includes('valuation')) return 'chart';
  if (l.includes('advertis') || l.includes('portal')) return 'megaphone';
  if (l.includes('viewing')) return 'eye';
  if (l.includes('feedback') || l.includes('negotiation') || l.includes('communication')) return 'chat';
  if (l.includes('enquiry') || l.includes('screening') || l.includes('application')) return 'userCheck';
  if (l.includes('compliance') || l.includes('gas safety') || l.includes('eicr') || l.includes('epc')) return 'shieldCheck';
  if (l.includes('right to rent') || l.includes('prescribed') || l.includes('registration')) return 'shieldId';
  if (l.includes('credit') || l.includes('affordability')) return 'chart';
  if (l.includes('reference') || l.includes('employment')) return 'doc';
  if (l.includes('guarantor') || l.includes('team') || l.includes('dedicated')) return 'users';
  if (l.includes('agreement')) return 'doc';
  if (l.includes('utility') || l.includes('council tax')) return 'bolt';
  if (l.includes('handover') || l.includes('demonstration') || l.includes('key holding')) return 'key';
  if (l.includes('rent collection') || l.includes('first month') || l.includes('holding deposit') || l.includes('transfer of funds') || l.includes('deposit')) return 'pound';
  if (l.includes('statement') || l.includes('summary') || l.includes('administration') || l.includes('reporting') || l.includes('report')) return 'doc';
  if (l.includes('arrears')) return 'alert';
  if (l.includes('monitoring')) return 'activity';
  if (l.includes('rent review') || l.includes('recovery')) return 'trend';
  if (l.includes('maintenance') || l.includes('repair') || l.includes('contractor') || l.includes('quotation')) return 'wrench';
  if (l.includes('emergency')) return 'alert';
  if (l.includes('inspection')) return 'clipboard';
  if (l.includes('legal') || l.includes('eviction') || l.includes('protection') || l.includes('guarantee') || l.includes('cover')) return 'umbrella';
  if (l.includes('priority')) return 'bolt';
  if (l.includes('continuation') || l.includes('re-marketing')) return 'refresh';
  if (l.includes('schedule') || l.includes('reminder')) return 'calendar';
  if (l.includes('verification') || l.includes('authorisation') || l.includes('assessment')) return 'clipboard';
  return 'check';
}

const ICON_PATHS: Record<IconKey, JSX.Element> = {
  camera: <><path d="M3 8h3l2-2h8l2 2h3v11H3z" /><circle cx="12" cy="13" r="3.4" /></>,
  layout: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l3-3 3 2 5-6" /></>,
  megaphone: <><path d="M3 11v2l14 5V6L3 11z" /><path d="M17 8.5a3.5 3.5 0 010 7" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  chat: <><path d="M4 5h16v11H8l-4 4z" /></>,
  userCheck: <><circle cx="9" cy="8" r="3.4" /><path d="M3 20a6 6 0 0112 0" /><path d="M15.5 12.5l2 2 4-4" /></>,
  shieldCheck: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 5-5" /></>,
  shieldId: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><circle cx="12" cy="10" r="1.9" /><path d="M8.5 16a3.5 3.5 0 017 0" /></>,
  doc: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4" /><path d="M9 13h6M9 17h4" /></>,
  users: <><circle cx="8" cy="9" r="3" /><path d="M2 20a6 6 0 0112 0" /><path d="M16 6.2a3 3 0 010 5.6M22 20a6 6 0 00-6-6" /></>,
  bolt: <><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></>,
  key: <><circle cx="8" cy="8" r="4" /><path d="M11 11l9 9M17 17l2-2M14.5 19.5l2-2" /></>,
  pound: <><circle cx="12" cy="12" r="9" /><path d="M9.5 16.5h5M9 12.5h4.5M13.7 8.4a2.5 2.5 0 00-4.2 1.8c0 3-1 4.6-1.3 4.9" /></>,
  activity: <><path d="M3 12h4l2 6 4-12 2 6h6" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  wrench: <><path d="M21 4a5 5 0 01-6.5 6.5L6 19a2.1 2.1 0 01-3-3l8.5-8.5A5 5 0 0116 4h5z" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9.5 4V3h5v1" /><path d="M9 12l2 2 4-4" /></>,
  umbrella: <><path d="M12 3v2M3 12a9 9 0 0118 0z M12 12v6.5a2 2 0 01-4 0" /></>,
  refresh: <><path d="M20.5 11a8.5 8.5 0 10-2 6" /><path d="M20.5 4.5V11H14" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
};

function ServiceIcon({ label }: { label: string }) {
  return (
    <span className={styles.cardIcon} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[iconKeyFor(label)]}
      </svg>
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
    total: s.rows.length,
    included: s.rows.filter((r) => !!r[idx + 1]).map((r) => r[0] as string),
    excluded: s.rows.filter((r) => !r[idx + 1]).map((r) => r[0] as string),
  }));
  const totalIncluded = sections.reduce((n, s) => n + s.included.length, 0);
  const excludedAll = sections.flatMap((s) => s.excluded);
  const withServices = sections.filter((s) => s.included.length > 0);

  return (
    <>
      <Navbar />

      <div className={styles.page}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className={`${styles.hero}${isHot ? ` ${styles.heroHot}` : ''}`}>
          <span className={styles.orb} aria-hidden />
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              {/* Copy */}
              <div className={styles.heroText}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                  <Link href="/">Home</Link>
                  <span className={styles.sep}>/</span>
                  <Link href="/pricing">Pricing</Link>
                  <span className={styles.sep}>/</span>
                  <span className={styles.here}>{bundle.label}</span>
                </nav>
                <div className={styles.eyebrow}>
                  {bundle.kind}
                  {bundle.badge && <span className={styles.pop}>Most Popular</span>}
                </div>
                <h1 className={styles.title}>{bundle.label}</h1>
                <p className={styles.best}>Best for {bundle.bestForLead} {bundle.bestForRest}.</p>

                <div className={styles.priceRow}>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>One-time</span>
                    <span className={styles.priceVal}>{bundle.setupFee}</span>
                  </div>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>Ongoing</span>
                    <span className={styles.priceVal}>
                      {bundle.mgmtFee ? <>{bundle.mgmtFee}<small>of rent</small></> : 'None'}
                    </span>
                  </div>
                </div>

                <div className={styles.cta}>
                  <Link href="/book-valuation" className={`${styles.btn} ${styles.btnSolid}`}>Book a free valuation</Link>
                  <Link href="/landlord-registration" className={`${styles.btn} ${styles.btnGhost}`}>Get started</Link>
                </div>
              </div>

              {/* Property photo card */}
              <div className={styles.heroMedia}>
                <div className={styles.heroImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.heroImg}
                    src="/images/heropage.webp"
                    alt="Landlord handing keys to a happy new tenant"
                    loading="eager"
                  />
                </div>
                <div className={styles.priceFloat}>
                  <span className={styles.priceFloatLabel}>From</span>
                  <span className={styles.priceFloatVal}>{bundle.setupFee}</span>
                  <span className={styles.priceFloatSub}>{bundle.ongoing} · inc. VAT</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat strip (overlaps hero) ───────────────────── */}
        <div className={styles.container}>
          <div className={styles.statsWrap}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statK}>{bundle.setupFee}</span>
                <span className={styles.statV}>One-time setup fee</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statK}>
                  {bundle.mgmtFee ? <>{bundle.mgmtFee} <small>of rent</small></> : '£0'}
                </span>
                <span className={styles.statV}>{bundle.mgmtFee ? 'Ongoing, on rent collected' : 'No ongoing fee'}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statK}>{totalIncluded}<small> / {TOTAL_SERVICES}</small></span>
                <span className={styles.statV}>Services included</span>
              </div>
            </div>
            <p className={styles.statTrust}>
              <span><b>✓</b> Inclusive of VAT</span>
              <span><b>✓</b> No hidden fees</span>
              <span><b>✓</b> Leeds &amp; Manchester</span>
            </p>
          </div>
        </div>

        {/* ── Included services, as bordered cards by category ─ */}
        <div className={styles.container}>
          <section className={styles.svc}>
            <div className={styles.svcHead}>
              <span className={styles.svcEyebrow}>What&apos;s included</span>
              <h2 className={styles.svcTitle}>Everything in {bundle.label}, explained</h2>
              <p className={styles.svcIntro}>{bundle.blurb}</p>
            </div>

            {withServices.map((s, i) => (
              <div key={s.title} className={styles.cat}>
                <div className={styles.catHead}>
                  <span className={styles.catNum}>{i + 1}</span>
                  <h3 className={styles.catTitle}>{s.title}</h3>
                  <span className={styles.catCount}>{s.included.length} included</span>
                </div>
                <div className={styles.cards}>
                  {s.included.map((label) => (
                    <article key={label} className={styles.card}>
                      <ServiceIcon label={label} />
                      <h4 className={styles.cardTitle}>{label}</h4>
                      <p className={styles.cardDesc}>{describeService(label)}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* ── Not included ─────────────────────────────────── */}
        {excludedAll.length > 0 && (
          <div className={styles.container}>
            <div className={styles.notWrap}>
              <div className={styles.not}>
                <h2 className={styles.notHead}>Not included in this package</h2>
                <p className={styles.notSub}>Want any of these? Compare packages or move up a tier at any time, with no re-setup charge.</p>
                <div className={styles.chips}>
                  {excludedAll.map((label) => (
                    <span key={label} className={styles.chip}>{label}</span>
                  ))}
                </div>
                <Link href="/pricing#compare" className={styles.upgrade}>Compare all packages →</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Other packages ───────────────────────────────── */}
        <div className={styles.container}>
          <section className={styles.others}>
            <h2 className={styles.othersHead}>Explore the other packages</h2>
            <div className={styles.othersGrid}>
              {BUNDLES.map((b) => {
                const current = b.id === bundle.id;
                return (
                  <Link
                    key={b.id}
                    href={`/pricing/${b.id}`}
                    className={`${styles.other}${current ? ` ${styles.otherCurrent}` : ''}`}
                    aria-current={current ? 'page' : undefined}
                  >
                    <span className={styles.otherKind}>{b.kind}</span>
                    <span className={styles.otherName}>{b.label}</span>
                    <span className={styles.otherFee}>{b.setupFee}{b.mgmtFee ? ` + ${b.mgmtFee}` : ''}</span>
                    {current && <span className={styles.otherBadge}>You are here</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Closing CTA band ─────────────────────────────── */}
        <section className={styles.ctaBand}>
          <div className={styles.container}>
            <div className={styles.ctaInner}>
              <div>
                <h2 className={styles.ctaHead}>Ready to get started with {bundle.label}?</h2>
                <p className={styles.ctaSub}>Book a free, no-obligation valuation and we&apos;ll confirm the right setup for your property across Leeds and Manchester.</p>
              </div>
              <div className={styles.ctaBtns}>
                <Link href="/book-valuation" className={`${styles.ctaBtn} ${styles.ctaBtnSolid}`}>Book a free valuation</Link>
                <Link href="/landlord-registration" className={`${styles.ctaBtn} ${styles.ctaBtnGhost}`}>Register as a landlord</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
