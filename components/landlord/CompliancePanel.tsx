'use client';
// components/landlord/CompliancePanel.tsx
// The interactive Compliance section of a property in the landlord portal.
// Landlords upload each required certificate (Gas, EPC, EICR, Insurance) with
// its issue + expiry dates; the agency agreement is shown as held by House of
// Lettings automatically. Files go direct to Cloudinary; metadata is saved via
// /api/landlord/compliance. Status + reminders are driven by the expiry date.
import { useState, useEffect, useRef, useCallback } from 'react';
import { auth as fbAuth } from '@/lib/firebase';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';
import { COMPLIANCE_TYPES, complianceStatus, type ComplianceType } from '@/lib/compliance';

type DocState = { fileUrl: string; fileName: string; issueDate: string; expiryDate: string };
type DocMap = Partial<Record<ComplianceType, DocState>>;

async function authedFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };
  const u = fbAuth?.currentUser;
  if (u) { try { headers['Authorization'] = `Bearer ${await u.getIdToken()}`; } catch { /* cookie */ } }
  return fetch(path, { ...init, headers, credentials: 'same-origin' });
}

async function uploadToCloudinary(file: File): Promise<{ url: string; name: string }> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: CLOUDINARY_FOLDERS.landlordDocs }),
  });
  if (!sigRes.ok) throw new Error('Could not prepare the upload.');
  const { cloudName, apiKey, timestamp, folder, signature } = await sigRes.json();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('folder', folder);
  fd.append('signature', signature);
  const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
  const data = await up.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed.');
  return { url: data.secure_url as string, name: file.name };
}

const BADGE: Record<string, { bg: string; color: string }> = {
  missing: { bg: '#f1f3f7', color: '#64748b' },
  valid: { bg: '#e8f5e9', color: '#2e7d32' },
  expiring: { bg: '#fff3e0', color: '#ef6c00' },
  expired: { bg: '#fdecea', color: '#c62828' },
};

