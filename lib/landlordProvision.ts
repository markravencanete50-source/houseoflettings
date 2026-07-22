// lib/landlordProvision.ts
// Turns a signed landlord registration into a portal login. Called from
// /api/landlord-registration after the agreement is written, and from
// /api/landlord/activate when an existing landlord requests access.
//
// Design rules (a landlord NEVER self-registers an account):
//   • New registration  → we create the Firebase Auth user with a random temp
//     password, email it, and force a reset on first sign-in (mustResetPassword).
//   • Repeat registration on an email that already has a landlord account → we
//     link the new agreement + postcodes onto the existing account. No second
//     account, no new password.
//   • Everything here is best-effort and swallows its own errors: provisioning a
//     login must never fail (or roll back) the registration itself.
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { randomBytes, randomInt } from 'node:crypto';
import { normalisePostcode } from './portalMatch';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.houseoflettings.uk';

// Every postcode a registration touches, normalised (UPPER, no space) — this is
// the key the portal scopes applications/maintenance/listings by.
export function postcodesFromAgreement(data: any): string[] {
  const set = new Set<string>();
  const push = (raw: unknown) => {
    const pc = normalisePostcode(String(raw || ''));
    if (pc) set.add(pc);
  };
  const props = Array.isArray(data?.properties) ? data.properties : [];
  for (const p of props) {
    push(p?.postcode);
    // Fall back to scanning the composed address when the postcode field is blank.
    if (!p?.postcode) push([p?.flatNumber, p?.street, p?.city, p?.postcode].filter(Boolean).join(' '));
  }
  push(data?.postcode); // legacy single-property field
  push(data?.address);
  return Array.from(set);
}

// Readable temp password: no 0/O/1/l/I ambiguity, plus a symbol + digits so it
// clears any future password policy. ~12 chars of entropy from crypto.
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  let core = '';
  for (let i = 0; i < 10; i++) core += chars[bytes[i] % chars.length];
  return `${core}#${randomInt(10, 99)}`;
}

type Attachment = { filename: string; content: string };
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) { console.warn('landlordProvision: RESEND_API_KEY missing, email skipped'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'onboarding@resend.dev', to, subject, html }),
  });
  if (!res.ok) console.error('landlordProvision email failed:', await res.json().catch(() => ({})));
}

