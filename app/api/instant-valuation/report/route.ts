// app/api/instant-valuation/report/route.ts
// Generates the instant valuation report: deterministic engine (all-UK
// postcode coverage) + AI market analysis via Groq (free tier), with a
// deterministic fallback so the report always completes. No contact details
// are required — emailing the PDF is a separate, optional step.

import { rateLimit } from '@/lib/rateLimit';
import {
  computeFullValuation, isValidUKPostcode, normalisePostcode,
  type FullValuationInput, type ValuationType, type ModeValuation,
} from '@/lib/valuation/fullEngine';
import { getAiAnalysis } from '@/lib/ai/groqValuation';

const PROPERTY_TYPES = ['flat', 'terraced', 'semi', 'detached', 'bungalow'];
const CONDITIONS     = ['excellent', 'good', 'average', 'dated', 'renovation'];
const EPCS           = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'unknown'];
const GARDENS        = ['private', 'shared', 'patio', 'none'];
const PARKINGS       = ['garage', 'driveway', 'allocated', 'permit', 'on_street', 'none'];
const FURNISHINGS    = ['furnished', 'part-furnished', 'unfurnished'];
const TYPES          = ['let', 'sale', 'both'];

function applyNudge(mode: ModeValuation | undefined, pct: number): ModeValuation | undefined {
  if (!mode || !pct) return mode;
  const step = mode.mode === 'sale' ? 2500 : 5;
  const r = (n: number) => Math.round((n * (1 + pct)) / step) * step;
  return {
    ...mode,
    conservative: r(mode.conservative),
    market:       r(mode.market),
    optimistic:   r(mode.optimistic),
    trajectory:   mode.trajectory.map((p) => ({ ...p, value: r(p.value) })),
  };
}

export async function POST(request: Request) {
  const limited = rateLimit(request, 'instant-valuation-report', 15, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const type = String(body.type || '') as ValuationType;
    const postcode = String(body.postcode || '').trim();
    const bedrooms = Number(body.bedrooms);
    const bathrooms = Number(body.bathrooms);

    if (!TYPES.includes(type)) return Response.json({ message: 'Invalid valuation type' }, { status: 400 });
    if (!isValidUKPostcode(postcode)) return Response.json({ message: 'Please enter a valid UK postcode.' }, { status: 400 });
    if (!PROPERTY_TYPES.includes(body.propertyType)) return Response.json({ message: 'Invalid property type' }, { status: 400 });
    if (!Number.isFinite(bedrooms) || bedrooms < 0 || bedrooms > 12) return Response.json({ message: 'Invalid bedrooms' }, { status: 400 });
    if (!Number.isFinite(bathrooms) || bathrooms < 1 || bathrooms > 10) return Response.json({ message: 'Invalid bathrooms' }, { status: 400 });
    if (!CONDITIONS.includes(body.condition)) return Response.json({ message: 'Invalid condition' }, { status: 400 });
    if (!EPCS.includes(body.epc)) return Response.json({ message: 'Invalid EPC rating' }, { status: 400 });
    if (!GARDENS.includes(body.garden)) return Response.json({ message: 'Invalid garden option' }, { status: 400 });
    if (!PARKINGS.includes(body.parking)) return Response.json({ message: 'Invalid parking option' }, { status: 400 });
    // Furnishing is optional — validate only when provided.
    if (body.furnishing != null && body.furnishing !== '' && !FURNISHINGS.includes(body.furnishing))
      return Response.json({ message: 'Invalid furnishing option' }, { status: 400 });

    const input: FullValuationInput = {
      postcode: normalisePostcode(postcode),
      addressLine1: String(body.addressLine1 || '').trim().slice(0, 120) || undefined,
      propertyType: body.propertyType,
      bedrooms,
      bathrooms,
      condition: body.condition,
      epc: body.epc,
      garden: body.garden,
      balcony: Boolean(body.balcony),
      parking: body.parking,
      ...(FURNISHINGS.includes(body.furnishing) ? { furnishing: body.furnishing } : {}),
    };

    const result = computeFullValuation(input, type);
    const { analysis, rentAdjustPct, saleAdjustPct } = await getAiAnalysis(input, result, type);

    const report = {
      property: input,
      type,
      result: {
        ...result,
        rent: applyNudge(result.rent, rentAdjustPct),
        sale: applyNudge(result.sale, saleAdjustPct),
      },
      ai: analysis,
      generatedAt: new Date().toISOString(),
    };

    return Response.json({ report }, { status: 200 });
  } catch (error) {
    console.error('instant-valuation report error:', error);
    return Response.json({ message: 'Could not generate the valuation right now. Please try again.' }, { status: 500 });
  }
}
