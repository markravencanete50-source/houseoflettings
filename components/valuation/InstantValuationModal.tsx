// components/valuation/InstantValuationModal.tsx
'use client';

import { useState, useCallback } from 'react';
import {
  calculateValuation,
  formatCurrency,
  type ValuationInput,
  type ValuationResult,
  type ValuationMode,
} from '@/lib/valuation/valuationEngine';
import type { PropertyType } from '@/lib/valuation/marketData2026';

interface InstantValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select Sale or Rent; omit to let the user choose */
  defaultMode?: ValuationMode;
}

interface AddressSuggestion {
  formattedAddress: string;
  postcode: string;
}

type Step = 'postcode' | 'details' | 'result';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'terraced', label: 'Terraced House' },
  { value: 'semi_detached', label: 'Semi-Detached House' },
  { value: 'detached', label: 'Detached House' },
  { value: 'bungalow', label: 'Bungalow' },
];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function InstantValuationModal({
  isOpen,
  onClose,
  defaultMode,
}: InstantValuationModalProps) {
  const [step, setStep] = useState<Step>('postcode');
  const [mode, setMode] = useState<ValuationMode>(defaultMode ?? 'sale');

  const [postcodeQuery, setPostcodeQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedPostcode, setSelectedPostcode] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [propertyType, setPropertyType] = useState<PropertyType>('semi_detached');
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [conditionScore, setConditionScore] = useState<number>(50);

  const [result, setResult] = useState<ValuationResult | null>(null);

  // --- Postcode / address lookup -------------------------------------
  // Hits your existing server-side proxy route wrapping getAddress.io,
  // so the API key never reaches the client.
  const handlePostcodeSearch = useCallback(async (query: string) => {
    setPostcodeQuery(query);
    setSearchError(null);

    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/address-lookup?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Lookup failed');
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSearchError("Couldn't look up that address. You can still type your postcode and continue.");
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion.formattedAddress);
    setSelectedPostcode(suggestion.postcode);
    setSuggestions([]);
    setStep('details');
  };

  const handleContinueWithRawPostcode = () => {
    if (!postcodeQuery.trim()) {
      setSearchError('Please enter a postcode to continue.');
      return;
    }
    setSelectedPostcode(postcodeQuery.trim());
    setSelectedAddress(postcodeQuery.trim());
    setStep('details');
  };

  // --- Valuation calculation ------------------------------------------
  const handleCalculate = () => {
    const input: ValuationInput = {
      postcode: selectedPostcode,
      propertyType,
      bedrooms,
      mode,
      conditionScore,
    };
    setResult(calculateValuation(input));
    setStep('result');
  };

  const handleReset = () => {
    setStep('postcode');
    setPostcodeQuery('');
    setSuggestions([]);
    setSelectedAddress('');
    setSelectedPostcode('');
    setPropertyType('semi_detached');
    setBedrooms(3);
    setConditionScore(50);
    setResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ivm-overlay" onClick={handleClose}>
      <div className="ivm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ivm-close" onClick={handleClose} aria-label="Close">
          &times;
        </button>

        <div className="ivm-header">
          <h2 className="ivm-title">Instant Valuation</h2>
          <p className="ivm-subtitle">
            Get an estimated {mode === 'sale' ? 'sale price' : 'monthly rent'} for your property in
            seconds.
          </p>

          <div className="ivm-mode-toggle" role="tablist" aria-label="Valuation type">
            <button
              role="tab"
              aria-selected={mode === 'sale'}
              className={`ivm-mode-btn ${mode === 'sale' ? 'ivm-mode-btn--active' : ''}`}
              onClick={() => setMode('sale')}
            >
              For Sale
            </button>
            <button
              role="tab"
              aria-selected={mode === 'rent'}
              className={`ivm-mode-btn ${mode === 'rent' ? 'ivm-mode-btn--active' : ''}`}
              onClick={() => setMode('rent')}
            >
              To Rent
            </button>
          </div>
        </div>

        {step === 'postcode' && (
          <div className="ivm-step">
            <label className="ivm-label" htmlFor="ivm-postcode-input">
              Enter your address or postcode
            </label>
            <input
              id="ivm-postcode-input"
              className="ivm-input"
              type="text"
              placeholder="e.g. SW1A 1AA"
              value={postcodeQuery}
              onChange={(e) => handlePostcodeSearch(e.target.value)}
              autoComplete="off"
            />

            {isSearching && <p className="ivm-hint">Searching…</p>}
            {searchError && <p className="ivm-error">{searchError}</p>}

            {suggestions.length > 0 && (
              <ul className="ivm-suggestions">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      className="ivm-suggestion-item"
                      onClick={() => handleSelectAddress(s)}
                    >
                      {s.formattedAddress}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button className="ivm-btn-primary" onClick={handleContinueWithRawPostcode}>
              Continue
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="ivm-step">
            <p className="ivm-selected-address">{selectedAddress}</p>

            <label className="ivm-label">Property type</label>
            <div className="ivm-pill-group">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`ivm-pill ${propertyType === t.value ? 'ivm-pill--active' : ''}`}
                  onClick={() => setPropertyType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="ivm-label">Bedrooms</label>
            <div className="ivm-pill-group">
              {BEDROOM_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={`ivm-pill ivm-pill--small ${bedrooms === n ? 'ivm-pill--active' : ''}`}
                  onClick={() => setBedrooms(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <label className="ivm-label" htmlFor="ivm-condition">
              Property condition
            </label>
            <input
              id="ivm-condition"
              className="ivm-slider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={conditionScore}
              onChange={(e) => setConditionScore(Number(e.target.value))}
            />
            <div className="ivm-slider-labels">
              <span>Needs renovation</span>
              <span>Excellent condition</span>
            </div>

            <div className="ivm-step-actions">
              <button className="ivm-btn-outline" onClick={() => setStep('postcode')}>
                Back
              </button>
              <button className="ivm-btn-primary" onClick={handleCalculate}>
                Get My Valuation
              </button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="ivm-step ivm-result">
            <p className="ivm-selected-address">{selectedAddress}</p>

            <div className="ivm-result-card">
              <span className="ivm-result-label">
                Estimated {result.mode === 'sale' ? 'Sale Price' : 'Monthly Rent'}
              </span>
              <span className="ivm-result-mid">{formatCurrency(result.estimateMid)}</span>
              <span className="ivm-result-range">
                {formatCurrency(result.estimateLow)} – {formatCurrency(result.estimateHigh)}
              </span>
            </div>

            <div className="ivm-result-meta">
              <p>
                <strong>{result.regionLabel}</strong> · {result.annualGrowthPct >= 0 ? '+' : ''}
                {result.annualGrowthPct.toFixed(1)}% annual{' '}
                {result.mode === 'sale' ? 'price' : 'rent'} growth
              </p>
              <p className="ivm-disclaimer">
                Estimate based on {result.dataYear} UK market data (updated {result.dataUpdated}).
                This is an automated guide price, not a formal valuation. For an accurate market
                appraisal, book a free assessment with one of our local experts.
              </p>
            </div>

            <div className="ivm-step-actions">
              <button className="ivm-btn-outline" onClick={handleReset}>
                Value Another Property
              </button>
              <a className="ivm-btn-primary" href="/free-assessment">
                Book Free Expert Assessment
              </a>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .ivm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }
        .ivm-modal {
          position: relative;
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        }
        .ivm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 28px;
          line-height: 1;
          color: #64748b;
          cursor: pointer;
        }
        .ivm-close:hover {
          color: #1e293b;
        }
        .ivm-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px;
        }
        .ivm-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 20px;
        }
        .ivm-mode-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .ivm-mode-btn {
          flex: 1;
          border: none;
          background: none;
          padding: 10px 0;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ivm-mode-btn--active {
          background: #1d4ed8;
          color: #ffffff;
        }
        .ivm-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin: 16px 0 8px;
        }
        .ivm-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 15px;
          box-sizing: border-box;
        }
        .ivm-input:focus {
          outline: 2px solid #1d4ed8;
          outline-offset: 1px;
        }
        .ivm-hint {
          font-size: 13px;
          color: #64748b;
          margin: 6px 0 0;
        }
        .ivm-error {
          font-size: 13px;
          color: #b91c1c;
          margin: 6px 0 0;
        }
        .ivm-suggestions {
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          max-height: 180px;
          overflow-y: auto;
        }
        .ivm-suggestion-item {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: #ffffff;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          cursor: pointer;
        }
        .ivm-suggestion-item:hover {
          background: #f8fafc;
        }
        .ivm-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ivm-pill {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ivm-pill--small {
          padding: 8px 16px;
        }
        .ivm-pill--active {
          background: #1d4ed8;
          border-color: #1d4ed8;
          color: #ffffff;
        }
        .ivm-slider {
          width: 100%;
          margin-top: 6px;
        }
        .ivm-slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .ivm-step-actions {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }
        .ivm-btn-primary {
          flex: 1;
          text-align: center;
          background: #1d4ed8;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 13px 0;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .ivm-btn-primary:hover {
          background: #1e40af;
        }
        .ivm-btn-outline {
          flex: 1;
          background: #ffffff;
          color: #1d4ed8;
          border: 1px solid #1d4ed8;
          border-radius: 10px;
          padding: 13px 0;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
        }
        .ivm-btn-outline:hover {
          background: #eff6ff;
        }
        .ivm-selected-address {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .ivm-result-card {
          background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
          color: #ffffff;
          border-radius: 14px;
          padding: 28px 20px;
          text-align: center;
          margin-bottom: 20px;
        }
        .ivm-result-label {
          display: block;
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 8px;
        }
        .ivm-result-mid {
          display: block;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .ivm-result-range {
          display: block;
          font-size: 14px;
          opacity: 0.85;
          margin-top: 6px;
        }
        .ivm-result-meta p {
          font-size: 13px;
          color: #475569;
          margin: 0 0 8px;
        }
        .ivm-disclaimer {
          color: #94a3b8 !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
}
