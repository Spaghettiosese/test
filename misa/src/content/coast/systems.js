// Coast & hill systems: shrine rituals (offering box, fortunes, ema wishes, bell, water basin), beach life
// (bonfire, sandcastles, tidepools), Captain Jun's boat ride, panoramic views, and the little interactions
// around the harbour, cave, lighthouse and Sunny Pines.
//
// Shared ids registered here: interactions offering_box, fortune_stand, ema_board, shrine_bell.
// Condition kinds: 'lucky' (the shrine smiled on you today). Bus events emitted: shrineOffering, fortuneDrawn,
// emaWritten, starMarkSeen, pinesVisit, boatRide.
import { register, registerMany, features, get } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { itemIcon } from '../../gfx/icons.js';
import { drawChar } from '../../gfx/chars.js';
import { sprite } from '../../artcache.js';
import { gradeAt, RAMPS as C } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';
import { tideAt, tideTableText } from './tides.js';
import { today, markToday, weekOf } from './util.js';

const say = (text, who = null, mood = 'neutral') => ({ t: 'say', who, mood, text });
const call = (fn) => ({ t: 'call', fn });
const jun = () => (get('npc', 'jun') ? 'jun' : null);
addCondKind('lucky', (g) => g.state.coast.luckyDay === g.day);
const makeLucky = (g) => { g.state.coast.luckyDay = g.day; };

// ======================= shrine =======================
const FORTUNES = {
  great: { name: 'Great blessing', c: C.ribbon[2], mood: 10, text: 'Great blessing! Everything you start today goes smoothly.' },
  good: { name: 'Blessing', c: C.butter[2], mood: 6, text: 'Blessing. A kind word from a friend is on its way.' },
  small: { name: 'Small blessing', c: C.mint[2], mood: 4, text: 'Small blessing. Little joys, one after another.' },
  future: { name: 'Future blessing', c: C.sky[2], mood: 3, text: 'Future blessing. Patience: good things are already growing.' },
  warning: { name: 'Gentle warning', c: C.lilac[2], mood: 0, text: 'A gentle warning. Take it slow, and carry an umbrella of kindness.' },
};
for (const [k, f] of Object.entries(FORTUNES)) {
  register('item', `key_fortune_${k}`, { name: `Fortune: ${f.name}`, desc: `Today's fortune slip from Hoshi Hill Shrine. ${f.text}`, cat: 'key', key: true, price: 0, icon: itemIcon('paper', { c: f.c }) });
}
const TOPICS = [
  ['Study', ['A quiet desk brings clear answers.', 'Review once more before bed.', 'Ask a friend; two heads are brighter.']],
  ['Friends', ['Someone wants to hear your news.', 'Share a snack and a smile.', 'An old friend thinks of you fondly.']],
  ['Fishing', ['The pier is lucky at dawn.', 'Patience brings the big one.', 'The tide will tell you when.']],
  ['Cooking', ['A pinch of salt saves the day.', 'Grandma\'s way is the right way.', 'Warm soup, warm heart.']],
  ['Home', ['Mochi has a surprise for you.', 'Open the windows and let the sea in.', 'A tidy room, a light heart.']],
];
const LUCKY = ['a sea shell', 'a red ribbon', 'warm tea', 'a paper star', 'a brass button', 'a melon bun', 'a blue pencil'];
const DIRS = ['north', 'east', 'south', 'west', 'toward the sea', 'up the hill'];

