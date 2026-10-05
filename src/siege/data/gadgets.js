// Gadget catalogue. family decides how the game handles the item:
//   throw  - thrown, bounces, then does its effect       device - placed on a surface / the floor
//   melee  - swung at close range                        hold   - held down at a surface or target
//   item   - carried and used in place (shield, pulse)   dart   - fired from the sidearm slot
export const GADGETS = {
  // ------------------------------------------------------------ attackers' operator gadgets
  hammer: { name: 'Breaching Hammer', family: 'melee', count: 0, desc: 'Swing to smash soft walls, barricades, hatches and deployable shields. A head blow is lethal.' },
  thermite: { name: 'Exothermic Charge', family: 'device', count: 2, desc: 'Sticks to a reinforced wall and burns a wide hole through it. Defenders can shoot it off.' },
  shield: { name: 'Ballistic Shield', family: 'item', count: 0, desc: 'Extends a bullet-proof shield. Slow, heavily armoured, and the bash knocks enemies back.' },
  flashshield: { name: 'Flash Shield', family: 'item', count: 0, desc: 'A light shield with a blinding strobe. Pistol only while it is up.' },
  scanner: { name: 'Pulse Sensor', family: 'item', count: 0, desc: 'Hold to read heartbeats through walls up to 18 m. Hostiles in range are marked for your team.' },
  launcher: { name: 'Breaching Rounds', family: 'dart', count: 3, desc: 'Launches rounds that stick to soft walls and blow a hole when detonated.' },
  shockdrone: { name: 'Shock Drone', family: 'device', count: 2, desc: 'A drone you park somewhere. Detonate it to shock enemies and fry gadgets nearby.' },
  cluster: { name: 'Cluster Charge', family: 'device', count: 2, desc: 'Sticks to a wall or hatch. Remote detonation rips a hole in soft surfaces from a distance.' },
  stimpistol: { name: 'Stim Pistol', family: 'dart', count: 3, desc: 'Heals and armours a teammate you hit. Tap fire to heal them over two seconds.' },
  sonar: { name: 'Sonar Grenade', family: 'throw', count: 3, desc: 'Detonates into a sonic burst that tags anyone moving within 14 m for five seconds.' },
  xpellet: { name: 'X-Pellets', family: 'dart', count: 3, desc: 'Fired pellets stick to reinforced walls and burn a small hole each.' },
  torch: { name: 'Blowtorch', family: 'hold', count: 1, desc: 'Hold against a reinforced wall to burn a one-panel peephole. Silent, slow.' },
  bangs: { name: 'Concussion Pack', family: 'throw', count: 4, desc: 'Four flash-and-concussion grenades.' },
  cinders: { name: 'Smoke Pack', family: 'throw', count: 5, desc: 'Five smoke grenades. Smoke blocks sight but not bullets.' },
  // ------------------------------------------------------------ defenders' operator gadgets
  armorpanel: { name: 'Armor Panel', family: 'device', count: 3, desc: 'Fix to a doorway or window. Takes heavy punishment; only hammers and explosives remove it quickly.' },
  armorpack: { name: 'Armor Packs', family: 'item', count: 3, desc: 'Drop a pack: everyone who takes it gets an extra plate of armour. Not on the first hit.' },
  mat: { name: 'Spike Mat', family: 'device', count: 3, desc: 'Lay on the floor. Whoever steps on it is wounded, slowed and revealed.' },
  edd: { name: 'Entry Denial Device', family: 'device', count: 3, desc: 'A tripwire charge across a doorway. Heavy damage when the beam is broken.' },
  jammer: { name: 'Signal Disruptor', family: 'device', count: 3, desc: 'Shuts down enemy drones, sensors and remote devices within 9 m.' },
  cams: { name: 'Black-Eye Cameras', family: 'device', count: 3, desc: 'Stick a camera onto a window. Your whole team sees through it. Bullets can still break it.' },
  dshield: { name: 'Deployable Shield', family: 'device', count: 2, desc: 'Drop a bullet-proof barrier with a slit to shoot over. Vulnerable to hammer blows.' },
  turret: { name: 'Auto Turret', family: 'device', count: 1, desc: 'A tripod gun that tracks and fires at anyone it sees within 18 m.' },
  nitro: { name: 'Nitro Cell', family: 'throw', count: 2, desc: 'Throw it and detonate on command. Destroys drones and soft walls and kills in the blast.' },
  shockwire: { name: 'Shock Wire', family: 'device', count: 3, desc: 'Electrify a reinforced wall or barbed wire. Anyone touching it is shocked; charges on it are fried.' },
  mines: { name: 'Gas Mines', family: 'device', count: 3, desc: 'Hidden mines that release poison gas on contact.' },
  healstation: { name: 'Heal Station', family: 'device', count: 2, desc: 'A deployable station that heals everyone around it over time.' },
  extrareinforce: { name: 'Extra Reinforcement', family: 'item', count: 0, desc: 'Reinforces two more walls than anyone else, and does it faster.' },
  // ------------------------------------------------------------ shared secondary gadgets
  frag: { name: 'Frag Grenade', family: 'throw', count: 2, desc: 'Fused fragmentation grenade. Damages through thin walls and opens hatches.' },
  stun: { name: 'Stun Grenade', family: 'throw', count: 2, desc: 'Blinds and deafens everyone close to it, and slows them.' },
  smoke: { name: 'Smoke Grenade', family: 'throw', count: 2, desc: 'Billowing smoke that blocks sight for twelve seconds.' },
  breach: { name: 'Hard Breach Charge', family: 'device', count: 2, desc: 'Plant on any wall or hatch, step back and detonate. Opens even reinforced walls.' },
  claymore: { name: 'Claymore', family: 'device', count: 2, desc: 'A directional mine with a laser. Kills what crosses the front arc.' },
  barbwire: { name: 'Barbed Wire', family: 'device', count: 2, desc: 'Slows and wounds anyone who crosses it. Burns away under fire.' },
  impact: { name: 'Impact Grenade', family: 'throw', count: 2, desc: 'Explodes on contact. Makes a hole in hatches and thin walls.' },
  alarm: { name: 'Proximity Alarm', family: 'device', count: 2, desc: 'Chirps and marks anyone who walks past it.' },
  // ------------------------------------------------------------ everyone
  drone: { name: 'Recon Drone', family: 'item', count: 1, desc: 'A small wheeled drone for scouting the building in the preparation phase.' },
  reinforce: { name: 'Reinforcement', family: 'hold', count: 0, desc: 'Hold at a wall to turn a section to steel. Only hard breaches get through.' },
  barricade: { name: 'Barricade', family: 'hold', count: 0, desc: 'Board up a door or window. Hammers and explosives clear it.' },
};

// icon glyph names are drawn by ui/icons.js
export const SECONDARY = {
  atk: ['frag', 'stun', 'smoke', 'breach', 'claymore'],
  def: ['barbwire', 'dshield', 'impact', 'alarm', 'nitro'],
};
export const gadgetCount = (id) => GADGETS[id]?.count ?? 0;
