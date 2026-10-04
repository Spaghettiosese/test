# Hollowmere: The Thirteenth Bell

A dark-fantasy first-person stealth-action game in four chapters, built on the ShapeForge Engine V5 (vendored in `../engine`). Slightly pixelated, dithered rendering with a crisp DOM HUD.

```bash
npm start                    # then open http://localhost:8080/hollowmere/
npm run test:hollowmere      # level / roster / reachability consistency test
```

## Story
You are Rook, sent to infiltrate the walled town of Ashgate and the Duke's keep to steal a sealed letter.
- **Chapter I · The Duke's Seal**: cross the town, get past the court and garrison, reach the Duke's bedchamber, take the letter and escape. The seal cracks on its own.
- **Chapter II · The Gray Hand**: your employer's knives are waiting at the camp. Learn what the letter is from the priest, the witch and the Duke, then find Sable's house under the Drowned Lantern.
- **Chapter III · The Hollow Night**: the dead march on Ashgate. Hold the gate with Captain Harl for a pardon, and take the Bone and the Bell before the Gray Hand does.
- **Chapter IV · The Choir Beneath**: midnight at the Choir Stones under a red moon, Sable, and what sleeps in the Deep. Four endings.

Chapters you have reached can be replayed from the title screen; finishing unlocks New Game+.

Everything in the game is listed round by round in [FEATURES.md](FEATURES.md): the wide valley, squad AI, witnesses and bounties, disguises, perks, crafting, weather, the world map, quests, social stealth, and the four-chapter campaign.

## Controls
| Action | Keys |
| --- | --- |
| Move · sprint · crouch · jump | WASD · Shift · Ctrl/C · Space |
| Attack (3-hit combo, thrust) · block/parry | Left mouse · right mouse |
| Heavy blow (breaks shields) · sidestep | Hold left mouse · double-tap W/A/S/D |
| Execute a foe whose posture is broken | E |
| Crossbow up/down · loose · aim · change bolt | I · left mouse · right mouse · K or wheel |
| Skills: Shadow Veil, Umbral Dash, Gravebreaker | 1 · 2 · 3 |
| Interact / loot / talk · hold to pick locks | E |
| Pick up a prop (E) · throw it | E · left mouse |
| Sheathe or draw the sword · hood up or down | Y · O |
| Answer a guard who challenges you | E |
| Mount · dismount · whistle for your horse | F |
| Gallop · walk while mounted | Shift · C |
| Journal · story · perks · craft · map · lore · stash | Tab · 2 · P · M · 1-9 · 0 |
| Wraith Sight · poison blade | 4 · 5 |
| Throw knife · coin · fire flask | G · V · X |
| Sap · drag a body · drop disguise | B · hold Z · U |
| Prone · creep | hold C · crouch + Shift |
| Choke out an unaware target | hold E from behind |
| Kick | Q |
| Draughts (haste, ironhide, night eye, ghostwalk) | 6 · 7 · 8 · 9 |
| Place a trap · smoke bomb · lantern | H · J · L |
| Map pin · minimap zoom | N · + / - |
| Pickpocket · fish · mine | hold E |
| Pick a lock | press E when the marker is in the gold |
| Quick save | F5 |
| Pause | Esc |

Debug URL params: `?debug&nomenu&skipintro&chapter=c2|c3|c4&at=x,y,z&yaw=&pitch=&hour=`.

## Systems
- Day/night clock with NPC schedules (work, sleep, pray, patrol, wander) and A* navigation.
- Guard AI: sight cone, light and noise perception, investigate/search/chase, alarms, reactions to bodies and snuffed torches.
- Physics: ragdoll deaths, lootable bodies, breakable and throwable props, doors, explosions via Gravebreaker.
- Story: cutscenes, branching dialogue, notes, side quests, several endings paths, all synthesized audio.
- The full game: four chapters, a new title menu with three save slots, chapter select, forty trophies, New Game+, posture and executions, heavy blows and sidesteps, a crossbow with four bolts, shieldbearers, the Gray Hand, Hollow Knights and Cantors, NPCs who fight each other, the Rookery, the belfry, the Choir's Deep and the Choir itself (see the Round 8 section of FEATURES.md).
- Quiet life: sheathe the sword, change your hood, look like a citizen, talk your way past guards with odds on every choice; guards act on what you do and what they have been told, not on seeing you (see the Round 7 section of FEATURES.md).
- Living wild: deer, wolves, crows, a horse to ride, a travelling caravan, buried treasure, roadside encounters, three boss fights and a leasable cabin with a stash (see the Round 6 section of FEATURES.md).

## Layout
`src/` game code (`game.js`, `player.js`, `npc.js`, `story.js` (Chapter I), `campaign.js` and `chapters/` (Chapters II-IV), `choir.js`, `endings.js`, `menu.js`, `ui.js`, `pixel.js`, ...), `src/people/` models and animation clips, `src/level/` procedural level, `tools/` dev viewers.
