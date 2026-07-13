import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CHANNEL = process.env.FIGMA_CHANNEL || 'eztgbzio';

const missing = [
  { id: '334:2694', file: '3_03.png' },
  { id: '334:2603', file: '3_03_borrow_price.png' },
  { id: '334:3897', file: '3_02_borrow_detail24.png' },
];
const EXPORT_SCALE = 2;

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error('Timeout')), 600000);
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

const ws = new WebSocket('ws://localhost:3055');
await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
await new Promise((r) => setTimeout(r, 800));

for (const m of missing) {
  const out = path.join(ROOT, 'assets', 'screens', m.file);
  if (fs.existsSync(out)) {
    console.log('skip', m.file);
    continue;
  }
  console.log('export', m.file);
  const res = await sendCommand(ws, 'export_node_as_image', {
    nodeId: m.id, format: 'PNG', scale: EXPORT_SCALE,
  });
  const data = res.image || res.imageData || res.data;
  fs.writeFileSync(out, Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
  console.log('ok', m.file);
}

ws.close();
