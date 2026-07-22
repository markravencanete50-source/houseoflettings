'use client';
// app/landlord-activate/page.tsx
// Landing page for the one-time activation link. Validates the token, lets the
// landlord choose their password, then signs them straight into the portal.
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PasswordInput } from '@/components/landlord/PasswordInput';

function ActivateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [state, setState] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !email) { setState('invalid'); return; }
    fetch(`/api/landlord/activate?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(r => r.json()).then(d => {
        if (d.valid) { setState('valid'); setName(d.name || ''); } else setState('invalid');
      }).catch(() => setState('invalid'));
  }, [token, email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (pw.length < 8) { setErr('Use at least 8 characters.'); return; }
    if (pw !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const r = await fetch('/api/landlord/activate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, password: pw }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) router.replace('/landlord-portal');
    else setErr(d.message || 'Could not activate your account.');
  };

  return (
    <div className="la-wrap">
      <div className="la-aurora la-1" /><div className="la-aurora la-2" />
      <div className="la-card">
        <Link href="/" className="la-logo">House of Lettings</Link>
        <div className="la-ico">🔐</div>
        {state === 'checking' && <><h1>Checking your link…</h1><div className="la-spin" /></>}
        {state === 'invalid' && (
          <>
            <h1>Link expired</h1>
            <p>This activation link is invalid or has already been used. Request a fresh one and we'll email it right over.</p>
            <Link href="/landlord-access" className="la-btn">Request a new link</Link>
          </>
        )}
        {state === 'valid' && (
          <>
            <h1>{name ? `Hi ${name.split(' ')[0]},` : 'Almost there'}</h1>
            <p>Choose a password for <strong>{email}</strong> to activate your Landlord Portal.</p>
            {err && <div className="la-err">⚠️ {err}</div>}
            <form onSubmit={submit}>
              <PasswordInput className="la-input" style={{ marginBottom: 14 }} placeholder="New password (min 8 chars)" value={pw} onChange={setPw} required autoComplete="new-password" />
              <PasswordInput className="la-input" style={{ marginBottom: 14 }} placeholder="Confirm password" value={confirm} onChange={setConfirm} required autoComplete="new-password" />
              <button className="la-btn" disabled={busy}>{busy ? 'Activating…' : 'Activate & enter portal →'}</button>
            </form>
          </>
        )}
      </div>
      <style>{`
        .la-wrap { margin-top: -72px; min-height: 100vh; background: radial-gradient(120% 120% at 10% 0%, #14294f, #0a162f 60%); display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Poppins', sans-serif; position: relative; overflow: hidden; }
        .la-aurora { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; animation: la-float 15s ease-in-out infinite; }
        .la-1 { width: 460px; height: 460px; background: #c0392b; top: -140px; left: -100px; }
        .la-2 { width: 400px; height: 400px; background: #2563eb; bottom: -140px; right: -100px; animation-delay: -5s; }
        @keyframes la-float { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(40px,-30px) scale(1.14) } }
        .la-card { position: relative; z-index: 2; width: 100%; max-width: 440px; background: #fff; border-radius: 22px; padding: 44px 40px; box-shadow: 0 30px 80px rgba(0,0,0,.4); text-align: center; animation: la-in .8s cubic-bezier(.22,1,.36,1); }
        @keyframes la-in { from { opacity: 0; transform: translateY(24px) scale(.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .la-logo { font-size: 11px; letter-spacing: .24em; text-transform: uppercase; color: #9aa4b2; text-decoration: none; }
        .la-ico { width: 60px; height: 60px; margin: 18px auto 20px; border-radius: 17px; background: linear-gradient(135deg,#0a162f,#22406f); display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .la-card h1 { font-size: 25px; font-weight: 800; color: #0a162f; margin: 0 0 12px; letter-spacing: -.5px; }
        .la-card p { color: #6b7280; font-size: 14.5px; line-height: 1.65; margin: 0 0 22px; }
        .la-input { width: 100%; box-sizing: border-box; padding: 13px 15px; border: 1.5px solid #e2e7f0; border-radius: 11px; font-size: 15px; outline: none; font-family: inherit; margin-bottom: 14px; transition: border-color .2s, box-shadow .2s; }
        .la-input:focus { border-color: #c0392b; box-shadow: 0 0 0 4px rgba(192,57,43,.10); }
        .la-btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px; border: none; border-radius: 11px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: none; transition: transform .15s; }
        .la-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .la-btn:disabled { opacity: .7; }
        .la-err { background: #fdecea; color: #b3261e; padding: 11px 14px; border-radius: 9px; font-size: 13px; margin-bottom: 14px; }
        .la-spin { width: 34px; height: 34px; margin: 8px auto 0; border: 3px solid #eef1f6; border-top-color: #c0392b; border-radius: 50%; animation: la-rot .8s linear infinite; }
        @keyframes la-rot { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

export default function LandlordActivatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a162f' }} />}>
      <ActivateInner />
    </Suspense>
  );
}
