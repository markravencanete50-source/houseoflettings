'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { lookupPostcode, isOperatingArea, TIER_PRICING_2026 } from '@/lib/valuation/operatingAreaPostcodes';

// ─── Types ───────────────────────────────────────────────────────────────────
type ValuationType = 'let' | 'sale' | 'both';
type PropertyType  = 'flat' | 'terraced' | 'semi' | 'detached';
type GardenType    = 'private' | 'shared' | 'patio' | 'none';
type ParkingType   = 'garage' | 'driveway' | 'allocated' | 'permit' | 'on_street' | 'none';
type View          = 'questions' | 'contact' | 'declined' | 'sent';

interface LeadInfo {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}

interface ValuationResult {
  low:           number;
  mid:           number;
  high:          number;
  area:          string;
  subArea:       string;
  adjustmentPct: number;
  // for 'both' we also store sale figures
  saleLow?:  number;
  saleMid?:  number;
  saleHigh?: number;
}

// ─── Multipliers & adjustments ───────────────────────────────────────────────
const BEDROOM_MULT: Record<number, number> = {
  0: 0.55, 1: 0.70, 2: 0.88, 3: 1.00, 4: 1.22, 5: 1.45, 6: 1.65,
};
const PROP_SALE_MULT: Record<PropertyType, number> = {
  flat: 0.72, terraced: 0.88, semi: 1.00, detached: 1.32,
};
const PROP_RENT_MULT: Record<PropertyType, number> = {
  flat: 0.82, terraced: 0.92, semi: 1.00, detached: 1.18,
};
const BATHROOM_PCT_PER_EXTRA = 0.045;
const MAX_BATHROOM_BONUS_COUNT = 3;
const GARDEN_PCT: Record<GardenType, number> = {
  private: 0.09, shared: 0.03, patio: 0.02, none: 0,
};
const PARKING_PCT: Record<ParkingType, number> = {
  garage: 0.06, driveway: 0.05, allocated: 0.04, permit: 0.015, on_street: 0, none: 0,
};
const BALCONY_PCT = 0.03;

function calcForType(
  postcode: string, propType: PropertyType, bedrooms: number,
  valType: 'rent' | 'sale',
  bathrooms: number, hasBalcony: boolean, garden: GardenType, parking: ParkingType,
): { low: number; mid: number; high: number; area: string; subArea: string; adjustmentPct: number } | null {
  const info = lookupPostcode(postcode);
  if (!info) return null;
  const base = valType === 'rent'
    ? TIER_PRICING_2026[info.tier].avgRent
    : TIER_PRICING_2026[info.tier].avgSale;
  const propMult = valType === 'rent' ? PROP_RENT_MULT[propType] : PROP_SALE_MULT[propType];
  const bedMult  = BEDROOM_MULT[Math.min(Math.max(bedrooms, 0), 6)] ?? 1.0;
  const extraBath = Math.min(Math.max(bathrooms - 1, 0), MAX_BATHROOM_BONUS_COUNT);
  const adjustmentPct = (extraBath * BATHROOM_PCT_PER_EXTRA)
    + (hasBalcony ? BALCONY_PCT : 0)
    + GARDEN_PCT[garden]
    + PARKING_PCT[parking];
  const mid  = Math.round((base * propMult * bedMult * (1 + adjustmentPct)) / 500) * 500;
  const low  = Math.round(mid * 0.92 / 500) * 500;
  const high = Math.round(mid * 1.08 / 500) * 500;
  return { low, mid, high, area: info.area, subArea: info.subArea, adjustmentPct };
}

