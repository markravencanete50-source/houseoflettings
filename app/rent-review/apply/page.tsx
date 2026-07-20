'use client';
// app/rent-review/apply/page.tsx
// Rent Review Process form, for existing tenants ~12 months into a managed
// tenancy. A multi-step wizard (matching the landlord-registration/apply design
// system) that: picks the managed property, confirms household & finances,
// collects documents, confirms the revised rent and effective date, reports any
// maintenance, and captures the renewal declaration.
//
// The property list comes from /api/rent-review-properties (Firestore-managed,
// no code change to add one). The office can also send a personalised link to
// preselect the property and prefill the rent figures:
//   /rent-review/apply?address=...&currentRent=950&proposedRent=975&effectiveDate=2026-09-01&name=...&email=...&phone=...
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';
import type { RentReviewProperty } from '@/lib/rentReviewProperties';

const STEPS = ['Property & You', 'Household & Finances', 'Documents', 'Rent & Maintenance', 'Confirm'];
const STORAGE_KEY = 'hol-rent-review-draft-v2';
const MAINTENANCE_CATEGORIES = ['Plumbing', 'Electrical', 'Heating', 'Damp', 'Appliances', 'Other'];

type Upload = { urls: string[]; names: string[]; uploading: boolean; error: string };
const emptyUpload = (): Upload => ({ urls: [], names: [], uploading: false, error: '' });

const EMPTY_FORM = {
  // Property
  propertyId: '', propertyAddress: '', postcode: '', currentRent: '', proposedRent: '', effectiveDate: '',
  // Contact
  fullName: '', email: '', phone: '',
  // Household
  adultOccupants: '', childOccupants: '', childrenAges: '',
  pets: '' as '' | 'yes' | 'no', petDetails: '',
  annualIncome: '',
  // Financial
  hasCCJ: '' as '' | 'yes' | 'no', ccjDetails: '',
  shareCode: '',
  // Revised rent
  rentDecision: '' as '' | 'accept' | 'discuss',
  tenantProposedRent: '', rentDiscussReason: '',
  // Maintenance
  hasMaintenance: '' as '' | 'yes' | 'no', maintenanceCategory: '', maintenanceDescription: '',
  // Declaration
  declarationAccepted: false,
};
type FormState = typeof EMPTY_FORM;

// Direct-to-Cloudinary upload (bypasses Vercel's ~4.5MB request-body limit).
async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: CLOUDINARY_FOLDERS.rentReview }),
  });
  if (!sigRes.ok) throw new Error('Could not prepare upload');
  const { cloudName, apiKey, timestamp, folder, signature } = await sigRes.json();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('folder', folder);
  fd.append('signature', signature);
  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
  const data = await upRes.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url as string;
}

