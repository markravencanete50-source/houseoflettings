'use client';
// components/layout/Navbar.tsx
import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth';

const ValuationModal = lazy(() => import('@/components/ValuationModal'));
const TenantEnquiryModal = lazy(() => import('@/components/property/TenantEnquiryModal'));

function NavValuationButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="nav-btn-primary"
      >
        Book a Valuation
      </button>
      <Suspense fallback={null}>
        {open && <ValuationModal isOpen={open} onClose={() => setOpen(false)} />}
      </Suspense>
    </>
  );
}

function NavViewingButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="nav-btn-outline"
      >
        Book a Viewing
      </button>
      <Suspense fallback={null}>
        {open && (
          <TenantEnquiryModal
            isOpen={open}
            onClose={() => setOpen(false)}
            propertyTitle="House of Lettings"
            propertyPrice={0}
          />
        )}
      </Suspense>
    </>
  );
}

export default function Navbar() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          {/* Links + CTAs — always visible, wrap on mobile */}
          <div className="hol-nav__links">
            <Link href="/listings" className="hol-nav__link">Browse</Link>
            {!loading && profile && (
              <Link href={dashLink} className="hol-nav__link">Dashboard</Link>
            )}
            <NavValuationButton />
            <NavViewingButton />
            <Link href="/pricing" className="nav-btn-outline">Pricing</Link>
            <Link href="/terms" className="nav-btn-outline">Terms</Link>
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
            }
            .hol-nav__logo-top { font-size: 14px; }
            .hol-nav__logo-sub { font-size: 9px; }
            .hol-nav__links {
              flex-wrap: nowrap;
              overflow-x: auto;
              gap: 6px;
              padding: 0;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .hol-nav__links::-webkit-scrollbar { display: none; }
            .nav-btn-primary, .nav-btn-outline, .hol-nav__link {
              font-size: 10px;
              padding: 6px 8px;
              white-space: nowrap;
              flex-shrink: 0;
            }
          }
        `}</style>
      </nav>
    </>
  );
}
