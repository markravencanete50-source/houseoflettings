"use client";

import { useState } from "react";

type Mode = "idle" | "valuation" | "assessment";

export default function ValuationEmbed() {
  const [mode, setMode] = useState<Mode>("idle");

  const VALUATION_URL = "https://landlord-matching.vercel.app/instant-valuation";
  const ASSESSMENT_URL = "https://landlord-matching.vercel.app/#assessment";

  return (
    <section className="valuation-embed">
      {/* CTA text */}
      <p className="valuation-embed__tagline">
        Get a free, no-obligation assessment of your property and find out how
        much hassle-free management could save you.
      </p>

      {/* Buttons */}
      <div className="valuation-embed__buttons">
        <button
          className={`btn-valuation ${mode === "valuation" ? "active" : ""}`}
          onClick={() => setMode(mode === "valuation" ? "idle" : "valuation")}
        >
          Instant Rent Valuation
        </button>
        <button
          className={`btn-assessment ${mode === "assessment" ? "active" : ""}`}
          onClick={() => setMode(mode === "assessment" ? "idle" : "assessment")}
        >
          Get My Free Assessment
        </button>
      </div>

      {/* Iframe panel */}
      {mode !== "idle" && (
        <div className="valuation-embed__frame-wrap">
          <button
            className="valuation-embed__close"
            onClick={() => setMode("idle")}
            aria-label="Close"
          >
            ✕
          </button>
          <iframe
            key={mode} // remount iframe when switching modes
            src={mode === "valuation" ? VALUATION_URL : ASSESSMENT_URL}
            title={
              mode === "valuation"
                ? "Instant Rent Valuation"
                : "Free Property Assessment"
            }
            className="valuation-embed__iframe"
            allow="fullscreen"
          />
        </div>
      )}

      <style jsx>{`
        .valuation-embed {
          background: #0d1b2a;
          padding: 3rem 1.5rem;
          text-align: center;
          width: 100%;
        }

        .valuation-embed__tagline {
          color: #e2e8f0;
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto 2rem;
        }

        .valuation-embed__buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 0;
        }

        /* Gold filled, Instant Valuation */
        .btn-valuation {
          background: #b8962e;
          color: #fff;
          border: 2px solid #b8962e;
          padding: 0.75rem 1.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-valuation:hover,
        .btn-valuation.active {
          background: #9a7a24;
          border-color: #9a7a24;
        }

        /* Outlined, Assessment */
        .btn-assessment {
          background: transparent;
          color: #fff;
          border: 2px solid #fff;
          padding: 0.75rem 1.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .btn-assessment:hover,
        .btn-assessment.active {
          background: #fff;
          color: #0d1b2a;
        }

        /* Iframe container */
        .valuation-embed__frame-wrap {
          position: relative;
          margin-top: 2rem;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
          animation: slideDown 0.25s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .valuation-embed__iframe {
          width: 100%;
          height: 680px;
          border: none;
          display: block;
          background: #fff;
        }

        .valuation-embed__close {
          position: absolute;
          top: 10px;
          right: 14px;
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 0.8rem;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .valuation-embed__close:hover {
          background: rgba(0, 0, 0, 0.8);
        }

        @media (max-width: 600px) {
          .valuation-embed__iframe {
            height: 560px;
          }
          .btn-valuation,
          .btn-assessment {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
