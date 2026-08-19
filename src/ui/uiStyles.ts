import { ASSET_IMAGES } from '../assets/assetData';

export function injectGameStyles(): void {
  if (document.getElementById('game-ui-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'game-ui-styles';
  styleEl.textContent = `
    :root {
      --footer-portrait: url(${ASSET_IMAGES.footerPortrait});
      --footer-landscape: url(${ASSET_IMAGES.footerLandscape});
    }

    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }

    #ui-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #ui-container * {
      pointer-events: auto;
    }

    /* ========== HEADER ========== */
    .game-header {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      pointer-events: none;
    }

    .hp-container {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .heart {
      font-size: 30px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .heart.empty {
      opacity: 0.25;
      filter: grayscale(1) drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    /* PayPal Top Counter */
    .paypal-counter {
      position: relative;
      display: inline-block;
      height: clamp(48px, 10vh, 64px);
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
      transform-origin: center right;
    }

    .paypal-counter-image {
      height: 100%;
      width: auto;
      display: block;
      border-radius: 8px;
    }

    .paypal-counter-amount {
      position: absolute;
      top: 50%;
      left: 48%;
      right: 6%;
      transform: translateY(-50%);
      text-align: center;
      font-weight: 900;
      font-size: clamp(20px, 3.5vw, 28px);
      color: #003087;
      text-shadow: 0 1px 2px rgba(255,255,255,0.9);
      white-space: nowrap;
    }

    .paypal-counter.pulse {
      animation: counter-pulse 0.35s ease-out;
    }

    @keyframes counter-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.18); }
      100% { transform: scale(1); }
    }

    /* ========== FLYING COLLECTIBLE ========== */
    .flying-collectible {
      position: fixed;
      width: 44px;
      height: 44px;
      pointer-events: none;
      z-index: 500;
    }

    .flying-collectible img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      animation: spin-collectible var(--fly-duration, 0.4s) linear forwards;
    }

    @keyframes spin-collectible {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(720deg); }
    }

    /* ========== PRAISE POPUP ========== */
    .praise-popup {
      position: fixed;
      font-size: clamp(28px, 6vw, 44px);
      font-weight: 900;
      color: #facc15;
      text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.6);
      pointer-events: none;
      z-index: 450;
      animation: float-praise 0.8s ease-out forwards;
      white-space: nowrap;
    }

    @keyframes float-praise {
      0% {
        opacity: 0;
        transform: scale(0.5) translateY(20px);
      }
      30% {
        opacity: 1;
        transform: scale(1.2) translateY(-10px);
      }
      100% {
        opacity: 0;
        transform: scale(1) translateY(-60px);
      }
    }

    /* ========== TUTORIAL OVERLAY ========== */
    .tutorial-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 200;
      pointer-events: none !important;
      transition: opacity 0.3s ease;
    }

    .tutorial-overlay.hidden {
      display: none;
    }

    .tutorial-text {
      font-size: clamp(24px, 5vw, 36px);
      color: #ffffff;
      font-weight: 900;
      text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.6);
      margin-bottom: 20px;
    }

    .tutorial-hand {
      position: fixed;
      bottom: 24vh;
      left: 50%;
      transform: translate(-50%);
      pointer-events: none !important;
    }

    .hand-icon {
      width: 75px;
      height: auto;
      pointer-events: none !important;
      animation: pulse-hand 1s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
    }

    @keyframes pulse-hand {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    /* ========== FAIL OVERLAY (Red Circle Badge) ========== */
    .fail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 350;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .fail-overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .fail-image {
      width: min(50vw, 50vh);
      max-width: 320px;
      height: auto;
      animation: fail-scale-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      filter: drop-shadow(0 8px 24px rgba(220, 38, 38, 0.6));
    }

    @keyframes fail-scale-in {
      0% { transform: scale(0.3); opacity: 0; }
      70% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* ========== END / PACKSHOT OVERLAY ========== */
    .end-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 300;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease;
    }

    .end-overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .end-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 10;
      max-width: 90vw;
    }

    /* Rotating Sunburst Lights Effect */
    .lights-effect {
      position: absolute;
      top: 50%;
      left: 50%;
      width: min(100vw, 100vh);
      height: min(100vw, 100vh);
      pointer-events: none;
      z-index: 1;
      opacity: 0.85;
      animation: rotate-lights 14s linear infinite;
    }

    @keyframes rotate-lights {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .end-title {
      font-size: clamp(26px, 5vw, 38px);
      font-weight: 900;
      color: #ffffff;
      text-align: center;
      text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.6);
      margin: 0;
      z-index: 5;
    }

    .end-subtitle {
      font-size: clamp(15px, 3vw, 20px);
      font-weight: 700;
      color: #ffffff;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.6);
      margin: 6px 0 12px 0;
      z-index: 5;
    }

    /* PayPal Card */
    .paypal-card-container {
      position: relative;
      width: clamp(220px, 32vw, 300px);
      margin: 8px 0;
      z-index: 5;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
      animation: pop-card 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes pop-card {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .paypal-card-image {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 18px;
    }

    .paypal-card-amount {
      position: absolute;
      bottom: 12%;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: clamp(28px, 4.5vw, 42px);
      font-weight: 900;
      color: #000000;
      letter-spacing: -0.5px;
    }

    /* Countdown Timer */
    .countdown-container {
      margin: 8px 0 14px 0;
      text-align: center;
      color: #ffffff;
      z-index: 5;
    }

    .countdown-timer {
      font-size: clamp(24px, 4vw, 34px);
      font-weight: 900;
      text-shadow: 0 2px 6px rgba(0,0,0,0.7);
    }

    .countdown-text {
      font-size: clamp(12px, 2.2vw, 15px);
      font-weight: 600;
      opacity: 0.9;
      margin-top: 2px;
      text-shadow: 0 1px 3px rgba(0,0,0,0.6);
    }

    /* Red Pulsing CTA Button */
    .cta-button {
      background: #f34141;
      color: #ffffff;
      border: 3px solid #ff7b7b;
      padding: 14px 44px;
      border-radius: 16px;
      font-size: clamp(18px, 3.2vw, 24px);
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 6px 0 #b32020, 0 10px 16px rgba(0,0,0,0.5);
      animation: pulse-cta 1.2s ease-in-out infinite;
      z-index: 5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.4);
      transition: transform 0.1s ease;
    }

    .cta-button:active {
      transform: translateY(4px);
      box-shadow: 0 2px 0 #b32020, 0 4px 8px rgba(0,0,0,0.5);
    }

    @keyframes pulse-cta {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    /* ========== FOOTER (Authentic Playoff Banner) ========== */
    .game-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: clamp(55px, 9vh, 85px);
      background-image: var(--footer-landscape);
      background-size: 100% 100%;
      background-position: center bottom;
      background-repeat: no-repeat;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 20px;
      z-index: 50;
    }

    @media (orientation: portrait) {
      .game-footer {
        background-image: var(--footer-portrait);
      }
    }

    .footer-cta {
      background: linear-gradient(180deg, #ffc837 0%, #ff8008 100%);
      color: #ffffff;
      border: 2px solid #ffe082;
      padding: 8px 24px;
      border-radius: 12px;
      font-size: clamp(14px, 2.5vw, 18px);
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 4px 0 #c25e00, 0 6px 12px rgba(0,0,0,0.4);
      margin-right: 10px;
      animation: pulse-cta 1.2s ease-in-out infinite;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
  `;

  document.head.appendChild(styleEl);
}
