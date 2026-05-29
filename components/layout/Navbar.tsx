'use client';
// components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth';

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
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

  // ── Styles ────────────────────────────────────────────────

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 72,
    display: 'flex',
    alignItems: 'center',
    padding: '0 5%',
    background: scrolled
      ? 'rgba(255,255,255,0.97)'
      : 'rgba(255,255,255,1)',
    borderBottom: '1px solid #e5e3dd',
    boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.08)' : 'none',
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
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20,
    fontWeight: 700,
    color: '#1d3557',
    letterSpacing: '-0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    flexShrink: 0,
  };

  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    background: '#c9a96e',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  };

  const desktopLinksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    color: '#4a4844',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    transition: 'color 0.2s',
    padding: '4px 0',
    borderBottom: '1.5px solid transparent',
  };

  const btnOutlineStyle: React.CSSProperties = {
    padding: '9px 20px',
    border: '1.5px solid #1d3557',
    color: '#1d3557',
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

  const btnPrimaryStyle: React.CSSProperties = {
    padding: '9px 20px',
    background: '#1d3557',
    color: '#fff',
    border: '1.5px solid #1d3557',
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

  const hamburgerStyle: React.CSSProperties = {
    display: 'none',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    gap: 5,
    width: 40,
    height: 40,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    borderRadius: 4,
    flexShrink: 0,
  };

  const barStyle = (open: boolean, nth: 1|2|3): React.CSSProperties => ({
    width: '100%',
    height: 2,
    background: '#1d3557',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    transformOrigin: 'center',
    transform:
      open && nth === 1 ? 'translateY(7px) rotate(45deg)' :
      open && nth === 2 ? 'scaleX(0) translateX(20px)' :
      open && nth === 3 ? 'translateY(-7px) rotate(-45deg)' :
      'none',
    opacity: open && nth === 2 ? 0 : 1,
  });

  // Mobile menu overlay
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 99,
    background: 'rgba(0,0,0,0.4)',
    opacity: menuOpen ? 1 : 0,
    pointerEvents: menuOpen ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  };

  // Mobile drawer
  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 101,
    width: 'min(320px, 85vw)',
    background: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
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
    borderBottom: '1px solid #e5e3dd',
  };

  const drawerLinkStyle: React.CSSProperties = {
    display: 'block',
    padding: '16px 24px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: '#1a1a1a',
    textDecoration: 'none',
    borderBottom: '1px solid #f3f2ef',
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
    width: '100%',
    padding: '14px 20px',
    background: '#1d3557',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    transition: 'background 0.2s',
  };

  const drawerBtnOutline: React.CSSProperties = {
    width: '100%',
    padding: '14px 20px',
    background: 'transparent',
    color: '#1d3557',
    border: '1.5px solid #1d3557',
    borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
  };

  return (
    <>
      <nav style={navStyle}>
        <div style={innerStyle}>
          {/* Logo */}
          <Link href="/" style={logoStyle}>
            <span style={dotStyle} />
            House of Lettings
          </Link>

          {/* Desktop Nav Links */}
          <div
            style={desktopLinksStyle}
            className="desktop-nav"
          >
            <Link href="/listings" style={linkStyle}>Browse</Link>

            {!loading && profile && (
              <Link href={dashLink} style={linkStyle}>Dashboard</Link>
            )}

            {!loading && (
              profile ? (
                <button
                  onClick={handleSignOut}
                  style={btnOutlineStyle}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#1d3557';
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#1d3557';
                  }}
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={btnOutlineStyle}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#1d3557';
                      (e.currentTarget as HTMLElement).style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#1d3557';
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    style={btnPrimaryStyle}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#0f1f36';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#1d3557';
                    }}
                  >
                    List Property
                  </Link>
                </>
              )
            )}
          </div>

          {/* Hamburger — visible on mobile via CSS */}
          <button
            style={hamburgerStyle}
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

        {/* Inline responsive CSS */}
        <style>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .hamburger-btn { display: flex !important; }
          }
          @media (min-width: 769px) {
            .hamburger-btn { display: none !important; }
          }
        `}</style>
      </nav>

      {/* Mobile Overlay */}
      <div
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside
        style={drawerStyle}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        <div style={drawerHeaderStyle}>
          <Link href="/" style={{ ...logoStyle, fontSize: 18 }} onClick={() => setMenuOpen(false)}>
            <span style={dotStyle} />
            House of Lettings
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 36, height: 36, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 4, color: '#4a4844',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <Link href="/listings" style={drawerLinkStyle}>Browse Properties</Link>

        {!loading && profile && (
          <Link href={dashLink} style={drawerLinkStyle}>Dashboard</Link>
        )}

        <div style={drawerActionsStyle}>
          {!loading && (
            profile ? (
              <button onClick={handleSignOut} style={drawerBtnOutline}>
                Sign Out
              </button>
            ) : (
              <>
                <Link href="/register" style={drawerBtnPrimary}>
                  List Your Property
                </Link>
                <Link href="/login" style={drawerBtnOutline}>
                  Sign In
                </Link>
              </>
            )
          )}
        </div>
      </aside>
    </>
  );
}
