// Star Drops: seven rare, permanent upgrades (+12 max energy each, like Stardew's Stardrops), each from a different secret or quest:
//   Hall Light (restore the Community Hall), Deep Star (Hoshi Mine floor 30), Friendship Star (Hana, Mika, Kiko and Goro at 10 hearts),
//   Lantern Star (a four-lantern year-end evaluation), Secret Star (all 30 secret notes), Arcade Star (beat all three rival champions),
//   Cart Star (Mimi's travelling cart sometimes sells a shimmering fruit for 7777 coins).
// Each plays a short starfall cutscene when its condition is met and Misa is free. The "Star Drops" phone app tracks them.
// Console: import('/src/content/sv2_play/drops.js').then(m => m.grant(__misa, 'mine'))
import { register, get, features } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { UI, rect, panel, drawText, drawTextC, wrap } from '../../ui/ui.js';
import { S, say, N, call, idle, has, stickers, giveOr } from './state.js';
import { foundCount } from '../sv_life/secrets.js';
import { goalsMet } from './arcade.js';

export const ENERGY_PER = 12;
const hearts4 = ['hana', 'mika', 'kiko', 'goro'];
const nm = (id) => (get('npc', id) || { name: id }).name;
const bestMine = (g) => Math.max(g.state.stats.mineDepth | 0, (g.state.sv_explore && g.state.sv_explore.mine && g.state.sv_explore.mine.best) | 0);
const evalLanterns = (g) => Math.max(0, ...Object.values((g.state.svlife && g.state.svlife.evals) || {}).map((e) => e.lanterns | 0));
const hallDone = (g) => !!g.flag('community_restored') || !!(g.state.community && g.state.community.restored);

export const DROPS = [
  { id: 'hall', name: 'Hall Light', hint: 'A place that was dark learns to shine again.', cond: hallDone, prog: (g) => (hallDone(g) ? 'Hall restored' : 'Restore the Community Hall'),
    steps: () => [say(null, null, 'The restored Hall hums. A tiny light lifts off the old bulletin board and drifts toward Misa.'), say('misa', 'surprised', 'It is... warm? It is shaped like a star!')] },
  { id: 'mine', name: 'Deep Star', hint: 'The mine hides a gift where the ladders run out of excuses.', cond: (g) => bestMine(g) >= 30, prog: (g) => `Mine floor ${Math.min(30, bestMine(g))}/30`,
    steps: () => [say(null, null, 'Deep in the rock, a vein of quartz parts like a curtain. A star-shaped glow rests in a little hollow.'), say('misa', 'happy', 'The mine was saving this for someone stubborn enough to keep digging.')] },
  { id: 'hearts', name: 'Friendship Star', hint: 'Four old friends can agree on one thing.', cond: (g) => hearts4.every((n) => g.hearts(n) >= 10), prog: (g) => hearts4.map((n) => `${nm(n).split(' ')[0]} ${g.hearts(n)}/10`).join('  '),
    steps: () => [say('hana', 'happy', 'Misa, dear, Mika, Kiko and Goro came by this morning. We all had the same idea.'), say('hana', 'happy', 'It is not much. A seed from a star that fell on the bay when your grandfather was young. Plant it in yourself.'), say('misa', 'happy', 'Thank you. All of you. Truly.')] },
  { id: 'lantern', name: 'Lantern Star', hint: 'Grandma Hana counts lanterns at the end of the year.', cond: (g) => evalLanterns(g) >= 4, prog: (g) => `Best evaluation: ${evalLanterns(g)}/4 lanterns`,
    steps: () => [say(null, null, 'After the fourth lantern lights, a spark floats from the last wick and settles on Misa\'s hand.'), say('misa', 'surprised', 'It did not burn. It feels like a heartbeat.')] },
  { id: 'notes', name: 'Secret Star', hint: 'Thirty secrets, one reward the bay forgot it hid.', cond: (g) => foundCount(g) >= 30, prog: (g) => `Secret notes ${Math.min(30, foundCount(g))}/30`,
    steps: () => [say(null, null, 'Turning the last note over, Misa finds a tiny pressed star glued to the back with a drop of wax.'), say('misa', 'happy', 'A note for the detective who read all the others. I love this town.')] },
  { id: 'arcade', name: 'Arcade Star', hint: 'A champion\'s star appears when every cabinet has a new king.', cond: (g) => goalsMet(g) >= 3, prog: (g) => `Rival scores beaten ${goalsMet(g)}/3`,
    steps: () => [say(null, null, 'All three cabinets flash HIGH SCORE at once. Their screens spill coloured pixels that gather into a star.'), say('misa', 'surprised', 'Okay, THAT was not in the manual!')] },
  { id: 'cart', name: 'Cart Star', hint: 'A wandering merchant sometimes carries one shimmering fruit.', cond: (g) => !!S(g).drops.cartBought, prog: (g) => (S(g).drops.cartBought ? 'Eaten' : 'Check the travelling cart, Fri and Sun'),
    steps: () => [say(null, null, 'The fruit tastes like starlight and warm tea. A silver glow slips down to Misa\'s toes.'), say('misa', 'surprised', 'Mimi said it was worth every coin. I think she meant it.')] },
];
export const byId = (id) => DROPS.find((d) => d.id === id);
export const gotCount = (g) => Object.keys(S(g).drops.got).length;
const safe = (f, g) => { try { return !!f(g); } catch { return false; } };

