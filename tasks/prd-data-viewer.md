# PRD: DataViewerScene — Terminal Retro Data Dashboard

## Overview
Nova cena Phaser dedicada para visualizar todos os dados do jogo em formato terminal retro (monospace, fundo escuro, bordas ASCII). Acessível via botão [DATA] na SelectScene.

## Design Doc
`docs/plans/2026-02-10-data-viewer-scene.md`

## User Stories

### US-001: Criar DataViewerScene base com sistema de tabs
**Prioridade:** 1
**Descrição:**
Criar `src/scenes/DataViewerScene.ts` com:
1. Registrar a cena no `src/scenes/index.ts` e no game config
2. Fundo `#0a0a0a`, toda a UI em Phaser Text monospace
3. Tab bar no topo com 4 tabs: WAVES, ATAQUES, ITENS, EVENTOS
4. Tab ativa destacada em `#00ff88`, inativas em `#666666`
5. Footer com controles: `[ESC] Voltar  [◀▶] Tabs  [▲▼] Scroll`
6. Sistema de scroll: Container com mask, scroll via mouse wheel + setas
7. `ESC` volta para SelectScene
8. Recebe `{ map: string }` como scene data (default 'phase1')
9. Trocar tab destroi conteúdo anterior e renderiza o novo

**Critério de aceite:** Cena abre, mostra 4 tabs clicáveis, ESC volta. Conteúdo das tabs pode ser placeholder text.

**Arquivos:** `src/scenes/DataViewerScene.ts` (novo), `src/scenes/index.ts` (registrar)

---

### US-002: Botão [DATA] na SelectScene
**Prioridade:** 2
**Descrição:**
Adicionar botão `[DATA]` na SelectScene que navega para DataViewerScene.
1. Posicionar abaixo dos starters ou no canto inferior
2. Texto monospace `[DATA]` com hover effect (highlight verde)
3. Click → `this.scene.start('DataViewerScene', { map: 'phase1' })`
4. Estilo consistente com outros botões da SelectScene

**Arquivos:** `src/scenes/SelectScene.ts`

---

### US-003: Tab WAVES — modo TABLE
**Prioridade:** 3
**Descrição:**
Renderizar tabela de waves lendo `PHASE1` de `src/data/enemies/phases/phase1.ts`.
1. Importar PHASE1 e boss configs (RATICATE, ARBOK, NIDOKING, SNORLAX)
2. Header: `MAP 1 — FIRE RED | 20 WAVES | 10:00 | 4 BOSSES`
3. Tabela com colunas: WAVE | TIME | ENEMIES | RATE | MAX
4. Time calculado: wave index × 30s (waves duram 30s cada)
5. Enemies: mostrar `tipo×peso` para cada entry na wave
6. Entre waves, inserir boss rows destacados com fundo diferente
7. Boss row mostra: nome, HP, SPD, DMG, XP, e lista de bossAttacks (nome, pattern, dmg, cd)
8. Cores: waves em `#00ff88`, bosses em `#ff4444`, headers em `#ffcc00`

**Dados:** `PHASE1.waves[]`, `PHASE1.bosses[]`, configs em `src/data/enemies/raticate.ts` etc.

**Arquivos:** `src/scenes/DataViewerScene.ts`

---

### US-004: Tab WAVES — modo TIMELINE
**Prioridade:** 4
**Descrição:**
Adicionar modo TIMELINE (toggle com tecla T ou sub-tab clicável).
1. Sub-tabs no topo da área: `▸ TIMELINE  TABLE`
2. Timeline vertical cronológica: waves + bosses + eventos intercalados
3. Waves: `0:00 ┬ WAVE 00 ─ Rattata×3 Caterpie×1 [30 max, 1.2s]`
4. Bosses: Box com bordas duplas `╔═╗` destacado, HP/ataques expandidos
5. Eventos timed intercalados no minuto correto:
   - PokéCenter @ 3:00 (repete a cada 3min)
   - Prof. Oak @ 4:00
   - Eclipse @ 6:00
   - Legendary @ 8:00
6. Eventos wave-triggered: aparecem como "possível" com chance%
   - Swarm: 5%/wave, min 2:00, cd 60s
   - Treasure Room: 8%/wave, min 3:00, cd 90s
7. Criar array `EVENT_DATA` local com os dados extraídos do EventSystem (não precisa importar a classe, hardcodar os dados estáticos que estão em `registerEvents()`)
8. Linha vertical conectando tudo: `│` entre entries, `┬` para waves, `╠` para bosses

**Arquivos:** `src/scenes/DataViewerScene.ts`

---

