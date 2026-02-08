# Plano Completo: Linha do Squirtle (Squirtle → Wartortle → Blastoise)

> Segundo starter jogável do Poké World Survivors
> **Segue o TEMPLATE PADRÃO de 3 evoluções** (estabelecido pelo Charmander)

---

## 0. TEMPLATE PADRÃO — Pokémon com 3 Evoluções

Este template é o **padrão obrigatório** para qualquer Pokémon com 3 estágios evolutivos.
Estabelecido pela linha do Charmander e replicado 1:1 na linha do Squirtle.

### 0.1. Distribuição de Slots

| Forma | Level | Attack Slots | Passive Slots | Passive Tier |
|-------|-------|-------------|---------------|--------------|
| Base  | 1     | 4           | 4             | 1            |
| Stage1| 16    | 5           | 5             | 2            |
| Stage2| 36    | 6           | 6             | 3            |

### 0.2. Distribuição de Ataques

| Forma   | Ataques Aprendidos | minForm  | Categorias Típicas |
|---------|-------------------|----------|-------------------|
| Base    | **6 ataques**     | `'base'` | 1 projectile, 2 cone, 1 orbital, 1 aura, 1 dash |
| Stage1  | **4 ataques**     | `'stage1'`| 4 cone (foco mid-range) |
| Stage2  | **4 + 2 prime**   | `'stage2'`| 1 projectile, 1 dash, 4 area (foco endgame AoE) |
| **Total** | **16 ataques únicos** | | |

### 0.3. Distribuição de Evoluções de Arma

| Tier    | Base de Evolução         | Req Form  | Qtd |
|---------|--------------------------|-----------|-----|
| Stage1  | 5 ataques do **base**    | `'stage1'`| 5   |
| Stage2  | 4 ataques do **stage1** + 1 do **stage2** | `'stage2'`| 5   |
| **Total** | | | **10 evoluções** |

### 0.4. Contagem Final

| Tipo               | Quantidade |
|--------------------|-----------|
| Ataques aprendidos | 16        |
| Ataques evoluídos  | 10        |
| **Total único**    | **26**    |

### 0.5. Referência Cruzada: Charmander (implementado)

```
Base (6):     ember(proj) scratch(cone) fireSpin(orb) smokescreen(aura) fireFang(cone) flameCharge(dash)
Stage1 (4):   dragonBreath(cone) slash(cone) flamethrower(cone) dragonClaw(cone)
Stage2 (4+2): airSlash(proj) flareBlitz(dash) hurricane(area) outrage(area) + heatWave(area) dracoMeteor(area)

Evo S1 (5):   ember→inferno | fireSpin→fireBlast | scratch→furySwipes | fireFang→blazeKick | flameCharge→flareRush
Evo S2 (5):   flamethrower→blastBurn | dragonBreath→dragonPulse | slash→nightSlash | dragonClaw→dragonRush | airSlash→aerialAce
```

---

## 1. SPRITES DE WALK (PMDCollab)

### 1.1. Downloads necessários

| Pokémon   | Dex  | AnimData (obrigatório) | frameWidth | frameHeight | frameCount | Arquivo Local |
|-----------|------|------------------------|------------|-------------|------------|---------------|
| Squirtle  | 0007 | ✅ já existe            | 32         | 32          | 4          | `squirtle-walk.png` (já baixado) |
| Wartortle | 0008 | ✅ verificado           | 32         | 40          | 4          | `wartortle-walk.png` (BAIXAR) |
| Blastoise | 0009 | ✅ verificado           | 32         | 40          | 4          | `blastoise-walk.png` (BAIXAR) |

**Comandos:**
```bash
# Wartortle
curl -o public/assets/pokemon/wartortle-walk.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0008/Walk-Anim.png"

# Blastoise
curl -o public/assets/pokemon/blastoise-walk.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0009/Walk-Anim.png"

# Artwork oficial (Title Screen / evolução)
curl -o public/assets/artwork/wartortle.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/8.png"
curl -o public/assets/artwork/blastoise.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png"
```

### 1.2. Registro em STARTER_SPRITES (`src/data/sprites/starters.ts`)
```ts
wartortle:  { key: 'wartortle-walk',  path: 'assets/pokemon/wartortle-walk.png',  frameWidth: 32, frameHeight: 40, frameCount: 4, directions: 8 },
blastoise:  { key: 'blastoise-walk',  path: 'assets/pokemon/blastoise-walk.png',  frameWidth: 32, frameHeight: 40, frameCount: 4, directions: 8 },
```

---

## 2. SPRITES DE ATAQUES (pokemonAutoChess)

### 2.1. Spritesheets a baixar e montar

