'use client';
// app/landlord-portal/page.tsx
// The landlord's home. Cookie-authenticated (no browser Firebase SDK): every
// read goes through /api/landlord/*, which scopes the data to this landlord
// server-side. First-time users are held on a forced password-reset modal until
// they've set their own password.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatedNumber, Reveal, BarPairChart, DonutChart } from '@/components/landlord/PortalUI';
import { PasswordInput } from '@/components/landlord/PasswordInput';

type Me = { uid: string; name: string; email: string; phone: string; mustResetPassword: boolean; propertyCount: number };
type Prop = { id: string; label: string; postcode?: string; city?: string; type?: string; bedrooms?: string; bathrooms?: string; furnishing?: string; rent?: string; occupancy?: string; availableFrom?: string; tenancyStart?: string; packageId?: string; packageLabel?: string };
type Application = { id: string; fullName: string; propertyAddress: string; postcode?: string; rent: string; moveInDate?: string; leaseTerm: string; status: string; submittedAt: string | null };
type Maintenance = { id: string; fullName: string; propertyAddress: string; postcode?: string; issueDescription: string; status: string; submittedAt: string | null };
type Overview = {
  properties: Prop[];
  listings: { id: string; title: string; location: string; price: number; status: string; availability: string; images: string[] }[];
  applications: Application[];
  maintenance: Maintenance[];
  stats: { registeredProperties: number; liveListings: number; totalApplications: number; openMaintenance: number; resolvedMaintenance: number; estMonthlyRent: number; estAnnualRent: number };
  charts: { months: { label: string; applications: number; maintenance: number }[]; maintByStatus: Record<string, number> };
};

type Tab = 'overview' | 'properties' | 'applications' | 'maintenance' | 'account';

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'properties', icon: '🏠', label: 'My Properties' },
  { id: 'applications', icon: '📝', label: 'Applications' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { id: 'account', icon: '⚙️', label: 'Account' },
];

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const MAINT_META: Record<string, { label: string; bg: string; color: string }> = {
  'open': { label: 'Open', bg: '#fff3e0', color: '#ef6c00' },
  'in-progress': { label: 'In progress', bg: '#e3f2fd', color: '#1565c0' },
  'resolved': { label: 'Resolved', bg: '#e8f5e9', color: '#2e7d32' },
  'cancelled': { label: 'Cancelled', bg: '#f3f4f6', color: '#6b7280' },
};

