import type { Attack, AttackType } from '../types';
import { SoundManager } from '../audio/SoundManager';
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
// Squirtle line
import { WaterGun } from '../attacks/WaterGun';
import { Bubble } from '../attacks/Bubble';
import { Tackle } from '../attacks/Tackle';
import { RapidSpin } from '../attacks/RapidSpin';
import { Withdraw } from '../attacks/Withdraw';
import { AquaJet } from '../attacks/AquaJet';
import { WaterPulse } from '../attacks/WaterPulse';
import { HydroPump } from '../attacks/HydroPump';
import { AquaTail } from '../attacks/AquaTail';
import { Whirlpool } from '../attacks/Whirlpool';
import { IceBeam } from '../attacks/IceBeam';
import { FlashCannon } from '../attacks/FlashCannon';
import { Surf } from '../attacks/Surf';
import { Liquidation } from '../attacks/Liquidation';
import { RainDance } from '../attacks/RainDance';
import { HydroCannon } from '../attacks/HydroCannon';
import { Scald } from '../attacks/Scald';
import { BubbleBeam } from '../attacks/BubbleBeam';
import { BodySlam } from '../attacks/BodySlam';
import { GyroBall } from '../attacks/GyroBall';
import { Waterfall } from '../attacks/Waterfall';
import { OriginPulse } from '../attacks/OriginPulse';
import { MuddyWater } from '../attacks/MuddyWater';
import { Crabhammer } from '../attacks/Crabhammer';
import { WaterSpout } from '../attacks/WaterSpout';
import { Blizzard } from '../attacks/Blizzard';
import type { GameContext } from './GameContext';
import type { CollisionSystem } from './CollisionSystem';
import type { PickupSystem } from './PickupSystem';

type CollisionPattern = 'none' | 'projectile' | 'orbital' | 'inferno' | 'deflect';

type HitElement = 'fire' | 'water';

interface AttackEntry {
  create(ctx: GameContext): Attack;
  collision: CollisionPattern;
  hitElement?: HitElement;
  getGroup?: (attack: Attack) => Phaser.Physics.Arcade.Group;
  getDamage?: (attack: Attack) => () => number;
  getExplodeAt?: (attack: Attack) => (x: number, y: number) => void;
  orbitalCooldownMs?: number;
  orbitalDestDamage?: number;
}

