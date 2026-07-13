import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(fs.readFileSync(path.resolve(__dirname, '../assets/screens/membership_popup.png')));
const scale = png.width / 330;
const colors = new Map();

for (let py = 0; py < png.height; py++) {
  for (let px = 0; px < png.width; px++) {
    const i = (png.width * py + px) << 2;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    if (r >= 200 && g >= 100 && g <= 200 && b < 100) {
      const key = `${r},${g},${b}`;
      const entry = colors.get(key) || { count: 0, px, py };
      entry.count++;
      colors.set(key, entry);
    }
  }
}

console.log([...colors.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,10).map(([k,v])=>({k,count:v.count,layoutX:+(v.px/scale).toFixed(1),layoutY:+(v.py/scale).toFixed(1)})));
