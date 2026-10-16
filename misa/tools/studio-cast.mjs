// Parametric character painter for Misa's Little Life. Every pixel goes through Moonkai Pixel Studio's own tools
// (pencil / line / rectangle / ellipse on its anime layers Flats, Shading, Highlights, Line Art), driven headlessly,
// so each character also gets a .pxs.json project an artist can open in the Studio and repaint by hand.
//
//   node tools/studio-cast.mjs [id ...]      paint the listed cast members (default: everyone) into assets/cast/
//   MOONKAI_DIR=/path/to/moonkai             where the Studio lives (default ~/spaghettiosese/moonkai)
//
// Outputs per character: assets/cast/<id>.png (11 cols x 3 rows of 48x64: down / up / side-right; idle 0-3, blink 4,
// walk 5-10, feet on the bottom row), <id>_portraits.png (4x4 of 64x64: rows neutral/happy/surprised/sad, columns
// mouth closed/open x blink off/on), <id>.pxs.json, <id>_portrait.pxs.json, and assets/cast/_lineup.png.
// Misa herself (40x48 frames) and her outfit sheets use the same painter: see tools/misa-studio.mjs.
//
// Spec shape (see CAST below): skin, eyes {c, shape}, hair {c, h, style, bangs, a, ...}, body {lg, tr, w, stoop},
// top {style, c, c2, c3, sleeve, collar, front, tie, coat, wide}, bottom {style, c, sock}, shoe {c}, acc [...], face {...}.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------------------------------------------
// The painter. It runs inside the Studio page (page.evaluate), so it must be self-contained.
// ---------------------------------------------------------------------------------------------------------------
function painter(job) {
  const spec = job.spec, FW = job.fw, FH = job.fh, mode = job.mode, ink = '#2a1a22', TAU = Math.PI * 2;
  autosave = () => {}; renderLayers = () => {}; renderFrames = () => {}; req = () => {}; pushUndo = () => {}; addRecent = () => {};
  const ev = { button: 0, shiftKey: false, altKey: false };
  const use = (tool, fill = false) => { ui.tool = tool; Object.assign(opt, { size: 1, opacity: 100, pixelPerfect: false, fillShapes: fill, tolerance: 0, contiguous: true }); };
  const stroke = (color, pts) => { ui.primary = hexToRgba(color); beginStroke({ x: pts[0][0], y: pts[0][1] }, ev); for (const p of pts.slice(1)) continueStroke({ x: p[0], y: p[1] }); endStroke(); };
  const shade = (hex, dir, amt) => { const c = hexToRgba(hex); return toHex(shadeColor(c[0], c[1], c[2], dir, amt, true)); };
  const R3 = (b, a = 12) => ({ b, s: shade(b, -1, a), d: shade(b, -1, a * 1.9), l: shade(b, 1, a), h: shade(b, 1, a * 1.9) });
  const mod = (v, a, b) => Math.max(a, Math.min(b, v));

  const NFR = mode === 'sheet' ? 33 : job.moods.length * 4;
  newDoc(FW, FH, { layers: 'anime' });
  doc.frames = NFR; doc.fps = mode === 'sheet' ? 10 : 4;
  for (const L of doc.layers) L.cels = Array.from({ length: NFR }, blank);
  doc.layers.push(makeLayer('Scratch', { guide: true, opacity: 0.5 }));
  const lIdx = (n) => doc.layers.findIndex((L) => L.name === n);
  const setL = (n) => { cur.layer = lIdx(n); };
  const celOf = (n) => doc.layers[lIdx(n)].cels[cur.frame];

  // ---- shape tools (each is one Studio stroke) ----
  const PX = (x, y, c) => { use('pencil'); stroke(c, [[x, y]]); };
  const BX = (x0, y0, x1, y1, c) => { use('rect', true); stroke(c, [[x0, y0], [x1, y1]]); };
  const EL = (cx, cy, rx, ry, c) => { use('ellipse', true); stroke(c, [[cx - rx, cy - ry], [cx + rx, cy + ry]]); };
  const EO = (cx, cy, rx, ry, c) => { use('ellipse', false); stroke(c, [[cx - rx, cy - ry], [cx + rx, cy + ry]]); };
  const LN = (x0, y0, x1, y1, c) => { use('line'); stroke(c, [[x0, y0], [x1, y1]]); };
  const TRI = (x0, y0, x1, y1, x2, y2, c) => {
    const P = [[x0, y0], [x1, y1], [x2, y2]];
    for (let y = Math.min(y0, y1, y2); y <= Math.max(y0, y1, y2); y++) {
      let xa = 1e9, xb = -1e9;
      for (let i = 0; i < 3; i++) {
        const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 3];
        if (ay === by) { if (ay === y) { xa = Math.min(xa, ax, bx); xb = Math.max(xb, ax, bx); } continue; }
        if (y < Math.min(ay, by) || y > Math.max(ay, by)) continue;
        const x = Math.round(ax + (bx - ax) * (y - ay) / (by - ay)); xa = Math.min(xa, x); xb = Math.max(xb, x);
      }
      if (xa <= xb) BX(xa, y, xb, y, c);
    }
  };
  const QD = (l0, r0, y0, l1, r1, y1, c) => { for (let y = y0; y <= y1; y++) { const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0); BX(Math.round(l0 + (l1 - l0) * t), y, Math.round(r0 + (r1 - r0) * t), y, c); } };
  const drawOp = (o, c) => {
    switch (o[0]) {
      case 'r': BX(o[1], o[2], o[3], o[4], c); break;
      case 'e': EL(o[1], o[2], o[3], o[4], c); break;
      case 'o': EO(o[1], o[2], o[3], o[4], c); break;
      case 'l': LN(o[1], o[2], o[3], o[4], c); break;
      case 'p': PX(o[1], o[2], c); break;
      case 't': TRI(o[1], o[2], o[3], o[4], o[5], o[6], c); break;
      case 'q': QD(o[1], o[2], o[3], o[4], o[5], o[6], c); break;
    }
  };
  // map unit-space ops into pixels: T = { x(u), y(v), s(len) }
  const mapOp = (o, T) => {
    switch (o[0]) {
      case 'r': return ['r', T.x(o[1]), T.y(o[2]), T.x(o[3]), T.y(o[4])];
      case 'e': case 'o': return [o[0], T.x(o[1]), T.y(o[2]), Math.max(1, T.s(o[3])), Math.max(1, T.s(o[4]))];
      case 'l': return ['l', T.x(o[1]), T.y(o[2]), T.x(o[3]), T.y(o[4])];
      case 'p': return ['p', T.x(o[1]), T.y(o[2])];
      case 't': return ['t', T.x(o[1]), T.y(o[2]), T.x(o[3]), T.y(o[4]), T.x(o[5]), T.y(o[6])];
      case 'q': return ['q', T.x(o[1]), T.x(o[2]), T.y(o[3]), T.x(o[4]), T.x(o[5]), T.y(o[6])];
    }
  };

  // ---- parts: paint flats through the tools, then cel-shade the rim (Shading) and top edge (Highlights) ----
  function maskOf(ops) {
    const prev = cur.layer; cur.layer = lIdx('Scratch');
    const c = doc.layers[lIdx('Scratch')].cels[cur.frame]; c.fill(0);
    for (const o of ops) drawOp(o, '#ffffff');
    const m = new Uint8Array(FW * FH); for (let i = 0; i < m.length; i++) m[i] = c[i * 4 + 3] ? 1 : 0;
    c.fill(0); cur.layer = prev; return m;
  }
  function paintMask(m, color, layer) {
    setL(layer);
    for (let y = 0; y < FH; y++) { let x = 0; while (x < FW) { if (!m[y * FW + x]) { x++; continue; } let x1 = x; while (x1 + 1 < FW && m[y * FW + x1 + 1]) x1++; BX(x, y, x1, y, color); x = x1 + 1; } }
  }
  const at = (m, x, y) => x >= 0 && y >= 0 && x < FW && y < FH && m[y * FW + x] === 1;
  function part(ops, ramp, o = {}) {
    const m = maskOf(ops), sh = celOf('Shading'), hi = celOf('Highlights'), ln = celOf('Line Art');
    let x0 = 99999, x1 = -1; for (let i = 0; i < m.length; i++) if (m[i]) { const x = i % FW; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    for (let i = 0; i < m.length; i++) if (m[i]) { sh[i * 4 + 3] = 0; hi[i * 4 + 3] = 0; if (!o.keepLine) ln[i * 4 + 3] = 0; }
    paintMask(m, ramp.b, 'Flats');
    if (o.flat || x1 < 0) return m;
    const tx = o.tx ?? (x1 - x0 < 5 ? 1 : 2), ty = o.ty ?? 1, S = new Uint8Array(m.length), Hh = new Uint8Array(m.length);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      if (!m[y * FW + x]) continue;
      if (!at(m, x + tx, y) || !at(m, x, y + ty)) S[y * FW + x] = 1;
      else if (o.hi && !at(m, x, y - 1) && at(m, x, y + 1) && !at(m, x - 1, y - 1)) Hh[y * FW + x] = 1;
    }
    if (o.hi) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (m[y * FW + x] && !S[y * FW + x] && !at(m, x, y - 1)) Hh[y * FW + x] = 1;
    paintMask(S, ramp.s, 'Shading'); if (o.hi) paintMask(Hh, ramp.l, 'Highlights');
    return m;
  }
  const ink_ = (ops, c) => { setL('Line Art'); for (const o of ops) drawOp(o, c); };
  const onL = (layer, ops, c) => { setL(layer); for (const o of ops) drawOp(o, c); };

  // ---- ramps ----
  const SK = R3(spec.skin, 9);
  const HR = R3(spec.hair.c, 12); if (spec.hair.h) HR.h = spec.hair.h; if (spec.hair.s) HR.s = spec.hair.s; HR.l = spec.hair.l || shade(HR.b, 1, 9);
  const HRd = { b: spec.hair.d || HR.d, s: shade(spec.hair.d || HR.d, -1, 8), l: HR.s };
  const HA = R3(spec.hair.a || '#e87aa0', 12);
  const ramps = { b: HR, d: HRd, a: HA, s: SK };
  const TOP = R3(spec.top.c, 12), C2 = R3(spec.top.c2 || spec.top.c, 10), C3 = R3(spec.top.c3 || spec.top.c, 10), APR = spec.top.apron ? R3(spec.top.apron, 12) : null;
  const BOT = R3(spec.bottom.c, 11), SHOE = R3(spec.shoe.c, 12), SOLE = { b: spec.shoe.sole || shade(spec.shoe.c, -1, 30), s: shade(spec.shoe.sole || shade(spec.shoe.c, -1, 30), -1, 6), l: spec.shoe.c };
  const EY = R3(spec.eyes.c, 14);
  const MOUTH = '#b04a55', BLUSH = spec.face.blush || '#f5a0a8';
  const brow = spec.hair.brow || HRd.b;
  const acc = spec.acc || [];
  const hasAcc = (k) => acc.includes(k) || acc.some((a) => a && a.k === k);
  const accOf = (k) => acc.find((a) => a && a.k === k) || {};

  // ---- hair, in unit space (x from the head centre, y from the face centre; the sprite scale is 1) ----
  const H = spec.hair, hst = H.style;
  const BANGS = {
    clump: ['b', ['t', -10, -3, -4, -3, -8, 0], ['t', -5, -3, 1, -3, -2, -1], ['t', 0, -3, 6, -3, 3, 0], ['t', 5, -3, 10, -3, 8, -1]],
    side: ['b', ['t', -11, -3, 3, -3, -9, 1], ['t', 2, -3, 8, -3, 5, -1], ['t', 6, -3, 11, -3, 9, -1]],
    fringe: ['b', ['r', -10, -3, 10, -1], ['t', -10, -1, -6, -1, -8, 0], ['t', 1, -1, 5, -1, 3, 0]],
    spiky: ['b', ['t', -10, -3, -6, -3, -9, 0], ['t', -7, -3, -2, -3, -5, -1], ['t', -3, -3, 3, -3, 0, 0], ['t', 2, -3, 7, -3, 5, -1], ['t', 6, -3, 10, -3, 9, 0]],
    curl: ['b', ['e', -7, -2, 3, 2], ['e', -2, -2, 3, 2], ['e', 3, -2, 3, 2], ['e', 8, -2, 3, 2]],
    high: ['b'],
  };
  const CAP = ['b', ['e', 0, -7, 12, 5], ['r', -11, -6, 11, -3]];
  const LOCKS = (n) => ['b', ['r', -11, -3, -9, n], ['r', 9, -3, 11, n], ['p', -10, n + 1], ['p', 10, n + 1]];
  const SPK = ['b', ['t', -12, -7, -7, -9, -11, -16], ['t', -8, -9, -2, -10, -5, -17], ['t', -3, -10, 3, -10, 1, -18], ['t', 2, -10, 8, -9, 6, -17], ['t', 7, -9, 12, -7, 11, -16]];
  const bangK = H.bangs || 'clump';
  const SCAP = ['b', ['e', 0, -7, 12, 5], ['r', -10, -6, 11, -3]];
  const SBANG = H.bangs === 'spiky' ? ['b', ['t', 2, -3, 11, -3, 11, 0], ['t', 4, -8, 11, -6, 13, -2]] : H.bangs === 'high' ? ['b'] : ['b', ['t', 2, -3, 11, -3, 10, 0], ['t', -3, -3, 4, -3, 1, -1]];
  const SLOCK = (n) => ['b', ['r', -9, -3, -1, n]];
  function hairDef(dir) {
    const bang = BANGS[bangK] || BANGS.clump;
    const ring = [];
    switch (hst) {
      case 'bob': {
        const n = H.lock || 8;
        return { down: { back: [['d', ['e', 0, 0, 13, 12], ['r', -13, 0, -9, n + 3], ['r', 9, 0, 13, n + 3]]], front: [CAP, bang, LOCKS(n)] },
          up: { back: [['b', ['e', 0, 0, 13, 12], ['r', -13, 0, 13, 11]], ['d', ['r', -9, 8, 9, 11]]], front: [] },
          side: { back: [['d', ['e', -3, 0, 12, 12], ['r', -14, 0, -2, 11]]], front: [SCAP, SBANG, SLOCK(n + 1)] } }[dir];
      }
      case 'long': {
        const n = H.lock || 12, L = H.len || 18;
        return { down: { back: [['d', ['e', 0, 0, 13, 12], ['r', -14, 0, -10, L], ['r', 10, 0, 14, L], ['e', -12, L, 2, 2], ['e', 12, L, 2, 2]]], front: [CAP, bang, LOCKS(n)] },
          up: { back: [['b', ['e', 0, 0, 13, 12], ['r', -13, 0, 13, 16], ['r', -12, 16, 12, 20], ['r', -10, 20, 10, 24], ['r', -6, 24, 6, 26]], ['d', ['r', -9, 8, 9, 11]]], front: [] },
          side: { back: [['d', ['e', -3, 0, 12, 12], ['r', -14, 0, -4, L], ['r', -13, L, -5, L + 4]]], front: [SCAP, SBANG, SLOCK(n)] } }[dir];
      }
      case 'braid': {
        return { down: { back: [['d', ['e', 0, 0, 13, 12], ['r', -13, 0, -9, 10], ['r', 9, 0, 13, 10]]],
            front: [CAP, bang, LOCKS(9), ['b', ['e', 11, 12, 3, 3], ['e', 11, 17, 3, 3], ['e', 11, 22, 3, 3], ['e', 11, 27, 2, 3]], ['a', ['r', 9, 29, 13, 30]]] },
          up: { back: [['b', ['e', 0, 0, 13, 12], ['r', -13, 0, 13, 10]], ['d', ['r', -9, 8, 9, 11]], ['b', ['e', 0, 13, 3, 3], ['e', 0, 18, 3, 3], ['e', 0, 23, 3, 3], ['e', 0, 28, 2, 3]], ['a', ['r', -2, 30, 2, 31]]], front: [] },
          side: { back: [['d', ['e', -3, 0, 12, 12], ['r', -14, 0, -2, 10]], ['b', ['e', -9, 13, 3, 3], ['e', -9, 18, 3, 3], ['e', -10, 23, 3, 3], ['e', -10, 28, 2, 3]], ['a', ['r', -12, 30, -8, 31]]], front: [SCAP, SBANG, SLOCK(8)] } }[dir];
      }
      case 'twin': {
        const tail = (s) => ['b', ['e', s * 15, 5, 4, 6], ['e', s * 15, 12, 4, 6], ['t', s * 19, 14, s * 11, 14, s * 15, 23]];
        const rib = (s) => ['a', ['e', s * 14, -1, 3, 2], ['r', s * 11, -2, s * 17, 0]];
        return { down: { back: [['d', ['e', 0, 0, 13, 12]], tail(-1), tail(1)], front: [CAP, bang, LOCKS(6), rib(-1), rib(1)] },
          up: { back: [['b', ['e', 0, 0, 13, 12], ['r', -13, 0, 13, 7]], ['d', ['r', -9, 5, 9, 8]], tail(-1), tail(1), rib(-1), rib(1)], front: [] },
          side: { back: [['d', ['e', -3, 0, 12, 12]], ['b', ['e', -13, 6, 4, 7], ['e', -14, 14, 4, 7], ['t', -18, 16, -10, 16, -14, 25]]], front: [SCAP, SBANG, SLOCK(5), ['a', ['e', -9, -2, 3, 2], ['r', -12, -3, -6, -1]]] } }[dir];
      }
      case 'ponytail': {
        return { down: { back: [['d', ['e', 0, -1, 12, 11]], ['b', ['e', 13, 2, 3, 5], ['e', 14, 9, 3, 5]]], front: [CAP, bang, LOCKS(3)] },
          up: { back: [['b', ['e', 0, -1, 12, 11]], ['d', ['r', -9, 6, 9, 9]], ['b', ['e', 0, -4, 4, 4], ['e', 0, 3, 4, 6], ['e', 0, 10, 3, 6], ['t', -3, 12, 3, 12, 0, 20]], ['a', ['r', -3, -9, 3, -8]]], front: [] },
          side: { back: [['d', ['e', -3, -1, 11, 11]], ['b', ['e', -12, -3, 4, 4], ['e', -15, 4, 4, 6], ['e', -16, 12, 3, 5]], ['a', ['r', -13, -6, -10, -4]]], front: [SCAP, SBANG, SLOCK(4)] } }[dir];
      }
      case 'short': {
        return { down: { back: [['d', ['e', 0, -1, 12, 11]]], front: [CAP, bang, LOCKS(H.lock || 2)] },
          up: { back: [['b', ['e', 0, -1, 12, 11]], ['d', ['r', -9, 6, 9, 9]]], front: [] },
          side: { back: [['d', ['e', -3, -1, 11, 11], ['r', -13, -1, -4, 6]]], front: [SCAP, SBANG, SLOCK(H.lock || 4)] } }[dir];
      }
      case 'spiky': {
        return { down: { back: [['d', ['e', 0, -1, 12, 11], ['t', -14, -5, -10, -4, -14, 0], ['t', 10, -4, 14, -5, 14, 0]]], front: [CAP, SPK, bang, LOCKS(2)] },
          up: { back: [['b', ['e', 0, -1, 12, 11]], ['d', ['r', -9, 6, 9, 8]], ['b', ['t', -10, 8, -5, 8, -8, 12], ['t', -4, 8, 2, 8, -1, 13], ['t', 2, 8, 8, 8, 5, 12]]], front: [SPK] },
          side: { back: [['d', ['e', -3, -1, 11, 11], ['t', -14, -4, -9, -4, -16, 2], ['t', -13, 0, -8, 0, -14, 6]]], front: [SCAP, ['b', ['t', -10, -8, -5, -9, -12, -16], ['t', -6, -9, 0, -10, -2, -17], ['t', -1, -10, 5, -9, 4, -16]], SBANG, SLOCK(3)] } }[dir];
      }
      case 'messy': {
        const tufts = ['b', ['t', -3, -11, 1, -11, -5, -17], ['t', 4, -10, 10, -8, 13, -14], ['t', -9, -9, -5, -10, -12, -13]];
        return { down: { back: [['d', ['e', 0, -1, 12, 11], ['r', -13, 0, -9, 6], ['r', 9, 0, 13, 4]]], front: [CAP, tufts, bang, ['b', ['r', -11, -3, -9, 6], ['r', 9, -3, 11, 3], ['p', -10, 7]]] },
          up: { back: [['b', ['e', 0, -1, 12, 11], ['r', -12, 0, 12, 8]], ['d', ['r', -9, 6, 9, 9]]], front: [tufts] },
          side: { back: [['d', ['e', -3, -1, 11, 11], ['r', -14, -1, -4, 7]]], front: [SCAP, tufts, SBANG, SLOCK(5)] } }[dir];
      }
      case 'bun': {
        const bun = ['b', ['e', 0, -15, 6, 5]];
        const star = [['a', ['p', 4, -17], ['p', 5, -16], ['p', 4, -15], ['p', 3, -16]]];
        return { down: { back: [['d', ['e', 0, 0, 12, 11], ['r', -12, 0, -9, 7], ['r', 9, 0, 12, 7]]], front: [CAP, bun, ['b', ['t', -10, -3, -2, -3, -8, 1], ['t', 0, -3, 10, -3, 8, 1]], LOCKS(7), ...star] },
          up: { back: [['b', ['e', 0, 0, 13, 12], ['r', -13, 0, 13, 9]], ['d', ['r', -9, 7, 9, 9]], bun, ...star], front: [] },
          side: { back: [['d', ['e', -3, 0, 12, 12], ['r', -14, 0, -2, 9]]], front: [SCAP, ['b', ['e', -3, -15, 6, 5]], SBANG, SLOCK(6)] } }[dir];
      }
      case 'curly': {
        const puff = ['d', ['e', 0, 0, 15, 13], ['e', -13, -3, 4, 4], ['e', 13, -3, 4, 4], ['e', -14, 6, 3, 4], ['e', 14, 6, 3, 4], ['e', -9, -11, 5, 3], ['e', 9, -11, 5, 3]];
        return { down: { back: [puff], front: [['b', ['e', 0, -7, 13, 6], ['r', -12, -6, 12, -3], ['e', -10, -10, 4, 3], ['e', 10, -10, 4, 3]], BANGS.curl, ['b', ['e', -12, 2, 3, 5], ['e', 12, 2, 3, 5], ['e', -12, 8, 2, 3], ['e', 12, 8, 2, 3]]] },
          up: { back: [['b', ['e', 0, 0, 15, 13], ['e', -13, -3, 4, 4], ['e', 13, -3, 4, 4], ['e', -14, 6, 3, 4], ['e', 14, 6, 3, 4], ['e', -9, -11, 5, 3], ['e', 9, -11, 5, 3], ['e', -10, 11, 4, 3], ['e', 10, 11, 4, 3], ['e', 0, 12, 6, 3]]], front: [] },
          side: { back: [['d', ['e', -3, 0, 14, 13], ['e', -13, 6, 4, 5], ['e', -12, -4, 4, 4]]], front: [['b', ['e', 0, -7, 13, 6], ['r', -10, -6, 11, -3], ['e', 4, -3, 3, 2], ['e', 9, -2, 3, 2]], SLOCK(5)] } }[dir];
      }
      case 'buzz': {
        return { down: { back: [], front: [['b', ['e', 0, -7, 11, 5], ['r', -10, -6, 10, -4], ['r', -11, -4, -10, -1], ['r', 10, -4, 11, -1]]] },
          up: { back: [['b', ['e', 0, -2, 11, 10]], ['d', ['r', -8, 5, 8, 7]]], front: [] },
          side: { back: [], front: [['b', ['e', 0, -7, 11, 5], ['r', -10, -6, 10, -4], ['r', -9, -4, -3, 3]]] } }[dir];
      }
      case 'bald': {
        const tuft = (s) => ['b', ['e', s * 11, 2, 3, 4], ['e', s * 12, 0, 2, 2]];
        return { down: { back: [], front: [['s', ['e', 0, -4, 11, 8]], tuft(-1), tuft(1)] },
          up: { back: [['s', ['e', 0, -1, 11, 11]], tuft(-1), tuft(1)], front: [] },
          side: { back: [['s', ['e', -3, -1, 10, 10]], ['b', ['e', -9, 3, 3, 4]]], front: [['s', ['e', 0, -5, 11, 7]], ['b', ['e', -6, 3, 3, 4]]] } }[dir];
      }
      case 'mutton': {
        return { down: { back: [['d', ['e', 0, -2, 11, 9]]], front: [['b', ['e', 0, -8, 11, 4], ['r', -10, -7, 10, -4], ['r', -11, -4, -9, 4], ['r', 9, -4, 11, 4]]] },
          up: { back: [['b', ['e', 0, -1, 11, 10]], ['d', ['r', -8, 6, 8, 8]]], front: [] },
          side: { back: [['d', ['e', -3, -1, 10, 10]]], front: [['b', ['e', 0, -8, 11, 4], ['r', -10, -7, 10, -4], ['r', -9, -4, -2, 4]]] } }[dir];
      }
      default: return { back: [], front: [] };
    }
  }
  const streakOps = (dir) => (H.streak ? (dir === 'down' ? [['r', 4, -11, 5, -2]] : dir === 'up' ? [['r', -5, -11, -4, 0]] : [['r', 5, -11, 6, -3]]) : []);

  // ---------------------------------------------------------------------------------------------------------
  // sprite frames
  // ---------------------------------------------------------------------------------------------------------
  const BD = spec.body, lg = BD.lg || 0, tr = BD.tr || 0, bw = BD.w || 8, stoop = BD.stoop || 0, amp = stoop ? 0.6 : 1;
  const cx = FW >> 1, ft = FH - 2, hp = ft - 9 - lg, shd = hp - 12 - tr;
  const TP = spec.top, BT = spec.bottom;
  const wide = TP.wide || 0, coat = TP.coat || 0;

  function paintSprite(dir, kind, i) {
    const walk = kind === 'walk', p = walk ? (i / 6) * TAU : 0, sn = Math.sin(p), cs = Math.cos(p), blink = kind === 'blink';
    const bob = walk ? (Math.abs(sn) < 0.5 ? -1 : 0) : (kind === 'idle' && i === 2 ? 1 : 0), Y = (y) => y + bob;
    const sw = walk ? Math.round(sn * 5 * amp) : 0, ad = walk ? Math.round(sn * 3 * amp) : 0;
    const lL = walk ? Math.max(0, Math.round(-sn * 2 * amp)) : 0, lR = walk ? Math.max(0, Math.round(sn * 2 * amp)) : 0;
    const nl = walk && cs > 0.3 ? 1 : 0, fl = walk && cs < -0.3 ? 1 : 0;
    const aL = walk ? Math.round(sn * 2 * amp) : (kind === 'idle' && i === 2 ? 1 : 0), aR = walk ? -aL : aL;
    const hcy = Y(shd - 11 + stoop), hdx = dir === 'side' && stoop ? 2 : 0, fx = 1;
    const longSkirt = BT.style === 'long' || BT.style === 'hakama';
    const w = bw + wide, sb = bw - 1 + (wide ? 1 : 0);

    // ---------- legs and shoes ----------
    const shoe = (x0, x1, lf) => {
      part([['r', x0, ft - 3 - lf, x1, ft - 1 - lf]], SHOE);
      part([['r', x0, ft - lf, x1, ft - lf]], SOLE, { flat: true });
      if (spec.shoe.lace) { const lc = R3(spec.shoe.lace, 8); part([['p', dir === 'side' ? x1 - 2 : (x0 + x1) >> 1, ft - 3 - lf]], lc, { flat: true }); }
    };
    const legCol = BT.style === 'trousers' || BT.style === 'shorts' ? BOT : (BT.legs ? R3(BT.legs, 8) : SK);
    const sockC = BT.sock ? R3(BT.sock, 8) : null, knee = BT.sockLen === 'knee';
    if (dir !== 'side') {
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? cx - 7 : cx + 1, x1 = s < 0 ? cx - 1 : cx + 7, lf = s < 0 ? lL : lR, bot = ft - 3 - lf;
        part([['r', x0, hp - 1, x1, bot]], BT.style === 'shorts' ? legCol : legCol);
        if (BT.style === 'shorts') part([['r', x0, hp + 5, x1, bot]], SK);
        if (sockC) part([['r', x0, knee ? hp + 4 : bot - 3, x1, bot]], sockC);
        shoe(s < 0 ? x0 - 1 : x0, s < 0 ? x1 : x1 + 1, lf);
      }
      part([['r', cx - 7, hp - 1, cx + 7, hp + 2]], BT.style === 'skirt' || longSkirt ? BOT : legCol);
    } else {
      const far = { x0: cx - 5 - sw, x1: cx + 1 - sw, lf: fl }, near = { x0: cx - 2 + sw, x1: cx + 4 + sw, lf: nl };
      for (const [L, dark] of [[far, true], [near, false]]) {
        part([['r', L.x0, hp - 1, L.x1, ft - 3 - L.lf]], dark ? R3(shade(legCol.b, -1, 6), 10) : legCol);
        if (sockC) part([['r', L.x0, knee ? hp + 4 : ft - 6 - L.lf, L.x1, ft - 3 - L.lf]], sockC);
        shoe(L.x0, L.x1 + 3, L.lf);
      }
      part([['r', cx - 6, hp - 1, cx + 5, hp + 2]], BT.style === 'skirt' || longSkirt ? BOT : legCol);
    }
    if (BT.style === 'skirt') {
      const hem = hp + 3 + (lg > 2 ? 1 : 0), ww = dir === 'side' ? 9 : 10;
      part([['q', cx - w, cx + w, hp - 4, cx - ww, cx + ww, hem]], BOT);
      if (BT.pleats) for (const k of [-6, -3, 0, 3, 6]) { setL('Shading'); LN(cx + k, hp - 2, cx + k + (k < 0 ? -1 : k > 0 ? 1 : 0), hem, BOT.s); }
    }
    if (longSkirt) {
      const hem = ft - 4, ww = BT.style === 'hakama' ? 12 : 10, sway = walk ? Math.round(sn * 1) : 0;
      part([['q', cx - w, cx + w, hp - 4, cx - ww + sway, cx + ww + sway, hem]], BOT);
      if (BT.style === 'hakama') { setL('Shading'); for (const k of [-6, -3, 0, 3, 6]) LN(cx + k, hp - 1, cx + Math.round(k * 1.5) + sway, hem, BOT.s); }
    }

    // ---------- back-view and side-view helpers: arms ----------
    const SC = R3(TP.sleeveC || TP.c, 12), sleeveKind = TP.sleeve || 'long';
    const armAt = (x0, aw, off, dark) => {
      const y0 = Y(shd) + 1 + off, yE = hp - 2 + off, sc = dark ? R3(shade(SC.b, -1, 7), 10) : SC, sk = dark ? R3(shade(SK.b, -1, 6), 8) : SK;
      if (sleeveKind === 'none') part([['r', x0, y0, x0 + aw - 1, yE + 2]], sk);
      else if (sleeveKind === 'short') { part([['r', x0, y0 + 4, x0 + aw - 1, yE + 2]], sk); part([['r', x0, y0, x0 + aw - 1, y0 + 4]], sc); }
      else {
        part([['r', x0, y0, x0 + aw - 1, yE]], sc);
        if (TP.cuff) part([['r', x0, yE - 1, x0 + aw - 1, yE]], R3(TP.cuff, 8), { flat: true });
        part([['r', x0 + (aw > 4 ? 1 : 0), yE, x0 + aw - 1 - (aw > 4 ? 1 : 0), yE + 2]], sk);
      }
    };
    const aw = sleeveKind === 'wide' ? 6 : 4;

    if (dir !== 'side') {
      armAt(cx - w - aw, aw, aL, false); armAt(cx + w + 1, aw, aR, true);
      part([['r', cx - 2, Y(shd) - 2, cx + 2, Y(shd) + 1]], R3(shade(SK.b, -1, 8), 8), { flat: true });
      // torso
      const len = hp + coat;
      part([['r', cx - w, Y(shd), cx + w, len], ['e', cx, Y(shd), w, 3]], TOP);
      onL('Highlights', [['r', cx - w + 1, Y(shd), cx - w + 4, Y(shd) + 1]], TOP.l);
      if (dir === 'down') {
        const f = TP.front;
        if (f === 'open') { part([['r', cx - 3, Y(shd), cx + 3, len - 1]], C2, { flat: true }); onL('Shading', [['r', cx - 4, Y(shd) + 1, cx - 4, len - 1], ['r', cx + 4, Y(shd) + 1, cx + 4, len - 1]], TOP.d); }
        if (f === 'zip') { onL('Highlights', [['r', cx, Y(shd) + 2, cx, len - 1]], TOP.h); }
        if (f === 'buttons') onL('Highlights', [['p', cx, Y(shd) + 5], ['p', cx, Y(shd) + 8], ['p', cx, Y(shd) + 11]], C3.l);
        if (f === 'hoodie') {
          part([['r', cx - 5, hp - 6, cx + 5, hp - 1]], TOP, { flat: true }); onL('Shading', [['r', cx - 5, hp - 6, cx + 5, hp - 6], ['r', cx - 5, hp - 6, cx - 5, hp - 1], ['r', cx + 5, hp - 6, cx + 5, hp - 1]], TOP.d);
          onL('Highlights', [['r', cx - 2, Y(shd) + 3, cx - 2, Y(shd) + 8], ['r', cx + 2, Y(shd) + 3, cx + 2, Y(shd) + 8]], '#fff1d6');
        }
        if (TP.collar === 'hood') part([['e', cx, Y(shd), 7, 3]], R3(shade(TOP.b, -1, 6), 8));
        if (TP.collar === 'v') part([['t', cx - 3, Y(shd), cx + 3, Y(shd), cx, Y(shd) + 5]], C2, { flat: true });
        if (TP.collar === 'sailor') { part([['t', cx - 5, Y(shd), cx + 5, Y(shd), cx, Y(shd) + 6]], C3, { flat: true }); part([['t', cx - 2, Y(shd), cx + 2, Y(shd), cx, Y(shd) + 3]], C2, { flat: true }); }
        if (TP.collar === 'turtle') part([['r', cx - 3, Y(shd) - 3, cx + 3, Y(shd) + 1]], C2);
        if (TP.collar === 'high') part([['r', cx - 4, Y(shd) - 2, cx + 4, Y(shd) + 1]], TOP);
        if (TP.collar === 'round') part([['e', cx, Y(shd) - 1, 3, 2]], R3(shade(SK.b, -1, 8), 8), { flat: true });
        if (TP.collar === 'white') { part([['t', cx - 4, Y(shd) - 1, cx - 1, Y(shd) - 1, cx - 1, Y(shd) + 3]], R3('#f4f4f0', 8), { flat: true }); part([['t', cx + 4, Y(shd) - 1, cx + 1, Y(shd) - 1, cx + 1, Y(shd) + 3]], R3('#f4f4f0', 8), { flat: true }); }
        if (TP.tie === 'ribbon') {
          part([['t', cx - 5, Y(shd) + 2, cx - 1, Y(shd) + 3, cx - 5, Y(shd) + 6], ['t', cx + 5, Y(shd) + 2, cx + 1, Y(shd) + 3, cx + 5, Y(shd) + 6], ['r', cx - 1, Y(shd) + 3, cx + 1, Y(shd) + 4], ['r', cx - 2, Y(shd) + 5, cx - 1, Y(shd) + 8], ['r', cx + 1, Y(shd) + 5, cx + 2, Y(shd) + 8]], C3, { flat: true });
        }
        if (TP.tie === 'tie') part([['r', cx - 1, Y(shd) + 2, cx + 1, Y(shd) + 3], ['r', cx - 1, Y(shd) + 4, cx, Y(shd) + 10]], C3);
        if (TP.stripe) { onL('Highlights', [['r', cx - w, Y(shd) + 2, cx - w, len - 1], ['r', cx + w, Y(shd) + 2, cx + w, len - 1]], TP.stripe); }
        if (TP.apron) {
          part([['r', cx - 5, Y(shd) + 3, cx + 5, hp + 4], ['r', cx - 5, Y(shd), cx - 3, Y(shd) + 3], ['r', cx + 3, Y(shd), cx + 5, Y(shd) + 3], ['q', cx - 7, cx + 7, hp - 2, cx - 9, cx + 9, hp + 5]], APR);
          onL('Shading', [['r', cx - 3, hp - 6, cx + 3, hp - 6]], APR.d);
        }
        if (TP.bib) {
          const BB = R3(TP.bib, 12); part([['r', cx - 5, Y(shd) + 4, cx + 5, hp], ['r', cx - 5, Y(shd), cx - 3, Y(shd) + 4], ['r', cx + 3, Y(shd), cx + 5, Y(shd) + 4]], BB);
          onL('Highlights', [['p', cx - 4, Y(shd) + 4], ['p', cx + 4, Y(shd) + 4]], '#e8d890'); onL('Shading', [['r', cx - 3, hp - 5, cx + 3, hp - 5], ['r', cx - 3, hp - 5, cx - 3, hp - 2], ['r', cx + 3, hp - 5, cx + 3, hp - 2]], BB.d);
        }
        if (TP.obi) { part([['r', cx - w, hp - 6, cx + w, hp - 2]], C3); onL('Highlights', [['r', cx - w + 1, hp - 6, cx + w - 1, hp - 6]], C3.l); }
        if (TP.strap) { setL('Line Art'); part([['l', cx - 6, Y(shd) + 1, cx + 6, hp - 2], ['l', cx - 5, Y(shd) + 1, cx + 7, hp - 2]], R3(TP.strap, 10), { flat: true, keepLine: true }); part([['r', cx + 5, hp - 4, cx + w + 4, hp + 3]], R3(TP.strap, 10)); }
        if (TP.chain) onL('Highlights', [['l', cx + 3, Y(shd) + 4, cx + 6, Y(shd) + 8], ['p', cx + 4, Y(shd) + 8]], '#e8c050');
        if (TP.toggles) onL('Highlights', [['r', cx - 2, Y(shd) + 4, cx - 1, Y(shd) + 4], ['r', cx + 1, Y(shd) + 4, cx + 2, Y(shd) + 4], ['r', cx - 2, Y(shd) + 8, cx - 1, Y(shd) + 8], ['r', cx + 1, Y(shd) + 8, cx + 2, Y(shd) + 8]], '#f0c040');
        if (TP.pockets) onL('Shading', [['r', cx - w + 2, hp - 5, cx - w + 5, hp - 5], ['r', cx + w - 5, hp - 5, cx + w - 2, hp - 5]], TOP.d);
        if (TP.splat) onL('Highlights', TP.splat.flatMap((c, k) => [['p', cx - 6 + k * 4, hp - 6 + (k % 2) * 3]]), '#e8a8b8');
      } else { // back
        if (TP.collar === 'hood') part([['e', cx, Y(shd) + 1, 6, 3]], R3(shade(TOP.b, -1, 6), 8));
        if (TP.collar === 'turtle') part([['r', cx - 3, Y(shd) - 3, cx + 3, Y(shd) + 1]], C2);
        if (TP.collar === 'high') part([['r', cx - 4, Y(shd) - 2, cx + 4, Y(shd) + 1]], TOP);
        if (TP.collar === 'sailor') part([['q', cx - 5, cx + 5, Y(shd), cx - 4, cx + 4, Y(shd) + 5]], C3, { flat: true });
        if (TP.apron) { onL('Highlights', [['r', cx - 2, hp - 6, cx + 2, hp - 5]], APR.l); part([['q', cx - 7, cx + 7, hp - 2, cx - 9, cx + 9, hp + 5]], APR); part([['r', cx - 3, hp - 6, cx + 3, hp - 4]], APR); }
        if (TP.bib) { const BB = R3(TP.bib, 12); part([['r', cx - 5, Y(shd), cx - 3, Y(shd) + 3], ['r', cx + 3, Y(shd), cx + 5, Y(shd) + 3]], BB); }
        if (TP.obi) { part([['r', cx - w, hp - 6, cx + w, hp - 2]], C3); part([['r', cx - 4, hp - 7, cx + 4, hp + 1]], C3); }
        if (TP.strap) part([['r', cx + 5, hp - 4, cx + w + 4, hp + 3]], R3(TP.strap, 10));
        if (TP.stripe) onL('Highlights', [['r', cx - w, Y(shd) + 2, cx - w, len - 1], ['r', cx + w, Y(shd) + 2, cx + w, len - 1]], TP.stripe);
        if (TP.back) { const BC = R3(TP.back, 10); part([['e', cx, Y(shd) + 6, 5, 4]], BC); }
        if (TP.splat) onL('Highlights', TP.splat.flatMap((c, k) => [['p', cx - 6 + k * 4, hp - 7 + (k % 2) * 3]]), '#e8a8b8');
        onL('Shading', [['r', cx - w, len - 1, cx + w, len]], TOP.d);
      }
      if (dir === 'down' && hasAcc('scarf')) { const sc = R3(accOf('scarf').c || '#c8423a', 12); part([['r', cx - 5, Y(shd) - 1, cx + 5, Y(shd) + 2], ['r', cx + 2, Y(shd) + 2, cx + 5, Y(shd) + 9]], sc); onL('Shading', [['r', cx + 2, Y(shd) + 6, cx + 5, Y(shd) + 6]], sc.d); }
      if (dir === 'up' && hasAcc('scarf')) { const sc = R3(accOf('scarf').c || '#c8423a', 12); part([['r', cx - 5, Y(shd) - 1, cx + 5, Y(shd) + 2]], sc); }
      if (hasAcc('headphones') && dir === 'down') { part([['o', cx, Y(shd) + 1, 9, 4]], R3('#2a2a32', 8), { flat: true, keepLine: true }); part([['e', cx - 9, Y(shd) + 5, 3, 3], ['e', cx + 9, Y(shd) + 5, 3, 3]], R3('#2a2a32', 10)); onL('Highlights', [['p', cx - 9, Y(shd) + 4], ['p', cx + 9, Y(shd) + 4]], accOf('headphones').c || '#6ac8c4'); }
      if (hasAcc('whistle') && dir === 'down') { onL('Highlights', [['l', cx - 3, Y(shd), cx, Y(shd) + 6], ['l', cx + 3, Y(shd), cx, Y(shd) + 6]], '#e8e8e8'); part([['r', cx - 1, Y(shd) + 6, cx + 1, Y(shd) + 7]], R3('#e8c050', 8), { flat: true }); }
      if (hasAcc('badge') && dir === 'down') part([['e', cx - 4, Y(shd) + 6, 2, 2]], R3('#f0c040', 10), { flat: true });
    } else {
      // ---------- side view (facing right) ----------
      armAt(cx - 6 + ad, 5, 0, true);
      const len = hp + coat, lean = stoop ? 2 : 0;
      part([['q', cx - sb + lean, cx + sb + lean, Y(shd), cx - sb, cx + sb, len]], TOP);
      if (stoop) part([['e', cx - sb - 1, Y(shd) + 3, 3, 3]], TOP);
      onL('Highlights', [['r', cx - sb + 1 + lean, Y(shd), cx - sb + 4 + lean, Y(shd) + 1]], TOP.l);
      if (TP.front === 'open') onL('Shading', [['r', cx + sb - 2 + lean, Y(shd) + 3, cx + sb - 2, len - 1]], TOP.d);
      if (TP.collar === 'hood') part([['e', cx + lean, Y(shd), 5, 3]], R3(shade(TOP.b, -1, 6), 8));
      if (TP.collar === 'turtle' || TP.collar === 'high') part([['r', cx - 2 + lean, Y(shd) - 3, cx + 3 + lean, Y(shd) + 1]], C2);
      if (TP.tie === 'ribbon' || TP.tie === 'tie') part([['e', cx + sb - 1 + lean, Y(shd) + 4, 2, 2], ['r', cx + sb - 2 + lean, Y(shd) + 5, cx + sb - 1 + lean, Y(shd) + 8]], C3, { flat: true });
      if (TP.apron) part([['r', cx + sb - 3 + lean, Y(shd) + 3, cx + sb, hp + 4], ['q', cx + 1, cx + sb + 1, hp - 2, cx + 1, cx + sb + 3, hp + 5]], APR);
      if (TP.bib) { const BB = R3(TP.bib, 12); part([['r', cx + sb - 3 + lean, Y(shd) + 4, cx + sb, hp]], BB); }
      if (TP.obi) part([['r', cx - sb, hp - 6, cx + sb, hp - 2]], C3);
      if (TP.strap) { part([['r', cx - 3, hp - 4, cx + sb + 4, hp + 3]], R3(TP.strap, 10)); onL('Highlights', [['l', cx - 4, Y(shd) + 1, cx + 4, hp - 4]], TP.strap); }
      if (TP.stripe) onL('Highlights', [['r', cx - sb + 1, Y(shd) + 2, cx + sb - 1, Y(shd) + 2]], TP.stripe);
      if (hasAcc('scarf')) { const sc = R3(accOf('scarf').c || '#c8423a', 12); part([['r', cx - 3 + lean, Y(shd) - 1, cx + 4 + lean, Y(shd) + 2], ['r', cx - 6, Y(shd) + 2, cx - 3, Y(shd) + 9]], sc); }
      if (hasAcc('headphones')) part([['e', cx + 2, Y(shd) + 3, 3, 3]], R3('#2a2a32', 10));
      if (hasAcc('badge')) part([['e', cx + sb - 2, Y(shd) + 6, 2, 2]], R3('#f0c040', 10), { flat: true });
      armAt(cx - 2 - ad, 5, 0, false);
    }

    // ---------- head ----------
    const HD = hairDef(dir), T = { x: (u) => cx + hdx + fx * u, y: (v) => hcy + v, s: (l) => l };
    const hpart = ([ck, ...ops], o2 = {}) => { if (ops.length) part(ops.map((o) => mapOp(o, T)), ramps[ck], { hi: ck === 'b', ...o2 }); };
    for (const hp_ of HD.back) { const mapped = hp_; hpart(mapped); }
    if (dir === 'side') {
      part([['e', cx + hdx + 3, hcy, 9, 8], ['e', cx + hdx + 4, hcy + 6, 6, 4]], SK);
      part([['r', cx + hdx + 12, hcy + 3, cx + hdx + 13, hcy + 4]], SK, { flat: true });
      if (hdx) { /* stoop: head already shifted through T */ }
    } else if (dir === 'down') {
      part([['e', cx, hcy, 10, 8], ['e', cx, hcy + 6, 7, 4]], SK);
    }
    if (dir === 'down' && hst === 'bald') { /* dome drawn as part of the hair front */ }
    if (dir === 'side') {
      // the side-view face sits forward of the skull: shift the face by 3 (the hair set was built around cx)
    }
    if (dir !== 'up') onL('Shading', [['r', cx + (dir === 'side' ? hdx - 2 : -9), hcy - 2, cx + (dir === 'side' ? hdx + 12 : 9), hcy + 1]], SK.s);
    for (const f of HD.front) hpart(f);
    if (H.streak && hst !== 'bald') { part(streakOps(dir).map((o) => mapOp(o, T)), R3(H.streak, 10), { flat: true }); }
    if (dir !== 'up' && hst !== 'bald' && hst !== 'buzz') {
      const rl = [['l', -8, -9, -3, -10], ['l', 2, -10, 8, -9]].map((o) => mapOp(o, T)); setL('Highlights'); for (const o of rl) drawOp(o, HR.h);
    }
    if (H.clip && dir !== 'up') { const cl = R3(H.clip, 10); part([['r', dir === 'side' ? 4 : 6, -8, dir === 'side' ? 6 : 8, -7], ['r', dir === 'side' ? 5 : 7, -6, dir === 'side' ? 7 : 9, -5]].map((o) => mapOp(o, T)), cl, { flat: true }); }

    // ---------- face (Line Art) ----------
    if (dir !== 'up') {
      const E_ = spec.eyes, shp = E_.shape || 'round', F = spec.face;
      const eye = (x0, y0, side) => { // 5 wide x 5 tall; side -1/1 = which side the outer corner is on
        const ox = side < 0 ? x0 - 1 : x0 + 5, ex = side < 0 ? x0 : x0 + 4;
        if (blink) { onL('Line Art', [['r', x0, y0 + 3, x0 + 4, y0 + 3], ['p', ox, y0 + 2]], ink); return; }
        const lash = (a, b, yy) => onL('Line Art', [['r', a, yy, b, yy]], ink);
        if (shp === 'line') { onL('Line Art', [['r', x0 + 1, y0 + 1, x0 + 3, y0 + 1], ['p', x0, y0 + 2], ['p', x0 + 4, y0 + 2]], ink); onL('Line Art', [['r', x0 + 2, y0 + 2, x0 + 2, y0 + 3]], EY.d); return; }
        if (shp === 'small') { lash(x0 + 1, x0 + 3, y0 + 1); onL('Line Art', [['r', x0 + 1, y0 + 2, x0 + 3, y0 + 3]], EY.d); onL('Line Art', [['r', x0 + 2, y0 + 2, x0 + 2, y0 + 3]], ink); return; }
        if (shp === 'sleepy') {
          onL('Shading', [['r', x0, y0, x0 + 4, y0]], SK.s); lash(x0, x0 + 4, y0 + 1);
          onL('Line Art', [['r', x0 + 1, y0 + 2, x0 + 3, y0 + 2]], EY.d); onL('Line Art', [['r', x0 + 1, y0 + 3, x0 + 3, y0 + 4]], EY.b); onL('Line Art', [['r', x0 + 2, y0 + 2, x0 + 2, y0 + 3]], ink); onL('Line Art', [['p', x0 + 1, y0 + 2]], '#ffffff'); return;
        }
        const rows = shp === 'big' ? 5 : 4;
        lash(x0, x0 + 4, y0);
        if (shp === 'sharp') { onL('Line Art', [['p', ox, y0 - 1], ['p', ox, y0]], ink); onL('Line Art', [['r', side < 0 ? x0 : x0 + 2, y0 + 1, side < 0 ? x0 + 2 : x0 + 4, y0 + 1]], ink); }
        if (shp === 'soft') onL('Line Art', [['p', ox, y0 + 1]], ink);
        onL('Line Art', [['r', x0 + 1, y0 + 1, x0 + 3, y0 + 2]], EY.d);
        onL('Line Art', [['r', x0 + 1, y0 + 3, x0 + 3, y0 + rows]], EY.b);
        onL('Line Art', [['r', x0 + 1, y0 + rows, x0 + 3, y0 + rows]], EY.l);
        onL('Line Art', [['r', x0 + 2, y0 + 1, x0 + 2, y0 + 3]], ink);
        onL('Line Art', [['p', x0 + 1, y0 + 1]], '#ffffff');
        if (shp === 'soft' || shp === 'big') onL('Line Art', [['p', x0 + 3, y0 + rows]], '#fff0e0');
        if (shp === 'soft') onL('Line Art', [['r', x0 + 1, y0 + rows + 1, x0 + 3, y0 + rows + 1]], SK.d);
      };
      const bw_ = (x0, y0) => { if (F.brow) { const bc = F.browC || brow; onL('Line Art', [['r', x0, y0 - 2, x0 + 4, y0 - 1]], bc); if (F.brow === 'bushy') onL('Line Art', [['r', x0 - 1, y0 - 3, x0 + 5, y0 - 3]], bc); } };
      if (dir === 'down') {
        eye(cx - 7, hcy + 2, -1); eye(cx + 3, hcy + 2, 1); bw_(cx - 7, hcy + 2); bw_(cx + 3, hcy + 2);
      } else {
        const x0 = cx + hdx + 5; eye(x0, hcy + 2, -1); if (F.brow) onL('Line Art', [['r', x0, hcy, x0 + 5, hcy + 1]], F.browC || brow);
      }
      // nose, mouth, blush, freckles, wrinkles
      const mo = F.mouth || 'normal';
      if (dir === 'down') {
        onL('Line Art', [['p', cx, hcy + 5]], SK.d);
        if (mo === 'smile') onL('Line Art', [['p', cx - 1, hcy + 7], ['r', cx, hcy + 8, cx, hcy + 8], ['p', cx + 1, hcy + 7]], MOUTH);
        else if (mo === 'small') onL('Line Art', [['r', cx, hcy + 7, cx + 1, hcy + 7]], MOUTH);
        else if (mo === 'flat') onL('Line Art', [['r', cx - 1, hcy + 7, cx + 1, hcy + 7]], '#8a4a45');
        else onL('Line Art', [['r', cx - 1, hcy + 7, cx + 1, hcy + 7]], MOUTH);
        if (F.blush !== 'none') onL('Highlights', [['p', cx - 7, hcy + 7], ['p', cx - 5, hcy + 7], ['p', cx - 6, hcy + 8], ['p', cx + 5, hcy + 7], ['p', cx + 7, hcy + 7], ['p', cx + 6, hcy + 8]], BLUSH);
        if (F.freckles) onL('Line Art', [['p', cx - 7, hcy + 6], ['p', cx - 5, hcy + 8], ['p', cx + 5, hcy + 8], ['p', cx + 7, hcy + 6], ['p', cx - 3, hcy + 8], ['p', cx + 3, hcy + 8]], '#b8683c');
        if (F.wrinkles) onL('Line Art', [['p', cx - 8, hcy + 7], ['p', cx + 8, hcy + 7], ['p', cx - 3, hcy + 6], ['p', cx + 3, hcy + 6]], SK.d);
      } else {
        const mx = cx + hdx + 9;
        onL('Line Art', [['r', mx, hcy + 8, mx + 1, hcy + 8]], MOUTH);
        if (F.blush !== 'none') onL('Highlights', [['p', mx - 2, hcy + 7], ['p', mx - 4, hcy + 7], ['p', mx - 3, hcy + 8]], BLUSH);
        if (F.freckles) onL('Line Art', [['p', mx - 2, hcy + 6], ['p', mx - 4, hcy + 8]], '#b8683c');
        if (F.wrinkles) onL('Line Art', [['p', mx - 4, hcy + 6], ['p', mx - 6, hcy + 7]], SK.d);
      }
      // beard / chops
      const bd = F.beard;
      if (bd === 'full') {
        const BR = R3(F.beardC || '#f0f0f0', 10);
        if (dir === 'down') part([['e', cx, hcy + 8, 9, 5], ['r', cx - 9, hcy + 3, cx + 9, hcy + 8], ['e', cx - 4, hcy + 6, 4, 2], ['e', cx + 4, hcy + 6, 4, 2]], BR, { keepLine: false });
        else part([['e', cx + hdx + 6, hcy + 8, 6, 5], ['r', cx + hdx + 1, hcy + 3, cx + hdx + 11, hcy + 8]], BR);
        onL('Line Art', dir === 'down' ? [['r', cx - 1, hcy + 7, cx + 1, hcy + 7]] : [['r', cx + hdx + 9, hcy + 7, cx + hdx + 10, hcy + 7]], '#7a4a4a');
      }
      if (bd === 'chops') {
        const BR = R3(F.beardC || '#a8a8a8', 10);
        if (dir === 'down') part([['t', cx - 11, hcy - 1, cx - 8, hcy - 1, cx - 9, hcy + 8], ['t', cx + 11, hcy - 1, cx + 8, hcy - 1, cx + 9, hcy + 8]], BR);
        else part([['t', cx + hdx - 4, hcy - 1, cx + hdx + 2, hcy - 1, cx + hdx - 1, hcy + 8]], BR);
      }
      if (bd === 'stubble') onL('Line Art', dir === 'down' ? [['p', cx - 5, hcy + 8], ['p', cx - 3, hcy + 9], ['p', cx + 3, hcy + 9], ['p', cx + 5, hcy + 8], ['p', cx, hcy + 9]] : [['p', cx + hdx + 6, hcy + 9], ['p', cx + hdx + 8, hcy + 9], ['p', cx + hdx + 10, hcy + 8]], '#6a5040');
    }

    // ---------- accessories ----------
    for (const a of acc) {
      const k = typeof a === 'string' ? a : a.k, cc = (typeof a === 'object' && a.c) || null;
      if (k === 'glasses' && dir !== 'up') {
        const gc = cc || '#c8a050';
        if (dir === 'down') { for (const x0 of [cx - 8, cx + 2]) onL('Line Art', [['r', x0 + 1, hcy + 1, x0 + 5, hcy + 1], ['r', x0 + 1, hcy + 7, x0 + 5, hcy + 7], ['r', x0, hcy + 2, x0, hcy + 6], ['r', x0 + 6, hcy + 2, x0 + 6, hcy + 6]], gc); onL('Line Art', [['r', cx - 1, hcy + 3, cx + 1, hcy + 3]], gc); onL('Highlights', [['p', cx - 7, hcy + 2], ['p', cx + 3, hcy + 2]], '#ffffffaa'.slice(0, 7)); }
        else { const x0 = cx + hdx + 4; onL('Line Art', [['r', x0 + 1, hcy + 1, x0 + 5, hcy + 1], ['r', x0 + 1, hcy + 7, x0 + 5, hcy + 7], ['r', x0, hcy + 2, x0, hcy + 6], ['r', x0 + 6, hcy + 2, x0 + 6, hcy + 6], ['l', x0, hcy + 3, x0 - 8, hcy + 3]], gc); }
      }
      if (k === 'cap') {
        const CP = R3(cc || '#5a9a4a', 12), BR = R3(a.brim || shade(cc || '#5a9a4a', -1, 14), 10);
        if (dir === 'down') { part([['e', 0, -8, 12, 6], ['r', -12, -8, 12, -4]].map((o) => mapOp(o, T)), CP, { hi: true }); part([['e', 0, -3, 12, 2]].map((o) => mapOp(o, T)), BR); if (a.band) part([['r', -11, -6, 11, -5]].map((o) => mapOp(o, T)), R3(a.band, 8), { flat: true }); if (a.badge) part([['r', -1, -9, 1, -8]].map((o) => mapOp(o, T)), R3(a.badge, 8), { flat: true }); }
        else if (dir === 'up') { part([['e', 0, -7, 12, 7], ['r', -12, -7, 12, -1]].map((o) => mapOp(o, T)), CP, { hi: true }); if (a.band) part([['r', -11, -3, 11, -2]].map((o) => mapOp(o, T)), R3(a.band, 8), { flat: true }); }
        else { part([['e', 0, -8, 12, 6], ['r', -12, -8, 12, -4]].map((o) => mapOp(o, T)), CP, { hi: true }); part([['r', 4, -5, 18, -3], ['e', 18, -4, 1, 1]].map((o) => mapOp(o, T)), BR); if (a.band) part([['r', -11, -6, 12, -5]].map((o) => mapOp(o, T)), R3(a.band, 8), { flat: true }); }
      }
      if (k === 'straw') {
        const SW = R3(cc || '#e8c868', 12);
        part([['e', 0, -6, 18, 5], ['e', 0, -12, 10, 6], ['r', -10, -12, 10, -7]].map((o) => mapOp(o, T)), SW, { hi: true });
        part([['r', -10, -9, 10, -7]].map((o) => mapOp(o, T)), R3(a.band || '#c8423a', 10), { flat: true });
        onL('Shading', [['e', 0, -3, 15, 2]].map((o) => mapOp(o, T)), SW.d);
      }
      if (k === 'beanie') {
        const BN = R3(cc || '#2a3a5a', 10);
        part([['e', 0, -8, 12, 6], ['r', -12, -8, 12, -2]].map((o) => mapOp(o, T)), BN, { hi: true });
        part([['r', -12, -4, 12, -1]].map((o) => mapOp(o, T)), R3(shade(BN.b, 1, 10), 8));
        setL('Shading'); for (let u = -11; u <= 11; u += 3) LN(...[T.x(u), T.y(-4), T.x(u), T.y(-1)], BN.d);
      }
      if (k === 'beret') {
        const BE = R3(cc || '#e8a8c8', 12);
        part([['e', 1, -10, 14, 5], ['r', -12, -9, 14, -5]].map((o) => mapOp(o, T)), BE, { hi: true }); part([['r', 0, -16, 1, -14]].map((o) => mapOp(o, T)), BE, { flat: true });
      }
      if (k === 'headband') { const HB = R3(cc || '#e87aa0', 10); part([['r', -11, -5, 11, -4]].map((o) => mapOp(o, T)), HB, { flat: true }); if (dir !== 'up') { part([['t', 8, -5, 12, -9, 12, -3]].map((o) => mapOp(o, T)), HB, { flat: true }); } }
      if (k === 'bandana') { const HB = R3(cc || '#c8423a', 10); part([['r', -11, -6, 11, -3]].map((o) => mapOp(o, T)), HB, { hi: true }); if (dir === 'up') part([['t', -3, -3, 3, -3, 0, 4]].map((o) => mapOp(o, T)), HB, { flat: true }); }
      if (k === 'earmuffs') { const EM = R3(cc || '#f2b56b', 12); part([['o', 0, -3, 13, 9]].map((o) => mapOp(o, T)), R3('#4a4a5a', 8), { flat: true, keepLine: true }); part([['e', -13, 2, 3, 4], ['e', 13, 2, 3, 4], ['t', -15, -2, -11, -2, -14, -7], ['t', 15, -2, 11, -2, 14, -7]].map((o) => mapOp(o, T)), EM); }
      if (k === 'hood') { const HO = R3(cc || '#e8c838', 12); part([['e', 0, -2, 14, 14], ['r', -14, -2, 14, 6]].map((o) => mapOp(o, T)), HO); }
      if (k === 'pin') { const PN = R3(cc || '#ffd76a', 10); part([['p', 6, -9], ['p', 7, -8], ['p', 6, -7], ['p', 5, -8]].map((o) => mapOp(o, T)), PN, { flat: true }); }
    }
    // keep shading/highlights inside the flats, then outline the whole figure on Line Art
    finish();
  }

  function finish() {
    const f = cur.frame, get = (n) => doc.layers[lIdx(n)].cels[f], flats = get('Flats'), la = get('Line Art');
    for (const n of ['Shading', 'Highlights']) { const c = get(n); for (let k = 0; k < FW * FH; k++) if (!flats[k * 4 + 3]) c[k * 4 + 3] = 0; }
    for (let k = 0; k < FW * FH; k++) if (!flats[k * 4 + 3]) la[k * 4 + 3] = 0;
    const solid = (x, y) => x >= 0 && y >= 0 && x < FW && y < FH && flats[(y * FW + x) * 4 + 3] > 0;
    const m = new Uint8Array(FW * FH);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) m[y * FW + x] = 1;
    paintMask(m, ink, 'Line Art');
  }

  // ---------------------------------------------------------------------------------------------------------
  // portrait (64x64, facing the viewer)
  // ---------------------------------------------------------------------------------------------------------
  function paintPortrait(mood, mouth, blink) {
    const pcx = 32, hc = 33, S = 1.55;
    const T = { x: (u) => pcx + Math.round(u * S), y: (v) => hc + Math.round((v - 3) * S), s: (l) => Math.round(l * S) };
    const TB = { x: T.x, y: (v) => hc + Math.round((v - 2) * S), s: T.s };
    const sad = mood === 'sad', sur = mood === 'surprised', hap = mood === 'happy', slp = mood === 'sleepy';
    // bust: neck then top
    part([['r', 28, 44, 36, 56]], R3(shade(SK.b, -1, 7), 8), { flat: true });
    part([['e', 32, 76, 31, 21]], TOP);
    onL('Highlights', [['r', 14, 60, 22, 61]], TOP.l);
    const tp = TP;
    if (tp.collar === 'hood') part([['e', 32, 54, 15, 5]], R3(shade(TOP.b, -1, 6), 8));
    if (tp.front === 'open') { part([['r', 26, 54, 38, 64]], C2, { flat: true }); onL('Shading', [['r', 25, 54, 25, 64], ['r', 39, 54, 39, 64]], TOP.d); }
    if (tp.collar === 'v') part([['t', 26, 52, 38, 52, 32, 63]], C2, { flat: true });
    if (tp.collar === 'sailor') { part([['t', 22, 52, 42, 52, 32, 64]], C3, { flat: true }); part([['t', 28, 52, 36, 52, 32, 58]], C2, { flat: true }); }
    if (tp.collar === 'turtle') part([['r', 25, 49, 39, 57]], C2);
    if (tp.collar === 'high') part([['r', 24, 49, 40, 57]], TOP);
    if (tp.collar === 'white') { part([['t', 24, 51, 31, 51, 31, 60]], R3('#f4f4f0', 8), { flat: true }); part([['t', 40, 51, 33, 51, 33, 60]], R3('#f4f4f0', 8), { flat: true }); }
    if (tp.tie === 'ribbon') part([['t', 22, 55, 31, 57, 22, 63], ['t', 42, 55, 33, 57, 42, 63], ['r', 30, 56, 34, 59], ['r', 28, 60, 30, 64], ['r', 34, 60, 36, 64]], C3, { flat: true });
    if (tp.tie === 'tie') part([['r', 30, 54, 34, 57], ['r', 30, 58, 33, 64]], C3);
    if (tp.front === 'hoodie') onL('Highlights', [['r', 27, 58, 27, 64], ['r', 37, 58, 37, 64]], '#fff1d6');
    if (tp.apron) { part([['r', 24, 56, 40, 64], ['r', 22, 50, 26, 58], ['r', 38, 50, 42, 58]], APR); }
    if (tp.bib) { const BB = R3(tp.bib, 12); part([['r', 22, 50, 26, 58], ['r', 38, 50, 42, 58], ['r', 25, 58, 39, 64]], BB); onL('Highlights', [['p', 24, 58], ['p', 40, 58]], '#e8d890'); }
    if (tp.obi) part([['r', 8, 62, 56, 64]], C3);
    if (tp.strap) { part([['l', 18, 54, 50, 64], ['l', 18, 55, 50, 65], ['l', 19, 54, 51, 64]], R3(tp.strap, 10), { flat: true }); }
    if (tp.chain) onL('Highlights', [['l', 36, 56, 42, 63], ['p', 38, 64]], '#e8c050');
    if (tp.stripe) onL('Highlights', [['r', 12, 62, 18, 62], ['r', 46, 62, 52, 62]], tp.stripe);
    if (hasAcc('scarf')) { const sc = R3(accOf('scarf').c || '#c8423a', 12); part([['r', 20, 50, 44, 57], ['r', 38, 57, 44, 64]], sc); }
    if (hasAcc('headphones')) { part([['o', 32, 58, 20, 9]], R3('#2a2a32', 8), { flat: true, keepLine: true }); part([['e', 12, 62, 5, 6], ['e', 52, 62, 5, 6]], R3('#2a2a32', 10)); onL('Highlights', [['r', 12, 60, 12, 62], ['r', 52, 60, 52, 62]], accOf('headphones').c || '#6ac8c4'); }
    if (hasAcc('whistle')) { onL('Highlights', [['l', 25, 52, 32, 62], ['l', 39, 52, 32, 62]], '#e8e8e8'); part([['r', 30, 62, 34, 64]], R3('#e8c050', 8), { flat: true }); }
    if (hasAcc('badge')) part([['e', 22, 62, 3, 3]], R3('#f0c040', 10), { flat: true });
    // hair behind the head
    const HD = hairDef('down'), hpart = (arr, TT) => { for (const [ck, ...ops] of arr) if (ops.length) part(ops.map((o) => mapOp(o, TT)), ramps[ck], { hi: ck === 'b' }); };
    hpart(HD.back, TB);
    // face
    part([['e', 32, hc, 15, 12], ['e', 32, hc + 8, 11, 8]], SK);
    onL('Shading', [['r', 17, 29, 47, 30]], SK.s);
    hpart(HD.front, T);
    if (H.streak && hst !== 'bald') part([['r', T.x(4), T.y(-11), T.x(5) + 1, T.y(-2)]], R3(H.streak, 10), { flat: true });
    if (hst !== 'bald' && hst !== 'buzz') { setL('Highlights'); drawOp(['l', T.x(-8), T.y(-9), T.x(-3), T.y(-10)], HR.h); drawOp(['l', T.x(2), T.y(-10), T.x(8), T.y(-9)], HR.h); drawOp(['l', T.x(-9), T.y(-7), T.x(-8), T.y(-5)], HR.l); }
    if (H.clip) part([['r', T.x(6), T.y(-8), T.x(8), T.y(-7)], ['r', T.x(7), T.y(-6), T.x(9), T.y(-5)]], R3(H.clip, 10), { flat: true });
    // eyes
    const E_ = spec.eyes, shp = E_.shape || 'round', F = spec.face;
    const ey = (sad ? 39 : sur ? 36 : 38);
    const eyeP = (ex, side) => {
      const x_ = (d) => ex + side * d;
      if (hap || blink) {
        if (hap) { onL('Line Art', [['r', ex - 5, ey - 1, ex - 4, ey], ['r', ex - 4, ey - 3, ex - 2, ey - 2], ['r', ex - 1, ey - 4, ex + 1, ey - 4], ['r', ex + 2, ey - 3, ex + 4, ey - 2], ['r', ex + 4, ey - 1, ex + 5, ey]], ink); }
        else { onL('Line Art', [['r', ex - 5, ey, ex + 5, ey], ['p', x_(6), ey - 1], ['p', x_(6), ey - 2], ['r', ex - 4, ey + 1, ex + 4, ey + 1]], ink); onL('Line Art', [['r', ex - 4, ey + 1, ex + 4, ey + 1]], SK.d); }
        return;
      }
      const rx = shp === 'big' ? 5 : shp === 'sharp' ? 3 : shp === 'small' ? 3 : shp === 'line' ? 2 : 4, ry = shp === 'small' ? 4 : shp === 'line' ? 3 : 5;
      if (shp === 'line') {
        onL('Line Art', [['r', ex - 5, ey - 2, ex + 5, ey - 2], ['p', ex - 6, ey - 1], ['p', ex + 6, ey - 1], ['r', ex - 4, ey - 3, ex + 4, ey - 3]], ink);
        onL('Line Art', [['e', ex, ey, 2, 2]], EY.d); onL('Line Art', [['r', ex - 1, ey - 1, ex, ey + 1]], ink); onL('Line Art', [['p', ex - 1, ey - 1]], '#ffffff');
        onL('Line Art', [['r', ex - 4, ey + 3, ex + 4, ey + 3]], SK.d); return;
      }
      onL('Line Art', [['e', ex, ey, rx, ry]], EY.d);
      onL('Line Art', [['e', ex, ey + 1, rx - 1 < 1 ? 1 : rx - 1, ry - 1]], EY.b);
      onL('Line Art', [['e', ex, ey + 3, Math.max(1, rx - 1), 2]], EY.l);
      onL('Line Art', [['e', ex, ey, sur ? 1 : 1, sur ? 2 : 3]], ink);
      if (rx >= 4) onL('Line Art', [['r', ex - 1, ey - 3, ex + 1, ey + 2]], ink);
      onL('Line Art', [['r', ex - 3, ey - 4, ex - 2, ey - 2]], '#ffffff'); onL('Line Art', [['p', ex + 2, ey + 3], ['p', ex + 3, ey + 2]], '#ffe8d0');
      // upper lid (thick ink with a flick at the outer corner); no ink under the eye
      const lt = shp === 'sleepy' || slp ? ey - 2 : ey - 6;
      if (shp === 'sleepy' || slp) { onL('Line Art', [['r', ex - 6, ey - 7, ex + 6, ey - 3]], SK.b); onL('Shading', [['r', ex - 6, ey - 7, ex + 6, ey - 4]], SK.s); onL('Line Art', [['r', ex - 6, lt, ex + 6, lt]], ink); onL('Line Art', [['p', x_(7), lt - 1]], ink); }
      else {
        onL('Line Art', [['r', ex - 6, lt, ex + 5, lt + 1]], ink);
        if (shp === 'sharp') onL('Line Art', [['r', x_(2), lt - 1, x_(7), lt - 1], ['p', x_(8), lt - 2], ['p', x_(7), lt + 2]], ink);
        else onL('Line Art', [['p', x_(6), lt - 1], ['p', x_(7), lt - 2]], ink);
        if (shp === 'soft') onL('Line Art', [['p', x_(6), lt + 2], ['p', x_(6), lt + 3]], ink);
      }
      onL('Line Art', [['r', x_(1), ey + 7, x_(5), ey + 7]], SK.d);
    };
    eyeP(pcx - 8, -1); eyeP(pcx + 8, 1);
    // brows
    const bc = F.browC || brow, showBrow = F.brow || sad || sur || mood === 'sleepy';
    if (showBrow) {
      const by = sur ? ey - 12 : ey - 10, th = F.brow ? 2 : 1;
      for (const side of [-1, 1]) {
        const ex = pcx + side * 8;
        if (sad) onL('Line Art', [['l', ex - side * 5, by + 1, ex + side * 5, by - 2], ['l', ex - side * 5, by + 2, ex + side * 5, by - 1]], bc);
        else onL('Line Art', [['r', ex - 5, by, ex + 5, by + th - 1]], bc);
        if (F.brow === 'bushy') onL('Line Art', [['r', ex - 6, by - 1, ex + 6, by - 1]], bc);
      }
    }
    // nose, mouth, blush
    onL('Line Art', [['p', 32, 42]], SK.d); onL('Line Art', [['p', 31, 43]], SK.s);
    const open = mouth === 1, my = 46, mo = F.mouth || 'normal';
    if (hap) { if (open) { onL('Line Art', [['e', 32, my, 4, 3]], '#7a2a35'); onL('Line Art', [['r', 30, my + 1, 34, my + 2]], '#f08a94'); onL('Line Art', [['r', 29, my - 2, 35, my - 2]], MOUTH); } else onL('Line Art', [['p', 29, my - 2], ['r', 30, my - 1, 34, my - 1], ['p', 35, my - 2]], MOUTH); }
    else if (sur) onL('Line Art', [['e', 32, my, open ? 3 : 2, open ? 4 : 3]], '#7a2a35');
    else if (sad) { if (open) onL('Line Art', [['e', 32, my, 2, 2]], '#7a2a35'); onL('Line Art', [['r', 30, my + 1, 34, my + 1], ['p', 29, my + 2], ['p', 35, my + 2]], MOUTH); }
    else if (open) onL('Line Art', [['e', 32, my, 2, 2]], '#7a2a35');
    else if (mo === 'smile') onL('Line Art', [['p', 29, my - 1], ['r', 30, my, 34, my], ['p', 35, my - 1]], MOUTH);
    else onL('Line Art', [['r', 30, my, 34, my]], MOUTH);
    if (F.blush !== 'none') onL('Highlights', [['r', 20, 42, 22, 43], ['r', 20, 44, 21, 44], ['r', 42, 42, 44, 43], ['r', 43, 44, 44, 44]], BLUSH);
    if (sad) onL('Highlights', [['p', 19, 43], ['p', 45, 43]], '#bcd8f0');
    if (F.freckles) onL('Line Art', [['p', 19, 40], ['p', 22, 41], ['p', 25, 42], ['p', 45, 40], ['p', 42, 41], ['p', 39, 42], ['p', 20, 43], ['p', 44, 43], ['p', 23, 44], ['p', 41, 44]], '#b8683c');
    if (F.wrinkles) onL('Line Art', [['r', 18, 45, 19, 45], ['r', 45, 45, 46, 45], ['l', 25, 44, 26, 47], ['l', 39, 44, 38, 47], ['r', 18, 43, 21, 43], ['r', 43, 43, 46, 43], ['r', 26, 26, 38, 26]], SK.d);
    // beards, glasses and hats
    const bd = F.beard;
    if (bd === 'full') { const BR = R3(F.beardC || '#f0f0f0', 10); part([['e', 32, 47, 14, 8], ['r', 18, 40, 46, 47], ['e', 26, 43, 5, 3], ['e', 38, 43, 5, 3]], BR); onL('Line Art', open ? [['e', 32, 47, 3, 2]] : [['r', 30, 46, 34, 46]], open ? '#7a2a35' : '#7a4a4a'); }
    if (bd === 'chops') { const BR = R3(F.beardC || '#a8a8a8', 10); part([['t', 16, 28, 22, 28, 19, 48], ['t', 48, 28, 42, 28, 45, 48]], BR); }
    if (bd === 'stubble') onL('Line Art', [['p', 24, 47], ['p', 27, 49], ['p', 30, 50], ['p', 34, 50], ['p', 37, 49], ['p', 40, 47], ['p', 21, 45], ['p', 43, 45]], '#6a5040');
    for (const a of acc) {
      const k = typeof a === 'string' ? a : a.k, cc = (typeof a === 'object' && a.c) || null;
      if (k === 'glasses') {
        const gc = cc || '#c8a050', rx = a.big ? 9 : 8;
        onL('Line Art', [['o', pcx - 8, ey, rx, 7], ['o', pcx + 8, ey, rx, 7], ['r', pcx - 1 - (rx - 8), ey - 2, pcx + 1 + (rx - 8), ey - 2], ['r', pcx - 8 - rx, ey - 1, pcx - 8 - rx - 3, ey - 2], ['r', pcx + 8 + rx, ey - 1, pcx + 8 + rx + 3, ey - 2]], gc);
        onL('Highlights', [['r', pcx - 13, ey - 5, pcx - 12, ey - 3], ['r', pcx + 3, ey - 5, pcx + 4, ey - 3]], '#ffffff');
      }
      if (k === 'cap') { const CP = R3(cc || '#5a9a4a', 12), BR = R3(a.brim || shade(cc || '#5a9a4a', -1, 14), 10); part([['e', 0, -8, 12, 6], ['r', -12, -8, 12, -4]].map((o) => mapOp(o, T)), CP, { hi: true }); part([['e', 0, -3, 13, 2]].map((o) => mapOp(o, T)), BR); if (a.band) part([['r', -11, -6, 11, -5]].map((o) => mapOp(o, T)), R3(a.band, 8), { flat: true }); if (a.badge) part([['r', -1, -9, 1, -8]].map((o) => mapOp(o, T)), R3(a.badge, 8), { flat: true }); }
      if (k === 'straw') { const SW = R3(cc || '#e8c868', 12); part([['e', 0, -6, 18, 5], ['e', 0, -12, 10, 6], ['r', -10, -12, 10, -7]].map((o) => mapOp(o, T)), SW, { hi: true }); part([['r', -10, -9, 10, -7]].map((o) => mapOp(o, T)), R3(a.band || '#c8423a', 10), { flat: true }); }
      if (k === 'beanie') { const BN = R3(cc || '#2a3a5a', 10); part([['e', 0, -8, 12, 6], ['r', -12, -8, 12, -2]].map((o) => mapOp(o, T)), BN, { hi: true }); part([['r', -12, -4, 12, -1]].map((o) => mapOp(o, T)), R3(shade(BN.b, 1, 10), 8)); setL('Shading'); for (let u = -11; u <= 11; u += 3) LN(T.x(u), T.y(-4), T.x(u), T.y(-1), BN.d); }
      if (k === 'beret') { const BE = R3(cc || '#e8a8c8', 12); part([['e', 1, -10, 14, 5], ['r', -12, -9, 14, -5]].map((o) => mapOp(o, T)), BE, { hi: true }); part([['r', 0, -16, 1, -14]].map((o) => mapOp(o, T)), BE, { flat: true }); }
      if (k === 'headband') { const HB = R3(cc || '#e87aa0', 10); part([['r', -11, -5, 11, -4]].map((o) => mapOp(o, T)), HB, { flat: true }); }
      if (k === 'bandana') { const HB = R3(cc || '#c8423a', 10); part([['r', -11, -6, 11, -3]].map((o) => mapOp(o, T)), HB, { hi: true }); }
      if (k === 'earmuffs') { const EM = R3(cc || '#f2b56b', 12); part([['o', 0, -3, 13, 9]].map((o) => mapOp(o, T)), R3('#4a4a5a', 8), { flat: true, keepLine: true }); part([['e', -13, 2, 3, 4], ['e', 13, 2, 3, 4]].map((o) => mapOp(o, T)), EM); }
      if (k === 'hood') { const HO = R3(cc || '#e8c838', 12); part([['e', 0, -2, 14, 14], ['r', -14, -2, 14, 6]].map((o) => mapOp(o, T)), HO); }
      if (k === 'pin') { const PN = R3(cc || '#ffd76a', 10); part([['p', 6, -9], ['p', 7, -8], ['p', 6, -7], ['p', 5, -8]].map((o) => mapOp(o, T)), PN, { flat: true }); }
    }
    finish();
  }

  // ---------------------------------------------------------------------------------------------------------
  // run
  // ---------------------------------------------------------------------------------------------------------
  const errs = [];
  if (mode === 'sheet') {
    const DIRS = ['down', 'up', 'side']; let f = 0;
    for (const dir of DIRS) for (let i = 0; i < 11; i++, f++) { cur.frame = f; try { if (i < 4) paintSprite(dir, 'idle', i); else if (i === 4) paintSprite(dir, 'blink', 0); else paintSprite(dir, 'walk', i - 5); } catch (e) { errs.push(`${dir}${i}: ${e.stack}`); throw e; } }
  } else {
    job.moods.forEach((mood, mi) => { for (let m = 0; m < 2; m++) for (let bl = 0; bl < 2; bl++) { cur.frame = mi * 4 + m * 2 + bl; paintPortrait(mood, m, bl === 1); } });
  }
  doc.layers.pop(); undoStack.length = 0;
  const cols = mode === 'sheet' ? 11 : 4, rows = mode === 'sheet' ? 3 : job.moods.length;
  const sheet = document.createElement('canvas'); sheet.width = cols * FW; sheet.height = rows * FH;
  const sx = sheet.getContext('2d');
  for (let k = 0; k < doc.frames; k++) sx.putImageData(new ImageData(frameRGBA(k), FW, FH), (k % cols) * FW, ((k / cols) | 0) * FH);
  return { png: sheet.toDataURL('image/png'), project: serialize(), errs };
}