function drawFortune(g) {
  const st = g.state.coast;
  if (st.fortune && st.fortune.day === g.day) return g.run([say(`You already drew a fortune today: ${FORTUNES[st.fortune.tier].name}. Try again tomorrow!`)]);
  if (!g.spend(10)) return;
  const rng = g.rngFor('fortune'), lucky = g.check('lucky'), kinder = st.fortune && st.fortune.tier === 'future' && st.fortune.day === g.day - 1;
  let r = rng() - (lucky ? 0.12 : 0) - (kinder ? 0.15 : 0);
  const tier = r < 0.14 ? 'great' : r < 0.42 ? 'good' : r < 0.7 ? 'small' : r < 0.88 ? 'future' : 'warning';
  for (const k of Object.keys(FORTUNES)) if (g.has(`key_fortune_${k}`)) g.take(`key_fortune_${k}`, g.count(`key_fortune_${k}`));
  st.fortune = { day: g.day, tier };
  const f = FORTUNES[tier], [topic, lines] = TOPICS[Math.floor(rng() * TOPICS.length)];
  const steps = [
    { t: 'sfx', name: 'pop' }, say('You shake the hexagonal box until a numbered stick slides out, then open the matching drawer.'),
    { t: 'give', item: `key_fortune_${tier}` },
    say(f.text), say(`${topic}: ${lines[Math.floor(rng() * lines.length)]} Lucky item: ${LUCKY[Math.floor(rng() * LUCKY.length)]}. Lucky direction: ${DIRS[Math.floor(rng() * DIRS.length)]}.`),
    call((g2) => {
      g2.addMood(f.mood); g2.stat('fortunesDrawn'); g2.bus.emit('fortuneDrawn', { tier });
      if (tier === 'great') { makeLucky(g2); if (!g2.state.flags.speedBoost) { g2.state.flags.speedBoost = true; g2.state.coast.speedDay = g2.day; g2.toast('A spring in your step all day!', 'i_star'); } }
      if (tier === 'good') makeLucky(g2);
      if (tier === 'future') g2.toast('Tomorrow\'s fortune will be kinder.', 'i_star');
    }),
  ];
  if (tier === 'warning') steps.push({ t: 'choice', prompt: 'Tie it to the rope?', options: [
    { text: 'Tie it to the rope', steps: [say('You tie the slip to the rope and leave the worry behind. Lighter already!'), { t: 'take', item: 'key_fortune_warning' }, { t: 'mood', n: 4 }, call((g2) => { const s = g2.state.coast; if (s.tiedDay !== g2.day) { s.tiedDay = g2.day; s.tied = 0; } s.tied++; })] },
    { text: 'Keep it as a reminder', steps: [say('You fold it carefully into your pocket. Slow and steady.', 'misa', 'happy')] },
  ] });
  return g.run(steps);
}

const WISHES = ['That Mum and Dad stay safe at sea.', 'To make lots of good friends here.', 'Good grades this term!', 'That Mochi stays healthy and happy.', 'That the Star Lantern shines again.', 'That Grandma smiles every day.'];
const TOWN_EMA = [
  ['Kai', 'Win the spring cup. And beat Rina at something. Anything.'], ['Rina', 'Top of the class. Again. (And maybe one friend.)'],
  ['Hina', 'Find the legendary golden stag beetle!!'], ['Theo', 'Paint something that makes someone feel less alone.'],
  ['Suzu', 'Finish my novel before I turn sixteen.'], ['Sachiko', 'That my son calls more often.'], ['Pip', 'Every letter finds its way home.'],
  ['Kiko', 'One limited pudding. Just one. Please.'], ['A child', 'A puppy!!! (a big one)'], ['Unsigned', 'That the old friends forgive each other.'],
];
function emaBoard(g) {
  const st = g.state.coast, wk = weekOf(g.day), canWrite = st.wishWeek !== wk;
  g.run([{ t: 'choice', prompt: 'The ema board', options: [
    { text: canWrite ? 'Write a wish (20 coins)' : 'Write a wish (next week)', steps: [call((g2) => {
      if (!canWrite) return g2.say(null, 'neutral', 'You already hung a wish this week. Wishes need a little time to grow.');
      if (!g2.spend(20)) return null;
      return g2.run([{ t: 'choice', prompt: 'What do you wish for?', options: WISHES.slice(0, 5).map((w, i) => ({ text: w.length > 34 ? w.slice(0, 31) + '...' : w, steps: [call((g3) => {
        const text = WISHES[i];
        g3.state.coast.wishes.push({ week: wk, text }); g3.state.coast.wishWeek = wk;
        g3.addMood(8); g3.stat('emaWritten'); g3.bus.emit('emaWritten', { text }); g3.sfx('chime');
        return g3.run([say('You write your wish on a little wooden plaque and hang it with the others.'), say(`"${text}"`, 'misa', 'happy')]);
      })] })) }]);
    })] },
    { text: 'Read the wishes', steps: [call((g2) => {
      const rng = g2.rngFor('ema'), picks = [...TOWN_EMA].sort(() => rng() - 0.5).slice(0, 2);
      const mine = g2.state.coast.wishes.slice(-1)[0];
      return g2.run([...picks.map(([who, w]) => say(`${who}: "${w}"`)), ...(mine ? [say(`And yours, still hanging there: "${mine.text}"`)] : [])]);
    })] },
    { text: 'Leave', steps: [] },
  ] }]);
}

