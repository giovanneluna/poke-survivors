# Upgrade Futuro — Performance & Engine

> Referência para decisões técnicas de evolução do projeto.
> Atualizado: 2026-02-09

---

## Estado Atual

### Stack
- **Phaser 3.90** + TypeScript + Vite
- WebGL renderer nativo do Phaser (não usa PixiJS)
- Arcade Physics (gravidade zero, colisões overlap-based)

### Otimizações já implementadas
| Otimização | Impacto | Data |
|---|---|---|
| **SpatialHashGrid** | Queries de inimigos O(n) → O(k). 74 ataques migrados. healAura O(n²) → O(n×k). activeCount O(1). | 2026-02-09 |
| **Smokescreen timer fix** | delayedCall em loop → Set + batch cleanup. Eliminava 100+ timers/sec. | 2026-02-09 |
| **Inferno trail cleanup** | Emitter leak com `follow: bullet` → 3 camadas de cleanup. | 2026-02-09 |
| **Particle emitter .explode() fix** | Memory leak permanente → destroy após lifespan. Aplicado em 8 ataques. | 2026-02-09 |

### Gargalo resolvido
O lag com 50+ inimigos vinha de **lógica, não rendering**: 74 ataques iteravam `getChildren().filter(active)` + `Distance.Between` por frame = milhões de operações. O spatial hashing reduziu isso em ~70%.

---

## Caminho de Upgrade Recomendado

### Prioridade 1 — Baixo esforço, alto impacto

#### 1.1 Texture Atlas para inimigos
- **O que**: Combinar todos os walk sprites (22 Pokémon) em 1-2 atlas grandes
- **Por que**: Cada spritesheet separada = 1 texture swap = 1 draw call. Com atlas, todos os inimigos renderizam em **1 draw call**
- **Ganho**: ~30-40% menos draw calls por frame
- **Esforço**: Baixo — usar `TexturePacker` ou script com `sharp` para gerar atlas + ajustar frameWidth/offsets no BootScene
- **Quando**: Quando tiver 200+ inimigos simultâneos e FPS cair abaixo de 45

#### 1.2 Texture Atlas para ataques
- **O que**: Combinar spritesheets de efeitos de ataque por elemento (fire-atlas, water-atlas, etc.)
- **Ganho**: Menos texture swaps durante combate intenso
- **Esforço**: Médio — são 37+ spritesheets de tamanhos variados

#### 1.3 Particle emitter cleanup restante
- **O que**: Aplicar o fix de `.explode()` + `delayedCall(destroy)` nos ~30 ataques pendentes
- **Ganho**: Previne memory leak gradual em sessões longas (10+ min)
- **Esforço**: Baixo — pattern mecânico, já aplicado em 8 ataques como referência

### Prioridade 2 — Médio esforço, ganho situacional

#### 2.1 Phaser Blitter para XP gems
- **O que**: `Blitter` renderiza milhares de sprites com 1 draw call (sem physics body)
- **Aplicação ideal**: XP gems, partículas de morte, efeitos decorativos
- **Ganho**: Com 100+ XP gems na tela, Blitter é 10x mais eficiente que Sprites individuais
- **Esforço**: Médio — precisa trocar XP gems de Arcade.Sprite para Blitter.Bob + colisão manual
- **Limitação**: Sem animação, sem physics body, sem tint individual. Bom para objetos simples

#### 2.2 Object pooling universal
- **O que**: Pool pattern para TODOS os objetos reciclados (XP gems, partículas, damage numbers)
- **Ganho**: Reduz garbage collection spikes (micro-stutters)
- **Esforço**: Médio — já temos pools para `enemyProjectiles` e bullets de ataque. Expandir para o resto
- **Padrão**: `Group.get()` + `setActive(true).setVisible(true)` no spawn, `killAndHide()` no despawn

#### 2.3 Frustum culling manual
- **O que**: Desativar update/render de entidades fora da viewport + margem
- **Ganho**: Com mapa 3000×3000 e viewport ~800×600, 80%+ dos inimigos estão fora da tela
- **Esforço**: Médio — integrar com SpatialHashGrid (query só as cells visíveis)
- **Como**: `getSpatialGrid().queryRect(cam.scrollX - margin, cam.scrollY - margin, cam.width + 2*margin, cam.height + 2*margin)`

