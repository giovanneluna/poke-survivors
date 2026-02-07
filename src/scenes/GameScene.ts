import Phaser from 'phaser';
import { GAME, ENEMIES, WAVES, SPAWN, XP_GEM, UPGRADE_DEFS } from '../config';
import type { EnemyConfig, WaveConfig, UpgradeOption } from '../types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Ember } from '../attacks/Ember';
import { FireSpin } from '../attacks/FireSpin';
import { Flamethrower } from '../attacks/Flamethrower';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemyGroup!: Phaser.Physics.Arcade.Group;
  xpGems!: Phaser.Physics.Arcade.Group;

  private spawnTimer!: Phaser.Time.TimerEvent;
  private difficultyLevel = 0;
  private gameTime = 0;
  private isPaused = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);

    // ── Tilemap procedural rico ──────────────────────────────────
    this.generateWorld();

    // ── Player (Charmander) ──────────────────────────────────────
    this.player = new Player(this, GAME.worldWidth / 2, GAME.worldHeight / 2);

    // ── Grupos ───────────────────────────────────────────────────
    this.enemyGroup = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.xpGems = this.physics.add.group({ defaultKey: 'xp-gem', maxSize: 200 });

    // ── Ataque inicial: Ember ────────────────────────────────────
    const ember = new Ember(this, this.player, this.enemyGroup);
    this.player.addAttack('ember', ember);
    this.setupEmberCollisions(ember);

    // ── Câmera ───────────────────────────────────────────────────
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);

    // ── Spawn de inimigos ────────────────────────────────────────
    this.difficultyLevel = 0;
    this.spawnTimer = this.time.addEvent({
      delay: WAVES[0].spawnRate, loop: true, callback: () => this.spawnEnemy(),
    });

    this.time.addEvent({
      delay: SPAWN.difficultyIntervalMs, loop: true, callback: () => this.increaseDifficulty(),
    });

    // ── Colisão: inimigo → jogador ───────────────────────────────
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject,
      this.enemyGroup,
      (_player, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.active) {
          this.player.takeDamage(enemy.damage, this.time.now);
          this.emitStats();
          if (this.player.isDead()) this.gameOver();
        }
      }
    );

    // ── Colisão: jogador → XP gems ──────────────────────────────
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject,
      this.xpGems,
      (_player, gemObj) => {
        const gem = gemObj as Phaser.Physics.Arcade.Sprite;
        if (!gem.active) return;
        this.xpGems.killAndHide(gem);
        const body = gem.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
        const leveled = this.player.addXp(1);
        this.emitStats();
        if (leveled) this.triggerLevelUp();
      }
    );

    // ── Escuta upgrade selecionado ──────────────────────────────
    this.events.on('upgrade-selected', (upgradeId: string) => {
      this.applyUpgrade(upgradeId);
      this.resumeGame();
    });

    this.gameTime = 0;
    this.emitStats();
  }

  // ── Geração do mundo ──────────────────────────────────────────────
  private generateWorld(): void {
    const T = GAME.tileSize;
    const cols = Math.ceil(GAME.worldWidth / T);
    const rows = Math.ceil(GAME.worldHeight / T);

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * T;
        const y = row * T;
        const tile = this.pickTile(col, row, cols, rows);
        this.add.image(x, y, tile).setOrigin(0, 0).setDepth(0);
      }
    }
  }

  private pickTile(col: number, row: number, maxCols: number, maxRows: number): string {
    // Bordas = árvores e água
    const edgeMargin = 3;
    if (col < edgeMargin || col >= maxCols - edgeMargin ||
        row < edgeMargin || row >= maxRows - edgeMargin) {
      const isOuterEdge = col < 1 || col >= maxCols - 1 || row < 1 || row >= maxRows - 1;
      return isOuterEdge ? 'tile-water' : 'tile-tree';
    }

    // Interior: distribuição baseada em ruído simples
    const noise = Math.sin(col * 0.7 + row * 0.3) * Math.cos(col * 0.2 + row * 0.9);
    const rand = Math.random();

    if (noise > 0.7 && rand < 0.3) return 'tile-flowers';
    if (noise < -0.6 && rand < 0.2) return 'tile-dirt';
    if (rand < 0.02) return 'tile-rock';
    if (rand < 0.15) return 'tile-grass-2';
    return 'tile-grass-1';
  }

  // ── Update principal ──────────────────────────────────────────────
  update(time: number, delta: number): void {
    if (this.isPaused) return;

    this.gameTime += delta;
    this.player.handleMovement();
    this.player.updateAttacks(time, delta);

    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
    this.enemyGroup.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (enemy.active) {
        enemy.moveToward(playerPos);
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (dist > SPAWN.despawnDistance) enemy.cleanup();
      }
    });

    // Magnetismo XP
    this.xpGems.getChildren().forEach(child => {
      const gem = child as Phaser.Physics.Arcade.Sprite;
      if (!gem.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y);
      if (dist < this.player.stats.magnetRange) {
        this.physics.moveToObject(gem, this.player, XP_GEM.magnetSpeed);
      }
    });

    if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) this.emitStats();
  }

  // ── Spawn ─────────────────────────────────────────────────────────
  private spawnEnemy(): void {
    if (this.isPaused) return;
    const wave = this.getCurrentWave();
    const activeCount = this.enemyGroup.getChildren().filter(c => (c as Phaser.Physics.Arcade.Sprite).active).length;
    if (activeCount >= wave.maxEnemies) return;

    const config = this.pickEnemyType(wave);
    const pos = this.getSpawnPosition();
    const enemy = new Enemy(this, pos.x, pos.y, config);
    this.enemyGroup.add(enemy);
  }

  private getCurrentWave(): WaveConfig {
    return WAVES[Math.min(this.difficultyLevel, WAVES.length - 1)];
  }

  private pickEnemyType(wave: WaveConfig): EnemyConfig {
    const totalWeight = wave.enemies.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of wave.enemies) {
      roll -= entry.weight;
      if (roll <= 0) return ENEMIES[entry.type];
    }
    return ENEMIES[wave.enemies[0].type];
  }

  private getSpawnPosition(): Phaser.Math.Vector2 {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return new Phaser.Math.Vector2(
      this.player.x + Math.cos(angle) * SPAWN.distanceFromPlayer,
      this.player.y + Math.sin(angle) * SPAWN.distanceFromPlayer
    );
  }

  private increaseDifficulty(): void {
    this.difficultyLevel++;
    const wave = this.getCurrentWave();
    this.spawnTimer.destroy();
    this.spawnTimer = this.time.addEvent({
      delay: wave.spawnRate, loop: true, callback: () => this.spawnEnemy(),
    });
  }

  // ── XP Gems ───────────────────────────────────────────────────────
  spawnXpGem(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const ox = Phaser.Math.Between(-15, 15);
      const oy = Phaser.Math.Between(-15, 15);
      const gem = this.xpGems.get(x + ox, y + oy, 'xp-gem') as Phaser.Physics.Arcade.Sprite | null;
      if (!gem) continue;
      gem.setActive(true).setVisible(true).setScale(1.2).setDepth(3);
      const body = gem.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      this.tweens.add({ targets: gem, y: gem.y - 10, scaleX: 1.5, scaleY: 1.5, duration: 150, yoyo: true, ease: 'Quad.Out' });
    }
  }

  // ── Colisões dos ataques ──────────────────────────────────────────
  setupEmberCollisions(ember: Ember): void {
    this.physics.add.overlap(ember.getBullets(), this.enemyGroup, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active) return;
      ember.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true;
      body.enable = false;
      const killed = enemy.takeDamage(ember.getDamage());
      if (killed) { this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); }
    });
  }

  setupFireSpinCollisions(fireSpin: FireSpin): void {
    const hitCooldowns = new Map<number, number>();
    this.physics.add.overlap(fireSpin.getOrbs(), this.enemyGroup, (_orbObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return;
      const enemyId = enemy.x * 10000 + enemy.y;
      const lastHit = hitCooldowns.get(enemyId) ?? 0;
      if (this.time.now - lastHit < 400) return;
      hitCooldowns.set(enemyId, this.time.now);
      const killed = enemy.takeDamage(fireSpin.getDamage());
      if (killed) { this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); hitCooldowns.delete(enemyId); }
    });
  }

  // ── Level Up ──────────────────────────────────────────────────────
  private triggerLevelUp(): void {
    this.isPaused = true;
    this.physics.pause();
    const options = this.generateUpgradeOptions();
    this.events.emit('level-up', options, this.player.stats.level);
  }

  private resumeGame(): void { this.isPaused = false; this.physics.resume(); }

  private generateUpgradeOptions(): UpgradeOption[] {
    const pool: UpgradeOption[] = [];
    if (!this.player.hasAttack('fireSpin')) pool.push(UPGRADE_DEFS.newFireSpin);
    if (!this.player.hasAttack('flamethrower')) pool.push(UPGRADE_DEFS.newFlamethrower);
    if (this.player.hasAttack('ember')) pool.push(UPGRADE_DEFS.upgradeEmber);
    if (this.player.hasAttack('fireSpin')) pool.push(UPGRADE_DEFS.upgradeFireSpin);
    if (this.player.hasAttack('flamethrower')) pool.push(UPGRADE_DEFS.upgradeFlame);
    pool.push(UPGRADE_DEFS.maxHpUp, UPGRADE_DEFS.speedUp, UPGRADE_DEFS.magnetUp);
    Phaser.Utils.Array.Shuffle(pool);
    return pool.slice(0, 3);
  }

  private applyUpgrade(upgradeId: string): void {
    switch (upgradeId) {
      case 'newFireSpin': { const fs = new FireSpin(this, this.player); this.player.addAttack('fireSpin', fs); this.setupFireSpinCollisions(fs); break; }
      case 'newFlamethrower': { const ft = new Flamethrower(this, this.player, this.enemyGroup); this.player.addAttack('flamethrower', ft); break; }
      case 'upgradeEmber': this.player.getAttack('ember')?.upgrade(); break;
      case 'upgradeFireSpin': this.player.getAttack('fireSpin')?.upgrade(); break;
      case 'upgradeFlame': this.player.getAttack('flamethrower')?.upgrade(); break;
      case 'maxHpUp': this.player.stats.maxHp += 25; this.player.stats.hp = Math.min(this.player.stats.hp + 25, this.player.stats.maxHp); break;
      case 'speedUp': this.player.stats.speed = Math.floor(this.player.stats.speed * 1.15); break;
      case 'magnetUp': this.player.stats.magnetRange = Math.floor(this.player.stats.magnetRange * 1.4); break;
    }
    this.emitStats();
  }

  private gameOver(): void {
    this.isPaused = true;
    this.physics.pause();
    this.events.emit('game-over', { level: this.player.stats.level, kills: this.player.stats.kills, time: Math.floor(this.gameTime / 1000) });
  }

  private emitStats(): void {
    this.events.emit('stats-update', { ...this.player.stats, time: Math.floor(this.gameTime / 1000) });
  }
}
