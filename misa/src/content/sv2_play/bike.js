// Bicycle: buy one at Pedal & Pump (shotengai), ride outdoors at about 1.7x speed (key B, the Bike key in your bag, or a bike rack),
// ring the bell (key V), auto-dismount indoors, name her, upgrade tires and basket (basket adds bag slots while riding), repaint her.
// Riding earns slow energy recovery that grows with a Bicycle skill (km ridden). The RUN button / Shift still works: you ride faster.
// Hooks: WorldScene.prototype.update is wrapped (extra movement after the engine's own step); worldLayer 'sv2_bike' draws the bike
// (wheels under Misa, frame / handlebars / basket over her); the town_bikebell interaction (bike racks) becomes a rack menu.
import { register, get, features } from '../../core/registry.js';
import { WorldScene } from '../../world/world.js';
import { moveBody, TILE } from '../../world/map.js';
import { spotPos } from '../../systems/festivals.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { S, say, N, call, PAINT_NAMES } from './state.js';
import { hookObjects } from './arcade.js';

export const B = (g) => S(g).bike;
export const BASKET = [0, 2, 4, 6];
export const speedMult = (g) => 1.7 + 0.1 * B(g).tires;
export const SKILL_KM = [0, 2, 6, 12, 20, 35];
export const bikeLevel = (g) => SKILL_KM.reduce((a, k, i) => (B(g).km >= k ? i : a), 0);
const NAMES = ['Pedal', 'Bean', 'Comet', 'Sakura', 'Turbo Tofu', 'Dandelion', 'Mochi Jr', 'Pogo', 'Biscuit', 'Nimbus'];
export const bikeName = (g) => B(g).name || 'your bike';
const outdoor = (w) => !!(w && w.map && w.map.def && w.map.def.outdoor);
let GAME = null;

export function ring(g) {
  const b = B(g); g.sfx(b.bell === 2 ? 'pop' : b.bell === 1 ? 'chime' : 'bell');
  const w = g.world; if (w) { w.player.emote = 'i_music'; w.player.emoteT = 0.9; }
  g.stat('bikeBells');
}
export function nameSteps(g) {
  const r = g.rngFor('sv2bikename'), pool = NAMES.slice().sort(() => r() - 0.5).slice(0, 5);
  return [say('misa', 'happy', 'Every good bike needs a name. What should I call mine?'), { t: 'choice', prompt: 'Name your bike', options: [
    ...pool.map((n) => ({ text: n, steps: [call((gg) => { B(gg).name = n; gg.toast(`Your bike is now called ${n}.`); })] })),
    { text: 'Surprise me', steps: [call((gg) => { B(gg).name = NAMES[Math.floor(Math.random() * NAMES.length)]; gg.toast(`Her name is ${B(gg).name}.`); })] }] }];
}
export function mount(g) {
  const b = B(g), w = g.world; if (!w || b.riding) return false;
  b.riding = true; b.parked = null; b.applied = BASKET[b.basket]; g.state.bagSize += b.applied; b.rides++;
  ring(g); g.stat('bikeRides');
  if (b.applied) g.toast(`Basket on: +${b.applied} bag slots while riding`);
  if (!b.name) g.run(nameSteps(g));
  return true;
}
export function dismount(g, at, quiet) {
  const b = B(g); if (!b.riding) return false;
  b.riding = false; g.state.bagSize = Math.max(8, g.state.bagSize - (b.applied || 0)); b.applied = 0;
  const w = g.world;
  if (at !== false) b.parked = at || (w && outdoor(w) ? { map: w.map.id, x: w.player.x, y: w.player.y } : b.last);
  if (!quiet) g.sfx('step');
  return true;
}
export function toggleRide(g) {
  const b = B(g), w = g.world;
  if (!w) return;
  if (b.riding) { dismount(g); g.toast(`You hop off ${bikeName(g)}.`); return; }
  if (!b.owned) { g.toast('You do not have a bike yet. Pedal & Pump in the shotengai sells them.'); return; }
  if (!outdoor(w)) { g.toast('You can only ride outdoors.'); return; }
  const pk = b.parked;
  if (pk && pk.map !== w.map.id) { g.toast(`${bikeName(g)} is parked at ${(get('map', pk.map) || { name: pk.map }).name}. Fetch her from a bike rack.`); return; }
  if (pk && Math.hypot(pk.x - w.player.x, pk.y - w.player.y) > 60) { g.toast(`Walk closer to ${bikeName(g)} to hop on.`); return; }
  mount(g);
}
export function parkHome(g) {
  const b = B(g); if (!b.owned || b.riding) return;
  const p = spotPos('yard', 'gate') || { x: 100, y: 100 };
  b.parked = { map: 'yard', x: p.x + 14, y: p.y };
}

