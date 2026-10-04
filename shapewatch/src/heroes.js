// The roster: ten original heroes (3 tank, 4 damage, 3 support). Numbers live here; what the
// abilities actually do lives in kits.js. Weapon kinds: hitscan | proj | beam | melee | special.
export const ROLES = {
  tank: { label: 'TANK', plural: 'TANK', icon: 'shield', limit: 1 },
  damage: { label: 'DAMAGE', plural: 'DAMAGE', icon: 'bullets', limit: 2 },
  support: { label: 'SUPPORT', plural: 'SUPPORT', icon: 'cross', limit: 2 },
};

export const HEROES = [
  // ------------------------------------------------------------------ TANK
  {
    id: 'bulwark', name: 'BULWARK', role: 'tank', title: 'Shield Vanguard', hp: 250, armor: 200, speed: 5.0, radius: 0.55, height: 2.2,
    colors: { primary: '#2f6fd1', secondary: '#dfe6f1', accent: '#ffb02e', skin: '#8a5a3c' }, look: 'heavy',
    blurb: 'A veteran siege-engineer who marches behind a wall of light. Where Bulwark stands, the team advances.',
    w1: { name: 'Pulse Cannon', kind: 'hitscan', dmg: 11, rate: 8, ammo: 40, reload: 2.2, spread: 2.6, range: 28, falloff: [9, 28, 0.35], head: 1, auto: true, tracer: '#7fc4ff', sound: 'pulse' },
    w2: { name: 'Barrier Field', desc: 'Hold to project a frontal barrier (700 HP). Cannot fire while it is up.' },
    a1: { name: 'Shield Charge', cd: 9, desc: 'Charge forward, flattening enemies for 45 damage.' },
    a2: { name: 'Rally Cry', cd: 14, desc: 'Allies within 10 m gain +25% speed and 75 overshield for 4 s.' },
    ult: { name: 'Bastion Field', cost: 1700, desc: 'Plant a dome that cuts damage to allies by 60% and swallows enemy projectiles for 7 s.' },
  },
  {
    id: 'mauler', name: 'MAULER', role: 'tank', title: 'Scrapyard Brawler', hp: 300, armor: 200, speed: 5.3, radius: 0.6, height: 2.2,
    colors: { primary: '#c8452c', secondary: '#3b3a3f', accent: '#f2c14e', skin: '#c28b63' }, look: 'brute',
    blurb: 'Built from salvage and spite. Mauler hauls enemies into the fight and brings the ceiling down on them.',
    w1: { name: 'Scrap Cannon', kind: 'hitscan', dmg: 7, pellets: 9, rate: 1.4, ammo: 6, reload: 2.4, spread: 5.5, range: 20, falloff: [6, 18, 0.25], head: 1.4, auto: false, tracer: '#ffb061', sound: 'shotgun' },
    w2: { name: 'Chain Hook', cd: 8, desc: 'Fling a hook. The first enemy hit takes 40 damage and is yanked to you.' },
    a1: { name: 'Leap Slam', cd: 9, desc: 'Vault forward and slam the ground for 70 area damage.' },
    a2: { name: 'Brace', cd: 12, desc: 'Take 50% less damage for 4 s.' },
    ult: { name: 'Meteor Crash', cost: 1900, desc: 'Soar high, then crash down: up to 200 damage and a violent knock-up.' },
  },
  {
    id: 'orbit', name: 'ORBIT', role: 'tank', title: 'Gravity Warden', hp: 250, armor: 200, speed: 5.1, radius: 0.55, height: 2.1,
    colors: { primary: '#6a3fc4', secondary: '#252840', accent: '#5cf2e0', skin: '#e0b894' }, look: 'sleek',
    blurb: 'A physicist who weaponised her own experiments. Orbit bends the fight toward her and drags foes out of position.',
    w1: { name: 'Gravity Bolt', kind: 'proj', dmg: 38, splash: 1.8, splashDmg: 22, speed: 38, rate: 2.2, ammo: 8, reload: 2.2, radius: 0.3, color: '#b78bff', size: 0.3, slow: [0.3, 1.5], auto: true, sound: 'orbit' },
    w2: { name: 'Mass Anchor', cd: 7, desc: 'Yank enemies in a wide cone toward you for 20 damage.' },
    a1: { name: 'Hover Boost', cd: 8, desc: 'Launch upward, then glide for 2.5 s.' },
    a2: { name: 'Phase Ward', cd: 14, desc: 'Wrap yourself in a 400 point bubble for 3 s.' },
    ult: { name: 'Singularity', cost: 2000, desc: 'Fire a black hole that drags enemies to its centre and crushes them for 7 s.' },
  },
  // ------------------------------------------------------------------ DAMAGE
  {
    id: 'sabre', name: 'SABRE', role: 'damage', title: 'Frontline Operative', hp: 200, armor: 0, speed: 5.5, radius: 0.4, height: 1.8,
    colors: { primary: '#2a5ca8', secondary: '#c9ced6', accent: '#ff7a1a', skin: '#a5694a' }, look: 'soldier',
    blurb: 'Reliable, relentless, and always one magazine ahead. Sabre is the baseline every other hero is measured against.',
    w1: { name: 'Pulse Rifle', kind: 'hitscan', dmg: 15, rate: 8, ammo: 30, reload: 1.7, spread: 2.0, range: 75, falloff: [25, 60, 0.4], head: 2, auto: true, tracer: '#ffd27a', sound: 'rifle' },
    w2: { name: 'Micro Rockets', cd: 6, desc: 'Launch three rockets: 50 damage each with a small blast.' },
    a1: { name: 'Slide Dash', cd: 6, desc: 'Burst forward for a quick dodge.' },
    a2: { name: 'Stim Injector', cd: 14, desc: 'Heal 75 and run 30% faster for 3 s.' },
    ult: { name: 'Overdrive', cost: 1800, desc: 'For 7 s your rifle locks onto enemies near your crosshair, with +25% damage and no reloads.' },
  },
  {
    id: 'cinder', name: 'CINDER', role: 'damage', title: 'Pyromancer', hp: 200, armor: 0, speed: 5.5, radius: 0.4, height: 1.8,
    colors: { primary: '#d94a1e', secondary: '#2a1a1a', accent: '#ffd23f', skin: '#6e4630' }, look: 'mage',
    blurb: 'A stage magician who never stopped believing the act was real. Everything Cinder touches is on fire.',
    w1: { name: 'Ember Bolt', kind: 'proj', dmg: 38, splash: 0, speed: 55, rate: 2.4, ammo: 6, reload: 1.8, radius: 0.2, color: '#ff8a2a', size: 0.22, burn: [12, 3], auto: true, sound: 'fire' },
    w2: { name: 'Scorch Burst', cd: 5, desc: 'A close-range cone that deals 35 damage and shoves enemies back.' },
    a1: { name: 'Ember Step', cd: 7, desc: 'Vanish in a puff of cinders and reappear up to 9 m ahead.' },
    a2: { name: 'Fire Wall', cd: 11, desc: 'Raise a 10 m wall of flame that scorches anyone crossing it.' },
    ult: { name: 'Inferno', cost: 1900, desc: 'Hurl a firebomb that leaves a raging field of flame for 8 s.' },
  },
  {
    id: 'vesper', name: 'VESPER', role: 'damage', title: 'Rail Sniper', hp: 200, armor: 0, speed: 5.4, radius: 0.4, height: 1.8,
    colors: { primary: '#1f8a7a', secondary: '#1b2428', accent: '#b6ff4a', skin: '#d8a984' }, look: 'sniper',
    blurb: 'Patient, precise, and not remotely sorry. Vesper owns every sightline on the map.',
    w1: { name: 'Rail Rifle', kind: 'special', dmg: 50, headMul: 2, rate: 1.4, ammo: 6, reload: 2.0, spread: 2.2, range: 200, auto: false, tracer: '#6fffe0', sound: 'rail' },
    w2: { name: 'Scope', desc: 'Hold to zoom and charge up to 150 damage (headshots double).' },
    a1: { name: 'Grapple Line', cd: 8, desc: 'Fire a line to a surface and haul yourself to it.' },
    a2: { name: 'Sonar Dart', cd: 12, desc: 'Stick a dart that reveals enemies within 12 m through walls for 5 s.' },
    ult: { name: 'Rift Lance', cost: 1800, desc: 'After a 1.2 s charge, one shot pierces walls and enemies for 250 damage.' },
  },
  {
    id: 'flicker', name: 'FLICKER', role: 'damage', title: 'Time Skirmisher', hp: 175, armor: 0, speed: 6.0, radius: 0.38, height: 1.7,
    colors: { primary: '#f0b018', secondary: '#222a3a', accent: '#40e0ff', skin: '#f0c8a0' }, look: 'sleek',
    blurb: 'A courier knocked loose from the timeline. Flicker is never quite where you aimed.',
    w1: { name: 'Twin Pistols', kind: 'hitscan', dmg: 8.5, rate: 14, ammo: 40, reload: 1.1, spread: 2.4, range: 45, falloff: [12, 32, 0.4], head: 1.5, auto: true, tracer: '#7ff1ff', sound: 'pistol' },
    w2: { name: 'Backstab', cd: 4, desc: 'Lunge and strike for 55 damage, 90 from behind.' },
    a1: { name: 'Blink', cd: 3, charges: 3, desc: 'Teleport 7 m. Holds three charges.' },
    a2: { name: 'Rewind', cd: 12, desc: 'Snap back to where you stood (and how healthy you were) 3 s ago.' },
    ult: { name: 'Time Bomb', cost: 1500, desc: 'Throw a bomb that sticks, then detonates for up to 220 damage after 1.8 s.' },
  },
  // ------------------------------------------------------------------ SUPPORT
  {
    id: 'halo', name: 'HALO', role: 'support', title: 'Field Medic', hp: 200, armor: 0, speed: 5.4, radius: 0.4, height: 1.8,
    colors: { primary: '#f4f1e6', secondary: '#c9a43a', accent: '#7fe3ff', skin: '#c68b66' }, look: 'angel',
    blurb: 'Descends on the wounded like a hymn. Halo keeps a team in the fight a little longer than it deserves.',
    w1: { name: 'Sidearm', kind: 'hitscan', dmg: 15, rate: 5.5, ammo: 20, reload: 1.5, spread: 1.4, range: 60, falloff: [25, 55, 0.5], head: 2, auto: true, tracer: '#fff1a8', sound: 'pistol' },
    w2: { name: 'Aegis Beam', desc: 'Hold on an ally to heal 60 HP/s.' },
    a1: { name: 'Guardian Leap', cd: 6, desc: 'Streak toward the ally you are looking at (or ahead).' },
    a2: { name: 'Sanctuary', cd: 12, desc: 'Burst of light: heals allies within 6 m for 90.' },
    ult: { name: 'Resurgence', cost: 1800, desc: 'Revive up to two recently fallen allies and heal everyone nearby.' },
  },
  {
    id: 'pylon', name: 'PYLON', role: 'support', title: 'Field Engineer', hp: 225, armor: 0, speed: 5.3, radius: 0.42, height: 1.75,
    colors: { primary: '#3aa046', secondary: '#373d44', accent: '#ffe14d', skin: '#8f6244' }, look: 'engineer',
    blurb: 'Why carry a medkit when you can bolt a hospital to the floor? Pylon builds the fight she wants.',
    w1: { name: 'Rivet Pistol', kind: 'hitscan', dmg: 16, rate: 4.5, ammo: 16, reload: 1.8, spread: 1.2, range: 55, falloff: [25, 50, 0.5], head: 2, auto: false, tracer: '#ffec99', sound: 'pistol' },
    w2: { name: 'Repair Dart', cd: 3, desc: 'Lob a dart: heals an ally for 70, or stings an enemy for 20.' },
    a1: { name: 'Heal Pylon', cd: 14, desc: 'Deploy a pylon that heals 35 HP/s within 6 m for 12 s.' },
    a2: { name: 'Sentry', cd: 18, desc: 'Deploy an automatic turret for 25 s (150 HP).' },
    ult: { name: 'Overcharge Grid', cost: 1700, desc: 'Allies within 18 m deal +35% damage and take 30% less for 8 s.' },
  },
  {
    id: 'zephyr', name: 'ZEPHYR', role: 'support', title: 'Sonic Courier', hp: 200, armor: 0, speed: 5.7, radius: 0.4, height: 1.75,
    colors: { primary: '#e0409a', secondary: '#22183a', accent: '#59f0a8', skin: '#b87a56' }, look: 'sleek',
    blurb: 'The bass drops when Zephyr arrives. Switch the track and the whole squad moves to a new rhythm.',
    w1: { name: 'Sonic Shot', kind: 'hitscan', dmg: 15, rate: 8, ammo: 24, reload: 1.6, spread: 2.0, range: 50, falloff: [20, 45, 0.4], head: 1.5, auto: true, tracer: '#ff8fd0', sound: 'pistol' },
    w2: { name: 'Track Switch', cd: 0.8, desc: 'Toggle your aura: Heal (12 HP/s) or Speed (+30%) for allies within 10 m.' },
    a1: { name: 'Amp Pulse', cd: 6, desc: 'Blast a cone: 30 damage and a hard shove.' },
    a2: { name: 'Wall Dash', cd: 8, desc: 'Dash forward with a little lift.' },
    ult: { name: 'Sound Barrier', cd: 0, cost: 1800, desc: 'Allies within 22 m gain a 300 point overshield that fades over 6 s.' },
  },
];
export const HERO = Object.fromEntries(HEROES.map((h) => [h.id, h]));

// skins recolour the model; they are palette swaps of the hero's own colours
export const SKINS = [
  { id: 'default', name: 'DEFAULT', map: (c) => c },
  { id: 'frosted', name: 'FROSTED', map: (c) => ({ primary: '#e9f2fb', secondary: '#7ea8d6', accent: '#2aa9ff', skin: c.skin }) },
  { id: 'noir', name: 'NOIR', map: (c) => ({ primary: '#26282e', secondary: '#4a4e58', accent: c.accent, skin: c.skin }) },
  { id: 'gilded', name: 'GILDED', map: (c) => ({ primary: '#d4a93a', secondary: '#3b2f14', accent: '#fff2bf', skin: c.skin }) },
];

export const TEAM_COLORS = [
  { name: 'ATTACKERS', main: '#3a9bff', dark: '#14396b' },
  { name: 'DEFENDERS', main: '#ff4a52', dark: '#6b1519' },
];