registerMany('interaction', {
  offering_box: {
    label: 'Make an offering',
    run: (g) => g.run([{ t: 'choice', prompt: 'Toss a coin and pray?', options: [5, 10, 50].map((n) => ({ text: `Offer ${n} coins`, when: `money>=${n}`, steps: [call((g2) => {
      if (!g2.spend(n)) return null;
      const pure = today(g2, 'purified'), first = !today(g2, 'offering');
      markToday(g2, 'offering');
      g2.sfx('coin'); g2.stat('shrineOfferings');
      if (first) g2.addMood(n >= 50 ? 8 : n >= 10 ? 4 : 2) ;
      if (pure && first) g2.addMood(2);
      if (n >= 10) makeLucky(g2);
      g2.bus.emit('shrineOffering', { n });
      return g2.run([{ t: 'emote', who: 'misa', icon: 'heart' }, say('Bow twice, clap twice, bow once. The coin clinks into the box.'),
        say(n >= 10 ? 'A warm breeze ruffles the paper streamers. You feel lucky today.' : 'The shrine feels calm and quiet. So do you.'), ...(pure ? [say('Your hands are still cool from the water basin. A proper visit!')] : [])]);
    })] })).concat([{ text: 'Just bow', steps: [say('You bow politely. The bells on the eaves tinkle in the wind.')] }]) }]),
  },
  fortune_stand: { label: 'Draw a fortune (10 coins)', run: drawFortune, sprFn: undefined },
  ema_board: { label: 'Ema board', run: emaBoard, sprFn: (g) => `coast_ema_${Math.min(3, g.state.coast.wishes.length)}` },
  shrine_bell: {
    label: 'Ring the bell',
    run: (g) => {
      g.sfx('bell'); g.stat('shrineBells');
      if (!today(g, 'bell')) { markToday(g, 'bell'); g.addMood(3); }
      const night = g.minutes >= 23 * 60;
      g.run([say(night ? 'The bell rings out over the sleeping town. The stars seem to listen.' : 'Clang clang! The deep bell rings out over Hoshi Hill.')]);
    },
  },
});

// ======================= beach life =======================
const POOL_LIFE = [
  ['hermit', 'A hermit crab shuffles between two shells, trying them on.'], ['star', 'A red sea star clings to the rock like a sticker.'],
  ['anemone', 'Green anemones wave their tiny arms in the current.'], ['goby', 'A little goby darts under a pebble and peeks out.'],
  ['slug', 'A purple sea slug glides by like a ribbon.'], ['urchin', 'A spiky sea urchin sits perfectly still.'],
  ['shrimp', 'Clear little shrimp tick-tock across the sand.'], ['limpet', 'Limpets hold on tight, like tiny hats.'],
  ['crab', 'A shore crab raises one claw at you. Rude!'], ['snail', 'A turban snail climbs slowly up the wall of the pool.'],
  ['octopus', 'An octopus! It changes colour and squeezes into a crack. Wow!'], ['seahorse', 'A tiny seahorse holds on to the seaweed with its tail. Magic.'],
];
function peekPool(g, o) {
  const rng = g.rngFor('pool' + (o ? o.x * 7 + o.y : 0)), lucky = g.check('lucky');
  const pool = lucky ? POOL_LIFE : POOL_LIFE.slice(0, 10);
  const [id, text] = pool[Math.floor(rng() * pool.length)];
  const first = g.collect('tidepool', id);
  g.stat('tidepoolPeeks');
  g.run([say(text), ...(first ? [call((g2) => { g2.toast(`New tidepool friend! (${Object.keys(g2.state.collections.tidepool || {}).length}/12)`, 'i_star'); g2.addMood(3); g2.addXP('fishing', 2); })] : [])]);
}
const fireLit = (g) => g.minutes >= 18 * 60 && g.minutes < 23.5 * 60 && g.weather !== 'rain' && g.weather !== 'storm';
const castleOf = (g) => { const c = g.state.coast.castle; return c && c.day === g.day ? c : null; };

registerMany('interaction', {
  coast_tidepool: { label: 'Peek into the tidepool', run: peekPool },
  coast_bonfire: {
    label: (g) => (fireLit(g) ? 'Warm up by the fire' : 'Bonfire pit'),
    sprFn: (g) => (fireLit(g) ? `coast_bonfire_${Math.floor(g.clock * 6) % 3}` : 'coast_bonfire_off'),
    run: (g) => {
      if (!fireLit(g)) return g.say(null, 'neutral', 'A ring of stones and charred driftwood. Fishermen light it in the evenings.');
      const first = !today(g, 'bonfire'); markToday(g, 'bonfire');
      return g.run([say('You hold your hands out to the crackling fire. Sparks drift up toward the stars.'), { t: 'time', add: 30 },
        call((g2) => { if (first) { g2.addMood(6); g2.addEnergy(8); } })]);
    },
  },
  coast_castle: {
    label: (g) => (castleOf(g) ? (castleOf(g).stage < 3 ? 'Add to the sandcastle' : 'Admire the sandcastle') : 'Build a sandcastle'),
    sprFn: (g) => { const c = castleOf(g); return c ? `coast_castle_${c.stage}` : null; },
    run: (g) => {
      const c = castleOf(g);
      if (c && c.stage >= 3) return g.say(null, 'neutral', 'Three towers and a flag. The finest castle on Shell Beach! (Until the tide comes in.)');
      if (g.check('tide:high')) return g.say(null, 'neutral', 'The waves are reaching right up the sand. Better wait for the tide to go out.');
      if (!g.useEnergy(5)) return null;
      g.state.coast.castle = { day: g.day, stage: c ? c.stage + 1 : 1 };
      g.advance(20); g.addMood(4); g.stat('sandcastles'); g.sfx('dig');
      return g.say(null, 'neutral', ['You pat the wet sand into a sturdy little keep.', 'Two tall towers rise on either side!', 'A shell for a door and a flag on top. Finished!'][g.state.coast.castle.stage - 1]);
    },
  },
});

