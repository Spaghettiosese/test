// Farm depth: sprinklers, scarecrows and the daily crow event, fertiliser tiers, crop quality stars, the greenhouse,
// giant crops, the shipping log with quality and artisan bonuses, the daily farm report and the Farm phone app.
import { register, get, all, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { dateOf } from '../../core/time.js';
import { SV, FERTS, FERT_NOTE, SPECIES, hearts, isBaby } from './data.js';
import { addStar, starBonus, pruneStars, starTotal, nm, isArtisan, STAR } from './core.js';
import { machineSystem, tickMachines, onMap, def as mdef, stateOf } from './machines.js';
import { animalsOvernight, moodOf } from './animals.js';
import { bindGame, ghOpen } from './maps.js';
import { facingTile, tileOf, sparkle, inWorld } from '../hobbies/common.js';
import { plotRects, inPlot, isRipe } from '../hobbies/world.js';
import { panel, rect, drawText, C, fit, inside, RAMPS as Rr } from '../economy/gfx.js';

const BAD = ['rain', 'storm', 'snow'];
const plots = (game) => game.state.hobbies.plots;
function eachPlot(game, fn) { for (const [mapId, P] of Object.entries(plots(game))) for (const [k, p] of Object.entries(P)) { const [x, y] = k.split(',').map(Number); fn(p, mapId, x, y, k); } }
const scareOf = (game, mapId, x, y) => onMap(game, mapId).some((m) => { const d = mdef(m.kind); return d.scare && Math.hypot(m.x - x, m.y - y) <= d.scare; });

// ---------------------------------------------------------------- overnight farm work (runs after the hobbies garden growth)
function greenhouse(game) {
  if (!ghOpen()) return;
  const P = plots(game).backyard || {};
  for (const p of Object.values(P)) {
    const cr = p.crop && get('crop', p.crop); if (!cr) continue;
    if (p.dead && !cr.seasons.includes(game.season)) {
      p.dead = false;
      if (p.wat === game.day - 1 && p.age < cr.days) { p.age++; p.dry = 0; p.wilt = false; } else if (p.age < cr.days) { p.dry = (p.dry || 0) + 1; if (p.dry >= 2) p.wilt = true; }
    }
  }
}
function fertEffects(game) {
  eachPlot(game, (p) => {
    if (!p.crop) { delete p.fert; return; }
    const cr = get('crop', p.crop); if (!cr || p.dead) return;
    if (p.fert === 'art_fert_retain' && p.wat === game.day - 2 && p.age < cr.days) { p.age++; p.dry = 0; p.wilt = false; }
    if (p.fert === 'art_fert_giant' && isRipe(p) && !p.giant && (cr.id === 'crop_pumpkin' || cr.id === 'crop_tomato') && game.rng() < 0.3) p.giant = true;
  });
}
function sprinklers(game) {
  let n = 0;
  for (const m of game.state.sv_farm.machines) {
    const d = mdef(m.kind); if (!d || !d.sprinkler) continue;
    const P = plots(game)[m.map]; if (!P) continue;
    const r = d.sprinkler === 3 ? 2 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if ((dx || dy) === 0 || (d.sprinkler === 1 && Math.abs(dx) + Math.abs(dy) > 1)) continue;
      const p = P[`${m.x + dx},${m.y + dy}`]; if (!p || !p.till || p.wat === game.day) continue;
      p.wat = game.day; if (p.wilt) { p.wilt = false; p.dry = 0; } n++;
    }
  }
  return n;
}
function crowPlan(game) {
  const S = SV(game); S.crow = null;
  if (['storm', 'snow'].includes(game.weather) || game.season === 'winter' && game.rng() < 0.5) return;
  const P = plots(game).yard || {}, list = [];
  for (const [k, p] of Object.entries(P)) { if (!p.crop || p.dead) continue; const [x, y] = k.split(',').map(Number); if (!scareOf(game, 'yard', x, y)) list.push(k); }
  if (!list.length || game.rngFor('crow')() > 0.3) return;
  const rng = game.rngFor('crowpick');
  list.sort(() => rng() - 0.5);
  S.crow = { day: game.day, keys: list.slice(0, Math.min(3, list.length)), shooed: false, active: true };
}
export function resolveCrows(game) {
  const S = SV(game), c = S.crow; if (!c || !c.active) return 0;
  c.active = false; if (c.shooed) return 0;
  const P = plots(game).yard || {}; let n = 0;
  for (const k of c.keys) if (P[k] && P[k].crop && !P[k].dead) { delete P[k].crop; delete P[k].fert; P[k].age = 0; n++; }
  if (n) { game.toast(`Crows ate ${n} crop${n > 1 ? 's' : ''} in the garden!`, 'i_anger'); game.stat('svCrowLoss', n); }
  return n;
}
function report(game, extra) {
  const S = SV(game), L = [];
  let ripe = 0, thirsty = 0, growing = 0, dead = 0;
  eachPlot(game, (p, map) => { if (!p.crop) return; if (p.dead) dead++; else if (isRipe(p)) ripe++; else { growing++; if (p.wat !== game.day && !BAD.includes(game.weather)) thirsty++; } void map; });
  const bin = Object.values(S.bin).reduce((a, b) => a + b, 0), ready = S.machines.filter((m) => m.ready).length, sick = S.animals.filter((a) => a.sick).length;
  const hungry = S.animals.filter((a) => a.ate !== game.day).length;
  if (S.animals.length) L.push(`Animals: ${S.animals.length}. ${bin} product${bin === 1 ? '' : 's'} in the bin${hungry ? `, ${hungry} went hungry` : ''}${sick ? `, ${sick} sick` : ''}.`);
  if (S.machines.some((m) => !mdef(m.kind).sprinkler && !mdef(m.kind).scare)) L.push(`Machines: ${ready} ready to collect.`);
  if (ripe + growing + dead) L.push(`Crops: ${ripe} ripe, ${growing} growing, ${thirsty} thirsty${dead ? `, ${dead} withered` : ''}.`);
  if (extra.sprinkled) L.push(`Sprinklers watered ${extra.sprinkled} tiles.`);
  if (S.crow && S.crow.active) L.push('Crows are eyeing the garden! Shoo them before noon.');
  if (dateOf(game.day) === 1 && dead) L.push(`A new season: ${dead} crop${dead > 1 ? 's' : ''} withered. Clear the plots and replant.`);
  if (BAD.includes(game.weather) && S.animals.length) L.push('Bad weather: the animals stay snug indoors.');
  S.report = L;
  if (L.length) game.toast(`Farm report: ${[ripe && `${ripe} ripe`, bin && `${bin} in the bin`, ready && `${ready} machine${ready > 1 ? 's' : ''} ready`, sick && `${sick} sick`].filter(Boolean).join(', ') || 'a quiet day on the farm'}`, 'i_leaf');
}
function overnight(game) {
  const S = SV(game); if (!S) return;
  greenhouse(game); fertEffects(game);
  const sprinkled = sprinklers(game);
  crowPlan(game); tickMachines(game); animalsOvernight(game);
  report(game, { sprinkled });
}

