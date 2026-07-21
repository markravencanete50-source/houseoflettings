'use client';
// app/landlord-agreement/AgreementFormClient.tsx
// The landlord-facing "sign your management agreement" flow. Reached after a
// valuation, once the landlord has agreed to instruct us. A five-step wizard:
//   1. Landlord details (with an optional joint landlord)
//   2. Property details (Homedata postcode lookup, same as every other form)
//   3. Choose the service (the five packages from lib/bundles.ts)
//   4. Read the full agreement + resident/non-resident declaration + accept terms
//   5. Sign electronically (draw or upload) and submit
//
// The agreement text shown in step 4 is built by lib/agreementContent.ts from
// the chosen bundle, so what the landlord reads is byte-for-byte what the API
// writes into the signed PDF. Signing is free: no DocuSign, no Stripe.
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import SignaturePad from '@/components/SignaturePad';
import { BUNDLES } from '@/lib/bundles';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';
import {
  AGENT_DETAILS,
  effectiveIntro,
  buildAgreementSections,
  findBundle,
  type AgreementTemplate,
} from '@/lib/agreementContent';

// ── Cloudinary direct upload (bypasses Vercel's ~4.5MB body limit) ──────────
async function uploadToCloudinary(file: File): Promise<string> {
  const folder = CLOUDINARY_FOLDERS.agreements;
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  if (!sigRes.ok) throw new Error('Could not prepare upload');
  const { cloudName, apiKey, timestamp, folder: signedFolder, signature } = await sigRes.json();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('folder', signedFolder);
  fd.append('signature', signature);
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

const EMPTY = {
  fullName: '', email: '', phone: '', contactAddress: '',
  jointLandlord: false, landlord2Name: '', landlord2Email: '',
  residency: '', // 'resident' | 'non-resident'
  postcode: '', street: '', city: '', county: '', flatNumber: '',
  propertyType: '', bedrooms: '', bathrooms: '', receptions: '',
  furnishing: '', parking: '', availableFrom: '', currentRent: '', securityNote: '',
  selectedPackageId: '', selectedPackage: '',
  termsAccepted: false,
  signatureName: '', signatureDate: '',
};
type FormState = typeof EMPTY;

const STORAGE_KEY = 'hol-landlord-agreement-draft-v1';
const STEPS = ['Landlord', 'Property', 'Service', 'Agreement', 'Sign'];

const PROPERTY_TYPES = ['Flat', 'Terraced house', 'Semi-detached house', 'Detached house', 'Bungalow', 'Maisonette', 'Studio', 'Room / HMO', 'Other'];
const COUNTS = ['Studio', '1', '2', '3', '4+'];
const BATH_COUNTS = ['1', '2', '3', '4+'];
const FURNISHINGS = ['Furnished', 'Part-furnished', 'Unfurnished'];
const PARKINGS = ['None', 'On-street', 'Driveway', 'Garage', 'Allocated space'];

export default function AgreementFormClient() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('agreementId') || '';
  const resumeToken = searchParams.get('token') || '';
  const isResume = !!(resumeId && resumeToken);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [restored, setRestored] = useState(false);
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [resumeLoading, setResumeLoading] = useState(isResume);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  // Signature: a drawn/uploaded PNG data URL kept in memory (never persisted to
  // sessionStorage; it is large and re-drawing is trivial).
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bundle = findBundle(form.selectedPackageId) || findBundle(form.selectedPackage);

  // Load the admin-editable clause wording (falls back to code defaults).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/agreement-template')
      .then(r => r.json())
      .then(j => { if (!cancelled) setTemplate(j.template || {}); })
      .catch(() => { if (!cancelled) setTemplate({}); });
    return () => { cancelled = true; };
  }, []);

  // On mount: in resume mode, pre-fill from the server (the landlord came back
  // via a re-issue link to re-sign); otherwise restore any saved draft.
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-GB');
    if (isResume) {
      fetch(`/api/landlord-agreement/resume?id=${encodeURIComponent(resumeId)}&token=${encodeURIComponent(resumeToken)}`)
        .then(async r => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.message || 'This signing link is invalid or has expired.');
          setForm(f => ({ ...EMPTY, ...f, ...j.fields, signatureDate: today }));
          setStep(3); // jump to the agreement review, then Sign
          setResumeLoading(false); // success: show the form
          setRestored(true);
        })
        // On error, keep the loading screen so it shows the error (not an empty
        // form) — the link is invalid, expired, or the record is gone.
        .catch((e: any) => { setError(e.message || 'Could not load your agreement.'); setRestored(true); });
      return;
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setForm({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setForm(f => (f.signatureDate ? f : { ...f, signatureDate: today }));
    setRestored(true);
  }, [isResume, resumeId, resumeToken]);

  // Persist after restore so StrictMode's double-mount can't wipe the draft.
  // Never persist a re-issue session (it belongs to a specific record).
  useEffect(() => {
    if (!restored || isResume) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form, restored, isResume]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const onAddress = useCallback((a: AddressResult) => {
    setForm(f => ({ ...f, street: a.street, city: a.city, county: a.county, postcode: a.postcode }));
  }, []);

  // ── Per-step validation ──────────────────────────────────────────────────
  const validate = (s: number): string => {
    if (s === 0) {
      if (!form.fullName.trim()) return 'Please enter the landlord’s full name.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Please enter a valid email address.';
      if (!form.phone.trim()) return 'Please enter a contact telephone number.';
      if (!form.contactAddress.trim()) return 'Please enter your contact address.';
      if (form.jointLandlord && !form.landlord2Name.trim()) return 'Please enter the second landlord’s name, or turn off joint landlord.';
    }
    if (s === 1) {
      if (!form.postcode.trim() || !form.street.trim()) return 'Please enter the property postcode and address.';
      if (!form.propertyType) return 'Please choose the property type.';
    }
    if (s === 2) {
      if (!form.selectedPackageId) return 'Please choose the service you would like.';
    }
    if (s === 3) {
      if (!form.residency) return 'Please confirm whether you are a UK-resident or non-resident landlord.';
      if (!form.termsAccepted) return 'Please tick the box to accept the terms of the agreement.';
    }
    return '';
  };

  const next = () => {
    const e = validate(step);
    if (e) { setError(e); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const onUploadSignature = async (file: File) => {
    setUploadingSig(true);
    setError('');
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      setSignatureData(dataUrl);
    } catch {
      setError('Could not read that image. Please try another file.');
    } finally {
      setUploadingSig(false);
    }
  };

  const submit = async () => {
    if (!form.signatureName.trim()) { setError('Please type your full name to confirm your signature.'); return; }
    if (!signatureData) { setError('Please add your signature by drawing it or uploading an image.'); return; }
    if (!bundle) { setError('Please choose a service.'); return; }
    setSubmitting(true);
    setError('');
    try {
      // Store the signature image in Cloudinary for the office record; the raw
      // data URL is also sent so the API can embed it into the PDF.
      let signatureUrl = '';
      try {
        const file = dataUrlToFile(signatureData, `signature-${Date.now()}.png`);
        signatureUrl = await uploadToCloudinary(file);
      } catch { /* non-fatal: the data URL still reaches the PDF/email */ }

      const payload = {
        ...form,
        selectedPackage: bundle.label,
        signatureUrl,
        signatureImage: signatureData, // NOT a *Url field, so it survives sanitising
        ...(isResume ? { agreementId: resumeId, reissueToken: resumeToken } : {}),
      };
      const res = await fetch('/api/landlord-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Something went wrong. Please try again.');
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setDone({ ref: json.id || '' });
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <>
        <Navbar />
        <main className="la-wrap">
          <div className="la-card la-done">
            <div className="la-done-tick">✓</div>
            <h1>Agreement signed</h1>
            <p>
              Thank you, {form.fullName || 'landlord'}. Your {bundle?.label} agreement has been signed and sent.
              A copy has been emailed to <strong>{form.email}</strong> with the full signed PDF attached, covering
              your bundle of services and the tenancy management terms. Our team has been notified and will be in
              touch shortly to begin.
            </p>
            {done.ref && <p className="la-ref">Reference: {done.ref}</p>}
            <Link href="/landlords" className="la-btn la-btn-solid" style={{ marginTop: 8 }}>Back to landlord hub</Link>
          </div>
        </main>
        <Footer />
        <style>{STYLES}</style>
      </>
    );
  }

  if (resumeLoading) {
    return (
      <>
        <Navbar />
        <main className="la-wrap">
          <div className="la-card" style={{ textAlign: 'center', color: '#6b7280' }}>
            {error ? <p className="la-error" style={{ marginTop: 0 }}>{error}</p> : 'Loading your agreement…'}
          </div>
        </main>
        <Footer />
        <style>{STYLES}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="la-wrap">
        <header className="la-head">
          <span className="la-eyebrow">Landlord Agreement</span>
          <h1>{isResume ? 'Review and re-sign your agreement' : 'Sign your management agreement'}</h1>
          <p>
            {isResume
              ? 'Your agreement has been updated. Please review the details below and sign again to confirm the current terms.'
              : 'Choose your service, review the Residential Lettings & Management Agreement, accept the terms and sign online. It takes a few minutes and there is no cost to sign.'}
          </p>
        </header>

        {/* Step indicator */}
        <ol className="la-steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''}>
              <span className="la-step-dot">{i < step ? '✓' : i + 1}</span>
              <span className="la-step-label">{s}</span>
            </li>
          ))}
        </ol>

        <div className="la-card">
          {/* ── Step 1: Landlord ── */}
          {step === 0 && (
            <section>
              <h2>Landlord details</h2>
              <div className="la-grid">
                <Field label="Full name (as it should appear on the agreement)" req>
                  <input className="la-in" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Mr John Smith" />
                </Field>
                <Field label="Email address" req>
                  <input className="la-in" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
                </Field>
                <Field label="Telephone number" req>
                  <input className="la-in" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="07…" />
                </Field>
                <Field label="Contact address" req>
                  <input className="la-in" value={form.contactAddress} onChange={e => set('contactAddress', e.target.value)} placeholder="Your correspondence address" />
                </Field>
              </div>

              <label className="la-check" style={{ marginTop: 18 }}>
                <input type="checkbox" checked={form.jointLandlord} onChange={e => set('jointLandlord', e.target.checked)} />
                <span>There is a second (joint) landlord on this property</span>
              </label>
              {form.jointLandlord && (
                <div className="la-grid" style={{ marginTop: 12 }}>
                  <Field label="Second landlord full name" req>
                    <input className="la-in" value={form.landlord2Name} onChange={e => set('landlord2Name', e.target.value)} />
                  </Field>
                  <Field label="Second landlord email (optional)">
                    <input className="la-in" type="email" value={form.landlord2Email} onChange={e => set('landlord2Email', e.target.value)} />
                  </Field>
                </div>
              )}
            </section>
          )}

          {/* ── Step 2: Property ── */}
          {step === 1 && (
            <section>
              <h2>Property details</h2>
              <p className="la-sub">The property you are instructing us to let and manage.</p>
              <Field label="Postcode & address" req>
                <PostcodeLookup
                  postcode={form.postcode}
                  onPostcodeChange={v => set('postcode', v)}
                  onSelect={onAddress}
                  inputClassName="la-in"
                  placeholder="Enter postcode"
                />
              </Field>
              <div className="la-grid" style={{ marginTop: 12 }}>
                <Field label="First line of address" req>
                  <input className="la-in" value={form.street} onChange={e => set('street', e.target.value)} placeholder="e.g. 2 Holtdale Avenue" />
                </Field>
                <Field label="Town / city">
                  <input className="la-in" value={form.city} onChange={e => set('city', e.target.value)} />
                </Field>
                <Field label="Flat / unit number (if any)">
                  <input className="la-in" value={form.flatNumber} onChange={e => set('flatNumber', e.target.value)} />
                </Field>
                <Field label="Property type" req>
                  <select className="la-in" value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                    <option value="">Select…</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Bedrooms">
                  <select className="la-in" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
                    <option value="">Select…</option>
                    {COUNTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Bathrooms">
                  <select className="la-in" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}>
                    <option value="">Select…</option>
                    {BATH_COUNTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Reception rooms">
                  <select className="la-in" value={form.receptions} onChange={e => set('receptions', e.target.value)}>
                    <option value="">Select…</option>
                    {BATH_COUNTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Furnishing">
                  <select className="la-in" value={form.furnishing} onChange={e => set('furnishing', e.target.value)}>
                    <option value="">Select…</option>
                    {FURNISHINGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Parking">
                  <select className="la-in" value={form.parking} onChange={e => set('parking', e.target.value)}>
                    <option value="">Select…</option>
                    {PARKINGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Expected monthly rent (£)">
                  <input className="la-in" inputMode="numeric" value={form.currentRent} onChange={e => set('currentRent', e.target.value.replace(/[^\d]/g, ''))} placeholder="e.g. 950" />
                </Field>
                <Field label="Available from">
                  <input className="la-in" value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)} placeholder="e.g. Immediately / 1 Aug 2026" />
                </Field>
                <Field label="Security code / access note (optional)">
                  <input className="la-in" value={form.securityNote} onChange={e => set('securityNote', e.target.value)} />
                </Field>
              </div>
            </section>
          )}

          {/* ── Step 3: Service ── */}
          {step === 2 && (
            <section>
              <h2>Choose your service</h2>
              <p className="la-sub">
                Your agreement covers the package you select here. You can see exactly what each includes on our{' '}
                <a href="/pricing" target="_blank" rel="noopener noreferrer" className="la-link">pricing page</a>.
              </p>
              <div className="la-bundles">
                {BUNDLES.map(b => {
                  const active = form.selectedPackageId === b.id;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      className={`la-bundle ${active ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, selectedPackageId: b.id, selectedPackage: b.label }))}
                    >
                      <div className="la-bundle-top">
                        <span className="la-bundle-name">{b.label}</span>
                        {b.badge && <span className="la-bundle-badge">{b.badge}</span>}
                      </div>
                      <div className="la-bundle-fee">
                        {b.mgmtFee ? (
                          <><b className="la-fee-fig">{b.mgmtFee}</b> management, <b className="la-fee-fig">{b.setupFee}</b> set up</>
                        ) : (
                          <><b className="la-fee-fig">{b.setupFee}</b> one time, no management fees</>
                        )}
                      </div>
                      <div className="la-bundle-blurb">{b.youWe}</div>
                      <span className="la-bundle-radio" aria-hidden>{active ? '●' : '○'}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Step 4: Agreement ── */}
          {step === 3 && bundle && (
            <section>
              <h2>Your agreement</h2>
              <p className="la-sub">Please read the agreement carefully before you accept and sign.</p>

              <div className="la-agreement" role="document">
                <div className="la-ag-head">
                  <h3>Residential Lettings &amp; Management Agreement</h3>
                  <p>{effectiveIntro(template)}</p>
                </div>

                <div className="la-parties">
                  <div>
                    <h4>Landlord</h4>
                    <p>{form.fullName || '-'}{form.jointLandlord && form.landlord2Name ? ` and ${form.landlord2Name}` : ''}</p>
                    <p>{form.email}{form.phone ? `, ${form.phone}` : ''}</p>
                    <p>{form.contactAddress}</p>
                  </div>
                  <div>
                    <h4>Agent</h4>
                    <p>{AGENT_DETAILS.companyName} (Co. No. {AGENT_DETAILS.companyNumber})</p>
                    <p>{AGENT_DETAILS.address}</p>
                    <p>{AGENT_DETAILS.phones}</p>
                    <p>Ombudsman {AGENT_DETAILS.ombudsman} · CMP {AGENT_DETAILS.moneyProtection}</p>
                  </div>
                </div>

                <div className="la-parties" style={{ gridTemplateColumns: '1fr' }}>
                  <div>
                    <h4>Property</h4>
                    <p>{[form.flatNumber, form.street, form.city, form.postcode].filter(Boolean).join(', ') || '-'}</p>
                    <p>
                      {[form.propertyType, form.bedrooms && `${form.bedrooms} bed`, form.furnishing].filter(Boolean).join(' · ')}
                      {form.currentRent ? ` · £${form.currentRent}/month` : ''}
                    </p>
                  </div>
                </div>

                {buildAgreementSections(bundle, template).map(sec => (
                  <div key={sec.n} className="la-clause">
                    <h4>{sec.n}. {sec.title}</h4>
                    {sec.paras?.map((p, i) => <p key={i}>{sec.n}.{i + 1} {p}</p>)}
                    {sec.groups?.map((g, gi) => (
                      <div key={gi} className="la-svc-group">
                        <div className="la-svc-heading">{g.heading}</div>
                        <ul>{g.items.map((it, ii) => <li key={ii}>{it}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                ))}

                <p className="la-ag-foot">
                  By signing, the Landlord(s) confirm they have read and accepted the terms of this Agreement
                  (including any schedules). The Agent is authorised to commence services immediately.
                </p>
              </div>

              <div className="la-declare">
                <h4>Tax residency declaration</h4>
                <p className="la-sub">Required under the HMRC Non-Resident Landlord Scheme (clause 10).</p>
                <label className="la-radio">
                  <input type="radio" name="res" checked={form.residency === 'resident'} onChange={() => set('residency', 'resident')} />
                  <span>I am a UK-resident landlord for tax purposes</span>
                </label>
                <label className="la-radio">
                  <input type="radio" name="res" checked={form.residency === 'non-resident'} onChange={() => set('residency', 'non-resident')} />
                  <span>I am a non-resident landlord (I live outside the UK)</span>
                </label>
              </div>

              <label className="la-check la-accept">
                <input type="checkbox" checked={form.termsAccepted} onChange={e => set('termsAccepted', e.target.checked)} />
                <span>
                  I have read and accept the terms of this Residential Lettings &amp; Management Agreement and the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="la-link">website terms and conditions</a>.
                </span>
              </label>
            </section>
          )}

          {/* ── Step 5: Sign ── */}
          {step === 4 && bundle && (
            <section>
              <h2>Sign the agreement</h2>
              <p className="la-sub">
                Add your signature below for the <strong>{bundle.label}</strong> agreement. Draw it with your finger
                or mouse, or upload a photo of your signature.
              </p>

              <SignaturePad onChange={setSignatureData} />

              <div className="la-or">or</div>
              <div>
                <button type="button" className="la-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploadingSig}>
                  {uploadingSig ? 'Reading…' : '⬆ Upload an image of your signature'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) onUploadSignature(f); e.target.value = ''; }}
                />
              </div>

              {signatureData && (
                <div className="la-sig-preview">
                  <span className="la-sig-ok">✓ Signature captured</span>
                  <img src={signatureData} alt="Your signature" />
                </div>
              )}

              <div className="la-grid" style={{ marginTop: 18 }}>
                <Field label="Type your full name to confirm" req>
                  <input className="la-in" value={form.signatureName} onChange={e => set('signatureName', e.target.value)} placeholder="Full legal name" />
                </Field>
                <Field label="Date">
                  <input className="la-in" value={form.signatureDate} onChange={e => set('signatureDate', e.target.value)} />
                </Field>
              </div>

              <p className="la-fineprint">
                An electronic signature is legally binding under the Electronic Communications Act 2000. A signed PDF
                copy will be emailed to you and to House of Lettings.
              </p>
            </section>
          )}

          {error && <div className="la-error">{error}</div>}

          {/* Nav */}
          <div className="la-nav">
            {step > 0
              ? <button type="button" className="la-btn la-btn-ghost" onClick={back} disabled={submitting}>Back</button>
              : <span />}
            {step < STEPS.length - 1
              ? <button type="button" className="la-btn la-btn-solid" onClick={next}>Continue</button>
              : <button type="button" className="la-btn la-btn-solid" onClick={submit} disabled={submitting}>
                  {submitting ? 'Signing…' : 'Sign & submit agreement'}
                </button>}
          </div>
        </div>
      </main>
      <Footer />
      <style>{STYLES}</style>
    </>
  );
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label className="la-field">
      <span className="la-label">{label}{req && <b className="la-req"> *</b>}</span>
      {children}
    </label>
  );
}

const STYLES = `
.la-wrap{max-width:860px;margin:0 auto;padding:40px 20px 80px;font-family:'Poppins',system-ui,sans-serif;color:#0f1f3d;}
.la-head{text-align:center;margin-bottom:28px;}
.la-eyebrow{display:inline-block;background:#eff5ff;color:#2563eb;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:6px;margin-bottom:12px;}
.la-head h1{font-size:30px;font-weight:800;margin:0 0 10px;color:#0a162f;}
.la-head p{font-size:15px;line-height:1.6;color:#5b6577;max-width:620px;margin:0 auto;}
.la-steps{display:flex;justify-content:center;gap:0;list-style:none;padding:0;margin:0 0 24px;flex-wrap:wrap;}
.la-steps li{display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:13px;font-weight:600;padding:0 10px;}
.la-steps li.active{color:#2563eb;}
.la-steps li.done{color:#16a34a;}
.la-step-dot{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#eef2f7;font-size:12px;font-weight:700;color:inherit;}
.la-steps li.active .la-step-dot{background:#2563eb;color:#fff;}
.la-steps li.done .la-step-dot{background:#16a34a;color:#fff;}
.la-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(15,31,61,.05);}
.la-card h2{font-size:21px;font-weight:800;margin:0 0 6px;color:#0a162f;}
.la-sub{font-size:14px;color:#6b7280;margin:0 0 18px;line-height:1.55;}
.la-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.la-field{display:flex;flex-direction:column;gap:6px;}
.la-label{font-size:13px;font-weight:600;color:#374151;}
.la-req{color:#dc2626;}
.la-in{width:100%;border:1.5px solid #d1d5db;border-radius:9px;padding:11px 13px;font-size:15px;font-family:inherit;color:#0f1f3d;background:#fff;box-sizing:border-box;}
.la-in:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12);}
.la-check{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#374151;line-height:1.5;cursor:pointer;}
.la-check input{margin-top:3px;width:17px;height:17px;flex-shrink:0;accent-color:#2563eb;}
.la-radio{display:flex;gap:10px;align-items:center;font-size:14px;color:#374151;padding:9px 0;cursor:pointer;}
.la-radio input{width:17px;height:17px;accent-color:#2563eb;}
.la-link{color:#dc2626;font-weight:600;text-decoration:underline;}
.la-bundles{display:flex;flex-direction:column;gap:12px;}
.la-bundle{position:relative;text-align:left;border:2px solid #e5e7eb;border-radius:12px;padding:16px 44px 16px 18px;background:#fff;cursor:pointer;transition:border-color .15s,background .15s;}
.la-bundle:hover{border-color:#c7d2fe;}
.la-bundle.active{border-color:#2563eb;background:#f5f8ff;}
.la-bundle-top{display:flex;align-items:center;gap:10px;}
.la-bundle-name{font-size:16px;font-weight:800;color:#0a162f;}
.la-bundle-badge{background:#2563eb;color:#fff;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 8px;border-radius:20px;}
.la-bundle-fee{font-size:14px;color:#374151;margin-top:5px;}
.la-fee-fig{color:#16a34a;font-weight:800;font-style:normal;}
.la-bundle-blurb{font-size:12.5px;color:#6b7280;margin-top:3px;}
.la-bundle-radio{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:22px;color:#2563eb;}
.la-agreement{border:1px solid #e5e7eb;border-radius:12px;background:#fafbfc;padding:22px;max-height:440px;overflow-y:auto;}
.la-ag-head h3{font-size:17px;font-weight:800;margin:0 0 8px;color:#0a162f;}
.la-ag-head p{font-size:12.5px;line-height:1.6;color:#4b5563;margin:0 0 14px;}
.la-parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#fff;border:1px solid #eef1f5;border-radius:8px;padding:14px;margin-bottom:14px;}
.la-parties h4{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#2563eb;margin:0 0 6px;}
.la-parties p{font-size:12.5px;color:#374151;margin:0 0 3px;line-height:1.45;}
.la-clause{margin-bottom:14px;}
.la-clause h4{font-size:14px;font-weight:800;color:#0a162f;margin:0 0 6px;}
.la-clause p{font-size:12.5px;line-height:1.6;color:#4b5563;margin:0 0 6px;}
.la-svc-group{margin:8px 0;}
.la-svc-heading{font-size:12.5px;font-weight:700;color:#16a34a;margin-bottom:4px;}
.la-svc-group ul{margin:0;padding-left:18px;}
.la-svc-group li{font-size:12.5px;line-height:1.55;color:#374151;margin-bottom:2px;}
.la-ag-foot{font-size:12.5px;line-height:1.6;color:#0a162f;font-weight:600;margin:10px 0 0;}
.la-declare{margin-top:20px;padding:16px 18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;}
.la-declare h4{font-size:15px;font-weight:700;margin:0 0 4px;color:#0a162f;}
.la-accept{margin-top:18px;padding:14px 16px;background:#f5f8ff;border:1px solid #dbe4ff;border-radius:10px;}
.la-or{text-align:center;color:#9ca3af;font-size:13px;font-weight:600;margin:14px 0;}
.la-upload-btn{width:100%;border:1.5px dashed #cbd5e1;background:#fff;border-radius:10px;padding:13px;font-size:14px;font-weight:600;color:#374151;cursor:pointer;}
.la-upload-btn:hover{border-color:#2563eb;color:#2563eb;}
.la-sig-preview{margin-top:16px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;}
.la-sig-ok{color:#16a34a;font-weight:700;font-size:13px;}
.la-sig-preview img{max-height:110px;max-width:100%;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:6px;}
.la-fineprint{font-size:12px;color:#9ca3af;line-height:1.5;margin-top:14px;}
.la-error{margin-top:18px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:14px;font-weight:600;padding:12px 14px;border-radius:9px;}
.la-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:26px;}
.la-btn{padding:14px 28px;font-size:13.5px;font-weight:700;border-radius:9px;min-height:48px;line-height:1.2;box-sizing:border-box;border:1.5px solid transparent;cursor:pointer;font-family:inherit;}
.la-btn-solid{background:#2563eb;color:#fff;}
.la-btn-solid:hover{background:#1d4ed8;}
.la-btn-solid:disabled{opacity:.6;cursor:default;}
.la-btn-ghost{background:#fff;color:#374151;border-color:#d1d5db;}
.la-done{text-align:center;}
.la-done-tick{width:64px;height:64px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:34px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;}
.la-done h1{font-size:26px;font-weight:800;color:#0a162f;margin:0 0 12px;}
.la-done p{font-size:15px;line-height:1.65;color:#4b5563;max-width:560px;margin:0 auto 10px;}
.la-ref{font-family:monospace;font-size:13px;color:#9ca3af;}
@media (max-width:600px){
  .la-grid{grid-template-columns:1fr;}
  .la-parties{grid-template-columns:1fr;}
  .la-head h1{font-size:24px;}
  .la-card{padding:22px 18px;}
  .la-in{font-size:16px;}
  .la-step-label{display:none;}
  .la-btn{padding:14px 20px;}
}
`;
