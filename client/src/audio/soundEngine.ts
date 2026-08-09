// Web Audio API Sound Synthesizer for AAA audio feedback without external file dependencies
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private tensionInterval: NodeJS.Timeout | null = null;
  private isAmbientPlaying = false;
  private isTensionActive = false;

  private settings = {
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    isMuted: false,
    ambientMusicEnabled: true
  };

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.musicGain.connect(this.masterGain);
        this.updateVolumes();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(newSettings: Partial<typeof SoundEngine.prototype.settings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.updateVolumes();

    if (this.settings.ambientMusicEnabled && !this.isAmbientPlaying && !this.settings.isMuted) {
      this.startAmbientDrone();
    } else if ((!this.settings.ambientMusicEnabled || this.settings.isMuted) && this.isAmbientPlaying) {
      this.stopAmbientDrone();
    }
  }

  private updateVolumes() {
    if (!this.masterGain || !this.musicGain) return;
    const finalMaster = this.settings.isMuted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setValueAtTime(finalMaster, this.ctx?.currentTime || 0);
    
    // Lower ambient music during check tension
    const musicLevel = this.isTensionActive ? this.settings.musicVolume * 0.25 : this.settings.musicVolume;
    this.musicGain.gain.setValueAtTime(musicLevel, this.ctx?.currentTime || 0);
  }

  private getEffectiveSfxGain(volumeMultiplier = 1.0): number {
    if (this.settings.isMuted) return 0;
    return this.settings.masterVolume * this.settings.sfxVolume * volumeMultiplier;
  }

  // Set Tension Mode during Check state
  public setTensionMode(active: boolean) {
    if (this.isTensionActive === active) return;
    this.isTensionActive = active;
    this.updateVolumes();

    if (active) {
      this.playTensionPulse();
      this.tensionInterval = setInterval(() => this.playTensionPulse(), 1200);
    } else {
      if (this.tensionInterval) {
        clearInterval(this.tensionInterval);
        this.tensionInterval = null;
      }
    }
  }

  // Low bass tension heartbeat pulse
  public playTensionPulse() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now); // Low thud
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    gain.gain.setValueAtTime(this.getEffectiveSfxGain(0.5), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Play Move Sound
  public playMove() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(this.getEffectiveSfxGain(0.7), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Play Capture Sound
  public playCapture() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain1.gain.setValueAtTime(this.getEffectiveSfxGain(0.9), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain2.gain.setValueAtTime(this.getEffectiveSfxGain(0.6), now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.1);
  }

  // Play Castle Sound
  public playCastle() {
    this.playMove();
    setTimeout(() => this.playMove(), 90);
  }

  // Play Check Alarm
  public playCheck() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(this.getEffectiveSfxGain(0.8), now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  // Play Checkmate / Victory Fanfare
  public playCheckmate() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25];

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const delay = idx * 0.06;
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(this.getEffectiveSfxGain(0.7), now + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 1.8);
    });
  }

  // Play Timer Tick
  public playTick() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    gain.gain.setValueAtTime(this.getEffectiveSfxGain(0.15), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // UI Hover sound
  public playHover() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.02);

    gain.gain.setValueAtTime(this.getEffectiveSfxGain(0.08), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  // UI Click sound
  public playClick() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(this.getEffectiveSfxGain(0.25), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Ambient Drone Synth
  public startAmbientDrone() {
    this.initCtx();
    if (!this.ctx || !this.musicGain || this.isAmbientPlaying) return;

    try {
      const now = this.ctx.currentTime;

      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc2 = this.ctx.createOscillator();

      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(110, now);

      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(164.81, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);

      filter.connect(this.musicGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);

      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient drone start failed', e);
    }
  }

  public stopAmbientDrone() {
    if (this.ambientOsc1) {
      try { this.ambientOsc1.stop(); } catch (e) {}
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try { this.ambientOsc2.stop(); } catch (e) {}
      this.ambientOsc2 = null;
    }
    this.isAmbientPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
