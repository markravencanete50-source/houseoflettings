'use client';
// components/analytics/VisitorTracker.tsx
// Fires a lightweight page-view beacon to /api/track on every route change.
// A persistent visitor id (localStorage) lets the server count unique visitors;
// the country is added server-side from Vercel geo headers. Honours Do Not Track
// and never counts admin/dashboard views.
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return;
    if (lastPath.current === pathname) return; // dedupe StrictMode double-fire
    lastPath.current = pathname;

    if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1')) return;

    let visitorId = '';
    let isNewVisitor = false;
    try {
      visitorId = localStorage.getItem('hol-visitor-id') || '';
      if (!visitorId) {
        visitorId =
          (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('hol-visitor-id', visitorId);
        isNewVisitor = true;
      }
    } catch {
      /* private mode, still count the view, just not the unique */
    }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || '', visitorId, isNewVisitor }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
