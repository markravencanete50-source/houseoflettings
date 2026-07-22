'use client';
// components/landlord/PasswordInput.tsx
// A password field with a show/hide eye toggle. Used across the landlord login,
// activation, and password-change forms so people can confirm what they typed.
import { useState } from 'react';

export function PasswordInput({
  value, onChange, placeholder, autoComplete, className, required, style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  required?: boolean;
  style?: React.CSSProperties;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        className={className}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        style={{ paddingRight: 46, marginBottom: 0, width: '100%', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 10, top: 0, bottom: 0, margin: 'auto',
          height: 30, width: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a94a3', fontSize: 17, padding: 0, lineHeight: 1,
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
