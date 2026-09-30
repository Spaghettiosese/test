// The map: a fog-of-war picture of the whole level painted from the navigation grid as you
// explore, shown full-screen (M) and as a small minimap. Also draws Wraith Sight markers.
import { REGIONS, LANDMARKS } from './level/wilds.js';

const S = 4, PX = 3;               // one map block = 4 m, painted 3 px wide
const COL = { void: '#0b0710', grass: '#2c3a2c', mud: '#4a3a2c', cobble: '#5c5666', wall: '#a89cb8', indoor: '#7a5a48', water: '#1e4058', fen: '#26382c', ash: '#4a4644', forest: '#1c2e24', crypt: '#4a3a5c', field: '#5a5028', stoneOld: '#6a6070' };

export class WorldMap {
  constructor(g) {
    this.g = g; const nav = g.nav; this.nav = nav;
    this.bw = Math.ceil(nav.w / S); this.bh = Math.ceil(nav.d / S);
    this.seen = new Uint8Array(this.bw * this.bh);
    this.cv = document.createElement('canvas'); this.cv.width = this.bw * PX; this.cv.height = this.bh * PX;
    this.ctx = this.cv.getContext('2d'); this.ctx.fillStyle = COL.void; this.ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    this.water = g.level.mapWater || []; this.t = 0; this.zoom = 1; this.pins = [];
  }
  bx(x) { return (x - this.nav.x0) / S; }
  bz(z) { return (z - this.nav.z0) / S; }
  color(bx, bz) {
    const nav = this.nav, x0 = nav.x0 + bx * S, z0 = nav.z0 + bz * S;
    for (const w of this.water) if (x0 + 2 > w[0] && x0 + 2 < w[2] && z0 + 2 > w[1] && z0 + 2 < w[3]) return COL.water;
    let blocked = 0, indoor = 0, under = 0, noise = 0, n = 0;
    for (let dz = 0; dz < S; dz += 2) for (let dx = 0; dx < S; dx += 2) {
      const i = nav.at(x0 + dx + 0.5, z0 + dz + 0.5); if (i < 0) continue; n++;
      if (nav.blocked[i]) blocked++; if (nav.indoor[i] === 1) indoor++; if (nav.indoor[i] === 2) under++; noise = Math.max(noise, nav.noise[i]);
    }
    if (!n) return COL.void;
    if (under) return blocked > n / 2 ? COL.stoneOld : COL.crypt;
    if (indoor >= n / 2) return blocked > n / 2 ? COL.wall : COL.indoor;
    if (blocked >= n * 0.75) return COL.wall;
    if (blocked >= 1) return COL.forest;
    if (noise === 1) return COL.cobble;
    const cx = x0 + 2, cz = z0 + 2;
    for (const r of REGIONS) if (cx > r.rect[0] && cx < r.rect[2] && cz > r.rect[1] && cz < r.rect[3]) return { fen: COL.fen, cinder: COL.ash, farms: COL.field, mire: COL.grass }[r.id] || COL.mud;
    return COL.mud;
  }
  paint(bx, bz) { const i = bz * this.bw + bx; if (this.seen[i]) return; this.seen[i] = 1; this.ctx.fillStyle = this.color(bx, bz); this.ctx.fillRect(bx * PX, (this.bh - 1 - bz) * PX, PX, PX); }
  reveal(x, z, r = 24) {
    const cx = Math.floor(this.bx(x)), cz = Math.floor(this.bz(z)), rb = Math.ceil(r / S);
    for (let dz = -rb; dz <= rb; dz++) for (let dx = -rb; dx <= rb; dx++) {
      const bx = cx + dx, bz = cz + dz; if (bx < 0 || bz < 0 || bx >= this.bw || bz >= this.bh) continue;
      if (dx * dx + dz * dz <= rb * rb) this.paint(bx, bz);
    }
  }
  pin() { const P = this.g.player; this.pins.push([P.pos[0], P.pos[2]]); if (this.pins.length > 8) this.pins.shift(); this.g.toast(`Map pin ${this.pins.length}/8 placed`); this.g.sfx.pick?.(); }
  unpin() { if (this.pins.length) { this.pins.pop(); this.g.toast('Last pin removed'); } }
  revealAll() { for (let bz = 0; bz < this.bh; bz++) for (let bx = 0; bx < this.bw; bx++) this.paint(bx, bz); }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.6;
    const P = this.g.player; if (!P || !P.pos) return; this.reveal(P.pos[0], P.pos[2], this.g.indoorK > 0.5 ? 10 : 26);
  }
  toMap(x, z) { return [(this.bx(x)) * PX, (this.bh - this.bz(z)) * PX]; }
  arrow(ctx, x, y, yaw, s = 5) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-yaw + Math.PI); ctx.fillStyle = '#ffe9a8'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s, s); ctx.lineTo(0, s * 0.5); ctx.lineTo(-s, s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  diamond(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  overlays(ctx, ox, oy, sc, labels) {
    const g = this.g, P = g.player, tx = (x, z) => { const [mx, my] = this.toMap(x, z); return [ox + mx * sc, oy + my * sc]; };
    ctx.font = '11px monospace'; ctx.textAlign = 'center';
    if (labels) for (const L of LANDMARKS) {
      const bx = Math.floor(this.bx(L.x)), bz = Math.floor(this.bz(L.z)); if (!this.seen[bz * this.bw + bx]) continue;
      const [x, y] = tx(L.x, L.z); ctx.fillStyle = '#e6dcc8'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(L.name, x, y - 5); ctx.fillText(L.name, x, y - 5); ctx.fillStyle = L.c || '#c8a8ff'; ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    for (const k in (g.level.pois)) if (k.startsWith('ws_')) { const p = g.level.pois[k], [x, y] = tx(p.x, p.z + 1.3); this.diamond(ctx, x, y, 4, g.quests.lit.has(k) ? '#a56cff' : '#4a3a60'); }
    const t = g.story.objectiveTarget?.(); if (t) { const [x, y] = tx(t[0], t[1]); this.diamond(ctx, x, y, 5, '#e0b450'); }
    this.pins.forEach(([x, z], i) => { const [a, b] = tx(x, z); ctx.fillStyle = '#ff5a5a'; ctx.strokeStyle = '#000'; ctx.fillRect(a - 1, b - 8, 2, 8); ctx.beginPath(); ctx.moveTo(a + 1, b - 8); ctx.lineTo(a + 7, b - 6); ctx.lineTo(a + 1, b - 4); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    const [px, py] = tx(P.pos[0], P.pos[2]); this.arrow(ctx, px, py, P.yaw, 5);
  }
  drawFull(canvas) {
    const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height; ctx.fillStyle = '#0b0710'; ctx.fillRect(0, 0, W, H);
    const sc = Math.min(W / this.cv.width, H / this.cv.height), ox = (W - this.cv.width * sc) / 2, oy = (H - this.cv.height * sc) / 2;
    ctx.drawImage(this.cv, ox, oy, this.cv.width * sc, this.cv.height * sc);
    this.overlays(ctx, ox, oy, sc, true);
  }
  drawMini(canvas) {
    const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height, P = this.g.player, sc = 1.4 * this.zoom;
    ctx.fillStyle = '#0b0710'; ctx.fillRect(0, 0, W, H);
    const [mx, my] = this.toMap(P.pos[0], P.pos[2]);
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 2, 0, 6.283); ctx.clip();
    ctx.drawImage(this.cv, W / 2 - mx * sc, H / 2 - my * sc, this.cv.width * sc, this.cv.height * sc);
    this.overlays(ctx, W / 2 - mx * sc, H / 2 - my * sc, sc, false);
    // guards you can see right now, with the way they face
    for (const n of this.g.stealth.seenNow) { if (n.dead) continue; const [ax, ay] = this.toMap(n.x, n.z), sx = W / 2 - mx * sc + ax * sc, sy = H / 2 - my * sc + ay * sc, hunt = n.state === 'chase' || n.state === 'attack'; ctx.fillStyle = hunt ? 'rgba(255,80,70,0.85)' : 'rgba(255,190,80,0.85)'; ctx.strokeStyle = 'rgba(255,190,80,0.3)'; ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, 6.283); ctx.fill(); const fx = Math.sin(n.yaw), fz = Math.cos(n.yaw); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (fx * Math.cos(0.5) - fz * Math.sin(0.5)) * 14, sy - (fz * Math.cos(0.5) + fx * Math.sin(0.5)) * 14); ctx.moveTo(sx, sy); ctx.lineTo(sx + (fx * Math.cos(-0.5) - fz * Math.sin(-0.5)) * 14, sy - (fz * Math.cos(-0.5) + fx * Math.sin(-0.5)) * 14); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = '#4a3560'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 1.5, 0, 6.283); ctx.stroke();
  }
  // ---------------------------------------------------------------- stealth feedback: who is suspicious, and where
  drawThreat(ctx, W, H) {
    const g = this.g, P = g.player; if (g.mode !== 'play' || P.dead) return;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.27;
    ctx.lineCap = 'round';
    for (const n of g.npcs) {
      if (n.dead || !n.guard || n.dist > 46) continue;
      const hunt = n.state === 'chase' || n.state === 'attack', sus = n.state === 'investigate' || n.state === 'search' || n.state === 'notice';
      if (!hunt && !sus && n.alert < 0.18) continue;
      const a = Math.atan2(n.x - P.pos[0], n.z - P.pos[2]); let d = a - P.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const ang = -Math.PI / 2 - d, w = hunt ? 0.34 : 0.26, col = hunt ? '255,80,70' : sus ? '255,160,60' : '255,220,90', al = hunt ? 0.85 : Math.min(0.8, 0.25 + n.alert);
      ctx.strokeStyle = `rgba(${col},${al})`; ctx.lineWidth = hunt ? 7 : 5; ctx.beginPath(); ctx.arc(cx, cy, R, ang - w, ang + w); ctx.stroke();
    }
    // above-head marks on guards you can see
    const cam = g.camera, f = P.forward, e = cam.position; ctx.textAlign = 'center';
    for (const n of g.stealth.seenNow) {
      if (n.dead) continue; const hunt = n.state === 'chase' || n.state === 'attack', sus = n.state === 'investigate' || n.state === 'search' || n.state === 'notice';
      if (!hunt && !sus && n.alert < 0.22) continue;
      const hx = n.x, hy = n.y + 2.15, hz = n.z, dx = hx - e[0], dy = hy - e[1], dz = hz - e[2]; if (dx * f[0] + dy * f[1] + dz * f[2] < 0.5) continue;
      const p = cam.project([hx, hy, hz]), sx = (p[0] * 0.5 + 0.5) * W, sy = (0.5 - p[1] * 0.5) * H;
      const col = hunt ? '#ff5a4a' : sus ? '#ffa03c' : '#ffe05a'; const fill = hunt ? 1 : Math.min(1, n.alert);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.fillStyle = col; ctx.font = 'bold 26px monospace'; const ch = hunt ? '!' : '?'; ctx.strokeText(ch, sx, sy); ctx.fillText(ch, sx, sy);
      ctx.fillStyle = '#000'; ctx.fillRect(sx - 14, sy + 6, 28, 5); ctx.fillStyle = col; ctx.fillRect(sx - 13, sy + 7, 26 * fill, 3);
    }
  }
  // ---------------------------------------------------------------- wraith sight overlay
  drawSight(canvas) {
    const g = this.g, T = g.tools, ctx = canvas.getContext('2d'); if (!ctx) return;
    if (canvas.width !== innerWidth || canvas.height !== innerHeight) { canvas.width = innerWidth; canvas.height = innerHeight; }
    const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H);
    this.drawThreat(ctx, W, H);
    if (T.sightT <= 0 || g.mode !== 'play') return;
    const cam = g.camera, f = g.player.forward, e = cam.position, a = Math.min(1, T.sightT / 1.5);
    ctx.globalAlpha = a; ctx.lineWidth = 2;
    const draw = (x, y, z, col, r, label) => {
      const dx = x - e[0], dy = y - e[1], dz = z - e[2]; if (dx * f[0] + dy * f[1] + dz * f[2] < 0.2) return;
      const p = cam.project([x, y, z]); const sx = (p[0] * 0.5 + 0.5) * W, sy = (0.5 - p[1] * 0.5) * H; if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
      ctx.strokeStyle = col; ctx.fillStyle = col + '44'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.283); ctx.fill(); ctx.stroke();
      if (label) { ctx.fillStyle = col; ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.fillText(label, sx, sy - r - 4); }
    };
    for (const n of g.npcs) {
      if (n.dead || n.dist > 50 || !n.visible && n.dist > 30) continue;
      const hunt = n.state === 'chase' || n.state === 'attack', alert = n.alert > 0.3 || n.state === 'investigate' || n.state === 'search';
      const col = n.role === 'hollow' ? '#c07cff' : hunt ? '#ff5a5a' : alert ? '#ffcf5a' : n.guard ? '#ff9a6a' : '#7ad0a0';
      const d = Math.max(4, 18 - n.dist * 0.18); draw(n.x, n.y + 1.5, n.z, col, d, n.dist < 18 ? n.name.split(' ')[0] : '');
      if (n.guard && g.player.mod?.sight > 1 && n.dist < 40) { // view cone hint
        const fx = n.fwd[0], fz = n.fwd[1]; const p1 = cam.project([n.x, n.y + 1.5, n.z]), p2 = cam.project([n.x + fx * 6, n.y + 1.5, n.z + fz * 6]);
        ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo((p1[0] * 0.5 + 0.5) * W, (0.5 - p1[1] * 0.5) * H); ctx.lineTo((p2[0] * 0.5 + 0.5) * W, (0.5 - p2[1] * 0.5) * H); ctx.stroke();
      }
    }
    for (const c of g.level.containers) if (!c.opened && Math.hypot(c.x - e[0], c.z - e[2]) < 22) draw(c.x, c.y + 0.4, c.z, '#e0b450', 6, c.locked ? 'locked' : '');
    for (const t of g.level.torches) if (t.lit && !t.small && Math.hypot(t.x - e[0], t.z - e[2]) < 26) draw(t.x, t.y, t.z, '#ff9a48', 3, '');
    ctx.globalAlpha = 1;
  }
}
