import Phaser from 'phaser';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { getSpatialGrid } from './SpatialHashGrid';
import { shouldShowVfx } from './GraphicsSettings';

// ═══════════════════════════════════════════════════════════════
// Spore pool (module-level, persists after enemy death)
// ═══════════════════════════════════════════════════════════════
interface SporeZone {
  readonly x: number;
  readonly y: number;
  readonly circle: Phaser.GameObjects.Arc;
  readonly expiresAt: number;
  readonly dps: number;
}

const activeSpores: SporeZone[] = [];
const MAX_SPORES = 30;
const SPORE_RADIUS = 20;
const SPORE_DURATION = 5000;
const SPORE_DPS = 2;

/** Process all active spore zones — call once per frame from SpawnSystem */
export function processSpores(player: Player, time: number): void {
  for (let i = activeSpores.length - 1; i >= 0; i--) {
    const spore = activeSpores[i];
    if (time >= spore.expiresAt) {
      if (spore.circle.active) spore.circle.destroy();
      activeSpores.splice(i, 1);
      continue;
    }
    const dist = Phaser.Math.Distance.Between(spore.x, spore.y, player.x, player.y);
    if (dist <= SPORE_RADIUS) {
      player.applyPoison(spore.dps, 500, time);
    }
  }
}

/** Clean all spores (call on scene shutdown) */
export function clearSpores(): void {
  for (const s of activeSpores) {
    if (s.circle.active) s.circle.destroy();
  }
  activeSpores.length = 0;
}

// ═══════════════════════════════════════════════════════════════
// Main dispatcher
// ═══════════════════════════════════════════════════════════════

