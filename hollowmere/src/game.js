// Hollowmere: the game object. It owns the renderer, the physics world, the level, the people
// and the player, runs the frame loop, and holds the rules that tie them together: noise and
// alarms, line of sight, light and shadow, day and night.
import * as E from '../../engine/index.js';
import { PixelDisplay, internalSize } from './pixel.js';
import { buildLevel } from './level/index.js';
import { Clock } from './clock.js';
import { Audio } from './audio.js';
import { Squad } from './squad.js';
import { Quests } from './quests.js';
import { Progress } from './progress.js';
import { Reputation } from './reputation.js';
import { Tools } from './tools.js';
import { Weather } from './weather.js';
import { Status } from './status.js';
import { Traps } from './traps.js';
import { Lockdown } from './lockdown.js';
import { Lamps } from './lamps.js';
import { Lantern } from './lantern.js';
import { Hunters } from './hunters.js';
import { Foraging } from './foraging.js';
import { Contracts } from './contracts.js';
import { Codex } from './codex.js';
import { Stealth } from './stealth.js';
import { Fishing } from './fishing.js';
import { Mining, Smith } from './mining.js';
import { Jail } from './jail.js';
import { Shrines } from './shrines.js';
import { Options } from './options.js';
import { Fauna } from './fauna.js';
import { Horse } from './horse.js';
import { Caravan } from './caravan.js';
import { Treasure } from './treasure.js';
import { Hideout } from './hideout.js';
import { Encounters } from './encounters.js';
import { Boss } from './boss.js';
import { Gear } from './gear.js';
import { Events } from './events.js';
import { Saves } from './saves.js';
import { WorldMap } from './worldmap.js';
import { regionAt, inCryptRect } from './level/wilds.js';
import { Player } from './player.js';
import { NPC } from './npc.js';
import { buildRoster } from './roster.js';
import { UI } from './ui.js';
import { Story } from './story.js';
import { installInteractionMethods } from './interact.js';
import { installFx, installFxMethods } from './fx.js';

const hyp = Math.hypot;
const $ = (id) => document.getElementById(id);

