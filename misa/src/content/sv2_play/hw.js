// Help Wanted: three small repeatable bounties pinned on the town board every morning, built around the new verbs:
// ride the bike to a place within N minutes, ride N km, score N at an arcade game, bring a specific item. Taken from the board's
// "Look closer" on a Help Wanted note, tracked in the Play phone app and paid in coins, arcade tickets and the odd Star Sticker.
// Also here: the "Play" phone app (tickets and scores, bike, bounties, pocket tools).
import { register, get, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, wrap, inside } from '../../ui/ui.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { spotPos } from '../../systems/festivals.js';
import { S, say, N, call, has, stickers, toggleLight, cycleWatch, PAINT_NAMES } from './state.js';
import { GAMES, KEYS, best, table } from './arcade.js';
import { B, bikeLevel, bikeName, toggleRide, SKILL_KM, BASKET, speedMult } from './bike.js';
import { hopsBetween, hooks } from './tools.js';

const DEST = [['harbour', 'dock', 'the harbour dock'], ['beach', 'shore', 'the beach shore'], ['shrine', 'torii', 'the shrine gate'], ['park', 'bandstand', 'the park bandstand'], ['school_grounds', 'gate', 'the school gate'], ['shotengai', 'lantern_row', 'Lantern Row'], ['town', 'fountain', 'the town fountain']];
const BRING = ['ing_egg', 'ing_milk', 'ing_flour', 'ing_tea', 'ing_honey', 'ing_bread', 'mat_paper', 'mat_string', 'ing_apple', 'ing_red_bean', 'snack_cookies', 'ing_butter', 'ing_sugar'];
const nm = (id) => (get('item', id) || { name: id }).name;
let GAME = null;
const HW = (g) => S(g).hw;
const pickR = (r, a) => a[Math.floor(r() * a.length)];

