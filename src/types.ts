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
  readonly passiveTier: 1 | 2 | 3;
  readonly types?: readonly string[];
}

// ── Tipos de Ataque (todos, incluindo evoluções) ─────────────────
export type AttackType =
  // Charmander base
  | 'ember' | 'scratch' | 'fireSpin' | 'smokescreen' | 'dragonBreath' | 'fireFang' | 'flameCharge'
  // Charmeleon
  | 'slash' | 'flamethrower' | 'dragonClaw'
  // Charizard
  | 'airSlash' | 'flareBlitz' | 'hurricane' | 'outrage'
  // Charmander evoluções
  | 'inferno' | 'fireBlast' | 'blastBurn' | 'furySwipes' | 'blazeKick'
  | 'dragonPulse' | 'nightSlash' | 'aerialAce' | 'flareRush' | 'dragonRush'
  // Charmander prime
  | 'heatWave' | 'dracoMeteor'
  // Squirtle base
  | 'waterGun' | 'bubble' | 'tackle' | 'rapidSpin' | 'withdraw' | 'aquaJet'
  // Wartortle
  | 'waterPulse' | 'hydroPump' | 'aquaTail' | 'whirlpool'
  // Blastoise
  | 'iceBeam' | 'flashCannon' | 'surf' | 'liquidation'
  // Squirtle evoluções
  | 'scald' | 'bubbleBeam' | 'bodySlam' | 'gyroBall' | 'waterfall'
  | 'originPulse' | 'muddyWater' | 'crabhammer' | 'waterSpout' | 'blizzard'
  // Squirtle prime
  | 'rainDance' | 'hydroCannon'
  // Bulbasaur base (tackle already in Squirtle)
  | 'vineWhip' | 'razorLeaf' | 'leechSeed' | 'growl' | 'poisonPowder2'
  // Ivysaur
  | 'sleepPowder' | 'stunSpore' | 'leafBlade' | 'sludgeBomb'
  // Venusaur
  | 'solarBeam' | 'petalDance' | 'gigaDrain' | 'energyBall' | 'frenzyPlant' | 'petalBlizzard'
  // Bulbasaur evoluções
  | 'powerWhip' | 'leafStorm' | 'seedBomb' | 'bodySlam2' | 'toxic'
  | 'spore' | 'solarBlade' | 'sludgeWave2' | 'hyperBeam2' | 'floraBurst';

// ── Dificuldade ─────────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  readonly label: string;
  readonly description: string;
  readonly color: number;
  readonly spawnRateMultiplier: number;
  readonly maxEnemiesMultiplier: number;
  readonly xpMultiplier: number;
  readonly coinMultiplier: number;
}

// ── Tipos de Elemento ─────────────────────────────────────────────
export type ElementType = 'fire' | 'water' | 'ice' | 'normal' | 'dragon' | 'flying' | 'grass' | 'poison' | 'rock' | 'ground' | 'ghost' | 'psychic' | 'fighting' | 'bug' | 'dark';

// ── Categorias de Ataque ─────────────────────────────────────────
export type AttackCategory =
  | 'projectile'   // Ember, Inferno, DragonPulse, AirSlash, AerialAce
  | 'orbital'      // FireSpin, FireBlast
  | 'cone'         // Scratch, Slash, FurySwipes, NightSlash, Flamethrower, BlastBurn, DragonBreath, DragonClaw, FireFang, BlazeKick
  | 'dash'         // FlameCharge, FlareRush, FlareBlitz, DragonRush
  | 'area'         // Hurricane, Outrage, HeatWave, DracoMeteor
  | 'aura';        // Smokescreen

// ── Tipos de Inimigo e Direção ────────────────────────────────────
export type EnemyType =
  // Phase 1 — Existentes
  | 'rattata' | 'pidgey' | 'zubat' | 'geodude' | 'gastly' | 'caterpie' | 'weedle'
  | 'spearow' | 'ekans' | 'oddish' | 'mankey'
  | 'haunter' | 'machop' | 'golbat'
  | 'raticate' | 'arbok' | 'nidoking' | 'snorlax'
  // Phase 2 — Comuns + elite
  | 'metapod' | 'kakuna' | 'gloom' | 'paras' | 'venonat' | 'drowzee' | 'cubone'
  | 'pidgeotto'
  // Phase 3 — Elites + evoluções
  | 'butterfree' | 'parasect' | 'venomoth' | 'hypno' | 'marowak'
  | 'graveler' | 'machoke'
  // Phase 4 — Elites avançados
  | 'alakazam' | 'alakazam-boss' | 'electrode' | 'crobat'
  // Bosses
  | 'beedrill' | 'vileplume' | 'primeape' | 'gengar'
  | 'fearow' | 'pidgeot' | 'machamp' | 'golem';
