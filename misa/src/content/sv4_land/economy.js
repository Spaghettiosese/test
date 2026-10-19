// Mountain & Meadow economy and calendar: shops, part-time jobs (ryokan helper, ranch hand), festivals and the Region phone app.
import { register, get, features } from '../../core/registry.js';
import { JOBS, startShift } from '../economy/jobs.js';
import { UI, rect, panel, drawText, bar } from '../../ui/ui.js';
import { wrapPx } from '../../font.js';
import { SV4, PLACES, BADGES, STAMPS, TRAILS, mtWeather, say } from './data.js';
import { cabinOpen } from './maps_meadow.js';

// ------------------------------------------------------------------ shops
const SHOPS = {
  sv4_tea: { name: 'Trailhead Tea Stall', owner: 'tea_lady', keeper: { name: 'Auntie Sen', look: { hair: '#e8e8f0', top: '#c45a46', bottom: '#4a4a5a', skin: '#e0b090', accent: '#e8c070' } }, hours: ['6:30', '17:30'], color: '#c45a46',
    greet: { default: ['Hot tea for cold hikers! Sit, sit.', 'Oyaki straight off the grill. Mind the steam.', 'Bear bell? Walking stick? Poncho? Take all three, dear.'] },
    stock: ['dish_tk_oyaki', 'dish_tk_trail_mix', 'drink_tk_hot_amazake', 'bev_green_tea', 'snack_onigiri_salmon', 'gift_tk_bear_bell', 'tool_tk_stick', 'tool_tk_poncho'] },
  sv4_souv: { name: 'Kitsune Souvenir Shop', owner: 'chiyo_yk', hours: ['9:00', '19:00'], color: '#2f3f7a', buys: ['mineral'], bonusCats: ['mineral'],
    greet: { default: ['Souvenirs for the folks at home. Or for you. We do not judge.', 'Everything here smells faintly of sulfur and cedar.'] },
    stock: ['gift_yk_kokeshi', 'gift_yk_towel', 'gift_yk_sulfur_soap', 'gift_yk_bath_salts', 'gift_yk_snow_globe', 'gift_yk_charm', 'dish_yk_manju', 'gift_tk_bear_bell'] },
  sv4_egg: { name: 'Onsen Egg Stand', owner: 'egg_lady', keeper: { name: 'Ume', look: { hair: '#4a3a30', top: '#f4e8c8', bottom: '#4a4a5a', skin: '#e0b090', accent: '#e8c838' } }, hours: ['9:00', '20:00'], color: '#e8c838',
    greet: { default: ['Fresh onsen eggs! Cooked by the mountain itself.', 'Fruit milk after the bath, hand on hip!'] },
    stock: ['dish_yk_onsen_egg', 'dish_yk_manju', 'drink_yk_fruit_milk', 'drink_tk_hot_amazake', 'dish_yk_cat_snack', 'ing_egg'] },
  sv4_hut: { name: 'Tsukimi Hut Kitchen', owner: 'osuzu_tk', hours: ['6:00', '19:30'], color: '#8f6a4a',
    greet: { default: ['Stew is hot. Sit down.', 'Wet socks by the fire, dear.'] }, stock: ['dish_tk_mountain_stew', 'drink_tk_hot_amazake', 'bev_green_tea', 'dish_tk_trail_mix', 'tool_tk_poncho'] },
  sv4_ranch: { name: 'Meadow Ranch Store', owner: 'daigo_ml', hours: ['7:00', '17:00'], color: '#a67548', buys: ['crop'], buyTags: ['dairy', 'egg', 'wool'],
    greet: { default: ['Welcome to the ranch store. Hay, treats and cheese.', 'Take a milk bottle for the road.'] },
    stock: ['art_hay', 'art_animal_treat', 'ing_carrot', 'ing_milk', 'ing_butter', 'ing_cheese', 'ing_egg', 'drink_ml_fresh_milk', 'ing_ml_wheat', 'gift_ml_wool_socks', 'gift_ml_straw_hat', 'gift_ml_cheese_box', 'gift_ml_horseshoe'] },
  sv4_mill: { name: 'Windmill Flour Shop', owner: 'fumi_ml', hours: ['8:00', '17:00'], color: '#e8c070',
    greet: { default: ['Fresh flour! Today\'s grind is still warm.'] }, stock: ['ing_ml_wheat', 'ing_ml_buckwheat', 'ing_flour', 'ing_ml_soba_flour', 'dish_ml_soba', 'dish_ml_cheese_toast', 'ing_honey'], buys: ['crop'], buyTags: ['grain'] },
  sv4_fruit: { name: 'Orchard Fruit Stand', owner: 'kiyo_ml', hours: ['8:00', '17:30'], color: '#e8866a', buys: ['crop'], bonusCats: ['crop'], buyTags: ['fruit'],
    greet: { default: ['Fruit from the rows, picked this morning.'] },
    stock: [{ item: 'ing_cherry', when: 'season:spring' }, { item: 'ing_peach', when: 'season:summer' }, { item: 'ing_apple', when: 'season:autumn' }, { item: 'ing_persimmon', when: 'season:autumn' }, { item: 'ing_ml_mikan', when: 'season:winter' }, 'dish_ml_cherry_pie', 'gift_ml_honey', 'ing_honey'] },
  sv4_dairy: { name: 'Market Dairy Stall', owner: 'dairy', keeper: { name: 'Stall keeper', look: { hair: '#f4f0f0', top: '#a8d0e0', bottom: '#fffaf0', skin: '#f2c9a4', accent: '#a8d0e0' } }, days: [5, 6], hours: ['9:00', '16:00'], color: '#a8d0e0',
    greet: { default: ['Market milk, butter and cheese!'] }, stock: ['drink_ml_fresh_milk', 'ing_milk', 'ing_butter', 'ing_cream', 'ing_yogurt', 'ing_cheese', 'art_cheese', 'gift_ml_cheese_box'] },
  sv4_bakery: { name: 'Market Bakery Stall', owner: 'baker', keeper: { name: 'Baker', look: { hair: '#8a6a4a', top: '#f4e8c8', bottom: '#6a5a40', skin: '#f2c9a4', accent: '#e8c070' } }, days: [5, 6], hours: ['9:00', '16:00'], color: '#e8c070',
    greet: { default: ['Warm bread! Warm! Warm!'] }, stock: ['dish_ml_cheese_toast', 'dish_ml_cherry_pie', 'snack_melon_bread', 'ing_bread', 'ing_flour', 'dish_ml_soba'] },
  sv4_craft: { name: 'Market Craft Stall', owner: 'crafter', keeper: { name: 'Crafter', look: { hair: '#3a2a4a', top: '#4f8a58', bottom: '#4a4a5a', skin: '#d6a07c', accent: '#e87aa0' } }, days: [5, 6], hours: ['9:00', '16:00'], color: '#4f8a58',
    greet: { default: ['Handmade! By me, my cousin and one very patient sheep.'] }, stock: ['gift_ml_straw_hat', 'gift_ml_wool_socks', 'gift_ml_honey', 'gift_ml_lantern', 'gift_ml_horseshoe', 'gift_yk_kokeshi'] },
  sv4_produce: { name: 'Market Produce Stall', owner: 'grower', keeper: { name: 'Grower', look: { hair: '#5a4030', top: '#6aa040', bottom: '#6a5a40', skin: '#d6a07c', accent: '#d9533b' } }, days: [5, 6], hours: ['9:00', '16:00'], color: '#6aa040',
    greet: { default: ['Vegetables so fresh they still have opinions.'] },
    stock: ['ing_carrot', 'ing_onion', 'ing_potato', 'ing_cabbage', { item: 'ing_tomato', when: 'season:summer|autumn' }, { item: 'ing_corn', when: 'season:summer' }, { item: 'ing_cucumber', when: 'season:summer' }, 'dish_ml_corn_grill'] },
};
for (const [id, d] of Object.entries(SHOPS)) register('shop', id, d);

