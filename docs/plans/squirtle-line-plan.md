# Plano Completo: Linha do Squirtle (Squirtle → Wartortle → Blastoise)

> Segundo starter jogável do Poké World Survivors
> **Segue o TEMPLATE PADRÃO de 3 evoluções** (estabelecido pelo Charmander)
> **Design brainstormado**: Artilheiro Ágil → Controle de Área

---

## 0. TEMPLATE PADRÃO — Pokémon com 3 Evoluções

### 0.1. Distribuição de Slots (obrigatório)

| Forma | Level | Attack Slots | Passive Slots | Passive Tier |
|-------|-------|-------------|---------------|--------------|
| Base  | 1     | 4           | 4             | 1            |
| Stage1| 16    | 5           | 5             | 2            |
| Stage2| 36    | 6           | 6             | 3            |

### 0.2. Distribuição de Ataques (obrigatório)

| Forma   | Qtd Aprendida | minForm    |
|---------|--------------|------------|
| Base    | **6**        | `'base'`   |
| Stage1  | **4**        | `'stage1'` |
| Stage2  | **4 + 2 prime** | `'stage2'` |
| **Total** | **16 únicos** | |

### 0.3. Distribuição de Evoluções (obrigatório)

| Tier   | Base de Evolução                               | Req Form   | Qtd |
|--------|------------------------------------------------|-----------|-----|
| Stage1 | 5 ataques do **base** (aura nunca evolui)      | `'stage1'`| 5   |
| Stage2 | 4 ataques do **stage1** + 1 do **stage2**      | `'stage2'`| 5   |
| **Total** | | | **10 evoluções** |

### 0.4. Categorias — FLEXÍVEIS por starter

As categorias (projectile, cone, orbital, aura, dash, area) NÃO precisam espelhar outro starter.
Cada linha deve ter sua **identidade de gameplay própria**.

| Starter     | Identidade               | Base               | Stage1          | Stage2             |
|-------------|--------------------------|--------------------|-----------------|--------------------|
| Charmander  | Brigueiro melee/cone     | 1proj,2cone,1orb,1aura,1dash | 4 cone  | 1proj,1dash,4area  |
| **Squirtle**| **Artilheiro → Controle**| **2proj,1cone,1orb,1aura,1dash** | **1proj,2cone,1area** | **2proj,0dash,4area** |
| Bulbasaur   | (futuro)                 | (definir)          | (definir)       | (definir)          |

---

## 1. SPRITES DE WALK (PMDCollab)

| Pokémon   | Dex  | frameWidth | frameHeight | frameCount | Status |
|-----------|------|------------|-------------|------------|--------|
| Squirtle  | 0007 | 32         | 32          | 4          | ✅ já existe |
| Wartortle | 0008 | 32         | 40          | 4          | BAIXAR |
| Blastoise | 0009 | 32         | 40          | 4          | BAIXAR |

```bash
curl -o public/assets/pokemon/wartortle-walk.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0008/Walk-Anim.png"
curl -o public/assets/pokemon/blastoise-walk.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0009/Walk-Anim.png"
curl -o public/assets/artwork/wartortle.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/8.png"
curl -o public/assets/artwork/blastoise.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png"
```

---

## 2. SPRITES DE ATAQUES (pokemonAutoChess)

| # | Sprite | Source | Frames | Usado por |
|---|--------|--------|--------|-----------|
| 1 | `water-pulse-sheet.png` | `abilities{tps}/WATER_PULSE` | 22 | Water Pulse, Scald |
| 2 | `aqua-jet-sheet.png` | `abilities{tps}/AQUA_JET` | 20 | Aqua Jet, Waterfall |
| 3 | `hydro-pump-sheet.png` | `abilities{tps}/HYDRO_PUMP` | 20 | Hydro Pump, Origin Pulse, Hydro Cannon |
| 4 | `surf-sheet.png` | `abilities{tps}/SURF` | 4 | Surf |
| 5 | `liquidation-sheet.png` | `abilities{tps}/LIQUIDATION` | 18 | Liquidation, Aqua Tail, Crabhammer |
| 6 | `water-range-sheet.png` | `attacks{tps}/WATER/range` | 19 | Water Gun, Bubble, Muddy Water |
| 7 | `water-hit-sheet.png` | `attacks{tps}/WATER/hit` | 4 | Impacto genérico |
| 8 | `rapid-spin-sheet.png` | `abilities{tps}/RAPID_SPIN` | 11 | Rapid Spin, Gyro Ball |
| 9 | `ice-range-sheet.png` | `attacks{tps}/ICE/range` | ~19 | Ice Beam, Blizzard |

**Reutilizados do projeto:** `bite-sheet.png` (12f, boss Raticate)

