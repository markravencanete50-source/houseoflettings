'use client';
// app/landlord-registration/joint/JointLandlordClient.tsx
// The joint (second) landlord's journey from the invite link:
//   1. Decision — review the auto-filled property + service and ACCEPT or DECLINE.
//      Declining voids the registration and notifies the first landlord + office.
//   2. On accept — provide their own personal details + documents (ID front/back,
//      billing proof, proof of ownership), review the agreement and sign.
//   3. On submit — they receive the signed agreement (same format as the first
//      landlord), the office is notified, and their portal login is created.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';
import { findBundle, effectiveIntro, buildAgreementSections } from '@/lib/agreementContent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const MAX_FILES = 6;

const ID_DOCS = [
  { key: 'landlordId', label: 'Your ID — front and back', hint: 'Passport, driving licence or national ID. Please upload both sides.' },
  { key: 'billingProof', label: 'Billing Address Document', hint: 'Utility bill, council tax or bank statement (within the last 3 months) showing your address.' },
  { key: 'ownershipProof', label: 'Proof of Ownership', hint: 'Land Registry title or other proof of ownership for the property.' },
] as const;
type DocKey = typeof ID_DOCS[number]['key'];

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder }),
  });
  if (!sigRes.ok) throw new Error('Could not prepare upload');
  const { cloudName, apiKey, timestamp, folder: signedFolder, signature } = await sigRes.json();
  const fd = new FormData();
  fd.append('file', file); fd.append('api_key', apiKey); fd.append('timestamp', String(timestamp));
  fd.append('folder', signedFolder); fd.append('signature', signature);
  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
  const data = await upRes.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url as string;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/png';
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

type DocState = { urls: string[]; fileNames: string[]; uploading: boolean; error: string };
const emptyDoc = (): DocState => ({ urls: [], fileNames: [], uploading: false, error: '' });

type PropInfo = { flatNumber?: string; street?: string; city?: string; postcode?: string; propertyType?: string; bedrooms?: string; bathrooms?: string; furnishing?: string; currentRent?: string };
type Ctx = { firstName: string; packageLabel: string; packageId: string; propertyAddress: string; properties: PropInfo[]; landlord2Name: string; landlord2Email: string; landlord2Phone: string };

type Stage = 'checking' | 'decision' | 'form' | 'invalid' | 'completed' | 'declined' | 'done';

