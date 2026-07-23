'use client';
// app/landlord-portal/layout.tsx
// Wraps every /landlord-portal/* route. Owns the portal-wide dark mode: it sets
// data-portal-theme on <html> from localStorage and renders one floating toggle
// that flips it, so a single switch themes the whole portal (overview, my
// properties, applications, maintenance, property pages, packages …). Each page
// keys its dark CSS off :root[data-portal-theme="dark"].
import { useEffect, useState } from 'react';

const THEME_KEY = 'hol-portal-theme';

export default function LandlordPortalLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let initial = false;
    try { initial = localStorage.getItem(THEME_KEY) === 'dark'; } catch { /* ignore */ }
    setDark(initial);
    document.documentElement.setAttribute('data-portal-theme', initial ? 'dark' : 'light');
    return () => { document.documentElement.removeAttribute('data-portal-theme'); };
  }, []);

  const toggle = () => setDark(d => {
    const next = !d;
    try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-portal-theme', next ? 'dark' : 'light');
    return next;
  });

  return (
    <>
      {children}
      <button className="hol-theme-fab" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>{dark ? '☀️' : '🌙'}</span>
        <span>{dark ? 'Light' : 'Dark'}</span>
      </button>
      <style>{`
        .hol-theme-fab {
          position: fixed; right: 20px; bottom: 20px; z-index: 1000;
          display: inline-flex; align-items: center; gap: 7px;
          background: #0a162f; color: #fff; border: 1px solid rgba(255,255,255,.18);
          border-radius: 30px; padding: 11px 16px;
          font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.30);
          transition: transform .15s ease, background .2s ease;
        }
        .hol-theme-fab:hover { transform: translateY(-2px); }
        :root[data-portal-theme="dark"] .hol-theme-fab { background: #1d4ed8; border-color: rgba(255,255,255,.14); }
      `}</style>
    </>
  );
}
