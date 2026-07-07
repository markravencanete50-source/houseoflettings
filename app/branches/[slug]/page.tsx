// app/branches/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Reveal from '@/components/branches/Reveal';
import BranchProperties from '@/components/branches/BranchProperties';
import BranchHeroBg from '@/components/branches/BranchHeroBg';
import { BRANCHES, getBranch, OFFICES } from '@/lib/branches';

const BASE = 'https://www.houseoflettings.uk';

export function generateStaticParams() {
  return BRANCHES.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const branch = getBranch(params.slug);
  if (!branch) return { title: 'Branch not found | House of Lettings' };
  const url = `${BASE}/branches/${branch.slug}`;
  return {
    title: branch.seoTitle,
    description: branch.seoDescription,
    keywords: branch.popularSearches,
    alternates: { canonical: url },
    openGraph: {
      title: branch.seoTitle,
      description: branch.seoDescription,
      url,
      siteName: 'House of Lettings',
      images: [{ url: '/images/heropage-og.jpg', width: 1200, height: 630, alt: `${branch.name} letting agents` }],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: branch.seoTitle,
      description: branch.seoDescription,
      images: ['/images/heropage-og.jpg'],
    },
  };
}

const SERVICES = [
  { icon: '🔎', title: 'Tenant Find', text: 'Marketing, accompanied viewings and full referencing to place quality, vetted tenants fast.' },
  { icon: '🛠', title: 'Full Management', text: 'Rent collection, maintenance, inspections and compliance — a genuinely hands-off let.' },
  { icon: '📄', title: 'Rent & Legal', text: 'Right to Rent, deposit protection, gas, electrical and EPC compliance handled for you.' },
  { icon: '📈', title: 'Free Valuation', text: 'An accurate, local rental valuation so your property goes to market at the right price.' },
];

