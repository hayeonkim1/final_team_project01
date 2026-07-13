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

const afterM = await page.evaluate(() => ({
  base: document.querySelector('.choosed-price-input--02')?.textContent,
  total01: document.querySelector('[data-total-price-01]')?.textContent,
  total02: document.querySelector('[data-total-price-02]')?.textContent,
}));

await page.evaluate(() => showScreen('1_06_cabinet_select', false));
await page.click('[aria-label="S_cabinet_card"]');
await page.evaluate(() => showScreen('1_10_store_price', false));

const afterS = await page.evaluate(() => ({
  base: document.querySelector('.choosed-price-input--02')?.textContent,
  total01: document.querySelector('[data-total-price-01]')?.textContent,
  total02: document.querySelector('[data-total-price-02]')?.textContent,
}));

console.log(JSON.stringify({ afterM, afterS }, null, 2));
await browser.close();