**Procedurais (generateTexture):** Withdraw (escudo azul), Tackle (investida), Flash Cannon (metallic burst), Whirlpool (vórtice), Water Spout (geyser), Body Slam, Shell Smash, water-particle, ice-particle

---

## 3. PASSIVA INNATA: TORRENT

| Tier | Forma | Efeito |
|------|-------|--------|
| 1 | Squirtle | **Wet**: 5% chance, slow 20%, 3s |
| 2 | Wartortle | **Wet**: 10% chance, slow 30%, 3s, +15% dano em Wet |
| 3 | Blastoise | **Wet**: 15% chance, slow 40%, 4s, +25% dano em Wet, splash AoE on kill |

---

## 4. ÁRVORE DE ATAQUES

### 4.1. Squirtle — Base (6 ataques, 4 slots)

| # | Ataque | Cat. | Elem. | Dano | CD | Descrição |
|---|--------|------|-------|------|----|-----------|
| 1 | **Water Gun** | projectile | water | 10 | 1200ms | Jato de água no inimigo mais próximo |
| 2 | **Bubble** | projectile | water | 7 | 800ms | Bolhas lentas multi-shot com slow (Wet) |
| 3 | **Tackle** | cone | normal | 8 | 600ms | Investida rápida na direção do movimento |
| 4 | **Rapid Spin** | orbital | normal | 7 | 400ms | Gira na carapaça, zona de dano circular |
| 5 | **Withdraw** | aura | water | 0 | 0ms | Carapaça reduz dano recebido em 15% |
| 6 | **Aqua Jet** | dash | water | 14 | 3000ms | Dash aquático, +speed temporário |

### 4.2. Wartortle — Stage1 (+4 ataques, 5 slots)

| # | Ataque | Cat. | Elem. | Dano | CD | Descrição |
|---|--------|------|-------|------|----|-----------|
| 1 | **Water Pulse** | projectile | water | 15 | 1800ms | Pulso de água com chance de confusão |
| 2 | **Hydro Pump** | cone | water | 22 | 2800ms | Jato direcional devastador |
| 3 | **Aqua Tail** | cone | water | 18 | 800ms | Cauda aquática com crit chance |
| 4 | **Whirlpool** | area | water | 12 | 4000ms | Vórtice de água que prende inimigos |

### 4.3. Blastoise — Stage2 (+4 + 2 prime, 6 slots)

| # | Ataque | Cat. | Elem. | Dano | CD | Descrição |
|---|--------|------|-------|------|----|-----------|
| 1 | **Ice Beam** | projectile | ice | 20 | 1400ms | Raio de gelo que congela |
| 2 | **Flash Cannon** | projectile | normal | 25 | 1600ms | Tiro dos canhões, piercing |
| 3 | **Surf** | area | water | 12 | 6000ms | Onda 360° que empurra |
| 4 | **Liquidation** | area | water | 35 | 8000ms | Golpe aquático 360°, reduz defesa |
| P1 | **Rain Dance** | area | water | 40 | 5000ms | Chuva contínua de dano |
| P2 | **Hydro Cannon** | area | water | 60 | 10000ms | Canhões devastadores ultimate |

### 4.4. Resumo Visual

```
SQUIRTLE (base, 6 atk, 4 slots):
├── Water Gun    [proj/water]    ──→ Scald (evo S1)
├── Bubble       [proj/water]    ──→ Bubble Beam (evo S1)
├── Tackle       [cone/normal]   ──→ Body Slam (evo S1)
├── Rapid Spin   [orbital/normal]──→ Gyro Ball (evo S1)
├── Withdraw     [aura/water]    (sem evolução)
└── Aqua Jet     [dash/water]    ──→ Waterfall (evo S1)

WARTORTLE (stage1, +4 atk, 5 slots):
├── Water Pulse  [proj/water]    ──→ Muddy Water (evo S2)
├── Hydro Pump   [cone/water]    ──→ Origin Pulse (evo S2)
├── Aqua Tail    [cone/water]    ──→ Crabhammer (evo S2)
└── Whirlpool    [area/water]    ──→ Water Spout (evo S2, area→proj!)

BLASTOISE (stage2, +4+2 atk, 6 slots):
├── Ice Beam     [proj/ice]      ──→ Blizzard (evo S2)
├── Flash Cannon [proj/normal]   (sem evolução)
├── Surf         [area/water]    (sem evolução)
├── Liquidation  [area/water]    (sem evolução)
├── Rain Dance   [area/water]  ★ PRIME
└── Hydro Cannon [area/water]  ★ PRIME
```

---

## 5. EVOLUÇÕES DE ARMA (10 total)

### 5.1. Tier Stage1 — 5 evoluções de ataques BASE

