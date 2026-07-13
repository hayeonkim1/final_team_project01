import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = `file:///${path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/')}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 411, height: 874 } });
await page.goto(url);
await page.evaluate(() => showScreen('1_06_cabinet_select', false));
await page.click('[aria-label="M_cabinet_card"]');
await page.evaluate(() => showScreen('1_10_store_price', false));

const info = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { text: el?.textContent, x: r.x, y: r.y, w: r.width, h: r.height, color: cs.color };
  };
  return {
    base: pick('.choosed-price-input--02'),
    total01: pick('[data-total-price-01]'),
    total02: pick('[data-total-price-02]'),
  };
});

await page.screenshot({
  path: path.resolve(__dirname, 'debug-store-total.png'),
  clip: { x: 0, y: 400, width: 411, height: 200 },
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
