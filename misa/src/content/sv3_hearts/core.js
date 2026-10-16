// Relationship Depth (sv3_hearts): shared state, script helpers and the Best Friend perk engine.
// Save data: state.sv3h = { perk:{npc:'A'|'B'}, seen:{eventId:day}, picks:{eventId:[text]}, letterQ:[], letters:{}, circle:0,
//   group:{plans:[],done:{}}, chats:{pair:n}, chatDay:{}, drama:{active,done:{},next}, gift:{} }
// Heart events added here: sv3_<id>_h5 (conditional/seasonal) and sv3_<id>_h10 (Best Friend capstone), pushed onto the registered npc defs.
// Flags written by the scenes: soc3_<id>_<choice>.  Bus events emitted: sv3Perk { npc, variant }, sv3Circle.
import { register, get, features } from '../../core/registry.js';
import { sc, ch, flag, giveOr } from '../social/util.js';
import { moveBody } from '../../world/map.js';
import { TILE } from '../../world/map.js';
import { addLuck } from '../sv_life/state.js';
import { UPGRADES } from '../sv_explore/tools.js';
import { FishGame } from '../../minigames/hobbies/games.js';

const DEF = () => ({ perk: {}, seen: {}, picks: {}, letterQ: [], letters: {}, circle: 0, group: { plans: [], done: {} }, chats: {}, chatDay: {}, drama: { active: null, done: {}, next: 0 }, gift: {} });
register('stateSlice', 'sv3h', { default: DEF });
export const S = (g) => { const s = (g.state.sv3h ||= DEF()); for (const [k, v] of Object.entries(DEF())) if (s[k] === undefined) s[k] = v; return s; };
export const nameOf = (id) => (get('npc', id) || { name: id }).name;
export const CAST = ['kai', 'suzu', 'rina', 'theo', 'hina', 'fujita', 'ogawa', 'hana', 'tobias', 'mika', 'sachiko', 'jun', 'kiko', 'pip', 'goro'];
export const npcPresent = (g, id) => !!(g.world && g.world.npcs && g.world.npcs[id] && g.world.npcs[id].present);

// ---------- script helpers ----------
// A recorded choice: remembers the picked option text under the event id (for the Heart Archive).
export const rec = (eid, text) => ({ t: 'call', fn: (g) => { const p = (S(g).picks[eid] ||= []); if (!p.includes(text)) p.push(text); } });
export function ch3(eid, prompt, ...opts) {
  return ch(prompt, ...opts.map(([text, ...rest]) => {
    const w = rest[0] && typeof rest[0] === 'object' && 'when' in rest[0] && !rest[0].t ? [rest.shift()] : [];
    return [text, ...w, rec(eid, text), ...rest];
  }));
}
export const setPerk = (id, variant) => ({ t: 'call', fn: (g) => {
  S(g).perk[id] = variant; g.stat('bestFriendPerks'); g.bus.emit('sv3Perk', { npc: id, variant });
  g.toast(`Best Friend bond: ${nameOf(id)}`, 'heart'); syncPerks(g);
} });
export const PERK_CHOICE = (id, variant) => [flag(`soc3_${id}_perk${variant}`), setPerk(id, variant)];

export function addEvents(id, events) {
  const d = get('npc', id);
  if (!d) return;
  d.events = d.events || [];
  for (const e of events) if (!d.events.some((x) => x.id === e.id)) d.events.push(e);
}

