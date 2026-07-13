/**
 * Sync onboarding frames from live Figma (Talk to Figma plugin on ws://localhost:3055).
 * Usage: FIGMA_CHANNEL=00lz54pv node scripts/sync-onboarding-frames.mjs
 *
 * Updates ONLY: 1-02_explain, 1-03_situation, 1-04_search_place01,
 *               membership_popup, membership_popup_finish
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
const CHANNEL = process.env.FIGMA_CHANNEL || 'm61b0jay';
const EXPORT_SCALE = 2;
const SKIP_EXPORT = process.argv.includes('--skip-export');

const TARGET_NAMES = [
  '1-02_explain',
  '1-03_situation',
  '1-04_search_place01',
  'membership_popup',
  'membership_popup_finish',
];

const KNOWN_IDS = {
  '1-02_explain': '378:3072',
  '1-03_situation': '334:5581',
  '1-04_search_place01': '334:5416',
  'membership_popup': '409:3291',
  'membership_popup_finish': '409:3292',
};

const SLUG_MAP = {
  '1_home': '1_home',
  '1-02_explain': '1_02_explain',
  '1-03_situation': '1_03_situation',
  '1-04_search_place01': '1_04_search_place01',
  'membership_popup': 'membership_popup',
  'membership_popup_finish': 'membership_popup_finish',
  '1-06_cabinet_select': '1_06_cabinet_select',
  '2-menu': '2_menu',
};

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
  return SLUG_MAP[name] || name.replace(/-/g, '_');
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

function findFrames(node, out = [], pathParts = []) {
  if (!node) return out;
  const name = node.name || '';
  const next = [...pathParts, name];
  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    out.push({ id: node.id, name, path: next.join(' > ') });
  }
  (node.children || []).forEach((c) => findFrames(c, out, next));
  return out;
}

function collectDocumentFrames(doc) {
  const out = [];
  const rootName = doc?.name || '';
  (doc?.children || []).forEach((c) => {
    if (c.type === 'FRAME' || c.type === 'COMPONENT') {
      out.push({ id: c.id, name: c.name, path: `${rootName} > ${c.name}` });
    }
  });
  (doc?.pages || []).forEach((p) => findFrames(p, out));
  return out;
}

function parseReaction(reactions) {
  const r = reactions?.[0];
  if (!r) return null;
  const action = r.action || r.actions?.[0];
  if (!action) return null;
  if (action.type === 'BACK') return { type: 'back' };
  if (action.type === 'CLOSE' || action.navigation === 'CLOSE') return { type: 'close' };
  if (action.destinationId && (action.navigation === 'OVERLAY' || action.type === 'OVERLAY')) {
    return { type: 'overlay', destinationId: action.destinationId };
  }
  if (action.type === 'NODE' && action.destinationId) {
    return { type: 'navigate', destinationId: action.destinationId };
  }
  return null;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function extractImage(res) {
  const data = res?.image || res?.imageData || res?.data || res;
  if (typeof data !== 'string') return null;
  return data.replace(/^data:image\/\w+;base64,/, '');
}

/** Preserve custom place-select hotspots on 1_04 */
function customHotspotsFor04() {
  return `    <button class="hotspot place-select-card" data-place-id="01" aria-label="place_select_card_01" style="left:20px;top:502px;width:362px;height:54px;"></button>
    <button class="hotspot place-select-card" data-place-id="02" aria-label="place_select_card_02" style="left:20px;top:564px;width:362px;height:54px;"></button>
    <button class="hotspot place-select-card" data-place-id="03" aria-label="place_select_card_03" style="left:20px;top:626px;width:362px;height:54px;"></button>
    <button class="hotspot place-select-card" data-place-id="04" aria-label="place_select_card_04" style="left:20px;top:688px;width:362px;height:54px;"></button>`;
}

