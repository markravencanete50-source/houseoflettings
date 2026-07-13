// app/api/staff/properties/route.ts
// Fetch all properties (staff view). Requires staff role.

import { NextRequest, NextResponse } from 'next/server';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
    const snapshot = await db.collection('properties')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const properties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return NextResponse.json({ properties }, { status: 200 });
  } catch (e) {
    console.error('staff/properties error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
