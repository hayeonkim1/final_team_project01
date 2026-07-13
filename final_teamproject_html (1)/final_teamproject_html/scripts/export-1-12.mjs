import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CHANNEL = process.env.FIGMA_CHANNEL || 'msmv9i6w';

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error('Timeout')), 180000);
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

const res = await sendCommand(ws, 'export_node_as_image', {
  nodeId: '437:2134', format: 'PNG', scale: 2,
});
const data = res.image || res.imageData || res.data;
const out = path.join(ROOT, 'assets', 'screens', '1_12.png');
fs.writeFileSync(out, Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
console.log('exported', out, fs.statSync(out).size);
ws.close();
