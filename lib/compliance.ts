// lib/compliance.ts
// Shared, framework-free compliance metadata + status helper used by the portal
// Compliance panel (client), the compliance API, and the reminder cron.
// The five required documents for a let property. The Landlord (agency)
// Agreement is NOT in this list — it is held by House of Lettings automatically
// (the signed agreement between HoL and the landlord), so the landlord never
// uploads it and it does not expire.

export type ComplianceType = 'gas' | 'epc' | 'eicr' | 'insurance';

export const COMPLIANCE_TYPES: { id: ComplianceType; label: string; desc: string }[] = [
  { id: 'gas', label: 'Gas Safety Certificate', desc: 'Annual check of all gas appliances and flues, where gas is present.' },
  { id: 'epc', label: 'Energy Performance Certificate (EPC)', desc: 'Must be rated E or above. Usually valid for 10 years.' },
  { id: 'eicr', label: 'Electrical Report (EICR)', desc: 'Electrical Installation Condition Report, renewed at least every 5 years.' },
  { id: 'insurance', label: 'Landlord Insurance', desc: 'Buildings and/or landlord liability insurance for the property.' },
];

export const COMPLIANCE_TYPE_MAP: Record<string, { id: ComplianceType; label: string; desc: string }> =
  Object.fromEntries(COMPLIANCE_TYPES.map(t => [t.id, t]));

export function isComplianceType(v: unknown): v is ComplianceType {
  return v === 'gas' || v === 'epc' || v === 'eicr' || v === 'insurance';
}

export type ComplianceStatusKey = 'missing' | 'valid' | 'expiring' | 'expired';

// How many days before expiry we start warning / emailing.
export const COMPLIANCE_WARN_DAYS = 30;

// Days until the certificate expires (null when no expiry date is set).
export function daysUntil(expiryDate?: string | null): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiryDate}T00:00:00`);
  if (isNaN(exp.getTime())) return null;
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

export function complianceStatus(expiryDate?: string | null, hasFile?: boolean): {
  key: ComplianceStatusKey; label: string; daysLeft: number | null;
} {
  const d = daysUntil(expiryDate);
  if (!hasFile && d == null) return { key: 'missing', label: 'Not uploaded', daysLeft: null };
  if (d == null) return { key: 'valid', label: 'Uploaded (no expiry set)', daysLeft: null };
  if (d < 0) return { key: 'expired', label: 'Expired', daysLeft: d };
  if (d <= COMPLIANCE_WARN_DAYS) return { key: 'expiring', label: `Expires in ${d} day${d === 1 ? '' : 's'}`, daysLeft: d };
  return { key: 'valid', label: 'Valid', daysLeft: d };
}
