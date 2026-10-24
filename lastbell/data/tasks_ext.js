(function(){ const GD = (window.GD = window.GD || {});
// ===== ACTS II & III tasks. Journal shows the LAST stage whose cond is true. =====
GD.tasks = Object.assign(GD.tasks || {}, {

  task_voss: { id:"task_voss", category:"main", title:"The Inspector",
    summary:"Inspector Hale Voss of the State Inspectorate has arrived to 'close the Ostrov case'. He is charming, tired and parked a black car outside the school gate. He likes you. That is the most worrying thing about him.",
    stages:[
      { text:"A black car is parked on Karsov Avenue. Find the Inspector and find out what he wants before he tells you what you want." },
      { cond:"flag.voss_met", text:"You have met Voss. He is polite, informed and patient. He wants the Ledger, and he is willing to be kind about it. Watch what he asks, and what he never asks." },
      { cond:"flag.voss_suspected", text:"Something about Voss does not fit: the way he smiles when he mentions the Bell, the pill he takes at four. Find out who he works for, and who he used to be." },
      { cond:"flag.voss_invited", text:"Voss has invited you into his world: the relay, the Ministry, a future with a desk. Decide what to do with an offer from a man who is probably telling the truth." },
      { cond:"flag.voss_exposed", text:"You know what Voss is. The question now is whether anybody else is allowed to." },
      { cond:"flag.voss_turned", text:"Voss wavers. A man who has been wiped once might refuse to wipe anyone else. Give him the last push, or the last excuse." }
    ],
    done:"The Inspector's case file closed one way or another. He will remember you, if the Bell allows, as the one who made him stop and read what he was signing.",
    failed:"The Inspector's report is on a desk in the Chancellery, and your name is in it, in a flattering font." },

  task_relay: { id:"task_relay", category:"main", title:"District Relay No. 4",
    summary:"The Bell does not live in the school. It lives at the Relay on Karsov Avenue, behind a gate, a guard and a great many forms. Ilsabet decoded the carrier; Ostrov traced the cable. You need to get inside, and out again with proof.",
    stages:[
      { text:"Walk down Karsov Avenue to the Relay gate. It is guarded and locked. There are four ways in, none of them honest." },
      { cond:"flag.voss_invited || flag.tomas_ally || has('forged_pass') || has('relay_pass')", text:"You have a way in: a pass, a friend or an invitation. Use it before the guard changes shift." },
      { cond:"flag.relay_entered", text:"You are inside the Relay. Somewhere in here is a logbook, a tape vault and a very tired engineer. Do not make noise. Do not trip the generator." },
      { cond:"flag.relay_log_found", text:"The Relay's logbook is in your hands, with every Harmony and every wipe. Get out alive, and decide who needs to see it." }
    ],
    done:"You went into the building that makes the Bell, and you came out holding its diary. That is, in the Union, called treason; in a better country it would be called journalism.",
    failed:"The Relay shut its gate. The Bell goes on being nobody's responsibility." },

  task_tape: { id:"task_tape", category:"main", title:"The Grand Harmony Tape",
    summary:"On Thursday at eight the Jubilee will broadcast Grand Harmony: seventy-two hours of the district's memory, folded neatly away. It lives on a master tape in the Relay vault. Whoever holds the tape decides what Thursday night is.",
    stages:[
      { text:"Learn what the Jubilee will transmit, where the master tape is kept and who is allowed to touch it." },
      { cond:"flag.relay_entered", text:"The tape vault is on the Relay's lower level, behind a door that wants a key, a code or a sufficiently convincing wrench." },
      { cond:"flag.tape_found", text:"You are holding the Grand Harmony master tape. Destroy it, copy it, or swap it: each costs something. A counter-tone could replace it. Deadline: Thursday, 20:00." },
      { cond:"flag.tape_swapped", text:"The master tape has been swapped. When the Jubilee plays, it will play something else. Make sure the replacement is worth the risk." }
    ],
    done:"The Grand Harmony will not sound as the Ministry composed it. Whatever the district hears on Thursday night, it will not be forgetting.",
    failed:"The tape stayed in its tin, and Thursday is going to be very quiet." },

  task_counter: { id:"task_counter", category:"main", title:"The Wake Tone",
    summary:"Ilsabet says the Bell's carrier can be inverted: a tone that wakes instead of blurs. It needs a radio tube, a microphone cable, a wax cylinder, Gregor's repair bench and a great deal of patient swearing.",
    stages:[
      { text:"Ask Ilsabet what the counter-tone needs. She will tell you at length. Take notes: there is a quiz." },
      { cond:"flag.ilsabet_decoded", text:"Ilsabet has the carrier decoded. Bring her the parts: a radio tube, a microphone cable, and a blank to record on." },
      { cond:"has('radio_tube') && has('mic_cable')", text:"You have the tube and the cable. Now you need a blank cylinder and Old Gregor's bench on Karsov Avenue, where the solder is good and the questions are few." },
      { cond:"flag.gregor_bench", text:"Gregor has opened his bench. Bring the parts and the recording blank, and stay out of his way. Do not touch the capacitors. Do not ask about the capacitors." },
      { cond:"flag.counter_tone_built", text:"The Wake Tone exists, in a biscuit tin. It must be heard on Thursday at eight, over the Bell's own carrier: from the tower, the relay, or the choir." }
    ],
    done:"A cylinder of black wax sits in your coat, humming like an unanswered question. Somebody built a thing that wakes people. In this country that is the most dangerous kind of invention.",
    failed:"The parts never came together. The Bell has no rival." },

  task_stacks: { id:"task_stacks", category:"side", title:"The Forbidden Stacks",
    summary:"The Library has a rope, a sign and a librarian. Behind them are the books the district was told never existed. Ysolde Crane guards them with a stare; Ambrose Quill guards the one that matters with a cough.",
    stages:[
      { text:"Visit the Library in the Courtyard's west wing. The back stacks are roped off for 'AUTHORISED READERS'. Find out who that is, and whether it could be you." },
      { cond:"talked('ysolde') > 0", text:"Ysolde Crane keeps the stacks. She will not open them for just anyone. Prove you are not just anyone, or prove you are exactly the right kind of someone." },
      { cond:"talked('quill') > 0", text:"Old Ambrose Quill sits in the reading room with a banned book and a lot of opinions. He will trade the book for something. Find out what he misses." },
      { cond:"flag.library_stacks_open", text:"The back stacks are open. The shelves smell of forgotten summers. Read the page that matters, and the tower stair is nearby." },
      { cond:"flag.quill_book_read", text:"You have read *The Quiet Hours*. Many things you thought were accidents are now clearly not. The tower stair needs a key, and the Library knows who has it." }
    ],
    done:"You went into the Forbidden Stacks and read the history of everything that was supposed to be forgotten. It was shorter than you expected, and worse.",
    failed:"The rope went back up. The books stayed where they were, patient as stones." },

  task_matron: { id:"task_matron", category:"side", title:"Inspection Day",
    summary:"Matron Hallow Pritt will inspect the dormitory, and nothing makes a dormitory more criminal than an inspection. Hide what needs hiding, bribe or distract Pritt, and do not be in your bunk when her ledger opens.",
    stages:[
      { text:"Matron Pritt inspects the dormitory today. Decide what you are carrying that she must never see, and where to put it." },
      { cond:"flag.matron_bribed", text:"Pritt has been bribed. Her ledger stays closed and her eyes go elsewhere, for now. Bribes in the Union come with interest." },
      { cond:"flag.matron_informs", text:"Pritt has informed on you. Somebody will be asking about the contents of your footlocker. Find out who, and what they have been told." },
      { cond:"has('matron_ledger')", text:"You hold Matron Pritt's own ledger: fourteen years of everyone's comings and goings, hers included. Use it wisely, or keep it as a bookmark." }
    ],
    done:"The inspection ended, and the dormitory is still, technically, innocent. Matron Pritt writes something down. It might be about you. It might be about sherry.",
    failed:"The inspection found what it was looking for. A form was filled in, in triplicate, in green." },

  task_queue: { id:"task_queue", category:"side", title:"The Ration Queue",
    summary:"The ration line on Karsov Avenue has been standing since dawn and will go on standing until somebody does something. Nadia has hoarded the bread, the Vanguard has hoarded the Vanguard, and three hundred hungry citizens are one bad rumour from a riot.",
    stages:[
      { text:"Walk past the ration queue on Karsov Avenue. Something is going to happen to it. Choose whether you are the something." },
      { cond:"flag.queue_calmed", text:"You calmed the queue. People are still hungry, but they are hungry in order. A small, tired victory." },
      { cond:"flag.queue_riot", text:"The queue has erupted. Bread is flying, boots are rising and Brune's soldiers are arriving. Get out or get involved; there is no third option on a pavement." }
    ],
    done:"The queue has resolved itself, one way or another. The street smells of burnt bread, hope or both.",
    failed:"Nobody listened. The queue is a crowd, and the crowd is a weather system." },

  task_wren: { id:"task_wren", category:"side", title:"Wren's Errands",
    summary:"Wren is a first-year with a satchel, a grin and an alarming number of contacts. She runs errands for anyone who pays in sweets. She has asked for your help with three. They are not appropriate for a child. She is aware of this.",
    stages:[
      { text:"Wren has errands. Talk to her in the Dormitory and see which ones you are willing to be complicit in." },
      { cond:"has('wren_note')", text:"Wren gave you a note: a crayon map, three phone numbers and a confession about the man in the black car. Deliver it, burn it or read it carefully." },
      { cond:"flag.wren_ally", text:"Wren trusts you. She will run messages, spy on Matron and say things on your behalf that you can disown later." }
    ],
    done:"Wren's errands are done, the satchel is lighter and she has not once been caught. She is better at this than you are. This is a fact, not a criticism.",
    failed:"Wren ran the errands alone, and not everything came back." },

  task_corvin: { id:"task_corvin", category:"side", title:"Corvin's Essay",
    summary:"Corvin Hale, Vanguard hopeful and walking recital, must hand in an initiation essay entitled 'Why I Love the Warden'. He cannot write. He can, however, ask you to.",
    stages:[
      { text:"Corvin wants help with his initiation essay. He is pompous, eager and not quite as dim as he pretends. Decide what kind of help to give." },
      { cond:"flag.corvin_ally", text:"Corvin is in your debt. He owes you a favour, and a Vanguard favour is a heavy, awkward thing to be owed." }
    ],
    done:"The essay is done. Corvin reads it aloud to the wall with great feeling. The wall is unimpressed, as it always is.",
    failed:"Corvin wrote his own. It was worse than it should have been, and he knows whose fault that is." },

  task_vasha: { id:"task_vasha", category:"main", title:"Lieutenant Kell's Notebook",
    summary:"Lieutenant Kell has been reporting on you since morning. She is conflicted, tired and kind-ish. Whatever she writes about you reaches Voss. The question is whether she will keep writing.",
    stages:[
      { text:"Kell's notebook and Kell's conscience are both in your pocket. Find the moment to talk to her, preferably away from walls." },
      { cond:"flag.vasha_report_read", text:"You have read her reports. They are fair, exact and affectionate. This is the problem: she is being accurate about you to a man who will use it." },
      { cond:"flag.vasha_confession", text:"Kell has confessed. She wants to make it right; she does not yet know how. Give her a task or give her a break, but do not give her a speech." },
      { cond:"flag.vasha_report_burned", text:"The reports are ash. Kell has stopped writing about you, and started writing about herself, which is far more dangerous." },
      { cond:"flag.vasha_betrays", text:"Kell has chosen the Inspector. You were kind to her, and she remembered you were also an assignment." }
    ],
    done:"The lieutenant's notebook is done. Whatever it said, it is now in your hands, and she is still standing beside you, which counts as an ending.",
    failed:"Her notes made it to the Inspector. They were, as always, accurate." },

  task_marr: { id:"task_marr", category:"side", title:"The Principal's Letter",
    summary:"Principal Marr is afraid, which is the one thing about her that has not been reorganised. There is a letter she has not sent, from a woman who is trying to remember who she was before the Ministry made her useful.",
    stages:[
      { text:"Visit the Principal's office. Marr is not the same woman she was yesterday. Or she is, and yesterday you were not listening." },
      { cond:"flag.marr_turned", text:"Marr has turned. She will no longer sign what the Ministry sends her. It will cost her the school, and she seems at peace with that." }
    ],
    done:"The Principal's letter is sent. Its reader will never write back. Marr lights a cigarette in the school office for the first time in fifteen years.",
    failed:"The letter stayed in the drawer. The drawer stayed locked." },

  task_rhea2: { id:"task_rhea2", category:"main", title:"Rhea's Orphans",
    summary:"Rhea Vantage killed Ostrov, and she believes she was right. She was raised in the Vanguard Homes, where children are told they are the Warden's own, and taught to love the hand that holds the stick. What she believes is a question. What you do with it is an answer.",
    stages:[
      { text:"Rhea is still in the school, still wearing the pin she lost and still convinced of everything. Learn where she came from before you decide what to do with her." },
      { cond:"flag.rhea_exposed", text:"Rhea has been exposed. She is not ashamed; she is furious that it was necessary. A person who is sure of herself is the most dangerous thing in a school." },
      { cond:"flag.rhea_turned", text:"Rhea has turned. She does not forgive herself, which is the first sign she means it. She is now, in a dim, limited way, your ally." }
    ],
    done:"Rhea's story is told. It did not excuse her, and it was not meant to. It explained the shape of the hole she was made to fill.",
    failed:"Rhea walked out into the evening, as certain as ever. The Vanguard will remember her fondly." },

  task_jubilee: { id:"task_jubilee", category:"main", title:"The Jubilee",
    summary:"On Thursday at 20:00 the Warden's Jubilee will transmit Grand Harmony to the whole district. By then you must decide what you are willing to do about it. The Bell Tower is the best place to be, and it will be locked.",
    stages:[
      { text:"Thursday, 20:00. The Jubilee begins at 19:30. Prepare whatever you intend to do about it: a tape, a tone, a plan or an apology." },
      { cond:"flag.jubilee_prepared", text:"You have prepared. Ready or not, the Jubilee is coming. Gather your allies and be at the Bell Tower by 19:30." },
      { cond:"flag.tower_open", text:"The Bell Tower is open. The Jubilee is on the way. The view from up there takes in the whole district, and the whole district is taking in nothing." },
      { cond:"flag.finale_open", text:"It is the Jubilee. Every choice you have made is standing behind you, waiting to see what you do with the next minute." }
    ],
    done:"The Jubilee played out. The district will wake tomorrow knowing, or not knowing, and either way it will be because of you.",
    failed:"The clock reached the Jubilee, and you were not ready." },

  task_exodus: { id:"task_exodus", category:"side", title:"The Night Tram",
    summary:"Nadia Fell runs the last tram out of District 9 on Thursday night, and a seat on it is for sale. Not everyone who boards is a customer. A man who can leave has a different way of looking at the world.",
    stages:[
      { text:"Nadia can get you out. The night tram leaves Karsov Avenue at the Jubilee. She wants a token, a favour and some proof you can pay." },
      { cond:"has('tram_token')", text:"You have a tram token. A seat is possible. Make sure you want to be the kind of person who takes it." },
      { cond:"flag.nadia_ally", text:"Nadia is on your side. The tram will wait for as long as she says, which is not long." }
    ],
    done:"The tram left the platform with its lights low and its seats full. You did not look back. You were told not to.",
    failed:"The tram left without you. Nadia did not wave." },

  task_dov: { id:"task_dov", category:"side", title:"Dov's Business",
    summary:"Dov Kessel, your roommate, sells tram tokens, forged passes and the sort of reassurance that costs extra. He is charming, shifty and a good friend if you can afford him.",
    stages:[
      { text:"Dov has something to sell. Ask what, and do not ask where it came from." },
      { cond:"has('tram_token') || has('forged_pass')", text:"Dov has sold you something illegal. This is the beginning of a beautiful friendship, or a short interrogation." },
      { cond:"flag.dov_ally", text:"Dov is an ally. He will sell you things at a discount and lie for you at no charge. Do not test the second one." }
    ],
    done:"Dov's business is concluded. Goods exchanged, handshakes made and some debts forgotten, which is the best kind of debt.",
    failed:"Dov decided you were bad for business." },

  task_osk2: { id:"task_osk2", category:"side", title:"Osk's Keys",
    summary:"Janitor Osk has keys to every door in School No. 9, and a conscience he has been polishing for twenty years. If he is not framed, he might lend you the keys. If he is, he will haunt you instead.",
    stages:[
      { text:"Osk has the keys the school needs and the doubts the school does not. Find him and see which side of the mop he is on." },
      { cond:"has('osk_keys')", text:"Osk has given you his keys. Doors the Principal does not know exist are now unlocked. Try not to look surprised." },
      { cond:"flag.osk_scapegoat", text:"You framed him. He is gone, and his mop is leaning against the wall in the corridor where he used to stand. You will walk past it often." }
    ],
    done:"Osk's keys have done what they were made for. A door opened, or closed, depending on what you did with it.",
    failed:"Osk is gone. The keys went with him, and so did something else." },

  task_hob: { id:"task_hob", category:"main", title:"The Bellringer",
    summary:"At the top of the Bell Tower lives Hob, the Bellringer, who has not spoken in thirty years and rings the Great Bell by hand when the machine fails. He knows more about the Bell than anyone alive. He will not tell you. You will have to listen.",
    stages:[
      { text:"Find a way into the Bell Tower. The door is locked and the key is somewhere in the Library." },
      { cond:"flag.tower_open", text:"The tower is open. Climb the stairs. Somebody up there has been waiting for a visitor for thirty years." },
      { cond:"flag.hob_trust", text:"Hob trusts you. He rings in a language you are starting to understand: long for warning, short for welcome, one quiet stroke for 'now'." }
    ],
    done:"Hob and you understand each other. Nothing was said. Everything was rung.",
    failed:"The Bellringer turned away. The tower is quiet, and so is he." },

  task_choir2: { id:"task_choir2", category:"side", title:"The Anthem Arrangement",
    summary:"Fenwick's choir will sing the Anthem at the Jubilee. A key change in the third bar could carry the Wake Tone into every loudspeaker in the district. Convince the choirmaster, and rehearse before Thursday.",
    stages:[
      { text:"Ask Fenwick about the Jubilee. The choir has been drafted. Consider what a key change could do." },
      { cond:"has('choir_score')", text:"You have the score. The margin of page three has a key change that is not in the official version. Persuade the choir to sing it." },
      { cond:"flag.choir_wake_arrangement", text:"The wake arrangement is agreed. On Thursday the choir will sing the Anthem exactly as written, plus one bar that changes everything." },
      { cond:"flag.choir_performed", text:"The choir sang. For three minutes the Anthem was the thing it pretended to be." }
    ],
    done:"The Anthem was sung. It was beautiful. It was also, for the first time in its life, true.",
    failed:"The choir sang the official arrangement, note for note. Nobody remembers it." },

  task_lemmy: { id:"task_lemmy", category:"side", title:"Lemmy's Choice",
    summary:"Lemmy is the school's smallest informer and its biggest apologiser. He skimmed coupons yesterday and has not slept since. He can be redeemed or he can fall. Both are on you.",
    stages:[
      { text:"Lemmy is frightened. Find him and find out what he is more afraid of: you, the Vanguard or himself." },
      { cond:"flag.lemmy_redeemed", text:"Lemmy has made it right. He is still an informer, but now he informs on the right people." }
    ],
    done:"Lemmy made his choice. Whatever it was, it was his, which is more than most people can say.",
    failed:"Lemmy fell. He is not a bad man; he was just not given any better choices." }
});
})();
