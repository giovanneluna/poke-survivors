# Bulbasaur Evolution Line — Design Document

## Section 0: Template Reference
- **Slots**: base=5, stage1=7, stage2=10
- **Attacks**: base=6, stage1=4, stage2=4+2prime = 16 unique
- **Evolutions**: 5 base→stage1 + 5 stage1→stage2 = 10
- **Total**: 26 attacks per starter
- **Passive**: Overgrow (poison DoT + toxic cloud on kill)
- **Identity**: Poison Controller — area denial, DoT, sustain

## Section 1: Passive — Overgrow

| Tier | Form | poisonChance | poisonDps | poisonDur | bonusDmgOnPoisoned | onKill |
|------|------|-----------|---------|---------|--------------------|--------|
| 1 | Bulbasaur | 8% | 3 | 3000ms | 0% | — |
| 2 | Ivysaur | 18% | 5 | 4000ms | 15% | — |
| 3 | Venusaur | 30% | 8 | 5000ms | 25% | Toxic Cloud |

**Toxic Cloud (tier 3)**: On kill of poisoned enemy, spawn poison cloud (radius 50, duration 2s) that poisons enemies entering it. Chain depth = 1 (same as Blaze/Torrent).

**Particle**: `poison-particle` (green, procedural)

## Section 2: Base Attacks (Bulbasaur) — 6 attacks

| # | Key | Name | Category | Element | Damage | Cooldown | Sprite Source | Description |
|---|-----|------|----------|---------|--------|----------|---------------|-------------|
| 1 | vineWhip | Vine Whip | cone | grass | 10 | 800 | VINE_WHIP (9f, 80x40) | Chicote direcional no inimigo mais proximo |
| 2 | razorLeaf | Razor Leaf | projectile | grass | 8 | 1000 | RAZOR_LEAF (8f, 32x32) | Folhas afiadas no inimigo mais proximo |
| 3 | leechSeed | Leech Seed | orbital | grass | 4 | — | LEECH_SEED (11f, 8x8) | Sementes orbitam, drenam HP ao tocar inimigos |
| 4 | tackle | Tackle | dash | normal | 12 | 2500 | GRASS/melee (5f, 64x64) | Dash curto na direcao do movimento |
| 5 | growl | Growl | aura | normal | 0 | — | atk-screech (ja carregado) | Aura que reduz dano de inimigos proximos -15% |
| 6 | poisonPowder | Poison Powder | aura | poison | 3/s | — | atk-smog (ja carregado) | Nuvem ao redor que envenena inimigos |

**Initial attack**: vineWhip

## Section 3: Stage1 Attacks (Ivysaur) — 4 attacks

| # | Key | Name | Category | Element | Damage | Cooldown | Sprite Source | Description |
|---|-----|------|----------|---------|--------|----------|---------------|-------------|
| 7 | sleepPowder | Sleep Powder | cone | grass | 0 | 5000 | COTTON_SPORE (33f, 48x48) | Cone de esporos: slow 80% por 2s |
| 8 | stunSpore | Stun Spore | area | grass | 5 | 6000 | STUN_SPORE (22f, 40x64) | Esporos em area: stun 1s |
| 9 | leafBlade | Leaf Blade | cone | grass | 25 | 1500 | LEAF_BLADE (26f, 64x64) | Lamina direcional, high dmg single target |
| 10 | sludgeBomb | Sludge Bomb | projectile | poison | 18 | 2000 | atk-poison-range + atk-sludge-wave (hit) | Projetil veneno que explode em AoE |

## Section 4: Stage2 Attacks (Venusaur) — 4 + 2 prime

| # | Key | Name | Category | Element | Damage | Cooldown | Sprite Source | Description |
|---|-----|------|----------|---------|--------|----------|---------------|-------------|
| 11 | solarBeam | Solar Beam | projectile | grass | 40 | 4000 | SOLAR_BEAM (4f, 32x128) | Beam que penetra todos inimigos em linha |
| 12 | petalDance | Petal Dance | area | grass | 8/hit | 3000 | PETAL_DANCE (54f, 64x88) | Petalas em espiral expandindo |
| 13 | gigaDrain | Giga Drain | area | grass | 15 | 3500 | LEECH_LIFE (20f, 80x72) | Drena HP de inimigos no raio, cura jogador |
| 14 | energyBall | Energy Ball | projectile | grass | 20 | 1800 | MAGICAL_LEAF (9f, 48x48) | Orbe que ricocheta entre inimigos (chain 3) |
| 15 | frenzyPlant | Frenzy Plant | area | grass | 50 | 8000 | INGRAIN (46f, 80x64) | PRIME: Raizes do chao, stun + dmg massivo |
| 16 | petalBlizzard | Petal Blizzard | area | grass | 12/hit | 5000 | PETAL_BLIZZARD (19f, 88x72) | PRIME: Tempestade de petalas fullscreen 3s |

## Section 5: Evolutions (10)