| # | Base → Evolução | Cat. | Item | Efeito |
|---|----------------|------|------|--------|
| 1 | Water Gun → **Scald** | proj→proj | Mystic Water | Vapor AoE ao impactar, chance de burn |
| 2 | Bubble → **Bubble Beam** | proj→proj | Wide Lens | Rajada rápida com slow garantido |
| 3 | Tackle → **Body Slam** | cone→cone | Razor Claw | Multi-slam 360°, paralisia |
| 4 | Rapid Spin → **Gyro Ball** | orb→orb | Focus Band | Orbes metálicas, mais dano em inimigo lento |
| 5 | Aqua Jet → **Waterfall** | dash→dash | Quick Claw | Dash longo, cascata + flinch |

### 5.2. Tier Stage2 — 4 evoluções stage1 + 1 stage2

| # | Base → Evolução | Cat. | Item | Efeito |
|---|----------------|------|------|--------|
| 1 | Hydro Pump → **Origin Pulse** | cone→cone | Choice Specs | Beam nuclear que perfura tudo |
| 2 | Water Pulse → **Muddy Water** | proj→proj | Scope Lens | Projéteis pesados, reduz precisão |
| 3 | Aqua Tail → **Crabhammer** | cone→cone | Mystic Water | Garras aquáticas, 50% crit |
| 4 | Whirlpool → **Water Spout** | area→**proj** | Shell Bell | Vórtice canalizado em jatos devastadores |
| 5 | Ice Beam → **Blizzard** | proj→proj | Never-Melt Ice | Tempestade de gelo homing |

---

## 6. ITENS

### Novos (4)
| Item | Efeito | Download |
|------|--------|----------|
| Mystic Water | +10% water dmg/nível | `sprites/items/mystic-water.png` |
| Focus Band | +HP quando low HP | `sprites/items/focus-band.png` |
| Shell Bell | Heal on hit | `sprites/items/shell-bell.png` |
| Never-Melt Ice | +10% ice dmg/nível | `sprites/items/never-melt-ice.png` |
| Water Stone | Ícone evolução arma | `sprites/items/water-stone.png` |

### Reutilizados
Wide Lens, Razor Claw, Quick Claw, Choice Specs, Scope Lens

---

## 7. TYPES.TS — Novos tipos

```ts
ElementType += 'water' | 'ice'
AttackType += 'waterGun' | 'bubble' | 'tackle' | 'rapidSpin' | 'withdraw' | 'aquaJet'
           | 'waterPulse' | 'hydroPump' | 'aquaTail' | 'whirlpool'
           | 'iceBeam' | 'flashCannon' | 'surf' | 'liquidation' | 'rainDance' | 'hydroCannon'
           | 'scald' | 'bubbleBeam' | 'bodySlam' | 'gyroBall' | 'waterfall'
           | 'originPulse' | 'muddyWater' | 'crabhammer' | 'waterSpout' | 'blizzard'
HeldItemType += 'mysticWater' | 'focusBand' | 'shellBell' | 'neverMeltIce'
PokemonFormConfig += torrentTier?: 1 | 2 | 3
```

---

## 8. ARQUIVOS A CRIAR (27)

| # | Arquivo | Clone de | Cat. |
|---|--------|---------|------|
| 1 | `src/data/pokemon/squirtle-line.ts` | `charmander-line.ts` | data |
| 2 | `src/attacks/WaterGun.ts` | `Ember.ts` | projectile |
| 3 | `src/attacks/Bubble.ts` | `Ember.ts` | projectile (multi-shot slow) |
| 4 | `src/attacks/Tackle.ts` | `Scratch.ts` | cone |
| 5 | `src/attacks/RapidSpin.ts` | `FireSpin.ts` | orbital |
| 6 | `src/attacks/Withdraw.ts` | `Smokescreen.ts` | aura |
| 7 | `src/attacks/AquaJet.ts` | `FlameCharge.ts` | dash |
| 8 | `src/attacks/WaterPulse.ts` | `Ember.ts` | projectile (confuse) |
| 9 | `src/attacks/HydroPump.ts` | `Flamethrower.ts` | cone |
| 10 | `src/attacks/AquaTail.ts` | `Slash.ts` | cone |
| 11 | `src/attacks/Whirlpool.ts` | `Hurricane.ts` | area (trap) |
| 12 | `src/attacks/IceBeam.ts` | `Ember.ts` | projectile (freeze) |
| 13 | `src/attacks/FlashCannon.ts` | `Ember.ts` | projectile (pierce) |
| 14 | `src/attacks/Surf.ts` | `Hurricane.ts` | area |
| 15 | `src/attacks/Liquidation.ts` | `Outrage.ts` | area |
| 16 | `src/attacks/RainDance.ts` | `HeatWave.ts` | area prime |
| 17 | `src/attacks/HydroCannon.ts` | `DracoMeteor.ts` | area prime |
| 18 | `src/attacks/Scald.ts` | `Inferno.ts` | projectile evo |
| 19 | `src/attacks/BubbleBeam.ts` | `Inferno.ts` | projectile evo |
| 20 | `src/attacks/BodySlam.ts` | `FurySwipes.ts` | cone evo |
| 21 | `src/attacks/GyroBall.ts` | `FireBlast.ts` | orbital evo |
| 22 | `src/attacks/Waterfall.ts` | `FlareRush.ts` | dash evo |
| 23 | `src/attacks/OriginPulse.ts` | `BlastBurn.ts` | cone evo |
| 24 | `src/attacks/MuddyWater.ts` | `DragonPulse.ts` | projectile evo |
| 25 | `src/attacks/Crabhammer.ts` | `NightSlash.ts` | cone evo |
| 26 | `src/attacks/WaterSpout.ts` | `AerialAce.ts` | projectile evo |
| 27 | `src/attacks/Blizzard.ts` | `AerialAce.ts` | projectile evo |

