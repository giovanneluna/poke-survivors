# Plano: Brainstorming — Novas Features & Melhorias para Poké World Survivors

## Contexto
O jogo já tem uma base sólida: 3 starters (Charmander/Squirtle completos, Bulbasaur parcial), 26 ataques por starter com evoluções, 13 bosses com multi-ataques, sistema de gacha, berries com buffs, dificuldade seletiva, e SFX procedural. Após análise do gênero bullet heaven (Vampire Survivors, Brotato, Soulstone Survivors, Halls of Torment) e mecânicas core de Pokémon, identificamos **lacunas críticas** que separam o jogo de uma experiência viciante e completa.

**Filosofia**: O que torna Vampire Survivors viciante é o **Variable Reward Schedule** (cada level-up é uma slot machine), a **Power Fantasy** (começar fraco e terminar destruindo tudo), e a **Meta-Progressão** (sempre há algo para desbloquear). O que torna Pokémon especial é **Type Effectiveness**, **Evolução**, e **Coleção/Pokédex**. A fusão desses dois mundos é o objetivo.

---

## TIER S — Game-Changers (Alto Impacto)

### S1. Type Effectiveness System
**Por que**: A mecânica MAIS icônica de Pokémon está ausente. Adicionar tipo-efetividade transforma a escolha de starter de cosmética → estratégica.

**Design**:
- Cada ataque já tem `element: ElementType` no registry
- Cada inimigo ganha um `type: ElementType` (Geodude=rock, Gastly=ghost, Oddish=grass, etc.)
- Multiplicadores: Super Effective = 1.5x, Not Very Effective = 0.5x, Immune = 0x (ghost vs normal)
- **Visual**: Texto flutuante "Super Effective!" (verde) ou "Not Very Effective..." (cinza) acima do inimigo
- **Áudio**: SFX diferente para super effective (satisfatório!) vs NVE (som abafado)
- **Simplificado**: Usar tabela reduzida (fire/water/grass/ice/normal/dragon/flying/rock/ground/poison/ghost/psychic/fighting/bug/dark) com as interações mais conhecidas

**Impacto no gameplay**: Jogador de Charmander destrói Oddish/Caterpie (grass/bug) mas sofre contra Geodude (rock). Squirtle domina Geodude mas sofre com Oddish. Isso cria **runs diferentes para cada starter** naturalmente.

**Arquivos**: `src/data/type-chart.ts` (novo), `src/entities/Enemy.ts` (aplicar multiplier em `takeDamage`), `src/data/enemies/*.ts` (adicionar `type` field), UI floating text

---

### S2. Meta-Progressão Persistente (Coins + PowerUps)
**Por que**: Sem meta-progressão, não há razão para jogar de novo após morrer. No Vampire Survivors, CADA run te deixa mais forte permanentemente.

**Design**:
- **Moeda**: PokéDollars (₽) — ganhos ao final de cada run baseado em kills, tempo, e dificuldade
- **PowerUp Menu** (acessível da SelectScene):
  - +5 HP Máximo (custo crescente: 100₽, 200₽, 400₽...)
  - +0.5 HP Regen (mesma escalada)
  - +5% Velocidade
  - +10% XP Gain
  - +10% Magnet Range
  - +1 Revival (max 3)
  - +5% Damage
  - +1 Reroll no level-up (max 5)
- **Persistência**: `localStorage` para salvar coins + upgrades comprados
- **Visual**: Menu estilo Pokémon Center com o Professor Oak explicando upgrades

**Impacto**: Cada run tem propósito mesmo se morrer em 2 minutos. Acumular moedas cria o loop "mais uma run".

**Arquivos**: `src/data/meta-progression.ts` (novo), `src/scenes/PowerUpScene.ts` (novo), `src/systems/SaveSystem.ts` (novo), integrar bonuses no `Player.ts` constructor

---

### S3. Death Screen + Run Statistics
**Por que**: Sem tela de morte, o jogo simplesmente... para. O jogador não tem closure nem feedback. VS mostra stats detalhados que motivam "superar o recorde".

