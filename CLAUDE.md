# Poké World Survivors

## Projeto
Vampire Survivors clone com tema Pokémon. Phaser 3.90 + TypeScript + Vite.

## Skills Obrigatórias
- Sempre usar a skill `/game-development` ao trabalhar neste projeto
- Para assets visuais, consultar o arquivo de memória `pokemon-resources.md`

## Arquitetura
- `BootScene` → carrega tudo → `TitleScene` → `SelectScene` → `GameScene` + `UIScene`
- Ataques implementam interface `Attack` (type, level, update, upgrade, destroy)
- Config centralizado em `src/config.ts`, tipos em `src/types.ts`
- SFX procedural via Web Audio API (`src/audio/SoundManager.ts`)

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
- **Dex numbers:** Bulbasaur=0001, Charmander=0004, Squirtle=0007, Rattata=0019, Pidgey=0016, Zubat=0041, Geodude=0074, Gastly=0092
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
- Shards (title screen): `shard-fire`, `shard-water`, `shard-grass`, `shard-gold`

### 6. SFX (Procedural — sem arquivos)
Gerados via Web Audio API no `SoundManager` (`src/audio/SoundManager.ts`).
Sem arquivos de áudio — tudo é sintetizado em runtime com `OscillatorNode` + `GainNode`.
