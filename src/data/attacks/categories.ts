import type { AttackType, AttackCategory } from '../../types';

export const ATTACK_CATEGORIES: Readonly<Record<AttackType, AttackCategory>> = {
  // Charmander base
  ember: 'projectile',
  scratch: 'cone',
  fireSpin: 'orbital',
  smokescreen: 'aura',
  fireFang: 'cone',
  flameCharge: 'dash',
  // Charmeleon
  dragonBreath: 'cone',
  slash: 'cone',
  flamethrower: 'cone',
  dragonClaw: 'cone',
  // Charizard
  airSlash: 'projectile',
  flareBlitz: 'dash',
  hurricane: 'area',
  outrage: 'area',
  // Evoluções de arma
  inferno: 'projectile',
  fireBlast: 'orbital',
  blastBurn: 'cone',
  furySwipes: 'cone',
  blazeKick: 'cone',
  dragonPulse: 'projectile',
  nightSlash: 'cone',
  aerialAce: 'projectile',
  flareRush: 'dash',
  dragonRush: 'dash',
  // Charmander prime
  heatWave: 'area',
  dracoMeteor: 'area',
  // ── Squirtle base ───────────────────────────────────────────────────
  waterGun: 'projectile',
  bubble: 'projectile',
  tackle: 'cone',
  rapidSpin: 'orbital',
  withdraw: 'aura',
  aquaJet: 'dash',
  // Wartortle
  waterPulse: 'projectile',
  hydroPump: 'cone',
  aquaTail: 'cone',
  whirlpool: 'area',
  // Blastoise
  iceBeam: 'projectile',
  flashCannon: 'projectile',
  surf: 'area',
  liquidation: 'area',
  // Squirtle evoluções
  scald: 'projectile',
  bubbleBeam: 'projectile',
  bodySlam: 'cone',
  gyroBall: 'orbital',
  waterfall: 'dash',
  originPulse: 'cone',
  muddyWater: 'projectile',
  crabhammer: 'cone',
  waterSpout: 'projectile',
  blizzard: 'projectile',
  // Squirtle prime
  rainDance: 'area',
  hydroCannon: 'area',
} as const;
