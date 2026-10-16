// Skill professions (Stardew-style): at level 5 and level 10 of each of the 9 skills the player chooses one of two
// professions. Registry kind 'profession': { skill, level, name, from? (level-5 profession required), fx }.
//
// Effect keys (all implemented here unless noted):
//   sell: { cats?, tags?, all?, m }      sale price multiplier, via game.sellMult (hook in economy/core.js sellPrice)
//   xp: { skills: [..] | '*', m }        XP multiplier (wraps game.addXP)
//   dup: { ev, ch }                      chance to get one more of the item on bus event ev (harvested, fishCaught, cooked,
//                                        crafted, shellFound, mineralFound, foraged, mined)
//   coin: { ev, n } / mood: { ev, n }    coins or mood on a bus event (homeTask, talk)
//   energy: { m }                        multiplier on every energy cost (wraps game.useEnergy)
//   bag: n                               extra bag slots
//   flag: 'x'                            read by the mine / forage code: minerSwing, geo, prospector, excavator, tracker, truffle
// Services added to game: profs(), hasProf(id), sellMult(item), chooseProfession(skill, level, id), pendingProfessions().
import { register, get, all, features } from '../../core/registry.js';
import { drawText, drawTextC, measure } from '../../font.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { rect, panel, btn, C, inside } from '../economy/gfx.js';
import { SV, SKILL_ORDER } from './data.js';

