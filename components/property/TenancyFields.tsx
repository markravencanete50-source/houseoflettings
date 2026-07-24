'use client';
// components/property/TenancyFields.tsx
// Staff/admin-only editor for the tenancy/deposit/accounts details shown to the
// landlord in their portal (the Gnomen-style summary). Driven by TENANCY_GROUPS
// so it always matches the portal display. Value is a flat object; onChange gives
// (key, value). Rendered inside PropertyForm; the values save onto the property.
import { TENANCY_GROUPS, type TenancyField } from '@/lib/tenancyFields';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1.5px solid var(--gray-200)',
  borderRadius: 8, fontSize: 13.5, background: '#fff', marginTop: 4,
};

function Field({ f, value, onChange }: { f: TenancyField; value: any; onChange: (k: string, v: any) => void }) {
  if (f.type === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--gray-600)', cursor: 'pointer', paddingTop: 22 }}>
        <input type="checkbox" checked={!!value} onChange={e => onChange(f.key, e.target.checked)} />
        {f.label}
      </label>
    );
  }
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label" style={{ fontSize: 12.5 }}>{f.label}</label>
      {f.type === 'select' ? (
        <select value={value || ''} onChange={e => onChange(f.key, e.target.value)} style={inputStyle}>
          {(f.options || []).map(o => <option key={o} value={o}>{o || '— Select —'}</option>)}
        </select>
      ) : (
        <input
          type={f.type === 'date' ? 'date' : f.type === 'money' ? 'number' : 'text'}
          value={value || ''}
          placeholder={f.placeholder || ''}
          step={f.type === 'money' ? '0.01' : undefined}
          onChange={e => onChange(f.key, e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  );
}

export default function TenancyFields({ value, onChange }: { value: Record<string, any>; onChange: (k: string, v: any) => void }) {
  return (
    <div>
      {TENANCY_GROUPS.map(group => (
        <div key={group.heading} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '4px 0 8px' }}>{group.heading}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px 18px' }}>
            {group.fields.map(f => <Field key={f.key} f={f} value={value[f.key]} onChange={onChange} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
