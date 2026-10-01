# Hollowmere: The Duke's Letter

A dark-fantasy first-person stealth-action demo built on the ShapeForge Engine V5 (vendored in `../engine`). Slightly pixelated, dithered rendering with a crisp DOM HUD.

```bash
npm start                    # then open http://localhost:8080/hollowmere/
npm run test:hollowmere      # level / roster / reachability consistency test
```

## Story
You are Rook, sent to infiltrate the walled town of Ashgate and the Duke's keep to steal a sealed letter. Cross the town, get past the court and garrison, reach the Duke's bedchamber, take the letter, and escape. Something in the crypts does not want the letter to leave.

The second update ("The Wide Valley") is listed in [FEATURES.md](FEATURES.md): a map five times larger, squad AI, witnesses and bounties, disguises, perks, crafting, weather, a world map, quests and three endings.

## Controls
| Action | Keys |
| --- | --- |
| Move · sprint · crouch · jump | WASD · Shift · Ctrl/C · Space |
| Attack (3-hit combo, thrust) · block/parry | Left mouse · right mouse |
| Skills: Shadow Veil, Umbral Dash, Gravebreaker | 1 · 2 · 3 |
| Interact / loot / talk · hold to pick locks | E |
| Pick up a prop (E) · throw it | E · left mouse |
| Sheathe or draw the sword · hood up or down | Y · O |
| Answer a guard who challenges you | E |
| Mount · dismount · whistle for your horse | F |
| Gallop · walk while mounted | Shift · C |
| Journal · perks · craft · map · lore · stash | Tab · P · M · 1-9 |
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

Debug URL params: `?debug&nomenu&skipintro&at=x,y,z&yaw=&pitch=&hour=`.

## Systems
- Day/night clock with NPC schedules (work, sleep, pray, patrol, wander) and A* navigation.
- Guard AI: sight cone, light and noise perception, investigate/search/chase, alarms, reactions to bodies and snuffed torches.
- Physics: ragdoll deaths, lootable bodies, breakable and throwable props, doors, explosions via Gravebreaker.
- Story: cutscenes, branching dialogue, notes, side quests, several endings paths, all synthesized audio.
- Quiet life: sheathe the sword, change your hood, look like a citizen, talk your way past guards with odds on every choice; guards act on what you do and what they have been told, not on seeing you (see the Round 7 section of FEATURES.md).
- Living wild: deer, wolves, crows, a horse to ride, a travelling caravan, buried treasure, roadside encounters, three boss fights and a leasable cabin with a stash (see the Round 6 section of FEATURES.md).

## Layout
`src/` game code (`game.js`, `player.js`, `npc.js`, `story.js`, `ui.js`, `pixel.js`, ...), `src/people/` models and animation clips, `src/level/` procedural level, `tools/` dev viewers.