const money = (v: string) => {
  const n = (v || '').toString().replace(/[^\d.]/g, '');
  return n ? `£${Number(n).toLocaleString('en-GB')}` : '';
};
const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function RentReviewApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [propertyList, setPropertyList] = useState<RentReviewProperty[]>([]);
  const [propSearch, setPropSearch] = useState('');
  const [bankStatements, setBankStatements] = useState<Upload>(emptyUpload);
  const [payslips, setPayslips] = useState<Upload>(emptyUpload);
  const [photoId, setPhotoId] = useState<Upload>(emptyUpload);
  const [maintenancePhotos, setMaintenancePhotos] = useState<Upload>(emptyUpload);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [restored, setRestored] = useState(false);

  // Load the managed property catalogue.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/rent-review-properties')
      .then(r => r.json())
      .then(d => { if (!cancelled) setPropertyList(Array.isArray(d.properties) ? d.properties : []); })
      .catch(() => { if (!cancelled) setPropertyList([]); });
    return () => { cancelled = true; };
  }, []);

  // Prefill from the personalised link + restore any saved draft.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let base = { ...EMPTY_FORM };
    const map: Record<string, keyof FormState> = { address: 'propertyAddress', postcode: 'postcode', currentRent: 'currentRent', proposedRent: 'proposedRent', effectiveDate: 'effectiveDate', name: 'fullName', email: 'email', phone: 'phone' };
    for (const [q, key] of Object.entries(map)) {
      const v = params.get(q);
      if (v) (base as any)[key] = v;
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.form) base = { ...base, ...saved.form };
        const u = saved.uploads || {};
        if (u.bankStatements) setBankStatements({ ...emptyUpload(), ...u.bankStatements, uploading: false });
        if (u.payslips) setPayslips({ ...emptyUpload(), ...u.payslips, uploading: false });
        if (u.photoId) setPhotoId({ ...emptyUpload(), ...u.photoId, uploading: false });
        if (u.maintenancePhotos) setMaintenancePhotos({ ...emptyUpload(), ...u.maintenancePhotos, uploading: false });
        if (typeof saved.step === 'number') setStep(Math.min(Math.max(saved.step, 0), STEPS.length - 1));
      }
    } catch { /* ignore a corrupt draft */ }
    setForm(base);
    setRestored(true);
  }, []);

  // Persist the draft (save-progress).
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        form, step,
        uploads: {
          bankStatements: { urls: bankStatements.urls, names: bankStatements.names },
          payslips: { urls: payslips.urls, names: payslips.names },
          photoId: { urls: photoId.urls, names: photoId.names },
          maintenancePhotos: { urls: maintenancePhotos.urls, names: maintenancePhotos.names },
        },
      }));
    } catch { /* storage full/blocked */ }
  }, [form, step, bankStatements, payslips, photoId, maintenancePhotos, restored]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));
  const setVal = (key: keyof FormState, value: any) => setForm(f => ({ ...f, [key]: value }));

  const selectProperty = (p: RentReviewProperty) => {
    setForm(f => ({
      ...f,
      propertyId: p.id || '',
      propertyAddress: p.address,
      postcode: p.postcode || f.postcode,
      // Only adopt the property's rent figures when the link didn't already set them.
      currentRent: f.currentRent || p.currentRent || '',
      proposedRent: f.proposedRent || p.proposedRent || '',
      effectiveDate: f.effectiveDate || p.effectiveDate || '',
    }));
    setErrors(e => ({ ...e, propertyAddress: '' }));
  };

  // Search-driven: matches appear the moment the tenant starts typing, rather
  // than dumping the whole catalogue up front.
  const filteredProps = useMemo(() => {
    const q = propSearch.trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return [];
    return propertyList.filter(p => `${p.address} ${p.postcode}`.toLowerCase().replace(/\s+/g, '').includes(q)).slice(0, 60);
  }, [propertyList, propSearch]);

  const anyUploading = [bankStatements, payslips, photoId, maintenancePhotos].some(u => u.uploading);
  const resetView = () => { if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); };

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.propertyAddress.trim()) e.propertyAddress = 'Please select your property';
      if (!form.fullName.trim()) e.fullName = 'Full name is required';
      if (!form.email.trim()) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
      if (!form.phone.trim()) e.phone = 'Phone number is required';
    } else if (s === 1) {
      if (!form.adultOccupants.trim()) e.adultOccupants = 'Please confirm the number of adults';
      if (form.childOccupants.trim() && Number(form.childOccupants) > 0 && !form.childrenAges.trim()) e.childrenAges = 'Please provide each child’s age';
      if (!form.pets) e.pets = 'Please answer this question';
      if (form.pets === 'yes' && !form.petDetails.trim()) e.petDetails = 'Please specify the type and breed';
      if (!form.annualIncome.trim()) e.annualIncome = 'Please confirm your annual income';
      if (!form.hasCCJ) e.hasCCJ = 'Please answer the CCJ question';
      if (form.hasCCJ === 'yes' && !form.ccjDetails.trim()) e.ccjDetails = 'Please provide brief details';
    } else if (s === 2) {
      if (photoId.urls.length === 0) e.photoId = 'Please upload your photo ID (front and back)';
      if (payslips.urls.length === 0) e.payslips = 'Please upload your last 3 months of payslips';
      if (bankStatements.urls.length === 0) e.bankStatements = 'Please upload your last 3 months of bank statements';
    } else if (s === 3) {
      if (!form.rentDecision) e.rentDecision = 'Please confirm whether you accept the revised rent';
      if (form.rentDecision === 'discuss') {
        if (!form.tenantProposedRent.trim()) e.tenantProposedRent = 'Please enter the rent you would propose';
        if (!form.rentDiscussReason.trim()) e.rentDiscussReason = 'Please tell us why';
      }
      if (!form.hasMaintenance) e.hasMaintenance = 'Please answer the maintenance question';
      if (form.hasMaintenance === 'yes') {
        if (!form.maintenanceCategory) e.maintenanceCategory = 'Please choose a category';
        if (!form.maintenanceDescription.trim()) e.maintenanceDescription = 'Please describe the issue';
      }
    } else if (s === 4) {
      if (!form.declarationAccepted) e.declaration = 'Please confirm the declaration to submit';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => { if (validateStep(step)) { setStep(s => Math.min(STEPS.length - 1, s + 1)); resetView(); } };
  const back = () => { setErrors({}); setStep(s => Math.max(0, s - 1)); resetView(); };

  async function handleSubmit() {
    if (!validateStep(4)) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const payload = {
        ...form,
        photoIdUrls: photoId.urls,
        payslipUrls: payslips.urls,
        bankStatementUrls: bankStatements.urls,
        maintenancePhotoUrls: form.hasMaintenance === 'yes' ? maintenancePhotos.urls : [],
      };
      const res = await fetch('/api/rent-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setStatus('success');
      resetView();
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  }

  const firstName = (form.fullName || 'there').split(' ')[0];

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />

      <div className="hol-page-bg" style={{ minHeight: '100vh', fontFamily: "'Poppins', sans-serif", paddingTop: 'calc(68px + clamp(28px, 5vw, 52px))', paddingBottom: 'clamp(48px, 8vw, 80px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px, 4%, 4%)' }}>

          {status === 'success' ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5%, 5%)', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1a3c5e,#2563a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(37,99,168,.35)', animation: 'hol-pop .5s cubic-bezier(.34,1.56,.64,1)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>Rent Review Submitted!</h2>
              <p style={{ fontSize: 15, color: '#374151', maxWidth: 460, margin: '0 auto 8px', lineHeight: 1.6 }}>
                Thank you, {firstName}. Your Rent Review has been submitted successfully. Our team will review your information and contact you if any further details are required.
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>A confirmation has been sent to {form.email || 'your email'}.</p>
              <Link href="/" className="hol-submit" style={{ margin: '0 auto' }}>Back to Home</Link>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

              <div style={{ padding: 'clamp(22px, 4vw, 30px) clamp(22px, 4vw, 32px) 0' }}>
                <Link href="/rent-review" className="hol-back-link">← Back to overview</Link>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', margin: '10px 0 4px' }}>Rent Review Process</h1>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
                <div className="hol-steps">
                  {STEPS.map((label, i) => (
                    <div key={label} className="hol-step-item">
                      <div className={`hol-step-dot${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}>
                        {i < step ? (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>) : (i + 1)}
                      </div>
                      <span className={`hol-step-label${i === step ? ' active' : ''}`}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="hol-progress"><div className="hol-progress-bar" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} /></div>
              </div>

              <div style={{ padding: 'clamp(22px, 4vw, 30px) clamp(22px, 4vw, 32px) clamp(24px, 4vw, 32px)' }}>

                {/* ── Step 0 · Property ─────────────────────────────── */}
                {step === 0 && (
                  <>
                    <StepIntro title="Select your property" subtitle="Please select the property for which you are submitting a rent review. Search by postcode or address." />
                    {form.propertyAddress ? (
                      <div className="hol-occupied" style={{ marginBottom: 8 }}>
                        <div className="hol-occupied-head">Selected Property</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>{form.propertyAddress}</div>
                        {(form.currentRent || form.proposedRent) && (
                          <div style={{ fontSize: 13, color: '#4b5563', marginTop: 6 }}>
                            {form.currentRent ? <>Current rent <strong>{money(form.currentRent)}</strong></> : null}
                            {form.currentRent && form.proposedRent ? ' · ' : ''}
                            {form.proposedRent ? <>Proposed <strong>{money(form.proposedRent)}</strong></> : null}
                          </div>
                        )}
                        <button type="button" className="rr-change" onClick={() => { setVal('propertyAddress', ''); setVal('propertyId', ''); }}>Change property</button>
                      </div>
                    ) : (
                      <>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Search properties<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.propertyAddress ? ' hol-input--error' : ''}`} placeholder="Type a postcode or street name…" value={propSearch} onChange={e => setPropSearch(e.target.value)} autoComplete="off" />
                          {errors.propertyAddress && <p className="hol-err">{errors.propertyAddress}</p>}
                        </div>
                        {propSearch.trim() && (
                          <div className="rr-picker">
                            {propertyList.length === 0 ? (
                              <div className="rr-picker-empty">Loading properties…</div>
                            ) : filteredProps.length === 0 ? (
                              <div className="rr-picker-empty">No match. Try a different postcode, or contact us if your property isn’t listed.</div>
                            ) : (
                              filteredProps.map((p, i) => (
                                <button type="button" key={p.id || p.address + i} className="rr-picker-item" onClick={() => selectProperty(p)}>
                                  <span className="rr-picker-addr">{p.address}</span>
                                  {p.postcode && <span className="rr-picker-pc">{p.postcode}</span>}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                        {!propSearch.trim() && (
                          <p style={{ fontSize: 12.5, color: '#9ca3af', margin: '10px 0 0' }}>Start typing your postcode or address to find your property.</p>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* ── Step 1 · Details ──────────────────────────────── */}
                {step === 0 && (
                  <>
                    <StepIntro title="Your details" subtitle="Please confirm or update your contact details." />
                    <div className="hol-form-grid">
                      <div className="hol-field hol-field--full">
                        <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                        <input type="text" className={`hol-input${errors.fullName ? ' hol-input--error' : ''}`} value={form.fullName} onChange={set('fullName')} autoComplete="name" />
                        {errors.fullName && <p className="hol-err">{errors.fullName}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">Email Address<span className="hol-req">*</span></label>
                        <input type="email" className={`hol-input${errors.email ? ' hol-input--error' : ''}`} value={form.email} onChange={set('email')} autoComplete="email" />
                        {errors.email && <p className="hol-err">{errors.email}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">Phone Number<span className="hol-req">*</span></label>
                        <input type="tel" className={`hol-input${errors.phone ? ' hol-input--error' : ''}`} value={form.phone} onChange={set('phone')} autoComplete="tel" />
                        {errors.phone && <p className="hol-err">{errors.phone}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 2 · Household ────────────────────────────── */}
                {step === 1 && (
                  <>
                    <StepIntro title="Your household" subtitle="Tell us who currently lives at the property, and confirm your income." />
                    <div className="hol-form-grid">
                      <div className="hol-field">
                        <label className="hol-label">Number of Adult Occupants<span className="hol-req">*</span></label>
                        <input type="number" min="1" className={`hol-input${errors.adultOccupants ? ' hol-input--error' : ''}`} placeholder="e.g. 2" value={form.adultOccupants} onChange={set('adultOccupants')} />
                        {errors.adultOccupants && <p className="hol-err">{errors.adultOccupants}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">Number of Child Occupants</label>
                        <input type="number" min="0" className="hol-input" placeholder="e.g. 1" value={form.childOccupants} onChange={set('childOccupants')} />
                      </div>
                      {Number(form.childOccupants) > 0 && (
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Children’s Ages<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.childrenAges ? ' hol-input--error' : ''}`} placeholder="e.g. 4, 7 and 11" value={form.childrenAges} onChange={set('childrenAges')} />
                          {errors.childrenAges && <p className="hol-err">{errors.childrenAges}</p>}
                        </div>
                      )}
                      <div className="hol-field hol-field--full">
                        <label className="hol-label">Annual Income<span className="hol-req">*</span></label>
                        <input type="text" inputMode="numeric" className={`hol-input${errors.annualIncome ? ' hol-input--error' : ''}`} placeholder="e.g. 32000 (salary or total household income)" value={form.annualIncome} onChange={set('annualIncome')} />
                        {errors.annualIncome && <p className="hol-err">{errors.annualIncome}</p>}
                      </div>
                    </div>
                    <YesNo label="Do you keep any pets at the property?" value={form.pets} onChange={(v) => setVal('pets', v)} error={errors.pets}
                      detail={form.pets === 'yes' ? { label: 'Please specify the type and breed of each pet', value: form.petDetails, onChange: (v) => setVal('petDetails', v), error: errors.petDetails } : undefined} />
                  </>
                )}

                {/* ── Step 3 · Financial ────────────────────────────── */}
                {step === 1 && (
                  <>
                    <StepIntro title="Financial status" subtitle="Please answer honestly, this forms part of your renewal and referencing." />
                    <YesNo label="Do you currently have any County Court Judgments (CCJs) or any significant financial issues?" value={form.hasCCJ} onChange={(v) => setVal('hasCCJ', v)} error={errors.hasCCJ}
                      detail={form.hasCCJ === 'yes' ? { label: 'Please provide brief details', value: form.ccjDetails, onChange: (v) => setVal('ccjDetails', v), error: errors.ccjDetails } : undefined} />
                    <div className="hol-field hol-field--full" style={{ marginTop: 18 }}>
                      <label className="hol-label">Right to Rent Share Code <span style={{ color: '#9ca3af', fontWeight: 400 }}>(if applicable)</span></label>
                      <input type="text" className="hol-input" placeholder="e.g. ABC-123-XYZ" value={form.shareCode} onChange={set('shareCode')} autoComplete="off" />
                    </div>
                  </>
                )}

                {/* ── Step 4 · Documents ────────────────────────────── */}
                {step === 2 && (
                  <>
                    <StepIntro title="Upload your documents" subtitle="Each working adult on the tenancy should provide these. You can add several files to each." />
                    <UploadField label="Proof of Identification (front & back)" hint="A clear copy of your valid photo ID, passport or driving licence. Add up to 4." accept=".pdf,.jpg,.jpeg,.png,.webp" max={4} state={photoId} setState={setPhotoId} error={errors.photoId} />
                    <UploadField label="Recent Payslips (last 3 months)" hint="Your last 3 months of payslips to verify your current income. Add up to 6." accept=".pdf,.jpg,.jpeg,.png,.webp" max={6} state={payslips} setState={setPayslips} error={errors.payslips} />
                    <UploadField label="Recent Bank Statements (last 3 months)" hint="Your 3 most recent months of bank statements. Add up to 6." accept=".pdf,.jpg,.jpeg,.png,.webp" max={6} state={bankStatements} setState={setBankStatements} error={errors.bankStatements} />
                  </>
                )}

                {/* ── Step 5 · Revised Rent ─────────────────────────── */}
                {step === 3 && (
                  <>
                    <StepIntro title="Confirmation of revised rent" subtitle="Please review and confirm the proposed rent for your renewal." />
                    <div className="hol-terms-note" style={{ marginTop: 0, marginBottom: 18 }}>
                      {form.proposedRent ? (
                        <>Please confirm that you accept the proposed new monthly rent of <strong>{money(form.proposedRent)}</strong>{form.currentRent ? <> (your current rent is {money(form.currentRent)})</> : null}
                        {form.effectiveDate ? <>, payable from <strong>{fmtDate(form.effectiveDate)}</strong></> : null}.</>
                      ) : (
                        <>Your property manager will confirm the proposed monthly rent{form.effectiveDate ? <> and it will be payable from <strong>{fmtDate(form.effectiveDate)}</strong></> : null}. Please confirm your decision below.</>
                      )}
                    </div>
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">Do you accept the proposed rent?<span className="hol-req">*</span></label>
                      <div className="hol-yesno">
                        <button type="button" className={`hol-yesno-btn${form.rentDecision === 'accept' ? ' on' : ''}`} onClick={() => setVal('rentDecision', 'accept')}>Yes, I accept the proposed rent</button>
                        <button type="button" className={`hol-yesno-btn${form.rentDecision === 'discuss' ? ' on' : ''}`} onClick={() => setVal('rentDecision', 'discuss')}>No, I’d like to discuss the rent</button>
                      </div>
                      {errors.rentDecision && <p className="hol-err">{errors.rentDecision}</p>}
                    </div>
                    {form.rentDecision === 'accept' && form.effectiveDate && (
                      <div className="hol-summary" style={{ marginTop: 16 }}>
                        <SummaryRow label="Effective date of new rent" value={fmtDate(form.effectiveDate)} />
                      </div>
                    )}
                    {form.rentDecision === 'discuss' && (
                      <div className="hol-form-grid" style={{ marginTop: 16 }}>
                        <div className="hol-field">
                          <label className="hol-label">Rent you would propose (pcm)<span className="hol-req">*</span></label>
                          <input type="text" inputMode="numeric" className={`hol-input${errors.tenantProposedRent ? ' hol-input--error' : ''}`} placeholder="e.g. 960" value={form.tenantProposedRent} onChange={set('tenantProposedRent')} />
                          {errors.tenantProposedRent && <p className="hol-err">{errors.tenantProposedRent}</p>}
                        </div>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Reason for requesting a different rent<span className="hol-req">*</span></label>
                          <textarea className={`hol-input hol-textarea${errors.rentDiscussReason ? ' hol-input--error' : ''}`} placeholder="Tell us a little about why…" value={form.rentDiscussReason} onChange={set('rentDiscussReason')} />
                          {errors.rentDiscussReason && <p className="hol-err">{errors.rentDiscussReason}</p>}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Step 6 · Maintenance ──────────────────────────── */}
                {step === 3 && (
                  <>
                    <StepIntro title="Report maintenance issues" subtitle="Please let us know if there are any maintenance issues or repairs that require our attention." />
                    <YesNo label="Do you have any maintenance issues to report?" value={form.hasMaintenance} onChange={(v) => setVal('hasMaintenance', v)} error={errors.hasMaintenance} />
                    {form.hasMaintenance === 'yes' && (
                      <div style={{ marginTop: 16 }}>
                        <div className="hol-form-grid">
                          <div className="hol-field hol-field--full">
                            <label className="hol-label">Issue Category<span className="hol-req">*</span></label>
                            <select className={`hol-input hol-select${errors.maintenanceCategory ? ' hol-input--error' : ''}`} value={form.maintenanceCategory} onChange={set('maintenanceCategory')}>
                              <option value="">Select…</option>
                              {MAINTENANCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            {errors.maintenanceCategory && <p className="hol-err">{errors.maintenanceCategory}</p>}
                          </div>
                          <div className="hol-field hol-field--full">
                            <label className="hol-label">Description of the issue<span className="hol-req">*</span></label>
                            <textarea className={`hol-input hol-textarea${errors.maintenanceDescription ? ' hol-input--error' : ''}`} placeholder="Tell us what's happening, and since when…" value={form.maintenanceDescription} onChange={set('maintenanceDescription')} />
                            {errors.maintenanceDescription && <p className="hol-err">{errors.maintenanceDescription}</p>}
                          </div>
                        </div>
                        <UploadField label="Upload Photos" hint="Photos help us diagnose the issue. Add up to 8." accept=".jpg,.jpeg,.png,.webp,.heic" max={8} state={maintenancePhotos} setState={setMaintenancePhotos} />
                      </div>
                    )}
                  </>
                )}

                {/* ── Step 7 · Confirm ──────────────────────────────── */}
                {step === 4 && (
                  <>
                    <StepIntro title="Review & confirm" subtitle="A quick summary before you submit." />
                    <div className="hol-summary" style={{ marginBottom: 8 }}>
                      <SummaryRow label="Property" value={form.propertyAddress} />
                      <SummaryRow label="Occupants" value={`${form.adultOccupants || '0'} adult(s)${Number(form.childOccupants) > 0 ? `, ${form.childOccupants} child(ren)` : ''}`} />
                      <SummaryRow label="Pets" value={form.pets === 'yes' ? (form.petDetails || 'Yes') : 'None'} />
                      <SummaryRow label="Rent decision" value={form.rentDecision === 'accept' ? `Accepts${form.proposedRent ? ` ${money(form.proposedRent)}` : ''}` : form.rentDecision === 'discuss' ? 'Would like to discuss' : '-'} />
                      {form.effectiveDate ? <SummaryRow label="Effective from" value={fmtDate(form.effectiveDate)} /> : null}
                      <SummaryRow label="Documents attached" value={String(photoId.urls.length + payslips.urls.length + bankStatements.urls.length)} />
                      <SummaryRow label="Maintenance issue" value={form.hasMaintenance === 'yes' ? (form.maintenanceCategory || 'Yes') : 'None reported'} />
                    </div>
                    <label className={`hol-terms-accept${errors.declaration ? ' hol-terms-accept--error' : ''}`}>
                      <input type="checkbox" checked={form.declarationAccepted} onChange={(e) => setVal('declarationAccepted', e.target.checked)} />
                      <span className="hol-checkbox" aria-hidden>{form.declarationAccepted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}</span>
                      <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>
                        I confirm that the information provided is accurate and complete. I understand that this information will be used as part of my tenancy renewal and rent review.
                      </span>
                    </label>
                    {errors.declaration && <p className="hol-err" style={{ marginTop: 8 }}>{errors.declaration}</p>}
                    {status === 'error' && (
                      <div className="hol-err-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {errorMsg}
                      </div>
                    )}
                  </>
                )}

                {/* Nav buttons */}
                <div className="hol-wizard-nav">
                  <button type="button" className="hol-btn-ghost" onClick={back} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>← Back</button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" className="hol-submit" onClick={next} disabled={anyUploading}>
                      Continue
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                  ) : (
                    <button type="button" className="hol-submit" onClick={handleSubmit} disabled={status === 'loading' || anyUploading}>
                      {status === 'loading' ? (
                        <><svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Submitting…</>
                      ) : (
                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Submit Rent Review</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function StepIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="hol-summary-row">
      <span className="hol-summary-label">{label}</span>
      <span className="hol-summary-value">{value || '-'}</span>
    </div>
  );
}

type Detail = { label: string; value: string; onChange: (v: string) => void; error?: string };
function YesNo({ label, value, onChange, error, detail }: {
  label: string;
  value: '' | 'yes' | 'no';
  onChange: (v: 'yes' | 'no') => void;
  error?: string;
  detail?: Detail;
}) {
  return (
    <div className="hol-field hol-field--full" style={{ marginTop: 18 }}>
      <label className="hol-label">{label}</label>
      <div className="hol-yesno">
        <button type="button" className={`hol-yesno-btn${value === 'yes' ? ' on' : ''}`} onClick={() => onChange('yes')}>Yes</button>
        <button type="button" className={`hol-yesno-btn${value === 'no' ? ' on' : ''}`} onClick={() => onChange('no')}>No</button>
      </div>
      {error && <p className="hol-err">{error}</p>}
      {detail && (
        <div style={{ marginTop: 10 }}>
          <label className="hol-label" style={{ marginBottom: 6, display: 'block' }}>{detail.label}<span className="hol-req">*</span></label>
          <textarea className={`hol-input hol-textarea${detail.error ? ' hol-input--error' : ''}`} value={detail.value} onChange={(e) => detail.onChange(e.target.value)} />
          {detail.error && <p className="hol-err">{detail.error}</p>}
        </div>
      )}
    </div>
  );
}

function UploadField({ label, hint, accept, max, state, setState, error }: {
  label: string;
  hint: string;
  accept: string;
  max: number;
  state: Upload;
  setState: React.Dispatch<React.SetStateAction<Upload>>;
  error?: string;
}) {
  const full = state.urls.length >= max;
  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files).slice(0, Math.max(0, max - state.urls.length));
    if (picked.length === 0) return;
    setState(s => ({ ...s, uploading: true, error: '' }));
    const addedUrls: string[] = [];
    const addedNames: string[] = [];
    try {
      for (const file of picked) {
        addedUrls.push(await uploadToCloudinary(file));
        addedNames.push(file.name);
      }
      setState(s => ({ ...s, uploading: false, urls: [...s.urls, ...addedUrls], names: [...s.names, ...addedNames] }));
    } catch (e: any) {
      setState(s => ({ ...s, uploading: false, urls: [...s.urls, ...addedUrls], names: [...s.names, ...addedNames], error: e.message || 'Upload failed' }));
    }
  };
  return (
    <div className="hol-field hol-field--full" style={{ marginTop: 16 }}>
      <label className="hol-label">{label}<span className="hol-req">*</span></label>
      {state.urls.map((url, i) => (
        <div key={i} className="hol-uploaded" style={{ marginBottom: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.names[i] || 'Uploaded'}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="hol-view-link">View</a>
          <button type="button" onClick={() => setState(s => ({ ...s, urls: s.urls.filter((_, j) => j !== i), names: s.names.filter((_, j) => j !== i) }))} className="hol-remove">Remove</button>
        </div>
      ))}
      {!full && (
        <label className={`hol-upload${state.uploading ? ' is-loading' : ''}`}>
          <input type="file" multiple accept={accept} onChange={(e) => { handle(e.target.files); e.currentTarget.value = ''; }} disabled={state.uploading} />
          {state.uploading ? (
            <><svg className="hol-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Uploading…</>
          ) : (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg> {state.urls.length > 0 ? `Add another (up to ${max})` : 'Upload files'}</>
          )}
        </label>
      )}
      {(state.error || error) && <p className="hol-err">{state.error || error}</p>}
      <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{hint}</p>
    </div>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  @keyframes hol-bg-shift { 0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;} }
  .hol-page-bg { background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 25%, #e8f0fe 50%, #f7f8fa 75%, #eef2ff 100%); background-size: 400% 400%; animation: hol-bg-shift 12s ease infinite; }

  .hol-back-link { font-size:12px; color:#6b7280; text-decoration:none; font-weight:600; }
  .hol-back-link:hover { color:var(--logo-blue); }

  .hol-steps { display:flex; justify-content:space-between; gap:4px; margin:20px 0 10px; }
  .hol-step-item { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; text-align:center; }
  .hol-step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; background:#eef0f5; color:#9ca3af; transition:all .2s; }
  .hol-step-dot.active { background:#2563a8; color:#fff; box-shadow:0 0 0 4px rgba(37,99,168,.14); }
  .hol-step-dot.done { background:#1a3c5e; color:#fff; }
  .hol-step-label { font-size:10.5px; font-weight:600; color:#9ca3af; letter-spacing:.02em; }
  .hol-step-label.active { color:var(--logo-blue); }
  @media(max-width:720px){ .hol-step-label{display:none;} }

  .hol-progress { height:4px; background:#eef0f5; border-radius:4px; overflow:hidden; margin-top:8px; }
  .hol-progress-bar { height:100%; background:linear-gradient(90deg,#1a3c5e,#2563a8); border-radius:4px; transition:width .3s ease; }

  .hol-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .hol-field{display:flex;flex-direction:column;gap:6px;}
  .hol-field--full{grid-column:1/-1;}
  .hol-label{font-size:13px;font-weight:600;color:#374151;font-family:'Poppins',sans-serif;}
  .hol-req{color:#e53e3e;margin-left:2px;}
  .hol-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'Poppins',sans-serif;font-size:14px;color:#111827;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;}
  .hol-input:focus{border-color:#2563a8;box-shadow:0 0 0 3px rgba(37,99,168,.12);}
  .hol-input--error{border-color:#e53e3e!important;}
  .hol-select{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px;}
  .hol-textarea{resize:vertical;min-height:80px;}
  .hol-err{font-size:12px;color:#e53e3e;margin:0;font-family:'Poppins',sans-serif;}
  .hol-err-banner{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;font-size:13px;color:#dc2626;margin:20px 0 0;font-family:'Poppins',sans-serif;}

  .hol-occupied{border:1px solid #dbe6fb;background:#f5f9ff;border-radius:12px;padding:16px 18px;}
  .hol-occupied-head{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--logo-blue);margin-bottom:12px;}
  .rr-change{background:none;border:none;color:var(--logo-blue);font-size:12.5px;font-weight:700;cursor:pointer;padding:0;margin-top:12px;font-family:'Poppins',sans-serif;}
  .rr-change:hover{text-decoration:underline;}

  .rr-picker{margin-top:12px;border:1px solid #e5e7eb;border-radius:12px;max-height:320px;overflow-y:auto;background:#fff;}
  .rr-picker-item{width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;background:none;border:none;border-bottom:1px solid #f1f3f7;cursor:pointer;font-family:'Poppins',sans-serif;transition:background .12s;}
  .rr-picker-item:last-child{border-bottom:none;}
  .rr-picker-item:hover{background:#f5f9ff;}
  .rr-picker-addr{font-size:13.5px;color:#0f1f3d;font-weight:500;}
  .rr-picker-pc{flex:none;font-size:11px;font-weight:700;color:var(--logo-blue);background:#eef4ff;padding:3px 9px;border-radius:20px;}
  .rr-picker-empty{padding:24px 16px;text-align:center;color:#9ca3af;font-size:13px;}

  .hol-terms-note{margin:22px 0 0;padding:14px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafbff;font-size:13px;color:#4b5563;line-height:1.65;}

  .hol-yesno{display:flex;gap:10px;flex-wrap:wrap;}
  .hol-yesno-btn{flex:1;min-width:150px;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:9px;background:#fff;color:#374151;font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .hol-yesno-btn:hover{border-color:#bcd0ee;}
  .hol-yesno-btn.on{border-color:#2563a8;background:#2563a8;color:#fff;}

  .hol-upload{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border:1.5px dashed #cbd5e1;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;color:var(--logo-blue);background:#f8fafc;transition:all .15s;}
  .hol-upload:hover{border-color:#2563a8;background:#f0f6ff;}
  .hol-upload.is-loading{cursor:wait;color:#6b7280;}
  .hol-upload input{position:absolute;opacity:0;width:0;height:0;}
  .hol-uploaded{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:9px;font-size:13px;color:#166534;font-weight:600;}
  .hol-view-link{color:var(--logo-blue);font-size:12px;font-weight:600;text-decoration:none;}
  .hol-remove{background:none;border:none;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;padding:0;}

  .hol-summary{border:1px solid #eef0f5;border-radius:12px;overflow:hidden;}
  .hol-summary-row{display:flex;justify-content:space-between;gap:16px;padding:11px 16px;font-size:13.5px;border-bottom:1px solid #f1f3f7;}
  .hol-summary-row:last-child{border-bottom:none;}
  .hol-summary-label{color:#6b7280;font-weight:500;flex-shrink:0;}
  .hol-summary-value{color:#111827;font-weight:600;text-align:right;}

  .hol-terms-accept{display:flex;align-items:flex-start;gap:12px;margin-top:22px;padding:16px 18px;border:1.5px solid #e5e7eb;border-radius:12px;cursor:pointer;background:#fafbff;transition:border-color .15s;}
  .hol-terms-accept:has(input:checked){border-color:#2563a8;background:#f5f9ff;}
  .hol-terms-accept--error{border-color:#f7b6b6;}
  .hol-terms-accept input{position:absolute;opacity:0;width:0;height:0;}
  .hol-checkbox{flex-shrink:0;width:20px;height:20px;border-radius:6px;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;color:#fff;background:#fff;transition:all .15s;margin-top:1px;}
  .hol-terms-accept:has(input:checked) .hol-checkbox{background:#2563a8;border-color:#2563a8;}

  .hol-wizard-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:28px;padding-top:22px;border-top:1px solid #f1f3f7;}
  .hol-btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:9px;box-sizing:border-box;min-height:48px;line-height:1.2;background:none;border:1.5px solid #e5e7eb;border-radius:9px;padding:14px 28px;font-family:'Poppins',sans-serif;font-size:13.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:#374151;cursor:pointer;transition:all .15s;}
  .hol-btn-ghost:hover:not(:disabled){border-color:#cbd5e1;background:#f9fafb;}
  .hol-submit{display:inline-flex;align-items:center;justify-content:center;gap:9px;box-sizing:border-box;min-height:48px;line-height:1.2;background:linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%);color:#fff;border:1.5px solid transparent;border-radius:9px;font-family:'Poppins',sans-serif;font-size:13.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:14px 28px;cursor:pointer;transition:opacity .15s,transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(37,99,168,.35);white-space:nowrap;margin-left:auto;}
  .hol-submit:hover:not(:disabled){opacity:.92;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,168,.45);}
  .hol-submit:disabled{opacity:.7;cursor:not-allowed;}
  .hol-spinner{animation:hol-spin .8s linear infinite;}
  @keyframes hol-spin{to{transform:rotate(360deg);}}
  @keyframes hol-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}

  @media(max-width:600px){
    .hol-form-grid{grid-template-columns:1fr;gap:14px;}
    .hol-input{font-size:16px;}
    /* Long-labelled choices (accept / discuss the rent) stack full-width so the
       text never crams into a half-width button. */
    .hol-yesno-btn{min-width:0;flex:1 1 100%;}
    .rr-picker{max-height:280px;}
    .rr-picker-item{gap:8px;}
    .rr-picker-addr{font-size:13px;}
    /* Back / Continue stay side by side but each takes its share of the row. */
    .hol-wizard-nav .hol-btn-ghost,.hol-wizard-nav .hol-submit{padding:14px 18px;}
  }
  /* Tighten the stepper on small phones now there are 5 steps, not 8. */
  @media(max-width:420px){
    .hol-step-dot{width:24px;height:24px;font-size:11px;}
  }
`;
