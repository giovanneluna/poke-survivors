import Phaser from 'phaser';

const JOYSTICK_RADIUS = 50;
const KNOB_RADIUS = 22;
const DEAD_ZONE = 8;

/**
 * Joystick virtual para controle touch em dispositivos móveis.
 * Aparece onde o jogador toca na metade esquerda da tela.
 */
export class VirtualJoystick {
  readonly direction = new Phaser.Math.Vector2(0, 0);

  private readonly scene: Phaser.Scene;
  private readonly base: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Graphics;
  private activePointerId: number | null = null;
  private originX = 0;
  private originY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.base = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(999)
      .setVisible(false);

    this.knob = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    this.setupInput();
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Só ativa se não tem joystick ativo e toque está na metade esquerda
      if (this.activePointerId !== null) return;
      const cam = this.scene.cameras.main;
      if (pointer.x > cam.width * 0.5) return;

      this.activePointerId = pointer.id;
      this.originX = pointer.x;
      this.originY = pointer.y;
      this.drawBase(pointer.x, pointer.y);
      this.drawKnob(pointer.x, pointer.y);
      this.base.setVisible(true);
      this.knob.setVisible(true);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.activePointerId) return;

      const dx = pointer.x - this.originX;
      const dy = pointer.y - this.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < DEAD_ZONE) {
        this.direction.set(0, 0);
        this.drawKnob(this.originX, this.originY);
        return;
      }

      // Normaliza a direção
      this.direction.set(dx / dist, dy / dist);

      // Clamp knob dentro do raio
      const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
      const knobX = this.originX + (dx / dist) * clampedDist;
      const knobY = this.originY + (dy / dist) * clampedDist;
      this.drawKnob(knobX, knobY);
    });

    const release = (pointer: Phaser.Input.Pointer): void => {
      if (pointer.id !== this.activePointerId) return;
      this.activePointerId = null;
      this.direction.set(0, 0);
      this.base.setVisible(false);
      this.knob.setVisible(false);
    };

    this.scene.input.on('pointerup', release);
    this.scene.input.on('pointerupoutside', release);
  }

  private drawBase(x: number, y: number): void {
    this.base.clear();
    this.base.fillStyle(0x000000, 0.25);
    this.base.fillCircle(x, y, JOYSTICK_RADIUS);
    this.base.lineStyle(2, 0xffffff, 0.2);
    this.base.strokeCircle(x, y, JOYSTICK_RADIUS);
  }

  private drawKnob(x: number, y: number): void {
    this.knob.clear();
    this.knob.fillStyle(0xffffff, 0.35);
    this.knob.fillCircle(x, y, KNOB_RADIUS);
    this.knob.lineStyle(2, 0xffffff, 0.5);
    this.knob.strokeCircle(x, y, KNOB_RADIUS);
  }

  isActive(): boolean {
    return this.activePointerId !== null;
  }

  destroy(): void {
    this.base.destroy();
    this.knob.destroy();
  }
}
