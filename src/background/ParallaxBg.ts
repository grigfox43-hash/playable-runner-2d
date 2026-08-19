import { Container, Sprite, Texture, Assets } from 'pixi.js';
import { ASSET_IMAGES } from '../assets/assetData';
import { LAYER_Z_INDEX, PLAYER_CONFIG } from '../config/constants';

export class ParallaxBg extends Container {
  private bgTiles: Sprite[] = [];
  private bgTexture!: Texture;
  private roadTexture!: Texture;
  private roadTiles: Sprite[] = [];

  private treeTextures: Texture[] = [];
  private lampTexture!: Texture;
  private bushTextures: Texture[] = [];

  private treesPool: Sprite[] = [];
  private lampsPool: Sprite[] = [];
  private bushesPool: Sprite[] = [];

  private bgScale: number = 1;
  private roadScale: number = 1.2;
  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  private readonly LAMP_SPACING = 800;
  private readonly TREE_MIN_SPACING = 450;
  private readonly TREE_MAX_SPACING = 650;
  private readonly BUSH_MIN_SPACING = 380;
  private readonly BUSH_MAX_SPACING = 560;

  private readonly LEFT_BOUND = -3500;
  private readonly RIGHT_BOUND = 4500;

  constructor() {
    super();
    this.zIndex = LAYER_Z_INDEX.FAR_BACKGROUND;
    this.sortableChildren = true;
  }

  public async init(): Promise<void> {
    try {
      await this.loadTextures();
      this.createSkyBackground();
      this.createRoad();
      this.createPropsPool();
    } catch (e) {
      console.warn('Parallax init error:', e);
    }
  }

