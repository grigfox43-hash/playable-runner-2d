import { Container, Application, Rectangle, TextStyle, Text, Graphics } from 'pixi.js';
import { GameState, PlayerAnimState, SPEED_CONFIG, HP_CONFIG, SCORE_CONFIG, PLAYER_CONFIG, LAYER_Z_INDEX } from '../config/constants';
import { LEVEL_TRACK_DATA, LevelItemConfig } from '../config/levelConfig';
import { ParallaxBg } from '../background/ParallaxBg';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Obstacle } from '../entities/Obstacle';
import { Collectible } from '../entities/Collectible';
import { FinishLine } from '../entities/FinishLine';
import { ConfettiEmitter } from '../fx/ConfettiEmitter';
import { UIManager } from '../ui/UIManager';
import { SoundManager } from '../core/SoundManager';
import { MraidAdapter } from '../core/MraidAdapter';

export class GameController {
  private app: Application;
  public worldContainer: Container;
  public entityContainer: Container;

  public parallaxBg: ParallaxBg;
  public player: Player;
  public enemies: Enemy[] = [];
  public obstacles: Obstacle[] = [];
  public collectibles: Collectible[] = [];
  public warningLabels: Array<{ container: Container; gameX: number }> = [];
  public finishLine: FinishLine | null = null;
  public confettiEmitter: ConfettiEmitter;
  public uiManager: UIManager;
  public adapter: MraidAdapter;

  public state: GameState = GameState.INTRO;
  private currentSpeed: number = 0; // Starts at 0 before first click
  private distanceTraveled: number = 0;
  private spawnIndex: number = 0;
  private currentHp: number = HP_CONFIG.MAX_HP;
  private currentScore: number = SCORE_CONFIG.START_BALANCE;

  private tutorialEnemy: Enemy | null = null;
  private tutorialTriggered: boolean = false;
  private isTutorialPaused: boolean = false;

  private readonly UNIT_DISTANCE: number = 700;
  private readonly TUTORIAL_DISTANCE_TRIGGER: number = 320;

  constructor(app: Application) {
    this.app = app;
    this.adapter = new MraidAdapter();

    this.worldContainer = new Container();
    this.entityContainer = new Container();
    this.entityContainer.sortableChildren = true;

    this.parallaxBg = new ParallaxBg();
    this.player = new Player();
    this.confettiEmitter = new ConfettiEmitter();
    this.uiManager = new UIManager(this.adapter);

    this.worldContainer.addChild(this.parallaxBg);
    this.worldContainer.addChild(this.entityContainer);
    this.worldContainer.addChild(this.confettiEmitter);
    this.app.stage.addChild(this.worldContainer);
  }

  public async init(): Promise<void> {
    await this.parallaxBg.init();
    await this.player.init();
    this.entityContainer.addChild(this.player);

    // Initial state: standing still on the far left
    this.state = GameState.INTRO;
    this.currentSpeed = 0;
    this.player.x = 720 * 0.13;
    this.player.playAnimation(PlayerAnimState.IDLE);

    this.uiManager.setHp(this.currentHp);
    this.uiManager.updateScore(this.currentScore);
    this.uiManager.showTutorial('Tap to start earning!');
  }

  public handleJumpInput(): void {
    if (this.state === GameState.END_WIN || this.state === GameState.END_LOSE) return;

    if (this.state === GameState.INTRO) {
      this.state = GameState.RUNNING;
      this.currentSpeed = SPEED_CONFIG.BASE_SPEED;
      this.player.playAnimation(PlayerAnimState.RUN);
      this.uiManager.hideTutorial();
      SoundManager.getInstance().playMusic();
      return;
    }

    if (this.isTutorialPaused) {
      this.isTutorialPaused = false;
      this.currentSpeed = SPEED_CONFIG.BASE_SPEED;
      this.player.playAnimation(PlayerAnimState.RUN);
      for (const e of this.enemies) {
        e.playRun();
      }
      this.uiManager.hideTutorial();
      this.player.jump();
      return;
    }

    this.player.jump();
  }

