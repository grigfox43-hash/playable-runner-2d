import { Container, Sprite, Assets, Rectangle } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { OBSTACLE_CONFIG, HITBOX_CONFIG, LAYER_Z_INDEX, PLAYER_CONFIG } from '../config/constants';

export class Obstacle extends Container {
  private sprite!: Sprite;
  private glowSprite!: Sprite;
  public speed: number = 0;
  private pulseTime: number = 0;
  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.OBSTACLES;
  }

  public async init(): Promise<void> {
    const [texture, glowTexture] = await Promise.all([
      Assets.load(ASSET_IMAGES.obstacle),
      Assets.load(ASSET_IMAGES.obstacleGlow)
    ]);

    this.glowSprite = new Sprite(glowTexture);
    this.glowSprite.anchor.set(0.5, 1);
    this.glowSprite.scale.set(OBSTACLE_CONFIG.BASE_SCALE);
    this.glowSprite.alpha = 0.8;
    this.addChild(this.glowSprite);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(OBSTACLE_CONFIG.BASE_SCALE);
    this.addChild(this.sprite);

    this.y = this.groundY;
  }

  public update(deltaMs: number): void {
    this.x -= (this.speed * deltaMs) / 1000;
    this.pulseTime += deltaMs * OBSTACLE_CONFIG.PULSE_SPEED;

    const pulse = (Math.sin(this.pulseTime) + 1) / 2;
    const currentScale = OBSTACLE_CONFIG.BASE_SCALE *
      (OBSTACLE_CONFIG.SCALE_MIN + pulse * (OBSTACLE_CONFIG.SCALE_MAX - OBSTACLE_CONFIG.SCALE_MIN));

    if (this.glowSprite) {
      this.glowSprite.scale.set(currentScale);
    }
  }

  public getHitbox(): Rectangle {
    const bounds = this.sprite.getBounds();
    const shrink = HITBOX_CONFIG.OBSTACLE_SHRINK;
    const offsetX = bounds.width * HITBOX_CONFIG.OBSTACLE_OFFSET.X;
    const offsetY = bounds.height * HITBOX_CONFIG.OBSTACLE_OFFSET.Y;

    return new Rectangle(
      bounds.x + shrink + offsetX,
      bounds.y + shrink + offsetY,
      Math.max(10, bounds.width - shrink * 2),
      Math.max(10, bounds.height - shrink * 2)
    );
  }
}
