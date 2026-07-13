import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pngPath = path.resolve(__dirname, '../assets/screens/3_03_borrow_price.png');
const png = PNG.sync.read(fs.readFileSync(pngPath));

function fillWhite(x, y, w, h) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const idx = (png.width * py + px) << 2;
      png.data[idx] = 255;
      png.data[idx + 1] = 255;
      png.data[idx + 2] = 255;
      png.data[idx + 3] = 255;
    }
  }
}

// PNG is exported at 2× (804×1748); masks use pixel coords at export scale
const SCALE = png.width / 402;
const masks = [
  { x: 311, y: 432, w: 55, h: 13 }, // 기본 대여료 value
  { x: 311, y: 460, w: 55, h: 13 }, // 보증금 value
  { x: 72, y: 968, w: 660, h: 36 }, // PNG duplicate divider above 소계
  { x: 72, y: 1000, w: 660, h: 24 }, // PNG 소계 row bottom line
  { x: 72, y: 1004, w: 120, h: 20 }, // PNG baked 소계 label
  { x: 306, y: 503, w: 60, h: 13 }, // 소계 static ₩10,000원
  { x: 284, y: 548, w: 82, h: 18 }, // 총 예상 금액 static ₩10,000원
].map((m) => ({
  x: Math.round(m.x * SCALE),
  y: Math.round(m.y * SCALE),
  w: Math.round(m.w * SCALE),
  h: Math.round(m.h * SCALE + 4),
}));

masks.forEach((m) => fillWhite(m.x, m.y, m.w, m.h));
fs.writeFileSync(pngPath, PNG.sync.write(png));
console.log('patched', pngPath);
