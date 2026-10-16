// Mochi the cat: a 1:1 animated actor (src/content/mochi/cats.js) who lives at home and picks what to do by her
// needs, the time and the weather: sun spot naps, the laundry basket, the sofa, her cushion and bed, the cat tower,
// the cardboard box, window watching in the rain, hiding from thunder, and sleeping on Misa's bed after bond 2.
// After bond event 4 she can go out on a harness and follow Misa to any map. Interacting opens her care menu.
import { register, features } from '../core/registry.js';
import { TILE } from '../world/map.js';
import { Critter, tileOf, near } from '../content/mochi/actor.js';
import { ms, hearts, addBond, fillNeed, mood, checkAllCare } from '../content/mochi/state.js';

const WALK_LINES = ['Is that Mochi? On a lead! How fancy.', 'A cat on a walk? Now I have seen everything.', 'Hello, little tiger. Are you guarding Misa today?', 'She walks better than my old dog did.', 'Look at her strut. Like she owns the town.', 'Oh, what a fluffy tail!'];
export const POSES = {
  sit: 'Proper sit', loaf: 'Bread loaf', sleep: 'Curled up', groom: 'Bath time', stretch: 'Big stretch', belly: 'Belly up',
  pounce: 'Pounce!', eat: 'Nom nom', window: 'Rain watcher', sun: 'Sunbather', basket: 'Laundry nest', sofa: 'Sofa queen',
  perch: 'Tower lookout', box: 'If I fits, I sits', bed: 'Foot warmer', walk: 'Adventure cat', hide: 'Thunder hideout',
  kuro: 'Best friends', zoom: 'Zoomies blur', meow: 'Mid-meow',
};

// ---------- favourite spots on the home map (computed from the props the interiors area placed) ----------
function homeSpots(world) {
  const m = world.map;
  if (m._mochiSpots) return m._mochiSpots;
  const find = (...names) => m.objects.find((o) => names.includes(o.spr) || names.includes(o.use) || (o.interact && names.includes(o.interact.id)));
  const fpOf = (o) => { const r = [o.x * TILE + (o.dx || 0), o.y * TILE + (o.dy || 0), o.w * TILE, o.h * TILE]; return r; };
  const S = {};
  const cush = m.spawns.cushion || [7, 12];
  S.cushion = { x: cush[0] * TILE + 12, y: cush[1] * TILE + 12, tile: cush, pose: 'sleep' };
  const add = (key, o, f) => { if (o) S[key] = f(fpOf(o), o); };
  add('pet_bed', find('pet_bed', 'int_pet_bed'), ([x, y, w, h]) => ({ x: x + 9, y: y + h - 3, tile: [Math.floor(x / TILE), Math.floor((y + h - 1) / TILE)], pose: 'sleep' }));
  add('perch', find('cat_tree', 'int_cat_tree'), ([x, y, w, h]) => ({ x: x + 8, y: y + h - 1, lift: 25, tile: [Math.floor(x / TILE), Math.floor(y / TILE) + 1], pose: 'loaf', hop: true }));
  add('basket', find('int_basket', 'basket'), ([x, y, w, h]) => ({ x: x + 8, y: y + h - 2, lift: 3, tile: [Math.floor(x / TILE), Math.floor(y / TILE) + 1], pose: 'loaf', hop: true }));
  add('bed', find('int_bed', 'bed'), ([x, y, w, h]) => ({ x: x + 14, y: y + h - 4, lift: 6, tile: [Math.floor(x / TILE) + 2, Math.floor(y / TILE) + 1], pose: 'sleep', hop: true }));
  add('sofa', find('sofa', 'int_sofa_back'), ([x, y, w, h]) => ({ x: x + w / 2 + 10, y: y + h + 1, lift: 11, tile: [Math.floor((x + w / 2) / TILE), Math.floor(y / TILE) + 1], pose: 'loaf', hop: true }));
  add('bowl', find('task_feed', 'int_bowl', 'bowl_empty'), ([x, y, w, h]) => ({ x: x + 22, y: y + h - 3, tile: [Math.floor(x / TILE) + 1, Math.floor(y / TILE)], pose: 'eat', dir: -1 }));
  add('hide', find('desk', 'int_desk'), ([x, y, w, h]) => ({ x: x + w / 2, y: y + h - 1, tile: [Math.floor((x + w / 2) / TILE), Math.floor(y / TILE) + 1], pose: 'hide' }));
  // sun pool under the right-hand sunroom window, and a rainy-day post under a top window
  const wins = m.def.windows || [];
  const side = wins.find((w) => w.side === 'right') || wins.find((w) => w.side);
  if (side) { const tx = side.side === 'right' ? side.x - 2 : side.x + 2, ty = side.y + 1; S.sun = { x: tx * TILE + 8, y: ty * TILE + 12, tile: [tx, ty], pose: 'sleep', sun: true }; }
  const top = wins.find((w) => !w.side && w.y <= 1 && w.x > 8) || wins.find((w) => !w.side);
  if (top) { const tx = top.x + Math.floor((top.w || 1) / 2), ty = top.y + 1; S.window = { x: tx * TILE + 4, y: ty * TILE + 10, tile: [tx, ty], pose: 'window' }; }
  // the cardboard box (drawn by content/mochi/home.js when set out)
  S.box = { x: 19 * TILE + 8, y: 13 * TILE + 13, tile: [19, 13], pose: 'box' };
  for (const k of Object.keys(S)) if (world.grid && S[k].tile && !(world.grid[S[k].tile[1]] || [])[S[k].tile[0]] && !S[k].hop) {
    // walk to the nearest walkable tile next to it
    const [tx, ty] = S[k].tile;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if ((world.grid[ty + dy] || [])[tx + dx]) { S[k].tile = [tx + dx, ty + dy]; break; }
  }
  m._mochiSpots = S;
  return S;
}

