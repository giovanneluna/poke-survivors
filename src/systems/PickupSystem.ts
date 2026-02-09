import Phaser from 'phaser';
import type { PickupType, HeldItemType } from '../types';
import { Destructible } from '../entities/Destructible';
import { Pickup } from '../entities/Pickup';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';

export class PickupSystem {
  constructor(private readonly ctx: GameContext) {}

  // ── XP Gems (tiered) ──────────────────────────────────────────────
  private static readonly XP_TIERS: ReadonlyArray<{ threshold: number; texture: string; value: number; scale: number }> = [
    { threshold: 100, texture: 'xp-gem-purple', value: 100, scale: 1.8 },
    { threshold: 25,  texture: 'xp-gem-red',    value: 25,  scale: 1.5 },
    { threshold: 5,   texture: 'xp-gem-green',  value: 5,   scale: 1.3 },
    { threshold: 1,   texture: 'xp-gem',        value: 1,   scale: 1.2 },
  ];

  spawnXpGem(x: number, y: number, totalXp: number): void {
    const scene = this.ctx.scene;
    let remaining = totalXp;

    for (const tier of PickupSystem.XP_TIERS) {
      while (remaining >= tier.threshold) {
        remaining -= tier.value;
        const ox = Phaser.Math.Between(-10, 10);
        const oy = Phaser.Math.Between(-10, 10);
        const gem = this.ctx.xpGems.get(x + ox, y + oy, tier.texture) as Phaser.Physics.Arcade.Sprite | null;
        if (!gem) continue;
        gem.setTexture(tier.texture);
        gem.setActive(true).setVisible(true).setScale(tier.scale).setDepth(3);
        gem.setData('xpValue', tier.value);
        const body = gem.body as Phaser.Physics.Arcade.Body;
        body.enable = true;
        body.reset(x + ox, y + oy);
        scene.tweens.add({ targets: gem, y: gem.y - 10, scaleX: tier.scale + 0.3, scaleY: tier.scale + 0.3, duration: 150, yoyo: true, ease: 'Quad.Out' });
      }
    }
  }

  // ── Hit Effects ──────────────────────────────────────────────────
  playFireHit(x: number, y: number): void {
    const hit = this.ctx.scene.add.sprite(x, y, 'atk-fire-hit');
    hit.setScale(1.5).setDepth(10);
    hit.play('anim-fire-hit');
    hit.once('animationcomplete', () => hit.destroy());
  }

  playWaterHit(x: number, y: number): void {
    const hit = this.ctx.scene.add.sprite(x, y, 'atk-water-hit');
    hit.setScale(2).setDepth(10);
    hit.play('anim-water-hit');
    hit.once('animationcomplete', () => hit.destroy());
  }

  playHitEffect(x: number, y: number, element: 'fire' | 'water'): void {
    if (element === 'water') this.playWaterHit(x, y);
    else this.playFireHit(x, y);
  }

