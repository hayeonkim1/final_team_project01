import { readFileSync } from 'fs';

const dataJs = readFileSync('js/data.js', 'utf8');
const products = eval(dataJs.replace(/^[\s\S]*?const products = /, '').replace(/;\s*const productById[\s\S]*$/, ''));

const DEPOSIT = 2000;
const tests = [
  { id: 'monitor-24', screen: '3_01_borrow_select_전체', detail: '3_02_borrow_detail11' },
  { id: 'fan-white', screen: '3_01_borrow_select_소형가전', detail: '3_02_borrow_detail10' },
  { id: 'folding-table', screen: '3_01_borrow_select_소형가구', detail: '3_02_borrow_detail17' },
  { id: 'carrier-silver', screen: '3_01_borrow_select_생활용품', detail: '3_02_borrow_detail09' },
  { id: 'drying-rack', screen: '3_01_borrow_select_생활용품', detail: '3_02_borrow_detail06' },
];

let ok = true;
for (const t of tests) {
  const p = products.find((x) => x.id === t.id);
  const total = p.price + DEPOSIT;
  if (p.detailPageId !== t.detail) {
    console.error('FAIL detail', t.id, p.detailPageId, t.detail);
    ok = false;
  }
  console.log(`OK ${t.id}: ${p.name} | base ₩${p.price} | total ₩${total}`);
}

const html = readFileSync('index.html', 'utf8');
const cardCount = (html.match(/class="hotspot product-card"/g) || []).length;
console.log('product-card hotspots:', cardCount);
if (cardCount < 30) { console.error('FAIL expected ~30 product cards'); ok = false; }
if (!html.includes('data-price-product-name')) { console.error('FAIL price overlays'); ok = false; }

process.exit(ok ? 0 : 1);
