// Tutorial and help: ~33 first-time Tips (dismissible cards, each shown once ever), a How to Play codex phone app (topics, controls with a
// touch diagram, tip history, live guide), and Guide Mochi: an optional "what to do next" card (G key, the small cat button, or the codex).
import { register, get, all, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, drawTextC, wrap, icon, inside } from '../../ui/ui.js';
import { currentObjective } from '../../ui/hud.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { S, idle, clamp } from './state.js';
import { scrollList, keyNav, listRows, chips, RH } from './ui.js';
import { ACTS } from './data.js';
import { avail } from './seasons.js';

const stat = (g, k, n = 1) => (g.state.stats[k] || 0) >= n;
const onMap = (id) => (g, e) => e && e.map === id;
// [id, title, text, events, test(g, e)]
export const TIPS = [
  ['move', 'Getting around', 'Move with WASD or the arrow keys (the stick on touch). Press E, Space or A to talk and to use things.', ['tick'], (g) => g.world && g.day >= 1],
  ['phone', 'Your phone', 'Open the phone with Tab, M or Esc (or the menu button). Quests, bag, map, friends and more live there.', ['tick'], (g) => g.state.playMs > 25000 || g.day > 1],
  ['bag', 'Your bag', 'The bag holds a limited number of items. Use food to recover energy, give gifts to friends, or sell things in shops.', ['itemGot'], () => true],
  ['energy', 'Energy', 'Energy drops as you work and play. Eat something or sleep to refill it. Prefer a relaxed game? Try Cozy mode in the Comfort app.', ['tick', 'hour'], (g) => g.state.energy < 35],
  ['meet', 'Making friends', 'Talk to people every day to raise hearts. Each person has favourite gifts, and Hoshipedia remembers what you learn.', ['meet'], () => true],
  ['gift', 'Gifts', 'Gifts they love give the most hearts. Watch their reaction: it tells you what they like.', ['gift'], () => true],
  ['rain', 'Rainy days', 'Rain changes where people hang out, and a few seasonal moments only happen in the wet.', ['tick'], (g) => g.weather === 'rain' || g.weather === 'storm'],
  ['sleep', 'Bedtime', 'Sleep in your bed before 2 AM. Staying up too late makes you pass out and wake up tired.', ['tick', 'hour'], (g) => g.minutes >= 22 * 60],
  ['school', 'School days', 'On school days be in class on time for good grades. Weekends are yours.', ['mapEnter'], onMap('school_grounds')],
  ['town', 'The town square', 'The noticeboard here has requests for coins and friendship. Shops and the cafe are all around the square.', ['mapEnter'], onMap('town')],
  ['park', 'The park', 'Walk up to water with a rod to fish, or to tall grass with a net for bugs. The sakura tree is a favourite spot.', ['mapEnter'], onMap('park')],
  ['beach', 'Shell Beach', 'Shells wash up here, and low tide shows more. The shaved-ice stand opens in summer.', ['mapEnter'], onMap('beach')],
  ['shrine', 'Hoshi Hill Shrine', 'Draw a fortune, write an ema and ring the bell. Kiko can tell you about your luck.', ['mapEnter'], onMap('shrine')],
  ['cafe', 'Cafe Kumo', 'Order food for energy, or ask Mika about a part-time shift from the Jobs app.', ['mapEnter'], onMap('cafe')],
  ['mart', 'Sunny Mart', 'Ingredients and seeds are sold here. Watch for daily deals at the register.', ['mapEnter'], onMap('mart')],
  ['library', 'The library', 'Borrow books, donate finds to the museum corner and study for school.', ['mapEnter'], onMap('library')],
  ['harbour', 'The harbour', 'Buy bait, fish from the pier and sell your catch at the market stall.', ['mapEnter'], onMap('harbour')],
  ['quest', 'Quests', 'Open Quests in the phone to see your goals. The current step is also shown at the top of the screen.', ['questStart'], () => true],
  ['minigame', 'Minigames', 'Minigames give one to three stars. Better results earn better rewards, and Esc lets you quit.', ['minigameDone'], () => true],
  ['coins', 'Coins', 'Coins buy furniture, tools and seeds. Save up for something special, or pick up a job.', ['moneyChanged'], (g) => g.state.money >= 800],
  ['diary', 'Seasonal Diary', 'Little seasonal moments sparkle around town. Each one earns a stamp in the Seasonal Diary on your phone.', ['sv5Activity'], () => true],
  ['season', 'A new season', 'New season, new moments. Check the Seasonal Diary for what is out and about.', ['dayStart'], (g) => g.day > 1 && ((g.day - 1) % 28) === 0],
  ['festival', 'Festivals', 'Festival days have special activities and shops. Check the calendar on your phone to see what is coming.', ['festivalStart'], () => true],
  ['cook', 'Cooking', 'Cooked dishes restore more energy than raw ingredients, and friends love homemade food.', ['cooked'], () => true],
  ['fish', 'Fishing', 'Different fish bite in different places, seasons and weather. The collection app tracks what you have caught.', ['stat'], (g, e) => e && e.k === 'fishCaught'],
  ['farm', 'Gardening', 'Water your crops every day. Each crop grows in certain seasons only.', ['stat'], (g, e) => e && e.k === 'harvested'],
  ['hearts', 'Heart events', 'Reach certain heart levels with someone to unlock a special scene with them.', ['heartUp'], () => true],
  ['photo', 'Photo mode', 'Press P (or use Snapshots in the phone) to hide the HUD, pan the camera, add filters and frames and keep pictures.', ['tick'], (g) => g.day >= 3],
  ['badge', 'Badges', 'Badges give Star Stickers. The Challenges app has a weekly board and a Daily Wish with wish stars.', ['achievement'], () => true],
  ['weekend', 'Weekends', 'No school on weekends: a good time for hobbies, jobs and festivals.', ['dayStart'], (g) => g.isWeekend],
  ['wish', 'Daily Wish', 'Each day has a small wish. Seven wish stars earn a reward.', ['dayStart'], (g) => g.day >= 2],
  ['mochi', 'Mochi', 'Pet and feed Mochi every day. A happy cat leaves little presents.', ['stat'], (g, e) => e && e.k === 'mochiPets'],
  ['touch', 'Touch controls', 'Drag lists to scroll. A is act, B is back, RUN toggles running. The Help app shows a diagram.', ['tick'], () => typeof document !== 'undefined' && document.body && document.body.classList.contains('touch')],
];
const TIP = Object.fromEntries(TIPS.map((t) => [t[0], t]));
for (const t of TIPS) register('tip', 'sv5_' + t[0], { name: t[1], text: t[2] });
export const tipsOn = (g) => g.settings.tips !== false;

