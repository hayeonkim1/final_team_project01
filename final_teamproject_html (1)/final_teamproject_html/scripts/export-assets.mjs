/**
 * Export Figma nodes via cursor-talk-to-figma WebSocket (port 3055).
 */
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CHANNEL = '00lz54pv';

const ASSETS = [
  { nodeId: '334:5745', file: 'assets/images/logo.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5714', file: 'assets/images/home_hero.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4049', file: 'assets/images/jimtory_character.png', format: 'PNG', scale: 2 },
  { nodeId: '334:2730', file: 'assets/images/borrow_complete_character.png', format: 'PNG', scale: 2 },
  { nodeId: '334:5721', file: 'assets/icons/btn_storage_icon.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5732', file: 'assets/icons/btn_browse_icon.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5754', file: 'assets/icons/feature_security.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5763', file: 'assets/icons/feature_flexible.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5776', file: 'assets/icons/feature_service.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5788', file: 'assets/icons/nav_home.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5792', file: 'assets/icons/nav_storage.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5796', file: 'assets/icons/nav_reservation.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5800', file: 'assets/icons/nav_borrow.png', format: 'PNG', scale: 3 },
  { nodeId: '334:5804', file: 'assets/icons/nav_mypage.png', format: 'PNG', scale: 3 },
  { nodeId: '334:4045', file: 'assets/icons/back.svg', format: 'SVG', scale: 1 },
  { nodeId: '334:4038', file: 'assets/images/product_monitor.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4039', file: 'assets/images/product_fan.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4040', file: 'assets/images/product_chair.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4041', file: 'assets/images/product_carrier.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4042', file: 'assets/images/product_lamp.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4043', file: 'assets/images/product_table.png', format: 'PNG', scale: 2 },
  { nodeId: '334:5718', file: 'assets/images/btn_storage.png', format: 'PNG', scale: 2 },
  { nodeId: '334:5728', file: 'assets/images/btn_browse.png', format: 'PNG', scale: 2 },
  { nodeId: '334:5682', file: 'assets/images/explain_photo.png', format: 'PNG', scale: 2 },
  { nodeId: '334:5688', file: 'assets/images/explain_center.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4780', file: 'assets/images/menu_lend_product.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4792', file: 'assets/images/menu_borrow_product.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4849', file: 'assets/images/storage_complete_character.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4811', file: 'assets/images/menu_borrow_illust.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4799', file: 'assets/images/menu_lend_illust.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4812', file: 'assets/images/menu_character.png', format: 'PNG', scale: 2 },
  { nodeId: '334:4049', file: 'assets/images/jimtory_character.png', format: 'PNG', scale: 2 },
];

function sendCommand(ws, command, params) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => reject(new Error(`Timeout: ${command}`)), 45000);

    const handler = (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const msg = data.message || data;
        if (msg.id === id) {
          clearTimeout(timer);
          ws.off('message', handler);
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.result || msg);
        }
      } catch (_) { /* ignore */ }
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

async function main() {
  const ws = new WebSocket('ws://localhost:3055');
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

  ws.send(JSON.stringify({ type: 'join', channel: CHANNEL }));
  await new Promise((r) => setTimeout(r, 800));

  for (const asset of ASSETS) {
    try {
      const res = await sendCommand(ws, 'export_node_as_image', {
        nodeId: asset.nodeId,
        format: asset.format,
        scale: asset.scale,
      });

      const data = res.image || res.imageData || res.data;
      if (!data) {
        console.warn(`No image data for ${asset.file}`, JSON.stringify(res).slice(0, 200));
        continue;
      }

      const buf = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const outPath = path.join(ROOT, asset.file);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buf);
      console.log(`OK ${asset.file} (${buf.length} bytes)`);
    } catch (e) {
      console.error(`FAIL ${asset.file}: ${e.message}`);
    }
  }

  ws.close();
  console.log('Export complete.');
}

main().catch(console.error);