| # | Ataque | Source Folder | Frames | Uso no Jogo | Spritesheet Local |
|---|--------|--------------|--------|-------------|-------------------|
| 1 | Water Pulse | `abilities{tps}/WATER_PULSE` | 22 | Water Pulse (cone), Scald (evo) | `water-pulse-sheet.png` |
| 2 | Aqua Jet | `abilities{tps}/AQUA_JET` | 20 | Aqua Jet (dash), Waterfall (evo) | `aqua-jet-sheet.png` |
| 3 | Hydro Pump | `abilities{tps}/HYDRO_PUMP` | 20 | Hydro Pump (cone), Origin Pulse (evo), Hydro Cannon (prime) | `hydro-pump-sheet.png` |
| 4 | Surf | `abilities{tps}/SURF` | 4 | Surf (area) | `surf-sheet.png` |
| 5 | Liquidation | `abilities{tps}/LIQUIDATION` | 18 | Liquidation (area), Aqua Tail (cone), Crabhammer (evo) | `liquidation-sheet.png` |
| 6 | Water Range | `attacks{tps}/WATER/range` | 19 | Water Gun (projectile), Bubble (orbital), Muddy Water (evo) | `water-range-sheet.png` |
| 7 | Water Hit | `attacks{tps}/WATER/hit` | 4 | Impacto genérico de água | `water-hit-sheet.png` |
| 8 | Rapid Spin | `abilities{tps}/RAPID_SPIN` | 11 | Rapid Spin (cone) | `rapid-spin-sheet.png` |
| 9 | Ice Range | `attacks{tps}/ICE/range` | ~19 | Ice Beam (projectile), Blizzard (evo) | `ice-range-sheet.png` |

**Já existente no projeto (reutilizar):**
| Ataque | Arquivo | Frames | Uso |
|--------|---------|--------|-----|
| Bite | `bite-sheet.png` | 12 | Bite (cone), Crunch (evo) |

### 2.2. Script de download + montagem

Para cada ataque, baixar frames individuais e montar spritesheet horizontal com `sharp`:

```bash
# Exemplo para WATER_PULSE (22 frames):
mkdir -p /tmp/water-pulse
for i in $(seq 0 21); do
  f=$(printf "%03d" $i)
  curl -o "/tmp/water-pulse/${f}.png" \
    "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/main/app/public/src/assets/abilities%7Btps%7D/WATER_PULSE/${f}.png"
done
# Montar com sharp (script Node.js) → public/assets/attacks/water-pulse-sheet.png

# Repetir para: AQUA_JET (20), HYDRO_PUMP (20), SURF (4), LIQUIDATION (18),
#               RAPID_SPIN (11), WATER/range (19), WATER/hit (4), ICE/range (~19)
```

---

## 3. PASSIVA INNATA: TORRENT (análogo ao Blaze)

### 3.1. Mecânica do Torrent
O Blaze do Charmander dá burn (DoT de fogo). O Torrent deve ser tematicamente diferente:

| Tier | Forma | Efeito |
|------|-------|--------|
| 1 | Squirtle | **Wet**: 5% chance de aplicar "Wet" nos inimigos (reduz speed em 20% por 3s) |
| 2 | Wartortle | **Wet**: 10% chance, slow 30% por 3s, +15% dano em inimigos "Wet" |
| 3 | Blastoise | **Wet**: 15% chance, slow 40% por 4s, +25% dano em "Wet", inimigo Wet morre → splash AoE |

### 3.2. Implementação: `src/data/pokemon/squirtle-line.ts`
```ts
export const TORRENT_TIERS = {
  1: { wetChance: 0.05, slowPercent: 0.20, wetDuration: 3000, bonusDmgOnWet: 0,    splashOnKill: false },
  2: { wetChance: 0.10, slowPercent: 0.30, wetDuration: 3000, bonusDmgOnWet: 0.15, splashOnKill: false },
  3: { wetChance: 0.15, slowPercent: 0.40, wetDuration: 4000, bonusDmgOnWet: 0.25, splashOnKill: true },
} as const;

export const SQUIRTLE_FORMS = [
  { form: 'base',   name: 'Squirtle',   sprite: SPRITES.squirtle,   level: 1,  maxAttackSlots: 4, maxPassiveSlots: 4, torrentTier: 1 },
  { form: 'stage1', name: 'Wartortle',  sprite: SPRITES.wartortle,  level: 16, maxAttackSlots: 5, maxPassiveSlots: 5, torrentTier: 2 },
  { form: 'stage2', name: 'Blastoise',  sprite: SPRITES.blastoise,  level: 36, maxAttackSlots: 6, maxPassiveSlots: 6, torrentTier: 3 },
] as const;
```

---

## 4. ÁRVORE DE ATAQUES DO SQUIRTLE (Espelho do Charmander)

### 4.1. Squirtle — Base (6 ataques, minForm `'base'`)

| # | Ataque | ≈ Charmander | Cat. | Elem. | Dano | CD | Descrição | Sprite |
|---|--------|-------------|------|-------|------|----|-----------|--------|
| 1 | **Water Gun** | Ember | projectile | water | 10 | 1200ms | Jato de água no inimigo mais próximo | `water-range-sheet` |
| 2 | **Tackle** | Scratch | cone | normal | 8 | 600ms | Investida rápida na direção do movimento | procedural |
| 3 | **Bubble** | Fire Spin | orbital | water | 7 | 400ms | Bolhas orbitam ao redor do jogador | `water-range-sheet` |
| 4 | **Withdraw** | Smokescreen | aura | water | 0 | 0ms | Carapaça reduz dano recebido em 15% | procedural (escudo azul) |
| 5 | **Bite** | Fire Fang | cone | normal | 12 | 1000ms | Mordida com chance de flinch (stun curto) | `bite-sheet` (reuso) |
| 6 | **Aqua Jet** | Flame Charge | dash | water | 14 | 3000ms | Dash aquático, +speed temporário | `aqua-jet-sheet` |

### 4.2. Wartortle — Stage1 (4 ataques, minForm `'stage1'`)

