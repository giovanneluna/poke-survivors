/**
 * Map Resize Utility
 *
 * Handles resizing the editor map grid, tracking trimmed cells for undo.
 */

export const MAP_MIN_SIZE = 50;
export const MAP_MAX_SIZE = 500;

export interface ResizeResult {
  readonly newWidth: number;
  readonly newHeight: number;
  /** Terrain entries removed when shrinking (key -> old value) */
  readonly trimmedEntries: ReadonlyArray<readonly [string, string]>;
}

/**
 * Resize the map terrain data.
 *
 * - Expand (new > old): no-op on data, new cells default to grassland.
 * - Shrink (new < old): removes entries outside new bounds, returns them for undo.
 *
 * Clamps dimensions to [MAP_MIN_SIZE, MAP_MAX_SIZE].
 */
export function resizeMap(
  terrainData: Map<string, string>,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
): ResizeResult {
  const clampedW = Math.max(MAP_MIN_SIZE, Math.min(MAP_MAX_SIZE, newWidth));
  const clampedH = Math.max(MAP_MIN_SIZE, Math.min(MAP_MAX_SIZE, newHeight));

  const trimmedEntries: Array<[string, string]> = [];

  // Only trim if shrinking in either dimension
  if (clampedW < oldWidth || clampedH < oldHeight) {
    for (const [key, value] of terrainData) {
      const commaIdx = key.indexOf(',');
      if (commaIdx === -1) continue;

      const col = parseInt(key.substring(0, commaIdx), 10);
      const row = parseInt(key.substring(commaIdx + 1), 10);

      if (col >= clampedW || row >= clampedH) {
        trimmedEntries.push([key, value]);
      }
    }

    // Remove trimmed entries from the map
    for (const [key] of trimmedEntries) {
      terrainData.delete(key);
    }
  }

  return {
    newWidth: clampedW,
    newHeight: clampedH,
    trimmedEntries,
  };
}

/**
 * Restore trimmed entries after an undo operation.
 */
export function restoreTrimmedEntries(
  terrainData: Map<string, string>,
  entries: ReadonlyArray<readonly [string, string]>,
): void {
  for (const [key, value] of entries) {
    terrainData.set(key, value);
  }
}
