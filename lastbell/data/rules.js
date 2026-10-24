(function(){ const GD = (window.GD = window.GD || {});
// Rules evaluated by the engine after every conversation, room change and every ~20 steps. Each fires once.
GD.auto = [
  { id:"yesterday_solved", cond:"(flag.read_note_1 && flag.read_note_2 && flag.read_note_3) || flag.found_ledger",
    effects:[ {task:"task_yesterday", state:"done"}, {xp:3}, {toast:"The ringing stops, briefly. You remember the shape of last night, if not its words."} ] },
  { id:"yesterday_started", cond:"flag.read_note_1 || flag.read_note_2 || flag.read_note_3",
    effects:[ {note:"task_yesterday", text:"Your own handwriting is leading you somewhere. Three notes, three places."} ] },
  { id:"late_exam", cond:"time >= 1020 && !flag.exam_done", effects:[ {note:"task_exam", text:"The exam hour has begun. The Principal does not like to be kept waiting."} ] },
  { id:"evening_light", cond:"time >= 1140", effects:[ {toast:"The loudspeakers crackle awake. The Bell is warming up."}, {sfx:"static"} ] }
];
// Thoughts with no `cond` in thoughts.js surface through these conditions (one new thought at a time).
GD.thoughtAuto = {
  th_quiet_hands: "has('boiler_key') || has('bread_note') || has('rhea_pin')",
  th_good_citizen: "ideo.vanguard >= 2 || has('vanguard_armband') || flag.exam_done",
  th_unsanctioned: "flag.read_note_2 || ideo.undercurrent >= 2",
  th_ration_math: "has('ration_coupon')",
  th_marching_feet: "visited('gym') && flag.steps >= 90",
  th_hungry_ghost: "time >= 780",
  th_perfect_attendance: "visited('office')",
  th_big_sister_state: "talked('bronka') > 0 && talked('vasha') > 1",
  th_anthem_earworm: "talked('fenwick') > 0",
  th_collective_pulse: "ideo.undercurrent >= 3 || flag.fenwick_choir_ready",
  th_paper_heart: "has('bread_note') || has('note_yesterday_1')"
};
// Object dialogues that open another scene once a condition holds (e.g. the tower objects during the finale).
GD.redirects = {
  w_bell:  { cond: "flag.finale_open && !flag.finale_done", to: "finale_hub" },
  w_array: { cond: "flag.finale_open && !flag.finale_done", to: "finale_hub" }
};
// Hints for endings you haven't found (shown on the results screen).
GD.endingInfo = {
  end_good_student: { name: "The Good Student", hint: "Somebody always has to take the blame. It is easier when they are cheap." },
  end_ledger:       { name: "The Ledger", hint: "Some things are safest in a boiler room, in the hands of an old chemistry teacher." },
  end_static:       { name: "Static", hint: "A stage, a microphone, and a school full of loudspeakers." },
  end_quiet:        { name: "The Quiet Way", hint: "The school gate is always open to those who can stand to forget." },
  end_arrested:     { name: "Arrested", hint: "The State notices what you do, eventually." },
  end_curfew:       { name: "Curfew", hint: "The Bell is patient. Let the third day run out." },
  end_wake:         { name: "The Wake Tone", hint: "What if the Bell rang the other way?" },
  end_wardens_eye:  { name: "The Warden's Eye", hint: "A good coat, a quiet office, and a very kind inspector." },
  end_martyr:       { name: "The Unsigned Statement", hint: "Someone has to be guilty of everything." },
  end_silenced:     { name: "Blackout", hint: "Some towers are easier to topple than to fix." },
  end_exodus:       { name: "The Night Tram", hint: "There is a tram that does not stop at the school." }
};
})();
