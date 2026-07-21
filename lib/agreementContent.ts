// lib/agreementContent.ts
// Single source of truth for the Residential Lettings & Management Agreement.
//
// The agreement is ONE general contract for every landlord; only the "Service"
// schedule and the "Fees" clause change with the package the landlord selects
// (Virtual/Expert Tenant Find or Essential/Full/Comprehensive Management). The
// service schedule and fees are derived from lib/bundles.ts so pricing never
// drifts between the pricing pages and the signed agreement.
//
// The legal clause wording (the intro and every general clause) can be edited
// by an admin without a code deploy: an AgreementTemplate stored in Firestore
// overrides the defaults below. buildAgreementSections(bundle, template) merges
// the two. The per-package Service list and the Fees figures are deliberately
// NOT part of the template — they stay driven by lib/bundles.ts so an edit here
// can never make the agreement disagree with /pricing.
//
// This module is framework-free (no server-only imports) so the sign form,
// the /api PDF builder and the email templates can all import the SAME text —
// what the landlord reads on screen is exactly what is written to the PDF.

import { BUNDLES, type Bundle } from './bundles';

// The Agent's registered details, exactly as they appear on the paper
// agreement. Shown in the parties block on screen, in the PDF and in the email.
export const AGENT_DETAILS = {
  companyName: 'House of Lettings Limited',
  companyNumber: '11676443',
  ombudsman: 'T02474',
  moneyProtection: 'CMP006534',
  ico: '00017503100',
  depositScheme: '1851465',
  phones: '0161 768 1758, 0113 868 9212',
  email: 'info@houseoflettings.co.uk',
  address: 'House of Lettings, Peter House, Oxford Street, Manchester, M1 5AN',
} as const;

export const AGREEMENT_TITLE = 'Residential Lettings & Management Agreement';

// Default intro. Overridable via template.intro.
export const AGREEMENT_INTRO =
  'This Agreement is between the Landlord and House of Lettings Limited (the Agent), who will act as the Landlord’s sole letting and management agent for the Property. It sets out the scope of services, fees, and the terms and conditions forming a legally binding contract. By signing, the Landlord agrees to these terms for this Property and any future property managed by the Agent, unless otherwise agreed in writing. If unsure of any obligations, the Landlord is advised to seek independent legal advice. This Agreement complies with the Provision of Services Regulations 2009 (SI 2999).';

export type AgreementSection = {
  n: number;
  title: string;
  paras?: string[];
  groups?: { heading: string; items: string[] }[];
};

// A general legal clause, addressed by a stable key so an admin override in the
// stored template can target it even if its position or title changes.
export type Clause = { key: string; title: string; paras: string[] };

// An admin's overrides, stored in Firestore (settings/agreementTemplate). Only
// legal wording lives here — never the service lists or fee figures.
export type AgreementTemplate = {
  intro?: string;
  clauses?: Record<string, { title?: string; paras?: string[] }>;
};

// Clause 1, before the Service and Fees sections.
const APPOINTMENT: Clause = {
  key: 'appointment',
  title: 'Appointment & Authority',
  paras: [
    'The Landlord confirms they are the legal owner of the Property and are entitled to let it. Necessary consents from mortgage lenders, freeholders, or others have been obtained.',
    'The Landlord authorises House of Lettings to act on their behalf, including advertising and letting the Property, managing tenancy matters per the selected service level, protecting tenancy deposits under the law, and receiving fees, commissions, or referral income as disclosed.',
    'The Agent may update this Agreement by providing 30 days’ written notice.',
  ],
};

