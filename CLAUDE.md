# Poké World Survivors

## Projeto
Vampire Survivors clone com tema Pokémon. Phaser 3.90 + TypeScript + Vite.

## Skills Obrigatórias
- Sempre usar a skill `/game-development` ao trabalhar neste projeto
- Para assets visuais, consultar o arquivo de memória `pokemon-resources.md`

## Ralph (Desenvolvimento Autônomo)
- **Criar PRD:** `/prd` → responder perguntas → salva em `tasks/prd-[nome].md`
- **Converter para Ralph:** `/ralph` → converte PRD para `scripts/ralph/prd.json`
- **Executar:** `npm run ralph` (10 iterações) ou `npm run ralph:20` (20 iterações)
- **In-session:** `/ralph-loop` para rodar dentro da sessão atual
- **Quality gate:** `npx tsc --noEmit` roda automaticamente em cada iteração
- **PRDs ficam em:** `tasks/prd-[feature-name].md`

## Arquitetura
- `BootScene` → carrega tudo → `TitleScene` → `SelectScene` → `GameScene` + `UIScene`
- Ataques implementam interface `Attack` (type, level, update, upgrade, destroy)
- Config centralizado em `src/config.ts`, tipos em `src/types.ts`
- Sprites separados: `src/data/sprites/starters.ts` (jogáveis) e `src/data/sprites/enemies.ts` (wild/boss)
- Inimigos organizados em `src/data/enemies/` com configs individuais + `phases/phase1.ts` (20 waves, 10 min)
- Bosses: `src/entities/Boss.ts` extends `Enemy` com ataques especiais (charge, fan, aoe-tremor, aoe-land)
- Sistema de poison por contato (Ekans) implementado no `Player.ts`
- Gacha box: drop de bosses → overlay UIScene → reward aleatório
- SFX procedural via Web Audio API (`src/audio/SoundManager.ts`)
- **Pool compartilhado `enemyProjectiles`**: Group Phaser (maxSize 60) reutilizado entre todos inimigos/bosses. `Group.get()` recicla sprites SEM trocar textura. **OBRIGATÓRIO**: chamar `setTexture(key)` + `body.reset(x,y)` + `play(animKey)` em todo local que obtém sprite do pool.

## Regras
- Não usar `any` - TypeScript strict
- Não usar assets externos que precisem de CORS proxy
- Itens e upgrades devem usar sprites de itens reais do Pokémon (PokeAPI), não emojis genéricos
- Manter consistência com o universo Pokémon: nomes de ataques, itens e mecânicas devem ser fiéis ao jogo original
- Texturas procedurais (`graphics.generateTexture()`) são usadas para tiles, XP gems, pickups e efeitos menores

---

## Fontes dos Assets

### 1. Sprites dos Pokémon (walk/idle) — PMDCollab/SpriteCollab
- **Repo:** https://github.com/PMDCollab/SpriteCollab
- **Site:** https://sprites.pmdcollab.org/
- **Formato:** Spritesheet PNG com 8 direções de walk, cada direção é uma row
- **URL direta:** `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{DEX_NUMBER}/Walk-Anim.png`
- **Dex numbers:** Bulbasaur=0001, Charmander=0004, Squirtle=0007, Pidgey=0016, Rattata=0019, Spearow=0021, Ekans=0023, Nidoking=0034, Jigglypuff=0039, Zubat=0041, Golbat=0042, Oddish=0043, Mankey=0056, Abra=0063, Machop=0066, Geodude=0074, Gastly=0092, Haunter=0093, Eevee=0133, Magikarp=0129, Snorlax=0143, Mew=0151
- **Pasta local:** `public/assets/pokemon/`
- **Arquivos:**
  - `charmander-walk.png` (32x32, 4 frames, 8 dirs)
  - `charmeleon-walk.png` (24x32, 4 frames, 8 dirs)
  - `charizard-walk.png` (40x48, 4 frames, 8 dirs)
  - `bulbasaur-walk.png` (40x40, 6 frames, 8 dirs)
  - `squirtle-walk.png` (32x32, 4 frames, 8 dirs)
  - `rattata-walk.png` (48x40, 7 frames, 8 dirs)
  - `pidgey-walk.png` (32x32, 5 frames, 8 dirs)
  - `zubat-walk.png` (32x56, 8 frames, 8 dirs)
  - `geodude-walk.png` (32x32, 4 frames, 8 dirs)
  - `gastly-walk.png` (48x64, 12 frames, 8 dirs)
  - `caterpie-walk.png` (32x32, 4 frames, 8 dirs)
  - `weedle-walk.png` (32x32, 4 frames, 8 dirs)
  - `spearow-walk.png` (32x40, 5 frames, 8 dirs)
  - `ekans-walk.png` (40x48, 6 frames, 8 dirs)
  - `oddish-walk.png` (24x40, 8 frames, 8 dirs)
  - `mankey-walk.png` (32x56, 8 frames, 8 dirs)
  - `haunter-walk.png` (32x56, 10 frames, 8 dirs)
  - `machop-walk.png` (24x32, 4 frames, 8 dirs)
  - `golbat-walk.png` (40x64, 8 frames, 8 dirs)
  - `raticate-walk.png` (40x48, 6 frames, 8 dirs)
  - `arbok-walk.png` (40x56, 6 frames, 8 dirs)
  - `nidoking-walk.png` (40x48, 4 frames, 8 dirs)
  - `snorlax-walk.png` (32x48, 4 frames, 8 dirs)
