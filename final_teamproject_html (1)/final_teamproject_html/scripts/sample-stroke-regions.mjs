import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENS = path.resolve(__dirname, '../assets/screens');

function load(name) {
  return PNG.sync.read(fs.readFileSync(path.join(SCREENS, name)));
}

function sample(png, layoutW, x, y) {
  const s = png.width / layoutW;
  const px = Math.round(x * s), py = Math.round(y * s);
  const i = (png.width * py + px) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2], a: png.data[i + 3] };
}

const popup = load('membership_popup.png');
for (const [l, x, y] of [
  ['btn center', 165, 182],
  ['btn edge', 35, 182],
  ['border TL', 12, 28],
  ['close', 310, 12],
  ['title', 100, 80],
]) console.log('popup', l, sample(popup, 330, x, y));

const p04 = load('1_04_search_place01.png');
for (const [l, x, y] of [
  ['banner center', 200, 760],
  ['banner edge', 25, 760],
  ['banner bottom', 200, 790],
  ['nav', 50, 855],
]) console.log('1_04', l, sample(p04, 402, x, y));