const treatId = (g) => ['mochi_treat', 'snack_pet_salmon', 'snack_pet_tuna'].find((i) => g.has(i));

class Mochi extends Critter {
  constructor() {
    super('mochi', { map: 'home', x: 7.5 * TILE, y: 12.8 * TILE, state: 'sleep', t: 8, label: 'Mochi' });
    this.spot = null; this.hopT = 0;
  }
  get label() { const g = this.game; return g && g.weather === 'storm' && this.state === 'hide' ? 'Comfort Mochi' : 'Mochi'; }
  set label(v) { /* fixed */ }
  get moving() { return ['follow', 'wander', 'goto', 'zoom', 'greet', 'tour'].includes(this.state); }
  set(state, t = 3) { this.state = state; this.t = t; this.frame = 0; this.ft = 0; if (state !== 'goto' && state !== 'rest') this.lift = 0; }
  sitBase() { return ms(this.game).walking ? 'mc_hsit_' : 'mc_sit_'; }
  get sprite() {
    const a = this.anim, s = this.state, w = ms(this.game).walking;
    switch (s) {
      case 'rest': return this.poseSprite(this.spot ? this.spot.pose : 'sleep');
      case 'sleep': return this.poseSprite('sleep');
      case 'loaf': return `mc_loaf_${a % 5 < 0.4 ? 1 : 0}`;
      case 'groom': return `mc_groom_${Math.floor(a * 4) % 4}`;
      case 'stretch': return `mc_stretch_${Math.min(2, Math.floor(this.ft * 3))}`;
      case 'pounce': return `mc_pounce_${this.ft < 1.2 ? Math.floor(this.ft * 6) % 2 : this.ft < 1.45 ? 2 : 3}`;
      case 'belly': return `mc_belly_${Math.floor(a * 1.5) % 2}`;
      case 'eat': return `mc_eat_${Math.floor(a * 3) % 2}`;
      case 'beg': return a % 2 < 0.5 ? 'mc_sit_meow' : 'mc_sit_0';
      case 'happy': return 'mc_sit_happy';
      case 'arch': return `mc_arch_${Math.floor(a * 6) % 2}`;
      case 'sit': return a % 4.2 < 0.14 ? 'mc_sit_b' : `${this.sitBase()}${Math.floor(a * 2.2) % 4}`;
      default: return this.walking || this.hopT > 0 ? `${w ? 'mc_hwalk_' : 'mc_walk_'}${this.frame}` : `${this.sitBase()}${Math.floor(a * 2.2) % 4}`;
    }
  }
  poseSprite(p) {
    const a = this.anim;
    if (p === 'sleep') return `mc_sleep_${[0, 1, 2, 1][Math.floor(a * 1.2) % 4]}`;
    if (p === 'loaf') return `mc_loaf_${a % 5 < 0.4 ? 1 : 0}`;
    if (p === 'window') return `mc_back_${Math.floor(a * 1.5) % 3}`;
    if (p === 'hide') return 'mc_loaf_scared';
    if (p === 'eat') return `mc_eat_${Math.floor(a * 3) % 2}`;
    if (p === 'box') return 'mochi_box_cat';
    if (p === 'belly') return `mc_belly_${Math.floor(a * 1.5) % 2}`;
    if (p === 'groom') return `mc_groom_${Math.floor(a * 4) % 4}`;
    return `mc_sit_${Math.floor(a * 2.2) % 4}`;
  }
  // Which pose is she in right now (for photos)?
  pose() {
    const s = this.state, sp = this.spot, game = this.game;
    if (s === 'rest' && sp) {
      if (sp.key === 'sun') return 'sun'; if (sp.key === 'basket') return 'basket'; if (sp.key === 'sofa') return 'sofa';
      if (sp.key === 'perch') return 'perch'; if (sp.key === 'box') return 'box'; if (sp.key === 'bed') return 'bed';
      if (sp.key === 'window') return 'window'; if (sp.key === 'hide') return 'hide'; if (sp.key === 'bowl') return 'eat'; if (sp.pose === 'belly') return 'belly';
      if (game.kuro && game.kuro.map === this.map && near(game.kuro, this, 20) && sp.pose === 'sleep') return 'kuro';
      return sp.pose === 'loaf' ? 'loaf' : 'sleep';
    }
    if (ms(game).walking && this.moving) return 'walk';
    return { sleep: 'sleep', loaf: 'loaf', groom: 'groom', stretch: 'stretch', pounce: 'pounce', belly: 'belly', eat: 'eat', zoom: 'zoom', beg: 'meow', happy: 'meow' }[s] || 'sit';
  }

