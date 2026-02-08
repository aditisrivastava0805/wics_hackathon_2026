/**
 * Generates 12 placeholder JPGs in public/demo/artists/ for Demo Image Mode.
 * Run from frontend: node scripts/generate-demo-images.js
 *
 * Minimal valid 1x1 pixel JFIF JPEG (red) – same content for all 12 as placeholders.
 * Replace with real gradient/concert images by dropping 01.jpg … 12.jpg into public/demo/artists/.
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'demo', 'artists');
const MINIMAL_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////8B/////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

const buf = Buffer.from(MINIMAL_JPEG_BASE64, 'base64');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

for (let i = 1; i <= 12; i++) {
  const name = String(i).padStart(2, '0') + '.jpg';
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log('  ✓', name);
}

console.log('\nDemo placeholder images written to public/demo/artists/ (01.jpg … 12.jpg).');
console.log('Replace with higher-res gradient or concert images for better demo cards.\n');
