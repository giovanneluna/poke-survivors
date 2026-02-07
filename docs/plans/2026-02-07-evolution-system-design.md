# Sistema de Evolucao, Ataques e Passivas — Poke World Survivors

> Design Document v2.0 — 2026-02-07 (Ralph Loop iteration 2 — sprites validados)
> Baseado na Pokedex oficial + mecanicas Vampire Survivors

---

## 1. VISAO GERAL

### Filosofia
O sistema combina 3 camadas de progressao:
1. **Evolucao do Pokemon** (Charmander -> Charmeleon -> Charizard) — Expande pool de ataques e slots
2. **Level up de armas** (Ember Lv1 -> Lv8 MAX) — Melhora stats gradualmente
3. **Evolucao de armas** (Ember + Charcoal + Charmeleon = Inferno) — Combina arma MAX + item + forma

### Slots por Forma
| Forma | Ataques | Passivas | Total |
|-------|---------|----------|-------|
| Charmander (Lv 1-15) | 4 | 4 | 8 |
| Charmeleon (Lv 16-35) | 5 | 5 | 10 |
| Charizard (Lv 36+) | 6 | 6 | 12 |

### Evolucao do Pokemon
- **Level 16**: Charmander -> Charmeleon (visual muda, +1 slot, novos ataques desbloqueiam)
- **Level 36**: Charmeleon -> Charizard (visual muda, +1 slot, ataques Dragon/Flying desbloqueiam)
- Baseado na Pokedex oficial (mesmos niveis dos jogos)

---

## 2. ARVORE DE ATAQUES — CHARMANDER LINE

### 2.1 Pool do CHARMANDER (7 ataques disponiveis, escolhe ate 4)

#### Ember (Fire) — Projectile
- **Categoria VS:** Magic Wand (single target, auto-aim)
- **Sprite:** `EMBER` (9 frames, 26x26)
- **Base Damage:** 10 | **Cooldown:** 1.2s
- **Comportamento:** Dispara bolas de fogo no inimigo mais proximo
- **Level Up:** +dmg, +projecteis, -cooldown
- **Max Level:** 8 (2 projecteis, 22 dmg, 0.8s CD)

#### Scratch (Normal) — Melee Slash
- **Categoria VS:** Knife (fast melee, direcional)
- **Sprite:** `SCRATCH` (pokemonAutoChess)
- **Base Damage:** 8 | **Cooldown:** 0.6s
- **Comportamento:** Garrada rapida na direcao do movimento, curto alcance, rapido
- **Level Up:** +dmg, +area, chance de crit
- **Max Level:** 8 (16 dmg, 150% area, 15% crit)

#### Fire Spin (Fire) — Orbital
- **Categoria VS:** King Bible (orbita o jogador)
- **Sprite:** `FIRE/range` (16 frames, 40x40)
- **Base Damage:** 7 | **Cooldown:** tick a cada 0.4s
- **Comportamento:** Orbes de fogo orbitam ao redor do player
- **Level Up:** +orbes, +dmg, +raio
- **Max Level:** 8 (5 orbes, 14 dmg, raio 90)

#### Smokescreen (Normal) — AoE Aura
- **Categoria VS:** Garlic (aura de repulsao)
- **Sprite:** `NORMAL/cell` (generico) ou particulas de fumaca
- **Base Damage:** 0 | **Cooldown:** constante
- **Comportamento:** Nuvem ao redor do player que causa slow (-30% speed) nos inimigos
- **Level Up:** +area, +slow%, +dano leve
- **Max Level:** 8 (area 120, -50% slow, 3 dmg/tick)

#### Dragon Breath (Dragon) — Beam
- **Categoria VS:** Fire Wand (beam direcional)
- **Sprite:** `DRAGON/range` (36 frames)
- **Base Damage:** 15 | **Cooldown:** 1.8s
- **Comportamento:** Sopro frontal na direcao do movimento, alcance medio, 15% chance stun (0.5s)
- **Level Up:** +dmg, +alcance, +stun%
- **Max Level:** 8 (30 dmg, range 140, 30% stun)