export default function LandlordPortal() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  // Land on the tab named in ?tab= (e.g. returning from a property page).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (t && NAV.some(n => n.id === t)) setTab(t);
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/landlord/me', { credentials: 'include' }).then(r => r.json()).catch(() => ({ user: null }));
      if (!r.user) { router.replace('/landlord-login'); return; }
      setMe(r.user);
      const ov = await fetch('/api/landlord/overview', { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null);
      setData(ov);
      setLoading(false);
    })();
  }, [router]);

  const signOut = async () => {
    await fetch('/api/landlord/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    router.replace('/landlord-login');
  };

  const donutData = useMemo(() => {
    const s = data?.charts.maintByStatus || {};
    return [
      { label: 'Open', value: s['open'] || 0, color: '#ef6c00' },
      { label: 'In progress', value: s['in-progress'] || 0, color: '#1565c0' },
      { label: 'Resolved', value: s['resolved'] || 0, color: '#2e7d32' },
    ].filter(d => d.value > 0).length ? [
      { label: 'Open', value: s['open'] || 0, color: '#ef6c00' },
      { label: 'In progress', value: s['in-progress'] || 0, color: '#1565c0' },
      { label: 'Resolved', value: s['resolved'] || 0, color: '#2e7d32' },
    ] : [];
  }, [data]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a162f', flexDirection: 'column', gap: 18 }}>
        <div className="lp-spinner" />
        <div style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'Poppins, sans-serif', fontSize: 14, letterSpacing: '.05em' }}>Loading your portal…</div>
        <style>{`.lp-spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.15);border-top-color:#c0392b;border-radius:50%;animation:lp-spin .8s linear infinite}@keyframes lp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="lp">
      {me?.mustResetPassword && <ForcePasswordModal onDone={() => setMe({ ...me, mustResetPassword: false })} />}

      {/* Top bar */}
      <header className="lp-top">
        <button className="lp-burger" onClick={() => setMobileNav(o => !o)} aria-label="Menu">☰</button>
        <Link href="/" className="lp-brand">House of Lettings <span>Landlord Portal</span></Link>
        <div className="lp-user">
          <div className="lp-avatar">{me?.name?.charAt(0).toUpperCase() || 'L'}</div>
          <div className="lp-user-meta">
            <div className="lp-user-name">{me?.name}</div>
            <div className="lp-user-sub">Landlord</div>
          </div>
          <button className="lp-signout" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className="lp-body">
        {/* Sidebar */}
        <aside className={`lp-side ${mobileNav ? 'open' : ''}`}>
          {NAV.map(n => (
            <button key={n.id} className={`lp-nav ${tab === n.id ? 'active' : ''}`}
              onClick={() => { setTab(n.id); setMobileNav(false); }}>
              <span className="lp-nav-ico">{n.icon}</span>{n.label}
            </button>
          ))}
          <Link href="/maintenance" className="lp-side-cta">+ Report maintenance</Link>
        </aside>

        {/* Main */}
        <main className="lp-main">
          {tab === 'overview' && s && (
            <>
              <Reveal><h1 className="lp-title">Welcome back, {me?.name?.split(' ')[0]} 👋</h1>
                <p className="lp-sub">Here's how your portfolio is doing today.</p></Reveal>

              <div className="lp-stat-grid">
                {[
                  { label: 'Registered properties', value: s.registeredProperties, icon: '🏠', accent: '#c0392b' },
                  { label: 'Tenant applications', value: s.totalApplications, icon: '📝', accent: '#2563eb' },
                  { label: 'Open maintenance', value: s.openMaintenance, icon: '🔧', accent: '#ef6c00' },
                  { label: 'Est. annual rent', value: s.estAnnualRent, icon: '💷', accent: '#00997f', prefix: '£' },
                ].map((c, i) => (
                  <Reveal key={c.label} delay={i * 90}>
                    <div className="lp-stat">
                      <div className="lp-stat-ico" style={{ background: `${c.accent}14`, color: c.accent }}>{c.icon}</div>
                      <div className="lp-stat-val"><AnimatedNumber value={c.value} prefix={c.prefix || ''} /></div>
                      <div className="lp-stat-label">{c.label}</div>
                      <div className="lp-stat-bar"><span style={{ background: c.accent }} /></div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div className="lp-two">
                <Reveal delay={80}>
                  <div className="lp-panel">
                    <h3 className="lp-panel-h">Activity — last 6 months</h3>
                    <BarPairChart months={data!.charts.months} />
                  </div>
                </Reveal>
                <Reveal delay={160}>
                  <div className="lp-panel">
                    <h3 className="lp-panel-h">Maintenance status</h3>
                    <DonutChart data={donutData} />
                  </div>
                </Reveal>
              </div>

              <Reveal delay={120}>
                <div className="lp-panel">
                  <h3 className="lp-panel-h">Recent applications</h3>
                  {data!.applications.length === 0
                    ? <Empty icon="📝" text="No tenant applications yet for your properties." />
                    : (
                      <div className="lp-list">
                        {data!.applications.slice(0, 5).map(a => (
                          <div key={a.id} className="lp-row">
                            <div><div className="lp-row-t">{a.fullName || 'Applicant'}</div><div className="lp-row-s">{a.propertyAddress}</div></div>
                            <div style={{ textAlign: 'right' }}><span className="lp-badge" data-k="pending">{a.status}</span><div className="lp-row-s">{fmtDate(a.submittedAt)}</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </Reveal>
            </>
          )}

          {tab === 'properties' && (
            <>
              <Reveal><h1 className="lp-title">My Properties</h1><p className="lp-sub">Everything you've registered with House of Lettings.</p></Reveal>
              {(data?.properties.length || 0) === 0 ? <Empty icon="🏠" text="No registered properties found yet." />
                : (
                  <div className="lp-prop-grid">
                    {data!.properties.map((p, i) => (
                      <Reveal key={p.id} delay={i * 60}>
                        <button className="lp-prop lp-prop--btn" onClick={() => router.push(`/landlord-portal/property/${encodeURIComponent(p.id)}`)}>
                          <div className="lp-prop-top">🏠</div>
                          <div className="lp-prop-title">{p.label}</div>
                          <div className="lp-prop-meta">
                            {p.type && <span>{p.type}</span>}
                            {p.bedrooms && <span>{p.bedrooms} bed</span>}
                            {p.occupancy && <span>{p.occupancy}</span>}
                          </div>
                          {p.rent && <div className="lp-prop-rent">£{String(p.rent).replace(/[^\d.,]/g, '')}<span>/mo</span></div>}
                          <div className="lp-prop-cta">View details →</div>
                        </button>
                      </Reveal>
                    ))}
                  </div>
                )}

              {(data?.listings.length || 0) > 0 && (
                <>
                  <h2 className="lp-h2">Live listings</h2>
                  <div className="lp-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="lp-table">
                      <thead><tr><th>Listing</th><th>Location</th><th>Rent</th><th>Status</th></tr></thead>
                      <tbody>
                        {data!.listings.map(l => (
                          <tr key={l.id}>
                            <td>{l.title}</td><td>{l.location}</td><td>£{l.price.toLocaleString()}</td>
                            <td><span className="lp-badge" data-k={l.availability}>{l.availability}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'applications' && (
            <>
              <Reveal><h1 className="lp-title">Tenant Applications</h1><p className="lp-sub">Applications received for your registered properties.</p></Reveal>
              {(data?.applications.length || 0) === 0 ? <Empty icon="📝" text="No applications yet." />
                : (
                  <div className="lp-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="lp-table">
                      <thead><tr><th>Applicant</th><th>Property</th><th>Rent</th><th>Term</th><th>Status</th><th>Received</th></tr></thead>
                      <tbody>
                        {data!.applications.map(a => (
                          <tr key={a.id}>
                            <td>{a.fullName || '—'}</td><td>{a.propertyAddress}</td><td>{a.rent || '—'}</td>
                            <td>{a.leaseTerm || '—'}</td><td><span className="lp-badge" data-k="pending">{a.status}</span></td>
                            <td>{fmtDate(a.submittedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </>
          )}

          {tab === 'maintenance' && (
            <>
              <Reveal><h1 className="lp-title">Maintenance</h1><p className="lp-sub">Repair requests reported for your properties.</p></Reveal>
              {(data?.maintenance.length || 0) === 0 ? <Empty icon="🔧" text="No maintenance requests — all quiet." />
                : (
                  <div className="lp-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="lp-table">
                      <thead><tr><th>Reported by</th><th>Property</th><th>Issue</th><th>Status</th><th>Reported</th></tr></thead>
                      <tbody>
                        {data!.maintenance.map(m => {
                          const meta = MAINT_META[m.status] || MAINT_META['open'];
                          return (
                            <tr key={m.id}>
                              <td>{m.fullName || '—'}</td><td>{m.propertyAddress}</td>
                              <td style={{ maxWidth: 320 }}>{m.issueDescription}</td>
                              <td><span className="lp-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span></td>
                              <td>{fmtDate(m.submittedAt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </>
          )}

          {tab === 'account' && me && (
            <>
              <Reveal><h1 className="lp-title">Account</h1><p className="lp-sub">Your details and security.</p></Reveal>
              <div className="lp-two">
                <Reveal>
                  <div className="lp-panel">
                    <h3 className="lp-panel-h">Profile</h3>
                    <Field label="Name" value={me.name} />
                    <Field label="Email" value={me.email} />
                    <Field label="Phone" value={me.phone || '—'} />
                    <Field label="Registered properties" value={String(me.propertyCount)} />
                  </div>
                </Reveal>
                <Reveal delay={80}><ChangePassword /></Reveal>
              </div>
            </>
          )}
        </main>
      </div>

      <PortalStyles />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f2f7' }}>
      <span style={{ color: '#8a94a3', fontSize: 14 }}>{label}</span>
      <span style={{ color: '#0a162f', fontWeight: 600, fontSize: 14 }}>{value}</span>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="lp-empty">
      <div className="lp-empty-ico">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

function ChangePassword() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) { setMsg({ ok: false, text: 'The new passwords do not match.' }); return; }
    setBusy(true);
    const r = await fetch('/api/landlord/password', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: 'Password updated.' }); setCur(''); setNext(''); setConfirm(''); }
    else setMsg({ ok: false, text: d.message || 'Could not update password.' });
  };

  return (
    <div className="lp-panel">
      <h3 className="lp-panel-h">Change password</h3>
      {msg && <div className={`lp-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.ok ? '✅' : '⚠️'} {msg.text}</div>}
      <form onSubmit={submit}>
        <PasswordInput className="lp-input" style={{ marginBottom: 12 }} placeholder="Current password" value={cur} onChange={setCur} required autoComplete="current-password" />
        <PasswordInput className="lp-input" style={{ marginBottom: 12 }} placeholder="New password (min 8 chars)" value={next} onChange={setNext} required autoComplete="new-password" />
        <PasswordInput className="lp-input" style={{ marginBottom: 12 }} placeholder="Confirm new password" value={confirm} onChange={setConfirm} required autoComplete="new-password" />
        <button className="lp-btn-solid" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
      </form>
    </div>
  );
}

