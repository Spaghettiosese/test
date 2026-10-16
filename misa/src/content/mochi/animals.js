// The town's other animals as world actors: Daifuku (Goro's shiba), Kuro the grey kitten (side arc C), five named
// stray cats with an album, plus ambient wildlife (park ducks and koi, sparrows and pigeons in the square,
// spring and summer butterflies). Actors live in world.pets; the ambient critters are drawn by a worldLayer.
import { register, registerMany, features, get } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { SPRITES } from '../../art.js';
import { itemIcon } from '../../gfx/icons.js';
import { Critter, tileOf, near } from './actor.js';
import { ms, addBond, fillNeed, hearts } from './state.js';
import { STRAYS } from './cats.js';

registerMany('item', {
  dog_biscuit: { name: 'Dog biscuit', desc: 'A crunchy bone-shaped biscuit. Daifuku will do almost anything for one.', cat: 'misc', price: 10, icon: itemIcon('bread', { c: '#d0a87c' }) },
  bird_seed: { name: 'Bird seed', desc: 'A handful of seed for ducks, koi and sparrows.', cat: 'misc', price: 4, icon: itemIcon('seed', { c: '#c0a050' }) },
  daifuku_geode: { name: 'Daifuku\'s geode', desc: 'A purple crystal geode, dug up and proudly presented by a dog.', cat: 'key', key: true, price: 0, icon: itemIcon('gem', { c: '#b89ae0' }) },
});

