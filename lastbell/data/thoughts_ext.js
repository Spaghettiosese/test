(function(){ const GD = (window.GD = window.GD || {});
// ===== ACTS II & III thoughts. Merged into GD.thoughts; auto-discovery conditions via cond or GD.thoughtAuto. =====
GD.thoughtSlots.unlocks = (GD.thoughtSlots.unlocks || []).concat([
  { slot:6, cond:"day >= 3", xp:8, label:"On the third day your head has stopped pretending to be tidy. One more heresy fits (or pay 8 xp)." }
]);
GD.thoughtSlots.max = Math.max(GD.thoughtSlots.max || 5, 6);

GD.thoughts = Object.assign(GD.thoughts || {}, {

  th_second_day: { id:"th_second_day", name:"The Second Day", minutes:60,
    discover:"Waking in the dormitory with a headache that has a better memory than you do.",
    problem:"You woke up and it was Wednesday. This should be unremarkable. It is not. Somebody has taken the corners off Tuesday and left you the shape. Is this how everyone else lives: rolling out of bed into a day that arrives already sanded?",
    solution:"Wednesday is a real day. Tuesday was too; you have the bruises. You decide to treat the morning as a debt that has already been paid: whatever the Bell took, it took, and what is left is yours to spend.",
    mods:{ volition:1, composure:1, archive:-1, doublethink:-1 }, effects:[ {xp:2} ], cond:"day >= 2" },

  th_quiet_hours: { id:"th_quiet_hours", name:"The Quiet Hours", minutes:120,
    discover:"Reading, or even hearing about, the banned history of the Harmony Broadcasts.",
    problem:"There are hours the State calls quiet. They are not quiet. They are loud, and the State has paid good money to have them forgotten. Which hours are yours? Which parts of Tuesday were you not allowed to keep?",
    solution:"Quiet is a verb. Somebody quiets things. You start to see the gaps in the day as seams, and seams can be pulled. It is the most dangerous kind of tidiness you have ever felt in your own head.",
    mods:{ dialectics:2, archive:1, senses:1, doublethink:-2, composure:-1 }, effects:[ {set:"knows_static", val:true}, {surv:5}, {ideo:"undercurrent", n:1} ],
    cond:"flag.quill_book_read || has('banned_book')" },

  th_inspector_charm: { id:"th_inspector_charm", name:"The Inspector's Charm", minutes:90,
    discover:"Being flattered, politely and expertly, by a man who is very good at it.",
    problem:"A man in a grey coat likes you. He asks about your day, he remembers your name, he laughs at the right moments. Why does it feel like being measured for a coffin by a very kind tailor?",
    solution:"Charm is a tool. You can pick it up. You watch how Voss holds a pause, and how he lets you fill it, and you practise it on the mirror, the mop and Dov. It works better on Dov than it should.",
    mods:{ charm:2, rhetoric:1, composure:1, empathy:-1, solidarity:-1 }, effects:[ {surv:-3} ],
    cond:"flag.voss_met" },

  th_borrowed_memory: { id:"th_borrowed_memory", name:"A Borrowed Memory", minutes:120,
    discover:"Hearing somebody else describe Tuesday and recognising it as yours.",
    problem:"Somebody has told you about last night, and it feels like a story you were told as a child: partly true, mostly warm. You remember it, in a way. Is it a memory, or is it a loan with interest?",
    solution:"Everyone's memories are borrowed. Teachers, parents, the Anthem, Vasha's notebook: you piece yourself together from scraps. If the scraps are honest, you are as real as anyone. You keep the loan, and promise to pay it forward.",
    mods:{ empathy:1, archive:1, instinct:1, rote:-1, volition:-1 }, effects:[ {xp:2}, {morale:1} ],
    cond:"flag.vasha_report_read || flag.vasha_confession || flag.read_note_3" },

  th_grand_harmony: { id:"th_grand_harmony", name:"Grand Harmony", minutes:150,
    discover:"Learning what the Jubilee will broadcast.",
    problem:"Seventy-two hours. The whole district folded away like a tablecloth. Nobody will miss it, because nobody will remember it. What is a country when it forgets itself on purpose? A very polite ghost.",
    solution:"If they can fold it, you can unfold it. You do not know how yet. But the thought sits in your chest like a held breath, and every time you remember it you are a little less afraid of the length of three days.",
    mods:{ volition:2, the_grey:1, doublethink:-1, composure:-1 }, effects:[ {surv:4}, {ideo:"undercurrent", n:1} ],
    cond:"flag.relay_entered || flag.tape_found || has('master_tape')" },

  th_wake_tone: { id:"th_wake_tone", name:"The Wake Tone", minutes:120,
    discover:"Hearing Ilsabet explain the counter-tone, or holding the cylinder.",
    problem:"A sound that wakes people. You are not sure that is a good idea. A country that is asleep is a country that does not hurt. A country that is awake is a country that remembers it was hurt.",
    solution:"Wake them. It is the only thing that has ever been fair. It will hurt, and they will cry, and some will be angry at you for years. You decide you can stand being hated by a population that is, at last, paying attention.",
    mods:{ senses:2, solidarity:1, instinct:1, appetite:-1, doublethink:-2 }, effects:[ {ideo:"undercurrent", n:2}, {surv:5} ],
    cond:"flag.counter_tone_built || (flag.ilsabet_decoded && has('radio_tube'))" },

  th_ration_riot: { id:"th_ration_riot", name:"Riot in the Bread Line", minutes:90,
    discover:"Standing in a crowd when it decides to move.",
    problem:"Three hundred people, one thought, no plan. You felt it go through the queue like a current. Where does a crowd keep its courage? In the stomach, apparently; the head catches up later.",
    solution:"A crowd is a body, and you were a small part of it. You learned the choreography: where the pushes come from, where to stand, how to fall. It is a strange pleasure to belong to something that can break a window.",
    mods:{ solidarity:2, adrenaline:1, reflex:1, rhetoric:-1, composure:-1 }, effects:[ {surv:5}, {ideo:"undercurrent", n:1} ],
    cond:"flag.queue_riot" },

  th_forbidden_page: { id:"th_forbidden_page", name:"The Forbidden Page", minutes:120,
    discover:"Reading a book you were not supposed to be able to find.",
    problem:"A page you cannot un-read. It said one simple thing in a plain voice, and now you cannot walk through the school without hearing it. How many other plain things have been hidden behind portraits?",
    solution:"Knowledge is not clean. You carry it, and it shows in how you stand. You start to read faces the way you read pages, finding the gap where the sentence was cut. The quiet in the library is no longer peaceful; it is a held tongue.",
    mods:{ archive:2, dialectics:1, rote:-1, doublethink:-1 }, effects:[ {xp:3}, {surv:3} ],
    cond:"flag.library_stacks_open" },

  th_matron_eyes: { id:"th_matron_eyes", name:"Matron's Eyes", minutes:75,
    discover:"Being watched, expertly, by somebody who has been doing it for fourteen years.",
    problem:"She knows when you came in. She knows what you wore. She knows what you had under it. Is it really surveillance if it is done by a woman in slippers with a cup of sherry? Is it less frightening, or more?",
    solution:"You learn to read the watchers. Where the curtain twitches, which board creaks, when the kettle goes on. If everyone is watched, the person who watches the watchers has the quietest job in the building. You file the idea under 'useful, shameful'.",
    mods:{ instinct:2, senses:1, slip:1, empathy:-1, charm:-1 }, effects:[ {surv:-4} ],
    cond:"flag.matron_bribed || flag.matron_informs || has('matron_ledger')" },

  th_counting_footsteps: { id:"th_counting_footsteps", name:"Counting Footsteps", minutes:90,
    discover:"Walking Karsov Avenue and hearing the patrols' rhythm.",
    problem:"Thirty-one steps between the lamp and the gate. Forty-four if you are being followed. Somebody has been counting for you, and the number is going up. What happens when the count reaches the end of the street?",
    solution:"Count back. You learn to walk in the gaps between patrols, and to hear which boots are tired. Cities are metronomes with grudges. Yours has a soft spot at the corner of the market, and you know exactly where to put your feet.",
    mods:{ slip:2, senses:1, the_grey:1, charm:-1, authority:-1 }, effects:[ {xp:1} ],
    cond:"visited('street') && flag.steps >= 150" },

  th_tram_wires: { id:"th_tram_wires", name:"Tram Wires", minutes:90,
    discover:"Looking up at the wires over Karsov Avenue and thinking about where they go.",
    problem:"Overhead, a spiderweb of cable that leads to the edge of the district, and then past it. There is an outside, then. People live there. They do not forget on Thursday.",
    solution:"A way out exists. You do not have to take it. But knowing it is there changes the weight of the day, the way an unlocked door changes a locked room. You breathe easier, and are surprised how long you had been holding it.",
    mods:{ the_grey:2, reflex:1, volition:-1, solidarity:-1 }, effects:[ {ideo:"quiet", n:1} ],
    cond:"talked('nadia') > 0 || has('tram_token')" },

  th_good_son: { id:"th_good_son", name:"The Good Son", minutes:75,
    discover:"Hearing about the people who loved somebody you are about to hurt.",
    problem:"Everyone is somebody's son. Even the cadet who kicked you. Even Ostrov, at the end. Even, perhaps, the man in the car. How many of them would have been different with a different mother and a different school?",
    solution:"You decide not to forgive them. You decide to understand them, which is rarer and does not require a ceremony. It takes the edge off your anger and leaves you sadder, but steadier.",
    mods:{ empathy:2, volition:1, authority:-1, adrenaline:-1 }, effects:[ {morale:1} ],
    cond:"flag.rhea_exposed || flag.rhea_turned || task('task_rhea2') == 'active'" },

  th_burned_paper: { id:"th_burned_paper", name:"Burned Paper", minutes:60,
    discover:"Watching something incriminating turn to ash.",
    problem:"A page, a match, a small yellow flame and the sudden lightness of a pocket. Evidence gone. Is that cowardice or mercy? Or just housekeeping?",
    solution:"Some things should be destroyed the moment they have done their work. You learn to burn without regret, and to keep the ash on your hands for a minute longer than you need to. It reminds you that you chose.",
    mods:{ composure:2, volition:1, archive:-2 }, effects:[ {surv:-5} ],
    cond:"flag.vasha_report_burned || flag.burned_something" },

  th_hob_bell: { id:"th_hob_bell", name:"Hob's Bell", minutes:150,
    discover:"Listening to a man who speaks only in bronze.",
    problem:"He has not spoken for thirty years, and yet you understood him. How? Is there a language below the one you use, made of weights and intervals and the shiver in a floor?",
    solution:"The Bell is a voice. The Bell has always been a voice. It is the only thing in the district that cannot lie, because it has no words. You begin to hear what it is actually saying, and it is not what the Ministry wrote.",
    mods:{ the_grey:2, senses:2, instinct:1, rhetoric:-1, rote:-1 }, effects:[ {xp:3}, {ideo:"undercurrent", n:1} ],
    cond:"flag.hob_trust" },

  th_weight_of_osk: { id:"th_weight_of_osk", name:"The Weight of Osk", minutes:90,
    discover:"Walking past a leaning mop in an empty corridor.",
    problem:"You framed a janitor. He had twenty years of quiet work and a daughter somewhere. Now he is a line in a file. How many such lines fit in a conscience before it breaks?",
    solution:"You carry him. That is the price. It slows you, steadies you and lets nobody else in. Every time you pass the mop you nod to it. It is not much; it is the most you can afford.",
    mods:{ grit:2, volition:1, empathy:-1, charm:-1, solidarity:-1 }, effects:[ {morale:-2}, {surv:-3} ],
    cond:"flag.osk_scapegoat" },

  th_loyal_rhea: { id:"th_loyal_rhea", name:"Loyal Rhea", minutes:90,
    discover:"Watching a killer cry over the wrong child.",
    problem:"She believes. That is the horror, and the gift. If somebody that sure can turn, then certainty is not a wall but a door. Which one are you standing behind?",
    solution:"You decide to be more careful about being certain. It makes you a worse zealot and a better friend. You ask yourself, daily, what you would do if you were told the thing you loved was a lie. You do not like how fast you answer.",
    mods:{ empathy:1, authority:1, dialectics:1, doublethink:-1, adrenaline:-1 }, effects:[ {ideo:"undercurrent", n:1} ],
    cond:"flag.rhea_turned" },

  th_double_agent: { id:"th_double_agent", name:"Double Agent", minutes:120,
    discover:"Accepting an offer from the Inspector while knowing what it costs.",
    problem:"You are working for the Inspector. You are working against the Inspector. Both of these are true and both of them are lies. How long can a person live on a rope between two sentences?",
    solution:"Exactly as long as the sentence is interesting. You learn to wear the Ministry's face over your own. It fits. It fits uncomfortably well. You decide to remember, always, which one is the mask. You are almost certain.",
    mods:{ doublethink:2, charm:1, composure:1, solidarity:-1, empathy:-1 }, effects:[ {surv:-6}, {ideo:"vanguard", n:1} ],
    cond:"flag.voss_invited || flag.voss_ally" },

  th_chosen_family: { id:"th_chosen_family", name:"Chosen Family", minutes:90,
    discover:"Standing with the people you did not choose and would not leave.",
    problem:"Bronka, Ilsabet, Anka, Wren, a broken mop of a janitor: none of them blood, all of them yours. The Union says the State is the family. You say, politely, no. Who, then?",
    solution:"Whoever turns up. You decide that is enough: a family is a roster of people who come when called. Your list is longer than you thought. The warmth of it is faintly embarrassing and not at all negotiable.",
    mods:{ solidarity:2, empathy:1, volition:1, authority:-1, doublethink:-1 }, effects:[ {morale:2}, {xp:2} ],
    cond:"flag.wren_ally || flag.dov_ally || flag.cell_active || flag.tomas_ally" },

  th_last_assembly: { id:"th_last_assembly", name:"The Last Assembly", minutes:60,
    discover:"The evening of the third day.",
    problem:"Everyone you know is going to be in one place at one time, doing one thing, and in an hour none of them might remember it. What do you say to a crowd that has already agreed to forget?",
    solution:"You say the truth, once, loudly, and let it do the rest. Whatever is lost, it will have been said in a room with the lights on. You find you are less frightened of an ending than of an unremarkable Thursday.",
    mods:{ rhetoric:2, volition:2, authority:1, composure:-1, slip:-1 }, effects:[ {set:"jubilee_prepared", val:true}, {surv:5} ],
    cond:"day >= 3 && time >= 960" },

  th_what_wakes: { id:"th_what_wakes", name:"What Wakes", minutes:150,
    discover:"A question you have been circling for three days.",
    problem:"If the Bell can put a whole city to sleep, what sleeps in us underneath? What would wake if it did not? Is it a memory, or a grievance, or only a child with its hands over its ears?",
    solution:"It is a person. It always was. You decide to meet it, daily, on the stairs, and not to ask it for anything. It is shy at first. Then it starts to talk. By the end of the week it is the only voice in your head that says nothing false.",
    mods:{ volition:2, empathy:1, the_grey:1, doublethink:-2, composure:-1 }, effects:[ {xp:4}, {morale:2}, {ideo:"undercurrent", n:1} ],
    cond:"day >= 3 && (flag.knows_static || thought('th_quiet_hours') != 'none')" }
});

// Every ext thought carries its own `cond` (the engine prefers t.cond over GD.thoughtAuto), so no thoughtAuto entries are needed.
})();
