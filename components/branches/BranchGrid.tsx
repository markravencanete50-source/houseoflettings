'use client';
// components/branches/BranchGrid.tsx
// Client grid of branch cards. Subscribes once to live listings and shows a
// real matching property photo per card. Some stored listing URLs can be dead
// (image deleted from Cloudinary/Storage but still referenced in Firestore),
// so each card self-heals: if its assigned photo fails to load it swaps to the
// branch's local brand image — a card never renders broken/alt-text-only.
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Reveal from '@/components/branches/Reveal';
import { Branch, OFFICES } from '@/lib/branches';
import { useActiveProperties, assignBranchImages } from '@/components/branches/useActiveProperties';

function CardImage({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      className="hol-branch-card__img"
      src={failed ? fallback : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

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
        const office = OFFICES[b.city];
        return (
          <Reveal key={b.slug} delay={(i % 3) * 80}>
            <Link href={`/branches/${b.slug}`} className="hol-branch-card">
              <div className="hol-branch-card__media">
                <CardImage src={img} fallback={b.heroImage} alt={`Property to rent in ${b.name}`} />
                <span className="hol-branch-card__badge">{b.postcodes.join(' · ')}</span>
              </div>
              <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 19, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                  {b.name}
                </h3>
                <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.55, flex: 1 }}>{b.intro}</p>
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: '1px solid var(--gray-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'var(--gray-600)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    📞 {office.phoneDisplay}
                  </span>
                  <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    View branch →
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
