import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { LAYER_Z_INDEX, HP_CONFIG } from '../config/constants';
import { TutorialHand } from './TutorialHand';
import { MraidAdapter } from '../core/MraidAdapter';
import { SoundManager } from '../core/SoundManager';

export class UIManager extends Container {
  private hudContainer!: Container;
  private hpContainer!: Container;
  private hpHearts: Graphics[] = [];
  private scoreContainer!: Container;
  private scoreText!: Text;

  public tutorialHand!: TutorialHand;
  private endCardContainer!: Container;
  private endCardBg!: Graphics;
  private cardModal!: Container;
  private ctaButton!: Container;
  private ctaBtnBg!: Graphics;
  private ctaText!: Text;
  private endAmountText!: Text;

  // Bottom Footer
  private footerContainer!: Container;
  private footerBg!: Graphics;
  private footerCtaBtn!: Container;

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
    this.createFooter();
    this.createTutorial();
    this.createEndCard();
  }

  private createHUD(): void {
    this.hudContainer = new Container();
    this.addChild(this.hudContainer);

    // HP Hearts Container
    this.hpContainer = new Container();
    this.hpContainer.x = 35;
    this.hpContainer.y = 45;

    for (let i = 0; i < HP_CONFIG.MAX_HP; i++) {
      const heart = new Graphics();
      this.drawHeart(heart, true);
      heart.x = i * 44;
      heart.y = 0;
      this.hpContainer.addChild(heart);
      this.hpHearts.push(heart);
    }
    this.hudContainer.addChild(this.hpContainer);

    // Score / Money Pill Badge
    this.scoreContainer = new Container();
    this.scoreContainer.x = 720 - 210;
    this.scoreContainer.y = 40;

    const pillBg = new Graphics();
    pillBg.roundRect(0, 0, 180, 52, 26);
    pillBg.fill({ color: 0x111111, alpha: 0.85 });
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

  private createFooter(): void {
    this.footerContainer = new Container();
    this.footerContainer.y = 1170; // Bottom bar area

    this.footerBg = new Graphics();
    this.footerBg.rect(-3000, 0, 7000, 110);
    this.footerBg.fill({ color: 0x7c3aed, alpha: 0.95 });
    this.footerContainer.addChild(this.footerBg);

    // Footer Logo Text
    const logoStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 42,
      fontWeight: 'bold',
      fill: '#ffffff',
      fontStyle: 'italic'
    });
    const logoText = new Text({ text: 'Playoff', style: logoStyle });
    logoText.anchor.set(0, 0.5);
    logoText.x = 40;
    logoText.y = 55;
    this.footerContainer.addChild(logoText);

    // Footer CTA Button
    this.footerCtaBtn = new Container();
    this.footerCtaBtn.x = 720 - 150;
    this.footerCtaBtn.y = 55;
    this.footerCtaBtn.eventMode = 'static';
    this.footerCtaBtn.cursor = 'pointer';

    const btnBg = new Graphics();
    btnBg.roundRect(-100, -28, 200, 56, 28);
    btnBg.fill({ color: 0x22c55e });
    btnBg.stroke({ color: 0xffffff, width: 2 });
    this.footerCtaBtn.addChild(btnBg);

    const btnStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 22,
      fontWeight: 'bold',
      fill: '#ffffff'
    });
    const btnText = new Text({ text: 'DOWNLOAD', style: btnStyle });
    btnText.anchor.set(0.5);
    this.footerCtaBtn.addChild(btnText);

    this.footerCtaBtn.on('pointertap', () => {
      this.adapter.openStore();
    });

    this.footerContainer.addChild(this.footerCtaBtn);
    this.addChild(this.footerContainer);
  }

  private drawHeart(g: Graphics, filled: boolean): void {
    g.clear();
    const color = filled ? 0xef4444 : 0x4b5563;
    const alpha = filled ? 1 : 0.6;

    g.moveTo(0, 0);
    g.bezierCurveTo(-14, -14, -28, 7, 0, 24);
    g.bezierCurveTo(28, 7, 14, -14, 0, 0);
    g.fill({ color, alpha });

    if (filled) {
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

    this.endCardBg = new Graphics();
    this.endCardBg.rect(-3000, 0, 7000, 1280);
    this.endCardBg.fill({ color: 0x000000, alpha: 0.75 });
    this.endCardContainer.addChild(this.endCardBg);

    this.cardModal = new Container();
    this.cardModal.x = 360;
    this.cardModal.y = 560;

    const modalBg = new Graphics();
    modalBg.roundRect(-260, -260, 520, 520, 36);
    modalBg.fill({ color: 0x18181b, alpha: 0.96 });
    modalBg.stroke({ color: 0xeab308, width: 5 });
    this.cardModal.addChild(modalBg);

    // Star icon
    const starIcon = new Graphics();
    starIcon.circle(0, -190, 50);
    starIcon.fill({ color: 0xfacc15 });
    starIcon.stroke({ color: 0xffffff, width: 3.5 });
    this.cardModal.addChild(starIcon);

    const starSymStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 46,
      fontWeight: 'bold',
      fill: '#ffffff',
      align: 'center'
    });
    const starSym = new Text({ text: '★', style: starSymStyle });
    starSym.anchor.set(0.5);
    starSym.x = 0;
    starSym.y = -190;
    this.cardModal.addChild(starSym);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#fde047',
      stroke: { color: '#000000', width: 4 },
      align: 'center'
    });
    const titleText = new Text({ text: 'LEVEL COMPLETED!', style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.y = -105;
    this.cardModal.addChild(titleText);

    // Subtitle
    const subStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#9ca3af',
      align: 'center'
    });
    const subText = new Text({ text: 'TOTAL CASH EARNED', style: subStyle });
    subText.anchor.set(0.5);
    subText.y = -55;
    this.cardModal.addChild(subText);

    // Amount Text
    const amountStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 50,
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
    this.endAmountText.y = 15;
    this.cardModal.addChild(this.endAmountText);

    // CTA Button
    this.ctaButton = new Container();
    this.ctaButton.y = 160;
    this.ctaButton.eventMode = 'static';
    this.ctaButton.cursor = 'pointer';

    this.ctaBtnBg = new Graphics();
    this.ctaBtnBg.roundRect(-190, -38, 380, 76, 38);
    this.ctaBtnBg.fill({ color: 0x22c55e });
    this.ctaBtnBg.stroke({ color: 0x86efac, width: 3 });
    this.ctaButton.addChild(this.ctaBtnBg);

    const ctaStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 26,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#14532d', width: 3 },
      align: 'center'
    });
    this.ctaText = new Text({ text: 'CLAIM REWARD', style: ctaStyle });
    this.ctaText.anchor.set(0.5);
    this.ctaButton.addChild(this.ctaText);

    this.ctaButton.on('pointertap', () => {
      SoundManager.getInstance().play('win');
      this.adapter.openStore();
    });

    this.cardModal.addChild(this.ctaButton);
    this.endCardContainer.addChild(this.cardModal);
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

  public resize(windowWidth: number, windowHeight: number, scale: number, offsetX: number): void {
    // Left edge in local stage coordinates
    const localLeft = -offsetX / scale;
    // Right edge in local stage coordinates
    const localRight = (windowWidth - offsetX) / scale;

    // Anchor HUD elements
    this.hpContainer.x = localLeft + 35;
    this.scoreContainer.x = localRight - 215;

    // Footer width and position
    this.footerCtaBtn.x = localRight - 150;

    // End card modal center
    this.cardModal.x = (localLeft + localRight) / 2;
  }

  public update(deltaMs: number): void {
    this.tutorialHand.update(deltaMs);

    if (this.displayScore < this.currentScore) {
      this.displayScore = Math.min(this.currentScore, this.displayScore + deltaMs * 0.15);
      this.scoreText.text = `$${this.displayScore.toFixed(2)}`;
    }

    if (this.isEndCardVisible) {
      this.ctaPulseTime += deltaMs * 0.005;
      const pulse = 1 + Math.sin(this.ctaPulseTime * 2) * 0.06;
      this.ctaButton.scale.set(pulse);
    }
  }
}
