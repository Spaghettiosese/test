// Community Hall story and systems: the intro, Elder Moss, room restoration scenes, the festival ceremony, the room
// perks (bus rebate, mill, loom, spirit gate, heart tree, vault tips), the daily murmur, talk hooks and achievements.
import { register, get } from '../../core/registry.js';
import { BUS_FARE } from '../town/interactions.js';
import { ROOMS, ROOM_ORDER, BUNDLES, S, slotName, totalProgress, roomProgress, roomDone, cheatBundle, pickMurmur, murmurText, whereHint, missingItems, isDone, bundlesOf } from './data.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const pickBy = (g, tag, arr) => arr[Math.floor(g.rngFor(tag)() * arr.length) % arr.length];

// ---------------------------------------------------------------- scripts
register('script', 'ch_intro', { steps: () => [
  say(null, 'neutral', 'Dust drifts through a shaft of grey light. The old Community Hall smells of cedar and sleep.'),
  { t: 'sfx', name: 'blip' },
  say(null, 'surprised', 'Something small and pale peeks around a sheet-covered chair. Then another. Then six more.'),
  say(null, 'happy', 'Elder Moss: Oh! A visitor! It has been twenty winters since anyone walked in. We are the hall sprites.'),
  say('misa', 'surprised', 'Whoa. You are real! You look like tiny leaf ghosts!'),
  say(null, 'happy', 'Elder Moss: Kodama, thank you. The hall fell asleep when the town forgot it. Each room wakes when we are given the things it loves.'),
  say(null, 'neutral', 'Elder Moss: Look for the bundle boards. Hand over what they ask for and we will do the rest. Your phone will keep our list.'),
  { t: 'call', fn: (g) => { g.toast('New phone app: Hall', 'ch_i_hall'); S(g).murmur = pickMurmur(g); } },
] });

register('script', 'ch_elder', { steps: (g) => [
  say(null, 'happy', 'Elder Moss: Hello, hello! What shall we talk about?'),
  { t: 'choice', prompt: 'Elder Moss', options: [
    { text: 'What does the hall need?', steps: [{ t: 'call', fn: (gm) => { const m = S(gm).murmur || pickMurmur(gm); S(gm).murmur = m; return gm.say(null, 'happy', 'Elder Moss: ' + murmurText(m)); } }] },
    { text: 'How are we doing?', steps: [{ t: 'call', fn: (gm) => { const p = totalProgress(gm), r = ROOM_ORDER.filter((x) => roomDone(gm, x)).length; return gm.say(null, 'happy', `Elder Moss: ${p.done} of ${p.total} bundles are done, and ${r} of 6 rooms are awake. ${r === 6 ? 'Every room sings!' : 'Keep going!'}`); } }] },
    { text: 'Tell me about the sprites', when: 'flag:hall_intro', steps: [{ t: 'call', fn: (gm) => gm.say(null, 'neutral', pickBy(gm, 'ch_lore', [
      'Elder Moss: We live where people gather. A kitchen, a shrine, a hall. The more laughter, the greener our hats.',
      'Elder Moss: Long ago the town built this hall for harvest suppers. We kept the lanterns. Then the suppers stopped.',
      'Elder Moss: Kiko at the shrine knows our cousins. We are very small, very old and extremely fond of sweets.',
    ])) }] },
    { text: 'Just saying hi', steps: [say(null, 'happy', 'Elder Moss: Hello! Hello! We love hellos.')] },
  ] },
] });

register('script', 'ch_sprite_chat', { steps: (g) => [{ t: 'call', fn: (gm) => gm.say(null, 'happy', pickBy(gm, 'ch_chat' + gm.minutes, [
  'Sprite: Shh. I am practising being very quiet. Is it working?',
  'Sprite: The dust is gone from my corner! Look, look!',
  'Sprite: Do you have anything shiny? Asking for a friend. The friend is me.',
  'Sprite: Elder Moss says you are kind. I say you smell like soup.',
  'Sprite: We sing when the lanterns are lit. Tonight is a good night to listen.',
  'Sprite: I found a button! It is mine now. Please do not tell the others.',
])) }] });

