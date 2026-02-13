import Phaser from 'phaser';
import { EDITOR_TILES, TILE_SOURCES, type EditorTile, type TileSource, type TileCategory } from '../data/editor-tiles';
import { resizeMap, MAP_MIN_SIZE, MAP_MAX_SIZE } from '../utils/map-resize';

/** Size of each tile cell in pixels */
const TILE_SIZE = 24;
/** Map dimensions in tiles */
const MAP_COLS = 125;
const MAP_ROWS = 125;
/** Total map size in pixels */
const MAP_W = MAP_COLS * TILE_SIZE;
const MAP_H = MAP_ROWS * TILE_SIZE;
/** Camera pan speed in px/frame */
const PAN_SPEED = 12;
/** Zoom limits */
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.1;
/** Background color outside the map */
const BG_COLOR = 0x1a1a1a;
/** Grid line style */
const GRID_COLOR = 0x333333;
const GRID_ALPHA = 0.3;
/** Cursor highlight */
const CURSOR_COLOR = 0xffff00;
const CURSOR_ALPHA = 0.5;
/** Default tile texture key */
const DEFAULT_TILE = 'emerald:ground-grass-light';
/** Margin around map for camera bounds */
const BOUND_MARGIN = 200;
/** Max BFS iterations for bucket fill to prevent hanging */
const BUCKET_MAX_FILL = 10000;
/** Auto-save interval in ms */
const AUTOSAVE_INTERVAL = 30_000;
/** localStorage key prefix */
const STORAGE_KEY = 'poke-map-editor';

/** Serialized map format */
interface MapData {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly defaultTile: string;
  readonly tiles: Record<string, string>;
}

// ── Tool types ─────────────────────────────────────────────────────
type EditorTool = 'brush' | 'bucket' | 'rectangle' | 'eraser';
type BrushSize = 1 | 3 | 5;

/** Source tabs */
const SOURCES = TILE_SOURCES;
const SOURCE_LABELS: Readonly<Record<TileSource, string>> = {
  emerald: 'Emerald', frlg: 'FRLG', pmd: 'PMD',
  crystal: 'Crystal', magma: 'Magma', sky: 'Sky', dark: 'Dark',
};
/** Category tabs */
type PaletteCategory = TileCategory | 'all';
const CATEGORIES: readonly PaletteCategory[] = ['all', 'ground', 'water', 'nature', 'buildings', 'decoration'] as const;
const CATEGORY_LABELS: Readonly<Record<PaletteCategory, string>> = {
  all: 'All', ground: 'Gnd', water: 'Wtr', nature: 'Nat', buildings: 'Bld', decoration: 'Dec',
};
/** Panel layout */
const PALETTE_W = 200;
const PALETTE_TILE_SIZE = 32;
const PALETTE_COLS = 5;
const PALETTE_GAP = 4;
/** Mini-map size */
const MINIMAP_SIZE = 140;
/** Color mapping for mini-map tiles by keyword in tile id */
const MINIMAP_COLORS: ReadonlyArray<readonly [string, number]> = [
  ['water', 0x4488ff],
  ['tree', 0x226622],
  ['bush', 0x338833],
  ['rock', 0x888888],
  ['fence', 0x996633],
  ['stump', 0x665533],
  ['wall', 0x555555],
  ['building', 0xcc8844],
  ['pokecenter', 0xff4444],
  ['mart', 0x4488ff],
  ['house', 0xbb8844],
  ['gym', 0xffaa00],
  ['roof', 0xcc4444],
  ['door', 0x886644],
  ['window', 0x88ccff],
  ['dirt', 0xbb9955],
  ['sand', 0xddcc88],
  ['path', 0xccbb88],
  ['city', 0xaaaaaa],
  ['ledge', 0x997744],
  ['flower', 0xff88aa],
  ['grass', 0x44aa44],
  ['sign', 0xaa8855],
  ['lamp', 0xffdd44],
  ['mail', 0x6688aa],
  ['bench', 0x886644],
  ['pokeball', 0xff4444],
  ['berry', 0xff6688],
  ['stairs', 0x999999],
  ['tall-grass', 0x55bb55],
] as const;

// ── Tool config ────────────────────────────────────────────────────
interface ToolDef {
  readonly key: EditorTool;
  readonly label: string;
  readonly shortcut: string;
}

const TOOLS: readonly ToolDef[] = [
  { key: 'brush', label: 'Brush', shortcut: 'B' },
  { key: 'bucket', label: 'Bucket', shortcut: 'G' },
  { key: 'rectangle', label: 'Rect', shortcut: 'R' },
  { key: 'eraser', label: 'Eraser', shortcut: 'E' },
] as const;

const BRUSH_SIZES: readonly BrushSize[] = [1, 3, 5] as const;

/** Max undo/redo history */
const UNDO_LIMIT = 100;

/** A single tile change: key='col,row', before/after texture key (undefined = default) */
interface TileDiff {
  readonly key: string;
  readonly before: string | undefined;
  readonly after: string | undefined;
}

/** An undoable action = collection of tile diffs */
interface EditorAction {
  readonly diffs: readonly TileDiff[];
}

export class MapEditorScene extends Phaser.Scene {
  private mapWidth = MAP_COLS;
  private mapHeight = MAP_ROWS;
  /** Terrain data: key = 'col,row', value = tile texture key */
  private terrainData = new Map<string, string>();

  /** Pool of tile sprites for visible area (culled) */
  private tilePool: Phaser.GameObjects.Image[] = [];
  /** Grid line graphics — redrawn on scroll/zoom */
  private gridGfx!: Phaser.GameObjects.Graphics;
  /** Cursor highlight graphic */
  private cursorGfx!: Phaser.GameObjects.Graphics;
  /** Coordinate label */
  private coordText!: Phaser.GameObjects.Text;

  /** Keyboard keys for pan */
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  /** Middle-mouse drag state */
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCamStartX = 0;
  private dragCamStartY = 0;

  /** Track last visible region to avoid redundant redraws */
  private lastVisLeft = -1;
  private lastVisTop = -1;
  private lastVisRight = -1;
  private lastVisBottom = -1;
  private lastZoom = -1;

  // ── Tool state ──────────────────────────────────────────────────
  private activeTool: EditorTool = 'brush';
  private brushSize: BrushSize = 1;
  private selectedTileId: string = EDITOR_TILES[0].id;
  private activeSource: TileSource = 'emerald';
  private activeCategory: PaletteCategory = 'all';

  /** Left-mouse painting state */
  private isPainting = false;
  /** Rectangle tool drag state */
  private rectStartCol = -1;
  private rectStartRow = -1;
  /** Rectangle preview graphics */
  private rectPreviewGfx!: Phaser.GameObjects.Graphics;

