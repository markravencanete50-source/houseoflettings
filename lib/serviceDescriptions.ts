// lib/serviceDescriptions.ts
// Plain-English explanation for every service in the pricing matrix, keyed by
// the exact label used in lib/pricingMatrix.ts. Powers the individual package
// detail pages at /pricing/[slug]. Copy avoids em/en dashes per the site rule.

export const SERVICE_DESCRIPTIONS: Record<string, string> = {
  // ── Tenant Find & Marketing ─────────────────────────────────────────
  'Property Valuation':
    'An accurate, data-backed rental valuation so your property is listed at the right price from day one.',
  'Professional Property Photography':
    'High-quality photography that makes your listing stand out and attracts more enquiries from serious tenants.',
  'Floor Plan':
    'A clear, to-scale floor plan so applicants understand the layout before they book a viewing.',
  'Advertising on Major Property Portals':
    'Your property promoted on Rightmove, Zoopla and other leading portals for maximum exposure.',
  'Enquiry Management & Applicant Screening':
    'We field every enquiry and pre-qualify applicants, so only genuine, suitable tenants reach the viewing stage.',
  'Agent-Led (Accompanied) Property Viewings':
    'A local agent conducts viewings in person, showcasing the property and answering questions on the spot.',
  'Viewing Feedback & Negotiation':
    'We gather feedback after every viewing and negotiate terms to secure the best tenant at the best rent.',
  'Tenant Application Processing':
    'We manage the full application, collecting the information and documents needed to progress a tenancy.',
  'Collection of Holding Deposit':
    'We take a holding deposit to reserve the property while referencing is completed, in line with the rules.',
  'Right to Rent Checks':
    'Legally required identity and immigration checks confirming each tenant has the right to rent in the UK.',
  'Credit & Affordability Checks':
    'Credit and affordability screening to confirm a tenant can comfortably sustain the rent.',
  'Employment & Landlord References':
    'We verify employment and obtain references from previous landlords to confirm a reliable rental history.',
  'Guarantor Referencing (Where Applicable)':
    'Where a guarantor is needed, we reference them to the same standard for added security.',
  'Preparation of Tenancy Agreement':
    'A legally sound, up-to-date tenancy agreement drafted and ready for signing.',
  "Collection of First Month's Rent & Deposit":
    "We collect the first month's rent and the deposit before move-in, so the tenancy starts on solid footing.",
  'Utility & Council Tax Notifications':
    'We notify utility providers and the council of the new tenancy, so accounts transfer smoothly.',
  'Tenant Handover & Property Demonstration':
    'On move-in day we walk the tenant through the property in person, from the stop-tap to the boiler, so it is used correctly from day one.',
  'Transfer of Funds to the Landlord':
    'Rent and any balances are transferred promptly to your nominated account.',

  // ── Rent & Financial Management ─────────────────────────────────────
  'Key Holding & Management Service':
    'We securely hold a set of keys, so access for viewings, maintenance and emergencies is never a problem.',
  'Deposit Registration & Prescribed Information':
    "Your tenant's deposit is protected in a government-approved scheme with the prescribed information served, keeping you legally compliant.",
  'Compliance Monitoring (Gas Safety, EICR, EPC)':
    'We track your key safety certificates and prompt renewals before they expire, so your property stays compliant.',
  'Monthly Rent Collection':
    'We collect the rent each month and follow up if it is late, so you are paid without the awkward conversations.',
  'Monthly Landlord Statements':
    'A clear monthly statement showing rent received, any deductions and what has been paid to you.',
  'Rent Payment Monitoring':
    'We monitor incoming payments and flag any shortfall or delay the moment it happens.',
  'Annual Rental Income Summary':
    'A year-end summary of your rental income and costs to make tax time straightforward.',
  'Rent Review Guidance':
    'Data-led advice on when and how to adjust the rent to keep it in line with the market.',
  'Arrears Chasing & Reminders':
    'If rent falls behind, we chase the tenant with reminders and a clear process to get you back on track.',
  'Tenancy Continuation & Re-Marketing Management':
    'We manage renewals and, if a tenant leaves, re-market the property quickly to reduce void periods.',
  'End-of-Tenancy Administration':
    'We handle the paperwork, deposit return and check-out when a tenancy comes to an end.',

  // ── Property Management & Maintenance ───────────────────────────────
  'Day-to-Day Tenant Communication':
    'We become the point of contact for the tenant, handling questions and issues so you are not disturbed.',
  'Dedicated Property Management Team':
    'A named local team looks after your property, so you always deal with people who know it.',
  'Contractor Coordination':
    'We arrange trusted, vetted contractors for any works and coordinate access and timing.',
  'Repair Quotation Management':
    'We obtain and review quotes for repairs so you get fair pricing before any work goes ahead.',
  'Emergency Maintenance Support':
    'Out-of-hours support for urgent issues such as leaks or heating failures, protecting your property and tenant.',
  'Maintenance Issue Assessment':
    'We assess reported issues to determine what is genuinely needed, avoiding unnecessary call-outs.',
  'Landlord Maintenance Authorisation':
    'For anything above an agreed limit, we seek your approval before proceeding, so you stay in control of spend.',
  'Maintenance Progress Updates':
    'We keep you informed as works progress, so you always know where things stand.',
  'Before & After Maintenance Reports':
    'Photographic before-and-after records of works carried out, for your peace of mind.',
  'Detailed Maintenance Reporting':
    'A clear record of every maintenance job, cost and outcome across the tenancy.',
  'Repair Completion Verification':
    'We confirm each repair is completed to standard before signing it off and releasing payment.',
  'Contractor Invoice Verification':
    'We check contractor invoices against the agreed work and quote before anything is paid.',
  'Check In & Check Out Inventory':
    'A photographed record of the condition and contents of the property at move-in, and a matching check-out report at the end of the tenancy. This is the evidence any deposit deduction is built on.',
  'Gas Safety, EICR & EPC Compliance Tracking':
    'Enhanced tracking of every statutory certificate, with proactive renewals arranged well ahead of expiry.',
  'Annual Property Maintenance Schedule & Reminders':
    'A yearly maintenance plan with reminders, so seasonal and preventative jobs are never missed.',

  // ── Comprehensive Extras ────────────────────────────────────────────
  'Rent Recovery & Legal / Eviction Protection':
    'Cover for the legal and eviction costs of recovering possession, taking that risk off your shoulders.',
  'Rent Guarantee Cover':
    'Your rent is paid even if the tenant stops paying, protecting your income throughout any arrears.',
  'Priority Contractor Response':
    'Front-of-queue response from our contractors for faster repairs when they matter most.',
  'Enhanced Periodic Property Inspections':
    'More frequent, detailed inspections with reports, so any issue is caught early.',
  'Property Inspections with Report':
    'Regular property inspections with a written report and photos on the condition of your property.',
  'Routine Inspection Every 6 Months':
    'We visit the property every six months as standard, so problems are spotted and dealt with long before they become expensive.',
};

// Fallback so a page never renders an empty explanation if a label changes.
export function describeService(label: string): string {
  return SERVICE_DESCRIPTIONS[label] || 'Included as part of this package.';
}
