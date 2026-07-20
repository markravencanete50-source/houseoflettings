'use client';
// app/book-valuation/page.tsx
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostcodeLookup, { type AddressResult } from '@/components/PostcodeLookup';

const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
  fullName: '', email: '', phone: '',
  street: '', city: '', county: '', postcode: '',
  propertyType: '', bedrooms: '', notes: '', preferredDateTime: '',
};

function validate(form: typeof EMPTY_FORM) {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(form.email)) errors.email = 'Enter a valid email address';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, '')))
    errors.phone = 'Enter a valid UK phone number';
  if (!form.street.trim()) errors.street = '1st line of address is required';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.postcode.trim()) errors.postcode = 'Postcode is required';
  if (!form.propertyType) errors.propertyType = 'Please select a property type';
  if (!form.bedrooms) errors.bedrooms = 'Please select number of bedrooms';
  if (!form.preferredDateTime) errors.preferredDateTime = 'Please choose a preferred date & time';
  return errors;
}

export default function BookValuationPage() {
  const [form, setForm] = useState(EMPTY_FORM);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/book-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          address: [form.street, form.city, form.county, form.postcode].filter(Boolean).join(', '),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Navbar />

      <div style={{ minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }} className="hol-page-bg">

        {/* ── HERO STRIP ── */}
        <div style={{
          backgroundImage: 'linear-gradient(135deg, rgba(10,22,47,0.82) 0%, rgba(15,31,61,0.75) 60%, rgba(22,40,73,0.70) 100%), url(/images/Background_Book_Valuation.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          paddingTop: 'calc(68px + clamp(64px, 9vw, 100px))',
          paddingBottom: 'clamp(64px, 9vw, 100px)',
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
            Free Valuation
          </div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(32px, 4.5vw, 54px)',
            fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 16,
          }}>
            Book a Property Valuation
          </h1>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 500,
            margin: '0 auto', lineHeight: 1.65, fontWeight: 400,
          }}>
            Our local experts will provide an accurate, no-obligation valuation, usually within 48 hours.
          </p>
        </div>

        {/* ── FORM CARD ── */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4%, 4%)' }}>

          {status === 'success' ? (
            <div style={{
              background: '#fff', borderRadius: 16, padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5%, 5%)',
              textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg,#1a3c5e,#2563a8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(37,99,168,.35)',
                animation: 'hol-pop .5s cubic-bezier(.34,1.56,.64,1)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 700, color: '#0f1f3d', marginBottom: 12 }}>
                Valuation Booked!
              </h2>
              <p style={{ fontSize: 15, color: '#374151', maxWidth: 400, margin: '0 auto 8px', lineHeight: 1.6 }}>
                Thank you, {form.fullName.split(' ')[0]}. We've received your request for <strong>{form.street}, {form.city}</strong>.
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
                Our team will be in touch within 24 hours to confirm your appointment.
              </p>
              <Link href="/" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxSizing: 'border-box', minHeight: 48, lineHeight: 1.2,
                padding: '14px 28px', border: '1.5px solid transparent', borderRadius: 9,
                background: 'linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%)',
                color: '#fff', fontSize: 13.5, fontWeight: 700,
                letterSpacing: '.02em', textTransform: 'uppercase', textDecoration: 'none',
              }}>
                Back to Home
              </Link>
            </div>
          ) : (
            <div style={{
              background: '#fff', borderRadius: 16,
              boxShadow: '0 4px 32px rgba(0,0,0,0.07)', overflow: 'hidden',
            }}>
              {/* Card header */}
              <div style={{
                padding: 'clamp(24px, 4vw, 32px) clamp(24px, 4vw, 32px) 24px',
                borderBottom: '1px solid #f1f3f7',
                background: 'linear-gradient(135deg,#f8f9ff 0%,#fff 100%)',
              }}>
                <div style={{
                  display: 'inline-block', background: 'linear-gradient(135deg,#1a3c5e,#2563a8)',
                  color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, marginBottom: 10,
                }}>
                  Free Valuation
                </div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: '#0f1f3d', margin: '0 0 6px' }}>
                  Book a Property Valuation
                </h2>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>
                  Our local experts will provide an accurate, no-obligation valuation, usually within 48 hours.
                </p>
              </div>

              {/* Form body */}
              <div style={{ padding: 'clamp(24px, 4vw, 32px)' }}>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="hol-form-grid">

                    <div className="hol-field">
                      <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                      <input type="text" className={`hol-input${errors.fullName ? ' hol-input--error' : ''}`}
                        placeholder="e.g. James Whitfield" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
                      {errors.fullName && <p className="hol-err">{errors.fullName}</p>}
                    </div>

                    <div className="hol-field">
                      <label className="hol-label">Email Address<span className="hol-req">*</span></label>
                      <input type="email" className={`hol-input${errors.email ? ' hol-input--error' : ''}`}
                        placeholder="james@example.co.uk" value={form.email} onChange={set('email')} autoComplete="email" />
                      {errors.email && <p className="hol-err">{errors.email}</p>}
                    </div>

                    <div className="hol-field">
                      <label className="hol-label">Phone Number<span className="hol-req">*</span></label>
                      <input type="tel" className={`hol-input${errors.phone ? ' hol-input--error' : ''}`}
                        placeholder="e.g. 07700 900123" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                      {errors.phone && <p className="hol-err">{errors.phone}</p>}
                    </div>

                    <div className="hol-field">
                      <label className="hol-label">Preferred Date & Time<span className="hol-req">*</span></label>
                      <input type="datetime-local" className={`hol-input${errors.preferredDateTime ? ' hol-input--error' : ''}`}
                        value={form.preferredDateTime} onChange={set('preferredDateTime')} />
                      {errors.preferredDateTime && <p className="hol-err">{errors.preferredDateTime}</p>}
                    </div>

                    {/* ── ADDRESS SECTION LABEL ── */}
                    <div className="hol-field hol-field--full" style={{ marginBottom: -4 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontFamily: "'Poppins', sans-serif" }}>
                        Property Address
                      </p>
                    </div>

                    {/* Postcode, look it up here, then pick the address below to auto-fill the rest */}
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">Postcode<span className="hol-req">*</span></label>
                      <PostcodeLookup
                        postcode={form.postcode}
                        onPostcodeChange={(v) => setForm(f => ({ ...f, postcode: v }))}
                        onSelect={handleAddressSelect}
                        inputClassName={`hol-input${errors.postcode ? ' hol-input--error' : ''}`}
                        placeholder="e.g. M1 1AE"
                      />
                      {errors.postcode && <p className="hol-err">{errors.postcode}</p>}
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0', fontFamily: "'Poppins', sans-serif" }}>
                        Search your postcode, then select your address to auto-fill the fields below.
                      </p>
                    </div>

                    {/* 1st Line of Address, auto-filled, still editable */}
                    <div className="hol-field hol-field--full">
                      <label className="hol-label">1st Line of Address<span className="hol-req">*</span></label>
                      <input
                        type="text"
                        className={`hol-input${errors.street ? ' hol-input--error' : ''}`}
                        placeholder="e.g. 12 Whitfield Street"
                        value={form.street}
                        onChange={set('street')}
                        autoComplete="off"
                      />
                      {errors.street && <p className="hol-err">{errors.street}</p>}
                    </div>

                    {/* City */}
                    <div className="hol-field">
                      <label className="hol-label">City<span className="hol-req">*</span></label>
                      <input
                        type="text"
                        className={`hol-input${errors.city ? ' hol-input--error' : ''}`}
                        placeholder="e.g. Manchester"
                        value={form.city}
                        onChange={set('city')}
                        autoComplete="off"
                      />
                      {errors.city && <p className="hol-err">{errors.city}</p>}
                    </div>

                    {/* County, new, auto-filled from postcode lookup */}
                    <div className="hol-field">
                      <label className="hol-label">County <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <input
                        type="text"
                        className="hol-input"
                        placeholder="e.g. Greater Manchester"
                        value={form.county}
                        onChange={set('county')}
                        autoComplete="off"
                      />
                    </div>

                    <div className="hol-field">
                      <label className="hol-label">Property Type<span className="hol-req">*</span></label>
                      <select className={`hol-input hol-select${errors.propertyType ? ' hol-input--error' : ''}`}
                        value={form.propertyType} onChange={set('propertyType')}>
                        <option value="">Select type...</option>
                        <option>Flat / Apartment</option>
                        <option>Detached House</option>
                        <option>Semi-Detached House</option>
                        <option>Terraced House</option>
                        <option>HMO</option>
                        <option>Bungalow</option>
                        <option>Other</option>
                      </select>
                      {errors.propertyType && <p className="hol-err">{errors.propertyType}</p>}
                    </div>

                    <div className="hol-field">
                      <label className="hol-label">Bedrooms<span className="hol-req">*</span></label>
                      <select className={`hol-input hol-select${errors.bedrooms ? ' hol-input--error' : ''}`}
                        value={form.bedrooms} onChange={set('bedrooms')}>
                        <option value="">Select bedrooms...</option>
                        <option>Studio</option>
                        <option>1 Bedroom</option>
                        <option>2 Bedrooms</option>
                        <option>3 Bedrooms</option>
                        <option>4+ Bedrooms</option>
                      </select>
                      {errors.bedrooms && <p className="hol-err">{errors.bedrooms}</p>}
                    </div>

                    <div className="hol-field hol-field--full">
                      <label className="hol-label">Additional Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <textarea className="hol-input hol-textarea" rows={3}
                        placeholder="Any specific details about the property..."
                        value={form.notes} onChange={set('notes')} />
                    </div>

                  </div>

                  {status === 'error' && (
                    <div className="hol-err-banner">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errorMsg}
                    </div>
                  )}

                  <div className="hol-form-footer">
                    <p className="hol-privacy">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Your details are secure and never shared.
                    </p>
                    <button type="submit" className="hol-submit" disabled={status === 'loading'}>
                      {status === 'loading' ? (
                        <>
                          <svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          Book Free Valuation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Trust strip */}
          <div style={{
            display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
            marginTop: 28, padding: '0 8px',
          }}>
            {[
              { icon: '✓', text: 'No obligation' },
              { icon: '✓', text: 'Response within 24 hours' },
              { icon: '✓', text: 'Leeds & Manchester experts' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
                <span style={{ color: 'var(--logo-blue)', fontWeight: 700 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  /* ── Animated background ── */
  @keyframes hol-bg-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .hol-page-bg {
    background: linear-gradient(135deg, #eef2ff 0%, #f0f4ff 25%, #e8f0fe 50%, #f7f8fa 75%, #eef2ff 100%);
    background-size: 400% 400%;
    animation: hol-bg-shift 12s ease infinite;
  }

  .hol-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;}
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
  .hol-err-banner{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;font-size:13px;color:#dc2626;margin-bottom:16px;font-family:'Poppins',sans-serif;}
  .hol-form-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
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
  }
`;
