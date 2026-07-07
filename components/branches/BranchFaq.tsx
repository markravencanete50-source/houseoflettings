'use client';
// components/branches/BranchFaq.tsx
// Simple accessible FAQ accordion for the branch office pages. Also emits
// FAQPage JSON-LD so the questions can win rich results in Google.
import { useState } from 'react';
import { Faq } from '@/lib/branches';

export default function BranchFaq({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            style={{
              background: '#fff',
              border: '1px solid var(--gray-200)',
              borderRadius: 12,
              marginBottom: 12,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '18px 22px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Poppins',sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--navy)',
              }}
            >
              {f.q}
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  fontSize: 22,
                  lineHeight: 1,
                  color: 'var(--red)',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 22px 20px', color: 'var(--gray-800)', fontSize: 15, lineHeight: 1.7 }}>
                {f.a}
              </div>
            )}
          </div>
        );
      })}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
