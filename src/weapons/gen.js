// Choreography generators shared by the newer weapon rigs. A rig supplies its geometry and a
// handful of key positions (grips, magazine seat, where the support hand takes the magazine, the
// pose the gun is turned to while it is reloaded); these functions turn them into the four
// actions the game plays: Idle, Fire, Reload (and Reload Empty) and Inspect.
//
//   rifleActions   box- or drum-fed long guns, mags that drop out of a well, optional charging handle
//   pistolActions  slide pistols and machine pistols with the magazine in the grip
import { HANDS, HIDDEN, k, offset, inFrame } from './rig.js';

const breathe = (W0, r0) => (t) => {
  const a = (t / 3) * Math.PI * 2;
  return { p: [W0[0] + 0.003 * Math.sin(a), W0[1] + 0.004 * Math.sin(2 * a), W0[2] + 0.002 * Math.cos(a)], r: [r0[0] + 0.7 * Math.sin(2 * a), r0[1] + 0.9 * Math.sin(a), r0[2] + 0.6 * Math.cos(a)] };
};
const STILL = (pose) => [k(0, { pose })];

// stretch an action's timeline (a heavy gun is simply slower at everything)
export function scaleAction(A, f) {
  const sc = (keys) => keys.map((q) => ({ ...q, t: q.t * f }));
  const out = { ...A, duration: A.duration * f };
  for (const ch of ['handR', 'handL', 'fingersR', 'fingersL']) if (A[ch]) out[ch] = sc(A[ch]);
  if (Array.isArray(A.weapon)) out.weapon = sc(A.weapon);
  for (const grp of ['props', 'slides', 'spins', 'toggles']) if (A[grp]) out[grp] = Object.fromEntries(Object.entries(A[grp]).map(([b, ks]) => [b, sc(ks)]));
  if (A.events) out.events = A.events.map((e) => ({ ...e, t: e.t * f }));
  return out;
}