  // ── Destructible drops ────────────────────────────────────────────
  onDestructibleDestroyed(dest: Destructible): void {
    const config = dest.config;

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
      break;
    }
  }

  // ── Held Item drops ───────────────────────────────────────────────
  dropHeldItem(x: number, y: number): void {
    const items: HeldItemType[] = [
      'charcoal', 'wideLens', 'choiceSpecs', 'dragonFang', 'sharpBeak',
      'scopeLens', 'razorClaw', 'shellBell', 'focusBand', 'quickClaw', 'leftovers',
    ];
    const available = items.filter(i => !this.ctx.player.hasHeldItem(i));
    if (available.length === 0) {
      this.spawnPickup(x, y, 'rareCandy');
      return;
    }
    const item = available[Phaser.Math.Between(0, available.length - 1)];

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
      mysticWater: 'held-mystic-water',
      neverMeltIce: 'held-never-melt-ice',
      miracleSeed: 'held-miracle-seed',
      bigRoot: 'held-big-root',
      blackSludge: 'held-black-sludge',
      leafStone: 'held-leaf-stone',
    };

    const pickup = new Pickup(this.ctx.scene, x, y, 'oranBerry', textureMap[item] ?? 'held-charcoal');
    pickup.setData('isHeldItem', true);
    pickup.setData('heldItemType', item);
    this.ctx.pickups.add(pickup);
  }

  // ── Pickups ───────────────────────────────────────────────────────
  spawnPickup(x: number, y: number, type: PickupType): void {
    const textureMap: Record<PickupType, string> = {
      oranBerry: 'pickup-oran',
      sitrusBerry: 'pickup-sitrus',
      liechiBerry: 'pickup-liechi',
      salacBerry: 'pickup-salac',
      magnetBurst: 'pickup-magnet',
      rareCandy: 'pickup-candy',
      pokeballBomb: 'pickup-bomb',
      gachaBox: 'gacha-box',
      xpShare: 'pickup-xp-share',
      duplicator: 'pickup-duplicator',
    };
    const pickup = new Pickup(this.ctx.scene, x, y, type, textureMap[type]);
    this.ctx.pickups.add(pickup);
  }

  applyPickup(pickup: Pickup): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;

    // Held Item especial
    if (pickup.getData('isHeldItem')) {
      const itemType = pickup.getData('heldItemType') as HeldItemType;
      player.addHeldItem(itemType);
      SoundManager.playPickupItem();
      this.showPickupNotification(`${itemType.toUpperCase()} obtido!`, 0xFFD700);
      pickup.destroy();
      scene.events.emit('stats-refresh');
      return;
    }

    switch (pickup.pickupType) {
      case 'oranBerry':
        player.heal(25);
        SoundManager.playPickupItem();
        this.showPickupNotification('+25 HP', 0x44ff44);
        break;

      case 'sitrusBerry':
        player.heal(50);
        SoundManager.playPickupItem();
        this.showPickupNotification('+50 HP', 0x44ff44);
        break;

      case 'liechiBerry':
        player.applyBuff('damage', 2, 30_000, scene.time.now);
        SoundManager.playPickupItem();
        this.showPickupNotification('2x DANO por 30s!', 0xff4444);
        break;

      case 'salacBerry':
        player.applyBuff('speed', 1.5, 30_000, scene.time.now);
        SoundManager.playPickupItem();
        this.showPickupNotification('1.5x SPEED por 30s!', 0x44ddff);
        break;

      case 'magnetBurst':
        SoundManager.playPickupItem();
        this.showPickupNotification('MAGNET BURST!', 0x44aaff);
        this.ctx.xpGems.getChildren().forEach(child => {
          const gem = child as Phaser.Physics.Arcade.Sprite;
          if (gem.active) scene.physics.moveToObject(gem, player, 600);
        });
        break;

      case 'rareCandy':
        SoundManager.playPickupItem();
        this.showPickupNotification('RARE CANDY! +1 Level!', 0xFFD700);
        player.addXp(player.stats.xpToNext);
        scene.events.emit('request-level-up');
        break;

      case 'pokeballBomb':
        this.showPickupNotification('POKEBALL BOMB!', 0xff4444);
        SoundManager.playExplosion();
        scene.cameras.main.shake(300, 0.01);
        scene.events.emit('pokeball-bomb');
        break;

      case 'gachaBox':
        scene.events.emit('pause-game');
        scene.events.emit('show-gacha');
        break;

      case 'xpShare':
        player.stats.xpMultiplier = 2;
        SoundManager.playPickupItem();
        this.showPickupNotification('XP SHARE! XP x2!', 0xaa44ff);
        break;

      case 'duplicator':
        player.stats.projectileBonus += 1;
        SoundManager.playPickupItem();
        this.showPickupNotification('DUPLICATOR! +1 Projétil!', 0x44dd44);
        break;
    }

    pickup.destroy();
    scene.events.emit('stats-refresh');
  }

  // ── Notificação visual ────────────────────────────────────────────
  showPickupNotification(text: string, color: number): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const hexColor = `#${color.toString(16).padStart(6, '0')}`;
    const notif = scene.add.text(player.x, player.y - 30, text, {
      fontSize: '14px', color: hexColor, fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    scene.tweens.add({
      targets: notif, y: notif.y - 40, alpha: 0, duration: 1200,
      onComplete: () => notif.destroy(),
    });
  }
}
