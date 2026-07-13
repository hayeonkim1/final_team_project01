import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens/membership_popup.png')));
const scale = png.width / 330;

function sample(x, y) {
  const px = Math.round(x * scale);
  const py = Math.round(y * scale);
  const i = (png.width * py + px) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}

for (const [label, x, y] of [
  ['close', 318, 8],
  ['border top', 165, 12],
  ['btn center', 165, 182],
  ['border left', 8, 110],
  ['seed', 280, 100],
  ['card TL outer', 20, 30],
  ['card TL inner', 25, 35],
  ['card top edge', 165, 28],
  ['card right edge', 305, 100],
]) {
  console.log(label, sample(x, y));
}
