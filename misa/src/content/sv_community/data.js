// Community Hall data and logic. Hoshimori Community Hall has six rooms; each room has bundles. A bundle is a short
// list of slots: { item, n } (an item id and how many to hand over; the pseudo item 'coins' means money). A bundle
// needs `need` of its slots filled. All bundles in a room restore the room; all rooms restore the hall.
//   BUNDLES[i] = { id, room, name, blurb, need, slots: [[itemId, n]], reward: { coins?, items?: {id:n}, stickers? } }
// Save slice `state.community`: { filled: {bundleId: {slotIdx: day}}, done: {bundleId: day}, rooms: {roomId: day}, ... }.
// Bus events: bundleDone {id, room}, roomRestored {room}, hallRestored {}. Stats: bundlesDone, roomsRestored, hallDeposits.
import { register, get, all } from '../../core/registry.js';

export const ROOM_ORDER = ['fish', 'pantry', 'craft', 'garden', 'night', 'vault'];
export const ROOMS = {
  fish: { name: 'Fish Tank', blurb: 'A great glass tank that wants fish again.', flag: 'hall_room_fish', perk: 'Every bus ride is half price (coins refunded)', perkFlag: 'upg_bus_discount' },
  pantry: { name: 'Pantry', blurb: 'Shelves and a stove that remember good meals.', flag: 'hall_room_pantry', perk: 'The hall mill grinds rice and corn into flour', perkFlag: 'upg_hall_mill' },
  craft: { name: 'Craft Room', blurb: 'A cosy workshop with a sheet-covered loom.', flag: 'hall_room_craft', perk: 'The hall loom spins yarn into cloth and felt', perkFlag: 'upg_hall_loom' },
  garden: { name: 'Garden Room', blurb: 'A glasshouse corner, grown wild and then forgotten.', flag: 'hall_room_garden', perk: 'The school greenhouse is upgraded and your bag grows by 4', perkFlag: 'upg_greenhouse' },
  night: { name: 'Night Sky Room', blurb: 'A round room that was built to look at stars.', flag: 'hall_room_night', perk: 'The spirit gate: free travel to the shrine, beach and park', perkFlag: 'upg_hall_path' },
  vault: { name: 'Vault', blurb: 'Hoshimori\'s old coin vault. It wants a fresh start.', flag: 'hall_room_vault', perk: 'The sprites pay a little tip every Sunday', perkFlag: 'upg_hall_vault' },
};
// Slots written as 'item*n'.
const B = (id, room, name, blurb, need, slots, reward = {}) => ({ id, room, name, blurb, need, slots: slots.split(' ').map((s) => { const [i, n] = s.split('*'); return [i, +(n || 1)]; }), reward });

