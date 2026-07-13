// app/pricing/[slug]/page.tsx
// Individual package detail page. One per bundle (5 total), reached from the
// mobile pricing card's "See all services included" link and indexable in its
// own right. Lists every service in the package, grouped by category, each with
// a plain-English explanation, what is not included, and links to the other
// packages. Server component for SEO; styling lives in page.module.css (a CSS
// Module, so it survives the production build — inline <style> in a Server
// Component gets hoisted away by React).
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

function Tick() {
  return (
    <span className={styles.tick} aria-hidden>
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
        {/* Hero */}
        <section className={`${styles.hero}${isHot ? ` ${styles.heroHot}` : ''}`}>
          <span className={styles.orb} aria-hidden />
          <div className={styles.container}>
            <div className={styles.heroInner}>
              <nav className={styles.crumbs} aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span className={styles.sep}>/</span>
                <Link href="/pricing">Pricing</Link>
                <span className={styles.sep}>/</span>
                <span className={styles.here}>{bundle.label}</span>
              </nav>
              <div className={styles.eyebrow}>{bundle.kind}{bundle.badge ? ' · Most Popular' : ''}</div>
              <h1 className={styles.title}>{bundle.label}</h1>
              <p className={styles.best}>Best for {bundle.bestForLead} {bundle.bestForRest}.</p>
              <div className={styles.priceCard}>
                <div className={styles.priceCell}>
                  <span className={styles.priceLabel}>One-time</span>
                  <span className={styles.priceVal}>{bundle.setupFee}</span>
                </div>
                <div className={styles.priceCell}>
                  <span className={styles.priceLabel}>Ongoing</span>
                  <span className={styles.priceVal}>{bundle.mgmtFee ? `${bundle.mgmtFee}` : 'None'}</span>
                </div>
              </div>
              <div className={styles.cta}>
                <Link href="/landlord-registration" className={`${styles.btn} ${styles.btnSolid}`}>Get started</Link>
                <Link href="/book-valuation" className={`${styles.btn} ${styles.btnGhost}`}>Book a valuation</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage band */}
        <div className={styles.container}>
          <div className={styles.coverWrap}>
            <div className={styles.cover}>
              <div className={styles.coverTop}>
                <b>{totalIncluded} of {TOTAL_SERVICES} services included</b>
                <span>All prices inclusive of VAT</span>
              </div>
              <div className={styles.coverChips}>
                {sections.map((s) => (
                  <span key={s.title} className={`${styles.coverChip}${s.included.length === 0 ? ` ${styles.zero}` : ''}`}>
                    {s.title} <b>{s.included.length}/{s.total}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Included services, grouped and numbered */}
        <div className={styles.container}>
          <div className={styles.body}>
            <p className={styles.blurb}>{bundle.blurb}</p>

            {withServices.map((s, i) => (
              <section key={s.title} className={styles.section}>
                <div className={styles.sectionHead}>
                  <span className={styles.sectionNum}>{i + 1}</span>
                  <h2 className={styles.sectionTitle}>{s.title}</h2>
                  <span className={styles.sectionCount}>{s.included.length} included</span>
                </div>
                <div className={styles.list}>
                  {s.included.map((label) => (
                    <div key={label} className={styles.item}>
                      <Tick />
                      <div>
                        <h3 className={styles.itemTitle}>{label}</h3>
                        <p className={styles.itemDesc}>{describeService(label)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Not included */}
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

        {/* Other packages */}
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
      </div>

      <Footer />
    </>
  );
}
