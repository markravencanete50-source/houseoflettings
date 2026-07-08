// lib/bundles.ts
// Single source of truth for the packages offered by House of Lettings.
// Five standalone tiers: two one-time Tenant-Find options and three ongoing
// Management tiers (Essential 6% / Full 8% / Comprehensive 10%). Each management
// tier already includes a full tenant find. Consumed by /pricing (chooser cards +
// Get Started modal) and the landlord-registration pages.

// ── Component feature sets ─────────────────────────────────────────────
export const TENANT_FIND_VIRTUAL = [
  'Property valuation',
  'Advertising on major property portals',
  'Enquiry management and applicant screening',
  'Right to Rent checks',
  'Credit and affordability checks',
  'Employment and landlord references',
  'Guarantor referencing (where applicable)',
  'Preparation of tenancy agreement',
  "Collection of first month's rent and tenancy deposit",
  'Deposit registration and prescribed information',
  'Utility and council tax notifications',
  'Transfer of funds to the landlord',
];

// Expert = everything in Virtual, plus agent-led marketing, photography & viewings.
export const TENANT_FIND_EXPERT = [
  ...TENANT_FIND_VIRTUAL,
  'Professional property photography',
  'Floor plan',
  'Agent-led (accompanied) property viewings',
  'Viewing feedback and negotiation',
  'Tenant handover and property demonstration',
];

// Essential Management = light-touch rent handling, landlord keeps maintenance.
export const MANAGEMENT_ESSENTIAL = [
  'Everything in a full tenant find',
  'Monthly rent collection',
  'Rent payment monitoring',
  'Arrears chasing and reminders',
  'Annual rental income summary',
  'Key holding and management service',
  'End-of-tenancy administration',
];

// Full Management = truly hands-off day-to-day management.
export const MANAGEMENT_FULL = [
  ...MANAGEMENT_ESSENTIAL,
  'Dedicated property management team',
  'Day-to-day tenant communication',
  'Maintenance reporting and contractor coordination',
  'Repair quotation and completion verification',
  'Emergency maintenance support',
  'Compliance monitoring (Gas Safety, EICR, EPC)',
  'Monthly landlord statements',
  'Rent review guidance',
  'Property inspections with report',
];

// Comprehensive = everything in Full, plus income protection & legal cover.
export const MANAGEMENT_COMPREHENSIVE = [
  ...MANAGEMENT_FULL,
  'Rent guarantee cover',
  'Rent recovery, legal and eviction protection',
  'Priority contractor response',
  'Enhanced periodic property inspections',
  'Gas Safety, EICR and EPC compliance tracking',
];

// ── Tier model ─────────────────────────────────────────────────────────
export type Bundle = {
  id: string;
  label: string;      // full name, also stored as the chosen service on registration
  short: string;      // compact name for tight spaces
  kind: 'Tenant Find' | 'Management';
  setupFee: string;   // one-time fee, e.g. "£399"
  mgmtFee: string;    // ongoing % ("6%") or "" when there is no ongoing fee
  ongoing: string;    // display line, e.g. "No ongoing fee" | "then 6% of rent"
  badge?: string;
  bestForLead: string;   // emphasised phrase in the "Best for" line
  bestForRest: string;   // remainder of the "Best for" line
  youWe: string;         // who-does-what tag, e.g. "You manage · we find"
  accent: string;        // radial background accent for the pricing hero panel
  blurb: string;
  groups: { heading: string; items: string[] }[];
};

const ACCENT_BLUE =
  'radial-gradient(ellipse at 70% 30%, rgba(37,99,235,0.22) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.12) 0%, transparent 50%)';
const ACCENT_SOFT =
  'radial-gradient(ellipse at 20% 60%, rgba(37,99,235,0.16) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(15,31,61,0.4) 0%, transparent 60%)';