export const BUNDLES = [
  // ---- Fish Tank
  B('fish_river', 'fish', 'River Bundle', 'Little fish from the fresh streams.', 4, 'fish_crucian fish_carp fish_bluegill fish_loach fish_medaka', { coins: 150 }),
  B('fish_pond', 'fish', 'Pond Bundle', 'Pond dwellers with big opinions.', 4, 'fish_goldfish fish_catfish fish_bass fish_smelt fish_eel', { items: { ing_honey: 2 } }),
  B('fish_shore', 'fish', 'Shore Bundle', 'The silver crowd from the harbour wall.', 4, 'fish_sardine fish_horse_mackerel fish_mackerel fish_goby fish_whiting', { items: { mat_bait_premium: 3 } }),
  B('fish_deep', 'fish', 'Deep Sea Bundle', 'Fine fish from the far side of the pier.', 3, 'fish_sea_bream fish_flounder fish_rockfish fish_yellowtail fish_bonito', { coins: 400 }),
  B('fish_legend', 'fish', 'Legend Bundle', 'The tank saves its best corner for legends.', 2, 'fish_sakura_koi fish_moon_bream fish_storm_marlin fish_ice_lantern', { stickers: 3 }),
  // ---- Pantry
  B('pan_breakfast', 'pantry', 'Breakfast Bundle', 'A proper start to the day.', 3, 'dish_tamagoyaki dish_miso_soup dish_onigiri dish_butter_toast', { items: { ing_egg: 4 } }),
  B('pan_noodle', 'pantry', 'Noodle Bundle', 'Slurp-worthy.', 3, 'dish_udon dish_ramen dish_yakisoba dish_hiyashi_chuka', { coins: 250 }),
  B('pan_sweets', 'pantry', 'Sweets Bundle', 'The sprites have a sweet tooth.', 4, 'dish_dango dish_taiyaki dish_dorayaki dish_strawberry_shortcake dish_cookies', { items: { ing_sugar: 4, ing_vanilla: 1 } }),
  B('pan_staples', 'pantry', 'Staples Bundle', 'The shelves look rather bare.', 5, 'ing_rice*3 ing_flour*3 ing_honey ing_soy ing_miso ing_dashi', { coins: 200 }),
  B('pan_feast', 'pantry', 'Feast Bundle', 'For the day the whole town eats here.', 3, 'dish_sashimi dish_tempura dish_nabe dish_curry_rice dish_bento', { stickers: 3 }),
  // ---- Craft Room
  B('craft_threads', 'craft', 'Threads Bundle', 'Soft things for the loom.', 4, 'mat_yarn*3 mat_cloth*2 mat_string*3 mat_felt mat_beads', { items: { mat_yarn: 3 } }),
  B('craft_wood', 'craft', 'Workshop Bundle', 'Cogs, springs and good timber.', 4, 'mat_wood*3 mat_glue mat_wire*2 mat_spring mat_brass_gear', { coins: 300 }),
  B('craft_artist', 'craft', 'Artist Bundle', 'Paint, ink and pretty paper.', 4, 'mat_paint mat_ink mat_paper*3 mat_washi mat_letter_set', { items: { mat_washi: 3 } }),
  B('craft_shell', 'craft', 'Seashell Bundle', 'Treasures of the tideline.', 4, 'shell_cowrie shell_conch shell_sand_dollar shell_glass_blue shell_coral', { coins: 350 }),
  B('craft_home', 'craft', 'Homemaker Bundle', 'Little comforts, made by hand.', 3, 'furn_flower_vase furn_lantern_paper furn_wind_chime furn_candles furn_rug_leaf', { stickers: 3 }),
  // ---- Garden Room
  B('gar_spring', 'garden', 'Spring Bundle', 'First greens and first blooms.', 4, 'crop_turnip crop_spinach crop_strawberry crop_cabbage crop_tulip', { items: { seed_turnip: 5 } }),
  B('gar_summer', 'garden', 'Summer Bundle', 'Sun-warm and juicy.', 4, 'crop_tomato crop_corn crop_watermelon crop_cucumber crop_sunflower', { items: { seed_tomato: 5 } }),
  B('gar_autumn', 'garden', 'Autumn Bundle', 'Orange, gold and a little bit of rust.', 4, 'crop_pumpkin crop_sweet_potato crop_cosmos crop_chrysanthemum crop_eggplant', { items: { seed_pumpkin: 4 } }),
  B('gar_winter', 'garden', 'Winter Bundle', 'Hardy things that laugh at frost.', 3, 'crop_kale crop_snow_pea crop_yuzu crop_snowdrop crop_camellia', { items: { mat_premium_fertiliser: 2 } }),
  B('gar_bugs', 'garden', 'Garden Visitors Bundle', 'Every good garden has guests.', 4, 'bug_ladybug bug_honeybee bug_cabbage_white bug_swallowtail bug_grasshopper', { coins: 250 }),
  // ---- Night Sky Room
  B('sky_glow', 'night', 'Glow Bundle', 'Small lights that come out after dusk.', 3, 'bug_firefly*2 bug_moon_moth bug_bell_cricket bug_higurashi', { coins: 400 }),
  B('sky_stones', 'night', 'Stone Bundle', 'Pretty rocks for the dome ceiling.', 4, 'min_quartz min_amethyst min_moonstone min_obsidian min_geode', { items: { mat_glass: 3 } }),
  B('sky_fossil', 'night', 'Fossil Bundle', 'Old things from older nights.', 3, 'min_ammonite min_trilobite min_amber min_shark_tooth min_meteorite', { stickers: 3 }),
  B('sky_tide', 'night', 'Moonlit Shore Bundle', 'Pearls and glass from midnight beaches.', 3, 'shell_pearl shell_nautilus shell_glass_pink shell_message shell_moon_snail', { coins: 500 }),
  B('sky_stargazer', 'night', 'Stargazer Bundle', 'Furnishings fit for an observatory.', 3, 'furn_star_chart furn_star_mobile furn_lamp_star furn_star_tree', { stickers: 4 }),
  // ---- Vault (coins)
  B('vault_1', 'vault', 'Vault Bundle: Spare Change', 'A little to start the vault.', 1, 'coins*1500', { items: { ing_tea: 3 } }),
  B('vault_2', 'vault', 'Vault Bundle: Pocket Money', 'A tidy sum for the repair fund.', 1, 'coins*3000', { stickers: 2 }),
  B('vault_3', 'vault', 'Vault Bundle: Savings', 'Now we are getting serious.', 1, 'coins*6000', { stickers: 3 }),
  B('vault_4', 'vault', 'Vault Bundle: Big Spender', 'The roof and the lanterns need paying for.', 1, 'coins*10000', { stickers: 5 }),
];
export const BUNDLE = Object.fromEntries(BUNDLES.map((b) => [b.id, b]));
export const bundlesOf = (room) => BUNDLES.filter((b) => b.room === room);

