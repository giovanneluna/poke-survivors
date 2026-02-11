# New Enemies — Phase 3 & Phase 4

> Design doc para 12 novos Pokémon inimigos (4 P3 + 8 P4)
> Gerado via brainstorming session, 2026-02-11

---

## Resumo

| # | Pokémon | Fase | Behavior | Mecânica Única |
|---|---------|------|----------|----------------|
| 1 | Koffing | P3 | `deathCloud` | Nuvem de veneno ao morrer |
| 2 | Magnemite | P3 | `puller` | Puxa jogador magneticamente |
| 3 | Tentacool | P3 | `trapper` | Enraíza jogador ao contato |
| 4 | Rhyhorn | P3 | `rammer` | Carga em linha reta (não rastreia) |
| 5 | Weezing | P4 | `gasSpreader` | Trilha de gás + death cloud grande |
| 6 | Magneton | P4 | `pullerElite` | Pull forte + Thunder Wave stun |
| 7 | Tentacruel | P4 | `trapperElite` | Root longo + poison durante root |
| 8 | Rhydon | P4 | `rammer` | Carga dupla + destrói destrutíveis |
| 9 | Scyther | P4 | `slasher` | Dash ATRAVÉS do jogador |
| 10 | Mr. Mime | P4 | `shielder` | Escudo em aliados (invulnerabilidade) |
| 11 | Hitmonlee | P4 | `leaper` | Salto de longa distância + self-stun se erra |
| 12 | Electabuzz | P4 | `stunner` | Muito rápido + stun por contato |

---

## Novos Behavior Types

Adicionar ao `EnemyBehavior` union em `types.ts`:

```typescript
export type EnemyBehavior =
  | 'charger' | 'swooper' | 'circler' | 'berserker'
  | 'dasher' | 'tank' | 'sporeWalker' | 'confuser' | 'healer' | 'teleporter'
  // New P3+P4 behaviors:
  | 'deathCloud' | 'puller' | 'trapper' | 'rammer'
  | 'gasSpreader' | 'pullerElite' | 'trapperElite'
  | 'slasher' | 'shielder' | 'leaper' | 'stunner';
```

---

## Stats Detalhados

### Phase 3 Enemies

**Referência P3 existente**: HP 65-300, Speed 23-72, Damage 10-28, XP 13-80

#### 1. Koffing — `deathCloud`

```typescript
// src/data/enemies/koffing.ts
export const KOFFING: EnemyConfig = {
  name: 'koffing',
  hp: 100,
  speed: 30,
  damage: 12,
  xpValue: 50,
  scale: 1.1,
  sprite: SPRITES.koffing,
  types: ['poison'],
  behavior: 'deathCloud',
};
```

**Behavior spec:**
- Move lentamente em direção ao jogador (tank lento)
- **Ao morrer** (hook em `Enemy.kill()` ou evento `enemy-killed`):
  - Spawn circle/sprite na posição de morte
  - Cloud radius: 50px, duração: 4000ms
  - Dano: 4 DPS ao jogador dentro da cloud
  - Visual: Círculo roxo (0x9944cc, alpha 0.3) com fade-out nos últimos 1000ms
- **State keys**: Nenhum (morte é one-shot)
- **Padrão**: Similar ao sporeWalker mas triggered on death, not while alive
- **Pool**: Module-level `activeClouds` array (max 15), processado 1x/frame

#### 2. Magnemite — `puller`

```typescript
// src/data/enemies/magnemite.ts
export const MAGNEMITE: EnemyConfig = {
  name: 'magnemite',
  hp: 60,
  speed: 40,
  damage: 10,
  xpValue: 45,
  scale: 0.8,
  sprite: SPRITES.magnemite,
  types: ['electric', 'steel'],
  behavior: 'puller',
};
```

**Behavior spec:**
- Move normalmente em direção ao jogador
- **Cada frame**: aplica força de pull no jogador em direção ao Magnemite
  - Pull force: 15 pixels/s (suave mas perceptível)
  - Range: 150px (só puxa se dentro do range)
  - Múltiplos Magnemites STACKAM o pull
- **Implementação**: No update, calcular vetor (player→magnemite), normalizar, multiplicar por pullForce×(delta/1000), somar ao player velocity
- **State keys**: `pu_active` (init flag)
- **Visual**: Linha fina pulsante (0x44aaff) entre Magnemite e player quando puxando (VFX guard)

#### 3. Tentacool — `trapper`

