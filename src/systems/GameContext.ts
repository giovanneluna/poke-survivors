import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { StarterConfig } from '../config';
import type { DevConfig, Difficulty } from '../types';

export interface GameContext {
  readonly scene: Phaser.Scene;
  readonly player: Player;
  readonly enemyGroup: Phaser.Physics.Arcade.Group;
  readonly xpGems: Phaser.Physics.Arcade.Group;
  readonly destructibles: Phaser.Physics.Arcade.StaticGroup;
  readonly pickups: Phaser.Physics.Arcade.Group;
  readonly enemyProjectiles: Phaser.Physics.Arcade.Group;
  readonly starterConfig: StarterConfig;
  readonly debugMode: boolean;
  readonly devConfig?: DevConfig;
  readonly difficulty: Difficulty;
}
