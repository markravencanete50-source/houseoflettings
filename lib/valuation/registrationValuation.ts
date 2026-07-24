// lib/valuation/registrationValuation.ts
// Server-only. Turns the property details a landlord fills in during
// registration into an automatic AI-assisted valuation (rent + sale), for the
// OFFICE to review before it's ever shared with the landlord.
//
// It reuses the same deterministic engine + Groq AI layer as the public Instant
// Valuation tool, so the numbers are consistent across the business. The only
// new work here is mapping the registration's free-text option labels
// ("Semi-detached house", "Needs some work", …) onto the engine's enum ids, and
// composing an internal e-mail that lists every registered property.
//
// Everything is best-effort: a missing GROQ_API_KEY, an unrecognised postcode or
// a Groq timeout must never affect the registration itself.

import {
  computeFullValuation, isValidUKPostcode, normalisePostcode,
  PROPERTY_TYPE_LABEL, CONDITION_LABEL, PARKING_LABEL, bedroomsLabel, fmtGBP,
  type FullValuationInput, type FullValuationResult, type ModeValuation,
  type PropertyTypeId, type ConditionId, type ParkingId, type FurnishingId,
} from './fullEngine';
import { getAiAnalysis, type AiAnalysis } from '@/lib/ai/groqValuation';
import { escapeHtml } from '@/lib/security';

const MAX_PROPERTIES = 6; // guardrail against a pathological submission

export interface RegistrationValuation {
  address: string;
  statedRent: string;      // what the landlord said the current rent is, if any
  input: FullValuationInput;
  result: FullValuationResult;
  ai: AiAnalysis;
}

// ─── Registration label → engine enum mappers ────────────────────────────────
function mapPropertyType(raw: string): PropertyTypeId {
  const s = (raw || '').toLowerCase();
  if (s.includes('semi')) return 'semi';
  if (s.includes('detached')) return 'detached';
  if (s.includes('terrace')) return 'terraced';
  if (s.includes('bungalow')) return 'bungalow';
  if (/(flat|apartment|maisonette|studio|room|hmo|share)/.test(s)) return 'flat';
  return 'terraced'; // "Other"/blank → neutral mid-market default
}

function mapBedrooms(rawBedrooms: string, rawType: string): number {
  if (/studio/i.test(rawType || '')) return 0;
  const n = parseInt(String(rawBedrooms || ''), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(12, n)) : 2; // default: modal 2-bed
}

