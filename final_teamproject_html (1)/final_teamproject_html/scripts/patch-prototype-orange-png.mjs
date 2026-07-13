/**
 * Remove Figma prototype hotspot orange (#FF9933) and membership popup brand orange
 * baked into exported PNGs. HTML/CSS hotspots are unchanged.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENS_DIR = path.resolve(__dirname, '../assets/screens');

const WHITE = { r: 255, g: 255, b: 255 };
const BTN_GRAY = { r: 90, g: 90, b: 90 };
const CLOSE_GRAY = { r: 120, g: 120, b: 120 };
const BORDER_GRAY = { r: 224, g: 224, b: 224 };

/** Figma prototype interaction indicator — #FF9933 family */
function isPrototypeOrange(r, g, b, a = 255) {
  if (a < 10) return false;
  if (r >= 252 && g >= 148 && g <= 158 && b >= 48 && b <= 54) return true;
  if (r >= 248 && g >= 145 && g <= 170 && b >= 40 && b <= 80) return true;
  if (r >= 225 && g >= 145 && g <= 175 && b >= 60 && b <= 100) return true;
  if (r >= 218 && g >= 135 && g <= 180 && b >= 70 && b <= 105) return true;
  return false;
}

/** App brand orange — #f2a922 family + light tints from strokes */
function isBrandOrange(r, g, b, a = 255) {
  if (a < 10) return false;
  if (r >= 235 && g >= 120 && g <= 190 && b >= 0 && b <= 45) return true;
  if (r >= 228 && g >= 160 && g <= 198 && b >= 28 && b <= 95) return true;
  return false;
}

function setPixel(png, px, py, color) {
  if (px < 0 || py < 0 || px >= png.width || py >= png.height) return;
  const idx = (png.width * py + px) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = 255;
}

function layoutCoord(px, py, layoutWidth, pngWidth) {
  const scale = pngWidth / layoutWidth;
  return { x: px / scale, y: py / scale, scale };
}

function popupReplacement(px, py, layoutWidth, png) {
  const { x, y } = layoutCoord(px, py, layoutWidth, png.width);
  if (x >= 28 && x <= 302 && y >= 155 && y <= 206) return BTN_GRAY;
  if (x >= 288 && y <= 32) return CLOSE_GRAY;
  if (x <= 22 || x >= 308 || y <= 22 || y >= 198) return WHITE;
  return BORDER_GRAY;
}

function patchPrototypeOrange(pngPath, layoutWidth = 402) {
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  let count = 0;
  for (let py = 0; py < png.height; py++) {
    for (let px = 0; px < png.width; px++) {
      const idx = (png.width * py + px) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (isPrototypeOrange(r, g, b, a)) {
        setPixel(png, px, py, WHITE);
        count++;
      }
    }
  }
  fs.writeFileSync(pngPath, PNG.sync.write(png));
  console.log('prototype orange removed:', path.basename(pngPath), count, 'px');
}

function patchMembershipPopup(pngPath, layoutWidth = 330) {
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  let count = 0;
  for (let py = 0; py < png.height; py++) {
    for (let px = 0; px < png.width; px++) {
      const idx = (png.width * py + px) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (isBrandOrange(r, g, b, a) || isPrototypeOrange(r, g, b, a)) {
        setPixel(png, px, py, popupReplacement(px, py, layoutWidth, png));
        count++;
      }
    }
  }
  fs.writeFileSync(pngPath, PNG.sync.write(png));
  console.log('popup orange removed:', path.basename(pngPath), count, 'px');
}

const PROTOTYPE_SCREENS = [
  '1_02_explain.png',
  '1_03_situation.png',
  '1_04_search_place01.png',
];

const POPUP_SCREENS = [
  'membership_popup.png',
  'membership_popup_finish.png',
];

function patchPrototypeOrangePngs() {
  for (const file of PROTOTYPE_SCREENS) {
    const p = path.join(SCREENS_DIR, file);
    if (fs.existsSync(p)) patchPrototypeOrange(p, 402);
  }
  for (const file of POPUP_SCREENS) {
    const p = path.join(SCREENS_DIR, file);
    if (fs.existsSync(p)) patchMembershipPopup(p, 330);
  }
}

export { patchPrototypeOrangePngs };

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  patchPrototypeOrangePngs();
  console.log('done');
}