#### Fire Fang (Fire) — Melee Bite
- **Categoria VS:** Whip (melee com area)
- **Sprite:** `FIRE_FANG` (pokemonAutoChess)
- **Base Damage:** 12 | **Cooldown:** 1.0s
- **Comportamento:** Mordida na direcao do movimento, 10% chance de queimacao (3 dmg/s por 3s)
- **Level Up:** +dmg, +burn%, +burn dmg
- **Max Level:** 8 (24 dmg, 25% burn, 6 dmg/s)

#### Flame Charge (Fire) — Dash
- **Categoria VS:** Lightning Ring (dash + dano)
- **Sprite:** `FLAME_CHARGE` (pokemonAutoChess)
- **Base Damage:** 14 | **Cooldown:** 3.0s
- **Comportamento:** Dash curto na direcao do movimento, dano em linha, +15% speed por 3s
- **Level Up:** +dmg, +distance, -cooldown
- **Max Level:** 8 (28 dmg, dash 120px, 2.0s CD)

---

### 2.2 Pool do CHARMELEON (+3 novos, pool total 10, escolhe ate 5)

> Todos os ataques de Charmander continuam disponiveis.

#### Slash (Normal) — Wide Melee
- **Categoria VS:** Knife+ (melee amplo, high crit)
- **Sprite:** `SLASH` (pokemonAutoChess)
- **Base Damage:** 18 | **Cooldown:** 0.8s
- **Comportamento:** Garrada ampla (120 graus), 20% crit chance (2x dmg)
- **Level Up:** +dmg, +crit%, +area
- **Max Level:** 8 (36 dmg, 40% crit, 160 graus)

#### Flamethrower (Fire) — Cone Beam
- **Categoria VS:** Fire Wand+ (cone de fogo)
- **Sprite:** `FLAMETHROWER` (16 frames, 80x96)
- **Base Damage:** 22 | **Cooldown:** 2.8s
- **Comportamento:** Coluna de fogo direcional, cone de 50 graus, range 100
- **Level Up:** +dmg, +range, -cooldown, +cone
- **Max Level:** 8 (44 dmg, range 160, 1.8s CD, cone 70)

#### Dragon Claw (Dragon) — Multi-hit Melee
- **Categoria VS:** Whip+ (multi-golpe)
- **Sprite:** `DRAGON_CLAW` (pokemonAutoChess)
- **Base Damage:** 16 | **Cooldown:** 1.2s
- **Comportamento:** 2 golpes rapidos de garra, segundo golpe tem knockback
- **Level Up:** +dmg, +golpes, +knockback
- **Max Level:** 8 (32 dmg, 3 golpes, forte knockback)

---

### 2.3 Pool do CHARIZARD (+4 novos, pool total 14, escolhe ate 6)

> Todos os ataques anteriores continuam disponiveis.

#### Air Slash (Flying) — Boomerang Projectile
- **Categoria VS:** Axe (projectil que atravessa)
- **Sprite:** `AIR_SLASH` (pokemonAutoChess)
- **Base Damage:** 20 | **Cooldown:** 1.4s
- **Comportamento:** Lamina de ar que atravessa inimigos, 15% chance flinch (stun 0.3s)
- **Level Up:** +dmg, +projecteis, -cooldown
- **Max Level:** 8 (40 dmg, 3 laminas, 0.9s CD)

#### Flare Blitz (Fire) — Charge Attack
- **Categoria VS:** Clock Lancet (dash devastador)
- **Sprite:** `FIRE/melee` (8 frames) + particulas
- **Base Damage:** 45 | **Cooldown:** 4.0s
- **Comportamento:** Dash longo em chamas, dano massivo em linha, RECOIL: player toma 15% do dano causado
- **Level Up:** +dmg, -recoil%, -cooldown
- **Max Level:** 8 (90 dmg, 8% recoil, 2.5s CD)
- **NOTA:** Unico ataque com recoil, trade-off risk/reward

