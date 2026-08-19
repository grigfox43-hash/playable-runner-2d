export class MraidAdapter {
  private readonly GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded";
  private readonly APP_STORE_URL = "https://apps.apple.com/us/app/win-real-money-playoff-games/id6444492155";
  private isReady = false;

  constructor() {
    this.initMraid();
  }

  private initMraid(): void {
    const w = window as any;
    if (w.mraid) {
      if (w.mraid.getState() === 'loading') {
        w.mraid.addEventListener('ready', () => {
          this.isReady = true;
        });
      } else {
        this.isReady = true;
      }
    }
  }

  public getStoreUrl(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isIOS ? this.APP_STORE_URL : this.GOOGLE_PLAY_URL;
  }

  public openStore(): void {
    const url = this.getStoreUrl();
    const w = window as any;

    if (w.mraid) {
      try {
        w.mraid.open(url);
        return;
      } catch (e) {
        console.warn('MRAID open error:', e);
      }
    }

    if (w.FbPlayableAd) {
      try {
        w.FbPlayableAd.onCTAClick();
        return;
      } catch (e) {
        console.warn('FbPlayableAd error:', e);
      }
    }

    if (w.super_html && typeof w.super_html.download === 'function') {
      try {
        w.super_html.download();
        return;
      } catch (e) {
        console.warn('super_html error:', e);
      }
    }

    // Standard fallback
    try {
      window.open(url, '_blank');
    } catch (e) {
      window.location.href = url;
    }
  }

  public onViewableChange(callback: (viewable: boolean) => void): void {
    const w = window as any;
    if (w.mraid && typeof w.mraid.addEventListener === 'function') {
      try {
        w.mraid.addEventListener('viewableChange', callback);
      } catch (e) {
        console.warn('mraid addEventListener error:', e);
      }
    }
  }
}
