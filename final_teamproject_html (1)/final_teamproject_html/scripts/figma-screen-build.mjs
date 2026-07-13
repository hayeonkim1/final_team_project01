/**
 * Figma frame PNG export + transparent hotspot prototype builder.
 * Usage: node scripts/figma-screen-build.mjs
 *        node scripts/figma-screen-build.mjs --skip-export
 */
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'scripts', 'figma-data');
const SCREENS_DIR = path.join(ROOT, 'assets', 'screens');
const CHANNEL = process.env.FIGMA_CHANNEL || 'eztgbzio';
const SKIP_EXPORT = process.argv.includes('--skip-export');
const EXPORT_SCALE = 2;

const FRAME_LIST = [
  { id: '334:5709', name: '1_home' },
  { id: '334:5673', name: '1-02_explain' },
  { id: '334:5581', name: '1-03_situation' },
  { id: '334:5416', name: '1-04_search_place01' },
  { id: '334:5307', name: '1-06_cabinet_select' },
  { id: '334:5249', name: '1-07_service_select' },
  { id: '334:5191', name: '1-07_service_select_01' },
  { id: '334:5133', name: '1-07_service_select_02' },
  { id: '334:5059', name: '1-08_address' },
  { id: '334:4948', name: '1-09_lending_service_select' },
  { id: '334:4850', name: '1-10_store_price' },
  { id: '334:4813', name: '1-11' },
  { id: '334:4753', name: '2-menu' },
  { id: '334:4716', name: '2-01_product_upload01' },
  { id: '334:4631', name: '2-02_product_upload02' },
  { id: '334:4585', name: '2-03_product_upload03' },
  { id: '334:4495', name: '2-04_lending_info' },
  { id: '334:4458', name: '2-05_lending_complete' },
  { id: '334:3948', name: '3-01_borrow_select_전체' },
  { id: '334:4050', name: '3-01_borrow_select_소형가전' },
  { id: '334:4152', name: '3-01_borrow_select_소형가구' },
  { id: '334:4254', name: '3-01_borrow_select_계절용품' },
  { id: '334:4356', name: '3-01_borrow_select_생활용품' },
  { id: '334:3234', name: '3-02_borrow_detail01' },
  { id: '334:3183', name: '3-02_borrow_detail02' },
  { id: '334:3132', name: '3-02_borrow_detail03' },
  { id: '334:3081', name: '3-02_borrow_detail04' },
  { id: '334:3030', name: '3-02_borrow_detail05' },
  { id: '334:2979', name: '3-02_borrow_detail06' },
  { id: '334:2928', name: '3-02_borrow_detail07' },
  { id: '334:2877', name: '3-02_borrow_detail08' },
  { id: '334:2826', name: '3-02_borrow_detail09' },
  { id: '334:2777', name: '3-02_borrow_detail10' },
  { id: '334:2731', name: '3-02_borrow_detail11' },
  { id: '334:3285', name: '3-02_borrow_detail12' },
  { id: '334:3336', name: '3-02_borrow_detail13' },
  { id: '334:3387', name: '3-02_borrow_detail14' },
  { id: '334:3438', name: '3-02_borrow_detail15' },
  { id: '334:3489', name: '3-02_borrow_detail16' },
  { id: '334:3540', name: '3-02_borrow_detail17' },
  { id: '334:3591', name: '3-02_borrow_detail18' },
  { id: '334:3642', name: '3-02_borrow_detail19' },
  { id: '334:3693', name: '3-02_borrow_detail20' },
  { id: '334:3744', name: '3-02_borrow_detail21' },
  { id: '334:3795', name: '3-02_borrow_detail22' },
  { id: '334:3846', name: '3-02_borrow_detail23' },
  { id: '334:3897', name: '3-02_borrow_detail24' },
  { id: '334:2603', name: '3-03_borrow_price' },
  { id: '334:2694', name: '3-03' },
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

function screenSlug(name) {
  return name
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^\w가-힣_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function relBox(frameBox, nodeBox) {
  if (!frameBox || !nodeBox) return null;
  return {
    x: Math.round((nodeBox.x - frameBox.x) * 100) / 100,
    y: Math.round((nodeBox.y - frameBox.y) * 100) / 100,
    w: Math.round(nodeBox.width * 100) / 100,
    h: Math.round(nodeBox.height * 100) / 100,
  };
}

function walkNodes(node, frameBox, out) {
  if (!node || node.visible === false) return;
  if (node.absoluteBoundingBox) {
    out[node.id] = { box: relBox(frameBox, node.absoluteBoundingBox), name: node.name || '' };
  }
  (node.children || []).forEach((c) => walkNodes(c, frameBox, out));
}

function parseReaction(reactions) {
  const r = reactions?.[0];
  if (!r) return null;
  const action = r.action || r.actions?.[0];
  if (!action) return null;
  if (action.type === 'BACK') return { type: 'back' };
  if (action.type === 'NODE' && action.destinationId) {
    return { type: 'navigate', destinationId: action.destinationId };
  }
  return null;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

async function main() {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'css'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });

  const framesPath = path.join(DATA_DIR, 'frames.json');
  let rawFrames = [];
  if (fs.existsSync(framesPath)) {
    rawFrames = JSON.parse(fs.readFileSync(framesPath, 'utf8'));
  }

  const ws = new WebSocket('ws://localhost:3055');
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
  await new Promise((r) => setTimeout(r, 800));

  const frameMeta = {};
  const nodeIndex = {};

  for (const f of FRAME_LIST) {
    let doc = rawFrames.find((x) => (x.nodeId || x.document?.id) === f.id)?.document;
    if (!doc?.absoluteBoundingBox) {
      const res = await sendCommand(ws, 'get_nodes_info', { nodeIds: [f.id] });
      const item = Array.isArray(res) ? res[0] : res;
      doc = item?.document || item;
      await new Promise((r) => setTimeout(r, 200));
    }
    const fb = doc.absoluteBoundingBox;
    const slug = screenSlug(f.name);
    frameMeta[f.id] = {
      id: f.id,
      name: f.name,
      slug,
      width: fb.width,
      height: fb.height,
      png: `${slug}.png`,
    };
    walkNodes(doc, fb, nodeIndex);
  }

  const reactionsRaw = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'reactions-merged.json'), 'utf8')
  );
  const figmaToSlug = Object.fromEntries(FRAME_LIST.map((f) => [f.id, screenSlug(f.name)]));

  const hotspotsByFrame = {};
  for (const f of FRAME_LIST) hotspotsByFrame[f.id] = [];

  for (const rn of reactionsRaw.nodes || []) {
    const parsed = parseReaction(rn.reactions);
    if (!parsed) continue;

    const nodeInfo = nodeIndex[rn.id];
    if (!nodeInfo?.box || nodeInfo.box.w <= 0 || nodeInfo.box.h <= 0) continue;

    const pathParts = (rn.path || '').split(' > ');
    const frameName = pathParts[1];
    const frameEntry = FRAME_LIST.find((x) => x.name === frameName);
    if (!frameEntry) continue;

    const hs = {
      nodeId: rn.id,
      name: rn.name,
      box: nodeInfo.box,
    };
    if (parsed.type === 'back') {
      hs.action = 'back';
    } else {
      hs.target = figmaToSlug[parsed.destinationId];
      if (!hs.target) continue;
    }
    hotspotsByFrame[frameEntry.id].push(hs);
  }

  if (!SKIP_EXPORT) {
    console.log(`Exporting ${FRAME_LIST.length} frame PNGs at ${EXPORT_SCALE}x...`);
    let done = 0;
    for (const f of FRAME_LIST) {
      const meta = frameMeta[f.id];
      const outPath = path.join(SCREENS_DIR, meta.png);
      if (fs.existsSync(outPath)) {
        done++;
        continue;
      }
      try {
        const res = await sendCommand(ws, 'export_node_as_image', {
          nodeId: f.id,
          format: 'PNG',
          scale: EXPORT_SCALE,
        });
        const data = res.image || res.imageData || res.data;
        if (!data) throw new Error('no image data');
        const buf = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.writeFileSync(outPath, buf);
        done++;
        console.log(`  [${done}/${FRAME_LIST.length}] ${meta.png}`);
      } catch (e) {
        console.warn(`  FAIL ${meta.png}: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`Exported ${done}/${FRAME_LIST.length} screens`);
  }

  ws.close();

  const cssRules = [];
  const htmlSections = [];
  const defaultW = 402;
  const defaultH = 874;
  let maxH = defaultH;

  for (const f of FRAME_LIST) {
    const meta = frameMeta[f.id];
    maxH = Math.max(maxH, meta.height);
    cssRules.push(
      `.screen[data-screen="${meta.slug}"]{width:${meta.width}px;height:${meta.height}px;background-image:url("../assets/screens/${meta.png}");background-size:${meta.width}px ${meta.height}px;}`
    );

    const hotspots = hotspotsByFrame[f.id];
    const buttons = hotspots.map((hs) => {
      const { x, y, w, h } = hs.box;
      const label = escapeAttr(hs.name || 'button');
      if (hs.action === 'back') {
        return `    <button class="hotspot" data-action="back" aria-label="${label}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;"></button>`;
      }
      return `    <button class="hotspot" data-target="${hs.target}" aria-label="${label}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;"></button>`;
    }).join('\n');

    const active = f.id === '334:5709' ? ' active' : '';
    htmlSections.push(
      `  <section class="screen${active}" data-screen="${meta.slug}" data-figma-id="${f.id}" data-figma-name="${escapeAttr(f.name)}" data-height="${meta.height}">\n${buttons}\n  </section>`
    );
  }

  const baseCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: #f0f0f0;
  font-family: Inter, sans-serif;
}

#app {
  width: ${defaultW}px;
  height: ${defaultH}px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background: #fff;
}

#app.tall {
  height: ${maxH}px;
  overflow-y: auto;
}

.screen {
  display: none;
  width: ${defaultW}px;
  height: ${defaultH}px;
  position: absolute;
  left: 0;
  top: 0;
  background-repeat: no-repeat;
  background-position: left top;
}

.screen.active {
  display: block;
}

.hotspot {
  position: absolute;
  display: block;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  z-index: 10;
}

.hotspot:focus {
  outline: none;
}
`;

  fs.writeFileSync(path.join(ROOT, 'css', 'style.css'), baseCss + cssRules.join('\n'));

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=402, initial-scale=1.0">
  <title>짐토리 — truncated — final_teamproject 3 jw</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main id="app">
${htmlSections.join('\n')}
  </main>
  <script src="js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(ROOT, 'index.html'), html.replace('짐토리 truncated', '짐토리'));

  const appJs = `/**
 * Figma prototype — frame PNG + transparent hotspots
 * Final_project_prototype / final_teamproject 3 jw
 */
const screenHistory = [];

const FIGMA_TO_SLUG = ${JSON.stringify(figmaToSlug, null, 2)};

function showScreen(screenName, pushHistory = true) {
  const current = document.querySelector('.screen.active');
  if (current && pushHistory) {
    screenHistory.push(current.dataset.screen);
  }
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.querySelector(\`[data-screen="\${screenName}"]\`);
  if (!target) {
    console.error('Screen not found:', screenName);
    return;
  }
  target.classList.add('active');
  const app = document.getElementById('app');
  const h = parseInt(target.dataset.height || '874', 10);
  if (h > 874) app.classList.add('tall');
  else app.classList.remove('tall');
}

function goBack() {
  const previous = screenHistory.pop();
  if (!previous) return;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.querySelector(\`[data-screen="\${previous}"]\`);
  if (target) {
    target.classList.add('active');
    const app = document.getElementById('app');
    const h = parseInt(target.dataset.height || '874', 10);
    if (h > 874) app.classList.add('tall');
    else app.classList.remove('tall');
  }
}

document.addEventListener('click', (event) => {
  const hotspot = event.target.closest('.hotspot');
  if (!hotspot) return;
  const action = hotspot.dataset.action;
  const target = hotspot.dataset.target;
  if (action === 'back') {
    goBack();
    return;
  }
  if (target) showScreen(target);
});

document.addEventListener('DOMContentLoaded', () => {
  showScreen('${screenSlug('1_home')}', false);
});
`;

  fs.writeFileSync(path.join(ROOT, 'js', 'app.js'), appJs);

  fs.writeFileSync(
    path.join(DATA_DIR, 'screen-build-meta.json'),
    JSON.stringify({ frameMeta, hotspotCounts: Object.fromEntries(
      FRAME_LIST.map((f) => [f.name, hotspotsByFrame[f.id].length])
    ) }, null, 2)
  );

  const totalHs = FRAME_LIST.reduce((n, f) => n + hotspotsByFrame[f.id].length, 0);
  console.log(`Build complete: ${FRAME_LIST.length} screens, ${totalHs} hotspots`);
}

main().catch(console.error);
