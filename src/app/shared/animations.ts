// animations.ts
import { trigger, state, style, transition, animate } from '@angular/animations';

export const buttonPressAnimation = trigger('buttonPress', [
  state('idle', style({ transform: 'scale(1)' })),
  state('pressed', style({ transform: 'scale(0.95)' })),
  transition('idle <=> pressed', [
    animate('100ms ease-in-out')
  ])
]);
