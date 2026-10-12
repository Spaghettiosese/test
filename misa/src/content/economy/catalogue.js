// Economy area: Aunt Nori's Star Catalogue (phone app). Exclusive decor and outfits paid with Star Stickers,
// ordered by phone and delivered by parcel the next morning. 8 always-available pieces plus a new page each season.
// Decor items: cat 'decor', tags ['decor', 'starCatalogue'], place: { w, h } (tiles) for the interiors decorate mode.
// Outfit items: cat 'clothes', outfit: '<outfit id>'; using one adds that outfit to state.outfits when cast_art registers it.
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS } from '../../gfx/palette.js';
import { rect, panel, btn, drawText, drawTextC, measure, wrapPx, fit, C, K, inside, starGlyph, slot } from './gfx.js';
import './icons.js';

const Rr = RAMPS;
// [id, name, page, stickers, shape, colour, desc, extra]
const CAT = [
  ['furn_star_lamp', 'Starry night lamp', 'always', 3, 'lamp', Rr.butter[2], 'Casts tiny stars on the ceiling. Nori drew the pattern herself.', { place: { w: 1, h: 1 } }],
  ['furn_star_cloud_rug', 'Cloud rug', 'always', 4, 'rug', Rr.sky[3], 'A fluffy rug shaped like a cumulus cloud.', { place: { w: 2, h: 2 } }],
  ['furn_star_moon_chair', 'Crescent moon chair', 'always', 5, 'chair', Rr.lilac[2], 'Curl up inside the moon.', { place: { w: 1, h: 1 } }],
  ['furn_star_mochi_cushion', 'Mochi face cushion', 'always', 2, 'toy', Rr.hairGinger[3], 'An orange cushion with Mochi\'s grumpy face.', { place: { w: 1, h: 1 } }],
  ['furn_star_poster', 'Nori\'s lighthouse print', 'always', 3, 'frame', Rr.navy[2], 'A signed print of the Star Lantern at dusk.', { place: { w: 1, h: 1 }, wall: true }],
  ['furn_star_garland', 'Star garland', 'always', 2, 'star', Rr.butter[3], 'Felt stars on a string, for any wall.', { place: { w: 2, h: 1 }, wall: true }],
  ['cloth_star_pajamas', 'Star pajamas', 'always', 6, 'shirt', Rr.navy[3], 'Navy pajamas covered in tiny gold stars.', { outfit: 'star_pajamas' }],
  ['cloth_star_beret', 'Nori\'s beret', 'always', 4, 'hat', Rr.hairPink[2], 'A pink beret, just like Aunt Nori\'s.', { outfit: 'nori_beret' }],
  ['furn_star_sakura_screen', 'Sakura folding screen', 'spring', 6, 'furniture', Rr.sakura[3], 'Hand-painted cherry blossoms on paper panels.', { place: { w: 2, h: 1 } }],
  ['furn_star_tulip_vase', 'Tulip vase', 'spring', 2, 'plant', Rr.hairPink[2], 'A glass vase of paper tulips that never wilt.', { place: { w: 1, h: 1 } }],
  ['cloth_star_sakura_dress', 'Sakura sundress', 'spring', 6, 'dress', Rr.sakura[3], 'A light dress with a petal print.', { outfit: 'sakura_dress' }],
  ['furn_star_bunny_lamp', 'Moon bunny lamp', 'spring', 4, 'lamp', Rr.paper[4], 'A bunny pounding mochi on the moon, glowing softly.', { place: { w: 1, h: 1 } }],
  ['furn_star_fishbowl', 'Goldfish bowl', 'summer', 4, 'jar', Rr.sky[3], 'Two paper goldfish that bob when you tap the glass.', { place: { w: 1, h: 1 } }],
  ['furn_star_wind_chime', 'Starlight wind chime', 'summer', 3, 'bottle', Rr.sky[2], 'A glass chime painted with the summer triangle.', { place: { w: 1, h: 1 }, wall: true }],
  ['cloth_star_yukata', 'Firefly yukata', 'summer', 7, 'dress', Rr.navy[2], 'A navy yukata with glowing yellow fireflies.', { outfit: 'firefly_yukata' }],
  ['furn_star_hammock', 'Beach hammock', 'summer', 6, 'rug', Rr.coral[3], 'A striped hammock for very lazy afternoons.', { place: { w: 2, h: 1 } }],
  ['furn_star_maple_shelf', 'Maple leaf shelf', 'autumn', 5, 'furniture', Rr.leafAutumn[2], 'A shelf with maple-leaf brackets.', { place: { w: 2, h: 1 } }],
  ['furn_star_pumpkin_lamp', 'Pumpkin lantern', 'autumn', 3, 'fruit', Rr.leafAutumn[3], 'A friendly carved pumpkin with a candle inside.', { place: { w: 1, h: 1 } }],
  ['cloth_star_cardigan', 'Acorn cardigan', 'autumn', 5, 'shirt', Rr.wood[2], 'A cosy knit cardigan with acorn buttons.', { outfit: 'acorn_cardigan' }],
  ['furn_star_reading_nook', 'Reading nook', 'autumn', 7, 'chair', Rr.woodDark[3], 'An armchair, a blanket and a lamp. Suzu would approve.', { place: { w: 2, h: 2 } }],
  ['furn_star_kotatsu', 'Kotatsu', 'winter', 8, 'furniture', Rr.coral[2], 'A heated table with a quilt. Mochi will never leave.', { place: { w: 2, h: 2 } }],
  ['furn_star_snow_globe', 'Snow globe', 'winter', 3, 'jar', Rr.snow[3], 'A tiny Hoshimori Bay inside, snowing forever.', { place: { w: 1, h: 1 } }],
  ['cloth_star_duffel', 'Starry duffel coat', 'winter', 7, 'shirt', Rr.paper[3], 'A cream duffel coat with star toggles.', { outfit: 'starry_duffel' }],
  ['cloth_star_earmuffs', 'Cat earmuffs', 'winter', 4, 'hat', Rr.hairGinger[3], 'Fluffy earmuffs with little cat ears.', { outfit: 'cat_earmuffs' }],
];
export const CATALOGUE = CAT.map(([id, name, page, cost, shape, c, desc, extra]) => {
  const isCloth = id.startsWith('cloth_');
  register('item', id, {
    name, desc, cat: isCloth ? 'clothes' : 'decor', price: cost * 40, icon: itemIcon(shape, { c }), tags: [isCloth ? 'clothes' : 'decor', 'starCatalogue', 'cute'], stickers: cost, ...extra,
    ...(isCloth ? { useLabel: 'Try on', use: (g) => { const o = extra.outfit; if (get('outfit', o)) { if (!g.state.outfits.includes(o)) g.state.outfits.push(o); g.toast(`${name} added to your wardrobe`, null); } else g.toast(`${name}: so cute! Keep it safe for now.`, null); return true; } } : {}),
  });
  return { id, page, cost };
});
const PAGES = ['always', 'season'];
const pageItems = (game, p) => CATALOGUE.filter((c) => (p === 'always' ? c.page === 'always' : c.page === game.season));

