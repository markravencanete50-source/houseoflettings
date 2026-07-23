// app/landlord-registration/content.ts
// Plain data module (NO 'use client') shared by the server layout (JSON-LD /
// metadata) and the client page. Kept framework-free so a React Server
// Component can .map() over it without the "map from a client module" error.
// Prices are NOT stored here: the page reads them live from lib/bundles.ts.

export type IconKey =
  | 'home'
  | 'shield'
  | 'trending'
  | 'user'
  | 'zap'
  | 'lock';

export const WHY_POINTS: { icon: IconKey; title: string; body: string }[] = [
  {
    icon: 'home',
    title: 'Hands-off management',
    body: 'Tenant finding, referencing, inspections, maintenance and rent collection, all handled for you.',
  },
  {
    icon: 'shield',
    title: 'Full UK compliance',
    body: 'We arrange and track your EPC, Gas Safety, EICR and deposit protection so your let stays legal.',
  },
  {
    icon: 'trending',
    title: 'Maximise your returns',
    body: 'Accurate rental valuations and transparent pricing with no hidden fees at any stage.',
  },
  {
    icon: 'user',
    title: 'A dedicated local agent',
    body: 'A real person who knows the Leeds and Manchester market and manages your portfolio.',
  },
  {
    icon: 'zap',
    title: 'Fast turnaround',
    body: 'We respond to every registration within 24 to 48 hours with a tailored proposal.',
  },
  {
    icon: 'lock',
    title: 'No obligation',
    body: 'Registering is free and commitment free. You only proceed if the proposal suits you.',
  },
];

export const PROCESS_STEPS: { n: number; title: string; desc: string }[] = [
  { n: 1, title: 'Tell us about your property', desc: 'Address, type and your preferred start date.' },
  { n: 2, title: 'Choose your service', desc: 'Tenant find or a management bundle. Compare fees on screen.' },
  { n: 3, title: 'Review and e-sign online', desc: 'A signed PDF of your agreement is emailed to you.' },
];

export const TERMS_SHORT: { title: string; body: string }[] = [
  {
    title: 'Registration and agreement in one',
    body: 'Registering is free. You review and e-sign the agreement for your chosen package on screen, and a signed PDF is emailed to you.',
  },
  {
    title: 'No hidden fees',
    body: 'Any management, tenant find or certificate fees are set out clearly in your proposal before work begins.',
  },
  {
    title: 'Right to decline',
    body: 'Both parties may decline to proceed after registration. Registering does not guarantee that we will take on your property.',
  },
];

export const TERMS_FULL: { title: string; body: string }[] = [
  {
    title: 'Registration and agreement in one',
    body: 'Registering is free. You review and electronically sign the Residential Lettings and Management Agreement for your chosen package. The full terms, service schedule and fees are shown on screen before you sign, and a signed PDF is emailed to you.',
  },
  {
    title: 'Legal compliance',
    body: 'As the landlord you remain legally responsible for your property. We arrange and track required documents, including an EPC rated E or above, an annual Gas Safety Certificate, an EICR every 5 years, and smoke and carbon monoxide alarms, under any managed package.',
  },
  {
    title: 'Deposit protection',
    body: 'Where we hold a tenancy deposit, it is protected in a government approved scheme within 30 days and the prescribed information is served on the tenant.',
  },
  {
    title: 'Fees',
    body: 'Any management, tenant find or certificate fees are set out clearly in your proposal before work begins. We never charge hidden fees.',
  },
  {
    title: 'Your data and documents',
    body: 'The information you provide is used solely to prepare your proposal and manage your property. It is stored securely and never sold.',
  },
  {
    title: 'Right to decline',
    body: 'Both parties may decline to proceed after registration. Registering does not guarantee that House of Lettings will take on your property.',
  },
];

// Editorial copy per bundle, keyed by the lib/bundles.ts id. `card` is the short
// grid summary; `summary` + `details` populate the detail modal. No prices here.
export const BUNDLE_COPY: Record<string, { card: string; summary: string; details: string[] }> = {
  'virtual-tenant-find': {
    card: 'A quality, fully referenced tenant found quickly. We market, vet and reference everything remotely, then hand you a signed tenancy agreement.',
    summary:
      'You have the time to run the tenancy and handle maintenance yourself. You need a quality, fully referenced tenant found quickly. We manage the entire search remotely.',
    details: [
      'Professional listing creation',
      'Multi portal advertising',
      'Enquiry management',
      'Full tenant referencing and signed tenancy agreement',
    ],
  },
  'expert-tenant-find': {
    card: 'Everything in Virtual, plus professional photography, accompanied viewings and a full in-person handover.',
    summary:
      'The complete marketing push to attract stronger applicants and achieve a higher rent. You still manage the tenancy yourself.',
    details: [
      'Everything in Virtual Tenant Find',
      'Professional photography and floor plan',
      'Accompanied viewings',
      'In-person tenant handover',
    ],
  },
  'essential-management': {
    card: 'We collect the rent, monitor payments, chase arrears and handle the monthly admin while you manage repairs.',
    summary:
      'A light-touch option for confident landlords. We handle the money side while you stay in control of repairs and contractors.',
    details: [
      'Includes a full tenant find',
      'Monthly rent collection and payment monitoring',
      'Arrears management',
      'Monthly statements',
    ],
  },
  'full-management': {
    card: 'Rent, tenant communication, maintenance, contractors and compliance, all managed by your local team.',
    summary:
      'The truly hands-off choice, and by far our most popular package. Your local team manages the tenancy end to end.',
    details: [
      'Everything in Essential Management',
      'Maintenance coordination and contractor management',
      'Regular inspections',
      'Compliance monitoring',
    ],
  },
  'comprehensive-management': {
    card: 'Everything in Full, plus rent guarantee cover, legal protection and priority contractor response.',
    summary: 'Complete peace of mind, with your rental income protected.',
    details: [
      'Everything in Full Management',
      'Emergency maintenance support',
      'Property inspections with report',
      'Rent guarantee cover, legal and eviction protection',
      'Priority contractor response',
    ],
  },
};

export const REGISTRATION_FAQS: { q: string; a: string }[] = [
  {
    q: 'Why register my property with House of Lettings?',
    a: 'Registering gives our lettings team the details we need to build a tailored management proposal for your property. We handle tenant finding, referencing, rent collection, maintenance and full legal compliance across Leeds and Manchester, so you get a fully compliant let and a dedicated local agent.',
  },
  {
    q: 'What documents will I need to let my property legally in the UK?',
    a: 'You need an EPC rated E or above, an annual Gas Safety Certificate if the property has gas appliances, an EICR renewed at least every 5 years, working smoke and carbon monoxide alarms, and Right to Rent checks for every adult occupier. On our managed packages we arrange and track all of these for you.',
  },
  {
    q: "Do I have to protect my tenant's deposit?",
    a: 'Yes. Any deposit must be placed in a government approved scheme such as DPS, mydeposits or TDS within 30 days, and the prescribed information must be served on the tenant. Where we hold the deposit, we handle this for you.',
  },
  {
    q: 'Is registering a commitment or a contract?',
    a: 'Registration is free and carries no obligation. You review and e-sign the agreement for your chosen package during registration, and both parties may decline to proceed afterwards. You only continue if the proposal suits you.',
  },
  {
    q: 'How many properties can I register?',
    a: 'As many as you like. Portfolio landlords receive a dedicated local agent who manages every property under one point of contact.',
  },
];
