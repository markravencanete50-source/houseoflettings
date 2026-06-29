'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import Navbar from '@/components/layout/Navbar';

/* ── shared styles (matched to the tenant-application form) ── */
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8,
  color: '#111827', fontSize: 15, padding: '13px 16px', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const sectionHeadingStyle: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' };
const sectionSubStyle: React.CSSProperties = { fontSize: 13, color: '#6b7280', marginBottom: 20 };
const dividerStyle: React.CSSProperties = { border: 'none', borderTop: '1.5px solid #e5e7eb', margin: '32px 0' };

/* ── direct-to-Cloudinary upload (bypasses Vercel's ~4.5MB limit) ── */
async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'houseoflettings/guarantor' }),
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

/* ── postcode autocomplete (Google Places) — fills street + postcode ── */
type AddressResult = { street: string; postcode: string };
function usePostcodeAutocomplete(onSelect: (data: AddressResult) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let ac: any = null, listener: any = null;
    function initAutocomplete() {
      if (!inputRef.current || !(window as any).google?.maps?.places) return;
      ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'], componentRestrictions: { country: 'gb' }, fields: ['address_components'],
      });
      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place?.address_components) return;
        let postcode = '', streetNumber = '', route = '';
        place.address_components.forEach((c: any) => {
          if (c.types.includes('street_number')) streetNumber = c.long_name;
          if (c.types.includes('route')) route = c.long_name;
          if (c.types.includes('postal_code')) postcode = c.long_name;
        });
        onSelect({ street: [streetNumber, route].filter(Boolean).join(' '), postcode });
      });
    }
    if ((window as any).google?.maps?.places) initAutocomplete();
    else {
      const iv = setInterval(() => { if ((window as any).google?.maps?.places) { clearInterval(iv); initAutocomplete(); } }, 300);
      return () => clearInterval(iv);
    }
    return () => { if (listener) (window as any).google?.maps?.event.removeListener(listener); };
  }, [onSelect]);
  return inputRef;
}

/* ── file upload field (multi-file, direct to Cloudinary) ── */
type UploadState = { files: File[]; uploading: boolean; urls: string[]; error: string };
const emptyUpload = (): UploadState => ({ files: [], uploading: false, urls: [], error: '' });

function FileUpload({
  label, hint, required, maxFiles = 6, state, onChange,
}: { label: string; hint?: string; required?: boolean; maxFiles?: number; state: UploadState; onChange: (s: UploadState) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, maxFiles);
    onChange({ ...state, files: arr, uploading: true, error: '' });
    const urls: string[] = [];
    try {
      for (const file of arr) urls.push(await uploadToCloudinary(file));
      onChange({ files: arr, uploading: false, urls, error: '' });
    } catch (e: any) {
      onChange({ files: arr, uploading: false, urls: [], error: e.message || 'Upload failed. Please try again.' });
    }
  };
  const done = state.urls.length > 0;
  return (
    <div>
      <label style={labelStyle}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{
          border: '2px dashed #d1d5db', borderRadius: 10, padding: '18px 16px', textAlign: 'center', cursor: 'pointer',
          background: done ? '#f0fdf4' : '#f9fafb', borderColor: done ? '#86efac' : state.error ? '#fca5a5' : '#d1d5db', transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple={maxFiles > 1} style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        {state.uploading ? (
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>⏳ Uploading…</p>
        ) : done ? (
          <div>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>✅ {state.urls.length} file{state.urls.length > 1 ? 's' : ''} uploaded</p>
            {state.files.map((f, i) => (<p key={i} style={{ color: '#6b7280', fontSize: 12, margin: '2px 0' }}>{f.name}</p>))}
            <p style={{ color: '#2563eb', fontSize: 12, marginTop: 4 }}>Tap to replace</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📎</div>
            <p style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Tap to upload or drag &amp; drop</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>{hint}</p>
          </div>
        )}
      </div>
      {state.error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{state.error}</p>}
    </div>
  );
}

