// Longevity: weekly Challenge Board (5 challenges from real stats), Daily Wish (7 wish stars = reward), 60 achievements 2.0 (ach5_*),
// the Statistics Hall (lifetime stats by category, auto-listing every stat other packs add, plus records) and the Comfort app
// (Cozy mode = no energy loss, Tutorial tips, Guide Mochi, text size preset that auto-enlarges on narrow touch screens).
import { register, get, all, features } from '../../core/registry.js';
import { UI, rect, panel, drawText, drawTextC, wrap, inside } from '../../ui/ui.js';
import { applyPrefs } from '../ui/settings.js';
import { S, stickers, giveOr, clamp } from './state.js';
import { scrollList, keyNav, listRows, chips, RH } from './ui.js';

const stat = (g, k) => g.state.stats[k] || 0;
const weekOf = (g) => Math.floor((g.day - 1) / 7);
// ---------------------------------------------------------------- weekly challenges
// [stat, text with {n}, min, max, coins per unit-ish]
export const POOL = [
  ['fishCaught', 'Catch {n} fish', 3, 8], ['bugsCaught', 'Catch {n} bugs', 3, 8], ['cooked', 'Cook {n} dishes', 2, 5], ['harvested', 'Harvest {n} crops', 5, 15],
  ['talks', 'Chat with people {n} times', 8, 20], ['gifts', 'Give {n} gifts', 2, 5], ['homeTasks', 'Finish {n} home tasks', 4, 10], ['mochiPets', 'Pet Mochi {n} times', 5, 12],
  ['steps', 'Walk {n} steps', 1500, 4000], ['coinsEarned', 'Earn {n} coins', 300, 900], ['shopBuys', 'Buy {n} things from shops', 3, 8], ['classesAttended', 'Attend {n} classes', 3, 6],
  ['crafted', 'Craft {n} things', 2, 5], ['sv5Acts', 'Enjoy {n} seasonal activities', 3, 6], ['sv5Snaps', 'Take {n} photos in photo mode', 2, 4], ['jobShifts', 'Work {n} shifts', 1, 3], ['dexEntries', 'Discover {n} Hoshipedia entries', 3, 8],
];
export function genWeek(g) {
  const c = S(g).chal, wk = weekOf(g); if (c.week === wk) return false;
  const r = g.rngFor('sv5week' + wk, wk * 7 + 1), idx = POOL.map((_, i) => i);
  const list = [];
  for (let i = 0; i < 5; i++) {
    const j = Math.floor(r() * idx.length), [k, text, lo, hi] = POOL[idx.splice(j, 1)[0]], step = hi > 100 ? 100 : 1;
    const goal = Math.round((lo + r() * (hi - lo)) / step) * step;
    list.push({ stat: k, goal, base: stat(g, k), text: text.replace('{n}', goal), coins: 80 + Math.round(goal * (hi > 100 ? 0.15 : 12)), stickers: 1, claimed: 0, notified: 0 });
  }
  Object.assign(c, { week: wk, list, claimed: {}, bonus: 0 }); return true;
}
export const progressOf = (g, c) => clamp(stat(g, c.stat) - c.base, 0, c.goal);
export function claimChallenge(g, i) {
  const c = S(g).chal, ch = c.list[i]; if (!ch || ch.claimed || progressOf(g, ch) < ch.goal) return false;
  ch.claimed = 1; g.addMoney(ch.coins); stickers(g, ch.stickers, 'weekly challenge'); g.stat('chalDone'); g.bus.emit('sv5Challenge', { id: ch.stat });
  if (c.list.every((x) => x.claimed) && !c.bonus) { c.bonus = 1; stickers(g, 3, 'weekly board cleared'); g.stat('chalWeeks'); giveOr(g, 'furn_star_garland', 200); }
  return true;
}
// ---------------------------------------------------------------- daily wish
export const WISHES = [['talks', 3, 'Chat with 3 people'], ['fishCaught', 1, 'Catch a fish'], ['bugsCaught', 1, 'Catch a bug'], ['cooked', 1, 'Cook a dish'], ['harvested', 2, 'Harvest 2 crops'], ['mochiPets', 1, 'Pet Mochi'], ['steps', 400, 'Walk 400 steps'], ['gifts', 1, 'Give someone a gift'], ['homeTasks', 2, 'Do 2 home tasks'], ['sv5Acts', 1, 'Enjoy a seasonal moment'], ['coinsEarned', 100, 'Earn 100 coins'], ['shopBuys', 1, 'Buy something'], ['sv5Snaps', 1, 'Take a photo'], ['crafted', 1, 'Craft something'], ['dexEntries', 1, 'Discover something new']];
export function rollWish(g) {
  const w = S(g).wish; if (w.day === g.day) return false;
  const r = g.rngFor('sv5wish', g.day), [k, n, text] = WISHES[Math.floor(r() * WISHES.length)];
  Object.assign(w, { day: g.day, goal: { stat: k, n, text }, base: stat(g, k), done: 0 }); return true;
}
export function checkWish(g) {
  const w = S(g).wish; if (!w.goal || w.done || w.day !== g.day) return false;
  if (stat(g, w.goal.stat) - w.base < w.goal.n) return false;
  w.done = 1; w.stars++; w.streak = w.last === g.day - 1 ? w.streak + 1 : 1; w.last = g.day; w.best = Math.max(w.best, w.streak);
  g.stat('wishStars'); g.toast('Daily wish granted! +1 wish star', 'i_star'); g.sfx && g.sfx('chime'); g.bus.emit('sv5Wish', { stars: w.stars });
  if (w.stars >= 7) { w.stars -= 7; w.rewards++; g.stat('wishRewards'); stickers(g, 3, 'seven wish stars'); g.addMoney(500); giveOr(g, 'gift_candle', 100); g.toast('Seven wish stars! A reward arrives.', 'i_star'); }
  return true;
}
// ---------------------------------------------------------------- achievements 2.0
const AC = (id, name, desc, cond, icon = 'i_trophy', extra = {}) => register('achievement', 'ach5_' + id, { name, desc, cond, icon, ...extra });
const S5 = [
  ['stamp1', 'First stamp', 'Collect your first seasonal stamp.', 'stat:sv5Stamps>=1', 'i_cal'], ['stamp14', 'Fourteen stamps', 'Collect 14 seasonal stamps.', 'stat:sv5Stamps>=14', 'i_cal'], ['stamp28', 'Halfway round', 'Collect 28 seasonal stamps.', 'stat:sv5Stamps>=28', 'i_cal'], ['stamp56', 'Stamp book full', 'Collect all 56 seasonal stamps.', 'stat:sv5Stamps>=56', 'i_cal', { title: 'Four Seasons Keeper' }],
  ['acts10', 'Out and about', 'Enjoy 10 seasonal activities.', 'stat:sv5Acts>=10', 'i_sun'], ['acts50', 'Seasonal regular', 'Enjoy 50 seasonal activities.', 'stat:sv5Acts>=50', 'i_sun'], ['acts150', 'Seasonal devotee', 'Enjoy 150 seasonal activities.', 'stat:sv5Acts>=150', 'i_sun'],
  ['gold1', 'Gold star', 'Earn a gold stamp with 3 stars.', 'stat:sv5Gold>=1', 'i_star'], ['gold14', 'Golden touch', 'Earn 14 gold stamps.', 'stat:sv5Gold>=14', 'i_star'], ['gold40', 'Pure gold', 'Earn 40 gold stamps.', 'stat:sv5Gold>=40', 'i_star', { hidden: true }],
  ['badge1', 'Season badge', 'Earn your first season badge.', 'stat:sv5Badges>=1', 'i_trophy'], ['badge4', 'All four badges', 'Earn all four season badges.', 'stat:sv5Badges>=4', 'i_trophy'], ['cere', 'Four Seasons Complete', 'Attend a Four Seasons ceremony.', 'stat:sv5Ceremonies>=1', 'i_trophy'],
  ['spring', 'Spring in my step', 'Enjoy 10 spring activities.', 'stat:sv5_spring>=10', 'i_leaf'], ['summer', 'Summer vibes', 'Enjoy 10 summer activities.', 'stat:sv5_summer>=10', 'i_sun'], ['autumn', 'Leaf peeper', 'Enjoy 10 autumn activities.', 'stat:sv5_autumn>=10', 'i_leaf'], ['winter', 'Snow lover', 'Enjoy 10 winter activities.', 'stat:sv5_winter>=10', 'i_snow'],
  ['snap1', 'Say cheese', 'Take a photo in photo mode.', 'stat:sv5Snaps>=1', 'i_camera'], ['snap10', 'Photo walk', 'Take 10 photos in photo mode.', 'stat:sv5Snaps>=10', 'i_camera'], ['snap40', 'Album keeper', 'Take 40 photos in photo mode.', 'stat:sv5Snaps>=40', 'i_camera'], ['filter', 'Filter fan', 'Take 5 filtered photos.', 'stat:sv5FilterShots>=5', 'i_camera'], ['frame', 'Framed', 'Take 5 framed photos.', 'stat:sv5FramedShots>=5', 'i_camera'], ['sticker', 'Sticker spree', 'Take 5 photos with stickers.', 'stat:sv5StickerShots>=5', 'i_camera'],
  ['dex25', 'Curious', 'Fill 25 Hoshipedia entries.', 'stat:dexEntries>=25', 'i_book'], ['dex100', 'Researcher', 'Fill 100 Hoshipedia entries.', 'stat:dexEntries>=100', 'i_book'], ['dex300', 'Scholar', 'Fill 300 Hoshipedia entries.', 'stat:dexEntries>=300', 'i_book'], ['dex700', 'Walking encyclopedia', 'Fill 700 Hoshipedia entries.', 'stat:dexEntries>=700', 'i_book', { title: 'Hoshipedian' }],
  ['tips10', 'Quick learner', 'See 10 tips.', 'stat:tipsSeen>=10', 'i_question'], ['tips30', 'Tip top', 'See 30 tips.', 'stat:tipsSeen>=30', 'i_question'], ['guide1', 'Ask Mochi', 'Ask Guide Mochi what to do next.', 'stat:guideUses>=1', 'i_paw'], ['guide10', 'Mochi knows best', 'Ask Guide Mochi 10 times.', 'stat:guideUses>=10', 'i_paw'],
  ['chal1', 'Challenger', 'Finish a weekly challenge.', 'stat:chalDone>=1', 'i_check'], ['chal10', 'Weekly warrior', 'Finish 10 weekly challenges.', 'stat:chalDone>=10', 'i_check'], ['chal40', 'Board master', 'Finish 40 weekly challenges.', 'stat:chalDone>=40', 'i_check'], ['board', 'Clean sweep', 'Clear a whole weekly board.', 'stat:chalWeeks>=1', 'i_check'],
  ['wish1', 'Make a wish', 'Earn a wish star.', 'stat:wishStars>=1', 'i_star'], ['wish7', 'Seven stars', 'Earn a wish reward.', 'stat:wishRewards>=1', 'i_star'], ['wish35', 'Star collector', 'Earn five wish rewards.', 'stat:wishRewards>=5', 'i_star'],
  ['fish100', 'Fish tales', 'Catch 100 fish.', 'stat:fishCaught>=100', 'i_fishicon'], ['bug100', 'Bug buddy', 'Catch 100 bugs.', 'stat:bugsCaught>=100', 'i_leaf'], ['cook150', 'Kitchen hero', 'Cook 150 dishes.', 'stat:cooked>=150', 'i_energy'], ['harv300', 'Harvest moon', 'Harvest 300 crops.', 'stat:harvested>=300', 'i_leaf'],
  ['talk500', 'Gabby', 'Have 500 chats.', 'stat:talks>=500', 'i_chat'], ['gift200', 'Santa Misa', 'Give 200 gifts.', 'stat:gifts>=200', 'heart'], ['pet500', 'Purrfect friend', 'Pet Mochi 500 times.', 'stat:mochiPets>=500', 'heart'], ['home200', 'Spotless', 'Finish 200 home tasks.', 'stat:homeTasks>=200', 'i_check'],
  ['steps100k', 'Long walker', 'Walk 100,000 steps.', 'stat:steps>=100000', 'i_map'], ['steps250k', 'Marathon Misa', 'Walk 250,000 steps.', 'stat:steps>=250000', 'i_map'], ['craft100', 'Maker', 'Craft 100 things.', 'stat:crafted>=100', 'i_gear'], ['shop200', 'Shopaholic', 'Buy from shops 200 times.', 'stat:shopBuys>=200', 'i_bag'],
  ['earn500k', 'Half a million', 'Earn 500,000 coins in total.', 'stat:coinsEarned>=500000', 'i_coin'], ['rich20k', 'Comfortably rich', 'Have 20,000 coins at once.', 'money>=20000', 'i_coin'], ['days100', 'One hundred days', 'Play for 100 days.', 'stat:daysPlayed>=100', 'i_cal'], ['days300', 'Hoshimori native', 'Play for 300 days.', 'stat:daysPlayed>=300', 'i_cal'], ['year3', 'Third year', 'Reach the third year.', 'year>=3', 'i_cal'],
  ['friends6', 'Popular', 'Reach 6 hearts with 8 people.', 'friends:6>=8', 'heart'], ['pct50', 'Bug expert 2', 'Catch half of the bug species.', 'pct:bug>=50', 'i_leaf'], ['friends10', 'Bonds for life', 'Reach 10 hearts with 4 people.', 'friends:10>=4', 'heart'], ['pct75', 'Almost an expert', 'Catch 75% of the fish species.', 'pct:fish>=75', 'i_fishicon'], ['ach100', 'Hundred badges', 'Earn 100 achievements.', 'achcount>=100', 'i_trophy', { title: 'Overachiever' }],
];
for (const a of S5) AC(...a);

