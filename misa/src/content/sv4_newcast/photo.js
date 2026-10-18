// Photography (sv4): Sora's pocket camera. A `Take a photo` target near landmarks opens the viewfinder minigame `sv4_camera`
// (pan the frame, put the subject on a thirds point, hold still, wait for good light), photos are kept in the Photo Album phone
// app and Sora hands out photo requests. Small exported API (another pack may add more photography on top):
//   SV4_PHOTO_TARGETS, photoTargetsFor(mapId), scorePhoto(shot), takePhoto(game, target), album(game), addPhoto(game, rec)
//   game.sv4Photo = { targets, album(), take(id) }; items: key_sv4_camera; bus: photoTaken { id, stars, score }
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { drawText, drawTextC, measure } from '../../font.js';
import { axis, act } from '../../input.js';
import { rect, disc, bands } from '../../minigames/hobbies/games.js';
import { dateText } from '../../core/time.js';
import { TILE } from '../../world/map.js';
import { sc, ch, mark, flag, time, mood, giveOr } from './util2.js';
import { S, clamp, pick } from './data.js';

register('item', 'key_sv4_camera', { name: 'Pocket camera', cat: 'key', key: true, price: 0, icon: itemIcon('box', { c: Rr.metal[2], c2: Rr.coral[2] }), desc: "Sora's spare camera. Stand near a landmark and press E to take a photo." });

// kind drives how the subject is painted in the viewfinder; light: 'night' targets want the dark, others want sunrise or golden hour.
export const SV4_PHOTO_TARGETS = [
  { id: 'town_fountain', map: 'town', spot: 'fountain', name: 'The fountain', kind: 'water', move: 6 },
  { id: 'town_clocktower', map: 'town', spot: 'clocktower', name: 'The clock tower', kind: 'tower', move: 0 },
  { id: 'town_stage', map: 'town', spot: 'stage', name: 'The festival stage', kind: 'shrine', move: 0 },
  { id: 'park_pond', map: 'park', spot: 'pond_edge', name: 'Pond reflections', kind: 'water', move: 3 },
  { id: 'park_sakura', map: 'park', spot: 'sakura_tree', name: 'The old sakura', kind: 'tree', move: 4 },
  { id: 'park_bridge', map: 'park', spot: 'bridge', name: 'The park bridge', kind: 'bridge', move: 0 },
  { id: 'harbour_dock', map: 'harbour', spot: 'dock', name: 'The harbour dock', kind: 'boat', move: 5 },
  { id: 'harbour_mural', map: 'harbour', spot: 'mural', name: 'The harbour mural', kind: 'shrine', move: 0 },
  { id: 'harbour_pier', map: 'harbour', spot: 'pier_end', name: 'The pier end', kind: 'boat', move: 4 },
  { id: 'beach_driftwood', map: 'beach', spot: 'driftwood', name: 'Driftwood on the sand', kind: 'tree', move: 0 },
  { id: 'beach_sandbar', map: 'beach', spot: 'sandbar', name: 'The sandbar', kind: 'water', move: 7 },
  { id: 'shrine_lookout', map: 'shrine', spot: 'lookout', name: 'The shrine lookout', kind: 'tower', move: 0 },
  { id: 'shrine_torii', map: 'shrine', spot: 'torii', name: 'The red torii', kind: 'shrine', move: 0 },
  { id: 'school_track', map: 'school_grounds', spot: 'track', name: 'The running track', kind: 'bridge', move: 8 },
  { id: 'school_greenhouse', map: 'school_grounds', spot: 'greenhouse', name: 'The greenhouse', kind: 'tower', move: 0 },
  { id: 'lane_vending', map: 'lane', spot: 'vending', name: 'The glowing vending machine', kind: 'lamp', move: 0, night: true },
  { id: 'shotengai_lanterns', map: 'shotengai', spot: 'lantern_row', name: 'The lantern row', kind: 'lamp', move: 3, night: true },
  { id: 'pines_garden', map: 'sunny_pines', spot: 'garden_bench', name: 'The Sunny Pines garden', kind: 'tree', move: 2 },
  { id: 'lighthouse_balcony', map: 'lighthouse', spot: 'balcony', name: 'The Star Lantern balcony', kind: 'tower', move: 2 },
  { id: 'cave_star', map: 'cave', spot: 'star_mark', name: 'The star mark in the cave', kind: 'lamp', move: 0, night: true },
];
export const targetById = (id) => SV4_PHOTO_TARGETS.find((t) => t.id === id);
export const photoTargetsFor = (mapId) => SV4_PHOTO_TARGETS.filter((t) => t.map === mapId);

