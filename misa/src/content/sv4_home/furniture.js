// Decorate-catalogue pieces added by the home area (registered into interiors' CATALOG at load): kitchen gadgets, the family
// photo wall set and pet furniture. Woodworks lists every item tagged `furniture` automatically.
import { registerMany } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { CATALOG, THEMES } from '../interiors/catalog.js';
import './art.js';

const add = (id, def) => { CATALOG[id] = { w: 1, h: 1, kind: 'floor', comfort: 2, act: null, ...def, id, spr: id }; };
add('furn_gadget_ricecooker', { name: 'Rice cooker', theme: 'cafe', price: 260, comfort: 1, solid: false, desc: 'Place it at home to unlock rice-cooker recipes.', shape: 'bowl', c: '#fffaf0' });
add('furn_gadget_oven', { name: 'Kitchen oven', theme: 'cafe', price: 700, comfort: 2, w: 1, desc: 'Place it at home to unlock oven recipes.', shape: 'furniture', c: '#aab4c0' });
add('furn_gadget_blender', { name: 'Blender', theme: 'cafe', price: 300, comfort: 1, solid: false, desc: 'Place it at home to unlock smoothies and soups.', shape: 'bottle', c: '#8fb8e0' });
add('furn_photo_family', { name: 'Family portrait', theme: 'wood', price: 160, comfort: 3, kind: 'wall', desc: 'Mum, Dad and Misa grinning in a frame.', shape: 'frame', c: '#8fb8e0' });
add('furn_photo_ship', { name: 'Research ship photo', theme: 'ocean', price: 160, comfort: 3, kind: 'wall', desc: 'The ship Mum and Dad live on, on a calm blue day.', shape: 'frame', c: '#8fb8e0' });
add('furn_photo_nori', { name: 'Nori\'s portrait sketch', theme: 'retro', price: 160, comfort: 3, kind: 'wall', desc: 'Aunt Nori\'s self-portrait, pink beret and all.', shape: 'frame', c: '#f4a8c0' });
add('furn_photo_garland', { name: 'Photo garland', theme: 'cafe', price: 220, comfort: 3, kind: 'wall', w: 2, desc: 'Four little memories strung on a line.', shape: 'frame', c: '#e8c050' });
add('furn_photo_wall_big', { name: 'Family photo wall', theme: 'wood', price: 420, comfort: 5, kind: 'wall', w: 2, desc: 'A collage of every good day in this house.', shape: 'frame', c: '#e8745a' });
add('furn_pet_bed_dog', { name: 'Dog bed', theme: 'wood', price: 200, comfort: 2, kind: 'rug', w: 2, desc: 'A round plush bed for a puppy (or a cat who steals it).', shape: 'toy', c: '#e8745a' });
add('furn_hutch_rabbit', { name: 'Rabbit hutch', theme: 'wood', price: 360, comfort: 2, w: 2, desc: 'A snug hutch with a red roof.', shape: 'furniture', c: '#a67548' });
add('furn_tank_turtle', { name: 'Turtle tank', theme: 'ocean', price: 320, comfort: 2, w: 2, desc: 'A glass tank with a rock and a plant.', shape: 'box', c: '#8fb8e0' });
add('furn_cage_parakeet', { name: 'Bird cage', theme: 'cafe', price: 280, comfort: 2, desc: 'A tall cage on a stand with a swing.', shape: 'box', c: '#aab4c0' });
const items = {};
for (const id of ['furn_gadget_ricecooker', 'furn_gadget_oven', 'furn_gadget_blender', 'furn_photo_family', 'furn_photo_ship', 'furn_photo_nori', 'furn_photo_garland', 'furn_photo_wall_big', 'furn_pet_bed_dog', 'furn_hutch_rabbit', 'furn_tank_turtle', 'furn_cage_parakeet']) {
  const f = CATALOG[id];
  items[id] = {
    name: f.name, desc: `${f.desc} (${THEMES[f.theme]})`, cat: 'decor', price: f.price, tags: ['furniture', 'theme_' + f.theme].concat(f.kind === 'wall' ? ['wall'] : [], f.kind === 'rug' ? ['rug'] : []),
    icon: itemIcon(f.shape, { c: f.c }), useLabel: 'Put in decor box',
    use(game) { const st = game.state.homeDecor; st.box[id] = (st.box[id] || 0) + 1; game.toast(`${f.name} went into the decor box`, 'i_star'); return false; },
  };
}
registerMany('item', items);
