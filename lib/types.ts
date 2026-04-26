// lib/types.ts

export type UserRole = 'landlord' | 'tenant' | 'admin';

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
  badge?: string;    // 'Featured' | 'New' | 'Popular' | etc.
featured?: boolean;
  furnished?: 'furnished' | 'unfurnished' | 'part-furnished';
  availableFrom?: string;
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

export interface SearchFilters {
  location: string;
  minPrice: number | '';
  maxPrice: number | '';
  bedrooms: number | '';
}
