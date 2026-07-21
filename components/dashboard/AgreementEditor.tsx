'use client';
// components/dashboard/AgreementEditor.tsx
// Inline editor for a signed landlord agreement in the staff dashboard. Staff
// correct the landlord/property details or change the package, then choose:
//   • Save changes            — update the record only (no email)
//   • Save & email corrected  — regenerate the PDF and email an updated copy
//   • Save & re-issue          — email the landlord a link to review and re-sign
import { useState } from 'react';
import { BUNDLES } from '@/lib/bundles';

type Mode = 'save' | 'correct' | 'reissue';

const FIELDS = [
  'fullName', 'email', 'phone', 'contactAddress',
  'jointLandlord', 'landlord2Name', 'residency',
  'postcode', 'street', 'city', 'flatNumber',
  'propertyType', 'bedrooms', 'bathrooms', 'receptions',
  'furnishing', 'parking', 'currentRent', 'availableFrom', 'securityNote',
  'selectedPackage', 'selectedPackageId',
] as const;

const PROPERTY_TYPES = ['Flat', 'Terraced house', 'Semi-detached house', 'Detached house', 'Bungalow', 'Maisonette', 'Studio', 'Room / HMO', 'Other'];
const COUNTS = ['Studio', '1', '2', '3', '4+'];
const BATH_COUNTS = ['1', '2', '3', '4+'];
const FURNISHINGS = ['Furnished', 'Part-furnished', 'Unfurnished'];
const PARKINGS = ['None', 'On-street', 'Driveway', 'Garage', 'Allocated space'];

export default function AgreementEditor({
  agreement,
  onSave,
  onCancel,
}: {
  agreement: Record<string, any>;
  // Returns true on success. Parent performs the PATCH and updates its list.
  onSave: (fields: Record<string, any>, mode: Mode) => Promise<boolean>;
  onCancel: () => void;
}) {
  const init: Record<string, any> = {};
  for (const k of FIELDS) init[k] = agreement[k] ?? (k === 'jointLandlord' ? false : '');
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [err, setErr] = useState('');

  const set = (k: string, v: any) => setF(s => ({ ...s, [k]: v }));

  const run = async (mode: Mode) => {
    setErr('');
    if (!f.fullName?.trim() || !f.email?.trim()) { setErr('Name and email are required.'); return; }
    if ((mode === 'correct' || mode === 'reissue') && !BUNDLES.some(b => b.label === f.selectedPackage)) {
      setErr('Choose a valid package before sending.'); return;
    }
    setBusy(mode);
    const ok = await onSave(f, mode);
    setBusy(null);
    if (!ok) setErr('Could not save. Please try again.');
  };

  const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '8px 10px', fontSize: 13.5, background: '#fff', boxSizing: 'border-box' };
  const Lbl = ({ t }: { t: string }) => <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 4 }}>{t}</div>;
  const Cell = ({ t, children }: { t: string; children: React.ReactNode }) => <div><Lbl t={t} />{children}</div>;

  return (
    <div style={{ borderTop: '1px solid var(--gray-100)', padding: '18px 20px', background: '#fff' }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>Edit agreement</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        <Cell t="Full name"><input style={inp} value={f.fullName} onChange={e => set('fullName', e.target.value)} /></Cell>
        <Cell t="Email"><input style={inp} value={f.email} onChange={e => set('email', e.target.value)} /></Cell>
        <Cell t="Phone"><input style={inp} value={f.phone} onChange={e => set('phone', e.target.value)} /></Cell>
        <Cell t="Contact address"><input style={inp} value={f.contactAddress} onChange={e => set('contactAddress', e.target.value)} /></Cell>
        <Cell t="Residency">
          <select style={inp} value={f.residency} onChange={e => set('residency', e.target.value)}>
            <option value="">Select…</option>
            <option value="resident">UK-resident</option>
            <option value="non-resident">Non-resident (NRL)</option>
          </select>
        </Cell>
        <Cell t="Joint landlord name">
          <input style={inp} value={f.landlord2Name} onChange={e => { set('landlord2Name', e.target.value); set('jointLandlord', !!e.target.value.trim()); }} placeholder="Leave blank if none" />
        </Cell>

        <Cell t="Postcode"><input style={inp} value={f.postcode} onChange={e => set('postcode', e.target.value)} /></Cell>
        <Cell t="Address (first line)"><input style={inp} value={f.street} onChange={e => set('street', e.target.value)} /></Cell>
        <Cell t="Town / city"><input style={inp} value={f.city} onChange={e => set('city', e.target.value)} /></Cell>
        <Cell t="Flat / unit"><input style={inp} value={f.flatNumber} onChange={e => set('flatNumber', e.target.value)} /></Cell>
        <Cell t="Property type">
          <select style={inp} value={f.propertyType} onChange={e => set('propertyType', e.target.value)}>
            <option value="">Select…</option>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Cell>
        <Cell t="Bedrooms">
          <select style={inp} value={f.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
            <option value="">-</option>{COUNTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Cell>
        <Cell t="Bathrooms">
          <select style={inp} value={f.bathrooms} onChange={e => set('bathrooms', e.target.value)}>
            <option value="">-</option>{BATH_COUNTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Cell>
        <Cell t="Receptions">
          <select style={inp} value={f.receptions} onChange={e => set('receptions', e.target.value)}>
            <option value="">-</option>{BATH_COUNTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Cell>
        <Cell t="Furnishing">
          <select style={inp} value={f.furnishing} onChange={e => set('furnishing', e.target.value)}>
            <option value="">-</option>{FURNISHINGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Cell>
        <Cell t="Parking">
          <select style={inp} value={f.parking} onChange={e => set('parking', e.target.value)}>
            <option value="">-</option>{PARKINGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Cell>
        <Cell t="Expected rent (£/month)"><input style={inp} value={f.currentRent} onChange={e => set('currentRent', e.target.value.replace(/[^\d]/g, ''))} /></Cell>
        <Cell t="Available from"><input type="date" style={inp} value={f.availableFrom} onChange={e => set('availableFrom', e.target.value)} /></Cell>
        <Cell t="Package">
          <select style={inp} value={f.selectedPackage} onChange={e => {
            const b = BUNDLES.find(x => x.label === e.target.value);
            setF(s => ({ ...s, selectedPackage: e.target.value, selectedPackageId: b?.id || '' }));
          }}>
            <option value="">Select…</option>{BUNDLES.map(b => <option key={b.id} value={b.label}>{b.label}</option>)}
          </select>
        </Cell>
      </div>

      {err && <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <button onClick={() => run('save')} disabled={!!busy} style={btn('#2563eb')}>
          {busy === 'save' ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={() => run('correct')} disabled={!!busy} style={btn('#16a34a')}>
          {busy === 'correct' ? 'Sending…' : 'Save & email corrected copy'}
        </button>
        <button onClick={() => run('reissue')} disabled={!!busy} style={btn('#ea580c')}>
          {busy === 'reissue' ? 'Sending…' : 'Save & re-issue for signature'}
        </button>
        <button onClick={onCancel} disabled={!!busy} style={{ ...btn('#fff'), color: 'var(--gray-600)', border: '1px solid var(--gray-200)' }}>
          Cancel
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 10, lineHeight: 1.5 }}>
        “Corrected copy” keeps the original signature and emails an updated PDF. “Re-issue” asks the landlord to review the changes and sign again (their old signature no longer applies).
      </p>
    </div>
  );
}

const btn = (bg: string): React.CSSProperties => ({
  background: bg, color: bg === '#fff' ? undefined : '#fff', border: '1px solid transparent',
  borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
});
