import Phaser from 'phaser';
import { ATTACKS, EVOLUTIONS, UPGRADE_DEFS } from '../config';
import type { UpgradeOption, AttackType, HeldItemType, PokemonForm } from '../types';
import { isFormUnlocked } from '../types';
import { SoundManager } from '../audio/SoundManager';
import type { GameContext } from './GameContext';
import type { AttackFactory } from './AttackFactory';
import type { PickupSystem } from './PickupSystem';

// Map from upgradeId to [baseAttack, evolvedAttack, notificationText, notificationColor, flashColor]
const EVOLUTION_MAP: Record<string, [AttackType, AttackType, string, number, [number, number, number]]> = {
  evolveInferno: ['ember', 'inferno', 'EMBER EVOLUIU PARA INFERNO!', 0xff4400, [255, 100, 0]],
  evolveFireBlast: ['fireSpin', 'fireBlast', 'FIRE SPIN EVOLUIU PARA FIRE BLAST!', 0xff8800, [255, 150, 0]],
  evolveBlastBurn: ['flamethrower', 'blastBurn', 'FLAMETHROWER EVOLUIU PARA BLAST BURN!', 0xff0000, [255, 50, 0]],
  evolveFurySwipes: ['scratch', 'furySwipes', 'SCRATCH EVOLUIU PARA FURY SWIPES!', 0xcccccc, [200, 200, 200]],
  evolveBlazeKick: ['fireFang', 'blazeKick', 'FIRE FANG EVOLUIU PARA BLAZE KICK!', 0xff6600, [255, 100, 0]],
  evolveFlareRush: ['flameCharge', 'flareRush', 'FLAME CHARGE EVOLUIU PARA FLARE RUSH!', 0xff4400, [255, 80, 0]],
  evolveDragonPulse: ['dragonBreath', 'dragonPulse', 'DRAGON BREATH EVOLUIU PARA DRAGON PULSE!', 0x7744ff, [120, 70, 255]],
  evolveNightSlash: ['slash', 'nightSlash', 'SLASH EVOLUIU PARA NIGHT SLASH!', 0x444466, [70, 70, 100]],
  evolveDragonRush: ['dragonClaw', 'dragonRush', 'DRAGON CLAW EVOLUIU PARA DRAGON RUSH!', 0x7744ff, [120, 70, 255]],
  evolveAerialAce: ['airSlash', 'aerialAce', 'AIR SLASH EVOLUIU PARA AERIAL ACE!', 0x88ccff, [140, 200, 255]],
  // ── Squirtle — Wartortle tier ─────────────────────────────────────
  evolveScald: ['waterGun', 'scald', 'WATER GUN EVOLUIU PARA SCALD!', 0x3388ff, [50, 140, 255]],
  evolveBubbleBeam: ['bubble', 'bubbleBeam', 'BUBBLE EVOLUIU PARA BUBBLE BEAM!', 0x44aaff, [70, 170, 255]],
  evolveBodySlam: ['tackle', 'bodySlam', 'TACKLE EVOLUIU PARA BODY SLAM!', 0xcccccc, [200, 200, 200]],
  evolveGyroBall: ['rapidSpin', 'gyroBall', 'RAPID SPIN EVOLUIU PARA GYRO BALL!', 0x888888, [140, 140, 140]],
  evolveWaterfall: ['aquaJet', 'waterfall', 'AQUA JET EVOLUIU PARA WATERFALL!', 0x3388ff, [50, 140, 255]],
  // ── Squirtle — Blastoise tier ─────────────────────────────────────
  evolveOriginPulse: ['hydroPump', 'originPulse', 'HYDRO PUMP EVOLUIU PARA ORIGIN PULSE!', 0x0044ff, [0, 70, 255]],
  evolveMuddyWater: ['waterPulse', 'muddyWater', 'WATER PULSE EVOLUIU PARA MUDDY WATER!', 0x664400, [100, 70, 0]],
  evolveCrabhammer: ['aquaTail', 'crabhammer', 'AQUA TAIL EVOLUIU PARA CRABHAMMER!', 0xff4400, [255, 70, 0]],
  evolveWaterSpout: ['whirlpool', 'waterSpout', 'WHIRLPOOL EVOLUIU PARA WATER SPOUT!', 0x3388ff, [50, 140, 255]],
  evolveBlizzard: ['iceBeam', 'blizzard', 'ICE BEAM EVOLUIU PARA BLIZZARD!', 0x88ddff, [140, 220, 255]],
};