// ======================= panoramas (backdrops) =======================
function skyCols(game) {
  const h = (game.minutes / 60) % 24;
  if (h < 5 || h >= 20) return { top: '#0e0c24', mid: '#1b1b3a', low: '#2e2a5a', night: true };
  if (h < 7) return { top: '#6a5a9a', mid: '#f4a08a', low: '#ffd8a8' };
  if (h >= 17.5) return { top: '#4a3a7a', mid: '#e0707a', low: '#ffb070' };
  return { top: '#7fc8f0', mid: '#a8dcf5', low: '#d4f0fa' };
}
const band = (g, y0, y1, c0, c1) => {
  for (let y = y0; y < y1; y++) { const t = (y - y0) / (y1 - y0); for (let x = 0; x < 320; x += 4) { g.fillStyle = hash(x >> 2, y, 3) < t ? c1 : c0; g.fillRect(x, y, 4, 1); } }
};
// The bay: sky, hills with the town and shrine, the headland lighthouse and the sea. `pan` scrolls the far layers.
export function drawBay(g, game, t, pan = 0, horizon = 112) {
  const sk = skyCols(game), season = game.season;
  band(g, 0, horizon / 2, sk.top, sk.mid); band(g, horizon / 2, horizon, sk.mid, sk.low);
  if (sk.night) for (let i = 0; i < 70; i++) { g.fillStyle = (Math.floor(t * 2) + i) % 7 ? '#fffaf0' : '#8a7fb0'; g.fillRect((i * 83 + Math.floor(pan * 0.1)) % 320, (i * 37) % (horizon - 20), 1, 1); }
  else { g.fillStyle = '#fffaf0'; for (let i = 0; i < 4; i++) { const x = ((i * 97 + t * 4 - pan * 0.2) % 380) - 40; g.fillRect(Math.round(x), 18 + i * 9, 30, 4); g.fillRect(Math.round(x) + 6, 15 + i * 9, 16, 3); } }
  const moonX = 250, moonY = 26; g.fillStyle = sk.night ? '#fff1d6' : '#fffbe0';
  for (let y = -7; y <= 7; y++) { const w = Math.floor(Math.sqrt(49 - y * y)); g.fillRect(moonX - w, moonY + y, w * 2 + 1, 1); }
  // far hills and Hoshi Hill with the shrine
  const hill = (seed, base, amp, col, par) => { g.fillStyle = col; for (let x = 0; x < 320; x++) { const wx = x + pan * par; const h = base - amp * (0.5 + 0.5 * Math.sin(wx * 0.013 + seed)) - 8 * Math.sin(wx * 0.041 + seed * 2); g.fillRect(x, Math.round(h), 1, horizon - Math.round(h)); } };
  const night = sk.night, leaf = season === 'autumn' ? C.leafAutumn : C.leaf;
  hill(1, horizon - 26, 22, night ? '#262448' : '#8aa8c8', 0.15);
  hill(4, horizon - 10, 16, night ? '#1e2a34' : leaf[1], 0.3);
  // town roofs along the shore
  for (let i = 0; i < 26; i++) {
    const x = Math.round(((i * 23 - pan * 0.45) % 640 + 640) % 640) - 160; if (x < -20 || x > 320) continue;
    const w = 14 + (i % 3) * 4, hgt = 8 + (i % 4) * 3, y = horizon - hgt;
    g.fillStyle = night ? '#2a2640' : ['#f0dcc8', '#d9bfa8', '#fff4e8'][i % 3]; g.fillRect(x, y, w, hgt);
    g.fillStyle = night ? '#1e1830' : [C.roofRed[2], C.roofSlate[2], C.roofTeal[2]][i % 3]; g.fillRect(x - 1, y - 4, w + 2, 4);
    if (night && i % 2) { g.fillStyle = '#ffd76a'; g.fillRect(x + 4, y + 3, 3, 3); }
  }
  // torii on the hill
  const tx = Math.round(((120 - pan * 0.3) % 640 + 640) % 640) - 160;
  g.fillStyle = C.vermilion[2]; g.fillRect(tx, horizon - 36, 2, 9); g.fillRect(tx + 9, horizon - 36, 2, 9); g.fillRect(tx - 2, horizon - 37, 15, 2);
  // lighthouse on the headland
  const lx = Math.round(((300 - pan * 0.5) % 700 + 700) % 700) - 200;
  g.fillStyle = night ? '#24203a' : C.stone[2]; g.fillRect(lx - 30, horizon - 8, 70, 8);
  for (let y = 0; y < 34; y++) { g.fillStyle = Math.floor(y / 6) % 2 ? C.ribbon[2] : '#fffaf0'; if (night) g.fillStyle = Math.floor(y / 6) % 2 ? '#5a2a3a' : '#5a5878'; const w = 4 + Math.floor(y / 8); g.fillRect(lx - w, horizon - 42 + y, w * 2, 1); }
  const lit = game.flag('lantern_lit');
  g.fillStyle = lit ? '#ffd76a' : '#3a3850'; g.fillRect(lx - 3, horizon - 48, 6, 6); g.fillStyle = '#262436'; g.fillRect(lx - 4, horizon - 50, 8, 2);
  if (lit && (night || sk.top === '#4a3a7a')) { const a = t * 0.8, dx = Math.cos(a); g.fillStyle = 'rgba(255,240,180,0.25)'; for (let k = 0; k < 90; k++) { const x = lx + Math.round(dx * k * 2), sp = Math.floor(k / 8); g.fillRect(x, horizon - 45 - sp, 2, sp * 2 + 2); } }
  // sea with depth bands and sliding glints
  const W = C.water;
  band(g, horizon, horizon + 30, night ? '#1a2a4a' : W[3], night ? '#16223e' : W[2]);
  band(g, horizon + 30, 224, night ? '#16223e' : W[2], night ? '#101a32' : W[1]);
  for (let i = 0; i < 60; i++) { const y = horizon + 3 + ((i * 29) % (224 - horizon)), x = ((i * 53 + t * (8 + (y - horizon) * 0.3) - pan) % 340 + 340) % 340 - 10; g.fillStyle = night ? '#4a5a8a' : W[4]; g.fillRect(Math.round(x), y, 3 + (i % 3), 1); }
  if (!night) for (let i = 0; i < 3; i++) { const x = Math.round(((i * 110 + t * 18) % 360) - 20), y = 40 + i * 12 + Math.round(Math.sin(t * 3 + i) * 2); g.fillStyle = '#fffaf0'; g.fillRect(x, y, 3, 1); g.fillRect(x + 3, y - 1, 3, 1); g.fillRect(x + 6, y, 3, 1); }
}

