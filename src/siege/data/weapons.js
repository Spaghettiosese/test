// Weapon catalogue. Every weapon reuses one of the ten ShapeForge viewmodel rigs (src/weapons)
// and adds its own numbers. dmg is per bullet (per pellet for shotguns) at point blank;
// rpm sets the fire interval; pen is how much of a bullet's energy survives a soft wall.
// kick is degrees of muzzle climb per shot, spread / ads are cone half-angles in radians.
export const WEAPON_CLASSES = { AR: 'Assault Rifle', SMG: 'Submachine Gun', SG: 'Shotgun', DMR: 'Marksman Rifle', SR: 'Sniper Rifle', HG: 'Handgun' };

const W = (id, label, rig, cls, o) => ({ id, label, rig, cls, auto: false, pellets: 1, reserve: 3, pen: 0.6, wallDmg: 6, range: 35, falloff: 0.5, price: 0, level: 1, ...o });
export const WEAPONS = {
  m4a1: W('m4a1', 'M4A1', 'm4a1', 'AR', { dmg: 38, rpm: 780, mag: 30, auto: true, spread: 0.018, ads: 0.0025, kick: 0.9, kickAds: 0.45, pen: 0.55, wallDmg: 8, range: 40, adsFov: 50, price: 0 }),
  r4c: W('r4c', 'R4-C Carbine', 'm4a1', 'AR', { dmg: 32, rpm: 860, mag: 30, auto: true, spread: 0.02, ads: 0.003, kick: 0.7, kickAds: 0.35, pen: 0.5, wallDmg: 7, range: 34, adsFov: 52, price: 1500, level: 3 }),
  ak47: W('ak47', 'AK-47', 'ak47', 'AR', { dmg: 46, rpm: 600, mag: 30, auto: true, spread: 0.026, ads: 0.0035, kick: 1.4, kickAds: 0.8, pen: 0.7, wallDmg: 10, range: 40, adsFov: 50, price: 0 }),
  ak74: W('ak74', 'AK-74M', 'ak47', 'AR', { dmg: 41, rpm: 680, mag: 30, auto: true, spread: 0.024, ads: 0.003, kick: 1.1, kickAds: 0.6, pen: 0.62, wallDmg: 9, range: 38, adsFov: 50, price: 2200, level: 5 }),
  mp5: W('mp5', 'MP5', 'smg', 'SMG', { dmg: 31, rpm: 800, mag: 30, auto: true, spread: 0.022, ads: 0.004, kick: 0.6, kickAds: 0.3, pen: 0.35, wallDmg: 4, range: 22, falloff: 0.6, adsFov: 52, price: 0 }),
  mp7: W('mp7', 'MP7', 'mp7', 'SMG', { dmg: 28, rpm: 950, mag: 40, auto: true, spread: 0.02, ads: 0.0035, kick: 0.5, kickAds: 0.26, pen: 0.4, wallDmg: 4, range: 22, falloff: 0.6, adsFov: 52, price: 1200, level: 2 }),
  pdw9: W('pdw9', 'PDW-9', 'smg', 'SMG', { dmg: 26, rpm: 900, mag: 32, auto: true, spread: 0.019, ads: 0.0032, kick: 0.5, kickAds: 0.25, pen: 0.3, wallDmg: 4, range: 20, falloff: 0.65, adsFov: 54, price: 1800, level: 4 }),
  mpk: W('mpk', 'MPK-9', 'mp7', 'SMG', { dmg: 34, rpm: 720, mag: 30, auto: true, spread: 0.023, ads: 0.004, kick: 0.8, kickAds: 0.4, pen: 0.4, wallDmg: 5, range: 24, falloff: 0.6, adsFov: 52, price: 2400, level: 6 }),
  pump: W('pump', '12G Pump', 'shotgun', 'SG', { dmg: 15, pellets: 9, rpm: 65, mag: 6, reserve: 4, spread: 0.07, ads: 0.05, kick: 5, kickAds: 3.5, pen: 0.2, wallDmg: 18, range: 12, falloff: 0.9, adsFov: 56, price: 0 }),
  slug: W('slug', 'Slug Pump', 'shotgun', 'SG', { dmg: 95, pellets: 1, rpm: 60, mag: 6, reserve: 4, spread: 0.012, ads: 0.004, kick: 6, kickAds: 4, pen: 0.8, wallDmg: 80, range: 30, falloff: 0.5, adsFov: 54, price: 2000, level: 5 }),
  coach: W('coach', 'Coach Gun', 'double', 'SG', { dmg: 17, pellets: 9, rpm: 210, mag: 2, reserve: 8, spread: 0.075, ads: 0.055, kick: 6.5, kickAds: 4.6, pen: 0.2, wallDmg: 20, range: 11, falloff: 0.9, adsFov: 56, price: 1400, level: 3 }),
  garand: W('garand', 'M1 Garand', 'garand', 'DMR', { dmg: 74, rpm: 330, mag: 8, reserve: 4, spread: 0.03, ads: 0.0015, kick: 3.2, kickAds: 2.3, pen: 0.85, wallDmg: 14, range: 70, falloff: 0.2, adsFov: 44, price: 2600, level: 7 }),
  sniper: W('sniper', '.338 Sniper', 'sniper', 'SR', { dmg: 125, rpm: 42, mag: 5, reserve: 4, spread: 0.06, ads: 0.0, kick: 4.5, kickAds: 3.2, pen: 0.95, wallDmg: 40, range: 120, falloff: 0.1, adsFov: 6.5, scoped: true, price: 4000, level: 9 }),
  deagle: W('deagle', 'Desert Eagle .50', 'deagle', 'HG', { dmg: 62, rpm: 200, mag: 7, reserve: 4, spread: 0.02, ads: 0.002, kick: 8.5, kickAds: 6, pen: 0.7, wallDmg: 12, range: 28, falloff: 0.6, adsFov: 52, price: 0 }),
  magnum: W('magnum', '.44 Magnum', 'revolver', 'HG', { dmg: 78, rpm: 130, mag: 6, reserve: 4, spread: 0.022, ads: 0.002, kick: 7, kickAds: 5, pen: 0.75, wallDmg: 14, range: 30, falloff: 0.5, adsFov: 50, delay: 0.065, price: 1000, level: 2 }),
  compact: W('compact', 'P9 Compact', 'deagle', 'HG', { dmg: 33, rpm: 380, mag: 15, reserve: 5, spread: 0.02, ads: 0.003, kick: 1.8, kickAds: 1.1, pen: 0.35, wallDmg: 3, range: 20, falloff: 0.7, adsFov: 55, price: 0 }),
};
WEAPONS.compact.rigMag = 7; // the borrowed Desert Eagle rig reloads to seven; the game tracks the real count itself

export const intervalOf = (w) => 60 / w.rpm;
