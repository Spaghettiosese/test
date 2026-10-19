// New Cast (sv4): shared state, condition kinds and tables for Aoi, Haru, Sora and Momo.
// Save slice `sv4nc`. Flags: nc_enrolled (the transfer students exist), nc_intro_done, nc_bakery_open, nc_track_open.
// Condition kind `ncsora` is true on the days Sora rents her room at Sunny Pines (dates 3-22 of every season).
import { register } from '../../core/registry.js';
import { addCondKind, COND_KINDS } from '../../core/cond.js';
import { seasonOf, dateOf } from '../../core/time.js';

export const DEF = () => ({
  intro: 0, photos: [], reqs: {}, shots: 0, bake: { n: 0, best: 0, day: 0, special: 0, rival: 0 }, press: { n: 0, best: 0, day: 0, issues: [] },
  track: { n: 0, best: 0 }, sora: { arrivals: 0, season: '' }, rival: { wins: 0, losses: 0, round: 0 }, gossip: {}, seats: 0, reqDay: 0, postcards: 0, riddles: 0, lessons: 0,
});
register('stateSlice', 'sv4nc', { default: DEF });
export const S = (g) => { const s = (g.state.sv4nc ||= DEF()); for (const [k, v] of Object.entries(DEF())) if (s[k] === undefined) s[k] = v; return s; };

export const soraHereOn = (day) => { const d = dateOf(day); return d >= 3 && d <= 22; };
if (!COND_KINDS.includes('ncsora')) addCondKind('ncsora', (g) => soraHereOn(g.state.time.day));
export const NEW_IDS = ['aoi', 'haru', 'sora', 'momo'];
export const season = (g) => seasonOf(g.state.time.day);
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
