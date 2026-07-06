"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import PostcodeLookup, { type AddressResult } from "@/components/PostcodeLookup";
import {
  citiesForDateIn,
  isCityScheduledIn,
  nextDatesForCityIn,
  type SlotView,
  type City,
  type ScheduleMap,
} from "@/lib/viewingSlots";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_PHONE_REGEX = /^(\+44|0)[\s-]?[1-9][\d\s-]{8,11}$/;

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  postcode: "",
  // Viewing appointment (the calendar)
  city: "",   // 'Manchester' | 'Leeds' — drives slot availability
  date: "",   // YYYY-MM-DD
  time: "",   // HH:mm slot
  // About your move
  moveBy: "",
  moveByOther: "",
  alignsWithAvailability: "",
  stayDuration: "",
  stayDurationOther: "",
  whoMovingIn: "",
  sameCity: "",
  peopleCount: "",
  // About the tenancy
  firstTimeRenting: "",
  employmentStatus: "",
  hasPets: "",
  hasSmokers: "",
  totalAnnualIncome: "",
  numberOfChildren: "",
  child1Age: "",
  child2Age: "",
  child3Age: "",
  adverseCredit: "",
  message: "",
};

function validate(form: typeof EMPTY_FORM, schedule: ScheduleMap | null) {
  const errors: Record<string, string> = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_REGEX.test(form.email)) errors.email = "Enter a valid email address";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!UK_PHONE_REGEX.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Enter a valid UK phone number";
  if (!form.city) errors.city = "Please choose which city the property is in";
  if (!form.date) errors.date = "Please choose a date";
  else if (form.city && !isCityScheduledIn(schedule, form.city as City, form.date))
    errors.date = "Our team isn't in this city on that day — please pick another date";
  if (!form.time) errors.time = "Please choose a viewing time slot";
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

function slotTitle(status: SlotView["status"]): string {
  switch (status) {
    case "full": return "Fully booked (2 clients)";
    case "blocked-gap": return "Too close to another viewing that day";
    case "other-city": return "This day is allocated to the other city";
    case "past": return "This time has passed";
    default: return "Available";
  }
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
  /** Postcode of the property being enquired about — pre-fills the postcode field. */
  propertyPostcode?: string;
  /** City the property is in, auto-detected by the listing page. When set, the
   *  tenant isn't asked to choose — the viewing is locked to this city. */
  propertyCity?: City | null;
}

