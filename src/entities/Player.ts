import Phaser from 'phaser';
import { PLAYER, CHARMANDER_FORMS } from '../config';
import type { StarterConfig } from '../config';
import type { PlayerState, Attack, AttackType, Direction, SpriteConfig, HeldItemType, PokemonForm, PokemonFormConfig } from '../types';
import { formIndex } from '../types';
import { getPassive } from '../systems/PassiveSystem';
import { setDamageSource, clearDamageSource } from '../systems/DamageTracker';

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly stats: PlayerState;
  private readonly cursors: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private readonly attacks: Map<AttackType, Attack> = new Map();
  private readonly heldItems: Set<HeldItemType> = new Set();
  private lastDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 1);
  private currentDir: Direction = 'down';
  private invincibleUntil = 0;
  private spriteConfig: SpriteConfig;
  private shadow: Phaser.GameObjects.Image;
  private slowUntil = 0;
  private readonly slowMultiplier = 0.4;
  private poisonUntil = 0;
  private poisonDps = 0;
  private confusionUntil = 0;
  private stunUntil = 0;
  private readonly forms: readonly PokemonFormConfig[];
  godMode = false;

  constructor(scene: Phaser.Scene, x: number, y: number, starterConfig?: StarterConfig) {
    const sprite = starterConfig?.sprite ?? PLAYER.sprite;
    super(scene, x, y, sprite.key);
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as Phaser.GameObjects.GameObject);

    this.spriteConfig = sprite;
    this.forms = starterConfig?.forms ?? CHARMANDER_FORMS;
    this.setScale(1.5);
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 16);
    body.setOffset(8, 14);

    // Sombra
    this.shadow = scene.add.image(x, y + 12, 'shadow').setDepth(9).setScale(1.5);

    this.stats = {
      hp: PLAYER.startHp,
      maxHp: PLAYER.startHp,
      speed: PLAYER.startSpeed,
      baseSpeed: PLAYER.startSpeed,
      magnetRange: PLAYER.startMagnetRange,
      hpRegen: 0,
      xpMultiplier: 1,
      projectileBonus: 0,
      xp: 0,
      xpToNext: PLAYER.baseXpToLevel,
      level: 1,
      kills: 0,
      form: 'base',
      attackSlots: 4,
      passiveSlots: 4,
      rerolls: 3,
    };

    const keyboard = scene.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    this.cursors = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Começa olhando pra baixo
    this.play(`${this.spriteConfig.key}-down`);
  }

  // ── Ataques ────────────────────────────────────────────────────────
  addAttack(type: AttackType, attack: Attack): void { this.attacks.set(type, attack); }
  hasAttack(type: AttackType): boolean { return this.attacks.has(type); }
  getAttack(type: AttackType): Attack | undefined { return this.attacks.get(type); }
  getAllAttacks(): Attack[] { return Array.from(this.attacks.values()); }
  removeAttack(type: AttackType): void {
    const attack = this.attacks.get(type);
    if (attack) { attack.destroy(); this.attacks.delete(type); }
  }

  // ── Held Items ─────────────────────────────────────────────────────
  addHeldItem(item: HeldItemType): void { this.heldItems.add(item); }
  hasHeldItem(item: HeldItemType): boolean { return this.heldItems.has(item); }
  getHeldItems(): HeldItemType[] { return Array.from(this.heldItems); }

  // ── Slow effect ────────────────────────────────────────────────────
  applySlow(durationMs: number, time: number): void {
    this.slowUntil = time + durationMs;
  }

  isSlowed(time: number): boolean {
    return time < this.slowUntil;
  }

  // ── Confusion effect ──────────────────────────────────────────────
  applyConfusion(durationMs: number, time: number): void {
    this.confusionUntil = time + durationMs;
  }

  isConfused(time: number): boolean {
    return time < this.confusionUntil;
  }

  // ── Stun effect ──────────────────────────────────────────────────
  applyStun(durationMs: number, time: number): void {
    this.stunUntil = time + durationMs;
  }

  isStunned(time: number): boolean {
    return time < this.stunUntil;
  }

  // ── Poison effect ────────────────────────────────────────────────
  applyPoison(dps: number, durationMs: number, time: number): void {
    this.poisonUntil = time + durationMs;
    this.poisonDps = dps;
  }

  isPoisoned(time: number): boolean {
    return time < this.poisonUntil;
  }

  updatePoison(time: number, delta: number): void {
    if (!this.isPoisoned(time)) return;
    this.stats.hp -= this.poisonDps * (delta / 1000);
    // Tint roxo pulsante
    if (Math.floor(time / 200) % 2 === 0) {
      this.setTint(0xaa44ff);
    } else {
      this.clearTint();
    }
    if (time >= this.poisonUntil) {
      this.clearTint();
    }
  }

  getLastDirection(): Phaser.Math.Vector2 { return this.lastDirection.clone(); }

  takeDamage(amount: number, time: number): boolean {
    if (this.godMode) return false;
    if (time < this.invincibleUntil) return false;
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.invincibleUntil = time + PLAYER.invincibilityMs;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => this.clearTint());
    return true;
  }

  addXp(amount: number): boolean {
    this.stats.xp += Math.floor(amount * this.stats.xpMultiplier);
    if (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level++;
      this.stats.xpToNext = Math.floor(
        PLAYER.baseXpToLevel * Math.pow(PLAYER.xpScaleFactor, this.stats.level - 1)
      );
      return true;
    }
    return false;
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  // ── Evolução do Pokémon ────────────────────────────────────────────
  /**
   * @param force Se true, permite setar qualquer forma (usado pelo dev mode)
   */
  evolve(targetForm: PokemonForm, force = false): PokemonFormConfig | null {
    const formConfig = this.forms.find(f => f.form === targetForm);
    if (!formConfig) return null;
    if (!force && formIndex(targetForm) <= formIndex(this.stats.form)) return null;

    // Atualiza sprite (setFrame(0) garante frame correto do novo spritesheet)
    this.spriteConfig = formConfig.sprite;
    this.setTexture(formConfig.sprite.key);
    this.setFrame(0);

    // Ajusta scale baseado no Pokémon (Charizard é maior)
    const scaleMap: Record<PokemonForm, number> = { base: 1.5, stage1: 1.6, stage2: 1.8 };
    this.setScale(scaleMap[targetForm]);

    // Atualiza body size proporcionalmente
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (targetForm === 'stage2') {
      body.setSize(20, 20);
      body.setOffset(10, 24);
    } else {
      body.setSize(16, 16);
      body.setOffset(8, 14);
    }

    // Atualiza stats
    this.stats.form = targetForm;
    this.stats.attackSlots = formConfig.maxAttackSlots;
    this.stats.passiveSlots = formConfig.maxPassiveSlots;

    // Atualiza tier da passiva (Blaze/Torrent)
    const passive = getPassive();
    if (passive) passive.setTier(formConfig.passiveTier);

    // Inicia a animação de walk na direção atual
    this.playWalkAnim(this.currentDir);

    return formConfig;
  }

  getForm(): PokemonForm { return this.stats.form; }

  isDead(): boolean { return this.stats.hp <= 0; }

  handleMovement(time: number, joystickDir?: Phaser.Math.Vector2): void {
    // Stun: paralisa completamente
    if (this.isStunned(time)) {
      this.setVelocity(0, 0);
      this.anims.stop();
      if (Math.floor(time / 200) % 2 === 0) this.setTint(0xffff00);
      else this.clearTint();
      this.shadow.setPosition(this.x, this.y + 12);
      return;
    }

    const dir = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.right.isDown) dir.x = 1;
    else if (this.cursors.left.isDown) dir.x = -1;
    if (this.cursors.down.isDown) dir.y = 1;
    else if (this.cursors.up.isDown) dir.y = -1;

    // Joystick virtual sobrescreve se ativo e teclado não está sendo usado
    if (dir.x === 0 && dir.y === 0 && joystickDir && (joystickDir.x !== 0 || joystickDir.y !== 0)) {
      dir.set(joystickDir.x, joystickDir.y);
    }

    // Confusion: inverte direção
    if (this.isConfused(time)) {
      dir.x = -dir.x;
      dir.y = -dir.y;
    }

    const isMoving = dir.x !== 0 || dir.y !== 0;

    // Calcular velocidade efetiva (com slow)
    const speedMult = this.isSlowed(time) ? this.slowMultiplier : 1;
    const effectiveSpeed = this.stats.speed * speedMult;

    if (isMoving) {
      this.lastDirection = dir.clone().normalize();
      const newDir = this.vectorToDirection(dir.x, dir.y);

      if (newDir !== this.currentDir) {
        this.currentDir = newDir;
        this.playWalkAnim(newDir);
      }

      if (dir.x !== 0 && dir.y !== 0) dir.normalize();
      this.setVelocity(dir.x * effectiveSpeed, dir.y * effectiveSpeed);
    } else {
      this.setVelocity(0, 0);
      this.anims.stop();
    }

    // Visual de slow
    if (this.isSlowed(time)) {
      this.setTint(0x8888ff);
    }
    // Visual de confusion (rosa pulsante)
    if (this.isConfused(time)) {
      this.setTint(Math.floor(time / 150) % 2 === 0 ? 0xff66aa : 0xff99cc);
    }

    // Atualiza sombra
    this.shadow.setPosition(this.x, this.y + 12);
  }

  private playWalkAnim(dir: Direction): void {
    const animKey = `${this.spriteConfig.key}-${dir}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey);
    }
    this.setFlipX(false);
  }

  private vectorToDirection(dx: number, dy: number): Direction {
    if (dx > 0 && dy > 0) return 'downRight';
    if (dx > 0 && dy < 0) return 'upRight';
    if (dx < 0 && dy > 0) return 'downLeft';
    if (dx < 0 && dy < 0) return 'upLeft';
    if (dx > 0) return 'right';
    if (dx < 0) return 'left';
    if (dy > 0) return 'down';
    return 'up';
  }

  updateAttacks(time: number, delta: number): void {
    for (const attack of this.attacks.values()) {
      setDamageSource(attack.type);
      attack.update(time, delta);
      clearDamageSource();
    }
  }
}
