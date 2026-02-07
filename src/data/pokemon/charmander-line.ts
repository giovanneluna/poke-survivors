import type { PokemonFormConfig, SpriteConfig } from '../../types';
import { SPRITES } from '../sprites';

export interface StarterConfig {
  readonly key: string;
  readonly name: string;
  readonly sprite: SpriteConfig;
  readonly type: string;
  readonly description: string;
  readonly unlocked: boolean;
  readonly forms: readonly PokemonFormConfig[];
}

export const CHARMANDER_FORMS = [
  { form: 'base' as const,   name: 'Charmander',  sprite: SPRITES.charmander,  level: 1,  maxAttackSlots: 4, maxPassiveSlots: 4, blazeTier: 1 as const },
  { form: 'stage1' as const, name: 'Charmeleon',  sprite: SPRITES.charmeleon,  level: 16, maxAttackSlots: 5, maxPassiveSlots: 5, blazeTier: 2 as const },
  { form: 'stage2' as const, name: 'Charizard',   sprite: SPRITES.charizard,   level: 36, maxAttackSlots: 6, maxPassiveSlots: 6, blazeTier: 3 as const },
] as const;

export const BLAZE_TIERS = {
  1: { burnChance: 0.05, burnDps: 2,  burnDuration: 3000, bonusDmgOnBurned: 0,    explodeOnKill: false },
  2: { burnChance: 0.10, burnDps: 4,  burnDuration: 3000, bonusDmgOnBurned: 0.15, explodeOnKill: false },
  3: { burnChance: 0.15, burnDps: 6,  burnDuration: 4000, bonusDmgOnBurned: 0.25, explodeOnKill: true },
} as const;
