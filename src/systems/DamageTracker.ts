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

// ── Form damage multiplier (stage2 = +40%) ────────────────────────
let _formDamageMult = 1;

export function setFormDamageMultiplier(v: number): void {
  _formDamageMult = v;
}

export function getFormDamageMultiplier(): number {
  return _formDamageMult;
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
  // Forward to RunRecorder for game-over stats
  _runRecordDamage?.(_source, amount);
}

// ── RunRecorder bridge (set by GameScene to avoid circular import) ──
let _runRecordDamage: ((attackKey: string, amount: number) => void) | null = null;

export function setRunRecordDamage(fn: (attackKey: string, amount: number) => void): void {
  _runRecordDamage = fn;
}

export function getDamageTotals(): ReadonlyMap<string, number> {
  return _totals;
}

export function resetDamageTotals(): void {
  _totals.clear();
}
