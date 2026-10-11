// Base tiles. Most are painted procedurally by gfx/ground.js: { ground } terrain, { floor } patterns, { wall } styles.
import { register, registerMany } from '../core/registry.js';
import { tileAt } from '../world/map.js';

const wallPick = (x, y, season, m) => { const b = m && tileAt(m, x, y + 1); return b && !b.solid ? 't_wall_face' : 't_wall_top'; };
registerMany('tile', {
  void: { spr: null, solid: true },
  // indoor (baked by gfx/ground.js)
  wall: { wall: 'plaster', solid: true },
  wall_wood: { wall: 'wood', solid: true },
  wall_school: { wall: 'school', solid: true },
  wall_brick: { wall: 'brick', solid: true },
  wall_stone: { wall: 'stone', solid: true },
  wood: { floor: 'planks' },
  wood_dark: { floor: 'wood_dark' },
  kitchen: { floor: 'kitchen' },
  bath: { floor: 'bath' },
  sunroom: { floor: 'planks', tint: 'wood' },
  tatami: { floor: 'tatami' },
  linoleum: { floor: 'linoleum' },
  gym: { floor: 'gym' },
  gym_line: { floor: 'gym', line: true },
  carpet: { floor: 'carpet' },
  carpet_blue: { floor: 'carpet', tint: 'sky' },
  carpet_green: { floor: 'carpet', tint: 'mint' },
  stone_floor: { floor: 'stone' },
  doorway: { floor: 'planks' },
  // outdoor terrain
  grass: { ground: 'grass' },
  meadow: { ground: 'meadow' },
  lawn: { ground: 'lawn' },
  dirt: { ground: 'dirt' },
  path: { ground: 'dirt' },
  sand: { ground: 'sand' },
  water: { ground: 'water', solid: true },
  ocean: { ground: 'ocean', solid: true },
  paved: { ground: 'paved' },
  plaza: { ground: 'plaza' },
  gravel: { ground: 'gravel' },
  asphalt: { ground: 'asphalt' },
  hedge: { wall: 'hedge', solid: true },
  // legacy 16px tiles (kept for old content)
  legacy_wall: { spr: 't_wall_top', solid: true, pick: wallPick },
});