export default function JointLandlordClient() {
  const [id, setId] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<Stage>('checking');
  const [ctx, setCtx] = useState<Ctx | null>(null);

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', contactAddress: '', residency: '', signatureName: '', signatureDate: '' });
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({ landlordId: emptyDoc(), billingProof: emptyDoc(), ownershipProof: emptyDoc() });
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [declining, setDeclining] = useState(false);
  const fileRefs = useRef<Record<DocKey, HTMLInputElement | null>>({ landlordId: null, billingProof: null, ownershipProof: null });

  // Read id/token straight from the URL on mount (no useSearchParams / Suspense
  // dependency) and validate the invite.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const _id = sp.get('id') || '';
    const _token = sp.get('token') || '';
    setId(_id);
    setToken(_token);
    if (!_id || !_token) { setStage('invalid'); return; }
    fetch(`/api/landlord-registration/second?id=${encodeURIComponent(_id)}&token=${encodeURIComponent(_token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.completed) { setStage('completed'); return; }
        if (d.declined) { setStage('declined'); return; }
        if (!d.valid) { setStage('invalid'); return; }
        setCtx(d);
        setForm(f => ({ ...f, fullName: d.landlord2Name || '', email: d.landlord2Email || '', phone: d.landlord2Phone || '' }));
        setStage('decision');
      })
      .catch(() => setStage('invalid'));
  }, []);

  // Default the signature date to today (client-only, so no hydration mismatch).
  useEffect(() => {
    setForm(f => ({ ...f, signatureDate: new Date().toISOString().slice(0, 10) }));
  }, []);

  const bundle = ctx ? findBundle(ctx.packageId) || findBundle(ctx.packageLabel) : undefined;

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const decline = async () => {
    if (!confirm('Decline this joint registration? This will void the contract and notify the primary landlord. This cannot be undone.')) return;
    setDeclining(true);
    try {
      await fetch('/api/landlord-registration/second', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, decline: true }),
      });
      setStage('declined');
    } catch { setDeclining(false); }
  };

  const onUpload = async (key: DocKey, files: FileList | null) => {
    if (!files || !files.length) return;
    const room = Math.max(0, MAX_FILES - docs[key].urls.length);
    const picked = Array.from(files).slice(0, room);
    setDocs(d => ({ ...d, [key]: { ...d[key], uploading: true, error: '' } }));
    const addedUrls: string[] = []; const addedNames: string[] = [];
    try {
      for (const file of picked) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is over 10MB`);
        addedUrls.push(await uploadToCloudinary(file, CLOUDINARY_FOLDERS.landlordDocs));
        addedNames.push(file.name);
      }
      setDocs(d => ({ ...d, [key]: { urls: [...d[key].urls, ...addedUrls], fileNames: [...d[key].fileNames, ...addedNames], uploading: false, error: '' } }));
    } catch (err: any) {
      setDocs(d => ({ ...d, [key]: { ...d[key], uploading: false, error: err.message || 'Upload failed' } }));
    }
  };

  const removeFile = (key: DocKey, i: number) => setDocs(d => ({
    ...d, [key]: { ...d[key], urls: d[key].urls.filter((_, n) => n !== i), fileNames: d[key].fileNames.filter((_, n) => n !== i) },
  }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Your full name is required';
    if (!form.email.trim()) e.email = 'Email is required'; else if (!EMAIL_REGEX.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Telephone is required'; else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid UK number';
    if (!form.contactAddress.trim()) e.contactAddress = 'Contact address is required';
    if (!form.residency) e.residency = 'Please confirm your residency';
    ID_DOCS.forEach(d => {
      if (docs[d.key].uploading) e[d.key] = 'Please wait for the upload to finish';
      else if (docs[d.key].urls.length === 0) e[d.key] = `Please upload your ${d.label.toLowerCase()}`;
    });
    if (!termsAccepted) e.terms = 'Please accept the agreement to continue';
    if (!form.signatureName.trim()) e.signatureName = 'Type your full name to confirm';
    if (!form.signatureDate) e.signatureDate = 'Please confirm the date';
    if (!signatureData) e.signature = 'Please add your signature';
    if (Object.keys(e).length) { setErrors(e); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setErrors({});
    setStatus('loading'); setErrorMsg('');
    try {
      let signatureUrl = '';
      try {
        const f = dataUrlToFile(signatureData!, `joint-signature-${Date.now()}.png`);
        signatureUrl = await uploadToCloudinary(f, CLOUDINARY_FOLDERS.agreements);
      } catch { /* non-fatal */ }

      const res = await fetch('/api/landlord-registration/second', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, token,
          fullName: form.fullName, email: form.email, phone: form.phone,
          contactAddress: form.contactAddress, residency: form.residency,
          landlordIdUrls: docs.landlordId.urls, landlordIdFileNames: docs.landlordId.fileNames,
          billingProofUrls: docs.billingProof.urls, billingProofFileNames: docs.billingProof.fileNames,
          ownershipProofUrls: docs.ownershipProof.urls, ownershipProofFileNames: docs.ownershipProof.fileNames,
          signatureUrl, signatureImage: signatureData,
          signatureName: form.signatureName, signatureDate: form.signatureDate,
          termsAccepted: true,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Submission failed');
      setStage('done');
    } catch (err: any) {
      setStatus('error'); setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  const p0 = ctx?.properties?.[0] || {};
  const propAddr = ctx?.propertyAddress || [p0.flatNumber, p0.street, p0.city, p0.postcode].filter(Boolean).join(', ');
  const propMeta = [p0.propertyType, p0.bedrooms && `${p0.bedrooms} bed`, p0.bathrooms && `${p0.bathrooms} bath`, p0.furnishing].filter(Boolean).join(' · ');

  return (
    <>
      <div className="jl">
        {stage === 'checking' && <div className="jl-center"><div className="jl-spin" /><p>Checking your link…</p></div>}

        {stage === 'invalid' && <Msg icon="⚠️" title="This link isn't valid" body="It may have expired or already been used. Please ask the primary landlord to re-send your invitation." />}
        {stage === 'completed' && <Msg icon="✅" title="Already completed" body="Your joint landlord details have already been submitted. There's nothing more to do." />}
        {stage === 'declined' && <Msg icon="🚫" title="Registration declined" body="You've declined this joint registration and it has been voided. The primary landlord and our office have been notified." />}
        {stage === 'done' && <Msg icon="🎉" title={`Thank you, ${form.fullName.split(' ')[0]}`} body="Your details and signature are received. We've emailed you the signed agreement and set up your Landlord Portal login (check your inbox). Our team has been notified — nothing more is needed." />}

        {/* ── Decision ── */}
        {stage === 'decision' && ctx && (
          <div className="jl-shell">
            <div className="jl-head">
              <div className="jl-badge">Joint Landlord</div>
              <h1>You've been named as a joint landlord</h1>
              <p><strong>{ctx.firstName}</strong> registered the property below with House of Lettings and named you as a joint landlord. Please review and choose whether to accept.</p>
            </div>
            <div className="jl-card">
              <h2>What was registered</h2>
              <Recap label="Property" value={propAddr || '—'} />
              {propMeta && <Recap label="Details" value={propMeta} />}
              {p0.currentRent && <Recap label="Expected rent" value={`£${p0.currentRent}/month`} />}
              <Recap label="Service package" value={ctx.packageLabel || '—'} />
              {bundle && <Recap label="Fees" value={bundle.mgmtFee ? `${bundle.setupFee} set up, then ${bundle.mgmtFee} management` : `${bundle.setupFee} set up, one-off`} />}
              <Recap label="Primary landlord" value={ctx.firstName} last />
            </div>
            <div className="jl-decide">
              <button className="jl-submit" onClick={() => setStage('form')}>✓ I accept — continue</button>
              <button className="jl-decline" onClick={decline} disabled={declining}>{declining ? 'Declining…' : '✕ I decline'}</button>
            </div>
            <p className="jl-fineprint">If you decline, this registration will be voided and {ctx.firstName} will be notified. Both landlords must agree for it to proceed.</p>
          </div>
        )}

        {/* ── Form (after accept) ── */}
        {stage === 'form' && ctx && (
          <div className="jl-shell">
            <div className="jl-head">
              <div className="jl-badge">Joint Landlord · Step 2</div>
              <h1>Your details &amp; signature</h1>
              <p>The property and service are already set from {ctx.firstName}'s registration — you just add your own details, documents and signature.</p>
            </div>

            <div className="jl-card jl-locked">
              <h2>Property &amp; service <span className="jl-lock">🔒 set by primary landlord</span></h2>
              <Recap label="Property" value={propAddr || '—'} />
              {propMeta && <Recap label="Details" value={propMeta} />}
              <Recap label="Service package" value={ctx.packageLabel || '—'} last />
            </div>

            <div className="jl-card">
              <h2>Your details</h2>
              <div className="jl-grid">
                <Field label="Full Name" req err={errors.fullName}><input className="jl-input" value={form.fullName} onChange={setField('fullName')} placeholder="Your full legal name" /></Field>
                <Field label="Email Address" req err={errors.email}><input className="jl-input" type="email" value={form.email} onChange={setField('email')} placeholder="name@example.co.uk" /></Field>
                <Field label="Telephone Number" req err={errors.phone}><input className="jl-input" type="tel" value={form.phone} onChange={setField('phone')} placeholder="07…" /></Field>
                <Field label="Contact / Billing Address" req err={errors.contactAddress} full><input className="jl-input" value={form.contactAddress} onChange={setField('contactAddress')} placeholder="Where we send documents" /></Field>
              </div>
              <div className="jl-res">
                <span className="jl-label">Tax residency<span className="jl-req">*</span></span>
                <label className="jl-radio"><input type="radio" name="res" checked={form.residency === 'resident'} onChange={() => setForm(f => ({ ...f, residency: 'resident' }))} /> UK-resident landlord</label>
                <label className="jl-radio"><input type="radio" name="res" checked={form.residency === 'non-resident'} onChange={() => setForm(f => ({ ...f, residency: 'non-resident' }))} /> Non-resident landlord</label>
                {errors.residency && <p className="jl-err">{errors.residency}</p>}
              </div>
            </div>

            <div className="jl-card">
              <h2>Your documents</h2>
              {ID_DOCS.map(d => (
                <div key={d.key} className="jl-doc">
                  <div className="jl-doc-head"><span className="jl-label">{d.label}<span className="jl-req">*</span></span><span className="jl-hint">{d.hint}</span></div>
                  <button type="button" className="jl-upload" disabled={docs[d.key].uploading || docs[d.key].urls.length >= MAX_FILES} onClick={() => fileRefs.current[d.key]?.click()}>
                    {docs[d.key].uploading ? 'Uploading…' : `⬆ Upload ${docs[d.key].urls.length ? 'more' : 'file(s)'}`}
                  </button>
                  <input ref={el => { fileRefs.current[d.key] = el; }} type="file" hidden multiple accept="image/*,application/pdf" onChange={e => { onUpload(d.key, e.target.files); e.target.value = ''; }} />
                  {docs[d.key].urls.map((u, i) => (
                    <div key={u} className="jl-file"><span>📎 {docs[d.key].fileNames[i] || `File ${i + 1}`}</span><button type="button" onClick={() => removeFile(d.key, i)} aria-label="Remove">✕</button></div>
                  ))}
                  {docs[d.key].error && <p className="jl-err">{docs[d.key].error}</p>}
                  {errors[d.key] && <p className="jl-err">{errors[d.key]}</p>}
                </div>
              ))}
            </div>

            {bundle && (
              <div className="jl-card">
                <h2>The agreement</h2>
                <p className="jl-hint" style={{ marginBottom: 12 }}>The Residential Lettings &amp; Management Agreement for the {ctx.packageLabel} service. Please read before signing.</p>
                <div className="jl-agreement">
                  <p style={{ margin: '0 0 12px' }}>{effectiveIntro(null)}</p>
                  {buildAgreementSections(bundle, null).map(sec => (
                    <div key={sec.n} style={{ marginBottom: 14 }}>
                      <div className="jl-ag-h">{sec.n}. {sec.title}</div>
                      {sec.paras?.map((p, i) => <p key={i} className="jl-ag-p">{sec.n}.{i + 1}  {p}</p>)}
                      {sec.groups?.map((g, gi) => (
                        <div key={gi} style={{ margin: '6px 0' }}>
                          <div className="jl-ag-gh">{g.heading}</div>
                          <ul className="jl-ag-ul">{g.items.map((it, ii) => <li key={ii}>{it}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <label className="jl-terms">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
                  <span>I have read and accept the terms of this agreement as a joint landlord.</span>
                </label>
                {errors.terms && <p className="jl-err">{errors.terms}</p>}
              </div>
            )}

            <div className="jl-card">
              <h2>Your signature</h2>
              <SignaturePad onChange={setSignatureData} penColor="#0a162f" />
              {errors.signature && <p className="jl-err" style={{ marginTop: 8 }}>{errors.signature}</p>}
              <div className="jl-grid" style={{ marginTop: 16 }}>
                <Field label="Type your full name to confirm" req err={errors.signatureName}><input className="jl-input" value={form.signatureName} onChange={setField('signatureName')} placeholder="Full legal name" /></Field>
                <Field label="Date of signature" req err={errors.signatureDate}><input className="jl-input" type="date" value={form.signatureDate} onChange={setField('signatureDate')} style={{ colorScheme: 'light' }} /></Field>
              </div>
              <p style={{ fontSize: 12, color: '#9aa4b2', marginTop: 12, lineHeight: 1.5 }}>An electronic signature is legally binding under the Electronic Communications Act 2000. A signed PDF copy will be emailed to you and to House of Lettings.</p>
            </div>

            {status === 'error' && <div className="jl-banner">⚠️ {errorMsg}</div>}
            <button className="jl-submit" onClick={submit} disabled={status === 'loading'}>{status === 'loading' ? 'Submitting…' : 'Sign & submit →'}</button>
          </div>
        )}
      </div>

      <style>{`
        .jl { min-height: 70vh; background: #f4f6fb; padding: 40px 20px 70px; font-family: 'Poppins', sans-serif; }
        .jl-shell { max-width: 720px; margin: 0 auto; }
        .jl-center { max-width: 460px; margin: 60px auto; text-align: center; color: #26303f; }
        .jl-spin { width: 36px; height: 36px; margin: 0 auto 14px; border: 3px solid #e4e9f2; border-top-color: #c0392b; border-radius: 50%; animation: jl-rot .8s linear infinite; }
        @keyframes jl-rot { to { transform: rotate(360deg); } }
        .jl-head { margin-bottom: 22px; }
        .jl-badge { display: inline-block; background: #eaf1ff; color: #2563eb; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
        .jl-head h1 { font-size: 28px; font-weight: 800; color: #0a162f; margin: 14px 0 8px; letter-spacing: -.5px; }
        .jl-head p { font-size: 14.5px; color: #5b6b82; line-height: 1.65; margin: 0; }
        .jl-card { background: #fff; border: 1px solid #e7ebf3; border-radius: 16px; padding: 26px; margin-bottom: 20px; box-shadow: 0 6px 22px rgba(10,22,47,.04); }
        .jl-card h2 { font-size: 17px; font-weight: 800; color: #0a162f; margin: 0 0 18px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .jl-locked { background: #f9fbfd; border-style: dashed; }
        .jl-lock { font-size: 11px; font-weight: 600; color: #8a94a3; background: #eef2f7; padding: 3px 9px; border-radius: 20px; text-transform: none; letter-spacing: 0; }
        .jl-recap { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid #f0f2f7; font-size: 14px; }
        .jl-recap span:first-child { color: #8a94a3; }
        .jl-recap span:last-child { color: #0a162f; font-weight: 600; text-align: right; }
        .jl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .jl-field--full { grid-column: 1 / -1; }
        .jl-label { display: block; font-size: 13px; font-weight: 600; color: #2b3648; margin-bottom: 7px; }
        .jl-req { color: #c0392b; margin-left: 3px; }
        .jl-hint { display: block; font-size: 12px; color: #8a94a3; font-weight: 400; margin-top: 3px; }
        .jl-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1.5px solid #e2e7f0; border-radius: 10px; font-size: 14.5px; outline: none; font-family: inherit; transition: border-color .2s, box-shadow .2s; }
        .jl-input:focus { border-color: #c0392b; box-shadow: 0 0 0 4px rgba(192,57,43,.10); }
        .jl-res { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 18px; align-items: center; }
        .jl-res .jl-label { width: 100%; margin-bottom: 2px; }
        .jl-radio { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; cursor: pointer; }
        .jl-radio input { width: 17px; height: 17px; accent-color: #c0392b; }
        .jl-doc { padding: 16px 0; border-top: 1px solid #f0f2f7; }
        .jl-doc:first-of-type { border-top: none; padding-top: 0; }
        .jl-doc-head { margin-bottom: 10px; }
        .jl-upload { background: #f6f8fc; border: 1.5px dashed #c7d2e6; color: #2563eb; font-weight: 600; font-size: 13.5px; padding: 12px 18px; border-radius: 10px; cursor: pointer; font-family: inherit; transition: background .2s; }
        .jl-upload:hover:not(:disabled) { background: #eef3fb; }
        .jl-upload:disabled { opacity: .55; cursor: not-allowed; }
        .jl-file { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; background: #f8fafc; border: 1px solid #eef1f6; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #374151; }
        .jl-file button { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 14px; }
        .jl-agreement { max-height: 300px; overflow-y: auto; border: 1px solid #eef1f6; border-radius: 10px; background: #fafbfc; padding: 18px; font-size: 12.5px; color: #4b5563; line-height: 1.6; }
        .jl-ag-h { font-weight: 800; color: #0a162f; font-size: 13px; margin: 0 0 4px; }
        .jl-ag-p { margin: 0 0 5px; }
        .jl-ag-gh { font-weight: 700; color: #16a34a; font-size: 12.5px; }
        .jl-ag-ul { margin: 4px 0; padding-left: 18px; }
        .jl-terms { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; font-size: 13.5px; color: #374151; cursor: pointer; line-height: 1.5; }
        .jl-terms input { margin-top: 3px; width: 17px; height: 17px; accent-color: #c0392b; flex-shrink: 0; }
        .jl-err { color: #b3261e; font-size: 12.5px; margin: 6px 0 0; }
        .jl-banner { background: #fdecea; border: 1px solid #f5c6c0; color: #b3261e; padding: 13px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; }
        .jl-decide { display: flex; gap: 14px; flex-wrap: wrap; }
        .jl-submit { flex: 1; min-width: 200px; padding: 16px; border: none; border-radius: 12px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 12px 26px rgba(192,57,43,.26); transition: transform .15s; }
        .jl-submit:hover:not(:disabled) { transform: translateY(-2px); }
        .jl-submit:disabled { opacity: .7; cursor: not-allowed; }
        .jl-decline { padding: 16px 24px; border: 1.5px solid #e2e7f0; border-radius: 12px; background: #fff; color: #6b7280; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .2s; }
        .jl-decline:hover:not(:disabled) { border-color: #c0392b; color: #c0392b; }
        .jl-decline:disabled { opacity: .6; cursor: not-allowed; }
        .jl-fineprint { font-size: 12.5px; color: #9aa4b2; margin: 16px 2px 0; line-height: 1.5; }
        @media (max-width: 640px) { .jl-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}

function Field({ label, req, err, full, children }: { label: string; req?: boolean; err?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'jl-field--full' : ''}>
      <label className="jl-label">{label}{req && <span className="jl-req">*</span>}</label>
      {children}
      {err && <p className="jl-err">{err}</p>}
    </div>
  );
}

function Recap({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <div className="jl-recap" style={last ? { borderBottom: 'none' } : undefined}><span>{label}</span><span>{value}</span></div>;
}

function Msg({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="jl-shell" style={{ maxWidth: 460 }}>
      <div className="jl-card" style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a162f', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ color: '#5b6b82', fontSize: 15, lineHeight: 1.6, margin: '0 0 22px' }}>{body}</p>
        <Link href="/" style={{ display: 'inline-block', background: '#0a162f', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '13px 30px', borderRadius: 10, fontSize: 14 }}>Back to website</Link>
      </div>
    </div>
  );
}
