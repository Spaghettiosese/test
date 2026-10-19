// More pets: Azuki the puppy, Kinako the rabbit, Genta the turtle and Piyo the parakeet, adopted at the harbour shelter.
// Each pet has Mochi-style needs (food, play, love, clean), a bond (10 hearts), mood, care actions, furniture, vet visits;
// the puppy learns tricks (sit, fetch, roll), and there is a five-event friendship arc with Mochi. Pets are world actors
// (src/content/mochi/actor.js) that live in `home`. Save: game.state.sv4_home.pets[id]
import { register, get, features } from '../../core/registry.js';
import { SPRITES } from '../../art.js';
import { TILE } from '../../world/map.js';
import { sprite } from '../../artcache.js';
import { drawText, drawTextC } from '../../font.js';
import { UI, rect, panel, bar } from '../../ui/ui.js';
import { itemIcon } from '../../gfx/icons.js';
import { Critter, tileOf } from '../mochi/actor.js';
import { wrapMap } from '../sv2_orchard/orchard.js';
import { SV, nm, say, N, call, menu } from './data.js';
import './art.js';
import '../../minigames/sv4_home/petshow.js';

export const PETS = {
  azuki: { name: 'Azuki', kind: 'dog', cost: 400, food: ['pet_puppy_food', 'snack_pet_bone', 'snack_pet_jerky', 'dog_biscuit'], toys: ['toy_pet_rope', 'toy_tennis_ball', 'toy_pet_bell'], furn: 'furn_pet_bed_dog', speed: 46, blurb: 'A red-bean-brown puppy with a white bib and too much energy.' },
  kinako: { name: 'Kinako', kind: 'rabbit', cost: 250, food: ['pet_hay', 'pet_greens'], toys: ['toy_pet_bell'], furn: 'furn_hutch_rabbit', speed: 30, blurb: 'A cream lop-eared rabbit who thumps when she is cross.' },
  genta: { name: 'Genta', kind: 'turtle', cost: 150, food: ['pet_pellets', 'pet_greens'], toys: [], furn: 'furn_tank_turtle', speed: 8, blurb: 'A patient turtle with strong opinions about lettuce.' },
  piyo: { name: 'Piyo', kind: 'parakeet', cost: 180, food: ['pet_millet'], toys: ['toy_pet_mirror', 'toy_pet_bell'], furn: 'furn_cage_parakeet', speed: 36, blurb: 'A green and yellow parakeet who copies the kettle whistle.' },
};
export const PET_IDS = Object.keys(PETS);
export const NEEDS = ['food', 'play', 'love', 'clean'];
export const TRICKS = { sit: 'Sit', fetch: 'Fetch', roll: 'Roll over' };
const NEED_NAME = { food: 'Food', play: 'Play', love: 'Love', clean: 'Clean' };
const ps = (g, id) => SV(g).pets[id];
export const owned = (g) => PET_IDS.filter((id) => ps(g, id));
export const hearts = (g, id) => Math.min(10, Math.floor((ps(g, id).bond || 0) / 100));
const clamp = (v) => Math.max(0, Math.min(100, v));
export function bond(g, id, n, src) {
  const p = ps(g, id); p.day ||= {}; if (src && p.day[src] === g.day) return 0; if (src) p.day[src] = g.day;
  const b = hearts(g, id); p.bond = Math.min(1000, p.bond + n); const a = hearts(g, id);
  if (a > b) { g.toast(`${PETS[id].name}: ${a} heart${a > 1 ? 's' : ''}`, 'heart'); g.sfx('heart'); g.bus.emit('petBond', { id, hearts: a }); } return n;
}
export function moodOf(g, id) {
  const n = ps(g, id).needs, low = NEEDS.reduce((a, k) => (n[k] < n[a] ? k : a), 'food'), avg = NEEDS.reduce((a, k) => a + n[k], 0) / 4;
  if (n[low] < 25) return { id: low, text: { food: 'Hungry', play: 'Bored', love: 'Lonely', clean: 'Grubby' }[low] };
  return avg > 80 ? { id: 'blissful', text: 'Blissful' } : avg > 55 ? { id: 'happy', text: 'Happy' } : { id: 'content', text: 'Content' };
}
const placedFurn = (g, id) => (g.state.homeDecor ? g.state.homeDecor.placed.some((p) => p.id === id) : false);
export function adopt(g, id) {
  const d = PETS[id]; if (ps(g, id)) return false;
  if (!g.spend(d.cost)) { g.toast(`${d.name} costs ${d.cost} coins`); return false; }
  SV(g).pets[id] = { since: g.day, bond: 20, needs: { food: 70, play: 60, love: 70, clean: 80 }, tricks: { sit: 0, fetch: 0, roll: 0 }, day: {}, vet: 0, shows: 0 };
  for (const f of d.food.slice(0, 1)) g.give(f, 5, true);
  g.stat('petsAdopted'); g.sfx('chime'); g.bus.emit('petAdopted', { id }); g.collect && g.collect('pet', id); return true;
}