export function apply(g, id) {
  const d = S(g).drops;
  if (d.got[id]) return false;
  d.got[id] = g.day; d.pending = d.pending.filter((x) => x !== id);
  g.state.maxEnergy += ENERGY_PER; g.addEnergy(ENERGY_PER); g.stat('starDrops'); g.sfx('levelup');
  g.toast(`Star Drop: ${byId(id).name}! Max energy +${ENERGY_PER}`, 'i_star'); g.bus.emit('sv2DropFound', { id });
  return true;
}
export function dropSteps(g, id) {
  const d = byId(id);
  return [{ t: 'scene', name: 'sv2_starfall' }, { t: 'sfx', name: 'star' }, N(`A STAR DROP: ${d.name.toUpperCase()}`), ...d.steps(g),
    call((gg) => { apply(gg, id); }), N(`Misa feels a bright new reserve of energy. Maximum energy +${ENERGY_PER}! (${gotCount(g) + 1}/7)`),
    call((gg) => { if (gotCount(gg) >= 7 && !gg.flag('sv2_all_drops')) { gg.setFlag('sv2_all_drops'); return gg.run([say('misa', 'surprised', 'That is seven. Seven little stars, all mine.'), N('Title earned: Star Collector.'), call((g3) => { (g3.state.titles ||= []).includes('Star Collector') || g3.state.titles.push('Star Collector'); stickers(g3, 5, 'all Star Drops'); giveOr(g3, 'furn_star_tree', 400); })]); } })];
}
export function grant(g, id) { return g.run(dropSteps(g, id)); }

let running = false;
export function scan(g) {
  const d = S(g).drops;
  for (const x of DROPS) if (!d.got[x.id] && !d.pending.includes(x.id) && safe(x.cond, g)) d.pending.push(x.id);
}
register('worldTick', 'sv2_drops', {
  update(dt, world, game) {
    const d = S(game).drops;
    if (!d.pending.length || running || !idle(game)) return;
    running = true;
    Promise.resolve(grant(game, d.pending[0])).finally(() => { running = false; });
  },
});
register('system', 'sv2_drops', {
  init(game) {
    const go = () => scan(game);
    for (const ev of ['dayStart', 'mapEnter', 'mineFloor', 'svNoteFound', 'svEvaluation', 'sv2ArcadePlayed', 'heartUp', 'sv2FruitEaten', 'gameLoaded', 'questDone', 'achievement']) game.bus.on(ev, go);
  },
});
register('backdrop', 'sv2_starfall', { draw(g, game, t) {
  g.fillStyle = '#120e2c'; g.fillRect(0, 0, 320, 224);
  for (let i = 0; i < 70; i++) { const x = (i * 97) % 320, y = (i * 53 + t * (6 + i % 7) * 4) % 224, on = Math.floor(t * 3 + i) % 4; g.fillStyle = on ? '#6a5fa0' : '#c8b8ff'; g.fillRect(x, y, on ? 1 : 2, on ? 1 : 2); }
  const y = Math.min(112, 20 + t * 70), x = 160 + Math.sin(t * 2) * 8;
  for (let k = 6; k > 0; k--) { g.fillStyle = `rgba(255,236,150,${0.1 * (7 - k)})`; g.fillRect(x - k * 2, y - k * 10, k * 4, k * 10); }
  g.fillStyle = '#fff6c0'; g.fillRect(x - 5, y - 1, 10, 3); g.fillRect(x - 1, y - 5, 3, 11); g.fillRect(x - 3, y - 3, 7, 7);
  g.fillStyle = '#0a0820'; g.fillRect(0, 168, 320, 56);
} });

