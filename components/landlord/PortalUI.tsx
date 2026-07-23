'use client';
// components/landlord/PortalUI.tsx
// Self-contained, dependency-free animated primitives for the Landlord Portal.
// Everything is CSS keyframes + inline SVG so it passes the site's strict CSP
// (no external chart libraries). All motion respects prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Tracks the portal-wide dark theme (data-portal-theme on <html>, set by the
 *  landlord-portal layout). Re-renders when it flips so charts recolour live. */
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.getAttribute('data-portal-theme') === 'dark');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-portal-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/** Count-up number. Animates from 0 → value on first reveal. */
export function AnimatedNumber({
  value, duration = 1400, prefix = '', suffix = '', decimals = 0, className, style,
}: {
  value: number; duration?: number; prefix?: string; suffix?: string; decimals?: number;
  className?: string; style?: React.CSSProperties;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      if (prefersReducedMotion()) { setDisplay(value); return; }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setDisplay(value * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const shown = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-GB');
  return <span ref={ref} className={className} style={style}>{prefix}{shown}{suffix}</span>;
}

/** Fade + rise on mount, with an optional stagger delay. */
export function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { setShown(true); io.disconnect(); } });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Grouped bar chart: applications vs maintenance across months. Bars grow in. */
export function BarPairChart({
  months,
}: { months: { label: string; applications: number; maintenance: number }[] }) {
  const [grown, setGrown] = useState(false);
  const dark = useIsDark();
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { setGrown(true); io.disconnect(); } }), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const max = Math.max(1, ...months.map(m => Math.max(m.applications, m.maintenance)));
  const H = 150;
  // The "maintenance" navy vanishes on the dark background — lighten it there.
  const maintBar = dark ? 'linear-gradient(180deg,#4b6ea8,#7d9bd0)' : 'linear-gradient(180deg,#0a162f,#22406f)';
  const maintLegend = dark ? '#7d9bd0' : '#0a162f';
  return (
    <div ref={wrap}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: H, padding: '0 4px' }}>
        {months.map((m, i) => (
          <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: H, width: '100%', justifyContent: 'center' }}>
              {(['applications', 'maintenance'] as const).map((k, j) => {
                const target = (m[k] / max) * H;
                return (
                  <div
                    key={k}
                    title={`${m[k]} ${k}`}
                    style={{
                      width: 16, borderRadius: '6px 6px 0 0',
                      background: k === 'applications'
                        ? 'linear-gradient(180deg,#c0392b,#e05648)'
                        : maintBar,
                      height: grown ? Math.max(target, m[k] > 0 ? 6 : 2) : 2,
                      transition: `height .9s cubic-bezier(.22,1,.36,1) ${i * 90 + j * 45}ms`,
                    }}
                  />
                );
              })}
            </div>
            <span style={{ fontSize: 11, color: '#8a94a3', fontWeight: 600 }}>{m.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 12, color: dark ? '#93a3b8' : '#6b7280' }}>
        <Legend color="#c0392b" label="Applications" />
        <Legend color={maintLegend} label="Maintenance" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

/** Animated donut for maintenance status split. */
export function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [draw, setDraw] = useState(false);
  const dark = useIsDark();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { setDraw(true); io.disconnect(); } }), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={R} fill="none" stroke={dark ? '#22314c' : '#eef1f6'} strokeWidth="16" />
          {total > 0 && data.map((d) => {
            const frac = d.value / total;
            const len = frac * C;
            const seg = (
              <circle
                key={d.label}
                cx="70" cy="70" r={R} fill="none" stroke={d.color} strokeWidth="16" strokeLinecap="butt"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={draw ? -offset : -offset + len}
                style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)', opacity: draw ? 1 : 0 }}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: dark ? '#eef3fa' : '#0a162f', lineHeight: 1 }}>
            <AnimatedNumber value={total} />
          </div>
          <div style={{ fontSize: 11, color: '#8a94a3', marginTop: 2 }}>total</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: d.color }} />
            <span style={{ color: dark ? '#c7d2e6' : '#374151', fontWeight: 600, minWidth: 92 }}>{d.label}</span>
            <span style={{ color: '#8a94a3' }}>{d.value}</span>
          </div>
        ))}
        {total === 0 && <span style={{ fontSize: 13, color: '#9aa4b2' }}>No maintenance yet 🎉</span>}
      </div>
    </div>
  );
}
