/**
 * Parse Figma node JSON and extract relative positions for a frame.
 * Usage: node scripts/parse-figma.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = process.argv[2] || path.join(__dirname, '../../.cursor/projects/c-Users-ccc-Popcorn-Project-Prototype/agent-tools/f9a4dd5f-bd91-42d3-85f0-fc094bc51a4c.txt');

const raw = fs.readFileSync(input, 'utf8');
const nodes = JSON.parse(raw);

function rel(frame, node) {
  const fb = frame.absoluteBoundingBox;
  const nb = node.absoluteBoundingBox;
  if (!fb || !nb) return null;
  return {
    x: Math.round((nb.x - fb.x) * 100) / 100,
    y: Math.round((nb.y - fb.y) * 100) / 100,
    w: Math.round(nb.width * 100) / 100,
    h: Math.round(nb.height * 100) / 100,
  };
}

function walk(node, frame, depth = 0, out = []) {
  if (!node) return out;
  const r = rel(frame, node);
  const entry = {
    id: node.id,
    name: node.name,
    type: node.type,
    depth,
    ...r,
    characters: node.characters || null,
    fill: node.fills?.find((f) => f.type === 'SOLID')?.color || null,
    cornerRadius: node.cornerRadius ?? null,
    fontSize: node.style?.fontSize ?? null,
    fontWeight: node.style?.fontWeight ?? null,
    lineHeight: node.style?.lineHeightPx ?? null,
  };
  if (r && (node.characters || node.type === 'RECTANGLE' || node.type === 'FRAME' && depth < 3)) {
    out.push(entry);
  }
  (node.children || []).forEach((c) => walk(c, frame, depth + 1, out));
  return out;
}

for (const frame of nodes) {
  console.log(`\n=== ${frame.name} (${frame.id}) ===`);
  console.log(`size: ${frame.absoluteBoundingBox.width}x${frame.absoluteBoundingBox.height}`);
  const bg = frame.fills?.find((f) => f.type === 'SOLID');
  if (bg) console.log(`bg: ${bg.color}`);
  const items = walk(frame, frame).slice(0, 40);
  items.forEach((i) => {
    if (i.characters) {
      console.log(`  [${i.type}] "${i.characters}" @ ${i.x},${i.y} ${i.w}x${i.h} fs:${i.fontSize} fw:${i.fontWeight}`);
    } else if (i.type === 'RECTANGLE' && i.w > 50) {
      console.log(`  [${i.type}] ${i.name} @ ${i.x},${i.y} ${i.w}x${i.h} r:${i.cornerRadius}`);
    }
  });
}
