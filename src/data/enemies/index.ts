import type { EnemyConfig, BossConfig, WaveConfig, BossSpawnConfig } from '../../types';

// ── Existentes ──────────────────────────────────────────────────────
import { RATTATA } from './rattata';
import { PIDGEY } from './pidgey';
import { ZUBAT } from './zubat';
import { GEODUDE } from './geodude';
import { GASTLY } from './gastly';
import { CATERPIE } from './caterpie';
import { WEEDLE } from './weedle';

// ── Novos comuns (Phase 1) ──────────────────────────────────────────
import { SPEAROW } from './spearow';
import { EKANS } from './ekans';
import { ODDISH } from './oddish';
import { MANKEY } from './mankey';

// ── Novos elite (Phase 1) ───────────────────────────────────────────
import { HAUNTER } from './haunter';
import { MACHOP } from './machop';
import { GOLBAT } from './golbat';

// ── Bosses (Phase 1) ───────────────────────────────────────────────
import { RATICATE } from './raticate';
import { ARBOK } from './arbok';
import { NIDOKING } from './nidoking';
import { SNORLAX } from './snorlax';

// ── Phase ───────────────────────────────────────────────────────────
import { PHASE1 } from './phases/phase1';

export const ENEMIES: Readonly<Record<string, EnemyConfig | BossConfig>> = {
  rattata: RATTATA,
  pidgey: PIDGEY,
  zubat: ZUBAT,
  geodude: GEODUDE,
  gastly: GASTLY,
  caterpie: CATERPIE,
  weedle: WEEDLE,
  spearow: SPEAROW,
  ekans: EKANS,
  oddish: ODDISH,
  mankey: MANKEY,
  haunter: HAUNTER,
  machop: MACHOP,
  golbat: GOLBAT,
  raticate: RATICATE,
  arbok: ARBOK,
  nidoking: NIDOKING,
  snorlax: SNORLAX,
} as const;

export const ACTIVE_PHASE = PHASE1;
export const WAVES: readonly WaveConfig[] = ACTIVE_PHASE.waves;
export const BOSS_SCHEDULE: readonly BossSpawnConfig[] = ACTIVE_PHASE.bosses;
