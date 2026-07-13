/** Figma Frame 172 unified header titles — final_teamproject 3 jw */
const SCREEN_HEADER_TITLES = {
  '1_02_explain': '짐토리 짐 보관 서비스 소개에요!',
  '1_03_situation': '상황 선택',
  '1_04_search_place01': '지점 찾기',
  '1_06_cabinet_select': '보관 신청',
  '1_07_service_select': '보관 방식',
  '1_08_address': '보관 신청',
  '1_09_lending_service_select': '위탁 대여 선택',
  '1_10_store_price': '예상 보관료',
  '1_11': '신청 완료',
  '1_12': '신청 완료',
  '2_01_product_upload01': '대여 물품 등록',
  '2_02_product_upload02': '대여 물품 등록',
  '2_03_product_upload03': '대여 물품 등록',
  '2_04_lending_info': '등록 정보',
  '2_05_lending_complete': '등록 완료',
  '3_01_borrow_select_전체': '대여 물품 선택',
  '3_01_borrow_select_소형가전': '대여 물품 선택',
  '3_01_borrow_select_소형가구': '대여 물품 선택',
  '3_01_borrow_select_계절용품': '대여 물품 선택',
  '3_01_borrow_select_생활용품': '대여 물품 선택',
  '3_02_borrow_detail01': '대여 물품 상세정보',
  '3_02_borrow_detail02': '대여 물품 상세정보',
  '3_02_borrow_detail03': '대여 물품 상세정보',
  '3_02_borrow_detail04': '대여 물품 상세정보',
  '3_02_borrow_detail05': '대여 물품 상세정보',
  '3_02_borrow_detail06': '대여 물품 상세정보',
  '3_02_borrow_detail07': '대여 물품 상세정보',
  '3_02_borrow_detail08': '대여 물품 상세정보',
  '3_02_borrow_detail09': '대여 물품 상세정보',
  '3_02_borrow_detail10': '대여 물품 상세정보',
  '3_02_borrow_detail11': '대여 물품 상세정보',
  '3_02_borrow_detail12': '대여 물품 상세정보',
  '3_02_borrow_detail13': '대여 물품 상세정보',
  '3_02_borrow_detail14': '대여 물품 상세정보',
  '3_02_borrow_detail15': '대여 물품 상세정보',
  '3_02_borrow_detail16': '대여 물품 상세정보',
  '3_02_borrow_detail17': '대여 물품 상세정보',
  '3_02_borrow_detail18': '대여 물품 상세정보',
  '3_02_borrow_detail19': '대여 물품 상세정보',
  '3_02_borrow_detail20': '대여 물품 상세정보',
  '3_02_borrow_detail21': '대여 물품 상세정보',
  '3_02_borrow_detail22': '대여 물품 상세정보',
  '3_02_borrow_detail23': '대여 물품 상세정보',
  '3_02_borrow_detail24': '대여 물품 상세정보',
  '3_03_borrow_price': '예상 대여료',
  '3_03': '대여 완료',
};

const ARROW_ONLY_HEADERS = new Set(['2_menu']);

const HEADER_BACK_SELECTOR = [
  '.hotspot[data-action="back"]',
  '.hotspot.hotspot--header-back',
  '.hotspot[aria-label="Frame 141"]',
  '.hotspot[aria-label="Frame 169"]',
  '.hotspot[aria-label="Frame 172"]',
  '.hotspot[aria-label="Vector"]',
  '.hotspot[aria-label="Group 11"]',
  '.hotspot[aria-label="Frame 144"]',
].join(',');

function screenHasHeaderBack(screen) {
  return Boolean(screen.querySelector(HEADER_BACK_SELECTOR));
}

function injectUnifiedPageHeaders() {
  document.querySelectorAll('.screen').forEach((screen) => {
    const screenId = screen.dataset.screen;
    const title = SCREEN_HEADER_TITLES[screenId];
    const arrowOnly = ARROW_ONLY_HEADERS.has(screenId);
    if (!screenHasHeaderBack(screen)) return;
    if (!title && !arrowOnly) return;
    if (screen.querySelector('.page-header')) return;

    const titleHtml = title
      ? `<span class="page-header__title">${title}</span>`
      : '';

    const header = document.createElement('div');
    header.className = 'page-header';
    header.setAttribute('aria-hidden', 'true');
    header.innerHTML = `
      <div class="page-header__mask"></div>
      <span class="page-header__arrow">
        <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.5 8.5H2.2M2.2 8.5L7.8 2.9M2.2 8.5L7.8 14.1" stroke="#101218" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      ${titleHtml}
    `;
    screen.insertBefore(header, screen.firstChild);
  });
}
