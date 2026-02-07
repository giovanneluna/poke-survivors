import Phaser from 'phaser';
import { GAME, ENEMIES, WAVES, SPAWN, XP_GEM, UPGRADE_DEFS, DESTRUCTIBLES, EVOLUTIONS, ATTACKS, CHARMANDER_FORMS } from '../config';
import type { EnemyConfig, WaveConfig, UpgradeOption, PickupType, HeldItemType, DestructibleType, AttackType } from '../types';
import { isFormUnlocked } from '../types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
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

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Reset de estado (Phaser reutiliza a mesma instância da Scene)
    this.isPaused = false;
    this.gameTime = 0;
    this.difficultyLevel = 0;

    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.generateWorld();

    // ── Player ─────────────────────────────────────────────────────
    this.player = new Player(this, GAME.worldWidth / 2, GAME.worldHeight / 2);

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

    // ── Spawn de inimigos ──────────────────────────────────────────
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

    // ── Colisões ───────────────────────────────────────────────────
    this.setupCollisions();

    // ── Escuta upgrade selecionado ─────────────────────────────────
    this.events.on('upgrade-selected', (upgradeId: string) => {
      this.applyUpgrade(upgradeId);
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
    this.player.handleMovement(time);
    this.player.updateAttacks(time, delta);

    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);

    // Inimigos: mover + ataques ranged
    this.enemyGroup.getChildren().forEach(child => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      enemy.moveToward(playerPos);
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist > SPAWN.despawnDistance) { enemy.cleanup(); return; }

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

    proj.setActive(true).setVisible(true).setScale(0.6).setDepth(7);
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
    // Inimigo → jogador (corpo-a-corpo)
    this.physics.add.overlap(
      this.player as Phaser.GameObjects.GameObject, this.enemyGroup,
      (_player, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.active) {
          const took = this.player.takeDamage(enemy.damage, this.time.now);
          if (took) {
            SoundManager.playPlayerHit();
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
    this.physics.add.overlap(ember.getBullets(), this.enemyGroup, (bulletObj, enemyObj) => {
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
      if (killed) { SoundManager.playEnemyDeath(); this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); }
    });

    // Ember vs destructibles
    this.physics.add.overlap(ember.getBullets(), this.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      ember.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(ember.getDamage());
      if (destroyed) this.onDestructibleDestroyed(dest);
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
      this.playFireHit(enemy.x, enemy.y);
      const killed = enemy.takeDamage(fireSpin.getDamage());
      if (killed) { this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); hitCooldowns.delete(enemyId); }
    });

    // FireSpin vs destructibles
    this.physics.add.overlap(fireSpin.getOrbs(), this.destructibles, (_orbObj, destObj) => {
      const dest = destObj as Destructible;
      if (!dest.active) return;
      const destroyed = dest.takeDamage(1);
      if (destroyed) this.onDestructibleDestroyed(dest);
    });
  }

  setupInfernoCollisions(inferno: Inferno): void {
    this.physics.add.overlap(inferno.getBullets(), this.enemyGroup, (bulletObj, enemyObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active) return;
      inferno.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const killed = enemy.takeDamage(inferno.getDamage());
      if (killed) { this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); }
      // EXPLOSÃO AoE
      inferno.explodeAt(enemy.x, enemy.y);
    });

    this.physics.add.overlap(inferno.getBullets(), this.destructibles, (bulletObj, destObj) => {
      const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
      const dest = destObj as Destructible;
      if (!bullet.active || !dest.active) return;
      inferno.getBullets().killAndHide(bullet);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.checkCollision.none = true; body.enable = false;
      const destroyed = dest.takeDamage(inferno.getDamage());
      if (destroyed) this.onDestructibleDestroyed(dest);
    });
  }

  setupFireBlastCollisions(fireBlast: FireBlast): void {
    const hitCooldowns = new Map<number, number>();
    this.physics.add.overlap(fireBlast.getOrbs(), this.enemyGroup, (_orbObj, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return;
      const enemyId = enemy.x * 10000 + enemy.y;
      const lastHit = hitCooldowns.get(enemyId) ?? 0;
      if (this.time.now - lastHit < 300) return;
      hitCooldowns.set(enemyId, this.time.now);
      this.playFireHit(enemy.x, enemy.y);
      const killed = enemy.takeDamage(fireBlast.getDamage());
      if (killed) { this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); hitCooldowns.delete(enemyId); }
    });

    this.physics.add.overlap(fireBlast.getOrbs(), this.destructibles, (_orbObj, destObj) => {
      const dest = destObj as Destructible;
      if (!dest.active) return;
      const destroyed = dest.takeDamage(2);
      if (destroyed) this.onDestructibleDestroyed(dest);
    });
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
            if (killed) { this.player.stats.kills++; this.spawnXpGem(enemy.x, enemy.y, enemy.xpValue); }
          }
        });
        break;
    }

    pickup.destroy();
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
    const evolutionForm = CHARMANDER_FORMS.find(f => f.level === level && f.form !== 'base');
    if (evolutionForm && evolutionForm.form !== this.player.stats.form) {
      this.triggerEvolution(evolutionForm.form);
      return;
    }

    SoundManager.playLevelUp();
    const options = this.generateUpgradeOptions();
    this.events.emit('level-up', options, this.player.stats.level);
  }

  private triggerEvolution(targetForm: import('../types').PokemonForm): void {
    const formConfig = this.player.evolve(targetForm);
    if (!formConfig) {
      // Fallback: se evolução falhar, faz level up normal
      SoundManager.playLevelUp();
      const options = this.generateUpgradeOptions();
      this.events.emit('level-up', options, this.player.stats.level);
      return;
    }

    SoundManager.playEvolve();

    // Flash de tela branca
    this.cameras.main.flash(800, 255, 255, 255);
    this.cameras.main.shake(500, 0.01);

    // Partículas de evolução
    const px = this.player.x;
    const py = this.player.y;
    this.add.particles(px, py, 'fire-particle', {
      speed: { min: 40, max: 120 }, lifespan: 1000, quantity: 30,
      scale: { start: 2.5, end: 0 },
      tint: [0xFFFFFF, 0xFFDD44, 0xFF8800],
      emitting: false,
    }).explode();

    // Notificação de evolução
    const name = formConfig.name;
    const prevName = targetForm === 'stage1' ? 'Charmander' : 'Charmeleon';
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
      this.events.emit('level-up', options, this.player.stats.level);
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
        if (!this.player.hasHeldItem(key)) pool.push(UPGRADE_DEFS[defKey]);
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