```typescript
// src/data/enemies/tentacool.ts
export const TENTACOOL: EnemyConfig = {
  name: 'tentacool',
  hp: 70,
  speed: 45,
  damage: 10,
  xpValue: 50,
  scale: 1.0,
  sprite: SPRITES.tentacool,
  types: ['water', 'poison'],
  behavior: 'trapper',
  contactEffect: { type: 'stun', durationMs: 1500 },
};
```

**Behavior spec:**
- Move normalmente em direção ao jogador
- **Ao contato**: aplica "root" (usa stun de 1500ms via contactEffect)
- **Cooldown**: 8000ms entre roots (previne stun-lock)
- **State keys**: `tr_lastRoot` (timestamp do último root)
- **Visual**: Tentáculos brilham (tint 0x44ffaa) quando root está disponível (VFX guard)
- **Nota**: contactEffect `stun` de 1500ms serve como root — jogador não pode mover mas PODE atacar? Ou usamos stun completo? → Usar stun completo (mais simples, mais perigoso)

#### 4. Rhyhorn — `rammer`

```typescript
// src/data/enemies/rhyhorn.ts
export const RHYHORN: EnemyConfig = {
  name: 'rhyhorn',
  hp: 120,
  speed: 25,         // Speed base (idle). Charge usa override
  damage: 22,
  xpValue: 55,
  scale: 1.2,
  sprite: SPRITES.rhyhorn,
  types: ['ground', 'rock'],
  behavior: 'rammer',
  contactEffect: { type: 'knockback', durationMs: 300, force: 300 },
};
```

**Behavior spec:**
- **State machine**: idle → aiming → charging → recovering
  - `idle` (3-5s): Move em direção ao jogador a 60% speed
  - `aiming` (0.8s): Para, trava ângulo para posição ATUAL do jogador, tint vermelho (0xff4400)
  - `charging` (1.5s): Move em linha reta no ângulo travado a 250 speed (10x base!)
  - `recovering` (1s): Para, limpa tint, volta ao idle
- **State keys**: `rm_state` (0-3), `rm_next`, `rm_angle`, `rm_stateEnd`
- **Diferença do charger**: Charger (Geodude) rastreia o jogador durante a carga. Rammer NÃO rastreia — vai em linha reta.
- **Knockback**: Só durante estado `charging` (contactEffect active only in state 2)

---

### Phase 4 Enemies — Evoluções

**Referência P4 existente**: HP 60-90, Speed 50-80, Damage 12-15, XP 90-110
**NOTA**: Novos P4 devem ser mais threatening que os atuais (Alakazam/Electrode são relativamente fracos)

#### 5. Weezing — `gasSpreader`

```typescript
// src/data/enemies/weezing.ts
export const WEEZING: EnemyConfig = {
  name: 'weezing',
  hp: 180,
  speed: 25,
  damage: 15,
  xpValue: 100,
  scale: 1.3,
  sprite: SPRITES.weezing,
  types: ['poison'],
  behavior: 'gasSpreader',
};
```

**Behavior spec:**
- Move lentamente em direção ao jogador
- **Enquanto vivo**: A cada 3000ms, dropa uma mini nuvem de gás na posição atual
  - Mini cloud: radius 30px, duração 3000ms, 3 DPS
- **Ao morrer**: Death cloud grande (radius 70px, duração 6000ms, 5 DPS)
- **State keys**: `gs_nextDrop` (timestamp)
- **Pool**: Reutiliza o mesmo `activeClouds` array do deathCloud (max 20)
- **Visual**: Mini clouds verdes (0x44cc44), death cloud roxa grande (0x9944cc)
- **Diferença do Koffing**: Koffing SÓ tem death cloud. Weezing tem trail + death cloud maior.

#### 6. Magneton — `pullerElite`

```typescript
// src/data/enemies/magneton.ts
export const MAGNETON: EnemyConfig = {
  name: 'magneton',
  hp: 100,
  speed: 45,
  damage: 14,
  xpValue: 95,
  scale: 1.0,
  sprite: SPRITES.magneton,
  types: ['electric', 'steel'],
  behavior: 'pullerElite',
};
```

**Behavior spec:**
- Tudo do puller, MAIS:
  - Pull force: 30 pixels/s (2x Magnemite)
  - Range: 200px (maior)
  - A cada 5000ms: emite **Thunder Wave** — pulso visual que causa stun 0.3s no jogador se dentro de 120px
- **State keys**: `pe_active`, `pe_nextWave` (timestamp)
- **Visual**: Flash elétrico amarelo (0xffff44) ao emitir Thunder Wave (VFX guard)

#### 7. Tentacruel — `trapperElite`