function shell(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;padding:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(10,22,47,.12);">
      <div style="background:linear-gradient(135deg,#0a162f 0%,#14294f 55%,#c0392b 160%);padding:38px 40px;color:#fff;">
        <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.7;">House of Lettings</div>
        <div style="font-size:24px;font-weight:800;margin-top:6px;">Landlord Portal</div>
      </div>
      <div style="padding:34px 40px;color:#26303f;font-size:15px;line-height:1.7;">${inner}</div>
      <div style="background:#f6f8fc;padding:20px 40px;text-align:center;font-size:12px;color:#9aa4b2;">
        © ${new Date().getFullYear()} House of Lettings Ltd · Leeds &amp; Manchester
      </div>
    </div>
  </body></html>`;
}

function credentialsEmailHtml(name: string, email: string, tempPassword: string): string {
  const first = (name || 'there').split(' ')[0];
  return shell(`
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">Your landlord registration is complete and your secure <strong>Landlord Portal</strong> account is ready. From the portal you can track your registered properties, tenant applications and maintenance requests in one place.</p>
    <div style="background:#f6f8fc;border:1px solid #e4e9f2;border-radius:14px;padding:22px 24px;margin:22px 0;">
      <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a94a3;margin-bottom:14px;">Your login details</div>
      <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eceff5;">
        <span style="color:#6b7280;">Email</span><span style="font-weight:700;color:#0a162f;">${email}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 0;">
        <span style="color:#6b7280;">Temporary password</span>
        <span style="font-weight:800;color:#c0392b;font-family:'Courier New',monospace;letter-spacing:1px;">${tempPassword}</span>
      </div>
    </div>
    <div style="text-align:center;margin:26px 0;">
      <a href="${SITE_URL}/landlord-login" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;font-weight:700;padding:15px 40px;border-radius:10px;letter-spacing:.03em;">Log in to your portal →</a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">🔒 For your security you'll be asked to set your own password the first time you sign in. This temporary password stops working once you do.</p>
    <p style="margin:14px 0 0;color:#9aa4b2;font-size:13px;">You don't need to register again — always use the login link above. If you didn't request this, please contact us.</p>
  `);
}

function linkedEmailHtml(name: string): string {
  const first = (name || 'there').split(' ')[0];
  return shell(`
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">Good news — your latest property registration has been added to your existing <strong>Landlord Portal</strong> account. There's nothing new to set up; just sign in with the details you already use.</p>
    <div style="text-align:center;margin:26px 0;">
      <a href="${SITE_URL}/landlord-login" style="display:inline-block;background:#0a162f;color:#fff;text-decoration:none;font-weight:700;padding:15px 40px;border-radius:10px;">Open your portal →</a>
    </div>
    <p style="margin:0;color:#9aa4b2;font-size:13px;">Forgotten your password? Use “Reset it” on the login page.</p>
  `);
}

type ProvisionResult = { uid: string; created: boolean };

// Ensure a landlord Auth user + users doc exist for this registration, link the
// agreement + postcodes, and email the right message. Never throws.
export async function provisionLandlordForAgreement(
  db: Firestore,
  agreementId: string,
  data: any,
  opts: { isNewRegistration: boolean } = { isNewRegistration: true },
): Promise<ProvisionResult | null> {
  try {
    const email = String(data?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return null;
    const name = (data?.companyName || data?.fullName || 'Landlord').toString().trim();
    const phone = (data?.phone || '').toString().trim();
    const postcodes = postcodesFromAgreement(data);

    const auth = getAuth();
    let uid: string;
    let created = false;
    let tempPassword = '';

    try {
      uid = (await auth.getUserByEmail(email)).uid;
    } catch {
      tempPassword = generatePassword();
      uid = (await auth.createUser({ email, password: tempPassword, displayName: name, emailVerified: false })).uid;
      created = true;
    }

    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        name, email, role: 'landlord', phone,
        landlordAgreementIds: [agreementId],
        landlordPostcodes: postcodes,
        mustResetPassword: created, // only forced when WE issued the temp password
        accountProvisionedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      const existing = snap.data() || {};
      // Only ever manage a landlord (or role-less) doc — never downgrade a
      // staff/admin who happens to have registered a property under this email.
      if (existing.role === 'landlord' || existing.role === undefined) {
        const updates: Record<string, unknown> = {
          role: 'landlord',
          name: existing.name || name,
          phone: existing.phone || phone,
          landlordAgreementIds: FieldValue.arrayUnion(agreementId),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (postcodes.length) updates.landlordPostcodes = FieldValue.arrayUnion(...postcodes);
        await userRef.set(updates, { merge: true });
      }
    }

    // Back-link the agreement so staff/admin can see the account is live.
    await db.collection('landlordAgreements').doc(agreementId).set(
      { landlordUid: uid, accountProvisioned: true, accountProvisionedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    if (created && tempPassword) {
      await sendEmail({
        to: email,
        subject: '🔑 Your House of Lettings Landlord Portal login',
        html: credentialsEmailHtml(name, email, tempPassword),
      });
    } else if (opts.isNewRegistration) {
      // Existing account + a brand-new registration → a gentle "added" note,
      // not a credential resend. Re-signs (isNewRegistration=false) stay silent.
      await sendEmail({
        to: email,
        subject: '🏠 A new property was added to your Landlord Portal',
        html: linkedEmailHtml(name),
      });
    }

    return { uid, created };
  } catch (e) {
    console.error('provisionLandlordForAgreement failed:', e);
    return null;
  }
}
