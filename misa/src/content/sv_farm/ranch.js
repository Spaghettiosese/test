// Back yard interactions (coop, barn, trough, collect bin, catalogue, greenhouse site), the ranch shop, the vet service,
// Sunny Mart hay, grass cutting for hay, and the overnight routine.
import { register, registerMany, get } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { TILE } from '../../world/map.js';
import { SV, SPECIES, capacity, hearts, isBaby } from './data.js';
import { buyAnimal, housed, cure, moodOf } from './animals.js';
import { facingTile, tileOf, inWorld } from '../hobbies/common.js';
import { nm } from './core.js';

const say = (game, text, who = null) => game.run([{ t: 'say', who, mood: who ? 'neutral' : undefined, text }]);

function visit(game, home) {
  const S = SV(game), list = S.animals.filter((a) => SPECIES[a.sp].home === home);
  const opts = [];
  if (list.length) opts.push({ text: 'Look in on everyone', steps: [{ t: 'call', fn: (g) => {
    let n = 0;
    for (const a of list) if (a.pet !== g.day) { a.pet = g.day; a.hap = Math.min(100, a.hap + 3); a.friend = Math.min(1000, a.friend + 8); n++; }
    g.addMood(n ? 2 : 0);
    return say(g, list.map((a) => `${a.name} (${hearts(a)} hearts, ${moodOf(a)}${isBaby(g, a) ? ', baby' : ''})`).join('. ') + `. ${n ? 'You said hello to everyone.' : ''}`);
  } }] });
  else opts.push({ text: 'Empty for now', steps: [{ t: 'call', fn: (g) => say(g, `The ${home} is quiet and smells of fresh straw. The ranch catalogue board has animals for sale.`) }] });
  if (home === 'coop') {
    if (S.incubator) opts.push({ text: 'Check the incubator', steps: [{ t: 'call', fn: (g) => say(g, `The egg is warm. About ${Math.max(1, 3 - (g.day - S.incubator))} day${3 - (g.day - S.incubator) === 1 ? '' : 's'} to hatch.`) }] });
    else if (game.has('art_egg_fertile')) opts.push({ text: 'Put the fertile egg in the incubator', steps: [{ t: 'call', fn: (g) => { g.take('art_egg_fertile', 1); S.incubator = g.day; g.sfx('pop'); return say(g, 'Snug in the straw under the warm lamp. It should hatch in three days.'); } }] });
  }
  opts.push({ text: 'Leave', steps: [] });
  return game.run([{ t: 'choice', prompt: `${home === 'coop' ? 'Chicken coop' : 'Barn'}: ${list.length}/${capacity(game, home)} animals`, options: opts }]);
}
function sleepingNote(game, home) {
  if (!['rain', 'storm', 'snow'].includes(game.weather) && game.minutes > 7 * 60 && game.minutes < 19 * 60) return visit(game, home);
  return visit(game, home);
}
registerMany('interaction', {
  sv_coop: { label: 'Chicken coop', run: (g) => sleepingNote(g, 'coop') },
  sv_barn: { label: 'Barn', run: (g) => sleepingNote(g, 'barn') },
  sv_trough: {
    label: (g) => `Trough (${SV(g).hay}/12 hay)`,
    run: (g) => {
      const S = SV(g), room = 12 - S.hay;
      if (room <= 0) return say(g, 'The trough is already full. Everyone eats tonight.');
      const n = Math.min(room, g.count('art_hay'));
      if (!n) return say(g, 'No hay in my bag. Sunny Mart sells it, and I can cut grass here too.');
      g.take('art_hay', n); S.hay += n; g.sfx('pop'); g.toast(`Trough filled: ${S.hay} hay`, get('item', 'art_hay').icon); g.stat('svHay', n);
    },
  },
  sv_bin: {
    label: (g) => { const n = Object.values(SV(g).bin).reduce((a, b) => a + b, 0); return n ? `Collect bin (${n} items)` : 'Collect bin (empty)'; },
    run: (g) => {
      const S = SV(g), items = Object.entries(S.bin);
      if (!items.length) return say(g, 'Nothing in the bin yet. The animals deliver each morning when they are fed and happy.');
      for (const [id, n] of items) { g.give(id, n, true); g.collect('artisan', id); g.stat('svProducts', n); }
      g.toast(`Collected ${items.map(([id, n]) => `${n} ${nm(id).toLowerCase()}`).join(', ')}`, get('item', items[0][0]).icon); g.sfx('chime');
      S.bin = {};
    },
  },
  sv_ranch: { label: 'Ranch and farm catalogue', run: (g) => new Promise((res) => g.open('shop', 'sv_ranch', res)) },
  sv_gh_sign: {
    label: 'Greenhouse site',
    run: (g) => {
      if (g.flag('upg_greenhouse')) return say(g, 'The greenhouse is up!');
      return g.run([{ t: 'say', who: null, text: 'A cleared patch of ground, ready for a greenhouse. The Community Hall may help build one, or the catalogue sells a kit for 9000 coins.' }]);
    },
  },
});