// ---------------------------------------------------------------- needs
register('system', 'sv4_pet_needs', { init(game) {
  game.bus.on('hour', () => { for (const id of owned(game)) { const n = ps(game, id).needs; n.food = clamp(n.food - 3); n.play = clamp(n.play - 4); n.love = clamp(n.love - 3); n.clean = clamp(n.clean - 1.5); } });
  game.bus.on('dayStart', () => {
    for (const id of owned(game)) {
      const p = ps(game, id), n = p.needs; n.food = Math.min(n.food, 40); n.play = clamp(n.play - 12); n.love = clamp(n.love - 8); n.clean = clamp(n.clean - 6);
      if (placedFurn(game, PETS[id].furn)) { n.love = clamp(n.love + 10); n.clean = clamp(n.clean + 4); }
      if (NEEDS.every((k) => n[k] >= 60)) { p.lastCare = game.day; if (p.lastCare === game.day - 1) bond(game, id, 8, 'allcare'); }
      if (NEEDS.every((k) => n[k] >= 60)) p.careStreak = (p.careStreak || 0) + 1; else p.careStreak = 0;
    }
  });
  game.bus.on('gameLoaded', () => { if (game.world) game.world.pets = (game.world.pets || []).filter((a) => !(a instanceof HomePet)); });
} });

