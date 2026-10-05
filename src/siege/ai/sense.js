// What a bot knows: vision with a field of view and a build-up of awareness, hearing that is
// muffled by every wall in the way, short memories that fade, and callouts shared by teammates.
import { CAST } from '../world/grid.js';
import { clamp, dist3, norm, sub, len, dot, dirOf, wrapAngle, yawOf } from '../sim/util.js';

export class Sense {
  constructor(brain) {
    this.b = brain; this.a = brain.a; this.sim = brain.a.sim;
    this.mem = new Map(); // enemy id -> { id, pos, vel, t, seen, conf, src, actor }
    this.aware = new Map();
    this.lastNoise = 0; this.vt = Math.random() * 0.12; this.hearingFlag = null;
    this.sightFirst = new Map(); // when a target first became visible (reaction clock)
    this.recentHit = null; this.hitDir = null; this.hitT = -9;
  }
  get prof() { return this.b.prof; }

  update(dt) {
    const now = this.sim.time, a = this.a;
    this.vt -= dt;
    if (this.vt <= 0) { this.vt += 0.1; this.see(0.1, now); }
    this.hear(now);
    for (const [id, m] of this.mem) {
      if (!m.seen && now - m.t > (m.src === 'sound' ? 7 : 22)) this.mem.delete(id);
      else if (m.seen && now - m.t > 0.25) m.seen = false;
      if (m.actor && !m.actor.alive && !m.actor.downed) this.mem.delete(id);
    }
    void a;
  }

  // ---------------------------------------------------------------- vision
  see(dt, now) {
    const a = this.a, w = this.sim.world, eye = a.eye();
    const blind = a.status.blind > 0.4;
    const fwd = a.look(), fovCos = Math.cos(((this.b.inCombat ? 78 : 68) * Math.PI) / 180);
    const prep = this.sim.round.inPrep();
    for (const e of this.sim.actors) {
      if (e.team === a.team || (!e.alive && !e.downed)) continue;
      const head = e.headPos(), chest = e.chestPos(), d = dist3(eye, chest);
      let visible = 0, seenPt = null;
      if (!blind && d < 95 && !prep) {
        const dir = norm(sub(chest, eye)), c = dot(dir, fwd);
        // fully outside the cone: only a lucky glimpse at close range
        const inCone = c > fovCos || (d < 3 && c > -0.2);
        if (inCone) {
          const pts = [[head, 0.4], [chest, 0.4], [[e.pos[0], e.pos[1] + 0.35 * (e.curH / 1.8), e.pos[2]], 0.2]];
          for (const [p, wt] of pts) if (w.visible(eye, p, CAST.GLASS)) { visible += wt; if (!seenPt || wt >= 0.4) seenPt = p; }
        }
      }
      let k = this.aware.get(e.id) || 0;
      if (visible > 0) {
        const sp = Math.hypot(e.vel[0], e.vel[2]);
        let rate = 3.0 * this.prof.vision * (0.3 + visible) * (1.55 - clamp(d / 70, 0, 1));
        if (e.stance === 2) rate *= 0.55; else if (e.stance === 1) rate *= 0.75;
        rate *= sp > 0.5 ? 1.15 : 0.8;
        if (e.status.tag > 0) rate *= 1.4;
        if (!this.sightFirst.has(e.id)) this.sightFirst.set(e.id, now);
        k += rate * dt;
      } else { k = Math.max(0, k - 0.45 * dt); if (k <= 0) this.sightFirst.delete(e.id); }
      this.aware.set(e.id, Math.min(k, 3));
      if (visible > 0 && k >= 1 && now - (this.sightFirst.get(e.id) || now) >= this.prof.reaction * 0.5) {
        const prev = this.mem.get(e.id), pos = seenPt ? [...chest] : [...chest];
        const vel = prev && now - prev.t < 0.6 ? [(pos[0] - prev.pos[0]) / Math.max(0.05, now - prev.t), 0, (pos[2] - prev.pos[2]) / Math.max(0.05, now - prev.t)] : [e.vel[0], 0, e.vel[2]];
        const first = !prev || now - prev.t > 4;
        this.mem.set(e.id, { id: e.id, actor: e, pos, vel, t: now, seen: true, conf: 1, src: 'sight', vis: visible, dist: d, first: prev ? prev.first : now });
        if (first) this.b.onSpot(e, pos);
      } else if (e.status.tag > 0 && !blind) {
        // tagged by a drone, sonar or trap: known but not "seen"
        const prev = this.mem.get(e.id);
        if (!prev || prev.src !== 'sight' || now - prev.t > 1) this.mem.set(e.id, { id: e.id, actor: e, pos: [...chest], vel: [e.vel[0], 0, e.vel[2]], t: now, seen: false, conf: 0.85, src: 'tag' });
      }
    }
  }