// ---------------------------------------------------------------- shipping, quality and artisan bonus
function ship(game) {
  const S = SV(game), box = game.state.economy.shipBox, items = Object.entries(box);
  let bonus = 0;
  if (items.length) {
    S.ship.days++;
    for (const [id, n] of items) {
      const unit = game.sellPrice(id, 'shipbox');
      S.ship.items[id] = (S.ship.items[id] || 0) + n; S.ship.total += unit * n;
      bonus += starBonus(game, id, n, unit);
      if (isArtisan(id)) bonus += Math.round(unit * n * 0.15);
    }
    if (bonus > 0) { game.moneyNote('Quality and artisan bonus'); game.addMoney(bonus, true); S.ship.bonus += bonus; S.ship.total += bonus; game.stat('svBonus', bonus); game.toast(`Shipping bonus tonight: +${bonus} coins for quality and artisan goods`, 'i_coin'); }
  }
  const keep = { ...Object.fromEntries(items) }; for (const [id, n] of Object.entries(S.bin)) keep[id] = (keep[id] || 0) + n;
  pruneStars(game, keep);
  resolveCrows(game);
}
function harvested(game, e) {
  const world = game.world; if (!world) return;
  const [tx, ty] = facingTile(world, 13), P = plots(game)[world.map.id], p = P && P[`${tx},${ty}`];
  const fert = p && p.fert, lv = game.skillLevel('gardening');
  const base = lv * 0.03 + (fert === 'art_fert_quality' ? 0.3 : fert === 'mat_fertiliser' ? 0.08 : 0);
  let best = 0;
  for (let i = 0; i < e.n; i++) {
    const r = game.rng(), q = r < base * 0.2 ? 3 : r < base * 0.55 ? 2 : r < base + 0.04 ? 1 : 0;
    if (q) { addStar(game, e.item, q); best = Math.max(best, q); game.stat('svStars'); }
  }
  if (best) game.toast(`${STAR[best]} quality ${nm(e.item).toLowerCase()}!`, 'i_star');
  if (p && !p.crop) delete p.fert;
}