// ---------------------------------------------------------------- care actions
const have = (g, list) => list.find((i) => get('item', i) && g.has(i));
function feed(g, id) {
  const p = ps(g, id), d = PETS[id], f = have(g, d.food);
  if (p.fedDay === g.day && p.needs.food > 85) return g.say('misa', 'neutral', `${d.name} is stuffed. Not another bite.`);
  if (!f) return g.say('misa', 'neutral', `I have nothing for ${d.name} to eat. ${nm(d.food[0])} is sold at Dr. Mori's clinic.`);
  g.take(f, 1); p.fedDay = g.day; p.needs.food = clamp(p.needs.food + 60); bond(g, id, 12, 'feed'); g.sfx('eat'); g.stat('petFeeds'); act(g, id, 'happy');
  g.say('misa', 'happy', { dog: 'Azuki inhales his bowl, then checks it for more.', rabbit: 'Kinako nibbles with her whole face.', turtle: 'Genta eats one pellet at a time, very seriously.', parakeet: 'Piyo hangs upside down to eat the millet. Show-off.' }[d.kind]);
}
function play(g, id) {
  const p = ps(g, id), d = PETS[id], toy = have(g, d.toys);
  if (!g.useEnergy(2)) return; g.advance(20); p.needs.play = clamp(p.needs.play + (toy ? 45 : 25)); bond(g, id, 12, 'play'); g.stat('petPlays'); act(g, id, 'happy'); g.addMood(3);
  g.say('misa', 'happy', toy ? `We play with the ${nm(toy).toLowerCase()} until we are both out of breath.` : `No toys, but a rolled-up sock works wonders on ${d.name}.`);
}
function pet(g, id) {
  const p = ps(g, id); g.advance(5); p.needs.love = clamp(p.needs.love + 25); bond(g, id, 8, 'pet'); g.addMood(2); g.sfx(PETS[id].kind === 'dog' ? 'woof' : 'chirp'); g.stat('petPets'); act(g, id, 'happy'); g.emote && g.emote('heart');
}
function clean(g, id) {
  const p = ps(g, id), d = PETS[id], sh = d.kind === 'dog' && g.has('pet_shampoo');
  if (p.cleanDay === g.day) return g.say('misa', 'neutral', `${d.name} is already spotless today.`);
  p.cleanDay = g.day; if (sh) g.take('pet_shampoo', 1); g.advance(25); p.needs.clean = clamp(p.needs.clean + (sh ? 70 : 45)); bond(g, id, 8, 'clean'); g.sfx('splash'); g.stat('petCleans');
  g.say('misa', 'happy', { dog: sh ? 'Bubbles everywhere! Azuki shakes and soaks us both.' : 'A quick rinse. Azuki shakes and soaks me anyway.', rabbit: 'A gentle brush. Kinako goes boneless with bliss.', turtle: 'I scrub the tank and Genta supervises from his rock.', parakeet: 'Fresh paper in the cage and a mist of water. Piyo preens.' }[d.kind]);
}
const TREAT = ['snack_pet_bone', 'snack_pet_jerky', 'dog_biscuit', 'pet_puppy_food'];
export const trickLevel = (g, t) => Math.min(3, Math.floor(ps(g, 'azuki').tricks[t] / 3));
function train(g, id, trick) {
  const p = ps(g, id); p.trickDay ||= {};
  if (p.trickDay[trick] === g.day) return g.say('misa', 'neutral', 'Once a day per trick, or he gets cheeky.');
  const t = have(g, TREAT); if (!t) return g.say('misa', 'neutral', 'I need a treat to train with: puppy kibble, a bone or a biscuit.');
  p.trickDay[trick] = g.day; g.take(t, 1); g.advance(20); g.useEnergy(2);
  const lvl = trickLevel(g, trick), chance = Math.min(0.95, 0.35 + 0.1 * hearts(g, id) + 0.1 * (3 - lvl > 0 ? 1 : 0));
  const ok = g.rng() < chance; act(g, id, trick === 'roll' ? 'roll' : trick === 'sit' ? 'paw' : 'happy');
  if (!ok) return g.say('misa', 'neutral', `${TRICKS[trick]}... he tilts his head. Then licks my shoe. Tomorrow, maybe.`);
  const before = trickLevel(g, trick); p.tricks[trick] = Math.min(9, p.tricks[trick] + 1); bond(g, id, 10, 'train'); g.addXP('homemaking', 2); g.stat('tricksLearned'); g.sfx('star');
  g.say('misa', 'happy', trickLevel(g, trick) > before ? `He nails it! ${TRICKS[trick]} is level ${trickLevel(g, trick)} now.` : `Good boy! ${TRICKS[trick]} is coming along (${p.tricks[trick] % 3}/3).`);
}
function showOff(g, id) {
  const known = Object.keys(TRICKS).filter((t) => ps(g, id).tricks[t] >= 3); if (!known.length) return g.say('misa', 'neutral', 'He has not mastered a trick yet. Train sit, fetch or roll over first.');
  const t = known[Math.floor(g.rng() * known.length)]; act(g, id, t === 'roll' ? 'roll' : t === 'sit' ? 'paw' : 'happy'); g.addMood(6); g.sfx('woof'); g.stat('tricksShown');
  g.say('misa', 'happy', `${TRICKS[t]}! He gets it right and looks around for applause. Yay!`);
}
function petMenu(g, id) {
  const d = PETS[id], p = ps(g, id), m = moodOf(g, id), opts = [['Pet', (gg) => pet(gg, id)], ['Feed', (gg) => feed(gg, id)], ['Play', (gg) => play(gg, id)], [d.kind === 'dog' ? 'Bath' : d.kind === 'rabbit' ? 'Brush' : d.kind === 'turtle' ? 'Clean the tank' : 'Clean the cage', (gg) => clean(gg, id)]];
  if (d.kind === 'dog') { opts.push(['Train: sit', (gg) => train(gg, id, 'sit')], ['Train: fetch', (gg) => train(gg, id, 'fetch')], ['Train: roll over', (gg) => train(gg, id, 'roll')], ['Show off tricks', (gg) => showOff(gg, id)]); }
  opts.push([`Check on ${d.name} (${m.text})`, (gg) => gg.toast(`${d.name}: ${hearts(gg, id)} hearts, ${m.text.toLowerCase()}. Open the Pets app for details.`, 'heart')]);
  menu(g, `${d.name} the ${d.kind}${p.vaccinated ? '' : ''}`, opts);
}
export const act_ = {};
function act(g, id, state, t = 2.5) { const a = ACTORS[id]; if (a) { a.state = state; a.t = t; } }