// ---------------------------------------------------------------- the tip engine
let QUEUE = [], CARD = null;
export function tryTip(g, id, e) {
  const t = TIP[id], s = S(g).tips; if (!t || s.shown[id] || !tipsOn(g)) return false;
  if (!t[4](g, e)) return false;
  if (QUEUE.some((q) => q.id === id)) return false;
  s.shown[id] = g.day; s.order.push(id); QUEUE.push({ id, title: t[1], text: t[2] }); g.stat('tipsSeen'); return true;
}
export function runEvent(g, ev, e) { if (g.day < 1) return; for (const t of TIPS) if (t[3].includes(ev)) tryTip(g, t[0], e); }
export const queued = () => QUEUE.length + (CARD ? 1 : 0);
export function resetTips() { QUEUE = []; CARD = null; }
export function dismissTip() { CARD = null; }

// ---------------------------------------------------------------- Guide Mochi
export function advice(g) {
  const out = [], story = g.story && g.story.hint && (() => { try { return g.story.hint(); } catch { return null; } })();
  if (story && story.text) out.push(`Story: ${story.text}`);
  const obj = currentObjective(g); if (obj && (!story || !story.text || obj.text !== story.text)) out.push(`Quest: ${obj.text}`);
  const s = S(g);
  if (g.state.energy < 30) out.push('You look tired. Eat something or head home to sleep.');
  else if (g.minutes >= 22 * 60) out.push('It is getting late. A bed is the best place right now.');
  const w = s.wish; if (w.goal && w.done < 1) out.push(`Daily wish: ${w.goal.text}`);
  const now = ACTS.filter((a) => a.s === g.season && avail(g, a).ok);
  if (now.length) { const a = now[g.day % now.length]; out.push(`Seasonal: ${a.name} (${(get('map', a.map) || { name: a.map }).name}) is ready.`); }
  if (g.hearts && !all('npc').some((n) => !n.hidden && g.hearts(n.id) >= 1)) out.push('Say hello to the neighbours to start your first friendship.');
  if (!out.length) out.push('Nothing urgent. Wander, fish, or visit a friend. Mochi approves of naps.');
  return out.slice(0, 4);
}
register('scene', 'sv5_guide', { make: (game) => ({
  name: 'sv5_guide', opaque: false, t: 0, lines: advice(game),
  enter(g) { g.sfx('blip'); g.stat('guideUses'); },
  update(dt, input, g) { this.t += dt; if (this.t > 0.3 && (input.justDown || input.pressed.size)) g.scenes.pop(this); },
  draw(g, game2) {
    panel(g, 20, 120, 280, 88, 'dark');
    const name = SPRITES['mochi_sit_0'] ? 'mochi_sit_0' : null; if (name) g.drawImage(sprite(name), 28, 130);
    drawText(g, 'GUIDE MOCHI', 70, 127, UI.gold, 1, null);
    this.lines.forEach((l, i) => wrap(l, 56).slice(0, 2).forEach((t, j) => drawText(g, (j ? '  ' : '- ') + t, 70, 139 + i * 14 + j * 7, UI.text, 1, null)));
    drawText(g, 'TAP OR PRESS ANY KEY', 160 - 40, 198, UI.dim, 1, null);
  },
}) });
export const openGuide = (g) => { if (g.settings.guide !== false && idle(g)) g.open('sv5_guide'); };

