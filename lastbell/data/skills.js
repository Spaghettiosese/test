(function(){ const GD = (window.GD = window.GD || {});

GD.attributes = {
  intellect: { id:"intellect", name:"Intellect", color:"#6d93b5",
    blurb:"How well you think. Not how well you think you think, which is a separate stat and is always 10." },
  psyche:    { id:"psyche", name:"Psyche", color:"#b0749a",
    blurb:"The squishy interior: feelings, nerve, the knack of reading a room before the room reads you." },
  physique:  { id:"physique", name:"Physique", color:"#b8663f",
    blurb:"Meat, bone and the three things the meat wants. School No. 9 feeds it cabbage and expects gratitude." },
  motorics:  { id:"motorics", name:"Motorics", color:"#5fa8a0",
    blurb:"Hands, eyes, feet and the quiet muscles of not getting caught. Mostly useful when somebody is watching." }
};

// 24 skills. Effective level = attribute + learned + modifiers (cap GD.rules.skillCap).
GD.skills = {
  // ---- INTELLECT
  dialectics: { id:"dialectics", name:"Dialectics", attribute:"intellect", color:"#6d93b5", icon:"Dl",
    blurb:"Cold logic, applied like a ruler to knuckles. Finds the contradiction in every sentence, including the ones you would rather keep.",
    voice:"A debate-club ghost who has never lost an argument because he never leaves the room." },
  rote: { id:"rote", name:"Rote", attribute:"intellect", color:"#8f9fc0", icon:"Rt",
    blurb:"Everything you were ever made to recite, still recited. Slogans, oaths, the nine Virtues of the Youth Pioneer, and the second verse nobody knows.",
    voice:"A chanting metronome that answers questions by finishing the slogan." },
  deduction: { id:"deduction", name:"Deduction", attribute:"intellect", color:"#5b86a3", icon:"Dd",
    blurb:"Turns a boot-print into a biography. Wrong about half the time, but wrong in complete sentences.",
    voice:"A smug small-town inspector who narrates in the past perfect." },
  rhetoric: { id:"rhetoric", name:"Rhetoric", attribute:"intellect", color:"#a38fc4", icon:"Rh",
    blurb:"The art of winning an argument you were assigned. Gestures included, conscience optional.",
    voice:"A podium with opinions, always one pause away from applause." },
  doublethink: { id:"doublethink", name:"Doublethink", attribute:"intellect", color:"#8c3f4f", icon:"Dt",
    blurb:"The State's own voice, installed in your head at no charge. Fluent in what you are supposed to believe, and fluent in believing it. It has also been known to file reports.",
    voice:"A warm, reasonable official who agrees with whoever is listening, and is." },
  archive: { id:"archive", name:"Archive", attribute:"intellect", color:"#b9ae8a", icon:"Ar",
    blurb:"The pedantic librarian in your skull. Dates, names, forms, regulation numbers and which stamp goes in which corner.",
    voice:"A dry little clerk who says 'actually, per Regulation 14(b)' at funerals." },

  // ---- PSYCHE
  empathy: { id:"empathy", name:"Empathy", attribute:"psyche", color:"#b0749a", icon:"Em",
    blurb:"Feels what the room feels, including the mop. Excellent with people, ruinous with corpses.",
    voice:"A soft, tired voice that apologises to furniture." },
  volition: { id:"volition", name:"Volition", attribute:"psyche", color:"#9283bd", icon:"Vo",
    blurb:"The part of you that gets out of bed. Keeps the other voices from voting you into a ditch.",
    voice:"A calm, slightly exhausted class monitor for the inside of your head." },
  authority: { id:"authority", name:"Authority", attribute:"psyche", color:"#b8862e", icon:"Au",
    blurb:"Bearing, command and the posture of someone who has the key. Works best on people who already want to be told.",
    voice:"A boot heel on parquet: short sentences, no questions." },
  instinct: { id:"instinct", name:"Instinct", attribute:"psyche", color:"#7fae8e", icon:"In",
    blurb:"Hunches and the hair on your neck. Right more often than it has any business being, and never sorry when it is wrong.",
    voice:"An animal in a school uniform, sniffing the corridor." },
  charm: { id:"charm", name:"Charm", attribute:"psyche", color:"#e6b08a", icon:"Ch",
    blurb:"A smile that has been rationed and saved up. Opens doors, sweet rolls and, occasionally, the wrong conversation.",
    voice:"A honey-voiced understudy who is always, slightly, auditioning." },
  solidarity: { id:"solidarity", name:"Solidarity", attribute:"psyche", color:"#cc6b6b", icon:"So",
    blurb:"The warm murmur of the many, speaking as 'we'. Comforting, brave, and dangerously good at volunteering you for things. Has been known to be overheard.",
    voice:"A crowd that never needs a microphone, and never sleeps alone." },

  // ---- PHYSIQUE
  stamina: { id:"stamina", name:"Stamina", attribute:"physique", color:"#7d9a5f", icon:"St",
    blurb:"The long-distance body. Climbs stairs, skips lunch, outlasts assemblies.",
    voice:"A grim marathon coach who whispers, 'one more corridor.'" },
  grit: { id:"grit", name:"Grit", attribute:"physique", color:"#8f7a5a", icon:"Gr",
    blurb:"Pain tolerance and the ability to look at a thing you would rather not. Hangs on like mildew.",
    voice:"A gravel-throated nurse who says 'it's only a hand, you have another.'" },
  brawn: { id:"brawn", name:"Brawn", attribute:"physique", color:"#a8603f", icon:"Bw",
    blurb:"Raw shove. Doors, crates and opinions are all structurally similar when you lean on them.",
    voice:"A shrugging wall that has never needed an adjective." },
  appetite: { id:"appetite", name:"Appetite", attribute:"physique", color:"#cf7f3f", icon:"Ap",
    blurb:"Tea, tobacco, sweet rolls, sugar, scraps. The mouth has a seat on the committee and it votes every four minutes.",
    voice:"A wheedling stomach with a rhetorical gift for 'just one'." },
  adrenaline: { id:"adrenaline", name:"Adrenaline", attribute:"physique", color:"#c4452f", icon:"Ad",
    blurb:"Impulse, rage and rush. Does first, apologises to the wall afterwards.",
    voice:"A fist with a pulse, shouting from the bottom of a stairwell." },
  the_grey: { id:"the_grey", name:"The Grey", attribute:"physique", color:"#7e8a8c", icon:"Gy",
    blurb:"The city itself: concrete, damp, weather, a hundred thousand windows. It has been waiting a long time to talk to someone.",
    voice:"A slow, damp murmur from the walls, speaking in drains and drizzle." },

  // ---- MOTORICS
  aim: { id:"aim", name:"Aim", attribute:"motorics", color:"#5fa8a0", icon:"Am",
    blurb:"Hand-eye precision. Throws, taps, pours and points with the cold confidence of someone who once won a ribbon.",
    voice:"A steady breath held a half-second too long." },
  reflex: { id:"reflex", name:"Reflex", attribute:"motorics", color:"#8fc0b0", icon:"Rf",
    blurb:"Catches the falling thing before you know it fell. Sometimes also catches the thing that was being thrown away.",
    voice:"A twitch that finished your sentence before you started it." },
  composure: { id:"composure", name:"Composure", attribute:"motorics", color:"#6e8f8a", icon:"Co",
    blurb:"Poker face and posture. Keeps your eyebrows in the uniform and your hands out of your pockets.",
    voice:"A pressed collar with no expression at all." },
  slip: { id:"slip", name:"Slip", attribute:"motorics", color:"#4f6f7a", icon:"Sl",
    blurb:"Stealth and lockpicking-lite. Moves like a rumour; opens things that are technically somebody else's.",
    voice:"A whisper in the doorframe saying 'not yet.'" },
  sleight: { id:"sleight", name:"Sleight", attribute:"motorics", color:"#a8b86a", icon:"Sh",
    blurb:"Pockets, palms and forgery. Your fingers have a separate, better education than the rest of you.",
    voice:"Ten cheerful thieves in a trench coat made of cuffs." },
  senses: { id:"senses", name:"Senses", attribute:"motorics", color:"#c7c26a", icon:"Sn",
    blurb:"Notices the smell of the tea, the creak behind the curtain and the thing nobody wanted noticed.",
    voice:"A twitching nose and a pair of ears that never clock out." }
};

// Tier names for effective skill level 0..10 (index = level). Use GD.levelName(n).
GD.levelNames = ["Absent", "Untrained", "Truant", "Probationary", "Passable", "Commendable", "Prefect", "Honour Roll", "Exemplary", "Heroic", "Legendary"];
GD.levelName = function(n){ n = Math.max(0, Math.min(GD.levelNames.length - 1, Math.round(n))); return GD.levelNames[n]; };

// Character creation. attrs sum to 12, each 1..5. `learned` = signature skill, added to attribute-derived level.
GD.archetypes = {
  model_pupil: { id:"model_pupil", name:"The Model Pupil",
    attrs:{ intellect:5, psyche:2, physique:1, motorics:4 }, learned:{ archive:2 },
    description:"Perfect attendance, perfect posture, perfect carbon copies. You know the regulations and the regulations know you. Your body has never been consulted about any of this." },
  back_row_cynic: { id:"back_row_cynic", name:"The Back-Row Cynic",
    attrs:{ intellect:4, psyche:4, physique:1, motorics:3 }, learned:{ dialectics:2 },
    description:"Third seat from the window, hood of the mind permanently up. You have heard every slogan and you have notes. You have not turned any of them in." },
  team_captain: { id:"team_captain", name:"The Team Captain",
    attrs:{ intellect:1, psyche:3, physique:5, motorics:3 }, learned:{ authority:2 },
    description:"Whistle round the neck, dignity round the ankles. People do what you say because you are standing very close. Nobody has ever asked you for a second paragraph." },
  pickpocket_prodigy: { id:"pickpocket_prodigy", name:"The Pickpocket Prodigy",
    attrs:{ intellect:3, psyche:2, physique:2, motorics:5 }, learned:{ sleight:2 },
    description:"Coupons are currency, and currency is a matter of who is holding it. You have never stolen anything you did not need, and you have needed a great deal." },
  quiet_poet: { id:"quiet_poet", name:"The Quiet Poet",
    attrs:{ intellect:3, psyche:5, physique:1, motorics:3 }, learned:{ empathy:2 },
    description:"Your notebook is full of lines about the ceiling. You feel everything at a faint distance, like a radio in the next flat. Sometimes the next flat is you." },
  custom: { id:"custom", name:"Custom Student",
    attrs:null, learned:{},
    description:"Distribute 12 points across the four attributes (1 to 5 each). No signature skill, no reputation, no excuses. Choose your own flaws; the Union will happily supply the rest." }
};
GD.defaultArchetype = "back_row_cynic";

GD.rules = {
  startHp: 10, startMorale: 10, maxHp: 10, maxMorale: 10,
  startSurv: 5, maxSurv: 100,
  skillCap: 10,
  attrMin: 1, attrMax: 5, attrPoints: 12,
  startXp: 0,
  // Learning a skill from level L (learned bonus) to L+1 costs xpCost(L). Total effective level capped at skillCap.
  xpCost: function(learned){ return 2 + Math.floor(learned * 1.5); },   // 2,3,5,6,8,9,11 ...
  xpCostTable: [2, 3, 5, 6, 8, 9, 11, 12, 14, 15],
  difficulty: { trivial:6, easy:8, medium:10, challenging:12, formidable:14, legendary:16 },
  diffWords: [[6,"Trivial"],[8,"Easy"],[10,"Medium"],[12,"Challenging"],[14,"Formidable"],[16,"Legendary"]],
  diffWord: function(n){ let w = "Trivial"; for (const [v, name] of GD.rules.diffWords) if (n >= v) w = name; return w; },
  check: {
    dice: "2d6", autoFail: 2, autoSuccess: 12,
    description: "Roll two six-sided dice, add the skill's effective level and any situational modifier. Meet or beat the difficulty to pass. A natural 2 always fails; a natural 12 always passes. Red checks may be attempted once, ever. White checks may be retried after the skill rises.",
    passive: "A passive check fires on its own when the skill level is at least the line's 'min'. No roll, no risk, no way to switch it off."
  },
  // Chance function so the UI and DESIGN.md use one formula. mod = situational modifier.
  chance: function(level, diff, mod){
    const need = diff - level - (mod || 0); let ok = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      const s = a + b; if (s === 2) continue; if (s === 12 || s >= need) ok++;
    }
    return ok / 36;
  },
  // Game-minute costs. A dialogue visit already costs dialogue minutes automatically.
  time: { dialogue: 2, examine: 5, search: 15, longSearch: 20, walkPerTile: 0.25, exitTransition: 3, rest: 30, eat: 5, smoke: 5, research: "per thought, see GD.thoughts[*].minutes" },
  // Surveillance thresholds (UI hints / engine cues)
  survTiers: [[0,"Unnoticed"],[20,"On a list"],[40,"Watched"],[60,"Flagged"],[80,"Wanted"],[100,"Arrested"]],
  survTier: function(n){ let w = "Unnoticed"; for (const [v, name] of GD.rules.survTiers) if (n >= v) w = name; return w; },
  informer: {
    skills: ["doublethink", "solidarity"],
    note: "When these skills interject with a 'report' line the engine may apply the line's own surv effect; see DESIGN.md."
  }
};

})();