// skill -> [ [id5a, name, fx], [id5b, name, fx] ], then for each: two level-10 [id, name, fx]
const T = {
  homemaking: [['tidy', 'Tidy Keeper', { xp: { skills: ['homemaking'], m: 1.25 } }, [['spotless', 'Spotless Home', { coin: { ev: 'homeTask', n: 12 } }], ['zen', 'Zen Cleaner', { energy: { m: 0.9 } }]]],
    ['cosy', 'Cozy Maker', { mood: { ev: 'homeTask', n: 2 } }, [['nest', 'Nest Builder', { bag: 4 }], ['hearth', 'Hearth Heart', { mood: { ev: 'homeTask', n: 4 } }]]]],
  study: [['scholar', 'Scholar', { xp: { skills: ['study'], m: 1.25 } }, [['genius', 'Genius', { xp: { skills: '*', m: 1.1 } }], ['professor', 'Professor', { sell: { cats: ['book'], m: 1.3 } }]]],
    ['tutor', 'Tutor', { sell: { cats: ['book'], m: 1.25 } }, [['bookseller', 'Bookseller', { sell: { cats: ['book'], m: 1.5 } }], ['mentor', 'Mentor', { mood: { ev: 'talk', n: 1 } }]]]],
  cooking: [['chef', 'Chef', { dup: { ev: 'cooked', ch: 0.15 } }, [['gourmet', 'Gourmet', { sell: { tags: ['dish'], m: 1.3 } }], ['sous', 'Sous Chef', { xp: { skills: ['cooking'], m: 1.3 } }]]],
    ['baker', 'Baker', { sell: { tags: ['dish'], m: 1.2 } }, [['patissier', 'Patissier', { sell: { tags: ['dish'], m: 1.4 } }], ['caterer', 'Caterer', { dup: { ev: 'cooked', ch: 0.3 } }]]]],
  gardening: [['grower', 'Grower', { dup: { ev: 'harvested', ch: 0.2 } }, [['harvester', 'Harvester', { dup: { ev: 'harvested', ch: 0.35 } }], ['greenthumb', 'Green Thumb', { xp: { skills: ['gardening'], m: 1.3 } }]]],
    ['tiller', 'Tiller', { sell: { cats: ['crop'], m: 1.15 } }, [['agri', 'Agriculturist', { sell: { cats: ['crop'], m: 1.35 } }], ['rancher', 'Rancher', { bag: 4 }]]]],
  fishing: [['angler', 'Angler', { sell: { cats: ['fish'], m: 1.25 } }, [['fishmonger', 'Fishmonger', { sell: { cats: ['fish'], m: 1.45 } }], ['legend', 'Sea Legend', { xp: { skills: ['fishing'], m: 1.3 } }]]],
    ['trapper', 'Trapper', { dup: { ev: 'fishCaught', ch: 0.15 } }, [['mariner', 'Mariner', { dup: { ev: 'fishCaught', ch: 0.3 } }], ['pirate', 'Pirate', { dup: { ev: 'shellFound', ch: 0.5 } }]]]],
  crafting: [['maker', 'Maker', { sell: { cats: ['decor', 'material'], m: 1.2 } }, [['artisan', 'Artisan', { sell: { cats: ['decor'], m: 1.4 } }], ['master', 'Craft Master', { dup: { ev: 'crafted', ch: 0.2 } }]]],
    ['tinkerer', 'Tinkerer', { xp: { skills: ['crafting'], m: 1.3 } }, [['engineer', 'Engineer', { energy: { m: 0.9 } }], ['clockwright', 'Clockwright', { dup: { ev: 'crafted', ch: 0.15 } }]]]],
  charm: [['sweet', 'Sweetheart', { mood: { ev: 'talk', n: 1 } }, [['idol', 'Town Idol', { coin: { ev: 'talk', n: 2 } }], ['butterfly', 'Social Butterfly', { xp: { skills: ['charm'], m: 1.3 } }]]],
    ['haggler', 'Haggler', { sell: { all: true, m: 1.05 } }, [['merchant', 'Merchant', { sell: { all: true, m: 1.1 } }], ['tycoon', 'Tycoon', { sell: { all: true, m: 1.15 } }]]]],
  foraging: [['forager', 'Forager', { dup: { ev: 'foraged', ch: 0.2 } }, [['botanist', 'Botanist', { sell: { tags: ['forage'], m: 1.3 } }], ['naturalist', 'Naturalist', { dup: { ev: 'foraged', ch: 0.4 } }]]],
    ['tracker', 'Tracker', { flag: 'tracker' }, [['truffler', 'Truffle Hunter', { flag: 'truffle' }], ['pathfinder', 'Pathfinder', { energy: { m: 0.9 } }]]]],
  mining: [['miner', 'Miner', { flag: 'minerSwing' }, [['smith', 'Blacksmith', { sell: { tags: ['bar'], m: 1.5 } }], ['prospector', 'Prospector', { flag: 'prospector' }]]],
    ['geologist', 'Geologist', { flag: 'geo' }, [['excavator', 'Excavator', { flag: 'excavator' }], ['gemologist', 'Gemologist', { sell: { tags: ['gem'], m: 1.3 } }]]]],
};
const PM = (v) => `${Math.round((v - 1) * 100)}%`;
export function describe(fx) {
  const out = [];
  if (fx.sell) out.push(`Sells ${fx.sell.all ? 'everything' : (fx.sell.cats || fx.sell.tags).join('/')} +${PM(fx.sell.m)}`);
  if (fx.xp) out.push(`+${PM(fx.xp.m)} ${fx.xp.skills === '*' ? 'all' : fx.xp.skills[0]} XP`);
  if (fx.dup) out.push(`${Math.round(fx.dup.ch * 100)}% extra ${{ harvested: 'harvest', fishCaught: 'fish', cooked: 'dish', crafted: 'craft', shellFound: 'shell', foraged: 'forage' }[fx.dup.ev]}`);
  if (fx.coin) out.push(`+${fx.coin.n} coins per ${fx.coin.ev === 'talk' ? 'chat' : 'chore'}`);
  if (fx.mood) out.push(`+${fx.mood.n} mood per ${fx.mood.ev === 'talk' ? 'chat' : 'chore'}`);
  if (fx.energy) out.push('Energy costs -10%');
  if (fx.bag) out.push(`+${fx.bag} bag slots`);
  if (fx.flag) out.push({ minerSwing: '-1 energy per swing', geo: 'More gems from rocks', prospector: '+1 ore per vein', excavator: 'Double geodes', tracker: 'Better truffle odds', truffle: 'Truffles nearly every day' }[fx.flag]);
  return out.join(', ');
}
export const PROFS = {};
for (const [skill, pair] of Object.entries(T)) {
  for (const [id, name, fx, kids] of pair) {
    PROFS[id] = register('profession', id, { skill, level: 5, name, fx });
    for (const [kid, kname, kfx] of kids) PROFS[kid] = register('profession', kid, { skill, level: 10, name: kname, from: id, fx: kfx });
  }
}
export const optionsFor = (game, skill, level) => {
  const picked = SV(game).prof.picked[skill] || {};
  return all('profession').filter((p) => p.skill === skill && p.level === level && (level === 5 || p.from === picked[5]));
};
export const chosen = (game, skill) => { const p = SV(game).prof.picked[skill] || {}; return [p[5] && get('profession', p[5]), p[10] && get('profession', p[10])]; };
export const activeProfs = (game) => { const out = []; for (const sk of Object.values(SV(game).prof.picked)) for (const id of Object.values(sk)) if (PROFS[id]) out.push(PROFS[id]); return out; };
export const hasProf = (game, id) => activeProfs(game).some((p) => p.id === id || p.fx.flag === id);
export function pendingProfessions(game) {
  const out = [];
  for (const skill of SKILL_ORDER) {
    const lv = game.skillLevel(skill), pk = SV(game).prof.picked[skill] || {};
    if (lv >= 5 && !pk[5]) out.push({ skill, level: 5 });
    else if (lv >= 10 && pk[5] && !pk[10]) out.push({ skill, level: 10 });
  }
  return out;
}
export function chooseProfession(game, skill, level, id) {
  const p = PROFS[id];
  if (!p || p.skill !== skill || p.level !== level) return false;
  const pk = (SV(game).prof.picked[skill] ||= {});
  if (pk[level] || game.skillLevel(skill) < level || (level === 10 && !pk[5])) return false;
  if (level === 10 && p.from !== pk[5]) return false;
  pk[level] = id;
  if (p.fx.bag) game.state.bagSize += p.fx.bag;
  game.sfx('star'); game.toast(`Profession: ${p.name}`, 'i_star');
  game.bus.emit('professionChosen', { skill, level, id });
  return true;
}

