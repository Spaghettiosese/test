# SiegeForge feature list

Everything below is implemented in this repository and reachable in the game or the headless tools.
Numbers (38 operators, 47 gadgets, 29 weapons on 27 rigs, 8 bomb sites, 6 spawns, 100 openings, and so on) are counted from the data files.

## Operators and gadgets

1. 38 original operators: 19 attackers and 19 defenders, eight units between them.
2. Every operator has a signature gadget with its own rules, 47 gadgets in all.
3. Speed and armour ratings set health (100, 110 or 125) and movement speed.
4. Each operator has a difficulty rating, a role and a short briefing.
5. Each operator chooses between two or three primary weapons, one or two sidearms and a secondary gadget.
6. Attackers: breaching hammer, thermite, ballistic shield, flash shield, pulse sensor, breaching rounds, shock drone, cluster charge, stim pistol, sonar grenades, X-pellets, blowtorch, concussion pack, smoke pack.
7. Defenders: armour panel, armour packs, spike mat, entry denial tripwire, signal disruptor, cameras, deployable shield, auto turret, nitro cell, shock wire, gas mines, heal station, extra reinforcement, stim pistol.
8. Shared secondary gadgets: frag, stun, smoke, hard breach charge, claymore, barbed wire, impact grenade, proximity alarm.
9. Every operator is drawn as a procedurally generated SVG glyph.
10. A starter roster of eight operators; the rest unlock with renown.
11. A favourite operator per side, remembered between sessions.
12. The last loadout for each operator is remembered.

## Weapons

13. 29 weapons in seven classes: assault rifles, submachine guns, a light machine gun, shotguns, marksman rifles, a sniper rifle, handguns.
14. Twenty hand-modelled, rigged first-person weapons with authored fire, reload, empty-reload and inspect animations: bullpup rifles (AUG-A3, FA-G2), a belt-fed LMG with a hinged cover and belt box, a top-fed PS-90, a drum shotgun, a scoped marksman rifle, a lever-action carbine, and three new handguns (P9 Compact, suppressed M45, MP10 machine pistol) beside the original ten.
15. Per-weapon damage, rate of fire, magazine, reserve, spread, aimed spread and recoil.
16. Automatic and semi-automatic fire.
17. Bullet penetration through soft materials, with a damage cost per material.
18. Per-weapon wall damage (shotgun slugs and sniper rounds open walls quickly).
19. Damage falls off with range, with a different curve per class.
20. Headshots, chest and limb damage regions.
21. Shotgun pellet spreads.
22. Scoped sniper with a lens overlay and a range read-out.
23. Aim down sights with a per-weapon field of view and a sight line that lines up with the optic.
24. Recoil that climbs while firing and recovers when you let go.
25. Weapon sway, bob, sprint lowering and kick on the first-person model.
26. Raise and lower animation on weapon switch.
27. Weapons are safe during the preparation phase.
28. Running dry switches bots to their sidearm.
29. Inspect (I) on every weapon: a flank-to-flank look and a press check, a pistol spin, a lever flip and a catch on the lever-action.
30. Pistols and machine pistols have an Idle Empty and Fire Last (the slide stays back), a slide-release reload when dry, and a longer reload when the magazine was empty.
31. The LMG is slow to run with and slow to reload; the suppressed M45 is almost silent to the bots.

## World and destruction

32. A voxel-face world: one metre cells, walls, floors and windows are panels on cell faces.
33. Harbor Garage: a two-storey depot with a roof, a yard and 140 props.
34. 100 openings: doors, arches, open passages and windows.
35. 42 doors that open and close for players and bots.
36. 45 windows that can be shot out and vaulted.
37. Soft walls that take damage and break.
38. Walls break panel by panel; the mesh rebuilds only the chunk that changed.
39. Steel reinforcement: ten walls per round, applied in runs of up to four panels.
40. Reinforced walls resist everything except hard breaches, thermite and torches.
41. Floor and ceiling hatches that can be reinforced or blown open.
42. Roof skylights that open the top floor from above.
43. Two interior stairwells (with holes in the floor) and exterior stairs to the roof.
44. Twelve rappel anchors; attackers can rappel past the windows and vault in.
45. Eight bomb sites across two floors, each with two plant spots (Office, Workshop, Lounge, Manager, Lobby, Locker Room, Staff Bar, Conference).
46. Six attacker spawns around the building and the yard, picked on an overhead map.
47. Barricades and armour panels on doors and windows.
48. Explosions damage panels, hatches, devices and people with a blast falloff.
49. Smoke clouds that block sight but not bullets.
50. Bullet-hole decals tied to the panel they are on; they disappear with it.
51. Chunked debris particles when walls break.
52. Rooms have names ("2F Garage Lounge") shown on the HUD and used in callouts.
53. Per-room paint, floors and ceiling lamps, with point lights.
54. Furniture is kept clear of doors, arches and windows when the map is built.
55. Day, dusk and night lighting.
56. Props block movement and bullets, with cover heights and per-prop bullet absorption.

