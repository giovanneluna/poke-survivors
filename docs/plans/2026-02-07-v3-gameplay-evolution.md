# Poké Survivors V3 - Gameplay Evolution Plan

## 1. Fix XP Gems voando longe
- Reduzir offset do scatter de ±15 para ±8
- XP gems grandes (de objetos destrutíveis) = +5 XP com visual maior

## 2. Ataques de Inimigos
| Inimigo | Ataque | Comportamento |
|---------|--------|---------------|
| Gastly | Shadow Ball | Projétil lento que persegue o player (homing), cooldown 3s |
| Geodude | Rock Throw | Projétil reto na direção do player, cooldown 4s |
| Zubat | Supersonic | Onda que desacelera o player por 1.5s, cooldown 5s |
| Rattata/Pidgey | Nenhum | Apenas corpo-a-corpo (mantém como está) |

## 3. Sistema de Evolução de Ataques (VS-style)
### Held Items (Passivos)
| Item | Efeito Passivo | Evolução que desbloqueia |
|------|---------------|--------------------------|
| Charcoal | +20% fire damage | Ember → Inferno |
| Wide Lens | +25% área de efeito | Fire Spin → Fire Blast |
| Choice Specs | +30% special attack | Flamethrower → Blast Burn |

### Evoluções
| Arma Base | Nível Req | Item Req | Evolução | Descrição |
|-----------|-----------|----------|----------|-----------|
| Ember Lv5 | 5 | Charcoal | **Inferno** | Bolas de fogo explodem no impacto, causando AoE |
| Fire Spin Lv5 | 5 | Wide Lens | **Fire Blast** | Anel de fogo expansivo que pulsa dano |
| Flamethrower Lv5 | 5 | Choice Specs | **Blast Burn** | Explosão massiva nuclear na direção do movimento |

### Mecânica de Evolução
- Baú aparece no mapa a cada 60s contendo um Held Item aleatório
- Held Items aparecem também como opção rara no Level Up
- Quando arma está no Lv5+ E jogador tem o item passivo, próximo level up oferece a EVOLUÇÃO
- Evolução substitui a arma base por versão evoluída (reseta pro Lv1 evoluído, mais forte que Lv5 base)

## 4. Objetos Destrutíveis no Mapa
### Tipos de Objeto
| Objeto | HP | Textura | Spawn |
|--------|-----|---------|-------|
| Tall Grass | 3 | Grama alta escura | 40 espalhados pelo mapa |
| Berry Bush | 8 | Arbusto com bolinhas vermelhas | 15 espalhados |
| Rock Smash | 15 | Pedra grande rachada | 8 espalhados |
| Treasure Chest | 1 | Baú dourado | 1 a cada 60s (Held Items) |

### Tabela de Drops
| Objeto | Drop | Chance |
|--------|------|--------|
| Tall Grass | XP Gem x3 | 80% |
| Tall Grass | Oran Berry | 20% |
| Berry Bush | Oran Berry | 60% |
| Berry Bush | XP Gem x5 | 30% |
| Berry Bush | Magnet Burst | 10% |
| Rock Smash | XP Gem x8 | 40% |
| Rock Smash | Rare Candy | 15% |
| Rock Smash | Pokéball Bomb | 10% |
| Rock Smash | Oran Berry x2 | 35% |
| Treasure Chest | Held Item (random) | 100% |

### Pickups
| Pickup | Efeito | Visual |
|--------|--------|--------|
| Oran Berry | Cura 25 HP | Bolinha azul |
| Magnet Burst | Puxa todos XP da tela | Onda azul |
| Rare Candy | +1 Level instantâneo | Diamante dourado |
| Pokéball Bomb | 999 dano a todos inimigos na tela | Explosão vermelha |

## 5. Ordem de Implementação
1. Fix XP gems (5 min)
2. Objetos destrutíveis + drops/pickups (novo sistema)
3. Ataques de inimigos (Enemy attacks)
4. Held Items passivos + sistema de evolução de ataques
5. Atualizar UI para mostrar held items e indicar evolução disponível
