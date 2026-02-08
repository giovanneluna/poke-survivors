import type { AttackConfig } from '../../types';

export const ATTACKS: Readonly<Record<string, AttackConfig>> = {
  // Charmander base
  ember:        { key: 'ember',        name: 'Ember',         description: 'Bolas de fogo no inimigo mais próximo',      baseDamage: 10, baseCooldown: 1200, element: 'fire',   maxLevel: 8, minForm: 'base' },
  scratch:      { key: 'scratch',      name: 'Scratch',       description: 'Garrada rápida na direção do movimento',     baseDamage: 8,  baseCooldown: 600,  element: 'normal', maxLevel: 8, minForm: 'base' },
  fireSpin:     { key: 'fireSpin',     name: 'Fire Spin',     description: 'Orbes de fogo orbitam ao seu redor',         baseDamage: 5,  baseCooldown: 400,  element: 'fire',   maxLevel: 8, minForm: 'base' },
  smokescreen:  { key: 'smokescreen',  name: 'Smokescreen',   description: 'Nuvem de fumaça que causa slow nos inimigos', baseDamage: 0,  baseCooldown: 0,    element: 'normal', maxLevel: 8, minForm: 'base' },
  dragonBreath: { key: 'dragonBreath', name: 'Dragon Breath', description: 'Sopro frontal com chance de stun',           baseDamage: 15, baseCooldown: 1800, element: 'dragon', maxLevel: 8, minForm: 'stage1' },
  fireFang:     { key: 'fireFang',     name: 'Fire Fang',     description: 'Mordida flamejante com chance de queimação', baseDamage: 12, baseCooldown: 1000, element: 'fire',   maxLevel: 8, minForm: 'base' },
  flameCharge:  { key: 'flameCharge',  name: 'Flame Charge',  description: 'Dash em chamas, +speed temporário',          baseDamage: 14, baseCooldown: 3000, element: 'fire',   maxLevel: 8, minForm: 'base' },
  // Charmeleon
  slash:        { key: 'slash',        name: 'Slash',         description: 'Garrada ampla com alta chance de crítico',   baseDamage: 18, baseCooldown: 800,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
  flamethrower: { key: 'flamethrower', name: 'Flamethrower',  description: 'Coluna de fogo direcional devastadora',      baseDamage: 22, baseCooldown: 2800, element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  dragonClaw:   { key: 'dragonClaw',   name: 'Dragon Claw',   description: 'Garras dracônicas com multi-hit',           baseDamage: 16, baseCooldown: 1200, element: 'dragon', maxLevel: 8, minForm: 'stage1' },
  // Charizard
  airSlash:     { key: 'airSlash',     name: 'Air Slash',     description: 'Lâmina de ar que atravessa inimigos',        baseDamage: 20, baseCooldown: 1400, element: 'flying', maxLevel: 8, minForm: 'stage2' },
  flareBlitz:   { key: 'flareBlitz',   name: 'Flare Blitz',   description: 'Dash devastador em chamas (recoil!)',        baseDamage: 45, baseCooldown: 4000, element: 'fire',   maxLevel: 8, minForm: 'stage2' },
  hurricane:    { key: 'hurricane',    name: 'Hurricane',     description: 'Tornado que puxa inimigos para o centro',    baseDamage: 12, baseCooldown: 6000, element: 'flying', maxLevel: 8, minForm: 'stage2' },
  outrage:      { key: 'outrage',      name: 'Outrage',       description: 'Modo berserk 360°, confusão ao final',       baseDamage: 35, baseCooldown: 8000, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  // Evoluções de arma
  inferno:      { key: 'inferno',      name: 'Inferno',       description: 'Bolas de fogo que explodem em AoE',         baseDamage: 18, baseCooldown: 900,  element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  fireBlast:    { key: 'fireBlast',    name: 'Fire Blast',    description: 'Estrela de fogo pulsante expansiva',         baseDamage: 12, baseCooldown: 300,  element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  blastBurn:    { key: 'blastBurn',    name: 'Blast Burn',    description: 'Explosão nuclear devastadora',               baseDamage: 50, baseCooldown: 3500, element: 'fire',   maxLevel: 8, minForm: 'stage2' },
  furySwipes:   { key: 'furySwipes',   name: 'Fury Swipes',   description: 'Multi-slash 360° ultra rápido',              baseDamage: 12, baseCooldown: 500,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
  blazeKick:    { key: 'blazeKick',    name: 'Blaze Kick',    description: 'Chute flamejante com AoE de fogo',           baseDamage: 20, baseCooldown: 800,  element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  dragonPulse:  { key: 'dragonPulse',  name: 'Dragon Pulse',  description: 'Beam dracônico que perfura tudo',            baseDamage: 30, baseCooldown: 1500, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  nightSlash:   { key: 'nightSlash',   name: 'Night Slash',   description: 'Garrada sombria, 50% crit chance',           baseDamage: 25, baseCooldown: 700,  element: 'normal', maxLevel: 8, minForm: 'stage2' },
  aerialAce:    { key: 'aerialAce',    name: 'Aerial Ace',    description: 'Lâminas homing que nunca erram',             baseDamage: 25, baseCooldown: 1200, element: 'flying', maxLevel: 8, minForm: 'stage2' },
  flareRush:    { key: 'flareRush',    name: 'Flare Rush',    description: 'Dash longo com rastro de fogo',              baseDamage: 22, baseCooldown: 2000, element: 'fire',   maxLevel: 8, minForm: 'stage1' },
  dragonRush:   { key: 'dragonRush',   name: 'Dragon Rush',   description: 'Carga dracônica com stun AoE',              baseDamage: 35, baseCooldown: 2500, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  // Charmander prime
  heatWave:     { key: 'heatWave',     name: 'Heat Wave',     description: 'Onda de calor 360° devastadora',             baseDamage: 40, baseCooldown: 5000, element: 'fire',   maxLevel: 8, minForm: 'stage2' },
  dracoMeteor:  { key: 'dracoMeteor',  name: 'Draco Meteor',  description: 'Chuva de meteoros apocalíptica',             baseDamage: 60, baseCooldown: 10000, element: 'dragon', maxLevel: 8, minForm: 'stage2' },
  // ── Squirtle base ───────────────────────────────────────────────────
  waterGun:     { key: 'waterGun',     name: 'Water Gun',     description: 'Jato de água no inimigo mais próximo',       baseDamage: 10, baseCooldown: 1200, element: 'water',  maxLevel: 8, minForm: 'base' },
  bubble:       { key: 'bubble',       name: 'Bubble',        description: 'Bolhas lentas multi-shot com slow',          baseDamage: 7,  baseCooldown: 800,  element: 'water',  maxLevel: 8, minForm: 'base' },
  tackle:       { key: 'tackle',       name: 'Tackle',        description: 'Investida rápida na direção do movimento',   baseDamage: 8,  baseCooldown: 600,  element: 'normal', maxLevel: 8, minForm: 'base' },
  rapidSpin:    { key: 'rapidSpin',    name: 'Rapid Spin',    description: 'Gira na carapaça, zona de dano circular',    baseDamage: 5,  baseCooldown: 400,  element: 'normal', maxLevel: 8, minForm: 'base' },
  withdraw:     { key: 'withdraw',     name: 'Withdraw',      description: 'Carapaça reduz dano recebido em 15%',        baseDamage: 0,  baseCooldown: 0,    element: 'water',  maxLevel: 8, minForm: 'base' },
  aquaJet:      { key: 'aquaJet',      name: 'Aqua Jet',      description: 'Dash aquático, +speed temporário',           baseDamage: 14, baseCooldown: 3000, element: 'water',  maxLevel: 8, minForm: 'base' },
  // Wartortle
  waterPulse:   { key: 'waterPulse',   name: 'Water Pulse',   description: 'Pulso de água com chance de confusão',       baseDamage: 15, baseCooldown: 1800, element: 'water',  maxLevel: 8, minForm: 'stage1' },
  hydroPump:    { key: 'hydroPump',    name: 'Hydro Pump',    description: 'Jato direcional devastador',                 baseDamage: 22, baseCooldown: 2800, element: 'water',  maxLevel: 8, minForm: 'stage1' },
  aquaTail:     { key: 'aquaTail',     name: 'Aqua Tail',     description: 'Cauda aquática com crit chance',             baseDamage: 18, baseCooldown: 800,  element: 'water',  maxLevel: 8, minForm: 'stage1' },
  whirlpool:    { key: 'whirlpool',    name: 'Whirlpool',     description: 'Vórtice de água que prende inimigos',        baseDamage: 12, baseCooldown: 4000, element: 'water',  maxLevel: 8, minForm: 'stage1' },
  // Blastoise
  iceBeam:      { key: 'iceBeam',      name: 'Ice Beam',      description: 'Raio de gelo que congela',                   baseDamage: 20, baseCooldown: 1400, element: 'ice',    maxLevel: 8, minForm: 'stage2' },
  flashCannon:  { key: 'flashCannon',  name: 'Flash Cannon',  description: 'Tiro dos canhões, piercing',                 baseDamage: 25, baseCooldown: 1600, element: 'normal', maxLevel: 8, minForm: 'stage2' },
  surf:         { key: 'surf',         name: 'Surf',          description: 'Onda 360° que empurra inimigos',             baseDamage: 12, baseCooldown: 6000, element: 'water',  maxLevel: 8, minForm: 'stage2' },
  liquidation:  { key: 'liquidation',  name: 'Liquidation',   description: 'Golpe aquático 360°, reduz defesa',          baseDamage: 35, baseCooldown: 8000, element: 'water',  maxLevel: 8, minForm: 'stage2' },
  // Squirtle evoluções
  scald:        { key: 'scald',        name: 'Scald',         description: 'Vapor AoE ao impactar, chance de burn',      baseDamage: 18, baseCooldown: 900,  element: 'water',  maxLevel: 8, minForm: 'stage1' },
  bubbleBeam:   { key: 'bubbleBeam',   name: 'Bubble Beam',   description: 'Rajada rápida com slow garantido',           baseDamage: 12, baseCooldown: 600,  element: 'water',  maxLevel: 8, minForm: 'stage1' },
  bodySlam:     { key: 'bodySlam',     name: 'Body Slam',     description: 'Multi-slam 360°, paralisia',                 baseDamage: 12, baseCooldown: 500,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
  gyroBall:     { key: 'gyroBall',     name: 'Gyro Ball',     description: 'Orbes metálicas, mais dano em inimigo lento', baseDamage: 12, baseCooldown: 300,  element: 'normal', maxLevel: 8, minForm: 'stage1' },
  waterfall:    { key: 'waterfall',    name: 'Waterfall',     description: 'Dash longo, cascata + flinch',               baseDamage: 22, baseCooldown: 2000, element: 'water',  maxLevel: 8, minForm: 'stage1' },
  originPulse:  { key: 'originPulse',  name: 'Origin Pulse',  description: 'Beam nuclear que perfura tudo',              baseDamage: 50, baseCooldown: 3500, element: 'water',  maxLevel: 8, minForm: 'stage2' },
  muddyWater:   { key: 'muddyWater',   name: 'Muddy Water',   description: 'Projéteis pesados, reduz precisão',          baseDamage: 30, baseCooldown: 1500, element: 'water',  maxLevel: 8, minForm: 'stage2' },
  crabhammer:   { key: 'crabhammer',   name: 'Crabhammer',    description: 'Garras aquáticas, 50% crit',                 baseDamage: 25, baseCooldown: 700,  element: 'water',  maxLevel: 8, minForm: 'stage2' },
  waterSpout:   { key: 'waterSpout',   name: 'Water Spout',   description: 'Jatos devastadores dos canhões',             baseDamage: 25, baseCooldown: 1200, element: 'water',  maxLevel: 8, minForm: 'stage2' },
  blizzard:     { key: 'blizzard',     name: 'Blizzard',      description: 'Tempestade de gelo homing',                  baseDamage: 25, baseCooldown: 1200, element: 'ice',    maxLevel: 8, minForm: 'stage2' },
  // Squirtle prime
  rainDance:    { key: 'rainDance',    name: 'Rain Dance',    description: 'Chuva contínua de dano em área',             baseDamage: 40, baseCooldown: 5000, element: 'water',  maxLevel: 8, minForm: 'stage2' },
  hydroCannon:  { key: 'hydroCannon',  name: 'Hydro Cannon',  description: 'Canhões devastadores ultimate',              baseDamage: 60, baseCooldown: 10000, element: 'water', maxLevel: 8, minForm: 'stage2' },
} as const;
