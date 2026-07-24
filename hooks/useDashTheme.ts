'use client';
// hooks/useDashTheme.ts
// Light/dark preference for the admin & staff dashboards, persisted in
// localStorage. The pages put `data-dash-theme` on the `.dash-layout` wrapper;
// the CSS in globals.css does the theming.
import { useEffect, useState } from 'react';

export function useDashTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try { setDark(localStorage.getItem('hol-dash-theme') === 'dark'); } catch { /* no storage */ }
  }, []);
  const toggle = () => setDark(d => {
    const next = !d;
    try { localStorage.setItem('hol-dash-theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
    return next;
  });
  return { dark, toggle };
}