#### Hurricane (Flying) — Vortex AoE
- **Categoria VS:** La Borra (area que suga)
- **Sprite:** `HURRICANE` (pokemonAutoChess)
- **Base Damage:** 12/tick | **Cooldown:** 6.0s | **Duration:** 3s
- **Comportamento:** Cria tornado numa area que PUXA inimigos para o centro + dano continuo
- **Level Up:** +dmg, +area, +duration, -cooldown
- **Max Level:** 8 (24 dmg/tick, area 150, 5s dur, 4.0s CD)

#### Outrage (Dragon) — Berserk Mode
- **Categoria VS:** Runetracer (bouncing chaos)
- **Sprite:** `OUTRAGE` (pokemonAutoChess)
- **Base Damage:** 35 | **Cooldown:** 8.0s | **Duration:** 4s
- **Comportamento:** Modo berserk: ataque automatico em 360 graus por 4s, velocidade +50%, MAS apos o efeito, player fica confuso (controles invertidos por 2s)
- **Level Up:** +dmg, +duration, -confusion time
- **Max Level:** 8 (70 dmg, 6s dur, 0.5s confusion)
- **NOTA:** Ataque "ultimate", alto risco/recompensa

---

## 3. EVOLUCOES DE ARMA (Receitas)

### Mecanica
- Arma precisa estar no **nivel MAX (8)**
- Item passivo correspondente no inventario
- Forma minima do Pokemon atingida
- Ao abrir **bau de boss**, evolucao aparece como opcao obrigatoria
- Arma evoluida **substitui** a base (mesmo slot)
- Item passivo **permanece** no inventario

### Tabela de Evolucoes

| # | Arma Base | + Item | + Forma Min | = Arma Evoluida | Sprite | Efeito |
|---|-----------|--------|-------------|-----------------|--------|--------|
| 1 | Ember Lv8 | Charcoal | Charmeleon | **Inferno** | `EMBER` (maior) | Bolas explosivas com AoE splash |
| 2 | Fire Spin Lv8 | Wide Lens | Charmeleon | **Fire Blast** | `FIRE_BLAST` | Anel pulsante expandindo |
| 3 | Flamethrower Lv8 | Choice Specs | Charizard | **Blast Burn** | `BLAST_BURN` | Explosao nuclear direcional |
| 4 | Scratch Lv8 | Razor Claw | Charmeleon | **Fury Swipes** | `SLASH` x3 rapido | Multi-slash 360 graus |
| 5 | Dragon Breath Lv8 | Dragon Fang | Charizard | **Dragon Pulse** | `DRAGON_PULSE` | Beam massivo que perfura tudo |
| 6 | Fire Fang Lv8 | Charcoal | Charmeleon | **Blaze Kick** | `BLAZE_KICK` | Chute flamejante com AoE |
| 7 | Slash Lv8 | Scope Lens | Charizard | **Night Slash** | `NIGHT_SLASH` | Garrada sombria, 50% crit |
| 8 | Air Slash Lv8 | Sharp Beak | Charizard | **Aerial Ace** | `AERIAL_ACE` | Laminas homing, nunca erram |
| 9 | Flame Charge Lv8 | Quick Claw | Charmeleon | **Flare Rush** | `FLAME_CHARGE` + trail | Dash longo + rastro de fogo |
| 10 | Dragon Claw Lv8 | Dragon Fang | Charizard | **Dragon Rush** | `DRAGON_CLAW` (enhanced) | Carga draconica com stun AoE |

### Evolucoes PRIME (Ataques Especiais)
Ataques que **sempre aparecem como opcao** ao atingir os requisitos, mesmo com slots cheios.
O jogador DEVE escolher trocar um ataque existente.

| Requisito | Ataque Prime | Efeito |
|-----------|-------------|--------|
| Charizard + 2 ataques Fire MAX | **Heat Wave** | Onda de calor 360 graus, dano massivo |
| Charizard + Outrage Lv8 + Dragon Fang | **Draco Meteor** | Chuva de meteoros, dano apocaliptico |
| Charizard + Flare Blitz Lv8 + Air Slash Lv8 | **Blast Burn MAX** | Versao ultimate, tela inteira |

---

