import Phaser from 'phaser';
import type { GameContext } from './GameContext';
import { Companion } from '../entities/Companion';
import { Enemy } from '../entities/Enemy';
import { getSaveData } from './SaveSystem';

// ── Config ────────────────────────────────────────────────────────────
const COMPANION = {
  maxCompanions: 2,
  orbitRadius: 80,
  baseDamage: 5,
  attackCooldownMs: 2000,
  friendBallDropChance: 0.20,
  spriteScale: 0.6,
} as const;

// ── Fallback Pokémon pool (caso pokédex esteja vazia) ────────────────
// Usa Pokémon cujas sprites já existem no jogo
const FALLBACK_COMPANIONS: readonly string[] = [
  'rattata',
  'pidgey',
  'zubat',
] as const;

/** Converte enemy key da Pokédex para texture key do spritesheet */
function toTextureKey(pokedexKey: string): string {
  return `${pokedexKey}-walk`;
}

// ── Module singleton ──────────────────────────────────────────────────
let instance: CompanionSystem | null = null;

export function initCompanionSystem(ctx: GameContext): CompanionSystem {
  instance = new CompanionSystem(ctx);
  return instance;
}

export function getCompanionSystem(): CompanionSystem | null {
  return instance;
}

/**
 * CompanionSystem -- gerencia Pokémon companions que orbitam o player.
 *
 * Companions são obtidos via Friend Ball (drop de bosses com 20% chance).
 * Máximo 2 simultâneos. Cada companion orbita o player com offset angular
 * distinto e dispara projéteis no inimigo mais próximo.
 *
 * Pool de bullets DEDICADO (não compartilha enemyProjectiles).
 */
class CompanionSystem {
  private readonly companions: Companion[] = [];
  private readonly companionBullets: Phaser.Physics.Arcade.Group;
  private bulletCollider: Phaser.Physics.Arcade.Collider | null = null;
  private readonly ctx: GameContext;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    const scene = ctx.scene;

    // Pool dedicado para projéteis de companions
    this.companionBullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 20,
      runChildUpdate: false,
      allowGravity: false,
    });

    // Overlap: companion bullet → enemy = dano
    this.bulletCollider = scene.physics.add.overlap(
      this.companionBullets,
      ctx.enemyGroup,
      (bulletObj, enemyObj) => {
        const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
        const enemy = enemyObj as Enemy;
        if (!bullet.active || !enemy.active) return;

        const dmg = bullet.getData('damage') as number;
        enemy.takeDamage(dmg);

        bullet.setActive(false).setVisible(false);
        const body = bullet.body as Phaser.Physics.Arcade.Body | null;
        if (body) body.stop();
      },
    );

    // Escuta evento de disparo emitido pelo Companion
    scene.events.on(
      'companion-fire',
      this.handleCompanionFire,
      this,
    );
  }

  // ── Update (chamado todo frame pelo GameScene) ─────────────────────
  update(time: number, delta: number): void {
    const player = this.ctx.player;
    for (let i = 0; i < this.companions.length; i++) {
      const companion = this.companions[i];
      if (companion.active) {
        companion.update(time, delta, player);
      }
    }
  }

  // ── Handler do evento companion-fire ───────────────────────────────
  private handleCompanionFire = (
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    damage: number,
  ): void => {
    // Encontra o companion que está na posição (fromX, fromY) e delega fire
    for (const companion of this.companions) {
      if (
        companion.active &&
        Math.abs(companion.x - fromX) < 2 &&
        Math.abs(companion.y - fromY) < 2
      ) {
        companion.fire(this.companionBullets, targetX, targetY, damage);
        return;
      }
    }
  };

  // ── Try drop Friend Ball (chamado quando boss morre) ───────────────
  tryDropFriendBall(x: number, y: number): boolean {
    if (this.companions.length >= COMPANION.maxCompanions) return false;
    if (Math.random() > COMPANION.friendBallDropChance) return false;

    const scene = this.ctx.scene;
    const ball = scene.physics.add.sprite(x, y, 'friend-ball');
    ball.setData('pickupType', 'friendBall');
    ball.setDepth(5);
    ball.setScale(1.2);

    // Bobbing tween para chamar atenção
    scene.tweens.add({
      targets: ball,
      y: y - 8,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Glow pulse
    scene.tweens.add({
      targets: ball,
      alpha: { from: 1, to: 0.6 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.ctx.pickups.add(ball);
    return true;
  }

  // ── Adiciona companion ao player ───────────────────────────────────
  addCompanion(key: string): Companion | null {
    if (this.companions.length >= COMPANION.maxCompanions) return null;

    const scene = this.ctx.scene;
    const player = this.ctx.player;

    // Offset angular: espaça companions uniformemente
    const orbitOffset = this.companions.length * Math.PI;

    const textureKey = toTextureKey(key);
    const companion = new Companion(
      scene,
      player.x,
      player.y,
      textureKey,
      orbitOffset,
    );

    this.companions.push(companion);

    // Spawn-in visual: fade + scale
    companion.setAlpha(0);
    companion.setScale(0);
    scene.tweens.add({
      targets: companion,
      alpha: 1,
      scaleX: COMPANION.spriteScale,
      scaleY: COMPANION.spriteScale,
      duration: 500,
      ease: 'Back.Out',
    });

    return companion;
  }

  // ── Retorna 3 escolhas aleatórias da pokédex desbloqueada ──────────
  getAvailableChoices(): string[] {
    const save = getSaveData();
    const unlockedKeys = Object.keys(save.pokedex);

    // Remove Pokémon que já são companions ativos
    const activeKeys = new Set(this.companions.map((c) => c.getKey()));
    const pool = unlockedKeys.filter((k) => !activeKeys.has(k));

    // Se pool insuficiente, completa com fallback
    const effectivePool = pool.length > 0 ? pool : [...FALLBACK_COMPANIONS];

    const choices: string[] = [];
    const usedIndices = new Set<number>();
    const targetCount = Math.min(3, effectivePool.length);

    while (choices.length < targetCount) {
      const idx = Phaser.Math.Between(0, effectivePool.length - 1);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        choices.push(effectivePool[idx]);
      }
    }

    // Se menos de 3 disponíveis, repete para completar
    while (choices.length < 3) {
      choices.push(choices[choices.length % targetCount]);
    }

    return choices;
  }

  // ── Player evoluiu — notifica todos os companions ──────────────────
  onPlayerEvolve(): void {
    for (const companion of this.companions) {
      companion.onPlayerEvolve();
    }
  }

  // ── Getter readonly para UI ────────────────────────────────────────
  getCompanions(): readonly Companion[] {
    return this.companions;
  }

  // ── Getter para config (UI pode ler) ───────────────────────────────
  getMaxCompanions(): number {
    return COMPANION.maxCompanions;
  }

  // ── Cleanup (chamado no shutdown da scene) ─────────────────────────
  destroy(): void {
    const scene = this.ctx.scene;
    scene.events.off('companion-fire', this.handleCompanionFire, this);

    if (this.bulletCollider) {
      scene.physics.world.removeCollider(this.bulletCollider);
      this.bulletCollider = null;
    }

    for (const companion of this.companions) {
      companion.destroy();
    }
    this.companions.length = 0;

    this.companionBullets.destroy(true);

    instance = null;
  }
}