function makeBounty(g, slot, r, seq) {
  const b = B(g), W = g.world;
  let type = slot === 0 ? (b.owned ? (r() < 0.65 ? 'ride' : 'km') : 'bring') : slot === 1 ? 'score' : 'bring';
  if (type === 'ride') {
    const here = (W && W.map && W.map.id) || 'town', pool = DEST.filter((d) => d[0] !== here), d = pickR(r, pool), hops = Math.min(6, hopsBetween('town', d[0]) + 1), limit = 22 + hops * 12;
    return { id: seq, type, title: 'Bike run', who: 'Pip', goal: { map: d[0], spot: d[1], label: d[2], limit }, text: `Pip: "A parcel for ${d[2]} and my legs are jelly. Ride there by bike within ${limit} minutes of taking this job!"`, reward: { coins: 140 + hops * 25, tickets: 8 }, state: 'open' };
  }
  if (type === 'km') { const km = pickR(r, [1, 1.5, 2]); return { id: seq, type, title: 'Long ride', who: 'Tomo', goal: { km, base: 0 }, text: `Tomo of Pedal & Pump: "Break in a bike properly. Ride ${km} km (${Math.round(km * 100)} tiles) today and I will pay you for the stories."`, reward: { coins: 120 + km * 60, tickets: 10 }, state: 'open' }; }
  if (type === 'score') {
    const key = pickR(r, KEYS), gm = GAMES[key], tgt = Math.round((gm.goal * (0.35 + r() * 0.35)) / 50) * 50;
    return { id: seq, type, title: 'High score', who: 'Kai', goal: { key, score: tgt }, text: `Kai: "Score ${tgt} on ${gm.name} at the arcade today. I will not be impressed. Okay, I will be a little impressed."`, reward: { coins: 150, tickets: 15 }, state: 'open' };
  }
  const who = pickR(r, ['Mika', 'Sachiko', 'Goro', 'Hana']), pool = BRING.filter(has), it = pickR(r, pool), n = 2 + Math.floor(r() * 3), pr = (get('item', it).price || 30);
  return { id: seq, type: 'bring', title: 'Bring item', who: who, goal: { item: it, n }, text: `${who}: "I am short on ${nm(it).toLowerCase()}. Could you bring me ${n}? I will make it worth your while."`, reward: { coins: Math.round((pr * n * 1.5 + 60) / 5) * 5, tickets: 5, sticker: r() < 0.2 ? 1 : 0 }, state: 'open' };
}
export function refreshBounties(g) {
  const h = HW(g); if (h.day === g.day) return; h.day = g.day;
  const r = g.rngFor('sv2_hw'); h.list = [0, 1, 2].map((s) => makeBounty(g, s, r, h.seq++));
}
export const bountyOf = (g, id) => HW(g).list.find((b) => b.id === id);
export const activeBounties = (g) => HW(g).list.filter((b) => b.state === 'taken');
export const progressText = (g, b) => {
  const q = b.goal;
  if (b.type === 'bring') return `Have ${Math.min(q.n, g.count(q.item))}/${q.n} ${nm(q.item)}`;
  if (b.type === 'km') return `${Math.max(0, B(g).km - q.base).toFixed(1)}/${q.km} km`;
  if (b.type === 'score') return `Best today: ${q.top || 0}/${q.score}`;
  const left = q.limit - (g.minutes - (q.start || 0));
  return b.state === 'taken' ? `${Math.max(0, left)} min left` : `${q.limit} min`;
};
export function accept(g, b) {
  if (b.state !== 'open') return 'Already taken.';
  if (activeBounties(g).length >= 3) return 'Your hands are full of jobs.';
  b.state = 'taken'; g.sfx('select');
  if (b.type === 'ride') { if (!B(g).owned) { b.state = 'open'; return 'This job needs a bicycle.'; } b.goal.start = g.minutes; b.goal.day = g.day; }
  if (b.type === 'km') b.goal.base = B(g).km;
  if (b.type === 'score') b.goal.top = 0;
  g.stat('bountiesTaken'); return 'Job taken!';
}
export function finish(g, b) {
  const R = b.reward; b.state = 'done'; HW(g).done++; g.stat('bountiesDone');
  g.addMoney(R.coins); S(g).tickets += R.tickets; S(g).ticketsTotal += R.tickets; if (R.sticker) stickers(g, R.sticker, 'help wanted');
  g.addXP && g.addXP('charm', 3); g.sfx('chime'); g.toast(`Help wanted done: ${b.title}! +${R.coins}c +${R.tickets} tickets`, 'i_star');
  g.bus.emit('sv2BountyDone', { id: b.id, type: b.type });
}
export function handIn(g, b) {
  const q = b.goal;
  if (b.type !== 'bring' || b.state !== 'taken' || g.count(q.item) < q.n) return false;
  g.take(q.item, q.n); finish(g, b); return true;
}
function check(g) {
  for (const b of activeBounties(g)) {
    const q = b.goal;
    if (b.type === 'km' && B(g).km - q.base >= q.km) finish(g, b);
    if (b.type === 'ride') {
      const w = g.world;
      if (q.day !== g.day || g.minutes - q.start > q.limit) { b.state = 'failed'; g.toast('The bike run took too long. Job expired.'); }
      else if (w && w.map.id === q.map && B(g).riding) finish(g, b);
    }
  }
}
export function noteSteps(g, id) {
  const b = bountyOf(g, id); if (!b) return [];
  const opts = [];
  if (b.state === 'open') opts.push({ text: 'Take the job', steps: [call((gg) => gg.toast(accept(gg, b)))] });
  if (b.state === 'taken' && b.type === 'bring') opts.push({ text: 'Hand in the items', when: (gg) => gg.count(b.goal.item) >= b.goal.n, steps: [call((gg) => { handIn(gg, b); })] });
  opts.push({ text: 'Leave it', steps: [] });
  return [N(b.text), N(`Reward: ${b.reward.coins} coins, ${b.reward.tickets} arcade tickets${b.reward.sticker ? ' and a Star Sticker' : ''}. ${b.state === 'done' ? '(Done!)' : b.state === 'failed' ? '(Expired.)' : progressText(g, b)}`), { t: 'choice', prompt: b.title, options: opts }];
}
for (let i = 0; i < 3; i++) {
  const at = () => (GAME && HW(GAME).list[i]) || null;
  register('boardNote', 'sv2_hw_' + i, {
    get title() { const b = at(); return b ? `Wanted: ${b.title}` : ''; },
    get text() { const b = at(); return b ? `${b.text} [${b.state}] ${GAME ? progressText(GAME, b) : ''}` : ''; },
    color: ['#ffd9a0', '#d6e8ff', '#e0f5d0'][i],
    when: (g) => { GAME = g; refreshBounties(g); const b = HW(g).list[i]; return !!b && b.state !== 'done' && b.state !== 'failed'; },
    run: (g) => g.run(noteSteps(g, (at() || {}).id)),
  });
}
hooks.target = (g) => { const b = activeBounties(g).find((x) => x.type === 'ride'); return b ? { map: b.goal.map, spot: b.goal.spot, label: b.goal.label.toUpperCase() } : null; };
register('system', 'sv2_hw', {
  init(game) {
    GAME = game;
    game.bus.on('dayStart', () => refreshBounties(game));
    game.bus.on('mapEnter', () => { refreshBounties(game); check(game); });
    game.bus.on('sv2BikeRide', () => check(game));
    game.bus.on('sv2ArcadePlayed', (e) => { for (const b of activeBounties(game)) if (b.type === 'score' && b.goal.key === e.key) { b.goal.top = Math.max(b.goal.top || 0, e.points); if (e.points >= b.goal.score) finish(game, b); } });
    game.bus.on('hour', () => check(game));
  },
});