// ---------- Best Friend perks ----------
// kinds: speed (extra run speed), energy (cost multiplier), xp {skills, m}, sell {cats|tags, m}, rebate {shops|'*', pct},
//        tool (upgrade price multiplier), luck (daily luck), dup {evs, ch}, bite (fish bite wait multiplier), weekly (coins on Fridays/Mondays)
export const PERKS = {
  kai:     { A: { name: 'Sprint', text: 'Kai\'s running tricks: you run 25% faster.', fx: { speed: 0.25 } }, B: { name: 'Second Wind', text: 'Kai\'s warm-up routine: effort costs 10% less energy.', fx: { energy: 0.9 } } },
  suzu:    { A: { name: 'Library Card', text: 'Suzu\'s reading list: study XP +30%, and every book you read gives bonus study XP.', fx: { xp: { skills: ['study'], m: 1.3 }, book: 6 } }, B: { name: 'Story Lessons', text: 'Suzu\'s story craft: charm and crafting XP +20%.', fx: { xp: { skills: ['charm', 'crafting'], m: 1.2 } } } },
  rina:    { A: { name: 'Study Partner', text: 'Rina\'s drills: study XP +35%.', fx: { xp: { skills: ['study'], m: 1.35 } } }, B: { name: 'Poise', text: 'Rina\'s etiquette lessons: charm XP +35%.', fx: { xp: { skills: ['charm'], m: 1.35 } } } },
  theo:    { A: { name: 'Steady Hands', text: 'Theo\'s line work: crafting XP +30%.', fx: { xp: { skills: ['crafting'], m: 1.3 } } }, B: { name: 'Artist\'s Eye', text: 'Theo helps you price art: furniture and toys sell for 15% more.', fx: { sell: { cats: ['decor'], m: 1.15 } } } },
  hina:    { A: { name: 'Bug Whisperer', text: 'Hina\'s eye for tiny things: 15% chance of a bonus find when foraging, shell hunting or bug catching.', fx: { dup: { evs: ['foraged', 'shellFound', 'bugCaught'], ch: 0.15 } } }, B: { name: 'Green Thumb', text: 'Hina\'s garden lore: gardening XP +30%.', fx: { xp: { skills: ['gardening'], m: 1.3 } } } },
  fujita:  { A: { name: 'Night Study', text: 'Ms. Fujita\'s notes: study XP +25%.', fx: { xp: { skills: ['study'], m: 1.25 } } }, B: { name: 'Shooting Stars', text: 'Ms. Fujita\'s star charts: daily luck +5.', fx: { luck: 5 } } },
  ogawa:   { A: { name: 'Training Regime', text: 'Mr. Ogawa\'s drills: effort costs 12% less energy.', fx: { energy: 0.88 } }, B: { name: 'Champion Tomatoes', text: 'Mr. Ogawa\'s trade secrets: crops sell for 8% more and gardening XP +20%.', fx: { sell: { cats: ['crop'], m: 1.08 }, xp: { skills: ['gardening'], m: 1.2 } } } },
  hana:    { A: { name: 'Keeper\'s Blessing', text: 'Grandma\'s blessing on the farm: 15% chance of an extra crop at harvest.', fx: { dup: { evs: ['harvested'], ch: 0.15 } } }, B: { name: 'Lantern Light', text: 'Grandma\'s lantern light: daily luck +6.', fx: { luck: 6 } } },
  tobias:  { A: { name: 'Apprentice Rates', text: 'Tobias charges 25% less to upgrade your tools.', fx: { tool: 0.75 } }, B: { name: 'Fine Work', text: 'Tobias\'s bench lessons: crafting XP +30%.', fx: { xp: { skills: ['crafting'], m: 1.3 } } } },
  mika:    { A: { name: 'Staff Discount', text: 'Mika\'s staff discount: 25% back on everything you buy at Cafe Kumo.', fx: { rebate: { shops: ['cafe'], pct: 0.25 } } }, B: { name: 'Kitchen Secrets', text: 'Mika\'s kitchen secrets: cooking XP +30%.', fx: { xp: { skills: ['cooking'], m: 1.3 } } } },
  sachiko: { A: { name: 'Family Prices', text: 'Sachiko pays 5% more for everything you sell.', fx: { sell: { all: true, m: 1.05 } } }, B: { name: 'Coupon Queen', text: 'Sachiko\'s coupons: 10% back on everything you buy at Sunny Mart.', fx: { rebate: { shops: ['mart'], pct: 0.1 } } } },
  jun:     { A: { name: 'Better Bite', text: 'Captain Jun\'s tricks: fish bite about 30% sooner.', fx: { bite: 0.7 } }, B: { name: 'Harbour Prices', text: 'Captain Jun knows every buyer: fish sell for 10% more.', fx: { sell: { cats: ['fish'], m: 1.1 } } } },
  kiko:    { A: { name: 'Lucky Charm', text: 'Kiko\'s blessing: daily luck +8.', fx: { luck: 8 } }, B: { name: 'Player Two', text: 'Kiko\'s calm: daily luck +4 and effort costs 6% less energy.', fx: { luck: 4, energy: 0.94 } } },
  pip:     { A: { name: 'Special Delivery', text: 'Pip\'s overtime tips: 80 coins in the post every Friday.', fx: { weekly: 80 } }, B: { name: 'Fast Lane', text: 'Pip\'s shortcuts: you run 12% faster.', fx: { speed: 0.12 } } },
  goro:    { A: { name: 'Compost Secret', text: 'Goro\'s compost secret: 15% chance of an extra crop at harvest.', fx: { dup: { evs: ['harvested'], ch: 0.15 } } }, B: { name: 'Market Wisdom', text: 'Goro\'s market wisdom: crops sell for 10% more.', fx: { sell: { cats: ['crop'], m: 1.1 } } } },
};
export const perkOf = (g, id) => { const v = S(g).perk[id]; return v && PERKS[id] && PERKS[id][v] ? { id, variant: v, ...PERKS[id][v] } : null; };
export const activePerks = (g) => CAST.map((id) => perkOf(g, id)).filter(Boolean);
export const bestFriends = (g) => CAST.filter((id) => S(g).perk[id]);
const fxs = (g) => activePerks(g).map((p) => p.fx);
const sellMatch = (s, it) => s.all || (s.cats && s.cats.includes(it.cat)) || (s.tags && (it.tags || []).some((t) => s.tags.includes(t)));

