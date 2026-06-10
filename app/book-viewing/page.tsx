"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(37,99,235,0.35)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    padding: "13px 16px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s, background 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 7,
    letterSpacing: "0.02em",
  };

  return (
    <main
      style={{
        background: "linear-gradient(160deg, #020b1a 0%, #041230 60%, #061a42 100%)",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        @keyframes bv-orb {
          0%, 100% { transform: translate(0,0); }
          33% { transform: translate(40px,-30px); }
          66% { transform: translate(-25px,35px); }
        }
        @keyframes bv-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
          50% { box-shadow: 0 0 60px 8px rgba(37,99,235,0.10); }
        }
        input::placeholder { color: rgba(255,255,255,0.28); }
        input:focus, select:focus {
          border-color: #2563eb !important;
          background: rgba(37,99,235,0.08) !important;
        }
        select option { background: #041230; color: #fff; }
        .bv-radio-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .bv-radio-label {
          display: flex; align-items: center; gap: 10px;
          border: 1.5px solid rgba(37,99,235,0.35);
          borderRadius: 8px; padding: 12px 18px;
          cursor: pointer; font-size: 14px; font-weight: 500;
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.04);
          transition: border-color 0.2s, background 0.2s;
          flex: 1; min-width: 120px;
        }
        .bv-radio-label:has(input:checked) {
          border-color: #2563eb;
          background: rgba(37,99,235,0.12);
          color: #fff;
        }
        .bv-radio-label input { accent-color: #2563eb; }
        @media (max-width: 860px) {
          .bv-split { flex-direction: column !important; }
          .bv-left { padding-right: 0 !important; border-right: none !important; border-bottom: 1px solid rgba(37,99,235,0.15) !important; padding-bottom: 40px !important; }
        }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(2,11,26,0.82) 0%, rgba(4,18,48,0.76) 60%, rgba(6,26,66,0.72) 100%), url(/images/Tenants_Book_viewing_background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          paddingTop: "calc(68px + 72px)",
          paddingBottom: 72,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 24px" }}>
          <span style={{
            display: "inline-block",
            border: "1.5px solid rgba(37,99,235,0.8)",
            borderRadius: 999,
            padding: "7px 20px",
            fontSize: 13,
            fontWeight: 700,
            color: "#bfdbfe",
            letterSpacing: "0.1em",
            marginBottom: 28,
            textTransform: "uppercase",
            background: "rgba(37,99,235,0.15)",
          }}>
            Book a Viewing
          </span>
          <h1 style={{
            fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            Looking to rent{" "}
            <span style={{
              background: "linear-gradient(90deg, #2563eb, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              a property?
            </span>
          </h1>
          <p style={{
            fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
            color: "rgba(255,255,255,0.65)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Register your requirements and we'll match you with suitable properties before they hit the market.
          </p>
        </div>
      </section>

      {/* ── SPLIT FORM SECTION ── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        backgroundImage: "url('/images/Book_a_viewing_page_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(160deg, rgba(2,11,26,0.88) 0%, rgba(4,18,48,0.84) 60%, rgba(6,26,66,0.80) 100%)",
        }} />
        {/* Animated bg orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%)",
            top: "-150px", right: "-200px",
            animation: "bv-orb 18s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 65%)",
            bottom: "-100px", left: "-150px",
            animation: "bv-orb 14s ease-in-out infinite reverse",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(135deg, transparent 0px, transparent 60px, rgba(37,99,235,0.018) 60px, rgba(37,99,235,0.018) 61px)",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "80px 24px 100px" }}>
          <div
            className="bv-split"
            style={{
              display: "flex",
              gap: 0,
              border: "2px solid rgba(37,99,235,0.45)",
              borderRadius: 20,
              background: "rgba(10,24,56,0.88)",
              backdropFilter: "blur(16px)",
              overflow: "hidden",
              animation: "bv-pulse 6s ease-in-out infinite",
            }}
          >
            {/* LEFT — info panel */}
            <div
              className="bv-left"
              style={{
                flex: "0 0 380px",
                padding: "52px 44px",
                borderRight: "1px solid rgba(37,99,235,0.18)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <span style={{
                display: "inline-block",
                background: "#2563eb",
                color: "#fff",
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 28,
                alignSelf: "flex-start",
              }}>
                Book a Viewing
              </span>

              <h2 style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: 16,
                letterSpacing: "-0.02em",
              }}>
                Book a Viewing
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 15,
                lineHeight: 1.7,
                marginBottom: 36,
              }}>
                Register your requirements and we'll match you with suitable properties before they hit the market.
              </p>

              {/* Trust badges */}
              <div style={{
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.2)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
                {[
                  "Takes less than two minutes",
                  "Helps us match you faster",
                  "Saves time on calls with agents",
                ].map((text) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — form */}
            <div style={{ flex: 1, padding: "52px 44px" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12 }}>Viewing Request Received</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7 }}>
                    Our team will review your request and get back to you shortly to confirm the details.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>

                  {/* Section: Your details */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                    Your details
                  </h3>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "-10px 0 2px" }} />

                  {/* First + Last name */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>First name <span style={{ color: "#60a5fa" }}>*</span></label>
                      <input name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="e.g. James" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last name <span style={{ color: "#60a5fa" }}>*</span></label>
                      <input name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="e.g. Whitfield" style={inputStyle} />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Email address <span style={{ color: "#60a5fa" }}>*</span></label>
                      <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="james@example.co.uk" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone number <span style={{ color: "#60a5fa" }}>*</span></label>
                      <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="e.g. 07700 900123" style={inputStyle} />
                    </div>
                  </div>

                  {/* Postcode */}
                  <div>
                    <label style={labelStyle}>What property postcode are you looking for?</label>
                    <input name="postcode" value={formData.postcode} onChange={handleChange} placeholder="e.g. M1 1AE or LS1 1BA" style={{ ...inputStyle, maxWidth: 320 }} />
                  </div>

                  {/* Section: About your move */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "8px 0 4px", letterSpacing: "-0.01em" }}>
                    About your move
                  </h3>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "-10px 0 2px" }} />

                  {/* Move-in timeline — radio */}
                  <div>
                    <label style={labelStyle}>When do you want to move in by? <span style={{ color: "#60a5fa" }}>*</span></label>
                    <div className="bv-radio-group">
                      {["Within 2 weeks", "Within 1 month", "Other"].map((opt) => (
                        <label key={opt} className="bv-radio-label" style={{
                          display: "flex", alignItems: "center", gap: 10,
                          border: `1.5px solid ${formData.moveIn === opt ? "#2563eb" : "rgba(37,99,235,0.35)"}`,
                          borderRadius: 8, padding: "12px 18px",
                          cursor: "pointer", fontSize: 14, fontWeight: 500,
                          color: formData.moveIn === opt ? "#fff" : "rgba(255,255,255,0.75)",
                          background: formData.moveIn === opt ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
                          transition: "all 0.2s",
                          flex: 1, minWidth: 120,
                        }}>
                          <input
                            type="radio"
                            name="moveIn"
                            value={opt}
                            checked={formData.moveIn === opt}
                            onChange={handleChange}
                            style={{ accentColor: "#2563eb" }}
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

                  <div style={{ paddingTop: 8 }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: loading ? "rgba(37,99,235,0.5)" : "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "15px 40px",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        letterSpacing: "0.02em",
                        transition: "background 0.2s",
                        width: "100%",
                      }}
                    >
                      {loading ? "Sending…" : "Book a Viewing"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
