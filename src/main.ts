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

  // Fullscreen Responsive Scaling & Centering
  const handleResize = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    app.renderer.resize(windowWidth, windowHeight);

    // Maintain 1280 height, expand horizontally
    const scale = windowHeight / GAME_CONFIG.DESIGN_HEIGHT;
    gameController.worldContainer.scale.set(scale);

    const scaledDesignWidth = GAME_CONFIG.DESIGN_WIDTH * scale;
    const offsetX = (windowWidth - scaledDesignWidth) / 2;
    gameController.worldContainer.position.set(offsetX, 0);

    gameController.uiManager.resize(windowWidth, windowHeight, scale, offsetX);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
  });
  handleResize();

  // Input Handling (Swipe Up, Tap, Click, Space, ArrowUp)
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

    // Swipe up or tap/click anywhere jumps
    if (deltaY < -20 || (Math.abs(deltaY) < 20 && deltaX < 20)) {
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

  // Main Game Loop
  app.ticker.add((ticker) => {
    const deltaMs = ticker.deltaMS;
    gameController.update(deltaMs);
  });

  // Tab visibility & App switch pause/resume
  const handleVisibilityChange = () => {
    if (document.hidden) {
      app.ticker.stop();
      SoundManager.getInstance().pauseAll();
    } else {
      app.ticker.start();
      SoundManager.getInstance().resumeAll();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', () => {
    app.ticker.stop();
    SoundManager.getInstance().pauseAll();
  });
  window.addEventListener('focus', () => {
    app.ticker.start();
    SoundManager.getInstance().resumeAll();
  });

  gameController.adapter.onViewableChange((viewable: boolean) => {
    if (viewable) {
      app.ticker.start();
      SoundManager.getInstance().resumeAll();
    } else {
      app.ticker.stop();
      SoundManager.getInstance().pauseAll();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch(console.error);
});
