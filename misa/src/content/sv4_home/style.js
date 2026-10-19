// Wardrobe and style depth: accessories drawn as an overlay over Misa (4 slots), dyes and hair-colour families layered on any
// outfit through generated 'mix' outfits, 4 saved looks, laundry (clothes get dirty after 3 days), the Hoshi Stitchery tailor
// in the shotengai, and the workshop sewing machine. Outfit recolouring itself is cast_art's `outfit` registry.
import { register, registerMany, get, features } from '../../core/registry.js';
import { wrapMap } from '../sv2_orchard/orchard.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { ACC, ACC_IDS } from './art.js';
import { SV, DYES, HAIR_FAMILIES, SEWING, nm, say, N, call, menu } from './data.js';

const SLOTS = { hair: 'Hair', face: 'Face', neck: 'Neck', head: 'Head' };
const isMix = (id) => String(id).startsWith('sv4mix_');
const st = (g) => SV(g).style;

// ---------------------------------------------------------------- dyes via generated outfits
function hashOf(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); }
export function registerMix(m) { if (m && !get('outfit', m.id)) register('outfit', m.id, { name: m.name, look: m.look, desc: 'Her outfit, recoloured.' }); }
export function applyStyle(g) {
  const s = st(g), base = s.base || g.state.outfit, bd = get('outfit', base), dye = Object.fromEntries(Object.entries(s.dye).filter(([, v]) => v));
  if (!bd && !isMix(base)) return;
  if (!Object.keys(dye).length) { g.state.outfit = base; s.mix = null; return; }
  const look = { ...((bd && bd.look) || {}), ...dye }, id = `sv4mix_${base}_${hashOf(JSON.stringify(look))}`;
  s.mix = { id, name: `${bd ? bd.name : base} (dyed)`, look }; registerMix(s.mix); g.state.outfit = id;
}
export function setDye(g, slot, hex) { const s = st(g); s.dye[slot] = hex; if (!s.base || isMix(s.base)) s.base = isMix(g.state.outfit) ? s.base : g.state.outfit; applyStyle(g); g.stat('dyeJobs'); g.bus.emit('outfitChanged', { outfit: g.state.outfit, style: true }); }
function dyeMenu(g, key) {
  const [n, hex] = DYES[key];
  menu(g, `Use ${n.toLowerCase()} dye on...`, [['Hair', (gg) => { gg.take(`dye_${key}`, 1); setDye(gg, 'hair', hex); gg.say('misa', 'happy', 'Hair done! Bold choice.'); }], ['Top', (gg) => { gg.take(`dye_${key}`, 1); setDye(gg, 'top', hex); gg.say('misa', 'happy', 'A brand new top, sort of.'); }], ['Trousers', (gg) => { gg.take(`dye_${key}`, 1); setDye(gg, 'bottom', hex); gg.say('misa', 'happy', 'Trousers, transformed.'); }]]);
}

// ---------------------------------------------------------------- accessory overlay on Misa's sprite
const DIRN = { down: 'down', up: 'up', left: 'side', right: 'side' };
register('worldLayer', 'sv4_acc', {
  sprites(world, game) {
    const s = game.state.sv4_home; if (!s) return [];
    const eq = Object.values(s.style.acc).filter((id) => id && ACC[id]); if (!eq.length) return [];
    const p = world.player, order = { neck: 0, face: 1, hair: 2, head: 3 };
    return [{ y: p.y + 0.02, draw: () => {
      for (const id of eq.sort((a, b) => order[ACC[a].slot] - order[ACC[b].slot])) {
        const img = world.img(`sv4_acc_${id}_${DIRN[p.dir] || 'down'}`, p.dir === 'left'); if (img) world.g.drawImage(img, Math.round(world.sx(p.x) - 20), Math.round(world.sy(p.y) + 2 - 56));
      }
    } }];
  },
});
const equip = (g, id) => { const s = st(g); s.acc[ACC[id].slot] = s.acc[ACC[id].slot] === id ? null : id; g.sfx('select'); g.stat('accEquipped'); };

