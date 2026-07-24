'use client';
// app/dashboard/staff/page.tsx
// Staff dashboard, mirrors the admin dark-sidebar layout (shared global
// .dash-* classes). The sidebar is built from the user's enabled features
// (lib/staffAccess.ts): admins grant/revoke features per staff member from the
// admin Users tab, no code change needed. All data goes through the Admin-SDK
// /api/staff/* routes, which enforce the role AND the feature server-side.
import { useState, useEffect, useRef, Suspense, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyForm from '@/components/property/PropertyForm';
import RentReviewPropertyManager from '@/components/dashboard/RentReviewPropertyManager';
import RentReviewPanel from '@/components/valuation/RentReviewPanel';
import AgreementEditor from '@/components/dashboard/AgreementEditor';
import AgreementTemplateEditor from '@/components/dashboard/AgreementTemplateEditor';
import CouponManager from '@/components/dashboard/CouponManager';
import LandlordsPanel from '@/components/dashboard/LandlordsPanel';
import SecondLandlordDetails from '@/components/dashboard/SecondLandlordDetails';
import CoSignersDetails from '@/components/dashboard/CoSignersDetails';
import { LandlordProgressBadge, LandlordProgressPanel } from '@/components/dashboard/LandlordProgress';
import AgreementExtraDetails from '@/components/dashboard/AgreementExtraDetails';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth';
import { Property, propertyAvailability } from '@/lib/types';
import { STAFF_FEATURES, staffPermissions, type StaffFeature } from '@/lib/staffAccess';
import { safeLinkHref } from '@/lib/security';

// 'edit' is a transient tab (hosts the property editor), not a grantable feature.
type Tab = StaffFeature | 'edit';

const AVAILABILITY_META: Record<'available' | 'pending' | 'let-agreed', { label: string; bg: string; color: string }> = {
  'available':  { label: 'Available',  bg: '#e8f5e9', color: '#2e7d32' },
  'pending':    { label: 'Pending',    bg: '#fff3e0', color: '#ef6c00' },
  'let-agreed': { label: 'Let Agreed', bg: '#fdecea', color: '#c62828' },
};

interface RentReview {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  postcode?: string;
  currentRent?: string;
  proposedRent?: string;
  effectiveDate?: string;
  rentDecision?: string;
  tenantProposedRent?: string;
  rentDiscussReason?: string;
  adultOccupants?: string; childOccupants?: string; childrenAges?: string;
  pets?: string; petDetails?: string;
  annualIncome?: string;
  hasCCJ?: string; ccjDetails?: string;
  shareCode?: string;
  hasMaintenance?: string; maintenanceCategory?: string; maintenanceDescription?: string;
  photoIdUrls?: string[]; payslipUrls?: string[]; bankStatementUrls?: string[]; maintenancePhotoUrls?: string[];
  status: string;
  submittedAt: string | null;
}

const RR_STATUSES = ['pending', 'reviewing', 'agreed', 'completed', 'cancelled'] as const;

interface TenantApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  status: string;
  submittedAt: string | null;
}

interface MaintenanceRequest {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  propertyAddress: string;
  issueDescription: string;
  status: string;
  photoUrls?: string[];
  submittedAt: string | null;
}

interface ServiceOrderLine {
  name: string; categoryTitle: string; variantLabel?: string | null;
  addOns: { id: string; label: string; count?: number; amount: number }[];
  quantity: number; total: number; from?: boolean;
}
interface ServiceOrder {
  id: string;
  ref: string;
  customer: { fullName: string; email: string; phone: string; postcode?: string; address?: string; notes?: string };
  lines: ServiceOrderLine[];
  total: number;
  hasFrom?: boolean;
  status: string;
  proofOfPaymentUrls?: string[];
  createdAt: string | null;
}

interface Agreement {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  contactAddress?: string;
  jointLandlord?: boolean;
  landlord2Name?: string;
  residency?: string;
  postcode?: string; street?: string; city?: string; flatNumber?: string;
  propertyType?: string; bedrooms?: string; bathrooms?: string; furnishing?: string; parking?: string;
  currentRent?: string; availableFrom?: string;
  selectedPackage?: string;
  signatureName?: string;
  signatureDate?: string;
  signatureUrl?: string;
  signature2Name?: string; signature2Url?: string;
  landlord2Email?: string; county?: string; securityNote?: string;
  selectedPackageId?: string;
  awaitingSignature?: boolean;
  secondLandlordStatus?: string;
  secondLandlord?: Record<string, any>;
  landlord2Phone?: string;
  status: string;
  createdAt: string | null;
  postSignForms?: Record<string, any>;
  landlordUid?: string;
  accountProvisioned?: boolean;
  portalAccessed?: boolean;
  passwordReset?: boolean;
  portalLastLoginAt?: string | null;
  ownerType?: string; companyName?: string;
}

const AGREEMENT_STATUSES = ['signed', 'countersigned', 'active', 'completed', 'cancelled'] as const;

interface Valuation {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  propertyType: string;
  bedrooms: string;
  preferredDateTime: string;
  notes?: string;
  status: string;
  createdAt: string | null;
}

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  location: 'leeds' | 'manchester';
  createdAt: string | null;
}

const MAINT_STATUSES = ['open', 'in-progress', 'resolved', 'cancelled'] as const;
type MaintFilter = 'all' | (typeof MAINT_STATUSES)[number];