  public update(deltaMs: number): void {
    if (this.state === GameState.INTRO || this.isTutorialPaused) {
      this.player.update(deltaMs);
      return;
    }

    const moveStep = (this.currentSpeed * deltaMs) / 1000;
    this.distanceTraveled += moveStep;

    // Update parallax background
    this.parallaxBg.update(moveStep);

    // Spawn new entities dynamically based on track
    this.checkLevelSpawns();

    // Update player
    this.player.update(deltaMs);

    const scale = this.worldContainer.scale.x || 1;
    const leftEdgeInStage = (0 - this.worldContainer.x) / scale;
    const cleanupX = Math.min(-600, leftEdgeInStage - 300);

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.speed = this.currentSpeed;
      enemy.update(deltaMs);

      if (enemy.isTutorialEnemy && !this.tutorialTriggered) {
        const dist = enemy.x - this.player.x;
        if (dist > 0 && dist < this.TUTORIAL_DISTANCE_TRIGGER) {
          this.tutorialTriggered = true;
          this.isTutorialPaused = true;
          this.currentSpeed = 0;
          this.player.playAnimation(PlayerAnimState.IDLE);
          enemy.playIdle();
          this.uiManager.showTutorial('Jump to avoid enemies');
        }
      }

      if (enemy.x < cleanupX) {
        this.entityContainer.removeChild(enemy);
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.speed = this.currentSpeed;
      obs.update(deltaMs);

      if (obs.x < cleanupX) {
        this.entityContainer.removeChild(obs);
        obs.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Update EVADE warning labels
    this.updateWarningLabels(deltaMs, cleanupX);

    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.speed = this.currentSpeed;
      const finished = col.update(deltaMs);

      if (finished || col.x < cleanupX) {
        this.entityContainer.removeChild(col);
        col.destroy();
        this.collectibles.splice(i, 1);
      }
    }

    // Update finish line
    if (this.finishLine) {
      this.finishLine.speed = this.currentSpeed;
      this.finishLine.update(deltaMs);
    }

    if (this.state === GameState.RUNNING) {
      this.checkCollisions();
    }

    this.confettiEmitter.update(deltaMs);
  }

  private checkLevelSpawns(): void {
    const scale = this.worldContainer.scale.x || 1;
    const rightEdgeInStage = (window.innerWidth - this.worldContainer.x) / scale;
    const spawnScreenX = Math.max(720, rightEdgeInStage) + 200;

    while (this.spawnIndex < LEVEL_TRACK_DATA.length) {
      const item = LEVEL_TRACK_DATA[this.spawnIndex];
      const targetTravelDist = item.distance * this.UNIT_DISTANCE;

      if (this.distanceTraveled + spawnScreenX >= targetTravelDist) {
        const itemSpawnX = targetTravelDist - this.distanceTraveled;
        this.spawnEntity(item, itemSpawnX);
        this.spawnIndex++;
      } else {
        break;
      }
    }
  }

  private async spawnEntity(item: LevelItemConfig, spawnX: number): Promise<void> {
    switch (item.type) {
      case 'enemy': {
        const enemy = new Enemy();
        await enemy.init();
        enemy.x = spawnX;
        enemy.speed = this.currentSpeed;
        if (item.pauseForTutorial && !this.tutorialTriggered) {
          enemy.isTutorialEnemy = true;
          this.tutorialEnemy = enemy;
        }
        this.enemies.push(enemy);
        this.entityContainer.addChild(enemy);
        break;
      }
      case 'obstacle': {
        const obs = new Obstacle();
        await obs.init();
        obs.x = spawnX;
        obs.speed = this.currentSpeed;
        this.obstacles.push(obs);
        this.entityContainer.addChild(obs);

        // Add yellow EVADE warning badge above the cone
        this.createWarningLabel(spawnX, (1280 - PLAYER_CONFIG.GROUND_Y) - 110);
        break;
      }
      case 'collectible': {
        const col = new Collectible();
        const type = Math.random() < 0.6 ? 'dollar' : 'paypalCard';
        await col.init(item.yOffset || 0, type);
        col.x = spawnX;
        col.speed = this.currentSpeed;
        this.collectibles.push(col);
        this.entityContainer.addChild(col);
        break;
      }
      case 'finish': {
        if (!this.finishLine) {
          const fl = new FinishLine(spawnX);
          this.finishLine = fl;
          await fl.init();
          fl.x = spawnX;
          fl.speed = this.currentSpeed;
          this.entityContainer.addChild(fl);
        }
        break;
      }
    }
  }

  private createWarningLabel(x: number, y: number): void {
    const container = new Container();
    container.zIndex = LAYER_Z_INDEX.WARNING_LABEL;

    const textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: '900',
      fill: '#e60000',
      stroke: { color: '#000000', width: 3.5 },
      align: 'center'
    });
    const text = new Text({ text: 'EVADE', style: textStyle });
    text.anchor.set(0.5, 0.5);

