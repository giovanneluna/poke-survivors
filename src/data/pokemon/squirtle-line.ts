import type { PokemonFormConfig, TorrentConfig } from '../../types';
import { SPRITES } from '../sprites';

export const SQUIRTLE_FORMS: readonly PokemonFormConfig[] = [
  { form: 'base',   name: 'Squirtle',  sprite: SPRITES.squirtle,  level: 1,  maxAttackSlots: 4, maxPassiveSlots: 4, passiveTier: 1 },
  { form: 'stage1', name: 'Wartortle', sprite: SPRITES.wartortle, level: 16, maxAttackSlots: 5, maxPassiveSlots: 5, passiveTier: 2 },
  { form: 'stage2', name: 'Blastoise', sprite: SPRITES.blastoise, level: 36, maxAttackSlots: 6, maxPassiveSlots: 6, passiveTier: 3 },
] as const;

export const TORRENT_TIERS: Readonly<Record<1 | 2 | 3, TorrentConfig>> = {
  1: { wetChance: 0.05, slowMultiplier: 0.20, wetDuration: 3000, bonusDmgOnWet: 0,    splashOnKill: false },
  2: { wetChance: 0.10, slowMultiplier: 0.30, wetDuration: 3000, bonusDmgOnWet: 0.15, splashOnKill: false },
  3: { wetChance: 0.15, slowMultiplier: 0.40, wetDuration: 4000, bonusDmgOnWet: 0.25, splashOnKill: true },
} as const;