  // ---------- brain ----------
  choose(world) {
    const game = this.game, s = ms(game), m = game.minutes, rng = game.rng, S = world.map.id === 'home' ? homeSpots(world) : {};
    const goSpot = (key, t) => { const sp = S[key]; if (!sp) return false; this.spot = { ...sp, key }; this.pathTo(world, sp.tile[0], sp.tile[1]); this.set('goto', t); return true; };
    if (world.map.id !== 'home') { this.set(rng() < 0.5 ? 'follow' : 'sit', 3 + rng() * 3); return; }
    if (game.weather === 'storm' && s.comfortDay !== game.day && goSpot('hide', 40)) return;
    const night = m >= 22 * 60 || m < 6 * 60;
    if (night) { if (m >= 25 * 60 && rng() < 0.15) { this.zoom(world); return; } if ((hearts(game) >= 2 && goSpot('bed', 120)) || goSpot(rng() < 0.5 && S.pet_bed ? 'pet_bed' : 'cushion', 120)) return; }
    if (s.needs.food < 25 && s.fedDay !== game.day && S.bowl && rng() < 0.6) { this.spot = { ...S.bowl, key: 'bowl', pose: 'beg' }; this.pathTo(world, S.bowl.tile[0], S.bowl.tile[1]); this.set('goto', 14); return; }
    const r = rng();
    if ((game.weather === 'rain' || game.weather === 'snow') && r < 0.35 && goSpot('window', 30)) return;
    if (game.weather === 'sunny' && m >= 7 * 60 && m < 12 * 60 && r < 0.35 && goSpot('sun', 40)) return;
    if (s.warmLaundry === game.day && r < 0.45 && goSpot('basket', 40)) return;
    if (s.box && r < 0.2 && goSpot('box', 30)) return;
    if (m >= 13 * 60 && m < 17 * 60 && r < 0.45 && goSpot(['pet_bed', 'perch', 'sofa', 'cushion'][Math.floor(rng() * 4)], 40)) return;
    if (m >= 18 * 60 && r < 0.3 && goSpot(rng() < 0.6 ? 'sofa' : 'perch', 35)) return;
    if (s.needs.play < 30 && r < 0.6) { this.set('pounce', 1.9); return; }
    const pick = rng();
    if (pick < 0.3) this.set('follow', 12);
    else if (pick < 0.45) { this.wanderTo(world); }
    else if (pick < 0.6) this.set('groom', 3 + rng() * 3);
    else if (pick < 0.7) this.set('stretch', 1.6);
    else if (pick < 0.8) this.set('loaf', 8 + rng() * 8);
    else this.set('sit', 3 + rng() * 5);
  }
  wanderTo(world) {
    const rng = this.game.rng, [tx, ty] = tileOf(this.x, this.y);
    for (let i = 0; i < 8; i++) { const nx = tx + Math.floor((rng() - 0.5) * 8), ny = ty + Math.floor((rng() - 0.5) * 6); if ((world.grid[ny] || [])[nx] && this.pathTo(world, nx, ny)) { this.spot = null; this.set('wander', 10); return; } }
    this.set('sit', 3);
  }
  zoom(world) { this.set('zoom', 7); this.zoomN = 0; this.nextZoom(world); this.game.stat('mochiZoomies'); }
  nextZoom(world) {
    const rng = this.game.rng, m = world.map;
    for (let i = 0; i < 10; i++) { const nx = 1 + Math.floor(rng() * (m.w - 2)), ny = 1 + Math.floor(rng() * (m.h - 2)); if ((world.grid[ny] || [])[nx] && this.pathTo(world, nx, ny)) return; }
  }

