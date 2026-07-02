"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import PostcodeLookup, { type AddressResult } from "@/components/PostcodeLookup";

export default function BookViewingPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postcode: "",
    moveIn: "",
    tenancy: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePostcodeSelect = useCallback((data: AddressResult) => {
    setFormData((prev) => ({ ...prev, postcode: data.postcode || prev.postcode }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.moveIn) { setError("Please tell us when you want to move in by."); return; }
    setLoading(true);
    setError("");
    try {
      const tenancyLabels: Record<string, string> = {
        "6months": "6 months", "12months": "12 months", "18months": "18 months",
        "2years+": "2 years+", "unsure": "Not sure yet",
      };
      const res = await fetch("/api/tenant-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          postcode: formData.postcode,
          moveBy: formData.moveIn,
          stayDuration: tenancyLabels[formData.tenancy] || formData.tenancy,
          source: "book-viewing-page",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#fff",
    border: "1.5px solid #d1d5db",
    borderRadius: 8,
    color: "#111827",
    fontSize: 15,
    padding: "13px 16px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  };

  return (
    <main
      style={{
        background: "#eef0f7",
        minHeight: "100vh",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        input:focus, select:focus, textarea:focus {
          border-color: #2563eb !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        select option { background: #fff; color: #111827; }
        .bv-radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .bv-radio-label {
          display: flex; align-items: center; gap: 10px;
          border: 1.5px solid #d1d5db;
          border-radius: 8px; padding: 11px 16px;
          cursor: pointer; font-size: 14px; font-weight: 500;
          color: #374151; background: #fff;
          transition: border-color 0.2s, background 0.2s;
          flex: 1; min-width: 110px;
        }
        .bv-radio-label:has(input:checked) {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .bv-radio-label input { accent-color: #2563eb; }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          paddingTop: "calc(68px + 72px)",
          paddingBottom: 72,
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/images/Tenants_Book_viewing_background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(1.4)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(10,20,50,0.88) 0%, rgba(10,20,50,0.65) 60%, rgba(10,20,50,0.4) 100%)",
        }} />
        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <h1 style={{
            fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}>
            Looking to rent a property?
          </h1>
          <p style={{
            fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
            color: "rgba(255,255,255,0.65)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Register your requirements and we&apos;ll match you with suitable properties before they hit the market.
          </p>
        </div>
      </section>

      {/* ── FORM SECTION ── */}
      <section style={{ padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            padding: "48px 52px",
          }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "#111827" }}>Viewing Request Received</h3>
                <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.7 }}>
                  Our team will review your request and get back to you shortly to confirm the details.
                </p>
              </div>
            ) : (
              <>
                {/* Card header */}
                <div style={{ marginBottom: 36 }}>
                  <span style={{
                    display: "inline-block",
                    background: "#1e3a5f",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}>
                    Book a Viewing
                  </span>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", marginBottom: 8, letterSpacing: "-0.02em" }}>
                    Book a Viewing
                  </h2>
                  <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>
                    Register your requirements and we&apos;ll match you with suitable properties before they hit the market.
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* First + Last name */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>First name <span style={{ color: "#ef4444" }}>*</span></label>
                      <input name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="e.g. James" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last name <span style={{ color: "#ef4444" }}>*</span></label>
                      <input name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="e.g. Whitfield" style={inputStyle} />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                      <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="james@example.co.uk" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
                      <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="e.g. 07700 900123" style={inputStyle} />
                    </div>
                  </div>

                  {/* Postcode */}
                  <div>
                    <label style={labelStyle}>Property Postcode</label>
                    <PostcodeLookup
                      postcode={formData.postcode}
                      onPostcodeChange={(v) => setFormData((prev) => ({ ...prev, postcode: v }))}
                      onSelect={handlePostcodeSelect}
                      inputStyle={inputStyle}
                      placeholder="e.g. M1 1AE"
                    />
                  </div>

                  {/* Move-in */}
                  <div>
                    <label style={labelStyle}>When do you want to move in by? <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="bv-radio-group">
                      {["Within 2 weeks", "Within 1 month", "Other"].map((opt) => (
                        <label key={opt} className="bv-radio-label">
                          <input
                            type="radio"
                            name="moveIn"
                            value={opt}
                            checked={formData.moveIn === opt}
                            onChange={handleChange}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tenancy length */}
                  <div>
                    <label style={labelStyle}>How long do you plan to live in the property?</label>
                    <select name="tenancy" value={formData.tenancy} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">Select…</option>
                      <option value="6months">6 months</option>
                      <option value="12months">12 months</option>
                      <option value="18months">18 months</option>
                      <option value="2years+">2 years+</option>
                      <option value="unsure">Not sure yet</option>
                    </select>
                  </div>

                  {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14, fontWeight: 500 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Footer row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                    <span style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Your details are secure and never shared.
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: loading ? "#93c5fd" : "#1e3a5f",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "13px 28px",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {!loading && <span>→</span>}
                      {loading ? "Sending…" : "Book a Viewing"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer trust line */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
            marginTop: 28,
            flexWrap: "wrap",
          }}>
            {["No obligation", "Response within 24 hours", "Leeds & Manchester experts"].map((t) => (
              <span key={t} style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