// ---------------------------------------------------------------- the ranch shop
const EXT = (id, name, desc, price, key, step) => ({ id, name, desc, price, icon: itemIcon('box', { c: Rr.wood[2] }), when: (g) => SV(g)[key] < step * 2, run: (g) => { SV(g)[key] += step; return `Done! Room for ${step} more animals.`; } });
const services = Object.entries(SPECIES).map(([k, s]) => ({
  id: 'buy_' + k, name: `Baby ${s.name.toLowerCase()}`, desc: `A ${s.baby.toLowerCase()} for the ${s.home}. Grows up in ${s.grow} days. ${s.look}`, price: s.cost, icon: itemIcon('toy', { c: Rr.butter[3] }),
  run: (g) => { const r = buyAnimal(g, k); if (!r) { g.toast(`The ${s.home} is full`, 'i_sweat'); return false; } return r; },
}));
register('shop', 'sv_ranch', {
  name: 'Hoshimori Ranch Catalogue', owner: 'sachiko', keeper: { name: 'Sachiko', look: { hair: '#b8a0c8', top: '#f0c040', bottom: '#4f8a58', skin: '#f8d5b8', accent: '#e87aa0' } }, color: Rr.mint[1], buys: [],
  greet: { default: ['Ordering from the catalogue? Everything arrives by Pip before lunch!', 'Baby animals, hay, fertiliser. Farming is a lot of paperwork, dear.'], thanks: ['Pip will bring it right over!', 'Lovely. Take good care of them.'] },
  stock: ['art_hay', 'art_animal_treat', 'art_medicine', 'mat_fertiliser', 'art_fert_quality', 'art_fert_speed', 'art_fert_retain', 'art_fert_giant'],
  services: [...services,
    EXT('ext_coop', 'Bigger coop (+4)', 'Adds room for four more coop animals.', 2500, 'coopX', 4),
    EXT('ext_barn', 'Bigger barn (+3)', 'Adds room for three more barn animals.', 3500, 'barnX', 3),
    { id: 'greenhouse_kit', name: 'Greenhouse kit', desc: 'Builds a glass greenhouse in the back yard where crops ignore the seasons. Skip it if the Community Hall is building one.', price: 9000, icon: itemIcon('box', { c: Rr.sky[3] }), when: (g) => !g.flag('upg_greenhouse'), run: (g) => { g.setFlag('upg_greenhouse'); g.setFlag('sv_gh_bought'); return 'Pip and the workers will have it up by morning, dear!'; } },
  ],
});
// small hooks into other areas' shop data (arrays are read at open time)
const mart = get('shop', 'mart'); if (mart && Array.isArray(mart.stock)) mart.stock.push('art_hay', 'art_animal_treat');
const clinic = get('shop', 'clinic');
if (clinic) {
  if (Array.isArray(clinic.stock)) clinic.stock.push('art_medicine');
  (clinic.services ||= []).push({
    id: 'vet_farm', name: 'Farm vet visit', desc: 'Dr. Mori makes a house call to the back yard: cures every sick animal and gives each a check-up.', price: 400, icon: itemIcon('toy', { c: Rr.mint[2] }),
    run: (g) => { const sick = SV(g).animals.filter((a) => a.sick); if (!sick.length) { g.toast('Nobody on the farm is sick', 'heart'); return false; } sick.forEach((a) => cure(g, a)); g.stat('svVet'); return `All better! ${sick.map((a) => a.name).join(' and ')} will be back on their feet by tomorrow.`; },
  });
}

// ---------------------------------------------------------------- cut grass in the back yard for hay
register('targetProvider', 'sv_grass', {
  find(world, game) {
    if (world.map.id !== 'backyard' || !game.state.sv_farm || !inWorld(game)) return null;
    const [tx, ty] = facingTile(world, 12), t = tileOf(world, tx, ty);
    if (!t || !['grass', 'meadow', 'lawn'].includes(t.ground) || !(world.grid[ty] && world.grid[ty][tx])) return null;
    const S = SV(game), key = `${tx},${ty}`;
    if (S.cut[key] === game.day) return null;
    return {
      label: 'Cut grass for hay', dist: 11, x: tx * TILE + 8, y: ty * TILE + 8,
      run: (g) => {
        if (!g.useEnergy(1)) return;
        S.cut[key] = g.day; g.sfx('dig'); g.advance(2);
        const n = g.rng() < 0.45 ? 1 : 0;
        if (n) { g.give('art_hay', 1, true); g.toast('Got some hay', get('item', 'art_hay').icon); g.stat('svGrass'); } else g.toast('Just grass clippings', 'i_leaf');
        for (const k of Object.keys(S.cut)) if (S.cut[k] !== g.day) delete S.cut[k];
      },
    };
  },
});
void housed;
