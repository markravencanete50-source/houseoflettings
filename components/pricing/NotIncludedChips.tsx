'use client';
// components/pricing/NotIncludedChips.tsx
// The "Not included in this package" list can be long (lower tiers exclude many
// services), which reads as an intimidating wall on mobile. Show a short set by
// default with a Show more / Show less toggle so the section stays compact.
import { useState } from 'react';
import styles from './NotIncludedChips.module.css';

export default function NotIncludedChips({
  items,
  initial = 5,
}: {
  items: string[];
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, initial);
  const hidden = items.length - initial;

  return (
    <div>
      <div className={styles.chips}>
        {shown.map((label) => (
          <span key={label} className={styles.chip}>{label}</span>
        ))}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : `Show ${hidden} more`}
          <span className={`${styles.chev}${expanded ? ` ${styles.up}` : ''}`} aria-hidden />
        </button>
      )}
    </div>
  );
}
