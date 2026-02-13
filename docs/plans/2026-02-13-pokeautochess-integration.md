# Plano: Integração Massiva dos Assets pokemonAutoChess

## Context
O usuário baixou todos os assets do pokemonAutoChess para `public/assets/pokeautochess-content/`. São **343 animações de ataques**, **28 status effects**, **311 itens**, **144 tilesets PMD**, **20 SFX .ogg**, e assets de ambiente. O objetivo é integrar TUDO ao jogo, melhorando visuais de bosses, adicionando status effects animados, sons reais, novos temas de mapa, e mais.

## Problema Atual
- Vários bosses usam sprites genéricos (ex: Vileplume usa `atk-acid-spray` de poison para Petal Dance de grass!)
- Status effects no player são apenas tints de cor (sem animação)
- Som é 100% procedural (Web Audio oscillators)
- Apenas 4 temas de mapa
- Chest/gacha-box são texturas procedurais

---

## Fase 0 — Tooling: Script de Montagem de Spritesheets

**Motivação:** Os assets do pokeautochess são frames individuais (`000.png`, `001.png`...). Phaser precisa de spritesheets horizontais.

### Arquivo: `scripts/mount-spritesheet.mjs`
- Recebe: pasta de frames + nome de saída
- Usa `sharp` (devDependency) para combinar frames horizontalmente
- Retorna: dimensões do frame + contagem
- Modo batch: recebe lista JSON de ataques para montar de uma vez

### Uso:
```bash
node scripts/mount-spritesheet.mjs --input "public/assets/pokeautochess-content/abilities{tps}/PETAL_DANCE" --output "public/assets/attacks/grass/petal-dance-new-sheet.png"
```

**Arquivos:** `scripts/mount-spritesheet.mjs` (novo)
**Dependência:** `npm i -D sharp` (temporário)

---

## Fase 1 — Boss Attack Upgrades (15 sprites novos)

### Upgrades por Boss:

| Boss | Ataque | Sprite Atual (Genérico) | Nova Ability | Frames | Resultado |
|------|--------|------------------------|-------------|--------|-----------|
| **Raticate** | Hyper Fang | `atk-bite` (32×48) | `SUPER_FANG` | 8f | Mordida mais feroz |
| **Nidoking** | Earthquake | tremor genérico (sem sprite) | `PRECIPICE_BLADES` | 11f | Lâminas do chão |
| **Snorlax** | Hyper Beam | `atk-extreme-speed` (genérico) | `DYNAMAX_CANNON` | 39f | Beam épico |
| **Snorlax** | Body Slam | `atk-stomp` (16×16 minúsculo) | `HEAVY_SLAM` | 10f | Impacto maior |
| **Vileplume** | Petal Dance | `atk-acid-spray` (TIPO ERRADO!) | `PETAL_DANCE` | 54f | Correto e bonito |
| **Vileplume** | Stun Spore | zone sem visual | `STUN_SPORE` | 5f | Esporos visíveis |
| **Primeape** | Close Combat | `atk-stomp` (genérico) | `CLOSE_COMBAT` | 7f | Combo de socos |
| **Primeape** | Seismic Toss | aoe-land genérico | `SEISMIC_TOSS` | 13f | Arremesso dramático |
| **Gengar** | Dream Eater | `atk-shadow-bite` (genérico) | `DREAM_EATER` | 34f | Efeito correto |
| **Gengar** | Night Shade | beam genérico | `NIGHT_SHADE` | 8f | Sprite dedicado |
| **Golem** | Rock Slide | `atk-rock-throw` (16×16) | `ROCK_SLIDE` | 79f | Deslizamento épico |
| **Golem** | Explosion | já tem, mas upgrade | `EXPLOSION` | 37f | Alternativa mais detalhada |
| **Machamp** | Bulk Up | buff sem visual | `BULK_UP` | 7f | Aura de poder |
| **Alakazam** | Future Sight | zone genérica | `FUTURE_SIGHT` | 11f | Efeito psíquico |
| **Alakazam** | Psystrike (novo) | - | `PSYSTRIKE` | 6f | Novo ataque |

### Fluxo:
1. Rodar `mount-spritesheet.mjs` para cada ability → gera spritesheets em `public/assets/attacks/{type}/`
2. Adicionar `this.load.spritesheet()` no BootScene
3. Criar animações em `createAttackAnims()`
4. Atualizar `spriteKey`/`animKey` nos boss configs (`src/data/enemies/*.ts`)

