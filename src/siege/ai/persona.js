// Who a bot is: a callsign, a playstyle and a handful of habits that make one bot behave unlike the
// next. The archetype comes from the operator's kit (a breacher plays like a breacher, a trapper
// like a trapper); the numbers are nudged per bot, so two roamers still differ.
//
// traits, all 0..1:
//   aggr      how readily it pushes, chases a lost enemy and takes a duel
//   caution   pre-aims corners, waits for a partner, slices doorways
//   curious   investigates sounds that are not its business
//   team      stays close, backs up fights, revives, shares what it sees
//   utility   throws grenades and uses gadgets
//   flank     takes the long way round
//   close     shuts doors behind it
//   prefire   shoots at remembered positions through soft cover
//   patience  how long it holds before it moves
//   pace      walk (0) or run (1) when nothing is going on
export const CALLSIGNS = ['Ghost', 'Maverick', 'Nomad', 'Viper', 'Rook', 'Cinder', 'Kestrel', 'Bishop', 'Harbor', 'Sable', 'Tundra', 'Anvil', 'Vesper', 'Drift', 'Echo', 'Flint', 'Granite', 'Halo', 'Ivory', 'Jackal', 'Kodiak', 'Lynx', 'Mamba', 'Nova', 'Onyx', 'Piston', 'Quill', 'Raven', 'Slate', 'Talon', 'Umber', 'Vector', 'Wraith', 'Yarrow', 'Zephyr', 'Bramble', 'Copper', 'Dagger', 'Ember', 'Falcon', 'Gravel', 'Hollow', 'Iron', 'Juno', 'Knox', 'Lark', 'Mortar', 'Needle', 'Orbit', 'Pike'];

const A = (label, blurb, t) => ({ label, blurb, t: { aggr: 0.5, caution: 0.5, curious: 0.5, team: 0.5, utility: 0.5, flank: 0.2, close: 0.3, prefire: 0.4, patience: 0.5, pace: 0.5, ...t } });
export const ARCHETYPES = {
  // ---- attackers
  fragger: A('Entry fragger', 'Goes in first, fast, and wins duels by speed.', { aggr: 0.9, caution: 0.25, curious: 0.55, team: 0.4, utility: 0.35, flank: 0.1, close: 0, prefire: 0.5, patience: 0.2, pace: 0.9 }),
  breacher: A('Breacher', 'Opens the walls the squad needs, then covers the hole.', { aggr: 0.5, caution: 0.55, curious: 0.35, team: 0.7, utility: 0.6, flank: 0.1, close: 0, prefire: 0.4, patience: 0.6, pace: 0.6 }),
  support: A('Utility support', 'Stays a step behind the entry, flashes the room first, trades kills.', { aggr: 0.45, caution: 0.6, curious: 0.4, team: 0.9, utility: 0.95, flank: 0.1, close: 0, prefire: 0.5, patience: 0.5, pace: 0.55 }),
  intel: A('Recon', 'Scouts with drones and sensors and calls what it finds.', { aggr: 0.3, caution: 0.8, curious: 0.7, team: 0.75, utility: 0.55, flank: 0.15, close: 0.1, prefire: 0.6, patience: 0.75, pace: 0.4 }),
  lurker: A('Lurker', 'Works the flank alone and strikes the defenders from behind.', { aggr: 0.65, caution: 0.7, curious: 0.8, team: 0.2, utility: 0.5, flank: 0.9, close: 0.1, prefire: 0.55, patience: 0.8, pace: 0.35 }),
  point: A('Point', 'Leads with the shield and takes the first shots for the squad.', { aggr: 0.7, caution: 0.35, curious: 0.4, team: 0.8, utility: 0.3, flank: 0, close: 0, prefire: 0.2, patience: 0.4, pace: 0.4 }),
  medic: A('Medic', 'Keeps the squad alive: heals, revives, and holds back until it is safe.', { aggr: 0.25, caution: 0.75, curious: 0.35, team: 1, utility: 0.5, flank: 0, close: 0, prefire: 0.3, patience: 0.6, pace: 0.5 }),
  // ---- defenders
  anchor: A('Anchor', 'Holds the objective and does not leave it for anything.', { aggr: 0.25, caution: 0.7, curious: 0.25, team: 0.6, utility: 0.55, flank: 0, close: 0.65, prefire: 0.75, patience: 0.95, pace: 0.2 }),
  roamer: A('Roamer', 'Patrols the rooms round the site, listens, and kills from behind.', { aggr: 0.75, caution: 0.55, curious: 0.95, team: 0.35, utility: 0.55, flank: 0.7, close: 0.5, prefire: 0.7, patience: 0.35, pace: 0.55 }),
  trapper: A('Trapper', 'Lays traps early and plays the ground it has wired.', { aggr: 0.3, caution: 0.8, curious: 0.4, team: 0.55, utility: 0.9, flank: 0.1, close: 0.6, prefire: 0.55, patience: 0.8, pace: 0.3 }),
  watcher: A('Watcher', 'Reads cameras and sensors and tells the squad where they are coming.', { aggr: 0.35, caution: 0.75, curious: 0.6, team: 0.85, utility: 0.6, flank: 0.15, close: 0.45, prefire: 0.65, patience: 0.8, pace: 0.3 }),
  aggressor: A('Aggressor', 'Contests the push in the outer rooms before the walls open.', { aggr: 0.95, caution: 0.25, curious: 0.7, team: 0.4, utility: 0.45, flank: 0.5, close: 0.2, prefire: 0.6, patience: 0.15, pace: 0.85 }),
  rotator: A('Rotator', 'Moves to wherever the squad is losing ground.', { aggr: 0.6, caution: 0.5, curious: 0.8, team: 0.9, utility: 0.5, flank: 0.3, close: 0.4, prefire: 0.5, patience: 0.45, pace: 0.6 }),
};

