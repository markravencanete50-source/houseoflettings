'use client';
// components/landlord/ApplicationPipeline.tsx
// A compact progress stepper for a tenant application shown to the landlord:
// New → Viewing → Referencing → Offer → Tenancy, with the current stage lit.
// Declined/Withdrawn render as a terminal chip instead of the stepper.
import { APPLICATION_PIPELINE, TERMINAL_STAGES, isTerminal } from '@/lib/applicationStages';

export default function ApplicationPipeline({ stage }: { stage?: string }) {
  const s = stage || 'new';
  if (isTerminal(s)) {
    const term = TERMINAL_STAGES.find(t => t.key === s)!;
    return (
      <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: term.bg, color: term.color }}>
        {term.label}
      </span>
    );
  }
  const currentIdx = Math.max(0, APPLICATION_PIPELINE.findIndex(x => x.key === s));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {APPLICATION_PIPELINE.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const color = done ? '#2e7d32' : active ? '#2563eb' : '#9aa4b2';
        const bg = done ? '#e8f5e9' : active ? '#e8f0fe' : '#f3f4f6';
        return (
          <span key={step.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>
              {done ? '✓ ' : ''}{step.label}
            </span>
            {i < APPLICATION_PIPELINE.length - 1 && <span style={{ width: 10, height: 2, background: done ? '#2e7d32' : '#e5e7eb', display: 'inline-block' }} />}
          </span>
        );
      })}
    </div>
  );
}