### Arquivos modificados:
- `src/scenes/BootScene.ts` — 15 novos spritesheets + 15 novas animações
- `src/data/enemies/raticate.ts` — spriteKey Hyper Fang
- `src/data/enemies/nidoking.ts` — spriteKey Earthquake
- `src/data/enemies/snorlax.ts` — spriteKey Hyper Beam + Body Slam
- `src/data/enemies/vileplume.ts` — spriteKey Petal Dance + Stun Spore
- `src/data/enemies/primeape.ts` — spriteKey Close Combat + Seismic Toss
- `src/data/enemies/gengar.ts` — spriteKey Dream Eater + Night Shade
- `src/data/enemies/golem.ts` — spriteKey Rock Slide + Explosion
- `src/data/enemies/machamp.ts` — spriteKey Bulk Up
- `src/data/enemies/alakazam-boss.ts` — spriteKey Future Sight + Psystrike

---

## Fase 2 — Status Effects Visuais (7 overlays animados)

### Status a implementar:

| Status | Frames | Uso no Jogo | Substitui |
|--------|--------|------------|-----------|
| **BURN** | 7f | Dano de fogo over time | Tint vermelho |
| **POISON** | 15f | Veneno (Ekans contact) | Tint roxo pulsante |
| **PARALYSIS** | 4f | Stun visual | Tint amarelo pulsante |
| **CONFUSION** | 4f | Confuser behavior | Tint rosa rápido |
| **FREEZE** | 6f | Novo status (Ice bosses?) | Nenhum |
| **SLEEP** | 10f | Gengar Hypnosis zone | Nenhum |
| **PROTECT** | 10f | Boss buff shield | Tint genérico |

### Arquitetura:
- Montar 7 spritesheets dos status
- Novo módulo: `src/systems/StatusOverlay.ts`
  - `showStatusOverlay(target: Sprite, statusType, duration)` — cria sprite animado sobre o alvo
  - Sprite segue posição do target a cada frame
  - Auto-destrói após duração
  - Respeita VFX slider (`shouldShowVfx()`)
- Integrar em `Player.ts` nos métodos `applyPoison()`, `applyStun()`, `applyConfusion()`
- Integrar em boss buff patterns

### Arquivos:
- `scripts/mount-spritesheet.mjs` — montar 7 status sheets
- `src/systems/StatusOverlay.ts` (novo)
- `src/scenes/BootScene.ts` — carregar 7 status spritesheets + criar anims
- `src/entities/Player.ts` — chamar StatusOverlay nos apply*()
- `src/systems/SpawnSystem.ts` — chamar StatusOverlay no boss buff pattern

---

## Fase 3 — Sons Reais (.ogg)

### Mapeamento:

| Arquivo .ogg | Método SoundManager | Substitui |
|-------------|-------------------|-----------|
| `buttonclick.ogg` | `playClick()` | Oscillator square 800→1000Hz |
| `buttonhover.ogg` | `playHover()` | Oscillator sine 600Hz |
| `evolutiont2.ogg` | `playEvolve()` (stage 1) | Oscillator chord ascendente |
| `evolutiont3.ogg` | `playEvolve()` (stage 2) | Oscillator chord ascendente |
| `startgame.ogg` | `playStart()` | Oscillator fanfare |
| `finish1.ogg` | `playVictory()` (novo) | Nenhum |
| `finish2.ogg` | `playGameOver()` | Oscillator descendente |

### Implementação:
1. Copiar 7 .ogg para `public/assets/sounds/`
2. Carregar no BootScene via `this.load.audio()`
3. Modificar `SoundManager.ts`:
   - Adicionar campo para Phaser Sound objects
   - Método `init(scene)` para receber referência da scene
   - Cada play*() tenta usar .ogg primeiro, fallback para procedural
   - Respeita mute/volume existentes

### Arquivos:
- `public/assets/sounds/` — 7 arquivos .ogg copiados
- `src/scenes/BootScene.ts` — `this.load.audio()` para 7 sons
- `src/audio/SoundManager.ts` — dual mode (ogg + procedural fallback)

---

## Fase 4 — Environment & Visual Upgrades

### 4A. Portal Sprite (Gengar/Alakazam teleport)
- Arquivo: `environment/portal.png` (spritesheet com JSON)
- Substituir fade out/in do teleport-fan por animação de portal
- Arquivos: BootScene (carregar), SpawnSystem (teleport-fan pattern)

### 4B. Chest Sprite Real
- Arquivo: `environment/chest.png` (spritesheet com JSON)
- Substituir `dest-chest` procedural
- Arquivos: BootScene (carregar), `src/data/destructibles.ts` (texture key)

### 4C. Shine/Sparkle para Itens Raros
- Arquivo: `environment/shine.png` (spritesheet com JSON)
- Adicionar brilho sobre held items no chão
- Arquivos: BootScene, PickupSystem (spawn held item)