// Map from upgradeId to AttackType for new attack creation
const NEW_ATTACK_MAP: Record<string, AttackType> = {
  newEmber: 'ember', newScratch: 'scratch', newFireSpin: 'fireSpin',
  newSmokescreen: 'smokescreen', newDragonBreath: 'dragonBreath',
  newFireFang: 'fireFang', newFlameCharge: 'flameCharge',
  newSlash: 'slash', newFlamethrower: 'flamethrower', newDragonClaw: 'dragonClaw',
  newAirSlash: 'airSlash', newFlareBlitz: 'flareBlitz',
  newHurricane: 'hurricane', newOutrage: 'outrage',
  newHeatWave: 'heatWave', newDracoMeteor: 'dracoMeteor',
  // Squirtle
  newWaterGun: 'waterGun', newBubble: 'bubble', newTackle: 'tackle',
  newRapidSpin: 'rapidSpin', newWithdraw: 'withdraw', newAquaJet: 'aquaJet',
  newWaterPulse: 'waterPulse', newHydroPump: 'hydroPump', newAquaTail: 'aquaTail', newWhirlpool: 'whirlpool',
  newIceBeam: 'iceBeam', newFlashCannon: 'flashCannon', newSurf: 'surf', newLiquidation: 'liquidation',
  newRainDance: 'rainDance', newHydroCannon: 'hydroCannon',
};

// Map from upgradeId to AttackType for upgrading existing attacks
const UPGRADE_MAP: Record<string, AttackType> = {
  upgradeEmber: 'ember', upgradeScratch: 'scratch', upgradeFireSpin: 'fireSpin',
  upgradeSmokescreen: 'smokescreen', upgradeDragonBreath: 'dragonBreath',
  upgradeFireFang: 'fireFang', upgradeFlameCharge: 'flameCharge',
  upgradeSlash: 'slash', upgradeFlame: 'flamethrower', upgradeDragonClaw: 'dragonClaw',
  upgradeAirSlash: 'airSlash', upgradeFlareBlitz: 'flareBlitz',
  upgradeHurricane: 'hurricane', upgradeOutrage: 'outrage',
  upgradeHeatWave: 'heatWave', upgradeDracoMeteor: 'dracoMeteor',
  // Squirtle
  upgradeWaterGun: 'waterGun', upgradeBubble: 'bubble', upgradeTackle: 'tackle',
  upgradeRapidSpin: 'rapidSpin', upgradeWithdraw: 'withdraw', upgradeAquaJet: 'aquaJet',
  upgradeWaterPulse: 'waterPulse', upgradeHydroPump: 'hydroPump', upgradeAquaTail: 'aquaTail', upgradeWhirlpool: 'whirlpool',
  upgradeIceBeam: 'iceBeam', upgradeFlashCannon: 'flashCannon', upgradeSurf: 'surf', upgradeLiquidation: 'liquidation',
  upgradeRainDance: 'rainDance', upgradeHydroCannon: 'hydroCannon',
};

// Map from upgradeId to HeldItemType for held item upgrades
const ITEM_MAP: Record<string, HeldItemType> = {
  itemCharcoal: 'charcoal', itemWideLens: 'wideLens', itemChoiceSpecs: 'choiceSpecs',
  itemDragonFang: 'dragonFang', itemSharpBeak: 'sharpBeak',
  itemScopeLens: 'scopeLens', itemRazorClaw: 'razorClaw',
  itemShellBell: 'shellBell', itemFocusBand: 'focusBand',
  itemMysticWater: 'mysticWater', itemNeverMeltIce: 'neverMeltIce',
};

