import type { HeldItemConfig } from '../../types';

export const HELD_ITEMS: Readonly<Record<string, HeldItemConfig>> = {
  charcoal:    { key: 'charcoal',    name: 'Charcoal',      description: '+10% dano de fogo por nível',    icon: 'item-charcoal',     color: 0xff6600, effect: 'fireDmg',    maxLevel: 5 },
  wideLens:    { key: 'wideLens',    name: 'Wide Lens',     description: '+10% área de efeito por nível',  icon: 'item-wide-lens',    color: 0x44aaff, effect: 'aoe',        maxLevel: 5 },
  choiceSpecs: { key: 'choiceSpecs', name: 'Choice Specs',  description: '+8% dano geral por nível',       icon: 'item-choice-specs', color: 0xaa44ff, effect: 'spAtk',      maxLevel: 5 },
  quickClaw:   { key: 'quickClaw',   name: 'Quick Claw',    description: '+8% velocidade por nível',       icon: 'item-quick-claw',   color: 0x44aaff, effect: 'speed',      maxLevel: 5 },
  leftovers:   { key: 'leftovers',   name: 'Leftovers',     description: '+0.5 HP/s por nível',            icon: 'item-leftovers',    color: 0xff4444, effect: 'hpRegen',    maxLevel: 5 },
  dragonFang:  { key: 'dragonFang',  name: 'Dragon Fang',   description: '+10% dano dragon por nível',     icon: 'item-dragon-fang',  color: 0x7744ff, effect: 'dragonDmg',  maxLevel: 5 },
  sharpBeak:   { key: 'sharpBeak',   name: 'Sharp Beak',    description: '+10% dano flying por nível',     icon: 'item-sharp-beak',   color: 0x88ccff, effect: 'flyingDmg',  maxLevel: 5 },
  scopeLens:   { key: 'scopeLens',   name: 'Scope Lens',    description: '+5% chance de crítico por nível', icon: 'item-scope-lens',  color: 0xff44aa, effect: 'crit',       maxLevel: 5 },
  razorClaw:   { key: 'razorClaw',   name: 'Razor Claw',    description: '+15% dano crítico por nível',    icon: 'item-razor-claw',   color: 0xcc4444, effect: 'critDmg',    maxLevel: 5 },
  shellBell:   { key: 'shellBell',   name: 'Shell Bell',    description: '+1.5% lifesteal por nível',      icon: 'item-shell-bell',   color: 0xffcc44, effect: 'lifesteal',  maxLevel: 5 },
  focusBand:   { key: 'focusBand',   name: 'Focus Band',    description: 'Sobrevive golpe fatal (CD -10s/nv)', icon: 'item-focus-band', color: 0xff8800, effect: 'endure',   maxLevel: 3 },
  magnet:      { key: 'magnet',      name: 'Magnet',        description: '+20% alcance de coleta de XP',   icon: 'item-magnet',       color: 0xaa44ff, effect: 'magnetRange', maxLevel: 5 },
  mysticWater: { key: 'mysticWater', name: 'Mystic Water',  description: '+10% dano de água por nível',    icon: 'item-mystic-water', color: 0x3388ff, effect: 'waterDmg',   maxLevel: 5 },
  neverMeltIce: { key: 'neverMeltIce', name: 'Never-Melt Ice', description: '+10% dano de gelo por nível', icon: 'item-never-melt-ice', color: 0x88ddff, effect: 'iceDmg',  maxLevel: 5 },
} as const;
