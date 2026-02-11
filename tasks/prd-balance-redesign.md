# PRD: Balance Redesign — Anti-AFK & Progression Fix

**Branch:** `ralph/balance-redesign`
**Design Doc:** `docs/plans/2026-02-10-balance-redesign.md`

## Contexto

Jogadores level 17+ ficam parados coletando XP sem precisar andar. Causa: magnet range muito alto, cooldowns muito baixos, drops muito generosos (Rare Candy +1 level em 30% dos chests). Precisamos nerfar o power scaling e forcar movimentacao.

---

## User Stories

### US-001: Magnet Range Nerf (Prioridade 1)

**Arquivos:** `src/scenes/GameScene.ts`, `src/systems/UpgradeSystem.ts`, `src/data/items/upgrade-defs.ts`

**Mudancas:**
1. Em `GameScene.ts` (~linha 118): mudar `getPowerUpLevel("magnetRange") * 10` para `getPowerUpLevel("magnetRange") * 5`
2. Em `UpgradeSystem.ts` (~linha 380): mudar `player.stats.magnetRange = Math.floor(player.stats.magnetRange * 1.4)` para `player.stats.magnetRange = Math.min(player.stats.magnetRange + 12, 90)`
3. Em `upgrade-defs.ts` (~linha 41): mudar description de `"+40% alcance de coleta de XP"` para `"+12 alcance de coleta de XP"`

**Validacao:** `npx tsc --noEmit` passa. magnetRange nunca excede 90px.

---

### US-002: Drop Tables — Remover Rare Candy (Prioridade 2)

**Arquivos:** `src/data/destructibles.ts`, `src/systems/UpgradeSystem.ts`

**Mudancas em `destructibles.ts`:**
1. No `rockSmash.drops`: remover `{ type: "rareCandy", chance: 0.12 }`. Adicionar `{ type: "coinSmall", chance: 0.12 }` (ou aumentar o coinSmall existente em +0.12).
2. No `treasureChest.drops`: remover `{ type: "rareCandy", chance: 0.3 }`. Adicionar `{ type: "coinMedium", chance: 0.3 }`.

**Mudancas em `UpgradeSystem.ts` (metodo `applyGachaReward`):**
1. No switch case de gacha rewards, encontrar onde `rareCandy` e usado como reward type.
2. Substituir a chance de `rareCandy` por `coinLarge` (10%) e redistribuir o resto para `heldItem` (+8%).
3. Adicionar case `coinLarge` no applyGachaReward que chama `this.pickupSystem.spawnCoin(player.x, player.y, 'large')` ou equivalente.
4. NAO remover o case 'rareCandy' do PickupSystem.ts (pode ser usado por outros sistemas), so remover dos drop tables.

**Validacao:** `npx tsc --noEmit` passa. Abrir chest nao da mais Rare Candy.

---

### US-003: Cooldown Nerf — Base Attacks (Prioridade 3)

**Ataques base (minForm: undefined ou 'base') — piso minimo: 600ms**

Cada ataque tem no seu `upgrade()` um `Math.max(MIN, this.cooldown - REDUCTION)`. Aumentar o baseCooldown no registry E o MIN no arquivo do ataque.

**Arquivo `src/data/attacks/attack-registry.ts`** — atualizar `baseCooldown`:
- `ember`: 1200 → 1700
- `waterGun`: 1200 → 1700
- `scratch`: 600 → 900
- `tackle`: 600 → 900
- `bodySlam`: 500 → 800
- `furySwipes`: 500 → 800
- `bubbleBeam`: 500 → 800
- `razorLeaf`: 800 → 1200
- `bubble`: 1500 → 2000
- `fireFang`: 1000 → 1400
- `dragonBreath`: 1800 → 2500
- `waterPulse`: 1200 → 1700
- `energyBall`: 1200 → 1700

