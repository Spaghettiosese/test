# SiegeForge feature list

Everything below is implemented in this repository and reachable in the game or the headless tools.
Numbers (28 operators, 38 gadgets, 16 weapons, 100 openings, and so on) are counted from the data files.

## Operators and gadgets

1. 28 original operators: 14 attackers and 14 defenders, eight units between them.
2. Every operator has a signature gadget with its own rules, 38 gadgets in all.
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

13. 16 weapons in six classes: assault rifles, submachine guns, shotguns, marksman rifle, sniper rifle, handguns.
14. Ten hand-modelled, rigged first-person weapons with authored fire, reload, empty-reload and inspect animations.
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

## World and destruction

29. A voxel-face world: one metre cells, walls, floors and windows are panels on cell faces.
30. Harbor Garage: a two-storey depot with a roof, a yard and 140 props.
31. 100 openings: doors, arches, open passages and windows.
32. 42 doors that open and close for players and bots.
33. 45 windows that can be shot out and vaulted.
34. Soft walls that take damage and break.
35. Walls break panel by panel; the mesh rebuilds only the chunk that changed.
36. Steel reinforcement: ten walls per round, applied in runs of up to four panels.
37. Reinforced walls resist everything except hard breaches, thermite and torches.
38. Floor and ceiling hatches that can be reinforced or blown open.
39. Roof skylights that open the top floor from above.
40. Two interior stairwells (with holes in the floor) and exterior stairs to the roof.
41. Twelve rappel anchors; attackers can rappel past the windows and vault in.
42. Four bomb sites across two floors, each with two plant spots.
43. Three attacker spawns around the building.
44. Barricades and armour panels on doors and windows.
45. Explosions damage panels, hatches, devices and people with a blast falloff.
46. Smoke clouds that block sight but not bullets.
47. Bullet-hole decals tied to the panel they are on; they disappear with it.
48. Chunked debris particles when walls break.
49. Rooms have names ("2F Garage Lounge") shown on the HUD and used in callouts.
50. Per-room paint, floors and ceiling lamps, with point lights.
51. Furniture is kept clear of doors, arches and windows when the map is built.
52. Day, dusk and night lighting.
53. Props block movement and bullets, with cover heights and per-prop bullet absorption.

## Match rules

54. Bomb mode: plant in seven seconds, a 45-second fuse, seven seconds to disable.
55. Secure Area mode: attackers hold the room for ten seconds.
56. A 45-second preparation phase with a timer on the HUD.
57. Attackers are held at their spawn during preparation; defenders stay inside the building.
58. Defenders reinforce walls and barricade during preparation.
59. A three-minute action phase.
60. Win by elimination, by detonation, by disabling the defuser, or on time.
61. Round series with the first side to three wins, sides swapping every round.
62. Down But Not Out: a downed player can crawl, be revived in 3.4 seconds, or bleed out.
63. Optional friendly fire.
64. Custom Match with difficulty, time of day, preparation time, round time, rounds and down-but-not-out settings.
65. Skirmish: a quick single-round secure area.
66. Realistic playlist with no down-but-not-out and friendly fire.
67. Enlisted playlist that moves your rank.
68. The classic shooting range (ten guns, targets to 200 metres) is still included.

## Player controls

69. Walk, sprint, crouch, prone, lean left and right, jump.
70. Vault over window sills.
71. Melee, with a lethal hammer blow to the head.
72. Hold-to-interact: open doors, plant, disable, reinforce, barricade, revive.
73. Launch a drone in preparation and drive it with the mouse.
74. Defenders cycle through their cameras.
75. Ping the world or mark an enemy for the squad.
76. Select weapons with number keys, the mouse wheel and the next key.
77. Gadgets: throw, place, fire darts, hold a blowtorch, raise a shield, strobe a flash shield, detonate remote charges.
78. Pulse sensor that tags heartbeats through walls.
79. Rappel from the roof, with W and S to lower and raise and a kick off the wall.
80. Spectate teammates after you die, in first or third person.
81. Scoreboard on Tab.
82. Rebindable keys.
83. Mouse sensitivity, aim sensitivity, invert Y, toggle aim, field of view.
84. Pointer lock with a free-cursor fallback (screen-edge turning and arrow keys) for pages that cannot capture the mouse.
85. Pauses when the window loses focus.
86. Help overlay on H.

## AI