// ---------------------------------------------------------------- systems
const COZY = (g) => g.settings.cozyMode === true;
function autoText(g) {
  const s = g.settings;
  if (s.textPreset === 'large') { if (!s.bigText) { s.bigText = true; applyPrefs(g); } return; }
  if (s.textPreset === 'normal' || s.sv5AutoDone || typeof document === 'undefined' || !document.body || !document.body.classList.contains('touch')) return;
  s.sv5AutoDone = true;
  if (typeof innerWidth !== 'undefined' && innerWidth <= 820 && !s.bigText) { s.bigText = true; g.saveSettings(); applyPrefs(g); g.toast('Larger text turned on for small screens', 'i_gear'); }
}
register('system', 'sv5_longevity', { init(game) {
  const origAdd = game.addEnergy.bind(game), origUse = game.useEnergy.bind(game);
  game.addEnergy = (n) => origAdd(COZY(game) && n < 0 ? 0 : n);
  game.useEnergy = (n) => (COZY(game) ? true : origUse(n));
  const daily = () => { genWeek(game); rollWish(game); checkWish(game); };
  for (const e of ['dayStart', 'gameStart', 'gameLoaded']) game.bus.on(e, daily);
  game.bus.on('stat', () => {
    checkWish(game);
    for (const ch of S(game).chal.list || []) if (!ch.notified && progressOf(game, ch) >= ch.goal) { ch.notified = 1; game.toast(`Challenge done: ${ch.text}`, 'i_check'); }
  });
  game.bus.on('moneyChanged', () => { const r = S(game).rec; r.maxMoney = Math.max(r.maxMoney, game.state.money); });
  game.bus.on('minigameDone', (e) => { if (e && e.result && !e.result.quit && e.id) { const sc = S(game).rec.scores; sc[e.id] = Math.max(sc[e.id] || 0, Math.round((e.result.score || 0) * 100)); } });
  let acc = 0; game.sv5Longevity = (dt) => { acc += dt; if (acc > 3) { acc = 0; autoText(game); } };
} });
register('worldTick', 'sv5_longevity', { update(dt, world, game) { if (game.sv5Longevity) game.sv5Longevity(dt); } });