function ForcePasswordModal({ onDone }: { onDone: () => void }) {
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [cur, setCur] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (next.length < 8) { setErr('Use at least 8 characters.'); return; }
    if (next !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const r = await fetch('/api/landlord/password', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) onDone(); else setErr(d.message || 'Could not set your password.');
  };

  return (
    <div className="lp-modal-back">
      <div className="lp-modal">
        <div className="lp-modal-ico">🔐</div>
        <h2>Set your own password</h2>
        <p>Welcome! For your security, please replace the temporary password we emailed you before continuing.</p>
        {err && <div className="lp-msg err">⚠️ {err}</div>}
        <form onSubmit={submit}>
          <PasswordInput className="lp-input" style={{ marginBottom: 12 }} placeholder="Temporary password (from email)" value={cur} onChange={setCur} required autoComplete="current-password" />
          <PasswordInput className="lp-input" style={{ marginBottom: 12 }} placeholder="New password (min 8 chars)" value={next} onChange={setNext} required autoComplete="new-password" />
          <PasswordInput className="lp-input" style={{ marginBottom: 12 }} placeholder="Confirm new password" value={confirm} onChange={setConfirm} required autoComplete="new-password" />
          <button className="lp-btn-solid" disabled={busy}>{busy ? 'Saving…' : 'Save & continue →'}</button>
        </form>
      </div>
      <style>{`
        .lp-modal-back { position: fixed; inset: 0; z-index: 4000; background: rgba(10,22,47,.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: lp-fade .3s ease; }
        @keyframes lp-fade { from { opacity: 0 } to { opacity: 1 } }
        .lp-modal { width: 100%; max-width: 420px; background: #fff; border-radius: 20px; padding: 36px 34px; box-shadow: 0 30px 80px rgba(0,0,0,.4); animation: lp-pop .5s cubic-bezier(.22,1,.36,1); font-family: 'Poppins', sans-serif; }
        @keyframes lp-pop { from { opacity: 0; transform: translateY(24px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .lp-modal-ico { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg,#0a162f,#22406f); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 18px; }
        .lp-modal h2 { font-size: 22px; font-weight: 800; color: #0a162f; margin: 0 0 8px; }
        .lp-modal p { color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
      `}</style>
    </div>
  );
}

