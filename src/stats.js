// How every gun handles in the game: magazine, rate (seconds between shots), spread from the
// hip and aimed (radians), pellets, recoil kick (degrees, hip and aimed), the aimed field of
// view, eye relief, how hard its bullets push targets, the brass it throws and the sound it
// makes. `note` and `caliber` fill the pick-up prompt and the start screen.
//   ejectOnShot: throw a case with every shot (guns whose Fire clip has no 'eject' event)
//   delay: the round goes off this long after the trigger (a revolver's double-action pull)
//   burst: rounds per trigger press; scoped: the scope overlay; bolt: aiming drops out while it cycles
const R = { pellets: 1, relief: 0.2 };
const HG = { ...R, relief: 0.28, adsFov: 54 };
const SG = { pellets: 9, relief: 0.3, adsFov: 56, brass: 'shell' };
export const CFG = {
  // ---- handguns
  glock: { ...HG, label: 'Glock 17', caliber: '9mm', note: 'Light, fast follow-ups', mag: 17, auto: false, interval: 0.12, spread: 0.016, adsSpread: 0.002, kick: 2.4, kickAds: 1.6, impulse: 3, brass: 'pistol' },
  deagle: { ...HG, label: 'Desert Eagle', caliber: '.50 AE', note: 'Slide locks back, finger-spin inspect', mag: 7, auto: false, interval: 0.3, spread: 0.02, adsSpread: 0.002, kick: 8.5, kickAds: 6, adsFov: 52, impulse: 9, brass: 'ae50' },
  m1911: { ...HG, label: 'M1911A1', caliber: '.45 ACP', note: 'Single-stack steel classic', mag: 7, auto: false, interval: 0.13, spread: 0.018, adsSpread: 0.0022, kick: 3.6, kickAds: 2.5, impulse: 4, brass: 'magnum44', sound: 'pistol45' },
  beretta: { ...HG, label: 'Beretta 92FS', caliber: '9mm', note: 'Open-top slide', mag: 15, auto: false, interval: 0.11, spread: 0.016, adsSpread: 0.002, kick: 2.6, kickAds: 1.7, impulse: 3, brass: 'pistol', sound: 'glock' },
  p226: { ...HG, label: 'SIG P226', caliber: '9mm', note: 'Hammer, decocker, rail', mag: 15, auto: false, interval: 0.11, spread: 0.015, adsSpread: 0.0018, kick: 2.5, kickAds: 1.7, impulse: 3, brass: 'pistol', sound: 'glock' },
  usp: { ...HG, label: 'HK USP .45', caliber: '.45 ACP', note: 'Polymer frame, heavy round', mag: 12, auto: false, interval: 0.13, spread: 0.017, adsSpread: 0.002, kick: 3.3, kickAds: 2.3, impulse: 4, brass: 'magnum44', sound: 'pistol45' },
  fiveseven: { ...HG, label: 'Five-seveN', caliber: '5.7×28', note: '20 rounds, little kick', mag: 20, auto: false, interval: 0.1, spread: 0.015, adsSpread: 0.0018, kick: 1.9, kickAds: 1.3, impulse: 3, brass: 'pdw', sound: 'pistol57' },
  // the revolvers' shot leaves 65 ms after the click: that's the double-action pull in their Fire clip
  revolver: { ...HG, label: '.44 Magnum', caliber: '.44 Mag', note: 'Double action, speedloader', mag: 6, auto: false, interval: 0.45, delay: 0.065, spread: 0.022, adsSpread: 0.002, kick: 7, kickAds: 5, adsFov: 50, relief: 0.3, impulse: 6, brass: 'magnum44' },
  python: { ...HG, label: 'Colt Python', caliber: '.357 Mag', note: '6" barrel, vent rib', mag: 6, auto: false, interval: 0.42, delay: 0.065, spread: 0.02, adsSpread: 0.0018, kick: 5.5, kickAds: 4, adsFov: 50, relief: 0.3, impulse: 5, brass: 'magnum44', sound: 'revolver' },
  // ---- SMGs and the sawed-off
  smg: { ...R, label: 'MP5', caliber: '9mm', note: '800 rpm, the HK slap', mag: 30, auto: true, interval: 0.075, spread: 0.022, adsSpread: 0.004, kick: 0.6, kickAds: 0.3, adsFov: 52, impulse: 2, brass: 'pistol', ejectOnShot: true },
  mp5sd: { ...R, label: 'MP5SD6', caliber: '9mm', note: 'Integral suppressor', mag: 30, auto: true, interval: 0.075, spread: 0.02, adsSpread: 0.0035, kick: 0.45, kickAds: 0.22, adsFov: 52, impulse: 2, brass: 'pistol', ejectOnShot: true, sound: 'm4a1s', quiet: true },
  mp7: { ...R, label: 'MP7', caliber: '4.6×30', note: '950 rpm, mag in the grip', mag: 40, auto: true, interval: 0.063, spread: 0.02, adsSpread: 0.0035, kick: 0.5, kickAds: 0.26, adsFov: 52, impulse: 2, brass: 'pdw', ejectOnShot: true },
  ump: { ...R, label: 'UMP-45', caliber: '.45 ACP', note: 'Slow, hard-hitting SMG', mag: 25, auto: true, interval: 0.1, spread: 0.022, adsSpread: 0.004, kick: 0.9, kickAds: 0.5, adsFov: 52, impulse: 3, brass: 'magnum44', ejectOnShot: true },
  uzi: { ...R, label: 'UZI', caliber: '9mm', note: '600 rpm, mag in the grip', mag: 32, auto: true, interval: 0.1, spread: 0.024, adsSpread: 0.005, kick: 0.7, kickAds: 0.35, adsFov: 54, impulse: 2, brass: 'pistol', ejectOnShot: true, sound: 'smg' },
  mac10: { ...R, label: 'MAC-10', caliber: '.45 ACP', note: '1,100 rpm bullet hose', mag: 30, auto: true, interval: 0.055, spread: 0.034, adsSpread: 0.008, kick: 0.8, kickAds: 0.45, adsFov: 56, impulse: 2.5, brass: 'magnum44', ejectOnShot: true, sound: 'ump' },
  mp40: { ...R, label: 'MP40', caliber: '9mm', note: '550 rpm, handle locks up', mag: 32, auto: true, interval: 0.11, spread: 0.022, adsSpread: 0.004, kick: 0.55, kickAds: 0.28, adsFov: 52, impulse: 2, brass: 'pistol', ejectOnShot: true, sound: 'smg' },
  sawedoff: { ...SG, label: 'Sawed-off', caliber: '12 ga', note: 'Two barrels, wide spread', mag: 2, auto: false, interval: 0.22, spread: 0.11, adsSpread: 0.09, kick: 8, kickAds: 6, adsFov: 60, impulse: 2.4, pip: 'double', sound: 'shotgun' },
  // ---- assault rifles
  m4a1: { ...R, label: 'M4A1', caliber: '5.56', note: 'Full auto, red dot', mag: 30, auto: true, interval: 0.08, spread: 0.018, adsSpread: 0.0025, kick: 0.9, kickAds: 0.45, adsFov: 50, impulse: 3, brass: 'rifle', ejectOnShot: true },
  m4a1s: { ...R, label: 'M4A1 Suppressed', caliber: '5.56', note: 'Quiet, small flash', mag: 30, auto: true, interval: 0.08, spread: 0.016, adsSpread: 0.002, kick: 0.7, kickAds: 0.35, adsFov: 50, impulse: 3, brass: 'rifle', ejectOnShot: true, quiet: true },
  hk416: { ...R, label: 'HK416', caliber: '5.56', note: 'Quad rail, 850 rpm', mag: 30, auto: true, interval: 0.071, spread: 0.017, adsSpread: 0.0022, kick: 0.85, kickAds: 0.42, adsFov: 50, impulse: 3, brass: 'rifle', ejectOnShot: true, sound: 'm4a1' },
  m16a2: { ...R, label: 'M16A2', caliber: '5.56', note: 'Three-round bursts, carry handle', mag: 30, auto: false, burst: 3, interval: 0.075, spread: 0.015, adsSpread: 0.0016, kick: 1.0, kickAds: 0.5, adsFov: 48, impulse: 3, brass: 'rifle', ejectOnShot: true, sound: 'm4a1' },
  g36: { ...R, label: 'G36', caliber: '5.56', note: 'Red dot on the carry handle', mag: 30, auto: true, interval: 0.08, spread: 0.017, adsSpread: 0.0022, kick: 0.75, kickAds: 0.38, adsFov: 46, relief: 0.24, impulse: 3, brass: 'rifle', ejectOnShot: true, sound: 'm4a1' },
  ak47: { ...R, label: 'AK-47', caliber: '7.62×39', note: 'Full auto, banana mag', mag: 30, auto: true, interval: 0.1, spread: 0.026, adsSpread: 0.0035, kick: 1.4, kickAds: 0.8, adsFov: 50, impulse: 4, brass: 'ak', ejectOnShot: true },
  ak74: { ...R, label: 'AK-74', caliber: '5.45×39', note: 'Flatter, plum magazine', mag: 30, auto: true, interval: 0.092, spread: 0.022, adsSpread: 0.003, kick: 0.9, kickAds: 0.5, adsFov: 50, impulse: 3, brass: 'rifle', ejectOnShot: true, sound: 'ak74' },
  aks74u: { ...R, label: 'AKS-74U', caliber: '5.45×39', note: 'Short, loud, 700 rpm', mag: 30, auto: true, interval: 0.086, spread: 0.028, adsSpread: 0.004, kick: 1.1, kickAds: 0.6, adsFov: 52, impulse: 2.8, brass: 'rifle', ejectOnShot: true, sound: 'ak74' },
  scar: { ...R, label: 'SCAR-H', caliber: '7.62×51', note: 'Hard-hitting battle rifle', mag: 20, auto: true, interval: 0.1, spread: 0.02, adsSpread: 0.003, kick: 2.2, kickAds: 1.4, adsFov: 48, impulse: 7, brass: 'magnum', ejectOnShot: true },
  // ---- battle rifles, the Thompson and the RPK
  fal: { ...R, label: 'FN FAL', caliber: '7.62×51', note: 'Semi-auto, long reach', mag: 20, auto: false, interval: 0.12, spread: 0.02, adsSpread: 0.0018, kick: 2.6, kickAds: 1.6, adsFov: 46, impulse: 7, brass: 'rifle3006', ejectOnShot: true, sound: 'scar' },
  m14: { ...R, label: 'M14', caliber: '7.62×51', note: 'Walnut, semi-auto', mag: 20, auto: false, interval: 0.11, spread: 0.018, adsSpread: 0.0015, kick: 2.8, kickAds: 1.8, adsFov: 46, impulse: 7, brass: 'rifle3006', ejectOnShot: true, sound: 'garand' },
  garand: { ...R, label: 'M1 Garand', caliber: '.30-06', note: 'Semi-auto, en-bloc ping', mag: 8, auto: false, interval: 0.18, spread: 0.03, adsSpread: 0.0015, kick: 3.2, kickAds: 2.3, adsFov: 44, impulse: 7, brass: 'rifle3006', ejectOnShot: true, pip: 'garand' },
  thompson: { ...R, label: 'Thompson', caliber: '.45 ACP', note: 'Finned barrel, Cutts compensator', mag: 30, auto: true, interval: 0.086, spread: 0.024, adsSpread: 0.004, kick: 0.9, kickAds: 0.5, adsFov: 52, impulse: 3, brass: 'magnum44', ejectOnShot: true, sound: 'ump' },
  rpk: { ...R, label: 'RPK', caliber: '7.62×39', note: '40 rounds, heavy barrel', mag: 40, auto: true, interval: 0.1, spread: 0.024, adsSpread: 0.003, kick: 1.2, kickAds: 0.7, adsFov: 48, impulse: 4, brass: 'ak', ejectOnShot: true, sound: 'ak47' },
  // ---- shotguns
  shotgun: { ...SG, label: '12 Gauge Pump', caliber: '12 ga', note: '9 pellets, loads by hand', mag: 6, auto: false, interval: 0.92, spread: 0.07, adsSpread: 0.05, kick: 5, kickAds: 3.5, impulse: 1.6, pip: 'shotgun' },
  mossberg: { ...SG, label: 'Mossberg 590A1', caliber: '12 ga', note: 'Ghost ring, heat shield', mag: 7, auto: false, interval: 0.92, spread: 0.068, adsSpread: 0.048, kick: 5, kickAds: 3.5, impulse: 1.6, pip: 'shotgun', sound: 'shotgun' },
  spas12: { ...SG, label: 'SPAS-12', caliber: '12 ga', note: 'Pistol grip, folding stock', mag: 8, auto: false, interval: 0.9, spread: 0.065, adsSpread: 0.046, kick: 5.2, kickAds: 3.6, impulse: 1.6, pip: 'shotgun', sound: 'shotgun' },
  double: { ...SG, label: 'Double Barrel', caliber: '12 ga', note: 'Break action, two triggers', mag: 2, auto: false, interval: 0.28, spread: 0.075, adsSpread: 0.055, kick: 6.5, kickAds: 4.6, impulse: 2, pip: 'double' },
  aa12: { ...SG, label: 'AA-12', caliber: '12 ga', note: 'Fully automatic shotgun', pellets: 8, mag: 8, auto: true, interval: 0.2, spread: 0.075, adsSpread: 0.055, kick: 3.2, kickAds: 2.4, impulse: 1.4, ejectOnShot: true, pip: 'shotgun', sound: 'shotgun' },
  // ---- lever actions and the long-range guns
  winchester: { ...R, label: 'Winchester 94', caliber: '.30-30', note: 'Lever action, loading gate', mag: 6, auto: false, interval: 1.0, spread: 0.02, adsSpread: 0.0018, kick: 4, kickAds: 2.8, adsFov: 52, impulse: 8, brass: 'ak' },
  marlin: { ...R, label: 'Marlin 1895', caliber: '.45-70', note: 'Big-loop lever, ghost ring', mag: 6, auto: false, interval: 1.0, spread: 0.02, adsSpread: 0.0018, kick: 5.5, kickAds: 4, adsFov: 52, impulse: 10, brass: 'rifle3006', sound: 'winchester' },
  sniper: { ...R, label: '.338 Sniper', caliber: '.338 LM', note: 'Bolt action, 6.5° scope', mag: 5, auto: false, interval: 1.42, spread: 0.06, adsSpread: 0, kick: 4.5, kickAds: 3.2, adsFov: 6.5, relief: 0.07, impulse: 14, brass: 'magnum', scoped: true, bolt: true },
  awp: { ...R, label: 'AWP', caliber: '.338 LM', note: 'Bolt action, scoped', mag: 5, auto: false, interval: 1.42, spread: 0.07, adsSpread: 0, kick: 5, kickAds: 3.6, adsFov: 6.5, relief: 0.07, impulse: 16, brass: 'magnum', scoped: true, bolt: true },
  m82: { ...R, label: 'Barrett M82A1', caliber: '.50 BMG', note: 'Semi-auto .50, 10x scope', mag: 10, auto: false, interval: 0.35, spread: 0.06, adsSpread: 0, kick: 7, kickAds: 5, adsFov: 7, relief: 0.07, impulse: 25, brass: 'fifty', ejectOnShot: true, scoped: true, sound: 'fifty' },
};
export const CATEGORIES = { pistol: 'Handguns', smg: 'SMGs', rifle: 'Assault rifles', battle: 'Battle rifles', shotgun: 'Shotguns', precision: 'Levers and long range' };
