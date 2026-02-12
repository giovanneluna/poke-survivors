# Design: Sistema de Mapas — Tilesets + Map Builder

**Data:** 2026-02-11
**Status:** Fase 1 concluída, Fase 2+ aprovada via brainstorming
**Objetivo:** Tiles autênticos de Pokémon + editor visual para criar mapas fixos e aleatórios.

---

## Contexto

O mapa original usava texturas procedurais (retângulos coloridos). O sistema evoluiu em fases:

1. **Fase 1 (CONCLUÍDA):** Tiles Emerald + geração por FBM noise
2. **Fase 2+:** Map Builder para criar mapas fixos + biblioteca completa de tiles

O jogo suporta dois modos de mapa:
- **Aleatório** — geração procedural via FBM noise (comportamento atual)
- **Fixo** — mapas desenhados pela equipe no Map Builder, salvos como JSON

---

## Fase 1 — Tileset POC (CONCLUÍDO)

### O que foi feito

- Tiles Emerald extraídos de `emerald-exterior-tileset.png` (16×16, escalados 1.5×)
- `src/data/tile-themes.ts` com tema Emerald (único tema ativo)
- WorldSystem reescrito com FBM noise: `hash()`, `valueNoise()`, `fbm()`, `pickBiomeHint()`
- Biomas orgânicos: tree clusters, rock nas bordas, dirt patches, flower meadows, dark grass, path veins
- Border: water → waterEdge → tree
- BootScene carrega tiles automaticamente
- SelectScene sem seletor de tema (Emerald fixo como default)

### Arquitetura Atual

```typescript
interface TileTheme {
  readonly id: string;
  readonly name: string;
  readonly previewKey: string;
  readonly tileSize: number;       // 16 (GBA) ou 24 (PMD)
  readonly tiles: {
    readonly grassLight: string;
    readonly grassDark: string;
    readonly grassFlower: string;
    readonly dirt: string;
    readonly water: string;
    readonly waterEdge: string;
    readonly tree: string;
    readonly rock: string;
    readonly path: string;
  };
}
```

### Noise System (WorldSystem)

```
pickBiomeHint(col, row, maxCols, maxRows)
├── Border (3 tiles): water → waterEdge → tree
├── Tree clusters: fbm(0.06) > 0.62
├── Rock (tree edges): fbm(0.06) > 0.55
├── Dirt patches: fbm(0.09, offset+50) > 0.68
├── Flower meadows: fbm(0.1, offset+150) > 0.62
├── Dark grass: fbm(0.07, offset+250) > 0.52
├── Path veins: fbm(0.15, offset+400) ∈ [0.49, 0.51]
└── Default: grassLight
```

### Assets Atuais

```
public/assets/tiles/emerald/
├── grass-light.png, grass-dark.png, grass-flower.png
├── dirt.png, path.png, rock.png, tree.png
├── water.png, water-edge.png
└── preview.png
```

---

## Fase 2 — Map Builder (Editor Visual)

### Conceito

`MapEditorScene` — Phaser Scene dev-only para criar mapas tile-by-tile. Híbrido: pintura macro de biomas (noise preenche detalhes) + posicionamento preciso de tiles individuais, objetos, buildings e markers.

### Acesso

- Dev-only: senha na SelectScene ou parâmetro URL `?editor=true`
- Não aparece para jogadores normais

### 3 Layers Editáveis

| Layer | Modo | Conteúdo |
|-------|------|----------|
| **Terreno** | Bioma macro OU tile individual | Biomas: grassland, forest, lake, dirt_zone, path. Tiles: todos da biblioteca |
| **Objetos** | Tile-por-tile (preciso) | Árvores, rochas, destructibles, Centro Pokémon, buildings, decorações |
| **Markers** | Tile-por-tile (preciso) | Player start, safe zones, event triggers, NPC positions |

### Terreno — Dois Modos de Pintura

**Modo Bioma (macro):** Pinta tipos de bioma. O noise preenche tiles automaticamente.