// ---------------------------------------------------------------- world: crows, fertiliser, greenhouse planting
register('worldLayer', 'sv_crows', {
  sprites(world, game) {
    const c = game.state.sv_farm && game.state.sv_farm.crow;
    if (!c || !c.active || c.shooed || world.map.id !== 'yard') return [];
    return c.keys.map((k, i) => { const [x, y] = k.split(',').map(Number); return { y: (y + 1) * TILE, draw: (g, w, gm) => { w.shadow(x * TILE + 8, y * TILE + 14, 5); w.drawFeet(`sv_crow_${Math.floor(gm.clock * 2 + i) % 2}`, x * TILE + 8 + (i % 2 ? 2 : -2), y * TILE + 14); } }; });
  },
});
register('targetProvider', 'sv_crows', {
  find(world, game) {
    const c = game.state.sv_farm && game.state.sv_farm.crow;
    if (!c || !c.active || c.shooed || world.map.id !== 'yard') return null;
    const p = world.player; let best = null, bd = 40;
    for (const k of c.keys) { const [x, y] = k.split(',').map(Number), d = Math.hypot(p.x - (x * TILE + 8), p.y - 4 - (y * TILE + 12)); if (d < bd) { bd = d; best = [x, y]; } }
    if (!best) return null;
    return { label: 'Shoo the crows!', dist: Math.max(0, bd - 24), x: best[0] * TILE + 8, y: best[1] * TILE + 8, run: (g) => { c.shooed = true; sparkle(world, best[0] * TILE + 8, best[1] * TILE + 8, 10, '#2a2840'); g.sfx('flutter'); g.addXP('gardening', 3); g.stat('svCrowsShooed'); g.toast('The crows flap away. Garden saved!', 'i_star'); } };
  },
});
register('targetProvider', 'sv_fertilise', {
  find(world, game) {
    if (!game.state.sv_farm || !plotRects(world.map).length || !inWorld(game)) return null;
    const [tx, ty] = facingTile(world, 13); if (!inPlot(world.map, tx, ty)) return null;
    const p = (plots(game)[world.map.id] || {})[`${tx},${ty}`]; if (!p || !p.crop || p.dead || isRipe(p) || p.fert) return null;
    const have = FERTS.filter((f) => get('item', f) && game.has(f)); if (!have.length || p.wat !== game.day) return null;
    const run = (g, f) => {
      g.take(f, 1); p.fert = f; const cr = get('crop', p.crop);
      if (f === 'art_fert_speed') p.age = Math.min(cr.days, p.age + 1);
      g.sfx('dig'); g.addXP('gardening', 1); g.stat('svFert'); sparkle(world, tx * TILE + 8, ty * TILE + 8, 6, Rr.forest[3]); g.toast(FERT_NOTE[f], get('item', f).icon);
    };
    return { label: have.length === 1 ? `Spread ${nm(have[0]).toLowerCase()}` : 'Spread fertiliser', dist: 5, x: tx * TILE + 8, y: ty * TILE + 8,
      run: (g) => (have.length === 1 ? run(g, have[0]) : g.run([{ t: 'choice', prompt: 'Which fertiliser?', options: [...have.map((f) => ({ text: `${nm(f)} (${g.count(f)})`, steps: [{ t: 'call', fn: (gg) => run(gg, f) }] })), { text: 'Not now', steps: [] }] }])) };
  },
});
register('targetProvider', 'sv_gh_plant', {
  find(world, game) {
    if (world.map.id !== 'backyard' || !ghOpen() || !inWorld(game)) return null;
    const [tx, ty] = facingTile(world, 13); if (!inPlot(world.map, tx, ty)) return null;
    const p = (plots(game).backyard || {})[`${tx},${ty}`]; if (!p || !p.till || p.crop || p.dead) return null;
    const seeds = Object.keys(game.state.inv).filter((id) => { const it = get('item', id); return it && it.cat === 'seed' && it.crop && get('crop', it.crop) && !it.seasons.includes(game.season); });
    if (!seeds.length) return null;
    const sd = get('item', game.state.hobbies.seed && seeds.includes(game.state.hobbies.seed) ? game.state.hobbies.seed : seeds[0]);
    return { label: `Plant ${sd.name.replace(' seeds', '').toLowerCase()} (greenhouse)`, dist: 5, x: tx * TILE + 8, y: ty * TILE + 8, run: (g) => {
      g.take(sd.id, 1); Object.assign(p, { crop: sd.crop, age: 0, wat: 0, dry: 0, wilt: false, dead: false, planted: g.day });
      g.sfx('pop'); g.addXP('gardening', 3); g.stat('planted'); g.stat('svOffSeason'); g.bus.emit('planted', { crop: sd.crop });
    } };
  },
});

