// Momo's Bakery (sv4): the storefront on the shotengai (wrapped `objects` getter + spot `bakery`), shop `shop_bakery` (12 baked goods,
// a special of the day, a day-old bag), the baking minigame `sv4_bake` (knead, mix, bake), the bakery job (JOBS.bakery) and the
// friendly rivalry with Mika (three talkHooks and a festival bake-off).
// Condition flag: nc_bakery_open (set from Spring 12). Interaction ids: shop_bakery. Items: snack_bk_* / food_bk_*.
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { drawText, drawTextC } from '../../font.js';
import { CookGame, rect } from '../../minigames/hobbies/games.js';
import { facade, building } from '../town/facade.js';
import { spot, signpost } from '../town/interactions.js';
import { shopOpen, hoursText } from '../economy/core.js';
import { JOBS, startShift } from '../economy/jobs.js';
import { sc, ch, mark, flag, time, mood, giveOr, queueMailSafe } from './util2.js';
import { S, pick } from './data.js';

// ------------------------------------------------------------------ the 12 baked goods
const BK = [
  // id, name, buy, energy, shape, colour, desc, extra
  ['snack_bk_anpan', 'Anpan', 130, 22, 'bread', Rr.wood[2], 'A soft bun filled with sweet red bean paste and a sesame seed on top.', { tags: ['sweet', 'bread', 'baked'] }],
  ['snack_bk_cream_pan', 'Cream bun', 150, 24, 'bread', Rr.butter[3], 'A fluffy bun piped full of vanilla custard.', { tags: ['sweet', 'bread', 'baked'] }],
  ['snack_bk_shokupan', 'Milk bread', 220, 34, 'bread', Rr.paper[3], 'A pillowy loaf of milk bread, still warm in the middle.', { tags: ['bread', 'baked'] }],
  ['snack_bk_cinnamon_roll', 'Cinnamon roll', 180, 26, 'bread', Rr.wood[3], 'A glazed spiral of butter and cinnamon.', { tags: ['sweet', 'bread', 'baked'] }],
  ['snack_bk_choco_cornet', 'Chocolate cornet', 160, 24, 'bread', Rr.woodDark[3], 'A crisp horn of pastry filled with chocolate cream.', { tags: ['sweet', 'bread', 'baked'] }],
  ['snack_bk_croissant', 'Butter croissant', 190, 24, 'bread', Rr.butter[2], 'Flaky, golden and shatteringly buttery.', { tags: ['bread', 'baked'] }],
  ['food_bk_ham_cheese_roll', 'Ham and cheese roll', 210, 30, 'bread', Rr.coral[3], 'A savoury roll with ham and melted cheese. Lunch in one hand.', { tags: ['bread', 'baked'] }],
  ['food_bk_curry_donut', 'Curry donut', 170, 28, 'bread', Rr.wood[2], 'A crispy fried bun with curry inside. Eat it carefully.', { tags: ['bread', 'baked'] }],
  ['snack_bk_sakura_anpan', 'Sakura anpan', 170, 22, 'sweet', Rr.sakura[3], 'A pink spring bun with a salted cherry blossom on top.', { tags: ['sweet', 'bread', 'baked'], seasons: ['spring'] }],
  ['snack_bk_melon_ice', 'Cold melon pan', 200, 26, 'bread', Rr.mint[3], 'A cookie-top melon pan with a scoop of ice cream tucked inside.', { tags: ['sweet', 'bread', 'baked'], seasons: ['summer'] }],
  ['snack_bk_apple_turnover', 'Apple turnover', 190, 26, 'plate', Rr.ribbon[2], 'Flaky pastry stuffed with cinnamon apple.', { tags: ['sweet', 'baked'], seasons: ['autumn'] }],
  ['snack_bk_yuzu_scone', 'Yuzu scone', 180, 24, 'plate', Rr.butter[3], 'A crumbly scone that tastes like winter sunshine.', { tags: ['sweet', 'baked'], seasons: ['winter'] }],
];
export const BK_IDS = BK.map((b) => b[0]);
export const REGULAR = BK_IDS.slice(0, 8);
export const SEASONAL = { spring: 'snack_bk_sakura_anpan', summer: 'snack_bk_melon_ice', autumn: 'snack_bk_apple_turnover', winter: 'snack_bk_yuzu_scone' };
const round5 = (n) => (n < 20 ? Math.max(1, Math.round(n)) : Math.round(n / 5) * 5);
for (const [id, name, buy, energy, shape, c, desc, extra] of BK) {
  register('item', id, { name, cat: 'food', buy, price: round5(buy * 0.45), energy, icon: itemIcon(shape, { c, c2: Rr.butter[3] }), desc, ...extra, tags: ['snack', ...extra.tags] });
}
// Special of the day by weekday (Wednesday the bakery is closed).
export const SPECIALS = ['snack_bk_anpan', 'snack_bk_cream_pan', null, 'snack_bk_croissant', 'food_bk_curry_donut', 'snack_bk_cinnamon_roll', 'snack_bk_shokupan'];
export const specialOf = (g) => SPECIALS[g.weekday] || null;
export const specialPrice = (g, id) => round5(get('item', id).buy * 0.8);

