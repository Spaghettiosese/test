// Town ambience: the map name banner, lit windows at night (emissive glass), baked ground decals (road markings,
// crossings, the school track, the plaza rosette, spring petals and autumn leaf litter under the trees), overhead
// power lines between utility poles, and the glass canopy over the shotengai.
import { register, get, features } from '../../core/registry.js';
import { check } from '../../core/cond.js';
import { RAMPS, hash } from './lib.js';
import { drawText, measure } from '../../font.js';

export const TOWN_MAPS = new Set(['yard', 'lane', 'town', 'park', 'shotengai', 'school_grounds']);

// ---------------- map name banner ----------------
const banner = { name: null, sub: '', t: -99 };
const SUBTITLE = { yard: 'Home sweet home', lane: 'Hoshimori Bay', town: 'Hoshimori Bay', park: 'Hoshimori Bay', shotengai: 'Hoshimori Bay', school_grounds: 'Class 2-B' };
register('system', 'town_ambience', {
  init(game) {
    let last = null;
    game.bus.on('mapEnter', ({ map }) => {
      const def = get('map', map);
      if (!def || !def.name || def.noBanner || map === last) { last = map; return; }
      last = map;
      Object.assign(banner, { name: def.name, sub: SUBTITLE[map] || (def.outdoor ? 'Hoshimori Bay' : ''), t: game.clock });
    });
    game.bus.on('dayStart', () => { game.setFlag('lucky_today', false); });
  },
});
register('hud', 'town_banner', {
  draw(g, game) {
    const dt = game.clock - banner.t;
    if (!banner.name || dt > 3.2 || dt < 0) return;
    const ease = dt < 0.35 ? dt / 0.35 : dt > 2.8 ? Math.max(0, (3.2 - dt) / 0.4) : 1;
    const w = Math.max(measure(banner.name), measure(banner.sub)) + 28, x = Math.round(160 - w / 2), y = Math.round(-30 + ease * 64);
    g.fillStyle = 'rgba(30,22,36,0.5)'; g.fillRect(x + 1, y + 1, w, 26);
    g.fillStyle = RAMPS.ink[1]; g.fillRect(x, y, w, 26);
    g.fillStyle = '#2b1d2e'; g.fillRect(x + 1, y + 1, w - 2, 24);
    g.fillStyle = RAMPS.paper[3]; g.fillRect(x + 1, y + 1, w - 2, 1);
    g.fillStyle = RAMPS.butter[2]; g.fillRect(x + 8, y + 15, w - 16, 1); g.fillRect(x + 4, y + 13, 2, 2); g.fillRect(x + w - 6, y + 13, 2, 2);
    drawText(g, banner.name, Math.round(160 - measure(banner.name) / 2), y + 5, RAMPS.butter[3]);
    if (banner.sub) drawText(g, banner.sub, Math.round(160 - measure(banner.sub) / 2), y + 18, RAMPS.paper[2]);
  },
});

// ---------------- lit windows (emissive glass after the lightmap) ----------------
function litWindows(g, dark) {
  const w = litWindows.world, game = litWindows.game;
  if (!w || !w.map || dark < 0.2 || !TOWN_MAPS.has(w.map.id)) return;
  const a = Math.min(1, (dark - 0.2) * 1.6), mins = game.minutes;
  g.globalAlpha = a;
  for (const o of w.map.objects) {
    if (!o.glass || (o.when && !check(o.when, game))) continue;
    const X = w.sx(o.x * 16 + (o.dx || 0)), Y = w.sy((o.y + o.h) * 16 + (o.dy || 0)) - o.glassH;
    if (X > 330 || Y > 240 || X + 600 < 0 || Y + o.glassH < -10) continue;
    o.glass.forEach(([gx, gy, gw, gh], i) => {
      const until = o.litUntil - (o.shopGlow ? 0 : Math.floor(hash(o.x * 7 + i, o.y, game.day) * 120));
      if (mins >= until && mins >= 6 * 60 + 60) return;
      if (mins < 6 * 60 + 60 && hash(o.x + i, o.y, game.day + 3) > 0.4) return;
      g.fillStyle = RAMPS.butter[3]; g.fillRect(X + gx, Y + gy, gw, gh);
      g.fillStyle = RAMPS.butter[4]; g.fillRect(X + gx, Y + gy, gw, 2);
      g.fillStyle = RAMPS.butter[2]; g.fillRect(X + gx, Y + gy + gh - 3, gw, 3);
    });
  }
  g.globalAlpha = 1;
}
register('worldTick', 'town_emissive', {
  update(dt, world, game) {
    litWindows.world = world; litWindows.game = game;
    world.emissives ||= [];
    if (!world.emissives.includes(litWindows)) world.emissives.push(litWindows);
  },
});

