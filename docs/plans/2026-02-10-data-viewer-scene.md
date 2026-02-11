# DataViewerScene — Terminal Retro Data Dashboard

## Overview
Nova cena dedicada para visualizar todos os dados do jogo em formato terminal retro.
Acessível via botão `[DATA]` na SelectScene. No futuro, parametrizada por mapa.

## Visual Style
- Fundo `#0a0a0a`, fonte `monospace`
- Cor principal: `#00ff88` (verde terminal)
- Headers: `#ffcc00` (amarelo)
- Valores numéricos: `#ff6644` (laranja)
- Bordas ASCII: `─│┌┐└┘╔╗╚╝╠╣═`
- Scroll com setas ou mouse wheel

## Layout
```
┌──────────────────────────────────────────┐
│  ▸ WAVES   ATAQUES   ITENS   EVENTOS    │  Tab bar
├──────────────────────────────────────────┤
│   Conteúdo da tab ativa (scrollable)     │  Main area
├──────────────────────────────────────────┤
│  [ESC] Voltar    ◀ ▶ Navegar tabs       │  Footer
└──────────────────────────────────────────┘
```

## Tab 1: WAVES
Dois sub-modos toggle com [T]:

### TIMELINE (default)
Lista cronológica vertical unificada. Waves, bosses e eventos intercalados em ordem temporal.
- Waves: `0:00 ┬ WAVE 00 ─ Rattata×3 Caterpie×1 [30 max, 1.2s]`
- Bosses: Box destacado com HP, SPD, DMG, XP, ataques (pattern, damage, cooldown)
- Eventos timed: Aparecem no minuto correto (PokéCenter@3:00, Eclipse@6:00, etc.)
- Eventos wave-triggered: "possível" com chance indicada (Swarm 5%, Treasure 8%)

### TABLE
Tabela compacta só com waves (WAVE | TIME | ENEMIES | RATE | MAX | BOSS).

### Dados
- `PHASE1.waves[]` + `PHASE1.bosses[]` de `src/data/enemies/phases/phase1.ts`
- Boss configs de `src/data/enemies/{boss}.ts`
- Eventos de `EventSystem.registerEvents()` — extrair dados para constantes exportáveis

## Tab 2: ATAQUES & COMBOS
Lista de ataques + calculadora interativa de DPS.

### Lista (topo)
Todos os ataques do starter selecionado (trocar com ◀▶), agrupados por form (base/stage1/stage2).
Colunas: ATAQUE | ELE | DMG | CD | PROJ | FORM | LVL

### Combo Calculator (baixo)
Selecionar ataque com ENTER → mostra breakdown completo:
1. Base damage + upgrades por nível (+5 dmg/lv típico)
2. Cooldown base - redução por nível
3. + Quick Powder bonus (-8% por stack, max 3)
4. + Held items (Charcoal +10% fire, Choice Specs +8%, etc.)
5. + Scope Lens crit chance
6. Projéteis = 1 base + duplicator (max 3)
7. **FINAL DPS = (dmg_final × projéteis) / cooldown_em_segundos**

### Dados
- `ATTACKS` de `src/data/attacks/attack-registry.ts`
- Scaling por ataque: cada `Attack.upgrade()` define dmg/cd increments (ler do código ou criar lookup table)
- Held items de `src/data/items/held-items.ts`

## Tab 3: ITENS & UPGRADES
Três sub-tabs:

### HELD ITEMS
Lista dos 22 held items com: ITEM | EFEITO | TIPO REQUERIDO | MAX LVL | BONUS/LVL

### UPGRADES
Stat upgrades do level-up: Max HP Up, Speed Up, Magnet Up com valores.

### PICKUPS
Drops do chão: berries, magnet burst, duplicator, friend ball, etc. com efeitos.

### Dados
- `HELD_ITEMS` de `src/data/items/held-items.ts`
- `UPGRADE_DEFS` de `src/data/items/upgrade-defs.ts`
- Pickups de `PickupSystem.applyPickup()` cases

## Tab 4: EVENTOS
Lista expandida dos 6 eventos do mapa com todos os detalhes.

Colunas: EVENTO | TRIGGER | QUANDO | REPETE? | EFEITO
Cada evento com sub-linha mostrando detalhes (radius, duration, chance, cooldown).

### Dados
- Extrair de `EventSystem.registerEvents()` — idealmente criar `EVENT_CONFIGS` exportável

## Architecture

### Novo arquivo
`src/scenes/DataViewerScene.ts`

### Acesso
Botão `[DATA]` na SelectScene → `this.scene.start('DataViewerScene', { map: 'phase1' })`

### Rendering
- Tudo em Phaser Text objects (monospace)
- Container scrollable via `Phaser.GameObjects.Container` com mask
- Tab switching destroi/recria conteúdo da tab ativa
- Sem physics, sem update loop pesado — cena estática com scroll

### Dados necessários como exports
Alguns dados hoje vivem dentro de classes (EventSystem). Precisamos extrair:
1. `EVENT_CONFIGS[]` — array exportável com dados dos eventos (sem execute())
2. `ATTACK_SCALING` — lookup com dmg_per_level e cd_reduction_per_level por ataque
   (ou calcular em runtime lendo o padrão: `this.damage += X` e `this.cooldown - Y`)

### Controles
- `ESC`: Voltar para SelectScene
- `◀▶` ou `1234`: Trocar tab
- `▲▼`: Scroll / navegar lista
- `ENTER`: Selecionar (combo calculator)
- `T`: Toggle timeline/table na tab WAVES
- Mouse wheel: Scroll
