import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens/1_04_search_place01.png')));
const scale = png.width / 402;

// banner: left 20, top 746, w 362, h 47
const bx = Math.round(20 * scale), by = Math.round(746 * scale);
const bw = Math.round(362 * scale), bh = Math.round(47 * scale);
const colors = new Map();

for (let py = by; py < by + bh; py++) {
  for (let px = bx; px < bx + bw; px++) {
    const i = (png.width * py + px) << 2;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    if (r > 200 && g > 100 && b < 100) {
      const k = `${r},${g},${b}`;
      colors.set(k, (colors.get(k) || 0) + 1);
    }
  }
}
console.log([...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12));

// vertical profile at center x
const cx = Math.round(201 * scale);
for (let y = 740; y <= 798; y++) {
  const py = Math.round(y * scale);
  const i = (png.width * py + cx) << 2;
  const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
  if (r > 180) console.log('y', y, `${r},${g},${b}`);
}
