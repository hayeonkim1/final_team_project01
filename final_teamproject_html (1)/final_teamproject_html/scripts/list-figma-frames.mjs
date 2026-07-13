import WebSocket from 'ws';
import crypto from 'crypto';

const CHANNEL = process.env.FIGMA_CHANNEL || 'm61b0jay';

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error('timeout')), 60000);
    const handler = (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === 'progress_update') return;
      const msg = data.message || data;
      if (msg.id !== id) return;
      clearTimeout(timer);
      ws.off('message', handler);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result ?? msg);
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
  const next = [...path, name];
  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    out.push({ id: node.id, name, path: next.join(' > ') });
  }
  (node.children || []).forEach((c) => findFrames(c, out, next));
  return out;
}

const ws = new WebSocket('ws://localhost:3055');
await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
await new Promise((r) => setTimeout(r, 1000));

const doc = await sendCommand(ws, 'get_document_info', {});
console.log('doc keys:', Object.keys(doc || {}));
const pages = doc?.pages || doc?.children || [];
const all = [];
for (const p of pages) findFrames(p, all);

const filter = process.argv[2];
const list = filter
  ? all.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()) || f.path.toLowerCase().includes(filter.toLowerCase()))
  : all;

for (const f of list) console.log(f.id, '|', f.name, '|', f.path);
console.error('shown:', list.length, '/ total frames:', all.length);
ws.close();
