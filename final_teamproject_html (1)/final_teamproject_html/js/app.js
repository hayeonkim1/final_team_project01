/**
 * Figma prototype — frame PNG + transparent hotspots + product flow
 */
const screenHistory = [];

function showOverlay(overlayName) {
  const overlay = document.querySelector(`[data-screen="${overlayName}"]`);
  if (!overlay) {
    console.error('Overlay not found:', overlayName);
    return;
  }
  document.querySelectorAll('.screen--overlay.active').forEach((s) => s.classList.remove('active'));
  overlay.classList.add('active');
}

function closeOverlay() {
  document.querySelectorAll('.screen--overlay.active').forEach((s) => s.classList.remove('active'));
}

function showScreen(screenName, pushHistory = true) {
  const current = document.querySelector('.screen.active:not(.screen--overlay)');

  closeOverlay();

  if (current && pushHistory) {
    screenHistory.push(current.dataset.screen);
  }

  document.querySelectorAll('.screen:not(.screen--overlay)').forEach((s) => s.classList.remove('active'));

  const target = document.querySelector(`[data-screen="${screenName}"]`);
  if (!target) {
    console.error('Screen not found:', screenName);
    return;
  }

  target.classList.add('active');

  const app = document.getElementById('app');
  const h = parseInt(target.dataset.height || '874', 10);
  if (h > 874) {
    app.classList.add('tall');
    app.style.height = `${h}px`;
  } else {
    app.classList.remove('tall');
    app.style.height = '874px';
  }

  if (screenName === '3_03_borrow_price') {
    renderPricePage();
  }

  renderChosenPlace();
  renderChosenCabinet();
  renderSelectedService();
  renderAddressInput();

  if (screenName === '1_04_search_place01') {
    requestAnimationFrame(function () {
      initPlaceSearchMap();
    });
  }
}

function goBack() {
  const previous = screenHistory.pop();
  if (!previous) return;
  showScreen(previous, false);
}

function saveSelectedProduct(product) {
  localStorage.setItem('selectedProduct', JSON.stringify(product));
}

function getSelectedProduct() {
  try {
    return JSON.parse(localStorage.getItem('selectedProduct'));
  } catch {
    return null;
  }
}

function renderPricePage() {
  const selectedProduct = getSelectedProduct();
  if (!selectedProduct) return;

  const deposit = DEPOSIT;
  const total = selectedProduct.price + deposit;

  const productNameEl = document.querySelector('[data-price-product-name]');
  const baseFeeEl = document.querySelector('[data-price-base-fee]');
  const subtotalEl = document.querySelector('[data-price-subtotal]');
  const totalEl = document.querySelector('[data-price-total]');

  if (productNameEl) productNameEl.textContent = selectedProduct.name;
  if (baseFeeEl) baseFeeEl.textContent = formatWon(selectedProduct.price);
  if (subtotalEl) subtotalEl.textContent = formatWon(total);
  if (totalEl) totalEl.textContent = formatWon(total);
}

function saveSelectedPlace(place) {
  localStorage.setItem('selectedPlace', JSON.stringify(place));
}

function getSelectedPlace() {
  try {
    const saved = JSON.parse(localStorage.getItem('selectedPlace'));
    if (saved?.name) return saved;
  } catch {
    /* ignore */
  }
  return null;
}

function renderChosenPlace() {
  const place = getSelectedPlace();

  document.querySelectorAll('[data-choosed-place-input]').forEach((el) => {
    el.textContent = place ? place.name : '';
  });

  document.querySelectorAll('.place-select-card').forEach((card) => {
    const isSelected = Boolean(place && card.dataset.placeId === place.id);
    card.classList.toggle('place-select-card--selected', isSelected);
  });

  if (typeof refreshPlaceSearchMap === 'function') {
    refreshPlaceSearchMap();
  }
}

function saveSelectedCabinet(cabinet) {
  localStorage.setItem('selectedCabinet', JSON.stringify(cabinet));
}

