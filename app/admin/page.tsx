'use client';
// app/admin/page.tsx
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PropertyForm from '@/components/property/PropertyForm';
import RentReviewPropertyManager from '@/components/dashboard/RentReviewPropertyManager';
import RentReviewPanel from '@/components/valuation/RentReviewPanel';
import { useAuth } from '@/hooks/useAuth';
import {
  getAllUsers,
  getAllProperties,
  deleteUserRecord,
  adminDeleteProperty,
  adminSetPropertyStatus,
  adminSetPropertyAvailability,
  getAnalytics,
} from '@/services/admin';
import { AppUser, Property, propertyAvailability } from '@/lib/types';
import { STAFF_FEATURES, staffPermissions } from '@/lib/staffAccess';
import { safeLinkHref } from '@/lib/security';

const AVAILABILITY_META: Record<'available' | 'pending' | 'let-agreed', { label: string; bg: string; color: string }> = {
  'available':  { label: 'Available',  bg: '#e8f5e9', color: '#2e7d32' },
  'pending':    { label: 'Pending',    bg: '#fff3e0', color: '#ef6c00' },
  'let-agreed': { label: 'Let Agreed', bg: '#fdecea', color: '#c62828' },
};
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, orderBy, query, doc,
  updateDoc, addDoc, deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';

type Tab = 'analytics' | 'users' | 'properties' | 'post' | 'edit' | 'valuations' | 'reviews' | 'applications' | 'orders' | 'maintenance' | 'rent-reviews';

interface ServiceOrderLine {
  serviceId: string;
  name: string;
  categoryTitle: string;
  variantLabel?: string | null;
  base: number;
  from?: boolean;
  addOns: { id: string; label: string; count?: number; amount: number }[];
  quantity: number;
  total: number;
}
interface ServiceOrder {
  id: string;
  ref: string;
  customer: { fullName: string; email: string; phone: string; postcode?: string; address?: string; notes?: string };
  lines: ServiceOrderLine[];
  total: number;
  hasFrom?: boolean;
  proofOfPaymentUrls?: string[];
  status: 'pending' | 'contacted' | 'paid' | 'completed' | 'cancelled';
  createdAt: any;
}

interface WebStats {
  totalViews: number;
  uniqueVisitors: number;
  byCountry: Record<string, number>;
  byPath: Record<string, number>;
  byDay: Record<string, number>;
  updatedAt: number | null;
}

// ── Visitor-analytics display helpers ──────────────────────────────────────────
const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom', US: 'United States', IE: 'Ireland', IN: 'India', PK: 'Pakistan',
  FR: 'France', DE: 'Germany', ES: 'Spain', IT: 'Italy', NL: 'Netherlands', PL: 'Poland',
  CA: 'Canada', AU: 'Australia', NG: 'Nigeria', ZA: 'South Africa', AE: 'UAE', RO: 'Romania',
  PT: 'Portugal', BR: 'Brazil', CN: 'China', ZZ: 'Unknown',
};
function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

const ORDER_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fff8e1', color: '#f57f17' },
  contacted: { bg: '#e3f2fd', color: '#1565c0' },
  paid:      { bg: '#e8f5e9', color: '#2e7d32' },
  completed: { bg: '#ede7f6', color: '#6a1b9a' },
  cancelled: { bg: '#fdecea', color: '#c62828' },
};
function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code) || code === 'ZZ') return '🌐';
  return String.fromCodePoint(...code.split('').map(c => 127397 + c.charCodeAt(0)));
}
// Turn a { key: count } map into a sorted, top-N list.
function topEntries(map: Record<string, number> | undefined, n = 6): [string, number][] {
  return Object.entries(map || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
}
// The last `days` calendar days as YYYY-MM-DD (oldest first), from a base millis.
function lastDays(nowMs: number, days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(new Date(nowMs - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: any;
}

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
  location: 'leeds' | 'manchester';
  createdAt: any;
}

interface TenantApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  nationality: string;
  niNumber: string;
  billingAddress: string;
  rightToRent: string;
  shareCode?: string;
  govIdUrls: string[];
  proofOfAddressUrls: string[];
  rightToRentDocUrls: string[];
  employmentStatus: string;
  employerPhone: string;
  employerEmail: string;
  annualIncome: string;
  additionalIncome: string;
  hasCCJ: string;
  wasBankrupt: string;
  payslipUrls: string[];
  bankStatementUrls: string[];
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  currentAddress: string;
  tenancyStart: string;
  tenancyEnd: string;
  reasonLeaving: string;
  leaseTerm: string;
  moveInDate: string;
  pets: string;
  guarantor: string;
  consentContact: boolean;
  consentDeclare: boolean;
  submissionDate: string;
  propertyAddress: string;
  rent: string;
  deposit: string;
  holdingDeposit: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  createdAt: any;
}

interface MaintenanceRequest {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  propertyAddress: string;
  issueDescription: string;
  whenHappened?: string;
  availability?: string;
  experiencedBefore?: string;
  cause?: string;
  photoUrls?: string[];
  videoUrls?: string[];
  status: 'open' | 'in-progress' | 'resolved' | 'cancelled';
  createdAt: any;
}

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
  createdAt: any;
}

const RENT_REVIEW_STATUSES = ['pending', 'reviewing', 'agreed', 'completed', 'cancelled'] as const;
const ynText = (v?: string) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '-');

const EMPTY_REVIEW = {
  author_name: '',
  rating: 5,
  text: '',
  relative_time_description: '',
  profile_photo_url: '',
  location: 'leeds' as 'leeds' | 'manchester',
};

