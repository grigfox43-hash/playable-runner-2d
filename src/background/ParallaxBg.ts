import { Container, Sprite, Texture, Assets } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { LAYER_Z_INDEX, PLAYER_CONFIG } from '../config/constants';

interface PropItem {
  sprite: Sprite;
  type: 'tree' | 'lamp' | 'bush';
  baseX: number;
}

export class ParallaxBg extends Container {
  private backgroundTiles: Sprite[] = [];
  private bgTexture!: Texture;
  private bgScale: number = 1;

  private treeTextures: Texture[] = [];
  private lampTexture!: Texture;
  private bushTextures: Texture[] = [];

  private treesPool: PropItem[] = [];
  private lampsPool: PropItem[] = [];
  private bushesPool: PropItem[] = [];

  private roadY: number = 1280 - PLAYER_CONFIG.GROUND_Y; // 1000
  private readonly LAMP_SPACING = 800;
  private readonly TREE_MIN_SPACING = 300;
  private readonly TREE_MAX_SPACING = 500;
  private readonly SCREEN_BUFFER = 1600;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.FAR_BACKGROUND;
    this.sortableChildren = true;
  }

  public async init(): Promise<void> {
    try {
      await this.loadTextures();
      this.createTiledBackground();
      this.createPropPools();
    } catch (e) {
      console.warn('ParallaxBg init error:', e);
    }
  }

  private async loadTextures(): Promise<void> {
    this.bgTexture = await Assets.load(ASSET_IMAGES.background);

    if (ASSET_IMAGES.trees && ASSET_IMAGES.trees.length > 0) {
      for (const t of ASSET_IMAGES.trees) {
        if (t) {
          const tex = await Assets.load(t);
          this.treeTextures.push(tex);
        }
      }
    }

    if (ASSET_IMAGES.lamp) {
      this.lampTexture = await Assets.load(ASSET_IMAGES.lamp);
    }

    if (ASSET_IMAGES.bushes && ASSET_IMAGES.bushes.length > 0) {
      for (const b of ASSET_IMAGES.bushes) {
        if (b) {
          const tex = await Assets.load(b);
          this.bushTextures.push(tex);
        }
      }
    }
  }

  private createTiledBackground(): void {
    if (!this.bgTexture) return;

    const scaleX = 720 / this.bgTexture.width;
    const scaleY = 1280 / this.bgTexture.height;
    this.bgScale = Math.max(scaleX, scaleY);

    const tileWidth = this.bgTexture.width * this.bgScale;
    const offsetY = (1280 - this.bgTexture.height * this.bgScale) / 2;
    const numPairs = 6; // 12 tiles total spanning ~36000px

    for (let p = 0; p < numPairs; p++) {
      const pairBaseX = (p - 2) * (2 * tileWidth);

      // Tile 0 of pair: standard orientation [pairBaseX, pairBaseX + tileWidth]
      const tileA = new Sprite(this.bgTexture);
      tileA.y = offsetY;
      tileA.zIndex = LAYER_Z_INDEX.FAR_BACKGROUND;
      tileA.anchor.set(0, 0);
      tileA.scale.set(this.bgScale, this.bgScale);
      tileA.x = pairBaseX;
      this.addChild(tileA);
      this.backgroundTiles.push(tileA);

      // Tile 1 of pair: horizontally flipped [pairBaseX + tileWidth, pairBaseX + 2*tileWidth]
      const tileB = new Sprite(this.bgTexture);
      tileB.y = offsetY;
      tileB.zIndex = LAYER_Z_INDEX.FAR_BACKGROUND;
      tileB.anchor.set(0, 0);
      tileB.scale.set(-this.bgScale, this.bgScale);
      tileB.x = pairBaseX + 2 * tileWidth;
      this.addChild(tileB);
      this.backgroundTiles.push(tileB);
    }
  }

  private createPropPools(): void {
    const totalSpan = 720 * 2 + this.SCREEN_BUFFER * 2;

    // 1. Lamps Pool
    if (this.lampTexture) {
      const lampCount = Math.ceil(totalSpan / this.LAMP_SPACING) + 2;
      for (let i = 0; i < lampCount; i++) {
        const lamp = new Sprite(this.lampTexture);
        lamp.anchor.set(0.5, 0);
        lamp.y = 50;
        lamp.scale.set(1.8);
        lamp.zIndex = LAYER_Z_INDEX.NEAR_BACKGROUND;
        const posX = i * this.LAMP_SPACING - this.SCREEN_BUFFER;
        lamp.x = posX;
        this.addChild(lamp);
        this.lampsPool.push({ sprite: lamp, type: 'lamp', baseX: posX });
      }
    }

    // 2. Trees Pool
    if (this.treeTextures.length > 0) {
      let currX = -this.SCREEN_BUFFER;
      while (currX < totalSpan) {
        const tex = this.treeTextures[Math.floor(Math.random() * this.treeTextures.length)];
        const tree = new Sprite(tex);
        tree.anchor.set(0.5, 0);
        tree.y = 0;
        tree.scale.set(1.81);
        tree.zIndex = LAYER_Z_INDEX.MID_BACKGROUND;
        tree.x = currX;
        this.addChild(tree);
        this.treesPool.push({ sprite: tree, type: 'tree', baseX: currX });
        currX += this.TREE_MIN_SPACING + Math.random() * (this.TREE_MAX_SPACING - this.TREE_MIN_SPACING);
      }
    }

    // 3. Bushes Pool
    if (this.bushTextures.length > 0) {
      this.createBushGroups(totalSpan);
    }
  }

  private createBushGroups(totalSpan: number): void {
    let currX = -this.SCREEN_BUFFER + 100;
    while (currX < totalSpan) {
      const groupCount = Math.random() > 0.3 ? 3 : 2;
      for (let i = 0; i < groupCount; i++) {
        if (i > 0 && Math.random() < 0.2) continue;
        const tex = this.bushTextures[i % this.bushTextures.length];
        const bush = new Sprite(tex);
        bush.anchor.set(0.5, 1);
        bush.y = this.roadY - 305; // 695
        bush.scale.set(0.45 + Math.random() * 0.15);
        bush.zIndex = LAYER_Z_INDEX.NEAR_BACKGROUND;
        const posX = currX + i * (200 / 3) + Math.random() * 30;
        bush.x = posX;
        this.addChild(bush);
        this.bushesPool.push({ sprite: bush, type: 'bush', baseX: posX });
      }
      currX += 500 + Math.random() * 100;
    }
  }

  public update(moveStep: number): void {
    if (moveStep === 0 || !this.bgTexture) return;

    const tileWidth = this.bgTexture.width * this.bgScale;
    const pairWidth = 2 * tileWidth;
    const numPairs = this.backgroundTiles.length / 2;
    const totalSpan = numPairs * pairWidth;

    // Scroll Background Tiles in pairs
    for (let p = 0; p < numPairs; p++) {
      const tileA = this.backgroundTiles[p * 2];
      const tileB = this.backgroundTiles[p * 2 + 1];

      tileA.x -= moveStep;
      tileB.x -= moveStep;

      // When the pair has moved fully offscreen to the left (past -pairWidth * 2)
      if (tileA.x < -pairWidth * 2.5) {
        tileA.x += totalSpan;
        tileB.x += totalSpan;
      }
    }

    // Scroll Lamps
    const lampTotalWidth = this.LAMP_SPACING * this.lampsPool.length;
    this.updatePool(this.lampsPool, moveStep, lampTotalWidth);

    // Scroll Trees
    const treeTotalWidth = this.treesPool.length > 0
      ? this.treesPool[this.treesPool.length - 1].baseX - this.treesPool[0].baseX + this.TREE_MAX_SPACING
      : 720 * 2;
    this.updatePool(this.treesPool, moveStep, treeTotalWidth);

    // Scroll Bushes
    const bushTotalWidth = this.bushesPool.length > 0
      ? this.bushesPool[this.bushesPool.length - 1].baseX - this.bushesPool[0].baseX + 500
      : 720 * 2;
    this.updatePool(this.bushesPool, moveStep, bushTotalWidth);
  }

  private updatePool(pool: PropItem[], moveStep: number, totalSpan: number): void {
    for (const item of pool) {
      item.sprite.x -= moveStep;
      if (item.sprite.x < -this.SCREEN_BUFFER) {
        item.sprite.x += totalSpan;
      }
    }
  }
}
