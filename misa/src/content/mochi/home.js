// Mochi at home: the pet_bed / cat_tree / mochi_toys interactions, the cardboard box and catnip mouse, morning gifts
// by the bed, the sun pool she naps in, the five bond events (DESIGN.md section 3) and Dr. Mori's checkups.
import { register, registerMany, features, get } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { SPRITES } from '../../art.js';
import { GIFTS, ms, hearts, addBond, fillNeed, checkAllCare } from './state.js';

const mochi = (g) => g.mochi;
const onHome = (g) => g.world && g.world.map && g.world.map.id === 'home';
const spots = (g) => (g.world && g.world.map && g.world.map._mochiSpots) || {};
const sendTo = (g, key, belly) => {
  const m = mochi(g), S = spots(g), sp = S[key];
  if (!m || !sp || !onHome(g) || m.map !== 'home') return false;
  m.leaveSpot(g.world); m.spot = { ...sp, key, pose: belly ? 'belly' : sp.pose }; m.pathTo(g.world, sp.tile[0], sp.tile[1]); m.set('goto', 12);
  return true;
};

// ---------------- shared home interactions ----------------
registerMany('interaction', {
  pet_bed: {
    label: (g) => (mochi(g) && mochi(g).spot && mochi(g).spot.key === 'pet_bed' && mochi(g).state === 'rest' ? 'Tuck Mochi in' : 'Fluff Mochi\'s bed'),
    run: (g) => {
      const m = mochi(g), s = ms(g);
      if (m && m.spot && m.spot.key === 'pet_bed' && m.state === 'rest') { fillNeed(g, 'love', 15); addBond(g, 8, 'tuck'); return g.say('misa', 'happy', 'Shh... she\'s fast asleep. I tuck the little blanket around her paws.'); }
      s.bedFluff = g.day; g.addMood(2);
      const lured = g.minutes < 21 * 60 && sendTo(g, 'pet_bed');
      return g.say('misa', 'happy', lured ? 'Fluff, fluff... and Mochi trots over to test it right away.' : 'Fluffed and cozy. She naps here on lazy afternoons.');
    },
  },
  cat_tree: {
    label: 'Call Mochi up the cat tower',
    run: (g) => {
      const ok = sendTo(g, 'perch'); addBond(g, 5, 'tower');
      const birds = g.weather === 'sunny' && g.minutes < 18 * 60;
      if (ok && birds) setTimeout(() => { g.sfx('chirp'); if (mochi(g)) mochi(g).say('i_music', 2); }, 2500);
      return g.say('misa', 'happy', !ok ? 'Mochi\'s castle. She rules from the top shelf.' : birds ? 'Up she goes! She\'ll sit up there chattering at the sparrows outside.' : 'Up she goes, all the way to the top shelf. Queen of the house.');
    },
  },
  mochi_toys: {
    label: 'Mochi\'s toy basket',
    run: (g) => {
      const s = ms(g), week = Math.floor((g.day - 1) / 7);
      if (s.treatWeek !== week) { s.treatWeek = week; g.give('mochi_treat', 3); }
      return g.run([{ t: 'choice', prompt: 'A feather wand, a catnip mouse, a brush and some treats.', options: [
        { text: 'Feather wand', steps: [{ t: 'call', fn: () => g.mochiPlay() }] },
        { text: 'Toss the catnip mouse', steps: [{ t: 'call', fn: () => catnip(g) }] },
        { text: s.box ? 'Put the cardboard box away' : 'Set out the cardboard box', steps: [{ t: 'call', fn: () => toggleBox(g) }] },
        { text: 'Brush', steps: [{ t: 'call', fn: () => g.mochiBrush() }] },
        { text: 'Never mind', steps: [] },
      ] }]);
    },
  },
});

