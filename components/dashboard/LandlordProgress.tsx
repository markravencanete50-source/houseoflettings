'use client';
// components/dashboard/LandlordProgress.tsx
// At-a-glance onboarding progress for a landlord registration, shared by the
// admin and staff "Landlord Registration" views. It answers, per signatory:
//   1. How far through onboarding are they? — a % across three signed documents:
//      the management (agency) agreement, the Authorised Representative form, and
//      the Bank Details & AML form.
//   2. If a form is still outstanding, let staff re-send that person's two form
//      links with one click ("Send form reminder").
//   3. (Landlords only) Has the person actually started using their portal? —
//      login created, signed in at least once (temp password used), own password set.
//
// A registration can have MANY signatories: the primary landlord, a joint
// (second) landlord, and — for a company — every additional director/officer
// ("co-signer", party ids cs0, cs1…). Each signs their OWN copy of the two
// forms, stored under postSignForms.<party>, so this renders one progress block
// per party. Every field it reads is already on the agreement object returned by
// /api/staff/agreements.

import { useState } from 'react';

const NAVY = '#0a162f';

type Agreement = Record<string, any>;

type Step = { key: string; label: string; done: boolean };
type Party = {
  party: string;                 // 'first' | 'second' | 'cs0' …
  role: string;                  // "Primary landlord", "Joint landlord", "Director"
  name: string;
  agreementDone: boolean;        // have they signed the agreement itself?
  declined: boolean;
  pending: boolean;              // invited but not yet signed the agreement
  steps: Step[];
  pct: number;
  complete: boolean;
  canRemind: boolean;            // agreement signed, but a form is still outstanding
  portal: { accessed: boolean; passwordReset: boolean; lastLoginAt?: string | null } | null;
};

function stepsFor(forms: any, agreementDone: boolean): Step[] {
  const f = forms || {};
  return [
    { key: 'agreement', label: 'Agency agreement', done: !!agreementDone },
    { key: 'authorisedRep', label: 'Authorisation form', done: !!f.authorisedRep },
    { key: 'bankAml', label: 'Bank details & AML', done: !!f.bankAml },
  ];
}

function pctOf(steps: Step[]) {
  const done = steps.filter(s => s.done).length;
  return Math.round((done / steps.length) * 100);
}

// Every signatory on a registration, in signing order.
export function collectParties(a: Agreement): Party[] {
  const psf = a.postSignForms || {};
  const build = (party: string, role: string, name: string, agreementDone: boolean, declined: boolean, pending: boolean, portal: Party['portal']): Party => {
    const steps = stepsFor(psf[party], agreementDone);
    const pct = pctOf(steps);
    const complete = steps.every(s => s.done);
    return { party, role, name, agreementDone, declined, pending, steps, pct, complete, canRemind: agreementDone && !complete, portal };
  };

  const parties: Party[] = [];

  // Primary landlord — the record only exists once they've signed the agreement.
  parties.push(build(
    'first',
    a.ownerType === 'company' || a.companyName ? 'Managing director' : 'Primary landlord',
    a.fullName || a.companyName || '—',
    a.status !== 'cancelled',
    false,
    false,
    a.portalAccessed !== undefined || a.passwordReset !== undefined || a.landlordUid || a.accountProvisioned
      ? { accessed: !!a.portalAccessed, passwordReset: !!a.passwordReset, lastLoginAt: a.portalLastLoginAt }
      : null,
  ));

  // Joint (second) landlord — present when the registration is a joint one.
  if (a.jointLandlord || a.secondLandlordStatus || a.landlord2Name || a.landlord2Email) {
    const st = a.secondLandlordStatus;
    const name = (a.secondLandlord && a.secondLandlord.fullName) || a.landlord2Name || 'Joint landlord';
    parties.push(build(
      'second', 'Joint landlord', name,
      st === 'completed',
      st === 'declined',
      st !== 'completed' && st !== 'declined',
      a.secondLandlordUid || a.secondPortalAccessed !== undefined || a.secondPasswordReset !== undefined
        ? { accessed: !!a.secondPortalAccessed, passwordReset: !!a.secondPasswordReset, lastLoginAt: a.secondPortalLastLoginAt }
        : null,
    ));
  }

  // Company co-signers — every other director/officer who was emailed to sign.
  const coSigners: any[] = Array.isArray(a.coSigners) ? a.coSigners : [];
  for (const cs of coSigners) {
    if (!cs || !cs.id) continue;
    parties.push(build(
      cs.id, cs.role ? `Director · ${cs.role}` : 'Director',
      cs.fullName || cs.name || 'Director',
      cs.status === 'completed',
      cs.status === 'declined',
      cs.status !== 'completed' && cs.status !== 'declined',
      null,
    ));
  }

  return parties;
}

// Primary landlord's progress, used for the collapsed-row badge.
export function landlordProgress(a: Agreement) {
  const first = collectParties(a)[0];
  return { pct: first?.pct ?? 0, complete: first?.complete ?? false };
}

function pctColor(pct: number) {
  if (pct >= 100) return { bg: '#e8f5e9', color: '#2e7d32', bar: '#2e7d32' };
  if (pct >= 67) return { bg: '#e8f0fe', color: '#1a56db', bar: '#2563eb' };
  if (pct >= 34) return { bg: '#fff3e0', color: '#ef6c00', bar: '#ef8a00' };
  return { bg: '#fdecea', color: '#c62828', bar: '#e53935' };
}

