import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-game-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" [@backdropAnimation]="isOpen ? 'open' : 'closed'" (click)="onBackdropClick()">
      <div class="modal-container" [@modalAnimation]="isOpen ? 'open' : 'closed'" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="close-button" (click)="onClose()">×</button>
        </div>
        <div class="modal-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      color: #666;
    }

    .close-button:hover {
      color: #000;
    }

    .modal-content {
      min-height: 200px;
    }
  `],
  animations: [
    trigger('backdropAnimation', [
      state('closed', style({
        opacity: 0,
        visibility: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        visibility: 'visible'
      })),
      transition('closed <=> open', [
        animate('0.2s ease-in-out')
      ])
    ]),
    trigger('modalAnimation', [
      state('closed', style({
        opacity: 0,
        transform: 'scale(0.8)'
      })),
      state('open', style({
        opacity: 1,
        transform: 'scale(1)'
      })),
      transition('closed <=> open', [
        animate('0.3s ease-in-out')
      ])
    ])
  ]
})
export class GameModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }
} 