// ---------------- ground decals, baked per map and season ----------------
const decalCache = { key: null, canvas: null };
function bakeDecals(m, season) {
  const c = document.createElement('canvas'); c.width = m.w * 32; c.height = m.h * 32;
  const g = c.getContext('2d'), S = RAMPS, R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const isWater = (px, py) => { const t = m.tiles[Math.floor(py / 32)] && m.tiles[Math.floor(py / 32)][Math.floor(px / 32)]; return !t || t.ground === 'water' || t.solid; };
  // curbs and seams where pavements meet the road (also hides blend gaps between hard surfaces)
  const HARD = { paved: 1, plaza: 1, asphalt: 1, gravel: 1 }, gr = (tx, ty) => { const t = m.tiles[ty] && m.tiles[ty][tx]; return t && HARD[t.ground] ? t.ground : null; };
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const a = gr(tx, ty), b = gr(tx, ty + 1), c = gr(tx + 1, ty), X = tx * 32, Y = ty * 32;
    if (a && b && a !== b) {
      const by = Y + 32, down = b === 'asphalt' ? [S.stone[4], S.stone[4], S.stone[5], S.stone[3], S.stone[1], S.stone[1], S.charcoal[1]] : a === 'asphalt' ? [S.charcoal[1], S.stone[1], S.stone[3], S.stone[5], S.stone[4], S.stone[4], S.stone[4]] : [S.stone[4], S.stone[4], S.stone[2], S.stone[3], S.stone[4], S.stone[4], S.stone[4]];
      down.forEach((col, i) => R(X, by - 4 + i, 32, 1, col));
    }
    if (a && c && a !== c) { const bx = X + 32, cols = c === 'asphalt' || a === 'asphalt' ? [S.stone[4], S.stone[5], S.stone[3], S.stone[1], S.charcoal[1]] : [S.stone[4], S.stone[2], S.stone[4], S.stone[4], S.stone[4]]; const flip = a === 'asphalt' ? cols.slice().reverse() : cols; flip.forEach((col, i) => R(bx - 3 + i, Y, 1, 32, col)); }
  }
  for (const d of m.def.decals || []) {
    const X = d.x * 32, Y = d.y * 32;
    if (d.k === 'dashes') for (let x = X + 4; x < X + d.w * 32; x += 28) { R(x, Y + 15, 14, 2, '#e8e4dc'); R(x, Y + 17, 14, 1, S.charcoal[1]); }
    else if (d.k === 'vdashes') for (let y = Y + 4; y < Y + d.h * 32; y += 28) R(X + 15, y, 2, 14, '#e8e4dc');
    else if (d.k === 'zebra') for (let x = X + 3; x < X + d.w * 32 - 4; x += 10) { R(x, Y + 4, 6, d.h * 32 - 8, '#e8e4dc'); R(x, Y + d.h * 32 - 4, 6, 1, S.charcoal[1]); }
    else if (d.k === 'manhole') { const cx = X + 16, cy = Y + 16; for (let j = -6; j <= 6; j++) { const w = Math.floor(Math.sqrt(49 - j * j)); R(cx - w, cy + j, w * 2 + 1, 1, j < -5 || j > 5 ? S.charcoal[0] : S.metal[1]); } for (let j = -4; j <= 4; j += 2) R(cx - 4, cy + j, 9, 1, S.metal[0]); }
    else if (d.k === 'rosette') { const cx = X + 16, cy = Y + 16; for (const r of [70, 84, 98]) for (let a = 0; a < 360; a += 4) { const x = Math.round(cx + Math.cos(a * Math.PI / 180) * r), y = Math.round(cy + Math.sin(a * Math.PI / 180) * r * 0.75); R(x, y, 3, 2, r === 84 ? S.coral[1] : S.stone[2]); } }
    else if (d.k === 'tiles') for (let y = Y + 4; y < Y + d.h * 32 - 4; y += 12) for (let x = X; x < X + d.w * 32; x += 12) { R(x + 1, y + 1, 10, 10, ((x + y) / 12) % 2 ? S.sakura[3] : S.paper[3]); R(x + 1, y + 10, 10, 1, S.stone[2]); }
    else if (d.k === 'track') track(R, X, Y, d.w * 32, d.h * 32, S);
    else if (d.k === 'stones') for (let i = 0; i < 3; i++) { R(X + 6 + i * 7, Y + 8 + (i % 2) * 10, 8, 5, S.stone[3]); R(X + 6 + i * 7, Y + 8 + (i % 2) * 10, 8, 1, S.stone[4]); }
  }
  // seasonal scatter under trees: petals in spring, leaf litter in autumn
  if (season === 'spring' || season === 'autumn') for (const o of m.objects) {
    if (!o.tree || (season === 'spring' && o.tree !== 'sakura') || (season === 'autumn' && o.tree === 'pine')) continue;
    const cx = o.x * 32 + 16, cy = o.y * 32 + 30, big = !o.spr.endsWith('_s'), n = big ? 70 : 40, r = big ? 56 : 38;
    const cols = season === 'spring' ? [S.sakura[2], S.sakura[3], S.paper[4]] : o.tree === 'maple' ? [S.vermilion[2], S.vermilion[3], S.leafAutumn[3]] : [S.leafAutumn[2], S.leafAutumn[3], S.butter[2], S.leafAutumn[1]];
    for (let i = 0; i < n; i++) {
      const a = hash(i, o.x, o.y) * 6.283, d = Math.sqrt(hash(i, o.y, o.x + 3)) * r, x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d * 0.7);
      if (isWater(x, y)) continue;
      R(x, y, i % 3 ? 2 : 1, i % 3 ? 1 : 2, cols[i % cols.length]);
      if (season === 'autumn' && i % 4 === 0) R(x + 1, y + 1, 1, 1, S.leafAutumn[0]);
    }
  }
  return c;
}
function track(R, X, Y, W, H, S) { // a running track around a football pitch
  const inside = (x, y, inset) => { const rx = W / 2 - inset, ry = H / 2 - inset, cx = X + W / 2, cy = Y + H / 2, dx = Math.max(0, Math.abs(x - cx) - (rx - ry)), dy = y - cy; return dx * dx + dy * dy <= ry * ry; };
  for (let y = Y; y < Y + H; y++) for (let x = X; x < X + W; x++) {
    if (!inside(x, y, 6)) continue;
    if (!inside(x, y, 30)) { const lane = [12, 18, 24].some((k) => inside(x, y, k) && !inside(x, y, k + 1)); R(x, y, 1, 1, lane ? '#f2efe8' : (x + y) % 7 === 0 ? S.brick[2] : S.brick[3]); }
    else if (!inside(x, y, 31)) R(x, y, 1, 1, S.brick[1]);
  }
  const cx = Math.round(X + W / 2), cy = Math.round(Y + H / 2), L = '#f2efe8', rx = W / 2 - 36, ry = H / 2 - 36, hy = Math.round(ry * 0.72), hx = Math.round(rx - ry + ry * 0.62);
  R(cx - hx, cy - hy, hx * 2, 1, L); R(cx - hx, cy + hy, hx * 2 + 1, 1, L); R(cx - hx, cy - hy, 1, hy * 2, L); R(cx + hx, cy - hy, 1, hy * 2, L); R(cx, cy - hy, 1, hy * 2, L);
  for (let a = 0; a < 360; a += 3) R(Math.round(cx + Math.cos(a * Math.PI / 180) * 26), Math.round(cy + Math.sin(a * Math.PI / 180) * 22), 1, 1, L);
  for (const side of [-1, 1]) { const x0 = side < 0 ? cx - hx : cx + hx - 44; R(x0, cy - 40, 44, 1, L); R(x0, cy + 40, 44, 1, L); R(side < 0 ? x0 + 44 : x0, cy - 40, 1, 81, L); }
}