| ID | Visual | Descrição |
|----|--------|-----------|
| `grassland` | Verde claro | Área aberta padrão. Noise mistura grassLight + grassFlower |
| `forest` | Verde escuro | Árvores densas. Noise mistura tree + grassDark + rock |
| `lake` | Azul | Água com bordas. Auto-gera waterEdge nas transições |
| `dirt_zone` | Marrom | Terra/areia. Noise mistura dirt + path |
| `path` | Bege | Caminho fixo (tile exato, sem noise) |

**Modo Tile (preciso):** Pinta tiles individuais exatos — sem noise, controle total. Todos os tiles da biblioteca disponíveis.

### Objetos

| Categoria | Itens | Comportamento no jogo |
|-----------|-------|----------------------|
| **Natureza** | Árvore, Rocha grande, Arbusto | Colisão sólida (bloqueia movimento) |
| **Destructibles** | Tall Grass, Berry Bush, Rock, Chest | Quebráveis pelo jogador, dropam items |
| **Buildings** | Centro Pokémon (3×2), Mart (2×2), Casa (2×2), Ginásio (3×3) | Colisão sólida + visual multi-tile |
| **Decoração** | Flores, pedras pequenas, placas, postes | Sem colisão, puramente visual |

Buildings multi-tile: posiciona pelo tile top-left, preenche o bloco automaticamente.

### Markers (invisíveis no jogo)

| Marker | Visual no Editor | Efeito no Jogo |
|--------|-----------------|----------------|
| **Player Start** | Bandeira verde | Posição inicial do jogador (1 por mapa) |
| **Safe Zone** | Retângulo azul | Área sem spawn de inimigos |
| **Event Trigger** | Estrela amarela | PokéCenter heal, Prof. Oak, Treasure Room |
| **NPC** | Ícone de pessoa | Posição fixa, configurável: sprite, role |
| **Enemy Zone** | Retângulo vermelho | *(Futuro — quests)* Spawn zone configurável |
| **Boss Arena** | Círculo roxo | *(Futuro — quests)* Boss trigger por proximidade |

---

## UI do Editor

```
┌──────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                     │
│  [Tamanho: 125×125 ▼] [Expandir] [Gerar Aleatório]         │
│  [Pincel 1×1 ▼] [Balde] [Retângulo] [Borracha] [Undo/Redo]│
├──────────────────────────────────────────────┬───────────────┤
│           CANVAS (grid)                      │   PALETTE     │
│                                              │               │
│     Pan: middle-click drag / WASD            │  Layers:      │
│     Zoom: scroll wheel                       │  ● Terreno    │
│     Paint: left-click                        │  ○ Objetos    │
│     Erase: right-click                       │  ○ Markers    │
│                                              │               │
│          ┌───┬───┬───┬───┐                   │  [Biomas][Tiles]│
│          │ G │ G │ F │ F │                   │  ┌──┬──┐      │
│          ├───┼───┼───┼───┤                   │  │  │  │      │
│          │ G │ T │ T │ F │                   │  ├──┼──┤      │
│          ├───┼───┼───┼───┤                   │  │  │  │      │
│          │ D │ D │ T │ G │                   │  └──┴──┘      │
│          └───┴───┴───┴───┘                   │               │
│                                              │  [Emerald]    │
│                                 ┌────┐       │  [FRLG]       │
│                                 │mini│       │  [PMD]        │
│                                 │map │       │               │
│                                 └────┘       │               │
├──────────────────────────────────────────────┴───────────────┤
│  [Salvar Local]  [Copiar JSON]  [Baixar JSON]  [Carregar]   │
└──────────────────────────────────────────────────────────────┘
```

### Controles

| Ação | Input |
|------|-------|
| Pan | Middle-click drag ou WASD |
| Zoom | Scroll wheel (zoom no cursor) |
| Pintar | Left-click |
| Apagar | Right-click |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |

### Barra Inferior

| Botão | Ação |
|-------|------|
| **Salvar Local** | Grava no localStorage (auto-save a cada 30s) |
| **Copiar JSON** | JSON compacto → clipboard → colar no chat |
| **Baixar JSON** | Download como arquivo `.json` |
| **Carregar** | Lista mapas salvos no localStorage |