/* ── PDF generation ── */
function generateGuarantorPdf(d: Record<string, any>): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40; let y = 0;
  const navy = '#0a1628', blue = '#2563eb', gray = '#6b7280', dark = '#111827', lineGray = '#eef0f5';

  doc.setFillColor(navy); doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setTextColor('#ffffff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Guarantor Form', margin, 34);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#cbd5e1');
  doc.text(`${d.propertyAddress || ''}`, margin, 52);
  doc.text(`Submitted: ${new Date().toLocaleString('en-GB')}`, margin, 66);
  y = 105;

  const sectionTitle = (t: string) => {
    if (y > 760) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(blue);
    doc.text(t.toUpperCase(), margin, y); y += 6;
    doc.setDrawColor(blue); doc.setLineWidth(1); doc.line(margin, y, pageWidth - margin, y); y += 16;
  };
  const row = (label: string, value?: string) => {
    if (y > 770) { doc.addPage(); y = 40; }
    const val = value && value.toString().trim() ? value.toString() : '—';
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(gray); doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(dark);
    const valLines = doc.splitTextToSize(val, pageWidth - margin * 2 - 175);
    doc.text(valLines, margin + 185, y);
    const lineH = Math.max(14, valLines.length * 12);
    doc.setDrawColor(lineGray); doc.setLineWidth(0.5); doc.line(margin, y + lineH - 8, pageWidth - margin, y + lineH - 8);
    y += lineH;
  };
  const fileLinks = (label: string, urls?: string[]) => {
    if (!urls || urls.length === 0) { row(label, 'None provided'); return; }
    if (y > 770) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(gray); doc.text(label, margin, y);
    urls.forEach((url, i) => { doc.setFont('helvetica', 'normal'); doc.setTextColor(blue); doc.textWithLink(`File ${i + 1}`, margin + 185 + i * 50, y, { url }); });
    doc.setDrawColor(lineGray); doc.setLineWidth(0.5); doc.line(margin, y + 6, pageWidth - margin, y + 6); y += 18;
  };

  sectionTitle('Proposed Let');
  row('Property Address', d.propertyAddress);
  row('Rent', d.rent); row('Deposit', d.deposit);
  row('Parking Included in Rent', d.parkingIncluded);
  row('Tenancy Start Date', d.tenancyStart);
  row('Initial Lease Term', d.leaseTerm ? d.leaseTerm + ' months' : '');

  y += 6; sectionTitle('Guarantor Details');
  row('Title', d.guarantorTitle); row('Full Name', d.guarantorFullName);
  row('Date of Birth', d.guarantorDob); row('Address', d.guarantorAddress);
  row('Postcode', d.guarantorPostcode); row('CCJ?', d.hasCCJ);
  row('Mobile', d.guarantorMobile); row('Email', d.guarantorEmail);
  row('Time at Address', d.timeAtAddress); row('Previous Address', d.previousAddress);

  y += 6; sectionTitle('Current Landlord / Letting Agent');
  row('Title', d.landlordTitle); row('Full Name', d.landlordName);
  row('Address', d.landlordAddress); row('Postcode', d.landlordPostcode);
  row('Mobile', d.landlordMobile); row('Email', d.landlordEmail);

  y += 6; sectionTitle('Employer');
  row('Company', d.employerCompany); row('Contact Name', d.employerContactName);
  row('Address', d.employerAddress); row('Postcode', d.employerPostcode);
  row('Annual Gross Salary', d.annualSalary); row('Position', d.jobPosition);
  row('Contract Type', d.contractType);

  y += 6; sectionTitle('Documents');
  fileLinks('Identity Document', d.idDocUrls);
  fileLinks('Payslips (x3)', d.payslipUrls);
  fileLinks('Proof of Address', d.proofOfAddressUrls);
  fileLinks('Bank Statements (x3)', d.bankStatementUrls);
  fileLinks('Student Enrolment', d.studentDocUrls);

  y += 6; sectionTitle('Consent & Declaration');
  row('Communications Consent', d.consentComms);
  row('Declaration Agreed', d.consentDeclare);
  row('Submission Date', d.submissionDate);

  return doc.output('datauristring').split(',')[1];
}

