'use client';
// app/landlord-login/page.tsx
// The landlord's front door. Distinct from the staff team login: landlords use
// the credentials issued to them after registration (never self-register). Posts
// to /api/landlord-login, which mints the hol_session cookie, then routes to the
// portal. First-time users (mustResetPassword) are sent to the portal, which
// forces a password change before anything else loads.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandlordLoginPage() {
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
      const res = await fetch('/api/landlord-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || 'Sign in failed.'); setLoading(false); return; }
      router.push('/landlord-portal');
    } catch {
      setError('Could not reach the login service. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="ll-wrap">
      {/* Brand panel */}
      <div className="ll-brand">
        <div className="ll-aurora ll-a1" />
        <div className="ll-aurora ll-a2" />
        <div className="ll-aurora ll-a3" />
        <div className="ll-brand-inner">
          <Link href="/" className="ll-logo">House of Lettings</Link>
          <h1 className="ll-brand-title">Landlord<br />Portal</h1>
          <p className="ll-brand-sub">One calm place for your properties, tenant applications and maintenance — updated in real time.</p>
          <div className="ll-chips">
            {['Live portfolio view', 'Application tracking', 'Maintenance timeline'].map((c, i) => (
              <span key={c} className="ll-chip" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>✓ {c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="ll-form-panel">
        <div className="ll-card">
          <div className="ll-lock">🔑</div>
          <h2 className="ll-h2">Welcome back</h2>
          <p className="ll-muted">Sign in with the credentials we emailed you.</p>

          {error && <div className="ll-error">🚫 {error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="ll-label">Email</label>
            <input className="ll-input" type="email" value={email} autoComplete="username"
              onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />

            <label className="ll-label" style={{ marginTop: 16 }}>Password</label>
            <input className="ll-input" type="password" value={password} autoComplete="current-password"
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

            <div style={{ textAlign: 'right', margin: '10px 0 4px' }}>
              <Link href="/landlord-access" className="ll-link">Forgot / reset password →</Link>
            </div>

            <button type="submit" disabled={loading} className="ll-btn">
              {loading ? 'Signing in…' : 'Sign in to portal →'}
            </button>
          </form>

          <div className="ll-divider"><span>New here?</span></div>
          <p className="ll-muted" style={{ textAlign: 'center', fontSize: 13 }}>
            Landlord accounts are created automatically once you complete{' '}
            <Link href="/landlord-registration" className="ll-link">registration</Link>. Already registered but no login?{' '}
            <Link href="/landlord-access" className="ll-link">Request access</Link>.
          </p>
        </div>
        <Link href="/" className="ll-back">← Back to website</Link>
      </div>

      <style>{`
        .ll-wrap { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; font-family: 'Poppins', sans-serif; background: #0a162f; }
        .ll-brand { position: relative; overflow: hidden; background: radial-gradient(120% 120% at 0% 0%, #14294f 0%, #0a162f 55%); display: flex; align-items: center; }
        .ll-aurora { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; animation: ll-float 14s ease-in-out infinite; }
        .ll-a1 { width: 460px; height: 460px; background: #c0392b; top: -120px; left: -80px; }
        .ll-a2 { width: 380px; height: 380px; background: #2563eb; bottom: -100px; right: -60px; animation-delay: -4s; }
        .ll-a3 { width: 300px; height: 300px; background: #00b8a0; top: 40%; left: 30%; opacity: .28; animation-delay: -8s; }
        @keyframes ll-float { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-30px) scale(1.12); } 66% { transform: translate(-30px,20px) scale(.94); } }
        .ll-brand-inner { position: relative; z-index: 2; padding: 8% 9%; color: #fff; animation: ll-in .9s cubic-bezier(.22,1,.36,1); }
        @keyframes ll-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .ll-logo { font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: rgba(255,255,255,.65); text-decoration: none; }
        .ll-brand-title { font-size: clamp(40px, 5vw, 66px); font-weight: 800; line-height: 1.02; margin: 26px 0 20px; letter-spacing: -1.5px; }
        .ll-brand-sub { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,.72); max-width: 400px; }
        .ll-chips { display: flex; flex-direction: column; gap: 12px; margin-top: 34px; }
        .ll-chip { font-size: 14px; color: rgba(255,255,255,.9); opacity: 0; animation: ll-chip-in .7s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes ll-chip-in { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        .ll-form-panel { background: #f5f7fb; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; gap: 18px; }
        .ll-card { width: 100%; max-width: 400px; background: #fff; border: 1px solid #e7ebf3; border-radius: 20px; padding: 40px 36px; box-shadow: 0 24px 60px rgba(10,22,47,.10); animation: ll-in .8s .1s both cubic-bezier(.22,1,.36,1); }
        .ll-lock { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg,#c0392b,#e05648); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px; box-shadow: 0 10px 24px rgba(192,57,43,.32); }
        .ll-h2 { font-size: 26px; font-weight: 800; color: #0a162f; margin: 0 0 6px; letter-spacing: -.5px; }
        .ll-muted { color: #6b7280; font-size: 14px; margin: 0 0 22px; line-height: 1.6; }
        .ll-label { display: block; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #8a94a3; margin-bottom: 8px; }
        .ll-input { width: 100%; box-sizing: border-box; padding: 13px 15px; border: 1.5px solid #e2e7f0; border-radius: 11px; font-size: 15px; color: #0a162f; outline: none; transition: border-color .2s, box-shadow .2s; font-family: inherit; }
        .ll-input:focus { border-color: #c0392b; box-shadow: 0 0 0 4px rgba(192,57,43,.10); }
        .ll-btn { width: 100%; margin-top: 22px; padding: 15px; border: none; border-radius: 11px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: .02em; transition: transform .15s, box-shadow .2s, opacity .2s; box-shadow: 0 12px 26px rgba(192,57,43,.28); }
        .ll-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(192,57,43,.36); }
        .ll-btn:disabled { opacity: .7; cursor: not-allowed; }
        .ll-link { color: #c0392b; font-weight: 600; text-decoration: none; font-size: 13px; }
        .ll-link:hover { text-decoration: underline; }
        .ll-error { background: #fdecea; border: 1px solid #f5c6c0; color: #b3261e; padding: 12px 15px; border-radius: 10px; font-size: 13.5px; margin-bottom: 18px; }
        .ll-divider { display: flex; align-items: center; gap: 12px; margin: 26px 0 16px; color: #b6bfce; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }
        .ll-divider::before, .ll-divider::after { content: ''; height: 1px; background: #e7ebf3; flex: 1; }
        .ll-back { color: #9aa4b2; font-size: 13px; text-decoration: none; }
        .ll-back:hover { color: #6b7280; }
        @media (max-width: 900px) { .ll-wrap { grid-template-columns: 1fr; } .ll-brand { min-height: 300px; } .ll-brand-inner { padding: 44px 32px; } }
      `}</style>
    </div>
  );
}