function mapBathrooms(raw: string): number {
  const n = parseInt(String(raw || ''), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(10, n) : 1;
}

function mapCondition(raw: string): ConditionId {
  const s = (raw || '').toLowerCase();
  if (s.includes('needs full') || s.includes('full refurb')) return 'renovation';
  if (s.includes('needs some') || s.includes('some work')) return 'dated';
  if (s.includes('newly') || s.includes('new build') || s.includes('refurbished')) return 'excellent';
  if (s.includes('excellent')) return 'excellent';
  if (s.includes('good')) return 'good';
  return 'average'; // "Fair"/blank
}

function mapParking(raw: string): ParkingId {
  const s = (raw || '').toLowerCase();
  if (s.includes('garage')) return 'garage';
  if (s.includes('driveway')) return 'driveway';
  if (s.includes('allocated')) return 'allocated';
  if (s.includes('permit')) return 'permit';
  if (s.includes('on-street') || s.includes('on street')) return 'on_street';
  return 'none';
}

function mapFurnishing(raw: string): FurnishingId | undefined {
  const s = (raw || '').toLowerCase();
  if (s.includes('part')) return 'part-furnished';
  if (s.includes('unfurnished')) return 'unfurnished';
  if (s.includes('furnished')) return 'furnished';
  return undefined;
}

function addressOf(p: any): string {
  return [p?.flatNumber, p?.street, p?.city, p?.postcode].filter(Boolean).join(', ');
}

// Build the engine input for one registration property, or null if it has no
// usable UK postcode (a valuation without a location would be meaningless).
export function propertyToValuationInput(p: any): FullValuationInput | null {
  const postcode = String(p?.postcode || '').trim();
  if (!isValidUKPostcode(postcode)) return null;
  const rawType = String(p?.propertyType || '');
  return {
    postcode: normalisePostcode(postcode),
    addressLine1: [p?.flatNumber, p?.street].filter(Boolean).join(' ').slice(0, 120) || undefined,
    propertyType: mapPropertyType(rawType),
    bedrooms: mapBedrooms(p?.bedrooms, rawType),
    bathrooms: mapBathrooms(p?.bathrooms),
    condition: mapCondition(p?.condition),
    epc: 'unknown',           // registration records EPC as a document, not a grade
    garden: 'none',           // not collected at registration
    balcony: false,           // not collected at registration
    parking: mapParking(p?.parking),
    ...(mapFurnishing(p?.furnishing) ? { furnishing: mapFurnishing(p?.furnishing) as FurnishingId } : {}),
  };
}

// AI-nudge application, identical to the public report route so figures match.
function applyNudge(mode: ModeValuation | undefined, pct: number): ModeValuation | undefined {
  if (!mode || !pct) return mode;
  const step = mode.mode === 'sale' ? 2500 : 5;
  const r = (n: number) => Math.round((n * (1 + pct)) / step) * step;
  return {
    ...mode,
    conservative: r(mode.conservative), market: r(mode.market), optimistic: r(mode.optimistic),
    trajectory: mode.trajectory.map(t => ({ ...t, value: r(t.value) })),
  };
}

// Every property a registration carries (the modern array, or a legacy flat
// single-property record).
function propertiesOf(data: any): any[] {
  if (Array.isArray(data?.properties) && data.properties.length) return data.properties.slice(0, MAX_PROPERTIES);
  // Legacy single-property shape — assemble one pseudo-property from flat fields.
  const single = {
    postcode: data?.postcode, street: data?.street || data?.address, city: data?.city, flatNumber: data?.flatNumber,
    propertyType: data?.propertyType, bedrooms: data?.bedrooms, bathrooms: data?.bathrooms,
    furnishing: data?.furnishing, parking: data?.parking, condition: data?.condition, currentRent: data?.currentRent,
  };
  return single.postcode ? [single] : [];
}

// Valuate every registered property (rent + sale). Returns the valuations plus
// the addresses skipped for want of a valid postcode. Best-effort throughout.
export async function valuateRegistration(
  data: any,
): Promise<{ valuations: RegistrationValuation[]; skipped: string[] }> {
  const props = propertiesOf(data);
  const skipped: string[] = [];

  const jobs = props.map(async (p): Promise<RegistrationValuation | null> => {
    const input = propertyToValuationInput(p);
    if (!input) { skipped.push(addressOf(p) || String(p?.postcode || 'unknown address')); return null; }
    const result = computeFullValuation(input, 'both');
    const { analysis, rentAdjustPct, saleAdjustPct } = await getAiAnalysis(input, result, 'both');
    return {
      address: addressOf(p) || input.postcode,
      statedRent: p?.currentRent ? `£${p.currentRent}/month` : '',
      input,
      result: { ...result, rent: applyNudge(result.rent, rentAdjustPct), sale: applyNudge(result.sale, saleAdjustPct) },
      ai: analysis,
    };
  });

  const settled = await Promise.all(jobs);
  return { valuations: settled.filter(Boolean) as RegistrationValuation[], skipped };
}

// ─── Internal office e-mail ───────────────────────────────────────────────────
function bandRow(mode: ModeValuation | undefined, title: string, suffix: string): string {
  if (!mode) return '';
  return `<tr><td style="padding:10px 14px;font-weight:600;color:#6b7280;width:34%;">${title}</td>
    <td style="padding:10px 14px;color:#111;">
      <strong style="color:#0f1f3d;font-size:16px;">${fmtGBP(mode.market)}${suffix}</strong>
      <span style="color:#6b7280;font-size:12.5px;"> &nbsp;(range ${fmtGBP(mode.conservative)}${suffix} – ${fmtGBP(mode.optimistic)}${suffix})</span>
    </td></tr>`;
}

function valuationCard(v: RegistrationValuation): string {
  const { input, result, ai, address, statedRent } = v;
  const spec = `${bedroomsLabel(input.bedrooms)} · ${PROPERTY_TYPE_LABEL[input.propertyType]} · ${input.bathrooms} bath · ${CONDITION_LABEL[input.condition].split(' (')[0]} · ${PARKING_LABEL[input.parking]}`;
  const drivers = ai.keyDrivers.slice(0, 4).map(d => `<li style="margin-bottom:5px;">${d}</li>`).join('');
  // Flag where the AI rent estimate diverges from the landlord's stated rent.
  let rentCompare = '';
  if (result.rent && statedRent) {
    const stated = Number(String(statedRent).replace(/[^\d.]/g, ''));
    if (Number.isFinite(stated) && stated > 0) {
      // diff > 0 ⇒ the market estimate sits ABOVE the landlord's stated rent.
      const diff = Math.round(((result.rent.market - stated) / stated) * 100);
      const dirn = diff > 0 ? 'above' : diff < 0 ? 'below' : 'in line with';
      rentCompare = `<p style="margin:8px 0 0;font-size:13px;color:${Math.abs(diff) >= 10 ? '#b45309' : '#6b7280'};">Landlord's stated rent is <strong>${escapeHtml(statedRent)}</strong> — the estimate is ${Math.abs(diff)}% ${dirn} it.</p>`;
    }
  }
  return `
  <div style="border:1px solid #e4e9f2;border-radius:12px;overflow:hidden;margin:0 0 20px;">
    <div style="background:#0f1f3d;padding:14px 18px;color:#fff;">
      <div style="font-size:15px;font-weight:800;">${escapeHtml(address)}</div>
      <div style="font-size:12.5px;color:#c7d6ef;margin-top:3px;">${result.areaLabel}${result.isOperatingArea ? '' : ' · regional estimate (outside operating area)'}</div>
    </div>
    <div style="padding:6px 4px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${bandRow(result.rent, 'Estimated rent', '/mo')}
        ${bandRow(result.sale, 'Estimated sale price', '')}
      </table>
    </div>
    <div style="padding:12px 18px;border-top:1px solid #eef1f5;">
      <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">As registered</div>
      <div style="font-size:13px;color:#374151;">${spec}</div>
      ${rentCompare}
      <div style="font-size:13.5px;color:#374151;line-height:1.6;margin-top:12px;">${ai.summary}</div>
      ${drivers ? `<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:#374151;">${drivers}</ul>` : ''}
    </div>
  </div>`;
}

export function registrationValuationEmailHtml(
  data: any,
  valuations: RegistrationValuation[],
  skipped: string[],
): string {
  const who = escapeHtml(data?.companyName || data?.fullName || 'Landlord');
  const aiLive = valuations.some(v => v.ai.source === 'groq');
  const cards = valuations.map(valuationCard).join('');
  const skippedBlock = skipped.length
    ? `<p style="font-size:13px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin:0 0 16px;">No valuation for: ${skipped.map(escapeHtml).join('; ')} — the postcode wasn't recognised as a valid UK postcode.</p>`
    : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f9;margin:0;padding:0;">
    <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
      <div style="background:linear-gradient(135deg,#0f1f3d,#2563a8);padding:30px 36px;color:#fff;">
        <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.75;">Internal · for review before sharing</div>
        <h1 style="margin:6px 0 0;font-size:21px;font-weight:800;">AI property valuation — ${who}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#cfe0f5;">Generated automatically from the registration details · ${new Date().toLocaleString('en-GB')}</p>
      </div>
      <div style="padding:26px 36px;">
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 18px;">
          A new landlord registration was submitted and automatically valued below (rent &amp; sale). These figures were <strong>not</strong> sent to the landlord — review them first, then share or book a professional valuation as appropriate.
        </p>
        ${skippedBlock}
        ${cards || '<p style="font-size:14px;color:#6b7280;">No property had a recognisable UK postcode, so no valuation could be produced.</p>'}
        <p style="font-size:11.5px;color:#9ca3af;line-height:1.6;margin:18px 0 0;">
          ${aiLive ? 'Analysis by Groq AI' : 'AI unavailable — deterministic estimate used'}, anchored to the House of Lettings valuation engine (${valuations[0]?.result.dataYear || ''} market data). Automated and indicative only — not a formal valuation.
        </p>
      </div>
    </div>
  </body></html>`;
}