```typescript
// src/data/enemies/tentacruel.ts
export const TENTACRUEL: EnemyConfig = {
  name: 'tentacruel',
  hp: 130,
  speed: 50,
  damage: 16,
  xpValue: 105,
  scale: 1.2,
  sprite: SPRITES.tentacruel,
  types: ['water', 'poison'],
  behavior: 'trapperElite',
  contactEffect: { type: 'stun', durationMs: 2500 },
};
```

**Behavior spec:**
- Move em direção ao jogador
- **Ao contato**: Root (stun) de 2500ms + aplica poison (4 DPS durante o stun)
- **Cooldown**: 5000ms (vs 8000ms do Tentacool)
- **State keys**: `te_lastRoot`
- **Poison durante root**: Ao aplicar stun, também dispara `player.applyPoison(4, 2500)`
- **Visual**: Tentáculos vermelhos brilhantes quando root disponível (0xff4444)

#### 8. Rhydon — `rammer` (enhanced)

```typescript
// src/data/enemies/rhydon.ts
export const RHYDON: EnemyConfig = {
  name: 'rhydon',
  hp: 250,
  speed: 20,
  damage: 35,
  xpValue: 110,
  scale: 1.4,
  sprite: SPRITES.rhydon,
  types: ['ground', 'rock'],
  behavior: 'rammer',
  contactEffect: { type: 'knockback', durationMs: 500, force: 400 },
};
```

**Behavior spec:**
- Mesmo rammer do Rhyhorn, mas:
  - Charge speed: 300 (vs 250)
  - Pode fazer **2 cargas seguidas** (charge → 0.3s pause → charge novamente)
  - Idle time entre ciclos: 4s
- **Distinção via stats**: Rammer behavior checa HP para determinar variante (Rhydon HP > 200 → double charge)
- **Destrutíveis**: Durante charge, destrói rocks/bushes no caminho (emitir evento)

---

### Phase 4 Enemies — Únicos

#### 9. Scyther — `slasher`

```typescript
// src/data/enemies/scyther.ts
export const SCYTHER: EnemyConfig = {
  name: 'scyther',
  hp: 80,
  speed: 55,
  damage: 25,
  xpValue: 100,
  scale: 1.1,
  sprite: SPRITES.scyther,
  types: ['bug', 'flying'],
  behavior: 'slasher',
};
```

**Behavior spec:**
- **State machine**: orbiting → winding → slashing → returning
  - `orbiting` (3-4s): Mantém distância de 120-180px do jogador (não se aproxima, não foge)
  - `winding` (0.5s): Para, trava ângulo, tint vermelho (0xff2222), brief flash
  - `slashing` (0.4s): Dash a 400 speed ATRAVÉS do jogador — continua além (total ~200px de percurso)
  - `returning` (1.5s): Volta andando para distância de orbiting
- **Dano**: SOMENTE durante `slashing` state (alto dano 25 apenas no momento certo)
- **State keys**: `sl_state` (0-3), `sl_next`, `sl_angle`, `sl_stateEnd`
- **Diferença do dasher**: Dasher (Crobat) dá um burst de velocidade MAS persegue o jogador. Slasher vai em linha reta ALÉM do jogador (passa through).
- **Visual**: Trail de linhas verdes (0x44ff44) durante slash (VFX guard)

#### 10. Mr. Mime — `shielder`

```typescript
// src/data/enemies/mr-mime.ts
export const MR_MIME: EnemyConfig = {
  name: 'mr-mime',
  hp: 60,
  speed: 35,
  damage: 8,
  xpValue: 120,     // Alto XP porque é support priority target
  scale: 1.0,
  sprite: SPRITES.mrMime,
  types: ['psychic', 'fairy'],
  behavior: 'shielder',
};
```

**Behavior spec:**
- Move em direção ao jogador (devagar, frágil)
- **A cada 6000ms**: Seleciona o inimigo aliado **mais próximo** (queryNearest via SpatialHashGrid)
  - Aplica "shield" no aliado: `enemy.data.set('shielded', true)` + `enemy.data.set('shieldEnd', time + 3000)`
  - Aliado shielded é **invulnerável** (checkar em `Enemy.takeDamage()`: if shielded, return 0)
  - Visual: Brilho azul (tint 0x4488ff) no aliado protegido (VFX guard)
- **State keys**: `sh_nextShield` (timestamp)
- **Shield check no Enemy.takeDamage()**:
  ```typescript
  if (this.data.get('shielded') && time < this.data.get('shieldEnd')) return 0;
  ```