// ---------------------------------------------------------------- HUD card + buttons, and key/pointer hooks
const BTN = { guide: [3, 40, 15, 15], photo: [20, 40, 15, 15] };
const CARDBOX = [104, 4, 166];
register('hud', 'sv5_tips', { draw(g, game) {
  const w = game.world; if (!w || game.hideHud || game.scenes.top !== w) return;
  if (!CARD && QUEUE.length && !w.busy) { CARD = QUEUE.shift(); CARD.until = game.clock + 16; }
  if (CARD && game.clock > CARD.until) CARD = null;
  if (game.settings.guide !== false) {
    for (const [k, [x, y, bw, bh]] of Object.entries(BTN)) { rect(g, '#2b1d2eb0', x, y, bw, bh); drawText(g, k === 'guide' ? '?' : 'P', x + 5, y + 5, UI.gold, 1, null); }
  }
  if (!CARD) return;
  const lines = wrap(CARD.text, 38).slice(0, 5), h = 20 + lines.length * 8;
  panel(g, CARDBOX[0], CARDBOX[1], CARDBOX[2], h, 'dark');
  drawText(g, CARD.title.toUpperCase(), CARDBOX[0] + 6, CARDBOX[1] + 5, UI.gold, 1, null); drawText(g, 'X', CARDBOX[0] + CARDBOX[2] - 11, CARDBOX[1] + 5, UI.bad, 1, null);
  lines.forEach((l, i) => drawText(g, l.toUpperCase(), CARDBOX[0] + 6, CARDBOX[1] + 16 + i * 8, UI.text, 1, null));
  CARD.h = h;
} });
register('system', 'sv5_tips', { init(game) {
  for (const ev of new Set(TIPS.flatMap((t) => t[3]))) if (ev !== 'tick') game.bus.on(ev, (e) => runEvent(game, ev, e));
  game.bus.on('gameStart', () => resetTips()); game.bus.on('gameLoaded', () => resetTips());
  let acc = 0; game._sv5TipAcc = () => acc;
  game.sv5Tick = (dt) => { acc += dt; if (acc > 2.5) { acc = 0; runEvent(game, 'tick'); } };
  if (typeof document === 'undefined') return;
  const worldIdle = () => !!(game.world && game.scenes.top === game.world && !game.world.busy);
  addEventListener('keydown', (e) => {
    if (e.repeat || !worldIdle() || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return; const k = e.key.toLowerCase();
    if (k === 'x' && CARD) dismissTip(); else if (k === 'g') openGuide(game); else if (k === 'p' && game.sv5Photo) game.sv5Photo();
  });
  let tries = 0; const hook = () => {
    const cv = document.querySelector('canvas'); if (!cv) { if (tries++ < 40) setTimeout(hook, 500); return; }
    cv.addEventListener('pointerdown', (e) => {
      if (!worldIdle() || game.hideHud) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 320, y = (e.clientY - r.top) / r.height * 224; let hit = false;
      if (CARD && inside(x, y, CARDBOX[0], CARDBOX[1], CARDBOX[2], CARD.h || 40)) { dismissTip(); hit = true; }
      else if (game.settings.guide !== false) { if (inside(x, y, ...BTN.guide)) { openGuide(game); hit = true; } else if (inside(x, y, ...BTN.photo) && game.sv5Photo) { game.sv5Photo(); hit = true; } }
      if (hit) { e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);
  };
  hook();
} });
register('worldTick', 'sv5_tips', { update(dt, world, game) { if (game.sv5Tick) game.sv5Tick(dt); } });

// ---------------------------------------------------------------- How to Play codex
const TOPICS = [
  ['The basics', 'You are Misa, new in Hoshimori Bay. Walk around, talk to people and use things with E, Space or A. Time passes as you play; the clock is at the top left.'],
  ['Time and sleep', 'Days run from 6 AM to 2 AM. Sleep in your bed to save and start a new day. Passing out later than 2 AM costs energy.'],
  ['Energy and mood', 'Energy is the green bar and mood is the heart bar. Food, naps and cosy moments help. Cozy mode in Comfort removes energy loss.'],
  ['Friends and hearts', 'Chat daily and give gifts to gain hearts. Hearts unlock scenes and perks. Hoshipedia keeps what you learn about likes.'],
  ['Money and shops', 'Earn coins from jobs, selling and chores. Shops are in town, the shotengai and the harbour. Star Stickers buy special things from Nori.'],
  ['Hobbies', 'Fishing, bug catching, gardening, cooking and crafting level up with use. Check the collections and the Hoshipedia for what to find.'],
  ['School', 'School days run until the afternoon. Attend class, study at the library and join a club. Grades show in the School app.'],
  ['Seasons', 'Every season has 14 little activities. Find them as sparkles on the ground. Stamps go into the Seasonal Diary.'],
  ['Festivals', 'Festivals appear on the calendar. Arrive on time for activities, food and special scenes.'],
  ['Mochi', 'Mochi is your cat. Feed, pet and play with them. Presents appear when Mochi is happy.'],
  ['Photo mode', 'Press P, tap the P button or open Snapshots. Pan, pick a filter, a frame and stickers, then take the shot.'],
  ['Challenges', 'The Challenges app has five weekly challenges and a Daily Wish. Seven wish stars give a reward.'],
  ['Saving', 'The game saves when you sleep (autosave) and settings save at once. Snapshots are stored in your save.'],
  ['Accessibility', 'Settings has larger text, high contrast, colour-blind colours and reduced motion. Comfort has Cozy mode, tips and text size.'],
];
const KEYS = [['WASD / ARROWS', 'Move'], ['E / SPACE / ENTER', 'Talk, use, confirm'], ['SHIFT', 'Run (toggle in settings)'], ['TAB / M / ESC', 'Phone and back'], ['Q / [', 'Previous phone app'], ['G', 'Guide Mochi'], ['P', 'Photo mode'], ['X', 'Close a tip card']];
function touchDiagram(g, x, y) {
  panel(g, x, y, 128, 104, 'paper');
  rect(g, UI.ink, x + 8, y + 70, 31, 1); // joystick ring
  for (let a = 0; a < 360; a += 20) rect(g, UI.accent2, x + 30 + Math.round(Math.cos(a * Math.PI / 180) * 18), y + 76 + Math.round(Math.sin(a * Math.PI / 180) * 18), 2, 2);
  rect(g, UI.accent, x + 26, y + 72, 8, 8); drawText(g, 'MOVE', x + 14, y + 96, UI.ink, 1, null);
  for (const [lx, ly, t, c] of [[100, 66, 'A', UI.accent], [80, 80, 'B', UI.sky], [104, 40, 'RUN', UI.mint], [104, 10, 'MENU', UI.gold]]) { rect(g, UI.ink, x + lx - 1, y + ly - 1, 20, 20); rect(g, c, x + lx, y + ly, 18, 18); drawText(g, t, x + lx + 9 - t.length * 2, y + ly + 6, UI.ink, 1, null); }
  drawText(g, 'DRAG LEFT = STICK', x + 6, y + 6, UI.ink2, 1, null); drawText(g, 'A ACT  B BACK', x + 6, y + 16, UI.ink2, 1, null); drawText(g, 'DRAG LISTS TO SCROLL', x + 6, y + 26, UI.ink2, 1, null);
}
const CT = ['TOPICS', 'KEYS', 'TIPS', 'GUIDE'];
register('phoneApp', 'sv5_codex', {
  name: 'How to Play', icon: 'i_question', order: 95,
  open(game, app) { Object.assign(app.state, { tab: 0, sel: 0, top: 0 }); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area; if (input.pressed.has('c')) { st.tab = (st.tab + 1) % 4; st.sel = st.top = 0; }
    if (input.justDown) for (let i = 0; i < 4; i++) if (inside(input.mx, input.my, x + i * 73, y, 71, 14)) { st.tab = i; st.sel = st.top = 0; }
    const n = st.tab === 0 ? TOPICS.length : st.tab === 2 ? S(game).tips.order.length : 0, zone = { x, y: y + 18, w: 120, h: 9 * RH };
    if (n) { const t = scrollList(input, st, n, zone); if (t >= 0) st.sel = t; keyNav(input, st, n, 9); }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, st = app.state, s = S(game);
    chips(g, null, x, y, 292, CT, st.tab);
    if (st.tab === 0) {
      listRows(g, st, { x, y: y + 18, w: 120, h: 9 * RH }, TOPICS.length, (i) => ({ text: TOPICS[i][0] }));
      panel(g, x + 134, y + 18, w - 134, 144, 'paper'); const T = TOPICS[st.sel] || TOPICS[0];
      drawText(g, T[0].toUpperCase(), x + 140, y + 24, UI.accent2, 1, null); wrap(T[1], 34).slice(0, 14).forEach((l, i) => drawText(g, l.toUpperCase(), x + 140, y + 36 + i * 9, UI.ink, 1, null));
    } else if (st.tab === 1) {
      KEYS.forEach(([k, d], i) => { rect(g, UI.paper2, x, y + 18 + i * 17, 150, 15); drawText(g, k, x + 4, y + 23 + i * 17, UI.accent2, 1, null); drawText(g, d.toUpperCase(), x + 80, y + 23 + i * 17, UI.ink, 1, null); });
      touchDiagram(g, x + 160, y + 18);
    } else if (st.tab === 2) {
      const order = s.tips.order; listRows(g, st, { x, y: y + 18, w: 120, h: 9 * RH }, order.length, (i) => ({ text: (TIP[order[i]] || ['', order[i]])[1] }));
      panel(g, x + 134, y + 18, w - 134, 144, 'paper'); const id = order[st.sel];
      if (id && TIP[id]) { drawText(g, TIP[id][1].toUpperCase(), x + 140, y + 24, UI.accent2, 1, null); wrap(TIP[id][2], 34).slice(0, 12).forEach((l, i) => drawText(g, l.toUpperCase(), x + 140, y + 36 + i * 9, UI.ink, 1, null)); }
      else drawText(g, 'TIPS YOU SEE ARE SAVED HERE.', x + 140, y + 30, UI.dim, 1, null);
      drawText(g, `${order.length}/${TIPS.length} TIPS SEEN. ${tipsOn(game) ? 'TIPS ON' : 'TIPS OFF'}`, x, y + 164, UI.dim, 1, null);
    } else {
      panel(g, x, y + 18, w, 144, 'paper'); drawText(g, 'GUIDE MOCHI SAYS', x + 8, y + 26, UI.accent2, 1, null);
      advice(game).forEach((l, i) => wrap(l, 66).slice(0, 3).forEach((t, j) => drawText(g, ((j ? '  ' : '- ') + t).toUpperCase(), x + 8, y + 40 + i * 28 + j * 8, UI.ink, 1, null)));
    }
  },
});

features('Seasons & Meta', [
  'Tips: 33 first-time hint cards (movement, phone, bag, energy, friends, gifts, weather, bedtime, each new place, quests, minigames and more) appear once ever, triggered by game events',
  'Tip cards are dismissible with a tap or X, fade on their own, and can be switched off with the Tutorial tips toggle',
  'How to Play codex phone app: fourteen help topics, a controls page with a keyboard list and a touch-controls diagram, a tip history and a live guide page',
  'Guide Mochi: an optional card (G key or the small ? button) that reads the story hint, quests, energy, time, your daily wish and ready seasonal activities to suggest what to do next',
]);