// The general clauses that follow the Service and Fees sections. Keyed and
// ordered; every one is editable via the template.
const TAIL_CLAUSES: Clause[] = [
  {
    key: 'continuation',
    title: 'Continuation Fee',
    paras: [
      'A continuation fee of £199.00 (including VAT, where applicable) shall be payable every 12 months where the tenancy continues, including on a statutory periodic basis, whether or not a new tenancy agreement is entered into. This fee covers a rent review every 12 months, ongoing compliance checks, updates to tenancy documentation where required, compliance with Tenancy Deposit Scheme requirements, and relevant tenant referencing or checks where applicable.',
    ],
  },
  {
    key: 'deposit',
    title: 'Deposit & Holding Funds',
    paras: [
      'The Agent will register tenancy deposits in a Government scheme, unless instructed otherwise for Let Only services.',
      'A one-week holding deposit may be collected. It is credited to the tenant or retained per legal grounds if the tenancy does not proceed.',
      'A maintenance float may be withheld from rent at tenancy end to cover final repairs.',
    ],
  },
  {
    key: 'compliance',
    title: 'Legal & Regulatory Compliance',
    paras: [
      'The Landlord must ensure the Property complies with all safety and letting regulations, including but not limited to Gas Safety, Electrical Safety (EICR), Fire, Smoke and CO Alarm Regulations, EPC and Licensing (HMO / Selective Licensing), and Furniture & Furnishings Safety.',
      'The Agent may arrange certificates and remedial work. Costs will be deducted from rent or invoiced to the Landlord.',
      'The Landlord remains liable for compliance failures unless due to Agent negligence.',
    ],
  },
  {
    key: 'maintenance',
    title: 'Maintenance & Repairs',
    paras: [
      'The Property must be handed over in a safe, lettable condition, with all fixtures and appliances in working order and compliant with relevant safety legislation.',
      'The Agent may instruct and coordinate urgent repairs without prior approval if deemed necessary for safety, to prevent damage, or to comply with legal obligations.',
      'The Agent is not liable for the actions, omissions, or workmanship of third-party contractors instructed on behalf of the Landlord, except where negligence can be proven.',
      'The Agent may receive a reasonable fee or commission for coordinating maintenance works. This may be included in the contractor’s invoice or charged separately and covers time and management effort.',
    ],
  },
  {
    key: 'termination',
    title: 'Termination',
    paras: [
      'Either party may terminate this Agreement by giving three (3) months’ written notice. Early termination will incur a fee equal to one month’s rent.',
      'In the event of a serious breach by either party, thirty (30) days’ written notice may apply.',
      'If the Property is sold, a termination fee applies unless the buyer continues the Agent’s services.',
      'If no tenant is secured after six (6) weeks of marketing, the Landlord may cancel with seven (7) days’ written notice, provided no applicant has been approved or is in referencing.',
      'If the Landlord cancels during marketing, finds a tenant privately, or appoints another agent, a minimum charge of £399.00 applies to cover marketing and viewing costs.',
      'The Landlord must provide repossession instructions in good time if required.',
    ],
  },
  {
    key: 'legalAction',
    title: 'Legal Action & Rent Recovery',
    paras: [
      'The Agent will chase late rent for up to 28 days. Thereafter, the Landlord may appoint a solicitor at their own expense.',
      'The Agent may assist in court (charged at £180 per hour) but cannot represent the Landlord.',
    ],
  },
  {
    key: 'overseas',
    title: 'Overseas Landlords',
    paras: [
      'The Landlord must declare whether they are a Resident Landlord or a Non-Resident Landlord for tax purposes under the HMRC Non-Resident Landlord (NRL) Scheme.',
      'If the Landlord is a Non-Resident Landlord, they must provide the Agent with a valid HMRC approval letter confirming that rental income may be paid without tax deduction.',
      'Where no such approval is provided, or until written confirmation from HMRC is received, the Agent is legally required to deduct tax at the basic rate from the rental income before making any payments to the Landlord, and to remit such deductions to HMRC in accordance with the NRL Scheme.',
      'The Agent will charge £120.00 for NRL tax reporting and submission services. Additional HMRC or administrative requests may incur reasonable extra fees.',
      'The Agent accepts no liability for any penalties, interest, or losses arising from the Landlord’s failure to provide accurate information or obtain HMRC approval.',
    ],
  },
  {
    key: 'miscellaneous',
    title: 'Miscellaneous',
    paras: [
      'Notices may be served by hand, post, or email. Notices are deemed received by post 2 working days after posting, by email the next working day, if hand-delivered before 4:30 pm the same day, and if hand-delivered after 4:30 pm the next working day.',
      'This Agreement is governed by the laws of England and Wales.',
      'A 14-day cancellation period applies under the Consumer Contracts Regulations if signed off-premises.',
      'Data will be handled in accordance with GDPR. Landlords managing tenants directly must provide tenants with a privacy policy.',
    ],
  },
  {
    key: 'complaints',
    title: 'Complaints & Disputes',
    paras: [
      'Complaints should be made in writing to the Agent; if unresolved, they may be escalated to The Property Ombudsman.',
    ],
  },
];

