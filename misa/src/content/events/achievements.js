// Achievements (DESIGN 5.3.27): 60 badges with a condition in the condition format, checked on stat, achievement,
// questDone, heartUp, collectNew and dayStart events; each awards a Star Sticker, and some grant a title.
//   register('achievement', id, { name, desc, icon, cond, hidden?, title? })
// Extra condition kinds: friends:N>=K (residents at N+ hearts), metcount>=K, achcount>=K, pct:<collection>>=P (percent of a
// registry kind collected: fish, bug, recipe, shell, mineral), festivalsYear>=K.
import { register, get, all, R, features } from '../../core/registry.js';
import { addCondKind, check } from '../../core/cond.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { drawText, drawTextC, wrap } from '../../font.js';
import { UI, rect, panel } from '../../ui/ui.js';

const residents = () => all('npc').filter((n) => !n.hidden && !['daifuku', 'kuro'].includes(n.id));
addCondKind('friends', (g, a) => residents().filter((n) => g.hearts(n.id) >= Number(a || 1)).length);
addCondKind('metcount', (g) => residents().filter((n) => g.state.seen['met:' + n.id]).length);
addCondKind('achcount', (g) => Object.keys(g.state.achievements).length);
const KIND_OF = { fish: 'fish', bug: 'item:bug', recipe: 'recipe', shell: 'item:shell', mineral: 'item:mineral' };
addCondKind('pct', (g, a) => {
  const got = Object.keys((g.state.collections || {})[a] || {}).length;
  const k = KIND_OF[a] || a;
  const total = k.startsWith('item:') ? all('item').filter((i) => i.cat === k.slice(5)).length : Object.keys(R[k] || {}).length;
  return total ? Math.floor((got / total) * 100) : 0;
});

