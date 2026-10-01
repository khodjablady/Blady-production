/**
 * Service Audio Synthétiseur Ambiant Doux (Web Audio API)
 * 100% autonome, sans dépendance externe ni risque de coupure réseau ou CORS.
 * Génère une musique douce, apaisante et continue avec réglage précis du volume.
 */

export interface AudioPreset {
  id: string;
  name: string;
  description: string;
  chords: number[][]; // Fréquences en Hz
  bpm: number;
  filterCutoff: number;
}

// Gammes et accords harmoniques doux
export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'harmonie-sereine',
    name: 'Harmonie Sereine',
    description: 'Nappes chaudes en Fa majeur 9 / Do majeur 7, idéales pour la sérénité.',
    chords: [
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9 (F3, A3, C4, E4, G4)
      [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9 (C3, G3, B3, E4, G4)
      [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9 (D3, A3, C4, E4, A4)
      [116.54, 174.61, 220.00, 293.66, 349.23]  // Bbmaj7 (Bb2, F3, A3, D4, F4)
    ],
    bpm: 50,
    filterCutoff: 680
  },
  {
    id: 'brise-zen',
    name: 'Brise Zen & Cristalline',
    description: 'Notes douces et cloches acoustiques enveloppantes pour la concentration.',
    chords: [
      [130.81, 196.00, 261.63, 392.00, 523.25], // C pentatonique doux
      [164.81, 246.94, 329.63, 493.88, 659.25], // E min pentatonique
      [146.83, 220.00, 293.66, 440.00, 587.33], // D sus2
      [174.61, 261.63, 349.23, 523.25, 698.46]  // F sus2
    ],
    bpm: 46,
    filterCutoff: 820
  },
  {
    id: 'ondes-etherees',
    name: 'Ondes Éthérées',
    description: 'Basses profondes et nappes lentes pour un environnement de travail calme.',
    chords: [
      [110.00, 164.81, 220.00, 277.18, 329.63], // A maj7 (A2, E3, A3, C#4, E4)
      [98.00, 146.83, 196.00, 246.94, 293.66],  // G maj7 (G2, D3, G3, B3, D4)
      [123.47, 185.00, 246.94, 293.66, 369.99], // B min7 (B2, F#3, B3, D4, F#4)
      [110.00, 146.83, 196.00, 261.63, 329.63]  // D/A doux
    ],
    bpm: 42,
    filterCutoff: 600
  }
];

class AmbientAudioService {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.25; // 25% par défaut (très doux)
  private currentPresetId: string = 'harmonie-sereine';
  private chordIndex: number = 0;
  private chordTimer: number | null = null;
  private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Restaurer préférences sauvegardées
    try {
      const savedVol = localStorage.getItem('blady_audio_volume');
      if (savedVol !== null) {
        this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }
      const savedMute = localStorage.getItem('blady_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedPreset = localStorage.getItem('blady_audio_preset');
      if (savedPreset && AUDIO_PRESETS.some(p => p.id === savedPreset)) {
        this.currentPresetId = savedPreset;
      }
    } catch {
      // Ignorer si localStorage n'est pas disponible
    }
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.updateEffectiveVolume();

      // Master Lowpass Filter (adoucisseur de son, enlève les aigus agressifs)
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = this.getCurrentPreset().filterCutoff;
      this.filterNode.Q.value = 1.0;

      // Routing: Voices -> Filter -> Master Gain -> Destination
      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private getCurrentPreset(): AudioPreset {
    return AUDIO_PRESETS.find(p => p.id === this.currentPresetId) || AUDIO_PRESETS[0];
  }

  private updateEffectiveVolume() {
    if (!this.masterGain || !this.audioCtx) return;
    const target = this.isMuted ? 0 : this.volume * 0.35; // Plafond maximal doux
    this.masterGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.08);
  }

  public async start() {
    this.initAudio();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.updateEffectiveVolume();
    this.playNextChord();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.chordTimer !== null) {
      window.clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }

    // Fade out voices
    if (this.audioCtx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.15);
      setTimeout(() => {
        this.clearVoices();
      }, 300);
    } else {
      this.clearVoices();
    }

    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public setVolume(newVol: number) {
    this.volume = Math.max(0, Math.min(1, newVol));
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    this.updateEffectiveVolume();
    try {
      localStorage.setItem('blady_audio_volume', this.volume.toString());
      localStorage.setItem('blady_audio_muted', this.isMuted.toString());
    } catch {
      // Ignorer
    }
    this.notify();
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.updateEffectiveVolume();
    try {
      localStorage.setItem('blady_audio_muted', this.isMuted.toString());
    } catch {
      // Ignorer
    }
    this.notify();
  }

  public toggleMute() {
    this.setMute(!this.isMuted);
  }

  public setPreset(presetId: string) {
    if (this.currentPresetId === presetId) return;
    this.currentPresetId = presetId;
    if (this.filterNode && this.audioCtx) {
      const preset = this.getCurrentPreset();
      this.filterNode.frequency.setTargetAtTime(preset.filterCutoff, this.audioCtx.currentTime, 0.5);
    }
    try {
      localStorage.setItem('blady_audio_preset', presetId);
    } catch {
      // Ignorer
    }
    if (this.isPlaying) {
      this.playNextChord();
    }
    this.notify();
  }

  private clearVoices() {
    this.activeVoices.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Ignorer
      }
    });
    this.activeVoices = [];
  }

  private playNextChord() {
    if (!this.isPlaying || !this.audioCtx || !this.filterNode) return;

    const preset = this.getCurrentPreset();
    const chordFrequencies = preset.chords[this.chordIndex % preset.chords.length];
    this.chordIndex++;

    const now = this.audioCtx.currentTime;
    const chordDurationSeconds = 60 / preset.bpm * 4.5; // ~5.4 à 6.4 secondes par accord
    const attackTime = 2.2;
    const releaseTime = 3.2;

    // Atténuer doucement les voix précédentes sans couper brusquement
    const oldVoices = [...this.activeVoices];
    oldVoices.forEach(({ gain }) => {
      gain.gain.setTargetAtTime(0, now, releaseTime / 3);
    });

    setTimeout(() => {
      oldVoices.forEach(({ osc, gain }) => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignorer
        }
      });
    }, releaseTime * 1000);

    const newVoices: { osc: OscillatorNode; gain: GainNode }[] = [];

    // Synthétiser chaque note de l'accord avec 2 oscillateurs légèrement désaccordés pour un effet de nappe chaude (chorus doux)
    chordFrequencies.forEach((freq, idx) => {
      if (!this.audioCtx || !this.filterNode) return;

      const isBass = idx === 0;
      const baseNoteVolume = isBass ? 0.22 : 0.12;

      // Oscillateur principal (onde sinusoïdale pure et ronde)
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = isBass ? 'sine' : 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      // Oscillateur secondaire (léger detune de +2 cents pour l'espace et la chaleur)
      const osc2 = this.audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      const voiceGain = this.audioCtx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, now);
      // Fade in doux
      voiceGain.gain.exponentialRampToValueAtTime(baseNoteVolume, now + attackTime);
      // Fade out progressif
      voiceGain.gain.setTargetAtTime(0.0001, now + chordDurationSeconds - releaseTime, releaseTime / 2);

      osc1.connect(voiceGain);
      osc2.connect(voiceGain);
      voiceGain.connect(this.filterNode);

      osc1.start(now);
      osc2.start(now);

      newVoices.push({ osc: osc1, gain: voiceGain });
      newVoices.push({ osc: osc2, gain: voiceGain });
    });

    // Ajouter une note cristalline tintante aléatoire très douce dans les aigus
    const chimeFreq = chordFrequencies[Math.floor(Math.random() * chordFrequencies.length)] * 2;
    if (chimeFreq > 300 && chimeFreq < 1200) {
      const chimeOsc = this.audioCtx.createOscillator();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(chimeFreq, now + 1.2);

      const chimeGain = this.audioCtx.createGain();
      chimeGain.gain.setValueAtTime(0.0001, now + 1.2);
      chimeGain.gain.exponentialRampToValueAtTime(0.04, now + 1.6);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.filterNode);

      chimeOsc.start(now + 1.2);
      chimeOsc.stop(now + 4.5);
      newVoices.push({ osc: chimeOsc, gain: chimeGain });
    }

    this.activeVoices = newVoices;

    // Planifier le prochain accord
    if (this.chordTimer !== null) {
      window.clearTimeout(this.chordTimer);
    }
    this.chordTimer = window.setTimeout(() => {
      this.playNextChord();
    }, (chordDurationSeconds - 1.2) * 1000);
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      effectiveVolume: this.isMuted ? 0 : this.volume,
      currentPreset: this.getCurrentPreset(),
      presets: AUDIO_PRESETS
    };
  }
}

export const ambientAudioService = new AmbientAudioService();
