// Story Acts II and III (sv3_acts): "The Tidekeeper's Letters" (Year 1 summer to winter, chapters 10-24) and "The Second Year"
// (Year 2, chapters 25-40). Act IV is owned by sv3_years, which reads act2_done / act3_done, the actsComplete bus event and
// state.sv3_acts.actsEnding. Import order matters: state and kit first, then art, minigames, the acts, dressing and UI.
import './state.js';
import './kit.js';
import './art.js';
import '../../minigames/sv3_acts/index.js';
import './act2.js';
import './act3.js';
import './dressing.js';
import './system.js';
import './ui.js';