// ---------------------------------------------------------------- the actors
const ACTORS = {};
class HomePet extends Critter {
  constructor(id) { super(id, { map: 'home', label: PETS[id].name, state: 'sit', t: 3, speed: PETS[id].speed }); this.def = PETS[id]; this.kind = this.def.kind; this.placed = false; }
  get sprite() {
    const a = this.anim, s = this.state, f = Math.floor(a * 8) % 4;
    switch (this.kind) {
      case 'dog': return s === 'walk' ? `sv4_pet_azuki_walk_${f}` : s === 'lie' ? `sv4_pet_azuki_lie_${Math.floor(a * 0.9) % 2}` : s === 'roll' ? `sv4_pet_azuki_roll_${Math.floor(a * 3) % 2}` : s === 'paw' ? 'sv4_pet_azuki_paw' : s === 'happy' ? 'sv4_pet_azuki_happy' : a % 5 < 0.15 ? 'sv4_pet_azuki_sit_b' : `sv4_pet_azuki_sit_${Math.floor(a * 3) % 4}`;
      case 'rabbit': return s === 'walk' ? `sv4_pet_rabbit_hop_${Math.floor(a * 5) % 2}` : s === 'lie' ? 'sv4_pet_rabbit_lie' : s === 'happy' ? 'sv4_pet_rabbit_eat' : a % 4 < 0.14 ? 'sv4_pet_rabbit_sit_b' : `sv4_pet_rabbit_sit_${Math.floor(a * 1.4) % 2}`;
      case 'turtle': return s === 'lie' ? 'sv4_pet_genta_hide' : s === 'walk' ? `sv4_pet_genta_walk_${Math.floor(a * 2) % 2}` : 'sv4_pet_genta_stretch';
      default: return s === 'fly' ? `sv4_pet_piyo_fly_${Math.floor(a * 9) % 2}` : s === 'happy' ? 'sv4_pet_piyo_sing' : 'sv4_pet_piyo_sit_0';
    }
  }
  update(dt, game, world) {
    this.tickBase(dt, world); this.game = game;
    if (!ps(game, this.id)) { this.map = null; return; }
    if (!this.placed) { this.placed = true; const spots = [[12, 12], [14, 12], [18, 12], [11, 11]], k = PET_IDS.indexOf(this.id), s = spots[k % 4]; this.x = s[0] * TILE + 8; this.y = s[1] * TILE + 13; }
    const night = game.minutes >= 22 * 60 || game.minutes < 6 * 60, p = world.player, dP = Math.hypot(p.x - this.x, p.y - this.y);
    this.t -= dt; this.lift = this.state === 'fly' ? 12 + Math.sin(this.anim * 6) * 3 : 0;
    if (this.path) { this.stepPath(dt, this.speed); if (this.walking) this.state = this.kind === 'parakeet' ? 'fly' : 'walk'; if (!this.path) this.state = 'sit'; return; }
    if (night && this.kind !== 'parakeet') { this.state = 'lie'; return; }
    if (this.kind === 'dog' && hearts(game, this.id) >= 2 && dP > 56 && !night && this.state !== 'roll' && game.rng() < dt * 0.4) { const [tx, ty] = tileOf(p.x, p.y); if (this.pathTo(world, tx, ty + 1)) return; }
    if (this.t <= 0) {
      const r = game.rng(); this.t = 3 + game.rng() * 5; this.state = r < 0.18 ? 'happy' : r < 0.3 && this.kind !== 'bird' ? 'lie' : 'sit';
      if (r > 0.55) { const [cx, cy] = tileOf(this.x, this.y), tx = cx + Math.round((game.rng() - 0.5) * 8), ty = cy + Math.round((game.rng() - 0.5) * 6); if (world.grid[ty] && world.grid[ty][tx]) this.pathTo(world, tx, ty); }
      const m = game.mochi, other = Object.values(ACTORS).find((a) => a !== this && Math.hypot(a.x - this.x, a.y - this.y) < 36 && ps(game, a.id));
      if (other && r < 0.5) { this.say('heart', 1.5); other.say('heart', 1.5); }
      if (m && m.map === 'home' && this.kind === 'dog' && Math.hypot(m.x - this.x, m.y - this.y) < 30 && !SV(game).petArc.events.includes('a3')) m.set && m.set('arch', 2);
      if (this.kind === 'dog' && game.rng() < 0.1) game.sfx('woof'); if (this.kind === 'parakeet' && game.rng() < 0.25) game.sfx('chirp');
    }
  }
  draw(g, world) { this.drawSprite(world, this.sprite, this.dir < 0, this.kind === 'turtle' ? 6 : 9); }
  interact(game) { petMenu(game, this.id); }
}
for (const id of PET_IDS) ACTORS[id] = new HomePet(id);
register('system', 'sv4_pet_actors', { init(game) {
  const put = () => { const w = game.world; if (!w || !w.pets) return; for (const id of PET_IDS) if (ps(game, id) && !w.pets.includes(ACTORS[id])) w.pets.push(ACTORS[id]); };
  game.bus.on('mapEnter', put); game.bus.on('petAdopted', put);
} });