const badge = (status: string): { bg: string; color: string } => {
  const map: Record<string, { bg: string; color: string }> = {
    pending:       { bg: '#fff8e1', color: '#f57f17' },
    open:          { bg: '#fff8e1', color: '#f57f17' },
    signed:        { bg: '#fff8e1', color: '#f57f17' },
    'awaiting-signature': { bg: '#fff3e0', color: '#ef6c00' },
    countersigned: { bg: '#e3f2fd', color: '#1565c0' },
    reviewing:     { bg: '#e3f2fd', color: '#1565c0' },
    'in-progress': { bg: '#e3f2fd', color: '#1565c0' },
    contacted:     { bg: '#e3f2fd', color: '#1565c0' },
    confirmed:     { bg: '#e3f2fd', color: '#1565c0' },
    approved:      { bg: '#e8f5e9', color: '#2e7d32' },
    resolved:      { bg: '#e8f5e9', color: '#2e7d32' },
    paid:          { bg: '#e8f5e9', color: '#2e7d32' },
    completed:     { bg: '#ede7f6', color: '#6a1b9a' },
    rejected:      { bg: '#fce4ec', color: '#c62828' },
    cancelled:     { bg: '#fce4ec', color: '#c62828' },
    active:        { bg: '#e8f5e9', color: '#2e7d32' },
    inactive:      { bg: '#fce4ec', color: '#c62828' },
  };
  return map[status] || { bg: '#f1f5f9', color: '#374151' };
};

function StatusBadge({ status }: { status: string }) {
  const c = badge(status);
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, textTransform: 'uppercase', background: c.bg, color: c.color,
    }}>
      {status || '-'}
    </span>
  );
}

// Colours for the at-a-glance joint (second) landlord status chip.
function jointChip(status: string): { background: string; color: string } {
  if (status === 'completed') return { background: '#e8f5e9', color: '#2e7d32' };
  if (status === 'declined') return { background: '#fdecea', color: '#c62828' };
  return { background: '#fff3e0', color: '#ef6c00' };
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const yn = (v?: string) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '-');