// ── Starter attack pools (para filtrar upgrades por starter) ────────
const STARTER_ATTACK_POOL: Record<string, ReadonlySet<AttackType>> = {
  charmander: new Set<AttackType>([
    'ember', 'scratch', 'fireSpin', 'smokescreen', 'dragonBreath', 'fireFang', 'flameCharge',
    'slash', 'flamethrower', 'dragonClaw', 'airSlash', 'flareBlitz', 'hurricane', 'outrage',
    'heatWave', 'dracoMeteor',
    'inferno', 'fireBlast', 'blastBurn', 'furySwipes', 'blazeKick',
    'dragonPulse', 'nightSlash', 'aerialAce', 'flareRush', 'dragonRush',
  ]),
  squirtle: new Set<AttackType>([
    'waterGun', 'bubble', 'tackle', 'rapidSpin', 'withdraw', 'aquaJet',
    'waterPulse', 'hydroPump', 'aquaTail', 'whirlpool',
    'iceBeam', 'flashCannon', 'surf', 'liquidation', 'rainDance', 'hydroCannon',
    'scald', 'bubbleBeam', 'bodySlam', 'gyroBall', 'waterfall',
    'originPulse', 'muddyWater', 'crabhammer', 'waterSpout', 'blizzard',
  ]),
};

// ── Held items com afinidade de starter (elemento-específicos) ──────
const ITEM_STARTER_AFFINITY: Partial<Record<HeldItemType, string>> = {
  charcoal: 'charmander',
  dragonFang: 'charmander',
  sharpBeak: 'charmander',
  mysticWater: 'squirtle',
  neverMeltIce: 'squirtle',
};

export class UpgradeSystem {
  constructor(
    private readonly ctx: GameContext,
    private readonly attackFactory: AttackFactory,
    private readonly pickupSystem: PickupSystem,
  ) {}

  // ── Level Up ──────────────────────────────────────────────────────
  triggerLevelUp(): void {
    const scene = this.ctx.scene;
    scene.events.emit('pause-game');

    const level = this.ctx.player.stats.level;
    const forms = this.ctx.starterConfig.forms ?? [];
    const evolutionForm = forms.find(f => f.level === level && f.form !== 'base');
    if (evolutionForm && evolutionForm.form !== this.ctx.player.stats.form) {
      this.triggerEvolution(evolutionForm.form);
      return;
    }

    SoundManager.playLevelUp();
    const options = this.generateUpgradeOptions();
    scene.events.emit('level-up', options, this.ctx.player.stats.level, this.getDisplayRerolls());
  }

  // ── Evolution ─────────────────────────────────────────────────────
  private triggerEvolution(targetForm: PokemonForm): void {
    const scene = this.ctx.scene;
    const player = this.ctx.player;
    const forms = this.ctx.starterConfig.forms ?? [];
    const currentFormConfig = forms.find(f => f.form === player.stats.form);
    const prevName = currentFormConfig?.name ?? this.ctx.starterConfig.name ?? '???';

    const formConfig = player.evolve(targetForm);
    if (!formConfig) {
      SoundManager.playLevelUp();
      const options = this.generateUpgradeOptions();
      scene.events.emit('level-up', options, player.stats.level, this.getDisplayRerolls());
      return;
    }

    SoundManager.playEvolve();
    scene.cameras.main.flash(800, 255, 255, 255);
    scene.cameras.main.shake(500, 0.01);

    const particleKey = this.ctx.starterConfig.key === 'squirtle' ? 'water-particle' : 'fire-particle';
    const particleTints = this.ctx.starterConfig.key === 'squirtle'
      ? [0xFFFFFF, 0x44AAFF, 0x3388FF]
      : [0xFFFFFF, 0xFFDD44, 0xFF8800];
    scene.add.particles(player.x, player.y, particleKey, {
      speed: { min: 40, max: 120 }, lifespan: 1000, quantity: 30,
      scale: { start: 2.5, end: 0 },
      tint: particleTints,
      emitting: false,
    }).explode();

    const name = formConfig.name;
    this.pickupSystem.showPickupNotification(`${prevName} EVOLUIU PARA ${name.toUpperCase()}!`, 0xFFDD44);

    scene.events.emit('pokemon-evolved', {
      fromName: prevName,
      toName: name,
      form: targetForm,
      newSlots: formConfig.maxAttackSlots,
    });

    scene.time.delayedCall(1500, () => {
      SoundManager.playLevelUp();
      const options = this.generateUpgradeOptions();
      scene.events.emit('level-up', options, player.stats.level, this.getDisplayRerolls());
    });
  }

