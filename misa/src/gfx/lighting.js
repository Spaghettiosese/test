// Lighting: a multiply lightmap built from the time-of-day grade (plus season and weather grades outdoors),
// banded pixel lights added with 'lighter', then emissive repaints (lit windows, lamp cores) on top.
// Objects declare lights with  light: { kind: 'lamp'|'window'|'lantern'|'vending'|'screen'|'candle', x, y }  where
// x, y are world px relative to the object's footprint top-left (default: footprint centre, one tile up).
import { gradeAt, lerpHex, multiplyHex, SEASON_GRADE, WEATHER_GRADE } from './palette.js';

export const LIGHTS = {
  lamp: { c: 'rgba(120,90,40,0.55)', r: 46, b: 4, core: '#fff4c0' },
  window: { c: 'rgba(110,80,30,0.5)', r: 30, b: 3 },
  lantern: { c: 'rgba(140,80,30,0.6)', r: 24, b: 3, flicker: true, core: '#ffd08a' },
  candle: { c: 'rgba(140,80,30,0.55)', r: 18, b: 3, flicker: true, core: '#ffe0a0' },
  shrine: { c: 'rgba(150,70,30,0.6)', r: 26, b: 3, flicker: true, core: '#ffb070' },
  vending: { c: 'rgba(60,100,140,0.5)', r: 20, b: 3, core: '#dff4ff' },
  screen: { c: 'rgba(60,110,150,0.4)', r: 18, b: 2 },
  player: { c: 'rgba(150,110,50,0.6)', r: 58, b: 5 },
};

let L = null, lx = null;
const disc = (ctx, cx, cy, r, col) => { const ry = Math.round(r * 0.75); ctx.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.floor(r * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1)))); ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } };

// How dark is it (0 = day, 1 = deep night)? Used to switch lights on.
export function darkness(minutes) {
  const h = (minutes / 60) % 24;
  if (h >= 20.5 || h < 4.5) return 1;
  if (h >= 17) return Math.min(1, (h - 17) / 3.5);
  if (h < 6.5) return 1 - (h - 4.5) / 2;
  return 0;
}

export function drawLighting(g, game, world) {
  const m = world.map, def = m.def, outdoor = !!def.outdoor, mins = game.minutes;
  let grade = gradeAt((mins / 60) % 24);
  if (!outdoor) grade = lerpHex('#ffffff', grade, def.dark ? 0.85 : 0.55);
  if (outdoor) {
    grade = multiplyHex(grade, SEASON_GRADE[game.season] || '#ffffff');
    if (WEATHER_GRADE[game.weather]) grade = multiplyHex(grade, WEATHER_GRADE[game.weather]);
  }
  const blackout = !!game.flag('blackout') && !outdoor;
  if (blackout) grade = '#2a2648';
  const dark = blackout ? 1 : darkness(mins);
  if (grade === '#ffffff' && !dark) return;
  if (!L) { L = document.createElement('canvas'); L.width = 320; L.height = 224; lx = L.getContext('2d'); }
  lx.globalCompositeOperation = 'source-over'; lx.fillStyle = grade; lx.fillRect(0, 0, 320, 224);
  const emissive = [];
  if (dark > 0.15) {
    lx.globalCompositeOperation = 'lighter';
    const fl = Math.floor(game.clock * 8);
    const lights = [];
    for (const o of world.visibleLights()) lights.push(o);
    if (blackout || game.flag('lantern')) lights.push({ kind: 'player', x: world.player.x, y: world.player.y - 12 });
    for (const li of lights) {
      const P = LIGHTS[li.kind] || LIGHTS.lamp;
      const sx = world.sx(li.x), sy = world.sy(li.y);
      if (sx < -80 || sy < -80 || sx > 400 || sy > 300) continue;
      const r = P.r + (P.flicker ? ((fl + li.x) % 3) - 1 : 0);
      for (let k = 0; k < P.b; k++) disc(lx, sx, sy, Math.round(r * (1 - k / P.b)), P.c);
      if (P.core) emissive.push([sx, sy, P.core]);
    }
    lx.globalCompositeOperation = 'source-over';
  }
  g.globalCompositeOperation = 'multiply'; g.drawImage(L, 0, 0); g.globalCompositeOperation = 'source-over';
  for (const [x, y, c] of emissive) { g.fillStyle = c; g.fillRect(x - 2, y - 2, 4, 4); }
  for (const f of world.emissives || []) f(g, dark);
}