/* ── page ── */
const F = {
  propertyPostcode: '', propertyAddressLine: '', rent: '', deposit: '', parkingIncluded: '', tenancyStart: '', leaseTerm: '',
  guarantorTitle: '', guarantorFullName: '', guarantorDob: '', guarantorAddressLine: '', guarantorPostcode: '',
  hasCCJ: '', guarantorMobile: '', guarantorEmail: '', timeAtAddress: '', previousAddress: '',
  landlordTitle: '', landlordName: '', landlordAddress: '', landlordPostcode: '', landlordMobile: '', landlordEmail: '',
  employerCompany: '', employerContactName: '', employerAddress: '', employerPostcode: '', annualSalary: '', jobPosition: '', contractType: '',
  submissionDate: '',
};

export default function GuarantorPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...F });
  const set = (k: keyof typeof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(s => ({ ...s, [k]: e.target.value }));

  const [consentComms, setConsentComms] = useState(false);
  const [consentDeclare, setConsentDeclare] = useState(false);

  const [idDoc, setIdDoc] = useState<UploadState>(emptyUpload());
  const [payslips, setPayslips] = useState<UploadState>(emptyUpload());
  const [proofOfAddress, setProofOfAddress] = useState<UploadState>(emptyUpload());
  const [bankStatements, setBankStatements] = useState<UploadState>(emptyUpload());
  const [studentDoc, setStudentDoc] = useState<UploadState>(emptyUpload());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;
    if ((window as any).google?.maps?.places) return;
    if (document.querySelector('script[data-hol-gmaps]')) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true; script.defer = true;
    (script as any).dataset.holGmaps = '1';
    document.head.appendChild(script);
  }, []);

  const onPropertySelect = useCallback((d: AddressResult) => {
    setForm(s => ({ ...s, propertyPostcode: d.postcode || s.propertyPostcode, propertyAddressLine: d.street || s.propertyAddressLine }));
  }, []);
  const onGuarantorSelect = useCallback((d: AddressResult) => {
    setForm(s => ({ ...s, guarantorPostcode: d.postcode || s.guarantorPostcode, guarantorAddressLine: d.street || s.guarantorAddressLine }));
  }, []);
  const propertyRef = usePostcodeAutocomplete(onPropertySelect);
  const guarantorRef = usePostcodeAutocomplete(onGuarantorSelect);

  const anyUploading = idDoc.uploading || payslips.uploading || proofOfAddress.uploading || bankStatements.uploading || studentDoc.uploading;

  const validate = (): string | null => {
    if (!form.propertyAddressLine.trim() && !form.propertyPostcode.trim()) return 'Property address is required.';
    if (!form.guarantorFullName.trim()) return "Guarantor's full name is required.";
    if (!form.guarantorEmail.trim()) return "Guarantor's email is required.";
    if (!form.guarantorMobile.trim()) return "Guarantor's mobile number is required.";
    if (!form.guarantorAddressLine.trim() && !form.guarantorPostcode.trim()) return "Guarantor's address is required.";
    if (idDoc.urls.length === 0) return 'Please upload a valid identity document.';
    if (payslips.urls.length === 0) return 'Please upload your payslips / proof of income.';
    if (proofOfAddress.urls.length === 0) return 'Please upload a proof of address.';
    if (bankStatements.urls.length === 0) return 'Please upload your bank statements.';
    if (!consentComms) return 'Please give your communications consent.';
    if (!consentDeclare) return 'Please confirm the declaration.';
    if (!form.submissionDate) return 'Please add the submission date.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (anyUploading) { setError('Please wait for your documents to finish uploading.'); return; }
    setSubmitting(true); setError('');
    try {
      const propertyAddress = [form.propertyAddressLine, form.propertyPostcode].filter(Boolean).join(', ');
      const guarantorAddress = [form.guarantorAddressLine, form.guarantorPostcode].filter(Boolean).join(', ');
      const payload = {
        propertyAddress,
        rent: form.rent ? `£${form.rent}` : '', deposit: form.deposit ? `£${form.deposit}` : '',
        parkingIncluded: form.parkingIncluded, tenancyStart: form.tenancyStart, leaseTerm: form.leaseTerm,
        guarantorTitle: form.guarantorTitle, guarantorFullName: form.guarantorFullName, guarantorDob: form.guarantorDob,
        guarantorAddress, guarantorPostcode: form.guarantorPostcode, hasCCJ: form.hasCCJ,
        guarantorMobile: form.guarantorMobile, guarantorEmail: form.guarantorEmail,
        timeAtAddress: form.timeAtAddress, previousAddress: form.previousAddress,
        landlordTitle: form.landlordTitle, landlordName: form.landlordName, landlordAddress: form.landlordAddress,
        landlordPostcode: form.landlordPostcode, landlordMobile: form.landlordMobile, landlordEmail: form.landlordEmail,
        employerCompany: form.employerCompany, employerContactName: form.employerContactName, employerAddress: form.employerAddress,
        employerPostcode: form.employerPostcode, annualSalary: form.annualSalary ? `£${form.annualSalary}` : '',
        jobPosition: form.jobPosition, contractType: form.contractType,
        idDocUrls: idDoc.urls, payslipUrls: payslips.urls, proofOfAddressUrls: proofOfAddress.urls,
        bankStatementUrls: bankStatements.urls, studentDocUrls: studentDoc.urls,
        consentComms: consentComms ? 'Yes' : 'No', consentDeclare: consentDeclare ? 'Yes' : 'No',
        submissionDate: form.submissionDate,
      };
      const pdfBase64 = generateGuarantorPdf(payload);
      const res = await fetch('/api/guarantor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, pdfBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const radio = (name: keyof typeof F, opts: string[]) => (
    <div className="g-radio-group">
      {opts.map(opt => (
        <label key={opt} className="g-radio-label">
          <input type="radio" name={name} value={opt} checked={form[name] === opt} onChange={() => setForm(s => ({ ...s, [name]: opt }))} />
          {opt}
        </label>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 'calc(72px + 40px) 16px 60px', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '40px 24px' : '60px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🛡️</div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Guarantor Form Submitted</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Thank you, <strong>{form.guarantorFullName}</strong>. We&apos;ve received your guarantor form. Our team will review it as part of the tenancy application.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>
              A confirmation email with a PDF copy has been sent to <strong>{form.guarantorEmail}</strong>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        input:focus, select:focus, textarea:focus { border-color: #2563eb !important; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .pac-container { z-index: 100000 !important; }
        .g-radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .g-radio-label { display: flex; align-items: center; gap: 8px; border: 1.5px solid #d1d5db; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; background: #fff; transition: all 0.2s; flex: 1 1 auto; min-width: 80px; justify-content: center; }
        .g-radio-label:has(input:checked) { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
        .g-radio-label input { accent-color: #2563eb; }
        .g-check { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 14px; color: #374151; line-height: 1.6; }
        .g-check input { accent-color: #2563eb; margin-top: 3px; flex-shrink: 0; }
        @media (max-width: 600px) { .g-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <Navbar />

      <section style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)', paddingTop: 'calc(72px + 40px)', paddingBottom: 40, textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.5)', borderRadius: 999, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Guarantor Form
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Guarantor Application
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
            Thank you for agreeing to act as a guarantor. Please complete this form accurately and in full. Providing false or unverifiable information may result in the application being declined.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 16px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>⚠️ {error}</div>
          )}

          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: isMobile ? '24px 16px' : '40px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Proposed let */}
            <div><h2 style={sectionHeadingStyle}>Details of the Proposed Let</h2><p style={sectionSubStyle}>The property this guarantee relates to.</p></div>
            <div className="g-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Property Postcode</label>
                <input ref={propertyRef} style={inputStyle} value={form.propertyPostcode} autoComplete="off" onChange={set('propertyPostcode')} placeholder="Start typing, e.g. LS1 1AA" />
              </div>
              <div>
                <label style={labelStyle}>Property Address</label>
                <input style={inputStyle} value={form.propertyAddressLine} onChange={set('propertyAddressLine')} placeholder="e.g. 12 Oak Street" />
              </div>
              <div><label style={labelStyle}>Rent (£ pcm)</label><input style={inputStyle} value={form.rent} onChange={set('rent')} placeholder="e.g. 850" /></div>
              <div><label style={labelStyle}>Deposit (£)</label><input style={inputStyle} value={form.deposit} onChange={set('deposit')} placeholder="e.g. 980" /></div>
              <div><label style={labelStyle}>Proposed Tenancy Start Date</label><input type="date" style={inputStyle} value={form.tenancyStart} onChange={set('tenancyStart')} /></div>
              <div><label style={labelStyle}>Initial Lease Term (months)</label><input type="number" min={1} style={inputStyle} value={form.leaseTerm} onChange={set('leaseTerm')} placeholder="e.g. 12" /></div>
            </div>
            <div>
              <label style={labelStyle}>Does the car parking space include the rent?</label>
              {radio('parkingIncluded', ['No', 'Yes'])}
            </div>

            <hr style={dividerStyle} />

            {/* Guarantor details */}
            <div><h2 style={sectionHeadingStyle}>Your Details (Guarantor)</h2><p style={sectionSubStyle}>Please provide your details as they appear on your official documents.</p></div>
            <div className="g-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={labelStyle}>Title</label><input style={inputStyle} value={form.guarantorTitle} onChange={set('guarantorTitle')} placeholder="Mr / Mrs / Ms / Dr" /></div>
              <div><label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label><input style={inputStyle} value={form.guarantorFullName} onChange={set('guarantorFullName')} placeholder="As on your ID" /></div>
              <div><label style={labelStyle}>Date of Birth</label><input type="date" style={inputStyle} value={form.guarantorDob} onChange={set('guarantorDob')} /></div>
              <div><label style={labelStyle}>Mobile <span style={{ color: '#ef4444' }}>*</span></label><input type="tel" style={inputStyle} value={form.guarantorMobile} onChange={set('guarantorMobile')} placeholder="07700 900123" /></div>
              <div><label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label><input type="email" style={inputStyle} value={form.guarantorEmail} onChange={set('guarantorEmail')} placeholder="you@email.co.uk" /></div>
              <div><label style={labelStyle}>Postcode</label><input ref={guarantorRef} style={inputStyle} value={form.guarantorPostcode} autoComplete="off" onChange={set('guarantorPostcode')} placeholder="Start typing your postcode" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address <span style={{ color: '#ef4444' }}>*</span></label><input style={inputStyle} value={form.guarantorAddressLine} onChange={set('guarantorAddressLine')} placeholder="Your home address" /></div>
              <div><label style={labelStyle}>How long have you lived at this address?</label><input style={inputStyle} value={form.timeAtAddress} onChange={set('timeAtAddress')} placeholder="e.g. 4 years" /></div>
              <div><label style={labelStyle}>Previous Address (if current is under 3 years)</label><input style={inputStyle} value={form.previousAddress} onChange={set('previousAddress')} placeholder="Previous full address" /></div>
            </div>
            <div>
              <label style={labelStyle}>Do you have a County Court Judgment (CCJ)?</label>
              {radio('hasCCJ', ['No', 'Yes'])}
            </div>

            <hr style={dividerStyle} />

            {/* Documents */}
            <div><h2 style={sectionHeadingStyle}>Your Documents</h2><p style={sectionSubStyle}>Please upload clear copies. PDFs and photos are accepted.</p></div>
            <FileUpload label="Valid Identity Document (UK Passport or valid visa front &amp; back, with original nationality passport)" required hint="Passport / visa — front and back" state={idDoc} onChange={setIdDoc} />
            <FileUpload label="Payslips x3 months (most recent) or proof of income" required hint="3 most recent payslips" state={payslips} onChange={setPayslips} />
            <FileUpload label="Proof of Address (utility bill, bank statement, driving licence)" required hint="Recent — within 3 months" state={proofOfAddress} onChange={setProofOfAddress} />
            <FileUpload label="Bank Statements x3 months (most recent)" required hint="3 most recent statements" state={bankStatements} onChange={setBankStatements} />
            <FileUpload label="If a student: course enrolment confirmation (term-time &amp; home address)" hint="Optional — students only" state={studentDoc} onChange={setStudentDoc} />

            <hr style={dividerStyle} />

            {/* Landlord / agent */}
            <div><h2 style={sectionHeadingStyle}>Your Current Landlord / Letting Agent</h2><p style={sectionSubStyle}>Contact details for your current landlord or letting agent.</p></div>
            <div className="g-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={labelStyle}>Title</label><input style={inputStyle} value={form.landlordTitle} onChange={set('landlordTitle')} placeholder="Mr / Mrs / Agency" /></div>
              <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.landlordName} onChange={set('landlordName')} placeholder="Landlord / agent name" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input style={inputStyle} value={form.landlordAddress} onChange={set('landlordAddress')} placeholder="Address" /></div>
              <div><label style={labelStyle}>Postcode</label><input style={inputStyle} value={form.landlordPostcode} onChange={set('landlordPostcode')} placeholder="Postcode" /></div>
              <div><label style={labelStyle}>Mobile</label><input type="tel" style={inputStyle} value={form.landlordMobile} onChange={set('landlordMobile')} placeholder="Contact number" /></div>
              <div><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={form.landlordEmail} onChange={set('landlordEmail')} placeholder="Email" /></div>
            </div>

            <hr style={dividerStyle} />

            {/* Employer */}
            <div><h2 style={sectionHeadingStyle}>Your Current Employer</h2><p style={sectionSubStyle}>Your employment and income details.</p></div>
            <div className="g-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={labelStyle}>Company</label><input style={inputStyle} value={form.employerCompany} onChange={set('employerCompany')} placeholder="Employer name" /></div>
              <div><label style={labelStyle}>Contact Name</label><input style={inputStyle} value={form.employerContactName} onChange={set('employerContactName')} placeholder="HR / manager" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input style={inputStyle} value={form.employerAddress} onChange={set('employerAddress')} placeholder="Employer address" /></div>
              <div><label style={labelStyle}>Postcode</label><input style={inputStyle} value={form.employerPostcode} onChange={set('employerPostcode')} placeholder="Postcode" /></div>
              <div><label style={labelStyle}>Annual Gross Salary (£)</label><input style={inputStyle} value={form.annualSalary} onChange={set('annualSalary')} placeholder="e.g. 32000" /></div>
              <div><label style={labelStyle}>Job Position</label><input style={inputStyle} value={form.jobPosition} onChange={set('jobPosition')} placeholder="Your role / position" /></div>
            </div>
            <div>
              <label style={labelStyle}>Type of Employment Contract</label>
              {radio('contractType', ['Permanent', 'Temporary'])}
            </div>

            <hr style={dividerStyle} />

            {/* Consent & declaration */}
            <div><h2 style={sectionHeadingStyle}>Consent &amp; Declaration</h2><p style={sectionSubStyle}>Please read and confirm the declarations below.</p></div>
            <label className="g-check">
              <input type="checkbox" checked={consentComms} onChange={e => setConsentComms(e.target.checked)} />
              <span><strong>I consent</strong> to receive communications from House of Lettings by email, telephone, post and/or text message in connection with my role as guarantor. I understand I may withdraw or amend my preferences at any time. <span style={{ color: '#ef4444' }}>*</span></span>
            </label>
            <label className="g-check">
              <input type="checkbox" checked={consentDeclare} onChange={e => setConsentDeclare(e.target.checked)} />
              <span><strong>I declare</strong> that I have read and understood the above information, including the privacy notice, and consent to my personal data being processed in accordance with these terms. I confirm I understand my obligations as a guarantor and agree to comply with the terms of the guarantor agreement. <span style={{ color: '#ef4444' }}>*</span></span>
            </label>
            <div>
              <label style={labelStyle}>Submission Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" style={inputStyle} value={form.submissionDate} onChange={set('submissionDate')} />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || anyUploading}
              style={{
                marginTop: 8, width: '100%', padding: '15px 28px',
                background: (submitting || anyUploading) ? '#93c5fd' : '#16a34a',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#fff',
                cursor: (submitting || anyUploading) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : '✓ Submit Guarantor Form'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
