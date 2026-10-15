(function(){ const GD = (window.GD = window.GD || {});

GD.meta = {
  title: "LAST BELL",
  subtitle: "A Day at School No. 9",
  startTime: 450,        // 07:30
  examTime: 1020,        // 17:00
  curfew: 1260,          // 21:00
  startLocation: "theatre", startX: 4, startY: 5,
  defaultName: "Sel Voran"
};

GD.playerLook = { skin:"#d9a98a", hair:"#2a1d18", hairStyle:"short", outfit:"uniform", outfitColor:"#3f4d5c", accent:"#c9892f",
  build:"slim", glasses:true, age:"teen", pose:"stand", extra:"none" };

// Wall props: side 'l' = wall on the x=0 edge (position along y), side 'r' = wall on the y=0 edge (position along x).
GD.locations = {

  theatre: { id:"theatre", name:"The Old Theatre", w:14, h:10, floor:"wood", wall:"plaster", mood:"umber",
    desc:"The shuttered assembly theatre. Dust, folded flags, a stage nobody has been allowed to stand on since the spring.",
    spawn:{x:5,y:5},
    props:[
      {t:"stage", x:0, y:2, w:4, h:6, v:0, walk:true, label:"Stage"},
      {t:"curtain", side:"l", x:0, y:1, w:1, h:7, v:1},
      {t:"mic", x:2, y:4, w:1, h:1, v:1, label:"Dead mic stand"},
      {t:"bench", x:6, y:2, w:4, h:1, v:0},
      {t:"bench", x:6, y:4, w:4, h:1, v:1},
      {t:"bench", x:6, y:6, w:4, h:1, v:0},
      {t:"door", side:"r", x:11, y:0, w:2, h:1, v:0, label:"Door to the Ration Hall"},
      {t:"window", side:"r", x:3, y:0, w:2, h:1, v:1},
      {t:"window", side:"r", x:7, y:0, w:2, h:1, v:2},
      {t:"pennant", side:"l", x:0, y:9, w:1, h:1, v:0},
      {t:"banner", side:"r", x:5, y:0, w:2, h:1, v:0, label:"THE WARDEN HEARS"},
      {t:"lamp", x:3, y:1, w:1, h:1, v:0},
      {t:"crate", x:10, y:8, w:2, h:1, v:2, label:"Prop trunk"},
      {t:"plant", x:12, y:8, w:1, h:1, v:1},
      {t:"loudspeaker", side:"l", x:0, y:8, w:1, h:1, v:0, label:"Old PA horn"}
    ],
    objects:[
      {id:"t_mirror", x:1, y:7, label:"Cracked dressing mirror"},
      {id:"t_trunk",  x:10, y:8, label:"Prop trunk"},
      {id:"t_horn",   x:0, y:8, label:"Old PA horn"},
      {id:"t_poster", x:5, y:0, label:"Peeling poster"}
    ],
    npcs:["vasha"],
    exits:[{id:"to_canteen", x:11, y:1, to:"canteen", toX:2, toY:8, label:"Ration Hall"}]
  },

  canteen: { id:"canteen", name:"The Ration Hall", w:16, h:14, floor:"checker", wall:"brick", mood:"warm",
    desc:"Canteen by day, cabaret by decree. A zinc counter, a ring of tiles, a stage for the Anthem choir. Smells of boiled cabbage and ambition.",
    spawn:{x:2,y:8},
    props:[
      {t:"counter", x:4, y:2, w:8, h:2, v:0, label:"Serving counter"},
      {t:"stool", x:6, y:4, w:1, h:1, v:0}, {t:"stool", x:8, y:4, w:1, h:1, v:1}, {t:"stool", x:10, y:4, w:1, h:1, v:0},
      {t:"table", x:1, y:10, w:3, h:1, v:0}, {t:"table", x:1, y:12, w:3, h:1, v:1},
      {t:"bench", x:1, y:11, w:3, h:1, v:0},
      {t:"stage", x:12, y:6, w:4, h:5, v:1, walk:true, label:"Choir stage"},
      {t:"mic", x:13, y:8, w:1, h:1, v:0, label:"Stage microphone"},
      {t:"loudspeaker", x:15, y:5, w:1, h:1, v:1, label:"Loudspeaker pole"},
      {t:"portrait", side:"r", x:3, y:0, w:2, h:1, v:0, label:"The Warden"},
      {t:"notice", side:"r", x:13, y:0, w:2, h:1, v:1, label:"Notice board"},
      {t:"door", side:"l", x:0, y:7, w:1, h:2, v:0, label:"To the Old Theatre"},
      {t:"door", side:"r", x:14, y:0, w:2, h:1, v:1, label:"To the Courtyard"},
      {t:"door", side:"l", x:0, y:2, w:1, h:2, v:2, label:"To the Gymnasium"},
      {t:"pillar", x:7, y:7, w:1, h:1, v:0}, {t:"pillar", x:7, y:11, w:1, h:1, v:1},
      {t:"plant", x:3, y:4, w:1, h:1, v:0},
      {t:"tray", x:5, y:2, w:1, h:1, v:0, walk:true},
      {t:"lamp", x:10, y:10, w:1, h:1, v:1},
      {t:"rug", x:8, y:8, w:3, h:3, v:0, walk:true}
    ],
    objects:[
      {id:"c_menu", x:4, y:0, label:"Menu board"},
      {id:"c_tray", x:5, y:2, label:"Abandoned tray"},
      {id:"stage_mic", x:13, y:8, label:"Stage microphone"},
      {id:"c_notices", x:13, y:0, label:"Notice board"},
      {id:"c_speaker", x:15, y:5, label:"Loudspeaker pole"}
    ],
    npcs:["bronka","ilsabet","fenwick","lemmy"],
    exits:[
      {id:"to_theatre",   x:1, y:8,  to:"theatre",   toX:11, toY:2, label:"Old Theatre"},
      {id:"to_gym",       x:1, y:3,  to:"gym",       toX:2,  toY:6, label:"Gymnasium"},
      {id:"to_courtyard", x:14, y:1, to:"courtyard", toX:2,  toY:8, label:"Courtyard"}
    ]
  },

  gym: { id:"gym", name:"The Gymnasium", w:16, h:14, floor:"checker", wall:"plaster", mood:"cold",
    desc:"A hall built for a thousand drilling children. The Warden's portrait hangs torn beneath the north hoop; so does the Commissar.",
    spawn:{x:2,y:6},
    props:[
      {t:"hoop", x:8, y:3, w:1, h:1, v:0, label:"North hoop"},
      {t:"portrait", side:"r", x:7, y:0, w:3, h:1, v:2, label:"The torn portrait"},
      {t:"lockers", side:"l", x:0, y:8, w:1, h:5, v:0, label:"Lockers"},
      {t:"mat", x:6, y:5, w:4, h:3, v:1, walk:true, label:"Landing mats"},
      {t:"bench", x:11, y:10, w:4, h:1, v:0, label:"Bleacher bench"},
      {t:"bench", x:11, y:12, w:4, h:1, v:1},
      {t:"banner", side:"r", x:2, y:0, w:3, h:1, v:1, label:"STRONG BODIES SERVE ONE BELL"},
      {t:"banner", side:"r", x:12, y:0, w:3, h:1, v:2},
      {t:"door", side:"l", x:0, y:5, w:1, h:2, v:0, label:"To the Ration Hall"},
      {t:"window", side:"r", x:5, y:0, w:1, h:1, v:0}, {t:"window", side:"r", x:11, y:0, w:1, h:1, v:1},
      {t:"pillar", x:4, y:9, w:1, h:1, v:0},
      {t:"crate", x:13, y:2, w:2, h:1, v:0}, {t:"barrel", x:15, y:2, w:1, h:1, v:0},
      {t:"lamp", x:12, y:6, w:1, h:1, v:0},
      {t:"rope", x:9, y:4, w:1, h:1, v:0, walk:true}
    ],
    objects:[
      {id:"g_portrait", x:8, y:0, label:"The torn portrait"},
      {id:"g_mat", x:7, y:6, label:"Landing mats"},
      {id:"g_rope", x:9, y:5, label:"Coiled rope"},
      {id:"g_lockers", x:0, y:10, label:"Student lockers"},
      {id:"g_bench", x:13, y:10, label:"Bleacher bench"}
    ],
    npcs:["ostrov"],
    exits:[{id:"to_canteen", x:1, y:6, to:"canteen", toX:2, toY:3, label:"Ration Hall"}]
  },

  courtyard: { id:"courtyard", name:"The Courtyard", w:16, h:14, floor:"cobble", wall:"brick", mood:"dusk",
    desc:"A paved square of bad weather. The Statue of the Warden's Father stands in the middle, sunk into its own plinth, patient as a tooth.",
    spawn:{x:2,y:8},
    props:[
      {t:"statue", x:8, y:6, w:2, h:2, v:0, label:"Statue of the Warden's Father"},
      {t:"loudspeaker", x:4, y:3, w:1, h:1, v:0, label:"Loudspeaker pole"},
      {t:"tree", x:12, y:3, w:1, h:1, v:0}, {t:"tree", x:3, y:11, w:1, h:1, v:1},
      {t:"bench", x:11, y:10, w:3, h:1, v:0, label:"Park bench"},
      {t:"fence", side:"l", x:0, y:0, w:1, h:14, v:0},
      {t:"door", side:"r", x:2, y:0, w:2, h:1, v:0, label:"To the Ration Hall"},
      {t:"door", side:"r", x:12, y:0, w:2, h:1, v:1, label:"Principal's Office"},
      {t:"stairs", x:14, y:11, w:2, h:2, v:0, walk:true, label:"Stairs down to the boiler room"},
      {t:"door", x:15, y:12, w:1, h:1, v:3, walk:true},
      {t:"fence", side:"r", x:4, y:0, w:6, h:1, v:1},
      {t:"lamp", x:6, y:10, w:1, h:1, v:0}, {t:"lamp", x:13, y:6, w:1, h:1, v:1},
      {t:"bell", x:1, y:2, w:1, h:1, v:0, label:"Old school bell"},
      {t:"barrel", x:14, y:6, w:1, h:1, v:0}
    ],
    objects:[
      {id:"statue", x:8, y:6, label:"Statue of the Warden's Father"},
      {id:"loudspeaker", x:4, y:3, label:"Loudspeaker pole"},
      {id:"y_bench", x:12, y:10, label:"Park bench"},
      {id:"y_bell", x:1, y:2, label:"Old school bell"}
    ],
    npcs:["osk","rhea"],
    exits:[
      {id:"to_canteen", x:3, y:1, to:"canteen", toX:14, toY:2, label:"Ration Hall"},
      {id:"to_office",  x:13, y:1, to:"office", toX:3, toY:6, label:"Principal's Office"},
      {id:"to_boiler",  x:14, y:11, to:"boiler", toX:3, toY:3, label:"Boiler Room", lock:"!flag.boiler_unlocked", lockedDialogue:"boiler_door"},
      {id:"to_gate",    x:1, y:13, dialogue:"gate", label:"School Gate (home)"}
    ]
  },

  office: { id:"office", name:"The Principal's Office", w:12, h:10, floor:"tile", wall:"plaster", mood:"sick",
    desc:"A green room with a view of a green courtyard. A large desk guards a small woman.",
    spawn:{x:3,y:6},
    props:[
      {t:"desk", x:5, y:2, w:4, h:2, v:0, label:"Principal's desk"},
      {t:"chair", x:6, y:1, w:1, h:1, v:0}, {t:"chair", x:6, y:5, w:1, h:1, v:1},
      {t:"portrait", side:"r", x:5, y:0, w:2, h:1, v:1, label:"The Warden (framed)"},
      {t:"bookshelf", side:"l", x:0, y:1, w:1, h:4, v:0},
      {t:"window", side:"r", x:9, y:0, w:2, h:1, v:0},
      {t:"door", side:"r", x:2, y:0, w:2, h:1, v:0, label:"To the Courtyard"},
      {t:"rug", x:3, y:4, w:6, h:4, v:2, walk:true},
      {t:"plant", x:10, y:8, w:1, h:1, v:0}, {t:"lamp", x:9, y:2, w:1, h:1, v:0},
      {t:"vault", side:"l", x:0, y:6, w:1, h:2, v:0, label:"Records cabinet"}
    ],
    objects:[
      {id:"o_desk", x:5, y:4, label:"Principal's desk"},
      {id:"o_cabinet", x:1, y:6, label:"Records cabinet"},
      {id:"o_window", x:9, y:0, label:"Window"}
    ],
    npcs:["marr"],
    exits:[{id:"to_courtyard", x:3, y:1, to:"courtyard", toX:13, toY:2, label:"Courtyard"}]
  },

  boiler: { id:"boiler", name:"The Boiler Room", w:12, h:12, floor:"concrete", wall:"brick", mood:"ember",
    desc:"Under the school. Pipes sweat, a boiler mutters, and a dozen unsanctioned chairs form an unsanctioned circle.",
    spawn:{x:3,y:3},
    props:[
      {t:"boiler", x:7, y:2, w:3, h:3, v:0, label:"The boiler"},
      {t:"pipes", side:"r", x:0, y:0, w:12, h:1, v:1},
      {t:"pipes", side:"l", x:0, y:0, w:1, h:12, v:0},
      {t:"chair", x:4, y:6, w:1, h:1, v:0}, {t:"chair", x:6, y:7, w:1, h:1, v:1}, {t:"chair", x:3, y:8, w:1, h:1, v:0},
      {t:"table", x:5, y:9, w:3, h:1, v:1},
      {t:"sack", x:10, y:8, w:1, h:1, v:0}, {t:"barrel", x:10, y:10, w:1, h:1, v:0},
      {t:"ladder", side:"r", x:2, y:0, w:1, h:1, v:0, label:"Ladder up"},
      {t:"lamp", x:2, y:7, w:1, h:1, v:1},
      {t:"radiator", side:"l", x:0, y:6, w:1, h:3, v:0},
      {t:"rug", x:4, y:6, w:3, h:3, v:1, walk:true}
    ],
    objects:[
      {id:"b_boiler", x:8, y:5, label:"The boiler"},
      {id:"b_table", x:6, y:9, label:"Planning table"}
    ],
    npcs:["anka"],
    exits:[{id:"to_courtyard", x:3, y:2, to:"courtyard", toX:13, toY:11, label:"Up to the Courtyard"}]
  }
};

// NPC definitions. Dialogue id == npc id. `x,y,facing` are home positions. `color` = UI name colour.
GD.npcs = {
  vasha:   { id:"vasha", name:"Lt. Vasha Kell", role:"Gym teacher, army veteran", loc:"theatre", x:11, y:3, facing:"w", color:"#c7b36a", follower:true,
    look:{skin:"#c98f6e", hair:"#5a5a58", hairStyle:"buzz", outfit:"tracksuit", outfitColor:"#506b5a", accent:"#c9892f", build:"avg", glasses:false, age:"adult", pose:"lean", extra:"cigarette"} },
  bronka:  { id:"bronka", name:"Cook Bronka", role:"Canteen cook", loc:"canteen", x:7, y:1, facing:"s", color:"#d98c5f",
    look:{skin:"#e0b196", hair:"#8c8379", hairStyle:"bun", outfit:"apron", outfitColor:"#e8e0cf", accent:"#8a3b2b", build:"heavy", glasses:false, age:"old", pose:"stand", extra:"ladle"} },
  ilsabet: { id:"ilsabet", name:"Ilsabet Orrin", role:"Student, radio tinkerer", loc:"canteen", x:3, y:7, facing:"e", color:"#7fb7b0",
    look:{skin:"#b88a6a", hair:"#1c1a22", hairStyle:"braid", outfit:"cardigan", outfitColor:"#7a4b3a", accent:"#d8b04a", build:"slim", glasses:true, age:"teen", pose:"wheelchair", extra:"book"} },
  fenwick: { id:"fenwick", name:"Choirmaster Fenwick Alder", role:"Music teacher", loc:"canteen", x:13, y:7, facing:"w", color:"#b98ac4",
    look:{skin:"#e6c3a8", hair:"#d8d2c8", hairStyle:"curly", outfit:"suit", outfitColor:"#2f3440", accent:"#a94a4a", build:"slim", glasses:true, age:"adult", pose:"stand", extra:"none"} },
  lemmy:   { id:"lemmy", name:"Lemmy Tarsk", role:"Student, hall monitor", loc:"canteen", x:9, y:5, facing:"n", color:"#9fb77a",
    look:{skin:"#e9c9b1", hair:"#a2723a", hairStyle:"slick", outfit:"uniform", outfitColor:"#3f4d5c", accent:"#b03030", build:"slim", glasses:false, age:"teen", pose:"stand", extra:"armband"} },
  ostrov:  { id:"ostrov", name:"Commissar Ostrov Dane", role:"Youth Commissar (deceased)", loc:"gym", x:8, y:4, facing:"s", color:"#8e8e86",
    look:{skin:"#cdb5a0", hair:"#403a34", hairStyle:"short", outfit:"suit", outfitColor:"#3b3a2f", accent:"#b03030", build:"avg", glasses:false, age:"adult", pose:"hang", extra:"rope"} },
  osk:     { id:"osk", name:"Janitor Osk", role:"Caretaker", loc:"courtyard", x:6, y:8, facing:"e", color:"#a8a07a",
    look:{skin:"#b78d70", hair:"#6e6a66", hairStyle:"bald", outfit:"overalls", outfitColor:"#566a77", accent:"#c9892f", build:"heavy", glasses:false, age:"old", pose:"lean", extra:"broom"} },
  rhea:    { id:"rhea", name:"Rhea Vantage", role:"Youth Vanguard enforcer", loc:"courtyard", x:11, y:7, facing:"w", color:"#d16a6a",
    look:{skin:"#e2b89b", hair:"#1a1414", hairStyle:"slick", outfit:"uniform", outfitColor:"#7a2828", accent:"#d8b04a", build:"slim", glasses:false, age:"teen", pose:"stand", extra:"armband"} },
  marr:    { id:"marr", name:"Principal Odalys Marr", role:"Principal", loc:"office", x:6, y:2, facing:"s", color:"#9ab08f",
    look:{skin:"#e3c4ae", hair:"#8d8d90", hairStyle:"bob", outfit:"suit", outfitColor:"#4b5a4c", accent:"#d8b04a", build:"slim", glasses:true, age:"adult", pose:"sit", extra:"clipboard"} },
  anka:    { id:"anka", name:"Mother Anka", role:"Retired chemistry teacher", loc:"boiler", x:5, y:6, facing:"e", color:"#e0a860",
    look:{skin:"#c9a187", hair:"#bdb6aa", hairStyle:"bun", outfit:"labcoat", outfitColor:"#d9d4c4", accent:"#6a3f2a", build:"avg", glasses:true, age:"old", pose:"sit", extra:"cigarette"} }
};

})();
