import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeJa from '@angular/common/locales/ja';
import { SoundService } from './app/services/sound.service';
import { BgmService } from './app/services/bgm.service';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import 'zone.js';

registerLocaleData(localeJa);

// サービス初期化用のファクトリー関数
function initializeServices(soundService: SoundService, bgmService: BgmService) {
  return async () => {
    try {
      await soundService.initialize();
      await bgmService.initialize();
    } catch (error) {
      console.warn('Service initialization failed:', error);
    }
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(HttpClientModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeServices,
      deps: [SoundService, BgmService],
      multi: true
    }
  ]
}).catch(err => console.error(err));