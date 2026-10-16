// Cast art area: Misa's outfits (palette families of her hand-painted sheet, see gfx/chars.js misaLookPairs), the
// wardrobe and the mirror. The 18 character sheets/portraits are painted by tools/studio-cast.mjs into assets/cast/.
import { register, features, get } from '../../core/registry.js';

// look: { top, bottom, hair } colours; hoodie (null look) is her painted default.
const OUTFITS = [
  ['hoodie', 'Blue hoodie', null, 'Her everyday hoodie. Soft, slightly stretched at the cuffs.'],
  ['uniform', 'School uniform', { top: '#2a3a6a', bottom: '#3a3a52' }, 'Navy blazer and a pleated skirt. Hoshimori High.'],
  ['pyjamas', 'Cosy pyjamas', { top: '#9fb8e0', bottom: '#b9a8d8' }, 'Soft and baggy. For lazy mornings.'],
  ['sunny_yellow', 'Sunny raincoat', { top: '#e8b830', bottom: '#4a5a7a' }, 'A cheerful yellow raincoat. Puddles welcome.'],
  ['cherry_pink', 'Cherry pink hoodie', { top: '#e86a8a', bottom: '#4a4a66' }, 'The pink of early hanami.'],
  ['mint_breeze', 'Mint sweater', { top: '#7ac8a8', bottom: '#d8d0c0' }, 'Cool and calm, like a lemon soda.'],
  ['sakura_dress', 'Sakura dress', { top: '#f4a8c0', bottom: '#f4a8c0' }, 'A pale pink dress with petals on the hem.'],
  ['star_pajamas', 'Star pajamas', { top: '#2a3a6a', bottom: '#2a3a6a' }, 'Navy pajamas covered in tiny gold stars.'],
  ['nori_beret', 'Nori\'s beret', { top: '#3d5a8c', bottom: '#2a3552', hair: '#8b5a44' }, 'A pink beret, just like Aunt Nori\'s.'],
  ['firefly_yukata', 'Firefly yukata', { top: '#2f6a88', bottom: '#2f6a88' }, 'Deep blue with little glowing fireflies.'],
  ['acorn_cardigan', 'Acorn cardigan', { top: '#b0703c', bottom: '#5a4a3a' }, 'Autumn-coloured and cosy.'],
  ['cat_earmuffs', 'Cat earmuffs', { top: '#d8d8e8', bottom: '#4a4a66' }, 'Fluffy ears for the coldest mornings.'],
  ['starry_duffel', 'Starry duffel coat', { top: '#3a2a5a', bottom: '#2a2a40' }, 'A night-sky coat with toggle buttons.'],
  ['festival_red', 'Festival happi', { top: '#d8402a', bottom: '#2a2a40' }, 'A red happi coat for matsuri.'],
  ['golden_hair', 'Honey highlights', { top: '#3d5a8c', bottom: '#2a3552', hair: '#d8a050' }, 'A little sun in her hair.'],
];
for (const [id, name, look, desc] of OUTFITS) register('outfit', id, { name, look, desc });

const outfitName = (id) => (get('outfit', id) || {}).name || id;
function setOutfit(g, id) {
  g.state.outfit = id;
  if (!g.state.outfits.includes(id)) g.state.outfits.push(id);
  g.bus.emit('outfitChanged', { outfit: id });
  g.stat && g.stat('outfitChanges');
}

register('interaction', 'wardrobe', {
  label: 'Wardrobe',
  run: (g) => {
    const owned = g.state.outfits.filter((o) => get('outfit', o));
    const options = owned.map((o) => ({ text: (g.state.outfit === o ? '> ' : '') + outfitName(o), steps: [{ t: 'call', fn: (gg) => { setOutfit(gg, o); gg.toast(`Wearing: ${outfitName(o)}`, null); gg.sfx && gg.sfx('select'); } }] }));
    options.push({ text: 'Never mind', steps: [] });
    g.run([{ t: 'choice', prompt: `Wardrobe (${owned.length} outfits)`, options }]);
  },
});

register('interaction', 'mirror', {
  label: 'Mirror',
  run: (g) => {
    const cur = outfitName(g.state.outfit);
    g.run([
      { t: 'say', who: 'misa', mood: 'happy', text: `${cur}... not bad!` },
      { t: 'call', fn: (gg) => { gg.state.flags.mirror_day !== gg.state.time.day && (gg.state.flags.mirror_day = gg.state.time.day, gg.addMood(2)); } },
    ]);
  },
});

features('Cast & Outfits', [
  'All 18 townsfolk painted through Moonkai Pixel Studio: walking sheets in four directions plus mood portraits',
  `${OUTFITS.length} outfits recolour Misa's hand-painted hoodie, trousers and hair, keeping her shading`,
  'Wardrobe at home to change outfits; mirror gives a small daily mood lift',
  'Bought and gifted clothes add their outfits to the wardrobe automatically',
  'Neighbours notice a new outfit and say something about it',
]);
