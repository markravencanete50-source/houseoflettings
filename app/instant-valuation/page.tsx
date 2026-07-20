'use client';
// app/instant-valuation/page.tsx
//
// Instant valuation wizard — covers EVERY UK postcode.
//   Step 1: valuation type (let / sale / both), postcode + address lookup,
//           property type, bedrooms.
//   Step 2: bathrooms, condition, EPC, garden, balcony, parking.
//   Report: shown immediately on the page (no email gate) — conservative /
//           market / optimistic figures, AI analysis and supporting data.
//   Then:   optional "email me the PDF report" step, followed by a
//           "book a professional valuation" prompt that routes to /book-valuation.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';
import {
  isValidUKPostcode, fmtGBP, bedroomsLabel,
  PROPERTY_TYPE_LABEL, CONDITION_LABEL, GARDEN_LABEL, PARKING_LABEL,
  type ValuationType, type PropertyTypeId, type ConditionId, type EpcId,
  type GardenId, type ParkingId, type FullValuationInput, type FullValuationResult,
  type ModeValuation,
} from '@/lib/valuation/fullEngine';
import type { AiAnalysis } from '@/lib/ai/groqValuation';

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 1 | 2;
type View = 'wizard' | 'report';

interface LeadInfo {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
}

interface ValuationReport {
  property: FullValuationInput;
  type: ValuationType;
  result: FullValuationResult;
  ai: AiAnalysis;
  generatedAt: string;
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
function isValidUKPhone(p: string) {
  const c = p.replace(/[\s()-]/g, '');
  return /^(\+44\d{9,10}|0\d{9,10})$/.test(c);
}

const BOOK_TYPE_LABEL: Record<PropertyTypeId, string> = {
  flat: 'Flat / Apartment', terraced: 'Terraced House', semi: 'Semi-Detached House',
  detached: 'Detached House', bungalow: 'Bungalow',
};
function bookBedsLabel(n: number): string {
  if (n === 0) return 'Studio';
  if (n >= 4) return '4+ Bedrooms';
  return `${n} Bedroom${n > 1 ? 's' : ''}`;
}

export default function InstantValuationPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('wizard');
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [valType,      setValType]      = useState<ValuationType | ''>('');
  const [postcode,     setPostcode]     = useState('');
  const [postcodeErr,  setPostcodeErr]  = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city,         setCity]         = useState('');
  const [propType,     setPropType]     = useState<PropertyTypeId | ''>('');
  const [bedrooms,     setBedrooms]     = useState<number | ''>('');

  // Step 2
  const [bathrooms, setBathrooms] = useState<number | ''>('');
  const [condition, setCondition] = useState<ConditionId | ''>('');
  const [epc,       setEpc]       = useState<EpcId | ''>('');
  const [garden,    setGarden]    = useState<GardenId | ''>('');
  const [balcony,   setBalcony]   = useState<boolean | ''>('');
  const [parking,   setParking]   = useState<ParkingId | ''>('');

  // Report
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState('');
  const [report,     setReport]     = useState<ValuationReport | null>(null);

  // Email opt-in
  const [emailChoice, setEmailChoice] = useState<'yes' | 'no' | null>(null);
  const [lead,        setLead]        = useState<LeadInfo>({ firstName: '', lastName: '', email: '', phone: '' });
  const [leadErrors,  setLeadErrors]  = useState<Partial<LeadInfo>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [emailSent,   setEmailSent]   = useState(false);
  const [emailError,  setEmailError]  = useState('');

  // Book-a-valuation prompt
  const [showBookModal, setShowBookModal] = useState(false);

  const step1Complete =
    valType !== '' && isValidUKPostcode(postcode) && addressLine1.trim() !== '' &&
    propType !== '' && bedrooms !== '';
  const step2Complete =
    bathrooms !== '' && condition !== '' && epc !== '' &&
    garden !== '' && balcony !== '' && parking !== '';

  const validatePostcode = (): boolean => {
    const raw = postcode.trim();
    if (!raw) { setPostcodeErr(''); return false; }
    if (!isValidUKPostcode(raw)) {
      setPostcodeErr('Please enter a full UK postcode (e.g. LS6 1AA, M1 1AE, SW1A 1AA).');
      return false;
    }
    setPostcodeErr('');
    return true;
  };

  const handleAddressSelect = (a: AddressResult) => {
    if (a.street) setAddressLine1(a.street);
    if (a.city) setCity(a.city);
    if (a.postcode) setPostcode(a.postcode);
    setPostcodeErr('');
  };

  const handleStep1Next = () => {
    if (!validatePostcode() || !step1Complete) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Generate the report (deterministic engine + AI on the server) ──
  const handleGenerate = async () => {
    if (!step2Complete || generating) return;
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/instant-valuation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: valType,
          postcode: postcode.trim(),
          addressLine1: addressLine1.trim(),
          propertyType: propType,
          bedrooms, bathrooms, condition, epc, garden,
          balcony, parking,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.report) throw new Error(json.message || 'Could not generate your valuation.');
      setReport(json.report as ValuationReport);
      setView('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setGenError(e.message || 'Could not generate your valuation. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Email the PDF ──
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

  const handleSendEmail = async () => {
    if (!validateContact() || !report || submitting) return;
    setSubmitting(true);
    setEmailError('');
    try {
      const res = await fetch('/api/instant-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: lead, report }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Could not send your report.');
      setEmailSent(true);
      setShowBookModal(true);
    } catch (e: any) {
      setEmailError(e.message || 'Could not send your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineEmail = () => {
    setEmailChoice('no');
    setShowBookModal(true);
  };

  const goToBookValuation = () => {
    const params = new URLSearchParams();
    if (addressLine1.trim()) params.set('street', addressLine1.trim());
    if (city.trim()) params.set('city', city.trim());
    params.set('postcode', postcode.trim().toUpperCase());
    if (propType) params.set('type', BOOK_TYPE_LABEL[propType]);
    if (bedrooms !== '') params.set('beds', bookBedsLabel(bedrooms));
    if (lead.firstName.trim() || lead.lastName.trim()) params.set('name', `${lead.firstName} ${lead.lastName}`.trim());
    if (lead.email.trim()) params.set('email', lead.email.trim());
    if (lead.phone.trim()) params.set('phone', lead.phone.trim());
    router.push(`/book-valuation?${params.toString()}`);
  };

  const handleReset = () => {
    setView('wizard'); setStep(1);
    setValType(''); setPostcode(''); setPostcodeErr('');
    setAddressLine1(''); setCity('');
    setPropType(''); setBedrooms(''); setBathrooms('');
    setCondition(''); setEpc('');
    setBalcony(''); setGarden(''); setParking('');
    setReport(null); setGenError('');
    setEmailChoice(null); setEmailSent(false); setEmailError('');
    setLead({ firstName: '', lastName: '', email: '', phone: '' });
    setLeadErrors({}); setShowBookModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateLead = (field: keyof LeadInfo, val: string) =>
    setLead((prev) => ({ ...prev, [field]: val }));

  const rent = report?.result.rent;
  const sale = report?.result.sale;

  return (
    <>
      <style>{PAGE_CSS}</style>

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
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={`iv-progress__seg ${step > s ? 'iv-progress__seg--done' : step === s ? 'iv-progress__seg--active' : ''}`}
                  />
                ))}
              </div>
              <p className="iv-progress__label">
                Step <span>{step} of 2</span>:{' '}
                {step === 1 ? 'Property details' : 'Property features'}
              </p>
            </div>

            <div className="iv-card-wrap">

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <>
                  <div className="iv-step-head">
                    <p className="iv-step-head__eyebrow">Step 1 of 2</p>
                    <h1 className="iv-step-head__title">Tell us about the property</h1>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of valuation do you need?</p>
                    <div className="iv-opts iv-opts--3">
                      {([
                        { id: 'let',  label: 'Let',        desc: 'Monthly rental estimate' },
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
                    <PostcodeLookup
                      postcode={postcode}
                      onPostcodeChange={(v) => { setPostcode(v.toUpperCase()); if (postcodeErr) setPostcodeErr(''); }}
                      onSelect={handleAddressSelect}
                      inputClassName={`iv-input ${postcodeErr ? 'iv-input--error' : ''}`}
                      placeholder="e.g. LS6 1AA"
                    />
                    {postcodeErr && <p className="iv-error">{postcodeErr}</p>}
                    <p className="iv-hint">Any UK postcode works. Search it, then pick your address, or type the first line below.</p>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What's the first line of the address?</p>
                    <input
                      type="text"
                      className="iv-input iv-input--contact"
                      placeholder="e.g. 12 Whitfield Street"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                    />
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of property is it?</p>
                    <div className="iv-opts iv-opts--3">
                      {([
                        { id: 'flat',     label: 'Flat / Apartment', icon: '🏢' },
                        { id: 'terraced', label: 'Terraced',         icon: '🏘️' },
                        { id: 'semi',     label: 'Semi-Detached',    icon: '🏡' },
                        { id: 'detached', label: 'Detached',         icon: '🏠' },
                        { id: 'bungalow', label: 'Bungalow',         icon: '🛖' },
                      ] as { id: PropertyTypeId; label: string; icon: string }[]).map(({ id, label, icon }) => (
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
                      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                        <button key={n} onClick={() => setBedrooms(n)}
                          className={`iv-pill ${bedrooms === n ? 'iv-pill--active' : ''}`}>
                          {n === 0 ? 'Studio' : n === 6 ? '6+ beds' : `${n} bed${n > 1 ? 's' : ''}`}
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
                    <p className="iv-step-head__eyebrow">Step 2 of 2</p>
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
                    <p className="iv-section__q">What condition is the property in?</p>
                    <div className="iv-opts iv-opts--3">
                      {([
                        { id: 'excellent',  label: 'Excellent',        desc: 'Recently renovated',   icon: '✨' },
                        { id: 'good',       label: 'Good',             desc: 'Well maintained',      icon: '👍' },
                        { id: 'average',    label: 'Average',          desc: 'Liveable, some wear',  icon: '🏠' },
                        { id: 'dated',      label: 'Dated',            desc: 'Needs modernising',    icon: '🕰️' },
                        { id: 'renovation', label: 'Needs renovation', desc: 'Full refurb required', icon: '🔨' },
                      ] as { id: ConditionId; label: string; desc: string; icon: string }[]).map(({ id, label, desc, icon }) => (
                        <button key={id} onClick={() => setCondition(id)}
                          className={`iv-opt ${condition === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
                          <span className="iv-opt__desc">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What's the EPC (energy) rating?</p>
                    <div className="iv-pills">
                      {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'unknown'] as EpcId[]).map((r) => (
                        <button key={r} onClick={() => setEpc(r)}
                          className={`iv-pill ${epc === r ? 'iv-pill--active' : ''}`}>
                          {r === 'unknown' ? 'Not sure' : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="iv-section">
                    <p className="iv-section__q">What type of garden does it have?</p>
                    <div className="iv-opts iv-opts--4">
                      {([
                        { id: 'private', label: 'Private',           icon: '🌳' },
                        { id: 'shared',  label: 'Shared / Communal', icon: '🌿' },
                        { id: 'patio',   label: 'Patio / Courtyard', icon: '🪴' },
                        { id: 'none',    label: 'No Garden',         icon: '🚫' },
                      ] as { id: GardenId; label: string; icon: string }[]).map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setGarden(id)}
                          className={`iv-opt ${garden === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
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
                    <p className="iv-section__q">What type of parking is available?</p>
                    <div className="iv-opts iv-opts--3">
                      {([
                        { id: 'garage',    label: 'Garage',                icon: '🚪' },
                        { id: 'driveway',  label: 'Driveway (off-street)', icon: '🛣️' },
                        { id: 'allocated', label: 'Allocated Space',       icon: '🅿️' },
                        { id: 'permit',    label: 'Permit Parking',        icon: '🎫' },
                        { id: 'on_street', label: 'On-Street',             icon: '🚗' },
                        { id: 'none',      label: 'No Parking',            icon: '🚫' },
                      ] as { id: ParkingId; label: string; icon: string }[]).map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setParking(id)}
                          className={`iv-opt ${parking === id ? 'iv-opt--active' : ''}`}>
                          <span className="iv-opt__icon">{icon}</span>
                          <span className="iv-opt__label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {genError && (
                    <div className="iv-section">
                      <p className="iv-error">{genError}</p>
                    </div>
                  )}

                  <div className="iv-step-foot">
                    <button className="iv-btn-ghost" onClick={() => setStep(1)} disabled={generating}>← Back</button>
                    <button className="iv-btn-primary" onClick={handleGenerate} disabled={!step2Complete || generating}>
                      {generating ? 'Analysing the market…' : 'Get my instant valuation →'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── REPORT ── */}
        {view === 'report' && report && (
          <div className="iv-report">

            <div className="iv-card-wrap">
              <div className="iv-step-head">
                <p className="iv-step-head__eyebrow">Your instant valuation</p>
                <h1 className="iv-step-head__title">
                  {addressLine1.trim() ? `${addressLine1.trim()}, ` : ''}{report.result.postcode}
                </h1>
                <p className="iv-report__area">{report.result.areaLabel}</p>
              </div>

              <div className="iv-summary">
                <span className="iv-summary__item"><strong>{propType ? PROPERTY_TYPE_LABEL[propType as PropertyTypeId] : ''}</strong></span>
                <span className="iv-summary__item"><strong>{bedrooms !== '' ? bedroomsLabel(bedrooms) : ''}</strong></span>
                <span className="iv-summary__item"><strong>{bathrooms} bath{Number(bathrooms) > 1 ? 's' : ''}</strong></span>
                {condition && <span className="iv-summary__item"><strong>{CONDITION_LABEL[condition as ConditionId].split(' (')[0]}</strong></span>}
                {epc && <span className="iv-summary__item"><strong>{epc === 'unknown' ? 'EPC n/a' : `EPC ${epc}`}</strong></span>}
              </div>

              {/* Valuation bands */}
              {([
                rent ? { m: rent as ModeValuation, title: 'Estimated Monthly Rent', suffix: '/month' } : null,
                sale ? { m: sale as ModeValuation, title: 'Estimated Sale Price', suffix: '' } : null,
              ].filter(Boolean) as { m: ModeValuation; title: string; suffix: string }[]).map(({ m, title, suffix }) => (
                <div className="iv-section" key={m.mode}>
                  <p className="iv-band__title">{title}</p>
                  <div className="iv-band">
                    <div className="iv-band__col">
                      <span className="iv-band__label">Conservative</span>
                      <span className="iv-band__value">{fmtGBP(m.conservative)}{suffix}</span>
                      <span className="iv-band__desc">{m.mode === 'rent' ? 'Lets fast' : 'Sells fast'}</span>
                    </div>
                    <div className="iv-band__col iv-band__col--mid">
                      <span className="iv-band__label">Market Value</span>
                      <span className="iv-band__value">{fmtGBP(m.market)}{suffix}</span>
                      <span className="iv-band__desc">Our best estimate</span>
                    </div>
                    <div className="iv-band__col">
                      <span className="iv-band__label">Optimistic</span>
                      <span className="iv-band__value">{fmtGBP(m.optimistic)}{suffix}</span>
                      <span className="iv-band__desc">Strong-market ceiling</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* AI analysis */}
              <div className="iv-section">
                <p className="iv-report__h">Valuation summary</p>
                <p className="iv-report__p">{report.ai.summary}</p>
                {report.ai.rentCommentary && <p className="iv-report__p">{report.ai.rentCommentary}</p>}
                {report.ai.saleCommentary && <p className="iv-report__p">{report.ai.saleCommentary}</p>}
              </div>

              <div className="iv-section">
                <p className="iv-report__h">What drives this valuation</p>
                <ul className="iv-report__list">
                  {report.ai.keyDrivers.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>

              <div className="iv-section">
                <p className="iv-report__h">Local market outlook</p>
                <p className="iv-report__p">{report.ai.marketOutlook}</p>
                <p className="iv-report__support">
                  Supporting data: {report.result.dataYear} ONS &amp; Zoopla market baselines
                  {report.result.isOperatingArea
                    ? ` refined to district level for ${report.result.areaLabel}`
                    : ` for the ${report.result.regionLabel} region`}
                  {rent ? ` · regional rents ${rent.annualGrowthPct >= 0 ? '+' : ''}${rent.annualGrowthPct}% YoY` : ''}
                  {sale ? ` · regional prices ${sale.annualGrowthPct >= 0 ? '+' : ''}${sale.annualGrowthPct}% YoY` : ''}
                  {' '}· data refreshed {report.result.dataUpdated}.
                </p>
              </div>

              {(rent?.adjustments?.length || sale?.adjustments?.length) ? (
                <div className="iv-section">
                  <p className="iv-report__h">Feature adjustments applied</p>
                  <ul className="iv-report__list">
                    {(rent?.adjustments?.length ? rent : sale)!.adjustments.map((a, i) => (
                      <li key={i}>{a.label}: {a.pct >= 0 ? '+' : ''}{(a.pct * 100).toFixed(1)}%</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="iv-section">
                <p className="iv-report__disclaimer">
                  This is an automated, indicative estimate, not a formal valuation. Actual value
                  depends on the property's exact location, internal specification, presentation and
                  market conditions. For a precise figure, book a free professional valuation below.
                </p>
              </div>
            </div>

            {/* ── EMAIL OPT-IN ── */}
            <div className="iv-email-card">
              {!emailSent && emailChoice !== 'no' && (
                <>
                  <p className="iv-email-card__title">📬 Would you like this report emailed to you?</p>
                  <p className="iv-email-card__sub">
                    We'll send the full report as a professionally formatted PDF: figures, analysis and
                    supporting data included. No spam, no obligation.
                  </p>

                  {emailChoice !== 'yes' ? (
                    <div className="iv-gate__btns">
                      <button className="iv-gate__btn iv-gate__btn--yes" onClick={() => setEmailChoice('yes')}>
                        Yes, email me the PDF report
                      </button>
                      <button className="iv-gate__btn iv-gate__btn--no" onClick={handleDeclineEmail}>
                        No thanks
                      </button>
                    </div>
                  ) : (
                    <>
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
                      {emailError && <p className="iv-error" style={{ marginTop: '0.75rem' }}>{emailError}</p>}
                      <button className="iv-submit-btn" onClick={handleSendEmail} disabled={submitting}>
                        {submitting ? 'Sending your report…' : 'Send my PDF report →'}
                      </button>
                      <p className="iv-privacy">
                        We only use your details to send your valuation and follow up on your enquiry.
                        We never share your information with third parties.
                      </p>
                    </>
                  )}
                </>
              )}

              {emailSent && (
                <>
                  <p className="iv-email-card__title">✅ Your report is on its way</p>
                  <p className="iv-email-card__sub">
                    We've emailed your full PDF valuation report to <strong>{lead.email}</strong>.
                    It should arrive within a few minutes. Check your spam folder if not.
                  </p>
                </>
              )}

              {emailChoice === 'no' && !emailSent && (
                <p className="iv-email-card__sub" style={{ marginBottom: 0 }}>
                  No problem. Your valuation stays right here on this page.
                </p>
              )}
            </div>

            {/* ── PERSISTENT NEXT-STEP CTA ── */}
            <div className="iv-next-card">
              <p className="iv-next-card__title">Want a precise figure?</p>
              <p className="iv-next-card__sub">
                A free professional valuation with one of our local experts confirms exactly what your
                property can achieve, with no obligation.
              </p>
              <div className="iv-gate__btns">
                <button className="iv-gate__btn iv-gate__btn--yes" onClick={goToBookValuation}>
                  Book a free professional valuation
                </button>
                <button className="iv-gate__btn iv-gate__btn--no" onClick={handleReset}>
                  Value another property
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BOOK-VALUATION MODAL ── */}
        {showBookModal && (
          <div className="iv-modal-overlay" onClick={() => setShowBookModal(false)}>
            <div className="iv-modal" onClick={(e) => e.stopPropagation()}>
              <div className="iv-modal__icon">🏡</div>
              <p className="iv-modal__title">Would you like to book a professional valuation?</p>
              <p className="iv-modal__sub">
                Our local expert will visit the property and confirm a precise valuation,
                completely free and with no obligation.
              </p>
              <div className="iv-gate__btns">
                <button className="iv-gate__btn iv-gate__btn--yes" onClick={goToBookValuation}>
                  Yes, book my free valuation
                </button>
                <button className="iv-gate__btn iv-gate__btn--no" onClick={() => setShowBookModal(false)}>
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </>
  );
}

const PAGE_CSS = `
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
  .iv-report__area { font-size: 0.875rem; color: #6b7280; margin: 0.4rem 0 0; }

  .iv-section {
    padding: 1.75rem 2.25rem;
    border-bottom: 1px solid #eef1f5;
  }
  .iv-section:last-child { border-bottom: none; }
  .iv-section__q { font-size: 0.9375rem; font-weight: 600; color: #374151; margin: 0 0 1rem; }
  .iv-hint { font-size: 0.8rem; color: #9ca3af; margin: 0.5rem 0 0; }

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
    transition: background 0.18s, transform 0.14s; flex: 1; max-width: 320px;
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

  /* ── Report ── */
  .iv-report { width: 100%; max-width: 680px; display: flex; flex-direction: column; gap: 1.25rem; }
  .iv-band__title { font-size: 0.9375rem; font-weight: 700; color: #0f1f3d; margin: 0 0 0.875rem; }
  .iv-band {
    display: grid; grid-template-columns: 1fr 1.15fr 1fr; gap: 0.625rem;
  }
  .iv-band__col {
    border: 1.5px solid #e5e7eb; border-radius: 0.875rem;
    padding: 1rem 0.875rem; text-align: center;
    display: flex; flex-direction: column; gap: 0.3rem;
  }
  .iv-band__col--mid { border-color: #2563eb; background: #eff5ff; }
  .iv-band__label {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #6b7280;
  }
  .iv-band__value { font-size: 1.125rem; font-weight: 800; color: #0f1f3d; }
  .iv-band__col--mid .iv-band__value { color: #1d4ed8; font-size: 1.3rem; }
  .iv-band__desc { font-size: 0.7rem; color: #9ca3af; }

  .iv-report__h { font-size: 0.9375rem; font-weight: 700; color: #0f1f3d; margin: 0 0 0.625rem; }
  .iv-report__p { font-size: 0.875rem; color: #374151; line-height: 1.7; margin: 0 0 0.75rem; }
  .iv-report__p:last-child { margin-bottom: 0; }
  .iv-report__list { margin: 0; padding-left: 1.125rem; }
  .iv-report__list li { font-size: 0.875rem; color: #374151; line-height: 1.7; margin-bottom: 0.35rem; }
  .iv-report__support { font-size: 0.775rem; color: #9ca3af; line-height: 1.6; margin: 0.5rem 0 0; }
  .iv-report__disclaimer { font-size: 0.775rem; color: #9ca3af; line-height: 1.6; margin: 0; }

  .iv-email-card, .iv-next-card {
    width: 100%;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 1.5rem; padding: 2rem 2.25rem;
    box-shadow: 0 4px 24px rgba(15,31,61,0.06);
  }
  .iv-email-card__title, .iv-next-card__title {
    font-size: 1.125rem; font-weight: 800; color: #0f1f3d; margin: 0 0 0.5rem;
  }
  .iv-email-card__sub, .iv-next-card__sub {
    font-size: 0.875rem; color: #6b7280; line-height: 1.65; margin: 0 0 1.25rem;
  }
  .iv-next-card { text-align: center; }

  .iv-gate__btns { display: flex; gap: 0.875rem; justify-content: center; flex-wrap: wrap; }
  .iv-gate__btn {
    padding: 0.875rem 2rem; border-radius: 0.75rem;
    font-size: 0.9375rem; font-weight: 700; cursor: pointer; transition: all 0.18s; border: none;
  }
  .iv-gate__btn--yes { background: #2563eb; color: #fff; }
  .iv-gate__btn--yes:hover { background: #1d4ed8; transform: translateY(-1px); }
  .iv-gate__btn--no {
    background: #fff; color: #374151;
    border: 1.5px solid #e5e7eb;
  }
  .iv-gate__btn--no:hover { background: #f6f9fc; color: #0f1f3d; border-color: #c7d2e0; }

  .iv-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.125rem; }
  .iv-form-field { display: flex; flex-direction: column; gap: 0.4rem; }
  .iv-form-field label {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.07em;
    text-transform: uppercase; color: #6b7280;
  }
  .iv-submit-btn {
    width: 100%; margin-top: 1.5rem; padding: 1rem;
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

  /* ── Modal ── */
  .iv-modal-overlay {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(15,31,61,0.45);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }
  .iv-modal {
    width: 100%; max-width: 460px;
    background: #fff; border-radius: 1.25rem;
    padding: 2.25rem 2rem; text-align: center;
    box-shadow: 0 20px 60px rgba(15,31,61,0.25);
    animation: iv-pop .35s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes iv-pop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .iv-modal__icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .iv-modal__title { font-size: 1.25rem; font-weight: 800; color: #0f1f3d; margin: 0 0 0.5rem; }
  .iv-modal__sub { font-size: 0.875rem; color: #6b7280; line-height: 1.65; margin: 0 0 1.5rem; }

  @media (max-width: 600px) {
    .iv-section { padding: 1.25rem 1.125rem; }
    .iv-step-head { padding: 1.5rem 1.125rem 1rem; }
    .iv-step-foot { padding: 1.25rem 1.125rem; }
    .iv-summary { padding: 0.875rem 1.125rem; }
    .iv-opts--3 { grid-template-columns: 1fr 1fr; }
    .iv-opts--4 { grid-template-columns: 1fr 1fr; }
    .iv-form-grid { grid-template-columns: 1fr; }
    .iv-email-card, .iv-next-card { padding: 1.5rem 1.125rem; }
    .iv-band { grid-template-columns: 1fr; }
    .iv-gate__btns { flex-direction: column; }
    .iv-gate__btn { width: 100%; }
  }
`;