// Compact pill for the collapsed row header — reflects the primary landlord, and
// notes how many further signatories are still outstanding.
export function LandlordProgressBadge({ a }: { a: Agreement }) {
  const parties = collectParties(a);
  const primary = parties[0];
  const pct = primary?.pct ?? 0;
  const c = pctColor(pct);
  const others = parties.slice(1);
  const othersPending = others.filter(p => !p.complete).length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        title="Primary landlord onboarding: agency agreement + authorisation form + bank/AML form"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: c.bg, color: c.color }}
      >
        <span style={{ width: 34, height: 5, borderRadius: 3, background: '#ffffff88', overflow: 'hidden', display: 'inline-block' }}>
          <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: c.bar }} />
        </span>
        {pct}% onboarded
      </span>
      {othersPending > 0 && (
        <span title="Further signatories with outstanding forms" style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fff3e0', color: '#ef6c00' }}>
          +{othersPending} to finish
        </span>
      )}
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

function PortalStatus({ portal }: { portal: NonNullable<Party['portal']> }) {
  const lastLogin = portal.lastLoginAt
    ? new Date(portal.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip done label="Login created" />
        <Chip done={portal.accessed} label={portal.accessed && lastLogin ? `Signed in (last ${lastLogin})` : 'Signed in'} />
        <Chip done={portal.passwordReset} label="Own password set" />
      </div>
      {!portal.accessed && (
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
          Credentials were emailed but this landlord hasn&rsquo;t signed in yet.
        </div>
      )}
    </div>
  );
}

// One signatory's progress block: their role/name, the three-step bar, per-step
// chips, portal status (landlords only), and — when a form is outstanding — a
// one-click reminder that re-sends that person's two form links.
function PartyBlock({
  agreementId,
  p,
  onRemind,
}: {
  agreementId: string;
  p: Party;
  onRemind?: (id: string, party: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const c = pctColor(p.pct);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const remind = async () => {
    if (!onRemind || state === 'sending') return;
    setState('sending'); setMsg('');
    try {
      const r = await onRemind(agreementId, p.party);
      if (r.ok) setState('sent');
      else { setState('error'); setMsg(r.message || 'Could not send the reminder.'); }
    } catch {
      setState('error'); setMsg('Could not send the reminder.');
    }
  };

  const outstandingForms = p.steps.filter(s => !s.done && s.key !== 'agreement').length;

  return (
    <div style={{ padding: '14px 14px', borderTop: '1px solid #f0f2f7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: NAVY }}>
          <strong>{p.name}</strong>
          <span style={{ color: '#9ca3af', fontWeight: 600, marginLeft: 8, fontSize: 12 }}>{p.role}</span>
          {p.declined && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdecea', color: '#c62828' }}>Declined</span>}
          {p.pending && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fff3e0', color: '#ef6c00' }}>Awaiting agreement</span>}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: c.color }}>{p.pct}%</span>
      </div>

      <div style={{ height: 8, borderRadius: 5, background: '#eef1f6', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${p.pct}%`, height: '100%', background: c.bar, transition: 'width .3s' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {p.steps.map(s => <Chip key={s.key} done={s.done} label={s.label} />)}
      </div>

      {p.portal && <PortalStatus portal={p.portal} />}

      {onRemind && p.canRemind && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={remind}
            disabled={state === 'sending' || state === 'sent'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: state === 'sent' ? '#e8f5e9' : '#2563eb',
              color: state === 'sent' ? '#2e7d32' : '#fff',
              border: 'none', borderRadius: 8, padding: '8px 15px',
              fontSize: 13, fontWeight: 700,
              cursor: state === 'sending' || state === 'sent' ? 'default' : 'pointer',
              opacity: state === 'sending' ? 0.7 : 1,
            }}
          >
            {state === 'sending' ? 'Sending…' : state === 'sent' ? '✓ Reminder sent' : '✉ Send form reminder'}
          </button>
          <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 6 }}>
            Emails {p.party === 'first' ? 'the landlord' : p.name.split(' ')[0] || 'them'} fresh links to sign the outstanding form{outstandingForms > 1 ? 's' : ''}.
          </div>
          {state === 'error' && msg && <div style={{ fontSize: 12, color: '#c62828', marginTop: 4 }}>{msg}</div>}
        </div>
      )}
      {p.complete && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: '#2e7d32', fontWeight: 600 }}>✓ All onboarding documents signed.</div>
      )}
      {p.pending && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
          Waiting for this signatory to sign the agreement — their forms are issued automatically once they do.
        </div>
      )}
    </div>
  );
}

// Full breakdown for the expanded details panel — one block per signatory.
export function LandlordProgressPanel({
  a,
  onRemind,
}: {
  a: Agreement;
  onRemind?: (id: string, party: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const parties = collectParties(a);
  const doneCount = parties.filter(p => p.complete).length;

  return (
    <div style={{ marginTop: 16, border: '1px solid #e4e9f2', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#f6f8fc', borderBottom: '1px solid #e9edf5', fontSize: 12.5, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '.04em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📋 Onboarding progress</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: doneCount === parties.length ? '#2e7d32' : '#6b7280' }}>
          {doneCount}/{parties.length} signator{parties.length === 1 ? 'y' : 'ies'} complete
        </span>
      </div>
      {parties.map(p => (
        <PartyBlock key={p.party} agreementId={a.id} p={p} onRemind={onRemind} />
      ))}
    </div>
  );
}
