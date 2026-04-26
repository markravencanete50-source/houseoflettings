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

  const handleSubmit = async (e: React.FormEvent) => {
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
      minHeight: '100vh', background: 'var(--black)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '80px 5% 40px',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover no-repeat',
        opacity: 0.12, zIndex: 0,
      }} />
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,rgba(10,10,10,0.95) 0%,rgba(10,10,10,0.85) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
            color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 10 }}>
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
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: 'var(--black)', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                letterSpacing: '0.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--black)'; }}
            >
              {loading ? 'Signing In…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-600)', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--red)', fontWeight: 600 }}>
              Create one →
            </Link>
          </p>

          <div style={{
            borderTop: '1px solid var(--gray-200)', marginTop: 24, paddingTop: 20,
            textAlign: 'center',
          }}>
            <Link href="/admin-login" style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              Admin login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
