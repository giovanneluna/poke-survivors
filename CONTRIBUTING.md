# Contribuindo com Poké World Survivors

Obrigado por querer contribuir! Este guia te ajuda a começar rapidamente.

## Setup Local

```bash
# 1. Fork e clone
git clone https://github.com/SEU_USUARIO/poke-survivors.git
cd poke-survivors

# 2. Instale dependências
npm install

# 3. Rode o dev server
npm run dev
# Acesse http://localhost:8080

# 4. (Opcional) Desktop via Tauri — requer Rust
npm run tauri:dev
```

## Estrutura do Projeto

```
src/
├── attacks/       # 1 arquivo por ataque (implements Attack interface)
├── audio/         # SFX procedural (Web Audio API)
├── data/          # Configs de ataques, inimigos, itens, sprites
├── entities/      # Player, Enemy, Boss, Pickup
├── scenes/        # Boot, Title, Select, Game, UI
├── systems/       # Collision, Spawn, Pickup, SpatialHashGrid
├── config.ts      # Constantes globais
└── types.ts       # Tipos TypeScript

public/assets/     # Sprites, artwork, itens (estáticos)
```

## Como Contribuir

### 1. Reportar Bug
Abra uma [issue](https://github.com/giovanneluna/poke-survivors/issues/new?template=bug_report.md) com:
- O que aconteceu vs. o que deveria acontecer
- Passos para reproduzir
- Screenshot/GIF se possível

### 2. Sugerir Feature
Abra uma [issue](https://github.com/giovanneluna/poke-survivors/issues/new?template=feature_request.md) descrevendo a ideia.

### 3. Contribuir com Código

```bash
# Crie uma branch
git checkout -b feat/minha-feature

# Faça suas mudanças...

# Verifique tipos
npx tsc --noEmit

# Commit e push
git add .
git commit -m "feat: descrição curta"
git push origin feat/minha-feature
```

Abra um Pull Request no GitHub.

### 4. Contribuir com Arte/Sprites

Sprites de Pokémon devem seguir o formato PMDCollab (walk spritesheet, 8 direções). Veja [como adicionar sprites](#adicionando-um-novo-pokémon) abaixo.

## Guias Específicos

### Adicionando um Novo Ataque

1. **Registre** em `src/data/attacks/attack-registry.ts`
2. **Crie** o arquivo em `src/attacks/MeuAtaque.ts` (implements `Attack`)
3. **Registre** no `src/systems/AttackFactory.ts`
4. **Adicione** como upgrade em `src/data/items/upgrade-defs.ts`
5. **Carregue** sprites no `src/scenes/BootScene.ts`

Existem 6 padrões de ataque — escolha o mais parecido como template:
- **Projétil**: `Ember.ts`, `WaterGun.ts`
- **Cone/Melee**: `Scratch.ts`, `DragonBreath.ts`
- **Orbital**: `FireSpin.ts`, `RapidSpin.ts`
- **Aura/Passiva**: `Smokescreen.ts`, `Growl.ts`
- **Dash**: `FlameCharge.ts`, `AquaJet.ts`
- **Área/Ultimate**: `Hurricane.ts`, `FrenzyPlant.ts`

### Adicionando um Novo Pokémon (Inimigo)

1. **Baixe a sprite**:
   ```bash
   # Descubra o dex number (ex: Pikachu = 0025)
   curl -o public/assets/pokemon/pikachu-walk.png \
     "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0025/Walk-Anim.png"

   # OBRIGATÓRIO: Baixe AnimData.xml para dimensões corretas
   curl "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0025/AnimData.xml"
   ```
2. **Registre** a sprite em `src/data/sprites/enemies.ts`
3. **Carregue** no `src/scenes/BootScene.ts`
4. **Crie** config em `src/data/enemies/pikachu.ts`
5. **Adicione** na phase desejada em `src/data/enemies/phases/`

> **NUNCA** calcule dimensões de frame dividindo a imagem manualmente. Sempre use o `AnimData.xml`.

### Adicionando uma Nova Fase

Crie um arquivo em `src/data/enemies/phases/phase5.ts` seguindo o padrão:

```typescript
import type { PhaseConfig } from '../../../types';

export const PHASE5: PhaseConfig = {
  waves: [
    {
      enemies: [
        { type: 'pikachu', weight: 3 },
        { type: 'jigglypuff', weight: 1 },
      ],
      spawnRate: 300,
      maxEnemies: 25,
    },
    // ... mais waves
  ],
  bosses: [
    { type: 'raichu', timeSeconds: 180 },
  ],
};
```

## Regras de Código

### TypeScript Strict
- **Zero `any`** — use `unknown` + type guards
- **Tipagem explícita** em retornos e parâmetros
- **Sempre** rode `npx tsc --noEmit` antes de commitar

### Padrões Obrigatórios

```typescript
// Partículas — SEMPRE usar safeExplode (previne leak)
import { safeExplode } from '../utils/particles';
safeExplode(scene, x, y, 'fire-particle', { quantity: 10, lifespan: 300 });

// Body null safety — SEMPRE verificar
const body = enemy.body as Phaser.Physics.Arcade.Body | null;
if (body) body.setVelocity(0, 0);

// Queries de inimigos — NUNCA iterar getChildren(), usar SpatialHashGrid
import { getSpatialGrid } from '../systems/SpatialHashGrid';
const nearby = getSpatialGrid().queryRadius(x, y, radius);

// VFX — SEMPRE respeitar config de qualidade
import { shouldShowVfx } from '../systems/GraphicsSettings';
if (shouldShowVfx()) { /* partículas, trails */ }

// Pool de projéteis — SEMPRE setar textura ao reutilizar
const proj = enemyProjectiles.get(x, y);
proj.setTexture('minha-textura');
(proj.body as Phaser.Physics.Arcade.Body).reset(x, y);
```

## Convenções de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: novo ataque Thunder Shock
fix: projétil ficando preso na parede
art: sprite do Pikachu walk
balance: ajustar dano do Ember level 5-8
docs: atualizar README com nova fase
```

## Dúvidas?

- Abra uma [Discussion](https://github.com/giovanneluna/poke-survivors/discussions)
- Entre no [Discord](https://discord.gg/pFqPHV5zZ2)
