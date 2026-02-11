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

// ── Phase 2 comuns ──────────────────────────────────────────────────
import { METAPOD } from './metapod';
import { KAKUNA } from './kakuna';
import { GLOOM } from './gloom';
import { PARAS } from './paras';
import { VENONAT } from './venonat';
import { DROWZEE } from './drowzee';
import { CUBONE } from './cubone';

// ── Phase 2 elite (evoluções) ────────────────────────────────────────
import { PIDGEOTTO } from './pidgeotto';

// ── Phase 3 elite ───────────────────────────────────────────────────
import { BUTTERFREE } from './butterfree';
import { PARASECT } from './parasect';
import { VENOMOTH } from './venomoth';
import { HYPNO } from './hypno';
import { MAROWAK } from './marowak';

// ── Phase 3 elite (evoluções) ───────────────────────────────────────
import { CROBAT } from './crobat';
import { GRAVELER } from './graveler';
import { MACHOKE } from './machoke';

// ── Phase 3 novos ───────────────────────────────────────────────────
import { KOFFING } from './koffing';
import { MAGNEMITE } from './magnemite';
import { TENTACOOL } from './tentacool';
import { RHYHORN } from './rhyhorn';

// ── Phase 4 elite ───────────────────────────────────────────────────
import { ALAKAZAM } from './alakazam';
import { ELECTRODE } from './electrode';

// ── Phase 4 novos ───────────────────────────────────────────────────
import { WEEZING } from './weezing';
import { MAGNETON } from './magneton';
import { TENTACRUEL } from './tentacruel';
import { RHYDON } from './rhydon';
import { SCYTHER } from './scyther';
import { MR_MIME } from './mr-mime';
import { HITMONLEE } from './hitmonlee';
import { ELECTABUZZ } from './electabuzz';

// ── Boss Final ──────────────────────────────────────────────────────
import { ALAKAZAM_BOSS } from './alakazam-boss';

// ── Bosses (Phase 1) ───────────────────────────────────────────────
import { BEEDRILL } from './beedrill';
import { VILEPLUME } from './vileplume';
import { PRIMEAPE } from './primeape';
import { GENGAR } from './gengar';

// ── Bosses (novos — evoluções finais) ───────────────────────────────
import { FEAROW } from './fearow';
import { PIDGEOT } from './pidgeot';
import { MACHAMP } from './machamp';
import { GOLEM } from './golem';

// ── Phases ──────────────────────────────────────────────────────────
import { PHASE1 } from './phases/phase1';
import { PHASE2 } from './phases/phase2';
import { PHASE3 } from './phases/phase3';
import { PHASE4 } from './phases/phase4';

export const ENEMIES: Readonly<Record<string, EnemyConfig | BossConfig>> = {
  // Phase 1
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
  // Phase 2
  metapod: METAPOD,
  kakuna: KAKUNA,
  gloom: GLOOM,
  paras: PARAS,
  venonat: VENONAT,
  drowzee: DROWZEE,
  cubone: CUBONE,
  pidgeotto: PIDGEOTTO,
  // Phase 3
  butterfree: BUTTERFREE,
  parasect: PARASECT,
  venomoth: VENOMOTH,
  hypno: HYPNO,
  marowak: MAROWAK,
  // Phase 3 elite (evoluções)
  crobat: CROBAT,
  graveler: GRAVELER,
  machoke: MACHOKE,
  // Phase 3 novos
  koffing: KOFFING,
  magnemite: MAGNEMITE,
  tentacool: TENTACOOL,
  rhyhorn: RHYHORN,
  // Phase 4
  alakazam: ALAKAZAM,
  electrode: ELECTRODE,
  // Phase 4 novos
  weezing: WEEZING,
  magneton: MAGNETON,
  tentacruel: TENTACRUEL,
  rhydon: RHYDON,
  scyther: SCYTHER,
  'mr-mime': MR_MIME,
  hitmonlee: HITMONLEE,
  electabuzz: ELECTABUZZ,
  // Bosses
  beedrill: BEEDRILL,
  vileplume: VILEPLUME,
  primeape: PRIMEAPE,
  gengar: GENGAR,
  fearow: FEAROW,
  pidgeot: PIDGEOT,
  machamp: MACHAMP,
  golem: GOLEM,
  'alakazam-boss': ALAKAZAM_BOSS,
} as const;

export const WAVES: readonly WaveConfig[] = [
  ...PHASE1.waves,
  ...PHASE2.waves,
  ...PHASE3.waves,
  ...PHASE4.waves,
];

export const BOSS_SCHEDULE: readonly BossSpawnConfig[] = [
  ...PHASE1.bosses,
  ...PHASE2.bosses,
  ...PHASE3.bosses,
  ...PHASE4.bosses,
];
