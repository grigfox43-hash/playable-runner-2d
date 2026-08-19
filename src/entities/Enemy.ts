import { Container, AnimatedSprite, Spritesheet, Assets, Rectangle } from 'pixi.js';
import { ASSET_IMAGES, ENEMY_SPRITESHEET_DATA } from '../assets/assetData';
import { ENEMY_CONFIG, HITBOX_CONFIG, LAYER_Z_INDEX, PLAYER_CONFIG } from '../config/constants';

export class Enemy extends Container {
  private animatedSprite!: AnimatedSprite;
  private spritesheet!: Spritesheet;
  public speed: number = 0;
  public isTutorialEnemy: boolean = false;
  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.ENEMIES;
  }

  public async init(): Promise<void> {
    const texture = await Assets.load(ASSET_IMAGES.enemy);
    this.spritesheet = new Spritesheet(texture, ENEMY_SPRITESHEET_DATA as any);
    await this.spritesheet.parse();

    const frames = this.spritesheet.animations.default ||
      this.spritesheet.animations.idle ||
      Object.values(this.spritesheet.animations)[0];

    this.animatedSprite = new AnimatedSprite(frames);
    this.animatedSprite.anchor.set(0.5, 1);
    this.animatedSprite.scale.set(ENEMY_CONFIG.SCALE);
    this.animatedSprite.animationSpeed = ENEMY_CONFIG.ANIMATION_SPEED;
    this.animatedSprite.play();

    this.addChild(this.animatedSprite);
    this.y = this.groundY;
  }

  public update(deltaMs: number): void {
    const totalSpeed = this.speed + ENEMY_CONFIG.CHASE_SPEED;
    this.x -= (totalSpeed * deltaMs) / 1000;
  }

  public getHitbox(): Rectangle {
    const bounds = this.animatedSprite.getBounds();
    const width = bounds.width * HITBOX_CONFIG.ENEMY_SCALE.X;
    const height = bounds.height * HITBOX_CONFIG.ENEMY_SCALE.Y;
    const offsetX = (bounds.width - width) / 2 + bounds.width * HITBOX_CONFIG.ENEMY_OFFSET.X;
    const offsetY = bounds.height - height + bounds.height * HITBOX_CONFIG.ENEMY_OFFSET.Y;

    return new Rectangle(
      bounds.x + offsetX,
      bounds.y + offsetY,
      width,
      height
    );
  }
}
