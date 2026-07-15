'use client';

import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import Navbar from '@/components/layout/Navbar';
import { getAllProperties } from '@/services/admin';
import { Property } from '@/lib/types';

// The site-standard CTA size, matching components/layout/ServiceHero.module.css
// (.btn). Back / Continue / Submit all share it so they measure identically.
const CTA_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
  padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
  fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700,
  letterSpacing: '.02em', textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1.5px solid #d1d5db',
  borderRadius: 8,
  color: '#111827',
  fontSize: 15,
  padding: '13px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 4,
  letterSpacing: '-0.02em',
};

const sectionSubStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 24,
};

const dividerStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1.5px solid #e5e7eb',
  margin: '36px 0',
};

const PARKING_LABELS: Record<string, string> = {
  none: 'No Parking',
  'double-garage': 'Double Garage',
  'off-street': 'Off Street',
  residents: "Residents' Parking",
  'single-garage': 'Single Garage',
  underground: 'Underground',
  'communal-no-allocated': 'Communal (No Allocated Space)',
  'disabled-available': 'Disabled Parking Available',
  'disabled-not-available': 'No Disabled Parking',
  'driveway-private': 'Private Driveway',
  'driveway-shared': 'Shared Driveway',
  'ev-private': 'Private EV Charging',
  'ev-shared': 'Shared EV Charging',
  garage: 'Garage',
  'garage-en-bloc': 'Garage (En Bloc)',
  'garage-carport': 'Carport',
  'garage-detached': 'Detached Garage',
  'garage-integral': 'Integral Garage',
  gated: 'Gated Parking',
  rear: 'Rear Parking',
  'street-no-permit': 'On Street (No Permit)',
  'street-permit': 'On Street (Permit Required)',
  undercroft: 'Undercroft Parking',
  'underground-allocated': 'Underground (Allocated)',
  'underground-no-allocated': 'Underground (No Allocated Space)',
  other: 'Other',
};

function parkingLabel(p?: Property['parking']) {
  if (!p) return 'Not specified';
  return PARKING_LABELS[p] || 'Not specified';
}

function calcHoldingDeposit(monthlyRent: number) {
  const weeklyRent = (monthlyRent * 12) / 52;
  return Math.floor(weeklyRent / 10) * 10;
}

function formatGBP(n: number) {
  return `£${n.toLocaleString('en-GB')}`;
}

function toPaymentReference(address: string): string {
  if (!address) return '';
  const parts = address.split(',');
  return parts.slice(0, 2).map(p => p.trim()).join(', ');
}