| # | Ataque | ≈ Charmander | Cat. | Elem. | Dano | CD | Descrição | Sprite |
|---|--------|-------------|------|-------|------|----|-----------|--------|
| 1 | **Water Pulse** | Dragon Breath | cone | water | 15 | 1800ms | Pulso de água frontal com chance de confusão | `water-pulse-sheet` |
| 2 | **Aqua Tail** | Slash | cone | water | 18 | 800ms | Cauda aquática com alta chance de crítico | `liquidation-sheet` |
| 3 | **Hydro Pump** | Flamethrower | cone | water | 22 | 2800ms | Jato de água direcional devastador | `hydro-pump-sheet` |
| 4 | **Rapid Spin** | Dragon Claw | cone | normal | 16 | 1200ms | Giro na carapaça com multi-hit | `rapid-spin-sheet` |

### 4.3. Blastoise — Stage2 (4 + 2 prime, minForm `'stage2'`)

| # | Ataque | ≈ Charmander | Cat. | Elem. | Dano | CD | Descrição | Sprite |
|---|--------|-------------|------|-------|------|----|-----------|--------|
| 1 | **Ice Beam** | Air Slash | projectile | ice | 20 | 1400ms | Raio de gelo que congela inimigos | `ice-range-sheet` |
| 2 | **Skull Bash** | Flare Blitz | dash | normal | 45 | 4000ms | Cabeçada devastadora com recoil | procedural |
| 3 | **Surf** | Hurricane | area | water | 12 | 6000ms | Onda 360° que empurra inimigos | `surf-sheet` |
| 4 | **Liquidation** | Outrage | area | water | 35 | 8000ms | Golpe aquático 360° que reduz defesa | `liquidation-sheet` |
| P1 | **Rain Dance** | Heat Wave | area | water | 40 | 5000ms | Chuva contínua que causa dano em área 360° | procedural (gotas) |
| P2 | **Hydro Cannon** | Draco Meteor | area | water | 60 | 10000ms | Canhões devastadores — ataque ultimate | `hydro-pump-sheet` (escala 2x) |

### 4.4. Resumo da Árvore

```
SQUIRTLE (base, 6 ataques, 4 slots):
├── Water Gun    [projectile/water]  ──→ Scald (evo S1)
├── Tackle       [cone/normal]       ──→ Body Slam (evo S1)
├── Bubble       [orbital/water]     ──→ Bubble Beam (evo S1)
├── Withdraw     [aura/water]        (sem evolução)
├── Bite         [cone/normal]       ──→ Crunch (evo S1)
└── Aqua Jet     [dash/water]        ──→ Waterfall (evo S1)

WARTORTLE (stage1, +4 ataques, 5 slots):
├── Water Pulse  [cone/water]        ──→ Muddy Water (evo S2)
├── Aqua Tail    [cone/water]        ──→ Crabhammer (evo S2)
├── Hydro Pump   [cone/water]        ──→ Origin Pulse (evo S2)
└── Rapid Spin   [cone/normal]       ──→ Shell Smash (evo S2)

BLASTOISE (stage2, +4+2 ataques, 6 slots):
├── Ice Beam     [projectile/ice]    ──→ Blizzard (evo S2)
├── Skull Bash   [dash/normal]       (sem evolução)
├── Surf         [area/water]        (sem evolução)
├── Liquidation  [area/water]        (sem evolução)
├── Rain Dance   [area/water]  PRIME (sem evolução)
└── Hydro Cannon [area/water]  PRIME (sem evolução)
```

### 4.5. Registro em `attack-registry.ts`

