# PRD: Boss Rework + Attack Sprites Reorganization

## 1. Visão Geral

Transformar o sistema de bosses de "inimigo com 1 ataque especial" em encontros tipo **Raid Boss** com identidade única por Pokémon. Inclui reorganização completa da pasta de sprites de ataque e adição do Alakazam como boss final supremo.

### Escopo
- **13 bosses** com múltiplos ataques (2-8), resistência, regen HP
- **5 novos patterns** de ataque boss (`directional`, `beam`, `buff`, `zone`, `traveling`)
- **Reorganização completa** de `public/assets/attacks/` em subpastas por tipo
- **Conversão de sprites Tibia** (strips verticais → spritesheets horizontais)
- **Alakazam** como boss final (Caster supremo, 8 ataques)
- **Marowak** buffado como enemy elite

---

## 2. Reorganização da Pasta `public/assets/attacks/`

### 2.1 Estado Atual (caótico)
- ~50 spritesheets soltas na raiz (`ember-sheet.png`, `fire-blast-sheet.png`, etc.)
- Subpastas parciais: `flying/`, `ground/`, `rock/`, `normal/`, `poison-dark/`
- Pasta `frames/` com frames individuais (source files, não usados pelo jogo)
- Pasta `new-sprite/` com sprites Tibia não processadas

### 2.2 Estado Final (organizado por tipo)