// ---------------------------------------------------------------- save slice
register('stateSlice', 'community', { default: () => ({ filled: {}, done: {}, rooms: {}, restored: 0, deposits: 0, owed: [], murmur: null, tipDay: 0, blessDay: 0, tips: 0, pathUses: 0, millUses: 0, loomUses: 0 }) });
export const S = (game) => game.state.community;

// ---------------------------------------------------------------- slot helpers
export const COINS = 'coins';
export const slotName = (item) => (item === COINS ? 'Coins' : (get('item', item) || { name: item }).name);
export const slotIcon = (item) => (item === COINS ? 'i_coin' : (get('item', item) || {}).icon);
export const isFilled = (game, bid, i) => !!(S(game).filled[bid] && S(game).filled[bid][i]);
export const filledCount = (game, b) => b.slots.reduce((a, _, i) => a + (isFilled(game, b.id, i) ? 1 : 0), 0);
export const isDone = (game, bid) => !!S(game).done[bid];
export const roomDone = (game, room) => !!S(game).rooms[room];
export const hallDone = (game) => !!S(game).restored;
export const have = (game, item) => (item === COINS ? game.money : game.count(item));
export const canFill = (game, b, i) => !isDone(game, b.id) && !isFilled(game, b.id, i) && have(game, b.slots[i][0]) >= b.slots[i][1];
export const roomProgress = (game, room) => { const bs = bundlesOf(room); return { done: bs.filter((b) => isDone(game, b.id)).length, total: bs.length }; };
export const totalProgress = (game) => ({ done: BUNDLES.filter((b) => isDone(game, b.id)).length, total: BUNDLES.length });
// How many slots could be filled right now (phone badge).
export const fillable = (game) => { let n = 0; for (const b of BUNDLES) if (!isDone(game, b.id)) b.slots.forEach((_, i) => { if (canFill(game, b, i)) n++; }); return n; };
export const missingItems = (game, b) => b.slots.map((s, i) => ({ s, i })).filter(({ i }) => !isFilled(game, b.id, i));

// ---------------------------------------------------------------- rewards
function grant(game, id, n) { if (get('item', id)) game.give(id, n); }
function stickers(game, n, why) { if (game.giveStickers) game.giveStickers(n, why); else grant(game, 'star_sticker', n); }
export function giveBundleReward(game, b) {
  const r = b.reward || {};
  if (r.coins) { game.addMoney(r.coins); game.toast(`+${r.coins} coins from the sprites`, 'i_coin'); }
  for (const [id, n] of Object.entries(r.items || {})) grant(game, id, n);
  if (r.stickers) stickers(game, r.stickers, b.name);
}
export const rewardText = (b) => {
  const r = b.reward || {}, parts = [];
  if (r.coins) parts.push(`${r.coins} coins`);
  for (const [id, n] of Object.entries(r.items || {})) parts.push(`${n} ${slotName(id)}`);
  if (r.stickers) parts.push(`${r.stickers} Star Stickers`);
  return parts.join(', ') || 'The sprites\' thanks';
};

// Room restoration: sets the flags the map reads, and unlocks the room perk.
export function restoreRoom(game, room) {
  const st = S(game), def = ROOMS[room];
  if (st.rooms[room]) return false;
  st.rooms[room] = game.day; game.setFlag(def.flag, true); game.setFlag(def.perkFlag, true); game.setFlag('hall_any_room', true);
  game.stat('roomsRestored');
  if (Object.keys(st.rooms).length >= 3) game.setFlag('hall_rooms3', true);
  if (room === 'fish') stickers(game, 3, 'Fish Tank restored');
  if (room === 'pantry') { stickers(game, 3, 'Pantry restored'); grant(game, 'ing_butter', 3); }
  if (room === 'craft') { stickers(game, 3, 'Craft Room restored'); grant(game, 'mat_rainbow_wool', 1); }
  if (room === 'garden') { game.state.bagSize += 4; game.toast('Your bag holds 4 more things!', 'i_bag'); stickers(game, 3, 'Garden Room restored'); grant(game, 'mat_premium_fertiliser', 3); }
  if (room === 'night') { stickers(game, 4, 'Night Sky Room restored'); grant(game, 'furn_star_mobile', 1); }
  if (room === 'vault') { stickers(game, 8, 'Vault restored'); grant(game, 'furn_jukebox', 1); }
  game.bus.emit('roomRestored', { room });
  return true;
}
export function restoreHall(game) {
  const st = S(game);
  if (st.restored) return false;
  st.restored = game.day; game.setFlag('community_restored', true);
  stickers(game, 15, 'Hall restored'); game.addMoney(1000); grant(game, 'furn_trophy_fish', 1); grant(game, 'dish_starlight_mochi', 3); game.addMood(15);
  game.bus.emit('hallRestored', {});
  return true;
}