const A = (name, desc, cond, icon = 'i_trophy', extra = {}) => ({ name, desc, cond, icon, ...extra });
const ACH = {
  // story (9)
  story_0: A('Boxes and buttons', 'Move into Grandma\'s little house.', 'flag:chapter_0_done', 'i_quest'),
  story_1: A('New girl in 2-B', 'Finish chapter 1.', 'flag:chapter_1_done', 'i_quest'),
  story_2: A('The paper star', 'Finish chapter 2.', 'flag:chapter_2_done', 'i_quest'),
  story_3: A('Grandma\'s attic', 'Finish chapter 3.', 'flag:chapter_3_done', 'i_quest'),
  story_4: A('Tick, tock', 'Finish chapter 4.', 'flag:chapter_4_done', 'i_quest'),
  story_5: A('Low tide', 'Finish chapter 5.', 'flag:chapter_5_done', 'i_quest'),
  story_6: A('Stars after school', 'Finish chapter 6.', 'flag:chapter_6_done', 'i_quest'),
  story_7: A('What the shrine remembers', 'Finish chapter 7.', 'flag:chapter_7_done', 'i_quest'),
  story_8: A('Lantern keeper', 'Relight the Star Lantern.', 'flag:chapter_8_done', 'i_star', { title: 'Lantern Keeper' }),
  // friendship (6)
  first_friend: A('First friend', 'Reach 2 hearts with anyone.', 'friends:2>=1', 'heart'),
  good_friends: A('The gang', 'Reach 4 hearts with 5 people.', 'friends:4>=5', 'heart'),
  best_friend: A('Best friend', 'Reach 10 hearts with someone.', 'friends:10>=1', 'heart', { title: 'Best Friend' }),
  met_ten: A('Friendly face', 'Meet 10 people in Hoshimori.', 'metcount>=10', 'i_chat'),
  met_all: A('Everyone knows Misa', 'Meet every resident of Hoshimori.', 'metcount>=17', 'i_chat', { title: 'Town Sweetheart' }),
  chatterbox: A('Chatterbox', 'Have 100 chats.', 'stat:talks>=100', 'i_chat'),
  generous: A('Generous heart', 'Give 30 gifts.', 'stat:gifts>=30', 'heart'),
  // collections (10)
  fish_25: A('Angler', 'Catch 25% of the fish species.', 'pct:fish>=25', 'i_fishicon'),
  fish_50: A('Master angler', 'Catch half of the fish species.', 'pct:fish>=50', 'i_fishicon'),
  fish_100: A('Every fish in the sea', 'Catch every fish species.', 'pct:fish>=100', 'i_fishicon', { title: 'Sea Whisperer' }),
  bug_25: A('Bug spotter', 'Catch 25% of the bug species.', 'pct:bug>=25', 'i_leaf'),
  bug_50: A('Bug expert', 'Catch half of the bug species.', 'pct:bug>=50', 'i_leaf'),
  bug_100: A('Hina\'s hero', 'Catch every bug species.', 'pct:bug>=100', 'i_leaf'),
  recipe_25: A('Home cook', 'Learn 25% of the recipes.', 'pct:recipe>=25', 'i_energy'),
  recipe_100: A('Chef Aoki', 'Learn every recipe.', 'pct:recipe>=100', 'i_energy', { title: 'Chef Aoki' }),
  shell_50: A('Beachcomber', 'Find half of the shells.', 'pct:shell>=50', 'i_star'),
  mineral_50: A('Rock hound', 'Find half of the minerals and fossils.', 'pct:mineral>=50', 'i_star'),
  // hobbies (10)
  fish_1: A('First bite', 'Catch your first fish.', 'stat:fishCaught>=1', 'i_fishicon'),
  fish_50c: A('Fifty fish', 'Catch 50 fish.', 'stat:fishCaught>=50', 'i_fishicon'),
  bug_1: A('Little crawler', 'Catch your first bug.', 'stat:bugsCaught>=1', 'i_leaf'),
  cook_1: A('First dish', 'Cook your first dish.', 'stat:cooked>=1', 'i_energy'),
  cook_50: A('Kitchen regular', 'Cook 50 dishes.', 'stat:cooked>=50', 'i_energy'),
  harvest_1: A('Green thumb', 'Harvest your first crop.', 'stat:harvested>=1', 'i_leaf'),
  harvest_100: A('Bumper crop', 'Harvest 100 crops.', 'stat:harvested>=100', 'i_leaf', { title: 'Goro\'s Rival' }),
  craft_10: A('Handy', 'Craft 10 things.', 'stat:crafted>=10', 'i_gear'),
  donate_10: A('Museum friend', 'Donate 10 things to the museum.', 'stat:donated>=10', 'i_book'),
  stargazer: A('Stargazer', 'Find 5 constellations.', 'stat:constellations>=5', 'i_star'),
  // school, work and money (7)
  class_10: A('Present!', 'Attend 10 classes.', 'stat:classesAttended>=10', 'i_school'),
  class_100: A('Model student', 'Attend 100 classes.', 'stat:classesAttended>=100', 'i_school'),
  job_10: A('Hard worker', 'Work 10 shifts.', 'stat:jobShifts>=10', 'i_coin'),
  shop_25: A('Regular customer', 'Buy from the shops 25 times.', 'stat:shopBuys>=25', 'i_bag'),
  earn_10k: A('Piggy bank', 'Earn 10,000 coins in total.', 'stat:coinsEarned>=10000', 'i_coin'),
  earn_100k: A('Hoshimori tycoon', 'Earn 100,000 coins in total.', 'stat:coinsEarned>=100000', 'i_coin', { title: 'Tycoon' }),
  rich: A('Savings goal', 'Have 5,000 coins at once.', 'money>=5000', 'i_coin'),
  // home and Mochi (6)
  tasks_25: A('Tidy home', 'Finish 25 home tasks.', 'stat:homeTasks>=25', 'i_check'),
  perfect_10: A('Spotless week and a half', 'Finish every home task on 10 days.', 'stat:perfectHomeDays>=10', 'i_check'),
  pets_100: A('Cat whisperer', 'Pet Mochi 100 times.', 'stat:mochiPets>=100', 'heart', { title: 'Cat Whisperer' }),
  mochi_gifts: A('Treasure hoarder', 'Receive 10 presents from Mochi.', 'stat:mochiGifts>=10', 'heart'),
  plates_10: A('Mochi broke 10 plates', 'Silly: Mochi knocked 10 plates off the counter.', 'stat:platesKnocked>=10', 'i_anger', { hidden: true }),
  walker: A('Explorer', 'Walk 20,000 steps.', 'stat:steps>=20000', 'i_map'),
  // festivals and events (10)
  fest_1: A('Festival goer', 'Attend your first festival.', 'stat:festivalsAttended>=1', 'i_cal'),
  fest_10: A('Festival fan', 'Attend 10 festivals.', 'stat:festivalsAttended>=10', 'i_cal', { title: 'Festival Fan' }),
  fest_all: A('Year of festivals', 'Attend 20 festivals.', 'stat:festivalsAttended>=20', 'i_cal'),
  goldfish: A('Goldfish master', 'Scoop 10 goldfish at the festivals.', 'stat:goldfishCaught>=10', 'i_fishicon'),
  golden_fish: A('The golden one', 'Scoop a golden goldfish.', 'stat:goldenGoldfish>=1', 'i_star', { hidden: true }),
  lanterns: A('Perfect lanterns', 'Release all six lanterns perfectly.', 'stat:perfectLanterns>=1', 'i_star'),
  oni: A('Oni out!', 'Chase 30 oni out with beans.', 'stat:oniChased>=30', 'i_anger'),
  wishes: A('Wishful thinker', 'Make 10 wishes on stars and strips.', 'stat:wishesMade>=10', 'i_star', { hidden: true }),
  rainbow: A('Somewhere over it', 'See a rainbow after the rain.', 'stat:rainbowsSeen>=1', 'i_sun', { hidden: true }),
  kindness: A('Small kindnesses', 'Do 5 kind deeds for strangers and neighbours.', 'stat:kindDeeds>=5', 'heart'),
  // life (3)
  calls_10: A('Calling home', 'Have 10 video calls with Mum and Dad.', 'stat:familyCalls>=10', 'i_phone'),
  year_1: A('One whole year', 'Live in Hoshimori for a whole year.', 'dayn>=113', 'i_cal'),
  collector: A('Badge collector', 'Earn 30 achievements.', 'achcount>=30', 'i_trophy', { title: 'Completionist' }),
};
for (const [id, def] of Object.entries(ACH)) register('achievement', id, def);