let rideEvent = null;
register('backdrop', 'coast_boatride', {
  draw(g, game, t) {
    drawBay(g, game, t, t * 22, 104);
    // sightings
    if (rideEvent === 'dolphins' || rideEvent === 'whale') {
      const k = (t * 30) % 420 - 50;
      g.fillStyle = C.sky[0];
      if (rideEvent === 'dolphins') for (let i = 0; i < 3; i++) { const x = Math.round(300 - k + i * 22), y = 140 + Math.round(Math.sin(t * 4 + i) * 6); g.fillRect(x, y, 14, 4); g.fillRect(x + 4, y - 3, 3, 3); }
      else { const x = Math.round(330 - k * 0.6); g.fillRect(x, 132, 46, 7); g.fillStyle = '#fffaf0'; g.fillRect(x + 8, 120 + Math.round(Math.sin(t * 5) * 2), 2, 10); g.fillRect(x + 4, 118, 10, 2); }
    }
    // the Sayori's bow with Misa and the captain
    const bob = Math.round(Math.sin(t * 2.2) * 2);
    const img = sprite('coast_sayori');
    g.drawImage(img, 70, 150 + bob);
    drawChar(g, 'misa', null, 'right', 'idle', t, 160, 172 + bob);
    if (get('npc', 'jun')) drawChar(g, 'jun', get('npc', 'jun').look, 'right', 'idle', t + 1, 112, 168 + bob);
    // spray
    g.fillStyle = '#e8fbff'; for (let i = 0; i < 8; i++) g.fillRect(190 + ((i * 7 + Math.floor(t * 20)) % 24), 196 + bob - ((i * 3) % 6), 2, 1);
  },
});
register('backdrop', 'coast_lookout', { draw(g, game, t) { drawBay(g, game, t, t * 3, 120); g.fillStyle = C.wood[1]; g.fillRect(0, 206, 320, 4); g.fillStyle = C.wood[3]; g.fillRect(0, 204, 320, 2); for (let x = 8; x < 320; x += 52) { g.fillStyle = C.wood[2]; g.fillRect(x, 196, 5, 28); } } });
register('backdrop', 'coast_bayview', {
  draw(g, game, t) {
    drawBay(g, game, t, -120 + Math.sin(t * 0.3) * 30, 100);
    g.fillStyle = '#141220'; for (let y = 0; y < 224; y++) { const w = Math.floor(Math.max(0, 160 - Math.sqrt(Math.max(0, 140 * 140 - (y - 112) * (y - 112))) * 1.15)); g.fillRect(0, y, w, 1); g.fillRect(320 - w, y, w, 1); }
  },
});

