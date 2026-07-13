// lib/types.ts

export type UserRole = 'landlord' | 'tenant' | 'admin' | 'staff';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
}

export interface Property {
  id?: string;
  title: string;
  description: string;
  price: number;          // monthly rent in GBP
  location: string;
  bedrooms: number;       // 0 = studio
  bathrooms: number;
  sqft?: number;
  images: string[];       // Firebase Storage URLs
  landlordId: string;
  landlordName?: string;
  createdAt: Date;
  status: 'active' | 'inactive' | 'pending';
  badge?: string;         // 'Featured' | 'New' | 'Popular' | etc.
  featured?: boolean;
  letAgreed?: boolean;    // legacy flag, kept in sync with `availability` for the public site
  availability?: 'available' | 'pending' | 'let-agreed'; // listing state the admin controls
  furnished?: 'furnished' | 'unfurnished' | 'part-furnished';
  availableFrom?: string;

  // Listing type
  propertyType?: 'whole' | 'room';

  // Pricing
  depositAmount?: number;
  billsIncluded?: boolean;
  billsNote?: string;

  // Features & amenities
  parking?: 'none' | 'double-garage' | 'off-street' | 'residents' | 'single-garage' | 'underground' | 'communal-no-allocated' | 'disabled-available' | 'disabled-not-available' | 'driveway-private' | 'driveway-shared' | 'ev-private' | 'ev-shared' | 'garage' | 'garage-en-bloc' | 'garage-carport' | 'garage-detached' | 'garage-integral' | 'gated' | 'rear' | 'street-no-permit' | 'street-permit' | 'undercroft' | 'underground-allocated' | 'underground-no-allocated' | 'other';
  garden?: 'none' | 'private' | 'shared' | 'communal';
  balcony?: boolean;

  // Media
  videoTourUrl?: string;
}

export interface Chat {
  id?: string;
  propertyId: string;
  propertyTitle?: string;
  landlordId: string;
  tenantId: string;
  tenantName?: string;
  landlordName?: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

// Resolve a listing's availability, defaulting legacy docs (which only have the
// `letAgreed` boolean) so nothing needs a backfill.
export function propertyAvailability(
  p: Pick<Property, 'availability' | 'letAgreed'>
): 'available' | 'pending' | 'let-agreed' {
  return p.availability ?? (p.letAgreed ? 'let-agreed' : 'available');
}

export interface SearchFilters {
  location: string;
  minPrice: number | '';
  maxPrice: number | '';
  bedrooms: number | '';          // exact bedroom count (6 = "6 or more"; 0 = studio)
  bathrooms?: number | '';        // exact bathroom count (6 = "6 or more")
  propertyType?: '' | 'whole' | 'room';
  furnished?: '' | 'furnished' | 'unfurnished' | 'part-furnished';
  // Radius search (Rightmove/Zoopla style): when a location is picked from the
  // autocomplete we capture its coordinates; radiusMiles then limits results to
  // properties within that distance. Without coordinates the location falls back
  // to a plain text match.
  radiusMiles?: number | '';
  lat?: number | null;
  lng?: number | null;
}
