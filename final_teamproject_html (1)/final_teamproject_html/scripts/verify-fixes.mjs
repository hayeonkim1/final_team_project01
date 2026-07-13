import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const indexUrl = `file:///${ROOT.replace(/\\/g, '/')}/index.html`;

const products = [
  { name: '모니터 24인치', detail: '3_02_borrow_detail11', price: 8000 },
  { name: '선풍기(화이트)', detail: '3_02_borrow_detail10', price: 3000 },
  { name: '가정용 가습기(블루)', detail: '3_02_borrow_detail07', price: 5000 },
  { name: '접이식 테이블(화이트)', detail: '3_02_borrow_detail17', price: 4000 },
];

async function activeScreen(page) {
  return page.$eval('.screen.active', (el) => el.dataset.screen);
}

async function testBorrowPrice(page) {
  const results = [];
  for (const p of products) {
    await page.goto(indexUrl);
    await page.evaluate((prod) => {
      localStorage.setItem('selectedProduct', JSON.stringify({
        id: prod.detail,
        name: prod.name,
        price: prod.price,
        detailPageId: prod.detail,
      }));
      showScreen('3_03_borrow_price', false);
    }, p);

    const data = await page.$eval('[data-screen="3_03_borrow_price"]', (screen) => {
      const static10000 = [...screen.querySelectorAll('*')].filter(
        (el) => el.children.length === 0 &&
          el.textContent === '₩10,000원' &&
          !el.hasAttribute('data-price-subtotal') &&
          !el.hasAttribute('data-price-total')
      );
      return {
        subtotal: screen.querySelector('[data-price-subtotal]')?.textContent || '',
        total: screen.querySelector('[data-price-total]')?.textContent || '',
        staticNodes: static10000.length,
      };
    });
    results.push({ product: p.name, ...data, ok: data.staticNodes === 0 });
  }
  return results;
}

async function testBackFlow(page, steps, backTo) {
  await page.goto(indexUrl);
  for (const step of steps) {
    if (step.click) {
      await page.click(`[data-screen="${step.from}"] ${step.click}`);
    }
  }
  const before = await activeScreen(page);
  const backScreen = steps.at(-1).to || steps.at(-1);
  const backFrom = typeof backScreen === 'string' ? backScreen : backScreen.to;
  await page.click(`[data-screen="${backFrom}"] .hotspot[data-action="back"]`);
  const after = await activeScreen(page);
  return { before, after, expected: backTo, ok: after === backTo };
}

async function testBackNav(page) {
  const results = [];

  await page.goto(indexUrl);
  await page.click('[data-screen="1_home"] [data-target="1_04_search_place01"]');
  await page.click('[data-screen="1_04_search_place01"] [aria-label="이 지점 선택 box"]');
  await page.click('[data-screen="1_06_cabinet_select"] .hotspot[data-action="back"]');
  results.push({
    frame: '1_06_cabinet_select',
    after: await activeScreen(page),
    expected: '1_04_search_place01',
    ok: (await activeScreen(page)) === '1_04_search_place01',
  });

  await page.goto(indexUrl);
  await page.click('[data-screen="1_home"] [data-target="2_menu"]');
  await page.click('[data-screen="2_menu"] [data-target="2_01_product_upload01"]');
  await page.click('[data-screen="2_01_product_upload01"] [aria-label="add_item_btn"]');
  await page.click('[data-screen="2_02_product_upload02"] .hotspot[data-action="back"]');
  results.push({
    frame: '2_02_product_upload02',
    after: await activeScreen(page),
    expected: '2_01_product_upload01',
    ok: (await activeScreen(page)) === '2_01_product_upload01',
  });

  await page.goto(indexUrl);
  await page.click('[data-screen="1_home"] [data-target="2_menu"]');
  await page.click('[data-screen="2_menu"] [data-target="2_01_product_upload01"]');
  await page.click('[data-screen="2_01_product_upload01"] [aria-label="add_item_btn"]');
  await page.click('[data-screen="2_02_product_upload02"] [aria-label="이 지점 선택 box"]');
  await page.click('[data-screen="2_03_product_upload03"] .hotspot[data-action="back"]');
  results.push({
    frame: '2_03_product_upload03',
    after: await activeScreen(page),
    expected: '2_02_product_upload02',
    ok: (await activeScreen(page)) === '2_02_product_upload02',
  });

  await page.goto(indexUrl);
  await page.click('[data-screen="1_home"] [data-target="2_menu"]');
  await page.click('[data-screen="2_menu"] [data-target="2_01_product_upload01"]');
  await page.click('[data-screen="2_01_product_upload01"] [aria-label="add_item_btn"]');
  await page.click('[data-screen="2_02_product_upload02"] [aria-label="이 지점 선택 box"]');
  await page.click('[data-screen="2_03_product_upload03"] [aria-label="이 지점 선택 box"]');
  await page.click('[data-screen="2_04_lending_info"] .hotspot[data-action="back"]');
  results.push({
    frame: '2_04_lending_info',
    after: await activeScreen(page),
    expected: '2_03_product_upload03',
    ok: (await activeScreen(page)) === '2_03_product_upload03',
  });

  return results;
}

async function testHeaderPositions(page) {
  await page.goto(indexUrl);
  return page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('.screen > .hotspot').forEach((el) => {
      const label = el.getAttribute('aria-label');
      const isHeader = el.classList.contains('hotspot--header-back') ||
        el.dataset.action === 'back' ||
        ['Group 11', 'Frame 141', 'Frame 169', 'Frame 172', 'Vector', 'Frame 144'].includes(label);
      if (!isHeader) return;
      const style = getComputedStyle(el);
      const left = parseFloat(style.left);
      const top = parseFloat(style.top);
      if (Math.abs(left - 22.2) > 0.5 || Math.abs(top - 58.58) > 0.5) {
        issues.push({
          screen: el.closest('.screen')?.dataset.screen,
          label,
          left,
          top,
        });
      }
    });
    return { issues };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });

console.log('Borrow price:', JSON.stringify(await testBorrowPrice(page), null, 2));
console.log('Back nav:', JSON.stringify(await testBackNav(page), null, 2));
console.log('Header:', JSON.stringify(await testHeaderPositions(page), null, 2));

await browser.close();