  // ---------------------------------------------------------------- hearing
  hear(now) {
    const a = this.a, w = this.sim.world, head = a.headPos();
    if (this.sim.round.inPrep()) { if (this.sim.noises.length) this.lastNoise = this.sim.noises[this.sim.noises.length - 1].id; return; }
    for (const n of this.sim.noises) {
      if (n.id <= this.lastNoise) continue;
      this.lastNoise = n.id;
      if (n.src === a || a.status.deaf > 0.5) continue;
      const mine = n.team === a.team;
      const d = dist3(head, n.pos); let eff = n.loud * this.prof.hearing * (a.status.deaf > 0 ? 0.25 : 1);
      if (d > eff * 1.05) continue;
      // each wall between us eats a chunk of the sound
      if (d > 3) {
        const dir = norm(sub(n.pos, head));
        let cross = 0, o = head, left = d;
        for (let i = 0; i < 4; i++) { const h = w.cast(o[0], o[1], o[2], dir[0], dir[1], dir[2], left, CAST.GLASS | CAST.PROPS); if (!h) break; cross++; left -= h.t + 0.2; o = [h.x + dir[0] * 0.25, h.y + dir[1] * 0.25, h.z + dir[2] * 0.25]; if (left <= 0) break; }
        eff *= Math.pow(0.55, cross); if (d > eff) continue;
      }
      const conf = clamp(1 - d / Math.max(eff, 1), 0.15, 1);
      if (mine) { if (n.kind === 'shot' || n.kind === 'explosion') this.b.onFriendlyFight(n); continue; }
      if (!n.src) continue;
      const err = d * 0.055 * (1.3 - Math.min(1, this.prof.hearing));
      const pos = [n.pos[0] + (Math.random() - 0.5) * 2 * err, n.pos[1], n.pos[2] + (Math.random() - 0.5) * 2 * err];
      const prev = this.mem.get(n.src.id);
      if (!prev || (!prev.seen && now - prev.t > 0.4) || prev.src !== 'sight') {
        this.mem.set(n.src.id, { id: n.src.id, actor: n.src, pos, vel: [0, 0, 0], t: now, seen: false, conf, src: 'sound', kind: n.kind });
      }
      this.b.onHear(n, pos, conf);
    }
  }

  // ---------------------------------------------------------------- team callouts
  learn(entry, from) {
    if (!entry.actor || (!entry.actor.alive && !entry.actor.downed)) return;
    const prev = this.mem.get(entry.id);
    if (prev && prev.seen) return;
    if (prev && prev.t >= entry.t - 0.5) return;
    this.mem.set(entry.id, { ...entry, seen: false, conf: Math.min(entry.conf, 0.8), src: 'team', t: entry.t });
    this.b.onTeamIntel && this.b.onTeamIntel(entry);
    void from;
  }
  hit(src, from) { this.hitT = this.sim.time; this.hitDir = from ? yawOf(from[0] - this.a.pos[0], from[2] - this.a.pos[2]) : null; this.recentHit = src; }

  // ---------------------------------------------------------------- queries
  visibleEnemies() { const out = []; for (const m of this.mem.values()) if (m.seen && m.actor.alive || (m.seen && m.actor.downed)) out.push(m); return out; }
  threat() {
    // the visible enemy that matters most: close, armed, looking at me
    let best = null, bs = -1e9;
    const eye = this.a.eye();
    for (const m of this.mem.values()) {
      if (!m.seen || !m.actor.alive) continue;
      const d = dist3(eye, m.pos), toMe = norm(sub(eye, m.pos)), f = m.actor.look();
      const s = 100 - d + dot(toMe, f) * 12 + (m.actor.shield?.up ? -10 : 0) + (m.actor.downed ? -60 : 0);
      if (s > bs) { bs = s; best = m; }
    }
    return best;
  }
  freshest(maxAge = 12) {
    let best = null;
    for (const m of this.mem.values()) { if (!m.actor.alive && !m.actor.downed) continue; if (this.sim.time - m.t > maxAge) continue; if (!best || m.t > best.t || (m.seen && !best.seen)) best = m; }
    return best;
  }
  // predicted position of a remembered enemy `ahead` seconds from its last sighting
  predict(m, ahead = 0) {
    const t = this.sim.time - m.t + ahead, sp = Math.min(1, t) * 1.0;
    return [m.pos[0] + m.vel[0] * sp * Math.min(t, 1.2), m.pos[1], m.pos[2] + m.vel[2] * sp * Math.min(t, 1.2)];
  }
  forget() { this.mem.clear(); this.aware.clear(); this.sightFirst.clear(); }
}
void len; void dirOf; void wrapAngle;