```
public/assets/attacks/
├── fire/
│   ├── ember-sheet.png              ← raiz (mover)
│   ├── fire-blast-sheet.png         ← raiz
│   ├── fire-fang-sheet.png          ← raiz
│   ├── fire-hit-sheet.png           ← raiz
│   ├── fire-range-sheet.png         ← raiz
│   ├── flame-charge-sheet.png       ← raiz
│   ├── flamethrower-sheet.png       ← raiz
│   ├── flamethrower-tibia-all-sheet.png  ← raiz
│   ├── flamethrower-tibia-e-sheet.png    ← raiz
│   ├── flamethrower-tibia-ne-sheet.png   ← raiz
│   ├── flamethrower-tibia-se-sheet.png   ← raiz
│   ├── flamethrower-tibia-sw-sheet.png   ← raiz
│   ├── flare-blitz-sheet.png        ← raiz
│   ├── blast-burn-sheet.png         ← raiz
│   ├── heat-wave-sheet.png          ← raiz
│   └── eruption-sheet.png           ← NOVO (tibia fire_eruption_242 convertido)
│
├── water/
│   ├── water-pulse-sheet.png        ← raiz
│   ├── water-range-sheet.png        ← raiz
│   ├── water-hit-sheet.png          ← raiz
│   ├── water-melee-sheet.png        ← raiz
│   ├── water-cell-sheet.png         ← raiz
│   ├── wave-splash-sheet.png        ← raiz
│   ├── sparkling-aria-sheet.png     ← raiz
│   ├── origin-pulse-sheet.png       ← raiz
│   ├── hydro-pump-sheet.png         ← raiz
│   ├── aqua-jet-sheet.png           ← raiz
│   ├── liquidation-sheet.png        ← raiz
│   ├── rapid-spin-sheet.png         ← raiz
│   ├── surf-sheet.png               ← raiz
│   ├── surf-tibia-sheet.png         ← NOVO (tibia surf_247)
│   ├── surf-wave-up-sheet.png       ← NOVO (tibia water-wave_65)
│   ├── surf-wave-down-sheet.png     ← NOVO (tibia water-wave_66)
│   ├── surf-wave-left-sheet.png     ← NOVO (tibia water-wave_67)
│   ├── surf-wave-right-sheet.png    ← NOVO (tibia water-wave_68)
│   ├── whirlpool-tibia-sheet.png    ← NOVO (tibia water-tornado_291)
│   ├── whirlpool-rings-sheet.png    ← NOVO (tibia wirpull_2)
│   └── bubble-shot-sheet.png        ← NOVO (tibia water-buble)
│
├── ice/
│   └── ice-range-sheet.png          ← raiz
│
├── dragon/
│   ├── dragon-breath-sheet.png      ← raiz
│   ├── dragon-claw-sheet.png        ← raiz
│   ├── dragon-pulse-sheet.png       ← raiz
│   ├── dragon-rush-sheet.png        ← raiz
│   ├── draco-meteor-sheet.png       ← raiz
│   └── outrage-sheet.png            ← raiz
│
├── flying/
│   ├── acrobatics-sheet.png         ← já existe
│   ├── aerial-ace-sheet.png         ← já existe (+ raiz duplicata)
│   ├── air-slash-sheet.png          ← já existe (+ raiz duplicata)
│   ├── brave-bird-sheet.png         ← já existe
│   ├── flying-hit-sheet.png         ← já existe
│   ├── flying-melee-sheet.png       ← já existe
│   ├── flying-range-sheet.png       ← já existe
│   ├── hurricane-sheet.png          ← já existe (+ raiz duplicata)
│   ├── sky-attack-sheet.png         ← já existe
│   ├── tailwind-sheet.png           ← já existe
│   ├── twister-sheet.png            ← NOVO (tibia air_79)
│   ├── gust-sheet.png               ← NOVO (tibia gust_43)
│   ├── air-cutter-up-sheet.png      ← NOVO (tibia air-cut_129)
│   ├── air-cutter-down-sheet.png    ← NOVO (tibia air-cut_130)
│   ├── air-cutter-left-sheet.png    ← NOVO (tibia air-cut_131)
│   ├── air-cutter-right-sheet.png   ← NOVO (tibia air-cut_132)
│   ├── brave-bird-tibia-sheet.png   ← NOVO (tibia x-aircut_224)
│   └── air-slash-x-sheet.png        ← NOVO (tibia x-aircut_17)
│
├── normal/
│   ├── explosion-sheet.png          ← já existe
│   ├── extreme-speed-sheet.png      ← já existe
│   ├── normal-cell-sheet.png        ← já existe
│   ├── normal-hit-sheet.png         ← já existe
│   ├── normal-melee-sheet.png       ← já existe
│   ├── tri-attack-sheet.png         ← já existe
│   ├── scratch-sheet.png            ← raiz
│   ├── slash-sheet.png              ← raiz
│   ├── fury-swipes-sheet.png        ← raiz
│   ├── bite-sheet.png               ← raiz
│   ├── stomp-sheet.png              ← raiz
│   ├── thrash-sheet.png             ← raiz
│   ├── hyper-voice-sheet.png        ← raiz
│   ├── blaze-kick-sheet.png         ← raiz
│   └── night-slash-sheet.png        ← raiz
│
├── fighting/
│   ├── dynamic-punch-up-sheet.png   ← NOVO (tibia machamp-punch_216)
│   ├── dynamic-punch-down-sheet.png ← NOVO (tibia machamp-punch_217)
│   ├── dynamic-punch-left-sheet.png ← NOVO (tibia machamp-punch_218)
│   ├── dynamic-punch-right-sheet.png← NOVO (tibia machamp-punch_219)
│   ├── cross-chop-up-sheet.png      ← NOVO (tibia punch-sequence_93)
│   ├── cross-chop-down-sheet.png    ← NOVO (tibia punch-sequence_94)
│   ├── cross-chop-left-sheet.png    ← NOVO (tibia punch-sequence_95)
│   ├── cross-chop-right-sheet.png   ← NOVO (tibia punch-sequence_96)
│   └── focus-blast-sheet.png        ← NOVO (tibia punch-area_100)
│
├── rock/
│   ├── ancient-power-sheet.png      ← já existe
│   ├── diamond-storm-sheet.png      ← já existe
│   ├── rock-hit-sheet.png           ← já existe
│   ├── rock-melee-sheet.png         ← já existe
│   ├── rock-range-sheet.png         ← já existe
│   ├── rock-slide-sheet.png         ← já existe (+ raiz duplicatas)
│   ├── rock-tomb-sheet.png          ← já existe
│   ├── rollout-sheet.png            ← já existe
│   ├── rock-throw-sheet.png         ← raiz
│   ├── stone-edge-tibia-sheet.png   ← NOVO (tibia Golem_atack_158)
│   └── rock-slide-tibia-sheet.png   ← NOVO (tibia queda-de-rochas_45)
│
├── ground/
│   ├── dig-sheet.png                ← já existe
│   ├── fissure-sheet.png            ← já existe
│   ├── ground-hit-sheet.png         ← já existe
│   ├── ground-melee-sheet.png       ← já existe
│   ├── mud-shot-sheet.png           ← já existe
│   ├── precipice-blades-sheet.png   ← já existe
│   ├── sand-tomb-sheet.png          ← já existe
│   ├── bonemerang-sheet.png         ← raiz (+ versão tibia)
│   └── bonemerang-tibia-sheet.png   ← NOVO (tibia marowak-bone_228)
│
├── ghost/
│   ├── shadow-ball-sheet.png        ← raiz
│   ├── shadow-ball-up-sheet.png     ← NOVO (tibia gengar_speel_139)
│   ├── shadow-ball-down-sheet.png   ← NOVO (tibia gengar_speel_140)
│   ├── shadow-ball-left-sheet.png   ← NOVO (tibia gengar_speel_141)
│   └── shadow-ball-right-sheet.png  ← NOVO (tibia gengar_speel_146)
│
├── psychic/
│   ├── psychic-sheet.png            ← raiz
│   ├── psybeam-sheet.png            ← raiz
│   ├── psywave-a-sheet.png          ← NOVO (tibia alakazam-wave_134)
│   └── psywave-b-sheet.png          ← NOVO (tibia alakazam-wave_137)
│
├── poison/
│   ├── acid-spray-sheet.png         ← poison-dark/
│   ├── cross-poison-sheet.png       ← poison-dark/
│   ├── gunk-shot-sheet.png          ← poison-dark/
│   ├── poison-hit-sheet.png         ← poison-dark/
│   ├── poison-melee-sheet.png       ← poison-dark/
│   ├── poison-range-sheet.png       ← poison-dark/
│   ├── sludge-wave-sheet.png        ← poison-dark/
│   ├── smog-sheet.png               ← poison-dark/
│   ├── screech-sheet.png            ← poison-dark/
│   ├── venoshock-sheet.png          ← raiz
│   └── iron-tail-sheet.png          ← poison-dark/ (Steel, mas vive aqui por agora)
│
├── dark/
│   ├── dark-hit-sheet.png           ← poison-dark/
│   ├── dark-melee-sheet.png         ← poison-dark/
│   ├── dark-range-sheet.png         ← poison-dark/
│   └── night-slash-pd-sheet.png     ← poison-dark/ (renomeado p/ não conflitar)
│
├── bug/
│   ├── x-scissor-a-sheet.png        ← NOVO (tibia x-aircut_222)
│   └── x-scissor-b-sheet.png        ← NOVO (tibia x-aircut_244)
│
├── explosion/                        ← raiz
│   └── explosion-sheet.png          ← raiz (golem explosion)
│
└── _archive/
    ├── frames/                       ← mover frames/ para cá (source files)
    └── new-sprite/                   ← mover originals Tibia para cá (backup)
```

