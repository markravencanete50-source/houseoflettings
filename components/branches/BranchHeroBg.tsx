'use client';
// components/branches/BranchHeroBg.tsx
// Branch hero background. Shows ONLY a real matching property photo — never a
// stock/brand image, and with no image-swap animation. Until a property photo
// is found AND fully preloaded, the hero sits on a solid branded gradient; the
// photo is then painted in a single frame (it's already cached), so there is no
// flash of a "previous"/placeholder picture and no fade/animation.
import { useEffect, useState } from 'react';
import { useActiveProperties, pickBranchImage } from '@/components/branches/useActiveProperties';
import { Branch } from '@/lib/branches';

export default function BranchHeroBg({ branch }: { branch: Branch }) {
  const { props } = useActiveProperties();
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    const url = pickBranchImage(props, branch);
    if (!url || url === img) return;
    // Preload fully before showing so the photo paints in one go — no half-load
    // pop and no swap from a placeholder image.
    let cancelled = false;
    const pre = new window.Image();
    pre.onload = () => {
      if (!cancelled) setImg(url);
    };
    pre.src = url;
    return () => {
      cancelled = true;
    };
  }, [props, branch, img]);

  return (
    <>
      {/* Branded base — visible before/without a property photo. Not an image. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: 'linear-gradient(135deg, #0a162f 0%, #12274d 100%)',
        }}
      />
      {/* Real property photo — rendered only once fully loaded, at full opacity,
          no transition. */}
      {img && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `linear-gradient(180deg, rgba(10,22,47,0.35) 0%, rgba(10,22,47,0.82) 100%), url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </>
  );
}
