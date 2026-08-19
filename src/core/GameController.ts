import { Container, Application, Rectangle } from 'pixi.js';
import { GameState, PlayerAnimState, SPEED_CONFIG, HP_CONFIG, SCORE_CONFIG } from '../config/constants';
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
  public finishLine: FinishLine | null = null;
  public confettiEmitter: ConfettiEmitter;
  public uiManager: UIManager;
  public adapter: MraidAdapter;

  public state: GameState = GameState.INTRO;
  private currentSpeed: number = SPEED_CONFIG.BASE_SPEED;
  private distanceTraveled: number = 0;
  private spawnIndex: number = 0;
  private currentHp: number = HP_CONFIG.MAX_HP;
  private currentScore: number = SCORE_CONFIG.START_BALANCE;

  private tutorialEnemy: Enemy | null = null;
  private tutorialTriggered: boolean = false;
  private isTutorialPaused: boolean = false;

  private isDecelerating: boolean = false;
  private readonly UNIT_DISTANCE: number = 700; // pixels per distance unit
  private readonly TUTORIAL_DISTANCE_TRIGGER: number = 280;

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
    this.worldContainer.addChild(this.uiManager);

    this.app.stage.addChild(this.worldContainer);
  }

  public async init(): Promise<void> {
    await this.parallaxBg.init();
    await this.player.init();
    await this.confettiEmitter.init();

    this.entityContainer.addChild(this.player);

    // Initial state
    this.state = GameState.INTRO;
    this.player.playAnimation(PlayerAnimState.RUN);
    this.uiManager.setHp(this.currentHp);
    this.uiManager.updateScore(this.currentScore);

    // Show initial tutorial guide
    this.uiManager.tutorialHand.show(this.player.x + 80, this.player.y - 120);
  }

  public handleJumpInput(): void {
    if (this.state === GameState.END_WIN || this.state === GameState.END_LOSE) return;

    if (this.isTutorialPaused) {
      this.isTutorialPaused = false;
      this.currentSpeed = SPEED_CONFIG.BASE_SPEED;
      this.uiManager.tutorialHand.hide();
    }

    if (this.state === GameState.INTRO) {
      this.state = GameState.RUNNING;
      this.uiManager.tutorialHand.hide();
    }

    this.player.jump();
  }

  public update(deltaMs: number): void {
    if (this.isTutorialPaused) {
      this.player.update(deltaMs);
      this.uiManager.update(deltaMs);
      return;
    }

    const moveStep = (this.currentSpeed * deltaMs) / 1000;
    this.distanceTraveled += moveStep;

    // Check spawn queue
    this.checkLevelSpawns();

    // Update parallax
    this.parallaxBg.update(moveStep);

    // Update player
    this.player.update(deltaMs);

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.speed = this.currentSpeed;
      enemy.update(deltaMs);

      // Check tutorial trigger distance
      if (enemy.isTutorialEnemy && !this.tutorialTriggered) {
        const dist = enemy.x - this.player.x;
        if (dist > 0 && dist < this.TUTORIAL_DISTANCE_TRIGGER) {
          this.tutorialTriggered = true;
          this.isTutorialPaused = true;
          this.uiManager.tutorialHand.show(this.player.x + 50, this.player.y - 140);
        }
      }

      // Offscreen removal
      if (enemy.x < -300) {
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

      if (obs.x < -300) {
        this.entityContainer.removeChild(obs);
        obs.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.speed = this.currentSpeed;
      const finished = col.update(deltaMs);

      if (finished || col.x < -300) {
        this.entityContainer.removeChild(col);
        col.destroy();
        this.collectibles.splice(i, 1);
      }
    }

    // Update finish line
    if (this.finishLine) {
      this.finishLine.speed = this.currentSpeed;
      this.finishLine.update(deltaMs, this.player.x);
    }

    // Check collisions
    if (this.state === GameState.RUNNING || this.state === GameState.INTRO) {
      this.checkCollisions();
    }

    // Win deceleration
    if (this.isDecelerating) {
      this.currentSpeed *= 0.96;
      if (this.currentSpeed < 10) {
        this.currentSpeed = 0;
        this.isDecelerating = false;
      }
    }

    // FX and UI
    this.confettiEmitter.update(deltaMs);
    this.uiManager.update(deltaMs);
  }

  private checkLevelSpawns(): void {
    const currentDistanceUnit = this.distanceTraveled / this.UNIT_DISTANCE;

    while (this.spawnIndex < LEVEL_TRACK_DATA.length) {
      const item = LEVEL_TRACK_DATA[this.spawnIndex];
      // Spawn slightly ahead of the screen
      const spawnScreenX = 720 + 200;
      const targetTravelDist = item.distance * this.UNIT_DISTANCE;

      if (this.distanceTraveled + spawnScreenX >= targetTravelDist) {
        this.spawnEntity(item, spawnScreenX);
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
          this.finishLine = new FinishLine();
          await this.finishLine.init();
          this.finishLine.x = spawnX;
          this.finishLine.speed = this.currentSpeed;
          this.entityContainer.addChild(this.finishLine);
        }
        break;
      }
    }
  }

  private checkCollisions(): void {
    const playerHitbox = this.player.getHitbox();

    // 1. Collectibles
    for (const col of this.collectibles) {
      if (!col.getCollected()) {
        const colHitbox = col.getHitbox();
        if (this.intersects(playerHitbox, colHitbox)) {
          const value = col.collect();
          this.currentScore += value;
          this.uiManager.updateScore(this.currentScore);
          SoundManager.getInstance().play('collect');
        }
      }
    }

    // 2. Enemies
    if (!this.player.getInvincible()) {
      for (const enemy of this.enemies) {
        const enemyHitbox = enemy.getHitbox();
        if (this.intersects(playerHitbox, enemyHitbox)) {
          this.handleDamage();
          break;
        }
      }
    }

    // 3. Obstacles
    if (!this.player.getInvincible()) {
      for (const obs of this.obstacles) {
        const obsHitbox = obs.getHitbox();
        if (this.intersects(playerHitbox, obsHitbox)) {
          this.handleDamage();
          break;
        }
      }
    }

    // 4. Finish Line
    if (this.finishLine && !this.finishLine.isBroken) {
      const dist = this.player.x - this.finishLine.x;
      if (dist >= -20) {
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
    if (this.finishLine) {
      this.finishLine.breakTape(this.player.x);
    }

    this.isDecelerating = true;
    this.confettiEmitter.burstVictory(720, 1280);
    SoundManager.getInstance().play('win');

    setTimeout(() => {
      this.uiManager.showEndCard(true, this.currentScore);
    }, 1200);
  }

  private handleGameOver(): void {
    this.state = GameState.END_LOSE;
    this.currentSpeed = 0;
    SoundManager.getInstance().play('lose');

    setTimeout(() => {
      this.uiManager.showEndCard(false, this.currentScore);
    }, 1000);
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