// ---------------------------------------------------------------- the cart: Mimi sometimes carries a shimmering fruit
const cart = get('shop', 'sv_cart');
if (cart) {
  const base = cart.stockFn;
  cart.stockFn = (g) => {
    const out = base ? base(g) || [] : [];
    if (!S(g).drops.got.cart && !S(g).drops.cartBought && g.rngFor('sv2_cart_fruit')() < 0.45 && has('sv2_star_fruit')) out.push({ item: 'sv2_star_fruit', price: 7777, limit: 1 });
    return out;
  };
}

// ---------------------------------------------------------------- phone app
register('phoneApp', 'sv2_drops', {
  name: 'Star Drops', icon: 'i_star', order: 66,
  badge: (g) => S(g).drops.pending.length || 0,
  open(game, app) { app.state.sel ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(DROPS.length - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.justDown) { const i = Math.floor((input.my - app.area.y - 14) / 15); if (i >= 0 && i < DROPS.length && input.mx < app.area.x + app.area.w) st.sel = i; }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, got = S(game).drops.got;
    drawText(g, `STAR DROPS ${gotCount(game)}/7   MAX ENERGY ${game.state.maxEnergy}`, x + 2, y + 2, UI.accent2, 1, null);
    DROPS.forEach((d, i) => {
      const yy = y + 14 + i * 15, on = i === st.sel, f = !!got[d.id];
      if (on) rect(g, UI.gold, x, yy - 1, w, 14);
      // a little star: bright when found, hollow when not
      rect(g, f ? K.butter[3] : K.charcoal[2], x + 4, yy + 3, 7, 3); rect(g, f ? K.butter[3] : K.charcoal[2], x + 6, yy + 1, 3, 7);
      drawText(g, f ? d.name.toUpperCase() : '??????', x + 16, yy + 2, f ? UI.ink : UI.dim, 1, null);
      drawText(g, f ? 'FOUND' : S(game).drops.pending.includes(d.id) ? 'READY' : '', x + w - 40, yy + 2, f ? UI.good : UI.accent, 1, null);
    });
    const d = DROPS[st.sel];
    panel(g, x, y + 14 + DROPS.length * 15 + 2, w, h - (14 + DROPS.length * 15 + 2), 'paper');
    const ty = y + 14 + DROPS.length * 15 + 8;
    wrap(got[d.id] ? d.prog(game) : d.hint, 44).slice(0, 2).forEach((l, i) => drawText(g, l, x + 6, ty + i * 9, UI.ink, 1, null));
    if (!got[d.id]) drawText(g, d.prog(game).slice(0, 44), x + 6, ty + 20, UI.accent2, 1, null);
    void drawTextC;
  },
});

features('Arcade & Travel', [
  'Seven rare Star Drops, each a permanent +12 maximum energy, found through seven different secrets and quests',
  'Hall Light: restore the Community Hall; Deep Star: reach Hoshi Mine floor 30',
  'Friendship Star: Hana, Mika, Kiko and Goro all at 10 hearts; Lantern Star: a four-lantern year-end evaluation',
  'Secret Star: find all 30 secret notes; Arcade Star: beat the top rival score on all three arcade games',
  'Cart Star: Mimi\'s travelling cart sometimes sells a shimmering fruit for 7777 coins',
  'Each Star Drop plays its own starfall cutscene (a falling-star backdrop and a short scene) when Misa is free to watch',
  'Star Drops phone app: hollow stars for missing drops, hints, live progress counters, and a ready badge',
  'Collecting all seven Star Drops earns the title Star Collector, 5 Star Stickers and a star tree for the room',
]);
