// Backyard animals: chickens, ducks, rabbits (coop) and goats, alpacas (barn) as mochi-style actors that wander the pen,
// head indoors in bad weather and at dusk, get fed, petted, named, sometimes sick, and drop products into the collect bin.
import { register, get } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { Critter } from '../mochi/actor.js';
import { SV, SPECIES, CAP, capacity, hearts, isBaby } from './data.js';
import { addStar } from './core.js';
import { PEN, DOORS } from './maps.js';

const BAD = ['rain', 'storm', 'snow'];
const hourOf = (g) => g.minutes / 60;
export const outdoors = (g) => !BAD.includes(g.weather) && hourOf(g) >= 7 && hourOf(g) < 19;
const say = (game, text) => game.run([{ t: 'say', who: null, text }]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mood = (a) => (a.sick ? 'sick' : a.hap >= 80 ? 'very happy' : a.hap >= 55 ? 'content' : a.hap >= 30 ? 'a bit glum' : 'miserable');
export const moodOf = mood;

export function addAnimal(game, sp, name, born) {
  const S = SV(game), rec = { id: S.nextId++, sp, name, born: born ?? game.day, friend: 0, hap: 60, fed: 0, ate: 0, pet: 0, treat: 0, sick: 0 };
  S.animals.push(rec); game.stat('svAnimals'); game.bus.emit('animalAdded', { sp });
  return rec;
}
export const housed = (game, home) => SV(game).animals.filter((a) => SPECIES[a.sp].home === home).length;
function nameChoices(game, sp, rec) {
  const pool = SPECIES[sp].names.filter((n) => !SV(game).animals.some((a) => a.name === n)), picks = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(game.rng() * pool.length), 1)[0]);
  return picks.map((n) => ({ text: n, steps: [{ t: 'call', fn: () => { rec.name = n; if (rec.pet !== undefined) game.toast(`Named ${n}`, 'heart'); } }] }));
}
export function nameIt(game, rec) {
  const sp = SPECIES[rec.sp];
  return game.run([{ t: 'say', who: null, text: `A tiny ${sp.baby.toLowerCase()} blinks up at you. What will you call ${rec.sp === 'goat' || rec.sp === 'alpaca' ? 'it' : 'her'}?` }, { t: 'choice', prompt: `Name your new ${sp.baby.toLowerCase()}`, options: nameChoices(game, rec.sp, rec) }]);
}
export function buyAnimal(game, sp) {
  const d = SPECIES[sp];
  if (housed(game, d.home) >= capacity(game, d.home)) return false;
  const rec = addAnimal(game, sp, d.names.find((n) => !SV(game).animals.some((a) => a.name === n)) || d.baby);
  setTimeout(() => nameIt(game, rec), 100);
  return `Welcome home, little ${d.baby.toLowerCase()}! It will live in the ${d.home}.`;
}

// ---------------------------------------------------------------- friendship
function gain(game, a, pts) {
  const before = hearts(a); a.friend = clamp(a.friend + pts, 0, 1000);
  const h = hearts(a);
  if (h > before) {
    game.toast(`${a.name} is at ${h} heart${h > 1 ? 's' : ''}!`, 'heart');
    if (h === 5) { game.give('art_animal_treat', 2, true); game.toast(`${a.name} brought you a gift: 2 treats`, 'heart'); }
    if (h === 10) { game.addMoney(500); game.toast(`${a.name} is your best friend! +500 coins from the farm co-op`, 'i_trophy'); game.setFlag('sv_bestfriend'); game.bus.emit('animalMaxed', { sp: a.sp }); }
  }
}
function pet(game, actor) {
  const a = actor.rec;
  if (a.pet === game.day) return say(game, `${a.name} leans into your hand. You already gave ${a.sp === 'rabbit' ? 'her' : 'it'} lots of love today.`);
  a.pet = game.day; a.hap = clamp(a.hap + 6, 0, 100); gain(game, a, 20 + (game.hasBuff && game.hasBuff('calm') ? 5 : 0));
  actor.say('heart', 2); game.sfx(SPECIES[a.sp].snd); game.addMood(2); game.stat('svPets'); game.bus.emit('animalPet', { sp: a.sp });
  return Promise.resolve();
}
const LINES = {
  chicken: 'cluck-clucks and fluffs up its feathers.', duck: 'quacks and wiggles its tail.', rabbit: 'twitches its nose and thumps once, happily.',
  goat: 'bleats and nibbles your sleeve.', alpaca: 'hums softly and sniffs your hair.',
};
function treat(game, actor) {
  const a = actor.rec;
  if (a.treat === game.day) return say(game, `${a.name} is stuffed with treats for today.`);
  if (!game.take('art_animal_treat', 1)) return null;
  a.treat = game.day; a.hap = clamp(a.hap + 8, 0, 100); gain(game, a, 25); actor.say('i_music', 2); game.sfx('eat');
  return Promise.resolve();
}
function hand(game, actor) {
  const a = actor.rec;
  if (a.fed === game.day) return say(game, `${a.name} already had breakfast.`);
  if (!game.take('art_hay', 1)) return say(game, 'No hay in my bag. Sunny Mart sells it, or I can cut some grass.');
  a.fed = game.day; actor.say('i_music', 1.5); game.sfx('eat'); gain(game, a, 5);
  return Promise.resolve();
}
export function cure(game, a) { a.sick = 0; a.hap = clamp(a.hap + 10, 0, 100); }
function check(game, actor) {
  const a = actor.rec, sp = SPECIES[a.sp], age = game.day - a.born, h = hearts(a);
  const next = isBaby(game, a) ? `Grown up in ${sp.grow - age} day${sp.grow - age === 1 ? '' : 's'}.` : `Gives a product every ${sp.every} day${sp.every === 1 ? '' : 's'}.`;
  return say(game, `${a.name} the ${isBaby(game, a) ? sp.baby.toLowerCase() : sp.name.toLowerCase()}. ${sp.look} Hearts: ${h}/10. Mood: ${mood(a)}. ${next} ${a.sick ? 'Looks poorly: needs a tonic or the vet!' : ''}`);
}

