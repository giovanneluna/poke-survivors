<p align="center">
  <img src="public/assets/artwork/charmander.png" width="80" alt="Charmander">
  <img src="public/assets/artwork/squirtle.png" width="80" alt="Squirtle">
  <img src="public/assets/artwork/bulbasaur.png" width="80" alt="Bulbasaur">
</p>

<h1 align="center">Poké World Survivors</h1>

<p align="center">
  <strong>Um clone de Vampire Survivors com tema Pokémon — open source e feito por diversão!</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Phaser-3.90-8B5CF6?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PC9zdmc+" alt="Phaser 3">
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC131?logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/github/stars/giovanneluna/poke-survivors?style=social" alt="Stars">
</p>

<p align="center">
  <!-- TODO: Substituir por GIF real do gameplay -->
  <em>Escolha seu starter, sobreviva a hordas de Pokémon selvagens, derrote bosses e evolua!</em>
</p>

---

## O que é?

Poké World Survivors combina a mecânica de **Vampire Survivors** com o universo **Pokémon**. Escolha entre Charmander, Squirtle ou Bulbasaur, enfrente waves de inimigos, colete XP, desbloqueie ataques icônicos e evolua seu Pokémon até a forma final.

### Destaques

- **3 starters jogáveis** com cadeia evolutiva completa (base → stage1 → stage2)
- **77 ataques** fiéis ao universo Pokémon (Ember, Water Gun, Razor Leaf, Dragon Pulse...)
- **8 fases** com 20+ waves cada, bosses únicos e dificuldade progressiva
- **Sistema de evolução de ataques** — combine nível máximo + held item + forma evolutiva
- **Gacha box** — drops de bosses com recompensas aleatórias
- **80+ Pokémon** com sprites animadas de walk (PMDCollab)
- **SFX 100% procedural** via Web Audio API — zero arquivos de áudio
- **Desktop nativo** via Tauri (Windows) + versão web

---

## Screenshots

<!-- TODO: Adicionar screenshots reais aqui -->
<!-- ![Gameplay](docs/screenshots/gameplay.png) -->
<!-- ![Boss Fight](docs/screenshots/boss.png) -->
<!-- ![Level Up](docs/screenshots/levelup.png) -->

> Ajude-nos a adicionar screenshots! Jogue e tire prints interessantes.

---

## Jogar

### Web (mais rápido)

```bash
git clone https://github.com/giovanneluna/poke-survivors.git
cd poke-survivors
npm install
npm run dev
```

Acesse `http://localhost:8080` no navegador.

### Desktop (Tauri — requer Rust)

```bash
npm run tauri:dev    # Dev com hot reload
npm run tauri:build  # Build executável
```

---

## Contribuir

**Estamos procurando colaboradores!** Artistas, devs TypeScript/Phaser, game designers — toda ajuda conta.

Veja o [**CONTRIBUTING.md**](CONTRIBUTING.md) para o guia completo.

### O que mais precisamos

| Tipo | Exemplos | Dificuldade |
|------|----------|-------------|
| Sprites/Arte | Novos Pokémon, tilesets, efeitos | Variada |
| Ataques | Implementar novos ataques (77 feitos, 340+ disponíveis) | Média |
| Inimigos | Novos wild Pokémon e bosses | Média |
| Balanceamento | Testar e ajustar dano, cooldowns, spawn rates | Fácil |
| UI/UX | Melhorar menus, HUD, overlays | Média |
| QA | Testar, reportar bugs, sugerir melhorias | Fácil |

Procure issues com label [`good first issue`](https://github.com/giovanneluna/poke-survivors/labels/good%20first%20issue) para começar!

---

## Arquitetura

```
src/
├── attacks/          # 77 ataques (1 arquivo por ataque, implementa interface Attack)
├── audio/            # SFX procedural (Web Audio API, zero arquivos)
├── data/
│   ├── attacks/      # Registry, categorias, evoluções
│   ├── enemies/      # Config individual + phases/ (8 fases)
│   ├── items/        # Definições de upgrades e held items
│   └── sprites/      # Config de spritesheets (starters, enemies)
├── entities/         # Player, Enemy, Boss, Pickup, Destructible
├── scenes/           # Boot → Title → Select → Game + UI + Pokedex
├── systems/          # Collision, Spawn, Pickup, SpatialHashGrid
├── ui/               # MiniMap, VirtualJoystick, HUD
├── config.ts         # Constantes globais
└── types.ts          # Tipos TypeScript
```

**Fluxo de cenas:** `BootScene` (carrega tudo) → `TitleScene` → `SelectScene` → `GameScene` + `UIScene` (paralelas)

**Padrões principais:**
- Ataques implementam `interface Attack { type, level, update(), upgrade(), destroy() }`
- Inimigos usam `SpatialHashGrid` para queries de proximidade O(1)
- Projéteis inimigos compartilham pool `enemyProjectiles` (maxSize: 60)
- Qualidade gráfica configurável via `shouldShowVfx()` guard

---

## Fontes dos Assets

| Recurso | Fonte | Uso |
|---------|-------|-----|
| Sprites de walk (80+) | [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) | Pokémon jogáveis e inimigos |
| Sprites de ataques (340+) | [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) | Projéteis e efeitos |
| Sprites de itens | [PokeAPI/sprites](https://github.com/PokeAPI/sprites) | Upgrades e held items |
| Artwork oficial | [PokeAPI/sprites](https://github.com/PokeAPI/sprites) | Tela título e seleção |

> Este é um projeto fan-made, sem fins comerciais. Pokémon pertence a Nintendo/Game Freak/The Pokémon Company.

---

## Tech Stack

| Tecnologia | Versão | Por quê |
|------------|--------|---------|
| [Phaser 3](https://phaser.io/) | 3.90 | Game framework robusto com physics Arcade |
| [TypeScript](https://www.typescriptlang.org/) | 5.7 | Strict mode, zero `any` |
| [Vite](https://vitejs.dev/) | 6.3 | HMR instantâneo, build rápido |
| [Tauri](https://tauri.app/) | 2.x | Desktop nativo com bundle leve (~10MB) |

---

## Comunidade

- [Discord](https://discord.gg/pFqPHV5zZ2) — Chat, ideias, showcase
- [Issues](https://github.com/giovanneluna/poke-survivors/issues) — Bugs e feature requests
- [Discussions](https://github.com/giovanneluna/poke-survivors/discussions) — Perguntas e ideias gerais

---

## License

[MIT](LICENSE) — use, modifique e distribua livremente.

> Pokémon e todos os nomes relacionados são marcas registradas de Nintendo/Game Freak/The Pokémon Company. Este projeto é fan-made e não possui afiliação oficial.
