// Field Guide phone app: a bestiary and finds log for the wild places, with fill percentages per area and an overall percentage that
// pays out once at 25 / 50 / 75 / 100%. Uses the engine's collections (forage, fish, mineral) plus game.state.sv2_wild.seen for critters.
import { register, get, features } from '../../core/registry.js';
import { UI, panel, bar, drawText, icon, scrollbar } from '../../ui/ui.js';
import { tap, hit, clamp } from '../ui/kit.js';
import { FORAGE } from '../sv_explore/data.js';
import { W2, WOODS_FORAGE, WOODS_FISH, POTIONS, LORE } from './data.js';
import { REQS } from './witch.js';

const nm = (id) => (get('item', id) || { name: id }).name;
const ic = (id) => (get('item', id) || {}).icon;
const SHARED_WOOD = FORAGE.filter((f) => f[3] === 'wood').map((f) => 'forage_' + f[0]);

// A section is { id, name, list: [{ name, icon, got, hint }] }
export function sections(game) {
  const w = W2(game), seen = w.seen, col = (k, id) => game.collected(k, id) > 0, mine = (game.state.sv_explore && game.state.sv_explore.mine) || { ores: {}, shooed: 0, best: 0 };
  const stat = (k) => game.state.stats[k] || 0;
  const crit = (id, name, icon, hint) => ({ name, icon, got: !!seen['critter_' + id], hint });
  const woods = [
    crit('deer', 'Deer', 'sw_deer', 'Wanders the clearings by day'), crit('tanuki', 'Tanuki', 'sw_tanuki', 'Rainy days and dusk'), crit('owl', 'Owl', 'sw_owl', 'Roosts at night'), crit('firefly', 'Fireflies', ic('forage_star_berry'), 'Summer nights'),
    ...[...WOODS_FORAGE.map((f) => 'forage_' + f[0]), 'forage_ruin_blossom', ...SHARED_WOOD].map((id) => ({ name: nm(id), icon: ic(id), got: col('forage', id), hint: 'Forage in the woods' })),
    ...WOODS_FISH.map((f) => ({ name: nm('fish_' + f[0]), icon: ic('fish_' + f[0]), got: col('fish', 'fish_' + f[0]), hint: 'Fish the hidden pond' })),
    { name: 'Ruin riddle solved', icon: ic('forage_ruin_blossom'), got: !!w.woods.solved, hint: 'Light the four lanterns in order' },
  ];
  const cottage = [
    ...Object.keys(POTIONS).map((id) => ({ name: nm(id), icon: ic(id), got: (w.yui.brewed[id] || 0) > 0, hint: 'Brew at the cauldron' })),
    ...LORE.map(([id]) => ({ name: nm(id), icon: ic(id), got: !!game.flag('econ_read_' + id), hint: "Read a book from Yui's shelf" })),
    ...REQS.map((r) => ({ name: r.name, icon: ic('potion_luck'), got: (w.yui.req[r.id] || 0) === 2, hint: "One of Yui's Requests" })),
  ];
  const ores = ['ore_coal', 'ore_copper', 'ore_iron', 'ore_silver', 'ore_star_gold'].map((id) => ({ name: nm(id), icon: ic(id), got: !!(mine.ores && mine.ores[id]), hint: 'Mine rocks in Hoshi Mine' }));
  const gems = ['min_topaz', 'min_aquamarine', 'min_ruby', 'min_emerald', 'min_diamond', 'min_star_shard', 'min_quartz', 'min_amethyst', 'min_moonstone'].filter((id) => get('item', id)).map((id) => ({ name: nm(id), icon: ic(id), got: col('mineral', id), hint: 'Gem nodes and crystals' }));
  const dust = [1, 5, 15, 30].map((n) => ({ name: `Shoo ${n} dust sprite${n > 1 ? 's' : ''}`, icon: 'sv_dust_0', got: stat('dustShooed') >= n, hint: 'Dust sprites in the mine' }));
  const deep = [10, 20, 30].map((n) => ({ name: `Mine floor ${n}`, icon: ic('ore_coal'), got: mine.best >= n, hint: 'Go deeper in the mine' }));
  const fall = [
    { name: nm('ore_starfall'), icon: ic('ore_starfall'), got: !!(mine.ores && mine.ores.ore_starfall), hint: 'Starfall rocks' },
    { name: nm('ore_iridescent_geode'), icon: ic('ore_iridescent_geode'), got: w.guild.cracked > 0 || !!(mine.ores && mine.ores.ore_iridescent_geode), hint: 'Iridescent geode nodes' },
    { name: nm('min_prism_shard'), icon: ic('min_prism_shard'), got: col('mineral', 'min_prism_shard'), hint: 'Crack iridescent geodes' },
    { name: nm('mat_star_fragment'), icon: ic('mat_star_fragment'), got: stat('starFragments') > 0, hint: 'Catch falling stars' },
    ...[10, 25, 50, 100].map((n) => ({ name: `Starfall depth ${n}`, icon: 'sw_star_node', got: (w.depths.best || 0) >= n, hint: 'Descend' })),
  ];
  return [
    { id: 'woods', name: 'Hoshi Woods', list: woods },
    { id: 'cottage', name: 'Moon Witch', list: cottage },
    { id: 'mine', name: 'Hoshi Mine', list: [...ores, ...gems, ...dust, ...deep] },
    { id: 'fall', name: 'Starfall', list: fall },
  ];
}
export const secPct = (s) => Math.round((s.list.filter((e) => e.got).length / s.list.length) * 100);
export function overall(game) { const all = sections(game).flatMap((s) => s.list); return { n: all.filter((e) => e.got).length, of: all.length, pct: Math.round((all.filter((e) => e.got).length / all.length) * 100) }; }
export const REWARDS = [
  [25, { coins: 500, items: {} }], [50, { coins: 1200, items: { mat_star_fragment: 2 } }], [75, { coins: 2500, items: { potion_luck: 2 } }], [100, { coins: 5000, items: { cloth_ring_luck: 1 }, stickers: 5 }],
];
export function claimField(game) {
  const o = overall(game), got = [];
  for (const [p, r] of REWARDS) {
    if (o.pct < p || W2(game).fg.claimed[p]) continue;
    W2(game).fg.claimed[p] = game.day; game.addMoney(r.coins, true);
    for (const [id, n] of Object.entries(r.items)) game.give(id, n, true);
    if (r.stickers && game.giveStickers) game.giveStickers(r.stickers, 'the Field Guide');
    game.toast(`Field Guide ${p}%: ${r.coins} coins${Object.keys(r.items).length ? ' and a gift' : ''}!`, 'i_trophy'); game.sfx('star'); got.push(p);
    if (p === 100) game.setFlag('sw_fieldguide_full');
  }
  return got;
}

