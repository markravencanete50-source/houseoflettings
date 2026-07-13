// app/api/staff/maintenance/route.ts
// Fetch all maintenance requests (staff view). Requires staff/admin role.

import { NextRequest, NextResponse } from 'next/server';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { requireStaff, getAdminDb } from '@/lib/staffApiAuth';

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

async function getUserRole(uid: string): Promise<string | null> {
  try {
    const db = getDb();
    const doc = await db.collection('users').doc(uid).get();
    return doc.data()?.role || null;
  } catch (e) {
    console.error('Failed to fetch user role:', e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = getAuth();
    let uid: string;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const role = await getUserRole(uid);
    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const snapshot = await db.collection('maintenanceRequests')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Update a maintenance request's status (staff and admin). Body: { id, status }.
const MAINT_STATUSES = ['open', 'in-progress', 'resolved', 'cancelled'] as const;

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireStaff(request, 'maintenance');
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const id = (body.id || '').toString().trim();
    const status = (body.status || '').toString().trim();
    if (!id) return NextResponse.json({ message: 'Request id is required.' }, { status: 400 });
    if (!MAINT_STATUSES.includes(status as any)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    await getAdminDb().collection('maintenanceRequests').doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
      lastStatusBy: auth.uid,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('staff/maintenance PATCH error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
