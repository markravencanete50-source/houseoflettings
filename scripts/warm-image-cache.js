// scripts/warm-image-cache.js
// Pre-generates the Cloudinary derived variants the site actually serves
// (f_auto,q_auto + w_640 cards / w_1600 heroes) so first visitors never wait
// for on-the-fly derivation. Safe to re-run any time (e.g. after uploading new
// property photos) — already-derived variants are just CDN cache hits.
//
//   node scripts/warm-image-cache.js
//
const fs = require('fs');
const path = require('path');

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

const MARKER = '/image/upload/';
const WIDTHS = [640, 1600]; // must match lib/imageUrl.ts call sites

function optimized(url, width) {
  const idx = url.indexOf(MARKER);
  if (idx === -1 || /\/upload\/[^/]*(f_auto|q_auto|w_\d)/.test(url)) return null;
  return url.slice(0, idx + MARKER.length) + `f_auto,q_auto,w_${width},c_limit/` + url.slice(idx + MARKER.length);
}

async function warm(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
    // Drain the body so the CDN actually finishes serving/deriving it.
    await res.arrayBuffer();
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, 'properties'));
  const urls = new Set();
  snap.docs.forEach((d) => {
    (d.data().images || []).forEach((u) => {
      if (typeof u !== 'string') return;
      WIDTHS.forEach((w) => {
        const o = optimized(u, w);
        if (o) urls.add(o);
      });
    });
  });

  const list = [...urls];
  console.log(`Warming ${list.length} Cloudinary variants…`);
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < list.length; i += 6) {
    const results = await Promise.all(list.slice(i, i + 6).map(warm));
    ok += results.filter(Boolean).length;
    fail += results.filter((r) => !r).length;
    process.stdout.write(`  …${Math.min(i + 6, list.length)}/${list.length} (ok ${ok}, failed ${fail})\r`);
  }
  console.log(`\nDone. ${ok} warmed, ${fail} failed.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Warm failed:', e.message || e);
  process.exit(1);
});
