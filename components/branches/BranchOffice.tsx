// components/branches/BranchOffice.tsx
// The rich single-branch OFFICE page (/branches/leeds, /branches/manchester).
// The client has exactly two branches, so each page leads with the physical
// office (address, phone, map), then pitches to tenants and landlords, lists
// services, shares plain-English guidance, answers FAQs, shows the latest
// homes to rent in that city and links out to the neighbourhoods we cover.
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Reveal from '@/components/branches/Reveal';
import CityProperties from '@/components/branches/CityProperties';
import BranchReviews from '@/components/branches/BranchReviews';
import BranchFaq from '@/components/branches/BranchFaq';
import {
  City,
  OFFICES,
  CITY_CONTENT,
  SERVICES,
  INFO_CARDS,
  faqsForCity,
  branchesByCity,
} from '@/lib/branches';

const BASE = 'https://www.houseoflettings.uk';

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--gray-200)' }}>
      <span style={{ minWidth: 96, color: 'var(--gray-400)', fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--gray-800)' }}>{children}</span>
    </div>
  );
}

function SectionHeading({ kicker, title, sub, center }: { kicker?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <Reveal>
      {kicker && (
        <p style={{ color: 'var(--navy)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 13, marginBottom: 10, textAlign: center ? 'center' : 'left' }}>
          {kicker}
        </p>
      )}
      <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(24px,3.2vw,34px)', fontWeight: 800, color: 'var(--navy)', marginBottom: sub ? 10 : 0, letterSpacing: '-0.5px', textAlign: center ? 'center' : 'left' }}>
        {title}
      </h2>
      {sub && (
        <p style={{ color: 'var(--gray-600)', fontSize: 16, maxWidth: 640, margin: center ? '0 auto 8px' : '0 0 8px', textAlign: center ? 'center' : 'left' }}>
          {sub}
        </p>
      )}
    </Reveal>
  );
}

function Ticks({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((t) => (
        <li key={t} style={{ display: 'flex', gap: 12, fontSize: 15, lineHeight: 1.6, color: 'var(--gray-800)' }}>
          <span aria-hidden style={{ color: 'var(--navy)', fontWeight: 800, flexShrink: 0 }}>✓</span>
          {t}
        </li>
      ))}
    </ul>
  );
}

export default function BranchOffice({ city }: { city: City }) {
  const office = OFFICES[city];
  const content = CITY_CONTENT[city];
  const areas = branchesByCity(city);
  const url = `${BASE}/branches/${content.slug}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapQuery)}`;
  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(office.mapQuery)}&output=embed`;

  const agentSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `House of Lettings, ${city}`,
    url,
    image: `${BASE}/images/heropage-og.jpg`,
    telephone: office.phoneDisplay,
    email: office.email,
    priceRange: '££',
    areaServed: { '@type': 'City', name: city },
    address: {
      '@type': 'PostalAddress',
      streetAddress: office.addressLines.join(', '),
      addressLocality: office.addressCity,
      addressRegion: office.region,
      postalCode: office.postcode,
      addressCountry: 'GB',
    },
    geo: { '@type': 'GeoCoordinates', latitude: office.geo.lat, longitude: office.geo.lng },
    openingHours: 'Mo-Fr 09:00-18:00, Sa 10:00-14:00',
    parentOrganization: { '@type': 'Organization', name: 'House of Lettings', url: BASE },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Branches', item: `${BASE}/branches` },
      { '@type': 'ListItem', position: 3, name: city, item: url },
    ],
  };

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0a162f 0%, #12274d 55%, #0f1f3d 100%)',
          color: '#fff',
          padding: 'clamp(60px, 9vw, 104px) 5% clamp(48px, 7vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Reveal>
            <p style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 13, marginBottom: 14 }}>
              {content.heroKicker}
            </p>
            <h1
              style={{
                fontFamily: "'Barlow Condensed','Poppins',sans-serif",
                fontSize: 'clamp(40px, 7vw, 74px)',
                fontWeight: 700,
                lineHeight: 1.03,
                marginBottom: 18,
              }}
            >
              House of Lettings {city}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 'clamp(16px, 2.2vw, 20px)', maxWidth: 660, marginBottom: 30, fontWeight: 300, lineHeight: 1.6 }}>
              {content.heroTagline}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#properties" className="hol-branch-btn hol-branch-btn--white">
                Properties to rent
              </a>
              <a href={office.phoneHref} className="hol-branch-btn hol-branch-btn--ghost">
                Call {office.phoneDisplay}
              </a>
            </div>
          </Reveal>
        </div>
      </header>

      <main style={{ background: '#fff' }}>
        {/* ── The office (address + map) ── */}
        <section style={{ background: 'var(--gray-100)', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <SectionHeading kicker="Our office" title={`Visit the ${city} branch`} sub={content.blurb} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 28, marginTop: 30, alignItems: 'stretch' }}>
              <Reveal>
                <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, padding: '30px 28px', boxShadow: '0 2px 14px rgba(15,31,61,0.06)', height: '100%' }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 18, color: 'var(--navy)' }}>
                    House of Lettings, {city}
                  </div>
                  <ContactRow label="Address">
                    {office.addressLines.join(', ')}, {office.addressCity} {office.postcode}
                  </ContactRow>
                  <ContactRow label="Phone">
                    <a href={office.phoneHref} style={{ color: 'var(--navy)', fontWeight: 600 }}>{office.phoneDisplay}</a>
                  </ContactRow>
                  <ContactRow label="Email">
                    <a href={`mailto:${office.email}`} style={{ color: 'var(--navy)', fontWeight: 600, wordBreak: 'break-word' }}>{office.email}</a>
                  </ContactRow>
                  <ContactRow label="Opening hours">{office.hours}</ContactRow>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                    <Link href="/book-valuation" className="hol-branch-btn hol-branch-btn--navy">
                      Book a free valuation
                    </Link>
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="hol-branch-btn hol-branch-btn--outline">
                      Get directions →
                    </a>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--gray-200)', minHeight: 300, height: '100%', boxShadow: '0 2px 14px rgba(15,31,61,0.06)' }}>
                  <iframe
                    title={`Map of the House of Lettings ${city} office`}
                    src={mapEmbed}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    style={{ border: 0, width: '100%', height: '100%', minHeight: 300, display: 'block' }}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Why live in this city? (unique per branch) ── */}
        <section style={{ maxWidth: 1160, margin: '0 auto', padding: 'clamp(48px,6vw,84px) 5% 0' }}>
          <SectionHeading kicker="The city" title={`Why live in ${city}?`} />
          <div style={{ maxWidth: 860, marginTop: 18 }}>
            {content.whyLive.map((para, i) => (
              <Reveal key={i} delay={i * 60}>
                <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--gray-800)', marginBottom: 18 }}>{para}</p>
              </Reveal>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18, marginTop: 14 }}>
            {content.perks.map((p, i) => (
              <Reveal key={p.label} delay={(i % 4) * 70}>
                <div style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '22px 22px', height: '100%', borderLeft: '3px solid var(--navy)' }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{p.icon}</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 6 }}>{p.label}</div>
                  <div style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.6 }}>{p.text}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── For tenants / for landlords ──
            Text-only, full-width two-column layout (client feedback: the boxed
            cards looked isolated in the surrounding white space). A thin
            divider separates the columns on desktop; they stack on mobile. */}
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(48px,6vw,84px) 5%' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))',
              gap: 'clamp(36px, 5vw, 72px)',
            }}
          >
            <Reveal>
              <div>
                <p style={{ color: 'var(--navy)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 13, marginBottom: 12 }}>
                  For tenants
                </p>
                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(23px,2.8vw,30px)', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                  Renting in {city}? Here’s why tenants choose us
                </h2>
                <Ticks items={content.whyRent} />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="#properties" className="hol-branch-btn hol-branch-btn--navy">Find a home</a>
                  <Link href="/book-viewing" className="hol-branch-btn hol-branch-btn--outline">Book a viewing</Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div>
                <p style={{ color: 'var(--navy)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 13, marginBottom: 12 }}>
                  For landlords
                </p>
                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 'clamp(23px,2.8vw,30px)', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                  Letting in {city}? Here’s why landlords choose us
                </h2>
                <Ticks items={content.landlordPitch} />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link href="/book-valuation" className="hol-branch-btn hol-branch-btn--navy">Free rental valuation</Link>
                  <Link href="/landlord-registration" className="hol-branch-btn hol-branch-btn--outline">Register a property</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Services ── */}
        <section style={{ background: 'var(--gray-100)', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <SectionHeading center title={`How we help ${city} landlords & tenants`} sub="A full lettings service with transparent pricing and no hidden fees, run by a team that knows the city." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 22, marginTop: 34 }}>
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

        {/* ── Latest properties ── */}
        <section id="properties" style={{ scrollMarginTop: 80, maxWidth: 1240, margin: '0 auto', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <SectionHeading title={`Latest properties to rent in ${city}`} sub={`Homes let directly by House of Lettings, updated live as new ${city} properties come to market.`} />
          <div style={{ marginTop: 30 }}>
            <CityProperties city={city} />
          </div>
        </section>

        {/* ── News & guides ── */}
        <section style={{ background: 'var(--gray-100)', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <SectionHeading kicker="News & guides" title="What every landlord & tenant should know" sub="Plain-English guidance on the rules that protect you, kept up to date so you don’t have to be." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22, marginTop: 34 }}>
              {[content.newsCard, ...INFO_CARDS].map((n, i) => {
                const inner = (
                  <div style={{ background: '#fff', borderRadius: 14, padding: '26px 24px', height: '100%', boxShadow: '0 2px 12px rgba(15,31,61,0.06)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ alignSelf: 'flex-start', background: 'rgba(10,22,47,0.06)', color: 'var(--navy)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, marginBottom: 14 }}>
                      {n.category}
                    </span>
                    <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, lineHeight: 1.35 }}>{n.title}</h3>
                    <p style={{ color: 'var(--gray-600)', fontSize: 14.5, lineHeight: 1.65, flex: 1 }}>{n.text}</p>
                    {n.href && (
                      <span style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 13.5, marginTop: 16, letterSpacing: '0.03em' }}>
                        Learn more →
                      </span>
                    )}
                  </div>
                );
                return (
                  <Reveal key={n.title} delay={(i % 3) * 70}>
                    {n.href ? (
                      n.external ? (
                        <a href={n.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</a>
                      ) : (
                        <Link href={n.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Link>
                      )
                    ) : (
                      inner
                    )}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(48px,6vw,80px) 5%' }}>
          <div style={{ marginBottom: 34 }}>
            <SectionHeading center kicker="FAQs" title="Frequently asked questions" />
          </div>
          <BranchFaq faqs={faqsForCity(city)} />
        </section>

        {/* ── Reviews ── */}
        <BranchReviews city={city} />

        {/* ── Areas we cover ── */}
        <section style={{ background: 'var(--gray-100)', padding: 'clamp(44px,5vw,68px) 5%' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <SectionHeading title={`Areas we cover across ${city}`} sub={`Our ${city} office lets and manages homes right across the city. Explore the neighbourhoods we know best.`} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
              {areas.map((a) => (
                <Link
                  key={a.slug}
                  href={`/branches/${a.slug}`}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--gray-200)',
                    color: 'var(--navy)',
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {a.name} <span style={{ color: 'var(--gray-400)', fontWeight: 500 }}>· {a.postcodes.join(', ')}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
