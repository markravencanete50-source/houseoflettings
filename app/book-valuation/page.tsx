'use client';
// app/book-valuation/page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
  fullName: '', email: '', phone: '', address: '',
  postcode: '', city: '', street: '',
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
  if (!form.address.trim()) errors.address = 'Property address is required';
  if (!form.propertyType) errors.propertyType = 'Please select a property type';
  if (!form.bedrooms) errors.bedrooms = 'Please select number of bedrooms';
  if (!form.preferredDateTime) errors.preferredDateTime = 'Please choose a preferred date & time';
  return errors;
}

function usePlacesAutocomplete(onSelect: (data: { address: string; postcode: string; city: string; street: string }) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let ac: any = null;
    let listener: any = null;
    function initAutocomplete() {
      if (!inputRef.current || !(window as any).google?.maps?.places) return;
      ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'gb' },
        fields: ['formatted_address', 'address_components'],
      });
      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place?.formatted_address) return;
        let postcode = '', city = '', street = '';
        place.address_components?.forEach((comp: any) => {
          if (comp.types.includes('postal_code')) postcode = comp.long_name;
          if (comp.types.includes('postal_town') || comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('route')) street = comp.long_name;
        });
        onSelect({ address: place.formatted_address, postcode, city, street });
      });
    }
    if ((window as any).google?.maps?.places) {
      initAutocomplete();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.maps?.places) { clearInterval(interval); initAutocomplete(); }
      }, 300);
      return () => clearInterval(interval);
    }
    return () => { if (listener) (window as any).google?.maps?.event.removeListener(listener); };
  }, [onSelect]);
  return inputRef;
}

export default function BookValuationPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;
    if ((window as any).google?.maps?.places) return;
    const existing = document.querySelector('script[data-hol-gmaps]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true; script.defer = true;
    (script as any).dataset.holGmaps = '1';
    document.head.appendChild(script);
  }, []);

  const handlePlaceSelect = useCallback((data: { address: string; postcode: string; city: string; street: string }) => {
    setForm(f => ({ ...f, ...data }));
    setErrors(e => ({ ...e, address: '' }));
  }, []);

  const addressInputRef = usePlacesAutocomplete(handlePlaceSelect);

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
        body: JSON.stringify(form),
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

      <div style={{ paddingTop: 68, minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Poppins', sans-serif" }}>

        {/* ── HERO STRIP ── */}
        <div style={{
          backgroundImage: 'linear-gradient(135deg, rgba(10,22,47,0.82) 0%, rgba(15,31,61,0.75) 60%, rgba(22,40,73,0.70) 100%), url(/images/Background_Book_Valuation.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: 'clamp(64px, 9vw, 100px) clamp(20px, 5%, 5%)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', background: 'rgba(37,99,235,0.18)', color: '#4a90d9',
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            padding: '5px 14px', borderRadius: 20, marginBottom: 18,
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
            Our local experts will provide an accurate, no-obligation valuation — usually within 48 hours.
          </p>
        </div>

        {/* ── FORM CARD ── */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(32px, 5vw, 56px) clamp(16px, 4%, 4%)' }}>

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
                Thank you, {form.fullName.split(' ')[0]}. We've received your request for <strong>{form.address}</strong>.
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
                Our team will be in touch within 24 hours to confirm your appointment.
              </p>
              <Link href="/" style={{
                display: 'inline-block', padding: '13px 28px',
                background: 'linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%)',
                color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
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
                  Our local experts will provide an accurate, no-obligation valuation — usually within 48 hours.
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

                    <div className="hol-field hol-field--full">
                      <label className="hol-label">Property Address<span className="hol-req">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <input ref={addressInputRef} type="text"
                          className={`hol-input${errors.address ? ' hol-input--error' : ''}`}
                          style={{ paddingLeft: 36 }}
                          placeholder="Start typing your UK address..."
                          value={form.address} onChange={set('address')} autoComplete="off" />
                      </div>
                      {errors.address && <p className="hol-err">{errors.address}</p>}
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
                        <option>4 Bedrooms</option>
                        <option>5+ Bedrooms</option>
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
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
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
  .pac-container{border-radius:10px!important;border:1.5px solid #e5e7eb!important;box-shadow:0 8px 24px rgba(0,0,0,.12)!important;font-family:'Poppins',sans-serif!important;z-index:99999!important;}
  .pac-item{padding:8px 12px!important;font-size:13px!important;cursor:pointer;}
  .pac-item:hover{background:#f0f4ff!important;}
  .pac-icon{display:none!important;}
  @media(max-width:600px){
    .hol-form-grid{grid-template-columns:1fr;gap:14px;}
    .hol-form-footer{flex-direction:column;align-items:stretch;}
    .hol-submit{justify-content:center;}
  }
`;
