import { Container, Sprite, Texture, Assets, Point, MeshRope } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { FINISH_ROPE_CONFIG, LAYER_Z_INDEX, PLAYER_CONFIG } from '../config/constants';

interface PointVelocity {
  x: number;
  y: number;
}

export class FinishLine extends Container {
  public speed: number = 0;
  private floorPattern!: Sprite;
  private leftPole!: Sprite;
  private rightPole!: Sprite;
  private leftTape!: Sprite;
  private rightTape!: Sprite;

  private leftRope: MeshRope | null = null;
  private rightRope: MeshRope | null = null;
  private leftRopePoints: Point[] = [];
  private rightRopePoints: Point[] = [];
  private leftVelocities: PointVelocity[] = [];
  private rightVelocities: PointVelocity[] = [];

  public isTapeBroken: boolean = false;
  private animationTime: number = 0;
  private isAnimating: boolean = false;
  private leftTapeTexture!: Texture;
  private rightTapeTexture!: Texture;
  public isInitialized: boolean = false;

  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  constructor(initialX: number = 99999) {
    super();
    this.zIndex = LAYER_Z_INDEX.FINISH_LINE;
    this.sortableChildren = true;
    this.x = initialX;
  }

  public async init(): Promise<void> {
    const [floorTex, leftPoleTex, rightPoleTex, leftTapeTex, rightTapeTex] = await Promise.all([
      Assets.load(ASSET_IMAGES.finishFloor),
      Assets.load(ASSET_IMAGES.finishLeftPole),
      Assets.load(ASSET_IMAGES.finishRightPole),
      Assets.load(ASSET_IMAGES.finishLeftTape),
      Assets.load(ASSET_IMAGES.finishRightTape)
    ]);

    this.leftTapeTexture = leftTapeTex;
    this.rightTapeTexture = rightTapeTex;

    const ground = this.groundY;

    // 1. 3D Checkered Floor Pattern
    this.floorPattern = new Sprite(floorTex);
    this.floorPattern.anchor.set(0.5, 0.5);
    this.floorPattern.x = 0;
    this.floorPattern.y = ground - 40;
    this.floorPattern.scale.set(2);
    this.floorPattern.zIndex = 5;
    this.addChild(this.floorPattern);

    // 2. Left Pole (Yellow Post)
    this.leftPole = new Sprite(leftPoleTex);
    this.leftPole.anchor.set(0.5, 1);
    this.leftPole.rotation = -Math.PI / 2;
    this.leftPole.x = -370;
    this.leftPole.y = ground - 142;
    this.leftPole.scale.set(1);
    this.leftPole.zIndex = 8;
    this.addChild(this.leftPole);

    // 3. Right Pole
    this.rightPole = new Sprite(rightPoleTex);
    this.rightPole.anchor.set(0.5, 1);
    this.rightPole.rotation = -Math.PI / 2;
    this.rightPole.x = -235;
    this.rightPole.y = ground - 55;
    this.rightPole.scale.set(1);
    this.rightPole.zIndex = 12;
    this.addChild(this.rightPole);

    // 4. Left Tape
    this.leftTape = new Sprite(leftTapeTex);
    this.leftTape.anchor.set(0, 0);
    this.leftTape.rotation = 0.4;
    this.leftTape.x = this.leftPole.x;
    this.leftTape.y = this.leftPole.y - 50;
    this.leftTape.scale.set(1.8, 1);
    this.leftTape.zIndex = 9;
    this.addChild(this.leftTape);

    // 5. Right Tape
    this.rightTape = new Sprite(rightTapeTex);
    this.rightTape.anchor.set(0, 0);
    this.rightTape.rotation = -2.5;
    this.rightTape.x = this.rightPole.x - 20;
    this.rightTape.y = this.rightPole.y - 46;
    this.rightTape.scale.set(1.8, 1);
    this.rightTape.zIndex = 13;
    this.addChild(this.rightTape);

    this.y = 0;
    this.isInitialized = true;
  }

  private flutterTime: number = 0;

  public get tapeBreakX(): number {
    return this.x + FINISH_ROPE_CONFIG.TAPE_BREAK_OFFSET;
  }

  public update(deltaMs: number): void {
    this.x -= (this.speed * deltaMs) / 1000;

    // Flutter / wind sway wave animation on the finish ribbon
    if (!this.isTapeBroken) {
      this.flutterTime += deltaMs * 0.005;
      const wave = Math.sin(this.flutterTime * 3) * 0.08;
      const waveScale = Math.sin(this.flutterTime * 4) * 0.06;

      if (this.leftTape) {
        this.leftTape.rotation = 0.4 + wave;
        this.leftTape.scale.y = 1 + waveScale;
      }
      if (this.rightTape) {
        this.rightTape.rotation = -2.5 - wave * 1.2;
        this.rightTape.scale.y = 1 - waveScale;
      }
    }

    if (this.isAnimating) {
      this.updateRopeAnimation();
    }
  }