```ts
// ── Squirtle base ──
waterGun:     { key: 'waterGun',     name: 'Water Gun',     description: 'Jato de água no inimigo mais próximo',      baseDamage: 10, baseCooldown: 1200, element: 'water',  maxLevel: 8, minForm: 'base' },
tackle:       { key: 'tackle',       name: 'Tackle',        description: 'Investida rápida na direção do movimento',   baseDamage: 8,  baseCooldown: 600,  element: 'normal', maxLevel: 8, minForm: 'base' },
bubble:       { key: 'bubble',       name: 'Bubble',        description: 'Bolhas orbitam ao redor do jogador',         baseDamage: 7,  baseCooldown: 400,  element: 'water',  maxLevel: 8, minForm: 'base' },
withdraw:     { key: 'withdraw',     name: 'Withdraw',      description: 'Carapaça reduz dano recebido em 15%',        baseDamage: 0,  baseCooldown: 0,    element: 'water',  maxLevel: 8, minForm: 'base' },
bite:         { key: 'bite',         name: 'Bite',          description: 'Mordida com chance de flinch (stun curto)',   baseDamage: 12, baseCooldown: 1000, element: 'normal', maxLevel: 8, minForm: 'base' },
aquaJet:      { key: 'aquaJet',      name: 'Aqua Jet',      description: 'Dash aquático, +speed temporário',           baseDamage: 14, baseCooldown: 3000, element: 'water',  maxLevel: 8, minForm: 'base' },
// ── Wartortle ──
waterPulse:   { key: 'waterPulse',   name: 'Water Pulse',   description: 'Pulso de água frontal com chance de confusão', baseDamage: 15, baseCooldown: 1800, element: 'water',  maxLevel: 8, minForm: 'stage1' },
aquaTail:     { key: 'aquaTail',     name: 'Aqua Tail',     description: 'Cauda aquática com alta chance de crítico',   baseDamage: 18, baseCooldown: 800,  element: 'water',  maxLevel: 8, minForm: 'stage1' },
hydroPump:    { key: 'hydroPump',    name: 'Hydro Pump',    description: 'Jato de água direcional devastador',          baseDamage: 22, baseCooldown: 2800, element: 'water',  maxLevel: 8, minForm: 'stage1' },
rapidSpin:    { key: 'rapidSpin',    name: 'Rapid Spin',    description: 'Giro na carapaça com multi-hit',              baseDamage: 16, baseCooldown: 1200, element: 'normal', maxLevel: 8, minForm: 'stage1' },
// ── Blastoise ──
iceBeam:      { key: 'iceBeam',      name: 'Ice Beam',      description: 'Raio de gelo que congela inimigos',           baseDamage: 20, baseCooldown: 1400, element: 'ice',    maxLevel: 8, minForm: 'stage2' },
skullBash:    { key: 'skullBash',    name: 'Skull Bash',    description: 'Cabeçada devastadora com recoil',             baseDamage: 45, baseCooldown: 4000, element: 'normal', maxLevel: 8, minForm: 'stage2' },
surf:         { key: 'surf',         name: 'Surf',          description: 'Onda 360° que empurra inimigos',              baseDamage: 12, baseCooldown: 6000, element: 'water',  maxLevel: 8, minForm: 'stage2' },
liquidation:  { key: 'liquidation',  name: 'Liquidation',   description: 'Golpe aquático 360° que reduz defesa',        baseDamage: 35, baseCooldown: 8000, element: 'water',  maxLevel: 8, minForm: 'stage2' },
// ── Evoluções de arma (Squirtle) ──
scald:        { key: 'scald',        name: 'Scald',         description: 'Jatos que explodem em vapor AoE',             baseDamage: 18, baseCooldown: 900,  element: 'water',  maxLevel: 8, minForm: 'stage1' },
bubbleBeam:   { key: 'bubbleBeam',   name: 'Bubble Beam',   description: 'Orbes maiores com slow garantido',            baseDamage: 12, baseCooldown: 300,  element: 'water',  maxLevel: 8, minForm: 'stage1' },
bodySlam:     { key: 'bodySlam',     name: 'Body Slam',     description: 'Multi-slam 360° com paralisia',               baseDamage: 12, baseCooldown: 500,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
crunch:       { key: 'crunch',       name: 'Crunch',        description: 'Mordida que reduz defesa em AoE',             baseDamage: 20, baseCooldown: 800,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
waterfall:    { key: 'waterfall',    name: 'Waterfall',     description: 'Dash longo com rastro de água e flinch',       baseDamage: 22, baseCooldown: 2000, element: 'water',  maxLevel: 8, minForm: 'stage1' },
originPulse:  { key: 'originPulse',  name: 'Origin Pulse',  description: 'Beam aquático que perfura tudo',              baseDamage: 50, baseCooldown: 3500, element: 'water',  maxLevel: 8, minForm: 'stage2' },
muddyWater:   { key: 'muddyWater',   name: 'Muddy Water',   description: 'Projéteis que reduzem precisão',              baseDamage: 30, baseCooldown: 1500, element: 'water',  maxLevel: 8, minForm: 'stage2' },
crabhammer:   { key: 'crabhammer',   name: 'Crabhammer',    description: 'Garras aquáticas, 50% crit chance',           baseDamage: 25, baseCooldown: 700,  element: 'water',  maxLevel: 8, minForm: 'stage2' },
shellSmash:   { key: 'shellSmash',   name: 'Shell Smash',   description: 'Giro explosivo + buff de stats',              baseDamage: 35, baseCooldown: 2500, element: 'normal', maxLevel: 8, minForm: 'stage2' },
blizzard:     { key: 'blizzard',     name: 'Blizzard',      description: 'Rajadas de gelo homing que congelam',          baseDamage: 25, baseCooldown: 1200, element: 'ice',    maxLevel: 8, minForm: 'stage2' },
// ── Prime (Squirtle) ──
rainDance:    { key: 'rainDance',    name: 'Rain Dance',    description: 'Chuva contínua que causa dano em área 360°',  baseDamage: 40, baseCooldown: 5000, element: 'water',  maxLevel: 8, minForm: 'stage2' },
hydroCannon:  { key: 'hydroCannon',  name: 'Hydro Cannon',  description: 'Canhões devastadores — ataque ultimate',      baseDamage: 60, baseCooldown: 10000, element: 'water', maxLevel: 8, minForm: 'stage2' },
```

### 4.6. Registro em `categories.ts`