// ------------------------------------------------------------------ jobs: a ryokan helper and a ranch hand (they reuse the serving and sorting shift games)
JOBS.ryokan = { name: 'Kitsune-no-Yu', role: 'Ryokan helper', boss: 'chiyo_yk', bossName: 'Chiyo', minigame: 'job_cafe', wage: 290, energy: 22, xp: { charm: 8, homemaking: 6 }, after: ['15:30', '18:30'], free: ['9:00', '18:00'], closed: [], unlock: (g) => !!(g.state.sv4_land && g.state.sv4_land.visited.yukemuri_village), unlockText: 'After visiting Yukemuri village' };
JOBS.ranch = { name: 'Meadow Ranch', role: 'Ranch hand', boss: 'daigo_ml', bossName: 'Daigo', minigame: 'job_fishmarket', wage: 270, energy: 26, xp: { gardening: 8, homemaking: 6 }, after: ['15:30', '18:00'], free: ['6:00', '15:00'], closed: [6], unlock: (g) => !!(g.state.sv4_land && g.state.sv4_land.visited.meadow_ranch), unlockText: 'After visiting Meadow Ranch' };
for (const id of ['ryokan', 'ranch']) register('interaction', 'job_' + id, { label: `Work a shift (${JOBS[id].role.toLowerCase()})`, run: (g) => startShift(g, id) });
// reception and ranch store offer the job through their menus
{
  const rd = get('interaction', 'yk_desk'), base = rd.run;
  rd.run = (g) => g.run([{ t: 'choice', prompt: 'Chiyo: Welcome, or are you here to work?', options: [{ text: 'Reception services', steps: [{ t: 'call', fn: () => base(g) }] }, { text: 'Work a helper shift', steps: [{ t: 'call', fn: () => startShift(g, 'ryokan') }] }, { text: 'Leave', steps: [] }] }]);
  const rr = get('interaction', 'sv4_shop_ranch'), rb = rr.run;
  rr.run = (g) => g.run([{ t: 'choice', prompt: 'Meadow Ranch store', options: [{ text: 'Shop', steps: [{ t: 'call', fn: () => rb(g) }] }, { text: 'Work a ranch hand shift', steps: [{ t: 'call', fn: () => startShift(g, 'ranch') }] }, { text: 'Leave', steps: [] }] }]);
}

