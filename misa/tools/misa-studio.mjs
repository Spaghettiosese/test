// Paints Misa by hand-scripting the Moonkai Pixel Studio canvas (no Character-builder preset):
// every pixel goes through the Studio's own tools (pencil / line / rect / ellipse) on its anime layers
// (Flats, Shading, Highlights, Line Art), one drawing per frame.
//   MOONKAI_DIR=/path/to/moonkai node tools/misa-studio.mjs
// Writes assets/moonkai/misa_sheet.png (11 cols x 3 rows of 40x48), misa_portraits.png (4x4 of 64x64: rows =
// neutral/happy/surprised/sleepy, cols = mouth closed/open x blink off/on), misa.json and the two .pxs.json
// projects (open them in the Studio's Open dialog to edit her).
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const dir = process.env.MOONKAI_DIR || `${process.env.HOME}/spaghettiosese/moonkai`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`file://${dir}/pixel/index.html`);
await page.waitForFunction(() => typeof beginStroke === 'function' && typeof newDoc === 'function');

const result = await page.evaluate(() => {
  const W = 40, H = 48, IDLE = 5, WALK = 6, PER = IDLE + WALK, DIRS = ['down', 'up', 'side'];
  const ink = '#2a1a22';
  const C = { hair: '#8b5a44', hairH: '#b98262', hairD: '#5a3a2e', pink: '#f0a0b8', skin: '#f8d5b8', skin2: '#e3a98a', navy: '#3d5a8c', navy2: '#2c4270', navyL: '#5f80b4', pants: '#2a3552', pants2: '#1f2840', shoe: '#f4f4f8', sole: '#8a90a8', iris: '#b0703c', blush: '#f5a0a8', mouth: '#b04a55', cream: '#fff1d6', white: '#ffffff', pale: '#ffe8d0' };

  // Let the Studio's real tools run without repainting its UI after every stroke.
  autosave = () => {}; renderLayers = () => {}; renderFrames = () => {}; req = () => {}; pushUndo = () => {}; addRecent = () => {};
  newDoc(W, H, { layers: 'anime' });
  doc.frames = DIRS.length * PER; doc.fps = 10;
  for (const L of doc.layers) L.cels = Array.from({ length: doc.frames }, blank);

  const ev = { button: 0, shiftKey: false, altKey: false };
  const use = (tool, fill = false) => { ui.tool = tool; Object.assign(opt, { size: 1, opacity: 100, pixelPerfect: false, fillShapes: fill, tolerance: 0, contiguous: true }); };
  const stroke = (color, pts) => { ui.primary = hexToRgba(color); beginStroke({ x: pts[0][0], y: pts[0][1] }, ev); for (const p of pts.slice(1)) continueStroke({ x: p[0], y: p[1] }); endStroke(); };
  const layerNamed = (n) => { cur.layer = doc.layers.findIndex((L) => L.name === n); };
  const px = (x, y, c) => { use('pencil'); stroke(c, [[x, y]]); };
  const B = (x0, y0, x1, y1, c) => { use('rect', true); stroke(c, [[x0, y0], [x1, y1]]); };      // filled rectangle tool
  const E = (cx, cy, rx, ry, c) => { use('ellipse', true); stroke(c, [[cx - rx, cy - ry], [cx + rx, cy + ry]]); }; // filled ellipse tool
  const LN = (x0, y0, x1, y1, c) => { use('line'); stroke(c, [[x0, y0], [x1, y1]]); };

  function paint(dir, kind, i) {
    const walk = kind === 'walk', p = walk ? (i / WALK) * Math.PI * 2 : 0, sn = Math.sin(p), cs = Math.cos(p);
    const blink = kind === 'blink';
    const bob = walk ? (Math.abs(sn) < 0.5 ? -1 : 0) : (kind === 'idle' && i === 2 ? 1 : 0);
    const Y = (y) => y + bob;
    const sw = walk ? Math.round(sn * 5) : 0, ad = walk ? Math.round(sn * 3) : 0;
    const lL = walk ? Math.max(0, Math.round(-sn * 2)) : 0, lR = walk ? Math.max(0, Math.round(sn * 2)) : 0;   // front/back lifts
    const nl = walk && cs > 0.3 ? 1 : 0, fl = walk && cs < -0.3 ? 1 : 0;                                          // side lifts
    const aL = walk ? Math.round(sn * 2) : (kind === 'idle' && i === 2 ? 1 : 0), aR = walk ? -aL : aL;

    // ---------- FLATS ----------
    layerNamed('Flats');
    if (dir === 'side') {
      B(15 - sw, 36, 21 - sw, 43 - fl, C.pants2); B(15 - sw, 43 - fl, 24 - sw, 45 - fl, C.shoe); B(15 - sw, 46 - fl, 24 - sw, 46 - fl, C.sole);
      B(14 + ad, Y(26), 18 + ad, Y(35), C.navy2);
      B(18 + sw, 36, 24 + sw, 43 - nl, C.pants); B(18 + sw, 43 - nl, 27 + sw, 45 - nl, C.shoe); B(18 + sw, 46 - nl, 27 + sw, 46 - nl, C.sole);
      B(13, Y(25), 27, Y(37), C.navy);
      B(19, Y(22), 23, Y(25), C.skin2); E(20, Y(25), 6, 3, C.navyL);
      B(18 - ad, Y(26), 23 - ad, Y(35), C.navyL); B(18 - ad, Y(35), 23 - ad, Y(37), C.skin);
      E(17, Y(15), 11, 12, C.hairD); B(7, Y(15), 14, Y(27), C.hairD);
      E(23, Y(15), 9, 8, C.skin); E(25, Y(20), 5, 4, C.skin); B(30, Y(17), 32, Y(19), C.skin);
      E(20, Y(8), 12, 5, C.hair); B(14, Y(11), 31, Y(13), C.hair); B(28, Y(13), 31, Y(15), C.hair); B(11, Y(13), 19, Y(24), C.hair);
    } else {
      B(13, 36, 27, 39, C.pants);
      B(13, 36, 19, 43 - lL, C.pants); B(21, 36, 27, 43 - lR, C.pants2);
      B(12, 43 - lL, 19, 45 - lL, C.shoe); B(12, 46 - lL, 19, 46 - lL, C.sole); B(21, 43 - lR, 28, 45 - lR, C.shoe); B(21, 46 - lR, 28, 46 - lR, C.sole);
      B(8, Y(26) + aL, 11, Y(35) + aL, C.navy); B(8, Y(35) + aL, 11, Y(37) + aL, C.skin);
      B(29, Y(26) + aR, 32, Y(35) + aR, C.navy2); B(29, Y(35) + aR, 32, Y(37) + aR, C.skin2);
      B(18, Y(22), 22, Y(25), C.skin2);
      B(12, Y(25), 28, Y(37), C.navy); E(20, Y(25), 8, 3, C.navyL);
      if (dir === 'down') {
        E(20, Y(15), 13, 13, C.hairD); B(7, Y(15), 12, Y(26), C.hairD); B(28, Y(15), 33, Y(26), C.hairD);
        E(20, Y(15), 10, 8, C.skin); E(20, Y(20), 7, 4, C.skin);
        E(20, Y(8), 12, 5, C.hair); B(10, Y(11), 30, Y(13), C.hair);
        B(10, Y(13), 12, Y(17), C.hair); B(14, Y(13), 17, Y(15), C.hair); B(19, Y(13), 20, Y(14), C.hair); B(22, Y(13), 25, Y(15), C.hair); B(27, Y(13), 30, Y(16), C.hair);
        B(8, Y(13), 10, Y(23), C.hair); B(30, Y(13), 32, Y(23), C.hair);
      } else {
        E(20, Y(15), 13, 13, C.hair); B(7, Y(15), 12, Y(26), C.hair); B(28, Y(15), 33, Y(26), C.hair);
        E(20, Y(27), 8, 4, C.navyL);
      }
    }

    // ---------- SHADING ----------
    layerNamed('Shading');
    if (dir === 'side') {
      B(14, Y(26), 17, Y(36), C.navy2); B(15, Y(21), 22, Y(23), C.skin2); B(8, Y(20), 12, Y(26), C.hairD); B(26, Y(22), 30, Y(22), C.skin2);
      B(19, Y(14), 22, Y(14), C.skin2);
    } else {
      B(24, Y(26), 28, Y(36), C.navy2); B(12, Y(35), 28, Y(36), C.navy2); B(15, Y(31), 25, Y(34), C.navy2);
      B(16, Y(23), 24, Y(24), C.skin2); B(8, Y(20), 11, Y(26), C.hairD); B(29, Y(20), 32, Y(26), C.hairD);
      if (dir === 'down') { B(13, Y(15), 27, Y(15), C.skin2); B(29, Y(15), 29, Y(21), C.skin2); }
      else B(9, Y(21), 31, Y(26), C.hairD);
    }

    // ---------- HIGHLIGHTS ----------
    layerNamed('Highlights');
    LN(13, Y(5), 17, Y(4), C.hairH); LN(18, Y(4), 22, Y(5), C.hairH); B(24, Y(4), 27, Y(4), C.hairH); B(28, Y(5), 29, Y(6), C.hairH);
    B(24, Y(8), 25, Y(dir === 'up' ? 14 : 13), C.pink);
    if (dir === 'side') { B(27, Y(21), 29, Y(22), C.blush); B(15, Y(26), 18, Y(27), C.navyL); }
    else { B(13, Y(26), 16, Y(27), C.navyL); if (dir === 'down') { B(11, Y(21), 13, Y(22), C.blush); B(27, Y(21), 29, Y(22), C.blush); B(18, Y(27), 18, Y(31), C.cream); B(22, Y(27), 22, Y(31), C.cream); } }

    // ---------- LINE ART (eyes, mouth, nose) ----------
    layerNamed('Line Art');
    if (dir === 'down') {
      for (const [x0, fx, dirx] of [[13, 11, -1], [23, 28, 1]]) {
        if (blink) { B(x0 - 1, Y(19), x0 + 4, Y(19), ink); px(fx, Y(18), ink); }
        else {
          B(x0 - 1, Y(16), x0 + 4, Y(16), ink); B(x0, Y(17), x0 + 4, Y(20), ink); B(x0 + 1, Y(17), x0 + 3, Y(20), C.iris); B(x0 + 2, Y(18), x0 + 2, Y(19), ink);
          px(x0 + 1, Y(17), C.white); px(x0 + 3, Y(20), C.pale); px(fx, Y(15), ink); B(x0 + 1, Y(21), x0 + 3, Y(21), '#7a4a3a');
        }
      }
      px(20, Y(20), '#d99a80'); B(19, Y(22), 21, Y(22), C.mouth);
    } else if (dir === 'side') {
      if (blink) { B(24, Y(19), 30, Y(19), ink); px(23, Y(18), ink); }
      else { B(24, Y(16), 30, Y(16), ink); B(25, Y(17), 30, Y(21), ink); B(26, Y(17), 29, Y(21), C.iris); B(28, Y(18), 28, Y(20), ink); px(26, Y(17), C.white); px(29, Y(21), C.pale); px(23, Y(15), ink); }
      px(33, Y(20), C.skin2); B(29, Y(23), 30, Y(23), C.mouth);
    }

    // keep shading/highlights inside the flats silhouette, then outline the whole figure on Line Art
    const f = cur.frame, w = doc.w, h = doc.h, get = (n) => doc.layers.find((L) => L.name === n).cels[f];
    const flats = get('Flats');
    for (const n of ['Shading', 'Highlights']) { const c = get(n); for (let k = 0; k < w * h; k++) if (!flats[k * 4 + 3]) c[k * 4 + 3] = 0; }
    const solid = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return false; const o = (y * w + x) * 4; return flats[o + 3] || get('Line Art')[o + 3]; };
    const edge = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
    for (const [x, y] of edge) px(x, y, ink);
  }

  let f = 0;
  for (const dir of DIRS) {
    for (let i = 0; i < PER; i++, f++) {
      cur.frame = f;
      if (i < 4) paint(dir, 'idle', i); else if (i === 4) paint(dir, 'blink', 0); else paint(dir, 'walk', i - IDLE);
    }
  }
  undoStack.length = 0;

  // export the sheet exactly like the Studio's own sprite-sheet export
  const sheet = document.createElement('canvas'); sheet.width = PER * W; sheet.height = DIRS.length * H;
  const sx = sheet.getContext('2d');
  for (let k = 0; k < doc.frames; k++) sx.putImageData(new ImageData(frameRGBA(k), W, H), (k % PER) * W, ((k / PER) | 0) * H);
  const spritePng = sheet.toDataURL('image/png'), spriteProject = serialize();

  // ---------- PORTRAIT (64x64, faces the viewer): 4 moods x mouth (closed/open) x blink ----------
  const MOODS = ['neutral', 'happy', 'surprised', 'sleepy'];
  newDoc(64, 64, { layers: 'anime' });
  doc.frames = MOODS.length * 4; doc.fps = 4;
  for (const L of doc.layers) L.cels = Array.from({ length: doc.frames }, blank);
  function portrait(mood, mouth, blink) {
    layerNamed('Flats');
    // hair behind the head (a bob that frames the face) and the shoulders
    E(32, 30, 24, 24, C.hairD); B(8, 30, 16, 52, C.hairD); B(48, 30, 56, 52, C.hairD); E(12, 52, 4, 3, C.hairD); E(52, 52, 4, 3, C.hairD);
    E(32, 68, 27, 15, C.navy); B(28, 46, 36, 58, C.skin2); E(32, 58, 14, 5, C.navyL);
    // face: oval with a soft chin
    E(32, 29, 15, 15, C.skin); E(32, 38, 11, 10, C.skin);
    // bangs, side locks and top volume
    E(32, 16, 19, 9, C.hair); B(15, 19, 49, 24, C.hair);
    B(15, 23, 20, 29, C.hair); B(22, 23, 25, 27, C.hair); B(27, 23, 30, 26, C.hair); B(35, 23, 38, 26, C.hair); B(40, 23, 43, 27, C.hair); B(44, 23, 49, 30, C.hair);
    B(12, 20, 17, 50, C.hair); B(47, 20, 52, 50, C.hair);
    layerNamed('Shading');
    B(19, 27, 45, 27, C.skin2); B(24, 46, 40, 48, C.skin2); B(46, 30, 47, 42, C.skin2); B(26, 50, 38, 53, C.skin2);
    B(40, 55, 62, 63, C.navy2); B(12, 40, 16, 52, C.hairD); B(48, 40, 52, 52, C.hairD);
    layerNamed('Highlights');
    LN(18, 12, 25, 9, C.hairH); LN(26, 9, 40, 9, C.hairH); LN(41, 9, 46, 12, C.hairH); B(37, 21, 39, 27, C.pink);
    B(16, 30, 16, 40, C.hairH); B(20, 41, 22, 42, C.blush); B(42, 41, 44, 42, C.blush); B(20, 43, 21, 43, C.blush); B(43, 43, 44, 43, C.blush);
    B(20, 55, 24, 56, C.navyL); B(27, 58, 27, 63, C.cream); B(37, 58, 37, 63, C.cream);
    layerNamed('Line Art');
    for (const [cx, side] of [[24, -1], [40, 1]]) {
      const big = mood === 'surprised' ? 1 : 0;
      if (mood === 'happy') { B(cx - 5, 36, cx - 4, 37, ink); B(cx - 4, 34, cx - 2, 35, ink); B(cx - 1, 33, cx + 1, 33, ink); B(cx + 2, 34, cx + 4, 35, ink); B(cx + 4, 36, cx + 5, 37, ink); }
      else if (blink) { B(cx - 5, 35, cx + 5, 35, ink); px(cx + side * 6, 34, ink); px(cx + side * 6, 33, ink); }
      else {
        E(cx, 34, 5, 6 + big, ink); E(cx, 35, 4, 5 + big, C.iris); E(cx, 37, 3, 3, '#7a4020'); E(cx, 34, big ? 1 : 2, big ? 2 : 3, ink);
        B(cx - 3, 30 - big, cx - 2, 32 - big, C.white); px(cx + 2, 37, C.pale); px(cx + 3, 36, C.pale);
        B(cx - 6, 28 - big, cx + 5, 28 - big, ink); B(cx - 6, 29 - big, cx - 5, 30 - big, ink); px(cx + side * 6, 29 - big, ink); px(cx + side * 7, 28 - big, ink);
        if (mood === 'sleepy') { B(cx - 5, 28, cx + 5, 33, C.skin); B(cx - 6, 34, cx + 6, 34, ink); B(cx - 5, 33, cx + 5, 33, C.skin2); }
      }
      if (mood !== 'surprised') B(cx - 4, 24 + (side > 0 ? 0 : 0), cx + 3, 24, C.hairD);
    }
    px(32, 40, '#d99a80'); px(31, 41, C.skin2);
    const open = mouth === 1;
    if (mood === 'happy') { if (open) { E(32, 45, 4, 3, '#7a2a35'); B(30, 46, 34, 47, '#f08a94'); B(29, 43, 35, 43, C.mouth); } else { px(29, 43, C.mouth); B(30, 44, 34, 44, C.mouth); px(35, 43, C.mouth); } }
    else if (mood === 'surprised') E(32, 45, open ? 3 : 2, open ? 4 : 3, '#7a2a35');
    else if (open) E(32, 44, 2, 2, '#7a2a35');
    else B(30, 44, 34, 44, C.mouth);
    // clip shading/highlights to the flats, then outline the whole figure on Line Art
    const f = cur.frame, w = doc.w, h = doc.h, get = (n) => doc.layers.find((L) => L.name === n).cels[f], flats = get('Flats');
    for (const n of ['Shading', 'Highlights']) { const c = get(n); for (let k = 0; k < w * h; k++) if (!flats[k * 4 + 3]) c[k * 4 + 3] = 0; }
    const solid = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return false; const o = (y * w + x) * 4; return flats[o + 3] || get('Line Art')[o + 3]; };
    const edge = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
    for (const [x, y] of edge) px(x, y, ink);
  }
  MOODS.forEach((mood, mi) => { for (let m = 0; m < 2; m++) for (let bl = 0; bl < 2; bl++) { cur.frame = mi * 4 + m * 2 + bl; portrait(mood, m, bl === 1); } });
  undoStack.length = 0;
  const pc = document.createElement('canvas'); pc.width = 4 * 64; pc.height = MOODS.length * 64;
  const pcx = pc.getContext('2d');
  for (let k = 0; k < doc.frames; k++) pcx.putImageData(new ImageData(frameRGBA(k), 64, 64), (k % 4) * 64, ((k / 4) | 0) * 64);
  return { png: spritePng, project: spriteProject, portraitPng: pc.toDataURL('image/png'), portraitProject: serialize() };
});

mkdirSync(new URL('../assets/moonkai/', import.meta.url), { recursive: true });
writeFileSync(new URL('../assets/moonkai/misa_sheet.png', import.meta.url), Buffer.from(result.png.split(',')[1], 'base64'));
writeFileSync(new URL('../assets/moonkai/misa.pxs.json', import.meta.url), JSON.stringify(result.project));
writeFileSync(new URL('../assets/moonkai/misa_portraits.png', import.meta.url), Buffer.from(result.portraitPng.split(',')[1], 'base64'));
writeFileSync(new URL('../assets/moonkai/misa_portrait.pxs.json', import.meta.url), JSON.stringify(result.portraitProject));
writeFileSync(new URL('../assets/moonkai/misa.json', import.meta.url), JSON.stringify({ size: [40, 48], cols: 11, rows: ['down', 'up', 'side'], idle: [0, 1, 2, 1], blink: 4, walk: [5, 6, 7, 8, 9, 10], feet: [20, 46] }, null, 1) + '\n');
await browser.close();
console.log('painted', result.project.frames, 'frames', errs.length ? errs : '');
