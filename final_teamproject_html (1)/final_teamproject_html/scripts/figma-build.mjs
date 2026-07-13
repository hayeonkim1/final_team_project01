/**
 * Fetch Figma frames via WebSocket, export assets, generate HTML/CSS from node trees.
 * Usage:
 *   node scripts/figma-build.mjs           # fetch + build + export
 *   node scripts/figma-build.mjs --offline # build from cached frames.json only
 */
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'scripts', 'figma-data');
const CHANNEL = '00lz54pv';
const OFFLINE = process.argv.includes('--offline');
const SKIP_EXPORT = process.argv.includes('--skip-export');

const ALL_FRAME_IDS = [
  '334:5709', '334:5673', '334:5581', '334:5416', '334:5307',
  '334:5249', '334:5191', '334:5133', '334:5059', '334:4948',
  '334:4850', '334:4813', '334:4753', '334:4716', '334:4631',
  '334:4585', '334:4495', '334:4458',
  '334:3948', '334:4050', '334:4152', '334:4254', '334:4356',
  '334:3234', '334:3183', '334:3132', '334:3081', '334:3030',
  '334:2979', '334:2928', '334:2877', '334:2826', '334:2777',
  '334:2731', '334:3285', '334:3336', '334:3387', '334:3438',
  '334:3489', '334:3540', '334:3591', '334:3642', '334:3693',
  '334:3744', '334:3795', '334:3846', '334:3897',
  '334:2603', '334:2694',
];

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error(`Timeout: ${command}`)), 180000);
    const handler = (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'progress_update') return;
        const msg = data.message || data;
        if (msg.id !== id) return;
        clearTimeout(timer);
        ws.off('message', handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result ?? msg);
      } catch (_) {}
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({
      id, type: 'message', channel: CHANNEL,
      message: { id, command, params },
    }));
  });
}

function unwrapFrame(item) {
  if (item?.document) return item.document;
  return item;
}

