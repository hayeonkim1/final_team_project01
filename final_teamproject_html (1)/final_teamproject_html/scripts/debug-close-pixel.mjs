import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens/membership_popup.png')));
const scale = png.width / 330;
const lx = 306.5, ly = 5.5;
const px = Math.round(lx * scale), py = Math.round(ly * scale);
const i = (png.width * py + px) << 2;
console.log({ px, py, r: png.data[i], g: png.data[i+1], b: png.data[i+2], a: png.data[i+3] });

function isBrandOrange(r, g, b, a = 255) {
  if (a < 128) return false;
  if (r >= 235 && g >= 120 && g <= 190 && b >= 0 && b <= 45) return true;
  if (r >= 228 && g >= 160 && g <= 198 && b >= 28 && b <= 95) return true;
  return false;
}
console.log('isBrand', isBrandOrange(png.data[i], png.data[i+1], png.data[i+2], png.data[i+3]));
