// Seasonal mini events ("moments"): six small Stardew-like days that are not full festivals (no bunting, no holiday).
// Each is a dated spot you walk up to in the right hours: first firefly night, blossom picnic, kite breeze day, sea glass
// dawn, maple stroll, snow fort day. Flag sv2m_<id> is raised for the day (townspeople gather via schedule plans).
// Also owns the glow layer (moon jellies on the beach, fireflies at the pond) and the jelly/firefly lights.
import { register, get, features } from '../../core/registry.js';
import { parseHM } from '../../core/time.js';
import { reaction } from '../../systems/social.js';
import { spotPos } from '../../systems/festivals.js';
import { S, say, N, call, nameOf, has, scene, endScene, souvenir, doneToday, markDone, momentsToday, MOMENT_DATES } from './data.js';
import { pickItem } from './scenes.js';
import { addSchedulePlans } from './pieces.js';

const exists = (id) => !!get('npc', id);
const hearts = (g, min = 2) => ['kai', 'suzu', 'rina', 'theo', 'hina', 'mika', 'goro', 'kiko', 'jun', 'hana'].filter((id) => exists(id) && g.hearts(id) >= min).sort((a, b) => g.hearts(b) - g.hearts(a)).slice(0, 5);
function moment(g, id) { const s = S(g); markDone(g, id); s.plays[id] = (s.plays[id] || 0) + 1; g.stat('miniMoments'); g.bus.emit('sv2Moment', { id }); }

