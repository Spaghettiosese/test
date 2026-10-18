// Photography: the camera (tool_camera, shots per day plus film rolls), subject scoring (composition, rarity, light, friends in frame),
// the Album phone app (frames, stickers, prints), photo contests (library gallery wall and festivals) and photo requests on the board.
// Try it: __misa.give('tool_camera'); use the camera from the bag, or run  await (await import('/src/content/sv4_hobbies/photo.js')).shoot(__misa)
import { register, get, features } from '../../core/registry.js';
import { seasonOf, dateOf, yearOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { drawText, drawTextC } from '../../font.js';
import { panel, btn, rect, C, inside } from '../economy/gfx.js';
import { S, clamp, item, gain, addRibbon, rivals, rankOf, later, say, N, call, stickers, idle, nameOf, hookObjects } from './state.js';
import '../../minigames/sv4_hobbies/frame.js';

// ---------------------------------------------------------------- items
item('tool_camera', 'Camera', 'tool', 220, 'tool', K.charcoal[2], 'A little film camera. Use it to frame a photo; you get five shots a day, plus one for each Photography level.', { c2: K.sky[3], tags: ['tool', 'camera'], useLabel: 'Shoot', use: (g) => { later(g, (gg) => shoot(gg), 'Close the bag, then frame your shot.'); return true; } });
item('sv4h_film', 'Film roll', 'misc', 30, 'box', K.butter[3], 'Six extra shots today. Use it to load the camera.', { tags: ['photo'], useLabel: 'Load', use: (g) => { S(g).photo.extra += 6; g.toast('Six more shots today', 'i_star'); return false; } });
for (const [n, nm, pr, c] of [[1, 'Snapshot print', 30, K.paper[3]], [2, 'Nice print', 80, K.sky[3]], [3, 'Gallery print', 170, K.butter[3]]]) item('sv4h_print_' + n, nm, 'misc', pr, 'paper', c, n === 3 ? 'A big glossy print worthy of a gallery wall.' : 'A photo printed on good paper. The stationery stall buys prints.', { tags: ['photo', 'print'] });
export const FRAMES = [['plain', 'Plain', K.paper[4]], ['wood', 'Wood', K.wood[3]], ['pastel', 'Pastel', K.ribbon[3]], ['star', 'Starry', K.butter[3]], ['floral', 'Floral', K.mint[3]]];
export const STICKERS = [['none', 'None'], ['heart', 'Heart'], ['star', 'Star'], ['sparkle', 'Sparkle'], ['cat', 'Cat']];
for (const [id, nm, c] of FRAMES.slice(1)) item('sv4h_frame_' + id, nm + ' photo frame', 'misc', 50, 'box', c, `Use it to unlock the ${nm.toLowerCase()} frame in the Album app.`, { useLabel: 'Unlock', use: (g) => { S(g).photo.frames[id] = true; g.toast(`${nm} frame unlocked`, 'i_star'); return false; } });
for (const [id, nm] of STICKERS.slice(1)) item('sv4h_sticker_' + id, nm + ' photo sticker', 'misc', 20, 'star', K.coral[3], `Use it to unlock the ${nm.toLowerCase()} sticker in the Album app.`, { useLabel: 'Unlock', use: (g) => { S(g).photo.stickers[id] = true; g.toast(`${nm} sticker unlocked`, 'i_star'); return false; } });

// ---------------------------------------------------------------- shots per day
export const quota = (g) => Math.min(15, 5 + g.skillLevel('photography'));
function refresh(g) { const p = S(g).photo; if (p.day !== g.day) { p.day = g.day; p.used = 0; p.extra = 0; } return p; }
export const shotsLeft = (g) => { const p = refresh(g); return Math.max(0, quota(g) + p.extra - p.used); };

// ---------------------------------------------------------------- scoring
const MAP_RARITY = { lighthouse: 4, cave: 4, clock_tower: 4, shrine: 3, school_roof: 3, attic: 3, beach: 2, harbour: 2, park: 2, sunny_pines: 2, community_hall: 2, library: 2, cafe: 2 };
const PARTS = [[5, 8, 'dawn', 0.95], [8, 11, 'morning', 0.85], [11, 15, 'afternoon', 0.7], [15, 17, 'late afternoon', 0.9], [17, 19, 'golden hour', 1], [19, 21, 'dusk', 0.7], [21, 29, 'night', 0.35]];
const WX = { sunny: 1, cloudy: 0.8, rain: 0.65, storm: 0.5, snow: 0.9, fog: 0.75, windy: 0.9 };
export function lightScore(g, indoor) {
  const h = g.minutes / 60, p = PARTS.find(([a, b]) => h >= a && h < b) || PARTS[PARTS.length - 1];
  const wx = WX[g.weather] ?? 0.85;
  return { value: indoor ? 0.6 + (p[3] > 0.5 ? 0.1 : 0) : clamp(p[3] * wx + (g.weather === 'rain' && h > 16 ? 0.1 : 0), 0, 1), part: p[2] };
}
export function nearbyCast(g) {
  const w = g.world; if (!w || !w.presentNPCs) return [];
  const p = w.player;
  return w.presentNPCs().filter((n) => Math.hypot(n.x - p.x, n.y - p.y) < 120).map((n) => n.id);
}
export function sceneInfo(g) {
  const w = g.world, mapId = (w && w.map && w.map.id) || g.state.map || 'home', def = get('map', mapId) || {};
  const near = nearbyCast(g), animals = near.filter((id) => ['daifuku', 'kuro', 'mochi'].includes(id)), people = near.filter((id) => !animals.includes(id));
  return { mapId, mapName: def.name || mapId, indoor: !!def.indoor, people, animals, near };
}
export function scorePhoto(g, info, comp) {
  const key = `${info.mapId}|${seasonOf(g.day)}|${Math.floor(g.minutes / 360)}`, seen = S(g).photo.seen[key] || 0;
  let r = (MAP_RARITY[info.mapId] || 1) + Math.min(2, info.animals.length) + (g.festivalToday && g.festivalToday() ? 1 : 0) + (['rain', 'storm', 'snow'].includes(g.weather) && !info.indoor ? 1 : 0);
  const rar = clamp(r / 6, 0, 1) / (1 + seen * 0.6), L = lightScore(g, info.indoor);
  const hearts = info.people.reduce((a, id) => a + (g.hearts ? g.hearts(id) : 0), 0), fr = clamp(info.people.length * 0.3 + hearts * 0.03, 0, 1);
  const skill = g.skillLevel('photography') / 10;
  const total = clamp(0.35 * comp + 0.2 * rar + 0.2 * L.value + 0.15 * fr + 0.1 * skill, 0, 1);
  const stars = total >= 0.8 ? 5 : total >= 0.65 ? 4 : total >= 0.5 ? 3 : total >= 0.35 ? 2 : 1;
  return { total, stars, rar, light: L.value, part: L.part, fr, key };
}
export function titleOf(g, info, sc) {
  const who = info.people.length ? `${info.people.length > 1 ? 'Friends' : nameOf(info.people[0])} at ${info.mapName}` : info.animals.length ? `A cute visitor at ${info.mapName}` : `${info.mapName} at ${sc.part}`;
  return who.slice(0, 34);
}
export function record(g, info, comp) {
  const p = refresh(g), sc = scorePhoto(g, info, comp);
  p.seen[sc.key] = (p.seen[sc.key] || 0) + 1; p.used++; p.taken++;
  const e = { id: p.seq++, day: g.day, map: info.mapId, mapName: info.mapName, title: titleOf(g, info, sc), stars: sc.stars, score: Math.round(sc.total * 100) / 100, comp: Math.round(comp * 100) / 100, rar: Math.round(sc.rar * 100) / 100, light: Math.round(sc.light * 100) / 100, part: sc.part, wx: g.weather, season: seasonOf(g.day), people: info.people.slice(0, 4), animals: info.animals.length, frame: 'plain', sticker: 'none', fav: false, printed: 0, used: false };
  p.album.push(e);
  if (p.album.length > 60) { const i = p.album.findIndex((x) => !x.fav && !x.used); p.album.splice(i < 0 ? 0 : i, 1); }
  gain(g, 'photography', 6 + sc.stars * 3); g.addMood(2); g.stat('photosTaken'); if (sc.stars === 5) g.stat('photos5');
  g.advance(10); g.bus.emit('photoTaken', { id: e.id, stars: e.stars, map: e.map });
  return e;
}
export async function shoot(g) {
  if (!g.has('tool_camera')) return g.toast('You need a camera.');
  if (!idle(g)) return g.toast('Not now.');
  if (shotsLeft(g) <= 0) { g.sfx('wrong'); return g.toast('Out of shots today. Film rolls are sold at the stationery stall.'); }
  const info = sceneInfo(g), L = lightScore(g, info.indoor);
  const night = L.part === 'night', sky = info.indoor ? K.paper[3] : night ? '#232a52' : ['rain', 'storm'].includes(g.weather) ? K.metal[3] : K.sky[3];
  const r = await g.minigame('sv4h_frame', { sky, ground: night ? '#1d3a34' : undefined, subjects: info.people.map(nameOf).concat(info.animals.length ? ['a sweet animal'] : []), lively: 0.5 + Math.min(0.4, info.near.length * 0.1), level: g.skillLevel('photography') + (g.hasBuff && g.hasBuff('sv4h_steady') ? 2 : 0), noResult: true });
  if (!r || r.quit) return;
  const e = record(g, info, r.score);
  await g.run([N(`${e.title}: ${'*'.repeat(e.stars)}  Composition ${Math.round(e.comp * 100)}, rarity ${Math.round(e.rar * 100)}, light ${Math.round(e.light * 100)}${e.people.length ? ', friends ' + e.people.length : ''}. Saved to the Album app. (${shotsLeft(g)} shots left)`)]);
}

// ---------------------------------------------------------------- thumbnails
const hsh = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function drawPhoto(g, e, x, y, w = 56, h = 44) {
  const night = e.part === 'night' || e.part === 'dusk', warm = e.part === 'golden hour' || e.part === 'dawn';
  const sky = night ? '#2a3260' : warm ? K.coral[2] : e.wx === 'rain' || e.wx === 'storm' ? K.metal[3] : K.sky[3];
  const fr = FRAMES.find((f) => f[0] === e.frame) || FRAMES[0];
  rect(g, fr[2], x - 3, y - 3, w + 6, h + 6); rect(g, K.ink[1], x - 1, y - 1, w + 2, h + 2);
  rect(g, sky, x, y, w, h); if (warm) rect(g, K.butter[3], x, y + h * 0.35, w, h * 0.2);
  rect(g, e.map === 'beach' || e.map === 'harbour' ? K.sand[3] : K.forest[2], x, y + h * 0.65, w, h * 0.35);
  for (let i = 0; i < 4; i++) rect(g, K.forest[3], x + 2 + i * 15, y + h * 0.5 - hsh(e.id, i) * 6, 12, 8);
  const n = e.people.length + (e.animals ? 1 : 0) + 1;
  for (let i = 0; i < Math.min(n, 4); i++) { const px = x + w / 2 - (n * 7) / 2 + i * 8 + 1; rect(g, [K.coral[2], K.sky[2], K.mint[2], K.lilac[2]][(e.id + i) % 4], px, y + h * 0.5, 6, 10); rect(g, K.paper[4], px + 1, y + h * 0.5 - 4, 4, 4); }
  if (night) for (let i = 0; i < 6; i++) rect(g, K.paper[4], x + hsh(e.id, i + 9) * w, y + hsh(e.id, i + 19) * h * 0.4, 1, 1);
  if (e.sticker && e.sticker !== 'none') { const c = { heart: K.coral[3], star: K.butter[3], sparkle: K.paper[4], cat: K.sand[3] }[e.sticker]; rect(g, c, x + w - 11, y + 2, 8, 8); rect(g, K.ink[1], x + w - 9, y + 4, 2, 2); }
  if (e.fav) rect(g, K.coral[3], x, y, 6, 6);
}

// ---------------------------------------------------------------- Album phone app
const stars = (n) => '*'.repeat(n);
function unlockedFrames(g) { const f = S(g).photo.frames; return FRAMES.filter(([id]) => id === 'plain' || f[id]); }
function unlockedStickers(g) { const s = S(g).photo.stickers; return STICKERS.filter(([id]) => id === 'none' || s[id]); }
const cycle = (list, cur) => list[(list.findIndex(([id]) => id === cur) + 1) % list.length][0];
export function printPhoto(g, e) {
  const tier = e.stars >= 4 ? 3 : e.stars >= 3 ? 2 : 1;
  if (!g.spend(15)) { g.toast('A print costs 15 coins.'); g.sfx('wrong'); return false; }
  g.give('sv4h_print_' + tier, 1); e.printed++; g.sfx('buy'); return true;
}
register('phoneApp', 'sv4h_album', {
  name: 'Album', icon: 'sv4h_i_album', order: 46,
  open(game, app) { app.state.sel = Math.max(0, S(game).photo.album.length - 1); },
  update(dt, input, game, app) {
    const { x, y } = app.area, st = app.state, list = S(game).photo.album, k = input.pressed; st.mx = input.mx; st.my = input.my;
    if (!list.length) return;
    const cols = 4;
    if (k.has('arrowright') || k.has('d')) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (k.has('arrowleft') || k.has('a')) st.sel = Math.max(0, st.sel - 1);
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + cols);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - cols);
    const top = Math.floor(st.sel / cols / 2) * 2 * cols;
    if (input.justDown) list.slice(top, top + 8).forEach((e, i) => { if (inside(input.mx, input.my, x + (i % cols) * 58, y + 2 + Math.floor(i / cols) * 70, 56, 62)) st.sel = top + i; });
    const e = list[st.sel]; if (!e) return;
    const act = (key, bx, by, bw) => k.has(key) || (input.justDown && inside(input.mx, input.my, bx, by, bw, 14));
    if (act('f', x + 236 - 4, y + 106, 56)) { e.frame = cycle(unlockedFrames(game), e.frame); game.sfx('blip'); }
    if (act('t', x + 236 - 4, y + 122, 56)) { e.sticker = cycle(unlockedStickers(game), e.sticker); game.sfx('blip'); }
    if (act('v', x + 236 - 4, y + 138, 56)) { e.fav = !e.fav; game.sfx('blip'); }
    if (act('p', x + 236 - 4, y + 154, 56) && printPhoto(game, e)) game.toast(`Printed: ${e.title}`);
    if (k.has('delete') && !e.fav) { list.splice(st.sel, 1); st.sel = Math.max(0, st.sel - 1); }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, list = S(game).photo.album;
    panel(g, x, y, w, h, 'paper');
    drawText(g, `Album  ${list.length}/60   Shots left today: ${shotsLeft(game)}`, x + 6, y + 4, C.ink, 1, null);
    if (!list.length) { drawText(g, 'No photos yet. Get a camera at the stationery stall in the shotengai!', x + 6, y + 24, C.ink, 1, null); return; }
    const cols = 4, top = Math.floor(st.sel / cols / 2) * 2 * cols;
    list.slice(top, top + 8).forEach((e, i) => {
      const px = x + 8 + (i % cols) * 58, py = y + 18 + Math.floor(i / cols) * 66;
      if (top + i === st.sel) rect(g, K.butter[3], px - 6, py - 6, 58, 62);
      drawPhoto(g, e, px, py, 44, 34); drawText(g, stars(e.stars), px, py + 40, K.butter[1], 1, null);
    });
    const e = list[st.sel], dx = x + 236 - 4;
    drawText(g, e.title.slice(0, 20), dx - 4, y + 16, C.ink, 1, null);
    drawPhoto(g, e, dx + 4, y + 28, 50, 40);
    drawText(g, `${stars(e.stars)} Day ${e.day}`, dx - 4, y + 76, K.butter[1], 1, null);
    drawText(g, `Comp ${Math.round(e.comp * 100)} Rare ${Math.round(e.rar * 100)}`, dx - 4, y + 86, C.ink, 1, null);
    drawText(g, `Light ${Math.round(e.light * 100)} Pals ${e.people.length}`, dx - 4, y + 96, C.ink, 1, null);
    [['F Frame', 106], ['T Sticker', 122], [e.fav ? 'V Unfav' : 'V Favourite', 138], ['P Print 15c', 154]].forEach(([t, o]) => btn(g, dx, y + o, 56, 14, t, { hover: inside(st.mx, st.my, dx, y + o, 56, 14) }));
  },
});

