import Phaser from 'phaser';
import type { GameContext } from './GameContext';
import { SoundManager } from '../audio/SoundManager';
import { shouldShowVfx } from './GraphicsSettings';

const MEGA = {
  killsToFull: 500,
  durationMs: 15_000,
  invincibilityMs: 3_000,
  damageMultiplier: 1.5,
  attackSpeedMultiplier: 2.0,
} as const;

// ── Module singleton ──────────────────────────────────────────────
let instance: MegaSystem | null = null;

export function initMegaSystem(ctx: GameContext): MegaSystem {
  instance = new MegaSystem(ctx);
  return instance;
}

export function getMegaSystem(): MegaSystem | null {
  return instance;
}

/**
 * MegaSystem — Mega Evolution mechanic.
 *
 * Accumulates kills while inactive. At 500 kills the gauge is full and
 * the player can activate Mega mode for 15 seconds of buffed damage,
 * doubled attack speed, brief invincibility, and golden aura visuals.
 *
 * Module singleton accessed via `getMegaSystem()` so attacks and other
 * systems can query attack speed multiplier without coupling.
 */
/** Mapping: starterKey → mega walk sprite key (PMDCollab sprite/{dex}/0000/0001/) */
const MEGA_SPRITE_MAP: Readonly<Record<string, string>> = {
  charmander: 'mega-charizard-x-walk',
  squirtle: 'mega-blastoise-walk',
  bulbasaur: 'mega-venusaur-walk',
};

class MegaSystem {
  private gaugeKills = 0;
  private active = false;
  private activeUntil = 0;
  private auraEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private auraTween: Phaser.Tweens.Tween | null = null;
  private megaSpriteKey: string | null = null;
  private readonly ctx: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
  }

  // ── Kill accumulation ───────────────────────────────────────────
  addKill(): void {
    if (this.active) return; // don't accumulate during mega
    if (this.ctx.player.stats.form !== 'stage2') return; // mega only for final forms
    this.gaugeKills++;
    if (this.gaugeKills >= MEGA.killsToFull) {
      this.ctx.scene.events.emit('mega-ready');
      SoundManager.playMegaReady();
    }
  }

  // ── Activation ──────────────────────────────────────────────────
  activate(gameTime: number): void {
    if (this.active) return;
    if (this.gaugeKills < MEGA.killsToFull) return;

    this.active = true;
    this.activeUntil = gameTime + MEGA.durationMs;
    this.gaugeKills = 0;

    const player = this.ctx.player;
    const scene = this.ctx.scene;

    // Damage buff via existing berry buff system
    player.applyBuff('megaDamage', MEGA.damageMultiplier, MEGA.durationMs, scene.time.now);

    // Invincibility
    player.setInvincible(scene.time.now + MEGA.invincibilityMs);

    // Sprite swap (Mega Charizard X has a real walk sprite; others use tint only)
    const starterKey = this.ctx.starterConfig.key;
    const megaKey = MEGA_SPRITE_MAP[starterKey];
    if (megaKey && scene.textures.exists(megaKey)) {
      this.megaSpriteKey = megaKey;
      player.setSpriteOverride(megaKey);
      player.setScale(2.0); // Mega forms are slightly larger
    }

    // Screen shake
    scene.cameras.main.shake(300, 0.01);

    // Golden tint pulse
    this.auraTween = scene.tweens.add({
      targets: player,
      duration: 300,
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        // Alternate between gold tints
        player.setTint(Math.random() > 0.5 ? 0xffd700 : 0xffaa00);
      },
    });

    // Golden particle aura following player
    if (shouldShowVfx()) {
      this.auraEmitter = scene.add.particles(0, 0, 'mega-particle', {
        follow: player,
        speed: { min: 20, max: 60 },
        lifespan: 600,
        quantity: 2,
        frequency: 100,
        scale: { start: 1.5, end: 0 },
        tint: [0xffd700, 0xffaa00, 0xffffff],
        blendMode: 'ADD',
      });
    }

    SoundManager.playMegaActivate();
    scene.events.emit('mega-activated');
  }

  // ── Per-frame update ────────────────────────────────────────────
  update(gameTime: number, _delta: number): void {
    if (!this.active) return;

    if (gameTime >= this.activeUntil) {
      this.deactivate();
    }
  }

  // ── Deactivation (internal) ─────────────────────────────────────
  private deactivate(): void {
    this.active = false;

    const player = this.ctx.player;

    // Clear visuals
    player.clearTint();

    if (this.auraTween) {
      this.auraTween.destroy();
      this.auraTween = null;
    }

    if (this.auraEmitter) {
      this.auraEmitter.destroy();
      this.auraEmitter = null;
    }

    // Restore original sprite if it was swapped
    if (this.megaSpriteKey) {
      player.setSpriteOverride(null);
      player.setScale(1.8); // stage2 default scale
      this.megaSpriteKey = null;
    }

    this.ctx.scene.events.emit('mega-ended');
  }

  // ── Public queries ──────────────────────────────────────────────
  isActive(): boolean {
    return this.active;
  }

  getAttackSpeedMultiplier(): number {
    return this.active ? MEGA.attackSpeedMultiplier : 1;
  }

  getGaugeRatio(): number {
    if (this.active) {
      // During mega, gauge empties
      return 0;
    }
    return Math.min(1, this.gaugeKills / MEGA.killsToFull);
  }

  getMegaTimeRemaining(gameTime: number): number {
    if (!this.active) return 0;
    return Math.max(0, this.activeUntil - gameTime);
  }
}