// ------------------------------------------------------------------ the shop
function stock(g) {
  const out = [], sp = specialOf(g);
  for (const id of REGULAR) out.push(id === sp ? { item: id, price: specialPrice(g, id) } : id);
  out.push({ item: SEASONAL[g.season] });
  return out;
}
register('shop', 'shop_bakery', {
  name: "Momo's Bakery", owner: 'momo', hours: ['7:00', '18:30'], closed: [2], when: 'flag:nc_bakery_open', color: Rr.coral[2], buys: [],
  greet: {
    default: ["Welcome to Momo's Bakery! Everything's still warm. Even me!", "Look at that face. Today you want the melon... no, the cream bun. Trust me.", "Take your time, sweetie. The bread isn't going anywhere. Except into your bag."],
    morning: ["Fresh from the oven! The first tray is gone but the second is better."], afternoon: ["Afternoon lull. Perfect time for a bun and a chat."], evening: ["Closing soon. The day-old bag is a bargain!"],
    rain: ["Rain! Come in and drip on my doormat. I have towels. And buns."], h4: ["Misa! My favourite taste tester. The first bite is on the house."],
  },
  stockFn: stock,
  services: [{
    id: 'dayold', name: 'Day-old bag', desc: 'Three leftover buns for a bargain (after 4 PM).', price: 150, icon: 'bread',
    when: (g) => g.minutes >= 16 * 60,
    run(g) { const r = g.rngFor('nc_dayold'); for (let i = 0; i < 3; i++) g.give(pick(r, REGULAR), 1); g.toast('Momo packed three buns for you', 'heart'); },
  }],
});

// ------------------------------------------------------------------ the baking minigame
class BakeGame extends CookGame {
  constructor(rng, o = {}) { super(rng, o); this.title = 'Baking'; }
  draw(g, sprite) {
    super.draw(g, sprite);
    const lab = { chop: 'KNEAD', stir: 'MIX', fry: 'BAKE' }[this.step] || 'BAKED!';
    rect(g, '#2b1d2e', 0, 0, 320, 18); rect(g, Rr.ink[2], 0, 18, 320, 1);
    drawText(g, `${lab}  (${Math.min(this.si + 1, this.steps.length)}/${this.steps.length})`, 8, 7, Rr.butter[3], 1, null);
    drawTextC(g, this.name.toUpperCase(), 250, 7, Rr.paper[4], 1, null);
  }
}
const bakeBot = (m, t, inp) => {
  if (m.step === 'chop' && m.notes.some((q) => q.hit === null && Math.abs(q.at - m.st) < 0.03)) inp.pressed = new Set([' ']);
  if (m.step === 'stir' && m.speed < 0.6) inp.keys = new Set([' ']);
  if (m.step === 'fry' && !m.stopped && m.heat >= 0.66) inp.pressed = new Set([' ']);
  return inp;
};
register('minigame', 'sv4_bake', {
  title: 'Baking with Momo', resultTitle: 'FRESH FROM THE OVEN!', bot: bakeBot,
  make: (g, o) => { const it = get('item', o.recipe) || get('item', 'snack_bk_anpan'); return new BakeGame(g.rng, { name: o.name || it.name, steps: o.steps || ['chop', 'stir', 'fry'], icon: it.icon, colour: Rr.wood[3] }); },
});
register('minigame', 'job_bakery', {
  title: "Momo's Bakery shift", resultTitle: 'SHIFT DONE!', bot: bakeBot,
  make: (g, o) => new BakeGame(g.rng, { name: 'Morning rush', steps: (o.rank || 1) >= 3 ? ['chop', 'stir', 'fry'] : (o.rank || 1) >= 2 ? ['chop', 'fry'] : ['stir', 'fry'], colour: Rr.butter[2] }),
});
JOBS.bakery = {
  name: "Momo's Bakery", role: "Baker's helper", boss: 'momo', bossName: 'Momo', minigame: 'job_bakery', wage: 230, energy: 20, xp: { cooking: 8, charm: 4 },
  after: ['15:30', '18:00'], free: ['8:00', '17:30'], closed: [2], unlock: (g) => !!g.state.flags.nc_bakery_open, unlockText: 'After the bakery opens on Spring 12',
};
register('interaction', 'job_bakery', { label: 'Work a shift (baker\'s helper)', run: (g) => startShift(g, 'bakery') });