const MOMENTS = [
  { id: 'sv2_picnic', name: 'Blossom Picnic', map: 'park', spot: 'sakura_tree', dx: 2, dy: 1, hours: ['10:00', '17:00'], label: 'Blossom picnic', hint: 'Blossom Picnic: sakura tree in the park, daytime',
    async run(g) {
      let who = null;
      const cands = hearts(g, 2);
      await g.run([N('A patch of grass under the sakura, warm sun, and petals drifting down like slow snow.'), { t: 'choice', prompt: 'Who joins the picnic?', options: [...cands.map((id) => ({ text: `${nameOf(id)} (${g.hearts(id)} hearts)`, steps: [call(() => { who = id; })] })), { text: 'Just Mochi and me', steps: [call(() => { who = 'mochi'; })] }, { text: 'Not now', steps: [] }] }]);
      if (!who) return;
      const dish = await pickItem(g, { title: 'Picnic food', prompt: 'Bring something to share? (optional)', filter: (id, it) => it.cat === 'food' && !id.startsWith('ing_'), confirmLabel: 'SHARE IT', cancelLabel: 'NOTHING' });
      moment(g, 'sv2_picnic');
      let pts = 35, tail = 'The two of you lie back and watch the petals fall.';
      if (dish) { g.take(dish, 1); }
      if (who !== 'mochi' && dish) { const r = reaction(get('npc', who), dish); pts = { love: 80, like: 55, neutral: 35, dislike: 15, hate: 5 }[r]; tail = r === 'love' || r === 'like' ? `${nameOf(who)} takes a bite and smiles: "This is perfect."` : r === 'neutral' ? `${nameOf(who)} nibbles politely. "Thank you for sharing."` : `${nameOf(who)} chews bravely. "It is... something."`; }
      await g.run([...scene('hanami'), who === 'mochi' ? N('Mochi sniffs the basket, steals the best bite, and falls asleep on the blanket.') : say(who, 'happy', 'A picnic under the blossoms. I could get used to this.'), N(tail), say('misa', 'happy', 'Moments like this are the best part of spring.'), ...endScene]);
      if (who !== 'mochi') g.addFriend(who, pts); g.addMood(14); g.addEnergy(8);
    } },
  { id: 'sv2_kite', name: 'Kite Breeze Day', map: 'beach', spot: 'sandbar', dy: -1, hours: ['10:00', '17:00'], label: 'Fly a kite', hint: 'Kite Breeze Day: the sandbar on Shell Beach',
    async run(g) {
      const wind = g.weather === 'windy' ? 0.3 : 0;
      let col = null;
      await g.run([N('The wind off the bay is perfect today. A stall on the sandbar lends out paper kites.'), { t: 'choice', prompt: 'Pick a kite', options: ['Red dragon', 'Blue whale', 'Yellow sun'].map((c) => ({ text: c, steps: [call(() => { col = c; })] })) }]);
      moment(g, 'sv2_kite');
      const up = g.rng() < 0.55 + wind;
      await g.run([...scene('sv2_kite'), N(`You run along the sand. The ${col.toLowerCase()} kite catches the wind and shivers.`), ...(up ? [N('It climbs! Higher! The string hums in your fingers.'), say('misa', 'happy', 'It is flying! Look, it is really flying!'), { t: 'xp', skill: 'charm', n: 8 }] : [N('It dips, spins, and lands nose-first in the sand. A passing seagull inspects it.'), say('misa', 'happy', 'Okay. Practice run. Round two!'), { t: 'xp', skill: 'charm', n: 3 }]), ...endScene]);
      g.addMood(up ? 14 : 8); g.addEnergy(-4); souvenir(g, 'gift_sv2_kite_charm');
    } },
  { id: 'sv2_firefly', name: 'First Firefly Night', map: 'park', spot: 'pond_edge', dy: 1, hours: ['19:30', '23:00'], label: 'Watch the first fireflies', hint: 'First Firefly Night: the park pond, after 7:30 PM',
    async run(g) {
      await g.run([...scene('sv2_firefly'), N('The pond goes quiet. Then, one green spark. Then ten. Then a whole drifting constellation.'), say('hina', 'happy', 'First firefly night! They come the same evening every year, like they have a calendar.'),
        { t: 'choice', prompt: 'Misa...', options: [{ text: 'Catch one in a jar', steps: [call((gg) => { if (has('bug_firefly')) gg.give('bug_firefly', 1); }), say('misa', 'happy', 'Hello, little light. You can go home after the show.')] }, { text: 'Just watch quietly', steps: [N('You sit on the grass and let the lights drift past.'), { t: 'energy', n: 10 }] }] }, ...endScene]);
      moment(g, 'sv2_firefly'); g.addFriend('hina', 22); g.addMood(14); souvenir(g, 'gift_sv2_firefly_charm');
    } },
  { id: 'sv2_seaglass', name: 'Sea Glass Dawn', map: 'beach', spot: 'shore', dy: 1, hours: ['06:00', '09:30'], label: 'Search the tide line', hint: 'Sea Glass Dawn: Shell Beach tide line, early morning',
    async run(g) {
      moment(g, 'sv2_seaglass');
      const pool = ['shell_glass_green', 'shell_glass_blue', 'shell_glass_pink', 'shell_cowrie', 'shell_conch'].filter(has), found = [];
      for (let i = 0; i < 2 + (g.rng() < 0.4 ? 1 : 0); i++) found.push(pool[Math.floor(g.rng() * pool.length)]);
      if (g.rng() < 0.12 && has('shell_pearl')) found.push('shell_pearl');
      await g.run([...scene('sunrise'), N('The tide has gone out and left a line of glittering things behind. Sea glass, tumbled smooth by years of waves.'), say('misa', 'happy', 'Treasure! Real treasure!'), ...found.map((id) => ({ t: 'give', item: id, n: 1 })), ...endScene]);
      g.addMood(10); g.addEnergy(-3);
    } },
  { id: 'sv2_maple', name: 'Maple Stroll', map: 'shrine', spot: 'forest_path', dy: 1, hours: ['14:00', '18:00'], label: 'Look for the reddest maple leaf', hint: 'Maple Stroll: the shrine forest path, afternoon',
    async run(g) {
      let who = null;
      await g.run([N('The shrine path is a tunnel of red and gold. A kind of crunch underfoot that sounds like autumn clapping.'), { t: 'choice', prompt: 'Walk with...', options: [...['suzu', 'kiko', 'hina'].filter(exists).map((id) => ({ text: nameOf(id), steps: [call(() => { who = id; })] })), { text: 'Walk alone', steps: [call(() => { who = 'alone'; })] }] }]);
      moment(g, 'sv2_maple');
      const line = { suzu: 'Look at this one. Every vein is a plot twist.', kiko: 'The mountain changes its coat every year, and it never looks the same.', hina: 'Maple seeds spin like helicopters! Try one!', alone: 'It is so quiet. Just the leaves and me.' }[who];
      await g.run([...scene('leaves'), who === 'alone' ? say('misa', 'happy', line) : say(who, 'happy', line), N('Misa finds a perfect red maple leaf, the colour of a fresh stamp, and slips it between the pages of her notebook.'), ...endScene]);
      if (who !== 'alone') g.addFriend(who, 32); g.addMood(12); souvenir(g, 'gift_sv2_pressed_maple');
    } },
  { id: 'sv2_snowfort', name: 'Snow Fort Day', map: 'park', spot: 'playground', dy: 1, hours: ['10:00', '17:00'], label: 'Build a snow fort', hint: 'Snow Fort Day: the park playground, daytime',
    async run(g) {
      let who = 'alone', h = 0, risk = 0;
      const step = (prompt, opts) => ({ t: 'choice', prompt, options: opts.map(([text, dh, dr, reply]) => ({ text, steps: [call(() => { h += dh; risk += dr; }), N(reply)] })) });
      await g.run([N('The park is a white blanket and the snow is perfect packing snow. A fort wants building.'), { t: 'choice', prompt: 'Who helps?', options: [...['kai', 'hina', 'suzu'].filter((id) => exists(id) && g.hearts(id) >= 1).map((id) => ({ text: nameOf(id), steps: [call(() => { who = id; })] })), { text: 'Build it solo', steps: [] }] }]);
      moment(g, 'sv2_snowfort');
      await g.run([step('Start with...', [['Thick walls', 2, 0, 'You pack the walls thick and solid.'], ['A tall tower', 3, 2, 'You stack a tower. It wobbles gloriously.'], ['A little door', 1, 0, 'You carve a neat little arched door.']]),
        step('Next...', [['Snow bricks', 2, 0, 'Square snow bricks, row by row. Very architectural.'], ['A snowman guard', 2, 1, 'A snowman guard with pebble eyes takes post.'], ['Ice windows', 1, 1, 'Thin ice windows catch the pale sun.']]),
        step('Finally...', [['Scarf flag', 1, 0, 'You plant a scarf flag on top. It flaps bravely.'], ['More height!', 3, 3, 'One more layer. Just one more...'], ['Admire it', 0, 0, 'You step back and admire your work.']])]);
      const crash = g.rng() < Math.min(0.75, risk * 0.12);
      await g.run([...scene('sv2_snowfort'), ...(who !== 'alone' ? [say(who, 'happy', 'This is the best fort in the history of snow!')] : []), ...(crash ? [N('There is a long creak. The fort leans... leans... and collapses in a fluffy avalanche.'), say('misa', 'happy', who === 'alone' ? 'Hahaha! I will build it better next time!' : 'We build it again! Bigger! Better!'), { t: 'mood', n: 8 }] : [N(`The fort stands ${h >= 8 ? 'taller than Misa' : 'solid and proud'}. A snowball fight breaks out immediately.`), say('misa', 'happy', 'Our fort rules the park!'), { t: 'mood', n: 14 }]), ...endScene]);
      if (who !== 'alone') g.addFriend(who, crash ? 22 : 38); g.addEnergy(-6); souvenir(g, 'gift_sv2_snow_charm');
    } },
];

