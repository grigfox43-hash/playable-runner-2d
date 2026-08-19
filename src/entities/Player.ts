import { Container, AnimatedSprite, Spritesheet, Assets, Rectangle } from 'pixi.js';
import { ASSET_IMAGES, PLAYER_SPRITESHEET_DATA } from '../assets/assetData';
import { PLAYER_CONFIG, PlayerAnimState, HITBOX_CONFIG, LAYER_Z_INDEX } from '../config/constants';
import { SoundManager } from '../core/SoundManager';

export class Player extends Container {
  private animatedSprite!: AnimatedSprite;
  private spritesheet!: Spritesheet;
  private currentAnim: PlayerAnimState = PlayerAnimState.IDLE;

  public isJumping: boolean = false;
  private jumpProgress: number = 0;
  private jumpStartTime: number = 0;
  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  private isInvincible: boolean = false;
  private invincibilityTimer: number = 0;
  private blinkTimer: number = 0;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.PLAYER;
  }

  public async init(): Promise<void> {
    const texture = await Assets.load(ASSET_IMAGES.player);
    this.spritesheet = new Spritesheet(texture, PLAYER_SPRITESHEET_DATA as any);
    await this.spritesheet.parse();

    const idleTextures = this.spritesheet.animations[PlayerAnimState.IDLE] ||
      Object.values(this.spritesheet.animations)[0];

    this.animatedSprite = new AnimatedSprite(idleTextures);
    this.animatedSprite.anchor.set(0.5, 1);
    this.animatedSprite.scale.set(PLAYER_CONFIG.SCALE);
    this.animatedSprite.animationSpeed = PLAYER_CONFIG.ANIMATION_SPEED;
    this.animatedSprite.play();

    this.addChild(this.animatedSprite);

    this.x = 720 * PLAYER_CONFIG.X_POSITION;
    this.y = this.groundY;
  }

  public playAnimation(anim: PlayerAnimState): void {
    if (this.currentAnim === anim || !this.spritesheet) return;

    const textures = this.spritesheet.animations[anim];
    if (textures && textures.length > 0) {
      this.currentAnim = anim;
      this.animatedSprite.textures = textures;

      switch (anim) {
        case PlayerAnimState.JUMP:
          this.animatedSprite.loop = false;
          this.animatedSprite.animationSpeed = PLAYER_CONFIG.ANIMATION_SPEED * 1.5;
          break;
        case PlayerAnimState.HURT:
          this.animatedSprite.loop = false;
          this.animatedSprite.animationSpeed = PLAYER_CONFIG.ANIMATION_SPEED * 2;
          break;
        default:
          this.animatedSprite.loop = true;
          this.animatedSprite.animationSpeed = PLAYER_CONFIG.ANIMATION_SPEED;
      }

      this.animatedSprite.gotoAndPlay(0);
    }
  }

  public jump(): boolean {
    if (this.isJumping) return false;

    this.isJumping = true;
    this.jumpProgress = 0;
    this.jumpStartTime = performance.now();
    this.playAnimation(PlayerAnimState.JUMP);
    SoundManager.getInstance().play('jump');
    return true;
  }

  public takeDamage(): void {
    if (this.isInvincible) return;

    this.isInvincible = true;
    this.invincibilityTimer = PLAYER_CONFIG.INVINCIBILITY_TIME;
    this.playAnimation(PlayerAnimState.HURT);
    SoundManager.getInstance().play('hurt');
  }

  public update(deltaMs: number): void {
    // Jump physics update
    if (this.isJumping) {
      this.jumpProgress += deltaMs / PLAYER_CONFIG.JUMP_DURATION;

      if (this.jumpProgress >= 1) {
        this.isJumping = false;
        this.jumpProgress = 1;
        this.y = this.groundY;
        this.playAnimation(PlayerAnimState.RUN);
      } else {
        // Smooth parabolic jump trajectory
        const heightFactor = 4 * this.jumpProgress * (1 - this.jumpProgress);
        this.y = this.groundY - PLAYER_CONFIG.JUMP_HEIGHT * heightFactor;
      }
    }

    // Invincibility blink update
    if (this.isInvincible) {
      this.invincibilityTimer -= deltaMs;
      this.blinkTimer += deltaMs;

      if (this.blinkTimer > 60) {
        this.blinkTimer = 0;
        this.animatedSprite.alpha = this.animatedSprite.alpha === 1 ? 0.3 : 1;
      }

      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.animatedSprite.alpha = 1;
        if (!this.isJumping) {
          this.playAnimation(PlayerAnimState.RUN);
        }
      }
    }
  }

  public getHitbox(): Rectangle {
    const bounds = this.animatedSprite.getBounds();
    const width = bounds.width * HITBOX_CONFIG.PLAYER_SCALE.X;
    const height = bounds.height * HITBOX_CONFIG.PLAYER_SCALE.Y;
    const offsetX = (bounds.width - width) / 2 + bounds.width * HITBOX_CONFIG.PLAYER_OFFSET.X;
    const offsetY = bounds.height - height + bounds.height * HITBOX_CONFIG.PLAYER_OFFSET.Y;

    return new Rectangle(
      bounds.x + offsetX,
      bounds.y + offsetY,
      width,
      height
    );
  }

  public getInvincible(): boolean {
    return this.isInvincible;
  }
}
