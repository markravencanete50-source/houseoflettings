'use client';
// components/valuation/RentReviewPanel.tsx
//
// Rent Review tool for the admin and staff dashboards. Pick a managed
// property and its details prefill automatically (postcode, beds, baths,
// garden, parking, balcony, current rent) — the same questions as the public
// instant-valuation form, without retyping everything. Staff only confirm the
// property type / condition / EPC, then run the AI-backed valuation to see
// conservative / market / optimistic figures and how the current rent compares.

import { useMemo, useState } from 'react';
import type { Property } from '@/lib/types';
import {
  isValidUKPostcode, fmtGBP, bedroomsLabel,
  PROPERTY_TYPE_LABEL, CONDITION_LABEL, GARDEN_LABEL, PARKING_LABEL, EPC_LABEL,
  type ValuationType, type PropertyTypeId, type ConditionId, type EpcId,
  type GardenId, type ParkingId, type FullValuationResult, type ModeValuation,
} from '@/lib/valuation/fullEngine';
import type { AiAnalysis } from '@/lib/ai/groqValuation';

// ─── Property → form mapping ─────────────────────────────────────────────────
const UK_POSTCODE_IN_TEXT = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

function extractPostcode(text: string): string {
  const m = (text || '').toUpperCase().match(UK_POSTCODE_IN_TEXT);
  return m ? m[0] : '';
}

function inferPropertyType(p: Property): PropertyTypeId | '' {
  const t = `${p.title} ${p.description || ''}`.toLowerCase();
  if (/\bflat\b|\bapartment\b|\bstudio\b|\bmaisonette\b/.test(t)) return 'flat';
  if (/\bbungalow\b/.test(t)) return 'bungalow';
  if (/\bsemi[- ]?detached\b|\bsemi\b/.test(t)) return 'semi';
  if (/\bdetached\b/.test(t)) return 'detached';
  if (/\bterrace|\bterraced\b|\bend[- ]terrace/.test(t)) return 'terraced';
  return '';
}

function mapGarden(g?: Property['garden']): GardenId {
  if (g === 'private') return 'private';
  if (g === 'shared' || g === 'communal') return 'shared';
  return 'none';
}

function mapParking(p?: Property['parking']): ParkingId {
  if (!p || p === 'none') return 'none';
  if (p.startsWith('garage') || p === 'single-garage' || p === 'double-garage') return 'garage';
  if (p.startsWith('driveway') || p === 'off-street') return 'driveway';
  if (p === 'street-permit' || p === 'residents') return 'permit';
  if (p === 'street-no-permit') return 'on_street';
  if (p === 'communal-no-allocated' || p === 'underground-no-allocated') return 'on_street';
  return 'allocated'; // allocated / underground / gated / rear / undercroft / EV bays…
}

interface ReviewReport {
  result: FullValuationResult;
  ai: AiAnalysis;
}

