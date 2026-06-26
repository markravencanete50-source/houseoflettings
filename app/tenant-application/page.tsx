'use client';

import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import Navbar from '@/components/layout/Navbar';
import { getAllProperties } from '@/services/admin';
import { Property } from '@/lib/types';

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

/**
 * Converts a full address to a truncated bank-reference style format.
 * e.g. "Flat 2, 7 Francis Street, Stockport, SK1 3AA"
 *      => "F 2 7 FRANCIS ST STO"
 * Rules:
 *  - "Flat" => "F", "Apartment"/"Apt" => "APT", "House" => "HSE"
 *  - Street suffixes: Road=>RD, Street=>ST, Avenue=>AVE, Lane=>LN, Drive=>DR, Close=>CL, Court=>CT, Way=>WY, Place=>PL, Gardens=>GDNS, Grove=>GR, Terrace=>TER, Crescent=>CRES
 *  - Town/city: first 3 uppercase characters
 *  - Postcode and county omitted
 *  - Max 18 chars total
 */
function toPaymentReference(address: string): string {
  if (!address) return '';

  const streetSuffixes: Record<string, string> = {
    road: 'RD', street: 'ST', avenue: 'AVE', lane: 'LN', drive: 'DR',
    close: 'CL', court: 'CT', way: 'WY', place: 'PL', gardens: 'GDNS',
    grove: 'GR', terrace: 'TER', crescent: 'CRES', mews: 'MWS',
  };

  const unitAbbr: Record<string, string> = {
    flat: 'F', apartment: 'APT', apt: 'APT', house: 'HSE', unit: 'UNIT',
  };

  // Split by comma
  const parts = address.split(',').map(p => p.trim());

  let unit = '';
  let streetPart = '';
  let townPart = '';

  // Try to detect flat/unit prefix
  const firstWords = parts[0].toLowerCase().split(/\s+/);
  if (unitAbbr[firstWords[0]]) {
    unit = unitAbbr[firstWords[0]] + ' ' + firstWords.slice(1).join(' ').toUpperCase();
    streetPart = parts[1] || '';
    townPart = parts[2] || '';
  } else {
    streetPart = parts[0];
    townPart = parts[1] || '';
  }

  // Process street
  const streetWords = streetPart.trim().toUpperCase().split(/\s+/);
  const processedStreet = streetWords.map(w => {
    const lower = w.toLowerCase();
    return streetSuffixes[lower] ? streetSuffixes[lower] : w;
  }).join(' ');

  // Town: first 3 chars uppercase, strip postcode-like tokens
  const townWords = townPart.trim().toUpperCase().split(/\s+/).filter(w => !/^[A-Z]{1,2}\d/.test(w));
  const townAbbr = townWords[0] ? townWords[0].substring(0, 3) : '';

  const ref = [unit, processedStreet, townAbbr].filter(Boolean).join(' ');

  // Trim to 18 chars max (bank reference limit)
  return ref.substring(0, 18).trim();
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
    const val = value && value.toString().trim() ? value.toString() : '—';
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
  row('Desired Move-In', data.moveInDate ? new Date(data.moveInDate).toLocaleDateString('en-GB') : '—');
  row('Lease Term', data.leaseTerm);
  row('Pets', data.pets);
  row('Guarantor', data.guarantor);
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
  label, required, maxFiles = 5, state, onChange,
}: {
  label: string; required?: boolean; maxFiles?: number;
  state: UploadState; onChange: (s: UploadState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, maxFiles);
    onChange({ ...state, files: arr, uploading: true, error: '' });
    const urls: string[] = [];
    for (const file of arr) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) urls.push(data.url);
        else throw new Error('Upload failed');
      } catch {
        onChange({ files: arr, uploading: false, urls: [], error: `Failed to upload ${file.name}` });
        return;
      }
    }
    onChange({ files: arr, uploading: false, urls, error: '' });
  };

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
          background: state.urls.length > 0 ? '#f0fdf4' : '#f9fafb',
          borderColor: state.urls.length > 0 ? '#86efac' : state.error ? '#fca5a5' : '#d1d5db',
          transition: 'all 0.2s',
        }}
      >
        {/* Accept any file type — no accept attribute */}
        <input ref={inputRef} type="file" multiple={maxFiles > 1} style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        {state.uploading ? (
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>⏳ Uploading…</p>
        ) : state.urls.length > 0 ? (
          <div>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>✅ {state.files.length} file{state.files.length > 1 ? 's' : ''} uploaded</p>
            {state.files.map((f, i) => (<p key={i} style={{ color: '#6b7280', fontSize: 12, margin: '2px 0' }}>{f.name}</p>))}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
            <p style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Click to upload or drag & drop</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Up to {maxFiles} file{maxFiles > 1 ? 's' : ''} · Max 100MB each</p>
          </div>
        )}
      </div>
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
    <div style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
        Property You're Applying For
      </div>
      {items.map((item, i) => (
        <div key={item.label} style={{
          display: 'flex', flexDirection: 'column', gap: 2,
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

// ── Mobile wizard: one question at a time ──────────────────────────────────
// Each "field" is a discrete sub-step shown only on mobile.
// On desktop the full section renders as before.

type MobileField = {
  id: string;
  label: string;
  render: () => React.ReactNode;
  isRequired?: boolean;
};

export default function TenantApplicationPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Mobile sub-step within a main step
  const [mobileSubStep, setMobileSubStep] = useState(0);
  // Track which trust badges have been revealed on mobile
  const [revealedBadges, setRevealedBadges] = useState(0);

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  useEffect(() => {
    getAllProperties()
      .then(all => setProperties(all.filter(p => p.status === 'active')))
      .catch(() => setProperties([]))
      .finally(() => setPropertiesLoading(false));
  }, []);

  // Reveal trust badges sequentially on mobile after page load
  useEffect(() => {
    const badges = ['Information is kept confidential', 'Secure file uploads', 'Response within 24–48 hours'];
    badges.forEach((_, i) => {
      setTimeout(() => setRevealedBadges(i + 1), 400 + i * 500);
    });
  }, []);

  // Reset mobile sub-step when main step changes
  useEffect(() => {
    setMobileSubStep(0);
  }, [step]);

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
  const [holdingDepositReceipt, setHoldingDepositReceipt] = useState<UploadState>(emptyUpload());
  // Payment reference auto-derived from selected property address
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

  // ── Mobile field definitions per step ────────────────────────────────────
  // Step 2 mobile fields
  const step2MobileFields: MobileField[] = [
    {
      id: 'fullName', label: 'Full Name', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="As it appears on your ID" autoFocus />
        </div>
      ),
    },
    {
      id: 'dob', label: 'Date of Birth', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="date" style={inputStyle} value={dob} onChange={e => setDob(e.target.value)} />
        </div>
      ),
    },
    {
      id: 'nationality', label: 'Nationality', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Nationality <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. British" autoFocus />
        </div>
      ),
    },
    {
      id: 'niNumber', label: 'National Insurance Number', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>National Insurance Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={niNumber} onChange={e => setNiNumber(e.target.value)} placeholder="e.g. AB 12 34 56 C" autoFocus />
        </div>
      ),
    },
    {
      id: 'email', label: 'Email Address', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.co.uk" autoFocus />
        </div>
      ),
    },
    {
      id: 'phone', label: 'UK Mobile Number', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>UK Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="tel" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="07700 900123" autoFocus />
        </div>
      ),
    },
    {
      id: 'billingAddress', label: 'Billing Address', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Billing Address (Minimum 3 years required) <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={4} value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Include all addresses for the past 3 years" />
        </div>
      ),
    },
    {
      id: 'govId', label: 'Government ID / Passport', isRequired: true,
      render: () => <FileUpload label="Government ID / Passport" required state={govId} onChange={setGovId} />,
    },
    {
      id: 'proofOfAddress', label: 'Proof of Address', isRequired: true,
      render: () => <FileUpload label="Proof of Address (utility bill, bank statement, council tax bill)" required state={proofOfAddress} onChange={setProofOfAddress} />,
    },
    {
      id: 'rightToRent', label: 'Right to Rent', isRequired: true,
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      ),
    },
  ];

  // Step 3 mobile fields
  const step3MobileFields: MobileField[] = [
    {
      id: 'employmentStatus', label: 'Employment Status', isRequired: true,
      render: () => (
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
      ),
    },
    {
      id: 'employerPhone', label: 'Employer Contact Number', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Employer/Institution Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="tel" style={inputStyle} value={employerPhone} onChange={e => setEmployerPhone(e.target.value)} placeholder="01234 567890" autoFocus />
        </div>
      ),
    },
    {
      id: 'employerEmail', label: 'Employer Email', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Employer/Institution Email Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="email" style={inputStyle} value={employerEmail} onChange={e => setEmployerEmail(e.target.value)} placeholder="hr@company.co.uk" autoFocus />
        </div>
      ),
    },
    {
      id: 'annualIncome', label: 'Total Annual Income', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Total Annual Income <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="e.g. £32,000" autoFocus />
        </div>
      ),
    },
    {
      id: 'additionalIncome', label: 'Additional Income Sources', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Additional Income Sources <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={additionalIncome} onChange={e => setAdditionalIncome(e.target.value)} placeholder="e.g. benefits, pension — or None" autoFocus />
        </div>
      ),
    },
    {
      id: 'payslips', label: 'Last 3 Payslips', isRequired: true,
      render: () => <FileUpload label="Last 3 Payslips or Proof of Income" required state={payslips} onChange={setPayslips} />,
    },
    {
      id: 'bankStatements', label: 'Bank Statements', isRequired: true,
      render: () => <FileUpload label="Last 3 Months Bank Statements" required state={bankStatements} onChange={setBankStatements} />,
    },
    {
      id: 'ccj', label: 'County Court Judgements', isRequired: true,
      render: () => (
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
      ),
    },
    {
      id: 'bankrupt', label: 'Bankruptcy', isRequired: true,
      render: () => (
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
      ),
    },
  ];

  // Step 4 mobile fields
  const step4MobileFields: MobileField[] = [
    {
      id: 'landlordName', label: "Landlord's Full Name", isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Landlord's Full Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={landlordName} onChange={e => setLandlordName(e.target.value)} placeholder="Full name" autoFocus />
        </div>
      ),
    },
    {
      id: 'landlordEmail', label: "Landlord's Email", isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Landlord's Email Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="email" style={inputStyle} value={landlordEmail} onChange={e => setLandlordEmail(e.target.value)} placeholder="landlord@email.co.uk" autoFocus />
        </div>
      ),
    },
    {
      id: 'landlordPhone', label: "Landlord's Phone", isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Landlord's Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="tel" style={inputStyle} value={landlordPhone} onChange={e => setLandlordPhone(e.target.value)} placeholder="07700 000000" autoFocus />
        </div>
      ),
    },
    {
      id: 'currentAddress', label: 'Current Property Address', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Current Property Address <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} placeholder="Full address including postcode" autoFocus />
        </div>
      ),
    },
    {
      id: 'tenancyDates', label: 'Tenancy Dates', isRequired: true,
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Tenancy Start Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" style={inputStyle} value={tenancyStart} onChange={e => setTenancyStart(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Tenancy End Date <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" style={inputStyle} value={tenancyEnd} onChange={e => setTenancyEnd(e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      id: 'reasonLeaving', label: 'Reason for Leaving', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Reason for Leaving <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={4} value={reasonLeaving} onChange={e => setReasonLeaving(e.target.value)} placeholder="Please explain your reason for leaving" />
        </div>
      ),
    },
    {
      id: 'leaseTerm', label: 'Initial Lease Term', isRequired: true,
      render: () => (
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
      ),
    },
    {
      id: 'moveInDate', label: 'Desired Move-In Date', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Desired Move-In Date <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="date" style={inputStyle} value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
        </div>
      ),
    },
    {
      id: 'pets', label: 'Pets', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Do you have pets? If yes, please provide breed and size. <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={pets} onChange={e => setPets(e.target.value)} placeholder='e.g. "No" or "1 x Labrador, medium size"' autoFocus />
        </div>
      ),
    },
    {
      id: 'guarantor', label: 'Guarantor', isRequired: true,
      render: () => (
        <div>
          <label style={labelStyle}>Do you currently have a guarantor available if required? <span style={{ color: '#ef4444' }}>*</span></label>
          <div className="ta-radio-group">
            {['Yes', 'No'].map(opt => (
              <label key={opt} className="ta-radio-label">
                <input type="radio" name="guarantor" value={opt} checked={guarantor === opt} onChange={() => setGuarantor(opt)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'holdingDeposit', label: 'Holding Deposit Receipt', isRequired: true,
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Holding Deposit Payment</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 0 }}>
              Transfer the holding deposit to the account below, then upload your receipt.
            </p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)', borderRadius: 12, padding: '20px 20px', color: '#fff' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Amount Due</div>
            {selectedProperty && (
              <>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{formatGBP(calcHoldingDeposit(selectedProperty.price))}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Holding deposit for {selectedProperty.location}</div>
              </>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Account Name', value: 'House of Lettings Limited' },
                { label: 'Sort Code', value: '60-83-65' },
                { label: 'Account Number', value: '67205541' },
                { label: 'Payment Reference', value: paymentReference },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: (item.label === 'Sort Code' || item.label === 'Account Number' || item.label === 'Payment Reference') ? 'monospace' : 'inherit', letterSpacing: item.label !== 'Account Name' ? '0.1em' : 'normal' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <FileUpload label="Holding Deposit Receipt" required maxFiles={1} state={holdingDepositReceipt} onChange={setHoldingDepositReceipt} />
        </div>
      ),
    },
  ];

  // Map step → mobile fields
  const mobileFieldsMap: Record<number, MobileField[]> = {
    2: step2MobileFields,
    3: step3MobileFields,
    4: step4MobileFields,
  };

  const currentMobileFields = mobileFieldsMap[step] || [];
  const isMobileWizardStep = currentMobileFields.length > 0;
  const totalMobileSubSteps = currentMobileFields.length;

  const goMobileNext = () => {
    if (mobileSubStep < totalMobileSubSteps - 1) {
      setMobileSubStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      goNext();
    }
  };

  const goMobilePrev = () => {
    if (mobileSubStep > 0) {
      setMobileSubStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      goPrev();
    }
  };

  if (submitted) {
    return (
      <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 'calc(72px + 60px) 24px 80px', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Application Submitted</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Thank you, <strong>{fullName}</strong>. We've received your tenancy application for{' '}
              <strong>{selectedProperty?.location}</strong>. Our team will review it and be in touch within 24–48 hours.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>
              A confirmation email with a PDF copy of your application has been sent to <strong>{email}</strong>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const trustBadges = ['Information is kept confidential', 'Secure file uploads', 'Response within 24–48 hours'];

  return (
    <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        input:focus, select:focus, textarea:focus {
          border-color: #2563eb !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .ta-radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .ta-radio-label {
          display: flex; align-items: center; gap: 8px;
          border: 1.5px solid #d1d5db; border-radius: 8px;
          padding: 10px 16px; cursor: pointer; font-size: 14px;
          font-weight: 500; color: #374151; background: #fff;
          transition: all 0.2s;
        }
        .ta-radio-label:has(input:checked) { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
        .ta-radio-label input { accent-color: #2563eb; }
        .ta-checkbox-label {
          display: flex; align-items: flex-start; gap: 12px;
          cursor: pointer; font-size: 14px; color: #374151; line-height: 1.6;
        }
        .ta-checkbox-label input { accent-color: #2563eb; margin-top: 3px; flex-shrink: 0; }
        .ta-property-option {
          display: flex; align-items: center; justify-content: space-between;
          border: 1.5px solid #d1d5db; border-radius: 10px;
          padding: 16px 18px; cursor: pointer; transition: all 0.2s; background: #fff;
        }
        .ta-property-option.selected { border-color: #2563eb; background: #eff6ff; }
        .ta-property-option:hover { border-color: #93c5fd; }

        /* ── Mobile: one-at-a-time wizard ── */
        .mobile-only { display: none; }
        .desktop-only { display: block; }

        @media (max-width: 640px) {
          .mobile-only { display: block; }
          .desktop-only { display: none; }

          /* All answers left-aligned on mobile */
          .ta-answers-grid { text-align: left !important; }
          .ta-answers-grid span { text-align: left !important; }

          /* Card padding smaller on mobile */
          .ta-card { padding: 28px 20px !important; }

          /* Trust badges sequential fade-in */
          .trust-badge {
            opacity: 0;
            transform: translateY(6px);
            transition: opacity 0.4s ease, transform 0.4s ease;
          }
          .trust-badge.revealed {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 641px) {
          .trust-badge { opacity: 1 !important; transform: none !important; }
        }

        /* Mobile sub-step progress dots */
        .mobile-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 20px; }
        .mobile-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #e5e7eb; transition: background 0.3s;
        }
        .mobile-dot.active { background: #2563eb; }
        .mobile-dot.done { background: #16a34a; }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)',
        paddingTop: 'calc(72px + 60px)',
        paddingBottom: 60,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <span style={{
            display: 'inline-block', background: 'rgba(37,99,235,0.2)',
            border: '1px solid rgba(37,99,235,0.5)', borderRadius: 999,
            padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#93c5fd',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20,
          }}>
            Tenancy Application
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Apply for Your New Home
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Please complete this form accurately and in full. All information is treated confidentially.
          </p>
        </div>
      </section>

      <section style={{ padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* ── PROPERTY SUMMARY ABOVE STEPPER (steps 2–5) ── */}
          {selectedProperty && step > 1 && (
            <div style={{ marginBottom: 24 }}>
              <PropertySummaryCard property={selectedProperty} />
            </div>
          )}

          {/* ── STEP INDICATOR ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              {['Select Property', 'Personal Details', 'Employment & Finance', "Landlord's Details", 'Declaration'].map((label, i) => (
                <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: step > i + 1 ? '#16a34a' : step === i + 1 ? '#2563eb' : '#e5e7eb',
                    color: step >= i + 1 ? '#fff' : '#9ca3af',
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: '#2563eb', borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {['Select Property', 'Personal Details', 'Employment & Finance', "Landlord's Details", 'Declaration'].map((label, i) => (
                <div key={label} style={{ fontSize: 11, color: step === i + 1 ? '#2563eb' : '#9ca3af', fontWeight: step === i + 1 ? 700 : 400, flex: 1, textAlign: 'center' }}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {stepError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
              ⚠️ {stepError}
            </div>
          )}

          <div className="ta-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '40px 48px' }}>

            {/* ══════════════════════════════════════════
                STEP 1 — same on mobile & desktop
            ══════════════════════════════════════════ */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h2 style={{ ...sectionHeadingStyle, color: '#2563eb' }}>Select Property</h2>
                  <p style={sectionSubStyle}>Choose the property you'd like to apply for. Rent, deposit and holding deposit will be filled in automatically.</p>
                </div>
                <input style={inputStyle} placeholder="Search by address or area…" value={propertySearch} onChange={e => setPropertySearch(e.target.value)} />
                {propertiesLoading ? (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Loading available properties…</p>
                ) : filteredProperties.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>No matching properties found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
                    {filteredProperties.map(p => {
                      const isSelected = selectedPropertyId === p.id;
                      return (
                        <div key={p.id} className={`ta-property-option ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedPropertyId(p.id || '')}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{p.location}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{formatGBP(p.price)} pcm · {p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`}</div>
                          </div>
                          {isSelected && <span style={{ color: '#2563eb', fontSize: 18 }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedProperty && <PropertySummaryCard property={selectedProperty} />}
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEPS 2–4: DESKTOP (full layout)
            ══════════════════════════════════════════ */}

            {/* ── STEP 2 desktop ── */}
            {step === 2 && (
              <>
                {/* DESKTOP */}
                <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <h2 style={sectionHeadingStyle}>Personal Details</h2>
                    <p style={sectionSubStyle}>Please provide your personal information as it appears on your official documents.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                      <textarea style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={3} value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Include all addresses for the past 3 years" />
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

                {/* MOBILE — one field at a time */}
                <div className="mobile-only">
                  <h2 style={{ ...sectionHeadingStyle, marginBottom: 4 }}>Personal Details</h2>
                  <p style={{ ...sectionSubStyle, marginBottom: 20 }}>
                    {mobileSubStep + 1} of {totalMobileSubSteps}
                  </p>
                  {/* Progress dots */}
                  <div className="mobile-dots">
                    {step2MobileFields.map((_, i) => (
                      <div key={i} className={`mobile-dot ${i < mobileSubStep ? 'done' : i === mobileSubStep ? 'active' : ''}`} />
                    ))}
                  </div>
                  {step2MobileFields[mobileSubStep]?.render()}
                </div>
              </>
            )}

            {/* ── STEP 3 desktop ── */}
            {step === 3 && (
              <>
                <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Employer/Institution Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="tel" style={inputStyle} value={employerPhone} onChange={e => setEmployerPhone(e.target.value)} placeholder="01234 567890" />
                    </div>
                    <div>
                      <label style={labelStyle}>Employer/Institution Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="email" style={inputStyle} value={employerEmail} onChange={e => setEmployerEmail(e.target.value)} placeholder="hr@company.co.uk" />
                    </div>
                    <div>
                      <label style={labelStyle}>Total Annual Income <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="e.g. £32,000" />
                    </div>
                    <div>
                      <label style={labelStyle}>Additional Income Sources <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} value={additionalIncome} onChange={e => setAdditionalIncome(e.target.value)} placeholder="e.g. benefits, pension — or None" />
                    </div>
                  </div>
                  <hr style={dividerStyle} />
                  <FileUpload label="Last 3 Payslips or Proof of Income" required state={payslips} onChange={setPayslips} />
                  <FileUpload label="Last 3 Months Bank Statements" required state={bankStatements} onChange={setBankStatements} />
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

                {/* MOBILE */}
                <div className="mobile-only">
                  <h2 style={{ ...sectionHeadingStyle, marginBottom: 4 }}>Employment & Finance</h2>
                  <p style={{ ...sectionSubStyle, marginBottom: 20 }}>
                    {mobileSubStep + 1} of {totalMobileSubSteps}
                  </p>
                  <div className="mobile-dots">
                    {step3MobileFields.map((_, i) => (
                      <div key={i} className={`mobile-dot ${i < mobileSubStep ? 'done' : i === mobileSubStep ? 'active' : ''}`} />
                    ))}
                  </div>
                  {step3MobileFields[mobileSubStep]?.render()}
                </div>
              </>
            )}

            {/* ── STEP 4 desktop ── */}
            {step === 4 && (
              <>
                <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <h2 style={sectionHeadingStyle}>Current Landlord's Details</h2>
                    <p style={sectionSubStyle}>Details of your current or most recent landlord/tenancy.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Landlord's Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} value={landlordName} onChange={e => setLandlordName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div>
                      <label style={labelStyle}>Landlord's Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="email" style={inputStyle} value={landlordEmail} onChange={e => setLandlordEmail(e.target.value)} placeholder="landlord@email.co.uk" />
                    </div>
                    <div>
                      <label style={labelStyle}>Landlord's Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
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
                      <textarea style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={3} value={reasonLeaving} onChange={e => setReasonLeaving(e.target.value)} placeholder="Please explain your reason for leaving" />
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
                  <div>
                    <label style={labelStyle}>Do you currently have a guarantor available if required? <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className="ta-radio-group">
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} className="ta-radio-label">
                          <input type="radio" name="guarantor" value={opt} checked={guarantor === opt} onChange={() => setGuarantor(opt)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <hr style={dividerStyle} />
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Holding Deposit Payment</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                      To secure this property, please transfer the holding deposit to the account below and upload your payment receipt.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)', borderRadius: 12, padding: '24px 28px', marginBottom: 20, color: '#fff' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Amount Due</div>
                      {selectedProperty && (
                        <>
                          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{formatGBP(calcHoldingDeposit(selectedProperty.price))}</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Holding deposit for {selectedProperty.location}</div>
                        </>
                      )}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                          { label: 'Account Name', value: 'House of Lettings Limited' },
                          { label: 'Sort Code', value: '60-83-65' },
                          { label: 'Account Number', value: '67205541' },
                          { label: 'Payment Reference', value: paymentReference },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: item.label !== 'Account Name' ? 'monospace' : 'inherit', letterSpacing: item.label !== 'Account Name' ? '0.1em' : 'normal' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FileUpload label="Holding Deposit Receipt" required maxFiles={1} state={holdingDepositReceipt} onChange={setHoldingDepositReceipt} />
                  </div>
                </div>

                {/* MOBILE */}
                <div className="mobile-only">
                  <h2 style={{ ...sectionHeadingStyle, marginBottom: 4 }}>Landlord's Details</h2>
                  <p style={{ ...sectionSubStyle, marginBottom: 20 }}>
                    {mobileSubStep + 1} of {totalMobileSubSteps}
                  </p>
                  <div className="mobile-dots">
                    {step4MobileFields.map((_, i) => (
                      <div key={i} className={`mobile-dot ${i < mobileSubStep ? 'done' : i === mobileSubStep ? 'active' : ''}`} />
                    ))}
                  </div>
                  {step4MobileFields[mobileSubStep]?.render()}
                </div>
              </>
            )}

            {/* ── STEP 5 ── same on mobile & desktop ── */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h2 style={sectionHeadingStyle}>Declaration & Consent</h2>
                  <p style={sectionSubStyle}>Please review your application and confirm the declarations below before submitting.</p>
                </div>
                <div className="ta-answers-grid" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '20px 24px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Your Answers</h3>
                  {[
                    ['Applicant', fullName], ['Email', email], ['Phone', phone],
                    ['Nationality', nationality],
                    ['Right to Rent', rightToRent === 'Other' ? rightToRentOther : rightToRent],
                    ['Employment Status', employmentStatus], ['Annual Income', annualIncome],
                    ['Move-In Date', moveInDate ? new Date(moveInDate).toLocaleDateString('en-GB') : '—'],
                    ['Lease Term', leaseTerm === 'Other' ? leaseTermOther : leaseTerm],
                    ['Pets', pets], ['Guarantor', guarantor],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span style={{ color: '#6b7280', fontWeight: 500, textAlign: 'left' }}>{label}</span>
                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'left', maxWidth: '60%' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 20px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                  ⚠️ <strong>Important:</strong> Any falsified, misleading, incomplete, or unverifiable information or documents may result in the application being declined and any holding deposit becoming non-refundable where permitted by law.
                </div>
                <label className="ta-checkbox-label">
                  <input type="checkbox" checked={consentContact} onChange={e => setConsentContact(e.target.checked)} />
                  <span><strong>I consent</strong> to House of Lettings contacting employers, landlords, references, guarantors and credit reference agencies to verify information provided in this application. <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                <label className="ta-checkbox-label">
                  <input type="checkbox" checked={consentDeclare} onChange={e => setConsentDeclare(e.target.checked)} />
                  <span><strong>I declare and agree</strong> that all information provided is accurate and complete. I understand House of Lettings may conduct Right to Rent, affordability, employment, landlord and credit checks. False information may result in rejection of my application. <span style={{ color: '#ef4444' }}>*</span></span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
              {/* Back button */}
              {(step > 1 || (isMobileWizardStep && mobileSubStep > 0)) ? (
                <button
                  onClick={() => {
                    // Mobile wizard: go back a sub-step or main step
                    const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 640;
                    if (isMobileView && isMobileWizardStep && mobileSubStep > 0) {
                      goMobilePrev();
                    } else {
                      goPrev();
                    }
                  }}
                  style={{ padding: '12px 24px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  ← Back
                </button>
              ) : <div />}

              {/* Forward button */}
              {step < totalSteps ? (
                <button
                  onClick={() => {
                    const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 640;
                    if (isMobileView && isMobileWizardStep) {
                      goMobileNext();
                    } else {
                      goNext();
                    }
                  }}
                  style={{ padding: '12px 28px', background: '#2563eb', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  Continue →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} style={{ padding: '12px 28px', background: submitting ? '#93c5fd' : '#16a34a', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting…' : '✓ Submit Application'}
                </button>
              )}
            </div>
          </div>

          {/* ── TRUST BADGES — sequential on mobile ── */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 24, flexWrap: 'wrap' }}>
            {trustBadges.map((t, i) => (
              <span
                key={t}
                className={`trust-badge ${revealedBadges > i ? 'revealed' : ''}`}
                style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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
