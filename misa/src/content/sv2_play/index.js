// Arcade & Travel (sv2_play): three arcade cabinets with tickets and prizes, a bicycle, seven Star Drops, Help Wanted bounties
// and pocket tools (lantern, watch, compass). Entry file; see each module's header for console commands.
import { register, features } from '../../core/registry.js';
import './state.js';
import './arcade.js';
import { bikeSystem } from './bike.js';
import './tools.js';
import './drops.js';
import './hw.js';

register('system', 'sv2_bike', { init: bikeSystem });

features('Arcade & Travel', [
  'Cabinets glow with screen light after dark, and the Sunny Mart corner machine replaces the old flavour-text cabinet',
  'Pressing Esc in an arcade game unplugs it but keeps the points and tickets earned so far',
  'A parked bike stays where you hop off, with a Hop on prompt, and goes back to the yard gate at dawn',
  'Bike wheels bob as Misa pedals, and the basket art changes with each of the three basket upgrades',
  'A new Pedal & Pump stall with an awning and display bikes stands in the shotengai arcade',
  'Sunny Mart now stocks Pocket batteries for the lantern',
  'The shimmering fruit is a new item that grants a Star Drop when eaten',
  'Bicycle skill sets the flag bicycle_skill once you have ridden 2 km, for other systems to read',
]);