// ---------------------------------------------------------------- long guns
// c: { W0, ready, gripR, supportL, magSeat, magOut:[dx,dy,dz], lhMag, lhSlap, magPose, kick, rpm,
//      fingersL, fingersFireL, handle: { bone, hook, hookPose, back, up? }, inspect: [weapon keys], inspectFlash }
export function rifleActions(c) {
  const W0 = c.W0, READY = c.ready || { p: [...W0], r: [0, 5, -3] };
  const SEATED = { attach: 'weapon', p: c.magSeat, r: [0, 0, 0] };
  const out = c.magOut || [0, -0.07, 0.014];
  const MAG_BELOW = { p: offset(c.magSeat, out), r: c.magBelowR || [4, 0, 0] };
  const IN_HAND = { attach: 'hand.L', ...inFrame(c.lhMag, MAG_BELOW) };
  const SUPPORT_L = c.supportL, GRIP_R = c.gripR;
  const kick = c.kick || { back: 0.03, up: 0.008, pitch: -3.4, yaw: 0.6, roll: -0.6 };
  const fd = c.fireDur || 0.16, flashOn = c.flashOn || 0.025;
  const leftPose = c.leftPose || HANDS.wrap, rightPose = c.rightPose || HANDS.pistolGrip, rightFire = c.rightFire || HANDS.squeeze;
  const MAGP = c.magPose, h = c.handle;
  const reload = (empty) => {
    const T = empty ? { end: 3.0, seat: 1.2, slap: 1.26, relax: 1.9 } : { end: 2.1, seat: 1.14, slap: 1.2, relax: 1.85 };
    const lhSlap = c.lhSlap;
    const A = {
      duration: T.end, fps: 30,
      weapon: [
        k(0, READY), k(0.3, MAGP), k(T.seat - 0.04, MAGP),
        k(T.slap, { p: offset(MAGP.p, [0.004, 0.012, 0]), r: [MAGP.r[0] - 3, MAGP.r[1], MAGP.r[2] + 3] }, 'snap'),
        k(T.slap + 0.2, MAGP), k(empty ? 1.75 : T.relax - 0.05, empty ? MAGP : READY), ...(empty ? [k(2.55, READY)] : []), k(T.end, READY),
      ],
      handR: [k(0, GRIP_R), k(T.end, GRIP_R)],
      handL: [
        k(0, SUPPORT_L),
        k(0.24, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0, 0.03, 0]) }),
        k(0.4, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0, 0.03, 0]) }),
        k(0.5, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0.01, -0.03, 0]) }, 'out'),
        k(0.66, { attach: 'world', p: [0.2, -0.72, 0.2], r: [-60, 30, -30] }),
        k(0.8, { attach: 'world', p: [0.19, -0.74, 0.22], r: [-60, 30, -30] }),
        k(0.98, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0.01, -0.06, -0.01]) }),
        k(1.04, { attach: 'weapon', ...c.lhMag }),
        k(T.seat, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0, 0.05, 0]) }, 'in'),
        k(T.seat + 0.02, { ...lhSlap, p: offset(lhSlap.p, [0, -0.04, 0]) }), k(T.slap, lhSlap, 'snap'),
        k(T.slap + 0.3, { ...lhSlap, p: offset(lhSlap.p, [0.02, -0.04, 0]) }),
        ...(empty && h ? [
          k(1.8, { attach: h.hookAttach || 'weapon', ...h.hook, p: offset(h.hook.p, [0.02, 0.04, 0]) }), k(1.95, { attach: h.hookAttach || 'weapon', ...h.hook }),
          k(2.25, { attach: h.hookAttach || 'weapon', ...h.hook }), k(2.4, { attach: h.hookAttach || 'weapon', ...h.hook, p: offset(h.hook.p, [0.02, 0.05, 0]) }),
        ] : []),
        k(empty ? 2.7 : T.relax, SUPPORT_L), k(T.end, SUPPORT_L),
      ],
      fingersR: [k(0, { pose: rightPose }), k(T.end, { pose: rightPose })],
      fingersL: [k(0, { pose: leftPose }), k(0.24, { pose: HANDS.relaxed }), k(0.4, { pose: HANDS.grab }), k(0.66, { pose: HANDS.grab }), k(0.8, { pose: HANDS.relaxed }), k(0.9, { pose: HANDS.grab }), k(T.seat, { pose: HANDS.grab }), k(T.slap, { pose: HANDS.flat }), k(T.slap + 0.3, { pose: HANDS.flat }),
        ...(empty && h ? [k(1.8, { pose: HANDS.relaxed }), k(1.95, { pose: h.hookPose || HANDS.hook }), k(2.25, { pose: h.hookPose || HANDS.hook }), k(2.4, { pose: HANDS.relaxed })] : []),
        k(empty ? 2.7 : T.relax, { pose: leftPose }), k(T.end, { pose: leftPose })],
      props: {
        mag: [
          k(0, SEATED), k(0.4, SEATED),
          k(0.5, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.02, 0]) }, 'out'),
          k(0.56, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.02, -0.06, 0]), r: [10, 0, 20] }),
          k(0.8, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'),
          k(0.81, HIDDEN, 'hold'), k(0.82, { ...IN_HAND }, 'hold'),
          k(1.04, IN_HAND), k(T.seat, SEATED, 'in'), k(T.end, SEATED),
        ],
      },
      events: [{ t: 0.5, name: 'magOut' }, { t: T.seat + 0.02, name: 'magIn' }],
    };
    if (c.cover) { // a top cover or a dust door that opens for the swap
      const cv = c.cover;
      A.spins = { [cv.bone]: [k(0, { v: 0 }), k(0.3, { v: 0 }), k(0.46, { v: cv.open }, 'snap'), k(T.seat - 0.1, { v: cv.open }), k(T.seat + 0.1, { v: 0 }, 'snap'), k(T.end, { v: 0 })] };
    }
    if (empty && h) {
      A.slides = { [h.bone]: [k(0, { v: 0 }), k(1.95, { v: 0 }), k(2.1, { v: h.back }), k(2.28, { v: h.back }), k(2.36, { v: 0 }, 'snap'), k(T.end, { v: 0 })] };
      A.events.push({ t: 2.36, name: 'boltHome' });
    } else if (h) A.slides = { [h.bone]: [k(0, { v: 0 })] };
    return A;
  };
  const insp = c.inspect || [
    k(0, READY), k(0.35, { p: offset(W0, [0, -0.01, 0.05]), r: [-4, -24, 8] }), k(0.75, { p: [0.0, -0.13, 0.36], r: [-8, -58, 14] }), k(1.5, { p: [0.004, -0.128, 0.365], r: [-10, -60, 16] }),
    k(2.1, { p: [0.0, -0.13, 0.36], r: [-8, 40, -26] }), k(3.1, { p: [0.004, -0.13, 0.36], r: [-10, 44, -30] }), k(3.6, { p: offset(W0, [0.01, -0.02, 0.05]), r: [4, 10, -8] }), k(3.95, { p: offset(W0, [0, -0.005, 0]), r: [1, 5, -3] }), k(4.2, READY),
  ];
  const A = {
    Idle: { duration: 3, loop: true, fps: 20, weapon: breathe(W0, READY.r), handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)], fingersR: STILL(rightPose), fingersL: [k(0, { pose: leftPose }), k(1.5, { pose: c.fingersL || { curl: [0.4, 0.62, 0.68, 0.72, 0.76], spread: 0.06 } }), k(3, { pose: leftPose })] },
    Fire: {
      duration: fd, fps: 60,
      weapon: [k(0, READY), k(0.02, { p: [READY.p[0] + (kick.x || 0.003), READY.p[1] + kick.up, READY.p[2] - kick.back], r: [READY.r[0] + kick.pitch, READY.r[1] + kick.yaw, READY.r[2] + kick.roll] }, 'snap'), k(fd, READY)],
      handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
      fingersR: [k(0, { pose: rightFire }), k(fd, { pose: rightFire })],
      fingersL: [k(0, { pose: leftPose }), k(0.03, { pose: c.fingersFireL || { curl: [0.45, 0.7, 0.74, 0.77, 0.8], spread: 0.04 } }, 'snap'), k(fd, { pose: leftPose })],
      toggles: { flash: [k(0, { v: 1 }), k(flashOn, { v: 1 }, 'hold'), k(flashOn + 0.001, { v: 0 }, 'hold')] },
      events: [{ t: 0, name: 'shot' }],
    },
    Reload: c.reloadScale ? scaleAction(reload(false), c.reloadScale) : reload(false),
    'Reload Empty': c.reloadScale ? scaleAction(reload(true), c.reloadScale) : reload(true),
  };
  A.Inspect = {
    duration: 4.2, fps: 30, weapon: insp,
    handR: [k(0, GRIP_R), k(4.2, GRIP_R)],
    handL: h ? [k(0, SUPPORT_L), k(2.2, SUPPORT_L), k(2.35, { attach: h.hookAttach || 'weapon', ...h.hook }), k(2.9, { attach: h.hookAttach || 'weapon', ...h.hook }), k(3.1, SUPPORT_L), k(4.2, SUPPORT_L)] : [k(0, SUPPORT_L), k(4.2, SUPPORT_L)],
    fingersR: [k(0, { pose: rightPose }), k(4.2, { pose: rightPose })],
    fingersL: h ? [k(0, { pose: leftPose }), k(2.2, { pose: leftPose }), k(2.35, { pose: h.hookPose || HANDS.hook }), k(2.9, { pose: h.hookPose || HANDS.hook }), k(3.1, { pose: leftPose }), k(4.2, { pose: leftPose })] : [k(0, { pose: leftPose }), k(4.2, { pose: leftPose })],
    events: [],
  };
  if (h) { A.Inspect.slides = { [h.bone]: [k(0, { v: 0 }), k(2.4, { v: 0 }), k(2.55, { v: h.back * 0.35 }), k(2.8, { v: h.back * 0.35 }), k(2.88, { v: 0 }, 'snap')] }; A.Inspect.events.push({ t: 2.88, name: 'boltHome' }); }
  if (c.cover) A.Inspect.spins = { [c.cover.bone]: [k(0, { v: 0 }), k(1.7, { v: 0 }), k(1.9, { v: c.cover.open * 0.7 }, 'snap'), k(2.5, { v: c.cover.open * 0.7 }), k(2.7, { v: 0 }, 'snap')] };
  return A;
}

