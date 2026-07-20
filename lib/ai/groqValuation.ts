// lib/ai/groqValuation.ts
// Server-only. Enriches a deterministic valuation with an AI market analysis
// via Groq's free OpenAI-compatible API (llama-3.3-70b-versatile).
//
// Design rules:
//   • The engine's numbers are the anchor. The AI may nudge the market figure
//     by at most ±8% (clamped here, never trusted raw) and writes the
//     narrative: summary, key drivers, market outlook, recommendation.
//   • No GROQ_API_KEY, a timeout, or malformed output ⇒ graceful fallback to
//     a deterministic narrative, so the report always completes.
//
// Env: GROQ_API_KEY — free key from https://console.groq.com/keys

import {
  type FullValuationInput, type FullValuationResult, type ValuationType,
  PROPERTY_TYPE_LABEL, CONDITION_LABEL, GARDEN_LABEL, PARKING_LABEL,
  bedroomsLabel, bedroomsAdjective, fmtGBP,
} from '@/lib/valuation/fullEngine';

export interface AiAnalysis {
  source: 'groq' | 'fallback';
  summary: string;
  keyDrivers: string[];
  marketOutlook: string;
  recommendation: string;
  rentCommentary?: string;
  saleCommentary?: string;
}

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 20_000;
const MAX_AI_NUDGE = 0.08; // AI may move the market figure by at most ±8%

function describeProperty(input: FullValuationInput): string {
  return [
    `${bedroomsAdjective(input.bedrooms)} ${PROPERTY_TYPE_LABEL[input.propertyType].toLowerCase()}`,
    `postcode ${input.postcode.toUpperCase()}`,
    input.addressLine1 ? `address: ${input.addressLine1}` : '',
    `${input.bathrooms} bathroom(s)`,
    `condition: ${CONDITION_LABEL[input.condition]}`,
    `EPC rating: ${input.epc}`,
    GARDEN_LABEL[input.garden].toLowerCase(),
    input.balcony ? 'with balcony' : 'no balcony',
    PARKING_LABEL[input.parking].toLowerCase(),
  ].filter(Boolean).join(', ');
}

// ─── Fallback narrative (no API key / AI failure) ────────────────────────────
export function buildFallbackAnalysis(
  input: FullValuationInput,
  result: FullValuationResult,
): AiAnalysis {
  const drivers: string[] = [
    `${bedroomsAdjective(input.bedrooms).replace(/^./, c => c.toUpperCase())} ${PROPERTY_TYPE_LABEL[input.propertyType].toLowerCase()}: the biggest single factor in the estimate`,
    `Location baseline for ${result.areaLabel} drawn from ${result.dataYear} ONS and Zoopla market data`,
  ];
  if (input.bathrooms > 1) drivers.push(`${input.bathrooms} bathrooms add a premium over the local norm`);
  if (input.condition === 'excellent' || input.condition === 'good')
    drivers.push(`Above-average condition (${CONDITION_LABEL[input.condition].split(' (')[0].toLowerCase()}) lifts achievable value`);
  if (input.condition === 'dated' || input.condition === 'renovation')
    drivers.push(`Condition (${CONDITION_LABEL[input.condition].split(' (')[0].toLowerCase()}) holds the figure back; targeted improvements would raise it`);
  if (input.epc === 'A' || input.epc === 'B' || input.epc === 'C')
    drivers.push(`A strong energy rating (${input.epc}) is increasingly rewarded by tenants and buyers`);
  if (input.epc === 'F' || input.epc === 'G')
    drivers.push(`EPC ${input.epc} is below the lettings compliance threshold; improving it protects both value and lettability`);
  if (input.garden === 'private') drivers.push('A private garden remains one of the most-searched features');
  if (input.parking === 'garage' || input.parking === 'driveway') drivers.push(`${PARKING_LABEL[input.parking]} adds meaningful value in this market`);

  const rentPart = result.rent
    ? (result.rent.annualGrowthPct !== 0
        ? `Rental demand across the ${result.regionLabel} region remains firm, with average rents ${result.rent.annualGrowthPct > 0 ? 'up' : 'down'} ${Math.abs(result.rent.annualGrowthPct)}% year on year. `
        : `Rental demand across the ${result.regionLabel} region is holding steady year on year. `)
    : '';
  const salePart = result.sale
    ? (result.sale.annualGrowthPct !== 0
        ? `Sale prices across the ${result.regionLabel} region have moved ${result.sale.annualGrowthPct > 0 ? 'up' : 'down'} ${Math.abs(result.sale.annualGrowthPct)}% over the last 12 months. `
        : `Sale prices across the ${result.regionLabel} region have held broadly flat over the last 12 months. `)
    : '';

  return {
    source: 'fallback',
    summary: `Based on ${result.dataYear} market data for ${result.areaLabel}, this ${bedroomsAdjective(input.bedrooms)} ${PROPERTY_TYPE_LABEL[input.propertyType].toLowerCase()} sits ${result.rent ? `around ${fmtGBP(result.rent.market)} per month on the rental market` : ''}${result.rent && result.sale ? ' and ' : ''}${result.sale ? `around ${fmtGBP(result.sale.market)} as a sale` : ''}. The figures below show a conservative-to-optimistic band reflecting normal market uncertainty.`,
    keyDrivers: drivers.slice(0, 5),
    marketOutlook: `${rentPart}${salePart}These estimates are anchored to district-level averages${result.isOperatingArea ? ` for ${result.areaLabel}` : ` for the wider ${result.regionLabel} region`}, adjusted for this property's type, size, condition and features.`,
    recommendation: 'An automated estimate is a strong starting point, but pricing precisely, especially before a rent review or listing, benefits from a local expert seeing the property. Book a free professional valuation and we will confirm the figure in person.',
    ...(result.rent ? { rentCommentary: `A realistic asking rent is ${fmtGBP(result.rent.market)} per month. Start conservative at ${fmtGBP(result.rent.conservative)} to let quickly, or test ${fmtGBP(result.rent.optimistic)} if the property presents particularly well.` } : {}),
    ...(result.sale ? { saleCommentary: `A realistic marketing price is ${fmtGBP(result.sale.market)}. ${fmtGBP(result.sale.conservative)} positions for a fast sale; ${fmtGBP(result.sale.optimistic)} is achievable in a competitive bidding situation.` } : {}),
  };
}

