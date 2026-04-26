'use client';
// app/admin-login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/services/auth';

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
      if (user.role !== 'admin') {
        setError('Access denied. This login is for administrators only.');
        return;
      }
      router.push('/admin');
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
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--red)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px',
          }}>🔒</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700,
            color: '#fff', marginBottom: 8,
          }}>
            Admin Access
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Restricted to authorised administrators only
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
              marginBottom: 24, fontSize: 14,
            }}>
              🚫 {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@houseoflettings.co.uk"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, fontSize: 14, color: '#fff', outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, fontSize: 14, color: '#fff', outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--red)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: 14, background: 'var(--red)', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying…' : 'Enter Admin Panel →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.4)' }}>← Back to main login</Link>
        </p>
      </div>
    </div>
  );
}