// ---------------------------------------------------------------- Mochi and Azuki: five small events
const ARC = [
  { id: 'a1', need: 0, steps: (g) => [N('Azuki trots in. Mochi sees him. Every hair on her body stands up.'), { t: 'sfx', name: 'hiss' }, say('mochi', 'surprised', 'HSSSSS!'), N('She vanishes up the cat tower and glares down like a small orange gargoyle.'), say('misa', 'neutral', 'It is okay, Mochi. He is small. He is soft. He is... very loud.')] },
  { id: 'a2', need: 100, steps: () => [N('Mochi has come down one shelf. Azuki sits at the bottom, whining softly, tail sweeping the floor.'), say('misa', 'happy', 'Look at that. She is watching him. Not hissing. Progress.'), say('mochi', 'neutral', 'Mrrp. ...Mrrp.')] },
  { id: 'a3', need: 250, steps: () => [N('Dinnertime. Two bowls, one very polite standoff. Mochi eats first. Azuki waits. Then Mochi steals his biscuit.'), say('misa', 'surprised', 'She stole his biscuit! And he let her! That is basically friendship.')] },
  { id: 'a4', need: 400, steps: () => [N('Zoomies! Azuki chases a jingly ball straight into Mochi. She swats him on the nose, once, politely. He wags harder.'), say('mochi', 'happy', 'Mrrow.'), say('misa', 'happy', 'That was a love tap. I think.')] },
  { id: 'a5', need: 600, steps: () => [N('Late afternoon. Misa finds Mochi curled in the dog bed. Azuki is curled around her, snoring. Mochi is purring.'), say('misa', 'happy', 'Best friends! I have to take a photo.'), call((g) => { g.mochiBond && g.mochiBond(40, 'azuki_arc'); bond(g, 'azuki', 40, 'arc'); g.give('furn_pet_bed_dog', 1, true); g.toast('Mochi and Azuki are best friends! A pet bed for two', 'i_star'); g.stat('petArcDone'); })] },
];
register('worldTick', 'sv4_pet_arc', { update(dt, world, game) {
  const s = game.state.sv4_home; if (!s || !s.pets.azuki || world.map.id !== 'home' || game.scenes.top !== world || world.busy || game.minutes < 8 * 60 || game.minutes > 21 * 60) return;
  world._arcT = (world._arcT || 3) - dt; if (world._arcT > 0) return; world._arcT = 5;
  const arc = s.petArc, next = ARC.find((e) => !arc.events.includes(e.id)); if (!next) return;
  if (arc.day === game.day || s.pets.azuki.bond < next.need || (next.id !== 'a1' && game.day < s.pets.azuki.since + arc.events.length * 2)) return;
  arc.events.push(next.id); arc.day = game.day; game.stat('petArcEvents'); game.run(next.steps(game));
} });

