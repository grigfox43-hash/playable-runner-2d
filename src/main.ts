import { Application } from 'pixi.js';
import { GameController } from './core/GameController';
import { SoundManager } from './core/SoundManager';
import { GAME_CONFIG } from './config/constants';

async function bootstrap() {
  const app = new Application();

  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x06020d,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    antialias: true,
    resizeTo: window
  });

  const container = document.getElementById('game-container') || document.body;
  container.appendChild(app.canvas);

  const gameController = new GameController(app);
  await gameController.init();

  // Responsive Scaling & Centering
  const handleResize = () => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const scaleX = screenW / GAME_CONFIG.DESIGN_WIDTH;
    const scaleY = screenH / GAME_CONFIG.DESIGN_HEIGHT;

    // Scale to fit while maintaining playable view
    const scale = Math.min(scaleX, scaleY);
    gameController.worldContainer.scale.set(scale);

    // Center horizontally and vertically
    gameController.worldContainer.x = (screenW - GAME_CONFIG.DESIGN_WIDTH * scale) / 2;
    gameController.worldContainer.y = (screenH - GAME_CONFIG.DESIGN_HEIGHT * scale) / 2;

    gameController.uiManager.resize(GAME_CONFIG.DESIGN_WIDTH, GAME_CONFIG.DESIGN_HEIGHT);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
  });
  handleResize();

  // Input Handling (Swipe Up & Tap)
  let touchStartY = 0;
  let touchStartX = 0;
  let isPointerDown = false;

  const onPointerDown = (e: PointerEvent | TouchEvent) => {
    isPointerDown = true;
    SoundManager.getInstance().unlock();

    if ('touches' in e && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    } else if ('clientY' in e) {
      touchStartY = (e as PointerEvent).clientY;
      touchStartX = (e as PointerEvent).clientX;
    }
  };

  const onPointerUp = (e: PointerEvent | TouchEvent) => {
    if (!isPointerDown) return;
    isPointerDown = false;

    let endY = touchStartY;
    let endX = touchStartX;

    if ('changedTouches' in e && e.changedTouches.length > 0) {
      endY = e.changedTouches[0].clientY;
      endX = e.changedTouches[0].clientX;
    } else if ('clientY' in e) {
      endY = (e as PointerEvent).clientY;
      endX = (e as PointerEvent).clientX;
    }

    const deltaY = endY - touchStartY;
    const deltaX = Math.abs(endX - touchStartX);

    // Swipe up or simple tap / click triggers jump
    if (deltaY < -20 || (Math.abs(deltaY) < 15 && deltaX < 15)) {
      gameController.handleJumpInput();
    }
  };

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchend', onPointerUp, { passive: true });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      SoundManager.getInstance().unlock();
      gameController.handleJumpInput();
    }
  });

  // Main Ticker
  app.ticker.add((ticker) => {
    const deltaMs = ticker.deltaMS;
    gameController.update(deltaMs);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch(console.error);
});