  private async loadTextures(): Promise<void> {
    this.bgTexture = await Assets.load(ASSET_IMAGES.background);
    this.roadTexture = await Assets.load(ASSET_IMAGES.road);

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

  private createSkyBackground(): void {
    if (!this.bgTexture) return;

    // Scale sky to cover height
    this.bgScale = 1280 / this.bgTexture.height;
    const tileWidth = this.bgTexture.width * this.bgScale;

    // Span from LEFT_BOUND to RIGHT_BOUND (6-8 tiles)
    const numTiles = Math.ceil((this.RIGHT_BOUND - this.LEFT_BOUND) / tileWidth) + 2;
    for (let i = 0; i < numTiles; i++) {
      const tile = new Sprite(this.bgTexture);
      tile.anchor.set(0, 0);
      tile.scale.set(this.bgScale);
      tile.x = this.LEFT_BOUND + i * (tileWidth - 1);
      tile.y = 0;
      tile.zIndex = LAYER_Z_INDEX.FAR_BACKGROUND;

      this.addChild(tile);
      this.bgTiles.push(tile);
    }
  }

  private createRoad(): void {
    if (!this.roadTexture) return;

    this.roadScale = 1.4;
    const tileWidth = this.roadTexture.width * this.roadScale;
    const numTiles = Math.ceil((this.RIGHT_BOUND - this.LEFT_BOUND) / tileWidth) + 2;

    for (let i = 0; i < numTiles; i++) {
      const road = new Sprite(this.roadTexture);
      road.anchor.set(0, 0);
      road.scale.set(this.roadScale);
      road.x = this.LEFT_BOUND + i * (tileWidth - 1);
      road.y = this.groundY - 30;
      road.zIndex = LAYER_Z_INDEX.GROUND;

      this.addChild(road);
      this.roadTiles.push(road);
    }
  }

  private createPropsPool(): void {
    const totalSpan = this.RIGHT_BOUND - this.LEFT_BOUND;

    // Lamps
    if (this.lampTexture) {
      const count = Math.ceil(totalSpan / this.LAMP_SPACING);
      for (let i = 0; i < count; i++) {
        const lamp = new Sprite(this.lampTexture);
        lamp.anchor.set(0.5, 1);
        lamp.scale.set(0.85);
        lamp.y = this.groundY - 15;
        lamp.zIndex = LAYER_Z_INDEX.NEAR_BACKGROUND;
        lamp.x = this.LEFT_BOUND + i * this.LAMP_SPACING + 100;
        this.addChild(lamp);
        this.lampsPool.push(lamp);
      }
    }

    // Trees
    if (this.treeTextures.length > 0) {
      const count = Math.ceil(totalSpan / this.TREE_MIN_SPACING);
      let currX = this.LEFT_BOUND + 50;
      for (let i = 0; i < count; i++) {
        const tex = this.treeTextures[i % this.treeTextures.length];
        const tree = new Sprite(tex);
        tree.anchor.set(0.5, 1);
        const scale = 0.65 + (i % 3) * 0.08;
        tree.scale.set(scale);
        tree.y = this.groundY - 18;
        tree.zIndex = LAYER_Z_INDEX.MID_BACKGROUND;
        tree.x = currX;
        currX += this.TREE_MIN_SPACING + Math.random() * (this.TREE_MAX_SPACING - this.TREE_MIN_SPACING);
        this.addChild(tree);
        this.treesPool.push(tree);
      }
    }

    // Bushes
    if (this.bushTextures.length > 0) {
      const count = Math.ceil(totalSpan / this.BUSH_MIN_SPACING);
      let currX = this.LEFT_BOUND + 120;
      for (let i = 0; i < count; i++) {
        const tex = this.bushTextures[i % this.bushTextures.length];
        const bush = new Sprite(tex);
        bush.anchor.set(0.5, 1);
        bush.scale.set(0.42 + (i % 2) * 0.06);
        bush.y = this.groundY - 2;
        bush.zIndex = LAYER_Z_INDEX.NEAR_BACKGROUND;
        bush.x = currX;
        currX += this.BUSH_MIN_SPACING + Math.random() * (this.BUSH_MAX_SPACING - this.BUSH_MIN_SPACING);
        this.addChild(bush);
        this.bushesPool.push(bush);
      }
    }
  }

  public update(deltaSpeed: number): void {
    if (deltaSpeed === 0) return;

    // 1. Scroll Sky (Far Layer)
    if (this.bgTiles.length > 0 && this.bgTexture) {
      const tileWidth = this.bgTexture.width * this.bgScale;
      const bgScroll = deltaSpeed * 0.15;

      for (const tile of this.bgTiles) {
        tile.x -= bgScroll;
      }

      for (const tile of this.bgTiles) {
        if (tile.x < this.LEFT_BOUND - tileWidth) {
          let maxX = -Infinity;
          for (const other of this.bgTiles) {
            if (other.x > maxX) maxX = other.x;
          }
          tile.x = maxX + tileWidth - 2;
        }
      }
    }

    // 2. Scroll Road (Ground Layer)
    if (this.roadTiles.length > 0 && this.roadTexture) {
      const tileWidth = this.roadTexture.width * this.roadScale;
      const roadScroll = deltaSpeed;

      for (const road of this.roadTiles) {
        road.x -= roadScroll;
      }

      for (const road of this.roadTiles) {
        if (road.x < this.LEFT_BOUND - tileWidth) {
          let maxX = -Infinity;
          for (const other of this.roadTiles) {
            if (other.x > maxX) maxX = other.x;
          }
          road.x = maxX + tileWidth - 2;
        }
      }
    }

    // 3. Scroll Trees (Mid Layer)
    const treeScroll = deltaSpeed * 0.45;
    for (const tree of this.treesPool) {
      tree.x -= treeScroll;
      if (tree.x < this.LEFT_BOUND - 300) {
        let maxX = -Infinity;
        for (const other of this.treesPool) {
          if (other.x > maxX) maxX = other.x;
        }
        tree.x = maxX + this.TREE_MIN_SPACING + Math.random() * 150;
      }
    }

    // 4. Scroll Lamps (Near Layer)
    const lampScroll = deltaSpeed * 0.85;
    for (const lamp of this.lampsPool) {
      lamp.x -= lampScroll;
      if (lamp.x < this.LEFT_BOUND - 300) {
        let maxX = -Infinity;
        for (const other of this.lampsPool) {
          if (other.x > maxX) maxX = other.x;
        }
        lamp.x = maxX + this.LAMP_SPACING;
      }
    }

    // 5. Scroll Bushes (Near Layer)
    const bushScroll = deltaSpeed * 0.95;
    for (const bush of this.bushesPool) {
      bush.x -= bushScroll;
      if (bush.x < this.LEFT_BOUND - 200) {
        let maxX = -Infinity;
        for (const other of this.bushesPool) {
          if (other.x > maxX) maxX = other.x;
        }
        bush.x = maxX + this.BUSH_MIN_SPACING + Math.random() * 100;
      }
    }
  }
}
