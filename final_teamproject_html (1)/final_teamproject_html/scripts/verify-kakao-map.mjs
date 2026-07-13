import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
const requests = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => requests.push(`failed: ${r.url()} - ${r.failure()?.errorText}`));
page.on('response', (r) => {
  if (r.url().includes('kakao.com')) requests.push(`response: ${r.status()} ${r.url()}`);
});

await page.goto('http://localhost:3456/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const headScripts = await page.evaluate(() =>
  [...document.querySelectorAll('script[src*="kakao"]')].map((s) => s.src)
);

console.log(JSON.stringify({ headScripts, requests, logs, kakao: await page.evaluate(() => !!window.kakao) }, null, 2));
await browser.close();
