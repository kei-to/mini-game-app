import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameModalComponent } from '../shared/components/game-modal/game-modal.component';
import { LightsOutComponent } from '../games/lights-out/lights-out.component';

interface Game {
  id: number;
  title: string;
  thumbnail: string;
  component: any; // 実際のゲームコンポーネントの型に変更する必要があります
}

@Component({
  selector: 'app-game-select',
  templateUrl: './game-select.component.html',
  styleUrls: ['./game-select.component.scss'],
  standalone: true,
  imports: [CommonModule, GameModalComponent]
})
export class GameSelectComponent {
  games: Game[] = [
    { 
      id: 1, 
      title: 'ライツアウト', 
      thumbnail: 'assets/games/lights-out.png', 
      component: LightsOutComponent 
    },
    { id: 2, title: 'パズルチャレンジ', thumbnail: 'assets/games/puzzle.png', component: null },
    { id: 3, title: 'タイミングゲーム', thumbnail: 'assets/games/timing.png', component: null }
  ];

  selectedGame: Game | null = null;
  isModalOpen = false;

  constructor(private router: Router) {}

  selectGame(game: Game): void {
    this.selectedGame = game;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedGame = null;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