## 4. SISTEMA DE PASSIVAS

### 4.1 Items Passivos (Selecionaveis no level up)

| Item | Efeito | Max Level | Efeito Max |
|------|--------|-----------|------------|
| **Charcoal** | +Fire dmg % | 5 | +50% fire dmg |
| **Dragon Fang** | +Dragon dmg % | 5 | +50% dragon dmg |
| **Sharp Beak** | +Flying dmg % | 5 | +50% flying dmg |
| **Silk Scarf** | +Normal dmg % | 5 | +50% normal dmg |
| **Wide Lens** | +AoE area % | 5 | +50% area |
| **Choice Specs** | +Special Atk % | 5 | +40% all dmg |
| **Quick Claw** | +Speed % | 5 | +40% speed |
| **Leftovers** | HP regen/s | 5 | +3 HP/s |
| **Shell Bell** | Lifesteal % | 5 | 8% lifesteal |
| **Scope Lens** | +Crit % | 5 | +25% crit |
| **Razor Claw** | +Crit dmg % | 5 | +75% crit dmg |
| **Focus Band** | Sobreviver golpe fatal (CD) | 3 | CD 30s |
| **Metronome** | +dmg por hit consecutivo | 5 | +5% per hit, max +50% |

### 4.2 Passiva Innata do Pokemon (Automatica, escala com evolucao)

Cada Pokemon tem uma passiva unica que evolui com a forma:

#### Charmander Line: **"Blaze" (Labareda)**
| Forma | Efeito |
|-------|--------|
| Charmander | Ataques de fogo tem 5% chance de causar **queimacao** (2 dmg/s por 3s) |
| Charmeleon | Queimacao aumenta para 10% chance, 4 dmg/s por 3s. Inimigos queimando recebem +15% dano |
| Charizard | Queimacao 15% chance, 6 dmg/s por 4s. Inimigos queimando recebem +25% dano. Ao matar inimigo queimando, explode em AoE de fogo |

> **Design Note:** A passiva Blaze incentiva builds de fogo mas nao obriga. Ataques Dragon/Flying nao causam queimacao mas podem se beneficiar de inimigos ja queimando (+25% dmg em queimados).

#### Futuro — Squirtle Line: **"Torrent" (Torrente)**
| Forma | Efeito |
|-------|--------|
| Squirtle | Abaixo de 50% HP, ataques de agua fazem +20% dmg |
| Wartortle | Abaixo de 50% HP, +30% dmg agua e +10% speed |
| Blastoise | Abaixo de 50% HP, +50% dmg agua, +20% speed, escudo de agua absorve 1 hit a cada 10s |

#### Futuro — Bulbasaur Line: **"Overgrow" (Crescimento)**
| Forma | Efeito |
|-------|--------|
| Bulbasaur | A cada 30s, cura 5% HP max |
| Ivysaur | A cada 25s, cura 8% HP max + area de esporos que slow inimigos |
| Venusaur | A cada 20s, cura 12% HP max + esporos venenosos (dano continuo na area) |

---

## 5. SISTEMA DE EVOLUCAO DO POKEMON

### Mecanica
- Ao atingir o level, uma **cutscene rapida** mostra a evolucao
- Sprite do player muda (PMDCollab Charmeleon/Charizard)
- Passiva innata melhora automaticamente
- +1 slot de ataque e +1 slot de passiva
- Novos ataques aparecem na pool de level up
- Flash branco + particulas + SFX especial

### Sprites Necessarios (PMDCollab)
- Charmeleon: DEX 0005 — `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0005/Walk-Anim.png`
- Charizard: DEX 0006 — `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0006/Walk-Anim.png`

### Artwork (PokeAPI)
- Charmeleon: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/5.png`
- Charizard: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png`

---

## 6. NOVOS SPRITES DE ATAQUE NECESSARIOS

### VALIDADOS — Sprites que EXISTEM no pokemonAutoChess:

| Ataque | Path | Frames | Tamanho | Status |
|--------|------|--------|---------|--------|
| SLASH | `abilities{tps}/SLASH/` | 4 frames | 32x32 | VALIDADO |
| DRAGON_CLAW | `abilities{tps}/DRAGON_CLAW/` | 10 frames | 108x88 | VALIDADO |
| DRAGON_PULSE | `abilities{tps}/DRAGON_PULSE/` | 6 frames | 32x32 | VALIDADO |
| DRAGON_BREATH | `abilities{tps}/DRAGON_BREATH/` | 9 frames | 32x74 | VALIDADO |
| AIR_SLASH | `abilities{tps}/AIR_SLASH/` | 8 frames | 48x48 | VALIDADO |
| HURRICANE | `abilities{tps}/HURRICANE/` | 52 frames | 56x80 | VALIDADO |
| OUTRAGE | `abilities{tps}/OUTRAGE/` | 13 frames | 48x72 | VALIDADO |
| FIRE_FANG | `abilities{tps}/FIRE_FANG/` | 10 frames | 80x64 | VALIDADO |
| FLAME_CHARGE | `abilities{tps}/FLAME_CHARGE/` | 41 frames | 40x192 | VALIDADO (sprite alto, recortar) |
| AERIAL_ACE | `abilities{tps}/AERIAL_ACE/` | 4 frames | 32x32 | VALIDADO |
| NIGHT_SLASH | `abilities{tps}/NIGHT_SLASH/` | 15 frames | 56x64 | VALIDADO |
| BLAZE_KICK | `abilities{tps}/BLAZE_KICK/` | 15 frames | 64x72 | VALIDADO (substitui Fire Punch) |
| SMOKE_BALL | `abilities{tps}/SMOKE_BALL/` | 21 frames | 80x72 | VALIDADO (para Smokescreen) |

### NAO EXISTEM — Substitutos:

| Ataque Original | Substituto | Motivo |
|-----------------|-----------|--------|
| SCRATCH | `NORMAL/melee` (3 frames, 64x64) | Generico de melee normal |
| HEAT_WAVE | `FIRE/cell` (57 frames, 72x88) | Efeito de fogo no chao, perfeito para wave |
| FLARE_BLITZ | `FIRE/melee` (8 frames, 64x32) + particulas | Melee de fogo + trail |
| FURY_SWIPES | `SLASH` repetido 3x em sequencia | Reutilizar slash com multi-hit |
| FIRE_PUNCH | `BLAZE_KICK` (15 frames, 64x72) | Visual similar de golpe flamejante |

### Efeitos genericos por tipo (VALIDADOS):
| Tipo | Path | Frames | Tamanho | Uso |
|------|------|--------|---------|-----|
| FIRE/cell | `attacks{tps}/FIRE/cell/` | 57 | 72x88 | Heat Wave AoE, explosoes |
| FIRE/hit | `attacks{tps}/FIRE/hit/` | 4 | 32x32 | Impacto de fogo (ja usado) |
| FIRE/melee | `attacks{tps}/FIRE/melee/` | 8 | 64x32 | Flare Blitz melee |
| FIRE/range | `attacks{tps}/FIRE/range/` | 31 | 40x40 | Projectil fogo (ja usado) |
| NORMAL/cell | `attacks{tps}/NORMAL/cell/` | 52 | 56x80 | Smokescreen area |
| NORMAL/hit | `attacks{tps}/NORMAL/hit/` | 4 | 64x64 | Impacto normal |
| NORMAL/melee | `attacks{tps}/NORMAL/melee/` | 3 | 64x64 | Scratch melee |
| DRAGON/melee | `attacks{tps}/DRAGON/melee/` | 11 | 48x40 | Dragon Claw fallback |
| DRAGON/range | `attacks{tps}/DRAGON/range/` | 36 | 72x64 | Dragon Breath beam |
| FLYING/hit | `attacks{tps}/FLYING/hit/` | 6 | 56x48 | Air Slash impacto |
| FLYING/melee | `attacks{tps}/FLYING/melee/` | 18 | 72x72 | Melee voador |
| FLYING/range | `attacks{tps}/FLYING/range/` | 8 | 48x24 | Projectil voador |