**Design**:
- **Game Over Overlay** na UIScene (semi-transparente sobre o freeze do jogo):
  - Tempo sobrevivido (destaque se for recorde!)
  - Total de kills (com breakdown por tipo de inimigo)
  - Dano total causado
  - Ataques usados (ícones com level final)
  - Bosses derrotados
  - Berries coletadas
  - Level alcançado + forma final do Pokémon
  - PokéDollars ganhos (com animação de contagem)
- **Botões**: "Tentar Novamente" | "Menu Principal"
- **Record tracking**: Best time, best kills, best level em localStorage

**Arquivos**: `src/scenes/UIScene.ts` (overlay de game over), `src/systems/StatsTracker.ts` (novo — acumula stats durante a run), `src/systems/SaveSystem.ts`

---

### S4. Pokédex como Sistema de Achievements
**Por que**: Pokémon = coleção. Um Pokédex que registra cada inimigo derrotado cria um objetivo de longo prazo que incentiva experimentar todos os starters e dificuldades.

**Design**:
- **Pokédex Scene** (acessível do menu principal):
  - Grid de silhuetas (estilo Gen 1) — reveladas ao derrotar o inimigo pela 1ª vez
  - Cada entrada mostra: nome, tipo, HP, sprite animado, flavor text, vezes derrotado
  - Bosses têm página especial com todos os ataques documentados
  - Progresso: "32/47 Pokémon Descobertos"
- **Rewards por milestones**:
  - 10 Pokémon → Desbloqueia Eevee como starter jogável
  - 25 Pokémon → Desbloqueia mapa "Mt. Moon" (cave theme)
  - 40 Pokémon → Desbloqueia dificuldade "Nightmare"
  - 47/47 → Desbloqueia Mew como starter secreto
- **Persistência**: localStorage via SaveSystem

**Arquivos**: `src/scenes/PokedexScene.ts` (novo), `src/data/pokedex-entries.ts` (novo), `src/systems/SaveSystem.ts`

---

## TIER A — Features Importantes

### A1. Mega Evolution / Z-Move (Ultimate Ability)
**Por que**: O pico da power fantasy. No VS, a evolução de arma é esse momento. Aqui, Mega Evolução é o equivalente temático perfeito.

**Design**:
- **Mega Gauge**: Barra que enche com kills (500 kills = full)
- **Ativação**: Toque duplo no sprite do jogador (touch) ou tecla Space
- **Efeito** (15 segundos):
  - Sprite muda para Mega (Mega Charizard X/Y, Mega Blastoise, Mega Venusaur)
  - TODOS os ataques disparam 2x mais rápido
  - Dano +50%
  - Invencibilidade por 3s iniciais
  - Aura visual pulsante (dourada)
  - Tela treme levemente durante a transformação
- **Alternativa Z-Move**: Se Mega é complexo demais, implementar como ataque único devastador que limpa a tela (como "Item Crash" do VS)

**Arquivos**: `src/systems/MegaSystem.ts` (novo), sprites de Mega no BootScene, UI gauge na UIScene

---

### A2. Map Events & Encounters Especiais
**Por que**: Após 5 minutos, o jogo fica monótono se só tem "andar e matar". Eventos quebram a monotonia e criam momentos memoráveis.

**Design — eventos cronometrados + aleatórios**:

| Evento | Quando | Efeito |
|--------|--------|--------|
| **Rattata Horde** | 2:00 | Círculo de 25 Rattatas (já planejado) |
| **Pokémon Center** | A cada 3 min | Zona de cura que aparece por 15s no mapa |
| **Treasure Room** | Aleatório (5% por wave) | Sala de baús com 3-5 chests mas guardada por elite |
| **Legendary Sighting** | 8:00+ | Mew aparece como inimigo que foge — se derrotado, drop épico |
| **Swarm** | Aleatório | Um tipo específico spawna em massa por 20s (ex: 50 Zubats) |
| **Eclipse** | 6:00 | Tela escurece por 30s, Ghost types ganham +50% damage |
| **Professor Oak's Lab** | 4:00 | Pokeball gigante cai — free evolution stone ou held item raro |

**Visual**: Warning banner no topo "EVENT: Legendary Sighting!" com som dramático

**Arquivos**: `src/systems/EventSystem.ts` (novo), integrar no SpawnSystem e GameScene

---