// Short scene after a room is restored (run when the board closes).
const ROOM_SCENE = {
  fish: 'The great tank shivers, fills with clear water and flicks with silver. Fish drift through it like slow fireworks.',
  pantry: 'Jars fill the shelves one by one. The stove coughs, glows, and the whole room smells of toast and warm honey.',
  craft: 'The dust sheet slides off the loom as if a ghost had pulled it. Threads of every colour start to tremble.',
  garden: 'Green shoots race up the trellis. The planters burst into blossom, and a pond opens its eyes in the corner.',
  night: 'The ceiling goes dark and then fills with stars. The little telescope swings toward a window that was not there.',
  vault: 'The great door of the vault swings open with a mellow gong. Gold light spills across the floor.',
};
register('script', 'ch_room_scene', { steps: (g, ctx) => {
  const room = (ctx && ctx.room) || 'fish';
  return [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'wait', dur: 0.3 }, { t: 'sfx', name: 'hall_jingle' }, { t: 'fade', to: 0, dur: 0.7 },
    say(null, 'surprised', ROOM_SCENE[room]), say(null, 'happy', `Elder Moss: The ${ROOMS[room].name} is awake! ${ROOMS[room].perk}.`)];
} });
export const roomScene = (room) => get('script', 'ch_room_scene').steps(null, { room });

register('script', 'ch_ceremony', { steps: () => [
  { t: 'fade', to: 1, dur: 0.8 }, { t: 'scene', name: 'ch_festival' }, { t: 'sfx', name: 'hall_fanfare' }, { t: 'wait', dur: 0.5 }, { t: 'fade', to: 0, dur: 0.8 },
  say(null, 'happy', 'Elder Moss: Everyone! The last lantern is lit! Come in, come in!'),
  say('mika', 'happy', 'I brought three trays of honey toast. The sprites were already sitting on the first tray.'),
  say('kai', 'happy', 'I carried the benches. Did you see the benches? Misa, I carried a lot of benches.'),
  say('suzu', 'happy', 'I wrote a poem for the opening. It is four lines long. Two of them rhyme. Accept this.'),
  say('hana', 'happy', 'Misa, dear. I held a harvest supper in this very hall when I was your age. It looks just as I remember.'),
  say('goro', 'happy', 'The planters are first-rate. Even Daifuku gave them a respectful sniff.'),
  say('kiko', 'happy', 'The kami of the shrine send greetings. They say the sprites are very rude and very good company.'),
  say(null, 'happy', 'The sprites climb onto shoulders and tables. A lantern string swings. Somewhere a tiny drum begins.'),
  { t: 'choice', prompt: 'The sprites want a wish from you.', options: [
    { text: 'Wish for the town to stay together', steps: [say('misa', 'happy', 'I wish Hoshimori always has a place to gather. And snacks.'), { t: 'friend', npc: 'hana', n: 20 }, { t: 'friend', npc: 'goro', n: 20 }] },
    { text: 'Wish for a good year', steps: [say('misa', 'happy', 'A good year for everyone. A great one for Mochi.'), { t: 'friend', npc: 'mika', n: 20 }, { t: 'friend', npc: 'kai', n: 20 }] },
    { text: 'Wish for stars', steps: [say('misa', 'happy', 'More stars. Every night. Forever.'), { t: 'friend', npc: 'suzu', n: 20 }, { t: 'friend', npc: 'kiko', n: 20 }] },
  ] },
  { t: 'sfx', name: 'hall_jingle' }, { t: 'wait', dur: 0.6 },
  say(null, 'happy', 'Fireworks stitch the sky in gold and pink. Every sprite in the hall is dancing, hats tilted.'),
  say('misa', 'happy', 'We did it. The whole hall. Together.'),
  say(null, 'happy', 'Elder Moss: Hoshimori Community Hall is open to all. The sprites will keep the lanterns lit as long as someone comes to say hello.'),
  { t: 'fade', to: 1, dur: 0.8 }, { t: 'scene', name: '' }, { t: 'wait', dur: 0.3 }, { t: 'fade', to: 0, dur: 0.8 },
  { t: 'call', fn: (g) => { g.toast('Community Hall restored!', 'i_star'); g.addMood(10); } },
] });

