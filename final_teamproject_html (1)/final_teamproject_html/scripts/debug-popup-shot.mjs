import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(`file://${path.join(ROOT, 'index.html')}`);
await page.click('[data-screen="1_home"] .hotspot[data-target="1_02_explain"]');
await page.click('[data-screen="1_02_explain"] .hotspot[data-target="1_03_situation"]');
await page.click('[data-screen="1_03_situation"] .hotspot[aria-label="Frame 135"]');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(__dirname, 'debug-popup.png') });
await browser.close();
console.log('saved debug-popup.png');