// ---------------------------------------------------------------- contests (library gallery wall and festivals)
export const seasonKey = (g) => `${yearOf(g.day)}-${seasonOf(g.day)}`;
export const contestOpen = (g) => dateOf(g.day) <= 7;
const best = (g) => S(g).photo.album.filter((e) => !e.used).sort((a, b) => b.score - a.score).slice(0, 6);
export function enterContest(g, key, label, e, hard = 0) {
  const p = S(g).photo, riv = rivals(g, 'sv4hcontest' + key, 3, 0.4 + hard, 0.75 + hard), rank = rankOf(e.score, riv);
  p.contests[key] = rank; e.used = true;
  const prize = [0, 300, 150, 70, 20][rank] || 20;
  g.addMoney(prize, true); gain(g, 'photography', [0, 40, 28, 18, 10][rank]);
  if (rank <= 3) addRibbon(g, 'photo', label, rank);
  if (rank === 1) { stickers(g, 2, 'Photo contest'); p.wall.unshift({ title: e.title, stars: e.stars, day: g.day }); p.wall.length = Math.min(p.wall.length, 6); g.stat('photoWins'); }
  return { rank, prize };
}
export function contestSteps(g, key, label, hard = 0) {
  const p = S(g).photo, list = best(g);
  if (p.contests[key]) return [N('You already entered this one.')];
  if (!list.length) return [N('You need a photo in your album first. Take one with the camera!')];
  return [{ t: 'choice', prompt: `${label}: pick a photo`, options: [...list.map((e) => ({ text: `${stars(e.stars)} ${e.title.slice(0, 22)}`, steps: [call(async (gg) => { const r = enterContest(gg, key, label, e, hard); await gg.run([N(r.rank === 1 ? `First place! ${r.prize} coins and a blue ribbon.` : r.rank <= 3 ? `Place ${r.rank}: ${r.prize} coins and a ribbon.` : `Not placed this time. ${r.prize} coins for taking part.`)]); })] })), { text: 'Not now', steps: [] }] }];
}
register('interaction', 'sv4h_gallery', {
  label: 'Gallery wall',
  run(g) {
    const p = S(g).photo, key = 'lib-' + seasonKey(g), wall = p.wall.length ? p.wall.slice(0, 4).map((w) => `${w.title} (${stars(w.stars)})`).join('; ') : 'Empty frames wait for a winner.';
    return g.run([N(`The Hoshimori Library gallery wall. ${wall}`), { t: 'choice', prompt: 'Photo contest', options: [
      { text: contestOpen(g) ? 'Enter the seasonal contest' : 'Contest opens on days 1 to 7', steps: [call((gg) => (contestOpen(gg) ? gg.run(contestSteps(gg, key, 'Library photo contest')) : gg.run([N('The contest runs during the first week of each season.')])))] },
      { text: 'Leave', steps: [] }] }]);
  },
});

