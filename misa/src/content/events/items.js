// Event and festival items: festival food, stall prizes, Mochi's little gifts, things in the mail.
import { registerMany } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as K } from '../../gfx/palette.js';

registerMany('item', {
  // festival food (buffs and gifts)
  dish_fest_candy_apple: { name: 'Candy apple', desc: 'A shiny red apple in a crackly sugar shell. Festival magic on a stick.', cat: 'food', price: 40, energy: 14, mood: 6, tags: ['sweet', 'festival'], icon: itemIcon('fruit', { c: K.ribbon[2] }) },
  dish_fest_cotton_candy: { name: 'Cotton candy', desc: 'A pink cloud on a stick. It vanishes the moment you taste it.', cat: 'food', price: 30, energy: 8, mood: 8, tags: ['sweet', 'festival'], icon: itemIcon('sweet', { c: K.sakura[3] }) },
  dish_fest_kashiwa: { name: 'Kashiwa mochi', desc: 'Rice cake with sweet bean paste, wrapped in an oak leaf for Children\'s Day.', cat: 'food', price: 45, energy: 18, mood: 5, tags: ['sweet', 'festival'], icon: itemIcon('onigiri', { c: K.forest[2] }) },
  dish_fest_arare: { name: 'Hina arare', desc: 'Crunchy pastel rice puffs for the doll festival.', cat: 'food', price: 25, energy: 6, mood: 6, tags: ['sweet', 'festival'], icon: itemIcon('berry', { c: K.sakura[2] }) },
  dish_fest_ehomaki: { name: 'Lucky roll', desc: 'A thick sushi roll eaten in silence facing the lucky direction on Setsubun.', cat: 'food', price: 60, energy: 30, mood: 4, tags: ['festival'], icon: itemIcon('bread', { c: K.charcoal[2] }) },
  dish_fest_beans: { name: 'Roasted beans', desc: 'Lucky soybeans. Eat one for every year of your age, plus one for luck.', cat: 'food', price: 10, energy: 5, mood: 3, tags: ['festival'], icon: itemIcon('seed', { c: K.butter[1] }) },
  dish_fest_soba: { name: 'New Year soba', desc: 'Long noodles for a long, happy year. Eaten on New Year\'s Eve.', cat: 'food', price: 70, energy: 35, mood: 6, tags: ['festival'], icon: itemIcon('bowl', { c: K.woodDark[3] }) },
  drink_fest_amazake: { name: 'Amazake', desc: 'Warm sweet rice drink handed out at the shrine. Warms you to your toes.', cat: 'food', price: 30, energy: 12, mood: 8, tags: ['sweet', 'drink', 'festival'], icon: itemIcon('cup', { c: K.paper[3] }) },
  drink_fest_cocoa: { name: 'Market cocoa', desc: 'Thick hot chocolate from the winter market, with a marshmallow on top.', cat: 'food', price: 35, energy: 12, mood: 10, tags: ['sweet', 'drink', 'festival'], icon: itemIcon('cup', { c: K.woodDark[3] }) },
  gift_fest_chocolate: { name: 'Friendship chocolate', desc: 'Homemade chocolates in a little ribbon box. Made for a friend.', cat: 'gift', price: 60, tags: ['sweet', 'universalLove'], icon: itemIcon('box', { c: K.coral[2], c2: K.butter[2] }) },
  // stall prizes and keepsakes
  toy_fest_goldfish: { name: 'Goldfish in a bag', desc: 'A tiny orange goldfish from the festival. It looks very pleased with itself.', cat: 'misc', price: 20, icon: itemIcon('fish', { c: K.leafAutumn[3] }) },
  toy_fest_plush: { name: 'Prize plush', desc: 'A lopsided cat plush won at the ring toss. It looks a bit like Mochi.', cat: 'gift', price: 60, tags: ['cute'], icon: itemIcon('toy', { c: K.butter[2] }) },
  toy_fest_balloon: { name: 'Water balloon yo-yo', desc: 'A bouncy water balloon on a rubber string. Boing.', cat: 'misc', price: 15, icon: itemIcon('fruit', { c: K.sky[2] }) },
  toy_fest_mask: { name: 'Festival mask', desc: 'A plastic fox mask from a festival stall.', cat: 'misc', price: 30, icon: itemIcon('toy', { c: K.paper[4], c2: K.ribbon[2] }) },
  gift_fest_postcard: { name: 'Festival postcard', desc: 'A postcard Aunt Nori drew of a Hoshimori festival. One for the collection.', cat: 'gift', price: 20, tags: ['paper'], icon: itemIcon('stamp', { c: K.sakura[2] }) },
  // Mochi's little gifts (seasonal)
  toy_ev_bottlecap: { name: 'Shiny bottle cap', desc: 'Mochi\'s idea of treasure. She is very proud of it.', cat: 'misc', price: 2, icon: itemIcon('coin', {}) },
  mat_ev_feather: { name: 'Soft feather', desc: 'A grey feather Mochi carried in. A pigeon is missing it.', cat: 'material', price: 3, icon: itemIcon('feather', { c: K.stone[4] }) },
  mat_ev_petal: { name: 'Pressed petal', desc: 'A perfect sakura petal Mochi brought in on her nose.', cat: 'material', price: 5, icon: itemIcon('flower', { c: K.sakura[3] }) },
  mat_ev_cicada: { name: 'Cicada shell', desc: 'An empty summer cicada shell. Mochi caught it, sort of.', cat: 'material', price: 4, icon: itemIcon('bug', { c: K.butter[1] }) },
  mat_ev_acorn: { name: 'Acorn', desc: 'A round acorn with a little hat. Mochi batted it all the way home.', cat: 'material', price: 3, icon: itemIcon('seed', { c: K.wood[2] }) },
  // mail
  gift_ship_shell: { name: 'Far-sea shell', desc: 'A spiral shell Mum found in a net far out at sea.', cat: 'gift', price: 40, tags: ['shell'], icon: itemIcon('shell', { c: K.coral[3] }) },
  gift_ship_photo: { name: 'Whale photo', desc: 'A printed photo of a humpback whale waving its tail. Love, Mum.', cat: 'gift', price: 10, tags: ['paper'], icon: itemIcon('paper', { c: K.water[2] }) },
  key_lost_item: { name: 'Lost item', desc: 'Something someone dropped. Ask around town to find who it belongs to.', cat: 'key', key: true, price: 0, icon: itemIcon('key', { c: K.butter[2] }) },
});