// ---------------------------------------------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------------------------------------------
const T_ = (o) => o;
export const CAST = {
  kai: T_({ name: 'Kai', skin: '#e0a878', eyes: { c: '#3a2414', shape: 'big' }, hair: { c: '#1e1e2a', h: '#3a3a52', style: 'spiky', bangs: 'spiky' }, body: { lg: -2, w: 8 },
    top: { c: '#c8423a', c2: '#f4f4f0', c3: '#f4f4f0', front: 'open', collar: 'round', stripe: '#f4f4f0', sleeve: 'long' }, bottom: { style: 'trousers', c: '#3a3a4a' }, shoe: { c: '#f4f4f8', sole: '#8a90a8', lace: '#5ac85a' }, acc: [], face: { brow: 'thin', mouth: 'smile' } }),
  suzu: T_({ name: 'Suzu', skin: '#f2d0b0', eyes: { c: '#3a5a4a', shape: 'soft' }, hair: { c: '#2f4a3a', h: '#4f6e56', style: 'braid', bangs: 'fringe', a: '#c8a050' }, body: { lg: 0, w: 8 },
    top: { c: '#d8c4a0', c2: '#f4f4f0', c3: '#c8a050', front: 'open', collar: 'white', sleeve: 'long', cuff: '#f4f4f0' }, bottom: { style: 'skirt', c: '#4a4a5a', pleats: true }, shoe: { c: '#5a3a2a', sole: '#2a1a12' }, acc: [{ k: 'glasses', c: '#c8a050' }], face: { mouth: 'small' } }),
  rina: T_({ name: 'Rina', skin: '#f8dcc4', eyes: { c: '#5a3a6a', shape: 'sharp' }, hair: { c: '#f0d878', h: '#fff4b8', s: '#c8a848', style: 'twin', bangs: 'clump', a: '#e87aa0' }, body: { lg: 0, w: 8 },
    top: { c: '#2a3a6a', c2: '#f4f4f0', c3: '#e87aa0', collar: 'v', tie: 'ribbon', sleeve: 'long', cuff: '#f4f4f0' }, bottom: { style: 'skirt', c: '#5a5a6a', pleats: true, sock: '#f4f4f8', sockLen: 'knee' }, shoe: { c: '#2a2a3a', sole: '#12121a' }, acc: [], face: { mouth: 'flat' } }),
  theo: T_({ name: 'Theo', skin: '#f0d0b0', eyes: { c: '#2a2a3a', shape: 'sleepy' }, hair: { c: '#3a9a9a', h: '#6ac8c4', style: 'messy', bangs: 'side' }, body: { lg: 1, w: 8 },
    top: { c: '#d8a838', c2: '#b88a28', front: 'hoodie', collar: 'hood', sleeve: 'long', wide: 1, splat: ['#e8a8b8', '#6ac8c4', '#ffffff'] }, bottom: { style: 'trousers', c: '#2a2a32' }, shoe: { c: '#4a4a5a', sole: '#22222a' }, acc: [{ k: 'headphones', c: '#6ac8c4' }], face: { mouth: 'flat', blush: 'none' } }),
  hina: T_({ name: 'Hina', skin: '#f4caa0', eyes: { c: '#4a3a1a', shape: 'big' }, hair: { c: '#e07a3a', h: '#f4a860', style: 'short', bangs: 'side', lock: 4 }, body: { lg: -2, w: 8 },
    top: { c: '#f0d048', c2: '#f0d048', bib: '#4a6aa0', sleeve: 'short', collar: 'round' }, bottom: { style: 'trousers', c: '#4a6aa0' }, shoe: { c: '#7a4a2a', sole: '#3a2214' }, acc: [{ k: 'cap', c: '#5a9a4a', band: '#f4f4f0' }], face: { freckles: true, mouth: 'smile' } }),
  fujita: T_({ name: 'Ms. Fujita', skin: '#f2d4bc', eyes: { c: '#3a2a2a', shape: 'round' }, hair: { c: '#b8483a', h: '#e0705a', style: 'bob', bangs: 'side', lock: 7 }, body: { lg: 4, tr: 3, w: 8 },
    top: { c: '#f4f4f0', c2: '#4a7a5a', c3: '#f4f4f0', front: 'open', collar: 'turtle', sleeve: 'long', coat: 5, pockets: true }, bottom: { style: 'skirt', c: '#4a7a5a' }, shoe: { c: '#3a3a3a', sole: '#1a1a1a' }, acc: [{ k: 'glasses', c: '#2a2a2a' }], face: { mouth: 'smile' } }),
  ogawa: T_({ name: 'Mr. Ogawa', skin: '#d8a880', eyes: { c: '#2a1a14', shape: 'small' }, hair: { c: '#4a4a50', h: '#6a6a70', style: 'buzz', bangs: 'high' }, body: { lg: 6, tr: 4, w: 10 },
    top: { c: '#2a3a6a', c2: '#2a3a6a', front: 'zip', collar: 'high', stripe: '#f4f4f8', sleeve: 'long' }, bottom: { style: 'trousers', c: '#2a3a6a' }, shoe: { c: '#f4f4f8', sole: '#8a90a8' }, acc: ['whistle'], face: { brow: 'thick', mouth: 'smile', beard: 'stubble' } }),
  hana: T_({ name: 'Grandma Hana', skin: '#f0d0b8', eyes: { c: '#4a3a3a', shape: 'line' }, hair: { c: '#d8d8e0', h: '#ffffff', s: '#a8a8b8', style: 'bun', bangs: 'side', lock: 5, a: '#ffd76a' }, body: { lg: 0, tr: 1, w: 7, stoop: 2 },
    top: { c: '#7a4a6a', c2: '#c8a040', c3: '#ffd76a', front: 'open', collar: 'round', sleeve: 'long', coat: 2, buttons: true }, bottom: { style: 'long', c: '#c8a040' }, shoe: { c: '#5a3a4a', sole: '#2a1a24' }, acc: [], face: { wrinkles: true, mouth: 'smile' } }),
  tobias: T_({ name: 'Tobias', skin: '#ecc8a8', eyes: { c: '#3a3a3a', shape: 'small' }, hair: { c: '#a8a8a8', h: '#d8d8d8', style: 'mutton', bangs: 'high' }, body: { lg: 3, tr: 2, w: 8, stoop: 1 },
    top: { c: '#3a5a3a', c2: '#f4f4f0', c3: '#c8a040', front: 'open', collar: 'white', sleeve: 'long', sleeveC: '#f4f4f0', chain: true, cuff: '#f4f4f0' }, bottom: { style: 'trousers', c: '#4a4a4a' }, shoe: { c: '#2a2020', sole: '#120c0c' }, acc: [{ k: 'glasses', c: '#c8a050', big: false }], face: { brow: 'thick', beard: 'chops', beardC: '#a8a8a8', wrinkles: true, mouth: 'flat' } }),
  mika: T_({ name: 'Mika', skin: '#f8dcc8', eyes: { c: '#6a4a7a', shape: 'soft' }, hair: { c: '#f4f0f0', h: '#ffffff', s: '#c8c0d0', style: 'bun', bangs: 'side', lock: 7, a: '#ffd76a' }, body: { lg: 3, tr: 2, w: 8 },
    top: { c: '#f8f0e0', c2: '#f8f0e0', apron: '#a890c8', collar: 'round', sleeve: 'short' }, bottom: { style: 'skirt', c: '#f0e8d8' }, shoe: { c: '#8a6a5a', sole: '#4a3a2e' }, acc: [], face: { mouth: 'small' } }),
  sachiko: T_({ name: 'Sachiko', skin: '#f4c8a8', eyes: { c: '#4a3a2a', shape: 'soft' }, hair: { c: '#b8a0c8', h: '#dcc8e8', style: 'curly', bangs: 'curl' }, body: { lg: 2, tr: 3, w: 9 },
    top: { c: '#5a8a4a', c2: '#5a8a4a', apron: '#f0c040', collar: 'round', sleeve: 'long' }, bottom: { style: 'skirt', c: '#5a8a4a' }, shoe: { c: '#6a4a3a', sole: '#322218' }, acc: ['badge'], face: { blush: '#f08a8a', mouth: 'smile' } }),
  jun: T_({ name: 'Captain Jun', skin: '#d8a078', eyes: { c: '#2a2a3a', shape: 'line' }, hair: { c: '#f0f0f0', style: 'short' }, body: { lg: 4, tr: 3, w: 9 },
    top: { c: '#e8c838', c2: '#e8c838', front: 'buttons', collar: 'high', sleeve: 'long', coat: 4, pockets: true, c3: '#7a6a18' }, bottom: { style: 'trousers', c: '#2a3a5a' }, shoe: { c: '#3a3a3a', sole: '#161616' }, acc: ['whistle', { k: 'beanie', c: '#2a3a5a' }], face: { brow: 'bushy', browC: '#f0f0f0', beard: 'full', beardC: '#f4f4f4', mouth: 'flat' } }),
  kiko: T_({ name: 'Kiko', skin: '#f6dcc8', eyes: { c: '#2a2030', shape: 'soft' }, hair: { c: '#1a1a24', h: '#4a4a5a', style: 'long', bangs: 'fringe', lock: 12, len: 20, a: '#f4f4f0' }, body: { lg: 2, tr: 1, w: 8 },
    top: { c: '#f4f4f0', c2: '#c83a3a', c3: '#c83a3a', front: 'open', collar: 'v', sleeve: 'wide' }, bottom: { style: 'hakama', c: '#c83a3a' }, shoe: { c: '#c8a878', sole: '#6a5238' }, acc: [], face: { mouth: 'small' } }),
  pip: T_({ name: 'Pip', skin: '#f2c8a4', eyes: { c: '#4a8a5a', shape: 'big' }, hair: { c: '#4a3436', h: '#6a5456', style: 'ponytail', bangs: 'side' }, body: { lg: 1, tr: 1, w: 8 },
    top: { c: '#5a8cc0', c2: '#f4f4f0', c3: '#e0505a', collar: 'white', sleeve: 'short', strap: '#e0505a', buttons: true }, bottom: { style: 'trousers', c: '#3f6a98' }, shoe: { c: '#3a2a2a', sole: '#1a1212' }, acc: [{ k: 'cap', c: '#5a8cc0', band: '#e0505a', badge: '#ffd76a', brim: '#3f6a98' }], face: { mouth: 'smile' } }),
  goro: T_({ name: 'Mr. Hayashi', skin: '#e0b090', eyes: { c: '#2a2018', shape: 'small' }, hair: { c: '#e8e8e8', h: '#ffffff', s: '#b8b8b8', style: 'bald', bangs: 'high' }, body: { lg: 1, tr: 1, w: 8, stoop: 2 },
    top: { c: '#7a5a3a', c2: '#d8c8a0', front: 'open', collar: 'round', sleeve: 'long', pockets: true }, bottom: { style: 'trousers', c: '#5a5040' }, shoe: { c: '#4a7a3a', sole: '#22381a' }, acc: [{ k: 'straw', c: '#e8c868', band: '#c8423a' }], face: { brow: 'bushy', browC: '#f4f4f4', wrinkles: true, mouth: 'flat' } }),
  mum: T_({ name: 'Mum', portraitOnly: true, skin: '#f0c8a8', eyes: { c: '#3a2a20', shape: 'big' }, hair: { c: '#2a2a3a', h: '#5a5a6a', style: 'short', bangs: 'side', lock: 4, clip: '#ffd76a' }, body: { lg: 3, tr: 2, w: 8 },
    top: { c: '#e07a3a', c2: '#f4f4f0', front: 'zip', collar: 'high', sleeve: 'long' }, bottom: { style: 'trousers', c: '#3a4a5a' }, shoe: { c: '#3a3a3a' }, acc: [], face: { blush: '#f08a78', mouth: 'smile' } }),
  dad: T_({ name: 'Dad', portraitOnly: true, skin: '#ecc0a0', eyes: { c: '#3a2a20', shape: 'round' }, hair: { c: '#5a3a2a', h: '#8a6a4a', style: 'messy', bangs: 'side' }, body: { lg: 4, tr: 3, w: 9 },
    top: { c: '#f4f4f0', c2: '#f4f4f0', front: 'buttons', collar: 'high', sleeve: 'long', c3: '#c8c8c8' }, bottom: { style: 'trousers', c: '#3a3a4a' }, shoe: { c: '#3a3a3a' }, acc: [{ k: 'bandana', c: '#c8423a' }], face: { brow: 'thick', beard: 'stubble', mouth: 'smile' } }),
  nori: T_({ name: 'Aunt Nori', portraitOnly: true, skin: '#f6d6c0', eyes: { c: '#3a2a4a', shape: 'big' }, hair: { c: '#7a4ac8', h: '#a888e8', style: 'long', bangs: 'clump', lock: 12, len: 16 }, body: { lg: 3, tr: 2, w: 8 },
    top: { c: '#e8a8b8', c2: '#e8a8b8', collar: 'round', sleeve: 'long', wide: 1 }, bottom: { style: 'trousers', c: '#4a3a5a' }, shoe: { c: '#2a2a2a' }, acc: [{ k: 'glasses', c: '#2a2a2a', big: true }, { k: 'beret', c: '#e8a8c8' }], face: { mouth: 'smile' } }),
};

