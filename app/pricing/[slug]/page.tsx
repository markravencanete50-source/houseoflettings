// app/pricing/[slug]/page.tsx
// Individual package detail page. One per bundle (5 total), reached from the
// pricing page and indexable in its own right. Redesigned layout: a two-column
// hero (copy + property photo card with a floating price chip), a 3-stat strip,
// then every included service shown as its own bordered card with an icon and a
// plain-English explanation (grouped by category), followed by what is not
// included, the other packages, and a closing CTA. Server component for SEO;
// styling lives in page.module.css (a CSS Module, so it survives the production
// build — an inline <style> in a Server Component gets hoisted away by React).
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BUNDLES } from '@/lib/bundles';
import { MATRIX_SECTIONS, TOTAL_SERVICES } from '@/lib/pricingMatrix';
import { describeService } from '@/lib/serviceDescriptions';
import NotIncludedChips from '@/components/pricing/NotIncludedChips';
import styles from './page.module.css';

export function generateStaticParams() {
  return BUNDLES.map((b) => ({ slug: b.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const b = BUNDLES.find((x) => x.id === params.slug);
  if (!b) return { title: 'Package not found | House of Lettings' };
  const price = b.mgmtFee
    ? `${b.mgmtFee} management fees, plus ${b.setupFee} set up fees`
    : `${b.setupFee} set up fees, no management fees`;
  return {
    title: `${b.label} | Landlord Package | House of Lettings`,
    description: `${b.label}: ${price}, inclusive of VAT. See every service included and what each one means for landlords in Leeds and Manchester.`,
    alternates: { canonical: `/pricing/${b.id}` },
  };
}

/* ── Service icons ────────────────────────────────────────────────────────
   Every service gets its OWN icon, mapped from its exact label in
   lib/pricingMatrix.ts. This used to guess by keyword, which collapsed ten
   different services onto one wrench (every label containing "maintenance",
   "repair" or "contractor") and eight onto one document.

   Paths are Lucide's (ISC), inlined rather than imported from lucide-react so
   the grid stays plain server-rendered SVG with no client JS. To add a service:
   add its exact label to SERVICE_ICONS, and its paths to ICON_PATHS if the icon
   is not already here. ICON_KEYWORDS is only a fallback for a label we have not
   mapped yet. */
type IconKey = keyof typeof ICON_PATHS;

const ICON_PATHS = {
  'activity': <><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></>,
  'badge-check': <><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></>,
  'banknote': <><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>,
  'bell-ring': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /><path d="M4 2C2.8 3.7 2 5.7 2 8" /><path d="M22 8c0-2.3-.8-4.3-2-6" /></>,
  'briefcase': <><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></>,
  'calendar-check': <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
  'calendar-clock': <><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h5" /><path d="M17.5 17.5 16 16.3V14" /><circle cx="16" cy="16" r="6" /></>,
  'camera': <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
  'clipboard-check': <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>,
  'clipboard-list': <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></>,
  'clipboard-pen': <><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M10.4 12.6a2 2 0 0 1 3 3L8 21l-4 1 1-4Z" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5" /><path d="M4 13.5V6a2 2 0 0 1 2-2h2" /></>,
  'contact': <><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" /><rect width="18" height="18" x="3" y="4" rx="2" /><circle cx="12" cy="10" r="2" /><line x1="8" x2="8" y1="2" y2="4" /><line x1="16" x2="16" y1="2" y2="4" /></>,
  'door-open': <><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path d="M13 20h9" /><path d="M10 12v.01" /><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" /></>,
  'file-badge': <><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M7 16.5 8 22l-3-1-3 1 1-5.5" /></>,
  'file-check': <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m9 15 2 2 4-4" /></>,
  'file-clock': <><path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><circle cx="8" cy="16" r="6" /><path d="M9.5 17.5 8 16.25V14" /></>,
  'file-spreadsheet': <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" /></>,
  'gantt-chart': <><path d="M8 6h10" /><path d="M6 12h9" /><path d="M11 18h7" /></>,
  'gauge': <><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></>,
  'hand-coins': <><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" /><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 16 6 6" /><circle cx="16" cy="9" r="2.9" /><circle cx="6" cy="5" r="3" /></>,
  'hard-hat': <><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" /><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" /><path d="M4 15v-3a6 6 0 0 1 6-6h0" /><path d="M14 6h0a6 6 0 0 1 6 6v3" /></>,
  'images': <><path d="M18 22H4a2 2 0 0 1-2-2V6" /><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" /><circle cx="12" cy="8" r="2" /><rect width="16" height="16" x="6" y="2" rx="2" /></>,
  'inbox': <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  'key-round': <><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" /><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /></>,
  'landmark': <><line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" /></>,
  'layout-grid': <><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>,
  'line-chart': <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
  'megaphone': <><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
  'message-square-quote': <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 12a2 2 0 0 0 2-2V8H8" /><path d="M14 12a2 2 0 0 0 2-2V8h-2" /></>,
  'messages-square': <><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z" /><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" /></>,
  'package-check': <><path d="m16 16 2 2 4-4" /><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" /><path d="m7.5 4.27 9 5.15" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></>,
  'pie-chart': <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>,
  'receipt': <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></>,
  'receipt-text': <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M14 8H8" /><path d="M16 12H8" /><path d="M13 16H8" /></>,
  'refresh-cw': <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  'scale': <><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
  'scan-search': <><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /><path d="m16 16-1.9-1.9" /></>,
  'scroll-text': <><path d="M15 12h-5" /><path d="M15 8h-5" /><path d="M19 17V5a2 2 0 0 0-2-2H4" /><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" /></>,
  'search-check': <><path d="m8 11 2 2 4-4" /><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  'shield-check': <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  'siren': <><path d="M7 18v-6a5 5 0 1 1 10 0v6" /><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" /><path d="M21 12h1" /><path d="M18.5 4.5 18 5" /><path d="M2 12h1" /><path d="M12 2v1" /><path d="m4.929 4.929.707.707" /><path d="M12 12v6" /></>,
  'thumbs-up': <><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></>,
  'timer': <><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></>,
  'trending-up': <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  'umbrella': <><path d="M22 12a10.06 10.06 1 0 0-20 0Z" /><path d="M12 12v8a2 2 0 0 0 4 0" /><path d="M12 2v1" /></>,
  'user-check': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></>,
  'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'vault': <><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /><path d="m7.9 7.9 2.7 2.7" /><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" /><path d="m13.4 10.6 2.7-2.7" /><circle cx="7.5" cy="16.5" r=".5" fill="currentColor" /><path d="m7.9 16.1 2.7-2.7" /><circle cx="16.5" cy="16.5" r=".5" fill="currentColor" /><path d="m13.4 13.4 2.7 2.7" /><circle cx="12" cy="12" r="2" /></>,
  'wallet': <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>,
  'zap': <><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></>,
} as const;

// Exact service label -> icon. Labels must match lib/pricingMatrix.ts.
const SERVICE_ICONS: Record<string, IconKey> = {
  'Property Valuation': 'line-chart',
  'Professional Property Photography': 'camera',
  'Floor Plan': 'layout-grid',
  'Advertising on Major Property Portals': 'megaphone',
  'Enquiry Management & Applicant Screening': 'inbox',
  'Agent-Led (Accompanied) Property Viewings': 'door-open',
  'Viewing Feedback & Negotiation': 'message-square-quote',
  'Tenant Application Processing': 'clipboard-pen',
  'Collection of Holding Deposit': 'hand-coins',
  'Right to Rent Checks': 'contact',
  'Credit & Affordability Checks': 'gauge',
  'Employment & Landlord References': 'briefcase',
  'Guarantor Referencing (Where Applicable)': 'user-check',
  'Preparation of Tenancy Agreement': 'scroll-text',
  'Collection of First Month\'s Rent & Deposit': 'banknote',
  'Utility & Council Tax Notifications': 'zap',
  'Tenant Handover & Property Demonstration': 'key-round',
  'Transfer of Funds to the Landlord': 'landmark',
  'Key Holding & Management Service': 'vault',
  'Deposit Registration & Prescribed Information': 'file-badge',
  'Compliance Monitoring (Gas Safety, EICR, EPC)': 'shield-check',
  'Monthly Rent Collection': 'wallet',
  'Monthly Landlord Statements': 'file-spreadsheet',
  'Rent Payment Monitoring': 'activity',
  'Annual Rental Income Summary': 'pie-chart',
  'Rent Review Guidance': 'trending-up',
  'Arrears Chasing & Reminders': 'bell-ring',
  'Tenancy Continuation & Re-Marketing Management': 'refresh-cw',
  'End-of-Tenancy Administration': 'file-check',
  'Day-to-Day Tenant Communication': 'messages-square',
  'Dedicated Property Management Team': 'users',
  'Contractor Coordination': 'hard-hat',
  'Repair Quotation Management': 'receipt',
  'Emergency Maintenance Support': 'siren',
  'Maintenance Issue Assessment': 'search-check',
  'Landlord Maintenance Authorisation': 'thumbs-up',
  'Maintenance Progress Updates': 'gantt-chart',
  'Before & After Maintenance Reports': 'images',
  'Detailed Maintenance Reporting': 'clipboard-list',
  'Repair Completion Verification': 'badge-check',
  'Contractor Invoice Verification': 'receipt-text',
  'Check In & Check Out Inventory': 'package-check',
  'Gas Safety, EICR & EPC Compliance Tracking': 'file-clock',
  'Annual Property Maintenance Schedule & Reminders': 'calendar-check',
  'Rent Recovery & Legal / Eviction Protection': 'scale',
  'Rent Guarantee Cover': 'umbrella',
  'Priority Contractor Response': 'timer',
  'Enhanced Periodic Property Inspections': 'scan-search',
  'Property Inspections with Report': 'clipboard-check',
  'Routine Inspection Every 6 Months': 'calendar-clock',
};

// Fallback only: used when a label is not in SERVICE_ICONS (e.g. a new service
// added to the matrix but not mapped here yet), so a card never renders blank.
const ICON_KEYWORDS: [string, IconKey][] = [
  ['photograph', 'camera'],
  ['floor plan', 'layout-grid'],
  ['valuation', 'line-chart'],
  ['advertis', 'megaphone'],
  ['portal', 'megaphone'],
  ['viewing', 'door-open'],
  ['inventory', 'package-check'],
  ['inspection', 'clipboard-check'],
  ['emergency', 'siren'],
  ['contractor', 'hard-hat'],
  ['quotation', 'receipt'],
  ['invoice', 'receipt-text'],
  ['maintenance', 'gantt-chart'],
  ['repair', 'badge-check'],
  ['legal', 'scale'],
  ['eviction', 'scale'],
  ['guarantee', 'umbrella'],
  ['compliance', 'shield-check'],
  ['deposit', 'file-badge'],
  ['rent', 'wallet'],
  ['reference', 'briefcase'],
  ['agreement', 'scroll-text'],
  ['statement', 'file-spreadsheet'],
  ['report', 'clipboard-list'],
  ['key', 'key-round'],
];

function iconKeyFor(label: string): IconKey {
  const exact = SERVICE_ICONS[label];
  if (exact) return exact;
  const l = label.toLowerCase();
  for (const [kw, key] of ICON_KEYWORDS) if (l.includes(kw)) return key;
  return 'badge-check';
}

function ServiceIcon({ label }: { label: string }) {
  return (
    <span className={styles.cardIcon} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICON_PATHS[iconKeyFor(label)]}
      </svg>
    </span>
  );
}

export default function PackageDetailPage({ params }: { params: { slug: string } }) {
  const idx = BUNDLES.findIndex((b) => b.id === params.slug);
  if (idx === -1) notFound();
  const bundle = BUNDLES[idx];
  const isHot = !!bundle.badge;

  // Split every service into included / not included for this tier.
  const sections = MATRIX_SECTIONS.map((s) => ({
    title: s.title,
    total: s.rows.length,
    included: s.rows.filter((r) => !!r[idx + 1]).map((r) => r[0] as string),
    excluded: s.rows.filter((r) => !r[idx + 1]).map((r) => r[0] as string),
  }));
  const totalIncluded = sections.reduce((n, s) => n + s.included.length, 0);
  const excludedAll = sections.flatMap((s) => s.excluded);
  const withServices = sections.filter((s) => s.included.length > 0);

  return (
    <>
      <Navbar />

      <div className={styles.page}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className={`${styles.hero}${isHot ? ` ${styles.heroHot}` : ''}`}>
          <span className={styles.orb} aria-hidden />
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              {/* Copy */}
              <div className={styles.heroText}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                  <Link href="/">Home</Link>
                  <span className={styles.sep}>/</span>
                  <Link href="/pricing">Pricing</Link>
                  <span className={styles.sep}>/</span>
                  <span className={styles.here}>{bundle.label}</span>
                </nav>
                <div className={styles.eyebrow}>
                  {bundle.kind}
                  {bundle.badge && <span className={styles.pop}>Most Popular</span>}
                </div>
                <h1 className={styles.title}>{bundle.label}</h1>
                <p className={styles.best}>Best for {bundle.bestForLead} {bundle.bestForRest}.</p>

                {/* The ongoing percentage leads: it is our main management fee.
                    Tenant-find packages have no percentage, so the one-time fee
                    leads there instead. */}
                <div className={styles.priceRow}>
                  {bundle.mgmtFee ? (
                    <>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Management fees</span>
                        <span className={styles.priceVal}>{bundle.mgmtFee}</span>
                      </div>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Set up fees</span>
                        <span className={styles.priceVal}>{bundle.setupFee}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Set up fees</span>
                        <span className={styles.priceVal}>{bundle.setupFee}</span>
                      </div>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Management fees</span>
                        <span className={styles.priceVal}>None</span>
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.cta}>
                  <Link href="/book-valuation" className={`${styles.btn} ${styles.btnSolid}`}>Book a free valuation</Link>
                  <Link href="/landlord-registration" className={`${styles.btn} ${styles.btnGhost}`}>Get started</Link>
                </div>
              </div>

              {/* Property photo card */}
              <div className={styles.heroMedia}>
                <div className={styles.heroImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.heroImg}
                    src={bundle.image}
                    alt={bundle.imageAlt}
                    loading="eager"
                  />
                </div>
                <div className={styles.priceFloat}>
                  {bundle.mgmtFee ? (
                    <>
                      <span className={styles.priceFloatLabel}>Management fees</span>
                      <span className={styles.priceFloatVal}>{bundle.mgmtFee}</span>
                      <span className={styles.priceFloatSub}><b>{bundle.setupFee}</b> set up fees · inc. VAT</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.priceFloatLabel}>Set up fees</span>
                      <span className={styles.priceFloatVal}>{bundle.setupFee}</span>
                      <span className={styles.priceFloatSub}>No management fees · inc. VAT</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat strip (overlaps hero) ───────────────────── */}
        <div className={styles.container}>
          <div className={styles.statsWrap}>
            <div className={styles.stats}>
              {bundle.mgmtFee ? (
                <>
                  <div className={styles.stat}>
                    <span className={styles.statK}>{bundle.mgmtFee}</span>
                    <span className={styles.statV}>Management fees, on rent collected</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statK}>{bundle.setupFee}</span>
                    <span className={styles.statV}>Set up fees</span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.stat}>
                    <span className={styles.statK}>{bundle.setupFee}</span>
                    <span className={styles.statV}>Set up fees</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statK}>£0</span>
                    <span className={styles.statV}>No management fees</span>
                  </div>
                </>
              )}
              <div className={styles.stat}>
                {/* A count, not a price, so it keeps the navy rather than the green. */}
                <span className={`${styles.statK} ${styles.statKPlain}`}>{totalIncluded}<small> / {TOTAL_SERVICES}</small></span>
                <span className={styles.statV}>Services included</span>
              </div>
            </div>
            <p className={styles.statTrust}>
              <span><b>✓</b> Inclusive of VAT</span>
              <span><b>✓</b> No hidden fees</span>
              <span><b>✓</b> Leeds &amp; Manchester</span>
            </p>
          </div>
        </div>

        {/* ── Included services, as bordered cards by category ─ */}
        <div className={styles.container}>
          <section className={styles.svc}>
            <div className={styles.svcHead}>
              <span className={styles.svcEyebrow}>What&apos;s included</span>
              <h2 className={styles.svcTitle}>Everything in {bundle.label}</h2>
              <p className={styles.svcIntro}>{bundle.blurb}</p>
            </div>

            {withServices.map((s, i) => (
              <div key={s.title} className={styles.cat}>
                <div className={styles.catHead}>
                  <span className={styles.catNum}>{i + 1}</span>
                  <h3 className={styles.catTitle}>{s.title}</h3>
                  <span className={styles.catCount}>{s.included.length} included</span>
                </div>
                <div className={styles.cards}>
                  {s.included.map((label) => (
                    <article key={label} className={styles.card}>
                      <ServiceIcon label={label} />
                      <h4 className={styles.cardTitle}>{label}</h4>
                      <p className={styles.cardDesc}>{describeService(label)}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* ── Not included ─────────────────────────────────── */}
        {excludedAll.length > 0 && (
          <div className={styles.container}>
            <div className={styles.notWrap}>
              <div className={styles.not}>
                <h2 className={styles.notHead}>Not included in this package</h2>
                <p className={styles.notSub}>Want any of these? Compare packages or move up a tier at any time, with no re-setup charge.</p>
                <NotIncludedChips items={excludedAll} initial={5} />
                <Link href="/pricing#compare" className={styles.upgrade}>Compare all packages →</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Other packages ───────────────────────────────── */}
        <div className={styles.container}>
          <section className={styles.others}>
            <h2 className={styles.othersHead}>Explore the other packages</h2>
            <div className={styles.othersGrid}>
              {BUNDLES.map((b) => {
                const current = b.id === bundle.id;
                return (
                  <Link
                    key={b.id}
                    href={`/pricing/${b.id}`}
                    className={`${styles.other}${current ? ` ${styles.otherCurrent}` : ''}`}
                    aria-current={current ? 'page' : undefined}
                  >
                    <span className={styles.otherKind}>{b.kind}</span>
                    <span className={styles.otherName}>{b.label}</span>
                    <span className={styles.otherFee}>{b.setupFee}{b.mgmtFee ? ` + ${b.mgmtFee}` : ''}</span>
                    {current && <span className={styles.otherBadge}>You are here</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Closing CTA band ─────────────────────────────── */}
        <section className={styles.ctaBand}>
          <div className={styles.container}>
            <div className={styles.ctaInner}>
              <div>
                <h2 className={styles.ctaHead}>Ready to get started with {bundle.label}?</h2>
                <p className={styles.ctaSub}>Book a free, no-obligation valuation and we&apos;ll confirm the right setup for your property across Leeds and Manchester.</p>
              </div>
              <div className={styles.ctaBtns}>
                <Link href="/book-valuation" className={`${styles.ctaBtn} ${styles.ctaBtnSolid}`}>Book a free valuation</Link>
                <Link href="/landlord-registration" className={`${styles.ctaBtn} ${styles.ctaBtnGhost}`}>Register as a landlord</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