// ---------------------------------------------------------------- Challenges app
register('phoneApp', 'sv5_board', {
  name: 'Challenges', icon: 'i_check', order: 23,
  badge: (g) => (S(g).chal.list || []).filter((c) => !c.claimed && progressOf(g, c) >= c.goal).length,
  open(game, app) { genWeek(game); rollWish(game); Object.assign(app.state, { tab: 0, sel: 0, top: 0 }); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area;
    if (input.pressed.has('c')) st.tab = 1 - st.tab;
    if (input.justDown) for (let i = 0; i < 2; i++) if (inside(input.mx, input.my, x + i * 146, y, 144, 14)) st.tab = i;
    if (st.tab === 0) {
      const l = S(game).chal.list || [];
      if (input.justDown) for (let i = 0; i < l.length; i++) if (inside(input.mx, input.my, x, y + 18 + i * 28, 292, 26)) { st.sel = i; if (claimChallenge(game, i)) game.sfx('chime'); }
      keyNav(input, st, l.length, 5); if (input.pressed.has('enter') || input.pressed.has('e')) if (claimChallenge(game, st.sel)) game.sfx('chime');
    }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, s = S(game);
    chips(g, null, x, y, 292, ['WEEKLY BOARD', 'DAILY WISH'], st.tab);
    if (st.tab === 0) {
      (s.chal.list || []).forEach((c, i) => {
        const yy = y + 18 + i * 28, p = progressOf(game, c), done = p >= c.goal;
        rect(g, i === st.sel ? UI.gold : UI.paper2, x, yy, 292, 26); drawText(g, c.text.toUpperCase(), x + 5, yy + 4, UI.ink, 1, null);
        rect(g, UI.ink, x + 5, yy + 15, 182, 7); rect(g, '#d8d0c0', x + 6, yy + 16, 180, 5); rect(g, done ? UI.good : UI.accent, x + 6, yy + 16, Math.round(180 * p / c.goal), 5);
        drawText(g, `${p}/${c.goal}`, x + 192, yy + 15, UI.dim, 1, null);
        if (c.claimed) drawText(g, 'CLAIMED', x + 240, yy + 5, UI.good, 1, null); else if (done) { rect(g, UI.mint, x + 232, yy + 3, 56, 18); drawTextC(g, 'CLAIM', x + 260, yy + 9, UI.ink, 1, null); } else drawText(g, `${c.coins}C +1 STAR`, x + 224, yy + 15, UI.dim, 1, null);
      });
      drawText(g, s.chal.bonus ? 'BOARD CLEARED: BONUS CLAIMED' : 'CLEAR ALL FIVE FOR A BONUS. NEW BOARD EVERY WEEK.', x, y + 164, UI.dim, 1, null);
    } else {
      const w = s.wish; panel(g, x, y + 18, 292, 60, 'paper');
      drawText(g, 'TODAY\'S WISH', x + 8, y + 24, UI.accent2, 1, null); drawText(g, (w.goal ? w.goal.text : 'Loading...').toUpperCase(), x + 8, y + 36, UI.ink, 1, null);
      const prog = w.goal ? clamp(stat(game, w.goal.stat) - w.base, 0, w.goal.n) : 0; drawText(g, w.done ? 'GRANTED!' : `PROGRESS ${prog}/${w.goal ? w.goal.n : 0}`, x + 8, y + 50, w.done ? UI.good : UI.dim, 1, null);
      drawText(g, 'WISH STARS', x + 8, y + 90, UI.accent2, 1, null);
      for (let i = 0; i < 7; i++) { rect(g, i < w.stars ? UI.gold : UI.paper2, x + 8 + i * 28, y + 102, 24, 24); drawTextC(g, '*', x + 20 + i * 28, y + 110, i < w.stars ? UI.ink : UI.dim, 2, null); }
      drawText(g, `STREAK ${w.streak}  BEST ${w.best}  REWARDS ${w.rewards}`, x + 8, y + 136, UI.ink2, 1, null);
      drawText(g, '7 STARS = 3 STICKERS, 500 COINS AND A CANDLE', x + 8, y + 150, UI.dim, 1, null);
    }
  },
});