// ---------------------------------------------------------------- system: price, XP, energy and event hooks
function matches(fx, it) {
  const s = fx.sell;
  return !!s && (s.all || (s.cats && s.cats.includes(it.cat)) || (s.tags && (it.tags || []).some((t) => s.tags.includes(t))));
}
export function profSystem(game) {
  game.profs = () => activeProfs(game);
  game.hasProf = (id) => hasProf(game, id);
  game.pendingProfessions = () => pendingProfessions(game);
  game.chooseProfession = (s, l, id) => chooseProfession(game, s, l, id);
  game.sellMult = (it) => { let m = 1; for (const p of activeProfs(game)) if (matches(p.fx, it)) m *= p.fx.sell.m; return m; };
  const addXP = game.addXP.bind(game);
  game.addXP = (id, n) => {
    let k = 1;
    for (const p of activeProfs(game)) if (p.fx.xp && (p.fx.xp.skills === '*' || p.fx.xp.skills.includes(id))) k *= p.fx.xp.m;
    return addXP(id, k === 1 ? n : Math.max(1, Math.round(n * k)));
  };
  const useEnergy = game.useEnergy.bind(game);
  game.useEnergy = (n) => {
    let k = 1; for (const p of activeProfs(game)) if (p.fx.energy) k *= p.fx.energy.m;
    return useEnergy(k === 1 || n <= 1 ? n : Math.max(1, Math.round(n * k)));
  };
  for (const ev of ['harvested', 'fishCaught', 'cooked', 'crafted', 'shellFound', 'mineralFound', 'foraged', 'mined']) {
    game.bus.on(ev, (e) => {
      for (const p of activeProfs(game)) {
        if (p.fx.dup && p.fx.dup.ev === ev && e && e.item && get('item', e.item) && game.rng() < p.fx.dup.ch) { game.give(e.item, 1, true); game.toast(`${p.name}: an extra ${get('item', e.item).name.toLowerCase()}!`, get('item', e.item).icon); }
      }
    });
  }
  for (const ev of ['homeTask', 'talk']) {
    game.bus.on(ev, () => { for (const p of activeProfs(game)) { if (p.fx.coin && p.fx.coin.ev === ev) game.addMoney(p.fx.coin.n, true); if (p.fx.mood && p.fx.mood.ev === ev) game.addMood(p.fx.mood.n); } });
  }
  // Level-up banner, small reward, then the profession choice (queued so nothing interrupts a minigame or dialogue).
  const Q = (game.svq = { q: [], busy: false, tick: 0 });
  game.bus.on('skillUp', ({ id, level }) => { game.addMoney(level * 15, true); game.addMood(5); Q.q.push({ t: 'lv', id, level }); });
  game.bus.on('gameLoaded', () => { Q.q.length = 0; Q.busy = false; });
}
function nextQueued(game) {
  const Q = game.svq;
  if (Q.busy || !Q.q.length) return;
  Q.busy = true;
  const done = () => { Q.busy = false; };
  const e = Q.q.shift();
  if (e.t === 'lv') game.open('sv_levelup', e.id, e.level, done);
  else chooseScene(game, e.skill, e.level).then(done);
}
register('worldTick', 'sv_prof', {
  update(dt, world, g) {
    const Q = g.svq; if (!Q) return;
    Q.tick += dt;
    if (Q.tick < 0.8 || Q.busy || world.busy || g.scenes.top !== world) return;
    Q.tick = 0;
    for (const p of pendingProfessions(g)) if (!Q.q.some((e) => e.skill === p.skill && e.level === p.level)) Q.q.push({ t: 'pick', ...p });
    nextQueued(g);
  },
});
export function chooseScene(game, skill, level) {
  const opts = optionsFor(game, skill, level), sk = get('skill', skill);
  return game.run([
    { t: 'sfx', name: 'chime' },
    { t: 'say', who: null, text: `${sk.name} level ${level}! You can now choose a profession.` },
    { t: 'choice', prompt: `${sk.name} profession`, options: opts.map((p) => ({ text: p.name, steps: [{ t: 'say', who: null, text: `${p.name}: ${describe(p.fx)}.` }, { t: 'choice', prompt: `Become ${p.name}?`, options: [{ text: 'Yes', steps: [{ t: 'call', fn: (g) => chooseProfession(g, skill, level, p.id) }] }, { text: 'Not yet', steps: [] }] }] })) },
  ]);
}

