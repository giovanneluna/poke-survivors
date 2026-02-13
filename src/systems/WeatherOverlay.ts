/**
 * WeatherOverlay — TileSprite scrolling fixo à câmera para efeitos de clima.
 * Usa imagens do pokemonAutoChess (rain 17×17, fog 209×64, sand 17×17).
 */
import { shouldShowVfx } from './GraphicsSettings';

export type WeatherType = 'rain' | 'fog' | 'sand';

interface WeatherConfig {
  readonly textureKey: string;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly alpha: number;
  readonly tint?: number;
}

const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  rain: { textureKey: 'weather-rain', scrollX: -30, scrollY: 200, alpha: 0.35 },
  fog:  { textureKey: 'weather-fog',  scrollX: 40,  scrollY: 5,   alpha: 0.25 },
  sand: { textureKey: 'weather-sand', scrollX: 150, scrollY: 30,  alpha: 0.3, tint: 0xddaa55 },
};

let activeOverlay: Phaser.GameObjects.TileSprite | null = null;
let activeType: WeatherType | null = null;
let activeScene: Phaser.Scene | null = null;
let scrollConfig: WeatherConfig | null = null;

export function startWeather(scene: Phaser.Scene, type: WeatherType): void {
  stopWeather();
  if (!shouldShowVfx()) return;

  const cfg = WEATHER_CONFIGS[type];
  const cam = scene.cameras.main;

  const tile = scene.add.tileSprite(
    cam.scrollX + cam.width / 2,
    cam.scrollY + cam.height / 2,
    cam.width,
    cam.height,
    cfg.textureKey,
  );
  tile.setAlpha(0);
  tile.setDepth(900);
  tile.setScrollFactor(0);
  if (cfg.tint) tile.setTint(cfg.tint);

  // Fade in
  scene.tweens.add({ targets: tile, alpha: cfg.alpha, duration: 1500 });

  activeOverlay = tile;
  activeType = type;
  activeScene = scene;
  scrollConfig = cfg;

  // Atualiza posição e scroll a cada frame
  scene.events.on('update', updateWeather);
}

export function stopWeather(): void {
  if (!activeOverlay || !activeScene) return;

  const overlay = activeOverlay;
  const sc = activeScene;

  // Limpa state ANTES do tween para evitar chamadas duplicadas
  sc.events.off('update', updateWeather);
  activeOverlay = null;
  activeType = null;
  activeScene = null;
  scrollConfig = null;

  // Fade out com fallback: se scene destruir durante tween, overlay é destruído no guard
  if (overlay.active) {
    sc.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 800,
      onComplete: () => { if (overlay.active) overlay.destroy(); },
    });
    // Safety: destrói após timeout se tween não completar (scene shutdown)
    sc.time.delayedCall(1000, () => { if (overlay.active) overlay.destroy(); });
  }
}

export function getActiveWeather(): WeatherType | null {
  return activeType;
}

function updateWeather(): void {
  if (!activeOverlay?.active || !scrollConfig) {
    stopWeather();
    return;
  }
  activeOverlay.tilePositionX += scrollConfig.scrollX * 0.016;
  activeOverlay.tilePositionY += scrollConfig.scrollY * 0.016;
}
