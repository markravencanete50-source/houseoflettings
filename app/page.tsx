'use client';

import Link from 'next/link';

const colors = {
  navy: '#0a1f44',
  navyLight: '#1a3a6b',
  charcoal: '#0d0d0d',
  white: '#ffffff',
  bgAlt: '#f7f8fa',
  textMuted: '#6b7280',
  border: '#e5e7eb',
};

const properties = [
  {
    id: 1,
    title: 'Spacious 3-Bed Semi',
    location: 'Coventry, CV2',
    price: '£1,100 pcm',
    beds: 3,
    baths: 1,
    image: '/images/property1.jpg',
  },
  {
    id: 2,
    title: 'Modern 2-Bed Apartment',
    location: 'Coventry, CV1',
    price: '£875 pcm',
    beds: 2,
    baths: 1,
    image: '/images/property2.jpg',
  },
  {
    id: 3,
    title: 'Cosy 1-Bed Flat',
    location: 'Coventry, CV3',
    price: '£650 pcm',
    beds: 1,
    baths: 1,
    image: '/images/property3.jpg',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    text: 'House of Lettings made finding our home completely stress-free. Responsive, professional and genuinely caring.',
  },
  {
    name: 'James T.',
    text: 'As a landlord I\'ve used many agents — none come close to the communication and reliability here.',
  },
  {
    name: 'Priya K.',
    text: 'From viewing to moving in took under two weeks. Incredible service from start to finish.',
  },
];