const spotXY = (map, name, dx = 0, dy = 0) => { const d = get('map', map), v = d && ((d.spots || {})[name] || (d.spawns || {})[name]); return v ? [v[0] * TILE + 8 + dx, v[1] * TILE + 13 + dy] : null; };
const hash = (a, b = 0) => { let h = Math.imul(a * 374761393 + b * 668265263 + 1274126177, 1103515245) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
const isEvening = (g) => g.minutes >= 17 * 60 && g.minutes < 22 * 60;
const dogTreat = (g) => ['snack_pet_bone', 'snack_pet_jerky', 'dog_biscuit'].find((i) => g.has(i));
export const catTreat = (g) => ['mochi_treat', 'snack_pet_salmon', 'snack_pet_tuna', 'snack_pet_kitten'].find((i) => g.has(i));
const say = (who, mood, text) => ({ t: 'say', who, mood, text });

// ================================================================ Daifuku
class Daifuku extends Critter {
  constructor() { super('daifuku', { map: null, label: 'Daifuku', state: 'sit', t: 3, speed: 46 }); }
  get sprite() {
    const a = this.anim, f = Math.floor(a * 8) % 4;
    if (this.state === 'lie') return `dai_lie_${Math.floor(a * 0.9) % 2}`;
    if (this.state === 'walk') return `dai_walk_${f}`;
    if (this.state === 'happy') return 'dai_sit_happy';
    if (this.state === 'bark') return 'dai_bark';
    return a % 5 < 0.15 ? 'dai_sit_b' : `dai_sit_${Math.floor(a * 3) % 4}`;
  }
  update(dt, game, world) {
    this.tickBase(dt, world);
    const goro = world.npcs.goro, p = world.player;
    if (!goro || !goro.present) { this.map = null; return; }
    if (this.map !== world.map.id) { this.map = world.map.id; this.path = null; const [tx, ty] = tileOf(goro.x, goro.y); const o = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => (world.grid[ty + dy] || [])[tx + dx]) || [0, 0]; this.x = (tx + o[0]) * TILE + 8; this.y = (ty + o[1]) * TILE + 13; this.state = 'sit'; }
    this.t -= dt;
    const dG = Math.hypot(goro.x - this.x, goro.y - this.y), dP = Math.hypot(p.x - this.x, p.y - this.y), nap = game.minutes >= 13 * 60 && game.minutes < 15 * 60;
    if (this.state === 'happy' || this.state === 'bark') { if (this.t <= 0) this.state = 'sit'; return; }
    if (dG > 26 || (goro.moving && dG > 14)) {
      this.state = 'walk';
      if (!this.path || this.repath <= 0) { const [tx, ty] = tileOf(goro.x, goro.y); this.pathTo(world, tx, ty); this.repath = 0.7; }
      this.repath -= dt; this.stepPath(dt, goro.moving ? 52 : 40);
    } else if (this.state === 'walk') { this.path = null; this.state = nap ? 'lie' : 'sit'; this.t = 4; }
    else if (this.t <= 0) { this.t = 4 + game.rng() * 5; this.state = nap ? 'lie' : (game.rng() < 0.2 ? 'bark' : 'sit'); if (this.state === 'bark') { game.sfx('woof'); this.t = 1; } }
    if (this.state === 'sit' && dP < 30 && game.rng() < dt) this.dir = p.x < this.x ? -1 : 1;
  }
  draw(g, world) { this.drawSprite(world, this.sprite, this.dir < 0, 12); }
  interact(game) {
    const s = ms(game).daifuku, here = game.world.map.id, ok = here === 'park' && game.world.npcs.goro && game.world.npcs.goro.present;
    this.state = 'happy'; this.t = 3;
    const opts = [{ text: 'Pet him', steps: [{ t: 'call', fn: () => this.pet(game) }] }, { text: 'Rub his belly', steps: [{ t: 'call', fn: () => this.belly(game) }] }];
    if (ok) opts.push({ text: 'Play fetch', steps: [{ t: 'call', fn: () => this.fetch(game) }] });
    if (dogTreat(game)) opts.push({ text: 'Give a dog biscuit', steps: [{ t: 'call', fn: () => this.treat(game) }] });
    opts.push({ text: 'Leave him be', steps: [] });
    return game.run([{ t: 'choice', prompt: 'Daifuku wags his curly tail.', options: opts }]);
  }
  count(game) { const s = ms(game).daifuku; if (s.petDay !== game.day) { s.petDay = game.day; s.petDays = (s.petDays || 0) + 1; this.events(game); } }
  pet(game) { this.count(game); game.sfx('woof'); game.addMood(3); game.stat('daifukuPets'); return game.say('goro', 'neutral', 'Hmph. He likes you. Dogs have no taste. ...Good boy, Daifuku.').catch(() => {}); }
  belly(game) { this.count(game); game.addMood(5); game.stat('daifukuBellies'); return game.run([{ t: 'say', who: null, text: 'Daifuku flops onto his back, all four paws in the air. Belly rubs: approved.' }]); }
  treat(game) {
    const s = ms(game).daifuku; game.take(dogTreat(game), 1); game.sfx('eat'); game.addMood(4);
    const first = s.treatDay !== game.day; s.treatDay = game.day;
    if (first && get('npc', 'goro')) game.addFriend('goro', 10);
    return game.run([{ t: 'say', who: null, text: 'CRUNCH. Daifuku swallows the biscuit in one bite and stares at your pocket for more.' }]);
  }
  fetch(game) {
    const s = ms(game).daifuku;
    if (s.fetchDay === game.day) return game.say('goro', 'neutral', 'He has fetched enough for one day. His dignity needs a rest.').catch(() => {});
    return game.minigame('daifuku_fetch', {}).then((r) => {
      if (r.quit) return;
      s.fetchDay = game.day; s.fetches = (s.fetches || 0) + 1; game.stat('daifukuFetch'); game.addMood(6); this.count(game);
      if (r.score >= 0.8) { game.give('dog_biscuit', 1); }
      if (!s.events.includes('fetch')) { s.events.push('fetch'); return game.run([say('goro', 'happy', 'Well, well. He never fetches for strangers. You have a good arm, Hana\'s girl.'), { t: 'call', fn: () => game.addFriend && get('npc', 'goro') && game.addFriend('goro', 20) }]); }
    });
  }
  events(game) {
    const s = ms(game).daifuku;
    if ((s.petDays || 0) >= 3 && !s.events.includes('standoff') && ms(game).bond >= 400) { s.events.push('standoff'); setTimeout(() => game.run([
      { t: 'say', who: null, text: 'Daifuku spots Mochi on the garden fence. Mochi arches her back. Daifuku\'s curly tail goes stiff. A standoff!' },
      { t: 'call', fn: () => game.sfx('hiss') }, { t: 'call', fn: () => game.sfx('woof') },
      say('goro', 'surprised', 'Daifuku! Leave the cat alone! ...Huh. They are just sitting there. Staring.'),
      { t: 'say', who: null, text: 'Slowly, Mochi sits. Daifuku sits. A truce, sealed with a very long blink.' },
      { t: 'call', fn: () => { addBond(game, 15, 'event'); game.addMood(8); } },
    ]), 800); }
    if ((s.petDays || 0) >= 8 && !s.events.includes('geode')) { s.events.push('geode'); setTimeout(() => game.run([
      { t: 'say', who: null, text: 'Daifuku has been digging. He trots over with something clamped proudly in his jaws and drops it at Misa\'s feet.' },
      { t: 'give', item: 'daifuku_geode', n: 1 },
      say('goro', 'surprised', 'A geode! He must have dug that up near my compost. Fine. Keep it. He clearly likes you more than me.'),
    ]), 800); }
  }
}

