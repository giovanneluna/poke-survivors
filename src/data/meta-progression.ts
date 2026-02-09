export interface PowerUpDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly maxLevel: number;
  readonly baseCost: number;
  readonly costScale: number;
  readonly effect: string;
}

export const POWER_UPS: readonly PowerUpDef[] = [
  { id: 'maxHp', name: 'HP Maximo', description: '+5 HP por nivel', icon: 'leftovers', maxLevel: 10, baseCost: 100, costScale: 1.8, effect: '+5 HP' },
  { id: 'hpRegen', name: 'Regeneracao', description: '+0.5 HP/s por nivel', icon: 'leftovers', maxLevel: 8, baseCost: 150, costScale: 2.0, effect: '+0.5 HP/s' },
  { id: 'speed', name: 'Velocidade', description: '+5% velocidade por nivel', icon: 'quick-claw', maxLevel: 8, baseCost: 120, costScale: 1.8, effect: '+5% Speed' },
  { id: 'xpGain', name: 'Ganho de XP', description: '+10% XP por nivel', icon: 'pp-up', maxLevel: 8, baseCost: 200, costScale: 2.0, effect: '+10% XP' },
  { id: 'magnetRange', name: 'Alcance Magnetico', description: '+10px alcance por nivel', icon: 'magnet', maxLevel: 8, baseCost: 100, costScale: 1.5, effect: '+10px Range' },
  { id: 'revival', name: 'Reviver', description: '+1 revive por run', icon: 'revive', maxLevel: 3, baseCost: 500, costScale: 3.0, effect: '+1 Revive' },
  { id: 'damage', name: 'Dano', description: '+5% dano por nivel', icon: 'choice-specs', maxLevel: 8, baseCost: 200, costScale: 2.0, effect: '+5% Damage' },
  { id: 'reroll', name: 'Rerolls', description: '+1 reroll no level-up', icon: 'wide-lens', maxLevel: 5, baseCost: 300, costScale: 2.5, effect: '+1 Reroll' },
] as const;

export function getNextCost(def: PowerUpDef, currentLevel: number): number {
  if (currentLevel >= def.maxLevel) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costScale, currentLevel));
}