// Light fit by hour: sunrise and golden hour are best; the dark suits lamps.
export const lightFit = (hour, t) => {
  const golden = (hour >= 5 && hour < 8) || (hour >= 16 && hour < 18.5);
  if (t && t.night) return hour >= 18.5 || hour < 5 ? 1 : golden ? 0.6 : 0.35;
  if (golden) return 1;
  return hour >= 8 && hour < 16 ? 0.6 : 0.4;
};
// Composition score of one shot: subject on a thirds point, inside the frame, a steady hand, good light. Pure; returns 0..1.
export function scorePhoto({ sx, sy, speed = 0, hour = 12, target }) {
  const W = 320, H = 224, pts = [[W / 3, H / 3], [2 * W / 3, H / 3], [W / 3, 2 * H / 3], [2 * W / 3, 2 * H / 3]];
  if (sx < 24 || sx > W - 24 || sy < 20 || sy > H - 20) return 0.08;
  const d = Math.min(...pts.map(([px, py]) => Math.hypot(px - sx, py - sy)));
  const comp = 1 - Math.min(1, d / 90), steady = 1 - Math.min(1, speed / 60), light = lightFit(hour, target);
  return clamp(0.55 * comp + 0.2 * steady + 0.25 * light, 0, 1);
}
export const starsOf = (score) => (score >= 0.8 ? 3 : score >= 0.55 ? 2 : 1);

