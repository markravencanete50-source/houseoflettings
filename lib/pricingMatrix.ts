// lib/pricingMatrix.ts
// Feature comparison matrix shown on /pricing.
// Marks map to the 5 tiers IN ORDER: [Virtual TF, Expert TF, Essential, Full, Comprehensive]
// 1 = included, 0 = not included. The Full column (index 3) is the highlighted "Most Popular".

export type MatrixRow = [label: string, ...marks: number[]];

export type MatrixSection = {
  title: string;
  rows: MatrixRow[];
};

export const MATRIX_SECTIONS: MatrixSection[] = [
  {
    title: 'Tenant Find & Marketing',
    rows: [
      ['Property Valuation', 1, 1, 1, 1, 1],
      ['Professional Property Photography', 0, 1, 0, 1, 1],
      ['Floor Plan', 0, 1, 0, 1, 1],
      ['Advertising on Major Property Portals', 1, 1, 1, 1, 1],
      ['Enquiry Management & Applicant Screening', 1, 1, 1, 1, 1],
      ['Agent-Led (Accompanied) Property Viewings', 0, 1, 0, 1, 1],
      ['Viewing Feedback & Negotiation', 1, 1, 0, 1, 1],
      ['Tenant Application Processing', 1, 1, 1, 1, 1],
      ['Collection of Holding Deposit', 1, 1, 1, 1, 1],
      ['Right to Rent Checks', 1, 1, 1, 1, 1],
      ['Credit & Affordability Checks', 1, 1, 1, 1, 1],
      ['Employment & Landlord References', 1, 1, 1, 1, 1],
      ['Guarantor Referencing (Where Applicable)', 1, 1, 1, 1, 1],
      ['Preparation of Tenancy Agreement', 1, 1, 1, 1, 1],
      ["Collection of First Month's Rent & Deposit", 1, 1, 1, 1, 1],
      ['Utility & Council Tax Notifications', 1, 1, 1, 1, 1],
      ['Tenant Handover & Property Demonstration', 0, 1, 1, 1, 1],
      ['Transfer of Funds to the Landlord', 1, 1, 1, 1, 1],
    ],
  },
  {
    title: 'Rent & Financial Management',
    rows: [
      ['Key Holding & Management Service', 0, 0, 1, 1, 1],
      ['Deposit Registration & Prescribed Information', 1, 1, 1, 1, 1],
      ['Compliance Monitoring (Gas Safety, EICR, EPC)', 0, 0, 0, 1, 1],
      ['Monthly Rent Collection', 0, 0, 1, 1, 1],
      ['Monthly Landlord Statements', 0, 0, 0, 1, 1],
      ['Rent Payment Monitoring', 0, 0, 1, 1, 1],
      ['Annual Rental Income Summary', 0, 0, 1, 1, 1],
      ['Rent Review Guidance', 0, 0, 0, 1, 1],
      ['Arrears Chasing & Reminders', 0, 0, 1, 1, 1],
      ['Tenancy Continuation & Re-Marketing Management', 0, 0, 0, 1, 1],
      ['End-of-Tenancy Administration', 0, 0, 1, 1, 1],
    ],
  },
  {
    title: 'Property Management & Maintenance',
    rows: [
      ['Day-to-Day Tenant Communication', 0, 0, 0, 1, 1],
      ['Dedicated Property Management Team', 0, 0, 0, 1, 1],
      ['Contractor Coordination', 0, 0, 0, 1, 1],
      ['Repair Quotation Management', 0, 0, 0, 1, 1],
      ['Emergency Maintenance Support', 0, 0, 0, 1, 1],
      ['Maintenance Issue Assessment', 0, 0, 0, 1, 1],
      ['Landlord Maintenance Authorisation', 0, 0, 0, 1, 1],
      ['Maintenance Progress Updates', 0, 0, 0, 1, 1],
      ['Before & After Maintenance Reports', 0, 0, 0, 1, 1],
      ['Detailed Maintenance Reporting', 0, 0, 0, 1, 1],
      ['Repair Completion Verification', 0, 0, 0, 1, 1],
      ['Contractor Invoice Verification', 0, 0, 0, 1, 1],
      ['Gas Safety, EICR & EPC Compliance Tracking', 0, 0, 0, 0, 1],
      ['Annual Property Maintenance Schedule & Reminders', 0, 0, 0, 0, 1],
    ],
  },
  {
    title: 'Comprehensive Extras',
    rows: [
      ['Rent Recovery & Legal / Eviction Protection', 0, 0, 0, 0, 1],
      ['Rent Guarantee Cover', 0, 0, 0, 0, 1],
      ['Priority Contractor Response', 0, 0, 0, 0, 1],
      ['Enhanced Periodic Property Inspections', 0, 0, 0, 0, 1],
      ['Property Inspections with Report', 0, 0, 0, 1, 1],
    ],
  },
];

export const TOTAL_SERVICES = MATRIX_SECTIONS.reduce((n, s) => n + s.rows.length, 0);

export const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: 'Can I upgrade my package later?',
    a: 'Yes — move up a tier at any time. We simply apply the difference to your next invoice, with no re-setup charge.',
  },
  {
    q: "Which package if I'm a hands-on landlord?",
    a: 'If you have the time to handle maintenance and day-to-day yourself, Virtual Tenant Find is the value choice — we just find and reference the tenant. Prefer it fully managed? Choose Full Management.',
  },
  {
    q: 'Essential vs Full Management?',
    a: 'Essential covers rent collection, monitoring and key admin — you keep maintenance. Full adds hands-on maintenance, contractor coordination and compliance.',
  },
  {
    q: 'What is a "handover"?',
    a: 'On move-in day we walk the tenant through the property in person — the water stop-tap, fuse board, gas shut-off, boiler and thermostat, plus how to secure the home — so the property is used correctly from day one.',
  },
  {
    q: 'Are there any hidden fees?',
    a: 'No. Your package price is fixed and VAT-inclusive. The only additional costs are the optional extras, which you choose.',
  },
  {
    q: 'Is there a long-term contract?',
    a: 'Tenant-find packages are one-off with no commitment. Management is rolling monthly, so you are never locked in.',
  },
];
