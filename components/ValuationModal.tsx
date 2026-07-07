"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import PostcodeLookup, { type AddressResult } from "@/components/PostcodeLookup";

const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: typeof EMPTY_FORM) {
  const errors: Record<string, string> = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_REGEX.test(form.email)) errors.email = "Enter a valid email address";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Enter a valid UK phone number";
  if (!form.postcode.trim()) errors.postcode = "Postcode is required";
  if (!form.street.trim()) errors.street = "First line of address is required";
  if (!form.propertyType) errors.propertyType = "Please select a property type";
  if (!form.bedrooms) errors.bedrooms = "Please select number of bedrooms";
  if (!form.preferredDateTime) errors.preferredDateTime = "Please choose a preferred date & time";
  return errors;
}

const EMPTY_FORM = {
  fullName: "", email: "", phone: "",
  postcode: "", city: "", street: "",
  propertyType: "", bedrooms: "", notes: "", preferredDateTime: "",
};

interface ValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ValuationModal({ isOpen, onClose }: ValuationModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleAddressSelect = useCallback((data: AddressResult) => {
    setForm(f => ({
      ...f,
      postcode: data.postcode || f.postcode,
      city: data.city || f.city,
      street: data.street || f.street,
    }));
    setErrors(e => ({ ...e, postcode: "", street: "" }));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(er => ({ ...er, [key]: "" }));
  };

  const handleClose = () => {
    if (status === "loading") return;
    setForm(EMPTY_FORM); setErrors({}); setStatus("idle"); setErrorMsg("");
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/book-valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          address: [form.street, form.city, form.postcode].filter(Boolean).join(", "),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <style>{MODAL_CSS}</style>
      <div ref={overlayRef} className={`hol-overlay${isOpen ? " hol-overlay--open" : ""}`} onClick={handleOverlayClick}>
        <div className="hol-modal" role="dialog" aria-modal="true" aria-labelledby="hol-modal-title">
          <div className="hol-modal__header">
            <div>
              <div className="hol-modal__badge">Free Valuation</div>
              <h2 id="hol-modal-title" className="hol-modal__title">Book a Property Valuation</h2>
              <p className="hol-modal__subtitle">Our local experts will provide an accurate, no-obligation valuation, usually within 48 hours.</p>
            </div>
            <button className="hol-modal__close" onClick={handleClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="hol-modal__body">
            {status === "success" ? (
              <div className="hol-success">
                <div className="hol-success__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="hol-success__title">Valuation Booked!</h3>
                <p className="hol-success__msg">Thank you, {form.fullName.split(" ")[0]}. We've received your request for <strong>{[form.street, form.city, form.postcode].filter(Boolean).join(", ")}</strong>.</p>
                <p className="hol-success__sub">Our team will be in touch within 24 hours to confirm your appointment.</p>
                <button className="hol-submit hol-submit--outline" onClick={handleClose}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="hol-form-grid">
                  <div className="hol-field">
                    <label className="hol-label">Full Name<span className="hol-req">*</span></label>
                    <input type="text" className={`hol-input${errors.fullName ? " hol-input--error" : ""}`} placeholder="e.g. James Whitfield" value={form.fullName} onChange={set("fullName")} autoComplete="name"/>
                    {errors.fullName && <p className="hol-err">{errors.fullName}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">Email Address<span className="hol-req">*</span></label>
                    <input type="email" className={`hol-input${errors.email ? " hol-input--error" : ""}`} placeholder="james@example.co.uk" value={form.email} onChange={set("email")} autoComplete="email"/>
                    {errors.email && <p className="hol-err">{errors.email}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">Phone Number<span className="hol-req">*</span></label>
                    <input type="tel" className={`hol-input${errors.phone ? " hol-input--error" : ""}`} placeholder="e.g. 07700 900123" value={form.phone} onChange={set("phone")} autoComplete="tel"/>
                    {errors.phone && <p className="hol-err">{errors.phone}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">Preferred Date & Time<span className="hol-req">*</span></label>
                    <input type="datetime-local" className={`hol-input${errors.preferredDateTime ? " hol-input--error" : ""}`} value={form.preferredDateTime} onChange={set("preferredDateTime")}/>
                    {errors.preferredDateTime && <p className="hol-err">{errors.preferredDateTime}</p>}
                  </div>

                  <div className="hol-field hol-field--full">
                    <label className="hol-label">Postcode<span className="hol-req">*</span></label>
                    <PostcodeLookup
                      postcode={form.postcode}
                      onPostcodeChange={(v) => setForm(f => ({ ...f, postcode: v }))}
                      onSelect={handleAddressSelect}
                      inputClassName={`hol-input${errors.postcode ? " hol-input--error" : ""}`}
                      placeholder="e.g. M1 1AE"
                    />
                    {errors.postcode && <p className="hol-err">{errors.postcode}</p>}
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                      Search your postcode, then select your address to auto-fill the fields below.
                    </p>
                  </div>

                  <div className="hol-field hol-field--full">
                    <label className="hol-label">First Line of Address<span className="hol-req">*</span></label>
                    <input type="text" className={`hol-input${errors.street ? " hol-input--error" : ""}`} placeholder="e.g. 12 Whitfield Street" value={form.street} onChange={set("street")} autoComplete="off"/>
                    {errors.street && <p className="hol-err">{errors.street}</p>}
                  </div>

                  <div className="hol-field">
                    <label className="hol-label">City</label>
                    <input type="text" className="hol-input" placeholder="e.g. Manchester" value={form.city} onChange={set("city")} autoComplete="off"/>
                  </div>

                  <div className="hol-field">
                    <label className="hol-label">Property Type<span className="hol-req">*</span></label>
                    <select className={`hol-input hol-select${errors.propertyType ? " hol-input--error" : ""}`} value={form.propertyType} onChange={set("propertyType")}>
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
                    <select className={`hol-input hol-select${errors.bedrooms ? " hol-input--error" : ""}`} value={form.bedrooms} onChange={set("bedrooms")}>
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
                    <textarea className="hol-input hol-textarea" rows={3} placeholder="Any specific details about the property..." value={form.notes} onChange={set("notes")}/>
                  </div>
                </div>

                {status === "error" && (
                  <div className="hol-err-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errorMsg}
                  </div>
                )}

                <div className="hol-form-footer">
                  <p className="hol-privacy">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Your details are secure and never shared.
                  </p>
                  <button type="submit" className="hol-submit" disabled={status === "loading"}>
                    {status === "loading" ? (
                      <><svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> Submitting...</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Book Free Valuation</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500;600&display=swap');
  .hol-overlay{position:fixed;inset:0;z-index:99999;background:rgba(10,15,28,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .25s ease;}
  .hol-overlay--open{opacity:1;pointer-events:all;}
  .hol-modal{background:#fff;border-radius:20px;width:100%;max-width:680px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28);transform:scale(.94) translateY(10px);transition:transform .3s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif;scrollbar-width:thin;scrollbar-color:#e2e5ed transparent;}
  .hol-overlay--open .hol-modal{transform:scale(1) translateY(0);}
  .hol-modal__header{display:flex;justify-content:space-between;align-items:flex-start;padding:32px 32px 24px;border-bottom:1px solid #f1f3f7;background:linear-gradient(135deg,#f8f9ff 0%,#fff 100%);border-radius:20px 20px 0 0;}
  .hol-modal__badge{display:inline-block;background:linear-gradient(135deg,#1a3c5e,#2563a8);color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:20px;margin-bottom:10px;}
  .hol-modal__title{font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:600;color:#0f1f3d;margin:0 0 6px;line-height:1.2;}
  .hol-modal__subtitle{font-size:14px;color:#6b7280;margin:0;line-height:1.5;}
  .hol-modal__close{background:#f4f6f9;border:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;transition:background .15s,color .15s;flex-shrink:0;margin-left:16px;}
  .hol-modal__close:hover{background:#e5e7eb;color:#111;}
  .hol-modal__body{padding:28px 32px 32px;}
  .hol-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;}
  .hol-field{display:flex;flex-direction:column;gap:6px;}
  .hol-field--full{grid-column:1/-1;}
  .hol-label{font-size:13px;font-weight:600;color:#374151;letter-spacing:.01em;}
  .hol-req{color:#e53e3e;margin-left:2px;}
  .hol-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;color:#111827;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;}
  .hol-input:focus{border-color:#2563a8;box-shadow:0 0 0 3px rgba(37,99,168,.12);}
  .hol-input--error{border-color:#e53e3e!important;}
  .hol-select{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px;}
  .hol-textarea{resize:vertical;min-height:80px;}
  .hol-err{font-size:12px;color:#e53e3e;margin:0;}
  .hol-err-banner{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;font-size:13px;color:#dc2626;margin-bottom:16px;}
  .hol-form-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .hol-privacy{display:flex;align-items:center;gap:6px;font-size:12px;color:#9ca3af;margin:0;}
  .hol-submit{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%);color:#fff;border:none;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;padding:13px 24px;cursor:pointer;transition:opacity .15s,transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(37,99,168,.35);white-space:nowrap;}
  .hol-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,168,.45);}
  .hol-submit:disabled{opacity:.7;cursor:not-allowed;}
  .hol-submit--outline{background:transparent;border:2px solid #1a3c5e;color:#1a3c5e;box-shadow:none;}
  .hol-submit--outline:hover{background:#f0f4ff;box-shadow:none;}
  .hol-spinner{animation:hol-spin .8s linear infinite;}
  @keyframes hol-spin{to{transform:rotate(360deg);}}
  .hol-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 0;}
  .hol-success__icon{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1a3c5e,#2563a8);display:flex;align-items:center;justify-content:center;color:#fff;margin-bottom:20px;box-shadow:0 8px 24px rgba(37,99,168,.35);animation:hol-pop .5s cubic-bezier(.34,1.56,.64,1);}
  @keyframes hol-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
  .hol-success__title{font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#0f1f3d;margin:0 0 12px;}
  .hol-success__msg{font-size:14px;color:#374151;max-width:380px;line-height:1.6;margin:0 0 8px;}
  .hol-success__sub{font-size:13px;color:#9ca3af;margin:0 0 24px;}
  @media(max-width:600px){.hol-modal__header{padding:24px 20px 18px;}.hol-modal__title{font-size:20px;}.hol-modal__body{padding:20px 20px 24px;}.hol-form-grid{grid-template-columns:1fr;gap:14px;}.hol-form-footer{flex-direction:column;align-items:stretch;}.hol-submit{justify-content:center;}}
`;