function buildHotspotButton(hs, idToSlug) {
  const { x, y, w, h } = hs.box;
  const label = escapeAttr(hs.name || 'button');
  const style = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  const classes = ['hotspot'];
  if (hs.overlay) classes.push('hotspot--overlay-open');
  if (hs.close) classes.push('hotspot--overlay-close');

  if (hs.action === 'back') {
    return `    <button class="${classes.join(' ')}" data-action="back" aria-label="${label}" style="${style}"></button>`;
  }
  if (hs.type === 'overlay') {
    return `    <button class="${classes.join(' ')}" data-overlay="${hs.target}" aria-label="${label}" style="${style}"></button>`;
  }
  if (hs.type === 'close') {
    return `    <button class="${classes.join(' ')}" data-action="close-overlay" aria-label="${label}" style="${style}"></button>`;
  }
  return `    <button class="${classes.join(' ')}" data-target="${hs.target}" aria-label="${label}" style="${style}"></button>`;
}

function patchIndexSection(html, slug, newSectionHtml) {
  const re = new RegExp(
    `  <section class="screen[^"]*" data-screen="${slug}"[\\s\\S]*?</section>`,
    'm',
  );
  if (!re.test(html)) {
    const insertBefore = '  <section class="screen" data-screen="1_06_cabinet_select"';
    return html.replace(insertBefore, `${newSectionHtml}\n${insertBefore}`);
  }
  return html.replace(re, newSectionHtml);
}

function patchCssRule(css, slug, width, height, png) {
  const rule = `.screen[data-screen="${slug}"]{width:${width}px;height:${height}px;background-image:url("../assets/screens/${png}");background-size:${width}px ${height}px;}`;
  const re = new RegExp(`\\.screen\\[data-screen="${slug}"\\]\\{[^}]+\\}`, 'm');
  if (re.test(css)) return css.replace(re, rule);
  const anchor = '.screen[data-screen="1_06_cabinet_select"]';
  return css.replace(anchor, `${rule}\n${anchor}`);
}

