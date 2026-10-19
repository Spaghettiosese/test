// Character Depth (sv4_depth): personal story arcs, NPC memory and promises, moods and routines, traditions, rumors and reputation, and Misa's own personality.
// Save slice: state.sv4d (see state.js). Other workers: import { hasTrait } from '../sv4_depth/state.js'  ->  hasTrait(game, 'Kind', 3).
import { features } from '../../core/registry.js';
import './state.js';
import './people.js';
import './people2.js';
import './kit.js';
import './arcs_a.js';
import './arcs_b.js';
import './arcs_c.js';
import './moods.js';
import './rumors.js';
import './rep.js';
import './traditions.js';
import './depth.js';
import './ui.js';
export { hasTrait, addTrait } from './state.js';

const CAST = ['Kai', 'Suzu', 'Rina', 'Theo', 'Hina', 'Ms. Fujita', 'Mr. Ogawa', 'Grandma Hana', 'Tobias', 'Mika', 'Sachiko', 'Captain Jun', 'Kiko', 'Pip', 'Goro'];
const ARC_TOPIC = ['the unanswered messages from his old team, the finals invitation, and the two-town match', 'the rejection letter folder, the fear of being read, and reading night', 'the blistered hands, the fear of second place, and a free afternoon', 'the sketchbook of faces, moving boxes, and signing the corner wave', 'Gerald and her loneliness, the pond notice, and the pond that stays',
  'the observatory letter, the wrong decimal, and comet night', 'the old knee, the empty gym, and the Slow Team', 'the notebook, the fog, and the voice box', 'the stopped clock, no apprentice, and winding Grace', 'the burnt recipe, the ledger, and the Cloud Blend',
  'the candy jar, who will mind the mart, and the Sunday call', 'the fine print, the last crew, and the Sayori Academy', 'the unfinished prayer, the last keeper, and the Player Two prayer', 'the memorised route, the scanner, and Postie of the Bay', 'the Sunday wave, the apology seeds, and two old gardeners'];

features('Character Depth', [
  ...CAST.map((n, i) => `Character Study: ${n} has a three-part story arc at 3, 6 and 9 hearts about ${ARC_TOPIC[i]}`),
  'Every Character Study scene records your choices into the Heart Archive and the person\'s memory, and adds a page to your Self journal',
  'After each Character Study part the person has new daily lines that change depending on the choice you made',
  'Memory log: every person remembers the gifts you gave and how they reacted, scenes you shared, festivals you attended together, comforting and promises',
  'Memory callbacks: each person has six memory-triggered daily lines (a loved gift, a bad gift, a festival, a kept promise, a broken promise, a comfort)',
  'Promises: friends at 3+ hearts ask you to bring a favourite item, visit on a day or meet at a festival; keeping it earns 60 friendship, breaking it costs 40',
  'Kept and broken promises change later dialogue, daily mood and your Dependable reputation',
  'Memory Book phone app: per-person favourite gift, last gift, scenes, festivals, comfort and promise record, plus a Promises tab',
  'Daily moods: each person is Joyful, Content, Tired, Blue or Prickly depending on weather, recent talks and gifts, luck and your last interactions',
  'A small mood icon floats over each nearby friend\'s head',
  'Mood changes dialogue: tired, blue, prickly and joyful friends say mood-specific lines in their own voice',
  'Mood changes gift reactions: joyful friends are warmer, prickly ones harsher, and a warm soup or tea cheers up a tired or blue friend',
  'Schedule variants: each person has a hobby day, a tired day and a secret errand day at a surprising spot on the map',
  'Hobby and secret errand days come with their own comments, such as Theo secretly singing karaoke or Goro visiting Ogawa\'s tomatoes',
  'Bad day comfort: bring a tired, blue or prickly friend a soup or tea for big friendship gains, or just sit with them',
  'Comforting raises your Kind and Calm personality and your Helpful reputation',
  'Personal traditions: each person has one yearly ritual on a fixed date, from Mika\'s First Batch to Kiko\'s Year-End Bell',
  'On a tradition day the person waits at their ritual spot all day with a unique drifting visual effect',
  'Tradition scenes give a gift and pin a photo of the day on the Town Almanac photo wall',
  'Town Almanac phone app: a calendar of every tradition and birthday, and a photo wall with polaroids by year',
  'Rumor system: gossip spreads from person to person over days through the friendship web, getting more distorted as it travels',
  'Ten rumor storylines about Kai, Rina, Theo, Hina, Tobias, Ms. Fujita, Goro, Captain Jun, Kiko and Mika, each with three possible endings',
  'Spread a good or funny rumor for friendship and reputation, or squash one before it hurts someone',
  'Squashing a rumor has a chance based on your Charming and Dependable reputation and your Calm',
  'Spreading a harmful rumor costs friendship, Charming and Dependable',
  'Subjects react in their own voice once their rumor has settled, been squashed or been spread by you',
  'Rumor Mill phone app: the rumors you have heard in the version you heard them, who knows, and spread or squash buttons',
  'Reputation categories: Helpful, Studious, Quirky, Dependable and Charming grow from quests, jobs, study, bug catching, festivals and gifts',
  'Charming reputation gives money back on every shop purchase; Helpful and Dependable give extra discounts at the mart, cafe and harbour',
  'Helpful reputation: Mika, Sachiko, Pip, Grandma Hana and Momo greet you first when you walk onto their map',
  'Studious reputation: Suzu, Rina, Ms. Fujita and Haru greet you first with a heart',
  'Quirky reputation: Hina, Theo, Kiko, Sora and Aoi greet you first',
  'Dependable reputation: Mr. Ogawa, Goro, Tobias and Captain Jun greet you first',
  'Charming reputation: Kai, Grandma Hana, Mika and Momo greet you first',
  'Personality stats: Kind, Curious, Brave and Calm grow from your choices in scenes and from how you spend your days',
  'Special dialogue options in Character Studies unlock when a personality stat is high enough',
  'Kind grows when you give liked gifts and comfort friends',
  'Curious grows when you read books and discover new things',
  'Brave grows when you visit the cave, lighthouse or shrine after dark',
  'Calm grows when you fish and sleep well',
  'Weather moves moods differently per person: Hina loves rain, Kai sulks in it, Pip hates storms and Captain Jun loves sunshine',
  'A tired day forces that friend to be Tired, so a bowl of soup or tea is the right present',
  'Overdue promises break by themselves the morning after the deadline',
  'Rumors seed every five to eight days, never more than two at once, and each story has three distorted versions',
  'The Rumor Mill shows your squash chance, which rises with Charming, Dependable and Calm',
  'The Memory Book Promises tab lists every promise with its status',
  'Self phone app: your four personality stats with bars, a character study counter and a journal of one-line thoughts from each study',
  'Other content can gate options on personality with trait:kind>=3 conditions or hasTrait(game, "Kind", 3)',
  'The new cast (Aoi, Haru, Sora and Momo) has moods, schedule variants, memory lines, promises and traditions too',
  'Aoi\'s Postcard Run, Haru\'s Anniversary Edition, Sora\'s Golden Hour Portrait and Momo\'s Winter Loaf are yearly traditions',
]);