### 2.3 Regras de Movimentação
1. **Sprites na raiz** → mover para subpasta do tipo correspondente
2. **Duplicatas** (raiz + subpasta): remover a da raiz, manter na subpasta
3. **Pasta `poison-dark/`** → separar em `poison/` e `dark/`
4. **Pasta `frames/`** → mover para `_archive/frames/` (não usadas pelo jogo)
5. **Pasta `new-sprite/`** → processar Tibia, depois mover originais para `_archive/`
6. **BootScene.ts**: atualizar TODOS os paths de `this.load.spritesheet()`

---

## 3. Sistema de Boss Rework

### 3.1 Novos Campos em `BossConfig`

```typescript
export interface BossConfig extends EnemyConfig {
  readonly isBoss: true;
  readonly bossAttacks: readonly BossAttackConfig[];  // PLURAL (array de ataques)
  readonly resistance: number;        // 0.0 - 0.5 (% de redução de dano)
  readonly hpRegenPerSec: number;     // HP regenerado por segundo
  readonly archetype: 'tank' | 'striker' | 'caster' | 'skirmisher';
}
```

**Backward compat**: manter `bossAttack` como alias que retorna `bossAttacks[0]` durante migração.

### 3.2 Resistência a Dano
- `finalDamage = Math.max(1, Math.floor(rawDamage * (1 - resistance)))`
- Status effects (burn, wet) bypasses resistance (100% dano)
- Visual: dano aparece cinza quando resistido

### 3.3 Regeneração de HP
- Processada em `Boss.preUpdate()`: `hp += hpRegenPerSec * (delta / 1000)`
- Cap em `maxHp`
- Visual: partículas verdes sutis + HP bar brilha verde