// ─── Groq call ───────────────────────────────────────────────────────────────
interface GroqRefinement {
  analysis: AiAnalysis;
  rentAdjustPct: number; // clamped, 0 when absent
  saleAdjustPct: number;
}

export async function getAiAnalysis(
  input: FullValuationInput,
  result: FullValuationResult,
  type: ValuationType,
): Promise<GroqRefinement> {
  const fallback: GroqRefinement = {
    analysis: buildFallbackAnalysis(input, result),
    rentAdjustPct: 0,
    saleAdjustPct: 0,
  };
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallback;

  const figures = [
    result.rent && `Rent estimate: conservative ${fmtGBP(result.rent.conservative)}/mo, market ${fmtGBP(result.rent.market)}/mo, optimistic ${fmtGBP(result.rent.optimistic)}/mo (area baseline ${fmtGBP(result.rent.baseline)}/mo, regional rent growth ${result.rent.annualGrowthPct}% YoY)`,
    result.sale && `Sale estimate: conservative ${fmtGBP(result.sale.conservative)}, market ${fmtGBP(result.sale.market)}, optimistic ${fmtGBP(result.sale.optimistic)} (area baseline ${fmtGBP(result.sale.baseline)}, regional price growth ${result.sale.annualGrowthPct}% YoY)`,
  ].filter(Boolean).join('\n');

  const prompt = `You are a senior UK lettings and sales valuer writing the analysis section of an instant valuation report for a property owner. Be specific, factual and professional. British English. No hype, no exclamation marks, no em dashes.

PROPERTY: ${describeProperty(input)}
LOCATION: ${result.areaLabel} (${result.regionLabel}). Data year ${result.dataYear}.
ALGORITHMIC ESTIMATES (from district/regional averages adjusted for the property's features):
${figures}

Respond with ONLY a JSON object with these keys:
- "summary": 2-3 sentences summarising the valuation for this specific property.
- "keyDrivers": array of 4-5 short strings, each one concrete factor driving this property's value (location, size, condition, EPC, features).
- "marketOutlook": 2-3 sentences on the current ${result.regionLabel} market relevant to this property (rents/prices direction, demand).
- "recommendation": 1-2 sentences of practical next-step advice for the owner.
${type !== 'sale' ? '- "rentCommentary": 2 sentences advising how to position the asking rent within the band.\n- "rentAdjustPct": number between -8 and 8: your % adjustment to the market rent figure if the algorithmic estimate looks off for this property profile, else 0.' : ''}
${type !== 'let' ? '- "saleCommentary": 2 sentences advising how to position the asking price within the band.\n- "saleAdjustPct": number between -8 and 8: your % adjustment to the market sale figure if the algorithmic estimate looks off for this property profile, else 0.' : ''}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error('Groq API error:', res.status, await res.text().catch(() => ''));
      return fallback;
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content);

    const clampPct = (v: unknown) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.max(-MAX_AI_NUDGE, Math.min(MAX_AI_NUDGE, n / 100));
    };
    const str = (v: unknown, fb: string) => (typeof v === 'string' && v.trim() ? v.trim() : fb);
    const arr = (v: unknown, fb: string[]) =>
      Array.isArray(v) && v.length ? v.map(String).filter(Boolean).slice(0, 5) : fb;

    return {
      analysis: {
        source: 'groq',
        summary:        str(parsed.summary, fallback.analysis.summary),
        keyDrivers:     arr(parsed.keyDrivers, fallback.analysis.keyDrivers),
        marketOutlook:  str(parsed.marketOutlook, fallback.analysis.marketOutlook),
        recommendation: str(parsed.recommendation, fallback.analysis.recommendation),
        ...(result.rent ? { rentCommentary: str(parsed.rentCommentary, fallback.analysis.rentCommentary || '') } : {}),
        ...(result.sale ? { saleCommentary: str(parsed.saleCommentary, fallback.analysis.saleCommentary || '') } : {}),
      },
      rentAdjustPct: clampPct(parsed.rentAdjustPct),
      saleAdjustPct: clampPct(parsed.saleAdjustPct),
    };
  } catch (err) {
    console.error('Groq analysis failed, using fallback:', err);
    return fallback;
  }
}
