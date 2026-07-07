'use client';
// components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth';

type NavItem = { href: string; label: string };

// Desktop: hover reveals the menu. Mobile (inside the open burger menu):
// the menu renders inline as an always-expanded grouped list.
function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="hol-nav__dd">
      <button type="button" className="hol-nav__dd-trigger" aria-haspopup="true">
        {label}
        <span className="hol-nav__dd-caret" aria-hidden>▾</span>
      </button>
      <div className="hol-nav__dd-menu">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="hol-nav__dd-item">
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const LANDLORD_ITEMS: NavItem[] = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/book-valuation', label: 'Book Valuation' },
  { href: '/instant-valuation', label: 'Instant Valuation' },
  { href: '/landlord-registration', label: 'Landlord Registration' },
];

const TENANT_ITEMS: NavItem[] = [
  { href: '/listings', label: 'Browse Properties' },
  { href: '/tenant-application', label: 'Tenant Application' },
  { href: '/guarantor', label: 'Guarantor Form' },
  { href: '/maintenance', label: 'Maintenance' },
];

export default function Navbar() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const dashLink =
    profile?.role === 'landlord' ? '/dashboard/landlord' :
    profile?.role === 'tenant'   ? '/dashboard/tenant'   : '/admin';

  return (
    <>
      <nav
        className="hol-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(10,22,47,0.98)' : 'rgba(10,22,47,0.92)',
          boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.3)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div className="hol-nav__inner">
          {/* Logo */}
          <Link href="/" className="hol-nav__logo">
            <span className="hol-nav__logo-top">House of Lettings</span>
            <span className="hol-nav__logo-sub">Leeds &amp; Manchester</span>
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="hol-nav__burger"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <span className={`hol-nav__burger-bar ${mobileMenuOpen ? 'is-open' : ''}`} />
            <span className={`hol-nav__burger-bar ${mobileMenuOpen ? 'is-open' : ''}`} />
            <span className={`hol-nav__burger-bar ${mobileMenuOpen ? 'is-open' : ''}`} />
          </button>

          {/* Links + CTAs — always visible on desktop, collapses into a dropdown on mobile */}
          <div className={`hol-nav__links ${mobileMenuOpen ? 'hol-nav__links--open' : ''}`}>
            <NavDropdown label="Landlord" items={LANDLORD_ITEMS} />
            <NavDropdown label="Tenant" items={TENANT_ITEMS} />
            <Link href="/branches" className="hol-nav__link">Branches</Link>
            {!loading && profile && (
              <Link href={dashLink} className="hol-nav__link">Dashboard</Link>
            )}
            <Link href="/terms" className="hol-nav__link">Terms</Link>
            {!loading && (
              profile ? (
                <button onClick={handleSignOut} className="nav-btn-outline">Sign Out</button>
              ) : (
                <Link href="/login" className="nav-btn-outline">Sign In</Link>
              )
            )}
          </div>
        </div>

        <style>{`
          .hol-nav {
            width: 100%;
          }
          .hol-nav__inner {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 5%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            min-height: 72px;
            flex-wrap: wrap;
          }
          .hol-nav__logo {
            display: flex;
            flex-direction: column;
            text-decoration: none;
            flex-shrink: 0;
            line-height: 1.2;
            padding: 12px 0;
          }
          .hol-nav__logo-top {
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.3px;
          }
          .hol-nav__logo-sub {
            font-family: 'Poppins', sans-serif;
            font-size: 10px;
            font-weight: 500;
            color: rgba(255,255,255,0.55);
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          .hol-nav__links {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            padding: 8px 0;
          }
          .hol-nav__burger {
            display: none;
            flex-direction: column;
            justify-content: center;
            gap: 5px;
            width: 32px;
            height: 32px;
            background: transparent;
            border: none;
            padding: 0;
            cursor: pointer;
            flex-shrink: 0;
          }
          .hol-nav__burger-bar {
            display: block;
            width: 100%;
            height: 2px;
            background: #fff;
            border-radius: 2px;
            transition: transform 0.25s ease, opacity 0.25s ease;
          }
          .hol-nav__burger-bar.is-open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
          .hol-nav__burger-bar.is-open:nth-child(2) { opacity: 0; }
          .hol-nav__burger-bar.is-open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
          .hol-nav__link {
            font-family: 'Poppins', sans-serif;
            color: #fff;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            text-decoration: none;
            padding: 4px 0;
            white-space: nowrap;
          }
          .hol-nav__link:hover { opacity: 0.75; }
          .hol-nav__dd {
            position: relative;
            display: inline-block;
          }
          .hol-nav__dd-trigger {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-family: 'Poppins', sans-serif;
            color: #fff;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            padding: 4px 0;
            white-space: nowrap;
          }
          .hol-nav__dd-trigger:hover { opacity: 0.75; }
          .hol-nav__dd-caret { font-size: 10px; opacity: 0.7; }
          .hol-nav__dd-menu {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            min-width: 210px;
            background: rgba(10,22,47,0.99);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 8px;
            display: none;
            flex-direction: column;
            gap: 2px;
            box-shadow: 0 16px 32px rgba(0,0,0,0.4);
          }
          /* transparent bridge so the menu doesn't close in the gap on hover */
          .hol-nav__dd-menu::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 0;
            right: 0;
            height: 10px;
          }
          .hol-nav__dd:hover .hol-nav__dd-menu,
          .hol-nav__dd:focus-within .hol-nav__dd-menu { display: flex; }
          .hol-nav__dd-item {
            color: #fff;
            text-decoration: none;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            font-weight: 500;
            padding: 10px 12px;
            border-radius: 6px;
            white-space: nowrap;
          }
          .hol-nav__dd-item:hover { background: rgba(37,99,235,0.28); }
          .nav-btn-primary {
            padding: 8px 14px;
            background: #2563eb;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-family: 'Poppins', sans-serif;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.2s;
          }
          .nav-btn-primary:hover { background: #1d4ed8; }
          .nav-btn-outline {
            padding: 8px 14px;
            background: transparent;
            color: #fff;
            border: 1.5px solid rgba(255,255,255,0.55);
            border-radius: 4px;
            font-family: 'Poppins', sans-serif;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
          }
          .nav-btn-outline:hover {
            background: rgba(255,255,255,0.1);
          }
          @media (max-width: 640px) {
            .hol-nav__inner {
              padding: 0 4%;
              flex-wrap: nowrap;
              min-height: 60px;
              position: relative;
            }
            .hol-nav__logo-top { font-size: 14px; }
            .hol-nav__logo-sub { font-size: 9px; }
            .hol-nav__burger {
              display: flex;
            }
            .hol-nav__links {
              display: none;
            }
            .hol-nav__links--open {
              display: flex;
              flex-direction: column;
              align-items: stretch;
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: rgba(10,22,47,0.98);
              padding: 18px 5% 24px;
              gap: 12px;
              box-shadow: 0 12px 24px rgba(0,0,0,0.35);
              border-top: 1px solid rgba(255,255,255,0.08);
            }
            .hol-nav__links--open .nav-btn-primary,
            .hol-nav__links--open .nav-btn-outline,
            .hol-nav__links--open .hol-nav__link {
              width: 100%;
              text-align: left;
              font-size: 13px;
              padding: 12px 4px;
              white-space: normal;
            }
            .hol-nav__links--open .nav-btn-outline {
              border: none;
              border-top: 1px solid rgba(255,255,255,0.08);
              border-radius: 0;
            }
            /* Dropdowns expand inline inside the mobile menu */
            .hol-nav__links--open .hol-nav__dd { width: 100%; }
            .hol-nav__links--open .hol-nav__dd-trigger {
              width: 100%;
              justify-content: space-between;
              padding: 12px 4px;
              border-top: 1px solid rgba(255,255,255,0.08);
            }
            .hol-nav__links--open .hol-nav__dd-menu {
              display: flex;
              position: static;
              min-width: 0;
              margin: 0;
              padding: 0 0 8px 12px;
              background: transparent;
              border: none;
              border-radius: 0;
              box-shadow: none;
            }
            .hol-nav__links--open .hol-nav__dd-menu::before { display: none; }
            .hol-nav__links--open .hol-nav__dd-item {
              padding: 10px 4px;
              width: 100%;
            }
          }
        `}</style>
      </nav>
    </>
  );
}