// ------------------------------------------------------------------ festivals
const N = (text) => ({ t: 'say', who: null, mood: null, text });
const S = (who, mood, text) => ({ t: 'say', who, mood, text });
const T = (spot, spr, dx = 0, dy = 0, extra = {}) => ({ spot, spr, dx, dy, ...extra });
const FEST = {
  ml_blossom_picnic: { name: 'Meadow Blossom Picnic', icon: 'i_leaf', date: 'spring-24', maps: ['meadow_orchard'], hours: ['10:00', '18:00'], shop: true, desc: 'Blossom picnics under the cherry rows of Meadow Orchard.',
    decor: { meadow_orchard: [T('picnic', 'ev_picnic_mat', 1, 1, { flat: true }), T('gate', 'ev_chochin_pink', 1, -1, { light: 'lantern' }), T('aisle', 'ev_lanterns_pink', 0, -3, { light: 'lantern' }), T('stand', 'ev_stall_sweets', 3, -1)] },
    activities: [{ id: 'picnic', map: 'meadow_orchard', spot: 'picnic', dy: 1, label: 'Share a blossom picnic', daily: true, run: (g) => g.run([S('kiyo_ml', 'happy', 'Cherry rows in full bloom, and a mat in the sun. Sit, sit! I brought pie.'), N('Petals fall into the tea. Nobody minds.'), { t: 'mood', n: 15 }, { t: 'energy', n: 10 }, { t: 'friend', npc: 'kiyo_ml', n: 20 }]) }],
    closeAt: '15:00', closeMap: 'meadow_orchard', script: () => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: 'hanami' }, { t: 'fade', to: 0, dur: 0.6 }, S('kiyo_ml', 'happy', 'Thank you for coming. The trees were listening, I promise.'), S('misa', 'happy', 'It is the prettiest picnic I have ever been to.'), { t: 'mood', n: 12 }, { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }] },
  tk_star_watch: { name: 'Summit Star-Watch Night', icon: 'i_star', date: 'summer-23', maps: ['tsukimi_summit'], hours: ['19:00', '23:30'], desc: 'A night of stars and telescopes on the Tsukimi summit lookout.',
    decor: { tsukimi_summit: [T('lookout', 'ev_chochin_white', -3, 0, { light: 'lantern' }), T('lookout', 'ev_chochin_white', 3, 0, { light: 'lantern' }), T('telescope', 'ev_lanterns', 0, -2, { light: 'lantern' })] },
    activities: [{ id: 'stars', map: 'tsukimi_summit', spot: 'star_view', label: 'Lie back and count shooting stars', daily: true, run: (g) => g.run([N('Eleven stars fall before the clock hits ten. Shun hands you a flask of ginger tea.'), S('shun_tk', 'happy', 'Make a wish. The mountain keeps a list.'), { t: 'mood', n: 14 }, { t: 'energy', n: 6 }, { t: 'friend', npc: 'shun_tk', n: 15 }]) }],
    closeAt: '21:30', closeMap: 'tsukimi_summit', script: () => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: 'soc_stars' }, { t: 'fade', to: 0, dur: 0.6 }, S('misa', 'happy', 'The whole sky is awake tonight.'), S('shun_tk', 'happy', 'Twenty years on this mountain and it still shows off.'), { t: 'mood', n: 16 }, { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }] },
  tk_koyo: { name: 'Koyo Leaves Festival', icon: 'i_leaf', date: 'autumn-10', maps: ['tsukimi_trailhead', 'tsukimi_forest'], hours: ['08:00', '17:00'], shop: true, desc: 'The mountain turns red and gold. Tea stalls, lanterns and a leaf contest at the trailhead.',
    decor: { tsukimi_trailhead: [T('tea_stall', 'ev_chochin', -2, 1, { light: 'lantern' }), T('tea_stall', 'ev_chochin', 4, 1, { light: 'lantern' }), T('sign', 'ev_bunting', 0, -3), T('bus_stop', 'ev_leaf_pile', -1, 1, { flat: true })] },
    activities: [{ id: 'leaf_contest', map: 'tsukimi_trailhead', spot: 'sign', dy: 1, label: 'Enter the koyo leaf contest', daily: true, run: (g) => { const has = g.has('forage_tk_koyo_leaf'); if (has) g.take('forage_tk_koyo_leaf', 1); return g.run([N(has ? 'You pin a perfect red maple leaf to the contest board. It wins the youth prize!' : 'You sketch a maple leaf on a card instead. The judges give you a kind second place.'), { t: 'money', n: has ? 300 : 80 }, { t: 'mood', n: has ? 14 : 8 }]); } }],
    closeAt: '16:00', closeMap: 'tsukimi_trailhead', script: () => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: 'soc_sunset' }, { t: 'fade', to: 0, dur: 0.6 }, S('shun_tk', 'happy', 'Every autumn the mountain gets dressed up. And every autumn I forget to breathe.'), S('misa', 'happy', 'Red everywhere. I want to keep this.'), { t: 'mood', n: 14 }, { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }] },
  ml_barn_dance: { name: 'Meadow Barn Dance', icon: 'i_music', date: 'autumn-17', maps: ['meadow_market'], hours: ['16:00', '22:00'], shop: true, desc: 'A harvest barn dance at the Meadow Market with hay bale seats and a fiddle.',
    decor: { meadow_market: [T('dance_floor', 'ev_lanterns', 1, -3, { light: 'lantern' }), T('square', 'ev_chochin', -5, -2, { light: 'lantern' }), T('square', 'ev_chochin', 6, -2, { light: 'lantern' })] },
    activities: [{ id: 'dance', map: 'meadow_market', spot: 'dance_floor', dy: 1, label: 'Join the barn dance', daily: true, run: (g) => g.run([N('The fiddle starts. Daigo grabs your hands, spins you twice, and trips over a hay bale. Everyone cheers.'), { t: 'choice', prompt: 'Your dance style?', options: [{ text: 'Wild stomping', steps: [N('Boots on boards, dust in the lamplight!'), { t: 'mood', n: 16 }] }, { text: 'Gentle waltz', steps: [N('Round and round beneath the lanterns.'), { t: 'mood', n: 14 }] }] }, { t: 'friend', npc: 'daigo_ml', n: 20 }, { t: 'energy', n: -6 }]) }],
    closeAt: '20:30', closeMap: 'meadow_market', script: () => [S('daigo_ml', 'happy', 'Last dance, Misa! Come on, the whole valley is watching.'), { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: 'soc_sunset' }, { t: 'fade', to: 0, dur: 0.6 }, S('misa', 'happy', 'My feet hurt and I would do it again right now.'), { t: 'mood', n: 15 }, { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }] },
  yk_lantern_snow: { name: 'Yukemuri Lantern Snow Festival', icon: 'i_star', date: 'winter-8', maps: ['yukemuri_village'], hours: ['16:00', '22:00'], shop: true, desc: 'Paper lanterns glow along the snowy streets of Yukemuri, with floating lanterns at the footbath.',
    decor: { yukemuri_village: [T('lamp_row', 'ev_lanterns', -8, 0, { light: 'lantern' }), T('lamp_row', 'ev_lanterns', 8, 0, { light: 'lantern' }), T('street_w', 'ev_chochin_white', 3, -1, { light: 'lantern' }), T('street_e', 'ev_chochin_white', -3, -1, { light: 'lantern' }), T('footbath', 'ev_ice_swan', 0, -2), T('plaza', 'ev_snowman', 2, 0)] },
    activities: [{ id: 'float', map: 'yukemuri_village', spot: 'footbath', dy: 1, label: 'Float a paper lantern (80)', cost: 80, daily: true, run: (g) => g.run([N('You write a wish on a paper lantern and set it on the warm water. Snow falls on the light, and the light does not mind.'), { t: 'mood', n: 14 }, { t: 'friend', npc: 'mayu_yk', n: 10 }]) }],
    closeAt: '20:30', closeMap: 'yukemuri_village', script: () => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: 'soc_stars' }, { t: 'fade', to: 0, dur: 0.6 }, S('chiyo_yk', 'happy', 'All the lanterns together. My mother used to say this is what the mountain dreams.'), S('misa', 'happy', 'It is the most beautiful night I have ever seen in the snow.'), { t: 'mood', n: 18 }, { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }] },
};
for (const [id, d] of Object.entries(FEST)) register('festival', id, d);

