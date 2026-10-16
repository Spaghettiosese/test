// Entry point for the 'ui' content area (see docs/WORLD.md -> Ownership). Import every module of the area here.
import './settings.js';
import './tv.js';
import './apps.js';
import { features } from '../../core/registry.js';

features('HUD and menus', [
  'HUD shows weekday, date, season colour, clock and weather icon; the clock can switch to 24-hour time',
  'HUD shows coins plus energy and mood bars, with a low-energy marker that does not rely on colour alone',
  'HUD buff icons appear under the coin panel for active buffs and blink when about to run out',
  'Toast queue: up to four stacked pop-ups slide up, hold and fade, each with an item or status icon',
  'Dialogue name tags are drawn in the speaker\'s own NPC colour, with dark or light text for contrast',
  'Phone app strip scrolls with arrow buttons when there are many apps; icons, close button and list rows are tap targets of 14 px or more',
  'Bag, Journal, Friends and Save screens use enlarged tap rows and 16 px action buttons for touch screens',
  'Proportional mixed-case 5x7 pixel font for dialogue, menus and the phone, with pixel-width text wrapping',
  'Tiny 3x5 caps font for HUD numerals and labels',
  'Extra UI symbols in the font (heart, star, note, arrows, bullets) for menus',
]);
