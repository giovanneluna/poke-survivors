import Phaser from 'phaser';
import type { PickupType, HeldItemType } from '../types';
import { Destructible } from '../entities/Destructible';
import { Pickup } from '../entities/Pickup';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';

export class PickupSystem {
  constructor(private readonly ctx: GameContext) {}

  // ── XP Gems ───────────────────────────────────────────────────────
  spawnXpGem(x: number, y: number, count: number): void {
    const scene = this.ctx.scene;
    for (let i = 0; i < count; i++) {
      const ox = Phaser.Math.Between(-8, 8);
      const oy = Phaser.Math.Between(-8, 8);
      const gem = this.ctx.xpGems.get(x + ox, y + oy, 'xp-gem') as Phaser.Physics.Arcade.Sprite | null;
      if (!gem) continue;
      gem.setActive(true).setVisible(true).setScale(1.2).setDepth(3);
      gem.setData('xpValue', 1);
      const body = gem.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(x + ox, y + oy);
      scene.tweens.add({ targets: gem, y: gem.y - 10, scaleX: 1.5, scaleY: 1.5, duration: 150, yoyo: true, ease: 'Quad.Out' });
    }
  }

  // ── Fire Hit Effect ───────────────────────────────────────────────
  playFireHit(x: number, y: number): void {
    const hit = this.ctx.scene.add.sprite(x, y, 'atk-fire-hit');
    hit.setScale(1.5).setDepth(10);
    hit.play('anim-fire-hit');
    hit.once('animationcomplete', () => hit.destroy());
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
      magnetBurst: 'pickup-magnet',
      rareCandy: 'pickup-candy',
      pokeballBomb: 'pickup-bomb',
      gachaBox: 'gacha-box',
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