// ---------------------------------------------------------------- schedules for the gatherings
addSchedulePlans({
  sv2m_sv2_firefly: { hina: [['19:30', 'park', 'pond_edge', 'left']] },
  sv2m_sv2_picnic: { suzu: [['11:00', 'park', 'lawn', 'down']], kai: [['12:00', 'park', 'playground', 'down']] },
  sv2m_sv2_maple: { suzu: [['14:00', 'shrine', 'forest_path', 'down']], kiko: [['14:00', 'shrine', 'steps', 'up']] },
  sv2m_sv2_snowfort: { kai: [['10:30', 'park', 'playground', 'down']], hina: [['11:00', 'park', 'bench', 'down']] },
});

// ---------------------------------------------------------------- the daily flag + hint, and the walk-up target
register('system', 'sv2_moments', {
  init(game) {
    const apply = () => {
      const flags = game.state.flags;
      for (const k of Object.keys(flags)) if (k.startsWith('sv2m_')) delete flags[k];
      const today = momentsToday(game);
      for (const id of today) flags['sv2m_' + id] = true;
      if (today.length && game.state.time && game.minutes < 12 * 60) { const m = MOMENTS.find((x) => x.id === today[0]); if (m) game.toast(m.hint, 'i_star'); }
    };
    game.bus.on('dayStart', apply); game.bus.on('gameStart', apply); game.bus.on('gameLoaded', apply);
    (game.extraLights ||= []).push((world) => glowLights(world, game));
  },
});
register('targetProvider', 'sv2_moment', {
  find(world, game) {
    const p = world.player; let best = null;
    for (const id of momentsToday(game)) {
      const m = MOMENTS.find((x) => x.id === id);
      if (!m || m.map !== world.map.id || game.minutes < parseHM(m.hours[0]) || game.minutes >= parseHM(m.hours[1])) continue;
      const q = spotPos(m.map, m.spot, m.dx || 0, m.dy || 0); if (!q) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < 20 && (!best || d < best.dist)) best = { label: doneToday(game, id) ? 'Enjoyed already today' : m.label, dist: d, x: q.x, y: q.y - 8, run: (g) => (doneToday(g, id) ? g.say('misa', 'happy', 'What a lovely day. One of those I want to keep.') : m.run(g)) };
    }
    return best;
  },
});
export const MOMENT_LIST = MOMENTS;

