// The three tutorials (Basics, Attack, Defense): ordinary rounds with passive bots and a list of
// steps. Each step watches what the player does through sim events and per-frame sampling.
import { STAND, CROUCH, PRONE } from '../sim/actor.js';
import { wrapAngle } from '../sim/util.js';

const S = (text, test) => ({ text, test });

export const TUTORIALS = {
  basic: {
    title: 'Basics', team: 'atk', op: 'hammer', primary: 'm4a1', secondary: 'compact', gadget2: 'stun', level: 0, prep: 1, action: 3600, site: 0, spawn: 'south',
    passive: { atk: true, def: true }, pin: 120,
    steps: [
      S('Look around with the mouse (or the arrow keys).', (t) => t.yaw > 1.6),
      S('Move with W A S D. Walk about eight metres.', (t) => t.dist > 8),
      S('Hold Shift while moving forward to sprint.', (t) => t.sprinted),
      S('Press C to crouch and Z to go prone. Try both.', (t) => t.stances.has(CROUCH) && t.stances.has(PRONE)),
      S('Lean around a corner: Q to the left and E to the right.', (t) => t.leans.has(-1) && t.leans.has(1)),
      S('Hold the right mouse button to aim down the sights.', (t) => t.ads),
      S('Head into the building and shoot a defender (left mouse). Aim for the head.', (t) => t.kills >= 1),
      S('Press R to reload your weapon.', (t) => t.reloaded),
      S('Walk up to a door and press F to open it.', (t) => t.doorOpened),
      S('Get to a bomb site marker on the floor and hold F to plant the defuser.', (t) => t.planted),
    ],
  },
  attack: {
    title: 'Attack', team: 'atk', op: 'hammer', primary: 'm4a1', secondary: 'compact', gadget2: 'stun', level: 0, prep: 40, action: 180, site: 1, spawn: 'south',
    passive: { def: true }, release: 'action',
    steps: [
      S('During preparation, press X to launch your drone.', (t) => t.droneView),
      S('Fly the drone in and press T (or click) to mark a defender.', (t) => t.tagged),
      S('Press X to leave the drone. When preparation ends, push towards the building.', (t) => t.action),
      S('Break through a wall or window: shoot a window, or press V with the sledgehammer on a soft wall.', (t) => t.breaks >= 1),
      S('Reach the bomb site and hold F on the marker to plant the defuser.', (t) => t.planted),
      S('Protect the defuser until it detonates. Kill anyone who tries to disable it.', (t) => t.won),
    ],
  },
  defense: {
    title: 'Defense', team: 'def', op: 'anvil', primary: 'mpk', secondary: 'magnum', gadget2: 'barbwire', level: 0, prep: 60, action: 180, site: 0, spawn: 'south',
    passive: { atk: true, def: true }, release: 'action',
    steps: [
      S('Look at a wall and hold F to reinforce it. Reinforce two walls.', (t) => t.reinforced >= 2),
      S('Look at a door or window and hold F to barricade it.', (t) => t.barricaded >= 1),
      S('Press 4 to equip your barbed wire and click to place it near a door.', (t) => t.placed >= 1),
      S('Preparation ends soon. Hold the site and eliminate an attacker.', (t) => t.kills >= 1),
      S('Keep going: stop them from planting, or disable the defuser if they do.', (t) => t.lost === false && t.over),
    ],
  },
};

export class Tutorial {
  constructor(id, app) {
    this.id = id; this.def = TUTORIALS[id]; this.app = app; this.i = 0; this.wait = 0; this.done = false; this.doneT = 0;
    this.t = { yaw: 0, dist: 0, sprinted: false, stances: new Set(), leans: new Set(), ads: false, kills: 0, reloaded: false, doorOpened: false, planted: false, droneView: false, tagged: false, action: false, breaks: 0, reinforced: 0, barricaded: 0, placed: 0, won: false, lost: false, over: false };
    this.view = { title: this.def.title, steps: this.def.steps, i: 0 };
  }
  attach(game) {
    this.game = game; const sim = game.sim, me = game.playerActor, t = this.t; this.sim = sim; this.me = me;
    if (this.def.passive) sim.passive = { ...this.def.passive };
    this.lastYaw = me.yaw; this.lastPos = [...me.pos];
    sim.on('reload', (e) => { if (e.actor === me) t.reloaded = true; });
    sim.on('door', (e) => { if (e.open) t.doorOpened = true; });
    sim.on('planted', (e) => { if (e.actor === me) t.planted = true; });
    sim.on('ping', (e) => { if (e.actor === me && e.enemy) t.tagged = true; });
    sim.on('panelbreak', () => { if (sim.round.phase === 'action') t.breaks++; });
    sim.on('reinforce', (e) => { if (e.actor === me) t.reinforced++; });
    sim.on('barricade', (e) => { if (e.by === me) t.barricaded++; });
    sim.on('place', (e) => { if (e.actor === me) t.placed++; });
    sim.on('death', (e) => { if (e.killer === me && e.actor.team !== me.team) t.kills++; });
    sim.on('phase', () => { t.action = true; if (this.def.release === 'action') sim.passive = {}; });
    sim.on('roundend', (e) => { t.over = true; t.won = e.winner === me.team; t.lost = e.winner !== me.team; });
    this.app.hud.setTutorial(this.view);
  }
  update(dt) {
    const sim = this.sim, me = this.me, t = this.t, p = this.game.player; if (!sim || !me) return;
    if (this.def.pin && sim.round.phase !== 'end') sim.round.t = Math.max(sim.round.t, this.def.pin);
    // sample the player
    t.yaw += Math.abs(wrapAngle(me.yaw - this.lastYaw)); this.lastYaw = me.yaw;
    t.dist += Math.hypot(me.pos[0] - this.lastPos[0], me.pos[2] - this.lastPos[2]); this.lastPos = [...me.pos];
    if (me.sprinting) t.sprinted = true;
    t.stances.add(me.stance); if (Math.abs(me.lean) > 0.6) t.leans.add(Math.sign(me.lean)); if (me.ads > 0.85) t.ads = true;
    if (p && p.view === 'drone') t.droneView = true;
    void STAND;
    if (this.done) { this.doneT += dt; return; }
    const step = this.def.steps[this.i];
    if (step && step.test(t)) { this.wait += dt; if (this.wait > 0.7) { this.wait = 0; this.i++; this.view.i = this.i; this.app.audio.ui('confirm'); if (this.i >= this.def.steps.length) this.finish(); } } else this.wait = 0;
    // the last step of the defence tutorial also ends when the round does
    if (!step && !this.done) this.finish();
  }
  finish() {
    if (this.done) return; this.done = true; this.doneT = 0; this.view.i = this.def.steps.length;
    this.app.tutorialDone(this.id);
  }
}