- **Prioridade de kill**: Jogador aprende rapidamente que Mr. Mime deve morrer PRIMEIRO
- **Limites**: Não pode shieldar bosses. Não pode shieldar a si mesmo.

#### 11. Hitmonlee — `leaper`

```typescript
// src/data/enemies/hitmonlee.ts
export const HITMONLEE: EnemyConfig = {
  name: 'hitmonlee',
  hp: 90,
  speed: 30,
  damage: 40,        // Muito alto! Mas pode ser evitado
  xpValue: 100,
  scale: 1.1,
  sprite: SPRITES.hitmonlee,
  types: ['fighting'],
  behavior: 'leaper',
};
```

**Behavior spec:**
- **State machine**: stalking → windup → leaping → (landing | stunned)
  - `stalking` (3-5s): Mantém distância de 200-250px do jogador (similar ao orbiting do slasher mas mais longe)
  - `windup` (0.6s): Para, agacha (scaleY 0.8), tint amarelo (0xffcc00)
  - `leaping` (0.3s): Salta até posição ATUAL do jogador (arc tween: y -= 40px → y target)
  - `landing`: Se jogador está dentro de 30px: dano massivo (40) + knockback. Se não: `stunned`
  - `stunned` (2s): Hitmonlee fica parado, tint cinza (0x888888), vulnerável
- **State keys**: `lp_state` (0-4), `lp_next`, `lp_targetX`, `lp_targetY`, `lp_stateEnd`
- **Risk/Reward**:
  - Jogador pode "bait" o salto e desviar → Hitmonlee stunado = free kill window
  - Se não desvia → 40 dano = ~40-50% da vida do jogador (brutal)
- **Visual**: Shadow circle no chão durante leap (VFX guard), flash de impacto se acerta

#### 12. Electabuzz — `stunner`

```typescript
// src/data/enemies/electabuzz.ts
export const ELECTABUZZ: EnemyConfig = {
  name: 'electabuzz',
  hp: 100,
  speed: 85,         // Muito rápido! Quase tão rápido quanto Crobat (120)
  damage: 15,
  xpValue: 95,
  scale: 1.1,
  sprite: SPRITES.electabuzz,
  types: ['electric'],
  behavior: 'stunner',
  contactEffect: { type: 'stun', durationMs: 500 },
};
```

**Behavior spec:**
- Move MUITO rápido em direção ao jogador (speed 85)
- **Ao contato**: Stun de 500ms (via contactEffect)
- **Após stunnar**: Recua rapidamente (move na direção oposta por 1500ms)
- **Cooldown de retreat**: Após recuar, volta a perseguir
- **State keys**: `st_retreating` (bool), `st_retreatEnd` (timestamp)
- **Padrão**: Hit-and-run. Toca → stun → foge → volta → repete
- **Perigo**: 500ms de stun é curto, mas se 2-3 Electabuzz atacam em sequência, os stuns encadeiam = morte certa
- **Visual**: Faísca elétrica ao stunnar (flash amarelo 0xffff00 no player, VFX guard)

---

## Sprites Necessários

Todos os sprites devem ser baixados do PMDCollab. **AnimData.xml é source of truth para frame dimensions.**

| Pokémon | Dex# | PMDCollab URL |
|---------|------|---------------|
| Koffing | 0109 | `sprite/0109/Walk-Anim.png` |
| Magnemite | 0081 | `sprite/0081/Walk-Anim.png` |
| Tentacool | 0072 | `sprite/0072/Walk-Anim.png` |
| Rhyhorn | 0111 | `sprite/0111/Walk-Anim.png` |
| Weezing | 0110 | `sprite/0110/Walk-Anim.png` |
| Magneton | 0082 | `sprite/0082/Walk-Anim.png` |
| Tentacruel | 0073 | `sprite/0073/Walk-Anim.png` |
| Rhydon | 0112 | `sprite/0112/Walk-Anim.png` |
| Scyther | 0123 | `sprite/0123/Walk-Anim.png` |
| Mr. Mime | 0122 | `sprite/0122/Walk-Anim.png` |
| Hitmonlee | 0106 | `sprite/0106/Walk-Anim.png` |
| Electabuzz | 0125 | `sprite/0125/Walk-Anim.png` |

**Download command template:**
```bash
curl -o public/assets/pokemon/{name}-walk.png \
  "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{DEX}/Walk-Anim.png"
curl -o /tmp/{name}-animdata.xml \
  "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{DEX}/AnimData.xml"
```

---

## Wave Distribution

### Phase 3 — Novos inimigos entram gradualmente

