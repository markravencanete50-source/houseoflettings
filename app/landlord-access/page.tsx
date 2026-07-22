'use client';
// app/landlord-access/page.tsx
// For landlords who registered before the portal existed (or never activated),
// and doubles as the "reset password" entry point. Enter your email → we email a
// one-time activation link if a registration is on file. The response is always
// the same generic success, so this never reveals whether an email is registered.
import { useState } from 'react';
import Link from 'next/link';

export default function LandlordAccessPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await fetch('/api/landlord/request-access', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="la-wrap">
      <div className="la-aurora la-1" />
      <div className="la-aurora la-2" />
      <div className="la-card">
        <Link href="/" className="la-logo">House of Lettings</Link>
        <div className="la-ico">{sent ? '📨' : '🔑'}</div>
        {sent ? (
          <>
            <h1>Check your inbox</h1>
            <p>If <strong>{email}</strong> matches a landlord registration, we've emailed a secure link to set your password and activate your portal. It expires in 24 hours.</p>
            <Link href="/landlord-login" className="la-btn">Back to login</Link>
          </>
        ) : (
          <>
            <h1>Access your portal</h1>
            <p>Registered before but never received a login — or need to reset your password? Enter the email on your registration and we'll send an activation link.</p>
            <form onSubmit={submit}>
              <input className="la-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
              <button className="la-btn" disabled={busy}>{busy ? 'Sending…' : 'Send activation link →'}</button>
            </form>
            <p className="la-fine">Just completed registration? Your credentials were emailed automatically — <Link href="/landlord-login" className="la-link">log in here</Link>.</p>
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
        .la-ico { width: 60px; height: 60px; margin: 18px auto 20px; border-radius: 17px; background: linear-gradient(135deg,#c0392b,#e05648); display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 12px 28px rgba(192,57,43,.32); }
        .la-card h1 { font-size: 25px; font-weight: 800; color: #0a162f; margin: 0 0 12px; letter-spacing: -.5px; }
        .la-card p { color: #6b7280; font-size: 14.5px; line-height: 1.65; margin: 0 0 22px; }
        .la-input { width: 100%; box-sizing: border-box; padding: 13px 15px; border: 1.5px solid #e2e7f0; border-radius: 11px; font-size: 15px; outline: none; font-family: inherit; margin-bottom: 14px; transition: border-color .2s, box-shadow .2s; }
        .la-input:focus { border-color: #c0392b; box-shadow: 0 0 0 4px rgba(192,57,43,.10); }
        .la-btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px; border: none; border-radius: 11px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: none; transition: transform .15s; }
        .la-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .la-btn:disabled { opacity: .7; }
        .la-fine { font-size: 12.5px; color: #9aa4b2; margin: 20px 0 0; }
        .la-link { color: #c0392b; font-weight: 600; text-decoration: none; }
      `}</style>
    </div>
  );
}
