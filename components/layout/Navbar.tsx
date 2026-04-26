'use client';
// components/layout/Navbar.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth';

export default function Navbar() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const dashLink = profile?.role === 'landlord'
    ? '/dashboard/landlord'
    : profile?.role === 'tenant'
    ? '/dashboard/tenant'
    : '/admin';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,10,0.94)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 5%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700,
          color: '#fff', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
          House of Lettings
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/listings" style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500,
            letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'color .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          >
            Browse
          </Link>

          {!loading && (
            <>
              {profile ? (
                <>
                  <Link href={dashLink} style={{
                    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} style={{
                    padding: '9px 20px', border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff', background: 'transparent', borderRadius: 4,
                    fontSize: 13, fontWeight: 500, letterSpacing: '0.3px', cursor: 'pointer',
                    transition: 'all .2s',
                  }}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{
                    padding: '9px 20px', border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff', background: 'transparent', borderRadius: 4,
                    fontSize: 13, fontWeight: 500, letterSpacing: '0.3px', display: 'block',
                  }}>
                    Sign In
                  </Link>
                  <Link href="/register" style={{
                    padding: '9px 20px', background: 'var(--red)', color: '#fff',
                    border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
                    display: 'block',
                  }}>
                    List Property
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
