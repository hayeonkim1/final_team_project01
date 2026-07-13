import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexUrl = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(indexUrl);
await page.click('[data-screen="1_home"] .hotspot[data-target="1_02_explain"]');
await page.click('[data-screen="1_02_explain"] .hotspot[data-target="1_03_situation"]');
await page.screenshot({ path: path.join(__dirname, 'debug-103.png') });
const styles = await page.evaluate(() => {
  const hs = document.querySelector('[data-screen="1_03_situation"] .hotspot[aria-label="Frame 135"]');
  const s = getComputedStyle(hs);
  return { border: s.border, outline: s.outline, borderRadius: s.borderRadius, className: hs.className };
});
console.log(styles);
await browser.close();
