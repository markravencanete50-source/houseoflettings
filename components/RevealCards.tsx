'use client';
// components/RevealCards.tsx
// Drop one <RevealCards/> anywhere on a page to enable the staggered scroll-in
// for every element marked `.hol-reveal`. It flags <body> with `hol-js` (so the
// reveal CSS only hides-then-animates when scripting is present) and reveals
// each card as it scrolls into view. Renders nothing.
import { useEffect } from 'react';

export default function RevealCards() {
  useEffect(() => {
    document.body.classList.add('hol-js');
    const els = Array.from(document.querySelectorAll('.hol-reveal'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('hol-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('hol-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