export const BUNDLES: Bundle[] = [
  {
    id: 'virtual-tenant-find',
    label: 'Virtual Tenant Find',
    short: 'Virtual Find',
    kind: 'Tenant Find',
    setupFee: '£399',
    mgmtFee: '',
    ongoing: 'No ongoing fee',
    bestForLead: 'hands-on landlords',
    bestForRest: 'who live near the property',
    youWe: 'You manage · we find',
    accent: ACCENT_SOFT,
    blurb:
      'You have the time to run the tenancy and handle maintenance yourself — you just need a quality, fully-referenced tenant found quickly. We market, vet and reference it all remotely, then hand you a signed tenancy agreement.',
    groups: [{ heading: 'Virtual Tenant Find: £399 one-time', items: TENANT_FIND_VIRTUAL }],
  },
  {
    id: 'expert-tenant-find',
    label: 'Expert Tenant Find',
    short: 'Expert Find',
    kind: 'Tenant Find',
    setupFee: '£699',
    mgmtFee: '',
    ongoing: 'No ongoing fee',
    bestForLead: 'landlords who want',
    bestForRest: 'the best tenant at the best rent',
    youWe: 'You manage · we showcase',
    accent: ACCENT_SOFT,
    blurb:
      'Everything in Virtual, plus professional photography, accompanied viewings and a full in-person handover — the complete marketing push to attract stronger applicants and achieve a higher rent. You still self-manage the tenancy.',
    groups: [{ heading: 'Expert Tenant Find: £699 one-time', items: TENANT_FIND_EXPERT }],
  },
  {
    id: 'essential-management',
    label: 'Essential Management',
    short: 'Essential',
    kind: 'Management',
    setupFee: '£199',
    mgmtFee: '6%',
    ongoing: 'then 6% of rent',
    bestForLead: 'landlords who want rent handled',
    bestForRest: 'but keep maintenance',
    youWe: 'We collect · you maintain',
    accent: ACCENT_SOFT,
    blurb:
      'We collect the rent, monitor payments, chase any arrears and handle the monthly admin — you stay in control of repairs and choosing contractors. A light-touch option for confident landlords.',
    groups: [
      { heading: 'Includes a full tenant find', items: TENANT_FIND_VIRTUAL },
      { heading: 'Essential Management: 6% per month', items: MANAGEMENT_ESSENTIAL },
    ],
  },
  {
    id: 'full-management',
    label: 'Full Management',
    short: 'Full',
    kind: 'Management',
    setupFee: '£399',
    mgmtFee: '8%',
    ongoing: 'then 8% of rent',
    badge: 'Most Popular',
    bestForLead: 'landlords who want it',
    bestForRest: 'fully off their plate',
    youWe: 'We manage everything',
    accent: ACCENT_BLUE,
    blurb:
      'Rent, tenant communication, maintenance, contractor coordination and compliance — all managed by your local team. The truly hands-off choice, and by far our most popular package.',
    groups: [
      { heading: 'Includes a full tenant find', items: TENANT_FIND_EXPERT },
      { heading: 'Full Management: 8% per month', items: MANAGEMENT_FULL },
    ],
  },
  {
    id: 'comprehensive-management',
    label: 'Comprehensive Management',
    short: 'Comprehensive',
    kind: 'Management',
    setupFee: '£399',
    mgmtFee: '10%',
    ongoing: 'then 10% of rent',
    bestForLead: 'landlords who want',
    bestForRest: 'maximum protection',
    youWe: 'We manage & protect',
    accent: ACCENT_BLUE,
    blurb:
      'Everything in Full, plus rent guarantee cover, legal & eviction protection, priority contractor response and enhanced inspections. Complete peace of mind, with your rental income protected.',
    groups: [
      { heading: 'Includes a full tenant find', items: TENANT_FIND_EXPERT },
      { heading: 'Comprehensive Management: 10% per month', items: MANAGEMENT_COMPREHENSIVE },
    ],
  },
];
