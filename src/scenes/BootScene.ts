import Phaser from 'phaser';
import { ENEMIES, STARTERS, CHARMANDER_FORMS, SQUIRTLE_FORMS } from '../config';
import type { SpriteConfig, Direction } from '../types';
import { DIRECTION_ROW } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;

    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 148, height / 2, 0, 16, 0xff6600);
    bar.setOrigin(0, 0.5);
    const loadingText = this.add.text(width / 2, height / 2 - 30, 'Carregando...', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => { bar.width = 296 * value; });
    this.load.on('complete', () => { barBg.destroy(); bar.destroy(); loadingText.destroy(); });

    // Carrega starters (Charmander, Squirtle, Bulbasaur)
    for (const starter of STARTERS) {
      this.loadSpritesheet(starter.sprite);
    }
    // Carrega formas evolutivas (Charmeleon, Charizard, Wartortle, Blastoise)
    for (const form of CHARMANDER_FORMS) {
      if (form.form !== 'base') this.loadSpritesheet(form.sprite);
    }
    for (const form of SQUIRTLE_FORMS) {
      if (form.form !== 'base') this.loadSpritesheet(form.sprite);
    }
    for (const config of Object.values(ENEMIES)) {
      this.loadSpritesheet(config.sprite);
    }

    // Artwork oficial dos starters + evoluções (para Title Screen / evolução)
    this.load.image('art-charmander', 'assets/artwork/charmander.png');
    this.load.image('art-squirtle', 'assets/artwork/squirtle.png');
    this.load.image('art-bulbasaur', 'assets/artwork/bulbasaur.png');
    this.load.image('art-charmeleon', 'assets/artwork/charmeleon.png');
    this.load.image('art-charizard', 'assets/artwork/charizard.png');
    this.load.image('art-wartortle', 'assets/artwork/wartortle.png');
    this.load.image('art-blastoise', 'assets/artwork/blastoise.png');

    // Sprites de itens reais do Pokemon (para upgrades/UI)
    this.load.image('item-flame-orb', 'assets/items/flame-orb.png');
    this.load.image('item-pp-up', 'assets/items/pp-up.png');
    this.load.image('item-leftovers', 'assets/items/leftovers.png');
    this.load.image('item-quick-claw', 'assets/items/quick-claw.png');
    this.load.image('item-magnet', 'assets/items/magnet.png');
    this.load.image('item-charcoal', 'assets/items/charcoal.png');
    this.load.image('item-wide-lens', 'assets/items/wide-lens.png');
    this.load.image('item-choice-specs', 'assets/items/choice-specs.png');
    this.load.image('item-fire-stone', 'assets/items/fire-stone.png');
    this.load.image('item-dragon-fang', 'assets/items/dragon-fang.png');
    this.load.image('item-sharp-beak', 'assets/items/sharp-beak.png');
    this.load.image('item-scope-lens', 'assets/items/scope-lens.png');
    this.load.image('item-razor-claw', 'assets/items/razor-claw.png');
    this.load.image('item-shell-bell', 'assets/items/shell-bell.png');
    this.load.image('item-focus-band', 'assets/items/focus-band.png');
    this.load.image('item-silk-scarf', 'assets/items/silk-scarf.png');
    this.load.image('item-metronome', 'assets/items/metronome.png');
    this.load.image('item-mystic-water', 'assets/items/mystic-water.png');
    this.load.image('item-never-melt-ice', 'assets/items/never-melt-ice.png');
    this.load.image('item-water-stone', 'assets/items/water-stone.png');

    // Spritesheets de ataques (pokemonAutoChess)
    this.load.spritesheet('atk-ember', 'assets/attacks/ember-sheet.png', { frameWidth: 26, frameHeight: 26 });
    this.load.spritesheet('atk-fire-range', 'assets/attacks/fire-range-sheet.png', { frameWidth: 40, frameHeight: 40 });
    this.load.spritesheet('atk-fire-hit', 'assets/attacks/fire-hit-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-flamethrower', 'assets/attacks/flamethrower-sheet.png', { frameWidth: 80, frameHeight: 96 });
    this.load.spritesheet('atk-fire-blast', 'assets/attacks/fire-blast-sheet.png', { frameWidth: 72, frameHeight: 73 });
    this.load.spritesheet('atk-blast-burn', 'assets/attacks/blast-burn-sheet.png', { frameWidth: 80, frameHeight: 80 });

    // Novos spritesheets de ataques
    this.load.spritesheet('atk-scratch', 'assets/attacks/scratch-sheet.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('atk-slash', 'assets/attacks/slash-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-fury-swipes', 'assets/attacks/fury-swipes-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-night-slash', 'assets/attacks/night-slash-sheet.png', { frameWidth: 56, frameHeight: 64 });
    this.load.spritesheet('atk-fire-fang', 'assets/attacks/fire-fang-sheet.png', { frameWidth: 80, frameHeight: 64 });
    this.load.spritesheet('atk-blaze-kick', 'assets/attacks/blaze-kick-sheet.png', { frameWidth: 64, frameHeight: 72 });
    this.load.spritesheet('atk-dragon-breath', 'assets/attacks/dragon-breath-sheet.png', { frameWidth: 32, frameHeight: 74 });
    this.load.spritesheet('atk-dragon-claw', 'assets/attacks/dragon-claw-sheet.png', { frameWidth: 96, frameHeight: 78 });
    this.load.spritesheet('atk-dragon-pulse', 'assets/attacks/dragon-pulse-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-dragon-rush', 'assets/attacks/dragon-rush-sheet.png', { frameWidth: 65, frameHeight: 64 });
    this.load.spritesheet('atk-draco-meteor', 'assets/attacks/draco-meteor-sheet.png', { frameWidth: 96, frameHeight: 58 });
    this.load.spritesheet('atk-smokescreen', 'assets/attacks/smokescreen-sheet.png', { frameWidth: 45, frameHeight: 45 });
    this.load.spritesheet('atk-flame-charge', 'assets/attacks/flame-charge-sheet.png', { frameWidth: 20, frameHeight: 96 });
    this.load.spritesheet('atk-flare-blitz', 'assets/attacks/flare-blitz-sheet.png', { frameWidth: 96, frameHeight: 83 });
    this.load.spritesheet('atk-air-slash', 'assets/attacks/air-slash-sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('atk-aerial-ace', 'assets/attacks/aerial-ace-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-hurricane', 'assets/attacks/hurricane-sheet.png', { frameWidth: 56, frameHeight: 80 });
    this.load.spritesheet('atk-heat-wave', 'assets/attacks/heat-wave-sheet.png', { frameWidth: 96, frameHeight: 82 });
    this.load.spritesheet('atk-outrage', 'assets/attacks/outrage-sheet.png', { frameWidth: 48, frameHeight: 72 });
    this.load.spritesheet('atk-shadow-ball', 'assets/attacks/shadow-ball-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-rock-slide', 'assets/attacks/rock-slide-sheet.png', { frameWidth: 48, frameHeight: 96 });
    this.load.spritesheet('atk-rock-throw', 'assets/attacks/rock-throw-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-hyper-voice', 'assets/attacks/hyper-voice-sheet.png', { frameWidth: 96, frameHeight: 28 });

    // Enemy projectile spritesheets (real sprites from pokemonAutoChess)
    this.load.spritesheet('atk-psybeam', 'assets/attacks/psybeam-sheet.png', { frameWidth: 32, frameHeight: 240 });
    this.load.spritesheet('atk-psychic', 'assets/attacks/psychic-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-bonemerang', 'assets/attacks/bonemerang-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-explosion', 'assets/attacks/explosion-sheet.png', { frameWidth: 168, frameHeight: 128 });

    // Boss attack spritesheets
    this.load.spritesheet('atk-bite', 'assets/attacks/bite-sheet.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('atk-venoshock', 'assets/attacks/venoshock-sheet.png', { frameWidth: 32, frameHeight: 80 });
    this.load.spritesheet('atk-gunk-shot', 'assets/attacks/poison-dark/gunk-shot-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-thrash', 'assets/attacks/thrash-sheet.png', { frameWidth: 48, frameHeight: 32 });
    this.load.spritesheet('atk-stomp', 'assets/attacks/stomp-sheet.png', { frameWidth: 16, frameHeight: 16 });

    // Water attack spritesheets (Squirtle line)
    this.load.spritesheet('atk-water-pulse', 'assets/attacks/water-pulse-sheet.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('atk-aqua-jet', 'assets/attacks/aqua-jet-sheet.png', { frameWidth: 96, frameHeight: 160 });
    this.load.spritesheet('atk-hydro-pump', 'assets/attacks/hydro-pump-sheet.png', { frameWidth: 96, frameHeight: 160 });
    this.load.spritesheet('atk-surf', 'assets/attacks/surf-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-liquidation', 'assets/attacks/liquidation-sheet.png', { frameWidth: 64, frameHeight: 120 });
    this.load.spritesheet('atk-rapid-spin', 'assets/attacks/rapid-spin-sheet.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('atk-water-range', 'assets/attacks/water-range-sheet.png', { frameWidth: 8, frameHeight: 8 });
    this.load.spritesheet('atk-water-hit', 'assets/attacks/water-hit-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-ice-range', 'assets/attacks/ice-range-sheet.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('atk-wave-splash', 'assets/attacks/wave-splash-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-sparkling-aria', 'assets/attacks/sparkling-aria-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-water-melee', 'assets/attacks/water-melee-sheet.png', { frameWidth: 56, frameHeight: 56 });
    this.load.spritesheet('atk-origin-pulse', 'assets/attacks/origin-pulse-sheet.png', { frameWidth: 128, frameHeight: 32 });
  }

  private loadSpritesheet(sprite: SpriteConfig): void {
    this.load.spritesheet(sprite.key, sprite.path, {
      frameWidth: sprite.frameWidth,
      frameHeight: sprite.frameHeight,
    });
  }

  create(): void {
    for (const starter of STARTERS) {
      this.createWalkAnims(starter.sprite);
    }
    // Cria anims das formas evolutivas
    for (const form of CHARMANDER_FORMS) {
      if (form.form !== 'base') this.createWalkAnims(form.sprite);
    }
    for (const form of SQUIRTLE_FORMS) {
      if (form.form !== 'base') this.createWalkAnims(form.sprite);
    }
    for (const config of Object.values(ENEMIES)) {
      this.createWalkAnims(config.sprite);
    }
    this.createAttackAnims();
    this.generateTextures();
    this.scene.start('TitleScene');
  }

  private createAttackAnims(): void {
    // Ember projectile animation (9 frames, looping)
    this.anims.create({
      key: 'anim-ember',
      frames: this.anims.generateFrameNumbers('atk-ember', { start: 0, end: 8 }),
      frameRate: 15, repeat: -1,
    });
    // Fire range projectile (16 frames, looping) - used for Fire Spin orbs
    this.anims.create({
      key: 'anim-fire-orb',
      frames: this.anims.generateFrameNumbers('atk-fire-range', { start: 0, end: 15 }),
      frameRate: 20, repeat: -1,
    });
    // Fire hit impact (4 frames, play once)
    this.anims.create({
      key: 'anim-fire-hit',
      frames: this.anims.generateFrameNumbers('atk-fire-hit', { start: 0, end: 3 }),
      frameRate: 12, repeat: 0,
    });
    // Flamethrower cone (16 frames, play once)
    this.anims.create({
      key: 'anim-flamethrower',
      frames: this.anims.generateFrameNumbers('atk-flamethrower', { start: 0, end: 15 }),
      frameRate: 24, repeat: 0,
    });
    // Fire Blast expanding star (12 frames, looping for pulse)
    this.anims.create({
      key: 'anim-fire-blast',
      frames: this.anims.generateFrameNumbers('atk-fire-blast', { start: 0, end: 11 }),
      frameRate: 15, repeat: 0,
    });
    // Blast Burn explosion (15 frames, play once)
    this.anims.create({
      key: 'anim-blast-burn',
      frames: this.anims.generateFrameNumbers('atk-blast-burn', { start: 0, end: 14 }),
      frameRate: 18, repeat: 0,
    });

    // ── Novos ataques animados ─────────────────────────────────────
    // Scratch (8 frames, play once)
    this.anims.create({
      key: 'anim-scratch',
      frames: this.anims.generateFrameNumbers('atk-scratch', { start: 0, end: 7 }),
      frameRate: 20, repeat: 0,
    });
    // Slash (4 frames, play once)
    this.anims.create({
      key: 'anim-slash',
      frames: this.anims.generateFrameNumbers('atk-slash', { start: 0, end: 3 }),
      frameRate: 16, repeat: 0,
    });
    // Fury Swipes (10 frames, play once)
    this.anims.create({
      key: 'anim-fury-swipes',
      frames: this.anims.generateFrameNumbers('atk-fury-swipes', { start: 0, end: 9 }),
      frameRate: 22, repeat: 0,
    });
    // Night Slash (15 frames, play once)
    this.anims.create({
      key: 'anim-night-slash',
      frames: this.anims.generateFrameNumbers('atk-night-slash', { start: 0, end: 14 }),
      frameRate: 24, repeat: 0,
    });
    // Fire Fang (10 frames, play once)
    this.anims.create({
      key: 'anim-fire-fang',
      frames: this.anims.generateFrameNumbers('atk-fire-fang', { start: 0, end: 9 }),
      frameRate: 18, repeat: 0,
    });
    // Blaze Kick (15 frames, play once)
    this.anims.create({
      key: 'anim-blaze-kick',
      frames: this.anims.generateFrameNumbers('atk-blaze-kick', { start: 0, end: 14 }),
      frameRate: 22, repeat: 0,
    });
    // Dragon Breath (9 frames, play once)
    this.anims.create({
      key: 'anim-dragon-breath',
      frames: this.anims.generateFrameNumbers('atk-dragon-breath', { start: 0, end: 8 }),
      frameRate: 16, repeat: 0,
    });
    // Dragon Claw (10 frames, play once)
    this.anims.create({
      key: 'anim-dragon-claw',
      frames: this.anims.generateFrameNumbers('atk-dragon-claw', { start: 0, end: 9 }),
      frameRate: 20, repeat: 0,
    });
    // Dragon Pulse (6 frames, looping projectile)
    this.anims.create({
      key: 'anim-dragon-pulse',
      frames: this.anims.generateFrameNumbers('atk-dragon-pulse', { start: 0, end: 5 }),
      frameRate: 15, repeat: -1,
    });
    // Dragon Rush (7 frames, play once)
    this.anims.create({
      key: 'anim-dragon-rush',
      frames: this.anims.generateFrameNumbers('atk-dragon-rush', { start: 0, end: 6 }),
      frameRate: 18, repeat: 0,
    });
    // Draco Meteor (16 frames, play once)
    this.anims.create({
      key: 'anim-draco-meteor',
      frames: this.anims.generateFrameNumbers('atk-draco-meteor', { start: 0, end: 15 }),
      frameRate: 20, repeat: 0,
    });
    // Smokescreen (12 frames, looping aura)
    this.anims.create({
      key: 'anim-smokescreen',
      frames: this.anims.generateFrameNumbers('atk-smokescreen', { start: 0, end: 11 }),
      frameRate: 12, repeat: -1,
    });
    // Flame Charge (16 frames, play once)
    this.anims.create({
      key: 'anim-flame-charge',
      frames: this.anims.generateFrameNumbers('atk-flame-charge', { start: 15, end: 0 }),
      frameRate: 24, repeat: 0,
    });
    // Flare Blitz (15 frames, play once)
    this.anims.create({
      key: 'anim-flare-blitz',
      frames: this.anims.generateFrameNumbers('atk-flare-blitz', { start: 0, end: 14 }),
      frameRate: 22, repeat: 0,
    });
    // Air Slash (8 frames, looping projectile)
    this.anims.create({
      key: 'anim-air-slash',
      frames: this.anims.generateFrameNumbers('atk-air-slash', { start: 0, end: 7 }),
      frameRate: 16, repeat: -1,
    });
    // Aerial Ace (4 frames, looping projectile)
    this.anims.create({
      key: 'anim-aerial-ace',
      frames: this.anims.generateFrameNumbers('atk-aerial-ace', { start: 0, end: 3 }),
      frameRate: 14, repeat: -1,
    });
    // Hurricane (16 frames, looping vortex)
    this.anims.create({
      key: 'anim-hurricane',
      frames: this.anims.generateFrameNumbers('atk-hurricane', { start: 0, end: 15 }),
      frameRate: 18, repeat: -1,
    });
    // Heat Wave (11 frames, play once)
    this.anims.create({
      key: 'anim-heat-wave',
      frames: this.anims.generateFrameNumbers('atk-heat-wave', { start: 0, end: 10 }),
      frameRate: 18, repeat: 0,
    });
    // Outrage (13 frames, looping berserk aura)
    this.anims.create({
      key: 'anim-outrage',
      frames: this.anims.generateFrameNumbers('atk-outrage', { start: 0, end: 12 }),
      frameRate: 16, repeat: -1,
    });
    // Shadow Ball (16 frames, looping projectile)
    this.anims.create({
      key: 'anim-shadow-ball',
      frames: this.anims.generateFrameNumbers('atk-shadow-ball', { start: 0, end: 15 }),
      frameRate: 18, repeat: -1,
    });
    // Rock Slide (16 frames, looping projectile)
    this.anims.create({
      key: 'anim-rock-slide',
      frames: this.anims.generateFrameNumbers('atk-rock-slide', { start: 0, end: 15 }),
      frameRate: 18, repeat: -1,
    });
    // Rock Throw (8 frames, looping) - Geodude projectile
    this.anims.create({
      key: 'anim-rock-throw',
      frames: this.anims.generateFrameNumbers('atk-rock-throw', { start: 0, end: 7 }),
      frameRate: 12, repeat: -1,
    });
    // Hyper Voice / Supersonic (4 frames, play once)
    this.anims.create({
      key: 'anim-hyper-voice',
      frames: this.anims.generateFrameNumbers('atk-hyper-voice', { start: 0, end: 3 }),
      frameRate: 12, repeat: 0,
    });
    // Psybeam (15 frames, looping) - Venonat/Butterfree/Venomoth projectile
    this.anims.create({
      key: 'anim-psybeam',
      frames: this.anims.generateFrameNumbers('atk-psybeam', { start: 0, end: 14 }),
      frameRate: 18, repeat: -1,
    });
    // Psychic (17 frames, looping) - Hypno/Alakazam/Drowzee projectile
    this.anims.create({
      key: 'anim-psychic',
      frames: this.anims.generateFrameNumbers('atk-psychic', { start: 0, end: 16 }),
      frameRate: 18, repeat: -1,
    });
    // Bonemerang (8 frames, looping) - Cubone/Marowak projectile
    this.anims.create({
      key: 'anim-bonemerang',
      frames: this.anims.generateFrameNumbers('atk-bonemerang', { start: 0, end: 7 }),
      frameRate: 14, repeat: -1,
    });
    // Explosion (18 frames, play once) - Electrode death effect
    this.anims.create({
      key: 'anim-explosion',
      frames: this.anims.generateFrameNumbers('atk-explosion', { start: 0, end: 17 }),
      frameRate: 24, repeat: 0,
    });

    // ── Boss attack animations ───────────────────────────────────────
    // Bite / Hyper Fang (12 frames, play once)
    this.anims.create({
      key: 'anim-bite',
      frames: this.anims.generateFrameNumbers('atk-bite', { start: 0, end: 11 }),
      frameRate: 24, repeat: 0,
    });
    // Venoshock / Poison Sting (13 frames, play once)
    this.anims.create({
      key: 'anim-venoshock',
      frames: this.anims.generateFrameNumbers('atk-venoshock', { start: 0, end: 12 }),
      frameRate: 20, repeat: 0,
    });
    // Gunk Shot / Arbok fan attack (45 frames, loop)
    this.anims.create({
      key: 'anim-gunk-shot',
      frames: this.anims.generateFrameNumbers('atk-gunk-shot', { start: 0, end: 44 }),
      frameRate: 24, repeat: -1,
    });
    // Thrash (7 frames, play once)
    this.anims.create({
      key: 'anim-thrash',
      frames: this.anims.generateFrameNumbers('atk-thrash', { start: 0, end: 6 }),
      frameRate: 14, repeat: 0,
    });
    // Stomp / Body Slam (10 frames, play once)
    this.anims.create({
      key: 'anim-stomp',
      frames: this.anims.generateFrameNumbers('atk-stomp', { start: 0, end: 9 }),
      frameRate: 18, repeat: 0,
    });

    // ── Water attack animations (Squirtle line) ──────────────────────
    // Water Pulse (22 frames, looping projectile)
    this.anims.create({
      key: 'anim-water-pulse',
      frames: this.anims.generateFrameNumbers('atk-water-pulse', { start: 0, end: 21 }),
      frameRate: 18, repeat: -1,
    });
    // Aqua Jet (20 frames, play once)
    this.anims.create({
      key: 'anim-aqua-jet',
      frames: this.anims.generateFrameNumbers('atk-aqua-jet', { start: 0, end: 19 }),
      frameRate: 24, repeat: 0,
    });
    // Hydro Pump (20 frames, play once)
    this.anims.create({
      key: 'anim-hydro-pump',
      frames: this.anims.generateFrameNumbers('atk-hydro-pump', { start: 0, end: 19 }),
      frameRate: 24, repeat: 0,
    });
    // Surf (4 frames, looping)
    this.anims.create({
      key: 'anim-surf',
      frames: this.anims.generateFrameNumbers('atk-surf', { start: 0, end: 3 }),
      frameRate: 10, repeat: -1,
    });
    // Liquidation (18 frames, play once)
    this.anims.create({
      key: 'anim-liquidation',
      frames: this.anims.generateFrameNumbers('atk-liquidation', { start: 0, end: 17 }),
      frameRate: 22, repeat: 0,
    });
    // Rapid Spin (11 frames, looping orbital)
    this.anims.create({
      key: 'anim-rapid-spin',
      frames: this.anims.generateFrameNumbers('atk-rapid-spin', { start: 0, end: 10 }),
      frameRate: 16, repeat: -1,
    });
    // Water range projectile (19 frames, looping)
    this.anims.create({
      key: 'anim-water-range',
      frames: this.anims.generateFrameNumbers('atk-water-range', { start: 0, end: 18 }),
      frameRate: 20, repeat: -1,
    });
    // Water hit impact (4 frames, play once)
    this.anims.create({
      key: 'anim-water-hit',
      frames: this.anims.generateFrameNumbers('atk-water-hit', { start: 0, end: 3 }),
      frameRate: 12, repeat: 0,
    });
    // Ice range projectile (14 frames, looping)
    this.anims.create({
      key: 'anim-ice-range',
      frames: this.anims.generateFrameNumbers('atk-ice-range', { start: 0, end: 13 }),
      frameRate: 16, repeat: -1,
    });
    // Wave Splash (9 frames, looping — Bubble projectile)
    this.anims.create({
      key: 'anim-wave-splash',
      frames: this.anims.generateFrameNumbers('atk-wave-splash', { start: 0, end: 8 }),
      frameRate: 14, repeat: -1,
    });
    // Sparkling Aria (44 frames, looping — BubbleBeam projectile)
    this.anims.create({
      key: 'anim-sparkling-aria',
      frames: this.anims.generateFrameNumbers('atk-sparkling-aria', { start: 0, end: 43 }),
      frameRate: 20, repeat: -1,
    });
    // Water Melee splash (8 frames, looping — Scald projectile)
    this.anims.create({
      key: 'anim-water-melee',
      frames: this.anims.generateFrameNumbers('atk-water-melee', { start: 0, end: 7 }),
      frameRate: 14, repeat: -1,
    });
    // Origin Pulse (4 frames, looping — WaterSpout projectile)
    this.anims.create({
      key: 'anim-origin-pulse',
      frames: this.anims.generateFrameNumbers('atk-origin-pulse', { start: 0, end: 3 }),
      frameRate: 10, repeat: -1,
    });
  }

  private createWalkAnims(sprite: SpriteConfig): void {
    const directions: Direction[] = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'];
    // FrameRate proporcional ao nº de frames para ciclos naturais (~0.5-0.8s)
    const fps = Math.max(4, Math.min(10, sprite.frameCount * 2));
    for (const dir of directions) {
      const row = DIRECTION_ROW[dir];
      const startFrame = row * sprite.frameCount;
      const endFrame = startFrame + sprite.frameCount - 1;
      this.anims.create({
        key: `${sprite.key}-${dir}`,
        frames: this.anims.generateFrameNumbers(sprite.key, { start: startFrame, end: endFrame }),
        frameRate: fps,
        repeat: -1,
      });
    }
  }

  private generateTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const T = 24;

    // ── Tiles do mapa ───────────────────────────────────────────
    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x68ab55, 0.5); g.fillRect(4, 6, 2, 3); g.fillRect(14, 12, 2, 3); g.fillRect(9, 18, 2, 3);
    g.generateTexture('tile-grass-1', T, T);

    g.clear(); g.fillStyle(0x4e8c40); g.fillRect(0, 0, T, T);
    g.fillStyle(0x5a9a4c, 0.5); g.fillRect(6, 4, 2, 3); g.fillRect(16, 16, 2, 3);
    g.generateTexture('tile-grass-2', T, T);

    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0xff6688); g.fillRect(5, 5, 2, 2);
    g.fillStyle(0xffee44); g.fillRect(15, 10, 2, 2);
    g.fillStyle(0xffffff); g.fillRect(10, 18, 2, 2);
    g.fillStyle(0x88bbff); g.fillRect(19, 3, 2, 2);
    g.generateTexture('tile-flowers', T, T);

    g.clear(); g.fillStyle(0x9b7653); g.fillRect(0, 0, T, T);
    g.fillStyle(0x8a6744, 0.5); g.fillRect(3, 8, 3, 2); g.fillRect(14, 4, 4, 2);
    g.generateTexture('tile-dirt', T, T);

    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x888888); g.fillCircle(12, 14, 4);
    g.fillStyle(0xaaaaaa, 0.6); g.fillCircle(11, 13, 2);
    g.generateTexture('tile-rock', T, T);

    g.clear(); g.fillStyle(0x3388cc); g.fillRect(0, 0, T, T);
    g.fillStyle(0x55aaee, 0.4); g.fillRect(2, 8, 8, 2); g.fillRect(12, 16, 6, 2);
    g.generateTexture('tile-water', T, T);

    g.clear(); g.fillStyle(0x5b9e4a); g.fillRect(0, 0, T, T);
    g.fillStyle(0x6b4226); g.fillRect(9, 12, 6, 12);
    g.fillStyle(0x2d7a2d); g.fillCircle(12, 8, 10);
    g.fillStyle(0x3d8a3d, 0.6); g.fillCircle(10, 6, 6);
    g.generateTexture('tile-tree', T, T);

    // ── Projéteis do player ──────────────────────────────────────
    g.clear(); g.fillStyle(0xff6600); g.fillCircle(6, 6, 6);
    g.fillStyle(0xffcc00, 0.8); g.fillCircle(6, 6, 3);
    g.generateTexture('ember-projectile', 12, 12);

    g.clear(); g.fillStyle(0xff4400); g.fillCircle(5, 5, 5);
    g.fillStyle(0xffaa00, 0.8); g.fillCircle(5, 5, 3);
    g.generateTexture('fire-orb', 10, 10);

    g.clear(); g.fillStyle(0xff6600); g.fillCircle(3, 3, 3);
    g.generateTexture('fire-particle', 6, 6);

    // Inferno projectile (maior, mais intenso)
    g.clear(); g.fillStyle(0xff2200); g.fillCircle(8, 8, 8);
    g.fillStyle(0xff6600, 0.8); g.fillCircle(8, 8, 5);
    g.fillStyle(0xffcc00, 0.6); g.fillCircle(8, 8, 3);
    g.generateTexture('inferno-projectile', 16, 16);

    // ── Projéteis inimigos ───────────────────────────────────────
    // Shadow Ball (Gastly) - roxo escuro
    g.clear(); g.fillStyle(0x6622aa); g.fillCircle(6, 6, 6);
    g.fillStyle(0x9944dd, 0.7); g.fillCircle(6, 6, 3);
    g.fillStyle(0xcc88ff, 0.4); g.fillCircle(5, 4, 2);
    g.generateTexture('shadow-ball', 12, 12);

    // Rock Throw (Geodude) - pedra marrom grande e visível
    g.clear();
    g.fillStyle(0x8B7355); g.fillCircle(12, 13, 11);    // corpo da pedra
    g.fillStyle(0xA08060); g.fillCircle(10, 10, 8);     // highlight
    g.fillStyle(0x6B5335, 0.8); g.fillCircle(14, 16, 6); // sombra inferior
    g.fillStyle(0xC0A080, 0.5); g.fillCircle(8, 8, 4);  // brilho
    g.fillStyle(0x5A4025, 0.6); g.fillCircle(15, 14, 3); // crack detail
    g.generateTexture('rock-projectile', 24, 24);

    // Supersonic wave (Zubat) - onda azul
    g.clear(); g.fillStyle(0x44aaff, 0.6); g.fillCircle(6, 6, 6);
    g.fillStyle(0x88ccff, 0.4); g.fillCircle(6, 6, 4);
    g.fillStyle(0xcceeFF, 0.3); g.fillCircle(6, 6, 2);
    g.generateTexture('supersonic-wave', 12, 12);

    // ── XP Gems (4 tiers) ─────────────────────────────────────────
    // Tier 1: Azul (1 XP) — diamante pequeno
    g.clear(); g.fillStyle(0x44bbff);
    g.fillTriangle(5, 0, 10, 5, 5, 10); g.fillTriangle(5, 0, 0, 5, 5, 10);
    g.generateTexture('xp-gem', 10, 10);

    // Tier 2: Verde (5 XP) — diamante medio com brilho
    g.clear(); g.fillStyle(0x22dd44);
    g.fillTriangle(5, 0, 10, 5, 5, 10); g.fillTriangle(5, 0, 0, 5, 5, 10);
    g.fillStyle(0x88ff88, 0.5); g.fillTriangle(5, 1, 8, 5, 5, 5);
    g.generateTexture('xp-gem-green', 10, 10);

    // Tier 3: Vermelho (25 XP) — diamante grande com brilho
    g.clear(); g.fillStyle(0xff3333);
    g.fillTriangle(6, 0, 12, 6, 6, 12); g.fillTriangle(6, 0, 0, 6, 6, 12);
    g.fillStyle(0xff8888, 0.5); g.fillTriangle(6, 1, 9, 6, 6, 6);
    g.generateTexture('xp-gem-red', 12, 12);

    // Tier 4: Roxo (100 XP) — diamante brilhante com glow
    g.clear(); g.fillStyle(0xaa44ff);
    g.fillTriangle(7, 0, 14, 7, 7, 14); g.fillTriangle(7, 0, 0, 7, 7, 14);
    g.fillStyle(0xdd88ff, 0.6); g.fillTriangle(7, 2, 11, 7, 7, 7);
    g.fillStyle(0xffffff, 0.3); g.fillTriangle(7, 1, 9, 5, 7, 5);
    g.generateTexture('xp-gem-purple', 14, 14);

    // ── Sombra ───────────────────────────────────────────────────
    g.clear(); g.fillStyle(0x000000, 0.25); g.fillEllipse(8, 4, 16, 8);
    g.generateTexture('shadow', 16, 8);

    // ── Objetos destrutíveis ─────────────────────────────────────
    // Tall Grass - moita de grama alta
    g.clear(); g.fillStyle(0x3d8a3d);
    g.fillRect(2, 8, 4, 12); g.fillRect(7, 5, 4, 15); g.fillRect(12, 7, 4, 13);
    g.fillStyle(0x4da04d); g.fillRect(4, 3, 3, 8); g.fillRect(10, 2, 3, 7);
    g.fillStyle(0x2d7a2d); g.fillRect(6, 6, 2, 10);
    g.generateTexture('dest-tall-grass', 18, 20);

    // Berry Bush - arbusto com frutinhas
    g.clear(); g.fillStyle(0x2d7a2d); g.fillCircle(10, 12, 9);
    g.fillStyle(0x3d8a3d, 0.7); g.fillCircle(8, 10, 6);
    g.fillStyle(0xff3344); g.fillCircle(6, 9, 2); g.fillCircle(13, 8, 2); g.fillCircle(10, 14, 2);
    g.fillStyle(0xff5566, 0.8); g.fillCircle(4, 12, 1.5);
    g.generateTexture('dest-berry-bush', 20, 20);

    // Rock - pedra grande quebrável
    g.clear(); g.fillStyle(0x777777); g.fillCircle(10, 10, 9);
    g.fillStyle(0x999999, 0.6); g.fillCircle(8, 7, 5);
    g.fillStyle(0x555555); g.fillRect(6, 10, 8, 2);
    g.fillStyle(0xaaaaaa, 0.3); g.fillCircle(7, 6, 2);
    g.generateTexture('dest-rock', 20, 20);

    // Treasure Chest - baú dourado
    g.clear();
    g.fillStyle(0x8B6914); g.fillRect(2, 6, 16, 12);
    g.fillStyle(0xDAA520); g.fillRect(3, 7, 14, 4);
    g.fillStyle(0xFFD700); g.fillRect(7, 5, 6, 3);
    g.fillStyle(0xFFE44D, 0.5); g.fillRect(8, 6, 4, 1);
    g.fillStyle(0x6B4226); g.fillRect(2, 11, 16, 1);
    g.generateTexture('dest-chest', 20, 18);

    // ── Pickups ──────────────────────────────────────────────────
    // Oran Berry - bolinha azul
    g.clear(); g.fillStyle(0x4488ff); g.fillCircle(5, 5, 5);
    g.fillStyle(0x66aaff, 0.7); g.fillCircle(4, 3, 2);
    g.fillStyle(0x338833); g.fillRect(4, 0, 2, 2);
    g.generateTexture('pickup-oran', 10, 10);

    // Magnet Burst - ímã
    g.clear(); g.fillStyle(0xcc0000); g.fillRect(1, 1, 4, 8);
    g.fillStyle(0x0000cc); g.fillRect(7, 1, 4, 8);
    g.fillStyle(0xcccccc); g.fillRect(4, 1, 4, 3);
    g.generateTexture('pickup-magnet', 12, 10);

    // Rare Candy - diamante dourado
    g.clear(); g.fillStyle(0xFFD700);
    g.fillTriangle(6, 0, 12, 6, 6, 12); g.fillTriangle(6, 0, 0, 6, 6, 12);
    g.fillStyle(0xFFE44D, 0.6); g.fillTriangle(6, 2, 10, 6, 6, 10);
    g.generateTexture('pickup-candy', 12, 12);

    // Pokéball Bomb - pokébola
    g.clear(); g.fillStyle(0xff0000); g.fillCircle(6, 6, 6);
    g.fillStyle(0xffffff); g.fillRect(0, 5, 12, 3);
    g.fillStyle(0xffffff); g.fillCircle(6, 6, 6);
    g.fillStyle(0xff0000); g.fillCircle(6, 3, 5);
    g.fillStyle(0x333333); g.fillRect(0, 5, 12, 2);
    g.fillStyle(0xffffff); g.fillCircle(6, 6, 2);
    g.fillStyle(0x333333); g.fillCircle(6, 6, 1);
    g.generateTexture('pickup-bomb', 12, 12);

    // XP Share - estrela roxa com brilho
    g.clear(); g.fillStyle(0xaa44ff);
    g.fillTriangle(6, 0, 8, 4, 12, 5); g.fillTriangle(12, 5, 8, 7, 10, 12);
    g.fillTriangle(10, 12, 6, 9, 2, 12); g.fillTriangle(2, 12, 4, 7, 0, 5);
    g.fillTriangle(0, 5, 4, 4, 6, 0);
    g.fillStyle(0xdd88ff, 0.7); g.fillCircle(6, 6, 2);
    g.generateTexture('pickup-xp-share', 12, 12);

    // Duplicator - seta dupla verde
    g.clear(); g.fillStyle(0x44dd44);
    g.fillTriangle(3, 0, 6, 4, 0, 4);
    g.fillRect(1, 4, 4, 4);
    g.fillStyle(0x66ff66);
    g.fillTriangle(9, 0, 12, 4, 6, 4);
    g.fillRect(7, 4, 4, 4);
    g.fillStyle(0xffffff, 0.3); g.fillRect(2, 1, 2, 2); g.fillRect(8, 1, 2, 2);
    g.generateTexture('pickup-duplicator', 12, 8);

    // Held Items textures
    // Charcoal
    g.clear(); g.fillStyle(0x333333); g.fillCircle(6, 6, 5);
    g.fillStyle(0xff4400, 0.6); g.fillCircle(5, 4, 2);
    g.fillStyle(0xff6600, 0.4); g.fillCircle(7, 7, 1.5);
    g.generateTexture('held-charcoal', 12, 12);

    // Wide Lens
    g.clear(); g.fillStyle(0x88ccff, 0.8); g.fillCircle(6, 6, 5);
    g.fillStyle(0xaaddff, 0.5); g.fillCircle(6, 6, 3);
    g.fillStyle(0xcccccc); g.fillRect(10, 5, 3, 2);
    g.generateTexture('held-wide-lens', 14, 12);

    // Choice Specs
    g.clear(); g.fillStyle(0xaa44ff); g.fillCircle(4, 5, 3); g.fillCircle(10, 5, 3);
    g.fillStyle(0xcc66ff, 0.5); g.fillCircle(4, 4, 1.5); g.fillCircle(10, 4, 1.5);
    g.fillStyle(0x666666); g.fillRect(6, 4, 3, 1);
    g.generateTexture('held-choice-specs', 14, 10);

    // Quick Claw
    g.clear(); g.fillStyle(0xeeeeee); g.fillTriangle(6, 0, 11, 10, 1, 10);
    g.fillStyle(0x44aaff, 0.6); g.fillTriangle(6, 2, 9, 9, 3, 9);
    g.generateTexture('held-quick-claw', 12, 12);

    // Leftovers
    g.clear(); g.fillStyle(0x88aa44); g.fillRect(2, 2, 8, 8);
    g.fillStyle(0xaacc66, 0.7); g.fillRect(3, 3, 6, 4);
    g.fillStyle(0x666644); g.fillRect(2, 6, 8, 2);
    g.generateTexture('held-leftovers', 12, 12);

    // Dragon Fang
    g.clear(); g.fillStyle(0x7744ff); g.fillTriangle(6, 0, 11, 12, 1, 12);
    g.fillStyle(0x9966ff, 0.6); g.fillTriangle(6, 3, 9, 10, 3, 10);
    g.generateTexture('held-dragon-fang', 12, 12);

    // Sharp Beak
    g.clear(); g.fillStyle(0x88ccff); g.fillTriangle(6, 0, 10, 12, 2, 12);
    g.fillStyle(0xaaddff, 0.5); g.fillTriangle(6, 2, 8, 10, 4, 10);
    g.fillStyle(0xffcc00); g.fillRect(4, 0, 4, 3);
    g.generateTexture('held-sharp-beak', 12, 12);

    // Silk Scarf
    g.clear(); g.fillStyle(0xffffff); g.fillRect(1, 3, 10, 4);
    g.fillStyle(0xeeeeee, 0.8); g.fillRect(2, 4, 8, 2);
    g.fillStyle(0xdddddd); g.fillRect(0, 5, 3, 5); g.fillRect(9, 5, 3, 5);
    g.generateTexture('held-silk-scarf', 12, 12);

    // Shell Bell
    g.clear(); g.fillStyle(0xffcc44); g.fillCircle(6, 6, 5);
    g.fillStyle(0xffdd66, 0.6); g.fillCircle(5, 5, 3);
    g.fillStyle(0xeeaa22); g.fillCircle(6, 8, 2);
    g.generateTexture('held-shell-bell', 12, 12);

    // Scope Lens
    g.clear(); g.fillStyle(0xff44aa); g.fillCircle(6, 6, 5);
    g.fillStyle(0xff66cc, 0.5); g.fillCircle(6, 6, 3);
    g.fillStyle(0x333333); g.fillRect(0, 5, 12, 2);
    g.fillStyle(0x333333); g.fillRect(5, 0, 2, 12);
    g.generateTexture('held-scope-lens', 12, 12);

    // Razor Claw
    g.clear(); g.fillStyle(0xcc4444); g.fillTriangle(2, 0, 6, 12, 0, 8);
    g.fillTriangle(6, 0, 10, 12, 4, 8);
    g.fillTriangle(10, 0, 12, 10, 8, 8);
    g.generateTexture('held-razor-claw', 12, 12);

    // Focus Band
    g.clear(); g.fillStyle(0xff8800); g.fillRect(0, 3, 12, 6);
    g.fillStyle(0xffaa44, 0.7); g.fillRect(1, 4, 10, 4);
    g.fillStyle(0xffcc00); g.fillCircle(6, 6, 2);
    g.generateTexture('held-focus-band', 12, 12);

    // Metronome
    g.clear(); g.fillStyle(0xdddddd); g.fillRect(5, 0, 2, 10);
    g.fillStyle(0xaaaaaa); g.fillRect(3, 8, 6, 4);
    g.fillStyle(0x44aaff); g.fillCircle(6, 2, 2);
    g.generateTexture('held-metronome', 12, 12);

    // Magnet (held)
    g.clear(); g.fillStyle(0xcc0000); g.fillRect(1, 1, 4, 8);
    g.fillStyle(0x0000cc); g.fillRect(7, 1, 4, 8);
    g.fillStyle(0xcccccc); g.fillRect(4, 1, 4, 3);
    g.generateTexture('held-magnet', 12, 10);

    // Mystic Water (held)
    g.clear(); g.fillStyle(0x3388ff); g.fillCircle(6, 6, 5);
    g.fillStyle(0x44aaff, 0.6); g.fillCircle(5, 4, 3);
    g.fillStyle(0x66ccff, 0.3); g.fillCircle(4, 3, 1.5);
    g.generateTexture('held-mystic-water', 12, 12);

    // Never-Melt Ice (held)
    g.clear(); g.fillStyle(0x88ddff); g.fillTriangle(6, 0, 11, 10, 1, 10);
    g.fillStyle(0xaaeeff, 0.6); g.fillTriangle(6, 2, 9, 9, 3, 9);
    g.fillStyle(0xffffff, 0.4); g.fillTriangle(6, 3, 8, 8, 4, 8);
    g.generateTexture('held-never-melt-ice', 12, 12);

    // ── Texturas de ataques (procedurais) ──────────────────────────
    // Slash arc (arco branco para Scratch/Slash/FurySwipes/NightSlash)
    g.clear(); g.fillStyle(0xffffff, 0.9);
    g.beginPath(); g.arc(16, 16, 14, -0.8, 0.8); g.lineTo(16, 16); g.closePath(); g.fill();
    g.fillStyle(0xcccccc, 0.5);
    g.beginPath(); g.arc(16, 16, 10, -0.6, 0.6); g.lineTo(16, 16); g.closePath(); g.fill();
    g.generateTexture('slash-arc', 32, 32);

    // Dragon claw (garras roxas para DragonClaw/DragonRush)
    g.clear(); g.fillStyle(0x7744ff, 0.9);
    g.fillTriangle(4, 0, 8, 20, 0, 20);
    g.fillTriangle(12, 0, 16, 20, 8, 20);
    g.fillTriangle(20, 0, 24, 20, 16, 20);
    g.fillStyle(0x9966ff, 0.5);
    g.fillTriangle(6, 4, 8, 16, 4, 16);
    g.fillTriangle(14, 4, 16, 16, 12, 16);
    g.generateTexture('dragon-claw', 24, 20);

    // Fire fang (mordida flamejante)
    g.clear(); g.fillStyle(0xff6600, 0.9);
    g.fillTriangle(0, 0, 6, 12, 12, 0);
    g.fillTriangle(10, 0, 16, 12, 22, 0);
    g.fillStyle(0xffaa00, 0.6);
    g.fillTriangle(2, 2, 6, 10, 10, 2);
    g.generateTexture('fire-fang', 22, 12);

    // Smoke cloud (para Smokescreen)
    g.clear(); g.fillStyle(0x666666, 0.6);
    g.fillCircle(8, 8, 7); g.fillCircle(14, 6, 5); g.fillCircle(6, 12, 6);
    g.fillStyle(0x888888, 0.4);
    g.fillCircle(10, 10, 4);
    g.generateTexture('smoke-cloud', 20, 18);

    // Wind blade (lâmina de ar para AirSlash/AerialAce)
    g.clear(); g.fillStyle(0x88ccff, 0.9);
    g.fillTriangle(0, 8, 20, 0, 20, 16);
    g.fillStyle(0xaaddff, 0.6);
    g.fillTriangle(4, 8, 18, 2, 18, 14);
    g.generateTexture('wind-blade', 20, 16);

    // Dragon energy (esfera para DragonBreath/DragonPulse)
    g.clear(); g.fillStyle(0x7744ff); g.fillCircle(8, 8, 8);
    g.fillStyle(0x9966ff, 0.7); g.fillCircle(7, 6, 5);
    g.fillStyle(0xcc88ff, 0.4); g.fillCircle(6, 5, 3);
    g.generateTexture('dragon-energy', 16, 16);

    // Dragon particle (para trails dracônicos)
    g.clear(); g.fillStyle(0x7744ff); g.fillCircle(3, 3, 3);
    g.generateTexture('dragon-particle', 6, 6);

    // Wind particle (para trails de vento)
    g.clear(); g.fillStyle(0x88ccff, 0.7); g.fillCircle(3, 3, 3);
    g.generateTexture('wind-particle', 6, 6);

    // Water particle (para trails aquáticos)
    g.clear(); g.fillStyle(0x3388ff); g.fillCircle(3, 3, 3);
    g.generateTexture('water-particle', 6, 6);

    // Ice particle (para trails de gelo)
    g.clear(); g.fillStyle(0x88ddff); g.fillCircle(3, 3, 3);
    g.generateTexture('ice-particle', 6, 6);

    // Meteor (para DracoMeteor)
    g.clear(); g.fillStyle(0xff4400); g.fillCircle(10, 10, 10);
    g.fillStyle(0xff8800, 0.7); g.fillCircle(8, 8, 6);
    g.fillStyle(0xffcc00, 0.5); g.fillCircle(7, 7, 3);
    g.generateTexture('meteor', 20, 20);

    // Heat wave ring (para HeatWave)
    g.clear(); g.lineStyle(4, 0xff4400, 0.8);
    g.strokeCircle(16, 16, 14);
    g.lineStyle(2, 0xffaa00, 0.5);
    g.strokeCircle(16, 16, 12);
    g.generateTexture('heat-ring', 32, 32);

    // Tornado (para Hurricane)
    g.clear(); g.fillStyle(0x88ccff, 0.7);
    g.fillEllipse(10, 4, 16, 6);
    g.fillStyle(0x66aadd, 0.6);
    g.fillEllipse(10, 10, 12, 5);
    g.fillStyle(0x4488bb, 0.5);
    g.fillEllipse(10, 16, 8, 4);
    g.generateTexture('tornado', 20, 20);

    // ── Phase 2-4 enemy projectiles/effects ───────────────────────
    // Confusion wave (Venonat, Venomoth, Butterfree) — psychic energy rings
    g.clear();
    g.lineStyle(2, 0x9933ff, 0.6); g.strokeCircle(8, 8, 7);
    g.lineStyle(1.5, 0xcc44ff, 0.8); g.strokeCircle(8, 8, 5);
    g.fillStyle(0xdd66ff, 0.9); g.fillCircle(8, 8, 3);
    g.fillStyle(0xffaaff, 0.5); g.fillCircle(7, 6, 1.5);
    g.generateTexture('confusion-wave', 16, 16);

    // Supersonic wave (Golbat) — sound wave arcs
    g.clear();
    g.lineStyle(2, 0x7744cc, 0.5); g.strokeCircle(10, 6, 10);
    g.lineStyle(1.5, 0x9966dd, 0.7); g.strokeCircle(10, 6, 7);
    g.lineStyle(1, 0xbb88ff, 0.9); g.strokeCircle(10, 6, 4);
    g.fillStyle(0xcc99ff, 0.6); g.fillCircle(10, 6, 2);
    g.generateTexture('supersonic-wave', 20, 12);

    // Psychic projectile (Hypno, Alakazam)
    g.clear(); g.fillStyle(0xff44aa); g.fillCircle(6, 6, 6);
    g.fillStyle(0xff88cc, 0.7); g.fillCircle(5, 5, 4);
    g.fillStyle(0xffaadd, 0.4); g.fillCircle(4, 4, 2);
    g.generateTexture('psychic-projectile', 12, 12);

    // Bone projectile (Cubone, Marowak)
    g.clear(); g.fillStyle(0xeeddbb); g.fillRect(0, 3, 16, 4);
    g.fillStyle(0xffeedd); g.fillCircle(2, 5, 3); g.fillCircle(14, 5, 3);
    g.fillStyle(0xccbb99, 0.6); g.fillRect(6, 4, 4, 2);
    g.generateTexture('bone-projectile', 16, 10);

    // Spore particle (Butterfree)
    g.clear(); g.fillStyle(0x66dd66, 0.7); g.fillCircle(3, 3, 3);
    g.generateTexture('spore-particle', 6, 6);

    // Heal aura visual (Gloom)
    g.clear(); g.fillStyle(0x44ff44, 0.3); g.fillCircle(8, 8, 8);
    g.fillStyle(0x66ff66, 0.2); g.fillCircle(8, 8, 6);
    g.generateTexture('heal-aura', 16, 16);

    // Explosion ring (Electrode)
    g.clear(); g.lineStyle(3, 0xff4400, 0.8); g.strokeCircle(12, 12, 10);
    g.lineStyle(2, 0xffaa00, 0.5); g.strokeCircle(12, 12, 8);
    g.lineStyle(1, 0xffcc00, 0.3); g.strokeCircle(12, 12, 5);
    g.generateTexture('explosion-ring', 24, 24);

    // ── Gacha Box (pokeball dourada) ──────────────────────────────
    g.clear();
    g.fillStyle(0xFFD700); g.fillCircle(16, 16, 14);  // corpo dourado
    g.fillStyle(0xFFE44D, 0.5); g.fillCircle(16, 12, 12); // metade superior mais clara
    g.fillStyle(0x8B6914); g.fillRect(2, 14, 28, 3);  // linha central escura
    g.fillStyle(0xFFD700); g.fillRect(2, 15, 28, 1);   // destaque na linha
    g.fillStyle(0xffffff); g.fillCircle(16, 16, 4);    // botão central branco
    g.fillStyle(0xFFD700); g.fillCircle(16, 16, 2);    // centro do botão dourado
    g.generateTexture('gacha-box', 32, 32);

    // ── Shards para Title Screen ──────────────────────────────────
    // Shard vermelho (fogo)
    g.clear(); g.fillStyle(0xff4400);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0xff6600, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-fire', 10, 8);

    // Shard azul (água)
    g.clear(); g.fillStyle(0x4488ff);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0x66aaff, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-water', 10, 8);

    // Shard verde (planta)
    g.clear(); g.fillStyle(0x44bb44);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0x66dd66, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-grass', 10, 8);

    // Shard dourado
    g.clear(); g.fillStyle(0xFFD700);
    g.fillTriangle(5, 0, 10, 8, 0, 8);
    g.fillStyle(0xFFE44D, 0.6);
    g.fillTriangle(5, 1, 8, 7, 2, 7);
    g.generateTexture('shard-gold', 10, 8);

    g.destroy();
  }
}
