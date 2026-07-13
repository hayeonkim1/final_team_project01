import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '1_03_situation.png';
const pngPath = path.resolve(__dirname, '../assets/screens', file);
const png = PNG.sync.read(fs.readFileSync(pngPath));
const scale = png.width / 402;

function sample(x, y) {
  const px = Math.round(x * scale);
  const py = Math.round(y * scale);
  const i = (png.width * py + px) << 2;
  return { x: px, y: py, r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}

const points = [
  ['card TL', 22, 205],
  ['card TR', 192, 205],
  ['nav home', 39, 826],
  ['nav storage', 115, 826],
  ['hamster orange fur', 110, 280],
  ['white bg', 200, 100],
];

for (const [label, x, y] of points) {
  console.log(label, sample(x, y));
}

// count saturated orange-ish pixels
let orangeCount = 0;
const oranges = new Map();
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  const a = png.data[i + 3];
  if (a < 128) continue;
  // prototype orange: high R, G between 100-200, low B
  if (r > 200 && g > 80 && g < 220 && b < 80) {
    orangeCount++;
    const key = `${r},${g},${b}`;
    oranges.set(key, (oranges.get(key) || 0) + 1);
  }
}
console.log('orange-ish pixels:', orangeCount);
console.log('top colors:', [...oranges.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15));
