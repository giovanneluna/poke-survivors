# PRD: Map Builder — Editor Visual de Mapas

**Data:** 2026-02-11
**Design Doc:** `docs/plans/2026-02-11-map-tileset-poc.md` (seção Fase 2+)

## Objetivo

Editor visual dev-only (MapEditorScene) para criar mapas tile-by-tile com exportação JSON. Suporta mapas fixos e geração aleatória. Biblioteca completa de tiles de 3 fontes (Emerald, FRLG, PMD).

## User Stories

### Pré-requisito: Biblioteca de Tiles

1. **Extrair tiles expandidos do Emerald** (~40 tiles): ground, water, nature, buildings multi-tile, decorações
2. **Baixar e extrair tiles FRLG** (~35 tiles): mesmas categorias, paleta Kanto
3. **Organizar tiles PMD** (~15 tiles): LushPrairie, MystifyingForest, BeachCave, ForestPath
4. **Criar tile registry** (`src/data/editor-tiles.ts`): catálogo de todos tiles com IDs, categorias, metadados
5. **BootScene dynamic loader**: carregar todos tiles automaticamente pelo registry

### Fase 2a: Editor MVP (Terreno)

6. **MapEditorScene**: grid canvas com pan (WASD/middle-click), zoom (scroll), cursor hover highlight
7. **Palette (direita)**: layer tabs (Terreno/Objetos/Markers), abas por fonte, grid de tiles clicáveis
8. **Ferramentas de pintura**: pincel (1×1, 3×3, 5×5), balde flood fill, retângulo, borracha
9. **Modo bioma + modo tile**: bioma macro (noise preenche) ou tile individual (exato)
10. **Undo/Redo**: stack de operações, Ctrl+Z/Ctrl+Y
11. **Export/Import**: Copiar JSON, Baixar JSON, Salvar localStorage, Carregar, Auto-save 30s
12. **Gerar Aleatório**: preenche canvas com noise FBM do WorldSystem
13. **Mini-mapa**: canto inferior direito, viewport indicator
14. **Tamanho configurável**: default 125×125, expansível via toolbar

### Fase 2b: Objetos e Buildings

15. **Layer de objetos**: palette por categoria (natureza, destructibles, buildings, decoração)
16. **Buildings multi-tile**: posiciona por top-left, preenche bloco automaticamente
17. **Colisão automática**: objetos sólidos geram collider no jogo

### Fase 2c: Integração no Jogo

18. **WorldSystem JSON loader**: carrega mapas fixos, fallback para noise procedural
19. **GameContext.mapId**: seleção de mapa (null = random, string = mapa fixo)
20. **SelectScene**: escolha entre "Aleatório" e mapas fixos criados no editor

## Escopo NÃO incluído (Fase 3 — Quests)

- Enemy Zone / Boss Arena markers
- Quest system
- NPC dialogue system
