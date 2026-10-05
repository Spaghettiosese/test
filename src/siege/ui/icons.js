// Procedural SVG icons: a glyph per operator (drawn from its signature gadget), gadget and
// weapon-class icons, and the interface glyphs. Everything is 24x24, white line art.
const S = 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const F = 'fill="currentColor" stroke="none"';
const G = {
  hammer: `<path ${S} d="M4 20 L14 10"/><path ${F} d="M11 4 l8 8 -3 3 -8 -8z"/>`,
  thermite: `<path ${F} d="M12 2 c1 4 6 6 6 11 a6 6 0 0 1 -12 0 c0 -3 2 -5 3 -8 1 2 2 3 3 -3z"/>`,
  shield: `<path ${S} d="M12 3 l8 3 v6 c0 5 -4 8 -8 9 c-4 -1 -8 -4 -8 -9 V6z"/><path ${S} d="M12 7v10M8 11h8"/>`,
  flashshield: `<path ${S} d="M12 3 l8 3 v6 c0 5 -4 8 -8 9 c-4 -1 -8 -4 -8 -9 V6z"/><path ${F} d="M13 6 8 13h4l-1 5 5-7h-4z"/>`,
  scanner: `<circle ${S} cx="12" cy="12" r="2.2"/><path ${S} d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4.5 4.5a11 11 0 0 0 0 15M19.5 4.5a11 11 0 0 1 0 15"/>`,
  launcher: `<path ${F} d="M12 2 l2.2 7.8 7.8 2.2 -7.8 2.2 L12 22 l-2.2 -7.8 -7.8 -2.2 7.8 -2.2z"/>`,
  shockdrone: `<path ${F} d="M13 2 4 14h6l-1 8 10-13h-6z"/>`,
  bangs: `<circle ${S} cx="12" cy="12" r="4"/><path ${S} d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M5 19l2-2"/>`,
  cluster: `<circle ${F} cx="8" cy="8" r="2.6"/><circle ${F} cx="16" cy="8" r="2.6"/><circle ${F} cx="8" cy="16" r="2.6"/><circle ${F} cx="16" cy="16" r="2.6"/><circle ${F} cx="12" cy="12" r="2"/>`,
  stimpistol: `<path ${F} d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>`,
  sonar: `<path ${S} d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/><circle ${F} cx="12" cy="12" r="1.6"/><path ${S} d="M3 16a11 11 0 0 0 18 0"/>`,
  cinders: `<path ${F} d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9-1 4.5 4.5 0 0 1 1 9z"/>`,
  xpellet: `<path ${S} d="M12 3 l7 4 v8 l-7 4 -7 -4 V7z"/><circle ${F} cx="12" cy="11" r="2"/>`,
  torch: `<path ${F} d="M12 2 c1 3 5 5 5 9 a5 5 0 0 1 -10 0 c0 -2 1 -3 2 -5 1 1 1 2 2 -2z"/><path ${S} d="M9 20h6"/>`,
  armorpanel: `<rect ${S} x="4" y="4" width="16" height="16" rx="1.5"/><path ${S} d="M4 4l16 16M20 4 4 20"/>`,
  armorpack: `<path ${S} d="M7 4h10l3 4v12H4V8z"/><path ${S} d="M9 12h6M9 16h6"/>`,
  mat: `<path ${S} d="M3 18l3-12 3 12 3-12 3 12 3-12 3 12"/>`,
  edd: `<circle ${F} cx="5" cy="12" r="2.4"/><circle ${F} cx="19" cy="12" r="2.4"/><path ${S} stroke-dasharray="2 2.4" d="M7.5 12h9"/>`,
  jammer: `<path ${S} d="M6 8a8 8 0 0 0 0 8M18 8a8 8 0 0 1 0 8M9 10a4 4 0 0 0 0 4M15 10a4 4 0 0 1 0 4"/><circle ${F} cx="12" cy="12" r="1.4"/><path ${S} d="M4 4l16 16"/>`,
  cams: `<path ${S} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle ${F} cx="12" cy="12" r="3"/>`,
  dshield: `<path ${S} d="M5 4h14v12H5z"/><path ${S} d="M8 20h8M12 16v4M8 9h8"/>`,
  turret: `<circle ${S} cx="12" cy="12" r="6"/><path ${S} d="M12 2v6M12 16v6M2 12h6M16 12h6"/><rect ${F} x="10" y="10" width="4" height="4"/>`,
  nitro: `<circle ${S} cx="11" cy="14" r="6.5"/><path ${S} d="M16 9l3-4M18 3l2 2M17 6l2 2"/>`,
  shockwire: `<path ${S} d="M3 6l4 6-3 0 5 6M13 4l3 6-2 0 5 8"/><path ${F} d="M19 3 21 6h-4z"/>`,
  mines: `<path ${F} d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14zM9 11a1.6 1.6 0 1 0 0 .1zM15 11a1.6 1.6 0 1 0 0 .1z" fill-rule="evenodd"/>`,
  healstation: `<path ${F} d="M12 21 4 12.5C1 9 3 4 7.500 4c2 0 3.500 1 4.500 3 1-2 2.500-3 4.500-3C21 4 23 9 20 12.500z"/>`,
  extrareinforce: `<path ${S} d="M3 6h18M3 12h18M3 18h18M8 6v6M15 12v6M10 18v-0"/>`,
  frag: `<ellipse ${S} cx="12" cy="14" rx="5.5" ry="7"/><path ${S} d="M9 7h6M12 3v4M8 12h8M8 16h8"/>`,
  stun: `<rect ${S} x="8" y="6" width="8" height="15" rx="2"/><path ${S} d="M9 3h6M12 3V6M8 12h8"/>`,
  smoke: `<path ${F} d="M7 19a4 4 0 0 1 0-8 5 5 0 0 1 9-1 4.500 4.500 0 0 1 1 9z"/>`,
  breach: `<rect ${S} x="4" y="8" width="16" height="9" rx="1.5"/><path ${S} d="M9 8V5M15 8V5M8 12h3"/>`,
  claymore: `<path ${S} d="M3 15 L12 8 L21 15 Z"/><path ${S} d="M7 18v2M17 18v2"/>`,
  barbwire: `<path ${S} d="M3 12c3-5 5 5 9 0s6 5 9 0M7 6l2 2M17 6l-2 2M7 18l2-2M17 18l-2-2"/>`,
  impact: `<circle ${S} cx="12" cy="12" r="7"/><path ${F} d="M12 8l1.800 3.200L17 12l-3.200 1.800L12 17l-1.800-3.200L7 12l3.200-1.800z"/>`,
  alarm: `<path ${S} d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path ${S} d="M10 21h4"/>`,
  drone: `<rect ${S} x="7" y="10" width="10" height="6" rx="1.5"/><circle ${S} cx="8" cy="19" r="2"/><circle ${S} cx="16" cy="19" r="2"/><path ${S} d="M12 6v4M9 6h6"/>`,
  reinforce: `<path ${S} d="M4 5h16v14H4z"/><path ${S} d="M4 12h16M12 5v14"/>`,
  barricade: `<path ${S} d="M3 6h18M3 12h18M3 18h18M6 3l2 18M16 3l2 18"/>`,
  camera: `<path ${S} d="M3 8h4l1.500-2.500h7L17 8h4v11H3z"/><circle ${S} cx="12" cy="13.500" r="3.500"/>`,
  ping: `<path ${S} d="M12 21s-7-6.500-7-12a7 7 0 0 1 14 0c0 5.500-7 12-7 12z"/><circle ${F} cx="12" cy="9" r="2.4"/>`,
  gear: `<circle ${S} cx="12" cy="12" r="3.200"/><path ${S} d="M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900l2.100 2.100M17 17l2.100 2.100M19.100 4.900 17 7M7 17l-2.100 2.100"/>`,
  squad: `<circle ${F} cx="12" cy="8" r="3"/><circle ${F} cx="5" cy="10" r="2.200"/><circle ${F} cx="19" cy="10" r="2.200"/><path ${F} d="M6.500 20c0-4 2.500-6 5.500-6s5.500 2 5.500 6zM1.500 18c0-3 1.500-4.500 3.500-4.500S8 15 8 18zM16 18c0-3 1.500-4.500 3.500-4.500S22.500 15 22.500 18z"/>`,
  bell: `<path ${S} d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path ${S} d="M10 21h4"/>`,
  lock: `<rect ${F} x="5" y="11" width="14" height="10" rx="1.5"/><path ${S} d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  swords: `<path ${S} d="M5 19 19 5M14 4h6v6M5 5l14 14M10 20H4v-6"/>`,
  castle: `<path ${F} d="M4 21V9h3v3h2V9h2v3h2V9h2v3h2V9h3v12zM3 3h3v3H3zM10.500 3h3v3h-3zM18 3h3v3h-3z"/>`,
  bomb: `<circle ${S} cx="11" cy="14" r="6"/><path ${S} d="M15 9l3-3M17 4l3 1"/>`,
  skull: `<path ${F} d="M12 3a8 8 0 0 0-5 14v3h3v-2h4v2h3v-3a8 8 0 0 0-5-14zM9 11a1.700 1.700 0 1 0 0 .1zM15 11a1.700 1.700 0 1 0 0 .1z" fill-rule="evenodd"/>`,
  star: `<path ${F} d="M12 2l2.900 6.300 6.800.7-5.100 4.600 1.500 6.700-6.100-3.500-6.100 3.500 1.500-6.700L2.300 9l6.800-.7z"/>`,
  key: `<circle ${S} cx="8" cy="8" r="4"/><path ${S} d="M11 11l9 9M16 16l3-3M13 13l3-3"/>`,
  check: `<path ${S} d="M4 12l5 5L20 6"/>`, close: `<path ${S} d="M5 5l14 14M19 5 5 19"/>`, play: `<path ${F} d="M6 4l14 8-14 8z"/>`, plus: `<path ${S} d="M12 5v14M5 12h14"/>`, trophy: `<path ${S} d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8"/>`,
  medal: `<circle ${S} cx="12" cy="15" r="5"/><path ${S} d="M8 3l4 7 4-7"/>`,
};
const OP_GLYPH = (o) => o.ability;

