'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { lookupPostcode, isOperatingArea, TIER_PRICING_2026 } from '@/lib/valuation/operatingAreaPostcodes';

// ─── Types ───────────────────────────────────────────────────────────────────
type ValuationType = 'let' | 'sale' | 'both';
type PropertyType  = 'flat' | 'terraced' | 'semi' | 'detached';
type GardenType    = 'private' | 'shared' | 'patio' | 'none';
type ParkingType   = 'garage' | 'driveway' | 'allocated' | 'permit' | 'on_street' | 'none';
type Step          = 1 | 2 | 3;
type View          = 'wizard' | 'contact' | 'declined' | 'sent';

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
  saleLow?:  number;
  saleMid?:  number;
  saleHigh?: number;
}

// ─── Multipliers ─────────────────────────────────────────────────────────────
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
  postcode: string,
  propType: PropertyType,
  bedrooms: number,
  valType: 'rent' | 'sale',
  bathrooms: number,
  hasBalcony: boolean,
  garden: GardenType,
  parking: ParkingType,
): { low: number; mid: number; high: number; area: string; subArea: string; adjustmentPct: number } | null {
  const info = lookupPostcode(postcode);
  if (!info) return null;
  const base = valType === 'rent'
    ? TIER_PRICING_2026[info.tier].avgRent
    : TIER_PRICING_2026[info.tier].avgSale;
  const propMult = valType === 'rent' ? PROP_RENT_MULT[propType] : PROP_SALE_MULT[propType];
  const bedMult  = BEDROOM_MULT[Math.min(Math.max(bedrooms, 0), 6)] ?? 1.0;
  const extraBath = Math.min(Math.max(bathrooms - 1, 0), MAX_BATHROOM_BONUS_COUNT);
  const adjustmentPct =
    (extraBath * BATHROOM_PCT_PER_EXTRA) +
    (hasBalcony ? BALCONY_PCT : 0) +
    GARDEN_PCT[garden] +
    PARKING_PCT[parking];
  const mid  = Math.round((base * propMult * bedMult * (1 + adjustmentPct)) / 500) * 500;
  const low  = Math.round(mid * 0.92 / 500) * 500;
  const high = Math.round(mid * 1.08 / 500) * 500;
  return { low, mid, high, area: info.area, subArea: info.subArea, adjustmentPct };
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
function isValidUKPhone(p: string) {
  const c = p.replace(/[\s()-]/g, '');
  return /^(\+44\d{9,10}|0\d{9,10})$/.test(c);
}

function postcodeIsComplete(raw: string): boolean {
  const clean = raw.replace(/\s/g, '');
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(clean);
}

export default function InstantValuationPage() {
  const [view, setView]         = useState<View>('wizard');
  const [step, setStep]         = useState<Step>(1);

  // Step 1
  const [valType,     setValType]     = useState<ValuationType | ''>('');
  const [postcode,    setPostcode]    = useState('');
  const [postcodeErr, setPostcodeErr] = useState('');
  const [propType,    setPropType]    = useState<PropertyType | ''>('');
  const [bedrooms,    setBedrooms]    = useState<number | ''>('');

  // Step 2
  const [bathrooms, setBathrooms] = useState<number | ''>('');
  const [balcony,   setBalcony]   = useState<boolean | ''>('');
  const [garden,    setGarden]    = useState<GardenType | ''>('');
  const [parking,   setParking]   = useState<ParkingType | ''>('');

  // Contact
  const [lead,       setLead]       = useState<LeadInfo>({ firstName: '', lastName: '', email: '', phone: '' });
  const [leadErrors, setLeadErrors] = useState<Partial<LeadInfo>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState<ValuationResult | null>(null);

  const step1Complete = valType !== '' && postcode.trim() !== '' && !postcodeErr && propType !== '' && bedrooms !== '';
  const step2Complete = bathrooms !== '' && balcony !== '' && garden !== '' && parking !== '';

  // ── Postcode validation: only fires on blur, not on every keystroke ──
  const validatePostcode = useCallback((val?: string) => {
    const raw = (val ?? postcode).trim();
    if (!raw) { setPostcodeErr(''); return true; }
    if (!postcodeIsComplete(raw)) {
      setPostcodeErr('Please enter a full postcode (e.g. LS6 1AA).');
      return false;
    }
    if (!isOperatingArea(raw)) {
      setPostcodeErr('We currently cover Leeds, Manchester, Bradford, and across Yorkshire.');
      return false;
    }
    setPostcodeErr('');
    return true;
  }, [postcode]);

  const handlePostcodeBlur = () => validatePostcode();

  const handleStep1Next = () => {
    const ok = validatePostcode();
    if (!ok || !step1Complete) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildResult = useCallback((): ValuationResult | null => {
    const shared = {
      propType: propType as PropertyType,
      bedrooms: bedrooms as number,
      bathrooms: bathrooms as number,
      balcony: balcony as boolean,
      garden: garden as GardenType,
      parking: parking as ParkingType,
    };
    if (valType === 'let') {
      return calcForType(postcode, shared.propType, shared.bedrooms, 'rent',
        shared.bathrooms, shared.balcony, shared.garden, shared.parking);
    }
    if (valType === 'sale') {
      return calcForType(postcode, shared.propType, shared.bedrooms, 'sale',
        shared.bathrooms, shared.balcony, shared.garden, shared.parking);
    }
    const rent = calcForType(postcode, shared.propType, shared.bedrooms, 'rent',
      shared.bathrooms, shared.balcony, shared.garden, shared.parking);
    const sale = calcForType(postcode, shared.propType, shared.bedrooms, 'sale',
      shared.bathrooms, shared.balcony, shared.garden, shared.parking);
    if (!rent || !sale) return null;
    return { ...rent, saleLow: sale.low, saleMid: sale.mid, saleHigh: sale.high };
  }, [valType, postcode, propType, bedrooms, bathrooms, balcony, garden, parking]);

  const handleYes = () => {
    const r = buildResult();
    if (!r) return;
    setResult(r);
    setView('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNo = () => {
    setView('declined');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setView('sent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setView('wizard'); setStep(1);
    setValType(''); setPostcode(''); setPostcodeErr('');
    setPropType(''); setBedrooms(''); setBathrooms('');
    setBalcony(''); setGarden(''); setParking('');
    setLead({ firstName: '', lastName: '', email: '', phone: '' });
    setLeadErrors({}); setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateLead = (field: keyof LeadInfo, val: string) =>
    setLead((prev) => ({ ...prev, [field]: val }));

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .iv-page {
          min-height: 100vh;
          background: #f3f4f6;
          display: flex; flex-direction: column; align-items: center;
          padding: 0 1rem 5rem;
          font-family: 'Poppins', -apple-system, sans-serif;
        }
        .iv-header {
          width: 100%; max-width: 680px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.5rem 0;
        }
        .iv-back-link {
          color: #6b7280; text-decoration: none;
          font-size: 0.875rem; display: flex; align-items: center; gap: 0.4rem;
          transition: color 0.2s;
        }
        .iv-back-link:hover { color: #0f1f3d; }
        .iv-logo-text { font-size: 1rem; font-weight: 700; color: var(--logo-blue); letter-spacing: 0.02em; }

        .iv-progress { width: 100%; max-width: 680px; margin-bottom: 1.75rem; }
        .iv-progress__track { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
        .iv-progress__seg {
          flex: 1; height: 4px; border-radius: 2px;
          background: #e5e7eb; transition: background 0.35s;
        }
        .iv-progress__seg--done   { background: #2563eb; }
        .iv-progress__seg--active { background: #60a5fa; }
        .iv-progress__label { font-size: 0.8125rem; color: #6b7280; }
        .iv-progress__label span { color: #0f1f3d; font-weight: 600; }

        .iv-card-wrap {
          width: 100%; max-width: 680px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1.5rem; overflow: hidden;
          box-shadow: 0 4px 24px rgba(15,31,61,0.06);
        }
        .iv-step-head {
          padding: 2rem 2.25rem 1.25rem;
          border-bottom: 1px solid #eef1f5;
        }
        .iv-step-head__eyebrow {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--logo-blue); margin: 0 0 0.5rem;
        }
        .iv-step-head__title { font-size: 1.375rem; font-weight: 800; color: #0f1f3d; margin: 0; }

        .iv-section {
          padding: 1.75rem 2.25rem;
          border-bottom: 1px solid #eef1f5;
        }
        .iv-section:last-child { border-bottom: none; }
        .iv-section__q { font-size: 0.9375rem; font-weight: 600; color: #374151; margin: 0 0 1rem; }

        .iv-opts { display: grid; gap: 0.625rem; }
        .iv-opts--2 { grid-template-columns: 1fr 1fr; }
        .iv-opts--3 { grid-template-columns: 1fr 1fr 1fr; }
        .iv-opts--4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .iv-opt {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 0.2rem; padding: 0.875rem 1rem;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.875rem; cursor: pointer; text-align: left;
          transition: border-color 0.18s, background 0.18s, transform 0.14s;
          color: #0f1f3d; width: 100%;
        }
        .iv-opt:hover { background: #f6f9fc; border-color: #c7d2e0; transform: translateY(-2px); }
        .iv-opt--active { border-color: #2563eb; background: #eff5ff; }
        .iv-opt__icon  { font-size: 1.375rem; line-height: 1; }
        .iv-opt__label { font-size: 0.875rem; font-weight: 600; }
        .iv-opt__desc  { font-size: 0.775rem; color: #6b7280; }

        .iv-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .iv-pill {
          padding: 0.55rem 1rem;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 2rem; color: #374151;
          font-size: 0.875rem; font-weight: 500; cursor: pointer;
          transition: border-color 0.18s, background 0.18s; white-space: nowrap;
        }
        .iv-pill:hover { background: #f6f9fc; border-color: #c7d2e0; }
        .iv-pill--active { border-color: #2563eb; background: #eff5ff; color: #1d4ed8; }

        .iv-input {
          padding: 0.8125rem 1rem;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.75rem; color: #111827;
          font-size: 1.0625rem; font-weight: 600; letter-spacing: 0.06em;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s; width: 100%;
        }
        .iv-input::placeholder { color: #9ca3af; font-weight: 400; letter-spacing: 0; }
        .iv-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .iv-input--error { border-color: #ef4444 !important; }
        .iv-input--contact { font-size: 1rem; font-weight: 500; letter-spacing: 0; }
        .iv-error { color: #dc2626; font-size: 0.8125rem; margin: 0.5rem 0 0; }

        .iv-step-foot {
          padding: 1.5rem 2.25rem;
          border-top: 1px solid #eef1f5;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .iv-btn-ghost {
          background: #fff; border: 1.5px solid #e5e7eb;
          border-radius: 0.75rem; color: #374151;
          font-size: 0.9375rem; font-weight: 600; cursor: pointer;
          padding: 0.75rem 1.5rem; transition: all 0.18s;
        }
        .iv-btn-ghost:hover { color: #0f1f3d; border-color: #c7d2e0; background: #f6f9fc; }
        .iv-btn-primary {
          background: #2563eb; color: #fff; border: none;
          border-radius: 0.75rem; font-size: 0.9375rem; font-weight: 700;
          cursor: pointer; padding: 0.875rem 2rem;
          transition: background 0.18s, transform 0.14s; flex: 1; max-width: 280px;
        }
        .iv-btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
        .iv-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .iv-summary {
          padding: 1rem 2.25rem;
          background: #f6f9fc;
          border-bottom: 1px solid #eef1f5;
          display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem;
        }
        .iv-summary__item { font-size: 0.8125rem; color: #6b7280; }
        .iv-summary__item strong { color: #0f1f3d; font-weight: 600; }

        .iv-gate { padding: 2.25rem; text-align: center; }
        .iv-gate__icon { font-size: 2.5rem; margin-bottom: 0.875rem; }
        .iv-gate__title { font-size: 1.25rem; font-weight: 800; color: #0f1f3d; margin: 0 0 0.5rem; }
        .iv-gate__sub { color: #6b7280; font-size: 0.9rem; margin: 0 0 1.75rem; }
        .iv-gate__btns { display: flex; gap: 0.875rem; justify-content: center; flex-wrap: wrap; }
        .iv-gate__btn {
          padding: 0.875rem 2.5rem; border-radius: 0.75rem;
          font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.18s; border: none;
        }
        .iv-gate__btn--yes { background: #2563eb; color: #fff; }
        .iv-gate__btn--yes:hover { background: #1d4ed8; transform: translateY(-1px); }
        .iv-gate__btn--no {
          background: #fff; color: #374151;
          border: 1.5px solid #e5e7eb;
        }
        .iv-gate__btn--no:hover { background: #f6f9fc; color: #0f1f3d; border-color: #c7d2e0; }

        .iv-contact-view {
          width: 100%; max-width: 680px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1.5rem; padding: 2.5rem 2.25rem;
          box-shadow: 0 4px 24px rgba(15,31,61,0.06);
        }
        .iv-contact-view__back {
          background: none; border: none; color: #6b7280;
          font-size: 0.875rem; cursor: pointer; padding: 0;
          margin-bottom: 1.5rem; transition: color 0.18s;
          display: flex; align-items: center; gap: 0.35rem;
        }
        .iv-contact-view__back:hover { color: #0f1f3d; }
        .iv-contact-view h2 { font-size: 1.625rem; font-weight: 800; color: #0f1f3d; margin: 0 0 0.5rem; }
        .iv-contact-view p.sub { color: #6b7280; font-size: 0.9375rem; margin: 0 0 2rem; }
        .iv-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.125rem; }
        .iv-form-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .iv-form-field label {
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: #6b7280;
        }
        .iv-submit-btn {
          width: 100%; margin-top: 1.75rem; padding: 1rem;
          background: #2563eb; color: #fff; border: none;
          border-radius: 0.875rem; font-size: 1.0625rem; font-weight: 700;
          cursor: pointer; transition: background 0.18s, transform 0.14s;
        }
        .iv-submit-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
        .iv-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .iv-privacy {
          font-size: 0.8rem; color: #9ca3af;
          line-height: 1.6; margin: 1rem 0 0; text-align: center;
        }

        .iv-outcome {
          width: 100%; max-width: 680px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1.5rem; padding: 3.5rem 2.25rem; text-align: center;
          box-shadow: 0 4px 24px rgba(15,31,61,0.06);
        }
        .iv-outcome__icon { font-size: 3rem; margin-bottom: 1rem; }
        .iv-outcome h2 { font-size: 1.625rem; font-weight: 800; color: #0f1f3d; margin: 0 0 0.75rem; }
        .iv-outcome p {
          color: #6b7280; font-size: 0.9375rem; line-height: 1.7;
          margin: 0 auto 2rem; max-width: 460px;
        }
        .iv-outcome__links { display: flex; gap: 0.875rem; justify-content: center; flex-wrap: wrap; }
        .iv-outcome__btn {
          padding: 0.875rem 1.75rem; border-radius: 0.75rem;
          font-size: 0.9375rem; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: all 0.18s;
        }
        .iv-outcome__btn--primary { background: #2563eb; color: #fff; border: none; }
        .iv-outcome__btn--primary:hover { background: #1d4ed8; }
        .iv-outcome__btn--outline {
          background: #fff; color: #374151;
          border: 1.5px solid #e5e7eb;
        }
        .iv-outcome__btn--outline:hover { color: #0f1f3d; border-color: #c7d2e0; }

        @media (max-width: 600px) {
          .iv-section { padding: 1.25rem 1.125rem; }
          .iv-step-head { padding: 1.5rem 1.125rem 1rem; }
          .iv-step-foot { padding: 1.25rem 1.125rem; }
          .iv-summary { padding: 0.875rem 1.125rem; }
          .iv-gate { padding: 1.75rem 1.125rem; }
          .iv-opts--3 { grid-template-columns: 1fr 1fr; }
          .iv-opts--4 { grid-template-columns: 1fr 1fr; }
          .iv-form-grid { grid-template-columns: 1fr; }
          .iv-contact-view { padding: 1.75rem 1.125rem; }
          .iv-outcome { padding: 2.5rem 1.125rem; }
          .iv-gate__btns { flex-direction: column; }
          .iv-gate__btn { width: 100%; }
        }
      `}</style>

      <div className="iv-page">
        <header className="iv-header">
          <Link href="/" className="iv-back-link">← Back to site</Link>
          <span className="iv-logo-text">House of Lettings</span>
        </header>

        {/* ── WIZARD ── */}
        {view === 'wizard' && (
          <>
            <div className="iv-progress">
              <div className="iv-progress__track">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`iv-progress__seg ${step > s ? 'iv-progress__seg--done' : step === s ? 'iv-progress__seg--active' : ''}`}
                  />
                ))}
              </div>
              <p className="iv-progress__label">
                Step <span>{step} of 3</span>:{' '}
                {step === 1 && 'Property details'}
                {step === 2 && 'Features'}
                {step === 3 && 'Your valuation'}
              </p>
            </div>

            <div className="iv-card-wrap">

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <>
                  <div className="iv-step-head">
                    <p className="iv-step-head__eyebrow">Step 1 of 3</p>
                    <h1 className="iv-step-head__title">Tell us about the property</h1>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of valuation do you need?</p>
                    <div className="iv-opts iv-opts--3">
                       {([
                        { id: 'let',  label: 'Let',       desc: 'Monthly rental estimate' },
                        { id: 'sale', label: 'Sale',       desc: 'Property sale price' },
                        { id: 'both', label: 'Let & Sale', desc: 'Both estimates' },
                      ] as { id: ValuationType; label: string; desc: string }[]).map(({ id, label, desc }) => (
                        <button key={id} onClick={() => setValType(id)}
                          className={`iv-opt ${valType === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__label">{label}</span>
                          <span className="iv-opt__desc">{desc}</span>
                        </button>
                      ))}
                    </div>
                    
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What's the property postcode?</p>
                    <input
                      type="text"
                      className={`iv-input ${postcodeErr ? 'iv-input--error' : ''}`}
                      placeholder="e.g. LS6 1AA"
                      value={postcode}
                      onChange={(e) => {
                        setPostcode(e.target.value.toUpperCase());
                        // Clear error while typing, only re-validate on blur
                        if (postcodeErr) setPostcodeErr('');
                      }}
                      onBlur={handlePostcodeBlur}
                      maxLength={8}
                    />
                    {postcodeErr && <p className="iv-error">{postcodeErr}</p>}
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of property is it?</p>
                    <div className="iv-opts iv-opts--4">
                      {([
                        { id: 'flat',     label: 'Flat / Apartment', icon: '🏢' },
                        { id: 'terraced', label: 'Terraced',          icon: '🏘️' },
                        { id: 'semi',     label: 'Semi-Detached',     icon: '🏡' },
                        { id: 'detached', label: 'Detached',           icon: '🏠' },
                      ] as { id: PropertyType; label: string; icon: string }[]).map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setPropType(id)}
                          className={`iv-opt ${propType === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">How many bedrooms?</p>
                    <div className="iv-pills">
                      {[0, 1, 2, 3, 4].map((n) => (
                        <button key={n} onClick={() => setBedrooms(n)}
                          className={`iv-pill ${bedrooms === n ? 'iv-pill--active' : ''}`}>
                          {n === 0 ? 'Studio' : n === 4 ? '4+ beds' : `${n} bed${n > 1 ? 's' : ''}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-step-foot">
                    <span />
                    <button className="iv-btn-primary" onClick={handleStep1Next} disabled={!step1Complete}>
                      Next: Features →
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <>
                  <div className="iv-step-head">
                    <p className="iv-step-head__eyebrow">Step 2 of 3</p>
                    <h1 className="iv-step-head__title">Property features</h1>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">How many bathrooms?</p>
                    <div className="iv-pills">
                      {[1, 2, 3, 4].map((n) => (
                        <button key={n} onClick={() => setBathrooms(n)}
                          className={`iv-pill ${bathrooms === n ? 'iv-pill--active' : ''}`}>
                          {n === 4 ? '4+' : n} bath{n > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">Does the property have a balcony?</p>
                    <div className="iv-opts iv-opts--2">
                      {([
                        { val: true,  label: 'Yes', icon: '🌇' },
                        { val: false, label: 'No',  icon: '🚫' },
                      ] as { val: boolean; label: string; icon: string }[]).map(({ val, label, icon }) => (
                        <button key={String(val)} onClick={() => setBalcony(val)}
                          className={`iv-opt ${balcony === val ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of garden does it have?</p>
                    <div className="iv-opts iv-opts--4">
                      {([
                        { id: 'private', label: 'Private',          icon: '🌳' },
                        { id: 'shared',  label: 'Shared / Communal', icon: '🌿' },
                        { id: 'patio',   label: 'Patio / Courtyard', icon: '🪴' },
                        { id: 'none',    label: 'No Garden',          icon: '🚫' },
                      ] as { id: GardenType; label: string; icon: string }[]).map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setGarden(id)}
                          className={`iv-opt ${garden === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of parking is available?</p>
                    <div className="iv-opts iv-opts--3">
                      {([
                        { id: 'garage',    label: 'Garage',                icon: '🚪' },
                        { id: 'driveway',  label: 'Driveway (off-street)', icon: '🛣️' },
                        { id: 'allocated', label: 'Allocated Space',        icon: '🅿️' },
                        { id: 'permit',    label: 'Permit Parking',         icon: '🎫' },
                        { id: 'on_street', label: 'On-Street',              icon: '🚗' },
                        { id: 'none',      label: 'No Parking',            icon: '🚫' },
                      ] as { id: ParkingType; label: string; icon: string }[]).map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setParking(id)}
                          className={`iv-opt ${parking === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-step-foot">
                    <button className="iv-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                    <button
                      className="iv-btn-primary"
                      onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={!step2Complete}
                    >
                      Next: Get valuation →
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <>
                  <div className="iv-step-head">
                    <p className="iv-step-head__eyebrow">Step 3 of 3</p>
                    <h1 className="iv-step-head__title">Your instant valuation is ready</h1>
                  </div>

                  <div className="iv-summary">
                    <span className="iv-summary__item"><strong>{postcode.trim().toUpperCase()}</strong></span>
                    <span className="iv-summary__item"><strong>{propType ? propType.charAt(0).toUpperCase() + propType.slice(1) : ''}</strong></span>
                    <span className="iv-summary__item"><strong>{bedrooms === 0 ? 'Studio' : `${bedrooms} bed`}</strong></span>
                    <span className="iv-summary__item"><strong>{bathrooms} bath</strong></span>
                    <span className="iv-summary__item">
                      <strong>{valType === 'let' ? 'Let' : valType === 'sale' ? 'Sale' : 'Let & Sale'}</strong>
                    </span>
                  </div>

                  <div className="iv-gate">
                    <div className="iv-gate__icon">🏡</div>
                    <p className="iv-gate__title">Would you like to receive your instant valuation?</p>
                    <p className="iv-gate__sub">
                      We'll email your personalised report straight away. No spam, no obligation.
                    </p>
                    <div className="iv-gate__btns">
                      <button className="iv-gate__btn iv-gate__btn--yes" onClick={handleYes}>
                        ✅ Yes, send my valuation
                      </button>
                      <button className="iv-gate__btn iv-gate__btn--no" onClick={handleNo}>
                        No thanks
                      </button>
                    </div>
                  </div>

                  <div className="iv-step-foot">
                    <button className="iv-btn-ghost" onClick={() => setStep(2)}>← Back</button>
                    <span />
                  </div>
                </>
              )}

            </div>
          </>
        )}

        {/* ── CONTACT VIEW ── */}
        {view === 'contact' && (
          <div className="iv-contact-view">
            <button className="iv-contact-view__back" onClick={() => { setView('wizard'); setStep(3); }}>
              ← Back
            </button>
            <h2>Just a few details</h2>
            <p className="sub">We'll email your valuation report straight away. No spam, no obligation.</p>

            <div className="iv-form-grid">
              <div className="iv-form-field">
                <label htmlFor="iv-fn">First name</label>
                <input id="iv-fn" type="text"
                  className={`iv-input iv-input--contact ${leadErrors.firstName ? 'iv-input--error' : ''}`}
                  placeholder="Jane" value={lead.firstName}
                  onChange={(e) => updateLead('firstName', e.target.value)} autoFocus />
                {leadErrors.firstName && <p className="iv-error">{leadErrors.firstName}</p>}
              </div>
              <div className="iv-form-field">
                <label htmlFor="iv-ln">Last name</label>
                <input id="iv-ln" type="text"
                  className={`iv-input iv-input--contact ${leadErrors.lastName ? 'iv-input--error' : ''}`}
                  placeholder="Smith" value={lead.lastName}
                  onChange={(e) => updateLead('lastName', e.target.value)} />
                {leadErrors.lastName && <p className="iv-error">{leadErrors.lastName}</p>}
              </div>
              <div className="iv-form-field">
                <label htmlFor="iv-em">Email address</label>
                <input id="iv-em" type="email"
                  className={`iv-input iv-input--contact ${leadErrors.email ? 'iv-input--error' : ''}`}
                  placeholder="jane.smith@email.com" value={lead.email}
                  onChange={(e) => updateLead('email', e.target.value)} />
                {leadErrors.email && <p className="iv-error">{leadErrors.email}</p>}
              </div>
              <div className="iv-form-field">
                <label htmlFor="iv-ph">Phone number</label>
                <input id="iv-ph" type="tel"
                  className={`iv-input iv-input--contact ${leadErrors.phone ? 'iv-input--error' : ''}`}
                  placeholder="07123 456789" value={lead.phone}
                  onChange={(e) => updateLead('phone', e.target.value)} />
                {leadErrors.phone && <p className="iv-error">{leadErrors.phone}</p>}
              </div>
            </div>

            <button className="iv-submit-btn" onClick={handleSubmitContact} disabled={submitting}>
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
              our team is always happy to help, with no pressure and no obligation.
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
              We've emailed your personalised valuation report to{' '}
              <strong style={{ color: '#0f1f3d' }}>{lead.email}</strong>.
              Check your inbox. It should arrive within a few minutes.
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
      <Footer />
    </>
  );
}