```ts
// Squirtle base
waterGun: 'projectile',
tackle: 'cone',
bubble: 'orbital',
withdraw: 'aura',
bite: 'cone',
aquaJet: 'dash',
// Wartortle
waterPulse: 'cone',
aquaTail: 'cone',
hydroPump: 'cone',
rapidSpin: 'cone',
// Blastoise
iceBeam: 'projectile',
skullBash: 'dash',
surf: 'area',
liquidation: 'area',
// Evoluções de arma (Squirtle)
scald: 'projectile',        // waterGun(proj) → scald(proj) — mesma cat.
bubbleBeam: 'orbital',      // bubble(orb) → bubbleBeam(orb) — mesma cat.
bodySlam: 'cone',           // tackle(cone) → bodySlam(cone) — mesma cat.
crunch: 'cone',             // bite(cone) → crunch(cone) — mesma cat.
waterfall: 'dash',          // aquaJet(dash) → waterfall(dash) — mesma cat.
originPulse: 'cone',        // hydroPump(cone) → originPulse(cone) — mesma cat.
muddyWater: 'projectile',   // waterPulse(cone) → muddyWater(proj) — MUDA (≈dragonBreath→dragonPulse)
crabhammer: 'cone',         // aquaTail(cone) → crabhammer(cone) — mesma cat.
shellSmash: 'dash',          // rapidSpin(cone) → shellSmash(dash) — MUDA (≈dragonClaw→dragonRush)
blizzard: 'projectile',     // iceBeam(proj) → blizzard(proj) — mesma cat.
// Prime (Squirtle)
rainDance: 'area',
hydroCannon: 'area',
```

---

## 5. EVOLUÇÕES DE ARMA (10 total)

### 5.1. Tier Stage1 — Evoluções de ataques BASE (5)

| # | Base → Evolução | ≈ Charmander | Req Item | Cat. | Descrição |
|---|----------------|-------------|----------|------|-----------|
| 1 | waterGun → **Scald** | ember → inferno | Mystic Water | proj→proj | Jatos que explodem em vapor AoE |
| 2 | bubble → **Bubble Beam** | fireSpin → fireBlast | Wide Lens | orb→orb | Orbes maiores com slow garantido |
| 3 | tackle → **Body Slam** | scratch → furySwipes | Razor Claw | cone→cone | Multi-slam 360° com paralisia |
| 4 | bite → **Crunch** | fireFang → blazeKick | Mystic Water | cone→cone | Mordida que reduz defesa em AoE |
| 5 | aquaJet → **Waterfall** | flameCharge → flareRush | Quick Claw | dash→dash | Dash longo com rastro de água |

### 5.2. Tier Stage2 — Evoluções de ataques STAGE1 + 1 STAGE2 (5)

| # | Base → Evolução | ≈ Charmander | Req Item | Cat. | Descrição |
|---|----------------|-------------|----------|------|-----------|
| 1 | hydroPump → **Origin Pulse** | flamethrower → blastBurn | Choice Specs | cone→cone | Beam aquático que perfura tudo |
| 2 | waterPulse → **Muddy Water** | dragonBreath → dragonPulse | Scope Lens | cone→proj | Projéteis que reduzem precisão |
| 3 | aquaTail → **Crabhammer** | slash → nightSlash | Mystic Water | cone→cone | Garras aquáticas, 50% crit |
| 4 | rapidSpin → **Shell Smash** | dragonClaw → dragonRush | Focus Band | cone→dash | Giro explosivo + buff stats |
| 5 | iceBeam → **Blizzard** | airSlash → aerialAce | Never-Melt Ice | proj→proj | Rajadas de gelo homing |

### 5.3. Registro em `evolutions.ts`

```ts
// ── Wartortle tier (5 evoluções de ataques base) ──
{ baseAttack: 'waterGun',  requiredLevel: 8, requiredItem: 'mysticWater', requiredForm: 'stage1', evolvedAttack: 'scald',      name: 'Scald',       description: 'Water Gun evolui! Vapor explosivo!',    icon: 'item-water-stone', color: 0x4488ff },
{ baseAttack: 'bubble',    requiredLevel: 8, requiredItem: 'wideLens',    requiredForm: 'stage1', evolvedAttack: 'bubbleBeam', name: 'Bubble Beam', description: 'Bubble evolui! Orbes com slow!',        icon: 'item-water-stone', color: 0x66aaff },
{ baseAttack: 'tackle',    requiredLevel: 8, requiredItem: 'razorClaw',   requiredForm: 'stage1', evolvedAttack: 'bodySlam',   name: 'Body Slam',   description: 'Tackle evolui! Multi-slam 360°!',      icon: 'item-water-stone', color: 0xcccccc },
{ baseAttack: 'bite',      requiredLevel: 8, requiredItem: 'mysticWater', requiredForm: 'stage1', evolvedAttack: 'crunch',     name: 'Crunch',      description: 'Bite evolui! Mordida devastadora!',     icon: 'item-water-stone', color: 0x444466 },
{ baseAttack: 'aquaJet',   requiredLevel: 8, requiredItem: 'quickClaw',   requiredForm: 'stage1', evolvedAttack: 'waterfall',  name: 'Waterfall',   description: 'Aqua Jet evolui! Dash de água!',        icon: 'item-water-stone', color: 0x4488ff },
// ── Blastoise tier (4 evoluções de ataques stage1 + 1 de stage2) ──
{ baseAttack: 'hydroPump',  requiredLevel: 8, requiredItem: 'choiceSpecs',  requiredForm: 'stage2', evolvedAttack: 'originPulse', name: 'Origin Pulse', description: 'Hydro Pump evolui! Beam total!',      icon: 'item-water-stone', color: 0x2266ff },
{ baseAttack: 'waterPulse', requiredLevel: 8, requiredItem: 'scopeLens',    requiredForm: 'stage2', evolvedAttack: 'muddyWater',  name: 'Muddy Water',  description: 'Water Pulse evolui! Projéteis sujos!', icon: 'item-water-stone', color: 0x886644 },
{ baseAttack: 'aquaTail',   requiredLevel: 8, requiredItem: 'mysticWater',  requiredForm: 'stage2', evolvedAttack: 'crabhammer',  name: 'Crabhammer',   description: 'Aqua Tail evolui! 50% crítico!',       icon: 'item-water-stone', color: 0x4488ff },
{ baseAttack: 'rapidSpin',  requiredLevel: 8, requiredItem: 'focusBand',    requiredForm: 'stage2', evolvedAttack: 'shellSmash',  name: 'Shell Smash',  description: 'Rapid Spin evolui! Giro + buff!',      icon: 'item-water-stone', color: 0xcccccc },
{ baseAttack: 'iceBeam',    requiredLevel: 8, requiredItem: 'neverMeltIce', requiredForm: 'stage2', evolvedAttack: 'blizzard',    name: 'Blizzard',     description: 'Ice Beam evolui! Gelo homing!',        icon: 'item-water-stone', color: 0x88ccff },
```

