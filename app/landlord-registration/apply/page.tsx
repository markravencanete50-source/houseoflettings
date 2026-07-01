'use client';
// app/landlord-registration/apply/page.tsx
// Step-by-step landlord registration wizard.
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import { BUNDLES } from '@/lib/bundles';

const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The compliance documents we ask about. Each has a set of answer options;
// the gas certificate has an extra "no gas supply" option.
const YES = { value: 'yes', label: 'Yes, I have it' };
const NO = { value: 'no', label: 'No / arrange it for me' };
const DOCS = [
  { key: 'epc', label: 'Energy Performance Certificate (EPC)', hint: 'Must be rated E or above to let legally.', options: [YES, NO] },
  { key: 'electrical', label: 'Electrical Safety Certificate (EICR)', hint: 'Electrical Installation Condition Report — renewed every 5 years.', options: [YES, NO] },
  { key: 'gas', label: 'Gas Safety Certificate (CP12)', hint: 'Annual Gas Safety Record for properties with gas appliances.', options: [YES, NO, { value: 'nogas', label: 'No gas supply at this property' }] },
  { key: 'landReg', label: 'Land Registry Title', hint: 'Proof of ownership / title documents.', options: [YES, NO] },
] as const;
const DOC_KEYS = DOCS.map(d => d.key);

type DocState = { has: string; url: string; uploading: boolean; fileName: string; error: string };
const EMPTY_DOC: DocState = { has: '', url: '', uploading: false, fileName: '', error: '' };
const initDocs = (): Record<string, DocState> => Object.fromEntries(DOC_KEYS.map(k => [k, { ...EMPTY_DOC }]));

const PROPERTY_TYPES = ['Detached house', 'Semi-detached house', 'Terraced house', 'Flat / Apartment', 'Bungalow', 'Maisonette', 'Studio', 'HMO / House share', 'Other'];
const FURNISHING = ['Furnished', 'Unfurnished', 'Part-furnished'];
const PARKING = ['None', 'On-street', 'Driveway', 'Garage', 'Allocated space', 'Other'];
const CONDITIONS = ['Newly built / refurbished', 'Excellent', 'Good', 'Fair', 'Needs some work', 'Needs full refurbishment'];
const OCCUPANCY = ['Vacant', 'Occupied'];

type Property = {
  id: string; postcode: string; street: string; city: string; county: string;
  propertyType: string; receptions: string; bedrooms: string; bathrooms: string;
  furnishing: string; parking: string; flatNumber: string; availableFrom: string; securityNote: string;
  condition: string; occupancy: string; currentRent: string; tenancyStart: string; tenancyEnd: string;
};
const newProperty = (id: string): Property => ({
  id, postcode: '', street: '', city: '', county: '',
  propertyType: '', receptions: '', bedrooms: '', bathrooms: '',
  furnishing: '', parking: '', flatNumber: '', availableFrom: '', securityNote: '',
  condition: '', occupancy: '', currentRent: '', tenancyStart: '', tenancyEnd: '',
});
const formatAddress = (p: Property) => [p.street, p.city, p.county, p.postcode].filter(Boolean).join(', ');
const propertyDetails = (p: Property) => [
  p.propertyType,
  p.bedrooms && `${p.bedrooms} bed`,
  p.bathrooms && `${p.bathrooms} bath`,
  p.receptions && `${p.receptions} recep`,
  p.furnishing,
  p.parking && p.parking !== 'None' && `Parking: ${p.parking}`,
  p.condition && `Condition: ${p.condition}`,
  p.occupancy,
  p.occupancy === 'Occupied' && p.currentRent && `Rent £${p.currentRent}/mo`,
  p.occupancy === 'Occupied' && p.tenancyStart && `Tenancy ${p.tenancyStart}${p.tenancyEnd ? ` – ${p.tenancyEnd}` : ''}`,
  p.availableFrom && `Available ${p.availableFrom}`,
].filter(Boolean).join(' · ');

// Human-readable status for a document answer in the confirm summary.
const docSummary = (st: DocState) => {
  if (!st || !st.has) return '—';
  if (st.has === 'yes') return st.url ? 'Yes — uploaded' : 'Yes';
  if (st.has === 'nogas') return 'No gas supply';
  return 'To arrange';
};

