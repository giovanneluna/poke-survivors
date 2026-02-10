import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const VENONAT: EnemyConfig = {
  key: 'venonat',
  name: 'Venonat',
  sprite: SPRITES.venonat,
  hp: 40,
  speed: 40,
  damage: 8,
  xpValue: 25,
  scale: 1.0,
  rangedAttack: {
    projectileKey: 'atk-psybeam',
    damage: 8,
    speed: 58,
    cooldownMs: 3700,
    range: 200,
    homing: false,
    projectileScale: 0.5,
    beam: true,
    beamLength: 160,
    effect: 'confusion',
    effectDurationMs: 2000,
  },
};