async function main() {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });

  const ws = new WebSocket('ws://localhost:3055');
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Connected to Figma channel:', CHANNEL);

  let doc;
  try {
    doc = await sendCommand(ws, 'get_document_info', {});
  } catch (e) {
    throw new Error(
      `Figma plugin not responding (${e.message}). ` +
      'Open final_teamproject 3 jw in Figma, run Talk to Figma plugin, set FIGMA_CHANNEL to the plugin code, then retry.',
    );
  }
  const allFrames = collectDocumentFrames(doc);
  const idToSlug = { ...SLUG_MAP };
  allFrames.forEach((f) => { idToSlug[f.id] = screenSlug(f.name); });

  const frames = [];
  for (const name of TARGET_NAMES) {
    const found = allFrames.find((f) => f.name === name);
    if (found) {
      frames.push(found);
    } else if (KNOWN_IDS[name]) {
      frames.push({ id: KNOWN_IDS[name], name, path: name });
      console.warn(`Frame not in document tree, using known id: ${name}`);
    } else {
      console.error(`MISSING frame: ${name}`);
    }
  }

  if (frames.length < TARGET_NAMES.length) {
    throw new Error(`Only found ${frames.length}/${TARGET_NAMES.length} frames. Open final_teamproject 3 jw in Figma.`);
  }

  const frameMeta = {};
  const nodeIndexByFrame = {};
  const nodeToFrameSlug = {};

  for (const f of frames) {
    const res = await sendCommand(ws, 'get_nodes_info', { nodeIds: [f.id] });
    const item = Array.isArray(res) ? res[0] : res;
    const docNode = item?.document || item;
    const fb = docNode.absoluteBoundingBox;
    const slug = screenSlug(f.name);
    idToSlug[f.id] = slug;
    frameMeta[f.id] = { id: f.id, name: f.name, slug, width: fb.width, height: fb.height, png: `${slug}.png` };
    nodeIndexByFrame[f.id] = {};
    walkNodes(docNode, fb, nodeIndexByFrame[f.id]);
    nodeToFrameSlug[f.id] = slug;
    Object.keys(nodeIndexByFrame[f.id]).forEach((nodeId) => {
      nodeToFrameSlug[nodeId] = slug;
    });
    await new Promise((r) => setTimeout(r, 200));
  }

  function resolveTarget(destId) {
    return idToSlug[destId] || nodeToFrameSlug[destId] || null;
  }

  const allNodeIds = frames.flatMap((f) => Object.keys(nodeIndexByFrame[f.id]));
  const reactionsRes = await sendCommand(ws, 'get_reactions', { nodeIds: allNodeIds });
  const reactionNodes = Array.isArray(reactionsRes) ? reactionsRes : reactionsRes?.nodes || [];

  const hotspotsByFrame = {};
  const seenHotspots = new Set();
  frames.forEach((f) => { hotspotsByFrame[f.id] = []; });

  for (const rn of reactionNodes) {
    const parsed = parseReaction(rn.reactions);
    if (!parsed) continue;

    const ownerFrame = frames.find((f) => nodeIndexByFrame[f.id][rn.id]);
    if (!ownerFrame) continue;

    const dedupeKey = `${ownerFrame.id}:${rn.id}:${parsed.type || 'nav'}:${parsed.destinationId || ''}`;
    if (seenHotspots.has(dedupeKey)) continue;
    seenHotspots.add(dedupeKey);

    const nodeInfo = nodeIndexByFrame[ownerFrame.id][rn.id];
    if (!nodeInfo?.box || nodeInfo.box.w <= 0 || nodeInfo.box.h <= 0) continue;

    const hs = { nodeId: rn.id, name: rn.name || nodeInfo.name, box: nodeInfo.box };
    if (parsed.type === 'back') {
      hs.action = 'back';
    } else if (parsed.type === 'close') {
      hs.type = 'close';
    } else if (parsed.type === 'overlay') {
      hs.type = 'overlay';
      hs.target = resolveTarget(parsed.destinationId);
      if (!hs.target) continue;
    } else {
      hs.target = resolveTarget(parsed.destinationId);
      if (!hs.target) continue;
    }
    hotspotsByFrame[ownerFrame.id].push(hs);
  }

  if (!SKIP_EXPORT) {
    console.log('Exporting PNGs...');
    for (const f of frames) {
      const meta = frameMeta[f.id];
      const outPath = path.join(SCREENS_DIR, meta.png);
      const res = await sendCommand(ws, 'export_node_as_image', {
        nodeId: f.id,
        format: 'PNG',
        scale: EXPORT_SCALE,
      });
      const b64 = extractImage(res);
      if (!b64) throw new Error(`Export failed: ${meta.png}`);
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
      console.log('  exported', meta.png);
      await new Promise((r) => setTimeout(r, 300));
    }
  } else {
    console.log('Skipping PNG export (--skip-export)');
  }

  if (!SKIP_EXPORT) {
    console.log('Patching orange strokes from exported PNGs...');
    const { patchStrokeOnlyPngs } = await import('./patch-stroke-only.mjs');
    patchStrokeOnlyPngs();
  }

  ws.close();

  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

  for (const f of frames) {
    const meta = frameMeta[f.id];
    const isOverlay = f.name.includes('popup');
    const sectionClass = isOverlay ? 'screen screen--overlay' : 'screen';

    let buttons = hotspotsByFrame[f.id].map((hs) => buildHotspotButton(hs, idToSlug)).join('\n');
    if (f.name === '1-04_search_place01') {
      buttons = `${customHotspotsFor04()}\n${buttons}`;
    }

    const section = `  <section class="${sectionClass}" data-screen="${meta.slug}" data-figma-id="${f.id}" data-figma-name="${escapeAttr(f.name)}" data-height="${meta.height}">\n${buttons}\n  </section>`;
    html = patchIndexSection(html, meta.slug, section);
    css = patchCssRule(css, meta.slug, meta.width, meta.height, meta.png);
  }

  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
  fs.writeFileSync(path.join(ROOT, 'css', 'style.css'), css);

  fs.writeFileSync(
    path.join(DATA_DIR, 'onboarding-sync-result.json'),
    JSON.stringify({ frameMeta, hotspotsByFrame, idToSlug }, null, 2),
  );

  console.log('Done. Updated', frames.map((f) => f.name).join(', '));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
