/**
 * ForestWatch VR - Procedural Web Audio Sound Engine
 * Synthesizes 100% self-contained natural forest ambiances & SFX without external audio files.
 * Author: Keshav Valvii (PRN: 123B1D052)
 */

class ForestAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    
    this.isMuted = true; // start muted per browser autoplay standards
    this.volume = 0.55;
    this.isNightMode = false;
    this.isInitialized = false;

    // Generators
    this.windNode = null;
    this.birdTimer = null;
    this.cricketTimer = null;

    // Listeners for first user interaction
    this._bindUserInteraction();
  }

  _bindUserInteraction() {
    const unlock = () => {
      if (!this.isInitialized) {
        this.init();
      }
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API is not supported in this browser.');
        return;
      }
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Start procedural ambient sounds
      this._startWindAmbiance();
      this._scheduleProceduralBirds();

      this.isInitialized = true;
      this._updateUIState();
    } catch (err) {
      console.warn('Audio initialization deferred:', err);
    }
  }

  /**
   * Generates continuous filtered pink noise for tree foliage rustling and wind gusts
   */
  _startWindAmbiance() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate tree foliage leaves
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO for slow wind gusts
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second gust cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(280, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);

    whiteNoise.start();
    lfo.start();
    this.windNode = whiteNoise;
  }

  /**
   * Procedural Songbirds: Natural frequency-modulated chirps
   */
  _scheduleProceduralBirds() {
    const scheduleNext = () => {
      const nextDelay = this.isNightMode ? (12000 + Math.random() * 15000) : (3500 + Math.random() * 5000);
      this.birdTimer = setTimeout(() => {
        if (!this.isMuted && this.ctx && this.ctx.state === 'running') {
          if (!this.isNightMode) {
            this._synthesizeBirdSong();
          } else {
            this._synthesizeOwlHoot();
          }
        }
        scheduleNext();
      }, nextDelay);
    };
    scheduleNext();
  }

  _synthesizeBirdSong() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const numNotes = Math.floor(Math.random() * 4) + 2;
    const baseFreq = 2200 + Math.random() * 800;

    for (let i = 0; i < numNotes; i++) {
      const noteTime = now + (i * 0.14) + (Math.random() * 0.04);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const targetFreq = baseFreq + (Math.random() * 900 - 300);
      osc.frequency.setValueAtTime(baseFreq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, noteTime + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, noteTime + 0.12);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.04, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    }
  }

  _synthesizeOwlHoot() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * SFX 1: Tree Felling / Logging Impact
   */
  playChopSound() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // 1. Heavy wooden thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    // 2. Wood splinter crackle
    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
    noise.start(now);
    noise.stop(now + 0.28);
  }

  /**
   * SFX 2: Tree Planting & Growth Chime
   */
  playPlantSound() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Harmonic pentatonic arpeggio (C5, E5, G5, B5, C6)
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
    notes.forEach((freq, idx) => {
      const noteTime = now + (idx * 0.055);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }

  /**
   * SFX 3: Clean UI click
   */
  playClickSound() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * SFX 4: Scenario Preset Transition Sweeper
   */
  playScenarioSound() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.35);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Controls & State
   */
  toggleMute() {
    if (!this.isInitialized) {
      this.init();
      this.isMuted = false;
    } else {
      this.isMuted = !this.isMuted;
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    }

    this._updateUIState();
    return this.isMuted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  setNightMode(isNight) {
    this.isNightMode = isNight;
    const statusLabel = document.getElementById('audio-soundscape-label');
    if (statusLabel) {
      statusLabel.textContent = isNight ? 'Night Cicadas & Wind' : 'Forest Breeze & Birds';
    }
  }

  _updateUIState() {
    const toggleBtn = document.getElementById('audio-toggle-btn');
    const pulseDot = document.getElementById('audio-pulse-dot');
    const headerToggle = document.getElementById('header-audio-toggle');
    const statusLabel = document.getElementById('audio-soundscape-label');

    if (this.isMuted) {
      if (toggleBtn) toggleBtn.innerHTML = '🔇';
      if (headerToggle) headerToggle.innerHTML = '🔇 <span class="d-none d-md-inline">Audio Off</span>';
      if (pulseDot) pulseDot.classList.add('off');
      if (statusLabel) statusLabel.textContent = 'Audio Muted';
    } else {
      if (toggleBtn) toggleBtn.innerHTML = '🔊';
      if (headerToggle) headerToggle.innerHTML = '🔊 <span class="d-none d-md-inline">Audio On</span>';
      if (pulseDot) pulseDot.classList.remove('off');
      if (statusLabel) statusLabel.textContent = this.isNightMode ? 'Night Cicadas & Wind' : 'Forest Breeze & Birds';
    }
  }
}

// Global Singleton
window.ForestAudio = new ForestAudioEngine();
