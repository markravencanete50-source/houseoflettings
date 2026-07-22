'use client';
// app/landlord-registration/joint/JointLandlordClient.tsx
// The joint (second) landlord completes ONLY their own personal info, documents
// and signature — no package, no property details, no compliance certificates.
// Validates the one-time token, then posts to /api/landlord-registration/second.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SignaturePad from '@/components/SignaturePad';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const MAX_FILES = 6;

const ID_DOCS = [
  { key: 'landlordId', label: 'Your ID', hint: 'Passport, driving licence or national ID card.' },
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

type Ctx = { firstName: string; packageLabel: string; propertyAddress: string; landlord2Name: string; landlord2Email: string; landlord2Phone: string };

export default function JointLandlordClient() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  const token = params.get('token') || '';

  const [state, setState] = useState<'checking' | 'valid' | 'invalid' | 'completed'>('checking');
  const [ctx, setCtx] = useState<Ctx | null>(null);

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', contactAddress: '', residency: '', signatureName: '' });
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({ landlordId: emptyDoc(), billingProof: emptyDoc(), ownershipProof: emptyDoc() });
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRefs = useRef<Record<DocKey, HTMLInputElement | null>>({ landlordId: null, billingProof: null, ownershipProof: null });

  useEffect(() => {
    if (!id || !token) { setState('invalid'); return; }
    fetch(`/api/landlord-registration/second?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.completed) { setState('completed'); return; }
        if (!d.valid) { setState('invalid'); return; }
        setCtx(d);
        setForm(f => ({ ...f, fullName: d.landlord2Name || '', email: d.landlord2Email || '', phone: d.landlord2Phone || '' }));
        setState('valid');
      })
      .catch(() => setState('invalid'));
  }, [id, token]);

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const onUpload = async (key: DocKey, files: FileList | null) => {
    if (!files || !files.length) return;
    const room = Math.max(0, MAX_FILES - docs[key].urls.length);
    const picked = Array.from(files).slice(0, room);
    setDocs(d => ({ ...d, [key]: { ...d[key], uploading: true, error: '' } }));
    const addedUrls: string[] = []; const addedNames: string[] = [];
    try {
      for (const file of picked) {
        if (file.size > 10 * 1024 * 1024) { throw new Error(`${file.name} is over 10MB`); }
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
    if (!form.signatureName.trim()) e.signatureName = 'Type your full name to confirm';
    if (!signatureData) e.signature = 'Please add your signature';
    if (Object.keys(e).length) { setErrors(e); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setErrors({});
    setStatus('loading'); setErrorMsg('');
    try {
      let signatureUrl = '';
      try {
        const f = dataUrlToFile(signatureData!, `joint-signature-${Date.now()}.png`);
        signatureUrl = await uploadToCloudinary(f, CLOUDINARY_FOLDERS.agreements);
      } catch { /* non-fatal — data URL still builds the PDF */ }

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
          signatureName: form.signatureName,
          signatureDate: new Date().toLocaleDateString('en-GB'),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Submission failed');
      setStatus('done');
    } catch (err: any) {
      setStatus('error'); setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="jl">
        {state === 'checking' && <div className="jl-center"><div className="jl-spin" /><p>Checking your link…</p></div>}

        {state === 'invalid' && (
          <div className="jl-card jl-msg">
            <div className="jl-ico">⚠️</div>
            <h1>This link isn't valid</h1>
            <p>It may have expired or already been used. Please ask the primary landlord to re-send your invitation.</p>
            <Link href="/" className="jl-btn">Back to website</Link>
          </div>
        )}

        {state === 'completed' && (
          <div className="jl-card jl-msg">
            <div className="jl-ico">✅</div>
            <h1>Already completed</h1>
            <p>Your joint landlord details have already been submitted. There's nothing more to do.</p>
            <Link href="/" className="jl-btn">Back to website</Link>
          </div>
        )}

        {state === 'valid' && status === 'done' && (
          <div className="jl-card jl-msg">
            <div className="jl-ico">🎉</div>
            <h1>Thank you, {form.fullName.split(' ')[0]}</h1>
            <p>Your details and documents have been received. A copy has been emailed to you, and our team has been notified. Nothing more is needed from you.</p>
            <Link href="/" className="jl-btn">Back to website</Link>
          </div>
        )}

        {state === 'valid' && status !== 'done' && ctx && (
          <div className="jl-shell">
            <div className="jl-head">
              <div className="jl-badge">Joint Landlord</div>
              <h1>Complete your details</h1>
              <p>
                <strong>{ctx.firstName}</strong> registered {ctx.propertyAddress ? <>the property at <strong>{ctx.propertyAddress}</strong> </> : ''}
                with House of Lettings under the <strong>{ctx.packageLabel}</strong> package and named you as a joint landlord.
                We just need your own details, documents and signature — no package or certificates.
              </p>
            </div>

            <div className="jl-card">
              <h2>Your details</h2>
              <div className="jl-grid">
                <Field label="Full Name" req err={errors.fullName}>
                  <input className="jl-input" value={form.fullName} onChange={setField('fullName')} placeholder="Your full legal name" />
                </Field>
                <Field label="Email Address" req err={errors.email}>
                  <input className="jl-input" type="email" value={form.email} onChange={setField('email')} placeholder="name@example.co.uk" />
                </Field>
                <Field label="Telephone Number" req err={errors.phone}>
                  <input className="jl-input" type="tel" value={form.phone} onChange={setField('phone')} placeholder="07…" />
                </Field>
                <Field label="Contact / Billing Address" req err={errors.contactAddress} full>
                  <input className="jl-input" value={form.contactAddress} onChange={setField('contactAddress')} placeholder="Where we send documents" />
                </Field>
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
                  <div className="jl-doc-head">
                    <span className="jl-label">{d.label}<span className="jl-req">*</span></span>
                    <span className="jl-hint">{d.hint}</span>
                  </div>
                  <button type="button" className="jl-upload" disabled={docs[d.key].uploading || docs[d.key].urls.length >= MAX_FILES}
                    onClick={() => fileRefs.current[d.key]?.click()}>
                    {docs[d.key].uploading ? 'Uploading…' : `⬆ Upload ${docs[d.key].urls.length ? 'more' : 'file(s)'}`}
                  </button>
                  <input ref={el => { fileRefs.current[d.key] = el; }} type="file" hidden multiple
                    accept="image/*,application/pdf"
                    onChange={e => { onUpload(d.key, e.target.files); e.target.value = ''; }} />
                  {docs[d.key].urls.map((u, i) => (
                    <div key={u} className="jl-file">
                      <span>📎 {docs[d.key].fileNames[i] || `File ${i + 1}`}</span>
                      <button type="button" onClick={() => removeFile(d.key, i)} aria-label="Remove">✕</button>
                    </div>
                  ))}
                  {docs[d.key].error && <p className="jl-err">{docs[d.key].error}</p>}
                  {errors[d.key] && <p className="jl-err">{errors[d.key]}</p>}
                </div>
              ))}
            </div>

            <div className="jl-card">
              <h2>Your signature</h2>
              <p className="jl-hint" style={{ marginBottom: 12 }}>Draw your signature below to confirm you are a joint landlord on this property.</p>
              <SignaturePad onChange={setSignatureData} penColor="#0a162f" />
              {errors.signature && <p className="jl-err" style={{ marginTop: 8 }}>{errors.signature}</p>}
              <div className="jl-grid" style={{ marginTop: 16 }}>
                <Field label="Type your full name to confirm" req err={errors.signatureName} full>
                  <input className="jl-input" value={form.signatureName} onChange={setField('signatureName')} placeholder="Full legal name" />
                </Field>
              </div>
              <p style={{ fontSize: 12, color: '#9aa4b2', marginTop: 12, lineHeight: 1.5 }}>
                An electronic signature is legally binding under the Electronic Communications Act 2000. A signed PDF copy will be emailed to you and to House of Lettings.
              </p>
            </div>

            {status === 'error' && <div className="jl-banner">⚠️ {errorMsg}</div>}

            <button className="jl-submit" onClick={submit} disabled={status === 'loading'}>
              {status === 'loading' ? 'Submitting…' : 'Submit my details →'}
            </button>
          </div>
        )}
      </div>
      <Footer />

      <style>{`
        .jl { min-height: 70vh; background: #f4f6fb; padding: 40px 20px 70px; font-family: 'Poppins', sans-serif; }
        .jl-shell { max-width: 720px; margin: 0 auto; }
        .jl-center, .jl-msg { max-width: 460px; margin: 60px auto; text-align: center; color: #26303f; }
        .jl-spin { width: 36px; height: 36px; margin: 0 auto 14px; border: 3px solid #e4e9f2; border-top-color: #c0392b; border-radius: 50%; animation: jl-rot .8s linear infinite; }
        @keyframes jl-rot { to { transform: rotate(360deg); } }
        .jl-head { margin-bottom: 22px; }
        .jl-badge { display: inline-block; background: #eaf1ff; color: #2563eb; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
        .jl-head h1 { font-size: 28px; font-weight: 800; color: #0a162f; margin: 14px 0 8px; letter-spacing: -.5px; }
        .jl-head p { font-size: 14.5px; color: #5b6b82; line-height: 1.65; margin: 0; }
        .jl-card { background: #fff; border: 1px solid #e7ebf3; border-radius: 16px; padding: 26px; margin-bottom: 20px; box-shadow: 0 6px 22px rgba(10,22,47,.04); }
        .jl-card h2 { font-size: 17px; font-weight: 800; color: #0a162f; margin: 0 0 18px; }
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
        .jl-err { color: #b3261e; font-size: 12.5px; margin: 6px 0 0; }
        .jl-banner { background: #fdecea; border: 1px solid #f5c6c0; color: #b3261e; padding: 13px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; }
        .jl-submit { width: 100%; padding: 16px; border: none; border-radius: 12px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 12px 26px rgba(192,57,43,.26); transition: transform .15s; }
        .jl-submit:hover:not(:disabled) { transform: translateY(-2px); }
        .jl-submit:disabled { opacity: .7; cursor: not-allowed; }
        .jl-ico { font-size: 48px; margin-bottom: 12px; }
        .jl-msg h1 { font-size: 24px; font-weight: 800; color: #0a162f; margin: 0 0 10px; }
        .jl-msg p { color: #5b6b82; font-size: 15px; line-height: 1.6; margin: 0 0 22px; }
        .jl-btn { display: inline-block; background: #0a162f; color: #fff; text-decoration: none; font-weight: 700; padding: 13px 30px; border-radius: 10px; font-size: 14px; }
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
