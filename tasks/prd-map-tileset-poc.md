# PRD: Map Tileset POC — 3 Temas Visuais

## Overview
Substituir tiles procedurais por tiles autênticos de Pokémon GBA/PMD. Prova de conceito com 3 estilos visuais (Emerald, FRLG, PMD) selecionáveis na SelectScene. Área de teste: bioma grama central ~3000×3000px.

## Design Doc
`docs/plans/2026-02-11-map-tileset-poc.md`

## User Stories

### US-001: Criar script de extração de tiles dos tilesets
**Prioridade:** 1
**Descrição:**
Criar `scripts/extract-tiles.mjs` que usa `sharp` (instalar com `npm i -D sharp`) para extrair tiles 16×16 de 3 tilesets fonte.

O script deve:
1. Ler `public/assets/items/sprite-options/emerald-exterior-tileset.png`
2. Ler `public/assets/items/sprite-options/frlg-tileset.png`
3. Baixar 3 tilesets do pokemonAutoChess:
   - `https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/tilesets/LushPrairie/tileset.png`
   - `https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/tilesets/ForestPath/tileset.png`
   - `https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/master/app/public/src/assets/tilesets/Town/tileset.png`
4. Para cada tema, extrair ~10 tiles 16×16 e salvar em:
   - `public/assets/tiles/emerald/{name}.png`
   - `public/assets/tiles/frlg/{name}.png`
   - `public/assets/tiles/pmd/{name}.png`

Tiles a extrair (por tema):
- `grass-light.png` — Grama clara principal
- `grass-dark.png` — Grama escura (variação)
- `grass-flower.png` — Grama com flores
- `dirt.png` — Terra/caminho de terra
- `water.png` — Água profunda
- `water-edge.png` — Borda de água (transição)
- `tree.png` — Árvore (canopy ou tronco)
- `rock.png` — Rocha decorativa
- `path.png` — Caminho pavimentado

IMPORTANTE: As posições dos tiles nos tilesets variam. O script deve:
- Abrir cada tileset e analisar visualmente (ou usar coordenadas hardcoded)
- Para Emerald/FRLG: tilesets são grids 16×16. Usar coordenadas {row, col} hardcoded
- Para PMD: tilesets podem ter tamanhos diferentes. Verificar dimensões primeiro.

Se não conseguir identificar posições exatas, extrair os primeiros tiles que parecem grama, água, terra, etc. baseado nas cores predominantes. O usuário vai ajustar manualmente depois.

Após extração, remover sharp: `npm uninstall sharp`

**Critério de aceite:** Diretórios `public/assets/tiles/emerald/`, `frlg/`, `pmd/` existem com ~10 PNGs cada. Sharp removido do package.json.

**Arquivos:** `scripts/extract-tiles.mjs` (novo), `public/assets/tiles/` (novos)

---

### US-002: Criar preview thumbnails dos 3 temas
**Prioridade:** 2
**Descrição:**
Criar 3 imagens de preview (80×80px) para o seletor de tema na SelectScene.

O script `scripts/extract-tiles.mjs` (do US-001) deve, além de extrair tiles individuais, montar 3 thumbnails compostos:
- `public/assets/tiles/emerald/preview.png` — Grid 5×5 dos tiles emerald escalados
- `public/assets/tiles/frlg/preview.png` — Grid 5×5 dos tiles frlg
- `public/assets/tiles/pmd/preview.png` — Grid 5×5 dos tiles pmd

Cada preview = composição 80×80 dos tiles extraídos naquele tema, mostrando grama + água + árvore + caminho. Usar sharp.composite() para montar.

Alternativamente, se montar composição for muito complexo: tirar um crop 80×80 de uma região representativa de cada tileset original.

**Critério de aceite:** 3 arquivos preview.png existem e mostram o estilo visual de cada tema.

**Arquivos:** `scripts/extract-tiles.mjs` (editar), `public/assets/tiles/*/preview.png` (novos)

---

### US-003: Criar sistema de tile themes
**Prioridade:** 3
**Descrição:**
Criar `src/data/tile-themes.ts` com:

```typescript
export interface TileTheme {
  readonly id: string;
  readonly name: string;
  readonly previewKey: string;
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

export const TILE_THEMES: readonly TileTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    previewKey: 'theme-preview-emerald',
    tiles: {
      grassLight: 'tile-emerald-grass-light',
      grassDark: 'tile-emerald-grass-dark',
      grassFlower: 'tile-emerald-grass-flower',
      dirt: 'tile-emerald-dirt',
      water: 'tile-emerald-water',
      waterEdge: 'tile-emerald-water-edge',
      tree: 'tile-emerald-tree',
      rock: 'tile-emerald-rock',
      path: 'tile-emerald-path',
    },
  },
  // ... FRLG and PMD themes with same structure
  // Also add 'classic' theme that maps to existing procedural textures:
  // grassLight: 'tile-grass-1', grassDark: 'tile-grass-2', etc.
];

export const DEFAULT_THEME = 'emerald';
```

Incluir tema `classic` que mapeia para as texturas procedurais existentes (`tile-grass-1`, `tile-grass-2`, `tile-flowers`, `tile-dirt`, `tile-water`, `tile-rock`, `tile-tree`). Isso serve como fallback seguro.

**Critério de aceite:** Arquivo compila sem erros. 4 temas definidos (emerald, frlg, pmd, classic).

**Arquivos:** `src/data/tile-themes.ts` (novo)

---

### US-004: Carregar tiles dos temas no BootScene
**Prioridade:** 4
**Descrição:**
No `src/scenes/BootScene.ts`, na seção `preload()`, adicionar carregamento dos tiles extraídos.