// ---------------- overhead: power lines and the shotengai canopy ----------------
function wires(g, world) {
  const pts = world.map.def.wires;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    for (const k of [5, 21, 28]) {
      const x0 = world.sx(ax * 16) + k, y0 = world.sy((ay + 1) * 16) - 103, x1 = world.sx(bx * 16) + k, y1 = world.sy((by + 1) * 16) - 103;
      if (Math.max(x0, x1) < 0 || Math.min(x0, x1) > 320) continue;
      g.fillStyle = k === 21 ? RAMPS.charcoal[2] : RAMPS.charcoal[1];
      for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0 || 1); g.fillRect(x, Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 14), 1, 1); }
    }
  }
}
function canopy(g, world, game) {
  const r0 = world.map.def.arcade[0], yTop = world.sy(r0 * 16) - 46, M = RAMPS.metal, x0 = -Math.round(world.cam.x) % 48 - 48;
  g.fillStyle = 'rgba(191,230,245,0.35)'; g.fillRect(0, yTop + 4, 320, 22);
  g.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = x0; x < 330; x += 48) g.fillRect(x + 8, yTop + 7, 10, 1);
  g.fillStyle = M[2]; for (let x = x0; x < 330; x += 48) { g.fillRect(x, yTop + 4, 2, 22); g.fillRect(x + 24, yTop + 4, 1, 22); }
  g.fillStyle = M[1]; g.fillRect(0, yTop, 320, 4); g.fillRect(0, yTop + 26, 320, 3);
  g.fillStyle = M[3]; g.fillRect(0, yTop, 320, 1); g.fillRect(0, yTop + 26, 320, 1);
  g.fillStyle = 'rgba(42,26,64,0.18)'; g.fillRect(0, yTop + 29, 320, 4);
  if (game.weather === 'rain' || game.weather === 'storm') { g.fillStyle = 'rgba(225,240,255,0.7)'; for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i, Math.floor(game.clock * 8), 7) * 320); g.fillRect(x, yTop + 8 + (i % 4) * 4, 1, 2); } for (let i = 0; i < 8; i++) { const x = Math.floor(hash(i, 3, 9) * 320), y = yTop + 30 + ((game.clock * 60 + i * 13) % 30); g.fillRect(x, Math.round(y), 1, 2); } }
}
register('worldLayer', 'town_ambience', {
  below(g, world, game) {
    const m = world.map;
    if (!TOWN_MAPS.has(m.id)) return;
    const key = m.id + ':' + game.season;
    if (decalCache.key !== key || decalCache.map !== m) Object.assign(decalCache, { key, map: m, canvas: bakeDecals(m, game.season) });
    g.drawImage(decalCache.canvas, -Math.round(world.cam.x), -Math.round(world.cam.y));
  },
  above(g, world, game) {
    const def = world.map.def;
    if (!TOWN_MAPS.has(world.map.id)) return;
    if (def.wires) wires(g, world);
    if (def.arcade) canopy(g, world, game);
  },
});