const REGISTRY: Partial<Record<AttackType, AttackEntry>> = {
  ember: {
    create: (ctx) => new Ember(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'projectile',
    getGroup: (a) => (a as Ember).getBullets(),
    getDamage: (a) => () => (a as Ember).getDamage(),
  },
  fireSpin: {
    create: (ctx) => new FireSpin(ctx.scene, ctx.player),
    collision: 'orbital',
    getGroup: (a) => (a as FireSpin).getOrbs(),
    getDamage: (a) => () => (a as FireSpin).getDamage(),
    orbitalCooldownMs: 400,
    orbitalDestDamage: 1,
  },
  inferno: {
    create: (ctx) => new Inferno(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'inferno',
    getGroup: (a) => (a as Inferno).getBullets(),
    getDamage: (a) => () => (a as Inferno).getDamage(),
    getExplodeAt: (a) => (x, y) => (a as Inferno).explodeAt(x, y),
  },
  fireBlast: {
    create: (ctx) => new FireBlast(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'orbital',
    getGroup: (a) => (a as FireBlast).getOrbs(),
    getDamage: (a) => () => (a as FireBlast).getDamage(),
    orbitalCooldownMs: 300,
    orbitalDestDamage: 2,
  },
  // Cone / melee / dash / area attacks — no collision setup needed
  flamethrower: { create: (ctx) => new Flamethrower(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  blastBurn: { create: (ctx) => new BlastBurn(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  scratch: { create: (ctx) => new Scratch(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  fireFang: { create: (ctx) => new FireFang(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  dragonBreath: { create: (ctx) => new DragonBreath(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  smokescreen: { create: (ctx) => new Smokescreen(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  flameCharge: { create: (ctx) => new FlameCharge(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  slash: { create: (ctx) => new Slash(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  dragonClaw: { create: (ctx) => new DragonClaw(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  airSlash: { create: (ctx) => new AirSlash(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  flareBlitz: { create: (ctx) => new FlareBlitz(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  hurricane: { create: (ctx) => new Hurricane(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  outrage: { create: (ctx) => new Outrage(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  furySwipes: { create: (ctx) => new FurySwipes(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  blazeKick: { create: (ctx) => new BlazeKick(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  dragonPulse: { create: (ctx) => new DragonPulse(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  nightSlash: { create: (ctx) => new NightSlash(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  aerialAce: { create: (ctx) => new AerialAce(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  flareRush: { create: (ctx) => new FlareRush(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  dragonRush: { create: (ctx) => new DragonRush(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  heatWave: { create: (ctx) => new HeatWave(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  dracoMeteor: { create: (ctx) => new DracoMeteor(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  // ── Squirtle line ─────────────────────────────────────────────────
  waterGun: {
    create: (ctx) => new WaterGun(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'projectile',
    hitElement: 'water',
    getGroup: (a) => (a as WaterGun).getBullets(),
    getDamage: (a) => () => (a as WaterGun).getDamage(),
  },
  waterPulse: { create: (ctx) => new WaterPulse(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  iceBeam: {
    create: (ctx) => new IceBeam(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'projectile',
    hitElement: 'water',
    getGroup: (a) => (a as IceBeam).getBullets(),
    getDamage: (a) => () => (a as IceBeam).getDamage(),
  },
  flashCannon: {
    create: (ctx) => new FlashCannon(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'projectile',
    hitElement: 'water',
    getGroup: (a) => (a as FlashCannon).getBullets(),
    getDamage: (a) => () => (a as FlashCannon).getDamage(),
  },
  scald: {
    create: (ctx) => new Scald(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'inferno',
    getGroup: (a) => (a as Scald).getBullets(),
    getDamage: (a) => () => (a as Scald).getDamage(),
    getExplodeAt: (a) => (x, y) => (a as Scald).explodeAt(x, y),
  },
  rapidSpin: {
    create: (ctx) => new RapidSpin(ctx.scene, ctx.player),
    collision: 'orbital',
    hitElement: 'water',
    getGroup: (a) => (a as RapidSpin).getOrbs(),
    getDamage: (a) => () => (a as RapidSpin).getDamage(),
    orbitalCooldownMs: 400,
    orbitalDestDamage: 1,
  },
  gyroBall: {
    create: (ctx) => new GyroBall(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'orbital',
    hitElement: 'water',
    getGroup: (a) => (a as GyroBall).getOrbs(),
    getDamage: (a) => () => (a as GyroBall).getDamage(),
    orbitalCooldownMs: 300,
    orbitalDestDamage: 2,
  },
  bubble: {
    create: (ctx) => new Bubble(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'projectile',
    hitElement: 'water',
    getGroup: (a) => (a as Bubble).getBullets(),
    getDamage: (a) => () => (a as Bubble).getDamage(),
  },
  tackle: { create: (ctx) => new Tackle(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  withdraw: {
    create: (ctx) => new Withdraw(ctx.scene, ctx.player, ctx.enemyGroup),
    collision: 'deflect',
    hitElement: 'water',
    getGroup: (a) => (a as Withdraw).getDeflectZone(),
  },
  aquaJet: { create: (ctx) => new AquaJet(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  hydroPump: { create: (ctx) => new HydroPump(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  aquaTail: { create: (ctx) => new AquaTail(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  whirlpool: { create: (ctx) => new Whirlpool(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  surf: { create: (ctx) => new Surf(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  liquidation: { create: (ctx) => new Liquidation(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  rainDance: { create: (ctx) => new RainDance(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  hydroCannon: { create: (ctx) => new HydroCannon(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  bubbleBeam: { create: (ctx) => new BubbleBeam(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  bodySlam: { create: (ctx) => new BodySlam(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  waterfall: { create: (ctx) => new Waterfall(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  originPulse: { create: (ctx) => new OriginPulse(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  muddyWater: { create: (ctx) => new MuddyWater(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  crabhammer: { create: (ctx) => new Crabhammer(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  waterSpout: { create: (ctx) => new WaterSpout(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
  blizzard: { create: (ctx) => new Blizzard(ctx.scene, ctx.player, ctx.enemyGroup), collision: 'none' },
};

export class AttackFactory {
  constructor(
    private readonly ctx: GameContext,
    private readonly collisionSystem: CollisionSystem,
    private readonly pickupSystem: PickupSystem,
  ) {}

  createAttack(type: AttackType): Attack {
    const entry = REGISTRY[type];
    if (!entry) throw new Error(`Unknown attack type: ${type}`);

    const attack = entry.create(this.ctx);
    this.ctx.player.addAttack(type, attack);
    this.setupCollisions(type, attack, entry);
    return attack;
  }

  removeAttack(type: AttackType): void {
    this.collisionSystem.removeAttackColliders(type);
    this.ctx.player.removeAttack(type);
  }

  getRegisteredTypes(): AttackType[] {
    return Object.keys(REGISTRY) as AttackType[];
  }

  isRegistered(type: AttackType): boolean {
    return type in REGISTRY;
  }

  evolveAttack(
    fromType: AttackType,
    toType: AttackType,
    notificationText: string,
    notificationColor: number,
    flashColor: [number, number, number] = [255, 100, 0],
  ): Attack {
    // Remove old attack + colliders
    this.collisionSystem.removeAttackColliders(fromType);
    this.ctx.player.removeAttack(fromType);

    // Create new evolved attack
    const entry = REGISTRY[toType];
    if (!entry) throw new Error(`Unknown attack type: ${toType}`);

    const attack = entry.create(this.ctx);
    this.ctx.player.addAttack(toType, attack);
    this.setupCollisions(toType, attack, entry);

    // Visual feedback
    SoundManager.playEvolve();
    this.pickupSystem.showPickupNotification(notificationText, notificationColor);
    this.ctx.scene.cameras.main.flash(500, flashColor[0], flashColor[1], flashColor[2]);

    return attack;
  }

  private setupCollisions(type: AttackType, attack: Attack, entry: AttackEntry): void {
    if (entry.collision === 'none' || !entry.getGroup) return;
    if (entry.collision !== 'deflect' && !entry.getDamage) return;

    const group = entry.getGroup(attack);
    const getDamage = entry.getDamage?.(attack) ?? (() => 0);
    const hitElement = entry.hitElement ?? 'fire';

    switch (entry.collision) {
      case 'projectile':
        this.collisionSystem.setupProjectileCollisions(type, group, getDamage, hitElement);
        break;
      case 'orbital':
        this.collisionSystem.setupOrbitalCollisions(
          type, group, getDamage,
          entry.orbitalCooldownMs, entry.orbitalDestDamage,
          hitElement,
        );
        break;
      case 'inferno': {
        const explodeAt = entry.getExplodeAt?.(attack);
        if (explodeAt) {
          this.collisionSystem.setupInfernoCollisions(type, group, getDamage, explodeAt);
        }
        break;
      }
      case 'deflect':
        this.collisionSystem.setupDeflectCollisions(type, group, hitElement);
        break;
    }
  }
}
