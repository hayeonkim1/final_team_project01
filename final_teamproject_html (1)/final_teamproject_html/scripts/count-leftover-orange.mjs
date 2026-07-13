import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || '1_03_situation.png';
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens', file)));
let count = 0;
const colors = new Map();
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i], g = png.data[i+1], b = png.data[i+2];
  if (r >= 220 && g >= 140 && g <= 175 && b >= 60 && b <= 100) {
    count++;
    const k = `${r},${g},${b}`;
    colors.set(k, (colors.get(k)||0)+1);
  }
}
console.log(file, count, [...colors.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8));
