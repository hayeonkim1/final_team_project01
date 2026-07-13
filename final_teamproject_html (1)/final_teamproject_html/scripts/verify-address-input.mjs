import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(`file://${path.join(ROOT, 'index.html')}`);

await page.evaluate(() => {
  const screens = ['1_home', '1_02_explain', '1_03_situation', '1_04_search_place01', '1_06_cabinet_select', '1_07_service_select', '1_07_service_select_01', '1_08_address'];
  let i = 0;
  const go = () => {
    if (i >= screens.length) return;
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const t = document.querySelector(`[data-screen="${screens[i]}"]`);
    if (t) t.classList.add('active');
    i++;
  };
  go(); go(); go(); go(); go(); go(); go(); go();
});

await page.click('[data-address-input]');
const afterFocus = await page.evaluate(() => ({
  value: document.querySelector('[data-address-input]').value,
  placeholder: document.querySelector('[data-address-input]').placeholder,
  cleared: document.querySelector('[data-address-input]').dataset.cleared,
}));
await page.keyboard.type('서울시 마포구');
const afterType = await page.evaluate(() => document.querySelector('[data-address-input]').value);
await page.screenshot({ path: path.join(__dirname, 'debug-address-input.png') });
await browser.close();
console.log({ afterFocus, afterType });