register('phoneApp', 'sw_fieldguide', {
  name: 'Field Guide', icon: 'i_leaf', order: 62,
  when: (game) => !!game.state.sv2_wild && (game.flag('sw_woods_open') || game.flag('sv_mine_intro')),
  badge: (game) => { const o = overall(game); return REWARDS.some(([p]) => o.pct >= p && !W2(game).fg.claimed[p]) ? 1 : 0; },
  open(game, app) { app.state.tab = app.state.tab || 0; app.state.top = 0; claimField(game); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed, secs = sections(game);
    secs.forEach((s, i) => { if (hit(input, x + i * 73, y, 72, 18)) { st.tab = i; st.top = 0; } });
    if (k.has('c') || k.has('arrowright') || k.has('d')) { st.tab = (st.tab + 1) % secs.length; st.top = 0; }
    if (k.has('arrowleft') || k.has('a')) { st.tab = (st.tab + secs.length - 1) % secs.length; st.top = 0; }
    const n = secs[st.tab].list.length;
    if (k.has('arrowdown') || k.has('s')) st.top = clamp(st.top + 1, 0, Math.max(0, n - 9));
    if (k.has('arrowup') || k.has('w')) st.top = clamp(st.top - 1, 0, Math.max(0, n - 9));
    if (input.wheel) st.top = clamp(st.top + Math.sign(input.wheel), 0, Math.max(0, n - 9));
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, secs = sections(game), s = secs[st.tab], o = overall(game);
    secs.forEach((sec, i) => tap(g, game, x + i * 73, y, 72, 18, sec.name, { focused: st.tab === i, style: st.tab === i ? 'mint' : 'paper' }));
    const T = (t, xx, yy, c = UI.ink) => drawText(g, t, xx, yy, c, 1, null);
    T(`${s.name}: ${secPct(s)}% (${s.list.filter((e) => e.got).length}/${s.list.length})`, x + 6, y + 24, UI.accent2);
    bar(g, x + 6, y + 35, 150, 5, secPct(s) / 100, UI.good);
    T(`Whole guide ${o.pct}%`, x + 166, y + 24); bar(g, x + 166, y + 35, 120, 5, o.pct / 100, UI.sky);
    s.list.slice(st.top, st.top + 9).forEach((e, i) => {
      const yy = y + 46 + i * 14;
      if (e.got) { icon(g, e.icon, x + 6, yy - 1); T(e.name.slice(0, 28), x + 26, yy + 2); T('OK', x + 262, yy + 2, UI.good); }
      else { T('?', x + 11, yy + 2, UI.dim); T('?????  ' + (e.hint || '').slice(0, 30), x + 26, yy + 2, UI.dim); }
    });
    scrollbar(g, x + 289, y + 46, 126, st.top, 9, s.list.length);
  },
});

features('Wild Places', [
  'Field Guide phone app: a bestiary and finds log with tabs for Hoshi Woods, the Moon Witch, Hoshi Mine and Starfall',
  'Fill percentages per area and for the whole guide; unfound entries show a hint ("Fish the hidden pond") until discovered',
  'It logs critters seen (deer, tanuki, owls, fireflies), woodland forage, pond fish, brews made, books read, ores, gems, dust sprites shooed and Starfall depth milestones',
  'A badge on the Field Guide icon shows when a completion reward is waiting',
  'The Field Guide pays out at 25, 50, 75 and 100% completion with coins, star fragments, luck draughts and finally a Hoshi Ring and Star Stickers',
]);
