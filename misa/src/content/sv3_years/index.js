// Years & Graduation (sv3_years): multi-year progression, the three-year school story, graduation, endings and Epilogue Life.
// Modules: util (state, calendar, ticker) - items - kohai (9 NPCs) - years (April rotation, electives, elections, trip, festival)
//          goals (year goals, Years app, banner) - career (mocks, tracks) - graduation (ceremony, letters, endings)
//          epilogue (cafe, clocks, foundation, alumni, Hall of Fame, legacy) - world (prices, stock, developments) - debug
import './util.js';
import './items.js';
import './kohai.js';
import './years.js';
import './career.js';
import './goals.js';
import './graduation.js';
import './epilogue.js';
import './world.js';
import './debug.js';
import '../../minigames/sv3_years/games.js';
import { features } from '../../core/registry.js';

features('Years & Graduation', [
  'Three new first-years enrol every April in game years 2, 3 and 4, with an entrance ceremony scene',
  'Nine kohai NPCs: Mio, Sota and Nanami (year 2), Yui, Ren and Chiyo (year 3), Emi, Tomo and Lena (final term)',
  'Every kohai has two short heart events, their own gift tastes, a birthday and a farewell letter',
  'Kohai schedules follow Misa\'s club: they turn up in her club room on meeting days, eat lunch in their own spot and spend weekends in town',
  'Club practice and leadership duties raise the kohai\'s friendship, and the kohai look up to Misa in their dialogue',
  'Mock exam results are remembered and add a bonus to the entrance exam score',
  'Failing the entrance exam leads to the Long Way Round ending instead of a dead end',
  'A kohai who grew close gives Misa the second button of their jacket at graduation',
  'Ms. Fujita sends a mail on the eve of graduation, and a toast reminds Misa on the day',
  'Epilogue-year Guild goals keep scaling with every epilogue year',
  'The school trip choices (bus seat, free time, night talk, lantern wish) change who Misa grows closer to',
]);
