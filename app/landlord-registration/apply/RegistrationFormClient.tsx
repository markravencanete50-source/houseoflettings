'use client';
// app/landlord-registration/apply/RegistrationFormClient.tsx
// Step-by-step landlord registration wizard. The old "sign your management
// agreement" flow (/landlord-agreement) is merged in here: after the
// registration questions the landlord reviews the full Residential Lettings &
// Management Agreement, makes the residency declaration, accepts the terms and
// signs electronically (draw or upload). Submitting produces the signed
// agreement PDF and the confirmation emails — one flow, one record.
//
// Re-issue links from the dashboard land here as
// /landlord-registration/apply?agreementId=…&token=… — the saved record is
// pre-filled and the landlord jumps straight to the Agreement step to re-sign.
import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import SignaturePad from '@/components/SignaturePad';
import { BUNDLES } from '@/lib/bundles';
import {
  AGENT_DETAILS,
  effectiveIntro,
  buildAgreementSections,
  findBundle,
  type AgreementTemplate,
} from '@/lib/agreementContent';

const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The compliance documents we ask about. Each has a set of answer options;
// the gas certificate has an extra "no gas supply" option.
const YES = { value: 'yes', label: 'Yes, I have it' };
const NO = { value: 'no', label: 'No / arrange it for me' };
const DOCS = [
  { key: 'epc', label: 'Energy Performance Certificate (EPC)', hint: 'Must be rated E or above to let legally.', options: [YES, NO] },
  { key: 'electrical', label: 'Electrical Safety Certificate (EICR)', hint: 'Electrical Installation Condition Report, renewed every 5 years.', options: [YES, NO] },
  { key: 'gas', label: 'Gas Safety Certificate (CP12)', hint: 'Annual Gas Safety Record for properties with gas appliances.', options: [YES, NO, { value: 'nogas', label: 'No gas supply at this property' }] },
] as const;
const DOC_KEYS = DOCS.map(d => d.key);

// Identity/ownership documents requested on the details step: photo ID,
// proof of billing address, and Land Registry / proof of ownership.
const ID_DOCS = [
  { key: 'landlordId', label: 'Landlord ID', companyLabel: "Director's ID", hint: 'Passport, driving licence or national ID card.' },
  { key: 'billingProof', label: 'Billing Address Document', companyLabel: 'Billing Address Document', hint: 'Utility bill, council tax or bank statement (dated within the last 3 months) showing your contact address.' },
  { key: 'ownershipProof', label: 'Proof of Ownership', companyLabel: 'Proof of Ownership', hint: 'Land Registry title or other proof of ownership for your property.' },
] as const;
const ID_DOC_KEYS = ID_DOCS.map(d => d.key);

// UK company number: 8 digits, or 2-letter prefix + 6 digits (e.g. SC123456).
const COMPANY_NUMBER_REGEX = /^([A-Za-z]{2})?\d{6,8}$/;

// A person who owns or runs the company. The first person in the list is the
// main contact for the registration.
type CompanyPerson = { id: string; name: string; role: string; share: string };
const newPerson = (id: string): CompanyPerson => ({ id, name: '', role: '', share: '' });
const PERSON_ROLES = ['Director', 'Secretary', 'Person with significant control', 'Shareholder', 'Other'];

type DocState = { has: string; url: string; uploading: boolean; fileName: string; error: string };
const EMPTY_DOC: DocState = { has: '', url: '', uploading: false, fileName: '', error: '' };
const initDocs = (): Record<string, DocState> => Object.fromEntries(DOC_KEYS.map(k => [k, { ...EMPTY_DOC }]));

// Identity/ownership docs accept several files each (e.g. front & back of an ID,
// or multiple pages), mirroring the guarantor / tenant-application uploads.
type IdDocState = { urls: string[]; fileNames: string[]; uploading: boolean; error: string };
const newIdDoc = (): IdDocState => ({ urls: [], fileNames: [], uploading: false, error: '' });
const ID_DOC_MAX_FILES = 6;

const PROPERTY_TYPES = ['Detached house', 'Semi-detached house', 'Terraced house', 'Flat / Apartment', 'Bungalow', 'Maisonette', 'Studio', 'HMO / House share', 'Other'];
const FURNISHING = ['Furnished', 'Unfurnished', 'Part-furnished'];
const PARKING = ['None', 'On-street', 'Driveway', 'Garage', 'Allocated space', 'Other'];
const CONDITIONS = ['Newly built / refurbished', 'Excellent', 'Good', 'Fair', 'Needs some work', 'Needs full refurbishment'];
const OCCUPANCY = ['Vacant', 'Occupied'];

// Photos and a floor plan are optional: plenty of landlords register before they
// have either, and we don't want to lose them at this step. Both are per
// property, and only the Cloudinary URLs are kept (so a draft still serialises).
const PROPERTY_PHOTO_MAX = 12;
const FLOOR_PLAN_MAX = 3;