export class FarmAnimal extends Critter {
  constructor(rec) { super('sva_' + rec.id, { label: 'Animal', speed: 17, state: 'idle', t: 1 + Math.random() * 3, inside: true }); this.rec = rec; this.map = null; this.label = `Pet ${rec.name}`; }
  get baby() { return this.game ? isBaby(this.game, this.rec) : false; }
  get sprite() {
    const walk = this.state === 'walk' || this.state === 'home', f = walk ? Math.floor(this.anim * 5) % 2 : (Math.floor(this.anim * 0.9) % 4 === 0 ? 1 : 0);
    return `sv_a_${this.rec.sp}_${this.baby ? 'b' : 'a'}_${walk ? 'w' : 'i'}${f}`;
  }
  update(dt, game, world) {
    this.tickBase(dt, world); this.label = `Pet ${this.rec.name}`;
    this.t -= dt;
    if (this.rec.sick && Math.floor(this.anim) % 7 === 0 && !this.emote) this.say('i_sweat', 1.2);
    if (hourOf(game) >= 18.25 && this.state !== 'home') { const door = DOORS[SPECIES[this.rec.sp].home]; this.state = 'home'; if (!this.pathTo(world, door[0], door[1])) this.retire(); return; }
    if (this.state === 'home') { if (this.stepPath(dt, this.speed * 1.4)) this.retire(); return; }
    if (this.state === 'walk') { if (this.stepPath(dt, this.speed)) { this.state = 'idle'; this.t = 2 + Math.random() * 5; } return; }
    if (this.t <= 0) {
      const tx = PEN.x0 + Math.floor(Math.random() * (PEN.x1 - PEN.x0 + 1)), ty = PEN.y0 + Math.floor(Math.random() * (PEN.y1 - PEN.y0 + 1));
      if ((world.grid[ty] || [])[tx] && this.pathTo(world, tx, ty)) this.state = 'walk'; else this.t = 1.5;
      if (Math.random() < 0.15) game.sfx(SPECIES[this.rec.sp].snd);
    }
  }
  retire() { this.inside = true; this.map = null; this.state = 'idle'; this.path = null; }
  draw(g, world) {
    const big = this.rec.sp === 'goat' || this.rec.sp === 'alpaca';
    this.drawSprite(world, this.sprite, this.dir < 0, this.baby ? 6 : big ? 12 : 8);
  }
  interact(game) {
    const a = this.rec, opts = [{ text: 'Pet', steps: [{ t: 'call', fn: (g) => pet(g, this) }] }];
    if (game.has('art_animal_treat') && a.treat !== game.day) opts.push({ text: 'Give a treat', steps: [{ t: 'call', fn: (g) => treat(g, this) }] });
    if (a.fed !== game.day) opts.push({ text: 'Feed by hand (hay)', steps: [{ t: 'call', fn: (g) => hand(g, this) }] });
    if (a.sick && game.has('art_medicine')) opts.push({ text: 'Give a tonic', steps: [{ t: 'call', fn: (g) => { g.take('art_medicine', 1); cure(g, a); this.say('heart', 2); g.sfx('chime'); g.toast(`${a.name} perked right up`, 'heart'); } }] });
    opts.push({ text: 'How is she doing?', steps: [{ t: 'call', fn: (g) => check(g, this) }] });
    opts.push({ text: 'Rename', steps: [{ t: 'choice', prompt: `Rename ${a.name}`, options: [...nameChoices(game, a.sp, a), { text: 'Keep the name', steps: [] }] }] });
    opts.push({ text: 'Leave', steps: [] });
    return game.run([{ t: 'choice', prompt: `${a.name} ${LINES[a.sp]}`, options: opts }]);
  }
}

