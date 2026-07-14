// components/layout/ServiceHero.tsx
// Shared two-column hero for the service landing pages (landlords, tenants,
// property management, additional services) and, by extension, the pricing
// pages. Copy + CTAs on the left, a property photo card with a floating chip on
// the right. Data-in-props so each page keeps its own copy and imagery while the
// layout stays identical across the site. No hooks, so it renders happily inside
// the existing client-component pages.
import Link from 'next/link';
import styles from './ServiceHero.module.css';

type Cta = { label: string; href: string; variant?: 'solid' | 'ghost' };

export type ServiceHeroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  note?: string;                       // small secondary line under the subtitle
  image: string;
  imageAlt: string;
  ctas?: Cta[];
  stats?: { value: React.ReactNode; label: string }[];   // e.g. hero stat strip
  trust?: string[];                    // e.g. ✓ Leeds & Manchester
  float?: { label: string; value: string; sub?: string };
};

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function ServiceHero({
  eyebrow, title, subtitle, note, image, imageAlt, ctas = [], stats, trust, float,
}: ServiceHeroProps) {
  return (
    <section className={styles.hero}>
      <span className={styles.orb} aria-hidden />
      <div className={styles.grid}>
        {/* Copy */}
        <div className={styles.text}>
          {eyebrow && (
            <span className={styles.eyebrow}>
              <span className={styles.dot} aria-hidden />
              {eyebrow}
            </span>
          )}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
          {note && <p className={styles.note}>{note}</p>}

          {ctas.length > 0 && (
            <div className={styles.cta}>
              {ctas.map((c, i) => {
                const cls = `${styles.btn} ${c.variant === 'ghost' ? styles.btnGhost : styles.btnSolid}`;
                const solid = c.variant !== 'ghost';
                return (
                  <Link key={c.href + i} href={c.href} className={cls}>
                    {c.label}{solid && <Arrow />}
                  </Link>
                );
              })}
            </div>
          )}

          {stats && stats.length > 0 && (
            <div className={styles.stats}>
              {stats.map((s) => (
                <div key={s.label} className={styles.stat}>
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {trust && trust.length > 0 && (
            <div className={styles.trust}>
              {trust.map((t) => (
                <span key={t}><b>✓</b>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Property photo card */}
        <div className={styles.media}>
          <div className={styles.imgWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.img} src={image} alt={imageAlt} loading="eager" />
          </div>
          {float && (
            <div className={styles.float}>
              <span className={styles.floatLabel}>{float.label}</span>
              <span className={styles.floatVal}>{float.value}</span>
              {float.sub && <span className={styles.floatSub}>{float.sub}</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
