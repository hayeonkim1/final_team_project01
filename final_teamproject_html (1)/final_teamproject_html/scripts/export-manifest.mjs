/**
 * Export assets listed in figma-data/export-manifest.json
 */
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CHANNEL = '00lz54pv';

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

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts', 'figma-data', 'export-manifest.json'), 'utf8')
);

const ws = new WebSocket('ws://localhost:3055');
await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
await new Promise((r) => setTimeout(r, 800));

let exported = 0;
let skipped = 0;
let failed = 0;

for (const asset of manifest) {
  const outPath = path.join(ROOT, asset.file);
  if (fs.existsSync(outPath)) {
    skipped++;
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
    if (exported % 25 === 0) console.log(`Exported ${exported}...`);
  } catch (e) {
    failed++;
    if (failed <= 10) console.warn(`Fail ${asset.file}: ${e.message}`);
  }
}

ws.close();
console.log(`Done: ${exported} exported, ${skipped} skipped, ${failed} failed / ${manifest.length} total`);
