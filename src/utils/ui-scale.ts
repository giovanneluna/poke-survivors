// ── UI Scaling — responsive sizes based on screen height ────────────────
// Reference height: 600px (where the UI was originally designed).
// On 1080p: scale = 1.8x, on 768p: scale = 1.28x, on 600p: scale = 1.0x.

const REFERENCE_HEIGHT = 600;

/** Get the UI scale factor. Always >= 1. */
export function getUIScale(): number {
  return Math.max(1, window.innerHeight / REFERENCE_HEIGHT);
}

/** Convert a base pixel font size to a scaled string like "18px". */
export function fontSize(basePx: number): string {
  return `${Math.round(basePx * getUIScale())}px`;
}

/** Scale a dimension (width, height, gap, etc.) proportionally. */
export function scaled(basePx: number): number {
  return Math.round(basePx * getUIScale());
}