// ---------------------------------------------------------------- engine hooks
const orig = WorldScene.prototype.update;
WorldScene.prototype.update = function (dt, input) {
  const g = this.game, b = g && g.state && g.state.sv2 && g.state.sv2.bike;
  if (!b || !b.owned || this.busy || (g.scenes && g.scenes.top !== this)) return orig.call(this, dt, input);
  if (input.pressed.has('b')) toggleRide(g);
  if (input.pressed.has('v') && b.riding) ring(g);
  const p = this.player, px = p.x, py = p.y;
  const r = orig.call(this, dt, input);
  if (b.riding) {
    if (!outdoor(this)) return r;
    let dx = p.x - px, dy = p.y - py;
    const d = Math.hypot(dx, dy);
    if (p.moving && !p.path && d > 0 && d < 6) {
      const mult = speedMult(g) * (p.run ? 0.92 : 1) - 1;
      moveBody(this.map, p, dx * mult, dy * mult, this.rects);
      dx = p.x - px; dy = p.y - py; const dd = Math.hypot(dx, dy);
      b.px += dd; b.km = b.px / (TILE * 100);
      const lvl = bikeLevel(g);
      if (lvl >= 1 && !g.flag('bicycle_skill')) { g.setFlag('bicycle_skill'); g.toast('Bicycle skill: legs are getting stronger. Riding restores energy.', 'i_star'); }
      g.setFlag('bicycle_lvl', lvl);
      if (b.regenDay !== g.day) { b.regenDay = g.day; b.regen = 0; b.acc = 0; }
      b.acc = (b.acc || 0) + (dd / TILE) * 0.02 * (1 + 0.4 * lvl);
      while (b.acc >= 1 && b.regen < 25 + 5 * lvl) { b.acc--; b.regen++; g.addEnergy(1); }
      b.last = { map: this.map.id, x: p.x, y: p.y };
      if (Math.floor(b.km) !== Math.floor((b.px - dd) / (TILE * 100))) { g.bus.emit('sv2BikeRide', { km: b.km }); g.toast(`${Math.floor(b.km)} km ridden`); }
    }
  }
  return r;
};

register('worldLayer', 'sv2_bike', {
  sprites(world, game) {
    const b = B(game), p = world.player, out = [];
    if (!b.owned) return out;
    if (b.riding && outdoor(world)) {
      const side = p.dir === 'left' || p.dir === 'right', flip = p.dir === 'left', pa = b.paint, bk = b.basket;
      const bob = p.moving ? Math.round(Math.abs(Math.sin(p.at * (p.run ? 14 : 10)))) : 0;
      const u = side ? `sv2_bike_side_u${pa}` : `sv2_bike_front_u${pa}`, o = side ? `sv2_bike_side_o${pa}_${bk}` : `sv2_bike_front_o${pa}_${p.dir === 'up' ? 0 : bk}`;
      out.push({ y: p.y - 0.02, draw: () => { world.shadow(p.x, p.y, side ? 16 : 9); world.drawFeet(u, p.x, p.y + 1, flip); } });
      out.push({ y: p.y + 0.02, draw: () => world.drawFeet(o, p.x + (side ? (flip ? -1 : 1) * 0 : 0), p.y + 1 - bob, flip) });
    } else if (b.parked && b.parked.map === world.map.id) {
      const q = b.parked;
      out.push({ y: q.y, draw: () => { world.shadow(q.x, q.y, 15); world.drawFeet(`sv2_bike_park${b.paint}`, q.x, q.y + 1); } });
    }
    return out;
  },
});
register('targetProvider', 'sv2_bike', {
  find(world, game) {
    const b = B(game), q = b.parked;
    if (!b.owned || b.riding || !q || q.map !== world.map.id || !outdoor(world)) return null;
    const d = Math.hypot(q.x - world.player.x, q.y - world.player.y);
    return d < 30 ? { label: `Hop on ${bikeName(game)}`, dist: d, x: q.x, y: q.y - 14, run: (g) => mount(g) } : null;
  },
});

