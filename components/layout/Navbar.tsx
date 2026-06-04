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
        style={{
          padding: '8px 16px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
        onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
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
        style={{
          padding: '8px 16px',
          background: 'transparent',
          color: '#fff',
          border: '1.5px solid rgba(255,255,255,0.6)',
          borderRadius: 4,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#2563eb';
          e.currentTarget.style.borderColor = '#2563eb';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
        }}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const dashLink =
    profile?.role === 'landlord' ? '/dashboard/landlord' :
    profile?.role === 'tenant'   ? '/dashboard/tenant'   : '/admin';

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    height: 72,
    display: 'flex',
    alignItems: 'center',
    padding: '0 5%',
    background: scrolled ? 'rgba(10,22,47,0.97)' : 'rgba(10,22,47,0.85)',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
    boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.3)' : 'none',
    transition: 'box-shadow 0.3s ease, background 0.3s ease',
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    flexShrink: 0,
    lineHeight: 1.2,
  };

  const logoTopStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.2px',
  };

  const logoSubStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  };

  const desktopLinksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    transition: 'color 0.2s',
    padding: '4px 0',
  };

  const btnOutlineStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1.5px solid rgba(255,255,255,0.5)',
    color: '#ffffff',
    background: 'transparent',
    borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.2s',
  };

  const barStyle = (open: boolean, nth: 1|2|3): React.CSSProperties => ({
    width: '100%',
    height: 2,
    background: '#ffffff',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    transformOrigin: 'center',
    transform:
      open && nth === 1 ? 'translateY(7px) rotate(45deg)' :
      open && nth === 2 ? 'scaleX(0)' :
      open && nth === 3 ? 'translateY(-7px) rotate(-45deg)' : 'none',
    opacity: open && nth === 2 ? 0 : 1,
  });

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 99,
    background: 'rgba(0,0,0,0.5)',
    opacity: menuOpen ? 1 : 0,
    pointerEvents: menuOpen ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  };

  const drawerStyle: React.CSSProperties = {
    position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
    width: 'min(320px, 85vw)',
    background: '#0a162f',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
    transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 32px',
  };

  const drawerHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  };

  const drawerLinkStyle: React.CSSProperties = {
    display: 'block',
    padding: '16px 24px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: '#ffffff',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    letterSpacing: '0.01em',
  };

  const drawerActionsStyle: React.CSSProperties = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 'auto',
  };

  const drawerBtnPrimary: React.CSSProperties = {
    width: '100%', padding: '14px 20px',
    background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer', textDecoration: 'none',
    display: 'block', textAlign: 'center' as const,
  };

  const drawerBtnOutline: React.CSSProperties = {
    width: '100%', padding: '14px 20px',
    background: 'transparent', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.4)',
    borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer', textDecoration: 'none',
    display: 'block', textAlign: 'center' as const,
  };

  return (
    <>
      <nav style={navStyle}>
        <div style={innerStyle}>

          {/* Logo */}
          <Link href="/" style={logoStyle}>
            <span style={logoTopStyle}>
              House of Lettings
            </span>
            <span style={logoSubStyle}>Leeds &amp; Manchester</span>
          </Link>

          {/* Desktop Nav */}
          <div style={desktopLinksStyle} className="desktop-nav">
            <Link href="/listings" style={linkStyle}>Browse</Link>

            {!loading && profile && (
              <Link href={dashLink} style={linkStyle}>Dashboard</Link>
            )}

            {/* CTA buttons always visible */}
            <NavValuationButton />
            <NavViewingButton />

            {!loading && (
              profile ? (
                <button onClick={handleSignOut} style={btnOutlineStyle}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Sign Out
                </button>
              ) : (
                <Link href="/login" style={btnOutlineStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  Sign In
                </Link>
              )
            )}
          </div>

          {/* Hamburger */}
          <button
            style={{ display: 'none', flexDirection: 'column' as const, justifyContent: 'center', gap: 5, width: 40, height: 40, background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 4, flexShrink: 0 }}
            className="hamburger-btn"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span style={barStyle(menuOpen, 1)} />
            <span style={barStyle(menuOpen, 2)} />
            <span style={barStyle(menuOpen, 3)} />
          </button>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .desktop-nav { display: none !important; }
            .hamburger-btn { display: flex !important; }
          }
          @media (min-width: 901px) {
            .hamburger-btn { display: none !important; }
          }
        `}</style>
      </nav>

      {/* Mobile Overlay */}
      <div style={overlayStyle} onClick={() => setMenuOpen(false)} aria-hidden="true" />

      {/* Mobile Drawer */}
      <aside style={drawerStyle} role="dialog" aria-label="Navigation menu" aria-modal="true">
        <div style={drawerHeaderStyle}>
          <Link href="/" style={{ ...logoStyle }} onClick={() => setMenuOpen(false)}>
            <span style={{ ...logoTopStyle, fontSize: 16 }}>House of Lettings</span>
            <span style={logoSubStyle}>Leeds &amp; Manchester</span>
          </Link>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#fff' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <Link href="/listings" style={drawerLinkStyle} onClick={() => setMenuOpen(false)}>Browse Properties</Link>
        {!loading && profile && (
          <Link href={dashLink} style={drawerLinkStyle} onClick={() => setMenuOpen(false)}>Dashboard</Link>
        )}

        <div style={drawerActionsStyle}>
          <NavValuationButton />
          <NavViewingButton />
          {!loading && (
            profile ? (
              <button onClick={handleSignOut} style={drawerBtnOutline}>Sign Out</button>
            ) : (
              <Link href="/login" style={drawerBtnOutline} onClick={() => setMenuOpen(false)}>Sign In</Link>
            )
          )}
        </div>
      </aside>
    </>
  );
}