export default function TenantEnquiryModal({
  isOpen,
  onClose,
  propertyTitle,
  propertyPrice,
  propertyPostcode,
  propertyCity,
}: TenantEnquiryModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Live slot availability for the chosen city + date.
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [lockedCity, setLockedCity] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Live city rota, mirrored from the office Google Calendar (null until loaded;
  // helpers fall back to the weekly default rota while null).
  const [schedule, setSchedule] = useState<ScheduleMap | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Earliest bookable date is today; allow booking up to ~60 days out.
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const maxDateStr = new Date(Date.now() + 60 * 864e5).toLocaleDateString("en-CA", { timeZone: "Europe/London" });

  // Load the live rota when the modal opens so hints/warnings reflect the
  // calendar. Silent on failure — the map-aware helpers fall back to the
  // built-in weekly rota, and the server still enforces the real rota.
  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    fetch(`/api/viewing-schedule?from=${todayStr}&days=60`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!ignore && data?.schedule) setSchedule(data.schedule); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [isOpen, todayStr]);

  // Fetch availability whenever the city or date changes (and the modal is open).
  // Skip the fetch entirely when the team isn't in this city on the chosen day —
  // the schedule warning is shown instead of an empty grid.
  useEffect(() => {
    if (!isOpen || !form.city || !form.date || !isCityScheduledIn(schedule, form.city as City, form.date)) {
      setSlots([]); setLockedCity(null); setSlotsError("");
      return;
    }
    let ignore = false;
    setSlotsLoading(true); setSlotsError("");
    fetch(`/api/viewing-availability?date=${encodeURIComponent(form.date)}&city=${encodeURIComponent(form.city)}`)
      .then(async (res) => {
        const data = await res.json();
        if (ignore) return;
        if (!res.ok) throw new Error(data.message || "Could not load times");
        setSlots(data.slots || []);
        setLockedCity(data.lockedCity || null);
      })
      .catch((e) => { if (!ignore) { setSlots([]); setSlotsError(e.message || "Could not load times"); } })
      .finally(() => { if (!ignore) setSlotsLoading(false); });
    return () => { ignore = true; };
  }, [isOpen, form.city, form.date, refreshKey, schedule]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Pre-fill the postcode from the property being viewed, so the tenant is
  // never asked for something the page already knows. Only fills an empty
  // field — anything they typed themselves is kept.
  useEffect(() => {
    if (isOpen && propertyPostcode) {
      setForm(f => (f.postcode ? f : { ...f, postcode: propertyPostcode }));
    }
  }, [isOpen, propertyPostcode]);

  // Lock the viewing to the property's detected city so the tenant is never
  // asked something the page already knows. Clears any stale time selection.
  useEffect(() => {
    if (isOpen && propertyCity) {
      setForm(f => (f.city === propertyCity ? f : { ...f, city: propertyCity, time: "" }));
    }
  }, [isOpen, propertyCity]);

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
    const errs = validate(form, schedule);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/book-viewing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          city: form.city,
          date: form.date,
          time: form.time,
          postcode: form.postcode,
          propertyTitle,
          // Screening answers, mapped to the booking API's field names.
          moveIn: form.moveBy === "Other" ? form.moveByOther : form.moveBy,
          alignsWithAvailability: form.alignsWithAvailability,
          sameCity: form.sameCity,
          peopleCount: form.peopleCount,
          hasChildren: form.numberOfChildren && form.numberOfChildren !== "No" ? "Yes" : (form.numberOfChildren || ""),
          childrenAges: [form.child1Age, form.child2Age, form.child3Age].filter(Boolean).join(", "),
          hasPets: form.hasPets,
          employmentStatus: form.employmentStatus,
          annualIncome: form.totalAnnualIncome,
          rentDuration: form.stayDuration === "Other" ? form.stayDurationOther : form.stayDuration,
          // Extra context (stored on the booking record).
          whoMovingIn: form.whoMovingIn,
          firstTimeRenting: form.firstTimeRenting,
          hasSmokers: form.hasSmokers,
          adverseCredit: form.adverseCredit,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Someone took the slot (or the day locked to the other city) between
        // loading and submitting — clear the choice and refresh the grid.
        setForm(f => ({ ...f, time: "" }));
        setRefreshKey(k => k + 1);
        setErrorMsg(data.message || "That time was just taken — please pick another.");
        setStatus("error");
        return;
      }
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (!mounted || !isOpen) return null;

  // Schedule-aware helpers for the "Choose your viewing" section. All driven by
  // the live rota map (falls back to the built-in weekly rota while it loads).
  const cityDetected = !!propertyCity;
  const activeCity = (form.city || "") as City | "";
  const prettyDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
  // The next handful of days the team is in this city — the "when can I book?" hint.
  const upcomingDates = activeCity
    ? nextDatesForCityIn(schedule, activeCity, todayStr, 5, 60)
    : [];
  const dateOffSchedule =
    !!activeCity && !!form.date && !isCityScheduledIn(schedule, activeCity, form.date);
  const suggestedDates = dateOffSchedule
    ? nextDatesForCityIn(schedule, activeCity, form.date, 3, 60)
    : [];

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
                    <label className="hol-label">{propertyPostcode ? "Property postcode" : "What property postcode are you looking for?"}</label>
                    <PostcodeLookup
                      postcode={form.postcode}
                      onPostcodeChange={(v) => setForm(f => ({ ...f, postcode: v }))}
                      onSelect={handlePostcodeSelect}
                      inputClassName="hol-input"
                      placeholder="e.g. M1 1AE"
                    />
                  </div>
                </div>

                {/* ── Choose your viewing (calendar) ── */}
                <SectionTitle>Choose your viewing</SectionTitle>
                {cityDetected ? (
                  // City auto-detected from the property — shown, not asked.
                  <div className="hol-field hol-field--mb">
                    <label className="hol-label">Viewing location</label>
                    <div className="hol-city-detected">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563a8" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>This property is in <strong>{form.city}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="hol-field hol-field--mb">
                    <label className="hol-label">Which city is the property in?<span className="hol-req">*</span></label>
                    <RadioGroup
                      options={["Manchester", "Leeds"]}
                      value={form.city}
                      onChange={(v) => { setRadio("city", v); setForm(f => ({ ...f, time: "" })); }}
                      columns={2}
                    />
                    {errors.city && <p className="hol-err">{errors.city}</p>}
                  </div>
                )}
                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Date<span className="hol-req">*</span></label>
                  <input
                    type="date"
                    className={`hol-input${errors.date ? " hol-input--error" : ""}`}
                    style={{ colorScheme: "light", maxWidth: 260 }}
                    min={todayStr}
                    max={maxDateStr}
                    value={form.date}
                    onChange={(e) => { const v = e.target.value; setForm(f => ({ ...f, date: v, time: "" })); setErrors(er => ({ ...er, date: "", time: "" })); }}
                  />
                  {activeCity && upcomingDates.length > 0 && (
                    <p className="hol-slot-note">
                      We&apos;re next in {activeCity} on <strong>{upcomingDates.map(prettyDate).join(", ")}</strong>.
                    </p>
                  )}
                  {activeCity && upcomingDates.length === 0 && (
                    <p className="hol-slot-note">
                      No {activeCity} viewing days in the next 60 days — please call us to arrange.
                    </p>
                  )}
                  {errors.date && <p className="hol-err">{errors.date}</p>}
                </div>
                {dateOffSchedule && (
                  <div className="hol-field hol-field--mb">
                    <p className="hol-slot-note hol-slot-note--warn">
                      Our team isn&apos;t in <strong>{activeCity}</strong> on {prettyDate(form.date)}
                      {citiesForDateIn(schedule, form.date).length > 0 && <> (that day covers {citiesForDateIn(schedule, form.date).join(" & ")})</>}.
                      {suggestedDates.length > 0 && " Try one of these dates instead:"}
                    </p>
                    {suggestedDates.length > 0 && (
                      <div className="hol-slot-grid" style={{ marginTop: 8 }}>
                        {suggestedDates.map((iso) => (
                          <button
                            key={iso}
                            type="button"
                            className="hol-slot"
                            style={{ minWidth: 110 }}
                            onClick={() => { setForm(f => ({ ...f, date: iso, time: "" })); setErrors(er => ({ ...er, date: "", time: "" })); }}
                          >
                            {prettyDate(iso)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {form.city && form.date && !dateOffSchedule && (
                  <div className="hol-field hol-field--mb">
                    <label className="hol-label">Available times<span className="hol-req">*</span></label>
                    {slotsLoading ? (
                      <p className="hol-slot-note">Loading available times…</p>
                    ) : slotsError ? (
                      <p className="hol-err">{slotsError}</p>
                    ) : lockedCity && lockedCity !== form.city ? (
                      <p className="hol-slot-note hol-slot-note--warn">
                        This day is already allocated to <strong>{lockedCity}</strong> viewings — our team is travelling there that day. Please pick another date, or switch the city to {lockedCity}.
                      </p>
                    ) : slots.length === 0 ? (
                      <p className="hol-slot-note">No times available for this day.</p>
                    ) : (
                      <>
                        <div className="hol-slot-grid">
                          {slots.map((s) => {
                            const selectable = s.status === "available";
                            const selected = form.time === s.time;
                            return (
                              <button
                                key={s.time}
                                type="button"
                                disabled={!selectable}
                                className={`hol-slot${selected ? " hol-slot--on" : ""}${selectable ? "" : " hol-slot--off"}`}
                                onClick={() => { setForm(f => ({ ...f, time: s.time })); setErrors(er => ({ ...er, time: "" })); }}
                                title={slotTitle(s.status)}
                              >
                                {s.time}
                              </button>
                            );
                          })}
                        </div>
                        <p className="hol-slot-note">Greyed-out times are fully booked or too close to another viewing. Each time slot takes up to 2 clients.</p>
                      </>
                    )}
                    {errors.time && <p className="hol-err">{errors.time}</p>}
                  </div>
                )}

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
                  <label className="hol-label">Does this align with the advertised availability?</label>
                  <RadioGroup
                    options={["Yes", "No", "Not sure"]}
                    value={form.alignsWithAvailability}
                    onChange={(v) => setRadio("alignsWithAvailability", v)}
                    columns={3}
                  />
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

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">How many people will be moving in?</label>
                  <RadioGroup
                    options={["1", "2", "3", "4", "5", "6+"]}
                    value={form.peopleCount}
                    onChange={(v) => setRadio("peopleCount", v)}
                    columns={6}
                  />
                </div>

                <div className="hol-field hol-field--mb">
                  <label className="hol-label">Do you currently live in the same city?</label>
                  <RadioGroup
                    options={["Yes", "No"]}
                    value={form.sameCity}
                    onChange={(v) => setRadio("sameCity", v)}
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
                    options={["Full-time", "Part-time", "Temporary", "Permanent", "Self-employed", "Student", "Other"]}
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
  .hol-slot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px;margin-top:4px;}
  .hol-slot{padding:10px 6px;border:1.5px solid #d7dce6;border-radius:9px;background:#fff;color:#1a3c5e;font-family:'Poppins',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
  .hol-slot:hover:not(:disabled){border-color:#2563a8;background:#f0f4ff;}
  .hol-slot--on{background:#2563a8;border-color:#2563a8;color:#fff;}
  .hol-slot--off{background:#f3f4f6;border-color:#eceef2;color:#c2c7d0;cursor:not-allowed;text-decoration:line-through;}
  .hol-slot-note{font-size:12px;color:#9ca3af;margin:8px 0 0;line-height:1.5;}
  .hol-slot-note--warn{color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;}
  .hol-city-detected{display:flex;align-items:center;gap:10px;background:#f0f4ff;border:1.5px solid #dbeafe;border-radius:10px;padding:12px 14px;font-size:14px;color:#1a3c5e;}
  .hol-city-detected strong{color:#0f1f3d;}
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
