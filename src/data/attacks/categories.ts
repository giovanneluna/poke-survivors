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
  // Prime
  heatWave: 'area',
  dracoMeteor: 'area',
} as const;
