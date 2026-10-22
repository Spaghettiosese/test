(function(){ const GD = (window.GD = window.GD || {});
// ===== ACTS II & III: new locations, NPCs, schedules. Loaded after world.js. =====
GD.meta.days = [ null,
  { n:1, name:"Tuesday",   start:450 },   // 07:30
  { n:2, name:"Wednesday", start:420 },   // 07:00
  { n:3, name:"Thursday",  start:420 } ]; // 07:00 — the Jubilee, Grand Harmony at 20:00 (1200)
GD.meta.jubileeTime = 1170;   // 19:30: `jubilee_call` auto-fires on day 3

const L = GD.locations;

// ---- extend the courtyard: dormitory + library doors, street gate from day 2
L.courtyard.props.push(
  {t:"door", side:"l", x:0, y:4, w:1, h:2, v:1, label:"Dormitory"},
  {t:"door", side:"l", x:0, y:9, w:1, h:2, v:2, label:"Library"}
);
L.courtyard.exits.forEach(e => { if (e.id === "to_gate") e.showIf = "day < 2"; });
L.courtyard.exits.push(
  {id:"to_dorm",    x:1, y:5, to:"dorm",    toX:2, toY:6, label:"Dormitory"},
  {id:"to_library", x:1, y:10, to:"library", toX:2, toY:7, label:"Library"},
  {id:"to_street",  x:1, y:12, to:"street",  toX:3, toY:10, label:"Karsov Avenue (school gate)", showIf:"day >= 2"}
);

GD.locations.dorm = { id:"dorm", name:"Dormitory, Third Floor", w:14, h:12, floor:"wood", wall:"plaster", mood:"lamp",
  desc:"Twelve bunks, one hotplate, a window that has been painted shut by someone with more faith than skill. Your bunk is by the radiator.",
  spawn:{x:2,y:6},
  props:[
    {t:"bunk", x:4, y:2, w:2, h:1, v:0}, {t:"bunk", x:7, y:2, w:2, h:1, v:1}, {t:"bunk", x:10, y:2, w:2, h:1, v:0, label:"Your bunk"},
    {t:"wardrobe", side:"l", x:0, y:2, w:1, h:3, v:0},
    {t:"hotplate", x:11, y:8, w:1, h:1, v:0, label:"Hotplate"}, {t:"table", x:8, y:7, w:3, h:1, v:1},
    {t:"chair", x:8, y:8, w:1, h:1, v:0}, {t:"chair", x:10, y:8, w:1, h:1, v:1},
    {t:"window", side:"r", x:6, y:0, w:2, h:1, v:2}, {t:"window", side:"r", x:11, y:0, w:1, h:1, v:1},
    {t:"door", side:"l", x:0, y:6, w:1, h:2, v:0, label:"To the Courtyard"},
    {t:"radiator", side:"r", x:3, y:0, w:2, h:1, v:0}, {t:"notice", side:"l", x:0, y:9, w:1, h:2, v:2, label:"Corridor board"},
    {t:"lamp", x:6, y:5, w:1, h:1, v:1}, {t:"rug", x:4, y:4, w:4, h:3, v:1, walk:true}, {t:"crate", x:12, y:10, w:1, h:1, v:1, label:"Footlocker"},
    {t:"portrait", side:"r", x:9, y:0, w:2, h:1, v:0, label:"The Warden"}
  ],
  objects:[
    {id:"d_bunk", x:11, y:3, label:"Your bunk"}, {id:"d_footlocker", x:12, y:10, label:"Footlocker"}, {id:"d_window", x:6, y:0, label:"Painted-shut window"},
    {id:"d_hotplate", x:11, y:8, label:"Hotplate"}, {id:"d_board", x:0, y:9, label:"Corridor board"}
  ],
  npcs:["matron","dov","wren"],
  exits:[{id:"to_courtyard", x:1, y:6, to:"courtyard", toX:2, toY:5, label:"Courtyard"}]
};

GD.locations.library = { id:"library", name:"The Library", w:16, h:12, floor:"wood", wall:"plaster", mood:"warm",
  desc:"Floor-to-ceiling shelves, a card catalogue like a church organ, and a rope across the back stacks that says AUTHORISED READERS in the font of someone who is not worried.",
  spawn:{x:2,y:7},
  props:[
    {t:"bookshelf", side:"r", x:1, y:0, w:6, h:1, v:1}, {t:"bookshelf", side:"r", x:9, y:0, w:6, h:1, v:0},
    {t:"bookshelf", side:"l", x:0, y:1, w:1, h:4, v:1},
    {t:"catalog", x:5, y:4, w:3, h:1, v:0, label:"Card catalogue"},
    {t:"table", x:9, y:5, w:4, h:1, v:0}, {t:"table", x:9, y:8, w:4, h:1, v:1}, {t:"chair", x:10, y:6, w:1, h:1, v:0}, {t:"chair", x:12, y:9, w:1, h:1, v:1},
    {t:"globe", x:14, y:2, w:1, h:1, v:0, label:"Globe"}, {t:"fence", x:5, y:2, w:1, h:1, v:0, walk:true}, 
    {t:"curtain", side:"r", x:7, y:0, w:2, h:1, v:0, label:"AUTHORISED READERS"},
    {t:"door", side:"l", x:0, y:7, w:1, h:2, v:0, label:"To the Courtyard"},
    {t:"stairs", x:14, y:9, w:2, h:2, v:1, walk:true, label:"Spiral stair to the tower"},
    {t:"lamp", x:8, y:3, w:1, h:1, v:0}, {t:"lamp", x:13, y:7, w:1, h:1, v:1}, {t:"plant", x:2, y:10, w:1, h:1, v:1}, {t:"rug", x:4, y:6, w:4, h:3, v:2, walk:true}
  ],
  objects:[
    {id:"l_catalog", x:6, y:4, label:"Card catalogue"}, {id:"l_stacks", x:7, y:1, label:"The back stacks (roped off)"},
    {id:"l_table", x:11, y:5, label:"Reading table"}, {id:"l_globe", x:14, y:2, label:"Globe"}
  ],
  npcs:["ysolde","quill","corvin"],
  exits:[
    {id:"to_courtyard", x:1, y:7, to:"courtyard", toX:2, toY:10, label:"Courtyard"},
    {id:"to_tower", x:14, y:9, to:"tower", toX:4, toY:7, label:"Up to the Bell Tower", lock:"!flag.tower_open", lockedDialogue:"tower_door"}
  ]
};

GD.locations.street = { id:"street", name:"Karsov Avenue", w:20, h:14, floor:"asphalt", wall:"brick", mood:"neon",
  desc:"District 9's one wide street: tram wires, ration queues, posters in layers like geology, and a loudspeaker on every third lamp-post, patiently waiting for evening.",
  spawn:{x:3,y:10},
  props:[
    {t:"fence", side:"l", x:0, y:0, w:1, h:14, v:1}, {t:"poster_wall", side:"r", x:2, y:0, w:6, h:1, v:0, label:"Poster wall"},
    {t:"kiosk", x:9, y:2, w:2, h:2, v:0, label:"Newspaper kiosk"}, {t:"stall", x:13, y:3, w:3, h:2, v:1, label:"Black-market stall"},
    {t:"tram_stop", x:16, y:9, w:2, h:2, v:0, label:"Tram stop"}, {t:"streetlamp", x:6, y:8, w:1, h:1, v:0}, {t:"streetlamp", x:12, y:9, w:1, h:1, v:1},
    {t:"loudspeaker", x:8, y:6, w:1, h:1, v:0, label:"Loudspeaker pole"}, {t:"barrier", x:4, y:5, w:1, h:3, v:0, label:"Queue rope"},
    {t:"vault_door", side:"r", x:15, y:0, w:2, h:1, v:0, label:"District Relay No. 4 (gate)"}, {t:"car", x:18, y:4, w:2, h:1, v:0, label:"Black car"},
    {t:"tree", x:2, y:12, w:1, h:1, v:1}, {t:"barrel", x:11, y:5, w:1, h:1, v:0}, {t:"lamp", x:7, y:12, w:1, h:1, v:0}
  ],
  objects:[
    {id:"s_posters", x:4, y:0, label:"Poster wall"}, {id:"s_queue", x:4, y:6, label:"Ration queue"}, {id:"s_kiosk", x:9, y:4, label:"Newspaper kiosk"},
    {id:"s_tram", x:16, y:11, label:"Tram stop"}, {id:"s_relaygate", x:15, y:1, label:"Relay Station gate"}, {id:"s_car", x:18, y:5, label:"Black car"}
  ],
  npcs:["nadia","voss","gregor"],
  exits:[
    {id:"to_courtyard", x:2, y:10, to:"courtyard", toX:2, toY:12, label:"School gate"},
    {id:"to_relay", x:16, y:1, to:"relay", toX:3, toY:8, label:"District Relay No. 4", lock:"!flag.relay_access", lockedDialogue:"relay_door"}
  ]
};

GD.locations.relay = { id:"relay", name:"District Relay No. 4", w:14, h:12, floor:"metal", wall:"tiled", mood:"storm",
  desc:"A concrete box that hums at a pitch your fillings can read. Valves, glass tubes, a tape vault with a wheel like a ship's, and a window onto the sort of dark that has paperwork.",
  spawn:{x:3,y:8},
  props:[
    {t:"console", x:5, y:2, w:5, h:2, v:0, label:"Broadcast console"}, {t:"vault_door", side:"r", x:11, y:0, w:2, h:1, v:1, label:"Tape vault"},
    {t:"generator", x:11, y:6, w:2, h:2, v:0, label:"Generator"}, {t:"pipes", side:"l", x:0, y:0, w:1, h:12, v:0},
    {t:"desk", x:3, y:4, w:2, h:1, v:1, label:"Logbook desk"}, {t:"chair", x:3, y:5, w:1, h:1, v:0},
    {t:"antenna", side:"r", x:3, y:0, w:1, h:1, v:0}, {t:"ladder", side:"r", x:7, y:0, w:1, h:1, v:0, label:"Ladder to the aerial deck"},
    {t:"door", side:"l", x:0, y:7, w:1, h:2, v:0, label:"To the street"}, {t:"lamp", x:8, y:7, w:1, h:1, v:1}, {t:"crate", x:9, y:9, w:2, h:1, v:0},
    {t:"rug", x:4, y:7, w:3, h:3, v:0, walk:true}, {t:"loudspeaker", side:"l", x:0, y:2, w:1, h:2, v:1}
  ],
  objects:[
    {id:"r_console", x:7, y:4, label:"Broadcast console"}, {id:"r_vault", x:11, y:1, label:"Tape vault"}, {id:"r_logbook", x:4, y:4, label:"Logbook"},
    {id:"r_generator", x:11, y:6, label:"Generator"}, {id:"r_aerial", x:7, y:1, label:"Ladder to the aerial deck"}
  ],
  npcs:["tomas","brune"],
  exits:[{id:"to_street", x:1, y:8, to:"street", toX:16, toY:2, label:"Street"}]
};

GD.locations.tower = { id:"tower", name:"The Bell Tower", w:10, h:10, floor:"wood", wall:"brick", mood:"storm",
  desc:"The school's one tall thing. Ropes, pigeons, a bell the size of a small truck, and a view of the whole grey district waiting for evening.",
  spawn:{x:4,y:7},
  props:[
    {t:"bigbell", x:4, y:3, w:3, h:3, v:0, label:"The Great Bell"}, {t:"ropes", x:2, y:2, w:1, h:2, v:0, label:"Bell ropes"},
    {t:"loudspeaker", x:7, y:7, w:1, h:1, v:0, label:"Speaker array"}, {t:"loudspeaker", x:8, y:5, w:1, h:1, v:1},
    {t:"railing", side:"r", x:0, y:0, w:10, h:1, v:0}, {t:"railing", side:"l", x:0, y:0, w:1, h:10, v:0},
    {t:"window", side:"r", x:3, y:0, w:2, h:1, v:1}, {t:"window", side:"r", x:7, y:0, w:2, h:1, v:2},
    {t:"stairs", x:3, y:8, w:2, h:2, v:0, walk:true, label:"Stair down"}, {t:"lamp", x:2, y:6, w:1, h:1, v:0}, {t:"crate", x:8, y:8, w:1, h:1, v:0}
  ],
  objects:[
    {id:"w_bell", x:5, y:6, label:"The Great Bell"}, {id:"w_ropes", x:2, y:4, label:"Bell ropes"}, {id:"w_array", x:7, y:7, label:"Speaker array"}, {id:"w_view", x:3, y:1, label:"The view"}
  ],
  npcs:["hob"],
  exits:[{id:"to_library", x:4, y:8, to:"library", toX:13, toY:9, label:"Down to the Library"}]
};

// ---- new NPCs (dialogue id == npc id; day variants: <id>_d2, <id>_d3)
Object.assign(GD.npcs, {
  matron:  { id:"matron", name:"Matron Hallow Pritt", role:"Dormitory matron", loc:"dorm", x:6, y:8, facing:"e", color:"#c9a0a0",
    look:{skin:"#e6c9b4", hair:"#9d9ba0", hairStyle:"bun", outfit:"cardigan", outfitColor:"#6f5a63", accent:"#b85a5a", build:"heavy", glasses:true, age:"old", pose:"stand", extra:"clipboard"} },
  dov:     { id:"dov", name:"Dov Kessel", role:"Roommate, small-time dealer", loc:"dorm", x:9, y:5, facing:"w", color:"#d8b060",
    look:{skin:"#c79b7c", hair:"#3a2a1c", hairStyle:"curly", outfit:"shirtsleeves", outfitColor:"#8a6a3a", accent:"#d8b04a", build:"avg", glasses:false, age:"teen", pose:"lean", extra:"cigarette"} },
  wren:    { id:"wren", name:"Wren", role:"First-year, runs messages", loc:"dorm", x:12, y:7, facing:"w", color:"#a0c8b0",
    look:{skin:"#e3c1a5", hair:"#6a3a22", hairStyle:"bob", outfit:"uniform", outfitColor:"#3f4d5c", accent:"#c9892f", build:"slim", glasses:false, age:"teen", pose:"stand", extra:"none"} },
  ysolde:  { id:"ysolde", name:"Librarian Ysolde Crane", role:"Head librarian", loc:"library", x:6, y:3, facing:"s", color:"#a8b8d8",
    look:{skin:"#dcb9a0", hair:"#2a2a30", hairStyle:"bun", outfit:"cardigan", outfitColor:"#3f4a5c", accent:"#c9a54a", build:"slim", glasses:true, age:"adult", pose:"stand", extra:"book"} },
  quill:   { id:"quill", name:"Ambrose Quill", role:"Retired history teacher", loc:"library", x:10, y:7, facing:"e", color:"#c8b890",
    look:{skin:"#d4ae94", hair:"#e0ddd4", hairStyle:"bald", outfit:"suit", outfitColor:"#5a5648", accent:"#8a3b2b", build:"slim", glasses:true, age:"old", pose:"sit", extra:"book"} },
  corvin:  { id:"corvin", name:"Corvin Hale", role:"Student, Vanguard hopeful", loc:"library", x:12, y:8, facing:"w", color:"#8fb0a0",
    look:{skin:"#e8c8b0", hair:"#4a3a2a", hairStyle:"short", outfit:"uniform", outfitColor:"#3f4d5c", accent:"#b03030", build:"avg", glasses:true, age:"teen", pose:"sit", extra:"book"} },
  nadia:   { id:"nadia", name:"Nadia Fell", role:"Tram conductor, black marketeer", loc:"street", x:14, y:5, facing:"s", color:"#e08a6a",
    look:{skin:"#b98a6a", hair:"#1c1418", hairStyle:"long", outfit:"coat", outfitColor:"#6a3a30", accent:"#d8b04a", build:"avg", glasses:false, age:"adult", pose:"lean", extra:"cigarette"} },
  voss:    { id:"voss", name:"Inspector Hale Voss", role:"State Inspectorate", loc:"street", x:17, y:6, facing:"w", color:"#b0b8c0",
    look:{skin:"#e0c4ae", hair:"#8a8a8c", hairStyle:"slick", outfit:"coat", outfitColor:"#2a2e34", accent:"#c9a54a", build:"slim", glasses:false, age:"adult", pose:"stand", extra:"clipboard"} },
  gregor:  { id:"gregor", name:"Old Gregor", role:"Kiosk keeper, radio repairman", loc:"street", x:10, y:5, facing:"s", color:"#b8a078",
    look:{skin:"#c4a088", hair:"#b8b4aa", hairStyle:"cap", outfit:"overalls", outfitColor:"#5a5a4a", accent:"#8a6a3a", build:"heavy", glasses:true, age:"old", pose:"stand", extra:"none"} },
  tomas:   { id:"tomas", name:"Engineer Tomas Wend", role:"Relay operator", loc:"relay", x:7, y:5, facing:"s", color:"#90c0d0",
    look:{skin:"#d4b098", hair:"#4a4a50", hairStyle:"buzz", outfit:"labcoat", outfitColor:"#b8b4a4", accent:"#c9892f", build:"slim", glasses:true, age:"adult", pose:"sit", extra:"none"} },
  brune:   { id:"brune", name:"Captain Brune", role:"Relay guard", loc:"relay", x:10, y:8, facing:"w", color:"#c07070",
    look:{skin:"#d0a890", hair:"#2a1a1a", hairStyle:"buzz", outfit:"uniform", outfitColor:"#4a3a3a", accent:"#d8b04a", build:"heavy", glasses:false, age:"adult", pose:"stand", extra:"megaphone"} },
  hob:     { id:"hob", name:"Hob the Bellringer", role:"Bellringer (does not speak)", loc:"tower", x:3, y:5, facing:"e", color:"#a09888",
    look:{skin:"#b89c84", hair:"#cfcac0", hairStyle:"bald", outfit:"overalls", outfitColor:"#6a5e4e", accent:"#8a3b2b", build:"avg", glasses:false, age:"old", pose:"lean", extra:"none"} }
});

// ---- NPC schedules. `days[n]` overrides home; `loc:null` = absent. `hideIf` cond hides the NPC. Day-1 home otherwise.
Object.assign(GD.npcs.vasha,   { days:{ 2:{loc:"canteen",x:5,y:6}, 3:{loc:"canteen",x:5,y:6} } }); // follower: only applies until met_vasha
Object.assign(GD.npcs.bronka,  { days:{ 2:{loc:"canteen",x:7,y:1}, 3:{loc:"canteen",x:7,y:1} } });
Object.assign(GD.npcs.ilsabet, { days:{ 2:{loc:"library",x:9,y:6,facing:"e"}, 3:{loc:"boiler",x:6,y:5,facing:"e"} } });
Object.assign(GD.npcs.fenwick, { days:{ 2:{loc:"canteen",x:13,y:7}, 3:{loc:"canteen",x:13,y:7} } });
Object.assign(GD.npcs.lemmy,   { days:{ 2:{loc:"courtyard",x:5,y:6}, 3:{loc:"dorm",x:10,y:9} } });
Object.assign(GD.npcs.osk,     { hideIf:"flag.osk_scapegoat", days:{ 2:{loc:"gym",x:3,y:9}, 3:{loc:"courtyard",x:6,y:8} } });
Object.assign(GD.npcs.rhea,    { days:{ 2:{loc:"gym",x:9,y:9}, 3:{loc:"street",x:12,y:7} } });
Object.assign(GD.npcs.marr,    { days:{ 2:{loc:"office",x:6,y:2}, 3:{loc:"office",x:6,y:2} } });
Object.assign(GD.npcs.anka,    { days:{ 2:{loc:"boiler",x:5,y:6}, 3:{loc:"boiler",x:5,y:6} } });
Object.assign(GD.npcs.ostrov,  { hideIf:"day >= 2" });          // the body is removed overnight
Object.assign(GD.npcs.voss,    { hideIf:"day < 2" });            // arrives on day 2
Object.assign(GD.npcs.matron,  { days:{ 3:{loc:"dorm",x:6,y:8} } });
Object.assign(GD.npcs.tomas,   { hideIf:"flag.tomas_arrested" });
GD.meta.newEndings = ["end_wake","end_wardens_eye","end_martyr","end_silenced","end_exodus"];
})();
