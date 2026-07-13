/**
 * Remove orange strokes only; keep #F2A922 fills on CTA buttons/banners.
 * HTML/CSS hotspots unchanged.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENS_DIR = path.resolve(__dirname, '../assets/screens');

const WHITE = { r: 255, g: 255, b: 255 };
const BRAND_FILL = { r: 242, g: 169, b: 34 }; // #F2A922
const CLOSE_GRAY = { r: 100, g: 100, b: 100 };

function setPixel(png, px, py, color) {
  if (px < 0 || py < 0 || px >= png.width || py >= png.height) return;
  const idx = (png.width * py + px) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = 255;
}

function layoutXY(px, py, layoutWidth, pngWidth) {
  const scale = pngWidth / layoutWidth;
  return { x: px / scale, y: py / scale };
}

function isWhiteish(r, g, b, a = 255) {
  return a > 200 && r >= 248 && g >= 248 && b >= 248;
}

function isDarkText(r, g, b, a = 255) {
  return a > 200 && r < 80 && g < 80 && b < 80;
}

/** Figma prototype hotspot orange — not brand fill */
function isPrototypeOrange(r, g, b, a = 255) {
  if (a < 10) return false;
  if (r >= 252 && g >= 148 && g <= 158 && b >= 48 && b <= 54) return true;
  if (r >= 248 && g >= 145 && g <= 170 && b >= 40 && b <= 80) return true;
  if (r >= 225 && g >= 145 && g <= 175 && b >= 60 && b <= 100) return true;
  if (r >= 218 && g >= 135 && g <= 180 && b >= 70 && b <= 105) return true;
  return false;
}

/** Darker orange stroke (#FC8807 family) — not main fill #F2A922 */
function isStrokeOrange(r, g, b, a = 255) {
  if (a < 10) return false;
  if (isPrototypeOrange(r, g, b, a)) return true;
  if (r >= 248 && g >= 128 && g <= 152 && b <= 30) return true;
  if (r >= 240 && g >= 155 && g <= 200 && b >= 45 && b <= 100) return true;
  return false;
}

function isBrandFill(r, g, b, a = 255) {
  return a > 200 && r >= 238 && g >= 163 && g <= 175 && b >= 28 && b <= 40;
}

function fillLayoutRect(png, rect, layoutWidth, color, keepFn = null) {
  const scale = png.width / layoutWidth;
  const x0 = Math.round(rect.x * scale);
  const y0 = Math.round(rect.y * scale);
  const x1 = Math.round((rect.x + rect.w) * scale);
  const y1 = Math.round((rect.y + rect.h) * scale);
  let n = 0;
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (png.width * py + px) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (keepFn && keepFn(r, g, b, a)) continue;
      setPixel(png, px, py, color);
      n++;
    }
  }
  return n;
}

function patchMembershipPopup(pngPath, btnY) {
  const layoutWidth = 330;
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  let strokes = 0;

  for (let py = 0; py < png.height; py++) {
    for (let px = 0; px < png.width; px++) {
      const idx = (png.width * py + px) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (!isStrokeOrange(r, g, b, a)) continue;

      const { x, y } = layoutXY(px, py, layoutWidth, png.width);
      const inBtn = x >= 30 && x <= 304 && y >= btnY - 2 && y <= btnY + 37;
      const inClose = x >= 286 && y <= 34;

      if (inBtn) {
        if (!isWhiteish(r, g, b, a) && !isDarkText(r, g, b, a)) {
          setPixel(png, px, py, BRAND_FILL);
          strokes++;
        }
      } else if (inClose) {
        if (!isDarkText(r, g, b, a)) {
          setPixel(png, px, py, WHITE);
          strokes++;
        }
      } else {
        setPixel(png, px, py, WHITE);
        strokes++;
      }
    }
  }

  const filled = fillLayoutRect(
    png,
    { x: 32, y: btnY, w: 266, h: 35 },
    layoutWidth,
    BRAND_FILL,
    (r, g, b, a) => isWhiteish(r, g, b, a),
  );

  fs.writeFileSync(pngPath, PNG.sync.write(png));
  console.log(path.basename(pngPath), `strokes→fill/white: ${strokes}, btn fill: ${filled}px`);
}

function patch104BannerStroke(pngPath) {
  const layoutWidth = 402;
  const banner = { x: 20, y: 746, w: 362, h: 47 };
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  const scale = png.width / layoutWidth;
  const x0 = Math.round((banner.x - 2) * scale);
  const y0 = Math.round((banner.y - 2) * scale);
  const x1 = Math.round((banner.x + banner.w + 2) * scale);
  const y1 = Math.round((banner.y + banner.h + 2) * scale);
  let n = 0;

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (png.width * py + px) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (a < 10) continue;
      if (isStrokeOrange(r, g, b, a)) {
        setPixel(png, px, py, BRAND_FILL);
        n++;
      }
    }
  }

  fs.writeFileSync(pngPath, PNG.sync.write(png));
  console.log(path.basename(pngPath), `banner stroke removed: ${n}px`);
}

function patchPrototypeHotspots(pngPath, layoutWidth = 402) {
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  let n = 0;
  for (let py = 0; py < png.height; py++) {
    for (let px = 0; px < png.width; px++) {
      const idx = (png.width * py + px) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (isPrototypeOrange(r, g, b, a)) {
        setPixel(png, px, py, WHITE);
        n++;
      }
    }
  }
  if (n) {
    fs.writeFileSync(pngPath, PNG.sync.write(png));
    console.log(path.basename(pngPath), `prototype hotspots: ${n}px`);
  }
}

export function patchStrokeOnlyPngs() {
  const popup1 = path.join(SCREENS_DIR, 'membership_popup.png');
  const popup2 = path.join(SCREENS_DIR, 'membership_popup_finish.png');
  const p04 = path.join(SCREENS_DIR, '1_04_search_place01.png');

  if (fs.existsSync(popup1)) patchMembershipPopup(popup1, 165);
  if (fs.existsSync(popup2)) patchMembershipPopup(popup2, 162);
  if (fs.existsSync(p04)) patch104BannerStroke(p04);

  for (const file of ['1_02_explain.png', '1_03_situation.png', '1_04_search_place01.png']) {
    const p = path.join(SCREENS_DIR, file);
    if (fs.existsSync(p)) patchPrototypeHotspots(p, 402);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  patchStrokeOnlyPngs();
  console.log('done');
}
