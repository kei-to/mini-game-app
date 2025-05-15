// sound.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Howl } from 'howler';
import { isPlatformBrowser } from '@angular/common';
import { ISoundService } from './audio.interface';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class SoundService implements ISoundService {
  private sounds: { [key: string]: Howl } = {};
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
      if (this.initialized) {
        this.updateVolume(settings.audio.sfxVolume);
        if (settings.audio.isMuted) {
          this.muteAll();
        } else {
          this.unmuteAll();
        }
      }
    });
  }

  private updateVolume(volume: number): void {
    Object.values(this.sounds).forEach(sound => {
      sound.volume(volume / 100);
    });
  }

  private muteAll(): void {
    Object.values(this.sounds).forEach(sound => {
      sound.mute(true);
    });
  }

  private unmuteAll(): void {
    Object.values(this.sounds).forEach(sound => {
      sound.mute(false);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      console.warn('SoundService: Not running in browser environment');
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const soundFiles = [
          { name: 'button', path: '/assets/sounds/button.mp3' },
          { name: 'correct', path: '/assets/sounds/correct.mp3' },
          { name: 'incorrect', path: '/assets/sounds/incorrect.mp3' }
        ];

        const loadPromises = soundFiles.map(file => {
          return new Promise<void>((resolve, reject) => {
            const sound = new Howl({
              src: [file.path],
              html5: true,
              onload: () => {
                this.sounds[file.name] = sound;
                resolve();
              },
              onloaderror: (id, error) => {
                console.warn(`Failed to load sound ${file.name}:`, error);
                resolve(); // エラーでも続行
              }
            });
          });
        });

        await Promise.all(loadPromises);
        this.initialized = true;
      } catch (error) {
        console.warn('SoundService initialization failed:', error);
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

  play(soundName: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.initialized) {
      console.warn('SoundService not initialized');
      return;
    }

    const sound = this.sounds[soundName];
    if (sound) {
      try {
        sound.play();
      } catch (error) {
        console.warn(`Failed to play sound ${soundName}:`, error);
      }
    } else {
      console.warn(`Sound ${soundName} not found`);
    }
  }
}