### US-005: Tab ATAQUES — Lista de ataques
**Prioridade:** 5
**Descrição:**
Renderizar lista de todos os ataques agrupados por starter e form.
1. Selector de starter no topo: `CHARMANDER ◀▶ SQUIRTLE ◀▶ BULBASAUR`
2. Trocar com ◀▶ ou clicando
3. Importar `ATTACKS` de `src/data/attacks/attack-registry.ts`
4. Importar starter configs de `src/data/pokemon/` para saber quais ataques pertencem a qual starter
5. Agrupar por form: `─── BASE ───`, `─── STAGE 1 ───`, `─── STAGE 2 ───`
6. Colunas: ATAQUE | ELE | DMG | CD | FORM | MAX LV
7. Elemento colorido por tipo (fire=#ff6600, water=#3388ff, grass=#22cc44, etc.)
8. Cursor ▲▼ para navegar, item selecionado destacado com `>` e fundo

**Dados:** `ATTACKS`, starter configs de `src/data/pokemon/index.ts`

**Arquivos:** `src/scenes/DataViewerScene.ts`

---

### US-006: Tab ATAQUES — Combo Calculator
**Prioridade:** 6
**Descrição:**
Ao pressionar ENTER num ataque, mostrar breakdown de DPS na metade inferior da tela.
1. Painel inferior com borda: `◆ COMBO CALCULATOR`
2. Criar lookup `ATTACK_SCALING` com dmg_per_level e cd_reduction_per_level para cada ataque:
   - Ler dos arquivos de ataque: padrão típico é `this.damage += X` e `this.cooldown = Math.max(FLOOR, this.cooldown - Y)` no `upgrade()`
   - Para simplificar, criar um Record<string, { dmgPerLevel: number, cdReduction: number }> com valores representativos
   - Padrão base: +5 dmg/lv, -100ms cd/lv (ajustar para ataques que diferem)
3. Calcular e mostrar breakdown:
   - Linha 1: `Base DMG: X + upgrades(7×Y) = Z`
   - Linha 2: `Cooldown: Xms - Yms = Zms`
   - Linha 3: `+ Quick Powder x3: Z × 0.76 = Wms`
   - Linha 4: `+ Charcoal: Z × 1.10 = W` (se fire, mostrar item relevante ao tipo)
   - Linha 5: `+ Choice Specs: Z × 1.08 = W`
   - Linha 6: `+ Scope Lens: +5% crit (×1.5 = W on crit)`
   - Linha 7: `Projéteis: 1 base + 3 duplicator = 4`
   - Linha FINAL: `FINAL: W dmg × 4 proj / X.Xs = Y.Y DPS`
4. DPS em fonte grande, cor `#00ff88`
5. Valores numéricos em `#ff6644` (laranja)

**Arquivos:** `src/scenes/DataViewerScene.ts`

---

### US-007: Tab ITENS — Held Items + Upgrades + Pickups
**Prioridade:** 7
**Descrição:**
Renderizar 3 sub-tabs de itens.
1. Sub-tabs: `▸ HELD ITEMS  UPGRADES  PICKUPS`
2. **HELD ITEMS**: Importar de `src/data/items/held-items.ts`
   - Colunas: ITEM | EFEITO | TIPO | MAX | POR LEVEL
   - Items com requiredType mostram o tipo, ALL para genéricos
   - 22 items total
3. **UPGRADES**: Stats do level-up
   - Max HP Up: +10 HP, +0.5 HP/s regen
   - Speed Up: +15% velocidade
   - Magnet Up: +12 alcance XP (max 90)
4. **PICKUPS**: Drops do chão com efeitos
   - Oran Berry (+25 HP), Sitrus (+50), Liechi (2× DMG 30s), Salac (1.5× SPD 30s)
   - Magnet Burst, Duplicator (+1 proj max 3), XP Share (XP ×2), Friend Ball, Rare Candy
   - Coins: Small ₽5, Medium ₽25, Large ₽100

**Dados:** `HELD_ITEMS`, `UPGRADE_DEFS`, pickup types de `src/types.ts`

**Arquivos:** `src/scenes/DataViewerScene.ts`

---

### US-008: Tab EVENTOS
**Prioridade:** 8
**Descrição:**
Lista detalhada dos 6 eventos do mapa.
1. Cada evento ocupa 2-3 linhas: header + detalhes expandidos
2. Colunas header: EVENTO | TRIGGER | QUANDO | REPETE? | EFEITO
3. Sub-linha com detalhes: radius, duration, chance, cooldown, HP/tick, etc.
4. Dados hardcoded (extraídos do EventSystem.registerEvents()):
   - PokéCenter: timed 3:00, repeat 3min, zona 80px, +5HP/500ms, 15s
   - Prof. Oak: timed 4:00, one-shot, spawna gacha box
   - Swarm: wave-trigger, 5%, min 2:00, cd 60s, 40 enemies
   - Eclipse: timed 6:00, one-shot, 30s, brightness 0.35
   - Legendary: timed 8:00, one-shot, Mew 15s
   - Treasure Room: wave-trigger, 8%, min 3:00, cd 90s, 3-5 baús + 3 Machop

**Arquivos:** `src/scenes/DataViewerScene.ts`

---

## Notas técnicas
- Toda a UI usa Phaser Text com fontFamily 'monospace'
- Scroll via Container + mask (setMask com rectangle geometry)
- Sem physics na cena — puramente visual
- Cores: verde `#00ff88`, amarelo `#ffcc00`, laranja `#ff6644`, vermelho `#ff4444`
- Dados lidos dos configs existentes, sem duplicação
- Para o ATTACK_SCALING lookup, criar constante local com dados representativos (não precisa ler os 68 arquivos)