export type Direction = 'down' | 'downRight' | 'right' | 'upRight' | 'up' | 'upLeft' | 'left' | 'downLeft';

// ── Comportamentos de Inimigos ──────────────────────────────────
export type EnemyBehavior =
  | 'charger' | 'swooper' | 'circler' | 'berserker'
  | 'dasher' | 'tank' | 'sporeWalker' | 'confuser' | 'healer' | 'teleporter';

// ── Held Items (expandido) ────────────────────────────────────────
export type HeldItemType =
  | 'charcoal' | 'wideLens' | 'choiceSpecs' | 'quickClaw' | 'leftovers'
  | 'dragonFang' | 'sharpBeak' | 'silkScarf' | 'shellBell'
  | 'scopeLens' | 'razorClaw' | 'focusBand' | 'metronome' | 'magnet'
  | 'mysticWater' | 'neverMeltIce'
  | 'miracleSeed' | 'bigRoot' | 'blackSludge' | 'leafStone'
  | 'revive'
  | 'quickPowder';

export type PickupType = 'oranBerry' | 'sitrusBerry' | 'liechiBerry' | 'salacBerry' | 'magnetBurst' | 'rareCandy' | 'pokeballBomb' | 'gachaBox' | 'xpShare' | 'duplicator' | 'friendBall' | 'coinSmall' | 'coinMedium' | 'coinLarge';
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
  readonly type: 'slow' | 'poison' | 'knockback' | 'drain' | 'stun' | 'confusion';
  readonly durationMs: number;
  readonly multiplier?: number; // para slow
  readonly dps?: number;        // para poison (damage per second)
  readonly force?: number;      // para knockback (pixels)
  readonly amount?: number;     // para drain (HP)
}

/** Config de cura para inimigos healers (Gloom) */
export interface EnemyHealAuraConfig {
  readonly hpPerSecond: number;
  readonly radius: number;
}

/** Config de explosão na morte (Electrode) */
export interface EnemyDeathExplosionConfig {
  readonly damage: number;
  readonly radius: number;
}

/** Config de teleporte (Alakazam) */
export interface EnemyTeleportConfig {
  readonly cooldownMs: number;
  readonly range: number;
}

/** Config de boomerang (Cubone/Marowak) */
export interface EnemyBoomerangConfig {
  readonly projectileKey: string;
  readonly damage: number;
  readonly speed: number;
  readonly cooldownMs: number;
  readonly range: number;
  readonly projectileScale?: number;
}

/** Config de slow aura (Parasect) */
export interface EnemySlowAuraConfig {
  readonly radius: number;
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
  readonly healAura?: EnemyHealAuraConfig;
  readonly deathExplosion?: EnemyDeathExplosionConfig;
  readonly teleport?: EnemyTeleportConfig;
  readonly boomerang?: EnemyBoomerangConfig;
  readonly slowAura?: EnemySlowAuraConfig;
  readonly behavior?: EnemyBehavior;
}

export interface EnemyRangedConfig {
  readonly projectileKey: string;
  readonly damage: number;
  readonly speed: number;
  readonly cooldownMs: number;
  readonly range: number;
  readonly homing: boolean;
  readonly projectileScale?: number;
  readonly effect?: 'slow' | 'confusion' | 'stun';
  readonly effectDurationMs?: number;
  /** Se true, ataque é um beam direcional (não projétil). Dispara na direção do player e fica parado. */
  readonly beam?: boolean;
  /** Comprimento do beam em pixels (default: range) */
  readonly beamLength?: number;
}

// ── Boss Config ─────────────────────────────────────────────────────
export type BossAttackPattern =
  | 'charge' | 'fan' | 'aoe-tremor' | 'aoe-land' | 'teleport-fan'
  | 'directional' | 'beam' | 'buff' | 'zone' | 'traveling';

