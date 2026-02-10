import Phaser from 'phaser';
import { shouldShowVfx, getVfxQuantity } from '../systems/GraphicsSettings';

/**
 * Cria um ParticleEmitter, chama explode(), e agenda destroy() automaticamente.
 * Substitui o padrão `scene.add.particles(...).explode()` que leaka emitters no scene graph.
 * Respeita VFX intensity: retorna null se VFX=0, ajusta quantity pelo slider.
 */
export function safeExplode(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string,
  config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
): Phaser.GameObjects.Particles.ParticleEmitter | null {
  if (!shouldShowVfx()) return null;

  const adjustedConfig = { ...config };
  if (typeof adjustedConfig.quantity === 'number') {
    adjustedConfig.quantity = getVfxQuantity(adjustedConfig.quantity);
  }

  const lifespan = typeof adjustedConfig.lifespan === 'number'
    ? adjustedConfig.lifespan
    : (adjustedConfig.lifespan as { max?: number } | undefined)?.max ?? 500;

  const emitter = scene.add.particles(x, y, textureKey, {
    ...adjustedConfig,
    emitting: false,
  });
  emitter.explode();
  scene.time.delayedCall(lifespan + 100, () => emitter.destroy());
  return emitter;
}