register('system', 'econ_catalogue', {
  init(game) {
    game.bus.on('dayStart', () => {
      const cat = game.state.economy.catalogue;
      if (!cat.orders.length) return;
      const names = [];
      for (const o of cat.orders) { game.give(o.id, 1, true); names.push(get('item', o.id).name); }
      cat.orders = [];
      game.mail(`econ_nori_${game.day}`, 'Aunt Nori', `Parcel time! Pip should have dropped off your ${names.join(', ')}. I wrapped everything in my old sketches, recycle responsibly! Love, Nori`);
      game.toast('A parcel from Aunt Nori arrived', null);
    });
  },
});

register('phoneApp', 'catalogue', {
  name: 'Star Catalogue', icon: 'econ_i_star', order: 48,
  open(game, app) { app.state.sel ??= 0; app.state.page ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, list = pageItems(game, PAGES[st.page]), n = list.length, { x, y, w, h } = app.area, cols = 4;
    if (input.pressed.has('c') || (input.justDown && inside(input.mx, input.my, x, y, 150, 12))) { st.page = 1 - st.page; st.sel = 0; game.sfx('page'); }
    if (K.right(input)) st.sel = Math.min(n - 1, st.sel + 1);
    if (K.left(input)) st.sel = Math.max(0, st.sel - 1);
    if (K.down(input)) st.sel = Math.min(n - 1, st.sel + cols);
    if (K.up(input)) st.sel = Math.max(0, st.sel - cols);
    if (input.justDown) { const gx = Math.floor((input.mx - x - 4) / 34), gy = Math.floor((input.my - y - 18) / 34), j = gy * cols + gx; if (gx >= 0 && gx < cols && gy >= 0 && j < n) st.sel = j; }
    const c = list[st.sel];
    const order = input.pressed.has('enter') || input.pressed.has('o') || (input.justDown && inside(input.mx, input.my, x + 146, y + h - 20, w - 148, 16));
    if (c && order) {
      const cat = game.state.economy.catalogue;
      if (cat.orders.some((o) => o.id === c.id)) { game.toast('Already ordered! It arrives tomorrow morning.', null); return; }
      if (game.count('star_sticker') < c.cost) { game.toast(`You need ${c.cost} Star Stickers`, null); game.sfx('wrong'); return; }
      game.take('star_sticker', c.cost); cat.orders.push({ id: c.id, day: game.day }); cat.bought[c.id] = (cat.bought[c.id] || 0) + 1;
      game.toast(`Ordered ${get('item', c.id).name}! Pip delivers it tomorrow.`, null); game.sfx('buy'); game.stat('catalogueOrders');
    }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, list = pageItems(game, PAGES[st.page]), cols = 4;
    rect(g, C.coral, x, y, 150, 12); drawTextC(g, st.page ? `${game.season} page (C)` : 'Always in stock (C)', x + 75, y + 3, C.text, 1, null);
    starGlyph(g, x + w - 40, y + 2); drawText(g, `x${game.count('star_sticker')}`, x + w - 30, y + 3, C.ink, 1, null);
    list.forEach((c, i) => {
      const gx = x + 4 + (i % cols) * 34, gy = y + 18 + Math.floor(i / cols) * 34, it = get('item', c.id), owned = game.count(c.id) > 0 || (game.state.economy.catalogue.bought[c.id] || 0) > 0;
      rect(g, i === st.sel ? C.gold : RAMPS.paper[1], gx, gy, 32, 32); rect(g, owned ? RAMPS.mint[4] : C.paperHi, gx + 1, gy + 1, 30, 30);
      slot(g, gx + 6, gy + 3, it.icon, 0, { fill: owned ? RAMPS.mint[4] : C.paperHi });
      starGlyph(g, gx + 5, gy + 24); drawText(g, String(c.cost), gx + 14, gy + 25, C.ink, 1, null);
    });
    const c = list[st.sel];
    const dx = x + 146, dw = w - 148;
    panel(g, dx, y + 14, dw, h - 14, 'paper');
    drawText(g, 'Love, Aunt Nori', dx + 6, y + 20, RAMPS.lilac[1], 1, null);
    if (!c) return;
    const it = get('item', c.id);
    drawText(g, fit(it.name, dw - 12), dx + 6, y + 34, C.coralD, 1, null);
    drawText(g, `${it.cat === 'clothes' ? 'Outfit' : 'Decor'}  ${c.cost} stickers`, dx + 6, y + 44, RAMPS.ink[2], 1, null);
    wrapPx(it.desc, dw - 12).slice(0, 6).forEach((l, i) => drawText(g, l, dx + 6, y + 56 + i * 9, C.ink, 1, null));
    const ordered = game.state.economy.catalogue.orders.some((o) => o.id === c.id);
    if (game.count(c.id)) drawText(g, `You own ${game.count(c.id)}`, dx + 6, y + h - 32, RAMPS.forest[1], 1, null);
    btn(g, dx + 4, y + h - 20, dw - 8, 16, ordered ? 'Arrives tomorrow' : `Order for ${c.cost} stickers`, { disabled: ordered || game.count('star_sticker') < c.cost, tone: 'mint' });
    void measure;
  },
});

features('Money, shops & economy', [
  'Aunt Nori\'s Star Catalogue phone app: 24 exclusive decor pieces and outfits bought with Star Stickers',
  'The Star Catalogue has an always-in-stock page and a new page every season',
  'Catalogue orders arrive by parcel the next morning, with a note from Aunt Nori',
]);
