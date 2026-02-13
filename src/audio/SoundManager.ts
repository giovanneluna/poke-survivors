/**
 * SoundManager - Gerador de SFX procedural via Web Audio API.
 * Zero dependências externas, zero arquivos de áudio.
 */

type WaveType = OscillatorType;

interface ToneStep {
  readonly freq: number;
  readonly duration: number;
  readonly wave?: WaveType;
  readonly volume?: number;
}

class SoundManagerImpl {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterVolume = 0.03;
  private scene: Phaser.Scene | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Inicializa com referência à scene para tocar .ogg via Phaser sound manager */
  initWithScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /** Tenta tocar .ogg via Phaser. Retorna true se tocou, false para fallback procedural. */
  private tryPlayOgg(key: string, volume?: number): boolean {
    if (this.muted || !this.scene?.sound) return false;
    try {
      if (this.scene.sound.get(key) || this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, { volume: volume ?? this.masterVolume * 10 });
        return true;
      }
    } catch { /* fallback to procedural */ }
    return false;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private playTones(steps: readonly ToneStep[]): void {
    if (this.muted) return;

    const ctx = this.getContext();
    let offset = ctx.currentTime;

    for (const step of steps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = step.wave ?? 'square';
      osc.frequency.setValueAtTime(step.freq, offset);

      const vol = (step.volume ?? 1) * this.masterVolume;
      gain.gain.setValueAtTime(vol, offset);
      gain.gain.exponentialRampToValueAtTime(0.001, offset + step.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(offset);
      osc.stop(offset + step.duration);
      offset += step.duration * 0.85; // Leve overlap entre tons
    }
  }

  private playNoise(duration: number, volume: number): void {
    if (this.muted) return;

    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    const vol = volume * this.masterVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // ── Menu Sounds ────────────────────────────────────────────────────

  playClick(): void {
    if (this.tryPlayOgg('sfx-click', 0.4)) return;
    this.playTones([
      { freq: 800, duration: 0.04, wave: 'square', volume: 0.6 },
      { freq: 1000, duration: 0.03, wave: 'square', volume: 0.4 },
    ]);
  }

  playHover(): void {
    if (this.tryPlayOgg('sfx-hover', 0.25)) return;
    this.playTones([
      { freq: 600, duration: 0.03, wave: 'sine', volume: 0.25 },
    ]);
  }

  playStart(): void {
    if (this.tryPlayOgg('sfx-start', 0.5)) return;
    this.playTones([
      { freq: 523, duration: 0.1, wave: 'square', volume: 0.5 },
      { freq: 659, duration: 0.1, wave: 'square', volume: 0.5 },
      { freq: 784, duration: 0.1, wave: 'square', volume: 0.5 },
      { freq: 1047, duration: 0.2, wave: 'square', volume: 0.6 },
    ]);
  }

  // ── Combat Sounds ──────────────────────────────────────────────────

  playFireAttack(): void {
    this.playNoise(0.15, 0.3);
    this.playTones([
      { freq: 300, duration: 0.05, wave: 'sawtooth', volume: 0.4 },
      { freq: 200, duration: 0.08, wave: 'sawtooth', volume: 0.3 },
      { freq: 100, duration: 0.1, wave: 'sawtooth', volume: 0.2 },
    ]);
  }

  playHit(): void {
    this.playNoise(0.08, 0.25);
    this.playTones([
      { freq: 200, duration: 0.06, wave: 'square', volume: 0.5 },
      { freq: 100, duration: 0.05, wave: 'square', volume: 0.3 },
    ]);
  }

  playEnemyDeath(): void {
    this.playTones([
      { freq: 400, duration: 0.04, wave: 'square', volume: 0.3 },
      { freq: 300, duration: 0.04, wave: 'square', volume: 0.25 },
      { freq: 200, duration: 0.06, wave: 'square', volume: 0.2 },
      { freq: 100, duration: 0.08, wave: 'square', volume: 0.15 },
    ]);
  }

  playPlayerHit(): void {
    this.playTones([
      { freq: 200, duration: 0.08, wave: 'sawtooth', volume: 0.5 },
      { freq: 150, duration: 0.1, wave: 'sawtooth', volume: 0.4 },
      { freq: 80, duration: 0.12, wave: 'sawtooth', volume: 0.3 },
    ]);
  }

  // ── Pickup Sounds ──────────────────────────────────────────────────

  playXpPickup(): void {
    this.playTones([
      { freq: 1200, duration: 0.03, wave: 'sine', volume: 0.2 },
      { freq: 1600, duration: 0.03, wave: 'sine', volume: 0.15 },
    ]);
  }

  playPickupItem(): void {
    this.playTones([
      { freq: 600, duration: 0.06, wave: 'sine', volume: 0.4 },
      { freq: 800, duration: 0.06, wave: 'sine', volume: 0.4 },
      { freq: 1000, duration: 0.08, wave: 'sine', volume: 0.3 },
    ]);
  }

  // ── Level / Evolution Sounds ───────────────────────────────────────

  playLevelUp(): void {
    this.playTones([
      { freq: 523, duration: 0.08, wave: 'square', volume: 0.5 },
      { freq: 659, duration: 0.08, wave: 'square', volume: 0.5 },
      { freq: 784, duration: 0.08, wave: 'square', volume: 0.5 },
      { freq: 1047, duration: 0.12, wave: 'square', volume: 0.6 },
      { freq: 1175, duration: 0.15, wave: 'square', volume: 0.5 },
      { freq: 1319, duration: 0.2, wave: 'square', volume: 0.4 },
    ]);
  }

  playEvolve(): void {
    if (this.tryPlayOgg('sfx-evolve-t2', 0.5)) return;
    this.playTones([
      { freq: 400, duration: 0.1, wave: 'sine', volume: 0.4 },
      { freq: 500, duration: 0.1, wave: 'sine', volume: 0.4 },
      { freq: 600, duration: 0.1, wave: 'sine', volume: 0.5 },
      { freq: 800, duration: 0.12, wave: 'sine', volume: 0.5 },
      { freq: 1000, duration: 0.12, wave: 'sine', volume: 0.6 },
      { freq: 1200, duration: 0.15, wave: 'triangle', volume: 0.6 },
      { freq: 1600, duration: 0.25, wave: 'triangle', volume: 0.5 },
    ]);
  }

  /** Evolução tier 3 — usa sfx-evolve-t3, fallback para procedural */
  playEvolveT3(): void {
    if (this.tryPlayOgg('sfx-evolve-t3', 0.5)) return;
    this.playEvolve();
  }

  // ── Game State Sounds ──────────────────────────────────────────────

  playGameOver(): void {
    if (this.tryPlayOgg('sfx-gameover', 0.5)) return;
    this.playTones([
      { freq: 400, duration: 0.15, wave: 'square', volume: 0.5 },
      { freq: 350, duration: 0.15, wave: 'square', volume: 0.45 },
      { freq: 300, duration: 0.15, wave: 'square', volume: 0.4 },
      { freq: 250, duration: 0.2, wave: 'square', volume: 0.35 },
      { freq: 200, duration: 0.3, wave: 'square', volume: 0.3 },
      { freq: 150, duration: 0.4, wave: 'sawtooth', volume: 0.25 },
    ]);
  }

  playVictory(): void {
    if (this.tryPlayOgg('sfx-victory', 0.5)) return;
    this.playTones([
      { freq: 523, duration: 0.1, wave: 'square', volume: 0.5 },
      { freq: 659, duration: 0.1, wave: 'square', volume: 0.5 },
      { freq: 784, duration: 0.12, wave: 'square', volume: 0.6 },
      { freq: 1047, duration: 0.15, wave: 'square', volume: 0.6 },
      { freq: 1319, duration: 0.2, wave: 'triangle', volume: 0.5 },
    ]);
  }

  playExplosion(): void {
    this.playNoise(0.3, 0.4);
    this.playTones([
      { freq: 150, duration: 0.1, wave: 'sawtooth', volume: 0.5 },
      { freq: 80, duration: 0.15, wave: 'sawtooth', volume: 0.4 },
      { freq: 40, duration: 0.2, wave: 'sawtooth', volume: 0.3 },
    ]);
  }

  // ── Boss Sounds ───────────────────────────────────────────────────

  playBossWarning(): void {
    this.playTones([
      { freq: 100, duration: 0.08, wave: 'sawtooth', volume: 0.6 },
      { freq: 150, duration: 0.08, wave: 'sawtooth', volume: 0.6 },
      { freq: 200, duration: 0.08, wave: 'sawtooth', volume: 0.5 },
      { freq: 250, duration: 0.08, wave: 'sawtooth', volume: 0.5 },
      { freq: 300, duration: 0.12, wave: 'sawtooth', volume: 0.4 },
    ]);
  }

  playBossSpawn(): void {
    this.playNoise(0.15, 0.3);
    this.playTones([
      { freq: 60, duration: 0.15, wave: 'sawtooth', volume: 0.6 },
      { freq: 50, duration: 0.15, wave: 'sawtooth', volume: 0.5 },
      { freq: 40, duration: 0.2, wave: 'sawtooth', volume: 0.4 },
      { freq: 40, duration: 0.1, wave: 'sine', volume: 0.3 },
    ]);
  }

  playBossLand(): void {
    this.playNoise(0.1, 0.35);
    this.playTones([
      { freq: 80, duration: 0.1, wave: 'sine', volume: 0.6 },
      { freq: 50, duration: 0.1, wave: 'sine', volume: 0.5 },
      { freq: 20, duration: 0.1, wave: 'sine', volume: 0.3 },
    ]);
  }

  playEventWarning(): void {
    this.playTones([
      { freq: 200, duration: 0.06, wave: 'sawtooth', volume: 0.5 },
      { freq: 300, duration: 0.06, wave: 'sawtooth', volume: 0.5 },
      { freq: 400, duration: 0.06, wave: 'sawtooth', volume: 0.5 },
      { freq: 600, duration: 0.1, wave: 'sawtooth', volume: 0.4 },
    ]);
  }

  // ── Mega Evolution Sounds ──────────────────────────────────────
  playMegaActivate(): void {
    this.playTones([
      { freq: 523, duration: 0.08, wave: 'square', volume: 0.6 },
      { freq: 659, duration: 0.08, wave: 'square', volume: 0.6 },
      { freq: 784, duration: 0.08, wave: 'square', volume: 0.6 },
      { freq: 1047, duration: 0.12, wave: 'square', volume: 0.7 },
      { freq: 1319, duration: 0.15, wave: 'triangle', volume: 0.6 },
      { freq: 1568, duration: 0.2, wave: 'triangle', volume: 0.5 },
    ]);
  }

  playMegaReady(): void {
    this.playTones([
      { freq: 1200, duration: 0.06, wave: 'sine', volume: 0.3 },
      { freq: 1600, duration: 0.08, wave: 'sine', volume: 0.25 },
    ]);
  }

  /** Expõe o AudioContext para compartilhamento com MusicManager */
  getAudioContext(): AudioContext {
    return this.getContext();
  }
}

/** Singleton global do SoundManager */
export const SoundManager = new SoundManagerImpl();
