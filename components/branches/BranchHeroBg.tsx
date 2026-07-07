'use client';
// components/branches/BranchHeroBg.tsx
// Paints the branch hero background with a real matching property photo once
// listings load, layered under a gradient so the hero text stays legible.
// Falls back to the supplied brand image until (or unless) a photo is found.
import { useActiveProperties, pickBranchImage } from '@/components/branches/useActiveProperties';
import { Branch } from '@/lib/branches';

export default function BranchHeroBg({ branch, fallback }: { branch: Branch; fallback: string }) {
  const { props } = useActiveProperties();
  const img = pickBranchImage(props, branch) || fallback;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: `linear-gradient(180deg, rgba(10,22,47,0.35) 0%, rgba(10,22,47,0.82) 100%), url(${img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.4s ease',
      }}
    />
  );
}
