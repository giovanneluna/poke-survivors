/**
 * MusicManager - Gerador de musica procedural 8-bit via Web Audio API.
 * Inspirado nos temas de Pokemon Red/Blue.
 *
 * Usa setInterval (nao Phaser scene.time) para que a musica continue
 * durante pause do jogo. Compartilha AudioContext com SoundManager.
 */

import { SoundManager } from './SoundManager';

// ── Types ──────────────────────────────────────────────────────────────────

type MusicTrack = 'calm' | 'battle' | 'boss';

interface LayerConfig {
  /** Frequencias em Hz (0 = pausa/rest) */
  readonly notes: readonly number[];
  /** Duracao relativa ao beat (1 = seminima/quarter note) */
  readonly durations: readonly number[];
  readonly wave: OscillatorType;
  /** Volume relativo 0-1 (multiplicado pelo master) */
  readonly volume: number;
}

interface TrackConfig {
  readonly bpm: number;
  readonly layers: readonly LayerConfig[];
}

// ── Track Definitions ──────────────────────────────────────────────────────

const TRACKS: Readonly<Record<MusicTrack, TrackConfig>> = {
  /**
   * Calm (~80 BPM, C major pentatonic)
   * Melodia simples ascendente/descendente + baixo root-fifth.
   * Evoca Route 1 ao amanhecer.
   */
  calm: {
    bpm: 80,
    layers: [
      {
        // Melodia pentatonica: C4-D4-E4-G4-A4 ida e volta
        notes: [262, 294, 330, 392, 440, 392, 330, 294],
        durations: [1, 1, 1, 1, 1, 1, 1, 1],
        wave: 'sine',
        volume: 0.8,
      },
      {
        // Baixo: tonica (C3) e quinta (G2) alternando, notas longas
        notes: [131, 131, 98, 98, 131, 131, 98, 98],
        durations: [2, 2, 2, 2, 2, 2, 2, 2],
        wave: 'triangle',
        volume: 0.6,
      },
    ],
  },

  /**
   * Battle (~120 BPM, C minor)
   * Lead energetico + baixo driving em colcheias.
   * Evoca wild battle music.
   */
  battle: {
    bpm: 120,
    layers: [
      {
        // Lead C minor: C4-Eb4-F4-G4-Bb4 com rests
        notes: [
          262, 311, 349, 392, 466, 392, 349, 311,
          262, 0, 392, 349, 311, 262, 0, 0,
        ],
        durations: [
          0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
          0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        ],
        wave: 'square',
        volume: 0.7,
      },
      {
        // Baixo driving: C2-G2-Ab2-Bb2
        notes: [65, 65, 98, 65, 104, 104, 117, 98],
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        wave: 'sawtooth',
        volume: 0.5,
      },
    ],
  },

  /**
   * Boss (~140 BPM, C minor dramatico)
   * Lead descendente menacante + baixo staccato.
   * Evoca Elite Four battle.
   */
  boss: {
    bpm: 140,
    layers: [
      {
        // Lead dramatico descendente com rests
        notes: [
          523, 0, 466, 0, 392, 0, 311, 262,
          523, 0, 622, 0, 523, 466, 392, 0,
        ],
        durations: [
          0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
          0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        ],
        wave: 'sawtooth',
        volume: 0.7,
      },
      {
        // Baixo staccato: C2 repetido com acentos em G2/Ab2
        notes: [
          65, 0, 65, 0, 98, 0, 65, 0,
          65, 0, 65, 0, 104, 0, 98, 0,
        ],
        durations: [
          0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
          0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25,
        ],
        wave: 'square',
        volume: 0.6,
      },
    ],
  },
} as const;

// ── Constantes ─────────────────────────────────────────────────────────────

/** Intervalo do scheduler em ms (lookahead pattern Web Audio) */
const SCHEDULER_INTERVAL_MS = 50;
/** Quanto tempo a frente agendar notas (segundos) */
const LOOKAHEAD_SEC = 0.1;
/** Duracao do crossfade entre tracks (segundos) */
const CROSSFADE_DURATION_SEC = 1.5;
/** Volume minimo (abaixo disso = silencio para exponentialRamp) */
const MIN_GAIN = 0.001;
/** Threshold de inimigos para trocar de calm para battle */
const BATTLE_ENEMY_THRESHOLD = 10;

// ── MusicManager ───────────────────────────────────────────────────────────

class MusicManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeTrack: MusicTrack | null = null;
  private loopInterval: number | null = null;
  private nextNoteTime = 0;
  private noteIndex = 0;
  private crossfading = false;
  private crossfadeTimeout: number | null = null;
  private readonly masterVolume = 0.012;

  // ── AudioContext (compartilhado com SoundManager) ──────────────────────

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = SoundManager.getAudioContext();
    }
    return this.ctx;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /** Inicia a musica (fade in suave). Idempotente. */
  start(): void {
    if (this.loopInterval !== null) return;

    const ctx = this.getContext();

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(MIN_GAIN, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    this.nextNoteTime = ctx.currentTime;
    this.noteIndex = 0;
    this.activeTrack = 'calm';

    // Fade in gradual
    this.masterGain.gain.linearRampToValueAtTime(
      this.masterVolume,
      ctx.currentTime + 2,
    );

    // Lookahead scheduler — roda fora do Phaser (setInterval)
    this.loopInterval = window.setInterval(
      () => this.scheduler(),
      SCHEDULER_INTERVAL_MS,
    );
  }

  /** Fade out e para a musica. */
  fadeOut(durationMs: number = 2000): void {
    if (!this.masterGain) return;

    const ctx = this.getContext();
    this.masterGain.gain.linearRampToValueAtTime(
      MIN_GAIN,
      ctx.currentTime + durationMs / 1000,
    );

    window.setTimeout(() => this.stop(), durationMs + 100);
  }

  /** Para imediatamente toda a musica e limpa recursos. */
  stop(): void {
    if (this.loopInterval !== null) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }

    if (this.crossfadeTimeout !== null) {
      clearTimeout(this.crossfadeTimeout);
      this.crossfadeTimeout = null;
    }

    this.crossfading = false;
    this.activeTrack = null;

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
  }

  // ── Scheduler ─────────────────────────────────────────────────────────

  /**
   * Lookahead scheduler: roda a cada ~50ms e agenda notas ate 100ms a frente.
   * Padrao recomendado pela spec Web Audio API para timing preciso.
   */
  private scheduler(): void {
    if (SoundManager.isMuted()) return;
    if (!this.activeTrack || !this.masterGain) return;

    const ctx = this.getContext();
    const track = TRACKS[this.activeTrack];
    const beatDuration = 60 / track.bpm;

    while (this.nextNoteTime < ctx.currentTime + LOOKAHEAD_SEC) {
      this.scheduleNote(track, this.nextNoteTime, beatDuration);
      this.noteIndex++;
      this.nextNoteTime += beatDuration;
    }
  }

  /**
   * Agenda uma nota (ou rest) para cada layer da track no tempo especificado.
   * Cada nota cria seu proprio par oscillator+gain com auto-cleanup via onended.
   */
  private scheduleNote(
    track: TrackConfig,
    time: number,
    beatDuration: number,
  ): void {
    const ctx = this.getContext();

    for (const layer of track.layers) {
      const noteIdx = this.noteIndex % layer.notes.length;
      const freq = layer.notes[noteIdx];

      // freq === 0 = rest (silencio)
      if (freq === 0) continue;

      const durIdx = noteIdx % layer.durations.length;
      const duration = layer.durations[durIdx] * beatDuration;
      const vol = layer.volume * this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = layer.wave;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(vol, time);
      // Envelope: decay suave antes do fim da nota
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + duration * 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration);

      // Auto-cleanup: desconecta nos apos terminar
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }

  // ── Dynamic Track Switching ───────────────────────────────────────────

  /**
   * Chamado pelo game loop para atualizar a track com base no estado do jogo.
   * Determina a track alvo e faz crossfade se necessario.
   */
  update(activeEnemyCount: number, bossAlive: boolean): void {
    if (!this.masterGain) return;

    const ctx = this.getContext();

    // Se mutado, silencia o master
    if (SoundManager.isMuted()) {
      this.masterGain.gain.setValueAtTime(MIN_GAIN, ctx.currentTime);
      return;
    }

    // Determina track alvo pela situacao do jogo
    let target: MusicTrack = 'calm';
    if (bossAlive) {
      target = 'boss';
    } else if (activeEnemyCount >= BATTLE_ENEMY_THRESHOLD) {
      target = 'battle';
    }

    // Crossfade se a track alvo mudou
    if (target !== this.activeTrack && !this.crossfading) {
      this.crossfadeTo(target);
    }

    // Restaura volume se estava mutado e desmutou
    const currentVol = this.masterGain.gain.value;
    if (currentVol < this.masterVolume * 0.5 && !this.crossfading) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.masterVolume,
        ctx.currentTime + 1,
      );
    }
  }

  /**
   * Crossfade suave entre tracks: fade out atual -> troca -> fade in nova.
   * Usa setTimeout (nao Phaser) para consistencia com o scheduler.
   */
  private crossfadeTo(target: MusicTrack): void {
    this.crossfading = true;

    const ctx = this.getContext();

    // Fade out da track atual
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        MIN_GAIN,
        ctx.currentTime + CROSSFADE_DURATION_SEC,
      );
    }

    // Apos o fade out, troca e faz fade in
    const delayMs = (CROSSFADE_DURATION_SEC * 1000) + 100;
    this.crossfadeTimeout = window.setTimeout(() => {
      this.crossfadeTimeout = null;
      this.activeTrack = target;
      this.noteIndex = 0;
      this.nextNoteTime = this.getContext().currentTime;

      if (this.masterGain) {
        const now = this.getContext().currentTime;
        this.masterGain.gain.setValueAtTime(MIN_GAIN, now);
        this.masterGain.gain.linearRampToValueAtTime(
          this.masterVolume,
          now + CROSSFADE_DURATION_SEC,
        );
      }

      this.crossfading = false;
    }, delayMs);
  }
}

// ── Module Singleton ───────────────────────────────────────────────────────

let instance: MusicManagerImpl | null = null;

/** Inicializa o MusicManager. Chamar uma vez no inicio do jogo. */
export function initMusicManager(): MusicManagerImpl {
  if (!instance) {
    instance = new MusicManagerImpl();
  }
  return instance;
}

/** Retorna a instancia do MusicManager. Deve ser chamado apos initMusicManager(). */
export function getMusicManager(): MusicManagerImpl {
  if (!instance) {
    throw new Error('MusicManager nao inicializado. Chame initMusicManager() primeiro.');
  }
  return instance;
}