// Every editable legal clause, in document order, for the admin wording editor
// (the Service and Fees sections are intentionally excluded).
export const EDITABLE_CLAUSES: Clause[] = [APPOINTMENT, ...TAIL_CLAUSES];

/** The effective intro after applying an admin override. */
export function effectiveIntro(template?: AgreementTemplate | null): string {
  const t = template?.intro?.trim();
  return t ? t : AGREEMENT_INTRO;
}

/** A clause with any admin override (title / paragraphs) applied. */
export function resolveClause(clause: Clause, template?: AgreementTemplate | null): Clause {
  const o = template?.clauses?.[clause.key];
  if (!o) return clause;
  const title = o.title?.trim() ? o.title.trim() : clause.title;
  const paras = Array.isArray(o.paras) && o.paras.length ? o.paras : clause.paras;
  return { ...clause, title, paras };
}

// The fees clause is driven entirely by the selected bundle so a fee shown on
// /pricing is the fee written into the signed agreement. Not template-editable.
function feesParas(bundle: Bundle): string[] {
  const paras: string[] = [];
  if (bundle.mgmtFee) {
    paras.push(`Tenant Find & Setup Fee: ${bundle.setupFee}. Management Fee: ${bundle.mgmtFee} of the monthly rent collected.`);
  } else {
    paras.push(`Tenant Find & Setup Fee: ${bundle.setupFee}. There is no ongoing management fee for this service.`);
  }
  paras.push(
    'Any additional services, one-off works, or discretionary costs not included within the selected service plan shall be charged separately. Such charges will be confirmed in writing prior to instruction and applied in accordance with House of Lettings’ standard terms and conditions.',
  );
  return paras;
}

function serviceIntro(bundle: Bundle): string {
  if (bundle.kind === 'Management') {
    return `The Agent provides the ${bundle.label} service for the Landlord. It combines a full tenant find with ongoing management, covering marketing, tenancy setup, rent handling, and the management and compliance duties listed below.`;
  }
  return `The Agent provides the ${bundle.label} service for the Landlord: a complete tenant-find and tenancy-setup service, marketing the Property, referencing the tenant and preparing the tenancy. The Landlord manages the tenancy thereafter. The service includes the following.`;
}

/** Look up a bundle by the id or label stored on an agreement record. */
export function findBundle(idOrLabel: string | undefined | null): Bundle | undefined {
  if (!idOrLabel) return undefined;
  return BUNDLES.find((b) => b.id === idOrLabel || b.label === idOrLabel);
}

/**
 * The full ordered agreement for a given package. Section 2 (Service) and
 * section 3 (Fees) are built from the bundle; every other clause is a general
 * clause with any admin template override applied. Consumed identically by the
 * on-screen review, the PDF and the email so the three can never disagree.
 */
export function buildAgreementSections(bundle: Bundle, template?: AgreementTemplate | null): AgreementSection[] {
  const appointment = resolveClause(APPOINTMENT, template);
  const tail = TAIL_CLAUSES.map((c) => resolveClause(c, template));
  const ordered: Omit<AgreementSection, 'n'>[] = [
    { title: appointment.title, paras: appointment.paras },
    { title: 'The Service', paras: [serviceIntro(bundle)], groups: bundle.groups },
    { title: 'Fees', paras: feesParas(bundle) },
    ...tail.map((c) => ({ title: c.title, paras: c.paras })),
  ];
  return ordered.map((s, i) => ({ ...s, n: i + 1 }));
}