function catnip(g) {
  const s = ms(g), m = mochi(g);
  if (s.mouseDay === g.day) return g.say('misa', 'neutral', 'She\'s had her catnip today. Any more and she\'ll be up all night.');
  s.mouseDay = g.day; fillNeed(g, 'play', 35); addBond(g, 10, 'catnip'); g.stat('mochiCatnip');
  const p = g.world.player, tx = Math.floor(p.x / TILE) + (p.dir === 'left' ? -2 : 2), ty = Math.floor((p.y - 1) / TILE);
  const ok = (g.world.grid[ty] || [])[tx];
  s.mouseAt = ok ? [tx * TILE + 8, ty * TILE + 12, g.clock + 14] : [p.x + 10, p.y, g.clock + 14];
  if (m && m.map === g.world.map.id) { m.leaveSpot(g.world); m.spot = { x: s.mouseAt[0] + 6, y: s.mouseAt[1], tile: ok ? [tx, ty] : null, key: 'mouse', pose: 'belly' }; if (ok) m.pathTo(g.world, tx, ty); m.set('goto', 10); }
  g.sfx('pop');
  return g.say('misa', 'happy', 'Fetch the mousey! ...Oh no, she\'s rolling on it. Full catnip mode.');
}
function toggleBox(g) {
  const s = ms(g); s.box = !s.box; g.world.refreshRects();
  if (s.box) { setTimeout(() => sendTo(g, 'box'), 600); return g.say('misa', 'happy', 'One empty box from the move. Watch: if it fits, she sits.'); }
  return g.say('misa', 'neutral', 'Flat-packed and tucked away. Mochi looks personally offended.');
}

// ---------------- drawing: box, mouse toy, sun pool, morning gift, photo flash ----------------
register('worldLayer', 'mochi_home', {
  below(g, world, game) {
    if (world.map.id !== 'home') return;
    const sun = spots(game).sun;
    if (sun && game.weather === 'sunny' && game.minutes >= 7 * 60 && game.minutes < 13 * 60) {
      const x = world.sx(sun.x), y = world.sy(sun.y) - 4, k = (game.minutes - 7 * 60) / 360;
      g.fillStyle = 'rgba(255,226,150,0.20)';
      for (let r = 0; r < 18; r++) g.fillRect(x - 26 + Math.round((1 - k) * 10) - (r >> 1), y - 9 + r, 52, 1);
    }
  },
  sprites(world, game) {
    if (world.map.id !== 'home') return [];
    const s = ms(game), out = [], m = mochi(game), S = spots(game);
    if (s.box && S.box) {
      const inBox = m && m.state === 'rest' && m.spot && m.spot.key === 'box';
      out.push({ y: S.box.y, draw: (g, w) => { w.shadow(S.box.x, S.box.y, 12); w.drawFeet(inBox ? 'mochi_box_cat' : 'mochi_box', S.box.x, S.box.y + 1); } });
    }
    if (s.mouseAt && game.clock < s.mouseAt[2]) out.push({ y: s.mouseAt[1] - 1, draw: (g, w) => w.drawFeet('mochi_mouse_toy', s.mouseAt[0], s.mouseAt[1]) });
    if (s.giftWaiting && S.bed && SPRITES[get('item', s.giftWaiting).icon]) {
      const gx = S.bed.tile[0] * TILE + 6, gy = S.bed.tile[1] * TILE + 15;
      out.push({ y: gy, draw: (g, w) => { w.drawFeet(get('item', s.giftWaiting).icon, gx, gy + Math.round(Math.sin(game.clock * 3))); if (Math.floor(game.clock * 3) % 3 === 0) { g.fillStyle = '#fffaf0'; g.fillRect(w.sx(gx) + 8, w.sy(gy) - 18, 1, 3); g.fillRect(w.sx(gx) + 7, w.sy(gy) - 17, 3, 1); } } });
    }
    return out;
  },
  solids(world, game) { const S = world.map._mochiSpots; return world.map.id === 'home' && ms(game).box && S && S.box ? [[S.box.x - 8, S.box.y - 8, 16, 8]] : []; },
  overlay(g, world, game) { if (game.flashUntil && game.clock < game.flashUntil) { g.fillStyle = 'rgba(255,250,240,0.7)'; g.fillRect(0, 0, 320, 224); } },
});

