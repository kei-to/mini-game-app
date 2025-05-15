import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SettingsService } from '../services/settings.service';

export interface BackgroundConfig {
  name: string;
  path: string;
  fallbackPath?: string;
}

interface GameSettings {
  audio: {
    bgmVolume: number;
    sfxVolume: number;
    isMuted: boolean;
  };
  game: {
    difficulty: 'easy' | 'normal' | 'hard';
    language: 'ja' | 'en';
    showTutorial: boolean;
  };
  progress: {
    clearedGames: string[];
    highScores: { [gameId: string]: number };
    unlockedContent: string[];
  };
  display: {
    showBackground: boolean;
    enableAnimations: boolean;
    uiScale: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BackgroundService {
  private platformId = inject(PLATFORM_ID);
  private currentBackground: string | null = null;
  private backgrounds: { [key: string]: BackgroundConfig } = {
    home: {
      name: 'home',
      path: '/assets/backgrounds/home_bg.png',
      fallbackPath: '/assets/backgrounds/default_bg.png'
    },
    gameSelect: {
      name: 'game_select',
      path: '/assets/backgrounds/game_select_bg.png',
      fallbackPath: '/assets/backgrounds/default_bg.png'
    },
    gallery: {
      name: 'gallery',
      path: '/assets/backgrounds/gallery_bg.png',
      fallbackPath: '/assets/backgrounds/default_bg.png'
    },
    game: {
      name: 'game',
      path: '/assets/backgrounds/game_bg.png',
      fallbackPath: '/assets/backgrounds/default_bg.png'
    }
  };

  constructor(private settingsService: SettingsService) {
    // 設定の取得
    const settings = this.settingsService.getSettings();
    
    // 設定の更新
    this.settingsService.updateAudioSettings({ bgmVolume: 25 });
    
    // ゲームクリアの記録
    this.settingsService.recordGameClear('game1');
  }

  getBackgroundPath(screenName: string): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const config = this.backgrounds[screenName];
    if (!config) {
      console.warn(`Background configuration not found for screen: ${screenName}`);
      return '/assets/backgrounds/default_bg.png';
    }

    this.currentBackground = config.path;
    return config.path;
  }

  preloadBackgrounds(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    Object.values(this.backgrounds).forEach(config => {
      const img = new Image();
      img.src = config.path;
      img.onerror = () => {
        console.warn(`Failed to preload background: ${config.path}`);
        if (config.fallbackPath) {
          img.src = config.fallbackPath;
        }
      };
    });
  }

  getCurrentBackground(): string | null {
    return this.currentBackground;
  }
} 