// ---------------------------------------------------------------- the Farm phone app
const TABS = ['PETS', 'TOOLS', 'CROPS', 'SHIP', 'NEWS'];
function rows(game, tab) {
  const S = SV(game), out = [], ok = C.ink, dim = C.dim, bad = RAMPS_BAD;
  if (tab === 0) {
    out.push([`Hay ${S.hay}/12 in trough. Bin: ${Object.values(S.bin).reduce((a, b) => a + b, 0)}`, dim]);
    for (const a of S.animals) out.push([`${a.name} the ${SPECIES[a.sp].name.toLowerCase()}: ${hearts(a)}/10 hearts, ${isBaby(game, a) ? 'baby, ' : ''}${moodOf(a)}${a.ate === game.day ? '' : ', hungry'}`, a.sick ? bad : ok]);
    if (!S.animals.length) out.push(['No animals yet. See the board in the back yard.', dim]);
  } else if (tab === 1) {
    for (const m of S.machines) { const d = mdef(m.kind); out.push([`${d.name} (${m.map}): ${d.sprinkler ? 'on duty' : d.scare ? 'on guard' : m.ready ? `READY ${nm(m.out)}` : m.left ? `${nm(m.out || '').toLowerCase()} in ${m.left}d` : 'empty'}`, m.ready ? C.good : ok]); }
    if (!S.machines.length) out.push(['Craft machines at the yard workbench, then place them.', dim]);
  } else if (tab === 2) {
    const by = {};
    eachPlot(game, (p, map) => { if (!p.crop) return; const o = (by[map] ||= { ripe: 0, grow: 0, dry: 0, dead: 0 }); if (p.dead) o.dead++; else if (isRipe(p)) o.ripe++; else { o.grow++; if (p.wat !== game.day) o.dry++; } });
    for (const [map, o] of Object.entries(by)) out.push([`${(get('map', map) || { name: map }).name}: ${o.ripe} ripe, ${o.grow} growing, ${o.dry} thirsty, ${o.dead} withered`, ok]);
    if (!Object.keys(by).length) out.push(['Nothing planted.', dim]);
    out.push([`Starred goods in stock: ${starTotal(game)}`, ok]);
    out.push([`Fertiliser: ${FERTS.map((f) => game.count(f)).reduce((a, b) => a + b, 0)} bags. Greenhouse: ${ghOpen() ? 'open' : 'not built'}`, ok]);
  } else if (tab === 3) {
    out.push([`Shipped: ${Object.values(S.ship.items).reduce((a, b) => a + b, 0)} items, ${S.ship.total} coins, bonuses ${S.ship.bonus}`, ok]);
    for (const [id, n] of Object.entries(S.ship.items).sort((a, b) => b[1] - a[1])) out.push([`${nm(id)} x${n}`, ok]);
  } else for (const l of S.report) out.push([l, ok]);
  return out;
}
const RAMPS_BAD = Rr.coral[1];
register('phoneApp', 'sv_farm', {
  name: 'Farm', icon: 'i_leaf', order: 44,
  open(game, app) { app.state.tab ??= 0; app.state.top = 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y, w, h } = app.area, n = rows(game, st.tab).length, per = Math.floor((h - 34) / 10);
    if (k.has('arrowright') || k.has('d') || k.has('c')) { st.tab = (st.tab + 1) % TABS.length; st.top = 0; }
    if (k.has('arrowleft') || k.has('a')) { st.tab = (st.tab + TABS.length - 1) % TABS.length; st.top = 0; }
    if (input.justDown) for (let i = 0; i < TABS.length; i++) if (inside(input.mx, input.my, x + 2 + i * Math.floor((w - 4) / 5), y + 2, Math.floor((w - 4) / 5) - 1, 13)) { st.tab = i; st.top = 0; }
    if (k.has('arrowdown') || k.has('s') || input.wheel > 0) st.top = Math.min(Math.max(0, n - per), st.top + 1);
    if (k.has('arrowup') || k.has('w') || input.wheel < 0) st.top = Math.max(0, st.top - 1);
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, tw = Math.floor((w - 4) / 5), R = rows(game, st.tab), per = Math.floor((h - 34) / 10);
    panel(g, x, y, w, h, 'paper');
    TABS.forEach((t, i) => { rect(g, i === st.tab ? Rr.butter[3] : Rr.paper[2], x + 2 + i * tw, y + 2, tw - 1, 13); drawText(g, t, x + 2 + i * tw + 3, y + 6, C.ink, 1, null); });
    R.slice(st.top, st.top + per).forEach(([t, col], i) => drawText(g, fit(t, w - 12), x + 6, y + 22 + i * 10, col, 1, null));
    drawText(g, 'LEFT/RIGHT: TABS  UP/DOWN: SCROLL', x + 6, y + h - 10, C.dim, 1, null);
  },
});

