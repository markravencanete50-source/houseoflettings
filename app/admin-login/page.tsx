'use client';
// app/admin-login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, getDashboardPath } from '@/services/auth';

export default function AdminLoginPage() {
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
      if (user.role !== 'admin' && user.role !== 'staff') {
        setError('Access denied. This login is for House of Lettings staff and administrators only.');
        return;
      }
      router.push(getDashboardPath(user.role));
    } catch (err: any) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid credentials.'
          : err.message || 'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: '#c0392b', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px',
          }}>🔒</div>
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 28, fontWeight: 700,
            color: '#fff', marginBottom: 8,
          }}>
            Team Login
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Restricted to House of Lettings staff and administrators
          </p>
        </div>

        <div style={{
          background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '36px 32px',
        }}>
          {error && (
            <div style={{
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
              color: '#ff6b6b', padding: '12px 16px', borderRadius: 6,
              marginBottom: 24, fontSize: 14, fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              🚫 {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@houseoflettings.co.uk"
                required
                style={{
                  width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, fontSize: 14, color: '#fff', outline: 'none',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#c0392b'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, fontSize: 14, color: '#fff', outline: 'none',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#c0392b'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <button
              type="submit"
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
              {loading ? 'Verifying…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.25)', fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