function boatRide(g) {
  const fare = g.check('friend:jun>=4') ? 0 : 60;
  if (g.weather === 'storm') return g.say(jun(), 'sad', 'Not in this weather, lass. The Sayori stays tied up when the sea is angry.');
  if (g.minutes < 7 * 60 || g.minutes >= 18 * 60) return g.say(null, 'neutral', 'The Sayori is tied up for the night, rocking gently against the dock.');
  return g.run([{ t: 'choice', prompt: fare ? `A trip around the bay? (${fare} coins)` : 'A trip around the bay? (free for friends)', options: [
    { text: 'All aboard!', when: `money>=${fare}`, steps: [call((g2) => {
      if (fare && !g2.spend(fare)) return null;
      const rng = g2.rngFor('ride'), r = rng() - (g2.check('lucky') ? 0.2 : 0);
      rideEvent = r < 0.15 ? 'whale' : r < 0.45 ? 'dolphins' : null;
      const J = jun();
      const lines = [
        say('Cast off! Hold on to your hat.', J, 'happy'), { t: 'wait', dur: 1.5 },
        say('See the lighthouse up on the headland? The Star Lantern. Dark for twenty years now.', J, 'neutral'), { t: 'wait', dur: 1.2 },
        say(['The town looks so small from out here!', 'You can see the shrine torii on the hill!', 'The water is so clear...'][Math.floor(rng() * 3)], 'misa', 'happy'),
      ];
      if (rideEvent === 'dolphins') lines.push({ t: 'wait', dur: 1 }, say('Dolphins off the bow! They like the Sayori, they do.', J, 'surprised'), call((g3) => g3.collect('sightings', 'dolphins')));
      if (rideEvent === 'whale') lines.push({ t: 'wait', dur: 1.5 }, say('Well I never... a whale! Forty years at sea and they still take my breath away.', J, 'surprised'), call((g3) => g3.collect('sightings', 'whale')));
      lines.push({ t: 'wait', dur: 1.2 }, say('And home we go. Same time next week?', J, 'happy'));
      return g2.run([{ t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name: 'coast_boatride' }, { t: 'fade', to: 0, dur: 0.4 }, ...lines,
        { t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name: null }, { t: 'time', add: 60 },
        call((g3) => { g3.addMood(10); g3.state.coast.rides++; g3.stat('boatRides'); if (get('npc', 'jun')) g3.addFriend('jun', 15); g3.bus.emit('boatRide', { sighting: rideEvent }); }),
        { t: 'fade', to: 0, dur: 0.4 }]);
    })] },
    { text: 'Maybe later', steps: [] },
  ] }]);
}

function viewScene(name, lines) {
  return (g) => g.run([{ t: 'fade', to: 1, dur: 0.3 }, { t: 'scene', name }, { t: 'fade', to: 0, dur: 0.3 }, ...lines(g).map((s) => say(s)),
    { t: 'fade', to: 1, dur: 0.3 }, { t: 'scene', name: null }, { t: 'time', add: 15 }, call((g2) => { if (!today(g2, name)) { markToday(g2, name); g2.addMood(5); } }), { t: 'fade', to: 0, dur: 0.3 }]);
}
const lookoutLines = (g) => {
  const h = g.minutes / 60, s = g.season;
  return [h >= 20 || h < 5 ? 'The whole town twinkles below you, and the stars twinkle back.' : h >= 17.5 ? 'The sun melts into the bay, turning every roof gold.' : 'Hoshimori Bay spreads out below: the harbour, the beach, the lighthouse on its headland.',
    { spring: 'Petals drift past on the breeze.', summer: 'Cicadas buzz in the pines behind you.', autumn: 'The hill below is a quilt of red and gold.', winter: 'Your breath puffs white. Everything is so quiet.' }[s]];
};

// ======================= generic look-and-do interactions =======================
const look = (label, text) => ({ label, run: (g) => g.run((Array.isArray(text) ? text : [text]).map((x) => say(typeof x === 'function' ? x(g) : x))) });
const once = (key, label, text, fx) => ({ label, run: (g) => { const first = !today(g, key); markToday(g, key); if (first) fx(g); g.run([say(first ? text : 'You already did that today. Lovely, though.')]); } });

