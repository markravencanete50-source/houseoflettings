'use client';

import { useState, useRef } from 'react';

export type AddressResult = {
  street: string;
  city: string;
  county: string;
  postcode: string;
};

type PostcodeLookupProps = {
  postcode: string;
  onPostcodeChange: (value: string) => void;
  onSelect: (address: AddressResult) => void;
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  buttonText?: string;
};

// ── Quota-saving helpers ───────────────────────────────────────────────────
// Homedata bills per lookup, so we never fire a call unless the postcode is a
// valid UK format, and we cache every result (including "no results") for the
// browsing session so the same postcode is never charged twice.

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

function normalizePostcode(pc: string): string {
  const s = pc.replace(/\s+/g, '').toUpperCase();
  if (s.length < 5) return s;
  return `${s.slice(0, -3)} ${s.slice(-3)}`; // single space before the inward code
}

function isValidPostcode(pc: string): boolean {
  return UK_POSTCODE.test(pc.replace(/\s+/g, '').toUpperCase());
}

// Two-layer cache: an in-memory Map (survives client-side navigation between
// forms) backed by sessionStorage (survives a page refresh, cleared when the
// tab closes). Keyed by the normalised postcode.
const memCache = new Map<string, AddressResult[]>();
const CACHE_PREFIX = 'hol_addr_';

function readCache(key: string): AddressResult[] | null {
  if (memCache.has(key)) return memCache.get(key)!;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as AddressResult[];
      memCache.set(key, parsed);
      return parsed;
    }
  } catch {
    /* sessionStorage unavailable, fall back to memory only */
  }
  return null;
}

function writeCache(key: string, value: AddressResult[]): void {
  memCache.set(key, value);
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota/availability errors, memory cache still applies */
  }
}

export default function PostcodeLookup({
  postcode,
  onPostcodeChange,
  onSelect,
  inputStyle,
  inputClassName,
  placeholder,
  id,
  name,
  buttonText = 'Find Addresses',
}: PostcodeLookupProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A soft, non-alarming notice (e.g. address search temporarily unavailable),
  // shown in amber rather than red, guiding the visitor to type the address.
  const [notice, setNotice] = useState<string | null>(null);

  const applyResult = (list: AddressResult[]) => {
    setNotice(null);
    if (list.length === 0) {
      setError('No addresses found for this postcode. Please enter it manually below.');
      setAddresses([]);
      setShowDropdown(false);
    } else {
      setError(null);
      setAddresses(list);
      setShowDropdown(true);
    }
  };

  const handleFindAddresses = async () => {
    if (loading) return; // ignore rapid double-clicks

    const raw = postcode.trim();
    if (!isValidPostcode(raw)) {
      setError('Enter a full UK postcode, e.g. LS1 4DY.');
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    const key = normalizePostcode(raw);

    // Already showing this postcode's results, just reopen, no call.
    if (lastKeyRef.current === key && addresses.length > 0) {
      setShowDropdown(true);
      return;
    }

    // Cache hit, no API call is made.
    const cached = readCache(key);
    if (cached) {
      lastKeyRef.current = key;
      applyResult(cached);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    setAddresses([]);

    try {
      const response = await fetch(`/api/address-lookup?postcode=${encodeURIComponent(key)}`);
      const data = (await response.json().catch(() => ({}))) as {
        addresses?: AddressResult[];
        unavailable?: boolean;
        partial?: boolean;
      };
      // Service unavailable (quota reached / upstream outage): don't block the
      // form. Invite manual entry with a soft amber notice, and don't cache so
      // the lookup works again once the service recovers.
      if (!response.ok || data.unavailable) {
        setNotice('Address search is temporarily unavailable. Please type your address in the field below.');
        setAddresses([]);
        setShowDropdown(false);
        return;
      }
      const list = data.addresses || [];
      writeCache(key, list); // cache even empty results to avoid re-charging
      lastKeyRef.current = key;
      // `partial` = a postcode-level match from the Google fallback (street +
      // town, not a full building list). Show it, but prompt for the number.
      if (data.partial && list.length > 0) {
        setError(null);
        setAddresses(list);
        setShowDropdown(true);
        setNotice('Select the street to fill the town and postcode, then add your house or flat number.');
      } else {
        applyResult(list);
      }
    } catch {
      // Network error reaching our own route: same graceful fallback.
      setNotice('Address search is temporarily unavailable. Please type your address in the field below.');
      setAddresses([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: AddressResult) => {
    onSelect(address);
    setShowDropdown(false);
    setAddresses([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFindAddresses();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          className={inputClassName}
          style={{ ...inputStyle, flex: 1 }}
          value={postcode}
          placeholder={placeholder || 'e.g. LS1 1AA'}
          autoComplete="off"
          onChange={(e) => {
            onPostcodeChange(e.target.value);
            setShowDropdown(false);
            setError(null);
            setNotice(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleFindAddresses}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Loading...' : buttonText}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {notice}
        </div>
      )}

      {showDropdown && addresses.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            marginTop: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: 240,
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {addresses.map((addr, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectAddress(addr)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 14px',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: '#1f2937',
                borderBottom: idx < addresses.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{addr.street || addr.city || addr.postcode}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {[addr.street ? addr.city : '', addr.county, addr.postcode].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
