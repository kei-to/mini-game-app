import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, GameSettings } from '../services/settings.service';
import { Router } from '@angular/router';
import { MuteButtonComponent } from '../shared/components/mute-button/mute-button.component';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MuteButtonComponent],
  template: `
    <div class="config-container">
      <app-mute-button></app-mute-button>
      <div class="header">
        <button class="back-button" (click)="goBack()">← 戻る</button>
        <h2>設定</h2>
      </div>
      
      <div class="config-section">
        <h3>音声設定</h3>
        
        <div class="setting-item">
          <label for="bgmVolume">BGM音量</label>
          <input
            type="range"
            id="bgmVolume"
            [(ngModel)]="settings.audio.bgmVolume"
            (ngModelChange)="updateAudioSettings()"
            min="0"
            max="100"
            step="1"
          >
          <span>{{ settings.audio.bgmVolume }}%</span>
        </div>

        <div class="setting-item">
          <label for="sfxVolume">効果音量</label>
          <input
            type="range"
            id="sfxVolume"
            [(ngModel)]="settings.audio.sfxVolume"
            (ngModelChange)="updateAudioSettings()"
            min="0"
            max="100"
            step="1"
          >
          <span>{{ settings.audio.sfxVolume }}%</span>
        </div>
      </div>

      <button class="reset-button" (click)="resetSettings()">設定をリセット</button>
    </div>
  `,
  styles: [`
    .config-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .back-button {
      padding: 8px 16px;
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 20px;
    }

    .back-button:hover {
      background-color: #1976d2;
    }

    .config-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

    .setting-item {
      display: flex;
      align-items: center;
      margin: 10px 0;
      gap: 10px;
    }

    label {
      min-width: 100px;
    }

    input[type="range"] {
      flex: 1;
    }

    .reset-button {
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .reset-button:hover {
      background-color: #d32f2f;
    }
  `]
})
export class ConfigComponent implements OnInit {
  settings: GameSettings;

  constructor(
    private settingsService: SettingsService,
    private router: Router
  ) {
    this.settings = this.settingsService.getSettings();
  }

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
    });
  }

  updateAudioSettings(): void {
    this.settingsService.updateAudioSettings({
      bgmVolume: this.settings.audio.bgmVolume,
      sfxVolume: this.settings.audio.sfxVolume
    });
  }

  resetSettings(): void {
    this.settingsService.resetSettings();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
} 