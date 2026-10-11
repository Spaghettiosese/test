// Dialogue portraits (64x64). Misa: assets/moonkai/misa_portraits.png (rows neutral/happy/surprised/sleepy).
// NPCs: assets/cast/<id>_portraits.png (rows neutral/happy/surprised/sad); if missing, Misa's portrait sheet
// is palette-swapped to the NPC's look. Mochi and other animals use art.js sprites (p_mochi_<mood>_<m><b>).
import { get } from '../core/registry.js';
import { image, recolor, lookPairs } from '../gfx/chars.js';
import { sprite } from '../artcache.js';
import { SPRITES } from '../art.js';

const MISA_ROWS = { neutral: 0, happy: 1, surprised: 2, sleepy: 3, sad: 3 };
const CAST_ROWS = { neutral: 0, happy: 1, surprised: 2, sad: 3, sleepy: 3, angry: 2 };
const swapped = {};

export function drawPortrait(g, who, mood, mouth, blink, x, y) {
  const id = String(who || '').toLowerCase();
  if (id === 'misa') {
    const img = image('misa_portraits');
    if (!img) return false;
    g.drawImage(img, (mouth * 2 + blink) * 64, (MISA_ROWS[mood] ?? 0) * 64, 64, 64, x, y, 64, 64);
    return true;
  }
  const key = `p_${id}_${mood}_${mouth}${blink}`, alt = `p_${id}_neutral_${mouth}${blink}`;
  if (SPRITES[key] || SPRITES[alt]) { g.drawImage(sprite(SPRITES[key] ? key : alt), x, y); return true; }
  let img = image(`cast_${id}_portraits`);
  const npc = get('npc', id);
  if (!img && npc && npc.look && image('misa_portraits')) img = swapped[id] ||= recolor(image('misa_portraits'), lookPairs(npc.look));
  if (!img) return false;
  const rows = img === swapped[id] ? MISA_ROWS : CAST_ROWS;
  g.drawImage(img, (mouth * 2 + blink) * 64, (rows[mood] ?? 0) * 64, 64, 64, x, y, 64, 64);
  return true;
}
export function displayName(who) {
  if (!who) return null;
  const id = String(who).toLowerCase();
  if (id === 'misa') return 'Misa';
  const npc = get('npc', id);
  return npc ? npc.name : who.charAt(0).toUpperCase() + who.slice(1).toLowerCase();
}