// ─── Validation ───────────────────────────────────────────────────────────────
function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
function isValidUKPhone(p: string) {
  const c = p.replace(/[\s()-]/g, '');
  return /^(\+44\d{9,10}|0\d{9,10})$/.test(c);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtFull(n: number) {
  return `£${n.toLocaleString('en-GB')}`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InstantValuationPage() {
  // View state
  const [view, setView] = useState<View>('questions');

  // Question fields
  const [valType,    setValType]    = useState<ValuationType | ''>('');
  const [postcode,   setPostcode]   = useState('');
  const [postcodeErr,setPostcodeErr]= useState('');
  const [propType,   setPropType]   = useState<PropertyType | ''>('');
  const [bedrooms,   setBedrooms]   = useState<number | ''>('');
  const [bathrooms,  setBathrooms]  = useState<number | ''>('');
  const [balcony,    setBalcony]    = useState<boolean | ''>('');
  const [garden,     setGarden]     = useState<GardenType | ''>('');
  const [parking,    setParking]    = useState<ParkingType | ''>('');

  // Contact fields
  const [lead,       setLead]       = useState<LeadInfo>({ firstName: '', lastName: '', email: '', phone: '' });
  const [leadErrors, setLeadErrors] = useState<Partial<LeadInfo>>({});
  const [submitting, setSubmitting] = useState(false);

  // Computed result (built when user hits Yes)
  const [result, setResult] = useState<ValuationResult | null>(null);

  // Are all questions answered?
  const allAnswered = (
    valType !== '' &&
    postcode.trim() !== '' &&
    propType !== '' &&
    bedrooms !== '' &&
    bathrooms !== '' &&
    balcony !== '' &&
    garden !== '' &&
    parking !== ''
  );

  // Validate postcode on blur / when user stops typing
  const validatePostcode = useCallback(() => {
    const clean = postcode.trim();
    if (!clean) { setPostcodeErr(''); return; }
    if (!isOperatingArea(clean)) {
      setPostcodeErr('We currently cover Leeds, Manchester, Bradford, and across Yorkshire.');
    } else {
      setPostcodeErr('');
    }
  }, [postcode]);

  useEffect(() => {
    if (postcode.trim().length >= 5) validatePostcode();
  }, [postcode, validatePostcode]);

  // Build result when user clicks Yes
  const buildResult = useCallback((): ValuationResult | null => {
    if (!allAnswered || postcodeErr) return null;
    const shared = {
      propType: propType as PropertyType,
      bedrooms: bedrooms as number,
      bathrooms: bathrooms as number,
      balcony: balcony as boolean,
      garden: garden as GardenType,
      parking: parking as ParkingType,
    };

    if (valType === 'let') {
      const r = calcForType(postcode, shared.propType, shared.bedrooms, 'rent',
        shared.bathrooms, shared.balcony, shared.garden, shared.parking);
      if (!r) return null;
      return r;
    }

    if (valType === 'sale') {
      const r = calcForType(postcode, shared.propType, shared.bedrooms, 'sale',
        shared.bathrooms, shared.balcony, shared.garden, shared.parking);
      if (!r) return null;
      return r;
    }

    // both
    const rent = calcForType(postcode, shared.propType, shared.bedrooms, 'rent',
      shared.bathrooms, shared.balcony, shared.garden, shared.parking);
    const sale = calcForType(postcode, shared.propType, shared.bedrooms, 'sale',
      shared.bathrooms, shared.balcony, shared.garden, shared.parking);
    if (!rent || !sale) return null;
    return {
      ...rent,
      saleLow:  sale.low,
      saleMid:  sale.mid,
      saleHigh: sale.high,
    };
  }, [allAnswered, postcodeErr, valType, postcode, propType, bedrooms, bathrooms, balcony, garden, parking]);

  const handleYes = () => {
    // Final postcode validation
    if (!isOperatingArea(postcode.trim())) {
      setPostcodeErr('We currently cover Leeds, Manchester, Bradford, and across Yorkshire.');
      return;
    }
    const r = buildResult();
    if (!r) return;
    setResult(r);
    setView('contact');
  };

  const handleNo = () => {
    setView('declined');
  };

  const validateContact = (): boolean => {
    const errors: Partial<LeadInfo> = {};
    if (!lead.firstName.trim()) errors.firstName = 'First name is required.';
    if (!lead.lastName.trim())  errors.lastName  = 'Last name is required.';
    if (!lead.email.trim())     errors.email = 'Email address is required.';
    else if (!isValidEmail(lead.email)) errors.email = 'Please enter a valid email address.';
    if (!lead.phone.trim())     errors.phone = 'Phone number is required.';
    else if (!isValidUKPhone(lead.phone)) errors.phone = 'Please enter a valid UK phone number.';
    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitContact = async () => {
    if (!validateContact() || !result) return;
    setSubmitting(true);
    try {
      await fetch('/api/instant-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:     lead.firstName,
          lastName:      lead.lastName,
          email:         lead.email,
          phone:         lead.phone,
          valuationType: valType,
          postcode:      postcode.trim().toUpperCase(),
          area:          result.area,
          subArea:       result.subArea,
          propertyType:  propType,
          bedrooms,
          bathrooms,
          balcony,
          garden,
          parking,
          low:           result.low,
          mid:           result.mid,
          high:          result.high,
          saleLow:       result.saleLow,
          saleMid:       result.saleMid,
          saleHigh:      result.saleHigh,
          adjustmentPct: result.adjustmentPct,
          period:        valType === 'sale' ? '' : '/month',
        }),
      });
      setView('sent');
    } catch {
      // Still move to sent — don't block the user
      setView('sent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setView('questions');
    setValType(''); setPostcode(''); setPostcodeErr('');
    setPropType(''); setBedrooms(''); setBathrooms('');
    setBalcony(''); setGarden(''); setParking('');
    setLead({ firstName: '', lastName: '', email: '', phone: '' });
    setLeadErrors({});
    setResult(null);
  };

  const updateLead = (field: keyof LeadInfo, val: string) =>
    setLead((prev) => ({ ...prev, [field]: val }));

  return (
    <>
      <style>{`
        /* ── Base ─────────────────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; }
        .iv-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 1rem 5rem;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        /* ── Header ───────────────────────────────────────────────────── */
        .iv-header {
          width: 100%;
          max-width: 720px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 0;
        }
        .iv-back-link {
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: color 0.2s;
        }
        .iv-back-link:hover { color: #fff; }
        .iv-logo-text {
          font-size: 1rem;
          font-weight: 700;
          color: #f0c040;
          letter-spacing: 0.02em;
        }
        /* ── Page title ───────────────────────────────────────────────── */
        .iv-page-title {
          width: 100%;
          max-width: 720px;
          margin: 0 0 2rem;
        }
        .iv-page-title h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 0.5rem;
          line-height: 1.2;
        }
        .iv-page-title p {
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
          margin: 0;
        }
        /* ── Single page card ─────────────────────────────────────────── */
        .iv-sheet {
          width: 100%;
          max-width: 720px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 1.5rem;
          overflow: hidden;
        }
        /* ── Section within the sheet ─────────────────────────────────── */
        .iv-section {
          padding: 2rem 2.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .iv-section:last-child { border-bottom: none; }
        .iv-section__label {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f0c040;
          margin: 0 0 0.75rem;
        }
        .iv-section__title {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 1.25rem;
        }
        /* ── Card grid (valuation type, property type) ────────────────── */
        .iv-cards {
          display: grid;
          gap: 0.75rem;
        }
        .iv-cards--2 { grid-template-columns: 1fr 1fr; }
        .iv-cards--3 { grid-template-columns: 1fr 1fr 1fr; }
        .iv-cards--4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .iv-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.3rem;
          padding: 1rem 1.125rem;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 0.875rem;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.18s, background 0.18s, transform 0.14s;
          color: #fff;
          width: 100%;
        }
        .iv-card:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.22);
          transform: translateY(-2px);
        }
        .iv-card--active {
          border-color: #2563eb;
          background: rgba(37,99,235,0.16);
        }
        .iv-card__icon  { font-size: 1.5rem; line-height: 1; }
        .iv-card__label { font-size: 0.9375rem; font-weight: 600; }
        .iv-card__desc  { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
        /* ── Pill buttons (bedrooms, bathrooms) ───────────────────────── */
        .iv-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
        }
        .iv-pill {
          padding: 0.6rem 1.125rem;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 2rem;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s;
          white-space: nowrap;
        }
        .iv-pill:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.28); }
        .iv-pill--active { border-color: #2563eb; background: rgba(37,99,235,0.2); }
        /* ── Postcode input ───────────────────────────────────────────── */
        .iv-postcode-wrap { display: flex; gap: 0.75rem; align-items: flex-start; }
        .iv-input {
          flex: 1;
          padding: 0.8125rem 1rem;
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.13);
          border-radius: 0.75rem;
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          outline: none;
          transition: border-color 0.18s;
          width: 100%;
        }
        .iv-input::placeholder { color: rgba(255,255,255,0.28); font-weight: 400; letter-spacing: 0; }
        .iv-input:focus { border-color: #2563eb; }
        .iv-input--error { border-color: #ef4444 !important; }
        .iv-error {
          color: #fca5a5;
          font-size: 0.8125rem;
          margin: 0.5rem 0 0;
        }
        /* ── Yes/No gate ──────────────────────────────────────────────── */
        .iv-gate {
          padding: 2rem 2.25rem;
          background: rgba(240,192,64,0.06);
          border-top: 1px solid rgba(240,192,64,0.18);
        }
        .iv-gate__title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.375rem;
        }
        .iv-gate__sub {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.5);
          margin: 0 0 1.25rem;
        }
        .iv-gate__btns {
          display: flex;
          gap: 0.875rem;
        }
        .iv-gate__btn {
          padding: 0.875rem 2.25rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          border: none;
        }
        .iv-gate__btn--yes {
          background: #2563eb;
          color: #fff;
        }
        .iv-gate__btn--yes:hover { background: #1d4ed8; transform: translateY(-1px); }
        .iv-gate__btn--no {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.6);
          border: 1.5px solid rgba(255,255,255,0.15);
        }
        .iv-gate__btn--no:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .iv-gate--locked {
          opacity: 0.4;
          pointer-events: none;
          user-select: none;
        }
        .iv-gate__locked-msg {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.4);
          font-style: italic;
        }
        /* ── Contact view ─────────────────────────────────────────────── */
        .iv-contact-view {
          width: 100%;
          max-width: 720px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 1.5rem;
          padding: 2.5rem 2.25rem;
        }
        .iv-contact-view__back {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 1.5rem;
          transition: color 0.18s;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .iv-contact-view__back:hover { color: #fff; }
        .iv-contact-view h2 {
          font-size: 1.625rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 0.5rem;
        }
        .iv-contact-view p.sub {
          color: rgba(255,255,255,0.5);
          font-size: 0.9375rem;
          margin: 0 0 2rem;
        }
        .iv-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.125rem;
        }
        .iv-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .iv-form-field label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .iv-form-field .iv-input {
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0;
        }
        .iv-submit-btn {
          width: 100%;
          margin-top: 1.75rem;
          padding: 1rem;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 0.875rem;
          font-size: 1.0625rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.18s, transform 0.14s;
        }
        .iv-submit-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
        .iv-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .iv-privacy {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          line-height: 1.6;
          margin: 1rem 0 0;
          text-align: center;
        }
        /* ── Declined / Sent views ────────────────────────────────────── */
        .iv-outcome {
          width: 100%;
          max-width: 720px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 1.5rem;
          padding: 3.5rem 2.25rem;
          text-align: center;
        }
        .iv-outcome__icon { font-size: 3rem; margin-bottom: 1rem; }
        .iv-outcome h2 {
          font-size: 1.625rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 0.75rem;
        }
        .iv-outcome p {
          color: rgba(255,255,255,0.55);
          font-size: 0.9375rem;
          line-height: 1.7;
          margin: 0 0 2rem;
          max-width: 460px;
          margin-left: auto;
          margin-right: auto;
        }
        .iv-outcome__links {
          display: flex;
          gap: 0.875rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .iv-outcome__btn {
          padding: 0.875rem 1.75rem;
          border-radius: 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.18s;
        }
        .iv-outcome__btn--primary {
          background: #2563eb;
          color: #fff;
          border: none;
        }
        .iv-outcome__btn--primary:hover { background: #1d4ed8; }
        .iv-outcome__btn--outline {
          background: transparent;
          color: rgba(255,255,255,0.65);
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .iv-outcome__btn--outline:hover { color: #fff; border-color: rgba(255,255,255,0.45); }
        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 600px) {
          .iv-section { padding: 1.5rem 1.25rem; }
          .iv-cards--3 { grid-template-columns: 1fr 1fr; }
          .iv-cards--4 { grid-template-columns: 1fr 1fr; }
          .iv-form-grid { grid-template-columns: 1fr; }
          .iv-contact-view { padding: 2rem 1.25rem; }
          .iv-gate { padding: 1.5rem 1.25rem; }
          .iv-gate__btns { flex-direction: column; }
          .iv-gate__btn { width: 100%; text-align: center; }
          .iv-page-title h1 { font-size: 1.5rem; }
          .iv-outcome { padding: 2.5rem 1.25rem; }
        }
      `}</style>

      <div className="iv-page">
        <header className="iv-header">
          <Link href="/" className="iv-back-link">← Back to site</Link>
          <span className="iv-logo-text">House of Lettings</span>
        </header>

        {/* ── QUESTIONS VIEW ── */}
        {view === 'questions' && (
          <>
            <div className="iv-page-title">
              <h1>Instant Property Valuation</h1>
              <p>Answer the questions below and we'll send your personalised report straight to your inbox.</p>
            </div>

            <div className="iv-sheet">

              {/* 1 — Valuation type */}
              <div className="iv-section">
                <p className="iv-section__label">Step 1</p>
                <p className="iv-section__title">What type of valuation do you need?</p>
                <div className="iv-cards iv-cards--3">
                  {([
                    { id: 'let',  label: 'Let',          icon: '🏠', desc: 'Monthly rental estimate' },
                    { id: 'sale', label: 'Sale',          icon: '🏷️', desc: 'Property sale price estimate' },
                    { id: 'both', label: 'Let & Sale',    icon: '📊', desc: 'Both rental and sale estimates' },
                  ] as { id: ValuationType; label: string; icon: string; desc: string }[]).map(({ id, label, icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setValType(id)}
                      className={`iv-card ${valType === id ? 'iv-card--active' : ''}`}
                    >
                      <span className="iv-card__icon">{icon}</span>
                      <span className="iv-card__label">{label}</span>
                      <span className="iv-card__desc">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2 — Postcode */}
              <div className="iv-section">
                <p className="iv-section__label">Step 2</p>
                <p className="iv-section__title">What's the property postcode?</p>
                <input
                  type="text"
                  className={`iv-input ${postcodeErr ? 'iv-input--error' : ''}`}
                  placeholder="e.g. LS6 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  onBlur={validatePostcode}
                  maxLength={8}
                />
                {postcodeErr && <p className="iv-error">{postcodeErr}</p>}
              </div>

              {/* 3 — Property type */}
              <div className="iv-section">
                <p className="iv-section__label">Step 3</p>
                <p className="iv-section__title">What type of property is it?</p>
                <div className="iv-cards iv-cards--4">
                  {([
                    { id: 'flat',     label: 'Flat / Apartment', icon: '🏢' },
                    { id: 'terraced', label: 'Terraced',          icon: '🏘️' },
                    { id: 'semi',     label: 'Semi-Detached',     icon: '🏡' },
                    { id: 'detached', label: 'Detached',           icon: '🏠' },
                  ] as { id: PropertyType; label: string; icon: string }[]).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setPropType(id)}
                      className={`iv-card ${propType === id ? 'iv-card--active' : ''}`}
                    >
                      <span className="iv-card__icon">{icon}</span>
                      <span className="iv-card__label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 — Bedrooms */}
              <div className="iv-section">
                <p className="iv-section__label">Step 4</p>
                <p className="iv-section__title">How many bedrooms?</p>
                <div className="iv-pills">
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBedrooms(n)}
                      className={`iv-pill ${bedrooms === n ? 'iv-pill--active' : ''}`}
                    >
                      {n === 0 ? 'Studio' : `${n} bed${n > 1 ? 's' : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5 — Bathrooms */}
              <div className="iv-section">
                <p className="iv-section__label">Step 5</p>
                <p className="iv-section__title">How many bathrooms?</p>
                <div className="iv-pills">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBathrooms(n)}
                      className={`iv-pill ${bathrooms === n ? 'iv-pill--active' : ''}`}
                    >
                      {n === 4 ? '4+' : n} bath{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6 — Balcony */}
              <div className="iv-section">
                <p className="iv-section__label">Step 6</p>
                <p className="iv-section__title">Does the property have a balcony?</p>
                <div className="iv-cards iv-cards--2">
                  {([
                    { val: true,  label: 'Yes', icon: '🌇' },
                    { val: false, label: 'No',  icon: '🚫' },
                  ] as { val: boolean; label: string; icon: string }[]).map(({ val, label, icon }) => (
                    <button
                      key={String(val)}
                      onClick={() => setBalcony(val)}
                      className={`iv-card ${balcony === val ? 'iv-card--active' : ''}`}
                    >
                      <span className="iv-card__icon">{icon}</span>
                      <span className="iv-card__label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7 — Garden */}
              <div className="iv-section">
                <p className="iv-section__label">Step 7</p>
                <p className="iv-section__title">What type of garden does it have?</p>
                <div className="iv-cards iv-cards--4">
                  {([
                    { id: 'private', label: 'Private',          icon: '🌳' },
                    { id: 'shared',  label: 'Shared / Communal', icon: '🌿' },
                    { id: 'patio',   label: 'Patio / Courtyard', icon: '🪴' },
                    { id: 'none',    label: 'No Garden',          icon: '🚫' },
                  ] as { id: GardenType; label: string; icon: string }[]).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setGarden(id)}
                      className={`iv-card ${garden === id ? 'iv-card--active' : ''}`}
                    >
                      <span className="iv-card__icon">{icon}</span>
                      <span className="iv-card__label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 8 — Parking */}
              <div className="iv-section">
                <p className="iv-section__label">Step 8</p>
                <p className="iv-section__title">What type of parking is available?</p>
                <div className="iv-cards iv-cards--3">
                  {([
                    { id: 'garage',    label: 'Garage',                  icon: '🚪' },
                    { id: 'driveway',  label: 'Driveway (off-street)',    icon: '🛣️' },
                    { id: 'allocated', label: 'Allocated Space',           icon: '🅿️' },
                    { id: 'permit',    label: 'Permit Parking',            icon: '🎫' },
                    { id: 'on_street', label: 'On-Street',                 icon: '🚗' },
                    { id: 'none',      label: 'No Parking',               icon: '🚫' },
                  ] as { id: ParkingType; label: string; icon: string }[]).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setParking(id)}
                      className={`iv-card ${parking === id ? 'iv-card--active' : ''}`}
                    >
                      <span className="iv-card__icon">{icon}</span>
                      <span className="iv-card__label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Yes / No gate ── */}
              <div className={`iv-gate ${!allAnswered || postcodeErr ? 'iv-gate--locked' : ''}`}>
                {!allAnswered ? (
                  <p className="iv-gate__locked-msg">Complete all questions above to receive your valuation.</p>
                ) : (
                  <>
                    <p className="iv-gate__title">Would you like to receive your instant valuation?</p>
                    <p className="iv-gate__sub">Your personalised report will be emailed to you immediately.</p>
                    <div className="iv-gate__btns">
                      <button className="iv-gate__btn iv-gate__btn--yes" onClick={handleYes}>
                        ✅ Yes, send my valuation
                      </button>
                      <button className="iv-gate__btn iv-gate__btn--no" onClick={handleNo}>
                        No thanks
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </>
        )}

        {/* ── CONTACT VIEW ── */}
        {view === 'contact' && (
          <div className="iv-contact-view">
            <button className="iv-contact-view__back" onClick={() => setView('questions')}>
              ← Back to questions
            </button>
            <h2>Just a few details</h2>
            <p className="sub">We'll email your valuation report straight away. No spam, no obligation.</p>

            <div className="iv-form-grid">
              <div className="iv-form-field">
                <label htmlFor="iv-fn">First name</label>
                <input
                  id="iv-fn"
                  type="text"
                  className={`iv-input ${leadErrors.firstName ? 'iv-input--error' : ''}`}
                  placeholder="Jane"
                  value={lead.firstName}
                  onChange={(e) => updateLead('firstName', e.target.value)}
                  autoFocus
                />
                {leadErrors.firstName && <p className="iv-error">{leadErrors.firstName}</p>}
              </div>

              <div className="iv-form-field">
                <label htmlFor="iv-ln">Last name</label>
                <input
                  id="iv-ln"
                  type="text"
                  className={`iv-input ${leadErrors.lastName ? 'iv-input--error' : ''}`}
                  placeholder="Smith"
                  value={lead.lastName}
                  onChange={(e) => updateLead('lastName', e.target.value)}
                />
                {leadErrors.lastName && <p className="iv-error">{leadErrors.lastName}</p>}
              </div>

              <div className="iv-form-field">
                <label htmlFor="iv-em">Email address</label>
                <input
                  id="iv-em"
                  type="email"
                  className={`iv-input ${leadErrors.email ? 'iv-input--error' : ''}`}
                  placeholder="jane.smith@email.com"
                  value={lead.email}
                  onChange={(e) => updateLead('email', e.target.value)}
                />
                {leadErrors.email && <p className="iv-error">{leadErrors.email}</p>}
              </div>

              <div className="iv-form-field">
                <label htmlFor="iv-ph">Phone number</label>
                <input
                  id="iv-ph"
                  type="tel"
                  className={`iv-input ${leadErrors.phone ? 'iv-input--error' : ''}`}
                  placeholder="07123 456789"
                  value={lead.phone}
                  onChange={(e) => updateLead('phone', e.target.value)}
                />
                {leadErrors.phone && <p className="iv-error">{leadErrors.phone}</p>}
              </div>
            </div>

            <button
              className="iv-submit-btn"
              onClick={handleSubmitContact}
              disabled={submitting}
            >
              {submitting ? 'Sending your report…' : 'Send my valuation report →'}
            </button>

            <p className="iv-privacy">
              We only use your details to send your valuation and follow up on your enquiry.
              We never share your information with third parties.
            </p>
          </div>
        )}

        {/* ── DECLINED VIEW ── */}
        {view === 'declined' && (
          <div className="iv-outcome">
            <div className="iv-outcome__icon">👋</div>
            <h2>No problem at all</h2>
            <p>
              If you change your mind or have any questions about your property,
              our team is always happy to help — no pressure, no obligation.
            </p>
            <div className="iv-outcome__links">
              <Link href="/landlords" className="iv-outcome__btn iv-outcome__btn--primary">
                Speak to our team
              </Link>
              <button className="iv-outcome__btn iv-outcome__btn--outline" onClick={handleReset}>
                Start again
              </button>
            </div>
          </div>
        )}

        {/* ── SENT VIEW ── */}
        {view === 'sent' && (
          <div className="iv-outcome">
            <div className="iv-outcome__icon">📬</div>
            <h2>Your report is on its way</h2>
            <p>
              We've emailed your personalised valuation report to <strong style={{ color: '#fff' }}>{lead.email}</strong>.
              Check your inbox — it should arrive within a few minutes.
            </p>
            <div className="iv-outcome__links">
              <Link href="/landlords" className="iv-outcome__btn iv-outcome__btn--primary">
                Book a free professional valuation
              </Link>
              <button className="iv-outcome__btn iv-outcome__btn--outline" onClick={handleReset}>
                Value another property
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