// Bake with Momo: choose a recipe, play, take home a batch. Once a day, costs energy and an hour and a half.
export async function bakeWithMomo(game) {
  const b = S(game).bake;
  if (b.day === game.day) return game.run(sc('momo', "momo/happy|The oven's tired out, sweetie. One batch a day. Come back tomorrow!"));
  if (game.energy < 10) return game.run(sc('momo', "momo/sad|You look worn out. Eat a bun first, then we'll bake."));
  let recipe = null;
  const opts = [...REGULAR.slice(0, 4), SEASONAL[game.season]].map((id) => ({ text: get('item', id).name, steps: [{ t: 'call', fn: () => { recipe = id; } }] }));
  await game.run([{ t: 'say', who: 'momo', mood: 'happy', text: "Apron on, hands washed. What are we making?" }, { t: 'choice', prompt: 'Pick a recipe', options: [...opts, { text: 'Not today', steps: [] }] }]);
  if (!recipe) return;
  const r = await game.minigame('sv4_bake', { recipe });
  if (r.quit) return;
  b.day = game.day; b.n++; b.best = Math.max(b.best, r.stars || 1);
  game.useEnergy(10); game.advance(90); game.addXP('cooking', 6 + (r.stars || 1) * 2); game.stat('bakeSessions');
  const n = 1 + (r.stars || 1) + (game.state.flags.nc_momo_dough ? 1 : 0);
  game.give(recipe, n); game.addFriend('momo', 4 + (r.stars || 1) * 3);
  game.bus.emit('bakeDone', { recipe, stars: r.stars, n });
  return game.run(sc('momo', `momo/happy|${r.stars >= 3 ? 'Perfect rise! Look at that crust!' : r.stars >= 2 ? 'Nice work, sweetie. Golden and proud.' : 'A little squashed, but it will taste just as good.'} Take ${n}.`));
}

const bakeryMenu = (game) => game.run([{ t: 'choice', prompt: "Momo's Bakery", options: [
  { text: 'Buy baked goods', steps: [{ t: 'call', fn: () => new Promise((res) => game.open('shop', 'shop_bakery', res)) }] },
  { text: 'Bake with Momo', steps: [{ t: 'call', fn: () => bakeWithMomo(game) }] },
  { text: "Work a shift", steps: [{ t: 'call', fn: () => startShift(game, 'bakery') }] },
  { text: "Today's special", steps: [{ t: 'call', fn: () => { const sp = specialOf(game); return game.run(sc('momo', sp ? `momo/happy|Today's special is the ${get('item', sp).name}, ${specialPrice(game, sp)} coins instead of ${get('item', sp).buy}. Fresh at seven!` : "momo/neutral|We're closed today. I'm at the market.")); } }] },
  { text: 'Leave', steps: [] },
] }]);
register('interaction', 'shop_bakery', {
  label: (g) => (shopOpen(g, get('shop', 'shop_bakery')) ? "Momo's Bakery" : "Momo's Bakery (closed)"),
  run: (g) => {
    const shop = get('shop', 'shop_bakery');
    if (!shopOpen(g, shop)) return g.run([{ t: 'say', who: null, text: `Momo's Bakery is closed right now. Hours: ${hoursText(shop)}.` }]);
    return bakeryMenu(g);
  },
});

// ------------------------------------------------------------------ the storefront on the shotengai
facade('nc_shop_bakery', { w: 5, top: 10, roofH: 16, wallH: 104, roof: 'flat', posts: true, wall: 'plaster', wallRamp: 'butter', door: { x: 66, style: 'glass' },
  windows: [{ x: 10, y: 56, w: 44, h: 32, shop: true }, { x: 108, y: 56, w: 44, h: 32, shop: true }, { x: 66, y: 8, curtain: 'coral' }],
  awnings: [{ x: 6, w: 148, y: 46, a: 'coral', b: 'paper' }], signs: [{ text: 'Momo Bakery', y: 54, ramp: 'coral', light: true, ink: 'coral', inkI: 0 }] });
