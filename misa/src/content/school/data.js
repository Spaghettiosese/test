// School data: subjects, timetable, calendar (terms, exams, events), clubs, lunch partners and small text pools.
import { seasonOf, dateOf, weekdayOf } from '../../core/time.js';
import { RAMPS as K } from '../../gfx/palette.js';

export const SUBJECTS = {
  math: { name: 'Maths', game: 'class_math', teacher: 'Mr. Sato', color: K.sky, topic: 'adding up to targets' },
  japanese: { name: 'Japanese', game: 'class_japanese', teacher: 'Ms. Kimura', color: K.coral, topic: 'kanji stroke order' },
  english: { name: 'English', game: 'class_english', teacher: 'Mr. Brooks', color: K.lilac, topic: 'this week\'s vocabulary' },
  science: { name: 'Science', game: 'class_science', teacher: 'Ms. Fujita', npc: 'fujita', color: K.mint, topic: 'colour reactions' },
  history: { name: 'History', game: 'class_history', teacher: 'Mr. Yamada', color: K.butter, topic: 'putting events in order' },
  art: { name: 'Art', game: 'class_art', teacher: 'Ms. Ito', color: K.sakura, topic: 'drawing from memory' },
  music: { name: 'Music', game: 'class_music', teacher: 'Mr. Hayase', color: K.lilac, topic: 'recorder rhythm' },
  pe: { name: 'PE', game: 'class_pe', teacher: 'Mr. Ogawa', npc: 'ogawa', color: K.forest, topic: 'the seasonal sport' },
};
export const SUBJECT_IDS = Object.keys(SUBJECTS);
// Weekday (0 = Monday) -> [morning class, afternoon class]
export const TIMETABLE = [['math', 'japanese'], ['english', 'science'], ['history', 'art'], ['math', 'music'], ['science', 'pe']];
export const EXAM_DAYS = { 0: ['math', 'japanese', 'english'], 1: ['science', 'history'] };
export const SCHOOL_MAPS = ['classroom', 'school_halls', 'school_roof', 'gym', 'school_grounds'];

export const T = { bell: 8 * 60 + 30, amEnd: 12 * 60 + 30, pm: 13 * 60 + 20, pmEnd: 15 * 60 + 20, out: 15 * 60 + 30, clubEnd: 17 * 60 + 30 };

// ---------- calendar ----------
export const termOf = (day) => { const s = seasonOf(day); return s === 'summer' ? null : s; };
export const termKey = (day) => `${termOf(day)}${Math.floor((day - 1) / 112) + 1}`;
export function isBreak(day) {
  const s = seasonOf(day), d = dateOf(day);
  return s === 'summer' || (s === 'spring' && d === 1) || (s === 'winter' && d > 20);
}
export function examInfo(day) {
  const s = seasonOf(day), d = dateOf(day);
  if (s === 'spring' || s === 'autumn') { if (d === 10 || d === 11) return { kind: 'midterm', idx: d - 10 }; if (d === 24 || d === 25) return { kind: 'final', idx: d - 24 }; }
  if (s === 'winter' && (d === 17 || d === 18)) return { kind: 'final', idx: d - 17 };
  return null;
}
export const isLastDay = (day) => { const s = seasonOf(day), d = dateOf(day); return (s === 'spring' && d === 26) || (s === 'autumn' && d === 26) || (s === 'winter' && d === 19); };
export const specialDay = (day) => { const s = seasonOf(day), d = dateOf(day); if (s === 'spring' && d === 19) return 'sports'; if (s === 'autumn' && (d === 20 || d === 21)) return 'culture'; return null; };
export const classesFor = (day) => TIMETABLE[weekdayOf(day)] || null;

