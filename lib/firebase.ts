// lib/firebase.ts
// ============================================================
// HOW TO SET UP FIREBASE:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project called "houseoflettings-rent"
// 3. Enable Authentication (Email/Password provider)
// 4. Create a Firestore Database (start in production mode)
// 5. Enable Firebase Storage
// 6. Go to Project Settings → General → Your Apps → Web App
// 7. Copy your firebaseConfig values into .env.local:
//
//    NEXT_PUBLIC_FIREBASE_API_KEY=...
//    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
//    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
//    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
//    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
//    NEXT_PUBLIC_FIREBASE_APP_ID=...
//
// 8. In Firestore, go to Rules and paste:
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /users/{userId} {
//          allow read: if request.auth != null;
//          allow write: if request.auth.uid == userId;
//        }
//        match /properties/{propertyId} {
//          allow read: if true;
//          allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'landlord';
//          allow update, delete: if request.auth != null && resource.data.landlordId == request.auth.uid;
//        }
//        match /chats/{chatId} {
//          allow read, write: if request.auth != null && (
//            resource == null ||
//            request.auth.uid == resource.data.landlordId ||
//            request.auth.uid == resource.data.tenantId
//          );
//          match /messages/{messageId} {
//            allow read, write: if request.auth != null;
//          }
//        }
//        match /admin/{document=**} {
//          allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
//        }
//      }
//    }
//
// 9. In Storage Rules:
//    rules_version = '2';
//    service firebase.storage {
//      match /b/{bucket}/o {
//        match /properties/{allPaths=**} {
//          allow read: if true;
//          allow write: if request.auth != null;
//        }
//      }
//    }
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