function getSelectedCabinet() {
  try {
    const saved = JSON.parse(localStorage.getItem('selectedCabinet'));
    if (saved?.id) return saved;
  } catch {
    /* ignore */
  }
  return null;
}

function renderChosenCabinet() {
  const cabinet = getSelectedCabinet();

  const infoText = cabinet ? formatCabinetInfo(cabinet.info) : '';
  const priceText = cabinet ? cabinet.priceInfo : '';

  document.querySelectorAll('[data-choosed-cabinet-input]').forEach((el) => {
    el.textContent = infoText;
  });

  document.querySelectorAll('[data-choosed-price-input]').forEach((el) => {
    el.textContent = priceText;
  });

  document.querySelectorAll('.cabinet-select-card').forEach((card) => {
    const isSelected = Boolean(cabinet && card.dataset.cabinetId === cabinet.id);
    card.classList.toggle('cabinet-select-card--selected', isSelected);
  });

  renderStoreTotalPrice();
}

function saveSelectedService(serviceId) {
  localStorage.setItem('selectedService', serviceId);
}

function getSelectedService() {
  return localStorage.getItem('selectedService') || null;
}

function renderSelectedService() {
  const serviceId = getSelectedService();
  document.querySelectorAll('.service-select-card').forEach((card) => {
    const isSelected = Boolean(serviceId && card.dataset.serviceId === serviceId);
    card.classList.toggle('service-select-card--selected', isSelected);
  });
}

function saveSelectedAddress(value) {
  localStorage.setItem('selectedAddress', value);
}

function getSelectedAddress() {
  return localStorage.getItem('selectedAddress') || '';
}

function saveSelectedDetailAddress(value) {
  localStorage.setItem('selectedDetailAddress', value);
}

function getSelectedDetailAddress() {
  return localStorage.getItem('selectedDetailAddress') || '';
}

function activateClearableInput(input) {
  if (!input) return;
  if (input.dataset.cleared !== 'true') {
    input.dataset.cleared = 'true';
    input.value = '';
    input.placeholder = '';
  }
  input.focus();
}

function activateAddressInput(input) {
  activateClearableInput(input);
}

function renderAddressInput() {
  const screen = document.querySelector('[data-screen="1_08_address"]');
  if (!screen) return;

  const addressInput = screen.querySelector('[data-address-input]');
  if (addressInput) {
    const saved = getSelectedAddress();
    if (saved) {
      addressInput.value = saved;
      addressInput.dataset.cleared = 'true';
      addressInput.placeholder = '';
    }
  }

  const detailInput = screen.querySelector('[data-detail-address-input]');
  if (detailInput) {
    const savedDetail = getSelectedDetailAddress();
    if (savedDetail) {
      detailInput.value = savedDetail;
      detailInput.dataset.cleared = 'true';
    }
  }
}

function renderStoreTotalPrice() {
  const priceEl = document.querySelector('.choosed-price-input--02');
  const basePrice = priceEl ? parseKoreanPrice(priceEl.textContent) : 0;
  const totalText = formatStorePriceWon(basePrice + STORE_TOTAL_EXTRA);

  document.querySelectorAll('[data-total-price-01]').forEach((el) => {
    el.textContent = totalText;
  });

  document.querySelectorAll('[data-total-price-02]').forEach((el) => {
    el.textContent = totalText;
  });
}

function resolveProductFromHotspot(hotspot) {
  const productId = hotspot.dataset.productId;
  if (productId) return getProductById(productId);

  const target = hotspot.dataset.target;
  if (target && target.startsWith('3_02_borrow_detail')) {
    return getProductByDetailPage(target);
  }
  return null;
}

document.addEventListener('focusin', (event) => {
  const addressInput = event.target.closest('[data-address-input]');
  if (addressInput) {
    activateAddressInput(addressInput);
    return;
  }
  const detailInput = event.target.closest('[data-detail-address-input]');
  if (detailInput) detailInput.focus();
});

