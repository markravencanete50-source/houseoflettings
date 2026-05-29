'use client';
// app/register/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, getDashboardPath } from '@/services/auth';
import { UserRole } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('tenant');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const user = await signUp(email, password, fullName, role, phone);
      router.push(getDashboardPath(user.role));
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err.code === 'auth/weak-password'
        ? 'Password is too weak. Use at least 8 characters.'
        : err.message || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e0ddd8',
    borderRadius: 6, fontSize: 15, color: '#0f1f3d', outline: 'none',
    fontFamily: 'Georgia, "Times New Roman", serif', boxSizing: 'border-box',
    marginTop: 6, background: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#0f1f3d',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  const roleCard = (r: UserRole, icon: string, label: string, desc: string) => (
    <button
      type="button"
      onClick={() => setRole(r)}
      style={{
        flex: 1, padding: '18px 14px',
        border: `2px solid ${role === r ? '#c0392b' : '#e0ddd8'}`,
        borderRadius: 8, background: role === r ? '#fff5f5' : '#fff',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', marginBottom: 2, fontFamily: 'Georgia, "Times New Roman", serif' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Georgia, "Times New Roman", serif' }}>{desc}</div>
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1f3d', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '80px 5% 40px',
      fontFamily: 'Georgia, "Times New Roman", serif',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover',
        opacity: 0.12, zIndex: 0,
      }} />
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,rgba(10,20,50,0.95) 0%,rgba(10,20,50,0.85) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{
            fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, fontWeight: 700,
            color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          }}>
            <span style={{ width: 8, height: 8, background: '#c9a96e', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 10, fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Create your account
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '40px 36px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
          {error && (
            <div style={{
              background: '#fce4ec', border: '1px solid #e57373', color: '#c62828',
              padding: '12px 16px', borderRadius: 6, marginBottom: 24, fontSize: 14,
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>⚠ {error}</div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>I am a…</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {roleCard('landlord', '🏠', 'Landlord', 'List properties')}
              {roleCard('tenant', '🔑', 'Tenant', 'Find a home')}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="John" required style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Smith" required style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
                onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Create a secure password (8+ chars)" required style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
                onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+44 7700 900000" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#1d3557'}
                onBlur={e => e.currentTarget.style.borderColor = '#e0ddd8'} />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#0f1f3d', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                letterSpacing: '0.5px', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s', fontFamily: 'Georgia, "Times New Roman", serif',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c0392b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0f1f3d'; }}
            >
              {loading ? 'Creating Account…' : 'Create My Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24, fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Already registered?{' '}
            <Link href="/login" style={{ color: '#1d3557', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