function checkAll(game) {
  if (game._achBusy) return;
  game._achBusy = true;
  try {
    for (const a of all('achievement')) {
      if (game.state.achievements[a.id] || !a.cond) continue;
      let ok = false;
      try { ok = check(a.cond, game); } catch { ok = false; }
      if (ok) {
        game.achieve(a.id);
        if (get('item', 'star_sticker')) game.give('star_sticker', 1, true);
        if (a.title) { (game.state.titles ||= []).includes(a.title) || game.state.titles.push(a.title); game.state.title ||= a.title; }
      }
    }
  } finally { game._achBusy = false; }
}

register('system', 'achievements', {
  init(game) {
    let pending = false;
    const soon = () => { if (pending) return; pending = true; Promise.resolve().then(() => { pending = false; checkAll(game); }); };
    for (const e of ['stat', 'achievement', 'questDone', 'heartUp', 'collectNew', 'dayStart', 'meet', 'moneyChanged', 'gameLoaded']) game.bus.on(e, soon);
    // stats other areas don't count themselves
    game.bus.on('dayStart', () => game.stat('daysPlayed'));
    game.bus.on('moneyChanged', ({ delta }) => { if (delta > 0) game.stat('coinsEarned', delta); });
    game.bus.on('shopBuy', ({ cost }) => { game.stat('shopBuys'); if (cost) game.stat('coinsSpent', cost); });
    game.bus.on('meet', () => game.stat('peopleMet'));
    game.bus.on('weatherChanged', () => {});
    game.checkAchievements = () => checkAll(game);
  },
});

