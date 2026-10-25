class SoundManager {
  private ctx: AudioContext | null = null;
  private bgGain: GainNode | null = null;
  private isBgPlaying = false;
  private bgTimer: any = null;
  private soundEnabled = true;
  private volume = 0.7;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSettings(enabled: boolean, volume: number) {
    this.soundEnabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.bgGain && this.ctx) {
      this.bgGain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
    }
  }

  public playClick() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playCorrect() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.07);
        gain.gain.linearRampToValueAtTime(this.volume * 0.35, this.ctx.currentTime + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.07);
        osc.stop(this.ctx.currentTime + idx * 0.07 + 0.3);
      });
    } catch {}
  }

  public playIncorrect() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  public playCountdown(isGo = false) {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'triangle' : 'sine';
      const freq = isGo ? 880 : 440;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.3);
      }

      gain.gain.setValueAtTime(this.volume * (isGo ? 0.45 : 0.3), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (isGo ? 0.35 : 0.15));
    } catch {}
  }

  public playVictory() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const chord = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.5, t: 0.35 },
        { f: 1318.51, t: 0.5 },
      ];

      chord.forEach(({ f, t }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + t);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(this.volume * 0.4, this.ctx.currentTime + t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + t);
        osc.stop(this.ctx.currentTime + t + 0.6);
      });
    } catch {}
  }

  // Synthesized gentle playful background music
  public startBgMusic() {
    if (this.isBgPlaying) return;
    this.isBgPlaying = true;
    this.initCtx();
    if (!this.ctx) return;

    this.bgGain = this.ctx.createGain();
    this.bgGain.gain.setValueAtTime(this.volume * 0.12, this.ctx.currentTime);
    this.bgGain.connect(this.ctx.destination);

    const melody = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];
    let noteIdx = 0;

    const playNextNote = () => {
      if (!this.isBgPlaying || !this.ctx || !this.bgGain) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(melody[noteIdx % melody.length], this.ctx.currentTime);
      noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(noteGain);
      noteGain.connect(this.bgGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);

      noteIdx++;
      this.bgTimer = setTimeout(playNextNote, 480);
    };

    playNextNote();
  }

  public stopBgMusic() {
    this.isBgPlaying = false;
    if (this.bgTimer) {
      clearTimeout(this.bgTimer);
      this.bgTimer = null;
    }
    if (this.bgGain && this.ctx) {
      this.bgGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    }
  }
}

export const sound = new SoundManager();
