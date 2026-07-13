import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(`file://${path.join(ROOT, 'index.html')}`);

// Open membership popup via situation card
await page.click('[data-screen="1_home"] .hotspot[data-target="1_02_explain"]');
await page.click('[data-screen="1_02_explain"] .hotspot[data-target="1_03_situation"]');
await page.click('[data-screen="1_03_situation"] .hotspot[aria-label="Frame 135"]');
const open1 = await page.evaluate(() => Boolean(document.querySelector('[data-screen="membership_popup"].active')));
await page.click('[data-screen="membership_popup"] [data-action="close-overlay"]');
const closed1 = await page.evaluate(() => Boolean(document.querySelector('[data-screen="membership_popup"].active')));

// Detail address input
await page.evaluate(() => {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.querySelector('[data-screen="1_08_address"]').classList.add('active');
});
await page.click('[data-detail-address-input]');
await page.keyboard.type('101호');
const detail = await page.evaluate(() => ({
  value: document.querySelector('[data-detail-address-input]').value,
  saved: localStorage.getItem('selectedDetailAddress'),
}));

await browser.close();
console.log({ open1, closed1, detail });
