import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

interface Cell {
  isBlurred: boolean;
  row: number;
  col: number;
  transparentImage: string;
}

interface GameScore {
  moves: number;
  time: number;
  date: string;
  clearCount: number;
}

type Difficulty = 'easy' | 'normal' | 'hard';

interface GridSize {
  rows: number;
  cols: number;
}

@Component({
  selector: 'app-lights-out',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <div class="difficulty-selector">
          <button 
            *ngFor="let diff of difficulties" 
            [class.active]="currentDifficulty === diff"
            (click)="changeDifficulty(diff)">
            {{ getDifficultyLabel(diff) }}
          </button>
        </div>
        <div class="game-info">
          <div class="timer">時間: {{ formatTime(elapsedTime) }}</div>
          <div class="moves">手数: {{ moves }}</div>
        </div>
      </div>

      <div class="game-board" 
           [style.grid-template-columns]="'repeat(' + gridSize.cols + ', 1fr)'"
           [style.grid-template-rows]="'repeat(' + gridSize.rows + ', 1fr)'">
        <div class="background-image">
          <img [src]="getBackgroundImage()" [alt]="'背景画像 - ' + getDifficultyLabel(currentDifficulty)">
        </div>
        <div
          *ngFor="let cell of cells"
          class="cell"
          [class.blurred]="cell.isBlurred"
          (click)="toggleCell(cell)"
          [attr.aria-label]="'マス ' + (cell.row + 1) + '-' + (cell.col + 1) + ' ' + (cell.isBlurred ? 'ボカシあり' : 'ボカシなし')"
          tabindex="0"
          (keydown.enter)="toggleCell(cell)"
          (keydown.space)="toggleCell(cell)">
          <img [src]="cell.transparentImage" [alt]="'透過画像 - ' + getDifficultyLabel(currentDifficulty)">
        </div>
      </div>

      <div class="controls">
        <button (click)="resetGame()">リセット</button>
      </div>

      <div class="score-board" *ngIf="highScores[currentDifficulty]">
        <h3>ハイスコア</h3>
        <div class="score-item">
          <span>最短手数:</span>
          <span>{{ highScores[currentDifficulty]!.moves }}手</span>
        </div>
        <div class="score-item">
          <span>クリア時間:</span>
          <span>{{ formatTime(highScores[currentDifficulty]!.time) }}</span>
        </div>
        <div class="score-item">
          <span>達成日時:</span>
          <span>{{ highScores[currentDifficulty]!.date }}</span>
        </div>
        <div class="score-item">
          <span>クリア回数:</span>
          <span>{{ highScores[currentDifficulty]!.clearCount }}回</span>
        </div>
      </div>

      <div *ngIf="isGameWon" class="win-message">
        <h2>クリア！</h2>
        <p>手数: {{ moves }}</p>
        <p>時間: {{ formatTime(elapsedTime) }}</p>
        <p>難易度: {{ getDifficultyLabel(currentDifficulty) }}</p>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
      width: 90vw;
      max-width: 800px;
      margin: 0 auto;
    }

    .game-header {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .difficulty-selector {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .difficulty-selector button {
      padding: 8px 16px;
      border: 2px solid #2196f3;
      border-radius: 4px;
      background: transparent;
      color: #2196f3;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: #2196f3;
        color: white;
      }

      &:hover {
        background: #1976d2;
        color: white;
        border-color: #1976d2;
      }
    }

    .game-info {
      display: flex;
      gap: 20px;
      font-size: 1.2em;
      justify-content: center;
    }

    .game-board {
      position: relative;
      display: grid;
      gap: 4px;
      background: #333;
      padding: 4px;
      border-radius: 8px;
      width: 80vw;
      max-width: 600px;
      aspect-ratio: 1;
    }

    .background-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
    }

    .cell {
      position: relative;
      aspect-ratio: 1;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      outline: none;
      overflow: hidden;
      z-index: 2;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.3s ease;
        opacity: 0.3; /* 初期透過率 */
      }

      &:hover {
        filter: brightness(1.1);
      }

      &:focus {
        box-shadow: 0 0 0 2px #2196f3;
      }

      &.blurred img {
        opacity: 1; /* ボカシなし、透過のみ */
      }
    }

    .controls {
      display: flex;
      gap: 10px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #2196f3;
      color: white;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.2s;

      &:hover {
        background: #1976d2;
      }
    }

    .score-board {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      width: 80vw;
      max-width: 600px;

      h3 {
        margin: 0 0 10px 0;
        text-align: center;
        color: #333;
      }
    }

    .score-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ddd;

      &:last-child {
        border-bottom: none;
      }
    }

    .win-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.95);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      animation: fadeIn 0.3s ease-out;
      z-index: 1000;
      width: 80vw;
      max-width: 600px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -60%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }

    @media (max-width: 600px) {
      .game-container {
        padding: 10px;
        width: 95vw;
      }

      .game-board, .score-board {
        width: 90vw;
        max-width: 400px;
      }

      .win-message {
        width: 90vw;
        max-width: 400px;
      }
    }
  `]
})
export class LightsOutComponent implements OnInit, OnDestroy {
  cells: Cell[] = [];
  moves = 0;
  elapsedTime = 0;
  isGameWon = false;
  private timerInterval: any;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
  currentDifficulty: Difficulty = 'normal';
  gridSize: GridSize = { rows: 3, cols: 3 };
  highScores: Record<Difficulty, GameScore | null> = {
    easy: null,
    normal: null,
    hard: null
  };

  constructor(private settingsService: SettingsService) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  ngOnInit(): void {
    this.loadHighScores();
    this.initializeGame();
  }

  private loadHighScores(): void {
    this.difficulties.forEach(diff => {
      const score = this.settingsService.getHighScore(`lights-out-${diff}`);
      if (score) {
        this.highScores[diff] = score as GameScore;
      }
    });
  }

  private async initializeGame(): Promise<void> {
    this.cells = [];
    this.gridSize = this.getGridSize();
  
    const cellWidth = 100;  // 固定サイズ（必要に応じて調整）
    const cellHeight = 100; // 固定サイズ（必要に応じて調整）
  
    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.gridSize.cols; col++) {
        // 透過画像を直接生成
        const cellImage = this.createCellImage(cellWidth, cellHeight);
  
        this.cells.push({
          isBlurred: true,
          row,
          col,
          transparentImage: cellImage
        });
      }
    }
  
    this.moves = 0;
    this.elapsedTime = 0;
    this.isGameWon = false;
    this.startTimer();
  }

  private createCellImage(width: number, height: number): string {
    // 新しいキャンバスを作成
    const cellCanvas = document.createElement('canvas');
    cellCanvas.width = width;
    cellCanvas.height = height;
    const cellCtx = cellCanvas.getContext('2d')!;

    // 透過効果を適用 (透明度50%)
    cellCtx.fillStyle = 'rgba(102, 102, 102, 0.93)';
    cellCtx.fillRect(0, 0, width, height);

    // データURLとして返す
    return cellCanvas.toDataURL('image/png');
  }

  private getGridSize(): GridSize {
    switch (this.currentDifficulty) {
      case 'easy': return { rows: 3, cols: 3 };
      case 'normal': return { rows: 4, cols: 4 };
      case 'hard': return { rows: 5, cols: 5 };
      default: return { rows: 3, cols: 3 };
    }
  }

  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      if (!this.isGameWon) {
        this.elapsedTime++;
      }
    }, 1000);
  }

  toggleCell(cell: Cell): void {
    if (this.isGameWon) return;

    const index = this.cells.findIndex(c => c.row === cell.row && c.col === cell.col);
    if (index === -1) return;

    this.cells = this.cells.map(c => {
      if (
        (c.row === cell.row && c.col === cell.col) || // クリックしたマス
        (c.row === cell.row - 1 && c.col === cell.col) || // 上
        (c.row === cell.row + 1 && c.col === cell.col) || // 下
        (c.row === cell.row && c.col === cell.col - 1) || // 左
        (c.row === cell.row && c.col === cell.col + 1) // 右
      ) {
        return { ...c, isBlurred: !c.isBlurred };
      }
      return c;
    });

    this.moves++;
    this.checkWinCondition();
  }

  private checkWinCondition(): void {
    const allUnblurred = this.cells.every(cell => !cell.isBlurred);
    if (allUnblurred) {
      this.isGameWon = true;
      clearInterval(this.timerInterval);
      this.updateHighScore();
    }
  }

  private updateHighScore(): void {
    const currentScore: GameScore = {
      moves: this.moves,
      time: this.elapsedTime,
      date: new Date().toLocaleString(),
      clearCount: (this.highScores[this.currentDifficulty]?.clearCount || 0) + 1
    };

    const currentHighScore = this.highScores[this.currentDifficulty];
    if (!currentHighScore || this.moves < currentHighScore.moves) {
      this.highScores[this.currentDifficulty] = currentScore;
      this.settingsService.updateHighScore(
        `lights-out-${this.currentDifficulty}`,
        currentScore
      );
    } else {
      // スコアは更新しないが、クリア回数は更新
      this.highScores[this.currentDifficulty] = {
        ...currentHighScore,
        clearCount: currentScore.clearCount
      };
      this.settingsService.updateHighScore(
        `lights-out-${this.currentDifficulty}`,
        this.highScores[this.currentDifficulty]!
      );
    }
  }

  changeDifficulty(difficulty: Difficulty): void {
    if (this.currentDifficulty !== difficulty) {
      this.currentDifficulty = difficulty;
      this.initializeGame();
    }
  }

  getDifficultyLabel(difficulty: Difficulty): string {
    switch (difficulty) {
      case 'easy': return '初級';
      case 'normal': return '中級';
      case 'hard': return '上級';
      default: return '';
    }
  }

  getBackgroundImage(): string {
    return `assets/games/lights-out/lightsOut_${this.currentDifficulty}_01.png`;
  }

  resetGame(): void {
    this.initializeGame();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
} 