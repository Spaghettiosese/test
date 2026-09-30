// The humanoid skeleton every person in Hollowmere shares (same bone names as the engine's
// Cowboy, so the engine's gait synthesizer, IK and hand poses work on it unchanged).
// Fingers: rest pose is straight, hanging down, palm facing the thigh (-X for the left hand).
const KNUCKLE_Y = 0.845, FINGER_X = 0.277;
export const FINGERS = [
  { name: 'index', z: 0.041, length: 0.052, radius: 0.0092 },
  { name: 'middle', z: 0.0215, length: 0.057, radius: 0.0095 },
  { name: 'ring', z: 0.002, length: 0.053, radius: 0.0092 },
  { name: 'pinky', z: -0.0175, length: 0.043, radius: 0.0082 },
];
const FINGER_BONES = [
  ...FINGERS.flatMap((f) => {
    const j = KNUCKLE_Y - f.length * 0.55, tip = KNUCKLE_Y - f.length;
    return [
      { name: f.name + '1.L', parent: 'hand.L', head: [FINGER_X, KNUCKLE_Y, f.z], tail: [FINGER_X, j, f.z], mirror: true },
      { name: f.name + '2.L', parent: f.name + '1.L', head: [FINGER_X, j, f.z], tail: [FINGER_X, tip, f.z], mirror: true },
    ];
  }),
  { name: 'thumb1.L', parent: 'hand.L', head: [0.271, 0.8925, 0.042], tail: [0.262, 0.87, 0.055], mirror: true },
  { name: 'thumb2.L', parent: 'thumb1.L', head: [0.262, 0.87, 0.055], tail: [0.253, 0.8475, 0.068], mirror: true },
];
export const BASE_SKELETON = [
  { name: 'root', parent: null, head: [0, 0, 0], tail: [0, 0.2, 0], deform: false },
  { name: 'hips', parent: 'root', head: [0, 0.98, 0], tail: [0, 1.1, 0] },
  { name: 'spine', parent: 'hips', head: [0, 1.1, 0], tail: [0, 1.28, 0] },
  { name: 'chest', parent: 'spine', head: [0, 1.28, 0], tail: [0, 1.5, 0] },
  { name: 'neck', parent: 'chest', head: [0, 1.5, 0], tail: [0, 1.6, 0.01] },
  { name: 'head', parent: 'neck', head: [0, 1.6, 0.01], tail: [0, 1.84, 0.01] },
  { name: 'shoulder.L', parent: 'chest', head: [0.04, 1.45, -0.01], tail: [0.18, 1.45, -0.01], mirror: true },
  { name: 'upperArm.L', parent: 'shoulder.L', head: [0.18, 1.45, -0.01], tail: [0.235, 1.175, -0.02], mirror: true },
  { name: 'foreArm.L', parent: 'upperArm.L', head: [0.235, 1.175, -0.02], tail: [0.265, 0.935, 0.01], mirror: true },
  { name: 'hand.L', parent: 'foreArm.L', head: [0.265, 0.935, 0.01], tail: [0.276, 0.845, 0.018], mirror: true },
  ...FINGER_BONES,
  { name: 'thigh.L', parent: 'hips', head: [0.095, 0.95, 0], tail: [0.105, 0.53, 0.01], mirror: true },
  { name: 'shin.L', parent: 'thigh.L', head: [0.105, 0.53, 0.01], tail: [0.11, 0.1, -0.01], mirror: true },
  { name: 'foot.L', parent: 'shin.L', head: [0.11, 0.1, -0.01], tail: [0.113, 0.03, 0.12], mirror: true },
  { name: 'toe.L', parent: 'foot.L', head: [0.113, 0.03, 0.12], tail: [0.115, 0.025, 0.21], mirror: true },
];
// Extra spring (jiggle) bones for capes, hoods, tabards, robes.
export const SPRINGS = {
  cape: { name: 'cape', parent: 'chest', head: [0, 1.46, -0.1], tail: [0, 0.78, -0.2], spring: { stiffness: 120, damping: 9, gravity: 3.5 } },
  tabard: { name: 'tabard', parent: 'hips', head: [0, 1.0, 0.11], tail: [0, 0.55, 0.13], spring: { stiffness: 210, damping: 11, gravity: 2.2 } },
  tabardBack: { name: 'tabardBack', parent: 'hips', head: [0, 1.0, -0.11], tail: [0, 0.55, -0.13], spring: { stiffness: 210, damping: 11, gravity: 2.2 } },
  scarf: { name: 'scarf', parent: 'neck', head: [0, 1.5, -0.07], tail: [0, 1.2, -0.14], spring: { stiffness: 150, damping: 8, gravity: 3 } },
};
