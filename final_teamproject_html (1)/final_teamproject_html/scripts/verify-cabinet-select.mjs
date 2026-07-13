import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = `file:///${path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/')}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1062 } });
await page.goto(url);

await page.evaluate(() => showScreen('1_06_cabinet_select', false));

const defaultState = await page.evaluate(() => ({
  cabinet01: document.querySelector('.choosed-cabinet-input--01')?.textContent,
  price01: document.querySelector('.choosed-price-input--01')?.textContent,
  lSelected: document.querySelector('[aria-label="L_cabinet_card"]')?.classList.contains('cabinet-select-card--selected'),
}));

await page.click('[aria-label="S_cabinet_card"]');

const afterS = await page.evaluate(() => ({
  cabinet01: document.querySelector('.choosed-cabinet-input--01')?.textContent,
  price01: document.querySelector('.choosed-price-input--01')?.textContent,
  sSelected: document.querySelector('[aria-label="S_cabinet_card"]')?.classList.contains('cabinet-select-card--selected'),
}));

await page.evaluate(() => showScreen('1_10_store_price', false));

const afterStore = await page.evaluate(() => ({
  cabinet02: document.querySelector('.choosed-cabinet-input--02')?.textContent,
  price02: document.querySelector('.choosed-price-input--02')?.textContent,
}));

console.log(JSON.stringify({ defaultState, afterS, afterStore }, null, 2));
await browser.close();
