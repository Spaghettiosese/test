// Living mountain and meadow: stamina and storm rules, weather layers, seasonal petals and leaves, forage nodes, deer, snow monkeys,
// onsen cats and the ranch animals.
import { register, get, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { Critter, tileCenter } from '../mochi/actor.js';
import { hash } from '../../gfx/noise.js';
import { FORAGE } from '../sv_explore/data.js';
import { mapTiles, GRASSY, pickN, fx, centre } from '../sv_explore/util.js';
import { SV4, TK_FORAGE, badge, mtWeather, exposedMap, onMountain, addStamina, clamp, say, nm } from './data.js';
import { PASTURES } from './maps_meadow.js';

// ------------------------------------------------------------------ stamina, storm exposure and the gentle rescue
let last = null, lastMap = '', rescuing = false, restCool = 0, shelterCache = {};
const shelters = (world) => (shelterCache[world.map.id] ||= world.map.objects.filter((o) => ['tk_shelter_rest', 'tk_hut_rest'].includes(o.use)).map((o) => [o.x * TILE + o.w * 8, o.y * TILE + o.h * 8]));
async function rescue(game) {
  rescuing = true;
  try {
    const S = SV4(game);
    await game.run([
      { t: 'say', who: null, text: 'Thunder cracks right overhead. Misa crouches in the wet ferns, and the trail turns into a river of mist.' },
      { t: 'say', who: 'shun', mood: 'happy', text: 'Misa! There you are. Easy now, I have a rope and a flask of ginger tea. You did the right thing waiting.' },
      { t: 'fade', to: 1, dur: 0.8 },
      { t: 'call', fn: () => { S.rescues++; S.expo = 0; S.stamina = Math.max(S.stamina, 60); game.state.energy = Math.max(game.state.energy, 30); game.advance(90); game.stat('rescues'); badge(game, 'storm_wise'); game.bus.emit('sv4Rescued', {}); } },
    ]);
    await game.warp('mountain_hut', 6, 8, 'up');
    await game.run([{ t: 'fade', to: 0, dur: 0.8 }, { t: 'say', who: 'osuzu', mood: 'happy', text: 'Wrapped in a blanket, are we? Sit by the fire, dear. Shun finds somebody every storm. Nobody is in trouble here.' }, { t: 'say', who: 'misa', mood: 'happy', text: 'Thank you both. I will carry a poncho next time.' }]);
  } finally { rescuing = false; }
}
register('worldTick', 'sv4_trail', {
  update(dt, world, game) {
    const S = game.state.sv4_land; if (!S) return;
    const id = world.map.id;
    if (id !== lastMap) { lastMap = id; last = null; shelterCache = {}; }
    if (!onMountain(id) || game.scenes.top !== world || world.busy || rescuing) { last = null; return; }
    const p = world.player, w = mtWeather(game);
    if (last) {
      const d = Math.hypot(p.x - last[0], p.y - last[1]);
      if (d > 0 && d < 20 && exposedMap(id)) addStamina(game, -(d / TILE) * 0.22 * (w === 'snow' || w === 'fog' ? 1.5 : 1) * (game.has('tool_tk_stick') ? 0.75 : 1) * (S.stamina < 15 ? 0.3 : 1));
    }
    last = [p.x, p.y];
    if (id === 'tsukimi_forest' && p.y > 26 * TILE && p.y < 30 * TILE && p.x > 6.5 * TILE && p.x < 9.5 * TILE) badge(game, 'bridge');
    restCool -= dt;
    if (S.stamina <= 0 && restCool <= 0) {
      restCool = 120; S.stamina = 40;
      game.run([{ t: 'say', who: 'misa', mood: 'sleepy', text: 'Phew... legs like noodles. Time for a sit and a snack on a mossy log.' }, { t: 'fade', to: 1, dur: 0.4 }, { t: 'call', fn: () => { game.advance(30); game.addMood(-2); } }, { t: 'fade', to: 0, dur: 0.4 }]);
    }
    if (w === 'thunder' && exposedMap(id)) {
      const near = shelters(world).some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 56);
      S.expo = near ? 0 : S.expo + dt * (game.has('tool_tk_poncho') ? 0.35 : 1);
      if (S.expo > 25 && !S.warned) { S.warned = true; game.toast('Lightning! Take shelter under a roof or in the hut!', 'i_cloud'); }
      if (S.expo > 70) rescue(game); else if (S.expo === 0) S.warned = false;
    } else { S.expo = Math.max(0, S.expo - dt * 2); if (S.expo < 5) S.warned = false; }
  },
});
register('hud', 'sv4_stamina', {
  draw(g, game) {
    const w = game.world, S = game.state.sv4_land; if (!w || !S || game.hideHud || !w.map || !exposedMap(w.map.id)) return;
    const v = S.stamina / 100;
    g.fillStyle = '#2b1d2ed0'; g.fillRect(2, 188, 58, 12);
    g.fillStyle = '#9fd88a'; g.fillRect(5, 191, 5, 6); g.fillRect(10, 193, 2, 4);
    g.fillStyle = '#2a1a22'; g.fillRect(14, 192, 43, 5); g.fillStyle = v > 0.3 ? '#8fd47a' : '#e8866a'; g.fillRect(15, 193, Math.round(41 * v), 3);
    const wt = mtWeather(game);
    if (wt !== 'clear') { g.fillStyle = '#2b1d2ed0'; g.fillRect(2, 176, 58, 11); g.fillStyle = '#e8f0fa'; g.fillRect(5, 179, 4, 4); }
  },
});