// ---------------------------------------------------------------- shelter, vet, pet show hooks
register('interaction', 'sv4_shelter', { label: 'Harbour animal shelter', run: (g) => {
  const avail = PET_IDS.filter((id) => !ps(g, id));
  if (!avail.length) return g.say('misa', 'happy', 'I have adopted every animal in the shelter. The volunteers wave me off like a hero.');
  menu(g, 'Harbour shelter: who comes home?', avail.map((id) => [`${PETS[id].name} the ${PETS[id].kind} (${PETS[id].cost}c)`, (gg) => gg.run([N(PETS[id].blurb), { t: 'choice', prompt: `Adopt ${PETS[id].name}?`, options: [{ text: 'Yes', steps: [call((g3) => { if (adopt(g3, id)) g3.run(adoptSteps(g3, id)); })] }, { text: 'Not yet', steps: [] }] }])]));
} });
const adoptSteps = (g, id) => (id === 'azuki' ? [say('misa', 'happy', 'Welcome home, Azuki!'), N('Mochi takes one look at the puppy on the doorstep and decides to live on the cat tower for the foreseeable future.')] : [say('misa', 'happy', `${PETS[id].name} has come home! I will look after you properly.`)]);
wrapMap('harbour', 'objects', (list) => [...list, { spr: 'hw_crate_stack', x: 31, y: 3, w: 1, h: 1, shadow: 10, use: 'sv4_shelter' }, { spr: 'hw_progress_sign', x: 32, y: 3, solid: false, interact: { label: 'Animal shelter notice', run: (g) => g.say(null, null, 'HARBOUR SHELTER: homes wanted for a puppy, a rabbit, a turtle and a parakeet. Ask at the crates.') } }]);
const hb = get('map', 'harbour'); if (hb && hb.spots) hb.spots.shelter = [31, 5];
const clinic = get('shop', 'clinic');
if (clinic && clinic.services) for (const id of PET_IDS) clinic.services.push({
  id: `vet_${id}`, name: `${PETS[id].name}'s vet visit`, desc: `A checkup, shots and a treat. ${PETS[id].name} gets all needs topped up.`, price: 350, icon: itemIcon('toy', { c: '#8fe0c0' }), when: (g) => !!g.state.sv4_home && !!ps(g, id),
  run: (g) => { const p = ps(g, id); if (p.vetDay === g.day) return false; p.vetDay = g.day; p.vet++; for (const k of NEEDS) p.needs[k] = clamp(p.needs[k] + 30); bond(g, id, 20, 'vet'); g.stat('vetVisits'); return `Dr. Mori checks ${PETS[id].name} over: healthy, happy and very good about the thermometer.`; },
});
wrapMap('park', 'objects', (list) => [...list, { spr: 'hw_progress_sign', x: 31, y: 8, solid: false, interact: { label: 'Pet show', run: (g) => enterShow(g) } }]);
export function enterShow(g) {
  const s = SV(g).show, mine = owned(g);
  if (!mine.length) return g.say('misa', 'neutral', 'The Sakura Park Pet Show! Weekends, 10am to 5pm. I need a pet to enter.');
  if (!['sat', 'sun'].some((d) => g.check(`day:${d}`)) || g.minutes < 10 * 60 || g.minutes > 17 * 60) return g.say('misa', 'neutral', 'The pet show runs on weekends from 10 to 5. Poster says: bring a brushed pet and a big smile.');
  if (s.day === g.day) return g.say('misa', 'happy', 'We already took our turn on the stage today. The judges need a break.');
  menu(g, 'Enter the pet show with...', mine.map((id) => [`${PETS[id].name} (${hearts(g, id)} hearts)`, (gg) => { s.day = gg.day; gg.minigame('sv4_petshow', { pet: id }).then((r) => { if (!r || r.quit) return; finishShow(gg, id, r.score); }); }]));
}
function finishShow(g, id, score) {
  const s = SV(g).show, p = ps(g, id); s.entered++; p.shows++; s.best = Math.max(s.best, Math.round(score * 100)); bond(g, id, 20, 'show'); g.stat('petShows');
  const prize = Math.round(60 + 240 * score); g.addMoney(prize); g.addMood(8);
  if (score >= 0.75) { s.wins++; g.give('pet_ribbon_show', 1); g.stat('petShowWins'); g.toast(`${PETS[id].name} wins a rosette!`, 'i_star'); }
  g.say('misa', 'happy', score >= 0.75 ? `First place! ${PETS[id].name} gets a rosette and ${prize} coins.` : `${PETS[id].name} got a participation ribbon and ${prize} coins for being adorable.`);
}

