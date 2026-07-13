import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens/1_03_situation.png')));
const scale = png.width / 402;

function sample(x, y) {
  const px = Math.round(x * scale);
  const py = Math.round(y * scale);
  const i = (png.width * py + px) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}

for (const [label, x, y] of [
  ['card1 TL', 24, 208],
  ['card1 center illust', 110, 270],
  ['nav home underline', 50, 855],
]) {
  console.log(label, sample(x, y));
}
