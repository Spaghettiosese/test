// A hand lantern (L): light to see by in the dark wilds, at the price of being seen. Burns lamp oil.
import * as E from '../../engine/index.js';
export class Lantern {
  constructor(g) { this.g = g; this.on = false; this.light = new E.Light('point', { color: '#ffc88a', intensity: 0, range: 11, flicker: 0.25 }); g.scene.add(this.light); this.burn = 0; }
  toggle() {
    const g = this.g, P = g.player;
    if (this.on) { this.on = false; g.sfx.snuff?.(); return; }
    if (!P.inv.has('oil')) { g.toast('No lamp oil'); g.sfx.deny?.(); return; }
    this.on = true; this.burn = 0; g.toast('Lantern lit: you can see, and be seen'); g.sfx.pick?.();
  }
  update(dt) {
    const g = this.g, P = g.player;
    if (this.on) {
      this.burn += dt; if (this.burn > 100) { this.burn = 0; if (P.inv.has('oil')) P.inv.remove('oil', 1); else { this.on = false; g.toast('The lantern gutters out. No oil.'); } }
      if (g.weather.cur.rain > 1.2 && Math.random() < dt * 0.05) { this.on = false; g.toast('The storm puts out your lantern'); }
    }
    const e = P.eyePos, f = P.flat;
    this.light.position.set([e[0] + f[0] * 0.45, e[1] - 0.25, e[2] + f[1] * 0.45]);
    this.light.intensity += ((this.on ? 6.5 : 0) - this.light.intensity) * Math.min(1, dt * 8);
  }
}