### 3.4 Sistema Multi-Ataque
- Cada ataque tem cooldown independente (timestamp do último uso)
- `tryBossAttack()` retorna o ataque off-cooldown com maior prioridade
- Prioridade: range satisfeito > AoE perto do player > fallback

### 3.5 Novos Patterns de Ataque (5 novos)

| Pattern | Comportamento | Sprites |
|---|---|---|
| `directional` | Sprite 4-dir na frente do boss, segue boss, dano em cone | Tibia 4-dir sets |
| `beam` | Raio na direção do player, dano em linha, duração 1-2s | Procedural ou existente |
| `buff` | Aura visual + stats temporários (resist, dmg, speed) | Partículas + tint |
| `zone` | Círculo no chão persistente com tick damage ou debuff | Partículas + circle |
| `traveling` | Projétil viaja em linha reta (não homing), dano ao passar | Tibia sprites |

---

## 4. Roster de Ataques por Boss (13 bosses)

### Phase 1

**Raticate** — Skirmisher | HP 1500 | Resist 0% | Regen 0
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Hyper Fang | charge | 70 | 3.5s | Existente (atk-bite) |
| 2 | Quick Attack | charge | 30 | 2s | Dash rápido, range 250, speed 500 |

**Arbok** — Caster-lite | HP 1800 | Resist 10% | Regen 5
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Gunk Shot | fan | 20/proj | 3.5s | Existente, 5 projéteis |
| 2 | Acid Spray | zone | 8/tick | 6s | Poça 3s, radius 80 (atk-acid-spray) |
| 3 | Glare | beam | 0 | 8s | Slow 70% por 2s (atk-screech) |

**Nidoking** — Tank | HP 3000 | Resist 20% | Regen 10
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Thrash | aoe-tremor | 30 | 5s | Existente, radius 220 |
| 2 | Earthquake | aoe-tremor | 45 | 8s | Radius 300, shake forte (tibia rock-slide) |
| 3 | Poison Sting | fan | 12/proj | 4s | 3 projéteis (atk-poison-range) |

**Snorlax** — Tank | HP 5000 | Resist 30% | Regen 15
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Body Slam | aoe-land | 50 | 6s | Existente, radius 250 |
| 2 | Hyper Beam | beam | 60 | 8s | Raio branco 1.5s, boss parado 2s após |
| 3 | Rest | buff | heal 30% | 20s | Dorme 3s, cura 30% maxHP, zzZ visual |

### Phase 2

**Beedrill** — Striker | HP 2500 | Resist 5% | Regen 0
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Twineedle | charge | 40 | 3s | Existente |
| 2 | Pin Missile | fan | 15/proj | 4s | 5 projéteis rápidos (poison-range tint amarelo) |
| 3 | X-Scissor | directional | 35 | 5s | Corte X (tibia x-scissor) |

**Fearow** — Skirmisher | HP 3000 | Resist 5% | Regen 0
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Air Slash | fan | 25/proj | 2.5s | Existente, 5 projéteis |
| 2 | Drill Peck | charge | 50 | 4s | Dash giratório, range 300 |
| 3 | Air Cutter | directional | 30 | 5s | 4-dir (tibia air-cutter) |

**Vileplume** — Caster | HP 3500 | Resist 15% | Regen 20
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Petal Dance | aoe-tremor | 35 | 4.5s | Existente, radius 260 |
| 2 | Stun Spore | zone | 0 | 8s | Slow 60%, 4s, radius 120, partículas amarelas |
| 3 | Poison Powder | zone | 6/tick | 7s | DoT 5s, radius 100, partículas roxas |
| 4 | Solar Beam | beam | 55 | 10s | Charge 1.5s → raio verde, dano em linha |

### Phase 3

**Primeape** — Striker | HP 4000 | Resist 10% | Regen 5
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Close Combat | charge | 45 | 2.8s | Existente |
| 2 | Cross Chop | directional | 40 | 4s | Combo 4-dir (tibia cross-chop) |
| 3 | Seismic Toss | aoe-land | 50 | 6s | Salto + AoE radius 120 |
| 4 | Thrash Mode | buff | +30% dmg | 15s | Enrage 5s, +50% speed, tint vermelho |

