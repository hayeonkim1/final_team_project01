import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CHANNEL = process.env.FIGMA_CHANNEL || 'eztgbzio';

const nodeId = process.argv[2];
const outFile = process.argv[3];
const scale = Number(process.argv[4] || 2);

if (!nodeId || !outFile) {
  console.error('Usage: node export-one-screen.mjs <nodeId> <filename> [scale]');
  process.exit(1);
}

function extractImage(payload) {
  const img =
    payload?.image ||
    payload?.imageData ||
    payload?.result?.image ||
    payload?.result?.imageData ||
    payload?.data;
  if (!img || typeof img !== 'string') return null;
  return img.replace(/^data:image\/\w+;base64,/, '');
}

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    console.log('send', command, nodeId, 'id=', id.slice(0, 8));
    const timer = setTimeout(() => {
      ws.off('message', handler);
      reject(new Error(`Timeout after 120s: ${command} ${nodeId}`));
    }, 120000);

    const handler = (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (data.type === 'progress_update') return;

      const msg = data.message ?? data;
      const img = extractImage(msg);
      const matches = msg.id === id || (img && !msg.error);

      if (!matches) return;

      clearTimeout(timer);
      ws.off('message', handler);

      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else if (img) resolve(img);
      else resolve(msg.result ?? msg);
    };

    ws.on('message', handler);
    ws.send(JSON.stringify({
      id,
      type: 'message',
      channel: CHANNEL,
      message: { id, command, params },
    }));
  });
}

const ws = new WebSocket('ws://localhost:3055');
ws.on('error', (e) => {
  console.error('ws error', e.message);
  process.exit(1);
});

await new Promise((resolve, reject) => {
  ws.once('open', resolve);
  ws.once('error', reject);
});

console.log('connected, joining', CHANNEL);
ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
await new Promise((r) => setTimeout(r, 1500));

const outPath = path.join(ROOT, 'assets', 'screens', outFile);
const res = await sendCommand(ws, 'export_node_as_image', {
  nodeId,
  format: 'PNG',
  scale,
});

const b64 = typeof res === 'string' ? res : extractImage(res);
if (!b64) throw new Error('No image in response');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
console.log('saved', outPath, fs.statSync(outPath).size, 'bytes');
ws.close();