// ---------- clubs ----------
export const CLUBS = {
  astronomy: { name: 'Astronomy Club', days: [2, 4], game: 'club_astro', member: 'fujita', skill: 'study', room: 'astro_room', when: 'flag:astro_club', blurb: 'Stargazing on the roof, constellation logs and the old telescope.' },
  art: { name: 'Art Club', days: [0, 2], game: 'club_art', member: 'theo', skill: 'crafting', room: 'art_room', blurb: 'Paint pixel pictures for the club gallery.' },
  music: { name: 'Music Club', days: [1, 3], game: 'club_music', member: 'rina', skill: 'charm', room: 'music_room', blurb: 'Rhythm practice and songs for the festivals.' },
  soccer: { name: 'Soccer Club', days: [0, 3], game: 'club_soccer', member: 'kai', skill: 'charm', room: 'field', blurb: 'Penalty practice with Kai on the field.' },
  nature: { name: 'Nature Club', days: [1, 4], game: 'club_nature', member: 'hina', skill: 'gardening', room: 'greenhouse', blurb: 'Tend the greenhouse with Hina and Mr. Ogawa.' },
  literature: { name: 'Literature Club', days: [2, 4], game: 'club_lit', member: 'suzu', skill: 'study', room: 'library_corner', blurb: 'Write haiku from word tiles for the club zine.' },
  cooking: { name: 'Cooking Club', days: [1, 3], game: 'club_cook', member: 'hina', skill: 'cooking', room: 'science_lab', blurb: 'A weekly cook-off judged by club members.' },
};
export const CLUB_RANKS = [0, 3, 7, 12, 18];
export const DAYNAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------- lunch ----------
export const LUNCH = [
  { npc: 'kai', where: 'the rooftop', lines: ['happy|Lunch on the roof is the best! Want half my curry bread? Just half though.', 'happy|I could eat three bentos. Coach says I need fuel. Let\'s gooo!', 'neutral|Hey, did you get the maths homework? ...Asking for a friend. The friend is me.'] },
  { npc: 'suzu', where: 'the library corner', lines: ['happy|It\'s quiet here. I like eating with someone who doesn\'t need to talk all the time.', 'neutral|I\'m reading a mystery where the cat did it. Mochi would approve.', 'happy|You notice small things, Misa. That\'s a detective\'s gift.'] },
  { npc: 'hina', where: 'the school garden', lines: ['happy|Shh! A swallowtail! ...Okay it flew off. Rice ball?', 'happy|Mr. Ogawa\'s tomatoes are huge this year. I named one Gerald.', 'surprised|There\'s a ladybug on your sleeve! Good luck for the whole afternoon!'] },
  { npc: 'rina', where: 'the classroom', lines: ['neutral|I suppose you can sit here. Don\'t get crumbs on my notes.', 'neutral|The exam rankings are posted soon. Not that I\'m worried.', 'happy|...Your bento looks nice. Did you make it? Hmph. Not bad.'] },
  { npc: 'theo', where: 'the art room', lines: ['neutral|...You can stay. The paint smell keeps everyone else away.', 'happy|I\'m sketching the view from the window. Want to see? ...Only a little.', 'neutral|Lunch, headphones, a quiet room. Perfect day.'] },
];
export const BREAD = [
  { id: 'school_curry_bread', name: 'Curry bread', price: 150 },
  { id: 'school_melon_bread', name: 'Melon bread', price: 120 },
  { id: 'school_yakisoba_bread', name: 'Yakisoba bread', price: 160 },
];

// ---------- text pools ----------
export const ANNOUNCE = [
  'Good morning, Hoshimori High! Please walk, don\'t run, in the halls.',
  'The lunch kiosk has fresh curry bread today. First come, first served!',
  'Club notice: all clubs welcome new members. Check the notice board.',
  'Reminder: indoor shoes only past the shoe lockers. Thank you!',
  'Lost property: one blue umbrella and a very surprised rubber duck.',
  'The school garden needs volunteers. Talk to Mr. Ogawa after school.',
  'Library committee: please return books before the weekend.',
  'Weather watch: bring an umbrella if the clouds look grumpy.',
];
export const HOMEROOM = [
  'neutral|Good morning, 2-B! Coffee number one is in hand, so let\'s begin.',
  'happy|Why can\'t you trust an atom? They make up everything. ...Thank you, thank you.',
  'neutral|Remember: homework goes in the tray, not in the dog.',
  'happy|Today\'s weather is {weather}. Perfect for science, as every day is.',
  'neutral|Attendance! Kai... Kai? Ah, there you are. Under the desk. Why.',
  'happy|A little reminder: exams are just a chance to show what you know.',
  'neutral|The class plant, Mr. Leafy, thanks whoever watered him yesterday.',
];
export const NOTES = [
  ['kai', 'A note from Kai: "Is it lunch yet? I can hear my stomach."'],
  ['hina', 'A note from Hina, with a doodle of a beetle: "His name is Captain."'],
  ['suzu', 'A note from Suzu: "Plot twist: the teacher is a robot. Look how she blinks."'],
  ['theo', 'A note from Theo: a tiny, perfect drawing of Mochi.'],
  ['rina', 'A note from Rina: "Pay attention. This will be on the test."'],
];
export const LOCKER_NOTES = [
  'A folded note in your shoe locker: "Have a great day! - a secret fan of your cat"',
  'There\'s a wrapped sweet in your locker with a smiley face drawn on it.',
  'A sticky note: "Thanks for being nice to the new kid. Oh wait, that\'s you!"',
  'A paper crane sits on your indoor shoes. Someone has neat hands.',
];
