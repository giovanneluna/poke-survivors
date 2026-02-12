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
// Death cloud pool (module-level, persists after enemy death)
// ═══════════════════════════════════════════════════════════════
interface DeathCloud {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly dps: number;
  readonly endTime: number;
  readonly circle: Phaser.GameObjects.Arc | null;
}

const activeClouds: DeathCloud[] = [];
const MAX_CLOUDS = 20;

/** Spawn a death cloud at position. Called from Enemy.die() or gasSpreader behavior. */
export function spawnDeathCloud(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  dps: number,
  durationMs: number,
): void {
  // Remove oldest if at limit
  if (activeClouds.length >= MAX_CLOUDS) {
    const old = activeClouds.shift();
    if (old?.circle?.active) old.circle.destroy();
  }

  let circle: Phaser.GameObjects.Arc | null = null;
  if (shouldShowVfx()) {
    circle = scene.add.circle(x, y, radius, 0x9944cc, 0.3).setDepth(2);
    // Fade-out in last 1000ms
    const fadeDelay = Math.max(0, durationMs - 1000);
    scene.time.delayedCall(fadeDelay, () => {
      if (circle?.active) {
        scene.tweens.add({ targets: circle, alpha: 0, duration: 1000 });
      }
    });
  }

  const now = scene.time.now;
  activeClouds.push({ x, y, radius, dps, endTime: now + durationMs, circle });
}

/** Process all active death clouds — call once per frame from SpawnSystem */
export function processDeathClouds(player: Player, time: number, _delta: number): void {
  for (let i = activeClouds.length - 1; i >= 0; i--) {
    const cloud = activeClouds[i];
    if (time >= cloud.endTime) {
      if (cloud.circle?.active) cloud.circle.destroy();
      activeClouds.splice(i, 1);
      continue;
    }
    const dist = Phaser.Math.Distance.Between(cloud.x, cloud.y, player.x, player.y);
    if (dist <= cloud.radius) {
      // Apply as poison DoT (same pattern as spore zones)
      player.applyPoison(cloud.dps, 500, time);
    }
  }
}