// ---------------------------------------------------------------- interactions (room perks)
const need = (g, id, n) => g.has(id, n);
const craft = (g, label, takes, gives, xp, minutes) => {
  if (!Object.entries(takes).every(([id, n]) => need(g, id, n))) return g.say('misa', 'neutral', `I need ${Object.entries(takes).map(([id, n]) => `${n} ${slotName(id)}`).join(' and ')} for that.`);
  for (const [id, n] of Object.entries(takes)) g.take(id, n);
  for (const [id, n] of Object.entries(gives)) g.give(id, n);
  if (xp && get('skill', 'crafting')) g.addXP('crafting', xp);
  g.advance(minutes); g.sfx('page'); return null;
};
register('interaction', 'ch_mill', {
  label: 'Hall mill',
  run: (g) => g.run([{ t: 'choice', prompt: 'Grind what? (30 minutes)', options: [
    { text: 'Rice into mochiko (2 rice)', steps: [{ t: 'call', fn: (gm) => { const r = craft(gm, 'mill', { ing_rice: 2 }, { ing_mochiko: 2 }, 2, 30); gm.stat('millUses'); S(gm).millUses++; return r; } }] },
    { text: 'Corn into flour (2 corn)', steps: [{ t: 'call', fn: (gm) => { const r = craft(gm, 'mill', { ing_corn: 2 }, { ing_flour: 3 }, 2, 30); gm.stat('millUses'); S(gm).millUses++; return r; } }] },
    { text: 'Just watch the stone turn', steps: [say('misa', 'happy', 'Round and round. The sprites push it with their whole bodies.')] },
  ] }]),
});
register('interaction', 'ch_loom', {
  label: (g) => (g.flag('upg_hall_loom') ? 'Hall loom' : 'Covered loom'),
  run: (g) => {
    if (!g.flag('upg_hall_loom')) return g.say('misa', 'neutral', 'A big loom under a dust sheet. The Craft Room wants bundles before it wakes up.');
    return g.run([{ t: 'choice', prompt: 'Weave what? (45 minutes)', options: [
      { text: 'Cloth (2 yarn)', steps: [{ t: 'call', fn: (gm) => { const r = craft(gm, 'loom', { mat_yarn: 2 }, { mat_cloth: 1 }, 3, 45); gm.stat('loomUses'); S(gm).loomUses++; return r; } }] },
      { text: 'Felt (2 cloth)', steps: [{ t: 'call', fn: (gm) => { const r = craft(gm, 'loom', { mat_cloth: 2 }, { mat_felt: 2 }, 3, 45); gm.stat('loomUses'); S(gm).loomUses++; return r; } }] },
      { text: 'Rainbow wool (6 yarn, 2 beads)', steps: [{ t: 'call', fn: (gm) => { const r = craft(gm, 'loom', { mat_yarn: 6, mat_beads: 2 }, { mat_rainbow_wool: 1 }, 6, 60); gm.stat('loomUses'); S(gm).loomUses++; return r; } }] },
      { text: 'Never mind', steps: [] },
    ] }]);
  },
});
const GATE = [['shrine', 'Hoshi Hill Shrine'], ['beach', 'Shell Beach'], ['park', 'Sakura Park']];
register('interaction', 'ch_gate', {
  label: (g) => (g.flag('upg_hall_path') ? 'Spirit gate' : 'Dark gate'),
  run: (g) => {
    if (!g.flag('upg_hall_path')) return g.say('misa', 'neutral', 'A stone gate with nothing behind it but darkness. The Night Sky Room might wake it.');
    const dest = GATE.filter(([id]) => get('map', id) && get('map', id).spawns && get('map', id).spawns.default);
    return g.run([{ t: 'choice', prompt: 'The gate hums. Where to?', options: [
      ...dest.map(([id, name]) => ({ text: name, steps: [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'call', fn: (gm) => { const sp = get('map', id).spawns.default; S(gm).pathUses++; gm.stat('gateTrips'); gm.advance(5); return gm.warp(id, sp[0], sp[1], sp[2] || 'down'); } }, { t: 'fade', to: 0, dur: 0.4 }] })),
      { text: 'Stay here', steps: [] },
    ] }]);
  },
});
register('interaction', 'ch_heart_tree', {
  label: (g) => (g.flag('community_restored') ? 'Heart tree' : 'Withered tree'),
  run: (g) => {
    const st = S(g);
    if (!g.flag('community_restored')) { const p = totalProgress(g); return g.say('misa', 'neutral', `A grey, bare tree with a faded rope around it. The sprites say it will bloom when the whole hall wakes (${p.done}/${p.total} bundles).`); }
    if (st.blessDay === g.day) return g.say('misa', 'happy', 'Petals drift down. I already got my blessing today, but it is lovely to stand here.');
    st.blessDay = g.day; g.addEnergy(25); g.addMood(10); g.stat('treeBlessings'); g.sfx('heart');
    return g.say('misa', 'happy', 'The heart tree rains soft petals over me. I feel warm all the way to my toes.');
  },
});

