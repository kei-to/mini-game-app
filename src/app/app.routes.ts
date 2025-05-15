import { Routes } from '@angular/router';
import { GameSelectComponent } from './game-select/game-select.component';
import { GalleryComponent } from './gallery/gallery.component';
import { HomeComponent } from './home/home.component';
import { ConfigComponent } from './config/config.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game-select', component: GameSelectComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'config', component: ConfigComponent },
  { path: '**', redirectTo: '' }
];