// ------------------------------------------------------------------ weather and seasonal layers
register('worldLayer', 'sv4_sky', {
  overlay(g, world, game) {
    const id = world.map.id, S = game.state.sv4_land; if (!S) return;
    const t = game.clock || 0, h = game.minutes / 60, w = mtWeather(game);
    g.save();
    if (onMountain(id) && id !== 'tsukimi_trailhead' || id === 'mountain_hut') {
      if (id === 'mountain_hut') { if (w === 'thunder' && Math.sin(t * 0.9) > 0.97) { g.globalAlpha = 0.18; g.fillStyle = '#fff'; g.fillRect(0, 0, 320, 224); } g.restore(); return; }
      if (w === 'fog' || w === 'snow') {
        g.fillStyle = '#e8eef4';
        for (let i = 0; i < 7; i++) { const cx = ((i * 83 + t * (5 + i)) % 440) - 60, cy = 20 + ((i * 47) % 190), ww = 110 + (i % 3) * 36; for (let r = -4; r <= 4; r++) { g.globalAlpha = (w === 'fog' ? 0.13 : 0.07) * (1 - Math.abs(r) / 5); g.fillRect(Math.round(cx - ww * Math.sqrt(1 - r * r / 25)), cy + r * 4, Math.round(ww * 2 * Math.sqrt(1 - r * r / 25)), 4); } }
      }
      if (w === 'thunder') {
        g.globalAlpha = 0.22; g.fillStyle = '#1a2040'; g.fillRect(0, 0, 320, 224);
        const ph = (t * 0.37) % 1; if (ph > 0.96 || (ph > 0.9 && ph < 0.915)) { g.globalAlpha = 0.5; g.fillStyle = '#fff'; g.fillRect(0, 0, 320, 224); }
      }
      if (id === 'tsukimi_summit' && h > 4.5 && h < 10 && w !== 'thunder') { // sea of clouds below the lookout
        g.fillStyle = '#f4f8fc';
        for (let r = 0; r < 14; r++) { const y = 150 + r * 5; for (let i = 0; i < 9; i++) { g.globalAlpha = 0.5 + 0.3 * (r / 14); const x = ((i * 47 + t * (2 + r * 0.2) + r * 11) % 380) - 30; g.fillRect(Math.round(x), y, 34 + (i % 3) * 14, 7); } }
      }
      if (game.season === 'autumn' && w !== 'snow') { for (let i = 0; i < 16; i++) { const x = (hash(i, 1, 7) * 330 + t * 14 + Math.sin(t + i) * 8) % 330, y = (hash(i, 2, 7) * 230 + t * 22) % 230; g.globalAlpha = 0.85; g.fillStyle = i % 3 ? '#d9533b' : '#e8a53a'; g.fillRect(Math.round(x), Math.round(y), 3, 2); } }
    }
    if (['meadow_orchard', 'meadow_road', 'meadow_market'].includes(id) && game.season === 'spring') {
      for (let i = 0; i < 18; i++) { const x = (hash(i, 3, 9) * 330 + t * 10 + Math.sin(t * 0.8 + i) * 10) % 330, y = (hash(i, 4, 9) * 230 + t * 16) % 230; g.globalAlpha = 0.9; g.fillStyle = i % 2 ? '#f8c8d8' : '#fff0f4'; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
    }
    if (id === 'onsen_bath' && world.player.x > 11.5 * TILE) {
      const seas = game.season;
      for (let i = 0; i < 22; i++) { const x = 194 + (hash(i, 5, 2) * 120 + (seas === 'summer' ? 0 : t * 8)) % 120, y = (hash(i, 6, 2) * 120 + t * (seas === 'winter' ? 12 : 8)) % 120 + 10; g.globalAlpha = seas === 'summer' ? 0.4 + 0.4 * Math.sin(t * 2 + i) : 0.9; g.fillStyle = { spring: '#f8c8d8', summer: '#fff6a0', autumn: '#d9533b', winter: '#ffffff' }[seas]; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
    }
    g.restore();
  },
});

// ------------------------------------------------------------------ mountain forage
const cache = new Map();
const rare = (id) => (get('item', id) || {}).rarity || 1;
export function tkPool(game, short) {
  const ids = TK_FORAGE.filter((f) => f[2].includes(game.season) && f[3].includes(short)).map((f) => 'forage_' + f[0]);
  if (short === 'forest') for (const f of FORAGE) if (f[2].includes(game.season) && f[3] === 'wood') ids.push('forage_' + f[0]);
  return ids;
}
export function tkNodes(game, mapId) {
  const S = SV4(game); if (S.forage.day !== game.day) { S.forage.day = game.day; S.forage.taken = {}; cache.clear(); }
  const short = mapId.replace('tsukimi_', ''), ck = `${mapId}:${game.day}:${game.skillLevel('foraging')}:${game.weather}`;
  if (!cache.has(ck)) {
    const rng = game.rngFor('tk_forage_' + mapId), pool = tkPool(game, short), list = [];
    if (pool.length) for (const t of pickN(rng, mapTiles(mapId).filter((q) => GRASSY.includes(q.ground)), 6 + Math.floor(game.skillLevel('foraging') / 3) + (['rain', 'storm'].includes(game.weather) ? 2 : 0))) {
      let r = rng() * pool.reduce((a, p) => a + 1 / Math.pow(rare(p), 1.2), 0), id = pool[pool.length - 1];
      for (const p of pool) if ((r -= 1 / Math.pow(rare(p), 1.2)) < 0) { id = p; break; }
      list.push({ x: t.x, y: t.y, id, key: `${t.x},${t.y}` });
    }
    cache.set(ck, list);
  }
  return cache.get(ck).filter((n) => !(S.forage.taken[mapId] || []).includes(n.key));
}
function pick(game, mapId, node) {
  const S = SV4(game); if (!game.useEnergy(1)) return false;
  (S.forage.taken[mapId] ||= []).push(node.key);
  const n = 1 + (game.rng() < clamp(game.skillLevel('foraging') * 0.03, 0, 0.3) ? 1 : 0);
  game.give(node.id, n); game.advance(3); game.sfx('pop'); game.stat('foraged', n); game.stat('mountainForage', n); S.forage.n += n; game.addXP('foraging', 3 + rare(node.id) * 2); game.collect('forage', node.id); game.bus.emit('foraged', { item: node.id, n });
  if (S.forage.n >= 8) badge(game, 'forager');
  if (game.world) fx(game, ...centre(node.x, node.y), rare(node.id) >= 3 ? 12 : 6);
  if (rare(node.id) >= 3) game.toast(`A rare find: ${nm(node.id)}!`, get('item', node.id).icon);
  return true;
}
register('worldLayer', 'sv4_forage', {
  below(g, world, game) {
    if (!game.state.sv4_land || !exposedMap(world.map.id)) return;
    const t = game.clock || 0;
    for (const n of tkNodes(game, world.map.id)) { const x = n.x * TILE + 8, y = n.y * TILE + 14; world.drawFeet(get('item', n.id).icon, x, y); if (Math.floor(t * 3 + n.x * 3 + n.y) % 8 < 1) world.drawFeet('sw_glint', x + 6, y - 10); }
  },
});
register('targetProvider', 'sv4_forage', {
  find(world, game) {
    if (!game.state.sv4_land || !exposedMap(world.map.id)) return null;
    let best = null, bd = 18;
    for (const n of tkNodes(game, world.map.id)) { const d = Math.hypot(n.x * TILE + 8 - world.player.x, n.y * TILE + 10 - world.player.y); if (d < bd) { bd = d; best = n; } }
    return best ? { label: `Pick ${nm(best.id).toLowerCase()}`, dist: bd - 6, x: best.x * TILE + 8, y: best.y * TILE + 8, run: (g) => pick(g, world.map.id, best) } : null;
  },
});

// ------------------------------------------------------------------ animals
const FRAMES = (a, walk) => (walk ? Math.floor(a.anim * 5) % 2 : (Math.floor(a.anim * 0.9) % 4 === 0 ? 1 : 0));
class Beast extends Critter {
  constructor(id, o) { super(id, { label: o.label, speed: o.speed || 16, state: 'idle', t: 1 + Math.random() * 3 }); Object.assign(this, o); this.map = o.map; }
  get sprite() {
    const walk = this.state === 'walk';
    if (this.sleepy && this.state === 'sleep') return `${this.pre}_s0`;
    return `${this.pre}_${walk ? 'w' : 'i'}${FRAMES(this, walk)}`;
  }
  update(dt, game, world) {
    this.tickBase(dt, world); this.t -= dt;
    if (this.state === 'walk') { if (this.stepPath(dt, this.speed)) { this.state = 'idle'; this.t = 2 + Math.random() * 6; } return; }
    if (this.t > 0) return;
    if (this.sleepy && this.state !== 'sleep' && Math.random() < 0.35) { this.state = 'sleep'; this.t = 8 + Math.random() * 14; return; }
    if (this.state === 'sleep') this.state = 'idle';
    const [x0, y0, x1, y1] = this.rect;
    for (let k = 0; k < 8; k++) { const nx = x0 + Math.floor(Math.random() * (x1 - x0 + 1)), ny = y0 + Math.floor(Math.random() * (y1 - y0 + 1)); if ((world.grid[ny] || [])[nx] && this.pathTo(world, nx, ny)) { this.state = 'walk'; return; } }
    this.t = 1.5;
  }
  draw(g, world) { this.drawSprite(world, this.sprite, this.dir < 0, this.shadow || 10); }
  interact(game) { return this.talk(game, this); }
}
const rs = (S) => S.ranch;
const friendPts = (S, n) => rs(S).friend[n] || 0;
const heartsOf = (S, n) => Math.min(10, Math.floor(friendPts(S, n) / 100));
function bond(game, name, n) { const S = SV4(game), b = heartsOf(S, name); rs(S).friend[name] = Math.min(1000, friendPts(S, name) + n); if (heartsOf(S, name) > b) game.toast(`${name} is at ${heartsOf(S, name)} hearts!`, 'heart'); }
const pet = (game, a, name) => { const S = SV4(game); if (rs(S).brushed[name] === game.day) return say(game, `${name} leans in. You already fussed over ${name} today.`); rs(S).brushed[name] = game.day; bond(game, name, 20); a.say('heart', 2); game.addMood(3); game.sfx('pop'); game.stat('ranchPets'); return Promise.resolve(); };
function ranchTalk(kind) {
  return (game, a) => {
    const S = SV4(game), name = a.nm, hs = heartsOf(S, name), opts = [{ text: 'Pet', steps: [{ t: 'call', fn: () => pet(game, a, name) }] }];
    if (kind === 'cow') opts.unshift({ text: 'Milk her', steps: [{ t: 'call', fn: () => {
      if (rs(S).milked[name] === game.day) return say(game, `${name} has been milked today.`);
      if (!game.useEnergy(2)) return game.toast('Too tired');
      rs(S).milked[name] = game.day; game.advance(10); bond(game, name, 15); game.sfx('pop'); game.stat('cowsMilked'); game.addXP('homemaking', 3);
      const big = hs >= 4 && game.rng() < 0.3, id = get('item', big ? 'art_milk_large' : 'art_milk') ? (big ? 'art_milk_large' : 'art_milk') : 'drink_ml_fresh_milk';
      game.give(id, 1); a.say('i_music', 1.5); game.toast(`${name} gave ${nm(id).toLowerCase()}`, get('item', id).icon);
    } }] });
    if (kind === 'sheep') opts.unshift({ text: 'Shear', steps: [{ t: 'call', fn: () => {
      const d = rs(S).sheared[name] || -9;
      if (game.day - d < 3) return say(game, `${name} was sheared recently. Her fleece needs ${3 - (game.day - d)} more day(s).`);
      if (!game.useEnergy(3)) return game.toast('Too tired');
      rs(S).sheared[name] = game.day; game.advance(20); bond(game, name, 15); game.give(get('item', 'art_wool') ? 'art_wool' : 'gift_ml_wool_socks', 1); game.stat('sheepSheared'); game.addXP('crafting', 3); a.say('i_music', 1.5); game.toast(`${name} looks very pleased with her new haircut`, 'heart');
    } }] });
    if (kind === 'horse') {
      opts.unshift({ text: 'Ride a lap', steps: [{ t: 'call', fn: () => {
        if (rs(S).rode === game.day) return say(game, `${name} needs a rest after your ride.`);
        if (hs < 2) return say(game, `${name} is not sure about you yet. Brush and feed ${name} a carrot first (2 hearts).`);
        if (!game.useEnergy(5)) return game.toast('Too tired');
        rs(S).rode = game.day; game.advance(30); bond(game, name, 20); game.addMood(10); game.stat('horseRides'); return say(game, `Wind in your hair, hooves drumming on the meadow, the whole valley rushing by. ${name} snorts with joy.`);
      } }] });
      if (game.has('ing_carrot')) opts.push({ text: 'Offer a carrot', steps: [{ t: 'call', fn: () => { game.take('ing_carrot', 1); bond(game, name, 30); a.say('heart', 2); game.sfx('eat'); } }] });
    }
    opts.push({ text: `How is ${name}?`, steps: [{ t: 'call', fn: () => say(game, `${name} the ${kind}: ${hs} of 10 hearts.`) }] }, { text: 'Leave', steps: [] });
    return game.run([{ t: 'choice', prompt: name, options: opts }]);
  };
}
const catTalk = (game, a) => {
  const S = SV4(game);
  return game.run([{ t: 'choice', prompt: `${a.nm} the onsen cat`, options: [
    { text: 'Pet', steps: [{ t: 'call', fn: () => { game.addMood(3); a.say('heart', 2); game.sfx('pop'); S.cats.pets = (S.cats.pets || 0) + 1; } }] },
    ...(game.has('dish_yk_cat_snack') ? [{ text: 'Give a snack', steps: [{ t: 'call', fn: () => { game.take('dish_yk_cat_snack', 1); S.cats.fedN++; S.cats.hearts = Math.min(10, S.cats.hearts + (S.cats.fed === game.day ? 0 : 1)); S.cats.fed = game.day; a.say('i_music', 2); game.sfx('eat'); game.addMood(4); } }] }] : []),
    { text: 'Leave', steps: [] }] }]);
};
const deerTalk = (game, a) => game.run([{ t: 'choice', prompt: 'Deer', options: [{ text: 'Pet', steps: [{ t: 'call', fn: () => { const S = SV4(game); S.deer++; badge(game, 'deer_friend'); a.say('heart', 2); game.addMood(3); game.sfx('pop'); } }] }, { text: 'Leave it be', steps: [] }] }]);
const monkeyTalk = (game, a) => game.run([{ t: 'choice', prompt: 'Snow monkey', options: [{ text: 'Watch quietly', steps: [{ t: 'call', fn: () => { SV4(game).monkeys++; game.addMood(4); a.say('i_music', 1.5); game.stat('monkeyWatch'); } }] },
  ...(game.has('forage_chestnut') ? [{ text: 'Offer a chestnut', steps: [{ t: 'call', fn: () => { game.take('forage_chestnut', 1); SV4(game).monkeys += 2; a.say('heart', 2); game.addMood(6); game.sfx('eat'); if (get('item', 'forage_tk_pine_resin') && game.rng() < 0.4) game.give('forage_tk_pine_resin', 1); } }] }] : []), { text: 'Leave', steps: [] }] }]);

const COW = ['Hana', 'Mimi', 'Choco', 'Yuki', 'Bessie'], SHEEP = ['Wooly', 'Mugi', 'Puff', 'Nimbus', 'Dolly', 'Kumo'], HORSE = ['Kaze', 'Sakura', 'Tetsu'], CATS = ['Mikan', 'Sumi', 'Shiro', 'Tora', 'Kinako', 'Yuzu'];
const WANT = (game, world) => {
  const id = world.map.id, out = [];
  const h = game.minutes / 60, rain = ['rain', 'storm', 'snow'].includes(game.weather);
  if (id === 'meadow_ranch') {
    COW.forEach((n, i) => out.push({ k: `cow${i}`, pre: 'ml_cow', nm: n, rect: PASTURES.cow, speed: 12, shadow: 18, talk: ranchTalk('cow'), label: `Greet ${n}` }));
    SHEEP.forEach((n, i) => out.push({ k: `sheep${i}`, pre: 'ml_sheep', nm: n, rect: PASTURES.sheep, speed: 15, shadow: 13, talk: ranchTalk('sheep'), label: `Greet ${n}` }));
    HORSE.forEach((n, i) => out.push({ k: `horse${i}`, pre: 'ml_horse', nm: n, rect: PASTURES.horse, speed: 24, shadow: 18, talk: ranchTalk('horse'), label: `Greet ${n}` }));
  }
  if (id === 'yukemuri_village') {
    const area = [30, 22, 52, 28];
    CATS.forEach((n, i) => out.push({ k: `cat${i}`, pre: `yk_cat${i % 3}`, nm: n, rect: i < 3 ? area : [3, 20, 30, 21], speed: 20, shadow: 8, sleepy: true, talk: catTalk, label: `Greet ${n}` }));
    if (game.season === 'winter') for (let i = 0; i < 4; i++) out.push({ k: `monkey${i}`, pre: 'tk_monkey', nm: 'Monkey', rect: [51, 4, 56, 9], speed: 18, shadow: 8, talk: monkeyTalk, label: 'Watch the monkey' });
  }
  if (id === 'tsukimi_forest' && h >= 6 && h < 19 && game.weather !== 'storm') for (let i = 0; i < 2; i++) out.push({ k: `deer${i}`, pre: 'sw_deer', fixed: true, nm: 'Deer', rect: [20, 41, 26, 47], speed: 16, shadow: 11, talk: deerTalk, label: 'Greet the deer' });
  void rain;
  return out;
};
const pool = {};
register('worldTick', 'sv4_beasts', {
  update(dt, world, game) {
    if (!game.state.sv4_land) return;
    const id = world.map.id, want = WANT(game, world), keys = new Set(want.map((w) => w.k));
    for (const k of Object.keys(pool)) if (pool[k].map !== id || !keys.has(k)) { world.pets = world.pets.filter((p) => p !== pool[k]); delete pool[k]; }
    for (const w of want) {
      if (pool[w.k]) continue;
      const a = new Beast(`sv4_${w.k}`, { ...w, map: id }); a.game = game;
      if (w.fixed) Object.defineProperty(a, 'sprite', { get() { return 'sw_deer'; } });
      const [x0, y0, x1, y1] = w.rect; let ok = false;
      for (let i = 0; i < 40 && !ok; i++) { const x = x0 + Math.floor(Math.random() * (x1 - x0 + 1)), y = y0 + Math.floor(Math.random() * (y1 - y0 + 1)); if ((world.grid[y] || [])[x]) { [a.x, a.y] = tileCenter(x, y); ok = true; } }
      if (!ok) continue;
      pool[w.k] = a; world.pets.push(a);
    }
  },
});
export const beastRects = () => PASTURES;
void get;

features('Mountain & Meadow', [
  'Seasonal mountain forage nodes in the forest, falls and summit: pick sparkles on the ground for mushrooms, ferns, berries and alpine flowers (8 picks earn the Forager badge)',
  'Fog banks, a darkening thunder sky with lightning flashes and drifting snow on the mountain, plus red koyo leaves falling on the trails in autumn',
  'The summit shows a rolling sea of clouds below the lookout at dawn, and cherry petals drift over the meadow in spring',
  'The open-air bath changes with the season: petals, fireflies, falling leaves or snow',
  'Deer graze in the forest glade by day; pet one for the Deer Friend badge',
  'Cows to milk, sheep to shear and horses to brush, feed and ride at Meadow Ranch, each with its own name and ten hearts of friendship',
  'A colony of six onsen cats roams Yukemuri, naps in the sun and loves cat snacks',
  'Snow monkeys come down to the village hot pool in winter',
  'The Tsukimi rope bridge over the mountain stream earns the Bridge Crosser badge',
]);
