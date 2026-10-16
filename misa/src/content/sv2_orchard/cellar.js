// The cellar under Misa's house: a 16x10 stone room reached by a hatch in the sunroom floor. 14 aging casks (6 at tier 1,
// 10 at tier 2, 14 at tier 3) turn wine, cheese, pickles, jam, mead and roe into silver, gold and star goods over 14/28/56 days.
// Tier 3 adds climate control: casks age 25% faster.
import { register, get } from '../../core/registry.js';
import { addStar, takeStar, nm, STAR } from '../sv_farm/core.js';
import { SV2 } from './data.js';
import { wrapMap, bubble } from './orchard.js';

export const AGE_AT = [0, 14, 28, 56];
export const SLOTS = [[2, 2, 1], [4, 2, 1], [6, 2, 1], [9, 2, 1], [11, 2, 1], [13, 2, 1], [1, 4, 2], [1, 6, 2], [14, 4, 2], [14, 6, 2], [3, 7, 3], [5, 7, 3], [10, 7, 3], [12, 7, 3]];
export const UPGRADE = { 2: { coins: 2500, wood: 10 }, 3: { coins: 6000, wood: 25 } };
export const caskable = (id) => /^art_(wine_|pickles_|jam_|roe_|cheese|mead)/.test(id) && !!get('item', id);
export const tierOf = (age) => (age >= 56 ? 3 : age >= 28 ? 2 : age >= 14 ? 1 : 0);
export const rateOf = (g) => (SV2(g).cellar >= 3 ? 1.25 : 1);
export const slotsOpen = (g) => SLOTS.filter((s) => s[2] <= SV2(g).cellar).length;
export function nextTierDays(g, c) {
  if (c.q >= 3) return 0;
  return Math.max(1, Math.ceil((AGE_AT[c.q + 1] - c.age) / rateOf(g)));
}
export function loadCask(g, i, id) {
  const S = SV2(g); if (S.casks[i] || !g.has(id) || !caskable(id) || SLOTS[i][2] > S.cellar) return false;
  const q = takeStar(g, id); g.take(id, 1);
  S.casks[i] = { item: id, q, age: AGE_AT[q] }; g.stat('svCaskLoaded'); g.bus.emit('caskLoaded', { item: id });
  return true;
}
export function takeCask(g, i) {
  const S = SV2(g), c = S.casks[i]; if (!c) return null;
  g.give(c.item, 1); if (c.q) addStar(g, c.item, c.q, 1);
  S.casks[i] = null;
  g.addXP('crafting', 2 + c.q * 2); g.stat('svCaskDone'); if (c.q === 3) g.stat('svCaskStar'); g.collect && g.collect('artisan', c.item);
  g.bus.emit('caskCollected', { item: c.item, q: c.q });
  return c;
}
export function caskTick(g) {
  const S = SV2(g); let up = 0;
  for (const c of S.casks) if (c) { c.age += rateOf(g); const q = tierOf(c.age); if (q > c.q) { c.q = q; up++; } }
  return up;
}
export function upgradeCellar(g) {
  const S = SV2(g), nxt = S.cellar + 1, u = UPGRADE[nxt];
  if (!u) { g.toast('The cellar is as big as it gets'); return false; }
  if (!g.has('mat_hardwood', u.wood)) { g.toast(`Needs ${u.wood} hardwood`); return false; }
  if (!g.spend(u.coins)) { g.toast('Not enough coins'); return false; }
  g.take('mat_hardwood', u.wood); S.cellar = nxt; g.setFlag(`sv2_cellar${nxt}`, true);
  g.sfx('chime'); g.stat('svCellarUp'); g.bus.emit('cellarUpgraded', { tier: nxt });
  g.toast(nxt === 2 ? 'Cellar tier 2: four more casks' : 'Cellar tier 3: more casks and climate control', 'i_star');
  return true;
}
const menu = (g, prompt, opts) => g.run([{ t: 'choice', prompt, options: [...opts.map(([text, fn]) => ({ text, steps: [{ t: 'call', fn: (gg) => fn(gg) }] })), { text: 'Leave it', steps: [] }] }]);
function doTake(g, i) {
  const c = takeCask(g, i); if (!c) return;
  g.sfx('chime'); g.toast(`${c.q ? STAR[c.q] + ' ' : ''}${nm(c.item).toLowerCase()} from the cask`, get('item', c.item).icon);
}
function caskUse(g, i) {
  const S = SV2(g), c = S.casks[i];
  if (!c) {
    const cands = Object.keys(g.state.inv).filter(caskable).sort((a, b) => (get('item', b).price || 0) - (get('item', a).price || 0)).slice(0, 5);
    if (!cands.length) return g.run([{ t: 'say', who: 'misa', mood: 'neutral', text: 'The cask takes wine, cheese, pickles, jam, mead or roe. Time makes them better.' }]);
    return menu(g, 'Fill the cask with...', cands.map((id) => [`${nm(id)} x${g.count(id)}`, (gg) => { if (loadCask(gg, i, id)) { gg.sfx('pour'); gg.toast(`${nm(id)} is ageing. Check back in ${nextTierDays(gg, S.casks[i])} days.`, get('item', id).icon); } }]));
  }
  if (c.q >= 3) return doTake(g, i);
  return menu(g, `${nm(c.item)} (${c.q ? STAR[c.q] : 'fresh'})`, [
    ['How is it ageing?', (gg) => gg.toast(`${Math.floor(c.age)} days old. ${STAR[c.q + 1]} in ${nextTierDays(gg, c)} days.`, 'i_leaf')],
    [`Take it out${c.q ? ` (${STAR[c.q].toLowerCase()})` : ' now'}`, (gg) => doTake(gg, i)],
  ]);
}
export const caskSprite = (g, i) => { const c = SV2(g).casks[i]; return c ? `sv2_cask_${c.q}` : 'sv2_cask_e'; };
function ledgerUse(g) {
  const S = SV2(g), filled = S.casks.filter(Boolean).length, ready = S.casks.filter((c) => c && c.q >= 1).length, nxt = UPGRADE[S.cellar + 1];
  const opts = [[`Read the ledger`, (gg) => gg.toast(`Tier ${S.cellar}: ${filled}/${slotsOpen(gg)} casks full, ${ready} aged. ${S.cellar >= 3 ? 'Climate control on.' : ''}`, 'i_leaf')]];
  if (ready) opts.push([`Collect all aged (${ready})`, (gg) => { S.casks.forEach((c, i) => { if (c && c.q >= 1) doTake(gg, i); }); }]);
  if (nxt) opts.push([`Upgrade: ${nxt.coins}c + ${nxt.wood} hardwood`, (gg) => upgradeCellar(gg)]);
  menu(g, 'Cellar ledger', opts);
}

