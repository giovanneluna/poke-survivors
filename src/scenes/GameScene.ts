import Phaser from 'phaser';
import { GAME, STARTERS, ENEMIES, WAVES, BOSS_SCHEDULE, SPAWN, XP_GEM, UPGRADE_DEFS, DESTRUCTIBLES, EVOLUTIONS, ATTACKS } from '../config';
import type { StarterConfig } from '../config';
import type { EnemyConfig, BossConfig, BossAttackConfig, WaveConfig, UpgradeOption, PickupType, HeldItemType, DestructibleType, AttackType, PokemonForm } from '../types';
import { isFormUnlocked } from '../types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Destructible } from '../entities/Destructible';
import { Pickup } from '../entities/Pickup';
import { Ember } from '../attacks/Ember';
import { FireSpin } from '../attacks/FireSpin';
import { Flamethrower } from '../attacks/Flamethrower';
import { Inferno } from '../attacks/Inferno';
import { FireBlast } from '../attacks/FireBlast';
import { BlastBurn } from '../attacks/BlastBurn';
import { Scratch } from '../attacks/Scratch';
import { FireFang } from '../attacks/FireFang';
import { DragonBreath } from '../attacks/DragonBreath';
import { Smokescreen } from '../attacks/Smokescreen';
import { FlameCharge } from '../attacks/FlameCharge';
import { Slash } from '../attacks/Slash';
import { DragonClaw } from '../attacks/DragonClaw';
import { AirSlash } from '../attacks/AirSlash';
import { FlareBlitz } from '../attacks/FlareBlitz';
import { Hurricane } from '../attacks/Hurricane';
import { Outrage } from '../attacks/Outrage';
import { FurySwipes } from '../attacks/FurySwipes';
import { BlazeKick } from '../attacks/BlazeKick';
import { DragonPulse } from '../attacks/DragonPulse';
import { NightSlash } from '../attacks/NightSlash';
import { AerialAce } from '../attacks/AerialAce';
import { FlareRush } from '../attacks/FlareRush';
import { DragonRush } from '../attacks/DragonRush';
import { HeatWave } from '../attacks/HeatWave';
import { DracoMeteor } from '../attacks/DracoMeteor';
import { SoundManager } from '../audio/SoundManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemyGroup!: Phaser.Physics.Arcade.Group;
  xpGems!: Phaser.Physics.Arcade.Group;
  private destructibles!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;

  private spawnTimer!: Phaser.Time.TimerEvent;
  private difficultyLevel = 0;
  private gameTime = 0;
  private isPaused = false;
  private rerollLocked = false;
  private joystick: VirtualJoystick | null = null;
  private attackColliders = new Map<string, Phaser.Physics.Arcade.Collider[]>();
  private debugMode = false;
  private starterKey = 'charmander';
  private starterConfig: StarterConfig | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { debugMode?: boolean; starterKey?: string }): void {
    this.debugMode = data?.debugMode ?? false;
    this.starterKey = data?.starterKey ?? 'charmander';
  }

  create(): void {
    // Reset de estado (Phaser reutiliza a mesma instância da Scene)
    this.isPaused = false;
    this.gameTime = 0;
    this.difficultyLevel = 0;
    this.rerollLocked = false;
    this.joystick = null;
    this.attackColliders.clear();

    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.generateWorld();

    // ── Starter config ─────────────────────────────────────────────
    this.starterConfig = STARTERS.find(s => s.key === this.starterKey) ?? STARTERS[0];

    // ── Player ─────────────────────────────────────────────────────
    this.player = new Player(this, GAME.worldWidth / 2, GAME.worldHeight / 2, this.starterConfig);

    // ── Joystick virtual (touch devices) ─────────────────────────
    if (this.sys.game.device.input.touch) {
      this.joystick = new VirtualJoystick(this);
    }

    // ── Grupos ─────────────────────────────────────────────────────
    this.enemyGroup = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.xpGems = this.physics.add.group({ defaultKey: 'xp-gem', maxSize: 300 });
    this.destructibles = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({ defaultKey: 'atk-shadow-ball', maxSize: 60 });

    // ── Ataque inicial: Ember ──────────────────────────────────────
    const ember = new Ember(this, this.player, this.enemyGroup);
    this.player.addAttack('ember', ember);
    this.setupEmberCollisions(ember);

    // ── Câmera ─────────────────────────────────────────────────────
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);

    // ── Lançar UIScene (sempre após GameScene estar pronta) ──────
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    this.scene.launch('UIScene');

    // ── Spawn de inimigos (apenas modo normal) ─────────────────────
    if (!this.debugMode) {
      this.difficultyLevel = 0;
      this.spawnTimer = this.time.addEvent({
        delay: WAVES[0].spawnRate, loop: true, callback: () => this.spawnEnemy(),
      });
      this.time.addEvent({
        delay: SPAWN.difficultyIntervalMs, loop: true, callback: () => this.increaseDifficulty(),
      });

      // ── Objetos destrutíveis no mapa ───────────────────────────────
      this.spawnDestructibles();

      // ── Treasure Chest a cada 60s ──────────────────────────────────
      this.time.addEvent({
        delay: 60_000, loop: true, callback: () => this.spawnChest(),
      });

      // ── Boss spawn timers ────────────────────────────────────────────
      for (const bossSpawn of BOSS_SCHEDULE) {
        this.time.addEvent({
          delay: bossSpawn.timeSeconds * 1000,
          callback: () => this.spawnBoss(bossSpawn.type),
        });
      }
    }

    // ── Colisões ───────────────────────────────────────────────────
    this.setupCollisions();

    // ── Escuta upgrade selecionado ─────────────────────────────────
    this.events.on('upgrade-selected', (upgradeId: string) => {
      this.applyUpgrade(upgradeId);
      this.resumeGame();
    });

    // ── Escuta reroll (flag anti-reentry contra double-fire do Phaser) ─
    this.events.on('reroll-requested', () => {
      if (this.rerollLocked) return;
      if (!this.debugMode && this.player.stats.rerolls <= 0) return;
      this.rerollLocked = true;
      if (!this.debugMode) this.player.stats.rerolls--;
      SoundManager.playClick();
      const newOptions = this.generateUpgradeOptions();
      this.events.emit('level-up', newOptions, this.player.stats.level, this.getDisplayRerolls());
      this.time.delayedCall(250, () => { this.rerollLocked = false; });
    });

    // ── Gacha reward aplicado ──────────────────────────────────────
    this.events.on('gacha-reward', (rewardType: string) => {
      this.applyGachaReward(rewardType);
      this.resumeGame();
    });

    // ── Kills de ataques em cone (Flamethrower, BlastBurn, Ember close-range)
    this.events.on('cone-attack-kill', (x: number, y: number, xpValue: number) => {
      this.player.stats.kills++;
      SoundManager.playEnemyDeath();
      this.spawnXpGem(x, y, xpValue);
      this.emitStats();
    });

    this.gameTime = 0;
    this.emitStats();

    // ── Debug Mode: mostrar menu de cenários ─────────────────────────
    if (this.debugMode) {
      this.isPaused = true;
      this.physics.pause();
      this.time.delayedCall(100, () => this.showDebugMenu());
    }
  }

  // ── Geração do mundo ──────────────────────────────────────────────
  private generateWorld(): void {
    const T = GAME.tileSize;
    const cols = Math.ceil(GAME.worldWidth / T);
    const rows = Math.ceil(GAME.worldHeight / T);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const tile = this.pickTile(col, row, cols, rows);
        this.add.image(col * T, row * T, tile).setOrigin(0, 0).setDepth(0);
      }
    }
  }

  private pickTile(col: number, row: number, maxCols: number, maxRows: number): string {
    const edgeMargin = 3;
    if (col < edgeMargin || col >= maxCols - edgeMargin || row < edgeMargin || row >= maxRows - edgeMargin) {
      const isOuterEdge = col < 1 || col >= maxCols - 1 || row < 1 || row >= maxRows - 1;
      return isOuterEdge ? 'tile-water' : 'tile-tree';
    }
    const noise = Math.sin(col * 0.7 + row * 0.3) * Math.cos(col * 0.2 + row * 0.9);
    const rand = Math.random();
    if (noise > 0.7 && rand < 0.3) return 'tile-flowers';
    if (noise < -0.6 && rand < 0.2) return 'tile-dirt';
    if (rand < 0.02) return 'tile-rock';
    if (rand < 0.15) return 'tile-grass-2';
    return 'tile-grass-1';
  }

  // ── Objetos destrutíveis ────────────────────────────────────────────
  private spawnDestructibles(): void {
    const margin = 200;
    const max = GAME.worldWidth - margin;
    const types: { key: DestructibleType; count: number }[] = [
      { key: 'tallGrass', count: 40 },
      { key: 'berryBush', count: 15 },
      { key: 'rockSmash', count: 8 },
    ];

    for (const { key, count } of types) {
      const config = DESTRUCTIBLES[key];
      for (let i = 0; i < count; i++) {
        const x = Phaser.Math.Between(margin, max);
        const y = Phaser.Math.Between(margin, max);
        const dest = new Destructible(this, x, y, config);
        this.destructibles.add(dest);
      }
    }
  }

  private spawnChest(): void {
    if (this.isPaused) return;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(150, 400);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 200, GAME.worldWidth - 200);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 200, GAME.worldHeight - 200);
    const config = DESTRUCTIBLES.treasureChest;
    const chest = new Destructible(this, x, y, config);
    this.destructibles.add(chest);

    // Efeito visual de spawn
    this.add.particles(x, y, 'fire-particle', {
      speed: { min: 20, max: 50 }, lifespan: 500, quantity: 10,
      scale: { start: 2, end: 0 }, tint: [0xFFD700, 0xFFE44D],
      emitting: false,
    }).explode();
  }

  // ── Update principal ──────────────────────────────────────────────
  update(time: number, delta: number): void {
    if (this.isPaused) return;

    this.gameTime += delta;
    this.player.handleMovement(time, this.joystick?.direction);
    this.player.updateAttacks(time, delta);
    this.player.updatePoison(time, delta);
    if (this.player.isDead()) { this.gameOver(); return; }

    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);

    // Inimigos: mover + ataques ranged
    this.enemyGroup.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      enemy.moveToward(playerPos);
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist > SPAWN.despawnDistance && enemy.shouldDespawn()) { enemy.cleanup(); return; }

      // Boss attacks
      if (enemy instanceof Boss) {
        const bossAtk = enemy.tryBossAttack(this.player.x, this.player.y, time);
        if (bossAtk) this.executeBossAttack(enemy, bossAtk);
      }

      // Ataque ranged
      const attack = enemy.tryRangedAttack(this.player.x, this.player.y, time);
      if (attack) this.fireEnemyProjectile(enemy, attack.config);
    });

    // Magnetismo XP + despawn de gems distantes
    this.xpGems.getChildren().forEach(child => {
      const gem = child as Phaser.Physics.Arcade.Sprite;
      if (!gem.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y);
      if (dist < this.player.stats.magnetRange) {
        this.physics.moveToObject(gem, this.player, XP_GEM.magnetSpeed);
      } else if (dist > SPAWN.despawnDistance) {
        // Reciclar gems que ficaram muito longe (libera pool)
        this.xpGems.killAndHide(gem);
        (gem.body as Phaser.Physics.Arcade.Body).enable = false;
      } else {
        // Gem fora do range magnético: garantir que está parada
        const body = gem.body as Phaser.Physics.Arcade.Body;
        if (body.velocity.lengthSq() > 0) {
          body.setVelocity(0, 0);
        }
      }
    });

    // Homing dos projéteis de Gastly (Shadow Ball)
    this.enemyProjectiles.getChildren().forEach(child => {
      const proj = child as Phaser.Physics.Arcade.Sprite;
      if (!proj.active || !proj.getData('homing')) return;
      this.physics.moveToObject(proj, this.player, proj.getData('speed') as number);
    });

    if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) this.emitStats();
  }

  // ── Projéteis de inimigos ───────────────────────────────────────────
  private fireEnemyProjectile(enemy: Enemy, config: import('../types').EnemyRangedConfig): void {
    const proj = this.enemyProjectiles.get(enemy.x, enemy.y, config.projectileKey) as Phaser.Physics.Arcade.Sprite | null;
    if (!proj) return;

    proj.setActive(true).setVisible(true).setScale(config.projectileScale ?? 0.6).setDepth(7);
    proj.setData('damage', config.damage);
    proj.setData('homing', config.homing);
    proj.setData('speed', config.speed);
    proj.setData('effect', config.effect ?? null);
    proj.setData('effectDuration', config.effectDurationMs ?? 0);

    // Animar projétil com sprite real
    const animKey = config.projectileKey.replace('atk-', 'anim-');
    if (this.anims.exists(animKey)) {
      proj.play(animKey);
    }

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    this.physics.moveToObject(proj, this.player, config.speed);

    // Auto-destruir após 5s
    this.time.delayedCall(5000, () => {
      if (proj.active) {
        this.enemyProjectiles.killAndHide(proj);
        body.enable = false;
      }
    });
  }

  // ── Colisões ────────────────────────────────────────────────────────
  private setupCollisions(): void {
    // Inimigos não se empilham (separação física)
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);

    // Inimigo → jogador (corpo-a-corpo)
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject, this.enemyGroup,
      (_player, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.active) {
          const took = this.player.takeDamage(enemy.damage, this.time.now);
          if (took) {
            SoundManager.playPlayerHit();
            // Efeito de contato (slow por Caterpie/Weedle/Oddish, poison por Ekans)
            if (enemy.contactEffect?.type === 'slow') {
              this.player.applySlow(enemy.contactEffect.durationMs, this.time.now);
            } else if (enemy.contactEffect?.type === 'poison' && enemy.contactEffect.dps) {
              this.player.applyPoison(enemy.contactEffect.dps, enemy.contactEffect.durationMs, this.time.now);
            }
            this.emitStats();
            if (this.player.isDead()) this.gameOver();
          }
        }
      }
    );

    // Projétil inimigo → jogador
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject, this.enemyProjectiles,
      (_player, projObj) => {
        const proj = projObj as Phaser.Physics.Arcade.Sprite;
        if (!proj.active) return;

        const dmg = proj.getData('damage') as number;
        const took = this.player.takeDamage(dmg, this.time.now);

        // Destruir projétil sempre (mesmo se invincível)
        this.enemyProjectiles.killAndHide(proj);
        (proj.body as Phaser.Physics.Arcade.Body).enable = false;

        if (took) {
          SoundManager.playPlayerHit();

          // Efeito especial (slow do Supersonic)
          const effect = proj.getData('effect') as string | null;
          if (effect === 'slow') {
            const duration = proj.getData('effectDuration') as number;
            this.player.applySlow(duration, this.time.now);
          }

          this.emitStats();
          if (this.player.isDead()) this.gameOver();
        }
      }
    );

    // Jogador → XP gems
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject, this.xpGems,
      (_player, gemObj) => {
        const gem = gemObj as Phaser.Physics.Arcade.Sprite;
        if (!gem.active) return;
        const body = gem.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.enable = false;
        this.xpGems.killAndHide(gem);
        const xpAmount = gem.getData('xpValue') as number ?? 1;
        SoundManager.playXpPickup();
        const leveled = this.player.addXp(xpAmount);
        this.emitStats();
        if (leveled) this.triggerLevelUp();
      }
    );

    // Jogador → pickups
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject, this.pickups,
      (_player, pickupObj) => {
        const pickup = pickupObj as Pickup;
        if (!pickup.active) return;
        this.applyPickup(pickup);
      }
    );
  }

  // ── Colisões dos ataques do player ──────────────────────────────────
  setupEmberCollisions(ember: Ember): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];

    colliders.push(this.physics.add.overlap(ember.getBullets(), this.enemyGroup, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active) return;
      const hitX = bullet.x; const hitY = bullet.y;
      ember.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      SoundManager.playHit();
      this.playFireHit(hitX, hitY);
      const killed = enemy.takeDamage(ember.getDamage());
      if (killed) { SoundManager.playEnemyDeath(); this.onEnemyKilled(enemy); }
    }));

    // Ember vs destructibles
    colliders.push(this.physics.add.overlap(ember.getBullets(), this.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      ember.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(ember.getDamage());
      if (destroyed) this.onDestructibleDestroyed(dest);
    }));

    this.attackColliders.set('ember', colliders);
  }

  setupFireSpinCollisions(fireSpin: FireSpin): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const hitCooldowns = new Map<number, number>();

    colliders.push(this.physics.add.overlap(fireSpin.getOrbs(), this.enemyGroup, (_orbObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return;
      const enemyId = enemy.x * 10000 + enemy.y;
      const lastHit = hitCooldowns.get(enemyId) ?? 0;
      if (this.time.now - lastHit < 400) return;
      hitCooldowns.set(enemyId, this.time.now);
      this.playFireHit(enemy.x, enemy.y);
      const killed = enemy.takeDamage(fireSpin.getDamage());
      if (killed) { this.onEnemyKilled(enemy); hitCooldowns.delete(enemyId); }
    }));

    // FireSpin vs destructibles
    colliders.push(this.physics.add.overlap(fireSpin.getOrbs(), this.destructibles, (_orbObj, destObj) => {
      const dest = destObj as Destructible;
      if (!dest.active) return;
      const destroyed = dest.takeDamage(1);
      if (destroyed) this.onDestructibleDestroyed(dest);
    }));

    // FireSpin orbs destroem projéteis inimigos
    colliders.push(this.physics.add.overlap(fireSpin.getOrbs(), this.enemyProjectiles, (_orbObj, projObj) => {
      const proj = projObj as Phaser.Physics.Arcade.Sprite;
      if (!proj.active) return;
      this.enemyProjectiles.killAndHide(proj);
      (proj.body as Phaser.Physics.Arcade.Body).enable = false;
      this.playFireHit(proj.x, proj.y);
    }));

    this.attackColliders.set('fireSpin', colliders);
  }

  setupInfernoCollisions(inferno: Inferno): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];

    colliders.push(this.physics.add.overlap(inferno.getBullets(), this.enemyGroup, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active) return;
      inferno.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const killed = enemy.takeDamage(inferno.getDamage());
      if (killed) { this.onEnemyKilled(enemy); }
      // EXPLOSÃO AoE
      inferno.explodeAt(enemy.x, enemy.y);
    }));

    colliders.push(this.physics.add.overlap(inferno.getBullets(), this.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      inferno.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(inferno.getDamage());
      if (destroyed) this.onDestructibleDestroyed(dest);
    }));

    this.attackColliders.set('inferno', colliders);
  }

  setupFireBlastCollisions(fireBlast: FireBlast): void {
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const hitCooldowns = new Map<number, number>();

    colliders.push(this.physics.add.overlap(fireBlast.getOrbs(), this.enemyGroup, (_orbObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return;
      const enemyId = enemy.x * 10000 + enemy.y;
      const lastHit = hitCooldowns.get(enemyId) ?? 0;
      if (this.time.now - lastHit < 300) return;
      hitCooldowns.set(enemyId, this.time.now);
      this.playFireHit(enemy.x, enemy.y);
      const killed = enemy.takeDamage(fireBlast.getDamage());
      if (killed) { this.onEnemyKilled(enemy); hitCooldowns.delete(enemyId); }
    }));

    colliders.push(this.physics.add.overlap(fireBlast.getOrbs(), this.destructibles, (_orbObj, destObj) => {
      const dest = destObj as Destructible;
      if (!dest.active) return;
      const destroyed = dest.takeDamage(2);
      if (destroyed) this.onDestructibleDestroyed(dest);
    }));

    // FireBlast orbs destroem projéteis inimigos
    colliders.push(this.physics.add.overlap(fireBlast.getOrbs(), this.enemyProjectiles, (_orbObj, projObj) => {
      const proj = projObj as Phaser.Physics.Arcade.Sprite;
      if (!proj.active) return;
      this.enemyProjectiles.killAndHide(proj);
      (proj.body as Phaser.Physics.Arcade.Body).enable = false;
      this.playFireHit(proj.x, proj.y);
    }));

    this.attackColliders.set('fireBlast', colliders);
  }

  private removeAttackColliders(type: string): void {
    const colliders = this.attackColliders.get(type);
    if (colliders) {
      colliders.forEach(c => c.destroy());
      this.attackColliders.delete(type);
    }
  }

  // ── Destructible drops ──────────────────────────────────────────────
  private onDestructibleDestroyed(dest: Destructible): void {
    const config = dest.config;

    // Treasure Chest dropa um Held Item aleatório
    if (dest.destructibleType === 'treasureChest') {
      this.dropHeldItem(dest.x, dest.y);
      return;
    }

    for (const drop of config.drops) {
      if (Math.random() > drop.chance) continue;

      if (drop.type === 'xpGem') {
        this.spawnXpGem(dest.x, dest.y, drop.count ?? 1);
      } else {
        this.spawnPickup(dest.x, dest.y, drop.type);
      }
      break; // Apenas 1 drop por objeto
    }
  }

  private dropHeldItem(x: number, y: number): void {
    const items: HeldItemType[] = [
      'charcoal', 'wideLens', 'choiceSpecs', 'dragonFang', 'sharpBeak',
      'scopeLens', 'razorClaw', 'shellBell', 'focusBand', 'quickClaw', 'leftovers',
    ];
    // Filtrar itens que o player já tem
    const available = items.filter(i => !this.player.hasHeldItem(i));
    if (available.length === 0) {
      // Se já tem todos, dropa Rare Candy
      this.spawnPickup(x, y, 'rareCandy');
      return;
    }
    const item = available[Phaser.Math.Between(0, available.length - 1)];

    // Cria pickup visual do held item
    const textureMap: Partial<Record<HeldItemType, string>> = {
      charcoal: 'held-charcoal',
      wideLens: 'held-wide-lens',
      choiceSpecs: 'held-choice-specs',
      quickClaw: 'held-quick-claw',
      leftovers: 'held-leftovers',
      dragonFang: 'held-dragon-fang',
      sharpBeak: 'held-sharp-beak',
      silkScarf: 'held-silk-scarf',
      shellBell: 'held-shell-bell',
      scopeLens: 'held-scope-lens',
      razorClaw: 'held-razor-claw',
      focusBand: 'held-focus-band',
      metronome: 'held-metronome',
      magnet: 'held-magnet',
    };

    const pickup = new Pickup(this, x, y, 'oranBerry', textureMap[item] ?? 'held-charcoal');
    pickup.setData('isHeldItem', true);
    pickup.setData('heldItemType', item);
    this.pickups.add(pickup);
  }

  // ── Pickups ─────────────────────────────────────────────────────────
  private spawnPickup(x: number, y: number, type: PickupType): void {
    const textureMap: Record<PickupType, string> = {
      oranBerry: 'pickup-oran',
      magnetBurst: 'pickup-magnet',
      rareCandy: 'pickup-candy',
      pokeballBomb: 'pickup-bomb',
      gachaBox: 'gacha-box',
    };
    const pickup = new Pickup(this, x, y, type, textureMap[type]);
    this.pickups.add(pickup);
  }

  private applyPickup(pickup: Pickup): void {
    // Held Item especial
    if (pickup.getData('isHeldItem')) {
      const itemType = pickup.getData('heldItemType') as HeldItemType;
      this.player.addHeldItem(itemType);
      SoundManager.playPickupItem();
      this.showPickupNotification(`${itemType.toUpperCase()} obtido!`, 0xFFD700);
      pickup.destroy();
      this.emitStats();
      return;
    }

    switch (pickup.pickupType) {
      case 'oranBerry':
        this.player.heal(25);
        SoundManager.playPickupItem();
        this.showPickupNotification('+25 HP', 0x44ff44);
        break;

      case 'magnetBurst':
        SoundManager.playPickupItem();
        this.showPickupNotification('MAGNET BURST!', 0x44aaff);
        // Puxa todos os XP gems da tela
        this.xpGems.getChildren().forEach(child => {
          const gem = child as Phaser.Physics.Arcade.Sprite;
          if (gem.active) this.physics.moveToObject(gem, this.player, 600);
        });
        break;

      case 'rareCandy': {
        SoundManager.playPickupItem();
        this.showPickupNotification('RARE CANDY! +1 Level!', 0xFFD700);
        const leveled = this.player.addXp(this.player.stats.xpToNext);
        if (leveled) this.triggerLevelUp();
        break;
      }

      case 'pokeballBomb':
        this.showPickupNotification('POKÉBALL BOMB!', 0xff4444);
        SoundManager.playExplosion();
        this.cameras.main.shake(300, 0.01);
        this.enemyGroup.getChildren().forEach(child => {
          const enemy = child as Enemy;
          if (enemy.active) {
            const killed = enemy.takeDamage(999);
            if (killed) { this.onEnemyKilled(enemy); }
          }
        });
        break;

      case 'gachaBox':
        this.isPaused = true;
        this.physics.pause();
        this.events.emit('show-gacha');
        break;
    }

    if (pickup.pickupType !== 'gachaBox') {
      pickup.destroy();
    } else {
      pickup.destroy();
    }
    this.emitStats();
  }

  private showPickupNotification(text: string, color: number): void {
    const hexColor = `#${color.toString(16).padStart(6, '0')}`;
    const notif = this.add.text(this.player.x, this.player.y - 30, text, {
      fontSize: '14px', color: hexColor, fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: notif, y: notif.y - 40, alpha: 0, duration: 1200,
      onComplete: () => notif.destroy(),
    });
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

  private getCurrentWave(): WaveConfig { return WAVES[Math.min(this.difficultyLevel, WAVES.length - 1)]; }

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

  // ── Fire Hit Effect ──────────────────────────────────────────────────
  playFireHit(x: number, y: number): void {
    const hit = this.add.sprite(x, y, 'atk-fire-hit');
    hit.setScale(1.5).setDepth(10);
    hit.play('anim-fire-hit');
    hit.once('animationcomplete', () => hit.destroy());
  }

  // ── XP Gems ───────────────────────────────────────────────────────
  spawnXpGem(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const ox = Phaser.Math.Between(-8, 8);
      const oy = Phaser.Math.Between(-8, 8);
      const gem = this.xpGems.get(x + ox, y + oy, 'xp-gem') as Phaser.Physics.Arcade.Sprite | null;
      if (!gem) continue;
      gem.setActive(true).setVisible(true).setScale(1.2).setDepth(3);
      gem.setData('xpValue', 1);
      const body = gem.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(x + ox, y + oy);
      this.tweens.add({ targets: gem, y: gem.y - 10, scaleX: 1.5, scaleY: 1.5, duration: 150, yoyo: true, ease: 'Quad.Out' });
    }
  }

  // ── Level Up ──────────────────────────────────────────────────────
  private triggerLevelUp(): void {
    this.isPaused = true;
    this.physics.pause();

    // Verificar evolução do Pokémon
    const level = this.player.stats.level;
    const forms = this.starterConfig?.forms ?? [];
    const evolutionForm = forms.find(f => f.level === level && f.form !== 'base');
    if (evolutionForm && evolutionForm.form !== this.player.stats.form) {
      this.triggerEvolution(evolutionForm.form);
      return;
    }

    SoundManager.playLevelUp();
    const options = this.generateUpgradeOptions();
    this.events.emit('level-up', options, this.player.stats.level, this.getDisplayRerolls());
  }

  private triggerEvolution(targetForm: import('../types').PokemonForm): void {
    // Capturar nome anterior ANTES de evoluir
    const forms = this.starterConfig?.forms ?? [];
    const currentFormConfig = forms.find(f => f.form === this.player.stats.form);
    const prevName = currentFormConfig?.name ?? this.starterConfig?.name ?? '???';

    const formConfig = this.player.evolve(targetForm);
    if (!formConfig) {
      SoundManager.playLevelUp();
      const options = this.generateUpgradeOptions();
      this.events.emit('level-up', options, this.player.stats.level, this.getDisplayRerolls());
      return;
    }

    SoundManager.playEvolve();

    this.cameras.main.flash(800, 255, 255, 255);
    this.cameras.main.shake(500, 0.01);

    const px = this.player.x;
    const py = this.player.y;
    this.add.particles(px, py, 'fire-particle', {
      speed: { min: 40, max: 120 }, lifespan: 1000, quantity: 30,
      scale: { start: 2.5, end: 0 },
      tint: [0xFFFFFF, 0xFFDD44, 0xFF8800],
      emitting: false,
    }).explode();

    const name = formConfig.name;
    this.showPickupNotification(`${prevName} EVOLUIU PARA ${name.toUpperCase()}!`, 0xFFDD44);

    // Emite evento para UIScene mostrar overlay de evolução
    this.events.emit('pokemon-evolved', {
      fromName: prevName,
      toName: name,
      form: targetForm,
      newSlots: formConfig.maxAttackSlots,
    });

    // Após 1.5s, retomar jogo com level up normal
    this.time.delayedCall(1500, () => {
      SoundManager.playLevelUp();
      const options = this.generateUpgradeOptions();
      this.events.emit('level-up', options, this.player.stats.level, this.getDisplayRerolls());
    });
  }

  private resumeGame(): void { this.isPaused = false; this.physics.resume(); }

  private generateUpgradeOptions(): UpgradeOption[] {
    const pool: UpgradeOption[] = [];
    const playerForm = this.player.stats.form;
    const currentAttackCount = this.player.getAllAttacks().length;
    const maxSlots = this.player.stats.attackSlots;
    const hasRoom = currentAttackCount < maxSlots;

    // Evoluções de arma disponíveis (prioridade máxima)
    for (const evo of EVOLUTIONS) {
      const attack = this.player.getAttack(evo.baseAttack);
      if (!attack || attack.level < evo.requiredLevel) continue;
      if (!this.player.hasHeldItem(evo.requiredItem)) continue;
      if (!isFormUnlocked(playerForm, evo.requiredForm)) continue;
      if (this.player.hasAttack(evo.evolvedAttack)) continue;

      const evoDef = UPGRADE_DEFS[`evolve${evo.evolvedAttack.charAt(0).toUpperCase() + evo.evolvedAttack.slice(1)}` as keyof typeof UPGRADE_DEFS];
      if (evoDef) pool.push(evoDef);
    }

    // Novos ataques (só se tem slot livre e forma suficiente)
    if (hasRoom) {
      const newAttackMap: Partial<Record<AttackType, keyof typeof UPGRADE_DEFS>> = {
        ember: 'newEmber', scratch: 'newScratch', fireSpin: 'newFireSpin',
        smokescreen: 'newSmokescreen', dragonBreath: 'newDragonBreath',
        fireFang: 'newFireFang', flameCharge: 'newFlameCharge',
        slash: 'newSlash', flamethrower: 'newFlamethrower', dragonClaw: 'newDragonClaw',
        airSlash: 'newAirSlash', flareBlitz: 'newFlareBlitz',
        hurricane: 'newHurricane', outrage: 'newOutrage',
        heatWave: 'newHeatWave', dracoMeteor: 'newDracoMeteor',
      };
      for (const [atkKey, defKey] of Object.entries(newAttackMap)) {
        const atkType = atkKey as AttackType;
        const config = ATTACKS[atkType];
        if (!config) continue;
        // Forma suficiente?
        if (!isFormUnlocked(playerForm, config.minForm)) continue;
        // Já tem o ataque ou sua evolução?
        if (this.player.hasAttack(atkType)) continue;
        // Verificar se já tem a versão evoluída
        const evo = EVOLUTIONS.find(e => e.baseAttack === atkType);
        if (evo && this.player.hasAttack(evo.evolvedAttack)) continue;
        pool.push(UPGRADE_DEFS[defKey]);
      }
    }

    // Upgrades de ataques existentes (abaixo do nível máximo)
    const upgradeMap: Partial<Record<AttackType, keyof typeof UPGRADE_DEFS>> = {
      ember: 'upgradeEmber', scratch: 'upgradeScratch', fireSpin: 'upgradeFireSpin',
      smokescreen: 'upgradeSmokescreen', dragonBreath: 'upgradeDragonBreath',
      fireFang: 'upgradeFireFang', flameCharge: 'upgradeFlameCharge',
      slash: 'upgradeSlash', flamethrower: 'upgradeFlame', dragonClaw: 'upgradeDragonClaw',
      airSlash: 'upgradeAirSlash', flareBlitz: 'upgradeFlareBlitz',
      hurricane: 'upgradeHurricane', outrage: 'upgradeOutrage',
      heatWave: 'upgradeHeatWave', dracoMeteor: 'upgradeDracoMeteor',
    };
    for (const [atkKey, defKey] of Object.entries(upgradeMap)) {
      const atkType = atkKey as AttackType;
      const atk = this.player.getAttack(atkType);
      if (!atk) continue;
      const maxLevel = ATTACKS[atkType]?.maxLevel ?? 8;
      if (atk.level >= maxLevel) continue;
      // Não oferecer upgrade se já evoluiu para a forma evoluída
      const evo = EVOLUTIONS.find(e => e.baseAttack === atkType);
      if (evo && this.player.hasAttack(evo.evolvedAttack)) continue;
      pool.push(UPGRADE_DEFS[defKey]);
    }

    // Held Items (se não tem e tem slot de passiva livre)
    const heldItemCount = this.player.getHeldItems().length;
    const maxPassive = this.player.stats.passiveSlots;
    if (heldItemCount < maxPassive) {
      // Restrições de tipo: Dragon Fang só Charmeleon+, Sharp Beak só Charizard
      const itemFormReqs: Partial<Record<HeldItemType, PokemonForm>> = {
        dragonFang: 'stage1',
        sharpBeak: 'stage2',
      };
      const items: { key: HeldItemType; defKey: keyof typeof UPGRADE_DEFS }[] = [
        { key: 'charcoal', defKey: 'itemCharcoal' },
        { key: 'wideLens', defKey: 'itemWideLens' },
        { key: 'choiceSpecs', defKey: 'itemChoiceSpecs' },
        { key: 'dragonFang', defKey: 'itemDragonFang' },
        { key: 'sharpBeak', defKey: 'itemSharpBeak' },
        { key: 'scopeLens', defKey: 'itemScopeLens' },
        { key: 'razorClaw', defKey: 'itemRazorClaw' },
        { key: 'shellBell', defKey: 'itemShellBell' },
        { key: 'focusBand', defKey: 'itemFocusBand' },
      ];
      for (const { key, defKey } of items) {
        if (this.player.hasHeldItem(key)) continue;
        const formReq = itemFormReqs[key];
        if (formReq && !isFormUnlocked(playerForm, formReq)) continue;
        pool.push(UPGRADE_DEFS[defKey]);
      }
    }

    // Stats gerais (sempre disponíveis)
    pool.push(UPGRADE_DEFS.maxHpUp, UPGRADE_DEFS.speedUp, UPGRADE_DEFS.magnetUp);

    Phaser.Utils.Array.Shuffle(pool);

    // Garante que evoluções de arma apareçam quando disponíveis
    const evolutions = pool.filter(p => p.id.startsWith('evolve'));
    const nonEvolutions = pool.filter(p => !p.id.startsWith('evolve'));

    const result: UpgradeOption[] = [...evolutions, ...nonEvolutions];
    return result.slice(0, 3);
  }

  private applyUpgrade(upgradeId: string): void {
    switch (upgradeId) {
      // Novas armas
      case 'newFireSpin': {
        const fs = new FireSpin(this, this.player);
        this.player.addAttack('fireSpin', fs);
        this.setupFireSpinCollisions(fs);
        break;
      }
      case 'newFlamethrower': {
        const ft = new Flamethrower(this, this.player, this.enemyGroup);
        this.player.addAttack('flamethrower', ft);
        break;
      }
      case 'newScratch': {
        const s = new Scratch(this, this.player, this.enemyGroup);
        this.player.addAttack('scratch', s);
        break;
      }
      case 'newFireFang': {
        const ff = new FireFang(this, this.player, this.enemyGroup);
        this.player.addAttack('fireFang', ff);
        break;
      }
      case 'newDragonBreath': {
        const db = new DragonBreath(this, this.player, this.enemyGroup);
        this.player.addAttack('dragonBreath', db);
        break;
      }
      case 'newSmokescreen': {
        const ss = new Smokescreen(this, this.player, this.enemyGroup);
        this.player.addAttack('smokescreen', ss);
        break;
      }
      case 'newFlameCharge': {
        const fc = new FlameCharge(this, this.player, this.enemyGroup);
        this.player.addAttack('flameCharge', fc);
        break;
      }
      case 'newSlash': {
        const sl = new Slash(this, this.player, this.enemyGroup);
        this.player.addAttack('slash', sl);
        break;
      }
      case 'newDragonClaw': {
        const dc = new DragonClaw(this, this.player, this.enemyGroup);
        this.player.addAttack('dragonClaw', dc);
        break;
      }
      case 'newAirSlash': {
        const as2 = new AirSlash(this, this.player, this.enemyGroup);
        this.player.addAttack('airSlash', as2);
        break;
      }
      case 'newFlareBlitz': {
        const fb2 = new FlareBlitz(this, this.player, this.enemyGroup);
        this.player.addAttack('flareBlitz', fb2);
        break;
      }
      case 'newHurricane': {
        const hu = new Hurricane(this, this.player, this.enemyGroup);
        this.player.addAttack('hurricane', hu);
        break;
      }
      case 'newOutrage': {
        const ou = new Outrage(this, this.player, this.enemyGroup);
        this.player.addAttack('outrage', ou);
        break;
      }
      case 'newHeatWave': {
        const hw = new HeatWave(this, this.player, this.enemyGroup);
        this.player.addAttack('heatWave', hw);
        break;
      }
      case 'newDracoMeteor': {
        const dm = new DracoMeteor(this, this.player, this.enemyGroup);
        this.player.addAttack('dracoMeteor', dm);
        break;
      }

      // Upgrades
      case 'upgradeEmber': this.player.getAttack('ember')?.upgrade(); break;
      case 'upgradeFireSpin': this.player.getAttack('fireSpin')?.upgrade(); break;
      case 'upgradeFlame': this.player.getAttack('flamethrower')?.upgrade(); break;
      case 'upgradeScratch': this.player.getAttack('scratch')?.upgrade(); break;
      case 'upgradeFireFang': this.player.getAttack('fireFang')?.upgrade(); break;
      case 'upgradeDragonBreath': this.player.getAttack('dragonBreath')?.upgrade(); break;
      case 'upgradeSmokescreen': this.player.getAttack('smokescreen')?.upgrade(); break;
      case 'upgradeFlameCharge': this.player.getAttack('flameCharge')?.upgrade(); break;
      case 'upgradeSlash': this.player.getAttack('slash')?.upgrade(); break;
      case 'upgradeDragonClaw': this.player.getAttack('dragonClaw')?.upgrade(); break;
      case 'upgradeAirSlash': this.player.getAttack('airSlash')?.upgrade(); break;
      case 'upgradeFlareBlitz': this.player.getAttack('flareBlitz')?.upgrade(); break;
      case 'upgradeHurricane': this.player.getAttack('hurricane')?.upgrade(); break;
      case 'upgradeOutrage': this.player.getAttack('outrage')?.upgrade(); break;
      case 'upgradeHeatWave': this.player.getAttack('heatWave')?.upgrade(); break;
      case 'upgradeDracoMeteor': this.player.getAttack('dracoMeteor')?.upgrade(); break;

      // Stats
      case 'maxHpUp':
        this.player.stats.maxHp += 25;
        this.player.stats.hp = Math.min(this.player.stats.hp + 25, this.player.stats.maxHp);
        break;
      case 'speedUp':
        this.player.stats.speed = Math.floor(this.player.stats.speed * 1.15);
        break;
      case 'magnetUp':
        this.player.stats.magnetRange = Math.floor(this.player.stats.magnetRange * 1.4);
        break;

      // Held Items
      case 'itemCharcoal': this.player.addHeldItem('charcoal'); break;
      case 'itemWideLens': this.player.addHeldItem('wideLens'); break;
      case 'itemChoiceSpecs': this.player.addHeldItem('choiceSpecs'); break;
      case 'itemDragonFang': this.player.addHeldItem('dragonFang'); break;
      case 'itemSharpBeak': this.player.addHeldItem('sharpBeak'); break;
      case 'itemScopeLens': this.player.addHeldItem('scopeLens'); break;
      case 'itemRazorClaw': this.player.addHeldItem('razorClaw'); break;
      case 'itemShellBell': this.player.addHeldItem('shellBell'); break;
      case 'itemFocusBand': this.player.addHeldItem('focusBand'); break;

      // EVOLUÇÕES
      case 'evolveInferno': {
        this.removeAttackColliders('ember');
        this.player.removeAttack('ember');
        const inf = new Inferno(this, this.player, this.enemyGroup);
        this.player.addAttack('inferno', inf);
        this.setupInfernoCollisions(inf);
        SoundManager.playEvolve();
        this.showPickupNotification('EMBER EVOLUIU PARA INFERNO!', 0xff4400);
        this.cameras.main.flash(500, 255, 100, 0);
        break;
      }
      case 'evolveFireBlast': {
        this.removeAttackColliders('fireSpin');
        this.player.removeAttack('fireSpin');
        const fb = new FireBlast(this, this.player, this.enemyGroup);
        this.player.addAttack('fireBlast', fb);
        this.setupFireBlastCollisions(fb);
        SoundManager.playEvolve();
        this.showPickupNotification('FIRE SPIN EVOLUIU PARA FIRE BLAST!', 0xff8800);
        this.cameras.main.flash(500, 255, 150, 0);
        break;
      }
      case 'evolveBlastBurn': {
        this.player.removeAttack('flamethrower');
        const bb = new BlastBurn(this, this.player, this.enemyGroup);
        this.player.addAttack('blastBurn', bb);
        SoundManager.playEvolve();
        this.showPickupNotification('FLAMETHROWER EVOLUIU PARA BLAST BURN!', 0xff0000);
        this.cameras.main.flash(500, 255, 50, 0);
        break;
      }
      case 'evolveFurySwipes': {
        this.player.removeAttack('scratch');
        const fs2 = new FurySwipes(this, this.player, this.enemyGroup);
        this.player.addAttack('furySwipes', fs2);
        SoundManager.playEvolve();
        this.showPickupNotification('SCRATCH EVOLUIU PARA FURY SWIPES!', 0xcccccc);
        this.cameras.main.flash(500, 200, 200, 200);
        break;
      }
      case 'evolveBlazeKick': {
        this.player.removeAttack('fireFang');
        const bk = new BlazeKick(this, this.player, this.enemyGroup);
        this.player.addAttack('blazeKick', bk);
        SoundManager.playEvolve();
        this.showPickupNotification('FIRE FANG EVOLUIU PARA BLAZE KICK!', 0xff6600);
        this.cameras.main.flash(500, 255, 100, 0);
        break;
      }
      case 'evolveFlareRush': {
        this.player.removeAttack('flameCharge');
        const fr = new FlareRush(this, this.player, this.enemyGroup);
        this.player.addAttack('flareRush', fr);
        SoundManager.playEvolve();
        this.showPickupNotification('FLAME CHARGE EVOLUIU PARA FLARE RUSH!', 0xff4400);
        this.cameras.main.flash(500, 255, 80, 0);
        break;
      }
      case 'evolveDragonPulse': {
        this.player.removeAttack('dragonBreath');
        const dp = new DragonPulse(this, this.player, this.enemyGroup);
        this.player.addAttack('dragonPulse', dp);
        SoundManager.playEvolve();
        this.showPickupNotification('DRAGON BREATH EVOLUIU PARA DRAGON PULSE!', 0x7744ff);
        this.cameras.main.flash(500, 120, 70, 255);
        break;
      }
      case 'evolveNightSlash': {
        this.player.removeAttack('slash');
        const ns = new NightSlash(this, this.player, this.enemyGroup);
        this.player.addAttack('nightSlash', ns);
        SoundManager.playEvolve();
        this.showPickupNotification('SLASH EVOLUIU PARA NIGHT SLASH!', 0x444466);
        this.cameras.main.flash(500, 70, 70, 100);
        break;
      }
      case 'evolveDragonRush': {
        this.player.removeAttack('dragonClaw');
        const dr = new DragonRush(this, this.player, this.enemyGroup);
        this.player.addAttack('dragonRush', dr);
        SoundManager.playEvolve();
        this.showPickupNotification('DRAGON CLAW EVOLUIU PARA DRAGON RUSH!', 0x7744ff);
        this.cameras.main.flash(500, 120, 70, 255);
        break;
      }
      case 'evolveAerialAce': {
        this.player.removeAttack('airSlash');
        const aa = new AerialAce(this, this.player, this.enemyGroup);
        this.player.addAttack('aerialAce', aa);
        SoundManager.playEvolve();
        this.showPickupNotification('AIR SLASH EVOLUIU PARA AERIAL ACE!', 0x88ccff);
        this.cameras.main.flash(500, 140, 200, 255);
        break;
      }
    }
    this.emitStats();
  }

  // ── Enemy kill handler (checks boss drops) ──────────────────────
  private onEnemyKilled(enemy: Enemy): void {
    this.player.stats.kills++;
    this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue);

    // Boss drop: gacha box
    if (enemy instanceof Boss) {
      this.spawnPickup(enemy.x, enemy.y, 'gachaBox');
      this.events.emit('boss-killed', enemy.name);
    }
  }

  // ── Gacha reward application ──────────────────────────────────────
  private applyGachaReward(rewardType: string): void {
    switch (rewardType) {
      case 'skillUpgrade': {
        const attacks = this.player.getAllAttacks();
        if (attacks.length > 0) {
          const atk = attacks[Phaser.Math.Between(0, attacks.length - 1)];
          const config = ATTACKS[atk.type];
          if (config && atk.level < config.maxLevel) {
            atk.upgrade();
            this.showPickupNotification(`${config.name} +1!`, 0x44ff44);
          } else {
            // Fallback: heal
            this.player.heal(50);
            this.showPickupNotification('+50 HP', 0x44ff44);
          }
        }
        break;
      }
      case 'heldItem':
        this.dropHeldItem(this.player.x, this.player.y - 20);
        break;
      case 'rareCandy': {
        this.showPickupNotification('RARE CANDY! +1 Level!', 0xFFD700);
        const leveled = this.player.addXp(this.player.stats.xpToNext);
        if (leveled) this.triggerLevelUp();
        break;
      }
      case 'evolutionStone':
        // Evolui arma aleatória elegível
        this.showPickupNotification('EVOLUTION STONE!', 0xff8800);
        // Para simplicidade: dá +2 levels a um ataque
        {
          const attacks = this.player.getAllAttacks();
          if (attacks.length > 0) {
            const atk = attacks[Phaser.Math.Between(0, attacks.length - 1)];
            atk.upgrade();
            atk.upgrade();
            this.showPickupNotification(`${atk.type} +2!`, 0xff8800);
          }
        }
        break;
      case 'maxRevive':
        this.player.stats.hp = this.player.stats.maxHp;
        this.showPickupNotification('MAX REVIVE! HP CHEIO!', 0xff44ff);
        break;
    }
    this.emitStats();
  }

  // ── Boss spawning ─────────────────────────────────────────────────
  private spawnBoss(type: import('../types').EnemyType): void {
    if (this.isPaused) return;
    const config = ENEMIES[type];
    if (!config) return;

    // Aviso para UIScene
    this.events.emit('boss-warning', config.name);
    SoundManager.playBossWarning();

    // Após 3s: spawna o boss
    this.time.delayedCall(3000, () => {
      const pos = this.getSpawnPosition();
      const boss = new Boss(this, pos.x, pos.y, config as BossConfig);
      this.enemyGroup.add(boss);
      SoundManager.playBossSpawn();

      // Emitir HP bar para UIScene
      this.events.emit('boss-spawned', {
        name: config.name,
        hp: config.hp,
        maxHp: config.hp,
        boss,
      });
    });
  }

  // ── Boss attacks ──────────────────────────────────────────────────
  private executeBossAttack(boss: Boss, attack: BossAttackConfig): void {
    const playerX = this.player.x;
    const playerY = this.player.y;

    switch (attack.pattern) {
      case 'charge': {
        // Hyper Fang: dash na direção do player + bite animation
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);
        const speed = 400;
        boss.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        boss.setTint(0xff4444);

        // Bite sprite follows boss during charge
        const bite = this.add.sprite(boss.x, boss.y, 'atk-bite').setScale(2).setDepth(12);
        bite.setRotation(angle);
        bite.play('anim-bite');
        bite.once('animationcomplete', () => bite.destroy());

        // Update bite position during charge
        const updateBite = this.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            if (boss.active && bite.active) {
              bite.setPosition(boss.x + Math.cos(angle) * 20, boss.y + Math.sin(angle) * 20);
            }
          },
        });

        this.time.delayedCall(500, () => {
          updateBite.destroy();
          if (bite.active) bite.destroy();
          if (boss.active) { boss.clearTint(); boss.setVelocity(0, 0); }
        });
        break;
      }

      case 'fan': {
        // Poison Sting: projéteis venoshock em leque
        const count = attack.projectileCount ?? 3;
        const spreadAngle = 30 * (Math.PI / 180);
        const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, playerX, playerY);

        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spreadAngle;
          const angle = baseAngle + offset;

          const proj = this.enemyProjectiles.get(boss.x, boss.y, 'atk-venoshock') as Phaser.Physics.Arcade.Sprite | null;
          if (!proj) continue;

          proj.setActive(true).setVisible(true).setScale(1.2).setDepth(7);
          proj.setData('damage', attack.damage);
          proj.setData('homing', false);
          proj.setData('speed', 140);
          proj.setTint(0xaa44ff);
          proj.setRotation(angle);

          if (this.anims.exists('anim-venoshock')) {
            proj.play('anim-venoshock');
          }

          const body = proj.body as Phaser.Physics.Arcade.Body;
          body.enable = true;
          body.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);

          this.time.delayedCall(5000, () => {
            if (proj.active) {
              this.enemyProjectiles.killAndHide(proj);
              body.enable = false;
            }
          });
        }
        break;
      }

      case 'aoe-tremor': {
        // Thrash: AoE tremor com animação
        const radius = attack.aoeRadius ?? 150;
        boss.setTint(0xff8800);
        this.cameras.main.shake(400, 0.008);
        SoundManager.playBossLand();

        // Thrash sprite animation on boss
        const thrash = this.add.sprite(boss.x, boss.y, 'atk-thrash').setScale(3).setDepth(12);
        thrash.play('anim-thrash');
        thrash.once('animationcomplete', () => thrash.destroy());

        // Expanding AoE circle
        const circle = this.add.circle(boss.x, boss.y, 0, 0xff4400, 0.3).setDepth(3);
        this.tweens.add({
          targets: circle,
          radius: { from: 0, to: radius },
          alpha: { from: 0.4, to: 0 },
          duration: 600,
          onComplete: () => circle.destroy(),
        });

        // Damage check
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, playerX, playerY);
        if (dist < radius) {
          this.player.takeDamage(attack.damage, this.time.now);
          this.emitStats();
          if (this.player.isDead()) this.gameOver();
        }

        this.time.delayedCall(300, () => { if (boss.active) boss.clearTint(); });
        break;
      }

      case 'aoe-land': {
        // Body Slam: pula e aterrissa com stomp animation
        const radius = attack.aoeRadius ?? 180;
        boss.setTint(0xffdd00);

        this.tweens.add({
          targets: boss,
          y: boss.y - 80,
          duration: 400,
          ease: 'Quad.Out',
          yoyo: true,
          onComplete: () => {
            if (!boss.active) return;
            boss.clearTint();
            SoundManager.playBossLand();
            this.cameras.main.shake(500, 0.012);

            // Stomp impact animation
            const stomp = this.add.sprite(boss.x, boss.y, 'atk-stomp').setScale(6).setDepth(12);
            stomp.play('anim-stomp');
            stomp.once('animationcomplete', () => stomp.destroy());

            // Expanding AoE circle
            const circle = this.add.circle(boss.x, boss.y, 0, 0xffaa00, 0.3).setDepth(3);
            this.tweens.add({
              targets: circle,
              radius: { from: 0, to: radius },
              alpha: { from: 0.5, to: 0 },
              duration: 500,
              onComplete: () => circle.destroy(),
            });

            const dist = Phaser.Math.Distance.Between(boss.x, boss.y, playerX, playerY);
            if (dist < radius) {
              this.player.takeDamage(attack.damage, this.time.now);
              this.emitStats();
              if (this.player.isDead()) this.gameOver();
            }
          },
        });
        break;
      }
    }
  }

  // ── Debug Mode ──────────────────────────────────────────────────────
  private showDebugMenu(): void {
    const { width, height } = this.cameras.main;

    // Container no world space (segue câmera)
    const overlay = this.add.container(0, 0).setDepth(1000).setScrollFactor(0);

    // Fundo escuro
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
      .setScrollFactor(0);
    bg.setInteractive();
    overlay.add(bg);

    // Título
    overlay.add(this.add.text(width / 2, 40, 'DEBUGGER - CENARIOS', {
      fontSize: '20px', color: '#44aaff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0));

    overlay.add(this.add.text(width / 2, 65, 'Selecione um cenário de teste', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0));

    // ── Lista de cenários ────────────────────────────────────────────
    const scenarios: { name: string; desc: string; color: number; key: string }[] = [
      { name: 'Evolucao de Ataques', desc: 'Charmeleon Lv16, todos ataques Lv8, held items, XP pronto', color: 0xff8800, key: 'attackEvolution' },
      { name: 'Evolucao Charmeleon', desc: 'Charmander Lv15, XP quase cheio -> evolui ao pegar XP', color: 0xffdd44, key: 'evoCharmeleon' },
      { name: 'Evolucao Charizard', desc: 'Charmeleon Lv35, XP quase cheio -> evolui para Charizard', color: 0xff4400, key: 'evoCharizard' },
      { name: 'Boss Fight', desc: 'Lv10 com 3 ataques, Raticate spawna imediatamente', color: 0xff2222, key: 'bossFight' },
      { name: 'Gacha Box', desc: 'Boss com 1 HP -> dropa gacha box instantaneamente', color: 0xffaa00, key: 'gachaBox' },
      { name: 'Todos os Inimigos', desc: 'Spawna 1 de cada inimigo + boss em circulo', color: 0x44ff44, key: 'allEnemies' },
    ];

    const startY = 100;
    const itemH = 55;
    scenarios.forEach((sc, i) => {
      const y = startY + i * itemH;
      const btnGfx = this.add.graphics().setScrollFactor(0);

      const drawBtn = (hover: boolean): void => {
        btnGfx.clear();
        btnGfx.fillStyle(hover ? 0x1e1e44 : 0x111133, 0.95);
        btnGfx.fillRoundedRect(width / 2 - 220, y, 440, itemH - 8, 8);
        btnGfx.lineStyle(1, hover ? sc.color : 0x333366, hover ? 1 : 0.5);
        btnGfx.strokeRoundedRect(width / 2 - 220, y, 440, itemH - 8, 8);
        // Barra lateral colorida
        btnGfx.fillStyle(sc.color, hover ? 0.8 : 0.4);
        btnGfx.fillRect(width / 2 - 220, y + 4, 4, itemH - 16);
      };
      drawBtn(false);
      overlay.add(btnGfx);

      overlay.add(this.add.text(width / 2 - 205, y + 10, sc.name.toUpperCase(), {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setScrollFactor(0));

      overlay.add(this.add.text(width / 2 - 205, y + 28, sc.desc, {
        fontSize: '10px', color: '#888888', fontFamily: 'monospace',
      }).setScrollFactor(0));

      const hitbox = this.add.rectangle(width / 2, y + (itemH - 8) / 2, 440, itemH - 8, 0xffffff, 0)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0);
      hitbox.on('pointerover', () => drawBtn(true));
      hitbox.on('pointerout', () => drawBtn(false));
      hitbox.on('pointerdown', () => {
        SoundManager.playStart();
        overlay.destroy(true);
        this.setupDebugScenario(sc.key);
      });
      overlay.add(hitbox);
    });

    // Botão voltar
    const backBtn = this.add.text(width / 2, startY + scenarios.length * itemH + 15, 'Voltar ao Menu', {
      fontSize: '12px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#666666'));
    backBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.scene.stop('UIScene');
      this.scene.start('SelectScene');
    });
    overlay.add(backBtn);
  }

  private setupDebugScenario(key: string): void {
    const p = this.player;

    switch (key) {
      case 'attackEvolution': {
        // Charmeleon Lv16, todos ataques Lv8, held items, XP quase cheio
        p.stats.level = 16;
        p.stats.form = 'stage1';
        p.evolve('stage1');
        p.stats.hp = p.stats.maxHp;

        // Adicionar ataques e upar para Lv8
        const attacksToAdd: { type: import('../types').AttackType; create: () => import('../types').Attack }[] = [
          { type: 'fireSpin', create: () => new FireSpin(this, p) },
        ];
        for (const atk of attacksToAdd) {
          const instance = atk.create();
          p.addAttack(atk.type, instance);
          if (atk.type === 'fireSpin') this.setupFireSpinCollisions(instance as FireSpin);
          for (let i = 0; i < 7; i++) instance.upgrade();
        }
        // Upgrade ember existente para Lv8
        const ember = p.getAttack('ember');
        if (ember) { for (let i = 0; i < 7; i++) ember.upgrade(); }

        // Held items
        p.addHeldItem('charcoal');
        p.addHeldItem('wideLens');
        p.addHeldItem('scopeLens');
        p.addHeldItem('razorClaw');

        // XP quase cheio -> próximo XP = level up com evoluções
        p.stats.xp = p.stats.xpToNext - 1;

        // Spawna 1 XP gem perto
        this.time.delayedCall(500, () => {
          this.spawnXpGem(p.x + 60, p.y, 5);
        });
        break;
      }

      case 'evoCharmeleon': {
        // Charmander Lv15, XP quase cheio -> evolui para Charmeleon
        p.stats.level = 15;
        p.stats.xp = p.stats.xpToNext - 1;

        this.time.delayedCall(500, () => {
          this.spawnXpGem(p.x + 60, p.y, 5);
        });
        break;
      }

      case 'evoCharizard': {
        // Charmeleon Lv35, XP quase cheio -> evolui para Charizard
        p.stats.level = 35;
        p.stats.form = 'stage1';
        p.evolve('stage1');
        p.stats.hp = p.stats.maxHp;
        p.stats.xp = p.stats.xpToNext - 1;

        this.time.delayedCall(500, () => {
          this.spawnXpGem(p.x + 60, p.y, 5);
        });
        break;
      }

      case 'bossFight': {
        // Lv10 com 3 ataques, Raticate spawna imediatamente
        p.stats.level = 10;
        p.stats.hp = p.stats.maxHp;

        const fs = new FireSpin(this, p);
        p.addAttack('fireSpin', fs);
        this.setupFireSpinCollisions(fs);
        for (let i = 0; i < 4; i++) fs.upgrade();

        const emberAtk = p.getAttack('ember');
        if (emberAtk) { for (let i = 0; i < 4; i++) emberAtk.upgrade(); }

        // Spawnar boss imediatamente (sem delay de warning)
        this.time.delayedCall(500, () => {
          this.spawnBoss('raticate');
        });
        break;
      }

      case 'gachaBox': {
        // Boss com 1 HP -> dropa gacha box instantaneamente
        p.stats.level = 10;
        p.stats.hp = p.stats.maxHp;

        const emberAtk2 = p.getAttack('ember');
        if (emberAtk2) { for (let i = 0; i < 7; i++) emberAtk2.upgrade(); }

        // Spawnar boss fraco (override HP after spawn)
        this.time.delayedCall(500, () => {
          const config = ENEMIES['raticate'] as BossConfig;
          if (!config) return;
          const pos = { x: p.x + 100, y: p.y };
          const boss = new Boss(this, pos.x, pos.y, config);
          this.enemyGroup.add(boss);
          // Reduzir HP para 1 para morrer ao primeiro hit
          boss.takeDamage(config.hp - 1);
          this.events.emit('boss-spawned', {
            name: config.name, hp: 1, maxHp: config.hp, boss,
          });
        });
        break;
      }

      case 'allEnemies': {
        // Spawna 1 de cada tipo de inimigo em círculo ao redor do player
        p.stats.level = 10;
        p.stats.hp = 999;
        p.stats.maxHp = 999;

        const enemyTypes: import('../types').EnemyType[] = [
          'rattata', 'pidgey', 'zubat', 'geodude', 'gastly', 'caterpie', 'weedle',
          'spearow', 'ekans', 'oddish', 'mankey', 'haunter', 'machop', 'golbat',
        ];
        const radius = 200;
        const angleStep = (Math.PI * 2) / enemyTypes.length;

        enemyTypes.forEach((type, i) => {
          const config = ENEMIES[type];
          if (!config) return;
          const ex = p.x + Math.cos(angleStep * i) * radius;
          const ey = p.y + Math.sin(angleStep * i) * radius;
          const enemy = new Enemy(this, ex, ey, config);
          this.enemyGroup.add(enemy);
        });

        // Bosses em círculo maior
        const bossTypes: import('../types').EnemyType[] = ['raticate', 'arbok', 'nidoking', 'snorlax'];
        const bossRadius = 350;
        const bossAngleStep = (Math.PI * 2) / bossTypes.length;
        bossTypes.forEach((type, i) => {
          const config = ENEMIES[type] as BossConfig;
          if (!config) return;
          const bx = p.x + Math.cos(bossAngleStep * i) * bossRadius;
          const by = p.y + Math.sin(bossAngleStep * i) * bossRadius;
          const boss = new Boss(this, bx, by, config);
          this.enemyGroup.add(boss);
        });
        break;
      }
    }

    // Resumir o jogo após setup
    this.isPaused = false;
    this.physics.resume();
    this.emitStats();

    // HUD de debug com botão de level up
    this.addDebugHUD();
  }

  private getDisplayRerolls(): number {
    return this.debugMode ? 99 : this.player.stats.rerolls;
  }

  private addDebugHUD(): void {
    const { width } = this.cameras.main;
    const btnX = width - 70;
    const btnY = 25;
    const btnW = 110;
    const btnH = 28;

    const btnGfx = this.add.graphics().setScrollFactor(0).setDepth(500);
    const drawBtn = (hover: boolean): void => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? 0x44bb44 : 0x228822, 0.85);
      btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
      btnGfx.lineStyle(1, hover ? 0x66dd66 : 0x33aa33);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
    };
    drawBtn(false);

    this.add.text(btnX, btnY, 'LEVEL UP', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    const hitbox = this.add.rectangle(btnX, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(502);
    hitbox.on('pointerover', () => drawBtn(true));
    hitbox.on('pointerout', () => drawBtn(false));
    hitbox.on('pointerdown', () => {
      if (this.isPaused) return;
      SoundManager.playClick();
      const needed = this.player.stats.xpToNext - this.player.stats.xp;
      const leveled = this.player.addXp(needed);
      if (leveled) this.triggerLevelUp();
    });
  }

  private gameOver(): void {
    this.isPaused = true;
    this.physics.pause();
    SoundManager.playGameOver();
    this.events.emit('game-over', {
      level: this.player.stats.level,
      kills: this.player.stats.kills,
      time: Math.floor(this.gameTime / 1000),
    });
  }

  private emitStats(): void {
    this.events.emit('stats-update', {
      ...this.player.stats,
      time: Math.floor(this.gameTime / 1000),
      heldItems: this.player.getHeldItems(),
      attacks: this.player.getAllAttacks().map(a => ({ type: a.type, level: a.level })),
    });
  }
}