  update(dt, game, world) {
    this.game = game; this.tickBase(dt, world);
    const p = world.player, dP = Math.hypot(p.x - this.x, p.y - this.y), s = ms(game);
    this.t -= dt;
    if (this.hopT > 0) { // a little jump up onto furniture
      this.hopT -= dt; const k = 1 - Math.max(0, this.hopT) / 0.35;
      this.x = this.hop0[0] + (this.spot.x - this.hop0[0]) * k; this.y = this.hop0[1] + (this.spot.y - this.hop0[1]) * k;
      this.lift = (this.spot.lift || 0) * k + Math.sin(k * Math.PI) * 6;
      if (this.hopT <= 0) { this.lift = this.spot.lift || 0; this.set('rest', this.t); this.state = 'rest'; this.lift = this.spot.lift || 0; }
      this.animStep(dt, true); return;
    }
    switch (this.state) {
      case 'follow': {
        if (dP < 22) { this.path = null; this.set('sit', 2 + game.rng() * 4); break; }
        if (!this.path || this.repath <= 0) { const [tx, ty] = tileOf(p.x, p.y); this.pathTo(world, tx, ty); this.repath = 0.8; }
        this.repath -= dt; this.stepPath(dt, dP > 70 ? 70 : s.walking ? 52 : 40);
        if (this.t <= 0 && !s.walking) this.choose(world);
        break;
      }
      case 'greet':
        this.moveToward(p.x + (this.x < p.x ? -12 : 12), p.y, 75, dt);
        if (dP < 20) { this.set('happy', 2.5); game.sfx('trill'); world.particles.push({ spr: 'heart', x: this.x - 3, y: this.y - 22, vy: -12, life: 1.2 }); }
        if (this.t <= 0) this.set('sit', 2);
        break;
      case 'wander': if (this.stepPath(dt, 26) || this.t <= 0) { this.path = null; this.set(game.rng() < 0.5 ? 'sit' : 'loaf', 3 + game.rng() * 4); } break;
      case 'goto':
        if (this.stepPath(dt, 38) || this.t <= 0) {
          const sp = this.spot;
          if (!sp) { this.set('sit', 3); break; }
          if (sp.pose === 'beg') { this.x = sp.x; this.y = sp.y; this.dir = -1; this.set('beg', 10); break; }
          this.hop0 = [this.x, this.y];
          if (sp.hop || Math.hypot(sp.x - this.x, sp.y - this.y) > 2) { this.hopT = 0.35; this.t = (sp.key === 'bed' || sp.key === 'cushion' || sp.key === 'pet_bed') && (game.minutes >= 22 * 60 || game.minutes < 6 * 60) ? 600 : 25 + game.rng() * 25; }
          else { this.set('rest', 30); }
          if (sp.dir) this.dir = sp.dir;
        }
        break;
      case 'rest': {
        const sp = this.spot, night = game.minutes >= 22 * 60 || game.minutes < 6 * 60;
        if (sp && sp.key === 'hide' && (game.weather !== 'storm' || s.comfortDay === game.day)) this.t = Math.min(this.t, 0);
        if (sp && sp.pose === 'sleep' && game.rng() < dt * 0.05) this.dream = { t: 3, icon: ['i_fish', 'heart', 'i_music'][Math.floor(game.rng() * 3)] };
        if (this.t <= 0 && !(night && sp && sp.pose === 'sleep')) { this.leaveSpot(world); this.choose(world); }
        break;
      }
      case 'beg': if (game.rng() < dt * 0.4) game.sfx('meow'); if (s.fedDay === game.day || this.t <= 0) { this.spot = null; this.set(s.fedDay === game.day ? 'eat' : 'sit', 4); } break;
      case 'zoom':
        if (this.stepPath(dt, 110)) this.nextZoom(world);
        if (this.t <= 0) { this.path = null; this.set('sit', 3); }
        break;
      case 'pounce': if (this.ft > 1.5 && !this.pounced) { this.pounced = true; this.x += this.dir * 10; } if (this.t <= 0) { this.pounced = false; this.set('sit', 2); } break;
      default:
        if (this.t <= 0) this.choose(world);
        if (s.walking && dP > 30) this.set('follow', 10);
        else if (this.state === 'sit' && dP > 60 && !(game.minutes >= 22 * 60) && game.rng() < dt * 0.5) this.set('follow', 12);
    }
    if (this.dream) { this.dream.t -= dt; if (this.dream.t <= 0 || this.state !== 'rest') this.dream = null; }
    this.animStep(dt, this.walking);
    // NPCs react to a cat on a lead
    if (s.walking && world.map.id !== 'home') {
      for (const n of world.presentNPCs()) {
        if (Math.hypot(n.x - this.x, n.y - this.y) > 36) continue;
        const key = n.id + ':' + game.day; s.walkSeen ||= {};
        if (s.walkSeen[n.id] === game.day) continue;
        s.walkSeen[n.id] = game.day; void key;
        n.emote = 'heart'; n.emoteT = 2;
        game.toast(`${n.def.name}: ${WALK_LINES[(n.id.length + game.day) % WALK_LINES.length]}`, 'heart');
        addBond(game, 5, 'walkfans');
      }
    }
  }
  leaveSpot(world) {
    if (!this.spot) return;
    const sp = this.spot; this.lift = 0;
    if (sp.hop || sp.lift) { const [tx, ty] = sp.tile; if ((world.grid[ty] || [])[tx]) { this.x = tx * TILE + 8; this.y = ty * TILE + 13; } }
    if (sp.key === 'box') { this.x -= 14; }
    this.spot = null;
  }
  animStep(dt, moving) {
    const rate = this.state === 'zoom' ? 0.05 : 0.09;
    if (moving && this.ft > rate) { this.ft = 0; this.frame = (this.frame + 1) % 6; }
  }
  draw(g, world) {
    const game = world.game, sp = this.spot, rest = this.state === 'rest';
    if (rest && sp && sp.key === 'box') { if (this.emote) world.drawEmote(this.emote, this.x, this.y - 22); return; } // the box layer draws her
    const side = this.walking || this.hopT > 0 || ['eat', 'stretch', 'pounce', 'zoom', 'wander', 'follow', 'goto', 'arch', 'belly'].includes(this.state) || (rest && sp && ['sleep', 'loaf', 'eat'].includes(sp.pose));
    const flip = side ? this.dir < 0 : this.dir < 0;
    this.drawSprite(world, this.sprite, flip, this.lift ? 0 : 9);
    if ((rest && sp && sp.pose === 'sleep') || this.state === 'sleep') {
      const zx = this.x + (this.dir < 0 ? -8 : 8), zy = this.y - 12 - this.lift + Math.sin(game.clock * 2) * 1.5;
      if (Math.floor(game.clock * 0.7) % 2) world.drawFeet('zzz', zx, zy);
      if (this.dream) this.drawDream(g, world);
    }
  }
  drawDream(g, world) {
    const x = world.sx(this.x) + 10, y = world.sy(this.y - this.lift) - 40;
    g.fillStyle = '#2a1a22'; g.fillRect(x - 1, y - 1, 16, 13); g.fillStyle = '#f8f2ff'; g.fillRect(x, y, 14, 11);
    g.fillRect(x - 3, y + 12, 2, 2); g.fillRect(x - 6, y + 15, 1, 1);
    world.drawSpr(this.dream.icon === 'heart' ? 'heart' : this.dream.icon, (x + 3 + world.cam.x) / 2, (y + 2 + world.cam.y) / 2);
  }

