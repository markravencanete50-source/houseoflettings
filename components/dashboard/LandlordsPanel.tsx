'use client';
// components/dashboard/LandlordsPanel.tsx
// Shared "Landlords" view for both the admin and staff dashboards. Shows how
// many landlord portal accounts exist and a row per landlord. Self-contained:
// authenticates with the same-origin session cookie, and adds a Firebase Bearer
// token when the client SDK is signed in (admins), so it works in both places.
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface Landlord {
  uid: string; name: string; email: string; phone: string;
  properties: number; registrations: number; activated: boolean; createdAt: string | null;
}

export default function LandlordsPanel() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [stats, setStats] = useState({ count: 0, totalProperties: 0, activatedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const headers: Record<string, string> = {};
        const u = auth?.currentUser;
        if (u) { try { headers['Authorization'] = `Bearer ${await u.getIdToken()}`; } catch { /* cookie */ } }
        const res = await fetch('/api/staff/landlords', { headers, credentials: 'same-origin' });
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
              <tr><th>Landlord</th><th>Email</th><th>Phone</th><th>Properties</th><th>Registrations</th><th>Status</th><th>Since</th></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
