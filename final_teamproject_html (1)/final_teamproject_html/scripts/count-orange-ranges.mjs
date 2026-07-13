import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '1_03_situation.png';
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens', file)));

function isTight(r, g, b) {
  return r >= 252 && g >= 148 && g <= 158 && b >= 48 && b <= 54;
}
function isWide(r, g, b) {
  return r >= 248 && g >= 145 && g <= 170 && b >= 40 && b <= 80;
}
function isBrand(r, g, b) {
  return r >= 235 && g >= 155 && g <= 185 && b >= 20 && b <= 45;
}

let tight = 0, wide = 0, brand = 0, both = 0;
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
  const t = isTight(r, g, b), w = isWide(r, g, b), br = isBrand(r, g, b);
  if (t) tight++;
  if (w) wide++;
  if (br) brand++;
  if (t && br) both++;
}
console.log(file, { tight, wide, brand, both });
