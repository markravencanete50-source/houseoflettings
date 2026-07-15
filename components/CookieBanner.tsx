'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('hol_cookie_consent');
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem('hol_cookie_consent', 'accepted'); } catch {}
    setVisible(false);
  };

  const manage = () => {
    try { localStorage.setItem('hol_cookie_consent', 'managed'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes hol-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes hol-slide-up {
          from { opacity: 0; transform: translate(-50%, -44%) scale(0.97) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
        .hol-cookie-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 9998;
          animation: hol-fade-in 0.25s ease;
        }
        .hol-cookie-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          background: #fff;
          border-radius: 20px;
          padding: 48px 40px 40px;
          max-width: 500px;
          width: calc(100% - 32px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.28);
          animation: hol-slide-up 0.32s cubic-bezier(0.34,1.56,0.64,1);
          text-align: center;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .hol-cookie-icon {
          width: 60px; height: 60px;
          background: #0f1f3d;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 22px;
          font-size: 26px;
        }
        .hol-cookie-title {
          font-size: 26px; font-weight: 700;
          color: #0f1f3d;
          margin: 0 0 14px;
          line-height: 1.2;
          font-family: Georgia, serif;
        }
        .hol-cookie-body {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.75;
          margin: 0 auto 32px;
          max-width: 380px;
        }
        .hol-cookie-body a {
          color: #2563a8;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .hol-cookie-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        /* Site-standard CTA size (as ServiceHero .btn). The pill radius is kept:
           it is this overlay's own look, only the size is standardised. */
        .hol-cookie-btn {
          display: inline-flex; align-items: center; justify-content: center;
          box-sizing: border-box; min-height: 48px; line-height: 1.2;
          padding: 14px 28px;
          border-radius: 999px;
          font-size: 13.5px; font-weight: 700; letter-spacing: .02em;
          cursor: pointer;
          transition: background 0.18s, color 0.18s, border-color 0.18s, transform 0.15s;
          min-width: 140px;
          font-family: inherit;
          border: 2px solid #0f1f3d;
        }
        .hol-cookie-btn--outline {
          background: transparent;
          color: #0f1f3d;
        }
        .hol-cookie-btn--outline:hover {
          background: #0f1f3d;
          color: #fff;
          transform: translateY(-1px);
        }
        .hol-cookie-btn--solid {
          background: #0f1f3d;
          color: #fff;
        }
        .hol-cookie-btn--solid:hover {
          background: #2563a8;
          border-color: #2563a8;
          transform: translateY(-1px);
        }
        @media (max-width: 480px) {
          .hol-cookie-modal { padding: 36px 24px 28px; }
          .hol-cookie-btns { flex-direction: column; align-items: stretch; }
          .hol-cookie-btn { width: 100%; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="hol-cookie-backdrop" onClick={accept} aria-hidden="true" />

      {/* Modal */}
      <div
        className="hol-cookie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hol-cookie-title"
      >
        <div className="hol-cookie-icon" aria-hidden="true">🍪</div>

        <h2 id="hol-cookie-title" className="hol-cookie-title">
          You&apos;re in control
        </h2>

        <p className="hol-cookie-body">
          We use cookies to provide the best experience on our website. To learn
          more about how we use cookies, please see our{' '}
          <Link href="/cookie-policy">Cookie Policy</Link>. You can manage your
          preferences now on this banner, or via your browser at anytime.
        </p>

        <div className="hol-cookie-btns">
          <button className="hol-cookie-btn hol-cookie-btn--outline" onClick={manage}>
            Manage
          </button>
          <button className="hol-cookie-btn hol-cookie-btn--solid" onClick={accept}>
            Accept
          </button>
        </div>
      </div>
    </>
  );
}
