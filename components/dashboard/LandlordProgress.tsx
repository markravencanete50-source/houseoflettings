'use client';
// components/dashboard/LandlordProgress.tsx
// At-a-glance onboarding progress for a landlord registration, shared by the
// admin and staff "Landlord Registration" views. It answers three questions the
// office kept asking by opening each record:
//   1. How far through onboarding is this landlord? — a % across the three
//      signed documents: the management (agency) agreement, the Authorised
//      Representative form, and the Bank Details & AML form.
//   2. If a form is still outstanding, let staff re-send the two form links with
//      one click (the "Send form reminder" button).
//   3. Has the landlord actually started using their portal? — whether a login
//      was provisioned, whether they've signed in at least once (used the
//      temporary password), and whether they've set their own password.
// Every field it reads is already on the agreement object returned by
// /api/staff/agreements (postSignForms + the portal fields enriched from the
// landlord's users doc), so both dashboards get this for free.

import { useState } from 'react';

const NAVY = '#0a162f';

type Agreement = Record<string, any>;

// The three documents a fully-onboarded landlord has signed, in order.
export function landlordSteps(a: Agreement) {
  const first = (a.postSignForms && a.postSignForms.first) || {};
  // The record only exists once the management agreement is signed, but treat a
  // cancelled one as not-signed so the bar reflects reality.
  const agreementSigned = a.status !== 'cancelled' && (!!a.signatureName || !!a.signatureUrl || !!a.status);
  return [
    { key: 'agreement', label: 'Agency agreement', done: agreementSigned },
    { key: 'authorisedRep', label: 'Authorisation form', done: !!first.authorisedRep },
    { key: 'bankAml', label: 'Bank details & AML', done: !!first.bankAml },
  ];
}

export function landlordProgress(a: Agreement) {
  const steps = landlordSteps(a);
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return { steps, done, total: steps.length, pct, complete: done === steps.length };
}

function pctColor(pct: number) {
  if (pct >= 100) return { bg: '#e8f5e9', color: '#2e7d32', bar: '#2e7d32' };
  if (pct >= 67) return { bg: '#e8f0fe', color: '#1a56db', bar: '#2563eb' };
  if (pct >= 34) return { bg: '#fff3e0', color: '#ef6c00', bar: '#ef8a00' };
  return { bg: '#fdecea', color: '#c62828', bar: '#e53935' };
}

// Compact pill for the collapsed row header — "67% onboarded".
export function LandlordProgressBadge({ a }: { a: Agreement }) {
  const { pct } = landlordProgress(a);
  const c = pctColor(pct);
  return (
    <span
      title="Onboarding: agency agreement + authorisation form + bank/AML form"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.color }}
    >
      <span style={{ width: 34, height: 5, borderRadius: 3, background: '#ffffff88', overflow: 'hidden', display: 'inline-block' }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: c.bar }} />
      </span>
      {pct}% onboarded
    </span>
  );
}

function Chip({ done, label }: { done: boolean; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: done ? '#e8f5e9' : '#f3f4f6', color: done ? '#2e7d32' : '#6b7280', border: `1px solid ${done ? '#c6e8c9' : '#e5e7eb'}` }}>
      {done ? '✓' : '○'} {label}
    </span>
  );
}

// Portal-access chips: has a login been created, has the landlord signed in at
// least once (used the temp password), and have they set their own password?
function PortalStatus({ a }: { a: Agreement }) {
  const provisioned = !!a.accountProvisioned || !!a.landlordUid;
  const accessed = !!a.portalAccessed;
  const passwordReset = !!a.passwordReset;
  const lastLogin = a.portalLastLoginAt
    ? new Date(a.portalLastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Landlord portal</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip done={provisioned} label="Login created" />
        <Chip done={accessed} label={accessed && lastLogin ? `Signed in (last ${lastLogin})` : 'Signed in'} />
        <Chip done={passwordReset} label="Own password set" />
      </div>
      {provisioned && !accessed && (
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
          Credentials were emailed but this landlord hasn&rsquo;t signed in yet.
        </div>
      )}
    </div>
  );
}

// Full breakdown for the expanded details panel: the three-step bar, per-step
// chips, the portal status, and (when a form is outstanding) a one-click
// reminder that re-sends the two form links to the landlord.
export function LandlordProgressPanel({
  a,
  onRemind,
}: {
  a: Agreement;
  onRemind?: (id: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const { steps, pct, complete } = landlordProgress(a);
  const c = pctColor(pct);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const remind = async () => {
    if (!onRemind || state === 'sending') return;
    setState('sending'); setMsg('');
    try {
      const r = await onRemind(a.id);
      if (r.ok) { setState('sent'); }
      else { setState('error'); setMsg(r.message || 'Could not send the reminder.'); }
    } catch {
      setState('error'); setMsg('Could not send the reminder.');
    }
  };

  return (
    <div style={{ marginTop: 16, border: '1px solid #e4e9f2', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#f6f8fc', borderBottom: '1px solid #e9edf5', fontSize: 12.5, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.04em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📋 Onboarding progress</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: c.color }}>{pct}%</span>
      </div>
      <div style={{ padding: '14px 14px', fontSize: 13, color: 'var(--gray-600)' }}>
        {/* progress bar */}
        <div style={{ height: 8, borderRadius: 5, background: '#eef1f6', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: c.bar, transition: 'width .3s' }} />
        </div>

        {/* per-step chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {steps.map(s => <Chip key={s.key} done={s.done} label={s.label} />)}
        </div>

        {/* form reminder */}
        {onRemind && !complete && (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={remind}
              disabled={state === 'sending' || state === 'sent'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: state === 'sent' ? '#e8f5e9' : '#2563eb',
                color: state === 'sent' ? '#2e7d32' : '#fff',
                border: 'none', borderRadius: 8, padding: '9px 16px',
                fontSize: 13, fontWeight: 700,
                cursor: state === 'sending' || state === 'sent' ? 'default' : 'pointer',
                opacity: state === 'sending' ? 0.7 : 1,
              }}
            >
              {state === 'sending' ? 'Sending…' : state === 'sent' ? '✓ Reminder sent' : '✉ Send form reminder'}
            </button>
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
              Emails the landlord fresh links to sign the outstanding form{steps.filter(s => !s.done && s.key !== 'agreement').length > 1 ? 's' : ''}.
            </div>
            {state === 'error' && msg && <div style={{ fontSize: 12, color: '#c62828', marginTop: 4 }}>{msg}</div>}
          </div>
        )}
        {complete && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#2e7d32', fontWeight: 600 }}>
            ✓ All onboarding documents signed.
          </div>
        )}

        <PortalStatus a={a} />
      </div>
    </div>
  );
}