// ---------------------------------------------------------------- pistols
// c: { W0, ready, gripR, supportL, magSeat, lhMag, lhSlap, pouch, rack, slideBack, kick, magPose, spin?: bool }
export function pistolActions(c) {
  const W0 = c.W0, READY = c.ready || { p: [...W0], r: [0, 4, -3] };
  const SEATED = { attach: 'weapon', p: c.magSeat, r: [0, 0, 0] };
  const MAG_BELOW = { p: offset(c.magSeat, [0, -0.08, 0.004]), r: [0, 0, 0] };
  const IN_HAND = { attach: 'hand.L', ...inFrame(c.lhMag, MAG_BELOW) };
  const GRIP_R = c.gripR, SUPPORT_L = c.supportL, SB = c.slideBack;
  const kick = c.kick || { back: 0.02, up: 0.012, pitch: -6, yaw: 0.2, roll: -0.4 };
  const KICK = { p: [READY.p[0], READY.p[1] + kick.up, READY.p[2] - kick.back], r: [READY.r[0] + kick.pitch, READY.r[1] + kick.yaw, READY.r[2] + kick.roll] };
  const rightPose = c.rightPose || HANDS.pistolGrip, leftPose = c.leftPose || HANDS.pistolWrap;
  const fire = (last) => ({
    duration: last ? 0.5 : 0.4, fps: 60,
    weapon: [k(0, READY), k(0.03, KICK, 'snap'), k(0.13, { p: offset(READY.p, [0.001, 0.01, -0.01]), r: [READY.r[0] - 3, READY.r[1] + 0.3, READY.r[2]] }), k(last ? 0.5 : 0.4, READY)],
    handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)],
    fingersR: [k(0, { pose: HANDS.squeeze }), k(0.12, { pose: HANDS.squeeze }), k(0.3, { pose: rightPose })],
    fingersL: [k(0, { pose: leftPose }), k(0.04, { pose: { curl: [0.45, 0.74, 0.78, 0.82, 0.84], spread: 0.03 } }, 'snap'), k(0.3, { pose: leftPose })],
    slides: { slide: last ? [k(0, { v: 0 }), k(0.03, { v: SB }, 'snap')] : [k(0, { v: 0 }), k(0.03, { v: SB }, 'snap'), k(0.07, { v: 0 }, 'snap')] },
    spins: c.trigger ? { trigger: [k(0, { v: 16 }), k(0.03, { v: 16 }), k(0.3, { v: 0 })] } : undefined,
    toggles: { flash: [k(0, { v: 1 }), k(0.035, { v: 1 }, 'hold'), k(0.036, { v: 0 }, 'hold')] },
    events: [{ t: 0, name: 'shot' }, { t: 0.03, name: 'eject' }, ...(last ? [{ t: 0.06, name: 'slideLock' }] : [])],
  });
  const reload = (empty) => {
    const d = empty ? 2.6 : 2.1, t1 = 1.25, slap = 1.3;
    return {
      duration: d, fps: 30,
      weapon: [k(0, READY), k(0.24, c.magPose), k(t1 - 0.02, c.magPose), k(slap, { p: offset(c.magPose.p, [0, 0.012, 0.004]), r: [c.magPose.r[0] - 3, c.magPose.r[1], c.magPose.r[2]] }, 'snap'), k(1.62, c.magPose), ...(empty ? [k(1.8, { p: offset(c.magPose.p, [0.003, 0.004, -0.008]), r: c.magPose.r }, 'snap')] : []), k(empty ? 2.3 : 1.88, READY), k(d, READY)],
      handR: [k(0, GRIP_R), k(0.2, GRIP_R), k(0.26, { attach: 'weapon', p: offset(GRIP_R.p, [0.002, 0.012, 0.006]), r: GRIP_R.r }), k(0.36, GRIP_R), k(d, GRIP_R)],
      handL: [
        k(0, SUPPORT_L),
        k(0.22, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0.02, -0.03, 0]) }), k(0.32, { attach: 'weapon', ...c.lhMag }),
        k(0.44, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0, -0.09, 0]) }, 'out'),
        k(0.6, c.pouch), k(0.76, { ...c.pouch, p: offset(c.pouch.p, [0, -0.01, 0.01]) }),
        k(0.98, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0, -0.1, 0]) }), k(1.1, { attach: 'weapon', ...c.lhMag, p: offset(c.lhMag.p, [0, -0.09, 0]) }),
        k(t1, { attach: 'weapon', ...c.lhMag }, 'in'),
        k(t1 + 0.02, { ...c.lhSlap, p: offset(c.lhSlap.p, [0, -0.04, 0]) }), k(slap, c.lhSlap, 'snap'), k(1.6, { ...c.lhSlap, p: offset(c.lhSlap.p, [0.02, -0.04, 0]) }),
        k(empty ? 2.25 : 1.88, SUPPORT_L), k(d, SUPPORT_L),
      ],
      fingersR: [k(0, { pose: rightPose }), k(0.22, { pose: rightPose }), k(0.28, { pose: HANDS.push }), k(0.38, { pose: rightPose }), ...(empty ? [k(1.7, { pose: rightPose }), k(1.78, { pose: HANDS.push }), k(1.95, { pose: rightPose })] : []), k(d, { pose: rightPose })],
      fingersL: [k(0, { pose: leftPose }), k(0.22, { pose: HANDS.relaxed }), k(0.32, { pose: HANDS.grab }), k(0.5, { pose: HANDS.grab }), k(0.62, { pose: HANDS.relaxed }), k(0.78, { pose: HANDS.grab }), k(t1, { pose: HANDS.grab }), k(slap, { pose: HANDS.flat }), k(1.7, { pose: HANDS.relaxed }), k(empty ? 2.25 : 1.88, { pose: leftPose }), k(d, { pose: leftPose })],
      props: { mag: [k(0, SEATED), k(0.32, SEATED), k(0.44, { attach: 'weapon', ...MAG_BELOW }, 'out'), k(0.48, { attach: 'weapon', ...MAG_BELOW, p: offset(MAG_BELOW.p, [0.01, -0.05, 0]), r: [10, 0, 20] }), k(0.74, { attach: 'world', p: [-0.05, -1.1, 0.4], r: [120, 40, 90] }, 'in'), k(0.75, HIDDEN, 'hold'), k(0.76, { ...IN_HAND }, 'hold'), k(1.1, IN_HAND), k(t1, SEATED, 'in'), k(d, SEATED)] },
      slides: { slide: empty ? [k(0, { v: SB }), k(1.74, { v: SB }), k(1.8, { v: 0 }, 'snap')] : [k(0, { v: 0 })] },
      events: [{ t: 0.44, name: 'magOut' }, { t: t1, name: 'magIn' }, ...(empty ? [{ t: 1.8, name: 'boltHome' }] : [])],
    };
  };
  const rack = c.rack;
  return {
    Idle: { duration: 3, loop: true, fps: 20, weapon: breathe(W0, READY.r), handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)], fingersR: STILL(rightPose), fingersL: [k(0, { pose: leftPose }), k(1.5, { pose: { curl: [0.32, 0.8, 0.86, 0.9, 0.94], spread: 0.01 } }), k(3, { pose: leftPose })] },
    'Idle Empty': { duration: 3, loop: true, fps: 20, weapon: breathe(W0, READY.r), handR: [k(0, GRIP_R)], handL: [k(0, SUPPORT_L)], fingersR: STILL(rightPose), fingersL: [k(0, { pose: leftPose }), k(1.5, { pose: { curl: [0.32, 0.8, 0.86, 0.9, 0.94], spread: 0.01 } }), k(3, { pose: leftPose })], slides: { slide: [k(0, { v: SB })] } },
    Fire: fire(false), 'Fire Last': fire(true), Reload: reload(false), 'Reload Empty': reload(true),
    Inspect: {
      duration: 4.6, fps: 30,
      weapon: c.inspect || [
        k(0, READY), k(0.4, { p: offset(W0, [0.01, -0.02, 0.03]), r: [-2, -28, 12] }), k(0.9, { p: offset(W0, [0.0, -0.01, 0.06]), r: [-6, -62, 18] }), k(1.5, { p: offset(W0, [0.0, -0.01, 0.06]), r: [-6, -64, 18] }),
        k(2.1, { p: offset(W0, [0.02, 0, 0.05]), r: [-10, 24, -14] }), k(2.7, { p: offset(W0, [0.02, 0, 0.05]), r: [-10, 26, -14] }), k(3.3, { p: offset(W0, [0.01, 0.01, 0.03]), r: [14, 8, -6] }), k(3.8, { p: offset(W0, [0.005, 0.0, 0.01]), r: [-14, 2, -3] }), k(4.1, { p: offset(W0, [0, -0.004, 0]), r: [1, 4, -3] }), k(4.6, READY),
      ],
      handR: [k(0, GRIP_R), k(4.6, GRIP_R)],
      handL: [k(0, SUPPORT_L), k(1.7, SUPPORT_L), k(1.9, { ...rack, p: offset(rack.p, [0.02, 0.03, 0.01]) }), k(2.0, rack), k(2.5, rack), k(2.65, { ...rack, p: offset(rack.p, [0.03, 0.04, 0.02]) }), k(3.0, SUPPORT_L), k(4.6, SUPPORT_L)],
      fingersR: [k(0, { pose: rightPose }), k(4.6, { pose: rightPose })],
      fingersL: [k(0, { pose: leftPose }), k(1.7, { pose: leftPose }), k(1.9, { pose: HANDS.relaxed }), k(2.0, { pose: HANDS.grab }), k(2.5, { pose: HANDS.grab }), k(2.65, { pose: HANDS.relaxed }), k(3.0, { pose: leftPose }), k(4.6, { pose: leftPose })],
      slides: { slide: [k(0, { v: 0 }), k(2.0, { v: 0 }), k(2.25, { v: -0.03 }), k(2.5, { v: -0.03 }), k(2.6, { v: 0 }, 'snap')] },
      events: [{ t: 2.25, name: 'charge' }, { t: 2.6, name: 'boltHome' }],
    },
  };
}
