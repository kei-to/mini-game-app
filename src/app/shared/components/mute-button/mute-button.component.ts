import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-mute-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="mute-button" 
      [class.muted]="isMuted"
      (click)="toggleMute()"
      [attr.aria-label]="isMuted ? 'ミュート解除' : 'ミュート'"
    >
      <span class="icon">{{ isMuted ? '🔇' : '🔊' }}</span>
    </button>
  `,
  styles: [`
    .mute-button {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #2196f3;
      background-color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 1000;
    }

    .mute-button:hover {
      background-color: #e3f2fd;
      transform: scale(1.1);
    }

    .mute-button.muted {
      background-color: #ffebee;
      border-color: #f44336;
    }

    .icon {
      font-size: 20px;
    }
  `]
})
export class MuteButtonComponent implements OnInit {
  isMuted = false;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.isMuted = settings.audio.isMuted;
    });
  }

  toggleMute(): void {
    this.settingsService.updateAudioSettings({
      isMuted: !this.isMuted
    });
  }
} 