const shot = get('map', 'shotengai');
if (shot) {
  const d = Object.getOwnPropertyDescriptor(shot, 'objects'), base = d && d.get ? d.get : () => shot.objects;
  const b = building('nc_shop_bakery', 38, 0, { litUntil: 18 * 60 + 30, shop: true, obj: { when: 'flag:nc_bakery_open' } });
  const soon = { ...signpost(38, 3, "Paper covers the window. A sign says: MOMO'S BAKERY, opening Spring 12. Freshly baked everything!"), when: '!flag:nc_bakery_open' };
  Object.defineProperty(shot, 'objects', {
    get: () => [...base().map((o) => (o.spr === 'town_tree_pine_s' && o.x === 41 && o.y === 1 ? { ...o, when: '!flag:nc_bakery_open' } : o)),
      b.obj, spot(40, 4, { use: 'shop_bakery', when: 'flag:nc_bakery_open' }), soon],
    enumerable: true, configurable: true,
  });
  shot.spots.bakery = [40, 5];
}

// ------------------------------------------------------------------ opening day
register('system', 'nc_bakery', {
  init(game) {
    const check = () => {
      if (game.state.flags.nc_bakery_open || game.day < 12) return;
      game.setFlag('nc_bakery_open', true);
      queueMailSafe(game, { id: 'nc_bakery_open', from: 'momo', text: "Momo's Bakery is open on the shotengai! Come for a free bun, and tell your friends. Tell Mika I said hello. Sweetly.", item: 'snack_bk_anpan', coins: 0 });
      game.toast("Momo's Bakery opens on the shotengai!", 'heart');
    };
    game.bus.on('dayStart', check); game.bus.on('gameStart', check); game.bus.on('gameLoaded', check);
  },
});

// ------------------------------------------------------------------ rivalry with Mika
const R = (g) => S(g).rival;
const winFlag = (k) => ({ t: 'call', fn: (g) => { g.setFlag(k, true); } });
register('talkHook', 'nc_rival_1', { npc: 'mika', priority: 40, when: ['flag:nc_bakery_open', '!flag:nc_rival_1', 'dayn>=14', 'friend:mika>=1'],
  steps: () => sc('mika', mark('nc_rival_1'), '@Mika is polishing the same cup for the third time. She does not look up.',
    "sad|Have you been to the new bakery? ...I'm not asking. I'm just wondering. Casually.",
    "Her cream buns cost less than my scones. A lot less. And they're warm. Who makes a warm bun at seven in the morning? It's unfair.",
    ch('What do you say?',
      ["Your scones are special in their own way", "happy|...They are. They're slow-baked. They have a story. I should put that on the menu. Thank you, Misa.", 20, { t: 'call', fn: (g) => { R(g).wins++; g.setFlag('nc_rival_mika_ok'); } }],
      ["Momo is really nice, you know", "surprised|Nice? She waved at me! In the shotengai! With a spatula! It was a threat. Or a compliment. I can't tell.", 10, { t: 'call', fn: (g) => g.addFriend('momo', 5) }],
      ["Let's get a bun and compare", "@You buy a cream bun and a scone. Mika tastes the bun, frowns, then tastes it again.", "sad|...It's good. It's very good. I hate it.", 15])),
});
register('talkHook', 'nc_rival_2', { npc: 'mika', priority: 40, when: ['flag:nc_rival_1', '!flag:nc_rival_2', 'dayn>=30', 'friend:mika>=2'],
  steps: () => sc('mika', mark('nc_rival_2'), '@A hand-painted sign leans against the cafe window: FRESH SCONES, 100% ARTISANAL. Under it, in a different hand: FRESH BUNS NEXT DOOR (ALMOST).',
    "happy|Momo came in this morning and left a note. She wants to settle it with a bake-off. At the festival. Judged by you.",
    "surprised|Me? I'm not a judge! I just like food!",
    "That's what makes you the best judge. You like everything. Within reason.",
    ch('Do you accept?',
      ["I'll be fair, I promise", "happy|Fair is all I ask. And honest. And maybe a little bribe. A cookie, perhaps.", 20, winFlag('nc_rival_bakeoff')],
      ["Only if you both make a joint bun", "surprised|A joint... bun? With Momo? ...I'll think about it. For a long time.", 25, winFlag('nc_rival_joint')],
      ["Sorry, I'd rather stay out of it", "sad|Hm. Wise. Cowardly. But wise.", 5])),
});
register('talkHook', 'nc_rival_3', { npc: 'mika', priority: 40, when: ['flag:nc_rival_2', '!flag:nc_rival_3', 'dayn>=50', 'friend:mika>=3', 'friend:momo>=2'],
  steps: () => sc('mika', mark('nc_rival_3'), '@Cafe Kumo is quieter than usual. Mika has laid out a tray of tiny scones and a flask of tea. A note beside it reads: for the competition.',
    "happy|Momo came by. Not to fight. To bring a bag of day-old buns. She said I looked tired.",
    "sad|I was rude, wasn't I? I thought I had to be. Customers pick sides, I thought. But they just pick snacks.",
    ch('What do you suggest?',
      ["Sell a bun and scone set together", "happy|A set! 'Buns and Scones: The Shotengai Combo.' Misa, that might actually work. I'll ask Momo.", 30, { t: 'call', fn: (g) => { g.setFlag('nc_rival_combo'); g.addFriend('momo', 20); } }],
      ["Visit her bakery on a quiet afternoon", "happy|Visit. In person. Without a scone as a weapon. ...Okay. I'll bring jam.", 25, { t: 'call', fn: (g) => g.setFlag('nc_rival_visit') }],
      ["Keep the rivalry. It's fun", "happy|It is fun, isn't it? She makes me work harder. I'd never tell her that. Not in a hundred years.", 20, { t: 'call', fn: (g) => g.setFlag('nc_rival_fun') }]),
    'happy|Thanks. For listening. And for judging fairly, whatever happens next.'),
});

