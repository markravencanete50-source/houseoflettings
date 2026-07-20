'use client';
// components/property/PropertyForm.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Property } from '@/lib/types';
import { createProperty, updateProperty } from '@/services/property';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';

interface PropertyFormProps {
  landlordId: string;
  landlordName: string;
  existing?: Property;
  onSuccess: () => void;
  onCancel: () => void;
  adminOverride?: { featured?: boolean };
  /**
   * Create through this server route instead of writing to Firestore from the
   * browser. The staff dashboard passes '/api/staff/properties': a staff member
   * is often signed in by session cookie with no Firebase client user, so a
   * browser write is unauthenticated (rules reject it) and, when Firestore is
   * unreachable, never settles at all — the form just span forever.
   */
  createVia?: string;
}

// ── Amenity toggle pill ──────────────────────────────────────────────────────
function TogglePill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        padding: '8px 14px',
        borderRadius: 20,
        border: `1.5px solid ${value ? 'var(--red)' : 'var(--gray-200)'}`,
        background: value ? 'rgba(192,57,43,0.08)' : 'transparent',
        color: value ? 'var(--red)' : 'var(--gray-600)',
        fontSize: 13,
        fontWeight: value ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {value ? '✓ ' : ''}{label}
    </button>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '16px 0 14px',
      borderBottom: '1px solid var(--gray-100)',
      marginBottom: 20,
    }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--black)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