export default function BranchPage({ params }: { params: { slug: string } }) {
  const branch = getBranch(params.slug);
  if (!branch) notFound();

  const office = OFFICES[branch.city];
  const url = `${BASE}/branches/${branch.slug}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapQuery)}`;

  const agentSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `House of Lettings — ${branch.name}`,
    url,
    image: `${BASE}/images/heropage-og.jpg`,
    telephone: office.phoneDisplay,
    email: office.email,
    priceRange: '££',
    areaServed: { '@type': 'Place', name: `${branch.name}, ${branch.city}` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: office.addressLines.join(', '),
      addressLocality: office.addressCity,
      addressRegion: office.region,
      postalCode: office.postcode,
      addressCountry: 'GB',
    },
    geo: { '@type': 'GeoCoordinates', latitude: office.geo.lat, longitude: office.geo.lng },
    parentOrganization: { '@type': 'Organization', name: 'House of Lettings', url: BASE },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Branches', item: `${BASE}/branches` },
      { '@type': 'ListItem', position: 3, name: branch.name, item: url },
    ],
  };

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <header
        style={{
          position: 'relative',
          minHeight: 'clamp(360px, 52vw, 520px)',
          display: 'flex',
          alignItems: 'flex-end',
          color: '#fff',
          background: 'var(--navy)',
        }}
      >
        <BranchHeroBg branch={branch} fallback={branch.heroImage} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1240, margin: '0 auto', padding: 'clamp(32px,5vw,56px) 5%', width: '100%' }}>
          <Reveal>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" style={{ marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              <Link href="/" style={{ color: 'inherit' }}>Home</Link>
              <span style={{ margin: '0 8px', opacity: 0.6 }}>/</span>
              <Link href="/branches" style={{ color: 'inherit' }}>Branches</Link>
              <span style={{ margin: '0 8px', opacity: 0.6 }}>/</span>
              <span style={{ color: '#fff' }}>{branch.name}</span>
            </nav>

            <p style={{ color: 'var(--teal)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 13, marginBottom: 12 }}>
              Letting Agents · {branch.postcodes.join(' · ')} · {branch.city}
            </p>
            <h1
              style={{
                fontFamily: "'Barlow Condensed','Poppins',sans-serif",
                fontSize: 'clamp(40px, 7vw, 76px)',
                fontWeight: 700,
                lineHeight: 1.02,
                marginBottom: 12,
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}
            >
              {branch.name}
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2.2vw, 21px)', maxWidth: 620, marginBottom: 26, fontWeight: 300, color: 'rgba(255,255,255,0.92)' }}>
              {branch.tagline}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#properties" className="hol-branch-btn hol-branch-btn--teal">
                Properties to rent
              </a>
              <a href={office.phoneHref} className="hol-branch-btn hol-branch-btn--ghost">
                Call the {branch.city} team
              </a>
            </div>
          </Reveal>
        </div>
      </header>

      <main style={{ background: '#fff' }}>
        {/* ── About the area ── */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(48px,7vw,84px) 5% clamp(32px,4vw,48px)' }}>
          <Reveal>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(24px,3.2vw,34px)', fontWeight: 800, color: 'var(--navy)', marginBottom: 20, letterSpacing: '-0.5px' }}>
              Renting in {branch.name}
            </h2>
          </Reveal>
          {branch.about.map((para, i) => (
            <Reveal key={i} delay={i * 60}>
              <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--gray-800)', marginBottom: 18 }}>{para}</p>
            </Reveal>
          ))}

          {/* Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18, marginTop: 26 }}>
            {branch.highlights.map((h, i) => (
              <Reveal key={h.label} delay={i * 70}>
                <div style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '20px 22px', height: '100%', borderLeft: '3px solid var(--teal)' }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 6 }}>{h.label}</div>
                  <div style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.6 }}>{h.text}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Services ── */}
        <section style={{ background: 'var(--gray-100)', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <Reveal>
              <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(24px,3.2vw,34px)', fontWeight: 800, color: 'var(--navy)', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.5px' }}>
                How we help {branch.name} landlords &amp; tenants
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--gray-600)', fontSize: 16, maxWidth: 640, margin: '0 auto 40px' }}>
                A full lettings service with transparent pricing and no hidden fees — run by a team that knows {branch.city}.
              </p>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 22 }}>
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={(i % 4) * 70}>
                  <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', height: '100%', boxShadow: '0 2px 12px rgba(15,31,61,0.06)' }}>
                    <div style={{ fontSize: 32, marginBottom: 14 }}>{s.icon}</div>
                    <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ color: 'var(--gray-600)', fontSize: 14.5, lineHeight: 1.6 }}>{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Properties in this area ── */}
        <section id="properties" style={{ scrollMarginTop: 80, maxWidth: 1240, margin: '0 auto', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <Reveal>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(24px,3.2vw,34px)', fontWeight: 800, color: 'var(--navy)', marginBottom: 8, letterSpacing: '-0.5px' }}>
              Properties to rent in {branch.name}
            </h2>
            <p style={{ color: 'var(--gray-600)', fontSize: 16, marginBottom: 30 }}>
              Homes let directly by House of Lettings — updated live as new {branch.name} properties come to market.
            </p>
          </Reveal>
          <BranchProperties branch={branch} />
        </section>

        {/* ── Contact ── */}
        <section style={{ background: 'linear-gradient(135deg, #0a162f 0%, #12274d 100%)', color: '#fff', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 36, alignItems: 'center' }}>
            <Reveal>
              <p style={{ color: 'var(--teal)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 13, marginBottom: 12 }}>
                Your local office
              </p>
              <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(24px,3.2vw,32px)', fontWeight: 800, marginBottom: 16 }}>
                Talk to the {branch.city} team
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                Thinking of letting a property in {branch.name}, or looking for your next home here? Our {branch.city}{' '}
                office covers {branch.postcodes.join(', ')} and the surrounding areas.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/book-valuation" className="hol-branch-btn hol-branch-btn--teal">
                  Book a free valuation
                </Link>
                <Link href="/book-viewing" className="hol-branch-btn hol-branch-btn--ghost">
                  Book a viewing
                </Link>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '30px 28px' }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 18 }}>
                  House of Lettings — {branch.city}
                </div>
                <ContactRow label="Address">
                  {office.addressLines.join(', ')}, {office.addressCity} {office.postcode}
                </ContactRow>
                <ContactRow label="Phone">
                  <a href={office.phoneHref} style={{ color: '#fff', fontWeight: 600 }}>{office.phoneDisplay}</a>
                </ContactRow>
                <ContactRow label="Email">
                  <a href={`mailto:${office.email}`} style={{ color: '#fff', fontWeight: 600, wordBreak: 'break-word' }}>{office.email}</a>
                </ContactRow>
                <ContactRow label="Opening hours">{office.hours}</ContactRow>
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="hol-branch-btn hol-branch-btn--ghost" style={{ marginTop: 8, width: '100%' }}>
                  Get directions →
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Popular searches (internal SEO links) ── */}
        <section style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(36px,5vw,56px) 5%' }}>
          <Reveal>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
              Popular {branch.name} searches
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {branch.popularSearches.map((s) => (
                <Link
                  key={s}
                  href={`/listings?location=${encodeURIComponent(branch.name)}`}
                  style={{
                    background: 'var(--gray-100)',
                    border: '1px solid var(--gray-200)',
                    color: 'var(--gray-800)',
                    borderRadius: 999,
                    padding: '8px 16px',
                    fontSize: 13.5,
                  }}
                >
                  {s}
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#050a12', padding: 'clamp(32px,5vw,48px) 5%', color: 'rgba(255,255,255,0.7)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
          <span>© {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 22 }}>
            <Link href="/branches" style={{ color: 'inherit' }}>All branches</Link>
            <Link href="/listings" style={{ color: 'inherit' }}>Properties</Link>
            <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
          </div>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ minWidth: 96, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}
