import Phaser from 'phaser';
import { ENEMIES, WAVES, SPAWN, BOSS_SCHEDULE } from '../config';
import type { EnemyConfig, BossConfig, BossAttackConfig, BossSpawnConfig, WaveConfig, EnemyRangedConfig, EnemyBoomerangConfig, EnemyType } from '../types';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';

export class SpawnSystem {
  private spawnTimer!: Phaser.Time.TimerEvent;
  private difficultyLevel = 0;

  constructor(private readonly ctx: GameContext) {}

  // ── Iniciar spawning (modo normal) ────────────────────────────────
  startSpawning(): void {
    const scene = this.ctx.scene;
    this.difficultyLevel = 0;

    this.spawnTimer = scene.time.addEvent({
      delay: WAVES[0].spawnRate, loop: true, callback: () => this.spawnEnemy(),
    });

    scene.time.addEvent({
      delay: SPAWN.difficultyIntervalMs, loop: true, callback: () => this.increaseDifficulty(),
    });

    // Boss spawn timers (with scaling support)
    for (const bossSpawn of BOSS_SCHEDULE) {
      scene.time.addEvent({
        delay: bossSpawn.timeSeconds * 1000,
        callback: () => this.spawnBossWithConfig(bossSpawn),
      });
    }
  }

  // ── Update (chamado todo frame para boss/ranged attacks) ──────────
  update(time: number): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const playerX = player.x;
    const playerY = player.y;
    const playerPos = new Phaser.Math.Vector2(playerX, playerY);

    this.ctx.enemyGroup.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (!enemy.active) return;

      // Teleport (Alakazam) — antes de moveToward
      if (enemy.teleportConfig) {
        enemy.tryTeleport(playerX, playerY, time);
      }

      enemy.moveToward(playerPos);
      const dist = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
      if (dist > SPAWN.despawnDistance && enemy.shouldDespawn()) { enemy.cleanup(); return; }

      // Boss attacks
      if (enemy instanceof Boss) {
        const bossAtk = enemy.tryBossAttack(playerX, playerY, time);
        if (bossAtk) this.executeBossAttack(enemy, bossAtk);
      }

      // Ranged attacks
      const attack = enemy.tryRangedAttack(playerX, playerY, time);
      if (attack) this.fireEnemyProjectile(enemy, attack.config);

      // Boomerang attacks (Cubone/Marowak)
      const boom = enemy.tryBoomerang(playerX, playerY, time);
      if (boom) this.fireBoomerang(enemy, boom);

      // Heal aura (Gloom) — checked every ~1s
      if (enemy.healAura) {
        this.processHealAura(enemy, time);
      }

