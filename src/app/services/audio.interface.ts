// audio.interface.ts
export interface AudioService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
}

export interface ISoundService extends AudioService {
  play(soundName: string): void;
}

export interface IBgmService extends AudioService {
  play(): void;
  stop(): void;
  fadeOut(duration?: number): void;
} 