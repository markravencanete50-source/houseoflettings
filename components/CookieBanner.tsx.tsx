'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const manage = () => {
    localStorage.setItem('cookie_consent', 'managed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9998,
        animation: 'fadeIn 0.25s ease',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: '#fff',
        borderRadius: 16,
        padding: '48px 40px 40px',
        maxWidth: 500,
        width: 'calc(100% - 40px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.3s ease',
        textAlign: 'center',
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%) } to { opacity: 1; transform: translate(-50%, -50%) } }
        `}</style>

        {/* Icon */}
        <div style={{
          width: 56, height: 56,
          background: 'var(--black)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 24,
        }}>
          🍪
        </div>

        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26, fontWeight: 700,
          color: 'var(--black)',
          marginBottom: 14,
          lineHeight: 1.2,
        }}>
          You&apos;re in control
        </h2>

        <p style={{
          fontSize: 14,
          color: '#6b7280',
          lineHeight: 1.7,
          marginBottom: 28,
          maxWidth: 380,
          margin: '0 auto 28px',
        }}>
          We use cookies to provide the best experience on our website. To learn more about how we use cookies, please see our{' '}
          <Link href="/cookie-policy" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 600 }}>
            Cookie Policy
          </Link>
          . You can manage your preferences now or accept all cookies.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={manage}
            style={{
              padding: '14px 32px',
              background: 'transparent',
              color: 'var(--black)',
              border: '2px solid var(--black)',
              borderRadius: 50,
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 140,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--black)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--black)';
            }}
          >
            Manage
          </button>
          <button
            onClick={accept}
            style={{
              padding: '14px 32px',
              background: 'var(--black)',
              color: '#fff',
              border: '2px solid var(--black)',
              borderRadius: 50,
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 140,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--red)';
              e.currentTarget.style.borderColor = 'var(--red)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--black)';
              e.currentTarget.style.borderColor = 'var(--black)';
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </>
  );
}
