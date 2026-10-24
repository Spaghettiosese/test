(function(){ const GD = (window.GD = window.GD || {});
// ===== ACTS II & III auto rules (each fires once). Quest completion by flag, day-structure toasts, ending hints. =====
GD.auto = (GD.auto || []).concat([
  { id:"x_relay_done", cond:"flag.relay_log_found",
    effects:[ {task:"task_relay", state:"done"}, {xp:4}, {thought:"th_grand_harmony"}, {toast:"You have the Relay's logbook. Every night the Bell rang, written in an engineer's tired handwriting."} ] },
  { id:"x_tape_done", cond:"flag.tape_found && flag.tape_swapped",
    effects:[ {task:"task_tape", state:"done"}, {xp:4}, {toast:"The master tape has been swapped. Thursday may sound different."} ] },
  { id:"x_tape_found", cond:"flag.tape_found",
    effects:[ {xp:2}, {note:"task_jubilee", text:"You hold the Grand Harmony tape. Whatever happens at 20:00 on Thursday, it is now partly in your coat."}, {sfx:"paper"} ] },
  { id:"x_counter_done", cond:"flag.counter_tone_built",
    effects:[ {task:"task_counter", state:"done"}, {xp:5}, {toast:"The Wake Tone is built. A sound that wakes a district, in a biscuit tin."}, {sfx:"chime"} ] },
  { id:"x_stacks_done", cond:"flag.library_stacks_open && flag.quill_book_read",
    effects:[ {task:"task_stacks", state:"done"}, {xp:3}, {toast:"The Forbidden Stacks have been read. The dust on your hands is history."} ] },
  { id:"x_queue_done", cond:"flag.queue_calmed || flag.queue_riot",
    effects:[ {task:"task_queue", state:"done"}, {xp:2}, {toast:"The ration queue has resolved itself, one way or another."} ] },
  { id:"x_vasha_burned", cond:"flag.vasha_report_burned",
    effects:[ {task:"task_vasha", state:"done"}, {xp:3}, {surv:-8}, {toast:"The reports are ash. Whoever Vasha writes for now, it is not Voss."} ] },
  { id:"x_vasha_betrays", cond:"flag.vasha_betrays",
    effects:[ {task:"task_vasha", state:"failed"}, {surv:12}, {toast:"Kell chose the Inspector. You remembered you were also an assignment."} ] },
  { id:"x_marr_turned", cond:"flag.marr_turned",
    effects:[ {task:"task_marr", state:"done"}, {xp:3}, {toast:"The Principal has stopped signing what the Ministry sends her."} ] },
  { id:"x_rhea_turned", cond:"flag.rhea_turned",
    effects:[ {task:"task_rhea2", state:"done"}, {xp:3}, {toast:"Rhea Vantage has turned. It cost her more than it cost you."} ] },
  { id:"x_osk_keys", cond:"has('osk_keys')",
    effects:[ {task:"task_osk2", state:"done"}, {xp:2}, {toast:"Osk's keyring is yours: eighty keys and a janitor's trust."} ] },
  { id:"x_lemmy_redeemed", cond:"flag.lemmy_redeemed",
    effects:[ {task:"task_lemmy", state:"done"}, {xp:2}, {toast:"Lemmy has made it right, mostly."} ] },
  { id:"x_choir_arranged", cond:"flag.choir_wake_arrangement",
    effects:[ {task:"task_choir2", state:"done"}, {xp:3}, {toast:"The choir will sing the key change. The Anthem is about to be honest."} ] },
  { id:"x_hob_trust", cond:"flag.hob_trust",
    effects:[ {task:"task_hob", state:"done"}, {xp:3}, {toast:"The Bellringer trusts you. He rings once, softly. It is the nicest thing anyone has said all week."} ] },
  { id:"x_voss_turned", cond:"flag.voss_turned",
    effects:[ {task:"task_voss", state:"done"}, {xp:5}, {toast:"The Inspector wavers. You have the rarest thing in the Union: a Ministry man who hesitates."} ] },
  { id:"x_day2_morning", cond:"day >= 2",
    effects:[ {toast:"WEDNESDAY. The Bell took some of the night. You may be missing a skill or two until your head clears."} ] },
  { id:"x_day3_morning", cond:"day >= 3",
    effects:[ {toast:"THURSDAY. The Jubilee is tonight. Grand Harmony transmits at 20:00."}, {note:"task_jubilee", text:"Day three. The Jubilee transmits Grand Harmony at 20:00. The Bell Tower is the place to be."} ] },
  { id:"x_dusk_day3", cond:"day >= 3 && time >= 1080",
    effects:[ {toast:"Evening. The loudspeakers have started playing the Jubilee march. It is exactly as cheerful as it sounds."}, {sfx:"static"} ] },
  { id:"x_surv_warn", cond:"surv >= 80",
    effects:[ {toast:"Surveillance is very high. Somebody is writing your name, and underlining it."} ] }
]);

// Hints for the new endings (shown on the results screen).
GD.endingInfo = Object.assign(GD.endingInfo || {}, {
  end_wake:        { name: "The Wake", hint: "Replace the lullaby with the alarm, and let a whole district remember." },
  end_wardens_eye: { name: "The Warden's Eye", hint: "A kind inspector offers a desk. Some doors are warm because of what burns behind them." },
  end_martyr:      { name: "The Martyr", hint: "Say it was all you, loudly enough that nobody looks at anyone else." },
  end_silenced:    { name: "Silenced", hint: "If the Bell cannot be changed, it can be broken. Expect a very dark night." },
  end_exodus:      { name: "Exodus", hint: "There is a tram on Karsov Avenue, and a conductor who sells seats." }
});

// Extra ideology tier for the very committed (existing tiers are kept).
["vanguard","undercurrent","quiet"].forEach(function(k){
  const I = GD.ideologies && GD.ideologies[k]; if (!I) return;
  const extra = { vanguard:"Warden's Own", undercurrent:"Wake-Bearer", quiet:"Patron Saint of Doors Closed Softly" }[k];
  if (!I.tiers.some(t => t.min === 15)) I.tiers.push({ min:15, title:extra });
});
})();
