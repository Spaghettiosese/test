// Kitaminato shops and items: station kiosk, Hikari Arcade shops (stationery, electronics, import foods, vintage, pet, boutique with rare
// outfits, sweets, bakery), tea house, department store counters, bookstore, ramen stalls, snack stalls, plus the bookshop part-time job.
// Item id prefixes: city_ (misc/food), gift_city_ (gifts), cloth_city_ (outfits), key_city_ (key items).
import { register, registerMany, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { shopOpen, hoursText } from '../economy/core.js';
import { JOBS, startShift } from '../economy/jobs.js';
import { S, stamp, say, N } from './core.js';

const IT = (id, name, cat, price, shape, c, desc, extra = {}) => register('item', id, { name, cat, price, icon: itemIcon(shape, { c }), desc, ...extra });
const FOOD = (id, name, price, shape, c, energy, mood, desc, tags = []) => IT(id, name, 'food', price, shape, c, desc, { energy, mood, tags: ['food', 'city', ...tags] });
const GIFT = (id, name, price, shape, c, desc, tags = []) => IT(id, name, 'gift', price, shape, c, desc, { tags: ['gift', 'city', ...tags] });

// key items
register('item', 'key_city_train_pass', { name: 'Train Pass', desc: 'An IC card with a tiny train on it. Hoshimori-Kitaminato trips cost 120 instead of 180.', cat: 'key', key: true, price: 0, icon: itemIcon('ticket', { c: K.sky[2] }) });
register('item', 'key_city_stamp_book', { name: 'Kitaminato Stamp Book', desc: 'A little book with 40 empty boxes. Visit places and do things in the city to fill it.', cat: 'key', key: true, price: 0, icon: itemIcon('stamp', { c: K.coral[2] }) });

// station kiosk and street food
FOOD('city_ekiben', 'Station bento', 160, 'bowl', K.butter[2], 38, 4, 'An ekiben: rice, grilled fish and pickled radish in a wooden box.', ['rice']);
FOOD('city_canned_coffee', 'Canned coffee', 90, 'cup', K.wood[2], 14, 2, 'Sweet, hot, and slightly too strong. Station classic.', ['drink']);
FOOD('city_senbei', 'Soy senbei', 70, 'sweet', K.wood[3], 12, 2, 'Crunchy rice crackers brushed with soy.', ['snack']);
FOOD('city_melon_pan', 'Melon pan', 110, 'bread', K.mint[3], 20, 4, 'Crackly cookie crust, fluffy inside.', ['sweet']);
FOOD('city_takoyaki', 'Takoyaki', 140, 'plate', K.coral[3], 24, 5, 'Six hot octopus balls with sauce and dancing bonito.', ['snack']);
FOOD('city_milk_tea', 'Pearl milk tea', 130, 'cup', K.wood[4], 16, 5, 'Chewy tapioca pearls and a very wide straw.', ['drink', 'sweet']);
FOOD('city_soft_cream', 'Harbour soft cream', 120, 'sweet', K.paper[4], 14, 6, 'Vanilla swirl in a crisp cone, with a sea-salt sprinkle.', ['sweet']);
FOOD('city_cream_puff', 'Giant cream puff', 150, 'sweet', K.butter[3], 22, 6, 'A cream puff the size of a fist.', ['sweet']);
FOOD('city_croissant', 'Butter croissant', 130, 'bread', K.butter[2], 22, 4, 'Flaky, golden and still warm.', ['bread']);
FOOD('city_matcha_wagashi', 'Matcha wagashi', 160, 'sweet', K.forest[3], 16, 6, 'A green bean-paste sweet shaped like a maple leaf.', ['sweet', 'tea']);
FOOD('city_hojicha', 'Roasted hojicha', 100, 'cup', K.wood[3], 12, 5, 'Toasty and gentle, perfect with sweets.', ['tea', 'drink']);
FOOD('city_popcorn', 'Cinema popcorn', 180, 'bowl', K.butter[4], 20, 6, 'Salty-sweet popcorn in a striped bucket.', ['snack']);
const RAMEN = [['shoyu', 'Shoyu ramen', 380, K.wood[3], 55, 8], ['miso', 'Miso ramen', 420, K.butter[2], 60, 8], ['tonkotsu', 'Tonkotsu ramen', 480, K.paper[3], 66, 10], ['shio', 'Shio ramen', 400, K.sky[4], 52, 8], ['spicy', 'Spicy tan-tan ramen', 460, K.ribbon[2], 62, 9]];
for (const [id, name, price, c, en, mo] of RAMEN) FOOD('city_ramen_' + id, name, price, 'bowl', c, en, mo, `${name}: noodles, a soft egg and a deep, steamy broth.`, ['ramen', 'hot']);
FOOD('city_gyoza', 'Gyoza plate', 220, 'plate', K.wood[4], 28, 5, 'Crisp-bottomed dumplings with a vinegar dip.');

// gifts: stationery, electronics, import foods, vintage, pet, souvenirs
GIFT('gift_city_fountain_pen', 'Fountain pen', 480, 'tool', K.navy[2], 'A navy fountain pen with a brass nib. Writing feels fancy.', ['stationery']);
GIFT('gift_city_washi_set', 'Washi tape set', 220, 'paper', K.coral[3], 'Twelve rolls of patterned masking tape.', ['stationery', 'cute']);
GIFT('gift_city_letter_set', 'Pressed-flower letter set', 260, 'letter', K.lilac[3], 'Paper with real pressed petals in the corners.', ['stationery']);
GIFT('gift_city_stamp_pad', 'Cat stamp pad', 190, 'stamp', K.ribbon[2], 'A stamp pad and a tiny cat-paw stamp.', ['stationery', 'cute']);
GIFT('gift_city_sticker_book', 'Sticker album', 240, 'book', K.mint[3], 'A fat album of glossy stickers.', ['stationery', 'cute']);
GIFT('gift_city_headphones', 'Headphones', 900, 'tool', K.charcoal[3], 'Big soft headphones. The bass is a hug.', ['gadget']);
GIFT('gift_city_mini_radio', 'Pocket radio', 520, 'box', K.metal[3], 'A radio the size of a bar of soap.', ['gadget']);
GIFT('gift_city_toy_camera', 'Toy camera', 640, 'box', K.sky[3], 'A little film-look camera that clicks very satisfyingly.', ['gadget']);
GIFT('gift_city_handheld', 'Handheld game', 780, 'box', K.lilac[3], 'A pocket console with one very addictive game.', ['gadget', 'game']);
GIFT('gift_city_macarons', 'Macaron box', 420, 'sweet', K.coral[4], 'Six pastel macarons in a ribbon box.', ['sweet', 'import']);
GIFT('gift_city_chocolate', 'Swiss chocolate bar', 300, 'sweet', K.wood[2], 'Dark, smooth chocolate with a gold wrapper.', ['sweet', 'import']);
GIFT('gift_city_tea_leaves', 'Darjeeling tin', 360, 'box', K.forest[3], 'Fragrant loose-leaf tea in a painted tin.', ['tea', 'import']);
GIFT('gift_city_jam', 'Fig jam jar', 280, 'bottle', K.lilac[2], 'Dark fig jam from somewhere with olive trees.', ['import', 'sweet']);
GIFT('gift_city_olive_oil', 'Olive oil bottle', 340, 'bottle', K.forest[2], 'Green gold in a tall glass bottle.', ['import']);
GIFT('gift_city_vinyl_jazz', 'Jazz record', 620, 'coin', K.charcoal[2], 'A crackly jazz LP with a coffee ring on the sleeve.', ['vintage', 'music']);
GIFT('gift_city_old_camera', 'Old film camera', 880, 'box', K.metal[2], 'A heavy brass camera that still clicks.', ['vintage']);
GIFT('gift_city_brooch', 'Silver brooch', 540, 'gem', K.metal[4], 'A leaf-shaped silver brooch from the 1960s.', ['vintage', 'jewel']);
GIFT('gift_city_pocket_watch', 'Pocket watch', 760, 'coin', K.butter[2], 'A tiny watch that runs three minutes slow.', ['vintage', 'clock']);
GIFT('gift_city_tin_robot', 'Tin robot', 420, 'toy', K.ribbon[2], 'A wind-up robot that walks in a very determined line.', ['vintage', 'toy']);
GIFT('gift_city_museum_postcards', 'Museum postcard set', 150, 'letter', K.paper[3], 'Six postcards of the museum\'s favourite pieces.', ['souvenir']);
GIFT('gift_city_aquarium_plush', 'Otter plush', 450, 'toy', K.wood[3], 'A soft otter holding a tiny shell.', ['souvenir', 'cute']);
GIFT('gift_city_station_cookies', 'Kitaminato cookies', 380, 'sweet', K.butter[3], 'A tin of butter cookies with the station on the lid.', ['souvenir', 'sweet']);
GIFT('gift_city_balloon', 'Red balloon charm', 0, 'star', K.ribbon[2], 'A tiny balloon charm. The kid insisted.', ['cute']);
GIFT('gift_city_golden_ticket', 'Golden ticket', 0, 'ticket', K.butter[3], 'A gold ticket for a free film. Valid forever.', ['rare']);
GIFT('city_stamp_charm', 'Stamp charm', 0, 'stamp', K.coral[3], 'A charm for collecting ten stamps.', ['cute']);
IT('city_pet_wand', 'Feather wand', 'misc', 380, 'feather', K.sky[3], 'A silky feather on a springy wand. Mochi will lose their mind.', { tags: ['pet', 'mochi', 'toy'], use: (g) => { g.addMood(4); g.stat('petGoods'); g.toast('Mochi pounces on the feather. Pure joy!', 'heart'); return false; } });
IT('city_pet_collar', 'Crystal collar', 'misc', 900, 'gem', K.lilac[3], 'A collar with tiny crystals that throw rainbows.', { tags: ['pet', 'mochi', 'rare'] });
IT('city_pet_cloud_bed', 'Cloud bed', 'misc', 1200, 'furniture', K.paper[4], 'The fluffiest pet bed ever sewn.', { tags: ['pet', 'mochi', 'rare'] });
IT('city_pet_treats', 'Fish treats', 'misc', 160, 'fish', K.coral[3], 'Crunchy fish-shaped treats.', { tags: ['pet', 'mochi'], use: (g) => { g.addMood(3); g.stat('petGoods'); g.toast('Mochi crunches happily.', 'heart'); return false; } });
IT('city_pet_bell_ball', 'Bell ball', 'misc', 220, 'toy', K.butter[3], 'A ball with a bell inside. Sound guaranteed.', { tags: ['pet', 'mochi', 'toy'] });

// rare outfits (registered into the outfit registry, see cast_art/index.js)
const OUT = [
  ['kc_sailor', 'Harbour sailor', { top: '#2a3a6a', bottom: '#f4f0f0' }, 'A navy sailor collar and a white pleated skirt.', 1500, 'cloth_city_sailor'],
  ['kc_trench', 'City trench coat', { top: '#b8905a', bottom: '#3a3850' }, 'A camel trench coat. Very film noir.', 1800, 'cloth_city_trench'],
  ['kc_overalls', 'Denim overalls', { top: '#e0b830', bottom: '#3f5a8c' }, 'Yellow tee and denim overalls with a bandana.', 1200, 'cloth_city_overalls'],
  ['kc_ballet', 'Ballet pink', { top: '#f4a8c0', bottom: '#e0707a', hair: '#8b5a44' }, 'A pink wrap cardigan and a soft tulle skirt.', 1600, 'cloth_city_ballet'],
  ['kc_blazer', 'Campus blazer', { top: '#5a5a6a', bottom: '#3a3a52' }, 'A grey blazer, like the university students wear.', 0, 'cloth_city_blazer'],
  ['kc_lantern', 'Lantern night kimono', { top: '#d8402a', bottom: '#f4d070' }, 'A red and gold kimono embroidered with lanterns.', 0, 'cloth_city_lantern'],
];
for (const [oid, name, look, desc, price, iid] of OUT) {
  register('outfit', oid, { name, look, desc });
  IT(iid, name, 'clothes', price || 400, 'shirt', look.top, desc, { outfit: oid, tags: ['clothes', 'city'], useLabel: 'Try on', use: (g) => { if (!g.state.outfits.includes(oid)) g.state.outfits.push(oid); g.toast(`${name} added to your wardrobe`, null); return true; } });
}

// ---------------------------------------------------------------- shops
const KEEP = (name, hair, top) => ({ name, look: { hair, top, bottom: '#3a3850', skin: '#f2c9a4', accent: '#ffd76a' } });
const SH = (id, name, keeper, hours, stock, extra = {}) => register('shop', id, { name, owner: extra.owner || null, keeper, hours, closedWeather: [], color: K.sky[2], greet: { default: ['Welcome! Take your time.', 'Hello! Looking for anything special?'], thanks: ['Thank you very much!', 'Come again!'] }, stock, buys: ['gift'], ...extra });
SH('kc_kiosk', 'Station Kiosk', KEEP('Kiosk lady', '#c9c0d8', '#e0707a'), ['05:30', '23:00'], ['city_ekiben', 'city_canned_coffee', 'city_senbei', 'city_melon_pan', 'gift_city_station_cookies', 'gift_city_museum_postcards', 'bev_sports_drink'].filter((x) => x), { buys: [] });
SH('kc_stationery', 'Fude Stationery', KEEP('Clerk Aya', '#38334f', '#b89ae0'), ['10:00', '20:00'], ['gift_city_fountain_pen', 'gift_city_washi_set', 'gift_city_letter_set', 'gift_city_stamp_pad', 'gift_city_sticker_book', 'gift_cute_stationery'].filter((x) => x), { closed: [2] });
SH('kc_electronics', 'Denki Corner', KEEP('Clerk Jin', '#24203a', '#3d5a8c'), ['10:00', '20:30'], ['gift_city_headphones', 'gift_city_mini_radio', 'gift_city_toy_camera', 'gift_city_handheld'], { color: K.navy[2] });
SH('kc_import', 'Maison Import Foods', KEEP('Lena', '#d9763f', '#f0c040'), ['10:00', '20:00'], ['gift_city_macarons', 'gift_city_chocolate', 'gift_city_tea_leaves', 'gift_city_jam', 'gift_city_olive_oil'], { owner: 'lena', color: K.butter[2] });
SH('kc_vintage', 'Daigo\'s Old Things', KEEP('Daigo', '#c8c8dc', '#8b5a44'), ['11:00', '19:00'], ['gift_city_vinyl_jazz', 'gift_city_old_camera', 'gift_city_brooch', 'gift_city_pocket_watch', 'gift_city_tin_robot'], { owner: 'daigo', closed: [1], color: K.wood[2] });
SH('kc_pet', 'Paws and Whiskers', KEEP('Nao', '#5a3a2e', '#86cdb0'), ['10:00', '19:30'], ['city_pet_wand', 'city_pet_treats', 'city_pet_bell_ball', 'city_pet_collar', 'city_pet_cloud_bed'], { owner: 'nao', color: K.mint[2] });
SH('kc_boutique', 'Boutique Mirai', KEEP('Stylist Rei', '#ff85b8', '#262436'), ['11:00', '20:00'], ['cloth_city_sailor', 'cloth_city_trench', 'cloth_city_overalls', 'cloth_city_ballet', 'gift_hair_clip'].filter((x) => x), { closed: [2], color: K.coral[2] });
SH('kc_sweets', 'Puff and Pop Sweets', KEEP('Sweet seller', '#f4a8c0', '#e0707a'), ['10:00', '20:00'], ['city_cream_puff', 'city_soft_cream', 'city_milk_tea', 'city_matcha_wagashi']);
SH('kc_bakery', 'Boulangerie Kita', KEEP('Baker Sho', '#8b5a44', '#f4f0f0'), ['07:00', '19:00'], ['city_croissant', 'city_melon_pan', 'city_milk_tea']);
SH('kc_tea', 'Hanaori Tea House', KEEP('Haruka', '#38334f', '#4f8a58'), ['10:00', '18:00'], ['city_hojicha', 'city_matcha_wagashi', 'gift_city_tea_leaves'], { owner: 'haruka', closed: [0], color: K.forest[2] });
SH('kc_dept_1f', 'Hoshizora 1F', KEEP('Chie', '#7a4e2a', '#e43b44'), ['10:00', '20:00'], ['cloth_city_sailor', 'cloth_city_overalls', 'gift_hair_clip', 'gift_city_brooch'].filter((x) => x), { owner: 'chie', color: K.ribbon[2] });
SH('kc_dept_2f', 'Hoshizora 2F', KEEP('Chie', '#7a4e2a', '#e43b44'), ['10:00', '20:00'], ['gift_city_fountain_pen', 'gift_city_sticker_book', 'gift_city_letter_set', 'gift_city_washi_set'], { owner: 'chie', color: K.ribbon[2] });
SH('kc_book', 'Bunta Books', KEEP('Bunta', '#4a3436', '#4f8a58'), ['10:00', '19:00'], ['gift_city_museum_postcards', 'gift_city_letter_set', 'gift_handmade_bookmark'].filter((x) => x), { owner: 'bunta', color: K.navy[2], buys: ['book'] });
SH('kc_popcorn', 'Cinema Snack Bar', KEEP('Snack girl', '#b8a0c8', '#e43b44'), ['10:00', '23:00'], ['city_popcorn', 'city_canned_coffee', 'city_milk_tea', 'city_senbei'], { owner: 'mio' });
SH('kc_stall_drink', 'Drink Cart', KEEP('Cart man', '#8f8fae', '#5a8cc0'), ['09:00', '21:00'], ['city_milk_tea', 'city_canned_coffee', 'city_hojicha', 'bev_sports_drink'].filter((x) => x), { buys: [] });
SH('kc_stall_snack', 'Snack Stall', KEEP('Stall auntie', '#d6508c', '#fff1d6'), ['10:00', '21:00'], ['city_takoyaki', 'city_gyoza', 'city_soft_cream', 'city_senbei'], { buys: [] });
RAMEN.forEach(([id, name, , , ,], i) => SH('kc_ramen_' + i, ['Gen\'s Ramen', 'Miso Mansion', 'Pork Bone Paradise', 'Shio Whisper', 'Fire Dragon'][i], KEEP(i === 0 ? 'Gen' : 'Ramen chef', i === 0 ? '#c8c8dc' : '#24203a', '#fff1d6'), ['11:00', '23:30'], [`city_ramen_${id}`, 'city_gyoza', i % 2 ? 'city_ramen_shoyu' : 'city_ramen_miso'], { owner: i === 0 ? 'gen' : null, buys: [] }));

const OPEN_MSG = (s, g) => `Closed right now. ${hoursText(s)}`;
const open = (sid) => (g) => {
  const s = get('shop', sid);
  if (!shopOpen(g, s)) return g.say(null, null, OPEN_MSG(s, g));
  g.stat('kcShopVisits'); stamp(g, 'shopping'); if (sid === 'kc_boutique' || sid === 'kc_dept_1f') stamp(g, 'boutique');
  if (sid.startsWith('kc_ramen')) stamp(g, 'ramen');
  if (sid === 'kc_tea') stamp(g, 'tea');
  g.run([{ t: 'shop', id: sid }]);
};
const SHOPS = { kc_kiosk: 'Kiosk', kc_shop_stationery: 'kc_stationery', kc_shop_electronics: 'kc_electronics', kc_shop_import: 'kc_import', kc_shop_vintage: 'kc_vintage', kc_shop_pet: 'kc_pet', kc_shop_boutique: 'kc_boutique', kc_shop_sweets: 'kc_sweets', kc_shop_bakery: 'kc_bakery',
  kc_tea: 'kc_tea', kc_dept_clerk: 'kc_dept_1f', kc_dept_2f_clerk: 'kc_dept_2f', kc_book_shop: 'kc_book', kc_popcorn_stand: 'kc_popcorn', kc_stall_drink: 'kc_stall_drink', kc_stall_snack: 'kc_stall_snack' };
SHOPS.kc_kiosk = 'kc_kiosk';
for (const [iid, sid] of Object.entries(SHOPS)) register('interaction', iid, { label: (g) => `Shop: ${get('shop', sid).name}`, run: open(sid) });
RAMEN.forEach((_, i) => register('interaction', 'kc_ramen_' + i, { label: 'Order ramen', run: open('kc_ramen_' + i) }));

// ---------------------------------------------------------------- the bookshop job
JOBS.kita_book = { name: 'Bunta Books', role: 'Book shelver', boss: 'bunta', bossName: 'Bunta', minigame: 'kc_shift', wage: 240, energy: 16, xp: { study: 8, charm: 4 }, after: ['15:30', '18:30'], free: ['10:00', '18:00'], closed: [2], unlock: (g) => g.flag('kc_visited'), unlockText: 'Visit Kitaminato first' };
register('interaction', 'kc_book_job', { label: 'Part-time shift: shelving books', run: (g) => startShift(g, 'kita_book').then(() => { if (g.state.economy.jobs.kita_book && g.state.economy.jobs.kita_book.shifts) stamp(g, 'shift'); }) });

features('Kitaminato Shops', [
  'Hikari Arcade: twelve storefronts under one lantern roof, with opening hours, closing days and a clerk behind each counter',
  'Fashion boutique with four rare outfits that join your wardrobe: Harbour sailor, City trench coat, Denim overalls and Ballet pink',
  'Stationery shop, electronics corner and import foods shop with gifts the city friends love',
  'Daigo\'s vintage shop: records, old cameras, brooches, pocket watches and tin robots',
  'Pet shop with rare pet items for Mochi: crystal collar, cloud bed, feather wand and fish treats',
  'Department store counters on 1F and 2F, tea house, bakery, sweets, snack stalls and a drink cart',
  'Five ramen counters on Ramen Street, each with its own bowl, open until 11:30 PM',
  'Part-time job: shelve books at Bunta Books in a sorting minigame with ranks, wages and tips',
]);
void registerMany; void say; void N; void S;