// Finish a bundle (called when enough slots are filled). Returns { bundle, room, hall } flags for the UI.
export function finishBundle(game, b) {
  const st = S(game), out = { bundle: true, room: false, hall: false };
  st.done[b.id] = game.day; game.setFlag('hall_b_' + b.id, true);
  game.stat('bundlesDone');
  giveBundleReward(game, b);
  game.bus.emit('bundleDone', { id: b.id, room: b.room });
  if (bundlesOf(b.room).every((x) => st.done[x.id])) {
    out.room = restoreRoom(game, b.room);
    if (out.room && ROOM_ORDER.every((r) => st.rooms[r])) out.hall = restoreHall(game);
  }
  return out;
}
// Put the item for slot i of bundle b into the bundle. Returns { ok, why?, bundle, room, hall }.
export function deposit(game, bid, i) {
  const b = BUNDLE[bid];
  if (!b || !b.slots[i]) return { ok: false, why: 'No such slot' };
  if (isDone(game, bid)) return { ok: false, why: 'This bundle is already complete' };
  if (isFilled(game, bid, i)) return { ok: false, why: 'Already filled' };
  const [item, n] = b.slots[i];
  if (have(game, item) < n) return { ok: false, why: `Need ${n} ${slotName(item)}, you have ${have(game, item)}` };
  if (item === COINS) { game.spend(n); game.stat('hallCoinsGiven', n); } else game.take(item, n);
  const st = S(game);
  (st.filled[bid] ||= {})[i] = game.day; st.deposits++;
  game.stat('hallDeposits');
  game.sfx('coin');
  const res = { ok: true, bundle: false, room: false, hall: false };
  if (filledCount(game, b) >= b.need) Object.assign(res, finishBundle(game, b));
  return res;
}
// Fill every slot you can afford in one bundle; returns the combined result.
export function depositAll(game, bid) {
  const b = BUNDLE[bid], res = { ok: false, count: 0, bundle: false, room: false, hall: false };
  if (!b) return res;
  for (let i = 0; i < b.slots.length; i++) {
    if (isDone(game, bid)) break;
    if (!canFill(game, b, i)) continue;
    const r = deposit(game, bid, i);
    if (r.ok) { res.ok = true; res.count++; if (r.bundle) Object.assign(res, { bundle: true, room: r.room, hall: r.hall }); }
  }
  return res;
}
// Debug / test helper: complete things instantly without needing the items.
export function cheatBundle(game, bid) {
  const b = BUNDLE[bid], st = S(game);
  if (!b || st.done[bid]) return null;
  b.slots.forEach((_, i) => { (st.filled[bid] ||= {})[i] = game.day; });
  return finishBundle(game, b);
}

// ---------------------------------------------------------------- daily hint (the sprites murmur)
const WHERE = {
  fish: 'somewhere wet, with a rod', bug: 'out in the tall grass', crop: 'in a garden bed', shell: 'along the tideline', mineral: 'down in the rocks',
  food: 'from a warm kitchen', material: 'from the craft bench', decor: 'from a craftsperson', gift: 'from a friend', misc: 'around town',
};
export function whereHint(item) { if (item === COINS) return 'in your piggy bank'; const d = get('item', item); return WHERE[(d && d.cat) || 'misc'] || WHERE.misc; }
export function pickMurmur(game) {
  const r = game.rngFor('hall_murmur'), open = BUNDLES.filter((b) => !isDone(game, b.id));
  if (!open.length) return null;
  const b = open[Math.floor(r() * open.length)], miss = missingItems(game, b);
  if (!miss.length) return null;
  const m = miss[Math.floor(r() * miss.length)];
  return { day: game.day, bid: b.id, i: m.i, item: m.s[0], n: m.s[1] };
}
export const murmurText = (m) => (m ? `The hall sprites whisper: ${m.n > 1 ? m.n : 'a'} ${slotName(m.item)} for the ${BUNDLE[m.bid].name} would make us so happy. Try ${whereHint(m.item)}.` : 'The hall sprites hum a happy song. Nothing is missing!');
