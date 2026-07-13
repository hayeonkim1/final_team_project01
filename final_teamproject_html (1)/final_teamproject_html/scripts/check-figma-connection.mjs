/**
 * Verify Talk to Figma plugin is connected before running sync.
 * Usage: FIGMA_CHANNEL=<plugin-channel> node scripts/check-figma-connection.mjs
 */
import WebSocket from 'ws';
import crypto from 'crypto';

const CHANNEL = process.env.FIGMA_CHANNEL || '00lz54pv';
const TIMEOUT_MS = 20000;

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
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

const ws = new WebSocket('ws://localhost:3055');
await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
await new Promise((r) => setTimeout(r, 800));

try {
  const doc = await sendCommand(ws, 'get_document_info', {});
  const name = doc?.name || doc?.documentName || '(unknown)';
  console.log('OK: Figma plugin connected on channel', CHANNEL);
  console.log('Document:', name);
  process.exit(0);
} catch {
  console.error('FAIL: Figma plugin is not responding on channel', CHANNEL);
  console.error('');
  console.error('1. Open Figma → final_teamproject 3 jw');
  console.error('2. Plugins → Talk to Figma (Cursor) 실행');
  console.error('3. 플러그인에 표시된 channel 코드를 복사');
  console.error('4. PowerShell: $env:FIGMA_CHANNEL="<코드>"; node scripts/check-figma-connection.mjs');
  console.error('5. 연결 확인 후: node scripts/sync-onboarding-frames.mjs');
  process.exit(1);
} finally {
  ws.close();
}