function ComplianceRow({
  meta, initial, propertyId, propertyLabel, postcode,
}: {
  meta: { id: ComplianceType; label: string; desc: string };
  initial?: DocState;
  propertyId: string; propertyLabel: string; postcode: string;
}) {
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl || '');
  const [fileName, setFileName] = useState(initial?.fileName || '');
  const [issueDate, setIssueDate] = useState(initial?.issueDate || '');
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const status = complianceStatus(expiryDate, !!fileUrl);
  const badge = BADGE[status.key];
  const today = new Date().toISOString().split('T')[0];

  const onFile = async (f: File | null) => {
    if (!f) return;
    setUploading(true); setMsg(null);
    try {
      const { url, name } = await uploadToCloudinary(f);
      setFileUrl(url); setFileName(name);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || 'Upload failed.' });
    }
    setUploading(false);
  };

  const save = async () => {
    if (!fileUrl) { setMsg({ ok: false, text: 'Please upload the document first.' }); return; }
    if (!expiryDate) { setMsg({ ok: false, text: 'Please enter the expiry date.' }); return; }
    setSaving(true); setMsg(null);
    const res = await authedFetch('/api/landlord/compliance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: meta.id, propertyId, propertyLabel, postcode, fileUrl, fileName, issueDate, expiryDate }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: 'Saved. We will remind you before it expires.' } : { ok: false, text: j.message || 'Could not save.' });
  };

  return (
    <div className="cp-card">
      <div className="cp-card-head">
        <div>
          <div className="cp-card-title">{meta.label}</div>
          <div className="cp-card-desc">{meta.desc}</div>
        </div>
        <span className="cp-badge" style={{ background: badge.bg, color: badge.color }}>{status.label}</span>
      </div>

      <div className="cp-row-fields">
        <div className="cp-field">
          <label>Document</label>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
            onChange={e => { onFile(e.target.files?.[0] || null); e.target.value = ''; }} />
          <button type="button" className="cp-upload" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : fileUrl ? '✓ Replace file' : '📎 Upload file'}
          </button>
          {fileUrl && <a className="cp-file-link" href={fileUrl} target="_blank" rel="noopener noreferrer">View {fileName ? `(${fileName.slice(0, 22)})` : ''}</a>}
        </div>
        <div className="cp-field">
          <label>Issue date</label>
          <input type="date" max={today} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Expiry date</label>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
        </div>
        <button type="button" className="cp-save" onClick={save} disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {msg && <div className={`cp-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.ok ? '✅' : '⚠️'} {msg.text}</div>}
    </div>
  );
}

export default function CompliancePanel({
  propertyId, propertyLabel, postcode, managed,
}: {
  propertyId: string; propertyLabel: string; postcode: string; managed: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocMap>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/landlord/compliance?propertyId=${encodeURIComponent(propertyId)}`);
      const j = await res.json().catch(() => ({ docs: {} }));
      setDocs(res.ok ? (j.docs || {}) : {});
    } catch { setDocs({}); }
    setLoading(false);
  }, [propertyId]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="cp">
      <div className={`cp-note ${managed ? 'ok' : 'warn'}`}>
        {managed
          ? '✅ Your managed package includes compliance tracking. Upload each certificate with its dates and we will email you about a month before anything expires, with the option for us to arrange the renewal for you.'
          : 'ℹ️ Keep your certificates here so nothing lapses. Add each document with its dates and we will email you about a month before expiry, with the option for House of Lettings to arrange the renewal.'}
      </div>

      {loading ? (
        <div className="cp-loading">Loading your documents…</div>
      ) : (
        <div className="cp-list">
          {COMPLIANCE_TYPES.map(meta => (
            <ComplianceRow key={meta.id} meta={meta} initial={docs[meta.id]}
              propertyId={propertyId} propertyLabel={propertyLabel} postcode={postcode} />
          ))}
          <div className="cp-card cp-card--auto">
            <div className="cp-card-head">
              <div>
                <div className="cp-card-title">Agency agreement</div>
                <div className="cp-card-desc">Your signed Residential Lettings &amp; Management Agreement with House of Lettings.</div>
              </div>
              <span className="cp-badge" style={{ background: '#e8f0ff', color: '#2563eb' }}>Held by House of Lettings</span>
            </div>
            <p className="cp-auto-note">This is added automatically — it is the agreement between you and House of Lettings, so there is nothing for you to upload.</p>
          </div>
        </div>
      )}

      <style>{`
        .cp { }
        .cp-note { font-size: 13px; line-height: 1.6; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
        .cp-note.ok { background: #e8f5e9; color: #256a3a; border: 1px solid #bfe3c6; }
        .cp-note.warn { background: #eef4ff; color: #1e40af; border: 1px solid #cdddfb; }
        .cp-loading { font-size: 14px; color: #6b7280; padding: 16px 0; }
        .cp-list { display: flex; flex-direction: column; gap: 14px; }
        .cp-card { background: #fff; border: 1px solid #e9edf5; border-radius: 14px; padding: 18px 20px; }
        .cp-card--auto { border-style: dashed; }
        .cp-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .cp-card-title { font-size: 15px; font-weight: 700; color: #0a162f; }
        .cp-card-desc { font-size: 12.5px; color: #6b7280; margin-top: 3px; line-height: 1.5; }
        .cp-badge { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .cp-row-fields { display: grid; grid-template-columns: 1.4fr 1fr 1fr auto; gap: 12px; align-items: end; margin-top: 14px; }
        .cp-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .cp-field label { font-size: 11.5px; font-weight: 600; color: #8a94a3; }
        .cp-field input[type=date] { border: 1.5px solid #d8deea; border-radius: 8px; padding: 9px 10px; font-size: 13.5px; font-family: 'Poppins', sans-serif; color: #0a162f; background: #fff; }
        .cp-upload { border: 1.5px dashed #c7d0e0; background: #f7f9fc; border-radius: 8px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; color: #2563eb; cursor: pointer; font-family: 'Poppins', sans-serif; }
        .cp-upload:hover { background: #eef4ff; }
        .cp-file-link { font-size: 11.5px; color: #2563eb; font-weight: 600; text-decoration: none; margin-top: 4px; }
        .cp-save { background: #16a34a; color: #fff; border: none; border-radius: 9px; padding: 11px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif; min-height: 42px; }
        .cp-save:disabled { opacity: .6; cursor: not-allowed; }
        .cp-msg { margin-top: 10px; font-size: 12.5px; font-weight: 600; }
        .cp-msg.ok { color: #15803d; }
        .cp-msg.err { color: #b3261e; }
        .cp-auto-note { font-size: 12.5px; color: #6b7280; line-height: 1.6; margin: 12px 0 0; }

        /* dark mode (driven by the portal layout's data-portal-theme) */
        :root[data-portal-theme="dark"] .cp-card { background: #13203a; border-color: #22314c; }
        :root[data-portal-theme="dark"] .cp-card-title { color: #eef3fa; }
        :root[data-portal-theme="dark"] .cp-card-desc, :root[data-portal-theme="dark"] .cp-auto-note, :root[data-portal-theme="dark"] .cp-loading { color: #93a3b8; }
        :root[data-portal-theme="dark"] .cp-field label { color: #7f8ea3; }
        :root[data-portal-theme="dark"] .cp-field input[type=date] { background: #101c30; border-color: #2b3c58; color: #eef3fa; }
        :root[data-portal-theme="dark"] .cp-upload { background: #101c30; border-color: #2b3c58; color: #6ea8fe; }
        :root[data-portal-theme="dark"] .cp-note.ok { background: #10281b; color: #7fdba0; border-color: #204a31; }
        :root[data-portal-theme="dark"] .cp-note.warn { background: #101f38; color: #93b4f5; border-color: #24406c; }

        @media (max-width: 640px) { .cp-row-fields { grid-template-columns: 1fr 1fr; } .cp-save { grid-column: 1 / -1; } }
      `}</style>
    </div>
  );
}