  public breakTape(): void {
    if (this.isTapeBroken || !this.leftTapeTexture || !this.rightTapeTexture) return;
    this.isTapeBroken = true;

    this.leftTape.visible = false;
    this.rightTape.visible = false;

    this.createRopeFromTape(this.leftTape, this.leftTapeTexture, this.leftRopePoints, 'left');
    this.createRopeFromTape(this.rightTape, this.rightTapeTexture, this.rightRopePoints, 'right');

    this.leftVelocities = this.leftRopePoints.map(() => ({ x: 0, y: 0 }));
    this.rightVelocities = this.rightRopePoints.map(() => ({ x: 0, y: 0 }));
    this.animationTime = 0;
    this.isAnimating = true;
  }

  private createRopeFromTape(sprite: Sprite, texture: Texture, points: Point[], side: 'left' | 'right'): void {
    points.length = 0;
    const width = texture.width * Math.abs(sprite.scale.x);
    const height = texture.height * Math.abs(sprite.scale.y);
    const cos = Math.cos(sprite.rotation);
    const sin = Math.sin(sprite.rotation);
    const u = -sprite.anchor.x * width;
    const o = -sprite.anchor.y * height;
    const c = u * cos - o * sin;
    const d = u * sin + o * cos;
    const offsetX = side === 'left' ? FINISH_ROPE_CONFIG.LEFT_ROPE_OFFSET_X : FINISH_ROPE_CONFIG.RIGHT_ROPE_OFFSET_X;
    const offsetY = side === 'left' ? FINISH_ROPE_CONFIG.LEFT_ROPE_OFFSET_Y : FINISH_ROPE_CONFIG.RIGHT_ROPE_OFFSET_Y;

    for (let m = 0; m < FINISH_ROPE_CONFIG.ROPE_SEGMENTS; m++) {
      const q = (m / (FINISH_ROPE_CONFIG.ROPE_SEGMENTS - 1)) * width * FINISH_ROPE_CONFIG.ROPE_LENGTH_FACTOR;
      const E = 0;
      const b = q * cos - E * sin;
      const T = q * sin + E * cos;
      const finalX = sprite.x + c + b + offsetX;
      const finalY = sprite.y + d + T + offsetY;
      points.push(new Point(finalX, finalY));
    }

    if (points.length >= 2) {
      const rope = new MeshRope({ texture, points });
      rope.zIndex = sprite.zIndex;
      this.addChild(rope);
      if (side === 'left') {
        this.leftRope = rope;
      } else {
        this.rightRope = rope;
      }
    }
  }

  private updateRopeAnimation(): void {
    this.animationTime += 0.05;
    this.animateRopePoints(this.leftRopePoints, this.leftVelocities);
    this.animateRopePoints(this.rightRopePoints, this.rightVelocities);

    let totalV = 0;
    let count = 0;
    [...this.leftVelocities, ...this.rightVelocities].forEach(v => {
      totalV += Math.hypot(v.x, v.y);
      count++;
    });

    const avgV = count > 0 ? totalV / count : 0;
    if (avgV < FINISH_ROPE_CONFIG.MIN_VELOCITY_THRESHOLD && this.animationTime > FINISH_ROPE_CONFIG.MIN_ANIMATION_TIME) {
      this.isAnimating = false;
    }
  }

  private animateRopePoints(points: Point[], velocities: PointVelocity[]): void {
    const decay = Math.exp(-this.animationTime * FINISH_ROPE_CONFIG.TIME_DECAY);
    const gravity = FINISH_ROPE_CONFIG.GRAVITY * decay;
    const wave = decay;

    for (let a = 1; a < points.length; a++) {
      const pt = points[a];
      const vel = velocities[a];
      vel.y += gravity;
      vel.x += Math.sin(this.animationTime * FINISH_ROPE_CONFIG.WAVE_SPEED + a) * wave;
      vel.x *= FINISH_ROPE_CONFIG.DAMPING;
      vel.y *= FINISH_ROPE_CONFIG.DAMPING;

      pt.x += vel.x;
      pt.y += vel.y;

      const prev = points[a - 1];
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > FINISH_ROPE_CONFIG.ROPE_SEGMENT_DISTANCE) {
        const ratio = FINISH_ROPE_CONFIG.ROPE_SEGMENT_DISTANCE / dist;
        pt.x = prev.x + dx * ratio;
        pt.y = prev.y + dy * ratio;
      }
    }
  }
}
