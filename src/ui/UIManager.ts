import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import { LAYER_Z_INDEX, HP_CONFIG } from '../config/constants';
import { TutorialHand } from './TutorialHand';
import { MraidAdapter } from '../core/MraidAdapter';
import { SoundManager } from '../core/SoundManager';
import { ASSET_IMAGES } from '../assets/assetData';

export class UIManager extends Container {
  private hudContainer!: Container;
  private hpHearts: Graphics[] = [];
  private scoreContainer!: Container;
  private scoreText!: Text;
  private dollarIcon!: Sprite;

  public tutorialHand!: TutorialHand;
  private endCardContainer!: Container;
  private endCardBg!: Graphics;
  private ctaButton!: Container;
  private ctaBtnBg!: Graphics;
  private ctaText!: Text;
  private endAmountText!: Text;

  private currentScore: number = 0;
  private displayScore: number = 0;
  private currentHp: number = HP_CONFIG.MAX_HP;

  private adapter: MraidAdapter;
  private ctaPulseTime: number = 0;
  public isEndCardVisible: boolean = false;

  constructor(adapter: MraidAdapter) {
    super();
    this.adapter = adapter;
    this.zIndex = LAYER_Z_INDEX.OVERLAY;
    this.createHUD();
    this.createTutorial();
    this.createEndCard();
  }

