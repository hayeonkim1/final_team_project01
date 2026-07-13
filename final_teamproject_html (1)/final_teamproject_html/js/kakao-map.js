/**
 * 1-04_search_place01 — Kakao Map
 */
var placeSearchMap = null;
var placeSearchMarkers = [];

/** 참고 구현 기준 — 신촌 연세로 상권 중심 */
var PLACE_MAP_DEFAULT_CENTER = { lat: 37.5572, lng: 126.9370 };
var PLACE_MAP_DEFAULT_LEVEL = 3;
var PLACE_MAP_MIN_LEVEL = 1;
var PLACE_MAP_MAX_LEVEL = 6;

function bindPlaceSearchMapWheel(container) {
  if (container.dataset.wheelBound === 'true') return;
  container.dataset.wheelBound = 'true';

  container.addEventListener(
    'wheel',
    function (event) {
      if (!placeSearchMap) return;

      event.preventDefault();
      event.stopPropagation();

      var level = placeSearchMap.getLevel();
      var nextLevel = event.deltaY > 0 ? level + 1 : level - 1;
      nextLevel = Math.max(PLACE_MAP_MIN_LEVEL, Math.min(PLACE_MAP_MAX_LEVEL, nextLevel));

      if (nextLevel !== level) {
        placeSearchMap.setLevel(nextLevel);
      }
    },
    { passive: false, capture: true }
  );
}

function bindPlaceSearchMapDrag(container) {
  if (container.dataset.dragBound === 'true') return;
  container.dataset.dragBound = 'true';

  var dragging = false;
  var lastX = 0;
  var lastY = 0;

  container.addEventListener('mousedown', function (event) {
    if (!placeSearchMap || event.button !== 0) return;

    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    container.classList.add('place-search-map--dragging');
    event.preventDefault();
  });

  window.addEventListener('mousemove', function (event) {
    if (!dragging || !placeSearchMap) return;

    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    if (dx === 0 && dy === 0) return;

    lastX = event.clientX;
    lastY = event.clientY;

    var projection = placeSearchMap.getProjection();
    var center = placeSearchMap.getCenter();
    var centerPoint = projection.pointFromCoords(center);
    var nextPoint = new kakao.maps.Point(centerPoint.x - dx, centerPoint.y - dy);
    placeSearchMap.setCenter(projection.coordsFromPoint(nextPoint));
  });

  window.addEventListener('mouseup', function () {
    if (!dragging) return;
    dragging = false;
    container.classList.remove('place-search-map--dragging');
  });
}

function renderPlaceSearchMarkers() {
  if (!placeSearchMap) return;

  placeSearchMarkers.forEach(function (marker) {
    marker.setMap(null);
  });
  placeSearchMarkers = [];

  places.forEach(function (place) {
    if (!place.lat || !place.lng) return;

    var position = new kakao.maps.LatLng(place.lat, place.lng);
    var marker = new kakao.maps.Marker({
      map: placeSearchMap,
      position: position,
      title: place.name,
    });

    kakao.maps.event.addListener(marker, 'click', function () {
      saveSelectedPlace(place);
      renderChosenPlace();
    });

    placeSearchMarkers.push(marker);
  });
}

function showMapLoadError(container, message) {
  container.innerHTML = '<p class="place-search-map__error">' + message + '</p>';
}

function relayoutPlaceSearchMap() {
  if (!placeSearchMap) return;
  placeSearchMap.relayout();
  setTimeout(function () {
    if (placeSearchMap) placeSearchMap.relayout();
  }, 100);
}

function movePlaceSearchMapToPlace(place) {
  if (!placeSearchMap || !place || !place.lat || !place.lng) return;
  placeSearchMap.panTo(new kakao.maps.LatLng(place.lat, place.lng));
  placeSearchMap.setLevel(PLACE_MAP_DEFAULT_LEVEL);
}

function resetPlaceSearchMapView() {
  if (!placeSearchMap) return;
  placeSearchMap.setCenter(new kakao.maps.LatLng(PLACE_MAP_DEFAULT_CENTER.lat, PLACE_MAP_DEFAULT_CENTER.lng));
  placeSearchMap.setLevel(PLACE_MAP_DEFAULT_LEVEL);
}

function createPlaceSearchMap(container) {
  placeSearchMap = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(PLACE_MAP_DEFAULT_CENTER.lat, PLACE_MAP_DEFAULT_CENTER.lng),
    level: PLACE_MAP_DEFAULT_LEVEL,
    scrollwheel: false,
    draggable: false,
  });

  if (placeSearchMap.setZoomable) {
    placeSearchMap.setZoomable(true);
  }

  bindPlaceSearchMapWheel(container);
  bindPlaceSearchMapDrag(container);
  renderPlaceSearchMarkers();
  relayoutPlaceSearchMap();
}

function initPlaceSearchMap() {
  var container = document.getElementById('place-search-map');
  if (!container) return;

  bindPlaceSearchMapWheel(container);
  bindPlaceSearchMapDrag(container);

  if (window.location.protocol === 'file:') {
    showMapLoadError(
      container,
      '지도는 HTML 파일 더블클릭으로 열 수 없습니다.<br>터미널에서 <strong>npm start</strong> 실행 후<br><strong>http://localhost:5500</strong> 으로 접속해 주세요.'
    );
    return;
  }

  if (!window.kakao || !window.kakao.maps) {
    showMapLoadError(
      container,
      '카카오 지도 SDK를 불러오지 못했습니다.<br>페이지를 새로고침하거나 네트워크 연결을 확인해 주세요.'
    );
    return;
  }

  kakao.maps.load(function () {
    if (!placeSearchMap) {
      createPlaceSearchMap(container);
    } else if (placeSearchMap.setZoomable) {
      placeSearchMap.setZoomable(true);
    }

    var selectedPlace = getSelectedPlace();
    if (selectedPlace) {
      movePlaceSearchMapToPlace(selectedPlace);
    } else {
      resetPlaceSearchMapView();
    }

    renderPlaceSearchMarkers();
    relayoutPlaceSearchMap();
  });
}

function refreshPlaceSearchMap() {
  if (!placeSearchMap) return;

  var selectedPlace = getSelectedPlace();
  if (selectedPlace) {
    movePlaceSearchMapToPlace(selectedPlace);
  }

  renderPlaceSearchMarkers();
  relayoutPlaceSearchMap();
}