## Match rules

57. Bomb mode: plant in seven seconds, a 45-second fuse, seven seconds to disable.
58. Secure Area mode: attackers hold the room for ten seconds.
59. A 45-second preparation phase with a timer on the HUD.
60. Attackers are held at their spawn during preparation; defenders stay inside the building.
61. Defenders reinforce walls and barricade during preparation.
62. A three-minute action phase.
63. Win by elimination, by detonation, by disabling the defuser, or on time.
64. Round series with the first side to three wins, sides swapping every round.
65. Down But Not Out: a downed player can crawl, be revived in 3.4 seconds, or bleed out.
66. Optional friendly fire.
67. Custom Match with difficulty, time of day, preparation time, round time, rounds and down-but-not-out settings.
68. Skirmish: a quick single-round secure area.
69. Realistic playlist with no down-but-not-out and friendly fire.
70. Enlisted playlist that moves your rank.
71. The classic shooting range (ten guns, targets to 200 metres) is still included.

## Player controls

72. Walk, sprint, crouch, prone, lean left and right, jump.
73. Vault over window sills.
74. Melee, with a lethal hammer blow to the head.
75. Hold-to-interact: open doors, plant, disable, reinforce, barricade, revive.
76. Launch a drone in preparation and drive it with the mouse.
77. Drones jump (Space) and climb stairs and kerbs; defenders may shoot them during preparation.
78. Defenders cycle through their cameras.
79. Ping the world or mark an enemy for the squad.
80. Select weapons with number keys, the mouse wheel and the next key.
81. Gadgets: throw, place, fire darts, hold a blowtorch, raise a shield, strobe a flash shield, detonate remote charges.
82. Pulse sensor that tags heartbeats through walls.
83. Rappel from the roof, with W and S to lower and raise and a kick off the wall.
84. Spectate teammates after you die, in first or third person.
85. Scoreboard on Tab.
86. Rebindable keys.
87. Mouse sensitivity, aim sensitivity, invert Y, toggle aim, field of view.
88. Pointer lock with a free-cursor fallback (screen-edge turning and arrow keys) for pages that cannot capture the mouse.
89. Pauses when the window loses focus.
90. Help overlay on H.

## AI

91. A decision loop at about five hertz with combat, reaction and task modes.
92. Vision with a field of view, distance and an awareness meter that builds before a bot reacts.
93. Hearing: footsteps, doors, shots and breaches carry, and walls muffle them.
94. Memory of last known positions, with prediction of where a moving enemy went.
95. Team callouts: what one bot sees, the squad learns.
96. An aim model with reaction time, noise that grows with distance and movement, bursts and pauses.
97. Per-bot personality: handedness, boldness, patience, nerve.
98. Cover finding, and retreat to cover when hurt.
99. Strafing, peeking and leaning on held positions.
100. Reloading behind cover.
101. Grenades thrown at hidden enemies and to flush rooms.
102. A* navigation over the live world: opened doors, shot-out windows, breached walls and stairs change routes at once.
103. Door opening, window vaulting and stair climbing on routes.
104. Hatch drops: bots drop through open hatches when it shortens the way.
105. String-pulled paths that do not cut corners into walls.
106. Stuck handling: re-plan, skip a bad waypoint, accept a near arrival, steer round props, hop clear.
107. A pathfinding budget per frame keeps ten bots cheap.
108. Danger-aware routes that avoid known enemy positions and known traps.
109. Attack director: two or three bots fly drones through preparation, climbing stairs and hopping kerbs, call out every defender and trap they see and steer the squad away from the rooms they found.
110. Attack roles: point, breacher, hammer, intel, medic, entry and planter.
111. Staging outside, then a push along two different routes.
112. Breach target selection by operator tool (soft versus reinforced walls).
113. A planter who waits for a calm room and takes over if the planter dies.
114. Post-plant: attackers spread out and hold the defuser.
115. Defence director: reinforcement jobs that favour the walls facing the attackers.
116. Defenders barricade doors and windows, and place gadgets by operator.
117. Anchors hold the site; roamers watch the approaches.
118. Defenders listen for the push and rotate towards it.
119. Defenders retake the defuser once it is planted.
120. Gadget AI for the hammer, thermite, cluster charge, X-pellets, breaching rounds, torch, pulse sensor, sonar and shields.
121. Bots revive downed squad mates when nobody is shooting at them.
122. Bots use stim pistols, armour packs, heal stations, cameras and traps.
123. Five difficulty levels: Recruit, Regular, Veteran, Elite, Realistic.
124. Rounds are deterministic for a given seed, so a bad match can be replayed in the headless tools.
125. Every bot is a person: a persistent callsign and an archetype from its operator (entry fragger, breacher, support, recon, lurker, point, medic, anchor, roamer, trapper, watcher, aggressor, rotator) with ten habits that make two bots of one archetype differ.
126. Morale: kills build confidence, dead squad mates build tilt, and both change how hard a bot pushes; they carry from round to round.
127. Hunts: bots go and look at shots, breaches and sightings, flank when they are the flanking kind, press a shooter who keeps firing, and search the rooms next to where they lost sight of someone.
128. Defenders shut doors in preparation; doors start the round mostly open; bots open doors for themselves and close them behind them if they are careful.
129. Roamers patrol a loop of rooms round the site, listen at each stop and watch the doors the attackers came through before.
130. Barricades: wooden barricades give way to a few kicks, armour panels only to a hammer, and the attackers plan around what they cannot break.
131. Doorway manners: bots queue instead of shoving, step out of a doorway someone is waiting at and never park in one.
132. Navigation v2: standing points, prop clearance, body-width path smoothing and a progress watchdog; a 40-round soak finds about one stall per round where it used to find twelve.
133. Cross-round memory: after every round the bots remember where their side fell, where walls were opened and where defenders held; they reinforce the breached walls first, route round old death spots, send drones to old defender spots and show it in a message at the start of the round.
134. Takedowns count as kills on the scoreboard; the scoreboard and the results screen add up both squads over the whole match.

