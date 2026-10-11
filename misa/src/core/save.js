// Save slots in localStorage (wrapped: storage can be missing or throw in private windows).
import { migrate, SAVE_VERSION } from './state.js';

const KEY = (slot) => `misa-life:slot${slot}`;
export const SLOTS = 3;

const ls = () => { try { return globalThis.localStorage || null; } catch { return null; } };

export function saveSlot(slot, state) {
  try { ls()?.setItem(KEY(slot), JSON.stringify(state)); return true; } catch { return false; }
}
export function loadSlot(slot) {
  try { const raw = ls()?.getItem(KEY(slot)); return raw ? migrate(JSON.parse(raw)) : null; } catch { return null; }
}
export function deleteSlot(slot) { try { ls()?.removeItem(KEY(slot)); } catch { /* ignore */ } }
export function slotInfo(slot) {
  const s = loadSlot(slot);
  return s ? { slot, day: s.time.day, money: s.money, chapter: s.story.chapter, playMs: s.playMs, v: s.v ?? SAVE_VERSION } : null;
}

// Settings are global, not per slot.
const SKEY = 'misa-life:settings';
export const DEFAULT_SETTINGS = { music: 0.6, sfx: 0.8, textSpeed: 1, screenShake: true, autosave: true, showClock24: false, bigText: false, colorblind: false, runToggle: false };
export function loadSettings() { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(ls()?.getItem(SKEY) || '{}') }; } catch { return { ...DEFAULT_SETTINGS }; } }
export function saveSettings(s) { try { ls()?.setItem(SKEY, JSON.stringify(s)); } catch { /* ignore */ } }
