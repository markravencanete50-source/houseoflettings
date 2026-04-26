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
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
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

  const roleCard = (r: UserRole, icon: string, label: string, desc: string) => (
    <button
      type="button"
      onClick={() => setRole(r)}
      style={{
        flex: 1, padding: '18px 14px', border: `2px solid ${role === r ? 'var(--red)' : 'var(--gray-200)'}`,
        borderRadius: 8, background: role === r ? '#fff5f5' : '#fff',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{desc}</div>
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '80px 5% 40px',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=80) center/cover',
        opacity: 0.12, zIndex: 0,
      }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.92)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700,
            color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', display: 'inline-block' }} />
            House of Lettings
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 10 }}>
            Create your account
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

          {/* Role Selection */}
          <div style={{ marginBottom: 28 }}>
            <div className="form-label" style={{ marginBottom: 12 }}>I am a…</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {roleCard('landlord', '🏠', 'Landlord', 'List properties')}
              {roleCard('tenant', '🔑', 'Tenant', 'Find a home')}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="John" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Smith" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Create a secure password (8+ chars)" required />
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+44 7700 900000" />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: 14, background: 'var(--red)', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                letterSpacing: '0.5px', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating Account…' : 'Create My Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-600)', marginTop: 24 }}>
            Already registered?{' '}
            <Link href="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
