/**
 * StatusOverlay — Exibe sprites animados de status effects (burn, poison, etc.)
 * sobre o alvo (player ou boss). Segue a posição do alvo a cada frame.
 */
import { shouldShowVfx } from './GraphicsSettings';

export type StatusType = 'burn' | 'poison' | 'paralysis' | 'confusion' | 'freeze' | 'sleep' | 'protect';

const STATUS_CONFIG: Record<StatusType, { spriteKey: string; animKey: string; scale: number; yOffset: number }> = {
  burn:      { spriteKey: 'status-burn',      animKey: 'anim-status-burn',      scale: 3.5, yOffset: -20 },
  poison:    { spriteKey: 'status-poison',    animKey: 'anim-status-poison',    scale: 3.5, yOffset: -20 },
  paralysis: { spriteKey: 'status-paralysis', animKey: 'anim-status-paralysis', scale: 0.8, yOffset: 0 },
  confusion: { spriteKey: 'status-confusion', animKey: 'anim-status-confusion', scale: 2.5, yOffset: -24 },
  freeze:    { spriteKey: 'status-freeze',    animKey: 'anim-status-freeze',    scale: 2,   yOffset: 0 },
  sleep:     { spriteKey: 'status-sleep',     animKey: 'anim-status-sleep',     scale: 3,   yOffset: -24 },
  protect:   { spriteKey: 'status-protect',   animKey: 'anim-status-protect',   scale: 4,   yOffset: 0 },
};

const DATA_KEY_PREFIX = 'statusOverlay_';

/**
 * Mostra overlay animado de status sobre um target.
 * Se já existe overlay do mesmo tipo, renova a duração sem duplicar.
 */
export function showStatusOverlay(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Sprite,
  status: StatusType,
  durationMs: number,
): void {
  if (!shouldShowVfx()) return;
  if (!target.active || !target.scene) return;

  const cfg = STATUS_CONFIG[status];
  const dataKey = `${DATA_KEY_PREFIX}${status}`;
  const timerKey = `${dataKey}_timer`;
  const handlerKey = `${dataKey}_handler`;

  // Se já existe overlay ativo para este status, renova duração
  const existing = target.getData(dataKey) as Phaser.GameObjects.Sprite | undefined;
  if (existing?.active) {
    // Renova: destroi timer antigo e cria novo
    const oldTimer = target.getData(timerKey) as Phaser.Time.TimerEvent | undefined;
    if (oldTimer) oldTimer.destroy();

    // Reutiliza handler existente — NÃO registrar novo listener
    const existingHandler = target.getData(handlerKey) as (() => void) | undefined;

    const newTimer = scene.time.delayedCall(durationMs, () => {
      if (existing.active) existing.destroy();
      if (existingHandler) scene.events.off('update', existingHandler);
      target.data?.remove(dataKey);
      target.data?.remove(timerKey);
      target.data?.remove(handlerKey);
    });
    target.setData(timerKey, newTimer);
    return;
  }

  // Cria novo overlay
  const overlay = scene.add.sprite(target.x, target.y + cfg.yOffset, cfg.spriteKey);
  overlay.setScale(cfg.scale);
  overlay.setAlpha(0.85);
  overlay.setDepth((target.depth ?? 0) + 1);
  overlay.play(cfg.animKey);

  // Segue o alvo a cada frame
  const updateHandler = () => {
    if (!target.active || !overlay.active) {
      if (overlay.active) overlay.destroy();
      scene.events.off('update', updateHandler);
      return;
    }
    overlay.setPosition(target.x, target.y + cfg.yOffset);
  };
  scene.events.on('update', updateHandler);

  // Auto-destrói após duração
  const timer = scene.time.delayedCall(durationMs, () => {
    if (overlay.active) overlay.destroy();
    scene.events.off('update', updateHandler);
    target.data?.remove(dataKey);
    target.data?.remove(timerKey);
    target.data?.remove(handlerKey);
  });

  target.setData(dataKey, overlay);
  target.setData(timerKey, timer);
  target.setData(handlerKey, updateHandler);
}

/**
 * Remove TODOS os overlays de status de um alvo (usar no destroy/death).
 */
export function clearAllStatusOverlays(target: Phaser.GameObjects.Sprite): void {
  if (!target.data) return;

  for (const status of Object.keys(STATUS_CONFIG) as StatusType[]) {
    const dataKey = `${DATA_KEY_PREFIX}${status}`;
    const timerKey = `${dataKey}_timer`;
    const handlerKey = `${dataKey}_handler`;

    const overlay = target.getData(dataKey) as Phaser.GameObjects.Sprite | undefined;
    if (overlay?.active) overlay.destroy();

    const timer = target.getData(timerKey) as Phaser.Time.TimerEvent | undefined;
    if (timer) timer.destroy();

    // Remove event listener para evitar leak
    const handler = target.getData(handlerKey) as (() => void) | undefined;
    if (handler) target.scene?.events.off('update', handler);

    target.data.remove(dataKey);
    target.data.remove(timerKey);
    target.data.remove(handlerKey);
  }
}
