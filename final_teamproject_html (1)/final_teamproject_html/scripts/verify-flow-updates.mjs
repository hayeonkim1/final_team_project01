import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(`file://${path.join(ROOT, 'index.html')}`);

// Clear persisted selections
await page.evaluate(() => {
  localStorage.removeItem('selectedPlace');
  localStorage.removeItem('selectedCabinet');
  localStorage.removeItem('selectedService');
});

// 1-04 no selection on first visit
await page.click('[data-screen="1_home"] .hotspot[data-target="1_02_explain"]');
await page.click('[data-screen="1_02_explain"] .hotspot[data-target="1_03_situation"]');
await page.click('[data-screen="1_03_situation"] .hotspot[data-overlay="membership_popup"]');
await page.click('[data-screen="membership_popup"] [data-action="close-overlay"]');
await page.click('[data-screen="membership_popup_finish"] [data-action="close-overlay"]');
const place04 = await page.evaluate(() => ({
  screen: document.querySelector('.screen.active:not(.screen--overlay)')?.dataset.screen,
  selected: [...document.querySelectorAll('[data-screen="1_04_search_place01"] .place-select-card--selected')].length,
}));

// 1-07 service select on main frame
await page.evaluate(() => {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.querySelector('[data-screen="1_07_service_select"]').classList.add('active');
});
await page.click('[data-screen="1_07_service_select"] [data-service-id="pickup"]');
const service = await page.evaluate(() => ({
  selected: document.querySelector('[data-screen="1_07_service_select"] .service-select-card--selected')?.dataset.serviceId,
  saved: localStorage.getItem('selectedService'),
}));

await browser.close();
console.log({ place04, service });
