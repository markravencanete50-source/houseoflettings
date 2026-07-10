// components/layout/Footer.tsx
// Shared site footer: brand + tagline, full sitemap grouped by audience, and
// company contact details. Used across every page so the bottom of the site
// always links to everything we offer.
import Link from 'next/link';

type FooterLink = { href: string; label: string };

const LANDLORD_LINKS: FooterLink[] = [
  { href: '/pricing', label: 'Pricing & Packages' },
  { href: '/additional-services', label: 'Additional Services' },
  { href: '/book-valuation', label: 'Book a Valuation' },
  { href: '/instant-valuation', label: 'Instant Valuation' },
  { href: '/landlord-registration', label: 'Landlord Registration' },
];

const TENANT_LINKS: FooterLink[] = [
  { href: '/listings', label: 'Browse Properties' },
  { href: '/tenant-application', label: 'Tenant Application' },
  { href: '/guarantor', label: 'Guarantor Form' },
  { href: '/maintenance', label: 'Report Maintenance' },
];

const COMPANY_LINKS: FooterLink[] = [
  { href: '/', label: 'Home' },
  { href: '/branches', label: 'Branches' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="hol-ft">
      <div className="hol-ft__inner">
        {/* Brand + tagline + contact */}
        <div className="hol-ft__brand">
          <div className="hol-ft__logo">
            <span className="hol-ft__dot" aria-hidden />
            House of Lettings
          </div>
          <p className="hol-ft__tag">
            Professional lettings and property management across Leeds and Manchester.
            Straight-talking service for landlords and tenants.
          </p>
          <div className="hol-ft__contact">
            <a href="mailto:info@houseoflettings.co.uk" className="hol-ft__contact-line">info@houseoflettings.co.uk</a>
            <a href="tel:+441617681758" className="hol-ft__contact-line">0161 768 1758</a>
            <span className="hol-ft__contact-line hol-ft__muted">Peter House, Oxford Street, Manchester</span>
            <span className="hol-ft__contact-line hol-ft__muted">199 Roundhay Rd, Harehills, Leeds LS8 5PL</span>
          </div>
        </div>

        {/* Sitemap columns */}
        <nav className="hol-ft__cols" aria-label="Footer">
          <div className="hol-ft__col">
            <div className="hol-ft__col-head">For Landlords</div>
            {LANDLORD_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hol-ft__link">{l.label}</Link>
            ))}
          </div>
          <div className="hol-ft__col">
            <div className="hol-ft__col-head">For Tenants</div>
            {TENANT_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hol-ft__link">{l.label}</Link>
            ))}
          </div>
          <div className="hol-ft__col">
            <div className="hol-ft__col-head">Company</div>
            {COMPANY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hol-ft__link">{l.label}</Link>
            ))}
          </div>
          <div className="hol-ft__col">
            <div className="hol-ft__col-head">Get Started</div>
            <Link href="/book-valuation" className="hol-ft__cta">Book a valuation →</Link>
            <Link href="/additional-services" className="hol-ft__link">Order a service</Link>
            <Link href="/listings" className="hol-ft__link">Find a home to rent</Link>
          </div>
        </nav>
      </div>

      <div className="hol-ft__bar">
        <span>© {year} House of Lettings Ltd. All rights reserved.</span>
        <span className="hol-ft__muted">Leeds &amp; Manchester</span>
      </div>

      <style>{`
        .hol-ft {
          background: #050a12;
          border-top: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          font-family: 'Poppins', sans-serif;
        }
        .hol-ft__inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(48px, 6vw, 72px) 5% clamp(32px, 4vw, 48px);
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(0, 2fr);
          gap: clamp(32px, 5vw, 72px);
        }
        .hol-ft__logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 21px; font-weight: 700; color: #fff;
        }
        .hol-ft__dot {
          width: 7px; height: 7px; background: #2563eb; border-radius: 50%;
          display: inline-block; flex-shrink: 0;
        }
        .hol-ft__tag {
          margin: 16px 0 20px;
          font-size: 13.5px; line-height: 1.7;
          color: rgba(255,255,255,0.55);
          max-width: 360px;
        }
        .hol-ft__contact { display: flex; flex-direction: column; gap: 6px; }
        .hol-ft__contact-line {
          font-size: 13px; color: rgba(255,255,255,0.72);
          text-decoration: none; line-height: 1.5;
        }
        a.hol-ft__contact-line:hover { color: #fff; }
        .hol-ft__muted { color: rgba(255,255,255,0.4); }
        .hol-ft__cols {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
        }
        .hol-ft__col { display: flex; flex-direction: column; }
        .hol-ft__col-head {
          font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(255,255,255,0.45);
          margin-bottom: 16px;
        }
        .hol-ft__link {
          font-size: 13.5px; color: rgba(255,255,255,0.72);
          text-decoration: none; padding: 6px 0; line-height: 1.4;
        }
        .hol-ft__link:hover { color: #fff; }
        .hol-ft__cta {
          font-size: 13.5px; font-weight: 600; color: #60a5fa;
          text-decoration: none; padding: 6px 0; line-height: 1.4;
        }
        .hol-ft__cta:hover { color: #93c5fd; }
        .hol-ft__bar {
          max-width: 1240px; margin: 0 auto;
          padding: 20px 5%;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
          font-size: 12.5px; color: rgba(255,255,255,0.4);
        }
        @media (max-width: 860px) {
          .hol-ft__inner { grid-template-columns: 1fr; gap: 36px; }
          .hol-ft__cols { grid-template-columns: 1fr 1fr; gap: 24px; }
        }
        @media (max-width: 460px) {
          .hol-ft__cols { grid-template-columns: 1fr; gap: 28px; }
        }
      `}</style>
    </footer>
  );
}