  // ---------- care menu ----------
  interact(game) {
    const s = ms(game), pose = this.pose(), wasState = this.state;
    if (this.state !== 'rest' && this.state !== 'beg') this.set('sit', 8);
    const opts = [];
    if (game.weather === 'storm' && s.comfortDay !== game.day && game.world.map.id === 'home') opts.push({ text: 'Comfort her', steps: [{ t: 'call', fn: () => this.comfort(game) }] });
    opts.push({ text: wasState === 'rest' && this.spot && this.spot.pose === 'sleep' ? 'Pet her gently' : 'Pet her', steps: [{ t: 'call', fn: () => this.pet(game) }] });
    if (treatId(game)) opts.push({ text: 'Give a churu treat', steps: [{ t: 'call', fn: () => this.treat(game) }] });
    opts.push({ text: 'Play with the feather wand', steps: [{ t: 'call', fn: () => game.mochiPlay() }] });
    opts.push({ text: 'Brush her', steps: [{ t: 'call', fn: () => game.mochiBrush() }] });
    opts.push({ text: 'Snap a photo', steps: [{ t: 'call', fn: () => this.photo(game, pose) }] });
    if (s.walking) opts.push({ text: 'Head home together', steps: [{ t: 'call', fn: () => game.mochiEndWalk(true) }] });
    else if (game.has('key_mochi_harness') && game.world.map.id === 'home' && game.minutes < 21 * 60 && game.weather !== 'storm') opts.push({ text: 'Take her for a walk', steps: [{ t: 'call', fn: () => game.mochiStartWalk() }] });
    opts.push({ text: 'Leave her be', steps: [] });
    game.run([{ t: 'choice', prompt: `Mochi looks ${mood(game).text.toLowerCase()}.`, options: opts }]);
  }
  pet(game) {
    return game.minigame('pet', {}).then((r) => {
      const aff = r.score || 0, s = ms(game);
      if (aff > 0.05) {
        fillNeed(game, 'love', Math.round(aff * 60)); game.addMood(Math.round(aff * 8));
        const gained = addBond(game, Math.round(10 + aff * 20), 'pet');
        if (s.pettedDay !== game.day) { s.pettedDay = game.day; }
        game.toast(aff >= 1 ? 'Mochi adores you!' : gained ? 'Mochi purrs. Your bond grows.' : 'Mochi purrs happily', 'heart');
        if (aff >= 1) game.stat('mochiFullPets');
        checkAllCare(game);
      }
      game.stat('mochiPets');
      if (this.state !== 'rest') this.set('happy', 3);
    });
  }
  treat(game) {
    const s = ms(game);
    game.take(treatId(game), 1); game.sfx('trill');
    fillNeed(game, 'love', 25); fillNeed(game, 'food', 10);
    const many = s.treatDay === game.day;
    s.treatDay = game.day; s.treatsToday = many ? (s.treatsToday || 1) + 1 : 1;
    addBond(game, many ? 0 : 20, 'treat');
    this.set('happy', 3);
    return game.run([{ t: 'say', who: 'mochi', mood: 'happy', text: many ? 'Mrrp! (She licks the tube clean. Maybe that is enough treats for today.)' : 'Mrrrp! Mrrrp! (Every lick is a tiny celebration.)' }]);
  }
  comfort(game) {
    const s = ms(game);
    s.comfortDay = game.day; fillNeed(game, 'love', 30); addBond(game, 25, 'comfort');
    game.stat('mochiComforted');
    return game.run([
      { t: 'say', who: 'misa', mood: 'neutral', text: 'Hey, hey. It\'s just thunder. It\'s loud, but it can\'t come inside.' },
      { t: 'say', who: 'mochi', mood: 'sleepy', text: '...mew.' },
      { t: 'say', who: 'misa', mood: 'happy', text: 'There you go. I\'ve got you. We can be brave together.' },
      { t: 'call', fn: () => { this.leaveSpot(game.world); this.set('follow', 20); } },
    ]);
  }
  photo(game, pose) {
    const s = ms(game), first = !s.poses[pose];
    s.poses[pose] = s.poses[pose] || game.day;
    game.sfx('camera'); game.flashUntil = game.clock + 0.25;
    game.stat('mochiPhotos');
    if (first) { game.toast(`New Mochi pose: ${POSES[pose]}!`, 'i_star'); game.collect('mochi_pose', pose); }
    else game.toast(`Another lovely ${POSES[pose].toLowerCase()} photo`, 'heart');
    if (s.photoDay !== game.day) { s.photoDay = game.day; addBond(game, 5, 'photo'); }
    return Promise.resolve();
  }
}