  // ── Generate upgrade pool ─────────────────────────────────────────
  generateUpgradeOptions(): UpgradeOption[] {
    const pool: UpgradeOption[] = [];
    const player = this.ctx.player;
    const playerForm = player.stats.form;
    const currentAttackCount = player.getAllAttacks().length;
    const maxSlots = player.stats.attackSlots;
    const hasRoom = currentAttackCount < maxSlots;
    const starterPool = STARTER_ATTACK_POOL[this.ctx.starterConfig.key ?? 'charmander'];

    // Weapon evolutions (highest priority)
    for (const evo of EVOLUTIONS) {
      if (starterPool && !starterPool.has(evo.evolvedAttack)) continue;
      const attack = player.getAttack(evo.baseAttack);
      if (!attack || attack.level < evo.requiredLevel) continue;
      if (!player.hasHeldItem(evo.requiredItem)) continue;
      if (!isFormUnlocked(playerForm, evo.requiredForm)) continue;
      if (player.hasAttack(evo.evolvedAttack)) continue;

      const evoDef = UPGRADE_DEFS[`evolve${evo.evolvedAttack.charAt(0).toUpperCase() + evo.evolvedAttack.slice(1)}` as keyof typeof UPGRADE_DEFS];
      if (evoDef) pool.push(evoDef);
    }

    // New attacks
    if (hasRoom) {
      for (const [id, atkType] of Object.entries(NEW_ATTACK_MAP)) {
        if (starterPool && !starterPool.has(atkType)) continue;
        const config = ATTACKS[atkType];
        if (!config) continue;
        if (!isFormUnlocked(playerForm, config.minForm)) continue;
        if (player.hasAttack(atkType)) continue;
        const evo = EVOLUTIONS.find(e => e.baseAttack === atkType);
        if (evo && player.hasAttack(evo.evolvedAttack)) continue;
        const def = UPGRADE_DEFS[id as keyof typeof UPGRADE_DEFS];
        if (def) pool.push(def);
      }
    }

    // Attack upgrades
    for (const [id, atkType] of Object.entries(UPGRADE_MAP)) {
      if (starterPool && !starterPool.has(atkType)) continue;
      const atk = player.getAttack(atkType);
      if (!atk) continue;
      const maxLevel = ATTACKS[atkType]?.maxLevel ?? 8;
      if (atk.level >= maxLevel) continue;
      const evo = EVOLUTIONS.find(e => e.baseAttack === atkType);
      if (evo && player.hasAttack(evo.evolvedAttack)) continue;
      const def = UPGRADE_DEFS[id as keyof typeof UPGRADE_DEFS];
      if (def) pool.push(def);
    }

    // Held items
    const heldItemCount = player.getHeldItems().length;
    const maxPassive = player.stats.passiveSlots;
    const starterKey = this.ctx.starterConfig.key ?? 'charmander';
    if (heldItemCount < maxPassive) {
      const itemFormReqs: Partial<Record<HeldItemType, PokemonForm>> = {
        dragonFang: 'stage1',
        sharpBeak: 'stage2',
        neverMeltIce: 'stage2',
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
        { key: 'mysticWater', defKey: 'itemMysticWater' },
        { key: 'neverMeltIce', defKey: 'itemNeverMeltIce' },
      ];
      for (const { key, defKey } of items) {
        if (player.hasHeldItem(key)) continue;
        const formReq = itemFormReqs[key];
        if (formReq && !isFormUnlocked(playerForm, formReq)) continue;
        const affinity = ITEM_STARTER_AFFINITY[key];
        if (affinity && affinity !== starterKey) continue;
        pool.push(UPGRADE_DEFS[defKey]);
      }
    }

    // Stats (always available)
    pool.push(UPGRADE_DEFS.maxHpUp, UPGRADE_DEFS.speedUp, UPGRADE_DEFS.magnetUp);

    Phaser.Utils.Array.Shuffle(pool);

    const evolutions = pool.filter(p => p.id.startsWith('evolve'));
    const nonEvolutions = pool.filter(p => !p.id.startsWith('evolve'));
    return [...evolutions, ...nonEvolutions].slice(0, 3);
  }