// ================================================================ Kuro
const KURO_BAND = (a) => (a < 25 ? 'hiss' : a < 50 ? 'watch' : a < 75 ? 'sniff' : 'share');
class Kuro extends Critter {
  constructor() { super('kuro', { map: null, label: 'Kuro', state: 'sit', t: 3 }); }
  get stage() { return ms(this.game).kuro.stage; }
  get sprite() {
    const k = ms(this.game).kuro, a = this.anim, moving = this.walking;
    if (moving) return `kuro_walk_${Math.floor(a * 7) % 4}`;
    if (this.state === 'sleep') return `kuro_sleep_${Math.floor(a * 1.3) % 2}`;
    if (this.stage === 'visiting' && k.accept < 25) return this.nearPlayer ? 'kuro_hiss' : 'kuro_scared';
    if (this.state === 'happy') return a % 1.4 < 0.7 ? 'kuro_sit_happy' : 'kuro_sit_meow';
    return a % 4.5 < 0.14 ? 'kuro_sit_b' : `kuro_sit_${Math.floor(a * 2) % 3}`;
  }
  wantMap(game) {
    const k = ms(game).kuro, m = game.minutes;
    if (k.stage === 'adopted') return 'home';
    if (k.stage === 'rehomed') return get('map', 'goro_house') ? 'goro_house' : null;
    if (k.stage === 'visiting') return isEvening(game) ? 'yard' : null;
    if (k.stage === 'none' && game.day >= 20 && ['rain', 'storm'].includes(game.weather) && isEvening(game) && get('map', 'yard')) return 'yard';
    void m; return null;
  }
  update(dt, game, world) {
    this.game = game; this.tickBase(dt, world);
    const want = this.wantMap(game);
    if (want !== this.map && (want === world.map.id || this.map === world.map.id || this.map === null)) {
      this.map = want; this.path = null;
      if (want === 'yard') { const p = spotXY('yard', 'fence_gap'); if (p) { this.x = p[0]; this.y = p[1]; } this.state = 'sit'; }
      else if (want === 'home') { const m = game.mochi; this.x = (m ? m.x : 120) + 14; this.y = m ? m.y : 190; this.state = 'sit'; }
      else if (want === 'goro_house') { const p = spotXY('goro_house', 'kitchen') || spotXY('goro_house', 'chair'); if (p) { this.x = p[0]; this.y = p[1]; } this.state = 'sit'; }
    }
    if (this.map !== world.map.id) return;
    const p = world.player, dP = Math.hypot(p.x - this.x, p.y - this.y), k = ms(game).kuro;
    this.nearPlayer = dP < 40;
    this.t -= dt;
    if (this.stage === 'adopted' && world.map.id === 'home') {
      const m = game.mochi, night = game.minutes >= 22 * 60 || game.minutes < 6 * 60;
      if (night && m && m.state === 'rest') { this.state = 'sleep'; this.x += (m.x - 14 - this.x) * dt; this.y += (m.y - this.y) * dt; }
      else if (m && m.map === 'home' && Math.hypot(m.x - this.x, m.y - this.y) > 28) { this.state = 'sit'; if (!this.path || this.repath <= 0) { const [tx, ty] = tileOf(m.x, m.y); this.pathTo(world, tx, ty); this.repath = 1; } this.repath -= dt; this.stepPath(dt, 34); }
      else if (this.t <= 0) { this.state = game.rng() < 0.2 ? 'happy' : 'sit'; this.t = 3 + game.rng() * 4; }
    } else if (this.stage === 'visiting' && k.accept < 25 && dP < 24 && this.map === 'yard') {
      const gap = spotXY('yard', 'fence_gap'); if (gap) this.moveToward(gap[0] + 4, gap[1], 28, dt);
    } else if (this.t <= 0) { this.state = (game.rng() < 0.25 && k.accept >= 50) ? 'happy' : 'sit'; this.t = 3 + game.rng() * 4; }
  }
  draw(g, world) { this.drawSprite(world, this.sprite, this.dir < 0, 6); }
  interact(game) {
    const k = ms(game).kuro;
    if (k.stage === 'none') return game.run(kuroIntro());
    if (k.stage === 'visiting') return game.run([{ t: 'choice', prompt: `Kuro ${{ hiss: 'hisses softly', watch: 'watches you warily', sniff: 'sniffs the air', share: 'purrs' }[KURO_BAND(k.accept)]}.`, options: [
      { text: 'Put out a saucer of food', steps: [{ t: 'call', fn: () => this.feed(game) }] },
      { text: 'Sit quietly', steps: [{ t: 'call', fn: () => this.sit(game) }] },
      { text: 'Back away', steps: [] },
    ] }]);
    // adopted or rehomed: simple kitten care
    return game.run([{ t: 'choice', prompt: 'Kuro looks up with big yellow eyes.', options: [
      { text: 'Feed him', steps: [{ t: 'call', fn: () => this.feedPet(game) }] },
      { text: 'Pet him', steps: [{ t: 'call', fn: () => { game.sfx('mew'); this.state = 'happy'; this.t = 3; game.addMood(4); if (k.petDay !== game.day) { k.petDay = game.day; addBond(game, 5, 'kuropet'); } return game.say('misa', 'happy', 'He leans into my hand and purrs. Tiny motor, big heart.'); } }] },
      { text: 'Never mind', steps: [] },
    ] }]);
  }
  sit(game) { game.advance(15); const k = ms(game).kuro; if (k.sitDay !== game.day) { k.sitDay = game.day; k.accept = Math.min(100, k.accept + 4); } game.sfx('mew'); return game.say('misa', 'neutral', 'I sit very still on the step. After a while, one yellow eye peeks at me. Progress.'); }
  feedPet(game) {
    const k = ms(game).kuro;
    if (k.petFedDay === game.day) return game.say('misa', 'neutral', 'His little tummy is as round as a dumpling already.');
    k.petFedDay = game.day; { const t = catTreat(game); if (t) game.take(t, 1); } game.sfx('eat'); this.state = 'happy'; this.t = 3;
    return game.say('misa', 'happy', 'Kuro dives into his bowl. Mochi supervises from a safe distance.');
  }
  feed(game) {
    const k = ms(game).kuro;
    if (k.lastFed === game.day) return game.say('misa', 'neutral', 'He has eaten tonight. He is licking his paws, one eye on me.');
    const before = KURO_BAND(k.accept);
    k.lastFed = game.day; k.fed++; k.accept = Math.min(100, k.accept + 14); game.sfx('eat'); game.advance(20); game.stat('kuroFed');
    this.state = 'happy'; this.t = 3;
    const after = KURO_BAND(k.accept), steps = [];
    steps.push(say('misa', 'happy', ['I pour out a little food in the saucer. Kuro stays well back, then creeps closer, one white sock at a time.', 'The same saucer, the same place. This time he doesn\'t run when I step back.', 'He eats while I\'m still sitting right here. A first.', 'He rubs his chin on the saucer, and then on my shoe.', 'Kuro is waiting for me at the fence gap. Waiting!', 'He bumps my hand with his head before he eats.', 'Tonight he follows me to the porch step.'][Math.min(6, k.fed - 1)]));
    if (after !== before) {
      if (after === 'watch') steps.push({ t: 'say', who: null, text: 'Through the window, Mochi presses her nose to the glass. She is watching him. He is watching her. Neither of them blinks.' });
      if (after === 'sniff') steps.push({ t: 'say', who: null, text: 'Mochi pads out onto the porch. Kuro freezes. They stretch their necks, closer, closer... and sniff each other\'s noses. No hissing.' }, { t: 'call', fn: () => { game.sfx('trill'); addBond(game, 10, 'kuromeet'); } });
      if (after === 'share') steps.push({ t: 'say', who: null, text: 'Mochi curls up on the porch cushion. Kuro hesitates... and tucks himself in beside her. One orange cat, one grey kitten, one very warm cushion.' }, { t: 'call', fn: () => game.sfx('purr') });
    }
    if (k.fed >= 7 && k.accept >= 75) steps.push({ t: 'run', script: 'kuro_decision' });
    return game.run(steps);
  }
}
const kuroIntro = () => [
  { t: 'say', who: null, text: 'Something is crouched in the gap under the yard hedge, rain beading on charcoal-grey fur. Two yellow eyes. One bent ear.' },
  say('misa', 'surprised', 'Oh! Hello, little one. Where did you come from?'),
  { t: 'sfx', name: 'mew' },
  say('misa', 'neutral', 'You\'re soaked, and so thin. Stay right there. I\'ll bring something. (I wonder if Mochi will mind...)'),
  { t: 'call', fn: (g) => { const k = ms(g).kuro; k.stage = 'visiting'; k.introDay = g.day; g.toast('The Little Grey Visitor: feed Kuro each evening', 'i_star'); g.stat('kuroMet'); } },
];
register('script', 'kuro_decision', {
  steps: () => [
    say('misa', 'happy', 'He\'s so brave now. And look: Mochi doesn\'t even flick her tail when he sits near her.'),
    say('misa', 'neutral', 'He can\'t keep sleeping under a hedge, though. What should we do?'),
    { t: 'choice', prompt: 'What will happen to Kuro?', options: [
      { text: 'Adopt him', steps: [
        say('misa', 'happy', 'Welcome home, Kuro. I think Grandma\'s house has room for one more tiny cat.'),
        say('mochi', 'neutral', 'Mrrp. (A very dignified sigh. Then she moves over on the cushion.)'),
        { t: 'call', fn: (g) => { const k = ms(g).kuro; k.stage = 'adopted'; k.home = 'misa'; g.collect('pet', 'kuro'); g.stat('kuroAdopted'); addBond(g, 20, 'event'); g.toast('Kuro joined the family!', 'heart'); } },
      ] },
      { text: 'Ask Goro to take him', steps: [
        say('goro', 'neutral', 'A cat? In MY house? ...Hmph. He can have the porch. I am not buying him a sweater.'),
        say('misa', 'happy', 'Thank you, Goro. He\'ll be right next door. I can visit every day.'),
        { t: 'call', fn: (g) => { const k = ms(g).kuro; k.stage = 'rehomed'; k.home = 'goro'; g.stat('kuroRehomed'); if (get('npc', 'goro')) g.addFriend('goro', 100); g.toast('Goro adopted Kuro. He looks quietly pleased.', 'heart'); } },
      ] },
    ] },
  ],
});

