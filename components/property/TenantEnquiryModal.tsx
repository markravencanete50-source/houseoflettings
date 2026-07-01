"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import PostcodeLookup, { type AddressResult } from "@/components/PostcodeLookup";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  postcode: "",
  // About your move
  moveBy: "",
  moveByOther: "",
  stayDuration: "",
  stayDurationOther: "",
  whoMovingIn: "",
  // About the tenancy
  firstTimeRenting: "",
  employmentStatus: "",
  hasPets: "",
  hasSmokers: "",
  // About you
  location: "",
  viewingAvailability: "",
  viewingAvailabilityOther: "",
  totalAnnualIncome: "",
  numberOfChildren: "",
  child1Age: "",
  child2Age: "",
  child3Age: "",
  adverseCredit: "",
  message: "",
};

function validate(form: typeof EMPTY_FORM) {
  const errors: Record<string, string> = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_REGEX.test(form.email)) errors.email = "Enter a valid email address";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Enter a valid UK phone number";
  if (!form.moveBy) errors.moveBy = "Please select when you want to move";
  if (!form.employmentStatus) errors.employmentStatus = "Please select your employment status";
  return errors;
}

interface RadioGroupProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  columns?: number;
}

function RadioGroup({ options, value, onChange, columns = 2 }: RadioGroupProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 10,
    }}>
      {options.map((opt) => (
        <label
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 14px",
            background: value === opt ? "#f0f4ff" : "#f9fafb",
            border: `1.5px solid ${value === opt ? "#2563a8" : "#e5e7eb"}`,
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 14,
            color: value === opt ? "#1a3c5e" : "#374151",
            fontWeight: value === opt ? 600 : 400,
            transition: "all 0.15s",
            fontFamily: "'Poppins', sans-serif",
            userSelect: "none",
          }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${value === opt ? "#2563a8" : "#d1d5db"}`,
            background: value === opt ? "#2563a8" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {value === opt && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "block" }} />
            )}
          </span>
          {opt}
        </label>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      fontSize: 18,
      fontWeight: 600,
      color: "#0f1f3d",
      marginBottom: 16,
      marginTop: 8,
      paddingBottom: 10,
      borderBottom: "1px solid #f1f3f7",
    }}>
      {children}
    </div>
  );
}

interface TenantEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle?: string;
  propertyPrice?: number;
}

export default function TenantEnquiryModal({
  isOpen,
  onClose,
  propertyTitle,
  propertyPrice,
}: TenantEnquiryModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handlePostcodeSelect = useCallback((data: AddressResult) => {
    setForm(f => ({ ...f, postcode: data.postcode || f.postcode }));
    setErrors(er => ({ ...er, postcode: "" }));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: "" }));
    if (key === "message") setCharCount(val.length);
  };

  const setRadio = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: "" }));
  };

  const handleClose = () => {
    if (status === "loading") return;
    setForm(EMPTY_FORM);
    setErrors({});
    setStatus("idle");
    setErrorMsg("");
    setCharCount(0);
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
      const res = await fetch("/api/tenant-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyTitle }),
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
      <div
        ref={overlayRef}
        className={`hol-overlay${isOpen ? " hol-overlay--open" : ""}`}
        onClick={handleOverlayClick}
      >
        <div className="hol-modal hol-modal--wide" role="dialog" aria-modal="true" aria-labelledby="hol-tenant-title">

          {/* Header */}
          <div className="hol-modal__header">
            <div>
              <div className="hol-modal__badge">Book a Viewing</div>
              <h2 id="hol-tenant-title" className="hol-modal__title">Book a Viewing</h2>
              {propertyTitle && (
                <p className="hol-modal__subtitle">
                  Enquiring about: <strong style={{ color: "#0f1f3d" }}>{propertyTitle}</strong>
                  {propertyPrice && propertyPrice > 0 && <span style={{ marginLeft: 8, color: "#2563a8", fontWeight: 600 }}>£{propertyPrice.toLocaleString()} pcm</span>}
                </p>
              )}
              {!propertyTitle && (
                <p className="hol-modal__subtitle">
                  Answer a few quick questions so we can find the right property for you.
                </p>
              )}
            </div>
            <button className="hol-modal__close" onClick={handleClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="hol-modal__body">
            {status === "success" ? (
              <div className="hol-success">
                <div className="hol-success__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className="hol-success__title">Enquiry Sent!</h3>
                <p className="hol-success__msg">
                  Thank you, {form.firstName}. We've received your viewing request and will be in touch shortly.
                </p>
                <p className="hol-success__sub">Our team will contact you within 24 hours to confirm your viewing.</p>
                <button className="hol-submit hol-submit--outline" onClick={handleClose}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                {/* Benefits banner */}
                <div className="hol-benefits">
                  <div className="hol-benefit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563a8" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Takes less than two minutes</div>
                  <div className="hol-benefit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563a8" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Helps us match you faster</div>
                  <div className="hol-benefit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563a8" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Saves time on calls with agents</div>
                </div>

                {/* ── Contact details ── */}
                <SectionTitle>Your details</SectionTitle>
                <div className="hol-form-grid">
                  <div className="hol-field">
                    <label className="hol-label">First name<span className="hol-req">*</span></label>
                    <input type="text" className={`hol-input${errors.firstName ? " hol-input--error" : ""}`} placeholder="e.g. James" value={form.firstName} onChange={set("firstName")} autoComplete="given-name"/>
                    {errors.firstName && <p className="hol-err">{errors.firstName}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">Last name<span className="hol-req">*</span></label>
                    <input type="text" className={`hol-input${errors.lastName ? " hol-input--error" : ""}`} placeholder="e.g. Whitfield" value={form.lastName} onChange={set("lastName")} autoComplete="family-name"/>
                    {errors.lastName && <p className="hol-err">{errors.lastName}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">Email address<span className="hol-req">*</span></label>
                    <input type="email" className={`hol-input${errors.email ? " hol-input--error" : ""}`} placeholder="james@example.co.uk" value={form.email} onChange={set("email")} autoComplete="email"/>
                    {errors.email && <p className="hol-err">{errors.email}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">Phone number<span className="hol-req">*</span></label>
                    <input type="tel" className={`hol-input${errors.phone ? " hol-input--error" : ""}`} placeholder="e.g. 07700 900123" value={form.phone} onChange={set("phone")} autoComplete="tel"/>
                    {errors.phone && <p className="hol-err">{errors.phone}</p>}
                  </div>
                  <div className="hol-field">
                    <label className="hol-label">What property postcode are you looking for?</label>
                    <PostcodeLookup
                      postcode={form.postcode}
                      onPostcodeChange={(v) => setForm(f => ({ ...f, postcode: v }))}
                      onSelect={handlePostcodeSelect}
                      inputClassName="hol-input"
                      placeholder="e.g. M1 1AE"
                    />
                  </div>
                </div>

                {/* ── About your move ── */}
                <SectionTitle>About your move</SectionTitle>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">When do you want to move in by?<span className="hol-req">*</span></label>
                  {errors.moveBy && <p className="hol-err">{errors.moveBy}</p>}
                  <RadioGroup
                    options={["Within 2 weeks", "Within 1 month", "Other"]}
                    value={form.moveBy}
                    onChange={(v) => setRadio("moveBy", v)}
                    columns={3}
                  />
                  {form.moveBy === "Other" && (
                    <input
                      type="text"
                      className="hol-input"
                      placeholder="Please specify your move-in timeframe"
                      value={form.moveByOther}
                      onChange={set("moveByOther")}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">How long do you plan to live in the property?</label>
                  <RadioGroup
                    options={["6 months", "12 months", "Other"]}
                    value={form.stayDuration}
                    onChange={(v) => setRadio("stayDuration", v)}
                    columns={3}
                  />
                  {form.stayDuration === "Other" && (
                    <input
                      type="text"
                      className="hol-input"
                      placeholder="Please specify how long you plan to stay"
                      value={form.stayDurationOther}
                      onChange={set("stayDurationOther")}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Who is moving in?</label>
                  <RadioGroup
                    options={["Myself", "Partner", "Family", "Friends", "Other"]}
                    value={form.whoMovingIn}
                    onChange={(v) => setRadio("whoMovingIn", v)}
                    columns={2}
                  />
                </div>

                {/* ── About the tenancy ── */}
                <SectionTitle>About the tenancy</SectionTitle>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Are you renting for the first time in the UK?</label>
                  <RadioGroup
                    options={["Yes", "No"]}
                    value={form.firstTimeRenting}
                    onChange={(v) => setRadio("firstTimeRenting", v)}
                    columns={2}
                  />
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">What's your employment status?<span className="hol-req">*</span></label>
                  {errors.employmentStatus && <p className="hol-err">{errors.employmentStatus}</p>}
                  <RadioGroup
                    options={["Full-time", "Part-time", "Self-employed", "Unemployed", "Retired", "Student", "Prefer not to say"]}
                    value={form.employmentStatus}
                    onChange={(v) => setRadio("employmentStatus", v)}
                    columns={2}
                  />
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Do you have any pets?</label>
                  <RadioGroup
                    options={["Yes", "No"]}
                    value={form.hasPets}
                    onChange={(v) => setRadio("hasPets", v)}
                    columns={2}
                  />
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Will there be any smokers living at the property?</label>
                  <RadioGroup
                    options={["Yes", "No"]}
                    value={form.hasSmokers}
                    onChange={(v) => setRadio("hasSmokers", v)}
                    columns={2}
                  />
                </div>

                {/* ── About you ── */}
                <SectionTitle>About you</SectionTitle>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Is it Manchester or Leeds?</label>
                  <RadioGroup
                    options={["Manchester", "Leeds"]}
                    value={form.location}
                    onChange={(v) => setRadio("location", v)}
                    columns={2}
                  />
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">What days and times are you available for a viewing?</label>
                  <RadioGroup
                    options={["Weekdays", "Weekends", "Other"]}
                    value={form.viewingAvailability}
                    onChange={(v) => setRadio("viewingAvailability", v)}
                    columns={3}
                  />
                  {form.viewingAvailability === "Other" && (
                    <input
                      type="text"
                      className="hol-input"
                      style={{ marginTop: 10 }}
                      placeholder="Please describe your availability..."
                      value={form.viewingAvailabilityOther}
                      onChange={set("viewingAvailabilityOther")}
                    />
                  )}
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">What is the total annual income of all adults moving in?</label>
                  <input type="text" className="hol-input" placeholder="e.g. £35,000" value={form.totalAnnualIncome} onChange={set("totalAnnualIncome")} />
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Do you have children?</label>
                  <RadioGroup
                    options={["No", "1 child", "2 children", "3 children"]}
                    value={form.numberOfChildren}
                    onChange={(v) => setRadio("numberOfChildren", v)}
                    columns={2}
                  />
                  {form.numberOfChildren && form.numberOfChildren !== "No" && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      {["1 child", "2 children", "3 children"].includes(form.numberOfChildren) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <label style={{ fontSize: 14, color: "#374151", minWidth: 70 }}>Child 1 age</label>
                          <input type="text" className="hol-input" style={{ flex: 1 }} placeholder="e.g. 4" value={form.child1Age} onChange={set("child1Age")} />
                        </div>
                      )}
                      {["2 children", "3 children"].includes(form.numberOfChildren) && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <label style={{ fontSize: 14, color: "#374151", minWidth: 70 }}>Child 2 age</label>
                          <input type="text" className="hol-input" style={{ flex: 1 }} placeholder="e.g. 7" value={form.child2Age} onChange={set("child2Age")} />
                        </div>
                      )}
                      {form.numberOfChildren === "3 children" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <label style={{ fontSize: 14, color: "#374151", minWidth: 70 }}>Child 3 age</label>
                          <input type="text" className="hol-input" style={{ flex: 1 }} placeholder="e.g. 10" value={form.child3Age} onChange={set("child3Age")} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Are you aware of any adverse credit?</label>
                  <RadioGroup
                    options={["Yes", "No", "Prefer not to say"]}
                    value={form.adverseCredit}
                    onChange={(v) => setRadio("adverseCredit", v)}
                    columns={2}
                  />
                </div>

                {/* ── Message ── */}
                <SectionTitle>Your message</SectionTitle>
                <div className="hol-field hol-field--mb">
                  <label className="hol-label">
                    Please share any questions, requirements or additional details about your situation with the agent{" "}
                    <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    className="hol-input hol-textarea"
                    rows={4}
                    maxLength={700}
                    placeholder="E.g. where you work, your viewing availability..."
                    value={form.message}
                    onChange={set("message")}
                  />
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0", textAlign: "right" }}>{charCount}/700 characters</p>
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
                      <>
                        <svg className="hol-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        Send enquiry
                      </>
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
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap');
  .hol-overlay{position:fixed;inset:0;z-index:99999;background:rgba(10,15,28,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .25s ease;}
  .hol-overlay--open{opacity:1;pointer-events:all;}
  .hol-modal{background:#fff;border-radius:20px;width:100%;max-width:680px;max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.28);transform:scale(.94) translateY(10px);transition:transform .3s cubic-bezier(.34,1.56,.64,1);font-family:'Poppins',sans-serif;scrollbar-width:thin;scrollbar-color:#e2e5ed transparent;}
  .hol-modal--wide{max-width:720px;}
  .hol-overlay--open .hol-modal{transform:scale(1) translateY(0);}
  .hol-modal__header{display:flex;justify-content:space-between;align-items:flex-start;padding:32px 32px 24px;border-bottom:1px solid #f1f3f7;background:linear-gradient(135deg,#f8f9ff 0%,#fff 100%);border-radius:20px 20px 0 0;}
  .hol-modal__badge{display:inline-block;background:linear-gradient(135deg,#1a3c5e,#2563a8);color:#fff;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:20px;margin-bottom:10px;}
  .hol-modal__title{font-family:'Poppins',sans-serif;font-size:24px;font-weight:600;color:#0f1f3d;margin:0 0 6px;line-height:1.2;}
  .hol-modal__subtitle{font-size:14px;color:#6b7280;margin:0;line-height:1.5;}
  .hol-modal__close{background:#f4f6f9;border:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;transition:background .15s,color .15s;flex-shrink:0;margin-left:16px;}
  .hol-modal__close:hover{background:#e5e7eb;color:#111;}
  .hol-modal__body{padding:28px 32px 32px;}
  .hol-benefits{display:flex;flex-direction:column;gap:8px;background:#f0f4ff;border-radius:12px;padding:16px 18px;margin-bottom:24px;border:1px solid #dbeafe;}
  .hol-benefit{display:flex;align-items:center;gap:8px;font-size:13px;color:#1a3c5e;font-weight:500;}
  .hol-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;}
  .hol-field{display:flex;flex-direction:column;gap:8px;}
  .hol-field--full{grid-column:1/-1;}
  .hol-field--mb{margin-bottom:22px;}
  .hol-label{font-size:13px;font-weight:600;color:#374151;letter-spacing:.01em;}
  .hol-req{color:#e53e3e;margin-left:2px;}
  .hol-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:'Poppins',sans-serif;font-size:14px;color:#111827;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;}
  .hol-input:focus{border-color:#2563a8;box-shadow:0 0 0 3px rgba(37,99,168,.12);}
  .hol-input--error{border-color:#e53e3e!important;}
  .hol-textarea{resize:vertical;min-height:100px;}
  .hol-err{font-size:12px;color:#e53e3e;margin:0;}
  .hol-err-banner{display:flex;align-items:center;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;font-size:13px;color:#dc2626;margin-bottom:16px;}
  .hol-form-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:8px;padding-top:20px;border-top:1px solid #f1f3f7;}
  .hol-privacy{display:flex;align-items:center;gap:6px;font-size:12px;color:#9ca3af;margin:0;}
  .hol-submit{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#1a3c5e 0%,#2563a8 100%);color:#fff;border:none;border-radius:10px;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;padding:13px 24px;cursor:pointer;transition:opacity .15s,transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(37,99,168,.35);white-space:nowrap;}
  .hol-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,168,.45);}
  .hol-submit:disabled{opacity:.7;cursor:not-allowed;}
  .hol-submit--outline{background:transparent;border:2px solid #1a3c5e;color:#1a3c5e;box-shadow:none;}
  .hol-submit--outline:hover{background:#f0f4ff;box-shadow:none;}
  .hol-spinner{animation:hol-spin .8s linear infinite;}
  @keyframes hol-spin{to{transform:rotate(360deg);}}
  .hol-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:24px 0;}
  .hol-success__icon{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#1a3c5e,#2563a8);display:flex;align-items:center;justify-content:center;color:#fff;margin-bottom:20px;box-shadow:0 8px 24px rgba(37,99,168,.35);animation:hol-pop .5s cubic-bezier(.34,1.56,.64,1);}
  @keyframes hol-pop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
  .hol-success__title{font-family:'Poppins',sans-serif;font-size:22px;color:#0f1f3d;margin:0 0 12px;}
  .hol-success__msg{font-size:14px;color:#374151;max-width:380px;line-height:1.6;margin:0 0 8px;}
  .hol-success__sub{font-size:13px;color:#9ca3af;margin:0 0 24px;}
  @media(max-width:600px){.hol-modal__header{padding:24px 20px 18px;}.hol-modal__title{font-size:20px;}.hol-modal__body{padding:20px 20px 24px;}.hol-form-grid{grid-template-columns:1fr;gap:14px;}.hol-form-footer{flex-direction:column;align-items:stretch;}.hol-submit{justify-content:center;}}
`;