// ---------------------------------------------------------------- wardrobe menu (wraps cast_art's wardrobe)
const wardrobe = get('interaction', 'wardrobe'), origWardrobe = wardrobe && wardrobe.run;
function accMenu(g) {
  const s = st(g), owned = s.owned.filter((id) => ACC[id]);
  if (!owned.length) return g.say('misa', 'neutral', 'My accessory case is empty. The tailor in the shotengai sells ribbons, glasses, scarves and hats.');
  menu(g, 'Accessory case', owned.map((id) => [`${s.acc[ACC[id].slot] === id ? '> ' : ''}${ACC[id].name} (${SLOTS[ACC[id].slot].toLowerCase()})`, (gg) => { equip(gg, id); accMenu(gg); }]).concat([['Take everything off', (gg) => { gg.state.sv4_home.style.acc = {}; }]]));
}
const presetName = (p) => (p ? `${(get('outfit', p.base) || { name: p.base }).name}${Object.values(p.acc || {}).filter(Boolean).length ? ' + acc' : ''}` : 'empty');
function looksMenu(g) {
  const s = st(g);
  menu(g, 'Saved looks', s.presets.map((p, i) => [`Look ${i + 1}: ${presetName(p)}`, (gg) => menu(gg, `Look ${i + 1}`, [
    ['Save what I am wearing', (g3) => { const b = s.base || g3.state.outfit; s.presets[i] = { base: isMix(b) ? 'hoodie' : b, dye: { ...s.dye }, acc: { ...s.acc } }; g3.toast(`Saved as look ${i + 1}`); g3.stat('looksSaved'); }],
    ['Wear it', (g3) => { const pr = s.presets[i]; if (!pr) return g3.toast('Nothing saved there yet'); if (!g3.state.outfits.includes(pr.base) && get('outfit', pr.base)) return g3.toast('You do not own that outfit any more'); s.base = pr.base; s.dye = { ...pr.dye }; s.acc = { ...pr.acc }; applyStyle(g3); g3.bus.emit('outfitChanged', { outfit: g3.state.outfit, style: true }); g3.toast(`Wearing look ${i + 1}`); g3.sfx('select'); }],
  ])]));
}
if (wardrobe) wardrobe.run = (g) => {
  const s = st(g), dirty = Object.entries(s.worn).filter(([, n]) => n >= 3).length;
  menu(g, `Wardrobe${dirty ? ` (${dirty} need washing)` : ''}`, [
    ['Change outfit', () => origWardrobe(g)], ['Accessories', accMenu], ['Saved looks (4)', looksMenu],
    ['Wash the dye out', (gg) => { st(gg).dye = {}; applyStyle(gg); gg.toast('Back to her natural colours'); }],
  ]);
};
register('system', 'sv4_style', { init(game) {
  game.sv4Dye = (k) => { if (game.has(`dye_${k}`)) dyeMenu(game, k); };
  const reg = () => { const m = game.state.sv4_home && st(game).mix; if (m) registerMix(m); };
  game.bus.on('gameLoaded', reg); game.bus.on('gameStart', reg);
  game.bus.on('outfitChanged', (e) => { if (e && e.style) return; const s = st(game); if (isMix(game.state.outfit)) return; s.base = game.state.outfit; applyStyle(game); });
  game.salonStyles = [...(game.salonStyles || []), ...Object.entries(HAIR_FAMILIES).map(([id, [name, hex]]) => ({ id: `sv4_hair_${id}`, name: `Hair: ${name.toLowerCase()}`, desc: hex ? `A salon colour in the ${name.toLowerCase()} family.` : 'Back to her natural brown.', price: hex ? 600 : 200, icon: itemIcon('hat', { c: hex || '#8b5a44' }), apply: (g) => { setDye(g, 'hair', hex); g.addMood(8); } }))];
  // laundry: consecutive days in the same outfit make it dirty
  game.bus.on('dayStart', () => {
    const s = st(game), b = s.base || game.state.outfit; if (!get('outfit', b)) return;
    s.worn = { [b]: (s.worn[b] || 0) + 1 };
    if (s.worn[b] >= 3 && !['pyjamas', 'star_pajamas'].includes(b)) { game.addMood(-3); game.toast('This outfit needs a wash! Check the laundry basket.', 'i_sweat'); game.stat('dirtyDays'); }
  });
  game.bus.on('homeTask', ({ id }) => { if (id === 'laundry') st(game).worn = {}; });
} });
const washNow = (g) => { const s = st(g), n = Object.keys(s.worn).length; if (!n) return g.say('misa', 'neutral', 'Nothing dirty in here. I wore each outfit only a day or two.'); g.advance(20); s.worn = {}; g.sfx('splash'); g.addMood(2); g.stat('washes'); g.say('misa', 'happy', 'Whirr, splash, done. Everything smells like sunshine again.'); };
wrapMap('home', 'objects', (list) => list.map((o) => (o.spr === 'int_basket' ? { ...o, interact: { label: (g) => (Object.values(st(g).worn).some((n) => n >= 3) ? 'Laundry basket (dirty clothes)' : 'Laundry basket'), run: washNow } } : o)));

