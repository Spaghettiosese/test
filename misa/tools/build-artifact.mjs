// Builds the single-file artifact: esbuild bundle + every character/outfit sheet inlined as a data URI.
//   node tools/build-artifact.mjs [out=dist/misa.html]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const out = process.argv[2] || `${root}dist/misa.html`;
mkdirSync(dirname(out), { recursive: true });
const tmp = `${root}dist/.bundle.js`;
execSync(`npx --yes esbuild src/main.js --bundle --format=iife --minify --outfile=${tmp}`, { cwd: root, stdio: 'inherit' });

// enumerate the images the game will ask for (same keys as src/main.js)
await import(`${root}src/content/index.js`);
const { all } = await import(`${root}src/core/registry.js`);
const images = { misa_sheet: 'assets/moonkai/misa_sheet.png', misa_portraits: 'assets/moonkai/misa_portraits.png' };
for (const n of all('npc')) { images[`cast_${n.id}`] = `assets/cast/${n.id}.png`; images[`cast_${n.id}_portraits`] = `assets/cast/${n.id}_portraits.png`; }
for (const im of all('image')) images[im.id] = im.src;
const sheets = {};
let bytes = 0;
for (const [k, p] of Object.entries(images)) {
  if (!existsSync(root + p)) continue;
  const b = readFileSync(root + p); bytes += b.length;
  sheets[k] = 'data:image/png;base64,' + b.toString('base64');
}
const js = readFileSync(tmp, 'utf8').replace(/<\/script/g, '<\\/script');
const html = `<title>Misa's Little Life</title>
<style>
  :root{--bg:#1c1428;--fg:#f6e9d8;--muted:#b9a6c4;--accent:#f0a1a8;color-scheme:dark}
  html,body{height:100%}
  body{background:var(--bg);color:var(--fg);font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;padding-inline:16px;padding-block:8px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;overflow:hidden}
  canvas{image-rendering:pixelated;image-rendering:crisp-edges;background:#000;touch-action:none;outline:none;max-width:100%;box-shadow:0 0 0 3px #3a2a4a}
  canvas:focus-visible{box-shadow:0 0 0 3px var(--accent)}
  p{margin:0;color:var(--muted);text-align:center;min-width:0}
  b{color:var(--fg);font-weight:600}
</style>
<canvas id="game" width="320" height="224" tabindex="0" aria-label="Misa's Little Life game"></canvas>
<p id="hint"><b>WASD</b> move · <b>E</b> interact · <b>Tab</b> phone · <b>Shift</b> run · click the game first</p>
<script>window.MOONKAI_SHEETS=${JSON.stringify(sheets)};</script>
<script>${js}</script>
`;
writeFileSync(out, html);
console.log(`wrote ${out}: ${(html.length / 1024).toFixed(0)} KB (${Object.keys(sheets).length} sheets, ${(bytes / 1024).toFixed(0)} KB of PNG)`);