// ================================================================ strays
const STRAY_DEFS = [
  { id: 'hanako', name: 'Hanako', map: 'lane', spot: 'wall', dx: 0, dy: 16 + 2, lift: 7, hours: [7, 19], likes: 'sunny', line: 'A calico who surveys Lantern Lane from the stone wall like a tiny landlord.' },
  { id: 'sumi', name: 'Sumi', map: 'shotengai', spot: 'lantern_row', dx: 0, dy: 0, lift: 0, hours: [15, 24], line: 'A glossy black cat who naps under the lanterns of the shopping street.' },
  { id: 'yuki', name: 'Yuki', map: 'harbour', spot: 'bench', dx: 0, dy: 0, lift: 0, hours: [6, 17], line: 'A fluffy white cat who guards the harbour benches and waits for fish scraps.' },
  { id: 'nezumi', name: 'Nezumi', map: 'shrine', spot: 'steps', dx: 0, dy: 0, lift: 0, hours: [6, 14], line: 'A grey tabby who sits on the shrine steps as if she were the keeper.' },
  { id: 'tux', name: 'Tux', map: 'town', spot: 'cafe_terrace', dx: 10, dy: 0, lift: 0, hours: [10, 20], line: 'A tuxedo cat in his best formal wear who haunts the cafe terrace.' },
];
class Stray extends Critter {
  constructor(d) { super('stray_' + d.id, { map: null, def: d, label: d.name, state: 'loaf', t: 3 }); }
  here(game) { const d = this.def, h = game.minutes / 60; return !['rain', 'storm', 'snow'].includes(game.weather) && h >= d.hours[0] && h < d.hours[1] && !!get('map', d.map) && !!spotXY(d.map, d.spot); }
  update(dt, game, world) {
    this.tickBase(dt, world); this.game = game;
    const d = this.def, want = this.here(game) ? d.map : null;
    if (want !== this.map && (want === world.map.id || this.map === world.map.id)) { this.map = want; if (want) { const p = spotXY(d.map, d.spot, d.dx, d.dy); this.x = p[0]; this.y = p[1]; this.lift = d.lift; } }
    if (this.map !== world.map.id) return;
    this.t -= dt;
    if (this.t <= 0) { const r = hash(Math.floor(game.clock / 6), d.id.length); this.state = r < 0.35 ? 'loaf' : r < 0.6 ? 'sleep' : r < 0.8 ? 'groom' : 'sit'; this.t = 6 + r * 8; }
  }
  get sprite() {
    const p = 'stray_' + this.def.id, a = this.anim;
    if (this.state === 'sleep') return `${p}_sleep_${[0, 1, 2, 1][Math.floor(a * 1.2) % 4]}`;
    if (this.state === 'groom') return `${p}_groom_${Math.floor(a * 4) % 4}`;
    if (this.state === 'sit') return a % 4.5 < 0.14 ? `${p}_sit_b` : `${p}_sit_${Math.floor(a * 2) % 4}`;
    return `${p}_loaf_${a % 5 < 0.4 ? 1 : 0}`;
  }
  draw(g, world) {
    this.drawSprite(world, this.sprite, this.dir < 0, this.lift ? 0 : 8);
    if (this.state === 'sleep' && Math.floor(world.game.clock * 0.7) % 2) world.drawFeet('zzz', this.x + 8, this.y - 12 - this.lift);
  }
  interact(game) {
    const s = ms(game), id = this.def.id, st = (s.strays[id] ||= { met: 0, fed: 0, pets: 0 });
    const first = !st.met; st.met = game.day;
    if (first) { game.collect('stray_cat', id); game.toast(`Cat album: you met ${this.def.name}!`, 'i_star'); }
    const opts = [{ text: 'Pet gently', steps: [{ t: 'call', fn: () => { st.pets++; game.sfx('purr'); this.state = 'sit'; this.t = 5; game.addMood(3); game.stat('strayPets'); return game.say('misa', 'happy', first ? `${this.def.name} sniffs my fingers and allows exactly two strokes. A great honour.` : `${this.def.name} purrs and bumps my hand.`); } }] }];
    if (catTreat(game)) opts.push({ text: 'Offer a treat', steps: [{ t: 'call', fn: () => { game.take(catTreat(game), 1); st.fed++; game.sfx('eat'); game.stat('strayFed'); if (st.fed === 3) { game.toast(`${this.def.name} is your friend now!`, 'heart'); game.give('mochi_gift_pebble', 1, false); } return game.say('misa', 'happy', `${this.def.name} gobbles it up and trills.`); } }] });
    opts.push({ text: 'Leave her be', steps: [] });
    return game.run([{ t: 'say', who: null, text: this.def.line }, { t: 'choice', prompt: `${this.def.name} blinks slowly.`, options: opts }]);
  }
}

