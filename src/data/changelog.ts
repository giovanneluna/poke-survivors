// ── Changelog Data ─────────────────────────────────────────────────────
// Editar manualmente a cada release. Mais recente primeiro.

export type ChangeTag = 'NEW' | 'FIX' | 'BALANCE' | 'REMOVE';

export interface ChangeEntry {
  readonly tag: ChangeTag;
  readonly text: string;
}

export interface VersionLog {
  readonly version: string;
  readonly date: string;
  readonly entries: readonly ChangeEntry[];
}

export const CURRENT_VERSION = '0.40';

export const CHANGELOG: readonly VersionLog[] = [
  {
    version: '0.40',
    date: '2026-02-10',
    entries: [
      { tag: 'NEW', text: 'DataViewer — enciclopédia de dados in-game com 4 tabs' },
      { tag: 'NEW', text: 'Combo Calculator — simulador de DPS para ataques' },
      { tag: 'NEW', text: 'Changelog — visualize novidades na tela inicial' },
      { tag: 'NEW', text: 'Histórico da última partida na tela de seleção' },
      { tag: 'BALANCE', text: 'Cooldowns de todos os ataques aumentados em ~40%' },
      { tag: 'BALANCE', text: 'Quick Powder agora funciona como Attack Speed real' },
      { tag: 'BALANCE', text: 'Coins no modo Fácil: 0.1x → 0.3x' },
      { tag: 'FIX', text: 'Particle emitter leaks corrigidos (34 arquivos)' },
      { tag: 'FIX', text: 'Timer leaks em BodySlam e HealAura' },
      { tag: 'FIX', text: 'Coins e histórico agora salvam corretamente' },
      { tag: 'REMOVE', text: 'Rare Candy removido — substituído por coins' },
    ],
  },
  {
    version: '0.33',
    date: '2026-02-09',
    entries: [
      { tag: 'NEW', text: '10 comportamentos únicos de inimigos (charger, swooper, circler...)' },
      { tag: 'NEW', text: 'Efeitos de contato: slow, poison, knockback, drain, stun, confusion' },
      { tag: 'BALANCE', text: 'Inimigos ranged reduzidos de 37% para ~5%' },
      { tag: 'BALANCE', text: 'Gastly e Haunter mantêm Shadow Ball; Drowzee/Hypno mantêm Psychic' },
      { tag: 'FIX', text: 'Spore pool persiste após morte do inimigo' },
    ],
  },
  {
    version: '0.32',
    date: '2026-02-08',
    entries: [
      { tag: 'NEW', text: 'Sistema de coins: Small ₽5, Medium ₽25, Large ₽100' },
      { tag: 'NEW', text: 'Sprites reais do PokeAPI para todos os itens e pickups' },
      { tag: 'NEW', text: 'HUD coin counter em tempo real' },
      { tag: 'BALANCE', text: 'Boss drop: 3-5 large coins (₽300-500)' },
      { tag: 'REMOVE', text: 'Texturas procedurais held-* e pickup-* removidas' },
    ],
  },
  {
    version: '0.31',
    date: '2026-02-07',
    entries: [
      { tag: 'NEW', text: 'Sistema de Companion Pokémon (max 2)' },
      { tag: 'NEW', text: 'Friend Ball — 20% drop de bosses' },
      { tag: 'NEW', text: 'Companion orbita player e dispara no inimigo mais próximo' },
    ],
  },
  {
    version: '0.30',
    date: '2026-02-06',
    entries: [
      { tag: 'NEW', text: '6 eventos in-game: PokéCenter, Prof. Oak, Swarm, Eclipse, Legendary, Treasure' },
      { tag: 'NEW', text: 'MusicManager com 3 tracks (calm/battle/boss) via Web Audio' },
      { tag: 'NEW', text: 'Squirtle completo — 26 ataques + passiva Torrent' },
    ],
  },
  {
    version: '0.29',
    date: '2026-02-05',
    entries: [
      { tag: 'NEW', text: 'Type Effectiveness: 15 tipos com multiplicadores (1.5x SE, 0.5x NVE)' },
      { tag: 'NEW', text: 'Pokédex: grid de cards com sprites, kill count e silhuetas' },
      { tag: 'NEW', text: 'GraphicsSettings: Quality (normal/low) + VFX slider (0-100%)' },
    ],
  },
  {
    version: '0.28',
    date: '2026-02-04',
    entries: [
      { tag: 'NEW', text: 'Meta-progression: SaveSystem, PowerUps, Death Screen' },
      { tag: 'NEW', text: 'ComboSystem e MiniMap' },
      { tag: 'NEW', text: 'SpatialHashGrid — O(1) queries para 74 ataques' },
    ],
  },
];