**Pidgeot** — Skirmisher | HP 4500 | Resist 10% | Regen 10
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Hurricane | aoe-land | 45 | 3s | Existente, radius 160 |
| 2 | Twister | traveling | 30 | 5s | Tornado viaja (tibia twister), speed 120 |
| 3 | Air Cutter | directional | 25 | 4s | 4-dir (tibia air-cutter) |
| 4 | Gust | fan | 15/proj | 3.5s | 3 proj + knockback (tibia gust) |

**Gengar** — Caster | HP 5000 | Resist 20% | Regen 25
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Shadow Storm | teleport-fan | 28/proj | 4s | Existente, 7 shadow balls |
| 2 | Shadow Ball | directional | 35 | 3s | 4-dir ghost (tibia shadow-ball) |
| 3 | Hypnosis | zone | 0 | 10s | Slow 80% 3s, radius 100, visual hipnótico |
| 4 | Dream Eater | beam | 40 | 8s | Se player em slow: heal boss 50% do dano |
| 5 | Curse | zone | 50 | 12s | 3 pontos no chão, explodem após 2s |
| 6 | Night Shade | beam | 30 | 5s | Raio ghost (atk-dark-range) |

**Golem** — Tank | HP 5500 | Resist 35% | Regen 15
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Explosion | aoe-tremor | 70 | 4s | Existente, radius 200 |
| 2 | Stone Edge | directional | 45 | 5s | Impacto direcional (tibia stone-edge) |
| 3 | Rock Slide | traveling | 35 | 6s | 3 pedras caindo (tibia rock-slide) |
| 4 | Rollout | charge | 30→60 | 3s | Cada uso +30% speed, resets após 5s sem uso |

### Phase 4

**Machamp** — Striker/Tank | HP 6000 | Resist 25% | Regen 10
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Dynamic Punch | aoe-tremor | 55 | 3s | Existente, radius 160 |
| 2 | Dynamic Punch Dir | directional | 45 | 4s | Combo 4-dir (tibia dynamic-punch) |
| 3 | Focus Blast | traveling | 60 | 6s | Projétil AoE, explode (tibia focus-blast) |
| 4 | Bulk Up | buff | — | 15s | +20% resist, +30% dmg, 6s, tint dourado |
| 5 | Submission | charge | 50 | 5s | Grab charge, auto-dano 10% no boss |

### BOSS FINAL

**Alakazam** — Caster Supremo | HP 8000 | Resist 30% | Regen 30
| # | Ataque | Pattern | Dano | CD | Detalhe |
|---|---|---|---|---|---|
| 1 | Psychic | fan | 30/proj | 3s | 7 projéteis homing (atk-psychic, existente) |
| 2 | Psywave | directional | 35 | 4s | Ondas psíquicas 4-dir (tibia psywave) |
| 3 | Teleport + Psybeam | teleport-fan | 25/proj | 5s | Teleporta + leque de 5 psybeams |
| 4 | Future Sight | zone | 80 | 12s | Marca 4 pontos, explodem após 3s |
| 5 | Calm Mind | buff | — | 15s | Próx ataque 2x dano, +15% resist, 8s |
| 6 | Psybeam | beam | 40 | 6s | Raio que gira lentamente (atk-psybeam) |
| 7 | Kinesis | zone | 0 | 10s | Vórtice que puxa player ao centro, 3s |
| 8 | Recover | buff | heal 20% | 20s | Cura 20% maxHP, aura dourada, 2s casting |

**Identidade do Alakazam:**
- Teleporta constantemente (como enemy, mas cooldown 3s no boss)
- Cria zonas psíquicas que o player precisa desviar
- Heal via Recover força o player a manter DPS alto
- Future Sight pune quem fica parado
- Calm Mind torna o próximo ataque devastador
- Scale: 2.0 (maior que todos os outros bosses)
- Tint: 0xcc88ff (roxo psíquico)
- Spawn: após derrotar Machamp na Phase 4, ou no Final Rush como ÚLTIMO

---

## 5. Marowak como Enemy Elite

| Stat | Antes | Depois |
|---|---|---|
| HP | 60 | 100 |
| Damage | 22 | 28 |
| Speed | 55 | 50 |
| Scale | 1.3 | 1.4 |
| Boomerang damage | 18 | 22 |
| Boomerang cooldown | 4000ms | 3500ms |
| Boomerang speed | 260 | 280 |
| Boomerang sprite | atk-bone | bonemerang-tibia-sheet (novo) |