### Novos items passivos — PokeAPI (download via curl):
| Item | URL PokeAPI | Uso |
|------|------------|-----|
| dragon-fang | `sprites/items/dragon-fang.png` | +Dragon dmg, receita Dragon Pulse |
| sharp-beak | `sprites/items/sharp-beak.png` | +Flying dmg, receita Aerial Ace |
| silk-scarf | `sprites/items/silk-scarf.png` | +Normal dmg, receita Fury Swipes |
| shell-bell | `sprites/items/shell-bell.png` | Lifesteal |
| scope-lens | `sprites/items/scope-lens.png` | +Crit%, receita Night Slash |
| razor-claw | `sprites/items/razor-claw.png` | +Crit dmg, receita Fury Swipes |
| focus-band | `sprites/items/focus-band.png` | Sobreviver golpe fatal |
| metronome | `sprites/items/metronome.png` | +dmg consecutivo |

---

## 7. BALANCEAMENTO E CURVA DE PODER

### Curva de Dificuldade por Tempo
| Tempo | Wave | Evolucao Esperada | Ataques | Build Minimo Viavel |
|-------|------|-------------------|---------|---------------------|
| 0-2min | 1 (Rattata) | Charmander | 1-2 | Ember sozinho |
| 2-5min | 2 (Rattata+Pidgey) | Charmander | 2-3 | Ember + 1 secundario |
| 5-8min | 3 (+Zubat) | Charmeleon (Lv16) | 3-4 | Ataques variados |
| 8-12min | 4 (+Geodude) | Charmeleon | 4-5 | 1 evolucao de arma |
| 12-16min | 5 (+Gastly) | Charizard (Lv36) | 5-6 | 2 evolucoes |
| 16-20min | 6 (Endgame) | Charizard | 6 MAX | Build completa |
| 20min+ | Boss Rush | Charizard | 6 MAX | Ataque PRIME |

### XP Curve (Ajustada)
- Level 1-15: Rapido (conhecer ataques de Charmander)
- Level 16: Checkpoint — Evolucao para Charmeleon (spike de poder)
- Level 17-35: Medio (explorar novos ataques + evoluir armas)
- Level 36: Checkpoint — Evolucao para Charizard (mega spike)
- Level 37+: Lento (polish da build final)

### DPS Esperado por Tier
| Tier | Exemplo | DPS Solo | DPS Evoluido |
|------|---------|----------|--------------|
| Basic | Ember | ~8/s | Inferno: ~25/s |
| Mid | Flamethrower | ~15/s | Blast Burn: ~40/s |
| Advanced | Dragon Claw | ~22/s | Dragon Rush: ~55/s |
| Ultimate | Flare Blitz | ~30/s | Heat Wave: ~70/s |
| PRIME | — | — | Draco Meteor: ~100/s |

---

## 8. STATUS EFFECTS

### Queimacao (Burn)
- **Visual:** Inimigo fica com tint laranja pulsante + particulas de fogo pequenas
- **Sprite:** Reutilizar `fire-particle` (ja existe) em loop no inimigo
- **Mecanica:**
  - Dano por segundo durante duracao
  - Nao acumula (refresha duracao se aplicar de novo)
  - Inimigos queimando recebem +dmg% (definido pela passiva Blaze)
  - No Charizard: matar inimigo queimando causa explosao AoE

### Stun/Flinch
- **Visual:** Estrelinhas girando em cima do inimigo (icone "confusao" classico)
- **Mecanica:** Inimigo para de mover por X segundos
- **Fonte:** Dragon Breath (15-30% chance), Air Slash (15% chance)

### Slow
- **Visual:** Inimigo fica azulado, particulas de gelo/fumaca
- **Mecanica:** -X% speed por duracao
- **Fonte:** Smokescreen (constante na area)

### Confusion (Self-debuff)
- **Visual:** Controles ficam invertidos, borda da tela pulsa roxa
- **Mecanica:** WASD invertido por X segundos
- **Fonte:** Outrage (apos o efeito acabar)

---

## 9. ORDEM DE IMPLEMENTACAO

