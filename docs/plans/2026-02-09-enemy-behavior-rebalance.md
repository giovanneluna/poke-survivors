# Enemy Behavior Rebalance — Melee-First Design

## Problema
14 de 38 inimigos regulares (37%) tinham ataques ranged (projéteis/beams). No Vampire Survivors, esse ratio é ~5-10%. Resultado: tela cheia de projéteis inimigos, gameplay virava "dodge" em vez de "mow down the horde".

## Decisão
- **Manter ranged**: Gastly, Haunter (Shadow Ball) + Drowzee, Hypno (Psychic)
- **Converter para melee**: 10 inimigos ganham comportamentos únicos
- **Bosses**: NÃO mudam (ataques especiais são parte da identidade)

## Arquitetura

### EnemyBehavior type
```typescript
type EnemyBehavior =
  | 'default' | 'charger' | 'swooper' | 'circler' | 'berserker'
  | 'dasher' | 'tank' | 'sporeWalker' | 'confuser' | 'healer' | 'teleporter';
```

### EnemyBehaviors.ts (novo arquivo)
Dispatcher central: `updateBehavior(enemy, player, delta)` com switch por behavior type.
Estado comportamental armazenado em `enemy.data` (Phaser DataManager).

### ContactEffect (novo tipo)
```typescript
interface ContactEffect {
  type: 'knockback' | 'drain' | 'poison' | 'stun' | 'confusion' | 'slow';
  force?: number;      // knockback
  amount?: number;     // drain
  duration?: number;   // stun, confusion, slow, poison
  dps?: number;        // poison
  factor?: number;     // slow multiplier
}
```

## 10 Comportamentos

### Grupo A — Movimentação Especial

| # | Behavior | Inimigo | Mecânica | Contato |
|---|----------|---------|----------|---------|
| 1 | charger | Geodude | Move 60% speed. A cada 4s: para 0.5s → carga reta 3x speed por 1.5s | Knockback 200px |
| 2 | swooper | Golbat | Move em arco sinusoidal. Pausa 0.8s a cada 3s | HP drain 3 |
| 3 | circler | Pidgeotto | Orbita player raio 160px, espirala 2px/s até contato, reset | Dano normal |
| 4 | dasher | Crobat | Move normal + dash 100px a cada 3s na dir do player | Poison 3s 2dps |
| 5 | teleporter | Alakazam | Move 40% speed. A cada 5s: fade out → reaparece atrás do player | Stun 1s |

### Grupo B — Efeito de Área/Contato

| # | Behavior | Inimigo | Mecânica | Contato |
|---|----------|---------|----------|---------|
| 6 | berserker | Cubone | Normal. HP<50%: speed ×2, dmg +50%, scale 1.15x | Dano aumentado |
| 7 | tank | Marowak | 50% speed, HP +50%. Corpo empurra inimigos menores | Stun 0.5s |
| 8 | sporeWalker | Venonat | Deixa spore a cada 0.5s (circle r20, dura 5s, 2dps poison). Pool max 30 | Poison 3s |
| 9 | confuser | Venomoth | Aura r80px. Player dentro 1.5s → confuso (inverte controles 2s, cd 8s) | Confusion imediata |
| 10 | healer | Butterfree | Lenta. Cura inimigos r100px 3HP/s (como Gloom). Foge do player | Slow 0.6x 2s |

## Mudanças por Arquivo

### Novos
- `src/systems/EnemyBehaviors.ts` — dispatcher + 10 behavior handlers

### Modificar tipos
- `src/types.ts` — adicionar `EnemyBehavior`, `ContactEffect`
- `src/types.ts` — campo `behavior?: EnemyBehavior` e `contactEffect?: ContactEffect` em EnemyConfig

### Modificar configs (remover attacks, adicionar behavior)
- `src/data/enemies/geodude.ts`
- `src/data/enemies/golbat.ts`
- `src/data/enemies/pidgeotto.ts`
- `src/data/enemies/cubone.ts`
- `src/data/enemies/crobat.ts`
- `src/data/enemies/marowak.ts`
- `src/data/enemies/venonat.ts`
- `src/data/enemies/venomoth.ts`
- `src/data/enemies/butterfree.ts`
- `src/data/enemies/alakazam.ts` (versão regular, NÃO boss)

### Integrar no game loop
- `src/systems/SpawnSystem.ts` — trocar `moveToward()` por `updateBehavior()` no update loop
- `src/entities/Player.ts` — handlers para novos contact effects (knockback, drain, confusion)
- `src/systems/CollisionSystem.ts` — aplicar contactEffect on enemy-player collision

## Ordem de Implementação
1. Tipos + EnemyBehaviors.ts (estrutura)
2. Integrar dispatcher no SpawnSystem
3. Implementar cada behavior (começar pelos simples: berserker, tank)
4. Implementar contact effects no Player/CollisionSystem
5. Atualizar 10 configs de inimigos (remover attacks, adicionar behavior)
6. Spore Walker pool (mais complexo)
7. Confuser aura (mais complexo)
8. TypeScript check + teste in-game com dev panel