**Arquivos de cada ataque** — atualizar o `Math.max(MIN, ...)` no metodo `upgrade()`:
- `src/attacks/Ember.ts`: Math.max(400 → 600, ...)
- `src/attacks/WaterGun.ts`: Math.max(400 → 600, ...)
- `src/attacks/Scratch.ts`: Math.max(300 → 600, ...)
- `src/attacks/Tackle.ts`: Math.max(300 → 600, ...)
- `src/attacks/BodySlam.ts`: Math.max(250 → 600, ...)
- `src/attacks/FurySwipes.ts`: Math.max(250 → 600, ...)
- `src/attacks/BubbleBeam.ts`: Math.max(300 → 600, ...)
- `src/attacks/RazorLeaf.ts`: Math.max(400 → 600, ...)
- `src/attacks/Bubble.ts`: verificar e ajustar para min 600
- `src/attacks/FireFang.ts`: verificar e ajustar para min 600
- `src/attacks/DragonBreath.ts`: verificar e ajustar para min 600
- `src/attacks/WaterPulse.ts`: verificar e ajustar para min 600
- `src/attacks/EnergyBall.ts`: verificar e ajustar para min 600

**IMPORTANTE:** Cada ataque le `ATTACKS[type].baseCooldown` no construtor via `this.cooldown = ATTACKS.xxx.baseCooldown`. O `upgrade()` reduce via `this.cooldown = Math.max(MIN, this.cooldown - REDUCTION)` e recria o timer. Atualizar AMBOS: o baseCooldown no registry E o MIN no upgrade().

**Validacao:** `npx tsc --noEmit` passa.

---

### US-004: Cooldown Nerf — Stage1 Attacks (Prioridade 4)

**Ataques stage1 (minForm: 'stage1') — piso minimo: 900ms**

**Arquivo `src/data/attacks/attack-registry.ts`** — atualizar `baseCooldown`:
- `scald`: 900 → 1400
- `inferno`: 900 → 1400
- `iceBeam`: 1500 → 2100
- `flashCannon`: 2000 → 2800
- `blizzard`: 2000 → 2800
- `sludgeBomb`: 1500 → 2100
- `hydroPump`: 2500 → 3500
- `flamethrower`: 2200 → 3000
- `muddyWater`: 1500 → 2100
- `solarBeam`: 3000 → 4000

**Arquivos de cada ataque** — atualizar `Math.max(MIN, ...)` para min 900:
- `src/attacks/Scald.ts`: Math.max(400 → 900, ...)
- `src/attacks/Inferno.ts`: Math.max(400 → 900, ...)
- `src/attacks/IceBeam.ts`: Math.max(600 → 900, ...)
- `src/attacks/FlashCannon.ts`: Math.max(800 → 900, ...)
- `src/attacks/Blizzard.ts`: Math.max(800 → 900, ...)
- `src/attacks/SludgeBomb.ts`: Math.max(600 → 900, ...)
- `src/attacks/HydroPump.ts`: Math.max(1600 → 900, ...) — NOTA: o min atual e 1600, que ja e MAIOR que 900. Manter 1600 OU reduzir? Conferir contexto.
- `src/attacks/Flamethrower.ts`: verificar e ajustar para min 900
- `src/attacks/MuddyWater.ts`: verificar e ajustar para min 900
- `src/attacks/SolarBeam.ts`: verificar e ajustar para min 900

**NOTA sobre HydroPump:** O min atual (1600ms) ja esta acima do piso de 900ms. NAO reduzir — manter o min original ou usar 900 se for menor. A regra e: `Math.max(PISO_TIER, min_original)`. Se o original era 1600 e o piso e 900, manter 1600 (o mais alto prevalece). Mas o baseCooldown SOBE de 2500 para 3500, entao a skill comeca mais lenta mas pode chegar ao mesmo min.

**Validacao:** `npx tsc --noEmit` passa.

---

### US-005: Cooldown Nerf — Stage2 Attacks (Prioridade 5)

**Ataques stage2 (minForm: 'stage2') — piso minimo: 1500ms**

**Arquivo `src/data/attacks/attack-registry.ts`** — atualizar `baseCooldown`:
- `originPulse`: 4000 → 5500
- `blastBurn`: 4000 → 5500
- `dracoMeteor`: 10000 → 10000 (manter)
- `hydroCannon`: 4000 → 5500
- `heatWave`: 3000 → 4200
- `hurricane`: 3500 → 5000
- `waterfall`: 3000 → 4200
- `waterSpout`: 3000 → 4200