Koffing e Magnemite entram nas waves iniciais do P3.
Tentacool e Rhyhorn entram no meio do P3.

**Sugestão de inserção** (adicionar aos waves existentes):
- Waves 40-45: Introduzir Koffing (peso 1) e Magnemite (peso 1)
- Waves 46-50: Adicionar Tentacool (peso 1)
- Waves 51-55: Adicionar Rhyhorn (peso 1), aumentar pesos dos anteriores
- Waves 56-59: Todos 4 presentes com pesos moderados

### Phase 4 — Evoluções substituem bases, únicos entram depois

**Sugestão de inserção:**
- Waves 60-63: Weezing e Magneton substituem aparições de Koffing/Magnemite
- Waves 64-67: Tentacruel e Rhydon aparecem; Scyther introduzido
- Waves 68-71: Mr. Mime e Hitmonlee aparecem
- Waves 72-75: Electabuzz introduzido; todos presentes
- Waves 76-79: Full roster de elite com pesos altos

---

## Implementação — Ordem Sugerida

### Batch 1: Behavior Engine (EnemyBehaviors.ts)
1. Adicionar novos types ao union `EnemyBehavior`
2. Implementar `deathCloud` behavior + cloud pool
3. Implementar `puller` behavior
4. Implementar `trapper` behavior (reutiliza contactEffect stun)
5. Implementar `rammer` behavior (state machine similar ao charger)

### Batch 2: Elite Behaviors
6. Implementar `gasSpreader` (extends deathCloud)
7. Implementar `pullerElite` (extends puller)
8. Implementar `trapperElite` (reutiliza contactEffect + poison)
9. Estender `rammer` para double-charge (Rhydon HP > 200)

### Batch 3: Unique Behaviors
10. Implementar `slasher` (state machine 4 estados)
11. Implementar `shielder` (SpatialHashGrid query + shield data)
12. Implementar `leaper` (state machine + arc tween)
13. Implementar `stunner` (retreat logic + contactEffect)

### Batch 4: Enemy Configs + Sprites
14. Baixar 12 sprites + AnimData.xml
15. Adicionar SPRITES configs em `enemies.ts`
16. Criar 12 arquivos de config em `src/data/enemies/`
17. Registrar no `index.ts`
18. Carregar no `BootScene`

### Batch 5: Wave Integration
19. Adicionar novos inimigos às waves do Phase 3
20. Adicionar novos inimigos às waves do Phase 4
21. Testar balance (spawn rates, pesos)

### Batch 6: Shield System
22. Adicionar check de `shielded` em `Enemy.takeDamage()`
23. Visual feedback do shield (tint + clear)

---

## Notas de Implementação

### Death Cloud Pool (deathCloud + gasSpreader)
- Similar ao `activeSpores` do sporeWalker
- Module-level array `activeClouds: CloudData[]`
- `processDeathClouds()` chamado 1x/frame pelo SpawnSystem
- Cada cloud: `{ x, y, radius, dps, endTime, circle?: Graphics }`
- Max 20 clouds simultâneas
- VFX guard para círculos visuais

### Pull Force (puller + pullerElite)
- Implementar em updateBehavior ANTES do player.update
- Acumular pull vectors de todos pullers ativos
- Aplicar como offset no player velocity
- Cap máximo: 60 pixels/s (evitar pull instantâneo)
- **CUIDADO**: Não mover player diretamente! Usar `player.body.velocity.add()`

### Shield System (shielder)
- Checar em `Enemy.takeDamage()`:
  ```typescript
  const shieldEnd = this.data.get('shieldEnd') as number | undefined;
  if (shieldEnd && this.scene.time.now < shieldEnd) {
    // Show blocked visual
    return 0;
  }
  ```
- Shield NÃO persiste entre frames — cada frame o shielded enemy checa timestamp
- Mr. Mime morrendo NÃO remove shields existentes (eles expiram naturalmente)

### Leaper Arc (leaper)
- Simular arco com tween no Y:
  ```typescript
  scene.tweens.add({
    targets: enemy,
    x: targetX, y: targetY,
    duration: 300,
    ease: 'Quad.Out',
    onUpdate: (tween) => {
      // Arc: enemy goes up then down
      const progress = tween.progress;
      const arcHeight = 40;
      const arc = Math.sin(progress * Math.PI) * arcHeight;
      enemy.y -= arc * (delta / 16); // approximate
    }
  });
  ```
  NOTA: Implementação real precisa ser mais cuidadosa com o arc.
  Alternativa mais simples: usar 2 tweens sequenciais (up + down).
