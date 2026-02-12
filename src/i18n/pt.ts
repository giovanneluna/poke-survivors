/** Traduções Português-BR (padrão) */
export const pt: Record<string, string> = {
  // ── Boot ─────────────────────────────────────────────────────────
  'boot.loading': 'Carregando...',

  // ── Title Scene ───────────────────────────────────────────────────
  'title.main': 'POKÉ WORLD',
  'title.subtitle': 'SURVIVORS',
  'title.edition': '🔥 FIRE RED EDITION 🔥',
  'menu.play': '▶  ENTRAR AGORA',
  'menu.powerups': 'MELHORIAS',
  'menu.pokedex': 'POKÉDEX',
  'menu.stats': 'ESTATÍSTICAS',
  'menu.save': 'SAVE DATA',
  'menu.download': 'DOWNLOAD',
  'version.beta': 'BETA',
  'credits.dev': 'Desenvolvido por Giovanne  •  github.com/giovanneluna',
  'changelog.title': "WHAT'S NEW",
  'changelog.scroll': '▼ scroll ▼',

  // ── Months ────────────────────────────────────────────────────────
  'month.0': 'Jan', 'month.1': 'Fev', 'month.2': 'Mar',
  'month.3': 'Abr', 'month.4': 'Mai', 'month.5': 'Jun',
  'month.6': 'Jul', 'month.7': 'Ago', 'month.8': 'Set',
  'month.9': 'Out', 'month.10': 'Nov', 'month.11': 'Dez',

  // ── UI Common ─────────────────────────────────────────────────────
  'ui.back': '<- Voltar',
  'ui.cancel': 'Cancelar',
  'ui.continue': '[ CONTINUAR ]',
  'ui.close': '[X]',
  'ui.mainMenu': '[ MENU PRINCIPAL ]',
  'ui.retry': '[ TENTAR DE NOVO ]',
  'ui.language': 'IDIOMA',

  // ── Select Scene ──────────────────────────────────────────────────
  'select.title': 'ESCOLHA SEU POKÉMON',
  'select.subtitle': 'Selecione seu starter e comece a aventura!',
  'select.start': 'COMEÇAR!',
  'select.lastRun': 'Última: {{form}} Lv.{{level}} · {{time}} · {{kills}} kills · ₽{{coins}}',
  'select.comingSoon': 'EM BREVE',
  'select.wip': 'WIP',
  'select.wipTitle': 'EM DESENVOLVIMENTO',
  'select.wipMsg': 'Bulbasaur ainda não está completo.\nAlguns ataques e efeitos podem\nnão funcionar corretamente.',
  'select.wipConfirm': 'Deseja continuar mesmo assim?',
  'select.wipYes': 'SIM, JOGAR',
  'select.wipNo': 'VOLTAR',

  // ── Phase Selection ───────────────────────────────────────────────
  'phase.title': 'SELECIONE A FASE',
  'phase.1.title': 'FASE 1',
  'phase.1.subtitle': 'FIRE RED',
  'phase.1.desc': 'Jogo completo com\ninimigos, bosses\ne evoluções.',
  'phase.dev.title': 'FASE DEV',
  'phase.dev.subtitle': 'DEBUGGER',
  'phase.dev.desc': 'Cenários de teste\npré-configurados\npara debugging.',

  // ── Difficulty ────────────────────────────────────────────────────
  'difficulty.title': 'DIFICULDADE',
  'difficulty.subtitle': 'Escolha o nível de desafio',
  'difficulty.easy': 'FÁCIL',
  'difficulty.easy.desc': 'Menos inimigos\nMais XP · ₽ ×0.3',
  'difficulty.medium': 'MÉDIO',
  'difficulty.medium.desc': 'Inimigos moderados\nXP alto · ₽ ×0.5',
  'difficulty.hard': 'DIFÍCIL',
  'difficulty.hard.desc': 'Máximo de inimigos\nXP e ₽ padrão',

  // ── Starter descriptions ──────────────────────────────────────────
  'starter.charmander.desc': 'O lagarto de fogo. Ataques poderosos de chamas!',
  'starter.squirtle.desc': 'A tartaruga aquática. Jatos de água precisos!',
  'starter.bulbasaur.desc': 'O dinossauro planta. Esporos e vinhas!',
  'starter.jigglypuff.desc': 'A cantora encantadora. Melodias hipnotizantes!',
  'starter.gastly.desc': 'O fantasma gasoso. Maldições e sombras!',
  'starter.abra.desc': 'O psíquico adormecido. Poderes da mente!',

  // ── Types ─────────────────────────────────────────────────────────
  'type.fire': 'Fogo',
  'type.water': 'Água',
  'type.grass': 'Planta',
  'type.normal': 'Normal',
  'type.fairy': 'Fada',
  'type.ghost': 'Fantasma',
  'type.psychic': 'Psíquico',
  'type.fighting': 'Lutador',
  'type.poison': 'Veneno',
  'type.flying': 'Voador',
  'type.bug': 'Inseto',
  'type.rock': 'Pedra',
  'type.ground': 'Terra',
  'type.ice': 'Gelo',
  'type.dragon': 'Dragão',
  'type.dark': 'Sombrio',

  // ── HUD ───────────────────────────────────────────────────────────
  'hud.hp': 'HP',
  'hud.level': 'Lv {{level}}',
  'hud.kills': 'Kills: {{count}}',
  'hud.slots': 'Atk: {{atk}}/{{atkMax}}  Item: {{item}}/{{itemMax}}',
  'hud.mega': 'MEGA!',
  'hud.megaReady': 'MEGA! [{{hint}}]',
  'hud.items': 'Items:',
  'hud.revive': 'REV',
  'hud.maxRevive': 'MAX REV',

  // ── Pause ─────────────────────────────────────────────────────────
  'pause.title': 'PAUSADO',
  'pause.quality': 'Qualidade',
  'pause.qualityNormal': 'NORMAL',
  'pause.qualityLow': 'LOW',
  'pause.restartNote': '(reinício necessário ao trocar)',
  'pause.vfx': 'Efeitos (VFX)',

  // ── Level Up ──────────────────────────────────────────────────────
  'levelup.title': 'LEVEL {{level}}!',
  'levelup.subtitle': 'Escolha um aprimoramento:',
  'levelup.tagEvolution': 'EVOLUÇÃO',
  'levelup.tagSkill': 'HABILIDADE',
  'levelup.tagUpgrade': 'MELHORIA',
  'levelup.tagItem': 'ITEM',
  'levelup.tagPassive': 'PASSIVA',
  'levelup.reroll': 'Reroll ({{count}} restante{{plural}})',
  'levelup.noRerolls': 'Sem rerolls',

  // ── Evolution ─────────────────────────────────────────────────────
  'evolution.evolving': '{{name}} está evoluindo...',
  'evolution.evolved': '{{name}}!',
  'evolution.slots': '+1 Slot de Ataque  •  +1 Slot de Item',

  // ── Boss ──────────────────────────────────────────────────────────
  'boss.appeared': 'WILD {{name}} APPEARED!',
  'boss.tank': 'TANK',
  'boss.striker': 'STRIKER',
  'boss.caster': 'CASTER',
  'boss.skirmisher': 'SKIRMISHER',

  // ── Companion ─────────────────────────────────────────────────────
  'companion.choose': 'CHOOSE A COMPANION!',

  // ── Gacha ─────────────────────────────────────────────────────────
  'gacha.skillUpgrade': 'SKILL UPGRADE!',
  'gacha.heldItem': 'HELD ITEM!',
  'gacha.coins': 'BIG COINS!',
  'gacha.evoStone': 'EVOLUTION STONE!',
  'gacha.revive': 'REVIVE!',
  'gacha.maxRevive': 'MAX REVIVE!',

  // ── Victory ───────────────────────────────────────────────────────
  'victory.title': 'FASE 1 COMPLETA!',
  'victory.subtitle': 'FIRE RED',
  'victory.msg': 'Todos os bosses foram derrotados!\nVocê pode continuar jogando livremente.',

  // ── Game Over ─────────────────────────────────────────────────────
  'gameover.title': 'GAME OVER',
  'gameover.newRecord': 'NOVO RECORDE!',
  'gameover.killsByType': '── KILLS POR TIPO ──',
  'gameover.attacksUsed': '── ATAQUES USADOS ──',

  // ── Stats labels ──────────────────────────────────────────────────
  'stats.time': 'Tempo:',
  'stats.level': 'Level:',
  'stats.kills': 'Kills:',
  'stats.bestCombo': 'Best Combo:',
  'stats.totalDamage': 'Dano Total:',
  'stats.bosses': 'Bosses:',
  'stats.berries': 'Berries:',
  'stats.xp': 'XP Coletado:',
  'stats.coinsEarned': 'POKÉDOLLARS GANHOS',
  'stats.totalCoins': 'Total: ₽ {{amount}}',

  // ── Stats Scene ───────────────────────────────────────────────────
  'statsScene.title': 'ESTATÍSTICAS',
  'statsScene.subtitle': 'Dados acumulados de todas as runs',
  'statsScene.combat': 'COMBATE',
  'statsScene.explore': 'EXPLORAÇÃO',
  'statsScene.economy': 'ECONOMIA',
  'statsScene.records': 'RECORDES',
  'statsScene.totalKills': 'Inimigos Derrotados',
  'statsScene.bossesKilled': 'Bosses Derrotados',
  'statsScene.totalDamage': 'Dano Total',
  'statsScene.bestCombo': 'Melhor Combo',
  'statsScene.favoriteAttack': 'Ataque Favorito',
  'statsScene.totalRuns': 'Partidas Jogadas',
  'statsScene.totalDeaths': 'Mortes',
  'statsScene.totalTime': 'Tempo Total',
  'statsScene.distance': 'Distância',
  'statsScene.highestEvolution': 'Maior Evolução',
  'statsScene.currentCoins': 'Coins Atuais',
  'statsScene.totalCoinsEarned': 'Coins Ganhos (Total)',
  'statsScene.totalCoinsSpent': 'Coins Gastos',
  'statsScene.berriesCollected': 'Berries Coletadas',
  'statsScene.xpCollected': 'XP Coletada',
  'statsScene.bestTime': 'Melhor Tempo',
  'statsScene.bestKills': 'Mais Kills',
  'statsScene.bestLevel': 'Maior Level',
  'statsScene.bestComboRecord': 'Melhor Combo',
  'statsScene.startersUsed': 'STARTERS USADOS',

  // ── Power-Ups ─────────────────────────────────────────────────────
  'powerups.title': 'MELHORIAS PERMANENTES',
  'powerups.subtitle': 'Invista moedas para ficar mais forte a cada run',
  'powerups.maxed': 'MAXIMO',
  'powerups.buy': 'COMPRAR',
  'powerups.maxHp.name': 'HP Maximo',
  'powerups.maxHp.desc': '+5 HP por nivel',
  'powerups.maxHp.effect': '+5 HP',
  'powerups.hpRegen.name': 'Regeneracao',
  'powerups.hpRegen.desc': '+0.5 HP/s por nivel',
  'powerups.hpRegen.effect': '+0.5 HP/s',
  'powerups.speed.name': 'Velocidade',
  'powerups.speed.desc': '+5% velocidade por nivel',
  'powerups.speed.effect': '+5% Speed',
  'powerups.xpGain.name': 'Ganho de XP',
  'powerups.xpGain.desc': '+10% XP por nivel',
  'powerups.xpGain.effect': '+10% XP',
  'powerups.magnetRange.name': 'Alcance Magnetico',
  'powerups.magnetRange.desc': '+10px alcance por nivel',
  'powerups.magnetRange.effect': '+10px Range',
  'powerups.revival.name': 'Reviver',
  'powerups.revival.desc': '+1 revive por run',
  'powerups.revival.effect': '+1 Revive',
  'powerups.damage.name': 'Dano',
  'powerups.damage.desc': '+5% dano por nivel',
  'powerups.damage.effect': '+5% Damage',
  'powerups.reroll.name': 'Rerolls',
  'powerups.reroll.desc': '+1 reroll no level-up',
  'powerups.reroll.effect': '+1 Reroll',

  // ── Events ────────────────────────────────────────────────────────
  'event.pokecenter': 'Pokémon Center',
  'event.oak': "Professor Oak's Lab",
  'event.swarm': 'Swarm',
  'event.swarmBanner': 'SWARM: {{name}}!',
  'event.eclipse': 'Eclipse',
  'event.eclipseBanner': 'Eclipse!',
  'event.legendary': 'Legendary Sighting',
  'event.legendaryBanner': 'Legendary Sighting!',
  'event.treasure': 'Treasure Room',
  'event.treasureBanner': 'Treasure Room!',

  // ── Pokédex ───────────────────────────────────────────────────────
  'pokedex.title': 'POKÉDEX',
  'pokedex.discovered': '{{found}} / {{total}} Descobertos',

  // ── Save Scene ────────────────────────────────────────────────────
  'save.subtitle': 'Gerencie seus dados de jogo',
  'save.export': 'EXPORTAR',
  'save.export.desc': 'Baixe seu save como\narquivo .txt ou copie\no código para transferir',
  'save.import': 'IMPORTAR',
  'save.import.desc': 'Carregue um arquivo .txt\nou cole um código para\nrestaurar seu progresso',
  'save.delete': 'APAGAR',
  'save.delete.desc': 'Apague TODOS os dados\nde jogo permanentemente.\nUse com cuidado!',
  'save.export.title': 'EXPORTAR DADOS',
  'save.export.instructions': 'Baixe seu save como arquivo .txt\nou copie o código para colar em outro dispositivo.',
  'save.export.download': 'BAIXAR .TXT',
  'save.export.downloaded': 'Arquivo baixado!',
  'save.export.copy': 'COPIAR CÓDIGO',
  'save.export.copied': 'Código copiado!',
  'save.export.copyError': 'Erro ao copiar',
  'save.import.title': 'IMPORTAR DADOS',
  'save.import.instructions': 'Envie um arquivo .txt ou cole o código\npara restaurar seu save.',
  'save.import.warning': 'ISTO SUBSTITUIRÁ SEUS DADOS ATUAIS!',
  'save.import.loadFile': 'CARREGAR .TXT',
  'save.import.pasteCode': 'COLAR CÓDIGO',
  'save.import.placeholder': 'Clique em COLAR CÓDIGO para importar...',
  'save.import.success': 'Dados importados! Recarregando...',
  'save.import.invalid': 'Arquivo inválido!',
  'save.import.invalidCode': 'Código inválido!',
  'save.import.clipboardEmpty': 'Clipboard vazio!',
  'save.import.clipboardError': 'Erro ao ler clipboard',
  'save.delete.title': 'APAGAR DADOS',
  'save.delete.confirm': 'Tem certeza que deseja APAGAR\nTODOS os seus dados?\n\nIsto inclui: coins, upgrades,\npokédex, recordes e estatísticas.',
  'save.delete.finalWarning': 'ESTA AÇÃO NÃO PODE SER DESFEITA!',
  'save.delete.cancelBtn': 'CANCELAR',
  'save.delete.confirmBtn': 'CONFIRMAR',
  'save.delete.success': 'Dados apagados! Recarregando...',

  // ── Notifications ─────────────────────────────────────────────────
  'notify.revive': 'REVIVE! ({{count}}/2)',
  'notify.reviveRemaining': '{{count}} restante{{plural}}',
  'notify.maxRevive': 'MAX REVIVE! 100% HP ao reviver!',
  'notify.rareCandy': 'RARE CANDY! +1 Level!',
  'notify.reviveMax': 'HP CHEIO! (revives max)',
  'notify.maxReviveHeal': 'MAX REVIVE! HP CHEIO!',

  // ── Combo ─────────────────────────────────────────────────────────
  'combo.pokemaster': 'POKÉMASTER!',

  // ── Type Effectiveness ────────────────────────────────────────────
  'type.superEffective': 'Super Efetivo!',
  'type.noEffect': 'Sem Efeito!',
  'type.notEffective': 'Pouco Efetivo...',

  // ── Themes ────────────────────────────────────────────────────────
  'theme.emerald': 'Emerald',
  'theme.frlg': 'FireRed',
  'theme.pmd': 'Mystery Dungeon',

  // ── Language ────────────────────────────────────────────────────
  'lang.pt': 'PT',
  'lang.en': 'EN',
  'lang.modal.title': 'ESCOLHA SEU IDIOMA',
  'lang.modal.subtitle': 'Choose your language',
  'lang.modal.pt': 'PORTUGUÊS',
  'lang.modal.en': 'ENGLISH',

  // ── Contribute ──────────────────────────────────────────────────
  'contribute.title': 'QUERO CONTRIBUIR',
  'contribute.desc': 'Poké World Survivors é um projeto gratuito e sem\nfins comerciais, feito por diversão! O objetivo é trazer\nvárias fases, pokémons, eventos e quests.\n\nIdeias não faltam! O que precisamos são:\n• Sprites e artes de Pokémon\n• Texturas de chão e mapa\n• Animações de ataques\n• Objetos de colisão e cenário\n\nSe você é artista, spriter ou quer ajudar de\nqualquer forma, entre no Discord!',
  'contribute.discord': 'ENTRAR NO DISCORD',
  'contribute.close': 'FECHAR',
  'contribute.endgame': 'Quer contribuir? Acesse "Quero Contribuir" no menu principal!',
};
