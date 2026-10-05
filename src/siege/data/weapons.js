// Weapon catalogue. Every weapon uses one of the twenty ShapeForge viewmodel rigs (src/weapons)
// and adds its own numbers. dmg is per bullet (per pellet for shotguns) at point blank;
// rpm sets the fire interval; pen is how much of a bullet's energy survives a soft wall.
// kick is degrees of muzzle climb per shot, spread / ads are cone half-angles in radians.
export const WEAPON_CLASSES = { AR: 'Assault Rifle', SMG: 'Submachine Gun', LMG: 'Light Machine Gun', SG: 'Shotgun', DMR: 'Marksman Rifle', SR: 'Sniper Rifle', HG: 'Handgun' };

const W = (id, label, rig, cls, o) => ({ id, label, rig, cls, auto: false, pellets: 1, reserve: 3, pen: 0.6, wallDmg: 6, range: 35, falloff: 0.5, price: 0, level: 1, ...o });
export const WEAPONS = {
  m4a1: W('m4a1', 'M4A1', 'm4a1', 'AR', { dmg: 38, rpm: 780, mag: 30, auto: true, spread: 0.018, ads: 0.0025, kick: 0.9, kickAds: 0.45, pen: 0.55, wallDmg: 8, range: 40, adsFov: 50, price: 0 }),
  r4c: W('r4c', 'FA-G2', 'famas', 'AR', { dmg: 32, rpm: 860, mag: 30, auto: true, spread: 0.02, ads: 0.003, kick: 0.7, kickAds: 0.35, pen: 0.5, wallDmg: 7, range: 34, adsFov: 52, price: 1500, level: 3 }),
  ak47: W('ak47', 'AK-47', 'ak47', 'AR', { dmg: 46, rpm: 600, mag: 30, auto: true, spread: 0.026, ads: 0.0035, kick: 1.4, kickAds: 0.8, pen: 0.7, wallDmg: 10, range: 40, adsFov: 50, price: 0 }),
  ak74: W('ak74', 'AK-74M', 'ak47', 'AR', { dmg: 41, rpm: 680, mag: 30, auto: true, spread: 0.024, ads: 0.003, kick: 1.1, kickAds: 0.6, pen: 0.62, wallDmg: 9, range: 38, adsFov: 50, price: 2200, level: 5 }),
  mp5: W('mp5', 'MP5', 'smg', 'SMG', { dmg: 31, rpm: 800, mag: 30, auto: true, spread: 0.022, ads: 0.004, kick: 0.6, kickAds: 0.3, pen: 0.35, wallDmg: 4, range: 22, falloff: 0.6, adsFov: 52, price: 0 }),
  mp7: W('mp7', 'MP7', 'mp7', 'SMG', { dmg: 28, rpm: 950, mag: 40, auto: true, spread: 0.02, ads: 0.0035, kick: 0.5, kickAds: 0.26, pen: 0.4, wallDmg: 4, range: 22, falloff: 0.6, adsFov: 52, price: 1200, level: 2 }),
  pdw9: W('pdw9', 'PS-90', 'p90', 'SMG', { dmg: 24, rpm: 920, mag: 50, auto: true, spread: 0.019, ads: 0.0032, kick: 0.5, kickAds: 0.25, pen: 0.3, wallDmg: 4, range: 20, falloff: 0.65, adsFov: 54, price: 1800, level: 4 }),
  mpk: W('mpk', 'MP10', 'mp10', 'SMG', { dmg: 34, rpm: 720, mag: 30, auto: true, spread: 0.023, ads: 0.004, kick: 0.8, kickAds: 0.4, pen: 0.4, wallDmg: 5, range: 24, falloff: 0.6, adsFov: 52, price: 2400, level: 6 }),
  pump: W('pump', '12G Pump', 'shotgun', 'SG', { dmg: 15, pellets: 9, rpm: 65, mag: 6, reserve: 4, spread: 0.07, ads: 0.05, kick: 5, kickAds: 3.5, pen: 0.2, wallDmg: 18, range: 12, falloff: 0.9, adsFov: 56, price: 0 }),
  slug: W('slug', 'Slug Pump', 'shotgun', 'SG', { dmg: 95, pellets: 1, rpm: 60, mag: 6, reserve: 4, spread: 0.012, ads: 0.004, kick: 6, kickAds: 4, pen: 0.8, wallDmg: 80, range: 30, falloff: 0.5, adsFov: 54, price: 2000, level: 5 }),
  coach: W('coach', 'Coach Gun', 'double', 'SG', { dmg: 17, pellets: 9, rpm: 210, mag: 2, reserve: 8, spread: 0.075, ads: 0.055, kick: 6.5, kickAds: 4.6, pen: 0.2, wallDmg: 20, range: 11, falloff: 0.9, adsFov: 56, price: 1400, level: 3 }),
  garand: W('garand', 'M1 Garand', 'garand', 'DMR', { dmg: 74, rpm: 330, mag: 8, reserve: 4, spread: 0.03, ads: 0.0015, kick: 3.2, kickAds: 2.3, pen: 0.85, wallDmg: 14, range: 70, falloff: 0.2, adsFov: 44, price: 2600, level: 7 }),
  sniper: W('sniper', '.338 Sniper', 'sniper', 'SR', { dmg: 125, rpm: 42, mag: 5, reserve: 4, spread: 0.06, ads: 0.0, kick: 4.5, kickAds: 3.2, pen: 0.95, wallDmg: 40, range: 120, falloff: 0.1, adsFov: 6.5, scoped: true, price: 4000, level: 9 }),
  deagle: W('deagle', 'Desert Eagle .50', 'deagle', 'HG', { dmg: 62, rpm: 200, mag: 7, reserve: 4, spread: 0.02, ads: 0.002, kick: 8.5, kickAds: 6, pen: 0.7, wallDmg: 12, range: 28, falloff: 0.6, adsFov: 52, price: 0 }),
  magnum: W('magnum', '.44 Magnum', 'revolver', 'HG', { dmg: 78, rpm: 130, mag: 6, reserve: 4, spread: 0.022, ads: 0.002, kick: 7, kickAds: 5, pen: 0.75, wallDmg: 14, range: 30, falloff: 0.5, adsFov: 50, delay: 0.065, price: 1000, level: 2 }),
  compact: W('compact', 'P9 Compact', 'compact9', 'HG', { dmg: 33, rpm: 380, mag: 15, reserve: 5, spread: 0.02, ads: 0.003, kick: 1.8, kickAds: 1.1, pen: 0.35, wallDmg: 3, range: 20, falloff: 0.7, adsFov: 55, price: 0 }),
  aug: W('aug', 'AUG-A3', 'aug', 'AR', { dmg: 40, rpm: 720, mag: 30, auto: true, spread: 0.019, ads: 0.0026, kick: 0.8, kickAds: 0.4, pen: 0.58, wallDmg: 8, range: 40, adsFov: 44, price: 2800, level: 6 }),
  l7: W('l7', 'L7 Marauder', 'lmg', 'LMG', { dmg: 43, rpm: 620, mag: 100, reserve: 1, auto: true, spread: 0.034, ads: 0.0055, kick: 1.0, kickAds: 0.55, pen: 0.7, wallDmg: 11, range: 42, adsFov: 54, speed: 0.84, price: 4200, level: 10 }),
  lever: W('lever', 'M94 Lever-Action', 'lever', 'DMR', { dmg: 72, rpm: 100, mag: 8, reserve: 3, spread: 0.026, ads: 0.0018, kick: 3.4, kickAds: 2.4, pen: 0.75, wallDmg: 12, range: 60, falloff: 0.3, adsFov: 48, price: 2000, level: 4 }),
  svd: W('svd', 'SV-10 Marksman', 'dmr', 'DMR', { dmg: 66, rpm: 270, mag: 10, reserve: 3, spread: 0.028, ads: 0.0012, kick: 2.6, kickAds: 1.8, pen: 0.85, wallDmg: 14, range: 80, falloff: 0.2, adsFov: 34, price: 3400, level: 8 }),
  d12: W('d12', 'D-12 Drum', 'd12', 'SG', { dmg: 13, pellets: 8, rpm: 320, mag: 20, reserve: 2, auto: true, spread: 0.085, ads: 0.06, kick: 3.2, kickAds: 2.2, pen: 0.2, wallDmg: 14, range: 11, falloff: 0.9, adsFov: 56, speed: 0.92, price: 3600, level: 9 }),
  scar: W('scar', 'SC-17 Battle Rifle', 'scar', 'AR', { dmg: 54, rpm: 560, mag: 20, reserve: 3, auto: true, spread: 0.022, ads: 0.0028, kick: 1.7, kickAds: 1.0, pen: 0.78, wallDmg: 12, range: 46, adsFov: 48, price: 3200, level: 6 }),
  g36: W('g36', 'G38C Carbine', 'g36', 'AR', { dmg: 35, rpm: 750, mag: 30, auto: true, spread: 0.017, ads: 0.0022, kick: 0.75, kickAds: 0.38, pen: 0.5, wallDmg: 7, range: 38, adsFov: 42, price: 2400, level: 4 }),
  vss: W('vss', 'VS-9 Whisper', 'vss', 'DMR', { dmg: 52, rpm: 420, mag: 20, reserve: 3, spread: 0.024, ads: 0.0012, kick: 1.5, kickAds: 1.0, pen: 0.82, wallDmg: 10, range: 70, falloff: 0.25, adsFov: 34, suppressed: true, price: 3600, level: 8 }),
  tommy: W('tommy', 'M28 Chicago', 'tommy', 'SMG', { dmg: 36, rpm: 680, mag: 50, reserve: 2, auto: true, spread: 0.026, ads: 0.0045, kick: 1.0, kickAds: 0.55, pen: 0.38, wallDmg: 5, range: 24, falloff: 0.6, adsFov: 54, price: 2000, level: 3 }),
  scout: W('scout', 'K-7 Scout Rifle', 'scout', 'SR', { dmg: 108, rpm: 52, mag: 5, reserve: 4, spread: 0.05, ads: 0.0, kick: 4.0, kickAds: 2.8, pen: 0.9, wallDmg: 34, range: 100, falloff: 0.12, adsFov: 18, scoped: true, price: 3000, level: 7 }),
  duelist: W('duelist', 'P9X Duelist', 'duelist', 'HG', { dmg: 38, rpm: 400, mag: 20, reserve: 4, spread: 0.018, ads: 0.0022, kick: 2.0, kickAds: 1.2, pen: 0.4, wallDmg: 4, range: 26, falloff: 0.65, adsFov: 52, price: 1800, level: 5 }),
  skorp: W('skorp', 'Vz-61 Scorpion', 'skorp', 'HG', { dmg: 25, rpm: 850, mag: 20, reserve: 4, auto: true, spread: 0.028, ads: 0.012, kick: 1.1, kickAds: 0.7, pen: 0.3, wallDmg: 3, range: 15, falloff: 0.75, adsFov: 56, price: 1600, level: 4 }),
  m45: W('m45', 'M45 Tactical', 'm45', 'HG', { dmg: 44, rpm: 300, mag: 12, reserve: 4, spread: 0.02, ads: 0.0025, kick: 2.8, kickAds: 1.8, pen: 0.45, wallDmg: 5, range: 24, falloff: 0.6, adsFov: 54, suppressed: true, price: 1100, level: 3 }),
};

export const intervalOf = (w) => 60 / w.rpm;