// ---------------------------------------------------------------- the Pets phone app
register('phoneApp', 'sv4_pets', {
  name: 'Pets', icon: itemIcon('toy', { c: '#e8745a' }), order: 39, when: (g) => !!g.state.sv4_home && owned(g).length > 0,
  badge: (g) => (owned(g).some((id) => ['food', 'love'].includes(moodOf(g, id).id)) ? '!' : 0),
  open(g, app) { app.state.i = app.state.i || 0; },
  update(dt, input, g, app) {
    const k = input.pressed, st = app.state, n = owned(g).length || 1;
    if (k.has('arrowright') || k.has('d')) st.i = (st.i + 1) % n; if (k.has('arrowleft') || k.has('a')) st.i = (st.i + n - 1) % n;
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, ids = owned(game), id = ids[app.state.i % ids.length]; if (!id) return;
    const d = PETS[id], p = ps(game, id), m = moodOf(game, id), t = game.clock;
    drawText(g, `${ids.map((i) => (i === id ? '[' + PETS[i].name.toUpperCase() + ']' : PETS[i].name.toUpperCase())).join(' ')}`, x + 6, y + 4, UI.ink, 1, null); drawText(g, 'LEFT/RIGHT', x + w - 56, y + 4, UI.dim, 1, null);
    panel(g, x + 4, y + 18, 100, 150, 'paper');
    const spr = d.kind === 'dog' ? `sv4_pet_azuki_sit_${Math.floor(t * 3) % 4}` : d.kind === 'rabbit' ? 'sv4_pet_rabbit_sit_0' : d.kind === 'turtle' ? 'sv4_pet_genta_stretch' : 'sv4_pet_piyo_sit_0';
    const S = SPRITES[spr]; if (S) g.drawImage(sprite(spr), x + 54 - S.w, y + 28, S.w * 2, S.h * 2);
    drawTextC(g, d.name.toUpperCase(), x + 54, y + 88, UI.ink, 1, null); drawTextC(g, m.text.toUpperCase(), x + 54, y + 99, UI.accent2, 1, null);
    for (let i = 0; i < 10; i++) { g.globalAlpha = i < hearts(game, id) ? 1 : 0.25; g.drawImage(sprite('heart'), x + 10 + (i % 5) * 17, y + 112 + Math.floor(i / 5) * 10); } g.globalAlpha = 1;
    drawText(g, `DAY ${game.day - p.since + 1} AT HOME`, x + 10, y + 138, UI.dim, 1, null); drawText(g, `SHOWS ${p.shows}  VET ${p.vet}`, x + 10, y + 148, UI.dim, 1, null);
    panel(g, x + 110, y + 18, 178, 150, 'paper');
    NEEDS.forEach((n, i) => { const v = p.needs[n]; drawText(g, NEED_NAME[n].toUpperCase(), x + 118, y + 26 + i * 20, UI.ink, 1, null); bar(g, x + 118, y + 35 + i * 20, 160, 6, v / 100, v < 30 ? UI.bad : v < 60 ? UI.gold : UI.good); });
    if (d.kind === 'dog') Object.entries(TRICKS).forEach(([tk, tn], i) => drawText(g, `${tn.toUpperCase()}: LV ${trickLevel(game, tk)}`, x + 118, y + 108 + i * 10, UI.ink, 1, null));
    else drawText(g, d.blurb.toUpperCase().slice(0, 34), x + 118, y + 108, UI.dim, 1, null);
    const arc = SV(game).petArc.events.length; if (d.kind === 'dog') drawText(g, `MOCHI FRIENDSHIP ${arc}/5`, x + 118, y + 142, UI.accent2, 1, null);
    drawText(g, `FURNITURE: ${placedFurn(game, d.furn) ? 'PLACED' : 'NOT PLACED'}`, x + 118, y + 154, placedFurn(game, d.furn) ? UI.good : UI.dim, 1, null);
  },
});

