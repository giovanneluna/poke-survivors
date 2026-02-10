// ── Graphics Settings — utility para leitura ergonômica das config gráficas ──
// Lê direto do SaveSystem, sem estado próprio.

import { getQuality, getVfxIntensity as getSavedVfx } from './SaveSystem';

export function getQualityMode(): 'normal' | 'low' {
  return getQuality();
}

export function getQualityScale(): number {
  return getQuality() === 'low' ? 0.5 : 1.0;
}

export function getVfxScale(): number {
  return getSavedVfx() / 100;
}

export function shouldShowVfx(): boolean {
  return getSavedVfx() > 0;
}

export function getVfxQuantity(base: number): number {
  const factor = getSavedVfx() / 100;
  if (factor <= 0) return 0;
  return Math.max(1, Math.round(base * factor));
}
