// Romance (sv4_romance): wholesome teen school romance with Misa's same-age classmates (Kai, Suzu, Rina, Theo, Hina, and Aoi and Haru
// when they exist). Affection track, dates, confessions, steady-couple events, texting, a Romance phone app and story hooks.
// Never romantic: teachers, kohai, or any adult. See each module's header for console commands (all under __misa.sv4r):
//   state() aff(id) add(id,n) stage(id) setAff(id,n) force(id) makeCouple(id)
//   date(id,kind) plan(id,kind) confess(id,'misa'|'them') compliment(id) stepBack() couple(id,'family'|'exam'|'festival'|'anniv'|'mix')
//   chat(id[,tid]) reply(id,0..2) drama(id) postscript([id])
import { register, features } from '../../core/registry.js';
import './core.js';
import './voices.js';
import './dates.js';
import './confess.js';
import './texts.js';
import './couple.js';
import './story.js';
import './ui.js';
import '../../minigames/sv4_romance/index.js';
import { installDateHooks } from './dates.js';
import { installConfessHooks } from './confess.js';
import { installCoupleHooks } from './couple.js';

installDateHooks();
installConfessHooks();
installCoupleHooks();

const ach = (id, name, desc, cond, icon = 'heart') => register('achievement', id, { name, desc, cond, icon });
ach('sv4_first_date', 'First date', 'Go on your first date.', 'stat:dates>=1');
ach('sv4_five_dates', 'Date night regular', 'Go on five dates.', 'stat:dates>=5');
ach('sv4_great_date', 'Perfect afternoon', 'Have a wonderful date.', 'stat:greatDates>=1');
ach('sv4_compliments', 'Sweet talker', 'Pay ten compliments.', 'stat:compliments>=10');
ach('sv4_confessed', 'Brave heart', 'Take part in a confession.', 'stat:confessions>=1');
ach('sv4_couple', 'Together', 'Start dating.', 'stat:couples>=1');
ach('sv4_steady', 'Steady couple', 'Become a steady couple.', 'stat:steadyCouples>=1');
ach('sv4_couple_events', 'Memories made', 'See five steady-couple events.', 'stat:coupleEvents>=5');
ach('sv4_texter', 'Chatterbox', 'Reply to twenty text messages.', 'stat:textsReplied>=20');

features('Romance', [
  'Ten date kinds: cafe study, library, arcade (Mochi Kart), sunset beach walk, rooftop stargazing, festival stall crawl, bike ride, pier fishing, harbour aquarium visit and a rainy umbrella walk',
  'Plan a date from the Romance app by picking the kind, then a time today or tomorrow, with a text invitation and a reply in their own voice',
  'Your date walks to the date spot at the agreed time and waits; talk to them to begin the scene',
  'Each date has a scene written for each person, with two choice rounds where picking what they like raises the date score',
  'The arcade date plays Mochi Kart together, the rooftop date plays the new Stargazing game, and the rainy date plays the new Shared Umbrella game',
  'The bike ride is easier when you own a bicycle, and festival crawls and rainy walks only open on festival or rainy days',
  'Date results (sweet, lovely or wonderful) raise affection and friendship, and count as hangouts for the year-end evaluation',
  'A weekly limit of two dates, with kind replies when you ask for a third, and a Date Journal listing every date with hearts',
  'Missed or forgotten dates get a gentle mail, and a toast reminds you of the date in the morning and an hour before',
  'Relationship stages from acquaintance to crush, close friend, confession, dating and steady couple, with a toast whenever you move up',
  'Confess from the Romance app once you are close: a handmade gift, a straight word or a guess, followed by a warm yes or a kind not-yet',
  'From high affection a friend may confess to you first on an evening, and you can say yes, ask for a little time or stay friends',
  'The stay-friends branch is always kind and never punishes you: friendship rises, and you can reopen the romance later',
  'Step back from a relationship gently, back to being friends, and start over with anyone else',
  'Five steady-couple events for each partner: meeting the family, exam week together, a festival date, the first-date anniversary and a small misunderstanding solved kindly',
  'Couple perks: a morning text from your partner each day, and sometimes a packed lunch left for you on school days',
  'Couple perk: your partner offers to walk home together on school afternoons, with a long way and a short way',
  'Steady couples gain a little extra daily luck',
  'Phone chat: each classmate sends timed messages during the day, and you pick one of three replies that move affection',
  'Twenty text threads per person across the year, reacting to weather, time of day, season, festivals and how close you are',
  'Emoji-style icons on messages and an unread badge on the Romance app',
  'A love-ending postscript scene for your partner after the graduation ceremony',
  'A supportive face in the crowd at the Act III Hall hearing if you are dating',
  'A year-end evaluation bonus of Star Stickers and coins plus a note from your partner',
  'Rina\'s rival feelings: a gentle talk about being a rival and a date, then a violin duet for two rivals',
  'Suzu\'s writer crush story: her love-story-in-progress asks for advice, then chapter seven with a long shared table',
  'Kai and Theo argue over a festival banner, and Hina draws a firefly courtship chart, both cheering for you',
  'Two friends who both want the festival dance draw straws, and nobody is jealous',
  'A "Still Friends" scene after a kind no, where you simply change seats',
  'Romance Archive tab collecting every confession, date, couple event and drama you have seen, with your choices, replayable',
  'Aoi and Haru join the list of candidates as soon as they are in town',
  'Bus events dateDone, confessed, couple and coupleEvent plus stats and nine achievements for the achievements and quests systems',
]);
