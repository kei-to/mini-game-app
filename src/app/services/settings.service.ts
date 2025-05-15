import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GameSettings {
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

const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    bgmVolume: 50,
    sfxVolume: 50,
    isMuted: false
  },
  game: {
    difficulty: 'normal',
    language: 'ja',
    showTutorial: true
  },
  progress: {
    clearedGames: [],
    highScores: {},
    unlockedContent: []
  },
  display: {
    showBackground: true,
    enableAnimations: true,
    uiScale: 1
  }
};

const STORAGE_KEY = 'game_settings';

export interface GameScore {
  moves: number;
  time: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<GameSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();
  private readonly HIGH_SCORE_KEY = 'high_scores';

  constructor() {
    // 初期設定の読み込み
    const savedSettings = this.loadSettings();
    this.settingsSubject.next(savedSettings);
  }

  private loadSettings(): GameSettings {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }

  getSettings(): GameSettings {
    return this.settingsSubject.value;
  }

  updateAudioSettings(audioSettings: Partial<GameSettings['audio']>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = {
      ...currentSettings,
      audio: {
        ...currentSettings.audio,
        ...audioSettings
      }
    };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
  }

  updateGameSettings(gameSettings: Partial<GameSettings['game']>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = {
      ...currentSettings,
      game: {
        ...currentSettings.game,
        ...gameSettings
      }
    };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
  }

  updateDisplaySettings(displaySettings: Partial<GameSettings['display']>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = {
      ...currentSettings,
      display: {
        ...currentSettings.display,
        ...displaySettings
      }
    };
    this.settingsSubject.next(newSettings);
    this.saveSettings(newSettings);
  }

  recordGameClear(gameId: string): void {
    const currentSettings = this.settingsSubject.value;
    if (!currentSettings.progress.clearedGames.includes(gameId)) {
      const newSettings = {
        ...currentSettings,
        progress: {
          ...currentSettings.progress,
          clearedGames: [...currentSettings.progress.clearedGames, gameId]
        }
      };
      this.settingsSubject.next(newSettings);
      this.saveSettings(newSettings);
    }
  }

  updateHighScore(gameId: string, score: GameScore): void {
    const scores = this.getAllHighScores();
    scores[gameId] = score;
    localStorage.setItem(this.HIGH_SCORE_KEY, JSON.stringify(scores));
  }

  unlockContent(contentId: string): void {
    const currentSettings = this.settingsSubject.value;
    if (!currentSettings.progress.unlockedContent.includes(contentId)) {
      const newSettings = {
        ...currentSettings,
        progress: {
          ...currentSettings.progress,
          unlockedContent: [...currentSettings.progress.unlockedContent, contentId]
        }
      };
      this.settingsSubject.next(newSettings);
      this.saveSettings(newSettings);
    }
  }

  resetSettings(): void {
    this.settingsSubject.next({ ...DEFAULT_SETTINGS });
    this.saveSettings(DEFAULT_SETTINGS);
  }

  getHighScore(gameId: string): GameScore | null {
    const scores = this.getAllHighScores();
    return scores[gameId] || null;
  }

  private getAllHighScores(): Record<string, GameScore> {
    const scores = localStorage.getItem(this.HIGH_SCORE_KEY);
    return scores ? JSON.parse(scores) : {};
  }
} 