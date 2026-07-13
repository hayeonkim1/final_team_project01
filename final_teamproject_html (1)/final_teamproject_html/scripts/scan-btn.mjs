import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || 'membership_popup.png';
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens', file)));
const scale = png.width / 330;
const btn = file.includes('finish') ? { x: 32, y: 162, w: 266, h: 35 } : { x: 32, y: 165, w: 266, h: 35 };
const colors = new Map();

for (let ly = btn.y - 2; ly < btn.y + btn.h + 2; ly++) {
  for (let lx = btn.x - 2; lx < btn.x + btn.w + 2; lx++) {
    const px = Math.round(lx * scale), py = Math.round(ly * scale);
    const i = (png.width * py + px) << 2;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    if (r > 80 || g > 80) {
      const k = `${r},${g},${b}`;
      colors.set(k, (colors.get(k) || 0) + 1);
    }
  }
}
console.log(file, [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10));