// operator ability -> likely archetypes (first is the best fit, the rest are chosen from at random)
const ATK = {
  hammer: ['breacher', 'fragger'], thermite: ['breacher'], cluster: ['breacher', 'support'], xpellet: ['breacher', 'lurker'], launcher: ['breacher'], torch: ['breacher', 'lurker'],
  shield: ['point'], flashshield: ['point', 'support'], scanner: ['intel'], sonar: ['intel', 'lurker'], shockdrone: ['intel', 'fragger'],
  bangs: ['support', 'fragger'], cinders: ['support', 'lurker'], stimpistol: ['medic'],
};
const DEF = {
  armorpanel: ['anchor'], dshield: ['anchor'], armorpack: ['anchor', 'rotator'], extrareinforce: ['anchor', 'rotator'],
  mat: ['trapper', 'roamer'], edd: ['trapper'], mines: ['trapper', 'roamer'], shockwire: ['trapper', 'aggressor'], jammer: ['watcher', 'rotator'],
  cams: ['watcher', 'roamer'], turret: ['watcher', 'anchor'], nitro: ['aggressor', 'roamer'], stimpistol: ['medic'], healstation: ['rotator', 'anchor'],
};

export class Persona {
  constructor(rand, id, callsign, op) {
    const arch = ARCHETYPES[id]; this.rand = rand;
    this.id = id; this.callsign = callsign; this.label = arch.label; this.blurb = arch.blurb; this.op = op;
    this.p = {};
    for (const [k, v] of Object.entries(arch.t)) this.p[k] = Math.max(0, Math.min(1, v + (rand() - 0.5) * 0.3));
    // small habits that do not depend on the archetype
    this.habit = { side: rand() < 0.5 ? -1 : 1, holdAngle: rand(), tilt: 0, confidence: 0, quirk: Math.floor(rand() * 4) };
  }
  // a few lines for the squad panel
  describe() { return `${this.callsign} · ${this.label}`; }
  shouldClose(door) { void door; return this.rand() < this.p.close; }
  // morale shifts what it does: kills build confidence, dead squad mates build tilt
  onKill() { this.habit.confidence = Math.min(1, this.habit.confidence + 0.25); this.habit.tilt = Math.max(0, this.habit.tilt - 0.1); }
  onMateDown() { this.habit.tilt = Math.min(1, this.habit.tilt + 0.2); this.habit.confidence = Math.max(0, this.habit.confidence - 0.1); }
  // effective aggression right now
  get push() { return Math.max(0, Math.min(1, this.p.aggr + this.habit.confidence * 0.2 + this.habit.tilt * 0.25 - this.habit.tilt * this.p.caution * 0.2)); }
}

export function archetypeFor(ability, side, rand) {
  const table = side === 'atk' ? ATK : DEF, list = table[ability];
  if (list) return list.length > 1 && rand() < 0.35 ? list[1 + Math.floor(rand() * (list.length - 1))] : list[0];
  const pool = side === 'atk' ? ['fragger', 'lurker', 'support', 'fragger'] : ['roamer', 'anchor', 'aggressor', 'rotator', 'roamer'];
  return pool[Math.floor(rand() * pool.length)];
}
export function makePersona(rand, op, side, callsign) {
  return new Persona(rand, archetypeFor(op.ability, side, rand), callsign, op);
}
// callsigns are drawn once per match so each slot keeps its name from round to round
export function drawCallsigns(rand, n, taken = []) {
  const bag = CALLSIGNS.filter((c) => !taken.includes(c)); const out = [];
  while (out.length < n && bag.length) out.push(bag.splice(Math.floor(rand() * bag.length), 1)[0]);
  return out;
}
