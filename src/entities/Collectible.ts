import { Container, Sprite, Assets, Rectangle } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { COLLECTIBLE_CONFIG, HITBOX_CONFIG, LAYER_Z_INDEX, PLAYER_CONFIG, SCORE_CONFIG } from '../config/constants';

export class Collectible extends Container {
  private sprite!: Sprite;
  public speed: number = 0;
  public itemType: 'dollar' | 'paypalCard' = 'dollar';
  public value: number = SCORE_CONFIG.DOLLAR_VALUE;

  private baseY: number = 0;
  private pulseTime: number = Math.random() * 1000;
  private floatTime: number = Math.random() * 1000;
  private isCollected: boolean = false;
  private collectingProgress: number = 0;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.COLLECTIBLES;
  }

  public async init(yOffset: number = 0, type: 'dollar' | 'paypalCard' = 'dollar'): Promise<void> {
    this.itemType = type;
    const baseGround = 1280 - PLAYER_CONFIG.GROUND_Y;
    this.baseY = baseGround - 80 - yOffset;
    this.y = this.baseY;

    const textureUrl = type === 'dollar' ? ASSET_IMAGES.dollar : ASSET_IMAGES.paypalCard;
    const texture = await Assets.load(textureUrl);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(COLLECTIBLE_CONFIG.BASE_SCALE);
    this.addChild(this.sprite);

    if (type === 'dollar') {
      this.value = SCORE_CONFIG.DOLLAR_VALUE;
    } else {
      this.value = Math.floor(Math.random() * (SCORE_CONFIG.PAYPAL_CARD_MAX - SCORE_CONFIG.PAYPAL_CARD_MIN + 1)) + SCORE_CONFIG.PAYPAL_CARD_MIN;
    }
  }

  public collect(): number {
    if (this.isCollected) return 0;
    this.isCollected = true;
    this.collectingProgress = 0;
    return this.value;
  }

  public getCollected(): boolean {
    return this.isCollected;
  }

  public update(deltaMs: number): boolean {
    if (this.isCollected) {
      // Collection FX: float up, scale up, fade out
      this.collectingProgress += deltaMs / 300;
      this.y -= deltaMs * 0.8;
      this.sprite.scale.set(COLLECTIBLE_CONFIG.BASE_SCALE * (1 + this.collectingProgress * 0.5));
      this.sprite.alpha = Math.max(0, 1 - this.collectingProgress);

      return this.collectingProgress >= 1; // return true when completely finished
    }

    this.x -= (this.speed * deltaMs) / 1000;
    this.pulseTime += deltaMs * COLLECTIBLE_CONFIG.PULSE_SPEED;
    this.floatTime += deltaMs * COLLECTIBLE_CONFIG.FLOAT_SPEED;

    // Bobbing float
    this.y = this.baseY + Math.sin(this.floatTime) * COLLECTIBLE_CONFIG.FLOAT_AMPLITUDE;

    // Pulse scale
    const pulse = COLLECTIBLE_CONFIG.PULSE_MIN +
      (Math.sin(this.pulseTime) * 0.5 + 0.5) * (COLLECTIBLE_CONFIG.PULSE_MAX - COLLECTIBLE_CONFIG.PULSE_MIN);
    this.sprite.scale.set(COLLECTIBLE_CONFIG.BASE_SCALE * pulse);

    return false;
  }

  public getHitbox(): Rectangle {
    const radius = HITBOX_CONFIG.COLLECTIBLE_RADIUS;
    return new Rectangle(
      this.x - radius,
      this.y - radius,
      radius * 2,
      radius * 2
    );
  }
}
