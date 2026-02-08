import type { EnemyConfig } from '../../types';
import { SPRITES } from '../sprites';

export const ELECTRODE: EnemyConfig = {
  key: 'electrode',
  name: 'Electrode',
  sprite: SPRITES.electrode,
  hp: 60,
  speed: 100,
  damage: 15,
  xpValue: 20,
  scale: 1.0,
  deathExplosion: {
    damage: 30,
    radius: 120,
  },
};