  // ── Apply upgrade ─────────────────────────────────────────────────
  applyUpgrade(upgradeId: string): void {
    const player = this.ctx.player;

    // Evolution
    if (upgradeId in EVOLUTION_MAP) {
      const [from, to, text, color, flash] = EVOLUTION_MAP[upgradeId];
      this.attackFactory.evolveAttack(from, to, text, color, flash);
      this.emitStats();
      return;
    }

    // New attack
    if (upgradeId in NEW_ATTACK_MAP) {
      this.attackFactory.createAttack(NEW_ATTACK_MAP[upgradeId]);
      this.emitStats();
      return;
    }

    // Attack upgrade
    if (upgradeId in UPGRADE_MAP) {
      player.getAttack(UPGRADE_MAP[upgradeId])?.upgrade();
      this.emitStats();
      return;
    }

    // Held item
    if (upgradeId in ITEM_MAP) {
      player.addHeldItem(ITEM_MAP[upgradeId]);
      this.emitStats();
      return;
    }

    // Stats
    switch (upgradeId) {
      case 'maxHpUp':
        player.stats.maxHp += 10;
        player.stats.hp = Math.min(player.stats.hp + 10, player.stats.maxHp);
        player.stats.hpRegen += 0.5;
        break;
      case 'speedUp':
        player.stats.speed = Math.floor(player.stats.speed * 1.15);
        break;
      case 'magnetUp':
        player.stats.magnetRange = Math.floor(player.stats.magnetRange * 1.4);
        break;
    }

    this.emitStats();
  }

  // ── Resume after upgrade ──────────────────────────────────────────
  resumeGame(): void {
    this.ctx.scene.events.emit('resume-game');
  }

  // ── Gacha reward application ──────────────────────────────────────
  /** Returns true if the reward triggered a level-up (rareCandy), false otherwise. */
  applyGachaReward(rewardType: string): boolean {
    const player = this.ctx.player;

    switch (rewardType) {
      case 'skillUpgrade': {
        const attacks = player.getAllAttacks();
        if (attacks.length > 0) {
          const atk = attacks[Phaser.Math.Between(0, attacks.length - 1)];
          const config = ATTACKS[atk.type];
          if (config && atk.level < config.maxLevel) {
            atk.upgrade();
            this.pickupSystem.showPickupNotification(`${config.name} +1!`, 0x44ff44);
          } else {
            player.heal(50);
            this.pickupSystem.showPickupNotification('+50 HP', 0x44ff44);
          }
        }
        break;
      }
      case 'heldItem':
        this.pickupSystem.dropHeldItem(player.x, player.y - 20);
        break;
      case 'rareCandy': {
        this.pickupSystem.showPickupNotification('RARE CANDY! +1 Level!', 0xFFD700);
        player.addXp(player.stats.xpToNext);
        this.triggerLevelUp();
        return true; // triggerLevelUp handles pause + emitStats
      }
      case 'evolutionStone': {
        this.pickupSystem.showPickupNotification('EVOLUTION STONE!', 0xff8800);
        const attacks = player.getAllAttacks();
        if (attacks.length > 0) {
          const atk = attacks[Phaser.Math.Between(0, attacks.length - 1)];
          atk.upgrade();
          atk.upgrade();
          this.pickupSystem.showPickupNotification(`${atk.type} +2!`, 0xff8800);
        }
        break;
      }
      case 'maxRevive':
        player.stats.hp = player.stats.maxHp;
        this.pickupSystem.showPickupNotification('MAX REVIVE! HP CHEIO!', 0xff44ff);
        break;
    }
    this.emitStats();
    return false;
  }

  // ── Reroll handling ───────────────────────────────────────────────
  handleReroll(rerollLocked: boolean): boolean {
    if (rerollLocked) return false;
    const player = this.ctx.player;
    if (!this.ctx.debugMode && player.stats.rerolls <= 0) return false;
    if (!this.ctx.debugMode) player.stats.rerolls--;
    SoundManager.playClick();
    const newOptions = this.generateUpgradeOptions();
    this.ctx.scene.events.emit('level-up', newOptions, player.stats.level, this.getDisplayRerolls());
    return true;
  }

  getDisplayRerolls(): number {
    return this.ctx.debugMode ? 99 : this.ctx.player.stats.rerolls;
  }

  // ── Cone attack kill handler ──────────────────────────────────────
  onConeAttackKill(x: number, y: number, xpValue: number): void {
    this.ctx.player.stats.kills++;
    SoundManager.playEnemyDeath();
    this.pickupSystem.spawnXpGem(x, y, xpValue);
    this.emitStats();
  }

  private emitStats(): void {
    this.ctx.scene.events.emit('stats-refresh');
  }
}