87. A decision loop at about five hertz with combat, reaction and task modes.
88. Vision with a field of view, distance and an awareness meter that builds before a bot reacts.
89. Hearing: footsteps, doors, shots and breaches carry, and walls muffle them.
90. Memory of last known positions, with prediction of where a moving enemy went.
91. Team callouts: what one bot sees, the squad learns.
92. An aim model with reaction time, noise that grows with distance and movement, bursts and pauses.
93. Per-bot personality: handedness, boldness, patience, nerve.
94. Cover finding, and retreat to cover when hurt.
95. Strafing, peeking and leaning on held positions.
96. Reloading behind cover.
97. Grenades thrown at hidden enemies and to flush rooms.
98. A* navigation over the live world: opened doors, shot-out windows, breached walls and stairs change routes at once.
99. Door opening, window vaulting and stair climbing on routes.
100. Hatch drops: bots drop through open hatches when it shortens the way.
101. String-pulled paths that do not cut corners into walls.
102. Stuck handling: re-plan, skip a bad waypoint, accept a near arrival, steer round props, hop clear.
103. A pathfinding budget per frame keeps ten bots cheap.
104. Danger-aware routes that avoid known enemy positions and known traps.
105. Attack director: drones scout in preparation and tag defenders.
106. Attack roles: point, breacher, hammer, intel, medic, entry and planter.
107. Staging outside, then a push along two different routes.
108. Breach target selection by operator tool (soft versus reinforced walls).
109. A planter who waits for a calm room and takes over if the planter dies.
110. Post-plant: attackers spread out and hold the defuser.
111. Defence director: reinforcement jobs that favour the walls facing the attackers.
112. Defenders barricade doors and windows, and place gadgets by operator.
113. Anchors hold the site; roamers watch the approaches.
114. Defenders listen for the push and rotate towards it.
115. Defenders retake the defuser once it is planted.
116. Gadget AI for the hammer, thermite, cluster charge, X-pellets, breaching rounds, torch, pulse sensor, sonar and shields.
117. Bots revive downed squad mates when nobody is shooting at them.
118. Bots use stim pistols, armour packs, heal stations, cameras and traps.
119. Five difficulty levels: Recruit, Regular, Veteran, Elite, Realistic.
120. Rounds are deterministic for a given seed, so a bad match can be replayed in the headless tools.

## Characters, rendering and sound

121. Every soldier is a rigged ShapeForge character with a uniform, vest, headgear and pack per operator.
122. Locomotion blending for walk, run, crouch, prone and lean, with weapon holds solved by IK.
123. Hit reactions and ragdolls when someone dies.
124. A more detailed hero model for the menu, with face, ears and a watch.
125. Physically based WebGL2 rendering with shadows, ambient occlusion, bloom and colour grading.
126. Adaptive resolution that holds the frame rate.
127. Muzzle flashes, sparks, smoke, tracers, shell casings and impact puffs.
128. Procedural, positional sound: shots by weapon, footsteps, doors, glass, breaking walls, explosions.
129. Sound passes through walls dull and quiet.
130. A tinnitus ring after a flashbang.
131. Fuse beeps that speed up as the defuser burns.
132. Generative menu music.
133. Optional spoken callouts.
134. Low health desaturates the screen and flashes a red vignette; flashbangs whiten it; gas tints it green.

## Heads-up display

135. Team slots with operator glyphs, scores and the round timer across the top.
136. Fuse countdown replaces the clock once the defuser is planted.
137. A radial dial with the phase text, your room and a pointer to the objective.
138. Ammunition for both weapons and your gadgets, with the selected one highlighted.
139. Drone and ping prompts in the corner, with your bound keys.
140. Context prompts for every hold action, with progress bars.
141. Kill feed with headshot and revive entries.
142. Contact callouts from teammates.
143. World markers for teammates, tagged enemies, the sites, the defuser and pings.
144. Crosshair that opens with movement and recoil, in three styles and a colour of your choice.
145. Hit markers and kill markers.
146. Drone and camera feed overlays with a jam warning.
147. Round banners ("ATTACK", "ROUND WON") and objective progress.
148. Health, armour plates and a squad health list.
149. Scoreboard with kills, assists, deaths and score.
150. HUD size slider, and colour-blind team colours.

## Menus and screens

151. Main menu laid out like the reference: tabs, season panel, squad panel, tutorial tile, playlists bar, clearance progress, missions, banner with a QR code and the unread row.
152. A 3D hangar with your operator posed in it, with mouse parallax.
153. Operators page with a studio view of any operator and their stats.
154. Battle Pass: 40 free and premium tiers with claimable rewards.
155. Locker: uniforms, headgear, weapon skins, charms, titles and banners, with a live preview of uniform and headgear.
156. Career: statistics, win rate, accuracy, match history, favourite operators and ranks.
157. Esports: standings, fixtures, pick'em and a live observer mode that watches an AI match with speed controls.
158. Shop: 73 items bought with renown or credits.
159. Playlists, squad, notifications and accessibility panels.
160. Settings in five tabs: gameplay, controls, audio, video and match.
161. Operator select before every round: locations, operators, loadout and ready tabs, a countdown and squad slots that fill as the bots lock in.
162. Defenders pick the objective; attackers pick the spawn.
163. Match results with a round-by-round breakdown and an itemised reward list.
164. Pause menu, controls reference and a loading screen with tips.
165. The interface scales to any window size, and the fonts are bundled so it works offline.

## Progression

166. Clearance levels with a rising XP curve and renown or credit rewards on every level.
167. XP and renown for kills, headshots, assists, plants, disables, reinforcements, breaches and wins.
168. Newcomer missions, and three daily challenges chosen from twelve.
169. Eight ranks from Copper to Champion, with a ten-match placement in Enlisted.
170. Profile and settings saved in the browser.
171. XP boosters from the battle pass.

## Tutorials

172. Basics: look, move, sprint, stances, lean, aim, shoot, reload, doors and planting.
173. Attack: drone, tagging, breaching, planting.
174. Defense: reinforcing, barricading, placing gadgets, holding the site.

## Tools

175. `tools/sim-match.mjs` and `tools/sim-batch.mjs` play whole AI rounds headlessly and report balance, revives, bleed-outs and stalls.
176. `tools/walk-test.mjs` walks a bot between hundreds of random cells with the real mover and physics.
177. `tools/map-lint.mjs` checks every doorway for a clear approach and every bomb spot for a route.
178. `tools/nav-map.mjs` prints each storey's walkable grid and flags unreachable cells.
179. `npm test` runs the weapon, simulation, map and AI checks.
