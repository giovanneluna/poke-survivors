import Phaser from 'phaser';

/**
 * Cria um ParticleEmitter, chama explode(), e agenda destroy() automaticamente.
 * Substitui o padrão `scene.add.particles(...).explode()` que leaka emitters no scene graph.
 */
export function safeExplode(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string,
  config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
): Phaser.GameObjects.Particles.ParticleEmitter {
  const lifespan = typeof config.lifespan === 'number'
    ? config.lifespan
    : (config.lifespan as { max?: number } | undefined)?.max ?? 500;

  const emitter = scene.add.particles(x, y, textureKey, {
    ...config,
    emitting: false,
  });
  emitter.explode();
  scene.time.delayedCall(lifespan + 100, () => emitter.destroy());
  return emitter;
}