function PortalStyles() {
  return (
    <style>{`
      /* Pull up under the global body paddingTop:72px so the portal's own top
         bar sits flush to the viewport (no white gap above it). */
      .lp { margin-top: -72px; min-height: 100vh; background: #f4f6fb; font-family: 'Poppins', sans-serif; color: #0a162f; }
      .lp-top { position: sticky; top: 0; z-index: 100; height: 66px; background: rgba(10,22,47,.98); display: flex; align-items: center; gap: 16px; padding: 0 24px; box-shadow: 0 2px 16px rgba(10,22,47,.18); }
      .lp-burger { display: none; background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; }
      .lp-brand { color: #fff; font-weight: 800; font-size: 16px; text-decoration: none; letter-spacing: -.3px; }
      .lp-brand span { display: block; font-size: 10px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.5); }
      .lp-user { margin-left: auto; display: flex; align-items: center; gap: 12px; }
      .lp-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg,#c0392b,#e05648); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
      .lp-user-meta { line-height: 1.2; }
      .lp-user-name { color: #fff; font-size: 13px; font-weight: 600; }
      .lp-user-sub { color: rgba(255,255,255,.45); font-size: 11px; }
      .lp-signout { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18); color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .2s; }
      .lp-signout:hover { background: rgba(192,57,43,.9); border-color: transparent; }
      .lp-body { display: flex; }
      .lp-side { width: 236px; min-width: 236px; background: #0a162f; padding: 22px 16px; display: flex; flex-direction: column; gap: 6px; min-height: calc(100vh - 66px); position: sticky; top: 66px; height: calc(100vh - 66px); }
      .lp-nav { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 11px; background: none; border: none; color: rgba(255,255,255,.6); font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer; text-align: left; transition: all .18s; }
      .lp-nav:hover { color: #fff; background: rgba(255,255,255,.06); }
      .lp-nav.active { color: #fff; background: linear-gradient(135deg,rgba(192,57,43,.9),rgba(192,57,43,.55)); box-shadow: 0 8px 20px rgba(192,57,43,.28); }
      .lp-nav-ico { font-size: 17px; }
      .lp-side-cta { margin-top: auto; text-align: center; padding: 12px; border-radius: 11px; border: 1px dashed rgba(255,255,255,.22); color: rgba(255,255,255,.72); text-decoration: none; font-size: 13px; font-weight: 600; transition: all .2s; }
      .lp-side-cta:hover { background: rgba(255,255,255,.06); color: #fff; }
      .lp-main { flex: 1; padding: 38px 44px; max-width: 1180px; }
      .lp-title { font-size: 30px; font-weight: 800; letter-spacing: -.7px; margin: 0 0 6px; }
      .lp-sub { color: #6b7280; font-size: 15px; margin: 0 0 30px; }
      .lp-h2 { font-size: 18px; font-weight: 700; margin: 34px 0 16px; }
      .lp-stat-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(210px,1fr)); gap: 20px; margin-bottom: 26px; }
      .lp-stat { position: relative; background: #fff; border: 1px solid #e9edf5; border-radius: 18px; padding: 22px; overflow: hidden; transition: transform .2s, box-shadow .2s; }
      .lp-stat:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(10,22,47,.10); }
      .lp-stat-ico { width: 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 16px; }
      .lp-stat-val { font-size: 34px; font-weight: 800; letter-spacing: -1px; line-height: 1; }
      .lp-stat-label { color: #8a94a3; font-size: 13px; margin-top: 6px; }
      .lp-stat-bar { position: absolute; left: 0; bottom: 0; height: 4px; width: 100%; background: #f0f2f7; }
      .lp-stat-bar span { display: block; height: 100%; width: 60%; }
      .lp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 22px; }
      .lp-panel { background: #fff; border: 1px solid #e9edf5; border-radius: 18px; padding: 24px; margin-bottom: 22px; }
      .lp-panel-h { font-size: 15px; font-weight: 700; margin: 0 0 18px; color: #0a162f; }
      .lp-list { display: flex; flex-direction: column; }
      .lp-row { display: flex; justify-content: space-between; align-items: center; padding: 13px 0; border-bottom: 1px solid #f2f4f9; }
      .lp-row:last-child { border-bottom: none; }
      .lp-row-t { font-weight: 600; font-size: 14px; }
      .lp-row-s { color: #9aa4b2; font-size: 12.5px; margin-top: 2px; }
      .lp-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
      .lp-table th { text-align: left; padding: 13px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #9aa4b2; background: #f8fafc; border-bottom: 1px solid #eef1f6; font-weight: 700; }
      .lp-table td { padding: 14px 16px; border-bottom: 1px solid #f4f6fa; vertical-align: middle; }
      .lp-table tr:last-child td { border-bottom: none; }
      .lp-table tr:hover td { background: #fbfcfe; }
      .lp-badge { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: capitalize; background: #eef2f9; color: #475569; }
      .lp-badge[data-k="available"] { background: #e8f5e9; color: #2e7d32; }
      .lp-badge[data-k="let-agreed"] { background: #fdecea; color: #c62828; }
      .lp-badge[data-k="pending"], .lp-badge[data-k="new"] { background: #fff3e0; color: #ef6c00; }
      .lp-prop-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 18px; }
      .lp-prop { background: #fff; border: 1px solid #e9edf5; border-radius: 16px; padding: 20px; transition: transform .2s, box-shadow .2s; }
      .lp-prop:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(10,22,47,.10); }
      .lp-prop--btn { display: block; width: 100%; text-align: left; cursor: pointer; font-family: inherit; }
      .lp-prop--btn:hover { border-color: #c7d2e6; }
      .lp-prop--btn:hover .lp-prop-cta { color: #c0392b; }
      .lp-prop-cta { margin-top: 14px; font-size: 12.5px; font-weight: 700; color: #94a3b8; transition: color .2s; }
      .lp-prop-top { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg,#0a162f,#22406f); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 14px; }
      .lp-prop-title { font-weight: 700; font-size: 14.5px; line-height: 1.4; margin-bottom: 10px; }
      .lp-prop-meta { display: flex; flex-wrap: wrap; gap: 6px; }
      .lp-prop-meta span { background: #f2f4f9; color: #64748b; font-size: 11.5px; padding: 3px 9px; border-radius: 7px; text-transform: capitalize; }
      .lp-prop-rent { margin-top: 14px; font-size: 22px; font-weight: 800; color: #c0392b; }
      .lp-prop-rent span { font-size: 13px; color: #9aa4b2; font-weight: 500; }
      .lp-empty { background: #fff; border: 1px dashed #d9dfec; border-radius: 18px; padding: 56px 24px; text-align: center; }
      .lp-empty-ico { font-size: 44px; margin-bottom: 12px; }
      .lp-empty p { color: #8a94a3; font-size: 15px; margin: 0; }
      .lp-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1.5px solid #e2e7f0; border-radius: 10px; font-size: 14px; margin-bottom: 12px; outline: none; font-family: inherit; transition: border-color .2s, box-shadow .2s; }
      .lp-input:focus { border-color: #c0392b; box-shadow: 0 0 0 4px rgba(192,57,43,.10); }
      .lp-btn-solid { width: 100%; padding: 13px; border: none; border-radius: 10px; background: linear-gradient(135deg,#c0392b,#a12f22); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; margin-top: 4px; transition: transform .15s; }
      .lp-btn-solid:hover:not(:disabled) { transform: translateY(-2px); }
      .lp-btn-solid:disabled { opacity: .7; cursor: not-allowed; }
      .lp-msg { padding: 11px 14px; border-radius: 9px; font-size: 13px; margin-bottom: 14px; }
      .lp-msg.ok { background: #e8f5e9; color: #2e7d32; }
      .lp-msg.err { background: #fdecea; color: #b3261e; }
      @media (max-width: 900px) {
        .lp-two { grid-template-columns: 1fr; }
        .lp-main { padding: 26px 18px; }
        .lp-burger { display: block; }
        .lp-user-meta { display: none; }
        .lp-side { position: fixed; left: 0; top: 66px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.22,1,.36,1); z-index: 90; box-shadow: 12px 0 30px rgba(0,0,0,.3); }
        .lp-side.open { transform: translateX(0); }
      }
    `}</style>
  );
}
