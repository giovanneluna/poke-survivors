# Future: Companion Gacha System

## Status: PLANEJADO (implementar em fase futura)

## Pool de Companheiros

| Pokemon | Raridade | Ataque | Descrição |
|---------|----------|--------|-----------|
| Pikachu | Comum (60%) | Thunder Shock | Projétil elétrico |
| Eevee | Comum (60%) | Quick Attack | Dash rápido |
| Magikarp | Comum (60%) | Splash | Decorativo (evolui pra Gyarados) |
| Jigglypuff | Raro (30%) | Sing | AoE sleep nos inimigos |
| Abra | Raro (30%) | Teleport | Blink + dano |
| Mew | Lendario (10%) | Psychic | AoE massivo |

## Mecânica
- Segue o player automaticamente (offset aleatório para não empilhar)
- Ataca automaticamente inimigos próximos (AI simples: alvo mais perto)
- Máximo de 3 companheiros simultâneos
- Obtido via Gacha Box (drop dos bosses) — substitui parte do reward pool
- Não pode ser perdido (permanente durante a run)

## Raridades
- **Comum (60%)**: Pikachu, Eevee, Magikarp
- **Raro (30%)**: Jigglypuff, Abra
- **Lendario (10%)**: Mew

## Sprites
- PMDCollab Walk-Anim.png para cada um
- Pikachu: DEX 0025
- Eevee: DEX 0133
- Magikarp: DEX 0129
- Jigglypuff: DEX 0039
- Abra: DEX 0063
- Mew: DEX 0151

## Implementação
1. `src/entities/Companion.ts` — extends Sprite, AI de follow + ataque
2. `src/data/companions/` — configs individuais
3. Integrar no Gacha reward pool (novo tipo `companion`)
4. UI: mostrar companheiros ativos no HUD
5. ShowcaseScene: seção COMPANHEIROS

## Notas
- Gacha box atualmente dá skill upgrades. Quando companheiros forem implementados, adicionar ao pool com chance separada.
- Magikarp → Gyarados evolução a nível 20 do Magikarp (future feature)
