(function(){ const GD = (window.GD = window.GD || {});

// type: key | clue | consumable | apparel | junk.  `use.consume` (default true) removes the item after use.
// mods apply while the item is carried (junk/clue/key) or worn (apparel; engine may treat apparel as always worn).
GD.items = {
  boiler_key: { id:"boiler_key", name:"Boiler Room Key", type:"key", usable:false, color:"#a98a4a", icon:"K",
    desc:"A heavy iron key on a loop of kitchen string. It smells of bread dough, which is the first reasonable thing you have learned about the basement." },

  chalk_stub: { id:"chalk_stub", name:"Chalk Stub", type:"clue", usable:false, color:"#e6e1d2", icon:"C",
    desc:"A thumb-length of yellow chalk, worn on one side by a hand that was in a hurry. Somebody has been writing on walls, and the Commissar was the last to hold the pen." },

  torn_page: { id:"torn_page", name:"Torn Portrait Page", type:"clue", usable:false, color:"#b9ae8a", icon:"P",
    desc:"A corner of the Warden's portrait, smaller than a handkerchief. The back is not paper at all but grey felt, and where the felt was cut, a hair-thin wire shows.",
    mods:{ deduction:1 } },

  ration_coupon: { id:"ration_coupon", name:"Ration Coupon", type:"junk", usable:false, color:"#d8b04a", icon:"$",
    desc:"One printed square of Union money, stamped TUESDAY (it is not Tuesday). Worth one bowl of soup, two favours or a stern lecture, depending on whom you hand it to.",
    stackable:true },

  cigarettes: { id:"cigarettes", name:"Pack of Cigarettes", type:"consumable", usable:true, color:"#c9b88a", icon:"Ci",
    desc:"Seven left, brand name rubbed off by pockets. Your lungs file a complaint; Appetite files a counter-motion.",
    use:{ consume:true, label:"Smoke one",
      effects:[ {morale:2}, {hp:-1}, {time:5}, {add:"smoked", n:1}, {toast:"Nerve +2, Body -1. It tastes of carpet and relief."} ] },
    mods:{ appetite:1, stamina:-1 } },

  ledger: { id:"ledger", name:"The Ledger", type:"key", usable:false, color:"#4f6a5a", icon:"L",
    desc:"A slim green cloth book of columns: dates, relay codes, the minutes of every night the Bell rang. The handwriting is Ostrov's. The nervousness is yours.",
    mods:{ doublethink:-1, volition:1 } },

  rhea_pin: { id:"rhea_pin", name:"Vanguard Pin", type:"clue", usable:false, color:"#d8b04a", icon:"V",
    desc:"A little gilt pin shaped like a flaming bell, with a snapped clasp. It was not lost by a Pioneer. Pioneers do not wear the red enamel. Enforcers do." },

  note_yesterday_1: { id:"note_yesterday_1", name:"Note from Yesterday-You (I)", type:"clue", usable:false, color:"#e1d9bd", icon:"1",
    desc:"A page torn from a school exercise book, in your own handwriting, pressed so hard it left grooves. It begins 'DO NOT TRUST THE BELL' and then runs out of room." },
  note_yesterday_2: { id:"note_yesterday_2", name:"Note from Yesterday-You (II)", type:"clue", usable:false, color:"#e1d9bd", icon:"2",
    desc:"Another page, your hand again, shakier. Half of it is a drawing of a statue. The other half is the word 'HOLLOW', underlined until the pen gave up." },
  note_yesterday_3: { id:"note_yesterday_3", name:"Note from Yesterday-You (III)", type:"clue", usable:false, color:"#e1d9bd", icon:"3",
    desc:"The last page. Neat, calm, almost cheerful: a list of three things to do in the morning, the third of which is 'forgive me'." },

  radio_tube: { id:"radio_tube", name:"Radio Tube", type:"clue", usable:false, color:"#7fb7b0", icon:"R",
    desc:"A glass valve with a blue filament, warm as a small animal. Ilsabet would trade a lung for this, so you politely keep both of yours.",
    mods:{ senses:1 } },

  bread_note: { id:"bread_note", name:"Bread Note", type:"clue", usable:false, color:"#d9c9a0", icon:"B",
    desc:"A slip of tissue baked into a heel of rye. It says 'COLD TEA FOR THE GREEN DOOR' in tiny capitals, and under it, in worse capitals, 'EAT THIS NOTE.'" },

  vanguard_armband: { id:"vanguard_armband", name:"Vanguard Armband", type:"apparel", usable:false, color:"#a83a3a", icon:"A",
    desc:"Red cloth, black bell, a pin that scratches. Wearing it makes corridors part for you and friends part from you. People stop asking questions; they start giving answers, and you will not like how well they fit.",
    mods:{ authority:2, composure:1, empathy:-1, solidarity:-2 },
    onEquip:{ effects:[ {ideo:"vanguard", n:1} ] } },

  pocket_mirror: { id:"pocket_mirror", name:"Pocket Mirror", type:"apparel", usable:false, color:"#9fb7c6", icon:"M",
    desc:"A tin-backed mirror the size of a biscuit. It sees you clearly, which is more than anyone else has managed all week. Looking into it for too long is a skill of its own.",
    mods:{ charm:1, composure:1, volition:-1 } },

  warden_badge: { id:"warden_badge", name:"Warden's Badge", type:"apparel", usable:false, color:"#c9a23a", icon:"W",
    desc:"A heavy brass medallion stamped with a stern, benevolent face. It makes you look like a person things are about to be explained to, and makes the portraits look at you a little longer.",
    mods:{ authority:2, doublethink:1, instinct:-1, empathy:-1 },
    onEquip:{ effects:[ {surv:-4}, {ideo:"vanguard", n:1} ] } },

  sweet_roll: { id:"sweet_roll", name:"Sweet Roll", type:"consumable", usable:true, color:"#e0b070", icon:"S",
    desc:"A bun glazed with something that is almost sugar. Warm, slightly flattened, lovingly baked and slightly guilty. Appetite has already named it.",
    use:{ consume:true, label:"Eat it",
      effects:[ {morale:2}, {hp:1}, {time:5}, {toast:"Nerve +2, Body +1. Briefly, the Union is edible."} ] } },

  ration_tea: { id:"ration_tea", name:"Ration Tea", type:"consumable", usable:true, color:"#8a5a3a", icon:"T",
    desc:"A tin cup of something between tea and the memory of tea. Hot, sweet in the way a rumour is sweet. It tastes of home and, faintly, of aspirin, which may not be an accident.",
    use:{ consume:true, label:"Drink it",
      effects:[ {hp:2}, {morale:1}, {time:5}, {toast:"Body +2, Nerve +1. The cup is warm and so, briefly, are you."} ] } },

  exam_booklet: { id:"exam_booklet", name:"Orthodoxy Exam Booklet", type:"key", usable:false, color:"#7a8a6a", icon:"E",
    desc:"A grey booklet, forty pages, each headed with a question you are expected to have answered before it was asked. The cover reads 'WRITE LEGIBLY. THE WARDEN IS BUSY.'",
    mods:{ rote:1, rhetoric:-1 } },

  vasha_notebook: { id:"vasha_notebook", name:"Vasha's Notebook", type:"clue", usable:false, color:"#6b7a5a", icon:"N",
    desc:"A pocket notebook with a rubber band, army-issue, smelling of cigarette and shoe-polish. It has an entry for every hour you have been alive since 07:30, and not one is unkind." },

  staged_rope: { id:"staged_rope", name:"Staged Rope", type:"clue", usable:false, color:"#a8905a", icon:"Rp",
    desc:"A length of gym rope with a perfect, deliberate knot, tied by someone who had not tied a noose before but had read about it. The fibres are cut on one side: cut, not frayed.",
    mods:{ deduction:1 } },

  mic_cable: { id:"mic_cable", name:"Microphone Cable", type:"key", usable:false, color:"#4a4a52", icon:"Mc",
    desc:"Six metres of black cable with a jack at one end and a rusted XLR at the other. It hums faintly with the knowledge of what it was designed to carry." },

  school_cap: { id:"school_cap", name:"School Cap", type:"apparel", usable:false, color:"#3f4d5c", icon:"H",
    desc:"A grey cap with the Gymnasium crest, one size, all the size anyone ever needed. Pulled down, it hides the eyes. Pulled up, it hides nothing. You have worn it since the age of eleven.",
    mods:{ composure:1, slip:1, charm:-1 } },

  bent_spoon: { id:"bent_spoon", name:"Bent Spoon", type:"junk", usable:false, color:"#b8b8b0", icon:"Sp",
    desc:"A canteen spoon bent at a thoughtful angle. Whoever abandoned it was either very angry or very good at lockpicking. Possibly both. It fits keyholes better than it fits soup.",
    mods:{ slip:1, aim:-1 } }
};

})();