// ------------------------------------------------------------------ Region phone app
const TABS = ['Places', 'Stamps', 'Trails', 'Hours'];
const HOURS_SHOPS = ['sv4_tea', 'sv4_souv', 'sv4_egg', 'sv4_hut', 'sv4_ranch', 'sv4_mill', 'sv4_fruit', 'sv4_dairy', 'sv4_bakery', 'sv4_craft'];
register('phoneApp', 'sv4_region', {
  name: 'Region', icon: 'i_map', order: 38,
  open(game, app) { app.state.tab ??= 0; app.state.sel ??= 0; },
  update(dt, input, game, app) {
    const st = app.state, k = input.pressed, { x, y } = app.area;
    if (k.has('c')) { st.tab = (st.tab + 1) % TABS.length; st.sel = 0; }
    if (input.justDown && input.my >= y && input.my < y + 11) { const i = Math.floor((input.mx - x) / 73); if (i >= 0 && i < TABS.length) { st.tab = i; st.sel = 0; } }
    const n = st.tab === 0 ? PLACES.length : st.tab === 3 ? HOURS_SHOPS.length : 1;
    if (k.has('arrowdown') || k.has('s')) st.sel = (st.sel + 1) % n;
    if (k.has('arrowup') || k.has('w')) st.sel = (st.sel + n - 1) % n;
    if (input.justDown && st.tab === 0 && input.mx < x + 110 && input.my > y + 14) { const top = Math.max(0, Math.min(n - 9, st.sel - 4)), i = top + Math.floor((input.my - y - 16) / 11); if (i >= 0 && i < n) st.sel = i; }
  },
  draw(g, game, app) {
    const { x, y, w, h } = app.area, st = app.state, S4 = SV4(game);
    TABS.forEach((t, i) => { rect(g, i === st.tab ? UI.accent : UI.paper2, x + i * 73, y, 71, 11); drawText(g, t, x + i * 73 + 8, y + 2, i === st.tab ? UI.text : UI.ink, 1, null); });
    const line = (txt, xx, yy, c = UI.ink, ww = w - 12) => wrapPx(txt, ww).forEach((l, i) => drawText(g, l, xx, yy + i * 10, c, 1, null));
    if (st.tab === 0) {
      const top = Math.max(0, Math.min(PLACES.length - 9, st.sel - 4));
      PLACES.slice(top, top + 9).forEach(([id, name], j) => { const i = top + j; if (i === st.sel) rect(g, UI.gold, x, y + 15 + j * 11, 110, 10); drawText(g, (S4.visited[id] ? '' : '? ') + name.slice(0, 18), x + 3, y + 16 + j * 11, S4.visited[id] ? UI.ink : UI.dim, 1, null); });
      const [id, name, desc] = PLACES[st.sel]; panel(g, x + 114, y + 14, w - 114, h - 14, 'paper'); drawText(g, name, x + 120, y + 20, UI.accent2, 1, null);
      line(desc, x + 120, y + 34, UI.ink, w - 128); line(S4.visited[id] ? 'Visited' : 'Not visited yet', x + 120, y + 78, S4.visited[id] ? UI.good : UI.dim);
      line(['tsukimi_trailhead', 'yukemuri_village', 'meadow_road', 'meadow_market', 'meadow_lake'].includes(id) ? 'Region express bus stop (120c)' : ['tsukimi_summit'].includes(id) ? 'Ropeway from trailhead or village (150c)' : 'On foot', x + 120, y + 92, UI.dim, w - 128);
      if (id === 'meadow_cabin') line(cabinOpen(game) ? 'Rented: yours until Sunday night' : 'Rent at the lake board, Fri to Sun', x + 120, y + 112, UI.accent2, w - 128);
    } else if (st.tab === 1) {
      drawText(g, `Hot-spring Stamp Rally ${Object.keys(S4.stamps).length}/6`, x + 4, y + 18, UI.accent2, 1, null);
      STAMPS.forEach(([id, name], i) => { const yy = y + 32 + i * 18, got = S4.stamps[id]; rect(g, UI.ink, x + 4, yy, 14, 14); rect(g, got ? UI.gold : UI.paper2, x + 5, yy + 1, 12, 12); if (got) drawText(g, '*', x + 9, yy + 3, UI.accent2, 1, null); drawText(g, name, x + 24, yy + 3, got ? UI.ink : UI.dim, 1, null); });
      line(S4.rallyPaid ? 'Card complete! Golden towel received.' : 'Soak in every bath to fill the card: 1500 coins, a golden towel and Star Stickers.', x + 4, y + 146, UI.dim);
    } else if (st.tab === 2) {
      drawText(g, `Stamina ${Math.round(S4.stamina)}%   Mountain: ${mtWeather(game)}`, x + 4, y + 18, UI.accent2, 1, null); bar(g, x + 4, y + 30, w - 8, 6, S4.stamina / 100);
      BADGES.forEach(([id, name], i) => { const cx = x + 4 + (i % 2) * 146, yy = y + 42 + Math.floor(i / 2) * 12, got = S4.badges[id]; rect(g, got ? UI.gold : UI.paper2, cx, yy, 8, 8); drawText(g, name, cx + 12, yy, got ? UI.ink : UI.dim, 1, null); });
      drawText(g, `Trail Book ${Object.keys(S4.badges).length}/12`, x + 4, y + 118, UI.accent2, 1, null);
      drawText(g, TRAILS.slice(0, 3).map((t) => `${t[0]} (${t[3]})`).join(', ').slice(0, 52), x + 4, y + 132, UI.dim, 1, null); drawText(g, TRAILS.slice(3).map((t) => `${t[0]} (${t[3]})`).join(', ').slice(0, 52), x + 4, y + 142, UI.dim, 1, null);
    } else {
      HOURS_SHOPS.forEach((id, j) => { const s = get('shop', id), open = game.shopOpen ? game.shopOpen(id) : true; if (j === st.sel) rect(g, UI.gold, x, y + 15 + j * 14, w, 13); drawText(g, s.name.slice(0, 26), x + 3, y + 16 + j * 14, UI.ink, 1, null); drawText(g, open ? 'Open' : 'Closed', x + w - 42, y + 16 + j * 14, open ? UI.good : UI.bad, 1, null); });
      const hrs = game.shopHours ? game.shopHours(HOURS_SHOPS[st.sel]) : ''; drawText(g, hrs.slice(0, 48), x + 3, y + 158, UI.dim, 1, null);
    }
  },
});
void say;
features('Mountain & Meadow', [
  'Region phone app: places with visited marks and transport tips, the Stamp Rally card, Trail Book badges with stamina and mountain weather, and shop opening hours',
  'Ten new shops: the trailhead tea stall, ryokan souvenir shop, onsen egg stand, hut kitchen, ranch store, windmill flour shop, orchard fruit stand and weekend market dairy, bakery, craft and produce stalls',
  'Market stalls open on weekends and festival days; on weekdays they are shut behind stacks of crates',
  'Two new part-time jobs: ryokan helper at Kitsune-no-Yu and ranch hand at Meadow Ranch, appearing in the Jobs app with booking and ranks',
  'Meadow Blossom Picnic (Spring 24) under the cherry rows with a shared picnic and closing scene',
  'Summit Star-Watch Night (Summer 23) with lanterns on the lookout and shooting stars with Shun',
  'Koyo Leaves Festival (Autumn 10) at the trailhead with lanterns, bunting and a leaf contest',
  'Meadow Barn Dance (Autumn 17) in the market with hay bale seats, a dance floor and a closing last dance',
  'Yukemuri Lantern Snow Festival (Winter 8) with lanterns along the snowy streets, a footbath lantern float and a closing scene',
]);
