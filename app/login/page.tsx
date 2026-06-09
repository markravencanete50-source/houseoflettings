'use client';
// app/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, getDashboardPath } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await signIn(email, password);
      router.push(getDashboardPath(user.role));
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please try again later.'
        : err.message || 'Sign in failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1f3d', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '80px 5% 40px',
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover no-repeat',
        opacity: 0.12, zIndex: 0,
      }} />
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,rgba(10,20,50,0.95) 0%,rgba(10,20,50,0.85) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img
              src="/images/logo_HOL.png"
              alt="House of Lettings"
              style={{ height: 80, width: 'auto', objectFit: 'contain' }}
            />
            <span style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '0.02em',
            }}>
              House of Lettings
            </span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 10, fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Sign in to your account
          </p>
        </div>

        <div style={{
          background: '#fff', borderRadius: 12, padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>
          {error && (
            <div style={{
              background: '#fce4ec', border: '1px solid #e57373', color: '#c62828',
              padding: '12px 16px', borderRadius: 6, marginBottom: 24, fontSize: 14,
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600,
              color: '#0f1f3d', letterSpacing: '0.05em', textTransform: 'uppercase',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid #e0ddd8',
                borderRadius: 6, fontSize: 15, color: '#0f1f3d', outline: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif', boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
              onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600,
              color: '#0f1f3d', letterSpacing: '0.05em', textTransform: 'uppercase',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{
                width: '100%', padding: '12px 14px', border: '1.5px solid #e0ddd8',
                borderRadius: 6, fontSize: 15, color: '#0f1f3d', outline: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif', boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
              onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', background: '#0f1f3d', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'background 0.2s',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c0392b'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0f1f3d'; }}
          >
            {loading ? 'Signing In…' : 'Sign In →'}
          </button>

          <p style={{
            textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#1d3557', fontWeight: 600, textDecoration: 'none' }}>
              Create one →
            </Link>
          </p>

          <div style={{ borderTop: '1px solid #e5e3dd', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
            <Link href="/admin-login" style={{
              fontSize: 13, color: '#9ca3af', textDecoration: 'none',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              Admin login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