// ---------------------------------------------------------------- Statistics Hall
const CATS = [
  ['LIFE', [['Days played', 'daysPlayed'], ['Steps walked', 'steps'], ['Home tasks', 'homeTasks'], ['Meals eaten', 'eaten'], ['Classes attended', 'classesAttended'], ['Letters read', 'lettersRead'], ['Secrets found', 'secretsFound']]],
  ['HOBBY', [['Fish caught', 'fishCaught'], ['Bugs caught', 'bugsCaught'], ['Dishes cooked', 'cooked'], ['Crops harvested', 'harvested'], ['Things crafted', 'crafted'], ['Donations', 'donated'], ['Photos taken', 'photosTaken'], ['Constellations', 'constellations']]],
  ['SOCIAL', [['Chats', 'talks'], ['Gifts given', 'gifts'], ['People met', 'peopleMet'], ['Hangouts', 'hangouts'], ['Mochi pets', 'mochiPets'], ['Kind deeds', 'kindDeeds'], ['Festivals', 'festivalsAttended']]],
  ['MONEY', [['Coins earned', 'coinsEarned'], ['Coins spent', 'coinsSpent'], ['Shop purchases', 'shopBuys'], ['Job shifts', 'jobShifts'], ['Star Stickers', 'starStickers']]],
  ['SEASON', [['Activities enjoyed', 'sv5Acts'], ['Stamps', 'sv5Stamps'], ['Gold stamps', 'sv5Gold'], ['Spring', 'sv5_spring'], ['Summer', 'sv5_summer'], ['Autumn', 'sv5_autumn'], ['Winter', 'sv5_winter'], ['Season badges', 'sv5Badges'], ['Snapshots', 'sv5Snaps'], ['Hoshipedia entries', 'dexEntries'], ['Challenges done', 'chalDone'], ['Wish stars', 'wishStars']]],
];
const pretty = (k) => k.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/_/g, ' ');
export function hallRows(g, tab) {
  if (tab < CATS.length) return CATS[tab][1].map(([l, k]) => ({ label: l, v: stat(g, k) }));
  const r = S(g).rec;
  if (tab === CATS.length) {
    const wish = S(g).wish, rows = [{ label: 'Most coins held', v: Math.max(r.maxMoney, g.state.money) }, { label: 'Most seasonal moments in a day', v: r.bestDayActs }, { label: 'Longest wish streak (days)', v: wish.best }];
    for (const [id, v] of Object.entries(r.scores).sort((a, b) => b[1] - a[1]).slice(0, 12)) rows.push({ label: `Best: ${(get('minigame', id) || { title: id }).title}`, v: v + '%' });
    return rows;
  }
  return Object.entries(g.state.stats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: pretty(k), v }));
}
register('phoneApp', 'sv5_hall', {
  name: 'Statistics Hall', icon: 'i_trophy', order: 86,
  open(game, app) { Object.assign(app.state, { tab: 0, sel: 0, top: 0 }); },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, n = hallRows(game, st.tab).length;
    if (input.pressed.has('c')) { st.tab = (st.tab + 1) % 7; st.top = st.sel = 0; }
    if (input.justDown) for (let i = 0; i < 7; i++) if (inside(input.mx, input.my, x + i * 41, y, 40, 14)) { st.tab = i; st.top = st.sel = 0; }
    scrollList(input, st, n, { x, y: y + 18, w: 280, h: 9 * RH });
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, rows = hallRows(game, st.tab);
    chips(g, null, x, y, 287, [...CATS.map((c) => c[0]), 'BEST', 'ALL'], st.tab);
    listRows(g, st, { x, y: y + 18, w: 280, h: 9 * RH }, rows.length, (i) => ({ text: rows[i].label, right: String(rows[i].v) }));
    drawText(g, `${rows.length} LINES. DRAG OR WHEEL TO SCROLL. C: NEXT PAGE`, x, y + 164, UI.dim, 1, null);
  },
});

