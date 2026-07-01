'use client';
// app/landlord-registration/page.tsx
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';

const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Services House of Lettings offers — the landlord ticks what they need.
const SERVICE_OPTIONS = [
  { value: 'Full Management', desc: 'End-to-end management of your property' },
  { value: 'Rent Collection', desc: 'We collect rent and chase any arrears' },
  { value: 'Tenant Find', desc: 'Advertise, reference and place a tenant' },
  { value: 'EPC Document', desc: 'Energy Performance Certificate (rated E or above)' },
  { value: 'Electrical & Gas Certificate', desc: 'EICR + annual Gas Safety Certificate' },
  { value: 'Land Registry Title Check', desc: 'Confirm ownership & title documents' },
];

const REGISTRATION_FAQS = [
  {
    q: 'Why register my property with House of Lettings?',
    a: 'Registering gives our lettings team the details we need to build a tailored management proposal for your property. We handle tenant finding, referencing, rent collection, maintenance and full legal compliance across Leeds and Manchester — so you get a hands-off, fully compliant let and a dedicated local agent for your portfolio.',
  },
  {
    q: 'What documents will I need to let my property legally in the UK?',
    a: 'You will need a valid Energy Performance Certificate (EPC) rated E or above, a Gas Safety Certificate (renewed annually where there are gas appliances) and an Electrical Installation Condition Report (EICR, renewed every 5 years). Working smoke alarms on every floor and a carbon monoxide alarm in any room with a fuel-burning appliance are also legally required. We can arrange and track all of these for you.',
  },
  {
    q: 'Do I have to protect my tenant’s deposit?',
    a: 'Yes. Any deposit taken must be placed in a government-approved tenancy deposit scheme (DPS, mydeposits or TDS) within 30 days, and the tenant must be given the prescribed information. We handle deposit protection as part of our managed packages.',
  },
  {
    q: 'Is registering a commitment or a contract?',
    a: 'No. Registering simply starts the conversation — there is no obligation and no fee to register. Once we understand your property and the services you need, we will send a clear proposal. You only proceed if you are happy with it.',
  },
  {
    q: 'How many properties can I register?',
    a: 'As many as you like. Whether you own a single flat or a large portfolio, let us know the number of properties you hold and we will scope a package that works for you.',
  },
];

const EMPTY_FORM = {
  fullName: '', email: '', phone: '',
  propertyCount: '',
  street: '', city: '', county: '', postcode: '',
  notes: '',
};

function validate(form: typeof EMPTY_FORM, services: string[], termsAccepted: boolean) {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(form.email)) errors.email = 'Enter a valid email address';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, '')))
    errors.phone = 'Enter a valid UK phone number';
  if (!form.propertyCount) errors.propertyCount = 'Please tell us how many properties you own';
  if (!form.street.trim()) errors.street = '1st line of address is required';
  if (!form.postcode.trim()) errors.postcode = 'Postcode is required';
  if (services.length === 0) errors.services = 'Please select at least one service';
  if (!termsAccepted) errors.terms = 'Please accept the terms & conditions to continue';
  return errors;
}

