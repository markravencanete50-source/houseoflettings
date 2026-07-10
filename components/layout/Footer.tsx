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

function Column({ head, links }: { head: string; links: FooterLink[] }) {
  return (
    <div className="hol-ft__col">
      <div className="hol-ft__col-head">{head}</div>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="hol-ft__link">{l.label}</Link>
      ))}
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="hol-ft">
      <div className="hol-ft__glow" aria-hidden />
      <div className="hol-ft__inner">
        {/* Brand + tagline + contact */}
        <div className="hol-ft__brand">
          <div className="hol-ft__logo">
            <span className="hol-ft__mark" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
                <path d="M10 21v-6h4v6" />
              </svg>
            </span>
            <span className="hol-ft__word">
              House of Lettings
              <span className="hol-ft__word-sub">Leeds &amp; Manchester</span>
            </span>
          </div>

          <p className="hol-ft__tag">
            Professional lettings and property management across Leeds and Manchester.
            Straight-talking service for landlords and tenants.
          </p>

          <div className="hol-ft__contact">
            <a href="mailto:info@houseoflettings.co.uk" className="hol-ft__contact-line">
              <svg className="hol-ft__ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              info@houseoflettings.co.uk
            </a>
            <a href="tel:+441617681758" className="hol-ft__contact-line">
              <svg className="hol-ft__ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>
              0161 768 1758
            </a>
            <span className="hol-ft__contact-line hol-ft__muted">
              <svg className="hol-ft__ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              Peter House, Oxford Street, Manchester
            </span>
            <span className="hol-ft__contact-line hol-ft__muted hol-ft__contact-indent">
              199 Roundhay Rd, Harehills, Leeds LS8 5PL
            </span>
          </div>
        </div>

        {/* Sitemap columns */}
        <nav className="hol-ft__cols" aria-label="Footer">
          <Column head="For Landlords" links={LANDLORD_LINKS} />
          <Column head="For Tenants" links={TENANT_LINKS} />
          <Column head="Company" links={COMPANY_LINKS} />
          <div className="hol-ft__col">
            <div className="hol-ft__col-head">Get Started</div>
            <Link href="/book-valuation" className="hol-ft__cta">
              Book a valuation
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <Link href="/additional-services" className="hol-ft__link">Order a service</Link>
            <Link href="/listings" className="hol-ft__link">Find a home to rent</Link>
          </div>
        </nav>
      </div>

      <div className="hol-ft__bar">
        <span>© {year} House of Lettings Ltd. All rights reserved.</span>
        <div className="hol-ft__bar-links">
          <Link href="/terms" className="hol-ft__bar-link">Terms</Link>
          <span className="hol-ft__dotsep" aria-hidden>·</span>
          <Link href="/cookie-policy" className="hol-ft__bar-link">Cookie Policy</Link>
          <span className="hol-ft__dotsep" aria-hidden>·</span>
          <span className="hol-ft__muted">Leeds &amp; Manchester</span>
        </div>
      </div>

      <style>{`
        .hol-ft {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(1200px 380px at 82% -10%, rgba(37,99,235,0.16), transparent 60%),
            linear-gradient(180deg, #0b1a35 0%, #070d1c 62%, #050a14 100%);
          border-top: 1px solid rgba(96,165,250,0.22);
          box-shadow: inset 0 3px 0 0 #2563eb;
          color: rgba(255,255,255,0.72);
          font-family: 'Poppins', sans-serif;
        }
        .hol-ft__glow {
          position: absolute; left: -160px; top: -120px;
          width: 460px; height: 460px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.14), transparent 70%);
          pointer-events: none;
        }
        .hol-ft__inner {
          position: relative;
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(52px, 6vw, 80px) 6% clamp(36px, 4vw, 52px);
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 2fr);
          gap: clamp(36px, 5vw, 80px);
        }

        .hol-ft__logo { display: flex; align-items: center; gap: 13px; }
        .hol-ft__mark {
          width: 42px; height: 42px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 12px;
          background: linear-gradient(145deg, #2563eb, #1d4ed8);
          box-shadow: 0 8px 20px rgba(37,99,235,0.38);
        }
        .hol-ft__word {
          display: flex; flex-direction: column; line-height: 1.15;
          font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.2px;
        }
        .hol-ft__word-sub {
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.22em;
          text-transform: uppercase; color: #60a5fa; margin-top: 3px;
        }
        .hol-ft__tag {
          margin: 22px 0 24px;
          font-size: 14px; line-height: 1.75;
          color: rgba(255,255,255,0.6);
          max-width: 380px;
        }
        .hol-ft__contact { display: flex; flex-direction: column; gap: 11px; }
        .hol-ft__contact-line {
          display: flex; align-items: center; gap: 10px;
          font-size: 13.5px; color: rgba(255,255,255,0.82);
          text-decoration: none; line-height: 1.5;
        }
        .hol-ft__ico { color: #60a5fa; flex-shrink: 0; }
        a.hol-ft__contact-line { transition: color 0.18s ease; }
        a.hol-ft__contact-line:hover { color: #fff; }
        .hol-ft__contact-indent { padding-left: 25px; }
        .hol-ft__muted { color: rgba(255,255,255,0.44); }

        .hol-ft__cols {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
        }
        .hol-ft__col { display: flex; flex-direction: column; }
        .hol-ft__col-head {
          position: relative;
          font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: #7aa5f0;
          margin-bottom: 20px; padding-bottom: 12px;
        }
        .hol-ft__col-head::after {
          content: ''; position: absolute; left: 0; bottom: 0;
          width: 26px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
        }
        .hol-ft__link {
          position: relative; width: fit-content;
          font-size: 14px; color: rgba(255,255,255,0.72);
          text-decoration: none; padding: 7px 0; line-height: 1.35;
          transition: color 0.18s ease, transform 0.18s ease;
        }
        .hol-ft__link:hover { color: #fff; transform: translateX(3px); }
        .hol-ft__cta {
          display: inline-flex; align-items: center; gap: 8px;
          align-self: flex-start;
          margin-bottom: 10px;
          padding: 11px 18px; border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; font-size: 13.5px; font-weight: 700;
          text-decoration: none; white-space: nowrap;
          box-shadow: 0 10px 24px rgba(37,99,235,0.32);
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .hol-ft__cta:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 14px 30px rgba(37,99,235,0.42); }
        .hol-ft__cta svg { transition: transform 0.18s ease; }
        .hol-ft__cta:hover svg { transform: translateX(3px); }

        .hol-ft__bar {
          position: relative;
          max-width: 1240px; margin: 0 auto;
          padding: 22px 6%;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
          font-size: 12.5px; color: rgba(255,255,255,0.5);
        }
        .hol-ft__bar-links { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .hol-ft__bar-link { color: rgba(255,255,255,0.6); text-decoration: none; transition: color 0.18s ease; }
        .hol-ft__bar-link:hover { color: #fff; }
        .hol-ft__dotsep { color: rgba(255,255,255,0.28); }

        @media (max-width: 900px) {
          .hol-ft__inner { grid-template-columns: 1fr; gap: 44px; }
        }
        @media (max-width: 620px) {
          .hol-ft__cols { grid-template-columns: 1fr 1fr; gap: 30px 24px; }
        }
        @media (max-width: 400px) {
          .hol-ft__cols { grid-template-columns: 1fr; gap: 30px; }
          .hol-ft__bar { justify-content: flex-start; }
        }
      `}</style>
    </footer>
  );
}