// ---------------------------------------------------------------- systems
register('system', 'ch_hall', { init(game) {
  const newDay = () => {
    const st = S(game);
    st.murmur = game.flag('hall_intro') ? pickMurmur(game) : null; st.murmurShown = 0;
    const note = get('boardNote', 'ch_note_hint'); if (note) note.text = murmurText(st.murmur);
    if (game.flag('upg_hall_vault') && game.weekday === 6 && st.tipDay !== game.day) {
      st.tipDay = game.day; st.tips++; const tip = 60 + Math.floor(game.rngFor('ch_tip')() * 90);
      game.addMoney(tip); game.stat('hallTips'); game.toast(`The hall sprites left ${tip} coins in your pocket`, 'i_coin');
    }
  };
  game.bus.on('dayStart', newDay);
  game.bus.on('gameStart', newDay);
  game.bus.on('stat', (e) => { // fares are paid by the town's bus; the Fish Tank perk refunds half
    if (e && e.k === 'busRides' && game.flag('upg_bus_discount')) { const back = Math.floor(BUS_FARE / 2); game.addMoney(back); game.stat('busRebates'); game.toast(`Hall rebate: ${back} coins back`, 'i_coin'); }
  });
  game.bus.on('bundleDone', (e) => { const b = bundlesOf(e.room); const n = b.filter((x) => isDone(game, x.id)).length; game.toast(`Bundle done (${n}/${b.length})`, 'i_star'); });
  game.hallCeremony = () => get('script', 'ch_ceremony').steps(game);
  game.hallRoomScene = (room) => roomScene(room);
  // Debug and test helpers: game.hall.fill('fish_river'), game.hall.fillRoom('fish'), game.hall.fillAll(), game.hall.progress()
  game.hall = {
    fill: (id) => cheatBundle(game, id),
    fillRoom: (room) => bundlesOf(room).map((b) => cheatBundle(game, b.id)),
    fillAll: () => BUNDLES.map((b) => cheatBundle(game, b.id)),
    progress: () => ({ ...totalProgress(game), rooms: Object.fromEntries(ROOM_ORDER.map((r) => [r, roomProgress(game, r)])) }),
    open: (room = 'fish') => game.open('ch_bundles', room),
  };
} });

// ---------------------------------------------------------------- talk hooks (each fires once, when it first applies)
const hook = (id, npc, when, flag, steps) => register('talkHook', id, { npc, priority: -1, when, steps: () => [...steps, { t: 'set', flag }] });
hook('ch_talk_hana1', 'hana', (g) => totalProgress(g).done >= 3 && !g.flag('ch_talk_hana1'), 'ch_talk_hana1', [
  say('hana', 'happy', 'Misa, are you the one tidying the old Community Hall? I could hear the whole town buzzing about it.'),
  say('hana', 'happy', 'I danced in that hall at your grandfather\'s harvest supper. Bring it back to life, dear. I will bring the pickles.'),
  { t: 'friend', npc: 'hana', n: 10 },
]);
hook('ch_talk_hana2', 'hana', (g) => g.flag('community_restored') && !g.flag('ch_talk_hana2'), 'ch_talk_hana2', [
  say('hana', 'happy', 'I stood under that blossoming tree and cried like a girl. Thank you for bringing the hall home.'),
  { t: 'give', item: 'dish_sakura_mochi', n: 2 }, { t: 'friend', npc: 'hana', n: 15 },
]);
hook('ch_talk_goro', 'goro', (g) => g.flag('hall_room_garden') && !g.flag('ch_talk_goro'), 'ch_talk_goro', [
  say('goro', 'happy', 'I looked in on the hall garden. Fine planters. Fine soil. Someone loved those beds once.'),
  say('goro', 'neutral', 'Take this fertiliser. If you see the sprites, tell them the lettuce needs full sun.'),
  { t: 'give', item: 'mat_premium_fertiliser', n: 2 }, { t: 'friend', npc: 'goro', n: 10 },
]);
hook('ch_talk_kiko', 'kiko', (g) => g.flag('hall_room_night') && !g.flag('ch_talk_kiko'), 'ch_talk_kiko', [
  say('kiko', 'surprised', 'The little spirits at the hall have woken the dome stars? I felt a tug all the way up the steps.'),
  say('kiko', 'happy', 'They are cousins of the shrine kodama. Please bring them a sweet from me.'),
  { t: 'give', item: 'dish_dango', n: 1 }, { t: 'friend', npc: 'kiko', n: 10 },
]);

// ---------------------------------------------------------------- achievements
const ach = (id, name, desc, cond, icon = 'i_trophy', extra = {}) => register('achievement', id, { name, desc, cond, icon, ...extra });
ach('ch_first_bundle', 'Bundle of joy', 'Complete your first Community Hall bundle.', 'stat:bundlesDone>=1', 'i_star');
ach('ch_ten_bundles', 'Hall helper', 'Complete 10 Community Hall bundles.', 'stat:bundlesDone>=10', 'i_star');
ach('ch_first_room', 'Room with a view', 'Restore your first hall room.', 'stat:roomsRestored>=1', 'i_trophy');
ach('ch_deposits', 'Generous hands', 'Hand over 40 things to the hall bundles.', 'stat:hallDeposits>=40', 'heart');
ach('ch_vault_gold', 'Vault keeper', 'Give 6,000 coins to the hall vault.', 'stat:hallCoinsGiven>=6000', 'i_coin');
ach('ch_restored', 'Hoshimori gathers', 'Restore the whole Community Hall.', 'flag:community_restored', 'i_trophy', { title: 'Hall Keeper' });
