// The roster: nineteen attackers and nineteen defenders, each with a signature gadget, stats,
// a loadout menu and a look for the 3D model. The operators are original characters; their
// roles follow the familiar attack/defence archetypes (breacher, anchor, intel, support...).
//   speed 1-3 (armour = 4 - speed): speed 1 = 125 hp / slow, speed 3 = 100 hp / quick
export const ORGS = {
  IRONGUARD: { name: 'IRON GUARD', color: '#8a7a5a' }, NORTHWATCH: { name: 'NORTHWATCH', color: '#5a7a9a' }, KESTREL: { name: 'KESTREL', color: '#9a6a3a' },
  VANGUARD: { name: 'VANGUARD', color: '#4a7a5a' }, OBSIDIAN: { name: 'OBSIDIAN', color: '#5a5a6a' }, HALBERD: { name: 'HALBERD', color: '#7a4a4a' },
  ASHFORD: { name: 'ASHFORD', color: '#6a5a8a' }, TIDEWATCH: { name: 'TIDEWATCH', color: '#3a7a8a' },
};

const op = (id, side, name, org, role, diff, speed, ability, loadout, look, extra = {}) => ({ id, side, name, org, role, diff, speed, armor: 4 - speed, ability, ...loadout, look, ...extra });
const L = (primary, secondary, gadgets) => ({ primary, secondary, gadgets });

