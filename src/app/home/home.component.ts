import { Component, OnInit, OnDestroy } from '@angular/core';
import { SoundService } from '../services/sound.service';
import { CommonModule } from '@angular/common';
import { BgmService } from '../services/bgm.service';
import { Router } from '@angular/router';
import { buttonPressAnimation } from '../shared/animations';
import { BackgroundService } from '../services/background.service';
import { MuteButtonComponent } from '../shared/components/mute-button/mute-button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MuteButtonComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [buttonPressAnimation]
})
export class HomeComponent implements OnInit, OnDestroy {

  infoPressed = false;
  characterPressed = false;
  galleryPressed = false;
  gamePressed: boolean[] = [false, false, false, false, false];

  currentCharacterImage = 'assets/character_1.png';
  characterImages = [
    'assets/character_1.png',
    'assets/character_2.png',
    'assets/character_3.png'
  ];

  gameList = [1, 2, 3, 4, 5];
  private servicesInitialized = false;
  backgroundPath: string = '';

  constructor(
    private soundService: SoundService,
    private bgmService: BgmService,
    private router: Router,
    private backgroundService: BackgroundService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.initializeServices();
      this.backgroundPath = this.backgroundService.getBackgroundPath('home');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      await Promise.all([
        this.initializeSoundService(),
        this.initializeBgmService()
      ]);
      this.servicesInitialized = true;
    } catch (error) {
      console.warn('Some services failed to initialize, continuing with limited functionality');
      this.servicesInitialized = true;
    }
  }

  private async initializeSoundService(): Promise<void> {
    try {
      await this.soundService.initialize();
    } catch (error) {
      console.warn('Sound service initialization failed:', error);
    }
  }

  private async initializeBgmService(): Promise<void> {
    try {
      await this.bgmService.initialize();
      this.bgmService.play();
    } catch (error) {
      console.warn('BGM service initialization failed:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.servicesInitialized) {
      try {
        this.bgmService.stop();
      } catch (error) {
        console.warn('Failed to stop BGM:', error);
      }
    }
  }

  onInfoClick(): void {
    this.infoPressed = true;
    if (this.servicesInitialized) {
      try {
        this.soundService.play('info');
      } catch (error) {
        console.warn('Failed to play info sound:', error);
      }
    }
    setTimeout(() => this.infoPressed = false, 200);
  }

  onCharacterClick(event: MouseEvent): void {
    this.characterPressed = true;
    if (this.servicesInitialized) {
      try {
        this.soundService.play('character');
      } catch (error) {
        console.warn('Failed to play character sound:', error);
      }
    }

    // ランダム画像変更
    const randomIndex = Math.floor(Math.random() * this.characterImages.length);
    this.currentCharacterImage = this.characterImages[randomIndex];

    setTimeout(() => this.characterPressed = false, 200);
  }

  onGameClick(index: number): void {
    this.gamePressed[index] = true;
    if (this.servicesInitialized) {
      try {
        this.soundService.play(`game${index + 1}`);
      } catch (error) {
        console.warn('Failed to play game sound:', error);
      }
    }
    setTimeout(() => {
      this.router.navigate(['/game-select']);
      this.gamePressed[index] = false;
    }, 200);
  }

  onGalleryClick(): void {
    this.galleryPressed = true;
    if (this.servicesInitialized) {
      try {
        this.soundService.play('gallery');
      } catch (error) {
        console.warn('Failed to play gallery sound:', error);
      }
    }
    setTimeout(() => {
      this.router.navigate(['/config']);
      this.galleryPressed = false;
    }, 200);
  }

  playButtonSound(): void {
    this.soundService.play('button');
  }
}
