/**
 * Map data types for the Map Editor export/import format.
 * Used by WorldSystem (loading) and MapEditorScene (saving).
 */

export interface GameMap {
  readonly name: string;
  readonly version: number;
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;
  readonly terrain: Record<string, string>;
  readonly objects: readonly MapObject[];
  readonly markers: readonly MapMarker[];
}

export interface MapObject {
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly size?: readonly [number, number];
  readonly source?: string;
}

export interface MapMarker {
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  readonly config?: Record<string, unknown>;
}
