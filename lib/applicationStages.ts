// lib/applicationStages.ts
// The landlord-visible progress pipeline for a tenant application, separate from
// the staff's internal `status` (pending/reviewing/approved/rejected) so the two
// can evolve independently. `stage` is what the landlord sees on their portal.

export type ApplicationStage = 'new' | 'viewing' | 'referencing' | 'offer' | 'tenancy' | 'declined' | 'withdrawn';

// The linear pipeline shown as a stepper (terminal states handled separately).
export const APPLICATION_PIPELINE: { key: ApplicationStage; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'viewing', label: 'Viewing' },
  { key: 'referencing', label: 'Referencing' },
  { key: 'offer', label: 'Offer' },
  { key: 'tenancy', label: 'Tenancy' },
];

export const TERMINAL_STAGES: { key: ApplicationStage; label: string; color: string; bg: string }[] = [
  { key: 'declined', label: 'Declined', color: '#c62828', bg: '#fdecea' },
  { key: 'withdrawn', label: 'Withdrawn', color: '#6b7280', bg: '#f3f4f6' },
];

export const ALL_STAGES: ApplicationStage[] = [...APPLICATION_PIPELINE.map(s => s.key), ...TERMINAL_STAGES.map(s => s.key)];

export function stageLabel(stage: string | undefined): string {
  const s = (stage || 'new') as ApplicationStage;
  return [...APPLICATION_PIPELINE, ...TERMINAL_STAGES].find(x => x.key === s)?.label || 'New';
}

export function isTerminal(stage: string | undefined): boolean {
  return stage === 'declined' || stage === 'withdrawn';
}

// Best-effort default: derive a stage from a legacy internal status so existing
// applications show something sensible before staff touch them.
export function stageFromStatus(status: string | undefined): ApplicationStage {
  switch ((status || '').toLowerCase()) {
    case 'approved': return 'offer';
    case 'rejected': return 'declined';
    case 'reviewing': return 'referencing';
    default: return 'new';
  }
}