// ---------------------------------------------------------------- bike racks (the town_bikebell interaction)
const rack = get('interaction', 'town_bikebell');
export function rackSteps(g) {
  const b = B(g), w = g.world;
  if (!b.owned) return [call((gg) => { gg.sfx('bell'); gg.toast('Ring ring! A shiny bike shop opened in the shotengai.'); })];
  const opts = [];
  if (b.riding) opts.push({ text: 'Park here', steps: [call((gg) => { dismount(gg, { map: w.map.id, x: w.player.x + 14, y: w.player.y }); gg.toast(`${bikeName(gg)} is parked at the rack.`); })] });
  else opts.push({ text: `Get ${bikeName(g)} out`, steps: [call((gg) => { b.parked = { map: w.map.id, x: w.player.x + 14, y: w.player.y }; mount(gg); })] });
  opts.push({ text: 'Ring the bell', steps: [call((gg) => ring(gg))] });
  opts.push({ text: 'Polish the frame', steps: [call((gg) => { if (b.polishDay === gg.day) { gg.toast('She is already gleaming.'); return; } b.polishDay = gg.day; gg.addMood(4); gg.addEnergy(-2); gg.sfx('scrub'); gg.toast(`${bikeName(gg)} gleams. Mood up!`); })] });
  opts.push({ text: 'Rename the bike', steps: [call((gg) => gg.run(nameSteps(gg)))] });
  opts.push({ text: 'Bike info', steps: [call((gg) => gg.run([N(`${bikeName(gg)}: ${PAINT_NAMES[b.paint]} frame. Tires level ${b.tires}, basket level ${b.basket} (+${BASKET[b.basket]} slots). ${b.km.toFixed(1)} km ridden, Bicycle skill ${bikeLevel(gg)}.`)]))] });
  opts.push({ text: 'Leave', steps: [] });
  return [{ t: 'choice', prompt: 'Bike rack', options: opts }];
}
if (rack) { rack.label = (g) => (B(g).owned ? 'Bike rack' : 'Ring a bike bell'); rack.run = (g) => g.run(rackSteps(g)); }

// ---------------------------------------------------------------- the shop
const price = (g, a) => a;
register('shop', 'sv2_bike', {
  name: 'Pedal & Pump Bikes', owner: null, keeper: { name: 'Tomo', look: { hair: '#2d3a5a', top: '#e8643c', bottom: '#3a4a6a', skin: '#e8b890', accent: '#ffd76a' } }, hours: ['9:00', '19:00'], color: K.sky[2], buys: [],
  greet: { default: ['Welcome to Pedal & Pump! Two wheels, zero worries.', 'Hoshimori is flat enough to love a bicycle. Ask me anything.', 'Tires, baskets, bells. If it spins or rings, I have it.'], thanks: ['Ride safe, and ring that bell!', 'She will take you anywhere the road goes.'] },
  stock: [{ item: 'sv2_lantern', price: 180 }, { item: 'sv2_watch', price: 220 }, { item: 'sv2_compass', price: 160 }, { item: 'sv2_battery', price: 45 }],
  get services() {
    return this._svc ||= [
      { id: 'sv2_buy_bike', name: 'City bicycle', desc: 'A sturdy commuter bike in coral. Includes a bell and a key. Rides at 1.7x walking speed outdoors.', price: 800, icon: 'i_star', when: (g) => !B(g).owned,
        run: (g) => { const b = B(g), w = g.world; b.owned = true; g.give('sv2_bike_key', 1, true); if (w) b.parked = { map: w.map.id, x: w.player.x + 18, y: w.player.y + 4 }; g.stat('bikesBought'); g.toast('You got a bicycle! Press B near it to hop on.', 'i_star'); return 'She is all yours! Walk up to her and press B, and come back for a name.'; } },
      ...[[1, 'Smooth tires', 350, 'Rides at 1.8x'], [2, 'Racing tires', 700, 'Rides at 1.9x'], [3, 'Featherlight tires', 1200, 'Rides at 2.0x']].map(([n, nm, pr, d]) => ({ id: 'sv2_tires' + n, name: nm, desc: `${d} walking speed.`, price: pr, icon: 'i_star', when: (g) => B(g).owned && B(g).tires === n - 1, run: (g) => { B(g).tires = n; return 'Fresh tires on! Feel that glide?'; } })),
      ...[[1, 'Wicker basket', 250, 2], [2, 'Big basket', 500, 4], [3, 'Cargo basket', 900, 6]].map(([n, nm, pr, sl]) => ({ id: 'sv2_basket' + n, name: nm, desc: `+${sl} bag slots while riding.`, price: pr, icon: 'i_bag', when: (g) => B(g).owned && B(g).basket === n - 1, run: (g) => { const b = B(g); b.basket = n; if (b.riding) { g.state.bagSize += sl - b.applied; b.applied = sl; } return 'Nice and roomy. Mind the eggs.'; } })),
      ...PAINT_NAMES.map((nm, i) => ({ id: 'sv2_paint' + i, name: `Repaint: ${nm}`, desc: 'A fresh coat of paint, applied while you wait.', price: 80, icon: 'i_star', when: (g) => B(g).owned && B(g).paint !== i, run: (g) => { B(g).paint = i; return `${nm} suits her!`; } })),
      { id: 'sv2_bell', name: 'Swap the bell', desc: 'Cycle the bell: classic ding, soft chime, or a honk.', price: 60, icon: 'i_music', when: (g) => B(g).owned, run: (g) => { B(g).bell = (B(g).bell + 1) % 3; g.sfx(B(g).bell === 2 ? 'pop' : B(g).bell === 1 ? 'chime' : 'bell'); return ['Classic ding it is.', 'A soft chime. Fancy!', 'A honk. Bold choice.'][B(g).bell]; } },
    ];
  },
});
register('interaction', 'sv2_bike_stall', { label: 'Pedal & Pump Bikes', run: (g) => g.run([{ t: 'shop', id: 'sv2_bike' }]) });

