// lib/additionalServices.ts
// Individual landlord services shown on /additional-services.
// Source: HouseOfLettings_Services_Pricing (July 2026) + client pricing brief.

export type PricingLine = { label: string; value: string };

export type AdditionalService = {
  id: string;
  name: string;
  price: string;      // headline figure, e.g. "from £70"
  priceNote: string;  // qualifier under the figure, e.g. "Inc. VAT"
  tagline: string;    // one-liner shown on the collapsed card
  whatItIs: string;
  included: string[];
  pricing: PricingLine[];
  goodToKnow: string[];
};

export type ServiceCategory = {
  id: string;
  title: string;
  blurb: string;
  services: AdditionalService[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'inventory',
    title: 'Inventory, Handover & Inspections',
    blurb: 'Independent, photo-backed condition reports and in-person handovers that protect your deposit position and keep the tenancy running smoothly.',
    services: [
      {
        id: 'inventory-handover',
        name: 'Inventory + Handover (Check-In)',
        price: 'from £120',
        priceNote: 'Inc. VAT',
        tagline: 'A photographed condition report plus an in-person tenant handover.',
        whatItIs:
          'An inventory is a detailed, photographed record of the property’s condition and contents at the start of a tenancy — your single most important document for protecting the deposit. We pair it with a handover: on move-in day we meet the tenant at the property and walk them through how everything works, so the home is used correctly from day one.',
        included: [
          'An independent, accredited inventory clerk',
          'A detailed schedule of condition backed by photo evidence',
          'Meter readings taken and the cleaning standard documented',
          'In-person handover: the water stop-tap and how to shut it off in an emergency',
          'How to reset a tripped fuse at the fuse board, and the gas shut-off',
          'How the boiler and thermostat work, and how to secure (lock up) the property',
          'Keys handed over and digital signatures captured',
        ],
        pricing: [
          { label: 'Inventory only', value: 'from £85' },
          { label: 'Inventory + Handover (Check-In)', value: 'from £120' },
          { label: 'Furnished-property surcharge', value: '+£15' },
          { label: 'Each bedroom beyond the first', value: '+£15' },
          { label: 'Handover booked on a different day', value: '+£65' },
        ],
        goodToKnow: [
          'The handover walks the tenant through the property in person to avoid miscommunication and misuse later in the tenancy.',
          'Furnished properties take longer, as each item is checked and photographed, so a surcharge applies.',
          'The different-day charge applies because the handover then means a second visit by the clerk.',
        ],
      },
      {
        id: 'check-out',
        name: 'Check-Out Report',
        price: '£89',
        priceNote: 'Inc. VAT',
        tagline: 'The end-of-tenancy condition report your deposit case is built on.',
        whatItIs:
          'At the end of the tenancy the clerk returns to the property and records its condition against the original inventory, documenting any damage, cleaning issues or missing items. For furnished properties the furniture and its condition are assessed and photographed as thoroughly as an inspection allows. It is the basis for any deposit deductions.',
        included: [
          'An independent, accredited inventory clerk returns to the property',
          'A photographed schedule of condition at the end of the tenancy',
          'Furniture and furnishings assessed and photographed (furnished lets)',
          'Meter readings taken and a digital report issued',
        ],
        pricing: [
          { label: 'Check-Out (furnished property schedule)', value: '£89' },
          { label: 'Each bedroom beyond the first', value: '+£15' },
        ],
        goodToKnow: [
          'Check-Out compares the property to the start of the tenancy — the evidence deposit schemes rely on.',
          'A furnished property is an inspection, not a full survey: items are checked as far as is reasonable without dismantling furniture.',
        ],
      },
      {
        id: 'check-comparison',
        name: 'Check-In / Check-Out Comparison',
        price: '£89',
        priceNote: 'Inc. VAT',
        tagline: 'Side-by-side evidence for a deposit dispute.',
        whatItIs:
          'If a deposit is disputed, this brings the check-in inventory, any mid-tenancy inspections and the check-out report together into a single comparison. We mark the differences clearly and prepare the evidence pack you can submit to the deposit scheme.',
        included: [
          'Comparison of the check-in inventory against the check-out report',
          'Any mid-tenancy inspections factored into the timeline',
          'Differences clearly marked with supporting photographs',
          'An evidence pack prepared for the deposit scheme',
        ],
        pricing: [{ label: 'Comparison report', value: '£89' }],
        goodToKnow: [
          'Most useful where there is a disagreement over deposit deductions at the end of a tenancy.',
          'Strongest when an independent inventory, handover and check-out were all carried out.',
        ],
      },
      {
        id: 'mid-tenancy-inspection',
        name: 'Mid-Tenancy Inspection',
        price: '£89',
        priceNote: 'Inc. VAT',
        tagline: 'Catch small problems before they become expensive ones.',
        whatItIs:
          'A mid-tenancy inspection is an in-person check-up on the property partway through a tenancy. It catches small problems early (a minor leak, poor upkeep) before they become expensive, and helps avoid nasty surprises and deposit disputes at check-out.',
        included: [
          'An in-person visit to identify small issues early',
          'A written report with photographs',
          'Helps minimise deposit disputes at the end of the tenancy',
        ],
        pricing: [{ label: 'Per inspection', value: '£89' }],
        goodToKnow: ['The final price depends on the size and location of the property.'],
      },
      {
        id: 'virtual-inspection',
        name: 'Virtual Mid-Tenancy Inspection',
        price: '£39',
        priceNote: 'Inc. VAT',
        tagline: 'A tenant-led inspection through our online portal.',
        whatItIs:
          'A lower-cost, remote alternative to a visit. The tenant photographs the property and uploads it through our online portal, and we review the condition and flag anything that needs attention — no appointment required.',
        included: [
          'A guided, tenant-led inspection via our online portal',
          'Photographs uploaded by the tenant and reviewed by our team',
          'A short report flagging anything that needs attention',
        ],
        pricing: [{ label: 'Per virtual inspection', value: '£39' }],
        goodToKnow: [
          'Ideal between full inspections, or for lower-risk tenancies.',
          'Relies on the tenant’s co-operation to capture the photographs.',
        ],
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & Viewings',
    blurb: 'Let your property faster, and at the best rent, with professional marketing and hands-off viewings.',
    services: [
      {
        id: 'photos-floorplans',
        name: 'Professional Photography & Floor Plan',
        price: 'from £75',
        priceNote: 'Inc. VAT',
        tagline: 'Stand-out listing photography with a floor plan included.',
        whatItIs:
          'Professional photography and floor plans make your listing stand out and attract more enquiries. Good photos are one of the biggest factors in how quickly a property lets and at what rent.',
        included: [
          'Professional-quality photographs with post-processing',
          'A floor plan to help tenants understand the layout',
        ],
        pricing: [{ label: 'Starting price', value: 'from £75' }],
        goodToKnow: ['The final price depends on the size and location of the property.'],
      },
      {
        id: 'video-tour',
        name: 'Video Tour',
        price: '£75',
        priceNote: 'Inc. VAT',
        tagline: 'A filmed, professionally edited walk-through of the property.',
        whatItIs:
          'A video tour lets prospective tenants experience the flow of the property before they visit, cutting down wasted viewings and attracting more serious enquiries. We film and professionally edit a walk-through you can add to your listing.',
        included: [
          'A filmed walk-through of the property',
          'Professional editing, ready to add to your listing',
        ],
        pricing: [{ label: 'Filmed & edited video tour', value: '£75' }],
        goodToKnow: ['Often booked alongside professional photography for a complete marketing set.'],
      },
      {
        id: 'accompanied-viewings',
        name: 'Accompanied Viewings Service',
        price: 'from £45',
        priceNote: 'Inc. VAT',
        tagline: 'We show prospective tenants around when you cannot be there.',
        whatItIs:
          'If you can’t be at the property to show prospective tenants around, this service sends someone to conduct the viewings on your behalf. It is ideal for landlords who live away from the property or have busy schedules.',
        included: ['Viewings conducted on your behalf when you cannot attend'],
        pricing: [{ label: 'Starting price', value: 'from £45' }],
        goodToKnow: ['The final price depends on the property, location and number of viewings.'],
      },
    ],
  },
  {
    id: 'referencing',
    title: 'Tenant & Guarantor Referencing',
    blurb: 'Know exactly who you are letting to before you commit to a tenancy.',
    services: [
      {
        id: 'referencing-service',
        name: 'Tenant & Guarantor Referencing',
        price: '£25',
        priceNote: 'per applicant',
        tagline: 'Three checks per applicant: credit, previous landlord and income.',
        whatItIs:
          'Referencing checks whether a prospective tenant (or their guarantor) can afford the rent and has a reliable history. It combines three checks — a credit check, a previous-landlord check and an income and employment check — giving you a clear picture before you commit to a tenancy.',
        included: [
          'Credit check and risk score',
          'Previous-landlord check and letting history',
          'Income and employment verification',
          'Identity, fraud and linked-address checks',
          'County Court Judgments and court records (6 years)',
          'An affordability rating against the rent',
        ],
        pricing: [{ label: 'Per applicant referenced', value: '£25' }],
        goodToKnow: [
          'Charged per applicant. Reference every adult over 18, plus any guarantors.',
          'There is no charge to tenants (the Tenant Fees Ban means the landlord pays).',
          'Credit data is only available for applicants currently living in the UK.',
          'An initial report is usually back within 24 hours; the full report takes around 3 working days.',
        ],
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Safety Certificates & Compliance',
    blurb: 'The legal essentials every rental property needs, handled by qualified engineers and assessors.',
    services: [
      {
        id: 'gas-safety',
        name: 'Gas Safety Certificate (CP12)',
        price: 'from £70',
        priceNote: 'Inc. VAT',
        tagline: 'Annual legal gas check by a Gas Safe registered engineer.',
        whatItIs:
          'If your rental property has any gas appliances (boiler, cooker, fire), UK law requires an annual gas safety check by a Gas Safe registered engineer. The engineer inspects every appliance, the pipework and the flues, and issues a certificate (the CP12) confirming they are safe. You must give tenants a copy. Failing to do so is a criminal offence with fines up to £6,000.',
        included: [
          'Gas Safe registered engineer call-out to the property',
          'Inspection of the boiler plus pipework and flues',
          'A digitally accessible CP12 certificate you can store and share',
          'Fast turnaround, with lead times from just 2 working days',
        ],
        pricing: [
          { label: 'Base price (covers the boiler)', value: 'from £70' },
          { label: 'Each additional gas appliance', value: '+£13' },
          { label: 'Add a full boiler service', value: '+£50' },
        ],
        goodToKnow: [
          'The certificate is valid for 12 months and must be renewed before it expires. There is no grace period.',
          'Bookings are Monday to Friday, 8am to 6pm; evenings and Saturdays subject to availability.',
          'A boiler service is not legally required but is strongly recommended and often needed to keep the manufacturer’s warranty valid.',
        ],
      },
      {
        id: 'epc',
        name: 'Energy Performance Certificate (EPC)',
        price: 'from £65',
        priceNote: 'Inc. VAT',
        tagline: 'The energy rating you legally need before marketing a property.',
        whatItIs:
          'An EPC rates how energy-efficient a property is, from A (best) to G (worst). It is a legal requirement before you can market or let a property, and it must currently be rated E or above to be let legally in England and Wales. An accredited assessor visits, measures the property and produces the certificate.',
        included: [
          'Visit from a fully qualified, accredited and insured assessor',
          'Assessment of up to 6 bedrooms as standard',
          'Certificate delivered electronically',
          'Full refund if no assessor is available on your chosen date',
        ],
        pricing: [
          { label: 'Base price (up to 6 bedrooms)', value: 'from £65' },
          { label: 'Each bedroom beyond 6', value: '+£15' },
        ],
        goodToKnow: [
          'An EPC lasts 10 years, so it rarely needs renewing during a tenancy.',
          'You cannot legally advertise a property to let without a valid EPC in place.',
        ],
      },
      {
        id: 'eicr',
        name: 'Electrical Installation Condition Report (EICR)',
        price: '£170',
        priceNote: 'Inc. VAT',
        tagline: 'The mandatory 5-year electrical safety inspection.',
        whatItIs:
          'An EICR is a full inspection of the property’s fixed electrical installation: the wiring, sockets, consumer unit (fuse board) and circuits. It is mandatory for rented homes in England and Scotland and must be renewed every 5 years. A qualified engineer tests everything and reports any faults that need fixing.',
        included: [
          'Full inspection by a City & Guilds qualified engineer',
          'Testing of fuses and circuit breakers (RCDs / RCBOs)',
          'Up to 8 circuits and 1 fuse board included as standard',
          'A digitally accessible certificate',
          'A free, full quote for any remedial work identified',
        ],
        pricing: [
          { label: 'Base price', value: '£170' },
          { label: 'Per bedroom (added to the base)', value: '+£15' },
          { label: 'Each circuit beyond 8', value: '+£15' },
          { label: 'Each additional fuse board beyond the first', value: '+£55' },
        ],
        goodToKnow: [
          'The certificate lasts 5 years.',
          'Non-compliance can invalidate your insurance and carries fines of up to £5,000 per breach.',
          'Failed circuits are only re-tested once the remedial works have been carried out.',
          'Bookings are Monday to Friday.',
        ],
      },
      {
        id: 'pat',
        name: 'Portable Appliance Testing (PAT)',
        price: '£90',
        priceNote: 'Inc. VAT',
        tagline: 'Safety testing for the appliances you provide with the property.',
        whatItIs:
          'PAT testing checks the safety of plug-in electrical appliances you provide with the property, such as kettles, microwaves, lamps and washing machines. It is not legally mandatory on its own, but it proves the appliances you supply are safe and is recommended annually, especially for furnished lets.',
        included: [
          'Testing of up to 10 electrical appliances',
          'Free plug and fuse replacements where needed',
          'Minor faults corrected and the appliance re-tested on the spot',
          'A digitally accessible certificate of electrical safety',
          'Carried out by a City & Guilds qualified engineer',
        ],
        pricing: [
          { label: 'Base price (up to 10 appliances)', value: '£90' },
          { label: 'Each appliance beyond 10', value: '+£2' },
        ],
        goodToKnow: [
          'Recommended annually, and often booked at the same time as the EICR.',
          'Available with 5 days’ notice; bookings are Monday to Friday.',
        ],
      },
    ],
  },
  {
    id: 'legal',
    title: 'Rent Protection & Legal',
    blurb: 'Recover your income and possession when a tenancy goes wrong, and protect against the unexpected.',
    services: [
      {
        id: 'eviction-notice',
        name: 'Eviction Notice',
        price: 'On request',
        priceNote: '',
        tagline: 'Correct service of an eviction notice to end a tenancy.',
        whatItIs:
          'An eviction notice is a formal notice to end a tenancy, most commonly where the tenant has fallen into rent arrears or broken the terms. We help you serve the notice correctly so it stands up if the matter proceeds further.',
        included: ['Help serving an eviction notice to end a tenancy (England)'],
        pricing: [{ label: 'Serving the notice', value: 'On request' }],
        goodToKnow: [
          'Any follow-on court action or legal representation is arranged through our legal services and charged separately.',
        ],
      },
      {
        id: 'legal-services',
        name: 'Legal Services',
        price: 'On request',
        priceNote: '',
        tagline: 'Full legal support for evictions, arrears and disputes.',
        whatItIs:
          'For more serious situations, such as evictions, rent arrears recovery or disputes, full legal support is available through our trusted legal partners. Pricing is quoted per case depending on what’s involved.',
        included: ['Eviction, rent-arrears and wider legal support'],
        pricing: [{ label: 'Cost', value: 'Quoted per case' }],
        goodToKnow: [
          'You receive a clear quote based on your specific situation before any work begins.',
        ],
      },
      {
        id: 'rent-guarantee',
        name: 'Rent Guarantee Insurance (RGI)',
        price: '£275',
        priceNote: '12 months',
        tagline: 'Up to 12 months of unpaid rent covered, plus legal costs.',
        whatItIs:
          'Rent Guarantee Insurance protects your income if a tenant stops paying. It covers up to 12 months of unpaid rent and the legal costs of recovering possession, giving you peace of mind that a non-paying tenant won’t leave you out of pocket.',
        included: [
          'Cover for up to 12 months of unpaid rent',
          'Cover for the associated legal expenses',
          'A free legal helpline for the duration of the policy',
        ],
        pricing: [{ label: '12-month policy', value: '£275' }],
        goodToKnow: [
          'Only available after a tenant has passed referencing.',
          'The tenant must have UK-based income, or a UK-based guarantor, to qualify.',
        ],
      },
      {
        id: 'building-contents',
        name: 'Building & Contents Insurance',
        price: 'Get a quote',
        priceNote: '',
        tagline: 'Specialist landlord cover for the building and its contents.',
        whatItIs:
          'Specialist landlord insurance covering the building and any contents you provide against risks such as theft, fire, storm and flood, with loss-of-rent and public liability cover included. Because cover depends on the property, it’s priced by quote.',
        included: [
          'Cover against theft, fire, storm and flood',
          'Loss of rent cover',
          'Public liability cover',
        ],
        pricing: [{ label: 'Cost', value: 'Quote-based' }],
        goodToKnow: [
          'The premium depends on your property and the level of cover you choose. Contact us for a tailored quote.',
        ],
      },
    ],
  },
];