// ------------------------------------------------------------------ the viewfinder minigame
const SKY = (h) => (h < 5 || h >= 19 ? [Rr.navy[0], Rr.navy[1], Rr.navy[2]] : h < 8 ? ['#f7b8a0', '#f9d2a8', '#fbe6c0'] : h >= 16 && h < 19 ? ['#f09a6a', '#f8c080', '#fbe2a8'] : ['#7ec0ec', '#a6d6f4', '#cfe8f8']);
class CameraGame {
  constructor(rng, { target, hour = 12 } = {}) {
    this.rng = rng; this.target = target || SV4_PHOTO_TARGETS[0]; this.hour = hour; this.title = 'Photo';
    this.cx = 80; this.cy = 56; this.vx = 0; this.vy = 0; this.t = 0; this.shots = []; this.film = 3; this.flash = 0; this.msg = ''; this.msgT = 0; this.done = false; this.score = 0;
    this.bx = 150 + Math.floor(rng() * 180); this.by = 120 + Math.floor(rng() * 110); this.speed = 0;
  }
  get subject() { const m = this.target.move || 0, t = this.t; return { x: this.bx + Math.sin(t * 0.9) * m * 2, y: this.by + Math.cos(t * 0.7) * m }; }
  shoot() {
    const s = this.subject, sc0 = scorePhoto({ sx: s.x - this.cx, sy: s.y - this.cy, speed: this.speed, hour: this.hour, target: this.target });
    this.shots.push(sc0); this.film--; this.flash = 0.25; this.msgT = 1;
    this.msg = sc0 >= 0.8 ? 'PERFECT FRAME!' : sc0 >= 0.55 ? 'NICE SHOT' : 'TRY A THIRDS POINT';
    if (this.film <= 0) this.finish();
  }
  finish() { this.done = true; this.score = this.shots.length ? Math.max(...this.shots) : 0.1; this.result = { text: `${this.target.name}: ${'*'.repeat(starsOf(this.score))}` }; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.msgT = Math.max(0, this.msgT - dt);
    const a = axis(input); let nx = this.cx, ny = this.cy;
    if (a.x || a.y) { nx += a.x * 95 * dt; ny += a.y * 95 * dt; } else if (input.moved) { nx += ((input.mx / 320) * 160 - this.cx) * Math.min(1, dt * 6); ny += ((input.my / 224) * 112 - this.cy) * Math.min(1, dt * 6); }
    nx = clamp(nx, 0, 160); ny = clamp(ny, 0, 112);
    this.speed = Math.hypot(nx - this.cx, ny - this.cy) / Math.max(dt, 1e-3); this.cx = nx; this.cy = ny;
    if (act(input) && this.film > 0) this.shoot();
    if (this.t > 40 && !this.done) this.finish();
  }
  draw(g) {
    const [a, b, c] = SKY(this.hour), t = this.target, ox = -this.cx, oy = -this.cy;
    g.save(); g.beginPath(); g.rect(0, 0, 320, 224); g.clip();
    bands(g, [a, b, c], 0, 150 + oy);
    rect(g, this.hour < 5 || this.hour >= 19 ? Rr.navy[2] : Rr.forest[2], 0, 150 + oy, 320, 400);
    disc(g, this.hour < 5 || this.hour >= 19 ? '#e8e8f8' : '#fff6c8', 380 + ox, 40 + oy, 14);
    for (let i = 0; i < 5; i++) { const hx = 40 + i * 110 + ox, hy = 160 + oy; disc(g, this.hour < 5 || this.hour >= 19 ? Rr.navy[1] : Rr.forest[3], hx, hy, 70, 26); }
    rect(g, t.kind === 'water' || t.kind === 'boat' ? Rr.sky[2] : Rr.forest[2], 0, 170 + oy, 480 + ox + 40, 180);
    for (let i = 0; i < 4; i++) { const px = 60 + i * 120 + ox, py = 185 + (i % 2) * 40 + oy; rect(g, Rr.woodDark[2], px, py - 20, 3, 20); disc(g, Rr.forest[1], px + 1, py - 24, 9, 10); }
    const s = this.subject, sx = s.x + ox, sy = s.y + oy, K = t.kind;
    if (K === 'water' || K === 'boat') { rect(g, Rr.sky[1], sx - 40, sy - 6, 80, 12); for (let i = 0; i < 6; i++) rect(g, '#ffffff80', sx - 36 + i * 13, sy - 4 + (i % 2) * 6, 8, 1); if (K === 'boat') { rect(g, Rr.wood[1], sx - 16, sy - 10, 32, 8); rect(g, Rr.paper[4], sx - 2, sy - 30, 3, 22); rect(g, Rr.paper[3], sx + 2, sy - 30, 14, 18); } else disc(g, '#ffffffa0', sx, sy, 10, 3); }
    else if (K === 'tower') { rect(g, Rr.paper[3], sx - 9, sy - 40, 18, 44); rect(g, Rr.coral[2], sx - 12, sy - 48, 24, 8); rect(g, Rr.butter[2], sx - 3, sy - 30, 6, 8); }
    else if (K === 'tree') { rect(g, Rr.woodDark[2], sx - 3, sy - 22, 6, 24); disc(g, Rr.sakura[3], sx, sy - 30, 22, 16); disc(g, Rr.sakura[2], sx - 10, sy - 24, 12, 9); }
    else if (K === 'shrine') { rect(g, Rr.coral[1], sx - 22, sy - 36, 4, 40); rect(g, Rr.coral[1], sx + 18, sy - 36, 4, 40); rect(g, Rr.coral[2], sx - 28, sy - 42, 56, 6); rect(g, Rr.ink[2], sx - 24, sy - 34, 48, 3); }
    else if (K === 'bridge') { rect(g, Rr.wood[2], sx - 40, sy - 8, 80, 6); rect(g, Rr.wood[1], sx - 40, sy - 20, 3, 14); rect(g, Rr.wood[1], sx + 37, sy - 20, 3, 14); rect(g, Rr.wood[3], sx - 40, sy - 21, 80, 2); }
    else { rect(g, Rr.charcoal[2], sx - 3, sy - 34, 6, 38); disc(g, Rr.butter[3], sx, sy - 38, 8, 8); disc(g, '#fff6c8a0', sx, sy - 38, 15, 15); }
    g.restore();
    // viewfinder: thirds grid, corner brackets, HUD
    for (const x of [107, 213]) rect(g, '#ffffff60', x, 0, 1, 224);
    for (const y of [75, 149]) rect(g, '#ffffff60', 0, y, 320, 1);
    for (const [px, py] of [[107, 75], [213, 75], [107, 149], [213, 149]]) { rect(g, '#ffffffc0', px - 3, py, 7, 1); rect(g, '#ffffffc0', px, py - 3, 1, 7); }
    for (const [px, py, dx, dy] of [[10, 22, 1, 1], [310, 22, -1, 1], [10, 214, 1, -1], [310, 214, -1, -1]]) { rect(g, '#fff', px, py, 14 * dx || 1, 1); rect(g, '#fff', px, py, 1, 14 * dy || 1); if (dx < 0) rect(g, '#fff', px - 13, py, 14, 1); if (dy < 0) rect(g, '#fff', px, py - 13, 1, 14); }
    rect(g, '#2b1d2ee0', 0, 0, 320, 14); drawText(g, `PHOTO: ${this.target.name.toUpperCase()}`, 6, 4, Rr.butter[3], 1, null);
    const fl = `FILM ${this.film}`; drawText(g, fl, 314 - measure(fl), 4, Rr.paper[4], 1, null);
    const hint = 'ARROWS OR MOUSE: MOVE THE FRAME.  SPACE: SHUTTER'; rect(g, '#2b1d2ed0', 160 - measure(hint) / 2 - 4, 207, measure(hint) + 8, 11); drawTextC(g, hint, 160, 210, Rr.paper[4], 1, null);
    if (this.msgT > 0) drawTextC(g, this.msg, 160, 100 - Math.round((1 - this.msgT) * 8), Rr.butter[3], 2, '#2b1d2e');
    if (this.flash > 0) rect(g, `rgba(255,255,255,${this.flash * 3})`, 0, 0, 320, 224);
  }
}
const cameraBot = (m, t, inp) => {
  const s = m.subject, tx = clamp(s.x - 107, 0, 160), ty = clamp(s.y - 75, 0, 112);
  inp.moved = true; inp.mx = (tx / 160) * 320; inp.my = (ty / 112) * 224;
  if (Math.hypot(m.cx - tx, m.cy - ty) < 3 && m.speed < 14 && Math.floor(m.t * 60) % 20 === 0) inp.pressed = new Set([' ']);
  return inp;
};
register('minigame', 'sv4_camera', { title: 'Photo', resultTitle: 'PHOTO TAKEN!', make: (g, o) => new CameraGame(g.rng, { target: typeof o.target === 'string' ? targetById(o.target) : o.target, hour: o.hour ?? g.minutes / 60 }), bot: cameraBot });