// ---------------------------------------------------------------- requests on the noticeboard
const PLACES = [['beach', 'the beach'], ['park', 'the park'], ['shrine', 'the shrine'], ['harbour', 'the harbour'], ['lighthouse', 'the lighthouse'], ['town', 'the town square'], ['sunny_pines', 'Sunny Pines'], ['school_grounds', 'the school grounds']];
export function commission(g) {
  const p = S(g).photo;
  if (p.comDay !== g.day) { const r = g.rngFor('sv4hcom'), pl = PLACES.filter(([id]) => get('map', id)), [id, nm] = pl[Math.floor(r() * pl.length)]; p.comDay = g.day; p.commission = { map: id, name: nm, done: false, min: 3, reward: 100 + Math.floor(r() * 5) * 20 }; }
  return p.commission;
}
register('boardNote', 'sv4h_photo_request', {
  title: 'Photo wanted', color: K.sky[3],
  get text() { return 'Someone is asking for a nice photo around town. Look closer for today\'s request.'; },
  run(g) {
    const c = commission(g), p = S(g).photo;
    if (c.done) return g.run([N('Thanks for the photo today! Come back tomorrow for another request.')]);
    const ok = p.album.filter((e) => e.map === c.map && e.stars >= c.min && !e.used);
    return g.run([N(`Wanted: a ${c.min}-star photo of ${c.name}. Reward ${c.reward} coins.`), ...(ok.length ? [{ t: 'choice', prompt: 'Hand one over?', options: [...ok.slice(0, 5).map((e) => ({ text: `${stars(e.stars)} ${e.title.slice(0, 22)}`, steps: [call((gg) => { e.used = true; c.done = true; gg.addMoney(c.reward, true); gain(gg, 'photography', 12); gg.stat('photoRequests'); gg.toast(`+${c.reward} coins`, 'coin'); })] })), { text: 'Later', steps: [] }] }] : [N('You have no matching photo yet.')])]);
  },
});

