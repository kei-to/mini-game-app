import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {

  unlockedImages: string[] = [
    'assets/gallery/image1.png',
    'assets/gallery/image2.png',
    'assets/gallery/image3.png'
  ];

  unlockedVoices: { name: string, file: string }[] = [
    { name: 'セリフ①', file: 'assets/voices/voice1.mp3' },
    { name: 'セリフ②', file: 'assets/voices/voice2.mp3' }
  ];

  unlockedBadges: { name: string, image: string }[] = [
    { name: '初勝利', image: 'assets/badges/badge1.png' },
    { name: '全クリア', image: 'assets/badges/badge2.png' }
  ];

  private currentAudio: HTMLAudioElement | null = null;

  constructor(private router: Router) {}

  playVoice(voice: { name: string, file: string }): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.currentAudio = new Audio(voice.file);
    this.currentAudio.play();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
