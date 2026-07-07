// lib/bundles.ts
// Single source of truth for the service bundles offered by House of Lettings.
// Each bundle pairs a management tier (Full 8% / Comprehensive 10%) with a
// tenant-find tier (Virtual £499 / Expert £599). Inclusions are the MERGED
// feature sets of both components.

// ── Component feature sets ─────────────────────────────────────────────
export const TENANT_FIND_VIRTUAL = [
  'Collection of holding deposit',
  'Right to Rent checks',
  'Tenant application processing',
  'Credit and affordability checks',
  'Employment and landlord references',
  'Guarantor referencing (where applicable)',
  'Preparation of tenancy agreement',
  "Collection of first month's rent and tenancy deposit",
  'Deposit registration and prescribed information',
  'Utility and council tax notifications',
  'Landlord tenancy documentation pack',
  'Transfer of funds to the landlord',
];

// Expert = everything in Virtual, plus agent-led marketing & viewings.
export const TENANT_FIND_EXPERT = [
  ...TENANT_FIND_VIRTUAL,
  'Professional property photography',
  'Advertising on major property portals',
  'Enquiry management and applicant screening',
  'Agent-led property viewings',
  'Viewing feedback and negotiation',
  'Tenant handover and key management',
];

// Full Management = ongoing rent collection + day-to-day management.
export const MANAGEMENT_FULL = [
  'Monthly rent collection',
  'Rent payment monitoring',
  'Arrears chasing and reminders',
  'Monthly landlord statements',
  'Annual rental income summary',
  'Rent review guidance',
  'Utility and compliance reminders',
  'Dedicated property management team',
  'Day-to-day tenant communication',
  'Maintenance reporting and contractor coordination',
  'Repair quotation management',
  'Emergency maintenance support',
  'Key holding service',
  'Compliance monitoring (Gas Safety, EICR, EPC)',
  'Tenancy continuation and re-marketing management',
  'End-of-tenancy administration',
  'Deposit negotiation assistance',
];

// Comprehensive = everything in Full, plus inventories & dispute support.
export const MANAGEMENT_COMPREHENSIVE = [
  ...MANAGEMENT_FULL,
  'Professional check-in inventory',
  'Professional check-out inventory',
  'Inventory comparison report',
  'Deposit deduction assessment and evidence preparation',
  'Contractor attendance coordination',
  'End-of-tenancy dispute preparation (if required)',
  'Priority management support',
];

// ── Bundles ────────────────────────────────────────────────────────────
export type Bundle = {
  id: string;
  label: string;      // full name, also stored as the chosen service
  short: string;      // compact name for tight spaces
  setupFee: string;   // one-time tenant-find fee, e.g. "£499"
  mgmtFee: string;    // monthly management fee, e.g. "8%"
  badge?: string;
  accent: string;     // radial background accent for the pricing hero panel
  blurb: string;
  groups: { heading: string; items: string[] }[];
};

export const BUNDLES: Bundle[] = [
  {
    id: 'full-virtual',
    label: 'Full Management + Virtual Tenant Find',
    short: 'Full + Virtual',
    setupFee: '£499',
    mgmtFee: '8%',
    accent: 'radial-gradient(ellipse at 20% 60%, rgba(37,99,235,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(15,31,61,0.4) 0%, transparent 60%)',
    blurb: 'Hands-off day-to-day management with online tenant finding: great value for hands-on landlords.',
    groups: [
      { heading: 'Virtual Tenant Find: £499 one-time', items: TENANT_FIND_VIRTUAL },
      { heading: 'Full Management: 8% per month', items: MANAGEMENT_FULL },
    ],
  },
  {
    id: 'full-expert',
    label: 'Full Management + Expert Tenant Find',
    short: 'Full + Expert',
    setupFee: '£599',
    mgmtFee: '8%',
    badge: 'Most Popular',
    accent: 'radial-gradient(ellipse at 70% 30%, rgba(37,99,235,0.22) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.12) 0%, transparent 50%)',
    blurb: 'Full management plus our agent-led marketing, photography and accompanied viewings.',
    groups: [
      { heading: 'Expert Tenant Find: £599 one-time', items: TENANT_FIND_EXPERT },
      { heading: 'Full Management: 8% per month', items: MANAGEMENT_FULL },
    ],
  },
  {
    id: 'comprehensive-virtual',
    label: 'Comprehensive Management + Virtual Tenant Find',
    short: 'Comprehensive + Virtual',
    setupFee: '£499',
    mgmtFee: '10%',
    accent: 'radial-gradient(ellipse at 10% 40%, rgba(99,37,235,0.16) 0%, transparent 55%), radial-gradient(ellipse at 85% 70%, rgba(37,99,235,0.14) 0%, transparent 50%)',
    blurb: 'Our most complete management, with inventories and dispute support, plus online tenant finding.',
    groups: [
      { heading: 'Virtual Tenant Find: £499 one-time', items: TENANT_FIND_VIRTUAL },
      { heading: 'Comprehensive Management: 10% per month', items: MANAGEMENT_COMPREHENSIVE },
    ],
  },
  {
    id: 'comprehensive-expert',
    label: 'Comprehensive Management + Expert Tenant Find',
    short: 'Comprehensive + Expert',
    setupFee: '£599',
    mgmtFee: '10%',
    badge: 'Most Complete',
    accent: 'radial-gradient(ellipse at 60% 20%, rgba(37,99,235,0.25) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(37,99,235,0.15) 0%, transparent 50%)',
    blurb: 'The complete package: agent-led tenant finding with our most thorough end-to-end management.',
    groups: [
      { heading: 'Expert Tenant Find: £599 one-time', items: TENANT_FIND_EXPERT },
      { heading: 'Comprehensive Management: 10% per month', items: MANAGEMENT_COMPREHENSIVE },
    ],
  },
];