### 4D. Weather Overlays (Eventos)
- `rain.png` → overlay tile durante Rain Dance / Water boss events
- `fog.png` → overlay durante Eclipse event (melhor que brightness filter)
- `snowflakes.png` → evento futuro de neve
- Implementar como layer de partículas/tiles scrolling sobre a câmera
- Arquivos: BootScene, EventSystem.ts, novo `src/systems/WeatherOverlay.ts`

### 4E. Item Sprites HD do pokeautochess
- `MYSTERY_BOX.png` → substituir `gacha-box` procedural
- `TREASURE_BOX.png` → alternativa para chest
- `RARE_CANDY.png` → substituir `pickup-candy`
- `COIN.png` → alternativa para coins
- Arquivos: BootScene (carregar como images), PickupSystem (texture keys)

---

## Fase 5 — Novos Temas de Tileset (4 novos)

### Temas selecionados dos 144 tilesets PMD:

| Tema | Tileset PMD | Vibe | Tipo Pokémon |
|------|------------|------|-------------|
| **Crystal Cave** | `CrystalCave1` | Caverna de cristal azul | Ice/Rock |
| **Magma Cavern** | `MagmaCavern3` | Caverna vulcânica | Fire/Ground |
| **Sky Tower** | `SkyTower` | Torre celestial | Flying/Psychic |
| **Dark Crater** | `DarkCrater` | Cratera sombria | Dark/Ghost |

### Implementação por tema:
1. Extrair 9 tiles (16×16 ou 24×24) do tileset PNG usando o JSON de config
2. Salvar em `public/assets/tiles/{theme-id}/` (9 tiles + preview)
3. Adicionar ao array `tileThemes` no BootScene
4. Adicionar `TileTheme` em `src/data/tile-themes.ts`
5. SelectScene já renderiza automaticamente (loop dinâmico)

### Script auxiliar: `scripts/extract-pmd-tiles.mjs`
- Lê tileset PNG + JSON de config
- Extrai tiles específicos por posição no grid
- Mapeia para os 9 slots do sistema (grassLight, grassDark, etc.)

### Arquivos:
- `scripts/extract-pmd-tiles.mjs` (novo)
- `public/assets/tiles/{crystal,magma,sky,dark}/` — 4 × 10 arquivos
- `src/data/tile-themes.ts` — 4 novos TileTheme entries
- `src/scenes/BootScene.ts` — adicionar 4 temas ao loop de tiles

---

## Fase 6 — Novos Ataques de Tipo Genérico

### Attack types com novos subtipos:

Os `attacks{tps}/` genéricos por tipo servem para QUALQUER ataque daquele tipo. Vários tipos ainda não têm sprites no jogo:

| Tipo | Subtipo | Status | Ação |
|------|---------|--------|------|
| FAIRY | hit, melee, range | Inexistente | Adicionar para Jigglypuff futuro |
| FIGHTING | hit, melee, range | Parcial (só melee/directional) | Adicionar hit + range |
| ELECTRIC | hit, melee, range | Inexistente | Adicionar para Abra/futuro |
| STEEL | hit, melee, range | Inexistente | Adicionar para futuro |
| ICE | cell, hit, melee, range | Parcial (só range + frost-breath) | Adicionar hit + melee + cell |

### Fluxo:
1. Montar spritesheets dos subtipos faltantes
2. Carregar no BootScene
3. Disponíveis para futuros ataques de player/inimigo

---

## Ordem de Execução

```
Fase 0 (Tooling)           ← PRIMEIRO, pré-requisito para tudo
  ↓
Fase 1 (Boss Upgrades)     ← Maior impacto visual imediato
  ↓
Fase 2 (Status Effects)    ← Segundo maior impacto
  ↓
Fase 3 (Sons Reais)        ← Impacto sensorial
  ↓
Fase 4 (Environment)       ← Polish visual
  ↓
Fase 5 (Tilesets)           ← Variedade de mapas
  ↓
Fase 6 (Ataques Genéricos)  ← Preparação para futuro
```

## Verificação

Após cada fase:
1. `npx tsc --noEmit` — TypeScript compila limpo
2. `npm run dev` — Abrir no browser, verificar:
   - Fase 1: Lutar contra cada boss e verificar sprites novos
   - Fase 2: Levar dano de poison/stun e ver overlay animado
   - Fase 3: Clicar em botões e evoluir — ouvir .ogg
   - Fase 4: Ver portal no teleport do Gengar, chest com sprite real
   - Fase 5: Selecionar novos temas na SelectScene
   - Fase 6: Sprites carregam sem erro no console
3. Sem warnings no console do browser
4. Performance: FPS estável (60fps target)
