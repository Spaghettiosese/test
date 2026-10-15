(function(){ const GD = (window.GD = window.GD || {});

// stages: ordered journal text; the journal shows the LAST stage whose `cond` is true (first stage has no cond).
// done/failed: text shown once the task state is 'done' / 'failed'. `due` = optional deadline in minutes-since-midnight.
GD.tasks = {

  task_case: { id:"task_case", category:"main", title:"Who Hanged the Commissar?",
    summary:"Youth Commissar Ostrov Dane is hanging from the north hoop. The official line is suicide, and it is needed by evening. Lieutenant Kell has asked you to 'assist'. Nobody has asked what you would like to assist with.",
    stages:[
      { text:"Examine the body in the Gymnasium and decide for yourself what a man looks like when he has chosen." },
      { cond:"flag.body_examined", text:"The body is wrong in small ways. Find out what the room is hiding: the rope, the portrait, the floor." },
      { cond:"flag.clue_rope || flag.clue_boots || flag.clue_chalk", text:"The scene is staged. Somebody wanted it to look like a choice. Find who, and then find who told them." },
      { cond:"flag.clue_mic && flag.knows_rhea", text:"A microphone behind the Warden. A pin on the mats. You can name a name, if you are brave enough to say it near a wall." }
    ],
    done:"You said what happened, in the room where it happened, to the people who needed to hear it. The Commissar is still dead, but he is no longer alone in the lie.",
    failed:"The case closed like a drawer. Somebody else's answer went into the report, and yours went into a pocket." },

  task_yesterday: { id:"task_yesterday", category:"main", title:"What Did I Do Last Night?",
    summary:"You woke on the stage with torn clothes and a ringing head, and a blank where yesterday should be. Somebody with your handwriting left you notes. Work out what you were trying to say before the Bell does it again.",
    stages:[
      { text:"Search the Old Theatre for anything you left behind: a pocket, a trunk, a bench, a note." },
      { cond:"flag.read_note_1", text:"One note found: 'DO NOT TRUST THE BELL.' Yesterday-You was frightened and organised. Find the other two." },
      { cond:"flag.read_note_2", text:"Two notes. A statue, a hollow, an underlined word. Yesterday-You hid something." },
      { cond:"flag.read_note_3", text:"Three notes. The third asks forgiveness. You know where to dig, and you suspect you do not want to." },
      { cond:"flag.knows_static", text:"You know what the Bell does to you. Whatever you did last night, you did it with your eyes open, and then something closed them." }
    ],
    done:"The blank is no longer a blank. It is a hole with edges, and you know what it was shaped to hold.",
    failed:"Yesterday remains a rumour. You will walk into the Bell tonight and not remember why you stood so still." },

  task_ledger: { id:"task_ledger", category:"main", title:"Find the Ledger",
    summary:"The Ledger has the Bell's schedule, every night it rang and every hour it erased. Yesterday-You hid it somewhere hollow. Three notes lead to one statue. Someone else is also reading the statue.",
    stages:[
      { text:"Gather the notes. The Ledger is hidden by someone who trusted a version of you who no longer remembers it." },
      { cond:"flag.read_note_3", text:"All three notes read. The Statue of the Warden's Father, in the Courtyard, has a hollow plinth. Be nonchalant. It is a statue; it has seen worse." },
      { cond:"flag.found_ledger || has('ledger')", text:"The Ledger is in your hands. Decide who deserves to read it: a mother, a microphone, or a fire." }
    ],
    done:"The Ledger left your hands in the way you chose. Whatever it does next, it does as a decision and not an accident.",
    failed:"The Ledger is gone, burnt, or in the wrong hands. The Bell remains a mystery with a perfect memory." },

  task_rhea: { id:"task_rhea", category:"main", title:"The Enforcer",
    summary:"A Youth Vanguard pin, a boot-print, a gleam of chalk. Rhea Vantage keeps smiling in the Courtyard like someone who has never needed an alibi. Prove it or, failing that, survive her.",
    stages:[
      { text:"Rhea Vantage is in the Courtyard, wearing a smile like a dress uniform. You have no reason to confront her yet." },
      { cond:"flag.knows_rhea", text:"You suspect Rhea. Find proof you can hold in a fist and not just a feeling you can hold in a corridor." },
      { cond:"flag.rhea_confronted", text:"You have confronted Rhea. She is now thinking about you, which is the worst thing a person can do about you." },
      { cond:"flag.rhea_exposed", text:"Rhea is exposed. The question is who will believe it, and who will repeat it after the Bell." }
    ],
    done:"Rhea Vantage can no longer wear her smile as armour. Whether the Union cares is another matter, but she does.",
    failed:"Rhea walks on, immaculate. The pin stays in your pocket like a splinter you are too polite to remove." },

  task_exam: { id:"task_exam", category:"main", title:"The Orthodoxy Exam", due:1020,
    summary:"Mandatory. 17:00. The Principal's office. Forty pages of questions you are expected to have answered before they were asked. Fail it and the Union will have a longer conversation with you.",
    stages:[
      { text:"Be in the Principal's office at 17:00. Bring a pen and a belief." },
      { cond:"has('exam_booklet')", text:"You have the booklet. Study it, rehearse it, or find another way to pass without ever opening it." },
      { cond:"flag.exam_done", text:"The exam is over. Somewhere, a clerk is grading what you believe." }
    ],
    done:"The exam is behind you. Your answers are on file, and so, presumably, are you.",
    failed:"You missed the exam, or the exam missed you. Either way, the clerks have a form for it." },

  task_choir: { id:"task_choir", category:"side", title:"Fenwick's Anthem",
    summary:"Choirmaster Fenwick Alder needs one more voice for tonight's Anthem. The Anthem is the Bell's lyric half. He rehearses it as if it had nothing to hide, which is what makes it so hard to listen to.",
    stages:[
      { text:"Talk to Fenwick in the Ration Hall. He is rehearsing something that sounds like a lullaby with a bayonet in it." },
      { cond:"flag.fenwick_asked", text:"Fenwick wants a voice, a student's, in the second verse. Find out what the verse is for." },
      { cond:"flag.fenwick_choir_ready", text:"The choir is ready. The stage microphone is wired to the PA. Fenwick knows it. Fenwick is pretending not to." }
    ],
    done:"The choir has a voice and so, quietly, do you. Fenwick will conduct whatever you hand him.",
    failed:"The choir sings without you. It sings very well, which is the problem." },

  task_radio: { id:"task_radio", category:"side", title:"Ilsabet's Static",
    summary:"Ilsabet Orrin has a homemade receiver and a theory: the Bell's carrier tone has a pattern, and the pattern is doing something to people's memories. She needs one radio tube to prove it.",
    stages:[
      { text:"Ilsabet is in the Ration Hall, hunched over a radio with a screwdriver and an outrageous idea." },
      { cond:"flag.ilsabet_asked", text:"Ilsabet needs a radio tube to decode the Bell. Try the boiler room, where old things go to be forgotten." },
      { cond:"has('radio_tube')", text:"You have the tube. Bring it to Ilsabet and let her turn it into a verdict." },
      { cond:"flag.ilsabet_decoded", text:"The tone is decoded. The Bell is a suppressor and Ilsabet can prove it. Now someone needs to hear it." }
    ],
    done:"Ilsabet has the signal on tape and the words in her mouth. The Static has a name now, and people can be unkind to a thing with a name.",
    failed:"The receiver stays quiet. The Bell goes on being the weather." },

  task_coupons: { id:"task_coupons", category:"side", title:"Bronka's Missing Coupons",
    summary:"Cook Bronka has been short of coupons for a week. Somebody is skimming, and she suspects the hall monitor, because she suspects everyone and is right about him.",
    stages:[
      { text:"Ask Bronka what is missing. She will tell you, at length, in the voice of a woman measuring soup." },
      { cond:"flag.bronka_asked", text:"Find out who has her coupons. Lemmy Tarsk has a hall monitor's armband and a hall monitor's pockets." },
      { cond:"has('ration_coupon')", text:"A coupon recovered. Bring it back to Bronka. She keeps the receipts in her face." }
    ],
    done:"Bronka has her coupons, and you have her trust, which in the Ration Hall is the harder currency.",
    failed:"The coupons stay missing. The soup gets thinner, and Bronka notices who noticed." },

  task_osk: { id:"task_osk", category:"side", title:"The Janitor's Alibi",
    summary:"Janitor Osk saw you leave the gym at 02:10 and has said nothing. He is also the obvious scapegoat. Decide what to do with a man whose only crime is cleaning.",
    stages:[
      { text:"Osk is in the Courtyard with a broom and a long look. He knows something about you. You know nothing about him." },
      { cond:"flag.osk_seen_you", text:"Osk saw you leave the gym at 02:10. He did not see the killing, but he is very easy to blame for it." },
      { cond:"flag.osk_scapegoat", text:"You framed Osk. The report will say what it needs to." }
    ],
    done:"Osk's name is clear, or at least clearer than it was. He has stopped looking at the floor.",
    failed:"Osk takes the blame the way he takes everything: quietly, with a mop." },

  task_anka: { id:"task_anka", category:"side", title:"Mother Anka",
    summary:"A bread-note, a green door, a boiler, a retired chemistry teacher who smells of ammonia and sedition. The Undercurrent meets in the basement. They will not meet you until you have something worth bringing.",
    stages:[
      { text:"Find the Undercurrent. A cook's bread-notes suggest where to start eating." },
      { cond:"flag.boiler_unlocked", text:"The boiler room is open. Go down and say something worth hearing." },
      { cond:"flag.ledger_with_anka", text:"Anka has the Ledger. The Undercurrent can do what you cannot: remember." }
    ],
    done:"The Undercurrent has the Ledger and a plan to spread it. It will take weeks. They are patient. The Bell is not.",
    failed:"The boiler door stays shut. The Undercurrent goes on whispering without you." },

  task_broadcast: { id:"task_broadcast", category:"main", title:"Ring the Bell", due:1260,
    summary:"The Ration Hall stage microphone is wired to the school PA. If you have the Ledger, a mic cable and a decoded tone, you can read the truth into every loudspeaker in District 9. The Bell rings at 21:00. Beat it to the microphone.",
    stages:[
      { text:"A loud ending is possible. Find out what it takes: cable, tone, Ledger, nerve." },
      { cond:"has('mic_cable') || flag.ilsabet_decoded || has('ledger')", text:"You hold part of a broadcast. Gather all three: mic cable, decoded tone, the Ledger." },
      { cond:"flag.broadcast_ready", text:"Everything is in place. The stage microphone is waiting. The Bell is not far behind." }
    ],
    done:"For one sentence, the loudspeakers carried your voice into every classroom in District 9. Whatever follows, they heard it.",
    failed:"The Bell rang first. The Static took the hall, the stage, and you." }
};

})();