registerMany('interaction', {
  coast_boat: { label: 'Board the Sayori', run: boatRide },
  coast_lookout: { label: 'Take in the view', run: viewScene('coast_lookout', lookoutLines) },
  coast_binoculars: { label: 'Look through the binoculars (10 coins)', run: (g) => { if (!g.spend(10)) return null; g.sfx('coin'); return viewScene('coast_bayview', (g2) => [g2.flag('lantern_lit') ? 'The Star Lantern shines on the headland, proud as anything.' : 'You spot the dark lighthouse, gulls on the breakwater, and a fishing boat far out.', tideAt(g2) === 'low' ? 'The tide is out: a pale sandbar curls into the sea off Shell Beach.' : 'Waves roll in, row after row.'])(g); } },
  coast_tideboard: { label: 'Read the tide table', run: (g) => g.run(tideTableText(g).map((s) => say(s))) },
  coast_mural: { label: 'Look at the mural', run: (g) => g.run([say({ spring: 'A whale swims through a night full of stars, with sakura petals painted drifting down.', summer: 'A whale swims through a night full of stars under a big painted sun.', autumn: 'A whale swims through a night full of stars, with red maple leaves around a harvest moon.', winter: 'A whale swims through a night full of stars, with a little snowman waving on the shore.' }[g.season]),
    say(g.check('friend:theo>=3') ? 'Theo touches it up every season. In the corner, small letters: TP.' : 'In the corner, small letters: TP. Somebody here is very talented.')]) },
  coast_starmark: { label: 'Look at the carving', run: (g) => { g.setFlag('seen_star_mark'); g.bus.emit('starMarkSeen', {}); g.run([say('A five-pointed star is carved deep into the rock, worn smooth by years of tides.'), say('Underneath, two letters: H.A.'), say('H.A.... Hana Aoki? Grandma was here!', 'misa', 'surprised')]); } },
  coast_chozuya: once('purified', 'Purify your hands', 'You ladle cool water over your left hand, then your right. Refreshing!', (g) => { g.addMood(2); g.addEnergy(3); }),
  coast_echo: look('Call into the dark', ['Hellooo!', '...hellooo... ellooo... ooo...', (g) => (g.check('tide:low') ? 'Somewhere deep inside, water drips in time with your heartbeat.' : 'Water gurgles in the dark.')]),
  coast_crystal: look('Look at the crystals', 'Pale crystals glitter in the rock, glowing faintly lilac in the dark.'),
  coast_seastuff: look('Look', (g) => ['Crates of today\'s catch, packed in ice. Smells like the sea!', 'Nets drying in the sun, dotted with bright floats.', 'A red and white buoy rocks on the waves.'][Math.floor(hash(g.day, 1, 5) * 3)]),
  coast_lifering: look('Life ring', 'A bright life ring hangs by the pier. "Safety first!" is painted on its post.'),
  coast_komainu: look('Guardian statue', 'A stone lion-dog guards the shrine. One has its mouth open, the other closed: the beginning and the end of all things.'),
  coast_office: look('Shrine office', (g) => (g.minutes >= 8 * 60 && g.minutes < 17 * 60 ? 'Charms for study, health, safe travels and love are lined up behind the window.' : 'The shutters are closed. A note says: back at 8.')),
  coast_marker: look('Stone marker', 'HOSHI HILL SHRINE. The old stone is soft with moss.'),
  // lighthouse
  coast_coat: look('Old keeper\'s coat', ['A heavy navy coat with brass buttons, hung with care.', 'One button is missing near the hem. Just a few loose threads left.']),
  coast_stove: once('lhstove', 'Warm up at the stove', 'You warm your hands at the little iron stove. Toasty.', (g) => g.addEnergy(5)),
  coast_chart: look('Chart of the bay', 'An old chart of Hoshimori Bay. The headland is circled in red, with a tiny star drawn beside it.'),
  coast_foghorn: { label: 'Foghorn', run: (g) => { g.sfx('thunder'); g.run([say('BWOOOOM! The whole tower shakes. Somewhere, a gull complains loudly.')]); } },
  coast_balcony: { label: 'Look out over the bay', run: viewScene('coast_bayview', (g) => [g.flag('lantern_lit') ? 'Behind you the great lens hums with light. Its beam sweeps the whole bay.' : 'The wind is strong up here. The town is tiny, the sea enormous.', g.minutes >= 19 * 60 ? 'Lamps are lighting up all along the harbour, one by one.' : 'Fishing boats leave little white trails across the blue.']) },
  coast_porthole: look('Window', (g) => (g.weather === 'rain' || g.weather === 'storm' ? 'Rain streams down the round glass. The sea is grey and wild.' : 'Through the round window: nothing but sea and sky.')),
  // Sunny Pines
  coast_tea: once('pinestea', 'Have a cup of tea', 'You pour a cup of roasted green tea from the big pot. Warm and nutty.', (g) => { g.addEnergy(12); g.addMood(3); }),
  coast_lunch: { label: 'Dining counter', run: (g) => {
    if (g.minutes < 11.5 * 60 || g.minutes >= 13.5 * 60) return g.say(null, 'neutral', 'The menu board says: lunch from 11:30 to 1:30. Today: grilled fish, miso soup and pickles.');
    if (today(g, 'pineslunch')) return g.say(null, 'neutral', 'You already had lunch here today. The staff wave from the kitchen.');
    markToday(g, 'pineslunch'); g.addEnergy(25); g.addMood(4); g.sfx('eat');
    return g.say(null, 'neutral', 'The cook hands you a tray: "Hana\'s granddaughter eats for free!" Grilled fish, miso soup and pickles.');
  } },
  coast_piano: { label: 'Play the piano', run: (g) => { g.sfx('chime'); if (!today(g, 'piano')) { markToday(g, 'piano'); g.addMood(4); } g.run([say('You pick out a simple tune. Some of the residents hum along, and someone claps.')]); } },
  coast_shogi: look('Shogi board', ['Two residents are deep in a game of shogi.', '"Don\'t tell him," one whispers to you, "but I\'ve been losing on purpose for ten years."']),
  coast_fishtank: look('Fish tank', 'A goldfish named Captain and a little red fish named Admiral circle the castle.'),
  coast_tv: { label: 'Watch the forecast', run: (g) => g.run([say(`The weather lady smiles: "Tomorrow in Hoshimori Bay: ${{ sunny: 'sunny skies', cloudy: 'clouds', rain: 'rain, so bring an umbrella', storm: 'thunderstorms, stay cosy', snow: 'snow', windy: 'strong winds' }[g.state.tomorrowWeather] || 'a bit of everything'}."`)]) },
  coast_guestbook: { label: 'Sign the guestbook', run: (g) => {
    const first = !today(g, 'guestbook'); markToday(g, 'guestbook');
    if (first) { g.stat('pinesVisits'); g.bus.emit('pinesVisit', {}); }
    g.run([say(first ? `You sign the visitors book: "Misa Aoki, visiting Grandma Hana." That makes ${g.state.stats.pinesVisits || 1} visit${(g.state.stats.pinesVisits || 1) > 1 ? 's' : ''}!` : 'Your name is already in the book for today.')]);
  } },
  coast_photos: look('Photos', ['Old photos: Grandma young and laughing on the beach, a baby in a sun hat, and...', 'A lighthouse with two people waving from the balcony. On the back: 1985.']),
  coast_albums: look('Photo albums', 'Albums labelled by year. The residents love showing visitors their grandchildren.'),
  coast_plant: look('Plant', 'A big leafy plant, very well looked after.'),
});

