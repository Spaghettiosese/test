// Exports every sprite as a PNG (assets/sprites/<name>.png) so it can be opened in
// Moonkai Pixel Studio (or any pixel editor). To replace one in-game, save the edited
// PNG (same size, same name) into assets/override/ - the game loads it automatically.
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { SPRITES, drawSprite } from '../src/art.js';
import { BufferSurface, MirrorSurface } from '../src/surface.js';
import { encodePNG } from './png.mjs';

const out = new URL('../assets/sprites/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, d] of Object.entries(SPRITES)) {
  const buf = new BufferSurface(d.w, d.h);
  drawSprite(name, d.flip ? new MirrorSurface(buf, d.w) : buf);
  writeFileSync(new URL(`${name}.png`, out), encodePNG(d.w, d.h, buf.data));
}
console.log(`exported ${Object.keys(SPRITES).length} sprites to assets/sprites/`);

// Refresh the override manifest from whatever PNGs are in assets/override/.
const ovDir = new URL('../assets/override/', import.meta.url);
mkdirSync(ovDir, { recursive: true });
const names = readdirSync(ovDir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).filter((n) => SPRITES[n]);
writeFileSync(new URL('manifest.json', ovDir), JSON.stringify(names, null, 1) + '\n');
console.log(`override manifest: ${names.length} sprite(s)`);