// ---------------------------------------------------------------- the Play phone app
const TABS = ['Scores', 'Bike', 'Jobs', 'Tools'];
const T = (g, s, x, y, c = UI.ink) => drawText(g, s, x, y, c, 1, null);
register('phoneApp', 'sv2_play', {
  name: 'Play', icon: 'i_music', order: 62,
  badge: (g) => activeBounties(g).filter((b) => b.type === 'bring' && g.count(b.goal.item) >= b.goal.n).length || 0,
  open(game, app) { app.state.tab ??= 0; app.state.sel ??= 0; refreshBounties(game); },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y, w } = app.area, n = st.tab === 2 ? 3 : st.tab === 3 ? 3 : st.tab === 0 ? 3 : 1;
    if (k.has('arrowright') || k.has('d')) { st.tab = (st.tab + 1) % TABS.length; st.sel = 0; }
    if (k.has('arrowleft') || k.has('a')) { st.tab = (st.tab + TABS.length - 1) % TABS.length; st.sel = 0; }
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(n - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    if (input.justDown) {
      for (let i = 0; i < TABS.length; i++) if (inside(input.mx, input.my, x + i * (w / 4), y, w / 4, 12)) { st.tab = i; st.sel = 0; }
      const row = Math.floor((input.my - (y + 20)) / 22); if (row >= 0 && row < n && input.my > y + 18) { if (st.sel === row) k.add('e'); st.sel = row; }
    }
    if (k.has('e') || k.has('enter') || k.has(' ')) {
      if (st.tab === 1) toggleRide(game);
      if (st.tab === 2) { const b = HW(game).list[st.sel]; if (b) { if (b.state === 'open') game.toast(accept(game, b)); else if (b.type === 'bring') handIn(game, b); } }
      if (st.tab === 3) { if (st.sel === 0) { if (game.has('sv2_lantern')) toggleLight(game); else game.toast('You need a Pocket lantern (Pedal & Pump).'); } if (st.sel === 1) { if (game.has('sv2_watch')) cycleWatch(game); else game.toast('You need a Pocket watch (Pedal & Pump).'); } if (st.sel === 2) { S(game).watch = S(game).watch === 2 ? 1 : game.has('sv2_compass') ? 2 : S(game).watch; if (!game.has('sv2_compass')) game.toast('You need a Little compass.'); } }
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, s = S(game), tw = w / 4;
    TABS.forEach((t, i) => { rect(g, i === st.tab ? UI.gold : UI.paper2, x + i * tw, y, tw - 1, 12); T(g, t.toUpperCase(), x + i * tw + 4, y + 3, i === st.tab ? UI.ink : UI.dim); });
    const oy = y + 18;
    if (st.tab === 0) {
      T(g, `TICKETS ${s.tickets}   TOTAL ${s.ticketsTotal}   TOKENS ${game.count('sv2_token')}`, x + 2, oy, UI.accent2);
      KEYS.forEach((k, i) => {
        const gm = GAMES[k], yy = oy + 12 + i * 22, on = st.sel === i;
        if (on) rect(g, UI.gold, x, yy - 2, w, 21);
        T(g, `${gm.name.toUpperCase()}   BEST ${best(game, k)} / ${gm.goal}${s.goalsMet[k] ? '  BEAT!' : ''}`, x + 3, yy, UI.ink);
        T(g, table(game, k).slice(0, 3).map((e) => `${e.n} ${e.s}`).join('  ') + `   PLAYS ${s.plays[k]}`, x + 3, yy + 9, UI.dim);
      });
      if (s.bestTime) T(g, `BEST LAP RUN ${s.bestTime.toFixed(1)}S (GHOST SAVED)`, x + 2, oy + 82, UI.good);
    } else if (st.tab === 1) {
      const b = B(game);
      if (!b.owned) { wrap('No bicycle yet. Pedal & Pump in the shotengai sells one. Ride outdoors at 1.7x speed, ring the bell and recover energy.', 40).forEach((l, i) => T(g, l, x + 4, oy + i * 9)); return; }
      T(g, `${(b.name || 'UNNAMED').toUpperCase()}   ${b.riding ? 'RIDING' : 'PARKED'}`, x + 2, oy, UI.accent2);
      [`FRAME ${PAINT_NAMES[b.paint].toUpperCase()}`, `TIRES LEVEL ${b.tires}/3   SPEED X${speedMult(game).toFixed(1)}`, `BASKET LEVEL ${b.basket}/3   +${BASKET[b.basket]} BAG SLOTS`, `KM RIDDEN ${b.km.toFixed(1)}   RIDES ${b.rides}`, `BICYCLE SKILL ${bikeLevel(game)}/5   NEXT AT ${SKILL_KM[Math.min(5, bikeLevel(game) + 1)]} KM`, `ENERGY REGAINED TODAY ${b.regenDay === game.day ? b.regen : 0}/${25 + 5 * bikeLevel(game)}`].forEach((l, i) => T(g, l, x + 4, oy + 12 + i * 10));
      T(g, b.riding ? 'E: HOP OFF   (KEY B)' : 'E: HOP ON NEAR YOUR BIKE   (KEY B)', x + 4, oy + 80, UI.dim);
    } else if (st.tab === 2) {
      refreshBounties(game);
      HW(game).list.forEach((b, i) => {
        const yy = oy + i * 22, on = st.sel === i;
        if (on) rect(g, UI.gold, x, yy - 2, w, 21);
        T(g, `${b.title.toUpperCase()}  ${b.state === 'open' ? 'OPEN' : b.state.toUpperCase()}`, x + 3, yy, b.state === 'done' ? UI.good : b.state === 'failed' ? UI.bad : UI.ink);
        T(g, `${progressText(game, b)}   ${b.reward.coins}C ${b.reward.tickets}T`.slice(0, 46), x + 3, yy + 9, UI.dim);
      });
      T(g, `E: TAKE / HAND IN.  JOBS DONE ${HW(game).done}`, x + 2, oy + 70, UI.dim);
      const sel = HW(game).list[st.sel]; if (sel) wrap(sel.text, 47).slice(0, 4).forEach((l, i) => T(g, l, x + 2, oy + 82 + i * 8, UI.ink));
    } else {
      const l = s.light;
      [[`LANTERN ${l.on ? 'ON' : 'OFF'}  ${Math.round(l.battery)}%${game.has('sv2_lantern') ? '' : '  (NEED ITEM)'}`], [`WATCH ${s.watch ? 'SHOWN' : 'HIDDEN'}${game.has('sv2_watch') ? '' : '  (NEED ITEM)'}`], [`COMPASS ${s.watch >= 2 ? 'SHOWN' : 'HIDDEN'}${game.has('sv2_compass') ? '' : '  (NEED ITEM)'}`]].forEach(([t], i) => {
        const yy = oy + i * 22, on = st.sel === i; if (on) rect(g, UI.gold, x, yy - 2, w, 21); T(g, t, x + 3, yy, UI.ink);
      });
      rect(g, UI.ink, x + 3, oy + 11, 100, 6); rect(g, l.battery > 25 ? UI.good : UI.bad, x + 4, oy + 12, Math.round(98 * l.battery / 100), 4);
      T(g, 'E TOGGLES. THE LANTERN LIGHTS DARK PLACES.', x + 2, oy + 74, UI.dim);
      T(g, 'SLEEPING RECHARGES THE BATTERY.', x + 2, oy + 83, UI.dim);
    }
    void h; void K; void panel; void spotPos; void say; void bikeName;
  },
});

features('Arcade & Travel', [
  'Help Wanted: three fresh bounties pinned on the town board every morning, taken with Look closer on the note',
  'Bike runs: ride to a named place (harbour dock, beach, shrine gate, park, school gate...) before the timer runs out',
  'Long rides: ride a set distance in a day for pocket money from Tomo',
  'Arcade bounties: score a target at a named cabinet game; the score is checked as soon as the game ends',
  'Bring-an-item bounties from Mika, Sachiko, Goro or Hana, handed in from the board or the Play app',
  'Bounties pay coins, arcade tickets and now and then a Star Sticker; up to three can be taken at once',
  'Play phone app: tickets, tokens and high scores; bike stats; the day\'s jobs; and pocket tool switches',
  'The compass needle points at your active bike-run destination, even through map exits',
]);
