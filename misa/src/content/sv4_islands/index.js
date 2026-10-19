// Entry point for the 'sv4_islands' slice: the Seto Islands archipelago (ferry, sea, Tsubame, Lantern Isle, Coral Atoll).
import './data.js';
import './art.js';
import './lib.js';
import '../../minigames/sv4_islands/games.js';
import './sea.js';
import './travel.js';
import './acts.js';
import './maps_tsubame.js';
import './maps_lantern_coral.js';
import './npcs.js';
import { features } from '../../core/registry.js';
import { wrapMap } from './lib.js';
import { bottleObj } from './acts.js';

// The mainland beach also gets the daily bottle
wrapMap('beach', { objects: [bottleObj('beach', 14, 10)] });

features('Seto Islands', [
  'Twelve island residents with daily schedules at island spots, voiced chatter, gift tastes and birthdays (Nagisa, Tetsu, Hibiki, Umi, Ume, Kenta, Orin, Fumi, Lani, Shiori, Kaito, Luna)',
  'Captain Nagisa\'s three heart events: the wheelhouse and the whale Gon, a sunset on the pier, and the spare wheelhouse key',
  'Tetsu\'s three heart events: smelling the tide turn, the auction secret, and his late wife\'s net',
  'Ms. Hibiki\'s three heart events: meeting the class, a talk at the swallow shrine, and the children\'s paper cranes',
  'Lani\'s three heart events: a volleyball warm-up, a bonfire talk and the gecko bungalow',
  'Shiori\'s three heart events: a breathing lesson, flashlight fish by night, and your name in the Reef Guide',
  'Seven fishing and diving minigames with bots: auction, volleyball, lagoon dive, regatta, sunken chest lock, observatory gears and the arrow-crate haul',
  'Fourteen deep-sea fish registered with the fishing system (snapper, grouper, barracuda, amberjack, mahi-mahi, flying fish, bluefin tuna, swordfish, lantern eel, coral trout, parrotfish and more)',
  'Legend fish of the sea: the ocean sunfish on calm summer days, the oarfish on stormy winter nights and the manta ray off the atoll',
  'Fish from a boat, from the Tsubame pier, the Lantern Isle shore or Coral Beach with a separate sea fish pool for each',
  'Buying a dish at Umi Diner teaches you its recipe so you can cook it at home',
  'The Fishery counter pays a bonus for fish and stocks bait, shrimp, kelp and island salt',
  'The Atoll Resort store sells snorkel sets, beach balls, coconut juice, coconut chips and an island hammock',
  'Kaito\'s beach bar serves coconut juice, tropic smoothies, blue lagoon shaved ice and prawn skewers',
  'The night market stalls sell glass floats, wind chimes and treats, and the fortune stall gives a luck buff',
  'Tidal cave notice: Misa is told when the tide is rising and the chest is under water',
  'Gather glowing moss in the cave for the collection, once a day',
  'The Lantern Tower stairs climb through three floors to the lamp room, with a keeper\'s table, shelf and cot',
  'Harvesting a rare Lantern Isle crop earns a Seto Passport stamp',
  'Stamp pages in the passport show hints for the stamps you have not earned yet, and a badge shows when a seal reward is waiting',
  'The thirtieth bottle note brings a ship in a bottle, 1500 coins and Star Stickers',
  'The sea HUD names your boat, its speed multiplier and the stream you are crossing',
  'The Seto Sea holds practice buoys, islets with palms, a whirl and four docks that carry you to each island',
  'Volleyball: the rival jumps for the ball and sometimes misses, and rallies are scored to five',
  'Lanterns light the island lanes, the shrine and the night market after dark',
  'Stranded after the last ferry: sleep free at the inn, the tower cot or the bungalow and wake on the island',
  'Autumn jellyfish, winter and spring whales and summer flying fish on the ferry backdrop',
  'Kenta, Tsubame\'s fastest kid, plays by the pier after school and on weekends',
  'Hoshimori Harbour pier gets a ferry sign, a boat berth sign and a launch point at the pier end',
]);