- **Como adicionar novo Pokémon:**
  1. Achar o dex number (ex: Pikachu = 0025)
  2. Baixar: `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0025/Walk-Anim.png`
  3. **OBRIGATÓRIO:** Baixar AnimData.xml: `curl "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{DEX}/AnimData.xml"` e usar FrameWidth/FrameHeight/Duration count da seção Walk (NÃO calcular manualmente pela imagem — os frames podem ter padding)
  4. Adicionar em `SPRITES` no `config.ts` e carregar no `BootScene`

### 2. Artwork Oficial (Title Screen) — PokeAPI
- **Repo:** https://github.com/PokeAPI/sprites
- **URL:** `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{ID}.png`
- **IDs:** Bulbasaur=1, Charmander=4, Squirtle=7, Pikachu=25, etc.
- **Pasta local:** `public/assets/artwork/`
- **Arquivos:** `charmander.png`, `squirtle.png`, `bulbasaur.png`
- **Como baixar novo:** `curl -o artwork/{nome}.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{ID}.png"`

### 3. Sprites de Itens (Upgrades/UI) — PokeAPI
- **URL:** `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/{nome-do-item}.png`
- **Tamanho:** ~30x30px (usar `setScale(2)` no Phaser)
- **Pasta local:** `public/assets/items/`
- **Arquivos e seus usos:**
  - `flame-orb.png` → ícone de "novo ataque de fogo" (newFireSpin, newFlamethrower)
  - `pp-up.png` → ícone de "upgrade de ataque" (upgradeEmber, upgradeFireSpin, upgradeFlame)
  - `leftovers.png` → ícone de "+HP máximo" (maxHpUp)
  - `quick-claw.png` → ícone de "+velocidade" (speedUp)
  - `magnet.png` → ícone de "+alcance de XP" (magnetUp)
  - `charcoal.png` → held item Charcoal (+fire dmg)
  - `wide-lens.png` → held item Wide Lens (+AoE)
  - `choice-specs.png` → held item Choice Specs (+SpAtk)
  - `fire-stone.png` → ícone de "evolução de ataque" (evolveInferno, evolveFireBlast, evolveBlastBurn)
- **Como baixar novo:** `curl -o items/{nome}.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/{nome}.png"`
- **Lista completa de itens:** https://pokeapi.co/api/v2/item/ (use o nome em kebab-case)
- **Alternativa HD (32x32):** https://github.com/msikma/pokesprite → `items/hold-item/{nome}.png`

### 4. Sprites de Ataques (Projéteis/Efeitos) — pokemonAutoChess
- **Repo:** https://github.com/keldaanCommunity/pokemonAutoChess
- **Abilities (ataques específicos):** `app/public/src/assets/abilities{tps}/{NOME_ATAQUE}/`
  - Cada ataque é uma pasta com frames individuais: `000.png`, `001.png`, `002.png`...
  - **URL:** `https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/main/app/public/src/assets/abilities%7Btps%7D/{NOME_ATAQUE}/{NNN}.png`
  - **ATENÇÃO:** Na URL, `{tps}` vira `%7Btps%7D` (encoding)
- **Attacks (efeitos genéricos por tipo):** `app/public/src/assets/attacks{tps}/{TIPO}/{subtipo}/`
  - Subtipos: `cell` (chão), `hit` (impacto), `melee` (corpo a corpo), `range` (projétil)
  - **URL:** `https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/main/app/public/src/assets/attacks%7Btps%7D/{TIPO}/{subtipo}/{NNN}.png`
