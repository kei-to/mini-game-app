// bgm.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Howl } from 'howler';
import { IBgmService } from './audio.interface';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class BgmService implements IBgmService {
  private bgm: Howl | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private platformId = inject(PLATFORM_ID);

  constructor(private settingsService: SettingsService) {
    if (isPlatformBrowser(this.platformId)) {
      this.initialize();
      this.setupSettingsListener();
    }
  }

  private setupSettingsListener(): void {
    this.settingsService.settings$.subscribe(settings => {
      if (this.initialized && this.bgm) {
        this.bgm.volume(settings.audio.bgmVolume / 100);
        if (settings.audio.isMuted) {
          this.bgm.mute(true);
        } else {
          this.bgm.mute(false);
        }
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      console.warn('BgmService: Not running in browser environment');
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        this.bgm = new Howl({
          src: ['/assets/bgm/Kokage_De_Yuttari-1(Slow).mp3'],
          loop: true,
          volume: 0.5,
          html5: true,
          onload: () => {
            this.initialized = true;
          },
          onloaderror: (id, error) => {
            console.warn('Failed to load BGM:', error);
            this.initialized = false;
          }
        });
      } catch (error) {
        console.warn('BgmService initialization failed:', error);
        this.initialized = false;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  play(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.initialized || !this.bgm) {
      console.warn('BgmService not initialized');
      return;
    }

    try {
      this.bgm.play();
    } catch (error) {
      console.warn('Failed to play BGM:', error);
    }
  }

  stop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.initialized || !this.bgm) {
      return;
    }

    try {
      this.bgm.stop();
    } catch (error) {
      console.warn('Failed to stop BGM:', error);
    }
  }

  fadeOut(duration: number = 1000): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.initialized || !this.bgm) {
      return;
    }

    try {
      this.bgm.fade(0.5, 0, duration);
      setTimeout(() => this.stop(), duration);
    } catch (error) {
      console.warn('Failed to fade out BGM:', error);
    }
  }
}