// Expanded detail for one rent review: every declaration + document links.
function RentReviewDetail({ r }: { r: RentReview }) {
  const Row = ({ label, value }: { label: string; value?: string }) => (
    <div style={{ display: 'flex', gap: 10, fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: 'var(--gray-500)', minWidth: 210, fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--gray-800)', fontWeight: 600 }}>{value && value.trim() ? value : '-'}</span>
    </div>
  );
  const Files = ({ label, urls }: { label: string; urls?: string[] }) => (
    <div style={{ display: 'flex', gap: 10, fontSize: 13, padding: '4px 0', alignItems: 'center' }}>
      <span style={{ color: 'var(--gray-500)', minWidth: 210, fontWeight: 500 }}>{label}</span>
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
      <Row label="Pets" value={ynText(r.pets)} />
      {r.pets === 'yes' && <Row label="Pet Details" value={r.petDetails} />}
      <Row label="Annual Income" value={r.annualIncome} />

      <H>Financial Status</H>
      <Row label="CCJs / financial issues?" value={ynText(r.hasCCJ)} />
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  // Authenticated fetch for the shared staff APIs (admins pass the staff gate).
  const authedFetch = async (path: string, init?: RequestInit) => {
    const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };
    if (user) { try { headers['Authorization'] = `Bearer ${await user.getIdToken()}`; } catch { /* cookie fallback */ } }
    return fetch(path, { ...init, headers, credentials: 'same-origin' });
  };
  const [tab, setTab] = useState<Tab>('analytics');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'leeds' | 'manchester'>('all');
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchProp, setSearchProp] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'reviewing' | 'approved' | 'rejected'>('all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [webStats, setWebStats] = useState<WebStats | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [expandedMaint, setExpandedMaint] = useState<string | null>(null);
  const [rentReviews, setRentReviews] = useState<RentReview[]>([]);
  const [expandedRR, setExpandedRR] = useState<string | null>(null);
  const [showRRProps, setShowRRProps] = useState(false);
  const [showRRCalc, setShowRRCalc] = useState(false);
  // Per-staff dashboard access editor (Users tab).
  const [accessUser, setAccessUser] = useState<AppUser | null>(null);
  const [accessPerms, setAccessPerms] = useState<string[]>([]);
  const [accessSaving, setAccessSaving] = useState(false);

  // Website visitor analytics (first-party, from /api/track).
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    fetch('/api/track')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setWebStats(d); })
      .catch(() => {});
  }, [profile]);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      router.push('/admin-login');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    // Load each collection independently: if one read is denied (e.g. a new
    // collection without a matching Firestore rule) it must not blank the rest.
    const safe = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);
    Promise.all([
      safe(getAllUsers()),
      safe(getAllProperties()),
      safe(getAnalytics()),
      safe(getDocs(query(collection(db, 'valuationRequests'), orderBy('createdAt', 'desc')))),
      safe(getDocs(query(collection(db, 'google_reviews'), orderBy('createdAt', 'desc')))),
      safe(getDocs(query(collection(db, 'tenantApplications'), orderBy('createdAt', 'desc')))),
      safe(getDocs(query(collection(db, 'serviceOrders'), orderBy('createdAt', 'desc')))),
      safe(getDocs(query(collection(db, 'maintenanceRequests'), orderBy('createdAt', 'desc')))),
      safe(getDocs(query(collection(db, 'rentReviews'), orderBy('createdAt', 'desc')))),
    ]).then(([u, p, a, valSnap, revSnap, appSnap, orderSnap, maintSnap, rrSnap]) => {
      if (u) setUsers(u);
      if (p) setProperties(p);
      if (a) setAnalytics(a);
      if (valSnap) setValuations(valSnap.docs.map(d => ({ id: d.id, ...d.data() } as Valuation)));
      if (revSnap) setReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as GoogleReview)));
      if (appSnap) setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() } as TenantApplication)));
      if (orderSnap) setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceOrder)));
      if (maintSnap) setMaintenance(maintSnap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceRequest)));
      if (rrSnap) setRentReviews(rrSnap.docs.map(d => ({ id: d.id, ...d.data() } as RentReview)));
      setLoading(false);
    });
  }, [profile]);

  // ── Review handlers ──────────────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    setReviewError('');
    setReviewSuccess('');
    if (!reviewForm.author_name.trim()) { setReviewError('Reviewer name is required.'); return; }
    if (!reviewForm.text.trim()) { setReviewError('Review text is required.'); return; }
    if (reviewForm.rating < 4) { setReviewError('Only 4★ and 5★ reviews can be added.'); return; }
    setReviewSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'google_reviews'), {
        ...reviewForm,
        createdAt: serverTimestamp(),
      });
      const newReview: GoogleReview = {
        id: docRef.id,
        ...reviewForm,
        createdAt: new Date(),
      };
      setReviews(prev => [newReview, ...prev]);
      setReviewForm(EMPTY_REVIEW);
      setReviewSuccess('Review added successfully!');
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch {
      setReviewError('Failed to save review. Please try again.');
    }
    setReviewSaving(false);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(db, 'google_reviews', id));
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // ── Staff access handlers ────────────────────────────────────────────────────
  const openAccess = (u: AppUser) => {
    setAccessUser(u);
    setAccessPerms(staffPermissions(u));
  };

  const toggleAccess = (id: string) =>
    setAccessPerms(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const saveAccess = async () => {
    if (!accessUser) return;
    setAccessSaving(true);
    try {
      await updateDoc(doc(db, 'users', accessUser.uid), { permissions: accessPerms });
      setUsers(prev => prev.map(u => u.uid === accessUser.uid ? { ...u, permissions: accessPerms } : u));
      setAccessUser(null);
    } catch (e) {
      console.error('saveAccess failed:', e);
      alert('Could not save access. Please try again.');
    }
    setAccessSaving(false);
  };

  // ── Property handlers ────────────────────────────────────────────────────────
  const handleDeleteUser = async (uid: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This removes their Firestore record.`)) return;
    await deleteUserRecord(uid);
    setUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Delete this property listing?')) return;
    await adminDeleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleProperty = async (prop: Property) => {
    const newStatus = prop.status === 'active' ? 'inactive' : 'active';
    await adminSetPropertyStatus(prop.id!, newStatus);
    setProperties(prev =>
      prev.map(p => p.id === prop.id ? { ...p, status: newStatus } : p)
    );
  };

  const handleSetAvailability = async (prop: Property, availability: 'available' | 'pending' | 'let-agreed') => {
    await adminSetPropertyAvailability(prop.id!, availability);
    setProperties(prev =>
      prev.map(p => p.id === prop.id ? { ...p, availability, letAgreed: availability === 'let-agreed' } : p)
    );
  };

  const handleEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setTab('edit');
  };

  const handlePostSuccess = () => {
    getAllProperties().then(p => setProperties(p));
    setTab('properties');
  };

  const handleEditSuccess = () => {
    getAllProperties().then(p => setProperties(p));
    setEditingProperty(null);
    setTab('properties');
  };

  const handleEditCancel = () => {
    setEditingProperty(null);
    setTab('properties');
  };

  const handleValuationStatus = async (id: string, status: Valuation['status']) => {
    await updateDoc(doc(db, 'valuationRequests', id), { status });
    setValuations(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const handleApplicationStatus = async (id: string, status: TenantApplication['status']) => {
    await updateDoc(doc(db, 'tenantApplications', id), { status, updatedAt: serverTimestamp() });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleOrderStatus = async (id: string, status: ServiceOrder['status']) => {
    await updateDoc(doc(db, 'serviceOrders', id), { status, updatedAt: serverTimestamp() });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleMaintenanceStatus = async (id: string, status: MaintenanceRequest['status']) => {
    await updateDoc(doc(db, 'maintenanceRequests', id), { status, updatedAt: serverTimestamp() });
    setMaintenance(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const handleRentReviewStatus = async (id: string, status: string) => {
    const prev = rentReviews;
    setRentReviews(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    try {
      await updateDoc(doc(db, 'rentReviews', id), { status, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('rent review status update failed:', e);
      setRentReviews(prev);
      alert('Could not update the status. Please try again.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredProps = properties.filter(p =>
    p.title.toLowerCase().includes(searchProp.toLowerCase()) ||
    p.location.toLowerCase().includes(searchProp.toLowerCase())
  );

  const filteredReviews = reviews.filter(r =>
    reviewFilter === 'all' ? true : r.location === reviewFilter
  );

  if (authLoading || loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
      <div className="spinner" />
    </div>
  );

  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: 'analytics',  icon: '📊', label: 'Analytics' },
    { id: 'users',      icon: '👥', label: `Users (${users.length})` },
    { id: 'properties', icon: '🏠', label: `Properties (${properties.length})` },
    { id: 'valuations', icon: '📋', label: `Valuations (${valuations.length})` },
    { id: 'reviews',    icon: '⭐', label: `Reviews (${reviews.length})` },
    { id: 'applications', icon: '📝', label: `Applications (${applications.length})` },
    { id: 'rent-reviews', icon: '🔁', label: `Rent Reviews (${rentReviews.length})` },
    { id: 'orders',     icon: '🛒', label: `Orders (${orders.length})` },
    { id: 'maintenance', icon: '🔧', label: `Maintenance (${maintenance.length})` },
    { id: 'post',       icon: '➕', label: 'Post Property' },
    ...(editingProperty ? [{ id: 'edit' as Tab, icon: '✏️', label: 'Edit Property' }] : []),
  ];

  const statusColor: Record<Valuation['status'], { bg: string; color: string }> = {
    pending:   { bg: '#fff8e1', color: '#f57f17' },
    confirmed: { bg: '#e3f2fd', color: '#1565c0' },
    completed: { bg: '#e8f5e9', color: '#2e7d32' },
    cancelled: { bg: '#fce4ec', color: '#c62828' },
  };

  return (
    <>
      <Navbar />
      <div className="dash-layout">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div style={{
            padding: '0 28px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 12,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)',
              color: '#ff9090', borderRadius: 4, padding: '4px 10px', fontSize: 11,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
            }}>
              🔒 Admin
            </div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{profile?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{profile?.email}</div>
          </div>

          {navItems.map(item => (
            <button
              key={item.id}
              className={`dash-nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="dash-content">

          {/* ── Analytics ── */}
          {tab === 'analytics' && analytics && (
            <div>
              <h1 className="dash-section-title">Platform Analytics</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                Overview of all platform activity.
              </p>

              {/* ── Website visitors (first-party analytics) ── */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Website Visitors</h2>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {webStats?.updatedAt ? `Updated ${new Date(webStats.updatedAt).toLocaleString('en-GB')}` : 'Live'}
                  </span>
                </div>

                {!webStats || webStats.totalViews === 0 ? (
                  <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 14, padding: 28 }}>
                    No visitor data yet. Page views, unique visitors and their countries appear here as people browse the live site.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 20, marginBottom: 22 }}>
                      {[
                        { label: 'Page Views', value: webStats.totalViews, icon: '👁️', color: '#2563eb' },
                        { label: 'Unique Visitors', value: webStats.uniqueVisitors, icon: '🧑', color: '#0369a1' },
                        { label: 'Countries', value: Object.keys(webStats.byCountry || {}).length, icon: '🌍', color: '#00695C' },
                        { label: 'Pages Visited', value: Object.keys(webStats.byPath || {}).length, icon: '📄', color: '#6A1B9A' },
                      ].map(s => (
                        <div key={s.label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 44, height: 44, background: `${s.color}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.value.toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 24, marginBottom: 22 }}>
                      {/* Top countries */}
                      <div className="dash-card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Visitors by Country</h3>
                        {topEntries(webStats.byCountry, 6).map(([code, count]) => {
                          const pct = Math.round((count / webStats.totalViews) * 100);
                          return (
                            <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--gray-100)' }}>
                              <span style={{ fontSize: 18, flexShrink: 0 }}>{countryFlag(code)}</span>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)', flex: '0 0 120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{countryName(code)}</span>
                              <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb' }} />
                              </div>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gray-600)', minWidth: 62, textAlign: 'right' }}>{count.toLocaleString()} · {pct}%</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Top pages */}
                      <div className="dash-card">
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Most Visited Pages</h3>
                        {topEntries(webStats.byPath, 6).map(([path, count]) => {
                          const pct = Math.round((count / webStats.totalViews) * 100);
                          return (
                            <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--gray-100)' }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--navy)', flex: '0 0 130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{path}</span>
                              <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#00695C' }} />
                              </div>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gray-600)', minWidth: 62, textAlign: 'right' }}>{count.toLocaleString()} · {pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 14-day trend */}
                    <div className="dash-card">
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Page Views · Last 14 Days</h3>
                      {(() => {
                        const days = lastDays(Date.now(), 14);
                        const vals = days.map(d => webStats.byDay?.[d] || 0);
                        const max = Math.max(1, ...vals);
                        return (
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120, marginTop: 14 }}>
                            {days.map((d, i) => (
                              <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: vals[i] ? 'var(--gray-600)' : 'transparent' }}>{vals[i]}</span>
                                <div title={`${d}: ${vals[i]} views`} style={{ width: '100%', height: `${Math.max(4, (vals[i] / max) * 82)}px`, background: vals[i] ? '#2563eb' : '#e8ebf0', borderRadius: '4px 4px 0 0', transition: 'height .2s' }} />
                                <span style={{ fontSize: 9, color: 'var(--gray-400)' }}>{d.slice(8)}/{d.slice(5, 7)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                gap: 20, marginBottom: 36,
              }}>
                {[
                  { label: 'Total Users',        value: analytics.totalUsers,       icon: '👥', color: '#1565C0' },
                  { label: 'Landlords',           value: analytics.landlords,        icon: '🏠', color: '#2E7D32' },
                  { label: 'Tenants',             value: analytics.tenants,          icon: '🔑', color: '#E65100' },
                  { label: 'Total Listings',      value: analytics.totalProperties,  icon: '📋', color: '#6A1B9A' },
                  { label: 'Active Listings',     value: analytics.activeProperties, icon: '✅', color: '#00695C' },
                  { label: 'Total Chats',         value: analytics.totalChats,       icon: '💬', color: '#AD1457' },
                  { label: 'Valuations',          value: valuations.length,          icon: '📅', color: '#1a3c5e' },
                  { label: 'Pending Valuations',  value: valuations.filter(v => v.status === 'pending').length, icon: '⏳', color: '#f57f17' },
                  { label: 'Google Reviews',      value: reviews.length,             icon: '⭐', color: '#F59E0B' },
                  { label: 'Applications',         value: applications.length,                                    icon: '📝', color: '#0369a1' },
                  { label: 'Pending Applications', value: applications.filter(a => a.status === 'pending').length, icon: '⏳', color: '#b45309' },
                ].map(s => (
                  <div key={s.label} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, background: `${s.color}15`, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: s.color }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="dash-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Users</h3>
                  {users.slice(0, 5).map(u => (
                    <div key={u.uid} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid var(--gray-100)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</div>
                      </div>
                      <span className={`status-badge ${u.role === 'landlord' ? 'active' : u.role === 'admin' ? 'pending' : 'inactive'}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="dash-card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Valuations</h3>
                  {valuations.slice(0, 5).map(v => (
                    <div key={v.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid var(--gray-100)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{v.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{v.address}</div>
                      </div>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        background: statusColor[v.status]?.bg,
                        color: statusColor[v.status]?.color,
                      }}>
                        {v.status}
                      </span>
                    </div>
                  ))}
                  {valuations.length === 0 && (
                    <p style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                      No valuations yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="dash-section-title">All Users</h1>
                <input
                  className="form-input"
                  style={{ width: 260 }}
                  placeholder="Search by name or email…"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                />
              </div>

              {/* Staff access editor, which dashboard sections this member sees */}
              {accessUser && (
                <div className="dash-card" style={{ marginBottom: 20, border: '1.5px solid #2563eb' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    🔑 Dashboard access for {accessUser.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
                    Tick the sections {accessUser.name} can see and use in the staff dashboard. Changes apply the next time they load the dashboard.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                    {STAFF_FEATURES.map(f => {
                      const on = accessPerms.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                            border: `1.5px solid ${on ? '#2563eb' : '#e5e7eb'}`,
                            background: on ? '#eff5ff' : '#fff',
                            fontSize: 13.5, fontWeight: 600, color: on ? '#1d4ed8' : '#374151',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleAccess(f.id)}
                            style={{ accentColor: '#2563eb', width: 15, height: 15 }}
                          />
                          {f.icon} {f.label}
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={saveAccess}
                      disabled={accessSaving}
                      style={{ padding: '10px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: accessSaving ? 'not-allowed' : 'pointer', opacity: accessSaving ? 0.7 : 1 }}
                    >
                      {accessSaving ? 'Saving…' : '✓ Save access'}
                    </button>
                    <button
                      onClick={() => setAccessUser(null)}
                      style={{ padding: '10px 18px', background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th>
                      <th>Phone</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.uid}>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</td>
                        <td style={{ color: 'var(--gray-600)', fontSize: 13 }}>{u.email}</td>
                        <td>
                          <span className={`status-badge ${u.role === 'landlord' ? 'active' : u.role === 'admin' ? 'pending' : 'inactive'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{u.phone || '-'}</td>
                        <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                          {u.createdAt instanceof Date ? format(u.createdAt, 'd MMM yyyy') : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {u.role === 'staff' && (
                              <button
                                onClick={() => openAccess(u)}
                                style={{
                                  padding: '5px 10px', background: 'transparent',
                                  border: '1px solid #2563eb', color: '#2563eb',
                                  borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                                }}
                              >
                                🔑 Access
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <button className="btn-danger" onClick={() => handleDeleteUser(u.uid, u.name)}>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>No users found.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Properties ── */}
          {tab === 'properties' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="dash-section-title">All Properties</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    className="form-input"
                    style={{ width: 240 }}
                    placeholder="Search by title or location…"
                    value={searchProp}
                    onChange={e => setSearchProp(e.target.value)}
                  />
                  <button
                    onClick={() => setTab('post')}
                    style={{
                      padding: '10px 18px', background: 'var(--red)', color: '#fff',
                      border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    ➕ Post Property
                  </button>
                </div>
              </div>
              <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Property</th><th>Location</th><th>Rent</th>
                      <th>Status</th><th>Beds</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProps.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt=""
                                style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>
                                {p.title}
                                {p.featured && (
                                  <span style={{
                                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                                    background: 'rgba(192,57,43,0.1)', color: 'var(--red)',
                                    border: '1px solid rgba(192,57,43,0.3)',
                                    borderRadius: 3, padding: '1px 6px',
                                    textTransform: 'uppercase' as const,
                                  }}>
                                    Featured
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                                {p.id?.slice(0, 8).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{p.location}</td>
                        <td style={{ fontWeight: 700, color: 'var(--red)' }}>£{p.price.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${p.status}`}>{p.status}</span>
                          {(() => {
                            const av = propertyAvailability(p);
                            const meta = AVAILABILITY_META[av];
                            return (
                              <span style={{
                                display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700,
                                background: meta.bg, color: meta.color, borderRadius: 3,
                                padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 0.5,
                              }}>
                                {meta.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ fontSize: 13 }}>{p.bedrooms === 0 ? 'Studio' : `${p.bedrooms}`}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleEditProperty(p)}
                              style={{
                                padding: '5px 10px', background: 'transparent',
                                border: '1px solid #1565c0', color: '#1565c0',
                                borderRadius: 4, fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleToggleProperty(p)}
                              style={{
                                padding: '5px 10px', background: 'transparent',
                                border: `1px solid ${p.status === 'active' ? '#f57f17' : '#2e7d32'}`,
                                color: p.status === 'active' ? '#f57f17' : '#2e7d32',
                                borderRadius: 4, fontSize: 11, cursor: 'pointer',
                              }}
                            >
                              {p.status === 'active' ? 'Deactivate' : 'Approve'}
                            </button>
                            <select
                              value={propertyAvailability(p)}
                              onChange={e => handleSetAvailability(p, e.target.value as 'available' | 'pending' | 'let-agreed')}
                              title="Set listing availability"
                              style={{
                                padding: '5px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                                border: `1px solid ${AVAILABILITY_META[propertyAvailability(p)].color}`,
                                color: AVAILABILITY_META[propertyAvailability(p)].color,
                                background: AVAILABILITY_META[propertyAvailability(p)].bg,
                                fontWeight: 700,
                              }}
                            >
                              <option value="available">Available</option>
                              <option value="pending">Pending</option>
                              <option value="let-agreed">Let Agreed</option>
                            </select>
                            <button className="btn-danger" onClick={() => handleDeleteProperty(p.id!)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProps.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    No properties found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Valuations ── */}
          {tab === 'valuations' && (
            <div>
              <h1 className="dash-section-title">Valuation Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                All property valuation bookings from the website.
              </p>
              {valuations.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No valuations yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>
                    Valuation requests will appear here when customers book through the website.
                  </p>
                </div>
              ) : (
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th><th>Property</th><th>Type / Beds</th>
                        <th>Preferred Date</th><th>Status</th><th>Actions</th>
                      </tr>
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
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '4px 10px', borderRadius: 20,
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                              background: statusColor[v.status]?.bg,
                              color: statusColor[v.status]?.color,
                            }}>
                              {v.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={v.status}
                              onChange={e => handleValuationStatus(v.id, e.target.value as Valuation['status'])}
                              style={{
                                padding: '5px 8px', border: '1px solid var(--gray-200)',
                                borderRadius: 4, fontSize: 12, cursor: 'pointer', outline: 'none',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && (
            <div>
              <h1 className="dash-section-title">Google Reviews</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 15 }}>
                Add and manage reviews shown on the website. Only 4★ and 5★ reviews are displayed publicly.
              </p>

              {/* Add Review Form */}
              <div className="dash-card" style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--gray-800)' }}>
                  ➕ Add New Review
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Reviewer Name *
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. James Thornton"
                      value={reviewForm.author_name}
                      onChange={e => setReviewForm(f => ({ ...f, author_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Location *
                    </label>
                    <select
                      className="form-input"
                      value={reviewForm.location}
                      onChange={e => setReviewForm(f => ({ ...f, location: e.target.value as 'leeds' | 'manchester' }))}
                    >
                      <option value="leeds">📍 Leeds</option>
                      <option value="manchester">📍 Manchester</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Star Rating *
                    </label>
                    <select
                      className="form-input"
                      value={reviewForm.rating}
                      onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Time Label
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. 2 weeks ago"
                      value={reviewForm.relative_time_description}
                      onChange={e => setReviewForm(f => ({ ...f, relative_time_description: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Review Text *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Paste the review text from Google…"
                    value={reviewForm.text}
                    onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Profile Photo URL <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, falls back to initials)</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="https://…"
                    value={reviewForm.profile_photo_url}
                    onChange={e => setReviewForm(f => ({ ...f, profile_photo_url: e.target.value }))}
                  />
                </div>

                {reviewError && (
                  <div style={{ background: '#fce4ec', color: '#c62828', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14 }}>
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14 }}>
                    {reviewSuccess}
                  </div>
                )}

                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewSaving}
                  style={{
                    padding: '12px 28px', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
                    cursor: reviewSaving ? 'not-allowed' : 'pointer',
                    opacity: reviewSaving ? 0.7 : 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {reviewSaving ? 'Saving…' : '✓ Add Review'}
                </button>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {(['all', 'leeds', 'manchester'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    style={{
                      padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', border: '1px solid',
                      background: reviewFilter === f ? '#2563eb' : '#fff',
                      color: reviewFilter === f ? '#fff' : '#374151',
                      borderColor: reviewFilter === f ? '#2563eb' : '#e5e7eb',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f === 'all' ? `All (${reviews.length})` : f === 'leeds' ? `📍 Leeds (${reviews.filter(r => r.location === 'leeds').length})` : `📍 Manchester (${reviews.filter(r => r.location === 'manchester').length})`}
                  </button>
                ))}
              </div>

              {/* Reviews list */}
              {filteredReviews.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>No reviews yet. Add one above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredReviews.map(r => (
                    <div key={r.id} className="dash-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: r.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #2563eb, #4a90d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden',
                      }}>
                        {r.profile_photo_url
                          ? <img src={r.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : r.author_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        }
                      </div>

                      {/* Content */}
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
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map(i => (
                              <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= r.rating ? '#F59E0B' : '#e5e7eb'}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                          {r.relative_time_description && (
                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{r.relative_time_description}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                      </div>

                      {/* Delete */}
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteReview(r.id)}
                        style={{ flexShrink: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Applications ── */}
          {tab === 'applications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h1 className="dash-section-title">Tenancy Applications</h1>
              </div>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                All tenancy applications submitted via the website.
              </p>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {(['all', 'pending', 'reviewing', 'approved', 'rejected'] as const).map(f => {
                  const count = f === 'all' ? applications.length : applications.filter(a => a.status === f).length;
                  const colors: Record<string, { bg: string; color: string }> = {
                    all:       { bg: '#f1f5f9', color: '#374151' },
                    pending:   { bg: '#fff8e1', color: '#f57f17' },
                    reviewing: { bg: '#e3f2fd', color: '#1565c0' },
                    approved:  { bg: '#e8f5e9', color: '#2e7d32' },
                    rejected:  { bg: '#fce4ec', color: '#c62828' },
                  };
                  const isActive = appFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setAppFilter(f)}
                      style={{
                        padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', border: '1px solid',
                        background: isActive ? colors[f].color : '#fff',
                        color: isActive ? '#fff' : colors[f].color,
                        borderColor: colors[f].color,
                        textTransform: 'capitalize',
                      }}
                    >
                      {f} ({count})
                    </button>
                  );
                })}
              </div>

              {applications.filter(a => appFilter === 'all' || a.status === appFilter).length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📝</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No applications yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>
                    Tenancy applications will appear here when submitted via the website.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {applications
                    .filter(a => appFilter === 'all' || a.status === appFilter)
                    .map(a => {
                      const isExpanded = expandedApp === a.id;
                      const statusColors: Record<string, { bg: string; color: string }> = {
                        pending:   { bg: '#fff8e1', color: '#f57f17' },
                        reviewing: { bg: '#e3f2fd', color: '#1565c0' },
                        approved:  { bg: '#e8f5e9', color: '#2e7d32' },
                        rejected:  { bg: '#fce4ec', color: '#c62828' },
                      };
                      const sc = statusColors[a.status] || statusColors.pending;

                      return (
                        <div key={a.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                          {/* Header row */}
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', cursor: 'pointer' }}
                            onClick={() => setExpandedApp(isExpanded ? null : a.id)}
                          >
                            {/* Avatar */}
                            <div style={{
                              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #0a1628, #2563eb)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 14, fontWeight: 700,
                            }}>
                              {a.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: 15 }}>{a.fullName}</span>
                                <span style={{
                                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  textTransform: 'uppercase', background: sc.bg, color: sc.color,
                                }}>
                                  {a.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                                {a.email} · {a.phone} · Move-in: {a.moveInDate ? new Date(a.moveInDate).toLocaleDateString('en-GB') : '-'}
                              </div>
                            </div>

                            {/* Status selector */}
                            <select
                              value={a.status}
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleApplicationStatus(a.id, e.target.value as TenantApplication['status'])}
                              style={{
                                padding: '7px 10px', border: '1px solid var(--gray-200)',
                                borderRadius: 6, fontSize: 12, cursor: 'pointer', outline: 'none',
                                background: '#fff', flexShrink: 0,
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            <span style={{ fontSize: 18, color: 'var(--gray-400)', flexShrink: 0 }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--gray-100)', padding: '24px', background: '#fafafa' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>

                                {/* Personal */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Personal Details</h4>
                                  {[
                                    ['Full Name', a.fullName],
                                    ['Date of Birth', a.dob],
                                    ['Nationality', a.nationality],
                                    ['NI Number', a.niNumber],
                                    ['Email', a.email],
                                    ['Phone', a.phone],
                                    ['Right to Rent', a.rightToRent],
                                    ['Share Code', a.shareCode || '-'],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                                    </div>
                                  ))}
                                  <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Billing Address</p>
                                    <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{a.billingAddress}</p>
                                  </div>
                                </div>

                                {/* Employment */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Employment & Finance</h4>
                                  {[
                                    ['Employment Status', a.employmentStatus],
                                    ['Employer Phone', a.employerPhone],
                                    ['Employer Email', a.employerEmail],
                                    ['Annual Income', a.annualIncome],
                                    ['Additional Income', a.additionalIncome],
                                    ['CCJs', a.hasCCJ],
                                    ['Bankruptcy', a.wasBankrupt],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Landlord */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Landlord & Tenancy</h4>
                                  {[
                                    ["Landlord's Name", a.landlordName],
                                    ["Landlord's Email", a.landlordEmail],
                                    ["Landlord's Phone", a.landlordPhone],
                                    ['Current Address', a.currentAddress],
                                    ['Tenancy Start', a.tenancyStart],
                                    ['Tenancy End', a.tenancyEnd],
                                    ['Lease Term', a.leaseTerm],
                                    ['Move-In Date', a.moveInDate ? new Date(a.moveInDate).toLocaleDateString('en-GB') : '-'],
                                    ['Pets', a.pets],
                                    ['Guarantor', a.guarantor],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
                                      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                                    </div>
                                  ))}
                                  <div style={{ marginTop: 10 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Reason for Leaving</p>
                                    <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{a.reasonLeaving}</p>
                                  </div>
                                </div>

                                {/* Documents */}
                                <div>
                                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Uploaded Documents</h4>
                                  {[
                                    { label: 'Government ID / Passport', urls: a.govIdUrls },
                                    { label: 'Proof of Address', urls: a.proofOfAddressUrls },
                                    { label: 'Right to Rent Doc', urls: a.rightToRentDocUrls },
                                    { label: 'Payslips', urls: a.payslipUrls },
                                    { label: 'Bank Statements', urls: a.bankStatementUrls },
                                  ].map(({ label, urls }) => (
                                    <div key={label} style={{ marginBottom: 12 }}>
                                      <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{label}</p>
                                      {urls && urls.length > 0 ? (
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                          {urls.map((url: string, i: number) => (
                                            <a
                                              key={i}
                                              href={safeLinkHref(url)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                padding: '4px 10px', background: '#eff6ff',
                                                color: '#2563eb', borderRadius: 4, fontSize: 12,
                                                fontWeight: 600, textDecoration: 'none',
                                                border: '1px solid #bfdbfe',
                                              }}
                                            >
                                              📄 File {i + 1}
                                            </a>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>No files</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Submission date */}
                              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                                <span>Submitted: {a.submissionDate ? new Date(a.submissionDate).toLocaleDateString('en-GB') : '-'}</span>
                                <span>Application ID: {a.id.slice(0, 8).toUpperCase()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ── Rent Reviews ── */}
          {tab === 'rent-reviews' && (
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
              <p style={{ color: 'var(--gray-600)', marginBottom: 20, fontSize: 15 }}>
                Annual rent reviews submitted by existing tenants. Click a row to see the full submission and documents; use the status dropdown to keep the team on track.
              </p>
              {showRRCalc && (
                <div className="dash-card" style={{ padding: 24, marginBottom: 20 }}>
                  <RentReviewPanel properties={properties} />
                </div>
              )}
              {showRRProps && <RentReviewPropertyManager authedFetch={authedFetch} portfolio={properties} />}
              {rentReviews.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🔁</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No rent reviews yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>Rent reviews will appear here when tenants submit them through the website.</p>
                </div>
              ) : (
                <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Tenant</th><th>Property</th><th>Rent</th><th>Decision</th><th>Status</th></tr>
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
                                <select value={r.status} onChange={e => handleRentReviewStatus(r.id, e.target.value)} className="form-select" style={{ width: 150 }}>
                                  {RENT_REVIEW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                            </tr>
                            {open && (
                              <tr>
                                <td colSpan={5} style={{ background: '#f8fafc', padding: 20 }}>
                                  <RentReviewDetail r={r} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Service Orders ── */}
          {tab === 'orders' && (
            <div>
              <h1 className="dash-section-title">Service Orders</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                Orders placed through Additional Services and the pricing packages.
              </p>
              {orders.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 15, padding: '56px 24px' }}>
                  No orders yet. They&rsquo;ll appear here as customers check out.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {orders.map(o => {
                    const isOpen = expandedOrder === o.id;
                    const when = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString('en-GB') : '';
                    const badge = ORDER_STATUS_COLOR[o.status] || ORDER_STATUS_COLOR.pending;
                    return (
                      <div key={o.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 15, color: 'var(--navy)' }}>{o.customer?.fullName || ','}</strong>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-400)' }}>{o.ref}</span>
                              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: badge.bg, color: badge.color }}>{o.status}</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 3 }}>
                              {o.customer?.email} · {o.customer?.phone} · {o.lines?.length || 0} item{(o.lines?.length || 0) !== 1 ? 's' : ''} · {when}
                            </div>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>{o.hasFrom ? <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 700 }}>from </span> : null}£{o.total}</div>
                          <select value={o.status} onChange={e => handleOrderStatus(o.id, e.target.value as ServiceOrder['status'])} className="form-select" style={{ width: 140 }}
                            onClick={e => e.stopPropagation()}>
                            {(['pending', 'contacted', 'paid', 'completed', 'cancelled'] as const).map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                          </select>
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
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Proof of payment (verify before starting work)</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {o.proofOfPaymentUrls!.map((url, i) => (
                                    <a key={i} href={safeLinkHref(url)} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: '#f0fdf4', color: '#15803d', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #bbf7d0' }}>📄 Proof {i + 1}</a>
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

          {/* ── Maintenance ── */}
          {tab === 'maintenance' && (
            <div>
              <h1 className="dash-section-title">Maintenance Requests</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
                Repair and maintenance issues reported through the website form.
              </p>
              {maintenance.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🔧</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 12 }}>No maintenance requests yet</h3>
                  <p style={{ color: 'var(--gray-400)', fontSize: 15 }}>Reports will appear here when tenants submit the maintenance form.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {maintenance.map(m => {
                    const isOpen = expandedMaint === m.id;
                    const when = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString('en-GB') : '';
                    const mColors: Record<string, { bg: string; color: string }> = {
                      'open':        { bg: '#fff8e1', color: '#f57f17' },
                      'in-progress': { bg: '#e3f2fd', color: '#1565c0' },
                      'resolved':    { bg: '#e8f5e9', color: '#2e7d32' },
                      'cancelled':   { bg: '#fce4ec', color: '#c62828' },
                    };
                    const mc = mColors[m.status] || mColors.open;
                    return (
                      <div key={m.id} className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 15, color: 'var(--navy)' }}>{m.fullName}</strong>
                              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: mc.bg, color: mc.color }}>{m.status}</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 3 }}>
                              {m.propertyAddress} · {m.email} · {m.contactNumber}{when ? ` · ${when}` : ''}
                            </div>
                          </div>
                          <select value={m.status} onChange={e => handleMaintenanceStatus(m.id, e.target.value as MaintenanceRequest['status'])} className="form-select" style={{ width: 150 }} onClick={e => e.stopPropagation()}>
                            {(['open', 'in-progress', 'resolved', 'cancelled'] as const).map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                          </select>
                          <button onClick={() => setExpandedMaint(isOpen ? null : m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', fontSize: 13, fontWeight: 600 }}>
                            {isOpen ? 'Hide ▲' : 'Details ▼'}
                          </button>
                        </div>
                        {isOpen && (
                          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '16px 20px', background: '#fafbfc' }}>
                            {[
                              ['Issue', m.issueDescription],
                              ['When it happened', m.whenHappened],
                              ['Access / availability', m.availability],
                              ['Happened before', m.experiencedBefore],
                              ['Likely cause', m.cause],
                            ].map(([label, value]) => (
                              <div key={label as string} style={{ padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)' }}>{label}</div>
                                <div style={{ fontSize: 13.5, color: 'var(--navy)', marginTop: 2 }}>{value || '-'}</div>
                              </div>
                            ))}
                            {(m.photoUrls?.length || m.videoUrls?.length) ? (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>Evidence</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {(m.photoUrls || []).map((url, i) => (
                                    <a key={`p${i}`} href={safeLinkHref(url)} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe' }}>📷 Photo {i + 1}</a>
                                  ))}
                                  {(m.videoUrls || []).map((url, i) => (
                                    <a key={`v${i}`} href={safeLinkHref(url)} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: '#f0fdf4', color: '#15803d', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #bbf7d0' }}>🎬 Video {i + 1}</a>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Post Property ── */}
          {tab === 'post' && profile && (
            <div>
              <h1 className="dash-section-title">Post a Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 8, fontSize: 15 }}>
                Post a listing as admin. It will appear publicly and automatically marked as{' '}
                <strong style={{ color: 'var(--red)' }}>Featured</strong>.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(192,57,43,0.08)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 28,
              }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
                  This listing will be saved under your admin account and pinned as{' '}
                  <strong>Featured</strong> at the top of search results.
                </p>
              </div>
              <div className="dash-card">
                <PropertyForm
                  landlordId={profile.uid}
                  landlordName={profile.name}
                  adminOverride={{ featured: true }}
                  onSuccess={handlePostSuccess}
                  onCancel={() => setTab('properties')}
                />
              </div>
            </div>
          )}

          {/* ── Edit Property ── */}
          {tab === 'edit' && profile && editingProperty && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <button
                  onClick={handleEditCancel}
                  style={{
                    padding: '6px 12px', background: 'transparent',
                    border: '1px solid var(--gray-200)', borderRadius: 4,
                    fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)',
                  }}
                >
                  ← Back to Properties
                </button>
              </div>
              <h1 className="dash-section-title">Edit Property</h1>
              <p style={{ color: 'var(--gray-600)', marginBottom: 8, fontSize: 15 }}>
                Editing: <strong>{editingProperty.title}</strong>
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(21,101,192,0.08)',
                border: '1px solid rgba(21,101,192,0.2)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 28,
              }}>
                <span style={{ fontSize: 18 }}>✏️</span>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
                  Changes will update the live listing immediately after saving.
                </p>
              </div>
              <div className="dash-card">
                <PropertyForm
                  landlordId={editingProperty.landlordId || profile.uid}
                  landlordName={editingProperty.landlordName || profile.name}
                  existing={editingProperty}
                  adminOverride={{ featured: editingProperty.featured }}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