// ------------------------------------------------------------------ album and requests
export const album = (game) => S(game).photos;
export function addPhoto(game, rec) {
  const a = album(game); a.unshift(rec); if (a.length > 60) a.length = 60;
  S(game).shots++; return rec;
}
export const REQUESTS = [
  { id: 'rq_fountain', title: 'A sparkling fountain', target: 'town_fountain', min: 1, coins: 80, text: 'Catch the splash at the top of its arc.' },
  { id: 'rq_dock_dawn', title: 'The harbour at dawn', target: 'harbour_dock', min: 2, when: 'time<9:00', coins: 110, item: 'gift_postcard', text: 'Before nine, while the ropes still have dew on them.' },
  { id: 'rq_lookout', title: 'Golden hour from the lookout', target: 'shrine_lookout', min: 2, when: 'time>=16:30', coins: 130, item: 'gift_star_sketch', text: 'After half past four. The steps are worth it.' },
  { id: 'rq_pond', title: 'Pond reflections', target: 'park_pond', min: 2, when: 'weather:sunny', coins: 110, text: 'A calm, sunny day and a still pond.' },
  { id: 'rq_rain', title: 'A wet street', target: 'town_clocktower', min: 1, when: 'weather:rain', coins: 100, text: 'The clock tower in the rain, if you do not mind getting damp.' },
  { id: 'rq_driftwood', title: 'Driftwood at low sun', target: 'beach_driftwood', min: 2, when: { any: ['time<9:00', 'time>=16:30'] }, coins: 120, text: 'Early or late, never noon.' },
  { id: 'rq_lanterns', title: 'Lanterns after dark', target: 'shotengai_lanterns', min: 2, when: 'time>=18:00', coins: 150, text: 'The shotengai lanterns once the sky goes dark.' },
  { id: 'rq_blossom', title: 'The old sakura', target: 'park_sakura', min: 2, when: 'season:spring', coins: 140, item: 'gift_pressed_flower', text: 'Only in spring. Do not shoot it pink fog.' },
  { id: 'rq_snow', title: 'Snow on the track', target: 'school_track', min: 2, when: 'season:winter', coins: 140, text: 'The school track under fresh snow.' },
  { id: 'rq_star', title: 'The Star Lantern', target: 'lighthouse_balcony', min: 3, coins: 220, item: 'gift_compass', text: 'A perfect frame of the balcony. Three stars or nothing.' },
];
const Q = (g, id) => (S(g).reqs[id] ||= { state: 'new' });
export const activeRequest = (g) => REQUESTS.find((r) => Q(g, r.id).state === 'active' || Q(g, r.id).state === 'ready');
export const nextRequest = (g) => REQUESTS.find((r) => Q(g, r.id).state === 'new');
export const requestsDone = (g) => REQUESTS.filter((r) => Q(g, r.id).state === 'done').length;