interface Props {
  properties: Property[];
  loading?: boolean;
  error?: string;
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelCss: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputCss: React.CSSProperties = {
  padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, color: '#111827', background: '#fff', outline: 'none', width: '100%',
};

export default function RentReviewPanel({ properties, loading, error }: Props) {
  const [propertyId, setPropertyId] = useState('');
  const [valType,   setValType]   = useState<ValuationType>('let');
  const [postcode,  setPostcode]  = useState('');
  const [address,   setAddress]   = useState('');
  const [propType,  setPropType]  = useState<PropertyTypeId | ''>('');
  const [bedrooms,  setBedrooms]  = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [condition, setCondition] = useState<ConditionId>('average');
  const [epc,       setEpc]       = useState<EpcId>('unknown');
  const [garden,    setGarden]    = useState<GardenId>('none');
  const [balcony,   setBalcony]   = useState(false);
  const [parking,   setParking]   = useState<ParkingId>('none');
  const [currentRent, setCurrentRent] = useState<number | ''>('');

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [report,  setReport]  = useState<ReviewReport | null>(null);

  const selected = useMemo(
    () => properties.find(p => p.id === propertyId) || null,
    [properties, propertyId],
  );

  // Selecting a property prefills every field we already know about it.
  const handleSelect = (id: string) => {
    setPropertyId(id);
    setReport(null);
    setRunError('');
    const p = properties.find(x => x.id === id);
    if (!p) return;
    setPostcode(extractPostcode(p.location));
    setAddress(p.title || p.location || '');
    setPropType(inferPropertyType(p));
    setBedrooms(Number.isFinite(p.bedrooms) ? p.bedrooms : 2);
    setBathrooms(Number.isFinite(p.bathrooms) && p.bathrooms > 0 ? p.bathrooms : 1);
    setGarden(mapGarden(p.garden));
    setBalcony(!!p.balcony);
    setParking(mapParking(p.parking));
    setCurrentRent(Number.isFinite(p.price) ? p.price : '');
    setCondition('average');
    setEpc('unknown');
  };

  const canRun = isValidUKPostcode(postcode) && propType !== '' && !running;

  const runValuation = async () => {
    if (!canRun) return;
    setRunning(true);
    setRunError('');
    try {
      const res = await fetch('/api/instant-valuation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: valType,
          postcode: postcode.trim(),
          addressLine1: address.trim(),
          propertyType: propType,
          bedrooms, bathrooms, condition, epc, garden, balcony, parking,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.report) throw new Error(json.message || 'Could not run the valuation.');
      setReport({ result: json.report.result, ai: json.report.ai });
    } catch (e: any) {
      setRunError(e.message || 'Could not run the valuation. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const rent = report?.result.rent;
  const sale = report?.result.sale;
  const rentNum = typeof currentRent === 'number' ? currentRent : 0;
  const rentDeltaPct = rent && rentNum > 0 ? ((rent.market - rentNum) / rentNum) * 100 : null;

  const band = (m: ModeValuation, title: string, suffix: string) => (
    <div key={m.mode} style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {([
          ['Conservative', m.conservative, false],
          ['Market Value', m.market, true],
          ['Optimistic', m.optimistic, false],
        ] as [string, number, boolean][]).map(([lab, val, mid]) => (
          <div key={lab} style={{
            border: `1.5px solid ${mid ? '#2563eb' : '#e5e7eb'}`,
            background: mid ? '#eff5ff' : '#fff',
            borderRadius: 10, padding: '12px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }}>{lab}</div>
            <div style={{ fontSize: mid ? 19 : 16, fontWeight: 800, color: mid ? '#1d4ed8' : '#0f1f3d' }}>{fmtGBP(val)}{suffix}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f1f3d', margin: '0 0 4px' }}>📈 Rent Review</h2>
      <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 }}>
        Select a property and its details fill in automatically, using the same questions as the public
        valuation form, no retyping. Adjust anything, then run the valuation to compare the
        current rent against today's market.
      </p>

      {error && (
        <p style={{ background: '#fdecea', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13.5 }}>{error}</p>
      )}

      {/* Property picker */}
      <div style={{ ...field, maxWidth: 560, marginBottom: 18 }}>
        <label style={labelCss}>Property</label>
        <select
          style={{ ...inputCss, cursor: 'pointer' }}
          value={propertyId}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={loading}
        >
          <option value="">{loading ? 'Loading properties…' : 'Select a property (auto-fills the form)...'}</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.title} · {p.location} · £{p.price?.toLocaleString('en-GB')}/mo
            </option>
          ))}
        </select>
        {selected && (
          <p style={{ fontSize: 12.5, color: '#2e7d32', margin: 0 }}>
            ✓ Details pre-filled from the listing. Review the property type, condition and EPC below.
          </p>
        )}
      </div>

      {/* Form grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, maxWidth: 820, marginBottom: 16,
      }}>
        <div style={field}>
          <label style={labelCss}>Valuation type</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={valType} onChange={e => setValType(e.target.value as ValuationType)}>
            <option value="let">Let (rent)</option>
            <option value="sale">Sale</option>
            <option value="both">Let &amp; Sale</option>
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Postcode</label>
          <input style={inputCss} value={postcode} placeholder="e.g. LS6 1AA"
            onChange={e => setPostcode(e.target.value.toUpperCase())} />
        </div>
        <div style={field}>
          <label style={labelCss}>Property type</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={propType} onChange={e => setPropType(e.target.value as PropertyTypeId)}>
            <option value="">Select…</option>
            {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyTypeId[]).map(t => (
              <option key={t} value={t}>{PROPERTY_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Bedrooms</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{bedroomsLabel(n)}</option>)}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Bathrooms</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}{n === 5 ? '+' : ''}</option>)}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Condition</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={condition} onChange={e => setCondition(e.target.value as ConditionId)}>
            {(Object.keys(CONDITION_LABEL) as ConditionId[]).map(c => (
              <option key={c} value={c}>{CONDITION_LABEL[c]}</option>
            ))}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>EPC rating</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={epc} onChange={e => setEpc(e.target.value as EpcId)}>
            {(Object.keys(EPC_LABEL) as EpcId[]).map(r => (
              <option key={r} value={r}>{EPC_LABEL[r]}</option>
            ))}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Garden</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={garden} onChange={e => setGarden(e.target.value as GardenId)}>
            {(Object.keys(GARDEN_LABEL) as GardenId[]).map(g => (
              <option key={g} value={g}>{GARDEN_LABEL[g]}</option>
            ))}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Balcony</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={balcony ? 'yes' : 'no'} onChange={e => setBalcony(e.target.value === 'yes')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Parking</label>
          <select style={{ ...inputCss, cursor: 'pointer' }} value={parking} onChange={e => setParking(e.target.value as ParkingId)}>
            {(Object.keys(PARKING_LABEL) as ParkingId[]).map(p => (
              <option key={p} value={p}>{PARKING_LABEL[p]}</option>
            ))}
          </select>
        </div>
        <div style={field}>
          <label style={labelCss}>Current rent (£/mo)</label>
          <input style={inputCss} type="number" min={0} value={currentRent}
            placeholder="e.g. 950"
            onChange={e => setCurrentRent(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>

      {runError && <p style={{ color: '#c62828', fontSize: 13.5, margin: '0 0 12px' }}>{runError}</p>}

      <button
        onClick={runValuation}
        disabled={!canRun}
        style={{
          background: canRun ? '#2563eb' : '#9db4d8', color: '#fff', border: 'none',
          borderRadius: 8, padding: '12px 26px', fontSize: 14.5, fontWeight: 700,
          cursor: canRun ? 'pointer' : 'not-allowed', marginBottom: 24,
        }}
      >
        {running ? 'Analysing the market…' : 'Run valuation →'}
      </button>

      {/* ── Result ── */}
      {report && (
        <div style={{
          border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 24px',
          background: '#fff', maxWidth: 820,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563eb', margin: '0 0 4px' }}>
            Valuation result
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d', margin: '0 0 2px' }}>
            {address || report.result.postcode} · {report.result.areaLabel}
          </p>
          <p style={{ fontSize: 12.5, color: '#9ca3af', margin: '0 0 18px' }}>
            {report.result.dataYear} market data{report.result.isOperatingArea ? ' · district-level baseline' : ` · ${report.result.regionLabel} regional baseline`}
          </p>

          {rent && band(rent, 'Estimated Monthly Rent', '/mo')}
          {sale && band(sale, 'Estimated Sale Price', '')}

          {/* Current rent comparison */}
          {rent && rentNum > 0 && rentDeltaPct !== null && (
            <div style={{
              borderRadius: 10, padding: '14px 16px', margin: '4px 0 18px',
              background: rentDeltaPct >= 5 ? '#e8f5e9' : rentDeltaPct <= -5 ? '#fff3e0' : '#f6f9fc',
              border: `1px solid ${rentDeltaPct >= 5 ? '#c8e6c9' : rentDeltaPct <= -5 ? '#ffe0b2' : '#e5e7eb'}`,
            }}>
              <p style={{ fontSize: 13.5, color: '#0f1f3d', margin: 0, lineHeight: 1.65 }}>
                <strong>Current rent {fmtGBP(rentNum)}/mo vs market {fmtGBP(rent.market)}/mo: {rentDeltaPct >= 0 ? '+' : ''}{rentDeltaPct.toFixed(1)}%.</strong>{' '}
                {rentDeltaPct >= 5
                  ? `The property appears under-rented. A review towards ${fmtGBP(rent.conservative)}–${fmtGBP(rent.market)}/mo looks supportable (subject to tenancy terms and Section 13 rules).`
                  : rentDeltaPct <= -5
                    ? 'The current rent is above today\'s market estimate, so an increase is unlikely to be supportable right now.'
                    : 'The current rent is broadly in line with the market.'}
              </p>
            </div>
          )}

          <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: '0 0 12px' }}>{report.ai.summary}</p>
          {report.ai.rentCommentary && (
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: '0 0 12px' }}>{report.ai.rentCommentary}</p>
          )}
          {report.ai.saleCommentary && (
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: '0 0 12px' }}>{report.ai.saleCommentary}</p>
          )}
          <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
            {report.ai.keyDrivers.map((d, i) => (
              <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{d}</li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
            Automated, indicative estimate, not a formal valuation. Rent increases for existing
            tenancies must follow the tenancy agreement and statutory notice rules.
          </p>
        </div>
      )}
    </div>
  );
}