### Gerar Aleatório

Botão na toolbar que preenche o canvas com noise procedural (mesmo algoritmo do WorldSystem). Resultado aparece no editor pronto para edição manual.

---

## Formato JSON

### Estrutura Completa

```json
{
  "name": "Viridian Forest",
  "version": 1,
  "width": 125,
  "height": 125,
  "tileSize": 24,
  "terrain": {
    "0,0": "forest",
    "0,1": "forest",
    "50,50": "lake",
    "60,30": "emerald:ground-grass-dark"
  },
  "objects": [
    { "type": "pokecenter", "x": 50, "y": 30, "size": [3, 2], "source": "emerald" },
    { "type": "chest", "x": 22, "y": 18 },
    { "type": "tree", "x": 10, "y": 5, "source": "frlg" }
  ],
  "markers": [
    { "type": "playerStart", "x": 62, "y": 62 },
    { "type": "safeZone", "x": 48, "y": 28, "w": 8, "h": 8 },
    { "type": "npc", "x": 52, "y": 31, "config": { "sprite": "nurse-joy", "role": "healer" } },
    { "type": "eventTrigger", "x": 80, "y": 40, "config": { "event": "pokecenter" } }
  ]
}
```

### Regras de Compactação

- `terrain` só armazena células que **não são grassland** (default)
- Valores de terrain:
  - Bioma macro: `"forest"`, `"lake"`, `"dirt_zone"`, `"path"` → noise preenche
  - Tile exato: `"emerald:ground-grass-dark"` → tile individual, sem noise
- Mapa 125×125 com ~30% customizado → **15-30 KB**
- Default 125×125 tiles, expansível pelo usuário

### Integração no WorldSystem

```
WorldSystem.generateWorld()
│
├── Tem mapa JSON carregado?
│   ├── SIM → Para cada tile:
│   │        ├── terrain[col,row] é bioma? → Noise preenche dentro do bioma
│   │        ├── terrain[col,row] é tile exato? → Usa tile direto
│   │        └── Não existe? → Noise procedural (grassland default)
│   │   → Spawna objects[] com colisão/interação
│   │   → Registra markers[] nos sistemas
│   │
│   └── NÃO → Geração 100% procedural (comportamento atual, zero breaking change)
```

Mapa selecionado via `GameContext.mapId`:
- `null` ou `"random"` → noise procedural
- `"viridian-forest"` → carrega `src/data/maps/map-viridian-forest.json`

---

## Biblioteca de Tiles

### Fontes

| Fonte | Origem | Escopo |
|-------|--------|--------|
| **Emerald** | `emerald-exterior-tileset.png` (já baixado) | Exterior completo + buildings detalhados |
| **FRLG** | FireRed/LeafGreen tileset (The Spriters Resource) | Exterior completo + buildings detalhados |
| **PMD** | pokemonAutoChess repo (`tilesets/`) | LushPrairie, MystifyingForest, BeachCave, ForestPath |

### Estrutura de Pastas

```
public/assets/tiles/
├── emerald/
│   ├── ground/          (grama, terra, areia, caminhos, piso)
│   ├── water/           (água profunda, rasa, bordas)
│   ├── nature/          (árvores, arbustos, rochas, cercas)
│   ├── buildings/       (pokecenter, mart, casa, gym — multi-tile)
│   ├── decoration/      (flores, placa, poste, banco, mailbox)
│   └── preview.png
│
├── frlg/
│   ├── ground/
│   ├── water/
│   ├── nature/
│   ├── buildings/
│   ├── decoration/
│   └── preview.png
│
└── pmd/
    ├── lush-prairie/
    ├── mystifying-forest/
    ├── beach-cave/
    ├── forest-path/
    └── preview.png
```

### Regras de Assets