// Badges app: earned / locked achievements (hidden ones show as ???), a stats page and titles.
const STATS = [['Days played', 'daysPlayed'], ['Steps walked', 'steps'], ['Chats', 'talks'], ['Gifts given', 'gifts'], ['Fish caught', 'fishCaught'], ['Bugs caught', 'bugsCaught'], ['Dishes cooked', 'cooked'], ['Crops harvested', 'harvested'], ['Home tasks', 'homeTasks'], ['Mochi petted', 'mochiPets'], ['Festivals', 'festivalsAttended'], ['Coins earned', 'coinsEarned'], ['Video calls', 'familyCalls'], ['Letters read', 'lettersRead']];
register('phoneApp', 'badges', {
  name: 'Badges', icon: 'i_trophy', order: 60,
  badge: (game) => { const n = Object.values(game.state.achievements).filter((d) => d === game.day).length; return n || 0; },
  open(game, app) { app.state.sel ??= 0; app.state.tab ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, list = all('achievement'), cols = 10;
    if (k.has('c') || (input.justDown && input.my < app.area.y + 12)) { st.tab = 1 - st.tab; return; }
    if (k.has('arrowright') || k.has('d')) st.sel = Math.min(list.length - 1, st.sel + 1);
    if (k.has('arrowleft') || k.has('a')) st.sel = Math.max(0, st.sel - 1);
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(list.length - 1, st.sel + cols);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - cols);
    if (input.justDown || input.moved) { const gx = Math.floor((input.mx - app.area.x - 2) / 18), gy = Math.floor((input.my - app.area.y - 16) / 18), j = gy * cols + gx; if (gx >= 0 && gx < cols && gy >= 0 && j < list.length) st.sel = j; }
  },
  draw(g, game, app) {
    const { x, y } = app.area, st = app.state, list = all('achievement'), got = game.state.achievements, cols = 10;
    const n = list.filter((a) => got[a.id]).length;
    rect(g, UI.accent, x, y, 180, 11); drawTextC(g, st.tab ? 'STATS (C: BADGES)' : `BADGES ${n}/${list.length} (C: STATS)`, x + 90, y + 3, UI.text, 1, null);
    if (st.tab) {
      STATS.forEach(([label, key], i) => { const yy = y + 16 + i * 10; drawText(g, label, x + 4, yy, UI.ink, 1, null); const v = String(game.state.stats[key] || 0); drawText(g, v, x + 176 - v.length * 4, yy, UI.accent2, 1, null); });
      panel(g, x + 186, y, 106, 170, 'paper'); drawText(g, 'TITLES', x + 192, y + 6, UI.accent2, 1, null);
      const titles = game.state.titles || [];
      if (!titles.length) drawText(g, 'Earn badges to', x + 192, y + 18, UI.dim, 1, null), drawText(g, 'unlock titles', x + 192, y + 27, UI.dim, 1, null);
      titles.slice(0, 14).forEach((t, i) => drawText(g, (t === game.state.title ? '* ' : '  ') + t, x + 190, y + 18 + i * 9, UI.ink, 1, null));
      return;
    }
    list.forEach((a, i) => {
      const gx = x + 2 + (i % cols) * 18, gy = y + 16 + Math.floor(i / cols) * 18, on = !!got[a.id];
      rect(g, i === st.sel ? UI.gold : on ? UI.mint : UI.paper2, gx, gy, 16, 16);
      if (on && SPRITES[a.icon]) { const s = SPRITES[a.icon]; g.drawImage(sprite(a.icon), gx + 8 - Math.round(s.w / 2), gy + 8 - Math.round(s.h / 2)); }
      else drawTextC(g, '?', gx + 8, gy + 6, UI.dim, 1, null);
    });
    const a = list[st.sel];
    if (!a) return;
    const on = !!got[a.id], secret = a.hidden && !on;
    panel(g, x + 184, y + 14, 108, 156, 'paper');
    wrap(secret ? '???' : a.name, 25).slice(0, 2).forEach((l, i) => drawText(g, l, x + 190, y + 20 + i * 8, UI.accent2, 1, null));
    wrap(secret ? 'A secret badge. Keep living your little life!' : a.desc, 25).slice(0, 6).forEach((l, i) => drawText(g, l, x + 190, y + 40 + i * 8, UI.ink, 1, null));
    drawText(g, on ? `EARNED ON DAY ${got[a.id]}` : 'NOT YET', x + 190, y + 100, on ? UI.good : UI.dim, 1, null);
    if (a.title && !secret) drawText(g, `TITLE: ${a.title}`, x + 190, y + 112, UI.accent, 1, null);
    drawText(g, 'REWARD: 1 STAR STICKER', x + 190, y + 124, UI.dim, 1, null);
  },
});

features('Achievements', [
  '60 achievements for story, friendship, collections, hobbies, school, work, home, Mochi and festivals',
  'Every achievement awards a Star Sticker, with a toast and a sound',
  'Titles unlocked by special achievements (Lantern Keeper, Cat Whisperer, Festival Fan...)',
  'Collection achievements at 25, 50 and 100% for fish, bugs and recipes, plus shells and minerals',
  'Hidden achievements show as ??? until you earn them',
  'Badges app: a grid of every achievement with descriptions and the day you earned it',
  'Stats page: days played, steps walked, fish caught, Mochi petted, festivals attended and more',
]);