export class Game {
  constructor() {
    this.mode = 'boot'; this.time = 0; this.frame = 0; this.combatT = 0; this.alarmLevel = 0; this.alarmT = 0;
    this.pixelHeight = 270;
    // ---- renderer: the engine draws into a small hidden canvas that the pixel pass displays
    this.stage = $('stage'); this.out = $('screen');
    const [w, h] = internalSize(this.pixelHeight);
    this.stage.style.cssText = `position:fixed;left:-9999px;top:0;width:${w}px;height:${h}px`;
    try { this.renderer = new E.Renderer(this.stage, { pixelRatio: 1, msaa: 0, preserveDrawingBuffer: true, shadowSize: 2048 }); } catch (e) { $('fatal').hidden = false; $('fatal').textContent = 'Hollowmere needs WebGL2. ' + e.message; throw e; }
    this.pix = new PixelDisplay(this.out, this.stage);
    const st = this.renderer.settings;
    st.bloom = true; st.bloomStrength = 0.32; st.bloomThreshold = 0.9; st.vignette = 0.42; st.grain = 0; st.aberration = 0; st.sharpen = 0; st.fxaa = false;
    st.ssao = true; st.ssr = false; st.contactShadows = false; st.godRays = true; st.volumetrics = true; st.saturation = 1.05; st.contrast = 1.06;
    this.scene = new E.Scene(); this.env = this.scene.environment;
    this.world = new E.PhysicsWorld({ iterations: 8, substeps: 2 });
    this.camera = new E.Camera(); this.camera.near = 0.03; this.camera.far = 280; this.baseFov = 74 * E.DEG; this.camera.fov = this.baseFov;
    this.clock = new Clock(19.3, 140);
    this.sfx = new Audio();
    this.squad = new Squad(this);
    this.quests = new Quests(this);
    this.gear = new Gear(this);
    this.smith = new Smith(this);
    this.jail = new Jail(this);
    this.status = new Status(this);
    this.lockdown = new Lockdown(this);
    this.hunters = new Hunters(this);
    this.contracts = new Contracts(this);
    this.codex = new Codex(this);
    this.progress = new Progress(this);
    this.rep = new Reputation(this);
    this.tools = new Tools(this);
    this.weather = new Weather(this);
    this.events = new Events(this);
    this.saves = new Saves(this);
    this.opts = new Options(this);
    this.difficulty = 1;
    this.input = { keys: new Set(), pressed: new Set(), dYaw: 0, dPitch: 0 };
    this.checkpoint = [0, 0.1, -40];
    this.indoorK = 0; this.areaName = 'The Road';
    this.pathBudget = 3;
    this.toastQ = []; this.savables = {}; this.markers = [];
    this.stats = { kills: 0, guardKills: 0, civKills: 0, stabs: 0, deaths: 0, looted: 0, opened: 0, alarms: 0, snuffed: 0, seen: 0 };
  }
  // build the world in slices, so the loading screen can animate (roughly 3 s of work)
  async build(progress = () => {}) {
    const t0 = performance.now(), tick = () => new Promise((r) => requestAnimationFrame(() => r()));
    progress(0.02, 'Raising Ashgate');
    await tick();
    this.level = buildLevel({ scene: this.scene, world: this.world });
    this.nav = this.level.nav; this.decor = this.level.decor;
    this.wmap = new WorldMap(this);
    this.fauna = new Fauna(this);
    this.horse = new Horse(this);
    this.treasure = new Treasure(this); this.hideout = new Hideout(this); this.encounters = new Encounters(this); this.boss = new Boss(this);
    this.caravan = new Caravan(this); this.markers.push(this.caravan, this.horse);
    this.level.trapSpots ||= [];
    this.traps = new Traps(this);
    this.stealth = new Stealth(this);
    this.fishing = new Fishing(this); this.mining = new Mining(this); this.shrines = new Shrines(this);
    this.lamps = new Lamps(this);
    this.forage = new Foraging(this);
    installFx(this);
    this.ui = new UI(this); this.story = new Story(this);
    this.world.on('contact', (e) => this.onContact(e));
    progress(0.25, 'Stitching the arms');
    await tick();
    this.player = new Player(this, [0, 0.1, -46]);
    this.lantern = new Lantern(this);
    this.progress.applyMods();
    this.npcs = [];
    const roster = buildRoster();
    for (let i = 0; i < roster.length; i++) {
      this.npcs.push(new NPC(this, roster[i]));
      if (i % 4 === 3) { progress(0.35 + 0.6 * (i / roster.length), 'Waking the townsfolk'); await tick(); }
    }
    this.player.yaw = 0;
    for (const n of this.npcs) n.snapToSchedule();
    this.setupTeleports();
    this.gatesOpen = true;
    this.updateGates(true);
    this.dynBodies = this.world.bodies.filter((b) => b.isDynamic && b.userData.kind === 'prop');
    progress(1, 'Ready');
    this.log(`built in ${(performance.now() - t0).toFixed(0)} ms: ${this.world.bodies.length} bodies, ${this.level.lights.length} lights, ${this.npcs.length} people`);
  }
  reg(key, mod) { this.savables[key] = mod; }
  log(...a) { if (this.debug) console.log('[hollowmere]', ...a); }

  // ------------------------------------------------------------ resize
  resize() {
    const [w, h] = internalSize(this.pixelHeight);
    this.stage.style.width = w + 'px'; this.stage.style.height = h + 'px';
  }

