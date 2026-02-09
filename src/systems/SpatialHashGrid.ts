import type { Enemy } from '../entities/Enemy';

/**
 * Spatial hash grid para queries eficientes de inimigos por proximidade.
 * Divide o mundo em cells de tamanho fixo e indexa inimigos por cell.
 *
 * Complexidades:
 * - insert/remove/updatePosition: O(1)
 * - queryRadius: O(cells_in_radius × enemies_per_cell) — tipicamente O(k) onde k << n
 * - getActiveEnemies: O(1) cached
 * - getActiveCount: O(1)
 */
export class SpatialHashGrid {
  private readonly cellSize: number;
  private readonly invCellSize: number;
  private readonly grid: Map<string, Set<Enemy>> = new Map();
  private readonly entityCells: Map<Enemy, string> = new Map();
  private readonly activeSet: Set<Enemy> = new Set();
  private cachedArray: Enemy[] | null = null;

  constructor(cellSize = 128) {
    this.cellSize = cellSize;
    this.invCellSize = 1 / cellSize;
  }

  private cellKey(x: number, y: number): string {
    const cx = (x * this.invCellSize) | 0;
    const cy = (y * this.invCellSize) | 0;
    return `${cx},${cy}`;
  }

  insert(enemy: Enemy): void {
    const key = this.cellKey(enemy.x, enemy.y);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = new Set();
      this.grid.set(key, cell);
    }
    cell.add(enemy);
    this.entityCells.set(enemy, key);
    this.activeSet.add(enemy);
    this.cachedArray = null;
  }

  remove(enemy: Enemy): void {
    const key = this.entityCells.get(enemy);
    if (key) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(enemy);
        if (cell.size === 0) this.grid.delete(key);
      }
      this.entityCells.delete(enemy);
    }
    this.activeSet.delete(enemy);
    this.cachedArray = null;
  }

  updatePosition(enemy: Enemy): void {
    const oldKey = this.entityCells.get(enemy);
    const newKey = this.cellKey(enemy.x, enemy.y);
    if (oldKey === newKey) return;

    if (oldKey) {
      const oldCell = this.grid.get(oldKey);
      if (oldCell) {
        oldCell.delete(enemy);
        if (oldCell.size === 0) this.grid.delete(oldKey);
      }
    }

    let newCell = this.grid.get(newKey);
    if (!newCell) {
      newCell = new Set();
      this.grid.set(newKey, newCell);
    }
    newCell.add(enemy);
    this.entityCells.set(enemy, newKey);
  }

  /**
   * Retorna todos os inimigos ativos dentro de um raio.
   * Itera apenas as cells que intersectam o AABB do círculo.
   */
  queryRadius(x: number, y: number, radius: number): Enemy[] {
    const results: Enemy[] = [];
    const minCx = ((x - radius) * this.invCellSize) | 0;
    const maxCx = ((x + radius) * this.invCellSize) | 0;
    const minCy = ((y - radius) * this.invCellSize) | 0;
    const maxCy = ((y + radius) * this.invCellSize) | 0;
    const r2 = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(`${cx},${cy}`);
        if (!cell) continue;
        for (const enemy of cell) {
          if (!enemy.active) continue;
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          if (dx * dx + dy * dy <= r2) {
            results.push(enemy);
          }
        }
      }
    }
    return results;
  }

  /**
   * Retorna o inimigo ativo mais próximo dentro de maxDist.
   * Busca em anel expandido a partir da cell central.
   */
  queryNearest(x: number, y: number, maxDist = 600): Enemy | null {
    let bestEnemy: Enemy | null = null;
    let bestDist2 = maxDist * maxDist;

    const centerCx = (x * this.invCellSize) | 0;
    const centerCy = (y * this.invCellSize) | 0;
    const maxRing = Math.ceil(maxDist * this.invCellSize);

    for (let ring = 0; ring <= maxRing; ring++) {
      const minCx = centerCx - ring;
      const maxCx = centerCx + ring;
      const minCy = centerCy - ring;
      const maxCy = centerCy + ring;

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          // Só processa a borda do anel (ring > 0 pula interior já visitado)
          if (ring > 0 && cx > minCx && cx < maxCx && cy > minCy && cy < maxCy) continue;

          const cell = this.grid.get(`${cx},${cy}`);
          if (!cell) continue;
          for (const enemy of cell) {
            if (!enemy.active) continue;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist2) {
              bestDist2 = d2;
              bestEnemy = enemy;
            }
          }
        }
      }

      // Se encontramos um enemy e o próximo anel está fora do raio do melhor candidato,
      // podemos parar (pois qualquer enemy mais longe estaria em anéis mais distantes)
      if (bestEnemy && (ring + 1) * this.cellSize * (ring + 1) * this.cellSize > bestDist2) {
        break;
      }
    }

    return bestEnemy;
  }

  /**
   * Lista cached de todos os inimigos ativos.
   * O array é reconstruído apenas quando o set muda (add/remove).
   */
  getActiveEnemies(): Enemy[] {
    if (!this.cachedArray) {
      this.cachedArray = Array.from(this.activeSet);
    }
    return this.cachedArray;
  }

  getActiveCount(): number {
    return this.activeSet.size;
  }

  clear(): void {
    this.grid.clear();
    this.entityCells.clear();
    this.activeSet.clear();
    this.cachedArray = null;
  }
}

// ── Singleton ──────────────────────────────────────────────────────────
let instance: SpatialHashGrid | null = null;

export function initSpatialGrid(cellSize?: number): SpatialHashGrid {
  instance = new SpatialHashGrid(cellSize);
  return instance;
}

export function getSpatialGrid(): SpatialHashGrid {
  return instance!;
}
