/** English Translations */
export const en: Record<string, string> = {
  // ── Boot ─────────────────────────────────────────────────────────
  'boot.loading': 'Loading...',

  // ── Title Scene ───────────────────────────────────────────────────
  'title.main': 'POKÉ WORLD',
  'title.subtitle': 'SURVIVORS',
  'title.edition': '🔥 FIRE RED EDITION 🔥',
  'menu.play': '▶  PLAY NOW',
  'menu.powerups': 'UPGRADES',
  'menu.pokedex': 'POKÉDEX',
  'menu.stats': 'STATISTICS',
  'menu.save': 'SAVE DATA',
  'menu.download': 'DOWNLOAD',
  'version.beta': 'BETA',
  'credits.dev': 'Developed by Giovanne  •  github.com/giovanneluna',
  'changelog.title': "WHAT'S NEW",
  'changelog.scroll': '▼ scroll ▼',

  // ── Months ────────────────────────────────────────────────────────
  'month.0': 'Jan', 'month.1': 'Feb', 'month.2': 'Mar',
  'month.3': 'Apr', 'month.4': 'May', 'month.5': 'Jun',
  'month.6': 'Jul', 'month.7': 'Aug', 'month.8': 'Sep',
  'month.9': 'Oct', 'month.10': 'Nov', 'month.11': 'Dec',

  // ── UI Common ─────────────────────────────────────────────────────
  'ui.back': '<- Back',
  'ui.cancel': 'Cancel',
  'ui.continue': '[ CONTINUE ]',
  'ui.close': '[X]',
  'ui.mainMenu': '[ MAIN MENU ]',
  'ui.retry': '[ TRY AGAIN ]',
  'ui.language': 'LANGUAGE',

  // ── Select Scene ──────────────────────────────────────────────────
  'select.title': 'CHOOSE YOUR POKÉMON',
  'select.subtitle': 'Select your starter and begin the adventure!',
  'select.start': 'START!',
  'select.lastRun': 'Last: {{form}} Lv.{{level}} · {{time}} · {{kills}} kills · ₽{{coins}}',
  'select.comingSoon': 'COMING SOON',
  'select.wip': 'WIP',
  'select.wipTitle': 'WORK IN PROGRESS',
  'select.wipMsg': 'Bulbasaur is not yet complete.\nSome attacks and effects may\nnot work properly.',
  'select.wipConfirm': 'Do you wish to continue anyway?',
  'select.wipYes': 'YES, PLAY',
  'select.wipNo': 'GO BACK',

  // ── Phase Selection ───────────────────────────────────────────────
  'phase.title': 'SELECT PHASE',
  'phase.1.title': 'PHASE 1',
  'phase.1.subtitle': 'FIRE RED',
  'phase.1.desc': 'Full game with\nenemies, bosses\nand evolutions.',
  'phase.dev.title': 'DEV PHASE',
  'phase.dev.subtitle': 'DEBUGGER',
  'phase.dev.desc': 'Pre-configured\ntest scenarios\nfor debugging.',

  // ── Difficulty ────────────────────────────────────────────────────
  'difficulty.title': 'DIFFICULTY',
  'difficulty.subtitle': 'Choose the challenge level',
  'difficulty.easy': 'EASY',
  'difficulty.easy.desc': 'Less enemies\nMore XP · ₽ ×0.3',
  'difficulty.medium': 'MEDIUM',
  'difficulty.medium.desc': 'Moderate enemies\nHigh XP · ₽ ×0.5',
  'difficulty.hard': 'HARD',
  'difficulty.hard.desc': 'Max enemies\nDefault XP & ₽',

  // ── Starter descriptions ──────────────────────────────────────────
  'starter.charmander.desc': 'The fire lizard. Powerful flame attacks!',
  'starter.squirtle.desc': 'The water turtle. Precise water jets!',
  'starter.bulbasaur.desc': 'The plant dinosaur. Spores and vines!',
  'starter.jigglypuff.desc': 'The charming singer. Hypnotic melodies!',
  'starter.gastly.desc': 'The gaseous ghost. Curses and shadows!',
  'starter.abra.desc': 'The sleeping psychic. Mind powers!',

  // ── Types ─────────────────────────────────────────────────────────
  'type.fire': 'Fire',
  'type.water': 'Water',
  'type.grass': 'Grass',
  'type.normal': 'Normal',
  'type.fairy': 'Fairy',
  'type.ghost': 'Ghost',
  'type.psychic': 'Psychic',
  'type.fighting': 'Fighting',
  'type.poison': 'Poison',
  'type.flying': 'Flying',
  'type.bug': 'Bug',
  'type.rock': 'Rock',
  'type.ground': 'Ground',
  'type.ice': 'Ice',
  'type.dragon': 'Dragon',
  'type.dark': 'Dark',

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
  'pause.title': 'PAUSED',
  'pause.quality': 'Quality',
  'pause.qualityNormal': 'NORMAL',
  'pause.qualityLow': 'LOW',
  'pause.restartNote': '(restart required when changing)',
  'pause.vfx': 'Effects (VFX)',

  // ── Level Up ──────────────────────────────────────────────────────
  'levelup.title': 'LEVEL {{level}}!',
  'levelup.subtitle': 'Choose an upgrade:',
  'levelup.tagEvolution': 'EVOLUTION',
  'levelup.tagSkill': 'SKILL',
  'levelup.tagUpgrade': 'UPGRADE',
  'levelup.tagItem': 'ITEM',
  'levelup.tagPassive': 'PASSIVE',
  'levelup.reroll': 'Reroll ({{count}} left)',
  'levelup.noRerolls': 'No rerolls',

  // ── Evolution ─────────────────────────────────────────────────────
  'evolution.evolving': '{{name}} is evolving...',
  'evolution.evolved': '{{name}}!',
  'evolution.slots': '+1 Attack Slot  •  +1 Item Slot',

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
  'victory.title': 'PHASE 1 COMPLETE!',
  'victory.subtitle': 'FIRE RED',
  'victory.msg': 'All bosses have been defeated!\nYou can keep playing freely.',

  // ── Game Over ─────────────────────────────────────────────────────
  'gameover.title': 'GAME OVER',
  'gameover.newRecord': 'NEW RECORD!',
  'gameover.killsByType': '── KILLS BY TYPE ──',
  'gameover.attacksUsed': '── ATTACKS USED ──',

  // ── Stats labels ──────────────────────────────────────────────────
  'stats.time': 'Time:',
  'stats.level': 'Level:',
  'stats.kills': 'Kills:',
  'stats.bestCombo': 'Best Combo:',
  'stats.totalDamage': 'Total Damage:',
  'stats.bosses': 'Bosses:',
  'stats.berries': 'Berries:',
  'stats.xp': 'XP Collected:',
  'stats.coinsEarned': 'POKÉDOLLARS EARNED',
  'stats.totalCoins': 'Total: ₽ {{amount}}',

  // ── Stats Scene ───────────────────────────────────────────────────
  'statsScene.title': 'STATISTICS',
  'statsScene.subtitle': 'Accumulated data from all runs',
  'statsScene.combat': 'COMBAT',
  'statsScene.explore': 'EXPLORATION',
  'statsScene.economy': 'ECONOMY',
  'statsScene.records': 'RECORDS',
  'statsScene.totalKills': 'Enemies Defeated',
  'statsScene.bossesKilled': 'Bosses Defeated',
  'statsScene.totalDamage': 'Total Damage',
  'statsScene.bestCombo': 'Best Combo',
  'statsScene.favoriteAttack': 'Favorite Attack',
  'statsScene.totalRuns': 'Games Played',
  'statsScene.totalDeaths': 'Deaths',
  'statsScene.totalTime': 'Total Time',
  'statsScene.distance': 'Distance',
  'statsScene.highestEvolution': 'Highest Evolution',
  'statsScene.currentCoins': 'Current Coins',
  'statsScene.totalCoinsEarned': 'Coins Earned (Total)',
  'statsScene.totalCoinsSpent': 'Coins Spent',
  'statsScene.berriesCollected': 'Berries Collected',
  'statsScene.xpCollected': 'XP Collected',
  'statsScene.bestTime': 'Best Time',
  'statsScene.bestKills': 'Most Kills',
  'statsScene.bestLevel': 'Highest Level',
  'statsScene.bestComboRecord': 'Best Combo',
  'statsScene.startersUsed': 'STARTERS USED',

  // ── Power-Ups ─────────────────────────────────────────────────────
  'powerups.title': 'PERMANENT UPGRADES',
  'powerups.subtitle': 'Invest coins to get stronger each run',
  'powerups.maxed': 'MAXED',
  'powerups.buy': 'BUY',
  'powerups.maxHp.name': 'Max HP',
  'powerups.maxHp.desc': '+5 HP per level',
  'powerups.maxHp.effect': '+5 HP',
  'powerups.hpRegen.name': 'Regeneration',
  'powerups.hpRegen.desc': '+0.5 HP/s per level',
  'powerups.hpRegen.effect': '+0.5 HP/s',
  'powerups.speed.name': 'Speed',
  'powerups.speed.desc': '+5% speed per level',
  'powerups.speed.effect': '+5% Speed',
  'powerups.xpGain.name': 'XP Gain',
  'powerups.xpGain.desc': '+10% XP per level',
  'powerups.xpGain.effect': '+10% XP',
  'powerups.magnetRange.name': 'Magnet Range',
  'powerups.magnetRange.desc': '+10px range per level',
  'powerups.magnetRange.effect': '+10px Range',
  'powerups.revival.name': 'Revival',
  'powerups.revival.desc': '+1 revive per run',
  'powerups.revival.effect': '+1 Revive',
  'powerups.damage.name': 'Damage',
  'powerups.damage.desc': '+5% damage per level',
  'powerups.damage.effect': '+5% Damage',
  'powerups.reroll.name': 'Rerolls',
  'powerups.reroll.desc': '+1 reroll on level-up',
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
  'pokedex.discovered': '{{found}} / {{total}} Discovered',

  // ── Save Scene ────────────────────────────────────────────────────
  'save.subtitle': 'Manage your game data',
  'save.export': 'EXPORT',
  'save.export.desc': 'Download your save as\na .txt file or copy\nthe code to transfer',
  'save.import': 'IMPORT',
  'save.import.desc': 'Upload a .txt file\nor paste a code to\nrestore your progress',
  'save.delete': 'DELETE',
  'save.delete.desc': 'Delete ALL game data\npermanently.\nUse with caution!',
  'save.export.title': 'EXPORT DATA',
  'save.export.instructions': 'Download your save as a .txt file\nor copy the code to paste on another device.',
  'save.export.download': 'DOWNLOAD .TXT',
  'save.export.downloaded': 'File downloaded!',
  'save.export.copy': 'COPY CODE',
  'save.export.copied': 'Code copied!',
  'save.export.copyError': 'Error copying',
  'save.import.title': 'IMPORT DATA',
  'save.import.instructions': 'Upload a .txt file or paste the code\nto restore your save.',
  'save.import.warning': 'THIS WILL REPLACE YOUR CURRENT DATA!',
  'save.import.loadFile': 'LOAD .TXT',
  'save.import.pasteCode': 'PASTE CODE',
  'save.import.placeholder': 'Click PASTE CODE to import...',
  'save.import.success': 'Data imported! Reloading...',
  'save.import.invalid': 'Invalid file!',
  'save.import.invalidCode': 'Invalid code!',
  'save.import.clipboardEmpty': 'Clipboard empty!',
  'save.import.clipboardError': 'Error reading clipboard',
  'save.delete.title': 'DELETE DATA',
  'save.delete.confirm': 'Are you sure you want to DELETE\nALL your data?\n\nThis includes: coins, upgrades,\npokédex, records and statistics.',
  'save.delete.finalWarning': 'THIS ACTION CANNOT BE UNDONE!',
  'save.delete.cancelBtn': 'CANCEL',
  'save.delete.confirmBtn': 'CONFIRM',
  'save.delete.success': 'Data deleted! Reloading...',

  // ── Notifications ─────────────────────────────────────────────────
  'notify.revive': 'REVIVE! ({{count}}/2)',
  'notify.reviveRemaining': '{{count}} remaining',
  'notify.maxRevive': 'MAX REVIVE! 100% HP on revive!',
  'notify.rareCandy': 'RARE CANDY! +1 Level!',
  'notify.reviveMax': 'FULL HP! (max revives)',
  'notify.maxReviveHeal': 'MAX REVIVE! FULL HP!',

  // ── Combo ─────────────────────────────────────────────────────────
  'combo.pokemaster': 'POKÉMASTER!',

  // ── Type Effectiveness ────────────────────────────────────────────
  'type.superEffective': 'Super Effective!',
  'type.noEffect': 'No Effect!',
  'type.notEffective': 'Not Very Effective...',

  // ── Themes ────────────────────────────────────────────────────────
  'theme.emerald': 'Emerald',
  'theme.frlg': 'FireRed',
  'theme.pmd': 'Mystery Dungeon',

  // ── Language ────────────────────────────────────────────────────
  'lang.pt': 'PT',
  'lang.en': 'EN',
  'lang.modal.title': 'CHOOSE YOUR LANGUAGE',
  'lang.modal.subtitle': 'Escolha seu idioma',
  'lang.modal.pt': 'PORTUGUÊS',
  'lang.modal.en': 'ENGLISH',

  // ── Contribute ──────────────────────────────────────────────────
  'contribute.title': 'WANT TO CONTRIBUTE?',
  'contribute.desc': 'Poké World Survivors is a free, non-commercial\nproject made for fun! The goal is to bring multiple\nphases, pokémon, events and quests.\n\nIdeas are not lacking! What we need:\n• Pokémon sprites and art\n• Ground and map textures\n• Attack animations\n• Collision objects and scenery\n\nIf you are an artist, spriter or want to help\nin any way, join the Discord!',
  'contribute.discord': 'JOIN DISCORD',
  'contribute.close': 'CLOSE',
  'contribute.endgame': 'Want to contribute? Check "Want to Contribute?" on the main menu!',
};