### A3. Sistema de Música Procedural (BGM)
**Por que**: SFX já existe via Web Audio. Música muda COMPLETAMENTE a atmosfera. Sem música o jogo parece incompleto.

**Design**:
- Usar Web Audio API existente (SoundManager) para gerar loops musicais
- **3 tracks adaptativos**:
  - **Calm** (poucos inimigos): Notas simples de piano, tempo lento, 4 notas em loop
  - **Battle** (muitos inimigos): Drums mais rápidos, bass line, melodia energética
  - **Boss**: Tema dramático com notas graves + staccato rápido
- **Transição suave**: Crossfade entre tracks baseado em `activeEnemyCount` e `isBossAlive`
- **Referência**: Trilha de Pokémon Red/Blue em 8-bit — escalas pentatônicas simples

**Arquivos**: `src/audio/MusicManager.ts` (novo), integrar no GameScene

---

### A4. Visual Juice — Combos, Kill Streaks, Feedback
**Por que**: "Game feel" é 50% da diversão. Cada kill deve ser SATISFATÓRIA.

**Design**:
- **Kill Streak Counter**: "10x COMBO!" crescendo no canto da tela, reseta após 2s sem kill
  - 10x → texto branco
  - 25x → texto amarelo + glow
  - 50x → texto dourado + screen flash
  - 100x → texto vermelho + screen shake + "POKÉMASTER!"
- **Damage Numbers Empilhados**: Ao atingir muitos inimigos de uma vez, números sobem em cascata
- **Screen Shake**: Já existe para Crabhammer crit — expandir para:
  - Kill streak 25+ → micro shake
  - Boss kill → shake forte
  - Mega Evolution ativação → shake + flash branco
- **Level Up Ceremony**: Ao upar de nível, breve flash dourado + partículas + som satisfatório
- **Evolution Cutscene**: Tela escurece, sprite brilha, "What? Charmander is evolving!" texto, sprite muda com flash

**Arquivos**: `src/systems/ComboSystem.ts` (novo), `src/scenes/UIScene.ts`, `src/scenes/GameScene.ts`

---

## TIER B — Nice to Have

### B1. Companion Pokémon (Pet System)
**Design**: Ao derrotar um boss, chance de ele dropar um "Friend Ball". Usar a Friend Ball recruta um Pokémon selvagem como companheiro que orbita o jogador e dispara 1 ataque automático. Máximo 2 companheiros.

### B2. Skill Tree (Talent System)
**Design**: Árvore de habilidades entre-runs. 3 ramos por starter (ataque, defesa, utilidade). Ex: "Fire Mastery → +10% burn chance", "Water Mastery → +15% slow duration". Usa PokéDollars.

### B3. Daily Challenge
**Design**: Seed fixa por dia com modificadores (ex: "Speedrun — 5 min, todos enemies 2x speed"). Leaderboard local.

### B4. Mini-Map
**Design**: Canto superior direito, 100x100px, mostra pontos vermelhos (inimigos), dourado (boss), verde (berries), azul (eventos).

### B5. Mais Mapas
**Design**: "Route 1" (atual, grassland), "Mt. Moon" (cave, mais Ghost/Rock), "Seafoam Islands" (ice, mais Ice/Water), "Pokémon Tower" (dark, mais Ghost/Psychic). Cada mapa favorece um starter diferente (tipo-efetividade!).

### B6. Eevee como Starter Universal
**Design**: Eevee começa com Tackle + Swift. Ao evoluir, escolhe entre Flareon/Vaporeon/Jolteon baseado nos itens coletados (Fire Stone → Flareon, etc.). Cada eeveelução tem pool de ataques próprio.

---

## Ordem de Implementação — Mescla Otimizada

> Princípio: Cada passo entrega valor jogável imediato. Dependências respeitadas (SaveSystem vem primeiro, pois 4 features dependem dele).

### Fase 1: Infraestrutura + Game Feel (Fundação)
> _Objetivo: O jogo passa a ter "fechamento" e ser satisfatório de jogar_