## Characters, rendering and sound

135. Every soldier is a rigged ShapeForge character with a uniform, vest, headgear and pack per operator.
136. Locomotion blending for walk, run, crouch, prone and lean, with weapon holds solved by IK.
137. Hit reactions and ragdolls when someone dies.
138. A more detailed hero model for the menu, with face, ears and a watch.
139. Physically based WebGL2 rendering with shadows, ambient occlusion, bloom and colour grading.
140. Adaptive resolution that holds the frame rate.
141. Muzzle flashes, sparks, smoke, tracers, shell casings and impact puffs.
142. Procedural, positional sound: shots by weapon, footsteps, doors, glass, breaking walls, explosions.
143. Sound passes through walls dull and quiet.
144. A tinnitus ring after a flashbang.
145. Fuse beeps that speed up as the defuser burns.
146. Generative menu music.
147. Optional spoken callouts.
148. Low health desaturates the screen and flashes a red vignette; flashbangs whiten it; gas tints it green.

## Heads-up display

149. Team slots with operator glyphs, scores and the round timer across the top.
150. Fuse countdown replaces the clock once the defuser is planted.
151. A radial dial with the phase text, your room and a pointer to the objective.
152. Ammunition for both weapons and your gadgets, with the selected one highlighted.
153. Drone and ping prompts in the corner, with your bound keys.
154. Context prompts for every hold action, with progress bars.
155. Kill feed with headshot and revive entries.
156. Contact callouts from teammates.
157. World markers for teammates, tagged enemies, the sites, the defuser and pings.
158. Crosshair that opens with movement and recoil, in three styles and a colour of your choice.
159. Hit markers and kill markers.
160. Drone and camera feed overlays with a jam warning.
161. Round banners ("ATTACK", "ROUND WON") and objective progress.
162. Health, armour plates and a squad health list.
163. Scoreboard with kills, assists, deaths and score.
164. HUD size slider, and colour-blind team colours.

## Menus and screens

165. Main menu laid out like the reference: tabs, season panel, squad panel, tutorial tile, playlists bar, clearance progress, missions, banner with a QR code and the unread row.
166. A 3D hangar with your operator posed in it, with mouse parallax.
167. Operators page with a studio view of any operator and their stats.
168. Battle Pass: 40 free and premium tiers with claimable rewards.
169. Locker: uniforms, headgear, weapon skins, charms, titles and banners, with a live preview of uniform and headgear.
170. Career: statistics, win rate, accuracy, match history, favourite operators and ranks.
171. Esports: standings, fixtures, pick'em and a live observer mode that watches an AI match with speed controls.
172. Shop: 73 items bought with renown or credits.
173. Playlists, squad, notifications and accessibility panels.
174. Settings in five tabs: gameplay, controls, audio, video and match.
175. Operator select before every round: locations, operators, loadout and ready tabs, a countdown and squad slots that fill as the bots lock in.
176. Defenders pick the objective and the room they start in; attackers pick the spawn.
177. Match results with a round-by-round breakdown and an itemised reward list.
178. Pause menu, controls reference and a loading screen with tips.
179. The interface scales to any window size, and the fonts are bundled so it works offline.

## Progression

180. Clearance levels with a rising XP curve and renown or credit rewards on every level.
181. XP and renown for kills, headshots, assists, plants, disables, reinforcements, breaches and wins.
182. Newcomer missions, and three daily challenges chosen from twelve.
183. Eight ranks from Copper to Champion, with a ten-match placement in Enlisted.
184. Profile and settings saved in the browser.
185. XP boosters from the battle pass.

