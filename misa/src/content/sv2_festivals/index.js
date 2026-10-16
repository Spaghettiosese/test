// Entry point for the Festival Set Pieces slice (Stardew-grade festivals): Flower Dance, Egg Hunt, Tide Luau,
// Moonlight Jellies, Grange Display, Secret Gift, Ice Fishing Day, Midnight Countdown, the Festival Album phone app and
// six seasonal mini events. Import order matters: data, UI + backdrops, minigames, then the pieces that use them.
import './data.js';
import './scenes.js';
import '../../minigames/sv2_festivals/games.js';
import './pieces.js';
import './mini.js';
import './features.js';