| # | Base Attack | Evolved Attack | Key | Req Form | Req Item | Sprite Source |
|---|-------------|---------------|-----|----------|----------|---------------|
| 1 | vineWhip | Power Whip | powerWhip | stage1 | miracleSeed | POWER_WHIP (6f, 80x48) |
| 2 | razorLeaf | Leaf Storm | leafStorm | stage1 | scopeLens | PETAL_BLIZZARD (19f, tint green) |
| 3 | leechSeed | Seed Bomb | seedBomb | stage1 | bigRoot | SEED_FLARE (31f, 96x80) |
| 4 | tackle | Body Slam | bodySlam2 | stage1 | silkScarf | WOOD_HAMMER (16f, 200x150) |
| 5 | poisonPowder | Toxic | toxic | stage1 | blackSludge | atk-acid-spray (ja carregado) |
| 6 | sleepPowder | Spore | spore | stage2 | leafStone | AROMATHERAPY (19f, 88x72) |
| 7 | leafBlade | Solar Blade | solarBlade | stage2 | leafStone | SOLAR_BLADE (6f, 64x32) |
| 8 | sludgeBomb | Sludge Wave | sludgeWave | stage2 | leafStone | atk-sludge-wave (ja carregado, scale 3) |
| 9 | solarBeam | Hyper Beam | hyperBeam | stage2 | leafStone | SOLAR_BEAM (reutiliza, scale 2x) |
| 10 | petalDance | Flora Burst | floraBurst | stage2 | leafStone | SEED_FLARE (31f, 96x80) |

## Section 6: Sprites to Download

### From pokemonAutoChess (15 new sheets to create)
| Key | Source | Frames | Dimensions |
|-----|--------|--------|------------|
| atk-vine-whip | VINE_WHIP | 9 | 80x40 |
| atk-razor-leaf | RAZOR_LEAF | 8 | 32x32 |
| atk-leech-seed | LEECH_SEED | 11 | 8x8 |
| atk-grass-melee | GRASS/melee | 5 | 64x64 |
| atk-cotton-spore | COTTON_SPORE | 33 | 48x48 |
| atk-stun-spore | STUN_SPORE | 22 | 40x64 |
| atk-leaf-blade | LEAF_BLADE | 26 | 64x64 |
| atk-solar-beam | SOLAR_BEAM | 4 | 32x128 |
| atk-petal-dance | PETAL_DANCE | 54 | 64x88 |
| atk-leech-life | LEECH_LIFE | 20 | 80x72 |
| atk-magical-leaf | MAGICAL_LEAF | 9 | 48x48 |
| atk-ingrain | INGRAIN | 46 | 80x64 |
| atk-petal-blizzard | PETAL_BLIZZARD | 19 | 88x72 |
| atk-power-whip | POWER_WHIP | 6 | 80x48 |
| atk-seed-flare | SEED_FLARE | 31 | 96x80 |
| atk-solar-blade | SOLAR_BLADE | 6 | 64x32 |
| atk-wood-hammer | WOOD_HAMMER | 16 | 200x150 |
| atk-aromatherapy | AROMATHERAPY | 19 | 88x72 |
| atk-grass-hit | GRASS/hit | 3 | 32x32 |
| atk-grass-cell | GRASS/cell | 20 | 48x48 |

### Already loaded in project (reuse)
- atk-smog, atk-screech, atk-sludge-wave, atk-poison-range, atk-acid-spray

## Section 7: Walk Sprites (PMDCollab)
| Pokemon | Dex | frameWidth | frameHeight | frameCount |
|---------|-----|-----------|-------------|------------|
| Bulbasaur | 0001 | 40 | 40 | 6 | (already exists)
| Ivysaur | 0002 | TBD (AnimData.xml) | TBD | TBD |
| Venusaur | 0003 | TBD (AnimData.xml) | TBD | TBD |

## Section 8: Files to Create/Modify

### New files (18)
- `src/data/pokemon/bulbasaur-line.ts`
- `src/attacks/VineWhip.ts`
- `src/attacks/RazorLeaf.ts`
- `src/attacks/LeechSeed.ts`
- `src/attacks/PoisonPowder.ts` (aura version for Bulbasaur)
- `src/attacks/SleepPowder.ts`
- `src/attacks/StunSpore.ts`
- `src/attacks/LeafBlade.ts`
- `src/attacks/SludgeBomb.ts`
- `src/attacks/SolarBeam.ts`
- `src/attacks/PetalDance.ts`
- `src/attacks/GigaDrain.ts`
- `src/attacks/EnergyBall.ts`
- `src/attacks/FrenzyPlant.ts`
- `src/attacks/PetalBlizzard.ts`
- `src/attacks/PowerWhip.ts`
- `src/attacks/LeafStorm.ts`
- `src/attacks/SeedBomb.ts`
- `src/attacks/Toxic.ts`
- `src/attacks/Spore.ts`
- `src/attacks/SolarBlade.ts`
- `src/attacks/SludgeWave2.ts`
- `src/attacks/HyperBeam.ts`
- `src/attacks/FloraBurst.ts`

### Modified files
- `src/types.ts` — add 26 attack types
- `src/data/attacks/attack-registry.ts` — add 26 entries
- `src/data/attacks/categories.ts` — add 26 categories
- `src/data/attacks/evolutions.ts` — add 10 evolutions
- `src/scenes/BootScene.ts` — load sprites, animations, walk sprites
- `src/systems/AttackFactory.ts` — add 26 factory entries
- `src/systems/UpgradeSystem.ts` — add Bulbasaur pools
- `src/systems/PassiveSystem.ts` — add Overgrow
- `src/scenes/GameScene.ts` — add Bulbasaur starter
- `src/scenes/SelectScene.ts` — add Bulbasaur option
- `src/scenes/UIScene.ts` — add grass color theme
- `src/scenes/ShowcaseScene.ts` — add Bulbasaur tab
