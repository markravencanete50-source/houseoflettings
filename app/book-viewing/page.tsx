"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function BookViewingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    postcode: "",
    propertyType: "",
    moveInDate: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const postcodeRef = useRef<HTMLInputElement>(null);

  const initAutocomplete = () => {
    if (!window.google || !addressRef.current) return;

    const setupAutocomplete = (inputRef: React.RefObject<HTMLInputElement>, field: "addressLine1" | "city" | "postcode") => {
      if (!inputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "gb" },
        types: ["address"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (!place.address_components) return;
        let line1 = "";
        let cityVal = "";
        let postcodeVal = "";
        for (const comp of place.address_components) {
          if (comp.types.includes("street_number")) line1 = comp.long_name + " " + line1;
          if (comp.types.includes("route")) line1 += comp.long_name;
          if (comp.types.includes("postal_town") || comp.types.includes("locality")) cityVal = comp.long_name;
          if (comp.types.includes("postal_code")) postcodeVal = comp.long_name;
        }
        setFormData((prev) => ({
          ...prev,
          addressLine1: line1.trim() || prev.addressLine1,
          city: cityVal || prev.city,
          postcode: postcodeVal || prev.postcode,
        }));
      });
    };

    setupAutocomplete(addressRef, "addressLine1");
    setupAutocomplete(cityRef, "city");
    setupAutocomplete(postcodeRef, "postcode");
  };

  useEffect(() => {
    if (window.google) {
      initAutocomplete();
      return;
    }
    window.initGooglePlaces = initAutocomplete;
    if (!document.querySelector("#google-places-script")) {
      const script = document.createElement("script");
      script.id = "google-places-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(37,99,235,0.35)",
    borderRadius: 8,
    color: "#fff",
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
    color: "rgba(255,255,255,0.75)",
    marginBottom: 7,
    letterSpacing: "0.03em",
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
        @keyframes bv-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bv-orb-move {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(40px, -30px); }
          66% { transform: translate(-25px, 35px); }
        }
        @keyframes bv-float {
          0%, 100% { transform: translateY(0px); opacity: 0.18; }
          50% { transform: translateY(-20px); opacity: 0.28; }
        }
        @keyframes bv-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.0); }
          50% { box-shadow: 0 0 60px 10px rgba(37,99,235,0.10); }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        input:focus, select:focus, textarea:focus {
          border-color: #2563eb !important;
          background: rgba(37,99,235,0.08) !important;
        }
        select option { background: #041230; color: #fff; }
      `}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(2,11,26,0.82) 0%, rgba(4,18,48,0.76) 60%, rgba(6,26,66,0.72) 100%), url(/images/Tenants_Book_viewing_background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          paddingTop: "calc(68px + 80px)",
          paddingBottom: 80,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
          <span
            style={{
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
            }}
          >
            Book a Viewing
          </span>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            See your next{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #2563eb, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              home in person.
            </span>
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
              color: "rgba(255,255,255,0.65)",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Fill in the form below and our team will be in touch to confirm your viewing — no fees, no hassle.
          </p>
        </div>
      </section>

      {/* ── FORM SECTION ── */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {/* Animated background */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position: "absolute", width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%)",
            top: "-150px", right: "-200px",
            animation: "bv-orb-move 18s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 65%)",
            bottom: "-100px", left: "-150px",
            animation: "bv-orb-move 14s ease-in-out infinite reverse",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(135deg, transparent 0px, transparent 60px, rgba(37,99,235,0.018) 60px, rgba(37,99,235,0.018) 61px)",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "72px 24px 100px" }}>
          {submitted ? (
            <div style={{
              border: "2px solid #2563eb",
              borderRadius: 16,
              padding: "80px 40px",
              background: "rgba(10,24,56,0.85)",
              backdropFilter: "blur(16px)",
              textAlign: "center",
              animation: "bv-pulse 4s ease-in-out infinite",
            }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, marginBottom: 16 }}>
                Viewing Request Received
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
                Thanks for reaching out. Our team will review your request and get back to you shortly to confirm the details.
              </p>
            </div>
          ) : (
            <div style={{
              border: "2px solid rgba(37,99,235,0.5)",
              borderRadius: 16,
              padding: "clamp(28px, 5vw, 52px)",
              background: "rgba(10,24,56,0.85)",
              backdropFilter: "blur(16px)",
              animation: "bv-pulse 6s ease-in-out infinite",
            }}>
              <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 1.75rem)", fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
                Request a Viewing
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 36 }}>
                All fields marked <span style={{ color: "#60a5fa" }}>*</span> are required.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Row 1 — Name + Email */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Full Name <span style={{ color: "#60a5fa" }}>*</span></label>
                    <input
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. James Smith"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address <span style={{ color: "#60a5fa" }}>*</span></label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Row 2 — Phone + Property Type */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Phone Number <span style={{ color: "#60a5fa" }}>*</span></label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="07700 900000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Property Type</label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select type…</option>
                      <option value="flat">Flat / Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="room">Room</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address — 3 fields with autocomplete */}
                <div>
                  <label style={labelStyle}>1st Line of Address <span style={{ color: "#60a5fa" }}>*</span></label>
                  <input
                    ref={addressRef}
                    name="addressLine1"
                    required
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="Start typing your address…"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>City <span style={{ color: "#60a5fa" }}>*</span></label>
                    <input
                      ref={cityRef}
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Leeds"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Postcode <span style={{ color: "#60a5fa" }}>*</span></label>
                    <input
                      ref={postcodeRef}
                      name="postcode"
                      required
                      value={formData.postcode}
                      onChange={handleChange}
                      placeholder="e.g. LS1 4DY"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Preferred Move-in Date */}
                <div>
                  <label style={labelStyle}>Preferred Move-in Date</label>
                  <input
                    name="moveInDate"
                    type="date"
                    value={formData.moveInDate}
                    onChange={handleChange}
                    style={{ ...inputStyle, colorScheme: "dark" }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={labelStyle}>Anything else we should know?</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g. number of occupants, budget, specific requirements…"
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  />
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
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
