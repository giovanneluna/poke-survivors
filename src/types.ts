import type Phaser from 'phaser';

// ── Tipos de Ataque e Inimigo ──────────────────────────────────────
export type AttackType = 'ember' | 'fireSpin' | 'flamethrower' | 'inferno' | 'fireBlast' | 'blastBurn';
export type EnemyType = 'rattata' | 'pidgey' | 'zubat' | 'geodude' | 'gastly';
export type Direction = 'down' | 'downRight' | 'right' | 'upRight' | 'up' | 'upLeft' | 'left' | 'downLeft';
export type HeldItemType = 'charcoal' | 'wideLens' | 'choiceSpecs';
export type PickupType = 'oranBerry' | 'magnetBurst' | 'rareCandy' | 'pokeballBomb';
export type DestructibleType = 'tallGrass' | 'berryBush' | 'rockSmash' | 'treasureChest';

// ── Sprite sheet config (PMDCollab format) ─────────────────────────
export interface SpriteConfig {
  readonly key: string;
  readonly path: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameCount: number;
  readonly directions: 8;
}

// ── Configurações imutáveis ────────────────────────────────────────
export interface EnemyConfig {
  readonly key: EnemyType;
  readonly name: string;
  readonly sprite: SpriteConfig;
  readonly hp: number;
  readonly speed: number;
  readonly damage: number;
  readonly xpValue: number;
  readonly scale: number;
  readonly rangedAttack?: EnemyRangedConfig;
}

export interface EnemyRangedConfig {
  readonly projectileKey: string;
  readonly damage: number;
  readonly speed: number;
  readonly cooldownMs: number;
  readonly range: number;
  readonly homing: boolean;
  readonly effect?: 'slow';
  readonly effectDurationMs?: number;
}

export interface AttackConfig {
  readonly key: AttackType;
  readonly name: string;
  readonly description: string;
  readonly baseDamage: number;
  readonly baseCooldown: number;
}

// ── Held Items (Passivos) ──────────────────────────────────────────
export interface HeldItemConfig {
  readonly key: HeldItemType;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: number;
  readonly effect: string;
}

// ── Evolução de Ataques ────────────────────────────────────────────
export interface EvolutionConfig {
  readonly baseAttack: AttackType;
  readonly requiredLevel: number;
  readonly requiredItem: HeldItemType;
  readonly evolvedAttack: AttackType;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: number;
}

// ── Objetos Destrutíveis ───────────────────────────────────────────
export interface DestructibleConfig {
  readonly key: DestructibleType;
  readonly name: string;
  readonly hp: number;
  readonly textureKey: string;
  readonly scale: number;
  readonly drops: ReadonlyArray<{ type: PickupType | 'xpGem'; chance: number; count?: number }>;
}

// ── Pickups ────────────────────────────────────────────────────────
export interface PickupConfig {
  readonly key: PickupType;
  readonly name: string;
  readonly textureKey: string;
  readonly description: string;
}

// ── Estado do jogador ──────────────────────────────────────────────
export interface PlayerState {
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  magnetRange: number;
  xp: number;
  xpToNext: number;
  level: number;
  kills: number;
}

// ── Interface base dos ataques ─────────────────────────────────────
export interface Attack {
  readonly type: AttackType;
  level: number;
  update(time: number, delta: number): void;
  upgrade(): void;
  destroy(): void;
}

// ── Upgrade no level up ────────────────────────────────────────────
export interface UpgradeOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: number;
}

// ── Wave de inimigos ───────────────────────────────────────────────
export interface WaveConfig {
  readonly enemies: ReadonlyArray<{ type: EnemyType; weight: number }>;
  readonly spawnRate: number;
  readonly maxEnemies: number;
}

// ── Referência tipada ──────────────────────────────────────────────
export type ArcadeSprite = Phaser.Physics.Arcade.Sprite;
export type ArcadeGroup = Phaser.Physics.Arcade.Group;

// ── Mapa de direção PMD (8 direções, rows do spritesheet) ──────────
export const DIRECTION_ROW: Readonly<Record<Direction, number>> = {
  down: 0,
  downRight: 1,
  right: 2,
  upRight: 3,
  up: 4,
  upLeft: 5,
  left: 6,
  downLeft: 7,
} as const;
