'use client';

import { useState } from 'react';

export type AddressResult = {
  street: string;
  city: string;
  county: string;
  postcode: string;
};

type FoundAddress = {
  line1: string;
  line2: string;
  townOrCity: string;
  county: string;
  postcode: string;
};

type PostcodeLookupProps = {
  postcode: string;
  onPostcodeChange: (value: string) => void;
  onSelect: (address: AddressResult) => void;
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
  selectClassName?: string;
  placeholder?: string;
  id?: string;
  name?: string;
};

/**
 * UK postcode lookup: type a postcode, fetch every address registered at it,
 * and pick the correct one from a dropdown of first lines (getAddress.io Find API).
 */
export default function PostcodeLookup({
  postcode,
  onPostcodeChange,
  onSelect,
  inputStyle,
  inputClassName,
  selectClassName,
  placeholder,
  id,
  name,
}: PostcodeLookupProps) {
  const [addresses, setAddresses] = useState<FoundAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runLookup = async () => {
    const query = postcode.trim();
    if (!query) return;
    setLoading(true);
    setError('');
    setAddresses([]);
    try {
      const res = await fetch(`/api/postcode-lookup?postcode=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not look up that postcode.');
      if (!data.addresses?.length) {
        setError('No addresses found for that postcode. Please check it and try again.');
      } else {
        setAddresses(data.addresses);
      }
    } catch (err: any) {
      setError(err.message || 'Could not look up that postcode.');
    } finally {
      setLoading(false);
    }
  };

  const pick = (index: number) => {
    const a = addresses[index];
    if (!a) return;
    onSelect({
      street: [a.line1, a.line2].filter(Boolean).join(', '),
      city: a.townOrCity,
      county: a.county,
      postcode: a.postcode,
    });
    setAddresses([]);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id={id}
          name={name}
          className={inputClassName}
          style={{ ...inputStyle, flex: 1 }}
          value={postcode}
          placeholder={placeholder || 'e.g. LS1 1AA'}
          autoComplete="off"
          onChange={(e) => {
            onPostcodeChange(e.target.value);
            setAddresses([]);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runLookup();
            }
          }}
        />
        <button
          type="button"
          onClick={runLookup}
          disabled={loading || !postcode.trim()}
          style={{
            flexShrink: 0,
            padding: '0 18px',
            borderRadius: 8,
            border: 'none',
            background: loading ? '#93c5fd' : '#1e3a5f',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: loading || !postcode.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Searching…' : 'Find address'}
        </button>
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: 12.5, margin: '6px 0 0' }}>{error}</p>}
      {addresses.length > 0 && (
        <select
          defaultValue=""
          className={selectClassName ?? inputClassName}
          onChange={(e) => pick(Number(e.target.value))}
          style={{ ...inputStyle, marginTop: 8, cursor: 'pointer', width: '100%' }}
        >
          <option value="" disabled>
            {addresses.length} address{addresses.length > 1 ? 'es' : ''} found — select yours…
          </option>
          {addresses.map((a, i) => (
            <option key={i} value={i}>
              {[a.line1, a.townOrCity].filter(Boolean).join(', ')}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
