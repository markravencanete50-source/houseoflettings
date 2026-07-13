#!/usr/bin/env node
// scripts/create-staff-users.js
// Usage: FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=... node scripts/create-staff-users.js

const admin = require('firebase-admin');

const staffUsers = [
  { email: 'adila@houseoflettings.uk', name: 'Adila' },
  { email: 'asal@houseoflettings.uk', name: 'Asal' },
  { email: 'sepher@houseoflettings.uk', name: 'Sepher' },
  { email: 'lilly@houseoflettings.uk', name: 'Lilly' },
  { email: 'emily@houseoflettings.uk', name: 'Emily' },
  { email: 'andrea@houseoflettings.uk', name: 'Andrea' },
];

async function createStaffUsers() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('Error: FIREBASE_PROJECT_ID env var required');
    process.exit(1);
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('Error: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars required');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const auth = admin.auth();
  const db = admin.firestore();

  console.log(`Creating ${staffUsers.length} staff users...\n`);

  let created = 0;
  let skipped = 0;

  for (const { email, name } of staffUsers) {
    try {
      // Check if user already exists
      try {
        await auth.getUserByEmail(email);
        console.log(`⏭️  Skipped ${email} (already exists)`);
        skipped++;
        continue;
      } catch (e) {
        // User doesn't exist, continue with creation
      }

      // Create auth user with temp password
      const tempPassword = Math.random().toString(36).slice(-12);
      const user = await auth.createUser({
        email,
        displayName: name,
        password: tempPassword,
      });

      // Create Firestore profile
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email,
        name,
        role: 'staff',
        createdAt: new Date(),
      });

      console.log(`✅ Created ${email} (UID: ${user.uid})`);
      console.log(`   Temporary password: ${tempPassword}`);
      console.log(`   User should change password on first login\n`);
      created++;
    } catch (error: any) {
      console.error(`❌ Failed to create ${email}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${created + skipped}/${staffUsers.length}`);

  if (created > 0) {
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Share temporary passwords securely with staff members`);
    console.log(`   2. They should visit /admin-login and change their password on first login`);
    console.log(`   3. They can then access /dashboard/staff`);
  }

  process.exit(created === staffUsers.length ? 0 : 1);
}

createStaffUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
