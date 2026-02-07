import Phaser from 'phaser';
import { PLAYER } from '../config';
import type { PlayerState, Attack, AttackType, Direction, SpriteConfig } from '../types';

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly stats: PlayerState;
  private readonly cursors: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private readonly attacks: Map<AttackType, Attack> = new Map();
  private lastDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 1);
  private currentDir: Direction = 'down';
  private invincibleUntil = 0;
  private readonly spriteConfig: SpriteConfig;
  private shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER.sprite.key);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as Phaser.GameObjects.GameObject);

    this.spriteConfig = PLAYER.sprite;
    this.setScale(1.5);
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 16);
    body.setOffset(8, 14);

    // Sombra
    this.shadow = scene.add.image(x, y + 12, 'shadow').setDepth(9).setScale(1.5);

    this.stats = {
      hp: PLAYER.startHp,
      maxHp: PLAYER.startHp,
      speed: PLAYER.startSpeed,
      magnetRange: PLAYER.startMagnetRange,
      xp: 0,
      xpToNext: PLAYER.baseXpToLevel,
      level: 1,
      kills: 0,
    };

    const keyboard = scene.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    this.cursors = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Começa olhando pra baixo
    this.play(`${this.spriteConfig.key}-down`);
  }

  addAttack(type: AttackType, attack: Attack): void {
    this.attacks.set(type, attack);
  }

  hasAttack(type: AttackType): boolean {
    return this.attacks.has(type);
  }

  getAttack(type: AttackType): Attack | undefined {
    return this.attacks.get(type);
  }

  getAllAttacks(): Attack[] {
    return Array.from(this.attacks.values());
  }

  getLastDirection(): Phaser.Math.Vector2 {
    return this.lastDirection.clone();
  }

  takeDamage(amount: number, time: number): void {
    if (time < this.invincibleUntil) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.invincibleUntil = time + PLAYER.invincibilityMs;

    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => this.clearTint());
  }

  addXp(amount: number): boolean {
    this.stats.xp += amount;
    if (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level++;
      this.stats.xpToNext = Math.floor(
        PLAYER.baseXpToLevel * Math.pow(PLAYER.xpScaleFactor, this.stats.level - 1)
      );
      return true;
    }
    return false;
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  handleMovement(): void {
    const dir = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.right.isDown) dir.x = 1;
    else if (this.cursors.left.isDown) dir.x = -1;
    if (this.cursors.down.isDown) dir.y = 1;
    else if (this.cursors.up.isDown) dir.y = -1;

    const isMoving = dir.x !== 0 || dir.y !== 0;

    if (isMoving) {
      this.lastDirection = dir.clone().normalize();
      const newDir = this.vectorToDirection(dir.x, dir.y);

      // Só troca animação se mudou de direção
      if (newDir !== this.currentDir) {
        this.currentDir = newDir;
        this.playWalkAnim(newDir);
      }

      if (dir.x !== 0 && dir.y !== 0) dir.normalize();
      this.setVelocity(dir.x * this.stats.speed, dir.y * this.stats.speed);
    } else {
      this.setVelocity(0, 0);
      // Parado = frame 0 da direção atual
      this.anims.stop();
    }

    // Atualiza sombra
    this.shadow.setPosition(this.x, this.y + 12);
  }

  private playWalkAnim(dir: Direction): void {
    const animKey = `${this.spriteConfig.key}-${dir}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey);
    }
    this.setFlipX(false);
  }

  private vectorToDirection(dx: number, dy: number): Direction {
    if (dx > 0 && dy > 0) return 'downRight';
    if (dx > 0 && dy < 0) return 'upRight';
    if (dx < 0 && dy > 0) return 'downLeft';
    if (dx < 0 && dy < 0) return 'upLeft';
    if (dx > 0) return 'right';
    if (dx < 0) return 'left';
    if (dy > 0) return 'down';
    return 'up';
  }

  updateAttacks(time: number, delta: number): void {
    for (const attack of this.attacks.values()) {
      attack.update(time, delta);
    }
  }
}
