// Generates Misa's animation sheets with Moonkai Pixel Studio's Character builder
// (https://github.com/Spaghettiosese/moonkai, pixel/character.js), driven headlessly in Chromium.
//   MOONKAI_DIR=/path/to/moonkai node tools/moonkai-export.mjs
// Needs `playwright` + Chromium. The PNGs it writes (assets/moonkai/*.png) are committed, so this only
// has to run when Misa's look changes.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const dir = process.env.MOONKAI_DIR || `${process.env.HOME}/spaghettiosese/moonkai`;
const MISA = { heads: 3, build: 'normal', frame: 'feminine', hairStyle: 'bob', sleeves: 'long', bottomStyle: 'pants', wings: 'none', headgear: 'none', weapon: 'none', cape: false,
  skin: '#fde0cc', hair: '#8b5a44', eyes: '#a8683a', top: '#3d5a8c', bottom: '#2a3552', boots: '#f4f4f8', accent: '#f0a0b8', outline: '#2a1a22' };
const SHEETS = { misa_sheet: { size: 64, rows: [['idle', 8], ['walk', 12], ['run', 10]] }, misa_big: { size: 128, rows: [['idle', 8], ['walk', 12]] } };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.goto(`file://${dir}/pixel/index.html`);
await page.waitForFunction(() => window.CharacterBuilder);
mkdirSync(new URL('../assets/moonkai/', import.meta.url), { recursive: true });
const meta = {};
for (const [name, sh] of Object.entries(SHEETS)) {
  const url = await page.evaluate(([misa, sh]) => {
    const cols = Math.max(...sh.rows.map((r) => r[1]));
    const c = document.createElement('canvas'); c.width = cols * sh.size; c.height = sh.rows.length * sh.size;
    const g = c.getContext('2d');
    sh.rows.forEach(([anim, n], row) => { for (let i = 0; i < n; i++) {
      const f = window.CharacterBuilder.drawCharacter({ ...misa, size: sh.size }, anim, i);
      const t = document.createElement('canvas'); t.width = f.W; t.height = f.H; t.getContext('2d').putImageData(new ImageData(f.ch, f.W, f.H), 0, 0);
      g.drawImage(t, i * sh.size, row * sh.size);
    } });
    return c.toDataURL('image/png');
  }, [MISA, sh]);
  writeFileSync(new URL(`../assets/moonkai/${name}.png`, import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
  meta[name] = { size: sh.size, rows: Object.fromEntries(sh.rows.map(([a, n], i) => [a, { row: i, frames: n }])) };
}
writeFileSync(new URL('../assets/moonkai/misa.json', import.meta.url), JSON.stringify(meta, null, 1) + '\n');
await browser.close();
console.log('wrote assets/moonkai/*.png', Object.keys(meta).join(', '));
