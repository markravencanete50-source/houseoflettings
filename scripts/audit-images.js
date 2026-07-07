// scripts/audit-images.js
// Report-only audit: checks every image URL on every property in Firestore and
// lists the dead ones (deleted from Cloudinary/Storage but still referenced).
// Uses the public web SDK config from .env.local — no admin credentials needed
// (property reads are public). Does NOT modify any data.
//
//   node scripts/audit-images.js
//
const fs = require('fs');
const path = require('path');

// ── minimal .env.local loader (no dotenv dependency) ─────────
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

// HEAD first (cheap); some hosts reject HEAD, so retry with GET on 405/403.
// Returns { status, contentType } — a URL can be 200 yet not an image (e.g. a
// PDF/video uploaded among the photos), which breaks <img> in the browser.
async function checkUrl(url) {
  const attempt = async (method) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(url, { method, signal: ctrl.signal, redirect: 'follow' });
      return { status: res.status, contentType: (res.headers.get('content-type') || '').toLowerCase() };
    } catch {
      return { status: 0, contentType: '' }; // network error / timeout
    } finally {
      clearTimeout(t);
    }
  };
  let r = await attempt('HEAD');
  if (r.status === 405 || r.status === 403) r = await attempt('GET');
  return r;
}

async function main() {
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, 'properties'));
  const props = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`Checked collection "properties": ${props.length} documents\n`);

  const jobs = [];
  for (const p of props) {
    const images = Array.isArray(p.images) ? p.images : [];
    if (images.length === 0) {
      jobs.push(Promise.resolve({ p, results: [], noImages: true }));
      continue;
    }
    jobs.push(
      (async () => {
        const results = [];
        for (let i = 0; i < images.length; i++) {
          const { status, contentType } = await checkUrl(images[i]);
          const reachable = status >= 200 && status < 400;
          const isImage = contentType.startsWith('image/');
          results.push({
            index: i,
            url: images[i],
            status,
            contentType,
            ok: reachable && isImage,
            reason: !reachable ? `HTTP ${status || 'ERR'}` : !isImage ? `not an image (${contentType || 'unknown type'})` : '',
          });
        }
        return { p, results, noImages: false };
      })()
    );
  }

  // modest concurrency: run in batches of 5 properties
  const all = [];
  for (let i = 0; i < jobs.length; i += 5) {
    all.push(...(await Promise.all(jobs.slice(i, i + 5))));
    process.stdout.write(`  …${Math.min(i + 5, jobs.length)}/${jobs.length} properties checked\r`);
  }
  console.log('\n');

  let brokenTotal = 0;
  let okTotal = 0;
  const problems = [];

  for (const { p, results, noImages } of all) {
    if (noImages) {
      problems.push({ p, kind: 'no-images', broken: [] });
      continue;
    }
    const broken = results.filter((r) => !r.ok);
    okTotal += results.length - broken.length;
    brokenTotal += broken.length;
    if (broken.length > 0) problems.push({ p, kind: 'broken', broken });
  }

  console.log('════════════════════════════════════════════════════');
  console.log(`  Images OK:     ${okTotal}`);
  console.log(`  Images BROKEN: ${brokenTotal}`);
  console.log(`  Properties with issues: ${problems.length}`);
  console.log('════════════════════════════════════════════════════\n');

  for (const { p, kind, broken } of problems) {
    console.log(`▸ [${(p.status || '?').toUpperCase()}] ${p.title || '(untitled)'}  (id: ${p.id})`);
    console.log(`  location: ${p.location || '—'}`);
    if (kind === 'no-images') {
      console.log('  ⚠ has NO images at all');
    } else {
      for (const b of broken) {
        const isCover = b.index === 0 ? '  ← COVER PHOTO' : '';
        console.log(`  ✗ image[${b.index}] ${b.reason}${isCover}`);
        console.log(`    ${b.url}`);
      }
    }
    console.log('');
  }

  if (problems.length === 0) console.log('✓ No problems found — every image URL responds.\n');
  console.log('Fix: open Admin → Properties → Edit, remove the dead entries and re-upload.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Audit failed:', e.message || e);
  process.exit(1);
});