/** Clean all death clouds (call on scene shutdown) */
export function clearDeathClouds(): void {
  for (const c of activeClouds) {
    if (c.circle?.active) c.circle.destroy();
  }
  activeClouds.length = 0;
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
    case 'deathCloud': updateDeathCloudEnemy(enemy, player); break;
    case 'gasSpreader': updateGasSpreader(enemy, player, time); break;
    case 'puller': updatePuller(enemy, player, delta); break;
    case 'pullerElite': updatePullerElite(enemy, player, time, delta); break;
    case 'trapper': updateTrapper(enemy, player); break;
    case 'trapperElite': updateTrapperElite(enemy, player); break;
    case 'rammer': updateRammer(enemy, player, time); break;
    case 'slasher': updateSlasher(enemy, player, time); break;
    case 'shielder': updateShielder(enemy, player, time); break;
    case 'leaper': updateLeaper(enemy, player, time); break;
    case 'stunner': updateStunner(enemy, player, time); break;
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
      enemy.playAttackAnim();
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
    enemy.playAttackAnim();
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

// ═══════════════════════════════════════════════════════════════
// 11. DEATH CLOUD (Koffing)
// No special movement — walks toward player. Cloud spawned on die().
// ═══════════════════════════════════════════════════════════════
function updateDeathCloudEnemy(enemy: Enemy, player: Player): void {
  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 12. GAS SPREADER (Weezing)
// Drops mini death clouds every 3s while walking toward player.
// ═══════════════════════════════════════════════════════════════
const GAS_SPREADER_INTERVAL = 3000;
const GAS_SPREADER_RADIUS = 30;
const GAS_SPREADER_DPS = 3;
const GAS_SPREADER_DURATION = 3000;

function updateGasSpreader(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('gs_nextDrop')) {
    d.set('gs_nextDrop', time + GAS_SPREADER_INTERVAL);
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  // Move toward player
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;

  // Drop gas cloud
  if (time >= (d.get('gs_nextDrop') as number) && enemy.scene) {
    d.set('gs_nextDrop', time + GAS_SPREADER_INTERVAL);
    spawnDeathCloud(enemy.scene, enemy.x, enemy.y, GAS_SPREADER_RADIUS, GAS_SPREADER_DPS, GAS_SPREADER_DURATION);
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 13. PULLER (Magnemite)
// Pulls player toward self while moving toward player.
// ═══════════════════════════════════════════════════════════════
const PULL_FORCE = 15;
const PULL_RANGE = 150;

function updatePuller(enemy: Enemy, player: Player, delta: number): void {
  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;

  // Pull player toward self
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
  if (dist <= PULL_RANGE) {
    const playerBody = player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) {
      const pullAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
      playerBody.velocity.x += Math.cos(pullAngle) * PULL_FORCE * (delta / 1000) * 60;
      playerBody.velocity.y += Math.sin(pullAngle) * PULL_FORCE * (delta / 1000) * 60;
    }
    if (shouldShowVfx()) {
      enemy.setTint(0x44aaff);
    }
  } else {
    enemy.clearTint();
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 14. PULLER ELITE (Magneton)
// Stronger pull + periodic stun pulse.
// ═══════════════════════════════════════════════════════════════
const PULL_FORCE_ELITE = 30;
const PULL_RANGE_ELITE = 200;
const PULLER_ELITE_STUN_COOLDOWN = 5000;
const PULLER_ELITE_STUN_RANGE = 120;

function updatePullerElite(enemy: Enemy, player: Player, time: number, delta: number): void {
  const d = enemy.data;
  if (!d.has('pe_nextWave')) {
    d.set('pe_nextWave', time + PULLER_ELITE_STUN_COOLDOWN);
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;

  // Strong pull
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
  if (dist <= PULL_RANGE_ELITE) {
    const playerBody = player.body as Phaser.Physics.Arcade.Body | null;
    if (playerBody) {
      const pullAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
      playerBody.velocity.x += Math.cos(pullAngle) * PULL_FORCE_ELITE * (delta / 1000) * 60;
      playerBody.velocity.y += Math.sin(pullAngle) * PULL_FORCE_ELITE * (delta / 1000) * 60;
    }
  }

  // Stun pulse
  if (time >= (d.get('pe_nextWave') as number) && dist <= PULLER_ELITE_STUN_RANGE) {
    d.set('pe_nextWave', time + PULLER_ELITE_STUN_COOLDOWN);
    player.applyStun(300, time);
    if (shouldShowVfx()) {
      enemy.setTint(0xffff44);
      if (enemy.scene) {
        enemy.scene.time.delayedCall(200, () => {
          if (enemy.active) enemy.clearTint();
        });
      }
    }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 15. TRAPPER (Tentacool)
// Simple move toward player. Stun on contact is via contactEffect.
// ═══════════════════════════════════════════════════════════════
function updateTrapper(enemy: Enemy, player: Player): void {
  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;
  if (shouldShowVfx()) enemy.setTint(0x44ffaa);
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 16. TRAPPER ELITE (Tentacruel)
// Same as trapper but with stronger stun via contactEffect.
// ═══════════════════════════════════════════════════════════════
function updateTrapperElite(enemy: Enemy, player: Player): void {
  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;
  if (shouldShowVfx()) enemy.setTint(0xff4444);
  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 17. RAMMER (Rhyhorn/Rhydon)
// State machine: idle → aim → charge → recover.
// Rhydon (hp>200) gets double charge before recover.
// ═══════════════════════════════════════════════════════════════
const RAMMER_IDLE_SPEED_MULT = 0.6;
const RAMMER_CHARGE_SPEED = 250;
const RAMMER_CHARGE_SPEED_ELITE = 300;
const RAMMER_AIM_DURATION = 800;
const RAMMER_CHARGE_DURATION = 1500;
const RAMMER_RECOVER_DURATION = 1000;
const RAMMER_CYCLE = 4000;

function updateRammer(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('rm_state')) {
    d.set('rm_state', 0);
    d.set('rm_next', time + RAMMER_CYCLE);
    d.set('rm_angle', 0);
    d.set('rm_stateEnd', 0);
    d.set('rm_chargeCount', 0);
    d.set('rm_isElite', enemy.enemyKey === 'rhydon');
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const state = d.get('rm_state') as number;
  const speed = enemy.getEffectiveSpeed();
  const isElite = d.get('rm_isElite') as boolean;
  const chargeSpeed = isElite ? RAMMER_CHARGE_SPEED_ELITE : RAMMER_CHARGE_SPEED;

  if (state === 0) {
    // Idle: walk toward player at reduced speed
    const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
    body.velocity.x = Math.cos(a) * speed * RAMMER_IDLE_SPEED_MULT;
    body.velocity.y = Math.sin(a) * speed * RAMMER_IDLE_SPEED_MULT;
    if (time >= (d.get('rm_next') as number)) {
      d.set('rm_state', 1);
      d.set('rm_stateEnd', time + RAMMER_AIM_DURATION);
      d.set('rm_chargeCount', 0);
    }
  } else if (state === 1) {
    // Aiming: stop and lock angle
    body.velocity.set(0, 0);
    d.set('rm_angle', Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y));
    enemy.setTint(0xff8844);
    if (time >= (d.get('rm_stateEnd') as number)) {
      d.set('rm_state', 2);
      d.set('rm_stateEnd', time + RAMMER_CHARGE_DURATION);
      enemy.playAttackAnim();
    }
  } else if (state === 2) {
    // Charging: move in locked angle
    const a = d.get('rm_angle') as number;
    body.velocity.x = Math.cos(a) * chargeSpeed;
    body.velocity.y = Math.sin(a) * chargeSpeed;
    enemy.setTint(0xff4400);
    if (time >= (d.get('rm_stateEnd') as number)) {
      const count = (d.get('rm_chargeCount') as number) + 1;
      d.set('rm_chargeCount', count);
      if (isElite && count < 2) {
        // Re-aim for second charge
        d.set('rm_state', 1);
        d.set('rm_stateEnd', time + RAMMER_AIM_DURATION / 2);
      } else {
        d.set('rm_state', 3);
        d.set('rm_stateEnd', time + RAMMER_RECOVER_DURATION);
      }
    }
  } else {
    // Recovering: stop
    body.velocity.set(0, 0);
    enemy.clearTint();
    if (time >= (d.get('rm_stateEnd') as number)) {
      d.set('rm_state', 0);
      d.set('rm_next', time + RAMMER_CYCLE);
    }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 18. SLASHER (Scyther)
// Orbits at distance, winds up, slashes through player, returns.
// ═══════════════════════════════════════════════════════════════
const SLASHER_ORBIT_DIST = 150;
const SLASHER_CYCLE = 3500;
const SLASHER_WINDUP = 500;
const SLASHER_SLASH_DURATION = 400;
const SLASHER_SLASH_SPEED = 400;
const SLASHER_RETURN_DURATION = 1500;

function updateSlasher(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('sl_state')) {
    d.set('sl_state', 0);
    d.set('sl_next', time + SLASHER_CYCLE);
    d.set('sl_angle', 0);
    d.set('sl_stateEnd', 0);
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const state = d.get('sl_state') as number;
  const speed = enemy.getEffectiveSpeed();
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

  if (state === 0) {
    // Orbiting: maintain ~150px from player
    if (dist < 120) {
      // Move away
      body.velocity.x = -Math.cos(angle) * speed;
      body.velocity.y = -Math.sin(angle) * speed;
    } else if (dist > 180) {
      // Move toward
      body.velocity.x = Math.cos(angle) * speed;
      body.velocity.y = Math.sin(angle) * speed;
    } else {
      // Perpendicular orbit
      body.velocity.x = -Math.sin(angle) * speed * 0.8;
      body.velocity.y = Math.cos(angle) * speed * 0.8;
    }
    if (time >= (d.get('sl_next') as number)) {
      d.set('sl_state', 1);
      d.set('sl_stateEnd', time + SLASHER_WINDUP);
    }
  } else if (state === 1) {
    // Winding up
    body.velocity.set(0, 0);
    d.set('sl_angle', angle);
    enemy.setTint(0xff2222);
    if (time >= (d.get('sl_stateEnd') as number)) {
      d.set('sl_state', 2);
      d.set('sl_stateEnd', time + SLASHER_SLASH_DURATION);
    }
  } else if (state === 2) {
    // Slashing through player
    const a = d.get('sl_angle') as number;
    body.velocity.x = Math.cos(a) * SLASHER_SLASH_SPEED;
    body.velocity.y = Math.sin(a) * SLASHER_SLASH_SPEED;
    if (shouldShowVfx()) enemy.setTint(0xaaffaa);
    if (time >= (d.get('sl_stateEnd') as number)) {
      d.set('sl_state', 3);
      d.set('sl_stateEnd', time + SLASHER_RETURN_DURATION);
    }
  } else {
    // Returning to orbit distance
    enemy.clearTint();
    if (dist < SLASHER_ORBIT_DIST) {
      body.velocity.x = -Math.cos(angle) * speed * 0.6;
      body.velocity.y = -Math.sin(angle) * speed * 0.6;
    } else {
      body.velocity.x = Math.cos(angle) * speed * 0.4;
      body.velocity.y = Math.sin(angle) * speed * 0.4;
    }
    if (time >= (d.get('sl_stateEnd') as number)) {
      d.set('sl_state', 0);
      d.set('sl_next', time + SLASHER_CYCLE);
    }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 19. SHIELDER (Mr. Mime)
// Shields nearby allies, making them immune to damage temporarily.
// ═══════════════════════════════════════════════════════════════
const SHIELDER_COOLDOWN = 6000;
const SHIELDER_DURATION = 3000;
const SHIELDER_RANGE = 150;

function updateShielder(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('sh_nextShield')) {
    d.set('sh_nextShield', time + SHIELDER_COOLDOWN);
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  // Move toward player
  const speed = enemy.getEffectiveSpeed();
  const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  body.velocity.x = Math.cos(a) * speed;
  body.velocity.y = Math.sin(a) * speed;

  // Shield nearby ally
  if (time >= (d.get('sh_nextShield') as number)) {
    d.set('sh_nextShield', time + SHIELDER_COOLDOWN);
    const nearby = getSpatialGrid().queryRadius(enemy.x, enemy.y, SHIELDER_RANGE);
    for (const other of nearby) {
      if (other === enemy) continue;
      // Don't shield bosses or already shielded allies
      if ('bossAttacks' in other) continue;
      const shieldEnd = other.data.get('shieldEnd') as number | undefined;
      if (shieldEnd && time < shieldEnd) continue;

      other.data.set('shielded', true);
      other.data.set('shieldEnd', time + SHIELDER_DURATION);
      if (shouldShowVfx()) other.setTint(0x4488ff);
      break; // Shield only 1 ally per cycle
    }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 20. LEAPER (Hitmonlee)
// Stalks at distance, crouches, leaps to player position, stuns if miss.
// ═══════════════════════════════════════════════════════════════
const LEAPER_STALK_DIST = 220;
const LEAPER_CYCLE = 4000;
const LEAPER_WINDUP = 600;
const LEAPER_LEAP_SPEED = 400;
const LEAPER_LEAP_DURATION = 300;
const LEAPER_STUN_DURATION = 2000;
const LEAPER_HIT_RANGE = 35;

function updateLeaper(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('lp_state')) {
    d.set('lp_state', 0);
    d.set('lp_next', time + LEAPER_CYCLE);
    d.set('lp_targetX', 0);
    d.set('lp_targetY', 0);
    d.set('lp_stateEnd', 0);
    d.set('lp_origScaleY', enemy.scaleY);
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const state = d.get('lp_state') as number;
  const speed = enemy.getEffectiveSpeed();
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

  if (state === 0) {
    // Stalking: maintain distance
    if (dist < LEAPER_STALK_DIST - 40) {
      body.velocity.x = -Math.cos(angle) * speed * 0.5;
      body.velocity.y = -Math.sin(angle) * speed * 0.5;
    } else if (dist > LEAPER_STALK_DIST + 40) {
      body.velocity.x = Math.cos(angle) * speed;
      body.velocity.y = Math.sin(angle) * speed;
    } else {
      body.velocity.set(0, 0);
    }
    if (time >= (d.get('lp_next') as number)) {
      d.set('lp_state', 1);
      d.set('lp_stateEnd', time + LEAPER_WINDUP);
    }
  } else if (state === 1) {
    // Windup: crouch and lock target
    body.velocity.set(0, 0);
    enemy.setScale(enemy.scaleX, (d.get('lp_origScaleY') as number) * 0.8);
    enemy.setTint(0xffcc00);
    d.set('lp_targetX', player.x);
    d.set('lp_targetY', player.y);
    if (time >= (d.get('lp_stateEnd') as number)) {
      enemy.setScale(enemy.scaleX, d.get('lp_origScaleY') as number);
      d.set('lp_state', 2);
      d.set('lp_stateEnd', time + LEAPER_LEAP_DURATION);
      enemy.playAttackAnim();
    }
  } else if (state === 2) {
    // Leaping to locked target
    const tx = d.get('lp_targetX') as number;
    const ty = d.get('lp_targetY') as number;
    const leapAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
    body.velocity.x = Math.cos(leapAngle) * LEAPER_LEAP_SPEED;
    body.velocity.y = Math.sin(leapAngle) * LEAPER_LEAP_SPEED;
    if (time >= (d.get('lp_stateEnd') as number)) {
      // Landing check
      const playerDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      if (playerDist < LEAPER_HIT_RANGE) {
        // Hit
        enemy.clearTint();
        d.set('lp_state', 0);
        d.set('lp_next', time + LEAPER_CYCLE);
      } else {
        // Miss — stunned
        d.set('lp_state', 4);
        d.set('lp_stateEnd', time + LEAPER_STUN_DURATION);
      }
    }
  } else {
    // Stunned after miss (state 4)
    body.velocity.set(0, 0);
    enemy.setTint(0x888888);
    if (time >= (d.get('lp_stateEnd') as number)) {
      enemy.clearTint();
      d.set('lp_state', 0);
      d.set('lp_next', time + LEAPER_CYCLE);
    }
  }

  enemy.updateAnimation();
}

// ═══════════════════════════════════════════════════════════════
// 21. STUNNER (Electabuzz)
// Charges at full speed, retreats after contact.
// ═══════════════════════════════════════════════════════════════
const STUNNER_RETREAT_DURATION = 1500;

function updateStunner(enemy: Enemy, player: Player, time: number): void {
  const d = enemy.data;
  if (!d.has('st_retreating')) {
    d.set('st_retreating', false);
    d.set('st_retreatEnd', 0);
  }

  const body = enemy.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const speed = enemy.getEffectiveSpeed();
  const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
  const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

  if (d.get('st_retreating') as boolean) {
    // Move AWAY from player at 1.5x speed
    body.velocity.x = -Math.cos(angle) * speed * 1.5;
    body.velocity.y = -Math.sin(angle) * speed * 1.5;
    if (time >= (d.get('st_retreatEnd') as number)) {
      d.set('st_retreating', false);
      enemy.clearTint();
    }
  } else {
    // Charge toward player
    body.velocity.x = Math.cos(angle) * speed;
    body.velocity.y = Math.sin(angle) * speed;

    // Contact detection: start retreating
    if (dist < 20) {
      d.set('st_retreating', true);
      d.set('st_retreatEnd', time + STUNNER_RETREAT_DURATION);
      if (shouldShowVfx()) enemy.setTint(0xffff44);
    }
  }

  enemy.updateAnimation();
}