// Festival bake-off: after nc_rival_bakeoff, speak to Momo to enter the contest (a bake against Mika's score).
register('talkHook', 'nc_rival_final', { npc: 'momo', priority: 40, when: ['flag:nc_rival_bakeoff', '!flag:nc_rival_final', 'dayn>=34'],
  steps: () => sc('momo', mark('nc_rival_final'),
    "happy|Misa! The big day! Here's the deal: Mika and I each bake, you taste, you decide. But! You also bake. The third entry. 'The Dark Horse'.",
    "surprised|Me? Against both of you?",
    "That's the fun! Apron. Hands. Go!",
    { t: 'call', fn: async (g) => {
      const r = await g.minigame('sv4_bake', { recipe: 'snack_bk_cream_pan', name: 'Dark Horse' });
      const rv = R(g), s = r && !r.quit ? r.score : 0.3, mika = 0.62;
      rv.round++;
      if (s > mika + 0.1) { rv.wins++; g.setFlag('nc_rival_win'); } else if (s < mika - 0.1) { rv.losses++; g.setFlag('nc_rival_lose'); } else g.setFlag('nc_rival_tie');
      g.addXP('cooking', 10); g.stat('bakeOffs');
      await g.run(sc('momo', s > mika + 0.1 ? "momo/surprised|The Dark Horse wins! A crust like that! Mika, shake the girl's hand." : s < mika - 0.1 ? "momo/happy|Mika takes the cup this year! And I'm only mildly devastated." : "momo/happy|A TIE! Three-way! Nobody has to wear the silly hat!"));
      g.give('snack_bk_cream_pan', 2); g.addFriend('momo', 15); g.addFriend('mika', 15);
    } },
    'happy|Whatever the verdict, the best part was the baking. And the eating. Mostly the eating.'),
});

features('New Cast', [
  "Momo's Bakery opens on the shotengai on Spring 12: a new shopfront with a pink awning replaces the pine tree, with a notice sign before opening day",
  "Momo's Bakery sells eight everyday baked goods (anpan, cream bun, milk bread, cinnamon roll, chocolate cornet, croissant, ham and cheese roll, curry donut)",
  'Four seasonal bakes at the bakery: sakura anpan, cold melon pan, apple turnover and yuzu scone',
  'A special of the day at the bakery: a different bun is 20% off every weekday (closed Wednesdays)',
  'The day-old bag: after 4 PM the bakery sells three leftover buns for 150 coins',
  'Bake with Momo: pick a recipe and play the knead, mix and bake minigame, then take home a batch (once a day)',
  "Bakery shift: work as Momo's baker's helper from the Jobs app, with ranks and tips like the other jobs",
  'Mika rivalry, round one: a grumpy chat at Cafe Kumo about the new bakery with three ways to cool her down',
  'Mika rivalry, round two: matching shop signs and a challenge to judge a bake-off',
  'Mika rivalry, round three: Mika and Momo find peace, with a bun and scone combo or a friendly rematch',
  'The festival bake-off: bake the Dark Horse bun against Mika and Momo and win, lose or tie the cup',
]);
