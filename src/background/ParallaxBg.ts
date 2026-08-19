import { Container, Sprite, Texture, Assets, TilingSprite } from 'pixi.js';
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
  private groundY: number = 1280 - PLAYER_CONFIG.GROUND_Y;

  private readonly SCREEN_WIDTH = 720;
  private readonly SCREEN_HEIGHT = 1280;
  private readonly LAMP_SPACING = 650;
  private readonly TREE_MIN_SPACING = 320;
  private readonly TREE_MAX_SPACING = 540;

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

    // Scale sky to cover screen height and width proportionally
    const targetHeight = this.SCREEN_HEIGHT;
    this.bgScale = targetHeight / this.bgTexture.height;
    const tileWidth = this.bgTexture.width * this.bgScale;

    // 4 continuous tiles without mirroring
    const count = 4;
    for (let i = 0; i < count; i++) {
      const tile = new Sprite(this.bgTexture);
      tile.anchor.set(0, 0);
      tile.scale.set(this.bgScale);
      tile.x = i * tileWidth - tileWidth;
      tile.y = 0;
      tile.zIndex = LAYER_Z_INDEX.FAR_BACKGROUND;

      this.addChild(tile);
      this.bgTiles.push(tile);
    }
  }

  private createRoad(): void {
    if (!this.roadTexture) return;

    const roadScale = 1.6;
    const tileWidth = this.roadTexture.width * roadScale;
    const count = 4;

    for (let i = 0; i < count; i++) {
      const road = new Sprite(this.roadTexture);
      road.anchor.set(0, 0);
      road.scale.set(roadScale);
      road.x = i * tileWidth - tileWidth;
      road.y = this.groundY - 30;
      road.zIndex = LAYER_Z_INDEX.GROUND;

      this.addChild(road);
      this.roadTiles.push(road);
    }
  }

  private createPropsPool(): void {
    const totalDist = this.SCREEN_WIDTH * 2 + 1600;

    // Lamps
    if (this.lampTexture) {
      const lampCount = Math.ceil(totalDist / this.LAMP_SPACING) + 2;
      for (let i = 0; i < lampCount; i++) {
        const lamp = new Sprite(this.lampTexture);
        lamp.anchor.set(0.5, 1);
        lamp.scale.set(1.4);
        lamp.y = this.groundY - 15;
        lamp.zIndex = LAYER_Z_INDEX.NEAR_BACKGROUND;
        lamp.x = i * this.LAMP_SPACING - 300;
        this.addChild(lamp);
        this.lampsPool.push(lamp);
      }
    }

    // Trees
    if (this.treeTextures.length > 0) {
      const treeCount = Math.ceil(totalDist / this.TREE_MIN_SPACING) + 3;
      let currentX = -350;
      for (let i = 0; i < treeCount; i++) {
        const tex = this.treeTextures[i % this.treeTextures.length];
        const tree = new Sprite(tex);
        tree.anchor.set(0.5, 1);
        const scale = 0.85 + (i % 3) * 0.15;
        tree.scale.set(scale);
        tree.y = this.groundY - 20;
        tree.zIndex = LAYER_Z_INDEX.MID_BACKGROUND;
        tree.x = currentX;
        currentX += this.TREE_MIN_SPACING + Math.random() * (this.TREE_MAX_SPACING - this.TREE_MIN_SPACING);
        this.addChild(tree);
        this.treesPool.push(tree);
      }
    }

    // Bushes
    if (this.bushTextures.length > 0) {
      const bushCount = 10;
      for (let i = 0; i < bushCount; i++) {
        const tex = this.bushTextures[i % this.bushTextures.length];
        const bush = new Sprite(tex);
        bush.anchor.set(0.5, 1);
        bush.scale.set(0.75);
        bush.y = this.groundY - 5;
        bush.zIndex = LAYER_Z_INDEX.NEAR_BACKGROUND;
        bush.x = i * 240 - 200;
        this.addChild(bush);
        this.bushesPool.push(bush);
      }
    }
  }

  public update(deltaSpeed: number): void {
    if (deltaSpeed === 0) return;

    // Scroll Sky (Far layer)
    if (this.bgTiles.length > 0 && this.bgTexture) {
      const tileWidth = this.bgTexture.width * this.bgScale;
      const bgScroll = deltaSpeed * 0.15;

      for (const tile of this.bgTiles) {
        tile.x -= bgScroll;
        if (tile.x < -tileWidth) {
          let maxX = -Infinity;
          for (const other of this.bgTiles) {
            if (other.x > maxX) maxX = other.x;
          }
          tile.x = maxX + tileWidth - 2;
        }
      }
    }

    // Scroll Road (Ground layer)
    if (this.roadTiles.length > 0 && this.roadTexture) {
      const roadScale = 1.6;
      const tileWidth = this.roadTexture.width * roadScale;
      const roadScroll = deltaSpeed;

      for (const road of this.roadTiles) {
        road.x -= roadScroll;
        if (road.x < -tileWidth) {
          let maxX = -Infinity;
          for (const other of this.roadTiles) {
            if (other.x > maxX) maxX = other.x;
          }
          road.x = maxX + tileWidth - 2;
        }
      }
    }

    // Scroll Trees (Mid layer)
    const treeScroll = deltaSpeed * 0.45;
    for (const tree of this.treesPool) {
      tree.x -= treeScroll;
      if (tree.x < -400) {
        let maxX = -Infinity;
        for (const other of this.treesPool) {
          if (other.x > maxX) maxX = other.x;
        }
        tree.x = maxX + this.TREE_MIN_SPACING + Math.random() * 150;
      }
    }

    // Scroll Lamps (Near layer)
    const lampScroll = deltaSpeed * 0.85;
    for (const lamp of this.lampsPool) {
      lamp.x -= lampScroll;
      if (lamp.x < -300) {
        let maxX = -Infinity;
        for (const other of this.lampsPool) {
          if (other.x > maxX) maxX = other.x;
        }
        lamp.x = maxX + this.LAMP_SPACING;
      }
    }

    // Scroll Bushes (Near layer)
    const bushScroll = deltaSpeed * 0.95;
    for (const bush of this.bushesPool) {
      bush.x -= bushScroll;
      if (bush.x < -200) {
        let maxX = -Infinity;
        for (const other of this.bushesPool) {
          if (other.x > maxX) maxX = other.x;
        }
        bush.x = maxX + 220 + Math.random() * 80;
      }
    }
  }
}