Após a seção de destructible sprites, adicionar:
```typescript
// ── Tile themes ────────────────────────────────────────────────
const themes = ['emerald', 'frlg', 'pmd'];
const tileNames = ['grass-light', 'grass-dark', 'grass-flower', 'dirt', 'water', 'water-edge', 'tree', 'rock', 'path'];
for (const theme of themes) {
  this.load.image(`theme-preview-${theme}`, `assets/tiles/${theme}/preview.png`);
  for (const tile of tileNames) {
    this.load.image(`tile-${theme}-${tile}`, `assets/tiles/${theme}/${tile}.png`);
  }
}
```

NÃO remover as texturas procedurais existentes — elas são usadas pelo tema `classic`.

**Critério de aceite:** BootScene carrega 30 tiles (3 temas × 10 tiles) + 3 previews sem erros. Texturas procedurais continuam funcionando.

**Arquivos:** `src/scenes/BootScene.ts` (editar seção preload)

---

### US-005: Adicionar tema ao GameContext
**Prioridade:** 5
**Descrição:**
No `src/systems/GameContext.ts`, adicionar campo para o tema selecionado:

1. Importar `TileTheme` e `TILE_THEMES` de `src/data/tile-themes.ts`
2. Adicionar propriedade `tileTheme: TileTheme` ao GameContext
3. Default: primeiro tema de TILE_THEMES (emerald)
4. O tema é definido na SelectScene antes de iniciar o jogo

Se GameContext não existir como classe separada, verificar onde o contexto do jogo é passado (pode ser via scene.data ou diretamente no GameScene). Adaptar conforme o padrão existente.

**Critério de aceite:** GameContext tem tileTheme. GameScene pode acessar o tema. Compila sem erros.

**Arquivos:** `src/systems/GameContext.ts` (editar), possivelmente `src/scenes/GameScene.ts`

---

### US-006: Refatorar WorldSystem para usar tile themes
**Prioridade:** 6
**Descrição:**
Refatorar `src/systems/WorldSystem.ts` para usar o tema selecionado.

Mudanças:
1. O método `generateWorld()` recebe ou acessa o `TileTheme`
2. O método `pickTile()` retorna um biome hint (string: 'grassLight' | 'grassDark' | 'grassFlower' | 'dirt' | 'water' | 'waterEdge' | 'tree' | 'rock' | 'path')
3. Novo método `resolveTexture(hint: string, theme: TileTheme): string` que mapeia hint → textureKey
4. Na criação do tile image: `this.add.image(x, y, resolveTexture(hint, theme))`
5. Para tiles 16×16 (temas reais), usar `setScale(1.5)` para manter tamanho efetivo de 24px (igual ao atual)
6. Para tema 'classic' (procedural 24×24), scale=1.0

O mapping de pickTile() atual:
- `tile-grass-1` → hint 'grassLight'
- `tile-grass-2` → hint 'grassDark'
- `tile-flowers` → hint 'grassFlower'
- `tile-dirt` → hint 'dirt'
- `tile-water` → hint 'water'
- `tile-rock` → hint 'rock'
- `tile-tree` → hint 'tree'

**Critério de aceite:** Jogo roda com tema 'classic' (procedural) exatamente como antes. Se trocar pra 'emerald', usa tiles reais. Sem mudança visual no modo classic.

**Arquivos:** `src/systems/WorldSystem.ts` (editar)

---

### US-007: Adicionar seletor de tema na SelectScene
**Prioridade:** 7
**Descrição:**
Na `src/scenes/SelectScene.ts`, adicionar seletor visual de tema de mapa.

Posição: Abaixo do grid de starters, antes do botão START.

Layout:
```
[MAPA]
[preview-emerald] [preview-frlg] [preview-pmd] [preview-classic]
   Emerald           FRLG           PMD          Classic
```

Implementação:
1. Importar `TILE_THEMES` de `src/data/tile-themes.ts`
2. Para cada tema, criar:
   - Image com textureKey do preview (80×80, scale ajustável)
   - Text com nome do tema abaixo
   - Borda/highlight no selecionado (retângulo colorido)
3. Click handler: salvar tema selecionado (variável da scene ou static)
4. Passar tema escolhido para GameScene via scene.data ou similar
5. Default: primeiro tema (emerald)
6. Para tema 'classic', usar um preview procedural (pode ser um retângulo verde simples ou gerar uma mini-thumbnail)

Seguir o padrão visual existente da SelectScene (monospace font, cores escuras, estilo terminal).

**Critério de aceite:** 4 opções de tema visíveis. Click muda seleção com feedback visual. Tema selecionado chega ao GameScene.

**Arquivos:** `src/scenes/SelectScene.ts` (editar)

---

### US-008: Teste de integração — jogar com cada tema
**Prioridade:** 8
**Descrição:**
Verificação final:

1. Selecionar tema Emerald → iniciar jogo → tiles do Emerald visíveis
2. Selecionar tema FRLG → iniciar jogo → tiles do FRLG visíveis
3. Selecionar tema PMD → iniciar jogo → tiles do PMD visíveis
4. Selecionar tema Classic → iniciar jogo → tiles procedurais (igual antes)
5. Em todos os temas: destrutíveis, inimigos, ataques funcionam normal
6. Performance: sem queda de FPS (mesma quantidade de tiles)

Se algum tema tem tiles faltando ou broken, ajustar no script de extração (US-001) ou hardcodar posições corretas.

Rodar `npx tsc --noEmit` para garantir typecheck.

**Critério de aceite:** Os 4 temas funcionam in-game. Typecheck green. Nenhum tile aparece como "missing texture" (quadrado roxo/preto do Phaser).

**Arquivos:** Nenhum novo — validação dos anteriores.