  // ------------------------------------------------------------ frame
  step(dt) {
    if (this.hitStop > 0) { this.hitStop -= dt; dt *= 0.12; } else if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.45; }
    this.time += dt; this.frame++;
    const P = this.player;
    this.pathBudget = 3;
    const playing = this.mode === 'play';
    const cut = this.mode === 'cutscene';
    if (this.input && playing) P.update(dt, this.input); else if (this.input) { this.input.dYaw = this.input.dPitch = 0; this.input.pressed.clear(); }
    if (playing || cut) this.clock.update(dt);
    this.combatT = Math.max(0, this.combatT - dt);
    if (playing && P.hp < P.maxHp * 0.3 && !P.dead) { this.hbT = (this.hbT || 0) - dt; if (this.hbT <= 0) { this.hbT = 0.9; this.sfx.heartbeat?.(); this.pix.hurt = Math.max(this.pix.hurt, 0.3); } }
    this.alarmT = Math.max(0, this.alarmT - dt); if (this.alarmT === 0 && this.alarmLevel > 0) this.alarmLevel = Math.max(0, this.alarmLevel - dt * 0.05);
    this.updateEnvironment(dt);
    this.updateLevel(dt);
    this.updateNpcs(dt);
    this.squad.update(dt);
    this.updateLazy(dt);
    this.quests.update(dt);
    this.tools.update(dt);
    this.status.update(dt);
    this.traps?.update(dt);
    this.opts.tick(dt); this.stealth.update(dt); this.jail.update(dt); this.lockdown.update(dt); this.lamps.update(dt); this.lantern.update(dt); this.hunters.update(dt); this.forage.update(dt); this.codex.update(dt); this.fauna?.update(dt); this.horse?.update(dt); this.caravan?.update(dt); this.encounters?.update(dt); this.boss?.update(dt);
    if (this.player.mod?.regen && this.player.hp < this.player.maxHp && this.combatT <= 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.mod.regen * dt);
    this.weather.update(dt);
    this.events.update(dt);
    this.wmap.update(dt);
    this.saves.tick(dt);
    this.rep.update(dt);
    this.world.step(dt);
    this.updateProps(dt);
    this.story.update(dt);
    this.updateFx(dt);
    if (playing) { this.updateInteraction(dt); P.updateView(this.camera, dt, this.baseFov); }
    else if (cut) { P.vm.visible = false; this.story.cameraUpdate(this.camera, dt); }
    else if (this.mode === 'menu') this.titleCamera(dt);
    P.vm.update?.(dt); this.vmUpdate(dt);
    // listener & music
    this.sfx.setListener(this.camera.position, P.yaw);
    this.sfx.mood.tension = Math.min(1, (this.combatT > 0 ? 0.8 : 0) + this.alarmLevel * 0.25 + this.maxAlert() * 0.6);
    { let nf = 0; const c = this.camera.position; for (const f of this.level.fires) { if (!f.lit) continue; const d = Math.hypot(f.x - c[0], f.z - c[2]); if (d < 14) nf = Math.max(nf, 1 - d / 14); } this.sfx.mood.fire = nf; }
    this.sfx.mood.indoor = this.indoorK > 0.5 ? 1 : 0; this.sfx.mood.night = this.clock.night ? 1 : 0;
    this.sfx.mood.area = this.area();
    this.sfx.update(dt);
    this.ui.update(dt);
  }
  vmUpdate(dt) { const P = this.player; if (this.mode === 'play' || this.mode === 'dead') { P.vm.update(dt); } }
  render(dt) {
    const cam = this.camera;
    const lines = this.tracerLines();
    this.pix.hurt = Math.max(0, this.pix.hurt - dt * 3) * (this.player?.hp < 25 ? 1 : 1);
    if (this.player?.hp < 30 && this.mode === 'play') this.pix.hurt = Math.max(this.pix.hurt, 0.25 + 0.15 * Math.sin(this.time * 6));
    this.pix.veil += ((this.player?.veilT > 0 ? 1 : 0) - this.pix.veil) * Math.min(1, dt * 4);
    this.env.shadowCenter = [cam.position[0], 1, cam.position[2]];
    this.renderer.render(this.scene, cam, { background: 'sky', particles: [this.smoke, this.flames, this.sparks, ...(this.fx3 || [])], lines: lines.length ? [{ data: new Float32Array(lines) }] : undefined, shadows: true });
    this.pix.present(dt);
  }

  // ------------------------------------------------------------ day & night, interiors
  updateEnvironment(dt) {
    const env = this.env, P = this.player, cam = this.camera;
    E.applyTimeOfDay(env, this.clock.hours);
    const c = this.mode === 'play' ? P.pos : cam.position;
    const ind = this.nav.indoorAt(c[0], c[2]);
    this.indoorK += ((ind ? 1 : 0) - this.indoorK) * Math.min(1, dt * 3);
    const under = ind === 2 ? 1 : 0;
    const k = this.indoorK;
    env.ambient = Math.max(env.ambient, env.night > 0.4 ? 0.62 : 0) * (1 - 0.42 * k) * (1 + 0.25 * under);
    env.exposure *= 1.12 * (this.opts?.v.bright ?? 1);
    env.sunIntensity *= 1 - 0.55 * k;
    env.fogDensity = 0.011 * (1 - k * 0.5) + (this.clock.night ? 0.004 : 0); env.fogHeight = 0.3 * (1 - k);
    env.godRays *= 1 - k; env.volumeDensity = 0.03 * (1 - k * 0.5);
    if (this.clock.night) env.exposure *= 1.06;
    if (this.status.has('night')) { env.ambient = Math.max(env.ambient, 0.95); env.exposure *= 1.18; }
    E.setNightLights(this.level.pal, env.night);
    this.weather.apply(env);
    env.shadowRadius = 26; env.shadowFar = 90;
  }
  area() {
    const p = this.mode === 'play' ? this.player.pos : this.camera.position;
    if (inCryptRect(p[0], p[2])) return 'crypt';
    const rg = regionAt(p[0], p[2]); if (rg && (p[2] < 6 || p[0] < -58 || p[0] > 140)) return rg.id;
    if (p[2] > 92 && Math.abs(p[0]) < 38) return this.nav.indoorAt(p[0], p[2]) ? 'keep' : 'keep';
    return 'town';
  }
  // is the light at this point bright enough to be seen in? 0..1
  lightAt(x, y, z) {
    const env = this.env, ind = this.nav.indoorAt(x, z);
    let a = env.sunUp ? 0.5 * Math.min(1, env.sunIntensity / 3) : 0.07 + 0.05 * (env.moonDirection ? 1 : 0);
    if (env.sunUp && env.night < 0.5) a = Math.max(a, 0.5);
    a *= ind === 2 ? 0.1 : ind ? 0.32 : 1;
    let s = 0;
    for (const l of this.level.lights) {
      if (l.intensity <= 0.2) continue;
      const dx = l.position[0] - x, dy = l.position[1] - y, dz = l.position[2] - z, d2 = dx * dx + dy * dy + dz * dz, R = l.range;
      if (d2 > R * R) continue;
      const d = Math.sqrt(d2), f = 1 - d / R;
      s += (l.intensity / 12) * f * f / (1 + d2 * 0.18);
    }
    return Math.min(1, a + s);
  }

  // ------------------------------------------------------------ the world's state
  updateLevel(dt) {
    const L = this.level, actors = [];
    if (this.player) actors.push(this.player.pos);
    for (const n of this.npcs) if (!n.dead && n.dist < 12) actors.push([n.x, n.y, n.z]);
    L.updateDoors(dt, actors);
    // gates: open by day, barred from 22:00 to 05:30
    const wantOpen = !this.clock.between(22, 5.5) && this.alarmLevel < 1.5 && !this.lockdown?.active;
    if (wantOpen !== this.gatesOpen) { this.gatesOpen = wantOpen; this.updateGates(false); }
    if (L.portcullis) L.portcullis.update(dt);
    for (const f of L.fires) { f.phase += dt; }
    // torch flicker & flames
    const P = this.player.pos;
    for (const t of L.torches) {
      const d = hyp(t.x - P[0], t.z - P[2]);
      if (d > 45) continue;
      t.phase += dt * 9;
      if (t.lit) {
        const fl = 0.85 + 0.15 * Math.sin(t.phase * 1.3) + 0.08 * Math.sin(t.phase * 3.7 + t.x);
        if (t.flame) { t.flame.scale.set([fl, 0.9 + fl * 0.3, fl]); }
        if (t.flames) for (const f of t.flames) f.scale.set([fl, fl, fl]);
        t.light.intensity = t.base * (this.indoorAt(t) ? 1 : 1);
        if (d < 26 && Math.random() < dt * (t.small ? 6 : 14)) this.flames.emit([t.x, t.y + (t.kind === 'chandelier' ? 0.2 : 0.02), t.z], { count: 1, color: [3.2, 1.6, 0.5, 0.5], colorEnd: [0.9, 0.12, 0.03, 0.15], size: t.small ? 0.03 : 0.07, grow: 0.5, spread: 0.02, up: 0.5, buoyancy: 1.5, life: 0.5, jitter: 0.03 });
      } else if (t.relightT !== undefined) { t.relightT -= dt; }
    }
    for (const f of L.fires) {
      if (!f.lit) continue;
      const d = hyp(f.x - P[0], f.z - P[2]);
      if (d > 45) continue;
      const fl = 0.86 + 0.14 * Math.sin(f.phase * 9 + f.x) + 0.08 * Math.sin(f.phase * 23);
      f.light.intensity = f.base * fl;
      if (d < 34) {
        const n = Math.min(4, 30 * dt * (f.r + 0.4) + Math.random());
        for (let i = 0; i < n; i++) this.flames.emit([f.x, f.y + 0.1, f.z], { count: 1, color: Math.random() > 0.6 ? [3.4, 2.4, 1.0, 0.6] : [2.8, 1.2, 0.3, 0.55], colorEnd: [0.9, 0.12, 0.03, 0.2], size: 0.16 * (f.r + 0.5), grow: 0.4, spread: f.r * 0.5, up: 0.7, buoyancy: 2.6, life: 0.7, jitter: f.r * 0.6 });
        if (Math.random() < dt * 4) this.smoke.emit([f.x, f.y + 0.6, f.z], { count: 1, color: [0.18, 0.17, 0.17, 0.35], colorEnd: [0.3, 0.3, 0.3, 0.05], size: 0.12, grow: 4, spread: 0.1, up: 0.7, buoyancy: 0.6, life: 3.5, jitter: 0.1 });
        if (Math.random() < dt * 3) this.sparks.emit([f.x, f.y + 0.3, f.z], { count: 1, color: [5, 3, 1.2, 1], colorEnd: [2, 0.5, 0.1, 0.4], size: 0.014, grow: 0.5, spread: 0.5, up: 1.6, buoyancy: 1.2, life: 1.2, jitter: 0.1 });
      }
    }
    if (this.level.cage) { /* the gibbet sways on its own */ }
    this.updateChests(dt);
  }
  indoorAt(t) { return t.indoor; }
  updateGates(instant) {
    const L = this.level;
    const open = this.gatesOpen;
    for (const [a, b] of [L.gates]) for (const d of [a, b]) { if (!d) continue; if (open) { d.hold = true; d.locked = false; d.part.set(d.hinge === 'a' ? -100 : 100); } else { d.part.set(0); d.locked = true; } if (instant) d.part.snap(open ? (d.hinge === 'a' ? -100 : 100) : 0); }
    // nav: a closed gate blocks people
    const nav = this.nav;
    if (open) nav.clear(-4, 10, 4, 12); else nav.block(-4, 10, 4, 12, 1);
    if (L.portcullis) { L.portcullis.set(open); if (open) nav.clear(-3, 93, 3, 95); else nav.block(-3, 93, 3, 95, 1); }
    if (!instant) { this.sfx.hornShort?.(); this.ui.toast(open ? 'The gates of Ashgate open' : 'The gates of Ashgate are barred for the night'); }
  }
  updateChests(dt) {
    for (const c of this.level.containers) {
      if (c.lid && c.opened && c.lidAngle > -100) { c.lidAngle = Math.max(-105, c.lidAngle - dt * 260); E.quat.fromEuler(c.lid.rotation, c.lidAngle, 0, 0); }
    }
  }
  updateNpcs(dt) {
    const P = this.player.pos;
    for (const n of this.npcs) {
      n.dist = hyp(n.x - P[0], n.z - P[2]);
      if (n.dead) { n.update(dt); continue; }
      const near = n.dist < 60 || n.state === 'chase' || n.state === 'attack';
      if (near) {
        n.acc = 0;
        n.update(dt); n.setVisible(true);
        if ((this.frame + n.ch.id) % 12 === 0) n.setLod(n.dist < 15 ? 0 : n.dist < 42 ? 1 : 2);
        if (n.dist < 24 || (this.frame + n.ch.id) % 2 === 0) n.ch.update(n.dist < 24 ? dt : dt * 2);
      } else {
        n.acc = (n.acc || 0) + dt;
        const step = n.dist < 120 ? 0.25 : 1;
        n.setVisible(false);
        if (n.acc >= step) { n.update(n.acc); n.acc = 0; }
      }
    }
  }
  // streamed static colliders: forests and fences only exist as physics bodies near the player
  updateLazy(dt) {
    this.lazyT = (this.lazyT || 0) - dt; if (this.lazyT > 0 || !this.level.lazy) return; this.lazyT = 0.2;
    const c = this.mode === 'play' || this.mode === 'talk' ? this.player.pos : this.camera.position;
    for (const it of this.level.lazy) {
      const d = Math.max(Math.abs(it.cx - c[0]), Math.abs(it.cz - c[2]));
      if (!it.body && d < 42) { const [x0, y0, z0, x1, y1, z1, kind] = it.a; it.body = new E.Body({ shape: new E.Box([(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2]), type: 'static', position: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], friction: 0.7 }); it.body.userData.kind = kind; this.world.add(it.body); }
      else if (it.body && d > 58) { this.world.remove(it.body); it.body = null; }
    }
  }
  keepPlaying() { this.ui.el.end.hidden = true; this.mode = 'play'; this.ui.showHud(true); this.ui.letterbox(false); this.pix.fade = 0; this.canvasLock?.(); this.ui.toast('The valley is yours to wander. F5 saves.'); }
  flashText(t) { this.ui.flashBanner(t, 900, true); }
  updateProps(dt) {
    for (const b of this.dynBodies) {
      if (b.userData.thrown > 0) b.userData.thrown -= dt;
      if (b.position[1] < -5 && !b.userData.fellOut) { b.setPosition(b.userData.home); b.velocity = [0, 0, 0]; }
    }
    if (this.level.cage && this.level.cage.sleeping) this.level.cage.wake();
  }
  maxAlert() { let m = 0; for (const n of this.npcs) if (n.guard && !n.dead && n.dist < 40) m = Math.max(m, n.state === 'chase' || n.state === 'attack' ? 1 : n.alert * 0.7); return m; }

  // ------------------------------------------------------------ noise, alarms, sight
  noise(pos, radius, kind, src = null) {
    const p = [pos[0], pos[1] ?? 0, pos[2]]; radius *= this.stealth ? this.stealth.noiseMask(p, kind) : 1;
    for (const n of this.npcs) {
      if (n.dead || n === src) continue;
      if (Math.abs(n.x - p[0]) > radius || Math.abs(n.z - p[2]) > radius) continue;
      n.hear(p, radius, kind, src);
    }
    if (src === null || src === undefined || src === this.player) this.fauna?.hear(p, radius, kind);
  }
  alarm(pos, kind, src) {
    const p = [pos[0], pos[1] ?? 0, pos[2]];
    let count = 0;
    for (const n of this.npcs) {
      if (!n.guard || n.dead || n === src) continue;
      const d = hyp(n.x - p[0], n.z - p[2]);
      if (d > (kind === 'spotted' || kind === 'combat' ? 42 : 28)) continue;
      count++;
      if (n.state === 'chase' || n.state === 'attack') continue;
      n.alert = Math.max(n.alert, 0.75); n.stim = [p[0], p[2]]; n.stimKind = kind;
      if (kind === 'spotted' && d < 20) { n.lastSeen = p; }
      if (n.state === 'routine' || n.state === 'notice' || n.state === 'search') { n.state = 'investigate'; n.investT = 22; n.stopMove(); if (n.lying) { n.leaveActivity(); n.lying = false; n.asleep = false; } n.goTo(p[0], p[2], 2.8); n.bark(['To arms!', 'This way!', 'Intruder in the keep!', 'Find him!'][Math.floor(Math.random() * 4)]); }
    }
    this.alarmLevel = Math.min(3, this.alarmLevel + (kind === 'spotted' ? 0.6 : kind === 'body' ? 0.9 : 0.25));
    this.alarmT = 25; this.combatT = Math.max(this.combatT, 4);
    if (kind === 'body' || (kind === 'spotted' && this.alarmLevel > 1.2)) this.sfx.alarmBell?.(pos);
    if (this.alarmLevel > 1.4 && !this._alarmShown) { this._alarmShown = true; this.ui.flashBanner('THE ALARM IS RAISED'); setTimeout(() => (this._alarmShown = false), 30000); }
  }
  canSee(from, to, ignoreBody = null) {
    const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2], d = Math.hypot(dx, dy, dz);
    if (d < 0.01) return true;
    const ignore = this._sightIgnore || (this._sightIgnore = new Set());
    ignore.clear(); if (ignoreBody) ignore.add(ignoreBody); ignore.add(this.player.cc.body);
    const h = this.world.raycast(from, [dx / d, dy / d, dz / d], d, { ignore, mask: 0xffff & ~(2 | 4 | 8) });
    return !h || h.distance > d - 0.45;
  }
  nearNpcs(n, r) { const out = []; for (const o of this.npcs) { if (o === n || o.dead) continue; if (Math.abs(o.x - n.x) < r && Math.abs(o.z - n.z) < r) out.push(o); } return out; }
  zoneBonus(npc, P) { const z = this.nav.zone[Math.max(0, this.nav.at(P.pos[0], P.pos[2]))] || 0; return z >= 1 && this.clock.night && npc.role !== 'villager'; }
  hitNpc(n, dmg, dir, opts) {
    const before = n.hp, res = n.takeHit(dmg, dir, opts);
    const at = [n.x, n.y + 1.2, n.z];
    if (res === 'blocked') return res;
    if (res === 'ko') { this.stats.ko = (this.stats.ko || 0) + 1; this.ui.hitMarker(); this.sfx.thud?.(0.7, n.pos); this.flashText?.('KNOCKED OUT'); this.progress.addXp(10, 'knockout'); return res; }
    this.sfx.slash?.(n.pos); this.spawnBlood(at, dir, res === 'killed' ? 26 : 12);
    if (opts.from === 'player' && res !== 'dead') this.ui.floater?.(dmg >= 900 ? 'KILL' : Math.round(dmg), [n.x, n.y + 1.9, n.z], res === 'killed' ? '#ff5a5a' : '#ffe9a8');
    if (opts.from === 'player' && res !== 'dead' && !n.guard && n.role !== 'bandit' && n.role !== 'hollow') this.rep.crime(res === 'killed' ? 'murder' : 'assault', n.pos, { victim: n });
    if (opts.backstab) { this.flashText?.('ASSASSINATION'); this.stats.stabs++; this.slowmo = 0.35; }
    this.hitStop = Math.max(this.hitStop || 0, res === 'killed' ? 0.09 : 0.045); this.shake = Math.max(this.shake, res === 'killed' ? 0.35 : 0.15);
    this.ui.hitMarker();
    if (res !== 'dead') { this.combatT = Math.max(this.combatT, 5); if (!opts.backstab) this.noise(n.pos, 12, 'combat', n); this.player.kick = 0.02; }
    void before; return res;
  }
  onKill(n, opts) {
    this.stats.kills++; if (n.guard) this.stats.guardKills++; else this.stats.civKills++;
    this.story.onKill(n, opts);
    if (n.id === 'cael') for (const o of this.npcs) if (o.role === 'bandit' && !o.dead && o.dist < 90 && o.state !== 'retreat') { o.def.brave = false; o.state = 'retreat'; o.retreatT = 14; o.repathT = 0; o.stopMove(); o.bark('The chief is dead! Run!'); }
    this.streak = (this.time - (this.streakAt || -99) < 9 ? this.streak + 1 : 1); this.streakAt = this.time; if (this.streak >= 3) { this.flashText('×' + this.streak + ' STREAK'); this.progress.addXp(this.streak * 3, ''); }
    { const P = this.player, m = P.mod || {}; let xp = n.role === 'hollow' ? 30 : n.role === 'bandit' ? 28 : n.guard ? 22 : 0;
      if (xp && opts.backstab) xp += 12 + 8 * (m.cutthroat || 0); if (xp && opts.poison) xp += 6;
      if (opts.fire) this.stats.fireKills = (this.stats.fireKills || 0) + 1; if (opts.poison && !opts.bleedOnly) this.stats.poisonKills = (this.stats.poisonKills || 0) + 1;
      if (xp) this.progress.addXp(xp, opts.backstab ? 'assassination' : opts.poison ? 'poisoned' : opts.fire ? 'burned' : 'kill');
      if (m.leech && !opts.poison && !opts.fire) P.hp = Math.min(P.maxHp, P.hp + m.leech); if (m.leechE) P.ember = Math.min(P.maxEmber, P.ember + m.leechE); }
    for (const o of this.nearNpcs(n, 14)) if (!o.guard) o.scare(n.pos, 14);
  }
  playerDied() { this.mode = 'dead'; this.stats.deaths++; this.sfx.boom?.(0.6); this.ui.showDeath(); setTimeout(() => this.respawn(), 3800); }
  respawn() {
    const P = this.player; this.horse?.forceReset(); this.boss?.reset();
    if (this.jail.shouldArrest() && this.jail.arrest()) { this.mode = 'play'; this.ui.hideDeath(); return; }
    P.dead = false; P.hp = P.maxHp; P.stamina = 100; P.ember = Math.max(P.ember, 40); P.atk = null; P.carried = null; P.veilT = 0;
    P.cc.position = [...this.checkpoint]; P.cc.velocity = [0, 0, 0]; P.yaw = this.checkpointYaw ?? 0; P.pitch = 0; P.invuln = 2;
    if (P.crouch) P.setCrouch(false);
    for (const n of this.npcs) if (n.guard && !n.dead) { n.state = 'routine'; n.alert = 0; n.atk = null; n.slotKey = ''; n.stopMove(); n.stagger = 0; }
    this.alarmLevel = 0; this.combatT = 0; this.mode = 'play'; this.ui.hideDeath();
    P.inv.gold = Math.floor(P.inv.gold * 0.85);
    this.ui.toast('You wake, aching, at your last safe place');
  }
  setCheckpoint(pos, yaw = 0) { this.checkpoint = [pos[0], pos[1] ?? 0.1, pos[2]]; this.checkpointYaw = yaw; if (this.mode === 'play' && this.time - (this.lastSave || -99) > 25 && this.combatT <= 0) { this.lastSave = this.time; this.saves.save('auto'); } }
  titleCamera(dt) {
    const t = this.time * 0.05;
    this.camera.position.set([Math.sin(t) * 5, 4.2 + Math.sin(t * 0.7) * 0.5, -38 + Math.cos(t * 0.8) * 3]);
    this.camera.target.set([2 + Math.sin(t * 0.6) * 4, 6, 60]);
    this.camera.up.set([0, 1, 0]);
  }
}

installFxMethods(Game);
installInteractionMethods(Game);