- Cada tile = **1 arquivo PNG** individual
- GBA tiles: 16×16px (escalados 1.5× no jogo = 24px grid)
- PMD tiles: 24×24px (escala 1.0)
- Buildings multi-tile: 1 PNG no tamanho real (ex: pokecenter = 48×32px)
- Nomes em kebab-case, inglês
- Total estimado: **~70-80 tiles únicos**

### IDs de Tile

Formato: `{fonte}:{categoria}-{nome}`

Exemplos:
- `emerald:ground-grass-light`
- `emerald:buildings-pokecenter`
- `frlg:nature-tree`
- `pmd:lush-floor-1`

### Tiles a Extrair

**Emerald** (~40 tiles):
- ground: grass-light, grass-dark, grass-flower, dirt, sand, path, city-floor
- water: deep, shallow, edge-n/s/e/w
- nature: tree, tree-large, bush, rock, fence-h, fence-v, stump
- buildings: pokecenter, mart, house, gym (multi-tile)
- decoration: flowers, sign, lamppost, mailbox, bench

**FRLG** (~35 tiles): mesmas categorias, paleta Kanto (vibrante/saturada)

**PMD** (~15 tiles): floor e wall de cada tileset (LushPrairie, MystifyingForest, BeachCave, ForestPath)

### Loader Dinâmico (BootScene)

O BootScene varre as pastas registradas e carrega cada tile com seu ID automaticamente.

Extração via script Node.js (`scripts/extract-editor-tiles.mjs`) com `sharp`.

---

## Escopo de Implementação

### Pré-requisito — Extração de Tiles
- [ ] Baixar tileset FRLG do The Spriters Resource
- [ ] Baixar tilesets PMD do pokemonAutoChess
- [ ] Script `extract-editor-tiles.mjs` para extrair tiles individuais
- [ ] Organizar em `public/assets/tiles/{fonte}/{categoria}/`
- [ ] Atualizar BootScene com loader dinâmico

### Fase 2a — Editor MVP (Terreno)
- [ ] `MapEditorScene` com grid, pan (WASD + middle-click), zoom (scroll)
- [ ] Layer de terreno: modo bioma macro + modo tile individual
- [ ] Palette na direita com abas por fonte (Emerald, FRLG, PMD)
- [ ] Ferramentas: pincel (1×1, 3×3, 5×5), balde (flood fill), retângulo, borracha
- [ ] Undo/Redo (Ctrl+Z / Ctrl+Y)
- [ ] Tamanho configurável (default 125×125, expansível)
- [ ] Export: Copiar JSON, Baixar JSON, Salvar/Carregar localStorage
- [ ] Auto-save a cada 30s
- [ ] Botão "Gerar Aleatório" (preenche com noise procedural)
- [ ] Mini-mapa no canto inferior direito

### Fase 2b — Objetos e Buildings
- [ ] Layer de objetos com palette por categoria (natureza, destructibles, buildings, decoração)
- [ ] Buildings multi-tile (posiciona por top-left, preenche bloco)
- [ ] Colisão automática para objetos sólidos
- [ ] Destructibles com drop config

### Fase 2c — Markers e Integração no Jogo
- [ ] Layer de markers (playerStart, safeZone, eventTrigger, NPC)
- [ ] Config panel ao clicar num marker
- [ ] WorldSystem carrega mapas JSON fixos
- [ ] `GameContext.mapId` para seleção de mapa
- [ ] SelectScene: escolha entre "Aleatório" e mapas fixos

### Fase 3 — Quests (Futuro)
- [ ] Enemy Zone markers com config de Pokémon/density
- [ ] Boss Arena markers com trigger por proximidade
- [ ] Quest system integrado

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Tiles extraídos ficam feios escalados | `setScale(1.5)` com NEAREST filter (pixel art crisp) |
| Editor lento com mapa grande | Renderizar só viewport visível + mini-mapa para navegação |
| JSON muito grande em mapas expandidos | Compactação: só armazena non-default; biomas macro em vez de tile-por-tile |
| Buildings multi-tile complexos | Posicionamento por top-left simplifica; metadata de tamanho no JSON |
| Integração com spawn system | Mapas fixos usam spawn procedural normal; markers de spawn = futuro |