// ================================================================ manager: puts every actor into world.pets
register('system', 'mochiAnimals', {
  init(game) {
    const dai = new Daifuku(), kuro = new Kuro(), strays = STRAYS.map((id) => new Stray(STRAY_DEFS.find((d) => d.id === id)));
    kuro.game = game; game.kuro = kuro; game.daifuku = dai;
    game.bus.on('mapEnter', () => { if (!game.world || !game.world.pets) return; for (const a of [dai, kuro, ...strays]) if (!game.world.pets.includes(a)) game.world.pets.push(a); });
  },
});

// ================================================================ ambient wildlife (ducks, koi, birds, butterflies)
const AMB = { map: null, ducks: [], koi: [], birds: [], flies: [], water: [] };
function setupAmbient(world, game) {
  const m = world.map; AMB.map = m.id; AMB.ducks = []; AMB.koi = []; AMB.birds = []; AMB.flies = []; AMB.water = [];
  if (m.id === 'park') {
    const c = (m.def.spots || {}).pond_edge || [10, 18];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.tiles[y][x].ground === 'water' && Math.hypot(x - c[0], y - c[1]) < 9) AMB.water.push([x, y]);
    const W = AMB.water;
    if (W.length > 8 && game.season !== 'winter') {
      for (let i = 0; i < 3; i++) { const t = W[Math.floor(hash(i, 11) * W.length)]; AMB.ducks.push({ x: t[0] * TILE + 8, y: t[1] * TILE + 12, tx: t[0] * TILE + 8, ty: t[1] * TILE + 12, dir: i % 2 ? 1 : -1, hen: i === 2, wait: hash(i, 3) * 4, seed: i, eat: 0 }); }
      for (let i = 0; i < 4; i++) { const t = W[Math.floor(hash(i, 17) * W.length)]; AMB.koi.push({ x: t[0] * TILE + 8, y: t[1] * TILE + 8, tx: t[0] * TILE + 8, ty: t[1] * TILE + 8, c: i % 3, dir: 1, seed: i, surf: 0 }); }
    }
    const lawn = (m.def.spots || {}).lawn || [30, 14];
    if (['spring', 'summer'].includes(game.season)) for (let i = 0; i < 5; i++) AMB.flies.push({ cx: lawn[0] * TILE + (hash(i, 5) - 0.5) * 220, cy: lawn[1] * TILE + (hash(i, 6) - 0.5) * 120, ph: hash(i, 7) * 6, c: i % 4, r: 26 + hash(i, 8) * 30 });
  }
  if (m.id === 'town') {
    const f = (m.def.spots || {}).fountain || [22, 19];
    for (let i = 0; i < 9; i++) { const a = hash(i, 21) * 6.28, r = 38 + hash(i, 22) * 64; AMB.birds.push({ hx: f[0] * TILE + 8 + Math.cos(a) * r, hy: f[1] * TILE + 12 + Math.sin(a) * r * 0.7, x: 0, y: 0, pigeon: i % 3 === 2, st: 'peck', t: hash(i, 23) * 3, fly: 0, dir: i % 2 ? 1 : -1, seed: i }); AMB.birds[i].x = AMB.birds[i].hx; AMB.birds[i].y = AMB.birds[i].hy; }
  }
}
function daytime(game) { return game.minutes >= 6 * 60 && game.minutes < 19 * 60 && game.weather !== 'storm'; }
register('worldTick', 'mochi_ambient', {
  update(dt, world, game) {
    if (AMB.map !== world.map.id || AMB.season !== game.season) { setupAmbient(world, game); AMB.season = game.season; }
    const p = world.player, tm = game.clock;
    for (const d of AMB.ducks) {
      d.wait -= dt;
      if (d.eat > 0) { d.eat -= dt; }
      else if (d.food) { if (Math.hypot(d.food.x - d.x, d.food.y - d.y) < 3) { d.eat = 1.2; d.food = null; } else { const dx = d.food.x - d.x, dy = d.food.y - d.y, n = Math.hypot(dx, dy); d.x += (dx / n) * 22 * dt; d.y += (dy / n) * 22 * dt; d.dir = dx < 0 ? -1 : 1; } }
      else if (d.wait <= 0) { const t = AMB.water[Math.floor(hash(d.seed, Math.floor(tm / 5)) * AMB.water.length)]; d.tx = t[0] * TILE + 8; d.ty = t[1] * TILE + 12; d.wait = 4 + hash(d.seed, Math.floor(tm)) * 5; }
      else { const dx = d.tx - d.x, dy = d.ty - d.y, n = Math.hypot(dx, dy); if (n > 2) { d.x += (dx / n) * 7 * dt; d.y += (dy / n) * 7 * dt; if (Math.abs(dx) > 1) d.dir = dx < 0 ? -1 : 1; } }
    }
    for (const k of AMB.koi) {
      if (k.surf > 0) k.surf -= dt;
      const dx = k.tx - k.x, dy = k.ty - k.y, n = Math.hypot(dx, dy);
      if (n < 3) { const t = AMB.water[Math.floor(hash(k.seed, Math.floor(tm / 3) + 5) * AMB.water.length)]; k.tx = t[0] * TILE + 8; k.ty = t[1] * TILE + 8; }
      else { k.x += (dx / n) * 12 * dt; k.y += (dy / n) * 12 * dt; k.dir = dx < 0 ? -1 : 1; }
    }
    for (const b of AMB.birds) {
      const dP = Math.hypot(p.x - b.x, p.y - b.y), scare = p.run ? 56 : 34;
      if (b.st === 'fly') {
        b.fly -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.alt = Math.min(24, (b.alt || 0) + 60 * dt);
        if (b.fly <= 0) { b.st = 'back'; b.t = 0; }
      } else if (b.st === 'back') { b.alt = Math.max(0, b.alt - 40 * dt); const dx = b.hx - b.x, dy = b.hy - b.y, n = Math.hypot(dx, dy); if (n > 2) { b.x += (dx / n) * 40 * dt; b.y += (dy / n) * 40 * dt; } if (n <= 2 && b.alt <= 0) { b.st = 'peck'; b.t = 1; } }
      else {
        if (dP < scare && daytime(game)) { const a = Math.atan2(b.y - p.y, b.x - p.x) + (hash(b.seed, 4) - 0.5); b.vx = Math.cos(a) * 70; b.vy = Math.sin(a) * 40 - 8; b.st = 'fly'; b.fly = 2.5 + hash(b.seed, 9) * 2; b.alt = 0; b.dir = b.vx < 0 ? -1 : 1; if (dP < scare && Math.floor(tm * 3) % 4 === 0) game.sfx('flutter'); }
        b.t -= dt; if (b.t <= 0) { b.st = b.st === 'peck' ? 'hop' : 'peck'; b.t = 0.6 + hash(b.seed, Math.floor(tm)) * 2; if (b.st === 'hop') { b.x += (hash(b.seed, Math.floor(tm * 2)) - 0.5) * 12; b.y += (hash(b.seed, Math.floor(tm * 3)) - 0.5) * 6; b.dir = hash(b.seed, Math.floor(tm)) < 0.5 ? -1 : 1; } }
      }
    }
  },
});
register('worldLayer', 'mochi_ambient_draw', {
  below(g, world, game) {
    if (AMB.map !== world.map.id) return;
    const f = Math.floor(game.clock * 6) % 4;
    g.globalAlpha = 0.9;
    for (const k of AMB.koi) { const sp = `koi_${k.c}_${f}`; if (!SPRITES[sp]) continue; const x = world.sx(k.x) - 8, y = world.sy(k.y) - 5; if (k.dir < 0) { g.save(); g.translate(x + 15, y); g.scale(-1, 1); g.drawImage(world.img(sp), 0, 0); g.restore(); } else g.drawImage(world.img(sp), x, y); }
    g.globalAlpha = 1;
  },
  sprites(world, game) {
    if (AMB.map !== world.map.id) return [];
    const out = [], f = Math.floor(game.clock * 2) % 2;
    for (const d of AMB.ducks) out.push({ y: d.y, draw: (g, w) => w.drawFeet(`duck_${d.hen ? 'hen_' : ''}swim_${f}`, d.x, d.y + 2, d.dir < 0) });
    if (daytime(game)) for (const b of AMB.birds) {
      const fly = b.st === 'fly', sp = fly ? `sparrow_fly_${Math.floor(game.clock * 14) % 2}` : b.pigeon ? (b.st === 'peck' ? 'pigeon_peck' : `pigeon_${f}`) : (b.st === 'peck' ? 'sparrow_peck' : `sparrow_hop_${f}`);
      out.push({ y: b.y + (fly ? 40 : 0), draw: (g, w) => { if (!fly && !(b.alt > 0)) w.shadow(b.x, b.y, 3); w.drawFeet(sp, b.x, b.y - (b.alt || 0), b.dir < 0); } });
    }
    if (daytime(game) && game.minutes < 18 * 60 && game.weather !== 'rain') for (const bf of AMB.flies) {
      const t = game.clock * 0.5 + bf.ph, x = bf.cx + Math.cos(t) * bf.r + Math.sin(t * 2.3) * 8, y = bf.cy + Math.sin(t * 1.3) * bf.r * 0.6;
      out.push({ y: y + 30, draw: (g, w) => w.drawFeet(`bfly_${bf.c}_${Math.floor(game.clock * 7 + bf.ph) % 2}`, x, y - 14 + Math.sin(t * 5) * 3) });
    }
    return out;
  },
});