// Expanded detail for one rent review: every declaration + document links.
function RentReviewDetail({ r }: { r: RentReview }) {
  const Row = ({ label, value }: { label: string; value?: string }) => (
    <div style={{ display: 'flex', gap: 10, fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: 'var(--gray-500)', minWidth: 200, fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--gray-800)', fontWeight: 600 }}>{value && value.trim() ? value : '-'}</span>
    </div>
  );
  const Files = ({ label, urls }: { label: string; urls?: string[] }) => (
    <div style={{ display: 'flex', gap: 10, fontSize: 13, padding: '4px 0', alignItems: 'center' }}>
      <span style={{ color: 'var(--gray-500)', minWidth: 200, fontWeight: 500 }}>{label}</span>
      {urls && urls.length > 0 ? (
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {urls.map((u, i) => <a key={i} href={safeLinkHref(u)} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 9px', background: '#eff6ff', color: '#2563eb', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe' }}>📄 File {i + 1}</a>)}
        </span>
      ) : <span style={{ color: 'var(--gray-400)' }}>None provided</span>}
    </div>
  );
  const H = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#2563eb', margin: '14px 0 4px' }}>{children}</div>
  );
  return (
    <div>
      <H>Property &amp; Rent</H>
      <Row label="Property Address" value={r.propertyAddress} />
      <Row label="Postcode" value={r.postcode} />
      <Row label="Current Rent" value={r.currentRent} />
      <Row label="Proposed New Rent" value={r.proposedRent} />
      <Row label="Effective Date" value={r.effectiveDate} />
      <Row label="Decision" value={r.rentDecision === 'accept' ? 'Accepts the proposed rent' : r.rentDecision === 'discuss' ? 'Would like to discuss' : '-'} />
      {r.rentDecision === 'discuss' && <Row label="Rent Proposed by Tenant" value={r.tenantProposedRent} />}
      {r.rentDecision === 'discuss' && <Row label="Reason" value={r.rentDiscussReason} />}

      <H>Tenant &amp; Household</H>
      <Row label="Phone" value={r.phone} />
      <Row label="Adult Occupants" value={r.adultOccupants} />
      <Row label="Child Occupants" value={r.childOccupants} />
      {Number(r.childOccupants) > 0 && <Row label="Children's Ages" value={r.childrenAges} />}
      <Row label="Pets" value={yn(r.pets)} />
      {r.pets === 'yes' && <Row label="Pet Details" value={r.petDetails} />}
      <Row label="Annual Income" value={r.annualIncome} />

      <H>Financial Status</H>
      <Row label="CCJs / financial issues?" value={yn(r.hasCCJ)} />
      {r.hasCCJ === 'yes' && <Row label="Details" value={r.ccjDetails} />}
      <Row label="Right to Rent Share Code" value={r.shareCode} />

      <H>Documents</H>
      <Files label="Photo ID (front & back)" urls={r.photoIdUrls} />
      <Files label="Payslips" urls={r.payslipUrls} />
      <Files label="Bank Statements" urls={r.bankStatementUrls} />

      {r.hasMaintenance === 'yes' && (
        <>
          <H>Maintenance</H>
          <Row label="Category" value={r.maintenanceCategory} />
          <Row label="Description" value={r.maintenanceDescription} />
          <Files label="Photos" urls={r.maintenancePhotoUrls} />
        </>
      )}
    </div>
  );
}

const EMPTY_REVIEW_FORM = {
  author_name: '', rating: 5, text: '', relative_time_description: '',
  location: 'leeds' as 'leeds' | 'manchester',
};

function StaffDashboardInner() {
  const router = useRouter();
  const { user, profile: clientProfile, loading: authLoading } = useAuth();
  // Session-cookie fallback: when the Firebase client SDK has no user (the
  // browser can't reach Google, so login went through our server) we identify
  // the member from the HttpOnly session cookie via /api/me.
  const [sessionProfile, setSessionProfile] = useState<{ uid: string; name: string; email: string; role: string; permissions?: string[] } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const profile = clientProfile || sessionProfile;
  const ready = !authLoading && (clientProfile ? true : sessionChecked);
  const perms = staffPermissions(profile);
  // Deletion is destructive and irreversible: staff can create/edit/change
  // status across every feature, but only an administrator may delete. The API
  // enforces this too — this just hides controls staff aren't allowed to use.
  const isAdmin = profile?.role === 'admin';

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<string | null>(null);
  const [showAgreementWording, setShowAgreementWording] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [rentReviews, setRentReviews] = useState<RentReview[]>([]);
  const [expandedRR, setExpandedRR] = useState<string | null>(null);
  const [showRRProps, setShowRRProps] = useState(false);
  const [showRRCalc, setShowRRCalc] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchProp, setSearchProp] = useState('');
  const [maintFilter, setMaintFilter] = useState<MaintFilter>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Load the cookie-session profile if the client SDK has no user.
  useEffect(() => {
    if (authLoading) return;
    if (clientProfile) { setSessionChecked(true); return; }
    let cancelled = false;
    fetch('/api/me')
      .then(r => r.json())
      .then(d => { if (!cancelled) setSessionProfile(d.user || null); })
      .catch(() => { if (!cancelled) setSessionProfile(null); })
      .finally(() => { if (!cancelled) setSessionChecked(true); });
    return () => { cancelled = true; };
  }, [authLoading, clientProfile]);

  // Auth guard, staff/admin only, once we've resolved client + cookie sessions.
  useEffect(() => {
    if (!ready) return;
    if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
      router.push('/admin-login');
    }
  }, [ready, profile, router]);

  const handleSignOut = async () => {
    try { await fetch('/api/team-logout', { method: 'POST' }); } catch { /* ignore */ }
    try { await signOut(); } catch { /* ignore (cookie-only session) */ }
    router.push('/admin-login');
  };

  // Keep the active tab within the permitted, routable set ('edit' is
  // transient, exempt; 'coupons' is a permission flag with no page of its own).
  useEffect(() => {
    const routablePerms = perms.filter(p => p !== 'coupons') as Tab[];
    if (routablePerms.length > 0 && tab !== 'edit' && !routablePerms.includes(tab)) setTab(routablePerms[0]);
  }, [perms, tab]);

  // Use the Firebase ID token when signed in via the client SDK; otherwise the
  // same-origin session cookie authenticates the request on the server.
  const authHeaders = async (extra?: Record<string, string>): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { ...(extra || {}), 'Content-Type': 'application/json' };
    if (user) {
      try { headers['Authorization'] = `Bearer ${await user.getIdToken()}`; } catch { /* fall back to cookie */ }
    }
    return headers;
  };

  // Fire-and-forget activity logging. The server records WHO from the verified
  // session; we only describe WHAT. Logging must never break the action, so any
  // failure is swallowed. We never send GET reads or the log call itself.
  const logActivity = async (payload: Record<string, unknown>) => {
    try {
      const headers = await authHeaders();
      // keepalive lets the log survive a navigation that unmounts the page.
      void fetch('/api/staff/activity-log', { method: 'POST', headers, credentials: 'same-origin', keepalive: true, body: JSON.stringify(payload) });
    } catch { /* logging is best-effort */ }
  };

  const authedFetch = async (path: string, init?: RequestInit) => {
    const headers = await authHeaders(init?.headers as Record<string, string> | undefined);
    return fetch(path, { ...init, headers, credentials: 'same-origin' });
  };
  // NOTE: write actions (posts, edits, status changes, deletes) are logged
  // SERVER-SIDE in the /api/staff/* write handlers via recordActivity — not here.
  // A client wrapper missed writes made by components with their own fetch (e.g.
  // PropertyForm's createVia/updateVia), so posts never showed up. logActivity
  // above is now only used for section-view clicks and the login event.

  // Record one "signed in" entry per dashboard load, so admins can see when each
  // staff member started a session (not just what they changed).
  const loggedSession = useRef(false);
  useEffect(() => {
    if (!ready || !profile || loggedSession.current) return;
    if (profile.role !== 'staff' && profile.role !== 'admin') return;
    loggedSession.current = true;
    void logActivity({ type: 'login' });
  }, [ready, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile || tab === 'edit' || !perms.includes(tab)) return;
    const load = async (path: string, key: string, apply: (j: any) => void) => {
      try {
        const res = await authedFetch(path);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message ? `${res.status} · ${json.message}` : `HTTP ${res.status}`);
        apply(json);
        setErrors(e => ({ ...e, [key]: '' }));
      } catch (err: any) {
        console.error(`${path} failed:`, err);
        setErrors(e => ({ ...e, [key]: err.message || 'Request failed' }));
      } finally {
        setLoaded(l => ({ ...l, [key]: true }));
      }
    };
    if (tab === 'properties' && !loaded.properties) load('/api/staff/properties', 'properties', j => setProperties(j.properties || []));
    // The Rent Review tool prefills from the same property list.
    if (tab === 'rent-reviews' && !loaded.properties) load('/api/staff/properties', 'properties', j => setProperties(j.properties || []));
    if (tab === 'applications' && !loaded.applications) load('/api/staff/applications', 'applications', j => setApplications(j.applications || []));
    if (tab === 'maintenance' && !loaded.maintenance) load('/api/staff/maintenance', 'maintenance', j => setMaintenance(j.requests || []));
    if (tab === 'orders' && !loaded.orders) load('/api/staff/orders', 'orders', j => setOrders(j.orders || []));
    if (tab === 'agreements' && !loaded.agreements) load('/api/staff/agreements', 'agreements', j => setAgreements(j.agreements || []));
    if (tab === 'valuations' && !loaded.valuations) load('/api/staff/valuations', 'valuations', j => setValuations(j.valuations || []));
    if (tab === 'reviews' && !loaded.reviews) load('/api/staff/reviews', 'reviews', j => setReviews(j.reviews || []));
    if (tab === 'rent-reviews' && !loaded['rent-reviews']) load('/api/staff/rent-reviews', 'rent-reviews', j => setRentReviews(j.reviews || []));
  }, [tab, profile, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Eager-load agreements once so the sidebar shows the received count without
  // needing to open the tab first.
  useEffect(() => {
    if (!profile || !perms.includes('agreements') || loaded.agreements) return;
    authedFetch('/api/staff/agreements')
      .then(r => r.json())
      .then(j => setAgreements(j.agreements || []))
      .catch(() => { /* ignore */ })
      .finally(() => setLoaded(l => ({ ...l, agreements: true })));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloadProperties = () => {
    setLoaded(l => ({ ...l, properties: false }));
    setTab('properties');
  };

  // ── Property management (server-side, same cookie auth as every staff route) ──
  const patchProperty = async (id: string, updates: Record<string, any>): Promise<boolean> => {
    try {
      const res = await authedFetch('/api/staff/properties', { method: 'PATCH', body: JSON.stringify({ id, ...updates }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (e) {
      console.error('property update failed:', e);
      alert('Could not update the property. Please try again.');
      return false;
    }
  };

  const handleSetAvailability = async (p: Property, availability: 'available' | 'pending' | 'let-agreed') => {
    const prev = properties;
    setProperties(ps => ps.map(x => x.id === p.id ? { ...x, availability, letAgreed: availability === 'let-agreed' } : x));
    if (!(await patchProperty(p.id!, { availability, letAgreed: availability === 'let-agreed' }))) setProperties(prev);
  };

  const handleToggleProperty = async (p: Property) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    const prev = properties;
    setProperties(ps => ps.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
    if (!(await patchProperty(p.id!, { status: newStatus }))) setProperties(prev);
  };

  const handleDeleteProperty = async (p: Property) => {
    if (!confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    const prev = properties;
    setProperties(ps => ps.filter(x => x.id !== p.id));
    try {
      const res = await authedFetch(`/api/staff/properties?id=${encodeURIComponent(p.id!)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('property delete failed:', e);
      setProperties(prev);
      alert('Could not delete the property. Please try again.');
    }
  };

  const handleEditProperty = (p: Property) => { setEditingProperty(p); setTab('edit'); };
  const handleEditSuccess = () => { setEditingProperty(null); setLoaded(l => ({ ...l, properties: false })); setTab('properties'); };
  const handleEditCancel = () => { setEditingProperty(null); setTab('properties'); };

  const updateAgreementStatus = async (id: string, status: string) => {
    const prev = agreements;
    setAgreements(as => as.map(a => a.id === id ? { ...a, status } : a));
    try {
      const res = await authedFetch('/api/staff/agreements', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('agreement status update failed:', e);
      setAgreements(prev);
      alert('Could not update the status. Please try again.');
    }
  };

  const saveAgreementEdit = async (id: string, fields: Record<string, any>, mode: 'save' | 'correct' | 'reissue'): Promise<boolean> => {
    try {
      const res = await authedFetch('/api/staff/agreements', { method: 'PATCH', body: JSON.stringify({ id, action: 'edit', fields, mode }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || `HTTP ${res.status}`);
      setAgreements(as => as.map(a => a.id === id
        ? { ...a, ...fields, ...(mode === 'reissue' ? { status: 'awaiting-signature', awaitingSignature: true } : {}) }
        : a));
      setEditingAgreement(null);
      if (mode === 'correct') alert('Saved. An updated copy has been emailed to the landlord and the office.');
      if (mode === 'reissue') alert('Saved. A link to review and re-sign has been emailed to the landlord.');
      return true;
    } catch (e) {
      console.error('agreement edit failed:', e);
      return false;
    }
  };

  // Re-send the two post-agreement forms (Authorisation + Bank/AML) to the
  // landlord. Returns a result the progress panel renders inline.
  const remindLandlordForms = async (id: string, party: string, kind: 'forms' | 'agreement'): Promise<{ ok: boolean; message?: string }> => {
    try {
      const action = kind === 'agreement' ? 'remind-agreement' : 'remind-forms';
      const res = await authedFetch('/api/staff/agreements', { method: 'PATCH', body: JSON.stringify({ id, action, party }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, message: j.message || `HTTP ${res.status}` };
      return { ok: true };
    } catch {
      return { ok: false, message: 'Network error — please try again.' };
    }
  };

  const updateRentReviewStatus = async (id: string, status: string) => {
    const prev = rentReviews;
    setRentReviews(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    try {
      const res = await authedFetch('/api/staff/rent-reviews', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('rent review status update failed:', e);
      setRentReviews(prev);
      alert('Could not update the status. Please try again.');
    }
  };

  const updateMaintStatus = async (id: string, status: string) => {
    const prev = maintenance;
    setMaintenance(ms => ms.map(m => m.id === id ? { ...m, status } : m));
    try {
      const res = await authedFetch('/api/staff/maintenance', { method: 'PATCH', body: JSON.stringify({ id, status }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('maintenance status update failed:', e);
      setMaintenance(prev); // roll back
      alert('Could not update the status. Please try again.');
    }
  };

  const submitReview = async () => {
    setReviewMsg(null);
    if (!reviewForm.author_name.trim()) { setReviewMsg({ kind: 'err', text: 'Reviewer name is required.' }); return; }
    if (!reviewForm.text.trim()) { setReviewMsg({ kind: 'err', text: 'Review text is required.' }); return; }
    setReviewSaving(true);
    try {
      const res = await authedFetch('/api/staff/reviews', { method: 'POST', body: JSON.stringify(reviewForm) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setReviews(prev => [json.review, ...prev]);
      setReviewForm(EMPTY_REVIEW_FORM);
      setReviewMsg({ kind: 'ok', text: 'Review added.' });
      setTimeout(() => setReviewMsg(null), 3000);
    } catch (e: any) {
      setReviewMsg({ kind: 'err', text: e.message || 'Failed to save review.' });
    }
    setReviewSaving(false);
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await authedFetch(`/api/staff/reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('review delete failed:', e);
      alert('Could not delete the review. Please try again.');
    }
  };

  if (!ready || !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  const filteredProps = properties.filter(p =>
    p.title?.toLowerCase().includes(searchProp.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchProp.toLowerCase())
  );

  const counts: Record<StaffFeature, number | null> = {
    properties: properties.length,
    applications: applications.length,
    agreements: agreements.length,
    coupons: null,
     'rent-reviews': rentReviews.length,
    maintenance: maintenance.length,
    orders: orders.length,
    valuations: valuations.length,
    reviews: reviews.length,
    landlords: null,
    post: null,
  };

  // 'coupons' is a permission flag (gates the Coupons tool inside the
  // Agreements tab), not a sidebar page of its own — exclude it from the nav.
  const navItems = STAFF_FEATURES.filter(f => f.id !== 'coupons' && perms.includes(f.id)).map(f => ({
    id: f.id as Tab,
    icon: f.icon,
    label: counts[f.id] === null ? f.label : `${f.label} (${counts[f.id]})`,
  }));

  const maintCounts: Record<MaintFilter, number> = {
    all: maintenance.length,
    open: maintenance.filter(m => m.status === 'open').length,
    'in-progress': maintenance.filter(m => m.status === 'in-progress').length,
    resolved: maintenance.filter(m => m.status === 'resolved').length,
    cancelled: maintenance.filter(m => m.status === 'cancelled').length,
  };
  const filteredMaint = maintenance.filter(m => maintFilter === 'all' || m.status === maintFilter);

  return (
    <>
      <Navbar />
      <div className="dash-layout">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div style={{ padding: '0 28px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)',
              color: '#93c5fd', borderRadius: 4, padding: '4px 10px', fontSize: 11,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
            }}>
              👤 Staff
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{profile.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{profile.email}</div>
          </div>

          {navItems.map(item => (
            <button
              key={item.id}
              className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => { setTab(item.id); void logActivity({ type: 'view', section: item.label }); }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <button className="dash-nav-item" onClick={handleSignOut} style={{ marginTop: 18 }}>
            <span>🚪</span> Sign Out
          </button>
        </aside>

        {/* ── Main Content ── */}
        <main className="dash-content">

          {perms.length === 0 && (
            <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
              <h3 style={{ fontSize: 22, marginBottom: 10 }}>No sections enabled</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>Ask an admin to enable dashboard features for your account.</p>
            </div>
          )}

          {errors[tab] && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, fontWeight: 600 }}>
              ⚠️ Couldn&rsquo;t load {tab}: {errors[tab]}
            </div>
          )}

          {/* ── Properties ── */}
          {tab === 'properties' && perms.includes('properties') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <h1 className="dash-section-title">Properties</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    className="form-input"
                    style={{ width: 240 }}
                    placeholder="Search by title or location…"
                    value={searchProp}
                    onChange={e => setSearchProp(e.target.value)}
                  />
                  {perms.includes('post') && (
                    <button
                      onClick={() => setTab('post')}
                      style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ➕ Post Property
                    </button>
                  )}
                </div>
              </div>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Property</th><th>Location</th><th>Rent</th><th>Status</th><th>Beds</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredProps.map(p => {
                      const av = propertyAvailability(p);
                      const avMeta = AVAILABILITY_META[av];
                      return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{p.location}</td>
                        <td style={{ fontWeight: 700, color: 'var(--red)' }}>£{p.price?.toLocaleString()}</td>
                        <td>
                          <StatusBadge status={p.status} />
                          <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, background: avMeta.bg, color: avMeta.color, borderRadius: 3, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{avMeta.label}</span>
                        </td>
                        <td style={{ fontSize: 13 }}>{p.bedrooms === 0 ? 'Studio' : p.bedrooms}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => handleEditProperty(p)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #1565c0', color: '#1565c0', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>✏️ Edit</button>
                            <button onClick={() => handleToggleProperty(p)} style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${p.status === 'active' ? '#f57f17' : '#2e7d32'}`, color: p.status === 'active' ? '#f57f17' : '#2e7d32', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>{p.status === 'active' ? 'Deactivate' : 'Approve'}</button>
                            <select value={av} onChange={e => handleSetAvailability(p, e.target.value as 'available' | 'pending' | 'let-agreed')} title="Set listing availability" style={{ padding: '5px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', border: `1px solid ${avMeta.color}`, color: avMeta.color, background: avMeta.bg, fontWeight: 700 }}>
                              <option value="available">Available</option>
                              <option value="pending">Pending</option>
                              <option value="let-agreed">Let Agreed</option>
                            </select>
                            {isAdmin && <button onClick={() => handleDeleteProperty(p)} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #c62828', color: '#c62828', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Delete</button>}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!loaded.properties ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading properties…</div>
                ) : filteredProps.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No properties found.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Applications ── */}
          {tab === 'applications' && perms.includes('applications') && (
            <div>
              <h1 className="dash-section-title">Tenancy Applications</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>All tenancy applications submitted via the website.</p>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Applicant</th><th>Property</th><th>Email</th><th>Phone</th><th>Status</th><th>Submitted</th></tr>
                  </thead>
                  <tbody>
                    {applications.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{a.fullName}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 220 }}>{a.propertyAddress}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{a.email}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{a.phone}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtDate(a.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.applications ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading applications…</div>
                ) : applications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No applications yet.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Maintenance ── */}
          {tab === 'maintenance' && perms.includes('maintenance') && (
            <div>
              <h1 className="dash-section-title">Maintenance Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 15 }}>
                Repair and maintenance issues reported through the website form. Use the status dropdown on each row to keep the team up to date.
              </p>

              {/* Status filter chips */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {(['all', ...MAINT_STATUSES] as MaintFilter[]).map(f => {
                  const colors: Record<string, string> = {
                    all: '#374151', open: '#f57f17', 'in-progress': '#1565c0', resolved: '#2e7d32', cancelled: '#c62828',
                  };
                  const isActive = maintFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setMaintFilter(f)}
                      style={{
                        padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', border: `1px solid ${colors[f]}`,
                        background: isActive ? colors[f] : '#fff',
                        color: isActive ? '#fff' : colors[f],
                        textTransform: 'capitalize',
                      }}
                    >
                      {f === 'all' ? 'All' : f.replace('-', ' ')} ({maintCounts[f]})
                    </button>
                  );
                })}
              </div>

              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Reported by</th><th>Property</th><th>Issue</th><th>Contact</th><th>Photos</th><th>Submitted</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredMaint.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{m.fullName}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 180 }}>{m.propertyAddress}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 240 }}>{m.issueDescription}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          <div>{m.email}</div>
                          <div>{m.contactNumber}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {m.photoUrls?.length
                            ? <a href={safeLinkHref(m.photoUrls[0])} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>{m.photoUrls.length} photo{m.photoUrls.length > 1 ? 's' : ''}</a>
                            : <span style={{ color: 'var(--gray-400)' }}>-</span>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtDate(m.submittedAt)}</td>
                        <td>
                          <select
                            value={m.status}
                            onChange={e => updateMaintStatus(m.id, e.target.value)}
                            style={{
                              padding: '6px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', outline: 'none',
                              border: `1px solid ${badge(m.status).color}`, color: badge(m.status).color,
                              background: badge(m.status).bg, fontWeight: 700,
                            }}
                          >
                            {MAINT_STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.maintenance ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading maintenance requests…</div>
                ) : filteredMaint.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    {maintFilter === 'all' ? 'No maintenance requests yet.' : `No ${maintFilter.replace('-', ' ')} requests.`}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === 'orders' && perms.includes('orders') && (
            <div>
              <h1 className="dash-section-title">Service Orders</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                Orders placed through Additional Services. Payment proof links open in a new tab.
              </p>
              {!loaded.orders ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading orders…</div>
              ) : orders.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 15, padding: '56px 24px' }}>
                  No orders yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {orders.map(o => {
                    const isOpen = expandedOrder === o.id;
                    return (
                      <div key={o.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 15, color: 'var(--navy)' }}>{o.customer?.fullName || ','}</strong>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-400)' }}>{o.ref}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 3 }}>
                              {o.customer?.email} · {o.customer?.phone} · {o.lines?.length || 0} item{(o.lines?.length || 0) !== 1 ? 's' : ''} · {fmtDate(o.createdAt)}
                            </div>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
                            {o.hasFrom ? <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 700 }}>from </span> : null}£{o.total}
                          </div>
                          <button onClick={() => setExpandedOrder(isOpen ? null : o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', fontSize: 13, fontWeight: 600 }}>
                            {isOpen ? 'Hide ▲' : 'Details ▼'}
                          </button>
                        </div>
                        {isOpen && (
                          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '16px 20px', background: '#fafbfc' }}>
                            {o.lines?.map((l, li) => (
                              <div key={li} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{l.name}{l.quantity > 1 ? ` ×${l.quantity}` : ''}</div>
                                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{l.categoryTitle}</div>
                                  {l.variantLabel && <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{l.variantLabel}</div>}
                                  {l.addOns?.map((a, ai) => <div key={ai} style={{ fontSize: 12, color: 'var(--gray-600)' }}>+ {a.label}{a.count ? ` ×${a.count}` : ''}, £{a.amount}</div>)}
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{l.from ? 'from ' : ''}£{l.total}</div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 14, fontSize: 13, color: 'var(--gray-600)' }}>
                              <div><strong style={{ color: 'var(--navy)' }}>Postcode:</strong> {o.customer?.postcode || ','}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Address:</strong> {o.customer?.address || ','}</div>
                            </div>
                            {o.customer?.notes && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gray-600)' }}><strong style={{ color: 'var(--navy)' }}>Notes:</strong> {o.customer.notes}</div>}
                            {(o.proofOfPaymentUrls?.length || 0) > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Proof of payment</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {o.proofOfPaymentUrls!.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: '#f0fdf4', color: '#15803d', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #bbf7d0' }}>📄 Proof {i + 1}</a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Landlord Registration (registrations with a signed agreement) ── */}
          {tab === 'agreements' && perms.includes('agreements') && showAgreementWording && profile.role === 'admin' && (
            <AgreementTemplateEditor authedFetch={authedFetch} onClose={() => setShowAgreementWording(false)} />
          )}
          {tab === 'agreements' && perms.includes('agreements') && perms.includes('coupons') && showCoupons && !showAgreementWording && (
            <CouponManager authedFetch={authedFetch} onClose={() => setShowCoupons(false)} />
          )}
          {tab === 'agreements' && perms.includes('agreements') && !(perms.includes('coupons') && showCoupons) && !(showAgreementWording && profile.role === 'admin') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <h1 className="dash-section-title" style={{ margin: 0 }}>Landlord Registration</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {perms.includes('coupons') && (
                    <button onClick={() => setShowCoupons(true)} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      🎟️ Coupons
                    </button>
                  )}
                  {profile.role === 'admin' && (
                    <button onClick={() => setShowAgreementWording(true)} style={{ background: '#eff5ff', color: '#2563eb', border: '1px solid #dbe4ff', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      ✎ Edit agreement wording
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: 'var(--gray-600)', margin: '8px 0 24px', fontSize: 15 }}>
                Landlord registrations with a signed management agreement. Set the status as each one progresses, or Edit to correct a landlord’s details or change the package, then save, email a corrected copy, or re-issue for signature.
              </p>
              {!loaded.agreements ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading registrations…</div>
              ) : agreements.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 15, padding: '56px 24px' }}>
                  No landlord registrations yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {agreements.map(a => {
                    const isOpen = expandedAgreement === a.id;
                    const propLine = [a.flatNumber, a.street, a.city, a.postcode].filter(Boolean).join(', ');
                    return (
                      <div key={a.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 15, color: 'var(--navy)' }}>{a.fullName || '-'}</strong>
                              <StatusBadge status={a.status} />
                              {a.secondLandlordStatus && (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, ...jointChip(a.secondLandlordStatus) }}>
                                  👥 {a.secondLandlordStatus === 'completed' ? 'Joint signed' : a.secondLandlordStatus === 'declined' ? 'Joint declined' : 'Joint pending'}
                                </span>
                              )}
                              <LandlordProgressBadge a={a as Record<string, any>} />
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 3 }}>
                              {a.selectedPackage || 'Package not set'} · {propLine || 'No property'} · {fmtDate(a.createdAt)}
                            </div>
                          </div>
                          <select
                            value={AGREEMENT_STATUSES.includes(a.status as any) ? a.status : 'signed'}
                            onChange={e => updateAgreementStatus(a.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--gray-200)', fontSize: 13, background: '#fff', textTransform: 'capitalize' }}
                          >
                            {AGREEMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => { setEditingAgreement(editingAgreement === a.id ? null : a.id); setExpandedAgreement(null); }} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#2563eb', fontSize: 13, fontWeight: 600 }}>
                            {editingAgreement === a.id ? 'Close' : 'Edit'}
                          </button>
                          <button onClick={() => { setExpandedAgreement(isOpen ? null : a.id); setEditingAgreement(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', fontSize: 13, fontWeight: 600 }}>
                            {isOpen ? 'Hide ▲' : 'Details ▼'}
                          </button>
                        </div>
                        {editingAgreement === a.id && (
                          <AgreementEditor
                            agreement={a as Record<string, any>}
                            onSave={(fields, mode) => saveAgreementEdit(a.id, fields, mode)}
                            onCancel={() => setEditingAgreement(null)}
                          />
                        )}
                        {isOpen && (
                          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '16px 20px', background: '#fafbfc', fontSize: 13, color: 'var(--gray-600)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '8px 24px' }}>
                              <div><strong style={{ color: 'var(--navy)' }}>Email:</strong> {a.email || '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Phone:</strong> {a.phone || '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Billing address:</strong> {a.contactAddress || '-'}</div>
                              {a.jointLandlord && a.landlord2Name && <div><strong style={{ color: 'var(--navy)' }}>Joint landlord:</strong> {a.landlord2Name}</div>}
                              <div><strong style={{ color: 'var(--navy)' }}>Residency:</strong> {a.residency === 'non-resident' ? 'Non-resident (NRL)' : 'UK-resident'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Property:</strong> {propLine || '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Type / beds:</strong> {[a.propertyType, a.bedrooms && `${a.bedrooms} bed`, a.furnishing].filter(Boolean).join(' · ') || '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Expected rent:</strong> {a.currentRent ? `£${a.currentRent}/month` : '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Available from:</strong> {a.availableFrom || '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Package:</strong> {a.selectedPackage || '-'}</div>
                              <div><strong style={{ color: 'var(--navy)' }}>Signed by:</strong> {a.signatureName || a.fullName} {a.signatureDate ? `on ${a.signatureDate}` : ''}</div>
                            </div>
                            {(a.signatureUrl || a.signature2Url) && (
                              <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                {a.signatureUrl && (
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Signature — {a.signatureName || a.fullName}</div>
                                    <a href={safeLinkHref(a.signatureUrl)} target="_blank" rel="noopener noreferrer">
                                      <img src={safeLinkHref(a.signatureUrl)} alt="Landlord signature" style={{ maxHeight: 80, border: '1px solid var(--gray-200)', borderRadius: 6, background: '#fff', padding: 4 }} />
                                    </a>
                                  </div>
                                )}
                                {a.signature2Url && (
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Second landlord — {a.signature2Name || a.landlord2Name}</div>
                                    <a href={safeLinkHref(a.signature2Url)} target="_blank" rel="noopener noreferrer">
                                      <img src={safeLinkHref(a.signature2Url)} alt="Second landlord signature" style={{ maxHeight: 80, border: '1px solid var(--gray-200)', borderRadius: 6, background: '#fff', padding: 4 }} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            <LandlordProgressPanel a={a as Record<string, any>} onRemind={remindLandlordForms} />
                            <SecondLandlordDetails a={a as Record<string, any>} />
                            <CoSignersDetails a={a as Record<string, any>} />
                            <AgreementExtraDetails a={a as Record<string, any>} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Valuations ── */}
          {tab === 'valuations' && perms.includes('valuations') && (
            <div>
              <h1 className="dash-section-title">Valuation Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>All property valuation bookings from the website.</p>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Customer</th><th>Property</th><th>Type / Beds</th><th>Preferred Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {valuations.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{v.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{v.email}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{v.phone}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 200 }}>{v.address}</td>
                        <td style={{ fontSize: 13 }}>
                          <div>{v.propertyType}</div>
                          <div style={{ color: 'var(--gray-400)' }}>{v.bedrooms}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                          {v.preferredDateTime
                            ? new Date(v.preferredDateTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                            : '-'}
                        </td>
                        <td><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loaded.valuations ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading valuations…</div>
                ) : valuations.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No valuation requests yet.</div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && perms.includes('reviews') && (
            <div>
              <h1 className="dash-section-title">Google Reviews</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                Add and manage reviews shown on the website. Only 4★ and 5★ reviews are displayed publicly.
              </p>

              <div className="dash-card" style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>➕ Add New Review</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <input className="form-input" placeholder="Reviewer name *" value={reviewForm.author_name} onChange={e => setReviewForm(f => ({ ...f, author_name: e.target.value }))} />
                  <select className="form-input" value={reviewForm.location} onChange={e => setReviewForm(f => ({ ...f, location: e.target.value as 'leeds' | 'manchester' }))}>
                    <option value="leeds">📍 Leeds</option>
                    <option value="manchester">📍 Manchester</option>
                  </select>
                  <select className="form-input" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}>
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                  </select>
                  <input className="form-input" placeholder="Time label (e.g. 2 weeks ago)" value={reviewForm.relative_time_description} onChange={e => setReviewForm(f => ({ ...f, relative_time_description: e.target.value }))} />
                </div>
                <textarea className="form-input" rows={4} placeholder="Paste the review text from Google… *" value={reviewForm.text} onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} style={{ resize: 'vertical', marginBottom: 14 }} />
                {reviewMsg && (
                  <div style={{
                    background: reviewMsg.kind === 'ok' ? '#e8f5e9' : '#fce4ec',
                    color: reviewMsg.kind === 'ok' ? '#2e7d32' : '#c62828',
                    padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14,
                  }}>
                    {reviewMsg.text}
                  </div>
                )}
                <button
                  onClick={submitReview}
                  disabled={reviewSaving}
                  style={{ padding: '12px 26px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: reviewSaving ? 'not-allowed' : 'pointer', opacity: reviewSaving ? 0.7 : 1 }}
                >
                  {reviewSaving ? 'Saving…' : '✓ Add Review'}
                </button>
              </div>

              {!loaded.reviews ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 44 }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>⭐</div>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>No reviews yet. Add one above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map(r => (
                    <div key={r.id} className="dash-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #2563eb, #4a90d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden',
                      }}>
                        {r.profile_photo_url
                          ? <img src={r.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (r.author_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.author_name}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: r.location === 'leeds' ? '#eff6ff' : '#f0fdf4',
                            color: r.location === 'leeds' ? '#1d4ed8' : '#15803d',
                          }}>
                            📍 {r.location === 'leeds' ? 'Leeds' : 'Manchester'}
                          </span>
                          <span style={{ fontSize: 12, color: '#F59E0B', letterSpacing: 1 }}>{'★'.repeat(r.rating)}</span>
                          {r.relative_time_description && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.relative_time_description}</span>}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                      </div>
                      {isAdmin && <button className="btn-danger" onClick={() => deleteReview(r.id)} style={{ flexShrink: 0 }}>Delete</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Landlords ── */}
          {tab === 'landlords' && perms.includes('landlords') && (
            <LandlordsPanel canDelete={profile?.role === 'admin'} />
          )}

          {/* ── Post Property ── */}
          {tab === 'post' && perms.includes('post') && (
            <div>
              <h1 className="dash-section-title">Post a Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>Add a new property listing to the website.</p>
              <div className="dash-card">
                <PropertyForm
                  landlordId={profile.uid}
                  landlordName={profile.name}
                  onSuccess={reloadProperties}
                  onCancel={() => setTab('properties')}
                  // Save server-side, like every other staff feature: a
                  // cookie-only session has no Firebase client user, so a
                  // browser write is unauthenticated and hangs.
                  createVia="/api/staff/properties"
                />
              </div>
            </div>
          )}

          {/* ── Edit Property ── */}
          {tab === 'edit' && editingProperty && (
            <div>
              <h1 className="dash-section-title">Edit Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>Update this listing&rsquo;s details, photos and features.</p>
              <div className="dash-card">
                <PropertyForm
                  landlordId={editingProperty.landlordId || profile.uid}
                  landlordName={(editingProperty as any).landlordName || profile.name}
                  existing={editingProperty}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                  // Edit server-side too, a cookie-only staff session can't
                  // write to Firestore directly.
                  updateVia="/api/staff/properties"
                />
              </div>
            </div>
          )}

          {/* ── Rent Reviews ── */}
          {tab === 'rent-reviews' && perms.includes('rent-reviews') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 className="dash-section-title" style={{ margin: 0 }}>Rent Reviews</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setShowRRCalc(v => !v)} style={{ padding: '10px 16px', background: showRRCalc ? '#e5e7eb' : '#0f1f3d', color: showRRCalc ? '#374151' : '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {showRRCalc ? '✕ Close calculator' : '📈 Market rent calculator'}
                  </button>
                  <button onClick={() => setShowRRProps(v => !v)} style={{ padding: '10px 16px', background: showRRProps ? '#e5e7eb' : '#2563eb', color: showRRProps ? '#374151' : '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {showRRProps ? '✕ Close property list' : '🏠 Manage properties'}
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 15 }}>Annual rent reviews submitted by existing tenants. Expand a row to see the full submission and documents; use the status dropdown to keep the team on track.</p>
              {showRRCalc && (
                <div className="dash-card" style={{ padding: 24, marginBottom: 20 }}>
                  <RentReviewPanel
                    properties={properties}
                    loading={!loaded.properties}
                    error={errors.properties || undefined}
                  />
                </div>
              )}
              {showRRProps && <RentReviewPropertyManager authedFetch={authedFetch} portfolio={properties} canDelete={isAdmin} />}
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Tenant</th><th>Property</th><th>Rent</th><th>Decision</th><th>Status</th><th>Submitted</th></tr>
                  </thead>
                  <tbody>
                    {rentReviews.map(r => {
                      const open = expandedRR === r.id;
                      const decision = r.rentDecision === 'accept' ? 'Accepts' : r.rentDecision === 'discuss' ? 'Wants to discuss' : '-';
                      return (
                        <Fragment key={r.id}>
                          <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedRR(open ? null : r.id)}>
                            <td style={{ fontWeight: 600, fontSize: 14 }}>{r.fullName}<div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>{r.email}</div></td>
                            <td style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 220 }}>{r.propertyAddress}</td>
                            <td style={{ fontSize: 13 }}>{r.currentRent ? `£${r.currentRent}` : '-'}{r.proposedRent ? ` → £${r.proposedRent}` : ''}</td>
                            <td style={{ fontSize: 13 }}>{decision}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <select value={r.status} onChange={e => updateRentReviewStatus(r.id, e.target.value)} className="form-select" style={{ width: 130, fontSize: 12, padding: '5px 8px', border: `1px solid ${badge(r.status).color}`, color: badge(r.status).color, background: badge(r.status).bg, borderRadius: 4, fontWeight: 700 }}>
                                {RR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{fmtDate(r.submittedAt)}</td>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={6} style={{ background: '#f8fafc', padding: 20 }}>
                                <RentReviewDetail r={r} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {!loaded['rent-reviews'] ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Loading rent reviews…</div>
                ) : rentReviews.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No rent reviews yet.</div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
      <StaffDashboardInner />
    </Suspense>
  );
}