export async function takePhoto(game, target) {
  if (!game.has('key_sv4_camera')) return game.toast('You need a camera. Sora might lend you one.', null);
  if (game.energy < 2) return game.toast('Too tired to hold the camera steady.', null);
  const hour = game.minutes / 60, r = await game.minigame('sv4_camera', { target, hour });
  if (!r || r.quit) return null;
  game.useEnergy(2); game.advance(10);
  const score = r.score, stars = starsOf(score);
  const eyeBonus = game.state.flags.nc_sora_eye ? 0.05 : 0;
  const rec = addPhoto(game, { id: `${target.id}_${game.day}_${game.minutes}`, day: game.day, target: target.id, name: target.name, map: target.map, score: Math.min(1, score + eyeBonus), stars: starsOf(Math.min(1, score + eyeBonus)), hour: Math.round(hour), weather: game.weather, season: game.season });
  game.addXP('crafting', 2 + rec.stars); game.stat('photosTaken');
  const rq = activeRequest(game);
  if (rq && rq.target === target.id && Q(game, rq.id).state === 'active' && rec.stars >= rq.min && (!rq.when || game.check(rq.when))) { Q(game, rq.id).state = 'ready'; Q(game, rq.id).photo = rec.id; game.toast(`That is the shot Sora asked for: ${rq.title}`, 'heart'); }
  game.bus.emit('photoTaken', { id: target.id, stars: rec.stars, score: rec.score });
  void stars;
  game.toast(`Saved to the album: ${target.name} (${rec.stars} star${rec.stars > 1 ? 's' : ''})`, 'i_star');
  return rec;
}

register('targetProvider', 'sv4_camera', {
  find(world, game) {
    if (!game.has || !game.has('key_sv4_camera')) return null;
    const list = photoTargetsFor(world.map.id); if (!list.length) return null;
    const spots = (get('map', world.map.id) || {}).spots || {}, p = world.player;
    let best = null, bd = 80;
    for (const t of list) { const sp = spots[t.spot]; if (!sp) continue; const d = Math.hypot(sp[0] * TILE + 8 - p.x, sp[1] * TILE + 8 - (p.y - 3)); if (d < bd) { bd = d; best = t; } }
    return best ? { label: `Take a photo: ${best.name}`, dist: Math.max(0, bd - 36), run: (g) => takePhoto(g, best) } : null;
  },
});

// Sora's requests: she offers the next one when you carry the camera, and pays when the matching photo is ready.
const ASK = ['I have a job for my apprentice.', 'Got a minute? I need a particular shot, and I need it from you.', 'Request time. Don\'t worry, it\'s a nice one.'];
register('talkHook', 'nc_sora_offer', { npc: 'sora', priority: 35, when: (g) => g.has('key_sv4_camera') && g.hearts('sora') >= 2 && !activeRequest(g) && !!nextRequest(g) && (g.state.sv4nc.reqDay || 0) !== g.day,
  steps: (g) => { const rq = nextRequest(g) || REQUESTS[0]; return sc('sora', { t: 'call', fn: (gg) => { S(gg).reqDay = gg.day; Q(gg, rq.id).state = 'active'; gg.toast(`Photo request: ${rq.title}`, 'i_star'); } },
    `happy|${ASK[0]}`, `I need: ${rq.title}. ${rq.text}`, `Rating needed: ${rq.min} star${rq.min > 1 ? 's' : ''} or better. The reward is ${rq.coins} coins${rq.item ? ' and a little extra' : ''}.`,
    ch('Will you do it?', ['Leave it to me', 'happy|That is the spirit. Stand near it, press E, and wait for the light.', 5], ['Show me the basics again', 'Frame the subject on a thirds point, keep the camera still when you press, and shoot in sunrise or golden hour. Lamps like the dark.', 3]), time(5)); } });
