'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lookupPostcode, isOperatingArea, TIER_PRICING_2026 } from '@/lib/valuation/operatingAreaPostcodes';

// ─── Types ──────────────────────────────────────────────────────────────────
type ValuationType = 'rent' | 'sale';
type PropertyType  = 'flat' | 'terraced' | 'semi' | 'detached';
type GardenType     = 'private' | 'shared' | 'patio' | 'none';
type ParkingType    = 'garage' | 'driveway' | 'allocated' | 'permit' | 'on_street' | 'none';
type Step          = 'contact' | 'type' | 'postcode' | 'property' | 'bedrooms' | 'features' | 'outdoor' | 'result';

interface LeadInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ValuationResult {
  low:  number;
  mid:  number;
  high: number;
  area: string;
  subArea: string;
  currency: string;
  period: string;
  adjustmentPct: number;
}

// ─── Bedroom multipliers ────────────────────────────────────────────────────
const BEDROOM_MULT: Record<number, number> = {
  0: 0.55, 1: 0.70, 2: 0.88, 3: 1.00, 4: 1.22, 5: 1.45, 6: 1.65,
};

// ─── Property type multipliers ──────────────────────────────────────────────
const PROP_SALE_MULT: Record<PropertyType, number> = {
  flat: 0.72, terraced: 0.88, semi: 1.00, detached: 1.32,
};
const PROP_RENT_MULT: Record<PropertyType, number> = {
  flat: 0.82, terraced: 0.92, semi: 1.00, detached: 1.18,
};

// ─── Feature adjustment percentages ─────────────────────────────────────────
// Grounded in typical UK estate-agent guideline ranges (additive, capped).
// Bathrooms: +4.5% per bathroom beyond the first (most homes have 1 as standard)
const BATHROOM_PCT_PER_EXTRA = 0.045;
const MAX_BATHROOM_BONUS_COUNT = 3; // caps uplift beyond 4 bathrooms

// Garden: private gardens carry the largest premium; shared/patio smaller
const GARDEN_PCT: Record<GardenType, number> = {
  private: 0.09,
  shared:  0.03,
  patio:   0.02,
  none:    0,
};

// Parking: matches Rightmove/Zoopla/Material Information Rules categories
const PARKING_PCT: Record<ParkingType, number> = {
  garage:    0.06,
  driveway:  0.05,
  allocated: 0.04,
  permit:    0.015,
  on_street: 0,
  none:      0,
};

// Balcony: most relevant uplift on flats/apartments
const BALCONY_PCT = 0.03;

function calculate(
  postcode: string,
  propType: PropertyType,
  bedrooms: number,
  valType: ValuationType,
  bathrooms: number,
  hasBalcony: boolean,
  garden: GardenType,
  parking: ParkingType,
): ValuationResult | null {
  const info = lookupPostcode(postcode);
  if (!info) return null;

  const base = valType === 'rent'
    ? TIER_PRICING_2026[info.tier].avgRent
    : TIER_PRICING_2026[info.tier].avgSale;

  const propMult = valType === 'rent' ? PROP_RENT_MULT[propType] : PROP_SALE_MULT[propType];
  const bedMult  = BEDROOM_MULT[Math.min(Math.max(bedrooms, 0), 6)] ?? 1.0;

  // Feature adjustment — additive percentage on top of the base estimate
  const extraBathrooms = Math.min(Math.max(bathrooms - 1, 0), MAX_BATHROOM_BONUS_COUNT);
  const bathroomPct = extraBathrooms * BATHROOM_PCT_PER_EXTRA;
  const balconyPct  = hasBalcony ? BALCONY_PCT : 0;
  const gardenPct    = GARDEN_PCT[garden];
  const parkingPct   = PARKING_PCT[parking];

  const adjustmentPct = bathroomPct + balconyPct + gardenPct + parkingPct;
  const featureMult = 1 + adjustmentPct;

  const mid  = Math.round((base * propMult * bedMult * featureMult) / 500) * 500;
  const low  = Math.round(mid * 0.92 / 500) * 500;
  const high = Math.round(mid * 1.08 / 500) * 500;

  return {
    low, mid, high,
    area: info.area,
    subArea: info.subArea,
    currency: valType === 'rent' ? '£' : '£',
    period: valType === 'rent' ? '/month' : '',
    adjustmentPct,
  };
}

