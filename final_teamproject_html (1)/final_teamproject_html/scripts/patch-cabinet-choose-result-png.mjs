import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** choose_result bar fill — #f2a922 at 10% on #ffffff */
const BAR_FILL = { r: 254, g: 246, b: 233 };

function fillRect(png, x, y, w, h, color) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      if (px < 0 || py < 0 || px >= png.width || py >= png.height) continue;
      const idx = (png.width * py + px) << 2;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = 255;
    }
  }
}

function patchCabinetSelect() {
  const pngPath = path.resolve(__dirname, '../assets/screens/1_06_cabinet_select.png');
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  const scale = png.width / 402;

  // 1× layout coords — mask baked choosed_cabinet_input01 / choosed_price_input01 only
  [
    { x: 136, y: 584, w: 78, h: 20 },
    { x: 285, y: 584, w: 88, h: 20 },
  ].forEach((m) => {
    fillRect(
      png,
      Math.round(m.x * scale),
      Math.round(m.y * scale),
      Math.round(m.w * scale),
      Math.round(m.h * scale),
      BAR_FILL,
    );
  });

  fs.writeFileSync(pngPath, PNG.sync.write(png));
  console.log('patched', pngPath);
}

function patchStorePrice() {
  const pngPath = path.resolve(__dirname, '../assets/screens/1_10_store_price.png');
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  const scale = png.width / 411;

  // 1× layout coords — mask baked dynamic value areas on 1-10
  [
    { x: 300, y: 376, w: 68, h: 16 },
    { x: 295, y: 429, w: 88, h: 16 },
    { x: 295, y: 530, w: 88, h: 16 },
    { x: 293, y: 582, w: 86, h: 22 },
  ].forEach((m) => {
    fillRect(
      png,
      Math.round(m.x * scale),
      Math.round(m.y * scale),
      Math.round(m.w * scale),
      Math.round(m.h * scale),
      { r: 255, g: 255, b: 255 },
    );
  });

  fs.writeFileSync(pngPath, PNG.sync.write(png));
  console.log('patched', pngPath);
}

patchCabinetSelect();
patchStorePrice();
