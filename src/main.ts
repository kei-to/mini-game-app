import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeJa from '@angular/common/locales/ja';
import { SoundService } from './app/services/sound.service';
import { BgmService } from './app/services/bgm.service';
import { inject, provideAppInitializer } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './app/services/auth.interceptor';
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
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAppInitializer(() => {
        const initializerFn = (initializeServices)(inject(SoundService), inject(BgmService));
        return initializerFn();
      })
  ]
}).catch(err => console.error(err));