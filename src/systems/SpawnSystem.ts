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

  // ── Boss queue system (sequencial) ────────────────────────────────
  private bossQueueIndex = 0;
  private readonly activeBosses: Map<Boss, number> = new Map(); // boss → spawnTime
  private readonly enragedBosses: Set<Boss> = new Set();
  private waitingForBossDeath = false;
  private static readonly BOSS_NEXT_DELAY_MS = 180_000; // 3 min entre bosses
  private static readonly BOSS_ENRAGE_MS = 180_000;     // 3 min para enrage
  private static readonly BOSS_ENRAGE_SPEED = 1.3;      // +30% speed

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

    // Boss queue: primeiro boss no tempo original, depois sequencial
    this.bossQueueIndex = 0;
    if (BOSS_SCHEDULE.length > 0) {
      scene.time.addEvent({
        delay: BOSS_SCHEDULE[0].timeSeconds * 1000,
        callback: () => this.spawnNextBoss(),
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
      if (attack) {
        if (attack.config.beam) {
          this.fireEnemyBeam(enemy, attack.config);
        } else {
          this.fireEnemyProjectile(enemy, attack.config);
        }
      }

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

    // ── Boss enrage & queue ────────────────────────────────────────
    this.updateBossQueue(time);

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
    proj.setTexture(config.projectileKey);
    proj.setData('damage', config.damage);
    proj.setData('homing', false);
    proj.setData('effect', null);
    proj.setData('effectDuration', 0);

    const animKey = config.projectileKey.replace('atk-', 'anim-');
    if (scene.anims.exists(animKey)) {
      proj.play(animKey);
    }

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(enemy.x, enemy.y);

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

  // ── Boss queue: spawn sequencial ────────────────────────────────
  private spawnNextBoss(): void {
    if (this.bossQueueIndex >= BOSS_SCHEDULE.length) return;
    const spawn = BOSS_SCHEDULE[this.bossQueueIndex];
    this.bossQueueIndex++;
    this.waitingForBossDeath = true;
    this.spawnBossWithConfig(spawn);
  }

  private updateBossQueue(time: number): void {
    // Limpa bosses mortos do tracking
    for (const [boss, _spawnTime] of this.activeBosses) {
      if (!boss.active) {
        this.activeBosses.delete(boss);
        this.enragedBosses.delete(boss);
      }
    }

    // Se todos os bosses morreram, agendar próximo da fila
    if (this.waitingForBossDeath && this.activeBosses.size === 0) {
      this.waitingForBossDeath = false;
      if (this.bossQueueIndex < BOSS_SCHEDULE.length) {
        this.ctx.scene.time.addEvent({
          delay: SpawnSystem.BOSS_NEXT_DELAY_MS,
          callback: () => this.spawnNextBoss(),
        });
      }
    }

    // Enrage: boss vivo há mais de 3 min → +30% speed
    for (const [boss, spawnTime] of this.activeBosses) {
      if (this.enragedBosses.has(boss)) continue;
      if (time - spawnTime > SpawnSystem.BOSS_ENRAGE_MS) {
        this.enragedBosses.add(boss);
        boss.applyEnrage(SpawnSystem.BOSS_ENRAGE_SPEED);
        boss.setTint(0xff4444);

        // Visual: texto de aviso
        const txt = this.ctx.scene.add.text(boss.x, boss.y - 40, 'ENRAGED!', {
          fontSize: '14px', color: '#ff4444', fontFamily: 'monospace',
          stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);
        this.ctx.scene.tweens.add({
          targets: txt, y: txt.y - 30, alpha: 0, duration: 1500,
          onComplete: () => txt.destroy(),
        });
      }
    }
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

      // Trackear boss para enrage e queue sequencial
      this.activeBosses.set(boss, scene.time.now);

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
    proj.setTexture(config.projectileKey);
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
    body.reset(enemy.x, enemy.y);

    // Rotacionar projétil na direção de viagem
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    proj.setRotation(angle);

    scene.physics.moveToObject(proj, player, config.speed);

    scene.time.delayedCall(5000, () => {
      if (proj.active) {
        this.ctx.enemyProjectiles.killAndHide(proj);
        body.enable = false;
      }
    });
  }

  /**
   * Beam direcional: sprite aparece no inimigo, rotacionado na direção do player.
   * Não viaja — fica parado, joga animação, causa dano ao longo da linha, e desaparece.
   */
  private fireEnemyBeam(enemy: Enemy, config: EnemyRangedConfig): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const beamLen = config.beamLength ?? config.range;

    // Posição central do beam (metade entre inimigo e ponta)
    const cx = enemy.x + Math.cos(angle) * beamLen * 0.5;
    const cy = enemy.y + Math.sin(angle) * beamLen * 0.5;

    const beam = scene.add.sprite(cx, cy, config.projectileKey);
    beam.setScale(config.projectileScale ?? 0.6);
    beam.setDepth(7);
    beam.setAlpha(0.9);
    // Sprite psybeam é vertical (32x240), rotacionar -90° + ângulo de tiro
    beam.setRotation(angle - Math.PI / 2);

    const animKey = config.projectileKey.replace('atk-', 'anim-');
    if (scene.anims.exists(animKey)) {
      beam.play(animKey);
    }

    // Flash de aviso antes do beam
    beam.setAlpha(0.3);
    scene.tweens.add({
      targets: beam,
      alpha: 0.95,
      duration: 150,
    });

    // Dano ao player se estiver na linha do beam
    const beamWidth = 20;
    const px = player.x;
    const py = player.y;
    const startX = enemy.x;
    const startY = enemy.y;
    const endX = enemy.x + Math.cos(angle) * beamLen;
    const endY = enemy.y + Math.sin(angle) * beamLen;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0) {
      const perpDist = Math.abs(
        (dy * (px - startX) - dx * (py - startY)) / len
      );
      const projT = ((px - startX) * dx + (py - startY) * dy) / (len * len);

      if (perpDist <= beamWidth && projT >= -0.05 && projT <= 1.05) {
        const took = player.takeDamage(config.damage, scene.time.now);
        if (took) {
          const effect = config.effect ?? null;
          const duration = config.effectDurationMs ?? 0;
          if (effect === 'confusion') {
            player.applyConfusion(duration, scene.time.now);
          } else if (effect === 'stun') {
            player.applyStun(duration, scene.time.now);
          } else if (effect === 'slow') {
            player.applySlow(duration, scene.time.now);
          }
          scene.events.emit('stats-refresh');
          if (player.isDead()) scene.events.emit('player-died');
        }
      }
    }

    // Particulas ao longo do beam
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const ppx = startX + dx * t;
      const ppy = startY + dy * t;
      scene.add.particles(ppx, ppy, 'dragon-particle', {
        speed: { min: 10, max: 40 },
        lifespan: 300,
        quantity: 3,
        scale: { start: 1.2, end: 0 },
        tint: [0x9944ff, 0xbb66ff, 0xdd88ff],
        emitting: false,
      }).explode();
    }

    // Destruir após animação ou timeout
    const cleanup = () => {
      if (beam.active) {
        scene.tweens.add({
          targets: beam,
          alpha: 0,
          duration: 200,
          onComplete: () => beam.destroy(),
        });
      }
    };

    beam.once('animationcomplete', cleanup);
    scene.time.delayedCall(1500, cleanup);
  }

  // ── Boss attacks ──────────────────────────────────────────────────
  private executeBossAttack(boss: Boss, attack: BossAttackConfig): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const playerX = player.x;
    const playerY = player.y;

    switch (attack.pattern) {
      case 'charge': {
        const chargeSprite = attack.spriteKey ?? 'atk-bite';
        const chargeAnim = attack.animKey ?? 'anim-bite';
        const chargeScale = attack.spriteScale ?? 2;
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);
        const speed = 400;
        boss.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        boss.setTint(attack.tintColor ?? 0xff4444);

        const bite = scene.add.sprite(boss.x, boss.y, chargeSprite).setScale(chargeScale).setDepth(12);
        bite.setRotation(angle);
        if (scene.anims.exists(chargeAnim)) bite.play(chargeAnim);
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
        const fanSprite = attack.spriteKey ?? 'atk-gunk-shot';
        const fanAnim = attack.animKey ?? 'anim-gunk-shot';
        const fanScale = attack.spriteScale ?? 1.5;
        const count = attack.projectileCount ?? 3;
        const spreadAngle = 30 * (Math.PI / 180);
        const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);

        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spreadAngle;
          const angle = baseAngle + offset;

          const proj = this.ctx.enemyProjectiles.get(boss.x, boss.y, fanSprite) as Phaser.Physics.Arcade.Sprite | null;
          if (!proj) continue;

          proj.setActive(true).setVisible(true).setScale(fanScale).setDepth(7);
          proj.setTexture(fanSprite);
          proj.setData('damage', attack.damage);
          proj.setData('homing', false);
          proj.setData('speed', 140);
          if (attack.tintColor) proj.setTint(attack.tintColor); else proj.setTint(0xaa44ff);
          proj.setRotation(angle);

          if (scene.anims.exists(fanAnim)) {
            proj.play(fanAnim);
          }

          const body = proj.body as Phaser.Physics.Arcade.Body;
          body.enable = true;
          body.reset(boss.x, boss.y);
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
        const tremorSprite = attack.spriteKey ?? 'atk-thrash';
        const tremorAnim = attack.animKey ?? 'anim-thrash';
        const tremorScale = attack.spriteScale ?? 3;
        const radius = attack.aoeRadius ?? 150;
        boss.setTint(attack.tintColor ?? 0xff8800);
        scene.cameras.main.shake(400, 0.008);
        SoundManager.playBossLand();

        const thrash = scene.add.sprite(boss.x, boss.y, tremorSprite).setScale(tremorScale).setDepth(12);
        if (scene.anims.exists(tremorAnim)) thrash.play(tremorAnim);
        thrash.once('animationcomplete', () => thrash.destroy());

        const circle = scene.add.circle(boss.x, boss.y, 0, attack.aoeColor ?? 0xff4400, 0.3).setDepth(3);
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
        const landSprite = attack.spriteKey ?? 'atk-stomp';
        const landAnim = attack.animKey ?? 'anim-stomp';
        const landScale = attack.spriteScale ?? 6;
        const radius = attack.aoeRadius ?? 180;
        boss.setTint(attack.tintColor ?? 0xffdd00);

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

            const stomp = scene.add.sprite(boss.x, boss.y, landSprite).setScale(landScale).setDepth(12);
            if (scene.anims.exists(landAnim)) stomp.play(landAnim);
            stomp.once('animationcomplete', () => stomp.destroy());

            const circle = scene.add.circle(boss.x, boss.y, 0, attack.aoeColor ?? 0xffaa00, 0.3).setDepth(3);
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
              proj.setTexture('atk-shadow-ball');
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
              body.reset(boss.x, boss.y);
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