register('system', 'sv_farm', {
  init(game) {
    game.svActors = {}; bindGame(game); machineSystem(game);
    game.bus.on('dayStart', () => overnight(game));
    game.bus.on('dayEnd', () => game.state.sv_farm && ship(game));
    game.bus.on('hour', () => { const c = game.state.sv_farm && game.state.sv_farm.crow; if (c && c.active && game.minutes >= 12 * 60) resolveCrows(game); });
    game.bus.on('harvested', (e) => game.state.sv_farm && harvested(game, e));
    game.bus.on('shopSell', (e) => {
      if (!game.state.sv_farm || e.shop === 'shipbox' || !e.n) return;
      const b = starBonus(game, e.item, e.n, Math.round(e.gain / e.n));
      if (b > 0) { game.moneyNote('Quality bonus'); game.addMoney(b, true); game.toast(`Quality bonus +${b}`, 'i_star'); }
    });
  },
});
void tileOf; void all;

features('Farm & Animals', [
  'A back yard behind the house (gap in the east hedge of the front yard) with a coop, barn, fenced pen, hay stack and collect bin',
  'Ranch catalogue board: order baby chicks, ducklings, rabbits, goat kids and alpaca crias delivered the same day',
  'Name each new animal from three suggestions, and rename them later',
  'Farm animals are mochi-style actors that wander the pen, peck, hop and waddle with their own walk animations',
  'Babies are smaller and grow up after a few days; the farm report tells you when they do',
  'Pet your animals once a day to build friendship hearts (up to 10 each)',
  'Animal treats give extra friendship; hearts unlock gifts at 5 hearts and a co-op bonus at 10',
  'Hay: fill the trough in the pen; hungry animals lose happiness and friendship and make nothing',
  'Cut grass in the back yard to find hay for free, or buy bales at Sunny Mart and the catalogue',
  'Feed an animal by hand with hay for a small friendship boost',
  'Animals stay in the coop and barn when it rains, storms or snows, and walk home at dusk',
  'Chickens lay eggs every day, ducks lay duck eggs and feathers, rabbits give angora, goats give milk, alpacas give wool',
  'Happy animals lay large eggs and large milk, and their products can carry silver, gold and star quality',
  'Products arrive overnight in the collect bin next to the coop',
  'Rabbits at 6 hearts sometimes leave a lucky rabbit foot gift behind',
  'Fertile eggs can be set in the coop incubator and hatch into a new chick after three days',
  'Neglected or unhappy animals can fall sick: tonics from the vet shop or the catalogue cure them',
  'Farm vet visit service at Dr. Mori\'s clinic heals every sick animal at once',
  'Bigger coop and bigger barn upgrades from the catalogue add room for more animals',
  'Artisan machines can be placed anywhere sensible in the front or back yard, and picked up again when empty',
  'Preserves jar: turns any fruit into jam and any vegetable into pickles over a few days (every crop has its own jar)',
  'Dehydrator: dries tomatoes, strawberries, yuzu and melons overnight',
  'Mayonnaise machine: normal, gold and duck mayo from different eggs',
  'Cheese press: goat milk becomes goat cheese or gold-label cheese',
  'Loom: alpaca and angora wool woven into cloth',
  'Tea fermenter: sencha, mint, chrysanthemum, yuzu and camellia teas',
  'Mill: rice flour, cornmeal and sweet potato starch',
  'Compost bin: three scraps of vegetables or hay become two bags of fertiliser',
  'Bee boxes pick honey from the flowers growing within six tiles, rest in winter and bad weather, and make double honey in summer',
  'Machines animate while working (steam, bees, spinning sails) and show the finished item in a bubble when ready',
  'Machine registry: each machine lists its inputs, outputs and days; items you load keep their star quality',
  'Artisan goods sell for far more than raw produce and earn a 15 percent artisan bonus when shipped',
  'Crafting level 5 gives a chance of a bumper double batch from any machine',
  'Workbench recipes for every machine, sprinkler, scarecrow, hay bales, treats and fertilisers',
  'Sprinklers in three tiers (4 tiles, 8 tiles, 24 tiles) water the garden every morning',
  'Scarecrows and deluxe scarecrows keep crows from crops within seven and thirteen tiles',
  'Daily crow event: some mornings crows hop in the garden, shoo them before noon or they eat crops',
  'Crop quality stars: harvests can come out silver, gold or star grade, more often with higher gardening levels',
  'Fertiliser tiers: basic compost, quality, speed, moisture and giant fertiliser, spread on growing crops after watering',
  'Speed fertiliser makes a crop grow a day faster; moisture fertiliser keeps soil damp for two days',
  'Giant fertiliser gives pumpkins and tomatoes a big chance to swell into giant crops',
  'Greenhouse in the back yard (flag upg_greenhouse, or buy the kit): garden plots that survive season changes',
  'Plant off-season seeds in the greenhouse and watch them grow all year',
  'Withered crops at a season change are listed in the next morning\'s farm report',
  'Daily farm report at breakfast: ripe crops, thirsty plots, products in the bin, machines ready, sick animals and crows',
  'Farm phone app with five tabs: pets, machines, crops, shipping log and the news from this morning',
  'Shipping log keeps every item you have ever shipped with totals and bonus coins',
  'Starred goods earn a quality bonus (silver +25%, gold +50%, star +100%) when shipped or sold in shops',
  'Items with quality stay starred through preserves jars, cheese presses and the rest of the machines',
  'Bag-space friendly: animal goods and machines are ordinary items you can gift, cook with or sell',
  'Mill and fermenter outputs can be used by the stove recipes through their ingredient tags',
  'Heart emotes, sounds and happy toasts as animals bond with you',
  'Everything saves: animals, hearts, machines in progress, the trough, bin, shipping log and the greenhouse',
]);