// Feed the pond creatures and the sparrows from the bench with bird seed (3 free scoops a day).
register('targetProvider', 'mochi_feed_wildlife', {
  find(world, game) {
    if (AMB.map !== world.map.id || (!AMB.water.length && !AMB.birds.length)) return null;
    const p = world.player;
    let best = null;
    if (AMB.water.length) { let d = 1e9; for (const [x, y] of AMB.water) d = Math.min(d, Math.hypot(p.x - (x * TILE + 8), p.y - (y * TILE + 8))); if (d < 34) best = { label: 'Feed the ducks and koi', dist: Math.max(0, d - 18), run: (g) => feedPond(g, world) }; }
    else if (AMB.birds.length) { const b = AMB.birds.find((q) => Math.hypot(p.x - q.x, p.y - q.y) < 40 && q.st !== 'fly'); if (b) best = { label: 'Scatter some seed', dist: Math.hypot(p.x - b.x, p.y - b.y) - 20, run: (g) => feedBirds(g, b) }; }
    return best;
  },
});
function seed(game) {
  const s = ms(game);
  if (!game.has('bird_seed') && s.seedDay !== game.day) { s.seedDay = game.day; game.give('bird_seed', 3, true); game.toast('A scoop of bird seed from the bench bin', 'i_star'); }
  return game.take('bird_seed', 1);
}
function feedPond(game, world) {
  if (!seed(game)) return game.say('misa', 'neutral', 'Out of seed for today. The ducks give me a very disappointed look.');
  const p = world.player;
  for (const d of AMB.ducks) d.food = { x: Math.max(AMB.water[0][0] * 0 + 0, p.x), y: p.y };
  const near = AMB.water.reduce((a, [x, y]) => (Math.hypot(p.x - (x * TILE + 8), p.y - (y * TILE + 8)) < Math.hypot(p.x - a[0], p.y - a[1]) ? [x * TILE + 8, y * TILE + 8] : a), [1e9, 1e9]);
  for (const d of AMB.ducks) d.food = { x: near[0] + (d.seed - 1) * 8, y: near[1] };
  for (const k of AMB.koi) { k.tx = near[0] + (k.seed - 2) * 7; k.ty = near[1] + 3; k.surf = 3; }
  game.sfx('splash'); setTimeout(() => game.sfx('quack'), 500);
  game.addMood(3); game.stat('pondFed');
  const s = ms(game); if (s.duckDay !== game.day) { s.duckDay = game.day; game.addMood(3); }
  return game.say('misa', 'happy', ['Quack! Three ducks race over, and the orange koi crowd the surface with round open mouths.', 'The ducks paddle in a happy line. One koi blows me a bubble.'][game.day % 2]);
}
function feedBirds(game, b) {
  if (!seed(game)) return game.say('misa', 'neutral', 'No seed left for today. The sparrows seem to know it.');
  for (const q of AMB.birds) if (Math.hypot(q.x - b.x, q.y - b.y) < 70) { q.st = 'peck'; q.t = 3; q.x += (b.x - q.x) * 0.6; q.y += (b.y - q.y) * 0.6; }
  game.sfx('chirp'); game.addMood(3); game.stat('birdsFed');
  return game.say('misa', 'happy', 'Chirp, chirp! A whole flock of sparrows hops in for a feast, and one brave pigeon waddles up behind them.');
}