register('system', 'mochi', {
  init(game) {
    const mochi = new Mochi();
    mochi.game = game;
    game.mochi = mochi;
    let last = null;
    const place = (world) => {
      const p = world.player;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) { const [tx, ty] = tileOf(p.x, p.y); if ((world.grid[ty + dy] || [])[tx + dx]) { mochi.x = (tx + dx) * TILE + 8; mochi.y = (ty + dy) * TILE + 13; return; } }
      mochi.x = p.x + 8; mochi.y = p.y;
    };
    game.bus.on('mapEnter', ({ map }) => {
      const world = game.world, s = ms(game);
      if (!world || !world.pets) return;
      if (!world.pets.includes(mochi)) world.pets.push(mochi);
      mochi.path = null; mochi.spot = null; mochi.lift = 0; mochi.hopT = 0;
      if (s.walking) {
        if (map === 'home') { game.mochiEndWalk(false); mochi.map = 'home'; place(world); mochi.set('sit', 4); }
        else { mochi.map = map; place(world); mochi.set('follow', 10); s.walkMaps[map] = (s.walkMaps[map] || 0) + 1; game.stat('mochiWalkMaps'); }
      } else if (map === 'home' && last && last !== 'home') {
        mochi.map = 'home';
        const p = world.player; mochi.x = p.x + (game.rng() < 0.5 ? -40 : 40); mochi.y = p.y - 20;
        if ((world.grid[Math.floor((mochi.y - 1) / TILE)] || [])[Math.floor(mochi.x / TILE)]) mochi.set(game.minutes > 21 * 60 ? 'sit' : 'greet', 6);
        else { place(world); mochi.set('happy', 3); }
      } else if (map === 'home' && !last) { mochi.map = 'home'; homeSpots(world); mochi.choose(world); if (mochi.spot) { const sp = mochi.spot; mochi.x = sp.x; mochi.y = sp.y; mochi.lift = sp.lift || 0; mochi.path = null; mochi.set('rest', 20); } }
      last = map;
    });
    game.bus.on('dayStart', () => {
      const s = ms(game); s.walking = false; mochi.map = 'home'; mochi.spot = null; mochi.lift = 0;
      const w = game.world;
      if (w && w.map && w.map.id === 'home') {
        const S = homeSpots(w), key = hearts(game) >= 2 && S.bed ? 'bed' : 'cushion', sp = S[key];
        if (sp) { mochi.spot = { ...sp, key }; mochi.x = sp.x; mochi.y = sp.y; mochi.lift = sp.lift || 0; mochi.set('rest', 25); }
      } else mochi.set('sleep', 5);
    });
    game.bus.on('startZoomies', () => { if (game.world) { mochi.leaveSpot(game.world); mochi.zoom(game.world); } });
    // harness walks
    game.mochiStartWalk = () => {
      const s = ms(game); s.walking = true; mochi.leaveSpot(game.world); mochi.set('follow', 10); game.stat('mochiWalks');
      addBond(game, 20, 'walk'); fillNeed(game, 'play', 30);
      return game.run([{ t: 'say', who: 'misa', mood: 'happy', text: 'Harness on... click! Ready for an adventure, Mochi?' }, { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrrow! (She marches straight for the door.)' }]);
    };
    game.mochiEndWalk = (talk) => {
      const s = ms(game); if (!s.walking) return Promise.resolve();
      s.walking = false; fillNeed(game, 'play', 20); fillNeed(game, 'love', 15); checkAllCare(game);
      const n = Object.keys(s.walkMaps).length;
      if (!talk) { game.toast('Harness off. Mochi stretches and flops down, happy and tired.', 'heart'); return Promise.resolve(); }
      return game.run([{ t: 'say', who: 'misa', mood: 'happy', text: `Time to head home. You've sniffed ${n} different place${n === 1 ? '' : 's'} so far!` }, { t: 'call', fn: () => game.world && game.world.map.id !== 'home' ? game.warp('home', 15, 13, 'up') : null }]);
    };
    game.mochiPose = () => mochi.pose();
  },
});

features('Mochi', [
  'Mochi redrawn at 1:1 pixel density with an ink outline: sit, blink, tail sway, 6-frame walk, sleeping breaths, grooming, stretching, pouncing, eating, loafing, belly-up rolls and a puffed-up hiss',
  'Mochi chooses her own activities: following Misa, wandering, grooming, stretching, loafing and pouncing at nothing',
  'Mochi picks favourite nap spots by time and weather: the morning sun pool, the warm laundry basket, the sofa, her cushion, her pet bed and the cat tower',
  'Mochi watches the rain from the window, seen from behind',
  'On stormy days Mochi hides under the desk; comfort her to calm her down',
  'Mochi sleeps curled up on Misa\'s bed at night once your bond reaches 2 hearts, and is still there in the morning',
  'Mochi dreams while she naps: little dream bubbles of fish, hearts and music',
  'Mochi walks around furniture with real pathfinding and hops up onto the bed, sofa, basket and cat tower',
  'When Mochi is hungry she waits by her bowl and meows',
  'Mochi gets the 3 AM zoomies if Misa is still up very late',
  'Mochi\'s care menu: pet, give a treat, play with the feather wand, brush, snap a photo or take her for a walk',
  'Harness walks after bond event 4: Mochi follows Misa to every map in a red harness',
  'People in town react when they see Mochi on her harness walk',
  'Mochi pose album: 20 poses to photograph, from Sunbather to Thunder hideout',
]);