| # | Feature | Esforço | Impacto |
|---|---------|---------|---------|
| 1 | **SaveSystem** (localStorage persistence) | Pequeno | Habilita tudo abaixo |
| 2 | **StatsTracker** (acumula kills, dano, tempo) | Pequeno | Base para Death Screen |
| 3 | **S3. Death Screen + Run Stats** | Médio | Fecha o game loop |
| 4 | **A4. Visual Juice** (Combo Counter + Kill Streaks + Evolution Cutscene) | Médio | Game feel 10x melhor |
| 5 | **B4. Mini-Map** | Pequeno | QoL urgente (pedido do user) |

**Entregável**: Ao morrer, o jogador vê seus stats, combos durante o jogo são satisfatórios, mini-mapa mostra o que vem.

### Fase 2: Meta-Progressão + Identidade Pokémon
> _Objetivo: O jogador tem RAZÃO para jogar de novo E o jogo parece Pokémon_

| # | Feature | Esforço | Impacto |
|---|---------|---------|---------|
| 6 | **S2. Meta-Progressão** (PokéDollars + PowerUp Menu) | Grande | "Mais uma run" loop |
| 7 | **S1. Type Effectiveness** | Médio | Identidade Pokémon + estratégia |
| 8 | **S4. Pokédex** (coleção + milestones) | Médio | Objetivo de longo prazo |

**Entregável**: Jogador ganha moedas, compra upgrades permanentes, vê vantagem/desvantagem de tipo, coleta Pokédex entries.

### Fase 3: Momentos Épicos + Atmosfera
> _Objetivo: O jogo surpreende e tem personalidade sonora_

| # | Feature | Esforço | Impacto |
|---|---------|---------|---------|
| 9 | **A2. Map Events** (7 eventos especiais) | Grande | Quebra monotonia |
| 10 | **A1. Mega Evolution** (ultimate power-up) | Grande | Power fantasy PEAK |
| 11 | **A3. Música Procedural** (3 tracks adaptativas) | Médio | Atmosfera completa |

**Entregável**: Eventos surpresa durante a run, Mega Evolution como momento épico, música que escala com a ação.

### Fase 4: Companion System
> _Objetivo: Feature diferencial que nenhum outro bullet heaven tem com esse charm_

| # | Feature | Esforço | Impacto |
|---|---------|---------|---------|
| 12 | **B1. Companion Pokémon** (Pet System) | Grande | Diferencial + charm |

**Detalhamento do Companion System**:
- **Aquisição**: Boss drop "Friend Ball" (20% chance)
- **Seleção**: Ao usar Friend Ball, escolher entre 3 Pokémon aleatórios da Pokédex descoberta
- **Comportamento**: Companheiro orbita o jogador (raio 80px) e dispara 1 ataque automático
  - Cada companion tem 1 tipo de ataque baseado no seu tipo (fire companion → Ember, water → Water Gun, etc.)
  - Dano escala com nível do jogador (10% do dano base do ataque)
- **Evolução**: Companion evolui junto com o player (base→stage1→stage2)
  - Quando jogador evolui, companion ganha +50% dano e novo sprite
- **Limite**: Máximo 2 companions simultâneos
- **Visual**: Sprite menor (0.6x scale), sombra abaixo, leve bob animation
- **Persistência na run**: Companion sobrevive até o fim da run (não entre runs)

**Arquivos novos**: `src/systems/CompanionSystem.ts`, `src/entities/Companion.ts`
**Modificar**: `src/entities/Boss.ts` (Friend Ball drop), `src/scenes/UIScene.ts` (companion HUD icons), `src/scenes/GameScene.ts` (companion update loop)

---

## Verificação
1. Cada feature deve ser testável isoladamente via ShowcaseScene ou debug flags
2. TypeScript strict: `npx tsc --noEmit` zero erros após cada sprint
3. Performance: manter 60fps com todas as features ativas (profile com DevTools)
4. Save system: testar localStorage persistence entre reloads
5. Mobile: todas as features devem funcionar com virtual joystick
6. Vite build: `npx vite build` sem erros

## Fontes de Referência
- [The Secret Sauce of Vampire Survivors](https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors)
- [Power Fantasy Through Rapid Escalation](https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors)
- [Best Bullet Heaven Games](https://rogueliker.com/bullet-heaven-games-like-vampire-survivors/)
- [Vampire Survivors Evolution System](https://vampire-survivors.fandom.com/wiki/Evolution)
- [Pokémon Type Chart](https://www.serebii.net/games/mechanics.shtml)
