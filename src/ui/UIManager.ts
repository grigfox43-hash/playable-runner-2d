import { injectGameStyles } from './uiStyles';
import { ASSET_IMAGES } from '../assets/assetData';
import { HP_CONFIG } from '../config/constants';
import { MraidAdapter } from '../core/MraidAdapter';
import { SoundManager } from '../core/SoundManager';

export class UIManager {
  private uiContainer!: HTMLDivElement;
  private hpDisplay!: HTMLDivElement;
  private hearts: HTMLSpanElement[] = [];

  private scoreContainer!: HTMLDivElement;
  private scoreDisplay!: HTMLSpanElement;

  private tutorialOverlay!: HTMLDivElement;
  private tutorialText!: HTMLDivElement;
  private tutorialHand!: HTMLDivElement;

  // Fail Overlay (Red Circle)
  private failOverlay!: HTMLDivElement;

  // End Screen / Packshot Overlay
  private endOverlay!: HTMLDivElement;
  private endTitle!: HTMLHeadingElement;
  private endSubtitle!: HTMLDivElement;
  private endAmount!: HTMLSpanElement;
  private lightsEffect!: HTMLImageElement;
  private paypalCardContainer!: HTMLDivElement;
  private countdownBox!: HTMLDivElement;
  private countdownTimer!: HTMLDivElement;
  private countdownInterval: number | null = null;
  private ctaBtn!: HTMLButtonElement;
  private gameFooter!: HTMLDivElement;

  private adapter: MraidAdapter;

  private currentScore: number = 0;
  private displayScore: number = 0;
  private balanceAnimationId: number | null = null;
  private collectiblesCount: number = 0;

  constructor(adapter: MraidAdapter) {
    this.adapter = adapter;
    injectGameStyles();
    this.createUI();
  }