// ---------------------------------------------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------------------------------------------
const require = createRequire(import.meta.url);
export async function openStudio() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
  const dir = process.env.MOONKAI_DIR || `${process.env.HOME}/spaghettiosese/moonkai`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`file://${dir}/pixel/index.html`);
  await page.waitForFunction(() => typeof beginStroke === 'function' && typeof newDoc === 'function');
  return { browser, page };
}
// jobs: [{ spec, fw, fh, mode: 'sheet' | 'portrait', moods? }] -> [{ png, project }] (png as data URL)
export async function paintJobs(page, jobs) {
  const out = [];
  for (const j of jobs) out.push(await page.evaluate(painter, j));
  return out;
}
export const dataToBuffer = (u) => Buffer.from(u.split(',')[1], 'base64');
export const MOODS = ['neutral', 'happy', 'surprised', 'sad'];

// Contact sheet of everyone (colour rows for down/up/side plus a solid-ink silhouette row) for the lineup test.
export async function lineup(page, entries, outPath) {
  const data = await page.evaluate(async (entries) => {
    const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
    const imgs = await Promise.all(entries.map((e) => load(e.png)));
    const CW = 56, CH = 72, Z = 2, cv = document.createElement('canvas');
    cv.width = entries.length * CW * Z; cv.height = CH * Z * 4 + 8;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#c8d8c0'; g.fillRect(0, 0, cv.width, cv.height);
    const sil = document.createElement('canvas'); sil.width = 48; sil.height = 64;
    imgs.forEach((im, i) => {
      const e = entries[i], fw = e.fw, fh = e.fh, ox = Math.round((48 - fw) / 2), oy = 64 - fh;
      [0, 1, 2].forEach((row) => { g.drawImage(im, 0, row * fh, fw, fh, i * CW * Z + 4 * Z + ox * Z, row * CH * Z + 4 * Z + oy * Z, fw * Z, fh * Z); });
      const s = sil.getContext('2d'); s.clearRect(0, 0, 48, 64); s.drawImage(im, 0, 0, fw, fh, ox, oy, fw, fh);
      s.globalCompositeOperation = 'source-in'; s.fillStyle = '#2a1a22'; s.fillRect(0, 0, 48, 64); s.globalCompositeOperation = 'source-over';
      g.drawImage(sil, 0, 0, 48, 64, i * CW * Z + 4 * Z, 3 * CH * Z + 8 + 4 * Z, 48 * Z, 64 * Z);
    });
    return cv.toDataURL('image/png');
  }, entries);
  writeFileSync(outPath, dataToBuffer(data));
}

