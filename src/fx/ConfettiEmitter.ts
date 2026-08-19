import { Container, Sprite, Texture, Assets } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { CONFETTI_CONFIG, LAYER_Z_INDEX } from '../config/constants';

interface ConfettiParticle {
  sprite: Sprite;
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
    if (this.textures.length === 0) return;
    this.isActive = true;

    const groundY = 1000; // Ground line level
    const count = 120; // High particle density

    // Ground fountain shooting rapidly straight upwards
    for (let i = 0; i < count; i++) {
      const tex = this.textures[Math.floor(Math.random() * this.textures.length)];
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);

      const scale = 0.9 + Math.random() * 0.8;
      sprite.scale.set(scale);

      // Distribute spawn points across the road width
      const originX = (screenWidth * 0.1) + Math.random() * (screenWidth * 0.8);
      const originY = groundY + (Math.random() - 0.5) * 40;

      sprite.x = originX;
      sprite.y = originY;
      this.addChild(sprite);

      // Fast upward velocity from ground into the sky
      const speedUp = 22 + Math.random() * 16; // 22..38 px/frame (fast burst)
      const spreadX = (Math.random() - 0.5) * 14;

      this.particles.push({
        sprite,
        vx: spreadX,
        vy: -speedUp,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        life: 0,
        maxLife: 3500 + Math.random() * 1500
      });
    }
  }

  public update(deltaMs: number): void {
    if (!this.isActive || this.particles.length === 0) return;

    const remaining: ConfettiParticle[] = [];
    const gravity = 0.038 * deltaMs; // Smooth downward gravity

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
