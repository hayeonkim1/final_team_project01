/**
 * Product catalog — values from Figma frames (final_teamproject 3 jw)
 */
var products = [
  { id: 'stand-fan-black', name: '스탠드 선풍기(블랙)', category: '계절용품', price: 3900, detailPageId: '3_02_borrow_detail01' },
  { id: 'trash-green', name: '쓰레기통(그린)', category: '생활용품', price: 1900, detailPageId: '3_02_borrow_detail02' },
  { id: 'laundry-basket', name: '세탁 바구니', category: '생활용품', price: 1500, detailPageId: '3_02_borrow_detail03' },
  { id: 'shelf-3tier', name: '3단 선반(화이트)', category: '소형가구', price: 3900, detailPageId: '3_02_borrow_detail04' },
  { id: 'office-chair', name: '사무용 의자', category: '소형가구', price: 3900, detailPageId: '3_02_borrow_detail05' },
  { id: 'drying-rack', name: '빨래 건조대', category: '생활용품', price: 2000, detailPageId: '3_02_borrow_detail06' },
  { id: 'humidifier', name: '가정용 가습기(블루)', category: '계절용품', price: 2500, detailPageId: '3_02_borrow_detail07' },
  { id: 'stand-lamp', name: '스탠드 조명', category: '소형가전', price: 3900, detailPageId: '3_02_borrow_detail08' },
  { id: 'carrier-silver', name: '캐리어(실버) 28인치', category: '생활용품', price: 3000, detailPageId: '3_02_borrow_detail09' },
  { id: 'fan-white', name: '선풍기(화이트)', category: '소형가전', price: 4900, detailPageId: '3_02_borrow_detail10' },
  { id: 'monitor-24', name: '모니터 24인치', category: '소형가전', price: 8000, detailPageId: '3_02_borrow_detail11' },
  { id: 'air-circulator', name: '에어 써큘레이터(화이트)', category: '계절용품', price: 5000, detailPageId: '3_02_borrow_detail12' },
  { id: 'portable-cooler', name: '이동식 냉풍기(블랙)', category: '계절용품', price: 3000, detailPageId: '3_02_borrow_detail13' },
  { id: 'electric-blanket', name: '전기담요', category: '계절용품', price: 4000, detailPageId: '3_02_borrow_detail14' },
  { id: 'electric-heater', name: '전기히터', category: '계절용품', price: 4900, detailPageId: '3_02_borrow_detail15' },
  { id: 'microwave', name: '전자레인지(화이트)', category: '소형가전', price: 4000, detailPageId: '3_02_borrow_detail16' },
  { id: 'folding-table', name: '접이식 테이블(화이트)', category: '소형가구', price: 2000, detailPageId: '3_02_borrow_detail17' },
  { id: 'simple-desk', name: '간이 책상(화이트)', category: '소형가구', price: 3000, detailPageId: '3_02_borrow_detail18' },
  { id: 'storage-2tier', name: '2단 수납합', category: '생활용품', price: 1000, detailPageId: '3_02_borrow_detail19' },
  { id: 'mini-fan', name: '미니 선풍기(화이트)', category: '소형가전', price: 1500, detailPageId: '3_02_borrow_detail20' },
  { id: 'toaster', name: '토스트기(화이트)', category: '소형가전', price: 3000, detailPageId: '3_02_borrow_detail21' },
  { id: 'simple-hanger', name: '간이식 행거(화이트)', category: '소형가구', price: 2000, detailPageId: '3_02_borrow_detail22' },
  { id: 'shelf-wood', name: '간이 선반(우드)', category: '소형가구', price: 3000, detailPageId: '3_02_borrow_detail23' },
  { id: 'mobile-shelf', name: '이동식 선반(블랙)', category: '생활용품', price: 2000, detailPageId: '3_02_borrow_detail24' },
];

var productById = Object.fromEntries(products.map((p) => [p.id, p]));
var productByDetailPage = Object.fromEntries(products.map((p) => [p.detailPageId, p]));
var DETAIL_PAGE_IDS = products.map((p) => p.detailPageId);
var DEPOSIT = 2000;
var STORE_TOTAL_EXTRA = 5000;

function formatWon(value) {
  return `₩${Number(value).toLocaleString('ko-KR')}원`;
}

function formatStorePriceWon(value) {
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

function parseKoreanPrice(text) {
  const digits = String(text || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function getProductByDetailPage(detailPageId) {
  return productByDetailPage[detailPageId] || null;
}

function getProductById(id) {
  return productById[id] || null;
}

/** Place catalog — 1-04_search_place01 (coords: 각 역 인근 상권) */
var places = [
  { id: '01', name: '서강대점', lat: 37.5530, lng: 126.9376 }, // 서강로·신촌로터리 상권
  { id: '02', name: '이대점', lat: 37.5580, lng: 126.9452 }, // 이화여대길 상권
  { id: '03', name: '신촌점', lat: 37.5572, lng: 126.9370 }, // 연세로·명물거리 상권
  { id: '04', name: '홍대점', lat: 37.5563, lng: 126.9229 }, // 홍대 걷고싶은거리 상권
];

var placeById = Object.fromEntries(places.map((p) => [p.id, p]));
var DEFAULT_PLACE_ID = '03';

function getPlaceById(id) {
  return placeById[id] || null;
}

/** Cabinet catalog — 1-06_cabinet_select cabinet_select layer */
var cabinets = [
  { id: 'S', info: 'S캐비닛', priceInfo: '월 15,000원' },
  { id: 'M', info: 'M캐비닛', priceInfo: '월 20,000원' },
  { id: 'L', info: 'L캐비닛', priceInfo: '월 25,000원' },
  { id: 'XL', info: 'XL캐비닛', priceInfo: '월 35,000원' },
];

var cabinetById = Object.fromEntries(cabinets.map((c) => [c.id, c]));
var DEFAULT_CABINET_ID = 'L';

function getCabinetById(id) {
  return cabinetById[id] || null;
}

/** S캐비닛 → S 캐비닛 (choosed_cabinet_input01/02 표기) */
function formatCabinetInfo(info) {
  return info.replace('캐비닛', ' 캐비닛');
}

var SERVICE_NEXT_SCREEN = {
  pickup: '1_08_address',
  self: '1_09_lending_service_select',
};

function getServiceNextScreen(serviceId) {
  return SERVICE_NEXT_SCREEN[serviceId] || null;
}

var LENDING_FLOW_STORAGE = 'storage';
var LENDING_FLOW_REGISTER = 'register';

function saveLendingFlowPath(path) {
  if (path) localStorage.setItem('lendingFlowPath', path);
  else localStorage.removeItem('lendingFlowPath');
}

function getLendingFlowPath() {
  return localStorage.getItem('lendingFlowPath') || null;
}

function getLendingCompleteScreen() {
  return getLendingFlowPath() === LENDING_FLOW_REGISTER ? '1_12' : '1_home';
}
