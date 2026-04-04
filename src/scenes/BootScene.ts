import Phaser from 'phaser';
import { ENEMIES, STARTERS, CHARMANDER_FORMS, SQUIRTLE_FORMS, BULBASAUR_FORMS } from '../config';
import type { SpriteConfig, AttackAnimConfig, Direction } from '../types';
import { DIRECTION_ROW } from '../types';
import { EDITOR_TILES } from '../data/editor-tiles';
import { ENEMY_ATTACK_SPRITES } from '../data/sprites/enemies';
import { initLanguage, t } from '../i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    initLanguage();
    const { width, height } = this.cameras.main;

    const barBg = this.add.rectangle(width / 2, height / 2, 300, 20, 0x333333);
    const bar = this.add.rectangle(width / 2 - 148, height / 2, 0, 16, 0xff6600);
    bar.setOrigin(0, 0.5);
    const loadingText = this.add.text(width / 2, height / 2 - 30, t('boot.loading'), {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => { bar.width = 296 * value; });
    this.load.on('complete', () => { barBg.destroy(); bar.destroy(); loadingText.destroy(); });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`[BootScene] Failed to load: ${file.key} (${file.url})`);
    });

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
    for (const form of BULBASAUR_FORMS) {
      if (form.form !== 'base') this.loadSpritesheet(form.sprite);
    }
    for (const config of Object.values(ENEMIES)) {
      this.loadSpritesheet(config.sprite);
    }
    // Attack/Shoot/Charge animation spritesheets (PMDCollab)
    for (const atkSprite of Object.values(ENEMY_ATTACK_SPRITES)) {
      this.loadSpritesheet(atkSprite);
    }

    // Artwork oficial dos starters + evoluções (para Title Screen / evolução)
    this.load.image('art-charmander', 'assets/artwork/charmander.png');
    this.load.image('art-squirtle', 'assets/artwork/squirtle.png');
    this.load.image('art-bulbasaur', 'assets/artwork/bulbasaur.png');
    this.load.image('art-charmeleon', 'assets/artwork/charmeleon.png');
    this.load.image('art-charizard', 'assets/artwork/charizard.png');
    this.load.image('art-wartortle', 'assets/artwork/wartortle.png');
    this.load.image('art-blastoise', 'assets/artwork/blastoise.png');
    this.load.image('art-ivysaur', 'assets/artwork/ivysaur.png');
    this.load.image('art-venusaur', 'assets/artwork/venusaur.png');

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
    this.load.image('item-quick-powder', 'assets/items/quick-powder.png');
    this.load.image('item-silk-scarf', 'assets/items/silk-scarf.png');
    this.load.image('item-metronome', 'assets/items/metronome.png');
    this.load.image('item-mystic-water', 'assets/items/mystic-water.png');
    this.load.image('item-never-melt-ice', 'assets/items/never-melt-ice.png');
    this.load.image('item-water-stone', 'assets/items/water-stone.png');
    this.load.image('item-leaf-stone', 'assets/items/leaf-stone.png');
    this.load.image('item-miracle-seed', 'assets/items/miracle-seed.png');
    this.load.image('item-big-root', 'assets/items/big-root.png');
    this.load.image('item-black-sludge', 'assets/items/black-sludge.png');
    this.load.image('item-revive', 'assets/items/revive.png');
    this.load.image('item-max-revive', 'assets/items/max-revive.png');

    // ── Coin sprites (PokeAPI nuggets) ──────────────────────────
    this.load.image('coin-small', 'assets/items/nugget.png');
    this.load.image('coin-medium', 'assets/items/nugget.png');
    this.load.image('coin-large', 'assets/items/big-nugget.png');

    // ── Tile themes (game world tiles — used by WorldSystem) ─────
    const tileThemes = ['emerald', 'frlg', 'pmd', 'crystal', 'magma', 'sky', 'dark', 'route'] as const;
    const tileNames = ['grass-light', 'grass-dark', 'grass-flower', 'dirt', 'water', 'water-edge', 'tree', 'rock', 'path'] as const;
    for (const theme of tileThemes) {
      this.load.image(`theme-preview-${theme}`, `assets/tiles/${theme}/preview.png`);
      for (const tile of tileNames) {
        this.load.image(`tile-${theme}-${tile}`, `assets/tiles/${theme}/${tile}.png`);
      }
    }

    // ── Tree obstacles (Phase 2) ────────────────────────────────
    for (const name of ['tree-big-light', 'tree-big-green', 'tree-big-dark', 'tree-big-vdark']) {
      this.load.image(name, `assets/trees/${name}.png`);
    }

    // ── Editor tiles (Map Editor palette — all extracted tiles) ─
    for (const edTile of EDITOR_TILES) {
      this.load.image(edTile.id, edTile.path);
    }

    // ── Destructible sprites (PokeAPI items) ─────────────────────
    this.load.image('dest-tall-grass', 'assets/items/dest-tall-grass.png');
    this.load.image('dest-berry-bush', 'assets/items/dest-berry-bush.png');
    this.load.image('dest-rock', 'assets/items/dest-rock.png');
    this.load.image('dest-chest', 'assets/items/dest-chest.png');

    // ── Real pickup sprites (PokeAPI) ───────────────────────────
    this.load.image('pickup-oran', 'assets/items/oran-berry.png');
    this.load.image('pickup-sitrus', 'assets/items/sitrus-berry.png');
    this.load.image('pickup-liechi', 'assets/items/liechi-berry.png');
    this.load.image('pickup-salac', 'assets/items/salac-berry.png');
    this.load.image('pickup-candy', 'assets/items/rare-candy.png');
    this.load.image('pickup-magnet', 'assets/items/magnet.png');
    this.load.image('pickup-bomb', 'assets/items/poke-ball.png');
    this.load.image('pickup-xp-share', 'assets/items/exp-share.png');
    this.load.image('pickup-duplicator', 'assets/items/up-grade.png');
    this.load.image('friend-ball', 'assets/items/friend-ball.png');
    this.load.image('gacha-box', 'assets/items/poke-ball.png');

    // ── Mega stone sprites (PokeAPI) ────────────────────────────
    this.load.image('mega-stone-fire', 'assets/items/charizardite-x.png');
    this.load.image('mega-stone-water', 'assets/items/blastoisinite.png');
    this.load.image('mega-stone-grass', 'assets/items/venusaurite.png');

    // ── Mega form artwork (PokeAPI official artwork) ──────────
    this.load.image('art-mega-charizard-x', 'assets/artwork/mega-charizard-x.png');
    this.load.image('art-mega-blastoise', 'assets/artwork/mega-blastoise.png');
    this.load.image('art-mega-venusaur', 'assets/artwork/mega-venusaur.png');

    // ── Mega form walk sprites (PMDCollab — sprite/{dex}/0000/0001/) ─
    this.load.spritesheet('mega-charizard-x-walk', 'assets/pokemon/mega-charizard-x-walk.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('mega-blastoise-walk', 'assets/pokemon/mega-blastoise-walk.png', { frameWidth: 32, frameHeight: 40 });
    this.load.spritesheet('mega-venusaur-walk', 'assets/pokemon/mega-venusaur-walk.png', { frameWidth: 32, frameHeight: 32 });

    // ── Mew sprite (PMDCollab — Legendary event) ────────────────
    this.load.spritesheet('mew-walk', 'assets/pokemon/mew-walk.png', { frameWidth: 40, frameHeight: 64 });

    // ── Healing effect sprite (pokemonAutoChess RECOVER) ────────
    this.load.spritesheet('atk-recover', 'assets/attacks/normal/recover-sheet.png', { frameWidth: 64, frameHeight: 64 });

    // ── Fire attack spritesheets ──────────────────────────────────
    this.load.spritesheet('atk-ember', 'assets/attacks/fire/ember-sheet.png', { frameWidth: 26, frameHeight: 26 });
    this.load.spritesheet('atk-fire-range', 'assets/attacks/fire/fire-range-sheet.png', { frameWidth: 40, frameHeight: 40 });
    this.load.spritesheet('atk-fire-hit', 'assets/attacks/fire/fire-hit-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-flamethrower', 'assets/attacks/fire/flamethrower-sheet.png', { frameWidth: 80, frameHeight: 96 });
    // Flamethrower Tibia (4 cardinal dirs, 6 frames each, 96x96)
    this.load.spritesheet('atk-flame-up', 'assets/attacks/fire/flamethrower-tibia-se-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-flame-down', 'assets/attacks/fire/flamethrower-tibia-sw-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-flame-left', 'assets/attacks/fire/flamethrower-tibia-e-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-flame-right', 'assets/attacks/fire/flamethrower-tibia-ne-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-fire-blast', 'assets/attacks/fire/fire-blast-sheet.png', { frameWidth: 72, frameHeight: 73 });
    this.load.spritesheet('atk-blast-burn', 'assets/attacks/fire/blast-burn-sheet.png', { frameWidth: 80, frameHeight: 80 });
    this.load.spritesheet('atk-fire-fang', 'assets/attacks/fire/fire-fang-sheet.png', { frameWidth: 80, frameHeight: 64 });
    this.load.spritesheet('atk-flame-charge-up', 'assets/attacks/fire/flame-charge-up-sheet.png', { frameWidth: 32, frameHeight: 160 });
    this.load.spritesheet('atk-flame-charge-down', 'assets/attacks/fire/flame-charge-down-sheet.png', { frameWidth: 32, frameHeight: 160 });
    this.load.spritesheet('atk-flame-charge-left', 'assets/attacks/fire/flame-charge-left-sheet.png', { frameWidth: 160, frameHeight: 32 });
    this.load.spritesheet('atk-flame-charge-right', 'assets/attacks/fire/flame-charge-right-sheet.png', { frameWidth: 160, frameHeight: 32 });
    this.load.spritesheet('atk-flare-blitz', 'assets/attacks/fire/flare-blitz-sheet.png', { frameWidth: 96, frameHeight: 83 });
    this.load.spritesheet('atk-heat-wave', 'assets/attacks/fire/heat-wave-sheet.png', { frameWidth: 96, frameHeight: 82 });

    // ── Normal/melee attack spritesheets ─────────────────────────
    this.load.spritesheet('atk-scratch', 'assets/attacks/normal/scratch-sheet.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('atk-slash', 'assets/attacks/normal/slash-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-fury-swipes', 'assets/attacks/normal/fury-swipes-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-night-slash', 'assets/attacks/normal/night-slash-sheet.png', { frameWidth: 56, frameHeight: 64 });
    this.load.spritesheet('atk-blaze-kick', 'assets/attacks/normal/blaze-kick-sheet.png', { frameWidth: 64, frameHeight: 72 });
    this.load.spritesheet('atk-smokescreen', 'assets/attacks/normal/smokescreen-sheet.png', { frameWidth: 45, frameHeight: 45 });
    this.load.spritesheet('atk-hyper-voice', 'assets/attacks/normal/hyper-voice-sheet.png', { frameWidth: 96, frameHeight: 28 });
    this.load.spritesheet('atk-bite', 'assets/attacks/normal/bite-sheet.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('atk-stomp', 'assets/attacks/normal/stomp-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-thrash', 'assets/attacks/normal/thrash-sheet.png', { frameWidth: 48, frameHeight: 32 });
    this.load.spritesheet('atk-explosion', 'assets/attacks/normal/explosion-sheet.png', { frameWidth: 168, frameHeight: 128 });
    this.load.spritesheet('atk-golem-explosion', 'assets/attacks/normal/explosion-sheet.png', { frameWidth: 168, frameHeight: 128 });

    // ── Dragon attack spritesheets ──────────────────────────────
    this.load.spritesheet('atk-dragon-breath', 'assets/attacks/dragon/dragon-breath-sheet.png', { frameWidth: 32, frameHeight: 74 });
    this.load.spritesheet('atk-dragon-claw', 'assets/attacks/dragon/dragon-claw-sheet.png', { frameWidth: 96, frameHeight: 78 });
    this.load.spritesheet('atk-dragon-pulse', 'assets/attacks/dragon/dragon-pulse-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-dragon-rush', 'assets/attacks/dragon/dragon-rush-sheet.png', { frameWidth: 65, frameHeight: 64 });
    this.load.spritesheet('atk-draco-meteor', 'assets/attacks/dragon/draco-meteor-sheet.png', { frameWidth: 96, frameHeight: 58 });
    this.load.spritesheet('atk-outrage', 'assets/attacks/dragon/outrage-sheet.png', { frameWidth: 48, frameHeight: 72 });

    // ── Flying attack spritesheets ──────────────────────────────
    this.load.spritesheet('atk-air-slash', 'assets/attacks/flying/air-slash-sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('atk-aerial-ace', 'assets/attacks/flying/aerial-ace-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-hurricane', 'assets/attacks/flying/hurricane-sheet.png', { frameWidth: 56, frameHeight: 80 });
    this.load.spritesheet('atk-hurricane-boss', 'assets/attacks/flying/hurricane-sheet.png', { frameWidth: 56, frameHeight: 80 });

    // ── Ghost attack spritesheets ───────────────────────────────
    this.load.spritesheet('atk-shadow-ball', 'assets/attacks/ghost/shadow-ball-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-shadow-ball-wave', 'assets/attacks/ghost/shadow-ball-wave.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-shadow-ball-hit', 'assets/attacks/ghost/shadow-ball-hit-sheet.png', { frameWidth: 96, frameHeight: 48 });
    this.load.spritesheet('atk-lick-gengar', 'assets/attacks/ghost/lick-gengar-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-shadow-bite', 'assets/attacks/ghost/gengar-shadow-bite-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-gengar-buff', 'assets/attacks/ghost/gengar-buff-sheet.png', { frameWidth: 32, frameHeight: 64 });

    // ── Rock attack spritesheets ────────────────────────────────
    this.load.spritesheet('atk-rock-slide', 'assets/attacks/rock/rock-slide-sheet.png', { frameWidth: 48, frameHeight: 96 });
    this.load.spritesheet('atk-rock-throw', 'assets/attacks/rock/rock-throw-sheet.png', { frameWidth: 16, frameHeight: 16 });

    // ── Psychic attack spritesheets ─────────────────────────────
    this.load.spritesheet('atk-psybeam', 'assets/attacks/psychic/psybeam-sheet.png', { frameWidth: 32, frameHeight: 240 });
    this.load.spritesheet('atk-psychic', 'assets/attacks/psychic/psychic-sheet.png', { frameWidth: 64, frameHeight: 64 });

    // ── Ground attack spritesheets ──────────────────────────────
    this.load.spritesheet('atk-bonemerang', 'assets/attacks/ground/bonemerang-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-ground-melee', 'assets/attacks/ground/ground-melee-sheet.png', { frameWidth: 80, frameHeight: 80 });

    // ── Poison attack spritesheets ──────────────────────────────
    this.load.spritesheet('atk-gunk-shot', 'assets/attacks/poison/gunk-shot-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-venoshock', 'assets/attacks/normal/venoshock-sheet.png', { frameWidth: 32, frameHeight: 80 });
    this.load.spritesheet('atk-acid-spray', 'assets/attacks/poison/acid-spray-sheet.png', { frameWidth: 80, frameHeight: 80 });
    this.load.spritesheet('atk-smog', 'assets/attacks/poison/smog-sheet.png', { frameWidth: 50, frameHeight: 50 });
    this.load.spritesheet('atk-sludge-wave', 'assets/attacks/poison/sludge-wave-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-poison-melee', 'assets/attacks/poison/poison-melee-sheet.png', { frameWidth: 56, frameHeight: 64 });

    // ── Dark attack spritesheets ────────────────────────────────
    this.load.spritesheet('atk-dark-melee', 'assets/attacks/dark/dark-melee-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-dark-hit', 'assets/attacks/dark/dark-hit-sheet.png', { frameWidth: 64, frameHeight: 62 });

    // ── Normal (extra) ──────────────────────────────────────────
    this.load.spritesheet('atk-extreme-speed', 'assets/attacks/normal/extreme-speed-sheet.png', { frameWidth: 72, frameHeight: 72 });

    // ── Water attack spritesheets (Squirtle line) ───────────────
    this.load.spritesheet('atk-water-pulse', 'assets/attacks/water/water-pulse-sheet.png', { frameWidth: 200, frameHeight: 104 });
    this.load.spritesheet('atk-aqua-jet-up', 'assets/attacks/water/aqua-jet-down-sheet.png', { frameWidth: 96, frameHeight: 160 });
    this.load.spritesheet('atk-aqua-jet-down', 'assets/attacks/water/aqua-jet-up-sheet.png', { frameWidth: 96, frameHeight: 160 });
    this.load.spritesheet('atk-aqua-jet-left', 'assets/attacks/water/aqua-jet-right-sheet.png', { frameWidth: 160, frameHeight: 96 });
    this.load.spritesheet('atk-aqua-jet-right', 'assets/attacks/water/aqua-jet-left-sheet.png', { frameWidth: 160, frameHeight: 96 });
    this.load.spritesheet('atk-hydro-pump', 'assets/attacks/water/hydro-pump-sheet.png', { frameWidth: 96, frameHeight: 160 });
    this.load.spritesheet('atk-surf', 'assets/attacks/water/surf-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-liquidation', 'assets/attacks/water/liquidation-sheet.png', { frameWidth: 200, frameHeight: 120 });
    this.load.spritesheet('atk-aqua-tail-up', 'assets/attacks/water/aqua-tail-down-sheet.png', { frameWidth: 64, frameHeight: 96 });
    this.load.spritesheet('atk-aqua-tail-down', 'assets/attacks/water/aqua-tail-up-sheet.png', { frameWidth: 64, frameHeight: 96 });
    this.load.spritesheet('atk-aqua-tail-left', 'assets/attacks/water/aqua-tail-right-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-aqua-tail-right', 'assets/attacks/water/aqua-tail-left-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-rapid-spin', 'assets/attacks/water/rapid-spin-sheet.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('atk-water-range', 'assets/attacks/water/water-range-sheet.png', { frameWidth: 8, frameHeight: 8 });
    this.load.spritesheet('atk-water-hit', 'assets/attacks/water/water-hit-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-wave-splash', 'assets/attacks/water/wave-splash-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-sparkling-aria', 'assets/attacks/water/sparkling-aria-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-water-melee', 'assets/attacks/water/water-melee-sheet.png', { frameWidth: 56, frameHeight: 56 });
    this.load.spritesheet('atk-origin-pulse', 'assets/attacks/water/origin-pulse-sheet.png', { frameWidth: 128, frameHeight: 32 });

    // ── Ice attack spritesheets ─────────────────────────────────
    this.load.spritesheet('atk-ice-range', 'assets/attacks/ice/ice-range-sheet.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('atk-frost-breath', 'assets/attacks/ice/frost-breath-sheet.png', { frameWidth: 64, frameHeight: 64 });

    // ── Bulbasaur line attacks (Grass type) ────────────────────
    this.load.spritesheet('atk-vine-whip', 'assets/attacks/grass/vine-whip-sheet.png', { frameWidth: 80, frameHeight: 40 });
    this.load.spritesheet('atk-razor-leaf', 'assets/attacks/grass/razor-leaf-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-leech-seed', 'assets/attacks/grass/leech-seed-sheet.png', { frameWidth: 8, frameHeight: 8 });
    this.load.spritesheet('atk-grass-melee', 'assets/attacks/grass/grass-melee-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-cotton-spore', 'assets/attacks/grass/cotton-spore-sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('atk-stun-spore', 'assets/attacks/grass/stun-spore-sheet.png', { frameWidth: 40, frameHeight: 64 });
    this.load.spritesheet('atk-leaf-blade', 'assets/attacks/grass/leaf-blade-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-solar-beam', 'assets/attacks/grass/solar-beam-sheet.png', { frameWidth: 32, frameHeight: 128 });
    this.load.spritesheet('atk-petal-dance', 'assets/attacks/grass/petal-dance-sheet.png', { frameWidth: 64, frameHeight: 88 });
    this.load.spritesheet('atk-leech-life', 'assets/attacks/grass/leech-life-sheet.png', { frameWidth: 80, frameHeight: 72 });
    this.load.spritesheet('atk-magical-leaf', 'assets/attacks/grass/magical-leaf-sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('atk-ingrain', 'assets/attacks/grass/ingrain-sheet.png', { frameWidth: 80, frameHeight: 64 });
    this.load.spritesheet('atk-petal-blizzard', 'assets/attacks/grass/petal-blizzard-sheet.png', { frameWidth: 88, frameHeight: 72 });
    this.load.spritesheet('atk-power-whip', 'assets/attacks/grass/power-whip-sheet.png', { frameWidth: 80, frameHeight: 48 });
    this.load.spritesheet('atk-seed-flare', 'assets/attacks/grass/seed-flare-sheet.png', { frameWidth: 96, frameHeight: 80 });
    this.load.spritesheet('atk-solar-blade', 'assets/attacks/grass/solar-blade-sheet.png', { frameWidth: 128, frameHeight: 64 });
    this.load.spritesheet('atk-wood-hammer', 'assets/attacks/grass/wood-hammer-sheet.png', { frameWidth: 200, frameHeight: 150 });
    this.load.spritesheet('atk-aromatherapy', 'assets/attacks/grass/aromatherapy-sheet.png', { frameWidth: 88, frameHeight: 72 });
    this.load.spritesheet('atk-grass-hit', 'assets/attacks/grass/grass-hit-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-grass-cell', 'assets/attacks/grass/grass-cell-sheet.png', { frameWidth: 48, frameHeight: 48 });

    // ── Tibia-converted boss attack spritesheets ──────────────
    // Fire
    this.load.spritesheet('atk-eruption', 'assets/attacks/fire/eruption-sheet.png', { frameWidth: 96, frameHeight: 96 });
    // Water
    this.load.spritesheet('atk-surf-tibia', 'assets/attacks/water/surf-tibia-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-surf-wave-up', 'assets/attacks/water/surf-wave-up-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-surf-wave-down', 'assets/attacks/water/surf-wave-down-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-surf-wave-left', 'assets/attacks/water/surf-wave-left-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-surf-wave-right', 'assets/attacks/water/surf-wave-right-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-whirlpool-tibia', 'assets/attacks/water/whirlpool-tibia-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-whirlpool-rings', 'assets/attacks/water/whirlpool-rings-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-bubble-shot', 'assets/attacks/water/bubble-shot-sheet.png', { frameWidth: 32, frameHeight: 32 });
    // Flying
    this.load.spritesheet('atk-twister', 'assets/attacks/flying/twister-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-gust', 'assets/attacks/flying/gust-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-air-cutter-up', 'assets/attacks/flying/air-cutter-up-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-air-cutter-down', 'assets/attacks/flying/air-cutter-down-sheet.png', { frameWidth: 64, frameHeight: 96 });
    this.load.spritesheet('atk-air-cutter-left', 'assets/attacks/flying/air-cutter-left-sheet.png', { frameWidth: 64, frameHeight: 96 });
    this.load.spritesheet('atk-air-cutter-right', 'assets/attacks/flying/air-cutter-right-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-brave-bird-tibia', 'assets/attacks/flying/brave-bird-tibia-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-air-slash-x', 'assets/attacks/flying/air-slash-x-sheet.png', { frameWidth: 96, frameHeight: 96 });
    // Ghost (Shadow Ball is spherical — same sheet for all directions)
    this.load.spritesheet('atk-shadow-ball-up', 'assets/attacks/ghost/shadow-ball-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-shadow-ball-down', 'assets/attacks/ghost/shadow-ball-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-shadow-ball-left', 'assets/attacks/ghost/shadow-ball-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-shadow-ball-right', 'assets/attacks/ghost/shadow-ball-sheet.png', { frameWidth: 96, frameHeight: 64 });
    // Psychic
    this.load.spritesheet('atk-psywave-a', 'assets/attacks/psychic/psywave-a-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-psywave-b', 'assets/attacks/psychic/psywave-b-sheet.png', { frameWidth: 32, frameHeight: 32 });
    // Rock
    this.load.spritesheet('atk-stone-edge-tibia', 'assets/attacks/rock/stone-edge-tibia-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-rock-slide-tibia', 'assets/attacks/rock/rock-slide-tibia-sheet.png', { frameWidth: 32, frameHeight: 32 });
    // Ground
    this.load.spritesheet('atk-bonemerang-tibia', 'assets/attacks/ground/bonemerang-tibia-sheet.png', { frameWidth: 32, frameHeight: 32 });
    // Fighting
    this.load.spritesheet('atk-dynamic-punch-up', 'assets/attacks/fighting/dynamic-punch-up-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-dynamic-punch-down', 'assets/attacks/fighting/dynamic-punch-down-sheet.png', { frameWidth: 96, frameHeight: 64 });
    this.load.spritesheet('atk-dynamic-punch-left', 'assets/attacks/fighting/dynamic-punch-left-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-dynamic-punch-right', 'assets/attacks/fighting/dynamic-punch-right-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('atk-cross-chop-up', 'assets/attacks/fighting/cross-chop-up-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-cross-chop-down', 'assets/attacks/fighting/cross-chop-down-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-cross-chop-left', 'assets/attacks/fighting/cross-chop-left-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-cross-chop-right', 'assets/attacks/fighting/cross-chop-right-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-focus-blast', 'assets/attacks/fighting/focus-blast-sheet.png', { frameWidth: 96, frameHeight: 96 });
    // Bug
    this.load.spritesheet('atk-x-scissor-a', 'assets/attacks/bug/x-scissor-a-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-x-scissor-b', 'assets/attacks/bug/x-scissor-b-sheet.png', { frameWidth: 96, frameHeight: 96 });
    // Poison (boss attacks)
    this.load.spritesheet('atk-poison-range', 'assets/attacks/poison/poison-range-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-screech', 'assets/attacks/poison/screech-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-dark-range', 'assets/attacks/dark/dark-range-sheet.png', { frameWidth: 32, frameHeight: 32 });

    // ── PAC (pokemonAutoChess) Boss Attack Upgrades ──────────────
    this.load.spritesheet('atk-super-fang', 'assets/attacks/normal/super-fang-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-precipice-blades', 'assets/attacks/ground/precipice-blades-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-dynamax-cannon', 'assets/attacks/normal/dynamax-cannon-sheet.png', { frameWidth: 32, frameHeight: 240 });
    this.load.spritesheet('atk-heavy-slam', 'assets/attacks/fighting/heavy-slam-sheet.png', { frameWidth: 31, frameHeight: 16 });
    this.load.spritesheet('atk-petal-dance-pac', 'assets/attacks/grass/petal-dance-pac-sheet.png', { frameWidth: 64, frameHeight: 88 });
    this.load.spritesheet('atk-stun-spore-pac', 'assets/attacks/grass/stun-spore-pac-sheet.png', { frameWidth: 40, frameHeight: 64 });
    this.load.spritesheet('atk-close-combat-pac', 'assets/attacks/fighting/close-combat-pac-sheet.png', { frameWidth: 65, frameHeight: 64 });
    this.load.spritesheet('atk-seismic-toss-pac', 'assets/attacks/fighting/seismic-toss-pac-sheet.png', { frameWidth: 80, frameHeight: 64 });
    this.load.spritesheet('atk-dream-eater-pac', 'assets/attacks/ghost/dream-eater-pac-sheet.png', { frameWidth: 56, frameHeight: 56 });
    this.load.spritesheet('atk-night-shade-pac', 'assets/attacks/ghost/night-shade-pac-sheet.png', { frameWidth: 64, frameHeight: 57 });
    this.load.spritesheet('atk-rock-slide-pac', 'assets/attacks/rock/rock-slide-pac-sheet.png', { frameWidth: 80, frameHeight: 256 });
    this.load.spritesheet('atk-explosion-pac', 'assets/attacks/normal/explosion-pac-sheet.png', { frameWidth: 168, frameHeight: 128 });
    this.load.spritesheet('atk-bulk-up-pac', 'assets/attacks/fighting/bulk-up-pac-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-future-sight-pac', 'assets/attacks/psychic/future-sight-pac-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-psystrike-pac', 'assets/attacks/psychic/psystrike-pac-sheet.png', { frameWidth: 64, frameHeight: 64 });

    // ── PAC Status Effects ───────────────────────────────────────
    this.load.spritesheet('status-burn', 'assets/attacks/status/burn-sheet.png', { frameWidth: 13, frameHeight: 16 });
    this.load.spritesheet('status-poison', 'assets/attacks/status/poison-sheet.png', { frameWidth: 14, frameHeight: 15 });
    this.load.spritesheet('status-paralysis', 'assets/attacks/status/paralysis-sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('status-confusion', 'assets/attacks/status/confusion-sheet.png', { frameWidth: 32, frameHeight: 15 });
    this.load.spritesheet('status-freeze', 'assets/attacks/status/freeze-sheet.png', { frameWidth: 31, frameHeight: 31 });
    this.load.spritesheet('status-sleep', 'assets/attacks/status/sleep-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('status-protect', 'assets/attacks/status/protect-sheet.png', { frameWidth: 12, frameHeight: 13 });

    // ── PAC Generic Type Attacks ─────────────────────────────────
    this.load.spritesheet('atk-fairy-hit', 'assets/attacks/fairy/fairy-hit-sheet.png', { frameWidth: 40, frameHeight: 32 });
    this.load.spritesheet('atk-fairy-melee', 'assets/attacks/fairy/fairy-melee-sheet.png', { frameWidth: 48, frameHeight: 32 });
    this.load.spritesheet('atk-fairy-range', 'assets/attacks/fairy/fairy-range-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-electric-hit', 'assets/attacks/electric/electric-hit-sheet.png', { frameWidth: 88, frameHeight: 48 });
    this.load.spritesheet('atk-electric-melee', 'assets/attacks/electric/electric-melee-sheet.png', { frameWidth: 72, frameHeight: 64 });
    this.load.spritesheet('atk-electric-range', 'assets/attacks/electric/electric-range-sheet.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('atk-ice-hit', 'assets/attacks/ice/ice-hit-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-ice-melee', 'assets/attacks/ice/ice-melee-sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('atk-ice-cell', 'assets/attacks/ice/ice-cell-sheet.png', { frameWidth: 40, frameHeight: 48 });
    this.load.spritesheet('atk-steel-hit', 'assets/attacks/steel/steel-hit-sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('atk-steel-melee', 'assets/attacks/steel/steel-melee-sheet.png', { frameWidth: 64, frameHeight: 56 });
    this.load.spritesheet('atk-steel-range', 'assets/attacks/steel/steel-range-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-fighting-hit', 'assets/attacks/fighting/fighting-hit-sheet.png', { frameWidth: 72, frameHeight: 72 });
    this.load.spritesheet('atk-fighting-range', 'assets/attacks/fighting/fighting-range-sheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('atk-sound-hit', 'assets/attacks/sound/sound-hit-sheet.png', { frameWidth: 88, frameHeight: 88 });
    this.load.spritesheet('atk-sound-range', 'assets/attacks/sound/sound-range-sheet.png', { frameWidth: 32, frameHeight: 24 });

    // ── PAC Environment Atlases ──────────────────────────────────
    this.load.atlas('env-portal', 'assets/pokeautochess-content/environment/portal.png', 'assets/pokeautochess-content/environment/portal.json');
    this.load.atlas('env-chest', 'assets/pokeautochess-content/environment/chest.png', 'assets/pokeautochess-content/environment/chest.json');
    this.load.atlas('env-shine', 'assets/pokeautochess-content/environment/shine.png', 'assets/pokeautochess-content/environment/shine.json');

    // ── Weather Overlays ───────────────────────────────────────
    this.load.image('weather-rain', 'assets/pokeautochess-content/environment/rain.png');
    this.load.image('weather-fog', 'assets/pokeautochess-content/environment/fog.png');
    this.load.image('weather-sand', 'assets/pokeautochess-content/environment/sand.png');

    // ── PAC Item Sprites HD ──────────────────────────────────────
    this.load.image('item-mystery-box', 'assets/pokeautochess-content/item{tps}/MYSTERY_BOX.png');
    this.load.image('item-treasure-box', 'assets/pokeautochess-content/item{tps}/TREASURE_BOX.png');
    this.load.image('item-rare-candy-pac', 'assets/pokeautochess-content/item{tps}/RARE_CANDY.png');
    this.load.image('item-coin-pac', 'assets/pokeautochess-content/item{tps}/COIN.png');

    // ── PAC Sound Effects ────────────────────────────────────────
    this.load.audio('sfx-click', 'assets/sounds/click.ogg');
    this.load.audio('sfx-hover', 'assets/sounds/hover.ogg');
    this.load.audio('sfx-evolve-t2', 'assets/sounds/evolve-t2.ogg');
    this.load.audio('sfx-evolve-t3', 'assets/sounds/evolve-t3.ogg');
    this.load.audio('sfx-start', 'assets/sounds/start.ogg');
    this.load.audio('sfx-victory', 'assets/sounds/victory.ogg');
    this.load.audio('sfx-gameover', 'assets/sounds/gameover.ogg');
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
    for (const form of BULBASAUR_FORMS) {
      if (form.form !== 'base') this.createWalkAnims(form.sprite);
    }
    for (const config of Object.values(ENEMIES)) {
      this.createWalkAnims(config.sprite);
    }
    // Attack/Shoot/Charge animations (play once, then return to walk)
    for (const atkSprite of Object.values(ENEMY_ATTACK_SPRITES)) {
      this.createEnemyAttackAnims(atkSprite);
    }
    // Mew walk anims (Legendary event — not in ENEMIES registry)
    this.createWalkAnims({ key: 'mew-walk', path: 'assets/pokemon/mew-walk.png', frameWidth: 40, frameHeight: 64, frameCount: 6, directions: 8 });
    // Mega form walk anims (PMDCollab)
    this.createWalkAnims({ key: 'mega-charizard-x-walk', path: 'assets/pokemon/mega-charizard-x-walk.png', frameWidth: 48, frameHeight: 48, frameCount: 4, directions: 8 });
    this.createWalkAnims({ key: 'mega-blastoise-walk', path: 'assets/pokemon/mega-blastoise-walk.png', frameWidth: 32, frameHeight: 40, frameCount: 4, directions: 8 });
    this.createWalkAnims({ key: 'mega-venusaur-walk', path: 'assets/pokemon/mega-venusaur-walk.png', frameWidth: 32, frameHeight: 32, frameCount: 4, directions: 8 });
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
    // Flamethrower Tibia directional (6 frames each, play once)
    this.anims.create({ key: 'anim-flame-up', frames: this.anims.generateFrameNumbers('atk-flame-up', { start: 0, end: 5 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-flame-down', frames: this.anims.generateFrameNumbers('atk-flame-down', { start: 0, end: 5 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-flame-left', frames: this.anims.generateFrameNumbers('atk-flame-left', { start: 0, end: 5 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-flame-right', frames: this.anims.generateFrameNumbers('atk-flame-right', { start: 0, end: 5 }), frameRate: 14, repeat: 0 });
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
    // Dragon Pulse (6 frames, play twice then complete)
    this.anims.create({
      key: 'anim-dragon-pulse',
      frames: this.anims.generateFrameNumbers('atk-dragon-pulse', { start: 0, end: 5 }),
      frameRate: 15, repeat: 1,
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
    // Flame Charge — 4 directional animations (Tibia fire-beam)
    this.anims.create({
      key: 'anim-flame-charge-up',
      frames: this.anims.generateFrameNumbers('atk-flame-charge-up', { start: 0, end: 5 }),
      frameRate: 15, repeat: 0,
    });
    this.anims.create({
      key: 'anim-flame-charge-down',
      frames: this.anims.generateFrameNumbers('atk-flame-charge-down', { start: 0, end: 5 }),
      frameRate: 15, repeat: 0,
    });
    this.anims.create({
      key: 'anim-flame-charge-left',
      frames: this.anims.generateFrameNumbers('atk-flame-charge-left', { start: 0, end: 5 }),
      frameRate: 15, repeat: 0,
    });
    this.anims.create({
      key: 'anim-flame-charge-right',
      frames: this.anims.generateFrameNumbers('atk-flame-charge-right', { start: 0, end: 5 }),
      frameRate: 15, repeat: 0,
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
    // Shadow Ball (3 frames, looping projectile — 96x64 each)
    this.anims.create({
      key: 'anim-shadow-ball',
      frames: this.anims.generateFrameNumbers('atk-shadow-ball', { start: 0, end: 2 }),
      frameRate: 10, repeat: -1,
    });
    // Shadow Ball Wave (16 frames, grow/shrink orb — Gengar teleport-fan)
    this.anims.create({
      key: 'anim-shadow-ball-wave',
      frames: this.anims.generateFrameNumbers('atk-shadow-ball-wave', { start: 0, end: 15 }),
      frameRate: 16, repeat: -1,
    });
    // Shadow Ball Hit (4 frames, impact explosion)
    this.anims.create({
      key: 'anim-shadow-ball-hit',
      frames: this.anims.generateFrameNumbers('atk-shadow-ball-hit', { start: 0, end: 3 }),
      frameRate: 12, repeat: 0,
    });
    // Lick Gengar (6 frames, tongue melee)
    this.anims.create({
      key: 'anim-lick-gengar',
      frames: this.anims.generateFrameNumbers('atk-lick-gengar', { start: 0, end: 5 }),
      frameRate: 12, repeat: 0,
    });
    // Shadow Bite (4 frames, bite marks)
    this.anims.create({
      key: 'anim-shadow-bite',
      frames: this.anims.generateFrameNumbers('atk-shadow-bite', { start: 0, end: 3 }),
      frameRate: 10, repeat: 0,
    });
    // Gengar Buff (4 frames, curse faces)
    this.anims.create({
      key: 'anim-gengar-buff',
      frames: this.anims.generateFrameNumbers('atk-gengar-buff', { start: 0, end: 3 }),
      frameRate: 6, repeat: -1,
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

    // Hurricane boss (52 frames, loop - tornado vortex)
    this.anims.create({
      key: 'anim-hurricane-boss',
      frames: this.anims.generateFrameNumbers('atk-hurricane-boss', { start: 0, end: 51 }),
      frameRate: 20, repeat: -1,
    });
    // Explosion / Golem (18 frames, play once — 3024px / 168px = 18)
    this.anims.create({
      key: 'anim-golem-explosion',
      frames: this.anims.generateFrameNumbers('atk-golem-explosion', { start: 0, end: 17 }),
      frameRate: 24, repeat: 0,
    });

    // ── Water attack animations (Squirtle line) ──────────────────────
    // Water Pulse — flight (frame 0 loop) + hit (frames 1-5 once) + full (showcase preview)
    this.anims.create({
      key: 'anim-water-pulse',
      frames: this.anims.generateFrameNumbers('atk-water-pulse', { start: 0, end: 0 }),
      frameRate: 1, repeat: -1,
    });
    this.anims.create({
      key: 'anim-water-pulse-hit',
      frames: this.anims.generateFrameNumbers('atk-water-pulse', { start: 1, end: 5 }),
      frameRate: 12, repeat: 0,
    });
    this.anims.create({
      key: 'anim-water-pulse-full',
      frames: this.anims.generateFrameNumbers('atk-water-pulse', { start: 0, end: 5 }),
      frameRate: 8, repeat: -1,
    });
    // Aqua Jet — 4 directional animations (Tibia water-beam, 12 frames each)
    this.anims.create({
      key: 'anim-aqua-jet-up',
      frames: this.anims.generateFrameNumbers('atk-aqua-jet-up', { start: 0, end: 11 }),
      frameRate: 30, repeat: 0,
    });
    this.anims.create({
      key: 'anim-aqua-jet-down',
      frames: this.anims.generateFrameNumbers('atk-aqua-jet-down', { start: 0, end: 11 }),
      frameRate: 30, repeat: 0,
    });
    this.anims.create({
      key: 'anim-aqua-jet-left',
      frames: this.anims.generateFrameNumbers('atk-aqua-jet-left', { start: 0, end: 11 }),
      frameRate: 30, repeat: 0,
    });
    this.anims.create({
      key: 'anim-aqua-jet-right',
      frames: this.anims.generateFrameNumbers('atk-aqua-jet-right', { start: 0, end: 11 }),
      frameRate: 30, repeat: 0,
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
    // Liquidation (5 frames, play once)
    this.anims.create({
      key: 'anim-liquidation',
      frames: this.anims.generateFrameNumbers('atk-liquidation', { start: 0, end: 4 }),
      frameRate: 10, repeat: 0,
    });
    // Aqua Tail directional (4 frames each, play once)
    for (const dir of ['up', 'down', 'left', 'right'] as const) {
      this.anims.create({
        key: `anim-aqua-tail-${dir}`,
        frames: this.anims.generateFrameNumbers(`atk-aqua-tail-${dir}`, { start: 0, end: 3 }),
        frameRate: 12, repeat: 0,
      });
    }
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
    // Frost Breath (3 frames, looping — Ice Beam projectile)
    this.anims.create({
      key: 'anim-frost-breath',
      frames: this.anims.generateFrameNumbers('atk-frost-breath', { start: 0, end: 2 }),
      frameRate: 10, repeat: -1,
    });
    // Wave Splash (9 frames, looping — Water Gun projectile)
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

    // ── Bulbasaur line animations (Grass type) ─────────────────────
    // Vine Whip (9 frames, play once)
    this.anims.create({ key: 'anim-vine-whip', frames: this.anims.generateFrameNumbers('atk-vine-whip', { start: 0, end: 8 }), frameRate: 18, repeat: 0 });
    // Razor Leaf (8 frames, loop)
    this.anims.create({ key: 'anim-razor-leaf', frames: this.anims.generateFrameNumbers('atk-razor-leaf', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    // Leech Seed (11 frames, loop)
    this.anims.create({ key: 'anim-leech-seed', frames: this.anims.generateFrameNumbers('atk-leech-seed', { start: 0, end: 10 }), frameRate: 10, repeat: -1 });
    // Grass Melee / Tackle (5 frames, play once)
    this.anims.create({ key: 'anim-grass-melee', frames: this.anims.generateFrameNumbers('atk-grass-melee', { start: 0, end: 4 }), frameRate: 15, repeat: 0 });
    // Cotton Spore / Sleep Powder (33 frames, play once)
    this.anims.create({ key: 'anim-cotton-spore', frames: this.anims.generateFrameNumbers('atk-cotton-spore', { start: 0, end: 32 }), frameRate: 15, repeat: 0 });
    // Stun Spore (22 frames, play once)
    this.anims.create({ key: 'anim-stun-spore', frames: this.anims.generateFrameNumbers('atk-stun-spore', { start: 0, end: 21 }), frameRate: 15, repeat: 0 });
    // Leaf Blade (26 frames, play once)
    this.anims.create({ key: 'anim-leaf-blade', frames: this.anims.generateFrameNumbers('atk-leaf-blade', { start: 0, end: 25 }), frameRate: 20, repeat: 0 });
    // Solar Beam (8 frames, play once — slow charge, fast beam, slow dissipate)
    this.anims.create({
      key: 'anim-solar-beam',
      frames: [
        { key: 'atk-solar-beam', frame: 0, duration: 400 },  // charge 1 (lento)
        { key: 'atk-solar-beam', frame: 1, duration: 350 },  // charge 2 (lento)
        { key: 'atk-solar-beam', frame: 2, duration: 150 },  // beam start
        { key: 'atk-solar-beam', frame: 3, duration: 150 },  // beam grow
        { key: 'atk-solar-beam', frame: 4, duration: 150 },  // beam amplify
        { key: 'atk-solar-beam', frame: 5, duration: 200 },  // FULL POWER (mais tempo)
        { key: 'atk-solar-beam', frame: 6, duration: 250 },  // dissipate
        { key: 'atk-solar-beam', frame: 7, duration: 300 },  // end (lento)
      ],
      repeat: 0,
    });
    // Petal Dance (54 frames, loop)
    this.anims.create({ key: 'anim-petal-dance', frames: this.anims.generateFrameNumbers('atk-petal-dance', { start: 0, end: 53 }), frameRate: 20, repeat: -1 });
    // Leech Life / Giga Drain (20 frames, play once)
    this.anims.create({ key: 'anim-leech-life', frames: this.anims.generateFrameNumbers('atk-leech-life', { start: 0, end: 19 }), frameRate: 15, repeat: 0 });
    // Magical Leaf / Energy Ball (9 frames, loop)
    this.anims.create({ key: 'anim-magical-leaf', frames: this.anims.generateFrameNumbers('atk-magical-leaf', { start: 0, end: 8 }), frameRate: 12, repeat: -1 });
    // Ingrain / Frenzy Plant (46 frames, play once)
    this.anims.create({ key: 'anim-ingrain', frames: this.anims.generateFrameNumbers('atk-ingrain', { start: 0, end: 45 }), frameRate: 18, repeat: 0 });
    // Petal Blizzard (19 frames, play once)
    this.anims.create({ key: 'anim-petal-blizzard', frames: this.anims.generateFrameNumbers('atk-petal-blizzard', { start: 0, end: 18 }), frameRate: 12, repeat: 0 });
    // Power Whip (6 frames, play once)
    this.anims.create({ key: 'anim-power-whip', frames: this.anims.generateFrameNumbers('atk-power-whip', { start: 0, end: 5 }), frameRate: 15, repeat: 0 });
    // Seed Flare / Seed Bomb / Flora Burst (31 frames, play once)
    this.anims.create({ key: 'anim-seed-flare', frames: this.anims.generateFrameNumbers('atk-seed-flare', { start: 0, end: 30 }), frameRate: 18, repeat: 0 });
    // Solar Blade (6 frames, play once)
    this.anims.create({ key: 'anim-solar-blade', frames: this.anims.generateFrameNumbers('atk-solar-blade', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
    // Wood Hammer / Body Slam (16 frames, play once)
    this.anims.create({ key: 'anim-wood-hammer', frames: this.anims.generateFrameNumbers('atk-wood-hammer', { start: 0, end: 15 }), frameRate: 15, repeat: 0 });
    // Aromatherapy / Spore (19 frames, play once)
    this.anims.create({ key: 'anim-aromatherapy', frames: this.anims.generateFrameNumbers('atk-aromatherapy', { start: 0, end: 18 }), frameRate: 12, repeat: 0 });
    // Grass Hit (3 frames, play once)
    this.anims.create({ key: 'anim-grass-hit', frames: this.anims.generateFrameNumbers('atk-grass-hit', { start: 0, end: 2 }), frameRate: 12, repeat: 0 });
    // Grass Cell (20 frames, loop)
    this.anims.create({ key: 'anim-grass-cell', frames: this.anims.generateFrameNumbers('atk-grass-cell', { start: 0, end: 19 }), frameRate: 12, repeat: -1 });

    // ══════════════════════════════════════════════════════════════
    // Tibia-converted boss attack animations
    // ══════════════════════════════════════════════════════════════

    // Fire: Eruption (10 frames)
    this.anims.create({ key: 'anim-eruption', frames: this.anims.generateFrameNumbers('atk-eruption', { start: 0, end: 9 }), frameRate: 12, repeat: 0 });

    // Water: Surf variants
    this.anims.create({ key: 'anim-surf-tibia', frames: this.anims.generateFrameNumbers('atk-surf-tibia', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-surf-wave-up', frames: this.anims.generateFrameNumbers('atk-surf-wave-up', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-surf-wave-down', frames: this.anims.generateFrameNumbers('atk-surf-wave-down', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-surf-wave-left', frames: this.anims.generateFrameNumbers('atk-surf-wave-left', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-surf-wave-right', frames: this.anims.generateFrameNumbers('atk-surf-wave-right', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-whirlpool-tibia', frames: this.anims.generateFrameNumbers('atk-whirlpool-tibia', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-whirlpool-rings', frames: this.anims.generateFrameNumbers('atk-whirlpool-rings', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    // Bubble Shot — flight (frame 0 loop) + hit (frames 1-4 once) + full (showcase preview)
    this.anims.create({ key: 'anim-bubble-shot', frames: this.anims.generateFrameNumbers('atk-bubble-shot', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'anim-bubble-shot-hit', frames: this.anims.generateFrameNumbers('atk-bubble-shot', { start: 1, end: 4 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-bubble-shot-full', frames: this.anims.generateFrameNumbers('atk-bubble-shot', { start: 0, end: 4 }), frameRate: 8, repeat: -1 });

    // Flying: Twister, Gust, Air Cutter (4 dirs), Brave Bird Tibia, Air Slash X
    this.anims.create({ key: 'anim-twister', frames: this.anims.generateFrameNumbers('atk-twister', { start: 0, end: 9 }), frameRate: 14, repeat: -1 });
    this.anims.create({ key: 'anim-gust', frames: this.anims.generateFrameNumbers('atk-gust', { start: 0, end: 8 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-air-cutter-up', frames: this.anims.generateFrameNumbers('atk-air-cutter-up', { start: 0, end: 1 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim-air-cutter-down', frames: this.anims.generateFrameNumbers('atk-air-cutter-down', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim-air-cutter-left', frames: this.anims.generateFrameNumbers('atk-air-cutter-left', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim-air-cutter-right', frames: this.anims.generateFrameNumbers('atk-air-cutter-right', { start: 0, end: 1 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim-brave-bird-tibia', frames: this.anims.generateFrameNumbers('atk-brave-bird-tibia', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim-air-slash-x', frames: this.anims.generateFrameNumbers('atk-air-slash-x', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });

    // Ghost: Shadow Ball directional (spherical — same 3 frames for all dirs)
    this.anims.create({ key: 'anim-shadow-ball-up', frames: this.anims.generateFrameNumbers('atk-shadow-ball-up', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-shadow-ball-down', frames: this.anims.generateFrameNumbers('atk-shadow-ball-down', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-shadow-ball-left', frames: this.anims.generateFrameNumbers('atk-shadow-ball-left', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-shadow-ball-right', frames: this.anims.generateFrameNumbers('atk-shadow-ball-right', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });

    // Psychic: Psywave (2 variants, 4 frames each)
    this.anims.create({ key: 'anim-psywave-a', frames: this.anims.generateFrameNumbers('atk-psywave-a', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-psywave-b', frames: this.anims.generateFrameNumbers('atk-psywave-b', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });

    // Rock: Stone Edge (6f), Rock Slide Tibia (8f)
    this.anims.create({ key: 'anim-stone-edge-tibia', frames: this.anims.generateFrameNumbers('atk-stone-edge-tibia', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-rock-slide-tibia', frames: this.anims.generateFrameNumbers('atk-rock-slide-tibia', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });

    // Ground: Bonemerang Tibia (8f)
    this.anims.create({ key: 'anim-bonemerang-tibia', frames: this.anims.generateFrameNumbers('atk-bonemerang-tibia', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });

    // Fighting: Dynamic Punch (4 dirs), Cross Chop (4 dirs), Focus Blast
    this.anims.create({ key: 'anim-dynamic-punch-up', frames: this.anims.generateFrameNumbers('atk-dynamic-punch-up', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-dynamic-punch-down', frames: this.anims.generateFrameNumbers('atk-dynamic-punch-down', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-dynamic-punch-left', frames: this.anims.generateFrameNumbers('atk-dynamic-punch-left', { start: 0, end: 11 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-dynamic-punch-right', frames: this.anims.generateFrameNumbers('atk-dynamic-punch-right', { start: 0, end: 11 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-cross-chop-up', frames: this.anims.generateFrameNumbers('atk-cross-chop-up', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-cross-chop-down', frames: this.anims.generateFrameNumbers('atk-cross-chop-down', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-cross-chop-left', frames: this.anims.generateFrameNumbers('atk-cross-chop-left', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-cross-chop-right', frames: this.anims.generateFrameNumbers('atk-cross-chop-right', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-focus-blast', frames: this.anims.generateFrameNumbers('atk-focus-blast', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });

    // Bug: X-Scissor (2 variants, 3 frames each)
    this.anims.create({ key: 'anim-x-scissor-a', frames: this.anims.generateFrameNumbers('atk-x-scissor-a', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'anim-x-scissor-b', frames: this.anims.generateFrameNumbers('atk-x-scissor-b', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });

    // Poison/Dark boss utility
    this.anims.create({ key: 'anim-poison-range', frames: this.anims.generateFrameNumbers('atk-poison-range', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-screech', frames: this.anims.generateFrameNumbers('atk-screech', { start: 0, end: 6 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-dark-range', frames: this.anims.generateFrameNumbers('atk-dark-range', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });

    // ── Novas animações (sprites existentes no disco) ──────────
    // Poison: Acid Spray (32f), Smog (9f), Sludge Wave (8f), Poison Melee (11f)
    this.anims.create({ key: 'anim-acid-spray', frames: this.anims.generateFrameNumbers('atk-acid-spray', { start: 0, end: 31 }), frameRate: 24, repeat: 0 });
    this.anims.create({ key: 'anim-smog', frames: this.anims.generateFrameNumbers('atk-smog', { start: 0, end: 8 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-sludge-wave', frames: this.anims.generateFrameNumbers('atk-sludge-wave', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-poison-melee', frames: this.anims.generateFrameNumbers('atk-poison-melee', { start: 0, end: 10 }), frameRate: 14, repeat: 0 });
    // Dark: Dark Melee (7f), Dark Hit (13f)
    this.anims.create({ key: 'anim-dark-melee', frames: this.anims.generateFrameNumbers('atk-dark-melee', { start: 0, end: 6 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-dark-hit', frames: this.anims.generateFrameNumbers('atk-dark-hit', { start: 0, end: 12 }), frameRate: 16, repeat: 0 });
    // Ground: Ground Melee (12f)
    this.anims.create({ key: 'anim-ground-melee', frames: this.anims.generateFrameNumbers('atk-ground-melee', { start: 0, end: 11 }), frameRate: 16, repeat: 0 });
    // Normal: Extreme Speed (11f)
    this.anims.create({ key: 'anim-extreme-speed', frames: this.anims.generateFrameNumbers('atk-extreme-speed', { start: 0, end: 10 }), frameRate: 16, repeat: 0 });
    // Recover healing effect (7 frames, play once)
    this.anims.create({ key: 'anim-recover', frames: this.anims.generateFrameNumbers('atk-recover', { start: 0, end: 6 }), frameRate: 10, repeat: 0 });

    // ══════════════════════════════════════════════════════════════
    // PAC (pokemonAutoChess) Boss Attack Upgrade Animations
    // ══════════════════════════════════════════════════════════════
    this.anims.create({ key: 'anim-super-fang', frames: this.anims.generateFrameNumbers('atk-super-fang', { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-precipice-blades', frames: this.anims.generateFrameNumbers('atk-precipice-blades', { start: 0, end: 10 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-dynamax-cannon', frames: this.anims.generateFrameNumbers('atk-dynamax-cannon', { start: 0, end: 38 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: 'anim-heavy-slam', frames: this.anims.generateFrameNumbers('atk-heavy-slam', { start: 0, end: 11 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-petal-dance-pac', frames: this.anims.generateFrameNumbers('atk-petal-dance-pac', { start: 0, end: 53 }), frameRate: 20, repeat: -1 });
    this.anims.create({ key: 'anim-stun-spore-pac', frames: this.anims.generateFrameNumbers('atk-stun-spore-pac', { start: 0, end: 21 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-close-combat-pac', frames: this.anims.generateFrameNumbers('atk-close-combat-pac', { start: 0, end: 6 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-seismic-toss-pac', frames: this.anims.generateFrameNumbers('atk-seismic-toss-pac', { start: 0, end: 12 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-dream-eater-pac', frames: this.anims.generateFrameNumbers('atk-dream-eater-pac', { start: 0, end: 33 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'anim-night-shade-pac', frames: this.anims.generateFrameNumbers('atk-night-shade-pac', { start: 0, end: 33 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'anim-rock-slide-pac', frames: this.anims.generateFrameNumbers('atk-rock-slide-pac', { start: 0, end: 78 }), frameRate: 24, repeat: 0 });
    this.anims.create({ key: 'anim-explosion-pac', frames: this.anims.generateFrameNumbers('atk-explosion-pac', { start: 0, end: 36 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: 'anim-bulk-up-pac', frames: this.anims.generateFrameNumbers('atk-bulk-up-pac', { start: 0, end: 8 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-future-sight-pac', frames: this.anims.generateFrameNumbers('atk-future-sight-pac', { start: 0, end: 10 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-psystrike-pac', frames: this.anims.generateFrameNumbers('atk-psystrike-pac', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });

    // PAC Status Effect Animations (all loop)
    this.anims.create({ key: 'anim-status-burn', frames: this.anims.generateFrameNumbers('status-burn', { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-status-poison', frames: this.anims.generateFrameNumbers('status-poison', { start: 0, end: 14 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'anim-status-paralysis', frames: this.anims.generateFrameNumbers('status-paralysis', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'anim-status-confusion', frames: this.anims.generateFrameNumbers('status-confusion', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'anim-status-freeze', frames: this.anims.generateFrameNumbers('status-freeze', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'anim-status-sleep', frames: this.anims.generateFrameNumbers('status-sleep', { start: 0, end: 9 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'anim-status-protect', frames: this.anims.generateFrameNumbers('status-protect', { start: 0, end: 9 }), frameRate: 10, repeat: -1 });

    // PAC Generic Type Attack Animations
    this.anims.create({ key: 'anim-fairy-hit', frames: this.anims.generateFrameNumbers('atk-fairy-hit', { start: 0, end: 10 }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'anim-fairy-melee', frames: this.anims.generateFrameNumbers('atk-fairy-melee', { start: 0, end: 25 }), frameRate: 18, repeat: 0 });
    this.anims.create({ key: 'anim-fairy-range', frames: this.anims.generateFrameNumbers('atk-fairy-range', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-electric-hit', frames: this.anims.generateFrameNumbers('atk-electric-hit', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-electric-melee', frames: this.anims.generateFrameNumbers('atk-electric-melee', { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-electric-range', frames: this.anims.generateFrameNumbers('atk-electric-range', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-ice-hit', frames: this.anims.generateFrameNumbers('atk-ice-hit', { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-ice-melee', frames: this.anims.generateFrameNumbers('atk-ice-melee', { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-ice-cell', frames: this.anims.generateFrameNumbers('atk-ice-cell', { start: 0, end: 14 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'anim-steel-hit', frames: this.anims.generateFrameNumbers('atk-steel-hit', { start: 0, end: 13 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'anim-steel-melee', frames: this.anims.generateFrameNumbers('atk-steel-melee', { start: 0, end: 7 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim-steel-range', frames: this.anims.generateFrameNumbers('atk-steel-range', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'anim-fighting-hit', frames: this.anims.generateFrameNumbers('atk-fighting-hit', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'anim-fighting-range', frames: this.anims.generateFrameNumbers('atk-fighting-range', { start: 0, end: 28 }), frameRate: 20, repeat: -1 });
    this.anims.create({ key: 'anim-sound-hit', frames: this.anims.generateFrameNumbers('atk-sound-hit', { start: 0, end: 17 }), frameRate: 16, repeat: 0 });
    this.anims.create({ key: 'anim-sound-range', frames: this.anims.generateFrameNumbers('atk-sound-range', { start: 0, end: 13 }), frameRate: 12, repeat: -1 });

    // Environment Animations (atlas-based)
    this.anims.create({ key: 'anim-portal', frames: this.anims.generateFrameNames('env-portal', { prefix: '', start: 0, end: 7, zeroPad: 3 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'anim-chest-open', frames: [
      { key: 'env-chest', frame: '1.png' }, { key: 'env-chest', frame: '2.png' },
      { key: 'env-chest', frame: '3.png' }, { key: 'env-chest', frame: '4.png' },
    ], frameRate: 6, repeat: 0 });
    this.anims.create({ key: 'anim-shine', frames: this.anims.generateFrameNames('env-shine', { prefix: '', suffix: '.png', start: 0, end: 15 }), frameRate: 14, repeat: -1 });
  }

  private createWalkAnims(sprite: SpriteConfig): void {
    if (this.anims.exists(`${sprite.key}-down`)) return;
    const directions: Direction[] = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'];
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

  private createEnemyAttackAnims(sprite: AttackAnimConfig): void {
    if (this.anims.exists(`${sprite.key}-down`)) return;
    const directions: Direction[] = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'];
    const fps = Math.max(8, Math.min(16, sprite.frameCount * 2));
    for (const dir of directions) {
      const row = DIRECTION_ROW[dir];
      const startFrame = row * sprite.frameCount;
      const endFrame = startFrame + sprite.frameCount - 1;
      this.anims.create({
        key: `${sprite.key}-${dir}`,
        frames: this.anims.generateFrameNumbers(sprite.key, { start: startFrame, end: endFrame }),
        frameRate: fps,
        repeat: 0,  // play once, then fire animationcomplete
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
    // Agora carregados como sprites reais (PokeAPI) no preload():
    // dest-tall-grass (power-herb), dest-berry-bush (oran-berry),
    // dest-rock (hard-stone), dest-chest (relic-crown)

    // ── Pickups ──────────────────────────────────────────────────
    // All pickups now loaded as real PokeAPI sprites in preload():
    // pickup-oran, pickup-sitrus, pickup-liechi, pickup-salac, pickup-candy,
    // pickup-magnet, pickup-bomb, pickup-xp-share, pickup-duplicator

    // Held Items — all loaded as real PokeAPI sprites (item-*) in preload()

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

    // Poison particle (para trails de veneno/planta)
    g.clear(); g.fillStyle(0x22cc44); g.fillCircle(3, 3, 3);
    g.generateTexture('poison-particle', 6, 6);

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

    // ── Pokemon Center cross ────────────────────────────────────────
    const pcGfx = this.add.graphics();
    pcGfx.fillStyle(0xffffff, 1);
    pcGfx.fillRect(0, 0, 16, 16);
    pcGfx.fillStyle(0xff0000, 1);
    pcGfx.fillRect(6, 2, 4, 12);  // vertical bar
    pcGfx.fillRect(2, 6, 12, 4);  // horizontal bar
    pcGfx.generateTexture('pokecenter-cross', 16, 16);
    pcGfx.destroy();

    // Gacha box (gacha-box) loaded from PokeAPI poke-ball sprite

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

    // ── Mega particle (golden sparkle) ────────────────────────────
    g.clear(); g.fillStyle(0xffd700, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('mega-particle', 6, 6);

    // Friend ball loaded from PokeAPI sprite

    // ── Companion bullet ────────────────────────────────────────
    g.clear(); g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('companion-bullet', 6, 6);

    g.destroy();
  }
}
