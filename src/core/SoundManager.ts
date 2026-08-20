import { Howl, Howler } from 'howler';
import { ASSET_SOUNDS } from '../assets/assetData';

export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, Howl> = new Map();
  private musicId: number | null = null;
  private isUnlocked: boolean = false;

  private constructor() {
    this.initSounds();
    this.setupUnlockListeners();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initSounds(): void {
    const soundConfigs: Record<string, { src: string; volume: number; loop?: boolean }> = {
      jump: { src: ASSET_SOUNDS.jump, volume: 0.5 },
      hit: { src: ASSET_SOUNDS.hit, volume: 0.6 },
      hurt: { src: ASSET_SOUNDS.hurt, volume: 0.7 },
      collect: { src: ASSET_SOUNDS.collect, volume: 0.6 },
      coin: { src: ASSET_SOUNDS.collect, volume: 0.6 },
      step: { src: ASSET_SOUNDS.step, volume: 0.3 },
      win: { src: ASSET_SOUNDS.win, volume: 0.8 },
      lose: { src: ASSET_SOUNDS.lose, volume: 0.8 },
      music: { src: ASSET_SOUNDS.music, volume: 0.35, loop: true }
    };

    for (const [key, config] of Object.entries(soundConfigs)) {
      if (config.src) {
        try {
          const howl = new Howl({
            src: [config.src],
            volume: config.volume,
            loop: config.loop || false,
            html5: false
          });
          this.sounds.set(key, howl);
        } catch (e) {
          console.warn(`Failed to init sound: ${key}`, e);
        }
      }
    }
  }

  private setupUnlockListeners(): void {
    const unlock = () => {
      this.unlock();
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('pointerdown', unlock, { passive: true, once: true });
    window.addEventListener('click', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
  }

  public unlock(): void {
    if (this.isUnlocked) return;
    this.isUnlocked = true;
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }
    this.playMusic();
  }

  public play(name: string): void {
    if (!this.isUnlocked && Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }
    const snd = this.sounds.get(name) || (name === 'coin' ? this.sounds.get('collect') : (name === 'collect' ? this.sounds.get('coin') : undefined));
    if (!snd) return;

    if (name === 'music') {
      if (this.musicId !== null) return;
      this.musicId = snd.play();
    } else {
      snd.play();
    }
  }

  public playMusic(): void {
    this.play('music');
  }

  public stop(name: string): void {
    const snd = this.sounds.get(name);
    if (snd) {
      snd.stop();
      if (name === 'music') {
        this.musicId = null;
      }
    }
  }

  public stopMusic(): void {
    this.stop('music');
  }

  public pauseAll(): void {
    Howler.mute(true);
  }

  public resumeAll(): void {
    Howler.mute(false);
  }
}