// ─── Lead capture ────────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidUKPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, '');
  // Accepts UK landline/mobile in national (0...) or international (+44...) format
  return /^(\+44\d{9,10}|0\d{9,10})$/.test(cleaned);
}

/**
 * PLACEHOLDER — wire this up to the real admin dashboard backend once
 * the leads API/endpoint is ready. For now it just logs the lead so the
 * rest of the funnel (and the UI) is fully functional and testable.
 *
 * Suggested future implementation:
 *   await fetch('/api/leads', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ...lead, source: 'instant-valuation', submittedAt: new Date().toISOString() }),
 *   });
 */
async function submitLead(lead: LeadInfo): Promise<{ ok: boolean }> {
  console.log('[Instant Valuation] Lead captured (placeholder — not yet sent to dashboard):', lead);
  // Simulate a successful async call so the UI flow behaves like a real submit.
  await new Promise((resolve) => setTimeout(resolve, 250));
  return { ok: true };
}

// ─── Formatting ─────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n >= 1000 ? `£${(n / 1000).toFixed(0)}k` : `£${n}`;
}
function fmtFull(n: number) {
  return `£${n.toLocaleString('en-GB')}`;
}

// ─── Contact capture step ────────────────────────────────────────────────────
function StepContact({
  value, onChange, errors,
}: {
  value: LeadInfo;
  onChange: (v: LeadInfo) => void;
  errors: Partial<LeadInfo>;
}) {
  const update = (field: keyof LeadInfo, val: string) => {
    onChange({ ...value, [field]: val });
  };
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">Let's get your details first</h2>
      <p className="iv-step__sub">So we can send your valuation and follow up if you have questions</p>

      <div className="iv-form-grid">
        <div className="iv-form-field">
          <label className="iv-field-label" htmlFor="iv-first-name">First name</label>
          <input
            id="iv-first-name"
            type="text"
            className={`iv-input ${errors.firstName ? 'iv-input--error' : ''}`}
            placeholder="Jane"
            value={value.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            autoFocus
          />
          {errors.firstName && <p className="iv-error">{errors.firstName}</p>}
        </div>

        <div className="iv-form-field">
          <label className="iv-field-label" htmlFor="iv-last-name">Last name</label>
          <input
            id="iv-last-name"
            type="text"
            className={`iv-input ${errors.lastName ? 'iv-input--error' : ''}`}
            placeholder="Smith"
            value={value.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
          {errors.lastName && <p className="iv-error">{errors.lastName}</p>}
        </div>

        <div className="iv-form-field">
          <label className="iv-field-label" htmlFor="iv-email">Email address</label>
          <input
            id="iv-email"
            type="email"
            className={`iv-input ${errors.email ? 'iv-input--error' : ''}`}
            placeholder="jane.smith@email.com"
            value={value.email}
            onChange={(e) => update('email', e.target.value)}
          />
          {errors.email && <p className="iv-error">{errors.email}</p>}
        </div>

        <div className="iv-form-field">
          <label className="iv-field-label" htmlFor="iv-phone">Phone number</label>
          <input
            id="iv-phone"
            type="tel"
            className={`iv-input ${errors.phone ? 'iv-input--error' : ''}`}
            placeholder="07123 456789"
            value={value.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          {errors.phone && <p className="iv-error">{errors.phone}</p>}
        </div>
      </div>

      <p className="iv-privacy-note">
        We'll only use your details to send your valuation and discuss your property.
        We never share your information with third parties.
      </p>
    </div>
  );
}

// ─── Step components ─────────────────────────────────────────────────────────

function StepValuationType({
  value, onChange,
}: { value: ValuationType; onChange: (v: ValuationType) => void }) {
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">What would you like to value?</h2>
      <p className="iv-step__sub">Select the type of valuation you need</p>
      <div className="iv-cards">
        {(['rent', 'sale'] as ValuationType[]).map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`iv-card ${value === t ? 'iv-card--active' : ''}`}
          >
            <span className="iv-card__icon">{t === 'rent' ? '🏠' : '🏷️'}</span>
            <span className="iv-card__label">{t === 'rent' ? 'Rental Valuation' : 'Sale Valuation'}</span>
            <span className="iv-card__desc">
              {t === 'rent' ? 'Find out your monthly rental value' : 'Estimate your property sale price'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPostcode({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error: string }) {
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">What's the property postcode?</h2>
      <p className="iv-step__sub">We cover Leeds, Manchester, Bradford, and across Yorkshire</p>
      <input
        type="text"
        className={`iv-input ${error ? 'iv-input--error' : ''}`}
        placeholder="e.g. LS6 1AA"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={8}
        autoFocus
      />
      {error && <p className="iv-error">{error}</p>}
    </div>
  );
}

function StepPropertyType({
  value, onChange,
}: { value: PropertyType; onChange: (v: PropertyType) => void }) {
  const types: { id: PropertyType; label: string; icon: string }[] = [
    { id: 'flat',      label: 'Flat / Apartment', icon: '🏢' },
    { id: 'terraced',  label: 'Terraced House',   icon: '🏘️' },
    { id: 'semi',      label: 'Semi-Detached',    icon: '🏡' },
    { id: 'detached',  label: 'Detached House',   icon: '🏠' },
  ];
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">What type of property is it?</h2>
      <p className="iv-step__sub">Select the option that best describes the property</p>
      <div className="iv-cards iv-cards--four">
        {types.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`iv-card ${value === id ? 'iv-card--active' : ''}`}
          >
            <span className="iv-card__icon">{icon}</span>
            <span className="iv-card__label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepBedrooms({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">How many bedrooms?</h2>
      <p className="iv-step__sub">Include all habitable rooms used as bedrooms</p>
      <div className="iv-beds">
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`iv-bed-btn ${value === n ? 'iv-bed-btn--active' : ''}`}
          >
            {n === 0 ? 'Studio' : `${n} bed${n > 1 ? 's' : ''}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Bathrooms + Balcony step ────────────────────────────────────────────────
function StepFeatures({
  bathrooms, onBathrooms, balcony, onBalcony,
}: {
  bathrooms: number; onBathrooms: (v: number) => void;
  balcony: boolean; onBalcony: (v: boolean) => void;
}) {
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">Bathrooms &amp; balcony</h2>
      <p className="iv-step__sub">These details help us sharpen the accuracy of your estimate</p>

      <p className="iv-field-label">How many bathrooms?</p>
      <div className="iv-beds">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => onBathrooms(n)}
            className={`iv-bed-btn ${bathrooms === n ? 'iv-bed-btn--active' : ''}`}
          >
            {n === 4 ? '4+' : n} bath{n > 1 ? 's' : ''}
          </button>
        ))}
      </div>

      <p className="iv-field-label" style={{ marginTop: '1.75rem' }}>Does the property have a balcony?</p>
      <div className="iv-cards">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => onBalcony(v)}
            className={`iv-card iv-card--compact ${balcony === v ? 'iv-card--active' : ''}`}
          >
            <span className="iv-card__icon">{v ? '🌇' : '🚫'}</span>
            <span className="iv-card__label">{v ? 'Yes' : 'No'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Garden + Parking step ───────────────────────────────────────────────────
function StepOutdoor({
  garden, onGarden, parking, onParking,
}: {
  garden: GardenType; onGarden: (v: GardenType) => void;
  parking: ParkingType; onParking: (v: ParkingType) => void;
}) {
  const gardenOptions: { id: GardenType; label: string; icon: string }[] = [
    { id: 'private', label: 'Private garden',    icon: '🌳' },
    { id: 'shared',   label: 'Shared / communal', icon: '🌿' },
    { id: 'patio',    label: 'Patio / courtyard',  icon: '🪴' },
    { id: 'none',     label: 'No garden',          icon: '🚫' },
  ];
  const parkingOptions: { id: ParkingType; label: string; icon: string }[] = [
    { id: 'garage',    label: 'Garage',                 icon: '🚪' },
    { id: 'driveway',  label: 'Driveway (off-street)',  icon: '🛣️' },
    { id: 'allocated', label: 'Allocated space',         icon: '🅿️' },
    { id: 'permit',    label: 'Permit parking',          icon: '🎫' },
    { id: 'on_street', label: 'On-street (unrestricted)',icon: '🚗' },
    { id: 'none',      label: 'No parking',              icon: '🚫' },
  ];
  return (
    <div className="iv-step">
      <h2 className="iv-step__title">Garden &amp; parking</h2>
      <p className="iv-step__sub">Outdoor space and parking type both affect local market value</p>

      <p className="iv-field-label">What type of garden does it have?</p>
      <div className="iv-cards iv-cards--four">
        {gardenOptions.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onGarden(id)}
            className={`iv-card iv-card--compact ${garden === id ? 'iv-card--active' : ''}`}
          >
            <span className="iv-card__icon">{icon}</span>
            <span className="iv-card__label">{label}</span>
          </button>
        ))}
      </div>

      <p className="iv-field-label" style={{ marginTop: '1.75rem' }}>What type of parking is available?</p>
      <div className="iv-cards iv-cards--four">
        {parkingOptions.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onParking(id)}
            className={`iv-card iv-card--compact ${parking === id ? 'iv-card--active' : ''}`}
          >
            <span className="iv-card__icon">{icon}</span>
            <span className="iv-card__label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepResult({
  result, type, postcode, onReset,
}: {
  result: ValuationResult;
  type: ValuationType;
  postcode: string;
  onReset: () => void;
}) {
  return (
    <div className="iv-step iv-step--result">
      <div className="iv-result-badge">
        {type === 'rent' ? '🏠 Rental Estimate' : '🏷️ Sale Estimate'}
      </div>
      <h2 className="iv-result__postcode">{postcode.toUpperCase()}</h2>
      <p className="iv-result__area">{result.subArea}, {result.area}</p>

      <div className="iv-result__range">
        <div className="iv-range-item iv-range-item--low">
          <span className="iv-range-item__label">Low</span>
          <span className="iv-range-item__value">{fmtFull(result.low)}{result.period}</span>
        </div>
        <div className="iv-range-item iv-range-item--mid">
          <span className="iv-range-item__label">Estimate</span>
          <span className="iv-range-item__value">{fmtFull(result.mid)}{result.period}</span>
        </div>
        <div className="iv-range-item iv-range-item--high">
          <span className="iv-range-item__label">High</span>
          <span className="iv-range-item__value">{fmtFull(result.high)}{result.period}</span>
        </div>
      </div>

      {result.adjustmentPct > 0 && (
        <p className="iv-result__adjustment">
          Includes a +{(result.adjustmentPct * 100).toFixed(1)}% uplift for your property's bathrooms, balcony, garden, and parking.
        </p>
      )}

      <p className="iv-result__disclaimer">
        This estimate is based on 2026 regional market data for the{' '}
        <strong>{result.subArea}</strong> area. It is indicative only and not a
        formal valuation. Actual values may vary based on property condition,
        fixtures, and current market conditions.
      </p>

      <div className="iv-result__ctas">
        <Link href="/landlords" className="iv-cta iv-cta--primary">
          Book a Free Professional Valuation
        </Link>
        <button onClick={onReset} className="iv-cta iv-cta--outline">
          Value Another Property
        </button>
      </div>
    </div>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────
const STEPS: Step[] = ['contact', 'type', 'postcode', 'property', 'bedrooms', 'features', 'outdoor', 'result'];

function ProgressBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  const pct = (idx / (STEPS.length - 1)) * 100;
  return (
    <div className="iv-progress">
      <div className="iv-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main page component ─────────────────────────────────────────────────────
export default function InstantValuationPage() {
  const [step,       setStep]      = useState<Step>('contact');
  const [lead,       setLead]      = useState<LeadInfo>({ firstName: '', lastName: '', email: '', phone: '' });
  const [leadErrors, setLeadErrors]= useState<Partial<LeadInfo>>({});
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [valType,    setValType]   = useState<ValuationType>('rent');
  const [postcode,   setPostcode]  = useState('');
  const [postcodeErr,setPostcodeErr]= useState('');
  const [propType,   setPropType]  = useState<PropertyType>('semi');
  const [bedrooms,   setBedrooms]  = useState(3);
  const [bathrooms,  setBathrooms] = useState(1);
  const [balcony,    setBalcony]   = useState(false);
  const [garden,     setGarden]    = useState<GardenType>('none');
  const [parking,    setParking]   = useState<ParkingType>('none');
  const [result,     setResult]    = useState<ValuationResult | null>(null);

  const runCalculation = useCallback((overrides?: Partial<{
    bedrooms: number; bathrooms: number; balcony: boolean; garden: GardenType; parking: ParkingType;
  }>) => {
    const r = calculate(
      postcode,
      propType,
      overrides?.bedrooms ?? bedrooms,
      valType,
      overrides?.bathrooms ?? bathrooms,
      overrides?.balcony ?? balcony,
      overrides?.garden ?? garden,
      overrides?.parking ?? parking,
    );
    if (r) { setResult(r); setStep('result'); }
  }, [postcode, propType, bedrooms, valType, bathrooms, balcony, garden, parking]);

  const validateLead = (): boolean => {
    const errors: Partial<LeadInfo> = {};
    if (!lead.firstName.trim()) errors.firstName = 'First name is required.';
    if (!lead.lastName.trim())  errors.lastName  = 'Last name is required.';
    if (!lead.email.trim())          errors.email = 'Email address is required.';
    else if (!isValidEmail(lead.email)) errors.email = 'Please enter a valid email address.';
    if (!lead.phone.trim())          errors.phone = 'Phone number is required.';
    else if (!isValidUKPhone(lead.phone)) errors.phone = 'Please enter a valid UK phone number.';
    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = useCallback(async () => {
    if (step === 'contact') {
      if (!validateLead()) return;
      setLeadSubmitting(true);
      try {
        await submitLead(lead);
      } finally {
        setLeadSubmitting(false);
      }
      setStep('type');
      return;
    }
    if (step === 'type')     { setStep('postcode');  return; }
    if (step === 'postcode') {
      const clean = postcode.trim();
      if (!clean) { setPostcodeErr('Please enter a postcode.'); return; }
      if (!isOperatingArea(clean)) {
        setPostcodeErr(
          'We currently cover Leeds, Manchester, Bradford, and across Yorkshire. ' +
          'This postcode appears to be outside our area.'
        );
        return;
      }
      setPostcodeErr('');
      setStep('property');
      return;
    }
    if (step === 'property') { setStep('bedrooms'); return; }
    if (step === 'bedrooms') { setStep('features'); return; }
    if (step === 'features') { setStep('outdoor'); return; }
    if (step === 'outdoor')  { runCalculation(); return; }
  }, [step, postcode, runCalculation, lead]);

  const handleBack = () => {
    const prev: Partial<Record<Step, Step>> = {
      type: 'contact', postcode: 'type', property: 'postcode', bedrooms: 'property',
      features: 'bedrooms', outdoor: 'features', result: 'outdoor',
    };
    const p = prev[step];
    if (p) setStep(p);
  };

  const handleReset = () => {
    setStep('contact'); setLead({ firstName: '', lastName: '', email: '', phone: '' }); setLeadErrors({});
    setPostcode(''); setPostcodeErr('');
    setPropType('semi'); setBedrooms(3); setBathrooms(1);
    setBalcony(false); setGarden('none'); setParking('none');
    setResult(null);
  };

  // Auto-advance on card click for steps that don't need a "Next" button
  const handleTypeChange = (v: ValuationType) => { setValType(v); setTimeout(() => setStep('postcode'), 150); };
  const handlePropChange = (v: PropertyType) => { setPropType(v); setTimeout(() => setStep('bedrooms'), 150); };
  const handleBedsChange = (v: number)        => { setBedrooms(v); setTimeout(() => setStep('features'), 150); };

  return (
    <>
      <style>{`
        /* ── Layout ──────────────────────────────────────────────────── */
        .iv-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 1rem 4rem;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .iv-header {
          width: 100%;
          max-width: 640px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 0;
        }
        .iv-back-link {
          color: rgba(255,255,255,0.6);
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
        /* ── Progress ─────────────────────────────────────────────────── */
        .iv-progress {
          width: 100%;
          max-width: 640px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin-bottom: 2.5rem;
          overflow: hidden;
        }
        .iv-progress__bar {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #f0c040);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        /* ── Card ─────────────────────────────────────────────────────── */
        .iv-card-wrap {
          width: 100%;
          max-width: 640px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.25rem;
          padding: 2.5rem;
        }
        /* ── Step ─────────────────────────────────────────────────────── */
        .iv-step__title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem;
          line-height: 1.3;
        }
        .iv-step__sub {
          color: rgba(255,255,255,0.55);
          font-size: 0.9375rem;
          margin: 0 0 1.75rem;
        }
        .iv-field-label {
          color: rgba(255,255,255,0.8);
          font-size: 0.9375rem;
          font-weight: 600;
          margin: 0 0 0.875rem;
        }
        /* ── Contact form ─────────────────────────────────────────────── */
        .iv-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .iv-form-field {
          display: flex;
          flex-direction: column;
        }
        .iv-form-field .iv-field-label {
          margin: 0 0 0.5rem;
          font-size: 0.8125rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.55);
        }
        .iv-privacy-note {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          margin: 1.75rem 0 0;
        }
        @media (max-width: 480px) {
          .iv-form-grid { grid-template-columns: 1fr; }
        }
        /* ── Selection cards ──────────────────────────────────────────── */
        .iv-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .iv-cards--four {
          grid-template-columns: 1fr 1fr;
        }
        .iv-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.4rem;
          padding: 1.25rem;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 0.875rem;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          color: #fff;
        }
        .iv-card--compact {
          padding: 0.9375rem;
        }
        .iv-card:hover {
          background: rgba(255,255,255,0.11);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }
        .iv-card--active {
          border-color: #2563eb;
          background: rgba(37,99,235,0.18);
        }
        .iv-card__icon  { font-size: 1.75rem; }
        .iv-card__label { font-weight: 600; font-size: 1rem; }
        .iv-card__desc  { font-size: 0.8125rem; color: rgba(255,255,255,0.55); }
        /* ── Postcode input ───────────────────────────────────────────── */
        .iv-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 0.75rem;
          color: #fff;
          font-size: 1.125rem;
          letter-spacing: 0.05em;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .iv-input::placeholder { color: rgba(255,255,255,0.3); font-weight: 400; }
        .iv-input:focus { border-color: #2563eb; }
        .iv-input--error { border-color: #ef4444; }
        .iv-error {
          color: #fca5a5;
          font-size: 0.875rem;
          margin: 0.5rem 0 0;
        }
        /* ── Bedroom / bathroom buttons ───────────────────────────────── */
        .iv-beds {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .iv-bed-btn {
          padding: 0.75rem 1.25rem;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 0.625rem;
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .iv-bed-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }
        .iv-bed-btn--active { border-color: #2563eb; background: rgba(37,99,235,0.2); }
        /* ── Footer nav ───────────────────────────────────────────────── */
        .iv-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2rem;
          gap: 1rem;
        }
        .iv-btn-back {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.55);
          font-size: 0.9375rem;
          cursor: pointer;
          padding: 0.5rem 0;
          transition: color 0.2s;
        }
        .iv-btn-back:hover { color: #fff; }
        .iv-btn-next {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 0.625rem;
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          margin-left: auto;
        }
        .iv-btn-next:hover { background: #1d4ed8; transform: translateY(-1px); }
        .iv-btn-next:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        /* ── Result ───────────────────────────────────────────────────── */
        .iv-step--result { text-align: center; }
        .iv-result-badge {
          display: inline-block;
          background: rgba(37,99,235,0.2);
          border: 1px solid rgba(37,99,235,0.4);
          color: #93c5fd;
          border-radius: 2rem;
          padding: 0.375rem 1rem;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          letter-spacing: 0.03em;
        }
        .iv-result__postcode {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: 0.05em;
        }
        .iv-result__area {
          color: rgba(255,255,255,0.55);
          font-size: 0.9375rem;
          margin: 0.25rem 0 1.75rem;
        }
        .iv-result__range {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .iv-range-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem 0.75rem;
          border-radius: 0.875rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .iv-range-item--mid {
          background: rgba(37,99,235,0.18);
          border-color: rgba(37,99,235,0.35);
        }
        .iv-range-item__label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .iv-range-item__value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }
        .iv-range-item--mid .iv-range-item__value {
          font-size: 1.5rem;
          color: #93c5fd;
        }
        .iv-result__adjustment {
          font-size: 0.8125rem;
          color: #93c5fd;
          margin: 0 0 1rem;
        }
        .iv-result__disclaimer {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .iv-result__ctas {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .iv-cta {
          display: block;
          padding: 0.9375rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .iv-cta--primary {
          background: #2563eb;
          color: #fff;
          border: none;
        }
        .iv-cta--primary:hover { background: #1d4ed8; }
        .iv-cta--outline {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .iv-cta--outline:hover { border-color: rgba(255,255,255,0.5); color: #fff; }
        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .iv-card-wrap { padding: 1.75rem 1.25rem; }
          .iv-step__title { font-size: 1.25rem; }
          .iv-result__range { flex-direction: column; }
          .iv-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="iv-page">
        <header className="iv-header">
          <Link href="/" className="iv-back-link">← Back to site</Link>
          <span className="iv-logo-text">House of Lettings</span>
        </header>

        <ProgressBar current={step} />

        <div className="iv-card-wrap">
          {step === 'contact' && (
            <>
              <StepContact value={lead} onChange={setLead} errors={leadErrors} />
              <div className="iv-footer">
                <span />
                <button className="iv-btn-next" onClick={handleNext} disabled={leadSubmitting}>
                  {leadSubmitting ? 'Please wait…' : 'Continue →'}
                </button>
              </div>
            </>
          )}
          {step === 'type' && (
            <StepValuationType value={valType} onChange={handleTypeChange} />
          )}
          {step === 'postcode' && (
            <>
              <StepPostcode value={postcode} onChange={setPostcode} error={postcodeErr} />
              <div className="iv-footer">
                <button className="iv-btn-back" onClick={handleBack}>← Back</button>
                <button className="iv-btn-next" onClick={handleNext}>Continue →</button>
              </div>
            </>
          )}
          {step === 'property' && (
            <StepPropertyType value={propType} onChange={handlePropChange} />
          )}
          {step === 'bedrooms' && (
            <StepBedrooms value={bedrooms} onChange={handleBedsChange} />
          )}
          {step === 'features' && (
            <>
              <StepFeatures
                bathrooms={bathrooms} onBathrooms={setBathrooms}
                balcony={balcony} onBalcony={setBalcony}
              />
              <div className="iv-footer">
                <button className="iv-btn-back" onClick={handleBack}>← Back</button>
                <button className="iv-btn-next" onClick={handleNext}>Continue →</button>
              </div>
            </>
          )}
          {step === 'outdoor' && (
            <>
              <StepOutdoor
                garden={garden} onGarden={setGarden}
                parking={parking} onParking={setParking}
              />
              <div className="iv-footer">
                <button className="iv-btn-back" onClick={handleBack}>← Back</button>
                <button className="iv-btn-next" onClick={handleNext}>Get my estimate →</button>
              </div>
            </>
          )}
          {step === 'result' && result && (
            <>
              <StepResult result={result} type={valType} postcode={postcode} onReset={handleReset} />
              <div className="iv-footer">
                <button className="iv-btn-back" onClick={handleBack}>← Adjust details</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
