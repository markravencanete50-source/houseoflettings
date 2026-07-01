'use client';

import { useEffect, useRef } from 'react';

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
};

// Load the Google Maps Places script once per page.
function loadGooglePlaces() {
  if (typeof window === 'undefined') return;
  if ((window as any).google?.maps?.places) return;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return;
  if (document.querySelector('script[data-hol-gmaps]')) return;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  (script as any).dataset.holGmaps = '1';
  document.head.appendChild(script);
}

/**
 * UK postcode field backed by Google Places autocomplete. The user starts
 * typing a postcode (or address), picks a suggestion, and `onSelect` fires
 * with the parsed first line, town/city, county and postcode. Works inside
 * modals too — the effect binds when the component mounts.
 */
export default function PostcodeLookup({
  postcode,
  onPostcodeChange,
  onSelect,
  inputStyle,
  inputClassName,
  placeholder,
  id,
  name,
}: PostcodeLookupProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGooglePlaces();

    let ac: any = null;
    let listener: any = null;
    let interval: any = null;

    function init() {
      if (!inputRef.current || !(window as any).google?.maps?.places) return;
      ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        // 'geocode' (not 'address') so postcode-only predictions show up too.
        types: ['geocode'],
        componentRestrictions: { country: 'gb' },
        fields: ['address_components'],
      });
      listener = ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place?.address_components) return;
        let streetNumber = '', route = '', city = '', county = '', pc = '';
        place.address_components.forEach((c: any) => {
          if (c.types.includes('street_number')) streetNumber = c.long_name;
          if (c.types.includes('route')) route = c.long_name;
          if (c.types.includes('postal_town') || c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('administrative_area_level_2')) county = c.long_name;
          if (c.types.includes('postal_code')) pc = c.long_name;
        });
        onSelect({
          street: [streetNumber, route].filter(Boolean).join(' '),
          city,
          county,
          postcode: pc,
        });
      });
    }

    if ((window as any).google?.maps?.places) {
      init();
    } else {
      interval = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(interval);
          interval = null;
          init();
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (listener) (window as any).google?.maps?.event.removeListener(listener);
    };
  }, [onSelect]);

  return (
    <>
      {/* Keep Google's suggestion dropdown above modal overlays */}
      <style>{`.pac-container{z-index:100000!important;}`}</style>
      <input
        ref={inputRef}
        id={id}
        name={name}
        className={inputClassName}
        style={inputStyle}
        value={postcode}
        placeholder={placeholder || 'e.g. LS1 1AA'}
        autoComplete="off"
        onChange={(e) => onPostcodeChange(e.target.value)}
      />
    </>
  );
}
