import Phaser from 'phaser';
import { GAME } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { SelectScene } from './scenes/SelectScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { ShowcaseScene } from './scenes/ShowcaseScene';
import { DataViewerScene } from './scenes/DataViewerScene';
import { PowerUpScene } from './scenes/PowerUpScene';
import { PokedexScene } from './scenes/PokedexScene';
import { StatsScene } from './scenes/StatsScene';
import { SaveScene } from './scenes/SaveScene';
import { initSaveSystem } from './systems/SaveSystem';
import { getQualityMode, getQualityScale } from './systems/GraphicsSettings';

// Ler quality ANTES de criar o Game — afeta scale mode e resolução
initSaveSystem();
const isLow = getQualityMode() === 'low';
const qScale = getQualityScale();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: isLow ? Math.floor(window.innerWidth * qScale) : GAME.width,
  height: isLow ? Math.floor(window.innerHeight * qScale) : GAME.height,
  backgroundColor: '#0f0f23',
  parent: document.body,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: isLow ? Phaser.Scale.FIT : Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    ...(isLow ? {} : { width: '100%', height: '100%' }),
  },
  scene: [BootScene, TitleScene, SelectScene, PowerUpScene, PokedexScene, StatsScene, SaveScene, GameScene, UIScene, ShowcaseScene, DataViewerScene],
};

const game = new Phaser.Game(config);

// Debug: expor game globalmente para testes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as unknown as Record<string, unknown>).__GAME = game;