---

## 6. NOVOS ITENS

### 6.1. Held Item: Mystic Water (principal do Squirtle)

```ts
// Baixar sprite:
// curl -o public/assets/items/mystic-water.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/mystic-water.png"

mysticWater: {
  key: 'mysticWater',
  name: 'Mystic Water',
  description: '+10% dano de água por nível',
  icon: 'item-mystic-water',
  color: 0x4488ff,
  effect: 'waterDmg',
  maxLevel: 5,
}
```

### 6.2. Itens de Evolução (novos)

```bash
# Focus Band (para Rapid Spin → Shell Smash)
curl -o public/assets/items/focus-band.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png"

# Never-Melt Ice (para Ice Beam → Blizzard)
curl -o public/assets/items/never-melt-ice.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/never-melt-ice.png"

# Water Stone (ícone de evolução de arma — equivalente ao Fire Stone)
curl -o public/assets/items/water-stone.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png"
```

**Itens já existentes reutilizados:** Wide Lens, Razor Claw, Quick Claw, Choice Specs, Scope Lens

---

## 7. ALTERAÇÕES EM TYPES (`src/types.ts`)

### 7.1. Novos tipos necessários

```ts
// ElementType — adicionar 'water' e 'ice'
export type ElementType = 'fire' | 'water' | 'ice' | 'normal' | 'dragon' | 'flying';

// AttackType — adicionar ataques do Squirtle (26 novos)
export type AttackType =
  // ... (existentes do Charmander) ...
  // Squirtle base (6)
  | 'waterGun' | 'tackle' | 'bubble' | 'withdraw' | 'bite' | 'aquaJet'
  // Wartortle (4)
  | 'waterPulse' | 'aquaTail' | 'hydroPump' | 'rapidSpin'
  // Blastoise (4 + 2 prime)
  | 'iceBeam' | 'skullBash' | 'surf' | 'liquidation' | 'rainDance' | 'hydroCannon'
  // Evoluções S1 (5)
  | 'scald' | 'bubbleBeam' | 'bodySlam' | 'crunch' | 'waterfall'
  // Evoluções S2 (5)
  | 'originPulse' | 'muddyWater' | 'crabhammer' | 'shellSmash' | 'blizzard';

// HeldItemType — adicionar novos
export type HeldItemType = ... | 'mysticWater' | 'focusBand' | 'neverMeltIce';

// PokemonFormConfig — tornar blazeTier opcional, adicionar torrentTier
export interface PokemonFormConfig {
  readonly form: PokemonForm;
  readonly name: string;
  readonly sprite: SpriteConfig;
  readonly level: number;
  readonly maxAttackSlots: number;
  readonly maxPassiveSlots: number;
  readonly blazeTier?: 1 | 2 | 3;
  readonly torrentTier?: 1 | 2 | 3;
}
```

---

## 8. ARQUIVOS A CRIAR (26 ataques + 1 data)