---

## 9. MAPEAMENTO 1:1 COM CHARMANDER

### Ataques

| # | Charmander | Cat. | Squirtle | Cat. | Forma |
|---|-----------|------|----------|------|-------|
| 1 | Ember | proj | Water Gun | proj | base |
| 2 | Scratch | cone | Tackle | cone | base |
| 3 | Fire Spin | orb | Rapid Spin | orb | base |
| 4 | Smokescreen | aura | Withdraw | aura | base |
| 5 | Fire Fang | cone | **Bubble** | **proj** | base |
| 6 | Flame Charge | dash | Aqua Jet | dash | base |
| 7 | Dragon Breath | cone | **Water Pulse** | **proj** | stage1 |
| 8 | Slash | cone | Aqua Tail | cone | stage1 |
| 9 | Flamethrower | cone | Hydro Pump | cone | stage1 |
| 10 | Dragon Claw | cone | **Whirlpool** | **area** | stage1 |
| 11 | Air Slash | proj | Ice Beam | proj | stage2 |
| 12 | Flare Blitz | dash | **Flash Cannon** | **proj** | stage2 |
| 13 | Hurricane | area | Surf | area | stage2 |
| 14 | Outrage | area | Liquidation | area | stage2 |
| 15 | Heat Wave | area | Rain Dance | area | prime |
| 16 | Draco Meteor | area | Hydro Cannon | area | prime |

**Negrito** = categoria diferente do Charmander

### Evoluções

| # | Charmander | Squirtle | Tier |
|---|-----------|----------|------|
| 1 | Ember → Inferno | Water Gun → Scald | S1 |
| 2 | Fire Spin → Fire Blast | Rapid Spin → Gyro Ball | S1 |
| 3 | Scratch → Fury Swipes | Tackle → Body Slam | S1 |
| 4 | Fire Fang → Blaze Kick | Bubble → Bubble Beam | S1 |
| 5 | Flame Charge → Flare Rush | Aqua Jet → Waterfall | S1 |
| 6 | Flamethrower → Blast Burn | Hydro Pump → Origin Pulse | S2 |
| 7 | Dragon Breath → Dragon Pulse | Water Pulse → Muddy Water | S2 |
| 8 | Slash → Night Slash | Aqua Tail → Crabhammer | S2 |
| 9 | Dragon Claw → Dragon Rush | Whirlpool → Water Spout | S2 |
| 10 | Air Slash → Aerial Ace | Ice Beam → Blizzard | S2 |

### Passiva + Item

| Componente | Charmander | Squirtle |
|-----------|-----------|----------|
| Passiva | Blaze (burn DoT) | Torrent (wet slow) |
| Held Item | Charcoal (+fire) | Mystic Water (+water) |
| Tipo secundário | Dragon/Flying | Ice |
| Ícone evolução | Fire Stone | Water Stone |

---

## 10. NOTAS

- **fireId fix**: Aplicar em WaterGun.ts, Scald.ts e todo projétil com pool + delayedCall
- **Bubble como projectile**: Diferente de orbital — bolhas voam até o inimigo (lentas, multi-shot, aplicam Wet)
- **Flash Cannon sem Steel type**: Tipado como 'normal' para evitar adicionar novo ElementType
- **Whirlpool early area**: Diferencial do Squirtle — acesso a area no stage1 (Charmander só tem no stage2)
- **Blastoise sem dash**: Fortaleza que atira. Aqua Jet (base) é o único dash — Charizard tem Flare Blitz, Blastoise não precisa
- **Water Spout (area→proj)**: Única mudança de categoria nas evoluções. Whirlpool (vórtice descentralizado) se canaliza em jatos concentrados dos canhões