    const padX = 14;
    const padY = 5;
    const bg = new Graphics();
    bg.roundRect(-text.width / 2 - padX, -text.height / 2 - padY, text.width + padX * 2, text.height + padY * 2, 8);
    bg.fill({ color: 0xffd500 });
    bg.stroke({ color: 0xffffff, width: 2 });

    container.addChild(bg);
    container.addChild(text);

    container.x = x;
    container.y = y;

    this.entityContainer.addChild(container);
    this.warningLabels.push({ container, gameX: x });
  }

  private updateWarningLabels(deltaMs: number, cleanupX: number): void {
    const move = (this.currentSpeed * deltaMs) / 1000;
    for (let i = this.warningLabels.length - 1; i >= 0; i--) {
      const item = this.warningLabels[i];
      item.gameX -= move;
      item.container.x = item.gameX;

      const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
      item.container.scale.set(pulse);

      if (item.gameX < cleanupX) {
        this.entityContainer.removeChild(item.container);
        item.container.destroy();
        this.warningLabels.splice(i, 1);
      }
    }
  }

  private checkCollisions(): void {
    const playerHitbox = this.player.getHitbox();

    // 1. Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      if (!col.getCollected()) {
        const colHitbox = col.getHitbox();
        if (this.intersects(playerHitbox, colHitbox)) {
          const value = col.collect();
          this.currentScore += value;

          const screenPos = col.getGlobalPosition();
          this.uiManager.triggerCollect(screenPos.x, screenPos.y, col.itemType, this.currentScore);
          SoundManager.getInstance().play('coin');
        }
      }
    }

    // 2. Obstacles (Cones)
    if (!this.player.getInvincible()) {
      for (const obs of this.obstacles) {
        const obsHitbox = obs.getHitbox();
        if (this.intersects(playerHitbox, obsHitbox)) {
          this.handleDamage();
          break;
        }
      }
    }

    // 3. Enemies
    if (!this.player.getInvincible()) {
      for (const enemy of this.enemies) {
        const enemyHitbox = enemy.getHitbox();
        if (this.intersects(playerHitbox, enemyHitbox)) {
          this.handleDamage();
          break;
        }
      }
    }

    // 4. Finish Line
    if (this.finishLine && this.finishLine.isInitialized && !this.finishLine.isTapeBroken) {
      if (this.player.x >= this.finishLine.tapeBreakX) {
        this.handleVictory();
      }
    }
  }

  private handleDamage(): void {
    this.currentHp--;
    this.uiManager.setHp(this.currentHp);
    this.player.takeDamage();

    if (this.currentHp <= 0) {
      this.handleGameOver();
    }
  }

  private handleVictory(): void {
    this.state = GameState.END_WIN;
    this.currentSpeed = 0;

    // Immediately switch player and all enemies to Idle before the packshot appears
    this.player.playAnimation(PlayerAnimState.IDLE);
    for (const enemy of this.enemies) {
      enemy.playIdle();
    }

    if (this.finishLine) {
      this.finishLine.breakTape();
    }

    this.confettiEmitter.burstVictory(720, 1280);
    SoundManager.getInstance().play('win');

    setTimeout(() => {
      this.uiManager.showEndCard(true, this.currentScore);
    }, 1200);
  }

  private handleGameOver(): void {
    this.state = GameState.END_LOSE;
    this.currentSpeed = 0;

    // Player and all enemies switch to Idle animation
    this.player.resetToIdle();
    for (const enemy of this.enemies) {
      enemy.playIdle();
    }

    // Show FAIL badge overlay
    this.uiManager.showFailOverlay();
    SoundManager.getInstance().play('lose');

    // After 2.0s transition to packshot end screen
    setTimeout(() => {
      this.uiManager.hideFailOverlay();
      this.uiManager.showEndCard(false, this.currentScore);
    }, 2000);
  }

  private intersects(r1: Rectangle, r2: Rectangle): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }
}
