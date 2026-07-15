'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import Navbar from '@/components/layout/Navbar';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';

/* ────────────────────────────────────────────────────────────
   Shared styles (matched to the tenant-application form)
   ──────────────────────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8,
  color: '#111827', fontSize: 15, padding: '13px 16px', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
};
const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em',
};
const sectionSubStyle: React.CSSProperties = { fontSize: 13, color: '#6b7280', marginBottom: 20 };
const dividerStyle: React.CSSProperties = { border: 'none', borderTop: '1.5px solid #e5e7eb', margin: '32px 0' };

/* ────────────────────────────────────────────────────────────
   Direct-to-Cloudinary upload (bypasses Vercel's ~4.5MB limit so
   photos and videos of any size upload reliably).
   ──────────────────────────────────────────────────────────── */
async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'houseoflettings/maintenance' }),
  });
  if (!sigRes.ok) throw new Error('Could not prepare upload');
  const { cloudName, apiKey, timestamp, folder, signature } = await sigRes.json();

  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', apiKey);
  fd.append('timestamp', String(timestamp));
  fd.append('folder', folder);
  fd.append('signature', signature);

  // 'auto' lets one endpoint accept images and videos.
  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: fd,
  });
  const data = await upRes.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url as string;
}

/* ────────────────────────────────────────────────────────────
   File upload field (multi-file, direct to Cloudinary)
   ──────────────────────────────────────────────────────────── */
type UploadState = { files: File[]; uploading: boolean; urls: string[]; error: string };
const emptyUpload = (): UploadState => ({ files: [], uploading: false, urls: [], error: '' });