// ---------------------------------------------------------------- sewing machine in the workshop
register('interaction', 'sv4_sew', { label: 'Sewing machine', run: (g) => {
  const pats = Object.keys(SEWING).filter((k) => g.has(`pattern_${k}`));
  if (!pats.length) return g.say('misa', 'neutral', 'A sewing machine! I need a pattern from the tailor in the shotengai, plus 4 cloth and 2 yarn.');
  menu(g, 'Sew which pattern?', pats.map((k) => [`${SEWING[k][0]} (4 cloth, 2 yarn)`, (gg) => {
    if (!gg.has('mat_cloth', 4) || !gg.has('mat_yarn', 2)) return gg.toast('Needs 4 cloth and 2 yarn');
    if (!gg.useEnergy(5)) return; gg.take('mat_cloth', 4); gg.take('mat_yarn', 2); gg.take(`pattern_${k}`, 1); gg.advance(90); gg.addXP('crafting', 8);
    gg.give(`cloth_sv4_${k}`, 1); gg.stat('sewn'); gg.sfx('chime'); gg.say('misa', 'happy', `Stitch, stitch, snip... the ${SEWING[k][0].toLowerCase()} is done! Use it from my bag to try it on.`);
  }]));
} });

// ---------------------------------------------------------------- the tailor: Hoshi Stitchery (shotengai, in the old tea shop's doorway)
register('shop', 'tailor', {
  name: 'Hoshi Stitchery', owner: 'sv4_tailor', keeper: { name: 'Ms. Hoshi', look: { hair: '#c8c8dc', top: '#a98ae0', bottom: '#4a4a66', skin: '#f2c9a4', accent: '#e8c050' } },
  hours: ['10:00', '18:00'], closed: [6], color: Rr.sakura[2], buys: ['clothes'],
  greet: { default: ['Welcome to the Stitchery. Mind the pins, dear.', 'A little nip here, a little tuck there. What are we making?', 'Ribbons, dyes and patterns. Take your time.'], thanks: ['Wear it well.', 'Bring it back if it needs a stitch.'] },
  stock: [...Object.keys(DYES).map((k) => `dye_${k}`), ...ACC_IDS.map((id) => `acc_${id}`), ...Object.keys(SEWING).map((k) => `pattern_${k}`), 'mat_cloth', 'mat_yarn', 'mat_felt', 'mat_string'],
});
register('interaction', 'shop_tailor', { label: 'Hoshi Stitchery', run: (g) => new Promise((res) => g.open('shop', 'tailor', res)) });
wrapMap('shotengai', 'objects', (list) => [...list.map((o) => (o.x === 34 && o.y === 4 && o.interact && !o.spr ? { x: o.x, y: o.y, w: 1, h: 1, solid: false, use: 'shop_tailor' } : o)), { spr: 'sv4_tailor_sign', x: 35, y: 4, solid: false, dy: -26 }]);

features('Home & Pets', [
  'Accessory overlay: ribbons, a star clip, round and sun glasses, scarves, a sun hat, beanies, cat ears and a beret drawn over Misa in every direction',
  'Four accessory slots (hair, face, neck, head) managed from the wardrobe, with a case that grows as you buy accessories',
  'Hoshi Stitchery in the shotengai: a tailor selling dyes, accessories, sewing patterns and cloth',
  'Eight dyes recolour Misa\'s hair, top or trousers on top of any outfit; the wardrobe can wash the dye out',
  'Hair-colour families at the salon: honey blonde, cherry pink, midnight blue, minty green, lilac and ginger',
  'Four saved looks store an outfit with its dyes and accessories for one-click changes',
  'Laundry: wearing the same outfit three days running makes it dirty and costs a little mood until you wash it in the basket',
  'Workshop sewing machine: six sewing patterns turn cloth and yarn into new wardrobe outfits',
]);
void N; void say; void call; void registerMany; void nm;
