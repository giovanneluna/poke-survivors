import Phaser from 'phaser';
import { GAME } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { SelectScene } from './scenes/SelectScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { ShowcaseScene } from './scenes/ShowcaseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME.width,
  height: GAME.height,
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
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    width: '100%',
    height: '100%',
  },
  scene: [BootScene, TitleScene, SelectScene, GameScene, UIScene, ShowcaseScene],
};

const game = new Phaser.Game(config);

// Debug: expor game globalmente para testes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as unknown as Record<string, unknown>).__GAME = game;