features('Animals', [
  'Daifuku the shiba (redrawn at 1:1) walks with Goro through Lantern Lane and the park, sits when Goro stops and naps from 1 to 3 PM',
  'Pet Daifuku or rub his belly; his tail wags faster when you are near',
  'Dog biscuits: Daifuku wolfs one down and Goro warms up to you',
  'Daifuku heart events: the fetch at the park, a Mochi-Daifuku standoff that ends in a truce, and a geode he digs up for you',
  'Kuro the grey kitten appears at the yard fence gap on rainy evenings from Spring 20 (side arc C, The Little Grey Visitor)',
  'Feed Kuro each evening: a Mochi-Kuro acceptance meter moves from hiss to watch to sniff to sharing a cushion',
  'After 7 evenings, choose to adopt Kuro (he lives at home and follows Mochi) or rehome him with Goro',
  'Kuro at home or at Goro\'s house: feed and pet him; he sleeps beside Mochi at night',
  'Five named stray cats (Hanako, Sumi, Yuki, Nezumi and Tux) with their own spots, hours and weather habits',
  'Cat album: meet, pet and treat each stray; three treats make a lasting friend and a small gift',
  'Park ducks paddle around the pond and race over when you scatter seed; koi glide under the surface',
  'Sparrows and pigeons hop and peck in the town square and flutter away if you run at them',
  'Butterflies drift over the park lawns in spring and summer',
  'Free scoops of bird seed each day at the park bench bin',
]);
