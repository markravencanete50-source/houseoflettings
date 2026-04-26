# House of Lettings — Full Stack Rental Platform

A fully functional UK property rental platform built with **Next.js 14** (App Router) + **Firebase**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firebase Firestore |
| Storage | Firebase Storage (property images) |
| Styling | CSS Variables (black/white/red theme) |
| Fonts | Cormorant Garamond + DM Sans |

---

## Features

### Authentication
- Email/password signup & login
- Role selection during signup: **landlord** or **tenant**
- Separate `/admin-login` route for admins
- Role-based redirect after login
- Session persistence (auto-login)
- Error messages for invalid credentials, duplicate email

### Property Listings
- Landlord can add, edit, deactivate, and delete listings
- Multiple image upload with drag-and-drop (Firebase Storage)
- Properties appear live instantly after publishing
- All required field validation

### Search & Filtering
- Real-time Firestore subscription with `onSnapshot`
- Filter by location (client-side), min/max price, bedrooms
- "No properties found" state with clear filters CTA

### Messaging
- Tenant messages landlord from property detail page
- Auto-creates chat if none exists
- Real-time messages with `onSnapshot`
- Landlord inbox + tenant inbox in their dashboards
- Timestamps, sender identity, last message preview

### Admin Panel (`/admin`)
- View all users with search
- View all properties with search
- Approve / deactivate listings
- Delete users or listings
- Analytics: total users, landlords, tenants, listings, chats

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `houseoflettings-rent`)
3. Enable **Authentication** → Email/Password provider
4. Create **Firestore Database** (start in Production mode)
5. Enable **Firebase Storage**
6. Go to **Project Settings → General → Your Apps → Add Web App**
7. Copy the config values

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Fill in your Firebase config values in .env.local
```

### 4. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /properties/{propertyId} {
      allow read: if true;
      allow create: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'landlord';
      allow update, delete: if request.auth != null &&
        resource.data.landlordId == request.auth.uid;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null && (
        resource == null ||
        request.auth.uid == resource.data.landlordId ||
        request.auth.uid == resource.data.tenantId
      );
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### 5. Set Firebase Storage Rules

In Firebase Console → Storage → Rules, paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /properties/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 6. Create your first Admin user

After creating a user via `/register`, manually update their Firestore document:

1. Go to Firestore → `users` collection
2. Find your user document
3. Change `role` field from `"landlord"` or `"tenant"` to `"admin"`
4. Now log in via `/admin-login`

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
houseoflettings/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout + AuthProvider
│   ├── globals.css                 # Global styles (CSS variables)
│   ├── login/page.tsx              # Login page
│   ├── register/page.tsx           # Register + role selection
│   ├── admin-login/page.tsx        # Admin-only login
│   ├── listings/
│   │   ├── page.tsx                # Browse listings with filters
│   │   └── [id]/page.tsx           # Property detail + contact
│   ├── dashboard/
│   │   ├── landlord/page.tsx       # Landlord dashboard
│   │   └── tenant/page.tsx         # Tenant dashboard
│   └── admin/page.tsx              # Admin panel
├── components/
│   ├── layout/
│   │   └── Navbar.tsx              # Dynamic nav (auth-aware)
│   ├── property/
│   │   ├── PropertyCard.tsx        # Listing card component
│   │   └── PropertyForm.tsx        # Add/edit property form + image upload
│   ├── chat/
│   │   └── ChatWindow.tsx          # Real-time chat UI
│   └── ui/
│       └── Toast.tsx               # Notification toasts
├── hooks/
│   └── useAuth.tsx                 # Global auth context + hook
├── services/
│   ├── auth.ts                     # Firebase Auth operations
│   ├── property.ts                 # Firestore property CRUD + Storage
│   ├── chat.ts                     # Firestore messaging
│   └── admin.ts                    # Admin operations + analytics
├── lib/
│   ├── firebase.ts                 # Firebase app initialization
│   └── types.ts                    # TypeScript interfaces
└── .env.example                    # Environment variable template
```

---

## User Flows

### Landlord
1. `/register` → select "Landlord" → redirects to `/dashboard/landlord`
2. Dashboard → "Add Property" tab → fill form, upload images → publish
3. Dashboard → "Inbox" tab → see & reply to tenant messages

### Tenant
1. `/register` → select "Tenant" → redirects to `/dashboard/tenant`
2. `/listings` → browse, filter → click property → view detail
3. Click "Message Landlord" → opens real-time chat in tenant dashboard

### Admin
1. Manually set `role: "admin"` in Firestore for your account
2. `/admin-login` → enter credentials → redirects to `/admin`
3. View analytics, manage users, approve/deactivate/delete listings