export const OPERATORS = [
  // ===================================================================== ATTACKERS
  op('hammer', 'atk', 'HAMMER', 'IRONGUARD', 'Front-line breacher', 1, 2, 'hammer', L(['m4a1', 'pump', 'l7'], ['deagle', 'compact', 'm45'], ['stun', 'smoke']),
    { skin: '#c9966b', uni: '#4b5040', trim: '#2b2e26', head: 'helmet', headColor: '#3b3f33', mask: '#2a2a2a', glasses: false, pack: 'none', stripe: '#c8a050' }),
  op('burner', 'atk', 'BURNER', 'KESTREL', 'Hard breacher', 2, 2, 'thermite', L(['m4a1', 'mp7', 'aug'], ['magnum', 'compact'], ['frag', 'breach']),
    { skin: '#8d5a3a', uni: '#5a4a3a', trim: '#2f2923', head: 'cap', headColor: '#2d2d2d', mask: '#1f1f1f', glasses: true, pack: 'tank', stripe: '#d06020' }),
  op('bulwark', 'atk', 'BULWARK', 'NORTHWATCH', 'Shield bearer', 1, 1, 'shield', L(['mp7', 'pdw9'], ['compact', 'deagle', 'm45'], ['claymore', 'stun']),
    { skin: '#e0b894', uni: '#2f3a4a', trim: '#1c232d', head: 'helmet', headColor: '#232b36', mask: null, glasses: false, pack: 'none', stripe: '#8aa0c0', visor: true }),
  op('scanner', 'atk', 'SCANNER', 'VANGUARD', 'Intel specialist', 2, 2, 'scanner', L(['mp5', 'r4c', 'svd'], ['compact', 'magnum'], ['frag', 'smoke']),
    { skin: '#b57d52', uni: '#3d4f46', trim: '#232d28', head: 'beret', headColor: '#2f4a3a', mask: null, glasses: true, pack: 'radio', stripe: '#6fd08a' }),
  op('ember', 'atk', 'EMBER', 'ASHFORD', 'Soft-wall breacher', 2, 2, 'launcher', L(['r4c', 'm4a1', 'aug'], ['compact', 'm45'], ['breach', 'smoke']),
    { skin: '#f0c9a8', uni: '#5c4a58', trim: '#2c232b', head: 'hood', headColor: '#3c2f3a', mask: '#222', glasses: false, pack: 'none', stripe: '#e07050' }),
  op('spark', 'atk', 'SPARK', 'OBSIDIAN', 'Shock drone pilot', 2, 2, 'shockdrone', L(['ak74', 'r4c', 'lever'], ['magnum', 'compact'], ['claymore', 'stun']),
    { skin: '#6b4528', uni: '#33363c', trim: '#1b1d21', head: 'cap', headColor: '#1f2125', mask: null, glasses: true, pack: 'drone', stripe: '#60b0ff' }),
  op('dazzle', 'atk', 'DAZZLE', 'TIDEWATCH', 'Flash support', 3, 3, 'bangs', L(['mpk', 'pdw9'], ['compact'], ['smoke', 'frag']),
    { skin: '#d2a07a', uni: '#2f5058', trim: '#1c2f33', head: 'headband', headColor: '#e0e0e0', mask: null, glasses: true, pack: 'none', stripe: '#f2e060' }),
  op('cluster', 'atk', 'CLUSTER', 'HALBERD', 'Demolitions', 2, 2, 'cluster', L(['ak47', 'pump', 'l7'], ['deagle', 'magnum'], ['frag', 'claymore']),
    { skin: '#c48a60', uni: '#58452f', trim: '#2c2217', head: 'gasmask', headColor: '#3a3a30', mask: '#2f3a2a', glasses: false, pack: 'bags', stripe: '#d0a030' }),
  op('strobe', 'atk', 'STROBE', 'NORTHWATCH', 'Flash shield', 2, 3, 'flashshield', L(['mp5', 'mpk'], ['compact', 'm45'], ['smoke', 'claymore']),
    { skin: '#a56e48', uni: '#3a4254', trim: '#1e222c', head: 'helmet', headColor: '#2a3040', mask: null, glasses: true, pack: 'none', stripe: '#a0c0ff', visor: true }),
  op('remedy', 'atk', 'REMEDY', 'VANGUARD', 'Field medic', 1, 3, 'stimpistol', L(['m4a1', 'garand', 'svd'], ['compact', 'deagle'], ['stun', 'frag']),
    { skin: '#e6c0a0', uni: '#41524a', trim: '#232f2a', head: 'bare', headColor: '#41524a', mask: null, glasses: false, pack: 'medic', stripe: '#ff5050' }),
  op('radar', 'atk', 'RADAR', 'KESTREL', 'Sonic recon', 2, 2, 'sonar', L(['ak74', 'garand', 'lever'], ['magnum', 'compact', 'm45'], ['stun', 'breach']),
    { skin: '#9a6a44', uni: '#4a5238', trim: '#262b1d', head: 'beret', headColor: '#5a4a30', mask: null, glasses: false, pack: 'radio', stripe: '#c0d050' }),
  op('cinder', 'atk', 'CINDER', 'IRONGUARD', 'Smoke screen', 2, 2, 'cinders', L(['r4c', 'mp5', 'aug'], ['compact', 'magnum'], ['breach', 'frag']),
    { skin: '#7a4f33', uni: '#46464a', trim: '#242427', head: 'balaclava', headColor: '#1e1e20', mask: null, glasses: true, pack: 'none', stripe: '#b0b0b8' }),
  op('arc', 'atk', 'ARC', 'OBSIDIAN', 'Pellet breacher', 2, 3, 'xpellet', L(['ak74', 'mpk', 'd12'], ['compact'], ['claymore', 'smoke']),
    { skin: '#c8956a', uni: '#2d3a3a', trim: '#181f1f', head: 'hood', headColor: '#22302f', mask: '#1a1a1a', glasses: true, pack: 'none', stripe: '#a050e0' }),
  op('torch', 'atk', 'TORCH', 'HALBERD', 'Silent breacher', 3, 3, 'torch', L(['ak47', 'm4a1', 'svd'], ['deagle', 'm45'], ['stun', 'breach']),
    { skin: '#b9845a', uni: '#524a38', trim: '#27231a', head: 'cap', headColor: '#6a5a40', mask: null, glasses: true, pack: 'tank', stripe: '#ff8030' }),

  op('surge', 'atk', 'SURGE', 'OBSIDIAN', 'Gadget breaker', 2, 3, 'emp', L(['mp7', 'r4c', 'aug'], ['compact', 'magnum'], ['smoke', 'claymore']),
    { skin: '#b98a62', uni: '#2c3640', trim: '#161c22', head: 'helmet', headColor: '#1f2a33', mask: '#222', glasses: true, pack: 'radio', stripe: '#5ad0ff', visor: true }),
  op('phantom', 'atk', 'PHANTOM', 'TIDEWATCH', 'Sound decoy', 2, 3, 'decoy', L(['mpk', 'mp5', 'lever'], ['compact', 'm45'], ['stun', 'smoke']),
    { skin: '#e2b896', uni: '#3a4a52', trim: '#1c262b', head: 'hood', headColor: '#27353b', mask: '#1e1e1e', glasses: false, pack: 'radio', stripe: '#9ae0ff' }),
  op('whisper', 'atk', 'WHISPER', 'KESTREL', 'Silent flanker', 3, 3, 'silentstep', L(['aug', 'svd', 'mp5'], ['compact', 'magnum'], ['stun', 'frag']),
    { skin: '#7c5233', uni: '#2e332e', trim: '#171a17', head: 'balaclava', headColor: '#1b1e1b', mask: null, glasses: true, pack: 'none', stripe: '#8aa68a' }),
  op('mule', 'atk', 'MULE', 'IRONGUARD', 'Supply carrier', 1, 1, 'supply', L(['ak47', 'pump', 'l7'], ['deagle', 'compact'], ['frag', 'smoke']),
    { skin: '#c99a70', uni: '#55493a', trim: '#2a241c', head: 'helmet', headColor: '#463d30', mask: null, glasses: false, pack: 'bags', stripe: '#d4b45a' }),
  op('havoc', 'atk', 'HAVOC', 'HALBERD', 'Grenadier', 2, 2, 'gl', L(['m4a1', 'ak74', 'l7'], ['magnum', 'm45'], ['breach', 'smoke']),
    { skin: '#b17b55', uni: '#4a3d34', trim: '#241d18', head: 'cap', headColor: '#3a2f27', mask: '#262626', glasses: true, pack: 'bags', stripe: '#e06a30' }),
  // ===================================================================== DEFENDERS
  op('anvil', 'def', 'ANVIL', 'NORTHWATCH', 'Door anchor', 1, 1, 'armorpanel', L(['mpk', 'pump', 'd12'], ['magnum', 'deagle'], ['barbwire', 'impact']),
    { skin: '#d9a47c', uni: '#35465a', trim: '#1c2430', head: 'helmet', headColor: '#27323f', mask: null, glasses: false, pack: 'none', stripe: '#d04040' }),
  op('warden', 'def', 'WARDEN', 'IRONGUARD', 'Armour support', 2, 2, 'armorpack', L(['ak47', 'coach', 'l7'], ['compact', 'deagle', 'm45'], ['barbwire', 'dshield']),
    { skin: '#7a5236', uni: '#5a4e3c', trim: '#2b251c', head: 'helmet', headColor: '#4a4234', mask: '#262626', glasses: false, pack: 'bags', stripe: '#e8d070' }),
  op('snare', 'def', 'SNARE', 'KESTREL', 'Trapper', 2, 2, 'mat', L(['mp5', 'pump', 'lever'], ['magnum', 'compact'], ['impact', 'alarm']),
    { skin: '#e8c8a8', uni: '#44525e', trim: '#222a31', head: 'hood', headColor: '#334049', mask: '#2a2a2a', glasses: true, pack: 'none', stripe: '#80d0ff' }),
  op('trap', 'def', 'TRAP', 'HALBERD', 'Tripwire trapper', 2, 2, 'edd', L(['ak74', 'coach', 'svd'], ['magnum'], ['barbwire', 'impact']),
    { skin: '#b3835e', uni: '#4e4a3a', trim: '#26231a', head: 'gasmask', headColor: '#2f3028', mask: '#3a4030', glasses: false, pack: 'none', stripe: '#e05030' }),
  op('jammer', 'def', 'JAMMER', 'ASHFORD', 'Electronic warfare', 3, 3, 'jammer', L(['mp5', 'mpk', 'pdw9'], ['compact', 'm45'], ['alarm', 'impact']),
    { skin: '#c39066', uni: '#3c3448', trim: '#1e1925', head: 'headband', headColor: '#3c3448', mask: null, glasses: true, pack: 'radio', stripe: '#c070ff' }),
  op('lens', 'def', 'LENS', 'TIDEWATCH', 'Camera operator', 2, 3, 'cams', L(['r4c', 'mp7', 'aug'], ['compact', 'magnum'], ['barbwire', 'alarm']),
    { skin: '#8e6040', uni: '#2f4d52', trim: '#17282b', head: 'cap', headColor: '#2f4d52', mask: null, glasses: true, pack: 'none', stripe: '#40e0d0' }),
  op('salve', 'def', 'SALVE', 'VANGUARD', 'Defensive medic', 2, 2, 'stimpistol', L(['mp5', 'm4a1', 'aug'], ['deagle', 'compact', 'm45'], ['barbwire', 'impact']),
    { skin: '#f0cfae', uni: '#3f5445', trim: '#202c24', head: 'bare', headColor: '#3f5445', mask: null, glasses: false, pack: 'medic', stripe: '#ff6060' }),
  op('rampart', 'def', 'RAMPART', 'OBSIDIAN', 'Barrier anchor', 1, 1, 'dshield', L(['pump', 'mpk', 'd12'], ['deagle'], ['barbwire', 'alarm']),
    { skin: '#6a4630', uni: '#303236', trim: '#17181a', head: 'helmet', headColor: '#222428', mask: null, glasses: false, pack: 'none', stripe: '#9099a8' }),
  op('sentry', 'def', 'SENTRY', 'ASHFORD', 'Turret operator', 2, 2, 'turret', L(['ak74', 'mp5', 'lever'], ['compact', 'magnum', 'm45'], ['impact', 'barbwire']),
    { skin: '#d6a681', uni: '#4a4458', trim: '#25222d', head: 'beret', headColor: '#4a4458', mask: null, glasses: false, pack: 'drone', stripe: '#c0b0ff' }),
  op('blast', 'def', 'BLAST', 'HALBERD', 'Demolitions', 2, 2, 'nitro', L(['ak47', 'coach', 'd12'], ['magnum', 'deagle'], ['barbwire', 'alarm']),
    { skin: '#bb8860', uni: '#58402d', trim: '#2b2016', head: 'cap', headColor: '#3b2f22', mask: null, glasses: true, pack: 'bags', stripe: '#f0a030' }),
  op('volt', 'def', 'VOLT', 'OBSIDIAN', 'Shock-wire anchor', 3, 3, 'shockwire', L(['mpk', 'mp7', 'pdw9'], ['compact', 'm45'], ['impact', 'alarm']),
    { skin: '#cf9a70', uni: '#3a3a42', trim: '#1c1c21', head: 'hood', headColor: '#2c2c33', mask: '#1c1c1c', glasses: true, pack: 'none', stripe: '#ffe040' }),
  op('venom', 'def', 'VENOM', 'KESTREL', 'Gas mines', 2, 2, 'mines', L(['m4a1', 'pdw9', 'aug'], ['compact', 'deagle'], ['barbwire', 'impact']),
    { skin: '#a77852', uni: '#3d5238', trim: '#1f2a1c', head: 'gasmask', headColor: '#3a4a34', mask: '#3a4a34', glasses: false, pack: 'tank', stripe: '#90ff50' }),
  op('oasis', 'def', 'OASIS', 'TIDEWATCH', 'Healing support', 3, 3, 'healstation', L(['mp7', 'ak74', 'pdw9'], ['magnum', 'compact'], ['alarm', 'impact']),
    { skin: '#c7916a', uni: '#4a6a6a', trim: '#263636', head: 'headband', headColor: '#d8e0d0', mask: null, glasses: false, pack: 'medic', stripe: '#70ffc0' }),
  op('mason', 'def', 'MASON', 'IRONGUARD', 'Reinforcement master', 2, 2, 'extrareinforce', L(['pump', 'm4a1'], ['deagle', 'magnum'], ['barbwire', 'dshield']),
    { skin: '#d4a57c', uni: '#524a40', trim: '#28241e', head: 'helmet', headColor: '#3d372e', mask: null, glasses: false, pack: 'bags', stripe: '#c0a070' }),
  op('blaze', 'def', 'BLAZE', 'ASHFORD', 'Fire trapper', 2, 2, 'firemine', L(['mp5', 'pump', 'ak74'], ['magnum', 'compact'], ['barbwire', 'impact']),
    { skin: '#c28a62', uni: '#5a3a2c', trim: '#2b1b14', head: 'gasmask', headColor: '#3b2b22', mask: '#40302a', glasses: false, pack: 'tank', stripe: '#ff7a20' }),
  op('glare', 'def', 'GLARE', 'TIDEWATCH', 'Flash trapper', 3, 3, 'flashmine', L(['mpk', 'mp7', 'pdw9'], ['compact', 'm45'], ['alarm', 'impact']),
    { skin: '#e4bf9e', uni: '#2f4b57', trim: '#17262c', head: 'headband', headColor: '#f0f0f0', mask: null, glasses: true, pack: 'none', stripe: '#fff08a' }),
  op('seismic', 'def', 'SEISMIC', 'VANGUARD', 'Listening post', 2, 2, 'sensor', L(['r4c', 'm4a1', 'aug'], ['deagle', 'compact'], ['barbwire', 'alarm']),
    { skin: '#a37550', uni: '#3a4e42', trim: '#1c2a22', head: 'beret', headColor: '#2f4a3a', mask: null, glasses: true, pack: 'radio', stripe: '#7ad0a0' }),
  op('fog', 'def', 'FOG', 'NORTHWATCH', 'Smoke trapper', 2, 2, 'fogger', L(['pdw9', 'mp7', 'lever'], ['compact', 'magnum'], ['impact', 'barbwire']),
    { skin: '#d8ac88', uni: '#4a5260', trim: '#262b33', head: 'hood', headColor: '#394049', mask: '#2a2a2a', glasses: false, pack: 'none', stripe: '#b8c0cc' }),
  op('depot', 'def', 'DEPOT', 'IRONGUARD', 'Quartermaster', 1, 1, 'supply', L(['ak47', 'coach', 'd12'], ['deagle', 'magnum'], ['barbwire', 'dshield']),
    { skin: '#8a603e', uni: '#4e4638', trim: '#252018', head: 'helmet', headColor: '#3c362b', mask: null, glasses: false, pack: 'bags', stripe: '#c8b070' }),
];
export const OPS_BY_ID = Object.fromEntries(OPERATORS.map((o) => [o.id, o]));
export const attackers = OPERATORS.filter((o) => o.side === 'atk');
export const defenders = OPERATORS.filter((o) => o.side === 'def');
// health from speed rating
export const hpFor = (o) => ({ 1: 125, 2: 110, 3: 100 }[o.speed]);
// movement speed multiplier from the speed rating
export const speedFor = (o) => ({ 1: 0.9, 2: 1.0, 3: 1.1 }[o.speed]);
// default first four unlocked operators per side (the rest are bought with renown)
export const STARTER = ['hammer', 'burner', 'scanner', 'cinder', 'anvil', 'warden', 'snare', 'jammer'];
export const PRICE = (o) => 500 + o.diff * 500 + (o.role.includes('breacher') ? 500 : 0);