// shotengai stall prop (same object-wrapping helper the arcade uses)
hookObjects('shotengai', (objs) => [...objs, { spr: 'sv2_bike_stall', x: 29, y: 10, w: 2, use: 'sv2_bike_stall', shadow: 26 }]);
// push pocket gear and batteries into the mart (the same runtime push other packs use)
const mart = get('shop', 'mart');
if (mart && Array.isArray(mart.stock)) mart.stock.push('sv2_battery');

export function bikeSystem(game) {
  GAME = game;
  game.sv2ToggleRide = () => toggleRide(game);
  game.bus.on('mapEnter', () => {
    const w = game.world, b = B(game);
    if (b.riding && w && !outdoor(w)) { dismount(game, b.last || false); game.toast(`You walk ${bikeName(game)} to the door and park her outside.`); }
    else if (b.riding && w) b.last = { map: w.map.id, x: w.player.x, y: w.player.y };
  });
  game.bus.on('dayStart', () => { const b = B(game); if (b.riding) dismount(game, false, true); parkHome(game); const l = S(game).light; if (l.battery < 100) l.battery = 100; });
  game.bus.on('gameLoaded', () => { const b = B(game); if (b.riding) { game.state.bagSize = Math.max(8, game.state.bagSize - (b.applied || 0)); b.riding = false; b.applied = 0; b.parked = b.last || null; } });
}
void price; void GAME;

features('Arcade & Travel', [
  'Bicycle for sale at Pedal & Pump, a new stall in the shotengai: a 1.7x outdoor speed boost, a bell and a key item',
  'Press B (or use the Bike key item) to hop on and off; Misa rides with wheels drawn under her and a frame, handlebars and basket over her',
  'Press V on the bike to ring the bell; three bell sounds: ding, chime or honk',
  'The bike dismounts automatically when you walk indoors and waits outside; at dawn it is back at the yard gate',
  'Bike racks in town, the shotengai and school grounds become a menu: get your bike out, park, ring, polish, rename, info',
  'Name your bike from a list of cute names the first time you ride her, or rename her at a rack',
  'Tires upgrade three times (1.8x, 1.9x, 2.0x); the RUN button and Shift make the bike faster still',
  'Baskets add 2, 4 or 6 bag slots while you ride; they come off when you hop off',
  'Five frame paints at the bike shop, plus a bell swap',
  'Cycling counts kilometres; Bicycle skill unlocks a daily energy recovery while riding, with a cap that grows each level',
  'Pedal & Pump also sells the pocket lantern, pocket watch, compass and batteries',
]);