// ---------------------------------------------------------------- the map
register('tile', 'sv2_cwall', { wall: 'stone', solid: true });
register('tile', 'sv2_cfloor', { floor: 'stone', tint: 'charcoal' });
const rows = Array.from({ length: 10 }, (_, y) => (y < 2 ? '#'.repeat(16) : y === 9 ? '########d#######' : '#' + '.'.repeat(14) + '#'));
const cask = (s, i) => ({
  spr: 'sv2_cask_e', x: s[0], y: s[1], shadow: 14, dx: -1, when: (gm) => SV2(gm) && SV2(gm).cellar >= s[2], sprFn: (gm) => caskSprite(gm, i),
  interact: { label: (gm) => { const c = SV2(gm).casks[i]; return c ? `${nm(c.item)}${c.q ? ' (' + STAR[c.q].toLowerCase() + ')' : ''}` : 'Empty cask'; }, run: (gm) => caskUse(gm, i) },
  overlay: (gm, world, o, x, y) => { const c = SV2(gm).casks[i]; if (c && c.q >= 1) bubble(world, x + 9, y + 4, get('item', c.item).icon, c.q); },
});
register('map', 'cellar', {
  name: 'Cellar', indoor: true, interiors: true, music: 'home', bg: '#120e18', dark: true,
  legend: { '#': 'sv2_cwall', '.': 'sv2_cfloor', d: 'int_fl_door' },
  rows,
  objects: [
    { spr: 'sv2_ledger', x: 7, y: 2, w: 2, shadow: 0, dx: 1, interact: { label: 'Cellar ledger', run: (gm) => ledgerUse(gm) } },
    ...SLOTS.map(cask),
    { spr: 'sv2_shelf', x: 1, y: 8, w: 2, shadow: 0 }, { spr: 'sv2_shelf', x: 13, y: 8, w: 2, shadow: 0 },
    { spr: 'sv2_crate', x: 1, y: 2, shadow: 12 }, { spr: 'sv2_crate', x: 14, y: 2, shadow: 12 }, { spr: 'sv2_crate', x: 5, y: 8, shadow: 12 }, { spr: 'sv2_crate', x: 10, y: 8, shadow: 12 },
  ],
  lights: [{ x: 3, y: 3, kind: 'lamp' }, { x: 12, y: 3, kind: 'lamp' }, { x: 8, y: 7, kind: 'lamp' }, { x: 7, y: 2, kind: 'candle' }],
  warps: [{ x: 8, y: 9, enter: 'down', to: 'home:from_cellar' }],
  spawns: { default: [8, 8, 'up'], from_home: [8, 8, 'up'] },
  spots: { ledger: [8, 3, 'up'], stairs: [8, 8] },
  onEnter(game) {
    if (!game.flag('sv2_cellar_seen')) { game.setFlag('sv2_cellar_seen', true); game.run([{ t: 'say', who: 'misa', mood: 'happy', text: 'A cellar under the house! Cool, quiet and smells of oak. Perfect for ageing things.' }]); }
  },
});

// ---------------------------------------------------------------- the hatch in the sunroom floor (home map, wrapped at runtime)
wrapMap('home', 'objects', (list) => [...list, { spr: 'sv2_hatch', x: 20, y: 13, solid: false, flat: true, dx: 1 }]);
wrapMap('home', 'warps', (list) => [...list, { x: 20, y: 13, enter: 'down', to: 'cellar:from_home' }]);
const home = get('map', 'home');
if (home && home.spawns) home.spawns.from_cellar = [20, 12, 'up'];
