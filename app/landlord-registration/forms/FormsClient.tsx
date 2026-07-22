'use client';
// app/landlord-registration/forms/FormsClient.tsx
// Renders ONE of the two post-agreement forms based on ?doc=, with the property
// and the signing landlord's details auto-filled (read-only). Each landlord
// signs their own copy. Reads id/token/party/doc from window.location (no
// useSearchParams / Suspense dependency).
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';
import { CLOUDINARY_FOLDERS } from '@/lib/cloudinaryFolders';

const FORM_LABEL: Record<string, string> = {
  'authorised-rep': 'Authorised Property Management Representative Form',
  'bank-aml': 'Bank Details & AML Verification Form',
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const sigRes = await fetch('/api/cloudinary-sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder }) });
  if (!sigRes.ok) throw new Error('Could not prepare upload');
  const { cloudName, apiKey, timestamp, folder: signedFolder, signature } = await sigRes.json();
  const fd = new FormData();
  fd.append('file', file); fd.append('api_key', apiKey); fd.append('timestamp', String(timestamp)); fd.append('folder', signedFolder); fd.append('signature', signature);
  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
  const data = await upRes.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url as string;
}
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/png';
  const bin = atob(body); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

type Ctx = { propertyAddress: string; packageLabel: string; landlordName: string; landlordEmail: string; landlordPhone: string; landlordAddress: string; landlord2Name: string; completed: Record<string, boolean> };
type Stage = 'checking' | 'invalid' | 'form' | 'done' | 'already';

export default function FormsClient() {
  const [params, setParams] = useState({ id: '', token: '', party: '', doc: '' });
  const [stage, setStage] = useState<Stage>('checking');
  const [ctx, setCtx] = useState<Ctx | null>(null);

  // authorised-rep fields
  const [hasRep, setHasRep] = useState<null | boolean>(null);
  const [rep, setRep] = useState({ repName: '', repEmail: '', repPhone: '' });
  // bank-aml fields
  const [bank, setBank] = useState({ accountHolder: '', bankName: '', sortCode: '', accountNumber: '' });
  const [jointDecl, setJointDecl] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  // signature
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [sigName, setSigName] = useState('');
  const [sigDate, setSigDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; started.current = true;
    const sp = new URLSearchParams(window.location.search);
    const p = { id: sp.get('id') || '', token: sp.get('token') || '', party: sp.get('party') || '', doc: sp.get('doc') || '' };
    setParams(p);
    setSigDate(new Date().toISOString().slice(0, 10));
    if (!p.id || !p.token || !p.doc || !FORM_LABEL[p.doc]) { setStage('invalid'); return; }
    fetch(`/api/landlord-registration/forms?id=${encodeURIComponent(p.id)}&token=${encodeURIComponent(p.token)}&party=${encodeURIComponent(p.party)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.valid) { setStage('invalid'); return; }
        setCtx(d);
        setSigName(d.landlordName || '');
        if (d.completed?.[p.doc]) { setStage('already'); return; }
        setStage('form');
      })
      .catch(() => setStage('invalid'));
  }, []);

  const isBank = params.doc === 'bank-aml';
  const label = FORM_LABEL[params.doc] || 'Landlord Form';
  const otherDoc = params.doc === 'bank-aml' ? 'authorised-rep' : 'bank-aml';
  const otherLink = `/landlord-registration/forms?id=${params.id}&token=${params.token}&party=${params.party}&doc=${otherDoc}`;
  const otherDone = ctx?.completed?.[otherDoc];

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!isBank) {
      if (hasRep === null) e.hasRep = 'Please choose an option';
      if (hasRep) {
        if (!rep.repName.trim()) e.repName = "Representative's name is required";
        if (!rep.repEmail.trim() || !EMAIL_REGEX.test(rep.repEmail)) e.repEmail = 'A valid email is required';
      }
    } else {
      if (!bank.accountHolder.trim()) e.accountHolder = 'Account holder name is required';
      if (!bank.bankName.trim()) e.bankName = 'Bank name is required';
      if (!/^\d{6}$/.test(bank.sortCode.replace(/\D/g, ''))) e.sortCode = 'Enter a 6-digit sort code';
      if (!/^\d{8}$/.test(bank.accountNumber.replace(/\D/g, ''))) e.accountNumber = 'Enter an 8-digit account number';
    }
    if (!termsAccepted) e.terms = 'Please accept the terms and conditions to continue';
    if (!sigName.trim()) e.sigName = 'Type your full name to confirm';
    if (!sigDate) e.sigDate = 'Please confirm the date';
    if (!signatureData) e.signature = 'Please add your signature';
    if (Object.keys(e).length) { setErrors(e); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setErrors({});
    setStatus('loading'); setErrorMsg('');
    try {
      let signatureUrl = '';
      try { signatureUrl = await uploadToCloudinary(dataUrlToFile(signatureData!, `form-sig-${Date.now()}.png`), CLOUDINARY_FOLDERS.agreements); } catch { /* non-fatal */ }
      const body: any = { ...params, signatureName: sigName, signatureDate: sigDate, signatureUrl, signatureImage: signatureData, termsAccepted: true };
      if (!isBank) { body.hasRepresentative = !!hasRep; if (hasRep) Object.assign(body, rep); }
      else { Object.assign(body, bank, { jointDeclaration: jointDecl }); }
      const res = await fetch('/api/landlord-registration/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Submission failed');
      setStage('done');
    } catch (err: any) { setStatus('error'); setErrorMsg(err.message || 'Something went wrong. Please try again.'); }
  };

  return (
    <div className="lf">
      {stage === 'checking' && <div className="lf-center"><div className="lf-spin" /><p>Checking your link…</p></div>}
      {stage === 'invalid' && <Msg icon="⚠️" title="This link isn't valid" body="It may have expired or already been used. Please contact House of Lettings for a fresh link." />}
      {stage === 'already' && (
        <Msg icon="✅" title="Already signed" body={`You've already signed the ${label}.`}
          extra={!otherDone ? <Link href={otherLink} className="lf-btn">Sign the other form →</Link> : undefined} />
      )}
      {stage === 'done' && (
        <Msg icon="🎉" title="Thank you — signed" body={`Your ${label} is signed. A copy has been emailed to you and our office.`}
          extra={!otherDone ? <Link href={otherLink} className="lf-btn">Now sign the other form →</Link> : <Link href="/" className="lf-btn">Back to website</Link>} />
      )}

      {stage === 'form' && ctx && (
        <div className="lf-shell">
          <div className="lf-head">
            <div className="lf-badge">{isBank ? 'Bank & AML' : 'Authorised Representative'}</div>
            <h1>{label}</h1>
            <p>Please review the details below and sign. A signed PDF copy will be emailed to you and to House of Lettings.</p>
          </div>

          <div className="lf-card lf-locked">
            <h2>Property &amp; landlord <span className="lf-lock">🔒 from your registration</span></h2>
            <Recap label="Property" value={ctx.propertyAddress || '—'} />
            <Recap label="Landlord" value={ctx.landlordName || '—'} />
            <Recap label="Email" value={ctx.landlordEmail || '—'} />
            <Recap label="Telephone" value={ctx.landlordPhone || '—'} last />
          </div>

          {!isBank ? (
            <div className="lf-card">
              <h2>Authorised Representative</h2>
              <p className="lf-hint" style={{ marginBottom: 14 }}>You can nominate someone to handle day-to-day management matters with us on your behalf (they cannot sign tenancy agreements or legal notices). This is optional.</p>
              <div className="lf-choice">
                <label className={`lf-opt ${hasRep === true ? 'on' : ''}`}><input type="radio" checked={hasRep === true} onChange={() => setHasRep(true)} /> I'd like to nominate a representative</label>
                <label className={`lf-opt ${hasRep === false ? 'on' : ''}`}><input type="radio" checked={hasRep === false} onChange={() => setHasRep(false)} /> I'll manage the property myself — no representative</label>
              </div>
              {errors.hasRep && <p className="lf-err">{errors.hasRep}</p>}
              {hasRep && (
                <div className="lf-grid" style={{ marginTop: 16 }}>
                  <Field label="Representative Full Name" req err={errors.repName}><input className="lf-input" value={rep.repName} onChange={e => setRep(s => ({ ...s, repName: e.target.value }))} /></Field>
                  <Field label="Representative Email" req err={errors.repEmail}><input className="lf-input" type="email" value={rep.repEmail} onChange={e => setRep(s => ({ ...s, repEmail: e.target.value }))} /></Field>
                  <Field label="Representative Telephone" err={errors.repPhone} full><input className="lf-input" type="tel" value={rep.repPhone} onChange={e => setRep(s => ({ ...s, repPhone: e.target.value }))} /></Field>
                </div>
              )}
            </div>
          ) : (
            <div className="lf-card">
              <h2>Bank account for rental income</h2>
              <div className="lf-grid">
                <Field label="Account Holder Name" req err={errors.accountHolder} full><input className="lf-input" value={bank.accountHolder} onChange={e => setBank(s => ({ ...s, accountHolder: e.target.value }))} /></Field>
                <Field label="Bank Name" req err={errors.bankName} full><input className="lf-input" value={bank.bankName} onChange={e => setBank(s => ({ ...s, bankName: e.target.value }))} /></Field>
                <Field label="Sort Code" req err={errors.sortCode}><input className="lf-input" inputMode="numeric" placeholder="00-00-00" value={bank.sortCode} onChange={e => setBank(s => ({ ...s, sortCode: e.target.value }))} /></Field>
                <Field label="Account Number" req err={errors.accountNumber}><input className="lf-input" inputMode="numeric" placeholder="8 digits" value={bank.accountNumber} onChange={e => setBank(s => ({ ...s, accountNumber: e.target.value }))} /></Field>
              </div>
              {ctx.landlord2Name && (
                <label className="lf-check" style={{ marginTop: 14 }}>
                  <input type="checkbox" checked={jointDecl} onChange={e => setJointDecl(e.target.checked)} />
                  <span>Joint ownership: I confirm all landlords are jointly entitled to the rental income, to be paid to the account above (unless otherwise agreed in writing).</span>
                </label>
              )}
              <p className="lf-hint" style={{ marginTop: 10 }}>🔒 For your security, only a masked record is stored — your full account details appear only in the signed PDF sent to our office.</p>
            </div>
          )}

          {/* Terms & conditions — shown in full and accepted, like the agency agreement */}
          <div className="lf-card">
            <h2>Terms &amp; conditions</h2>
            <p className="lf-hint" style={{ marginBottom: 12 }}>Please read the terms below in full before signing.</p>
            <div className="lf-terms-scroll">
              {!isBank ? (
                <>
                  <div className="lf-terms-h">1. Authority granted</div>
                  <p>By signing this form the Landlord(s) authorise the Authorised Representative (if named) to communicate with House of Lettings and give instructions regarding: tenancy management and renewals; maintenance, repairs and contractor instructions; property inspections and visits; rent negotiations and tenancy matters; compliance-related matters; deposit matters and disputes; marketing, advertising and viewings; notices and tenancy-related correspondence; approval of invoices and property expenses; and general day-to-day management of the Property. The Agent may reasonably rely on the Representative's instructions unless notified otherwise in writing.</p>
                  <div className="lf-terms-h">2. Limitation of authority</div>
                  <p>The Authorised Representative is authorised for day-to-day property management only and may NOT sign or execute tenancy agreements, legal notices, statutory notices, contracts, court documents or other legally binding documents on behalf of the Landlord(s), nor transfer ownership of the Property. Where legally binding approval is required, House of Lettings may request direct confirmation from the Landlord(s).</p>
                  <div className="lf-terms-h">3. Revocation of authority</div>
                  <p>This authority remains valid unless and until withdrawn in writing by the Landlord(s). House of Lettings may continue to rely upon the Representative's instructions until written notice of cancellation has been received and reasonably processed.</p>
                  <div className="lf-terms-h">4. Data protection &amp; governing law</div>
                  <p>All personal information is handled in accordance with the UK GDPR and the Data Protection Act 2018. This Agreement is governed by the laws of England and Wales. The Agent is House of Lettings Limited (Co. No. 11676443), Peter House, Oxford Street, Manchester, M1 5AN; Property Ombudsman T02474.</p>
                  <div className="lf-terms-h">5. Declaration</div>
                  <p>By signing, the Landlord(s) confirm they have read and understood this Agreement, authorise any named individual above to act as their representative for day-to-day management matters, and authorise the Agent to act in accordance with this Agreement immediately.</p>
                </>
              ) : (
                <>
                  <div className="lf-terms-h">1. Authority declaration</div>
                  <p>The Landlord(s) confirm and declare that the bank account provided belongs to them or is under their lawful control; that they have full legal authority to receive rental income relating to the Property; and that the information provided in this form is true, complete and accurate to the best of their knowledge and belief. The Agent shall be entitled to rely upon the bank details provided unless and until revised written instructions are received and verified by the Agent.</p>
                  <div className="lf-terms-h">2. Anti-Money Laundering (AML) compliance</div>
                  <p>To comply with applicable legislation, regulatory obligations and internal compliance procedures, the Agent may request proof of identity, proof of address, proof of ownership of the Property, proof of bank-account ownership, and source of funds or related compliance documentation where reasonably required. The Agent may also carry out electronic verification and compliance checks using third-party providers. Failure to provide requested documentation may delay payments, onboarding or property-related services.</p>
                  <div className="lf-terms-h">3. Payment disclaimer</div>
                  <p>The Agent shall not be responsible or liable for any loss, delay, mispayment or financial issue arising from incorrect, incomplete, fraudulent or outdated bank details provided by the Landlord(s). Any changes to bank account details must be submitted in writing and may be subject to verification and compliance checks before implementation.</p>
                  <div className="lf-terms-h">4. Data protection</div>
                  <p>All personal data and financial information provided is processed in accordance with the UK GDPR and the Data Protection Act 2018, and used only for property management, financial administration, compliance, legal obligations and related professional purposes.</p>
                </>
              )}
            </div>
            <label className="lf-terms-accept">
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
              <span>I have read and accept the terms and conditions of this {label}.</span>
            </label>
            {errors.terms && <p className="lf-err">{errors.terms}</p>}
          </div>

          <div className="lf-card">
            <h2>Your signature</h2>
            <SignaturePad onChange={setSignatureData} penColor="#0a162f" />
            {errors.signature && <p className="lf-err" style={{ marginTop: 8 }}>{errors.signature}</p>}
            <div className="lf-grid" style={{ marginTop: 16 }}>
              <Field label="Type your full name to confirm" req err={errors.sigName}><input className="lf-input" value={sigName} onChange={e => setSigName(e.target.value)} /></Field>
              <Field label="Date of signature" req err={errors.sigDate}><input className="lf-input" type="date" value={sigDate} onChange={e => setSigDate(e.target.value)} style={{ colorScheme: 'light' }} /></Field>
            </div>
          </div>

          {status === 'error' && <div className="lf-banner">⚠️ {errorMsg}</div>}
          <button className="lf-submit" onClick={submit} disabled={status === 'loading'}>{status === 'loading' ? 'Submitting…' : 'Sign & submit →'}</button>
          <p className="lf-fine">An electronic signature is legally binding under the Electronic Communications Act 2000.</p>
        </div>
      )}

      <style>{`
        .lf { min-height: 70vh; background: #f4f6fb; padding: 40px 20px 70px; font-family: 'Poppins', sans-serif; }
        .lf-shell { max-width: 700px; margin: 0 auto; }
        .lf-center { max-width: 460px; margin: 60px auto; text-align: center; color: #26303f; }
        .lf-spin { width: 36px; height: 36px; margin: 0 auto 14px; border: 3px solid #e4e9f2; border-top-color: #c0392b; border-radius: 50%; animation: lf-rot .8s linear infinite; }
        @keyframes lf-rot { to { transform: rotate(360deg); } }
        .lf-head { margin-bottom: 22px; }
        .lf-badge { display: inline-block; background: #eaf1ff; color: #2563eb; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
        .lf-head h1 { font-size: 26px; font-weight: 800; color: #0a162f; margin: 14px 0 8px; letter-spacing: -.4px; }
        .lf-head p { font-size: 14.5px; color: #5b6b82; line-height: 1.65; margin: 0; }
        .lf-card { background: #fff; border: 1px solid #e7ebf3; border-radius: 16px; padding: 24px; margin-bottom: 18px; box-shadow: 0 6px 22px rgba(10,22,47,.04); }
        .lf-card h2 { font-size: 16px; font-weight: 800; color: #0a162f; margin: 0 0 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .lf-locked { background: #f9fbfd; border-style: dashed; }
        .lf-lock { font-size: 11px; font-weight: 600; color: #8a94a3; background: #eef2f7; padding: 3px 9px; border-radius: 20px; }
        .lf-recap { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f0f2f7; font-size: 14px; }
        .lf-recap span:first-child { color: #8a94a3; }
        .lf-recap span:last-child { color: #0a162f; font-weight: 600; text-align: right; }
        .lf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .lf-field--full { grid-column: 1 / -1; }
        .lf-label { display: block; font-size: 13px; font-weight: 600; color: #2b3648; margin-bottom: 7px; }
        .lf-req { color: #c0392b; margin-left: 3px; }
        .lf-hint { font-size: 12.5px; color: #8a94a3; line-height: 1.55; }
        .lf-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1.5px solid #e2e7f0; border-radius: 10px; font-size: 14.5px; outline: none; font-family: inherit; transition: border-color .2s, box-shadow .2s; }
        .lf-input:focus { border-color: #c0392b; box-shadow: 0 0 0 4px rgba(192,57,43,.10); }
        .lf-choice { display: flex; flex-direction: column; gap: 10px; }
        .lf-opt { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151; cursor: pointer; border: 1.5px solid #e6eaf1; border-radius: 10px; padding: 12px 14px; transition: all .15s; }
        .lf-opt.on { border-color: #c0392b; background: #fdf3f2; }
        .lf-opt input { width: 17px; height: 17px; accent-color: #c0392b; }
        .lf-check { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; color: #374151; cursor: pointer; line-height: 1.5; }
        .lf-check input { margin-top: 3px; width: 17px; height: 17px; accent-color: #c0392b; flex-shrink: 0; }
        .lf-terms-scroll { max-height: 300px; overflow-y: auto; border: 1px solid #eef1f6; border-radius: 10px; background: #fafbfc; padding: 18px; font-size: 12.5px; color: #4b5563; line-height: 1.65; }
        .lf-terms-scroll p { margin: 0 0 10px; }
        .lf-terms-h { font-weight: 800; color: #0a162f; font-size: 13px; margin: 0 0 4px; }
        .lf-terms-accept { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; font-size: 13.5px; color: #374151; cursor: pointer; line-height: 1.5; }
        .lf-terms-accept input { margin-top: 3px; width: 17px; height: 17px; accent-color: #c0392b; flex-shrink: 0; }
        .lf-err { color: #b3261e; font-size: 12.5px; margin: 6px 0 0; }
        .lf-banner { background: #fdecea; border: 1px solid #f5c6c0; color: #b3261e; padding: 13px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; }
        .lf-submit { width: 100%; padding: 16px; border: none; border-radius: 12px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 12px 26px rgba(192,57,43,.26); transition: transform .15s; }
        .lf-submit:hover:not(:disabled) { transform: translateY(-2px); }
        .lf-submit:disabled { opacity: .7; cursor: not-allowed; }
        .lf-fine { font-size: 12px; color: #9aa4b2; text-align: center; margin: 12px 0 0; }
        .lf-btn { display: inline-block; background: #0a162f; color: #fff; text-decoration: none; font-weight: 700; padding: 13px 28px; border-radius: 10px; font-size: 14px; }
        @media (max-width: 640px) { .lf-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function Field({ label, req, err, full, children }: { label: string; req?: boolean; err?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'lf-field--full' : ''}>
      <label className="lf-label">{label}{req && <span className="lf-req">*</span>}</label>
      {children}
      {err && <p className="lf-err">{err}</p>}
    </div>
  );
}
function Recap({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <div className="lf-recap" style={last ? { borderBottom: 'none' } : undefined}><span>{label}</span><span>{value}</span></div>;
}
function Msg({ icon, title, body, extra }: { icon: string; title: string; body: string; extra?: React.ReactNode }) {
  return (
    <div className="lf-shell" style={{ maxWidth: 460 }}>
      <div className="lf-card" style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
        <h1 style={{ fontSize: 23, fontWeight: 800, color: '#0a162f', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ color: '#5b6b82', fontSize: 15, lineHeight: 1.6, margin: '0 0 22px' }}>{body}</p>
        {extra || <Link href="/" style={{ display: 'inline-block', background: '#0a162f', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '13px 28px', borderRadius: 10, fontSize: 14 }}>Back to website</Link>}
      </div>
    </div>
  );
}