function place(actor, world, game, scatter) {
  const home = DOORS[SPECIES[actor.rec.sp].home];
  let tx = home[0], ty = home[1];
  if (scatter) for (let i = 0; i < 30; i++) { const x = PEN.x0 + Math.floor(Math.random() * (PEN.x1 - PEN.x0 + 1)), y = PEN.y0 + Math.floor(Math.random() * (PEN.y1 - PEN.y0 + 1)); if ((world.grid[y] || [])[x]) { tx = x; ty = y; break; } }
  actor.x = tx * TILE + 8; actor.y = ty * TILE + 13; actor.path = null; actor.state = 'idle'; actor.t = 1 + Math.random() * 3; actor.inside = false; actor.map = 'backyard';
}
function sync(world, game) {
  const S = SV(game), A = game.svActors;
  if (world.map.id !== 'backyard') return;
  const live = new Set(S.animals.map((r) => r.id));
  for (const [id, a] of Object.entries(A)) if (!live.has(+id)) { world.pets = world.pets.filter((p) => p !== a); delete A[id]; }
  for (const rec of S.animals) {
    let a = A[rec.id];
    if (!a) { a = A[rec.id] = new FarmAnimal(rec); a.game = game; a.rec = rec; }
    if (!world.pets.includes(a)) world.pets.push(a);
    a.rec = rec;
    if (BAD.includes(game.weather) || hourOf(game) < 7 || hourOf(game) >= 19) { if (!a.inside) a.retire(); continue; }
    if (a.inside && hourOf(game) < 18.25) place(a, world, game, a.fresh !== false);
  }
}
register('worldTick', 'sv_animals', { update(dt, world, game) { if (game.state.sv_farm) sync(world, game); } });

// ---------------------------------------------------------------- overnight: eating, mood, illness, growth, products
const PRODUCT = {
  chicken: (g, a, q) => (g.rng() < 0.06 + (hearts(a) >= 3 ? 0.04 : 0) ? ['art_egg_fertile', 1] : [g.rng() < 0.12 + hearts(a) * 0.03 && a.hap >= 70 ? 'art_egg_large' : 'art_egg', 1]),
  duck: (g, a) => [g.rng() < 0.1 + hearts(a) * 0.03 && a.hap >= 70 ? 'art_duck_egg' : 'art_duck_egg', 1],
  rabbit: (g, a) => [a.hap >= 80 ? 'art_wool_rabbit' : 'art_wool_rabbit', 1],
  goat: (g, a) => [g.rng() < 0.1 + hearts(a) * 0.04 && a.hap >= 70 ? 'art_milk_large' : 'art_milk', 1],
  alpaca: () => ['art_wool', 1],
};
export function animalsOvernight(game) {
  const S = SV(game), made = [];
  for (const a of S.animals) {
    const sp = SPECIES[a.sp], wasBaby = (game.day - 1 - a.born) < sp.grow;
    let fed = a.fed === game.day - 1;
    if (!fed && S.hay > 0) { S.hay--; fed = true; }
    a.ate = fed ? game.day : 0;
    a.hap = clamp(a.hap + (fed ? 6 : -24) + (a.pet === game.day - 1 ? 8 : -4) + (a.sick ? -20 : 0) + (BAD.includes(game.weather) ? -1 : 2), 0, 100);
    if (!fed) a.friend = Math.max(0, a.friend - 8);
    if (a.sick) { a.sick++; if (a.sick > 3) a.friend = Math.max(0, a.friend - 10); }
    else if (game.rngFor('sick' + a.id)() < (a.hap < 45 ? 0.2 : 0.03) && !game.flag('sv_nosick')) { a.sick = 1; a.sickToast = true; }
    if (wasBaby && !isBaby(game, a)) game.toast(`${a.name} has grown up!`, 'heart');
    if (isBaby(game, a) || a.sick || !fed) continue;
    if ((game.day - a.born - sp.grow) % sp.every !== 0) continue;
    const [item, n] = PRODUCT[a.sp](game, a);
    S.bin[item] = (S.bin[item] || 0) + n; made.push(item);
    addStar(game, item, a.hap >= 92 ? 3 : a.hap >= 78 ? 2 : a.hap >= 60 && game.rng() < 0.6 ? 1 : 0, n);
    if (a.sp === 'duck' && hearts(a) >= 4 && game.rng() < 0.3) { S.bin.art_feather = (S.bin.art_feather || 0) + 1; made.push('art_feather'); }
    if (a.sp === 'rabbit' && hearts(a) >= 6 && game.rng() < 0.06) { S.bin.art_rabbit_foot = (S.bin.art_rabbit_foot || 0) + 1; made.push('art_rabbit_foot'); }
  }
  if (S.animals.some((a) => a.sickToast)) { const names = S.animals.filter((a) => a.sickToast).map((a) => a.name); S.animals.forEach((a) => delete a.sickToast); game.toast(`${names.join(' and ')} ${names.length > 1 ? 'are' : 'is'} unwell. A tonic or the vet will help`, 'i_sweat'); }
  if (S.incubator && game.day - S.incubator >= 3) {
    if (housed(game, 'coop') < capacity(game, 'coop')) { const rec = addAnimal(game, 'chicken', SPECIES.chicken.names.find((n) => !S.animals.some((a) => a.name === n)) || 'Chick', game.day); rec.hap = 80; S.incubator = 0; game.toast(`The egg hatched! Meet ${rec.name}`, 'heart'); game.stat('svHatched'); }
  }
  return made;
}
