import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const reactions = JSON.parse(fs.readFileSync(path.join(root, 'figma-data/reactions-merged.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(root, 'figma-data/screen-build-meta.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, '../index.html'), 'utf8');
const idToSlug = Object.fromEntries(Object.entries(meta.frameMeta).map(([id, m]) => [id, m.slug]));

const missingNav = [];
const backNodes = [];

for (const n of reactions.nodes) {
  if (!n.hasReactions) continue;
  const pathStr = n.path || '';
  if (/Rectangle \d/.test(pathStr) && pathStr.includes('borrow_select')) continue;
  if (n.name === 'Frame 107') continue;

  for (const r of n.reactions) {
    const act = r.action || r.actions?.[0];
    if (!act) continue;

    if (act.type === 'BACK') {
      backNodes.push({ id: n.id, name: n.name, path: pathStr });
      continue;
    }

    const dest = act.destinationId;
    const slug = dest ? idToSlug[dest] : null;
    if (!slug) continue;

    const hasFigmaId = html.includes(`data-figma-id="${n.id}"`);
    const hasTargetNear = html.includes(`data-target="${slug}"`);
    const sectionHas = html.includes(`data-screen="${slug}"`);
    if (!sectionHas) continue;
    if (!hasFigmaId && !hasTargetNear) {
      missingNav.push({ id: n.id, name: n.name, dest: slug, path: pathStr });
    }
  }
}

console.log('=== Missing NAVIGATE (heuristic) ===');
missingNav.forEach((m) => console.log(`${m.name} (${m.id}) -> ${m.dest}\n  ${m.path}`));
console.log('count', missingNav.length);

console.log('\n=== BACK nodes in Figma ===');
console.log('count', backNodes.length);
