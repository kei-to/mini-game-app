import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeComponent } from './home.component';
import { provideHttpClient } from '@angular/common/http';
import { SoundService } from '../services/sound.service';
import { BgmService } from '../services/bgm.service';
import { BackgroundService } from '../services/background.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let soundService: { initialize: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn> };
  let bgmService: { initialize: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    soundService = { initialize: vi.fn().mockResolvedValue(undefined), play: vi.fn() };
    bgmService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      play: vi.fn(),
      stop: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SoundService, useValue: soundService },
        { provide: BgmService, useValue: bgmService },
        {
          provide: BackgroundService,
          useValue: { getBackgroundPath: vi.fn().mockReturnValue('/assets/backgrounds/home_bg.png') }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the home background while audio services are still initializing', () => {
    soundService.initialize.mockReturnValue(new Promise(() => {}));
    bgmService.initialize.mockReturnValue(new Promise(() => {}));

    fixture.detectChanges();

    const homeContainer = fixture.nativeElement.querySelector('.home-container');
    expect(homeContainer.style.backgroundImage).toContain('/assets/backgrounds/home_bg.png');
  });
});