function generateApplicationPdf(data: Record<string, any>): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 0;

  const navy = '#0a1628';
  const blue = '#2563eb';
  const gray = '#6b7280';
  const dark = '#111827';
  const lineGray = '#eef0f5';

  doc.setFillColor(navy);
  doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Tenancy Application', margin, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#cbd5e1');
  doc.text(`${data.propertyAddress || ''}`, margin, 52);
  doc.text(`Submitted: ${new Date().toLocaleString('en-GB')}`, margin, 66);

  y = 105;

  const sectionTitle = (title: string) => {
    if (y > 760) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(blue);
    doc.text(title.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(blue);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  };

  const row = (label: string, value?: string) => {
    if (y > 770) { doc.addPage(); y = 40; }
    const val = value && value.toString().trim() ? value.toString() : '-';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(gray);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(dark);
    const valLines = doc.splitTextToSize(val, pageWidth - margin * 2 - 160);
    doc.text(valLines, margin + 170, y);
    const lineH = Math.max(14, valLines.length * 12);
    doc.setDrawColor(lineGray);
    doc.setLineWidth(0.5);
    doc.line(margin, y + lineH - 8, pageWidth - margin, y + lineH - 8);
    y += lineH;
  };

  const fileLinks = (label: string, urls?: string[]) => {
    if (!urls || urls.length === 0) { row(label, 'No files uploaded'); return; }
    if (y > 770) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(gray);
    doc.text(label, margin, y);
    urls.forEach((url, i) => {
      const text = `File ${i + 1}`;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(blue);
      doc.textWithLink(text, margin + 170 + i * 50, y, { url });
    });
    doc.setDrawColor(lineGray);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);
    y += 18;
  };

  sectionTitle('Personal Details');
  row('Full Name', data.fullName);
  row('Email', data.email);
  row('Phone', data.phone);
  row('Date of Birth', data.dob);
  row('Nationality', data.nationality);
  row('NI Number', data.niNumber);
  row('Billing Address', data.billingAddress);
  row('Right to Rent', data.rightToRent);
  if (data.shareCode) row('Share Code', data.shareCode);
  fileLinks('Government ID', data.govIdUrls);
  fileLinks('Proof of Address', data.proofOfAddressUrls);
  fileLinks('Right to Rent Doc', data.rightToRentDocUrls);

  y += 10;
  sectionTitle('Employment & Finance');
  row('Employment Status', data.employmentStatus);
  row('Employer Phone', data.employerPhone);
  row('Employer Email', data.employerEmail);
  row('Annual Income', data.annualIncome);
  row('Additional Income', data.additionalIncome);
  row('CCJs', data.hasCCJ);
  row('Bankrupt', data.wasBankrupt);
  fileLinks('Payslips', data.payslipUrls);
  fileLinks('Bank Statements', data.bankStatementUrls);

  y += 10;
  sectionTitle("Landlord's Details");
  row("Landlord's Name", data.landlordName);
  row("Landlord's Email", data.landlordEmail);
  row("Landlord's Phone", data.landlordPhone);
  row('Current Address', data.currentAddress);
  row('Tenancy Start', data.tenancyStart);
  row('Tenancy End', data.tenancyEnd);
  row('Reason for Leaving', data.reasonLeaving);
  row('Desired Move-In', data.moveInDate ? new Date(data.moveInDate).toLocaleDateString('en-GB') : '-');
  row('Lease Term', data.leaseTerm);
  row('Pets', data.pets);
  row('Guarantor', data.guarantor);
  if (data.guarantor === 'Yes') {
    row('Guarantor Name', data.guarantorName || '-');
    row('Guarantor Phone', data.guarantorPhone || '-');
    row('Guarantor Email', data.guarantorEmail || '-');
  }
  fileLinks('Holding Deposit Receipt', data.holdingDepositReceiptUrls);

  y += 10;
  sectionTitle('Property');
  row('Address', data.propertyAddress);
  row('Rent', data.rent);
  row('Deposit', data.deposit);
  row('Holding Deposit', data.holdingDeposit);
  row('Submission Date', data.submissionDate);

  return doc.output('datauristring').split(',')[1];
}

type UploadState = {
  files: File[];
  uploading: boolean;
  urls: string[];
  error: string;
};