type Property = {
  id: string; postcode: string; street: string; city: string; county: string;
  propertyType: string; receptions: string; bedrooms: string; bathrooms: string;
  furnishing: string; parking: string; flatNumber: string; availableFrom: string; securityNote: string;
  condition: string; occupancy: string; currentRent: string; tenancyStart: string; tenancyEnd: string;
  photoUrls: string[]; photoNames: string[];
  floorPlanUrls: string[]; floorPlanNames: string[];
};
const newProperty = (id: string): Property => ({
  id, postcode: '', street: '', city: '', county: '',
  propertyType: '', receptions: '', bedrooms: '', bathrooms: '',
  furnishing: '', parking: '', flatNumber: '', availableFrom: '', securityNote: '',
  condition: '', occupancy: '', currentRent: '', tenancyStart: '', tenancyEnd: '',
  photoUrls: [], photoNames: [], floorPlanUrls: [], floorPlanNames: [],
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
  p.occupancy === 'Occupied' && p.tenancyStart && `Tenancy ${p.tenancyStart}${p.tenancyEnd ? ` - ${p.tenancyEnd}` : ''}`,
  p.availableFrom && `Available ${p.availableFrom}`,
  p.photoUrls.length && `${p.photoUrls.length} photo${p.photoUrls.length > 1 ? 's' : ''}`,
  p.floorPlanUrls.length && `${p.floorPlanUrls.length} floor plan${p.floorPlanUrls.length > 1 ? 's' : ''}`,
].filter(Boolean).join(' · ');

// Human-readable status for a document answer in the confirm summary.
const docSummary = (st: DocState) => {
  if (!st || !st.has) return '-';
  if (st.has === 'yes') return st.url ? 'Yes, uploaded' : 'Yes';
  if (st.has === 'nogas') return 'No gas supply';
  return 'To arrange';
};

const STEPS = ['Owner Type', 'Your Details', 'Property Details', 'Service', 'Documents', 'Agreement', 'Sign & Confirm'];
const AGREEMENT_STEP = 5;

// Direct-to-Cloudinary upload (bypasses Vercel's ~4.5MB request-body limit).
// The folder decides which library the file lands in: property photos & floor
// plans go to landlord-properties, the landlord's ID / billing / ownership /
// compliance documents stay in landlord-docs, and signature images go to the
// agreements library, so a registration's property photos are never mixed in
// with its sensitive personal documents.
async function uploadToCloudinary(file: File, folder: string = CLOUDINARY_FOLDERS.landlordDocs): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  if (!sigRes.ok) throw new Error('Could not prepare upload');
  // The server signs and echoes back the folder it actually used; sign with
  // that exact value so the signature matches.
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

const EMPTY_FORM = {
  ownerType: '', // 'individual' | 'company'
  companyName: '', companyNumber: '', registeredAddress: '', contactRole: '',
  fullName: '', email: '', phone: '', propertyCount: '', contactAddress: '',
  jointLandlord: false, landlord2Name: '', landlord2Email: '', landlord2Phone: '',
  residency: '', // 'resident' | 'non-resident'
  selectedPackage: '', selectedPackageId: '', notes: '',
  termsAccepted: false,
  signatureName: '', signatureDate: '',
  // The second (joint) landlord no longer signs on this device — they complete
  // their own ID, documents and signature via a secure emailed link after this
  // registration is submitted (see /landlord-registration/joint).
};
type FormState = typeof EMPTY_FORM;

// Draft answers survive navigating away (e.g. to the pricing or terms page)
// and coming back, restored from sessionStorage until the form is submitted.
// v3: the agreement + signature steps were merged in from /landlord-agreement.
const STORAGE_KEY = 'hol-landlord-apply-draft-v3';

// Flat single-property fields on a re-issued record (the agreement flow stored
// one property flat). Mapped back into properties[0] when resuming.
const FLAT_PROPERTY_FIELDS = ['postcode', 'street', 'city', 'county', 'flatNumber', 'propertyType', 'bedrooms', 'bathrooms', 'receptions', 'furnishing', 'parking', 'availableFrom', 'currentRent', 'securityNote'] as const;

export default function RegistrationFormClient() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('agreementId') || '';
  const resumeToken = searchParams.get('token') || '';
  const isResume = !!(resumeId && resumeToken);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [properties, setProperties] = useState<Property[]>([newProperty('p0')]);
  const nextPropId = useRef(1);
  const [companyPeople, setCompanyPeople] = useState<CompanyPerson[]>([newPerson('cp0')]);
  const nextPersonId = useRef(1);
  const [docs, setDocs] = useState<Record<string, DocState>>(initDocs);
  const [idDocs, setIdDocs] = useState<Record<string, IdDocState>>(() => Object.fromEntries(ID_DOC_KEYS.map(k => [k, newIdDoc()])));
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [doneRef, setDoneRef] = useState('');
  const [resumeLoading, setResumeLoading] = useState(isResume);
  const [resumeError, setResumeError] = useState('');
  // `restored` must be state (not a ref): the persist effect below may only
  // run in a render that already contains the restored values, otherwise the
  // initial empty state overwrites the saved draft (StrictMode double-mount).
  const [restored, setRestored] = useState(false);

  // Admin-editable agreement clause wording (falls back to code defaults).
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);

  // One-time discount coupon (issued by the office for a specific landlord).
  // Validated server-side here for preview, and redeemed atomically on submit.
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number; bundleId: string; bundleLabel: string; setupFee: number; finalFee: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponChecking, setCouponChecking] = useState(false);

  // Signature: a drawn/uploaded PNG data URL kept in memory (never persisted to
  // sessionStorage; it is large and re-drawing is trivial). A second slot is
  // used for the joint landlord when jointLandlord is on.
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signature2Data, setSignature2Data] = useState<string | null>(null);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingSig2, setUploadingSig2] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);

  const isCompany = form.ownerType === 'company';
  const bundle = findBundle(form.selectedPackageId) || findBundle(form.selectedPackage);

  // Load the admin-editable agreement wording once.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/agreement-template')
      .then(r => r.json())
      .then(j => { if (!cancelled) setTemplate(j.template || {}); })
      .catch(() => { if (!cancelled) setTemplate({}); });
    return () => { cancelled = true; };
  }, []);

  // On mount: in resume mode, pre-fill from the server (the landlord came back
  // via a re-issue link to review and re-sign); otherwise restore a saved draft.
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-GB');
    if (isResume) {
      fetch(`/api/landlord-registration/resume?id=${encodeURIComponent(resumeId)}&token=${encodeURIComponent(resumeToken)}`)
        .then(async r => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.message || 'This signing link is invalid or has expired.');
          const fields = j.fields || {};
          setForm(f => {
            const next: any = { ...EMPTY_FORM, signatureDate: today };
            for (const k of Object.keys(EMPTY_FORM) as (keyof FormState)[]) {
              if (fields[k] !== undefined && fields[k] !== null) next[k] = fields[k];
            }
            if (!next.ownerType) next.ownerType = fields.companyName ? 'company' : 'individual';
            next.termsAccepted = false; // must re-accept the updated terms
            next.signatureDate = today;
            return next;
          });
          if (Array.isArray(fields.companyPeople) && fields.companyPeople.length) {
            setCompanyPeople(fields.companyPeople.map((p: any, i: number) => ({ ...newPerson(`cp${i}`), ...p })));
            nextPersonId.current = fields.companyPeople.length;
          }
          if (Array.isArray(fields.properties) && fields.properties.length) {
            setProperties(fields.properties.map((p: any, i: number) => ({ ...newProperty(`p${i}`), ...p })));
            nextPropId.current = fields.properties.length;
          } else {
            // Older records store one property flat — rebuild properties[0].
            const p0: any = newProperty('p0');
            FLAT_PROPERTY_FIELDS.forEach(k => { if (fields[k]) p0[k] = fields[k]; });
            setProperties([p0]);
            nextPropId.current = 1;
          }
          setStep(AGREEMENT_STEP); // jump to the agreement review, then Sign
          setResumeLoading(false);
          setRestored(true);
        })
        // On error, keep the loading screen so it shows the error (not an empty
        // form) — the link is invalid, expired, or the record is gone.
        .catch((e: any) => { setResumeError(e.message || 'Could not load your registration.'); setRestored(true); });
      return;
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.form) setForm({ ...EMPTY_FORM, ...saved.form });
        if (Array.isArray(saved.properties) && saved.properties.length) {
          setProperties(saved.properties.map((p: Property) => ({ ...newProperty(p.id), ...p })));
          nextPropId.current = Math.max(...saved.properties.map((p: Property) => (parseInt(p.id.slice(1), 10) || 0))) + 1;
        }
        if (Array.isArray(saved.companyPeople) && saved.companyPeople.length) {
          setCompanyPeople(saved.companyPeople.map((p: CompanyPerson) => ({ ...newPerson(p.id), ...p })));
          nextPersonId.current = Math.max(...saved.companyPeople.map((p: CompanyPerson) => (parseInt(p.id.slice(2), 10) || 0))) + 1;
        }
        if (saved.docs) {
          setDocs(d => Object.fromEntries(DOC_KEYS.map(k => [k, { ...d[k], ...saved.docs[k], uploading: false, error: '' }])));
        }
        if (saved.idDocs) {
          setIdDocs(d => Object.fromEntries(ID_DOC_KEYS.map(k => {
            const s = saved.idDocs[k] || {};
            // Accept both the new multi-file shape and the older single-file one.
            const urls = Array.isArray(s.urls) ? s.urls : (s.url ? [s.url] : []);
            const fileNames = Array.isArray(s.fileNames) ? s.fileNames : (s.fileName ? [s.fileName] : []);
            return [k, { ...d[k], urls, fileNames, uploading: false, error: '' }];
          })));
        }
        if (typeof saved.step === 'number') setStep(Math.min(Math.max(saved.step, 0), STEPS.length - 1));
      }
    } catch { /* corrupt draft, start fresh */ }
    setForm(f => (f.signatureDate ? f : { ...f, signatureDate: today }));
    setRestored(true);
  }, [isResume, resumeId, resumeToken]);

  // Save the draft on every change so nothing is lost if the page unloads.
  // Never persist a re-issue session (it belongs to a specific record).
  useEffect(() => {
    if (!restored || isResume) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form, properties, companyPeople, docs, idDocs }));
    } catch { /* storage full/unavailable, non-fatal */ }
  }, [restored, isResume, step, form, properties, companyPeople, docs, idDocs]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(er => ({ ...er, [key]: '' }));
  };
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  // A coupon belongs to ONE package — drop it if the landlord switches away.
  useEffect(() => {
    if (coupon && form.selectedPackageId && coupon.bundleId !== form.selectedPackageId) {
      setCoupon(null);
      setCouponMsg(`Coupon ${coupon.code} removed — it is only valid for ${coupon.bundleLabel}.`);
    }
  }, [form.selectedPackageId, coupon]);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponMsg('Enter your coupon code first.'); return; }
    setCouponChecking(true);
    setCouponMsg('');
    try {
      const res = await fetch(`/api/landlord-registration/coupon?code=${encodeURIComponent(code)}&bundleId=${encodeURIComponent(form.selectedPackageId || '')}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || 'Could not check that code.');
      setCoupon(j.coupon);
      setCouponInput('');
    } catch (e: any) {
      setCoupon(null);
      setCouponMsg(e.message || 'Could not check that code.');
    } finally {
      setCouponChecking(false);
    }
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

  const updatePerson = (id: string, patch: Partial<CompanyPerson>) => {
    setCompanyPeople(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
    setErrors(e => {
      const next = { ...e };
      Object.keys(patch).forEach(f => { delete next[`person_${id}_${f}`]; });
      if (patch.share !== undefined) delete next.companyShareTotal;
      return next;
    });
  };
  const addPerson = () => setCompanyPeople(ps => [...ps, newPerson(`cp${nextPersonId.current++}`)]);
  const removePerson = (id: string) => setCompanyPeople(ps => (ps.length > 1 ? ps.filter(p => p.id !== id) : ps));

  const setDoc = (key: string, patch: Partial<DocState>) => setDocs(d => ({ ...d, [key]: { ...d[key], ...patch } }));
  const setIdDoc = (key: string, patch: Partial<IdDocState>) => setIdDocs(d => ({ ...d, [key]: { ...d[key], ...patch } }));

  // New selections are ADDED to what's already uploaded, so a landlord can build
  // up several files (e.g. ID front + back) one at a time, matching the
  // guarantor / tenant-application upload behaviour.
  const handleIdFile = async (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = Math.max(0, ID_DOC_MAX_FILES - idDocs[key].urls.length);
    const newFiles = Array.from(files).slice(0, room);
    if (newFiles.length === 0) return;
    setIdDoc(key, { uploading: true, error: '' });
    setErrors(er => ({ ...er, [`id_${key}`]: '' }));
    const addedUrls: string[] = [];
    const addedNames: string[] = [];
    try {
      for (const file of newFiles) {
        // ID / billing / ownership documents → the private landlord-docs library.
        addedUrls.push(await uploadToCloudinary(file, CLOUDINARY_FOLDERS.landlordDocs));
        addedNames.push(file.name);
      }
      setIdDocs(d => ({ ...d, [key]: { ...d[key], uploading: false, urls: [...d[key].urls, ...addedUrls], fileNames: [...d[key].fileNames, ...addedNames] } }));
    } catch (e: any) {
      setIdDocs(d => ({ ...d, [key]: { ...d[key], uploading: false, urls: [...d[key].urls, ...addedUrls], fileNames: [...d[key].fileNames, ...addedNames], error: e.message || 'Upload failed' } }));
    }
  };

  const removeIdFile = (key: string, index: number) => setIdDocs(d => ({
    ...d,
    [key]: { ...d[key], urls: d[key].urls.filter((_, i) => i !== index), fileNames: d[key].fileNames.filter((_, i) => i !== index) },
  }));

  const handleFile = async (key: string, file: File | undefined) => {
    if (!file) return;
    setDoc(key, { uploading: true, error: '', fileName: file.name });
    try {
      // Compliance certificates (EPC / EICR / gas) → the private landlord-docs library.
      const url = await uploadToCloudinary(file, CLOUDINARY_FOLDERS.landlordDocs);
      setDoc(key, { uploading: false, url });
    } catch (e: any) {
      setDoc(key, { uploading: false, url: '', error: e.message || 'Upload failed' });
    }
  };

  const onUploadSignature = async (file: File, which: 1 | 2 = 1) => {
    const setUploading = which === 2 ? setUploadingSig2 : setUploadingSig;
    const setData = which === 2 ? setSignature2Data : setSignatureData;
    setUploading(true);
    setErrorMsg('');
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      setData(dataUrl);
    } catch {
      setErrors(er => ({ ...er, signature: 'Could not read that image. Please try another file.' }));
    } finally {
      setUploading(false);
    }
  };

  // Validate only the current step; returns true if OK to advance.
  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.ownerType) e.ownerType = 'Please tell us if the property is owned by you personally or by a company';
    } else if (s === 1) {
      if (isCompany) {
        if (!form.companyName.trim()) e.companyName = 'Company name is required';
        if (!form.companyNumber.trim()) e.companyNumber = 'Company number is required';
        else if (!COMPANY_NUMBER_REGEX.test(form.companyNumber.replace(/\s/g, ''))) e.companyNumber = 'Enter a valid Companies House number (e.g. 13506429)';
        if (!form.registeredAddress.trim()) e.registeredAddress = 'Registered office address is required';
        companyPeople.forEach((p, i) => {
          if (!p.name.trim()) e[`person_${p.id}_name`] = i === 0 ? 'Main contact name is required' : 'Name is required, or remove this person';
          if (i === 0 && !p.role) e[`person_${p.id}_role`] = 'Please select their role';
          if (!p.share.trim()) {
            e[`person_${p.id}_share`] = 'Please enter their shareholding percentage. Enter 0 if they hold no shares';
          } else {
            const v = parseFloat(p.share);
            if (isNaN(v) || v < 0 || v > 100) e[`person_${p.id}_share`] = 'Enter a percentage between 0 and 100';
          }
        });
        const totalShare = companyPeople.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
        if (totalShare > 100) e.companyShareTotal = `The shareholding percentages add up to ${totalShare}%. The total cannot be more than 100%`;
      } else {
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (form.jointLandlord) {
          if (!form.landlord2Name.trim()) e.landlord2Name = 'Please enter the second landlord’s name, or turn off joint landlord';
          // Email is now required for joint landlords — we email them a secure
          // link to complete their own ID and documents.
          if (!form.landlord2Email.trim()) e.landlord2Email = 'The second landlord’s email is required so we can send them their link';
          else if (!EMAIL_REGEX.test(form.landlord2Email)) e.landlord2Email = 'Enter a valid email address for the second landlord';
          if (!form.landlord2Phone.trim()) e.landlord2Phone = 'The second landlord’s telephone number is required';
          else if (!UK_PHONE_REGEX.test(form.landlord2Phone.replace(/\s/g, ''))) e.landlord2Phone = 'Enter a valid UK telephone number';
        }
      }
      if (!form.email.trim()) e.email = 'Email is required';
      else if (!EMAIL_REGEX.test(form.email)) e.email = 'Enter a valid email address';
      if (!form.phone.trim()) e.phone = 'Telephone number is required';
      else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid UK telephone number';
      if (!form.contactAddress.trim()) e.contactAddress = 'Contact address is required';
      if (!form.propertyCount) e.propertyCount = 'Please tell us how many properties you own';
      // In resume mode the record already exists — never block re-signing on
      // uploads that were (or will be) collected separately.
      if (!isResume) {
        ID_DOCS.forEach(d => {
          const label = isCompany ? d.companyLabel : d.label;
          if (idDocs[d.key].uploading) e[`id_${d.key}`] = 'Please wait for the upload to finish';
          else if (idDocs[d.key].urls.length === 0) e[`id_${d.key}`] = `Please upload your ${label.toLowerCase()}`;
        });
      }
    } else if (s === 2) {
      properties.forEach(p => {
        if (!p.postcode.trim()) e[`prop_${p.id}_postcode`] = 'Postcode is required';
        if (!p.street.trim()) e[`prop_${p.id}_street`] = '1st line of address is required';
        if (!p.propertyType) e[`prop_${p.id}_propertyType`] = 'Please select a property type';
        if (!p.bedrooms) e[`prop_${p.id}_bedrooms`] = 'Please select the number of bedrooms';
        if (!p.occupancy) e[`prop_${p.id}_occupancy`] = 'Please tell us if the property is occupied or vacant';
      });
    } else if (s === 3) {
      if (!form.selectedPackageId && !form.selectedPackage) e.selectedPackage = 'Please choose a service';
    } else if (s === 4) {
      DOCS.forEach(d => { if (!docs[d.key].has) e[`doc_${d.key}`] = 'Please choose an option'; });
    } else if (s === AGREEMENT_STEP) {
      if (!form.residency) e.residency = 'Please confirm whether you are a UK-resident or non-resident landlord';
      if (!form.termsAccepted) e.termsAccepted = 'Please tick the box to accept the terms of the agreement';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Leaving a step: dismiss the keyboard (resets any mobile focus-zoom) and
  // return to the top of the page so the next step starts from its beginning.
  const resetView = () => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo(0, 0);
  };
  const next = () => { if (validateStep(step)) { setStep(s => Math.min(STEPS.length - 1, s + 1)); resetView(); } };
  const back = () => { setErrors({}); setStep(s => Math.max(0, s - 1)); resetView(); };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!form.signatureName.trim()) e.signatureName = 'Please type your full name to confirm your signature';
    if (!signatureData) e.signature = 'Please add your signature by drawing it or uploading an image';
    // The second (joint) landlord signs their own copy later via their emailed
    // link — nothing to validate for them on this device.
    if (!bundle) e.selectedPackage = 'Please choose a service';
    if (Object.keys(e).length) { setErrors(e); return; }

    setStatus('loading');
    setErrorMsg('');
    try {
      // Store the signature image in Cloudinary for the office record; the raw
      // data URL is also sent so the API can embed it into the signed PDF.
      let signatureUrl = '';
      try {
        const file = dataUrlToFile(signatureData!, `signature-${Date.now()}.png`);
        signatureUrl = await uploadToCloudinary(file, CLOUDINARY_FOLDERS.agreements);
      } catch { /* non-fatal: the data URL still reaches the PDF/email */ }

      const first = properties[0];
      const res = await fetch('/api/landlord-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // For a company, the first person in the list is the main contact.
          fullName: isCompany ? companyPeople[0].name : form.fullName,
          contactRole: isCompany ? companyPeople[0].role : '',
          companyPeople: isCompany ? companyPeople.map(({ id, ...rest }) => rest) : [],
          jointLandlord: !isCompany && form.jointLandlord,
          selectedPackage: bundle!.label,
          selectedPackageId: bundle!.id,
          // First file kept as *Url/*FileName for backward compatibility; full
          // lists sent as *Urls/*FileNames so every uploaded document is captured.
          landlordIdUrl: idDocs.landlordId.urls[0] || '',
          landlordIdFileName: idDocs.landlordId.fileNames[0] || '',
          landlordIdUrls: idDocs.landlordId.urls,
          landlordIdFileNames: idDocs.landlordId.fileNames,
          billingProofUrl: idDocs.billingProof.urls[0] || '',
          billingProofFileName: idDocs.billingProof.fileNames[0] || '',
          billingProofUrls: idDocs.billingProof.urls,
          billingProofFileNames: idDocs.billingProof.fileNames,
          ownershipProofUrl: idDocs.ownershipProof.urls[0] || '',
          ownershipProofFileName: idDocs.ownershipProof.fileNames[0] || '',
          ownershipProofUrls: idDocs.ownershipProof.urls,
          ownershipProofFileNames: idDocs.ownershipProof.fileNames,
          documents: Object.fromEntries(DOC_KEYS.map(k => [k, { status: docs[k].has, url: docs[k].url }])),
          properties: properties.map(({ id, ...p }) => p),
          // The first property is also sent flat, so the agreement PDF, the
          // emails and the dashboard editor keep working on one property line.
          postcode: first?.postcode || '',
          street: first?.street || '',
          city: first?.city || '',
          county: first?.county || '',
          flatNumber: first?.flatNumber || '',
          propertyType: first?.propertyType || '',
          bedrooms: first?.bedrooms || '',
          bathrooms: first?.bathrooms || '',
          receptions: first?.receptions || '',
          furnishing: first?.furnishing || '',
          parking: first?.parking || '',
          availableFrom: first?.availableFrom || '',
          currentRent: first?.currentRent || '',
          securityNote: first?.securityNote || '',
          address: properties.map(formatAddress).join(' | '),
          // Agreement extras
          signatureUrl,
          signatureImage: signatureData, // NOT a *Url field, so it survives sanitising
          ...(coupon ? { couponCode: coupon.code } : {}),
          ...(isResume ? { agreementId: resumeId, reissueToken: resumeToken } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { }
      setDoneRef(data.id || '');
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const anyUploading = [...Object.values(docs), ...Object.values(idDocs)].some(d => d.uploading) || uploadingSig || uploadingSig2;

  const landlordDisplayName = isCompany
    ? (form.companyName || companyPeople[0]?.name || '-')
    : [form.fullName, form.jointLandlord && form.landlord2Name ? `and ${form.landlord2Name}` : ''].filter(Boolean).join(' ');

  if (resumeLoading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <Navbar />
        <div className="hol-page-bg" style={{ minHeight: '100vh', fontFamily: "'Poppins', sans-serif", paddingTop: 'calc(68px + clamp(28px, 5vw, 52px))', paddingBottom: 'clamp(48px, 8vw, 80px)' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px, 4%, 4%)' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#6b7280', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
              {resumeError ? <p className="hol-err" style={{ fontSize: 14 }}>{resumeError}</p> : 'Loading your registration…'}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>Registration Complete &amp; Agreement Signed!</h2>
              <p style={{ fontSize: 15, color: '#374151', maxWidth: 460, margin: '0 auto 8px', lineHeight: 1.6 }}>
                Thank you, {((isCompany ? companyPeople[0].name : form.fullName) || 'there').split(' ')[0]}. We&rsquo;ve received your registration for <strong>{properties[0].street || 'your property'}{properties[0].city ? `, ${properties[0].city}` : ''}</strong>
                {properties.length > 1 ? ` and ${properties.length - 1} other propert${properties.length - 1 === 1 ? 'y' : 'ies'}` : ''} and your signed <strong>{bundle?.label}</strong> agreement.
                A copy of the signed PDF has been emailed to <strong>{form.email}</strong>.
              </p>
              {doneRef && <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>Reference: {doneRef}</p>}
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>Our lettings team has been notified and will be in touch within 24-48 hours.</p>
              <Link href="/" className="hol-submit" style={{ margin: '0 auto' }}>Back to Home</Link>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

              {/* Header + progress */}
              <div style={{ padding: 'clamp(22px, 4vw, 30px) clamp(22px, 4vw, 32px) 0' }}>
                <Link href="/landlord-registration" className="hol-back-link">← Back to overview</Link>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', margin: '10px 0 4px' }}>{isResume ? 'Review & re-sign your registration' : 'Landlord Registration'}</h1>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  {isResume
                    ? 'Your registration has been updated. Please review the agreement below and sign again to confirm the current terms.'
                    : `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`}
                </p>

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

                {/* STEP 1, OWNER TYPE */}
                {step === 0 && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px' }}>
                      Who owns the property? This decides which details we ask for next.
                    </p>
                    <div className="hol-owner-grid">
                      {[
                        { v: 'individual', title: 'Individual Owner', desc: 'The property is owned in your personal name (or jointly with another person).' },
                        { v: 'company', title: 'Company / Ltd', desc: 'The property is owned by a limited company or business registered at Companies House.' },
                      ].map(o => {
                        const on = form.ownerType === o.v;
                        return (
                          <button
                            key={o.v}
                            type="button"
                            className={`hol-owner-card${on ? ' hol-owner-card--on' : ''}`}
                            onClick={() => { setForm(f => ({ ...f, ownerType: o.v })); setErrors(er => ({ ...er, ownerType: '' })); }}
                          >
                            <span className="hol-owner-icon" aria-hidden>
                              {o.v === 'individual' ? (
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              ) : (
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" /></svg>
                              )}
                            </span>
                            <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: '#0f1f3d', marginBottom: 4 }}>{o.title}</span>
                            <span style={{ display: 'block', fontSize: 12.5, color: '#6b7280', lineHeight: 1.55 }}>{o.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.ownerType && <p className="hol-err" style={{ marginTop: 10 }}>{errors.ownerType}</p>}
                  </div>
                )}

                {/* STEP 2, YOUR DETAILS (individual or company) */}
                {step === 1 && (
                  <div className="hol-form-grid">
                    {isCompany && (
                      <>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Company Name<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.companyName ? ' hol-input--error' : ''}`} placeholder="e.g. Mark Properties Ltd" value={form.companyName} onChange={set('companyName')} autoComplete="organization" />
                          {errors.companyName && <p className="hol-err">{errors.companyName}</p>}
                        </div>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Company Number<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.companyNumber ? ' hol-input--error' : ''}`} placeholder="e.g. 13506429" value={form.companyNumber} onChange={set('companyNumber')} autoComplete="off" />
                          {errors.companyNumber && <p className="hol-err">{errors.companyNumber}</p>}
                          <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>As registered at Companies House.</p>
                        </div>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Registered Office Address<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.registeredAddress ? ' hol-input--error' : ''}`} placeholder="e.g. 49 St. Kilda's Road, London, England, N16 5BS" value={form.registeredAddress} onChange={set('registeredAddress')} autoComplete="off" />
                          {errors.registeredAddress && <p className="hol-err">{errors.registeredAddress}</p>}
                        </div>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Owners &amp; Officers<span className="hol-req">*</span></label>
                          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>Add each person who owns or runs the company, with their shareholding. The first person is our main contact.</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {companyPeople.map((p, i) => (
                              <div key={p.id} className="hol-prop-card">
                                <div className="hol-prop-head">
                                  <span className="hol-prop-badge">{i === 0 ? 'Person 1: Main Contact' : `Person ${i + 1}`}</span>
                                  {i > 0 && <button type="button" className="hol-prop-remove" onClick={() => removePerson(p.id)}>Remove</button>}
                                </div>
                                <div className="hol-form-grid">
                                  <div className="hol-field">
                                    <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                                    <input type="text" className={`hol-input${errors[`person_${p.id}_name`] ? ' hol-input--error' : ''}`} placeholder="e.g. Shalom Mark" value={p.name} onChange={(e) => updatePerson(p.id, { name: e.target.value })} autoComplete="off" />
                                    {errors[`person_${p.id}_name`] && <p className="hol-err">{errors[`person_${p.id}_name`]}</p>}
                                  </div>
                                  <div className="hol-field">
                                    <label className="hol-label">Role{i === 0 && <span className="hol-req">*</span>}</label>
                                    <select className={`hol-input hol-select${errors[`person_${p.id}_role`] ? ' hol-input--error' : ''}`} value={p.role} onChange={(e) => updatePerson(p.id, { role: e.target.value })}>
                                      <option value="">Select...</option>
                                      {PERSON_ROLES.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                    {errors[`person_${p.id}_role`] && <p className="hol-err">{errors[`person_${p.id}_role`]}</p>}
                                  </div>
                                  <div className="hol-field hol-field--full">
                                    <label className="hol-label">What percentage of the company does this person own?<span className="hol-req">*</span></label>
                                    <div style={{ position: 'relative' }}>
                                      <input type="text" inputMode="decimal" className={`hol-input${errors[`person_${p.id}_share`] ? ' hol-input--error' : ''}`} placeholder="e.g. 50" style={{ paddingRight: 36 }} value={p.share} onChange={(e) => updatePerson(p.id, { share: e.target.value })} autoComplete="off" />
                                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, fontWeight: 600, pointerEvents: 'none' }}>%</span>
                                    </div>
                                    {errors[`person_${p.id}_share`] && <p className="hol-err">{errors[`person_${p.id}_share`]}</p>}
                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Their shareholding, regardless of their role. Enter 0 if they hold no shares.</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {(() => {
                            const total = companyPeople.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
                            return (
                              <p style={{ fontSize: 12.5, fontWeight: 600, color: total > 100 ? '#dc2626' : '#6b7280', margin: '8px 0 0' }}>
                                Total shareholding entered: {total}%{total > 100 ? ', cannot be more than 100%' : ''}
                              </p>
                            );
                          })()}
                          {errors.companyShareTotal && <p className="hol-err" style={{ marginTop: 4 }}>{errors.companyShareTotal}</p>}
                          <button type="button" className="hol-add-property" onClick={addPerson}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            Add another person
                          </button>
                        </div>
                      </>
                    )}
                    {!isCompany && (
                      <>
                        <div className="hol-field hol-field--full">
                          <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.fullName ? ' hol-input--error' : ''}`} placeholder="e.g. Mr Mansour Nosrati" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
                          {errors.fullName && <p className="hol-err">{errors.fullName}</p>}
                        </div>
                        <div className="hol-field hol-field--full">
                          <label className="hol-joint">
                            <input type="checkbox" checked={form.jointLandlord} onChange={e => setField('jointLandlord', e.target.checked)} />
                            <span>There is a second (joint) landlord on this property</span>
                          </label>
                        </div>
                        {form.jointLandlord && (
                          <div className="hol-field hol-field--full">
                            <div className="hol-joint-box">
                              <div className="hol-joint-box__head">
                                <span className="hol-joint-box__title">👥 Second (Joint) Landlord</span>
                                <span className="hol-joint-box__note">We'll email them a secure link to add their own ID &amp; documents — they won't choose a package or answer the certificates.</span>
                              </div>
                              <div className="hol-joint-box__grid">
                                <div className="hol-field">
                                  <label className="hol-label">Second Landlord Full Name<span className="hol-req">*</span></label>
                                  <input type="text" className={`hol-input${errors.landlord2Name ? ' hol-input--error' : ''}`} placeholder="e.g. Mark Raven Canete" value={form.landlord2Name} onChange={set('landlord2Name')} autoComplete="off" />
                                  {errors.landlord2Name && <p className="hol-err">{errors.landlord2Name}</p>}
                                </div>
                                <div className="hol-field">
                                  <label className="hol-label">Second Landlord Email<span className="hol-req">*</span></label>
                                  <input type="email" className={`hol-input${errors.landlord2Email ? ' hol-input--error' : ''}`} placeholder="name@example.co.uk" value={form.landlord2Email} onChange={set('landlord2Email')} autoComplete="off" />
                                  {errors.landlord2Email && <p className="hol-err">{errors.landlord2Email}</p>}
                                </div>
                                <div className="hol-field">
                                  <label className="hol-label">Second Landlord Telephone<span className="hol-req">*</span></label>
                                  <input type="tel" className={`hol-input${errors.landlord2Phone ? ' hol-input--error' : ''}`} placeholder="e.g. 07489 489498" value={form.landlord2Phone} onChange={set('landlord2Phone')} autoComplete="off" />
                                  {errors.landlord2Phone && <p className="hol-err">{errors.landlord2Phone}</p>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
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
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Your billing / correspondence address (where we send documents). This can differ from the property address.</p>
                    </div>
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">How many properties do you own?<span className="hol-req">*</span></label>
                      <select className={`hol-input hol-select${errors.propertyCount ? ' hol-input--error' : ''}`} value={form.propertyCount} onChange={set('propertyCount')}>
                        <option value="">Select...</option>
                        <option>1 property</option>
                        <option>2-3 properties</option>
                        <option>4-5 properties</option>
                        <option>6-10 properties</option>
                        <option>10+ properties</option>
                      </select>
                      {errors.propertyCount && <p className="hol-err">{errors.propertyCount}</p>}
                    </div>
                    {ID_DOCS.map(d => {
                      const st = idDocs[d.key];
                      const docLabel = isCompany ? d.companyLabel : d.label;
                      const full = st.urls.length >= ID_DOC_MAX_FILES;
                      return (
                        <div key={d.key} className="hol-field hol-field--full">
                          <label className="hol-label">{docLabel}<span className="hol-req">*</span></label>
                          {st.urls.map((url, i) => (
                            <div key={i} className="hol-uploaded" style={{ marginBottom: 6 }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.fileNames[i] || 'Uploaded'}</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="hol-view-link">View</a>
                              <button type="button" onClick={() => removeIdFile(d.key, i)} className="hol-remove">Remove</button>
                            </div>
                          ))}
                          {!full && (
                            <label className={`hol-upload${st.uploading ? ' is-loading' : ''}${errors[`id_${d.key}`] ? ' hol-upload--error' : ''}`}>
                              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => { handleIdFile(d.key, e.target.files); e.currentTarget.value = ''; }} disabled={st.uploading} />
                              {st.uploading ? (
                                <><svg className="hol-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Uploading…</>
                              ) : st.urls.length > 0 ? (
                                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add another document{` (up to ${ID_DOC_MAX_FILES})`}</>
                              ) : (
                                <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg> Upload {docLabel} (photo or PDF)</>
                              )}
                            </label>
                          )}
                          {st.error && <p className="hol-err">{st.error}</p>}
                          {errors[`id_${d.key}`] && <p className="hol-err">{errors[`id_${d.key}`]}</p>}
                          <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{d.hint} You can add more than one file.</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STEP 3, YOUR PROPERTY (one or more) */}
                {step === 2 && (
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

                {/* STEP 4, SERVICE / BUNDLE */}
                {step === 3 && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>Choose a management bundle. Our management fees are the percentage of the monthly rent shown in green, with smaller set up fees to get started. Your agreement covers the package you select here.</p>
                    <div className="hol-pkg-list">
                      {BUNDLES.map(b => {
                        const on = form.selectedPackageId === b.id || (!form.selectedPackageId && form.selectedPackage === b.label);
                        const expanded = expandedBundle === b.id;
                        return (
                          <div key={b.id} className={`hol-pkg${on ? ' hol-pkg--on' : ''}`}>
                            <label className="hol-pkg-main">
                              <input type="radio" name="package" checked={on} onChange={() => { setForm(f => ({ ...f, selectedPackage: b.label, selectedPackageId: b.id })); setErrors(er => ({ ...er, selectedPackage: '' })); }} />
                              <span className="hol-radio" aria-hidden>{on && <span className="hol-radio-dot" />}</span>
                              <span style={{ flex: 1 }}>
                                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14.5, color: '#0f1f3d' }}>{b.label}{b.badge && <span className="hol-pkg-badge">{b.badge}</span>}</span>
                                  {/* The management % is the headline figure: the setup fee is the
                                      small print, not the other way round. */}
                                  <span className="hol-pkg-fee">
                                    {b.mgmtFee ? (
                                      <>
                                        <span className="hol-pkg-fee-main">{b.mgmtFee}<span className="hol-pkg-fee-unit">management fees</span></span>
                                        <span className="hol-pkg-fee-sub"><b>{b.setupFee}</b> set up fees</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="hol-pkg-fee-main">{b.setupFee}<span className="hol-pkg-fee-unit">set up fees</span></span>
                                        <span className="hol-pkg-fee-sub">No management fees</span>
                                      </>
                                    )}
                                  </span>
                                </span>
                                <span style={{ display: 'block', fontSize: 12.5, color: '#6b7280', marginTop: 3, lineHeight: 1.55 }}>{b.blurb}</span>
                              </span>
                            </label>
                            <button type="button" className="hol-readmore" onClick={() => setExpandedBundle(x => (x === b.id ? null : b.id))}>
                              {expanded ? 'Hide details ▲' : 'Read more, everything included ▼'}
                            </button>
                            {expanded && (
                              <div className="hol-pkg-details">
                                {b.groups.map(g => (
                                  <div key={g.heading}>
                                    <p className="hol-pkg-details-head">{g.heading}</p>
                                    <ul>
                                      {g.items.map(item => <li key={item}>{item}</li>)}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* One-time discount coupon — pops up inline under the
                                service the moment it is selected, so it clearly
                                belongs to that package (not a generic field at the
                                bottom of the list). */}
                            {on && (
                              <div className="hol-coupon">
                                <div className="hol-coupon-title">🎟️ Have a discount coupon for {b.label}?</div>
                                {coupon ? (
                                  <div className="hol-coupon-ok">
                                    <div>
                                      <b>{coupon.code}</b> applied — {coupon.bundleLabel} setup fee £{coupon.setupFee} − £{coupon.discount} = <b>£{coupon.finalFee}</b>
                                    </div>
                                    <button type="button" className="hol-coupon-remove" onClick={() => { setCoupon(null); setCouponMsg(''); }}>Remove</button>
                                  </div>
                                ) : (
                                  <div className="hol-coupon-row">
                                    <input
                                      className="hol-input hol-coupon-in"
                                      value={couponInput}
                                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponMsg(''); }}
                                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                                      placeholder="e.g. HOL-A7K2XM"
                                      autoCapitalize="characters"
                                      autoCorrect="off"
                                      spellCheck={false}
                                    />
                                    <button type="button" className="hol-submit hol-coupon-apply" onClick={applyCoupon} disabled={couponChecking}>
                                      {couponChecking ? 'Checking…' : 'Apply'}
                                    </button>
                                  </div>
                                )}
                                {couponMsg && <div className="hol-coupon-msg">{couponMsg}</div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {errors.selectedPackage && <p className="hol-err" style={{ marginTop: 10 }}>{errors.selectedPackage}</p>}

                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '14px 0 0' }}>
                      Not sure? See the full breakdown on our <Link href="/pricing" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'underline' }}>pricing page</Link> <span style={{ color: '#9ca3af' }}>(opens in a new tab, your answers stay saved here)</span>.
                    </p>
                  </div>
                )}

                {/* STEP 5, DOCUMENTS */}
                {step === 4 && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px' }}>
                      Do you already have any of the following documents? If so, you can upload them now, or provide them later.
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
                                    <a href={st.url} target="_blank" rel="noopener noreferrer" className="hol-view-link">View</a>
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
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '6px 0 0' }}>Optional, you can also send documents to us later.</p>
                              </div>
                            )}
                            {errors[`doc_${d.key}`] && <p className="hol-err" style={{ marginTop: 8 }}>{errors[`doc_${d.key}`]}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 6, AGREEMENT (merged in from the old sign-agreement flow) */}
                {step === AGREEMENT_STEP && (
                  <div>
                    {!bundle ? (
                      <p className="hol-err" style={{ fontSize: 13 }}>Please go back and choose a service first — your agreement is built from the package you select.</p>
                    ) : (
                      <>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
                          Please read your Residential Lettings &amp; Management Agreement carefully before you accept. You will sign it on the next step.
                        </p>

                        <div className="hol-agreement" role="document">
                          <div className="hol-ag-head">
                            <h3>Residential Lettings &amp; Management Agreement</h3>
                            <p>{effectiveIntro(template)}</p>
                          </div>

                          <div className="hol-parties">
                            <div>
                              <h4>Landlord</h4>
                              <p>{landlordDisplayName || '-'}</p>
                              {isCompany && form.companyNumber && <p>Co. No. {form.companyNumber}</p>}
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

                          <div className="hol-parties" style={{ gridTemplateColumns: '1fr' }}>
                            <div>
                              <h4>{properties.length > 1 ? 'Properties' : 'Property'}</h4>
                              {properties.map((p, i) => (
                                <p key={p.id}>
                                  {formatAddress(p) || '-'}
                                  {(p.propertyType || p.bedrooms || p.furnishing || p.currentRent) && (
                                    <> — {[p.propertyType, p.bedrooms && `${p.bedrooms} bed`, p.furnishing].filter(Boolean).join(' · ')}{p.currentRent ? ` · £${p.currentRent}/month` : ''}</>
                                  )}
                                </p>
                              ))}
                            </div>
                          </div>

                          {buildAgreementSections(bundle, template, coupon ? { code: coupon.code, discount: coupon.discount } : undefined).map(sec => (
                            <div key={sec.n} className="hol-clause">
                              <h4>{sec.n}. {sec.title}</h4>
                              {sec.paras?.map((p, i) => <p key={i}>{sec.n}.{i + 1} {p}</p>)}
                              {sec.groups?.map((g, gi) => (
                                <div key={gi} className="hol-svc-group">
                                  <div className="hol-svc-heading">{g.heading}</div>
                                  <ul>{g.items.map((it, ii) => <li key={ii}>{it}</li>)}</ul>
                                </div>
                              ))}
                            </div>
                          ))}

                          <p className="hol-ag-foot">
                            By signing, the Landlord(s) confirm they have read and accepted the terms of this Agreement
                            (including any schedules). The Agent is authorised to commence services immediately.
                          </p>
                        </div>

                        <div className="hol-declare">
                          <h4>Tax residency declaration</h4>
                          <p style={{ fontSize: 12.5, color: '#6b7280', margin: '0 0 6px' }}>Required under the HMRC Non-Resident Landlord Scheme.</p>
                          <label className="hol-radio-line">
                            <input type="radio" name="res" checked={form.residency === 'resident'} onChange={() => setField('residency', 'resident')} />
                            <span>I am a UK-resident landlord for tax purposes</span>
                          </label>
                          <label className="hol-radio-line">
                            <input type="radio" name="res" checked={form.residency === 'non-resident'} onChange={() => setField('residency', 'non-resident')} />
                            <span>I am a non-resident landlord (I live outside the UK)</span>
                          </label>
                          {errors.residency && <p className="hol-err" style={{ marginTop: 6 }}>{errors.residency}</p>}
                        </div>

                        <label className="hol-joint hol-accept">
                          <input type="checkbox" checked={form.termsAccepted} onChange={e => setField('termsAccepted', e.target.checked)} />
                          <span>
                            I have read and accept the terms of this Residential Lettings &amp; Management Agreement and the{' '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'underline' }}>website terms and conditions</a>.
                          </span>
                        </label>
                        {errors.termsAccepted && <p className="hol-err" style={{ marginTop: 8 }}>{errors.termsAccepted}</p>}
                      </>
                    )}
                  </div>
                )}

                {/* STEP 7, SIGN & CONFIRM */}
                {step === 6 && (
                  <div>
                    <div className="hol-summary">
                      <SummaryRow label="Owner type" value={isCompany ? 'Company / Ltd' : 'Individual owner'} />
                      {isCompany && (
                        <>
                          <SummaryRow label="Company name" value={form.companyName} />
                          <SummaryRow label="Company number" value={form.companyNumber} />
                          <SummaryRow label="Registered office" value={form.registeredAddress} />
                        </>
                      )}
                      {isCompany ? (
                        companyPeople.map((p, i) => (
                          <SummaryRow
                            key={p.id}
                            label={i === 0 ? 'Person 1 (main contact)' : `Person ${i + 1}`}
                            value={[p.name, p.role, p.share.trim() ? `${p.share}% share` : ''].filter(Boolean).join(' · ')}
                          />
                        ))
                      ) : (
                        <SummaryRow label="Name" value={[form.fullName, form.jointLandlord && form.landlord2Name ? `& ${form.landlord2Name}` : ''].filter(Boolean).join(' ')} />
                      )}
                      <SummaryRow label="Email" value={form.email} />
                      <SummaryRow label="Telephone" value={form.phone} />
                      <SummaryRow label="Contact address" value={form.contactAddress} />
                      <SummaryRow label={isCompany ? "Director's ID" : 'Landlord ID'} value={idDocs.landlordId.urls.length ? `${idDocs.landlordId.urls.length} file${idDocs.landlordId.urls.length > 1 ? 's' : ''} uploaded` : '-'} />
                      <SummaryRow label="Billing address document" value={idDocs.billingProof.urls.length ? `${idDocs.billingProof.urls.length} file${idDocs.billingProof.urls.length > 1 ? 's' : ''} uploaded` : '-'} />
                      <SummaryRow label="Proof of ownership" value={idDocs.ownershipProof.urls.length ? `${idDocs.ownershipProof.urls.length} file${idDocs.ownershipProof.urls.length > 1 ? 's' : ''} uploaded` : '-'} />
                      <SummaryRow label="Properties owned" value={form.propertyCount} />
                      {properties.map((p, i) => (
                        <div key={p.id} className="hol-summary-row">
                          <span className="hol-summary-label">{properties.length > 1 ? `Property ${i + 1}` : 'Property'}</span>
                          <span className="hol-summary-value">
                            {formatAddress(p) || '-'}
                            {propertyDetails(p) && <span style={{ display: 'block', fontWeight: 400, color: '#6b7280', fontSize: 12, marginTop: 2 }}>{propertyDetails(p)}</span>}
                          </span>
                        </div>
                      ))}
                      <SummaryRow label="Service" value={bundle?.label || form.selectedPackage} />
                      {coupon && <SummaryRow label="Coupon" value={`${coupon.code} — £${coupon.discount} off (setup fee £${coupon.finalFee})`} />}
                      <SummaryRow label="Residency" value={form.residency === 'non-resident' ? 'Non-resident landlord' : form.residency === 'resident' ? 'UK-resident landlord' : '-'} />
                      <SummaryRow label="EPC" value={docSummary(docs.epc)} />
                      <SummaryRow label="Electrical (EICR)" value={docSummary(docs.electrical)} />
                      <SummaryRow label="Gas Safety" value={docSummary(docs.gas)} />
                    </div>

                    <div className="hol-field hol-field--full" style={{ marginTop: 20 }}>
                      <label className="hol-label">Additional Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <textarea className="hol-input hol-textarea" rows={3} placeholder="Anything else we should know..." value={form.notes} onChange={set('notes')} />
                    </div>

                    {/* ── Signatures (merged in from the old sign-agreement flow) ── */}
                    <div className="hol-sign-block">
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f1f3d', margin: '0 0 6px' }}>Sign your agreement</h3>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>
                        Add {!isCompany && form.jointLandlord ? 'both signatures' : 'your signature'} for the <strong>{bundle?.label || 'selected'}</strong> agreement.
                        Draw with a finger or mouse, or upload a photo of the signature.
                      </p>

                      {/* Landlord 1 */}
                      {!isCompany && form.jointLandlord && <div className="hol-sig-legend">Landlord 1{form.fullName ? ` — ${form.fullName}` : ''}</div>}
                      <SignaturePad onChange={setSignatureData} />
                      <div className="hol-or">or</div>
                      <div>
                        <button type="button" className="hol-upload" style={{ width: '100%' }} onClick={() => fileRef.current?.click()} disabled={uploadingSig}>
                          {uploadingSig ? 'Reading…' : '⬆ Upload an image of your signature'}
                        </button>
                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
                          onChange={e => { const f = e.target.files?.[0]; if (f) onUploadSignature(f, 1); e.target.value = ''; }} />
                      </div>
                      {signatureData && (
                        <div className="hol-sig-preview">
                          <span className="hol-sig-ok">✓ Signature captured</span>
                          <img src={signatureData} alt="Your signature" />
                        </div>
                      )}
                      {errors.signature && <p className="hol-err" style={{ marginTop: 8 }}>{errors.signature}</p>}
                      <div className="hol-form-grid" style={{ marginTop: 16 }}>
                        <div className="hol-field">
                          <label className="hol-label">Type your full name to confirm<span className="hol-req">*</span></label>
                          <input type="text" className={`hol-input${errors.signatureName ? ' hol-input--error' : ''}`} placeholder="Full legal name" value={form.signatureName} onChange={set('signatureName')} autoComplete="off" />
                          {errors.signatureName && <p className="hol-err">{errors.signatureName}</p>}
                        </div>
                        <div className="hol-field">
                          <label className="hol-label">Date</label>
                          <input type="date" className="hol-input" style={{ colorScheme: 'light' }} value={form.signatureDate} onChange={set('signatureDate')} />
                        </div>
                      </div>

                      {/* The second (joint) landlord signs their own copy via a
                          secure emailed link after this registration — no second
                          signature is captured on this device. */}
                      {!isCompany && form.jointLandlord && (
                        <div className="hol-sig2-note">
                          ✉️ After you submit, <strong>{form.landlord2Name || 'the second landlord'}</strong> will be emailed a secure link
                          at <strong>{form.landlord2Email || 'their email'}</strong> to add their own ID, documents and signature.
                        </div>
                      )}

                      <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, marginTop: 14 }}>
                        An electronic signature is legally binding under the Electronic Communications Act 2000. A signed PDF
                        copy will be emailed to you and to House of Lettings.
                      </p>
                    </div>

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
                        <><svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Signing…</>
                      ) : (
                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Sign &amp; Complete Registration</>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="hol-summary-row">
      <span className="hol-summary-label">{label}</span>
      <span className="hol-summary-value">{value || '-'}</span>
    </div>
  );
}

// One property block in the step-3 list. Kept as its own component so the
// PostcodeLookup callbacks stay stable per-property (id-bound) and the Google
// autocomplete doesn't re-bind on every keystroke.
// An optional multi-file upload for one property (photos, floor plan). Upload
// progress is local state: only the finished URLs go back to the property, so a
// saved draft never restores a half-finished upload.
function PropertyFileField({
  label, hint, emptyCta, addCta, accept, max, urls, fileNames, onAdd, onRemove,
}: {
  label: string;
  hint: string;
  emptyCta: string;
  addCta: string;
  accept: string;
  max: number;
  urls: string[];
  fileNames: string[];
  onAdd: (urls: string[], names: string[]) => void;
  onRemove: (index: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const full = urls.length >= max;

  const handle = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files).slice(0, Math.max(0, max - urls.length));
    if (picked.length === 0) return;
    setUploading(true);
    setError('');
    const addedUrls: string[] = [];
    const addedNames: string[] = [];
    try {
      for (const file of picked) {
        // Property photos & floor plans → their own library, kept apart from
        // the landlord's sensitive documents.
        addedUrls.push(await uploadToCloudinary(file, CLOUDINARY_FOLDERS.landlordProperties));
        addedNames.push(file.name);
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      // Keep whatever did upload before the failure.
      if (addedUrls.length) onAdd(addedUrls, addedNames);
      setUploading(false);
    }
  };

  return (
    <div className="hol-field hol-field--full">
      <label className="hol-label">{label} <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
      {urls.map((url, i) => (
        <div key={i} className="hol-uploaded" style={{ marginBottom: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileNames[i] || 'Uploaded'}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="hol-view-link">View</a>
          <button type="button" onClick={() => onRemove(i)} className="hol-remove">Remove</button>
        </div>
      ))}
      {!full && (
        <label className={`hol-upload${uploading ? ' is-loading' : ''}`}>
          <input type="file" multiple accept={accept} onChange={(e) => { handle(e.target.files); e.currentTarget.value = ''; }} disabled={uploading} />
          {uploading ? (
            <><svg className="hol-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Uploading…</>
          ) : urls.length > 0 ? (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> {addCta}{` (up to ${max})`}</>
          ) : (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg> {emptyCta}</>
          )}
        </label>
      )}
      {error && <p className="hol-err">{error}</p>}
      <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{hint}</p>
    </div>
  );
}

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

  const addPhotos = useCallback((urls: string[], names: string[]) => {
    onUpdate(property.id, { photoUrls: [...property.photoUrls, ...urls], photoNames: [...property.photoNames, ...names] });
  }, [property.id, property.photoUrls, property.photoNames, onUpdate]);
  const removePhoto = useCallback((i: number) => {
    onUpdate(property.id, { photoUrls: property.photoUrls.filter((_, n) => n !== i), photoNames: property.photoNames.filter((_, n) => n !== i) });
  }, [property.id, property.photoUrls, property.photoNames, onUpdate]);
  const addFloorPlans = useCallback((urls: string[], names: string[]) => {
    onUpdate(property.id, { floorPlanUrls: [...property.floorPlanUrls, ...urls], floorPlanNames: [...property.floorPlanNames, ...names] });
  }, [property.id, property.floorPlanUrls, property.floorPlanNames, onUpdate]);
  const removeFloorPlan = useCallback((i: number) => {
    onUpdate(property.id, { floorPlanUrls: property.floorPlanUrls.filter((_, n) => n !== i), floorPlanNames: property.floorPlanNames.filter((_, n) => n !== i) });
  }, [property.id, property.floorPlanUrls, property.floorPlanNames, onUpdate]);

  return (
    <div className="hol-prop-card">
      {total > 1 && (
        <div className="hol-prop-head">
          <span className="hol-prop-badge">Property {index + 1}{property.street ? `: ${property.street}` : ''}</span>
          <button
            type="button"
            className="hol-prop-remove"
            onClick={() => {
              // Guard against removing the wrong card: if this property has
              // details filled in, ask before deleting them.
              const filled = [property.postcode, property.street, property.propertyType, property.bedrooms].some(Boolean);
              const name = property.street || `Property ${index + 1}`;
              if (!filled || window.confirm(`Remove ${name}?\n\nOnly this property and its details will be deleted. Your other properties are kept.`)) {
                onRemove(property.id);
              }
            }}
          >Remove this property</button>
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

        {/* Force the date into the left column regardless of how many optional fields precede it. */}
        <div className="hol-field" style={{ gridColumn: '1 / 2' }}>
          <label className="hol-label">Available From <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="date" className="hol-input" style={{ colorScheme: 'light' }} value={property.availableFrom} onChange={upd('availableFrom')} />
        </div>
        <div className="hol-field hol-field--full">
          <label className="hol-label">Security Code / Access Note <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" className="hol-input" placeholder="e.g. key-safe code, alarm code or access instructions" value={property.securityNote} onChange={upd('securityNote')} autoComplete="off" />
        </div>

        <PropertyFileField
          label="Photos of the property"
          hint="If you have photos to hand, add them now. It gives us a head start on your valuation and listing. If not, no problem, our photographer can take them later."
          emptyCta="Upload property photos"
          addCta="Add another photo"
          accept=".jpg,.jpeg,.png,.webp,.heic"
          max={PROPERTY_PHOTO_MAX}
          urls={property.photoUrls}
          fileNames={property.photoNames}
          onAdd={addPhotos}
          onRemove={removePhoto}
        />
        <PropertyFileField
          label="Floor plan"
          hint="An existing floor plan, if you have one. A photo, PDF or scan is fine."
          emptyCta="Upload floor plan"
          addCta="Add another floor plan"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          max={FLOOR_PLAN_MAX}
          urls={property.floorPlanUrls}
          fileNames={property.floorPlanNames}
          onAdd={addFloorPlans}
          onRemove={removeFloorPlan}
        />
      </div>
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
  .hol-prop-badge{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--logo-blue);background:#eef4ff;padding:4px 10px;border-radius:20px;}
  .hol-prop-remove{background:none;border:none;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;padding:0;}
  .hol-prop-remove:hover{text-decoration:underline;}
  .hol-add-property{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:11px 18px;border:1.5px dashed #b9c9e6;border-radius:10px;background:#f5f9ff;color:var(--logo-blue);font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .hol-add-property:hover{border-color:#2563a8;background:#eaf2ff;}
  .hol-occupied{border:1px solid #dbe6fb;background:#f5f9ff;border-radius:10px;padding:14px 16px;}
  .hol-occupied-head{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--logo-blue);margin-bottom:12px;}

  .hol-pkg-list{display:flex;flex-direction:column;gap:10px;}
  .hol-pkg{border:1.5px solid #e5e7eb;border-radius:12px;padding:14px 16px;transition:border-color .15s,background .15s;background:#fff;}
  .hol-pkg:hover{border-color:#bcd0ee;}
  .hol-pkg--on{border-color:#2563a8;background:#f5f9ff;}
  .hol-pkg-main{display:flex;align-items:flex-start;gap:12px;cursor:pointer;}
  .hol-pkg-fee{display:flex;flex-direction:column;align-items:flex-end;gap:1px;white-space:nowrap;text-align:right;}
  .hol-pkg-fee-main{font-weight:800;font-size:22px;line-height:1.1;color:var(--price-green);letter-spacing:-.01em;}
  .hol-pkg-fee-unit{font-size:11px;font-weight:600;color:#6b7280;margin-left:3px;}
  .hol-pkg-fee-sub{font-size:11px;font-weight:500;color:#6b7280;}
  .hol-pkg-fee-sub b{font-weight:800;color:var(--price-green-ink);}
  @media(max-width:480px){ .hol-pkg-fee-main{font-size:19px;} .hol-pkg-fee-unit,.hol-pkg-fee-sub{font-size:10.5px;} }
  .hol-readmore{background:none;border:none;padding:0;margin:10px 0 0 32px;font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:var(--logo-blue);cursor:pointer;}
  .hol-readmore:hover{text-decoration:underline;}
  .hol-pkg-details{margin:10px 0 2px 32px;border-top:1px dashed #dbe3f0;padding-top:4px;}
  .hol-pkg-details-head{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#1a3c5e;margin:10px 0 4px;}
  .hol-pkg-details ul{margin:0;padding-left:18px;}
  .hol-pkg-details li{font-size:12.5px;color:#4b5563;line-height:1.75;}
  .hol-upload--error{border-color:#e53e3e;}

  .hol-owner-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  @media(max-width:540px){ .hol-owner-grid{grid-template-columns:1fr;} }
  .hol-owner-card{text-align:left;background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:20px 18px;cursor:pointer;font-family:'Poppins',sans-serif;transition:border-color .15s,background .15s,box-shadow .15s;}
  .hol-owner-card:hover{border-color:#bcd0ee;}
  .hol-owner-card--on{border-color:#2563a8;background:#f5f9ff;box-shadow:0 0 0 3px rgba(37,99,168,.12);}
  .hol-owner-icon{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:#eef4ff;color:var(--logo-blue);margin-bottom:12px;}
  .hol-owner-card--on .hol-owner-icon{background:#2563a8;color:#fff;}

  .hol-terms-note{margin:22px 0 0;padding:14px 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafbff;font-size:12.5px;color:#6b7280;line-height:1.65;}
  .hol-pkg input,.hol-terms-accept input,.hol-upload input{position:absolute;opacity:0;width:0;height:0;}
  .hol-radio{flex-shrink:0;width:20px;height:20px;border-radius:50%;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;margin-top:2px;background:#fff;transition:all .15s;}
  .hol-pkg--on .hol-radio{border-color:#2563a8;}
  .hol-radio-dot{width:10px;height:10px;border-radius:50%;background:#2563a8;}
  .hol-pkg-badge{display:inline-block;margin-left:8px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--logo-blue);background:#e8f0ff;padding:2px 7px;border-radius:20px;vertical-align:middle;}

  .hol-doc{border:1.5px solid #e5e7eb;border-radius:12px;padding:16px 18px;background:#fff;}
  .hol-doc--error{border-color:#f7b6b6;}
  .hol-yesno{display:flex;gap:10px;flex-wrap:wrap;}
  .hol-yesno-btn{flex:1;min-width:140px;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:9px;background:#fff;color:#374151;font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .hol-yesno-btn:hover{border-color:#bcd0ee;}
  .hol-yesno-btn.on{border-color:#2563a8;background:#2563a8;color:#fff;}
  .hol-upload{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border:1.5px dashed #cbd5e1;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;color:var(--logo-blue);background:#f8fafc;transition:all .15s;font-family:'Poppins',sans-serif;box-sizing:border-box;}
  .hol-upload:hover{border-color:#2563a8;background:#f0f6ff;}
  .hol-upload.is-loading{cursor:wait;color:#6b7280;}
  .hol-uploaded{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:9px;font-size:13px;color:#166534;font-weight:600;}
  .hol-view-link{color:var(--logo-blue);font-size:12px;font-weight:600;text-decoration:none;}
  .hol-remove{background:none;border:none;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer;padding:0;}

  .hol-summary{border:1px solid #eef0f5;border-radius:12px;overflow:hidden;}
  .hol-summary-row{display:flex;justify-content:space-between;gap:16px;padding:11px 16px;font-size:13.5px;border-bottom:1px solid #f1f3f7;}
  .hol-summary-row:last-child{border-bottom:none;}
  .hol-summary-label{color:#6b7280;font-weight:500;flex-shrink:0;}
  .hol-summary-value{color:#111827;font-weight:600;text-align:right;}

  .hol-wizard-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:28px;padding-top:22px;border-top:1px solid #f1f3f7;}
  /* Back / Continue are a pair: both carry the site-standard CTA size so they
     measure identically side by side (as components/layout/ServiceHero .btn). */
  .hol-btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:9px;box-sizing:border-box;min-height:48px;line-height:1.2;background:none;border:1.5px solid #e5e7eb;border-radius:9px;padding:14px 28px;font-family:'Poppins',sans-serif;font-size:13.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;color:#374151;cursor:pointer;transition:all .15s;}
  .hol-btn-ghost:hover:not(:disabled){border-color:#cbd5e1;background:#f9fafb;}
  .hol-submit{display:inline-flex;align-items:center;justify-content:center;gap:9px;box-sizing:border-box;min-height:48px;line-height:1.2;background:linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%);color:#fff;border:1.5px solid transparent;border-radius:9px;font-family:'Poppins',sans-serif;font-size:13.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:14px 28px;cursor:pointer;transition:opacity .15s,transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(37,99,168,.35);white-space:nowrap;margin-left:auto;}
  .hol-submit:hover:not(:disabled){opacity:.92;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,168,.45);}
  .hol-submit:disabled{opacity:.7;cursor:not-allowed;}
  .hol-spinner{animation:hol-spin .8s linear infinite;}
  @keyframes hol-spin{to{transform:rotate(360deg);}}
  @keyframes hol-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}

  /* ── Agreement + signature (merged in from /landlord-agreement) ── */
  .hol-joint{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#374151;line-height:1.5;cursor:pointer;font-family:'Poppins',sans-serif;}
  .hol-joint input{margin-top:3px;width:17px;height:17px;flex-shrink:0;accent-color:#2563a8;}
  .hol-joint-box{border:1.5px solid #dbe6fb;background:#f6f9ff;border-radius:14px;padding:20px 22px;margin-top:4px;}
  .hol-joint-box__head{margin-bottom:16px;}
  .hol-joint-box__title{display:block;font-size:15px;font-weight:800;color:#0a162f;font-family:'Poppins',sans-serif;}
  .hol-joint-box__note{display:block;font-size:12.5px;color:#5b6b82;line-height:1.55;margin-top:5px;}
  .hol-joint-box__grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .hol-joint-box__grid .hol-field--full,.hol-joint-box__grid>.hol-field:first-child{grid-column:1/-1;}
  @media(max-width:640px){.hol-joint-box__grid{grid-template-columns:1fr;}}
  .hol-sig2-note{margin-top:22px;padding:14px 16px;background:#eef5ff;border:1px solid #d3e3fb;border-radius:10px;font-size:13px;color:#28527a;line-height:1.55;}
  .hol-agreement{border:1px solid #e5e7eb;border-radius:12px;background:#fafbfc;padding:22px;max-height:440px;overflow-y:auto;}
  .hol-ag-head h3{font-size:17px;font-weight:800;margin:0 0 8px;color:#0a162f;}
  .hol-ag-head p{font-size:12.5px;line-height:1.6;color:#4b5563;margin:0 0 14px;}
  .hol-parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#fff;border:1px solid #eef1f5;border-radius:8px;padding:14px;margin-bottom:14px;}
  .hol-parties h4{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#2563a8;margin:0 0 6px;}
  .hol-parties p{font-size:12.5px;color:#374151;margin:0 0 3px;line-height:1.45;}
  .hol-clause{margin-bottom:14px;}
  .hol-clause h4{font-size:14px;font-weight:800;color:#0a162f;margin:0 0 6px;}
  .hol-clause p{font-size:12.5px;line-height:1.6;color:#4b5563;margin:0 0 6px;}
  .hol-svc-group{margin:8px 0;}
  .hol-svc-heading{font-size:12.5px;font-weight:700;color:#16a34a;margin-bottom:4px;}
  .hol-svc-group ul{margin:0;padding-left:18px;}
  .hol-svc-group li{font-size:12.5px;line-height:1.55;color:#374151;margin-bottom:2px;}
  .hol-ag-foot{font-size:12.5px;line-height:1.6;color:#0a162f;font-weight:600;margin:10px 0 0;}
  .hol-declare{margin-top:20px;padding:16px 18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;}
  .hol-declare h4{font-size:15px;font-weight:700;margin:0 0 4px;color:#0a162f;font-family:'Poppins',sans-serif;}
  .hol-radio-line{display:flex;gap:10px;align-items:center;font-size:14px;color:#374151;padding:9px 0;cursor:pointer;font-family:'Poppins',sans-serif;}
  .hol-radio-line input{width:17px;height:17px;accent-color:#2563a8;}
  .hol-accept{margin-top:18px;padding:14px 16px;background:#f5f9ff;border:1px solid #dbe6fb;border-radius:10px;}
  .hol-coupon{margin-top:20px;padding:16px 18px;background:#fdfaf3;border:1px dashed #e5d9b8;border-radius:12px;}
  .hol-coupon-title{font-size:13.5px;font-weight:700;color:#0a162f;margin-bottom:10px;}
  .hol-coupon-row{display:flex;gap:10px;}
  .hol-coupon-in{max-width:240px;font-family:monospace;letter-spacing:.05em;text-transform:uppercase;}
  .hol-coupon-apply{padding:11px 22px;min-height:0;margin-left:0;}
  .hol-coupon-ok{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;font-size:13.5px;padding:11px 14px;border-radius:9px;}
  .hol-coupon-remove{background:none;border:none;color:#dc2626;font-size:12.5px;font-weight:700;cursor:pointer;padding:0;}
  .hol-coupon-msg{margin-top:9px;font-size:13px;font-weight:600;color:#b45309;}
  .hol-sign-block{margin-top:26px;padding-top:22px;border-top:1px solid #f1f3f7;}
  .hol-or{text-align:center;color:#9ca3af;font-size:13px;font-weight:600;margin:14px 0;font-family:'Poppins',sans-serif;}
  .hol-sig-legend{font-size:13px;font-weight:800;color:#2563a8;margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em;font-family:'Poppins',sans-serif;}
  .hol-sig2{margin-top:26px;padding-top:22px;border-top:2px dashed #dbe6fb;}
  .hol-sig-preview{margin-top:16px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;}
  .hol-sig-ok{color:#16a34a;font-weight:700;font-size:13px;font-family:'Poppins',sans-serif;}
  .hol-sig-preview img{max-height:110px;max-width:100%;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:6px;}

  @media(max-width:600px){
    .hol-form-grid{grid-template-columns:1fr;gap:14px;}
    /* iOS Safari auto-zooms into any input under 16px, keep fields at 16px
       on phones so the page never zooms and each step stays full-width. */
    .hol-input{font-size:16px;}
    .hol-parties{grid-template-columns:1fr;}
    .hol-agreement{max-height:360px;padding:16px 14px;}
    .hol-coupon-row{flex-direction:column;}
    .hol-coupon-in{max-width:none;}
    .hol-coupon-apply{width:100%;}
  }
`;
