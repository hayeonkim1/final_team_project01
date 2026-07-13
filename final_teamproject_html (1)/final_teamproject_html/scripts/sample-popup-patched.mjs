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
  return { x: px, y: py, r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}

for (const [label, x, y] of [
  ['close', 310, 15],
  ['close2', 300, 20],
  ['corner TL', 15, 25],
  ['corner TR', 315, 25],
  ['corner BL', 15, 200],
  ['corner BR', 315, 200],
  ['btn', 165, 182],
]) {
  console.log(label, sample(x, y));
}

let remaining = 0;
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i], g = png.data[i+1], b = png.data[i+2];
  if (r >= 200 && g >= 100 && g <= 200 && b < 100) remaining++;
}
console.log('remaining warm orange:', remaining);
