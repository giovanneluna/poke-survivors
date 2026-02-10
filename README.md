# Poké World Survivors

> Vampire Survivors clone com tema Pokémon. Phaser 3.90 + TypeScript + Vite.

---

## Sumário

- [Setup](#setup)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Funcionam os Ataques](#como-funcionam-os-ataques)
- [Fontes de Sprites](#fontes-de-sprites)
- [Como Adicionar um Novo Ataque](#como-adicionar-um-novo-ataque)
- [Como Ajustar Dano, Tamanho e Cooldown](#como-ajustar-dano-tamanho-e-cooldown)
- [Sistema de Evoluções](#sistema-de-evoluções)
- [Inimigos e Fases](#inimigos-e-fases)
- [Regras Importantes](#regras-importantes)

---

## Setup

```bash
npm install
npm run dev        # Dev server (http://localhost:8080)
npm run build      # Build de produção
npm run tauri:dev  # Versão desktop (requer Rust)
```

---

## Estrutura do Projeto

```
src/
├── attacks/          # 77 ataques (1 arquivo por ataque)
├── audio/            # SFX procedural (Web Audio API)
├── data/
│   ├── attacks/      # Registry, categorias, evoluções
│   ├── enemies/      # Config individual + phases/
│   ├── items/        # Upgrade definitions
│   └── sprites/      # Config de spritesheets (starters, enemies)
├── entities/         # Player, Enemy, Boss, Pickup, Destructible
├── scenes/           # Boot, Title, Select, Game, UI, Pokedex, Showcase
├── systems/          # CollisionSystem, SpawnSystem, PickupSystem, etc.
├── ui/               # MiniMap, componentes de HUD
├── utils/            # particles.ts (safeExplode)
├── config.ts         # Constantes globais
└── types.ts          # Tipos TypeScript

public/assets/
├── artwork/          # Artwork oficial (PokeAPI) — tela título
├── attacks/          # Spritesheets de ataques (pokemonAutoChess)
│   ├── fire/         # Ataques de fogo
│   ├── water/        # Ataques de água
│   ├── ice/          # Ataques de gelo
│   ├── dragon/       # Ataques dragão
│   ├── grass/        # Ataques grama
│   ├── poison/       # Ataques veneno
│   └── ...           # (15+ subpastas por tipo)
├── items/            # Sprites de itens (PokeAPI)
└── pokemon/          # Walk sprites (PMDCollab)
```

---

## Como Funcionam os Ataques

Todo ataque implementa a interface `Attack`:

```typescript
interface Attack {
  readonly type: string;   // Chave única (ex: 'ember', 'waterGun')
  level: number;           // Nível atual (1-8)
  update(time: number, delta: number): void;   // Chamado todo frame
  upgrade(): void;         // Chamado ao subir de nível
  destroy(): void;         // Cleanup
}
```

### Categorias de Ataque

Existem **6 padrões** principais. Cada novo ataque segue um destes:

#### 1. Projétil (ex: Ember, Water Gun)
Dispara no inimigo mais próximo. Usa um pool de sprites interno (`scene.physics.add.group`).

```
Exemplo: src/attacks/Ember.ts
- Cria pool de bullets (maxSize: 40)
- Timer dispara a cada `cooldown` ms
- Bullet viaja até o alvo com physics.moveToObject()
- CollisionSystem detecta overlap → dano
```

#### 2. Cone / Melee (ex: Scratch, Dragon Breath)
Dano em arco na direção do movimento. Calcula ângulo entre player e inimigo.

```
Exemplo: src/attacks/Scratch.ts
- Timer dispara animação na direção do jogador
- update() verifica inimigos no arco (90°) a cada frame
- Set de UIDs previne dano duplicado no mesmo swing
- Sprite segue o jogador durante a animação
```

#### 3. Orbital (ex: Fire Spin, Rapid Spin)
Sprites orbitam ao redor do jogador com ciclo ativo/cooldown.

```
Exemplo: src/attacks/FireSpin.ts
- Cria N orbes com physics body circular
- update() atualiza posição orbital (seno/cosseno)
- CollisionSystem detecta overlap → dano (via setupOrbitalCollisions)
- Ciclo: 3s ativo → 4s cooldown → repete
```

#### 4. Aura / Passiva (ex: Smokescreen, Growl, Withdraw)
Efeito contínuo ao redor do jogador. Sem cooldown de ativação.

```
Exemplo: src/attacks/Smokescreen.ts
- Nuvens visuais orbitam o player
- Timer de tick (500ms) aplica slow em inimigos no raio
- Sem projétil — tudo é calculado por distância
```

#### 5. Dash Direcional (ex: Flame Charge, Aqua Jet)
Sprite direcional que se estende do jogador. Usa sistema de 4 direções.

```
Exemplo: src/attacks/FlameCharge.ts
- angleToCardinal() → up/down/left/right
- Sprite `atk-flame-charge-${dir}` com origin na borda do jogador
- Segue o jogador durante a animação
- Inimigos na hitbox tomam dano + pushback
```

#### 6. Área / Ultimate (ex: Hurricane, Frenzy Plant, Surf)
AoE em posição específica com efeitos de crowd control.

```
Exemplo: src/attacks/Hurricane.ts
- Spawna tornado na posição do inimigo mais perto
- Timer de tick (200ms) puxa + causa dano em raio
- Visual: sprite animado + partículas de vento
- Cleanup automático após duração
```

---

## Fontes de Sprites

### Pokémon (walk/idle) — PMDCollab

| O quê | URL |
|-------|-----|
| Repositório | https://github.com/PMDCollab/SpriteCollab |
| Explorer Visual | https://sprites.pmdcollab.org/#/ |
| Walk sprite | `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{DEX}/Walk-Anim.png` |
| AnimData.xml | `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/{DEX}/AnimData.xml` |

**Dex numbers**: Bulbasaur=0001, Charmander=0004, Squirtle=0007, Pikachu=0025, Mew=0151...

**Pasta local**: `public/assets/pokemon/`

**Como baixar um novo Pokémon:**

```bash
# 1. Descubra o dex number (ex: Pikachu = 0025)

# 2. Baixe o Walk sprite
curl -o public/assets/pokemon/pikachu-walk.png \
  "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0025/Walk-Anim.png"

# 3. OBRIGATÓRIO: Baixe o AnimData.xml para saber as dimensões corretas
curl "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0025/AnimData.xml"
```

No `AnimData.xml`, procure a seção `<Anim>` com `<Name>Walk</Name>`:

```xml
<Anim>
  <Name>Walk</Name>
  <FrameWidth>32</FrameWidth>    <!-- largura de cada frame -->
  <FrameHeight>32</FrameHeight>  <!-- altura de cada frame -->
  <Durations>
    <Duration>8</Duration>       <!-- conte quantos <Duration> = número de frames -->
    <Duration>8</Duration>
    <Duration>8</Duration>
    <Duration>8</Duration>
  </Durations>
</Anim>
```

**NUNCA calcule dimensões dividindo a imagem manualmente** — os frames podem ter padding. Sempre use o AnimData.xml.

Depois, registre em `src/data/sprites/enemies.ts` ou `starters.ts` e carregue no `BootScene`.

### Ataques — pokemonAutoChess

| O quê | URL |
|-------|-----|
| Repositório | https://github.com/keldaanCommunity/pokemonAutoChess |
| Abilities (ataques) | `app/public/src/assets/abilities{tps}/{NOME}/` |
| Attacks (genéricos) | `app/public/src/assets/attacks{tps}/{TIPO}/{subtipo}/` |

**Subtipos**: `cell` (chão), `hit` (impacto), `melee` (corpo a corpo), `range` (projétil)

**Pasta local**: `public/assets/attacks/{tipo}/`

**Como baixar um novo ataque:**

```bash
# 1. Descubra o nome exato (ex: THUNDER_SHOCK tem frames 000.png a 009.png)

# 2. Baixe os frames individuais
mkdir -p /tmp/thunder-shock
for i in $(seq 0 9); do
  f=$(printf "%03d" $i)
  curl -o "/tmp/thunder-shock/${f}.png" \
    "https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/main/app/public/src/assets/abilities%7Btps%7D/THUNDER_SHOCK/${f}.png"
done

# 3. Monte uma spritesheet horizontal com sharp (instalar temporariamente)
npm i -D sharp
node -e "
const sharp = require('sharp');
// ... montar frames lado a lado horizontalmente
// salvar como public/assets/attacks/electric/thunder-shock-sheet.png
"
npm uninstall sharp
```

> **340+ ataques disponíveis** no repo pokemonAutoChess. Exemplos: `WATER_GUN`, `HYDRO_PUMP`, `THUNDER`, `RAZOR_LEAF`, `SHADOW_BALL`, `PSYCHIC`, etc.

### Itens — PokeAPI

| O quê | URL |
|-------|-----|
| Sprites | `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/{nome-do-item}.png` |
| Lista de itens | https://pokeapi.co/api/v2/item/ |
| Alternativa HD | https://github.com/msikma/pokesprite |

**Pasta local**: `public/assets/items/`

```bash
# Baixar um item (nome em kebab-case)
curl -o public/assets/items/choice-band.png \
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/choice-band.png"
```

### Artwork Oficial — PokeAPI

```bash
# Artwork grande para tela título
curl -o public/assets/artwork/pikachu.png \
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
```

### Sites Úteis de Referência

| Site | O que tem |
|------|-----------|
| https://sprites.pmdcollab.org/#/ | Explorer visual PMDCollab (busca por nome, ver anims) |
| https://www.spriters-resource.com/ | Sprites ripped de jogos oficiais |
| https://pokeapi.co/ | API completa de dados Pokémon |

---

## Como Adicionar um Novo Ataque

### Passo 1: Registrar no attack-registry

**Arquivo**: `src/data/attacks/attack-registry.ts`

```typescript
meuAtaque: {
  key: 'meuAtaque',
  name: 'Meu Ataque',
  description: 'Descrição curta',
  baseDamage: 15,      // Dano base no level 1
  baseCooldown: 2000,   // Milissegundos entre ativações
  element: 'fire',      // fire, water, grass, ice, dragon, flying, normal, poison, etc.
  maxLevel: 8,
  minForm: 'base',      // base, stage1, stage2 (qual evolução necessária)
},
```

### Passo 2: Criar o arquivo do ataque

**Arquivo**: `src/attacks/MeuAtaque.ts`

Escolha um dos templates abaixo como base. Aqui um **projétil simples**:

```typescript
import Phaser from 'phaser';
import type { Attack, ArcadeGroup } from '../types';
import { ATTACKS } from '../config';
import type { Player } from '../entities/Player';
import { setDamageSource } from '../systems/DamageTracker';
import { getSpatialGrid } from '../systems/SpatialHashGrid';

export class MeuAtaque implements Attack {
  readonly type = 'meuAtaque' as const;
  level = 1;

  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private timer: Phaser.Time.TimerEvent;
  private damage: number;
  private cooldown: number;

  constructor(scene: Phaser.Scene, player: Player, _enemyGroup: ArcadeGroup) {
    this.scene = scene;
    this.player = player;
    this.damage = ATTACKS.meuAtaque.baseDamage;
    this.cooldown = ATTACKS.meuAtaque.baseCooldown;

    this.timer = scene.time.addEvent({
      delay: this.cooldown, loop: true,
      callback: () => this.fire(),
    });
  }

  private fire(): void {
    // Encontra inimigo mais próximo
    const nearest = getSpatialGrid().queryNearest(
      this.player.x, this.player.y, 300
    );
    if (!nearest) return;

    // Causar dano
    setDamageSource(this.type);
    const killed = nearest.takeDamage(this.damage);
    if (killed) {
      this.scene.events.emit('cone-attack-kill', nearest.x, nearest.y, nearest.xpValue);
    }
  }

  update(_time: number, _delta: number): void {}

  upgrade(): void {
    this.level++;
    this.damage += 5;                                     // +5 dano por level
    this.cooldown = Math.max(500, this.cooldown - 100);   // -100ms cooldown (min 500ms)
    this.timer.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.cooldown, loop: true,
      callback: () => this.fire(),
    });
  }

  destroy(): void { this.timer.destroy(); }
}
```

### Passo 3: Registrar no AttackFactory

**Arquivo**: `src/systems/AttackFactory.ts`

```typescript
import { MeuAtaque } from '../attacks/MeuAtaque';

// Dentro do switch/mapa:
case 'meuAtaque': return new MeuAtaque(scene, player, enemyGroup);
```

### Passo 4: Registrar no UpgradeSystem

**Arquivo**: `src/data/items/upgrade-defs.ts` — adicionar entrada para o ataque aparecer como opção de level-up.

### Passo 5: Carregar sprites no BootScene

**Arquivo**: `src/scenes/BootScene.ts`

```typescript
// Spritesheet de ataque
this.load.spritesheet('atk-meu-ataque', 'assets/attacks/fire/meu-ataque-sheet.png', {
  frameWidth: 32, frameHeight: 32,
});

// Depois, criar animação:
this.anims.create({
  key: 'anim-meu-ataque',
  frames: this.anims.generateFrameNumbers('atk-meu-ataque', { start: 0, end: 7 }),
  frameRate: 15,
  repeat: 0,
});
```

---

## Como Ajustar Dano, Tamanho e Cooldown

### Valores Base (attack-registry)

Edite `src/data/attacks/attack-registry.ts`:

```typescript
ember: {
  baseDamage: 10,      // Dano no level 1
  baseCooldown: 1200,  // 1.2 segundos entre tiros
  // ...
},
```

### Escalamento por Level (método upgrade)

Cada ataque tem seu `upgrade()` que define o quanto cresce por level. Exemplo do `Scratch.ts`:

```typescript
upgrade(): void {
  this.level++;
  this.damage += 4;                                     // +4 dano por level
  this.range += 5;                                      // +5px de alcance por level
  this.cooldown = Math.max(300, this.cooldown - 40);    // -40ms cooldown (mín 300ms)
  // Recriar timer com novo cooldown
  this.timer.destroy();
  this.timer = this.scene.time.addEvent({
    delay: this.cooldown, loop: true,
    callback: () => this.swipe(),
  });
}
```

### Propriedades Comuns e Onde Ajustá-las

| Propriedade | Onde fica | Exemplo |
|-------------|-----------|---------|
| `baseDamage` | `attack-registry.ts` | `baseDamage: 15` |
| `baseCooldown` | `attack-registry.ts` | `baseCooldown: 2000` (ms) |
| `damage += X` | `upgrade()` no arquivo .ts | `this.damage += 5` → +5 por level |
| `cooldown` | `upgrade()` no arquivo .ts | `Math.max(500, this.cooldown - 100)` |
| `range` / `radius` | Propriedade privada no .ts | `private radius = 70` |
| `knockbackForce` | Propriedade privada no .ts | `private knockbackForce = 200` |
| `stunDuration` | Propriedade privada no .ts | `private stunDuration = 1200` (ms) |
| `projectileCount` | Propriedade privada no .ts | `private projectileCount = 1` |
| `scale` (visual) | No `setScale()` do sprite | `sprite.setScale(1.5)` |
| `hitbox` | No `body.setCircle()` | `body.setCircle(12)` |

### Exemplo: Tornar um Ataque Maior

```typescript
// No construtor ou upgrade():
this.radius = 100;           // Raio de detecção de inimigos (px)

// Visual maior:
sprite.setScale(2.0);        // 2x o tamanho original

// Hitbox maior (para orbitais/projéteis):
const body = sprite.body as Phaser.Physics.Arcade.Body;
body.setCircle(20);           // Raio do corpo de colisão
```

### Exemplo: Escalar Dano para Late-Game

```typescript
// Ataque fraco e rápido (spam):
baseDamage: 5, baseCooldown: 400   // DPS: 12.5/s

// Ataque forte e lento (nuke):
baseDamage: 60, baseCooldown: 10000  // DPS: 6/s, mas one-shot potential

// No upgrade(), dano agressivo:
this.damage += 12;   // Para ultimates (Blast Burn, Frenzy Plant)
this.damage += 3;    // Para ataques rápidos (Fire Spin, Bubble)
```

---

## Sistema de Evoluções

Ataques evoluem quando: nível máximo (8) + item held + forma evolutiva.

**Arquivo**: `src/data/attacks/evolutions.ts`

```typescript
{
  baseAttack: 'ember',           // Ataque base que evolui
  requiredLevel: 8,              // Precisa estar no nível 8
  requiredItem: 'charcoal',      // Precisa segurar o item Charcoal
  requiredForm: 'stage1',        // Precisa ter evoluído (Charmeleon)
  evolvedAttack: 'inferno',      // Transforma em Inferno
  name: 'Inferno',
  description: 'Ember evolui! Bolas explosivas!',
  icon: 'item-fire-stone',
  color: 0xff4400,
},
```

### Cadeia de Evolução (Starters)

```
Charmander (base) → Charmeleon (stage1) → Charizard (stage2)
  Ember    → Inferno        (Charmeleon + Charcoal)
  Scratch  → Fury Swipes    (Charmeleon + Razor Claw)
  Fire Spin → Fire Blast    (Charmeleon + Wide Lens)
  Flamethrower → Blast Burn (Charizard + Choice Specs)
  Dragon Breath → Dragon Pulse (Charizard + Dragon Fang)
```

---

## Inimigos e Fases

### Arquivo de Config de Inimigo

`src/data/enemies/{nome}.ts` — cada inimigo tem:

```typescript
export const ENEMY_CONFIG = {
  key: 'rattata',
  hp: 15,
  speed: 60,
  damage: 8,            // Dano de contato
  xpValue: 5,           // XP ao morrer
  spriteKey: 'rattata',
  // Opcional:
  ranged: { ... },       // Ataques à distância
  behavior: 'charger',   // Comportamento especial
  contactEffect: 'slow', // Efeito ao tocar o player
};
```

### Fases (Waves)

`src/data/enemies/phases/phase1.ts` até `phase4.ts`:

```typescript
export const PHASE1: PhaseConfig = {
  waves: [
    // Wave 1 (0:00): apenas Rattata e Pidgey
    {
      enemies: [
        { type: 'rattata', weight: 3 },   // 75% chance
        { type: 'pidgey', weight: 1 },     // 25% chance
      ],
      spawnRate: 300,      // 1 inimigo a cada 300ms
      maxEnemies: 20,      // Máximo 20 vivos simultaneamente
    },
    // ... mais waves
  ],
  bosses: [
    { type: 'raticate', timeSeconds: 180 },  // Boss aos 3:00
  ],
};
```

| Propriedade | Efeito |
|-------------|--------|
| `weight` | Peso relativo no spawn (maior = mais frequente) |
| `spawnRate` | Milissegundos entre spawns (menor = mais rápido) |
| `maxEnemies` | Limite de inimigos vivos na tela |

---

## Regras Importantes

### 1. Particle Emitter Leak

```typescript
// ERRADO — o emitter nunca é destruído!
scene.add.particles(x, y, 'fire-particle', { ... }).explode();

// CERTO — usar o helper safeExplode
import { safeExplode } from '../utils/particles';
safeExplode(scene, x, y, 'fire-particle', { quantity: 10, lifespan: 300 });
```

### 2. Body Null Safety

Ao acessar `enemy.body` para stun/slow/knockback, SEMPRE verificar null:

```typescript
// ERRADO — crash se inimigo morreu durante iteração
const body = enemy.body as Phaser.Physics.Arcade.Body;
body.setVelocity(0, 0);

// CERTO
const body = enemy.body as Phaser.Physics.Arcade.Body | null;
if (body) {
  body.setVelocity(0, 0);
}
```

### 3. Pool Compartilhado de Projéteis Inimigos

`enemyProjectiles` é um Group compartilhado. Ao obter um sprite do pool:

```typescript
const proj = enemyProjectiles.get(x, y);
// OBRIGATÓRIO — senão herda textura do último inimigo que usou:
proj.setTexture('shadow-ball');
(proj.body as Phaser.Physics.Arcade.Body).reset(x, y);
proj.play('anim-shadow-ball');
```

### 4. VFX Guard

Todo efeito visual (trails, partículas, círculos) deve respeitar a config de qualidade:

```typescript
import { shouldShowVfx } from '../systems/GraphicsSettings';

if (shouldShowVfx()) {
  // partículas, trails, etc.
}
```

### 5. SpatialHashGrid para Queries

Nunca iterar `enemyGroup.getChildren()` para encontrar inimigos. Usar o grid:

```typescript
import { getSpatialGrid } from '../systems/SpatialHashGrid';

// Inimigos em raio
const nearby = getSpatialGrid().queryRadius(x, y, radius);

// Inimigo mais próximo
const nearest = getSpatialGrid().queryNearest(x, y, maxDist);

// Todos os inimigos ativos
const all = getSpatialGrid().getActiveEnemies();
```

### 6. Kill Tracking

Quando um ataque mata diretamente (sem passar pelo CollisionSystem), emitir:

```typescript
this.scene.events.emit('cone-attack-kill', enemy.x, enemy.y, enemy.xpValue);
```

### 7. Proibições TypeScript

- **NUNCA** usar `any` — use `unknown` + type guards
- **SEMPRE** tipar retornos e parâmetros explicitamente
- **NUNCA** usar assets externos que precisem de CORS proxy

---

## Starters Implementados

| Starter | Status | Ataques | Passiva |
|---------|--------|---------|---------|
| Charmander → Charmeleon → Charizard | Completo | 26 | Blaze (burn) |
| Squirtle → Wartortle → Blastoise | Completo | 26 | Torrent (wet/slow) |
| Bulbasaur → Ivysaur → Venusaur | Completo | 26 | Overgrow (poison) |

---