### Fase 1: Core — Evolucao do Pokemon
> Prioridade MAXIMA. Tudo depende disso.

1. **Refactor types.ts** — Novos tipos: `PokemonForm`, `AttackPool`, `PassiveAbility`, `StatusEffect`, `BurnState`
2. **Refactor config.ts** — Pool de ataques por forma, passivas innatas, novos held items
3. **Download sprites Charmeleon/Charizard** — PMDCollab DEX 0005/0006 + artwork PokeAPI
4. **Sistema de evolucao visual** — Cutscene de evolucao (flash branco + particulas + SFX)
5. **Slot expansion** — 4/4 -> 5/5 -> 6/6 ao evoluir
6. **Passiva Blaze** — Tier 1/2/3 queimacao por forma

### Fase 2: Status Effects
> Necessario antes dos novos ataques que usam burn/stun/slow.

7. **Sistema de Burn** — Tint laranja pulsante + dano/s + refresh
8. **Sistema de Stun** — Estrelinhas + freeze movement
9. **Sistema de Slow** — Tint azul + reducao speed
10. **Integracao com Blaze** — Inimigos queimados +dmg%, explosao ao morrer (Charizard)

### Fase 3: Ataques Charmander (Novos)
> Expandir o pool base. 4 novos ataques.

11. **Scratch** — Melee rapido direcional (sprite: `NORMAL/melee`)
12. **Dragon Breath** — Beam direcional com stun (sprite: `DRAGON_BREATH`)
13. **Fire Fang** — Melee com chance de burn (sprite: `FIRE_FANG`)
14. **Smokescreen** — Aura de slow ao redor (sprite: `SMOKE_BALL`)
15. **Flame Charge** — Dash com dano + speed buff (sprite: `FLAME_CHARGE`)
16. **Download + montagem de todas as spritesheets novas**

### Fase 4: Ataques Charmeleon (Novos)
> Desbloqueiam no Lv16.

17. **Slash** — Melee amplo com crit (sprite: `SLASH`)
18. **Dragon Claw** — Multi-hit melee (sprite: `DRAGON_CLAW`)
19. **Ajustar Flamethrower** — Equilibrar com novo pool

### Fase 5: Ataques Charizard (Novos)
> Desbloqueiam no Lv36. Os mais complexos.

20. **Air Slash** — Projectile piercing (sprite: `AIR_SLASH`)
21. **Flare Blitz** — Dash devastador com recoil (sprite: `FIRE/melee` + trail)
22. **Hurricane** — Vortex AoE que puxa inimigos (sprite: `HURRICANE`)
23. **Outrage** — Berserk mode com confusion (sprite: `OUTRAGE`)

### Fase 6: Evolucoes de Arma
> Receitas completas. Cada uma precisa arma MAX + item + forma.

24. **Inferno** (Ember + Charcoal + Charmeleon) — ja existe, ajustar requisitos
25. **Fire Blast** (Fire Spin + Wide Lens + Charmeleon) — ja existe, ajustar
26. **Blast Burn** (Flamethrower + Choice Specs + Charizard) — ja existe, ajustar
27. **Fury Swipes** (Scratch + Razor Claw + Charmeleon) — NOVO
28. **Blaze Kick** (Fire Fang + Charcoal + Charmeleon) — NOVO
29. **Dragon Pulse** (Dragon Breath + Dragon Fang + Charizard) — NOVO
30. **Night Slash** (Slash + Scope Lens + Charizard) — NOVO
31. **Aerial Ace** (Air Slash + Sharp Beak + Charizard) — NOVO
32. **Flare Rush** (Flame Charge + Quick Claw + Charmeleon) — NOVO
33. **Dragon Rush** (Dragon Claw + Dragon Fang + Charizard) — NOVO

### Fase 7: Items Passivos Novos
34. **Download sprites** de: dragon-fang, sharp-beak, silk-scarf, shell-bell, scope-lens, razor-claw, focus-band, metronome
35. **Implementar cada item** com efeito e level up

