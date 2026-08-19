import { Container, Sprite, Texture, Assets, Graphics } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { LAYER_Z_INDEX } from '../config/constants';

interface ConfettiParticle {
  sprite: Sprite | Graphics;
  vx: number;
  vy: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
}

export class ConfettiEmitter extends Container {
  private textures: Texture[] = [];
  private particles: ConfettiParticle[] = [];
  public isActive: boolean = false;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.CONFETTI;
  }

  public async init(): Promise<void> {
    for (const dataUri of ASSET_IMAGES.confetti) {
      if (dataUri) {
        try {
          const tex = await Assets.load(dataUri);
          this.textures.push(tex);
        } catch (e) {
          console.warn('Failed to load confetti texture:', e);
        }
      }
    }
  }

  public burstVictory(screenWidth: number, screenHeight: number): void {
    this.isActive = true;

    const groundY = 1000; // Road level
    const count = 140; // High particle density
    const colors = [0xffd700, 0xff1744, 0x00e676, 0x2979ff, 0xff9100, 0xe040fb, 0x00e5ff, 0xffffff];

    for (let i = 0; i < count; i++) {
      let particleDisplay: Sprite | Graphics;

      if (this.textures.length > 0) {
        const tex = this.textures[Math.floor(Math.random() * this.textures.length)];
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.scale.set(0.9 + Math.random() * 0.8);
        particleDisplay = sprite;
      } else {
        const g = new Graphics();
        const col = colors[Math.floor(Math.random() * colors.length)];
        const w = 14 + Math.random() * 10;
        const h = 8 + Math.random() * 6;
        g.rect(-w / 2, -h / 2, w, h);
        g.fill(col);
        particleDisplay = g;
      }

      // Distribute spawn points across the road width
      const originX = (screenWidth * 0.05) + Math.random() * (screenWidth * 0.9);
      const originY = groundY + (Math.random() - 0.5) * 40;

      particleDisplay.x = originX;
      particleDisplay.y = originY;
      this.addChild(particleDisplay);

      // Fast upward velocity from ground into the sky
      const speedUp = 24 + Math.random() * 18; // 24..42 px/frame (rapid burst!)
      const spreadX = (Math.random() - 0.5) * 16;

      this.particles.push({
        sprite: particleDisplay,
        vx: spreadX,
        vy: -speedUp,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 3500 + Math.random() * 1500
      });
    }
  }

  public update(deltaMs: number): void {
    if (!this.isActive || this.particles.length === 0) return;

    const remaining: ConfettiParticle[] = [];
    const gravity = 0.042 * deltaMs; // Downward gravity

    for (const p of this.particles) {
      p.life += deltaMs;

      p.vx *= 0.99;
      p.vy += gravity;

      p.sprite.x += p.vx;
      p.sprite.y += p.vy;
      p.sprite.rotation += p.rotSpeed;

      const progress = p.life / p.maxLife;
      if (progress > 0.65) {
        p.sprite.alpha = Math.max(0, (1 - progress) / 0.35);
      }

      if (progress < 1) {
        remaining.push(p);
      } else {
        this.removeChild(p.sprite);
        p.sprite.destroy();
      }
    }

    this.particles = remaining;
    if (this.particles.length === 0) {
      this.isActive = false;
    }
  }
}
