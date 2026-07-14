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
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindAddresses = async () => {
    const pc = postcode.trim();
    if (!pc || pc.length < 3) {
      setError('Please enter a valid postcode.');
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAddresses([]);

    try {
      const response = await fetch(`/api/address-lookup?postcode=${encodeURIComponent(pc)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch addresses.');
      }
      const data = (await response.json()) as { addresses: AddressResult[] };
      if (data.addresses.length === 0) {
        setError('No addresses found for this postcode.');
        setAddresses([]);
        setShowDropdown(false);
      } else {
        setAddresses(data.addresses);
        setShowDropdown(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
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
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{addr.street}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {[addr.city, addr.county, addr.postcode].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