export interface BossAttackConfig {
  readonly name: string;
  readonly pattern: BossAttackPattern;
  readonly damage: number;
  readonly cooldownMs: number;
  readonly range?: number;
  readonly projectileCount?: number;
  readonly aoeRadius?: number;
  readonly teleportRange?: number;
  /** Sprite key para o ataque visual (default depende do pattern) */
  readonly spriteKey?: string;
  /** Animation key para o ataque (default depende do pattern) */
  readonly animKey?: string;
  /** Scale do sprite de ataque */
  readonly spriteScale?: number;
  /** Tint color do boss durante o ataque */
  readonly tintColor?: number;
  /** Tint color do círculo AoE */
  readonly aoeColor?: number;
  // ── Directional pattern ──
  /** Sprite keys para 4 direções [up, down, left, right] */
  readonly directionalSprites?: readonly [string, string, string, string];
  readonly directionalAnims?: readonly [string, string, string, string];
  // ── Beam pattern ──
  readonly beamDuration?: number;
  readonly beamWidth?: number;
  // ── Buff pattern ──
  readonly buffType?: 'heal' | 'resist' | 'damage' | 'speed';
  readonly buffValue?: number;
  readonly buffDuration?: number;
  // ── Zone pattern ──
  readonly zoneDuration?: number;
  readonly zoneTickRate?: number;
  readonly zoneEffect?: 'damage' | 'slow' | 'pull' | 'poison';
  readonly zoneEffectValue?: number;
  // ── Traveling pattern ──
  readonly projectileSpeed?: number;
  readonly explodeOnEnd?: boolean;
  readonly explodeRadius?: number;
}

export type BossArchetype = 'tank' | 'striker' | 'caster' | 'skirmisher';

export interface BossConfig extends EnemyConfig {
  readonly isBoss: true;
  readonly bossAttacks: readonly BossAttackConfig[];
  readonly resistance: number;
  readonly hpRegenPerSec: number;
  readonly archetype: BossArchetype;
  readonly categoryResistance?: Partial<Record<AttackCategory, number>>;
}

// ── Phase Config ────────────────────────────────────────────────────
export interface BossSpawnConfig {
  readonly type: EnemyType;
  readonly timeSeconds: number;
  readonly count?: number;
  readonly hpMultiplier?: number;
  readonly dmgMultiplier?: number;
}

export interface PhaseConfig {
  readonly waves: readonly WaveConfig[];
  readonly bosses: readonly BossSpawnConfig[];
}

// ── Gacha Rewards ───────────────────────────────────────────────────
export type GachaRewardType = 'skillUpgrade' | 'heldItem' | 'rareCandy' | 'evolutionStone' | 'maxRevive' | 'revive' | 'coinLarge';

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

export interface TorrentConfig {
  readonly wetChance: number;
  readonly slowMultiplier: number;
  readonly wetDuration: number;
  readonly bonusDmgOnWet: number;
  readonly splashOnKill: boolean;
  readonly auraRadius: number;
}

export interface OvergrowConfig {
  readonly poisonChance: number;
  readonly poisonDps: number;
  readonly poisonDuration: number;
  readonly bonusDmgOnPoisoned: number;
  readonly toxicCloudOnKill: boolean;
}

// ── Status Effects ─────────────────────────────────────────────────
export type StatusEffectType = 'burn' | 'stun' | 'slow' | 'confusion' | 'wet' | 'freeze' | 'poison';

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
  hpRegen: number;
  xpMultiplier: number;
  projectileBonus: number;
  attackSpeedBonus: number;
  xp: number;
  xpToNext: number;
  level: number;
  kills: number;
  form: PokemonForm;
  attackSlots: number;
  passiveSlots: number;
  rerolls: number;
  revives: number;
  reviveIsMax: boolean;
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
  readonly requiredType?: string;
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

// ── Dev Mode ──────────────────────────────────────────────────────
export interface DevConfig {
  readonly starterKey: string;
  readonly form: PokemonForm;
  readonly level: number;
  readonly godMode: boolean;
  readonly attacks: readonly AttackType[];
}

// ── Helpers ────────────────────────────────────────────────────────
export const FORM_ORDER: readonly PokemonForm[] = ['base', 'stage1', 'stage2'] as const;

export function formIndex(form: PokemonForm): number {
  return FORM_ORDER.indexOf(form);
}

export function isFormUnlocked(current: PokemonForm, required: PokemonForm): boolean {
  return formIndex(current) >= formIndex(required);
}
