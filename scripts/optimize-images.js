// One-off build tool: re-encode heavy hero/background/gallery images to WebP.
// Run with:  node scripts/optimize-images.js
// Requires sharp (installed with --no-save; not a runtime dependency).
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images');

// Full-bleed background images: displayed edge-to-edge, decorative behind text.
const BACKGROUNDS = [
  'heropage.png',
  'Background_Book_Valuation.png',
  'Background_of_the_services.png',
  'Landlord_page.png',
  'Tenants_Book_viewing_background.png',
  'Landlord_Book_valuation_background.png',
];

// Content/gallery images: shown in cards and a full-screen lightbox.
const CONTENT = [
  'landlord-app.png',
  'service-compare.png',
  'agent-photo.jpeg',
  'brand-desk.jpeg',
  'compliance.jpeg',
];

async function toWebp(file, maxWidth, quality) {
  const src = path.join(IMG_DIR, file);
  if (!fs.existsSync(src)) {
    console.log(`SKIP (missing): ${file}`);
    return;
  }
  const base = file.replace(/\.(png|jpe?g)$/i, '');
  const out = path.join(IMG_DIR, `${base}.webp`);
  const before = fs.statSync(src).size;
  await sharp(src)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(out);
  const after = fs.statSync(out).size;
  console.log(
    `${file.padEnd(40)} ${(before / 1024).toFixed(0).padStart(5)}KB -> ` +
    `${base}.webp ${(after / 1024).toFixed(0).padStart(5)}KB  (-${(100 - (after / before) * 100).toFixed(0)}%)`
  );
}

async function ogImage() {
  // Social cards want a stable 1200x630 raster (WebP OG support is spotty).
  const src = path.join(IMG_DIR, 'heropage.png');
  if (!fs.existsSync(src)) return;
  const out = path.join(IMG_DIR, 'heropage-og.jpg');
  await sharp(src)
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log(`heropage-og.jpg  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
}

(async () => {
  for (const f of BACKGROUNDS) await toWebp(f, 1920, 72);
  for (const f of CONTENT) await toWebp(f, 1400, 76);
  await ogImage();
  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