- **Pasta local:** `public/assets/attacks/`
- **Spritesheets montadas (frames horizontais):**
  - `ember-sheet.png` — 9 frames, 26x26 (projétil do Ember/Inferno)
  - `fire-range-sheet.png` — 16 frames, 40x40 (orbes do Fire Spin/Fire Blast)
  - `fire-hit-sheet.png` — 4 frames, 32x32 (impacto de fogo)
  - `flamethrower-sheet.png` — 16 frames, 80x96 (coluna do Flamethrower)
  - `fire-blast-sheet.png` — 12 frames, 72x73 (estrela do Fire Blast)
  - `blast-burn-sheet.png` — 15 frames, 80x80 (explosão do Blast Burn)
  - `bite-sheet.png` — 12 frames, 32x48 (boss Raticate — Hyper Fang/BITE)
  - `venoshock-sheet.png` — 13 frames, 32x80 (VENOSHOCK genérico)
  - `thrash-sheet.png` — 7 frames, 48x32 (boss Nidoking — Thrash/THRASH)
  - `stomp-sheet.png` — 10 frames, 16x16 (boss Snorlax — Body Slam/STOMP)
  - `wave-splash-sheet.png` — 9 frames, 32x32 (Bubble — WAVE_SPLASH)
  - `sparkling-aria-sheet.png` — 44 frames, 64x64 (BubbleBeam — SPARKLING_ARIA)
  - `water-melee-sheet.png` — 8 frames, 56x56 (Scald — WATER/melee)
  - `origin-pulse-sheet.png` — 4 frames, 128x32 (WaterSpout — ORIGIN_PULSE)
  - `water-cell-sheet.png` — 7 frames, 64x32 (WATER/cell — disponível, não usado)
- **Pasta `poison-dark/`** (sprites de veneno e dark, prontas para uso):
  - `gunk-shot-sheet.png` — 45 frames, 32x32 (boss Arbok — Gunk Shot)
  - `cross-poison-sheet.png` — 6 frames, 32x32
  - `sludge-wave-sheet.png` — 8 frames, 32x32
  - `smog-sheet.png` — 9 frames, 50x50
  - `screech-sheet.png` — 7 frames, 32x32
  - `iron-tail-sheet.png` — 7 frames, 40x40
  - `acid-spray-sheet.png` — 32 frames, 80x80
  - `night-slash-sheet.png` — 15 frames, 56x64
  - `poison-hit-sheet.png` — 5 frames, 32x32
  - `poison-melee-sheet.png` — 11 frames, 56x64
  - `poison-range-sheet.png` — 4 frames, 16x16
  - `dark-hit-sheet.png` — 13 frames, 64x62
  - `dark-melee-sheet.png` — 7 frames, 64x64
  - `dark-range-sheet.png` — 6 frames, 32x32
- **Como adicionar novo ataque:**
  1. Achar o nome no repo (ex: `WATER_GUN`, `THUNDER_SHOCK`, `RAZOR_LEAF`)
  2. Baixar frames: `for i in $(seq 0 N); do f=$(printf "%03d" $i); curl -o "${f}.png" "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/main/app/public/src/assets/abilities%7Btps%7D/{NOME}/${f}.png"; done`
  3. Montar spritesheet horizontal com `sharp` (instalar temporariamente: `npm i -D sharp`)
  4. Carregar como spritesheet no `BootScene` e criar animação
- **340+ ataques disponíveis** incluindo: WATER_GUN, HYDRO_PUMP, THUNDER, THUNDERBOLT, RAZOR_LEAF, SOLAR_BEAM, ICE_BEAM, PSYCHIC, SHADOW_BALL, etc.

### 5. Texturas Procedurais (geradas em runtime)
Geradas no `BootScene.generateTextures()` — não precisam de arquivo externo:
- Tiles do mapa: `tile-grass-1`, `tile-grass-2`, `tile-flowers`, `tile-dirt`, `tile-rock`, `tile-water`, `tile-tree`
- Partículas: `fire-particle`
- XP: `xp-gem`
- Sombra: `shadow`
- Destrutíveis: `dest-tall-grass`, `dest-berry-bush`, `dest-rock`, `dest-chest`
- Pickups: `pickup-oran`, `pickup-magnet`, `pickup-candy`, `pickup-bomb`
- Held items (miniatura HUD): `held-charcoal`, `held-wide-lens`, `held-choice-specs`
- Boss drops: `gacha-box` (pokeball dourada 32x32)
- Shards (title screen): `shard-fire`, `shard-water`, `shard-grass`, `shard-gold`

### 6. Sites de Referência para Sprites
- **The Spriters Resource:** https://www.spriters-resource.com/ — Repositório enorme de sprites ripped de jogos oficiais. Buscar por "Pokémon" para encontrar sprites de qualquer geração, incluindo overworld, battle, menus, itens, etc.
- **PMDCollab Sprite Explorer:** https://sprites.pmdcollab.org/#/ — Interface visual para navegar TODAS as sprites do PMDCollab (Pokémon Mystery Dungeon). Permite buscar por nome/dex, ver animações (Walk, Idle, Attack, etc.), verificar formas alternativas (mega, shiny, gender), e baixar spritesheets. **Usar este site para descobrir se uma sprite existe ANTES de tentar baixar via URL.**

### 7. SFX (Procedural — sem arquivos)
Gerados via Web Audio API no `SoundManager` (`src/audio/SoundManager.ts`).
Sem arquivos de áudio — tudo é sintetizado em runtime com `OscillatorNode` + `GainNode`.