const STEPS = ['Landlord Details', 'Property Details', 'Service', 'Documents', 'Confirm'];

// Direct-to-Cloudinary upload (bypasses Vercel's ~4.5MB request-body limit).
async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'houseoflettings/landlord-docs' }),
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

const EMPTY_FORM = {
  fullName: '', email: '', phone: '', propertyCount: '', contactAddress: '',
  selectedPackage: '', notes: '',
};

export default function LandlordRegistrationApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [properties, setProperties] = useState<Property[]>([newProperty('p0')]);
  const nextPropId = useRef(1);
  const [docs, setDocs] = useState<Record<string, DocState>>(initDocs);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(er => ({ ...er, [key]: '' }));
  };

  // Update one property by id, clearing any errors for the fields we touched.
  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    setProperties(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
    setErrors(e => {
      const next = { ...e };
      Object.keys(patch).forEach(f => { delete next[`prop_${id}_${f}`]; });
      return next;
    });
  }, []);
  const addProperty = () => setProperties(ps => [...ps, newProperty(`p${nextPropId.current++}`)]);
  const removeProperty = useCallback((id: string) => {
    setProperties(ps => (ps.length > 1 ? ps.filter(p => p.id !== id) : ps));
  }, []);

  const setDoc = (key: string, patch: Partial<DocState>) => setDocs(d => ({ ...d, [key]: { ...d[key], ...patch } }));

  const handleFile = async (key: string, file: File | undefined) => {
    if (!file) return;
    setDoc(key, { uploading: true, error: '', fileName: file.name });
    try {
      const url = await uploadToCloudinary(file);
      setDoc(key, { uploading: false, url });
    } catch (e: any) {
      setDoc(key, { uploading: false, url: '', error: e.message || 'Upload failed' });
    }
  };

  // Validate only the current step; returns true if OK to advance.
  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required';
      if (!form.email.trim()) e.email = 'Email is required';
      else if (!EMAIL_REGEX.test(form.email)) e.email = 'Enter a valid email address';
      if (!form.phone.trim()) e.phone = 'Telephone number is required';
      else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid UK telephone number';
      if (!form.contactAddress.trim()) e.contactAddress = 'Contact address is required';
      if (!form.propertyCount) e.propertyCount = 'Please tell us how many properties you own';
    } else if (s === 1) {
      properties.forEach(p => {
        if (!p.postcode.trim()) e[`prop_${p.id}_postcode`] = 'Postcode is required';
        if (!p.street.trim()) e[`prop_${p.id}_street`] = '1st line of address is required';
        if (!p.propertyType) e[`prop_${p.id}_propertyType`] = 'Please select a property type';
        if (!p.bedrooms) e[`prop_${p.id}_bedrooms`] = 'Please select the number of bedrooms';
        if (!p.occupancy) e[`prop_${p.id}_occupancy`] = 'Please tell us if the property is occupied or vacant';
      });
    } else if (s === 2) {
      if (!form.selectedPackage) e.selectedPackage = 'Please choose a service';
    } else if (s === 3) {
      DOCS.forEach(d => { if (!docs[d.key].has) e[`doc_${d.key}`] = 'Please choose an option'; });
    } else if (s === 4) {
      if (!termsAccepted) e.terms = 'Please accept the terms & conditions to continue';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => { if (validateStep(step)) setStep(s => Math.min(STEPS.length - 1, s + 1)); };
  const back = () => { setErrors({}); setStep(s => Math.max(0, s - 1)); };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/landlord-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          selectedPackage: form.selectedPackage,
          termsAccepted,
          documents: Object.fromEntries(DOC_KEYS.map(k => [k, { status: docs[k].has, url: docs[k].url }])),
          properties: properties.map(({ id, ...p }) => p),
          postcode: properties[0]?.postcode || '',
          address: properties.map(formatAddress).join(' | '),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const anyUploading = Object.values(docs).some(d => d.uploading);

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
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>Registration Received!</h2>
              <p style={{ fontSize: 15, color: '#374151', maxWidth: 440, margin: '0 auto 8px', lineHeight: 1.6 }}>
                Thank you, {form.fullName.split(' ')[0]}. We&rsquo;ve received your registration for <strong>{properties[0].street || 'your property'}{properties[0].city ? `, ${properties[0].city}` : ''}</strong>
                {properties.length > 1 ? ` and ${properties.length - 1} other propert${properties.length - 1 === 1 ? 'y' : 'ies'}` : ''}.
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>Our lettings team will be in touch within 24–48 hours with your tailored proposal.</p>
              <Link href="/" style={{ display: 'inline-block', padding: '13px 28px', background: 'linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Back to Home</Link>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

              {/* Header + progress */}
              <div style={{ padding: 'clamp(22px, 4vw, 30px) clamp(22px, 4vw, 32px) 0' }}>
                <Link href="/landlord-registration" className="hol-back-link">← Back to overview</Link>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', margin: '10px 0 4px' }}>Landlord Registration</h1>
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

              {/* Step body */}
              <div style={{ padding: 'clamp(22px, 4vw, 32px)' }}>

                {/* STEP 1 — LANDLORD DETAILS */}
                {step === 0 && (
                  <div className="hol-form-grid">
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                      <input type="text" className={`hol-input${errors.fullName ? ' hol-input--error' : ''}`} placeholder="e.g. Mr Mansour Nosrati" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
                      {errors.fullName && <p className="hol-err">{errors.fullName}</p>}
                    </div>
                    <div className="hol-field">
                      <label className="hol-label">Email Address<span className="hol-req">*</span></label>
                      <input type="email" className={`hol-input${errors.email ? ' hol-input--error' : ''}`} placeholder="name@example.co.uk" value={form.email} onChange={set('email')} autoComplete="email" />
                      {errors.email && <p className="hol-err">{errors.email}</p>}
                    </div>
                    <div className="hol-field">
                      <label className="hol-label">Telephone Number<span className="hol-req">*</span></label>
                      <input type="tel" className={`hol-input${errors.phone ? ' hol-input--error' : ''}`} placeholder="e.g. 07883 809939" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                      {errors.phone && <p className="hol-err">{errors.phone}</p>}
                    </div>
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">Contact Address<span className="hol-req">*</span></label>
                      <input type="text" className={`hol-input${errors.contactAddress ? ' hol-input--error' : ''}`} placeholder="e.g. 45 Coronation Street, Manchester M27 6DE" value={form.contactAddress} onChange={set('contactAddress')} autoComplete="street-address" />
                      {errors.contactAddress && <p className="hol-err">{errors.contactAddress}</p>}
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Your correspondence address (where we send documents). This can differ from the property address.</p>
                    </div>
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">How many properties do you own?<span className="hol-req">*</span></label>
                      <select className={`hol-input hol-select${errors.propertyCount ? ' hol-input--error' : ''}`} value={form.propertyCount} onChange={set('propertyCount')}>
                        <option value="">Select...</option>
                        <option>1 property</option>
                        <option>2–3 properties</option>
                        <option>4–5 properties</option>
                        <option>6–10 properties</option>
                        <option>10+ properties</option>
                      </select>
                      {errors.propertyCount && <p className="hol-err">{errors.propertyCount}</p>}
                    </div>
                  </div>
                )}

                {/* STEP 2 — YOUR PROPERTY (one or more) */}
                {step === 1 && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px' }}>
                      Add each property you&rsquo;d like us to manage. Managing more than one? Use <strong>Add another property</strong> below.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {properties.map((p, i) => (
                        <PropertyRow
                          key={p.id}
                          property={p}
                          index={i}
                          total={properties.length}
                          onUpdate={updateProperty}
                          onRemove={removeProperty}
                          postcodeError={errors[`prop_${p.id}_postcode`]}
                          streetError={errors[`prop_${p.id}_street`]}
                          propertyTypeError={errors[`prop_${p.id}_propertyType`]}
                          bedroomsError={errors[`prop_${p.id}_bedrooms`]}
                          occupancyError={errors[`prop_${p.id}_occupancy`]}
                        />
                      ))}
                    </div>
                    <button type="button" className="hol-add-property" onClick={addProperty}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                      Add another property
                    </button>
                  </div>
                )}

                {/* STEP 3 — SERVICE / BUNDLE */}
                {step === 2 && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>Choose a management bundle. Each pairs a one-time tenant-find fee with an ongoing monthly management fee — you can discuss and change this with your agent later.</p>
                    <div className="hol-pkg-list">
                      {BUNDLES.map(b => {
                        const on = form.selectedPackage === b.label;
                        return (
                          <label key={b.id} className={`hol-pkg${on ? ' hol-pkg--on' : ''}`}>
                            <input type="radio" name="package" checked={on} onChange={() => { setForm(f => ({ ...f, selectedPackage: b.label })); setErrors(er => ({ ...er, selectedPackage: '' })); }} />
                            <span className="hol-radio" aria-hidden>{on && <span className="hol-radio-dot" />}</span>
                            <span style={{ flex: 1 }}>
                              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                                <span style={{ fontWeight: 700, fontSize: 14.5, color: '#0f1f3d' }}>{b.label}{b.badge && <span className="hol-pkg-badge">{b.badge}</span>}</span>
                                <span style={{ fontWeight: 800, fontSize: 14, color: '#2563eb', whiteSpace: 'nowrap' }}>{b.setupFee} <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>+ {b.mgmtFee}/mo</span></span>
                              </span>
                              <span style={{ display: 'block', fontSize: 12.5, color: '#6b7280', marginTop: 3, lineHeight: 1.55 }}>{b.blurb}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.selectedPackage && <p className="hol-err" style={{ marginTop: 10 }}>{errors.selectedPackage}</p>}
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '14px 0 0' }}>
                      Not sure? See the full breakdown on our <Link href="/pricing" style={{ color: '#2563eb', fontWeight: 600 }}>pricing page</Link>.
                    </p>
                  </div>
                )}

                {/* STEP 4 — DOCUMENTS */}
                {step === 3 && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px' }}>
                      Do you already have any of the following documents? If so, you can upload them now — or provide them later.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {DOCS.map(d => {
                        const st = docs[d.key];
                        return (
                          <div key={d.key} className={`hol-doc${errors[`doc_${d.key}`] ? ' hol-doc--error' : ''}`}>
                            <div style={{ marginBottom: 10 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f1f3d', margin: 0 }}>{d.label}</p>
                              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{d.hint}</p>
                            </div>
                            <div className="hol-yesno">
                              {d.options.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`hol-yesno-btn${st.has === opt.value ? ' on' : ''}`}
                                  onClick={() => {
                                    setDoc(d.key, opt.value === 'yes' ? { has: 'yes' } : { has: opt.value, url: '', fileName: '' });
                                    setErrors(er => ({ ...er, [`doc_${d.key}`]: '' }));
                                  }}
                                >{opt.label}</button>
                              ))}
                            </div>
                            {st.has === 'yes' && (
                              <div style={{ marginTop: 12 }}>
                                {st.url ? (
                                  <div className="hol-uploaded">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.fileName || 'Uploaded'}</span>
                                    <a href={st.url} target="_blank" rel="noreferrer" className="hol-view-link">View</a>
                                    <button type="button" onClick={() => setDoc(d.key, { url: '', fileName: '' })} className="hol-remove">Remove</button>
                                  </div>
                                ) : (
                                  <label className={`hol-upload${st.uploading ? ' is-loading' : ''}`}>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleFile(d.key, e.target.files?.[0])} disabled={st.uploading} />
                                    {st.uploading ? (
                                      <><svg className="hol-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Uploading…</>
                                    ) : (
                                      <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg> Upload document (PDF or image)</>
                                    )}
                                  </label>
                                )}
                                {st.error && <p className="hol-err" style={{ marginTop: 6 }}>{st.error}</p>}
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0' }}>Optional — you can also send documents to us later.</p>
                              </div>
                            )}
                            {errors[`doc_${d.key}`] && <p className="hol-err" style={{ marginTop: 8 }}>{errors[`doc_${d.key}`]}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5 — CONFIRM */}
                {step === 4 && (
                  <div>
                    <div className="hol-summary">
                      <SummaryRow label="Name" value={form.fullName} />
                      <SummaryRow label="Email" value={form.email} />
                      <SummaryRow label="Telephone" value={form.phone} />
                      <SummaryRow label="Contact address" value={form.contactAddress} />
                      <SummaryRow label="Properties owned" value={form.propertyCount} />
                      {properties.map((p, i) => (
                        <div key={p.id} className="hol-summary-row">
                          <span className="hol-summary-label">{properties.length > 1 ? `Property ${i + 1}` : 'Property'}</span>
                          <span className="hol-summary-value">
                            {formatAddress(p) || '—'}
                            {propertyDetails(p) && <span style={{ display: 'block', fontWeight: 400, color: '#6b7280', fontSize: 12, marginTop: 2 }}>{propertyDetails(p)}</span>}
                          </span>
                        </div>
                      ))}
                      <SummaryRow label="Service" value={form.selectedPackage} />
                      <SummaryRow label="EPC" value={docSummary(docs.epc)} />
                      <SummaryRow label="Electrical (EICR)" value={docSummary(docs.electrical)} />
                      <SummaryRow label="Gas Safety" value={docSummary(docs.gas)} />
                      <SummaryRow label="Land Registry" value={docSummary(docs.landReg)} />
                    </div>

                    <div className="hol-field hol-field--full" style={{ marginTop: 20 }}>
                      <label className="hol-label">Additional Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <textarea className="hol-input hol-textarea" rows={3} placeholder="Anything else we should know..." value={form.notes} onChange={set('notes')} />
                    </div>

                    <label className={`hol-terms-accept${errors.terms ? ' hol-terms-accept--error' : ''}`}>
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setErrors(er => ({ ...er, terms: '' })); }} />
                      <span className="hol-checkbox" aria-hidden>{termsAccepted && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>)}</span>
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                        I confirm I have read and accept the property management <Link href="/terms" style={{ color: '#2563eb', fontWeight: 600 }}>terms &amp; conditions</Link>, and consent to House of Lettings contacting me about my registration.
                      </span>
                    </label>
                    {errors.terms && <p className="hol-err" style={{ marginTop: 6 }}>{errors.terms}</p>}

                    {status === 'error' && (
                      <div className="hol-err-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {errorMsg}
                      </div>
                    )}
                  </div>
                )}

                {/* Nav buttons */}
                <div className="hol-wizard-nav">
                  <button type="button" className="hol-btn-ghost" onClick={back} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>← Back</button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" className="hol-submit" onClick={next}>
                      Continue
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                  ) : (
                    <button type="button" className="hol-submit" onClick={handleSubmit} disabled={status === 'loading' || anyUploading}>
                      {status === 'loading' ? (
                        <><svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Submitting…</>
                      ) : (
                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Complete Registration</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="hol-summary-row">
      <span className="hol-summary-label">{label}</span>
      <span className="hol-summary-value">{value || '—'}</span>
    </div>
  );
}

// One property block in the step-2 list. Kept as its own component so the
// PostcodeLookup callbacks stay stable per-property (id-bound) and the Google
// autocomplete doesn't re-bind on every keystroke.
function PropertyRow({
  property, index, total, onUpdate, onRemove, postcodeError, streetError, propertyTypeError, bedroomsError, occupancyError,
}: {
  property: Property;
  index: number;
  total: number;
  onUpdate: (id: string, patch: Partial<Property>) => void;
  onRemove: (id: string) => void;
  postcodeError?: string;
  streetError?: string;
  propertyTypeError?: string;
  bedroomsError?: string;
  occupancyError?: string;
}) {
  const upd = (field: keyof Property) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onUpdate(property.id, { [field]: e.target.value });
  const handleSelect = useCallback((addr: AddressResult) => {
    const patch: Partial<Property> = {};
    if (addr.street) patch.street = addr.street;
    if (addr.city) patch.city = addr.city;
    if (addr.county) patch.county = addr.county;
    if (addr.postcode) patch.postcode = addr.postcode;
    onUpdate(property.id, patch);
  }, [property.id, onUpdate]);
  const handlePostcode = useCallback((v: string) => onUpdate(property.id, { postcode: v }), [property.id, onUpdate]);

  return (
    <div className="hol-prop-card">
      {total > 1 && (
        <div className="hol-prop-head">
          <span className="hol-prop-badge">Property {index + 1}</span>
          <button type="button" className="hol-prop-remove" onClick={() => onRemove(property.id)}>Remove</button>
        </div>
      )}
      <div className="hol-form-grid">
        <div className="hol-field hol-field--full">
          <label className="hol-label">Postcode<span className="hol-req">*</span></label>
          <PostcodeLookup
            postcode={property.postcode}
            onPostcodeChange={handlePostcode}
            onSelect={handleSelect}
            inputClassName={`hol-input${postcodeError ? ' hol-input--error' : ''}`}
            placeholder="e.g. M1 1AE"
          />
          {postcodeError && <p className="hol-err">{postcodeError}</p>}
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Search your postcode, then select your address to auto-fill the fields below.</p>
        </div>
        <div className="hol-field hol-field--full">
          <label className="hol-label">1st Line of Address<span className="hol-req">*</span></label>
          <input type="text" className={`hol-input${streetError ? ' hol-input--error' : ''}`} placeholder="e.g. 12 Whitfield Street" value={property.street} onChange={(e) => onUpdate(property.id, { street: e.target.value })} autoComplete="off" />
          {streetError && <p className="hol-err">{streetError}</p>}
        </div>
        <div className="hol-field">
          <label className="hol-label">City <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" className="hol-input" placeholder="e.g. Manchester" value={property.city} onChange={(e) => onUpdate(property.id, { city: e.target.value })} autoComplete="off" />
        </div>
        <div className="hol-field">
          <label className="hol-label">County <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" className="hol-input" placeholder="e.g. Greater Manchester" value={property.county} onChange={upd('county')} autoComplete="off" />
        </div>
        <div className="hol-field">
          <label className="hol-label">Flat / Unit No. <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" className="hol-input" placeholder="e.g. Flat 2" value={property.flatNumber} onChange={upd('flatNumber')} autoComplete="off" />
        </div>

        <div className="hol-field">
          <label className="hol-label">Property Type<span className="hol-req">*</span></label>
          <select className={`hol-input hol-select${propertyTypeError ? ' hol-input--error' : ''}`} value={property.propertyType} onChange={upd('propertyType')}>
            <option value="">Select...</option>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          {propertyTypeError && <p className="hol-err">{propertyTypeError}</p>}
        </div>
        <div className="hol-field">
          <label className="hol-label">Bedrooms<span className="hol-req">*</span></label>
          <select className={`hol-input hol-select${bedroomsError ? ' hol-input--error' : ''}`} value={property.bedrooms} onChange={upd('bedrooms')}>
            <option value="">Select...</option>
            {['1', '2', '3', '4', '5', '6+'].map(n => <option key={n}>{n}</option>)}
          </select>
          {bedroomsError && <p className="hol-err">{bedroomsError}</p>}
        </div>
        <div className="hol-field">
          <label className="hol-label">Bathrooms <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <select className="hol-input hol-select" value={property.bathrooms} onChange={upd('bathrooms')}>
            <option value="">Select...</option>
            {['1', '2', '3', '4', '5+'].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="hol-field">
          <label className="hol-label">Receptions <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <select className="hol-input hol-select" value={property.receptions} onChange={upd('receptions')}>
            <option value="">Select...</option>
            {['0', '1', '2', '3', '4', '5+'].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="hol-field">
          <label className="hol-label">Furnishing Status <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <select className="hol-input hol-select" value={property.furnishing} onChange={upd('furnishing')}>
            <option value="">Select...</option>
            {FURNISHING.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="hol-field">
          <label className="hol-label">Parking <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <select className="hol-input hol-select" value={property.parking} onChange={upd('parking')}>
            <option value="">Select...</option>
            {PARKING.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="hol-field">
          <label className="hol-label">Property Condition <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <select className="hol-input hol-select" value={property.condition} onChange={upd('condition')}>
            <option value="">Select...</option>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="hol-field">
          <label className="hol-label">Occupancy<span className="hol-req">*</span></label>
          <select className={`hol-input hol-select${occupancyError ? ' hol-input--error' : ''}`} value={property.occupancy} onChange={upd('occupancy')}>
            <option value="">Select...</option>
            {OCCUPANCY.map(o => <option key={o}>{o}</option>)}
          </select>
          {occupancyError && <p className="hol-err">{occupancyError}</p>}
        </div>

        {property.occupancy === 'Occupied' && (
          <div className="hol-field--full hol-occupied">
            <div className="hol-occupied-head">Current tenancy details</div>
            <div className="hol-form-grid">
              <div className="hol-field">
                <label className="hol-label">Current Monthly Rent (£) <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" inputMode="numeric" className="hol-input" placeholder="e.g. 950" value={property.currentRent} onChange={upd('currentRent')} autoComplete="off" />
              </div>
              <div className="hol-field" />
              <div className="hol-field">
                <label className="hol-label">Tenancy Start Date <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input type="date" className="hol-input" style={{ colorScheme: 'light' }} value={property.tenancyStart} onChange={upd('tenancyStart')} />
              </div>
              <div className="hol-field">
                <label className="hol-label">Tenancy End Date <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input type="date" className="hol-input" style={{ colorScheme: 'light' }} value={property.tenancyEnd} onChange={upd('tenancyEnd')} />
              </div>
            </div>
          </div>
        )}

        <div className="hol-field">
          <label className="hol-label">Available From <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="date" className="hol-input" style={{ colorScheme: 'light' }} value={property.availableFrom} onChange={upd('availableFrom')} />
        </div>
        <div className="hol-field hol-field--full">
          <label className="hol-label">Security Code / Access Note <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" className="hol-input" placeholder="e.g. key-safe code, alarm code or access instructions" value={property.securityNote} onChange={upd('securityNote')} autoComplete="off" />
        </div>
      </div>
    </div>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  @keyframes hol-bg-shift { 0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;} }
  .hol-page-bg { background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 25%, #e8f0fe 50%, #f7f8fa 75%, #eef2ff 100%); background-size: 400% 400%; animation: hol-bg-shift 12s ease infinite; }

  .hol-back-link { font-size:12px; color:#6b7280; text-decoration:none; font-weight:600; }
  .hol-back-link:hover { color:#2563eb; }

  .hol-steps { display:flex; justify-content:space-between; gap:4px; margin:20px 0 10px; }
  .hol-step-item { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; text-align:center; }
  .hol-step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; background:#eef0f5; color:#9ca3af; transition:all .2s; }
  .hol-step-dot.active { background:#2563a8; color:#fff; box-shadow:0 0 0 4px rgba(37,99,168,.14); }
  .hol-step-dot.done { background:#1a3c5e; color:#fff; }
  .hol-step-label { font-size:10.5px; font-weight:600; color:#9ca3af; letter-spacing:.02em; }
  .hol-step-label.active { color:#2563a8; }
  @media(max-width:540px){ .hol-step-label{display:none;} }

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

  .hol-prop-card{border:1.5px solid #e5e7eb;border-radius:12px;padding:18px;background:#fdfdff;}
  .hol-prop-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
  .hol-prop-badge{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2563a8;background:#eef4ff;padding:4px 10px;border-radius:20px;}
  .hol-prop-remove{background:none;border:none;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;padding:0;}
  .hol-prop-remove:hover{text-decoration:underline;}
  .hol-add-property{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:11px 18px;border:1.5px dashed #b9c9e6;border-radius:10px;background:#f5f9ff;color:#2563a8;font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .hol-add-property:hover{border-color:#2563a8;background:#eaf2ff;}
  .hol-occupied{border:1px solid #dbe6fb;background:#f5f9ff;border-radius:10px;padding:14px 16px;}
  .hol-occupied-head{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2563a8;margin-bottom:12px;}

  .hol-pkg-list{display:flex;flex-direction:column;gap:10px;}
  .hol-pkg{display:flex;align-items:flex-start;gap:12px;border:1.5px solid #e5e7eb;border-radius:12px;padding:14px 16px;cursor:pointer;transition:border-color .15s,background .15s;background:#fff;}
  .hol-pkg:hover{border-color:#bcd0ee;}
  .hol-pkg--on{border-color:#2563a8;background:#f5f9ff;}
  .hol-pkg input,.hol-terms-accept input,.hol-upload input{position:absolute;opacity:0;width:0;height:0;}
  .hol-radio{flex-shrink:0;width:20px;height:20px;border-radius:50%;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;margin-top:2px;background:#fff;transition:all .15s;}
  .hol-pkg--on .hol-radio{border-color:#2563a8;}
  .hol-radio-dot{width:10px;height:10px;border-radius:50%;background:#2563a8;}
  .hol-pkg-badge{display:inline-block;margin-left:8px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#2563a8;background:#e8f0ff;padding:2px 7px;border-radius:20px;vertical-align:middle;}

  .hol-doc{border:1.5px solid #e5e7eb;border-radius:12px;padding:16px 18px;background:#fff;}
  .hol-doc--error{border-color:#f7b6b6;}
  .hol-yesno{display:flex;gap:10px;flex-wrap:wrap;}
  .hol-yesno-btn{flex:1;min-width:140px;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:9px;background:#fff;color:#374151;font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .hol-yesno-btn:hover{border-color:#bcd0ee;}
  .hol-yesno-btn.on{border-color:#2563a8;background:#2563a8;color:#fff;}
  .hol-upload{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border:1.5px dashed #cbd5e1;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;color:#2563a8;background:#f8fafc;transition:all .15s;}
  .hol-upload:hover{border-color:#2563a8;background:#f0f6ff;}
  .hol-upload.is-loading{cursor:wait;color:#6b7280;}
  .hol-uploaded{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:9px;font-size:13px;color:#166534;font-weight:600;}
  .hol-view-link{color:#2563eb;font-size:12px;font-weight:600;text-decoration:none;}
  .hol-remove{background:none;border:none;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;padding:0;}

  .hol-summary{border:1px solid #eef0f5;border-radius:12px;overflow:hidden;}
  .hol-summary-row{display:flex;justify-content:space-between;gap:16px;padding:11px 16px;font-size:13.5px;border-bottom:1px solid #f1f3f7;}
  .hol-summary-row:last-child{border-bottom:none;}
  .hol-summary-label{color:#6b7280;font-weight:500;flex-shrink:0;}
  .hol-summary-value{color:#111827;font-weight:600;text-align:right;}

  .hol-terms-accept{display:flex;align-items:flex-start;gap:12px;margin-top:22px;padding:16px 18px;border:1.5px solid #e5e7eb;border-radius:12px;cursor:pointer;background:#fafbff;transition:border-color .15s;}
  .hol-terms-accept:has(input:checked){border-color:#2563a8;background:#f5f9ff;}
  .hol-terms-accept--error{border-color:#f7b6b6;}
  .hol-checkbox{flex-shrink:0;width:20px;height:20px;border-radius:6px;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;color:#fff;background:#fff;transition:all .15s;margin-top:1px;}
  .hol-terms-accept:has(input:checked) .hol-checkbox{background:#2563a8;border-color:#2563a8;}

  .hol-wizard-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:28px;padding-top:22px;border-top:1px solid #f1f3f7;}
  .hol-btn-ghost{background:none;border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 20px;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;color:#374151;cursor:pointer;transition:all .15s;}
  .hol-btn-ghost:hover:not(:disabled){border-color:#cbd5e1;background:#f9fafb;}
  .hol-submit{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%);color:#fff;border:none;border-radius:10px;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;padding:13px 26px;cursor:pointer;transition:opacity .15s,transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(37,99,168,.35);white-space:nowrap;margin-left:auto;}
  .hol-submit:hover:not(:disabled){opacity:.92;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,168,.45);}
  .hol-submit:disabled{opacity:.7;cursor:not-allowed;}
  .hol-spinner{animation:hol-spin .8s linear infinite;}
  @keyframes hol-spin{to{transform:rotate(360deg);}}
  @keyframes hol-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}

  @media(max-width:600px){
    .hol-form-grid{grid-template-columns:1fr;gap:14px;}
  }
`;
