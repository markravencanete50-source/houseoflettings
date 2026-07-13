# Staff Dashboard Setup

This document explains how to set up and manage the staff dashboard and user roles.

## Overview

The staff role provides access to:
- **Applications**: View all tenant applications
- **Properties**: View and manage all properties
- **Post Property**: Add new property listings

Staff members can only see these three sections and do not have access to admin features.

## Creating Staff Users

### Option 1: Using the CLI Script (Recommended)

```bash
# Set your Firebase credentials as environment variables
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-service-account-email"
export FIREBASE_PRIVATE_KEY="your-service-account-private-key"

# Run the script to create all 6 staff users
node scripts/create-staff-users.js
```

The script will:
1. Create Firebase Auth accounts for each staff member
2. Create Firestore profiles with the "staff" role
3. Generate temporary passwords
4. Display the results

Staff members will need to change their password on first login.

### Option 2: Manual Creation via Firebase Console

1. Go to Firebase Console → Authentication → Users
2. Click "Add user" for each staff member
3. Enter email and set a temporary password
4. In Firestore, create a document in `users/{uid}` with:
   ```json
   {
     "uid": "{uid}",
     "email": "{email}",
     "name": "{name}",
     "role": "staff",
     "createdAt": "2026-07-13T00:00:00.000Z"
   }
   ```

## Staff Members

The following staff members should be created with the role "staff":

- Adila (adila@houseoflettings.uk)
- Asal (asal@houseoflettings.uk)
- Sepher (sepher@houseoflettings.uk)
- Lilly (lilly@houseoflettings.uk)
- Emily (emily@houseoflettings.uk)
- Andrea (andrea@houseoflettings.uk)

## Access & Permissions

Staff users can access:

### Applications
- View all tenant applications
- See application status (pending, approved, rejected)
- Filter by property and date

### Properties
- View all property listings
- See property status (active, inactive, pending)
- Access basic property information

### Post Property
- Add new property listings to the platform
- Manage existing properties (limited features)

Staff users **cannot**:
- Delete properties
- Create tenant accounts directly
- Access admin dashboard
- Manage other staff accounts
- Modify system settings

## Firestore Security Rules

Staff members are restricted via Firestore security rules:

```
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

match /properties {
  allow read: if request.auth != null;
  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'landlord';
}

match /tenantApplications {
  allow read: if request.auth != null && (
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'staff' ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}
```

## Accessing the Staff Dashboard

1. Staff members log in at `/login` with their credentials
2. After successful login, they're redirected to `/dashboard/staff`
3. The dashboard shows:
   - Applications tab: List of all tenant applications
   - Properties tab: Grid view of all properties
   - Post Property tab: Form to add new properties (coming soon)

## Password Management

### First Login
- Staff members receive a temporary password
- On first login at `/login`, they should change their password
- Use Firebase Console or auth UI to change password

### Password Reset
1. Go to Firebase Console → Authentication → Users
2. Click on the user email
3. Click "Reset password"
4. Firebase will send a password reset email

## Monitoring Staff Access

To view staff activities:
1. Check Firestore for recent reads/writes
2. Monitor API logs for `/api/staff/*` endpoints
3. Review audit logs in Firebase Console

## Future Enhancements

Potential improvements to the staff dashboard:
- Search and filter applications
- Bulk property operations
- Export reports
- Audit logging
- Performance metrics