// ---------------------------------------------------------------- glow layer: moon jellies on the beach, fireflies at the pond
const evening = (g) => g.minutes >= 19.5 * 60 && g.minutes < 24.5 * 60;
const jellyNight = (g) => g.festivalsOn().some((f) => f.id === 'jellies') && evening(g);
const flyNight = (g) => g.flag('sv2m_sv2_firefly') && evening(g);
function orbs(g, mapId, clock) {
  if (mapId === 'beach' && jellyNight(g)) return Array.from({ length: 11 }, (_, i) => ({ x: (7 + i * 3.6 + Math.sin(clock * 0.35 + i) * 1.6) * 16, y: (15.4 + (i % 4) * 1.7 + Math.cos(clock * 0.5 + i * 2) * 0.6) * 16, c: ['#8ae0ff', '#c9a8ff', '#ffa8d0', '#9affd8'][i % 4], r: 5 + (i % 3), jelly: true, ph: i }));
  if (mapId === 'park' && flyNight(g)) return Array.from({ length: 16 }, (_, i) => ({ x: (3.5 + (i * 0.8) % 11 + Math.sin(clock * 0.6 + i * 1.3) * 1.2) * 16, y: (9.5 + (i * 1.7) % 9 + Math.cos(clock * 0.7 + i) * 1) * 16, c: '#d8ff7a', r: 2, jelly: false, ph: i }));
  return [];
}
function glowLights(world, g) { return orbs(g, world.map.id, g.clock).filter((o, i) => o.jelly ? i % 2 === 0 : i % 3 === 0).map((o) => ({ kind: 'candle', x: o.x, y: o.y })); }
register('worldLayer', 'sv2_glow', {
  overlay(g, world, game) {
    const os = orbs(game, world.map.id, game.clock);
    for (const o of os) {
      const x = world.sx(o.x), y = world.sy(o.y), pulse = 0.55 + Math.sin(game.clock * 2.2 + o.ph) * 0.35;
      g.globalAlpha = 0.14 * pulse; g.fillStyle = o.c; g.fillRect(x - o.r * 2, y - o.r * 2, o.r * 4, o.r * 4);
      g.globalAlpha = 0.35 + pulse * 0.4; g.fillRect(x - o.r, y - Math.ceil(o.r * 0.7), o.r * 2, Math.ceil(o.r * 1.4));
      if (o.jelly) { g.globalAlpha = 0.45; for (let k = -1; k <= 1; k++) g.fillRect(x + k * 3, y + 3, 1, 4 + (Math.floor(game.clock * 3 + k + o.ph) % 3)); }
      g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 2, 1);
    }
    g.globalAlpha = 1;
  },
});
export const MOMENT_IDS = Object.keys(MOMENT_DATES);
