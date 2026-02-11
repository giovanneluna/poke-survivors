# Ralph Agent — Poké World Survivors

You are an autonomous coding agent working on **Poké World Survivors**, a Vampire Survivors clone with Pokémon theme built with Phaser 3.90 + TypeScript + Vite.

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`
2. Read the progress log at `scripts/ralph/progress.txt` (check **Codebase Patterns** section first)
3. Stay on the current branch. Do NOT create or switch branches. Do NOT run any git commands.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `npx tsc --noEmit`
7. **NEVER COMMIT.** The user handles all git commits manually. Do NOT run `git commit`, `git add`, or any git commands.
8. Update the PRD to set `passes: true` for the completed story
9. Append your progress to `scripts/ralph/progress.txt`

---

## CRITICAL RULES (MUST FOLLOW)

### 1. Particle Emitter Leak
`scene.add.particles(...).explode()` does NOT auto-destroy the emitter!
**ALWAYS use**: `safeExplode(scene, x, y, key, config)` from `src/utils/particles.ts`
```typescript
import { safeExplode } from '../utils/particles';
safeExplode(this.scene, x, y, 'fire-particle', { speed: 100, quantity: 5 });
```

### 2. enemy.body Null Guard
Enemy bodies can be null during iteration (enemy destroyed mid-frame).
**ALWAYS**: Cast as `Body | null` and check before accessing:
```typescript
const body = enemy.body as Phaser.Physics.Arcade.Body | null;
if (!body) return; // or continue in loops
body.velocity.set(0, 0);
```

### 3. Shared Projectile Pool
`enemyProjectiles` is a shared Group across ALL enemies. `Group.get()` recycles sprites WITHOUT changing texture.
**ALWAYS call** when getting from pool:
```typescript
const proj = this.enemyProjectiles.get(x, y);
if (!proj) return;
proj.setTexture(textureKey);
(proj.body as Phaser.Physics.Arcade.Body).reset(x, y);
proj.play(animKey);
```

### 4. VFX Guard
All visual effects (trails, circles, emitters) must check settings:
```typescript
import { shouldShowVfx } from '../systems/GraphicsSettings';
if (shouldShowVfx()) {
  // create trail, circle, emitter, etc.
}
```

### 5. No delayedCall in Loops
NEVER create `scene.time.delayedCall()` inside periodic update loops — this causes timer leaks.
**FIX**: Use Set/Map to track state + 1 fixed timer for batch cleanup.

### 6. SpatialHashGrid for Enemy Queries
NEVER iterate all enemies manually. Use the spatial hash grid:
```typescript
import { getSpatialGrid } from '../systems/SpatialHashGrid';
const grid = getSpatialGrid();
const nearby = grid.queryRadius(x, y, radius);
// or
const nearest = grid.queryNearest(x, y, maxDist);
```

### 7. TypeScript Strict
- NEVER use `any` — use `unknown` + type guards
- All parameters and return types must be explicit

---

## Project Architecture (Quick Reference)

- **Scene flow**: `BootScene` → `TitleScene` → `SelectScene` → `GameScene` + `UIScene`
- **Attacks**: Implement interface `Attack` with { type, level, update, upgrade, destroy }
- **Config**: `src/config.ts` (game constants, sprite configs, attack configs)
- **Types**: `src/types.ts` (shared TypeScript types)
- **Enemies**: `src/data/enemies/` (individual configs) + `src/data/enemies/phases/phase1.ts` (wave definitions)
- **Starters**: Charmander (26 attacks, Blaze passive), Squirtle (26 attacks, Torrent passive)
- **Passives**: `src/systems/PassiveSystem.ts` — singleton via `getPassive()`, chokepoint in `Enemy.takeDamage()`
- **Enemy behaviors**: `src/systems/EnemyBehaviors.ts` — 10 behavior types (charger, swooper, circler, etc.)

### Key Systems
| System | File | Purpose |
|--------|------|---------|
| SpatialHashGrid | `src/systems/SpatialHashGrid.ts` | O(1) enemy spatial queries |
| GraphicsSettings | `src/systems/GraphicsSettings.ts` | Quality + VFX slider |
| CollisionSystem | `src/systems/CollisionSystem.ts` | All collision handlers |
| SpawnSystem | `src/systems/SpawnSystem.ts` | Enemy wave spawning |
| PickupSystem | `src/systems/PickupSystem.ts` | Drops, coins, berries |
| PassiveSystem | `src/systems/PassiveSystem.ts` | Blaze/Torrent passives |
| EventSystem | `src/systems/EventSystem.ts` | In-game events (PokéCenter, Swarm, etc.) |
| DamageTracker | `src/systems/DamageTracker.ts` | Per-attack damage stats |

### Asset Sources
- **Walk sprites**: PMDCollab (`public/assets/pokemon/`)
- **Attack sprites**: pokemonAutoChess (`public/assets/attacks/`)
- **Item sprites**: PokeAPI (`public/assets/items/`)
- **Procedural textures**: Generated in `BootScene.generateTextures()`

---

## Progress Report Format

APPEND to `scripts/ralph/progress.txt` (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
---
```

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of progress.txt.

---

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete, reply with:
<promise>COMPLETE</promise>

If there are still incomplete stories, end your response normally.

## Important

- Work on ONE story per iteration
- **NEVER COMMIT** — the user handles all git operations manually. No `git commit`, `git add`, `git push`.
- Keep typecheck green (`npx tsc --noEmit`)
- Read the Codebase Patterns section in progress.txt before starting
- Follow existing code patterns in the codebase