register('targetProvider', 'mochi_gift', {
  find(world, game) {
    const s = ms(game), S = spots(game);
    if (world.map.id !== 'home' || !s.giftWaiting || !S.bed) return null;
    const gx = S.bed.tile[0] * TILE + 6, gy = S.bed.tile[1] * TILE + 15, d = Math.hypot(world.player.x - gx, world.player.y - gy);
    if (d > 22) return null;
    return { label: 'Mochi\'s gift', dist: d - 8, x: gx, y: gy - 6, run: (g) => pickGift(g) };
  },
});
function pickGift(g) {
  const s = ms(g), id = s.giftWaiting, it = get('item', id);
  s.giftWaiting = null; s.gifts = (s.gifts || 0) + 1; s.giftsFound[id] = (s.giftsFound[id] || 0) + 1;
  g.give(id, 1); g.collect('mochi_gift', id); addBond(g, 5, 'gift');
  return g.run([{ t: 'say', who: 'misa', mood: 'surprised', text: `A ${it.name.toLowerCase()}, left right by my bed. Did you bring me this, Mochi?` }, { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrp. (She looks extremely pleased with herself.)' }]);
}

// ---------------- bond events ----------------
const placeMochi = (g, map, x, y, o = {}) => { const m = mochi(g); if (!m) return; m.map = map; m.x = x; m.y = y; m.path = null; m.spot = o.spot || null; m.lift = o.lift || 0; m.set(o.state || 'sit', o.t || 30); if (o.spot) m.state = 'rest'; };
const spotPx = (map, name) => { const d = get('map', map); const v = d && ((d.spots || {})[name] || (d.spawns || {})[name]); return v ? [v[0] * TILE + 8, v[1] * TILE + 13] : null; };

const BOND_EVENTS = [
  { id: 'mochi_bond2', hearts: 2, when: (g) => onHome(g) && g.minutes < 9 * 60 },
  { id: 'mochi_bond4', hearts: 4, when: (g) => g.world && g.world.map.id === 'yard' && g.minutes >= 9 * 60 && g.minutes < 18 * 60 && !['rain', 'storm'].includes(g.weather) },
  { id: 'mochi_bond6', hearts: 6, when: (g) => g.world && g.world.map.id === 'classroom' && g.check('school') && g.minutes < 15 * 60 },
  { id: 'mochi_bond8', hearts: 8, when: (g) => onHome(g) && g.isWeekend && g.minutes >= 9 * 60 && g.minutes < 16 * 60 && !!get('map', 'sunny_pines') },
  { id: 'mochi_bond10', hearts: 10, when: (g) => onHome(g) && g.minutes < 10 * 60 },
];
registerMany('script', {
  mochi_bond2: { steps: () => [
    { t: 'say', who: 'misa', mood: 'sleepy', text: 'Mmm... why are my feet so warm?' },
    { t: 'say', who: 'mochi', mood: 'sleepy', text: 'Prrrrr...' },
    { t: 'say', who: 'misa', mood: 'surprised', text: 'Mochi! You slept on my bed! You never sleep on anyone\'s bed except Grandma\'s.' },
    { t: 'emote', who: 'mochi', icon: 'heart' },
    { t: 'say', who: 'misa', mood: 'happy', text: 'I guess this is home for both of us now. Good morning, foot warmer.' },
    { t: 'call', fn: (g) => { g.addMood(10); addBond(g, 30, 'event'); } },
  ] },
  mochi_bond4: { steps: () => [
    { t: 'call', fn: (g) => { const c = spotPx('yard', 'cherry_tree'); if (c) placeMochi(g, 'yard', c[0], c[1] - 2, { spot: { x: c[0], y: c[1] - 2, key: 'tree', pose: 'loaf', lift: 34 }, lift: 34, t: 999 }); } },
    { t: 'sfx', name: 'meow' },
    { t: 'say', who: 'misa', mood: 'surprised', text: 'That meow... Mochi?! How did you get all the way up the cherry tree?' },
    { t: 'say', who: 'mochi', mood: 'neutral', text: 'Mrrraaow! (Translation: this was a mistake.)' },
    { t: 'choice', prompt: 'How do I get her down?', options: [
      { text: 'Grab the ladder from the shed', steps: [{ t: 'say', who: 'misa', mood: 'neutral', text: 'Okay. Ladder. Steady... steady...' }] },
      { text: 'Shake a treat bag', steps: [{ t: 'say', who: 'misa', mood: 'happy', text: 'Treats! ...She wants them, but she won\'t move. Ladder it is.' }] },
    ] },
    { t: 'fade', to: 1, dur: 0.4 }, { t: 'wait', dur: 0.4 },
    { t: 'call', fn: (g) => { const p = g.world ? g.world.player : { x: 0, y: 0 }; placeMochi(g, g.world ? g.world.map.id : 'yard', p.x + 12, p.y, { state: 'happy', t: 4 }); } },
    { t: 'fade', to: 0, dur: 0.4 },
    { t: 'say', who: 'misa', mood: 'happy', text: 'Got you! You silly, brave, ridiculous cat.' },
    { t: 'say', who: 'mochi', mood: 'happy', text: 'Prrrrp. (She buries her face in Misa\'s hoodie.)' },
    { t: 'say', who: 'misa', mood: 'neutral', text: 'You really want to be outside, huh? Grandma left something in the shed for you...' },
    { t: 'give', item: 'key_mochi_harness', n: 1 },
    { t: 'say', who: 'misa', mood: 'happy', text: 'A harness! Now we can explore together, safely. Talk to her at home when you want a walk.' },
    { t: 'call', fn: (g) => { addBond(g, 30, 'event'); ms(g).harness = true; const m = mochi(g); if (m && g.world && g.world.map.id === 'yard') { ms(g).walking = true; m.set('follow', 10); } } },
  ] },
  mochi_bond6: { steps: () => [
    { t: 'call', fn: (g) => { const c = spotPx('classroom', 'window'); if (c) placeMochi(g, 'classroom', c[0], c[1], { state: 'sit', t: 999 }); } },
    { t: 'say', who: null, text: 'Tap, tap, tap. Something orange is sitting in the classroom window.' },
    { t: 'say', who: 'misa', mood: 'surprised', text: 'Mochi?! Did you follow me all the way to school?' },
    { t: 'say', who: 'fujita', mood: 'surprised', text: 'Well! It seems class 2-B has a new student. Is she yours, Aoki?' },
    { t: 'choice', prompt: 'What do I say?', options: [
      { text: 'She is. I\'m so sorry!', steps: [{ t: 'say', who: 'fujita', mood: 'happy', text: 'Don\'t be. A cat in the window is good for morale. She can stay for homeroom.' }] },
      { text: 'She\'s here to learn science', steps: [{ t: 'say', who: 'fujita', mood: 'happy', text: 'Ha! Then she can observe. Quietly. Homeroom only, mind.' }] },
    ] },
    { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrp. (She settles into a perfect loaf on the windowsill.)' },
    { t: 'call', fn: (g) => { addBond(g, 30, 'event'); g.addMood(8); } },
  ] },
  mochi_bond8: { steps: () => [
    { t: 'say', who: 'mochi', mood: 'neutral', text: 'Mrow! Mrow! (Mochi paces by the door, looking back at Misa.)' },
    { t: 'say', who: 'misa', mood: 'surprised', text: 'You want me to follow you? Okay, okay, I\'m coming!' },
    { t: 'call', fn: (g) => { if (g.world && get('map', 'sunny_pines')) { const c = spotPx('sunny_pines', 'hana_chair') || spotPx('sunny_pines', 'default'); return g.warp('sunny_pines', c ? Math.floor(c[0] / TILE) : undefined, c ? Math.floor(c[1] / TILE) + 1 : undefined, 'up').then(() => { if (c) placeMochi(g, 'sunny_pines', c[0] + 14, c[1] + 4, { state: 'happy', t: 60 }); }); } return null; } },
    { t: 'say', who: null, text: 'Mochi leads the way all across town, up the hill, through the doors of Sunny Pines.' },
    { t: 'say', who: 'hana', mood: 'surprised', text: 'Oh! Oh, my goodness. Is that... Mochi? My Mochi?' },
    { t: 'say', who: 'mochi', mood: 'happy', text: 'Prrrrrrrrr...' },
    { t: 'say', who: 'hana', mood: 'happy', text: 'She remembered the way. Of course she did. She used to walk me to the bus stop every morning.' },
    { t: 'say', who: 'misa', mood: 'happy', text: 'She brought me here, Grandma. I think she missed you.' },
    { t: 'say', who: 'hana', mood: 'happy', text: 'And she chose you, Misa. Cats don\'t lead just anyone. Keep her close, dear.' },
    { t: 'call', fn: (g) => { addBond(g, 30, 'event'); g.addMood(15); if (get('npc', 'hana')) g.addFriend('hana', 60); } },
  ] },
  mochi_bond10: { steps: () => [
    { t: 'say', who: null, text: 'Something is glittering on Misa\'s pillow.' },
    { t: 'say', who: 'misa', mood: 'surprised', text: 'A pebble... no. It sparkles like it fell out of the night sky.' },
    { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrrp! (Mochi sits up very straight. This is her finest gift.)' },
    { t: 'give', item: 'mochi_star_pebble', n: 1 },
    { t: 'say', who: 'misa', mood: 'happy', text: 'Your gift of the year? Thank you, Mochi. I\'ll keep it forever. Best friends, okay?' },
    { t: 'call', fn: (g) => { g.addMood(20); g.stat('mochiMaxBond'); } },
  ] },
});

// Gentle trigger loop: runs a due bond event once the world is in control (never inside another scene).
register('worldTick', 'mochi_events', {
  update(dt, world, game) {
    if ((this.cool = (this.cool || 0) - dt) > 0) return;
    this.cool = 1;
    if (world.busy || !game.scenes || game.scenes.top !== world) return;
    const s = ms(game);
    for (const ev of BOND_EVENTS) {
      if (s.bondEvents.includes(ev.id) || hearts(game) < ev.hearts || !ev.when(game)) continue;
      s.bondEvents.push(ev.id); game.bus.emit('heartEvent', { npc: 'mochi', id: ev.id });
      game.run(get('script', ev.id).steps(game));
      return;
    }
  },
});

// ---------------- morning gifts, laundry memory ----------------
register('system', 'mochiHome', {
  init(game) {
    game.bus.on('dayStart', () => {
      const s = ms(game), r = game.rngFor('mochiGift');
      if (!s.giftWaiting && hearts(game) >= 1 && r() < 0.25 + hearts(game) * 0.04) {
        const fresh = GIFTS.filter(([id]) => !s.giftsFound[id]), pool = fresh.length && r() < 0.7 ? fresh : GIFTS;
        s.giftWaiting = pool[Math.floor(r() * pool.length)][0]; s.giftDay = game.day;
      }
      s.mouseAt = null;
    });
    // vet checkups at Dr. Mori's clinic (the economy area's clinic calls this after the visit is paid for)
    game.mochiCheckup = () => {
      const s = ms(game), chubby = (s.treatsToday || 0) > 2 && s.treatDay >= game.day - 2, scruffy = s.needs.groom < 40;
      s.checkups = (s.checkups || 0) + 1; s.checkupDay = game.day; fillNeed(game, 'groom', 20); addBond(game, 15, 'checkup'); game.stat('mochiCheckups');
      return game.run([
        { t: 'say', who: 'Dr. Mori', text: 'Let\'s have a look at you, Mochi. Ears... clean. Teeth... very sharp, thank you.' },
        { t: 'say', who: 'mochi', mood: 'neutral', text: 'Hssss... (She tolerates the stethoscope with great dignity.)' },
        { t: 'say', who: 'Dr. Mori', text: chubby ? 'Hmm, a little round around the middle. Go easy on the churu for a few days.' : 'Weight is perfect. Whoever is feeding her is doing a fine job.' },
        { t: 'say', who: 'Dr. Mori', text: scruffy ? 'Her coat could use a good brushing. Cats love a gentle brush along the fur.' : 'And a lovely shiny coat. She\'s a very happy, healthy cat.' },
        { t: 'say', who: 'misa', mood: 'happy', text: 'Hear that, Mochi? A clean bill of health! Treat when we get home.' },
      ]);
    };
  },
});

features('Mochi', [
  'Bond event (2 hearts): Mochi sleeps on Misa\'s bed for the first time',
  'Bond event (4 hearts): Mochi gets stuck up the yard\'s cherry tree and Misa rescues her with a ladder, unlocking her harness',
  'Bond event (6 hearts): Mochi follows Misa to school and Ms. Fujita lets her stay in the classroom window for homeroom',
  'Bond event (8 hearts): Mochi leads Misa across town to Sunny Pines for a reunion with Grandma Hana',
  'Bond event (10 hearts): Mochi\'s gift of the year, a glittering shooting-star pebble',
  'Morning gifts: Mochi leaves little treasures by the bed (12 kinds, from a shiny button to a lost earring)',
  'Mochi\'s bed: fluff it and she hops in for a nap; tuck her in while she sleeps',
  'Cat tower: call Mochi to the top shelf, where she chatters at the sparrows on sunny days',
  'Toy basket with a feather wand, a catnip mouse she rolls on, a brush, and churu treats restocked weekly',
  'Cardboard box: set it out and Mochi climbs in, peeking over the edge',
  'Mochi naps in a warm pool of morning sunlight in the sunroom',
  'Vet checkups at Dr. Mori\'s clinic: ears, teeth, weight and coat, with advice if she is chubby or scruffy',
]);