| # | Arquivo | ≈ Clone de | Descrição |
|---|--------|-----------|-----------|
| 1 | `src/data/pokemon/squirtle-line.ts` | `charmander-line.ts` | SQUIRTLE_FORMS + TORRENT_TIERS |
| **Base (6)** | | | |
| 2 | `src/attacks/WaterGun.ts` | `Ember.ts` | Projétil de água (projectile) |
| 3 | `src/attacks/Tackle.ts` | `Scratch.ts` | Investida melee (cone) |
| 4 | `src/attacks/Bubble.ts` | `FireSpin.ts` | Bolhas orbitais (orbital) |
| 5 | `src/attacks/Withdraw.ts` | `Smokescreen.ts` | Aura defensiva (aura) |
| 6 | `src/attacks/Bite.ts` | `FireFang.ts` | Mordida melee (cone) |
| 7 | `src/attacks/AquaJet.ts` | `FlameCharge.ts` | Dash aquático (dash) |
| **Stage1 (4)** | | | |
| 8 | `src/attacks/WaterPulse.ts` | `DragonBreath.ts` | Pulso frontal (cone) |
| 9 | `src/attacks/AquaTail.ts` | `Slash.ts` | Cauda crítica (cone) |
| 10 | `src/attacks/HydroPump.ts` | `Flamethrower.ts` | Jato direcional (cone) |
| 11 | `src/attacks/RapidSpin.ts` | `DragonClaw.ts` | Giro multi-hit (cone) |
| **Stage2 (4+2)** | | | |
| 12 | `src/attacks/IceBeam.ts` | `AirSlash.ts` | Raio de gelo (projectile) |
| 13 | `src/attacks/SkullBash.ts` | `FlareBlitz.ts` | Cabeçada pesada (dash) |
| 14 | `src/attacks/Surf.ts` | `Hurricane.ts` | Onda 360° (area) |
| 15 | `src/attacks/Liquidation.ts` | `Outrage.ts` | Golpe aquático (area) |
| 16 | `src/attacks/RainDance.ts` | `HeatWave.ts` | Chuva de dano (area, prime) |
| 17 | `src/attacks/HydroCannon.ts` | `DracoMeteor.ts` | Canhões ultimate (area, prime) |
| **Evoluções S1 (5)** | | | |
| 18 | `src/attacks/Scald.ts` | `Inferno.ts` | Water Gun evoluído (projectile) |
| 19 | `src/attacks/BubbleBeam.ts` | `FireBlast.ts` | Bubble evoluído (orbital) |
| 20 | `src/attacks/BodySlam.ts` | `FurySwipes.ts` | Tackle evoluído (cone) |
| 21 | `src/attacks/Crunch.ts` | `BlazeKick.ts` | Bite evoluído (cone) |
| 22 | `src/attacks/Waterfall.ts` | `FlareRush.ts` | Aqua Jet evoluído (dash) |
| **Evoluções S2 (5)** | | | |
| 23 | `src/attacks/OriginPulse.ts` | `BlastBurn.ts` | Hydro Pump evoluído (cone) |
| 24 | `src/attacks/MuddyWater.ts` | `DragonPulse.ts` | Water Pulse evoluído (projectile) |
| 25 | `src/attacks/Crabhammer.ts` | `NightSlash.ts` | Aqua Tail evoluído (cone) |
| 26 | `src/attacks/ShellSmash.ts` | `DragonRush.ts` | Rapid Spin evoluído (dash) |
| 27 | `src/attacks/Blizzard.ts` | `AerialAce.ts` | Ice Beam evoluído (projectile) |

---

## 9. ARQUIVOS A MODIFICAR

| # | Arquivo | Mudanças |
|---|--------|----------|
| 1 | `src/types.ts` | Adicionar `water`/`ice` em ElementType, 26 novos AttackTypes, novos HeldItemTypes, torrentTier em PokemonFormConfig |
| 2 | `src/data/sprites/starters.ts` | Adicionar wartortle + blastoise sprites |
| 3 | `src/data/sprites/index.ts` | Re-exportar novos sprites |
| 4 | `src/data/pokemon/index.ts` | Exportar SQUIRTLE_FORMS, TORRENT_TIERS, linkar forms no STARTERS |
| 5 | `src/data/attacks/attack-registry.ts` | Registrar 26 novos ataques (seção 4.5) |
| 6 | `src/data/attacks/evolutions.ts` | Registrar 10 novas evoluções (seção 5.3) |
| 7 | `src/data/attacks/categories.ts` | Categorizar 26 novos ataques (seção 4.6) |
| 8 | `src/data/items/held-items.ts` | Adicionar Mystic Water, Focus Band, Never-Melt Ice |
| 9 | `src/data/items/upgrade-defs.ts` | ~45 novas opções (new/upgrade/evolve) |
| 10 | `src/scenes/BootScene.ts` | Carregar 9 spritesheets + 2 artworks + 3 items + criar animações |
| 11 | `src/scenes/GameScene.ts` | Suportar Squirtle (seleção dinâmica passiva/ataques, Torrent) |
| 12 | `src/entities/Player.ts` | Torrent effect (wet/slow), evolução genérica |
| 13 | `src/scenes/SelectScene.ts` | Desbloquear card do Squirtle |
| 14 | `src/scenes/UIScene.ts` | Nomes de forma dinâmicos |
| 15 | `src/scenes/ShowcaseScene.ts` | Seção dedicada ao Squirtle |

---

## 10. ORDEM DE EXECUÇÃO (Fases)

### FASE 1: Assets (~30 min)
1. Baixar sprites de walk (Wartortle, Blastoise)
2. Baixar artworks oficiais (wartortle.png, blastoise.png)
3. Baixar e montar **9 spritesheets** de ataques (water-pulse, aqua-jet, hydro-pump, surf, liquidation, water-range, water-hit, rapid-spin, ice-range)
4. Baixar sprites de itens (mystic-water, focus-band, never-melt-ice, water-stone)
5. Registrar em `starters.ts`, `BootScene.ts`

### FASE 2: Infraestrutura (~20 min)
1. Atualizar `types.ts` (ElementType, AttackType, HeldItemType, PokemonFormConfig)
2. Criar `squirtle-line.ts` (formas + Torrent tiers)
3. Atualizar `pokemon/index.ts`
4. Generalizar `Player.ts` para suportar qualquer starter (não hardcoded Charmander)
5. Generalizar `GameScene.ts` para starter selection dinâmica

### FASE 3: Ataques Base (~40 min — 6 arquivos)
1. WaterGun, Tackle, Bubble, Withdraw, Bite, AquaJet
2. Registrar no `attack-registry.ts` + `categories.ts`

### FASE 4: Ataques Wartortle + Blastoise (~30 min — 10 arquivos)
1. WaterPulse, AquaTail, HydroPump, RapidSpin (stage1)
2. IceBeam, SkullBash, Surf, Liquidation, RainDance, HydroCannon (stage2+prime)
3. Registrar no `attack-registry.ts` + `categories.ts`

