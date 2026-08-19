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
    this.isActive = true;
    const spawnY = screenHeight * CONFETTI_CONFIG.SIDE_SPAWN_HEIGHT;

    // Left cannon
    this.burstCannon(
      CONFETTI_CONFIG.SIDE_MARGIN,
      spawnY,
      -70 // angle in degrees towards top-right
    );

    // Right cannon
    this.burstCannon(
      screenWidth - CONFETTI_CONFIG.SIDE_MARGIN,
      spawnY,
      -110 // angle in degrees towards top-left
    );
  }

  public burstCannon(originX: number, originY: number, baseAngleDeg: number): void {
    if (this.textures.length === 0) return;

    const baseAngleRad = (baseAngleDeg * Math.PI) / 180;
    const spreadRad = (CONFETTI_CONFIG.BURST_ANGLE_SPREAD * Math.PI) / 180;

    for (let i = 0; i < CONFETTI_CONFIG.PARTICLE_COUNT; i++) {
      const tex = this.textures[Math.floor(Math.random() * this.textures.length)];
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);

      const scale = CONFETTI_CONFIG.SCALE_MIN +
        Math.random() * (CONFETTI_CONFIG.SCALE_MAX - CONFETTI_CONFIG.SCALE_MIN);
      sprite.scale.set(scale);

      const angle = baseAngleRad + (Math.random() - 0.5) * spreadRad;
      const speed = CONFETTI_CONFIG.BURST_SPEED_MIN +
        Math.random() * (CONFETTI_CONFIG.BURST_SPEED_MAX - CONFETTI_CONFIG.BURST_SPEED_MIN);

      sprite.x = originX + (Math.random() - 0.5) * CONFETTI_CONFIG.SPAWN_SPREAD_X;
      sprite.y = originY + (Math.random() - 0.5) * CONFETTI_CONFIG.SPAWN_SPREAD_Y;

      this.addChild(sprite);

      this.particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotSpeed: (Math.random() - 0.5) * CONFETTI_CONFIG.ROTATION_SPEED_MAX * 2,
        life: 0,
        maxLife: CONFETTI_CONFIG.LIFETIME * (0.8 + Math.random() * 0.4)
      });
    }
  }

  public update(deltaMs: number): void {
    if (!this.isActive || this.particles.length === 0) return;

    const remaining: ConfettiParticle[] = [];

    for (const p of this.particles) {
      p.life += deltaMs;

      p.vx *= CONFETTI_CONFIG.AIR_RESISTANCE;
      p.vy += CONFETTI_CONFIG.GRAVITY * deltaMs;
      p.vy *= CONFETTI_CONFIG.AIR_RESISTANCE;

      p.sprite.x += p.vx;
      p.sprite.y += p.vy;
      p.sprite.rotation += p.rotSpeed;

      // Alpha fade out
      const progress = p.life / p.maxLife;
      if (progress > CONFETTI_CONFIG.FADE_START) {
        const fade = (1 - progress) / (1 - CONFETTI_CONFIG.FADE_START);
        p.sprite.alpha = Math.max(0, fade);
      }

      if (p.life < p.maxLife) {
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
