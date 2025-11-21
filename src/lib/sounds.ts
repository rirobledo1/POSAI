// src/lib/sounds.ts
export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private constructor() {
    // Cargar preferencia del localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos-sound-enabled');
      this.enabled = saved ? JSON.parse(saved) : true;
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext!;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos-sound-enabled', JSON.stringify(enabled));
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Sonido al agregar producto al carrito
  playAddToCart() {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Sonido agradable tipo "ding"
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }

  // Sonido de error
  playError() {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Sonido de error más grave
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }

  // Sonido de éxito
  playSuccess() {
    if (!this.enabled) return;
    
    try {
      const ctx = this.getAudioContext();
      
      // Crear dos tonos para un sonido más alegre
      [1, 2].forEach((i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const baseFreq = i === 1 ? 600 : 800;
        oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime + (i - 1) * 0.1);
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime + (i - 1) * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i - 1) * 0.1 + 0.15);

        oscillator.start(ctx.currentTime + (i - 1) * 0.1);
        oscillator.stop(ctx.currentTime + (i - 1) * 0.1 + 0.15);
      });
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }
}

export const soundManager = SoundManager.getInstance();
