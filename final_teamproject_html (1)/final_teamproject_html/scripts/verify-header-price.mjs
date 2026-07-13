import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = `file:///${path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/')}`;

const borrowScreens = [
  '3_01_borrow_select_전체',
  '3_01_borrow_select_소형가전',
  '3_01_borrow_select_소형가구',
  '3_01_borrow_select_계절용품',
  '3_01_borrow_select_생활용품',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(url);

const headerResults = await page.evaluate((screens) => {
  const ref = {};
  const issues = [];
  screens.forEach((id) => {
    const screen = document.querySelector(`[data-screen="${id}"]`);
    if (!screen) return;
    const back = screen.querySelector('.hotspot[aria-label="Group 11"], .hotspot--header-back');
    const header = screen.querySelector('.page-header');
    const arrow = header?.querySelector('.page-header__arrow');
    const title = header?.querySelector('.page-header__title');
    const data = {
      hasBack: !!back,
      hasHeader: !!header,
      back: back ? { left: getComputedStyle(back).left, top: getComputedStyle(back).top } : null,
      arrow: arrow ? { left: getComputedStyle(arrow).left, top: getComputedStyle(arrow).top } : null,
      title: title ? { top: getComputedStyle(title).top, text: title.textContent } : null,
    };
    if (id === '3_01_borrow_select_전체') Object.assign(ref, data);
    else {
      ['back', 'arrow', 'title'].forEach((k) => {
        const a = ref[k];
        const b = data[k];
        if (!a || !b) issues.push({ screen: id, k, a, b });
        else if (k === 'title') {
          if (a.top !== b.top || a.text !== b.text) issues.push({ screen: id, k, a, b });
        } else if (a.left !== b.left || a.top !== b.top) issues.push({ screen: id, k, a, b });
      });
      if (!data.hasHeader) issues.push({ screen: id, missing: 'page-header' });
    }
  });
  return { ref, issues };
}, borrowScreens);

await page.evaluate(() => {
  localStorage.setItem('selectedProduct', JSON.stringify({
    name: '선풍기(화이트)', price: 3000, detailPageId: '3_02_borrow_detail10',
  }));
  showScreen('3_03_borrow_price', false);
  renderPricePage();
});

const priceLayout = await page.$eval('[data-screen="3_03_borrow_price"]', (screen) => {
  const subtotalRow = screen.querySelector('.subtotal-row');
  const subtotal = screen.querySelector('[data-price-subtotal]');
  const divider = screen.querySelector('.price-divider');
  const rowRect = subtotalRow.getBoundingClientRect();
  const priceRect = subtotal.getBoundingClientRect();
  return {
    subtotalOnSameLine: Math.abs(rowRect.top - priceRect.top) < 3 && Math.abs(rowRect.bottom - priceRect.bottom) < 3,
    rowTop: rowRect.top,
    priceTop: priceRect.top,
    dividerCount: screen.querySelectorAll('.price-divider').length,
    subtotalText: subtotal.textContent,
  };
});

console.log(JSON.stringify({ headerResults, priceLayout }, null, 2));
await browser.close();