export default function PropertyForm({
  landlordId, landlordName, existing, onSuccess, onCancel, adminOverride, createVia,
}: PropertyFormProps) {

  // ── Core fields ─────────────────────────────────────────────────────────
  const [title, setTitle]               = useState(existing?.title || '');
  const [description, setDescription]   = useState(existing?.description || '');
  const [price, setPrice]               = useState(existing?.price?.toString() || '');
  const [location, setLocation]         = useState(existing?.location || '');
  const [bedrooms, setBedrooms]         = useState(existing?.bedrooms?.toString() || '0');
  const [bathrooms, setBathrooms]       = useState(existing?.bathrooms?.toString() || '1');
  const [sqft, setSqft]                 = useState(existing?.sqft?.toString() || '');
  const [furnished, setFurnished]       = useState(existing?.furnished || 'unfurnished');
  const [availableFrom, setAvailableFrom] = useState(existing?.availableFrom || '');

  // ── New fields ──────────────────────────────────────────────────────────
  const [propertyType, setPropertyType]   = useState<'whole' | 'room'>((existing as any)?.propertyType || 'whole');
  const [depositAmount, setDepositAmount] = useState((existing as any)?.depositAmount?.toString() || '');
  const [parking, setParking]             = useState<string>((existing as any)?.parking || 'none');
  const [showAllParking, setShowAllParking] = useState(false);
  const [garden, setGarden]               = useState<'none' | 'private' | 'shared' | 'communal'>((existing as any)?.garden || 'none');
  const [balcony, setBalcony]             = useState<boolean>((existing as any)?.balcony || false);
  const [billsIncluded, setBillsIncluded] = useState<boolean>((existing as any)?.billsIncluded || false);
  const [billsNote, setBillsNote]         = useState<string>((existing as any)?.billsNote || '');
  const [videoTourUrl, setVideoTourUrl]   = useState<string>((existing as any)?.videoTourUrl || '');
  const [letAgreed, setLetAgreed]         = useState<boolean>((existing as any)?.letAgreed || false);

  // ── Postcode lookup ─────────────────────────────────────────────────────
  const [postcode, setPostcode]           = useState('');
  const [postcodeError, setPostcodeError] = useState('');
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [addressLine1, setAddressLine1]   = useState('');
  const [addressLine2, setAddressLine2]   = useState('');
  const [town, setTown]                   = useState('');

  // Keep location in sync with address fields
  useEffect(() => {
    const parts = [addressLine1, addressLine2, town, postcode.toUpperCase()].filter(Boolean);
    if (parts.length > 0) setLocation(parts.join(', '));
  }, [addressLine1, addressLine2, town, postcode]);

  const lookupPostcode = async () => {
    const clean = postcode.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) { setPostcodeError('Please enter a postcode.'); return; }
    setPostcodeError('');
    setPostcodeLoading(true);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (json.status !== 200) { setPostcodeError('Postcode not found. Please check and try again.'); return; }
      const r = json.result;
      setTown(r.admin_district || r.parliamentary_constituency || '');
      setAddressLine2(r.admin_ward || '');
      setAddressLine1('');
    } catch {
      setPostcodeError('Could not reach postcode service. Please enter your address manually.');
    } finally {
      setPostcodeLoading(false);
    }
  };

  // ── Images ──────────────────────────────────────────────────────────────
  // Each entry is either an already-uploaded URL (string) or a new local File.
  type ImageEntry = { kind: 'url'; url: string } | { kind: 'file'; file: File; preview: string };
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>(() =>
    (existing?.images || []).map(url => ({ kind: 'url' as const, url }))
  );

  // Derived helpers consumed by the rest of the form
  const previews   = imageEntries.map(e => e.kind === 'url' ? e.url : e.preview);
  const imageFiles = imageEntries.filter((e): e is Extract<ImageEntry, { kind: 'file' }> => e.kind === 'file').map(e => e.file);

  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newEntries: ImageEntry[] = acceptedFiles.map(file => ({
      kind: 'file' as const,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageEntries(prev => [...prev, ...newEntries]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 20,
  });

  const removeImage = (idx: number) => {
    setImageEntries(prev => {
      const entry = prev[idx];
      if (entry.kind === 'file') URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Native HTML5 drag-to-reorder state
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    // Kill the giant browser ghost image — replace with invisible 1px div
    const ghost = document.createElement('div');
    ghost.style.cssText = 'width:1px;height:1px;opacity:0;position:fixed;top:-9999px;left:-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => { if (document.body.contains(ghost)) document.body.removeChild(ghost); }, 0);
    e.dataTransfer.effectAllowed = 'move';
    setDragSrcIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragSrcIdx === null || dragSrcIdx === idx) { setDragSrcIdx(null); setDragOverIdx(null); return; }
    setImageEntries(prev => {
      const next = Array.from(prev);
      const [moved] = next.splice(dragSrcIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragSrcIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragSrcIdx(null);
    setDragOverIdx(null);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !price || !location) {
      setError('Please fill in all required fields.');
      return;
    }

    if (videoTourUrl && !/^https?:\/\/.+/.test(videoTourUrl)) {
      setError('Video tour URL must start with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      // Upload new local files to Cloudinary; track results in a Map keyed by File
      const fileToUrl = new Map<File, string>();
      const newFileEntries = imageEntries.filter(e => e.kind === 'file') as { kind: 'file'; file: File; preview: string }[];
      if (newFileEntries.length > 0) {
        let uploaded = 0;
        setUploadProgress(`Uploading 0 of ${newFileEntries.length} images...`);
        await Promise.all(newFileEntries.map(async ({ file }) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', CLOUDINARY_FOLDERS.properties);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Upload failed');
          fileToUrl.set(file, json.url as string);
          uploaded++;
          setUploadProgress(`Uploaded ${uploaded} of ${newFileEntries.length} images...`);
        }));
        setUploadProgress('');
      }

      // Build final image array preserving the admin's drag order
      const allImages = imageEntries
        .map(e => e.kind === 'url' ? e.url : fileToUrl.get(e.file) ?? null)
        .filter((u): u is string => !!u);

      const data: Omit<Property, 'id' | 'createdAt'> = {
        title,
        description,
        price: Number(price),
        location,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sqft: sqft ? Number(sqft) : null,
        furnished: furnished as Property['furnished'],
        availableFrom,
        images: allImages,
        landlordId,
        landlordName,
        status: 'active',
        propertyType,
        depositAmount: depositAmount ? Number(depositAmount) : null,
        parking,
        garden,
        balcony,
        billsIncluded,
        billsNote: billsIncluded ? billsNote : '',
        videoTourUrl: videoTourUrl || null,
        letAgreed,
        ...(existing?.badge ? { badge: existing.badge } : {}),
        ...(adminOverride ?? {}),
      } as any;

      if (existing?.id) {
        await updateProperty(existing.id, data, []);
      } else if (createVia) {
        const res = await fetch(createVia, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message || 'Failed to save property.');
      } else {
        await createProperty(data, []);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save property.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const suggestedDeposit = price ? (Number(price) * 5).toLocaleString() : null;

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: '#fce4ec', border: '1px solid #e57373', color: '#c62828',
          padding: '12px 16px', borderRadius: 4, marginBottom: 20, fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* ── 1. Listing Basics ─────────────────────────────────────────────── */}
      <SectionHeader icon="🏠" title="Listing Basics" subtitle="Core details shown at the top of your listing" />

      {/* Property type: whole vs room */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">Listing Type *</label>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {[
            { value: 'whole', label: '🏡  Whole Property', desc: 'Tenants rent the entire property' },
            { value: 'room',  label: '🛏  Room in Shared House', desc: 'Tenants rent a single room' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPropertyType(opt.value as 'whole' | 'room')}
              style={{
                flex: 1, padding: '12px 16px', textAlign: 'left',
                border: `1.5px solid ${propertyType === opt.value ? 'var(--red)' : 'var(--gray-200)'}`,
                borderRadius: 8,
                background: propertyType === opt.value ? 'rgba(192,57,43,0.05)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: propertyType === opt.value ? 'var(--red)' : 'var(--black)', marginBottom: 2 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Let Agreed */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">Availability</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <TogglePill label="🔴 Let Agreed" value={letAgreed} onChange={setLetAgreed} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
          When on, a red <strong>LET AGREED</strong> banner shows on the cover photo and the property is hidden from
          new tenant applications. The listing stays visible on the website.
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Property Title *</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Modern 2-Bed Apartment in Central Leeds" required />
      </div>

      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe the property, features, nearby amenities..." required
          style={{ minHeight: 130 }} />
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4, textAlign: 'right' }}>
          {description.length} chars, aim for 150+
        </div>
      </div>

      {/* ── Postcode lookup ── */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">Location *</label>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 10, marginTop: 2 }}>
          Enter the postcode below to fill in the address quickly and easily.
        </p>

        {/* Postcode row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ flex: '0 0 180px' }}>
            <label className="form-label" style={{ fontSize: 12 }}>Postcode</label>
            <input
              className="form-input"
              value={postcode}
              onChange={e => { setPostcode(e.target.value); setPostcodeError(''); }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupPostcode())}
              placeholder="e.g. LS1 4AP"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div style={{ paddingTop: 22 }}>
            <button
              type="button"
              onClick={lookupPostcode}
              disabled={postcodeLoading}
              style={{
                padding: '10px 20px', background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
                cursor: postcodeLoading ? 'not-allowed' : 'pointer',
                opacity: postcodeLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' as const,
              }}
            >
              {postcodeLoading ? '⏳ Looking up…' : '🔍 Find address'}
            </button>
          </div>
        </div>

        {postcodeError && (
          <div style={{ fontSize: 13, color: '#c62828', marginBottom: 10 }}>{postcodeError}</div>
        )}

        {/* Address fields */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Address Line 1</label>
            <input className="form-input" value={addressLine1} onChange={e => setAddressLine1(e.target.value)}
              placeholder="House number and street name" />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>
              Address Line 2 <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>optional</span>
            </label>
            <input className="form-input" value={addressLine2} onChange={e => setAddressLine2(e.target.value)}
              placeholder="Area or district" />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Town / City</label>
            <input className="form-input" value={town} onChange={e => setTown(e.target.value)}
              placeholder="e.g. Manchester" />
          </div>
        </div>

        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6,
          fontSize: 13, color: '#1e40af',
        }}>
          ℹ️ Your exact house number will never be shown publicly, only the area and postcode.
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Available From</label>
        <input className="form-input" type="date" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} />
      </div>

      {/* ── 2. Pricing & Deposit ──────────────────────────────────────────── */}
      <SectionHeader icon="💷" title="Pricing & Deposit" subtitle="Set your rent and deposit amount" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Monthly Rent (£) *</label>
          <input className="form-input" type="number" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="1500" min="0" required />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Deposit Amount (£)</span>
            {suggestedDeposit && (
              <button type="button"
                onClick={() => setDepositAmount((Number(price) * 5).toString())}
                style={{
                  fontSize: 11, color: 'var(--red)', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0,
                }}>
                Use 5-week max (£{suggestedDeposit})
              </button>
            )}
          </label>
          <input className="form-input" type="number" value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            placeholder="e.g. 1730" min="0" />
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
            Legal max is 5 weeks' rent for rents under £50,000/yr
          </div>
        </div>
      </div>

      {/* Bills */}
      <div className="form-group">
        <label className="form-label">Bills</label>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' as const }}>
          <TogglePill label="Bills Included" value={billsIncluded} onChange={v => setBillsIncluded(v)} />
          <TogglePill label="Bills Excluded" value={!billsIncluded} onChange={v => setBillsIncluded(!v)} />
        </div>
        {billsIncluded && (
          <input
            className="form-input"
            style={{ marginTop: 10 }}
            value={billsNote}
            onChange={e => setBillsNote(e.target.value)}
            placeholder="e.g. Gas, electricity and water included. Internet excluded."
          />
        )}
      </div>

      {/* ── 3. Property Details ───────────────────────────────────────────── */}
      <SectionHeader icon="📐" title="Property Details" subtitle="Size, rooms and furnishings" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="form-group">
          <label className="form-label">Bedrooms</label>
          <select className="form-select" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            <option value="0">Studio</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4 Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Bathrooms</label>
          <select className="form-select" value={bathrooms} onChange={e => setBathrooms(e.target.value)}>
            <option value="1">1 Bathroom</option>
            <option value="2">2 Bathrooms</option>
            <option value="3">3 Bathrooms</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Size (sqft)</label>
          <input className="form-input" type="number" value={sqft} onChange={e => setSqft(e.target.value)}
            placeholder="e.g. 750" min="0" />
        </div>

        <div className="form-group">
          <label className="form-label">Furnishing</label>
          <select className="form-select" value={furnished} onChange={e => setFurnished(e.target.value as "furnished" | "unfurnished" | "part-furnished")}>
            <option value="furnished">Furnished</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="part-furnished">Part Furnished</option>
          </select>
        </div>
      </div>

      {/* ── 4. Features & Amenities ───────────────────────────────────────── */}
      <SectionHeader icon="✨" title="Features & Amenities" subtitle="Help tenants filter for what matters to them" />

      {/* Parking */}
      {(() => {
        const PARKING_OPTIONS = [
          { value: 'none',                      label: 'No parking available' },
          { value: 'off-street',                label: 'Off street parking' },
          { value: 'residents',                 label: "Resident's parking" },
          { value: 'street-no-permit',          label: 'Street parking, no permit required' },
          { value: 'street-permit',             label: 'Street parking, permit required' },
          { value: 'driveway-private',          label: 'Driveway private' },
          { value: 'driveway-shared',           label: 'Driveway shared' },
          { value: 'single-garage',             label: 'Single garage' },
          { value: 'double-garage',             label: 'Double garage' },
          { value: 'garage',                    label: 'Garage' },
          { value: 'garage-en-bloc',            label: 'Garage en bloc' },
          { value: 'garage-carport',            label: 'Garage carport' },
          { value: 'garage-detached',           label: 'Garage detached' },
          { value: 'garage-integral',           label: 'Garage integral' },
          { value: 'gated',                     label: 'Gated parking' },
          { value: 'rear',                      label: 'Rear of property' },
          { value: 'undercroft',                label: 'Undercroft' },
          { value: 'underground',               label: 'Underground' },
          { value: 'underground-allocated',     label: 'Underground parking allocated space' },
          { value: 'underground-no-allocated',  label: 'Underground parking no allocated space' },
          { value: 'communal-no-allocated',     label: 'Communal car park, no allocated space' },
          { value: 'ev-private',                label: 'EV charging private' },
          { value: 'ev-shared',                 label: 'EV charging shared' },
          { value: 'disabled-available',        label: 'Disabled parking available' },
          { value: 'disabled-not-available',    label: 'Disabled parking not available' },
          { value: 'other',                     label: 'Other' },
        ];
        const INITIAL_COUNT = 6;
        const visible = showAllParking ? PARKING_OPTIONS : PARKING_OPTIONS.slice(0, INITIAL_COUNT);
        return (
          <div className="form-group">
            <label className="form-label">Parking</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginTop: 6 }}>
              {visible.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setParking(opt.value)}
                  style={{
                    padding: '7px 13px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    border: `1.5px solid ${parking === opt.value ? 'var(--red)' : 'var(--gray-200)'}`,
                    background: parking === opt.value ? 'rgba(192,57,43,0.08)' : 'transparent',
                    color: parking === opt.value ? 'var(--red)' : 'var(--gray-600)',
                    fontWeight: parking === opt.value ? 600 : 400,
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {parking === opt.value ? '✓ ' : ''}{opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllParking(p => !p)}
                style={{
                  padding: '7px 13px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: '1.5px dashed var(--gray-200)',
                  background: 'transparent',
                  color: 'var(--gray-600)',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {showAllParking ? '▲ Show less' : `▼ Show more (${PARKING_OPTIONS.length - INITIAL_COUNT} more)`}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Garden */}
      <div className="form-group">
        <label className="form-label">Garden</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginTop: 6 }}>
          {[
            { value: 'none',      label: 'No Garden' },
            { value: 'private',   label: '🌿 Private Garden' },
            { value: 'shared',    label: '🌳 Shared Garden' },
            { value: 'communal',  label: '🏞️ Communal Grounds' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGarden(opt.value as typeof garden)}
              style={{
                padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: `1.5px solid ${garden === opt.value ? 'var(--red)' : 'var(--gray-200)'}`,
                background: garden === opt.value ? 'rgba(192,57,43,0.08)' : 'transparent',
                color: garden === opt.value ? 'var(--red)' : 'var(--gray-600)',
                fontWeight: garden === opt.value ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Balcony */}
      <div className="form-group">
        <label className="form-label">Balcony / Terrace</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <TogglePill label="🏙️ Has Balcony / Terrace" value={balcony} onChange={setBalcony} />
        </div>
      </div>

      {/* ── 5. Media ──────────────────────────────────────────────────────── */}
      <SectionHeader icon="📸" title="Photos & Video Tour" subtitle="Listings with photos get 5× more enquiries" />

      {/* Video tour URL */}
      <div className="form-group">
        <label className="form-label">Video Walking Tour URL <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
        <input
          className="form-input"
          type="url"
          value={videoTourUrl}
          onChange={e => setVideoTourUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
          Paste a YouTube, Vimeo or Matterport link
        </div>
      </div>

      {/* Image upload */}
      <div className="form-group" style={{ marginTop: 8 }}>
        <label className="form-label">Property Images</label>
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? 'var(--red)' : 'var(--gray-200)'}`,
            borderRadius: 8, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? '#fff5f5' : 'var(--gray-100)',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 4 }}>
            {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to select'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Up to 20 images · JPG / PNG / WebP</div>
        </div>

        {previews.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12, marginBottom: 6 }}>
              🖱️ Drag images to reorder · First image is the cover photo
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginTop: 4,
              }}
            >
              {previews.map((src, i) => (
                <div
                  key={src + i}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'relative',
                    height: 100,
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'grab',
                    outline: dragOverIdx === i && dragSrcIdx !== i
                      ? '2px solid var(--red)'
                      : 'none',
                    opacity: dragSrcIdx === i ? 0.35 : 1,
                    transition: 'opacity 0.15s, outline 0.1s',
                    userSelect: 'none',
                  }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }} />
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '3px 0',
                      letterSpacing: 0.5, pointerEvents: 'none',
                    }}>COVER</div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                      background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                      borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                  <div style={{
                    position: 'absolute', top: 4, left: 4,
                    background: 'rgba(0,0,0,0.45)', color: '#fff',
                    fontSize: 9, fontWeight: 600, padding: '2px 5px',
                    borderRadius: 3, letterSpacing: 0.3, pointerEvents: 'none',
                  }}>{i + 1}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 32,
        paddingTop: 24, borderTop: '1px solid var(--gray-100)',
      }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '13px 32px', background: 'var(--red)', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            minWidth: 180,
          }}
        >
          {loading
            ? uploadProgress || 'Saving...'
            : existing ? 'Update Property' : 'Publish Listing'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '13px 32px', background: 'transparent', color: 'var(--black)',
            border: '1px solid var(--gray-200)', borderRadius: 4, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