**Arquivos de cada ataque** — atualizar `Math.max(MIN, ...)` para min 1500:
- `src/attacks/OriginPulse.ts`: Math.max(2000 → 1500, ...) — o min atual e 2000, que ja e MAIOR. Manter 2000.
- `src/attacks/BlastBurn.ts`: Math.max(2500 → 1500, ...) — manter 2500 (ja maior).
- `src/attacks/DracoMeteor.ts`: Math.max(6000 → 1500, ...) — manter 6000 (ja MUITO maior).
- `src/attacks/HydroCannon.ts`: verificar e ajustar.
- `src/attacks/HeatWave.ts`: verificar e ajustar para min 1500.
- `src/attacks/Hurricane.ts`: verificar e ajustar para min 1500.
- `src/attacks/Waterfall.ts`: Math.max(1200 → 1500, ...)
- `src/attacks/WaterSpout.ts`: verificar e ajustar para min 1500.

**Regra:** Se o min original ja e MAIOR que o piso do tier, manter o original. Se for MENOR, aumentar para o piso.

**Validacao:** `npx tsc --noEmit` passa.

---

### US-006: Duplicator Cap (Prioridade 6)

**Arquivos:** `src/systems/PickupSystem.ts`, `src/data/destructibles.ts`

**Mudancas:**
1. Em `PickupSystem.ts`, no case `'duplicator'` (~linha 287):
   ```typescript
   case 'duplicator':
     if (player.stats.projectileBonus >= 3) {
       // Cap atingido — dar coins em vez disso
       SoundManager.playPickupItem();
       this.showPickupNotification('MAX PROJ! +50₽', 0xffcc00);
       this.ctx.scene.events.emit('coins-changed', 50);
       break;
     }
     player.stats.projectileBonus += 1;
     SoundManager.playPickupItem();
     this.showPickupNotification(`DUPLICATOR! +1 Projétil (${player.stats.projectileBonus}/3)`, 0x44dd44);
     break;
   ```
2. Atualizar a description do duplicator em `destructibles.ts` (se existir na section PICKUP_DEFS): mudar de `"+1 projétil em todos os ataques!"` para `"+1 projétil (max 3)"`

**Validacao:** `npx tsc --noEmit` passa.

---

### US-007: Level Cap — Pool Vazio da Coins/Heal (Prioridade 7)

**Arquivos:** `src/systems/UpgradeSystem.ts`, `src/scenes/UIScene.ts`

**Logica:** Quando `buildUpgradePool()` retorna pool vazio (todas skills maxadas + todos items), as opcoes de level-up sao fixas:

**Mudancas em `UpgradeSystem.ts`:**
1. No metodo `triggerLevelUp()` (ou equivalente que mostra opcoes de upgrade):
   - Chamar `buildUpgradePool()` normalmente
   - Se `pool.length === 0`, criar opcoes fixas:
     ```typescript
     const fallbackOptions: UpgradeOption[] = [
       { id: 'goldSmall', name: 'Coins', description: '+100₽', icon: 'coin-medium', color: 0xffcc00 },
       { id: 'heal', name: 'Oran Berry', description: 'Restaura 30% HP', icon: 'pickup-oran', color: 0x44aaff },
       { id: 'goldLarge', name: 'Big Coins', description: '+250₽', icon: 'coin-large', color: 0xffdd00 },
     ];
     ```
   - Usar essas opcoes no lugar do pool normal
2. No metodo que aplica a escolha (`applyUpgrade` ou similar):
   - Adicionar cases para 'goldSmall', 'heal', 'goldLarge':
     - `goldSmall`: emit 'coins-changed' com 100
     - `heal`: restaurar 30% do maxHp (min 1)
     - `goldLarge`: emit 'coins-changed' com 250

**NOTA:** As UpgradeOption precisam ter os campos corretos conforme o tipo definido em `src/types.ts`. Verificar a interface antes de implementar.

**Validacao:** `npx tsc --noEmit` passa. Quando pool esvazia, opcoes de coins/heal aparecem.

---

### US-008: Adicionar Types por Pokemon Form (Prioridade 8)

**Arquivos:** `src/types.ts`, `src/data/pokemon/charmander-line.ts`, `src/data/pokemon/squirtle-line.ts`, `src/data/pokemon/bulbasaur-line.ts`

**Mudancas:**
1. Em `src/types.ts`, na interface `PokemonFormConfig`, adicionar campo:
   ```typescript
   readonly types: readonly string[];
   ```
