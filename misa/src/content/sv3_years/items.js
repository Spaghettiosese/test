// Items for the school years and the epilogue. Year-gated shop stock is pushed in economy.js.
import { registerMany } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { Y } from './util.js';

const ic = (shape, c, c2) => itemIcon(shape, { c, c2 });
registerMany('item', {
  sv3y_exam_charm: { name: 'Exam Charm', desc: 'A felt omamori for good marks. Use it to add 5% exam prep this term.', cat: 'gift', price: 120, icon: ic('star', K.coral[2], K.butter[2]), tags: ['lucky'],
    use(game) { const s = game.state.school, tk = Object.keys(s.prep).pop() || 'spring1'; s.prep[tk] = Math.min(20, (s.prep[tk] || 0) + 5); game.toast('Exam prep +5%', 'i_book'); return false; } },
  sv3y_study_planner: { name: 'Study Planner', desc: 'Colour-coded pages. Use it for a burst of study XP.', cat: 'book', price: 150, icon: ic('book', K.sky[2]), tags: ['study'],
    use(game) { game.addXP('study', 25); return false; } },
  sv3y_energy_bento: { name: 'Energy Bento', desc: 'A big senior-year lunch. Rice, egg, tiny octopus sausages.', cat: 'food', price: 140, energy: 45, mood: 6, icon: ic('plate', K.butter[2], K.coral[2]), tags: ['bento'] },
  sv3y_lucky_pencil: { name: 'Lucky Pencil', desc: 'Six sides, numbered 1 to 6. Rolled it before every quiz since forever.', cat: 'gift', price: 90, icon: ic('tool', K.butter[2]), tags: ['study'] },
  sv3y_autumn_parfait: { name: 'Autumn Chestnut Parfait', desc: 'The second-year special at Cafe Kumo. Chestnut cream, a sprig of maple.', cat: 'food', price: 160, energy: 22, mood: 9, icon: ic('cup', K.wood[2], K.butter[3]), tags: ['sweet'] },
  sv3y_senior_course: { name: 'Senior Course Set', desc: 'Cafe Kumo\'s final-year set: soup, salad, curry and a tiny star cake.', cat: 'food', price: 260, energy: 50, mood: 10, icon: ic('plate', K.coral[2], K.mint[2]), tags: ['sweet'] },
  sv3y_class_photo: { name: 'Class Photo', desc: 'Everyone in rows, Kai making bunny ears behind Rina.', cat: 'decor', price: 0, icon: ic('paper', K.paper[3], K.sky[2]), tags: ['decor'] },
  sv3y_armband_vice: { name: 'Vice-Captain Armband', desc: 'A yellow armband that says you keep the club running.', cat: 'clothes', price: 0, icon: ic('shirt', K.butter[2]) },
  sv3y_armband_captain: { name: 'Captain Armband', desc: 'A red armband. The whole club follows where you point.', cat: 'clothes', price: 0, icon: ic('shirt', K.coral[2]) },
  sv3y_trip_omiyage: { name: 'Trip Souvenir Box', desc: 'Sweets from the school trip, wrapped in a big pretty furoshiki.', cat: 'gift', price: 40, icon: ic('box', K.lilac[2], K.butter[2]), tags: ['sweet'] },
  sv3y_trip_charm: { name: 'Pilgrim Bell Charm', desc: 'A tiny bell from the old capital. It rings a little out of tune.', cat: 'gift', price: 60, icon: ic('star', K.butter[2], K.forest[2]), tags: ['lucky'] },
  sv3y_second_button: { name: 'Second Button', desc: 'The second button of a school jacket. A very old, very sweet tradition.', cat: 'misc', price: 0, key: true, icon: ic('coin', K.butter[3]) },
  sv3y_diploma: { name: 'Diploma', desc: 'Hoshimori High School, Class of the Star Lantern. Signed by Ms. Fujita.', cat: 'misc', price: 0, key: true, icon: ic('paper', K.paper[4], K.coral[2]) },
  sv3y_grad_bouquet: { name: 'Graduation Bouquet', desc: 'Sakura-pink ribbon, white freesias. From the kohai.', cat: 'decor', price: 0, icon: ic('flower', K.sakura ? K.sakura[2] : K.coral[3]), tags: ['decor', 'flower'] },
  sv3y_letter_box: { name: 'Farewell Letters', desc: 'A tin box with every farewell letter from graduation day.', cat: 'misc', price: 0, key: true, icon: ic('letter', K.paper[3], K.sky[2]),
    use(game) { const L = Y(game).letters; game.run([{ t: 'say', who: null, mood: null, text: L.length ? `You re-read a letter. ${L[(game.day + L.length) % L.length].text}` : 'The box is empty. It waits for graduation day.' }]); return true; } },
  sv3y_alumni_badge: { name: 'Alumni Badge', desc: 'A little star pin for Hoshimori High graduates.', cat: 'clothes', price: 0, key: true, icon: ic('star', K.sky[2], K.butter[2]) },
  sv3y_coowner_apron: { name: 'Co-owner Apron', desc: 'Cafe Kumo cream apron with your name stitched on the pocket.', cat: 'clothes', price: 0, key: true, icon: ic('shirt', K.paper[3], K.coral[2]) },
  sv3y_clock_deed: { name: 'Clock Shop Deed', desc: 'Wren\'s Clocks, now with a second name on the brass plate.', cat: 'misc', price: 0, key: true, icon: ic('paper', K.paper[3], K.wood[2]) },
  sv3y_foundation_pin: { name: 'Foundation Pin', desc: 'Hoshimori Lantern Foundation, founding patron.', cat: 'clothes', price: 0, key: true, icon: ic('star', K.coral[2], K.butter[3]) },
  sv3y_legacy_charm: { name: 'Legacy Charm', desc: 'Carried from a past life in Hoshimori. It hums a familiar tune.', cat: 'misc', price: 0, key: true, icon: ic('star', K.lilac[2], K.butter[2]) },
  sv3y_kohai_origami: { name: 'Kohai Origami Star', desc: 'Folded from a test paper that did not go well. It looks great as a star.', cat: 'gift', price: 30, icon: ic('paper', K.butter[3], K.coral[2]), tags: ['handmade'] },
  sv3y_menu_card: { name: 'Menu Card', desc: 'Hand-lettered, with a little cat paw on every corner.', cat: 'decor', price: 0, icon: ic('paper', K.paper[3], K.wood[2]), tags: ['decor'] },
});