export default function LandlordRegistrationPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [services, setServices] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddressSelect = useCallback((data: AddressResult) => {
    setForm(f => ({
      ...f,
      street: data.street || f.street,
      city: data.city || f.city,
      county: data.county || f.county,
      postcode: data.postcode || f.postcode,
    }));
    setErrors(e => ({ ...e, street: '', city: '', postcode: '' }));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(er => ({ ...er, [key]: '' }));
  };

  const toggleService = (value: string) => {
    setServices(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);
    setErrors(er => ({ ...er, services: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, services, termsAccepted);
    if (Object.keys(errs).length) {
      setErrors(errs);
      document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/landlord-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          services,
          termsAccepted,
          address: [form.street, form.city, form.county, form.postcode].filter(Boolean).join(', '),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />

      <div style={{ fontFamily: "'Poppins', sans-serif" }}>

        {/* ── HERO STRIP ── */}
        <div style={{
          backgroundImage: 'linear-gradient(135deg, rgba(10,22,47,0.90) 0%, rgba(15,31,61,0.82) 60%, rgba(22,40,73,0.75) 100%), url(/images/Landlord_page.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          paddingTop: 'calc(68px + clamp(56px, 8vw, 90px))',
          paddingBottom: 'clamp(56px, 8vw, 90px)',
          paddingLeft: 'clamp(20px, 5%, 5%)',
          paddingRight: 'clamp(20px, 5%, 5%)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', background: 'rgba(74,144,217,0.35)', color: '#93c5fd',
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 20, marginBottom: 18,
            border: '1px solid rgba(147,197,253,0.4)',
          }}>
            Landlord Registration
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(32px, 4.5vw, 54px)',
            fontWeight: 800, color: '#fff', lineHeight: 1.12, marginBottom: 16,
          }}>
            Register your property with House of Lettings
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.62)', maxWidth: 560,
            margin: '0 auto 32px', lineHeight: 1.65, fontWeight: 300,
          }}>
            Tell us about your property and the services you need. It&rsquo;s free, takes two minutes,
            and there&rsquo;s no obligation — just a tailored management proposal from your local Leeds &amp; Manchester team.
          </p>
          <a href="#registration-form" className="hol-hero-cta">
            Start Registration
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>

        {/* ── WHY REGISTER ── */}
        <section style={{ background: '#f7f8fa', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="hol-eyebrow">Why Register</div>
              <h2 className="hol-h2">Why register a landlord account with us</h2>
              <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.7 }}>
                One short form connects you with a dedicated local agent who handles everything from
                compliance to rent collection.
              </p>
            </div>
            <div className="hol-why-grid">
              {[
                { icon: '🏠', title: 'Hands-off management', desc: 'Tenant finding, referencing, inspections, maintenance and rent collection — all handled for you.' },
                { icon: '📋', title: 'Full UK compliance', desc: 'We arrange and track your EPC, Gas Safety, EICR and deposit protection so your let stays legal.' },
                { icon: '💷', title: 'Maximise your returns', desc: 'Accurate rental valuations and transparent pricing with no hidden fees, ever.' },
                { icon: '👤', title: 'A dedicated local agent', desc: 'A real person who knows the Leeds & Manchester market and manages your portfolio.' },
                { icon: '⚡', title: 'Fast turnaround', desc: 'We respond to every registration within 24–48 hours with a tailored proposal.' },
                { icon: '🔒', title: 'No obligation', desc: 'Registering is free and commitment-free — you only proceed if the proposal suits you.' },
              ].map(item => (
                <div key={item.title} className="hol-why-card">
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f1f3d', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICES OFFERED ── */}
        <section style={{ background: '#0f1f3d', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="hol-eyebrow" style={{ color: '#4a90d9' }}>What We Offer</div>
              <h2 className="hol-h2" style={{ color: '#fff' }}>Services you can request</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.7 }}>
                Tick the services you need in the form below — from full management to individual compliance certificates.
              </p>
            </div>
            <div className="hol-why-grid">
              {SERVICE_OPTIONS.map(s => (
                <div key={s.value} className="hol-service-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ color: '#4a90d9', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{s.value}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0, paddingLeft: 20 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TERMS & CONDITIONS ── */}
        <section style={{ background: '#fff', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="hol-eyebrow">The Terms</div>
              <h2 className="hol-h2">Property management terms &amp; conditions (UK)</h2>
              <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '14px auto 0', lineHeight: 1.7 }}>
                A plain-English summary of how we work together. You confirm you&rsquo;ve read these when you register.
              </p>
            </div>
            <ol className="hol-terms-list">
              {[
                ['No obligation to register', 'Registering your details is free and does not create a management agreement. A formal contract is only entered into once you accept a written proposal from us.'],
                ['Legal compliance', 'As the landlord you remain legally responsible for your property. We will arrange and track required documents — EPC (rated E or above), annual Gas Safety Certificate, EICR (every 5 years), smoke and carbon-monoxide alarms — under any managed package you take.'],
                ['Deposit protection', 'Where we hold a tenancy deposit, it will be protected in a government-approved scheme (DPS, mydeposits or TDS) within 30 days and the prescribed information served on the tenant.'],
                ['Fees', 'Any management, tenant-find or certificate fees are set out clearly in your proposal before work begins. We never charge hidden fees.'],
                ['Your data', 'The information you provide is used solely to prepare your proposal and manage your property. It is stored securely and never sold. See our Terms and Cookie Policy for full details.'],
                ['Right to decline', 'Both parties may decline to proceed after registration. Registering does not guarantee that House of Lettings will take on your property.'],
              ].map(([title, body], i) => (
                <li key={i}>
                  <strong>{title}.</strong> {body}
                </li>
              ))}
            </ol>
            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 24 }}>
              Full terms are available on our <Link href="/terms" style={{ color: '#2563eb', fontWeight: 600 }}>Terms &amp; Conditions</Link> page.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ background: '#f7f8fa', padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6%, 80px)' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="hol-eyebrow">Common Questions</div>
              <h2 className="hol-h2">Frequently asked questions</h2>
            </div>
            <div>
              {REGISTRATION_FAQS.map((faq, i) => (
                <div key={i} style={{ borderTop: '1px solid rgba(15,31,61,0.12)', borderBottom: i === REGISTRATION_FAQS.length - 1 ? '1px solid rgba(15,31,61,0.12)' : 'none' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', background: 'none', border: 'none', color: '#0f1f3d',
                      textAlign: 'left', padding: '22px 0', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 700, gap: 16,
                    }}
                  >
                    {faq.q}
                    <span style={{ color: '#2563eb', fontSize: 22, flexShrink: 0, lineHeight: 1, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                  </button>
                  {openFaq === i && (
                    <p style={{ fontFamily: "'Poppins', sans-serif", color: '#4b5563', fontSize: 14, lineHeight: 1.8, paddingBottom: 24, margin: 0 }}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REGISTRATION FORM ── */}
        <section id="registration-form" style={{ scrollMarginTop: 80 }} className="hol-page-bg">
          <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(48px, 7vw, 88px) clamp(16px, 4%, 4%)' }}>

            {status === 'success' ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5%, 5%)', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1a3c5e,#2563a8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(37,99,168,.35)',
                  animation: 'hol-pop .5s cubic-bezier(.34,1.56,.64,1)',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>
                  Registration Received!
                </h2>
                <p style={{ fontSize: 15, color: '#374151', maxWidth: 440, margin: '0 auto 8px', lineHeight: 1.6 }}>
                  Thank you, {form.fullName.split(' ')[0]}. We&rsquo;ve received your registration for <strong>{form.street}{form.city ? `, ${form.city}` : ''}</strong>.
                </p>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
                  Our lettings team will be in touch within 24–48 hours with your tailored proposal.
                </p>
                <Link href="/" style={{ display: 'inline-block', padding: '13px 28px', background: 'linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Back to Home
                </Link>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: 'clamp(24px, 4vw, 32px) clamp(24px, 4vw, 32px) 24px', borderBottom: '1px solid #f1f3f7', background: 'linear-gradient(135deg,#f8f9ff 0%,#fff 100%)' }}>
                  <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1a3c5e,#2563a8)', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, marginBottom: 10 }}>
                    Free · No Obligation
                  </div>
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f1f3d', margin: '0 0 6px' }}>
                    Landlord Registration
                  </h2>
                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                    Tell us about you, your property, and the services you&rsquo;d like us to manage.
                  </p>
                </div>

                <div style={{ padding: 'clamp(24px, 4vw, 32px)' }}>
                  <form onSubmit={handleSubmit} noValidate>

                    {/* ── YOUR DETAILS ── */}
                    <p className="hol-section-label">Your Details</p>
                    <div className="hol-form-grid">
                      <div className="hol-field">
                        <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                        <input type="text" className={`hol-input${errors.fullName ? ' hol-input--error' : ''}`} placeholder="e.g. James Whitfield" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
                        {errors.fullName && <p className="hol-err">{errors.fullName}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">Email Address<span className="hol-req">*</span></label>
                        <input type="email" className={`hol-input${errors.email ? ' hol-input--error' : ''}`} placeholder="james@example.co.uk" value={form.email} onChange={set('email')} autoComplete="email" />
                        {errors.email && <p className="hol-err">{errors.email}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">Phone Number<span className="hol-req">*</span></label>
                        <input type="tel" className={`hol-input${errors.phone ? ' hol-input--error' : ''}`} placeholder="e.g. 07700 900123" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                        {errors.phone && <p className="hol-err">{errors.phone}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">How many properties do you own?<span className="hol-req">*</span></label>
                        <select className={`hol-input hol-select${errors.propertyCount ? ' hol-input--error' : ''}`} value={form.propertyCount} onChange={set('propertyCount')}>
                          <option value="">Select...</option>
                          <option>1 property</option>
                          <option>2–3 properties</option>
                          <option>4–5 properties</option>
                          <option>6–10 properties</option>
                          <option>10+ properties</option>
                        </select>
                        {errors.propertyCount && <p className="hol-err">{errors.propertyCount}</p>}
                      </div>
                    </div>

                    {/* ── PROPERTY TO MANAGE ── */}
                    <p className="hol-section-label">Property You&rsquo;d Like Us to Manage</p>
                    <div className="hol-form-grid">
                      <div className="hol-field hol-field--full">
                        <label className="hol-label">Postcode<span className="hol-req">*</span></label>
                        <PostcodeLookup
                          postcode={form.postcode}
                          onPostcodeChange={(v) => { setForm(f => ({ ...f, postcode: v })); setErrors(er => ({ ...er, postcode: '' })); }}
                          onSelect={handleAddressSelect}
                          inputClassName={`hol-input${errors.postcode ? ' hol-input--error' : ''}`}
                          placeholder="e.g. M1 1AE"
                        />
                        {errors.postcode && <p className="hol-err">{errors.postcode}</p>}
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                          Search your postcode, then select your address to auto-fill the fields below.
                        </p>
                      </div>
                      <div className="hol-field hol-field--full">
                        <label className="hol-label">1st Line of Address<span className="hol-req">*</span></label>
                        <input type="text" className={`hol-input${errors.street ? ' hol-input--error' : ''}`} placeholder="e.g. 12 Whitfield Street" value={form.street} onChange={set('street')} autoComplete="off" />
                        {errors.street && <p className="hol-err">{errors.street}</p>}
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">City <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                        <input type="text" className="hol-input" placeholder="e.g. Manchester" value={form.city} onChange={set('city')} autoComplete="off" />
                      </div>
                      <div className="hol-field">
                        <label className="hol-label">County <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                        <input type="text" className="hol-input" placeholder="e.g. Greater Manchester" value={form.county} onChange={set('county')} autoComplete="off" />
                      </div>
                    </div>

                    {/* ── SERVICES ── */}
                    <p className="hol-section-label">What Services Do You Need?<span className="hol-req">*</span></p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '-6px 0 14px' }}>
                      Select all that apply — you can discuss the details with your agent.
                    </p>
                    <div className={`hol-services${errors.services ? ' hol-services--error' : ''}`}>
                      {SERVICE_OPTIONS.map(s => {
                        const checked = services.includes(s.value);
                        return (
                          <label key={s.value} className={`hol-service-opt${checked ? ' hol-service-opt--on' : ''}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleService(s.value)} />
                            <span className="hol-service-check" aria-hidden>
                              {checked && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>)}
                            </span>
                            <span>
                              <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#0f1f3d' }}>{s.value}</span>
                              <span style={{ display: 'block', fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.desc}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.services && <p className="hol-err" style={{ marginTop: 8 }}>{errors.services}</p>}

                    {/* ── NOTES ── */}
                    <div className="hol-field hol-field--full" style={{ marginTop: 22 }}>
                      <label className="hol-label">Additional Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <textarea className="hol-input hol-textarea" rows={3} placeholder="Anything else we should know about your property or requirements..." value={form.notes} onChange={set('notes')} />
                    </div>

                    {/* ── TERMS ACCEPT ── */}
                    <label className={`hol-terms-accept${errors.terms ? ' hol-terms-accept--error' : ''}`}>
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setErrors(er => ({ ...er, terms: '' })); }} />
                      <span className="hol-service-check" aria-hidden>
                        {termsAccepted && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>)}
                      </span>
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                        I confirm I have read and accept the property management <Link href="/terms" style={{ color: '#2563eb', fontWeight: 600 }}>terms &amp; conditions</Link>, and consent to House of Lettings contacting me about my registration.
                      </span>
                    </label>
                    {errors.terms && <p className="hol-err" style={{ marginTop: 6 }}>{errors.terms}</p>}

                    {status === 'error' && (
                      <div className="hol-err-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {errorMsg}
                      </div>
                    )}

                    <div className="hol-form-footer">
                      <p className="hol-privacy">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Your details are secure and never shared.
                      </p>
                      <button type="submit" className="hol-submit" disabled={status === 'loading'}>
                        {status === 'loading' ? (
                          <>
                            <svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            Complete Registration
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28, padding: '0 8px' }}>
              {[
                { icon: '✓', text: 'Free to register' },
                { icon: '✓', text: 'Response within 24–48 hours' },
                { icon: '✓', text: 'Leeds & Manchester experts' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#050a12', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(32px, 5vw, 48px) clamp(24px, 7%, 100px)' }}>
          <div className="hol-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />
              House of Lettings
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>© {new Date().getFullYear()} House of Lettings Ltd. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link href="/cookie-policy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Cookie Policy</Link>
              <Link href="/terms" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Terms</Link>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>Home</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  @keyframes hol-bg-shift { 0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;} }
  .hol-page-bg { background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 25%, #e8f0fe 50%, #f7f8fa 75%, #eef2ff 100%); background-size: 400% 400%; animation: hol-bg-shift 12s ease infinite; }

  .hol-eyebrow { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#2563eb; margin-bottom:14px; font-family:'Poppins',sans-serif; }
  .hol-h2 { font-family:'Poppins',sans-serif; font-size:clamp(26px,3.6vw,42px); font-weight:700; color:#0f1f3d; line-height:1.2; margin:0; }

  .hol-hero-cta { display:inline-flex; align-items:center; gap:8px; background:#2563eb; color:#fff; text-decoration:none; font-family:'Poppins',sans-serif; font-size:14px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; padding:15px 34px; border-radius:8px; transition:background .2s,transform .2s; }
  .hol-hero-cta:hover { background:#1d4ed8; transform:translateY(-2px); }

  .hol-why-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
  @media(max-width:860px){ .hol-why-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:560px){ .hol-why-grid{grid-template-columns:1fr;} }
  .hol-why-card { background:#fff; border:1px solid #eef0f5; border-radius:14px; padding:26px 24px; transition:transform .2s,box-shadow .2s; }
  .hol-why-card:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(15,31,61,.08); }
  .hol-service-card { background:#162849; border:1px solid rgba(74,144,217,.3); border-radius:12px; padding:22px 22px; }

  .hol-terms-list { max-width:760px; margin:0 auto; padding-left:22px; display:flex; flex-direction:column; gap:16px; }
  .hol-terms-list li { font-family:'Poppins',sans-serif; font-size:14px; color:#4b5563; line-height:1.75; }
  .hol-terms-list li strong { color:#0f1f3d; }

  .hol-section-label { font-size:12px; font-weight:700; color:#0f1f3d; text-transform:uppercase; letter-spacing:.08em; margin:0 0 14px; font-family:'Poppins',sans-serif; padding-bottom:8px; border-bottom:1px solid #f1f3f7; }
  .hol-section-label:not(:first-child) { margin-top:28px; }

  .hol-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .hol-field{display:flex;flex-direction:column;gap:6px;}
  .hol-field--full{grid-column:1/-1;}
  .hol-label{font-size:13px;font-weight:600;color:#374151;letter-spacing:.01em;font-family:'Poppins',sans-serif;}
  .hol-req{color:#e53e3e;margin-left:2px;}
  .hol-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'Poppins',sans-serif;font-size:14px;color:#111827;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;}
  .hol-input:focus{border-color:#2563a8;box-shadow:0 0 0 3px rgba(37,99,168,.12);}
  .hol-input--error{border-color:#e53e3e!important;}
  .hol-select{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px;}
  .hol-textarea{resize:vertical;min-height:80px;}
  .hol-err{font-size:12px;color:#e53e3e;margin:0;font-family:'Poppins',sans-serif;}
  .hol-err-banner{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;font-size:13px;color:#dc2626;margin:20px 0 0;font-family:'Poppins',sans-serif;}

  .hol-services{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:560px){ .hol-services{grid-template-columns:1fr;} }
  .hol-services--error .hol-service-opt{border-color:#f7b6b6;}
  .hol-service-opt{display:flex;align-items:flex-start;gap:12px;border:1.5px solid #e5e7eb;border-radius:12px;padding:14px 16px;cursor:pointer;transition:border-color .15s,background .15s;background:#fff;}
  .hol-service-opt:hover{border-color:#bcd0ee;}
  .hol-service-opt--on{border-color:#2563a8;background:#f5f9ff;}
  .hol-service-opt input,.hol-terms-accept input{position:absolute;opacity:0;width:0;height:0;}
  .hol-service-check{flex-shrink:0;width:20px;height:20px;border-radius:6px;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;color:#fff;background:#fff;transition:all .15s;margin-top:1px;}
  .hol-service-opt--on .hol-service-check{background:#2563a8;border-color:#2563a8;}

  .hol-terms-accept{display:flex;align-items:flex-start;gap:12px;margin-top:24px;padding:16px 18px;border:1.5px solid #e5e7eb;border-radius:12px;cursor:pointer;background:#fafbff;transition:border-color .15s;}
  .hol-terms-accept:has(input:checked){border-color:#2563a8;background:#f5f9ff;}
  .hol-terms-accept:has(input:checked) .hol-service-check{background:#2563a8;border-color:#2563a8;}
  .hol-terms-accept--error{border-color:#f7b6b6;}

  .hol-form-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:24px;}
  .hol-privacy{display:flex;align-items:center;gap:6px;font-size:12px;color:#9ca3af;margin:0;font-family:'Poppins',sans-serif;}
  .hol-submit{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%);color:#fff;border:none;border-radius:10px;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;padding:13px 24px;cursor:pointer;transition:opacity .15s,transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(37,99,168,.35);white-space:nowrap;}
  .hol-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,168,.45);}
  .hol-submit:disabled{opacity:.7;cursor:not-allowed;}
  .hol-spinner{animation:hol-spin .8s linear infinite;}
  @keyframes hol-spin{to{transform:rotate(360deg);}}
  @keyframes hol-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}

  @media(max-width:600px){
    .hol-form-grid{grid-template-columns:1fr;gap:14px;}
    .hol-form-footer{flex-direction:column;align-items:stretch;}
    .hol-submit{justify-content:center;}
    .hol-footer{flex-direction:column;align-items:flex-start;gap:20px;}
  }
`;