2. Em `charmander-line.ts`, adicionar `types` a cada form:
   - Charmander (base): `types: ['fire', 'normal']`
   - Charmeleon (stage1): `types: ['fire', 'normal']`
   - Charizard (stage2): `types: ['fire', 'flying', 'dragon']`
3. Em `squirtle-line.ts`:
   - Squirtle (base): `types: ['water', 'normal']`
   - Wartortle (stage1): `types: ['water', 'normal']`
   - Blastoise (stage2): `types: ['water', 'ice']`
4. Em `bulbasaur-line.ts`:
   - Bulbasaur (base): `types: ['grass', 'poison', 'normal']`
   - Ivysaur (stage1): `types: ['grass', 'poison', 'normal']`
   - Venusaur (stage2): `types: ['grass', 'poison', 'normal']`

**Validacao:** `npx tsc --noEmit` passa.

---

### US-009: Filtrar Held Items por Tipo do Pokemon (Prioridade 9)

**Arquivos:** `src/systems/UpgradeSystem.ts`, `src/data/items/upgrade-defs.ts`

**Mudancas:**
1. Em `upgrade-defs.ts`, adicionar campo `requiredType?: string` aos held items type-specific:
   - `itemCharcoal`: `requiredType: 'fire'`
   - `itemDragonFang`: `requiredType: 'dragon'`
   - `itemSharpBeak`: `requiredType: 'flying'`
   - Itens genericos (Choice Specs, Shell Bell, Scope Lens, Razor Claw, Leftovers, Quick Claw, Focus Band, Wide Lens): NAO adicionar requiredType (disponivel para todos)
   - NOTA: Se houver itens de water, grass, poison, ice, adicionar requiredType tambem.

2. Em `src/types.ts`, atualizar interface `UpgradeOption`:
   ```typescript
   requiredType?: string;
   ```

3. Em `UpgradeSystem.ts`, no metodo que monta o pool de held items:
   - Obter os types do form atual do player: `const formTypes = currentForm.types`
   - Filtrar: `if (item.requiredType && !formTypes.includes(item.requiredType)) continue;`

**Para obter o form atual:**
- O Player tem referencia ao form config. Verificar como `currentForm` e acessado no GameScene/Player.
- Provavelmente via `this.ctx.player.currentForm` ou similar.

**Validacao:** `npx tsc --noEmit` passa. Charmander nao ve Dragon Fang ate virar Charizard.

---

### US-010: Novo Held Item — Quick Powder (Prioridade 10)

**Arquivos:** `src/data/items/upgrade-defs.ts`, `src/systems/UpgradeSystem.ts`, `src/types.ts`, `src/scenes/BootScene.ts`, ataques que criam timers

**Mudancas:**

1. **Baixar sprite:** `curl -o public/assets/items/quick-powder.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-powder.png"`

2. **BootScene.ts:** Adicionar load do sprite:
   ```typescript
   this.load.image('item-quick-powder', 'assets/items/quick-powder.png');
   ```

3. **upgrade-defs.ts:** Adicionar novo upgrade:
   ```typescript
   itemQuickPowder: { id: 'itemQuickPowder', name: 'Quick Powder', description: '-8% cooldown de ataques', icon: 'item-quick-powder', color: 0x88ddff },
   ```

4. **types.ts:** Adicionar `quickPowder` ao HeldItemType (se existir union type) e adicionar `attackSpeedBonus: number` ao PlayerStats.

5. **UpgradeSystem.ts:**
   - Adicionar `quickPowder` ao pool de held items
   - No apply: `player.stats.attackSpeedBonus = (player.stats.attackSpeedBonus || 0) + 0.08`
   - Cap: max 3 stacks (0.24 total)

6. **Player.ts:** Inicializar `attackSpeedBonus: 0` nos stats.

7. **Todos os ataques com timer:** No construtor e no `upgrade()`, onde cria o timer event:
   ```typescript
   const speedMult = 1 - (this.player.stats.attackSpeedBonus || 0);
   const actualCooldown = Math.floor(this.cooldown * speedMult);
   this.timer = scene.time.addEvent({ delay: actualCooldown, loop: true, ... });
   ```
   NOTA: Isso requer modificar ~30+ ataques. Alternativa mais simples: criar um helper `getActualCooldown(player, baseCooldown)` em `src/utils/` e importar em cada ataque.

**Validacao:** `npx tsc --noEmit` passa. Quick Powder reduz cooldowns em 8% por stack.
