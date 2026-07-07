'use client';
// components/branches/BranchGrid.tsx
// Client grid of branch cards. Subscribes once to live listings and shows a
// real matching property photo per card, falling back to a brand image only
// while loading or when a city has no photographed listings yet.
import { useMemo } from 'react';
import Link from 'next/link';
import Reveal from '@/components/branches/Reveal';
import { Branch } from '@/lib/branches';
import { useActiveProperties, assignBranchImages } from '@/components/branches/useActiveProperties';

export default function BranchGrid({ branches }: { branches: Branch[] }) {
  const { props } = useActiveProperties();
  const imageMap = useMemo(() => assignBranchImages(props, branches), [props, branches]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
      }}
    >
      {branches.map((b, i) => {
        const img = imageMap.get(b.slug) || b.heroImage;
        return (
          <Reveal key={b.slug} delay={(i % 3) * 80}>
            <Link href={`/branches/${b.slug}`} className="hol-branch-card">
              <div className="hol-branch-card__media">
                <img
                  className="hol-branch-card__img"
                  src={img}
                  alt={`Property to rent in ${b.name}`}
                  loading="lazy"
                  decoding="async"
                />
                <span className="hol-branch-card__badge">{b.postcodes.join(' · ')}</span>
              </div>
              <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 19, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                  {b.name}
                </h3>
                <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.55, flex: 1 }}>{b.intro}</p>
                <span style={{ marginTop: 16, color: 'var(--red)', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  View branch →
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
