export type SoundEffect = 
  | 'button_click'
  | 'city_founded'
  | 'unit_built'
  | 'combat_attack'
  | 'combat_defend'
  | 'technology_discovered'
  | 'turn_warning'
  | 'victory'
  | 'defeat'
  | 'notification'
  | 'trade_route'
  | 'wonder_built'
  | 'religious_spread';

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  enabled: boolean;
}

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  enabled: true,
};

const SOUND_BASE_PATHS: Record<SoundEffect, string> = {
  button_click: '/audio/sfx/click.mp3',
  city_founded: '/audio/sfx/city_found.mp3',
  unit_built: '/audio/sfx/unit_built.mp3',
  combat_attack: '/audio/sfx/attack.mp3',
  combat_defend: '/audio/sfx/attack.mp3',
  technology_discovered: '/audio/sfx/tech.mp3',
  turn_warning: '/audio/sfx/warning.mp3',
  victory: '/audio/sfx/victory.mp3',
  defeat: '/audio/sfx/defeat.mp3',
  notification: '/audio/sfx/notification.mp3',
  trade_route: '/audio/sfx/click.mp3',
  wonder_built: '/audio/sfx/victory.mp3',
  religious_spread: '/audio/sfx/notification.mp3',
};

export class AudioSystem {
  private config: AudioConfig;
  private audioContext: AudioContext | null = null;
  private loadedSounds: Map<SoundEffect, AudioBuffer> = new Map();
  private currentMusic: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private soundCache: Map<string, HTMLAudioElement> = new Map();

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = { ...DEFAULT_AUDIO_CONFIG, ...config };
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();

      this.masterGain.connect(this.audioContext.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      this.updateVolumes();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  private updateVolumes(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain) return;

    const effectiveMaster = this.isMuted ? 0 : this.config.masterVolume;
    const effectiveMusic = effectiveMaster * this.config.musicVolume;
    const effectiveSfx = effectiveMaster * this.config.sfxVolume;

    this.masterGain.gain.setValueAtTime(effectiveMaster, this.audioContext!.currentTime);
    this.musicGain.gain.setValueAtTime(effectiveMusic, this.audioContext!.currentTime);
    this.sfxGain.gain.setValueAtTime(effectiveSfx, this.audioContext!.currentTime);
  }

  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSfxVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  getMasterVolume(): number {
    return this.config.masterVolume;
  }

  getMusicVolume(): number {
    return this.config.musicVolume;
  }

  getSfxVolume(): number {
    return this.config.sfxVolume;
  }

  mute(): void {
    this.isMuted = true;
    this.updateVolumes();
  }

  unmute(): void {
    this.isMuted = false;
    this.updateVolumes();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.updateVolumes();
  }

  isMutedState(): boolean {
    return this.isMuted;
  }

  async preloadSound(effect: SoundEffect): Promise<void> {
    if (!this.audioContext || this.loadedSounds.has(effect)) return;

    try {
      const response = await fetch(SOUND_BASE_PATHS[effect]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.loadedSounds.set(effect, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound ${effect}:`, error);
    }
  }

  async preloadAllSounds(): Promise<void> {
    const soundKeys = Object.keys(SOUND_BASE_PATHS) as SoundEffect[];
    await Promise.all(soundKeys.map(sound => this.preloadSound(sound).catch(() => {})));
  }

  playSound(effect: SoundEffect): void {
    if (!this.isInitialized || !this.audioContext || this.isMuted) return;

    const cached = this.soundCache.get(effect);
    if (cached) {
      cached.currentTime = 0;
      cached.play().catch(() => this.playFallbackSound(effect));
      return;
    }

    const audio = new Audio(SOUND_BASE_PATHS[effect]);
    audio.volume = this.config.sfxVolume * this.config.masterVolume;
    
    audio.onerror = () => {
      this.playFallbackSound(effect);
    };
    
    this.soundCache.set(effect, audio);
    audio.play().catch(() => this.playFallbackSound(effect));
  }

  private playFallbackSound(effect: SoundEffect): void {
    if (!this.audioContext || this.isMuted) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain || this.audioContext.destination);

      const volume = this.config.sfxVolume * this.config.masterVolume;
      gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      switch (effect) {
        case 'button_click':
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
          oscillator.type = 'sine';
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.05);
          break;
        case 'city_founded':
        case 'victory':
          oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
          oscillator.type = 'sine';
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.3);
          break;
        case 'combat_attack':
        case 'combat_defend':
          oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
          oscillator.type = 'square';
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.1);
          break;
        case 'technology_discovered':
          oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(554, this.audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.2);
          oscillator.type = 'sine';
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.25);
          break;
        default:
          oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
          oscillator.type = 'sine';
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.1);
      }
    } catch {
      // Ignore audio errors
    }
  }

  async playSpatialSound(effect: SoundEffect): Promise<void> {
    this.playSound(effect);
  }

  async playMusic(trackUrl: string, loop: boolean = true): Promise<void> {
    if (!this.isInitialized || !this.audioContext) return;

    this.stopMusic();

    try {
      const response = await fetch(trackUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.currentMusic = this.audioContext.createBufferSource();
      this.currentMusic.buffer = audioBuffer;
      this.currentMusic.loop = loop;
      this.currentMusic.connect(this.musicGain!);
      this.currentMusic.start();
    } catch (error) {
      console.warn('Failed to play music:', error);
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch {
        // Ignore if already stopped
      }
      this.currentMusic = null;
    }
  }

  pauseMusic(): void {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch {
        // Ignore if already stopped
      }
      this.currentMusic = null;
    }
  }

  resumeMusic(): void {
    console.warn('Resume music not implemented - use playMusic');
  }

  handleVisibilityChange(): void {
    if (document.hidden && !this.isMuted) {
      this.mute();
    } else if (!document.hidden && !this.isMuted) {
      this.unmute();
    }
  }

  setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  removeVisibilityHandler(): void {
    document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('civlite_audio_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...DEFAULT_AUDIO_CONFIG, ...parsed };
        this.updateVolumes();
      }
    } catch {
      // Ignore storage errors
    }
  }

  saveToStorage(): void {
    try {
      localStorage.setItem('civlite_audio_config', JSON.stringify(this.config));
    } catch {
      // Ignore storage errors
    }
  }

  destroy(): void {
    this.stopMusic();
    this.removeVisibilityHandler();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.loadedSounds.clear();
    this.soundCache.clear();
    this.isInitialized = false;
  }
}

let audioSystemInstance: AudioSystem | null = null;

export function createAudioSystem(config?: Partial<AudioConfig>): AudioSystem {
  audioSystemInstance = new AudioSystem(config);
  return audioSystemInstance;
}

export function getAudioSystem(): AudioSystem | null {
  return audioSystemInstance;
}