document.addEventListener('input', (event) => {
  const addressInput = event.target.closest('[data-address-input]');
  if (addressInput) {
    saveSelectedAddress(addressInput.value);
    return;
  }
  const detailInput = event.target.closest('[data-detail-address-input]');
  if (detailInput) saveSelectedDetailAddress(detailInput.value);
});

document.addEventListener('click', (event) => {
  const hotspot = event.target.closest('.hotspot');
  if (!hotspot) return;

  const action = hotspot.dataset.action;
  const target = hotspot.dataset.target;

  if (action === 'back') {
    if (document.querySelector('.screen--overlay.active')) {
      closeOverlay();
      return;
    }
    goBack();
    return;
  }

  if (action === 'close-overlay') {
    const overlayNext = hotspot.dataset.overlayNext;
    const navigateTarget = hotspot.dataset.navigateTarget;
    closeOverlay();
    if (overlayNext) {
      showOverlay(overlayNext);
      return;
    }
    if (navigateTarget) {
      showScreen(navigateTarget, true);
    }
    return;
  }

  if (action === 'service-next') {
    const serviceId = getSelectedService();
    const nextScreen = getServiceNextScreen(serviceId);
    if (nextScreen) showScreen(nextScreen);
    return;
  }

  if (action === 'lending-info-next') {
    showScreen(getLendingFlowPath() === LENDING_FLOW_REGISTER ? '1_12' : '2_05_lending_complete');
    return;
  }

  if (action === 'lending-complete-next') {
    showScreen(getLendingCompleteScreen());
    return;
  }

  const overlay = hotspot.dataset.overlay;
  if (overlay) {
    showOverlay(overlay);
    return;
  }

  if (hotspot.classList.contains('service-select-card') || hotspot.dataset.serviceId) {
    const serviceId = hotspot.dataset.serviceId;
    if (!serviceId) return;
    saveSelectedService(serviceId);
    renderSelectedService();
    return;
  }

  if (hotspot.classList.contains('place-select-card') || hotspot.dataset.placeId) {
    const place = getPlaceById(hotspot.dataset.placeId);
    if (place) {
      saveSelectedPlace(place);
      renderChosenPlace();
    }
    return;
  }

  if (hotspot.classList.contains('cabinet-select-card') || hotspot.dataset.cabinetId) {
    const cabinet = getCabinetById(hotspot.dataset.cabinetId);
    if (cabinet) {
      saveSelectedCabinet(cabinet);
      renderChosenCabinet();
    }
    return;
  }

  if (hotspot.classList.contains('lending-select-card') || hotspot.dataset.lendingPath) {
    const lendingPath = hotspot.dataset.lendingPath;
    const nextScreen = hotspot.dataset.target;
    if (lendingPath) saveLendingFlowPath(lendingPath);
    if (nextScreen) showScreen(nextScreen);
    return;
  }

  if (hotspot.classList.contains('product-card') || hotspot.dataset.productId) {
    const product = resolveProductFromHotspot(hotspot);
    if (product) {
      saveSelectedProduct(product);
      showScreen(product.detailPageId);
      return;
    }
  }

  if (target === '3_03_borrow_price') {
    if (!getSelectedProduct()) {
      const screen = hotspot.closest('.screen');
      const product = getProductByDetailPage(screen?.dataset.screen);
      if (product) saveSelectedProduct(product);
    }
    showScreen('3_03_borrow_price');
    return;
  }

  if (target) {
    if (target === '2_01_product_upload01' && hotspot.closest('[data-screen="2_menu"]')) {
      saveLendingFlowPath(null);
    }
    const pushHistory = hotspot.dataset.noHistory !== 'true';
    showScreen(target, pushHistory);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  injectUnifiedPageHeaders();
  renderChosenPlace();
  renderChosenCabinet();
  renderSelectedService();
  renderAddressInput();
  showScreen('1_home', false);
});