  private createUI(): void {
    this.uiContainer = document.getElementById('ui-container') as HTMLDivElement || document.createElement('div');
    this.uiContainer.id = 'ui-container';
    document.body.appendChild(this.uiContainer);

    // 1. Header
    const header = document.createElement('div');
    header.className = 'game-header';

    // HP Hearts
    this.hpDisplay = document.createElement('div');
    this.hpDisplay.className = 'hp-container';
    this.renderHearts(HP_CONFIG.MAX_HP);
    header.appendChild(this.hpDisplay);

    // PayPal Top Counter
    this.scoreContainer = document.createElement('div');
    this.scoreContainer.className = 'paypal-counter';

    const counterImg = document.createElement('img');
    counterImg.src = ASSET_IMAGES.paypalCounter;
    counterImg.alt = 'PayPal Balance';
    counterImg.className = 'paypal-counter-image';
    this.scoreContainer.appendChild(counterImg);

    this.scoreDisplay = document.createElement('span');
    this.scoreDisplay.className = 'paypal-counter-amount';
    this.scoreDisplay.textContent = '$0';
    this.scoreContainer.appendChild(this.scoreDisplay);

    header.appendChild(this.scoreContainer);
    this.uiContainer.appendChild(header);

    // 2. Tutorial Overlay
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.className = 'tutorial-overlay';

    this.tutorialText = document.createElement('div');
    this.tutorialText.className = 'tutorial-text';
    this.tutorialText.textContent = 'Tap to start earning!';
    this.tutorialOverlay.appendChild(this.tutorialText);
    this.uiContainer.appendChild(this.tutorialOverlay);

    this.tutorialHand = document.createElement('div');
    this.tutorialHand.className = 'tutorial-hand';
    const handImg = document.createElement('img');
    handImg.src = ASSET_IMAGES.tutorialHandIcon;
    handImg.alt = 'tap';
    handImg.className = 'hand-icon';
    this.tutorialHand.appendChild(handImg);
    this.uiContainer.appendChild(this.tutorialHand);

    // 3. Fail Overlay (Red Circle)
    this.failOverlay = document.createElement('div');
    this.failOverlay.className = 'fail-overlay';

    const failImg = document.createElement('img');
    failImg.src = ASSET_IMAGES.failBadge;
    failImg.alt = 'FAIL';
    failImg.className = 'fail-image';
    this.failOverlay.appendChild(failImg);

    this.uiContainer.appendChild(this.failOverlay);

    // 4. End Screen / Packshot Overlay
    this.endOverlay = document.createElement('div');
    this.endOverlay.className = 'end-overlay';

    // Rotating Sunburst Lights
    this.lightsEffect = document.createElement('img');
    this.lightsEffect.src = ASSET_IMAGES.lights;
    this.lightsEffect.alt = '';
    this.lightsEffect.className = 'lights-effect';
    this.endOverlay.appendChild(this.lightsEffect);

    // End Content Card
    const endContent = document.createElement('div');
    endContent.className = 'end-content';

    this.endTitle = document.createElement('h1');
    this.endTitle.className = 'end-title';
    this.endTitle.textContent = 'Great job!';
    endContent.appendChild(this.endTitle);

    this.endSubtitle = document.createElement('div');
    this.endSubtitle.className = 'end-subtitle';
    this.endSubtitle.textContent = 'Claim your cash on the app!';
    endContent.appendChild(this.endSubtitle);

    // Big PayPal Card
    this.paypalCardContainer = document.createElement('div');
    this.paypalCardContainer.className = 'paypal-card-container';

    const cardImg = document.createElement('img');
    cardImg.src = ASSET_IMAGES.paypalCard;
    cardImg.alt = 'PayPal';
    cardImg.className = 'paypal-card-image';
    this.paypalCardContainer.appendChild(cardImg);

    this.endAmount = document.createElement('span');
    this.endAmount.className = 'paypal-card-amount';
    this.endAmount.textContent = '$0.00';
    this.paypalCardContainer.appendChild(this.endAmount);

    endContent.appendChild(this.paypalCardContainer);

    // Countdown Timer
    this.countdownBox = document.createElement('div');
    this.countdownBox.className = 'countdown-container';

    this.countdownTimer = document.createElement('div');
    this.countdownTimer.className = 'countdown-timer';
    this.countdownTimer.textContent = '00:59';
    this.countdownBox.appendChild(this.countdownTimer);

    const countdownSub = document.createElement('div');
    countdownSub.className = 'countdown-text';
    countdownSub.textContent = 'Next payment in one minute';
    this.countdownBox.appendChild(countdownSub);

    endContent.appendChild(this.countdownBox);

    // Red/Yellow Pulsing CTA Button
    this.ctaBtn = document.createElement('button');
    this.ctaBtn.className = 'cta-button';
    this.ctaBtn.textContent = 'INSTALL AND EARN';
    this.ctaBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      SoundManager.getInstance().play('win');
      this.adapter.openStore();
    });
    endContent.appendChild(this.ctaBtn);

    this.endOverlay.appendChild(endContent);
    this.uiContainer.appendChild(this.endOverlay);

    // Bottom Purple Banner Footer with Yellow DOWNLOAD Button
    this.gameFooter = document.createElement('div');
    this.gameFooter.className = 'game-footer';

    const footerImg = document.createElement('img');
    footerImg.className = 'footer-graphic';
    footerImg.src = ASSET_IMAGES.footerPortrait;
    footerImg.alt = 'Playoff';
    this.gameFooter.appendChild(footerImg);

    const footerCta = document.createElement('button');
    footerCta.className = 'footer-cta';
    footerCta.textContent = 'DOWNLOAD';
    footerCta.addEventListener('click', (e) => {
      e.stopPropagation();
      SoundManager.getInstance().play('win');
      this.adapter.openStore();
    });
    this.gameFooter.appendChild(footerCta);
    this.uiContainer.appendChild(this.gameFooter);
  }

  private renderHearts(hp: number): void {
    this.hpDisplay.innerHTML = '';
    this.hearts = [];

    for (let i = 0; i < HP_CONFIG.MAX_HP; i++) {
      const heart = document.createElement('span');
      heart.className = i < hp ? 'heart' : 'heart empty';
      heart.textContent = '❤️';
      this.hpDisplay.appendChild(heart);
      this.hearts.push(heart);
    }
  }

  public setHp(hp: number): void {
    this.renderHearts(hp);
  }

  public showTutorial(prompt: string = 'Tap to start earning!'): void {
    this.tutorialText.textContent = prompt;
    this.tutorialOverlay.classList.remove('hidden');
    this.tutorialHand.classList.remove('hidden');
  }

  public hideTutorial(): void {
    this.tutorialOverlay.classList.add('hidden');
    this.tutorialHand.classList.add('hidden');
  }

  public showFailOverlay(): void {
    this.failOverlay.classList.add('visible');
  }

  public hideFailOverlay(): void {
    this.failOverlay.classList.remove('visible');
  }

  public triggerCollect(fromX: number, fromY: number, type: 'dollar' | 'paypalCard', newScore: number): void {
    this.animateFlyingCollectible(fromX, fromY, type);
    this.updateScore(newScore);

    this.collectiblesCount++;
    if (this.collectiblesCount % 3 === 0) {
      this.showPraisePopup();
    }
  }

  private animateFlyingCollectible(startX: number, startY: number, type: 'dollar' | 'paypalCard'): void {
    const rect = this.scoreContainer.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    const flyEl = document.createElement('div');
    flyEl.className = 'flying-collectible';
    const img = document.createElement('img');
    img.src = type === 'dollar' ? ASSET_IMAGES.flyingDollar : ASSET_IMAGES.flyingCard;
    flyEl.appendChild(img);

    flyEl.style.left = '0px';
    flyEl.style.top = '0px';
    flyEl.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1)`;
    flyEl.style.transition = 'transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.38s ease';
    this.uiContainer.appendChild(flyEl);

    requestAnimationFrame(() => {
      flyEl.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(0.5)`;
      flyEl.style.opacity = '0.7';
    });

    setTimeout(() => {
      this.scoreContainer.classList.remove('pulse');
      void this.scoreContainer.offsetWidth;
      this.scoreContainer.classList.add('pulse');
      flyEl.remove();
    }, 380);
  }

  public showPraisePopup(): void {
    const praiseList = ['AWESOME!', 'NICE!', 'GREAT!', 'AMAZING!', 'PERFECT!'];
    const text = praiseList[Math.floor(Math.random() * praiseList.length)];

    const popup = document.createElement('div');
    popup.className = 'praise-popup';
    popup.textContent = text;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 40;

    popup.style.left = `${screenW / 2 + offsetX}px`;
    popup.style.top = `${screenH * 0.35 + offsetY}px`;
    popup.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(popup);
    popup.addEventListener('animationend', () => {
      popup.remove();
    });
  }

  public updateScore(amount: number): void {
    this.currentScore = amount;
    const floorAmount = Math.floor(amount);
    this.scoreDisplay.textContent = `$${floorAmount}`;

    if (floorAmount < 10) {
      this.scoreDisplay.style.fontSize = 'clamp(14px, 2.4vw, 19px)';
      this.scoreDisplay.style.left = '48%';
    } else if (floorAmount < 100) {
      this.scoreDisplay.style.fontSize = 'clamp(12px, 2.0vw, 16px)';
      this.scoreDisplay.style.left = '46%';
    } else {
      this.scoreDisplay.style.fontSize = 'clamp(10px, 1.6vw, 13px)';
      this.scoreDisplay.style.left = '44%';
    }
  }

  public showEndCard(isWin: boolean, finalScore: number): void {
    if (this.gameFooter) {
      this.gameFooter.style.display = 'none';
    }

    this.endOverlay.classList.add('visible');

    if (isWin) {
      this.endTitle.textContent = 'Congratulations!';
      this.endSubtitle.textContent = 'Choose your reward!';
      this.ctaBtn.className = 'cta-button win';
    } else {
      this.endTitle.textContent = "You didn't make it!";
      this.endSubtitle.textContent = 'Try again on the app!';
      this.ctaBtn.className = 'cta-button';
    }

    this.animateCardBalance(finalScore);
    this.startCountdown(59);
  }

  private animateCardBalance(target: number): void {
    if (this.balanceAnimationId) {
      cancelAnimationFrame(this.balanceAnimationId);
    }

    const startTime = performance.now();
    const duration = 1000;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = target * ease;
      const text = `$${val.toFixed(2)}`;

      this.endAmount.textContent = text;

      // Rubber dynamic font scaling based on content length
      if (text.length <= 5) {
        this.endAmount.style.fontSize = '';
      } else if (text.length <= 6) {
        this.endAmount.style.fontSize = 'clamp(30px, 6.2vw, 54px)';
      } else {
        this.endAmount.style.fontSize = 'clamp(24px, 5.0vw, 44px)';
      }

      if (progress < 1) {
        this.balanceAnimationId = requestAnimationFrame(step);
      }
    };

    this.balanceAnimationId = requestAnimationFrame(step);
  }

  private startCountdown(seconds: number): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    let remaining = seconds;
    if (this.countdownBox) {
      this.countdownBox.classList.remove('fade-out');
    }

    const updateText = () => {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      this.countdownTimer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    updateText();
    this.countdownInterval = window.setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        remaining = 0;
        updateText();
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        // Smoothly fade out the timer and text
        if (this.countdownBox) {
          this.countdownBox.classList.add('fade-out');
        }
      } else {
        updateText();
      }
    }, 1000);
  }

  public resize(windowWidth: number, windowHeight: number, scale: number, offsetX: number): void {
    // Handled dynamically via CSS
  }

  public update(deltaMs: number): void {
    // Handled via CSS
  }
}