function FileUpload({
  label, hint, accept, required, minFiles, maxFiles = 8, state, onChange,
}: {
  label: string; hint?: string; accept: string; required?: boolean;
  minFiles?: number; maxFiles?: number; state: UploadState; onChange: (s: UploadState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // New selections are ADDED to what's already uploaded (mobile pickers often
  // return one file at a time) — never replace previous files.
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = Math.max(0, maxFiles - state.urls.length);
    const newFiles = Array.from(files).slice(0, room);
    if (newFiles.length === 0) return;
    // only keep files that actually finished uploading as the base
    const baseFiles = state.files.slice(0, state.urls.length);
    const baseUrls = [...state.urls];
    onChange({ files: [...baseFiles, ...newFiles], urls: baseUrls, uploading: true, error: '' });
    const added: string[] = [];
    try {
      for (const file of newFiles) {
        added.push(await uploadToCloudinary(file));
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
    onChange({
      ...state,
      files: state.files.filter((_, x) => x !== i),
      urls: state.urls.filter((_, x) => x !== i),
    });
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
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        {state.uploading ? (
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>⏳ Uploading… please wait</p>
        ) : done ? (
          <div>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>✅ {state.urls.length} file{state.urls.length > 1 ? 's' : ''} uploaded</p>
            {state.files.map((f, i) => (
              <p key={i} style={{ color: '#6b7280', fontSize: 12, margin: '2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{f.name}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(i); }}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}
                >✕ remove</button>
              </p>
            ))}
            {!full && <p style={{ color: 'var(--logo-blue)', fontSize: 12, marginTop: 6 }}>➕ Tap to add more (up to {maxFiles})</p>}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{accept.includes('video') ? '🎥' : '📷'}</div>
            <p style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>Tap to upload or drag &amp; drop</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>{hint}</p>
          </div>
        )}
      </div>
      {minFiles && !state.uploading && state.urls.length > 0 && state.urls.length < minFiles && (
        <p style={{ color: '#d97706', fontSize: 12, marginTop: 4 }}>Please upload at least {minFiles} files (you have {state.urls.length}).</p>
      )}
      {state.error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{state.error}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PDF generation
   ──────────────────────────────────────────────────────────── */
function generateMaintenancePdf(data: Record<string, any>): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 0;

  const navy = '#0a1628', blue = '#2563eb', gray = '#6b7280', dark = '#111827', lineGray = '#eef0f5';

  doc.setFillColor(navy);
  doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Maintenance Request', margin, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#cbd5e1');
  doc.text(`${data.propertyAddress || ''}`, margin, 52);
  doc.text(`Submitted: ${new Date().toLocaleString('en-GB')}`, margin, 66);
  y = 105;

  const sectionTitle = (title: string) => {
    if (y > 760) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(blue);
    doc.text(title.toUpperCase(), margin, y); y += 6;
    doc.setDrawColor(blue); doc.setLineWidth(1); doc.line(margin, y, pageWidth - margin, y); y += 16;
  };
  const row = (label: string, value?: string) => {
    if (y > 770) { doc.addPage(); y = 40; }
    const val = value && value.toString().trim() ? value.toString() : '-';
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(gray);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(dark);
    const valLines = doc.splitTextToSize(val, pageWidth - margin * 2 - 160);
    doc.text(valLines, margin + 170, y);
    const lineH = Math.max(14, valLines.length * 12);
    doc.setDrawColor(lineGray); doc.setLineWidth(0.5); doc.line(margin, y + lineH - 8, pageWidth - margin, y + lineH - 8);
    y += lineH;
  };
  const fileLinks = (label: string, urls?: string[]) => {
    if (!urls || urls.length === 0) { row(label, 'None provided'); return; }
    if (y > 770) { doc.addPage(); y = 40; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(gray);
    doc.text(label, margin, y);
    urls.forEach((url, i) => {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(blue);
      doc.textWithLink(`File ${i + 1}`, margin + 170 + i * 50, y, { url });
    });
    doc.setDrawColor(lineGray); doc.setLineWidth(0.5); doc.line(margin, y + 6, pageWidth - margin, y + 6);
    y += 18;
  };

  sectionTitle('Tenant & Property');
  row('Full Name', data.fullName);
  row('Email', data.email);
  row('Best Contact Number', data.contactNumber);
  row('Property Address', data.propertyAddress);
  row('Availability for Access', data.availability);

  y += 8;
  sectionTitle('The Issue');
  row('Description', data.issueDescription);
  row('When It Happened', data.whenHappened);
  row('Happened Before?', data.experiencedBefore);
  row('Cause', data.cause);
  if (data.causeDetail) row('Cause Details', data.causeDetail);

  y += 8;
  sectionTitle('Evidence');
  fileLinks('Photos', data.photoUrls);
  fileLinks('Videos', data.videoUrls);

  return doc.output('datauristring').split(',')[1];
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */
export default function MaintenanceReportPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [postcode, setPostcode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [whenHappened, setWhenHappened] = useState('');
  const [availability, setAvailability] = useState('');
  const [experiencedBefore, setExperiencedBefore] = useState('');
  const [cause, setCause] = useState('');
  const [causeDetail, setCauseDetail] = useState('');
  const [photos, setPhotos] = useState<UploadState>(emptyUpload());
  const [videos, setVideos] = useState<UploadState>(emptyUpload());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleAddressSelect = useCallback((data: AddressResult) => {
    setPostcode(p => data.postcode || p);
    setAddressLine1(p => data.street || p);
    setError('');
  }, []);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Your full name is required.';
    if (!email.trim()) return 'Your email address is required.';
    if (!contactNumber.trim()) return 'A best contact number is required.';
    if (!postcode.trim()) return 'Property postcode is required.';
    if (!addressLine1.trim()) return 'First line of the property address is required.';
    if (!issueDescription.trim()) return 'Please describe the maintenance issue.';
    if (!whenHappened) return 'Please tell us when the issue happened.';
    if (!availability.trim()) return 'Please give your availability for a repair visit.';
    if (photos.urls.length < 1) return 'Please upload at least 1 photo of the issue.';
    if (!experiencedBefore) return 'Please tell us if you have experienced this issue before.';
    if (!cause) return 'Please tell us what you think caused the issue.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (photos.uploading || videos.uploading) { setError('Please wait for your files to finish uploading.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const propertyAddress = [addressLine1, postcode].filter(Boolean).join(', ');
      const payload = {
        fullName, email, contactNumber,
        postcode, addressLine1, propertyAddress,
        issueDescription, whenHappened, availability,
        experiencedBefore, cause, causeDetail,
        photoUrls: photos.urls,
        videoUrls: videos.urls,
      };
      const pdfBase64 = generateMaintenancePdf(payload);
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (submitted) {
    return (
      <main style={{ background: '#f3f4f6', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: 'calc(72px + 40px) 16px 60px', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '40px 24px' : '60px 40px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🔧</div>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Maintenance Request Submitted</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Thank you, <strong>{fullName}</strong>. We&apos;ve received your maintenance report for{' '}
              <strong>{[addressLine1, postcode].filter(Boolean).join(', ')}</strong>. Our property team will be in touch to arrange the repair.
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>
              A confirmation email with a PDF copy of your report has been sent to <strong>{email}</strong>.
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
          border-color: #2563eb !important; outline: none;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .m-radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
        .m-radio-label {
          display: flex; align-items: center; gap: 8px; border: 1.5px solid #d1d5db;
          border-radius: 8px; padding: 10px 16px; cursor: pointer; font-size: 14px;
          font-weight: 500; color: #374151; background: #fff; transition: all 0.2s;
          flex: 1 1 auto; min-width: 80px; justify-content: center;
        }
        .m-radio-label:has(input:checked) { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
        .m-radio-label input { accent-color: #2563eb; }
        @media (max-width: 600px) { .m-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 100%)', paddingTop: 'calc(72px + 40px)', paddingBottom: 40, textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <span style={{ display: 'inline-block', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.5)', borderRadius: 999, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Maintenance Request
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Report a Maintenance Issue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Something broken or not working in your property? Tell us what&apos;s wrong, add a few photos, and our team will sort it out.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 16px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: isMobile ? '24px 16px' : '40px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Your details */}
            <div>
              <h2 style={sectionHeadingStyle}>Your Details</h2>
              <p style={sectionSubStyle}>So we can confirm the request and contact you about the repair.</p>
            </div>
            <div className="m-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.co.uk" />
              </div>
              <div>
                <label style={labelStyle}>Best Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="tel" style={inputStyle} value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="07700 900123" />
              </div>
            </div>

            <hr style={dividerStyle} />

            {/* Property */}
            <div>
              <h2 style={sectionHeadingStyle}>Property Address</h2>
              <p style={sectionSubStyle}>Enter the postcode and we&apos;ll help complete the address.</p>
            </div>
            <div className="m-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Postcode <span style={{ color: '#ef4444' }}>*</span></label>
                <PostcodeLookup
                  postcode={postcode}
                  onPostcodeChange={setPostcode}
                  onSelect={handleAddressSelect}
                  inputStyle={inputStyle}
                  placeholder="e.g. LS1 1AA"
                />
              </div>
              <div>
                <label style={labelStyle}>First Line of Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle} value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="e.g. 12 Oak Street" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Your Availability for a Repair Visit <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle} value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g. Weekday mornings, or Mon/Wed after 5pm" />
            </div>

            <hr style={dividerStyle} />

            {/* The issue */}
            <div>
              <h2 style={sectionHeadingStyle}>The Issue</h2>
              <p style={sectionSubStyle}>Tell us what&apos;s wrong and what happened.</p>
            </div>
            <div>
              <label style={labelStyle}>Describe the Issue <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={4} value={issueDescription} onChange={e => setIssueDescription(e.target.value)} placeholder="e.g. The boiler stopped working, with no hot water or heating. No error on the display." />
            </div>
            <div>
              <label style={labelStyle}>When Did It Happen? <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" style={inputStyle} value={whenHappened} max={new Date().toISOString().split('T')[0]} onChange={e => setWhenHappened(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Have You Experienced This Issue Before? <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="m-radio-group">
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className="m-radio-label">
                    <input type="radio" name="experiencedBefore" value={opt} checked={experiencedBefore === opt} onChange={() => setExperiencedBefore(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>What Do You Think Caused It? <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="m-radio-group">
                {['It broke / stopped working on its own', 'Something we did caused it', 'Not sure'].map(opt => (
                  <label key={opt} className="m-radio-label" style={{ flex: '1 1 30%' }}>
                    <input type="radio" name="cause" value={opt} checked={cause === opt} onChange={() => setCause(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
              <input style={{ ...inputStyle, marginTop: 12 }} value={causeDetail} onChange={e => setCauseDetail(e.target.value)} placeholder="Any extra detail (optional)" />
            </div>

            <hr style={dividerStyle} />

            {/* Evidence */}
            <div>
              <h2 style={sectionHeadingStyle}>Photos &amp; Videos</h2>
              <p style={sectionSubStyle}>At least 1 photo is required. You can add photos one at a time, and more angles help us diagnose faster.</p>
            </div>
            <FileUpload
              label="Photos of the Issue" required minFiles={1} maxFiles={10}
              accept="image/*"
              hint="JPG/PNG/HEIC · add up to 10 photos, one at a time is fine"
              state={photos} onChange={setPhotos}
            />
            <FileUpload
              label="Videos (optional)" maxFiles={3}
              accept="video/*"
              hint="Optional · short clips help · MP4/MOV"
              state={videos} onChange={setVideos}
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || photos.uploading || videos.uploading}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
                marginTop: 8, width: '100%', padding: '14px 28px',
                background: (submitting || photos.uploading || videos.uploading) ? '#93c5fd' : '#16a34a',
                border: '1.5px solid transparent', borderRadius: 9,
                fontFamily: "'Poppins', sans-serif", fontSize: 13.5, fontWeight: 700,
                letterSpacing: '.02em', textTransform: 'uppercase', color: '#fff',
                cursor: (submitting || photos.uploading || videos.uploading) ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : '🔧 Submit Maintenance Request'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#6b7280' }}>
            For emergencies (gas, flooding, electrical danger, no heating in winter), please call us directly as well.
          </div>
        </div>
      </section>
    </main>
  );
}
