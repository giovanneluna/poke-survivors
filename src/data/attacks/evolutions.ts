import type { EvolutionConfig } from '../../types';

export const EVOLUTIONS: readonly EvolutionConfig[] = [
  // Charmeleon tier
  { baseAttack: 'ember',       requiredLevel: 8, requiredItem: 'charcoal',    requiredForm: 'stage1', evolvedAttack: 'inferno',    name: 'Inferno',     description: 'Ember evolui! Bolas explosivas!',     icon: 'item-fire-stone', color: 0xff4400 },
  { baseAttack: 'fireSpin',    requiredLevel: 8, requiredItem: 'wideLens',    requiredForm: 'stage1', evolvedAttack: 'fireBlast',  name: 'Fire Blast',  description: 'Fire Spin evolui! Estrela pulsante!', icon: 'item-fire-stone', color: 0xff8800 },
  { baseAttack: 'scratch',     requiredLevel: 8, requiredItem: 'razorClaw',   requiredForm: 'stage1', evolvedAttack: 'furySwipes', name: 'Fury Swipes', description: 'Scratch evolui! Multi-slash 360°!',   icon: 'item-fire-stone', color: 0xcccccc },
  { baseAttack: 'fireFang',    requiredLevel: 8, requiredItem: 'charcoal',    requiredForm: 'stage1', evolvedAttack: 'blazeKick',  name: 'Blaze Kick',  description: 'Fire Fang evolui! Chute flamejante!', icon: 'item-fire-stone', color: 0xff6600 },
  { baseAttack: 'flameCharge', requiredLevel: 8, requiredItem: 'quickClaw',   requiredForm: 'stage1', evolvedAttack: 'flareRush',  name: 'Flare Rush',  description: 'Flame Charge evolui! Dash de fogo!',  icon: 'item-fire-stone', color: 0xff4400 },
  // Charizard tier
  { baseAttack: 'flamethrower', requiredLevel: 8, requiredItem: 'choiceSpecs', requiredForm: 'stage2', evolvedAttack: 'blastBurn',   name: 'Blast Burn',   description: 'Flamethrower evolui! Nuclear!',     icon: 'item-fire-stone', color: 0xff0000 },
  { baseAttack: 'dragonBreath', requiredLevel: 8, requiredItem: 'dragonFang',  requiredForm: 'stage2', evolvedAttack: 'dragonPulse', name: 'Dragon Pulse', description: 'Dragon Breath evolui! Beam total!', icon: 'item-fire-stone', color: 0x7744ff },
  { baseAttack: 'slash',        requiredLevel: 8, requiredItem: 'scopeLens',   requiredForm: 'stage2', evolvedAttack: 'nightSlash',  name: 'Night Slash',  description: 'Slash evolui! 50% crítico!',        icon: 'item-fire-stone', color: 0x444466 },
  { baseAttack: 'dragonClaw',   requiredLevel: 8, requiredItem: 'dragonFang',  requiredForm: 'stage2', evolvedAttack: 'dragonRush',  name: 'Dragon Rush',  description: 'Dragon Claw evolui! Carga stun!',   icon: 'item-fire-stone', color: 0x7744ff },
  { baseAttack: 'airSlash',     requiredLevel: 8, requiredItem: 'sharpBeak',   requiredForm: 'stage2', evolvedAttack: 'aerialAce',   name: 'Aerial Ace',   description: 'Air Slash evolui! Homing total!',   icon: 'item-fire-stone', color: 0x88ccff },
  // ── Squirtle — Wartortle tier ───────────────────────────────────────
  { baseAttack: 'waterGun',    requiredLevel: 8, requiredItem: 'mysticWater', requiredForm: 'stage1', evolvedAttack: 'scald',      name: 'Scald',       description: 'Water Gun evolui! Vapor explosivo!',    icon: 'item-water-stone', color: 0x3388ff },
  { baseAttack: 'bubble',      requiredLevel: 8, requiredItem: 'wideLens',    requiredForm: 'stage1', evolvedAttack: 'bubbleBeam', name: 'Bubble Beam', description: 'Bubble evolui! Rajada com slow!',       icon: 'item-water-stone', color: 0x44aaff },
  { baseAttack: 'tackle',      requiredLevel: 8, requiredItem: 'razorClaw',   requiredForm: 'stage1', evolvedAttack: 'bodySlam',   name: 'Body Slam',   description: 'Tackle evolui! Multi-slam 360°!',      icon: 'item-water-stone', color: 0xcccccc },
  { baseAttack: 'rapidSpin',   requiredLevel: 8, requiredItem: 'focusBand',   requiredForm: 'stage1', evolvedAttack: 'gyroBall',   name: 'Gyro Ball',   description: 'Rapid Spin evolui! Orbes metálicas!',  icon: 'item-water-stone', color: 0x888888 },
  { baseAttack: 'aquaJet',     requiredLevel: 8, requiredItem: 'quickClaw',   requiredForm: 'stage1', evolvedAttack: 'waterfall',  name: 'Waterfall',   description: 'Aqua Jet evolui! Cascata devastadora!', icon: 'item-water-stone', color: 0x3388ff },
  // ── Squirtle — Blastoise tier ───────────────────────────────────────
  { baseAttack: 'hydroPump',   requiredLevel: 8, requiredItem: 'choiceSpecs', requiredForm: 'stage2', evolvedAttack: 'originPulse', name: 'Origin Pulse', description: 'Hydro Pump evolui! Beam nuclear!',   icon: 'item-water-stone', color: 0x0044ff },
  { baseAttack: 'waterPulse',  requiredLevel: 8, requiredItem: 'scopeLens',   requiredForm: 'stage2', evolvedAttack: 'muddyWater', name: 'Muddy Water',  description: 'Water Pulse evolui! Projéteis pesados!', icon: 'item-water-stone', color: 0x664400 },
  { baseAttack: 'aquaTail',    requiredLevel: 8, requiredItem: 'mysticWater', requiredForm: 'stage2', evolvedAttack: 'crabhammer',  name: 'Crabhammer',   description: 'Aqua Tail evolui! Garras com crit!', icon: 'item-water-stone', color: 0xff4400 },
  { baseAttack: 'whirlpool',   requiredLevel: 8, requiredItem: 'shellBell',   requiredForm: 'stage2', evolvedAttack: 'waterSpout',  name: 'Water Spout',  description: 'Whirlpool evolui! Jatos de canhão!', icon: 'item-water-stone', color: 0x3388ff },
  { baseAttack: 'iceBeam',     requiredLevel: 8, requiredItem: 'neverMeltIce', requiredForm: 'stage2', evolvedAttack: 'blizzard',   name: 'Blizzard',     description: 'Ice Beam evolui! Tempestade de gelo!', icon: 'item-water-stone', color: 0x88ddff },
] as const;