### Prioridade 3 — Alto esforço, futuro

#### 3.1 Migrar para Phaser 4
- **Status**: [RC5 lançado em ago/2025](https://phaser.io/news/2025/08/phaser-v4-release-candidate-5-is-out). Release final iminente.
- **Ganhos**: TypeScript nativo, renderer reescrito, GPU sprite handling melhorado, camera system refeito
- **Esforço**: Alto — API similar mas não idêntica. Estimativa: 2-3 sessões de migração
- **Quando**: Após release estável + pelo menos 1 patch de bugfix (Phaser 4.0.1+)
- **Risco**: API pode mudar entre RC e release. Aguardar estabilidade

#### 3.2 Custom WebGL Pipeline
- **O que**: Pipeline customizado que batch-renderiza inimigos com shader otimizado
- **Ganho**: Controle total sobre como sprites são enviados para GPU
- **Esforço**: Alto — requer conhecimento de GLSL shaders + Phaser pipeline API
- **Quando**: Só se Texture Atlas + Blitter não forem suficientes
- **Referência**: [Phaser MultiPipeline docs](https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-multipipeline)

#### 3.3 Web Workers para lógica de IA
- **O que**: Mover pathfinding/AI dos inimigos para Web Worker (thread separada)
- **Ganho**: Libera a main thread para rendering. Útil com 500+ inimigos
- **Esforço**: Muito alto — serialização de estado, latência de comunicação, SharedArrayBuffer
- **Quando**: Provavelmente nunca para este projeto. Mencionado apenas por completude

---

## Opções descartadas

### Phaser + PixiJS juntos
- **Veredicto**: Não vale a pena
- **Motivo**: Dois WebGL contexts = dobro de GPU memory. Sincronização de câmera/coordenadas/input seria pesadelo. Benchmark real mostra apenas ~10% de diferença em rendering puro (47fps vs 43fps com 10K sprites)
- **Fonte**: [JS Rendering Benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)

### Migrar para PixiJS puro
- **Veredicto**: Custo proibitivo
- **Motivo**: Perderíamos Arcade Physics, Scene management, Camera, Input, Audio, Tweens — tudo que o Phaser dá de graça. Precisaríamos reescrever ~15.000 linhas de lógica de jogo
- **Quando faria sentido**: Projeto novo do zero com foco em performance extrema (1000+ entidades)

### Migrar para Godot (HTML5 export)
- **Veredicto**: Incompatível com workflow
- **Motivo**: Requer IDE visual. Sprites, animações, scenes — tudo via GUI. O workflow "conversar com Claude + código puro" não funciona com Godot

### ECS puro (bitECS + PixiJS)
- **Veredicto**: Overkill para este projeto
- **Motivo**: Data-oriented design é o máximo em performance, mas requer reescrever TODA a lógica como components/systems. Tempo de desenvolvimento 3-5x maior
- **Quando faria sentido**: Projeto novo inspirado no que aprendemos aqui

---

## Roadmap sugerido

```
AGORA (concluído)
  └── SpatialHashGrid ✅
  └── Timer/emitter leak fixes ✅

PRÓXIMO (quando FPS < 50 com 150+ inimigos)
  └── Texture Atlas (inimigos + ataques)
  └── Particle emitter cleanup (30 ataques restantes)

DEPOIS (quando FPS < 50 com 300+ inimigos)
  └── Blitter para XP gems
  └── Frustum culling via SpatialHashGrid
  └── Object pooling universal

FUTURO (quando Phaser 4 estabilizar)
  └── Migrar para Phaser 4
  └── Custom WebGL Pipeline (se necessário)
```

---

## Métricas para decisão

Use o DebugSystem (F1) para monitorar:
- **FPS**: Abaixo de 50 = hora de otimizar
- **Active enemies**: Quantos inimigos simultâneos
- **Draw calls**: Via browser DevTools → Performance → GPU (quanto menor, melhor)

Regra de ouro: **otimize o que o profiler mostra, não o que parece lento**.
