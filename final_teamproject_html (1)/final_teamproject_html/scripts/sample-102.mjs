import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens/1_02_explain.png')));
const scale = png.width / 402;

function sample(x, y) {
  const px = Math.round(x * scale), py = Math.round(y * scale);
  const i = (png.width * py + px) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}

for (const [label, x, y] of [
  ['CTA btn center', 200, 615],
  ['CTA btn top', 200, 600],
  ['CTA btn edge', 30, 615],
  ['bottom nav', 50, 855],
]) {
  console.log(label, sample(x, y));
}