features('Town and travel', [
  'Front yard map: Misa\'s house front, garden plots, Grandma\'s shed and workbench, clothesline, mailbox and the big cherry tree',
  'Lantern Lane map: Goro\'s house and vegetable garden, the neighbourhood cat wall, vending machine, bus stop and the path to the park',
  'Hoshimori Square map: library, Cafe Kumo with its terrace, Wren\'s Clocks and the clock tower, Sunny Mart, the post office, fountain plaza and festival stage',
  'Sakura Park map: koi pond and stream with a red bridge, bandstand, chess table, picnic lawn, playground and the Sunny Pines home',
  'Hoshimori Shotengai map: a covered shopping street with Salon Snip, Dr. Mori\'s clinic, Kinoko Woodworks, a sweets shop, a bookshop and a tea house',
  'Hoshimori High grounds map: school building, gym, greenhouse, school garden, a football pitch with a running track, and the school gate',
  'Exits at map edges and doors link the whole town: lane, square, park, shotengai, school, harbour and shrine roads',
  'Map name banner slides in when you arrive somewhere new',
  'Signposts at junctions tell you where each road leads, and blue street name plates name each street',
  'Shop doors keep opening hours and say when they open again (the post office closes on Sundays)',
  'The school and gym are locked at night',
  'Saturday farmers\' market: vegetable, fruit and flower stalls fill the square until the afternoon',
  'Night ramen cart in the square from 6 PM, with a glowing red lantern and rising steam',
  'Friday merchant stall in the shotengai',
  'Festival bunting is strung over the square on festival days',
  'Wren\'s clock tower shows the real time of day with moving hands',
  'The school flag waves on its flagpole',
  'Smoke curls from the house chimney on winter days and evenings',
]);
features('Graphics', [
  'Procedural building fronts: plaster, wood siding and brick walls with kawara, slate, tin and flat roofs',
  'Shop fronts with striped awnings, noren curtains, painted signboards and display windows',
  'Windows glow warm at night and cast light pools; house lights go out one by one late at night',
  'Streetlights, lamp posts, stone lanterns, paper lanterns and vending machines light the town after dark',
  'Hand-shaded trees (oak, sakura, maple, pine) that change with the seasons, with bare snowy branches in winter',
  'Sakura trees blossom pink in spring and turn red in autumn; maples blaze red in autumn',
  'Snow caps on roofs, fences, benches, lanterns and hedges in winter',
  'Flower beds, planters, window boxes and potted plants bloom in seasonal colours',
  'Fallen sakura petals gather under the cherry trees in spring',
  'Autumn leaf litter and leaf piles under the trees',
  'Snowmen appear around town in winter',
  'Road markings: centre lines, zebra crossings, manholes and a plaza rosette around the fountain',
  'Overhead power lines sag between the utility poles on Lantern Lane',
  'A glass and steel canopy covers the shotengai, with strings of paper lanterns overhead',
  'Laundry on the clothesline sways in the breeze',
  'A school running track and football pitch with painted lines',
  'Street furniture: bus shelter, post box, traffic mirror, bike racks, bins, noticeboard and a parked delivery truck',
]);