// ---------------------------------------------------------------- Comfort app (settings addition)
const PRESETS = ['auto', 'large', 'normal'];
const CROWS = [['cozyMode', 'Cozy mode (no energy loss)', 'bool', false], ['tips', 'Tutorial tips', 'bool', true], ['guide', 'Guide Mochi buttons (? and P)', 'bool', true], ['textPreset', 'Text size', 'preset', 'auto']];
export function setComfort(g, key, v) {
  const s = g.settings; s[key] = v;
  if (key === 'textPreset') { s.bigText = v === 'large' ? true : v === 'normal' ? false : s.bigText; if (v === 'auto') s.sv5AutoDone = false; applyPrefs(g); }
  g.saveSettings(); return s[key];
}
register('phoneApp', 'sv5_comfort', {
  name: 'Comfort', icon: 'i_gear', order: 91,
  open(game, app) { app.state.sel = 0; },
  update(dt, input, game, app) {
    const st = app.state, { x, y } = app.area, k = input.pressed; keyNav(input, st, CROWS.length, 5);
    const flip = (i) => { const [key, , kind, def] = CROWS[i], cur = game.settings[key] ?? def; setComfort(game, key, kind === 'bool' ? !cur : PRESETS[(PRESETS.indexOf(cur) + 1) % 3]); game.sfx('blip'); };
    if (k.has('enter') || k.has('e') || k.has(' ') || k.has('arrowright')) flip(st.sel);
    if (input.justDown) for (let i = 0; i < CROWS.length; i++) if (inside(input.mx, input.my, x, y + 4 + i * 20, 292, 18)) { st.sel = i; flip(i); }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state;
    CROWS.forEach(([key, label, kind, def], i) => {
      const yy = y + 4 + i * 20, v = game.settings[key] ?? def; rect(g, i === st.sel ? UI.gold : UI.paper2, x, yy, 292, 18); drawText(g, label.toUpperCase(), x + 6, yy + 6, UI.ink, 1, null);
      if (kind === 'bool') { rect(g, v ? UI.mint : UI.paper, x + 240, yy + 3, 46, 12); drawTextC(g, v ? 'ON' : 'OFF', x + 263, yy + 6, UI.ink, 1, null); } else { rect(g, UI.sky, x + 240, yy + 3, 46, 12); drawTextC(g, String(v).toUpperCase(), x + 263, yy + 6, UI.ink, 1, null); }
    });
    ['COZY MODE STOPS ENERGY FROM DROPPING.', 'TEXT SIZE AUTO TURNS ON LARGER TEXT FOR SMALL TOUCH SCREENS.', 'MORE OPTIONS ARE IN SETTINGS.'].forEach((t, i) => drawText(g, t, x + 2, y + 100 + i * 10, UI.dim, 1, null));
  },
});

features('Seasons & Meta', [
  'Challenge Board phone app: five weekly challenges drawn from real stats (fish, cooking, steps, chats, photos and more) that rotate every week, claimed for coins and Star Stickers, with a bonus for clearing the board',
  'Daily Wish: a small goal each day grants a wish star, and seven stars give a reward of Star Stickers, coins and a candle',
  'Sixty new achievements (ach5_) for seasonal stamps, photos, Hoshipedia, tips, challenges, wishes and long-term records, each paying a Star Sticker',
  'Statistics Hall phone app: lifetime stats by category, a Best page of records (most coins, best minigame scores, wish streak) and an All page listing every stat in the game',
  'Comfort phone app: Cozy mode (no energy loss), Tutorial tips toggle, Guide Mochi button toggle and a text size preset',
  'Larger text turns on automatically on narrow touch screens, unless you chose Normal text size',
]);