// ---------------------------------------------------------------- level-up banner scene
class LevelUp {
  constructor(game, skill, level, cb) { Object.assign(this, { name: 'sv_levelup', opaque: false, game, skill, level, cb, t: 0 }); game.sfx('levelup'); }
  update(dt, input, game) {
    this.t += dt;
    if ((this.t > 0.7 && (input.pressed.size || input.justDown)) || this.t > 3) { game.scenes.pop(this); if (this.cb) this.cb(); }
  }
  draw(g) {
    const sk = get('skill', this.skill), t = this.t, a = Math.min(1, t * 3), y = 70 + Math.round((1 - Math.min(1, t * 4)) * -20);
    g.globalAlpha = a * 0.55; rect(g, '#10081a', 0, 0, 320, 224); g.globalAlpha = a;
    panel(g, 60, y, 200, 76, 'night');
    for (let i = 0; i < 12; i++) { const ang = i * 0.52 + t * 1.5, r = 26 + (t * 40) % 24; rect(g, i % 2 ? Rr.butter[3] : '#ffffff', 160 + Math.cos(ang) * r, y + 28 + Math.sin(ang) * r * 0.5, 2, 2); }
    if (SPRITES[sk.icon]) { const im = sprite(sk.icon); g.drawImage(im, 160 - Math.round(im.width / 2), y + 12); }
    drawTextC(g, `${sk.name.toUpperCase()}  LEVEL ${this.level}`, 160, y + 36, Rr.butter[3], 1, null);
    const perk = this.level === 5 || this.level === 10 ? 'Choose a profession!' : `+${this.level * 15} coins and a lift in mood`;
    drawTextC(g, perk, 160, y + 50, Rr.paper[4], 1, null);
    if (t > 0.7) drawTextC(g, 'Press any key', 160, y + 62, Rr.paper[2], 1, null);
    g.globalAlpha = 1;
  }
}
register('scene', 'sv_levelup', { make: (game, skill, level, cb) => new LevelUp(game, skill, level, cb) });

