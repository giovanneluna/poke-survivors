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

export const CURRENT_VERSION = '0.60';

export const CHANGELOG: readonly VersionLog[] = [
  {
    version: '0.60',
    date: '2026-02-13',
    entries: [
      // ── Stage 2: Kanto Coast ──────────────────────────────────────
      { tag: 'NEW', text: 'Nova Stage: Kanto Coast (Phase 2) com 52 minutos de gameplay' },
      { tag: 'NEW', text: '22 Pokémon comuns: Pikachu, Sandshrew, Vulpix, Diglett, Meowth, Psyduck, Growlithe e mais' },
      { tag: 'NEW', text: '11 Bosses: Arcanine, Ninetales, Victreebel, Golduck, Cloyster, Muk, Rapidash, Starmie, Slowbro, Poliwrath, Lapras' },
      { tag: 'NEW', text: 'Árvores-obstáculo com colisão no mapa da Phase 2' },
      // ── Progressão ────────────────────────────────────────────────
      { tag: 'NEW', text: 'Complete a Phase 1 para desbloquear Squirtle + Phase 2' },
      { tag: 'NEW', text: 'Seletor de Stage na tela de seleção (Phase 1 / Phase 2)' },
      // ── Eventos Phase 2 ───────────────────────────────────────────
      { tag: 'NEW', text: 'SafariZone — 3x XP por tempo limitado' },
      { tag: 'NEW', text: 'Tempestade — lightning + chuva com overlay visual' },
      { tag: 'NEW', text: 'Team Rocket — Meowth elite que dropa moedas extras' },
      { tag: 'NEW', text: 'Day Care — heal + buff de companion' },
      { tag: 'NEW', text: 'Maré Alta — chuva + tint azul no mapa' },
      { tag: 'NEW', text: 'Berry Garden — 8 arbustos de berry pelo mapa' },
      // ── Auto-Aim ──────────────────────────────────────────────────
      { tag: 'NEW', text: 'Auto-aim inteligente: ataques miram no inimigo mais próximo automaticamente' },
      // ── Visual & Áudio ────────────────────────────────────────────
      { tag: 'NEW', text: '31 walk sprites novos para todos os Pokémon da Kanto Coast' },
      { tag: 'NEW', text: '38 novas animações de ataque (fairy, electric, ice, steel, fighting, sound...)' },
      { tag: 'NEW', text: '7 overlays de status animados: burn, poison, paralysis, confusion, freeze, sleep, protect' },
      { tag: 'NEW', text: 'WeatherOverlay: chuva, neblina e areia como efeito visual' },
      { tag: 'NEW', text: '4 temas de mapa extras: Crystal Cave, Magma Cavern, Sky Tower, Dark Crater' },
      { tag: 'NEW', text: '7 sons reais (.ogg): click, hover, start, evolução, vitória, game over' },
    ],
  },
  {
    version: '0.51',
    date: '2026-02-12',
    entries: [
      // ── Manual Aim ──────────────────────────────────────────────────
      { tag: 'NEW', text: 'Manual Aim — pressione Shift para alternar entre mira automática e manual' },
      { tag: 'NEW', text: 'No modo manual, todos os ataques seguem a direção do cursor do mouse' },
      { tag: 'NEW', text: 'Crosshair visual (seta verde) indica a direção de mira no mundo' },
      { tag: 'NEW', text: 'Indicador → ao lado de cada ataque na HUD quando manual aim está ativo' },
      { tag: 'NEW', text: 'Projéteis com spread angular automático para multi-projétil no modo manual' },
      // ── Nerf Squirtle ─────────────────────────────────────────────
      { tag: 'BALANCE', text: 'Nerf Squirtle: ricochete agora causa 50% de dano (era 100%)' },
      { tag: 'BALANCE', text: 'Nerf Squirtle: ricochete 60% mais lento e projétil encolhe visualmente' },
    ],
  },
  {
    version: '0.50',
    date: '2026-02-11',
    entries: [
      // ── Animações de Ataque ────────────────────────────────────────
      { tag: 'NEW', text: 'Animações de ataque para todos os 56 Pokémon inimigos e bosses' },
      { tag: 'NEW', text: 'Sprites do PMDCollab: Attack, Shoot e Charge por contexto' },
      { tag: 'NEW', text: 'Ranged (Gastly, Haunter, Drowzee, Hypno) usam Shoot-Anim ao disparar' },
      { tag: 'NEW', text: 'Chargers (Geodude, Crobat, Rhyhorn, Rhydon, Hitmonlee) usam Charge-Anim ao investir' },
      { tag: 'NEW', text: 'Bosses e melee usam Attack-Anim ao atacar o jogador' },
      // ── Temas Visuais ──────────────────────────────────────────────
      { tag: 'NEW', text: '3 temas visuais para o mapa: Emerald, FireRed e Mystery Dungeon' },
      { tag: 'NEW', text: 'Seletor de tema na tela de seleção com preview visual' },
      { tag: 'NEW', text: 'Tiles 16px do GBA escalados para manter grid de 24px' },
      // ── Idioma ────────────────────────────────────────────────────────
      { tag: 'NEW', text: 'Suporte a Português e Inglês com seletor na tela inicial' },
      { tag: 'NEW', text: 'Idioma salvo automaticamente (localStorage)' },
      // ── Comunidade ────────────────────────────────────────────────────
      { tag: 'NEW', text: 'Seção "Quero Contribuir" com link para o Discord' },
    ],
  },
  {
    version: '0.47',
    date: '2026-02-11',
    entries: [
      // ── Novos inimigos ──────────────────────────────────────────────
      { tag: 'NEW', text: '12 novos Pokémon inimigos nas Fases 3 e 4' },
      { tag: 'NEW', text: 'Fase 3: Koffing (nuvem tóxica), Magnemite (puxa jogador), Tentacool (armadilha), Rhyhorn (investida)' },
      { tag: 'NEW', text: 'Fase 4: Weezing, Magneton, Tentacruel, Rhydon, Scyther, Mr. Mime (escudo), Hitmonlee, Electabuzz' },
      { tag: 'NEW', text: 'Death Cloud — nuvem de veneno persiste após morte de Koffing/Weezing' },
      { tag: 'NEW', text: 'Shield — Mr. Mime bloqueia dano temporariamente' },
      // ── Novos starters (bloqueados) ─────────────────────────────────
      { tag: 'NEW', text: '3 novos starters (bloqueados): Jigglypuff, Gastly, Abra' },
      // ── Visual ──────────────────────────────────────────────────────
      { tag: 'NEW', text: 'Sprites autênticos GBA para destrutíveis (grama, pedra, baú, berry bush)' },
      { tag: 'NEW', text: 'Tela de seleção agora usa grid 3 colunas (suporta 6+ starters)' },
      // ── Balance ─────────────────────────────────────────────────────
      { tag: 'BALANCE', text: 'Fase 4 redesenhada: poucos inimigos elite, cada um perigoso individualmente' },
      { tag: 'BALANCE', text: 'Berry drops reduzidos ~50% em todos os destrutíveis' },
      { tag: 'BALANCE', text: 'Magnet rework: +5 por pick (era +12), cap 100 (era 90)' },
      // ── Fixes ───────────────────────────────────────────────────────
      { tag: 'FIX', text: 'Magnet não aparece mais no level-up quando já está no máximo' },
      { tag: 'FIX', text: 'Magnet não reduz mais o range com meta-progression alta' },
    ],
  },
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