  // ── Undo/Redo ─────────────────────────────────────────────────
  private undoStack: EditorAction[] = [];
  private redoStack: EditorAction[] = [];
  /** Tiles captured before the current stroke (key → old value or undefined) */
  private strokeBefore = new Map<string, string | undefined>();
  /** Whether a stroke is currently being recorded */
  private isRecordingStroke = false;

  // ── Save/Load ──────────────────────────────────────────────────
  private mapName = 'Untitled Map';
  // autoSaveTimer kept as TimerEvent ref (managed by scene lifecycle)
  private statusText!: Phaser.GameObjects.Text;

  // ── UI elements (fixed to camera) ───────────────────────────────
  private toolbarBg!: Phaser.GameObjects.Graphics;
  private toolButtons: Phaser.GameObjects.Text[] = [];
  private brushSizeButtons: Phaser.GameObjects.Text[] = [];
  private paletteContainer!: Phaser.GameObjects.Container;
  private paletteTileItems: Phaser.GameObjects.Image[] = [];
  private paletteHighlight!: Phaser.GameObjects.Graphics;
  private sourceButtons: Phaser.GameObjects.Text[] = [];
  private categoryButtons: Phaser.GameObjects.Text[] = [];
  /** Filtered tiles for current source+category */
  private filteredTiles: readonly EditorTile[] = [];
  /** Y position where tile grid starts (below category tabs) */
  private paletteTileStartY = 115;
  // ── Mini-map ──────────────────────────────────────────────────
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private minimapViewport!: Phaser.GameObjects.Graphics;
  private minimapDirty = true;
  /** Dedicated UI camera — doesn't zoom/scroll, keeps UI fixed */
  private uiCam!: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super({ key: 'MapEditorScene' });
  }

  create(): void {
    this.terrainData.clear();
    this.tilePool = [];
    this.isDragging = false;
    this.isPainting = false;
    this.lastVisLeft = -1;
    this.activeTool = 'brush';
    this.brushSize = 1;
    this.selectedTileId = EDITOR_TILES[0].id;
    this.activeSource = 'emerald';
    this.activeCategory = 'all';
    this.rectStartCol = -1;
    this.rectStartRow = -1;
    this.undoStack = [];
    this.redoStack = [];
    this.strokeBefore.clear();
    this.isRecordingStroke = false;
    this.mapName = 'Untitled Map';

    // Background
    this.cameras.main.setBackgroundColor(BG_COLOR);

    // Camera bounds: map + margin
    this.cameras.main.setBounds(
      -BOUND_MARGIN,
      -BOUND_MARGIN,
      MAP_W + BOUND_MARGIN * 2,
      MAP_H + BOUND_MARGIN * 2,
    );
    // Start camera centered on the map
    this.cameras.main.centerOn(MAP_W / 2, MAP_H / 2);

    // Grid graphics (depth above tiles, below cursor)
    this.gridGfx = this.add.graphics().setDepth(1);

    // Cursor highlight
    this.cursorGfx = this.add.graphics().setDepth(2);

    // Rectangle preview
    this.rectPreviewGfx = this.add.graphics().setDepth(3);

    // Coord label — fixed to camera
    this.coordText = this.add.text(10, 10, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 4 },
    }).setDepth(100).setScrollFactor(0);

    // ── Toolbar + Palette + Save bar UI ──
    this.createToolbar();
    this.createPalette();
    this.createSaveBar();
    this.createMinimap();

    // Status text (top-right, fixed)
    this.statusText = this.add.text(this.cameras.main.width - 10, 10, '', {
      fontSize: '12px', color: '#44ff44', fontFamily: 'monospace',
      backgroundColor: '#000000aa', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // Try to recover auto-save
    this.loadFromLocalStorage();

    // Auto-save timer (owned by scene, auto-destroyed on shutdown)
    this.time.addEvent({
      delay: AUTOSAVE_INTERVAL,
      loop: true,
      callback: () => this.saveToLocalStorage(),
    });

    // WASD keys
    const kb = this.input.keyboard;
    if (kb) {
      this.keys = {
        W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      // ESC to go back to SelectScene
      kb.on('keydown-ESC', () => {
        this.scene.start('SelectScene');
      });

      // Tool shortcuts
      kb.on('keydown-B', () => this.setTool('brush'));
      kb.on('keydown-G', () => this.setTool('bucket'));
      kb.on('keydown-R', () => this.setTool('rectangle'));
      kb.on('keydown-E', () => this.setTool('eraser'));

      // Brush size shortcuts
      kb.on('keydown-ONE', () => this.setBrushSize(1));
      kb.on('keydown-TWO', () => this.setBrushSize(3));
      kb.on('keydown-THREE', () => this.setBrushSize(5));

      // Undo/Redo: Ctrl+Z / Ctrl+Y
      kb.on('keydown-Z', (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          this.undo();
        }
      });
      kb.on('keydown-Y', (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          this.redo();
        }
      });

      // Ctrl+S: Save to localStorage
      kb.on('keydown-S', (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.saveToLocalStorage();
        }
      });
    }

    // ── Painting input ──────────────────────────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.dragCamStartX = this.cameras.main.scrollX;
        this.dragCamStartY = this.cameras.main.scrollY;
        return;
      }

      // Ignore clicks on UI area (left toolbar + bottom palette)
      if (this.isPointerOnUI(pointer)) return;

      const { col, row } = this.pointerToTile(pointer);
      if (col < 0 || col >= this.mapWidth || row < 0 || row >= this.mapHeight) return;

      if (pointer.rightButtonDown()) {
        // Right-click always erases
        this.beginStroke();
        this.eraseTile(col, row);
        this.isPainting = true;
        this.invalidateVisibleRegion();
        return;
      }

      // Left-click: tool action
      if (pointer.leftButtonDown()) {
        this.isPainting = true;
        this.beginStroke();

        switch (this.activeTool) {
          case 'brush':
            this.paintBrush(col, row, this.selectedTileId);
            break;
          case 'eraser':
            this.eraseBrush(col, row);
            break;
          case 'bucket':
            this.bucketFill(col, row, this.selectedTileId);
            // Bucket is atomic — commit immediately
            this.commitStroke();
            break;
          case 'rectangle':
            this.rectStartCol = col;
            this.rectStartRow = row;
            break;
        }
        this.invalidateVisibleRegion();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = this.dragStartX - pointer.x;
        const dy = this.dragStartY - pointer.y;
        const cam = this.cameras.main;
        cam.scrollX = this.dragCamStartX + dx / cam.zoom;
        cam.scrollY = this.dragCamStartY + dy / cam.zoom;
        return;
      }

      if (!this.isPainting) return;
      if (this.isPointerOnUI(pointer)) return;

      const { col, row } = this.pointerToTile(pointer);
      if (col < 0 || col >= this.mapWidth || row < 0 || row >= this.mapHeight) return;

      if (pointer.rightButtonDown()) {
        this.eraseTile(col, row);
        this.invalidateVisibleRegion();
        return;
      }

      // Continuous painting for brush/eraser
      if (this.activeTool === 'brush') {
        this.paintBrush(col, row, this.selectedTileId);
        this.invalidateVisibleRegion();
      } else if (this.activeTool === 'eraser') {
        this.eraseBrush(col, row);
        this.invalidateVisibleRegion();
      }
      // Rectangle: preview handled in updateCursor
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonReleased()) {
        this.isDragging = false;
        return;
      }

      if (this.isPainting && this.activeTool === 'rectangle' && this.rectStartCol >= 0) {
        const { col, row } = this.pointerToTile(pointer);
        const endCol = Phaser.Math.Clamp(col, 0, this.mapWidth - 1);
        const endRow = Phaser.Math.Clamp(row, 0, this.mapHeight - 1);
        this.paintRectangle(this.rectStartCol, this.rectStartRow, endCol, endRow, this.selectedTileId);
        this.rectStartCol = -1;
        this.rectStartRow = -1;
        this.rectPreviewGfx.clear();
        this.invalidateVisibleRegion();
      }

      // Commit the stroke (brush/eraser drag or rectangle)
      this.commitStroke();
      this.isPainting = false;
    });

    // Disable context menu on canvas
    this.game.canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());

    // Zoom with scroll wheel — zoom toward cursor
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const pointer = this.input.activePointer;

      const worldXBefore = cam.scrollX + pointer.x / cam.zoom;
      const worldYBefore = cam.scrollY + pointer.y / cam.zoom;

      const direction = dy > 0 ? -1 : 1;
      const newZoom = Phaser.Math.Clamp(cam.zoom + direction * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
      cam.setZoom(newZoom);

      cam.scrollX = worldXBefore - pointer.x / cam.zoom;
      cam.scrollY = worldYBefore - pointer.y / cam.zoom;
    });

    // ── Dual-camera setup: main for map (zoom/pan), uiCam for fixed UI ──
    this.setupCameraLayers();

    // Initial render
    this.renderVisibleTiles();
  }

  update(): void {
    // ── WASD pan ──
    if (this.keys) {
      const cam = this.cameras.main;
      const speed = PAN_SPEED / cam.zoom;
      if (this.keys.W.isDown) cam.scrollY -= speed;
      if (this.keys.S.isDown) cam.scrollY += speed;
      if (this.keys.A.isDown) cam.scrollX -= speed;
      if (this.keys.D.isDown) cam.scrollX += speed;
    }

    // ── Render visible tiles (culling) ──
    this.renderVisibleTiles();

    // ── Cursor highlight + coord label ──
    this.updateCursor();

    // ── Mini-map viewport indicator ──
    this.updateMinimapViewport();
  }

  // ══════════════════════════════════════════════════════════════════
  // ── TOOLBAR UI ──
  // ══════════════════════════════════════════════════════════════════

  private createToolbar(): void {
    const x = 10;
    let y = 40;
    const btnW = 70;
    const btnH = 24;
    const gap = 4;

    // Background panel
    this.toolbarBg = this.add.graphics().setDepth(100).setScrollFactor(0);
    this.toolbarBg.fillStyle(0x111122, 0.9);
    this.toolbarBg.fillRoundedRect(x - 4, y - 8, btnW + 8, TOOLS.length * (btnH + gap) + 130, 6);
    this.toolbarBg.lineStyle(1, 0x444466);
    this.toolbarBg.strokeRoundedRect(x - 4, y - 8, btnW + 8, TOOLS.length * (btnH + gap) + 130, 6);

    // Tool label
    this.add.text(x + btnW / 2, y - 2, 'TOOLS', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
    y += 14;

    // Tool buttons
    this.toolButtons = [];
    for (const tool of TOOLS) {
      const btn = this.add.text(x + btnW / 2, y + btnH / 2, `${tool.label} [${tool.shortcut}]`, {
        fontSize: '11px',
        color: this.activeTool === tool.key ? '#ffcc00' : '#aaaaaa',
        fontFamily: 'monospace',
        fontStyle: this.activeTool === tool.key ? 'bold' : 'normal',
        backgroundColor: this.activeTool === tool.key ? '#333355' : '#222233',
        padding: { x: 4, y: 3 },
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.setTool(tool.key));
      this.toolButtons.push(btn);
      y += btnH + gap;
    }

    // ── Brush size (only relevant for brush/eraser) ──
    y += 6;
    this.add.text(x + btnW / 2, y, 'SIZE', {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
    y += 14;

    this.brushSizeButtons = [];
    const sizeLabels = ['1x1', '3x3', '5x5'];
    for (let i = 0; i < BRUSH_SIZES.length; i++) {
      const size = BRUSH_SIZES[i];
      const bx = x + 4 + i * 23;
      const btn = this.add.text(bx, y, sizeLabels[i], {
        fontSize: '10px',
        color: this.brushSize === size ? '#ffcc00' : '#888888',
        fontFamily: 'monospace',
        fontStyle: this.brushSize === size ? 'bold' : 'normal',
      }).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.setBrushSize(size));
      this.brushSizeButtons.push(btn);
    }

    // ── Expandir / Map size ──
    y += 22;
    const expandBtn = this.add.text(x + btnW / 2, y, 'Expandir', {
      fontSize: '11px', color: '#44ff88', fontFamily: 'monospace',
      backgroundColor: '#222233', padding: { x: 4, y: 3 },
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });
    expandBtn.on('pointerdown', () => this.resizeMapAction());

    y += btnH + gap;
    const randomBtn = this.add.text(x + btnW / 2, y, 'Random', {
      fontSize: '11px', color: '#ffaa44', fontFamily: 'monospace',
      backgroundColor: '#222233', padding: { x: 4, y: 3 },
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });
    randomBtn.on('pointerdown', () => this.generateRandom());
  }

  private createPalette(): void {
    const cam = this.cameras.main;
    const px = cam.width - PALETTE_W - 10;
    const py = 40;

    // Container for all palette UI (fixed to camera)
    this.paletteContainer = this.add.container(0, 0).setDepth(100).setScrollFactor(0);

    // Background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x111122, 0.92);
    bg.fillRoundedRect(px, py, PALETTE_W, cam.height - py - 10, 6);
    bg.lineStyle(1, 0x444466);
    bg.strokeRoundedRect(px, py, PALETTE_W, cam.height - py - 10, 6);
    this.paletteContainer.add(bg);

    // Title
    const title = this.add.text(px + PALETTE_W / 2, py + 8, 'TILES', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.paletteContainer.add(title);

    // Source tabs — bigger hit area for clickability
    let tabX = px + 6;
    const tabY = py + 24;
    this.sourceButtons = [];
    for (const source of SOURCES) {
      const btn = this.add.text(tabX, tabY, SOURCE_LABELS[source], {
        fontSize: '11px',
        color: source === this.activeSource ? '#ffcc00' : '#888888',
        fontFamily: 'monospace',
        fontStyle: source === this.activeSource ? 'bold' : 'normal',
        backgroundColor: source === this.activeSource ? '#333355' : '#1a1a33',
        padding: { x: 6, y: 3 },
      }).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.activeSource = source;
        this.refreshPaletteTiles();
        this.updateSourceButtons();
        this.updateCategoryButtons();
      });
      this.paletteContainer.add(btn);
      this.sourceButtons.push(btn);
      tabX += btn.width + 4;
    }

    // Category tabs — abbreviated labels, wrapping if needed
    let catX = px + 6;
    let catY = tabY + 24;
    this.categoryButtons = [];
    for (const cat of CATEGORIES) {
      const btn = this.add.text(0, 0, CATEGORY_LABELS[cat], {
        fontSize: '10px',
        color: cat === this.activeCategory ? '#44aaff' : '#666666',
        fontFamily: 'monospace',
        fontStyle: cat === this.activeCategory ? 'bold' : 'normal',
        backgroundColor: cat === this.activeCategory ? '#222244' : undefined,
        padding: { x: 4, y: 2 },
      }).setInteractive({ useHandCursor: true });

      // Wrap to next row if overflowing
      if (catX + btn.width > px + PALETTE_W - 6 && catX > px + 6) {
        catY += 18;
        catX = px + 6;
      }
      btn.setPosition(catX, catY);
      catX += btn.width + 4;

      btn.on('pointerdown', () => {
        this.activeCategory = cat;
        this.refreshPaletteTiles();
        this.updateCategoryButtons();
      });
      this.paletteContainer.add(btn);
      this.categoryButtons.push(btn);
    }

    // Highlight for selected tile
    this.paletteHighlight = this.add.graphics();
    this.paletteContainer.add(this.paletteHighlight);

    // Store the tile grid start Y (below category tabs + gap)
    this.paletteTileStartY = catY + 24;

    // Initial tile grid
    this.refreshPaletteTiles();
  }

  /** Rebuild the tile grid in the palette panel */
  private refreshPaletteTiles(): void {
    // Remove old tile images
    for (const img of this.paletteTileItems) {
      img.destroy();
    }
    this.paletteTileItems = [];

    // Filter tiles
    this.filteredTiles = EDITOR_TILES.filter(
      t => t.source === this.activeSource && (this.activeCategory === 'all' || t.category === this.activeCategory),
    );

    const cam = this.cameras.main;
    const px = cam.width - PALETTE_W - 10;
    const startY = this.paletteTileStartY;
    const startX = px + 8;

    for (let i = 0; i < this.filteredTiles.length; i++) {
      const tile = this.filteredTiles[i];
      const col = i % PALETTE_COLS;
      const row = Math.floor(i / PALETTE_COLS);
      const ix = startX + col * (PALETTE_TILE_SIZE + PALETTE_GAP) + PALETTE_TILE_SIZE / 2;
      const iy = startY + row * (PALETTE_TILE_SIZE + PALETTE_GAP) + PALETTE_TILE_SIZE / 2;

      const img = this.add.image(ix, iy, tile.id)
        .setDisplaySize(PALETTE_TILE_SIZE, PALETTE_TILE_SIZE)
        .setDepth(102)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      img.on('pointerdown', () => this.selectPaletteTile(tile));
      img.on('pointerover', () => {
        this.showStatus(tile.name);
      });

      this.paletteContainer.add(img);
      this.paletteTileItems.push(img);
    }

    this.drawPaletteHighlight();
  }

  private drawPaletteHighlight(): void {
    this.paletteHighlight.clear();

    const selectedIdx = this.filteredTiles.findIndex(t => t.id === this.selectedTileId);
    if (selectedIdx < 0) return;

    const cam = this.cameras.main;
    const px = cam.width - PALETTE_W - 10;
    const startX = px + 8;
    const startY = this.paletteTileStartY;
    const col = selectedIdx % PALETTE_COLS;
    const row = Math.floor(selectedIdx / PALETTE_COLS);

    const ix = startX + col * (PALETTE_TILE_SIZE + PALETTE_GAP);
    const iy = startY + row * (PALETTE_TILE_SIZE + PALETTE_GAP);

    this.paletteHighlight.lineStyle(2, 0xffcc00);
    this.paletteHighlight.strokeRect(ix - 1, iy - 1, PALETTE_TILE_SIZE + 2, PALETTE_TILE_SIZE + 2);
  }

  private selectPaletteTile(tile: EditorTile): void {
    this.selectedTileId = tile.id;
    this.drawPaletteHighlight();
    // Auto-switch to brush if currently on eraser
    if (this.activeTool === 'eraser') {
      this.setTool('brush');
    }
  }

  private updateSourceButtons(): void {
    for (let i = 0; i < SOURCES.length; i++) {
      const btn = this.sourceButtons[i];
      const active = SOURCES[i] === this.activeSource;
      btn.setColor(active ? '#ffcc00' : '#888888');
      btn.setFontStyle(active ? 'bold' : 'normal');
      btn.setBackgroundColor(active ? '#333355' : '#1a1a33');
    }
  }

  private updateCategoryButtons(): void {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const btn = this.categoryButtons[i];
      const active = CATEGORIES[i] === this.activeCategory;
      btn.setColor(active ? '#44aaff' : '#666666');
      btn.setFontStyle(active ? 'bold' : 'normal');
      btn.setBackgroundColor(active ? '#222244' : '');
    }
  }

  private setTool(tool: EditorTool): void {
    this.activeTool = tool;
    this.updateToolbarUI();
  }

  private setBrushSize(size: BrushSize): void {
    this.brushSize = size;
    this.updateBrushSizeUI();
  }

  private updateToolbarUI(): void {
    for (let i = 0; i < TOOLS.length; i++) {
      const btn = this.toolButtons[i];
      const isActive = TOOLS[i].key === this.activeTool;
      btn.setColor(isActive ? '#ffcc00' : '#aaaaaa');
      btn.setFontStyle(isActive ? 'bold' : 'normal');
      btn.setBackgroundColor(isActive ? '#333355' : '#222233');
    }
  }

  private updateBrushSizeUI(): void {
    for (let i = 0; i < BRUSH_SIZES.length; i++) {
      const btn = this.brushSizeButtons[i];
      const isActive = BRUSH_SIZES[i] === this.brushSize;
      btn.setColor(isActive ? '#ffcc00' : '#888888');
      btn.setFontStyle(isActive ? 'bold' : 'normal');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ── SAVE BAR UI ──
  // ══════════════════════════════════════════════════════════════════

  private createSaveBar(): void {
    const barY = 10;
    let barX = 200; // After coord text area
    const gap = 8;

    // Map name (editable via prompt)
    const nameBtn = this.add.text(barX, barY, this.mapName, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#222244', padding: { x: 6, y: 3 },
    }).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });

    nameBtn.on('pointerdown', () => {
      const newName = prompt('Nome do mapa:', this.mapName);
      if (newName && newName.trim().length > 0) {
        this.mapName = newName.trim();
        nameBtn.setText(this.mapName);
      }
    });
    barX += 180;

    // Save buttons
    const buttons: Array<{ label: string; color: string; action: () => void }> = [
      { label: 'Salvar [Ctrl+S]', color: '#44ff44', action: () => this.saveToLocalStorage() },
      { label: 'Copiar JSON', color: '#44aaff', action: () => this.copyJsonToClipboard() },
      { label: 'Baixar JSON', color: '#ffaa44', action: () => this.downloadJson() },
      { label: 'Carregar', color: '#ff88ff', action: () => this.loadFromFile() },
    ];

    for (const def of buttons) {
      const btn = this.add.text(barX, barY, def.label, {
        fontSize: '11px', color: def.color, fontFamily: 'monospace',
        backgroundColor: '#1a1a33', padding: { x: 6, y: 4 },
      }).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout', () => btn.setAlpha(1));
      btn.on('pointerdown', def.action);

      barX += btn.width + gap;
    }

    // Update isPointerOnUI to account for save bar
    // (handled via the existing check + extended area)
  }

  // ══════════════════════════════════════════════════════════════════
  // ── SAVE / LOAD ──
  // ══════════════════════════════════════════════════════════════════

  /** Convert terrain data to serializable JSON object */
  private toMapData(): MapData {
    const tiles: Record<string, string> = {};
    for (const [key, value] of this.terrainData) {
      tiles[key] = value;
    }
    return {
      name: this.mapName,
      width: this.mapWidth,
      height: this.mapHeight,
      defaultTile: DEFAULT_TILE,
      tiles,
    };
  }

  /** Load map from MapData object */
  private fromMapData(data: MapData): void {
    this.mapName = data.name;
    this.mapWidth = data.width || MAP_COLS;
    this.mapHeight = data.height || MAP_ROWS;
    this.terrainData.clear();
    for (const [key, value] of Object.entries(data.tiles)) {
      this.terrainData.set(key, value);
    }
    this.undoStack = [];
    this.redoStack = [];
    // Update camera bounds for new dimensions
    const mapW = this.mapWidth * TILE_SIZE;
    const mapH = this.mapHeight * TILE_SIZE;
    this.cameras.main.setBounds(
      -BOUND_MARGIN, -BOUND_MARGIN,
      mapW + BOUND_MARGIN * 2, mapH + BOUND_MARGIN * 2,
    );
    this.invalidateVisibleRegion();
    this.showStatus('Mapa carregado');
  }

  /** Save to localStorage */
  private saveToLocalStorage(): void {
    try {
      const data = this.toMapData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.showStatus('Salvo!');
    } catch {
      this.showStatus('Erro ao salvar');
    }
  }

  /** Load from localStorage (auto-save recovery) */
  private loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as MapData;
      if (data.tiles && typeof data.tiles === 'object') {
        this.fromMapData(data);
        this.showStatus('Auto-save recuperado');
      }
    } catch {
      // Ignore corrupt data
    }
  }

  /** Copy JSON to clipboard */
  private copyJsonToClipboard(): void {
    const json = JSON.stringify(this.toMapData(), null, 2);
    navigator.clipboard.writeText(json).then(
      () => this.showStatus('JSON copiado!'),
      () => this.showStatus('Erro ao copiar'),
    );
  }

  /** Download JSON as file */
  private downloadJson(): void {
    const json = JSON.stringify(this.toMapData(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.mapName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showStatus('Download iniciado');
  }

  /** Load from file via file input */
  private loadFromFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as MapData;
          if (data.tiles && typeof data.tiles === 'object') {
            this.fromMapData(data);
          } else {
            this.showStatus('JSON invalido');
          }
        } catch {
          this.showStatus('Erro ao ler JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /** Show a temporary status message */
  private showStatus(msg: string): void {
    this.statusText.setText(msg);
    this.time.delayedCall(2000, () => {
      if (this.statusText.text === msg) {
        this.statusText.setText('');
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // ── MINI-MAP ──
  // ══════════════════════════════════════════════════════════════════

  private createMinimap(): void {
    const cam = this.cameras.main;
    // Position: bottom-left corner
    const mx = 10;
    const my = cam.height - MINIMAP_SIZE - 10;

    // Background border
    const border = this.add.graphics().setDepth(100).setScrollFactor(0);
    border.fillStyle(0x000000, 0.8);
    border.fillRect(mx - 2, my - 2, MINIMAP_SIZE + 4, MINIMAP_SIZE + 4);
    border.lineStyle(1, 0x444466);
    border.strokeRect(mx - 2, my - 2, MINIMAP_SIZE + 4, MINIMAP_SIZE + 4);

    // Tile graphics layer
    this.minimapGfx = this.add.graphics().setDepth(101).setScrollFactor(0);

    // Viewport indicator layer
    this.minimapViewport = this.add.graphics().setDepth(102).setScrollFactor(0);

    // Click on minimap to navigate
    const hitzone = this.add.rectangle(
      mx + MINIMAP_SIZE / 2, my + MINIMAP_SIZE / 2,
      MINIMAP_SIZE, MINIMAP_SIZE, 0xffffff, 0,
    ).setDepth(103).setScrollFactor(0).setInteractive({ useHandCursor: true });

    hitzone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.minimapNavigate(pointer, mx, my);
    });
    hitzone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.minimapNavigate(pointer, mx, my);
      }
    });

    // Initial draw
    this.redrawMinimap();
  }

  private minimapNavigate(pointer: Phaser.Input.Pointer, mx: number, my: number): void {
    const scale = MINIMAP_SIZE / Math.max(this.mapWidth, this.mapHeight);
    const relX = (pointer.x - mx) / scale;
    const relY = (pointer.y - my) / scale;
    const cam = this.cameras.main;
    const worldX = relX * TILE_SIZE;
    const worldY = relY * TILE_SIZE;
    cam.centerOn(worldX, worldY);
  }

  /** Get minimap color for a tile id */
  private getTileColor(tileId: string): number {
    const lower = tileId.toLowerCase();
    for (const [keyword, color] of MINIMAP_COLORS) {
      if (lower.includes(keyword)) return color;
    }
    return 0x44aa44; // default grass
  }

  /** Full redraw of minimap tiles (called when terrainData changes) */
  private redrawMinimap(): void {
    this.minimapGfx.clear();
    this.minimapDirty = false;

    const cam = this.cameras.main;
    const mx = 10;
    const my = cam.height - MINIMAP_SIZE - 10;
    const scale = MINIMAP_SIZE / Math.max(this.mapWidth, this.mapHeight);
    const pixelSize = Math.max(1, Math.ceil(scale));

    // Default fill (grass green)
    this.minimapGfx.fillStyle(0x44aa44);
    this.minimapGfx.fillRect(mx, my, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw changed tiles
    for (const [key, tileId] of this.terrainData) {
      const parts = key.split(',');
      const col = parseInt(parts[0], 10);
      const row = parseInt(parts[1], 10);
      const color = this.getTileColor(tileId);
      this.minimapGfx.fillStyle(color);
      this.minimapGfx.fillRect(
        mx + Math.floor(col * scale),
        my + Math.floor(row * scale),
        pixelSize,
        pixelSize,
      );
    }
  }

  /** Update viewport indicator on minimap (every frame) */
  private updateMinimapViewport(): void {
    // Redraw tiles if dirty
    if (this.minimapDirty) {
      this.redrawMinimap();
    }

    this.minimapViewport.clear();

    const cam = this.cameras.main;
    const mx = 10;
    const my = cam.height - MINIMAP_SIZE - 10;
    const scale = MINIMAP_SIZE / Math.max(this.mapWidth, this.mapHeight);
    const invZoom = 1 / cam.zoom;

    // Viewport rect in tile coords
    const viewLeft = cam.scrollX / TILE_SIZE;
    const viewTop = cam.scrollY / TILE_SIZE;
    const viewW = (cam.width * invZoom) / TILE_SIZE;
    const viewH = (cam.height * invZoom) / TILE_SIZE;

    this.minimapViewport.lineStyle(1, 0xffffff, 0.8);
    this.minimapViewport.strokeRect(
      mx + viewLeft * scale,
      my + viewTop * scale,
      viewW * scale,
      viewH * scale,
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ── DUAL-CAMERA SETUP ──
  // ══════════════════════════════════════════════════════════════════

  /**
   * Creates a dedicated UI camera so fixed elements don't zoom/scale with the map.
   * Main camera: renders map tiles, grid, cursor (depth < 100).
   * UI camera: renders toolbar, palette, minimap, save bar (depth >= 100).
   */
  private setupCameraLayers(): void {
    const cam = this.cameras.main;
    this.uiCam = this.cameras.add(0, 0, cam.width, cam.height);

    // Categorize ALL existing game objects by depth threshold
    for (const child of this.children.list) {
      const d = (child as unknown as { depth: number }).depth ?? 0;
      if (d >= 100) {
        // UI element → hide from main (zoom) camera
        cam.ignore(child);
      } else {
        // Map element → hide from UI (fixed) camera
        this.uiCam.ignore(child);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ── UNDO / REDO ──
  // ══════════════════════════════════════════════════════════════════

  /** Begin recording tile changes for a stroke */
  private beginStroke(): void {
    this.strokeBefore.clear();
    this.isRecordingStroke = true;
  }

  /** Record the "before" value of a tile (only first occurrence per stroke) */
  private recordTileBefore(key: string): void {
    if (!this.isRecordingStroke) return;
    if (this.strokeBefore.has(key)) return; // Already captured
    this.strokeBefore.set(key, this.terrainData.get(key));
  }

  /** Finish recording and push action onto undo stack */
  private commitStroke(): void {
    if (!this.isRecordingStroke) return;
    this.isRecordingStroke = false;

    const diffs: TileDiff[] = [];
    for (const [key, before] of this.strokeBefore) {
      const after = this.terrainData.get(key);
      // Only record if value actually changed
      if (before !== after) {
        diffs.push({ key, before, after });
      }
    }
    this.strokeBefore.clear();

    if (diffs.length === 0) return; // No actual changes

    this.undoStack.push({ diffs });
    if (this.undoStack.length > UNDO_LIMIT) {
      this.undoStack.shift();
    }
    // Any new action clears the redo stack
    this.redoStack.length = 0;
  }

  private undo(): void {
    const action = this.undoStack.pop();
    if (!action) return;

    // Apply reverse diffs
    for (const diff of action.diffs) {
      if (diff.before === undefined) {
        this.terrainData.delete(diff.key);
      } else {
        this.terrainData.set(diff.key, diff.before);
      }
    }

    this.redoStack.push(action);
    this.invalidateVisibleRegion();
  }

  private redo(): void {
    const action = this.redoStack.pop();
    if (!action) return;

    // Apply forward diffs
    for (const diff of action.diffs) {
      if (diff.after === undefined) {
        this.terrainData.delete(diff.key);
      } else {
        this.terrainData.set(diff.key, diff.after);
      }
    }

    this.undoStack.push(action);
    this.invalidateVisibleRegion();
  }

  // ══════════════════════════════════════════════════════════════════
  // ── PAINTING OPERATIONS ──
  // ══════════════════════════════════════════════════════════════════

  /** Paint a brush stroke centered at (col, row) */
  private paintBrush(col: number, row: number, tileKey: string): void {
    const half = Math.floor(this.brushSize / 2);
    for (let dr = -half; dr <= half; dr++) {
      for (let dc = -half; dc <= half; dc++) {
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && c < this.mapWidth && r >= 0 && r < this.mapHeight) {
          const k = `${c},${r}`;
          this.recordTileBefore(k);
          this.terrainData.set(k, tileKey);
        }
      }
    }
  }

  /** Erase tiles using current brush size */
  private eraseBrush(col: number, row: number): void {
    const half = Math.floor(this.brushSize / 2);
    for (let dr = -half; dr <= half; dr++) {
      for (let dc = -half; dc <= half; dc++) {
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && c < this.mapWidth && r >= 0 && r < this.mapHeight) {
          const k = `${c},${r}`;
          this.recordTileBefore(k);
          this.terrainData.delete(k);
        }
      }
    }
  }

  /** Erase single tile (right-click) */
  private eraseTile(col: number, row: number): void {
    const k = `${col},${row}`;
    this.recordTileBefore(k);
    this.terrainData.delete(k);
  }

  /** Flood fill using BFS from (startCol, startRow) */
  private bucketFill(startCol: number, startRow: number, tileKey: string): void {
    const targetKey = this.terrainData.get(`${startCol},${startRow}`) ?? DEFAULT_TILE;
    if (targetKey === tileKey) return; // Already the target tile

    const visited = new Set<string>();
    const queue: Array<[number, number]> = [[startCol, startRow]];
    let iterations = 0;

    while (queue.length > 0 && iterations < BUCKET_MAX_FILL) {
      const item = queue.shift();
      if (!item) break;
      const [c, r] = item;
      const key = `${c},${r}`;

      if (visited.has(key)) continue;
      if (c < 0 || c >= this.mapWidth || r < 0 || r >= this.mapHeight) continue;

      const currentKey = this.terrainData.get(key) ?? DEFAULT_TILE;
      if (currentKey !== targetKey) continue;

      visited.add(key);
      this.recordTileBefore(key);
      this.terrainData.set(key, tileKey);
      iterations++;

      // 4-directional neighbors
      queue.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
    }
  }

  /** Fill a rectangle region with the given tile */
  private paintRectangle(col1: number, row1: number, col2: number, row2: number, tileKey: string): void {
    const minC = Math.min(col1, col2);
    const maxC = Math.max(col1, col2);
    const minR = Math.min(row1, row2);
    const maxR = Math.max(row1, row2);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (c >= 0 && c < this.mapWidth && r >= 0 && r < this.mapHeight) {
          const k = `${c},${r}`;
          this.recordTileBefore(k);
          this.terrainData.set(k, tileKey);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ── HELPERS ──
  // ══════════════════════════════════════════════════════════════════

  /** Convert pointer screen position to tile coordinates */
  private pointerToTile(pointer: Phaser.Input.Pointer): { col: number; row: number } {
    const cam = this.cameras.main;
    const worldX = cam.scrollX + pointer.x / cam.zoom;
    const worldY = cam.scrollY + pointer.y / cam.zoom;
    return {
      col: Math.floor(worldX / TILE_SIZE),
      row: Math.floor(worldY / TILE_SIZE),
    };
  }

  /** Check if pointer is over UI panels (toolbar, palette panel, save bar, or minimap) */
  private isPointerOnUI(pointer: Phaser.Input.Pointer): boolean {
    const cam = this.cameras.main;
    // Save bar area (top)
    if (pointer.y < 35) return true;
    // Toolbar area (left)
    if (pointer.x < 90 && pointer.y > 30 && pointer.y < 280) return true;
    // Palette panel (right side)
    const paletteX = cam.width - PALETTE_W - 10;
    if (pointer.x > paletteX && pointer.y > 40) return true;
    // Mini-map (bottom-left)
    const mmY = cam.height - MINIMAP_SIZE - 10;
    if (pointer.x < MINIMAP_SIZE + 14 && pointer.y > mmY - 2) return true;
    return false;
  }

  /** Force re-render by invalidating cached region */
  private invalidateVisibleRegion(): void {
    this.lastVisLeft = -1;
    this.minimapDirty = true;
  }

  // ══════════════════════════════════════════════════════════════════
  // ── RENDERING ──
  // ══════════════════════════════════════════════════════════════════

  /** Compute visible tile region and render only those tiles + grid lines */
  private renderVisibleTiles(): void {
    const cam = this.cameras.main;
    const invZoom = 1 / cam.zoom;

    // Visible world bounds
    const left = cam.scrollX;
    const top = cam.scrollY;
    const right = left + cam.width * invZoom;
    const bottom = top + cam.height * invZoom;

    // Tile range (clamped)
    const colStart = Math.max(0, Math.floor(left / TILE_SIZE));
    const rowStart = Math.max(0, Math.floor(top / TILE_SIZE));
    const colEnd = Math.min(this.mapWidth - 1, Math.floor(right / TILE_SIZE));
    const rowEnd = Math.min(this.mapHeight - 1, Math.floor(bottom / TILE_SIZE));

    // Guard: camera entirely outside map bounds → hide all and bail
    if (colEnd < colStart || rowEnd < rowStart) {
      for (let i = 0; i < this.tilePool.length; i++) {
        this.tilePool[i]?.setVisible(false);
      }
      this.gridGfx.clear();
      return;
    }

    // Skip if region hasn't changed
    if (
      colStart === this.lastVisLeft &&
      rowStart === this.lastVisTop &&
      colEnd === this.lastVisRight &&
      rowEnd === this.lastVisBottom &&
      cam.zoom === this.lastZoom
    ) {
      return;
    }
    this.lastVisLeft = colStart;
    this.lastVisTop = rowStart;
    this.lastVisRight = colEnd;
    this.lastVisBottom = rowEnd;
    this.lastZoom = cam.zoom;

    // ── Tiles ──
    const neededCount = (colEnd - colStart + 1) * (rowEnd - rowStart + 1);

    // Hide excess pool sprites
    for (let i = neededCount; i < this.tilePool.length; i++) {
      this.tilePool[i].setVisible(false);
    }

    // Expand pool if needed
    while (this.tilePool.length < neededCount) {
      const img = this.add.image(0, 0, DEFAULT_TILE).setOrigin(0).setDepth(0);
      // New map sprites must be hidden from the fixed UI camera
      if (this.uiCam) this.uiCam.ignore(img);
      this.tilePool.push(img);
    }

    let idx = 0;
    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const key = `${col},${row}`;
        const textureKey = this.terrainData.get(key) ?? DEFAULT_TILE;
        const sprite = this.tilePool[idx];
        sprite.setPosition(col * TILE_SIZE, row * TILE_SIZE);
        sprite.setTexture(textureKey);
        // PMD tiles are 24px native, Emerald/FRLG are 16px — scale to fit TILE_SIZE grid
        const srcSize = textureKey.startsWith('pmd:') ? 24 : 16;
        sprite.setScale(TILE_SIZE / srcSize);
        sprite.setVisible(true);
        idx++;
      }
    }

    // ── Grid lines ──
    this.gridGfx.clear();
    this.gridGfx.lineStyle(1, GRID_COLOR, GRID_ALPHA);

    // Vertical lines
    for (let col = colStart; col <= colEnd + 1; col++) {
      const x = col * TILE_SIZE;
      this.gridGfx.lineBetween(x, rowStart * TILE_SIZE, x, (rowEnd + 1) * TILE_SIZE);
    }
    // Horizontal lines
    for (let row = rowStart; row <= rowEnd + 1; row++) {
      const y = row * TILE_SIZE;
      this.gridGfx.lineBetween(colStart * TILE_SIZE, y, (colEnd + 1) * TILE_SIZE, y);
    }
  }

  /** Draw cursor highlight on hovered tile + update coord label */
  private updateCursor(): void {
    this.cursorGfx.clear();
    this.rectPreviewGfx.clear();

    const pointer = this.input.activePointer;
    const { col, row } = this.pointerToTile(pointer);

    if (col < 0 || col >= this.mapWidth || row < 0 || row >= this.mapHeight) {
      this.coordText.setText('');
      return;
    }

    // ── Brush/eraser: show brush size footprint ──
    if (this.activeTool === 'brush' || this.activeTool === 'eraser') {
      const half = Math.floor(this.brushSize / 2);
      const cursorColor = this.activeTool === 'eraser' ? 0xff4444 : CURSOR_COLOR;
      this.cursorGfx.lineStyle(2, cursorColor, CURSOR_ALPHA);
      const startC = Math.max(0, col - half);
      const startR = Math.max(0, row - half);
      const endC = Math.min(this.mapWidth - 1, col + half);
      const endR = Math.min(this.mapHeight - 1, row + half);
      this.cursorGfx.strokeRect(
        startC * TILE_SIZE,
        startR * TILE_SIZE,
        (endC - startC + 1) * TILE_SIZE,
        (endR - startR + 1) * TILE_SIZE,
      );
    } else if (this.activeTool === 'bucket') {
      // Single tile highlight with fill icon color
      this.cursorGfx.lineStyle(2, 0x44aaff, CURSOR_ALPHA);
      this.cursorGfx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else {
      // Default single tile highlight
      this.cursorGfx.lineStyle(2, CURSOR_COLOR, CURSOR_ALPHA);
      this.cursorGfx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // ── Rectangle preview ──
    if (this.activeTool === 'rectangle' && this.isPainting && this.rectStartCol >= 0) {
      const minC = Math.min(this.rectStartCol, col);
      const maxC = Math.max(this.rectStartCol, col);
      const minR = Math.min(this.rectStartRow, row);
      const maxR = Math.max(this.rectStartRow, row);
      this.rectPreviewGfx.lineStyle(2, 0x44ff44, 0.7);
      this.rectPreviewGfx.strokeRect(
        minC * TILE_SIZE,
        minR * TILE_SIZE,
        (maxC - minC + 1) * TILE_SIZE,
        (maxR - minR + 1) * TILE_SIZE,
      );
      // Semi-transparent fill preview
      this.rectPreviewGfx.fillStyle(0x44ff44, 0.15);
      this.rectPreviewGfx.fillRect(
        minC * TILE_SIZE,
        minR * TILE_SIZE,
        (maxC - minC + 1) * TILE_SIZE,
        (maxR - minR + 1) * TILE_SIZE,
      );
    }

    // Update coordinate label with tool info
    const toolName = TOOLS.find(t => t.key === this.activeTool)?.label ?? this.activeTool;
    const sizeInfo = (this.activeTool === 'brush' || this.activeTool === 'eraser')
      ? ` ${this.brushSize}x${this.brushSize}`
      : '';
    this.coordText.setText(`x: ${col}, y: ${row} | ${toolName}${sizeInfo} | ${this.mapWidth}×${this.mapHeight}`);
  }

  // ══════════════════════════════════════════════════════════════════
  // ── MAP RESIZE ──
  // ══════════════════════════════════════════════════════════════════

  private resizeMapAction(): void {
    const input = prompt(
      `Tamanho do mapa (atual: ${this.mapWidth}×${this.mapHeight})\n` +
      `Formato: largura,altura\n` +
      `Mín: ${MAP_MIN_SIZE}, Máx: ${MAP_MAX_SIZE}`,
      `${this.mapWidth},${this.mapHeight}`,
    );
    if (!input) return;

    const parts = input.split(/[,x×]/);
    if (parts.length < 2) return;

    const newW = parseInt(parts[0].trim(), 10);
    const newH = parseInt(parts[1].trim(), 10);
    if (isNaN(newW) || isNaN(newH)) return;

    const result = resizeMap(this.terrainData, this.mapWidth, this.mapHeight, newW, newH);
    this.mapWidth = result.newWidth;
    this.mapHeight = result.newHeight;

    // Update camera bounds
    const mapW = this.mapWidth * TILE_SIZE;
    const mapH = this.mapHeight * TILE_SIZE;
    this.cameras.main.setBounds(
      -BOUND_MARGIN, -BOUND_MARGIN,
      mapW + BOUND_MARGIN * 2, mapH + BOUND_MARGIN * 2,
    );

    this.invalidateVisibleRegion();
    this.showStatus(`Mapa: ${result.newWidth}×${result.newHeight}`);
  }

  // ══════════════════════════════════════════════════════════════════
  // ── RANDOM GENERATION ──
  // ══════════════════════════════════════════════════════════════════

  private generateRandom(): void {
    const confirm = window.confirm(
      'Gerar mapa aleatório?\nIsso vai SUBSTITUIR todo o terreno atual!',
    );
    if (!confirm) return;

    this.beginStroke();

    // Simple noise-based random terrain using available emerald tiles
    const groundTiles = EDITOR_TILES.filter(t => t.source === 'emerald' && t.category === 'ground');
    const natureTiles = EDITOR_TILES.filter(t => t.source === 'emerald' && t.category === 'nature' && !t.collision);
    const waterTiles = EDITOR_TILES.filter(t => t.source === 'emerald' && t.category === 'water' && !t.collision);

    for (let row = 0; row < this.mapHeight; row++) {
      for (let col = 0; col < this.mapWidth; col++) {
        const key = `${col},${row}`;
        this.recordTileBefore(key);

        // Simple pseudo-random using position
        const nx = col * 0.08;
        const ny = row * 0.08;
        const noise = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        const val = noise - Math.floor(noise);

        let tileId: string;
        if (val < 0.08 && waterTiles.length > 0) {
          tileId = waterTiles[Math.floor(val * 100) % waterTiles.length].id;
        } else if (val < 0.15 && natureTiles.length > 0) {
          tileId = natureTiles[Math.floor(val * 100) % natureTiles.length].id;
        } else if (groundTiles.length > 0) {
          tileId = groundTiles[Math.floor(val * 100) % groundTiles.length].id;
        } else {
          tileId = DEFAULT_TILE;
        }

        this.terrainData.set(key, tileId);
      }
    }

    this.commitStroke();
    this.invalidateVisibleRegion();
    this.showStatus('Mapa aleatório gerado!');
  }
}
