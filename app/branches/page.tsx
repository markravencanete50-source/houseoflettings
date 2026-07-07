// app/branches/page.tsx
// Branches index. The client has exactly TWO branches — Leeds and Manchester —
// so this page shows two office cards, not the twenty neighbourhood pages
// (those still exist for local SEO and are linked from each branch page under
// "areas we cover").
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Reveal from '@/components/branches/Reveal';
import { OFFICES, CITY_CONTENT, CITY_BRANCHES, branchesByCity, City } from '@/lib/branches';

const BASE = 'https://www.houseoflettings.uk';

export const metadata: Metadata = {
  title: 'Our Branches | Letting Agents in Leeds & Manchester | House of Lettings',
  description:
    'Two local branches, Leeds and Manchester. Find your nearest House of Lettings office, get straight through to the right local team, and browse homes to rent.',
  alternates: { canonical: `${BASE}/branches` },
  openGraph: {
    title: 'Our Branches | Letting Agents in Leeds & Manchester',
    description: 'Two local branches, Leeds and Manchester. Find your nearest House of Lettings office and browse homes to rent.',
    url: `${BASE}/branches`,
    siteName: 'House of Lettings',
    images: [{ url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings branches' }],
    locale: 'en_GB',
    type: 'website',
  },
};

function BranchCard({ city, delay }: { city: City; delay: number }) {
  const office = OFFICES[city];
  const content = CITY_CONTENT[city];
  const areas = branchesByCity(city);
  const areaNames = areas.slice(0, 3).map((a) => a.name).join(', ');
  const more = areas.length - 3;
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(office.mapQuery)}&output=embed`;

  return (
    <Reveal delay={delay}>
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--gray-200)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 2px 14px rgba(15,31,61,0.07)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div style={{ height: 200, borderBottom: '1px solid var(--gray-200)' }}>
          <iframe
            title={`Map of the House of Lettings ${city} office`}
            src={mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
          />
        </div>
        <div style={{ padding: 'clamp(24px,3vw,32px)', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{ color: 'var(--navy)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>
            {office.region}
          </p>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.5px', marginBottom: 16 }}>
            House of Lettings {city}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5, color: 'var(--gray-800)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <span aria-hidden>📍</span>
              <span>{office.addressLines.join(', ')}, {office.addressCity} {office.postcode}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span aria-hidden>📞</span>
              <a href={office.phoneHref} style={{ color: 'var(--navy)', fontWeight: 600 }}>{office.phoneDisplay}</a>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span aria-hidden>🕘</span>
              <span>{office.hours}</span>
            </div>
          </div>

          <p style={{ color: 'var(--gray-600)', fontSize: 13.5, lineHeight: 1.55, marginBottom: 22 }}>
            Covers {areaNames}{more > 0 ? ` & ${more} more areas` : ''} across {city}.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 'auto' }}>
            <Link href={`/branches/${content.slug}`} className="hol-branch-btn hol-branch-btn--navy">
              View {city} branch →
            </Link>
            <a href={office.phoneHref} className="hol-branch-btn hol-branch-btn--outline">
              Call the team
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function BranchesIndexPage() {
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'House of Lettings branches',
    itemListElement: CITY_BRANCHES.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `House of Lettings ${b.city}`,
      url: `${BASE}/branches/${b.slug}`,
    })),
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0a162f 0%, #12274d 55%, #0f1f3d 100%)',
          color: '#fff',
          padding: 'clamp(60px, 9vw, 104px) 5% clamp(48px, 7vw, 80px)',
          textAlign: 'center',
        }}
      >
        <Reveal>
          <p style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 13, marginBottom: 14 }}>
            Local experts, on your doorstep
          </p>
          <h1
            style={{
              fontFamily: "'Barlow Condensed','Poppins',sans-serif",
              fontSize: 'clamp(38px, 6vw, 66px)',
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: 18,
            }}
          >
            Two Branches. One Dedicated Lettings Service.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(15px, 2vw, 19px)', maxWidth: 640, margin: '0 auto 30px', fontWeight: 300, lineHeight: 1.6 }}>
            Choose your branch to meet your local team, see the office, and browse homes to rent nearby. Two cities, two
            offices, one standard of service.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/listings" className="hol-branch-btn hol-branch-btn--white">
              Browse all properties
            </Link>
            <Link href="/book-valuation" className="hol-branch-btn hol-branch-btn--white">
              Free rental valuation
            </Link>
          </div>
        </Reveal>
      </header>

      <main style={{ background: 'var(--gray-100)', padding: 'clamp(48px,6vw,80px) 5%' }}>
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 28,
          }}
        >
          <BranchCard city="Leeds" delay={0} />
          <BranchCard city="Manchester" delay={90} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#050a12', padding: 'clamp(32px,5vw,48px) 5%', color: 'rgba(255,255,255,0.7)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
          <span>© {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 22 }}>
            <Link href="/branches" style={{ color: 'inherit' }}>Branches</Link>
            <Link href="/listings" style={{ color: 'inherit' }}>Properties</Link>
            <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
          </div>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
    </>
  );
}
