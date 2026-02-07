import type Phaser from 'phaser';

// ── Formas do Pokemon ─────────────────────────────────────────────
export type PokemonForm = 'base' | 'stage1' | 'stage2';

export interface PokemonFormConfig {
  readonly form: PokemonForm;
  readonly name: string;
  readonly sprite: SpriteConfig;
  readonly level: number;
  readonly maxAttackSlots: number;
  readonly maxPassiveSlots: number;
  readonly blazeTier: 1 | 2 | 3;
}

// ── Tipos de Ataque (todos, incluindo evoluções) ─────────────────
export type AttackType =
  // Charmander base
  | 'ember' | 'scratch' | 'fireSpin' | 'smokescreen' | 'dragonBreath' | 'fireFang' | 'flameCharge'
  // Charmeleon
  | 'slash' | 'flamethrower' | 'dragonClaw'
  // Charizard
  | 'airSlash' | 'flareBlitz' | 'hurricane' | 'outrage'
  // Evoluções de arma
  | 'inferno' | 'fireBlast' | 'blastBurn' | 'furySwipes' | 'blazeKick'
  | 'dragonPulse' | 'nightSlash' | 'aerialAce' | 'flareRush' | 'dragonRush'
  // Prime
  | 'heatWave' | 'dracoMeteor';

// ── Tipos de Elemento ─────────────────────────────────────────────
export type ElementType = 'fire' | 'normal' | 'dragon' | 'flying';

// ── Categorias de Ataque ─────────────────────────────────────────
export type AttackCategory =
  | 'projectile'   // Ember, Inferno, DragonPulse, AirSlash, AerialAce
  | 'orbital'      // FireSpin, FireBlast
  | 'cone'         // Scratch, Slash, FurySwipes, NightSlash, Flamethrower, BlastBurn, DragonBreath, DragonClaw, FireFang, BlazeKick
  | 'dash'         // FlameCharge, FlareRush, FlareBlitz, DragonRush
  | 'area'         // Hurricane, Outrage, HeatWave, DracoMeteor
  | 'aura';        // Smokescreen

// ── Tipos de Inimigo e Direção ────────────────────────────────────
export type EnemyType = 'rattata' | 'pidgey' | 'zubat' | 'geodude' | 'gastly' | 'caterpie' | 'weedle';
export type Direction = 'down' | 'downRight' | 'right' | 'upRight' | 'up' | 'upLeft' | 'left' | 'downLeft';

// ── Held Items (expandido) ────────────────────────────────────────
export type HeldItemType =
  | 'charcoal' | 'wideLens' | 'choiceSpecs' | 'quickClaw' | 'leftovers'
  | 'dragonFang' | 'sharpBeak' | 'silkScarf' | 'shellBell'
  | 'scopeLens' | 'razorClaw' | 'focusBand' | 'metronome' | 'magnet';

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

// ── Configuração de Ataque ────────────────────────────────────────
export interface AttackConfig {
  readonly key: AttackType;
  readonly name: string;
  readonly description: string;
  readonly baseDamage: number;
  readonly baseCooldown: number;
  readonly element: ElementType;
  readonly maxLevel: number;
  readonly minForm: PokemonForm;
}

// ── Pool de ataques por forma ─────────────────────────────────────
export interface AttackPoolEntry {
  readonly attack: AttackType;
  readonly minForm: PokemonForm;
}

// ── Configurações de Inimigos ─────────────────────────────────────
export interface EnemyContactEffect {
  readonly type: 'slow';
  readonly durationMs: number;
  readonly multiplier: number;
}

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
  readonly contactEffect?: EnemyContactEffect;
}

export interface EnemyRangedConfig {
  readonly projectileKey: string;
  readonly damage: number;
  readonly speed: number;
  readonly cooldownMs: number;
  readonly range: number;
  readonly homing: boolean;
  readonly projectileScale?: number;
  readonly effect?: 'slow';
  readonly effectDurationMs?: number;
}

// ── Held Items (Passivos) ──────────────────────────────────────────
export interface HeldItemConfig {
  readonly key: HeldItemType;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: number;
  readonly effect: string;
  readonly maxLevel: number;
}

// ── Evolução de Ataques ────────────────────────────────────────────
export interface EvolutionConfig {
  readonly baseAttack: AttackType;
  readonly requiredLevel: number;
  readonly requiredItem: HeldItemType;
  readonly requiredForm: PokemonForm;
  readonly evolvedAttack: AttackType;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: number;
}

// ── Passiva Innata (Blaze, Torrent, Overgrow) ──────────────────────
export interface BlazeConfig {
  readonly burnChance: number;
  readonly burnDps: number;
  readonly burnDuration: number;
  readonly bonusDmgOnBurned: number;
  readonly explodeOnKill: boolean;
}

// ── Status Effects ─────────────────────────────────────────────────
export type StatusEffectType = 'burn' | 'stun' | 'slow' | 'confusion';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  remaining: number;
  value: number;
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
  form: PokemonForm;
  attackSlots: number;
  passiveSlots: number;
  rerolls: number;
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

// ── Helpers ────────────────────────────────────────────────────────
export const FORM_ORDER: readonly PokemonForm[] = ['base', 'stage1', 'stage2'] as const;

export function formIndex(form: PokemonForm): number {
  return FORM_ORDER.indexOf(form);
}

export function isFormUnlocked(current: PokemonForm, required: PokemonForm): boolean {
  return formIndex(current) >= formIndex(required);
}
