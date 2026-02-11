# Balance Redesign — Anti-AFK & Progression Fix

**Data:** 2026-02-10
**Problema:** Jogadores level 17+ ficam parados coletando XP sem precisar andar. Screenshots mostram level 132 com 59171x combo, tela coberta de efeitos.
**Abordagem:** Moderada — jogo continua satisfatório, mas exige movimentação.

---

## 1. Magnet Range Nerf

**Problema:** Base 60px + PowerUpScene (+10px × 8 = 80) + in-game magnetUp (×1.4 multiplicativo, sem cap) = 300+ pixels.

| Local | Antes | Depois |
|-------|-------|--------|
| `GameScene.ts:118` | `+10px por powerUp level` | `+5px por powerUp level` |
| `UpgradeSystem.ts:380` | `magnetRange *= 1.4` (multiplicativo) | `magnetRange += 12` (aditivo) |
| `upgrade-defs.ts:41` | `"+40% alcance de coleta"` | `"+12px alcance de coleta"` |
| **Cap total** | Sem cap | `Math.min(newRange, 90)` — hard cap 90px |

**Resultado:** PowerUpScene max = 60 + 40 = 100px → capped a 90. In-game magnetUp marginal.

---

## 2. Cooldown Redesign — Progressão Slow → Fast

**Filosofia VS:** Skills começam lentas. Upgrades fazem ficar rápido. Itens complementam.

- Aumentar baseCooldowns em ~40%
- Manter redução por upgrade
- Pisos mínimos razoáveis: base=600ms, stage1=900ms, stage2=1500ms
- Novo item Quick Powder (-8%/stack) para fine-tune

| Ataque | Tier | Antes (base→min) | Depois (base→min) |
|--------|------|-------------------|---------------------|
| Ember | base | 1200→400ms | 1700→600ms |
| WaterGun | base | 1200→400ms | 1700→600ms |
| Scratch | base | 600→300ms | 900→600ms |
| Tackle | base | 600→300ms | 900→600ms |
| BodySlam | base | 500→250ms | 800→600ms |
| FurySwipes | base | 500→250ms | 800→600ms |
| BubbleBeam | base | 500→300ms | 800→600ms |
| RazorLeaf | base | 800→400ms | 1200→600ms |
| Scald | stage1 | 900→400ms | 1400→900ms |
| Inferno | stage1 | 900→400ms | 1400→900ms |
| IceBeam | stage1 | 1500→600ms | 2100→900ms |
| FlashCannon | stage1 | 2000→800ms | 2800→900ms |
| Blizzard | stage1 | 2000→800ms | 2800→900ms |
| SludgeBomb | stage1 | 1500→600ms | 2100→900ms |
| HydroPump | stage1 | 2500→1600ms | 3500→900ms |
| OriginPulse | stage2 | 4000→2000ms | 5500→1500ms |
| BlastBurn | stage2 | 4000→2500ms | 5500→1500ms |
| DracoMeteor | stage2 | 10000→6000ms | 10000→1500ms |

---

## 3. Drop Table — Remover Rare Candy

| Drop Source | Remover | Adicionar |
|-------------|---------|-----------|
| **Rock Smash** | `rareCandy` (12%) | `coinSmall` +12% |
| **Treasure Chest** | `rareCandy` (30%) | `coinMedium` (30%) |
| **Gacha Box** | `rareCandy` (18%) | `coinLarge` (10%) + `heldItem` (+8%) |

XP Share e Duplicator mantidos nos drops.

---

## 4. Duplicator Cap

- `player.stats.projectileBonus` max: **+3**
- Se no cap, duplicator não aparece mais nos drops
- Descrição atualizada: "+1 projétil (max 3)"

---

## 5. Type-Appropriate Items

Adicionar `types: string[]` por form no PokemonFormConfig:

```
Charmander (base):  ['fire', 'normal']
Charmeleon (stage1): ['fire', 'normal']
Charizard (stage2):  ['fire', 'flying', 'dragon']

Squirtle (base):    ['water', 'normal']
Wartortle (stage1): ['water', 'normal']
Blastoise (stage2): ['water', 'ice']

Bulbasaur (base):   ['grass', 'poison', 'normal']
Ivysaur (stage1):   ['grass', 'poison', 'normal']
Venusaur (stage2):  ['grass', 'poison', 'normal']
```

**Mapeamento item → tipo requerido:**
- `Charcoal` → fire
- `Mystic Water` (novo) → water
- `Miracle Seed` (novo) → grass
- `Dragon Fang` → dragon
- `Sharp Beak` → flying
- `Poison Barb` (novo) → poison
- Genéricos (Choice Specs, Shell Bell, Scope Lens, Razor Claw, Leftovers, Quick Claw, Focus Band, Quick Powder) → sem filtro

**Filtro no UpgradeSystem:** Só oferece held item se `playerFormTypes.includes(item.requiredType)` ou item não tem `requiredType`.

---

## 6. Novo Held Item — Quick Powder

- **Key:** `quickPowder`
- **Efeito:** -8% cooldown global por stack
- **Max stacks:** 3 (= -24% cooldown total)
- **Sprite:** `quick-powder.png` do PokeAPI
- **Tipo:** Genérico (disponível para todos)
- **Implementação:** `actualCooldown = floor × (1 - 0.08 × stacks)`
- Aplicado quando timer recria no `upgrade()` e no construtor

---

## 7. Level Cap — Pool Vazio → Coins/Heal

Quando `UpgradeSystem.buildUpgradePool()` retorna pool vazio (todas skills maxadas + todos items obtidos):

**Opções de level-up:**
1. `₽ 100 Coins` — ganha 100₽
2. `Oran Berry` — restaura 30% HP
3. `₽ 250 Coins` — ganha 250₽

**Implementação:** No `UpgradeSystem.triggerLevelUp()`, se pool.length === 0, mostrar opções fixas de coins/heal em vez do upgrade picker normal.

---

## Ordem de Implementação

1. **Magnet Range nerf** (3 arquivos, 5 min)
2. **Drop tables** (2 arquivos, 5 min)
3. **Cooldown redesign** (~20 arquivos, 30 min)
4. **Duplicator cap** (1 arquivo, 5 min)
5. **Level cap** (1 arquivo, 15 min)
6. **Type-appropriate items** (3-4 arquivos, 20 min)
7. **Quick Powder item** (4-5 arquivos, 20 min)

---

## Referências

- [Vampire Survivors - Level Up (Wiki)](https://vampire-survivors.fandom.com/wiki/Level_up)
- [Vampire Survivors - Limit Break (Wiki)](https://vampire-survivors.fandom.com/wiki/Limit_Break)
