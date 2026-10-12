// Entry point for the 'social' content area (see docs/WORLD.md -> Ownership). Import every module of the area here.
// The cast (npcs/*.js) first, then the systems that read their extra fields.
import { features } from '../../core/registry.js';
import './util.js';
import './npcs/kai.js';
import './npcs/suzu.js';
import './npcs/rina.js';
import './npcs/theo.js';
import './npcs/hina.js';
import './npcs/fujita.js';
import './npcs/ogawa.js';
import './npcs/hana.js';
import './npcs/tobias.js';
import './npcs/mika.js';
import './npcs/sachiko.js';
import './npcs/jun.js';
import './npcs/kiko.js';
import './npcs/pip.js';
import './npcs/goro.js';
import './npcs/mum.js';
import './npcs/dad.js';
import './npcs/nori.js';
import { registerReactionHooks } from './talk.js';
import './bubbles.js';
import './mail.js';
import './hangouts.js';
import './contacts.js';
import './backdrops.js';

registerReactionHooks();

features('Cast', [
  'Kai: maths rescue, dusk penalty practice, his lost little brother, and the rooftop wristband (4 heart events)',
  'Suzu: the secret manuscript, a storm lock-in with ghost stories, the reading rehearsal, and her picture book (4 heart events)',
  'Rina: the quiz duel, her Sunny Pines secret, the empty recital seats, and the study sleepover (4 heart events)',
  'Theo: the harbour mural, starting a band, open-mic stage fright, and the portrait (4 heart events)',
  'Hina: the secret beetle tree, the escaped frogs, firefly night, and her bug exhibition (4 heart events)',
  'Ms. Fujita: the lab clean-up photo, Saturn at the lookout, parents\' evening panic, and the planisphere (4 heart events)',
  'Mr. Ogawa: the frost rescue, relay training, the missing tomato, and the harvest party hat (4 heart events)',
  'Grandma Hana: knitting a scarf for Mochi, the photo album, the beach jailbreak, and the Keeper\'s Song (4 heart events)',
  'Tobias: the clock delivery, the music box, the 1985 flashback, and winding the clock tower (4 heart events)',
  'Mika: the espresso emergency, the lost recipe box, the magazine interview, and the Misa Latte (4 heart events)',
  'Sachiko: the melon-bun crow, the stock-take, the video-call lesson, and the family discount card (4 heart events)',
  'Captain Jun: the casting lesson, a dawn trip on the Sayori, the singing fish, and the Sayori\'s bell (4 heart events)',
  'Kiko: folding 100 fortunes, the secret retro-game stream, braiding the shimenawa, and the midnight bell (4 heart events)',
  'Pip: the twisted-ankle round, the forgotten satchel, the downhill race, and the honorary postie cap (4 heart events)',
  'Mr. Hayashi: the vegetable rivalry, runaway Daifuku, his wife\'s flower bed, and the famous pumpkin seeds (4 heart events)',
  'Mum: the house-tour call, whale song, the festival diary page, and a New Year\'s Eve homecoming (4 heart events)',
  'Dad: the first cook-along, the pun-off, the pancake at sea, and his secret Starlight Mochi (4 heart events)',
  'Aunt Nori: the parcel guessing game, an overnight redecoration, a sketching walk, and the original festival poster (4 heart events)',
  '15 town residents with full daily schedules: school days, weekends, rain and summer break',
  'Teachers work at school on weekdays; shopkeepers keep shop hours with a weekly day off',
  'Residents change plans on rainy, snowy and stormy days (the gym, the library, the arcade, a porch)',
  'Ms. Fujita stays late in the Astronomy Club room and stargazes on clear nights once the club is founded',
  'Grandma Hana keeps Sunny Pines visiting hours: tai chi, knitting, meals and the garden bench',
  'Every resident speaks in their own voice: 50+ lines each across time of day, weather, seasons, places and friendship',
  'Lines for 17 calendar holidays, from Koinobori Day to New Year\'s Eve',
  'Every resident has loved, liked, disliked and hated gifts plus favourite gift categories',
  'Heart events with choices: kinder or cleverer answers earn more friendship',
  'Friends walk up to Misa to start a heart event and head back to their day afterwards',
  'Heart-event keepsakes: Kai\'s wristband, Tobias\'s pocket watch, the Sayori\'s bell, Suzu\'s picture book and more',
  'Video-call heart events with family at home in the evening',
  'Each friend answers your texts in their own voice',
]);
