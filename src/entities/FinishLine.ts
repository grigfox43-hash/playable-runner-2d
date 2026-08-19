import { Container, Sprite, Texture, Assets, Point, MeshRope } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { FINISH_ROPE_CONFIG, LAYER_Z_INDEX, PLAYER_CONFIG } from '../config/constants';

interface RopePointPhysics {
  point: Point;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
}

export class FinishLine extends Container {
  private leftPole!: Sprite;
  private rightPole!: Sprite;
  private tapeTexture!: Texture;

  // Intact Rope
  private intactRope: MeshRope | null = null;
  private intactPhysics: RopePointPhysics[] = [];

  // Severed Ropes
  private leftRope: MeshRope | null = null;
  private rightRope: MeshRope | null = null;
  private leftPhysics: RopePointPhysics[] = [];
  private rightPhysics: RopePointPhysics[] = [];

  public speed: number = 0;
  public isBroken: boolean = false;
  private time: number = 0;
  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  private readonly POLE_DISTANCE = 480;
  private readonly ROPE_Y_OFFSET = -160;
  private readonly NUM_SEGMENTS = 14;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.FINISH_LINE;
  }

  public async init(): Promise<void> {
    const [poleTexture, tapeTexture] = await Promise.all([
      Assets.load(ASSET_IMAGES.finishPole),
      Assets.load(ASSET_IMAGES.finishTape)
    ]);
    this.tapeTexture = tapeTexture;

    // Left Pole
    this.leftPole = new Sprite(poleTexture);
    this.leftPole.anchor.set(0.5, 1);
    this.leftPole.scale.set(0.8);
    this.leftPole.x = -this.POLE_DISTANCE / 2;
    this.leftPole.y = this.groundY;
    this.addChild(this.leftPole);

    // Right Pole
    this.rightPole = new Sprite(poleTexture);
    this.rightPole.anchor.set(0.5, 1);
    this.rightPole.scale.set(-0.8, 0.8);
    this.rightPole.x = this.POLE_DISTANCE / 2;
    this.rightPole.y = this.groundY;
    this.addChild(this.rightPole);

    // Initialize Intact Flexible Rope
    this.initIntactRope();

    this.y = 0;
  }

  private initIntactRope(): void {
    this.intactPhysics = [];
    const points: Point[] = [];
    const startX = -this.POLE_DISTANCE / 2 + 10;
    const endX = this.POLE_DISTANCE / 2 - 10;
    const ropeY = this.groundY + this.ROPE_Y_OFFSET;

    for (let i = 0; i <= this.NUM_SEGMENTS; i++) {
      const t = i / this.NUM_SEGMENTS;
      const px = startX + (endX - startX) * t;
      const sag = Math.sin(t * Math.PI) * 15;
      const py = ropeY + sag;

      const pt = new Point(px, py);
      points.push(pt);

      this.intactPhysics.push({
        point: pt,
        vx: 0,
        vy: 0,
        baseX: px,
        baseY: py
      });
    }

    this.intactRope = new MeshRope({
      texture: this.tapeTexture,
      points
    });
    this.addChild(this.intactRope);
  }

  public breakTape(playerX: number): void {
    if (this.isBroken) return;
    this.isBroken = true;

    const half = Math.floor(this.NUM_SEGMENTS / 2);

    // 1. Build Left Rope points before destroying intact rope
    this.leftPhysics = [];
    const leftPoints: Point[] = [];
    for (let i = 0; i <= half && i < this.intactPhysics.length; i++) {
      const p = this.intactPhysics[i];
      if (!p) continue;
      const pt = new Point(p.point ? p.point.x : p.baseX, p.point ? p.point.y : p.baseY);
      leftPoints.push(pt);
      this.leftPhysics.push({
        point: pt,
        vx: -6 - Math.random() * 6,
        vy: -2 + Math.random() * 4,
        baseX: p.baseX,
        baseY: p.baseY
      });
    }

    // 2. Build Right Rope points before destroying intact rope
    this.rightPhysics = [];
    const rightPoints: Point[] = [];
    for (let i = half; i < this.intactPhysics.length; i++) {
      const p = this.intactPhysics[i];
      if (!p) continue;
      const pt = new Point(p.point ? p.point.x : p.baseX, p.point ? p.point.y : p.baseY);
      rightPoints.push(pt);
      this.rightPhysics.push({
        point: pt,
        vx: 6 + Math.random() * 6,
        vy: -2 + Math.random() * 4,
        baseX: p.baseX,
        baseY: p.baseY
      });
    }

    // 3. Remove intact rope
    if (this.intactRope) {
      this.removeChild(this.intactRope);
      this.intactRope.destroy();
      this.intactRope = null;
    }
    this.intactPhysics = [];

    if (leftPoints.length >= 2) {
      this.leftRope = new MeshRope({
        texture: this.tapeTexture,
        points: leftPoints
      });
      this.addChild(this.leftRope);
    }

    if (rightPoints.length >= 2) {
      this.rightRope = new MeshRope({
        texture: this.tapeTexture,
        points: rightPoints
      });
      this.addChild(this.rightRope);
    }
  }

  public update(deltaMs: number, playerGlobalX: number = 0): void {
    this.x -= (this.speed * deltaMs) / 1000;
    this.time += deltaMs * 0.005;

    if (!this.isBroken) {
      const ropeGlobalX = this.x;
      const distToPlayer = playerGlobalX - ropeGlobalX;

      const numPoints = this.intactPhysics.length;
      for (let i = 1; i < numPoints - 1; i++) {
        const item = this.intactPhysics[i];
        if (!item || !item.point) continue;
        const t = i / (numPoints - 1);
        const wave = Math.sin(this.time * 2 + t * 4) * 4;

        let playerPush = 0;
        if (distToPlayer > -100 && distToPlayer < 60) {
          const influence = Math.sin(t * Math.PI);
          playerPush = Math.max(0, (distToPlayer + 100) / 160) * 40 * influence;
        }

        item.point.x = item.baseX + playerPush;
        item.point.y = item.baseY + wave;
      }
    } else {
      // Physics for severed Left Rope
      const leftCount = this.leftPhysics.length;
      const segmentLen = 22;

      for (let i = 1; i < leftCount; i++) {
        const item = this.leftPhysics[i];
        if (!item || !item.point) continue;
        item.vy += FINISH_ROPE_CONFIG.GRAVITY;
        item.vx *= FINISH_ROPE_CONFIG.DAMPING;
        item.vy *= FINISH_ROPE_CONFIG.DAMPING;

        item.vx += Math.sin(this.time * 4 + i) * 0.2;
        item.vy += Math.cos(this.time * 3 + i) * 0.1;

        item.point.x += item.vx;
        item.point.y += item.vy;

        const prev = this.leftPhysics[i - 1];
        if (prev && prev.point) {
          const dx = item.point.x - prev.point.x;
          const dy = item.point.y - prev.point.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist > segmentLen) {
            const ratio = segmentLen / dist;
            item.point.x = prev.point.x + dx * ratio;
            item.point.y = prev.point.y + dy * ratio;
          }
        }
      }

      // Physics for severed Right Rope
      const rightCount = this.rightPhysics.length;
      for (let i = rightCount - 2; i >= 0; i--) {
        const item = this.rightPhysics[i];
        if (!item || !item.point) continue;
        item.vy += FINISH_ROPE_CONFIG.GRAVITY;
        item.vx *= FINISH_ROPE_CONFIG.DAMPING;
        item.vy *= FINISH_ROPE_CONFIG.DAMPING;

        item.vx -= Math.sin(this.time * 4 + i) * 0.2;
        item.vy += Math.cos(this.time * 3 + i) * 0.1;

        item.point.x += item.vx;
        item.point.y += item.vy;

        const next = this.rightPhysics[i + 1];
        if (next && next.point) {
          const dx = item.point.x - next.point.x;
          const dy = item.point.y - next.point.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist > segmentLen) {
            const ratio = segmentLen / dist;
            item.point.x = next.point.x + dx * ratio;
            item.point.y = next.point.y + dy * ratio;
          }
        }
      }
    }
  }
}
