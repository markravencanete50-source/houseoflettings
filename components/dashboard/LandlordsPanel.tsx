'use client';
// components/dashboard/LandlordsPanel.tsx
// Shared "Landlords" view for both the admin and staff dashboards. Shows how
// many landlord portal accounts exist and a row per landlord. Self-contained:
// authenticates with the same-origin session cookie, and adds a Firebase Bearer
// token when the client SDK is signed in (admins), so it works in both places.
//
// When `canDelete` is set (admins only — Kasra / Mark), each row gets a Delete
// action that removes the landlord and everything of theirs. The server also
// enforces admin-only, so the button is UX only.
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface Landlord {
  uid: string; name: string; email: string; phone: string;
  properties: number; registrations: number; activated: boolean; createdAt: string | null;
}

async function authedFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };
  const u = auth?.currentUser;
  if (u) { try { headers['Authorization'] = `Bearer ${await u.getIdToken()}`; } catch { /* cookie */ } }
  return fetch(path, { ...init, headers, credentials: 'same-origin' });
}

export default function LandlordsPanel({ canDelete = false }: { canDelete?: boolean }) {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [stats, setStats] = useState({ count: 0, totalProperties: 0, activatedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<Landlord | null>(null); // deletion confirmation
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch('/api/staff/landlords');
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        setLandlords(json.landlords || []);
        setStats({ count: json.count || 0, totalProperties: json.totalProperties || 0, activatedCount: json.activatedCount || 0 });
      } catch (e: any) {
        setError(e.message || 'Failed to load landlords');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true); setDelError('');
    try {
      const res = await authedFetch(`/api/staff/landlords?uid=${encodeURIComponent(target.uid)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setLandlords(ls => ls.filter(l => l.uid !== target.uid));
      setStats(s => ({
        count: Math.max(0, s.count - 1),
        totalProperties: Math.max(0, s.totalProperties - (target.properties || 0)),
        activatedCount: Math.max(0, s.activatedCount - (target.activated ? 1 : 0)),
      }));
      setTarget(null); setConfirmText('');
    } catch (e: any) {
      setDelError(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="dash-section-title">Landlords</h1>
      <p style={{ color: 'var(--gray-600)', marginBottom: 28, fontSize: 15 }}>
        Landlord portal accounts — issued automatically when a registration completes.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20, marginBottom: 28 }}>
        {[
          { label: 'Total landlords', value: stats.count, icon: '👤' },
          { label: 'Registered properties', value: stats.totalProperties, icon: '🏠' },
          { label: 'Activated logins', value: stats.activatedCount, icon: '✅' },
        ].map(s => (
          <div key={s.label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
            <div style={{ fontSize: 30 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : error ? (
        <div className="dash-card" style={{ color: '#c62828' }}>⚠️ {error}</div>
      ) : landlords.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>No landlord accounts yet.</p>
        </div>
      ) : (
        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>Landlord</th><th>Email</th><th>Phone</th><th>Properties</th><th>Registrations</th><th>Status</th><th>Since</th>{canDelete && <th></th>}</tr>
            </thead>
            <tbody>
              {landlords.map(l => (
                <tr key={l.uid}>
                  <td style={{ fontWeight: 600 }}>{l.name || '—'}</td>
                  <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{l.email}</td>
                  <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{l.phone || '—'}</td>
                  <td>{l.properties}</td>
                  <td>{l.registrations}</td>
                  <td>
                    <span className="status-badge" style={l.activated
                      ? { background: '#e8f5e9', color: '#2e7d32' }
                      : { background: '#fff8e1', color: '#f57f17' }}>
                      {l.activated ? 'Active' : 'Pending reset'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{fmtDate(l.createdAt)}</td>
                  {canDelete && (
                    <td>
                      <button
                        onClick={() => { setTarget(l); setConfirmText(''); setDelError(''); }}
                        title="Delete this landlord and everything of theirs"
                        style={{ background: '#fdecea', color: '#c62828', border: '1px solid #f5c6c0', borderRadius: 6, padding: '5px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      {target && (
        <div onClick={() => !deleting && setTarget(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(10,22,47,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 16, padding: '30px 30px 26px', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🗑️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 21, fontWeight: 800, color: '#0a162f' }}>Delete this landlord?</h2>
            <p style={{ margin: '0 0 14px', color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
              This permanently deletes <strong>{target.name || target.email}</strong> — their portal login, profile,
              {' '}{target.registrations} registration{target.registrations === 1 ? '' : 's'} and any property listings.
              <strong> This cannot be undone.</strong>
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>Type the landlord's email to confirm:</p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={target.email}
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1.5px solid #e2e7f0', borderRadius: 9, fontSize: 14, marginBottom: 14 }}
            />
            {delError && <div style={{ background: '#fdecea', color: '#b3261e', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>⚠️ {delError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setTarget(null)} disabled={deleting}
                style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--gray-600)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                disabled={deleting || confirmText.trim().toLowerCase() !== target.email.trim().toLowerCase()}
                style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', opacity: (deleting || confirmText.trim().toLowerCase() !== target.email.trim().toLowerCase()) ? 0.5 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
