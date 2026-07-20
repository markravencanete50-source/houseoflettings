// app/api/admin/staff-users/route.ts
// Create staff user accounts. Requires admin auth token.

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { rateLimit } from '@/lib/rateLimit';

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
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Admin-only route, but still bounded: account creation should never be
  // rapid-fire even with a valid admin token in hand.
  const limited = rateLimit(request, 'staff-users', 20, 10 * 60 * 1000);
  if (limited) return limited;
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
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || '').trim();
    const name = String(body.name || '').trim().slice(0, 200);

    if (!email || !name || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'A valid email and name are required' }, { status: 400 });
    }

    // Create Firebase Auth user. The placeholder password comes from the CSPRNG
    // — Math.random() is predictable and has no place in a credential. The user
    // signs in via a password reset, so nobody ever needs to know this value.
    const newUser = await auth.createUser({
      email,
      displayName: name,
      password: randomBytes(24).toString('base64url'),
    });

    // Create user profile in Firestore
    const db = getDb();
    await db.collection('users').doc(newUser.uid).set({
      uid: newUser.uid,
      email,
      name,
      role: 'staff',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: newUser.uid,
        email,
        name,
        role: 'staff',
      },
    }, { status: 201 });
  } catch (e: any) {
    console.error('staff-users error:', e);
    if (e.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