const BASE_UP = new Map();
function syncPerks(g) {
  try {
    const m = fxs(g).reduce((a, f) => (f.tool ? Math.min(a, f.tool) : a), 1);
    for (const u of UPGRADES) { if (!BASE_UP.has(u)) BASE_UP.set(u, u.coins); u.coins = Math.round(BASE_UP.get(u) * m); }
  } catch (e) { /* tools module unavailable */ }
}
export function resetUpgradePrices() { for (const [u, c] of BASE_UP) u.coins = c; }

register('system', 'sv3Perks', {
  init(game) {
    const sellMult = game.sellMult;
    game.sellMult = (it) => { let m = sellMult ? sellMult(it) : 1; try { for (const f of fxs(game)) if (f.sell && sellMatch(f.sell, it)) m *= f.sell.m; } catch (e) { /* guard */ } return m; };
    const addXP = game.addXP.bind(game);
    game.addXP = (id, n) => {
      let k = 1;
      try { for (const f of fxs(game)) if (f.xp && f.xp.skills.includes(id)) k *= f.xp.m; } catch (e) { /* guard */ }
      return addXP(id, k === 1 ? n : Math.max(1, Math.round(n * k)));
    };
    const useEnergy = game.useEnergy.bind(game);
    game.useEnergy = (n) => {
      let k = 1;
      try { for (const f of fxs(game)) if (f.energy) k *= f.energy; } catch (e) { /* guard */ }
      return useEnergy(k === 1 || n <= 1 ? n : Math.max(1, Math.round(n * k)));
    };
    game.sv3Perk = (id) => perkOf(game, id);
    game.bus.on('shopBuy', (e) => {
      if (!e || !e.cost) return;
      let back = 0;
      for (const f of fxs(game)) if (f.rebate && (f.rebate.shops === '*' || f.rebate.shops.includes(e.shop))) back += f.rebate.pct;
      if (back > 0) { const n = Math.round(e.cost * back); if (n > 0) { game.addMoney(n, true); game.toast(`Bond discount: ${n} coins back`, 'coin'); } }
    });
    for (const ev of ['harvested', 'foraged', 'shellFound', 'bugCaught', 'mined', 'fishCaught']) {
      game.bus.on(ev, (e) => {
        if (!e || !e.item || !get('item', e.item)) return;
        for (const f of fxs(game)) if (f.dup && f.dup.evs.includes(ev) && game.rng() < f.dup.ch) { game.give(e.item, 1, true); game.toast(`Bond bonus: an extra ${get('item', e.item).name.toLowerCase()}!`, get('item', e.item).icon); break; }
      });
    }
    game.bus.on('itemUsed', (e) => {
      const it = e && get('item', e.item);
      if (!it || it.cat !== 'book') return;
      for (const f of fxs(game)) if (f.book) game.addXP('study', f.book);
    });
    game.bus.on('dayStart', () => {
      syncPerks(game);
      for (const f of fxs(game)) if (f.luck) addLuck(game, f.luck);
      if (game.weekday === 4) for (const f of fxs(game)) if (f.weekly) { game.addMoney(f.weekly, true); game.mail(`sv3_tips_${game.day}`, 'Pip', `Overtime tips from the route: ${f.weekly} coins. Don't spend it all on stamps!`); }
    });
    for (const ev of ['gameStart', 'gameLoaded', 'newGame']) game.bus.on(ev, () => { resetUpgradePrices(); syncPerks(game); });
  },
});

// Faster running (Kai, Pip): extra distance on top of the engine's own speed.
register('worldTick', 'sv3_speed', {
  update(dt, world, game) {
    const p = world.player;
    if (!p || !p.run || !p.moving || p.path || world.busy || game.scenes.top !== world) return;
    let k = 0;
    for (const f of fxs(game)) if (f.speed) k += f.speed;
    if (!k) return;
    const sp = 86 * (game.state.flags.speedBoost ? 1.15 : 1) * dt * k, dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0, dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    try { moveBody(world.map, p, dx * sp, dy * sp, world.rects); } catch (e) { /* guard */ }
  },
});

// Jun's better bite: shorten the first wait of a fishing cast.
if (FishGame && FishGame.prototype && FishGame.prototype.update && !FishGame.prototype.__sv3) {
  const upd = FishGame.prototype.update;
  FishGame.prototype.update = function (dt, input, game) {
    if (!this.__sv3b) {
      this.__sv3b = true;
      try { const k = game && game.state ? fxs(game).reduce((a, f) => (f.bite ? a * f.bite : a), 1) : 1; if (k < 1 && this.wait) this.wait *= k; } catch (e) { /* guard */ }
    }
    return upd.call(this, dt, input, game);
  };
  FishGame.prototype.__sv3 = true;
}

features('Relationships Deep', [
  'Best Friend perks: at 10 hearts every one of the 15 cast members grants a permanent bond bonus, and the choice in their capstone scene decides which of two perks you get',
  'Bond perks reach into running speed, energy use, skill XP, selling prices, shop rebates, tool upgrade prices, daily luck, bonus harvests and finds, and fishing bites',
]);