function slug(name) {
  return name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function screenId(name, frameId) {
  const map = {
    '1_home': 'home',
    '1-02_explain': 'explain',
    '1-03_explain': 'explain',
    '1-03_situation': 'situation',
    '1-04_search_place01': 'search-place',
    '1-06_cabinet_select': 'cabinet-select',
    '1-07_service_select': 'service-select',
    '1-07_service_select_01': 'service-select-pickup',
    '1-07_service_select_02': 'service-select-delivery',
    '1-08_address': 'address',
    '1-09_lending_service_select': 'lending-service-select',
    '1-10_store_price': 'store-price',
    '1-11': 'storage-complete',
    '2-menu': 'menu',
    '2-01_product_upload01': 'product-upload-01',
    '2-02_product_upload02': 'product-upload-02',
    '2-03_product_upload03': 'product-upload-03',
    '2-04_lending_info': 'lending-info',
    '2-05_lending_complete': 'lending-complete',
    '3-01_borrow_select_전체': 'borrow-select-all',
    '3-01_borrow_select_소형가전': 'borrow-select-appliance',
    '3-01_borrow_select_소형가구': 'borrow-select-furniture',
    '3-01_borrow_select_계절용품': 'borrow-select-seasonal',
    '3-01_borrow_select_생활용품': 'borrow-select-living',
    '3-03_borrow_price': 'borrow-price',
    '3-03': 'borrow-complete',
  };
  if (map[name]) return map[name];
  if (name.startsWith('3-02_borrow_detail')) {
    return `borrow-detail-${frameId.replace(':', '-')}`;
  }
  return slug(name);
}

function relBox(frame, node) {
  const fb = frame.absoluteBoundingBox;
  const nb = node.absoluteBoundingBox;
  if (!fb || !nb) return null;
  return {
    x: Math.round((nb.x - fb.x) * 100) / 100,
    y: Math.round((nb.y - fb.y) * 100) / 100,
    w: Math.round(nb.width * 100) / 100,
    h: Math.round(nb.height * 100) / 100,
  };
}

function parseColor(c) {
  if (!c) return null;
  if (typeof c === 'string') return c;
  if (c.r != null) {
    const R = Math.round(c.r * 255);
    const G = Math.round(c.g * 255);
    const B = Math.round(c.b * 255);
    const a = c.a ?? 1;
    if (a < 1) return `rgba(${R},${G},${B},${a.toFixed(3)})`;
    return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
  }
  return null;
}

function solidColor(fills) {
  if (!fills?.length) return null;
  const f = fills.find((x) => x.type === 'SOLID' && x.visible !== false);
  if (!f) return null;
  return parseColor(f.color);
}

function hasImageFill(fills) {
  return fills?.some((f) => f.type === 'IMAGE' && f.visible !== false);
}

function strokeCss(strokes, weight = 1) {
  if (!strokes?.length) return '';
  const s = strokes.find((x) => x.type === 'SOLID');
  const c = parseColor(s?.color);
  if (!c) return '';
  return `border:${weight}px solid ${c};`;
}

function shadowCss(effects) {
  if (!effects?.length) return '';
  const sh = effects.filter((e) => e.type === 'DROP_SHADOW' && e.visible !== false);
  if (!sh.length) return '';
  return sh.map((e) => {
    const c = parseColor(e.color) || 'rgba(0,0,0,0.25)';
    return `${e.offset?.x || 0}px ${e.offset?.y || 0}px ${e.radius || 0}px ${e.spread || 0}px ${c}`;
  }).join(', ');
}

function radiusCss(node) {
  if (typeof node.cornerRadius === 'number' && node.cornerRadius) {
    return `border-radius:${node.cornerRadius}px;`;
  }
  const r = node.rectangleCornerRadii;
  if (r?.length === 4) {
    return `border-radius:${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px;`;
  }
  return '';
}

function textStyle(s) {
  if (!s) return '';
  const parts = [];
  if (s.fontFamily) parts.push(`font-family:'${s.fontFamily}',sans-serif`);
  const weight = s.fontWeight || (s.fontStyle === 'Bold' ? 700 : s.fontStyle === 'Medium' ? 500 : 400);
  parts.push(`font-weight:${weight}`);
  if (s.fontSize) parts.push(`font-size:${s.fontSize}px`);
  if (s.lineHeightPx) parts.push(`line-height:${s.lineHeightPx}px`);
  if (s.letterSpacing) parts.push(`letter-spacing:${s.letterSpacing}px`);
  const ta = s.textAlignHorizontal?.toLowerCase();
  if (ta) parts.push(`text-align:${ta}`);
  return parts.join(';');
}

function assetPath(nodeId, name, isSvg = false) {
  const safe = slug(name || nodeId.replace(':', '-'));
  const sub = isSvg ? 'icons' : 'images';
  return `assets/${sub}/${safe}_${nodeId.replace(':', '-')}.${isSvg ? 'svg' : 'png'}`;
}

const exportQueue = new Map();
const cssRules = new Set();
const renderedNodeIds = new Set();
const reactionsMap = {};

function exportIdFor(node) {
  const id = node.id || '';
  if (id.includes(';')) {
    const m = id.match(/I(\d+:\d+)/);
    if (m) return m[1];
  }
  return id;
}

function queueExport(node, name, format = 'PNG', scale = 2) {
  const nodeId = typeof node === 'string' ? node : exportIdFor(node);
  const nodeName = typeof node === 'string' ? name : (name || node.name);
  const file = assetPath(nodeId, nodeName, format === 'SVG');
  if (!exportQueue.has(nodeId)) exportQueue.set(nodeId, { nodeId, file, format, scale });
  return file;
}

function addCss(cls, styles) {
  cssRules.add(`.${cls}{${styles.join(';')}}`);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hasVisual(node) {
  if (node.type === 'TEXT') return true;
  if (hasImageFill(node.fills)) return true;
  if (solidColor(node.fills)) return true;
  if (node.strokes?.length && (node.strokeWeight || 0) > 0) return true;
  if (['VECTOR', 'BOOLEAN_OPERATION', 'ELLIPSE', 'STAR', 'LINE', 'REGULAR_POLYGON'].includes(node.type)) return true;
  if (node.type === 'INSTANCE' && !node.children?.length) return true;
  return false;
}

function isPassthrough(node) {
  if (node.type === 'GROUP') return true;
  if (node.type === 'INSTANCE' && node.children?.length) return false;
  if ((node.type === 'FRAME' || node.type === 'INSTANCE') && !hasVisual(node) && node.children?.length) {
    const layout = node.layoutMode;
    if (layout === 'HORIZONTAL' || layout === 'VERTICAL') return false;
    return true;
  }
  return false;
}

function navAttr(nodeId) {
  const r = reactionsMap[nodeId];
  if (!r) return '';
  if (r.type === 'BACK') return ' data-nav="BACK"';
  if (r.destinationId) return ` data-nav-target="${r.destinationId}"`;
  return '';
}

function renderLeaf(node, frame) {
  const box = relBox(frame, node);
  if (!box || box.w <= 0 || box.h <= 0) return '';

  const cls = `el-${node.id.replace(':', '-')}`;
  const styles = [
    'position:absolute',
    `left:${box.x}px`,
    `top:${box.y}px`,
    `width:${box.w}px`,
    `height:${box.h}px`,
  ];

  const bg = solidColor(node.fills);
  if (bg && !hasImageFill(node.fills) && node.type !== 'TEXT') styles.push(`background:${bg}`);
  const rad = radiusCss(node);
  if (rad) styles.push(rad.replace(';', ''));
  const sw = node.strokeWeight || (node.strokes?.length ? 1 : 0);
  if (sw && node.strokes?.length) styles.push(strokeCss(node.strokes, sw).replace(';', ''));
  const sh = shadowCss(node.effects);
  if (sh) styles.push(`box-shadow:${sh}`);
  if (node.opacity != null && node.opacity < 1) styles.push(`opacity:${node.opacity}`);

  addCss(cls, styles);
  renderedNodeIds.add(node.id);
  const nav = navAttr(node.id);

  if (node.type === 'INSTANCE') {
    const src = queueExport(node, node.name, 'PNG', 2);
    addCss(cls, ['object-fit:cover', 'pointer-events:none']);
    const clickCls = nav ? ' clickable' : '';
    return `<img class="${cls}${clickCls}" data-figma-id="${node.id}" src="${src}" alt="" width="${box.w}" height="${box.h}"${nav}>`;
  }

  if (node.type === 'TEXT' && node.characters != null) {
    const ts = textStyle(node.style);
    const tc = solidColor(node.fills) || '#000';
    addCss(cls, [`${ts}`, `color:${tc}`, 'display:flex', 'align-items:flex-start', 'overflow:hidden', 'white-space:pre-wrap', 'pointer-events:none']);
    return `<div class="${cls}" data-figma-id="${node.id}">${escapeHtml(node.characters)}</div>`;
  }

  if (hasImageFill(node.fills)) {
    const src = queueExport(node, node.name, 'PNG', 2);
    addCss(cls, ['object-fit:cover', 'pointer-events:none']);
    return `<img class="${cls}" data-figma-id="${node.id}" src="${src}" alt="" width="${box.w}" height="${box.h}">`;
  }

  if (['VECTOR', 'BOOLEAN_OPERATION', 'ELLIPSE', 'STAR', 'LINE', 'REGULAR_POLYGON'].includes(node.type) ||
      (node.type === 'INSTANCE' && !node.children?.length)) {
    const fmt = box.w <= 80 && box.h <= 80 ? 'SVG' : 'PNG';
    const src = queueExport(node, node.name, fmt, fmt === 'SVG' ? 1 : 2);
    addCss(cls, ['object-fit:contain', 'pointer-events:none']);
    return `<img class="${cls}" data-figma-id="${node.id}" src="${src}" alt="" width="${box.w}" height="${box.h}">`;
  }

  const clickCls = nav ? ' clickable' : '';
  if (nav) addCss(cls, [...styles.map(() => null).filter(Boolean), 'cursor:pointer'].filter(Boolean));

  return `<div class="${cls}${clickCls}" data-figma-id="${node.id}"${nav}></div>`;
}

function renderAutoLayout(node, frame) {
  const box = relBox(frame, node);
  if (!box || box.w <= 0 || box.h <= 0) return '';

  const cls = `el-${node.id.replace(':', '-')}`;
  const styles = [
    'position:absolute',
    `left:${box.x}px`,
    `top:${box.y}px`,
    `width:${box.w}px`,
    `height:${box.h}px`,
    'display:flex',
    `flex-direction:${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'}`,
    `gap:${node.itemSpacing || 0}px`,
    `padding:${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`,
    'box-sizing:border-box',
  ];

  const alignMap = { MIN: 'flex-start', MAX: 'flex-end', CENTER: 'center', BASELINE: 'baseline' };
  const justifyMap = { MIN: 'flex-start', MAX: 'flex-end', CENTER: 'center', SPACE_BETWEEN: 'space-between' };
  styles.push(`align-items:${alignMap[node.counterAxisAlignItems] || 'flex-start'}`);
  styles.push(`justify-content:${justifyMap[node.primaryAxisAlignItems] || 'flex-start'}`);

  const bg = solidColor(node.fills);
  if (bg) styles.push(`background:${bg}`);
  const rad = radiusCss(node);
  if (rad) styles.push(rad.replace(';', ''));
  const sh = shadowCss(node.effects);
  if (sh) styles.push(`box-shadow:${sh}`);

  addCss(cls, styles);
  renderedNodeIds.add(node.id);

  const kids = (node.children || []).map((c) => renderNode(c, frame, node)).join('');
  const nav = navAttr(node.id);
  return `<div class="${cls}${nav ? ' clickable' : ''}" data-figma-id="${node.id}"${nav}>${kids}</div>`;
}

function renderNodeRelative(node, parent) {
  if (!node || node.visible === false) return '';
  const pb = parent.absoluteBoundingBox;
  const nb = node.absoluteBoundingBox;
  if (!pb || !nb) return '';

  const box = {
    x: Math.round((nb.x - pb.x) * 100) / 100,
    y: Math.round((nb.y - pb.y) * 100) / 100,
    w: Math.round(nb.width * 100) / 100,
    h: Math.round(nb.height * 100) / 100,
  };
  if (box.w <= 0 || box.h <= 0) return '';

  const cls = `el-${node.id.replace(':', '-')}`;
  if (node.type === 'TEXT' && node.characters != null) {
    const ts = textStyle(node.style);
    const tc = solidColor(node.fills) || '#000';
    addCss(cls, [
      `width:${box.w}px`, `min-height:${box.h}px`, 'flex-shrink:0',
      ts, `color:${tc}`, 'white-space:pre-wrap',
    ]);
    renderedNodeIds.add(node.id);
    return `<div class="${cls}" data-figma-id="${node.id}">${escapeHtml(node.characters)}</div>`;
  }

  if (hasImageFill(node.fills)) {
    const src = queueExport(node, node.name, 'PNG', 2);
    addCss(cls, [`width:${box.w}px`, `height:${box.h}px`, 'flex-shrink:0', 'object-fit:cover']);
    renderedNodeIds.add(node.id);
    return `<img class="${cls}" data-figma-id="${node.id}" src="${src}" alt="" width="${box.w}" height="${box.h}">`;
  }

  return renderNode(node, parent, null, true);
}

function renderNode(node, frame, flexParent = null, forceFlat = false) {
  if (!node || node.visible === false) return '';

  if (!forceFlat && !flexParent && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') && hasVisual(node)) {
    return renderAutoLayout(node, frame);
  }

  if (isPassthrough(node)) {
    return (node.children || []).map((c) => renderNode(c, frame, flexParent)).join('');
  }

  if (node.type === 'INSTANCE' && node.children?.length) {
    return renderLeaf(node, frame);
  }

  if (flexParent && !forceFlat) {
    return renderNodeRelative(node, flexParent);
  }

  if (hasVisual(node)) {
    if (hasImageFill(node.fills) || node.type === 'TEXT' || !node.children?.length) {
      return renderLeaf(node, frame);
    }
  }

  if (node.children?.length) {
    const kids = node.children.map((c) => renderNode(c, frame, flexParent)).join('');
    if (kids.trim()) {
      if (hasVisual(node)) {
        const leaf = renderLeaf(node, frame);
        return leaf.replace('></div>', `>${kids}</div>`).replace('/>', `>${kids}</div>`);
      }
      return kids;
    }
  }

  if (hasVisual(node) || node.type === 'RECTANGLE') {
    return renderLeaf(node, frame);
  }

  return '';
}

function renderClickOverlay(node, frame) {
  const box = relBox(frame, node);
  if (!box || box.w <= 0 || box.h <= 0) return '';
  if (renderedNodeIds.has(node.id)) return '';

  const nav = navAttr(node.id);
  if (!nav) return '';

  const cls = `hit-${node.id.replace(':', '-')}`;
  addCss(cls, [
    'position:absolute', `left:${box.x}px`, `top:${box.y}px`,
    `width:${box.w}px`, `height:${box.h}px`,
    'background:transparent', 'cursor:pointer', 'z-index:9999',
  ]);
  return `<div class="${cls} clickable" data-figma-id="${node.id}"${nav} aria-label="${escapeHtml(node.name || 'button')}"></div>`;
}

function collectReactionNodes(node, frame, out = []) {
  if (!node || node.visible === false) return out;
  if (reactionsMap[node.id]) out.push(node);
  (node.children || []).forEach((c) => collectReactionNodes(c, frame, out));
  return out;
}

function buildScreen(frame) {
  const fb = frame.absoluteBoundingBox;
  if (!fb) {
    console.warn(`Skip frame ${frame.name}: no bounding box`);
    return '';
  }
  const fw = fb.width;
  const fh = fb.height;
  const sid = screenId(frame.name, frame.id);
  const bg = solidColor(frame.fills) || '#ffffff';

  addCss(`screen-${sid.replace(/[^a-z0-9-]/gi, '-')}`, []);

  const body = (frame.children || []).map((c) => renderNode(c, frame)).join('\n');
  const overlays = collectReactionNodes(frame, frame)
    .map((n) => renderClickOverlay(n, frame))
    .join('\n');

  cssRules.add(`.screen[data-screen="${sid}"]{width:${fw}px;min-height:${fh}px;height:${fh}px;background:${bg};position:relative;overflow:${fh > 874 ? 'auto' : 'hidden'};}`);

  return `    <section class="screen" data-screen="${sid}" data-figma-id="${frame.id}" data-figma-name="${escapeHtml(frame.name)}">\n${body}\n${overlays}\n    </section>`;
}

function parseReactions(raw) {
  const nodes = raw?.nodes || (Array.isArray(raw) ? raw : []);
  if (!Array.isArray(nodes)) return;
  for (const n of nodes) {
    const reaction = n.reactions?.[0];
    if (!reaction) continue;
    const action = reaction.action || reaction.actions?.[0];
    if (!action) continue;
    if (action.type === 'BACK') {
      reactionsMap[n.id] = { type: 'BACK' };
    } else if (action.destinationId) {
      reactionsMap[n.id] = { type: 'NODE', destinationId: action.destinationId };
    }
  }
}

function generateAppJs(frameIdToScreen) {
  return `/**
 * Figma prototype navigation — generated from get_reactions
 */
const FIGMA_TO_SCREEN = ${JSON.stringify(frameIdToScreen, null, 2)};

const REACTIONS = ${JSON.stringify(reactionsMap, null, 2)};

const state = { navStack: ['home'] };

function figmaIdToScreen(figmaId) {
  return FIGMA_TO_SCREEN[figmaId] || null;
}

function showScreen(screenName, options = {}) {
  const { pushStack = true } = options;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.querySelector(\`[data-screen="\${screenName}"]\`);
  if (!target) {
    console.warn('Screen not found:', screenName);
    return;
  }
  target.classList.add('active');
  if (pushStack) {
    const last = state.navStack[state.navStack.length - 1];
    if (last !== screenName) state.navStack.push(screenName);
  }
}

function goBack() {
  if (state.navStack.length > 1) {
    state.navStack.pop();
    showScreen(state.navStack[state.navStack.length - 1], { pushStack: false });
  } else {
    showScreen('home', { pushStack: false });
  }
}

function handleNav(nodeId) {
  const reaction = REACTIONS[nodeId];
  if (!reaction) return;
  if (reaction.type === 'BACK') {
    goBack();
    return;
  }
  if (reaction.destinationId) {
    const screen = figmaIdToScreen(reaction.destinationId);
    if (screen) showScreen(screen);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app')?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-nav-target], [data-nav], [data-figma-id].clickable');
    if (!el) return;
    if (el.dataset.navTarget) {
      const screen = figmaIdToScreen(el.dataset.navTarget);
      if (screen) showScreen(screen);
      return;
    }
    if (el.dataset.nav === 'BACK') {
      goBack();
      return;
    }
    const fid = el.dataset.figmaId;
    if (fid && REACTIONS[fid]) handleNav(fid);
  });

  showScreen('home', { pushStack: false });
});
`;
}

async function fetchFrames(ws) {
  const cachedPath = path.join(DATA_DIR, 'frames.json');
  let existing = [];
  if (fs.existsSync(cachedPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
    } catch (_) {}
  }
  const existingIds = new Set(existing.map((x) => x.nodeId || x.id));
  const missing = ALL_FRAME_IDS.filter((id) => !existingIds.has(id));

  if (OFFLINE) {
    return existing.map(unwrapFrame);
  }

  const allItems = [...existing];
  const toFetch = missing.length ? missing : ALL_FRAME_IDS.filter((id) => !existingIds.has(id));

  if (toFetch.length === 0 && existing.length >= ALL_FRAME_IDS.length) {
    console.log(`Using cached ${existing.length} frames`);
    return existing.map(unwrapFrame);
  }

  const idsToFetch = toFetch.length ? toFetch : ALL_FRAME_IDS;
  const batchSize = 2;
  for (let i = 0; i < idsToFetch.length; i += batchSize) {
    const batch = idsToFetch.slice(i, i + batchSize);
    console.log(`Fetching nodes ${i + 1}-${Math.min(i + batch.length, idsToFetch.length)}/${idsToFetch.length}...`);
    const res = await sendCommand(ws, 'get_nodes_info', { nodeIds: batch });
    const nodes = Array.isArray(res) ? res : res.nodes || [res];
    for (const n of nodes) {
      const id = n.nodeId || n.document?.id || n.id;
      const idx = allItems.findIndex((x) => (x.nodeId || x.id) === id);
      if (idx >= 0) allItems[idx] = n;
      else allItems.push(n);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(cachedPath, JSON.stringify(allItems, null, 2));
  console.log(`Saved ${allItems.length} frames to figma-data/frames.json`);
  return allItems.map(unwrapFrame);
}

async function fetchReactions(ws) {
  const reactionsPath = path.join(DATA_DIR, 'reactions-raw.json');
  const mergedPath = path.join(DATA_DIR, 'reactions-merged.json');

  if (fs.existsSync(mergedPath)) {
    parseReactions(JSON.parse(fs.readFileSync(mergedPath, 'utf8')));
    console.log(`Loaded ${Object.keys(reactionsMap).length} reactions from cache`);
    return;
  }

  if (OFFLINE) {
    if (fs.existsSync(reactionsPath)) parseReactions(JSON.parse(fs.readFileSync(reactionsPath, 'utf8')));
    return;
  }

  const allNodes = [];
  const batchSize = 8;
  Object.keys(reactionsMap).forEach((k) => delete reactionsMap[k]);
  try {
    for (let i = 0; i < ALL_FRAME_IDS.length; i += batchSize) {
      const batch = ALL_FRAME_IDS.slice(i, i + batchSize);
      console.log(`Fetching reactions ${i + 1}-${i + batch.length}/${ALL_FRAME_IDS.length}...`);
      const res = await sendCommand(ws, 'get_reactions', { nodeIds: batch });
      const nodes = res?.nodes || [];
      if (Array.isArray(nodes)) allNodes.push(...nodes);
      await new Promise((r) => setTimeout(r, 300));
    }
    const merged = { nodes: allNodes };
    fs.writeFileSync(mergedPath, JSON.stringify(merged, null, 2));
    parseReactions(merged);
    console.log(`Loaded ${Object.keys(reactionsMap).length} reactions`);
  } catch (e) {
    console.warn('Reactions fetch failed:', e.message);
    if (fs.existsSync(mergedPath)) parseReactions(JSON.parse(fs.readFileSync(mergedPath, 'utf8')));
  }
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'css'), { recursive: true });

  let ws = null;
  if (!OFFLINE) {
    ws = new WebSocket('ws://localhost:3055');
    await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
    ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
    await new Promise((r) => setTimeout(r, 800));
  }

  const allFrames = await fetchFrames(ws);
  await fetchReactions(ws);

  cssRules.clear();
  exportQueue.clear();
  renderedNodeIds.clear();

  const frameIdToScreen = {};
  const htmlSections = [];

  for (const frame of allFrames) {
    if (!frame?.absoluteBoundingBox) continue;
    const sid = screenId(frame.name, frame.id);
    frameIdToScreen[frame.id] = sid;
    htmlSections.push(buildScreen(frame));
  }

  if (ws && exportQueue.size > 0 && !SKIP_EXPORT) {
    console.log(`Exporting ${exportQueue.size} assets...`);
    let exported = 0;
    let failed = 0;
    for (const [, asset] of exportQueue) {
      const outPath = path.join(ROOT, asset.file);
      if (fs.existsSync(outPath)) {
        exported++;
        continue;
      }
      try {
        const res = await sendCommand(ws, 'export_node_as_image', {
          nodeId: asset.nodeId,
          format: asset.format,
          scale: asset.scale,
        });
        const data = res.image || res.imageData || res.data;
        if (!data) { failed++; continue; }
        const buf = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, buf);
        exported++;
        if (exported % 20 === 0) console.log(`  exported ${exported}/${exportQueue.size}`);
      } catch (e) {
        failed++;
        if (failed <= 5) console.warn(`Export fail ${asset.file}: ${e.message}`);
      }
    }
    console.log(`Exported ${exported}/${exportQueue.size} assets (${failed} failed)`);
    ws.close();
  } else if (OFFLINE) {
    console.log(`Offline mode: skipping export of ${exportQueue.size} assets`);
  }

  const baseCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:#e8e8e8;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
#app{display:flex;justify-content:center;align-items:flex-start;min-height:100vh;padding:16px 0}
.screen{display:none;position:relative;flex-shrink:0}
.screen.active{display:block}
.clickable,[data-nav-target],[data-nav="BACK"]{cursor:pointer}
.el img,.screen img{display:block;width:100%;height:100%}
`;

  fs.writeFileSync(path.join(ROOT, 'css', 'style.css'), baseCss + [...cssRules].join('\n'));

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=402, initial-scale=1.0">
  <title>짐토리 — final_teamproject 3 jw</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main id="app">
${htmlSections.join('\n')}
  </main>
  <script src="js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
  fs.writeFileSync(path.join(ROOT, 'js', 'app.js'), generateAppJs(frameIdToScreen));
  fs.writeFileSync(path.join(DATA_DIR, 'export-manifest.json'), JSON.stringify([...exportQueue.values()], null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'frame-map.json'), JSON.stringify(frameIdToScreen, null, 2));

  console.log(`Build complete: ${htmlSections.length} screens, ${cssRules.size} CSS rules`);
}

main().catch(console.error);