export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${G[name] || G.star}</svg>`;
export const gadgetIcon = (id, cls = '') => icon(G[id] ? id : 'star', cls);
export const opIcon = (op, cls = '') => icon(G[OP_GLYPH(op)] ? OP_GLYPH(op) : 'star', cls);

// weapon silhouettes by class (side view, 64x24)
const W = {
  AR: `<path ${F} d="M1 11h10l2-2h20v-2h6v2h8l2 2h6v3H44l-2 6h-5l1-6H27l-3 7h-5l1-7H1z M11 9h6v-1h-6z"/>`,
  SMG: `<path ${F} d="M3 10h12l2-2h18l2 2h10v4H44l-1 7h-5l1-7H31l-3 6h-5l1-6H3z"/>`,
  SG: `<path ${F} d="M0 11h30l2-1h18l8 3v3l-8-1H34l-2 1H0z M32 14h12l1 6h-5l-2-4h-6z"/>`,
  DMR: `<path ${F} d="M0 12h18l3-2h22v-2h4v2h10v3H44l-3 1H25l-2 6h-5l1-6H0z"/>`,
  SR: `<path ${F} d="M0 13h10l2-2h40v-2h3v2h8v3H52l-4 2H28l-2 6h-5l1-6H0z M24 8h14v2H24z"/>`,
  HG: `<path ${F} d="M14 8h30l2 2v4H38l-2 8h-6l1-8H14z"/>`,
};
export const weaponIcon = (cls, c = '') => `<svg class="wic ${c}" viewBox="0 0 64 24" aria-hidden="true">${W[cls] || W.AR}</svg>`;

// the game's own shield emblem
export const emblem = (c = '') => `<svg class="emblem ${c}" viewBox="0 0 64 80" aria-hidden="true"><path d="M32 3 59 13v26c0 18-12 31-27 38C17 70 5 57 5 39V13z" fill="#fff"/><path d="M32 9 53 17v22c0 14-9 25-21 31C20 64 11 53 11 39V17z" fill="#0b0d12"/><path d="M40 22c-3-3-13-3-16 1-3 4 0 8 8 10s10 6 6 10c-3 3-12 3-17-1" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`;
export const laurel = (n) => `<span class="laurel"><svg viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 38C6 32 5 22 10 14M12 38c-2-3-2-5-1-8M10 14c3 0 5 1 6 3M10 20c3 0 5 1 6 4M10 26c3 0 5 1 6 3"/><path d="M36 38c6-6 7-16 2-24M36 38c2-3 2-5 1-8M38 14c-3 0-5 1-6 3M38 20c-3 0-5 1-6 4M38 26c-3 0-5 1-6 3"/></g></svg><b>${n}</b></span>`;
export const OP_GLYPHS = G;
