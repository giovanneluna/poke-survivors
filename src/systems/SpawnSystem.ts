import Phaser from 'phaser';
import { ENEMIES, WAVES, SPAWN, BOSS_SCHEDULE, DIFFICULTY } from '../config';
import type { EnemyConfig, BossConfig, BossAttackConfig, BossSpawnConfig, WaveConfig, EnemyRangedConfig, EnemyBoomerangConfig, EnemyType } from '../types';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';
import { getSpatialGrid } from './SpatialHashGrid';

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

  constructor(private readonly ctx: GameContext) {}

  // ── Iniciar spawning (modo normal) ────────────────────────────────
  startSpawning(): void {
    const scene = this.ctx.scene;
    this.difficultyLevel = 0;

    const spawnMult = DIFFICULTY[this.ctx.difficulty].spawnRateMultiplier;
    this.spawnTimer = scene.time.addEvent({
      delay: Math.round(WAVES[0].spawnRate * spawnMult), loop: true, callback: () => this.spawnEnemy(),
    });

    scene.time.addEvent({
      delay: SPAWN.difficultyIntervalMs, loop: true, callback: () => this.increaseDifficulty(),
    });

    // Rattata circle event @ 2:00
    scene.time.delayedCall(120_000, () => this.spawnRattataCircle());

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
      getSpatialGrid().updatePosition(enemy);
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
    const maxMult = DIFFICULTY[this.ctx.difficulty].maxEnemiesMultiplier;
    const maxEnemies = Math.round(wave.maxEnemies * maxMult);
    const activeCount = getSpatialGrid().getActiveCount();
    if (activeCount >= maxEnemies) return;

    const config = this.pickEnemyType(wave);
    const pos = this.getSpawnPosition();
    const enemy = new Enemy(this.ctx.scene, pos.x, pos.y, config);
    this.ctx.enemyGroup.add(enemy);
    getSpatialGrid().insert(enemy);
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
    const enemies = getSpatialGrid().getActiveEnemies();
    let angle: number;

    if (enemies.length >= 5) {
      // Anti-clustering: spawnar no lado oposto à maioria dos inimigos
      let sumX = 0;
      let sumY = 0;
      const sample = enemies.length <= 20 ? enemies : enemies.slice(0, 20);
      for (const e of sample) {
        sumX += e.x - this.ctx.player.x;
        sumY += e.y - this.ctx.player.y;
      }
      const avgAngle = Math.atan2(sumY, sumX);
      angle = avgAngle + Math.PI + Phaser.Math.FloatBetween(-Math.PI / 2, Math.PI / 2);
    } else {
      angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    }

    return new Phaser.Math.Vector2(
      this.ctx.player.x + Math.cos(angle) * SPAWN.distanceFromPlayer,
      this.ctx.player.y + Math.sin(angle) * SPAWN.distanceFromPlayer
    );
  }

  private increaseDifficulty(): void {
    this.difficultyLevel++;
    const wave = this.getCurrentWave();
    const spawnMult = DIFFICULTY[this.ctx.difficulty].spawnRateMultiplier;
    this.spawnTimer.destroy();
    this.spawnTimer = this.ctx.scene.time.addEvent({
      delay: Math.round(wave.spawnRate * spawnMult), loop: true, callback: () => this.spawnEnemy(),
    });
  }

  // ── Rattata circle event ─────────────────────────────────────────
  private spawnRattataCircle(): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;

    // Warning flash + text
    scene.cameras.main.flash(500, 255, 50, 50, false);
    const warning = scene.add.text(player.x, player.y - 80, 'RATTATA HORDE!', {
      fontSize: '20px', color: '#ff4444', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);
    scene.tweens.add({
      targets: warning, alpha: 0, y: warning.y - 40,
      duration: 2000, onComplete: () => warning.destroy(),
    });

    // Spawn circle after brief delay
    scene.time.delayedCall(500, () => {
      const count = 25;
      const radius = 250;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = player.x + Math.cos(angle) * radius;
        const y = player.y + Math.sin(angle) * radius;
        const enemy = new Enemy(scene, x, y, ENEMIES.rattata);
        this.ctx.enemyGroup.add(enemy);
        getSpatialGrid().insert(enemy);
      }
    });
  }

  // ── Heal aura processing (Gloom) ──────────────────────────────────
  private processHealAura(healer: Enemy, time: number): void {
    if (time - healer.lastHealTick < 1000) return;
    healer.lastHealTick = time;

    const cfg = healer.healAura!;
    const nearby = getSpatialGrid().queryRadius(healer.x, healer.y, cfg.radius);
    for (const otherEnemy of nearby) {
      if (otherEnemy === healer) continue;
      otherEnemy.heal(cfg.hpPerSecond);
      otherEnemy.setTint(0x44ff44);
      this.ctx.scene.time.delayedCall(150, () => { if (otherEnemy.active) otherEnemy.clearTint(); });
    }
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

  // ── Boss queue: spawn sequencial (1 boss por vez) ───────────────
  private static readonly BOSS_OVERLAP_BUFF = 0.2; // +20% speed/dmg por overlap
  private bossOverlapStacks = 0;

  private spawnNextBoss(): void {
    if (this.bossQueueIndex >= BOSS_SCHEDULE.length) return;

    // Se já tem um boss vivo, bufar em vez de spawnar outro
    if (this.activeBosses.size > 0) {
      this.bossOverlapStacks++;
      const buffMult = 1 + SpawnSystem.BOSS_OVERLAP_BUFF * this.bossOverlapStacks;
      for (const [boss] of this.activeBosses) {
        if (!boss.active) continue;
        boss.applyEnrage(buffMult);
        boss.applyDamageBuff(buffMult);
        boss.setTint(0xff8800);

        // Visual: texto de buff
        const txt = this.ctx.scene.add.text(boss.x, boss.y - 40, `POWER UP! x${this.bossOverlapStacks}`, {
          fontSize: '14px', color: '#ff8800', fontFamily: 'monospace',
          stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);
        this.ctx.scene.tweens.add({
          targets: txt, y: txt.y - 30, alpha: 0, duration: 1500,
          onComplete: () => txt.destroy(),
        });
      }
      // Não avança o index — o boss pendente spawna depois de matar o atual
      return;
    }

    const spawn = BOSS_SCHEDULE[this.bossQueueIndex];
    this.bossQueueIndex++;
    this.bossOverlapStacks = 0;
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

    // Se o boss morreu, agendar próximo da fila após delay
    if (this.waitingForBossDeath && this.activeBosses.size === 0) {
      this.waitingForBossDeath = false;
      if (this.bossQueueIndex < BOSS_SCHEDULE.length) {
        this.ctx.scene.time.addEvent({
          delay: SpawnSystem.BOSS_NEXT_DELAY_MS,
          callback: () => this.spawnNextBoss(),
        });
      }
    }

    // Enrage: boss vivo há mais de 3 min → +20% speed e dmg (stackável)
    for (const [boss, spawnTime] of this.activeBosses) {
      const aliveMs = time - spawnTime;
      const stacks = Math.floor(aliveMs / SpawnSystem.BOSS_ENRAGE_MS);
      const prevStacks = this.enragedBosses.has(boss)
        ? (boss.getData('enrageStacks') as number ?? 1)
        : 0;
      if (stacks <= prevStacks) continue;

      this.enragedBosses.add(boss);
      boss.setData('enrageStacks', stacks);
      const buffMult = 1 + SpawnSystem.BOSS_OVERLAP_BUFF * stacks;
      boss.applyEnrage(buffMult);
      boss.applyDamageBuff(buffMult);
      boss.setTint(0xff4444);

      // Visual: texto de aviso
      const label = stacks === 1 ? 'ENRAGED!' : `ENRAGED x${stacks}!`;
      const txt = this.ctx.scene.add.text(boss.x, boss.y - 40, label, {
        fontSize: '14px', color: '#ff4444', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(50);
      this.ctx.scene.tweens.add({
        targets: txt, y: txt.y - 30, alpha: 0, duration: 1500,
        onComplete: () => txt.destroy(),
      });
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
      bossAttacks: baseConfig.bossAttacks.map(atk => ({
        ...atk,
        damage: Math.floor(atk.damage * dmgMult),
      })),
    };

    const label = hpMult > 1 ? `${baseConfig.name} (Enhanced)` : baseConfig.name;
    scene.events.emit('boss-warning', label, baseConfig.archetype);
    SoundManager.playBossWarning();

    scene.time.delayedCall(3000, () => {
      const pos = this.getSpawnPosition();
      const boss = new Boss(scene, pos.x, pos.y, scaledConfig);
      this.ctx.enemyGroup.add(boss);
      getSpatialGrid().insert(boss);
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

    const bossConfig = config as BossConfig;
    scene.events.emit('boss-warning', config.name, bossConfig.archetype);
    SoundManager.playBossWarning();

    scene.time.delayedCall(3000, () => {
      const pos = this.getSpawnPosition();
      const boss = new Boss(scene, pos.x, pos.y, bossConfig);
      this.ctx.enemyGroup.add(boss);
      getSpatialGrid().insert(boss);
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
        const tpSprite = attack.spriteKey ?? 'atk-shadow-ball';
        const tpAnim = attack.animKey ?? 'anim-shadow-ball';
        const tpScale = attack.spriteScale ?? 1;
        boss.setTint(attack.tintColor ?? 0xaa44ff);
        boss.setAlpha(0.3);

        const tpAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const tpDist = Phaser.Math.FloatBetween(140, teleRange);
        const destX = playerX + Math.cos(tpAngle) * tpDist;
        const destY = playerY + Math.sin(tpAngle) * tpDist;

        scene.time.delayedCall(300, () => {
          if (!boss.active) return;
          boss.setPosition(destX, destY);
          boss.setAlpha(1);
          boss.setTint(attack.tintColor ?? 0xaa44ff);

          scene.time.delayedCall(200, () => {
            if (!boss.active) return;
            boss.clearTint();

            const count = attack.projectileCount ?? 5;
            const spreadAngle = 25 * (Math.PI / 180);
            const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);

            for (let i = 0; i < count; i++) {
              const offset = (i - (count - 1) / 2) * spreadAngle;
              const angle = baseAngle + offset;

              const proj = this.ctx.enemyProjectiles.get(boss.x, boss.y, tpSprite) as Phaser.Physics.Arcade.Sprite | null;
              if (!proj) continue;

              proj.setActive(true).setVisible(true).setScale(tpScale).setDepth(7);
              proj.setTexture(tpSprite);
              proj.setData('damage', attack.damage);
              proj.setData('homing', false);
              proj.setData('speed', 160);
              proj.setData('effect', null);
              proj.setData('effectDuration', 0);

              if (scene.anims.exists(tpAnim)) {
                proj.play(tpAnim);
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

      // ═══════════════════════════════════════════════════════════════
      // 5 NEW ATTACK PATTERNS
      // ═══════════════════════════════════════════════════════════════

      case 'directional': {
        // Sprite direcional: escolhe 1 de 4 sprites baseado na direção ao player
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);
        const deg = Phaser.Math.RadToDeg(angle);
        // Map angle to 4 directions: 0=up, 1=down, 2=left, 3=right
        let dirIdx: number;
        if (deg >= -135 && deg < -45) dirIdx = 0;       // up
        else if (deg >= 45 && deg < 135) dirIdx = 1;    // down
        else if (Math.abs(deg) >= 135) dirIdx = 2;      // left
        else dirIdx = 3;                                  // right

        const sprites = attack.directionalSprites;
        const anims = attack.directionalAnims;
        const spriteKey = sprites ? sprites[dirIdx] : (attack.spriteKey ?? 'atk-slash');
        const animKey = anims ? anims[dirIdx] : (attack.animKey ?? 'anim-slash');
        const scale = attack.spriteScale ?? 1.5;
        const radius = attack.aoeRadius ?? 100;

        boss.setTint(attack.tintColor ?? 0x88ccff);

        // Posiciona sprite na frente do boss em direção ao player
        const offsetDist = 40;
        const sx = boss.x + Math.cos(angle) * offsetDist;
        const sy = boss.y + Math.sin(angle) * offsetDist;
        const dirSprite = scene.add.sprite(sx, sy, spriteKey).setScale(scale).setDepth(12);
        if (scene.anims.exists(animKey)) dirSprite.play(animKey);

        // Segue o boss durante a animação
        const followDir = scene.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            if (boss.active && dirSprite.active) {
              dirSprite.setPosition(boss.x + Math.cos(angle) * offsetDist, boss.y + Math.sin(angle) * offsetDist);
            }
          },
        });

        // Dano em cone na frente do boss
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, playerX, playerY);
        if (dist < radius) {
          player.takeDamage(attack.damage, scene.time.now);
          scene.events.emit('stats-refresh');
          if (player.isDead()) scene.events.emit('player-died');
        }

        const dirDuration = 600;
        dirSprite.once('animationcomplete', () => {
          followDir.destroy();
          if (dirSprite.active) dirSprite.destroy();
          if (boss.active) boss.clearTint();
        });
        scene.time.delayedCall(dirDuration, () => {
          followDir.destroy();
          if (dirSprite.active) dirSprite.destroy();
          if (boss.active) boss.clearTint();
        });
        break;
      }

      case 'beam': {
        // Raio na direção do player — dano em linha, boss para durante duração
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);
        const beamLen = attack.range ?? 200;
        const beamW = attack.beamWidth ?? 24;
        const duration = attack.beamDuration ?? 1500;

        boss.setTint(attack.tintColor ?? 0xffff44);
        boss.setVelocity(0, 0); // Boss fica parado durante o beam

        // Visual: sprite ou linha procedural
        const spriteKey = attack.spriteKey;
        const animKey = attack.animKey;
        const cx = boss.x + Math.cos(angle) * beamLen * 0.5;
        const cy = boss.y + Math.sin(angle) * beamLen * 0.5;

        let beamObj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
        if (spriteKey && scene.textures.exists(spriteKey)) {
          const spr = scene.add.sprite(cx, cy, spriteKey).setScale(attack.spriteScale ?? 1).setDepth(12).setAlpha(0.9);
          spr.setRotation(angle - Math.PI / 2);
          if (animKey && scene.anims.exists(animKey)) spr.play(animKey);
          beamObj = spr;
        } else {
          // Beam procedural (linha branca brilhante)
          const gfx = scene.add.graphics().setDepth(12);
          const endX = boss.x + Math.cos(angle) * beamLen;
          const endY = boss.y + Math.sin(angle) * beamLen;
          gfx.lineStyle(beamW, attack.aoeColor ?? 0xffffff, 0.7);
          gfx.beginPath();
          gfx.moveTo(boss.x, boss.y);
          gfx.lineTo(endX, endY);
          gfx.strokePath();
          beamObj = gfx as unknown as Phaser.GameObjects.Graphics;
        }

        // Flash de aviso
        scene.tweens.add({ targets: beamObj, alpha: { from: 0.3, to: 0.95 }, duration: 150 });

        // Dano tick durante o beam
        const beamDmgTimer = scene.time.addEvent({
          delay: 300, loop: true,
          callback: () => {
            if (!boss.active) return;
            const startX = boss.x;
            const startY = boss.y;
            const endX = boss.x + Math.cos(angle) * beamLen;
            const endY = boss.y + Math.sin(angle) * beamLen;
            const dx = endX - startX;
            const dy = endY - startY;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len <= 0) return;

            const perpDist = Math.abs((dy * (playerX - startX) - dx * (playerY - startY)) / len);
            const projT = ((playerX - startX) * dx + (playerY - startY) * dy) / (len * len);

            if (perpDist <= beamW && projT >= -0.05 && projT <= 1.05) {
              player.takeDamage(Math.floor(attack.damage * 0.3), scene.time.now);
              scene.events.emit('stats-refresh');
              if (player.isDead()) scene.events.emit('player-died');
            }
          },
        });

        scene.time.delayedCall(duration, () => {
          beamDmgTimer.destroy();
          if (beamObj.active) {
            scene.tweens.add({
              targets: beamObj, alpha: 0, duration: 200,
              onComplete: () => beamObj.destroy(),
            });
          }
          if (boss.active) boss.clearTint();
        });
        break;
      }

      case 'buff': {
        // Aura visual + stats temporários no boss
        const buffType = attack.buffType ?? 'damage';
        const buffDuration = attack.buffDuration ?? 5000;
        const buffValue = attack.buffValue ?? 0.3;

        boss.setTint(attack.tintColor ?? 0xffdd44);

        // Visual: partículas de aura
        const auraColor = attack.aoeColor ?? 0xffdd44;
        const aura = scene.add.circle(boss.x, boss.y, 30, auraColor, 0.3).setDepth(3);
        scene.tweens.add({
          targets: aura, scale: { from: 1, to: 2 }, alpha: { from: 0.4, to: 0.1 },
          duration: 800, yoyo: true, repeat: Math.floor(buffDuration / 1600),
          onUpdate: () => { if (boss.active) aura.setPosition(boss.x, boss.y); },
          onComplete: () => aura.destroy(),
        });

        if (buffType === 'heal') {
          // Cura: heal instantâneo
          const healAmount = Math.floor((boss as Boss).hpRegenPerSec > 0
            ? (attack.buffValue ?? 0.2) * boss.getMaxHp()
            : (attack.buffValue ?? 0.2) * boss.getMaxHp());
          boss.heal(healAmount);

          // Visual: texto de cura
          const healTxt = scene.add.text(boss.x, boss.y - 30, `+${healAmount}`, {
            fontSize: '14px', color: '#44ff44', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(50);
          scene.tweens.add({
            targets: healTxt, y: healTxt.y - 40, alpha: 0, duration: 1200,
            onComplete: () => healTxt.destroy(),
          });

          // Boss parado durante cast
          boss.setVelocity(0, 0);
          scene.time.delayedCall(2000, () => { if (boss.active) boss.clearTint(); });
        } else {
          // Stats buff via enrage-like mechanism
          if (buffType === 'speed') {
            boss.applyEnrage(1 + buffValue);
          }
          // Damage/resist buffs usam tint como indicador visual
          scene.time.delayedCall(buffDuration, () => {
            if (boss.active) {
              boss.clearTint();
              if (buffType === 'speed') boss.applyEnrage(1 / (1 + buffValue));
            }
          });
        }
        break;
      }

      case 'zone': {
        // Círculo persistente no chão com tick damage ou debuff
        const radius = attack.aoeRadius ?? 100;
        const duration = attack.zoneDuration ?? 3000;
        const tickRate = attack.zoneTickRate ?? 500;
        const effect = attack.zoneEffect ?? 'damage';
        const effectValue = attack.zoneEffectValue ?? 0;

        // Posição: no player atual (para forçar ele a se mover)
        const zoneX = playerX;
        const zoneY = playerY;

        // Visual: círculo pulsante
        const zoneColor = attack.aoeColor ?? 0x9944ff;
        const zone = scene.add.circle(zoneX, zoneY, radius, zoneColor, 0.2).setDepth(3);
        scene.tweens.add({
          targets: zone, alpha: { from: 0.15, to: 0.35 },
          duration: 400, yoyo: true, repeat: -1,
        });

        // Borda do círculo
        const border = scene.add.circle(zoneX, zoneY, radius).setDepth(3);
        border.setStrokeStyle(2, zoneColor, 0.5);

        // Tick damage/effect
        const zoneTick = scene.time.addEvent({
          delay: tickRate, loop: true,
          callback: () => {
            const dist = Phaser.Math.Distance.Between(zoneX, zoneY, player.x, player.y);
            if (dist > radius) return;

            if (effect === 'damage' && attack.damage > 0) {
              player.takeDamage(attack.damage, scene.time.now);
              scene.events.emit('stats-refresh');
              if (player.isDead()) scene.events.emit('player-died');
            } else if (effect === 'slow') {
              player.applySlow(tickRate + 200, scene.time.now);
            } else if (effect === 'pull') {
              // Puxa player em direção ao centro
              const pullAngle = Phaser.Math.Angle.Between(player.x, player.y, zoneX, zoneY);
              const pullForce = effectValue || 80;
              player.setVelocity(
                player.body!.velocity.x + Math.cos(pullAngle) * pullForce,
                player.body!.velocity.y + Math.sin(pullAngle) * pullForce
              );
            } else if (effect === 'poison') {
              const poisonDps = attack.damage > 0 ? attack.damage : 5;
              player.applyPoison(poisonDps, tickRate + 500, scene.time.now);
            }
          },
        });

        // Cleanup
        scene.time.delayedCall(duration, () => {
          zoneTick.destroy();
          scene.tweens.add({
            targets: [zone, border], alpha: 0, duration: 300,
            onComplete: () => { zone.destroy(); border.destroy(); },
          });
        });
        break;
      }

      case 'traveling': {
        // Projétil que viaja em linha reta (não homing), opcionalmente explode
        const speed = attack.projectileSpeed ?? 150;
        const spriteKey = attack.spriteKey ?? 'atk-dragon-pulse';
        const animKey = attack.animKey ?? 'anim-dragon-pulse';
        const scale = attack.spriteScale ?? 1.5;

        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);
        const proj = this.ctx.enemyProjectiles.get(boss.x, boss.y, spriteKey) as Phaser.Physics.Arcade.Sprite | null;
        if (!proj) break;

        proj.setActive(true).setVisible(true).setScale(scale).setDepth(7);
        proj.setTexture(spriteKey);
        proj.setData('damage', attack.damage);
        proj.setData('homing', false);
        proj.setData('speed', speed);
        proj.setData('effect', null);
        proj.setData('effectDuration', 0);
        if (attack.tintColor) proj.setTint(attack.tintColor);
        proj.setRotation(angle);

        if (scene.anims.exists(animKey)) proj.play(animKey);

        const body = proj.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(boss.x, boss.y);
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        const lifespan = (attack.range ?? 400) / speed * 1000;
        scene.time.delayedCall(lifespan, () => {
          if (!proj.active) return;

          if (attack.explodeOnEnd) {
            // Explosão AoE no final
            const expRadius = attack.explodeRadius ?? 80;
            const expCircle = scene.add.circle(proj.x, proj.y, 0, attack.aoeColor ?? 0xff6600, 0.4).setDepth(3);
            scene.tweens.add({
              targets: expCircle,
              radius: { from: 0, to: expRadius },
              alpha: { from: 0.5, to: 0 },
              duration: 400,
              onComplete: () => expCircle.destroy(),
            });

            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, player.x, player.y);
            if (dist < expRadius) {
              player.takeDamage(Math.floor(attack.damage * 0.5), scene.time.now);
              scene.events.emit('stats-refresh');
              if (player.isDead()) scene.events.emit('player-died');
            }
          }

          this.ctx.enemyProjectiles.killAndHide(proj);
          body.enable = false;
        });
        break;
      }
    }
  }
}
