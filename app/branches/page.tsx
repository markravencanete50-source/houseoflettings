// app/branches/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Reveal from '@/components/branches/Reveal';
import BranchGrid from '@/components/branches/BranchGrid';
import { BRANCHES, branchesByCity, OFFICES, City } from '@/lib/branches';

const BASE = 'https://www.houseoflettings.uk';

export const metadata: Metadata = {
  title: 'Our Branches | Letting Agents in Leeds & Manchester | House of Lettings',
  description:
    'Find your local House of Lettings branch. Letting agents across Leeds and Manchester — browse properties to rent by area, from Headingley and Roundhay to Didsbury and Chorlton.',
  alternates: { canonical: `${BASE}/branches` },
  openGraph: {
    title: 'Our Branches | Letting Agents in Leeds & Manchester',
    description:
      'Local letting experts across Leeds and Manchester. Browse properties to rent by area and find your nearest branch.',
    url: `${BASE}/branches`,
    siteName: 'House of Lettings',
    images: [{ url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: 'House of Lettings branches' }],
    locale: 'en_GB',
    type: 'website',
  },
};

function CitySection({ city, subtitle }: { city: City; subtitle: string }) {
  const office = OFFICES[city];
  const branches = branchesByCity(city);
  return (
    <section
      id={city.toLowerCase()}
      style={{ padding: 'clamp(48px, 6vw, 72px) 5%', maxWidth: 1240, margin: '0 auto', scrollMarginTop: 80 }}
    >
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
          <h2
            style={{
              fontFamily: "'Poppins',sans-serif",
              fontSize: 'clamp(26px, 3.4vw, 38px)',
              fontWeight: 800,
              color: 'var(--navy)',
              letterSpacing: '-0.5px',
            }}
          >
            {city} Branches
          </h2>
          <span style={{ color: 'var(--teal-dark)', fontWeight: 600, fontSize: 14 }}>
            {branches.length} local areas
          </span>
        </div>
        <p style={{ color: 'var(--gray-600)', fontSize: 16, maxWidth: 720, marginBottom: 10 }}>{subtitle}</p>
        <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 34 }}>
          <strong>{city} office:</strong> {office.addressLines.join(', ')}, {office.addressCity} {office.postcode} ·{' '}
          <a href={office.phoneHref} style={{ color: 'var(--red)', fontWeight: 600 }}>
            {office.phoneDisplay}
          </a>
        </p>
      </Reveal>

      <BranchGrid branches={branches} />
    </section>
  );
}

export default function BranchesIndexPage() {
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'House of Lettings branches',
    itemListElement: BRANCHES.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${b.name} letting agents`,
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
          <p style={{ color: 'var(--teal)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 13, marginBottom: 14 }}>
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
            Our Branches Across Leeds &amp; Manchester
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(15px, 2vw, 19px)', maxWidth: 680, margin: '0 auto 30px', fontWeight: 300 }}>
            Choose your area to see homes to rent nearby, meet your local team and get straight through to the right
            office. Twenty neighbourhoods, two cities, one dedicated lettings service.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/listings" className="hol-branch-btn hol-branch-btn--teal">
              Browse all properties
            </Link>
            <Link href="/book-valuation" className="hol-branch-btn hol-branch-btn--ghost">
              Free rental valuation
            </Link>
          </div>
          {/* Quick jump — long page on mobile, let visitors skip to their city */}
          <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
            <a href="#leeds" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>
              Leeds branches ↓
            </a>
            <a href="#manchester" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>
              Manchester branches ↓
            </a>
          </div>
        </Reveal>
      </header>

      <main style={{ background: 'var(--gray-100)' }}>
        <CitySection
          city="Leeds"
          subtitle="From the city centre to the leafy northern suburbs, our Leeds team lets and manages homes across West Yorkshire. Pick your neighbourhood below."
        />
        <div style={{ height: 1, background: 'var(--gray-200)', maxWidth: 1240, margin: '0 auto' }} />
        <CitySection
          city="Manchester"
          subtitle="Across Greater Manchester — from waterfront apartments to south-Manchester villages — our local team keeps landlords let and tenants moving. Choose an area to start."
        />
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
