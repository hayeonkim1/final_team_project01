import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = `file:///${path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/')}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1062 } });
await page.goto(url);

await page.click('[data-screen="1_home"] [data-target="1_04_search_place01"]');
await page.click('[aria-label="place_select_card_01"]');
const selectedCard = await page.evaluate(() => ({
  hasStroke: document.querySelector('[aria-label="place_select_card_01"]')?.classList.contains('place-select-card--selected'),
}));
await page.click('[data-screen="1_04_search_place01"] [aria-label="이 지점 선택 box"]');

const afterCard01 = await page.evaluate(() => ({
  input01: document.querySelector('.choosed-place-input--01')?.textContent,
  screen: document.querySelector('.screen.active')?.dataset.screen,
}));

await page.evaluate(() => showScreen('1_10_store_price', false));
const afterStore = await page.evaluate(() => ({
  input02: document.querySelector('.choosed-place-input--02')?.textContent,
  textAlign: getComputedStyle(document.querySelector('.choosed-place-input--02')).textAlign,
}));

await page.evaluate(() => showScreen('1_04_search_place01', false));
await page.click('[aria-label="place_select_card_04"]');
await page.evaluate(() => showScreen('1_06_cabinet_select', false));

const afterCard04 = await page.evaluate(() => ({
  input01: document.querySelector('.choosed-place-input--01')?.textContent,
  stored: JSON.parse(localStorage.getItem('selectedPlace')),
}));

console.log(JSON.stringify({ selectedCard, afterCard01, afterStore, afterCard04 }, null, 2));

await page.click('[data-screen="1_06_cabinet_select"] .hotspot--header-back');
const afterBack = await page.evaluate(() => document.querySelector('.screen.active')?.dataset.screen);
console.log('back from 1_06:', afterBack);
await browser.close();
