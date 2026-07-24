// lib/tenancyFields.ts
// The tenancy/deposit/accounts fields shown on a property in the landlord portal,
// mirroring the letting-agent CRM (Gnomen) tenancy summary. This data lives on
// the property document and is entered by staff/admin (it isn't captured by the
// public registration/listing flow), then surfaced read-only to the landlord.
// One definition drives BOTH the staff editor and the portal display, so they
// can never drift.

export type TenancyFieldType = 'text' | 'date' | 'select' | 'checkbox' | 'money';
export interface TenancyField { key: string; label: string; type: TenancyFieldType; options?: string[]; placeholder?: string }

export const TENANCY_GROUPS: { heading: string; fields: TenancyField[] }[] = [
  {
    heading: 'Tenancy',
    fields: [
      { key: 'tenancyType', label: 'Type', type: 'select', options: ['', 'Managed', 'Let only', 'Rent collection'] },
      { key: 'flag', label: 'Flag', type: 'text', placeholder: 'No flag' },
      { key: 'uniquePaymentReference', label: 'Unique payment reference', type: 'text' },
      { key: 'tenantName', label: 'Tenant', type: 'text' },
      { key: 'otherTenants', label: 'Other tenants', type: 'text', placeholder: 'comma-separated' },
    ],
  },
  {
    heading: 'Guarantor',
    fields: [
      { key: 'guarantorName', label: 'Guarantor', type: 'text' },
      { key: 'guarantorAddress', label: 'Guarantor address', type: 'text' },
      { key: 'guarantorContact', label: 'Guarantor contact', type: 'text' },
      { key: 'guarantorEmail', label: 'Guarantor email', type: 'text' },
    ],
  },
  {
    heading: 'Rent & management fee',
    fields: [
      { key: 'managementFeePct', label: 'Management fee %', type: 'text', placeholder: 'e.g. 10' },
      { key: 'managementFeeVat', label: 'VAT applies on fee', type: 'checkbox' },
      { key: 'automaticStatement', label: 'Automatic statement', type: 'checkbox' },
      { key: 'emailStatementTo', label: 'Email statement to', type: 'text' },
    ],
  },
  {
    heading: 'Contract',
    fields: [
      { key: 'contractStart', label: 'Contract start', type: 'date' },
      { key: 'contractEnd', label: 'Contract end', type: 'date' },
      { key: 'renewalStatus', label: 'Renewal status', type: 'text' },
      { key: 'dateToVacate', label: 'Date to vacate', type: 'date' },
      { key: 'contractEndAction', label: 'Contract end action', type: 'select', options: ['', 'Statutory periodic', 'Renew', 'End tenancy'] },
    ],
  },
  {
    heading: 'Deposit',
    fields: [
      { key: 'depositProtectionRef', label: 'Deposit protection reference', type: 'text' },
      { key: 'depositAmount', label: 'Deposit amount', type: 'money' },
      { key: 'depositHeldBy', label: 'Deposit held by', type: 'select', options: ['', 'Agent', 'Landlord', 'Scheme'] },
      { key: 'depositDueToBeReturned', label: 'Deposit due to be returned', type: 'text', placeholder: 'N/A' },
      { key: 'depositPaidDirectly', label: 'Deposit paid directly', type: 'checkbox' },
    ],
  },
  {
    heading: 'Accounts',
    fields: [
      { key: 'rentFrequency', label: 'Rent frequency', type: 'select', options: ['', '1 week', '2 weeks', '4 weeks', '1 month', 'Quarterly', '6 months', '1 year'] },
      { key: 'rentDueOn', label: 'Rent due on', type: 'date' },
      { key: 'rentOutstanding', label: 'Rent outstanding', type: 'money' },
      { key: 'floatBalance', label: 'Landlord float balance', type: 'money' },
    ],
  },
  {
    heading: 'Administration',
    fields: [
      { key: 'propertyManager', label: 'Property manager', type: 'text' },
      { key: 'branch', label: 'Branch', type: 'text' },
      { key: 'tenancyCreatedBy', label: 'Tenancy created by', type: 'text' },
    ],
  },
];

export const TENANCY_KEYS: string[] = TENANCY_GROUPS.flatMap(g => g.fields.map(f => f.key));
const BOOL_KEYS = new Set(TENANCY_GROUPS.flatMap(g => g.fields).filter(f => f.type === 'checkbox').map(f => f.key));

// Pull only the tenancy fields off a source object (property doc), dropping
// empties so the display can tell "set" from "unset".
export function pluckTenancy(src: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!src) return out;
  for (const k of TENANCY_KEYS) {
    const v = src[k];
    if (BOOL_KEYS.has(k)) { if (v === true) out[k] = true; }
    else if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

// True when a tenancy has any real data entered (so the portal can hide the
// whole block until the office fills it in).
export function hasTenancyData(t: Record<string, any> | undefined | null): boolean {
  return !!t && Object.keys(t).length > 0;
}