register('talkHook', 'nc_sora_turnin', { npc: 'sora', priority: 36, when: (g) => { const r = activeRequest(g); return !!r && Q(g, r.id).state === 'ready'; },
  steps: (g) => { const rq = activeRequest(g) || REQUESTS[0]; return sc('sora', { t: 'call', fn: (gg) => { const q = Q(gg, rq.id); q.state = 'done'; q.day = gg.day; gg.addMoney(rq.coins); if (rq.item) giveOr(rq.item, 0).fn(gg); gg.stat('photoRequests'); gg.addXP('crafting', 6); gg.bus.emit('photoRequestDone', { id: rq.id }); } },
    "happy|Let me see... oh. Oh, that's good. That's actually good.", `That's ${rq.title} done. ${rq.coins} coins, as promised.`, 12, mood(6)); } });

// ------------------------------------------------------------------ phone app: Photo Album
register('phoneApp', 'sv4_album', {
  name: 'Photo Album', icon: 'i_star', order: 47,
  when: (g) => g.has('key_sv4_camera') || album(g).length > 0,
  badge: (g) => { const r = activeRequest(g); return r && Q(g, r.id).state === 'ready' ? 1 : 0; },
  open(game, app) { app.state.sel = 0; },
  update(dt, input, game, app) {
    const n = album(game).length, k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) app.state.sel = Math.min(n - 1, app.state.sel + 1);
    if (k.has('arrowup') || k.has('w')) app.state.sel = Math.max(0, app.state.sel - 1);
    app.state.sel = Math.max(0, app.state.sel);
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, list = album(game), sel = Math.min(app.state.sel, Math.max(0, list.length - 1));
    rect(g, Rr.paper[3], x, y, w, h);
    const rq = activeRequest(game);
    drawText(g, `PHOTOS ${list.length}   REQUESTS ${requestsDone(game)}/${REQUESTS.length}`, x + 4, y + 3, Rr.ink[2], 1, null);
    if (rq) drawText(g, `${Q(game, rq.id).state === 'ready' ? 'READY: ' : 'SORA: '}${rq.title}`.toUpperCase().slice(0, 44), x + 4, y + 13, Q(game, rq.id).state === 'ready' ? Rr.forest[1] : Rr.coral[1], 1, null);
    if (!list.length) { drawText(g, 'NO PHOTOS YET. STAND NEAR A LANDMARK AND PRESS E.', x + 4, y + 40, Rr.ink[3], 1, null); return; }
    const top = Math.max(0, Math.min(sel - 4, list.length - 9));
    list.slice(top, top + 9).forEach((p, i) => {
      const yy = y + 26 + i * 15, on = top + i === sel, [a] = SKY(p.hour);
      rect(g, on ? Rr.butter[3] : Rr.paper[2], x + 2, yy, w - 4, 14);
      rect(g, a, x + 4, yy + 2, 16, 10); rect(g, Rr.forest[2], x + 4, yy + 8, 16, 4);
      drawText(g, p.name.toUpperCase().slice(0, 26), x + 24, yy + 3, Rr.ink[1], 1, null);
      drawText(g, '*'.repeat(p.stars), x + w - 30, yy + 3, Rr.butter[1], 1, null);
    });
    const p = list[sel]; if (p) drawText(g, `${dateText(p.day)}  ${p.hour}:00  SCORE ${Math.round(p.score * 100)}`.toUpperCase(), x + 4, y + h - 10, Rr.ink[3], 1, null);
  },
});

register('system', 'sv4_photo', { init(game) { game.sv4Photo = { targets: SV4_PHOTO_TARGETS, album: () => album(game), take: (id) => takePhoto(game, targetById(id)), requests: REQUESTS }; } });
void pick; void flag; void mark; void get;

features('New Cast', [
  "Sora lends Misa a pocket camera at 2 hearts (key item), the start of the photography lessons",
  'Take a photo: stand near one of twenty landmarks (fountain, clock tower, pond, harbour dock, lookout, lanterns...) and press E to open the viewfinder',
  'Viewfinder minigame: move the frame with arrows or mouse, put the subject on a thirds point, hold steady and shoot three frames; the best one counts',
  'Photo scoring rewards composition, a steady hand and good light: sunrise and golden hour for scenery, darkness for lamps and lanterns',
  'Photo Album phone app: every shot is saved with its place, date, stars and score, newest first',
  "Sora's photo requests: ten one-time assignments (a dawn dock, golden hour lookout, rainy clock tower, spring blossom...) with weather, season and time conditions",
  'Sora pays coins and keepsakes for each finished request, and the album badge lights up when a shot is ready to hand in',
  "At 8 hearts Sora teaches Misa to see composition: every photo scores a little higher",
]);