features('Shrine', [
  'Offering box: toss 5, 10 or 50 coins and pray for a small mood boost and a lucky day',
  'Fortune stand: draw one fortune slip a day (five kinds) with a topic, lucky item and lucky direction',
  'Great fortunes give a spring in your step (walk faster all day); kind fortunes make you lucky',
  'Tie a gentle-warning fortune to the rope to leave your worries behind; the rope fills up with slips',
  'Ema board: hang one wooden wish plaque a week, and your plaques stay on the board',
  'Read the townsfolk\'s wishes on the ema board',
  'Ring the shrine bell for a little cheer',
  'Purify your hands at the water basin before praying for an extra blessing',
  'Hoshi Hill lookout: sit and take in a panoramic view of the bay that changes with the time and season',
]);
features('Coast & tides', [
  'Captain Jun\'s boat ride: a trip around the bay on the Sayori with a scrolling sea backdrop',
  'Spot dolphins or even a whale on boat rides (luckier on lucky days)',
  'Tidepools to peek into, with 12 sea creatures to discover',
  'Bonfire pit on the beach, lit in the evenings: warm up for energy and cozy',
  'Build a sandcastle in three stages; the high tide washes it away',
  'Coin binoculars on the pier show the whole bay',
  'Theo\'s mural on the harbour wall changes with the seasons',
  'Hana\'s carved star mark hidden in the tidepool cave',
]);
features('Lighthouse & Sunny Pines', [
  'Lighthouse keeper\'s rooms: old coat, iron stove, bay chart and a foghorn you can sound',
  'Lighthouse balcony view over the whole bay',
  'Sunny Pines: free tea in the lounge and a free lunch at the dining counter',
  'Sunny Pines: play the piano, watch the residents\' shogi game and the fish tank',
  'Sunny Pines TV shows tomorrow\'s weather forecast',
  'Sunny Pines guestbook counts your visits to Grandma',
  'Grandma\'s room with her armchair, quilt and old photos',
]);
