#!/usr/bin/env node
// scripts/migrate-cloudinary-folders.js
//
// ONE-TIME migration. Relocates the files that were historically misfiled into
// houseoflettings/properties into their correct per-form Cloudinary folders:
//
//   tenantApplications documents → houseoflettings/tenant-applications
//   serviceOrders      documents → houseoflettings/service-orders
//   landlordRegistrations property photos & floor plans (from landlord-docs)
//                              → houseoflettings/landlord-properties
//
// Why Firestore-driven: inside houseoflettings/properties these files sit next
// to genuine property photos with indistinguishable random IDs. The ONLY thing
// that knows a given asset is a tenant document (not a listing photo) is the
// Firestore record that references its URL. So we walk those two collections,
// follow each stored URL, and move exactly those assets — property photos are
// never touched because the `properties` collection is never read here.
//
// Renaming a Cloudinary asset changes its delivery URL, so after each move we
// also rewrite the URL on the Firestore document, keeping the admin dashboard
// "View file" links and stored records working.
//
// SAFE BY DEFAULT:
//   • Dry-run unless you pass --apply. Dry-run prints the full plan and changes
//     nothing.
//   • Only ever moves assets whose public_id currently starts with
//     houseoflettings/properties/ . Anything already in the right folder, on
//     Firebase Storage, or elsewhere is skipped — so re-running is harmless.
//   • Per-file error isolation: one bad asset is logged and the run continues.
//
// Requires admin credentials (Cloudinary secret + Firebase Admin). Pull them
// into .env.local first, e.g.  `vercel env pull .env.local`, then:
//
//   node scripts/migrate-cloudinary-folders.js            # dry run (default)
//   node scripts/migrate-cloudinary-folders.js --apply    # perform the moves
//
const fs = require('fs');
const path = require('path');

// ── minimal .env.local loader (no dotenv dependency) ─────────
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    // strip a single pair of surrounding quotes (vercel env pull quotes values)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const admin = require('firebase-admin');
const { v2: cloudinary } = require('cloudinary');

const APPLY = process.argv.includes('--apply');

// Collections to fix. Each entry moves assets from `sourceFolder` into
// `targetFolder`, but ONLY the ones referenced by the listed fields — so files
// that share the source folder (e.g. genuine property photos, or a landlord's
// ID documents) are never touched.
//
//   urlFields        — flat array/string fields on the document
//   nestedArrayField + nestedUrlFields — fields inside each element of an array
//                      (landlord registrations store one photo set per property)
//
// Field names mirror what the /api routes store.
const TARGETS = [
  {
    collection: 'tenantApplications',
    sourceFolder: 'houseoflettings/properties',
    targetFolder: 'houseoflettings/tenant-applications',
    urlFields: ['govIdUrls', 'proofOfAddressUrls', 'rightToRentDocUrls', 'payslipUrls', 'bankStatementUrls'],
  },
  {
    collection: 'serviceOrders',
    sourceFolder: 'houseoflettings/properties',
    targetFolder: 'houseoflettings/service-orders',
    urlFields: ['proofOfPaymentUrls'],
  },
  {
    // Property photos & floor plans submitted with a landlord registration were
    // filed in landlord-docs next to the landlord's ID/ownership documents.
    // Move only the property photos out into their own library; the sensitive
    // documents stay put.
    collection: 'landlordRegistrations',
    sourceFolder: 'houseoflettings/landlord-docs',
    targetFolder: 'houseoflettings/landlord-properties',
    nestedArrayField: 'properties',
    nestedUrlFields: ['photoUrls', 'floorPlanUrls'],
  },
];

function requireEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env var(s): ${missing.join(', ')}`);
    console.error('Populate .env.local (e.g. `vercel env pull .env.local`) and retry.');
    process.exit(1);
  }
}

// Parse a Cloudinary delivery URL into { resourceType, publicId }.
// Returns null for anything that isn't a res.cloudinary.com asset.
function parseCloudinary(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.hostname !== 'res.cloudinary.com') return null;

  const parts = u.pathname.split('/').filter(Boolean); // [cloud, rtype, dtype, ...rest]
  if (parts.length < 4) return null;

  const resourceType = parts[1];        // image | raw | video
  let rest = parts.slice(3);            // after delivery type
  const vIdx = rest.findIndex((p) => /^v\d+$/.test(p));
  const afterVersion = vIdx >= 0 ? rest.slice(vIdx + 1) : rest;

  let publicPath = afterVersion.join('/');
  if (!publicPath) return null;

  // Image/video public_ids exclude the format extension; raw keeps it.
  if (resourceType === 'raw') {
    return { resourceType, publicId: publicPath };
  }
  const slash = publicPath.lastIndexOf('/');
  const dot = publicPath.lastIndexOf('.');
  const publicId = dot > slash ? publicPath.slice(0, dot) : publicPath;
  return { resourceType, publicId };
}

// Move one asset if it's in the source folder. Returns the NEW url (moved or
// already-moved), or null when nothing to do / not ours. Idempotent.
async function moveOne(url, sourceFolder, targetFolder, stats) {
  const sourcePrefix = sourceFolder + '/';
  const parsed = parseCloudinary(url);
  if (!parsed) { stats.skippedForeign++; return null; }        // Firebase Storage / other host
  if (!parsed.publicId.startsWith(sourcePrefix)) { stats.skippedAlready++; return null; }

  const newPublicId = targetFolder + '/' + parsed.publicId.slice(sourcePrefix.length);
  const rt = parsed.resourceType;

  if (!APPLY) {
    console.log(`   would move [${rt}] ${parsed.publicId}\n              → ${newPublicId}`);
    stats.planned++;
    return null;
  }

  try {
    const res = await cloudinary.uploader.rename(parsed.publicId, newPublicId, { resource_type: rt, overwrite: false });
    stats.moved++;
    console.log(`   moved [${rt}] ${parsed.publicId} → ${newPublicId}`);
    return res.secure_url;
  } catch (err) {
    // If a prior partial run already moved the asset, the source is gone but the
    // target exists — recover the new URL and still fix the Firestore reference.
    const notFound = err && (err.http_code === 404 || /not found/i.test(err.message || ''));
    if (notFound) {
      try {
        const existing = await cloudinary.api.resource(newPublicId, { resource_type: rt });
        stats.recovered++;
        console.log(`   already moved [${rt}] ${newPublicId} (recovering url)`);
        return existing.secure_url;
      } catch { /* fall through to error */ }
    }
    stats.errors++;
    console.error(`   ERROR moving ${parsed.publicId}: ${err && err.message ? err.message : err}`);
    return null;
  }
}

// Rewrite a URL field (string or array) via a url→newUrl map. Returns the new
// value plus whether it changed.
function remapField(value, moves) {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((v) => {
      const nu = moves.get(v);
      if (nu) { changed = true; return nu; }
      return v;
    });
    return { value: next, changed };
  }
  if (typeof value === 'string' && moves.has(value)) {
    return { value: moves.get(value), changed: true };
  }
  return { value, changed: false };
}

async function run() {
  requireEnv(['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']);

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const db = admin.firestore();
  console.log(`\n${APPLY ? '⚙️  APPLYING' : '🔍 DRY RUN'} — Cloudinary folder migration`);
  console.log(APPLY ? '   (files will be moved and Firestore updated)\n' : '   (no changes will be made — pass --apply to perform them)\n');

  const stats = { planned: 0, moved: 0, recovered: 0, errors: 0, skippedAlready: 0, skippedForeign: 0, docsUpdated: 0 };

  for (const target of TARGETS) {
    const { collection, sourceFolder, targetFolder, urlFields = [], nestedArrayField, nestedUrlFields = [] } = target;
    const snap = await db.collection(collection).get();
    console.log(`── ${collection}: ${snap.size} document(s) → ${targetFolder}`);

    for (const doc of snap.docs) {
      const data = doc.data();
      const moves = new Map(); // oldUrl → newUrl (only successfully-moved assets)

      // Collect every candidate URL from both flat and nested fields, then move.
      const candidates = [];
      for (const field of urlFields) {
        const v = data[field];
        if (Array.isArray(v)) candidates.push(...v);
        else if (typeof v === 'string' && v) candidates.push(v);
      }
      if (nestedArrayField && Array.isArray(data[nestedArrayField])) {
        for (const item of data[nestedArrayField]) {
          for (const field of nestedUrlFields) {
            const v = item && item[field];
            if (Array.isArray(v)) candidates.push(...v);
            else if (typeof v === 'string' && v) candidates.push(v);
          }
        }
      }
      for (const url of candidates) {
        if (typeof url !== 'string' || moves.has(url)) continue;
        const newUrl = await moveOne(url, sourceFolder, targetFolder, stats);
        if (newUrl) moves.set(url, newUrl);
      }

      if (APPLY && moves.size) {
        const update = {};
        for (const field of urlFields) {
          if (!(field in data)) continue;
          const { value, changed } = remapField(data[field], moves);
          if (changed) update[field] = value;
        }
        if (nestedArrayField && Array.isArray(data[nestedArrayField])) {
          let nestedChanged = false;
          const nextArray = data[nestedArrayField].map((item) => {
            if (!item || typeof item !== 'object') return item;
            const nextItem = { ...item };
            for (const field of nestedUrlFields) {
              if (!(field in nextItem)) continue;
              const { value, changed } = remapField(nextItem[field], moves);
              if (changed) { nextItem[field] = value; nestedChanged = true; }
            }
            return nextItem;
          });
          if (nestedChanged) update[nestedArrayField] = nextArray;
        }
        if (Object.keys(update).length) {
          await doc.ref.update(update);
          stats.docsUpdated++;
          console.log(`   ✏️  updated ${collection}/${doc.id} (${Object.keys(update).join(', ')})`);
        }
      }
    }
  }

  console.log('\n📊 Summary');
  if (APPLY) {
    console.log(`   Assets moved:       ${stats.moved}`);
    console.log(`   Already-moved fixed:${stats.recovered}`);
    console.log(`   Firestore docs set: ${stats.docsUpdated}`);
    console.log(`   Errors:             ${stats.errors}`);
  } else {
    console.log(`   Assets that would move: ${stats.planned}`);
  }
  console.log(`   Skipped (already correct): ${stats.skippedAlready}`);
  console.log(`   Skipped (not Cloudinary):  ${stats.skippedForeign}`);
  if (!APPLY) console.log('\n   Re-run with --apply to perform these moves.');
  console.log('');

  process.exit(stats.errors ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
