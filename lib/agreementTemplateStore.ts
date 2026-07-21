// lib/agreementTemplateStore.ts
// Read/validate the admin-editable agreement wording overrides, stored as a
// single Firestore document (settings/agreementTemplate). Only legal clause
// text lives here — never service lists or fee figures. Server-only (takes an
// Admin-SDK Firestore instance).
import type { Firestore } from 'firebase-admin/firestore';
import { EDITABLE_CLAUSES, type AgreementTemplate } from '@/lib/agreementContent';

export const TEMPLATE_COLLECTION = 'settings';
export const TEMPLATE_DOC = 'agreementTemplate';

const EDITABLE_KEYS = new Set(EDITABLE_CLAUSES.map(c => c.key));
const MAX_TITLE = 160;
const MAX_PARA = 4000;
const MAX_PARAS = 40;
const MAX_INTRO = 6000;

/** Load the stored overrides, or an empty template when none has been saved. */
export async function loadAgreementTemplate(db: Firestore): Promise<AgreementTemplate> {
  try {
    const snap = await db.collection(TEMPLATE_COLLECTION).doc(TEMPLATE_DOC).get();
    if (!snap.exists) return {};
    return sanitizeTemplate(snap.data() as AgreementTemplate);
  } catch (e) {
    console.error('loadAgreementTemplate failed:', e);
    return {};
  }
}

/**
 * Validate an admin's submitted overrides: drop unknown clause keys, coerce to
 * strings, trim, cap lengths and counts, and omit any field left blank (a blank
 * field means "use the standard wording", so it must not be stored as "").
 */
export function sanitizeTemplate(raw: any): AgreementTemplate {
  const out: AgreementTemplate = {};
  if (raw && typeof raw === 'object') {
    const intro = typeof raw.intro === 'string' ? raw.intro.trim().slice(0, MAX_INTRO) : '';
    if (intro) out.intro = intro;

    const clausesIn = raw.clauses && typeof raw.clauses === 'object' ? raw.clauses : {};
    const clauses: NonNullable<AgreementTemplate['clauses']> = {};
    for (const [key, val] of Object.entries(clausesIn)) {
      if (!EDITABLE_KEYS.has(key) || !val || typeof val !== 'object') continue;
      const entry: { title?: string; paras?: string[] } = {};
      const title = typeof (val as any).title === 'string' ? (val as any).title.trim().slice(0, MAX_TITLE) : '';
      if (title) entry.title = title;
      const parasIn = Array.isArray((val as any).paras) ? (val as any).paras : [];
      const paras = parasIn
        .map((p: any) => (typeof p === 'string' ? p.trim().slice(0, MAX_PARA) : ''))
        .filter((p: string) => p.length > 0)
        .slice(0, MAX_PARAS);
      if (paras.length) entry.paras = paras;
      if (entry.title || entry.paras) clauses[key] = entry;
    }
    if (Object.keys(clauses).length) out.clauses = clauses;
  }
  return out;
}