  private createHUD(): void {
    this.hudContainer = new Container();
    this.addChild(this.hudContainer);

    // HP Hearts Container
    const hpContainer = new Container();
    hpContainer.x = 35;
    hpContainer.y = 50;

    for (let i = 0; i < HP_CONFIG.MAX_HP; i++) {
      const heart = new Graphics();
      this.drawHeart(heart, true);
      heart.x = i * 44;
      heart.y = 0;
      hpContainer.addChild(heart);
      this.hpHearts.push(heart);
    }
    this.hudContainer.addChild(hpContainer);

    // Score / Money Pill Badge
    this.scoreContainer = new Container();
    this.scoreContainer.x = 720 - 210;
    this.scoreContainer.y = 45;

    const pillBg = new Graphics();
    pillBg.roundRect(0, 0, 180, 52, 26);
    pillBg.fill({ color: 0x111111, alpha: 0.75 });
    pillBg.stroke({ color: 0x22c55e, width: 2.5 });
    this.scoreContainer.addChild(pillBg);

    // Dollar symbol graphic
    const dollarCircle = new Graphics();
    dollarCircle.circle(26, 26, 18);
    dollarCircle.fill({ color: 0x22c55e });
    this.scoreContainer.addChild(dollarCircle);

    const dollarSymStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: '#ffffff',
      align: 'center'
    });
    const dollarSym = new Text({ text: '$', style: dollarSymStyle });
    dollarSym.anchor.set(0.5);
    dollarSym.x = 26;
    dollarSym.y = 26;
    this.scoreContainer.addChild(dollarSym);

    // Score Amount Text
    const scoreStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#ffffff',
      align: 'left'
    });
    this.scoreText = new Text({ text: '$0.00', style: scoreStyle });
    this.scoreText.anchor.set(0, 0.5);
    this.scoreText.x = 56;
    this.scoreText.y = 26;
    this.scoreContainer.addChild(this.scoreText);

    this.hudContainer.addChild(this.scoreContainer);
  }

  private drawHeart(g: Graphics, filled: boolean): void {
    g.clear();
    const color = filled ? 0xef4444 : 0x4b5563;
    const alpha = filled ? 1 : 0.6;

    // Smooth Bezier Heart Shape
    g.moveTo(0, 0);
    g.bezierCurveTo(-14, -14, -28, 7, 0, 24);
    g.bezierCurveTo(28, 7, 14, -14, 0, 0);
    g.fill({ color, alpha });

    if (filled) {
      // Top highlight
      g.moveTo(-4, -4);
      g.bezierCurveTo(-8, -10, -14, -2, -6, 4);
      g.fill({ color: 0xffffff, alpha: 0.5 });
    }
  }

  private createTutorial(): void {
    this.tutorialHand = new TutorialHand();
    this.addChild(this.tutorialHand);
  }

  private createEndCard(): void {
    this.endCardContainer = new Container();
    this.endCardContainer.alpha = 0;
    this.endCardContainer.visible = false;
    this.addChild(this.endCardContainer);

    // Dimmed background
    this.endCardBg = new Graphics();
    this.endCardBg.rect(0, 0, 720, 1280);
    this.endCardBg.fill({ color: 0x000000, alpha: 0.7 });
    this.endCardContainer.addChild(this.endCardBg);

    // Card modal window
    const cardModal = new Container();
    cardModal.x = 360;
    cardModal.y = 600;

    const modalBg = new Graphics();
    modalBg.roundRect(-260, -280, 520, 560, 36);
    modalBg.fill({ color: 0x18181b, alpha: 0.95 });
    modalBg.stroke({ color: 0xeab308, width: 5 });
    cardModal.addChild(modalBg);

    // Trophy / Star header icon
    const starIcon = new Graphics();
    starIcon.circle(0, -210, 55);
    starIcon.fill({ color: 0xfacc15 });
    starIcon.stroke({ color: 0xffffff, width: 4 });
    cardModal.addChild(starIcon);

    const starSymStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 50,
      fontWeight: 'bold',
      fill: '#ffffff',
      align: 'center'
    });
    const starSym = new Text({ text: '★', style: starSymStyle });
    starSym.anchor.set(0.5);
    starSym.x = 0;
    starSym.y = -210;
    cardModal.addChild(starSym);

    // Title: CONGRATULATIONS!
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 34,
      fontWeight: 'bold',
      fill: '#fde047',
      stroke: { color: '#000000', width: 4 },
      align: 'center'
    });
    const titleText = new Text({ text: 'LEVEL COMPLETED!', style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.y = -120;
    cardModal.addChild(titleText);

    // Subtitle: You Earned
    const subStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: 'bold',
      fill: '#9ca3af',
      align: 'center'
    });
    const subText = new Text({ text: 'TOTAL CASH EARNED', style: subStyle });
    subText.anchor.set(0.5);
    subText.y = -65;
    cardModal.addChild(subText);

    // Big Amount Cash Display
    const amountStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 52,
      fontWeight: 'bold',
      fill: '#4ade80',
      stroke: { color: '#064e3b', width: 6 },
      dropShadow: {
        color: '#000000',
        blur: 8,
        distance: 4,
        alpha: 0.7
      },
      align: 'center'
    });
    this.endAmountText = new Text({ text: '$260.00', style: amountStyle });
    this.endAmountText.anchor.set(0.5);
    this.endAmountText.y = 10;
    cardModal.addChild(this.endAmountText);

    // Call To Action Button
    this.ctaButton = new Container();
    this.ctaButton.y = 170;
    this.ctaButton.eventMode = 'static';
    this.ctaButton.cursor = 'pointer';

    this.ctaBtnBg = new Graphics();
    this.ctaBtnBg.roundRect(-210, -42, 420, 84, 42);
    this.ctaBtnBg.fill({ color: 0x22c55e });
    this.ctaBtnBg.stroke({ color: 0x86efac, width: 3.5 });
    this.ctaButton.addChild(this.ctaBtnBg);

    const ctaStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#14532d', width: 4 },
      align: 'center'
    });
    this.ctaText = new Text({ text: 'CLAIM REWARD', style: ctaStyle });
    this.ctaText.anchor.set(0.5);
    this.ctaButton.addChild(this.ctaText);

    // CTA click & tap event handling
    this.ctaButton.on('pointertap', () => {
      SoundManager.getInstance().play('win');
      this.adapter.openStore();
    });

    cardModal.addChild(this.ctaButton);
    this.endCardContainer.addChild(cardModal);
  }

  public updateScore(amount: number): void {
    this.currentScore = amount;
  }

  public setHp(hp: number): void {
    this.currentHp = Math.max(0, hp);
    for (let i = 0; i < this.hpHearts.length; i++) {
      this.drawHeart(this.hpHearts[i], i < this.currentHp);
    }
  }

  public showEndCard(isWin: boolean, finalScore: number): void {
    this.isEndCardVisible = true;
    this.endCardContainer.visible = true;
    this.endCardContainer.alpha = 1;
    this.endAmountText.text = `$${finalScore.toFixed(2)}`;

    if (!isWin) {
      this.ctaText.text = 'TRY AGAIN';
    }
  }

  public resize(width: number, height: number): void {
    this.endCardBg.clear();
    this.endCardBg.rect(0, 0, width, height);
    this.endCardBg.fill({ color: 0x000000, alpha: 0.7 });

    this.scoreContainer.x = width - 210;
  }

  public update(deltaMs: number): void {
    this.tutorialHand.update(deltaMs);

    // Smooth score increment animation
    if (this.displayScore < this.currentScore) {
      this.displayScore = Math.min(this.currentScore, this.displayScore + deltaMs * 0.15);
      this.scoreText.text = `$${this.displayScore.toFixed(2)}`;
    }

    // CTA pulse animation
    if (this.isEndCardVisible) {
      this.ctaPulseTime += deltaMs * 0.005;
      const pulse = 1 + Math.sin(this.ctaPulseTime * 2) * 0.06;
      this.ctaButton.scale.set(pulse);
    }
  }
}
