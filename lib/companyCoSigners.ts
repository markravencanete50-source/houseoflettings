// lib/companyCoSigners.ts
// Company registrations are signed on-device by the Managing Director (the first
// person in Owners & Officers). Every OTHER director/officer with an email is a
// "co-signer": they're emailed a secure link to review, provide their own ID +
// documents, and sign — the same journey the individual joint landlord takes.
// Co-signers live in a `coSigners` array on the landlordAgreements doc.
import { randomBytes } from 'node:crypto';
import { sendAgreementEmail } from '@/lib/agreementDocuments';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';
export const CO_SIGNER_TTL_MS = 14 * 24 * 60 * 60 * 1000; // links valid 14 days

export type CoSigner = {
  id: string; name: string; email: string; role: string;
  token: string; status: 'pending' | 'completed' | 'declined';
};

export function generateCoSignerToken(): string {
  return randomBytes(24).toString('hex');
}

// Build one co-signer per Owners & Officers person AFTER the managing director
// (index 0) who has a valid email.
export function buildCoSigners(companyPeople: any[]): CoSigner[] {
  if (!Array.isArray(companyPeople)) return [];
  return companyPeople
    .slice(1)
    .filter(p => p?.email && String(p.email).includes('@'))
    .map((p, i) => ({
      id: `cs${i}`,
      name: (p.name || '').toString().trim(),
      email: String(p.email).trim(),
      role: (p.role || '').toString().trim(),
      token: generateCoSignerToken(),
      status: 'pending' as const,
    }));
}

export function coSignerLink(id: string, token: string): string {
  return `${SITE_URL}/landlord-registration/joint?id=${id}&token=${token}&kind=director`;
}

function shell(headline: string, inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(10,22,47,.12);">
      <div style="background:linear-gradient(135deg,#0a162f,#14294f 55%,#2563eb 170%);padding:36px 40px;color:#fff;">
        <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.7;">House of Lettings</div>
        <div style="font-size:23px;font-weight:800;margin-top:6px;">${headline}</div>
      </div>
      <div style="padding:34px 40px;color:#26303f;font-size:15px;line-height:1.7;">${inner}</div>
      <div style="background:#f6f8fc;padding:20px 40px;text-align:center;font-size:12px;color:#9aa4b2;">© ${new Date().getFullYear()} House of Lettings Ltd · Leeds &amp; Manchester</div>
    </div>
  </body></html>`;
}

export function coSignerInviteHtml(opts: { signerName: string; companyName: string; managingDirector: string; packageLabel: string; propertyAddress: string; link: string }): string {
  const first = (opts.signerName || 'there').split(' ')[0];
  return shell('You’re a signatory on a company registration', `
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;"><strong>${opts.companyName || 'The company'}</strong> has registered with House of Lettings under the <strong>${opts.packageLabel}</strong> package${opts.propertyAddress ? ` for <strong>${opts.propertyAddress}</strong>` : ''}, with <strong>${opts.managingDirector || 'the managing director'}</strong> as the managing director and main point of contact. As a director/officer, you're asked to review and sign the agreement.</p>
    <p style="margin:0 0 16px;">If you accept, we'll ask for your ID, proof of address and proof of ownership, then show you the agreement to sign. If you decline, the registration will be voided and the managing director will be notified.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:15px 42px;border-radius:10px;">Review &amp; respond →</a>
    </div>
    <p style="margin:0;color:#9aa4b2;font-size:13px;">This secure link expires in 14 days and can be used once. If you weren't expecting this, please ignore this email or let us know.</p>
  `);
}

export function coSignerDeclinedHtml(opts: { toDirector: string; signerName: string; companyName: string; packageLabel: string; propertyAddress: string; toOffice?: boolean }): string {
  const who = `<strong>${opts.signerName}</strong>`;
  const greet = opts.toOffice ? '' : `<p style="margin:0 0 16px;">Hi <strong>${(opts.toDirector || 'there').split(' ')[0]}</strong>,</p>`;
  return shell('A director declined — registration voided', `
    ${greet}
    <p style="margin:0 0 16px;">${who}, a director/officer of <strong>${opts.companyName || 'the company'}</strong>, has <strong>declined</strong> to sign the ${opts.packageLabel} registration${opts.propertyAddress ? ` for <strong>${opts.propertyAddress}</strong>` : ''}.</p>
    <p style="margin:0 0 16px;">As all named directors must sign, this registration has been <strong>voided</strong> and no agreement will take effect.${opts.toOffice ? '' : ' If this is unexpected, please contact us.'}</p>
    <p style="margin:0;color:#9aa4b2;font-size:13px;">If you have any questions, just reply to this email.</p>
  `);
}

// Email every co-signer their invite. Returns { ok, error }: ok only if every
// invite was accepted by the provider, so a single-director reminder can surface
// a real delivery failure. Bulk callers (registration) can ignore the result.
export async function sendCoSignerInvites(opts: {
  id: string; coSigners: CoSigner[]; companyName: string; managingDirector: string; packageLabel: string; propertyAddress: string;
}): Promise<{ ok: boolean; error?: string }> {
  const results = await Promise.all(opts.coSigners.map(cs =>
    sendAgreementEmail({
      to: cs.email,
      subject: `✍️ Please review and sign — ${opts.companyName || 'company'} registration | House of Lettings`,
      html: coSignerInviteHtml({
        signerName: cs.name, companyName: opts.companyName, managingDirector: opts.managingDirector,
        packageLabel: opts.packageLabel, propertyAddress: opts.propertyAddress, link: coSignerLink(opts.id, cs.token),
      }),
    }).catch((e): { ok: boolean; error?: string } => ({ ok: false, error: e?.message || 'Email send failed.' })),
  ));
  const failed = results.find(r => !r.ok);
  return failed ? { ok: false, error: failed.error } : { ok: true };
}
