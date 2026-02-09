/**
 * DamageTracker: módulo singleton para rastrear dano acumulado por ataque.
 *
 * Usa padrão "thread-local": setSource() antes de loops de dano,
 * record() dentro de Enemy.takeDamage(), clearSource() após.
 */

let _source = '';
const _totals = new Map<string, number>();

// ── Berry damage buff (Liechi Berry) ──────────────────────────────
let _damageBuff: (() => number) | null = null;

export function setDamageBuff(fn: () => number): void {
  _damageBuff = fn;
}

export function getDamageBuff(): number {
  return _damageBuff?.() ?? 1;
}

export function setDamageSource(source: string): void {
  _source = source;
}

export function getDamageSource(): string {
  return _source;
}

export function clearDamageSource(): void {
  _source = '';
}

export function recordDamage(amount: number): void {
  if (!_source || amount <= 0) return;
  _totals.set(_source, (_totals.get(_source) ?? 0) + amount);
}

export function getDamageTotals(): ReadonlyMap<string, number> {
  return _totals;
}

export function resetDamageTotals(): void {
  _totals.clear();
}
