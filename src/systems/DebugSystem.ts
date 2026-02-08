import { ENEMIES } from '../config';
import type { BossConfig, EnemyType } from '../types';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';
import type { AttackFactory } from './AttackFactory';
import type { UpgradeSystem } from './UpgradeSystem';
import type { SpawnSystem } from './SpawnSystem';
import type { PickupSystem } from './PickupSystem';

export class DebugSystem {
  constructor(
    private readonly ctx: GameContext,
    private readonly attackFactory: AttackFactory,
    private readonly upgradeSystem: UpgradeSystem,
    private readonly spawnSystem: SpawnSystem,
    private readonly pickupSystem: PickupSystem,
  ) {}

  showMenu(): void {
    const scene = this.ctx.scene;
    const { width, height } = scene.cameras.main;

    const overlay = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);

    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
      .setScrollFactor(0);
    bg.setInteractive();
    overlay.add(bg);

    overlay.add(scene.add.text(width / 2, 40, 'DEBUGGER - CENARIOS', {
      fontSize: '20px', color: '#44aaff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0));

    overlay.add(scene.add.text(width / 2, 65, 'Selecione um cenário de teste', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0));

    const scenarios: { name: string; desc: string; color: number; key: string }[] = [
      { name: 'Evolucao de Ataques', desc: 'Charmeleon Lv16, todos ataques Lv8, held items, XP pronto', color: 0xff8800, key: 'attackEvolution' },
      { name: 'Evolucao Charmeleon', desc: 'Charmander Lv15, XP quase cheio -> evolui ao pegar XP', color: 0xffdd44, key: 'evoCharmeleon' },
      { name: 'Evolucao Charizard', desc: 'Charmeleon Lv35, XP quase cheio -> evolui para Charizard', color: 0xff4400, key: 'evoCharizard' },
      { name: 'Boss Fight', desc: 'Lv10 com 3 ataques, Raticate spawna imediatamente', color: 0xff2222, key: 'bossFight' },
      { name: 'Gacha Box', desc: 'Boss com 1 HP -> dropa gacha box instantaneamente', color: 0xffaa00, key: 'gachaBox' },
      { name: 'Todos os Inimigos', desc: 'Spawna 1 de cada inimigo + boss em circulo', color: 0x44ff44, key: 'allEnemies' },
      { name: 'Phase 2 Test', desc: 'Metapod, Gloom healer, Venonat confusion, Cubone boomerang', color: 0x66ddaa, key: 'phase2Test' },
      { name: 'Phase 3 Test', desc: 'Parasect slow aura, Hypno homing stun, Marowak bone', color: 0xdd66aa, key: 'phase3Test' },
      { name: 'Phase 4 Test', desc: 'Alakazam teleport, Electrode explode, boss Gengar', color: 0xaa44ff, key: 'phase4Test' },
      { name: 'Boss Rush', desc: 'Todos os 8 bosses em sequencia rapida', color: 0xff4444, key: 'bossRush' },
    ];

    const startY = 100;
    const itemH = 55;
    scenarios.forEach((sc, i) => {
      const y = startY + i * itemH;
      const btnGfx = scene.add.graphics().setScrollFactor(0);

      const drawBtn = (hover: boolean): void => {
        btnGfx.clear();
        btnGfx.fillStyle(hover ? 0x1e1e44 : 0x111133, 0.95);
        btnGfx.fillRoundedRect(width / 2 - 220, y, 440, itemH - 8, 8);
        btnGfx.lineStyle(1, hover ? sc.color : 0x333366, hover ? 1 : 0.5);
        btnGfx.strokeRoundedRect(width / 2 - 220, y, 440, itemH - 8, 8);
        btnGfx.fillStyle(sc.color, hover ? 0.8 : 0.4);
        btnGfx.fillRect(width / 2 - 220, y + 4, 4, itemH - 16);
      };
      drawBtn(false);
      overlay.add(btnGfx);

      overlay.add(scene.add.text(width / 2 - 205, y + 10, sc.name.toUpperCase(), {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setScrollFactor(0));

      overlay.add(scene.add.text(width / 2 - 205, y + 28, sc.desc, {
        fontSize: '10px', color: '#888888', fontFamily: 'monospace',
      }).setScrollFactor(0));

      const hitbox = scene.add.rectangle(width / 2, y + (itemH - 8) / 2, 440, itemH - 8, 0xffffff, 0)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0);
      hitbox.on('pointerover', () => drawBtn(true));
      hitbox.on('pointerout', () => drawBtn(false));
      hitbox.on('pointerdown', () => {
        SoundManager.playStart();
        overlay.destroy(true);
        this.setupScenario(sc.key);
      });
      overlay.add(hitbox);
    });

    const backBtn = scene.add.text(width / 2, startY + scenarios.length * itemH + 15, 'Voltar ao Menu', {
      fontSize: '12px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#666666'));
    backBtn.on('pointerdown', () => {
      SoundManager.playClick();
      scene.scene.stop('UIScene');
      scene.scene.start('SelectScene');
    });
    overlay.add(backBtn);
  }

  private setupScenario(key: string): void {
    const scene = this.ctx.scene;
    const p = this.ctx.player;

    switch (key) {
      case 'attackEvolution': {
        p.stats.level = 16;
        p.stats.form = 'stage1';
        p.evolve('stage1');
        p.stats.hp = p.stats.maxHp;

        const fsAttack = this.attackFactory.createAttack('fireSpin');
        for (let i = 0; i < 7; i++) fsAttack.upgrade();

        const ember = p.getAttack('ember');
        if (ember) { for (let i = 0; i < 7; i++) ember.upgrade(); }

        p.addHeldItem('charcoal');
        p.addHeldItem('wideLens');
        p.addHeldItem('scopeLens');
        p.addHeldItem('razorClaw');

        p.stats.xp = p.stats.xpToNext - 1;

        scene.time.delayedCall(500, () => {
          this.pickupSystem.spawnXpGem(p.x + 60, p.y, 5);
        });
        break;
      }

      case 'evoCharmeleon': {
        p.stats.level = 15;
        p.stats.xp = p.stats.xpToNext - 1;

        scene.time.delayedCall(500, () => {
          this.pickupSystem.spawnXpGem(p.x + 60, p.y, 5);
        });
        break;
      }

      case 'evoCharizard': {
        p.stats.level = 35;
        p.stats.form = 'stage1';
        p.evolve('stage1');
        p.stats.hp = p.stats.maxHp;
        p.stats.xp = p.stats.xpToNext - 1;

        scene.time.delayedCall(500, () => {
          this.pickupSystem.spawnXpGem(p.x + 60, p.y, 5);
        });
        break;
      }

      case 'bossFight': {
        p.stats.level = 10;
        p.stats.hp = p.stats.maxHp;

        const fs = this.attackFactory.createAttack('fireSpin');
        for (let i = 0; i < 4; i++) fs.upgrade();

        const emberAtk = p.getAttack('ember');
        if (emberAtk) { for (let i = 0; i < 4; i++) emberAtk.upgrade(); }

        scene.time.delayedCall(500, () => {
          this.spawnSystem.spawnBoss('raticate');
        });
        break;
      }

      case 'gachaBox': {
        p.stats.level = 10;
        p.stats.hp = p.stats.maxHp;

        const emberAtk2 = p.getAttack('ember');
        if (emberAtk2) { for (let i = 0; i < 7; i++) emberAtk2.upgrade(); }

        scene.time.delayedCall(500, () => {
          const config = ENEMIES['raticate'] as BossConfig;
          if (!config) return;
          const pos = { x: p.x + 100, y: p.y };
          const boss = new Boss(scene, pos.x, pos.y, config);
          this.ctx.enemyGroup.add(boss);
          boss.takeDamage(config.hp - 1);
          scene.events.emit('boss-spawned', {
            name: config.name, hp: 1, maxHp: config.hp, boss,
          });
        });
        break;
      }

      case 'allEnemies': {
        p.stats.level = 10;
        p.stats.hp = 999;
        p.stats.maxHp = 999;

        const enemyTypes: EnemyType[] = [
          'rattata', 'pidgey', 'zubat', 'geodude', 'gastly', 'caterpie', 'weedle',
          'spearow', 'ekans', 'oddish', 'mankey', 'haunter', 'machop', 'golbat',
          'metapod', 'kakuna', 'gloom', 'paras', 'venonat', 'drowzee', 'cubone',
          'butterfree', 'parasect', 'venomoth', 'hypno', 'marowak',
          'alakazam', 'electrode',
        ];
        const radius = 250;
        const angleStep = (Math.PI * 2) / enemyTypes.length;

        enemyTypes.forEach((type, i) => {
          const config = ENEMIES[type];
          if (!config) return;
          const ex = p.x + Math.cos(angleStep * i) * radius;
          const ey = p.y + Math.sin(angleStep * i) * radius;
          const enemy = new Enemy(scene, ex, ey, config);
          this.ctx.enemyGroup.add(enemy);
        });

        const bossTypes: EnemyType[] = [
          'raticate', 'arbok', 'nidoking', 'snorlax',
          'beedrill', 'vileplume', 'primeape', 'gengar',
        ];
        const bossRadius = 400;
        const bossAngleStep = (Math.PI * 2) / bossTypes.length;
        bossTypes.forEach((type, i) => {
          const config = ENEMIES[type] as BossConfig;
          if (!config) return;
          const bx = p.x + Math.cos(bossAngleStep * i) * bossRadius;
          const by = p.y + Math.sin(bossAngleStep * i) * bossRadius;
          const boss = new Boss(scene, bx, by, config);
          this.ctx.enemyGroup.add(boss);
        });
        break;
      }

      case 'phase2Test': {
        p.stats.level = 15;
        p.stats.hp = 999;
        p.stats.maxHp = 999;

        const p2Types: EnemyType[] = ['metapod', 'kakuna', 'gloom', 'paras', 'venonat', 'drowzee', 'cubone'];
        const p2Radius = 180;
        const p2Step = (Math.PI * 2) / p2Types.length;
        p2Types.forEach((type, i) => {
          const config = ENEMIES[type];
          if (!config) return;
          const ex = p.x + Math.cos(p2Step * i) * p2Radius;
          const ey = p.y + Math.sin(p2Step * i) * p2Radius;
          const enemy = new Enemy(scene, ex, ey, config);
          this.ctx.enemyGroup.add(enemy);
        });
        break;
      }

      case 'phase3Test': {
        p.stats.level = 25;
        p.stats.hp = 999;
        p.stats.maxHp = 999;

        const p3Types: EnemyType[] = ['butterfree', 'parasect', 'venomoth', 'hypno', 'marowak'];
        const p3Radius = 180;
        const p3Step = (Math.PI * 2) / p3Types.length;
        p3Types.forEach((type, i) => {
          const config = ENEMIES[type];
          if (!config) return;
          const ex = p.x + Math.cos(p3Step * i) * p3Radius;
          const ey = p.y + Math.sin(p3Step * i) * p3Radius;
          const enemy = new Enemy(scene, ex, ey, config);
          this.ctx.enemyGroup.add(enemy);
        });
        break;
      }

      case 'phase4Test': {
        p.stats.level = 35;
        p.stats.hp = 999;
        p.stats.maxHp = 999;
        p.stats.form = 'stage1';
        p.evolve('stage1');

        const p4Types: EnemyType[] = ['alakazam', 'electrode'];
        const p4Radius = 150;
        p4Types.forEach((type, i) => {
          const config = ENEMIES[type];
          if (!config) return;
          const ex = p.x + (i === 0 ? -p4Radius : p4Radius);
          const ey = p.y;
          const enemy = new Enemy(scene, ex, ey, config);
          this.ctx.enemyGroup.add(enemy);
        });

        scene.time.delayedCall(1000, () => {
          this.spawnSystem.spawnBoss('gengar');
        });
        break;
      }

      case 'bossRush': {
        p.stats.level = 30;
        p.stats.hp = 999;
        p.stats.maxHp = 999;
        p.stats.form = 'stage1';
        p.evolve('stage1');

        const emberAtk3 = p.getAttack('ember');
        if (emberAtk3) { for (let i = 0; i < 7; i++) emberAtk3.upgrade(); }
        const fsAtk = this.attackFactory.createAttack('fireSpin');
        for (let i = 0; i < 7; i++) fsAtk.upgrade();

        const allBosses: EnemyType[] = [
          'raticate', 'arbok', 'nidoking', 'snorlax',
          'beedrill', 'vileplume', 'primeape', 'gengar',
        ];
        allBosses.forEach((type, i) => {
          scene.time.delayedCall(i * 5000, () => {
            this.spawnSystem.spawnBoss(type);
          });
        });
        break;
      }
    }

    scene.events.emit('resume-game');
    scene.events.emit('stats-refresh');
    this.addDebugHUD();
  }

  private addDebugHUD(): void {
    const scene = this.ctx.scene;
    const { width } = scene.cameras.main;
    const btnX = width - 70;
    const btnY = 25;
    const btnW = 110;
    const btnH = 28;

    const btnGfx = scene.add.graphics().setScrollFactor(0).setDepth(500);
    const drawBtn = (hover: boolean): void => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? 0x44bb44 : 0x228822, 0.85);
      btnGfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
      btnGfx.lineStyle(1, hover ? 0x66dd66 : 0x33aa33);
      btnGfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
    };
    drawBtn(false);

    scene.add.text(btnX, btnY, 'LEVEL UP', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    const hitbox = scene.add.rectangle(btnX, btnY, btnW, btnH, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(502);
    hitbox.on('pointerover', () => drawBtn(true));
    hitbox.on('pointerout', () => drawBtn(false));
    hitbox.on('pointerdown', () => {
      SoundManager.playClick();
      const player = this.ctx.player;
      const needed = player.stats.xpToNext - player.stats.xp;
      player.addXp(needed);
      this.upgradeSystem.triggerLevelUp();
    });

    // ── Training dummies (spawna Geodudes para testar ataques) ─────
    this.spawnDummies();
    scene.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.spawnDummies(),
    });
  }

  private spawnDummies(): void {
    const scene = this.ctx.scene;
    const p = this.ctx.player;
    const activeCount = this.ctx.enemyGroup.getChildren().filter(c => c.active).length;
    const desiredCount = 5;
    const toSpawn = desiredCount - activeCount;

    for (let i = 0; i < toSpawn; i++) {
      const config = ENEMIES['geodude'];
      if (!config) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 150;
      const ex = p.x + Math.cos(angle) * dist;
      const ey = p.y + Math.sin(angle) * dist;
      const enemy = new Enemy(scene, ex, ey, config);
      this.ctx.enemyGroup.add(enemy);
    }
  }
}