if (process.argv[1] && process.argv[1].endsWith('studio-cast.mjs')) {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith('-')), want = ids.length ? ids : Object.keys(CAST);
  const outDir = new URL('../assets/cast/', import.meta.url);
  mkdirSync(outDir, { recursive: true });
  const { browser, page } = await openStudio();
  const t0 = Date.now(), entries = [];
  for (const id of want) {
    const spec = CAST[id]; if (!spec) { console.error('unknown id', id); continue; }
    const jobs = [{ spec, fw: 48, fh: 64, mode: 'portrait', moods: MOODS }];
    if (!spec.portraitOnly) jobs.unshift({ spec, fw: 48, fh: 64, mode: 'sheet' });
    jobs[jobs.length - 1].fw = 64; jobs[jobs.length - 1].fh = 64;
    const res = await paintJobs(page, jobs);
    if (!spec.portraitOnly) {
      writeFileSync(new URL(`${id}.png`, outDir), dataToBuffer(res[0].png)); writeFileSync(new URL(`${id}.pxs.json`, outDir), JSON.stringify(res[0].project));
      entries.push({ id, png: res[0].png, fw: 48, fh: 64 });
    }
    const p = res[res.length - 1];
    writeFileSync(new URL(`${id}_portraits.png`, outDir), dataToBuffer(p.png)); writeFileSync(new URL(`${id}_portrait.pxs.json`, outDir), JSON.stringify(p.project));
    console.log('painted', id, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  // add Misa (40x48) to the lineup
  const misa = new URL('../assets/moonkai/misa_sheet.png', import.meta.url);
  if (existsSync(misa) && !ids.length) entries.unshift({ id: 'misa', png: 'data:image/png;base64,' + readFileSync(misa).toString('base64'), fw: 40, fh: 48 });
  if (entries.length > 1) await lineup(page, entries, new URL('_lineup.png', outDir).pathname);
  await browser.close();
}