      // Slow aura (Parasect) — continuous while in range
      if (enemy.slowAura && dist <= enemy.slowAura.radius) {
        player.applySlow(500, time);
      }
    });

    // Homing projectiles (Shadow Ball)
    this.ctx.enemyProjectiles.getChildren().forEach(child => {
      const proj = child as Phaser.Physics.Arcade.Sprite;
      if (!proj.active || !proj.getData('homing')) return;
      scene.physics.moveToObject(proj, player, proj.getData('speed') as number);
    });
  }

  // ── Spawn individual ──────────────────────────────────────────────
  private spawnEnemy(): void {
    const wave = this.getCurrentWave();
    const activeCount = this.ctx.enemyGroup.getChildren().filter(c => (c as Phaser.Physics.Arcade.Sprite).active).length;
    if (activeCount >= wave.maxEnemies) return;

    const config = this.pickEnemyType(wave);
    const pos = this.getSpawnPosition();
    const enemy = new Enemy(this.ctx.scene, pos.x, pos.y, config);
    this.ctx.enemyGroup.add(enemy);
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

  getSpawnPosition(): Phaser.Math.Vector2 {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return new Phaser.Math.Vector2(
      this.ctx.player.x + Math.cos(angle) * SPAWN.distanceFromPlayer,
      this.ctx.player.y + Math.sin(angle) * SPAWN.distanceFromPlayer
    );
  }

  private increaseDifficulty(): void {
    this.difficultyLevel++;
    const wave = this.getCurrentWave();
    this.spawnTimer.destroy();
    this.spawnTimer = this.ctx.scene.time.addEvent({
      delay: wave.spawnRate, loop: true, callback: () => this.spawnEnemy(),
    });
  }

  // ── Heal aura processing (Gloom) ──────────────────────────────────
  private processHealAura(healer: Enemy, time: number): void {
    if (time - healer.lastHealTick < 1000) return;
    healer.lastHealTick = time;

    const cfg = healer.healAura!;
    this.ctx.enemyGroup.getChildren().forEach(other => {
      const otherEnemy = other as Enemy;
      if (otherEnemy === healer || !otherEnemy.active) return;
      const d = Phaser.Math.Distance.Between(healer.x, healer.y, otherEnemy.x, otherEnemy.y);
      if (d <= cfg.radius) {
        otherEnemy.heal(cfg.hpPerSecond);
        // Visual: green flash on healed enemy
        otherEnemy.setTint(0x44ff44);
        this.ctx.scene.time.delayedCall(150, () => { if (otherEnemy.active) otherEnemy.clearTint(); });
      }
    });
  }

  // ── Boomerang projectile (Cubone/Marowak) ───────────────────────
  private fireBoomerang(enemy: Enemy, config: EnemyBoomerangConfig): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const proj = this.ctx.enemyProjectiles.get(enemy.x, enemy.y, config.projectileKey) as Phaser.Physics.Arcade.Sprite | null;
    if (!proj) return;

    proj.setActive(true).setVisible(true).setScale(config.projectileScale ?? 1).setDepth(7);
    proj.setData('damage', config.damage);
    proj.setData('homing', false);
    proj.setData('effect', null);
    proj.setData('effectDuration', 0);

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    body.setVelocity(Math.cos(angle) * config.speed, Math.sin(angle) * config.speed);

    // Spin visual
    scene.tweens.add({ targets: proj, rotation: Math.PI * 4, duration: 1600 });

    // After 800ms, reverse direction back toward enemy
    scene.time.delayedCall(800, () => {
      if (!proj.active) return;
      if (enemy.active) {
        const returnAngle = Phaser.Math.Angle.Between(proj.x, proj.y, enemy.x, enemy.y);
        body.setVelocity(Math.cos(returnAngle) * config.speed, Math.sin(returnAngle) * config.speed);
      }
      scene.time.delayedCall(800, () => {
        if (proj.active) {
          this.ctx.enemyProjectiles.killAndHide(proj);
          body.enable = false;
        }
      });
    });
  }

  // ── Boss spawning with scaling ──────────────────────────────────
  private spawnBossWithConfig(spawn: BossSpawnConfig): void {
    const count = spawn.count ?? 1;
    for (let i = 0; i < count; i++) {
      const delay = i * 2000;
      this.ctx.scene.time.delayedCall(delay, () => {
        this.spawnScaledBoss(spawn.type, spawn.hpMultiplier ?? 1, spawn.dmgMultiplier ?? 1);
      });
    }
  }

  private spawnScaledBoss(type: EnemyType, hpMult: number, dmgMult: number): void {
    const scene = this.ctx.scene;
    const baseConfig = ENEMIES[type] as BossConfig;
    if (!baseConfig) return;

    const scaledConfig: BossConfig = {
      ...baseConfig,
      hp: Math.floor(baseConfig.hp * hpMult),
      bossAttack: {
        ...baseConfig.bossAttack,
        damage: Math.floor(baseConfig.bossAttack.damage * dmgMult),
      },
    };

    const label = hpMult > 1 ? `${baseConfig.name} (Enhanced)` : baseConfig.name;
    scene.events.emit('boss-warning', label);
    SoundManager.playBossWarning();

    scene.time.delayedCall(3000, () => {
      const pos = this.getSpawnPosition();
      const boss = new Boss(scene, pos.x, pos.y, scaledConfig);
      this.ctx.enemyGroup.add(boss);
      SoundManager.playBossSpawn();

      scene.events.emit('boss-spawned', {
        name: label,
        hp: scaledConfig.hp,
        maxHp: scaledConfig.hp,
        boss,
      });
    });
  }

  // ── Boss spawning (legacy, used by DebugSystem) ──────────────────
  spawnBoss(type: EnemyType): void {
    const scene = this.ctx.scene;
    const config = ENEMIES[type];
    if (!config) return;

    scene.events.emit('boss-warning', config.name);
    SoundManager.playBossWarning();

    scene.time.delayedCall(3000, () => {
      const pos = this.getSpawnPosition();
      const boss = new Boss(scene, pos.x, pos.y, config as BossConfig);
      this.ctx.enemyGroup.add(boss);
      SoundManager.playBossSpawn();

      scene.events.emit('boss-spawned', {
        name: config.name,
        hp: config.hp,
        maxHp: config.hp,
        boss,
      });
    });
  }

  // ── Projéteis de inimigos ─────────────────────────────────────────
  fireEnemyProjectile(enemy: Enemy, config: EnemyRangedConfig): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const proj = this.ctx.enemyProjectiles.get(enemy.x, enemy.y, config.projectileKey) as Phaser.Physics.Arcade.Sprite | null;
    if (!proj) return;

    proj.setActive(true).setVisible(true).setScale(config.projectileScale ?? 0.6).setDepth(7);
    proj.setData('damage', config.damage);
    proj.setData('homing', config.homing);
    proj.setData('speed', config.speed);
    proj.setData('effect', config.effect ?? null);
    proj.setData('effectDuration', config.effectDurationMs ?? 0);

    const animKey = config.projectileKey.replace('atk-', 'anim-');
    if (scene.anims.exists(animKey)) {
      proj.play(animKey);
    }

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    scene.physics.moveToObject(proj, player, config.speed);

    scene.time.delayedCall(5000, () => {
      if (proj.active) {
        this.ctx.enemyProjectiles.killAndHide(proj);
        body.enable = false;
      }
    });
  }

  // ── Boss attacks ──────────────────────────────────────────────────
  private executeBossAttack(boss: Boss, attack: BossAttackConfig): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const playerX = player.x;
    const playerY = player.y;

    switch (attack.pattern) {
      case 'charge': {
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);
        const speed = 400;
        boss.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        boss.setTint(0xff4444);

        const bite = scene.add.sprite(boss.x, boss.y, 'atk-bite').setScale(2).setDepth(12);
        bite.setRotation(angle);
        bite.play('anim-bite');
        bite.once('animationcomplete', () => bite.destroy());

        const updateBite = scene.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            if (boss.active && bite.active) {
              bite.setPosition(boss.x + Math.cos(angle) * 20, boss.y + Math.sin(angle) * 20);
            }
          },
        });

        scene.time.delayedCall(500, () => {
          updateBite.destroy();
          if (bite.active) bite.destroy();
          if (boss.active) { boss.clearTint(); boss.setVelocity(0, 0); }
        });
        break;
      }

      case 'fan': {
        const count = attack.projectileCount ?? 3;
        const spreadAngle = 30 * (Math.PI / 180);
        const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);

        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spreadAngle;
          const angle = baseAngle + offset;

          const proj = this.ctx.enemyProjectiles.get(boss.x, boss.y, 'atk-venoshock') as Phaser.Physics.Arcade.Sprite | null;
          if (!proj) continue;

          proj.setActive(true).setVisible(true).setScale(1.2).setDepth(7);
          proj.setData('damage', attack.damage);
          proj.setData('homing', false);
          proj.setData('speed', 140);
          proj.setTint(0xaa44ff);
          proj.setRotation(angle);

          if (scene.anims.exists('anim-venoshock')) {
            proj.play('anim-venoshock');
          }

          const body = proj.body as Phaser.Physics.Arcade.Body;
          body.enable = true;
          body.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);

          scene.time.delayedCall(5000, () => {
            if (proj.active) {
              this.ctx.enemyProjectiles.killAndHide(proj);
              body.enable = false;
            }
          });
        }
        break;
      }

      case 'aoe-tremor': {
        const radius = attack.aoeRadius ?? 150;
        boss.setTint(0xff8800);
        scene.cameras.main.shake(400, 0.008);
        SoundManager.playBossLand();

        const thrash = scene.add.sprite(boss.x, boss.y, 'atk-thrash').setScale(3).setDepth(12);
        thrash.play('anim-thrash');
        thrash.once('animationcomplete', () => thrash.destroy());

        const circle = scene.add.circle(boss.x, boss.y, 0, 0xff4400, 0.3).setDepth(3);
        scene.tweens.add({
          targets: circle,
          radius: { from: 0, to: radius },
          alpha: { from: 0.4, to: 0 },
          duration: 600,
          onComplete: () => circle.destroy(),
        });

        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, playerX, playerY);
        if (dist < radius) {
          player.takeDamage(attack.damage, scene.time.now);
          scene.events.emit('stats-refresh');
          if (player.isDead()) scene.events.emit('player-died');
        }

        scene.time.delayedCall(300, () => { if (boss.active) boss.clearTint(); });
        break;
      }

      case 'aoe-land': {
        const radius = attack.aoeRadius ?? 180;
        boss.setTint(0xffdd00);

        scene.tweens.add({
          targets: boss,
          y: boss.y - 80,
          duration: 400,
          ease: 'Quad.Out',
          yoyo: true,
          onComplete: () => {
            if (!boss.active) return;
            boss.clearTint();
            SoundManager.playBossLand();
            scene.cameras.main.shake(500, 0.012);

            const stomp = scene.add.sprite(boss.x, boss.y, 'atk-stomp').setScale(6).setDepth(12);
            stomp.play('anim-stomp');
            stomp.once('animationcomplete', () => stomp.destroy());

            const circle = scene.add.circle(boss.x, boss.y, 0, 0xffaa00, 0.3).setDepth(3);
            scene.tweens.add({
              targets: circle,
              radius: { from: 0, to: radius },
              alpha: { from: 0.5, to: 0 },
              duration: 500,
              onComplete: () => circle.destroy(),
            });

            const dist = Phaser.Math.Distance.Between(boss.x, boss.y, playerX, playerY);
            if (dist < radius) {
              player.takeDamage(attack.damage, scene.time.now);
              scene.events.emit('stats-refresh');
              if (player.isDead()) scene.events.emit('player-died');
            }
          },
        });
        break;
      }

      case 'teleport-fan': {
        const teleRange = attack.teleportRange ?? 150;
        boss.setTint(0xaa44ff);
        boss.setAlpha(0.3);

        // Teleport near player
        const tpAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const tpDist = Phaser.Math.FloatBetween(80, teleRange);
        const destX = playerX + Math.cos(tpAngle) * tpDist;
        const destY = playerY + Math.sin(tpAngle) * tpDist;

        scene.time.delayedCall(300, () => {
          if (!boss.active) return;
          boss.setPosition(destX, destY);
          boss.setAlpha(1);
          boss.setTint(0xaa44ff);

          // Fire fan of shadow balls after reappearing
          scene.time.delayedCall(200, () => {
            if (!boss.active) return;
            boss.clearTint();

            const count = attack.projectileCount ?? 5;
            const spreadAngle = 25 * (Math.PI / 180);
            const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);

            for (let i = 0; i < count; i++) {
              const offset = (i - (count - 1) / 2) * spreadAngle;
              const angle = baseAngle + offset;

              const proj = this.ctx.enemyProjectiles.get(boss.x, boss.y, 'atk-shadow-ball') as Phaser.Physics.Arcade.Sprite | null;
              if (!proj) continue;

              proj.setActive(true).setVisible(true).setScale(1).setDepth(7);
              proj.setData('damage', attack.damage);
              proj.setData('homing', false);
              proj.setData('speed', 160);
              proj.setData('effect', null);
              proj.setData('effectDuration', 0);

              if (scene.anims.exists('anim-shadow-ball')) {
                proj.play('anim-shadow-ball');
              }

              const body = proj.body as Phaser.Physics.Arcade.Body;
              body.enable = true;
              body.setVelocity(Math.cos(angle) * 160, Math.sin(angle) * 160);

              scene.time.delayedCall(4000, () => {
                if (proj.active) {
                  this.ctx.enemyProjectiles.killAndHide(proj);
                  body.enable = false;
                }
              });
            }
          });
        });
        break;
      }
    }
  }
}
