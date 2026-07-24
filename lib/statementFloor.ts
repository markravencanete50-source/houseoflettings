// lib/statementFloor.ts
// Go-live floor for the landlord account: the statement (and the sheet→ledger
// mirror) only ever consider transactions on or after this date. Anything before
// it — all of 2025 and Jan–May 2026 — is excluded everywhere: not shown on a
// statement, not imported into the ledger, not counted in reconciliation.
// Client-safe (no server imports).
export const STATEMENT_FLOOR_ISO = '2026-06-01';
export const STATEMENT_FLOOR_MS = new Date(`${STATEMENT_FLOOR_ISO}T00:00:00`).getTime();