---

## 6. Tabela Resumo Completa

| Boss | Phase | Archetype | HP | Resist | Regen | Ataques | Tibia Sprites Novos |
|---|---|---|---|---|---|---|---|
| Raticate | 1 | Skirmisher | 1500 | 0% | 0 | 2 | — |
| Arbok | 1 | Caster-lite | 1800 | 10% | 5 | 3 | — |
| Nidoking | 1 | Tank | 3000 | 20% | 10 | 3 | rock-slide-tibia |
| Snorlax | 1 | Tank | 5000 | 30% | 15 | 3 | — |
| Beedrill | 2 | Striker | 2500 | 5% | 0 | 3 | x-scissor |
| Fearow | 2 | Skirmisher | 3000 | 5% | 0 | 3 | air-cutter (4-dir) |
| Vileplume | 2 | Caster | 3500 | 15% | 20 | 4 | — |
| Primeape | 3 | Striker | 4000 | 10% | 5 | 4 | cross-chop (4-dir) |
| Pidgeot | 3 | Skirmisher | 4500 | 10% | 10 | 4 | twister, air-cutter, gust |
| Gengar | 3 | Caster | 5000 | 20% | 25 | 6 | shadow-ball (4-dir) |
| Golem | 3 | Tank | 5500 | 35% | 15 | 4 | stone-edge-tibia, rock-slide-tibia |
| Machamp | 4 | Striker/Tank | 6000 | 25% | 10 | 5 | dynamic-punch (4-dir), focus-blast |
| **Alakazam** | **Final** | **Caster** | **8000** | **30%** | **30** | **8** | **psywave (2 vars)** |

**Total de ataques boss**: 52 (era 12)
**Sprites Tibia novos a converter**: ~30 arquivos → ~30 spritesheets horizontais

---

## 7. Ordem de Implementação

### Fase A — Reorganização de Sprites
1. Criar estrutura de subpastas (`fire/`, `water/`, `dragon/`, etc.)
2. Mover sprites existentes da raiz para subpastas
3. Separar `poison-dark/` em `poison/` e `dark/`
4. Instalar `sharp` temporariamente, converter Tibia strips → horizontal sheets
5. Mover para subpastas corretas
6. Mover `frames/` e `new-sprite/` originals para `_archive/`
7. Atualizar TODOS os paths em `BootScene.ts`
8. Verificar build (`npx tsc --noEmit && npx vite build`)

### Fase B — Infraestrutura de Boss
1. Atualizar `types.ts`: `bossAttack` → `bossAttacks[]`, adicionar `resistance`, `hpRegenPerSec`, `archetype`
2. Atualizar `Boss.ts`: multi-attack selection, HP regen em preUpdate
3. Atualizar `Enemy.takeDamage()`: aplicar resistance
4. Atualizar `SpawnSystem.ts`: `executeBossAttack()` suportar novos patterns

### Fase C — Novos Patterns de Ataque
1. Implementar `directional` (sprite 4-dir, dano em cone)
2. Implementar `beam` (raio na direção, dano em linha)
3. Implementar `buff` (aura visual, stats temporários)
4. Implementar `zone` (círculo persistente, tick dmg/debuff)
5. Implementar `traveling` (projétil em linha reta)

### Fase D — Boss Configs (13 bosses, 1 por vez)
1. Raticate → 2. Arbok → 3. Nidoking → 4. Snorlax
5. Beedrill → 6. Fearow → 7. Vileplume
8. Primeape → 9. Pidgeot → 10. Gengar → 11. Golem
12. Machamp → **13. Alakazam (boss final)**

### Fase E — Alakazam Boss Config
1. Criar `src/data/enemies/alakazam-boss.ts` (config separada do enemy regular)
2. Adicionar ao phase4 como boss final (após Machamp ou no Final Rush)
3. Walk sprite já existe (32x40, 4f, 8dir)
4. Registrar Tibia psywave sprites no BootScene

### Fase F — Marowak Enhancement
1. Atualizar `marowak.ts` stats
2. Registrar bonemerang-tibia sprite

### Fase G — Polish e UI
1. HP bar boss com indicator de regen (brilho verde)
2. Dano resistido em cinza
3. Boss warning com ícone de archetype
4. Testar TODOS 13 bosses em sequência
