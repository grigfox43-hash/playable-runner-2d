import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class TutorialHand extends Container {
  private handIcon!: Graphics;
  private promptText!: Text;
  private time: number = 0;
  private isVisible: boolean = false;
  private targetY: number = 0;

  constructor() {
    super();
    this.createHand();
    this.createText();
    this.alpha = 0;
  }

  private createHand(): void {
    this.handIcon = new Graphics();

    // Stylized hand with pointing finger
    // Palm
    this.handIcon.roundRect(-24, -10, 48, 55, 14);
    this.handIcon.fill({ color: 0xffffff, alpha: 0.95 });

    // Index finger pointing up
    this.handIcon.roundRect(-10, -50, 20, 50, 10);
    this.handIcon.fill({ color: 0xffffff, alpha: 0.95 });

    // Inner subtle shadow/accent
    this.handIcon.roundRect(-6, -42, 12, 38, 6);
    this.handIcon.fill({ color: 0xeeeeee, alpha: 1 });

    // Glow ring
    this.handIcon.circle(0, 0, 42);
    this.handIcon.stroke({ color: 0xffdd00, width: 4, alpha: 0.8 });

    this.addChild(this.handIcon);
  }

  private createText(): void {
    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 26,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#000000', width: 5 },
      align: 'center',
      dropShadow: {
        color: '#000000',
        blur: 4,
        angle: Math.PI / 2,
        distance: 3,
        alpha: 0.8
      }
    });

    this.promptText = new Text({ text: 'SWIPE UP TO JUMP', style });
    this.promptText.anchor.set(0.5, 0);
    this.promptText.y = 65;
    this.addChild(this.promptText);
  }

  public show(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetY = y;
    this.isVisible = true;
    this.alpha = 1;
    this.time = 0;
  }

  public hide(): void {
    this.isVisible = false;
    this.alpha = 0;
  }

  public update(deltaMs: number): void {
    if (!this.isVisible) return;

    this.time += deltaMs * 0.004;

    // Upward swipe motion with periodic reset
    const cycle = (this.time % (Math.PI * 2));
    const swipeOffset = Math.sin(cycle) * 45;

    this.handIcon.y = Math.min(0, swipeOffset);
    const pulse = 0.95 + Math.sin(cycle * 2) * 0.08;
    this.handIcon.scale.set(pulse);
  }
}