features('Home & Pets', [
  'Harbour animal shelter: adopt Azuki the puppy, Kinako the rabbit, Genta the turtle or Piyo the parakeet',
  'Each pet has four needs (food, play, love, clean), a mood, and a ten-heart bond that grows with daily care',
  'Pets wander the house as animated actors: the puppy follows you, the rabbit hops, the turtle plods and the parakeet flutters',
  'Pet care: pet, feed with the right food, play with toys, bathe or clean, with different lines for each species',
  'Dog training: teach Azuki sit, fetch and roll over with treats; each trick has three levels and can be shown off',
  'Pet furniture (dog bed, rabbit hutch, turtle tank, bird cage) placed at home tops up needs every morning',
  'Dr. Mori\'s clinic offers a vet visit for each pet that refills their needs',
  'Pet supplies: puppy kibble, hay, greens, pellets, millet, shampoo, rope toys, bell balls and a bird mirror',
  'Pets phone app: portrait, mood, hearts, need bars, trick levels and furniture status for every pet you own',
  'Mochi and Azuki friendship arc in five small events, from a hissing standoff to napping together in one dog bed',
  'Pets notice each other: they trade hearts when they meet and Mochi arches her back at the puppy at first',
  'Pet show at Sakura Park on weekends: enter a pet in a trick-and-beat minigame for coins and a rosette',
  'Dog, rabbit and turtle curl up to sleep from ten at night while the parakeet stays up chirping',
  'A full day of every need cared for adds a bond bonus the next morning, for each pet',
  'The Pets app badge lights up when a pet is hungry or lonely',
]);
void say; void N; void call; void act_;