function FileUpload({
  label, required, hint, minFiles, maxFiles = 5, state, onChange,
}: {
  label: string; required?: boolean; hint?: string; minFiles?: number; maxFiles?: number;
  state: UploadState; onChange: (s: UploadState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // New selections are ADDED to what's already uploaded (mobile pickers often
  // return one file at a time), so people can build up e.g. 3 payslips one by
  // one instead of having to pick all of them in a single go.
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = Math.max(0, maxFiles - state.urls.length);
    const newFiles = Array.from(files).slice(0, room);
    if (newFiles.length === 0) return;
    const baseFiles = state.files.slice(0, state.urls.length);
    const baseUrls = [...state.urls];
    onChange({ files: [...baseFiles, ...newFiles], urls: baseUrls, uploading: true, error: '' });
    const added: string[] = [];
    try {
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.url) throw new Error(`Failed to upload ${file.name}`);
        added.push(data.url);
      }
      onChange({ files: [...baseFiles, ...newFiles], urls: [...baseUrls, ...added], uploading: false, error: '' });
    } catch (e: any) {
      // keep whatever did upload; drop only the files that failed
      onChange({
        files: [...baseFiles, ...newFiles.slice(0, added.length)],
        urls: [...baseUrls, ...added],
        uploading: false,
        error: e.message || 'Upload failed. Please try again.',
      });
    }
  };

  const removeFile = (i: number) => {
    onChange({ ...state, files: state.files.filter((_, x) => x !== i), urls: state.urls.filter((_, x) => x !== i) });
  };

  const done = state.urls.length > 0;
  const full = state.urls.length >= maxFiles;
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{
          border: '2px dashed #d1d5db', borderRadius: 10, padding: '20px 16px',
          textAlign: 'center', cursor: 'pointer',
          background: done ? '#f0fdf4' : '#f9fafb',
          borderColor: done ? '#86efac' : state.error ? '#fca5a5' : '#d1d5db',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" multiple={maxFiles > 1} style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
        {state.uploading ? (
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>⏳ Uploading…</p>
        ) : done ? (
          <div>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>✅ {state.urls.length} file{state.urls.length > 1 ? 's' : ''} uploaded</p>
            {state.files.map((f, i) => (
              <p key={i} style={{ color: '#6b7280', fontSize: 12, margin: '2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{f.name}</span>
                <button type="button" onClick={e => { e.stopPropagation(); removeFile(i); }} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}>✕ remove</button>
              </p>
            ))}
            {!full && <p style={{ color: '#2563eb', fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>➕ Add another document{maxFiles > 1 ? ` (up to ${maxFiles})` : ''}</p>}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
            <p style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Tap to upload or drag &amp; drop</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>{hint || `Up to ${maxFiles} file${maxFiles > 1 ? 's' : ''} · Max 100MB each`}</p>
          </div>
        )}
      </div>
      {minFiles && !state.uploading && state.urls.length > 0 && state.urls.length < minFiles && (
        <p style={{ color: '#d97706', fontSize: 12, marginTop: 4 }}>Please upload at least {minFiles} (you have {state.urls.length}). Tap the box above to add more.</p>
      )}
      {state.error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{state.error}</p>}
    </div>
  );
}

const emptyUpload = (): UploadState => ({ files: [], uploading: false, urls: [], error: '' });

function PropertySummaryCard({ property }: { property: Property }) {
  const holdingDeposit = calcHoldingDeposit(property.price);
  const items = [
    { label: 'Property', value: property.location },
    { label: 'Rent', value: `${formatGBP(property.price)} pcm` },
    { label: 'Deposit', value: formatGBP(property.depositAmount || 0) },
    { label: 'Holding Deposit', value: formatGBP(holdingDeposit) },
    { label: 'Parking', value: parkingLabel(property.parking) },
  ];

  return (
    <div style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
        Property You're Applying For
      </div>
      {items.map((item, i) => (
        <div key={item.label} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '10px 0',
          borderBottom: i < items.length - 1 ? '1px solid #e5e7eb' : 'none',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.label}</span>
          <span style={{ fontSize: 15, color: '#111827', fontWeight: 700 }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

const STEP_LABELS_FULL = ['Select Property', 'Personal Details', 'Employment & Finance', "Landlord's Details", 'Declaration'];
const STEP_LABELS_SHORT = ['Property', 'Personal', 'Finance', 'Landlord', 'Declare'];

export default function TenantApplicationPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    getAllProperties()
      // Let-agreed properties are hidden from the application picker — tenants
      // can't apply for a home that already has an offer accepted.
      .then(all => setProperties(all.filter(p => p.status === 'active' && !p.letAgreed)))
      .catch(() => setProperties([]))
      .finally(() => setPropertiesLoading(false));
  }, []);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || null;
  const filteredProperties = properties.filter(p =>
    !propertySearch.trim() ||
    p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.location.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [niNumber, setNiNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [rightToRent, setRightToRent] = useState('');
  const [rightToRentOther, setRightToRentOther] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [govId, setGovId] = useState<UploadState>(emptyUpload());
  const [proofOfAddress, setProofOfAddress] = useState<UploadState>(emptyUpload());
  const [rightToRentDoc, setRightToRentDoc] = useState<UploadState>(emptyUpload());

  const [employmentStatus, setEmploymentStatus] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [additionalIncome, setAdditionalIncome] = useState('');
  const [hasCCJ, setHasCCJ] = useState('');
  const [wasBankrupt, setWasBankrupt] = useState('');
  const [payslips, setPayslips] = useState<UploadState>(emptyUpload());
  const [bankStatements, setBankStatements] = useState<UploadState>(emptyUpload());

  const [landlordName, setLandlordName] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [tenancyStart, setTenancyStart] = useState('');
  const [tenancyEnd, setTenancyEnd] = useState('');
  const [reasonLeaving, setReasonLeaving] = useState('');
  const [leaseTerm, setLeaseTerm] = useState('');
  const [leaseTermOther, setLeaseTermOther] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [pets, setPets] = useState('');
  const [guarantor, setGuarantor] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorEmail, setGuarantorEmail] = useState('');
  const [holdingDepositReceipt, setHoldingDepositReceipt] = useState<UploadState>(emptyUpload());
  const paymentReference = selectedProperty ? toPaymentReference(selectedProperty.location) : '';

  const [consentContact, setConsentContact] = useState(false);
  const [consentDeclare, setConsentDeclare] = useState(false);
  const [submissionDate, setSubmissionDate] = useState('');

  const totalSteps = 5;

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!selectedPropertyId) return 'Please select the property you are applying for.';
    }
    if (s === 2) {
      if (!fullName.trim()) return 'Full name is required.';
      if (!dob) return 'Date of birth is required.';
      if (!nationality.trim()) return 'Nationality is required.';
      if (!niNumber.trim()) return 'National Insurance number is required.';
      if (!email.trim()) return 'Email address is required.';
      if (!phone.trim()) return 'UK mobile number is required.';
      if (!billingAddress.trim()) return 'Billing address is required.';
      if (govId.urls.length === 0) return 'Government ID/Passport upload is required.';
      if (proofOfAddress.urls.length === 0) return 'Proof of address upload is required.';
      if (!rightToRent) return 'Please answer the Right to Rent question.';
    }
    if (s === 3) {
      if (!employmentStatus.trim()) return 'Employment status is required.';
      if (!employerPhone.trim()) return 'Employer/institution contact number is required.';
      if (!employerEmail.trim()) return 'Employer/institution email is required.';
      if (!annualIncome.trim()) return 'Total annual income is required.';
      if (!additionalIncome.trim()) return 'Additional income field is required (enter "None" if not applicable).';
      if (payslips.urls.length === 0) return 'Payslip upload is required.';
      if (bankStatements.urls.length === 0) return 'Bank statements upload is required.';
      if (!hasCCJ) return 'Please answer the CCJ question.';
      if (!wasBankrupt) return 'Please answer the bankruptcy question.';
    }
    if (s === 4) {
      if (!landlordName.trim()) return "Landlord's full name is required.";
      if (!landlordEmail.trim()) return "Landlord's email is required.";
      if (!landlordPhone.trim()) return "Landlord's contact number is required.";
      if (!currentAddress.trim()) return 'Current property address is required.';
      if (!tenancyStart) return 'Tenancy start date is required.';
      if (!tenancyEnd) return 'Tenancy end date is required.';
      if (!reasonLeaving.trim()) return 'Reason for leaving is required.';
      if (!leaseTerm) return 'Initial lease term is required.';
      if (!moveInDate) return 'Desired move-in date is required.';
      if (!pets.trim()) return 'Please answer the pets question.';
      if (!guarantor) return 'Please answer the guarantor question.';
      if (holdingDepositReceipt.urls.length === 0) return 'Please upload your holding deposit payment receipt.';
    }
    if (s === 5) {
      if (!consentContact) return 'You must consent to contact for verification.';
      if (!consentDeclare) return 'You must declare that all information is accurate.';
      if (!submissionDate) return 'Submission date is required.';
    }
    return null;
  };

  const [stepError, setStepError] = useState('');

  const goNext = () => {
    const err = validateStep(step);
    if (err) { setStepError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setStepError('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStepError('');
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const err = validateStep(5);
    if (err) { setStepError(err); return; }
    if (!selectedProperty) { setStepError('Please select a property before submitting.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const holdingDeposit = calcHoldingDeposit(selectedProperty.price);
      const payload = {
        fullName, dob, nationality, niNumber, email, phone, billingAddress,
        rightToRent: rightToRent === 'Other' ? rightToRentOther : rightToRent,
        shareCode,
        govIdUrls: govId.urls,
        proofOfAddressUrls: proofOfAddress.urls,
        rightToRentDocUrls: rightToRentDoc.urls,
        employmentStatus, employerPhone, employerEmail, annualIncome, additionalIncome,
        hasCCJ, wasBankrupt,
        payslipUrls: payslips.urls,
        bankStatementUrls: bankStatements.urls,
        landlordName, landlordEmail, landlordPhone, currentAddress,
        tenancyStart, tenancyEnd, reasonLeaving,
        leaseTerm: leaseTerm === 'Other' ? leaseTermOther : leaseTerm,
        moveInDate, pets, guarantor,
        guarantorName: guarantor === 'Yes' ? guarantorName : '',
        guarantorPhone: guarantor === 'Yes' ? guarantorPhone : '',
        guarantorEmail: guarantor === 'Yes' ? guarantorEmail : '',
        holdingDepositReceiptUrls: holdingDepositReceipt.urls,
        paymentReference,
        consentContact, consentDeclare, submissionDate,
        propertyId: selectedProperty.id,
        propertyAddress: selectedProperty.location,
        rent: formatGBP(selectedProperty.price),
        deposit: formatGBP(selectedProperty.depositAmount || 0),
        holdingDeposit: formatGBP(holdingDeposit),
        carPark: parkingLabel(selectedProperty.parking),
      };
      const pdfBase64 = generateApplicationPdf(payload);
      const res = await fetch('/api/tenant-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, pdfBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e.message || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const progressPct = (step / totalSteps) * 100;
  const stepLabels = isMobile ? STEP_LABELS_SHORT : STEP_LABELS_FULL;

  if (submitted) {
    return (
      <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 'calc(72px + 40px) 16px 60px', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '40px 24px' : '60px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Application Submitted</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Thank you, <strong>{fullName}</strong>. We've received your tenancy application for{' '}
              <strong>{selectedProperty?.location}</strong>. Our team will review it and be in touch within 24-48 hours.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>
              A confirmation email with a PDF copy of your application has been sent to <strong>{email}</strong>.
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
        input:focus, select:focus, textarea:focus {
          border-color: #2563eb !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }

        .ta-radio-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ta-radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          background: #fff;
          transition: all 0.2s;
          flex: 1 1 auto;
          min-width: 80px;
          justify-content: center;
        }
        .ta-radio-label:has(input:checked) { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
        .ta-radio-label input { accent-color: #2563eb; }

        .ta-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
        }
        .ta-checkbox-label input { accent-color: #2563eb; margin-top: 3px; flex-shrink: 0; }

        .ta-property-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
        }
        .ta-property-option.selected { border-color: #2563eb; background: #eff6ff; }
        .ta-property-option:hover { border-color: #93c5fd; }

        @media (max-width: 380px) {
          .step-label { display: none !important; }
        }

        @media (max-width: 600px) {
          .ta-grid-2 { grid-template-columns: 1fr !important; }
          .ta-grid-2 > div[style*="grid-column"] { grid-column: unset !important; }
        }

        @media (max-width: 400px) {
          .ta-nav-buttons { flex-direction: column-reverse !important; gap: 10px !important; }
          .ta-nav-buttons button { width: 100% !important; }
        }

        .bank-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 12px;
          flex-wrap: wrap;
        }

        .ta-answer-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
          flex-wrap: wrap;
          padding: 0 16px;
        }
        .trust-badge {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .guarantor-subform {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin-top: 16px;
        }
        .guarantor-subform-note {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 16px;
          font-style: italic;
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)',
        paddingTop: 'calc(72px + 40px)',
        paddingBottom: 40,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(37,99,235,0.2)',
            border: '1px solid rgba(37,99,235,0.5)',
            borderRadius: 999,
            padding: '5px 16px',
            fontSize: 11,
            fontWeight: 700,
            color: '#93c5fd',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Tenancy Application
          </span>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.6rem)',
            fontWeight: 800,
            color: '#fff',
            marginBottom: 12,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Apply for Your New Home
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            Please complete this form accurately and in full. All information is treated confidentially.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 16px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* ── STEP INDICATOR ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              {stepLabels.map((label, i) => (
                <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: isMobile ? 24 : 28,
                    height: isMobile ? 24 : 28,
                    borderRadius: '50%',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 10 : 12,
                    fontWeight: 700,
                    background: step > i + 1 ? '#16a34a' : step === i + 1 ? '#2563eb' : '#e5e7eb',
                    color: step >= i + 1 ? '#fff' : '#9ca3af',
                    flexShrink: 0,
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99 }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: '#2563eb',
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {stepLabels.map((label, i) => (
                <div
                  key={label}
                  className="step-label"
                  style={{
                    fontSize: isMobile ? 9 : 11,
                    color: step === i + 1 ? '#2563eb' : '#9ca3af',
                    fontWeight: step === i + 1 ? 700 : 400,
                    flex: 1,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    padding: '0 2px',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── ERROR BANNER ── */}
          {stepError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 500,
            }}>
              ⚠️ {stepError}
            </div>
          )}

          {/* ── CARD ── */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
            padding: isMobile ? '24px 16px' : '40px 48px',
          }}>

            {/* ── STEP 1: SELECT PROPERTY ── */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={{ ...sectionHeadingStyle, color: '#2563eb' }}>Select Property</h2>
                  <p style={sectionSubStyle}>Choose the property you'd like to apply for.</p>
                </div>
                <input
                  style={inputStyle}
                  placeholder="Search by address or area…"
                  value={propertySearch}
                  onChange={e => setPropertySearch(e.target.value)}
                />
                {propertiesLoading ? (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Loading available properties…</p>
                ) : filteredProperties.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>No matching properties found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                    {filteredProperties.map(p => {
                      const isSelected = selectedPropertyId === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`ta-property-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedPropertyId(p.id || '')}
                        >
                          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{formatGBP(p.price)} pcm · {p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`}</div>
                          </div>
                          {isSelected && <span style={{ color: '#2563eb', fontSize: 18, flexShrink: 0 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedProperty && <PropertySummaryCard property={selectedProperty} />}
              </div>
            )}

            {/* ── STEP 2: PERSONAL DETAILS ── */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={sectionHeadingStyle}>Personal Details</h2>
                  <p style={sectionSubStyle}>Please provide your personal information as it appears on your official documents.</p>
                </div>
                <div className="ta-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="As it appears on your ID" />
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" style={inputStyle} value={dob} onChange={e => setDob(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nationality <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. British" />
                  </div>
                  <div>
                    <label style={labelStyle}>National Insurance Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={niNumber} onChange={e => setNiNumber(e.target.value)} placeholder="e.g. AB 12 34 56 C" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.co.uk" />
                  </div>
                  <div>
                    <label style={labelStyle}>UK Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="07700 900123" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Billing Address (Minimum 3 years required) <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                      rows={3}
                      value={billingAddress}
                      onChange={e => setBillingAddress(e.target.value)}
                      placeholder="Include all addresses for the past 3 years"
                    />
                  </div>
                </div>
                <hr style={dividerStyle} />
                <FileUpload label="Government ID / Passport" required state={govId} onChange={setGovId} />
                <FileUpload label="Proof of Address (utility bill, bank statement, council tax bill)" required state={proofOfAddress} onChange={setProofOfAddress} />
                <hr style={dividerStyle} />
                <div>
                  <label style={labelStyle}>Do you have the legal Right to Rent in the UK? <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="ta-radio-group">
                    {['Yes', 'No', 'Other'].map(opt => (
                      <label key={opt} className="ta-radio-label">
                        <input type="radio" name="rightToRent" value={opt} checked={rightToRent === opt} onChange={() => setRightToRent(opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {rightToRent === 'Other' && (
                    <input style={{ ...inputStyle, marginTop: 12 }} value={rightToRentOther} onChange={e => setRightToRentOther(e.target.value)} placeholder="Please specify…" />
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Right to Rent Share Code <span style={{ color: '#9ca3af', fontWeight: 400 }}>(if not a British citizen)</span></label>
                  <input style={inputStyle} value={shareCode} onChange={e => setShareCode(e.target.value)} placeholder="e.g. W1A-B2C-D3E" />
                </div>
                <FileUpload label="Right to Rent Document Upload" state={rightToRentDoc} onChange={setRightToRentDoc} maxFiles={5} />
              </div>
            )}

            {/* ── STEP 3: EMPLOYMENT & FINANCE ── */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={sectionHeadingStyle}>Employment & Finance</h2>
                  <p style={sectionSubStyle}>We use this to assess affordability. All information is handled confidentially.</p>
                </div>
                <div>
                  <label style={labelStyle}>Employment Status <span style={{ color: '#ef4444' }}>*</span></label>
                  <select style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties} value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)}>
                    <option value="">Select…</option>
                    <option>Full-time employed</option>
                    <option>Part-time employed</option>
                    <option>Self-employed</option>
                    <option>Student</option>
                    <option>Retired</option>
                    <option>Unemployed</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="ta-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Employer Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" style={inputStyle} value={employerPhone} onChange={e => setEmployerPhone(e.target.value)} placeholder="01234 567890" />
                  </div>
                  <div>
                    <label style={labelStyle}>Employer Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" style={inputStyle} value={employerEmail} onChange={e => setEmployerEmail(e.target.value)} placeholder="hr@company.co.uk" />
                  </div>
                  <div>
                    <label style={labelStyle}>Total Annual Income <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="e.g. £32,000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Additional Income Sources <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={additionalIncome} onChange={e => setAdditionalIncome(e.target.value)} placeholder="e.g. pension, or None" />
                  </div>
                </div>
                <hr style={dividerStyle} />
                <FileUpload label="Last 3 Payslips or Proof of Income" required minFiles={3} hint="Add all 3 payslips, one at a time or together" state={payslips} onChange={setPayslips} />
                <FileUpload label="Last 3 Months Bank Statements" required minFiles={3} hint="Add all 3 statements, one at a time or together" state={bankStatements} onChange={setBankStatements} />
                <hr style={dividerStyle} />
                <div>
                  <label style={labelStyle}>Do you have any County Court Judgements (CCJs)? <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="ta-radio-group">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="ta-radio-label">
                        <input type="radio" name="ccj" value={opt} checked={hasCCJ === opt} onChange={() => setHasCCJ(opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Have you ever been declared bankrupt? <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="ta-radio-group">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="ta-radio-label">
                        <input type="radio" name="bankrupt" value={opt} checked={wasBankrupt === opt} onChange={() => setWasBankrupt(opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: LANDLORD'S DETAILS ── */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={sectionHeadingStyle}>Current Landlord's Details</h2>
                  <p style={sectionSubStyle}>Details of your current or most recent landlord/tenancy.</p>
                </div>
                <div className="ta-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Landlord's Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={landlordName} onChange={e => setLandlordName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Landlord's Email <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" style={inputStyle} value={landlordEmail} onChange={e => setLandlordEmail(e.target.value)} placeholder="landlord@email.co.uk" />
                  </div>
                  <div>
                    <label style={labelStyle}>Landlord's Phone <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" style={inputStyle} value={landlordPhone} onChange={e => setLandlordPhone(e.target.value)} placeholder="07700 000000" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Current Property Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input style={inputStyle} value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} placeholder="Full address including postcode" />
                  </div>
                  <div>
                    <label style={labelStyle}>Tenancy Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" style={inputStyle} value={tenancyStart} onChange={e => setTenancyStart(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Tenancy End Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" style={inputStyle} value={tenancyEnd} onChange={e => setTenancyEnd(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Reason for Leaving <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                      rows={3}
                      value={reasonLeaving}
                      onChange={e => setReasonLeaving(e.target.value)}
                      placeholder="Please explain your reason for leaving"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Initial Lease Term <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="ta-radio-group">
                    {['6 months', '12 months', 'Other'].map(opt => (
                      <label key={opt} className="ta-radio-label">
                        <input type="radio" name="leaseTerm" value={opt} checked={leaseTerm === opt} onChange={() => setLeaseTerm(opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {leaseTerm === 'Other' && (
                    <input style={{ ...inputStyle, marginTop: 12 }} value={leaseTermOther} onChange={e => setLeaseTermOther(e.target.value)} placeholder="Please specify lease term" />
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Desired Move-In Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" style={inputStyle} value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Do you have pets? If yes, please provide breed and size. <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={inputStyle} value={pets} onChange={e => setPets(e.target.value)} placeholder='e.g. "No" or "1 x Labrador, medium size"' />
                </div>

                {/* ── GUARANTOR ── */}
                <div>
                  <label style={labelStyle}>Do you have a guarantor available if required? <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="ta-radio-group">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="ta-radio-label">
                        <input type="radio" name="guarantor" value={opt} checked={guarantor === opt} onChange={() => setGuarantor(opt)} />
                        {opt}
                      </label>
                    ))}
                  </div>

                  {guarantor === 'Yes' && (
                    <div className="guarantor-subform">
                      <p className="guarantor-subform-note">All fields below are optional. Provide as much detail as you have.</p>
                      <div className="ta-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={labelStyle}>Guarantor Full Name</label>
                          <input
                            style={inputStyle}
                            value={guarantorName}
                            onChange={e => setGuarantorName(e.target.value)}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Guarantor Telephone Number</label>
                          <input
                            type="tel"
                            style={inputStyle}
                            value={guarantorPhone}
                            onChange={e => setGuarantorPhone(e.target.value)}
                            placeholder="07700 000000"
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Guarantor Email Address</label>
                          <input
                            type="email"
                            style={inputStyle}
                            value={guarantorEmail}
                            onChange={e => setGuarantorEmail(e.target.value)}
                            placeholder="guarantor@email.co.uk"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <hr style={dividerStyle} />

                {/* Holding deposit card */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Holding Deposit Payment</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
                    To secure this property, transfer the holding deposit to the account below and upload your payment receipt.
                  </p>
                  <div style={{
                    background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)',
                    borderRadius: 12,
                    padding: isMobile ? '20px 16px' : '24px 28px',
                    marginBottom: 20,
                    color: '#fff',
                  }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Amount Due</div>
                    {selectedProperty && (
                      <>
                        <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                          {formatGBP(calcHoldingDeposit(selectedProperty.price))}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.4 }}>
                          Holding deposit for {selectedProperty.location}
                        </div>
                      </>
                    )}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Account Name', value: 'House of Lettings Limited' },
                        { label: 'Sort Code', value: '20-55-41' },
                        { label: 'Account Number', value: '60836567' },
                        { label: 'Payment Reference', value: paymentReference },
                      ].map(item => (
                        <div key={item.label} className="bank-detail-row">
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{item.label}</div>
                          <div style={{
                            fontSize: isMobile ? 13 : 15,
                            fontWeight: 700,
                            fontFamily: item.label !== 'Account Name' ? 'monospace' : 'inherit',
                            letterSpacing: item.label !== 'Account Name' ? '0.08em' : 'normal',
                            wordBreak: 'break-all',
                            textAlign: 'right',
                          }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <FileUpload label="Holding Deposit Receipt" required maxFiles={1} state={holdingDepositReceipt} onChange={setHoldingDepositReceipt} />
                </div>
              </div>
            )}

            {/* ── STEP 5: DECLARATION ── */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={sectionHeadingStyle}>Declaration & Consent</h2>
                  <p style={sectionSubStyle}>Review your application and confirm the declarations below before submitting.</p>
                </div>

                {/* Summary */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Your Answers</h3>
                  {[
                    ['Applicant', fullName],
                    ['Email', email],
                    ['Phone', phone],
                    ['Nationality', nationality],
                    ['Right to Rent', rightToRent === 'Other' ? rightToRentOther : rightToRent],
                    ['Employment Status', employmentStatus],
                    ['Annual Income', annualIncome],
                    ['Move-In Date', moveInDate ? new Date(moveInDate).toLocaleDateString('en-GB') : '-'],
                    ['Lease Term', leaseTerm === 'Other' ? leaseTermOther : leaseTerm],
                    ['Pets', pets],
                    ['Guarantor', guarantor],
                    ...(guarantor === 'Yes' ? [
                      ['Guarantor Name', guarantorName || '-'],
                      ['Guarantor Phone', guarantorPhone || '-'],
                      ['Guarantor Email', guarantorEmail || '-'],
                    ] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="ta-answer-row">
                      <span style={{ color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>{label}</span>
                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value || '-'}</span>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '14px 16px',
                  fontSize: 13,
                  color: '#92400e',
                  lineHeight: 1.6,
                }}>
                  ⚠️ <strong>Important:</strong> Any falsified, misleading, incomplete, or unverifiable information or documents may result in the application being declined and any holding deposit becoming non-refundable where permitted by law.
                </div>

                <label className="ta-checkbox-label">
                  <input type="checkbox" checked={consentContact} onChange={e => setConsentContact(e.target.checked)} />
                  <span>
                    <strong>I consent</strong> to House of Lettings contacting employers, landlords, references, guarantors and credit reference agencies to verify information provided in this application.{' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                </label>
                <label className="ta-checkbox-label">
                  <input type="checkbox" checked={consentDeclare} onChange={e => setConsentDeclare(e.target.checked)} />
                  <span>
                    <strong>I declare and agree</strong> that all information provided is accurate and complete. I understand House of Lettings may conduct Right to Rent, affordability, employment, landlord and credit checks. False information may result in rejection of my application.{' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                </label>

                <div>
                  <label style={labelStyle}>Submission Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="date" style={inputStyle} value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
                </div>

                {submitError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 14 }}>
                    ❌ {submitError}
                  </div>
                )}
              </div>
            )}

            {/* ── NAV BUTTONS ── */}
            <div
              className="ta-nav-buttons"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid #f1f5f9',
                gap: 12,
              }}
            >
              {step > 1 ? (
                <button
                  onClick={goPrev}
                  style={{
                    ...CTA_STYLE,
                    background: '#f9fafb',
                    borderColor: '#e5e7eb',
                    color: '#374151',
                    cursor: 'pointer',
                    flex: isMobile ? 1 : undefined,
                  }}
                >
                  ← Back
                </button>
              ) : <div />}

              {step < totalSteps ? (
                <button
                  onClick={goNext}
                  style={{
                    ...CTA_STYLE,
                    background: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                    flex: isMobile ? 1 : undefined,
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    ...CTA_STYLE,
                    background: submitting ? '#93c5fd' : '#16a34a',
                    color: '#fff',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    flex: isMobile ? 1 : undefined,
                  }}
                >
                  {submitting ? 'Submitting…' : '✓ Submit Application'}
                </button>
              )}
            </div>
          </div>

          {/* ── TRUST BADGES ── */}
          <div className="trust-badges">
            {['Information is kept confidential', 'Response within 24-48 hours', 'Secure file uploads'].map(t => (
              <span key={t} className="trust-badge">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
