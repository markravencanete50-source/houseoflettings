'use client';
// components/branches/Reveal.tsx
// Lightweight scroll-reveal wrapper. Uses a single IntersectionObserver, only
// animates transform + opacity (GPU-composited, no layout/paint), unobserves
// after the first reveal, and fully disables under prefers-reduced-motion.
// No animation library, keeps the branch pages fast.
import { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** stagger in ms so a row of items cascades in */
  delay?: number;
  /** starting vertical offset in px */
  y?: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

export default function Reveal({
  children,
  delay = 0,
  y = 22,
  as = 'div',
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion and older browsers: show immediately.
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as any;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