### Fase 8: Ataques PRIME + Polish
36. **Heat Wave** — Requisito: Charizard + 2 Fire MAX
37. **Draco Meteor** — Requisito: Charizard + Outrage MAX + Dragon Fang
38. **Balanceamento geral** — DPS curves, XP scaling, wave timing
39. **UI updates** — Mostrar forma do Pokemon, slots disponiveis, receitas

---

## 10. ARVORE DE DEPENDENCIAS (Visual)

```
CHARMANDER (Lv 1-15) ─── 4 slots ataque / 4 slots passiva
│
├── Ember ─────────── Lv8 + Charcoal + Charmeleon ──> INFERNO
├── Scratch ───────── Lv8 + Razor Claw + Charmeleon -> FURY SWIPES
├── Fire Spin ─────── Lv8 + Wide Lens + Charmeleon ─> FIRE BLAST
├── Fire Fang ─────── Lv8 + Charcoal + Charmeleon ──> BLAZE KICK
├── Dragon Breath ─── Lv8 + Dragon Fang + Charizard -> DRAGON PULSE
├── Flame Charge ──── Lv8 + Quick Claw + Charmeleon -> FLARE RUSH
└── Smokescreen ───── (nao evolui, utility pura)

CHARMELEON (Lv 16-35) ── 5 slots ataque / 5 slots passiva (+1 cada)
│
├── [herda todos do Charmander]
├── Slash ─────────── Lv8 + Scope Lens + Charizard ─> NIGHT SLASH
├── Flamethrower ──── Lv8 + Choice Specs + Charizard > BLAST BURN
└── Dragon Claw ───── Lv8 + Dragon Fang + Charizard -> DRAGON RUSH

CHARIZARD (Lv 36+) ───── 6 slots ataque / 6 slots passiva (+1 cada)
│
├── [herda todos anteriores]
├── Air Slash ─────── Lv8 + Sharp Beak + Charizard ─> AERIAL ACE
├── Flare Blitz ───── (nao evolui, ja e tier maximo com recoil)
├── Hurricane ─────── (nao evolui, ja e tier maximo)
├── Outrage ────────── Lv8 + Dragon Fang + especial ─> DRACO METEOR (PRIME)
│
└── ATAQUES PRIME (forcam escolha mesmo com slots cheios):
    ├── HEAT WAVE ──── Charizard + 2 ataques Fire evoluidos
    └── DRACO METEOR ─ Charizard + Outrage Lv8 + Dragon Fang
```

### Mapa de Items -> Evolucoes que desbloqueiam:

```
Charcoal ────── Ember->Inferno, Fire Fang->Blaze Kick
Wide Lens ───── Fire Spin->Fire Blast
Choice Specs ── Flamethrower->Blast Burn
Quick Claw ──── Flame Charge->Flare Rush
Razor Claw ──── Scratch->Fury Swipes
Scope Lens ──── Slash->Night Slash
Dragon Fang ─── Dragon Breath->Dragon Pulse, Dragon Claw->Dragon Rush, Outrage->Draco Meteor
Sharp Beak ──── Air Slash->Aerial Ace
```

> **Nota:** Dragon Fang e o item mais valioso (3 evolucoes). Charcoal e o segundo (2 evolucoes).
> Isso cria uma decisao interessante: pegar Dragon Fang cedo ou focar em fire?

---

## APENDICE: Referencia Rapida Vampire Survivors

### Categorias de Arma VS -> Nosso Equivalente
| VS | Nosso | Exemplo |
|----|-------|---------|
| Magic Wand | Single Projectile | Ember |
| Fire Wand | Directional Beam | Dragon Breath, Flamethrower |
| King Bible | Orbital | Fire Spin |
| Knife | Fast Melee | Scratch, Slash |
| Whip | Wide Melee | Fire Fang, Dragon Claw |
| Garlic | Passive Aura | Smokescreen |
| Axe | Piercing Projectile | Air Slash |
| Lightning Ring | Dash | Flame Charge |
| Runetracer | Bouncing Chaos | Outrage |
| La Borra | Vortex AoE | Hurricane |
| Clock Lancet | Heavy Charge | Flare Blitz |
