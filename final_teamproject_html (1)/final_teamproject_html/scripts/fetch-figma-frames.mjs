import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANNEL = process.env.FIGMA_CHANNEL || '00lz54pv';

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error(`Timeout: ${command}`)), 120000);
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

function findFrames(node, out = [], path = []) {
  if (!node) return out;
  const name = node.name || '';
  const nextPath = [...path, name];
  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    out.push({ id: node.id, name, path: nextPath.join(' > ') });
  }
  (node.children || []).forEach((c) => findFrames(c, out, nextPath));
  return out;
}

const ws = new WebSocket('ws://localhost:3055');
await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
await new Promise((r) => setTimeout(r, 1500));

const doc = await sendCommand(ws, 'get_document_info', {});
const pages = doc?.pages || doc?.children || [];
const allFrames = [];
for (const page of pages) {
  findFrames(page, allFrames);
}

const targets = [
  '1-02_explain', '1-03_situation', '1-04_search_place01',
  'membership_popup', 'membership_popup_finish',
];

const matched = allFrames.filter((f) =>
  targets.some((t) => f.name === t || f.name.includes(t))
);

console.log(JSON.stringify({ matched, pageCount: pages.length }, null, 2));

const nodeIds = matched.map((f) => f.id);
if (nodeIds.length) {
  const reactions = await sendCommand(ws, 'get_reactions', { nodeIds });
  fs.writeFileSync(
    path.join(__dirname, 'figma-data', 'membership-reactions-temp.json'),
    JSON.stringify(reactions, null, 2),
  );
  console.log('reactions saved for', nodeIds.length, 'nodes');
}

ws.close();