## Tutorials

186. Basics: look, move, sprint, stances, lean, aim, shoot, reload, doors and planting.
187. Attack: drone, tagging, breaching, planting.
188. Defense: reinforcing, barricading, placing gadgets, holding the site.

## Tools

189. `tools/sim-match.mjs` and `tools/sim-batch.mjs` play whole AI rounds headlessly and report balance, revives, bleed-outs and stalls.
190. `tools/walk-test.mjs` walks a bot between hundreds of random cells with the real mover and physics.
191. `tools/map-lint.mjs` checks every doorway for a clear approach and every bomb spot for a route.
192. `tools/nav-map.mjs` prints each storey's walkable grid and flags unreachable cells.
193. `npm test` runs the weapon, simulation, map and AI checks.
194. `tools/stuck-test.mjs` plays AI rounds across sites and spawns and reports every place a bot pushes without getting anywhere; `tools/replay.mjs` replays one of them.
195. `tools/drone-test.mjs`, `tools/match-test.mjs`, `tools/ai-report.mjs` and `tools/player-shot-test.mjs` check the drones, a whole match, the behaviours listed above, and how the defenders answer a shooter.
196. `tools/sheet.cjs` tiles screenshots into one contact sheet for reviewing animations.

## Latest additions

197. Ten newer operators. Attackers: Surge (EMP grenades that fry every gadget within 8 m for twelve seconds), Phantom (a speaker that fakes the owner's footsteps and gunfire), Whisper (near-silent steps), Mule (supply crates that refill ammunition, armour and health, three uses each) and Havoc (an explosive grenade launcher). Defenders: Blaze (incendiary mines), Glare (flash mines), Seismic (floor sensors that tag runners through walls), Fog (smoke traps) and Depot (supply crates).
198. The bots play all ten: EMPs at turrets, cameras and drones they can see, decoys as the push starts, crates dropped where the squad stages and walked to when ammunition or health runs low, launcher rounds at people hiding behind cover; defenders lay mines and sensors in the preparation phase.
199. Seven more first-person rigs with fire, reload, empty-reload and inspect: the SC-17 battle rifle, G38C carbine, VS-9 Whisper suppressed marksman rifle, M28 Chicago drum SMG, K-7 Scout bolt rifle, P9X Duelist red-dot pistol and Vz-61 Scorpion machine pistol; all of them are in the operator loadouts.
200. Reactions: bots dive out of a frag's reach, turn their backs on a flashbang or duck out of its sight, drop and fire back when blinded, back off a charge stuck to a wall, run out of gas and fire, and keep their heads down under fire from somebody they cannot see.
201. They also react to a bullet that goes past their head, a door that opens in their face, a wall that comes down, a camera or drone that is shot out, a team mate who goes down (avenge, fall back or hold, by personality), an enemy who is reloading, being tagged by a drone, and a ping from the human.
202. They shoot the charges, cameras, claymores and traps they can see, send rounds through a plaster wall at a sound they are sure of, and throw a grenade into a fresh breach.
203. The state of the round shifts their nerve: the clock running out sends attackers in, the last defender plays quiet, a man up makes a squad braver; kills and dead team mates really move morale now.
204. Radio chatter ("Grenade!", "Man down!", "Fall back!", "Door!", "Wall's open!", "Charge on the wall!") shows in the HUD callouts.
205. Defenders no longer get stuck in sealed pockets between props: spawns, rescue hops and hold posts all check that the place can be walked out of; the wall-test tool finds about three bots per hour standing against something where it found two hundred.
206. Furniture breaks: every desk, locker, shelf, crate, couch and car has hit points and a material; bullets, blasts and the hammer wear it down, the whole piece goes at once and the cells it filled open for walking and sight.
207. Ceiling lamps can be shot out and switch their light off; frags clear furniture and lamps in reach but not behind walls.
208. Walls crack in stages as they weaken, bullets leave exit holes and craters tinted by the material, explosions leave soft soot and shake dust from the ceiling, doors show gashes and barricade boards fall away as they are shot, and rubble stays where it landed.
209. Breaking furniture makes noise the bots hear.
210. The player can close doors (F on an open door) and defenders hold F to barricade; nobody can be hurt during preparation; attackers are protected in their spawn for twenty seconds, container screens hide the spawns, and the bots never shoot at protected attackers.
211. `tools/test-reactions.mjs`, `tools/test-destruction.mjs`, `tools/test-newops.mjs`, `tools/test-player.mjs`, `tools/test-safety.mjs`, `tools/wall-test.mjs` and `tools/spawn-exposure.mjs` check the reactions, destruction, new operators, the player's door controls, the prep and spawn rules, bots standing against walls and how exposed each spawn is.