export default function Home() {
  return (
    <main>

      {/* ── HERO ── */}
      <section
        style={{
          background: colors.charcoal,
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background pattern */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(10,31,68,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(10,31,68,0.3) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <p
            style={{
              color: colors.white,
              opacity: 0.55,
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 24,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Coventry's Trusted Letting Agent
          </p>

          <h1
            style={{
              color: colors.white,
              fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 24,
              letterSpacing: '-0.01em',
            }}
          >
            Find Your Perfect Home <br />in Coventry
          </h1>

          <p
            style={{
              color: colors.white,
              opacity: 0.75,
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              maxWidth: 540,
              margin: '0 auto 40px',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.7,
            }}
          >
            We take the stress out of renting — for tenants and landlords alike.
            Professional, personal, and always on your side.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/properties"
              style={{
                background: colors.navy,
                color: colors.white,
                padding: '16px 36px',
                borderRadius: 4,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: '0.04em',
                display: 'inline-block',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = colors.navyLight)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = colors.navy)
              }
            >
              View Properties
            </Link>

            <Link
              href="/terms"
              style={{
                background: 'transparent',
                color: colors.white,
                padding: '15px 36px',
                borderRadius: 4,
                border: `1px solid rgba(255,255,255,0.35)`,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 500,
                fontSize: 15,
                letterSpacing: '0.04em',
                display: 'inline-block',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.7)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.35)')
              }
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section
        style={{
          background: colors.white,
          padding: '96px 24px',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2
            style={{
              color: colors.navy,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Why Choose Us
          </h2>
          <p
            style={{
              color: colors.textMuted,
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 16,
              marginBottom: 64,
              maxWidth: 520,
              margin: '0 auto 64px',
            }}
          >
            Honest, straightforward letting — no hidden fees, no runaround.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 32,
            }}
          >
            {[
              {
                icon: '🏠',
                title: 'Local Expertise',
                body: 'Deep knowledge of the Coventry market means we find the right tenant or home, fast.',
              },
              {
                icon: '📞',
                title: 'Always Reachable',
                body: 'We pick up the phone. Real people, real responses — no automated queues.',
              },
              {
                icon: '📋',
                title: 'Transparent Fees',
                body: 'No surprise charges. Everything is explained upfront so you know exactly where you stand.',
              },
              {
                icon: '🔑',
                title: 'Hassle-Free Process',
                body: 'From listing to keys in hand — we manage every step so you don\'t have to.',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: colors.bgAlt,
                  borderRadius: 8,
                  padding: '36px 28px',
                  borderTop: `3px solid ${colors.navy}`,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <h3
                  style={{
                    color: colors.navy,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: colors.textMuted,
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 15,
                    lineHeight: 1.65,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      <section
        style={{
          background: colors.bgAlt,
          padding: '96px 24px',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2
            style={{
              color: colors.navy,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Featured Properties
          </h2>
          <p
            style={{
              color: colors.textMuted,
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 16,
              marginBottom: 64,
              maxWidth: 480,
              margin: '0 auto 64px',
            }}
          >
            A selection of our current available lets across Coventry.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 28,
            }}
          >
            {properties.map((p) => (
              <div
                key={p.id}
                style={{
                  background: colors.white,
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(10,31,68,0.08)',
                }}
              >
                <div
                  style={{
                    height: 210,
                    background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.white,
                    fontSize: 48,
                  }}
                >
                  🏘️
                </div>
                <div style={{ padding: '24px 20px' }}>
                  <h3
                    style={{
                      color: colors.navy,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      color: colors.textMuted,
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 14,
                      marginBottom: 16,
                    }}
                  >
                    📍 {p.location}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: colors.navy,
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: 700,
                        fontSize: 17,
                      }}
                    >
                      {p.price}
                    </span>
                    <span
                      style={{
                        color: colors.textMuted,
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: 13,
                      }}
                    >
                      {p.beds} bed · {p.baths} bath
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link
              href="/properties"
              style={{
                background: colors.navy,
                color: colors.white,
                padding: '15px 40px',
                borderRadius: 4,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                display: 'inline-block',
                letterSpacing: '0.04em',
              }}
            >
              See All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        style={{
          background: colors.navy,
          padding: '96px 24px',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2
            style={{
              color: colors.white,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 56,
            }}
          >
            What Our Clients Say
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {testimonials.map((t) => (
              <div
                key={t.name}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 8,
                  padding: '32px 28px',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <p
                  style={{
                    color: colors.white,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 16,
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                    marginBottom: 24,
                    opacity: 0.9,
                  }}
                >
                  "{t.text}"
                </p>
                <p
                  style={{
                    color: colors.white,
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: 0.6,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  — {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        style={{
          background: colors.charcoal,
          padding: '88px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2
            style={{
              color: colors.white,
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Ready to Get Started?
          </h2>
          <p
            style={{
              color: colors.white,
              opacity: 0.65,
              fontFamily: 'system-ui, sans-serif',
              fontSize: 16,
              marginBottom: 40,
              lineHeight: 1.7,
            }}
          >
            Whether you're looking for your next home or need a trusted agent for
            your property — we're here to help.
          </p>
          <Link
            href="/contact"
            style={{
              background: colors.white,
              color: colors.navy,
              padding: '16px 44px',
              borderRadius: 4,
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              display: 'inline-block',
              letterSpacing: '0.04em',
            }}
          >
            Contact Us
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: colors.navy,
          padding: '56px 24px 32px',
          color: colors.white,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 40,
              marginBottom: 48,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                House of Lettings
              </h3>
              <p
                style={{
                  opacity: 0.6,
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                Coventry's trusted letting agent. <br />
                Professional, personal, reliable.
              </p>
            </div>

            <div>
              <h4
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                  marginBottom: 16,
                }}
              >
                Quick Links
              </h4>
              {['Properties', 'Landlords', 'Tenants', 'Contact'].map((link) => (
                <div key={link} style={{ marginBottom: 10 }}>
                  <Link
                    href={`/${link.toLowerCase()}`}
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 15,
                      opacity: 0.75,
                    }}
                  >
                    {link}
                  </Link>
                </div>
              ))}
            </div>

            <div>
              <h4
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                  marginBottom: 16,
                }}
              >
                Legal
              </h4>
              {[
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <Link
                    href={item.href}
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 15,
                      opacity: 0.75,
                    }}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>

            <div>
              <h4
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                  marginBottom: 16,
                }}
              >
                Contact
              </h4>
              <p
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 15,
                  opacity: 0.75,
                  lineHeight: 1.8,
                }}
              >
                Coventry, UK<br />
                <a href="mailto:info@houseoflettings.uk" style={{ opacity: 1 }}>
                  info@houseoflettings.uk
                </a>
              </p>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 24,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 13,
                opacity: 0.4,
              }}
            >
              © {new Date().getFullYear()} House of Lettings. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