// ---------------------------------------------------------------- phone app: Skills
register('phoneApp', 'sv_skills', {
  name: 'Skills', icon: 'sv_i_skills', order: 44,
  badge: (game) => pendingProfessions(game).length || 0,
  open(game, app) { app.state.sel ??= 0; },
  update(dt, input, game, app) {
    const { x, y } = app.area, st = app.state, k = input.pressed;
    st.mx = input.mx; st.my = input.my;
    if (k.has('arrowdown') || k.has('s')) st.sel = Math.min(SKILL_ORDER.length - 1, st.sel + 1);
    if (k.has('arrowup') || k.has('w')) st.sel = Math.max(0, st.sel - 1);
    const skill = SKILL_ORDER[st.sel];
    if (input.justDown) {
      const i = Math.floor((input.my - y - 2) / 17);
      if (input.mx < x + 124 && i >= 0 && i < SKILL_ORDER.length) { st.sel = i; return; }
      const pend = pendingProfessions(game).find((p) => p.skill === skill);
      if (pend) optionsFor(game, skill, pend.level).forEach((p, j) => { if (inside(input.mx, input.my, x + 128, y + 104 + j * 18, 160, 16)) { if (chooseProfession(game, skill, pend.level, p.id)) game.sfx('chime'); } });
    }
    for (const n of ['1', '2']) if (k.has(n)) { const pend = pendingProfessions(game).find((p) => p.skill === skill); if (pend) chooseProfession(game, skill, pend.level, optionsFor(game, skill, pend.level)[Number(n) - 1].id); }
  },
  draw(g, game, app) {
    const { x, y, h } = app.area, st = app.state, skill = SKILL_ORDER[st.sel];
    panel(g, x, y, 122, h, 'paper');
    SKILL_ORDER.forEach((id, i) => {
      const sk = get('skill', id), lv = game.skillLevel(id), ry = y + 3 + i * 17;
      if (i === st.sel) rect(g, Rr.butter[3], x + 2, ry - 1, 118, 16);
      if (SPRITES[sk.icon]) { const im = sprite(sk.icon); g.drawImage(im, x + 4, ry - 1); }
      drawText(g, sk.name, x + 24, ry + 2, C.ink, 1, null);
      drawText(g, `LV${lv}`, x + 100, ry + 2, lv >= 10 ? Rr.coral[1] : Rr.forest[1], 1, null);
      const [a, b] = chosen(game, id);
      rect(g, a ? Rr.butter[2] : Rr.paper[1], x + 24, ry + 10, 4, 2); rect(g, b ? Rr.butter[2] : Rr.paper[1], x + 30, ry + 10, 4, 2);
      if (pendingProfessions(game).some((p) => p.skill === id)) rect(g, Rr.coral[2], x + 112, ry + 9, 5, 4);
    });
    const dx = x + 126, sk = get('skill', skill), lv = game.skillLevel(skill), xp = game.skillXP(skill);
    panel(g, dx, y, 166, h, 'paper');
    drawText(g, `${sk.name}  level ${lv}`, dx + 6, y + 6, C.ink, 1, null);
    drawText(g, sk.how, dx + 6, y + 16, Rr.ink[3], 1, null);
    const lo = lv ? 10 * lv * (lv + 1) : 0, hi = 10 * (lv + 1) * (lv + 2), p = lv >= 10 ? 1 : (xp - lo) / (hi - lo);
    rect(g, C.ink, dx + 6, y + 28, 154, 8); rect(g, Rr.paper[2], dx + 7, y + 29, 152, 6); rect(g, sk.color, dx + 7, y + 29, Math.round(152 * Math.max(0, Math.min(1, p))), 6);
    drawTextC(g, lv >= 10 ? 'MAX' : `${xp} / ${hi} XP`, dx + 83, y + 29, C.ink, 1, null);
    const [a, b] = chosen(game, skill), pend = pendingProfessions(game).find((q) => q.skill === skill);
    const line = (yy, label, prof, lock) => {
      drawText(g, label, dx + 6, yy, Rr.ink[2], 1, null);
      drawText(g, prof ? prof.name : lock, dx + 40, yy, prof ? Rr.forest[1] : Rr.ink[3], 1, null);
      if (prof) drawText(g, describe(prof.fx), dx + 8, yy + 9, Rr.ink[3], 1, null);
    };
    line(y + 44, 'LV5', a, lv >= 5 ? 'Not chosen yet' : 'Reach level 5');
    line(y + 66, 'LV10', b, lv >= 10 && a ? 'Not chosen yet' : 'Reach level 10');
    if (pend) {
      drawText(g, 'Choose your profession:', dx + 6, y + 92, Rr.coral[1], 1, null);
      optionsFor(game, skill, pend.level).forEach((o, j) => btn(g, dx + 2, y + 104 + j * 18, 160, 16, `${j + 1} ${o.name}`, { hover: inside(st.mx, st.my, dx + 2, y + 104 + j * 18, 160, 16), tone: 'mint' }));
      const o = optionsFor(game, skill, pend.level).find((_, j) => inside(st.mx, st.my, dx + 2, y + 104 + j * 18, 160, 16));
      if (o) drawText(g, describe(o.fx), dx + 6, y + 146, Rr.ink[2], 1, null);
    } else if (!a && lv < 5) drawText(g, `${5 - lv} more level${5 - lv === 1 ? '' : 's'} until you can choose.`, dx + 6, y + 92, Rr.ink[3], 1, null);
    else drawText(g, 'Professions are permanent for this save.', dx + 6, y + 92, Rr.ink[3], 1, null);
  },
});
void measure;

features('Exploring', [
  'Foraging and Mining join the seven skills, each levelling 1 to 10',
  'Professions: at level 5 and again at level 10 of each of the 9 skills you choose one of two (54 in all)',
  'Level 10 professions depend on your level 5 choice, so every skill has four different paths',
  'Professions change real numbers: sale prices, XP, extra harvests, energy costs, bag size and mining or foraging luck',
  'A Skills phone app lists every skill with level, XP bar, professions and a badge when a choice is waiting',
  'Skills app: click or press 1 and 2 to pick a profession; hovering shows what it does',
  'Level-up banner with a star burst, plus a few coins and a mood lift for every new skill level',
  'Level-ups and profession choices wait until you are back in the overworld, never mid-minigame',
]);
