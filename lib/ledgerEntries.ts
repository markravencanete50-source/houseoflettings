// lib/ledgerEntries.ts
// The internal money ledger — entries staff record against a property that are
// NOT in the bank Google Sheet (adjustments, one-off fees, credits, manual
// payments, etc.). The landlord statement merges these with the live Sheet
// lines, so the Sheet is never touched. One entry = one signed transaction.
//
// Design: `amount` is stored as a positive magnitude and `direction` ('in' |
// 'out') carries the sign, so a UI can default the direction from the type but
// still allow an adjustment either way.

export type LedgerEntryType =
  | 'rent_in' | 'credit'                         // money in
  | 'management_fee' | 'payment_to_landlord' | 'finders_fee' | 'maintenance' | 'charge' // money out
  | 'adjustment' | 'other';                      // either

export const LEDGER_TYPES: { key: LedgerEntryType; label: string; direction: 'in' | 'out' }[] = [
  { key: 'rent_in', label: 'Rent received', direction: 'in' },
  { key: 'credit', label: 'Credit', direction: 'in' },
  { key: 'payment_to_landlord', label: 'Payment to landlord', direction: 'out' },
  { key: 'management_fee', label: 'Management fee', direction: 'out' },
  { key: 'finders_fee', label: 'Finders fee', direction: 'out' },
  { key: 'maintenance', label: 'Maintenance', direction: 'out' },
  { key: 'charge', label: 'Charge', direction: 'out' },
  { key: 'adjustment', label: 'Adjustment', direction: 'out' },
  { key: 'other', label: 'Other', direction: 'out' },
];

export function defaultDirection(type: string): 'in' | 'out' {
  return LEDGER_TYPES.find(t => t.key === type)?.direction || 'out';
}
export function typeLabel(type: string): string {
  return LEDGER_TYPES.find(t => t.key === type)?.label || 'Other';
}

// Signed amount for the statement: +in / −out.
export function signedAmount(e: { amount?: number; direction?: string }): number {
  const amt = Math.abs(Number(e?.amount) || 0);
  return e?.direction === 'in' ? amt : -amt;
}