// ---------------------------------------------------------------- festival photo booths
for (const [fid, map, spot, dx, dy] of [['hanami', 'park', 'bandstand', 2, 2], ['harvest', 'town', 'fountain', 4, 0], ['matsuri', 'town', 'stage', -3, 3], ['leaves_walk', 'park', 'sakura_tree', 3, 1]]) {
  const f = get('festival', fid); if (!f || !f.activities) continue;
  f.activities.push({ id: 'sv4h_photo_' + fid, map, spot, dx, dy, label: 'Festival photo contest', daily: true, run: (g) => g.run(contestSteps(g, `fest-${fid}-${yearOf(g.day)}`, `${f.name} photo contest`, 0.05)) });
}

hookObjects('library', (b) => [...b, { spr: 'sv4h_gallery', x: 12, y: 2, w: 3, solid: false, use: 'sv4h_gallery', dy: 2 }]);

features('Creative Hobbies', [
  'Photography skill (levels 1 to 10) with a camera tool: five shots a day plus one per level, and film rolls for six more',
  'Framing minigame: steer the viewfinder onto a drifting subject and shoot; rule-of-thirds placement scores extra',
  'Every photo is scored on composition, rarity of place and weather, light (golden hour beats midnight) and friends in the frame',
  'Repeating the same view in the same season and time of day loses rarity, so exploring pays',
  'Album phone app: browse up to 60 photos with stars, scores, frames, stickers and favourites',
  'Unlock photo frames and stickers from the stationery stall and apply them in the Album app',
  'Print any photo for 15 coins; the stationery stall buys prints, with better prices for higher stars',
  'Seasonal photo contest at the library gallery wall (first week of each season) against three rivals, with ribbons and prizes',
  'Festival photo contests at Hanami, Harvest Market, the Summer Matsuri and the Leaves Walk',
  'Winning photos hang on the library gallery wall',
  'A new photo request on the noticeboard every day: bring a 3-star photo of the named place for coins',
]);
void gain;