export function updateBehavior(
  enemy: Enemy,
  player: Player,
  time: number,
  delta: number,
): void {
  if (!enemy.active || !enemy.body) return;

  switch (enemy.behavior) {
    case 'charger':    updateCharger(enemy, player, time); break;
    case 'swooper':    updateSwooper(enemy, player, time); break;
    case 'circler':    updateCircler(enemy, player, time, delta); break;
    case 'berserker':  updateBerserker(enemy, player, time); break;
    case 'dasher':     updateDasher(enemy, player, time); break;
    case 'tank':       updateTank(enemy, player); break;
    case 'sporeWalker': updateSporeWalker(enemy, player, time); break;
    case 'confuser':   updateConfuser(enemy, player, time); break;
    case 'healer':     updateHealer(enemy, player, time); break;
    case 'teleporter': updateTeleporter(enemy, player, time); break;
    default: break;
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. CHARGER (Geodude)
// 60% speed walk. Every 4s: pause 0.5s → charge 3x speed 1.5s
// ═══════════════════════════════════════════════════════════════
function updateCharger(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('ch_next')) {
    d.set('ch_next', time + 4000);
    d.set('ch_state', 0); // 0=walk, 1=pause, 2=charge
  }

  const state = d.get('ch_state') as number;
  const speed = enemy.getEffectiveSpeed();

  if (state === 0) {
    // Walk at 60%
    const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    enemy.setVelocity(Math.cos(a) * speed * 0.6, Math.sin(a) * speed * 0.6);
    if (time >= (d.get('ch_next') as number)) {
      d.set('ch_state', 1);
      d.set('ch_pauseEnd', time + 500);
      enemy.setVelocity(0, 0);
      enemy.setTint(0xff8844);
    }
  } else if (state === 1) {
    // Pause
    enemy.setVelocity(0, 0);
    if (time >= (d.get('ch_pauseEnd') as number)) {
      d.set('ch_state', 2);
      d.set('ch_chargeEnd', time + 1500);
      const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
      d.set('ch_angle', a);
      enemy.setTint(0xff4400);
    }
  } else {
    // Charge at 3x in locked direction
    const a = d.get('ch_angle') as number;
    enemy.setVelocity(Math.cos(a) * speed * 3, Math.sin(a) * speed * 3);
    if (time >= (d.get('ch_chargeEnd') as number)) {
      d.set('ch_state', 0);
      d.set('ch_next', time + 4000);
      enemy.clearTint();
    }
  }
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 2. SWOOPER (Golbat)
// Sinusoidal arc movement. Pauses 0.8s every 3s
// ═══════════════════════════════════════════════════════════════
function updateSwooper(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('sw_nextPause')) {
    d.set('sw_nextPause', time + 3000);
    d.set('sw_paused', false);
    d.set('sw_phase', Math.random() * Math.PI * 2);
  }

  if (d.get('sw_paused') as boolean) {
    enemy.setVelocity(0, 0);
    if (time >= (d.get('sw_pauseEnd') as number)) {
      d.set('sw_paused', false);
      d.set('sw_nextPause', time + 3000);
    }
    enemy.updateAnimation();
    return;
  }

  if (time >= (d.get('sw_nextPause') as number)) {
    d.set('sw_paused', true);
    d.set('sw_pauseEnd', time + 800);
    enemy.setVelocity(0, 0);
    enemy.updateAnimation();
    return;
  }

  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  // Sine offset perpendicular to movement direction
  const phase = (d.get('sw_phase') as number) + time * 0.003;
  const perpOffset = Math.sin(phase) * speed * 0.6;
  const vx = Math.cos(a) * speed + Math.cos(a + Math.PI / 2) * perpOffset;
  const vy = Math.sin(a) * speed + Math.sin(a + Math.PI / 2) * perpOffset;
  enemy.setVelocity(vx, vy);
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 3. CIRCLER (Pidgeotto)
// Orbits player at r=160. Spirals inward 2px/s. Resets on contact.
// ═══════════════════════════════════════════════════════════════
function updateCircler(enemy: Enemy, player: Player, _time: number, delta: number): void {
  const d = enemy.data;
  if (!d.has('ci_angle')) {
    const a = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
    d.set('ci_angle', a);
    d.set('ci_radius', 160);
  }

  let radius = d.get('ci_radius') as number;
  let angle = d.get('ci_angle') as number;

  // Spiral inward
  radius = Math.max(20, radius - 2 * (delta / 1000));

  // Orbit speed: angular velocity inversely proportional to radius
  const orbitSpeed = enemy.getEffectiveSpeed() / Math.max(radius, 30);
  angle += orbitSpeed * (delta / 1000);

  // Target position on orbit
  const tx = player.x + Math.cos(angle) * radius;
  const ty = player.y + Math.sin(angle) * radius;

  const speed = enemy.getEffectiveSpeed();
  const moveA = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
  enemy.setVelocity(Math.cos(moveA) * speed, Math.sin(moveA) * speed);

  d.set('ci_angle', angle);
  d.set('ci_radius', radius);

  // Reset orbit on contact with player
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
  if (dist < 24) {
    d.set('ci_radius', 160);
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 4. BERSERKER (Cubone)
// Normal movement. HP<50%: speed ×2, dmg +50%, scale 1.15x
// ═══════════════════════════════════════════════════════════════
function updateBerserker(enemy: Enemy, player: Player, _time: number): void {
  const d = enemy.data;

  // Check for berserk mode
  if (!d.has('bk_active') && enemy.getHpRatio() < 0.5) {
    d.set('bk_active', true);
    enemy.applyEnrage(2);
    enemy.applyDamageBuff(1.5);
    enemy.setScale(enemy.scaleX * 1.15);
    enemy.setTint(0xff4444);
    // Flash effect
    if (shouldShowVfx() && enemy.scene) {
      const flash = enemy.scene.add.circle(enemy.x, enemy.y, 30, 0xff0000, 0.4).setDepth(3);
      enemy.scene.tweens.add({
        targets: flash, scale: 2, alpha: 0, duration: 400,
        onComplete: () => flash.destroy(),
      });
    }
  }

  // Normal moveToward
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 5. DASHER (Crobat)
// Normal move + dash 100px every 3s toward player
// ═══════════════════════════════════════════════════════════════
function updateDasher(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('da_nextDash')) {
    d.set('da_nextDash', time + 3000);
    d.set('da_dashing', false);
  }

  if (d.get('da_dashing') as boolean) {
    // During dash, just let existing velocity play out
    if (time >= (d.get('da_dashEnd') as number)) {
      d.set('da_dashing', false);
      d.set('da_nextDash', time + 3000);
      enemy.clearTint();
    }
    enemy.updateAnimation();
    return;
  }

  // Normal movement
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);

  // Trigger dash
  if (time >= (d.get('da_nextDash') as number)) {
    d.set('da_dashing', true);
    d.set('da_dashEnd', time + 250); // 250ms dash = 100px at ~400 speed
    const dashSpeed = speed * 4;
    enemy.setVelocity(Math.cos(a) * dashSpeed, Math.sin(a) * dashSpeed);
    enemy.setTint(0xaa44ff);
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 6. TANK (Marowak)
// Slow, high HP. Body has extra mass to push smaller enemies.
// ═══════════════════════════════════════════════════════════════
function updateTank(enemy: Enemy, player: Player): void {
  const d = enemy.data;
  if (!d.has('tk_init')) {
    d.set('tk_init', true);
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.mass = 4; // Pushes smaller enemies
  }

  // Simple moveToward (slow speed is baked into config)
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 7. SPORE WALKER (Venonat)
// Drops poison spore every 0.5s. Spores last 5s, deal 2dps.
// ═══════════════════════════════════════════════════════════════
function updateSporeWalker(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('sp_nextSpore')) {
    d.set('sp_nextSpore', time + 500);
  }

  // Movement: normal toward player
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);

  // Drop spore
  if (time >= (d.get('sp_nextSpore') as number) && enemy.scene) {
    d.set('sp_nextSpore', time + 500);

    // Remove oldest spore if at limit
    if (activeSpores.length >= MAX_SPORES) {
      const old = activeSpores.shift();
      if (old && old.circle.active) old.circle.destroy();
    }

    // Create spore zone
    let circle: Phaser.GameObjects.Arc | null = null;
    if (shouldShowVfx()) {
      circle = enemy.scene.add.circle(enemy.x, enemy.y, SPORE_RADIUS, 0x88ff44, 0.25).setDepth(2);
      // Fade in
      circle.setAlpha(0);
      enemy.scene.tweens.add({ targets: circle, alpha: 0.25, duration: 200 });
      // Fade out before expiry
      enemy.scene.time.delayedCall(SPORE_DURATION - 500, () => {
        if (circle && circle.active) {
          enemy.scene?.tweens.add({ targets: circle, alpha: 0, duration: 500 });
        }
      });
    } else {
      // Create invisible placeholder so the zone still works
      circle = enemy.scene.add.circle(enemy.x, enemy.y, SPORE_RADIUS, 0x000000, 0).setDepth(0);
    }

    activeSpores.push({
      x: enemy.x,
      y: enemy.y,
      circle,
      expiresAt: time + SPORE_DURATION,
      dps: SPORE_DPS,
    });
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 8. CONFUSER (Venomoth)
// Aura r80px. Player inside 1.5s → confused 2s. Cooldown 8s.
// ═══════════════════════════════════════════════════════════════
const CONFUSER_RADIUS = 80;
const CONFUSER_BUILDUP = 1500;
const CONFUSER_EFFECT_DURATION = 2000;
const CONFUSER_COOLDOWN = 8000;

function updateConfuser(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('cf_lastApplied')) {
    d.set('cf_lastApplied', 0);
    d.set('cf_inRangeSince', 0);
  }

  // Normal movement toward player
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);

  // Aura check
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
  const lastApplied = d.get('cf_lastApplied') as number;

  if (dist <= CONFUSER_RADIUS && time - lastApplied >= CONFUSER_COOLDOWN) {
    let inRangeSince = d.get('cf_inRangeSince') as number;
    if (inRangeSince === 0) {
      d.set('cf_inRangeSince', time);
      inRangeSince = time;
    }

    // Visual: pulsing aura
    if (shouldShowVfx() && !d.get('cf_auraCircle') && enemy.scene) {
      const aura = enemy.scene.add.circle(enemy.x, enemy.y, CONFUSER_RADIUS, 0xff66aa, 0.1).setDepth(2);
      d.set('cf_auraCircle', aura);
    }
    const aura = d.get('cf_auraCircle') as Phaser.GameObjects.Arc | undefined;
    if (aura?.active) aura.setPosition(enemy.x, enemy.y);

    // Apply confusion after buildup
    if (time - inRangeSince >= CONFUSER_BUILDUP) {
      player.applyConfusion(CONFUSER_EFFECT_DURATION, time);
      d.set('cf_lastApplied', time);
      d.set('cf_inRangeSince', 0);
      if (aura?.active) { aura.destroy(); d.set('cf_auraCircle', null); }
    }
  } else {
    d.set('cf_inRangeSince', 0);
    const aura = d.get('cf_auraCircle') as Phaser.GameObjects.Arc | undefined;
    if (aura?.active) { aura.destroy(); d.set('cf_auraCircle', null); }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 9. HEALER (Butterfree)
// Slow. Heals enemies r100px 3HP/s. Flees from player.
// ═══════════════════════════════════════════════════════════════
const HEALER_RADIUS = 100;
const HEALER_HPS = 3;

function updateHealer(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('hl_lastHeal')) {
    d.set('hl_lastHeal', 0);
  }

  // Flee from player
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y); // away from player
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);

  // Heal nearby enemies every ~1s
  const lastHeal = d.get('hl_lastHeal') as number;
  if (time - lastHeal >= 1000) {
    d.set('hl_lastHeal', time);
    const nearby = getSpatialGrid().queryRadius(enemy.x, enemy.y, HEALER_RADIUS);
    for (const other of nearby) {
      if (other === enemy) continue;
      other.heal(HEALER_HPS);
      other.setTint(0x44ff44);
      // Clear tint after 200ms (batch)
      if (enemy.scene) {
        enemy.scene.time.delayedCall(200, () => {
          if (other.active) other.clearTint();
        });
      }
    }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 10. TELEPORTER (Alakazam)
// Move at 40% speed. Every 5s: fade → reappear behind player.
// ═══════════════════════════════════════════════════════════════
function updateTeleporter(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('tp_nextTp')) {
    d.set('tp_nextTp', time + 5000);
    d.set('tp_teleporting', false);
  }

  if (d.get('tp_teleporting') as boolean) {
    enemy.setVelocity(0, 0);
    enemy.updateAnimation();
    return;
  }

  // Move at 40% speed
  const speed = enemy.getEffectiveSpeed() * 0.4;
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  enemy.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);

  // Trigger teleport
  if (time >= (d.get('tp_nextTp') as number) && enemy.scene) {
    d.set('tp_teleporting', true);
    enemy.setVelocity(0, 0);
    enemy.setAlpha(0.3);

    // Reappear behind player after 400ms
    enemy.scene.time.delayedCall(400, () => {
      if (!enemy.active) return;
      // "Behind" player = opposite of player's facing direction + some randomness
      const behindAngle = a + Math.PI + Phaser.Math.FloatBetween(-0.5, 0.5);
      const behindDist = Phaser.Math.FloatBetween(40, 80);
      enemy.setPosition(
        player.x + Math.cos(behindAngle) * behindDist,
        player.y + Math.sin(behindAngle) * behindDist,
      );
      enemy.setAlpha(1);
      enemy.setTint(0xaa44ff);

      enemy.scene.time.delayedCall(150, () => {
        if (enemy.active) enemy.clearTint();
      });

      d.set('tp_teleporting', false);
      d.set('tp_nextTp', time + 5000);
    });
  }

  enemy.updateAnimation();
}
