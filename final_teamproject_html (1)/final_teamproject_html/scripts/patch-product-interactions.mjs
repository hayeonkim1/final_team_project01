import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'index.html');

const products = [
  { id: 'stand-fan-black', detailPageId: '3_02_borrow_detail01' },
  { id: 'trash-green', detailPageId: '3_02_borrow_detail02' },
  { id: 'laundry-basket', detailPageId: '3_02_borrow_detail03' },
  { id: 'shelf-3tier', detailPageId: '3_02_borrow_detail04' },
  { id: 'office-chair', detailPageId: '3_02_borrow_detail05' },
  { id: 'drying-rack', detailPageId: '3_02_borrow_detail06' },
  { id: 'humidifier', detailPageId: '3_02_borrow_detail07' },
  { id: 'stand-lamp', detailPageId: '3_02_borrow_detail08' },
  { id: 'carrier-silver', detailPageId: '3_02_borrow_detail09' },
  { id: 'fan-white', detailPageId: '3_02_borrow_detail10' },
  { id: 'monitor-24', detailPageId: '3_02_borrow_detail11' },
  { id: 'air-circulator', detailPageId: '3_02_borrow_detail12' },
  { id: 'portable-cooler', detailPageId: '3_02_borrow_detail13' },
  { id: 'electric-blanket', detailPageId: '3_02_borrow_detail14' },
  { id: 'electric-heater', detailPageId: '3_02_borrow_detail15' },
  { id: 'microwave', detailPageId: '3_02_borrow_detail16' },
  { id: 'folding-table', detailPageId: '3_02_borrow_detail17' },
  { id: 'simple-desk', detailPageId: '3_02_borrow_detail18' },
  { id: 'storage-2tier', detailPageId: '3_02_borrow_detail19' },
  { id: 'mini-fan', detailPageId: '3_02_borrow_detail20' },
  { id: 'toaster', detailPageId: '3_02_borrow_detail21' },
  { id: 'simple-hanger', detailPageId: '3_02_borrow_detail22' },
  { id: 'shelf-wood', detailPageId: '3_02_borrow_detail23' },
  { id: 'mobile-shelf', detailPageId: '3_02_borrow_detail24' },
];
const byDetail = Object.fromEntries(products.map((p) => [p.detailPageId, p.id]));

let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
  /<button class="hotspot"([^>]*data-target="(3_02_borrow_detail\d+)"[^>]*aria-label="Rectangle[^"]*"[^>]*)>/g,
  (m, attrs, detail) => {
    const pid = byDetail[detail];
    if (!pid) return m;
    return `<button class="hotspot product-card" data-product-id="${pid}"${attrs}>`;
  }
);

if (!html.includes('js/data.js')) {
  html = html.replace(
    '<script src="js/app.js"></script>',
    '<script src="js/data.js"></script>\n  <script src="js/app.js"></script>'
  );
}

if (!html.includes('data-price-product-name')) {
  const overlay = `    <div class="borrow-price-panel borrow-price-panel--summary">
      <div class="summary-row summary-row--product">
        <span class="summary-row-left" aria-hidden="true"></span>
        <span class="summary-row-value product-name-value" data-price-product-name></span>
      </div>
    </div>
    <div class="borrow-price-panel borrow-price-panel--amounts price-card">
      <div class="price-row">
        <span class="price-label" aria-hidden="true"></span>
        <span class="price-value" data-price-base-fee></span>
      </div>
      <div class="price-row price-row--deposit">
        <span class="price-label" aria-hidden="true"></span>
        <span class="price-value" data-price-deposit>₩2,000원</span>
      </div>
      <div class="price-divider" aria-hidden="true"></div>
      <div class="subtotal-row">
        <span class="price-label" aria-hidden="true"></span>
        <span class="price-value" data-price-subtotal></span>
      </div>
    </div>
    <div class="borrow-price-panel borrow-price-panel--total">
      <div class="total-price-row">
        <span class="total-price-label" aria-hidden="true"></span>
        <span class="total-price-value" data-price-total></span>
      </div>
    </div>
`;
  html = html.replace(
    /(<section class="screen" data-screen="3_03_borrow_price"[^>]*>\n)/,
    `$1${overlay}`
  );
}

fs.writeFileSync(htmlPath, html);
console.log('patched', htmlPath);
