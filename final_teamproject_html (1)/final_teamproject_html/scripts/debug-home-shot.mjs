import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexUrl = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(indexUrl);
await page.screenshot({ path: path.join(__dirname, 'debug-home.png') });
await page.click('[data-screen="1_home"] .hotspot[data-overlay], [data-screen="1_home"] .hotspot[data-target="membership_popup"]');
await browser.close();
