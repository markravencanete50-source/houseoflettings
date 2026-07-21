'use client';
// components/dashboard/AgreementTemplateEditor.tsx
// Admin-only editor for the agreement's legal clause wording. Each clause is
// pre-filled with the CURRENT effective text (a stored override, or the code
// default). On save we store only what differs from the default, so clauses the
// admin never touches keep tracking future code updates, and a "Reset" restores
// the standard wording. The Service list and fees are NOT editable here — they
// stay driven by pricing.
import { useEffect, useState } from 'react';
import { EDITABLE_CLAUSES, AGREEMENT_INTRO, type AgreementTemplate } from '@/lib/agreementContent';

type ClauseState = { title: string; parasText: string };

function defaults(): { intro: string; clauses: Record<string, ClauseState> } {
  const clauses: Record<string, ClauseState> = {};
  for (const c of EDITABLE_CLAUSES) clauses[c.key] = { title: c.title, parasText: c.paras.join('\n') };
  return { intro: AGREEMENT_INTRO, clauses };
}

export default function AgreementTemplateEditor({
  authedFetch,
  onClose,
}: {
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
}) {
  const base = defaults();
  const [intro, setIntro] = useState(base.intro);
  const [clauses, setClauses] = useState<Record<string, ClauseState>>(base.clauses);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Overlay any stored overrides onto the defaults.
  useEffect(() => {
    let cancelled = false;
    authedFetch('/api/admin/agreement-template')
      .then(r => r.json())
      .then((j: { template?: AgreementTemplate }) => {
        if (cancelled) return;
        const t = j.template || {};
        if (t.intro) setIntro(t.intro);
        if (t.clauses) {
          setClauses(prev => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(t.clauses!)) {
              if (!next[k]) continue;
              next[k] = {
                title: v.title || next[k].title,
                parasText: Array.isArray(v.paras) && v.paras.length ? v.paras.join('\n') : next[k].parasText,
              };
            }
            return next;
          });
        }
      })
      .catch(() => { if (!cancelled) setMsg({ kind: 'err', text: 'Could not load current wording. Showing standard text.' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authedFetch]);

  const setClause = (key: string, patch: Partial<ClauseState>) =>
    setClauses(s => ({ ...s, [key]: { ...s[key], ...patch } }));

  const resetClause = (key: string) => {
    const d = EDITABLE_CLAUSES.find(c => c.key === key)!;
    setClause(key, { title: d.title, parasText: d.paras.join('\n') });
  };

  const resetAll = () => { const d = defaults(); setIntro(d.intro); setClauses(d.clauses); };

  // Store only what differs from the code default.
  const buildTemplate = (): AgreementTemplate => {
    const template: AgreementTemplate = {};
    if (intro.trim() && intro.trim() !== AGREEMENT_INTRO.trim()) template.intro = intro.trim();
    const out: NonNullable<AgreementTemplate['clauses']> = {};
    for (const c of EDITABLE_CLAUSES) {
      const st = clauses[c.key];
      const paras = st.parasText.split('\n').map(x => x.trim()).filter(Boolean);
      const entry: { title?: string; paras?: string[] } = {};
      if (st.title.trim() && st.title.trim() !== c.title) entry.title = st.title.trim();
      if (paras.join('\n') !== c.paras.join('\n')) entry.paras = paras;
      if (entry.title || entry.paras) out[c.key] = entry;
    }
    if (Object.keys(out).length) template.clauses = out;
    return template;
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await authedFetch('/api/admin/agreement-template', {
        method: 'POST',
        body: JSON.stringify({ template: buildTemplate() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || 'Save failed');
      setMsg({ kind: 'ok', text: 'Saved. New agreements will use this wording.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message || 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '9px 11px', fontSize: 13.5, boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 className="dash-section-title" style={{ margin: 0 }}>Edit agreement wording</h1>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--gray-600)' }}>← Back to agreements</button>
      </div>
      <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 14.5, lineHeight: 1.55 }}>
        Edit the legal clauses of the agreement. Changes apply to agreements signed from now on. The list of services in each package and the fees are set by your pricing and are not editable here. Put each numbered point on its own line.
      </p>

      {loading ? (
        <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading current wording…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="dash-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Introduction</div>
            <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={intro} onChange={e => setIntro(e.target.value)} />
          </div>

          {EDITABLE_CLAUSES.map(c => (
            <div key={c.key} className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <input
                  style={{ ...inp, fontWeight: 700, color: 'var(--navy)', maxWidth: 420 }}
                  value={clauses[c.key].title}
                  onChange={e => setClause(c.key, { title: e.target.value })}
                />
                <button onClick={() => resetClause(c.key)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reset to standard</button>
              </div>
              <textarea
                style={{ ...inp, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }}
                value={clauses[c.key].parasText}
                onChange={e => setClause(c.key, { parasText: e.target.value })}
              />
              <div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 5 }}>One numbered point per line.</div>
            </div>
          ))}

          {msg && (
            <div style={{ fontSize: 14, fontWeight: 600, padding: '11px 14px', borderRadius: 8, background: msg.kind === 'ok' ? '#f0fdf4' : '#fef2f2', color: msg.kind === 'ok' ? '#15803d' : '#b91c1c', border: `1px solid ${msg.kind === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'sticky', bottom: 0, background: 'var(--gray-50, #f8fafc)', padding: '12px 0' }}>
            <button onClick={save} disabled={saving} style={{ background: '#2563eb', color: '#fff', border: '1px solid transparent', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save wording'}
            </button>
            <button onClick={resetAll} disabled={saving} style={{ background: '#fff', color: 'var(--gray-600)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Reset all to standard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