### FASE 5: Evoluções de Arma (~30 min — 10 arquivos)
1. Scald, BubbleBeam, BodySlam, Crunch, Waterfall (tier S1)
2. OriginPulse, MuddyWater, Crabhammer, ShellSmash, Blizzard (tier S2)
3. Registrar no `evolutions.ts`

### FASE 6: Upgrade Defs + UI (~20 min)
1. ~45 novas opções de upgrade em `upgrade-defs.ts`
2. `GameScene.applyUpgrade()` — 26 novos cases
3. Collision setup para cada ataque
4. Mystic Water, Focus Band, Never-Melt Ice no `held-items.ts`

### FASE 7: Integração + Polish (~20 min)
1. SelectScene — desbloquear Squirtle
2. UIScene — nomes dinâmicos
3. ShowcaseScene — seção Squirtle
4. Testar fluxo completo: select → game → level up → evolução → endgame

---

## 11. MAPEAMENTO 1:1 COM CHARMANDER

### 11.1. Ataques

| # | Charmander | Cat. | → | Squirtle | Cat. | Forma |
|---|-----------|------|---|----------|------|-------|
| 1 | Ember | proj | → | Water Gun | proj | base |
| 2 | Scratch | cone | → | Tackle | cone | base |
| 3 | Fire Spin | orb | → | Bubble | orb | base |
| 4 | Smokescreen | aura | → | Withdraw | aura | base |
| 5 | Fire Fang | cone | → | Bite | cone | base |
| 6 | Flame Charge | dash | → | Aqua Jet | dash | base |
| 7 | Dragon Breath | cone | → | Water Pulse | cone | stage1 |
| 8 | Slash | cone | → | Aqua Tail | cone | stage1 |
| 9 | Flamethrower | cone | → | Hydro Pump | cone | stage1 |
| 10 | Dragon Claw | cone | → | Rapid Spin | cone | stage1 |
| 11 | Air Slash | proj | → | Ice Beam | proj | stage2 |
| 12 | Flare Blitz | dash | → | Skull Bash | dash | stage2 |
| 13 | Hurricane | area | → | Surf | area | stage2 |
| 14 | Outrage | area | → | Liquidation | area | stage2 |
| 15 | Heat Wave | area | → | Rain Dance | area | prime |
| 16 | Draco Meteor | area | → | Hydro Cannon | area | prime |

### 11.2. Evoluções

| # | Charmander | → | Squirtle | Tier |
|---|-----------|---|----------|------|
| 1 | Ember → Inferno | → | Water Gun → Scald | S1 |
| 2 | Fire Spin → Fire Blast | → | Bubble → Bubble Beam | S1 |
| 3 | Scratch → Fury Swipes | → | Tackle → Body Slam | S1 |
| 4 | Fire Fang → Blaze Kick | → | Bite → Crunch | S1 |
| 5 | Flame Charge → Flare Rush | → | Aqua Jet → Waterfall | S1 |
| 6 | Flamethrower → Blast Burn | → | Hydro Pump → Origin Pulse | S2 |
| 7 | Dragon Breath → Dragon Pulse | → | Water Pulse → Muddy Water | S2 |
| 8 | Slash → Night Slash | → | Aqua Tail → Crabhammer | S2 |
| 9 | Dragon Claw → Dragon Rush | → | Rapid Spin → Shell Smash | S2 |
| 10 | Air Slash → Aerial Ace | → | Ice Beam → Blizzard | S2 |

### 11.3. Passiva + Held Item

| Componente | Charmander | Squirtle |
|-----------|-----------|----------|
| Passiva | Blaze (burn DoT) | Torrent (wet slow) |
| Held Item principal | Charcoal (+fire dmg) | Mystic Water (+water dmg) |
| Tipo secundário | Dragon/Flying | Ice |
| Ícone de evolução | Fire Stone | Water Stone |

---

## 12. NOTAS IMPORTANTES

- **SFX**: Todos os SFX são procedurais (Web Audio API). Sons de água: ondas sinusoidais em frequências baixas (200-400Hz) + noise branco filtrado para simular splash.
- **Texturas procedurais**: Partículas de água (`water-particle`) e gelo (`ice-particle`) geradas no `BootScene.generateTextures()`.
- **Held item miniatura**: `held-mystic-water` gerada proceduralmente no BootScene.
- **Tint strategy**: Bite pode reutilizar `bite-sheet` (boss Raticate) com tint. Tackle pode usar Scratch com tint azul. Preferir sprites próprias quando disponível.
- **fireId fix**: Aplicar o padrão de `fireId` em `WaterGun.ts` e `Scald.ts` para evitar stale timer bug em projéteis pooled.
- **Withdraw como aura**: Diferente do Smokescreen (slow inimigos), Withdraw **reduz dano recebido**. Mesma mecânica (aura persistente), efeito diferente.
- **Shell Smash dash**: Na evolução Rapid Spin → Shell Smash, a categoria muda de cone para dash (espelho de Dragon Claw → Dragon Rush). O Blastoise quebra a carapaça e avança.
- **Rain Dance (prime)**: Diferente de Heat Wave (360° instantâneo), Rain Dance cria uma zona de chuva contínua. Implementar como area com ticks de dano.
